import type {} from "./ThesisVariables";

declare module "./ThesisVariables" {
  interface M3Details {
    score: number; // [0-1] charge cognitive
    pauseCount?: number;
    hesitationCount?: number; // "euh", "hum", etc.
    longPauseMs?: number; // cumul > seuil
    speechRate?: number; // mots/sec si dispo
    markers?: string[]; // indices trouvés
  }
}
