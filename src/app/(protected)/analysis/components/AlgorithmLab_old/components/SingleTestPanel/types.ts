// types.ts - Types globaux pour Algorithm Lab avec validation scientifique

// ===== TYPES DE BASE =====

export type TestDomain = "li" | "cognitive" | "ac" | "all";
export type TestIndicator =
  | "feedback_alignment"
  | "common_ground"
  | "backchannels"
  | "fluidite_cognitive"
  | "reactions_directes"
  | "charge_cognitive"
  | "strategy_effectiveness"
  | "tag_patterns"
  | "temporal_evolution";

export type LabMode =
  | "overview"
  | "single_test"
  | "comparison"
  | "optimization"
  | "validation";

export type AlgorithmId =
  | "BasicAlignmentAlgorithm"
  | "ConversationalPatternAlgorithm"
  | "BasicFluidityAlgorithm"
  | "StrategyAnalysisAlgorithm";

// ===== CONFIGURATION TESTS =====

export interface SingleTestConfig {
  domain: TestDomain;
  indicator: TestIndicator;
  algorithm: AlgorithmId;
  sampleSize: number;
  selectedOrigin?: string;
  validationType?: "classification" | "prediction" | "both";
  stratificationBy?: "strategy" | "reaction" | "family";
}

export interface ComparisonConfig {
  algorithms: AlgorithmId[];
  domains: TestDomain[];
  indicators: TestIndicator[];
  sampleSize: number;
  crossValidation: {
    enabled: boolean;
    folds: number;
    stratified: boolean;
  };
}

export interface OptimizationConfig {
  algorithm: AlgorithmId;
  domain: TestDomain;
  indicator: TestIndicator;
  parameterSpace: Record<string, any[]>;
  maxIterations: number;
  convergenceThreshold: number;
}

// ===== RÉSULTATS TESTS =====

export interface AlgorithmResult {
  algorithmId: AlgorithmId;
  domain: TestDomain;
  indicator: TestIndicator;
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
    examples: any[];
  };
}

export interface DomainTestResult {
  domain: TestDomain;
  indicators: Record<
    TestIndicator,
    {
      indicator: TestIndicator;
      algorithms: Record<AlgorithmId, AlgorithmResult>;
      bestAlgorithm: AlgorithmId;
      convergenceRate: number;
      recommendation: string;
    }
  >;
  overallScore: number;
  processingTime: number;
  sampleSize: number;
}

// ===== MÉTRIQUES VALIDATION =====

export interface ScientificMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  kappaCohen: number;
  matthewsCorrelation: number;
  confusionMatrix: number[][];
  classLabels: string[];
  support: Record<string, number>;
}

export interface ValidationResults {
  testId: string;
  timestamp: Date;
  algorithm: AlgorithmId;
  testType: "classification" | "prediction" | "both";
  sampleSize: number;
  metrics: ScientificMetrics;
  byCategory: Record<string, ScientificMetrics>;
  discrepancies: ValidationDiscrepancy[];
  recommendations: string[];
  confidence: {
    reliability: number;
    calibration: number;
    distribution: Record<string, number>;
  };
}

export interface ValidationDiscrepancy {
  id: number;
  inputText: string;
  predicted: string;
  actual: string;
  confidence: number;
  discrepancyType: "false_positive" | "false_negative" | "misclassification";
  context: {
    category: string;
    subcategory?: string;
    metadata: Record<string, any>;
  };
}

// ===== HYPOTHÈSES THÉORIQUES =====

export interface TheoreticalHypothesis {
  id: string;
  name: string;
  description: string;
  testMethod: string;
  expectedOutcome: string;
  criticalThreshold: number;
}

export interface HypothesisValidation {
  hypothesis: TheoreticalHypothesis;
  validated: boolean;
  confidence: number;
  evidence: string[];
  statisticalSignificance: number;
  effectSize: number;
}

// ===== COMPARAISON ET OPTIMISATION =====

export interface ComparisonMetric {
  metric: string;
  scores: Record<AlgorithmId, number>;
  ranking: AlgorithmId[];
  statisticalSignificance: Record<string, number>;
  confidenceIntervals: Record<AlgorithmId, [number, number]>;
}

