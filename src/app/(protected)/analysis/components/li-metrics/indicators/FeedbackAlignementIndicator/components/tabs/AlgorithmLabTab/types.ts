// types.ts - Types TypeScript pour Algorithm Lab
// Phase 1: Types de base pour MVP

// Types d'algorithmes disponibles
export type AlgorithmType = "basic" | "lica" | "custom";

// Zones actives de l'interface
export type ActiveZone = "configuration" | "results" | "testing";

// Configuration d'un algorithme
export interface AlgorithmConfig {
  name: AlgorithmType;
  parameters: AlgorithmParameters;
  metadata: AlgorithmMetadata;
}

// Paramètres configurables d'un algorithme
export interface AlgorithmParameters {
  thresholds: {
    minimumVerbatimLength: number; // 5-50
    collaborationThreshold: number; // 0.1-1.0
    coherenceThreshold: number; // 0.1-1.0
    strategicEffectivenessThreshold: number; // 0.1-1.0
  };
  weights: {
    strategicEffectiveness: number; // 0.1-1.0
    turnCoherence: number; // 0.1-1.0
    sequentialAlignment: number; // 0.1-1.0
  };
  linguisticMarkers?: LinguisticMarkers; // Phase 2
}

// Marqueurs linguistiques par stratégie (Phase 2)
export interface LinguisticMarkers {
  adherence: string[];
  resistance: string[];
  negotiation: string[];
  elaboration: string[];
  neutral: string[];
}

// Métadonnées de configuration
export interface AlgorithmMetadata {
  created: Date;
  lastModified: Date;
  description: string;
  version: string;
  author?: string;
}

// Résultats de validation
export interface ValidationResult {
  testId: string;
  timestamp: Date;
  algorithm: AlgorithmType;
  sampleSize: number;
  metrics: PerformanceMetrics;
  confusionMatrix: ConfusionMatrix;
  errorAnalysis: ErrorAnalysis;
  executionTime: number; // ms
}

// Métriques de performance
export interface PerformanceMetrics {
  accuracy: number; // 0-1
  precision: Record<string, number>; // Par famille
  recall: Record<string, number>; // Par famille
  f1Score: Record<string, number>; // Par famille
  macroF1: number; // F1 moyen
  weightedF1: number; // F1 pondéré
}

// Matrice de confusion
export interface ConfusionMatrix {
  matrix: number[][]; // 4x4 pour les 4 familles
  labels: string[]; // ["REFLET", "ENGAGEMENT", "EXPLICATION", "OUVERTURE"]
  normalized?: number[][]; // Version normalisée
}

// Analyse des erreurs
export interface ErrorAnalysis {
  commonMisclassifications: MisclassificationPattern[];
  difficultCases: ClassificationCase[];
  improvementSuggestions: string[];
  errorDistribution: Record<string, number>;
}

// Pattern de mauvaise classification
export interface MisclassificationPattern {
  predicted: string;
  actual: string;
  count: number;
  percentage: number;
  examples: string[]; // IDs des cas
}

// Cas de classification individuel
export interface ClassificationCase {
  id: string;
  conseillerVerbatim: string;
  clientVerbatim: string;
  manualTag: string; // Tag manuel de référence
  predictedTag: string; // Prédiction algorithme
  confidence: number; // 0-1
  callId: string;
  timestamp: number;
  isValidated: boolean; // Validé manuellement
  correctedTag?: string; // Correction manuelle si différente
  notes?: string; // Notes de validation
}

// Échantillon de test
export interface TestSample {
  id: string;
  cases: ClassificationCase[];
  samplingMethod: SamplingMethod;
  samplingParameters: SamplingParameters;
  created: Date;
  description?: string;
}

// Méthodes d'échantillonnage
export type SamplingMethod =
  | "random"
  | "stratified"
  | "challenging"
  | "temporal";

// Paramètres d'échantillonnage
export interface SamplingParameters {
  size: number; // Taille échantillon
  stratifyByFamily?: boolean; // Échantillonnage stratifié
  includeOrigin?: string[]; // Filtrer par origine
  dateRange?: {
    // Plage temporelle
    start: Date;
    end: Date;
  };
  difficultyCriteria?: {
    // Critères de difficulté
    lowConfidence: boolean; // Cas de faible confiance
    previousErrors: boolean; // Erreurs précédentes
    ambiguousVerbatims: boolean; // Verbatims ambigus
  };
}

// Configuration d'optimisation automatique (Phase 3)
export interface OptimizationConfig {
  method: "grid_search" | "bayesian" | "random_search";
  parameterRanges: ParameterRanges;
  validationMethod: "holdout" | "k_fold" | "stratified_k_fold";
  maxIterations: number;
  targetMetric: "accuracy" | "f1_macro" | "f1_weighted";
  earlyStoppingPatience?: number;
}

