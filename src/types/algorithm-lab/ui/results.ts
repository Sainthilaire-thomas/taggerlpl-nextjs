/**
 * @fileoverview Types pour les sections de résultats AlgorithmLab
 * Mission: Évolution Interface Level 1 - Affichage des Résultats
 * 
 * Structure des sections:
 * - Section A : Performance Intrinsèque
 * - Section B : Contribution H1
 * - Section C : Contribution H2 (Médiation)
 * - Section D : Décision (types existants dans versioning.ts)
 */

import type { TargetKind } from './components';
import type { ValidationMetrics } from '../core/validation';

// ============================================================================
// SECTION A : PERFORMANCE INTRINSÈQUE
// ============================================================================

/**
 * Métriques de classification enrichies (X, Y)
 * Étend ValidationMetrics avec les détails pour l'affichage
 */
export interface ClassificationMetricsDisplay {
  accuracy: number;
  kappa?: number;
  f1Macro: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
  avgProcessingTime: number;
  avgConfidence: number;
  totalSamples: number;
  correctPredictions: number;
}

/**
 * Bin d'histogramme pour distribution numérique
 */
export interface HistogramBin {
  bin: string;
  count: number;
  percentage: number;
}

/**
 * Statistiques par stratégie X
 */
export interface NumericStrategyStats {
  mean: number;
  count: number;
  stdDev?: number;
  min?: number;
  max?: number;
}

/**
 * Métriques numériques (M1, M2, M3)
 */
export interface NumericMetricsDisplay {
  distribution: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    histogram: HistogramBin[];
  };
  byStrategy: {
    ENGAGEMENT: NumericStrategyStats;
    OUVERTURE: NumericStrategyStats;
    REFLET: NumericStrategyStats;
    EXPLICATION: NumericStrategyStats;
  };
  totalSamples: number;
  coverage: number; // % de paires avec valeur calculée
}

/**
 * Échantillon de calcul M1 (verbes d'action)
 */
export interface M1CalculationSample {
  pairId: number;
  conseillerVerbatim: string;
  m1Density: number;
  m1Count: number;
  verbsDetected: string[];
  strategyTag?: string;
}

/**
 * Échantillon de calcul M2 (alignement linguistique)
 */
export interface M2CalculationSample {
  pairId: number;
  conseillerVerbatim: string;
  clientVerbatim: string;
  m2Score: number;
  alignedTokens: string[];
  jaccardIndex?: number;
  strategyTag?: string;
}

/**
 * Échantillon de calcul M3 (charge cognitive)
 */
export interface M3CalculationSample {
  pairId: number;
  clientVerbatim: string;
  m3Score: number;
  hesitationMarkers: string[];
  pauseCount?: number;
  fillerWords?: string[];
  strategyTag?: string;
}

/**
 * Union des échantillons de calcul
 */
export type CalculationSample = M1CalculationSample | M2CalculationSample | M3CalculationSample;

// ============================================================================
// SECTION B : CONTRIBUTION H1
// ============================================================================

/**
 * Direction d'évolution
 */
export type EvolutionDirection = 'up' | 'down' | 'stable';

/**
 * Évolution d'une métrique
 */
export interface MetricEvolution {
  delta: number;
  direction: EvolutionDirection;
  isPositive: boolean; // true si l'évolution va dans le bon sens
}

/**
 * Ligne de comparaison H1
 */
export interface H1ComparisonRow {
  criterion: string;
  criterionKey: string; // clé technique (actionsPositive, etc.)
  goldStandard: number | string;
  baseline: number | string | null;
  currentTest: number | string;
  evolution: MetricEvolution | null;
  threshold?: number | string;
  unit?: string; // '%', 'pts', 'p-value', etc.
}

/**
 * Résumé des critères validés
 */
export interface CriteriaValidationSummary {
  goldStandard: number;
  baseline: number | null;
  currentTest: number;
  total: number;
}

/**
 * Interprétation automatique H1
 */
export interface H1Interpretation {
  level: 'success' | 'warning' | 'error';
  message: string;
  recommendation: string;
}

/**
 * Données complètes de comparaison H1
 */
export interface H1ComparisonData {
  rows: H1ComparisonRow[];
  criteriaValidated: CriteriaValidationSummary;
  interpretation: H1Interpretation;
  statisticalTests: {
    chiSquare: number;
    pValue: number;
    cramersV: number;
    isSignificant: boolean;
  };
}

// ============================================================================
// SECTION C : CONTRIBUTION H2 (MÉDIATION)
// ============================================================================

/**
 * Verdict médiation selon seuils Cohen/Kenny
 * - substantial: effet ≥ 0.25, p < 0.01
 * - partial: effet 0.09-0.24, p < 0.05
 * - weak: effet 0.01-0.08, p < 0.10
 * - none: effet < 0.01 ou p ≥ 0.10
 */
export type MediationVerdict = 'substantial' | 'partial' | 'weak' | 'none';

/**
 * Labels et icônes pour les verdicts
 */
export const MEDIATION_VERDICT_CONFIG: Record<MediationVerdict, {
  label: string;
  icon: string;
  color: 'success' | 'warning' | 'info' | 'error';
}> = {
  substantial: { label: 'Médiation substantielle', icon: '✅', color: 'success' },
  partial: { label: 'Médiation partielle', icon: '⚠️', color: 'warning' },
  weak: { label: 'Médiation faible', icon: '⚡', color: 'info' },
  none: { label: 'Pas de médiation', icon: '❌', color: 'error' },
};

/**
 * Paths de médiation (Baron-Kenny)
 */
