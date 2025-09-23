// src/components/calls/infrastructure/asr/__tests__/OpenAIWhisperProvider.test.ts

import { OpenAIWhisperProvider } from "../OpenAIWhisperProvider";
import { TranscriptionError } from "@/lib/config/transcriptionConfig";

// --- Mock OpenAI SDK ---------------------------------------------------------
const mockOpenAI = {
  audio: {
    transcriptions: {
      create: jest.fn(),
    },
  },
};

jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAI),
  };
});

// --- Mock fetch global -------------------------------------------------------
const originalFetch = global.fetch;
const mockFetch = jest.fn();

describe("OpenAIWhisperProvider", () => {
  let provider: OpenAIWhisperProvider;

  beforeAll(() => {
    // Mock fetch pour tous les tests de ce bloc
    global.fetch = mockFetch as any;
  });

  afterAll(() => {
    // Restore fetch original
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Env & instance provider
    process.env.OPENAI_API_KEY = "sk-test-key-12345";
    provider = new OpenAIWhisperProvider();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  describe("Configuration Tests", () => {
    it("should initialize correctly", () => {
      expect(provider).toBeInstanceOf(OpenAIWhisperProvider);
      const metrics = provider.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });

    it("should require API key", () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new OpenAIWhisperProvider()).toThrow(
        "OPENAI_API_KEY is required"
      );
    });

    it("should validate API key format", () => {
      expect(() => new OpenAIWhisperProvider("invalid-key")).toThrow(
        "must start with sk-"
      );
    });
  });

  // ---------------------------------------------------------------------------
  // validateAudioFile
  // ---------------------------------------------------------------------------
  describe("File Validation Tests", () => {
    it("should validate accessible files", async () => {
      // HEAD OK
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-length": "1048576",
          "content-type": "audio/wav",
        }),
      });

      const result = await (provider as any).validateAudioFile(
        "https://example.com/test.wav"
      );

      expect(result.size).toBe(1048576);
      expect(result.type).toBe("audio/wav");
    });

    it("should reject missing files", async () => {
      // HEAD 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(
        (provider as any).validateAudioFile("https://example.com/missing.wav")
      ).rejects.toThrow(TranscriptionError);
    });

    it("should reject oversized files", async () => {
      const largeSize = 200 * 1024 * 1024; // 200MB

      // HEAD OK mais trop gros
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-length": String(largeSize),
          "content-type": "audio/wav",
        }),
      });

      await expect(
        (provider as any).validateAudioFile("https://example.com/large.wav")
      ).rejects.toThrow(/too large/i);
    });
  });

  // ---------------------------------------------------------------------------
  // downloadWithRetry
  // ---------------------------------------------------------------------------
  describe("Download Tests", () => {
    it("should download files successfully", async () => {
      const mockBlob = new Blob(["mock audio"], { type: "audio/wav" });

      // GET OK
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const metadata = {
        size: 1000,
        type: "audio/wav",
        url: "https://example.com/test.wav",
        filename: "test.wav",
      };

      const result = await (provider as any).downloadWithRetry(
        "https://example.com/test.wav",
        metadata
      );

      expect(result).toBeInstanceOf(File);
      expect(result.name).toMatch(/test.*\.wav/);
    });

    it("should handle download failures", async () => {
      jest.useFakeTimers();

      mockFetch.mockRejectedValue(new Error("Network error"));

      const metadata = {
        size: 1000,
        type: "audio/wav",
        url: "https://example.com/test.wav",
        filename: "test.wav",
      };

      const p: Promise<any> = (provider as any).downloadWithRetry(
        "https://example.com/test.wav",
        metadata
      );

      // ⚠️ Avec les fake timers, on vide la file correctement
      // pour laisser s'exécuter tous les backoffs/awaits
      await jest.runOnlyPendingTimersAsync();
      await jest.runAllTimersAsync();

      // ✅ assertions robustes : classe, code, message
      await expect(p).rejects.toBeInstanceOf(TranscriptionError);
      await expect(p).rejects.toMatchObject({ code: "DOWNLOAD_FAILED" });
      await expect(p).rejects.toThrow(/Failed to download/i);

      jest.useRealTimers();
    });
  });

  // ---------------------------------------------------------------------------
  // callWhisperAPI
  // ---------------------------------------------------------------------------
  describe("Whisper API Tests", () => {
    it("should call API with correct parameters", async () => {
      const mockResponse = {
        text: "Bonjour, comment allez-vous ?",
        language: "fr",
        duration: 3.5,
        segments: [
          {
            id: 0,
            start: 0.0,
            end: 3.5,
            text: "Bonjour, comment allez-vous ?",
            words: [
              { word: "Bonjour", start: 0.0, end: 0.8, probability: 0.99 },
              { word: "comment", start: 1.0, end: 1.5, probability: 0.97 },
            ],
          },
        ],
      };

      mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce(
        mockResponse
      );

      const file = new File(["test"], "test.wav", { type: "audio/wav" });
      const result = await (provider as any).callWhisperAPI(file, {
        temperature: 0.1,
      });

      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith({
        file: expect.any(File),
        model: "whisper-1",
        language: "fr",
        response_format: "verbose_json",
        temperature: 0.1,
      });

      expect(result).toEqual(mockResponse);
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      (error as any).error = {
        type: "invalid_request_error",
        message: "File corrupted",
      };

      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(error);

      const file = new File(["bad"], "bad.wav", { type: "audio/wav" });

      await expect((provider as any).callWhisperAPI(file, {})).rejects.toThrow(
        /OpenAI API Error/i
      );
    });
  });

  // ---------------------------------------------------------------------------
  // processWhisperResponse
  // ---------------------------------------------------------------------------
  describe("Response Processing Tests", () => {
    it("should process valid responses", async () => {
      const rawResponse = {
        text: "Test transcription",
        language: "fr",
        duration: 2.0,
        segments: [
          {
            id: 0,
            start: 0.0,
            end: 2.0,
            text: "Test transcription",
            words: [
              { word: "Test", start: 0.0, end: 0.5, probability: 0.99 },
              {
                word: "transcription",
                start: 0.6,
                end: 2.0,
                probability: 0.98,
              },
            ],
          },
        ],
      };

      const metadata = { size: 1000, type: "audio/wav", url: "test.wav" };
      const result = await (provider as any).processWhisperResponse(
        rawResponse,
        metadata
      );

      expect(result.text).toBe("Test transcription");
      expect(result.segments).toHaveLength(1);
      expect(result.words).toHaveLength(2);
    });

    it("should handle empty responses", async () => {
      const rawResponse = { text: "", segments: [] };
      const metadata = { size: 1000, type: "audio/wav", url: "test.wav" };

      await expect(
        (provider as any).processWhisperResponse(rawResponse, metadata)
      ).rejects.toThrow(/No transcription text received/i);
    });
  });

  // ---------------------------------------------------------------------------
  // Flux complet
  // ---------------------------------------------------------------------------
  describe("Full Workflow Tests", () => {
    it("should complete transcription workflow", async () => {
      // HEAD OK
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({
            "content-length": "1048576",
            "content-type": "audio/wav",
          }),
        })
        // GET OK (download)
        .mockResolvedValueOnce({
          ok: true,
          blob: () =>
            Promise.resolve(new Blob(["audio data"], { type: "audio/wav" })),
        });

      // Whisper OK
      const whisperResponse = {
        text: "Bonjour, je peux vous aider ?",
        language: "fr",
        duration: 2.5,
        segments: [
          {
            id: 0,
            start: 0.0,
            end: 2.5,
            text: "Bonjour, je peux vous aider ?",
            words: [
              { word: "Bonjour", start: 0.0, end: 0.5, probability: 0.99 },
              { word: "je", start: 0.6, end: 0.8, probability: 0.98 },
            ],
          },
        ],
      };

      mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce(
        whisperResponse
      );

      const result = await provider.transcribeAudio(
        "https://example.com/test.wav"
      );

      expect(result.text).toBe("Bonjour, je peux vous aider ?");
      expect(result.language).toBe("fr");
      expect(result.duration).toBe(2.5);

      const metrics = provider.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
    });

    it("should handle workflow failures", async () => {
      // HEAD 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(
        provider.transcribeAudio("https://example.com/missing.wav")
      ).rejects.toThrow(TranscriptionError);

      const metrics = provider.getMetrics();
      expect(metrics.failedRequests).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------
  describe("Metrics Tests", () => {
    it("should track metrics correctly", () => {
      const initialMetrics = provider.getMetrics();
      expect(initialMetrics.totalRequests).toBe(0);
      expect(initialMetrics.successRate).toBe(0);
    });

    it("should update success metrics", async () => {
      await (provider as any).updateMetrics(true, 1000, 30); // 30s

      const metrics = provider.getMetrics();
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.totalMinutesProcessed).toBe(0.5);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0); // EMA
    });

    it("should calculate success rate", async () => {
      await (provider as any).updateMetrics(true, 1000, 30);
      await (provider as any).updateMetrics(false, 1500);

      const metrics = provider.getMetrics();
      expect(metrics.successRate).toBeCloseTo(0.5, 5);
    });

    it("should reset metrics", () => {
      provider.resetMetrics();
      const metrics = provider.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });
    // -------------------------------------------------------------------------
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------
  describe("Error Handling Tests", () => {
    it("should create proper TranscriptionError", () => {
      const error = new TranscriptionError("Test message", "TEST_CODE");
      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("TranscriptionError");
    });

    it("should log errors with context", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await (provider as any).handleTranscriptionError(
        "https://example.com/test.wav",
        new Error("Test error"),
        2000
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------------
  describe("Utility Tests", () => {
    it("should extract filename from URL", () => {
      const filename = (provider as any).extractFilenameFromUrl(
        "https://example.com/path/audio-file.wav?param=1"
      );
      expect(filename).toBe("audio-file.wav");
    });

    it("should handle invalid URLs", () => {
      const filename = (provider as any).extractFilenameFromUrl("not-a-url");
      expect(filename).toBe("unknown.audio");
    });

    it("should truncate long URLs", () => {
      const longUrl = "https://example.com/" + "a".repeat(200);
      const truncated = (provider as any).truncateUrl(longUrl);
      expect(truncated.length).toBeLessThanOrEqual(103);
      expect(truncated.endsWith("...")).toBe(true);
    });
  });
});

// -----------------------------------------------------------------------------
// Tests d'intégration légers (gardent leur propre cycle de vie fetch/env)
// -----------------------------------------------------------------------------
describe("OpenAIWhisperProvider Integration", () => {
  let provider: OpenAIWhisperProvider;

  beforeAll(() => {
    global.fetch = mockFetch as any;
    process.env.OPENAI_API_KEY = "sk-integration-test";
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.OPENAI_API_KEY;
  });

  beforeEach(() => {
    provider = new OpenAIWhisperProvider();
    jest.clearAllMocks();
  });

  it("should handle realistic call center scenario", async () => {
    const realisticResponse = {
      text: "Bonjour, vous appelez le service client, je suis Marie.",
      language: "fr",
      duration: 4.2,
      segments: [
        {
          id: 0,
          start: 0.0,
          end: 4.2,
          text: "Bonjour, vous appelez le service client, je suis Marie.",
          words: [
            { word: "Bonjour", start: 0.0, end: 0.5, probability: 0.99 },
            { word: "vous", start: 0.6, end: 0.8, probability: 0.98 },
            { word: "appelez", start: 0.9, end: 1.3, probability: 0.97 },
          ],
        },
      ],
    };

    // HEAD OK
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-length": "2048000",
          "content-type": "audio/wav",
        }),
      })
      // GET OK
      .mockResolvedValueOnce({
        ok: true,
        blob: () =>
          Promise.resolve(new Blob(["realistic audio"], { type: "audio/wav" })),
      });

    mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce(
      realisticResponse
    );

    const result = await provider.transcribeAudio(
      "https://example.com/call.wav"
    );

    expect(result.text).toContain("service client");
    expect(result.language).toBe("fr");
    expect(result.segments).toHaveLength(1);
  });
});
