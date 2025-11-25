// src/features/phase3-analysis/level1-validation/ui/hooks/useInvestigation.ts

/**
 * Hook pour gérer le mode investigation et les annotations
 * Phase 3 - Level 1 Validation
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { 
  InvestigationAnnotation, 
  CreateInvestigationAnnotationInput 
} from '@/types/algorithm-lab/versioning';
import { useTestRuns } from './useTestRuns';

interface InvestigationState {
  isActive: boolean;
  currentRunId: string | null;
  annotationCount: number;
  startedAt: Date | null;
}

export function useInvestigation() {
  const [state, setState] = useState<InvestigationState>({
    isActive: false,
    currentRunId: null,
    annotationCount: 0,
    startedAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { updateOutcome, incrementAnnotationCount } = useTestRuns();

  /**
   * Démarrer une investigation
   */
  const startInvestigation = useCallback(async (runId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Mettre à jour l'outcome du test run
      const success = await updateOutcome(runId, 'investigating');
      
      if (success) {
        setState({
          isActive: true,
          currentRunId: runId,
          annotationCount: 0,
          startedAt: new Date(),
        });
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du démarrage de l\'investigation';
      setError(message);
      console.error('Error starting investigation:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateOutcome]);

  /**
   * Ajouter une annotation d'investigation
   */
  const addAnnotation = useCallback(async (
    input: CreateInvestigationAnnotationInput
  ): Promise<string | null> => {
    if (!state.isActive || !state.currentRunId) {
      setError('Aucune investigation en cours');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('investigation_annotations')
        .insert({
          run_id: input.run_id,
          pair_id: input.pair_id,
          turn_id: input.turn_id,
          annotation_type: input.annotation_type,
          content: input.content,
          expected_tag: input.expected_tag,
          predicted_tag: input.predicted_tag,
          verbatim_excerpt: input.verbatim_excerpt,
          error_category: input.error_category,
          severity: input.severity || 'minor',
          actionable: input.actionable !== false,
          created_by: input.created_by,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Incrémenter le compteur
      await incrementAnnotationCount(input.run_id);

      // Mettre à jour l'état local
      setState(prev => ({
        ...prev,
        annotationCount: prev.annotationCount + 1,
      }));

      return data.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'annotation';
      setError(message);
      console.error('Error adding annotation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.isActive, state.currentRunId, incrementAnnotationCount]);

  /**
   * Récupérer les annotations pour un run
   */
  const getAnnotationsForRun = useCallback(async (
    runId: string
  ): Promise<InvestigationAnnotation[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('investigation_annotations')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return data as InvestigationAnnotation[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération des annotations';
      setError(message);
      console.error('Error fetching annotations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer les annotations groupées par catégorie d'erreur
   */
  const getAnnotationsByCategory = useCallback(async (
    runId: string
  ): Promise<Record<string, InvestigationAnnotation[]>> => {
    const annotations = await getAnnotationsForRun(runId);
    
    const grouped: Record<string, InvestigationAnnotation[]> = {};
    
    annotations.forEach(annotation => {
      const category = annotation.error_category || 'Autres';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(annotation);
    });

    return grouped;
  }, [getAnnotationsForRun]);

  /**
   * Générer un résumé automatique des annotations
   */
  const generateSummary = useCallback(async (
    runId: string
  ): Promise<Record<string, any>> => {
    const annotations = await getAnnotationsForRun(runId);
    const grouped = await getAnnotationsByCategory(runId);

    // Compter par type
    const byType = annotations.reduce((acc, ann) => {
      acc[ann.annotation_type] = (acc[ann.annotation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Compter par sévérité
    const bySeverity = annotations.reduce((acc, ann) => {
      acc[ann.severity] = (acc[ann.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identifier les catégories les plus fréquentes
    const topCategories = Object.entries(grouped)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([category, anns]) => ({
        category,
        count: anns.length,
        examples: anns.slice(0, 3).map(a => a.content),
      }));

    return {
      total: annotations.length,
      byType,
      bySeverity,
      topCategories,
      actionableCount: annotations.filter(a => a.actionable).length,
    };
  }, [getAnnotationsForRun, getAnnotationsByCategory]);

  /**
   * Compléter une investigation
   */
  const completeInvestigation = useCallback(async (
    summary?: Record<string, any>,
    notes?: string
  ): Promise<boolean> => {
    if (!state.currentRunId) {
      setError('Aucune investigation en cours');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Générer un résumé automatique si non fourni
      const finalSummary = summary || await generateSummary(state.currentRunId);

      // Mettre à jour le test run
      const { error: updateError } = await supabase
        .from('test_runs')
        .update({
          outcome: 'investigated',
          investigation_completed_at: new Date().toISOString(),
          investigation_summary: finalSummary,
          investigation_notes: notes,
        })
        .eq('run_id', state.currentRunId);

      if (updateError) throw updateError;

      // Réinitialiser l'état
      setState({
        isActive: false,
        currentRunId: null,
        annotationCount: 0,
        startedAt: null,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la finalisation de l\'investigation';
      setError(message);
      console.error('Error completing investigation:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.currentRunId, generateSummary]);

  /**
   * Annuler une investigation en cours
   */
  const cancelInvestigation = useCallback(async (): Promise<boolean> => {
    if (!state.currentRunId) {
      setError('Aucune investigation en cours');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Remettre le test run en pending
      const success = await updateOutcome(state.currentRunId, 'pending');

      if (success) {
        setState({
          isActive: false,
          currentRunId: null,
          annotationCount: 0,
          startedAt: null,
        });
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'annulation de l\'investigation';
      setError(message);
      console.error('Error canceling investigation:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.currentRunId, updateOutcome]);

  return {
    // State
    state,
    loading,
    error,
    
    // Investigation lifecycle
    startInvestigation,
    completeInvestigation,
    cancelInvestigation,
    
    // Annotations
    addAnnotation,
    getAnnotationsForRun,
    getAnnotationsByCategory,
    generateSummary,
  };
}
