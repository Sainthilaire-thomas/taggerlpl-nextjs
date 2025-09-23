// src/app/api/calls/diarize/route.ts - Version avec SDK AssemblyAI officiel
import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

interface DiarizationOptions {
  languageCode?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

interface DiarizationSegment {
  start: number;
  end: number;
  speaker: string;
  confidence?: number;
}

interface DiarizeRequest {
  fileUrl: string;
  options?: DiarizationOptions;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("👥 [API] Starting AssemblyAI diarization with official SDK");

    // Vérification de la clé API
    if (!process.env.ASSEMBLYAI_API_KEY) {
      console.error("❌ [API] ASSEMBLYAI_API_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "AssemblyAI API key not configured",
            code: "MISSING_CONFIG",
          },
        },
        { status: 500 }
      );
    }

    const body: DiarizeRequest = await request.json();
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

    console.log("🔄 [API] Starting diarization with:", {
      fileUrl: fileUrl.substring(0, 50) + "...",
      options: {
        languageCode: options.languageCode || "fr",
        timeoutMs: options.timeoutMs || 600000,
        pollIntervalMs: options.pollIntervalMs || 3000,
      },
    });

    // Initialisation du client AssemblyAI
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
    });

    // Configuration de la transcription avec diarisation
    const transcriptParams = {
      audio: fileUrl, // AssemblyAI peut directement utiliser l'URL
      speaker_labels: true, // Activer la diarisation
      language_code: options.languageCode || "fr", // Langue française
    };

    console.log("📋 [API] Starting transcription with diarization...");

    // Lancer la transcription (le SDK gère automatiquement l'upload et le polling)
    const transcript = await client.transcripts.transcribe(transcriptParams);

    if (transcript.status === "error") {
      throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
    }

    console.log("✅ [API] AssemblyAI transcription completed");
    console.log("📊 [API] Transcript info:", {
      duration: transcript.audio_duration,
      confidence: transcript.confidence,
      hasUtterances: !!transcript.utterances,
      utterancesCount: transcript.utterances?.length || 0,
    });

    // Extraire les segments de diarisation
    const segments: DiarizationSegment[] = [];

    if (transcript.utterances && transcript.utterances.length > 0) {
      console.log("🎭 [API] Processing utterances for speaker diarization");

      for (const utterance of transcript.utterances) {
        segments.push({
          start: utterance.start / 1000, // AssemblyAI retourne en millisecondes
          end: utterance.end / 1000,
          speaker: utterance.speaker || "SPEAKER_00",
          confidence: utterance.confidence || 0.9,
        });
      }
    } else {
      console.warn("⚠️ [API] No utterances found, creating fallback segment");

      // Fallback : créer un segment unique couvrant tout l'audio
      segments.push({
        start: 0,
        end: (transcript.audio_duration || 0) / 1000,
        speaker: "SPEAKER_00",
        confidence: 1.0,
      });
    }

    const processingTime = Date.now() - startTime;
    const audioDuration = (transcript.audio_duration || 0) / 1000; // Convertir ms en s
    const estimatedCost = (audioDuration / 60) * 0.00065; // $0.00065 per minute
    const speakerCount = new Set(segments.map((s) => s.speaker)).size;

    console.log("📊 [API] Diarization metrics:", {
      segments: segments.length,
      speakers: speakerCount,
      duration: `${audioDuration}s`,
      processingTimeMs: processingTime,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
    });

    console.log(
      "🎯 [API] Speaker segments:",
      segments.map((s) => ({
        speaker: s.speaker,
        duration: `${s.start}s-${s.end}s`,
        length: `${(s.end - s.start).toFixed(1)}s`,
      }))
    );

    return NextResponse.json({
      success: true,
      result: segments,
      metrics: {
        processingTimeMs: processingTime,
        estimatedCost,
        speakerCount,
        audioDuration,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("❌ [API] Diarization failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack:
        error instanceof Error
          ? error.stack?.split("\n").slice(0, 5)
          : undefined,
      processingTimeMs: processingTime,
    });

    // Analyser le type d'erreur pour des codes plus spécifiques
    let errorCode = "DIARIZATION_FAILED";
    let statusCode = 500;

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("invalid api key")
      ) {
        errorCode = "INVALID_API_KEY";
        statusCode = 401;
      } else if (
        errorMessage.includes("quota") ||
        errorMessage.includes("limit")
      ) {
        errorCode = "QUOTA_EXCEEDED";
        statusCode = 402;
      } else if (errorMessage.includes("timeout")) {
        errorCode = "TIMEOUT";
        statusCode = 408;
      } else if (errorMessage.includes("unsupported format")) {
        errorCode = "UNSUPPORTED_FORMAT";
        statusCode = 415;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Internal server error",
          code: errorCode,
        },
        metrics: {
          processingTimeMs: processingTime,
          estimatedCost: 0,
        },
      },
      { status: statusCode }
    );
  }
}

// Endpoint GET pour les métriques et health check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "metrics") {
    return NextResponse.json({
      success: true,
      result: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalMinutesProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0,
        totalCost: 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  }

  if (action === "health") {
    try {
      if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error("API key not configured");
      }

      // Test simple de connectivité
      const client = new AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY,
      });

      // On ne peut pas vraiment tester sans faire une vraie transcription
      // donc on retourne healthy si la clé existe
      return NextResponse.json({
        success: true,
        result: {
          status: "healthy",
          apiKeyConfigured: true,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Health check failed",
            code: "HEALTH_CHECK_FAILED",
          },
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: { message: "Invalid action" },
    },
    { status: 400 }
  );
}
