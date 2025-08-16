// src/components/cognitive-metrics/types.ts

export interface IndicatorDescription {
  title: string;
  description: string;
  formula: string;
  interpretation: string;
  examples: string;
  references: string;
}

export interface MetricData {
  key: string;
  title: string;
  value: string | number;
  subtitle: string;
  color?: "primary" | "warning" | "success" | "error";
  loading?: boolean;
}

export interface CategoryData {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "primary" | "warning" | "success";
  description: string;
  metrics: MetricData[];
}

export interface FilterState {
  origine: string;
  conseiller: string;
  strategyType: string;
  reactionType: string;
}

export interface CognitiveMetricsProps {
  defaultFilters?: {
    origine?: string;
    dateRange?: [string, string];
  };
}

// NOUVEAUX TYPES pour l'analyse par famille
export interface FamilyImpactMetrics {
  family: string;
  totalUsage: number;
  acceptanceRate: number;
  immediateAcceptance: number;
  resistanceRate: number;
  cognitiveLoad: number;
  averageReactionLength: number;
  reactionSpeed: number;
  positiveMarkers: number;
  negativeMarkers: number;
  effortMarkers: number;
  examples: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

export interface CognitiveAnalysisResult {
  familyMetrics: FamilyImpactMetrics[];
  globalMetrics: {
    mostEffective: string;
    leastResistance: string;
    highestCognitiveLoad: string;
  };
  comparativeAnalysis: {
    refletVsExplication: number;
    ouvertureVsEngagement: number;
  };
  loading: boolean;
  error: string | null;
}

// Garder les types existants pour compatibilité
export interface IndicatorDescription {
  title: string;
  description: string;
  formula: string;
  interpretation: string;
  examples: string;
  references: string;
}

export type IndicatorKey =
  | "fluiditeCognitive"
  | "reactionsDirectes"
  | "reprisesLexicales"
  | "chargeCognitive"
  | "marqueursEffort"
  | "patternsResistance"
  | "robustesseStress"
  | "niveauStress"
  | "positionConversation";
