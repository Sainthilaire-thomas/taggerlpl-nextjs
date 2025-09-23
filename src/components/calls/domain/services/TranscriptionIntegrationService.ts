// src/components/calls/domain/services/TranscriptionIntegrationService.ts

import {
  OpenAIWhisperProvider,
  WhisperResponse,
} from "../../infrastructure/asr/OpenAIWhisperProvider";
import { TranscriptionASRService } from "./TranscriptionASRService";
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
    cost: number;
  };
}

export interface BatchTranscriptionResult {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  results: TranscriptionJobResult[];
  totalCost: number;
  totalProcessingTime: number;
}

/**
 * Service d'intégration pour orchestrer la transcription automatique
 * Fait le lien entre les providers ASR, les services domain et l'UI
 */
export class TranscriptionIntegrationService {
  private readonly whisperProvider: OpenAIWhisperProvider;
  private readonly asrService: TranscriptionASRService;

  constructor(
    private readonly callRepository: CallRepository,
    private readonly storageRepository: StorageRepository
  ) {
    // Validation config au démarrage
    validateTranscriptionConfig();

    this.whisperProvider = new OpenAIWhisperProvider();
    this.asrService = new TranscriptionASRService();

    console.log("🚀 TranscriptionIntegrationService initialized");
  }

  /**
   * Transcrit automatiquement un appel complet
   *
   * @param callId ID de l'appel à transcrire
   * @returns Résultat de la transcription
   */
  async transcribeCall(callId: string): Promise<TranscriptionJobResult> {
    const startTime = Date.now();

    try {
      console.log(`🎙️ Starting auto-transcription for call ${callId}`);

      // 1. Récupérer l'appel et vérifier l'audio
      const call = await this.callRepository.findById(callId);
      if (!call) {
        throw new Error(`Call ${callId} not found`);
      }

      const audioFile = call.getAudioFile();
      if (!audioFile || !audioFile.isPlayable()) {
        throw new Error(`Call ${callId} has no playable audio file`);
      }

      // 2. Générer URL signée pour l'audio
      const signedUrl = await this.storageRepository.generateSignedUrl(
        audioFile.path,
        3600 // 1 heure
      );

      // 3. Transcription via OpenAI Whisper
      console.log(`📡 Calling Whisper API for call ${callId}`);
      const whisperResponse = await this.whisperProvider.transcribeAudio(
        signedUrl,
        {
          prompt: this.generateContextPrompt(call), // Context hint pour améliorer précision
        }
      );

      // 4. Normalisation au format TaggerLPL
      console.log(`🔄 Normalizing Whisper response for call ${callId}`);
      const normalizedTranscription = this.asrService.normalize(
        whisperResponse,
        {
          language: "fr-FR",
          source: "asr:auto",
        }
      );

      // 5. Validation de la transcription
      const validationResult = this.asrService.validateAll(
        normalizedTranscription.words
      );
      if (!validationResult.ok) {
        console.warn(
          `⚠️ Transcription validation warnings for call ${callId}:`,
          validationResult.warnings
        );
      }

      // 6. Sauvegarde dans la base
      const updatedCall = call.withTranscription({
        words: normalizedTranscription.words,
        metadata: normalizedTranscription.meta,
      } as any);

      await this.callRepository.update(updatedCall);

      const processingTime = Date.now() - startTime;

      console.log(
        `✅ Auto-transcription completed for call ${callId} in ${processingTime}ms`
      );

      return {
        success: true,
        callId,
        transcription: normalizedTranscription,
        metrics: {
          processingTime,
          audioDuration: whisperResponse.duration,
          wordCount: normalizedTranscription.words.length,
          cost: this.calculateTranscriptionCost(whisperResponse.duration),
        },
      };
    } catch (error) {
      console.error(`❌ Auto-transcription failed for call ${callId}:`, error);

      return {
        success: false,
        callId,
        error: error instanceof Error ? error.message : "Unknown error",
        metrics: {
          processingTime: Date.now() - startTime,
          audioDuration: 0,
          wordCount: 0,
          cost: 0,
        },
      };
    }
  }

