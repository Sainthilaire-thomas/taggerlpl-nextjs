// src/components/calls/infrastructure/ServiceFactory.ts - VERSION REFACTORÉE (API CÔTÉ SERVEUR)

import { SupabaseCallRepository } from "./supabase/SupabaseCallRepository";
import { SupabaseStorageRepository } from "./supabase/SupabaseStorageRepository";
import { CallService } from "../domain/services/CallService";
import { ValidationService } from "../domain/services/ValidationService";
import { DuplicateService } from "../domain/services/DuplicateService";
import { StorageService } from "../domain/services/StorageService";
import { TranscriptionTransformationService } from "../domain/services/TranscriptionTransformationService";
import { CallFilteringService } from "../domain/services/CallFilteringService";

// ✅ NOUVEAUX IMPORTS - Clients API sécurisés
import { TranscriptionApiClient } from "./api/TranscriptionApiClient";
import { DiarizationApiClient } from "./api/DiarizationApiClient";
import { CallsApiClient } from "./api/CallsApiClient";

// ✅ Import du service de diarisation (interface reste identique)
import { DiarizationService } from "../domain/services/DiarizationService";
import type {
  DiarizationSegment,
  Word,
} from "../shared/types/TranscriptionTypes";

/**
 * Factory pour créer et configurer tous les services DDD
 *
 * VERSION REFACTORÉE :
 * - OpenAI/AssemblyAI déplacés côté serveur (API routes)
 * - Clients API sécurisés côté client
 * - Interface domain/UI inchangée (principe DDD)
 */
export class CallsServiceFactory {
  private static instance: CallsServiceFactory;

  // Repositories (couche infrastructure)
  private callRepository: SupabaseCallRepository;
  private storageRepository: SupabaseStorageRepository;

  // Services (couche domaine)
  private validationService: ValidationService;
  private callService: CallService;
  private duplicateService: DuplicateService;
  private storageService: StorageService;
  private transcriptionTransformationService: TranscriptionTransformationService;
  private callFilteringService: CallFilteringService;

  // ✅ NOUVEAUX SERVICES API SÉCURISÉS
  private transcriptionApiClient: TranscriptionApiClient;
  private diarizationApiClient: DiarizationApiClient;
  private callsApiClient: CallsApiClient;
  private diarizationService: DiarizationService;

  private constructor() {
    console.log(
      "🏭 [ServiceFactory] Initializing DDD services with secure API clients..."
    );

    // Initialisation des repositories
    this.callRepository = new SupabaseCallRepository();
    this.storageRepository = new SupabaseStorageRepository();

    // Initialisation des services avec injection des dépendances
    this.validationService = new ValidationService();
    this.callService = new CallService(
      this.callRepository,
      this.validationService
    );
    this.duplicateService = new DuplicateService(this.callRepository);
    this.storageService = new StorageService(this.storageRepository);
    this.transcriptionTransformationService =
      new TranscriptionTransformationService();
    this.callFilteringService = new CallFilteringService();

    // ✅ INITIALISATION DES NOUVEAUX CLIENTS API SÉCURISÉS
    this.transcriptionApiClient = new TranscriptionApiClient();
    this.diarizationApiClient = new DiarizationApiClient();
    this.callsApiClient = new CallsApiClient();

    // ✅ INITIALISATION DU SERVICE DE DIARISATION (interface identique, implémentation changée)
    this.diarizationService = new DiarizationService(this.diarizationApiClient);

    console.log(
      "✅ [ServiceFactory] All services initialized with secure API architecture"
    );
  }

  public static getInstance(): CallsServiceFactory {
    if (!CallsServiceFactory.instance) {
      CallsServiceFactory.instance = new CallsServiceFactory();
    }
    return CallsServiceFactory.instance;
  }

  // ============================================================================
  // GETTERS POUR LES SERVICES (interfaces identiques)
  // ============================================================================

  getCallService(): CallService {
    return this.callService;
  }

