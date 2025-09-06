/**
 * @fileoverview Point d'entrée principal des types AlgorithmLab
 * Export centralisé unifié pour le module AlgorithmLab
 */

// ========================================================================
// EXPORTS PAR DOMAINE ALGORITHMLAB
// ========================================================================

// Types fondamentaux
export * from "./core";

// Types d'algorithmes
export * from "./algorithms";

// Types d'interface utilisateur
export * from "./ui";

// Types utilitaires
export * from "./utils";

// ========================================================================
// IMPORTS (valeurs & types) POUR CONFIG / ALIAS LOCAUX
// ========================================================================
import { NORMALIZATION_PRESETS } from "./utils";
import type { VariableTarget, ValidationMetrics } from "./core";

// ========================================================================
// EXPORTS GROUPÉS POUR SIMPLICITÉ D'USAGE ALGORITHMLAB
// ========================================================================

// Variables et calculs - imports les plus fréquents
export type {
  VariableTarget as _VariableTarget, // re-export (alias interne pour éviter conflit local)
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
  CalculationInput,
  CalculationResult,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input,
} from "./core";

// Algorithmes - interface universelle
export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  BaseCalculator,
} from "./algorithms";

// Export de la fonction principale
export { createUniversalAlgorithm } from "./algorithms";

// Validation - types essentiels
export type {
  ValidationMetrics as _ValidationMetrics, // re-export (évite conflit local)
  ValidationResult,
  AlgorithmTestConfig,
} from "./core";

// UI - props de validation (couverture complète)
export type {
  BaseValidationProps,
  XValidationProps,
  YValidationProps,
  M1ValidationProps,
  M2ValidationProps,
  M3ValidationProps,
  AllValidationProps,
} from "./ui";

// Utilitaires - fonctions de normalisation (types uniquement ici)
export type {
  normalizeXLabel,
  normalizeYLabel,
  familyFromX,
  NormalizationConfig,
} from "./utils";

// ========================================================================
// CONSTANTES ALGORITHMLAB
// ========================================================================

export const ALGORITHM_LAB_VERSION = "2.0.0";

export const SUPPORTED_VARIABLES = ["X", "Y", "M1", "M2", "M3"] as const;

export const DEFAULT_CONFIGS = {
  VALIDATION: {
    minConfidence: 0.8,
    timeout: 30000,
    retries: 3,
  },
  // Aligne la config par défaut sur le preset "STANDARD" déclaré côté utils
  NORMALIZATION: NORMALIZATION_PRESETS.STANDARD,
} as const;

// ========================================================================
// TYPES DE COMPATIBILITÉ TEMPORAIRE
// ========================================================================

/**
 * @deprecated Use VariableTarget from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVTarget = VariableTarget;

/**
 * @deprecated Use XCalculationResult from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVResultX = import("./core").XCalculationResult;

/**
 * @deprecated Use YCalculationResult from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVResultY = import("./core").YCalculationResult;

/**
 * @deprecated Use M2CalculationResult from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVResultM2 = import("./core").M2CalculationResult;

/**
 * @deprecated Use ValidationMetrics from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVValidationMetrics = ValidationMetrics;
