import type {} from "./ThesisVariables";

declare module "./ThesisVariables" {
  export type XTag =
    | "ENGAGEMENT"
    | "OUVERTURE"
    | "REFLET_VOUS"
    | "REFLET_JE"
    | "REFLET_ACQ"
    | "EXPLICATION";

  interface XDetails {
    label: XTag;
    confidence: number; // 0..1
    family: "ENGAGEMENT" | "OUVERTURE" | "REFLET" | "EXPLICATION";
    matchedPatterns?: string[];
    rationale?: string;
    probabilities?: Partial<Record<XTag, number>>;
    spans?: Array<{
      start: number;
      end: number;
      text: string;
      role: "trigger" | "context";
    }>;
  }

  interface ThesisDataPoint {
    X_gold?: XTag;
    X_pred?: XTag;
    X_confidence?: number;
  }
}
