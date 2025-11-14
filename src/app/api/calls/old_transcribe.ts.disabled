// pages/api/calls/transcribe.ts
// BASÉ SUR OpenAIWhisperProvider existant

import { NextApiRequest, NextApiResponse } from "next";
import { OpenAIWhisperProvider } from "@/components/calls/infrastructure/asr/OpenAIWhisperProvider";
import { TranscriptionError } from "@/components/calls/shared/exceptions/TranscriptionExceptions";
import type {
  WhisperResponse,
  OpenAIWhisperOptions,
} from "@/components/calls/infrastructure/asr/OpenAIWhisperProvider";
import type { TranscriptionMetrics } from "@/components/calls/shared/types/TranscriptionTypes";

// Interface exacte basée sur le provider existant
interface TranscribeAudioRequest {
  fileUrl: string;
  options?: OpenAIWhisperOptions;
}

interface TranscribeAudioResponse {
  success: boolean;
  result?: WhisperResponse;
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

// Interface pour getMetrics
interface TranscribeMetricsResponse {
  success: boolean;
  result?: Omit<TranscriptionMetrics, "lastUpdated"> & { lastUpdated: string };
  error?: { message: string; code?: string };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranscribeAudioResponse | TranscribeMetricsResponse>
) {
  // Gestion des différentes méthodes et endpoints
  const { method, query } = req;
  const { action } = query;

  try {
    // Vérification des variables d'environnement
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ [API] OPENAI_API_KEY not configured");
      return res.status(500).json({
        success: false,
        error: {
          message: "OpenAI API key not configured",
          code: "MISSING_CONFIG",
        },
      });
    }

    // Initialisation du provider côté serveur (SÉCURISÉ)
    const provider = new OpenAIWhisperProvider(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_BASE_URL
    );

    // Route principale: POST /api/calls/transcribe (transcribeAudio)
    if (method === "POST" && !action) {
      return await handleTranscribeAudio(req, res, provider);
    }

    // Route metrics: GET /api/calls/transcribe?action=metrics
    if (method === "GET" && action === "metrics") {
      return await handleGetMetrics(req, res, provider);
    }

    // Route reset metrics: POST /api/calls/transcribe?action=reset-metrics
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
    console.error("❌ [API] Transcription handler error:", error);

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
 * Handle transcribeAudio - méthode principale du provider
 */
async function handleTranscribeAudio(
  req: NextApiRequest,
  res: NextApiResponse<TranscribeAudioResponse>,
  provider: OpenAIWhisperProvider
): Promise<void> {
  const startTime = Date.now();

  try {
    console.log("🎙️ [API] Starting OpenAI transcription - transcribeAudio");

    const { fileUrl, options = {} } = req.body as TranscribeAudioRequest;

    if (!fileUrl || typeof fileUrl !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing or invalid fileUrl parameter",
          code: "INVALID_PARAMS",
        },
      });
    }

    console.log("🔄 [API] Calling provider.transcribeAudio with:", {
      fileUrl: fileUrl.substring(0, 50) + "...",
      options: {
        model: options.model || "whisper-1",
        language: options.language || "fr",
        temperature: options.temperature || 0,
        prompt: options.prompt ? `[${options.prompt.length} chars]` : undefined,
      },
    });

    // 1) Obtenir la transcription (WhisperResponse)
    const result = await provider.transcribeAudio(fileUrl, options);

    // 2) Calculs de métriques/infos annexes
    const processingTime = Date.now() - startTime;
    const estimatedCost = result.duration ? (result.duration / 60) * 0.006 : 0; // $0.006/min

    console.log("✅ [API] transcribeAudio completed successfully:", {
      textLength: result.text.length,
      duration: `${result.duration}s`,
      segments: result.segments.length,
      words: result.words?.length || 0,
      processingTimeMs: processingTime,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
    });

    // 3) Répondre avec:
    // - result: la transcription (WhisperResponse)
    // - metrics: infos de processing/cost
    res.status(200).json({
      success: true,
      result, // 👈 WhisperResponse pur, pas d'attributs en plus
      metrics: {
        processingTimeMs: processingTime,
        estimatedCost,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("❌ [API] transcribeAudio failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      code: error instanceof TranscriptionError ? error.code : "UNKNOWN",
      processingTimeMs: processingTime,
    });

    if (error instanceof TranscriptionError) {
      const statusCode = mapTranscriptionErrorToStatus(error.code);

      return res.status(statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: {
            originalError:
              (error as any)?.originalError?.message ??
              ((error as any)?.cause instanceof Error
                ? (error as any).cause.message
                : undefined),
          },
        },
        metrics: {
          processingTimeMs: processingTime,
          estimatedCost: 0,
        },
      });
    }

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
      },
    });
  }
}

/**
 * Handle getMetrics - méthode exacte du provider
 */
async function handleGetMetrics(
  req: NextApiRequest,
  res: NextApiResponse<TranscribeMetricsResponse>,
  provider: OpenAIWhisperProvider
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
  provider: OpenAIWhisperProvider
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
 * Mapping des erreurs TranscriptionError vers codes HTTP
 * Basé sur les codes d'erreur du provider existant
 */
function mapTranscriptionErrorToStatus(errorCode?: string): number {
  switch (errorCode) {
    case "FILE_NOT_ACCESSIBLE":
    case "FILE_EMPTY":
    case "INVALID_PARAMS":
      return 400; // Bad Request

    case "FILE_TOO_LARGE":
    case "UNSUPPORTED_FORMAT":
      return 413; // Payload Too Large / Unsupported Media Type

    case "DOWNLOAD_FAILED":
    case "TIMEOUT":
      return 408; // Request Timeout

    case "OPENAI_RATE_LIMITED":
      return 429; // Too Many Requests

    case "OPENAI_QUOTA_EXCEEDED":
    case "OPENAI_INSUFFICIENT_QUOTA":
      return 402; // Payment Required

    case "OPENAI_INVALID_REQUEST":
      return 400; // Bad Request

    case "OPENAI_AUTHENTICATION":
      return 401; // Unauthorized

    case "VALIDATION_FAILED":
    case "API_CALL_FAILED":
    case "RESPONSE_PROCESSING_FAILED":
    case "NO_TRANSCRIPTION":
    default:
      return 500; // Internal Server Error
  }
}
