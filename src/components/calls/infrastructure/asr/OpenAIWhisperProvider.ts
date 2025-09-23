// src/components/calls/infrastructure/asr/OpenAIWhisperProvider.ts

import OpenAI from "openai";
import {
  transcriptionConfig,
  TRANSCRIPTION_CONSTANTS,
} from "@/lib/config/transcriptionConfig";

// ✅ Imports DDD (types/exceptions/utils partagés)
import {
  AudioMetadata,
  TranscriptionMetrics,
} from "@/components/calls/shared/types/TranscriptionTypes";
import { TranscriptionError } from "@/components/calls/shared/exceptions/TranscriptionExceptions";
import { calculateCost } from "@/components/calls/shared/utils/cost";
import { isSupportedAudioFormat } from "@/components/calls/shared/utils/audioFormat";
import { sanitizeFilename } from "@/components/calls/shared/utils/filename";

/**
 * Options pour la transcription Whisper
 */
export interface OpenAIWhisperOptions {
  model?: string;
  language?: string;
  temperature?: number;
  prompt?: string; // Contexte optionnel pour améliorer la précision
}

/**
 * Valeurs par défaut si l'appelant ne précise rien.
 * Ajuste `model` si tu utilises un autre modèle (ex: "gpt-4o-transcribe").
 */
const DEFAULT_WHISPER = {
  model: "whisper-1",
  language: transcriptionConfig.processing.defaultLanguage || "fr",
  response_format: "json",
  temperature: 0 as number,
};

/**
 * Réponse détaillée de l'API Whisper
 */
export interface WhisperResponse {
  text: string;
  language: string;
  duration: number;
  segments: WhisperSegment[];
  words?: WhisperWord[];
}

export interface WhisperSegment {
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

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
  probability: number;
}

/**
 * Provider OpenAI Whisper avec validation, retries et métriques
 */
export class OpenAIWhisperProvider {
  private readonly openai: OpenAI;

  // Accumulateur interne pour le temps total (ms) — non exposé dans TranscriptionMetrics
  private totalProcessingMs = 0;

  private metrics: TranscriptionMetrics;

