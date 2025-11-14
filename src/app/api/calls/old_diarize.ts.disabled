// pages/api/calls/diarize.ts
// BASÉ SUR AssemblyAIDiarizationProvider existant

import { NextApiRequest, NextApiResponse } from "next";
import { AssemblyAIDiarizationProvider } from "@/components/calls/infrastructure/diarization/AssemblyAIDiarizationProvider";
import { AssemblyAIError } from "@/lib/config/assemblyAIConfig";
import type { DiarizationSegment } from "@/components/calls/shared/types/TranscriptionTypes";

// Interface exacte basée sur le provider existant
interface DiarizeInferSpeakersRequest {
  fileUrl: string;
  options?: {
    languageCode?: string;
    timeoutMs?: number;
    pollIntervalMs?: number;
  };
}

interface DiarizeInferSpeakersResponse {
  success: boolean;
  result?: DiarizationSegment[];
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metrics?: {
    processingTimeMs: number;
    estimatedCost: number;
    audioMinutesProcessed: number;
  };
}

// Interface pour health check
interface DiarizeHealthResponse {
  success: boolean;
  result?: {
    status: "healthy" | "unhealthy";
    error?: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

// Interface pour getMetrics
interface DiarizeMetricsResponse {
  success: boolean;
  result?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalMinutesProcessed: number;
    totalCost: number;
    averageProcessingTime: number;
    successRate: number;
    lastUpdated: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | DiarizeInferSpeakersResponse
    | DiarizeHealthResponse
    | DiarizeMetricsResponse
  >
) {
  // Gestion des différentes méthodes et endpoints
  const { method, query } = req;
  const { action } = query;

  try {
    // Vérification des variables d'environnement
    if (!process.env.ASSEMBLYAI_API_KEY) {
      console.error("❌ [API] ASSEMBLYAI_API_KEY not configured");
      return res.status(500).json({
        success: false,
        error: {
          message: "AssemblyAI API key not configured",
          code: "MISSING_CONFIG",
        },
      });
    }

    // Initialisation du provider côté serveur (SÉCURISÉ)
    const provider = new AssemblyAIDiarizationProvider(
      process.env.ASSEMBLYAI_API_KEY,
      process.env.ASSEMBLYAI_BASE_URL
    );

    // Route principale: POST /api/calls/diarize (inferSpeakers)
    if (method === "POST" && !action) {
      return await handleInferSpeakers(req, res, provider);
    }

    // Route health check: GET /api/calls/diarize?action=health
    if (method === "GET" && action === "health") {
      return await handleHealthCheck(req, res, provider);
    }

    // Route metrics: GET /api/calls/diarize?action=metrics
    if (method === "GET" && action === "metrics") {
      return await handleGetMetrics(req, res, provider);
    }

    // Route reset metrics: POST /api/calls/diarize?action=reset-metrics
    if (method === "POST" && action === "reset-metrics") {
      return await handleResetMetrics(req, res, provider);
    }

    // Route non supportée
    return res.status(405).json({
      success: false,
      error: {
        message: "Method not allowed or invalid action",
        code: "METHOD_NOT_ALLOWED",
      },
    });
  } catch (error) {
    console.error("❌ [API] Diarization handler error:", error);

    return res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      },
    });
  }
}

/**
 * Handle inferSpeakers - méthode principale du provider
 */
