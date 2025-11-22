/**
 * @fileoverview Structure universelle des résultats d'algorithmes
 * Tous les algorithmes (X, Y, M1, M2, M3) retournent cette structure.
 */

export interface UniversalResultDBColumns {
  // Colonnes X (stratégie conseiller)
  x_predicted_tag?: string;
  x_confidence?: number;
  x_algorithm_key?: string;
  x_algorithm_version?: string;
  x_computed_at?: string;
  
  // Colonnes Y (réaction client)
  y_predicted_tag?: string;
  y_confidence?: number;
  y_algorithm_key?: string;
  y_algorithm_version?: string;
  y_computed_at?: string;
  
  // Colonnes M1 (verbes d'action)
  m1_verb_density?: number;
  m1_verb_count?: number;
  m1_total_words?: number;
  m1_action_verbs?: string[];
  
  // Colonnes M2 (alignement linguistique)
  m2_lexical_alignment?: number;
  m2_semantic_alignment?: number;
  m2_global_alignment?: number;
  m2_shared_terms?: string[];
  
  // Colonnes M3 (charge cognitive)
  m3_hesitation_count?: number;
  m3_cognitive_score?: number;
  m3_cognitive_load?: string;
  m3_patterns?: any;
  
  // Statut de calcul
  computation_status?: 'complete' | 'error' | 'pending';
}

/**
 * Métadonnées étendues pour UniversalResult
 */
export interface UniversalResultMetadata {
  target: string;
  inputType: string;
  executionPath: string[];
  pairId?: number;
  turnId?: number;
  callId?: number;
  
  /** 
   * ✅ Colonnes DB - mapping direct vers analysis_pairs 
   * Les clés correspondent EXACTEMENT aux colonnes SQL
   */
  dbColumns: UniversalResultDBColumns;
  
  /**
   * Données UI optionnelles (non sauvegardées en DB)
   */
  uiData?: {
    explanation?: string;
    highlights?: string[];
    chartData?: any;
    intermediateSteps?: any[];
    warnings?: string[];
  };
}