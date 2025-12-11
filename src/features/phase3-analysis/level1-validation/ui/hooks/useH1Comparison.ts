// src/features/phase3-analysis/level1-validation/ui/hooks/useH1Comparison.ts
/**
 * Hook pour comparer la validation H1 entre Gold Standard, Baseline et Test actuel
 * 
 * Utilisé par H1ContributionSection pour afficher la Section B
 */

import { useState, useCallback, useMemo } from 'react';
import { useAnalysisPairs } from './useAnalysisPairs';
import { useTestRuns } from './useTestRuns';
import { H1StatisticsService } from '@/features/phase3-analysis/level2-hypotheses/statistics/domain/services/H1StatisticsService';

import type { TargetKind } from '@/types/algorithm-lab/ui/components';
import type {
  H1ComparisonData,
  H1ComparisonRow,
  H1Interpretation,
  CriteriaValidationSummary,
  MetricEvolution,
  EvolutionDirection,
} from '@/types/algorithm-lab/ui/results';

// ============================================================================
// TYPES
// ============================================================================

interface StrategyReactionCounts {
  ENGAGEMENT: { positive: number; neutral: number; negative: number; total: number };
  OUVERTURE: { positive: number; neutral: number; negative: number; total: number };
  REFLET: { positive: number; neutral: number; negative: number; total: number };
  EXPLICATION: { positive: number; neutral: number; negative: number; total: number };
}

interface H1Metrics {
  actionsPositive: number;      // % Actions → Positif
  actionsNegative: number;      // % Actions → Négatif
  explanationsPositive: number; // % Explications → Positif
  explanationsNegative: number; // % Explications → Négatif
  empiricalGap: number;         // Écart empirique (pts)
  chiSquare: number;
  pValue: number;
  cramersV: number;
  counts: StrategyReactionCounts;
}

export interface UseH1ComparisonOptions {
  targetKind: TargetKind;
  runId?: string;
}

