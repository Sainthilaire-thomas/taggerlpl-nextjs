import type { BaseAlgorithm, AlgorithmMetadata } from "../shared/BaseAlgorithm";
import { SpacyConseillerClassifier } from "../conseillerclassifiers/SpacyConseillerClassifier";

type SpacyXConfig = {
  apiUrl?: string;
  model?: string;
  timeout?: number;
  confidenceThreshold?: number;
};

export class SpacyXClassifier implements BaseAlgorithm<string, any> {
  private legacy: SpacyConseillerClassifier;

  constructor(config: SpacyXConfig = {}) {
    this.legacy = new SpacyConseillerClassifier({
      apiUrl:
        config.apiUrl ??
        process.env.SPACY_API_URL ??
        "http://localhost:8000/classify",
      model: config.model ?? "fr_core_news_md",
      timeout: config.timeout ?? 5000,
      confidenceThreshold: config.confidenceThreshold ?? 0.6,
    });
  }

  describe(): AlgorithmMetadata {
    const meta = this.legacy.getMetadata?.();
    return {
      name: "SpacyXClassifier",
      displayName: "spaCy – X (conseiller)",
      type: (meta?.type as any) ?? "ml",
      target: "X",
      version: meta?.version ?? "1.0.0",
      description:
        meta?.description ?? "Wrapper legacy SpacyConseillerClassifier",
      batchSupported: !!meta?.supportsBatch,
      apiRequirements: ["SPACY_API_URL"],
    };
  }

  async run(input: string) {
    return this.legacy.classify(input);
  }

  async runBatch(inputs: string[]) {
    if (typeof this.legacy.batchClassify === "function") {
      return this.legacy.batchClassify(inputs);
    }
    return Promise.all(inputs.map((v) => this.legacy.classify(v)));
  }

  validateConfig(): boolean {
    return typeof this.legacy.validateConfig === "function"
      ? !!this.legacy.validateConfig()
      : true;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (typeof (this.legacy as any).testConnection === "function") {
      return (this.legacy as any).testConnection();
    }
    return { success: false, message: "No testConnection() on legacy" };
  }
}
