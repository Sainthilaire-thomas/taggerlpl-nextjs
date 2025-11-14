// Étend les types existants sans les modifier
import type {} from "./ThesisVariables";

declare module "./ThesisVariables" {
  // Remplit l'interface "slot" déclarée dans le socle
  interface M1Details {
    score: number; // [0-1]
    verbCount: number;
    totalWords: number;
    density: number; // verbCount / totalWords
    detectedVerbs: Array<{
      verb: string;
      position: number;
      confidence: number;
      lemma: string;
    }>;
    verbCategories?: {
      institutional: number;
      cognitive: number;
      communicative: number;
    };
  }

  // On précise aussi, si utile, la forme de M1_score
  interface ThesisDataPoint {
    M1_score?: number; // déjà présent, ici pour contexte
  }
}
