// src/components/calls/infrastructure/diarization/__tests__/AssemblyAIDiarizationProvider.test.ts

import { AssemblyAIDiarizationProvider } from "../AssemblyAIDiarizationProvider";
import { AssemblyAIError } from "@/lib/config/assemblyAIConfig";

// Mock fetch global
const mockFetch = jest.fn();
const originalFetch = global.fetch;

describe("AssemblyAIDiarizationProvider", () => {
  let provider: AssemblyAIDiarizationProvider;

  beforeAll(() => {
    global.fetch = mockFetch as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Configuration de test
    process.env.ASSEMBLYAI_API_KEY = "test-api-key-12345";
    process.env.ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";

    provider = new AssemblyAIDiarizationProvider();
  });

  afterEach(() => {
    delete process.env.ASSEMBLYAI_API_KEY;
    delete process.env.ASSEMBLYAI_BASE_URL;
  });

  // ---------------------------------------------------------------------------
  // Configuration Tests
  // ---------------------------------------------------------------------------
  describe("Configuration", () => {
    it("should initialize correctly with env vars", () => {
      expect(provider).toBeInstanceOf(AssemblyAIDiarizationProvider);
      const metrics = provider.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });

    it("should require API key", () => {
      delete process.env.ASSEMBLYAI_API_KEY;
      expect(() => new AssemblyAIDiarizationProvider()).toThrow(
        "ASSEMBLYAI_API_KEY is required"
      );
    });

    it("should accept custom API key and URL", () => {
      const customProvider = new AssemblyAIDiarizationProvider(
        "custom-key",
        "https://custom.assemblyai.com/v2"
      );
      expect(customProvider).toBeInstanceOf(AssemblyAIDiarizationProvider);
    });
  });

  // ---------------------------------------------------------------------------
  // Create Transcript Tests
  // ---------------------------------------------------------------------------
  describe("Create Transcript", () => {
    it("should create transcript successfully", async () => {
      const mockTranscriptResponse = {
        id: "test-transcript-123",
        status: "queued",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranscriptResponse),
      });

      const transcriptId = await (provider as any).createTranscript(
        "https://example.com/audio.wav",
        "fr"
      );

      expect(transcriptId).toBe("test-transcript-123");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.assemblyai.com/v2/transcript",
        {
          method: "POST",
          headers: {
            Authorization: "test-api-key-12345",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio_url: "https://example.com/audio.wav",
            language_code: "fr",
            speaker_labels: true,
            utterances: true,
            language_detection: false,
          }),
        }
      );
    });

    it("should handle create transcript errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve("Invalid audio URL"),
      });

      await expect(
        (provider as any).createTranscript("invalid-url", "fr")
      ).rejects.toThrow(AssemblyAIError);
    });

    it("should handle missing transcript ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: "queued" }), // Missing ID
      });

      await expect(
        (provider as any).createTranscript(
          "https://example.com/audio.wav",
          "fr"
        )
      ).rejects.toThrow("missing transcript id");
    });
  });

  // ---------------------------------------------------------------------------
  // Polling Tests
  // ---------------------------------------------------------------------------
  describe("Polling Transcript", () => {
    it("should poll until completion", async () => {
      const mockResponses = [
        { ok: true, json: () => Promise.resolve({ status: "processing" }) },
        { ok: true, json: () => Promise.resolve({ status: "processing" }) },
        {
          ok: true,
          json: () =>
            Promise.resolve({
              status: "completed",
              audio_duration: 120,
              utterances: [
                { start: 0, end: 5000, text: "Bonjour", speaker: "A" },
                { start: 5000, end: 10000, text: "Salut", speaker: "B" },
              ],
            }),
        },
      ];

      mockFetch
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const result = await (provider as any).pollTranscript(
        "test-transcript-123",
        30000, // 30s timeout
        100 // 100ms interval
      );

      expect(result.status).toBe("completed");
      expect(result.utterances).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle processing errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "error",
            error: "Audio file corrupted",
          }),
      });

      await expect(
        (provider as any).pollTranscript("test-transcript-123", 30000, 100)
      ).rejects.toThrow("Audio file corrupted");
    });

    it("should timeout on long processing", async () => {
      // Mock une réponse qui reste en "processing"
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "processing" }),
      });

      await expect(
        (provider as any).pollTranscript("test-transcript-123", 500, 100) // 500ms timeout
      ).rejects.toThrow("polling timeout");
    });

    it("should handle HTTP errors during polling", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("Server error"),
      });

      await expect(
        (provider as any).pollTranscript("test-transcript-123", 30000, 100)
      ).rejects.toThrow("Poll transcript failed");
    });
  });

  // ---------------------------------------------------------------------------
  // Speaker Mapping Tests
  // ---------------------------------------------------------------------------
  describe("Speaker Mapping", () => {
    it("should map SPEAKER_XX format correctly", () => {
      expect((provider as any).toTurnFormat("SPEAKER_00", 0)).toBe("turn1");
      expect((provider as any).toTurnFormat("SPEAKER_01", 1)).toBe("turn2");
      expect((provider as any).toTurnFormat("SPEAKER_02", 2)).toBe("turn3");
    });

    it("should map single letter format correctly", () => {
      expect((provider as any).toTurnFormat("A", 0)).toBe("turn1");
      expect((provider as any).toTurnFormat("B", 1)).toBe("turn2");
      expect((provider as any).toTurnFormat("C", 2)).toBe("turn3");
    });

    it("should handle undefined speaker with fallback", () => {
      expect((provider as any).toTurnFormat(undefined, 0)).toBe("turn1");
      expect((provider as any).toTurnFormat(undefined, 1)).toBe("turn2");
    });

    it("should handle unknown format with fallback", () => {
      expect((provider as any).toTurnFormat("UNKNOWN_FORMAT", 5)).toBe("turn6");
    });
  });

  // ---------------------------------------------------------------------------
  // Segment Conversion Tests
  // ---------------------------------------------------------------------------
  describe("Segment Conversion", () => {
    it("should convert AssemblyAI response to segments", () => {
      const mockResult = {
        id: "test-id",
        status: "completed" as const,
        utterances: [
          { start: 0, end: 2500, text: "Bonjour", speaker: "A" },
          { start: 2500, end: 5000, text: "Salut", speaker: "B" },
          { start: 5000, end: 7500, text: "Comment ça va ?", speaker: "A" },
        ],
      };

      const segments = (provider as any).toSegments(mockResult);

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({
        start: 0,
        end: 2.5,
        speaker: "turn1",
      });
      expect(segments[1]).toEqual({
        start: 2.5,
        end: 5,
        speaker: "turn2",
      });
      expect(segments[2]).toEqual({
        start: 5,
        end: 7.5,
        speaker: "turn1",
      });
    });

    it("should handle empty utterances", () => {
      const mockResult = {
        id: "test-id",
        status: "completed" as const,
        utterances: [],
      };

      const segments = (provider as any).toSegments(mockResult);
      expect(segments).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Full Workflow Tests
  // ---------------------------------------------------------------------------
  describe("Full Workflow", () => {
    it("should complete full diarization workflow", async () => {
      // 1. Mock create transcript
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "transcript-456",
            status: "queued",
          }),
      });

      // 2. Mock polling responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: "processing" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "completed",
              audio_duration: 180, // 3 minutes
              utterances: [
                {
                  start: 0,
                  end: 3000,
                  text: "Bonjour, service client",
                  speaker: "A",
                },
                {
                  start: 3000,
                  end: 6000,
                  text: "Bonjour, j'ai un problème",
                  speaker: "B",
                },
                {
                  start: 6000,
                  end: 9000,
                  text: "Je vous écoute",
                  speaker: "A",
                },
              ],
            }),
        });

      const segments = await provider.inferSpeakers(
        "https://example.com/call-center.wav",
        { languageCode: "fr" }
      );

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({
        start: 0,
        end: 3,
        speaker: "turn1",
      });
      expect(segments[1]).toEqual({
        start: 3,
        end: 6,
        speaker: "turn2",
      });
      expect(segments[2]).toEqual({
        start: 6,
        end: 9,
        speaker: "turn1",
      });

      // Vérifier les métriques
      const metrics = provider.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.totalMinutesProcessed).toBe(3); // 180s / 60
      expect(metrics.successRate).toBe(1);
    });

    it("should handle workflow failures and update metrics", async () => {
      // Mock create transcript failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve("Invalid API key"),
      });

      await expect(
        provider.inferSpeakers("https://example.com/test.wav")
      ).rejects.toThrow(AssemblyAIError);

      // Vérifier les métriques d'échec
      const metrics = provider.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.successRate).toBe(0);
    });

    it("should handle realistic call center scenario", async () => {
      // Mock realistic call center response
      const realisticResponse = {
        id: "call-center-789",
        status: "completed" as const,
        audio_duration: 300, // 5 minutes
        utterances: [
          {
            start: 0,
            end: 4000,
            text: "Bonjour, vous appelez le service client",
            speaker: "SPEAKER_00",
          },
          {
            start: 4000,
            end: 7000,
            text: "Bonjour, j'ai un problème avec ma facture",
            speaker: "SPEAKER_01",
          },
          {
            start: 7000,
            end: 12000,
            text: "Je vais vérifier votre dossier, pouvez-vous me donner votre numéro de client",
            speaker: "SPEAKER_00",
          },
          {
            start: 12000,
            end: 15000,
            text: "Oui c'est le 123456",
            speaker: "SPEAKER_01",
          },
          {
            start: 15000,
            end: 20000,
            text: "Parfait, je vois votre dossier. Quel est le problème exactement",
            speaker: "SPEAKER_00",
          },
        ],
      };

      // Mock create + polling
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ id: "call-center-789", status: "queued" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(realisticResponse),
        });

      const segments = await provider.inferSpeakers(
        "https://example.com/realistic-call.wav",
        {
          languageCode: "fr",
          timeoutMs: 60000,
          pollIntervalMs: 1000,
        }
      );

      expect(segments).toHaveLength(5);

      // Vérifier l'alternance conseiller/client
      expect(segments[0].speaker).toBe("turn1"); // Conseiller
      expect(segments[1].speaker).toBe("turn2"); // Client
      expect(segments[2].speaker).toBe("turn1"); // Conseiller
      expect(segments[3].speaker).toBe("turn2"); // Client
      expect(segments[4].speaker).toBe("turn1"); // Conseiller

      // Vérifier la durée totale
      expect(segments[segments.length - 1].end).toBe(20); // 20 secondes

      const metrics = provider.getMetrics();
      expect(metrics.totalMinutesProcessed).toBe(5); // 300s / 60
      expect(metrics.totalCost).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Metrics Tests
  // ---------------------------------------------------------------------------
  describe("Metrics", () => {
    it("should track metrics correctly", () => {
      const initialMetrics = provider.getMetrics();
      expect(initialMetrics.totalRequests).toBe(0);
      expect(initialMetrics.successRate).toBe(0);
      expect(initialMetrics.totalCost).toBe(0);
    });

    it("should update success metrics", async () => {
      await (provider as any).updateMetrics(true, 5000, 120); // 5s processing, 2min audio

      const metrics = provider.getMetrics();
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.totalMinutesProcessed).toBe(2);
      expect(metrics.averageProcessingTime).toBe(5000);
      expect(metrics.totalCost).toBeGreaterThan(0);
    });

    it("should calculate success rate correctly", async () => {
      await (provider as any).updateMetrics(true, 3000, 60);
      await (provider as any).updateMetrics(false, 2000);
      await (provider as any).updateMetrics(true, 4000, 90);

      const metrics = provider.getMetrics();
      expect(metrics.successfulRequests).toBe(2);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.successRate).toBeCloseTo(0.667, 3);
    });

    it("should reset metrics", () => {
      provider.resetMetrics();
      const metrics = provider.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.totalCost).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Health Check Tests
  // ---------------------------------------------------------------------------
  describe("Health Check", () => {
    it("should return healthy status when API is accessible", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const health = await provider.healthCheck();
      expect(health.status).toBe("healthy");
      expect(health.error).toBeUndefined();
    });

    it("should return unhealthy status on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const health = await provider.healthCheck();
      expect(health.status).toBe("unhealthy");
      expect(health.error).toBe("HTTP 503");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const health = await provider.healthCheck();
      expect(health.status).toBe("unhealthy");
      expect(health.error).toBe("Network error");
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------
  describe("Error Handling", () => {
    it("should create proper AssemblyAIError", () => {
      const error = new AssemblyAIError("Test message", "TEST_CODE", 400);
      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("AssemblyAIError");
    });

    it("should handle network timeouts gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Request timeout"));

      await expect(
        provider.inferSpeakers("https://example.com/test.wav")
      ).rejects.toThrow("Request timeout");

      const metrics = provider.getMetrics();
      expect(metrics.failedRequests).toBe(1);
    });

    it("should handle malformed responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Malformed JSON")),
      });

      await expect(
        provider.inferSpeakers("https://example.com/test.wav")
      ).rejects.toThrow(AssemblyAIError);
    });
  });

  // ---------------------------------------------------------------------------
  // Integration with Options Tests
  // ---------------------------------------------------------------------------
  describe("Options Handling", () => {
    it("should use default options when none provided", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: "test-123", status: "queued" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "completed",
              utterances: [],
            }),
        });

      await provider.inferSpeakers("https://example.com/test.wav");

      // Vérifier que les paramètres par défaut ont été utilisés
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/transcript"),
        expect.objectContaining({
          body: expect.stringContaining('"language_code":"fr"'),
        })
      );
    });

    it("should use custom options when provided", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: "test-456", status: "queued" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "completed",
              utterances: [],
            }),
        });

      await provider.inferSpeakers("https://example.com/test.wav", {
        languageCode: "en",
        timeoutMs: 120000,
        pollIntervalMs: 5000,
      });

      // Vérifier que les paramètres customisés ont été utilisés
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/transcript"),
        expect.objectContaining({
          body: expect.stringContaining('"language_code":"en"'),
        })
      );
    });
  });
});

