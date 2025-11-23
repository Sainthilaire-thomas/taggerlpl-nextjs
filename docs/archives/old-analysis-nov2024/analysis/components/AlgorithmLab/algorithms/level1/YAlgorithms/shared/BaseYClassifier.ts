import type { BaseAlgorithm } from "../../shared/BaseAlgorithm";
import type { VariableY } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export interface YClassification {
  prediction: VariableY | "ERREUR";
  confidence?: number;
  processingTimeMs?: number;
  metadata?: Record<string, any>;
}

export type YClassifier = BaseAlgorithm<string, YClassification>;
