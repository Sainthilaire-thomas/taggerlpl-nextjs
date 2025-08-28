export interface AlgorithmResult {
  input: string;
  predicted: string;
  goldStandard: string;
  confidence: number;
  correct: boolean;
  callId: string;
  speaker: string;
  startTime: number;
  endTime: number;
  turnId: number;
}

export interface ValidationMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
  totalSamples: number;
  correctPredictions: number;
  kappa: number;
}

export interface AlgorithmConfig {
  name: string;
  description: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface TechnicalValidationState {
  selectedAlgorithm: string;
  sampleSize: number;
  selectedOrigin: string | null;
  isRunning: boolean;
  results: AlgorithmResult[];
  metrics: ValidationMetrics | null;
  errors: string[];
  progress: number;
}