export interface ComparisonResult {
  comparisonId: string;
  timestamp: Date;
  algorithms: AlgorithmId[];
  metrics: Record<string, ComparisonMetric>;
  overallRanking: {
    algorithmId: AlgorithmId;
    rank: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    useCases: string[];
  }[];
  recommendations: {
    context: string;
    recommendedAlgorithm: AlgorithmId;
    confidence: number;
    rationale: string;
    alternativeOptions: AlgorithmId[];
  }[];
  exportData: {
    format: string;
    data: any;
    metadata: {
      generatedAt: Date;
      version: string;
      author: string;
    };
  };
}

export interface OptimizationResult {
  optimizationId: string;
  timestamp: Date;
  algorithm: AlgorithmId;
  domain: TestDomain;
  indicator: TestIndicator;
  bestParameters: Record<string, any>;
  bestScore: number;
  improvementRate: number;
  iterationsCount: number;
  convergenceHistory: {
    iteration: number;
    parameters: Record<string, any>;
    score: number;
    validationScore: number;
    timestamp: Date;
  }[];
  validationResults: ValidationResults[];
  recommendation: string;
}

// ===== CROSS-DOMAIN ANALYSIS =====

export interface CrossDomainMetrics {
  kendallTau: Record<string, number>;
  pearsonR: Record<string, number>;
  spearmanRho: Record<string, number>;
  agreementRates: Record<string, number>;
  divergencePatterns: {
    domains: TestDomain[];
    indicators: TestIndicator[];
    divergenceType: "methodological" | "contextual" | "theoretical";
    severity: "low" | "medium" | "high";
    description: string;
    examples: string[];
    recommendations: string[];
  }[];
  overallConsistency: number;
  hypothesesValidation: Record<string, HypothesisValidation>;
}

// ===== CONFIGURATION GLOBALE =====

export interface AlgorithmLabConfig {
  mode: LabMode;
  selectedDomains: TestDomain[];
  selectedIndicators: TestIndicator[];
  testParameters: {
    sampleSize: number;
    samplingMethod: "random" | "stratified" | "systematic";
    crossValidation: {
      enabled: boolean;
      folds: number;
    };
  };
  validationSettings: {
    enableRealTimeValidation: boolean;
    autoSaveResults: boolean;
    exportFormat: "json" | "csv" | "latex";
    confidenceThreshold: number;
  };
  expertAnnotations: {
    enabled: boolean;
    annotatorId?: string;
    goldStandardPath?: string;
  };
}

// ===== ÉTATS ET PROGRESSION =====

export interface ProgressState {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number;
  currentOperation: string;
}

export interface AlgorithmLabError {
  id: string;
  timestamp: Date;
  type: "configuration" | "execution" | "validation" | "export";
  severity: "warning" | "error" | "critical";
  message: string;
  details?: any;
  suggestedAction?: string;
}

export interface AlgorithmLabState {
  config: AlgorithmLabConfig;
  testHistory: GlobalTestResult[];
  optimizationResults: OptimizationResult[];
  expertAnnotations: ExpertAnnotation[];
  isRunning: boolean;
  progress: ProgressState;
  errors: AlgorithmLabError[];
  currentTest?: GlobalTestResult;
  cache: {
    lastUpdate: Date;
    data: Record<string, any>;
    validity: number;
  };
}

// ===== RÉSULTATS GLOBAUX =====

export interface GlobalTestResult {
  testId: string;
  timestamp: Date;
  config: AlgorithmLabConfig;
  domainResults: Record<TestDomain, DomainTestResult>;
  crossDomainMetrics: CrossDomainMetrics;
  executionTime: number;
  status: "success" | "partial" | "failed";
  errors?: AlgorithmLabError[];
  recommendations: string[];
  exportMetadata: {
    format: string;
    size: number;
    checksum: string;
  };
}

// ===== ANNOTATIONS EXPERTES =====

export interface ExpertAnnotation {
  id: string;
  timestamp: Date;
  annotatorId: string;
  inputText: string;
  annotations: {
    strategy: string;
    reaction: string;
    confidence: number;
    notes?: string;
  };
  context: {
    domain: TestDomain;
    indicator: TestIndicator;
    callId?: string;
    metadata: Record<string, any>;
  };
  validation: {
    verified: boolean;
    verifiedBy?: string;
    verificationDate?: Date;
  };
}

