/**
 * @fileoverview Point dâ€™entrÃ©e principal des types AlgorithmLab
 * - RÃ©-exports sans conflits
 * - Ajout des utilitaires publics
 * - Interfaces UI complÃ©mentaires (MetricsPanel, ConfusionMatrix, etc.)
 */

// ========================================================================
// IMPORTS POUR TYPES DIFFUSÃ‰S DANS CE FICHIER
// ========================================================================

import type { VariableTarget, VariableX } from "./core/variables";
import type { ValidationMetrics, ValidationResult } from "./core/validation";

// ========================================================================
// EXPORTS PAR DOMAINE
// ========================================================================

// Variables & dÃ©tails
export * from "./core/variables";

// Calculs & rÃ©sultats
export type {
  CalculationInput,
  CalculationResult,
  CalculationMetadata,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input,
  XCalculationResult,
  YCalculationResult,
  M1CalculationResult,
  M2CalculationResult,
  M3CalculationResult,
} from "./core/calculations";

// Validation & mÃ©triques
export * from "./core/validation";

// Versioning & Investigation
export * from "./versioning";

// ========================================================================
// EXPORTS ALGORITHMES (sÃ©lectifs pour Ã©viter conflits)
// ========================================================================

export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
  ParameterDescriptor,
  AlgorithmMetadata,
  AlgorithmConfig,
  AlgorithmParameters as BaseAlgorithmParameters,
  // on garde l'alias pour compat
  AlgorithmResult as BaseAlgorithmResult,
  BaseAlgorithm,
  XClassification,
  XClassifier,
} from "./algorithms/base";

// ðŸ‘‰ Expose aussi les noms canoniques attendus par les composants
export type {
  AlgorithmResult,
  EnhancedAlgorithmResult,
} from "./algorithms/base";

// Adaptateur universel
export type {
  BaseCalculator,
  AdapterConfig,
  ConstructibleAlgorithm,
} from "./algorithms/universal-adapter";

export { createUniversalAlgorithm } from "./algorithms/universal-adapter";

// ========================================================================
// UI & UTILS (si prÃ©sents dans ton repo)
// ========================================================================

export * from "./ui";
export * from "./utils";

// ========================================================================
// RÃ‰-EXPORTS COMBINÃ‰S (commoditÃ©)
// ========================================================================

// Variables
export type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
  VariableX,
  VariableY,
  XTag,
  YTag,
} from "./core/variables";

// Validation
export type {
  ValidationMetrics,
  ValidationResult,
  AlgorithmTestConfig,
  ValidationLevel,
  TVMetadata,
  TVValidationResult,
  XValidationResult,
  DisagreementCase,
  KappaMetrics,
  InterAnnotatorData,
} from "./core/validation";

// UI types (si dÃ©finis)
export type {
  BaseValidationProps,
  XValidationProps,
  YValidationProps,
  M2ValidationProps,
} from "./ui";

// ========================================================================
// CONSTANTES & FONCTIONS PUBLIQUES
// ========================================================================

export const ALGORITHM_LAB_VERSION = "2.0.0";
export const SUPPORTED_VARIABLES = ["X", "Y", "M1", "M2", "M3"] as const;

export {
  isValidVariableTarget,
  getVariableColor,
  getVariableLabel,
} from "./core/variables";

export {
  validateCalculationInput,
  createEmptyResult,
} from "./core/calculations";

export { calculateMetrics, createValidationConfig } from "./core/validation";

// âœ… Ajoute normalizeAlgorithmResult ici (manquait avant)
export {
  isValidAlgorithmResult,
  normalizeAlgorithmResult,
  createErrorResult,
  createSuccessResult,
} from "./algorithms/base";

export { createAlgorithmMetadata, convertLegacyMetadata } from './algorithms/base';

// ========================================================================
// INTERFACES UI COMPLÃ‰MENTAIRES (utilisÃ©es par tes composants)
// ========================================================================

export interface SimpleMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sampleSize: number;
}

export interface MetricsPanelProps {
  metrics: ValidationMetrics | SimpleMetrics;
  title?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export interface ClassifierSelectorProps {
  selectedClassifier?: string;
  onClassifierChange: (classifier: string) => void;
  availableClassifiers: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  disabled?: boolean;
}

export interface ConfusionMatrixProps {
  metrics: ValidationMetrics | null;
  target?: VariableTarget;
  showLabels?: boolean;
  compact?: boolean;
}

// Exports des configurations d'algorithmes
export {
  ALGORITHM_CONFIGS,
  getAlgorithmsByTarget,
  getConfigForAlgorithm,
  getAllTargets,
  validateAlgorithmName,
} from "./algorithms/base";


// Export H2 helpers
export { getH2Property } from "./h2Types";

