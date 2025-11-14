// index.ts - Exports centralisés pour Algorithm Lab
// Phase 1: Exports de base pour MVP

// Composant principal
export { default as AlgorithmLabTab } from "./AlgorithmLabTab";

// Types principaux
export type {
  // Types de base
  AlgorithmType,
  ActiveZone,
  AlgorithmConfig,
  AlgorithmParameters,

  // Résultats et métriques
  ValidationResult,
  PerformanceMetrics,
  ClassificationCase,
  TestSample,

  // Props des composants
  AlgorithmLabTabProps,

  // Types Phase 1
  Phase1State,
  Phase1Props,

  // Configuration
  SamplingParameters,
  LinguisticMarkers,

  // Erreurs
  ErrorCode,
} from "./types";

// Hook principal
export { useAlgorithmTesting } from "./hooks/useAlgorithmTesting";

// Constantes
export { ALGORITHM_LAB_CONSTANTS } from "./types";

// Classes d'erreur
export { AlgorithmLabError } from "./types";

// À venir dans les prochaines phases :
// export { ConfigurationPanel } from "./ConfigurationPanel";
// export { ResultsPanel } from "./ResultsPanel";
// export { TestingPanel } from "./TestingPanel";
// export { useParameterOptimization } from "./hooks/useParameterOptimization";
// export { useValidationSampling } from "./hooks/useValidationSampling";
