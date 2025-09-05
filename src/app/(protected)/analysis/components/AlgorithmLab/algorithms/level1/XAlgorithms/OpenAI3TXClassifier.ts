import type { BaseAlgorithm, AlgorithmMetadata } from "../shared/BaseAlgorithm";
import { OpenAI3TConseillerClassifier } from "../conseillerclassifiers/OpenAI3TConseillerClassifier";

type OpenAI3TConfig = {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableFallback?: boolean;
  strictPromptMode?: boolean;
};

export class OpenAI3TXClassifier implements BaseAlgorithm<string, any> {
  private legacy: OpenAI3TConseillerClassifier;

  // 👉 Ajoute ici ta config interne
  private currentConfig = {
    model: "gpt-4o-mini",
    temperature: 0,
    maxTokens: 6,
    timeout: 10000,
    enableFallback: true,
    strictPromptMode: true,
  };

  constructor(config: Partial<typeof this.currentConfig> = {}) {
    this.currentConfig = { ...this.currentConfig, ...config };
    this.legacy = new OpenAI3TConseillerClassifier({
      ...this.currentConfig,
      apiKey: process.env.OPENAI_API_KEY, // ⚠️ toujours serveur
    });
  }

  // 👉 nouveaux getters/setters utilisés par la route PUT
  getConfig() {
    return { ...this.currentConfig };
  }

  updateConfig(next: Partial<typeof this.currentConfig>) {
    this.currentConfig = { ...this.currentConfig, ...next };
    if (typeof (this.legacy as any).updateConfig === "function") {
      (this.legacy as any).updateConfig(this.currentConfig);
    }
  }

  validateConfig(): boolean {
    const ok = !!process.env.OPENAI_API_KEY;
    return typeof this.legacy.validateConfig === "function"
      ? ok && !!this.legacy.validateConfig()
      : ok;
  }

  describe(): AlgorithmMetadata {
    const meta = this.legacy.getMetadata?.();
    return {
      name: "OpenAI3TXClassifier",
      displayName: "OpenAI — X (3 tours)",
      version: meta?.version ?? "1.0.0",
      type: "llm", // ← forcé pour la détection
      target: "X", // ← forcé pour les filtres UI
      description: "Classification X à 3 tours via OpenAI",
      batchSupported: meta?.supportsBatch ?? true,
      apiRequirements: ["OPENAI_API_KEY"],
      // runLocation: "server", // (optionnel) si tu veux l’indiquer
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

  async testConnection(): Promise<boolean> {
    if (typeof (this.legacy as any).testConnection === "function") {
      return (this.legacy as any).testConnection();
    }
    return false;
  }
}
