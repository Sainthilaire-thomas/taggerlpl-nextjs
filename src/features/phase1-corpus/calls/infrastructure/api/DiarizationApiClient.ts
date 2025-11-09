// src/components/calls/infrastructure/api/DiarizationApiClient.ts
// INTERFACE EXACTE d'AssemblyAIDiarizationProvider via API sécurisée

import type { DiarizationSegment } from "../../shared/types/TranscriptionTypes";
import type { AssemblyAIMetrics } from "@/lib/config/assemblyAIConfig";

// Types exacts basés sur le provider existant
interface AssemblyAIOptions {
  languageCode?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

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
    audioMinutesProcessed?: number;
  };
}

/**
 * Client API qui remplace AssemblyAIDiarizationProvider
 * INTERFACE IDENTIQUE - l'UI ne voit aucune différence
 */
export class DiarizationApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.defaultTimeout = 300000; // 5 minutes comme le provider original

    console.log("🎭 DiarizationApiClient initialized (secure API mode)");
  }

  /**
   * Méthode principale - INTERFACE IDENTIQUE à AssemblyAIDiarizationProvider.inferSpeakers
   *
   * @param fileUrl URL du fichier audio
   * @param options Options de diarisation (identiques au provider)
   * @returns Promise<DiarizationSegment[]> - EXACTEMENT comme le provider
   */
  async inferSpeakers(
    fileUrl: string,
    options: AssemblyAIOptions = {}
  ): Promise<DiarizationSegment[]> {
    try {
      console.log(`🎯 [API Client] Starting diarization via secure API`);
      console.log(`📁 File URL: ${fileUrl.substring(0, 50)}...`);
      console.log(`⚙️ Options:`, options);

      // Appel à notre API route sécurisée - POST /api/calls/diarize
      const response = await this.callApi<DiarizationSegment[]>(
        "/api/calls/diarize",
        {
          method: "POST",
          body: JSON.stringify({
            fileUrl,
            options,
          }),
          timeout: options.timeoutMs || this.defaultTimeout,
        }
      );

      if (!response.success || !response.result) {
        throw new Error(response.error?.message || "Diarization API failed");
      }

      console.log(`✅ [API Client] Diarization completed successfully:`, {
        segments: response.result.length,
        speakers: new Set(response.result.map((s) => s.speaker)).size,
      });

      // Retour EXACT comme le provider original
      return response.result;
    } catch (error) {
      console.error(`❌ [API Client] Diarization failed:`, error);
      throw error; // Interface identique - on re-throw l'erreur
    }
  }

  /**
   * Health check - INTERFACE IDENTIQUE à AssemblyAIDiarizationProvider.healthCheck
   *
   * @returns Promise<{ status: "healthy" | "unhealthy"; error?: string; }>
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    error?: string;
  }> {
    try {
      console.log("🔍 [API Client] Health check via secure API");

      // Appel à notre API route - GET /api/calls/diarize?action=health
      const response = await this.callApi<{
        status: "healthy" | "unhealthy";
        error?: string;
      }>("/api/calls/diarize?action=health", {
        method: "GET",
        timeout: 10000, // 10 secondes pour health check
      });

      if (!response.success || !response.result) {
        return {
          status: "unhealthy",
          error: response.error?.message || "Health check failed",
        };
      }

      console.log(
        "✅ [API Client] Health check completed:",
        response.result.status
      );

      // Retour EXACT comme le provider original
      return response.result;
    } catch (error) {
      console.error("❌ [API Client] Health check failed:", error);

      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  /**
   * Récupération des métriques - INTERFACE IDENTIQUE à AssemblyAIDiarizationProvider.getMetrics
   *
   * @returns AssemblyAIMetrics - EXACTEMENT comme le provider
   */
  getMetrics(): AssemblyAIMetrics {
    // Note: Pour les métriques, on pourrait soit :
    // 1. Les récupérer via API (async)
    // 2. Les maintenir côté client (sync comme l'original)

    // Pour l'instant, on maintient côté client pour interface identique (sync)
    // TODO: Implémenter getMetricsAsync() pour récupération via API

    return this.getLocalMetrics();
  }

  /**
   * Récupération des métriques via API (version async)
   * Nouvelle méthode pour accéder aux vraies métriques serveur
   */
  async getMetricsAsync(): Promise<AssemblyAIMetrics> {
    try {
      console.log("📊 [API Client] Getting metrics via secure API");

      const response = await this.callApi<
        AssemblyAIMetrics & { lastUpdated: string }
      >("/api/calls/diarize?action=metrics", {
        method: "GET",
        timeout: 10000,
      });

      if (!response.success || !response.result) {
        throw new Error(response.error?.message || "Get metrics failed");
      }

      // Conversion string -> Date pour lastUpdated
      const metrics = {
        ...response.result,
        lastUpdated: new Date(response.result.lastUpdated),
      };

      console.log("✅ [API Client] Metrics retrieved:", {
        totalRequests: metrics.totalRequests,
        successRate: metrics.successRate,
      });

      return metrics;
    } catch (error) {
      console.error("❌ [API Client] Get metrics failed:", error);
      throw error;
    }
  }

  /**
   * Reset des métriques - INTERFACE IDENTIQUE à AssemblyAIDiarizationProvider.resetMetrics
   */
  resetMetrics(): void {
    // Version synchrone pour compatibilité
    this.resetMetricsAsync().catch((error) => {
      console.error("❌ [API Client] Reset metrics failed:", error);
    });
  }

  /**
   * Reset des métriques via API (version async)
   * Nouvelle méthode pour reset côté serveur
   */
  async resetMetricsAsync(): Promise<void> {
    try {
      console.log("🔄 [API Client] Resetting metrics via secure API");

      const response = await this.callApi<void>(
        "/api/calls/diarize?action=reset-metrics",
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
   * Truncate URL pour logs - méthode utilitaire du provider original
   */
  private truncateUrl(url: string): string {
    return url.length > 100 ? url.substring(0, 100) + "..." : url;
  }

  /**
   * Métriques locales par défaut (pour compatibilité sync)
   * Dans la vraie implémentation, ces métriques seraient maintenues côté client
   */
  private getLocalMetrics(): AssemblyAIMetrics {
    // Pour l'instant, métrique par défaut
    // Dans une vraie implémentation, on maintiendrait ces stats côté client
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalMinutesProcessed: 0,
      totalCost: 0,
      averageProcessingTime: 0,
      successRate: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Méthode générique pour appeler l'API
   */
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

/**
 * Alias pour compatibilité avec le code existant qui importe AssemblyAIDiarizationProvider
 * Peut être supprimé après migration complète
 */
export const AssemblyAIDiarizationProviderCompat = DiarizationApiClient;

/**
 * Factory pour créer le client avec la même interface que le provider original
 */
export function createDiarizationProvider(
  apiKey?: string,
  baseURL?: string
): DiarizationApiClient {
  // Note: apiKey et baseURL sont ignorés car on utilise l'API sécurisée
  // Ces paramètres sont conservés pour compatibilité d'interface
  console.warn(
    "🔄 [Migration] apiKey and baseURL parameters are ignored in secure API mode"
  );

  return new DiarizationApiClient();
}
