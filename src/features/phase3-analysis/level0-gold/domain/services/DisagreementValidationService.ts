/**
 * Service de gestion des validations de désaccords
 * Sprint 4 - Phase 2
 * 
 * Emplacement: src/features/phase3-analysis/level0-gold/domain/services/DisagreementValidationService.ts
 * 
 * Responsabilités:
 * - Récupérer désaccords en attente de validation
 * - Valider désaccords (CAS A/B/C)
 * - Calculer Kappa corrigé via fonction SQL
 * - Propager corrections vers analysis_pairs (si CAS A)
 * - Gérer statistiques de validation
 */

import { getSupabase } from '@/lib/supabaseClient';
import {
  DisagreementValidation,
  DisagreementValidationInput,
  PendingDisagreement,
  CorrectedKappaResult,
  ValidationStats,
  DisagreementValidationResponse,
  ValidationServiceResponse,
  ValidationDecision
} from '@/types/algorithm-lab/Level0Types';

export class DisagreementValidationService {
  private static supabase = getSupabase();

  /**
   * Récupérer tous les désaccords en attente de validation pour un test
   * 
   * @param testId - UUID du test (level0_charte_tests)
   * @returns Liste des désaccords non encore validés
   */
  static async getPendingDisagreements(
  testId: string
): Promise<ValidationServiceResponse<PendingDisagreement[]>> {
  try {
    // 1. Récupérer le test avec ses désaccords (JSON)
    const { data: test, error: testError } = await this.supabase
      .from('level0_charte_tests')
      .select('charte_id, disagreements')
      .eq('test_id', testId)
      .single();

    if (testError) throw testError;
    if (!test || !test.disagreements) {
      return {
        success: true,
        data: [],
        message: 'Aucun désaccord trouvé pour ce test'
      };
    }

    // 2. Parser les désaccords (JSON)
    const disagreementsArray = Array.isArray(test.disagreements) 
      ? test.disagreements 
      : [];

    if (disagreementsArray.length === 0) {
      return {
        success: true,
        data: [],
        message: 'Aucun désaccord dans ce test'
      };
    }

    // 3. Récupérer validations existantes
    const { data: existingValidations } = await this.supabase
      .from('disagreement_validations')
      .select('pair_id')
      .eq('test_id', testId);

    const validatedPairIds = new Set(
      (existingValidations || []).map((v: any) => v.pair_id)
    );

    // 4. Filtrer désaccords non validés
    const unvalidatedDisagreements = disagreementsArray.filter(
      (d: any) => !validatedPairIds.has(d.pairId)
    );

    if (unvalidatedDisagreements.length === 0) {
      return {
        success: true,
        data: [],
        message: 'Tous les désaccords ont été validés'
      };
    }

    // 5. Enrichir avec call_id depuis analysis_pairs
    const pairIds = unvalidatedDisagreements.map((d: any) => d.pairId);

    const { data: pairs } = await this.supabase
      .from('analysis_pairs')
      .select('pair_id, call_id')
      .in('pair_id', pairIds);

    const pairIdToCallId = new Map(
      (pairs || []).map((p: any) => [p.pair_id, p.call_id])
    );

    // 6. Construire liste désaccords enrichis
    const pendingDisagreements: PendingDisagreement[] = unvalidatedDisagreements.map(
      (d: any) => ({
        pair_id: d.pairId,
        test_id: testId,
        charte_id: test.charte_id,
        manual_tag: d.manualTag,
        llm_tag: d.llmTag,
        llm_confidence: d.llmConfidence,
        llm_reasoning: d.llmReasoning,
        verbatim: d.verbatim,
        context_before: undefined,
context_after: undefined,
        call_id: pairIdToCallId.get(d.pairId) || ''
      })
    );

    return {
      success: true,
      data: pendingDisagreements,
      message: `${pendingDisagreements.length} désaccord(s) en attente`
    };
  } catch (error: any) {
    console.error('Error fetching pending disagreements:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des désaccords'
    };
  }
}

