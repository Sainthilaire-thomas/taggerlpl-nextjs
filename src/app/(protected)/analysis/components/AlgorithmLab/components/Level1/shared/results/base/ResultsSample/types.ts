// Étendre TVValidationResult.metadata
export interface TVTopProb {
  label: string;
  prob: number;
}
export interface TVMMetric {
  value?: number;
  actionVerbCount?: number;
  totalTokens?: number;
  verbsFound?: string[];
}
export interface TVDetails {
  family?: string;
}

export interface TVMetadata {
  // identifiants tour
  turnId?: number | string;
  id?: number | string;

  // contexte
  prev2_turn_verbatim?: string;
  prev1_turn_verbatim?: string;
  next_turn_verbatim?: string;
  prev2_speaker?: string;
  prev1_speaker?: string;

  // infos algo/LLM
  classifier?: string;
  type?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;

  // trace / erreur LLM
  rawResponse?: string;
  error?: string;

  // Variables X / Y
  x_details?: TVDetails;
  y_details?: TVDetails;
  x_evidences?: string[];
  y_evidences?: string[];
  x_topProbs?: TVTopProb[];
  y_topProbs?: TVTopProb[];
  evidences?: string[];
  rationales?: string[];

  // M1 / M2 / M3

  m1?: {
    value?: number; // densité calculée
    actionVerbCount?: number;
    totalTokens?: number;
    verbsFound?: string[];
  };

  m2?: {
    value?: string | number; // ex: catégorie ou score
    scale?: string; // ex: Likert, ouverture/fermeture
  };

  m3?: {
    value?: number; // durée, pauses, etc.
    unit?: "ms" | "s";
  };
}

export interface TVValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: TVMetadata; // << ici (au lieu de Record<string, any>)
}

export interface FineTuningData {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  metadata: {
    turnId: number;
    verbatim: string;
    context: any;
    predicted: string;
    goldStandard: string;
    confidence: number;
    annotations: string[];
    algo: any;
  };
}

export interface ResultsSampleProps {
  results: TVValidationResult[];
  limit?: number;
  initialPageSize?: number;
}

export interface ContextData {
  prev2?: string;
  prev1?: string;
  current: string;
  next1?: string;
}

export type Tone = "A" | "B" | "CURRENT";