  getValidationService(): ValidationService {
    return this.validationService;
  }

  getDuplicateService(): DuplicateService {
    return this.duplicateService;
  }

  getStorageService(): StorageService {
    return this.storageService;
  }

  getTranscriptionTransformationService(): TranscriptionTransformationService {
    return this.transcriptionTransformationService;
  }

  getCallFilteringService(): CallFilteringService {
    return this.callFilteringService;
  }

  getCallRepository(): SupabaseCallRepository {
    return this.callRepository;
  }

  getStorageRepository(): SupabaseStorageRepository {
    return this.storageRepository;
  }

  // ✅ NOUVEAUX GETTERS - APIS SÉCURISÉES

  /**
   * Retourne le client de transcription API (remplace OpenAIWhisperProvider)
   * Interface identique pour l'UI/Domain
   */
  getTranscriptionClient(): TranscriptionApiClient {
    return this.transcriptionApiClient;
  }

  /**
   * Retourne le client de diarisation API (remplace AssemblyAIDiarizationProvider)
   * Interface identique pour l'UI/Domain
   */
  getDiarizationClient(): DiarizationApiClient {
    return this.diarizationApiClient;
  }

  /**
   * Retourne le service de diarisation (interface identique)
   * ARCHITECTURE: Service Domain → ApiClient → API Route → Provider (serveur)
   */
  getDiarizationService(): DiarizationService {
    return this.diarizationService;
  }

  /**
   * Retourne le client principal pour statistiques et monitoring
   */
  getCallsApiClient(): CallsApiClient {
    return this.callsApiClient;
  }

  // ============================================================================
  // ✅ SERVICE COMPOSÉ POUR CALLPREPARATIONPAGE (interface préservée)
  // ============================================================================

