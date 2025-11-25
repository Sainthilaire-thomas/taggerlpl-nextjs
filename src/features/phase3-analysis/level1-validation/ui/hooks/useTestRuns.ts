// src/features/phase3-analysis/level1-validation/ui/hooks/useTestRuns.ts

/**
 * Hook pour gérer les test runs (historique des tests d'algorithmes)
 * Phase 3 - Level 1 Validation
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { 
  TestRun, 
  CreateTestRunInput, 
  UpdateTestRunInput, 
  TestOutcome,
  BaselineDiff 
} from '@/types/algorithm-lab/versioning';
import type { VariableTarget } from '@/types/algorithm-lab/core/variables';

export function useTestRuns() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Créer un nouveau test run
   */
  const createTestRun = async (input: CreateTestRunInput): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer la baseline actuelle pour calculer le diff
      const baseline = await getBaselineForTarget(input.target);
      let baselineDiff: BaselineDiff | undefined;

      if (baseline) {
        baselineDiff = calculateDiff(input.metrics, baseline.level1_metrics);
      }

      // 🔍 DEBUG: Voir exactement ce qu'on envoie
      const payload = {
        algorithm_key: input.algorithm_key,
        algorithm_version: input.algorithm_version,
        target: input.target,
        sample_size: input.sample_size,
        metrics: input.metrics,
        error_pairs: input.error_pairs,
        outcome: 'pending',
        baseline_version_id: baseline?.version_id,
        baseline_diff: baselineDiff,
        run_duration_ms: input.run_duration_ms,
        created_by: input.created_by,
        annotation_count: 0,
      };
      
      console.log('🔍 DEBUG createTestRun - Input:', JSON.stringify(input, null, 2));
      console.log('🔍 DEBUG createTestRun - Payload:', JSON.stringify(payload, null, 2));

      // Insérer le test run
      const { data, error: insertError } = await supabase
        .from('test_runs')
        .insert(payload)
        .select('run_id')
        .single();

      if (insertError) {
        console.error('🔍 DEBUG createTestRun - Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      console.log('✅ Test run créé avec succès:', data.run_id);
      return data.run_id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du test run';
      setError(message);
      console.error('Error creating test run:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour l'outcome d'un test run
   */
  const updateOutcome = async (runId: string, outcome: TestOutcome): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const updates: UpdateTestRunInput = { outcome };

      // Si on passe en investigation, enregistrer la date de début
      if (outcome === 'investigating') {
        updates.investigation_started_at = new Date().toISOString();
      }

      // Si investigation terminée, enregistrer la date de fin
      if (outcome === 'investigated') {
        updates.investigation_completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('test_runs')
        .update(updates)
        .eq('run_id', runId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du test run';
      setError(message);
      console.error('Error updating test run:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour un test run (générique)
   */
  const updateTestRun = async (runId: string, updates: UpdateTestRunInput): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('test_runs')
        .update(updates)
        .eq('run_id', runId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du test run';
      setError(message);
      console.error('Error updating test run:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer les test runs pour un algorithme
   */
  const getRunsForAlgorithm = async (
    algorithmKey: string, 
    limit: number = 10
  ): Promise<TestRun[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('test_runs')
        .select('*')
        .eq('algorithm_key', algorithmKey)
        .order('run_date', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      return data as TestRun[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des test runs';
      setError(message);
      console.error('Error fetching test runs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer un test run par ID
   */
  const getTestRun = async (runId: string): Promise<TestRun | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('test_runs')
        .select('*')
        .eq('run_id', runId)
        .single();

      if (fetchError) throw fetchError;

      return data as TestRun;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération du test run';
      setError(message);
      console.error('Error fetching test run:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer la version baseline pour une target
   */
  const getBaselineForTarget = async (target: VariableTarget): Promise<any | null> => {
    try {
      // Chercher une version baseline pour cette target
      const targetKeyField = `${target.toLowerCase()}_key`;
      
      const { data, error: fetchError } = await supabase
        .from('algorithm_version_registry')
        .select('*')
        .eq('is_baseline', true)
        .not(targetKeyField, 'is', null)
        .order('validation_date', { ascending: false })
        .limit(1)
        .maybeSingle();  // ✅ Retourne null si aucune baseline (pas d'erreur 406)

      if (fetchError) {
        console.warn('Warning fetching baseline:', fetchError.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching baseline:', err);
      return null;
    }
  };

  /**
   * Calculer les différences avec une baseline
   */
  const calculateDiff = (
    currentMetrics: any, 
    baselineMetrics: any
  ): BaselineDiff => {
    // Extraire les métriques de la baseline
    const baseline = baselineMetrics?.X || baselineMetrics?.Y || baselineMetrics || {};
    
    const accuracyDelta = (currentMetrics.accuracy || 0) - (baseline.accuracy || 0);
    const kappaDelta = currentMetrics.kappa && baseline.kappa 
      ? currentMetrics.kappa - baseline.kappa 
      : undefined;

    // Calculer les deltas de F1 par tag
    const f1Deltas: Record<string, number> = {};
    const currentF1 = currentMetrics.f1Score || {};
    const baselineF1 = baseline.f1Score || {};

    for (const tag in currentF1) {
      if (baselineF1[tag] !== undefined) {
        f1Deltas[tag] = currentF1[tag] - baselineF1[tag];
      }
    }

    // Calculer corrections et régressions (approximation)
    const errorsDelta = accuracyDelta * -1 * (currentMetrics.sample_size || 100);
    const corrections = errorsDelta > 0 ? Math.abs(errorsDelta) : 0;
    const regressions = errorsDelta < 0 ? Math.abs(errorsDelta) : 0;

    return {
      accuracy_delta: accuracyDelta,
      kappa_delta: kappaDelta,
      f1_deltas: f1Deltas,
      errors_delta: errorsDelta,
      corrections,
      regressions,
    };
  };

  /**
   * Incrémenter le compteur d'annotations
   */
  const incrementAnnotationCount = async (runId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase.rpc(
        'increment_annotation_count',
        { p_run_id: runId }
      );

      if (updateError) {
        // Fallback si la fonction RPC n'existe pas
        const run = await getTestRun(runId);
        if (run) {
          return await updateTestRun(runId, {
            annotation_count: (run.annotation_count || 0) + 1
          });
        }
      }

      return true;
    } catch (err) {
      console.error('Error incrementing annotation count:', err);
      return false;
    }
  };

  return {
    // State
    loading,
    error,
    
    // CRUD operations
    createTestRun,
    updateOutcome,
    updateTestRun,
    getTestRun,
    getRunsForAlgorithm,
    
    // Baseline management
    getBaselineForTarget,
    calculateDiff,
    
    // Helpers
    incrementAnnotationCount,
  };
}
