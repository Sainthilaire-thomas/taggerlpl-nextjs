// src/components/calls/domain/services/TranscriptionIntegrationService.ts

import { TranscriptionASRService } from "./TranscriptionASRService";
import { DiarizationService } from "./DiarizationService";
import { CallRepository } from "../repositories/CallRepository";
import { StorageRepository } from "../repositories/StorageRepository";
import { TranscriptionJson } from "../../shared/types/TranscriptionTypes";
import { validateTranscriptionConfig } from "@/lib/config/transcriptionConfig";
import { TranscriptionApiClient } from "../../infrastructure/api/TranscriptionApiClient";
import { DiarizationApiClient } from "../../infrastructure/api/DiarizationApiClient";

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

type StageStatus = { success: boolean; duration: number; error?: string };
type StagesMap = {
  download: StageStatus;
  transcription: StageStatus;
  diarization: StageStatus;
  alignment: StageStatus;
  validation: StageStatus;
};

// Helper pour récupérer une fin de mot en secondes (tolérant aux shapes variés)
function getWordEndSec(w: any): number {
  if (typeof w?.end === "number") return w.end;
  if (typeof w?.endSec === "number") return w.endSec;
  if (typeof w?.offsetEnd === "number") return w.offsetEnd;
  if (typeof w?.start === "number" && typeof w?.duration === "number")
    return w.start + w.duration;
  return 0;
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

/**
 * Service d'intégration : orchestration de la transcription (ASR + Diarisation + Alignement)
 */
export class TranscriptionIntegrationService {
  private readonly transcriptionClient: TranscriptionApiClient;
  private readonly diarizationClient: DiarizationApiClient;
  private readonly asrService: TranscriptionASRService;
  private readonly diarizationService: DiarizationService;

  constructor(
    private readonly callRepository: CallRepository,
    private readonly storageRepository: StorageRepository
  ) {
    validateTranscriptionConfig();

    this.transcriptionClient = new TranscriptionApiClient("");
    this.diarizationClient = new DiarizationApiClient("");
    this.asrService = new TranscriptionASRService();
    this.diarizationService = new DiarizationService(this.diarizationClient);

    console.log("🚀 TranscriptionIntegrationService initialized");
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

  private async transcribeCall(
    callId: string,
    mode: TranscriptionMode = "complete"
  ): Promise<TranscriptionJobResult> {
    const startTime = Date.now();
    let audioDuration = 0;
    let wordCount = 0;
    let speakerCount = 0;

    const stages: StagesMap = {
      download: { success: false, duration: 0 },
      transcription: { success: false, duration: 0 },
      diarization: { success: false, duration: 0 },
      alignment: { success: false, duration: 0 },
      validation: { success: false, duration: 0 },
    };

    let transcription: TranscriptionJson = { words: [], meta: {} };

    try {
      console.log(`🎙️ Starting ${mode} for call ${callId}`);

      // 1. Téléchargement
      const stageStart = Date.now();
      const call = await this.callRepository.findById(callId);
      if (!call) throw new Error(`Call ${callId} not found`);

      const audioFile = call.getAudioFile();
      if (!audioFile || !audioFile.isPlayable())
        throw new Error(`Call ${callId} has no playable audio file`);

      const signedUrl = await this.storageRepository.generateSignedUrl(
        audioFile.path,
        10800
      );
      stages.download = { success: true, duration: Date.now() - stageStart };

      // 2. Transcription
      if (mode === "transcription-only" || mode === "complete") {
        const transcriptionStart = Date.now();
        const whisperResponse = await this.transcriptionClient.transcribeAudio(
          signedUrl,
          {
            prompt: this.generateContextPrompt(call),
            language: "fr",
            temperature: 0,
          }
        );

        transcription = this.asrService.normalize(whisperResponse, {
          language: "fr-FR",
          source: "asr:auto",
        });

        audioDuration =
          transcription.words.length > 0
            ? Math.max(...transcription.words.map((w) => getWordEndSec(w)))
            : 0;

        stages.transcription = {
          success: true,
          duration: Date.now() - transcriptionStart,
        };
        wordCount = transcription.words.length;
      } else if (mode === "diarization-only") {
        const existingTranscription = call.getTranscription();
        if (!existingTranscription)
          throw new Error(`Call ${callId} has no existing transcription`);

        transcription = {
          words: Array.isArray(existingTranscription.words)
            ? existingTranscription.words
            : [],
          meta: existingTranscription.metadata || {},
        };

        wordCount = transcription.words.length;
        audioDuration =
          wordCount > 0
            ? Math.max(...transcription.words.map((w) => getWordEndSec(w)))
            : 0;
        stages.transcription = { success: true, duration: 0 };
      }

      // 3. Diarisation
      if (mode === "diarization-only" || mode === "complete") {
        const diarizationStart = Date.now();
        const diarizationSegments = await this.diarizationClient.inferSpeakers(
          signedUrl,
          {
            languageCode: "fr",
            timeoutMs: 10 * 60 * 1000,
            pollIntervalMs: 3000,
          }
        );

        speakerCount = new Set(diarizationSegments.map((s) => s.speaker)).size;
        stages.diarization = {
          success: true,
          duration: Date.now() - diarizationStart,
        };

        // 4. Alignement
        const alignmentStart = Date.now();
        const alignedWords = this.diarizationService.assignTurnsToWords(
          transcription.words,
          diarizationSegments,
          { toleranceSec: 0.2 }
        );

        transcription = {
          ...transcription,
          words: alignedWords,
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
      } else {
        stages.diarization = { success: true, duration: 0 };
        stages.alignment = { success: true, duration: 0 };
      }

      // 5. Validation
      const validationStart = Date.now();
      const validationResult = this.asrService.validateAll(transcription.words);
      if (!validationResult.ok)
        console.warn("⚠️ Validation warnings:", validationResult.warnings);

      const updatedCall = call.withTranscription({
        words: transcription.words,
        metadata: transcription.meta,
        segments: transcription.segments,
      } as any);
      await this.callRepository.update(updatedCall);

      stages.validation = {
        success: true,
        duration: Date.now() - validationStart,
      };

      const totalProcessingTime = Date.now() - startTime;

      return {
        success: true,
        callId,
        transcription,
        metrics: {
          processingTime: totalProcessingTime,
          audioDuration,
          wordCount,
          speakerCount,
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (!stages.download.success) stages.download.error = errorMessage;
      else if (!stages.transcription.success)
        stages.transcription.error = errorMessage;
      else if (!stages.diarization.success)
        stages.diarization.error = errorMessage;
      else if (!stages.alignment.success) stages.alignment.error = errorMessage;
      else stages.validation.error = errorMessage;

      return {
        success: false,
        callId,
        error: errorMessage,
        metrics: {
          processingTime: Date.now() - startTime,
          audioDuration,
          wordCount,
          speakerCount,
          whisperCost: 0,
          assemblyAICost: 0,
          totalCost: 0,
        },
        stages,
      };
    }
  }

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

    for (let i = 0; i < callIds.length; i += maxConcurrent) {
      const chunk = callIds.slice(i, i + maxConcurrent);
      const chunkResults = await Promise.all(
        chunk.map(async (callId) => {
          try {
            const result = await this.transcribeCall(callId, mode);
            if (onProgress)
              onProgress(results.length + 1, callIds.length, result);
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
            if (onProgress)
              onProgress(results.length + 1, callIds.length, errorResult);
            return errorResult;
          }
        })
      );

      for (const r of chunkResults) {
        results.push(r);
        if (r.success) successfulJobs++;
        else failedJobs++;
        totalCost += r.metrics.totalCost;
      }

      if (i + maxConcurrent < callIds.length) {
        await new Promise((res) => setTimeout(res, pauseBetweenBatches));
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const averageProcessingTime =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.metrics.processingTime, 0) /
          results.length
        : 0;

    return {
      totalJobs: callIds.length,
      successfulJobs,
      failedJobs,
      results,
      totalCost,
      totalProcessingTime,
      averageProcessingTime,
    };
  }

  async getProvidersMetrics() {
    const whisperMetrics = await this.transcriptionClient.getMetrics();
    const assemblyAIMetrics = await this.diarizationClient.getMetrics();
    return {
      whisper: whisperMetrics,
      assemblyAI: assemblyAIMetrics,
      combined: {
        totalRequests:
          whisperMetrics.totalRequests + assemblyAIMetrics.totalRequests,
        totalCost: whisperMetrics.totalCost + assemblyAIMetrics.totalCost,
        totalMinutesProcessed: Math.max(
          whisperMetrics.totalMinutesProcessed,
          assemblyAIMetrics.totalMinutesProcessed
        ),
        averageSuccessRate:
          (whisperMetrics.successRate + assemblyAIMetrics.successRate) / 2,
      },
    };
  }

  private generateContextPrompt(call: any): string {
    const contextParts = [
      "Centre de contact",
      "Service client",
      "Conversation téléphonique",
    ];
    if (call.origin) {
      const origin = call.origin.toLowerCase();
      if (origin.includes("assurance"))
        contextParts.push("assurance", "sinistre", "contrat", "indemnisation");
      else if (origin.includes("amende"))
        contextParts.push(
          "amende",
          "contravention",
          "paiement",
          "contestation"
        );
      else if (origin.includes("colis") || origin.includes("courrier"))
        contextParts.push("colis", "livraison", "suivi", "transporteur");
    }
    return contextParts.slice(0, 10).join(", ");
  }

  private calculateWhisperCost(durationSeconds: number): number {
    return Math.ceil(durationSeconds / 60) * 0.006;
  }
  private calculateAssemblyAICost(durationSeconds: number): number {
    return Math.ceil(durationSeconds / 60) * 0.00065;
  }
  private calculateTotalCost(
    mode: TranscriptionMode,
    durationSeconds: number
  ): number {
    if (mode === "transcription-only")
      return this.calculateWhisperCost(durationSeconds);
    if (mode === "diarization-only")
      return this.calculateAssemblyAICost(durationSeconds);
    return (
      this.calculateWhisperCost(durationSeconds) +
      this.calculateAssemblyAICost(durationSeconds)
    );
  }

  async healthCheck() {
    try {
      const [whisperHealth, assemblyAIHealth] = await Promise.allSettled([
        this.transcriptionClient.healthCheck(),
        this.diarizationClient.healthCheck(),
      ]);
      return {
        status:
          whisperHealth.status === "fulfilled" &&
          assemblyAIHealth.status === "fulfilled"
            ? "healthy"
            : "degraded",
        providers: {
          whisper:
            whisperHealth.status === "fulfilled"
              ? { status: "healthy" }
              : { status: "unhealthy" },
          assemblyAI:
            assemblyAIHealth.status === "fulfilled"
              ? assemblyAIHealth.value
              : { status: "unhealthy" },
          storage: { status: "healthy" },
          database: { status: "healthy" },
        },
      };
    } catch (err) {
      return {
        status: "unhealthy",
        providers: {
          whisper: { status: "unhealthy" },
          assemblyAI: { status: "unhealthy" },
          storage: { status: "unhealthy" },
          database: { status: "unhealthy" },
        },
        lastError: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async cleanup(): Promise<void> {
    this.transcriptionClient.resetMetrics();
    this.diarizationClient.resetMetrics();
  }
}

export function createTranscriptionIntegrationService(
  callRepository: CallRepository,
  storageRepository: StorageRepository
) {
  return new TranscriptionIntegrationService(callRepository, storageRepository);
}