  /**
   * Transcription en lot avec contrôle de parallélisme
   *
   * @param callIds Liste des IDs d'appels à transcrire
   * @param maxConcurrent Nombre maximum de transcriptions simultanées
   * @returns Résultat global du batch
   */
  async transcribeBatch(
    callIds: string[],
    maxConcurrent: number = 5
  ): Promise<BatchTranscriptionResult> {
    const startTime = Date.now();

    console.log(
      `🚀 Starting batch transcription for ${callIds.length} calls (max ${maxConcurrent} concurrent)`
    );

    const results: TranscriptionJobResult[] = [];
    let successfulJobs = 0;
    let failedJobs = 0;
    let totalCost = 0;

    // Traitement par chunks pour contrôler le parallélisme
    for (let i = 0; i < callIds.length; i += maxConcurrent) {
      const chunk = callIds.slice(i, i + maxConcurrent);

      console.log(
        `📦 Processing chunk ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(
          callIds.length / maxConcurrent
        )} (${chunk.length} calls)`
      );

      // Traitement parallèle du chunk
      const chunkPromises = chunk.map((callId) =>
        this.transcribeCall(callId).catch(
          (error) =>
            ({
              success: false,
              callId,
              error: error.message,
              metrics: {
                processingTime: 0,
                audioDuration: 0,
                wordCount: 0,
                cost: 0,
              },
            } as TranscriptionJobResult)
        )
      );

      const chunkResults = await Promise.all(chunkPromises);

      // Agrégation des résultats
      for (const result of chunkResults) {
        results.push(result);

        if (result.success) {
          successfulJobs++;
        } else {
          failedJobs++;
        }

        totalCost += result.metrics.cost;
      }

      // Pause entre les chunks pour éviter le rate limiting
      if (i + maxConcurrent < callIds.length) {
        console.log("⏸️ Pausing between chunks to respect rate limits...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 secondes
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    console.log(
      `✅ Batch transcription completed: ${successfulJobs}/${
        callIds.length
      } successful, total cost: $${totalCost.toFixed(4)}`
    );

    return {
      totalJobs: callIds.length,
      successfulJobs,
      failedJobs,
      results,
      totalCost,
      totalProcessingTime,
    };
  }

  /**
   * Génère un prompt contextuel pour améliorer la précision Whisper
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

    return contextParts.slice(0, 10).join(", "); // Limite pour éviter les prompts trop longs
  }

  /**
   * Calcul du coût de transcription basé sur la durée
   */
  private calculateTranscriptionCost(durationSeconds: number): number {
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * 0.006; // $0.006 per minute OpenAI Whisper
  }

  /**
   * Statistiques globales du provider
   */
  async getProviderMetrics() {
    return this.whisperProvider.getMetrics();
  }

  /**
   * Validation de la santé du service
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    providers: {
      whisper: boolean;
      storage: boolean;
      database: boolean;
    };
    lastError?: string;
  }> {
    try {
      const providers = {
        whisper: true, // TODO: Ping OpenAI API
        storage: true, // TODO: Test Supabase Storage
        database: true, // TODO: Test database connection
      };

      const allHealthy = Object.values(providers).every(Boolean);

      return {
        status: allHealthy ? "healthy" : "degraded",
        providers,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        providers: {
          whisper: false,
          storage: false,
          database: false,
        },
        lastError: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Nettoyage des ressources
   */
  async cleanup(): Promise<void> {
    console.log("🧹 Cleaning up TranscriptionIntegrationService resources");
    // Cleanup si nécessaire (connexions, caches, etc.)
  }
}

/**
 * Factory pour créer le service avec les dépendances injectées
 */
export function createTranscriptionIntegrationService(
  callRepository: CallRepository,
  storageRepository: StorageRepository
): TranscriptionIntegrationService {
  return new TranscriptionIntegrationService(callRepository, storageRepository);
}
