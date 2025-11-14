// src/app/(protected)/analysis/components/AlgorithmLab/types/core/level0.ts

export interface InterAnnotatorData {
  annotators: string[];
  items: Array<{
    id: string;
    labels: Record<string, string>; // annotator -> label
  }>;
}

export interface KappaMetrics {
  kappa: number; // -1..1
  observedAgreement: number; // 0..1
  expectedAgreement: number; // 0..1
  interpretation?:
    | "poor"
    | "slight"
    | "fair"
    | "moderate"
    | "substantial"
    | "almost perfect";
}

export interface DisagreementCase {
  itemId: string;
  labels: Record<string, string>; // annotator -> label
  notes?: string;
}
