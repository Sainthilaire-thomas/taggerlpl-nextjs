export interface TVValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: Record<string, any>;
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
