import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from "../shared/BaseClassifier";

interface OpenAIConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  enableFallback: boolean;
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULTS: OpenAIConfig = {
  apiKey: undefined,
  model: "gpt-4o-mini",
  temperature: 0, // déterministe
  maxTokens: 6, // on ne veut qu’un label
  timeout: 10_000,
  enableFallback: true,
};

const ALLOWED = [
  "ENGAGEMENT",
  "OUVERTURE",
  "REFLET_VOUS",
  "REFLET_JE",
  "REFLET_ACQ",
  "EXPLICATION",
  "AUTRE",
] as const;

export class OpenAIConseillerClassifier extends BaseClassifier {
  private config: OpenAIConfig;
  private apiKey?: string;

  constructor(config: OpenAIConfig) {
    super();
    this.config = { ...DEFAULTS, ...config };
    this.apiKey = config.apiKey;
  }

  private isServer() {
    return typeof window === "undefined";
  }

  // ---- Métadonnées ---------------------------------------------------------
  getMetadata(): ClassifierMetadata {
    return {
      name: "OpenAI Conseiller Classifier",
      version: "1.3.0",
      type: "llm",
      description:
        "Classification via GPT des verbatims conseiller (priorité action, ignorent [TC]/[AP], anti-AUTRE).",
      configSchema: {
        model: {
          type: "string",
          options: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
          default: "gpt-4o-mini",
          description: "Modèle GPT à utiliser",
        },
        temperature: {
          type: "number",
          min: 0,
          max: 1,
          step: 0.1,
          default: 0,
          description: "Créativité (0 recommandé)",
        },
        maxTokens: {
          type: "number",
          min: 4,
          max: 50,
          step: 2,
          default: 6,
          description: "Budget de tokens pour un label unique",
        },
        timeout: {
          type: "number",
          min: 5000,
          max: 30000,
          step: 1000,
          default: 10000,
          description: "Timeout en millisecondes",
        },
        enableFallback: {
          type: "boolean",
          default: true,
          description: "Activer un fallback en cas d’erreur OpenAI",
        },
      },
      requiresTraining: false,
      requiresAPIKey: true,
      supportsBatch: false,
      categories: [...ALLOWED],
      targetDomain: "conseiller",
    };
  }

  // ---- Validation -----------------------------------------------------------
  validateConfig(): boolean {
    if (!this.apiKey) {
      if (this.isServer()) console.warn("[OpenAI] API key manquante (server)");
      return false;
    }
    const t = this.config.temperature;
    return Boolean(this.config.model) && t >= 0 && t <= 1;
  }

