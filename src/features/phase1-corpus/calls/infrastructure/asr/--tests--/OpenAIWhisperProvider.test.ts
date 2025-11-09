// src/components/calls/infrastructure/asr/--tests--/OpenAIWhisperProvider.test.ts

import { jest } from "@jest/globals";
import { TranscriptionError } from "@/features/phase1-corpus/calls/shared/exceptions/TranscriptionExceptions";
import { transcriptionConfig } from "@/lib/config/transcriptionConfig";

// --- Polyfills simples pour l'environnement de test ---
class TestBlob extends Blob {}
// @ts-ignore
global.Blob = TestBlob as any;

class TestFile extends TestBlob {
  name: string;
  lastModified: number;
  constructor(bits: any[], name: string, opts?: any) {
    super(bits, opts);
    this.name = name;
    this.lastModified = Date.now();
  }
}
// @ts-ignore
global.File = TestFile as any;

// --- Mock OpenAI client ---
// IMPORTANT : caster en any pour tuer les 'never'
const createMock = (jest.fn() as any).mockResolvedValue({
  text: "Hello world",
  language: "en",
  duration: 120, // 2 minutes
  segments: [],
});

jest.unstable_mockModule("openai", () => {
  return {
    default: class MockOpenAI {
      audio = {
        transcriptions: {
          create: createMock,
        },
      };
      constructor(_opts: any) {}
    },
  };
});

// IMPORTANT: importer après le mock de 'openai'
const { OpenAIWhisperProvider } = await import("../OpenAIWhisperProvider");

// Utilitaires pour mocker fetch
type MockFetchResponseInit = {
  ok: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  bodyBlobSizeKB?: number;
  contentType?: string;
};

// On renvoie 'any' pour éviter 'Response' vs 'never'
function makeFetchResponse(init: MockFetchResponseInit): any {
  const {
    ok,
    status = ok ? 200 : 500,
    statusText = ok ? "OK" : "ERR",
    headers = {},
    bodyBlobSizeKB = 50,
    contentType = "audio/wav",
  } = init;

  const hdrs = new Map<string, string>(Object.entries(headers));
  const resp: any = {
    ok,
    status,
    statusText,
    headers: {
      get: (k: string) => {
        const key = k.toLowerCase();
        if (key === "content-length") {
          return hdrs.get("content-length") ?? String(bodyBlobSizeKB * 1024);
        }
        if (key === "content-type") {
          return hdrs.get("content-type") ?? contentType;
        }
        return hdrs.get(k) ?? null;
      },
    },
    blob: async () =>
      new TestBlob([new Uint8Array(bodyBlobSizeKB * 1024)], {
        type: contentType,
      }),
  };
  return resp;
}

describe("OpenAIWhisperProvider", () => {
  const ORIG_ENV = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...ORIG_ENV, OPENAI_API_KEY: "sk-test-key" };
  });

  afterAll(() => {
    process.env = ORIG_ENV;
  });

  test("transcribeAudio - success path (HEAD ok, GET ok, OpenAI ok)", async () => {
    // HEAD ok + GET ok
    const fetchMock = jest.fn() as any;

    fetchMock
      // HEAD
      .mockResolvedValueOnce(
        makeFetchResponse({
          ok: true,
          headers: {
            "content-length": String(40 * 1024), // 40KB
            "content-type": "audio/wav",
          },
        })
      )
      // GET
      .mockResolvedValueOnce(
        makeFetchResponse({
          ok: true,
          bodyBlobSizeKB: 40,
          contentType: "audio/wav",
        })
      );

    // @ts-ignore
    global.fetch = fetchMock;

    const provider = new OpenAIWhisperProvider();
    const result = await provider.transcribeAudio(
      "https://example.com/audio/test.wav"
    );

    expect(result.text).toBe("Hello world");
    expect(result.duration).toBe(120);
    expect(result.language).toBeDefined();

    // Vérifie qu'on a bien appelé l'API OpenAI
    expect(createMock).toHaveBeenCalledTimes(1);

    // Vérifie que HEAD puis GET ont été appelés dans cet ordre
    const call0Init = (fetchMock.mock.calls[0][1] || {}) as RequestInit;
    expect(call0Init.method).toBe("HEAD");

    const call1Init = fetchMock.mock.calls[1][1];
    expect(call1Init).toBeUndefined(); // GET par défaut
  });

  test('transcribeAudio - download fails after retries → "Failed to download"', async () => {
    // Réduit la durée des retries pour accélérer le test
    const origRetry = transcriptionConfig.processing.retryAttempts;
    const origDelay = transcriptionConfig.processing.retryDelayMs;

    // @ts-ignore
    transcriptionConfig.processing.retryAttempts = 2;
    // @ts-ignore
    transcriptionConfig.processing.retryDelayMs = 1;

    const fetchMock = jest.fn() as any;

    fetchMock
      // HEAD ok
      .mockResolvedValueOnce(
        makeFetchResponse({
          ok: true,
          headers: {
            "content-length": String(40 * 1024), // 40KB
            "content-type": "audio/wav",
          },
        })
      )
      // GET 1 → not ok
      .mockResolvedValueOnce(
        makeFetchResponse({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
        })
      )
      // GET 2 → not ok
      .mockResolvedValueOnce(
        makeFetchResponse({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
        })
      );

    // @ts-ignore
    global.fetch = fetchMock;

    const provider = new OpenAIWhisperProvider();

    await expect(
      provider.transcribeAudio("https://example.com/audio/test.wav")
    ).rejects.toBeInstanceOf(TranscriptionError);

    const err = await provider
      .transcribeAudio("https://example.com/audio/test.wav")
      .catch((e) => e as TranscriptionError);

    expect(err).toMatchObject({
      message: "Failed to download",
      code: "DOWNLOAD_FAILED",
    });

    // HEAD + 2 tentatives GET
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // restore
    // @ts-ignore
    transcriptionConfig.processing.retryAttempts = origRetry;
    // @ts-ignore
    transcriptionConfig.processing.retryDelayMs = origDelay;
  });

  test("transcribeAudio - HEAD size too large → FILE_TOO_LARGE", async () => {
    const tooBigMB = transcriptionConfig.processing.maxFileSizeMB + 1;

    const fetchMock = jest.fn() as any;

    // HEAD renvoie une taille trop grande
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        headers: {
          "content-length": String(tooBigMB * 1024 * 1024),
          "content-type": "audio/wav",
        },
      })
    );

    // @ts-ignore
    global.fetch = fetchMock;

    const provider = new OpenAIWhisperProvider();

    await expect(
      provider.transcribeAudio("https://example.com/audio/too_big.wav")
    ).rejects.toBeInstanceOf(TranscriptionError);

    const err = await provider
      .transcribeAudio("https://example.com/audio/too_big.wav")
      .catch((e) => e as TranscriptionError);

    expect(err).toMatchObject({ code: "FILE_TOO_LARGE" });

    // GET n'est jamais appelé
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call0Init = (fetchMock.mock.calls[0][1] || {}) as RequestInit;
    expect(call0Init.method).toBe("HEAD");
  });
});
