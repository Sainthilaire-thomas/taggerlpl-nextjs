import { DiarizationApiClient } from "@/components/calls/infrastructure/api/DiarizationApiClient";
import { DiarizationService } from "@/components/calls/domain/services/DiarizationService";
import type {
  DiarizationSegment,
  Word,
} from "@/components/calls/shared/types/TranscriptionTypes";
import {
  mockFetchOnceJson,
  mockFetchOnceError,
  mockFetchOnceTimeout,
} from "./setupTests";

// helper pour ne pas dépendre de la forme exacte de Word
const w = (partial: Partial<Word>): Word => partial as unknown as Word;

describe("DiarizationService (via DiarizationApiClient)", () => {
  const client = new DiarizationApiClient("");
  const service = new DiarizationService(client);

  test("inferSegments - success", async () => {
    const segments: DiarizationSegment[] = [
      { start: 0, end: 1.5, speaker: "S0" },
      { start: 1.5, end: 3.2, speaker: "S1" },
    ];

    // ⬇️ le client attend result: DiarizationSegment[]
    mockFetchOnceJson({ success: true, result: segments });

    const segs = await service.inferSegments(
      "https://file.example.com/audio.wav",
      { languageCode: "fr" }
    );
    expect(Array.isArray(segs)).toBe(true);
    expect(segs).toHaveLength(2);
  });

  test("diarizeWords - success", async () => {
    const words: Word[] = [w({ text: "bonjour" }), w({ text: "madame" })];
    const segments: DiarizationSegment[] = [
      { start: 0, end: 1.0, speaker: "S0" },
    ];

    // 1er appel: inferSpeakers → renvoie un tableau
    mockFetchOnceJson({ success: true, result: segments });

    const res = await service.diarizeWords(
      "https://file.example.com/audio.wav",
      words,
      { languageCode: "fr" }
    );
    expect(res.segments).toHaveLength(1);
    expect(Array.isArray(res.words)).toBe(true);
    expect(res.words!.length).toBe(words.length);
  });

  test("assignTurnsToWords - success (retourne Word[])", async () => {
    const words: Word[] = [w({ text: "bonjour" }), w({ text: "madame" })];
    const segments: DiarizationSegment[] = [
      { start: 0, end: 1.0, speaker: "S0" },
    ];

    const assigned = await service.assignTurnsToWords(words, segments);
    expect(Array.isArray(assigned)).toBe(true);
    expect(assigned.length).toBe(words.length);
  });

  test("inferSegments - http error", async () => {
    mockFetchOnceError(502, "Bad Gateway");
    await expect(
      service.inferSegments("https://file.example.com/audio.wav")
    ).rejects.toThrow("HTTP 502: Bad Gateway");
  });

  test("inferSegments - timeout", async () => {
    mockFetchOnceTimeout();
    await expect(
      service.inferSegments("https://file.example.com/audio.wav")
    ).rejects.toThrow("Request timeout");
  });
});

describe("DiarizationApiClient - health & metrics", () => {
  const client = new DiarizationApiClient("");

  test("getMetricsAsync - success", async () => {
    mockFetchOnceJson({
      success: true,
      result: {
        totalRequests: 5,
        successfulRequests: 4,
        failedRequests: 1,
        totalMinutesProcessed: 60,
        averageProcessingTime: 10000,
        successRate: 0.8,
        totalCost: 0.42,
        lastUpdated: new Date().toISOString(),
      },
    });

    const m = await client.getMetricsAsync(); // ⬅️ pas client.getMetrics()
    expect(m.totalRequests).toBe(5);
  });

  test("healthCheck - non-200/400 => unhealthy", async () => {
    mockFetchOnceError(503, "Service Unavailable");
    const h = await client.healthCheck();
    expect(h.status).toBe("unhealthy");
  });
});
