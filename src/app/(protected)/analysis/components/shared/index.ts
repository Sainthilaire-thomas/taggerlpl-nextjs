// src/app/(protected)/analysis/components/shared/index.ts

// Re-export des composants atomiques
export {
  AlgorithmChip,
  HypothesisCard,
  MetricCard,
  ResponsiveGrid,
} from "./atoms";

// Re-export des composants moléculaires
export {
  AlgorithmSelector,
  FamilyMetricsCard,
  HypothesisValidation,
} from "./molecules";

// Types communs si nécessaire
export type {} from // Ajoutez vos types partagés ici si nécessaire
"./types"; // Si vous avez un fichier de types partagés
