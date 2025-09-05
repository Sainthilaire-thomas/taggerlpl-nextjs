// Types génériques pour les calculateurs, réutilisables avec tes "slots" ThesisVariables.*
export interface CalculationResult<TDetails> {
  score: number; // 0..1 normalisé (ou autre si besoin)
  details: TDetails; // fortement typé via module augmentation (M1Details, etc.)
  markers?: string[]; // pour affichages rapides si utile
  metadata?: Record<string, any>;
}

// Entrées standardisées par variable
export interface M1Input {
  verbatim: string;
  id?: string | number;
}
export interface M2Input {
  turnA: string;
  turnB: string;
  idA?: string | number;
  idB?: string | number;
}
export interface M3Input {
  clientTurn: string;
  id?: string | number;
}

export interface CalculatorMetadata {
  name: string;
  version?: string;
  description?: string;
  type: "rule-based" | "ml" | "llm" | "hybrid";
}

// types/level1/m2.ts
export interface M2Input {
  turnVerbatim: string; // T0 – tour conseiller
  nextTurnVerbatim: string; // T+1 – réaction client
  context?: {
    prevTurn?: string;
    speaker?: string; // locuteur T0
    nextSpeaker?: string; // locuteur T+1
  };
  metadata?: {
    turnId?: number;
    callId?: string;
    timestamp?: number;
  };
}

export type M2AlignmentType = "aligné" | "partiellement_aligné" | "non_aligné";

export interface M2Details {
  alignmentType: M2AlignmentType;
  lexicalScore: number; // [0..1]
  semanticScore?: number; // [0..1]
  sharedTokens?: string[];
  patterns?: string[];
  justification: string;
  confidence: number; // [0..1]
  processingTime?: number; // ms
}

export interface TVMetadataM2 {
  value?: M2AlignmentType; // pour ResultsPanel
  scale?: "nominal" | "ordinal";
  details?: M2Details;
}