// Plages de paramètres pour optimisation
export interface ParameterRanges {
  thresholds: {
    minimumVerbatimLength: [number, number];
    collaborationThreshold: [number, number];
    coherenceThreshold: [number, number];
    strategicEffectivenessThreshold: [number, number];
  };
  weights: {
    strategicEffectiveness: [number, number];
    turnCoherence: [number, number];
    sequentialAlignment: [number, number];
  };
}

// Résultat d'optimisation
export interface OptimizationResult {
  bestConfig: AlgorithmConfig;
  bestScore: number;
  optimizationHistory: OptimizationStep[];
  totalIterations: number;
  executionTime: number;
  convergenceReached: boolean;
}

// Étape d'optimisation
export interface OptimizationStep {
  iteration: number;
  config: AlgorithmParameters;
  score: number;
  metrics: PerformanceMetrics;
  timestamp: Date;
}

// État de l'interface Algorithm Lab
export interface AlgorithmLabState {
  selectedAlgorithm: AlgorithmType;
  currentConfig: AlgorithmConfig;
  activeZone: ActiveZone;
  isRunningTest: boolean;
  isOptimizing: boolean;
  lastValidationResult?: ValidationResult;
  currentSample?: TestSample;
  validationHistory: ValidationResult[];
  savedConfigs: AlgorithmConfig[];
}

// Actions possibles dans l'interface
export type AlgorithmLabAction =
  | { type: "SET_ALGORITHM"; payload: AlgorithmType }
  | { type: "UPDATE_CONFIG"; payload: Partial<AlgorithmParameters> }
  | { type: "SET_ACTIVE_ZONE"; payload: ActiveZone }
  | { type: "START_TEST"; payload: TestSample }
  | { type: "TEST_COMPLETE"; payload: ValidationResult }
  | { type: "START_OPTIMIZATION"; payload: OptimizationConfig }
  | { type: "OPTIMIZATION_COMPLETE"; payload: OptimizationResult }
  | { type: "SAVE_CONFIG"; payload: AlgorithmConfig }
  | { type: "LOAD_CONFIG"; payload: string }
  | { type: "RESET_CONFIG" };

// Props pour composants principaux
export interface AlgorithmLabTabProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}

export interface ConfigurationPanelProps {
  config: AlgorithmConfig;
  onConfigChange: (config: Partial<AlgorithmParameters>) => void;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  isRunningTest: boolean;
}

export interface ResultsPanelProps {
  validationResult?: ValidationResult;
  isLoading: boolean;
  algorithm: AlgorithmType;
}

export interface TestingPanelProps {
  currentSample?: TestSample;
  onRunTest: (sampleConfig: SamplingParameters) => void;
  onValidateCase: (caseId: string, correction?: string) => void;
  isRunningTest: boolean;
}

// Utilitaires de validation
export interface ValidationRules {
  parameterRanges: ParameterRanges;
  requiredFields: string[];
  businessRules: BusinessRule[];
}

export interface BusinessRule {
  name: string;
  validate: (config: AlgorithmParameters) => boolean;
  errorMessage: string;
}

// Types pour persistance
export interface StorageKeys {
  CURRENT_CONFIG: string;
  VALIDATION_HISTORY: string;
  SAVED_CONFIGS: string;
  USER_PREFERENCES: string;
}

// Préférences utilisateur
export interface UserPreferences {
  defaultAlgorithm: AlgorithmType;
  defaultSampleSize: number;
  autoSaveConfigs: boolean;
  showAdvancedMetrics: boolean;
  notificationPreferences: {
    optimizationComplete: boolean;
    testComplete: boolean;
    errorAlerts: boolean;
  };
}

// Types pour export/import
export interface ExportData {
  configs: AlgorithmConfig[];
  validationResults: ValidationResult[];
  metadata: {
    exportDate: Date;
    version: string;
    source: string;
  };
}

// Types d'erreurs spécifiques
export class AlgorithmLabError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "AlgorithmLabError";
  }
}

export type ErrorCode =
  | "INVALID_CONFIG"
  | "TEST_FAILED"
  | "OPTIMIZATION_FAILED"
  | "SAMPLE_TOO_SMALL"
  | "ALGORITHM_ERROR"
  | "STORAGE_ERROR";

// Constantes
export const ALGORITHM_LAB_CONSTANTS = {
  MIN_SAMPLE_SIZE: 10,
  MAX_SAMPLE_SIZE: 1000,
  DEFAULT_SAMPLE_SIZE: 100,
  MIN_VERBATIM_LENGTH: 3,
  MAX_VERBATIM_LENGTH: 1000,
  CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  AUTO_SAVE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_OPTIMIZATION_TIME: 10 * 60 * 1000, // 10 minutes
} as const;

// Types pour la Phase 1 spécifiquement
export interface Phase1State {
  isInitialized: boolean;
  selectedAlgorithm: AlgorithmType;
  activeZone: ActiveZone;
  simulatedMetrics: {
    accuracy: number;
    testCount: number;
  };
}

export interface Phase1Props {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}