  /**
   * Valider un désaccord (CAS A, B ou C)
   * 
   * @param input - Données de validation
   * @returns Validation créée + Kappa corrigé recalculé
   */
  static async validateDisagreement(
    input: DisagreementValidationInput
  ): Promise<DisagreementValidationResponse> {
    try {
      // 1. Insérer validation dans disagreement_validations
      const { data: validation, error: insertError } = await this.supabase
        .from('disagreement_validations')
        .insert({
          test_id: input.test_id,
          pair_id: input.pair_id,
          charte_id: input.charte_id,
          manual_tag: input.manual_tag,
          llm_tag: input.llm_tag,
          llm_confidence: input.llm_confidence,
          llm_reasoning: input.llm_reasoning,
          validation_decision: input.validation_decision,
          corrected_tag: input.corrected_tag,
          validation_comment: input.validation_comment,
          verbatim: input.verbatim,
          context_before: input.context_before,
          context_after: input.context_after
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Si CAS A, propager correction vers analysis_pairs
      if (input.validation_decision === 'CAS_A_LLM_CORRECT' && input.corrected_tag) {
       await this.createCorrectedGoldStandard(
  input.pair_id,
  input.corrected_tag!,
  input.test_id
);
      }

      // 3. Recalculer Kappa corrigé
      const correctedKappaResponse = await this.getCorrectedKappa(input.test_id);

      // 4. Mettre à jour level0_charte_tests avec Kappa corrigé
      if (correctedKappaResponse.success && correctedKappaResponse.data) {
        await this.updateCharteTestKappa(input.test_id, correctedKappaResponse.data);
      }

      return {
        success: true,
        validation: validation as DisagreementValidation,
        correctedKappa: correctedKappaResponse.data
      };

    } catch (error: any) {
      console.error('Error validating disagreement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la validation'
      };
    }
  }

  /**
   * Propager correction CAS A vers analysis_pairs
   * Met à jour le gold standard manuel avec le tag corrigé
   */
  private static async createCorrectedGoldStandard(
  pairId: number,
  correctedTag: string,
  testId: string
): Promise<void> {
  try {
    // 1. Récupérer le gold_standard_id depuis le test
    const { data: test } = await this.supabase
      .from('level0_charte_tests')
      .select(`
        charte_id,
        level0_chartes!inner(gold_standard_id, variable)
      `)
      .eq('test_id', testId)
      .single();

    if (!test) {
      throw new Error('Test introuvable');
    }

    const goldStandardId = (test as any).level0_chartes.gold_standard_id;
    const variable = (test as any).level0_chartes.variable;

    if (!goldStandardId) {
      throw new Error('Gold standard ID manquant dans la charte');
    }

    // 2. Récupérer la version actuelle
    const { data: currentVersion } = await this.supabase
      .from('pair_gold_standards')
      .select('version')
      .eq('pair_id', pairId)
      .eq('gold_standard_id', goldStandardId)
      .eq('is_current', true)
      .single();

    if (!currentVersion) {
      throw new Error('Version actuelle du gold standard introuvable');
    }

    const newVersion = currentVersion.version + 1;

    // 3. Désactiver la version actuelle
    const { error: updateError } = await this.supabase
      .from('pair_gold_standards')
      .update({ is_current: false })
      .eq('pair_id', pairId)
      .eq('gold_standard_id', goldStandardId)
      .eq('version', currentVersion.version);

    if (updateError) throw updateError;

    // 4. Créer nouvelle version avec tag corrigé
    const columnToUpdate = variable === 'Y' ? 'reaction_gold_tag' : 'strategy_gold_tag';

    const { error: insertError } = await this.supabase
      .from('pair_gold_standards')
      .insert({
        pair_id: pairId,
        gold_standard_id: goldStandardId,
        [columnToUpdate]: correctedTag,
        version: newVersion,
        is_current: true,
        validated_at: new Date().toISOString(),
        validated_by: 'system',
        validation_notes: `CAS A: Corrected from disagreement validation (v${currentVersion.version} → v${newVersion})`
      });

    if (insertError) throw insertError;

    console.log(`✅ Gold standard corrigé: pair ${pairId}, version ${newVersion}, tag=${correctedTag}`);
  } catch (error) {
    console.error('Error creating corrected gold standard:', error);
    throw error;
  }
}

  /**
   * Calculer Kappa corrigé pour un test
   * Utilise la fonction SQL calculate_corrected_kappa()
   * 
   * @param testId - UUID du test
   * @returns Résultat avec Kappa brut et corrigé
   */
  static async getCorrectedKappa(
    testId: string
  ): Promise<ValidationServiceResponse<CorrectedKappaResult>> {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_corrected_kappa', { p_test_id: testId });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Aucune donnée retournée par calculate_corrected_kappa'
        };
      }

      const result = data[0] as CorrectedKappaResult;

      return {
        success: true,
        data: result
      };

    } catch (error: any) {
      console.error('Error calculating corrected kappa:', error);
      return {
        success: false,
        error: error.message || 'Erreur calcul Kappa corrigé'
      };
    }
  }

  /**
   * Mettre à jour level0_charte_tests avec Kappa corrigé
   */
  private static async updateCharteTestKappa(
    testId: string,
    kappaResult: CorrectedKappaResult
  ): Promise<void> {
    const { error } = await this.supabase
      .from('level0_charte_tests')
      .update({
        kappa_corrected: kappaResult.kappa_corrected,
        validated_disagreements: kappaResult.justified_disagreements,
        unjustified_disagreements: kappaResult.unjustified_disagreements
      })
      .eq('test_id', testId);

    if (error) {
      console.error('Error updating charte test kappa:', error);
      throw error;
    }
  }

  /**
   * Récupérer statistiques de validation pour un test
   * 
   * @param testId - UUID du test
   * @returns Statistiques agrégées des validations
   */
  static async getValidationStats(
    testId: string
  ): Promise<ValidationServiceResponse<ValidationStats>> {
    try {
      const correctedKappaResponse = await this.getCorrectedKappa(testId);
      
      if (!correctedKappaResponse.success || !correctedKappaResponse.data) {
        return {
          success: false,
          error: correctedKappaResponse.error
        };
      }

      const kappa = correctedKappaResponse.data;
      const totalDisagreements = 
        kappa.cas_a_count + kappa.cas_b_count + kappa.cas_c_count + kappa.pending_validations;
      const validatedCount = kappa.cas_a_count + kappa.cas_b_count + kappa.cas_c_count;

      const stats: ValidationStats = {
        total_disagreements: totalDisagreements,
        validated_count: validatedCount,
        pending_count: kappa.pending_validations,
        cas_a_percentage: totalDisagreements > 0 
          ? (kappa.cas_a_count / totalDisagreements) * 100 
          : 0,
        cas_b_percentage: totalDisagreements > 0 
          ? (kappa.cas_b_count / totalDisagreements) * 100 
          : 0,
        cas_c_percentage: totalDisagreements > 0 
          ? (kappa.cas_c_count / totalDisagreements) * 100 
          : 0,
        kappa_improvement: (kappa.kappa_corrected || 0) - (kappa.kappa_brut || 0)
      };

      return {
        success: true,
        data: stats
      };

    } catch (error: any) {
      console.error('Error calculating validation stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer toutes les validations d'un test
   * 
   * @param testId - UUID du test
   * @returns Liste de toutes les validations effectuées
   */
  static async getValidations(
    testId: string
  ): Promise<ValidationServiceResponse<DisagreementValidation[]>> {
    try {
      const { data, error } = await this.supabase
        .from('disagreement_validations')
        .select('*')
        .eq('test_id', testId)
        .order('validated_at', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: (data || []) as DisagreementValidation[]
      };

    } catch (error: any) {
      console.error('Error fetching validations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprimer une validation (rollback)
   * Si CAS A, restaure le tag manuel original
   * 
   * @param validationId - UUID de la validation à supprimer
   */
  static async deleteValidation(
  validationId: string
): Promise<ValidationServiceResponse<void>> {
  try {
    // 1. Récupérer validation avant suppression
    const { data: validation, error: fetchError } = await this.supabase
      .from('disagreement_validations')
      .select('*')
      .eq('validation_id', validationId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Si CAS A avec correction, rollback vers version précédente
    if (validation.validation_decision === 'CAS_A_LLM_CORRECT' && validation.corrected_tag) {
      await this.rollbackGoldStandardCorrection(
        validation.pair_id,
        validation.test_id
      );
    }

    // 3. Supprimer validation
    const { error: deleteError } = await this.supabase
      .from('disagreement_validations')
      .delete()
      .eq('validation_id', validationId);

    if (deleteError) throw deleteError;

    // 4. Recalculer Kappa corrigé
    const correctedKappaResponse = await this.getCorrectedKappa(validation.test_id);
    if (correctedKappaResponse.success && correctedKappaResponse.data) {
      await this.updateCharteTestKappa(validation.test_id, correctedKappaResponse.data);
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error deleting validation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Rollback d'une correction de gold standard
 * Réactive la version précédente et supprime la version corrigée
 */
private static async rollbackGoldStandardCorrection(
  pairId: number,
  testId: string
): Promise<void> {
  try {
    // 1. Récupérer le gold_standard_id depuis le test
    const { data: test } = await this.supabase
      .from('level0_charte_tests')
      .select(`
        level0_chartes!inner(gold_standard_id)
      `)
      .eq('test_id', testId)
      .single();

    if (!test) {
      throw new Error('Test introuvable');
    }

    const goldStandardId = (test as any).level0_chartes.gold_standard_id;

    if (!goldStandardId) {
      throw new Error('Gold standard ID manquant');
    }

    // 2. Récupérer la version actuelle (corrigée)
    const { data: currentVersion } = await this.supabase
      .from('pair_gold_standards')
      .select('version')
      .eq('pair_id', pairId)
      .eq('gold_standard_id', goldStandardId)
      .eq('is_current', true)
      .single();

    if (!currentVersion || currentVersion.version <= 1) {
      console.warn('Aucune correction à rollback pour cette paire');
      return;
    }

    // 3. Supprimer la version corrigée
    const { error: deleteError } = await this.supabase
      .from('pair_gold_standards')
      .delete()
      .eq('pair_id', pairId)
      .eq('gold_standard_id', goldStandardId)
      .eq('version', currentVersion.version);

    if (deleteError) throw deleteError;

    // 4. Réactiver la version précédente
    const { error: updateError } = await this.supabase
      .from('pair_gold_standards')
      .update({ is_current: true })
      .eq('pair_id', pairId)
      .eq('gold_standard_id', goldStandardId)
      .eq('version', currentVersion.version - 1);

    if (updateError) throw updateError;

    console.log(`✅ Rollback effectué: pair ${pairId}, version ${currentVersion.version} supprimée, version ${currentVersion.version - 1} réactivée`);
  } catch (error) {
    console.error('Error rolling back gold standard correction:', error);
    throw error;
  }
}

  /**
   * Récupérer charte_id depuis test_id
   * Helper interne
   */
  private static async getCharteIdFromTest(testId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('level0_charte_tests')
        .select('charte_id')
        .eq('test_id', testId)
        .single();

      if (error) throw error;
      return data?.charte_id || null;

    } catch (error: any) {
      console.error('Error fetching charte_id:', error);
      return null;
    }
  }
}
