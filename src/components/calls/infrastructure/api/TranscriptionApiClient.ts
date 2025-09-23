// src/components/calls/infrastructure/api/TranscriptionApiClient.ts
// INTERFACE EXACTE d'OpenAIWhisperProvider via API sécurisée

import type {
  WhisperResponse,
  OpenAIWhisperOptions,
} from "../asr/OpenAIWhisperProvider";
import type { TranscriptionMetrics } from "../../shared/types/TranscriptionTypes";

// Interface de réponse API
interface ApiResponse<T> {
  success: boolean;
  result?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metrics?: {
    processingTimeMs: number;
    estimatedCost: number;
  };
}

// Type dédié pour la réponse de batch
interface BatchResponse {
  results: Array<{
    callId: string;
    success: boolean;
    result?: WhisperResponse;
    error?: { message: string };
  }>;
}

/**
 * Client API qui remplace OpenAIWhisperProvider
 * INTERFACE IDENTIQUE - l'UI ne voit aucune différence
 */
export class TranscriptionApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.defaultTimeout = 120000; // 2 minutes comme le provider original

    console.log("🎙️ TranscriptionApiClient initialized (secure API mode)");
  }

  /**
   * Méthode principale - INTERFACE IDENTIQUE à OpenAIWhisperProvider.transcribeAudio
   */
  async transcribeAudio(
    fileUrl: string,
    options: OpenAIWhisperOptions = {}
  ): Promise<WhisperResponse> {
    try {
      console.log(`🎙️ [API Client] Starting transcription via secure API`);
      console.log(`📁 File URL: ${this.truncateUrl(fileUrl)}`);
      console.log(`⚙️ Options:`, {
        model: options.model || "whisper-1",
        language: options.language || "fr",
        temperature: options.temperature || 0,
        prompt: options.prompt ? `[${options.prompt.length} chars]` : undefined,
      });

      const response = await this.callApi<WhisperResponse>(
        "/api/calls/transcribe",
        {
          method: "POST",
          body: JSON.stringify({
            fileUrl,
            options,
          }),
          timeout: this.defaultTimeout,
        }
      );

      if (!response.success || !response.result) {
        throw new Error(response.error?.message || "Transcription API failed");
      }

      const result = response.result;

      console.log(`✅ [API Client] Transcription completed successfully:`, {
        textLength: result.text.length,
        duration: `${result.duration}s`,
        segments: result.segments.length,
        words: result.words?.length || 0,
        language: result.language,
        cost: response.metrics
          ? `$${response.metrics.estimatedCost.toFixed(4)}`
          : "N/A",
      });

      return result;
    } catch (error) {
      console.error(`❌ [API Client] Transcription failed:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        fileUrl: this.truncateUrl(fileUrl),
      });

      throw error;
    }
  }

  /**
   * Récupération des métriques - INTERFACE IDENTIQUE
   */
  getMetrics(): TranscriptionMetrics {
    return this.getLocalMetrics();
  }

  async getMetricsAsync(): Promise<TranscriptionMetrics> {
    try {
      console.log("📊 [API Client] Getting metrics via secure API");

      const response = await this.callApi<
        TranscriptionMetrics & { lastUpdated: string }
      >("/api/calls/transcribe?action=metrics", {
        method: "GET",
        timeout: 10000,
      });

      if (!response.success || !response.result) {
        throw new Error(response.error?.message || "Get metrics failed");
      }

      const metrics: TranscriptionMetrics = {
        ...response.result,
        lastUpdated: new Date(response.result.lastUpdated),
      };

      console.log("✅ [API Client] Metrics retrieved:", {
        totalRequests: metrics.totalRequests,
        successRate: metrics.successRate,
        totalCost: metrics.totalCost,
      });

      return metrics;
    } catch (error) {
      console.error("❌ [API Client] Get metrics failed:", error);
      throw error;
    }
  }

  resetMetrics(): void {
    this.resetMetricsAsync().catch((error) => {
      console.error("❌ [API Client] Reset metrics failed:", error);
    });
  }

  async resetMetricsAsync(): Promise<void> {
    try {
      console.log("🔄 [API Client] Resetting metrics via secure API");

      const response = await this.callApi<void>(
        "/api/calls/transcribe?action=reset-metrics",
        {
          method: "POST",
          timeout: 10000,
        }
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Reset metrics failed");
      }

      console.log("✅ [API Client] Metrics reset successfully");
    } catch (error) {
      console.error("❌ [API Client] Reset metrics failed:", error);
      throw error;
    }
  }

  /**
   * Transcription en lot (nouvelle fonctionnalité)
   */
  async transcribeBatch(
    requests: Array<{
      callId: string;
      audioUrl: string;
      options?: OpenAIWhisperOptions;
    }>
  ): Promise<
    Array<{
      callId: string;
      success: boolean;
      result?: WhisperResponse;
      error?: string;
    }>
  > {
    try {
      console.log(
        `📦 [API Client] Starting batch transcription: ${requests.length} files`
      );

      const batchRequest = {
        operations: requests.map((req) => ({
          callId: req.callId,
          operation: "transcribe" as const,
          audioUrl: req.audioUrl,
          transcriptionOptions: req.options,
        })),
      };

      const response = await this.callApi<BatchResponse>(
        "/api/calls/prepare-batch",
        {
          method: "POST",
          body: JSON.stringify(batchRequest),
          timeout: 300000,
        }
      );

      if (!response.success || !response.result?.results) {
        throw new Error(
          response.error?.message || "Batch transcription failed"
        );
      }

      const results = response.result.results.map(
        (result: {
          callId: string;
          success: boolean;
          result?: WhisperResponse;
          error?: { message: string };
        }) => ({
          callId: result.callId,
          success: result.success,
          result: result.success ? result.result : undefined,
          error: result.success ? undefined : result.error?.message,
        })
      );

      console.log(`✅ [API Client] Batch completed:`, {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      });

      return results;
    } catch (error) {
      console.error(`❌ [API Client] Batch failed:`, error);

      return requests.map((req) => ({
        callId: req.callId,
        success: false,
        error:
          error instanceof Error ? error.message : "Batch transcription failed",
      }));
    }
  }

  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    error?: string;
    responseTime?: number;
    openaiStatus?: "available" | "unavailable";
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch("/api/calls/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: "https://test.example.com/health-check.wav",
          options: { model: "whisper-1" },
        }),
        signal: AbortSignal.timeout(10000),
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 400 || response.status === 200;

      return {
        status: isHealthy ? "healthy" : "unhealthy",
        responseTime,
        openaiStatus: isHealthy ? "available" : "unavailable",
        error: !isHealthy ? `HTTP ${response.status}` : undefined,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: "unhealthy",
        responseTime,
        openaiStatus: "unavailable",
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  private truncateUrl(url: string): string {
    return url.length > 100 ? url.substring(0, 100) + "..." : url;
  }

  private getLocalMetrics(): TranscriptionMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalMinutesProcessed: 0,
      averageProcessingTime: 0,
      successRate: 0,
      totalCost: 0,
      lastUpdated: new Date(),
    };
  }

  private async callApi<T>(
    endpoint: string,
    options: {
      method: "GET" | "POST";
      body?: string;
      timeout?: number;
    }
  ): Promise<ApiResponse<T>> {
    const { method, body, timeout = this.defaultTimeout } = options;

    const controller = new AbortController();
    // 👇 timeoutId visible dans try/catch/finally
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? body : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse<T>;
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId); // ✅ pas de handle ouvert
    }
  }
}

// ============================================================================
// 🔄 INTERFACE DE COMPATIBILITY POUR MIGRATION DOUCE
// ============================================================================
export const OpenAIWhisperProviderCompat = TranscriptionApiClient;

export function createTranscriptionProvider(
  apiKey?: string,
  baseUrl?: string
): TranscriptionApiClient {
  console.warn(
    "🔄 [Migration] apiKey and baseUrl parameters are ignored in secure API mode"
  );
  return new TranscriptionApiClient();
}
