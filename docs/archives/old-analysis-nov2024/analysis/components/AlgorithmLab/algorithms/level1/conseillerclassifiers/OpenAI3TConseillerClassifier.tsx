// OpenAI3TConseillerClassifier.ts
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
  strictPromptMode?: boolean; // prompt-only: pas d'heuristique locale
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const ALLOWED = [
  "ENGAGEMENT",
  "OUVERTURE",
  "REFLET_VOUS",
  "REFLET_JE",
  "REFLET_ACQ",
  "EXPLICATION",
  "AUTRE",
] as const;
const ALLOWED_SET = new Set(ALLOWED as unknown as string[]);

const DEFAULTS: OpenAIConfig = {
  apiKey: undefined,
  model: "gpt-4o-mini",
  temperature: 0,
  maxTokens: 6,
  timeout: 10_000,
  enableFallback: true,
  strictPromptMode: true,
};

export class OpenAI3TConseillerClassifier extends BaseClassifier {
  private config: OpenAIConfig;
  private apiKey?: string;

  constructor(config: OpenAIConfig) {
    super();
    this.config = { ...DEFAULTS, ...config };
    this.apiKey = config.apiKey;
  }

  // ---- BaseClassifier API ----
  getMetadata(): ClassifierMetadata {
    return {
      name: "OpenAI 3-Turns Conseiller Classifier",
      version: "1.0.0",
      type: "llm",
      description:
        "Classification du tour conseiller T0 en tenant compte du contexte T-2 et T-1 (prompt-only, priorité action, charte 3.1.2).",
      configSchema: {
        model: {
          type: "string",
          options: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
          default: "gpt-4o-mini",
          description: "Modèle GPT",
        },
        temperature: {
          type: "number",
          min: 0,
          max: 1,
          step: 0.1,
          default: 0,
          description: "Créativité",
        },
        maxTokens: {
          type: "number",
          min: 4,
          max: 50,
          step: 2,
          default: 6,
          description: "Tokens sortie",
        },
        timeout: {
          type: "number",
          min: 5000,
          max: 30000,
          step: 1000,
          default: 10000,
          description: "Timeout (ms)",
        },
        enableFallback: {
          type: "boolean",
          default: true,
          description: "Fallback AUTRE simple",
        },
        strictPromptMode: {
          type: "boolean",
          default: true,
          description: "Prompt-only : aucune heuristique locale ni correction.",
        },
      },
      requiresTraining: false,
      requiresAPIKey: true,
      supportsBatch: false,
      categories: [...ALLOWED],
      targetDomain: "conseiller",
    };
  }

  validateConfig(): boolean {
    if (!this.apiKey && typeof window === "undefined") {
      console.warn("[OpenAI3T] API key manquante (server)");
      return false;
    }
    const t = this.config.temperature;
    return Boolean(this.config.model) && t >= 0 && t <= 1;
  }

  // ---- Public helpers ----
  /** API explicite pour 3 tours (reco) */
  async classifyTriplet(
    tMinus2: string,
    tMinus1: string,
    t0: string
  ): Promise<ClassificationResult> {
    return this._classifyInternal({ tMinus2, tMinus1, t0 });
  }

  // ---- BaseClassifier.classify (compat) ----
  /**
   * Compat appel legacy: supporte trois formats en entrée :
   * 1) JSON string: {"t-2":"...","t-1":"...","t0":"..."} (ou keys tMinus2/tMinus1)
   * 2) Bloc avec entêtes:
   *    T-2: ...
   *    T-1: ...
   *    T0: ...
   * 3) Simple string => considéré comme T0 (sans contexte)
   */
  async classify(input: string): Promise<ClassificationResult> {
    const parsed = this.parseInput(input);
    return this._classifyInternal(parsed);
  }

