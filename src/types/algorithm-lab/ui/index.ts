/**
 * @fileoverview Export centralisé des types UI AlgorithmLab
 * Point d'entrée principal pour tous les types d'interface utilisateur AlgorithmLab
 */

// Composants génériques
export * from './components';

// Validation spécialisée
export * from './validation';

// Résultats et sections (Mission Level 1 Interface Evolution)
export * from './results';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  BaseValidationProps,
  DisplayConfig,
  ConfigFormProps,
  ResultDisplayProps,
  ModalProps
} from './components';

export type {
  XValidationProps,
  YValidationProps,
  M1ValidationProps,
  M2ValidationProps,
  M3ValidationProps,
  AllValidationProps
} from './validation';

// Exports groupés pour les résultats
export type {
  // Section A
  ClassificationMetricsDisplay,
  NumericMetricsDisplay,
  M1CalculationSample,
  M2CalculationSample,
  M3CalculationSample,
  CalculationSample,
  // Section B
  H1ComparisonData,
  H1ComparisonRow,
  H1Interpretation,
  // Section C
  MediatorResult,
  MediationVerdict,
  MediationPaths,
  H2MediationData,
  H2VersionComparison,
  // Props
  PerformanceSectionProps,
  H1ContributionSectionProps,
  H2ContributionSectionProps,
  TestResultsPanelProps
} from './results';