  // ---- Utils ----------------------------------------------------------------
  private sanitize(verbatim: string): string {
    if (!verbatim) return "";
    return verbatim
      .replace(/\[(?:TC|AP)\]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private createMessages(verbatim: string): ChatMessage[] {
    const allowed = [
      "ENGAGEMENT",
      "OUVERTURE",
      "REFLET_VOUS",
      "REFLET_JE",
      "REFLET_ACQ",
      "EXPLICATION",
      "AUTRE",
    ].join(", ");

    const system = `Tu es un classificateur déterministe pour des verbatims de CONSEILLER.
Retourne EXACTEMENT un label parmi: ${allowed}.
N'UTILISE "AUTRE" QUE si le texte est vide ou ne contient aucun indice d'action ou d'explication.

RÈGLE DE PRIORITÉ (strict) :
1) ENGAGEMENT — action du conseiller (je vais/je fais/je m'occupe/je vérifie/je transfère…)
2) OUVERTURE — action demandée/projetée pour le client (vous allez/vous devez/veuillez/merci de/vous recevrez…)
3) REFLET
   • REFLET_VOUS — description des actions/paroles du client (vous avez/vous dites…)
   • REFLET_JE   — état cognitif du conseiller (je comprends/je vois/je note…)
   • REFLET_ACQ  — acquiescement court (d'accord/ok/oui/mmh/tout à fait/effectivement…)
4) EXPLICATION — information procédurale/réglementaire sans action concrète.
5) AUTRE — seulement si rien ne correspond.

Si un tour contient à la fois un acquiescement et une action du conseiller → ENGAGEMENT.
Si un tour contient explication + instruction au client → OUVERTURE.
"C'est normal, vous allez…" → OUVERTURE.
"Je comprends, mais je vais vérifier" → ENGAGEMENT.`;

    const fewShots: ChatMessage[] = [
      { role: "user", content: "d'accord, je vais faire le nécessaire" },
      { role: "assistant", content: "ENGAGEMENT" },
      {
        role: "user",
        content: "vous pouvez aller sur le site parce que c'est plus rapide",
      },
      { role: "assistant", content: "OUVERTURE" },
      {
        role: "user",
        content: "je comprends, mais je vais quand même vérifier",
      },
      { role: "assistant", content: "ENGAGEMENT" },
      { role: "user", content: "vous avez bien fait d'appeler" },
      { role: "assistant", content: "REFLET_VOUS" },
      { role: "user", content: "d'accord" },
      { role: "assistant", content: "REFLET_ACQ" },
      { role: "user", content: "notre système fonctionne en trois étapes" },
      { role: "assistant", content: "EXPLICATION" },
      { role: "user", content: "c'est normal, vous allez être recontacté" },
      { role: "assistant", content: "OUVERTURE" },
      { role: "user", content: "hm hm" },
      { role: "assistant", content: "REFLET_ACQ" },
      { role: "user", content: "oui" },
      { role: "assistant", content: "REFLET_ACQ" },
    ];

    const user: ChatMessage = {
      role: "user",
      content:
        `Verbatim à classifier (réponds UNIQUEMENT par 1 label):\n` +
        `"${verbatim.replace(/\[(?:TC|AP)\]/gi, "").trim()}"`,
    };

    return [{ role: "system", content: system }, ...fewShots, user];
  }

  private normalizeLabel(prediction: string): string {
    const cleaned = prediction.replace(/[^A-Z_]/gi, "").toUpperCase();
    const map: Record<string, string> = {
      ENGAGEMENT: "ENGAGEMENT",
      OUVERTURE: "OUVERTURE",
      REFLET_VOUS: "REFLET_VOUS",
      REFLETVOUS: "REFLET_VOUS",
      REFLET_JE: "REFLET_JE",
      REFLETJE: "REFLET_JE",
      REFLET_ACQ: "REFLET_ACQ",
      REFLETACQ: "REFLET_ACQ",
      REFLET: "REFLET_ACQ",
      EXPLICATION: "EXPLICATION",
      AUTRE: "AUTRE",
      OTHER: "AUTRE",
      UNKNOWN: "AUTRE",
    };
    return map[cleaned] || "AUTRE";
  }

  private async callOpenAI(messages: ChatMessage[]): Promise<OpenAIResponse> {
    if (!this.isServer())
      throw new Error("OpenAIConseillerClassifier est server-only");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

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
            model: this.config.model,
            messages,
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: ["\n"], // coupe après la première ligne
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} - ${
            (errorData as any).error?.message || "Unknown error"
          }`
        );
      }

      return (await response.json()) as OpenAIResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Timeout après ${this.config.timeout}ms`);
      }
      throw err instanceof Error ? err : new Error("Erreur OpenAI inconnue");
    }
  }

  // Heuristique forte (anti-AUTRE) respectant la priorité
  private strongHeuristic(verbatim: string): string | null {
    const t = verbatim.toLowerCase();

    // 1) ENGAGEMENT (priorité max)
    if (
      /\b(je\s+vais|je\s+fais|je\s+m['’]occupe|je\s+m’en\s+occupe|je\s+vérifie|je\s+transfère|je\s+demande|je\s+regarde|je\s+vous\s+envoie|on\s+va)\b/.test(
        t
      )
    ) {
      return "ENGAGEMENT";
    }

    // 2) OUVERTURE
    if (
      /\b(vous\s+allez|vous\s+devrez|vous\s+pourrez|vous\s+recevrez|veuillez|merci\s+de|pouvez[-\s]?vous|pourriez[-\s]?vous)\b/.test(
        t
      )
    ) {
      return "OUVERTURE";
    }

    // 3) REFLET_VOUS
    if (
      /\b(vous\s+avez|vous\s+dites|d['’]après\s+vous|vous\s+m['’]avez)\b/.test(
        t
      )
    ) {
      return "REFLET_VOUS";
    }

    // 4) REFLET_JE
    if (/\b(je\s+comprends|je\s+vois|je\s+note)\b/.test(t)) {
      return "REFLET_JE";
    }

    // 5) REFLET_ACQ
    if (
      /\b(d['’]?accord|ok|oui|mm+h*|hum+|très\s+bien|parfait|tout\s+à\s+fait|effectivement|exactement)\b/.test(
        t
      )
    ) {
      return "REFLET_ACQ";
    }

    // 6) EXPLICATION
    if (
      /\b(parce\s+que|notre\s+politique|la\s+procédure|le\s+règlement|le\s+système|il\s+s'agit|cela\s+fonctionne)\b/.test(
        t
      )
    ) {
      return "EXPLICATION";
    }

    return null;
  }

  // ---- Classification -------------------------------------------------------
  async classify(verbatim: string): Promise<ClassificationResult> {
    const startTime = Date.now();

    if (!this.isServer()) {
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: { error: "OpenAIConseillerClassifier est server-only" },
      };
    }

    if (!this.validateConfig()) {
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: { error: "Configuration invalide ou API key manquante" },
      };
    }

    const text = this.sanitize(verbatim);
    if (!text) {
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: { error: "Verbatim vide" },
      };
    }

    try {
      const messages = this.createMessages(text);
      const response = await this.callOpenAI(messages);
      const raw = response.choices[0]?.message?.content?.trim() || "AUTRE";
      const normalized = this.normalizeLabel(raw);

      // score "LLM a trouvé un label exact" vs "normalisation"
      let finalPrediction = normalized;
      let finalConfidence = this.calculateConfidence(raw, normalized);
      let forcedByHeuristic = false;

      // ---- Anti-AUTRE : si le LLM rend AUTRE, on force via heuristique
      if (finalPrediction === "AUTRE") {
        const forced = this.strongHeuristic(text);
        if (forced) {
          finalPrediction = forced;
          // confiance plancher raisonnable
          finalConfidence = Math.max(finalConfidence, 0.68);
          forcedByHeuristic = true;
        }
      }

      return {
        prediction: finalPrediction,
        confidence: finalConfidence,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.config.model,
          rawResponse: raw,
          forcedByHeuristic,
          usage: response.usage,
          temperature: this.config.temperature,
        },
      };
    } catch (err: unknown) {
      if (this.config.enableFallback) {
        const fb = this.fallbackClassification(text);
        return {
          ...fb,
          processingTime: Date.now() - startTime,
          metadata: {
            error: err instanceof Error ? err.message : "Erreur OpenAI",
            usedFallback: true,
          },
        };
      }
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: {
          error: err instanceof Error ? err.message : "Erreur OpenAI",
        },
      };
    }
  }

  private calculateConfidence(raw: string, normalized: string): number {
    const upper = raw.toUpperCase().trim();
    if ((ALLOWED as readonly string[]).includes(upper)) return 0.96;
    if (normalized !== "AUTRE") return 0.82;
    return 0.3;
  }

  // ---- Fallback simple ------------------------------------------------------
  private fallbackClassification(verbatim: string): {
    prediction: string;
    confidence: number;
  } {
    const forced = this.strongHeuristic(verbatim);
    if (forced) return { prediction: forced, confidence: 0.62 };
    return { prediction: "AUTRE", confidence: 0.3 };
  }

  // ---- Outils ---------------------------------------------------------------
  async testConnection(): Promise<boolean> {
    if (!this.validateConfig() || !this.isServer()) return false;
    try {
      const ping = await this.classify("test de connexion");
      return !ping.metadata?.error;
    } catch {
      return false;
    }
  }

  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (typeof newConfig.apiKey !== "undefined") this.apiKey = newConfig.apiKey;
  }

  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  async explainClassification(verbatim: string): Promise<string> {
    const text = this.sanitize(verbatim);
    const messages = [
      {
        role: "system" as const,
        content:
          "Tu expliques en 1–2 phrases la raison du choix de label, sans citer de balises de transcription. Règle de priorité: ENGAGEMENT > OUVERTURE > REFLETS > EXPLICATION.",
      },
      {
        role: "user" as const,
        content: `Explique brièvement le choix pour: "${text}"`,
      },
    ];
    try {
      const response = await this.callOpenAI(messages);
      return (
        response.choices[0]?.message?.content || "Pas d'explication disponible"
      );
    } catch (err: unknown) {
      return `Erreur lors de l'explication : ${
        err instanceof Error ? err.message : "Erreur inconnue"
      }`;
    }
  }
}
