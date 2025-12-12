// src/features/phase3-analysis/level1-validation/ui/hooks/useH2Mediation.ts
/**
 * Hook pour calculer et comparer les métriques de médiation H2
 * 
 * Utilisé par H2ContributionSection pour afficher la Section C
 */

import { useState, useCallback } from 'react';
import { useAnalysisPairs } from './useAnalysisPairs';
import { H2MediationService } from '@/features/phase3-analysis/level2-hypotheses/h2-mediation/statistics/domain/services/H2MediationService';

import type { TargetKind } from '@/types/algorithm-lab/ui/components';
import type {
  H2MediationData,
  MediatorResult,
  MediationVerdict,
  MediationPaths,
  H2VersionComparison,
  MByReactionStats,
  AnovaResult,
  MediatorCorrelation,
  ControlledMediationResult,
} from '@/types/algorithm-lab/ui/results';

// ============================================================================
// TYPES
// ============================================================================

export interface UseH2MediationOptions {
  targetKind: TargetKind;
  runId?: string;
}

export interface UseH2MediationReturn {
  mediationData: H2MediationData | null;
  loading: boolean;
  error: string | null;
  calculate: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface MediatorInput {
  mediator: 'M1' | 'M2' | 'M3';
  label: string;
  getValue: (pair: AnalysisPairData) => number | null;
}

interface AnalysisPairData {
  strategy_family?: string;
  reaction_tag?: string;
  m1_verb_density?: number | null;
  m2_global_alignment?: number | null;
  m3_cognitive_score?: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MEDIATORS: MediatorInput[] = [
  { 
    mediator: 'M1', 
    label: 'Densité verbes d\'action',
    getValue: (p) => p.m1_verb_density ?? null 
  },
  { 
    mediator: 'M2', 
    label: 'Alignement linguistique',
    getValue: (p) => p.m2_global_alignment ?? null 
  },
  { 
    mediator: 'M3', 
    label: 'Charge cognitive',
    getValue: (p) => p.m3_cognitive_score ?? null 
  },
];

// Seuils Cohen/Kenny pour la médiation
const MEDIATION_THRESHOLDS = {
  substantial: { effect: 0.25, pValue: 0.01 },
  partial: { effect: 0.09, pValue: 0.05 },
  weak: { effect: 0.01, pValue: 0.10 },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Encode la stratégie en valeur numérique pour la régression
 * Actions (ENGAGEMENT, OUVERTURE) = 1, Explications = 0
 */
const encodeStrategy = (strategy?: string): number | null => {
  if (!strategy) return null;
  // Actions (verbes d'action) = 1, Non-Actions = 0
  if (strategy.includes('ENGAGEMENT') || strategy.includes('OUVERTURE')) return 1;
  if (strategy.includes('EXPLICATION') || strategy.includes('REFLET')) return 0;
  return null;
};

/**
 * Encode la réaction en valeur numérique
 * Positif = 1, Neutre = 0.5, Négatif = 0
 */
const encodeReaction = (reaction?: string): number | null => {
  if (!reaction) return null;
  if (reaction.includes('POSITIF')) return 1;
  if (reaction.includes('NEUTRE')) return 0.5;
  if (reaction.includes('NEGATIF')) return 0;
  return null;
};

/**
 * Détermine le verdict de médiation basé sur les seuils
 */
const getMediationVerdict = (
  indirectEffect: number,
  sobelP: number
): MediationVerdict => {
  const absEffect = Math.abs(indirectEffect);
  
  if (absEffect >= MEDIATION_THRESHOLDS.substantial.effect && 
      sobelP < MEDIATION_THRESHOLDS.substantial.pValue) {
    return 'substantial';
  }
  if (absEffect >= MEDIATION_THRESHOLDS.partial.effect && 
      sobelP < MEDIATION_THRESHOLDS.partial.pValue) {
    return 'partial';
  }
  if (absEffect >= MEDIATION_THRESHOLDS.weak.effect && 
      sobelP < MEDIATION_THRESHOLDS.weak.pValue) {
    return 'weak';
  }
  return 'none';
};

// ============================================================================
// HOOK
// ============================================================================

export const useH2Mediation = (
  options: UseH2MediationOptions
): UseH2MediationReturn => {
  const { targetKind, runId } = options;

  // State
  const [mediationData, setMediationData] = useState<H2MediationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { analysisPairs } = useAnalysisPairs();

  /**
   * Calcule la médiation pour un médiateur spécifique
   */
  const calculateMediatorResult = useCallback((
    mediatorInput: MediatorInput,
    xValues: number[],
    yValues: number[],
    mValues: number[]
  ): MediatorResult | null => {
    if (xValues.length < 10) return null; // Besoin d'assez de données

    // Régression X → M (path a)
    const regXM = simpleRegression(xValues, mValues);
    const a = regXM.slope;
    const seA = regXM.se;

    // Régression M → Y contrôlée pour X (path b)
    const regMY = multipleRegression(xValues, mValues, yValues);
    const b = regMY.b2;
    const seB = regMY.se2;

    // Régression X → Y (effet total c)
    const regXY = simpleRegression(xValues, yValues);
    const c = regXY.slope;

    // Effet direct c' (X → Y contrôlé pour M)
    const cPrime = regMY.b1;

    // Effet indirect
    const indirectEffect = a * b;

    // Test de Sobel
    const sobelZ = indirectEffect / Math.sqrt(b * b * seA * seA + a * a * seB * seB);
    const sobelP = 2 * (1 - normalCDF(Math.abs(sobelZ)));

    // Pourcentage de médiation
    const percentMediation = c !== 0 ? (indirectEffect / c) * 100 : 0;

    // Verdict
    const verdict = getMediationVerdict(indirectEffect, sobelP);

    // Qualité des données
    const total = analysisPairs.length;
    const available = xValues.length;

    return {
      mediator: mediatorInput.mediator,
      label: mediatorInput.label,
      paths: { a, b, c, cPrime },
      indirectEffect,
      sobelZ,
      sobelP,
      percentMediation,
      verdict,
       isSignificant: verdict === 'substantial' || verdict === 'partial',
      dataQuality: {
        available,
        total,
        percentage: (available / total) * 100,
      },
    };
  }, [analysisPairs.length]);

  /**
   * Calcule la médiation complète
   */
  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Préparer les données
     const validPairs: Array<{
        x: number;
        y: number;
        m1: number | null;
        m2: number | null;
        m3: number | null;
        reaction: string; // Pour le calcul M par réaction
        strategy: string; // Pour l'analyse intra-stratégie
      }> = [];

      analysisPairs.forEach(pair => {
        const x = encodeStrategy(pair.strategy_family || pair.strategy_tag);
        const y = encodeReaction(pair.reaction_tag);
        
          if (x !== null && y !== null) {
           validPairs.push({
            x,
            y,
            m1: pair.m1_verb_density ?? null,
            m2: pair.m2_global_alignment ?? null,
            m3: pair.m3_cognitive_score ?? null,
            reaction: pair.reaction_tag || '',
            strategy: pair.strategy_family || pair.strategy_tag || '',
          });
        }
      });

      if (validPairs.length < 30) {
        throw new Error(`Pas assez de données pour l'analyse de médiation (${validPairs.length}/30 minimum)`);
      }

      // Calculer pour chaque médiateur
      const mediatorResults: MediatorResult[] = [];

      for (const mediatorInput of MEDIATORS) {
        // Filtrer les paires avec ce médiateur disponible
        const pairsWithM = validPairs.filter(p => {
          const mValue = mediatorInput.mediator === 'M1' ? p.m1 :
                        mediatorInput.mediator === 'M2' ? p.m2 : p.m3;
          return mValue !== null;
        });

        if (pairsWithM.length < 10) {
          // Pas assez de données pour ce médiateur
         mediatorResults.push({
            mediator: mediatorInput.mediator,
            label: mediatorInput.label,
            paths: { a: 0, b: 0, c: 0, cPrime: 0 },
            indirectEffect: 0,
            sobelZ: 0,
            sobelP: 1,
            percentMediation: 0,
            verdict: 'none',
            isSignificant: false,
            dataQuality: {
              available: pairsWithM.length,
              total: validPairs.length,
              percentage: (pairsWithM.length / validPairs.length) * 100,
            },
          });
          continue;
        }

        const xValues = pairsWithM.map(p => p.x);
        const yValues = pairsWithM.map(p => p.y);
        const mValues = pairsWithM.map(p => {
          const mValue = mediatorInput.mediator === 'M1' ? p.m1 :
                        mediatorInput.mediator === 'M2' ? p.m2 : p.m3;
          return mValue!;
        });

        const result = calculateMediatorResult(mediatorInput, xValues, yValues, mValues);
        if (result) {
          mediatorResults.push(result);
        }
      }

      // Compter les médiations significatives
      const significantCount = mediatorResults.filter(
        m => m.verdict === 'substantial' || m.verdict === 'partial'
      ).length;

      // Interprétation globale
      let overallInterpretation: H2MediationData['overallInterpretation'];
      
      if (significantCount >= 2) {
        overallInterpretation = {
          level: 'success',
          message: `${significantCount}/3 médiateurs montrent une médiation significative. L'hypothèse H2 est bien supportée.`,
          recommendations: [
            'Les calculs actuels capturent bien les mécanismes de médiation.',
            'Vous pouvez procéder à la validation de cette version.',
          ],
        };
      } else if (significantCount === 1) {
        overallInterpretation = {
          level: 'warning',
          message: `Seul 1/3 médiateur montre une médiation significative. Support partiel pour H2.`,
          recommendations: [
            'Investiguer pourquoi les autres médiateurs ne montrent pas de médiation.',
            'Vérifier la qualité des calculs M1, M2, M3.',
          ],
        };
      } else {
        overallInterpretation = {
          level: 'error',
          message: `Aucune médiation significative détectée. H2 n'est pas supportée.`,
          recommendations: [
            'Revoir les algorithmes de calcul des médiateurs.',
            'Vérifier que les données d\'entrée sont correctes.',
            'Considérer d\'autres mécanismes de médiation.',
          ],
        };
      }

      // Comparaisons (pour l'instant vide, à implémenter avec les versions)
    // Comparaisons (pour l'instant vide, à implémenter avec les versions)
      const comparisons: H2VersionComparison[] = mediatorResults.map(m => ({
        mediator: m.mediator,
        gold: null,
        baseline: null,
        lastTest: null,
        currentTest: m,
        vsBaseline: null,
      }));

      // ========== NOUVEAUX CALCULS SELON LE TARGET ==========
      
      // M par réaction (pour M1 uniquement)
      let mByReaction: H2MediationData['mByReaction'] | undefined;
      // Corrélations bivariées (pour M1 uniquement)
      // Corrélations bivariées (pour M1 uniquement)
      let bivariateCorrelations: H2MediationData['bivariateCorrelations'] | undefined;
      let intraStrategyVariance: H2MediationData['intraStrategyVariance'] | undefined;
      let binaryMediationTest: H2MediationData['binaryMediationTest'] | undefined;

      if (targetKind === 'M1') {
        const pairsWithM1 = validPairs
          .filter(p => p.m1 !== null)
          .map(p => ({ m: p.m1!, reaction: p.reaction }));
        if (pairsWithM1.length > 0) {
          mByReaction = calculateMByReaction(pairsWithM1);
        }
        
        // Calculer les corrélations bivariées X↔M1, M1↔Y, X↔Y
        const pairsForCorr = validPairs.filter(p => p.m1 !== null);
        if (pairsForCorr.length >= 10) {
          const xVals = pairsForCorr.map(p => p.x);
          const yVals = pairsForCorr.map(p => p.y);
          const m1Vals = pairsForCorr.map(p => p.m1!);
          
          bivariateCorrelations = {
              xToM1: calculatePearsonCorrelation(xVals, m1Vals),
              m1ToY: calculatePearsonCorrelation(m1Vals, yVals),
              xToY: calculatePearsonCorrelation(xVals, yVals),
            };
          }
          
          // Calculer variance intra-stratégie
          intraStrategyVariance = calculateIntraStrategyVariance(validPairs);
          
          // Calculer test de médiation binaire (M1 présent vs absent)
          binaryMediationTest = calculateBinaryMediationTest(validPairs);
        }
        // Corrélations M1→M2 et M1→M3 (pour M2 et M3)
      let correlations: MediatorCorrelation[] | undefined;
      if (targetKind === 'M2' || targetKind === 'M3') {
        const pairsWithM1M2M3 = validPairs.filter(p => 
          p.m1 !== null && p.m2 !== null && p.m3 !== null
        );
        
        if (pairsWithM1M2M3.length >= 10) {
          const m1Values = pairsWithM1M2M3.map(p => p.m1!);
          const m2Values = pairsWithM1M2M3.map(p => p.m2!);
          const m3Values = pairsWithM1M2M3.map(p => p.m3!);

          if (targetKind === 'M2') {
            const corr = calculatePearsonCorrelation(m1Values, m2Values);
            correlations = [{
              from: 'M1',
              to: 'M2',
              pearsonR: corr.r,
              pValue: corr.pValue,
              isSignificant: corr.isSignificant,
              interpretation: corr.r > 0 
                ? 'Corrélation positive : plus de verbes d\'action → plus d\'alignement'
                : 'Corrélation négative ou nulle',
            }];
          } else {
            const corr = calculatePearsonCorrelation(m1Values, m3Values);
            correlations = [{
              from: 'M1',
              to: 'M3',
              pearsonR: corr.r,
              pValue: corr.pValue,
              isSignificant: corr.isSignificant,
              interpretation: corr.r < 0 
                ? 'Corrélation négative : plus de verbes d\'action → moins de charge cognitive'
                : 'Corrélation positive ou nulle (inattendu)',
            }];
          }
        }
      }

      // Médiation contrôlée (pour M2 et M3)
      let controlledMediation: ControlledMediationResult | undefined;
      if (targetKind === 'M2' || targetKind === 'M3') {
        const pairsWithAll = validPairs.filter(p => 
          p.m1 !== null && p.m2 !== null && p.m3 !== null
        );
        
        if (pairsWithAll.length >= 30) {
          const xVals = pairsWithAll.map(p => p.x);
          const yVals = pairsWithAll.map(p => p.y);
          const m1Vals = pairsWithAll.map(p => p.m1!);
          
          if (targetKind === 'M2') {
            const m2Vals = pairsWithAll.map(p => p.m2!);
            controlledMediation = calculateControlledMediation(xVals, yVals, m2Vals, m1Vals, 'M2');
          } else {
            const m3Vals = pairsWithAll.map(p => p.m3!);
            controlledMediation = calculateControlledMediation(xVals, yVals, m3Vals, m1Vals, 'M3');
          }
        }
      }

      setMediationData({
        mediators: mediatorResults,
        comparisons,
        overallInterpretation,
        // Nouveaux champs
        mByReaction,
        bivariateCorrelations,
        intraStrategyVariance,
        binaryMediationTest,
        correlations,
        controlledMediation,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [analysisPairs, calculateMediatorResult]);

  const refresh = useCallback(async () => {
    await calculate();
  }, [calculate]);

  return {
    mediationData,
    loading,
    error,
    calculate,
    refresh,
  };
};

// ============================================================================
// STATISTICAL HELPERS (inline pour éviter les dépendances circulaires)
// ============================================================================

function simpleRegression(x: number[], y: number[]): { slope: number; intercept: number; se: number } {
  const n = x.length;
  if (n === 0) return { slope: 0, intercept: 0, se: 0 };
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  const sxx = sumX2 - n * meanX * meanX;
  if (sxx === 0) return { slope: 0, intercept: meanY, se: 0 };
  
  const slope = (sumXY - n * meanX * meanY) / sxx;
  const intercept = meanY - slope * meanX;
  
  // Erreur standard
  const predictions = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - predictions[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const mse = n > 2 ? sse / (n - 2) : 0;
  const se = sxx > 0 ? Math.sqrt(mse / sxx) : 0;
  
  return { slope, intercept, se };
}

function multipleRegression(
  x: number[],
  m: number[],
  y: number[]
): { b1: number; b2: number; se1: number; se2: number } {
  const n = x.length;
  if (n === 0) return { b1: 0, b2: 0, se1: 0, se2: 0 };
  
  // Calcul simplifié via corrélations partielles
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanM = m.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  // Centrer les variables
  const xc = x.map(xi => xi - meanX);
  const mc = m.map(mi => mi - meanM);
  const yc = y.map(yi => yi - meanY);
  
  // Covariances
  const covXY = xc.reduce((sum, xi, i) => sum + xi * yc[i], 0) / n;
  const covXM = xc.reduce((sum, xi, i) => sum + xi * mc[i], 0) / n;
  const covMY = mc.reduce((sum, mi, i) => sum + mi * yc[i], 0) / n;
  const varX = xc.reduce((sum, xi) => sum + xi * xi, 0) / n;
  const varM = mc.reduce((sum, mi) => sum + mi * mi, 0) / n;
  
  // Coefficients via formules matricielles simplifiées
  const denom = varX * varM - covXM * covXM;
  if (Math.abs(denom) < 1e-10) return { b1: 0, b2: 0, se1: 0, se2: 0 };
  
  const b1 = (covXY * varM - covMY * covXM) / denom;
  const b2 = (covMY * varX - covXY * covXM) / denom;
  
  // Erreurs standards (approximation)
  const predictions = x.map((xi, i) => b1 * (xi - meanX) + b2 * (m[i] - meanM) + meanY);
  const residuals = y.map((yi, i) => yi - predictions[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const mse = n > 3 ? sse / (n - 3) : 0;
  
  const se1 = Math.sqrt(mse * varM / denom);
  const se2 = Math.sqrt(mse * varX / denom);
  
  return { b1, b2, se1, se2 };
}

function normalCDF(z: number): number {
  // Approximation de la CDF normale standard
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1.0 + sign * y);
}

// ============================================================================
// NEW STATISTICAL HELPERS - M BY REACTION, CORRELATIONS, CONTROLLED MEDIATION
// ============================================================================

/**
 * Calcule les statistiques M par réaction (pour tableau ANOVA)
 */
function calculateMByReaction(
  pairs: Array<{ m: number; reaction: string }>,
): { data: MByReactionStats[]; anova: AnovaResult } {
  const reactions = ['POSITIF', 'NEUTRE', 'NEGATIF'] as const;
  const groups: Record<string, number[]> = {
    POSITIF: [],
    NEUTRE: [],
    NEGATIF: [],
  };

  // Grouper les valeurs par réaction
  pairs.forEach(p => {
    if (p.reaction.includes('POSITIF')) groups.POSITIF.push(p.m);
    else if (p.reaction.includes('NEUTRE')) groups.NEUTRE.push(p.m);
    else if (p.reaction.includes('NEGATIF')) groups.NEGATIF.push(p.m);
  });

  // Calculer les stats pour chaque groupe
  const data: MByReactionStats[] = reactions.map(reaction => {
    const values = groups[reaction];
    if (values.length === 0) {
      return { reaction, mean: 0, stdDev: 0, count: 0 };
    }
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const sorted = [...values].sort((a, b) => a - b);
    return {
      reaction,
      mean,
      stdDev,
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  });

  // Calcul ANOVA
  const allValues = [...groups.POSITIF, ...groups.NEUTRE, ...groups.NEGATIF];
  const grandMean = allValues.length > 0 
    ? allValues.reduce((a, b) => a + b, 0) / allValues.length 
    : 0;

  // Sum of Squares Between (SSB)
  let ssb = 0;
  reactions.forEach(reaction => {
    const groupMean = data.find(d => d.reaction === reaction)?.mean || 0;
    const groupCount = groups[reaction].length;
    ssb += groupCount * Math.pow(groupMean - grandMean, 2);
  });

  // Sum of Squares Within (SSW)
  let ssw = 0;
  reactions.forEach(reaction => {
    const groupMean = data.find(d => d.reaction === reaction)?.mean || 0;
    groups[reaction].forEach(value => {
      ssw += Math.pow(value - groupMean, 2);
    });
  });

  // Degrés de liberté
  const k = reactions.filter(r => groups[r].length > 0).length; // nombre de groupes non vides
  const n = allValues.length;
  const dfBetween = k - 1;
  const dfWithin = n - k;

  // F-statistic
  const msb = dfBetween > 0 ? ssb / dfBetween : 0;
  const msw = dfWithin > 0 ? ssw / dfWithin : 0;
  const fStatistic = msw > 0 ? msb / msw : 0;

  // Approximation de la p-value (via distribution F simplifiée)
  const pValue = approximateFPValue(fStatistic, dfBetween, dfWithin);

  const anova: AnovaResult = {
    fStatistic,
    pValue,
    isSignificant: pValue < 0.05,
    dfBetween,
    dfWithin,
  };

  return { data, anova };
}

/**
 * Approximation de la p-value pour distribution F
 */
function approximateFPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1;
  // Approximation simple basée sur la transformation en chi-square
  const x = (df1 * f) / (df1 * f + df2);
  // Beta incomplete function approximation
  // Pour une approximation rapide, utilisons une heuristique
  if (f > 10) return 0.001;
  if (f > 5) return 0.01;
  if (f > 3) return 0.05;
  if (f > 2) return 0.1;
  return 0.5;
}

/**
 * Calcule la corrélation de Pearson entre deux séries
 */
function calculatePearsonCorrelation(
  x: number[],
  y: number[]
): { r: number; pValue: number; isSignificant: boolean } {
  const n = x.length;
  if (n < 3) return { r: 0, pValue: 1, isSignificant: false };

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  const r = denom > 0 ? sumXY / denom : 0;

  // Test de significativité (t-test)
  const t = r * Math.sqrt((n - 2) / (1 - r * r + 1e-10));
  const pValue = 2 * (1 - normalCDF(Math.abs(t)));

  return {
    r,
    pValue,
    isSignificant: pValue < 0.05,
  };
}

/**
 * Calcule la médiation contrôlée (M2 ou M3 en contrôlant M1)
 */
function calculateControlledMediation(
  xValues: number[],
  yValues: number[],
  targetMValues: number[], // M2 ou M3
  controlMValues: number[], // M1
  mediatorName: 'M2' | 'M3'
): ControlledMediationResult {
  const n = xValues.length;

  // 1. Médiation brute (sans contrôle)
  const rawRegXM = simpleRegression(xValues, targetMValues);
  const rawRegMY = multipleRegression(xValues, targetMValues, yValues);
  const rawA = rawRegXM.slope;
  const rawB = rawRegMY.b2;
  const rawIndirectEffect = rawA * rawB;
  const rawSeA = rawRegXM.se;
  const rawSeB = rawRegMY.se2;
  const rawSobelZ = rawIndirectEffect / Math.sqrt(rawB * rawB * rawSeA * rawSeA + rawA * rawA * rawSeB * rawSeB + 1e-10);
  const rawSobelP = 2 * (1 - normalCDF(Math.abs(rawSobelZ)));

  // 2. Médiation contrôlée (en résidualisant M1)
  // Régression de targetM sur controlM pour obtenir les résidus
  const regMM = simpleRegression(controlMValues, targetMValues);
  const targetMResiduals = targetMValues.map((m, i) => m - (regMM.slope * controlMValues[i] + regMM.intercept));

  // Médiation avec les résidus
  const ctrlRegXM = simpleRegression(xValues, targetMResiduals);
  const ctrlRegMY = multipleRegression(xValues, targetMResiduals, yValues);
  const ctrlA = ctrlRegXM.slope;
  const ctrlB = ctrlRegMY.b2;
  const ctrlIndirectEffect = ctrlA * ctrlB;
  const ctrlSeA = ctrlRegXM.se;
  const ctrlSeB = ctrlRegMY.se2;
  const ctrlSobelZ = ctrlIndirectEffect / Math.sqrt(ctrlB * ctrlB * ctrlSeA * ctrlSeA + ctrlA * ctrlA * ctrlSeB * ctrlSeB + 1e-10);
  const ctrlSobelP = 2 * (1 - normalCDF(Math.abs(ctrlSobelZ)));

  // Interprétation
  const rawIsSignificant = rawSobelP < 0.05;
  const controlledIsSignificant = ctrlSobelP < 0.05;
  const effectDisappears = rawIsSignificant && !controlledIsSignificant;

  let interpretation: string;
  if (effectDisappears) {
    interpretation = `L'effet de médiation de ${mediatorName} disparaît quand M1 est contrôlé. ${mediatorName} n'est pas un médiateur indépendant.`;
  } else if (!rawIsSignificant) {
    interpretation = `${mediatorName} ne montre pas de médiation significative (brute ou contrôlée).`;
  } else if (controlledIsSignificant) {
    interpretation = `${mediatorName} conserve un effet de médiation même en contrôlant M1. ${mediatorName} pourrait être un médiateur indépendant.`;
  } else {
    interpretation = `Résultats non concluants pour ${mediatorName}.`;
  }

  return {
    mediator: mediatorName,
    rawIndirectEffect,
    rawSobelP,
    rawIsSignificant,
    controlledIndirectEffect: ctrlIndirectEffect,
    controlledSobelP: ctrlSobelP,
    controlledIsSignificant,
    effectDisappears,
    interpretation,
  };
}

/**
 * Calcule la variance de M1 au sein de chaque stratégie
 * et la corrélation M1 → Y intra-stratégie
 */
function calculateIntraStrategyVariance(
  pairs: Array<{ x: number; y: number; m1: number | null; strategy: string }>
): H2MediationData['intraStrategyVariance'] {
  const strategies = ['ENGAGEMENT', 'OUVERTURE', 'REFLET', 'EXPLICATION'];
  
  return strategies.map(strategy => {
    // Filtrer les paires pour cette stratégie avec M1 non null
    const strategyPairs = pairs.filter(p => 
      p.strategy.includes(strategy) && p.m1 !== null
    );
    
    if (strategyPairs.length < 3) {
      return {
        strategy,
        count: strategyPairs.length,
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        coefficientOfVariation: 0,
        m1ToYCorrelation: { r: 0, pValue: 1, isSignificant: false, n: strategyPairs.length },
      };
    }
    
    const m1Values = strategyPairs.map(p => p.m1!);
    const yValues = strategyPairs.map(p => p.y);
    
    // Stats descriptives
    const mean = m1Values.reduce((a, b) => a + b, 0) / m1Values.length;
    const variance = m1Values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / m1Values.length;
    const stdDev = Math.sqrt(variance);
    const sorted = [...m1Values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    
    // Corrélation M1 → Y au sein de cette stratégie
    const corr = calculatePearsonCorrelation(m1Values, yValues);
    
    return {
      strategy,
      count: strategyPairs.length,
      mean,
      stdDev,
      min,
      max,
      coefficientOfVariation,
      m1ToYCorrelation: { ...corr, n: strategyPairs.length },
    };
  }).filter(s => s.count > 0); // Ne garder que les stratégies avec des données
}

/**
 * Calcule le test de médiation binaire (M1 présent vs absent)
 */
function calculateBinaryMediationTest(
  pairs: Array<{ x: number; y: number; m1: number | null }>
): H2MediationData['binaryMediationTest'] {
  const pairsWithM1 = pairs.filter(p => p.m1 !== null);
  
  if (pairsWithM1.length < 30) {
    return undefined;
  }
  
  // Binariser M1 : présent (> 0) vs absent (= 0)
  const withVerbs = pairsWithM1.filter(p => p.m1! > 0);
  const withoutVerbs = pairsWithM1.filter(p => p.m1! === 0);
  
  if (withVerbs.length < 10 || withoutVerbs.length < 10) {
    return undefined;
  }
  
  // Stats descriptives
  const meanYWith = withVerbs.reduce((sum, p) => sum + p.y, 0) / withVerbs.length;
  const meanYWithout = withoutVerbs.reduce((sum, p) => sum + p.y, 0) / withoutVerbs.length;
  
  const varYWith = withVerbs.reduce((sum, p) => sum + Math.pow(p.y - meanYWith, 2), 0) / withVerbs.length;
  const varYWithout = withoutVerbs.reduce((sum, p) => sum + Math.pow(p.y - meanYWithout, 2), 0) / withoutVerbs.length;
  
  const stdDevYWith = Math.sqrt(varYWith);
  const stdDevYWithout = Math.sqrt(varYWithout);
  
  // Test t pour différence de moyennes
  const n1 = withVerbs.length;
  const n2 = withoutVerbs.length;
  const pooledVar = ((n1 - 1) * varYWith + (n2 - 1) * varYWithout) / (n1 + n2 - 2);
  const se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
  const tStat = se > 0 ? (meanYWith - meanYWithout) / se : 0;
  const df = n1 + n2 - 2;
  
  // Approximation p-value (t-distribution)
  const tPValue = 2 * (1 - normalCDF(Math.abs(tStat)));
  
  // Cohen's d
  const pooledStdDev = Math.sqrt(pooledVar);
  const cohenD = pooledStdDev > 0 ? (meanYWith - meanYWithout) / pooledStdDev : 0;
  
  // Baron-Kenny avec M1 binaire
  const xValues = pairsWithM1.map(p => p.x);
  const yValues = pairsWithM1.map(p => p.y);
  const m1Binary = pairsWithM1.map(p => p.m1! > 0 ? 1 : 0);
  
  // Path a : X → M1_binary (régression logistique approximée par régression linéaire)
  const regXM = simpleRegression(xValues, m1Binary);
  const a = regXM.slope;
  const seA = regXM.se;
  
  // Path b : M1_binary → Y | X (régression multiple)
  const regMY = multipleRegression(xValues, m1Binary, yValues);
  const b = regMY.b2;
  const seB = regMY.se2;
  
  // Effet indirect
  const indirectEffect = a * b;
  
  // Test de Sobel
  const sobelZ = indirectEffect / Math.sqrt(b * b * seA * seA + a * a * seB * seB + 1e-10);
  const sobelP = 2 * (1 - normalCDF(Math.abs(sobelZ)));
  
  // Effet total pour calculer % médiation
  const regXY = simpleRegression(xValues, yValues);
  const c = regXY.slope;
  const percentMediation = c !== 0 ? (indirectEffect / c) * 100 : 0;
  
  // Interprétation
  const isSignificant = sobelP < 0.05;
  const tTestSignificant = tPValue < 0.05;
  
  let interpretation: string;
  if (isSignificant && tTestSignificant) {
    interpretation = `✅ Médiation binaire significative : La PRÉSENCE de verbes d'action (vs absence) médiatise ${percentMediation.toFixed(0)}% de l'effet X → Y. L'effet est de type "interrupteur" (présence/absence), pas "volume" (quantité).`;
  } else if (tTestSignificant && !isSignificant) {
    interpretation = `⚠️ Effet binaire présent mais médiation non significative : Les tours AVEC verbes d'action ont une meilleure réaction (d = ${cohenD.toFixed(2)}), mais le test de Sobel n'atteint pas la significativité.`;
  } else if (!tTestSignificant) {
    interpretation = `❌ Pas d'effet binaire : La présence/absence de verbes d'action ne différencie pas significativement les réactions.`;
  } else {
    interpretation = `Résultats non concluants.`;
  }
  
  return {
    withVerbs: { count: n1, meanY: meanYWith, stdDevY: stdDevYWith },
    withoutVerbs: { count: n2, meanY: meanYWithout, stdDevY: stdDevYWithout },
    tTest: { t: tStat, pValue: tPValue, isSignificant: tTestSignificant, cohenD },
    binaryMediation: {
      a,
      b,
      indirectEffect,
      sobelZ,
      sobelP,
      isSignificant,
      percentMediation,
    },
    interpretation,
  };
}

export default useH2Mediation;
