// ============================================================================
// Types Level 0 - Contra-annotation LLM et Multi-chartes
// ============================================================================

import { XTag, YTag } from "@/types/algorithm-lab/tags";

// ============================================================================
// OpenAI Annotation
// ============================================================================

export interface OpenAIAnnotationRequest {
  pairId: number;
  conseiller_verbatim: string;
  client_verbatim: string;
  prev1_verbatim?: string;
  next1_verbatim?: string;
}

export interface OpenAIAnnotationResult {
  pairId: number;
  x_predicted?: XTag;
  x_confidence?: number;
  x_reasoning?: string;
  y_predicted?: YTag;
  y_confidence?: number;
  y_reasoning?: string;
}

// ============================================================================
// Kappa Calculation
// ============================================================================

export interface AnnotationPair {
  manual: string;
  llm: string;
}

export interface KappaResult {
  po: number;      // Proportion d'accord observé
  pe: number;      // Proportion d'accord attendu par hasard
  kappa: number;   // (Po - Pe) / (1 - Pe)
  interpretation: "Inférieur au hasard" | "Accord faible" | "Accord acceptable" | 
                  "Accord modéré" | "Accord substantiel" | "Accord quasi-parfait";
}

export interface DisagreementCase {
  pairId: number;
  verbatim: string;
  manualTag: string;
  llmTag: string;
  llmReasoning?: string;
  llmConfidence?: number;
  turnId?: number;
}

// ============================================================================
// Multi-chartes
// ============================================================================

export interface CharteDefinition {
  charte_id: string;
  charte_name: string;
  charte_description?: string;
  variable: "X" | "Y";
  definition: {
    categories: Record<string, {
      description: string;
      patterns?: string[];
      rules?: string[];
      examples?: string[];
    }>;
    priority_rules?: string[];
    rules?: {
      approach?: string;
      examples_per_category?: number;
      context_included?: boolean;
    };
  };
  
  is_baseline?: boolean;
    // 🆕 Sprint 3 : Champs v2.0
  philosophy?: string;           // Ex: "Minimaliste", "Enrichie"
  version?: string;              // Ex: "1.0.0", "1.1.0"
  prompt_template?: string;      // Template prompt LLM
  prompt_params?: {
    model: string;               // Ex: "gpt-4o-mini"
    temperature: number;         // Ex: 0.0
    max_tokens?: number;
    context_window?: string[];   // Ex: ["prev1", "next1"]
  };
  notes?: string;                // Notes thèse
  created_at?: string;           // Timestamp
}

export interface CharteTestResult {
  test_id: string;
  charte_id: string;
  charte_name: string;
  variable: "X" | "Y";
  kappa: number;
  accuracy: number;
  total_pairs: number;
  disagreements_count: number;
  disagreements: DisagreementCase[];
  metrics?: {
    precision?: Record<string, number>;
    recall?: Record<string, number>;
    f1Score?: Record<string, number>;
    confusionMatrix?: Record<string, Record<string, number>>;
  };
  execution_time_ms: number;
  openai_model: string;
  tested_at: string;
}

// ============================================================================
// Gold Standard
// ============================================================================

export interface GoldStandardUpdate {
  pairId: number;
  level0_gold_conseiller?: string;
  level0_gold_client?: string;
  level0_annotator_agreement: number;
  level0_validated_at: string;
}

export interface ComparisonResult {
  pairId: number;
  conseiller_verbatim: string;
  client_verbatim: string;
  
  // X comparison
  manualX: string;
  llmX?: string;
  agreementX: boolean;
  
  // Y comparison
  manualY: string;
  llmY?: string;
  agreementY: boolean;
  
  // Metadata
  llm_x_confidence?: number;
  llm_x_reasoning?: string;
  llm_y_confidence?: number;
  llm_y_reasoning?: string;
}

// ============================================================================
// Legacy types (gardés pour compatibilité si nécessaire)
// ============================================================================

export interface InterAnnotatorData {
  id: string;
  verbatim: string;
  expert1: string;
  expert2: string;
  agreed: boolean;
  callId: string;
  speaker: "conseiller" | "client";
  turnIndex: number;
  context: string;
  annotationTimestamp: Date;
}

