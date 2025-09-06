/**
 * @fileoverview Export centralisé des types utils AlgorithmLab
 * Point d'entrée principal pour tous les types utilitaires AlgorithmLab
 */

// Normalisation
export * from './normalizers';

// Conversion et adaptation
export * from './converters';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  NormalizationLevel,
  NormalizationConfig,
  NormalizationRule,
  NormalizationResult,
  normalizeXLabel,
  normalizeYLabel,
  familyFromX,
  familyFromY
} from './normalizers';

export type {
  ConversionDirection,
  ConversionConfig,
  ConversionResult,
  FormatAdapter,
  LegacyToUniversalAdapter,
  ExportAdapter,
  DataTransformation,
  ChainedTransformation,
  LegacyMapping
} from './converters';
