// src/features/phase3-analysis/level1-validation/ui/hooks/useLevel2Preview.ts
/**
 * Hook de prévisualisation Level 2 pour Level 1
 * 
 * Permet d'afficher les indicateurs H1/H2 directement après validation
 * algorithmique, sans avoir à passer à Level 2.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAnalysisPairs } from './useAnalysisPairs';
import {
  Level2PreviewService,
  Level2PreviewResult,
  H1PreviewData,
  H2PreviewData,
  ThresholdMode,
  ValidationMetrics,
  AnalysisPairForPreview,
} from '../services/Level2PreviewService';

// ============================================================================
// TYPES
// ============================================================================

export interface UseLevel2PreviewOptions {
  /** Mode de seuils par défaut */
  defaultThresholdMode?: ThresholdMode;
  /** Activer le calcul automatique au chargement */
  autoCalculate?: boolean;
}

export interface UseLevel2PreviewReturn {
  // État
  preview: Level2PreviewResult | null;
  isCalculating: boolean;
  error: string | null;
  thresholdMode: ThresholdMode;

  // Actions
  calculatePreview: (xMetrics?: ValidationMetrics, yMetrics?: ValidationMetrics) => Promise<void>;
  setThresholdMode: (mode: ThresholdMode) => void;
  refreshPreview: () => Promise<void>;

  // Données dérivées (raccourcis)
  h1Preview: H1PreviewData | null;
  h2Preview: H2PreviewData | null;
  isReady: boolean;
  overallScore: number;

  // Métriques de couverture
  coverage: {
    withX: number;
    withY: number;
    withM1: number;
    withM2: number;
    withM3: number;
    total: number;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export const useLevel2Preview = (
  options: UseLevel2PreviewOptions = {}
): UseLevel2PreviewReturn => {
  const {
    defaultThresholdMode = 'REALISTIC',
    autoCalculate = false,
  } = options;

  // État local
  const [preview, setPreview] = useState<Level2PreviewResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thresholdMode, setThresholdModeState] = useState<ThresholdMode>(defaultThresholdMode);

  // Données analysis_pairs
  const { analysisPairs, loading: pairsLoading } = useAnalysisPairs();

  // Service (recréé si le mode change)
  const service = useMemo(
    () => new Level2PreviewService(thresholdMode),
    [thresholdMode]
  );

  // Convertir analysisPairs pour le service
  const pairsForPreview: AnalysisPairForPreview[] = useMemo(() => {
    return analysisPairs.map(p => ({
      pair_id: p.pair_id,
      strategy_tag: p.strategy_tag,
      reaction_tag: p.reaction_tag,
      strategy_family: p.strategy_family,
      x_predicted_tag: p.x_predicted_tag,
      y_predicted_tag: p.y_predicted_tag,
      m1_verb_density: p.m1_verb_density,
      m2_global_alignment: p.m2_global_alignment,
      m3_cognitive_score: p.m3_cognitive_score,
    }));
  }, [analysisPairs]);

  // Calcul des métriques de couverture
  const coverage = useMemo(() => {
    const total = pairsForPreview.length;
    return {
      total,
      withX: pairsForPreview.filter(p => p.x_predicted_tag).length,
      withY: pairsForPreview.filter(p => p.y_predicted_tag).length,
      withM1: pairsForPreview.filter(p => p.m1_verb_density !== null && p.m1_verb_density !== undefined).length,
      withM2: pairsForPreview.filter(p => p.m2_global_alignment !== null && p.m2_global_alignment !== undefined).length,
      withM3: pairsForPreview.filter(p => p.m3_cognitive_score !== null && p.m3_cognitive_score !== undefined).length,
    };
  }, [pairsForPreview]);

  // Action principale : calculer la prévisualisation
  const calculatePreview = useCallback(
    async (xMetrics?: ValidationMetrics, yMetrics?: ValidationMetrics) => {
      if (pairsLoading) {
        setError('Chargement des données en cours...');
        return;
      }

      if (pairsForPreview.length === 0) {
        setError('Aucune paire d\'analyse disponible');
        return;
      }

      setIsCalculating(true);
      setError(null);

      try {
        console.log(`📊 Calcul preview Level 2 (mode=${thresholdMode}, ${pairsForPreview.length} paires)`);

        const result = service.calculatePreview(pairsForPreview, xMetrics, yMetrics);

        setPreview(result);

        console.log(`✅ Preview calculé:`, {
          h1Score: result.h1Preview.h1ReadinessScore,
          h2Score: result.h2Preview.h2ReadinessScore,
          overall: result.overallScore,
          level: result.overallReadiness,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de calcul';
        setError(message);
        console.error('❌ Erreur calcul preview:', err);
      } finally {
        setIsCalculating(false);
      }
    },
    [pairsForPreview, pairsLoading, service, thresholdMode]
  );

  // Changer le mode de seuils
  const setThresholdMode = useCallback((mode: ThresholdMode) => {
    setThresholdModeState(mode);
    // Reset le preview pour forcer un recalcul
    setPreview(null);
  }, []);

  // Rafraîchir (recalculer avec les mêmes paramètres)
  const refreshPreview = useCallback(async () => {
    await calculatePreview();
  }, [calculatePreview]);

  // Raccourcis pour les données
  const h1Preview = preview?.h1Preview ?? null;
  const h2Preview = preview?.h2Preview ?? null;
  const isReady = preview?.overallReadiness === 'READY';
  const overallScore = preview?.overallScore ?? 0;

  return {
    // État
    preview,
    isCalculating,
    error,
    thresholdMode,

    // Actions
    calculatePreview,
    setThresholdMode,
    refreshPreview,

    // Données dérivées
    h1Preview,
    h2Preview,
    isReady,
    overallScore,

    // Couverture
    coverage,
  };
};

// ============================================================================
// HOOK SIMPLIFIÉ POUR AFFICHAGE RAPIDE
// ============================================================================

/**
 * Hook simplifié qui calcule automatiquement la preview après validation
 */
export const useLevel2QuickPreview = (
  xMetrics?: ValidationMetrics,
  yMetrics?: ValidationMetrics,
  thresholdMode: ThresholdMode = 'REALISTIC'
) => {
  const {
    preview,
    isCalculating,
    calculatePreview,
    h1Preview,
    h2Preview,
    coverage,
  } = useLevel2Preview({ defaultThresholdMode: thresholdMode });

  // Calculer automatiquement quand les métriques changent
  const triggerCalculation = useCallback(() => {
    calculatePreview(xMetrics, yMetrics);
  }, [calculatePreview, xMetrics, yMetrics]);

  return {
    preview,
    isCalculating,
    triggerCalculation,
    h1Preview,
    h2Preview,
    coverage,

    // Indicateurs rapides
    h1Ready: h1Preview?.h1ReadinessLevel === 'READY',
    h2Ready: h2Preview?.h2ReadinessLevel === 'READY',
    h1Score: h1Preview?.h1ReadinessScore ?? 0,
    h2Score: h2Preview?.h2ReadinessScore ?? 0,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  Level2PreviewResult,
  H1PreviewData,
  H2PreviewData,
  ThresholdMode,
  ValidationMetrics,
} from '../services/Level2PreviewService';
