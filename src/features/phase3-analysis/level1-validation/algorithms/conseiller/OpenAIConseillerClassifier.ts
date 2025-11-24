// OpenAIConseillerClassifier.ts
import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from '../shared/BaseClassifier';

interface OpenAIConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  enableFallback: boolean;
  strictPromptMode?: boolean; // NEW: si true, pas d’heuristiques ni de normalisation “maligne”
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
  strictPromptMode: true, // on fait confiance au prompt
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

  // Set utile pour les checks exacts en mode strict
  private static readonly ALLOWED_SET = new Set<string>(
    ALLOWED as unknown as string[]
  );

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
      version: "1.4.0",
      type: "llm",
      description:
        "Classification via GPT des verbatims conseiller (priorité action). Mode strict prompt-first par défaut.",
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
        strictPromptMode: {
          type: "boolean",
          default: true,
          description:
            "Si vrai, aucune heuristique ni correction locale n’est appliquée.",
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
    const allowed = ALLOWED.join(", ");

    const system = `Tu es un classificateur **déterministe** de tours CONSEILLER.
Tu dois répondre **EXACTEMENT** par **un unique label** parmi:
${allowed}

**Règle de priorité stricte** (si plusieurs fonctions coexistent):
ENGAGEMENT > OUVERTURE > REFLET_VOUS > REFLET_JE > REFLET_ACQ > EXPLICATION > AUTRE

**Définitions opérationnelles (rappel court)**
- ENGAGEMENT (je vais/je fais/je vérifie/je m’occupe/je transfère/je vous donne/je vais voir/je vous envoie/on va…).
- OUVERTURE (vous allez/devrez/pouvez-vous/veuillez/merci de/il faut que vous/je vous invite à/impératifs “indiquez, donnez, joignez, cliquez, présentez…”/futur passif “vous serez/allez être …”/guidage “ça sera la 3e ligne”).
- REFLET_VOUS (décrire l’action/état du client: “vous avez…”, sans directive ni justification).
- REFLET_JE (état cognitif du conseiller: “je comprends/je vois/je note”, sans action).
- REFLET_ACQ (micro-acquiescement court: “oui, d’accord, ok, hum-hum, ah, exact…”, typiquement ≤ 20 caractères).
- EXPLICATION (procédure/règlement/justification, listes/chiffrages; “parce que/c’est normal/il s’agit de/le système/la procédure…”).
- AUTRE (vide, bruit).

**Garde-fous anti-erreur fréquente**
- Justification + instruction → **OUVERTURE**.
- “C’est normal, vous allez …” → **OUVERTURE**.
- Guidage d’interface (“ça sera la 3e ligne…”) → **OUVERTURE**.
- Micro-tours très courts (“ah”, “ok”, “oui”, “hm”) → **REFLET_ACQ**.
- “Je vais/je vous donne/je vais voir/je m’en occupe” → **ENGAGEMENT**.

**Sortie**: retourne **uniquement** l’un des 7 labels, sans ponctuation ni texte additionnel.`;

    const fewShots: ChatMessage[] = [
      // Tes exemples originaux (conservés)
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

      // Ajouts ciblés (observations d’erreurs fréquentes)
      {
        role: "user",
        content: "ça sera la troisième ligne, au niveau de la recherche",
      },
      { role: "assistant", content: "OUVERTURE" },

      {
        role: "user",
        content:
          "vous appelez d'un fixe, si vous pouvez, c'est non surtaxé, c'est gratuit",
      },
      { role: "assistant", content: "OUVERTURE" },

      { role: "user", content: "ah" },
      { role: "assistant", content: "REFLET_ACQ" },

      {
        role: "user",
        content: "je vous donne votre numéro de dossier s'il vous plaît",
      },
      { role: "assistant", content: "ENGAGEMENT" },

      {
        role: "user",
        content:
          "donnez-moi le numéro de fiche, je vais déjà voir s'ils ont enregistré",
      },
      { role: "assistant", content: "ENGAGEMENT" },

      { role: "user", content: "le 18" },
      { role: "assistant", content: "EXPLICATION" },

      { role: "user", content: "si vous pensez que c'est le facteur..." },
      { role: "assistant", content: "EXPLICATION" },

      { role: "user", content: "alors votre numéro c'est ?" },
      { role: "assistant", content: "OUVERTURE" },
    ];

    const user: ChatMessage = {
      role: "user",
      content:
        `Verbatim à classifier (réponds UNIQUEMENT par 1 label):\n` +
        `"${verbatim.replace(/\[(?:TC|AP)\]/gi, "").trim()}"`,
    };

    return [{ role: "system", content: system }, ...fewShots, user];
  }

  // ---- Normalisation strictement minimale (prompt-first) --------------------
  private normalizeLabel(prediction: string): string {
    if (!prediction) return "AUTRE";
    const t = prediction.trim().toUpperCase();
    return OpenAIConseillerClassifier.ALLOWED_SET.has(t) ? t : "AUTRE";
  }

  // ---- Appel OpenAI ---------------------------------------------------------
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

  // ---- Heuristiques (désactivées en strictPromptMode) -----------------------
  // Micro-tours (≤ 20 chars) -> REFLET_ACQ
  private microAcq(verbatim: string): string | null {
    const v = verbatim.trim().toLowerCase();
    if (v.length <= 20) {
      if (/\b(ah|oui|ok|d['’]?accord|hum+|mm+h*|exactement)\b/.test(v)) {
        return "REFLET_ACQ";
      }
    }
    return null;
  }

  // Heuristique forte (anti-AUTRE) respectant la priorité
  private strongHeuristic(verbatim: string): string | null {
    const t = verbatim.toLowerCase();

    // 1) ENGAGEMENT (priorité max)
    if (
      /\b(je\s+vais|je\s+fais|je\s+m['’]occupe|je\s+m’en\s+occupe|je\s+vérifie|je\s+transfère|je\s+demande|je\s+regarde|je\s+vous\s+envoie|je\s+vous\s+donne|je\s+vais\s+voir|on\s+va)\b/.test(
        t
      )
    ) {
      return "ENGAGEMENT";
    }

    // 2) OUVERTURE (directifs client, futur passif, guidage/impératifs)
    if (
      /\b(vous\s+allez|vous\s+devrez|vous\s+pourrez|vous\s+recevrez|veuillez|merci\s+de|pouvez[-\s]?vous|pourriez[-\s]?vous|il\s+faut\s+que\s+vous|je\s+vous\s+invite\s+à|vous\s+allez\s+être|vous\s+serez)\b/.test(
        t
      ) ||
      /\b(indiquez|donnez|joignez|cliquez|complétez|présentez)\b/.test(t) ||
      /\b(ça\s+sera\s+la\s+(première|deuxième|troisième|[0-9]+(ère|e)?))\b/.test(
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
      ) ||
      /\b\d+([.,]\d+)?\b.*\b\d+([.,]\d+)?\b/.test(t) // présence de plusieurs nombres
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
      // En mode strict, on ne court-circuite rien avec des heuristiques locales.
      if (!this.config.strictPromptMode) {
        // Micro-tour: retourne tout de suite (anti-AUTRE)
        const micro = this.microAcq(text);
        if (micro) {
          return {
            prediction: micro,
            confidence: 0.8,
            processingTime: Date.now() - startTime,
            metadata: { microTurn: true, strictPromptMode: false },
          };
        }
      }

      const messages = this.createMessages(text);
      const response = await this.callOpenAI(messages);
      const raw = response.choices[0]?.message?.content?.trim() || "AUTRE";

      // Normalisation strictement exacte
      let finalPrediction = this.normalizeLabel(raw);

      // Confiance simple et lisible
      let finalConfidence =
        OpenAIConseillerClassifier.ALLOWED_SET.has(finalPrediction) &&
        finalPrediction !== "AUTRE"
          ? 0.96
          : 0.3;
      let forcedByHeuristic = false;

      // Si non-strict ET le modèle rend AUTRE, on tente l’heuristique (anti-AUTRE)
      if (!this.config.strictPromptMode && finalPrediction === "AUTRE") {
        const forced = this.strongHeuristic(text);
        if (forced) {
          finalPrediction = forced;
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
          strictPromptMode: this.config.strictPromptMode,
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
            strictPromptMode: this.config.strictPromptMode,
          },
        };
      }
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: {
          error: err instanceof Error ? err.message : "Erreur OpenAI",
          strictPromptMode: this.config.strictPromptMode,
        },
      };
    }
  }

  // ---- Fallback simple ------------------------------------------------------
  private fallbackClassification(verbatim: string): {
    prediction: string;
    confidence: number;
  } {
    if (!this.config.strictPromptMode) {
      const forced = this.strongHeuristic(verbatim);
      if (forced) return { prediction: forced, confidence: 0.62 };
    }
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
