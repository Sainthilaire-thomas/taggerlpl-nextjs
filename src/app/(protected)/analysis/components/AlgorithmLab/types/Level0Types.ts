// Types Niveau 0 - Level0Types.ts
export interface InterAnnotatorData {
  id: string;
  verbatim: string;
  expert1: string;
  expert2: string;
  agreed: boolean;
  callId: string;
  speaker: "conseiller" | "client";
  turnIndex: number;
  context: string;
  annotationTimestamp: Date;
}

export interface KappaMetrics {
  observed: number;
  expected: number;
  kappa: number;
  interpretation:
    | "poor"
    | "slight"
    | "fair"
    | "moderate"
    | "substantial"
    | "almost_perfect";
  confidenceInterval: [number, number];
}

export interface DisagreementCase {
  id: string;
  annotation: InterAnnotatorData;
  confusionType: string;
  discussionNotes: string[];
  resolution: "consensus" | "expert_decision" | "exclude";
  finalTag: string;
}