  createCallPreparationService() {
    const callRepository = this.callRepository;
    const transcriptionTransformationService =
      this.transcriptionTransformationService;
    const callFilteringService = this.callFilteringService;

    // ✅ Diarisation via API sécurisée (interface identique pour l'UI)
    const diarization = this.diarizationService;

    return {
      // Services exposés (identiques)
      filtering: callFilteringService,
      transformation: transcriptionTransformationService,
      repository: callRepository,

      // ✅ DIARISATION VIA API SÉCURISÉE
      // L'interface reste identique pour l'UI, mais utilise maintenant les API routes
      diarization: {
        /**
         * Infère les segments de speakers via API serveur sécurisée
         */
        inferSpeakers: (
          audioUrl: string,
          opts?: {
            languageCode?: string;
            timeoutMs?: number;
            pollIntervalMs?: number;
          }
        ) => diarization.inferSegments(audioUrl, opts),

        /**
         * Assigne les tours de parole via l'API client
         */
        assignTurns: (words: Word[], segments: DiarizationSegment[]) =>
          diarization.assignTurnsToWords(words, segments),

        diarizeWords: (
          audioUrl: string,
          words: Word[],
          opts?: {
            languageCode?: string;
            timeoutMs?: number;
            pollIntervalMs?: number;
          }
        ) => diarization.diarizeWords(audioUrl, words, opts),
      },

      // ✅ TRANSCRIPTION VIA API SÉCURISÉE
      // Nouvelle fonctionnalité exposée via l'interface composée
      transcription: {
        /**
         * Transcrit un fichier audio via API serveur sécurisée
         */
        transcribeAudio: (
          audioUrl: string,
          options?: {
            model?: string;
            language?: string;
            temperature?: number;
            prompt?: string;
          }
        ) => this.transcriptionApiClient.transcribeAudio(audioUrl, options),

        /**
         * Transcription en lot
         */
        transcribeBatch: (
          requests: Array<{
            callId: string;
            audioUrl: string;
            options?: any;
          }>
        ) => this.transcriptionApiClient.transcribeBatch(requests),
      },

      // Actions composées existantes (identiques)
      async findPreparableCalls() {
        return callRepository.findCallsForPreparation();
      },

      async findPreparableCallsWithFilters(filters: any) {
        return callRepository.findCallsForPreparationWithFilters(filters);
      },

      async prepareCall(callId: string, transcriptionJson: any) {
        const transformResult =
          await transcriptionTransformationService.transformJsonToWords(
            callId,
            transcriptionJson
          );

        if (!transformResult.success) {
          throw new Error(transformResult.error || "Transformation failed");
        }

        return transformResult;
      },

      async prepareBatch(
        callIds: string[],
        transcriptions: Record<string, any>
      ) {
        const results = [];

        for (const callId of callIds) {
          try {
            const transcription = transcriptions[callId];
            const result = await this.prepareCall(callId, transcription);
            results.push({ callId, success: true, result });
          } catch (error) {
            results.push({
              callId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        return results;
      },

      async getOriginStatistics() {
        return callRepository.getOriginStatistics();
      },
    };
  }

  // ============================================================================
  // ✅ NOUVEAUX SERVICES DE MONITORING ET STATISTIQUES
  // ============================================================================

  /**
   * Service composé pour monitoring et métriques
   */
  createMonitoringService() {
    // ✅ capture des clients pour éviter le this “perdu”
    const tx = this.transcriptionApiClient;
    const dz = this.diarizationApiClient;
    const calls = this.callsApiClient;

    return {
      // Statistiques de transcription
      async getTranscriptionMetrics() {
        return tx.getMetrics();
      },

      // Statistiques de diarisation
      async getDiarizationMetrics() {
        return dz.getMetrics();
      },

      // Statistiques globales
      async getGlobalStats(params?: {
        operations?: ("transcription" | "diarization")[];
        timeframe?: { startDate?: string; endDate?: string };
        groupBy?: "day" | "week" | "month" | "origin";
      }) {
        return calls.getStats(params || {});
      },

      // Résumé des coûts
      async getCostSummary() {
        return calls.getCostSummary();
      },

      // Health check des services
      async getServicesHealth() {
        const [callsHealth, transcriptionHealth, diarizationHealth] =
          await Promise.all([
            calls.getServicesHealth(),
            tx.healthCheck(),
            dz.healthCheck(),
          ]);

        return {
          calls: callsHealth,
          transcription: transcriptionHealth,
          diarization: diarizationHealth,
          overall:
            callsHealth.overall === "healthy" &&
            transcriptionHealth.status === "healthy" &&
            diarizationHealth.status === "healthy"
              ? "healthy"
              : "degraded",
        };
      },

      // Séries temporelles pour graphiques
      async getTimeSeries(
        groupBy: "day" | "week" | "month" | "origin" = "day",
        operations: ("transcription" | "diarization")[] = [
          "transcription",
          "diarization",
        ]
      ) {
        return calls.getTimeSeries(groupBy, operations);
      },
    };
  }

  // ============================================================================
  // CONFIGURATION ET MONITORING (enrichi)
  // ============================================================================

  configure(config: {
    enableDebugLogs?: boolean;
    batchSize?: number;
    cacheTimeout?: number;
    // ✅ Nouveaux paramètres API
    apiTimeout?: number;
    apiRetries?: number;
  }) {
    console.log("🔧 [ServiceFactory] Configuration des services DDD:", config);

    // TODO: Appliquer la configuration aux clients API si nécessaire
    // this.transcriptionApiClient.configure(config);
    // this.diarizationApiClient.configure(config);
  }

  async getServicesHealth(): Promise<{
    callRepository: boolean;
    storageRepository: boolean;
    services: Record<string, boolean>;
    // ✅ Nouveaux services API
    apiServices: {
      transcription: "healthy" | "unhealthy";
      diarization: "healthy" | "unhealthy";
      calls: "healthy" | "degraded" | "unhealthy";
    };
  }> {
    try {
      // Health check des repositories existants
      const callRepoHealth =
        (await this.callRepository.exists("test")) !== undefined;

      // ✅ Health check des nouveaux services API
      const [transcriptionHealth, diarizationHealth, callsHealth] =
        await Promise.allSettled([
          this.transcriptionApiClient.healthCheck(),
          this.diarizationApiClient.healthCheck(),
          this.callsApiClient.getServicesHealth(),
        ]);

      return {
        callRepository: callRepoHealth,
        storageRepository: true,
        services: {
          callService: !!this.callService,
          validationService: !!this.validationService,
          duplicateService: !!this.duplicateService,
          storageService: !!this.storageService,
          transcriptionTransformationService:
            !!this.transcriptionTransformationService,
          callFilteringService: !!this.callFilteringService,
          diarizationService: !!this.diarizationService,
        },
        // ✅ Nouveaux services API
        apiServices: {
          transcription:
            transcriptionHealth.status === "fulfilled"
              ? transcriptionHealth.value.status
              : "unhealthy",
          diarization:
            diarizationHealth.status === "fulfilled"
              ? diarizationHealth.value.status
              : "unhealthy",
          calls:
            callsHealth.status === "fulfilled"
              ? callsHealth.value.overall
              : "unhealthy",
        },
      };
    } catch (error) {
      console.warn("⚠️ [ServiceFactory] Erreur health check services:", error);
      return {
        callRepository: false,
        storageRepository: false,
        services: {},
        apiServices: {
          transcription: "unhealthy",
          diarization: "unhealthy",
          calls: "unhealthy",
        },
      };
    }
  }

  reset() {
    CallsServiceFactory.instance = new CallsServiceFactory();
  }
}

// ============================================================================
// ✅ FONCTION HELPER PRINCIPALE (interface préservée + nouveautés)
// ============================================================================

export const createServices = () => {
  const factory = CallsServiceFactory.getInstance();

  return {
    // ✅ Services principaux (interfaces identiques)
    callService: factory.getCallService(),
    duplicateService: factory.getDuplicateService(),
    storageService: factory.getStorageService(),
    validationService: factory.getValidationService(),

    // Services de transformation (identiques)
    transcriptionTransformationService:
      factory.getTranscriptionTransformationService(),
    callFilteringService: factory.getCallFilteringService(),

    // Repositories (identiques)
    callRepository: factory.getCallRepository(),
    storageRepository: factory.getStorageRepository(),

    // ✅ NOUVEAUX SERVICES API SÉCURISÉS
    transcriptionClient: factory.getTranscriptionClient(),
    diarizationClient: factory.getDiarizationClient(),
    diarizationService: factory.getDiarizationService(),
    callsApiClient: factory.getCallsApiClient(),

    // ✅ Flags de disponibilité (toujours true maintenant car API routes)
    isTranscriptionAvailable: true,
    isDiarizationAvailable: true,

    // ✅ Services composés
    callPreparationService: factory.createCallPreparationService(),
    monitoringService: factory.createMonitoringService(),

    // Factory pour accès avancé
    factory: factory,
  };
};

// ============================================================================
// ✅ RÉTROCOMPATIBILITÉ (pour transition douce)
// ============================================================================

/**
 * @deprecated Utilisez transcriptionClient à la place
 * Maintenu pour compatibilité pendant la transition
 */
export const getTranscriptionProvider = () => {
  console.warn(
    "⚠️ getTranscriptionProvider() is deprecated. Use transcriptionClient instead."
  );
  const factory = CallsServiceFactory.getInstance();
  return factory.getTranscriptionClient();
};

/**
 * @deprecated Utilisez diarizationClient à la place
 * Maintenu pour compatibilité pendant la transition
 */
export const getDiarizationProvider = () => {
  console.warn(
    "⚠️ getDiarizationProvider() is deprecated. Use diarizationClient instead."
  );
  const factory = CallsServiceFactory.getInstance();
  return factory.getDiarizationClient();
};
