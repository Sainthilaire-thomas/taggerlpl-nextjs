/**
 * @fileoverview Export centralisé des types algorithms AlgorithmLab
 * Point d'entrée principal pour tous les types d'algorithmes AlgorithmLab
 */

// Interface universelle et types de base
export * from "./base";

// Adaptateur universel
export * from "./universal-adapter";

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
} from "./base";

// ✅ AJOUT : Exports pour le système unifié
export type { AlgorithmConfig, SpeakerType, InputFormat } from "./base";

export {
  ALGORITHM_CONFIGS,
  getAlgorithmsByTarget,
  getConfigForAlgorithm,
  getAllTargets,
  validateAlgorithmName,
} from "./base";

export type { BaseCalculator, AdapterConfig } from "./universal-adapter";

// Export de la fonction principale
export { createUniversalAlgorithm } from "./universal-adapter";
