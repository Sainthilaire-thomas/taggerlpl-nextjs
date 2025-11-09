// src/components/calls/infrastructure/api/CallsApiClient.ts
// Client API principal pour monitoring et gestion globale des services calls

// Types pour les statistiques consolidées
export interface CallsStatsResponse {
  transcription?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalMinutesProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    totalCost: number;
    costPerMinute: number;
    lastUpdated: string;

    modelBreakdown?: Array<{
      model: string;
      requests: number;
      minutes: number;
      cost: number;
    }>;

    languageBreakdown?: Array<{
      language: string;
      requests: number;
      minutes: number;
      avgAccuracy?: number;
    }>;
  };

  diarization?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalMinutesProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    totalCost: number;
    costPerMinute: number;
    lastUpdated: string;

    avgSpeakerCount: number;
    confidenceDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };

  combined?: {
    totalOperations: number;
    totalCost: number;
    peakUsageHours: string[];
    errorsByType: Array<{
      errorCode: string;
      count: number;
      percentage: number;
    }>;
  };

  timeSeries?: Array<{
    period: string;
    transcriptionRequests: number;
    diarizationRequests: number;
    totalCost: number;
    successRate: number;
  }>;
}

export interface CallsStatsRequest {
  callIds?: string[];
  operations?: ("transcription" | "diarization")[];
  timeframe?: {
    startDate?: string;
    endDate?: string;
  };
  groupBy?: "day" | "week" | "month" | "origin";
}

// Types pour health check
export interface CallsHealthResponse {
  transcription: {
    status: "healthy" | "unhealthy";
    responseTime?: number;
    lastError?: string;
    openaiStatus?: "available" | "unavailable";
  };
  diarization: {
    status: "healthy" | "unhealthy";
    responseTime?: number;
    lastError?: string;
    assemblyaiStatus?: "available" | "unavailable";
  };
  overall: "healthy" | "degraded" | "unhealthy";
  lastChecked: string;
}

// Types pour analyse des coûts
export interface CostSummary {
  transcriptionCost: number;
  diarizationCost: number;
  totalCost: number;
  costTrend: "increasing" | "decreasing" | "stable";
  projectedMonthlyCost: number;
  topExpensiveOperations: Array<{
    type: "transcription" | "diarization";
    audioMinutes: number;
    cost: number;
    date: string;
  }>;
}

// Interface API générique
interface ApiResponse<T> {
  success: boolean;
  result?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// ============================================================================
// HELPER TYPES ET UTILITIES (déclarations globales)
// ============================================================================
type ErrorsByType = NonNullable<CallsStatsResponse["combined"]>["errorsByType"];
type TimeSeries = NonNullable<CallsStatsResponse["timeSeries"]>;

/**
 * Client API principal pour monitoring et gestion globale des services calls
 * Fournit une vue consolidée des performances, coûts et santé des services
 */
export class CallsApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
    this.defaultTimeout = 30000; // 30 secondes pour les stats

