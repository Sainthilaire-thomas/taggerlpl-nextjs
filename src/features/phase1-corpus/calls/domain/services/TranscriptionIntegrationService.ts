// src/components/calls/domain/services/TranscriptionIntegrationService.ts
// Service d'intégration nettoyé - utilise directement les API routes

import { TranscriptionASRService } from "./TranscriptionASRService";
import { DiarizationService } from "./DiarizationService";
import { CallRepository } from "../repositories/CallRepository";
import { StorageRepository } from "../repositories/StorageRepository";
import { TranscriptionJson, Word } from "../../shared/types/TranscriptionTypes";
import { validateTranscriptionConfig } from "@/lib/config/transcriptionConfig";

// Types de réponse des API routes
interface ApiResponse<T> {
  success: boolean;
  result?: T;
  error?: {
    message: string;
    code?: string;
  };
  metrics?: {
    processingTimeMs: number;
    estimatedCost: number;
    [key: string]: any;
  };
}

// Réponse OpenAI avec segments structurés
interface WhisperApiResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    words?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
}

// Réponse AssemblyAI
interface DiarizationApiResponse
  extends Array<{
    start: number;
    end: number;
    speaker: string;
    confidence?: number;
  }> {}

export interface TranscriptionJobResult {
  success: boolean;
  callId: string;
  transcription?: TranscriptionJson;
  error?: string;
  metrics: {
    processingTime: number;
    audioDuration: number;
    wordCount: number;
    speakerCount: number;
    segmentCount: number;
    whisperCost: number;
    assemblyAICost: number;
    totalCost: number;
  };
  stages: {
    download: { success: boolean; duration: number; error?: string };
    transcription: { success: boolean; duration: number; error?: string };
    diarization: { success: boolean; duration: number; error?: string };
    alignment: { success: boolean; duration: number; error?: string };
    validation: { success: boolean; duration: number; error?: string };
  };
}

export interface BatchTranscriptionResult {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  results: TranscriptionJobResult[];
  totalCost: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
}

export type TranscriptionMode =
  | "transcription-only" // Whisper seulement
  | "diarization-only" // AssemblyAI sur transcription existante
  | "complete"; // Whisper + AssemblyAI + Alignement

type StageStatus = { success: boolean; duration: number; error?: string };
type StagesMap = {
  download: StageStatus;
  transcription: StageStatus;
  diarization: StageStatus;
  alignment: StageStatus;
  validation: StageStatus;
};

/**
 * Service d'intégration nettoyé - appelle directement les API routes
 * Plus de providers intermédiaires, communication directe avec OpenAI/AssemblyAI
 */
export class TranscriptionIntegrationService {
  private readonly asrService: TranscriptionASRService;
  private readonly diarizationService: DiarizationService;

  constructor(
    private readonly callRepository: CallRepository,
    private readonly storageRepository: StorageRepository
  ) {
    validateTranscriptionConfig();

    this.asrService = new TranscriptionASRService();
    this.diarizationService = new DiarizationService();

    console.log(
      "🚀 TranscriptionIntegrationService initialized (API routes mode)"
    );
  }

  //** Normalise n'importe quel tableau de mots "OpenAI-like" vers notre type `Word`. */
  private ensureWords(arr: any): Word[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((w: any) => {
        const text = w?.text ?? w?.word ?? "";
        const start = typeof w?.startTime === "number" ? w.startTime : w?.start;
        const end = typeof w?.endTime === "number" ? w.endTime : w?.end;
        if (typeof text !== "string") return null;
        if (typeof start !== "number" || typeof end !== "number") return null;
        return {
          text,
          startTime: start,
          endTime: end,
          speaker: w?.speaker,
          turn: w?.turn,
          confidence: w?.confidence,
          type: w?.type,
        } as Word;
      })
      .filter(Boolean) as Word[];
  }

  async transcribeComplete(callId: string): Promise<TranscriptionJobResult> {
    return this.transcribeCall(callId, "complete");
  }

  async transcribeOnly(callId: string): Promise<TranscriptionJobResult> {
    return this.transcribeCall(callId, "transcription-only");
  }

  async diarizeExisting(callId: string): Promise<TranscriptionJobResult> {
    return this.transcribeCall(callId, "diarization-only");
  }

