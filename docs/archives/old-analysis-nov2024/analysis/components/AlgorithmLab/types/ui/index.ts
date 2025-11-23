/**
 * @fileoverview Export centralisé des types UI AlgorithmLab
 * Point d'entrée principal pour tous les types d'interface utilisateur AlgorithmLab
 */

// Composants génériques
export * from './components';

// Validation spécialisée
export * from './validation';

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
