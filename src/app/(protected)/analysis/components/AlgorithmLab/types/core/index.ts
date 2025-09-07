// ===================================================================
// 4. CORRECTION: src/app/(protected)/analysis/components/AlgorithmLab/types/core/index.ts
// ===================================================================

/**
 * @fileoverview Export centralisé des types core AlgorithmLab
 * Point d'entrée principal pour tous les types fondamentaux AlgorithmLab
 */

// Variables et détails
export * from "./variables";

// Calculs et résultats
export * from "./calculations";

// Validation et métriques (inclut maintenant tout de SharedTypes et Level0Types)
export * from "./validation";

// Types combinés pour faciliter l'import dans AlgorithmLab
export type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
  VariableX,
  XTag,
  YTag,
} from "./variables";

export type {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input,
} from "./calculations";

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
} from "./validation";