async function handleInferSpeakers(
  req: NextApiRequest,
  res: NextApiResponse<DiarizeInferSpeakersResponse>,
  provider: AssemblyAIDiarizationProvider
): Promise<void> {
  const startTime = Date.now();

  try {
    console.log("🎭 [API] Starting AssemblyAI diarization - inferSpeakers");

    // Validation de la requête - correspond exactement à l'interface du provider
    const { fileUrl, options = {} } = req.body as DiarizeInferSpeakersRequest;

    if (!fileUrl || typeof fileUrl !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing or invalid fileUrl parameter",
          code: "INVALID_PARAMS",
        },
      });
    }

    console.log("🔄 [API] Calling provider.inferSpeakers with:", {
      fileUrl: fileUrl.substring(0, 50) + "...",
      options,
    });

    // Appel EXACT de la méthode du provider existant
    const segments = await provider.inferSpeakers(fileUrl, options);

    const processingTime = Date.now() - startTime;

    // Calcul des métriques (similaire au provider)
    const totalDuration =
      segments.length > 0 ? Math.max(...segments.map((s) => s.end)) : 0;
    const audioMinutes = totalDuration / 60;
    const estimatedCost = audioMinutes * 0.0025; // Même calcul que le provider

    console.log("✅ [API] inferSpeakers completed successfully:", {
      segmentsCount: segments.length,
      speakerCount: new Set(segments.map((s) => s.speaker)).size,
      totalDuration: `${totalDuration.toFixed(1)}s`,
      processingTimeMs: processingTime,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
    });

    // Réponse avec format exact attendu par l'ApiClient
    res.status(200).json({
      success: true,
      result: segments, // Directement les segments comme le provider
      metrics: {
        processingTimeMs: processingTime,
        estimatedCost,
        audioMinutesProcessed: audioMinutes,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("❌ [API] inferSpeakers failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      code: error instanceof AssemblyAIError ? error.code : "UNKNOWN",
      processingTimeMs: processingTime,
    });

    // Gestion des erreurs AssemblyAI exacte
    if (error instanceof AssemblyAIError) {
      const statusCode = mapAssemblyAIErrorToStatus(error.code);

      return res.status(statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: {
            httpStatus: error.statusCode,
            originalError: error.originalError?.message,
          },
        },
        metrics: {
          processingTimeMs: processingTime,
          estimatedCost: 0,
          audioMinutesProcessed: 0,
        },
      });
    }

    // Erreur générique
    res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      },
      metrics: {
        processingTimeMs: processingTime,
        estimatedCost: 0,
        audioMinutesProcessed: 0,
      },
    });
  }
}

/**
 * Handle healthCheck - méthode exacte du provider
 */
async function handleHealthCheck(
  req: NextApiRequest,
  res: NextApiResponse<DiarizeHealthResponse>,
  provider: AssemblyAIDiarizationProvider
): Promise<void> {
  try {
    console.log("🔍 [API] Health check - calling provider.healthCheck");

    // Appel EXACT de la méthode du provider
    const healthResult = await provider.healthCheck();

    console.log("✅ [API] Health check completed:", healthResult);

    res.status(200).json({
      success: true,
      result: healthResult,
    });
  } catch (error) {
    console.error("❌ [API] Health check failed:", error);

    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Health check failed",
        code: "HEALTH_CHECK_FAILED",
      },
    });
  }
}

/**
 * Handle getMetrics - méthode exacte du provider
 */
async function handleGetMetrics(
  req: NextApiRequest,
  res: NextApiResponse<DiarizeMetricsResponse>,
  provider: AssemblyAIDiarizationProvider
): Promise<void> {
  try {
    console.log("📊 [API] Getting metrics - calling provider.getMetrics");

    // Appel EXACT de la méthode du provider
    const metrics = provider.getMetrics();

    console.log("✅ [API] Metrics retrieved:", {
      totalRequests: metrics.totalRequests,
      successRate: metrics.successRate,
      totalCost: metrics.totalCost,
    });

    res.status(200).json({
      success: true,
      result: {
        ...metrics,
        lastUpdated: metrics.lastUpdated.toISOString(), // Conversion Date -> string
      },
    });
  } catch (error) {
    console.error("❌ [API] Get metrics failed:", error);

    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Get metrics failed",
        code: "GET_METRICS_FAILED",
      },
    });
  }
}

/**
 * Handle resetMetrics - méthode exacte du provider
 */
async function handleResetMetrics(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; error?: any }>,
  provider: AssemblyAIDiarizationProvider
): Promise<void> {
  try {
    console.log("🔄 [API] Resetting metrics - calling provider.resetMetrics");

    // Appel EXACT de la méthode du provider
    provider.resetMetrics();

    console.log("✅ [API] Metrics reset successfully");

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("❌ [API] Reset metrics failed:", error);

    res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Reset metrics failed",
        code: "RESET_METRICS_FAILED",
      },
    });
  }
}

/**
 * Mapping des erreurs AssemblyAI vers codes HTTP
 * Basé sur les codes d'erreur du provider existant
 */
function mapAssemblyAIErrorToStatus(errorCode?: string): number {
  switch (errorCode) {
    case "INVALID_CONFIG":
      return 400;
    case "MISSING_API_KEY":
      return 401;
    case "CREATE_TRANSCRIPT_FAILED":
    case "POLL_TRANSCRIPT_FAILED":
      return 502;
    case "MISSING_TRANSCRIPT_ID":
    case "PROCESSING_ERROR":
    case "POLLING_ERROR":
      return 500;
    case "POLLING_TIMEOUT":
      return 408;
    case "CREATE_TRANSCRIPT_ERROR":
    default:
      return 500;
  }
}
