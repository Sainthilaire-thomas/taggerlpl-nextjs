import type { BaseAlgorithm, AlgorithmMetadata } from "../shared/BaseAlgorithm";
import { OpenAIConseillerClassifier } from "../conseillerclassifiers/OpenAIConseillerClassifier";

type OpenAIConfig = {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableFallback?: boolean;
};

export class OpenAIXClassifier implements BaseAlgorithm<string, any> {
  private legacy: OpenAIConseillerClassifier;

  constructor(config: OpenAIConfig = {}) {
    this.legacy = new OpenAIConseillerClassifier({
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
      model: config.model ?? "gpt-4o-mini",
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens ?? 50,
      timeout: config.timeout ?? 10000,
      enableFallback: config.enableFallback ?? true,
    });
  }

  describe(): AlgorithmMetadata {
    const meta = this.legacy.getMetadata?.();
    return {
      name: "OpenAIXClassifier",
      displayName: "OpenAI – X (1 tour)",
      type: (meta?.type as any) ?? "llm",
      target: "X",
      version: meta?.version ?? "1.0.0",
      description:
        meta?.description ?? "Wrapper legacy OpenAIConseillerClassifier",
      batchSupported: !!meta?.supportsBatch,
      apiRequirements: ["OPENAI_API_KEY"],
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
      : !!process.env.OPENAI_API_KEY;
  }

  async testConnection(): Promise<boolean> {
    if (typeof (this.legacy as any).testConnection === "function") {
      return (this.legacy as any).testConnection();
    }
    return false;
  }
}