    console.log("📊 CallsApiClient initialized (monitoring & stats)");
  }

  // ============================================================================
  // STATISTIQUES PRINCIPALES
  // ============================================================================

  /**
   * Récupère les statistiques globales des services
   */
  async getStats(params: CallsStatsRequest = {}): Promise<CallsStatsResponse> {
    try {
      console.log("📊 [Calls API] Getting statistics:", params);

      const response = await this.callApi<CallsStatsResponse>(
        "/api/calls/stats",
        {
          method: "POST",
          body: JSON.stringify(params),
        }
      );

      if (!response.success || !response.result) {
        throw new Error(response.error?.message || "Failed to get stats");
      }

      console.log("✅ [Calls API] Statistics retrieved successfully");

      return response.result;
    } catch (error) {
      console.error("❌ [Calls API] Stats retrieval failed:", error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de transcription uniquement
   */
  async getTranscriptionStats(timeframe?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CallsStatsResponse["transcription"]> {
    const stats = await this.getStats({
      operations: ["transcription"],
      timeframe,
    });

    return stats.transcription;
  }

  /**
   * Récupère les statistiques de diarisation uniquement
   */
  async getDiarizationStats(timeframe?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CallsStatsResponse["diarization"]> {
    const stats = await this.getStats({
      operations: ["diarization"],
      timeframe,
    });

    return stats.diarization;
  }

  /**
   * Récupère les séries temporelles pour les graphiques
   */
  async getTimeSeries(
    groupBy: "day" | "week" | "month" | "origin" = "day",
    operations: ("transcription" | "diarization")[] = [
      "transcription",
      "diarization",
    ],
    timeframe?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<TimeSeries> {
    const stats = await this.getStats({
      operations,
      timeframe,
      groupBy,
    });

    return (stats.timeSeries ?? []) as TimeSeries;
  }

  // ============================================================================
  // ANALYSE DES ERREURS
  // ============================================================================

  /**
   * Récupère les erreurs les plus fréquentes
   */
  async getErrorStats(): Promise<ErrorsByType> {
    const stats = await this.getStats();
    return (stats.combined?.errorsByType ?? []) as ErrorsByType;
  }

  /**
   * Analyse détaillée des erreurs par période
   */
  async getErrorAnalysis(
    timeframe: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{
    totalErrors: number;
    errorsByService: {
      transcription: number;
      diarization: number;
    };
    errorsByType: Array<{
      errorCode: string;
      count: number;
      percentage: number;
      service: "transcription" | "diarization";
      lastOccurrence: string;
    }>;
    errorTrend: "increasing" | "decreasing" | "stable";
  }> {
    try {
      const stats = await this.getStats({ timeframe });
      const errorsByType: ErrorsByType = (stats.combined?.errorsByType ??
        []) as ErrorsByType;

      // Simulation d'analyse détaillée (à implémenter avec vraies données)
      const totalErrors = errorsByType.reduce((acc, err) => acc + err.count, 0);

      return {
        totalErrors,
        errorsByService: {
          transcription: Math.floor(totalErrors * 0.6), // 60% transcription
          diarization: Math.floor(totalErrors * 0.4), // 40% diarisation
        },
        errorsByType: errorsByType.map((err) => ({
          ...err,
          service: err.errorCode.includes("OPENAI")
            ? ("transcription" as const)
            : ("diarization" as const),
          lastOccurrence: new Date(
            Date.now() - Math.random() * 86400000
          ).toISOString(),
        })),
        errorTrend: totalErrors > 100 ? "increasing" : "stable",
      };
    } catch (error) {
      console.error("❌ [Calls API] Error analysis failed:", error);

      return {
        totalErrors: 0,
        errorsByService: { transcription: 0, diarization: 0 },
        errorsByType: [],
        errorTrend: "stable",
      };
    }
  }

  // ============================================================================
  // GESTION DES COÛTS
  // ============================================================================

  /**
   * Récupère un résumé complet des coûts
   */
  async getCostSummary(): Promise<CostSummary> {
    try {
      const stats = await this.getStats();

      const transcriptionCost = stats.transcription?.totalCost || 0;
      const diarizationCost = stats.diarization?.totalCost || 0;
      const totalCost = transcriptionCost + diarizationCost;

      // Analyse de tendance simplifiée (à améliorer avec vraies données historiques)
      const costTrend = totalCost > 100 ? "increasing" : ("stable" as const);
      const projectedMonthlyCost = totalCost * 30; // Projection simpliste

      // Top des opérations coûteuses (simulation)
      const topExpensiveOperations = [
        {
          type: "transcription" as const,
          audioMinutes: 45.2,
          cost: 0.27,
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          type: "diarization" as const,
          audioMinutes: 38.7,
          cost: 0.1,
          date: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      return {
        transcriptionCost,
        diarizationCost,
        totalCost,
        costTrend,
        projectedMonthlyCost,
        topExpensiveOperations,
      };
    } catch (error) {
      console.error("❌ [Calls API] Cost summary failed:", error);

      return {
        transcriptionCost: 0,
        diarizationCost: 0,
        totalCost: 0,
        costTrend: "stable",
        projectedMonthlyCost: 0,
        topExpensiveOperations: [],
      };
    }
  }

  /**
   * Analyse des coûts par période avec prédictions
   */
  async getCostAnalysis(
    period: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<{
    currentPeriodCost: number;
    previousPeriodCost: number;
    changePercentage: number;
    breakdown: {
      transcription: { cost: number; percentage: number };
      diarization: { cost: number; percentage: number };
    };
    predictions: {
      nextPeriodEstimate: number;
      confidenceLevel: "low" | "medium" | "high";
    };
  }> {
    try {
      const groupBy =
        period === "daily" ? "day" : period === "weekly" ? "week" : "month";
      const timeSeries: TimeSeries = await this.getTimeSeries(groupBy);

      if (timeSeries.length < 2) {
        throw new Error("Insufficient data for cost analysis");
      }

      const current = timeSeries[timeSeries.length - 1];
      const previous = timeSeries[timeSeries.length - 2];

      const currentCost = current.totalCost;
      const previousCost = previous.totalCost;
      const changePercentage =
        previousCost > 0
          ? ((currentCost - previousCost) / previousCost) * 100
          : 0;

      // Calcul de la répartition (simulation basée sur les ratios moyens)
      const transcriptionCost = currentCost * 0.7; // 70% transcription
      const diarizationCost = currentCost * 0.3; // 30% diarisation

      return {
        currentPeriodCost: currentCost,
        previousPeriodCost: previousCost,
        changePercentage: Math.round(changePercentage * 100) / 100,
        breakdown: {
          transcription: {
            cost: transcriptionCost,
            percentage: Math.round((transcriptionCost / currentCost) * 100),
          },
          diarization: {
            cost: diarizationCost,
            percentage: Math.round((diarizationCost / currentCost) * 100),
          },
        },
        predictions: {
          nextPeriodEstimate: currentCost * (1 + changePercentage / 100),
          confidenceLevel: timeSeries.length > 10 ? "high" : "medium",
        },
      };
    } catch (error) {
      console.error("❌ [Calls API] Cost analysis failed:", error);

      return {
        currentPeriodCost: 0,
        previousPeriodCost: 0,
        changePercentage: 0,
        breakdown: {
          transcription: { cost: 0, percentage: 0 },
          diarization: { cost: 0, percentage: 0 },
        },
        predictions: {
          nextPeriodEstimate: 0,
          confidenceLevel: "low",
        },
      };
    }
  }

  // ============================================================================
  // HEALTH CHECK ET MONITORING
  // ============================================================================

  /**
   * Health check complet des services
   */
  async getServicesHealth(): Promise<CallsHealthResponse> {
    try {
      console.log("🔍 [Calls API] Checking services health");

      // Test des endpoints principaux en parallèle
      const [transcriptionTest, diarizationTest] = await Promise.allSettled([
        this.testTranscriptionHealth(),
        this.testDiarizationHealth(),
      ]);

      const transcriptionHealth = {
        status:
          transcriptionTest.status === "fulfilled" && transcriptionTest.value.ok
            ? ("healthy" as const)
            : ("unhealthy" as const),
        responseTime:
          transcriptionTest.status === "fulfilled"
            ? transcriptionTest.value.responseTime
            : undefined,
        lastError:
          transcriptionTest.status === "rejected"
            ? (transcriptionTest.reason as any)?.message
            : undefined,
        openaiStatus:
          transcriptionTest.status === "fulfilled" && transcriptionTest.value.ok
            ? ("available" as const)
            : ("unavailable" as const),
      };

      const diarizationHealth = {
        status:
          diarizationTest.status === "fulfilled" && diarizationTest.value.ok
            ? ("healthy" as const)
            : ("unhealthy" as const),
        responseTime:
          diarizationTest.status === "fulfilled"
            ? diarizationTest.value.responseTime
            : undefined,
        lastError:
          diarizationTest.status === "rejected"
            ? (diarizationTest.reason as any)?.message
            : undefined,
        assemblyaiStatus:
          diarizationTest.status === "fulfilled" && diarizationTest.value.ok
            ? ("available" as const)
            : ("unavailable" as const),
      };

      // Détermination du statut global
      let overall: "healthy" | "degraded" | "unhealthy";
      if (
        transcriptionHealth.status === "healthy" &&
        diarizationHealth.status === "healthy"
      ) {
        overall = "healthy";
      } else if (
        transcriptionHealth.status === "healthy" ||
        diarizationHealth.status === "healthy"
      ) {
        overall = "degraded";
      } else {
        overall = "unhealthy";
      }

      const result = {
        transcription: transcriptionHealth,
        diarization: diarizationHealth,
        overall,
        lastChecked: new Date().toISOString(),
      };

      console.log("✅ [Calls API] Health check completed:", { overall });

      return result;
    } catch (error) {
      console.error("❌ [Calls API] Health check failed:", error);

      return {
        transcription: {
          status: "unhealthy",
          lastError:
            error instanceof Error ? error.message : "Health check failed",
        },
        diarization: {
          status: "unhealthy",
          lastError:
            error instanceof Error ? error.message : "Health check failed",
        },
        overall: "unhealthy",
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Récupère les heures de pic d'utilisation
   */
  async getPeakUsageHours(): Promise<{
    hours: string[];
    peakHour: string;
    peakRequests: number;
    lowUsageHours: string[];
  }> {
    const stats = await this.getStats();
    const peakHours = stats.combined?.peakUsageHours || [];

    return {
      hours: peakHours,
      peakHour: peakHours[0] || "09:00-10:00",
      peakRequests: 250, // Simulation
      lowUsageHours: ["02:00-03:00", "03:00-04:00", "04:00-05:00"],
    };
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Test de santé du service de transcription
   */
  private async testTranscriptionHealth(): Promise<{
    ok: boolean;
    responseTime: number;
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
        signal: AbortSignal.timeout(10000), // 10 secondes max pour health check
      });

      const responseTime = Date.now() - startTime;

      return {
        ok: response.status === 400 || response.status === 200, // 400 est OK pour test avec données invalides
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        ok: false,
        responseTime,
      };
    }
  }

  /**
   * Test de santé du service de diarisation
   */
  private async testDiarizationHealth(): Promise<{
    ok: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch("/api/calls/diarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: "https://test.example.com/health-check.wav",
          options: { languageCode: "fr" },
        }),
        signal: AbortSignal.timeout(10000),
      });

      const responseTime = Date.now() - startTime;

      return {
        ok: response.status === 400 || response.status === 200,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        ok: false,
        responseTime,
      };
    }
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
// HELPER TYPES ET UTILITIES
// ============================================================================

/**
 * Interface pour composant de monitoring/dashboard
 */
export interface DashboardData {
  stats: CallsStatsResponse;
  health: CallsHealthResponse;
  costs: CostSummary;
  errors: Awaited<ReturnType<CallsApiClient["getErrorAnalysis"]>>;
}

/**
 * Factory pour créer un dashboard data complet
 */
export async function createDashboardData(
  client: CallsApiClient
): Promise<DashboardData> {
  const [stats, health, costs, errors] = await Promise.all([
    client.getStats(),
    client.getServicesHealth(),
    client.getCostSummary(),
    client.getErrorAnalysis(),
  ]);

  return { stats, health, costs, errors };
}
