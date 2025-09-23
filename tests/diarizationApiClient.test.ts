// tests/diarizationApiClient.test.ts

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

// Petit helper pour créer des Word sans connaître tous les champs requis
const w = (partial: Partial<Word>): Word => partial as unknown as Word;

describe("DiarizationService (via DiarizationApiClient)", () => {
  const client = new DiarizationApiClient("");
  const service = new DiarizationService(client);

  test("inferSegments - success", async () => {
    // Ne mets QUE les props sûres pour DiarizationSegment (pas de confidence si non typée)
    const segments: DiarizationSegment[] = [
      { start: 0, end: 1.5, speaker: "S0" },
      { start: 1.5, end: 3.2, speaker: "S1" },
    ];

    mockFetchOnceJson({ success: true, result: { segments } });

    const segs = await service.inferSegments(
      "https://file.example.com/audio.wav",
      { languageCode: "fr" }
    );
    expect(Array.isArray(segs)).toBe(true);
    expect(segs).toHaveLength(2);

    expect(fetch).toHaveBeenCalledWith(
      "/api/calls/diarize",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  test("diarizeWords - success", async () => {
    // On reste 100% agnostiques: aucune prop non garantie sur Word
    const words: Word[] = [w({ text: "bonjour" }), w({ text: "madame" })];

    const segments: DiarizationSegment[] = [
      { start: 0, end: 1.0, speaker: "S0" },
    ];

    mockFetchOnceJson({
      success: true,
      // Le backend peut renvoyer des speakers ajoutés; on ne valide pas les clés exactes des Word
      result: {
        segments,
        words: words.map((word) => ({ ...(word as any), speaker: "S0" })),
      },
    });

    const res = await service.diarizeWords(
      "https://file.example.com/audio.wav",
      words,
      { languageCode: "fr" }
    );
    expect(res.segments).toHaveLength(1);
    expect(Array.isArray(res.words)).toBe(true);
    // On vérifie un invariant faible: même nombre de mots qu’en entrée
    expect(res.words!.length).toBe(words.length);
  });

  test("assignTurnsToWords - success (retourne Word[])", async () => {
    const words: Word[] = [w({ text: "bonjour" }), w({ text: "madame" })];
    const segments: DiarizationSegment[] = [
      { start: 0, end: 1.0, speaker: "S0" },
    ];

    // Si l’implé fait un appel API, on garde un mock; si c’est local, ce mock est ignoré.
    mockFetchOnceJson({
      success: true,
      result: {
        words: words.map((word) => ({ ...(word as any), speaker: "S0" })),
      },
    });

    const assigned = await service.assignTurnsToWords(words, segments);
    expect(Array.isArray(assigned)).toBe(true);
    expect(assigned.length).toBe(words.length);
    // Optionnel: si un champ speaker est ajouté par l’implé, on accepte
    // (assigned as any)[0]?.speaker !== undefined
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

  test("getMetrics - success", async () => {
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

    // Si getMetrics est sync dans ton client, "await" marchera aussi.
    const m = await client.getMetrics();
    expect(m.totalRequests).toBe(5);
  });

  test("healthCheck - non-200/400 => unhealthy", async () => {
    mockFetchOnceError(503, "Service Unavailable");
    const h = await client.healthCheck();
    expect(h.status).toBe("unhealthy");
  });
});