  /**
   * Méthode principale - orchestration complète via API routes
   */
  private async transcribeCall(
    callId: string,
    mode: TranscriptionMode = "complete"
  ): Promise<TranscriptionJobResult> {
    const startTime = Date.now();
    let audioDuration = 0;
    let wordCount = 0;
    let speakerCount = 0;
    let segmentCount = 0;

    const stages: StagesMap = {
      download: { success: false, duration: 0 },
      transcription: { success: false, duration: 0 },
      diarization: { success: false, duration: 0 },
      alignment: { success: false, duration: 0 },
      validation: { success: false, duration: 0 },
    };

    let transcription: TranscriptionJson = { words: [], meta: {} };

    try {
      console.log(`🎙️ [Integration] Starting ${mode} for call ${callId}`);

      // 1. STAGE: Download & preparation
      const downloadStart = Date.now();
      const call = await this.callRepository.findById(callId);
      if (!call) throw new Error(`Call ${callId} not found`);

      const audioFile = call.getAudioFile();
      if (!audioFile || !audioFile.isPlayable())
        throw new Error(`Call ${callId} has no playable audio file`);

      const signedUrl = await this.storageRepository.generateSignedUrl(
        audioFile.path,
        10800 // 3 heures
      );
      stages.download = { success: true, duration: Date.now() - downloadStart };

      console.log("✅ [Integration] Audio file prepared", {
        fileSize: audioFile.size,
        signedUrlGenerated: true,
      });

      // 2. STAGE: Transcription (OpenAI Whisper via API route)
      if (mode === "transcription-only" || mode === "complete") {
        const transcriptionStart = Date.now();

        console.log("🎙️ [Integration] Calling /api/calls/transcribe");
        const whisperResponse = await this.callTranscriptionApi(signedUrl, {
          prompt: this.generateContextPrompt(call),
          language: "fr",
          temperature: 0,
        });

        // Normalisation avec le service ASR rénové
        transcription = this.asrService.normalize(whisperResponse, {
          language: "fr-FR",
          source: "asr:auto",
        });

        audioDuration = whisperResponse.duration;
        wordCount = transcription.words.length;
        segmentCount = transcription.segments?.length || 0;

        stages.transcription = {
          success: true,
          duration: Date.now() - transcriptionStart,
        };

        console.log("✅ [Integration] Transcription completed via API", {
          duration: `${audioDuration}s`,
          words: wordCount,
          segments: segmentCount,
        });
      } else if (mode === "diarization-only") {
        // Utiliser transcription existante (type Transcription de Call)
        const existingTranscription = call.getTranscription();
        if (!existingTranscription)
          throw new Error(`Call ${callId} has no existing transcription`);

        // Adapter *robustement* vers notre TranscriptionJson (Word[])
        const wordsVerbose = this.ensureWords(
          (existingTranscription as any).words
        );
        transcription = {
          words: wordsVerbose,
          segments: (existingTranscription as any).segments || [],
          meta:
            (existingTranscription as any).meta ??
            (existingTranscription as any).metadata ??
            {},
        };

        wordCount = transcription.words.length;
        segmentCount = transcription.segments?.length || 0;
        audioDuration = transcription.words.length
          ? Math.max(...transcription.words.map((w) => w.endTime))
          : 0;

        stages.transcription = { success: true, duration: 0 };
      }

      // 3. STAGE: Diarization (AssemblyAI via API route)
      if (mode === "diarization-only" || mode === "complete") {
        const diarizationStart = Date.now();

        console.log("👥 [Integration] Calling /api/calls/diarize");
        const diarizationSegments = await this.callDiarizationApi(signedUrl, {
          languageCode: "fr",
          timeoutMs: 10 * 60 * 1000, // 10 minutes
          pollIntervalMs: 3000,
        });

        speakerCount = new Set(diarizationSegments.map((s) => s.speaker)).size;
        stages.diarization = {
          success: true,
          duration: Date.now() - diarizationStart,
        };

        console.log("✅ [Integration] Diarization completed via API", {
          segments: diarizationSegments.length,
          speakers: speakerCount,
        });

        // 4. STAGE: Alignment (words ↔ speakers)
        const alignmentStart = Date.now();

        console.log("🔄 [Integration] Aligning words with speaker segments");
        // Aligne directement sur `Word[]`
        const alignedWords = this.asrService.assignTurnsOverlap(
          this.ensureWords(transcription.words),
          diarizationSegments,
          {
            minOverlapRatio: 0.2,
            inertia: true,
            conflictResolution: "confidence",
          }
        );

        transcription = {
          ...transcription,
          words: alignedWords, // ✅ Word[]
          meta: {
            ...transcription.meta,
            speakerCount,
            diarizationProvider: "assemblyai",
            transcriptionProvider:
              mode === "complete" ? "openai-whisper" : "existing",
            alignmentTolerance: 0.2,
            processedAt: new Date().toISOString(),
          },
        };

        stages.alignment = {
          success: true,
          duration: Date.now() - alignmentStart,
        };

        console.log("✅ [Integration] Alignment completed", {
          wordsWithTurns: alignedWords.filter((w) => w.turn).length,
          coverage: `${(
            (alignedWords.filter((w) => w.turn).length / alignedWords.length) *
            100
          ).toFixed(1)}%`,
        });
      } else {
        stages.diarization = { success: true, duration: 0 };
        stages.alignment = { success: true, duration: 0 };
      }

      // 5. STAGE: Validation
      const validationStart = Date.now();
      const validationResult = this.asrService.validateAll(
        this.ensureWords(transcription.words)
      );

      if (!validationResult.ok) {
        console.warn(
          "⚠️ [Integration] Validation warnings:",
          validationResult.warnings
        );
      }

      console.log(
        "📊 [Integration] Validation metrics:",
        validationResult.metrics
      );

      // ---------- Sauvegarde en base (JSONB) ----------
      // On enrichit le meta sans casser le schéma partagé
      const transcriptionToSave: TranscriptionJson = {
        ...transcription,
        meta: {
          ...(transcription.meta ?? {}),
          source:
            (transcription.meta as any)?.source ??
            (mode === "complete" ? "asr:auto" : "existing"),
          language: (transcription.meta as any)?.language,
          durationSec:
            audioDuration || (transcription as any)?.meta?.durationSec || 0,
          processedAt: new Date().toISOString(),
        },
      };

      // Garde-fous & log de diagnostic
      if (!Array.isArray(transcriptionToSave.words)) {
        console.error(
          "❌ [Integration] transcriptionJson.words must be an array"
        );
      }
      console.log("🔍 [Integration] Before save", {
        callId,
        words: transcriptionToSave.words.length,
        segments: transcriptionToSave.segments?.length ?? 0,
        metaKeys: Object.keys(transcriptionToSave.meta ?? {}),
      });

      // Écriture atomique directe en base (colonne jsonb)
      await this.callRepository.saveTranscriptionJson(
        callId ?? call.id,
        transcriptionToSave
      );

      stages.validation = {
        success: true,
        duration: Date.now() - validationStart,
      };

      const totalProcessingTime = Date.now() - startTime;

      const result: TranscriptionJobResult = {
        success: true,
        callId,
        transcription,
        metrics: {
          processingTime: totalProcessingTime,
          audioDuration,
          wordCount,
          speakerCount,
          segmentCount,
          whisperCost:
            mode === "diarization-only"
              ? 0
              : this.calculateWhisperCost(audioDuration),
          assemblyAICost:
            mode === "transcription-only"
              ? 0
              : this.calculateAssemblyAICost(audioDuration),
          totalCost: this.calculateTotalCost(mode, audioDuration),
        },
        stages,
      };

      console.log("🎉 [Integration] Job completed successfully", {
        callId,
        mode,
        totalTime: `${totalProcessingTime}ms`,
        cost: `$${result.metrics.totalCost.toFixed(4)}`,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Attribution de l'erreur au bon stage
      if (!stages.download.success) stages.download.error = errorMessage;
      else if (!stages.transcription.success)
        stages.transcription.error = errorMessage;
      else if (!stages.diarization.success)
        stages.diarization.error = errorMessage;
      else if (!stages.alignment.success) stages.alignment.error = errorMessage;
      else stages.validation.error = errorMessage;

      console.error("❌ [Integration] Job failed", {
        callId,
        mode,
        error: errorMessage,
        failedStage: Object.keys(stages).find(
          (key) => stages[key as keyof StagesMap].error
        ),
      });

      return {
        success: false,
        callId,
        error: errorMessage,
        metrics: {
          processingTime: Date.now() - startTime,
          audioDuration,
          wordCount,
          speakerCount,
          segmentCount,
          whisperCost: 0,
          assemblyAICost: 0,
          totalCost: 0,
        },
        stages,
      };
    }
  }

  /**
   * Appel à l'API de transcription (/api/calls/transcribe)
   */
  private async callTranscriptionApi(
    fileUrl: string,
    options: {
      prompt?: string;
      language?: string;
      temperature?: number;
    }
  ): Promise<WhisperApiResponse> {
    const response = await fetch("/api/calls/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl,
        options: {
          model: "whisper-1",
          ...options,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Transcription API failed: ${response.status} ${response.statusText}`
      );
    }

    const apiResponse: ApiResponse<WhisperApiResponse> = await response.json();

    if (!apiResponse.success || !apiResponse.result) {
      throw new Error(
        `Transcription failed: ${apiResponse.error?.message || "Unknown error"}`
      );
    }

    return apiResponse.result;
  }

  /**
   * Appel à l'API de diarisation (/api/calls/diarize)
   */
  private async callDiarizationApi(
    fileUrl: string,
    options: {
      languageCode?: string;
      timeoutMs?: number;
      pollIntervalMs?: number;
    }
  ): Promise<DiarizationApiResponse> {
    const response = await fetch("/api/calls/diarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl,
        options,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Diarization API failed: ${response.status} ${response.statusText}`
      );
    }

    const apiResponse: ApiResponse<DiarizationApiResponse> =
      await response.json();

    if (!apiResponse.success || !apiResponse.result) {
      throw new Error(
        `Diarization failed: ${apiResponse.error?.message || "Unknown error"}`
      );
    }

    return apiResponse.result;
  }

  /**
   * Traitement en lot avec gestion de concurrence
   */
  async transcribeBatch(
    callIds: string[],
    options: {
      mode?: TranscriptionMode;
      maxConcurrent?: number;
      pauseBetweenBatches?: number;
      onProgress?: (
        completed: number,
        total: number,
        current?: TranscriptionJobResult
      ) => void;
    } = {}
  ): Promise<BatchTranscriptionResult> {
    const startTime = Date.now();
    const {
      mode = "complete",
      maxConcurrent = 3,
      pauseBetweenBatches = 2000,
      onProgress,
    } = options;

    const results: TranscriptionJobResult[] = [];
    let successfulJobs = 0;
    let failedJobs = 0;
    let totalCost = 0;

    console.log(`📦 [Integration] Starting batch transcription`, {
      totalCalls: callIds.length,
      mode,
      maxConcurrent,
    });

    // Traitement par chunks pour éviter la surcharge
    for (let i = 0; i < callIds.length; i += maxConcurrent) {
      const chunk = callIds.slice(i, i + maxConcurrent);
      const chunkNumber = Math.floor(i / maxConcurrent) + 1;
      const totalChunks = Math.ceil(callIds.length / maxConcurrent);

      console.log(
        `📋 [Integration] Processing chunk ${chunkNumber}/${totalChunks} (${chunk.length} calls)`
      );

      // Traitement concurrent du chunk
      const chunkResults = await Promise.all(
        chunk.map(async (callId) => {
          try {
            const result = await this.transcribeCall(callId, mode);
            if (onProgress) {
              onProgress(results.length + 1, callIds.length, result);
            }
            return result;
          } catch (error) {
            const errorResult: TranscriptionJobResult = {
              success: false,
              callId,
              error: error instanceof Error ? error.message : "Unknown error",
              metrics: {
                processingTime: 0,
                audioDuration: 0,
                wordCount: 0,
                speakerCount: 0,
                segmentCount: 0,
                whisperCost: 0,
                assemblyAICost: 0,
                totalCost: 0,
              },
              stages: {
                download: { success: false, duration: 0, error: "Batch error" },
                transcription: { success: false, duration: 0 },
                diarization: { success: false, duration: 0 },
                alignment: { success: false, duration: 0 },
                validation: { success: false, duration: 0 },
              },
            };
            if (onProgress) {
              onProgress(results.length + 1, callIds.length, errorResult);
            }
            return errorResult;
          }
        })
      );

      // Accumulation des résultats
      for (const result of chunkResults) {
        results.push(result);
        if (result.success) successfulJobs++;
        else failedJobs++;
        totalCost += result.metrics.totalCost;
      }

      console.log(`✅ [Integration] Chunk ${chunkNumber} completed`, {
        successful: chunkResults.filter((r) => r.success).length,
        failed: chunkResults.filter((r) => !r.success).length,
        totalCostChunk: chunkResults
          .reduce((acc, r) => acc + r.metrics.totalCost, 0)
          .toFixed(4),
      });

      // Pause entre les chunks (sauf le dernier)
      if (i + maxConcurrent < callIds.length) {
        console.log(
          `⏳ [Integration] Pausing ${pauseBetweenBatches}ms before next chunk`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, pauseBetweenBatches)
        );
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const averageProcessingTime =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.metrics.processingTime, 0) /
          results.length
        : 0;

    const batchResult: BatchTranscriptionResult = {
      totalJobs: callIds.length,
      successfulJobs,
      failedJobs,
      results,
      totalCost,
      totalProcessingTime,
      averageProcessingTime,
    };

    console.log("🎉 [Integration] Batch completed", {
      total: batchResult.totalJobs,
      successful: batchResult.successfulJobs,
      failed: batchResult.failedJobs,
      successRate: `${((successfulJobs / callIds.length) * 100).toFixed(1)}%`,
      totalCost: `${totalCost.toFixed(4)}`,
      totalTime: `${Math.round(totalProcessingTime / 1000)}s`,
      avgTimePerCall: `${Math.round(averageProcessingTime / 1000)}s`,
    });

    return batchResult;
  }

  /**
   * Métriques consolidées des services (via API)
   */
  async getProvidersMetrics() {
    try {
      const [whisperHealth, assemblyAIHealth] = await Promise.allSettled([
        fetch("/api/calls/transcribe?action=health").then((r) => r.json()),
        fetch("/api/calls/diarize?action=health").then((r) => r.json()),
      ]);

      // Note: Les vraies métriques devraient être stockées en base de données
      // et accessibles via les endpoints GET avec action=metrics

      return {
        whisper: {
          status:
            whisperHealth.status === "fulfilled" && whisperHealth.value.success
              ? "healthy"
              : "unhealthy",
          totalRequests: 0, // À implémenter avec vraies métriques
          totalCost: 0,
          totalMinutesProcessed: 0,
          successRate: 0,
        },
        assemblyAI: {
          status:
            assemblyAIHealth.status === "fulfilled" &&
            assemblyAIHealth.value.success
              ? "healthy"
              : "unhealthy",
          totalRequests: 0,
          totalCost: 0,
          totalMinutesProcessed: 0,
          successRate: 0,
        },
        combined: {
          totalRequests: 0,
          totalCost: 0,
          totalMinutesProcessed: 0,
          averageSuccessRate: 0,
        },
      };
    } catch (error) {
      console.error("❌ [Integration] Failed to get providers metrics:", error);
      return {
        whisper: {
          status: "unknown",
          totalRequests: 0,
          totalCost: 0,
          totalMinutesProcessed: 0,
          successRate: 0,
        },
        assemblyAI: {
          status: "unknown",
          totalRequests: 0,
          totalCost: 0,
          totalMinutesProcessed: 0,
          successRate: 0,
        },
        combined: {
          totalRequests: 0,
          totalCost: 0,
          totalMinutesProcessed: 0,
          averageSuccessRate: 0,
        },
      };
    }
  }

  /**
   * Health check global
   */
  async healthCheck() {
    try {
      console.log("🔍 [Integration] Performing health check");

      const [whisperTest, assemblyAITest] = await Promise.allSettled([
        fetch("/api/calls/transcribe?action=health").then((r) => r.json()),
        fetch("/api/calls/diarize?action=health").then((r) => r.json()),
      ]);

      const whisperHealthy =
        whisperTest.status === "fulfilled" && whisperTest.value.success;
      const assemblyAIHealthy =
        assemblyAITest.status === "fulfilled" && assemblyAITest.value.success;

      let overallStatus: "healthy" | "degraded" | "unhealthy";
      if (whisperHealthy && assemblyAIHealthy) {
        overallStatus = "healthy";
      } else if (whisperHealthy || assemblyAIHealthy) {
        overallStatus = "degraded";
      } else {
        overallStatus = "unhealthy";
      }

      const healthStatus = {
        status: overallStatus,
        providers: {
          whisper: {
            status: whisperHealthy ? "healthy" : "unhealthy",
            lastError:
              whisperTest.status === "rejected"
                ? (whisperTest.reason as Error)?.message
                : undefined,
          },
          assemblyAI: {
            status: assemblyAIHealthy ? "healthy" : "unhealthy",
            lastError:
              assemblyAITest.status === "rejected"
                ? (assemblyAITest.reason as Error)?.message
                : undefined,
          },
          storage: { status: "healthy" }, // Supposé OK si on arrive ici
          database: { status: "healthy" }, // Supposé OK si on arrive ici
        },
        lastChecked: new Date().toISOString(),
      };

      console.log("✅ [Integration] Health check completed", {
        overall: overallStatus,
        whisper: whisperHealthy,
        assemblyAI: assemblyAIHealthy,
      });

      return healthStatus;
    } catch (error) {
      console.error("❌ [Integration] Health check failed:", error);
      return {
        status: "unhealthy" as const,
        providers: {
          whisper: { status: "unhealthy" },
          assemblyAI: { status: "unhealthy" },
          storage: { status: "unhealthy" },
          database: { status: "unhealthy" },
        },
        lastError: error instanceof Error ? error.message : "Unknown error",
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Nettoyage / réinitialisation
   */
  async cleanup(): Promise<void> {
    console.log(
      "🧹 [Integration] Cleanup completed (no persistent state to clean)"
    );
    // Note: Avec l'architecture API routes, il n'y a pas d'état persistant côté service
    // Le nettoyage se ferait côté base de données si nécessaire
  }

  /**
   * Génération de prompt contextuel pour Whisper
   */
  private generateContextPrompt(call: any): string {
    const contextParts = [
      "Centre de contact",
      "Service client",
      "Conversation téléphonique",
    ];

    // Contexte spécifique selon l'origine
    if (call.origin) {
      const origin = call.origin.toLowerCase();
      if (origin.includes("assurance")) {
        contextParts.push("assurance", "sinistre", "contrat", "indemnisation");
      } else if (origin.includes("amende")) {
        contextParts.push(
          "amende",
          "contravention",
          "paiement",
          "contestation"
        );
      } else if (origin.includes("colis") || origin.includes("courrier")) {
        contextParts.push("colis", "livraison", "suivi", "transporteur");
      }
    }

    const prompt = contextParts.slice(0, 10).join(", ");
    console.log(`📝 [Integration] Generated context prompt: "${prompt}"`);

    return prompt;
  }

  /**
   * Calculs de coût
   */
  private calculateWhisperCost(durationSeconds: number): number {
    return Math.ceil(durationSeconds / 60) * 0.006; // $0.006 per minute
  }

  private calculateAssemblyAICost(durationSeconds: number): number {
    return Math.ceil(durationSeconds / 60) * 0.00065; // $0.00065 per minute
  }

  private calculateTotalCost(
    mode: TranscriptionMode,
    durationSeconds: number
  ): number {
    switch (mode) {
      case "transcription-only":
        return this.calculateWhisperCost(durationSeconds);
      case "diarization-only":
        return this.calculateAssemblyAICost(durationSeconds);
      case "complete":
        return (
          this.calculateWhisperCost(durationSeconds) +
          this.calculateAssemblyAICost(durationSeconds)
        );
      default:
        return 0;
    }
  }
}

/**
 * Factory function pour créer le service avec les dépendances
 */
export function createTranscriptionIntegrationService(
  callRepository: CallRepository,
  storageRepository: StorageRepository
): TranscriptionIntegrationService {
  return new TranscriptionIntegrationService(callRepository, storageRepository);
}