export interface KappaMetrics {
  observed: number;
  expected: number;
  kappa: number;
  interpretation:
    | "poor"
    | "slight"
    | "fair"
    | "moderate"
    | "substantial"
    | "almost_perfect";
  confidenceInterval: [number, number];
}


// ============================================================================
// TYPES DE BASE - TABLE ANNOTATIONS
// ============================================================================

/**
 * Type d'annotateur
 */
export type AnnotatorType = 
  | 'human_manual'           // Annotation manuelle (Thomas, Marie, etc.)
  | 'human_h2'               // Annotation H2 baseline
  | 'human_supervisor'       // Annotation superviseur
  | 'llm_openai'            // Annotation LLM (GPT-4, etc.)
  | 'gold_consensus';       // Gold standard (consensus)

/**
 * Structure d'une annotation dans la table unifiée
 */
export interface Annotation {
  annotation_id: string;
  pair_id: number;
  annotator_type: AnnotatorType;
  annotator_id: string;        // Ex: 'thomas_initial', 'CharteY_B', 'gpt4_consensus'
  strategy_tag?: XTag | null;   // Tag stratégie conseiller
  reaction_tag?: YTag | null;   // Tag réaction client
  confidence?: number | null;   // 0-1 pour LLM
  reasoning?: string | null;    // Chain-of-thought LLM
  annotation_context?: AnnotationContext | null;  // Métadonnées
  test_id?: string | null;      // Lien vers level0_charte_tests
  annotated_at: string;         // ISO timestamp
  annotation_duration_ms?: number | null;
}

/**
 * Contexte d'annotation (métadonnées)
 */
export interface AnnotationContext {
  model?: string;              // Ex: 'gpt-4o-mini'
  temperature?: number;        // Ex: 0.0
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  total_cost_usd?: number;
  prompt_version?: string;     // Version de la charte
  [key: string]: any;          // Extensible
}

/**
 * Input pour créer une nouvelle annotation
 */
export interface AnnotationInput {
  pair_id: number;
  annotator_type: AnnotatorType;
  annotator_id: string;
  strategy_tag?: XTag | null;
  reaction_tag?: YTag | null;
  confidence?: number | null;
  reasoning?: string | null;
  annotation_context?: AnnotationContext | null;
  test_id?: string | null;
  annotation_duration_ms?: number | null;
}

// ============================================================================
// COMPARAISON ANNOTATEURS
// ============================================================================

/**
 * Identifiant d'un annotateur
 */
export interface AnnotatorIdentifier {
  annotator_type: AnnotatorType;
  annotator_id: string;
}

/**
 * Résultat de comparaison entre 2 annotateurs
 */
export interface AnnotatorComparisonResult {
  annotator1: AnnotatorIdentifier;
  annotator2: AnnotatorIdentifier;
  total_pairs: number;
  agreements: number;
  disagreements: number;
  kappa: number;
  accuracy: number;
  disagreement_details: Array<{
    pair_id: number;
    tag1: string;
    tag2: string;
    verbatim?: string;
  }>;
}

/**
 * Statistiques d'un annotateur
 */
export interface AnnotatorStats {
  annotator_type: AnnotatorType;
  annotator_id: string;
  total_annotations: number;
  strategy_annotations: number;
  reaction_annotations: number;
  avg_confidence?: number | null;
  first_annotation: string;
  last_annotation: string;
  tag_distribution: Record<string, number>;
}

// ============================================================================
// ACCORD INTER-ANNOTATEURS (N×N)
// ============================================================================

/**
 * Matrice Kappa N×N entre plusieurs annotateurs
 */
export interface KappaMatrix {
  annotators: AnnotatorIdentifier[];
  matrix: number[][];          // matrix[i][j] = kappa entre annotateurs i et j
  avg_kappa: number;           // Moyenne de tous les kappas
  min_kappa: number;
  max_kappa: number;
}

/**
 * Résumé d'accord inter-annotateurs
 */