// -----------------------------------------------------------------------------
// Tests d'intégration réalistes
// -----------------------------------------------------------------------------
describe("AssemblyAI Integration Tests", () => {
  let provider: AssemblyAIDiarizationProvider;

  beforeAll(() => {
    global.fetch = mockFetch as any;
    process.env.ASSEMBLYAI_API_KEY = "integration-test-key";
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.ASSEMBLYAI_API_KEY;
  });

  beforeEach(() => {
    provider = new AssemblyAIDiarizationProvider();
    jest.clearAllMocks();
  });

  it("should handle complex multi-speaker conversation", async () => {
    const complexConversation = {
      id: "complex-789",
      status: "completed" as const,
      audio_duration: 480, // 8 minutes
      utterances: [
        {
          start: 0,
          end: 3000,
          text: "Bonjour, service technique",
          speaker: "A",
        },
        {
          start: 3000,
          end: 8000,
          text: "Bonjour, j'ai un problème avec mon internet qui ne fonctionne plus depuis ce matin",
          speaker: "B",
        },
        {
          start: 8000,
          end: 12000,
          text: "Je vais vous aider. Pouvez-vous me dire quel type de box vous avez",
          speaker: "A",
        },
        { start: 12000, end: 15000, text: "C'est une Livebox 5", speaker: "B" },
        {
          start: 15000,
          end: 20000,
          text: "Parfait. Avez-vous essayé de redémarrer votre box",
          speaker: "A",
        },
        {
          start: 20000,
          end: 25000,
          text: "Euh non, comment on fait ça exactement",
          speaker: "B",
        },
        {
          start: 25000,
          end: 35000,
          text: "Il faut débrancher l'alimentation pendant 10 secondes puis la rebrancher",
          speaker: "A",
        },
        {
          start: 35000,
          end: 38000,
          text: "D'accord je vais essayer",
          speaker: "B",
        },
      ],
    };

    // Mock responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "complex-789", status: "queued" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: "processing" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(complexConversation),
      });

    const segments = await provider.inferSpeakers(
      "https://example.com/complex-support-call.wav"
    );

    expect(segments).toHaveLength(8);

    // Vérifier l'alternance conseiller/client correcte
    const speakers = segments.map((s) => s.speaker);
    expect(speakers).toEqual([
      "turn1",
      "turn2",
      "turn1",
      "turn2",
      "turn1",
      "turn2",
      "turn1",
      "turn2",
    ]);

    // Vérifier que les durées sont cohérentes
    segments.forEach((segment, index) => {
      if (index > 0) {
        expect(segment.start).toBe(segments[index - 1].end);
      }
    });

    const metrics = provider.getMetrics();
    expect(metrics.totalMinutesProcessed).toBe(8);
  });

  it("should handle edge case: single speaker", async () => {
    const singleSpeakerResponse = {
      id: "single-123",
      status: "completed" as const,
      audio_duration: 60,
      utterances: [
        {
          start: 0,
          end: 60000,
          text: "Ceci est un message d'information automatique...",
          speaker: "A",
        },
      ],
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "single-123", status: "queued" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(singleSpeakerResponse),
      });

    const segments = await provider.inferSpeakers(
      "https://example.com/announcement.wav"
    );

    expect(segments).toHaveLength(1);
    expect(segments[0].speaker).toBe("turn1");
    expect(segments[0].start).toBe(0);
    expect(segments[0].end).toBe(60);
  });
});
