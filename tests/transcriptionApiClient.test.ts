import { TranscriptionApiClient } from "@/components/calls/infrastructure/api/TranscriptionApiClient";
import type { WhisperResponse } from "@/components/calls/infrastructure/asr/OpenAIWhisperProvider";
import {
  mockFetchOnceJson,
  mockFetchOnceError,
  mockFetchOnceTimeout,
} from "./setupTests";

describe("TranscriptionApiClient", () => {
  const client = new TranscriptionApiClient("");

  test("transcribeAudio - success", async () => {
    const fakeResult: WhisperResponse = {
      text: "bonjour",
      language: "fr",
      duration: 12.34,
      segments: [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: 12.34,
          text: "bonjour",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 0,
          no_speech_prob: 0,
        },
      ],
      // 👇 Ajout de `probability` requis par WhisperWord
      words: [{ word: "bonjour", start: 0, end: 0.5, probability: 0.98 }],
    };

    mockFetchOnceJson({
      success: true,
      result: fakeResult,
      metrics: { processingTimeMs: 500, estimatedCost: 0.0012 },
    });

    const res = await client.transcribeAudio(
      "https://file.example.com/audio.wav",
      { model: "whisper-1", language: "fr" }
    );
    expect(res.text).toBe("bonjour");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/calls/transcribe",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  test("transcribeAudio - http error", async () => {
    mockFetchOnceError(500, "Boom");

    await expect(
      client.transcribeAudio("https://file.example.com/audio.wav")
    ).rejects.toThrow("HTTP 500: Boom");
  });

  test("transcribeAudio - timeout", async () => {
    mockFetchOnceTimeout();

    await expect(
      client.transcribeAudio("https://file.example.com/audio.wav")
    ).rejects.toThrow("Request timeout");
  });

  test("getMetricsAsync - success", async () => {
    mockFetchOnceJson({
      success: true,
      result: {
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
        totalMinutesProcessed: 100,
        averageProcessingTime: 2500,
        successRate: 0.9,
        totalCost: 1.23,
        lastUpdated: new Date().toISOString(),
      },
    });

    const m = await client.getMetricsAsync();
    expect(m.totalRequests).toBe(10);
    expect(m.lastUpdated).toBeInstanceOf(Date);
  });

  test("resetMetricsAsync - success", async () => {
    mockFetchOnceJson({ success: true });

    await expect(client.resetMetricsAsync()).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "/api/calls/transcribe?action=reset-metrics",
      expect.objectContaining({ method: "POST" })
    );
  });
});