// ===== REGISTRY ET MÉTADONNÉES =====

export interface AlgorithmMetadata {
  id: AlgorithmId;
  name: string;
  version: string;
  description: string;
  author: string;
  domain: TestDomain;
  indicators: TestIndicator[];
  capabilities: {
    classification: boolean;
    prediction: boolean;
    confidence: boolean;
    realTime: boolean;
  };
  performance: {
    averageProcessingTime: number;
    memoryRequirement: number;
    scalability: "low" | "medium" | "high";
  };
  validation: {
    lastTested: Date;
    testCoverage: number;
    averageAccuracy: number;
    reliabilityScore: number;
  };
}

export interface DomainRegistry {
  domains: Record<
    TestDomain,
    {
      name: string;
      description: string;
      algorithms: AlgorithmId[];
      indicators: TestIndicator[];
      status: "operational" | "experimental" | "deprecated" | "legacy";
      dependencies: string[];
      lastUpdate: Date;
    }
  >;
  crossDomainMappings: {
    source: TestDomain;
    target: TestDomain;
    mappingType: "direct" | "transformed" | "approximated";
    confidence: number;
    transformation: string;
  }[];
}

// ===== CONSTANTES ET SEUILS =====

export const ALGORITHM_LAB_CONSTANTS = {
  DEFAULT_SAMPLE_SIZE: 200,
  MIN_SAMPLE_SIZE: 50,
  MAX_SAMPLE_SIZE: 2000,
  DEFAULT_CV_FOLDS: 5,
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
  CACHE_DURATION_MS: 300000, // 5 minutes

  VALIDATION_THRESHOLDS: {
    EXCELLENT_KAPPA: 0.8,
    GOOD_KAPPA: 0.6,
    MODERATE_KAPPA: 0.4,
    POOR_KAPPA: 0.2,

    EXCELLENT_ACCURACY: 0.9,
    GOOD_ACCURACY: 0.8,
    MODERATE_ACCURACY: 0.7,
    POOR_ACCURACY: 0.6,

    HIGH_CONFIDENCE: 0.8,
    MEDIUM_CONFIDENCE: 0.6,
    LOW_CONFIDENCE: 0.4,
  },

  PERFORMANCE_BENCHMARKS: {
    FAST_PROCESSING_MS: 1000,
    MEDIUM_PROCESSING_MS: 5000,
    SLOW_PROCESSING_MS: 15000,

    LOW_MEMORY_MB: 100,
    MEDIUM_MEMORY_MB: 500,
    HIGH_MEMORY_MB: 1000,
  },
} as const;

// ===== TYPES D'ERREUR SPÉCIALISÉS =====

export class AlgorithmLabError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: "warning" | "error" | "critical" = "error",
    public details?: any
  ) {
    super(message);
    this.name = "AlgorithmLabError";
  }
}

export class ValidationError extends AlgorithmLabError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_FAILED", "error", details);
    this.name = "ValidationError";
  }
}

export class ConfigurationError extends AlgorithmLabError {
  constructor(message: string, details?: any) {
    super(message, "INVALID_CONFIG", "warning", details);
    this.name = "ConfigurationError";
  }
}

export class ExecutionError extends AlgorithmLabError {
  constructor(message: string, details?: any) {
    super(message, "EXECUTION_ERROR", "error", details);
    this.name = "ExecutionError";
  }
}

// ===== UTILITAIRES TYPE GUARDS =====

export function isValidTestDomain(value: string): value is TestDomain {
  return ["li", "cognitive", "ac", "all"].includes(value);
}

export function isValidAlgorithmId(value: string): value is AlgorithmId {
  return [
    "BasicAlignmentAlgorithm",
    "ConversationalPatternAlgorithm",
    "BasicFluidityAlgorithm",
    "StrategyAnalysisAlgorithm",
  ].includes(value);
}

export function isValidTestIndicator(value: string): value is TestIndicator {
  return [
    "feedback_alignment",
    "common_ground",
    "backchannels",
    "fluidite_cognitive",
    "reactions_directes",
    "charge_cognitive",
    "strategy_effectiveness",
    "tag_patterns",
    "temporal_evolution",
  ].includes(value);
}
