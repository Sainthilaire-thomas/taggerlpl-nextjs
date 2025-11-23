import type {} from "./ThesisVariables";

declare module "./ThesisVariables" {
  export type YTag = "CLIENT_POSITIF" | "CLIENT_NEGATIF" | "CLIENT_NEUTRE";

  interface YDetails {
    label: YTag;
    confidence: number; // 0..1
    cues?: string[];
    sentimentProxy?: number; // -1..1
    spans?: Array<{
      start: number;
      end: number;
      text: string;
      type: "polarity" | "hedge";
    }>;
  }

  interface ThesisDataPoint {
    Y_gold?: YTag;
    Y_pred?: YTag;
    Y_confidence?: number;
    next_turn_verbatim?: string;
  }
}
