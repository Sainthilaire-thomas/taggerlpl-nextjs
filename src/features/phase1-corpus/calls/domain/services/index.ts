// src/components/calls/domain/services/index.ts - VERSION CORRIGÉE

// ============================================================================
// SERVICES EXISTANTS
// ============================================================================

// Services (classes, pas des types)
export { ValidationService } from "./ValidationService";
export { CallService } from "./CallService";
export { StorageService } from "./StorageService";
export { DuplicateService } from "./DuplicateService";
export { CallRelationsService } from "./CallRelationsService";
export { CallLifecycleService } from "./CallLifecycleService";

// Types et interfaces de DuplicateService
export type {
  DuplicateStats,
  DuplicateDetectionConfig,
} from "./DuplicateService";
export { DEFAULT_DUPLICATE_CONFIG } from "./DuplicateService";
export type {
  LifecycleActionResult,
  LifecycleStats,
} from "./CallLifecycleService";

// Types et interfaces de RelationsService
export type {
  RelationsService,
  RelationsNextTurnView,
} from "./RelationsService";

// ============================================================================
// NOUVEAUX SERVICES AJOUTÉS
// ============================================================================

/**
 * Service de transformation des transcriptions JSON vers table word
 * Responsable de la préparation technique des appels
 */
export { TranscriptionTransformationService } from "./TranscriptionTransformationService";

/**
 * Service de filtrage avancé des appels
 * Gère tous les critères de filtrage selon les spécifications DDD
 */
export { CallFilteringService } from "./CallFilteringService";

// Types et interfaces des nouveaux services
export type {
  ValidationResult,
  TransformationResult,
} from "./TranscriptionTransformationService";

export type {
  ConflictStatus,
  FilterCriteria,
  GroupedCalls,
  OriginStats,
} from "./CallFilteringService";

// ============================================================================
// WORKFLOWS ET SERVICES COMPOSÉS
// ============================================================================

/**
 * Workflow de préparation en lot d'appels
 * Optimisé pour traiter plusieurs appels simultanément
 */
export { BulkPreparationWorkflow } from "../workflows/BulkPreparationWorkflow";

/**
 * Workflow d'import d'appels
 * Gère l'import depuis différentes sources avec détection de doublons
 */
export { ImportWorkflow } from "../workflows/ImportWorkflow";

// Types des workflows
export type {
  PreparationStrategy,
  PrepareResult,
  BulkPreparationResult,
  PreparationAnalysis,
  BulkCallbacks,
} from "../workflows/BulkPreparationWorkflow";

// ============================================================================
// SERVICES HELPER POUR CALLPREPARATIONPAGE
// ============================================================================

// Import des types pour utilisation dans l'interface
import type { CallFilteringService } from "./CallFilteringService";
import type { TranscriptionTransformationService } from "./TranscriptionTransformationService";

/**
 * Collection de services spécialisés pour CallPreparationPage
 * Combine filtrage, transformation et mise à jour
 */
export interface CallPreparationServices {
  // Services principaux
  filtering: CallFilteringService;
  transformation: TranscriptionTransformationService;
  repository: any; // SupabaseCallRepository

  // Actions composées
  findPreparableCalls(): Promise<any[]>; // Call[]
  findPreparableCallsWithFilters(filters: any): Promise<any[]>; // Call[]
  prepareCall(callId: string, transcriptionJson: any): Promise<any>;
  prepareBatch(
    callIds: string[],
    transcriptions: Record<string, any>
  ): Promise<any>;
  getOriginStatistics(): Promise<any>;
}

/**
 * Factory helper pour créer les services de préparation
 */
export const createCallPreparationServices = (): CallPreparationServices => {
  const { callPreparationService } =
    require("../../infrastructure/ServiceFactory").createServices();
  return callPreparationService;
};

// ============================================================================
// CONFIGURATIONS ET CONSTANTES
// ============================================================================

/**
 * Configuration par défaut pour les services de préparation
 */
export const PREPARATION_CONFIG = {
  // Batch processing
  maxBatchSize: 50,
  batchDelayMs: 100,

  // Validation
  maxWordsPerTranscription: 50000,
  maxFileSizeMB: 10,

  // Timeouts
  transformationTimeoutMs: 30000,

  // Retry
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
} as const;

/**
 * Configuration par défaut pour le filtrage
 */
export const FILTERING_CONFIG = {
  // Search
  searchDebounceMs: 300,
  maxSearchTermLength: 100,

  // Pagination
  defaultPageSize: 25,
  maxPageSize: 100,

  // Cache
  cacheTimeoutMs: 30000,
} as const;

// ============================================================================
// TYPES UTILITAIRES - CORRECTION DES IMPORTS
// ============================================================================

// Import des classes pour le type union
import { ValidationService } from "./ValidationService";
import { CallService } from "./CallService";
import { StorageService } from "./StorageService";
import { DuplicateService } from "./DuplicateService";
import { CallRelationsService } from "./CallRelationsService";

/**
 * Union type de tous les services disponibles
 */
export type CallsDomainService =
  | ValidationService
  | CallService
  | StorageService
  | DuplicateService
  | CallRelationsService
  | TranscriptionTransformationService
  | CallFilteringService;

/**
 * Interface pour la configuration globale des services
 */
export interface CallsServicesConfig {
  enableDebugLogs?: boolean;
  batchSize?: number;
  cacheTimeout?: number;
  retryAttempts?: number;
  transformationTimeout?: number;
}

/**
 * Résultat de health check des services
 */
export interface ServicesHealthCheck {
  healthy: boolean;
  services: Record<string, boolean>;
  errors: string[];
  timestamp: Date;
}

// ============================================================================
// HELPERS ET UTILITAIRES
// ============================================================================

/**
 * Helper pour vérifier la santé des services
 */
export const checkServicesHealth = async (): Promise<ServicesHealthCheck> => {
  const { factory } =
    require("../../infrastructure/ServiceFactory").createServices();

  try {
    const health = await factory.getServicesHealth();
    return {
      healthy:
        health.callRepository && Object.values(health.services).every(Boolean),
      services: health.services,
      errors: [],
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      healthy: false,
      services: {},
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: new Date(),
    };
  }
};

/**
 * Helper pour créer tous les services avec configuration
 */
export const createConfiguredServices = (config?: CallsServicesConfig) => {
  const services =
    require("../../infrastructure/ServiceFactory").createServices();

  if (config) {
    services.factory.configure(config);
  }

  return services;
};

// ============================================================================
// RE-EXPORTS POUR COMPATIBILITÉ
// ============================================================================

// Re-export de l'interface principale pour compatibilité
export { createServices } from "../../infrastructure/ServiceFactory";
