// src/features/phase3-analysis/level1-validation/ui/hooks/useVersionValidation.ts

/**
 * Hook pour gérer la validation et promotion des versions d'algorithmes
 * Phase 3 - Level 1 Validation
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { 
  AlgorithmVersion, 
  CreateVersionInput,
  VersionStatus 
} from '@/types/algorithm-lab/versioning';
import type { VariableTarget } from '@/types/algorithm-lab/core/variables';

export function useVersionValidation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupérer le commit Git actuel (si disponible)
   */
  const getCurrentGitCommit = useCallback(async (): Promise<string | null> => {
    try {
      // Appeler l'API pour récupérer le commit actuel
      const response = await fetch('/api/git/current-commit');
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.commit || null;
    } catch (err) {
      console.error('Error fetching git commit:', err);
      return null;
    }
  }, []);

  /**
   * Promouvoir un test run en version officielle
   */
  const promoteToVersion = useCallback(async (
    runId: string,
    versionData: CreateVersionInput
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Récupérer le test run
      const { data: testRun, error: fetchError } = await supabase
        .from('test_runs')
        .select('*')
        .eq('run_id', runId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Récupérer le commit Git actuel si pas fourni
      const gitCommit = versionData.git_commit_hash || await getCurrentGitCommit();

      // 3. Créer la version
      const { data: version, error: insertError } = await supabase
        .from('algorithm_version_registry')
        .insert({
          version_name: versionData.version_name,
          description: versionData.description,
          changelog: versionData.changelog,
          
          // Copier les algorithmes du test run
          x_key: versionData.x_key || (testRun.target === 'X' ? testRun.algorithm_key : undefined),
          x_version: versionData.x_version || (testRun.target === 'X' ? testRun.algorithm_version : undefined),
          
          y_key: versionData.y_key || (testRun.target === 'Y' ? testRun.algorithm_key : undefined),
          y_version: versionData.y_version || (testRun.target === 'Y' ? testRun.algorithm_version : undefined),
          
          m1_key: versionData.m1_key || (testRun.target === 'M1' ? testRun.algorithm_key : undefined),
          m1_version: versionData.m1_version || (testRun.target === 'M1' ? testRun.algorithm_version : undefined),
          
          m2_key: versionData.m2_key || (testRun.target === 'M2' ? testRun.algorithm_key : undefined),
          m2_version: versionData.m2_version || (testRun.target === 'M2' ? testRun.algorithm_version : undefined),
          
          m3_key: versionData.m3_key || (testRun.target === 'M3' ? testRun.algorithm_key : undefined),
          m3_version: versionData.m3_version || (testRun.target === 'M3' ? testRun.algorithm_version : undefined),
          
          // Métriques du test
          level1_metrics: { [testRun.target]: testRun.metrics },
          
          // Métadonnées de validation
          status: versionData.status || 'validated',
          is_baseline: versionData.is_baseline || false,
          git_commit_hash: gitCommit,
          git_tag: versionData.git_tag,
          validation_sample_size: testRun.sample_size,
          validation_date: new Date().toISOString(),
          
          is_active: true,
          deprecated: false,
        })
        .select('version_id')
        .single();

      if (insertError) throw insertError;

      // 4. Mettre à jour le test run
      const { error: updateError } = await supabase
        .from('test_runs')
        .update({
          outcome: 'promoted',
          promoted_to_version_id: version.version_id,
        })
        .eq('run_id', runId);

      if (updateError) throw updateError;

      return version.version_id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la promotion de la version';
      setError(message);
      console.error('Error promoting to version:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getCurrentGitCommit]);

  /**
   * Définir une version comme baseline pour une target
   */
  const setAsBaseline = useCallback(async (
    versionId: string,
    target: VariableTarget
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Désactiver l'ancienne baseline pour cette target
      const targetKeyField = `${target.toLowerCase()}_key`;
      
      const { error: updateError } = await supabase
        .from('algorithm_version_registry')
        .update({ is_baseline: false })
        .eq('is_baseline', true)
        .not(targetKeyField, 'is', null);

      if (updateError) throw updateError;

      // 2. Activer la nouvelle baseline
      const { error: setError } = await supabase
        .from('algorithm_version_registry')
        .update({ 
          is_baseline: true,
          status: 'baseline' 
        })
        .eq('version_id', versionId);

      if (setError) throw setError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la définition de la baseline';
      setError(message);
      console.error('Error setting baseline:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Activer/Désactiver une version
   */
  const toggleVersionActive = useCallback(async (
    versionId: string,
    isActive: boolean
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('algorithm_version_registry')
        .update({ is_active: isActive })
        .eq('version_id', versionId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la version';
      setError(message);
      console.error('Error toggling version:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Déprécier une version
   */
  const deprecateVersion = useCallback(async (
    versionId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('algorithm_version_registry')
        .update({ 
          status: 'deprecated',
          deprecated: true,
          is_active: false,
          is_baseline: false,
        })
        .eq('version_id', versionId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la dépréciation de la version';
      setError(message);
      console.error('Error deprecating version:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer toutes les versions
   */
  const getAllVersions = useCallback(async (): Promise<AlgorithmVersion[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('algorithm_version_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data as AlgorithmVersion[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des versions';
      setError(message);
      console.error('Error fetching versions:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer les versions pour une target spécifique
   */
  const getVersionsForTarget = useCallback(async (
    target: VariableTarget
  ): Promise<AlgorithmVersion[]> => {
    setLoading(true);
    setError(null);

    try {
      const targetKeyField = `${target.toLowerCase()}_key`;
      
      const { data, error: fetchError } = await supabase
        .from('algorithm_version_registry')
        .select('*')
        .not(targetKeyField, 'is', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data as AlgorithmVersion[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des versions';
      setError(message);
      console.error('Error fetching versions for target:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer une version par ID
   */
  const getVersion = useCallback(async (
    versionId: string
  ): Promise<AlgorithmVersion | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('algorithm_version_registry')
        .select('*')
        .eq('version_id', versionId)
        .single();

      if (fetchError) throw fetchError;

      return data as AlgorithmVersion;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération de la version';
      setError(message);
      console.error('Error fetching version:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    
    // Version management
    promoteToVersion,
    setAsBaseline,
    toggleVersionActive,
    deprecateVersion,
    
    // Queries
    getAllVersions,
    getVersionsForTarget,
    getVersion,
    
    // Helpers
    getCurrentGitCommit,
  };
}
