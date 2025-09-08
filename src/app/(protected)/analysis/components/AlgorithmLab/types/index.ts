/**
 * @fileoverview Point d’entrée principal des types AlgorithmLab
 * - Ré-exports sans conflits
 * - Ajout des utilitaires publics
 * - Interfaces UI complémentaires (MetricsPanel, ConfusionMatrix, etc.)
 */

// ========================================================================
// IMPORTS POUR TYPES DIFFUSÉS DANS CE FICHIER
// ========================================================================

import type { VariableTarget, VariableX } from "./core/variables";
import type { ValidationMetrics, ValidationResult } from "./core/validation";

// ========================================================================
// EXPORTS PAR DOMAINE
// ========================================================================

// Variables & détails
export * from "./core/variables";

// Calculs & résultats
export type {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
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

// Validation & métriques
export * from "./core/validation";

// ========================================================================
// EXPORTS ALGORITHMES (sélectifs pour éviter conflits)
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
  AlgorithmResult as BaseAlgorithmResult,
  BaseAlgorithm,
  XClassification,
  XClassifier,
} from "./algorithms/base";

// Adaptateur universel
export type {
  BaseCalculator,
  AdapterConfig,
  ConstructibleAlgorithm,
} from "./algorithms/universal-adapter";

export { createUniversalAlgorithm } from "./algorithms/universal-adapter";

// ========================================================================
// UI & UTILS (si présents dans ton repo)
// ========================================================================

export * from "./ui";
export * from "./utils";

// ========================================================================
// RÉ-EXPORTS COMBINÉS (commodité)
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

// UI types (si définis)
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

export {
  isValidAlgorithmResult,
  createErrorResult,
  createSuccessResult,
} from "./algorithms/base";

// ========================================================================
// INTERFACES UI COMPLÉMENTAIRES (utilisées par tes composants)
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