export interface MediationPaths {
  a: number;      // X → M (effet de X sur le médiateur)
  b: number;      // M → Y (effet du médiateur sur Y)
  c: number;      // Effet total X → Y
  cPrime: number; // Effet direct X → Y (contrôlant M)
}

/**
 * Qualité des données pour un médiateur
 */
export interface DataQuality {
  available: number;
  total: number;
  percentage: number;
}

/**
 * Résultat de médiation pour un médiateur
 */
export interface MediatorResult {
  mediator: 'M1' | 'M2' | 'M3';
  label: string;
  indirectEffect: number;      // a × b
  sobelZ: number;
  sobelP: number;
  verdict: MediationVerdict;
  dataQuality: DataQuality;
  paths: MediationPaths;
  percentMediation: number;    // (a × b) / c * 100
  bootstrapCI?: [number, number]; // Intervalle de confiance 95%
  isSignificant: boolean;
}

/**
 * Comparaison H2 avec versions précédentes
 */
export interface H2VersionComparison {
  mediator: 'M1' | 'M2' | 'M3';
  gold: MediatorResult | null;
  baseline: MediatorResult | null;
  lastTest: MediatorResult | null;
  currentTest: MediatorResult;
  vsBaseline: {
    indirectEffectDelta: number;
    percentMediationDelta: number;
    improved: boolean;
  } | null;
}

/**
 * Données complètes H2
 */
export interface H2MediationData {
  mediators: MediatorResult[];
  comparisons: H2VersionComparison[];
  overallInterpretation: {
    level: 'success' | 'warning' | 'error';
    message: string;
    recommendations: string[];
  };
}

// ============================================================================
// PROPS DES COMPOSANTS DE RÉSULTATS
// ============================================================================

/**
 * Props Section A : Performance Intrinsèque
 */
export interface PerformanceSectionProps {
  targetKind: TargetKind;
  // Pour classification (X, Y)
  classificationMetrics?: ClassificationMetricsDisplay;
  // Pour numérique (M1, M2, M3)
  numericMetrics?: NumericMetricsDisplay;
  calculationSamples?: CalculationSample[];
  // Commun
  classifierLabel?: string;
  errorPairIds?: number[];
  onAnnotateErrors?: (pairIds: number[]) => void;
  onAnnotateSample?: (pairId: number) => void;
  loading?: boolean;
}

/**
 * Props Section B : Contribution H1
 */
export interface H1ContributionSectionProps {
  targetKind: TargetKind;
  comparisonData: H1ComparisonData | null;
  runId?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onNavigateToLevel2?: () => void;
}

/**
 * Props Section C : Contribution H2
 */
export interface H2ContributionSectionProps {
  targetKind: TargetKind;
  mediationData: H2MediationData | null;
  runId?: string;
  loading?: boolean;
  onRefresh?: () => void;
  onNavigateToLevel2?: () => void;
  defaultExpanded?: boolean;
}

/**
 * Props pour l'histogramme de distribution numérique
 */
export interface NumericDistributionProps {
  metrics: NumericMetricsDisplay;
  targetKind: 'M1' | 'M2' | 'M3';
  title?: string;
  height?: number;
}

/**
 * Props pour l'échantillon de calculs
 */
export interface CalculationSampleTableProps {
  targetKind: 'M1' | 'M2' | 'M3';
  samples: CalculationSample[];
  pageSize?: number;
  onAnnotate?: (pairId: number) => void;
}

/**
 * Props pour le diagramme de médiation
 */
export interface MediationPathDiagramProps {
  mediator: 'M1' | 'M2' | 'M3';
  mediatorLabel: string;
  paths: MediationPaths;
  percentMediation: number;
  sobelZ: number;
  sobelP: number;
  verdict: MediationVerdict;
  compact?: boolean;
}

/**
 * Props pour le panneau de résultats unifié (container des 4 sections)
 */
export interface TestResultsPanelProps {
  targetKind: TargetKind;
  runId: string;
  // Section A
  performanceProps: Omit<PerformanceSectionProps, 'targetKind'>;
  // Section B (optionnel, seulement pour X/Y)
  h1Props?: Omit<H1ContributionSectionProps, 'targetKind'>;
  // Section C
  h2Props?: Omit<H2ContributionSectionProps, 'targetKind'>;
  // Section D - utilise les types de versioning.ts
  onDecision: (decision: 'discarded' | 'investigating' | 'promoted') => void;
  decisionDisabled?: boolean;
}

// ============================================================================
// HELPERS ET UTILITAIRES
// ============================================================================

/**
 * Détermine si la target est de type classification
 */
export function isClassificationTarget(target: TargetKind): boolean {
  return target === 'X' || target === 'Y';
}

/**
 * Détermine si la target est de type numérique
 */
export function isNumericTarget(target: TargetKind): boolean {
  return target === 'M1' || target === 'M2' || target === 'M3';
}

/**
 * Détermine le verdict de médiation selon les seuils Cohen/Kenny
 */
export function getMediationVerdict(indirectEffect: number, pValue: number): MediationVerdict {
  if (pValue >= 0.10 || Math.abs(indirectEffect) < 0.01) return 'none';
  if (Math.abs(indirectEffect) >= 0.25 && pValue < 0.01) return 'substantial';
  if (Math.abs(indirectEffect) >= 0.09 && pValue < 0.05) return 'partial';
  return 'weak';
}

/**
 * Calcule la direction d'évolution
 */
export function getEvolutionDirection(delta: number, threshold: number = 0.01): EvolutionDirection {
  if (Math.abs(delta) < threshold) return 'stable';
  return delta > 0 ? 'up' : 'down';
}