export interface AgreementSummary {
  total_annotators: number;
  total_comparisons: number;    // Nombre de paires d'annotateurs
  avg_agreement: number;        // % moyen d'accord
  avg_kappa: number;
  best_pair: {
    annotator1: AnnotatorIdentifier;
    annotator2: AnnotatorIdentifier;
    kappa: number;
  };
  worst_pair: {
    annotator1: AnnotatorIdentifier;
    annotator2: AnnotatorIdentifier;
    kappa: number;
  };
}

/**
 * Cas de désaccord multi-annotateurs
 */
export interface MultiAnnotatorDisagreement {
  pair_id: number;
  verbatim: string;
  annotations: Array<{
    annotator: AnnotatorIdentifier;
    tag: string;
    confidence?: number;
    reasoning?: string;
  }>;
  disagreement_type: 'partial' | 'total';  // partial = certains d'accord, total = tous différents
}

// ============================================================================
// ROBUSTESSE HYPOTHÈSES H1/H2
// ============================================================================

/**
 * Configuration de test de robustesse
 */
export interface RobustnessTestConfig {
  hypothesis: 'H1' | 'H2';
  annotators: AnnotatorIdentifier[];
  min_kappa_threshold: number;      // Ex: 0.60 pour accepter robustesse
  variables: ('X' | 'Y')[];         // Quelles variables tester
}

/**
 * Résultat de test H1 pour un annotateur
 */
export interface H1TestResult {
  annotator: AnnotatorIdentifier;
  correlation_X_Y: number;          // Pearson r
  p_value: number;
  sample_size: number;
  significant: boolean;             // p < 0.05
}

/**
 * Rapport de robustesse H1
 */
export interface H1RobustnessReport {
  annotators_tested: number;
  results: H1TestResult[];
  avg_correlation: number;
  min_correlation: number;
  max_correlation: number;
  robust: boolean;                  // true si tous annotateurs ont corrélation significative
  agreement_on_H1: number;          // % annotateurs confirmant H1
}

/**
 * Résultat de test H2 pour un annotateur
 */
export interface H2TestResult {
  annotator: AnnotatorIdentifier;
  mediation_effect: {
    direct_effect: number;          // X → Y direct
    indirect_effect_M1: number;     // X → M1 → Y
    indirect_effect_M2: number;     // X → M2 → Y
    indirect_effect_M3: number;     // X → M3 → Y
    total_indirect: number;
  };
  sobel_tests: {
    M1_p_value: number;
    M2_p_value: number;
    M3_p_value: number;
  };
  mediation_confirmed: boolean;
}

/**
 * Rapport de robustesse H2
 */
export interface H2RobustnessReport {
  annotators_tested: number;
  results: H2TestResult[];
  avg_indirect_effect: number;
  robust: boolean;                  // true si tous annotateurs confirment médiation
  agreement_on_H2: number;          // % annotateurs confirmant H2
}

/**
 * Table de robustesse pour thèse
 */
export interface RobustnessTable {
  hypothesis: 'H1' | 'H2';
  columns: string[];                // Noms colonnes (annotateurs)
  rows: Array<{
    metric: string;                 // Ex: "Correlation", "p-value", "Kappa"
    values: (string | number)[];    // Valeurs par annotateur
  }>;
  summary: {
    robust: boolean;
    agreement_percentage: number;
    notes: string[];
  };
}

// ============================================================================
// SYNCHRONISATION
// ============================================================================

/**
 * Statut de synchronisation analysis_pairs ↔ annotations
 */
export interface SyncStatus {
  total_pairs: number;
  pairs_with_annotations: number;
  missing_annotations: number;
  sync_percentage: number;
}

// ============================================================================
// SERVICES - INTERFACES
// ============================================================================

/**
 * Options de recherche pour annotations
 */
export interface AnnotationSearchOptions {
  pair_ids?: number[];
  annotator_types?: AnnotatorType[];
  annotator_ids?: string[];
  test_id?: string;
  has_strategy?: boolean;
  has_reaction?: boolean;
  min_confidence?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
