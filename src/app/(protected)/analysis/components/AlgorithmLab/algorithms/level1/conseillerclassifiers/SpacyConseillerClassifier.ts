// algorithms/level1/conseillerclassifiers/SpacyConseillerClassifier.ts

import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from "../shared/BaseClassifier";

export interface SpacyClassifierConfig {
  apiUrl?: string;
  model?: string;
  timeout?: number;
  retryAttempts?: number;
  confidenceThreshold?: number;
}

export class SpacyConseillerClassifier implements BaseClassifier {
  private apiUrl: string;
  private model: string;
  private timeout: number;
  private retryAttempts: number;
  private confidenceThreshold: number;

  constructor(config: SpacyClassifierConfig = {}) {
    this.apiUrl = config.apiUrl || "http://localhost:8000/classify";
    this.model = config.model || "fr_core_news_md";
    this.timeout = config.timeout || 5000;
    this.retryAttempts = config.retryAttempts || 3;
    this.confidenceThreshold = config.confidenceThreshold || 0.5;
  }

  async classify(verbatim: string): Promise<ClassificationResult> {
    const startTime = Date.now();

    if (!verbatim || verbatim.trim().length === 0) {
      return {
        prediction: "INDETERMINE",
        confidence: 0.0,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.model,
          method: "spacy-ml",
          error: "Verbatim vide",
        },
      };
    }

    try {
      const result = await this.makeAPICall(verbatim);

      return {
        prediction: this.normalizePrediction(result.prediction),
        confidence: result.confidence || 0.0,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.model,
          method: "spacy-ml",
          raw_prediction: result.prediction,
          features_used: result.features,
          tokens_analyzed: result.tokens_count,
        },
      };
    } catch (error) {
      console.error("Erreur SpacyConseillerClassifier:", error);

      return {
        prediction: "INDETERMINE",
        confidence: 0.0,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.model,
          method: "spacy-ml",
          error: error instanceof Error ? error.message : "Erreur inconnue",
          fallback: true,
        },
      };
    }
  }

  private async makeAPICall(
    verbatim: string,
    attempt: number = 1
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text: verbatim.trim(),
          model: this.model,
          return_features: true,
          confidence_threshold: this.confidenceThreshold,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Timeout après ${this.timeout}ms`);
      }

      if (attempt < this.retryAttempts) {
        console.warn(`Tentative ${attempt} échouée, retry...`);
        await this.delay(1000 * attempt);
        return this.makeAPICall(verbatim, attempt + 1);
      }

      throw error;
    }
  }

  private normalizePrediction(prediction: string): string {
    const mapping: Record<string, string> = {
      engagement: "A_ENGAGEMENT",
      explication: "A_DESCRIPTION",
      description: "A_DESCRIPTION",
      ouverture: "A_OUVERTURE",
      reflet: "A_REFLET",
      reflet_acq: "A_REFLET_ACQ",
      reflet_je: "A_REFLET_JE",
      reflet_vous: "A_REFLET_VOUS",
      silence: "A_SILENCE",
    };

    const normalized = prediction.toLowerCase().trim();
    return mapping[normalized] || prediction.toUpperCase();
  }

  async batchClassify(verbatims: string[]): Promise<ClassificationResult[]> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2);

      const response = await fetch(`${this.apiUrl}/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          texts: verbatims.filter((v) => v && v.trim().length > 0),
          model: this.model,
          return_features: true,
          confidence_threshold: this.confidenceThreshold,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Batch API Error: ${response.status}`);
      }

      const results = await response.json();

      return results.predictions.map((result: any, index: number) => ({
        prediction: this.normalizePrediction(result.prediction),
        confidence: result.confidence || 0.0,
        processingTime: (Date.now() - startTime) / verbatims.length,
        metadata: {
          model: this.model,
          method: "spacy-ml-batch",
          batch_index: index,
          features_used: result.features,
          tokens_analyzed: result.tokens_count,
        },
      }));
    } catch (error) {
      console.warn("Batch processing failed, falling back to individual calls");
      return Promise.all(verbatims.map((v) => this.classify(v)));
    }
  }

  getMetadata(): ClassifierMetadata {
    return {
      name: "spaCy Conseiller Classifier",
      version: "1.0.0",
      type: "ml",
      description:
        "Classification ML avec modèles spaCy français et features linguistiques avancées",
      configSchema: {
        apiUrl: {
          type: "string",
          default: "http://localhost:8000/classify",
          description: "URL de l'API spaCy locale",
        },
        model: {
          type: "string",
          default: "fr_core_news_md",
          options: ["fr_core_news_sm", "fr_core_news_md", "fr_core_news_lg"],
        },
        timeout: {
          type: "number",
          default: 5000,
          min: 1000,
          max: 30000,
          description: "Timeout en millisecondes",
        },
        confidenceThreshold: {
          type: "number",
          default: 0.5,
          min: 0.0,
          max: 1.0,
          description: "Seuil de confiance minimum",
        },
      },
      requiresTraining: true,
      requiresAPIKey: false,
      supportsBatch: true,
      categories: [
        "A_ENGAGEMENT",
        "A_DESCRIPTION",
        "A_OUVERTURE",
        "A_REFLET",
        "A_REFLET_ACQ",
        "A_REFLET_JE",
        "A_REFLET_VOUS",
        "A_SILENCE",
      ],
      targetDomain: "centre-contact-conseiller",
      features: [
        "Part-of-speech tagging",
        "Named Entity Recognition",
        "Dependency parsing",
        "Lemmatisation",
        "Features syntaxiques avancées",
      ],
    };
  }

  validateConfig(): boolean {
    try {
      new URL(this.apiUrl);
      return (
        typeof this.apiUrl === "string" &&
        typeof this.model === "string" &&
        this.timeout > 0 &&
        this.retryAttempts >= 1 &&
        this.confidenceThreshold >= 0 &&
        this.confidenceThreshold <= 1
      );
    } catch {
      return false;
    }
  }

  // Méthode utilitaire pour les tests de connexion
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `Connexion réussie (${latency}ms)`,
          latency,
        };
      } else {
        return {
          success: false,
          message: `Erreur serveur: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Connexion impossible",
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
