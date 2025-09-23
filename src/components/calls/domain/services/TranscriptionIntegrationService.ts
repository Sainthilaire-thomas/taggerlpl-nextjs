// src/components/calls/domain/services/TranscriptionIntegrationService.ts

import {
  OpenAIWhisperProvider,
  WhisperResponse,
} from "../../infrastructure/asr/OpenAIWhisperProvider";
import { AssemblyAIDiarizationProvider } from "../../infrastructure/diarization/AssemblyAIDiarizationProvider";
import { TranscriptionASRService } from "./TranscriptionASRService";
import { DiarizationService } from "./DiarizationService";
import { CallRepository } from "../repositories/CallRepository";
import { StorageRepository } from "../repositories/StorageRepository";
import { TranscriptionJson } from "../../shared/types/TranscriptionTypes";
import { validateTranscriptionConfig } from "@/lib/config/transcriptionConfig";

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

// Types pour les étapes (permet d'ajouter .error sans erreur TS)
type StageStatus = { success: boolean; duration: number; error?: string };

type StagesMap = {
  download: StageStatus;
  transcription: StageStatus;
  diarization: StageStatus;
  alignment: StageStatus;
  validation: StageStatus;
};

// Helper : récupère une fin de mot en secondes, quel que soit le shape réel
function getWordEndSec(w: any): number {
  // essaie plusieurs conventions possibles
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
 * Service d'intégration enrichi pour orchestrer la transcription automatique complète
 *
 * Nouveautés par rapport à votre version actuelle :
 * - Diarisation via AssemblyAI
 * - Alignement temporel ASR + Diarisation
 * - Modes de transcription flexibles
 * - Métriques détaillées par étape
 * - Gestion des erreurs granulaire
 */
export class TranscriptionIntegrationService {
  private readonly whisperProvider: OpenAIWhisperProvider;
  private readonly assemblyAIProvider: AssemblyAIDiarizationProvider;
  private readonly asrService: TranscriptionASRService;
  private readonly diarizationService: DiarizationService;

  constructor(
    private readonly callRepository: CallRepository,
    private readonly storageRepository: StorageRepository
  ) {
    // Validation config au démarrage
    validateTranscriptionConfig();

    this.whisperProvider = new OpenAIWhisperProvider();
    this.assemblyAIProvider = new AssemblyAIDiarizationProvider();
    this.asrService = new TranscriptionASRService();
    this.diarizationService = new DiarizationService(this.assemblyAIProvider);

    console.log(
      "🚀 Enhanced TranscriptionIntegrationService initialized with diarization"
    );
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Transcription complète (ASR + Diarisation + Alignement)
   */
  async transcribeComplete(callId: string): Promise<TranscriptionJobResult> {
    return this.transcribeCall(callId, "complete");
  }

  /**
   * Transcription ASR seulement (votre version actuelle conservée)
   */
  async transcribeOnly(callId: string): Promise<TranscriptionJobResult> {
    return this.transcribeCall(callId, "transcription-only");
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Diarisation sur transcription existante
   */
  async diarizeExisting(callId: string): Promise<TranscriptionJobResult> {
    return this.transcribeCall(callId, "diarization-only");
  }

  /**
   * Méthode principale unifiée avec modes de transcription
   */
  private async transcribeCall(
    callId: string,
    mode: TranscriptionMode = "complete"
  ): Promise<TranscriptionJobResult> {
    const startTime = Date.now();
    let audioDuration = 0;
    let wordCount = 0;
    let speakerCount = 0;

    // Tracking détaillé des étapes
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

      // ==================================================================================
      // ÉTAPE 1 : PRÉPARATION (commune à tous les modes)
      // ==================================================================================
      const stageStart = Date.now();

      const call = await this.callRepository.findById(callId);
      if (!call) {
        throw new Error(`Call ${callId} not found`);
      }

      const audioFile = call.getAudioFile();
      if (!audioFile || !audioFile.isPlayable()) {
        throw new Error(`Call ${callId} has no playable audio file`);
      }

      // Génération URL signée (3 heures pour les traitements longs)
      const signedUrl = await this.storageRepository.generateSignedUrl(
        audioFile.path,
        10800 // 3 heures
      );

      stages.download = {
        success: true,
        duration: Date.now() - stageStart,
      };

      // ==================================================================================
      // ÉTAPE 2 : TRANSCRIPTION ASR (si nécessaire)
      // ==================================================================================

      if (mode === "transcription-only" || mode === "complete") {
        console.log(`📡 Transcribing audio with OpenAI Whisper...`);
        const transcriptionStart = Date.now();

        const whisperResponse = await this.whisperProvider.transcribeAudio(
          signedUrl,
          {
            prompt: this.generateContextPrompt(call),
            language: "fr",
            temperature: 0.0, // Maximiser la cohérence
          }
        );

        // Normalisation au format TaggerLPL
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

        console.log(
          `✅ Transcription completed: ${wordCount} words, ${audioDuration}s`
        );
      } else if (mode === "diarization-only") {
        // Récupérer la transcription existante
        const existingTranscription = call.getTranscription();
        if (!existingTranscription) {
          throw new Error(
            `Call ${callId} has no existing transcription for diarization`
          );
        }

        transcription = {
          words: Array.isArray(existingTranscription.words)
            ? existingTranscription.words
            : [],
          meta: existingTranscription.metadata || {},
        };

        wordCount = transcription.words.length;
        // Estimation durée depuis les mots
        audioDuration =
          transcription.words.length > 0
            ? Math.max(...transcription.words.map((w) => getWordEndSec(w)))
            : 0;

        stages.transcription = { success: true, duration: 0 }; // Existante
      }

      // ==================================================================================
      // ÉTAPE 3 : DIARISATION (si nécessaire)
      // ==================================================================================
      if (mode === "diarization-only" || mode === "complete") {
        console.log(`👥 Inferring speakers with AssemblyAI...`);
        const diarizationStart = Date.now();

        const diarizationSegments = await this.assemblyAIProvider.inferSpeakers(
          signedUrl,
          {
            languageCode: "fr",
            timeoutMs: 10 * 60 * 1000, // 10 minutes
            pollIntervalMs: 3000, // 3 secondes
          }
        );

        speakerCount = new Set(diarizationSegments.map((s) => s.speaker)).size;

        stages.diarization = {
          success: true,
          duration: Date.now() - diarizationStart,
        };

        console.log(
          `✅ Diarization completed: ${diarizationSegments.length} segments, ${speakerCount} speakers`
        );

        // ==================================================================================
        // ÉTAPE 4 : ALIGNEMENT TEMPOREL
        // ==================================================================================
        console.log(`🔗 Aligning transcription with diarization...`);
        const alignmentStart = Date.now();

        const alignedWords = this.diarizationService.assignTurnsToWords(
          transcription.words,
          diarizationSegments,
          { toleranceSec: 0.2 } // 200ms de tolérance
        );

        // Mise à jour de la transcription avec speakers
        transcription = {
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
        // Mode transcription-only : pas de diarisation
        stages.diarization = { success: true, duration: 0 }; // Skippée
        stages.alignment = { success: true, duration: 0 }; // Skippée
      }

      // ==================================================================================
      // ÉTAPE 5 : VALIDATION ET SAUVEGARDE
      // ==================================================================================
      console.log(`✅ Validating and saving transcription...`);
      const validationStart = Date.now();

      const validationResult = this.asrService.validateAll(transcription.words);
      if (!validationResult.ok) {
        console.warn(
          `⚠️ Validation warnings for call ${callId}:`,
          validationResult.warnings
        );
      }

      // Mise à jour de l'appel avec la transcription enrichie
      const updatedCall = call.withTranscription({
        words: transcription.words,
        metadata: transcription.meta,
      } as any);

      await this.callRepository.update(updatedCall);

      stages.validation = {
        success: true,
        duration: Date.now() - validationStart,
      };

      const totalProcessingTime = Date.now() - startTime;

      console.log(
        `🎊 ${mode} transcription finished for call ${callId} in ${totalProcessingTime}ms`
      );

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
      console.error(
        `❌ ${mode} transcription failed for call ${callId}:`,
        error
      );

      // Attribution de l'erreur à l'étape qui a échoué
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (!stages.download.success) {
        stages.download.error = errorMessage;
      } else if (!stages.transcription.success) {
        stages.transcription.error = errorMessage;
      } else if (!stages.diarization.success) {
        stages.diarization.error = errorMessage;
      } else if (!stages.alignment.success) {
        stages.alignment.error = errorMessage;
      } else {
        stages.validation.error = errorMessage;
      }

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

  /**
   * ✅ ENRICHISSEMENT : Transcription en lot avec modes flexibles
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

    console.log(
      `🚀 Starting batch ${mode} for ${callIds.length} calls (max ${maxConcurrent} concurrent)`
    );

    const results: TranscriptionJobResult[] = [];
    let successfulJobs = 0;
    let failedJobs = 0;
    let totalCost = 0;

    // Traitement par chunks pour contrôler la charge
    for (let i = 0; i < callIds.length; i += maxConcurrent) {
      const chunk = callIds.slice(i, i + maxConcurrent);

      console.log(
        `📦 Processing chunk ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(
          callIds.length / maxConcurrent
        )} (${chunk.length} calls)`
      );

      // Traitement parallèle du chunk
      const chunkPromises = chunk.map(async (callId) => {
        try {
          const result = await this.transcribeCall(callId, mode);

          // Callback de progression
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
              whisperCost: 0,
              assemblyAICost: 0,
              totalCost: 0,
            },
            stages: {
              download: {
                success: false,
                duration: 0,
                error: "Batch processing error",
              },
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
      });

      const chunkResults = await Promise.all(chunkPromises);

      // Agrégation des résultats
      for (const result of chunkResults) {
        results.push(result);

        if (result.success) {
          successfulJobs++;
        } else {
          failedJobs++;
        }

        totalCost += result.metrics.totalCost;
      }

      // Pause entre les chunks pour éviter le rate limiting
      if (i + maxConcurrent < callIds.length) {
        console.log(`⏸️ Pausing ${pauseBetweenBatches}ms between chunks...`);
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

    console.log(
      `✅ Batch ${mode} completed: ${successfulJobs}/${
        callIds.length
      } successful, total cost: $${totalCost.toFixed(
        4
      )}, average time: ${Math.round(averageProcessingTime)}ms`
    );

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

  /**
   * ✅ NOUVELLE MÉTHODE : Statistiques globales des providers
   */
  async getProvidersMetrics() {
    const whisperMetrics = this.whisperProvider.getMetrics();
    const assemblyAIMetrics = this.assemblyAIProvider.getMetrics();

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

  /**
   * Génère un prompt contextuel pour améliorer la précision Whisper (conservé de votre version)
   */
  private generateContextPrompt(call: any): string {
    const contextParts = [
      "Centre de contact",
      "Service client",
      "Conversation téléphonique",
    ];

    // Ajouter contexte selon l'origine
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

    return contextParts.slice(0, 10).join(", ");
  }

  /**
   * Calculs des coûts enrichis
   */
  private calculateWhisperCost(durationSeconds: number): number {
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * 0.006; // $0.006 per minute OpenAI Whisper
  }

  private calculateAssemblyAICost(durationSeconds: number): number {
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * 0.00065; // $0.00065 per minute AssemblyAI
  }

  private calculateTotalCost(
    mode: TranscriptionMode,
    durationSeconds: number
  ): number {
    let total = 0;

    if (mode === "transcription-only") {
      total = this.calculateWhisperCost(durationSeconds);
    } else if (mode === "diarization-only") {
      total = this.calculateAssemblyAICost(durationSeconds);
    } else if (mode === "complete") {
      total =
        this.calculateWhisperCost(durationSeconds) +
        this.calculateAssemblyAICost(durationSeconds);
    }

    return total;
  }

  /**
   * Health check enrichi (conservé de votre version)
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    providers: {
      whisper: { status: string; error?: string };
      assemblyAI: { status: string; error?: string };
      storage: { status: string; error?: string };
      database: { status: string; error?: string };
    };
    lastError?: string;
  }> {
    try {
      // Tests en parallèle
      const [whisperHealth, assemblyAIHealth] = await Promise.allSettled([
        Promise.resolve({ status: "healthy" }), // TODO: Ping OpenAI API
        this.assemblyAIProvider.healthCheck(),
      ]);

      const providers = {
        whisper:
          whisperHealth.status === "fulfilled"
            ? { status: "healthy" }
            : { status: "unhealthy", error: "Whisper check failed" },
        assemblyAI:
          assemblyAIHealth.status === "fulfilled"
            ? assemblyAIHealth.value
            : { status: "unhealthy", error: "AssemblyAI check failed" },
        storage: { status: "healthy" }, // TODO: Test Supabase Storage
        database: { status: "healthy" }, // TODO: Test database connection
      };

      const healthyCount = Object.values(providers).filter(
        (p) => p.status === "healthy"
      ).length;

      let globalStatus: "healthy" | "degraded" | "unhealthy";
      if (healthyCount === 4) {
        globalStatus = "healthy";
      } else if (healthyCount >= 2) {
        globalStatus = "degraded";
      } else {
        globalStatus = "unhealthy";
      }

      return {
        status: globalStatus,
        providers,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        providers: {
          whisper: { status: "unhealthy", error: "Health check failed" },
          assemblyAI: { status: "unhealthy", error: "Health check failed" },
          storage: { status: "unhealthy", error: "Health check failed" },
          database: { status: "unhealthy", error: "Health check failed" },
        },
        lastError: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Nettoyage des ressources enrichi
   */
  async cleanup(): Promise<void> {
    console.log(
      "🧹 Cleaning up Enhanced TranscriptionIntegrationService resources"
    );

    // Reset métriques des providers
    this.whisperProvider.resetMetrics();
    this.assemblyAIProvider.resetMetrics();
  }
}

/**
 * Factory pour créer le service avec les dépendances injectées (conservée)
 */
export function createTranscriptionIntegrationService(
  callRepository: CallRepository,
  storageRepository: StorageRepository
): TranscriptionIntegrationService {
  return new TranscriptionIntegrationService(callRepository, storageRepository);
}
