// index.ts - Exports centralisés pour Algorithm Lab avec validation scientifique
export { default as TurntaggedDataProcessor } from "./data/TurnTaggedDataProcessor";
export type {
  TurnTaggedRow,
  ValidationPair,
  ValidationCorpus,
} from "./data/TurnTaggedDataProcessor";

export { default as ValidationEngine } from "./validation/ValidationEngine";
export type {
  AlgorithmPrediction,
  ValidationMetrics,
  ClassificationValidationResult,
  PredictionValidationResult,
  DualValidationResult,
  DiscrepancyItem,
} from "./validation/ValidationEngine";

export { useRealDataTesting } from "./hooks/useRealDataTesting";
export type {
  RealTestConfig,
  TestExecutionState,
  UseRealDataTestingReturn,
} from "./hooks/useRealDataTesting";

export { default as SingleTestPanel } from "./SingleTestPanel";
export type { SingleTestPanelProps } from "./SingleTestPanel";

// Réexport de l'interface principale existante
export { default as AlgorithmLabInterface } from "../../AlgorithmLabInterface";

// Constants utiles
export const ALGORITHM_LAB_CONSTANTS = {
  DEFAULT_SAMPLE_SIZE: 200,
  MAX_SAMPLE_SIZE: 1000,
  DEFAULT_STRATEGIES: ["REFLET", "OUVERTURE", "ENGAGEMENT", "EXPLICATION"],
  DEFAULT_REACTIONS: ["POSITIF", "NEGATIF", "NEUTRE"],
  VALIDATION_THRESHOLDS: {
    EXCELLENT_KAPPA: 0.8,
    GOOD_KAPPA: 0.6,
    MODERATE_KAPPA: 0.4,
    EXCELLENT_ACCURACY: 0.85,
    GOOD_ACCURACY: 0.7,
    POOR_ACCURACY: 0.6,
  },
} as const;
