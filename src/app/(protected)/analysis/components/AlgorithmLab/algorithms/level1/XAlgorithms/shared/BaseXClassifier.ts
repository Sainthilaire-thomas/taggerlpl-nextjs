import type { BaseAlgorithm } from "../../shared/BaseAlgorithm";
import type { VariableX } from "../../../../types/ThesisVariables";

export interface XClassification {
  prediction: VariableX | "ERREUR";
  confidence?: number; // 0–1
  processingTimeMs?: number;
  metadata?: Record<string, any>;
}

export type XClassifier = BaseAlgorithm<string, XClassification>;
