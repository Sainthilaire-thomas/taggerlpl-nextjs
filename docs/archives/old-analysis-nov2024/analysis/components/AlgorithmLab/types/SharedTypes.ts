// Types partagés - SharedTypes.ts
export interface ValidationLevel {
  id: number;
  name: string;
  description: string;
  status: "pending" | "in-progress" | "validated" | "failed";
  progress: number;
  prerequisites: number[];
}

export interface ValidationMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: number[][];
}

export interface ExportConfig {
  format: "json" | "csv" | "latex" | "word";
  sections: string[];
  includeGraphics: boolean;
}
