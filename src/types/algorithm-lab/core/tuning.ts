// ============================================================================
// TYPES TUNING - SYSTÈME D'AMÉLIORATION DES CHARTES
// ============================================================================
// Sprint 5 - Session 2 (Version finale - Architecture conforme)
// Fichier: src/types/algorithm-lab/core/tuning.ts
// ============================================================================

/**
 * Statuts possibles d'une suggestion d'amélioration
 */
export type SuggestionStatus =
  | 'pending'                      // En attente de décision
  | 'applied_pending_validation'   // Appliquée, en attente de re-test
  | 'applied_validated'            // Appliquée et validée (amélioration confirmée)
  | 'applied_rolled_back'          // Appliquée puis annulée (régression)
  | 'rejected';                    // Rejetée sans application

/**
 * Types de suggestions possibles
 */
export type SuggestionType =
  | 'add_alias'              // Ajouter un alias pour un tag invalide
  | 'remove_alias'           // Supprimer un alias obsolète
  | 'add_example'            // Ajouter un exemple à une catégorie
  | 'add_counter_example'    // Ajouter un contre-exemple
  | 'clarify_description'    // Clarifier la description d'une catégorie
  | 'merge_categories'       // Fusionner deux catégories similaires
  | 'adjust_rule';           // Ajuster une règle d'annotation

/**
 * Types de modifications de charte
 */
export type ModificationType =
  | 'alias_added'           // Nouvel alias ajouté
  | 'alias_removed'         // Alias supprimé
  | 'example_added'         // Exemple ajouté à une catégorie
  | 'example_removed'       // Exemple retiré
  | 'description_changed'   // Description catégorie modifiée
  | 'rule_changed'          // Règle d'annotation modifiée
  | 'category_added'        // Nouvelle catégorie créée
  | 'category_removed';     // Catégorie supprimée

/**
 * Niveaux de priorité
 */
export type SuggestionPriority = 1 | 2 | 3;

/**
 * Suggestion d'amélioration de charte
 */
export interface CharteSuggestion {
  suggestion_id: string;
  charte_id: string;
  test_id: string;
  suggestion_type: SuggestionType;
  category: string | null;
  priority: SuggestionPriority;
  description: string;
  supporting_data: {
    frequency?: number;
    accuracy?: number;
    cas_a_count?: number;
    cas_b_count?: number;
    cas_c_count?: number;
    pattern?: string;
    observation?: string;
    recommended_action?: string;
    current_definition?: string;
    proposed_clarification?: string;
    pairs_concerned?: number[];
    avg_confidence?: number;
    invalid_tag?: string;
    target_tag?: string;
    thomas_comments?: string[];
    [key: string]: any; // Flexible pour données additionnelles
  };
  status: SuggestionStatus;
  applied_at: string | null;
  applied_in_version: string | null;
  validation_test_id: string | null;
  kappa_before: number | null;
  kappa_after: number | null;
  rollback_reason: string | null;
  rejection_reason: string | null;
  created_at: string;
}

/**
 * Statistiques par catégorie pour un test
 */
export interface CategoryStats {
  stat_id: string;
  charte_id: string;
  test_id: string;
  category: string;
  total_instances: number;
  correct_predictions: number;
  cas_a_count: number;
  cas_b_count: number;
  cas_c_count: number;
  accuracy: number;
  created_at: string;
}

/**
 * Historique de modification de charte
 */
export interface CharteModification {
  modification_id: string;
  charte_id: string;
  version_from: string;
  version_to: string;
  modification_type: ModificationType;
  field_modified: string;
  old_value: any | null;
  new_value: any | null;
  reason: string | null;
  source_test_id: string | null;
  source_suggestion_id: string | null;
  modified_by: string;
  modified_at: string;
}

/**
 * Paramètres pour récupérer les suggestions
 */
export interface GetSuggestionsParams {
  charte_id?: string;
  test_id?: string;
  status?: SuggestionStatus | SuggestionStatus[];
  priority?: SuggestionPriority | SuggestionPriority[];
  limit?: number;
  offset?: number;
}

/**
 * Paramètres pour appliquer une suggestion
 */
export interface ApplySuggestionParams {
  suggestion_id: string;
  new_version: string;        // Ex: "1.1.0"
  applied_changes: any;        // Détails des modifications appliquées
  notes?: string;
}

/**
 * Paramètres pour valider une suggestion
 */
export interface ValidateSuggestionParams {
  suggestion_id: string;
  validation_test_id: string;
  kappa_after: number;
  notes?: string;
}

/**
 * Paramètres pour rejeter une suggestion
 */
export interface RejectSuggestionParams {
  suggestion_id: string;
  rejection_reason: string;
}

/**
 * Paramètres pour rollback une suggestion
 */
export interface RollbackSuggestionParams {
  suggestion_id: string;
  rollback_reason: string;
  rollback_version: string;    // Version à laquelle revenir
}

/**
 * Paramètres pour mettre à jour une charte
 */
export interface UpdateCharteParams {
  charte_id: string;
  updates: Partial<{
    charte_name: string;
    charte_description: string;
    definition: any;
    prompt_template: string;
    prompt_params: any;
    notes: string;
  }>;
  modification_tracking?: {
    version_from: string;
    version_to: string;
    modification_type: ModificationType;
    field_modified: string;
    old_value: any;
    new_value: any;
    reason: string;
    source_test_id?: string;
    source_suggestion_id?: string;
  };
}

/**
 * Paramètres pour créer une nouvelle version de charte
 */
export interface CreateNewVersionParams {
  base_charte_id: string;
  new_version: string;
  changes: any;               // Modifications appliquées
  reason: string;
  source_suggestion_id?: string;
  is_pending_validation?: boolean;
  validation_deadline?: string;
}

/**
 * Résultat de comparaison entre deux versions
 */
export interface VersionComparison {
  version_from: string;
  version_to: string;
  modifications: CharteModification[];
  summary: {
    total_changes: number;
    by_type: Record<ModificationType, number>;
    categories_affected: string[];
  };
}

/**
 * Résultat d'opération sur suggestion
 */
export interface SuggestionOperationResult {
  success: boolean;
  suggestion?: CharteSuggestion;
  modification?: CharteModification;
  error?: string;
  message?: string;
}

/**
 * Résultat d'opération sur charte
 */
export interface CharteOperationResult {
  success: boolean;
  charte_id?: string;
  version?: string;
  modifications?: CharteModification[];
  error?: string;
  message?: string;
}
