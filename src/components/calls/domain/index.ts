// src/components/calls/domain/index.ts - VERSION CORRIGÉE

// ============================================================================
// EXPORTS DES ENTITÉS
// ============================================================================

// Entités de base (classes)
export { TranscriptionWord, AudioFile, Call } from "./entities";

// 🚀 NOUVEAU : Entités étendues pour le cycle de vie
export { CallExtended, TaggingWorkflowStage } from "./entities";
export type { CallLifecycleStatus } from "./entities";

// ============================================================================
// EXPORTS DES SERVICES
// ============================================================================

// Services métier (classes)
export {
  ValidationService,
  CallService,
  StorageService,
  DuplicateService,
  CallLifecycleService, // 🚀 NOUVEAU
} from "./services";

// Types des services
export type {
  DuplicateStats,
  DuplicateDetectionConfig,
  LifecycleActionResult, // 🚀 NOUVEAU
  LifecycleStats, // 🚀 NOUVEAU
} from "./services";

// ============================================================================
// EXPORTS DES REPOSITORIES (INTERFACES)
// ============================================================================

// Interfaces des repositories (types seulement)
export type {
  CallRepository,
  StorageRepository,
  FileMetadata,
} from "./repositories";

// ============================================================================
// EXPORTS DES WORKFLOWS
// ============================================================================

// Workflows métier (classes)
export { BulkPreparationWorkflow, ImportWorkflow } from "./workflows";

// Types des workflows
export type {
  PreparationStrategy,
  PrepareResult,
  BulkPreparationResult,
  PreparationAnalysis,
  BulkCallbacks,
} from "./workflows";

// ============================================================================
// EXPORTS DES TYPES PARTAGÉS
// ============================================================================

// Types CallStatus
export type { CallStatus } from "../shared/types/CallStatus";
export {
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
  getStatusLabel,
  getStatusColor,
} from "../shared/types/CallStatus";

// Exceptions du domaine (classes)
export {
  DomainError,
  ValidationError,
  BusinessRuleError,
  NotFoundError,
  ConflictError,
  RepositoryError,
  StorageError,
  ConfigurationError,
} from "../shared/exceptions/DomainExceptions";
