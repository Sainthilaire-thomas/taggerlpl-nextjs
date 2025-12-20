// ============================================================================
// SERVICE - ÉDITION DES CHARTES ET VERSIONING
// ============================================================================
// Sprint 5 - Session 2 (Version finale)
// Fichier: src/features/phase3-analysis/level0-gold/domain/services/CharteEditionService.ts
// ============================================================================

import { getSupabase } from '@/lib/supabaseClient';
import type {
  CharteModification,
  UpdateCharteParams,
  CreateNewVersionParams,
  VersionComparison,
  CharteOperationResult,
  ModificationType,
} from '@/types/algorithm-lab/core/tuning';

/**
 * Service d'édition et de versioning des chartes
 * 
 * Responsabilités:
 * - Modifier les chartes (definition, prompt, etc.)
 * - Créer de nouvelles versions (1.0.0 → 1.1.0)
 * - Tracer toutes les modifications dans charte_modifications
 * - Comparer les versions
 * - Gérer l'historique complet
 */
export class CharteEditionService {
  private supabase = getSupabase();

  // ============================================================================
  // MISE À JOUR DES CHARTES
  // ============================================================================

  /**
   * Met à jour une charte existante
   * 
   * IMPORTANT: Cette méthode trace automatiquement les modifications
   * dans la table charte_modifications si modification_tracking est fourni.
   */
  async updateCharte(params: UpdateCharteParams): Promise<CharteOperationResult> {
    try {
      const { charte_id, updates, modification_tracking } = params;

      // Récupérer charte actuelle pour comparaison
      const { data: currentCharte, error: fetchError } = await this.supabase
        .from('level0_chartes')
        .select('*')
        .eq('charte_id', charte_id)
        .single();

      if (fetchError || !currentCharte) {
        return {
          success: false,
          error: 'Charte non trouvée',
        };
      }

      // Mettre à jour la charte
      const { data: updatedCharte, error: updateError } = await this.supabase
        .from('level0_chartes')
        .update(updates)
        .eq('charte_id', charte_id)
        .select()
        .single();

      if (updateError) {
        console.error('Erreur mise à jour charte:', updateError);
        return {
          success: false,
          error: updateError.message,
        };
      }

      // Tracer la modification si demandé
      let modifications: CharteModification[] = [];
      if (modification_tracking) {
        const modificationResult = await this.trackModification({
          charte_id,
          ...modification_tracking,
        });

        if (modificationResult.success && modificationResult.modification) {
          modifications.push(modificationResult.modification);
        }
      }

      return {
        success: true,
        charte_id: updatedCharte.charte_id,
        version: updatedCharte.version,
        modifications,
        message: 'Charte mise à jour avec succès',
      };
    } catch (error) {
      console.error('CharteEditionService.updateCharte error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Met à jour la définition (JSONB) d'une charte
   * 
   * Utilisé pour modifier categories, aliases, rules, etc.
   */
  async updateDefinition(
    charte_id: string,
    definition_updates: any,
    modification_details: {
      version_from: string;
      version_to: string;
      modification_type: ModificationType;
      field_modified: string;
      reason: string;
      source_suggestion_id?: string;
    }
  ): Promise<CharteOperationResult> {
    try {
      // Récupérer definition actuelle
      const { data: currentCharte, error: fetchError } = await this.supabase
        .from('level0_chartes')
        .select('definition')
        .eq('charte_id', charte_id)
        .single();

      if (fetchError || !currentCharte) {
        return {
          success: false,
          error: 'Charte non trouvée',
        };
      }

      const old_definition = currentCharte.definition;
      const new_definition = {
        ...old_definition,
        ...definition_updates,
      };

      // Mettre à jour
      const { error: updateError } = await this.supabase
        .from('level0_chartes')
        .update({ definition: new_definition })
        .eq('charte_id', charte_id);

      if (updateError) {
        console.error('Erreur mise à jour definition:', updateError);
        return {
          success: false,
          error: updateError.message,
        };
      }

      // Tracer la modification
      const modificationResult = await this.trackModification({
        charte_id,
        ...modification_details,
        old_value: old_definition,
        new_value: new_definition,
      });

      return {
        success: true,
        charte_id,
        version: modification_details.version_to,
        modifications: modificationResult.modification
          ? [modificationResult.modification]
          : [],
        message: 'Définition mise à jour avec succès',
      };
    } catch (error) {
      console.error('CharteEditionService.updateDefinition error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // ============================================================================
  // VERSIONING
  // ============================================================================

  /**
   * Crée une nouvelle version d'une charte
   * 
   * Exemple: CharteY_B_v1.0.0 → CharteY_B_v1.1.0
   * 
   * Note: Cette méthode NE supprime PAS l'ancienne version.
   * Les deux versions coexistent dans la base.
   */
  async createNewVersion(
    params: CreateNewVersionParams
  ): Promise<CharteOperationResult> {
    try {
      const {
        base_charte_id,
        new_version,
        changes,
        reason,
        source_suggestion_id,
        is_pending_validation = true,
        validation_deadline,
      } = params;

      // Récupérer charte de base
      const { data: baseCharte, error: fetchError } = await this.supabase
        .from('level0_chartes')
        .select('*')
        .eq('charte_id', base_charte_id)
        .single();

      if (fetchError || !baseCharte) {
        return {
          success: false,
          error: 'Charte de base non trouvée',
        };
      }

      // Construire nouveau charte_id avec nouvelle version
      // Ex: CharteY_B_v1.0.0 → CharteY_B_v1.1.0
      const base_id_without_version = base_charte_id.replace(
        /_v\d+\.\d+\.\d+$/,
        ''
      );
      const new_charte_id = `${base_id_without_version}_v${new_version}`;

      // Vérifier que nouvelle version n'existe pas déjà
      const { data: existing } = await this.supabase
        .from('level0_chartes')
        .select('charte_id')
        .eq('charte_id', new_charte_id)
        .single();

      if (existing) {
        return {
          success: false,
          error: `Version ${new_version} existe déjà`,
        };
      }

      // Appliquer les changements à la definition
      const new_definition = {
        ...baseCharte.definition,
        ...changes,
      };

      // Créer nouvelle charte
      const { data: newCharte, error: insertError } = await this.supabase
        .from('level0_chartes')
        .insert({
          charte_id: new_charte_id,
          charte_name: baseCharte.charte_name,
          charte_description: baseCharte.charte_description,
          variable: baseCharte.variable,
          definition: new_definition,
          is_baseline: false, // Nouvelle version n'est jamais baseline
          philosophy: baseCharte.philosophy,
          version: new_version,
          prompt_template: baseCharte.prompt_template,
          prompt_params: baseCharte.prompt_params,
          notes: baseCharte.notes,
          gold_standard_id: baseCharte.gold_standard_id,
          is_pending_validation,
          parent_version: baseCharte.version,
          validation_deadline,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erreur création nouvelle version:', insertError);
        return {
          success: false,
          error: insertError.message,
        };
      }

      // Tracer la création de version
      const modificationResult = await this.trackModification({
        charte_id: new_charte_id,
        version_from: baseCharte.version,
        version_to: new_version,
        modification_type: 'description_changed', // Type générique pour nouvelle version
        field_modified: 'version_created',
        old_value: baseCharte.definition,
        new_value: new_definition,
        reason,
        source_suggestion_id,
      });

      return {
        success: true,
        charte_id: new_charte_id,
        version: new_version,
        modifications: modificationResult.modification
          ? [modificationResult.modification]
          : [],
        message: `Nouvelle version ${new_version} créée avec succès`,
      };
    } catch (error) {
      console.error('CharteEditionService.createNewVersion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // ============================================================================
  // TRAÇABILITÉ DES MODIFICATIONS
  // ============================================================================

  /**
   * Trace une modification dans charte_modifications
   * 
   * Utilisé pour traçabilité scientifique complète.
   */
  private async trackModification(params: {
    charte_id: string;
    version_from: string;
    version_to: string;
    modification_type: ModificationType;
    field_modified: string;
    old_value?: any;
    new_value?: any;
    reason: string;
    source_test_id?: string;
    source_suggestion_id?: string;
  }): Promise<{
    success: boolean;
    modification?: CharteModification;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('charte_modifications')
        .insert({
          charte_id: params.charte_id,
          version_from: params.version_from,
          version_to: params.version_to,
          modification_type: params.modification_type,
          field_modified: params.field_modified,
          old_value: params.old_value,
          new_value: params.new_value,
          reason: params.reason,
          source_test_id: params.source_test_id,
          source_suggestion_id: params.source_suggestion_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur traçage modification:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        modification: data,
      };
    } catch (error) {
      console.error('CharteEditionService.trackModification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupère l'historique complet des modifications d'une charte
   */
  async getModificationHistory(
    charte_id: string
  ): Promise<CharteModification[]> {
    try {
      const { data, error } = await this.supabase
        .from('charte_modifications')
        .select('*')
        .eq('charte_id', charte_id)
        .order('modified_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération historique:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(
        'CharteEditionService.getModificationHistory error:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les modifications liées à une suggestion
   */
  async getModificationsBySuggestion(
    suggestion_id: string
  ): Promise<CharteModification[]> {
    try {
      const { data, error } = await this.supabase
        .from('charte_modifications')
        .select('*')
        .eq('source_suggestion_id', suggestion_id)
        .order('modified_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération modifications suggestion:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(
        'CharteEditionService.getModificationsBySuggestion error:',
        error
      );
      throw error;
    }
  }

  // ============================================================================
  // COMPARAISON DE VERSIONS
  // ============================================================================

  /**
   * Compare deux versions d'une charte
   * 
   * Retourne toutes les modifications entre version_from et version_to
   */
  async compareVersions(
    charte_base_name: string,
    version_from: string,
    version_to: string
  ): Promise<VersionComparison | null> {
    try {
      // Construire les IDs
      const charte_id_from = `${charte_base_name}_v${version_from}`;
      const charte_id_to = `${charte_base_name}_v${version_to}`;

      // Récupérer toutes modifications entre les versions
      const { data: modifications, error } = await this.supabase
        .from('charte_modifications')
        .select('*')
        .eq('charte_id', charte_id_to)
        .eq('version_from', version_from)
        .eq('version_to', version_to)
        .order('modified_at', { ascending: true });

      if (error) {
        console.error('Erreur comparaison versions:', error);
        throw error;
      }

      if (!modifications || modifications.length === 0) {
        return null;
      }

      // Analyser les modifications
      const by_type: Record<string, number> = {};
      const categories_affected = new Set<string>();

      modifications.forEach((mod) => {
        // Compter par type
        by_type[mod.modification_type] =
          (by_type[mod.modification_type] || 0) + 1;

        // Extraire catégories affectées
        const match = mod.field_modified.match(
          /definition\.categories\.([^.]+)/
        );
        if (match) {
          categories_affected.add(match[1]);
        }
      });

      return {
        version_from,
        version_to,
        modifications,
        summary: {
          total_changes: modifications.length,
          by_type: by_type as Record<ModificationType, number>,
          categories_affected: Array.from(categories_affected),
        },
      };
    } catch (error) {
      console.error('CharteEditionService.compareVersions error:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les versions d'une charte
   * 
   * Exemple: CharteY_B → [v1.0.0, v1.1.0, v1.2.0]
   */
  async getVersions(charte_base_name: string): Promise<
    Array<{
      charte_id: string;
      version: string;
      created_at: string;
      is_baseline: boolean;
      is_pending_validation: boolean;
    }>
  > {
    try {
      const { data, error } = await this.supabase
        .from('level0_chartes')
        .select('charte_id, version, created_at, is_baseline, is_pending_validation')
        .like('charte_id', `${charte_base_name}_v%`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur récupération versions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CharteEditionService.getVersions error:', error);
      throw error;
    }
  }
}

// Export instance singleton
export const charteEditionService = new CharteEditionService();
