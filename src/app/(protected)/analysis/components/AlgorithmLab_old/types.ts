// components/AlgorithmLab/types.ts - Types pour Algorithm Lab global

// ===========================================
// TYPES PRINCIPAUX ALGORITHM LAB GLOBAL
// ===========================================

// Modes de fonctionnement du Lab
export type LabMode =
  | "overview" // Vue d'ensemble des domaines
  | "single_test" // Test d'un algorithme unique
  | "comparison" // Comparaison multi-algorithmes
  | "optimization" // Optimisation automatique
  | "validation"; // Validation scientifique

// Domaines d'analyse disponibles
export type TestDomain =
  | "li" // Linguistique Interactionnelle
  | "cognitive" // Sciences Cognitives
  | "ac" // Analyse Conversationnelle (legacy)
  | "all"; // Tous domaines (validation croisée)

// Indicateurs par domaine
export type LIIndicator =
  | "feedback_alignment"
  | "common_ground"
  | "backchannels"
  | "prosodic_fluency"
  | "speech_rate"
  | "sequential_patterns"
  | "repair_mechanisms";

export type CognitiveIndicator =
  | "fluidite_cognitive"
  | "reactions_directes"
  | "reprises_lexicales"
  | "charge_cognitive"
  | "marqueurs_effort"
  | "patterns_resistance"
  | "robustesse_stress"
  | "niveau_stress"
  | "position_conversation";

export type ACIndicator =
  | "strategy_effectiveness"
  | "tag_patterns"
  | "temporal_evolution"
  | "global_metrics";

export type TestIndicator = LIIndicator | CognitiveIndicator | ACIndicator;

// ===========================================
// CONFIGURATION ALGORITHM LAB
// ===========================================

export interface AlgorithmLabConfig {
  mode: LabMode;
  selectedDomains: TestDomain[];
  selectedIndicators: TestIndicator[];
  testParameters: TestParameters;
  comparisonConfig?: ComparisonConfig;
  optimizationConfig?: OptimizationConfig;
  validationConfig?: ValidationConfig;
}

export interface TestParameters {
  sampleSize: number;
  samplingMethod: "random" | "stratified" | "temporal" | "challenging";
  originFilter?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  crossValidation: {
    enabled: boolean;
    folds: number;
  };
}

export interface ComparisonConfig {
  algorithms: string[];
  metrics: ComparisonMetric[];
  showDivergenceAnalysis: boolean;
  exportFormat: "json" | "csv" | "latex";
}

export interface OptimizationConfig {
  method: "grid_search" | "bayesian" | "random_search";
  maxIterations: number;
  targetMetric: "accuracy" | "f1_macro" | "convergence_rate";
  parameterRanges: Record<string, [number, number]>;
}

export interface ValidationConfig {
  crossDomainTests: boolean;
  expertAnnotation: boolean;
  convergenceThresholds: {
    kendallTau: number;
    pearsonR: number;
    agreementRate: number;
  };
}

// ===========================================
// MÉTADONNÉES DOMAINES ET ALGORITHMES
// ===========================================

export interface DomainMetadata {
  id: TestDomain;
  name: string;
  icon: string;
  description: string;
  status: "operational" | "development" | "legacy" | "experimental";
  algorithms: AlgorithmMetadata[];
  indicators: IndicatorMetadata[];
  lastUpdate: Date;
}

export interface AlgorithmMetadata {
  id: string;
  name: string;
  domain: TestDomain;
  version: string;
  type: "statistical" | "ml" | "rule_based" | "hybrid";
  complexity: "low" | "medium" | "high";
  processingTime: number; // ms moyenne
  accuracy: number; // 0-1
  parameters: ParameterMetadata[];
  scientificReferences: string[];
  implementationStatus: "stable" | "beta" | "experimental";
}

export interface IndicatorMetadata {
  id: TestIndicator;
  name: string;
  domain: TestDomain;
  description: string;
  unit: string;
  range: [number, number];
  interpretation: {
    low: string;
    medium: string;
    high: string;
  };
  algorithmSupport: string[]; // IDs des algorithmes supportés
}

export interface ParameterMetadata {
  name: string;
  type: "number" | "boolean" | "string" | "array";
  range?: [number, number];
  options?: string[];
  default: any;
  description: string;
  impact: "low" | "medium" | "high";
}

// ===========================================
// RÉSULTATS DE TESTS
// ===========================================

