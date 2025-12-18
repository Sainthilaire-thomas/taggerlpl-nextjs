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
      // 1. Récupérer charte_id depuis test
      const charteId = await this.getCharteIdFromTest(testId);
      if (!charteId) {
        return {
          success: false,
          error: 'Test introuvable ou charte_id manquant'
        };
      }

      // 2. Récupérer toutes les annotations du test
      const { data: annotations, error: annError } = await this.supabase
        .from('annotations')
        .select(`
          pair_id,
          reaction_tag,
          strategy_tag,
          confidence,
          reasoning
        `)
        .eq('test_id', testId);

      if (annError) throw annError;
      if (!annotations || annotations.length === 0) {
        return {
          success: true,
          data: [],
          message: 'Aucune annotation trouvée pour ce test'
        };
      }

      // 3. Récupérer les paires correspondantes avec tags manuels
      const pairIds = annotations.map(a => a.pair_id);
      const { data: pairs, error: pairError } = await this.supabase
        .from('analysis_pairs')
        .select(`
          pair_id,
          call_id,
          reaction_tag,
          strategy_tag,
          client_verbatim,
          conseiller_verbatim,
          prev1_verbatim,
          next1_verbatim
        `)
        .in('pair_id', pairIds);

      if (pairError) throw pairError;

      // 4. Récupérer validations existantes
      const { data: existingValidations, error: valError } = await this.supabase
        .from('disagreement_validations')
        .select('pair_id')
        .eq('test_id', testId);

      if (valError) throw valError;

      const validatedPairIds = new Set(
        (existingValidations || []).map(v => v.pair_id)
      );

      // 5. Identifier désaccords non validés
      const pendingDisagreements: PendingDisagreement[] = [];

      for (const annotation of annotations) {
        const pair = pairs?.find(p => p.pair_id === annotation.pair_id);
        if (!pair) continue;

        // Déjà validé ? Skip
        if (validatedPairIds.has(annotation.pair_id)) continue;

        // Identifier variable et tags
        const isY = pair.reaction_tag !== null;
        const manualTag = isY ? pair.reaction_tag : pair.strategy_tag;
        const llmTag = isY ? annotation.reaction_tag : annotation.strategy_tag;
        const verbatim = isY ? pair.client_verbatim : pair.conseiller_verbatim;

        // Désaccord ?
        if (manualTag !== llmTag) {
          pendingDisagreements.push({
            pair_id: annotation.pair_id,
            test_id: testId,
            charte_id: charteId,
            manual_tag: manualTag || '',
            llm_tag: llmTag || '',
            llm_confidence: annotation.confidence,
            llm_reasoning: annotation.reasoning,
            verbatim: verbatim || '',
            context_before: pair.prev1_verbatim,
            context_after: pair.next1_verbatim,
            call_id: pair.call_id
          });
        }
      }

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
        await this.propagateCorrectionToAnalysisPairs(
          input.pair_id,
          input.corrected_tag,
          input.manual_tag
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
  private static async propagateCorrectionToAnalysisPairs(
    pairId: number,
    correctedTag: string,
    originalTag: string
  ): Promise<void> {
    // Déterminer quelle colonne mettre à jour (X ou Y)
    const isYTag = ['CLIENT_POSITIF', 'CLIENT_NEGATIF', 'CLIENT_NEUTRE'].includes(correctedTag);
    const columnToUpdate = isYTag ? 'reaction_tag' : 'strategy_tag';

    const { error } = await this.supabase
      .from('analysis_pairs')
      .update({ [columnToUpdate]: correctedTag })
      .eq('pair_id', pairId);

    if (error) {
      console.error('Error propagating correction:', error);
      throw error;
    }

    console.log(`✅ Correction propagée: pair ${pairId}, ${originalTag} → ${correctedTag}`);
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

      // 2. Si CAS A avec correction, rollback vers tag original
      if (validation.validation_decision === 'CAS_A_LLM_CORRECT' && validation.corrected_tag) {
        await this.propagateCorrectionToAnalysisPairs(
          validation.pair_id,
          validation.manual_tag, // Restore original
          validation.corrected_tag
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