export interface UseH1ComparisonReturn {
  comparisonData: H1ComparisonData | null;
  loading: boolean;
  error: string | null;
  calculate: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// THRESHOLDS (H1 criteria)
// ============================================================================

const H1_THRESHOLDS = {
  actionsPositive: { value: 30, direction: 'gte' as const },      // Actions → Positif ≥ 30%
  actionsNegative: { value: 35, direction: 'lte' as const },      // Actions → Négatif ≤ 35%
  explanationsPositive: { value: 15, direction: 'lte' as const }, // Explications → Positif ≤ 15%
  explanationsNegative: { value: 50, direction: 'gte' as const }, // Explications → Négatif ≥ 50%
  empiricalGap: { value: 15, direction: 'gte' as const },         // Écart ≥ 15 pts
  pValue: { value: 0.05, direction: 'lte' as const },             // p < 0.05
};

// ============================================================================
// HELPERS
// ============================================================================

const getEvolution = (
  current: number,
  baseline: number | null,
  higherIsBetter: boolean
): MetricEvolution | null => {
  if (baseline === null) return null;
  
  const delta = current - baseline;
  const threshold = 0.5; // 0.5% de tolérance
  
  let direction: EvolutionDirection = 'stable';
  if (Math.abs(delta) > threshold) {
    direction = delta > 0 ? 'up' : 'down';
  }
  
  const isPositive = higherIsBetter ? delta >= 0 : delta <= 0;
  
  return { delta, direction, isPositive };
};

const isCriteriaMet = (
  value: number,
  threshold: { value: number; direction: 'gte' | 'lte' }
): boolean => {
  if (threshold.direction === 'gte') return value >= threshold.value;
  return value <= threshold.value;
};

const countValidatedCriteria = (metrics: H1Metrics): number => {
  let count = 0;
  if (isCriteriaMet(metrics.actionsPositive, H1_THRESHOLDS.actionsPositive)) count++;
  if (isCriteriaMet(metrics.actionsNegative, H1_THRESHOLDS.actionsNegative)) count++;
  if (isCriteriaMet(metrics.explanationsPositive, H1_THRESHOLDS.explanationsPositive)) count++;
  if (isCriteriaMet(metrics.explanationsNegative, H1_THRESHOLDS.explanationsNegative)) count++;
  if (isCriteriaMet(metrics.empiricalGap, H1_THRESHOLDS.empiricalGap)) count++;
  if (isCriteriaMet(metrics.pValue, H1_THRESHOLDS.pValue)) count++;
  return count;
};

// ============================================================================
// HOOK
// ============================================================================

export const useH1Comparison = (
  options: UseH1ComparisonOptions
): UseH1ComparisonReturn => {
  const { targetKind, runId } = options;

  // State
  const [comparisonData, setComparisonData] = useState<H1ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { analysisPairs } = useAnalysisPairs();
  const { getBaselineForTarget } = useTestRuns();

  /**
   * Calcule les métriques H1 à partir des paires
   */
  const calculateH1Metrics = useCallback((
    pairs: Array<{
      strategy_family?: string;
      strategy_tag?: string;
      reaction_tag?: string;
      x_predicted_tag?: string;
      y_predicted_tag?: string;
    }>,
    useGold: boolean = true
  ): H1Metrics | null => {
    if (!pairs.length) return null;

    // Initialiser les compteurs
    const counts: StrategyReactionCounts = {
      ENGAGEMENT: { positive: 0, neutral: 0, negative: 0, total: 0 },
      OUVERTURE: { positive: 0, neutral: 0, negative: 0, total: 0 },
      REFLET: { positive: 0, neutral: 0, negative: 0, total: 0 },
      EXPLICATION: { positive: 0, neutral: 0, negative: 0, total: 0 },
    };

    // Compter les occurrences
    pairs.forEach(pair => {
      const strategy = useGold 
        ? pair.strategy_family || pair.strategy_tag
        : pair.x_predicted_tag;
      const reaction = useGold
        ? pair.reaction_tag
        : pair.y_predicted_tag;

      if (!strategy || !reaction) return;

      // Mapper la stratégie à une famille
      let family: keyof StrategyReactionCounts;
      if (strategy.includes('ENGAGEMENT')) family = 'ENGAGEMENT';
      else if (strategy.includes('OUVERTURE')) family = 'OUVERTURE';
      else if (strategy.includes('REFLET')) family = 'REFLET';
      else if (strategy.includes('EXPLICATION')) family = 'EXPLICATION';
      else return;

      // Mapper la réaction
      let reactionType: 'positive' | 'neutral' | 'negative';
      if (reaction.includes('POSITIF') || reaction === 'CLIENT_POSITIF') {
        reactionType = 'positive';
      } else if (reaction.includes('NEUTRE') || reaction === 'CLIENT_NEUTRE') {
        reactionType = 'neutral';
      } else if (reaction.includes('NEGATIF') || reaction === 'CLIENT_NEGATIF') {
        reactionType = 'negative';
      } else return;

      counts[family][reactionType]++;
      counts[family].total++;
    });

    // Calculer les pourcentages
    const actionsTotal = counts.ENGAGEMENT.total + counts.OUVERTURE.total;
    const actionsPositive = actionsTotal > 0
      ? ((counts.ENGAGEMENT.positive + counts.OUVERTURE.positive) / actionsTotal) * 100
      : 0;
    const actionsNegative = actionsTotal > 0
      ? ((counts.ENGAGEMENT.negative + counts.OUVERTURE.negative) / actionsTotal) * 100
      : 0;

    const explanationsTotal = counts.EXPLICATION.total;
    const explanationsPositive = explanationsTotal > 0
      ? (counts.EXPLICATION.positive / explanationsTotal) * 100
      : 0;
    const explanationsNegative = explanationsTotal > 0
      ? (counts.EXPLICATION.negative / explanationsTotal) * 100
      : 0;

    // Écart empirique : (Actions→Positif) - (Explications→Positif)
    const empiricalGap = actionsPositive - explanationsPositive;

    // Chi² et Cramér's V
    const observed = [
      [counts.ENGAGEMENT.positive + counts.OUVERTURE.positive, 
       counts.ENGAGEMENT.neutral + counts.OUVERTURE.neutral,
       counts.ENGAGEMENT.negative + counts.OUVERTURE.negative],
      [counts.EXPLICATION.positive, counts.EXPLICATION.neutral, counts.EXPLICATION.negative],
    ];

    const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = [0, 1, 2].map(col => observed.reduce((sum, row) => sum + row[col], 0));
    const total = rowTotals.reduce((a, b) => a + b, 0);

    const expected = observed.map((row, i) =>
      row.map((_, j) => (rowTotals[i] * colTotals[j]) / total)
    );

    const { chiSquare, pValue } = H1StatisticsService.calculateChiSquare(observed, expected);
    const cramersV = H1StatisticsService.calculateCramersV(chiSquare, total, 2, 3);

    return {
      actionsPositive,
      actionsNegative,
      explanationsPositive,
      explanationsNegative,
      empiricalGap,
      chiSquare,
      pValue,
      cramersV,
      counts,
    };
  }, []);

  /**
   * Calcule la comparaison complète
   */
  const calculate = useCallback(async () => {
    if (targetKind !== 'X' && targetKind !== 'Y') {
      setError('H1 comparison is only available for X and Y targets');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Métriques Gold Standard
      const goldMetrics = calculateH1Metrics(analysisPairs, true);
      if (!goldMetrics) {
        throw new Error('Unable to calculate Gold Standard metrics');
      }

      // 2. Métriques du test actuel (prédictions)
      const testMetrics = calculateH1Metrics(analysisPairs, false);

      // 3. Métriques Baseline (si disponible)
     let baselineMetrics = null as H1Metrics | null;
      try {
        const baseline = await getBaselineForTarget(targetKind);
        if (baseline?.level1_metrics) {
          // Reconstruire les métriques depuis la baseline
          // Pour l'instant, on utilise null - à améliorer avec les vraies données
          baselineMetrics = null;
        }
      } catch {
        // Pas de baseline, ce n'est pas une erreur
      }

      // 4. Construire les lignes de comparaison
      const rows: H1ComparisonRow[] = [
        {
          criterion: 'Actions → Positif',
          criterionKey: 'actionsPositive',
          goldStandard: goldMetrics.actionsPositive,
          baseline: baselineMetrics?.actionsPositive ?? null,
          currentTest: testMetrics?.actionsPositive ?? 0,
          evolution: testMetrics 
            ? getEvolution(testMetrics.actionsPositive, baselineMetrics?.actionsPositive ?? null, true)
            : null,
          threshold: H1_THRESHOLDS.actionsPositive.value,
          unit: '%',
        },
        {
          criterion: 'Actions → Négatif',
          criterionKey: 'actionsNegative',
          goldStandard: goldMetrics.actionsNegative,
          baseline: baselineMetrics?.actionsNegative ?? null,
          currentTest: testMetrics?.actionsNegative ?? 0,
          evolution: testMetrics
            ? getEvolution(testMetrics.actionsNegative, baselineMetrics?.actionsNegative ?? null, false)
            : null,
          threshold: H1_THRESHOLDS.actionsNegative.value,
          unit: '%',
        },
        {
          criterion: 'Explications → Positif',
          criterionKey: 'explanationsPositive',
          goldStandard: goldMetrics.explanationsPositive,
          baseline: baselineMetrics?.explanationsPositive ?? null,
          currentTest: testMetrics?.explanationsPositive ?? 0,
          evolution: testMetrics
            ? getEvolution(testMetrics.explanationsPositive, baselineMetrics?.explanationsPositive ?? null, false)
            : null,
          threshold: H1_THRESHOLDS.explanationsPositive.value,
          unit: '%',
        },
        {
          criterion: 'Explications → Négatif',
          criterionKey: 'explanationsNegative',
          goldStandard: goldMetrics.explanationsNegative,
          baseline: baselineMetrics?.explanationsNegative ?? null,
          currentTest: testMetrics?.explanationsNegative ?? 0,
          evolution: testMetrics
            ? getEvolution(testMetrics.explanationsNegative, baselineMetrics?.explanationsNegative ?? null, true)
            : null,
          threshold: H1_THRESHOLDS.explanationsNegative.value,
          unit: '%',
        },
        {
          criterion: 'Écart empirique',
          criterionKey: 'empiricalGap',
          goldStandard: goldMetrics.empiricalGap,
          baseline: baselineMetrics?.empiricalGap ?? null,
          currentTest: testMetrics?.empiricalGap ?? 0,
          evolution: testMetrics
            ? getEvolution(testMetrics.empiricalGap, baselineMetrics?.empiricalGap ?? null, true)
            : null,
          threshold: H1_THRESHOLDS.empiricalGap.value,
          unit: 'pts',
        },
        {
          criterion: 'Significativité (p-value)',
          criterionKey: 'pValue',
          goldStandard: goldMetrics.pValue,
          baseline: baselineMetrics?.pValue ?? null,
          currentTest: testMetrics?.pValue ?? 1,
          evolution: testMetrics
            ? getEvolution(testMetrics.pValue, baselineMetrics?.pValue ?? null, false)
            : null,
          threshold: H1_THRESHOLDS.pValue.value,
          unit: 'p-value',
        },
      ];

      // 5. Critères validés
      const goldValidated = countValidatedCriteria(goldMetrics);
      const testValidated = testMetrics ? countValidatedCriteria(testMetrics) : 0;
      const baselineValidated = baselineMetrics ? countValidatedCriteria(baselineMetrics) : null;

      const criteriaValidated: CriteriaValidationSummary = {
        goldStandard: goldValidated,
        baseline: baselineValidated,
        currentTest: testValidated,
        total: 6,
      };

      // 6. Interprétation
      let interpretation: H1Interpretation;
      if (testValidated >= 5) {
        interpretation = {
          level: 'success',
          message: `Cet algorithme maintient bien la validation H1 (${testValidated}/6 critères).`,
          recommendation: 'Vous pouvez valider cette version.',
        };
      } else if (testValidated >= 3) {
        interpretation = {
          level: 'warning',
          message: `Cet algorithme valide partiellement H1 (${testValidated}/6 critères).`,
          recommendation: 'Investiguer les erreurs avant de valider.',
        };
      } else {
        interpretation = {
          level: 'error',
          message: `Cet algorithme dégrade la validation H1 (${testValidated}/6 critères).`,
          recommendation: 'Rejeter cette version ou investiguer en profondeur.',
        };
      }

      // 7. Résultat final
      setComparisonData({
        rows,
        criteriaValidated,
        interpretation,
        statisticalTests: {
          chiSquare: testMetrics?.chiSquare ?? goldMetrics.chiSquare,
          pValue: testMetrics?.pValue ?? goldMetrics.pValue,
          cramersV: testMetrics?.cramersV ?? goldMetrics.cramersV,
          isSignificant: (testMetrics?.pValue ?? goldMetrics.pValue) < 0.05,
        },
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [analysisPairs, targetKind, calculateH1Metrics, getBaselineForTarget]);

  const refresh = useCallback(async () => {
    await calculate();
  }, [calculate]);

  return {
    comparisonData,
    loading,
    error,
    calculate,
    refresh,
  };
};

export default useH1Comparison;
