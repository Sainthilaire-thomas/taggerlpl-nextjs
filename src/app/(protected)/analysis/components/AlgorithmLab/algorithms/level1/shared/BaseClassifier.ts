// algorithms/level1/shared/BaseClassifier.ts
export interface ClassificationResult {
  prediction: string;
  confidence: number;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  latency?: number;
  tagsInfo?: string;
}

export interface ClassifierMetadata {
  name: string;
  version: string;
  type: "rule-based" | "ml" | "llm";
  description: string;
  supportsBatch?: boolean;
  requiresTraining?: boolean;
  requiresAPIKey?: boolean;
  categories?: string[];
  configSchema?: Record<string, any>;
  targetDomain?: string;
}

export abstract class BaseClassifier {
  abstract classify(verbatim: string): Promise<ClassificationResult>;
  abstract getMetadata(): ClassifierMetadata;
  abstract validateConfig(): boolean;

  // Méthodes optionnelles pour la configuration
  updateConfig?(config: any): void;
  getConfig?(): any;

  // Méthode optionnelle pour les tests de batch
  async batchClassify?(verbatims: string[]): Promise<ClassificationResult[]>;

  // Méthode optionnelle pour les tests de connexion - signature harmonisée
  async testConnection?(): Promise<boolean | TestConnectionResult>;
}
