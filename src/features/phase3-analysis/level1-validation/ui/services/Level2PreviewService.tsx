// src/features/phase3-analysis/level1-validation/ui/services/Level2PreviewService.ts
/**
 * Service de prévisualisation Level 2 pour Level 1
 * 
 * Calcule les indicateurs H1/H2 directement après validation algorithmique
 * pour anticiper si les résultats seront exploitables pour les hypothèses.
 */

import { H1StatisticsService } from '@/features/phase3-analysis/level2-hypotheses/statistics/domain/services/H1StatisticsService';
import {
  H1Thresholds,
  REALISTIC_H1_THRESHOLDS,
  DEFAULT_H1_THRESHOLDS,
  EMPIRICAL_H1_THRESHOLDS,
} from '@/features/phase3-analysis/level2-hypotheses/config/hypotheses';

// ============================================================================
// TYPES
// ============================================================================

export type ThresholdMode = 'STRICT' | 'REALISTIC' | 'EMPIRICAL';

export type ReadinessLevel = 'READY' | 'PARTIAL' | 'INSUFFICIENT';

export interface H1PreviewData {
  // Qualité algorithme X
  xAccuracy: number;
  xF1Macro: number;
  xKappa: number;

  // Distribution des prédictions X
  xDistribution: {
    ENGAGEMENT: number;
    OUVERTURE: number;
    REFLET: number;
    EXPLICATION: number;
  };

  // Simulation Chi² (sur prédictions vs Y gold)
  estimatedChiSquare: number;
  estimatedCramersV: number;
  estimatedPValue: number;

  // Écarts empiriques (basés sur prédictions X vs Y gold)
  actionsPositiveRate: number;
  actionsNegativeRate: number;
  explanationsPositiveRate: number;
  explanationsNegativeRate: number;
  empiricalDifference: number;

  // Conformité seuils (6 critères H1)
  criteriaStatus: {
    actionsPositive: { met: boolean; value: number; threshold: number };
    actionsNegative: { met: boolean; value: number; threshold: number };
    explanationsPositive: { met: boolean; value: number; threshold: number };
    explanationsNegative: { met: boolean; value: number; threshold: number };
    empiricalGap: { met: boolean; value: number; threshold: number };
    statisticalSignificance: { met: boolean; pValue: number; cramersV: number };
  };

  // Score global
  criteriaMet: number;
  criteriaTotal: number;
  h1ReadinessScore: number; // 0-100
  h1ReadinessLevel: ReadinessLevel;

  // Recommandations
  recommendations: string[];
}

export interface H2PreviewData {
  // Couverture médiateurs (% paires avec valeur calculée)
  m1Coverage: number;
  m2Coverage: number;
  m3Coverage: number;

  // Moyennes par groupe (Actions vs Explications)
  m1ActionsMean: number | null;
  m1ExplanationsMean: number | null;
  m2ActionsMean: number | null;
  m2ExplanationsMean: number | null;
  m3ActionsMean: number | null;
  m3ExplanationsMean: number | null;

  // Corrélations préliminaires (M vs Y codé)
  m1Correlation: number | null;
  m2Correlation: number | null;
  m3Correlation: number | null;

  // Conformité seuils
  criteriaStatus: {
    m1Coverage: { met: boolean; value: number; threshold: number };
    m2Coverage: { met: boolean; value: number; threshold: number };
    m3Coverage: { met: boolean; value: number; threshold: number };
    m1Significant: { met: boolean; value: number | null };
    m2Significant: { met: boolean; value: number | null };
    m3Significant: { met: boolean; value: number | null };
  };

  // Score global
  criteriaMet: number;
  criteriaTotal: number;
  h2ReadinessScore: number; // 0-100
  h2ReadinessLevel: ReadinessLevel;

  // Recommandations
  recommendations: string[];
}

export interface Level2PreviewResult {
  h1Preview: H1PreviewData;
  h2Preview: H2PreviewData;
  overallReadiness: ReadinessLevel;
  overallScore: number;
  timestamp: string;
  thresholdMode: ThresholdMode;
}

export interface ValidationMetrics {
  accuracy: number;
  kappa?: number;
  f1Score?: Record<string, number>;
}

