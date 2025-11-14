/**
 * Types fondamentaux du framework de métriques
 */

// Domaines d'analyse supportés
export type MetricsDomain = "li" | "cognitive" | "conversational_analysis";

// Types d'algorithmes
export type AlgorithmType =
  | "rule_based"
  | "nlp_enhanced"
  | "ml_supervised"
  | "hybrid";

// Statut d'implémentation
export type ImplementationStatus = "implemented" | "partial" | "missing";

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

  // Configuration optionnelle
  parameters?: Record<string, any>;
  thresholds?: Record<string, number>;
  features?: string[];
}

/**
 * Structure des données d'entrée (depuis Supabase turntagged)
 */
export interface TurnTaggedData {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim?: string;
  next_turn_tag?: string;
  speaker: string;

  // Champs calculés optionnels
  duration?: number;
  word_count?: number;
  speaker_normalized?: string;

  // Index signature pour accès dynamique
  [key: string]: any;
}

/**
 * Résultat de base d'un indicateur
 */
export interface IndicatorResult {
  value: string | number;
  confidence: number; // 0-1
  explanation?: string;
  algorithm_used: string;

  // Métadonnées optionnelles
  features_used?: Record<string, any>;
  processing_time_ms?: number;
  error?: boolean;
  debug_info?: Record<string, any>;
}

/**
 * Configuration d'un indicateur
 */
export interface BaseIndicatorResult {
  // Valeur principale (peut être string ou number selon l'indicateur)
  value: string | number;

  // Confiance dans le résultat (0-1)
  confidence: number;

  // Explication textuelle du résultat
  explanation?: string;

  // Features utilisées pour le calcul (pour debugging/amélioration)
  features_used?: Record<string, any>;

  // Temps de traitement en millisecondes
  processing_time_ms?: number;
}
export interface BaseIndicatorConfig {
  id: string;
  name: string;
  domain: MetricsDomain;
  category: string;
  implementationStatus: ImplementationStatus;
  theoreticalFoundation: string;
  dataRequirements: DataRequirement[];

  // Configuration avancée - CORRECTION : Suppression des doublons
  defaultAlgorithm?: string;
  availableAlgorithms: string[];
  outputType: "categorical" | "numerical" | "boolean" | "composite";
  validationCriteria?: ValidationCriteria;
}

/**
 * Exigences de données pour un indicateur
 */
export interface DataRequirement {
  table: string;
  columns: string[];
  optional?: boolean;
  description?: string;
}

/**
 * Critères de validation pour un indicateur
 */
export interface ValidationCriteria {
  minSampleSize: number;
  requiredFields: string[];
  dataQualityThresholds: Record<string, number>;
  performanceThresholds: Record<string, number>;
}

/**
 * Résultats d'analyse par famille
 */
export interface FamilyResults {
  familyName: string;
  indicators: Record<string, IndicatorResult>;
  aggregatedScore?: number;
  summary?: string;
}

/**
 * Métriques globales du système
 */
export interface GlobalMetrics {
  totalTurns: number;
  totalCalls: number;
  coverageRate: number;
  averageConfidence: number;
  processingTime: number;

  // Métriques par domaine
  domainMetrics: Record<MetricsDomain, DomainMetrics>;
}

/**
 * Métriques spécifiques à un domaine
 */
export interface DomainMetrics {
  indicatorCount: number;
  algorithmCount: number;
  averageAccuracy: number;
  averageProcessingTime: number;
  totalCalculations: number;
}

/**
 * Configuration du moteur de métriques
 */
export interface MetricsEngineConfig {
  domain: MetricsDomain;
  indicatorIds?: string[];
  algorithmOverrides?: Record<string, string>;
  enableCaching?: boolean;
  enableBenchmarking?: boolean;
  enableRealTimeComparison?: boolean;

  // Paramètres de performance
  maxConcurrentCalculations?: number;
  cacheTimeout?: number;
  processingTimeout?: number;
}

/**
 * Résultats de benchmarking
 */
export interface BenchmarkResult {
  algorithm_id: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  processing_time_ms: number;
  memory_usage_mb?: number;
  test_data_size: number;

