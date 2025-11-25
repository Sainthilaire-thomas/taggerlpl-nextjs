/**
 * Types pour le système de versioning et investigation des algorithmes
 * Phase 3 - Level 1 Validation
 */
import type { VariableTarget } from './core/variables';
import type { ValidationMetrics } from './core/validation';


// ============================================
// Test Runs
// ============================================

/**
 * Statuts possibles d'un test run
 */
export type TestOutcome = 
  | 'pending'       // Test vient d'être exécuté, pas de décision
  | 'discarded'     // Rejeté, pas concluant
  | 'investigating' // En cours d'analyse des erreurs
  | 'investigated'  // Analyse terminée
  | 'promoted';     // Validé comme version officielle

/**
 * Différences par rapport à une baseline
 */
export interface BaselineDiff {
  accuracy_delta: number;
  kappa_delta?: number;
  f1_deltas: Record<string, number>;
  errors_delta: number;
  corrections: number;  // Erreurs corrigées par rapport à baseline
  regressions: number;  // Nouvelles erreurs par rapport à baseline
}

/**
 * Test run complet (DB record)
 */
export interface TestRun {
  run_id: string;
  algorithm_key: string;
  algorithm_version?: string;
  target: VariableTarget;
  sample_size: number;
  metrics: ValidationMetrics;
  error_pairs?: number[];  // Liste des pair_id en erreur
  outcome: TestOutcome;
  baseline_version_id?: string;
  baseline_diff?: BaselineDiff;
  investigation_notes?: string;
  investigation_summary?: Record<string, any>;
  investigation_started_at?: string;
  investigation_completed_at?: string;
  annotation_count: number;
  promoted_to_version_id?: string;
  parent_run_id?: string;
  run_date: string;
  run_duration_ms?: number;
  created_by?: string;
}

/**
 * Input pour créer un test run
 */
export interface CreateTestRunInput {
  algorithm_key: string;
  algorithm_version?: string;
  target: VariableTarget;
  sample_size: number;
  metrics: ValidationMetrics;
  error_pairs?: number[];
  run_duration_ms?: number;
  created_by?: string;
}

/**
 * Input pour mettre à jour un test run
 */
export interface UpdateTestRunInput {
  outcome?: TestOutcome;
  investigation_notes?: string;
  investigation_summary?: Record<string, any>;
  investigation_started_at?: string;
  investigation_completed_at?: string;
  annotation_count?: number;
  promoted_to_version_id?: string;
}

// ============================================
// Investigation Annotations
// ============================================

/**
 * Types d'annotations d'investigation
 */
export type AnnotationType = 
  | 'error_pattern'  // Pattern d'erreur récurrent
  | 'suggestion'     // Suggestion d'amélioration
  | 'note';          // Note générale

/**
 * Sévérité d'une erreur
 */
export type AnnotationSeverity = 
  | 'critical'   // Erreur critique
  | 'minor'      // Erreur mineure
  | 'edge_case'; // Cas limite

/**
 * Annotation d'investigation complète (DB record)
 */
export interface InvestigationAnnotation {
  id: string;
  run_id: string;
  pair_id?: number;
  turn_id?: number;
  annotation_type: AnnotationType;
  content: string;
  expected_tag?: string;
  predicted_tag?: string;
  verbatim_excerpt?: string;
  error_category?: string;
  severity: AnnotationSeverity;
  actionable: boolean;
  created_at: string;
  created_by?: string;
}

/**
 * Input pour créer une annotation d'investigation
 */
export interface CreateInvestigationAnnotationInput {
  run_id: string;
  pair_id?: number;
  turn_id?: number;
  annotation_type: AnnotationType;
  content: string;
  expected_tag?: string;
  predicted_tag?: string;
  verbatim_excerpt?: string;
  error_category?: string;
  severity?: AnnotationSeverity;
  actionable?: boolean;
  created_by?: string;
}

// ============================================
// Algorithm Version Registry
// ============================================

/**
 * Statuts possibles d'une version
 */
export type VersionStatus = 
  | 'draft'       // Version en cours de préparation
  | 'validated'   // Version validée, utilisable
  | 'baseline'    // Version de référence pour comparaisons
  | 'deprecated'; // Version obsolète, ne plus utiliser

/**
 * Version d'algorithme enrichie
 */
export interface AlgorithmVersion {
  version_id: string;
  version_name: string;
  created_at: string;
  is_active: boolean;
  deprecated: boolean;
  
  // Algorithmes utilisés
  x_key?: string;
  x_version?: string;
  x_config?: Record<string, any>;
  
  y_key?: string;
  y_version?: string;
  y_config?: Record<string, any>;
  
  m1_key?: string;
  m1_version?: string;
  m1_config?: Record<string, any>;
  
  m2_key?: string;
  m2_version?: string;
  m2_config?: Record<string, any>;
  
  m3_key?: string;
  m3_version?: string;
  m3_config?: Record<string, any>;
  
  // Métriques
  level1_metrics?: Record<string, any>;
  
  // Documentation
  description?: string;
  changelog?: string;
  
  // Nouveau système de versioning
  status: VersionStatus;
  is_baseline: boolean;
  git_commit_hash?: string;
  git_tag?: string;
  validation_sample_size?: number;
  validation_date?: string;
}

/**
 * Input pour créer une version
 */
export interface CreateVersionInput {
  version_name: string;
  description?: string;
  changelog?: string;
  x_key?: string;
  x_version?: string;
  y_key?: string;
  y_version?: string;
  m1_key?: string;
  m1_version?: string;
  m2_key?: string;
  m2_version?: string;
  m3_key?: string;
  m3_version?: string;
  level1_metrics?: Record<string, any>;
  status?: VersionStatus;
  is_baseline?: boolean;
  git_commit_hash?: string;
  git_tag?: string;
  validation_sample_size?: number;
}
