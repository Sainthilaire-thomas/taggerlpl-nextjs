// src/app/api/calls/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { OpenAIWhisperProvider } from "@/components/calls/infrastructure/asr/OpenAIWhisperProvider";
import { TranscriptionError } from "@/components/calls/shared/exceptions/TranscriptionExceptions";
import type {
  WhisperResponse,
  OpenAIWhisperOptions,
} from "@/components/calls/infrastructure/asr/OpenAIWhisperProvider";

interface TranscribeAudioRequest {
  fileUrl: string;
  options?: OpenAIWhisperOptions;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Vérification des variables d'environnement
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ [API] OPENAI_API_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "OpenAI API key not configured",
            code: "MISSING_CONFIG",
          },
        },
        { status: 500 }
      );
    }

    console.log("🎙️ [API] Starting OpenAI transcription - transcribeAudio");

    const body: TranscribeAudioRequest = await request.json();
    const { fileUrl, options = {} } = body;

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing or invalid fileUrl parameter",
            code: "INVALID_PARAMS",
          },
        },
        { status: 400 }
      );
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

    // Initialisation du provider
    const provider = new OpenAIWhisperProvider(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_BASE_URL
    );

    // Transcription
    const result = await provider.transcribeAudio(fileUrl, options);

    // Métriques
    const processingTime = Date.now() - startTime;
    const estimatedCost = result.duration ? (result.duration / 60) * 0.006 : 0;

    console.log("✅ [API] transcribeAudio completed successfully:", {
      textLength: result.text.length,
      duration: `${result.duration}s`,
      segments: result.segments.length,
      words: result.words?.length || 0,
      processingTimeMs: processingTime,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
    });

    return NextResponse.json({
      success: true,
      result,
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
      const statusCode = getStatusFromError(error.code);

      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
          metrics: {
            processingTimeMs: processingTime,
            estimatedCost: 0,
          },
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
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
      },
      { status: 500 }
    );
  }
}

function getStatusFromError(errorCode?: string): number {
  switch (errorCode) {
    case "FILE_NOT_ACCESSIBLE":
    case "INVALID_PARAMS":
      return 400;
    case "OPENAI_AUTHENTICATION":
      return 401;
    case "OPENAI_RATE_LIMITED":
      return 429;
    default:
      return 500;
  }
}
