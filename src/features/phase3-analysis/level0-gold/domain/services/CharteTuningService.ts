// ============================================================================
// SERVICE - GESTION DES SUGGESTIONS DE TUNING
// ============================================================================
// Sprint 5 - Session 2 (Version finale)
// Fichier: src/features/phase3-analysis/level0-gold/domain/services/CharteTuningService.ts
// ============================================================================

import { getSupabase } from '@/lib/supabaseClient';
import type {
  CharteSuggestion,
  CategoryStats,
  GetSuggestionsParams,
  ApplySuggestionParams,
  ValidateSuggestionParams,
  RejectSuggestionParams,
  RollbackSuggestionParams,
  SuggestionOperationResult,
} from '@/types/algorithm-lab/core/tuning';

/**
 * Service de gestion des suggestions d'amélioration des chartes
 * 
 * Responsabilités:
 * - Récupérer les suggestions depuis la base
 * - Appliquer/Rejeter/Valider les suggestions
 * - Calculer et récupérer les stats par catégorie
 * - Gérer le workflow complet des suggestions
 */
export class CharteTuningService {
  private supabase = getSupabase();

  // ============================================================================
  // RÉCUPÉRATION DES SUGGESTIONS
  // ============================================================================

  /**
   * Récupère les suggestions selon des critères
   */
  async getSuggestions(
    params: GetSuggestionsParams = {}
  ): Promise<CharteSuggestion[]> {
    try {
      let query = this.supabase
        .from('charte_improvement_suggestions')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      // Filtres optionnels
      if (params.charte_id) {
        query = query.eq('charte_id', params.charte_id);
      }

      if (params.test_id) {
        query = query.eq('test_id', params.test_id);
      }

      if (params.status) {
        if (Array.isArray(params.status)) {
          query = query.in('status', params.status);
        } else {
          query = query.eq('status', params.status);
        }
      }

      if (params.priority) {
        if (Array.isArray(params.priority)) {
          query = query.in('priority', params.priority);
        } else {
          query = query.eq('priority', params.priority);
        }
      }

      // Pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération suggestions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CharteTuningService.getSuggestions error:', error);
      throw error;
    }
  }

