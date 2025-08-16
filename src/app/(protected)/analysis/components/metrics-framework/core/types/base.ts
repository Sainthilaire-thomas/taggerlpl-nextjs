// src/app/(protected)/analysis/components/metrics-framework/core/types/base.ts

/**
 * Types fondamentaux pour le framework unifié de métriques
 * Version corrigée - Suppression des exports en double
 */

// ================ DOMAINES ET CATEGORIES ================

export type MetricsDomain = "cognitive" | "li" | "conversational_analysis";

export type ImplementationStatus = "implemented" | "partial" | "missing";

export type AlgorithmType =
  | "rule_based"
  | "nlp_enhanced"
  | "ml_supervised"
  | "hybrid";

// ================ DONNEES SOURCES ================

/**
 * Structure unifiée des données de turns taggés depuis Supabase
 */
export interface TurnTaggedData {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag?: string;
  speaker: string;
}

/**
 * Information sur un tag depuis lpltag
 */
export interface TagInfo {
  id: number;
  label: string;
  family: string;
  originespeaker: string;
  color: string;
  description: string;
  icon?: string;
}

// ================ CONFIGURATION INDICATEURS ================

/**
 * Exigences de données pour un indicateur
 */
export interface DataRequirement {
  table: string;
  columns: string[];
  optional?: boolean;
  conditions?: Record<string, any>;
}

/**
 * Configuration de base pour tous les indicateurs
 */
export interface BaseIndicatorConfig {
  id: string;
  name: string;
  domain: MetricsDomain;
  category: string;
  implementationStatus: ImplementationStatus;
  description: string;
  theoreticalFoundation?: string;
  dataRequirements: DataRequirement[];
}

// ================ ALGORITHMES ================

/**
 * Configuration d'un algorithme
 */
export interface AlgorithmConfig {
  id: string;
  name: string;
  type: AlgorithmType;
  version: string;
  description: string;
  requiresTraining: boolean;
  supportedDomains: MetricsDomain[];
  parameters?: Record<string, any>;
}

// ================ RESULTATS ================

/**
 * Résultat standard d'un indicateur
 */
export interface IndicatorResult {
  value: string | number;
  confidence: number; // 0-1
  explanation?: string;
  algorithm_used: string;
  processing_time_ms?: number;
  features_used?: Record<string, any>;
  raw_data?: any;
}

/**
 * Résultats agrégés par famille de stratégies
 */
export interface FamilyResults {
  family: string;
  totalUsage: number;
  indicators: Record<string, IndicatorResult>;
  globalScore: number;
  effectiveness: number;
  convergence_status?: "CONVERGENT" | "DIVERGENT";
}

/**
 * Métriques globales du système
 */
export interface GlobalMetrics {
  totalTurns: number;
  averageEffectiveness: number;
  topPerformingFamily: string;
  convergenceStatus?: "CONVERGENT" | "DIVERGENT" | "UNKNOWN";
  validationDate?: Date;
}

// ================ VALIDATION ET CONVERGENCE ================

/**
 * Données d'annotation experte
 */
export interface AnnotationData {
  turn_id: number;
  domain: MetricsDomain;
  indicator_id: string;
  human_label: string;
  algorithm_prediction?: string;
  algorithm_confidence?: number;
  annotator_id: string;
  difficulty_rating?: number;
  notes?: string;
  annotation_time_seconds?: number;
}

/**
 * Résultats de benchmark d'algorithme
 */
export interface BenchmarkResult {
  algorithm_id: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  processing_time_ms: number;
  test_data_size: number;
  confidence_intervals?: {
    accuracy: [number, number];
    f1_score: [number, number];
  };
}

/**
 * Comparaison entre algorithmes
 */
export interface AlgorithmComparison {
  indicator_id: string;
  algorithms: string[];
  results: Record<string, IndicatorResult[]>;
  benchmark: Record<string, BenchmarkResult>;
  recommendation: {
    best_accuracy: string;
    best_speed: string;
    best_overall: string;
    reasoning: string;
  };
}

/**
 * Données de convergence par famille de stratégies
 */
export interface FamilyConvergenceData {
  strategy_family: string;
  ac_effectiveness: number; // Mesure empirique AC
  li_effectiveness: number; // Score composite LI
  cognitive_effectiveness: number; // Score composite Cognitif
  sample_size: number;
}

/**
 * Résultats de validation de convergence (spécifique thèse)
 */
export interface ConvergenceResults {
  validation_status: "CONVERGENT" | "DIVERGENT" | "UNKNOWN";
  family_results: Record<string, FamilyConvergenceData>;
  consistency_tests: {
    rankings: {
      AC: string[];
      LI: string[];
      Cognitive: string[];
    };
    concordance: {
      AC_LI: { tau: number; p_value: number };
      AC_Cognitive: { tau: number; p_value: number };
      LI_Cognitive: { tau: number; p_value: number };
    };
    overall_consistency: number;
  };
  hypothesis_tests?: {
    H1_validation: boolean; // Action → efficacité
    H2_validation: boolean; // Explication → difficulté
    H3_validation: boolean; // Modulation contextuelle
  };
  improvement_suggestions?: string[];
}

// ================ PERFORMANCE ET MONITORING ================

/**
 * Métriques de performance système
 */
export interface PerformanceMetrics {
  lastCalculationTime: number;
  cacheHitRate: number;
  totalCalculations: number;
  memoryUsage?: number;
  errorRate?: number;
}

/**
 * Configuration de test A/B
 */
export interface ABTestConfig {
  name: string;
  domain: MetricsDomain;
  indicator_id: string;
  algorithm_a: string;
  algorithm_b: string;
  traffic_split_percent: number;
  target_sample_size: number;
  success_metric: "accuracy" | "f1_score" | "processing_time";
}

/**
 * Résultats de test A/B
 */
export interface ABTestResults {
  test_id: string;
  current_sample_size: number;
  statistical_significance: number;
  winner: "algorithm_a" | "algorithm_b" | "inconclusive";
  improvement_percent: number;
  confidence_level: number;
}

// ================ TYPE GUARDS ================

/**
 * Type guards pour validation runtime
 */
export const isValidMetricsDomain = (
  domain: string
): domain is MetricsDomain => {
  return ["cognitive", "li", "conversational_analysis"].includes(domain);
};

export const isValidImplementationStatus = (
  status: string
): status is ImplementationStatus => {
  return ["implemented", "partial", "missing"].includes(status);
};

export const isValidAlgorithmType = (type: string): type is AlgorithmType => {
  return ["rule_based", "nlp_enhanced", "ml_supervised", "hybrid"].includes(
    type
  );
};

// ================ CONSTANTES ================

export const METRICS_DOMAINS = [
  "cognitive",
  "li",
  "conversational_analysis",
] as const;
export const IMPLEMENTATION_STATUSES = [
  "implemented",
  "partial",
  "missing",
] as const;
export const ALGORITHM_TYPES = [
  "rule_based",
  "nlp_enhanced",
  "ml_supervised",
  "hybrid",
] as const;
