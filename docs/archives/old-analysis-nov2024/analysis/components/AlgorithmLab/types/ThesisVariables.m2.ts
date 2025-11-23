import type {} from "./ThesisVariables";

declare module "./ThesisVariables" {
  interface M2Details {
    score: number; // [0-1], ex. similarité/alignement
    tokenOverlap?: number; // Jaccard lexical simple
    semanticSimilarity?: number; // cosine embeddings si dispo plus tard
    prosodicDivergence?: number; // placeholder si features prosodie
    alignedTokens?: Array<{ token: string; inA: boolean; inB: boolean }>;
  }
}
