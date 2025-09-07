/**
 * @fileoverview Export centralisé des types core AlgorithmLab
 * Point d'entrée principal pour tous les types fondamentaux AlgorithmLab
 */

// Variables et détails
export * from "./variables";

// Calculs et résultats
export * from "./calculations";

// Validation et métriques
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
} from "./validation";