  /**
   * Récupère une suggestion spécifique par ID
   */
  async getSuggestionById(suggestion_id: string): Promise<CharteSuggestion | null> {
    try {
      const { data, error } = await this.supabase
        .from('charte_improvement_suggestions')
        .select('*')
        .eq('suggestion_id', suggestion_id)
        .single();

      if (error) {
        console.error('Erreur récupération suggestion:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CharteTuningService.getSuggestionById error:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre de suggestions selon des critères
   */
  async countSuggestions(params: GetSuggestionsParams = {}): Promise<number> {
    try {
      let query = this.supabase
        .from('charte_improvement_suggestions')
        .select('suggestion_id', { count: 'exact', head: true });

      if (params.charte_id) {
        query = query.eq('charte_id', params.charte_id);
      }

      if (params.status) {
        if (Array.isArray(params.status)) {
          query = query.in('status', params.status);
        } else {
          query = query.eq('status', params.status);
        }
      }

      const { count, error } = await query;

      if (error) {
        console.error('Erreur comptage suggestions:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('CharteTuningService.countSuggestions error:', error);
      throw error;
    }
  }

  // ============================================================================
  // APPLICATION DES SUGGESTIONS
  // ============================================================================

  /**
   * Applique une suggestion (change status à applied_pending_validation)
   * 
   * Note: Cette méthode NE modifie PAS la charte elle-même.
   * Utilisez CharteEditionService.updateCharte() pour modifier la charte.
   */
  async applySuggestion(
    params: ApplySuggestionParams
  ): Promise<SuggestionOperationResult> {
    try {
      const { suggestion_id, new_version, applied_changes, notes } = params;

      // Récupérer suggestion actuelle
      const current = await this.getSuggestionById(suggestion_id);
      if (!current) {
        return {
          success: false,
          error: 'Suggestion non trouvée',
        };
      }

      // Vérifier statut
      if (current.status !== 'pending') {
        return {
          success: false,
          error: `Impossible d'appliquer: statut actuel = ${current.status}`,
        };
      }

      // Récupérer kappa_before depuis le test original
      const { data: testData, error: testError } = await this.supabase
        .from('level0_charte_tests')
        .select('kappa')
        .eq('test_id', current.test_id)
        .single();

      if (testError) {
        console.error('Erreur récupération test:', testError);
      }

      // Mettre à jour la suggestion
      const { data, error } = await this.supabase
        .from('charte_improvement_suggestions')
        .update({
          status: 'applied_pending_validation',
          applied_at: new Date().toISOString(),
          applied_in_version: new_version,
          kappa_before: testData?.kappa || current.kappa_before,
          supporting_data: {
            ...current.supporting_data,
            applied_changes,
            application_notes: notes,
          },
        })
        .eq('suggestion_id', suggestion_id)
        .select()
        .single();

      if (error) {
        console.error('Erreur application suggestion:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        suggestion: data,
        message: `Suggestion appliquée en version ${new_version}`,
      };
    } catch (error) {
      console.error('CharteTuningService.applySuggestion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // ============================================================================
  // VALIDATION DES SUGGESTIONS
  // ============================================================================

  /**
   * Valide une suggestion appliquée (change status à applied_validated)
   * 
   * Appelé après re-test de la charte modifiée pour confirmer l'amélioration.
   */
  async validateSuggestion(
    params: ValidateSuggestionParams
  ): Promise<SuggestionOperationResult> {
    try {
      const { suggestion_id, validation_test_id, kappa_after, notes } = params;

      // Récupérer suggestion actuelle
      const current = await this.getSuggestionById(suggestion_id);
      if (!current) {
        return {
          success: false,
          error: 'Suggestion non trouvée',
        };
      }

      // Vérifier statut
      if (current.status !== 'applied_pending_validation') {
        return {
          success: false,
          error: `Impossible de valider: statut actuel = ${current.status}`,
        };
      }

      // Calculer amélioration
      const improvement = current.kappa_before
        ? kappa_after - current.kappa_before
        : null;

      // Mettre à jour la suggestion
      const { data, error } = await this.supabase
        .from('charte_improvement_suggestions')
        .update({
          status: 'applied_validated',
          validation_test_id,
          kappa_after,
          supporting_data: {
            ...current.supporting_data,
            kappa_improvement: improvement,
            validation_notes: notes,
            validated_at: new Date().toISOString(),
          },
        })
        .eq('suggestion_id', suggestion_id)
        .select()
        .single();

      if (error) {
        console.error('Erreur validation suggestion:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        suggestion: data,
        message: improvement
          ? `Suggestion validée - Amélioration Kappa: ${improvement > 0 ? '+' : ''}${improvement.toFixed(3)}`
          : 'Suggestion validée',
      };
    } catch (error) {
      console.error('CharteTuningService.validateSuggestion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // ============================================================================
  // REJET ET ROLLBACK DES SUGGESTIONS
  // ============================================================================

  /**
   * Rejette une suggestion sans l'appliquer
   */
  async rejectSuggestion(
    params: RejectSuggestionParams
  ): Promise<SuggestionOperationResult> {
    try {
      const { suggestion_id, rejection_reason } = params;

      // Récupérer suggestion actuelle
      const current = await this.getSuggestionById(suggestion_id);
      if (!current) {
        return {
          success: false,
          error: 'Suggestion non trouvée',
        };
      }

      // Vérifier statut
      if (current.status !== 'pending') {
        return {
          success: false,
          error: `Impossible de rejeter: statut actuel = ${current.status}`,
        };
      }

      // Mettre à jour la suggestion
      const { data, error } = await this.supabase
        .from('charte_improvement_suggestions')
        .update({
          status: 'rejected',
          rejection_reason,
        })
        .eq('suggestion_id', suggestion_id)
        .select()
        .single();

      if (error) {
        console.error('Erreur rejet suggestion:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        suggestion: data,
        message: 'Suggestion rejetée',
      };
    } catch (error) {
      console.error('CharteTuningService.rejectSuggestion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Rollback une suggestion appliquée (régression détectée)
   */
  async rollbackSuggestion(
    params: RollbackSuggestionParams
  ): Promise<SuggestionOperationResult> {
    try {
      const { suggestion_id, rollback_reason, rollback_version } = params;

      // Récupérer suggestion actuelle
      const current = await this.getSuggestionById(suggestion_id);
      if (!current) {
        return {
          success: false,
          error: 'Suggestion non trouvée',
        };
      }

      // Vérifier statut
      if (
        current.status !== 'applied_pending_validation' &&
        current.status !== 'applied_validated'
      ) {
        return {
          success: false,
          error: `Impossible de rollback: statut actuel = ${current.status}`,
        };
      }

      // Mettre à jour la suggestion
      const { data, error } = await this.supabase
        .from('charte_improvement_suggestions')
        .update({
          status: 'applied_rolled_back',
          rollback_reason,
          supporting_data: {
            ...current.supporting_data,
            rollback_version,
            rolled_back_at: new Date().toISOString(),
          },
        })
        .eq('suggestion_id', suggestion_id)
        .select()
        .single();

      if (error) {
        console.error('Erreur rollback suggestion:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        suggestion: data,
        message: `Suggestion annulée - Retour à version ${rollback_version}`,
      };
    } catch (error) {
      console.error('CharteTuningService.rollbackSuggestion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // ============================================================================
  // STATISTIQUES PAR CATÉGORIE
  // ============================================================================

  /**
   * Récupère les statistiques par catégorie pour un test
   */
  async getCategoryStats(test_id: string): Promise<CategoryStats[]> {
    try {
      const { data, error } = await this.supabase
        .from('charte_category_stats')
        .select('*')
        .eq('test_id', test_id)
        .order('total_instances', { ascending: false });

      if (error) {
        console.error('Erreur récupération stats catégories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CharteTuningService.getCategoryStats error:', error);
      throw error;
    }
  }

  /**
   * Calcule et stocke les stats par catégorie pour un test
   * 
   * Appelle la fonction SQL calculate_category_stats()
   */
  async calculateCategoryStats(
    test_id: string,
    charte_id: string
  ): Promise<{ success: boolean; stats?: CategoryStats[]; error?: string }> {
    try {
      // Appeler la fonction SQL
      const { error: rpcError } = await this.supabase.rpc('calculate_category_stats', {
        p_test_id: test_id,
        p_charte_id: charte_id,
      });

      if (rpcError) {
        console.error('Erreur calcul stats:', rpcError);
        return {
          success: false,
          error: rpcError.message,
        };
      }

      // Récupérer les stats calculées
      const stats = await this.getCategoryStats(test_id);

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('CharteTuningService.calculateCategoryStats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Génère automatiquement des suggestions pour un test
   * 
   * Appelle la fonction SQL generate_improvement_suggestions()
   * puis insère les résultats dans la table
   */
  async generateSuggestions(
    test_id: string,
    charte_id: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Appeler la fonction SQL pour générer suggestions
      const { data: suggestions, error: rpcError } = await this.supabase.rpc(
        'generate_improvement_suggestions',
        {
          p_test_id: test_id,
          p_charte_id: charte_id,
        }
      );

      if (rpcError) {
        console.error('Erreur génération suggestions:', rpcError);
        return {
          success: false,
          count: 0,
          error: rpcError.message,
        };
      }

      if (!suggestions || suggestions.length === 0) {
        return {
          success: true,
          count: 0,
        };
      }

      // Insérer les suggestions dans la table
      const suggestionsToInsert = suggestions.map((s: any) => ({
        charte_id,
        test_id,
        suggestion_type: s.suggestion_type,
        category: s.category,
        priority: s.priority,
        description: s.description,
        supporting_data: s.supporting_data,
        status: 'pending',
      }));

      const { error: insertError } = await this.supabase
        .from('charte_improvement_suggestions')
        .insert(suggestionsToInsert);

      if (insertError) {
        console.error('Erreur insertion suggestions:', insertError);
        return {
          success: false,
          count: 0,
          error: insertError.message,
        };
      }

      return {
        success: true,
        count: suggestions.length,
      };
    } catch (error) {
      console.error('CharteTuningService.generateSuggestions error:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}

// Export instance singleton
export const charteTuningService = new CharteTuningService();
