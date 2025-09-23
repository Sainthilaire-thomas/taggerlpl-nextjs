// src/components/calls/infrastructure/ServiceFactory.ts - VERSION AVEC DIARISATION

import { SupabaseCallRepository } from "./supabase/SupabaseCallRepository";
import { SupabaseStorageRepository } from "./supabase/SupabaseStorageRepository";
import { CallService } from "../domain/services/CallService";
import { ValidationService } from "../domain/services/ValidationService";
import { DuplicateService } from "../domain/services/DuplicateService";
import { StorageService } from "../domain/services/StorageService";
import { TranscriptionTransformationService } from "../domain/services/TranscriptionTransformationService";
import { CallFilteringService } from "../domain/services/CallFilteringService";

// ✅ Diarisation
import { AssemblyAIDiarizationProvider } from "./diarization/AssemblyAIDiarizationProvider";
import { DiarizationService } from "../domain/services/DiarizationService";
import type {
  DiarizationSegment,
  Word,
} from "../shared/types/TranscriptionTypes";

/**
 * Factory pour créer et configurer tous les services DDD
 *
 * Pattern Singleton + Dependency Injection
 * Centralise la création des services avec leurs dépendances
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

  // ✅ Diarisation (déclaration avec types optionnels)
  private diarizationProvider?: AssemblyAIDiarizationProvider;
  private diarizationService?: DiarizationService;

  private constructor() {
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

    // ❌ SUPPRESSION de l'initialisation automatique de la diarisation
    // Les services de diarisation seront initialisés à la demande
  }

  // ✅ Méthode d'initialisation lazy pour la diarisation
  private initializeDiarizationServices(): void {
    if (!this.diarizationProvider && process.env.ASSEMBLYAI_API_KEY) {
      try {
        this.diarizationProvider = new AssemblyAIDiarizationProvider(
          process.env.ASSEMBLYAI_API_KEY,
          process.env.ASSEMBLYAI_BASE_URL
        );
        this.diarizationService = new DiarizationService(
          this.diarizationProvider
        );
        console.log("✅ Services de diarisation initialisés");
      } catch (error) {
        console.warn("⚠️ Échec initialisation diarisation:", error);
        // Réinitialiser en cas d'erreur
        this.diarizationProvider = undefined;
        this.diarizationService = undefined;
      }
    }
  }

  public static getInstance(): CallsServiceFactory {
    if (!CallsServiceFactory.instance) {
      CallsServiceFactory.instance = new CallsServiceFactory();
    }
    return CallsServiceFactory.instance;
  }

  // ============================================================================
  // GETTERS POUR LES SERVICES
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

  // ✅ Getters avec initialisation lazy
  getDiarizationService(): DiarizationService | null {
    this.initializeDiarizationServices();
    return this.diarizationService || null;
  }

  getDiarizationProvider(): AssemblyAIDiarizationProvider | null {
    this.initializeDiarizationServices();
    return this.diarizationProvider || null;
  }

  // ============================================================================
  // SERVICE COMPOSÉ POUR CALLPREPARATIONPAGE
  // ============================================================================
  createCallPreparationService() {
    const callRepository = this.callRepository;
    const transcriptionTransformationService =
      this.transcriptionTransformationService;
    const callFilteringService = this.callFilteringService;

    // ✅ Diarisation conditionnelle
    const diarization = this.getDiarizationService();

    return {
      // Services exposés
      filtering: callFilteringService,
      transformation: transcriptionTransformationService,
      repository: callRepository,

      // ✅ Expose la diarisation pour l'UI (avec vérification)
      diarization: diarization
        ? {
            inferSpeakers: (
              audioUrl: string,
              opts?: {
                languageCode?: string;
                timeoutMs?: number;
                pollIntervalMs?: number;
              }
            ) => diarization.inferSegments(audioUrl, opts),

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
          }
        : null, // null si diarisation non disponible

      // Actions composées existantes
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
  // CONFIGURATION ET MONITORING
  // ============================================================================
  configure(config: {
    enableDebugLogs?: boolean;
    batchSize?: number;
    cacheTimeout?: number;
  }) {
    console.log("Configuration des services DDD:", config);
  }

  async getServicesHealth(): Promise<{
    callRepository: boolean;
    storageRepository: boolean;
    services: Record<string, boolean>;
  }> {
    try {
      const callRepoHealth =
        (await this.callRepository.exists("test")) !== undefined;

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
          // ✅ Vérification conditionnelle
          diarizationService: !!this.getDiarizationService(),
        },
      };
    } catch (error) {
      console.warn("Erreur health check services:", error);
      return {
        callRepository: false,
        storageRepository: false,
        services: {},
      };
    }
  }

  reset() {
    CallsServiceFactory.instance = new CallsServiceFactory();
  }
}

// ============================================================================
// FONCTION HELPER PRINCIPALE
// ============================================================================
export const createServices = () => {
  const factory = CallsServiceFactory.getInstance();

  // Services de diarisation conditionnels
  const diarizationService = factory.getDiarizationService(); // Peut être null
  const diarizationProvider = factory.getDiarizationProvider(); // Peut être null

  return {
    // Services principaux (toujours disponibles)
    callService: factory.getCallService(),
    duplicateService: factory.getDuplicateService(),
    storageService: factory.getStorageService(),
    validationService: factory.getValidationService(),

    // Nouveaux services
    transcriptionTransformationService:
      factory.getTranscriptionTransformationService(),
    callFilteringService: factory.getCallFilteringService(),

    // Repositories
    callRepository: factory.getCallRepository(),
    storageRepository: factory.getStorageRepository(),

    // ✅ Services optionnels (peuvent être null)
    diarizationService,
    diarizationProvider,

    // ✅ Flag pour savoir si la diarisation est disponible
    isDiarizationAvailable: diarizationService !== null,

    // Service composé principal
    callPreparationService: factory.createCallPreparationService(),

    // Factory pour accès avancé
    factory: factory,
  };
};