export interface GlobalTestResult {
  testId: string;
  timestamp: Date;
  config: AlgorithmLabConfig;
  domainResults: Record<TestDomain, DomainTestResult>;
  crossDomainMetrics: CrossDomainMetrics;
  executionTime: number;
  status: "success" | "partial" | "failed";
  errors?: string[];
}

export interface DomainTestResult {
  domain: TestDomain;
  indicators: Record<TestIndicator, IndicatorResult>;
  overallScore: number;
  processingTime: number;
  sampleSize: number;
}

export interface IndicatorResult {
  indicator: TestIndicator;
  algorithms: Record<string, AlgorithmResult>;
  bestAlgorithm: string;
  convergenceRate: number;
  recommendation: string;
}

export interface AlgorithmResult {
  algorithmId: string;
  score: number;
  confidence: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  performance: {
    processingTime: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  details: {
    sampleSize: number;
    correctPredictions: number;
    confusionMatrix?: number[][];
    examples: TestExample[];
  };
}

export interface TestExample {
  id: string;
  input: string;
  expectedOutput: string;
  algorithmOutput: string;
  confidence: number;
  isCorrect: boolean;
  explanation?: string;
}

// ===========================================
// VALIDATION CROISÉE ET CONVERGENCE
// ===========================================

export interface CrossDomainMetrics {
  kendallTau: Record<string, number>; // Corrélations entre domaines
  pearsonR: Record<string, number>;
  spearmanRho: Record<string, number>;
  agreementRates: Record<string, number>;
  divergencePatterns: DivergencePattern[];
  overallConsistency: number;
  hypothesesValidation: HypothesesValidation;
}

export interface DivergencePattern {
  domains: TestDomain[];
  indicators: TestIndicator[];
  divergenceType: "systematic" | "random" | "contextual";
  severity: "low" | "medium" | "high";
  description: string;
  examples: string[];
  recommendations: string[];
}

export interface HypothesesValidation {
  h1_action_effectiveness: {
    validated: boolean;
    confidence: number;
    evidence: string[];
  };
  h2_explanation_difficulty: {
    validated: boolean;
    confidence: number;
    evidence: string[];
  };
  h3_context_modulation: {
    validated: boolean;
    confidence: number;
    evidence: string[];
  };
}

// ===========================================
// OPTIMISATION AUTOMATIQUE
// ===========================================

export interface OptimizationResult {
  optimizationId: string;
  timestamp: Date;
  algorithm: string;
  domain: TestDomain;
  indicator: TestIndicator;
  bestParameters: Record<string, any>;
  bestScore: number;
  improvementRate: number;
  iterationsCount: number;
  convergenceHistory: OptimizationStep[];
  validationResults: ValidationResult[];
  recommendation: string;
}

export interface OptimizationStep {
  iteration: number;
  parameters: Record<string, any>;
  score: number;
  validationScore: number;
  timestamp: Date;
  notes?: string;
}

export interface ValidationResult {
  fold: number;
  trainScore: number;
  testScore: number;
  overfitting: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

// ===========================================
// ANNOTATION EXPERTE
// ===========================================

export interface ExpertAnnotation {
  annotationId: string;
  expertId: string;
  timestamp: Date;
  domain: TestDomain;
  indicator: TestIndicator;
  samples: AnnotatedSample[];
  interRaterReliability?: number;
  qualityScore: number;
  notes: string;
}

export interface AnnotatedSample {
  sampleId: string;
  input: string;
  expertLabel: string;
  confidence: number;
  algorithmPredictions: Record<string, string>;
  disagreements: Disagreement[];
  validationNotes: string;
}

export interface Disagreement {
  algorithmId: string;
  algorithmPrediction: string;
  expertLabel: string;
  disagreementType: "false_positive" | "false_negative" | "misclassification";
  severity: "minor" | "moderate" | "major";
  explanation: string;
}

// ===========================================
// MÉTRIQUES DE COMPARAISON
// ===========================================

export type ComparisonMetric =
  | "accuracy"
  | "precision"
  | "recall"
  | "f1_score"
  | "processing_time"
  | "memory_usage"
  | "convergence_rate"
  | "expert_agreement"
  | "cross_domain_consistency";

export interface ComparisonResult {
  comparisonId: string;
  timestamp: Date;
  algorithms: string[];
  metrics: Record<ComparisonMetric, AlgorithmComparison>;
  overallRanking: AlgorithmRanking[];
  recommendations: ComparisonRecommendation[];
  exportData: ExportData;
}

export interface AlgorithmComparison {
  metric: ComparisonMetric;
  scores: Record<string, number>;
  ranking: string[];
  statisticalSignificance: Record<string, number>;
  confidenceIntervals: Record<string, [number, number]>;
}

export interface AlgorithmRanking {
  algorithmId: string;
  rank: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  useCases: string[];
}

export interface ComparisonRecommendation {
  context: string;
  recommendedAlgorithm: string;
  confidence: number;
  rationale: string;
  alternativeOptions: string[];
}

export interface ExportData {
  format: "json" | "csv" | "latex" | "pdf";
  data: any;
  metadata: {
    generatedAt: Date;
    version: string;
    author: string;
  };
}

// ===========================================
// ÉTATS ET EVENTS
// ===========================================

export interface AlgorithmLabState {
  config: AlgorithmLabConfig;
  currentTest?: GlobalTestResult;
  testHistory: GlobalTestResult[];
  optimizationResults: OptimizationResult[];
  expertAnnotations: ExpertAnnotation[];
  isRunning: boolean;
  progress: TestProgress;
  errors: LabError[];
}

export interface TestProgress {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number;
  currentOperation: string;
}

export interface LabError {
  id: string;
  timestamp: Date;
  type: "configuration" | "execution" | "validation" | "export";
  severity: "warning" | "error" | "critical";
  message: string;
  details?: any;
  resolution?: string;
}

// ===========================================
// REGISTRY ET PLUGINS
// ===========================================

export interface AlgorithmRegistry {
  domains: Map<TestDomain, DomainMetadata>;
  algorithms: Map<string, AlgorithmMetadata>;
  indicators: Map<TestIndicator, IndicatorMetadata>;

