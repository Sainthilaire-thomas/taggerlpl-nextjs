import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from "../shared/BaseClassifier";

export class OpenAIClassifier extends BaseClassifier {
  private apiKey: string;
  private model: string;
  private systemPrompt: string;

  constructor(config: {
    apiKey: string;
    model?: string;
    systemPrompt?: string;
  }) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4o-mini";
    this.systemPrompt = config.systemPrompt || this.getDefaultPrompt();
  }

  private getDefaultPrompt(): string {
    return `Tu es un expert en analyse conversationnelle. Classifie les verbatims de conseillers selon ces catégories :

ENGAGEMENT: Actions concrètes du conseiller (je vais, je fais, je vérifie...)
OUVERTURE: Actions demandées au client (vous allez, vous devez, veuillez...)  
REFLET: Reformulation/validation (je comprends, vous avez, d'accord...)
EXPLICATION: Justifications sans action (parce que, notre politique...)
AUTRE: Ne correspond à aucune catégorie

Réponds uniquement avec la catégorie, sans explication.`;
  }

  async classify(verbatim: string): Promise<ClassificationResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: "system", content: this.systemPrompt },
              { role: "user", content: `Classifie: "${verbatim}"` },
            ],
            temperature: 0,
            max_tokens: 10,
          }),
        }
      );

      const result = await response.json();
      const prediction = result.choices[0]?.message?.content?.trim() || "AUTRE";

      return {
        prediction: this.normalizeLabel(prediction),
        confidence: 0.85, // GPT ne donne pas de score de confiance direct
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.model,
          method: "openai-gpt",
          usage: result.usage,
        },
      };
    } catch (error) {
      return {
        prediction: "ERREUR",
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: { error: error.message },
      };
    }
  }

  private normalizeLabel(label: string): string {
    const normalized = label.toUpperCase();
    const validLabels = [
      "ENGAGEMENT",
      "OUVERTURE",
      "REFLET",
      "EXPLICATION",
      "AUTRE",
    ];
    return validLabels.includes(normalized) ? normalized : "AUTRE";
  }

  getMetadata(): ClassifierMetadata {
    return {
      name: "OpenAI GPT Classifier",
      version: "1.0.0",
      type: "llm",
      description: "Classification via GPT avec prompt engineering",
      configSchema: {
        apiKey: { type: "string", required: true },
        model: { type: "string", default: "gpt-4o-mini" },
        systemPrompt: { type: "string", default: this.getDefaultPrompt() },
      },
      requiresTraining: false,
      requiresAPIKey: true,
      supportsBatch: false,
    };
  }

  validateConfig(): boolean {
    return Boolean(this.apiKey) && Boolean(this.model);
  }
}