export interface AnalysisPairForPreview {
  pair_id: number;
  strategy_tag: string;
  reaction_tag: string;
  strategy_family?: string;
  x_predicted_tag?: string | null;
  y_predicted_tag?: string | null;
  m1_verb_density?: number | null;
  m2_global_alignment?: number | null;
  m3_cognitive_score?: number | null;
}

// ============================================================================
// SERVICE
// ============================================================================

export class Level2PreviewService {
  private thresholds: H1Thresholds;
  private mode: ThresholdMode;

  // Seuils H2 (couverture médiateurs)
  private static readonly H2_COVERAGE_THRESHOLD = 90; // %
  private static readonly H2_CORRELATION_THRESHOLD = 0.15; // r minimal significatif

  constructor(mode: ThresholdMode = 'REALISTIC') {
    this.mode = mode;
    this.thresholds = this.getThresholdsForMode(mode);
  }

  private getThresholdsForMode(mode: ThresholdMode): H1Thresholds {
    switch (mode) {
      case 'STRICT':
        return DEFAULT_H1_THRESHOLDS;
      case 'EMPIRICAL':
        return EMPIRICAL_H1_THRESHOLDS;
      default:
        return REALISTIC_H1_THRESHOLDS;
    }
  }

  /**
   * Calcule la prévisualisation complète Level 2
   */
  calculatePreview(
    analysisPairs: AnalysisPairForPreview[],
    xMetrics?: ValidationMetrics,
    yMetrics?: ValidationMetrics
  ): Level2PreviewResult {
    const h1Preview = this.calculateH1Preview(analysisPairs, xMetrics);
    const h2Preview = this.calculateH2Preview(analysisPairs);

    // Score global combiné (H1 = 60%, H2 = 40%)
    const overallScore = Math.round(
      h1Preview.h1ReadinessScore * 0.6 + h2Preview.h2ReadinessScore * 0.4
    );

    const overallReadiness: ReadinessLevel =
      overallScore >= 70 ? 'READY' :
      overallScore >= 40 ? 'PARTIAL' : 'INSUFFICIENT';

    return {
      h1Preview,
      h2Preview,
      overallReadiness,
      overallScore,
      timestamp: new Date().toISOString(),
      thresholdMode: this.mode,
    };
  }

  /**
   * Calcule les indicateurs H1
   */
  private calculateH1Preview(
    pairs: AnalysisPairForPreview[],
    xMetrics?: ValidationMetrics
  ): H1PreviewData {
    // Filtrer les paires avec prédictions X
    const pairsWithX = pairs.filter(p => p.x_predicted_tag);
    const totalWithX = pairsWithX.length;

    // Distribution des prédictions X
    const xDistribution = this.calculateXDistribution(pairsWithX);

    // Métriques algorithme X (si fournies)
    const xAccuracy = xMetrics?.accuracy ?? 0;
    const xKappa = xMetrics?.kappa ?? 0;
    const xF1Macro = this.calculateF1Macro(xMetrics?.f1Score);

    // Calculer les taux par stratégie (prédictions X vs Y gold)
    const { actionsStats, explanationsStats, contingencyTable } =
      this.calculateStrategyStats(pairsWithX);

    // Tests statistiques
    const { chiSquare, cramersV, pValue } = this.calculateChiSquareFromContingency(
      contingencyTable,
      totalWithX
    );

    // Écart empirique
    const empiricalDifference = actionsStats.positiveRate - explanationsStats.positiveRate;

    // Évaluation des 6 critères H1
    const criteriaStatus = {
      actionsPositive: {
        met: actionsStats.positiveRate >= this.thresholds.actions.minPositiveRate,
        value: actionsStats.positiveRate,
        threshold: this.thresholds.actions.minPositiveRate,
      },
      actionsNegative: {
        met: actionsStats.negativeRate <= this.thresholds.actions.maxNegativeRate,
        value: actionsStats.negativeRate,
        threshold: this.thresholds.actions.maxNegativeRate,
      },
      explanationsPositive: {
        met: explanationsStats.positiveRate <= this.thresholds.explanations.maxPositiveRate,
        value: explanationsStats.positiveRate,
        threshold: this.thresholds.explanations.maxPositiveRate,
      },
      explanationsNegative: {
        met: explanationsStats.negativeRate >= this.thresholds.explanations.minNegativeRate,
        value: explanationsStats.negativeRate,
        threshold: this.thresholds.explanations.minNegativeRate,
      },
      empiricalGap: {
        met: empiricalDifference >= this.thresholds.empirical.minDifference,
        value: empiricalDifference,
        threshold: this.thresholds.empirical.minDifference,
      },
      statisticalSignificance: {
        met: pValue < this.thresholds.statistical.alphaLevel &&
             cramersV >= this.thresholds.statistical.cramersVModerate,
        pValue,
        cramersV,
      },
    };

    // Compter les critères satisfaits
    const criteriaMet = Object.values(criteriaStatus).filter(c => c.met).length;
    const criteriaTotal = 6;

    // Score de readiness (0-100)
    const h1ReadinessScore = Math.round((criteriaMet / criteriaTotal) * 100);

    // Niveau de readiness
    const h1ReadinessLevel: ReadinessLevel =
      criteriaMet >= this.thresholds.validation.minScoreForValidated ? 'READY' :
      criteriaMet >= this.thresholds.validation.minScoreForPartial ? 'PARTIAL' : 'INSUFFICIENT';

    // Recommandations
    const recommendations = this.generateH1Recommendations(criteriaStatus, totalWithX, xAccuracy);

    return {
      xAccuracy,
      xF1Macro,
      xKappa,
      xDistribution,
      estimatedChiSquare: chiSquare,
      estimatedCramersV: cramersV,
      estimatedPValue: pValue,
      actionsPositiveRate: actionsStats.positiveRate,
      actionsNegativeRate: actionsStats.negativeRate,
      explanationsPositiveRate: explanationsStats.positiveRate,
      explanationsNegativeRate: explanationsStats.negativeRate,
      empiricalDifference,
      criteriaStatus,
      criteriaMet,
      criteriaTotal,
      h1ReadinessScore,
      h1ReadinessLevel,
      recommendations,
    };
  }

