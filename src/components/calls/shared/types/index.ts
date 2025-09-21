// src/components/calls/shared/types/index.ts - VERSION CORRIGÉE

// ============================================================================
// TYPES PRINCIPAUX (pas de conflits)
// ============================================================================

// Re-export tous les types de CallStatus
export type * from "./CallStatus";

// Re-export sélectif de CommonTypes pour éviter les conflits
export type {
  CreateCallData,
  ImportData,
  ImportCallbacks,
  ImportResult,
  CancellationReason,
  ImportFailureReason,
  DuplicateAction,
  DuplicateDialogData,
  UpgradeRecommendation,
  UpgradeAnalysis,
  TranscriptionMetadata,
  CallUpgradeData,
  DuplicateCriteria,
  DuplicateResult,
  BulkOperationResult,
  BulkResult,
} from "./CommonTypes";

// Types qui pourraient être en conflit - export explicite depuis CommonTypes
export type {
  ValidationResult,
  PreparationStrategy,
  PreparationResult,
  BulkPreparationResult,
  BulkCallbacks,
  PreparationAnalysis,
} from "./CommonTypes";

// ============================================================================
// CONFIGURATION ET EXCEPTIONS
// ============================================================================

// Export de la configuration (pas de conflits attendus)
export * from "../config/CallsConfig";

// Export des exceptions (classes, pas de conflits de types)
export * from "../exceptions/DomainExceptions";

// ============================================================================
// RE-EXPORTS POUR COMPATIBILITÉ
// ============================================================================

// Types CallStatus individuels pour facilité d'utilisation
export {
  CallStatus,
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
  getStatusLabel,
  getStatusColor,
} from "./CallStatus";

// Configuration helper
export { ConfigHelpers, validateCallsConfig } from "../config/CallsConfig";

// ============================================================================
// TYPES UTILITAIRES POUR L'ARCHITECTURE DDD
// ============================================================================

/**
 * Type helper pour les résultats d'opérations DDD
 */
export interface DDDOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Type helper pour les critères de filtrage génériques
 */
export interface BaseFilterCriteria {
  keyword?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Type helper pour les statistiques génériques
 */
export interface BaseStats {
  total: number;
  timestamp: Date;
}
