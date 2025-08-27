// algorithms/level1/shared/BaseClassifier.ts
export interface ClassificationResult {
  prediction: string;
  confidence: number;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface ClassifierMetadata {
  name: string;
  version: string;
  type: "rule-based" | "ml" | "llm" | "ensemble";
  description: string;
  configSchema: Record<string, any>;
  requiresTraining: boolean;
  requiresAPIKey: boolean;
  supportsBatch: boolean;
  categories?: string[];
  targetDomain?: string;
}

export abstract class BaseClassifier {
  abstract classify(verbatim: string): Promise<ClassificationResult>;
  abstract getMetadata(): ClassifierMetadata;
  abstract validateConfig(): boolean;

  async batchClassify?(verbatims: string[]): Promise<ClassificationResult[]> {
    return Promise.all(verbatims.map((v) => this.classify(v)));
  }
}