  // ---- Core ----
  private async _classifyInternal(triple: {
    tMinus2?: string;
    tMinus1?: string;
    t0: string;
  }): Promise<ClassificationResult> {
    const start = Date.now();

    if (typeof window !== "undefined") {
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - start,
        metadata: { error: "OpenAI3TConseillerClassifier est server-only" },
      };
    }
    if (!this.validateConfig()) {
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - start,
        metadata: { error: "Configuration invalide ou clé API manquante" },
      };
    }

    const t0 = this.sanitize(triple.t0 || "");
    const tMinus1 = this.sanitize(triple.tMinus1 || "");
    const tMinus2 = this.sanitize(triple.tMinus2 || "");

    if (!t0) {
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - start,
        metadata: { error: "T0 vide" },
      };
    }

    try {
      const messages = this.createMessages({ tMinus2, tMinus1, t0 });
      const response = await this.callOpenAI(messages);
      const raw = (response.choices[0]?.message?.content ?? "").trim();
      const final = this.normalizeLabel(raw);

      const confidence =
        ALLOWED_SET.has(final) && final !== "AUTRE" ? 0.96 : 0.3;

      return {
        prediction: final,
        confidence,
        processingTime: Date.now() - start,
        metadata: {
          model: this.config.model,
          rawResponse: raw,
          usage: response.usage,
          temperature: this.config.temperature,
          strictPromptMode: this.config.strictPromptMode,
          context: { tMinus2, tMinus1 },
        },
      };
    } catch (err: any) {
      if (this.config.enableFallback) {
        return {
          prediction: "AUTRE",
          confidence: 0.3,
          processingTime: Date.now() - start,
          metadata: {
            error: err?.message ?? "Erreur OpenAI",
            usedFallback: true,
            strictPromptMode: this.config.strictPromptMode,
          },
        };
      }
      return {
        prediction: "AUTRE",
        confidence: 0,
        processingTime: Date.now() - start,
        metadata: { error: err?.message ?? "Erreur OpenAI" },
      };
    }
  }

  // ---- Prompting ----
  private createMessages(triple: {
    tMinus2?: string;
    tMinus1?: string;
    t0: string;
  }): ChatMessage[] {
    const system = `Tu es un classificateur **déterministe** de tours CONSEILLER.
Tu dois classer **le tour T0** (conseiller) en tenant compte du contexte T-2 et T-1.
Réponds **EXACTEMENT** par **un seul label** parmi:
${ALLOWED.join(", ")}

**Règle de priorité stricte (si plusieurs fonctions coexistent dans T0)**:
ENGAGEMENT > OUVERTURE > REFLET_VOUS > REFLET_JE > REFLET_ACQ > EXPLICATION > AUTRE

**Rappels opérationnels**
- ENGAGEMENT: action du conseiller (je vais/je fais/je m’occupe/je vérifie/je transfère/je vous donne/je vais voir/on va…)
- OUVERTURE: directive envers le client (vous allez/devez/pouvez-vous/veuillez/merci de/il faut que vous/futur passif “vous serez/allez être …”/impératifs “indiquez, donnez, joignez, cliquez…”/guidage “ça sera la 3e ligne”)
- REFLET_VOUS: description de l’action/état du client (“vous avez…”, sans directive ni justification)
- REFLET_JE: état cognitif du conseiller (“je comprends/je vois/je note”, sans action)
- REFLET_ACQ: micro-acquiescement court (“oui, d’accord, ok, hum-hum, ah…”, ≤ ~20 caractères)
- EXPLICATION: procédure/règlement/justification, listes/chiffrages (“parce que/c’est normal/il s’agit de/le système/la procédure…”)
- AUTRE: vide, bruit

**Garde-fous**
- Justification + instruction → **OUVERTURE**.
- “C’est normal, vous allez …” → **OUVERTURE**.
- Guidage d’interface (“ça sera la 3e ligne…”) → **OUVERTURE**.
- Micro-tours (“ah”, “ok”, “oui”, “hm”) → **REFLET_ACQ**.

**Sortie**: retourne **uniquement** l’un des 7 labels, sans texte additionnel.`;

    const few: ChatMessage[] = [
      {
        role: "user",
        content:
          "T-2: client: j’ai essayé hier\nT-1: conseiller: je comprends\nT0: d'accord, je vais vérifier",
      },
      { role: "assistant", content: "ENGAGEMENT" },
      {
        role: "user",
        content:
          "T-2: —\nT-1: client: comment je fais ?\nT0: vous allez recevoir un mail, cliquez sur le lien",
      },
      { role: "assistant", content: "OUVERTURE" },
      {
        role: "user",
        content: "T-2: client: ok\nT-1: conseiller: je vois\nT0: oui",
      },
      { role: "assistant", content: "REFLET_ACQ" },
      {
        role: "user",
        content:
          "T-2: —\nT-1: client: c’est quoi la procédure ?\nT0: notre système fonctionne en trois étapes",
      },
      { role: "assistant", content: "EXPLICATION" },
      {
        role: "user",
        content:
          "T-2: —\nT-1: client: j’ai déjà envoyé\nT0: c’est normal, vous allez être recontacté",
      },
      { role: "assistant", content: "OUVERTURE" },
    ];

    const t_2 = triple.tMinus2 ? triple.tMinus2 : "—";
    const t_1 = triple.tMinus1 ? triple.tMinus1 : "—";
    const usr: ChatMessage = {
      role: "user",
      content: `T-2: ${t_2}\nT-1: ${t_1}\nT0: ${triple.t0}\n\nRéponds par 1 label:`,
    };

    return [{ role: "system", content: system }, ...few, usr];
  }

  // ---- IO ----
  private sanitize(x: string): string {
    return (x || "")
      .replace(/\[(?:TC|AP)\]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeLabel(prediction: string): string {
    if (!prediction) return "AUTRE";
    const t = prediction.trim().toUpperCase();
    return ALLOWED_SET.has(t) ? t : "AUTRE";
  }

  private async callOpenAI(messages: ChatMessage[]): Promise<OpenAIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
          stop: ["\n"],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${res.status} - ${
            (data as any)?.error?.message ?? "Unknown error"
          }`
        );
      }
      return (await res.json()) as OpenAIResponse;
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(`Timeout après ${this.config.timeout}ms`);
      }
      throw e instanceof Error ? e : new Error("Erreur OpenAI inconnue");
    }
  }

  // ---- Parsing compat ----
  private parseInput(input: string): {
    tMinus2?: string;
    tMinus1?: string;
    t0: string;
  } {
    const raw = (input ?? "").trim();
    if (!raw) return { t0: "" };

    // JSON
    if (raw.startsWith("{")) {
      try {
        const obj = JSON.parse(raw);
        const t0 = obj.t0 ?? obj["t-0"] ?? obj.current ?? obj.now ?? "";
        const tMinus1 = obj.tMinus1 ?? obj["t-1"] ?? obj.prev ?? "";
        const tMinus2 = obj.tMinus2 ?? obj["t-2"] ?? obj.prev2 ?? "";
        return { tMinus2, tMinus1, t0 };
      } catch {
        // fallthrough to headers
      }
    }

    // Entêtes T-2/T-1/T0
    const mT2 = raw.match(/T-2:\s*([^\n]*)/i);
    const mT1 = raw.match(/T-1:\s*([^\n]*)/i);
    const mT0 = raw.match(/T0:\s*([\s\S]*)/i);
    if (mT0) {
      return {
        tMinus2: mT2?.[1]?.trim(),
        tMinus1: mT1?.[1]?.trim(),
        t0: mT0[1].trim(),
      };
    }

    // Par défaut: tout est T0
    return { t0: raw };
  }

  // ---- Admin ----
  async testConnection(): Promise<boolean> {
    if (!this.validateConfig() || typeof window !== "undefined") return false;
    try {
      const ping = await this.classifyTriplet(
        "—",
        "je comprends",
        "je vais vérifier"
      );
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
}