  // Méthodes du registry
  registerDomain(domain: DomainMetadata): void;
  registerAlgorithm(algorithm: AlgorithmMetadata): void;
  registerIndicator(indicator: IndicatorMetadata): void;

  getDomain(id: TestDomain): DomainMetadata | undefined;
  getAlgorithm(id: string): AlgorithmMetadata | undefined;
  getIndicator(id: TestIndicator): IndicatorMetadata | undefined;

  getAlgorithmsByDomain(domain: TestDomain): AlgorithmMetadata[];
  getIndicatorsByDomain(domain: TestDomain): IndicatorMetadata[];
  getSupportedIndicators(algorithmId: string): TestIndicator[];
}

export interface DomainBridge {
  // Interface pour communication inter-domaines
  translateResult(
    result: AlgorithmResult,
    targetDomain: TestDomain
  ): AlgorithmResult;
  computeCorrelation(
    domain1: TestDomain,
    domain2: TestDomain
  ): CrossDomainMetrics;
  validateConsistency(results: Record<TestDomain, DomainTestResult>): boolean;
}

// ===========================================
// CONSTANTES
// ===========================================

export const ALGORITHM_LAB_CONSTANTS = {
  // Limites de test
  MIN_SAMPLE_SIZE: 50,
  MAX_SAMPLE_SIZE: 5000,
  DEFAULT_SAMPLE_SIZE: 500,

  // Optimisation
  MAX_OPTIMIZATION_TIME: 30 * 60 * 1000, // 30 minutes
  DEFAULT_CV_FOLDS: 5,
  MIN_IMPROVEMENT_THRESHOLD: 0.01,

  // Validation
  MIN_EXPERT_AGREEMENT: 0.7,
  MIN_CROSS_DOMAIN_CORRELATION: 0.3,
  CONVERGENCE_THRESHOLD: 0.05,

  // Performance
  CACHE_TTL: 60 * 60 * 1000, // 1 heure
  MAX_CONCURRENT_TESTS: 3,
  MEMORY_LIMIT_MB: 512,

  // Export
  SUPPORTED_FORMATS: ["json", "csv", "latex", "pdf"] as const,
  MAX_EXPORT_SIZE_MB: 50,
} as const;

// ===========================================
// TYPES D'ERREURS SPÉCIALISÉES
// ===========================================

export class AlgorithmLabError extends Error {
  constructor(
    message: string,
    public code: LabErrorCode,
    public domain?: TestDomain,
    public details?: any
  ) {
    super(message);
    this.name = "AlgorithmLabError";
  }
}

export type LabErrorCode =
  | "INVALID_CONFIG"
  | "DOMAIN_NOT_FOUND"
  | "ALGORITHM_NOT_AVAILABLE"
  | "INDICATOR_NOT_SUPPORTED"
  | "INSUFFICIENT_DATA"
  | "OPTIMIZATION_FAILED"
  | "VALIDATION_ERROR"
  | "EXPORT_FAILED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "TIMEOUT"
  | "EXECUTION_ERROR";
