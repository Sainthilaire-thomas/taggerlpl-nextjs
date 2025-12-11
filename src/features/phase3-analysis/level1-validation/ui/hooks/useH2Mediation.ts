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
  if (strategy.includes('ENGAGEMENT') || strategy.includes('OUVERTURE')) return 1;
  if (strategy.includes('EXPLICATION')) return 0;
  if (strategy.includes('REFLET')) return 0.5; // Neutre
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
     const comparisons: H2VersionComparison[] = mediatorResults.map(m => ({
        mediator: m.mediator,
        gold: null,
        baseline: null,
        lastTest: null,
        currentTest: m,
        vsBaseline: null,
      }));

      setMediationData({
        mediators: mediatorResults,
        comparisons,
        overallInterpretation,
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

export default useH2Mediation;
