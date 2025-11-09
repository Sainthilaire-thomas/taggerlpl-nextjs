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

export interface CalculationMetadata {
  version?: string;
  description?: string;
  type: "rule-based" | "ml" | "llm" | "hybrid";
  id?: string;
  name?: string;
  displayName?: string;
  target?: "M2";
  batchSupported?: boolean;
  supportsBatch?: boolean;
}

export interface AlgorithmResult {
  callId: string;
  startTime: number;
  endTime: number;
  input: string;
  speaker: string;
  confidence: number;
  goldStandard: string;
  predicted: string;
  processingTime: number;
  correct: boolean;
  metadata?: Record<string, unknown>;
}

export interface EnhancedAlgorithmResult extends AlgorithmResult {
  enhanced?: boolean;
  analysisDepth?: "basic" | "detailed" | "comprehensive";
  errorPattern?: string;
  suggestions?: string[];
}
// Types pour ValidationMetrics (pour TechnicalBenchmark)
export interface ValidationMetrics {
  accuracy: number;
  kappa: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  correctPredictions: number;
  totalSamples: number;
  confusionMatrix?: Record<string, Record<string, number>>;
}

// Types pour les algorithmes (pour M2ValidationInterface)
export interface AlgorithmDescriptor {
  displayName: string;
  description: string;
  version?: string;
}

export interface AlgorithmMetrics {
  differential: number;
  avgMs: number;
  accuracy: number;
}

export interface AvailableAlgorithm {
  id: string;
  desc?: AlgorithmDescriptor;
  metrics?: AlgorithmMetrics;
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