  /**
   * Calcule les indicateurs H2 (médiation)
   */
  private calculateH2Preview(pairs: AnalysisPairForPreview[]): H2PreviewData {
    const total = pairs.length;

    // Couverture des médiateurs
    const withM1 = pairs.filter(p => p.m1_verb_density !== null && p.m1_verb_density !== undefined).length;
    const withM2 = pairs.filter(p => p.m2_global_alignment !== null && p.m2_global_alignment !== undefined).length;
    const withM3 = pairs.filter(p => p.m3_cognitive_score !== null && p.m3_cognitive_score !== undefined).length;

    const m1Coverage = total > 0 ? (withM1 / total) * 100 : 0;
    const m2Coverage = total > 0 ? (withM2 / total) * 100 : 0;
    const m3Coverage = total > 0 ? (withM3 / total) * 100 : 0;

    // Moyennes par groupe (Actions vs Explications)
    const { m1ActionsMean, m1ExplanationsMean, m2ActionsMean, m2ExplanationsMean, m3ActionsMean, m3ExplanationsMean } =
      this.calculateMediatorMeans(pairs);

    // Corrélations préliminaires
    const m1Correlation = this.calculateCorrelationWithY(pairs, 'm1_verb_density');
    const m2Correlation = this.calculateCorrelationWithY(pairs, 'm2_global_alignment');
    const m3Correlation = this.calculateCorrelationWithY(pairs, 'm3_cognitive_score');

    const coverageThreshold = Level2PreviewService.H2_COVERAGE_THRESHOLD;
    const correlationThreshold = Level2PreviewService.H2_CORRELATION_THRESHOLD;

    // Évaluation des critères H2
    const criteriaStatus = {
      m1Coverage: {
        met: m1Coverage >= coverageThreshold,
        value: m1Coverage,
        threshold: coverageThreshold,
      },
      m2Coverage: {
        met: m2Coverage >= coverageThreshold,
        value: m2Coverage,
        threshold: coverageThreshold,
      },
      m3Coverage: {
        met: m3Coverage >= coverageThreshold,
        value: m3Coverage,
        threshold: coverageThreshold,
      },
      m1Significant: {
        met: m1Correlation !== null && Math.abs(m1Correlation) >= correlationThreshold,
        value: m1Correlation,
      },
      m2Significant: {
        met: m2Correlation !== null && Math.abs(m2Correlation) >= correlationThreshold,
        value: m2Correlation,
      },
      m3Significant: {
        met: m3Correlation !== null && Math.abs(m3Correlation) >= correlationThreshold,
        value: m3Correlation,
      },
    };

    // Compter les critères satisfaits
    const criteriaMet = Object.values(criteriaStatus).filter(c => c.met).length;
    const criteriaTotal = 6;

    // Score de readiness
    const h2ReadinessScore = Math.round((criteriaMet / criteriaTotal) * 100);

    // Niveau de readiness
    const h2ReadinessLevel: ReadinessLevel =
      criteriaMet >= 5 ? 'READY' :
      criteriaMet >= 3 ? 'PARTIAL' : 'INSUFFICIENT';

    // Recommandations
    const recommendations = this.generateH2Recommendations(criteriaStatus);

    return {
      m1Coverage,
      m2Coverage,
      m3Coverage,
      m1ActionsMean,
      m1ExplanationsMean,
      m2ActionsMean,
      m2ExplanationsMean,
      m3ActionsMean,
      m3ExplanationsMean,
      m1Correlation,
      m2Correlation,
      m3Correlation,
      criteriaStatus,
      criteriaMet,
      criteriaTotal,
      h2ReadinessScore,
      h2ReadinessLevel,
      recommendations,
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private calculateXDistribution(pairs: AnalysisPairForPreview[]): H1PreviewData['xDistribution'] {
    const dist = { ENGAGEMENT: 0, OUVERTURE: 0, REFLET: 0, EXPLICATION: 0 };
    const total = pairs.length;

    pairs.forEach(p => {
      const tag = (p.x_predicted_tag || '').toUpperCase();
      if (tag === 'ENGAGEMENT') dist.ENGAGEMENT++;
      else if (tag === 'OUVERTURE') dist.OUVERTURE++;
      else if (tag.startsWith('REFLET')) dist.REFLET++;
      else if (tag === 'EXPLICATION') dist.EXPLICATION++;
    });

    // Convertir en pourcentages
    if (total > 0) {
      dist.ENGAGEMENT = Math.round((dist.ENGAGEMENT / total) * 100);
      dist.OUVERTURE = Math.round((dist.OUVERTURE / total) * 100);
      dist.REFLET = Math.round((dist.REFLET / total) * 100);
      dist.EXPLICATION = Math.round((dist.EXPLICATION / total) * 100);
    }

    return dist;
  }

  private calculateF1Macro(f1Scores?: Record<string, number>): number {
    if (!f1Scores || Object.keys(f1Scores).length === 0) return 0;
    const values = Object.values(f1Scores);
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }

  private calculateStrategyStats(pairs: AnalysisPairForPreview[]): {
    actionsStats: { positiveRate: number; negativeRate: number; total: number };
    explanationsStats: { positiveRate: number; negativeRate: number; total: number };
    contingencyTable: number[][];
  } {
    // Grouper par type de stratégie prédite
    const actions = pairs.filter(p => {
      const tag = (p.x_predicted_tag || '').toUpperCase();
      return tag === 'ENGAGEMENT' || tag === 'OUVERTURE';
    });

    const explanations = pairs.filter(p => {
      const tag = (p.x_predicted_tag || '').toUpperCase();
      return tag === 'EXPLICATION';
    });

    // Calculer les taux pour Actions
    const actionsPositive = actions.filter(p =>
      (p.reaction_tag || '').toUpperCase().includes('POSITIF')
    ).length;
    const actionsNegative = actions.filter(p =>
      (p.reaction_tag || '').toUpperCase().includes('NEGATIF')
    ).length;
    const actionsNeutral = actions.length - actionsPositive - actionsNegative;

    // Calculer les taux pour Explications
    const expPositive = explanations.filter(p =>
      (p.reaction_tag || '').toUpperCase().includes('POSITIF')
    ).length;
    const expNegative = explanations.filter(p =>
      (p.reaction_tag || '').toUpperCase().includes('NEGATIF')
    ).length;
    const expNeutral = explanations.length - expPositive - expNegative;

    // Construire la table de contingence pour Chi²
    // Lignes: Actions, Explications | Colonnes: Positif, Neutre, Négatif
    const contingencyTable = [
      [actionsPositive, actionsNeutral, actionsNegative],
      [expPositive, expNeutral, expNegative],
    ];

    return {
      actionsStats: {
        positiveRate: actions.length > 0 ? Math.round((actionsPositive / actions.length) * 100) : 0,
        negativeRate: actions.length > 0 ? Math.round((actionsNegative / actions.length) * 100) : 0,
        total: actions.length,
      },
      explanationsStats: {
        positiveRate: explanations.length > 0 ? Math.round((expPositive / explanations.length) * 100) : 0,
        negativeRate: explanations.length > 0 ? Math.round((expNegative / explanations.length) * 100) : 0,
        total: explanations.length,
      },
      contingencyTable,
    };
  }

  private calculateChiSquareFromContingency(
    contingency: number[][],
    n: number
  ): { chiSquare: number; cramersV: number; pValue: number } {
    if (n === 0 || contingency.length === 0) {
      return { chiSquare: 0, cramersV: 0, pValue: 1 };
    }

    // Calculer les fréquences attendues
    const expected = H1StatisticsService.calculateExpectedFrequencies(contingency);

    if (expected.length === 0) {
      return { chiSquare: 0, cramersV: 0, pValue: 1 };
    }

    // Calculer Chi²
    const { chiSquare, df, pValue } = H1StatisticsService.calculateChiSquare(contingency, expected);

    // Calculer V de Cramér
    const rows = contingency.length;
    const cols = contingency[0]?.length || 0;
    const cramersV = H1StatisticsService.calculateCramersV(chiSquare, n, rows, cols);

    return { chiSquare, cramersV, pValue };
  }

  private calculateMediatorMeans(pairs: AnalysisPairForPreview[]): {
    m1ActionsMean: number | null;
    m1ExplanationsMean: number | null;
    m2ActionsMean: number | null;
    m2ExplanationsMean: number | null;
    m3ActionsMean: number | null;
    m3ExplanationsMean: number | null;
  } {
    const isAction = (p: AnalysisPairForPreview) => {
      const family = (p.strategy_family || p.strategy_tag || '').toUpperCase();
      return family === 'ENGAGEMENT' || family === 'OUVERTURE' ||
             family.includes('ENGAGEMENT') || family.includes('OUVERTURE');
    };

    const isExplanation = (p: AnalysisPairForPreview) => {
      const family = (p.strategy_family || p.strategy_tag || '').toUpperCase();
      return family === 'EXPLICATION' || family.includes('EXPLICATION');
    };

    const calculateMean = (values: (number | null | undefined)[]): number | null => {
      const valid = values.filter((v): v is number => v !== null && v !== undefined);
      if (valid.length === 0) return null;
      return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 1000) / 1000;
    };

    const actions = pairs.filter(isAction);
    const explanations = pairs.filter(isExplanation);

    return {
      m1ActionsMean: calculateMean(actions.map(p => p.m1_verb_density)),
      m1ExplanationsMean: calculateMean(explanations.map(p => p.m1_verb_density)),
      m2ActionsMean: calculateMean(actions.map(p => p.m2_global_alignment)),
      m2ExplanationsMean: calculateMean(explanations.map(p => p.m2_global_alignment)),
      m3ActionsMean: calculateMean(actions.map(p => p.m3_cognitive_score)),
      m3ExplanationsMean: calculateMean(explanations.map(p => p.m3_cognitive_score)),
    };
  }

  private calculateCorrelationWithY(
    pairs: AnalysisPairForPreview[],
    mediatorKey: 'm1_verb_density' | 'm2_global_alignment' | 'm3_cognitive_score'
  ): number | null {
    // Encoder Y: POSITIF=1, NEUTRE=0, NEGATIF=-1
    const encodeY = (reaction: string): number => {
      const r = (reaction || '').toUpperCase();
      if (r.includes('POSITIF')) return 1;
      if (r.includes('NEGATIF')) return -1;
      return 0;
    };

    // Filtrer les paires avec médiateur valide
    const validPairs = pairs.filter(p =>
      p[mediatorKey] !== null &&
      p[mediatorKey] !== undefined &&
      p.reaction_tag
    );

    if (validPairs.length < 10) return null; // Pas assez de données

    const x = validPairs.map(p => p[mediatorKey] as number);
    const y = validPairs.map(p => encodeY(p.reaction_tag));

    // Calcul corrélation de Pearson
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) return null;

    return Math.round((numerator / denominator) * 1000) / 1000;
  }

