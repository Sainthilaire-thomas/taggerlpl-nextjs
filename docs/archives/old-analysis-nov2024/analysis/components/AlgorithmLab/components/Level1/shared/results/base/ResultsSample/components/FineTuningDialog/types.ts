import { TVValidationResult } from "../../types";

export interface FineTuningDialogProps {
  open: boolean;
  onClose: () => void;
  results: TVValidationResult[];
  initialData?: string;
}

export interface FineTuningData {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  metadata: {
    turnId: number;
    verbatim: string;
    context: ContextData;
    predicted: string;
    goldStandard: string;
    confidence: number;
    annotations: string[];
    algo: AlgoData;
    rawAnnotations?: any[];
  };
}

export interface ContextData {
  prev2?: string | null;
  prev1?: string | null;
  current: string;
  next1?: string | null;
}

export interface AlgoData {
  classifier: string;
  type?: string;
  model?: string | null;
  provider?: string;
  temperature?: number | null;
  max_tokens?: number | null;
}

export interface AnnotationData {
  id?: number;
  note: string;
  rationale?: string;
  comment?: string;
  created_at: string;
  author?: string;
  gold?: string;
  predicted?: string;
  confidence?: number;
  context?: ContextData;
  classifier?: string;
  algo?: AlgoData;
}

export interface ExtractionProgress {
  current: number;
  total: number;
  phase?: "loading" | "processing" | "formatting" | "complete";
}

export interface ExtractionStats {
  totalResults: number;
  processedCount: number;
  annotationsFound: number;
  errorsCount: number;
  uniqueAlgorithms: number;
  annotationCoverage: number;
  errorRate: number;
}

export interface ErrorAnalysis {
  errorPatterns: { [key: string]: number };
  confusionMatrix: { [predicted: string]: { [gold: string]: number } };
  topErrors: Array<{ pattern: string; count: number }>;
  frequentMistakes: string[];
}

export interface FineTuningExtractionResult {
  data: string;
  stats: ExtractionStats;
  errorAnalysis: ErrorAnalysis;
  annotatedExamples: FineTuningData[];
}

// types.ts (ajoute en bas)
export interface LabelMetrics {
  label: string;
  support: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface MetricsSummary {
  accuracy: number;
  correct: number;
  total: number;
  avgProcessingTime?: number;
  avgConfidence?: number;
  kappa?: number; // si tu l’as déjà calculée côté MetricsPanel
  perLabel: LabelMetrics[];
  confusion: Record<string, Record<string, number>>; // predicted -> gold -> count
}
