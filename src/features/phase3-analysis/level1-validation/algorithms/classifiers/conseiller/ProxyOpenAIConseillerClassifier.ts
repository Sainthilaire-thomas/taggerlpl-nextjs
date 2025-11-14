import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from "../../shared/BaseClassifier";

const ALLOWED = [
  "ENGAGEMENT",
  "OUVERTURE",
  "REFLET_VOUS",
  "REFLET_JE",
  "REFLET_ACQ",
  "EXPLICATION",
  "AUTRE",
] as const;

export class ProxyOpenAIConseillerClassifier extends BaseClassifier {
  getMetadata(): ClassifierMetadata {
    return {
      name: "OpenAI Conseiller Classifier (proxy)",
      version: "1.0.0",
      type: "llm",
      description: "Proxy client → route serveur /api/algolab/classify",
      supportsBatch: true,
      requiresAPIKey: true,
      categories: [...ALLOWED],
      targetDomain: "conseiller",
    };
  }

  validateConfig(): boolean {
    return true;
  } // côté client, rien à valider

  async classify(verbatim: string): Promise<ClassificationResult> {
    const start = Date.now();
    try {
      const r = await fetch("/api/algolab/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verbatim }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Route error");
      return { ...j.result, processingTime: Date.now() - start };
    } catch (e: any) {
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - start,
        metadata: { error: e?.message || "Network error", usedProxy: true },
      };
    }
  }

  async batchClassify(verbatims: string[]): Promise<ClassificationResult[]> {
    try {
      const r = await fetch("/api/algolab/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verbatims }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Route error");
      return j.results as ClassificationResult[];
    } catch (e: any) {
      return verbatims.map(() => ({
        prediction: "AUTRE",
        confidence: 0,
        metadata: { error: e?.message || "Network error", usedProxy: true },
      }));
    }
  }
}