  // Métriques spécifiques
  mae?: number; // Mean Absolute Error (pour régression)
  rmse?: number; // Root Mean Square Error
  correlation?: number; // Coefficient de corrélation
}

/**
 * Comparaison entre algorithmes
 */
export interface AlgorithmComparison {
  indicator_id: string;
  algorithms: string[];
  results: Record<string, IndicatorResult[]>;
  benchmarks: Record<string, BenchmarkResult>;
  recommendation: {
    best_accuracy: string;
    best_speed: string;
    best_overall: string;
    reasoning: string;
  };

  // Analyse statistique
  statistical_tests?: StatisticalTestResults;
}

/**
 * Résultats de tests statistiques
 */
export interface StatisticalTestResults {
  significant_differences: boolean;
  p_values: Record<string, number>;
  effect_sizes: Record<string, number>;
  confidence_intervals: Record<string, [number, number]>;
}

/**
 * Données annotées pour l'entraînement supervisé
 */
export interface AnnotatedData {
  turn_id: number;
  domain: MetricsDomain;
  indicator_id: string;
  human_label: string;
  algorithm_prediction?: string;
  algorithm_confidence?: number;
  annotator_id: string;

  // Métadonnées annotation
  annotation_time_seconds?: number;
  difficulty_rating?: number; // 1-5
  notes?: string;
  context_needed?: boolean;

  // Données contextuelles
  turn_data: TurnTaggedData;
  surrounding_context?: TurnTaggedData[];
}

/**
 * Configuration pour les tests A/B
 */
export interface ABTestConfig {
  name: string;
  domain: MetricsDomain;
  indicator_id: string;
  algorithm_a: string;
  algorithm_b: string;
  traffic_split_percent: number; // 0-100
  target_sample_size: number;
  success_metric: string;
  minimum_effect_size: number;
}

/**
 * Résultats d'un test A/B
 */
export interface ABTestResults {
  test_id: string;
  status: "running" | "completed" | "stopped";
  current_sample_size: number;
  statistical_significance: number;
  winner: "algorithm_a" | "algorithm_b" | "inconclusive";
  improvement_percent: number;
  confidence_interval: [number, number];

  // Détails par algorithme
  algorithm_a_metrics: PerformanceMetrics;
  algorithm_b_metrics: PerformanceMetrics;
}

/**
 * Métriques de performance détaillées
 */
export interface PerformanceMetrics {
  accuracy: number;
  processing_time_ms: number;
  memory_usage_mb: number;
  throughput_per_second: number;
  error_rate: number;

  // Métriques utilisateur
  user_satisfaction?: number;
  annotation_agreement?: number;
}

/**
 * Résultat d'entraînement de modèle ML
 */
export interface TrainingResult {
  model_id: string;
  algorithm_id: string;
  training_accuracy: number;
  validation_accuracy: number;
  training_time_minutes: number;
  model_size_mb: number;

  // Détails de l'entraînement
  training_data_size: number;
  validation_data_size: number;
  features_used: string[];
  hyperparameters: Record<string, any>;

  // Métriques de qualité
  confusion_matrix?: number[][];
  feature_importance?: Record<string, number>;
  learning_curve?: { epoch: number; accuracy: number }[];
}

/**
 * Configuration pour l'annotation supervisée
 */
export interface AnnotationWorkflowConfig {
  domain: MetricsDomain;
  indicator_id: string;
  selection_strategy:
    | "random"
    | "active_learning"
    | "disagreement"
    | "uncertainty";
  batch_size: number;
  target_annotations: number;

  // Critères de qualité
  min_inter_annotator_agreement: number;
  max_annotation_time_seconds: number;
  required_annotators_per_case: number;
}

/**
 * Statistiques d'annotation
 */
export interface AnnotationStats {
  total_cases: number;
  annotated_cases: number;
  completion_rate: number;
  average_annotation_time: number;
  inter_annotator_agreement: number;

  // Répartition par difficulté
  difficulty_distribution: Record<number, number>;

  // Répartition par annotateur
  annotator_stats: Record<
    string,
    {
      annotations_count: number;
      average_time: number;
      agreement_rate: number;
    }
  >;
}
