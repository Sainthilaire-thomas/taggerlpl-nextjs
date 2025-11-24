// algorithms/level1/conseillerclassifiers/SpacyConseillerClassifier.ts

import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from '../shared/BaseClassifier';

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

  // ✨ TAGS EN DUR - Version simplifiée
  private readonly CONSEILLER_TAGS = [
    "OUVERTURE",
    "ENGAGEMENT",
    "EXPLICATION",
    "REFLET",
    "REFLET_JE",
    "REFLET_VOUS",
    "REFLET_ACQ",
  ];

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
          availableCategories: this.CONSEILLER_TAGS,
        },
      };
    }

    try {
      const result = await this.makeAPICall(verbatim);

      // ✨ Utilisation des tags en dur avec mapping intelligent
      const normalizedPrediction = this.findBestMatchingTag(result.prediction);

      return {
        prediction: normalizedPrediction,
        confidence: result.confidence || 0.0,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.model,
          method: "spacy-ml",
          raw_prediction: result.prediction,
          matched_tag: normalizedPrediction,
          available_tags: this.CONSEILLER_TAGS.length,
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
          availableCategories: this.CONSEILLER_TAGS,
        },
      };
    }
  }

  // ✨ MATCHING INTELLIGENT avec les tags en dur
  private findBestMatchingTag(prediction: string): string {
    if (!prediction) {
      return "INDETERMINE";
    }

    const normalizedPrediction = prediction.toLowerCase().trim();

    // 1. Correspondance exacte (insensible à la casse)
    const exactMatch = this.CONSEILLER_TAGS.find(
      (tag) => tag.toLowerCase() === normalizedPrediction
    );
    if (exactMatch) return exactMatch;

    // 2. Mapping sémantique intelligent
    const semanticMapping: Record<string, string> = {
      // ENGAGEMENT
      engagement: "ENGAGEMENT",
      action: "ENGAGEMENT",
      je_vais: "ENGAGEMENT",
      on_va: "ENGAGEMENT",

      // OUVERTURE
      ouverture: "OUVERTURE",
      accueil: "OUVERTURE",
      bonjour: "OUVERTURE",
      politesse: "OUVERTURE",

      // EXPLICATION
      explication: "EXPLICATION",
      description: "EXPLICATION",
      parce_que: "EXPLICATION",
      technique: "EXPLICATION",

      // REFLET (générique)
      reflet: "REFLET",
      reformulation: "REFLET",
      paraphrase: "REFLET",

      // REFLET spécifiques
      reflet_je: "REFLET_JE",
      je_comprends: "REFLET_JE",
      reflet_vous: "REFLET_VOUS",
      vous_dites: "REFLET_VOUS",
      reflet_acq: "REFLET_ACQ",
      acquiescement: "REFLET_ACQ",
      oui: "REFLET_ACQ",
    };

    // Correspondance directe dans le mapping
    if (semanticMapping[normalizedPrediction]) {
      return semanticMapping[normalizedPrediction];
    }

    // 3. Correspondance par mots-clés
    for (const [keyword, tag] of Object.entries(semanticMapping)) {
      if (
        normalizedPrediction.includes(keyword.replace("_", " ")) ||
        normalizedPrediction.includes(keyword)
      ) {
        return tag;
      }
    }

    // 4. Correspondance par famille de mots
    if (normalizedPrediction.includes("reflet")) {
      if (normalizedPrediction.includes("je")) return "REFLET_JE";
      if (normalizedPrediction.includes("vous")) return "REFLET_VOUS";
      if (
        normalizedPrediction.includes("acq") ||
        normalizedPrediction.includes("oui")
      )
        return "REFLET_ACQ";
      return "REFLET"; // REFLET générique
    }

    // 5. Correspondance partielle dans les tags existants
    const partialMatch = this.CONSEILLER_TAGS.find(
      (tag) =>
        tag.toLowerCase().includes(normalizedPrediction) ||
        normalizedPrediction.includes(tag.toLowerCase().split("_")[0])
    );
    if (partialMatch) return partialMatch;

    // 6. Fallback vers tag par défaut selon contexte
    if (
      normalizedPrediction.includes("action") ||
      normalizedPrediction.includes("faire")
    ) {
      return "ENGAGEMENT";
    }
    if (
      normalizedPrediction.includes("dire") ||
      normalizedPrediction.includes("expliqu")
    ) {
      return "EXPLICATION";
    }
    if (
      normalizedPrediction.includes("bonjour") ||
      normalizedPrediction.includes("merci")
    ) {
      return "OUVERTURE";
    }

    // 7. Dernier fallback
    return "INDETERMINE";
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
          // ✨ Passer les catégories disponibles à l'API spaCy
          available_categories: this.CONSEILLER_TAGS,
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
          available_categories: this.CONSEILLER_TAGS,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Batch API Error: ${response.status}`);
      }

      const results = await response.json();

      return results.predictions.map((result: any, index: number) => ({
        prediction: this.findBestMatchingTag(result.prediction),
        confidence: result.confidence || 0.0,
        processingTime: (Date.now() - startTime) / verbatims.length,
        metadata: {
          model: this.model,
          method: "spacy-ml-batch",
          batch_index: index,
          raw_prediction: result.prediction,
          matched_tag: this.findBestMatchingTag(result.prediction),
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
      version: "2.1.0",
      type: "ml",
      description: `Classification ML avec modèles spaCy français pour ${this.CONSEILLER_TAGS.length} tags conseiller`,
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
      // ✨ Categories en dur
      categories: this.CONSEILLER_TAGS,
      targetDomain: "centre-contact-conseiller",
      features: [
        "Part-of-speech tagging",
        "Named Entity Recognition",
        "Dependency parsing",
        "Lemmatisation",
        "Features syntaxiques avancées",
        "Tags conseiller TaggerLPL (7 catégories)",
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

  // ✨ Méthodes utilitaires
  getAvailableTags(): string[] {
    return [...this.CONSEILLER_TAGS];
  }

  getTagsStatistics(): {
    totalTags: number;
    tagsByCategory: Record<string, string[]>;
    categoriesSupported: string[];
  } {
    return {
      totalTags: this.CONSEILLER_TAGS.length,
      tagsByCategory: {
        OUVERTURE: ["OUVERTURE"],
        ENGAGEMENT: ["ENGAGEMENT"],
        EXPLICATION: ["EXPLICATION"],
        REFLET: ["REFLET", "REFLET_JE", "REFLET_VOUS", "REFLET_ACQ"],
      },
      categoriesSupported: ["OUVERTURE", "ENGAGEMENT", "EXPLICATION", "REFLET"],
    };
  }

  async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
    tagsInfo?: string;
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
          tagsInfo: `${this.CONSEILLER_TAGS.length} tags conseiller configurés`,
        };
      } else {
        return {
          success: false,
          message: `Erreur serveur: ${response.status}`,
          tagsInfo: `${this.CONSEILLER_TAGS.length} tags disponibles`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Connexion impossible",
        tagsInfo: `${this.CONSEILLER_TAGS.length} tags configurés en dur`,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