  private generateH1Recommendations(
    criteria: H1PreviewData['criteriaStatus'],
    sampleSize: number,
    accuracy: number
  ): string[] {
    const recommendations: string[] = [];

    if (sampleSize < 100) {
      recommendations.push(`⚠️ Échantillon limité (${sampleSize} paires avec X). Exécuter l'algorithme X sur plus de paires.`);
    }

    if (accuracy < 70) {
      recommendations.push(`⚠️ Accuracy X faible (${accuracy}%). Améliorer l'algorithme avant validation H1.`);
    }

    if (!criteria.actionsPositive.met) {
      recommendations.push(`❌ Actions → Positif: ${criteria.actionsPositive.value}% < ${criteria.actionsPositive.threshold}% requis`);
    }

    if (!criteria.actionsNegative.met) {
      recommendations.push(`❌ Actions → Négatif: ${criteria.actionsNegative.value}% > ${criteria.actionsNegative.threshold}% max`);
    }

    if (!criteria.explanationsPositive.met) {
      recommendations.push(`❌ Explications → Positif: ${criteria.explanationsPositive.value}% > ${criteria.explanationsPositive.threshold}% max`);
    }

    if (!criteria.explanationsNegative.met) {
      recommendations.push(`❌ Explications → Négatif: ${criteria.explanationsNegative.value}% < ${criteria.explanationsNegative.threshold}% requis`);
    }

    if (!criteria.empiricalGap.met) {
      recommendations.push(`❌ Écart empirique: ${criteria.empiricalGap.value} pts < ${criteria.empiricalGap.threshold} pts requis`);
    }

    if (!criteria.statisticalSignificance.met) {
      if (criteria.statisticalSignificance.pValue >= 0.05) {
        recommendations.push(`❌ Chi² non significatif (p=${criteria.statisticalSignificance.pValue.toFixed(3)})`);
      }
      if (criteria.statisticalSignificance.cramersV < 0.15) {
        recommendations.push(`❌ Effet faible (V=${criteria.statisticalSignificance.cramersV.toFixed(3)})`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Tous les critères H1 sont satisfaits. Prêt pour Level 2.');
    }

    return recommendations;
  }

  private generateH2Recommendations(criteria: H2PreviewData['criteriaStatus']): string[] {
    const recommendations: string[] = [];
    const threshold = Level2PreviewService.H2_COVERAGE_THRESHOLD;

    if (!criteria.m1Coverage.met) {
      recommendations.push(`⚠️ M1 Coverage: ${criteria.m1Coverage.value.toFixed(0)}% < ${threshold}%. Exécuter M1Calculator.`);
    }

    if (!criteria.m2Coverage.met) {
      recommendations.push(`⚠️ M2 Coverage: ${criteria.m2Coverage.value.toFixed(0)}% < ${threshold}%. Exécuter M2Calculator.`);
    }

    if (!criteria.m3Coverage.met) {
      recommendations.push(`⚠️ M3 Coverage: ${criteria.m3Coverage.value.toFixed(0)}% < ${threshold}%. Exécuter M3Calculator.`);
    }

    if (!criteria.m1Significant.met) {
      const r = criteria.m1Significant.value;
      recommendations.push(`⚠️ M1 corrélation ${r !== null ? `faible (r=${r.toFixed(3)})` : 'non calculable'}`);
    }

    if (!criteria.m2Significant.met) {
      const r = criteria.m2Significant.value;
      recommendations.push(`⚠️ M2 corrélation ${r !== null ? `faible (r=${r.toFixed(3)})` : 'non calculable'}`);
    }

    if (!criteria.m3Significant.met) {
      const r = criteria.m3Significant.value;
      recommendations.push(`⚠️ M3 corrélation ${r !== null ? `faible (r=${r.toFixed(3)})` : 'non calculable'}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Tous les critères H2 sont satisfaits. Médiation analysable.');
    }

    return recommendations;
  }
}

// Export singleton avec mode par défaut
export const level2PreviewService = new Level2PreviewService('REALISTIC');