  constructor(apiKey?: string, baseUrl?: string) {
    // Lis la clé au runtime
    const key = apiKey ?? process.env.OPENAI_API_KEY ?? "";
    if (!key) {
      throw new Error("OPENAI_API_KEY is required");
    }
    if (!key.startsWith("sk-")) {
      throw new Error("OPENAI_API_KEY must start with sk-");
    }

    type OpenAIClientOptions = ConstructorParameters<typeof OpenAI>[0];
    const openaiConfig: OpenAIClientOptions = {
      apiKey: key,
      baseURL: baseUrl ?? transcriptionConfig.openai.baseURL,
    };

    if (transcriptionConfig.openai.organization) {
      openaiConfig.organization = transcriptionConfig.openai.organization;
    }

    this.openai = new OpenAI(openaiConfig);

    // Initialisation des métriques
    this.metrics = {
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

  /**
   * Transcrit un fichier audio via OpenAI Whisper
   */
  async transcribeAudio(
    fileUrl: string,
    options: OpenAIWhisperOptions = {}
  ): Promise<WhisperResponse> {
    const startTime = Date.now();

    try {
      // compteur de requête (compte comme tentative)
      this.metrics.totalRequests++;

      console.log(
        `🎙️ Starting Whisper transcription for: ${this.truncateUrl(fileUrl)}`
      );

      // 1) Validation et métadonnées du fichier
      const audioMetadata = await this.validateAudioFile(fileUrl);

      // 2) Téléchargement avec retry
      const audioFile = await this.downloadWithRetry(fileUrl, audioMetadata);

      // 3) Validation du format
      await this.validateAudioFormat(audioFile);

      // 4) Appel OpenAI
      const whisperResult = await this.callWhisperAPI(audioFile, options);

      // 5) Post-traitement
      const processedResult = await this.processWhisperResponse(
        whisperResult,
        audioMetadata
      );

      // 6) Mise à jour métriques (succès)
      await this.updateMetrics(
        true,
        Date.now() - startTime,
        processedResult.duration
      );

      console.log(
        `✅ Whisper transcription completed in ${Date.now() - startTime}ms`
      );
      console.log(
        `📊 Transcribed ${
          processedResult.duration
        }s of audio, estimated cost: $${calculateCost(
          processedResult.duration
        ).toFixed(4)}`
      );

      return processedResult;
    } catch (error) {
      // métriques (échec)
      await this.handleTranscriptionError(
        fileUrl,
        error as Error,
        Date.now() - startTime
      );
      throw error;
    }
  }

  /**
   * Validation pré-téléchargement (HEAD)
   */
  private async validateAudioFile(fileUrl: string): Promise<AudioMetadata> {
    try {
      const response = await fetch(fileUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new TranscriptionError(
          `Audio file not accessible: HTTP ${response.status} ${response.statusText}`,
          "FILE_NOT_ACCESSIBLE"
        );
      }

      const size = parseInt(response.headers.get("content-length") || "0", 10);
      const type =
        response.headers.get("content-type") || "application/octet-stream";
      const filename = this.extractFilenameFromUrl(fileUrl);

      if (size === 0) {
        throw new TranscriptionError("Audio file is empty", "FILE_EMPTY");
      }

      const maxSizeBytes =
        transcriptionConfig.processing.maxFileSizeMB * 1024 * 1024;
      if (size > maxSizeBytes) {
        throw new TranscriptionError(
          `Audio file too large: ${Math.round(size / 1024 / 1024)}MB (max: ${
            transcriptionConfig.processing.maxFileSizeMB
          }MB)`,
          "FILE_TOO_LARGE"
        );
      }

      return { size, type, url: fileUrl, filename };
    } catch (error) {
      if (error instanceof TranscriptionError) throw error;
      const err = error as Error;
      throw new TranscriptionError(
        `Failed to validate audio file: ${err.message}`,
        "VALIDATION_FAILED",
        err
      );
    }
  }

  /**
   * Téléchargement avec retry / backoff
   */
  private async downloadWithRetry(
    fileUrl: string,
    metadata: AudioMetadata
  ): Promise<File> {
    let lastError: Error | null = null;
    const { retryAttempts, timeoutMs, retryDelayMs } =
      transcriptionConfig.processing;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(
          `📥 Downloading audio file (attempt ${attempt}/${retryAttempts})`
        );

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(fileUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const fileName = sanitizeFilename(
          metadata.filename || `audio_${Date.now()}.wav`
        );
        const file = new File([blob], fileName, { type: metadata.type });

        console.log(
          `✅ Downloaded ${Math.round(
            blob.size / 1024
          )}KB audio file: ${fileName}`
        );
        return file;
      } catch (error) {
        lastError = error as Error;

        if (attempt < retryAttempts) {
          const baseDelay = Math.pow(2, attempt) * retryDelayMs;
          const jitter = Math.random() * 0.1 * baseDelay;
          const delay = baseDelay + jitter;

          console.warn(
            `⚠️ Download failed (attempt ${attempt}), retrying in ${Math.round(
              delay
            )}ms:`,
            (error as Error).message
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Toutes les tentatives ont échoué → le test attend EXACTEMENT "Failed to download"
    throw new TranscriptionError(
      "Failed to download",
      "DOWNLOAD_FAILED",
      lastError!
    );
  }

  /**
   * Validation du format supporté
   */
  private async validateAudioFormat(file: File): Promise<void> {
    if (!isSupportedAudioFormat(file.name)) {
      const supportedFormats =
        TRANSCRIPTION_CONSTANTS.SUPPORTED_AUDIO_FORMATS.join(", ");
      throw new TranscriptionError(
        `Unsupported audio format. Supported formats: ${supportedFormats}`,
        "UNSUPPORTED_FORMAT"
      );
    }
  }

  /**
   * Appel Whisper
   */
  private async callWhisperAPI(
    file: File,
    options: OpenAIWhisperOptions
  ): Promise<any> {
    try {
      const whisperOptions = {
        model: options.model ?? DEFAULT_WHISPER.model,
        language: options.language ?? DEFAULT_WHISPER.language,
        response_format: DEFAULT_WHISPER.response_format,
        temperature: options.temperature ?? DEFAULT_WHISPER.temperature,
        ...(options.prompt ? { prompt: options.prompt } : {}),
      };

      console.log(`🔄 Calling OpenAI Whisper API with options:`, {
        model: whisperOptions.model,
        language: whisperOptions.language,
        temperature: whisperOptions.temperature,
        fileSize: `${Math.round(file.size / 1024)}KB`,
      });

      const response = await this.openai.audio.transcriptions.create({
        file,
        ...whisperOptions,
      } as any);

      return response;
    } catch (error: any) {
      const err = error as any;
      if (err?.error) {
        const openaiError = err.error;
        throw new TranscriptionError(
          `OpenAI API Error: ${openaiError.message || openaiError.type}`,
          `OPENAI_${openaiError.type?.toUpperCase() || "ERROR"}`,
          err
        );
      }
      throw new TranscriptionError(
        `Whisper API call failed: ${err.message}`,
        "API_CALL_FAILED",
        err
      );
    }
  }

  /**
   * Post-traitement de la réponse
   */
  private async processWhisperResponse(
    rawResponse: any,
    _metadata: AudioMetadata
  ): Promise<WhisperResponse> {
    try {
      if (!rawResponse.text) {
        throw new TranscriptionError(
          "No transcription text received from Whisper",
          "NO_TRANSCRIPTION"
        );
      }

      const response: WhisperResponse = {
        text: String(rawResponse.text).trim(),
        language: rawResponse.language || DEFAULT_WHISPER.language,
        duration: rawResponse.duration || 0,
        segments: rawResponse.segments || [],
        words: this.extractWordsFromSegments(rawResponse.segments || []),
      };

      if (response.segments.length === 0) {
        console.warn(
          "⚠️ No segments in Whisper response, creating fallback segment"
        );
        response.segments = [
          {
            id: 0,
            seek: 0,
            start: 0,
            end: response.duration,
            text: response.text,
            tokens: [],
            temperature: 0,
            avg_logprob: 0,
            compression_ratio: 0,
            no_speech_prob: 0,
          },
        ];
      }

      console.log(
        `📄 Transcription results: ${response.text.length} chars, ${
          response.segments.length
        } segments, ${response.words?.length || 0} words`
      );

      return response;
    } catch (error) {
      const err = error as Error;
      throw new TranscriptionError(
        `Failed to process Whisper response: ${err.message}`,
        "RESPONSE_PROCESSING_FAILED",
        err
      );
    }
  }

  /**
   * Extraction des mots depuis les segments
   */
  private extractWordsFromSegments(segments: WhisperSegment[]): WhisperWord[] {
    const words: WhisperWord[] = [];

    for (const segment of segments) {
      if (segment.words && Array.isArray(segment.words)) {
        words.push(...segment.words);
      } else {
        const content = segment.text?.trim() ?? "";
        if (!content) continue;

        const segmentWords = content.split(/\s+/);
        const duration = Math.max(0, segment.end - segment.start);
        const wordDuration =
          segmentWords.length > 0 ? duration / segmentWords.length : 0;

        segmentWords.forEach((word, index) => {
          words.push({
            word,
            start: segment.start + index * wordDuration,
            end: segment.start + (index + 1) * wordDuration,
            probability: 0.5,
          });
        });
      }
    }

    return words;
  }

  /**
   * Mise à jour des métriques de performance
   */
  private async updateMetrics(
    success: boolean,
    processingTimeMs: number,
    audioSeconds?: number
  ): Promise<void> {
    if (success) this.metrics.successfulRequests += 1;
    else this.metrics.failedRequests += 1;

    // Accumulateur privé
    this.totalProcessingMs += processingTimeMs;

    if (typeof audioSeconds === "number") {
      this.metrics.totalMinutesProcessed += audioSeconds / 60;
      this.metrics.totalCost += calculateCost(audioSeconds);
    }

    // dérivées
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.successRate = total
      ? this.metrics.successfulRequests / total
      : 0;
    this.metrics.averageProcessingTime = total
      ? this.totalProcessingMs / total
      : 0;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * API publique pour récupérer les métriques
   */
  getMetrics(): TranscriptionMetrics {
    return { ...this.metrics };
  }

  /**
   * Gestion centralisée des erreurs
   */
  private async handleTranscriptionError(
    fileUrl: string,
    error: Error,
    processingTime: number
  ): Promise<void> {
    await this.updateMetrics(false, processingTime);

    const errorLog = {
      timestamp: new Date().toISOString(),
      provider: "openai-whisper",
      fileUrl: this.truncateUrl(fileUrl),
      error: error.message,
      errorCode: (error as TranscriptionError).code || "UNKNOWN",
      processingTime,
      metrics: {
        totalRequests:
          this.metrics.successfulRequests + this.metrics.failedRequests,
        successRate: this.metrics.successRate,
      },
    };

    console.error("🚨 Whisper Transcription Error:", errorLog);
  }

  /**
   * Utilitaires
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split("/").pop() || "unknown.audio";
    } catch {
      return "unknown.audio";
    }
  }

  private truncateUrl(url: string): string {
    return url.length > 100 ? url.substring(0, 100) + "..." : url;
  }

  /**
   * Reset des métriques (utile en tests)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalMinutesProcessed: 0,
      averageProcessingTime: 0,
      successRate: 0,
      totalCost: 0,
      lastUpdated: new Date(),
    };
    this.totalProcessingMs = 0;
  }
}
