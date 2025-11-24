// app/(protected)/analysis/components/AlgorithmLab/shared/types.ts
import { H1ValidationStatus, H1Thresholds } from "../../config/hypotheses";

export type StrategyKey =
  | "ENGAGEMENT"
  | "OUVERTURE"
  | "REFLET"
  | "EXPLICATION"
  | string;

// Types de base pour les données d'analyse H1
export interface H1StrategyData {
  strategy: string;
  totalSamples: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positiveRate: number;
  neutralRate: number;
  negativeRate: number;
  effectiveness: number; // positiveRate - negativeRate
}

export interface StrategyStats {
  strategy: string;
  total: number;
  positive: number;
  negative: number;
  effectiveness: number;
}

// Tests statistiques
export interface ChiSquareResult {
  statistic: number;
  pValue: number;
  degreesOfFreedom: number;
  cramersV: number;
  significant: boolean;
  interpretation: "faible" | "modéré" | "fort";
  contingency: number[][];
}

export interface FisherPairwise {
  comparison: string;
  oddsRatio: number;
  pValue: number;
  significant: boolean;
}

export interface AnovaOnProps {
  fStatistic: number;
  pValue: number;
  significant: boolean;
  groupMeans: Array<{
    strategy: string;
    mean: number;
  }>;
}

// Type principal H1Summary étendu avec nouveaux critères
export interface H1Summary {
  // Métriques de base (compatibilité avec interface existante)
  actionsAverage: number;
  explanationPositive: number;
  empiricalDifference: number;

  // Tests statistiques
  chiSquare: ChiSquareResult;
  fisher: FisherPairwise[];
  anova?: AnovaOnProps;

  // Statut de validation (format legacy pour compatibilité)
  overallValidation: "VALIDATED" | "PARTIALLY_VALIDATED" | "NOT_VALIDATED";
  academicConclusion: string;
  practicalImplications: string[];
  limitationsNoted: string[];

  // NOUVEAUX CHAMPS pour critères H1 complets
  validation?: H1ValidationStatus; // Validation détaillée complète
  thresholds?: H1Thresholds; // Configuration utilisée

  actionsNegativeAverage?: number; // Moyenne négatif des actions
  explanationNegative?: number; // % négatif des explications
  sampleSizeAdequate?: boolean; // Échantillon suffisant
  confidence?: "HIGH" | "MEDIUM" | "LOW"; // Confiance globale
  detailedCriteria?: any; // Critères détaillés pour l'UI
}

// Types pour l'affichage détaillé des critères
export interface CriteriaDetail {
  name: string;
  met: boolean;
  value: string;
  threshold: string;
  description: string;
}

export interface DetailedCriteriaExtraction {
  criteriaDetails: CriteriaDetail[];
  overallScore: number;
  maxScore: number;
  warnings: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

// Types pour la configuration d'affichage
export interface DisplayThresholds {
  positive: {
    good: number; // Seuil pour couleur verte
    excellent: number; // Seuil pour vert vif
  };
  negative: {
    warning: number; // Seuil pour couleur orange
    critical: number; // Seuil pour rouge
  };
  effectiveness: {
    positive: number; // Efficacité positive
    excellent: number; // Très efficace
  };
  sampleSize: {
    adequate: number; // N minimum acceptable
    warning: number; // N seuil d'avertissement
  };
}

export const DEFAULT_DISPLAY_THRESHOLDS: DisplayThresholds = {
  positive: {
    good: 40.0,
    excellent: 60.0,
  },
  negative: {
    warning: 50.0,
    critical: 80.0,
  },
  effectiveness: {
    positive: 0.0,
    excellent: 30.0,
  },
  sampleSize: {
    adequate: 100,
    warning: 150,
  },
};

// Types pour les props des composants mis à jour
export interface Level2InterfaceProps {
  selectedOrigin?: string | null;
  thresholds?: H1Thresholds;
  displayOptions?: {
    showDetailedCriteria?: boolean;
    showSubcategories?: boolean;
    precision?: number;
  };
}

export interface StatisticalSummaryProps {
  data: StrategyStats[];
  validationResults: H1Summary;
  showDetailedCriteria?: boolean;
  thresholds?: H1Thresholds;
}

export interface StatisticalTestsPanelProps {
  data: H1StrategyData[];
  showAdvancedTests?: boolean;
}

// Types pour l'historique des runs (préparation PR3)
export interface RunMetadata {
  id: string;
  timestamp: Date;
  userId?: string;

  // Paramètres de la validation
  selectedOrigin: string | null;
  thresholds: H1Thresholds;

  // Signature du dataset
  datasetSignature: string;
  totalSamples: number;
  strategyCounts: Record<string, number>;

  // Résultats clés
  overallValidation: H1Summary["overallValidation"];
  empiricalDifference: number;
  chiSquareP: number;
  cramersV: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";

  // Métadonnées
  version: string;
  notes?: string;
}

export interface RunComparison {
  baseRun: RunMetadata;
  compareRun: RunMetadata;

  differences: {
    sampleSizeChange: number;
    validationChange: string; // "IMPROVED" | "DEGRADED" | "SAME"
    empiricalDiffChange: number;
    significanceChange: boolean;
  };

  recommendations: string[];
}

// Types pour l'export (préparation PR4)
export interface ExportableData {
  metadata: {
    exportDate: Date;
    version: string;
    source: "Level2Interface";
    datasetSignature: string;
  };

  configuration: H1Thresholds;

  rawData: {
    validTurnTagged: any[];
    filteredCount: number;
    strategyBreakdown: Record<string, number>;
  };

  analysis: {
    h1StrategyData: H1StrategyData[];
    statisticalTests: {
      chiSquare: ChiSquareResult;
      fisherPairwise: FisherPairwise[];
      anova?: AnovaOnProps;
    };
  };

  validation: H1Summary;
}

export type ExportFormat = "CSV" | "JSON" | "PDF_SUMMARY";

export interface ExportOptions {
  format: ExportFormat;
  includeRawData: boolean;
  includeStatisticalDetails: boolean;
  includeConfiguration: boolean;
  filename?: string;
}
