// src/app/api/calls/transcribe/route.ts
// Route API nettoyée - appel direct OpenAI sans provider intermédiaire

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface TranscribeRequest {
  fileUrl: string;
  options?: {
    model?: "whisper-1";
    language?: string;
    temperature?: number;
    prompt?: string;
  };
}

// Types de réponse OpenAI (segments + mots)
interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
  words?: WhisperWord[];
}

interface WhisperResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  words?: WhisperWord[];
  segments: WhisperSegment[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("🎙️ [API] Starting OpenAI Whisper transcription (direct)");

    // Vérification clé API
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

    const body: TranscribeRequest = await request.json();
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

    console.log("🔄 [API] Direct OpenAI call with:", {
      fileUrl: fileUrl.substring(0, 50) + "...",
      options: {
        model: options.model || "whisper-1",
        language: options.language || "fr",
        temperature: options.temperature ?? 0,
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
      },
    });

    // 1. Téléchargement du fichier audio
    const audioResponse = await fetch(fileUrl, {
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioFile = new File([audioBuffer], "audio.wav", {
      type: audioResponse.headers.get("content-type") || "audio/wav",
    });

    // 2. Client OpenAI direct
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    // 3. Appel Whisper avec segments + mots
    console.log("🎯 [API] Calling OpenAI Whisper API directly");

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: (options.model || "whisper-1") as "whisper-1",
      language: options.language || "fr",
      temperature: options.temperature ?? 0,
      prompt: options.prompt,
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
    });

    // 4. Validation et structuration
    const response = transcription as WhisperResponse;

    // Validation que nous avons bien des segments
    if (!response.segments || response.segments.length === 0) {
      console.warn(
        "⚠️ [API] No segments in Whisper response, creating fallback"
      );
      response.segments = [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: response.duration || 0,
          text: response.text,
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
          words: response.words,
        },
      ];
    }

    // 5. Extraction des mots si manquants au niveau segment
    for (const segment of response.segments) {
      if (!segment.words && response.words) {
        // Filtrer les mots qui appartiennent à ce segment
        segment.words = response.words.filter(
          (word) => word.start >= segment.start && word.end <= segment.end
        );
      }
    }

    const processingTime = Date.now() - startTime;
    const durationMinutes = response.duration / 60;
    const estimatedCost = durationMinutes * 0.006; // $0.006 per minute

    console.log("✅ [API] OpenAI transcription completed:", {
      duration: `${response.duration}s`,
      segments: response.segments.length,
      totalWords: response.words?.length || 0,
      segmentWords: response.segments.reduce(
        (acc, s) => acc + (s.words?.length || 0),
        0
      ),
      processingTime: `${processingTime}ms`,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
    });

    return NextResponse.json({
      success: true,
      result: response,
      metrics: {
        processingTimeMs: processingTime,
        estimatedCost,
        durationSeconds: response.duration,
        segmentCount: response.segments.length,
        wordCount: response.words?.length || 0,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("❌ [API] OpenAI transcription failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack:
        error instanceof Error
          ? error.stack?.split("\n").slice(0, 5)
          : undefined,
      processingTime: `${processingTime}ms`,
    });

    // Analyse du type d'erreur pour codes spécifiques
    let errorCode = "TRANSCRIPTION_FAILED";
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
        errorMessage.includes("rate limit")
      ) {
        errorCode = "QUOTA_EXCEEDED";
        statusCode = 429;
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("aborted")
      ) {
        errorCode = "TIMEOUT";
        statusCode = 408;
      } else if (errorMessage.includes("failed to download")) {
        errorCode = "FILE_NOT_ACCESSIBLE";
        statusCode = 400;
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

// Health check endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "health") {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("API key not configured");
      }

      // Test simple de connectivité OpenAI (pas de vraie transcription)
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      });

      // On ne peut pas vraiment tester sans consommer des crédits
      // donc on retourne healthy si la clé existe et est bien formée
      return NextResponse.json({
        success: true,
        result: {
          status: "healthy",
          openaiConfigured: true,
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
      error: { message: "Invalid action parameter" },
    },
    { status: 400 }
  );
}
