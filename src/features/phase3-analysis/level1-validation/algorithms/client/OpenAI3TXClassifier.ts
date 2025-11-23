// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/XAlgorithms/OpenAI3TXClassifier.ts

import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/types/algorithm-lab/algorithms/base";

type OpenAI3TConfig = {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableFallback?: boolean;
  strictPromptMode?: boolean;
};

const LABELS = [
  "ENGAGEMENT",
  "OUVERTURE",
  "REFLET_JE",
  "REFLET_VOUS",
  "REFLET_ACQ",
  "EXPLICATION",
  "AUTRE_NON_RECONNU",
] as const;

interface ContextualInput {
  tMinus2?: string; // Tour T-2
  tMinus1?: string; // Tour T-1
  t0: string; // Tour actuel T0 (conseiller)
  // Alternative format support
  current?: string;
  prev1?: string;
  prev2?: string;
}

export class OpenAI3TXClassifier implements UniversalAlgorithm {
  private apiKey: string;
  private config: Required<Omit<OpenAI3TConfig, "apiKey">>;

  constructor(config: OpenAI3TConfig = {}) {
    // ⚠️ ne jamais mettre NEXT_PUBLIC_* ici : la clé doit rester côté serveur
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";

    this.config = {
      model: "gpt-4o-mini", // Plus économique pour la classification contextuelle
      temperature: 0, // Maintenir à 0 pour la cohérence
      maxTokens: 16, // Réduit pour forcer des réponses concises
      timeout: config.timeout ?? 15000, // Un peu plus pour le contexte
      enableFallback: config.enableFallback ?? true,
      strictPromptMode: config.strictPromptMode ?? true,
    };
  }

  describe(): AlgorithmDescriptor {
    return {
      name: "OpenAI3TXClassifier",
      displayName: "OpenAI — X (3 tours)",
      version: "1.0.0",
      type: "llm",
      target: "X",
      batchSupported: true,
      requiresContext: true, // ✅ Indique que cet algo nécessite du contexte
      description:
        "Classification LLM des tours de parole CONSEILLER avec contexte des 2 tours précédents (T-2, T-1, T0). Améliore la précision en tenant compte du contexte conversationnel.",
      parameters: {
        model: {
          type: "select",
          options: [
            { label: "GPT-4o", value: "gpt-4o" },
            { label: "GPT-4o-mini", value: "gpt-4o-mini" },
            { label: "GPT-3.5-turbo", value: "gpt-3.5-turbo" },
          ],
          description: "Modèle OpenAI à utiliser",
        },
        temperature: {
          type: "number",
          min: 0,
          max: 1,
          step: 0.1,
          description: "Créativité du modèle",
        },
        maxTokens: {
          type: "number",
          min: 4,
          max: 20,
          description: "Longueur maximale de réponse",
        },
        strictPromptMode: {
          type: "boolean",
          description: "Mode strict (prompt uniquement, sans heuristique)",
        },
      },
      examples: [
        {
          input: {
            tMinus2: "client: j'ai essayé hier",
            tMinus1: "conseiller: je comprends",
            t0: "d'accord, je vais vérifier",
          },
          note: "ENGAGEMENT (action promise dans contexte empathique)",
        },
        {
          input: {
            tMinus2: "—",
            tMinus1: "client: comment je fais ?",
            t0: "vous allez recevoir un mail, cliquez sur le lien",
          },
          note: "OUVERTURE (instruction client après question)",
        },
      ],
    };
  }

  validateConfig(): boolean {
    const isServer = typeof window === "undefined";
    if (!this.apiKey && isServer) {
      console.warn("[OpenAI3TXClassifier] API key manquante (server)");
      return false;
    }
    return (
      this.config.maxTokens > 0 &&
      this.config.timeout > 0 &&
      this.config.temperature >= 0 &&
      this.config.temperature <= 1
    );
  }

  async run(input: unknown): Promise<UniversalResult> {
    const startTime = Date.now();

    // Parse l'input contextuel
    const context = this.parseInput(input);

    // ── LOGIQUE CORRIGÉE : Détection de l'environnement
    const isServer = typeof window === "undefined";

    if (isServer) {
      // ── Chemin serveur : appel direct OpenAI
      return this.runServerSide(context, startTime);
    } else {
      // ── Chemin navigateur : passage par l'API interne Next.js
      return this.runClientSide(context, startTime);
    }
  }

  private parseInput(input: unknown): ContextualInput {
    if (!input) return { t0: "" };

    // Si c'est une string simple, traiter comme T0 uniquement
    if (typeof input === "string") {
      return { t0: input };
    }

    // Si c'est un objet, extraire les propriétés contextuelles
    if (typeof input === "object" && input !== null) {
      const obj = input as any;

      // Format principal : tMinus2, tMinus1, t0
      if (obj.t0 || obj.tMinus1 || obj.tMinus2) {
        return {
          tMinus2: obj.tMinus2 || obj.prev2 || "",
          tMinus1: obj.tMinus1 || obj.prev1 || "",
          t0: obj.t0 || obj.current || "",
        };
      }

      // Format alternatif : current, prev1, prev2
      if (obj.current || obj.prev1 || obj.prev2) {
        return {
          tMinus2: obj.prev2 || "",
          tMinus1: obj.prev1 || "",
          t0: obj.current || "",
        };
      }

      // Format de string structurée (ex: "T-2: ...\nT-1: ...\nT0: ...")
      if (obj.toString && typeof obj.toString === "function") {
        return this.parseStructuredString(obj.toString());
      }
    }

    // Fallback : traiter comme string
    return { t0: String(input) };
  }

  private parseStructuredString(text: string): ContextualInput {
    const mT2 = text.match(/T-2:\s*([^\n]*)/i);
    const mT1 = text.match(/T-1:\s*([^\n]*)/i);
    const mT0 = text.match(/T0:\s*([\s\S]*)/i);

    if (mT0) {
      return {
        tMinus2: mT2?.[1]?.trim() || "",
        tMinus1: mT1?.[1]?.trim() || "",
        t0: mT0[1].trim(),
      };
    }

    return { t0: text };
  }

  private async runClientSide(
    context: ContextualInput,
    startTime: number
  ): Promise<UniversalResult> {
    try {
      console.log("🌐 OpenAI 3T Classification - Appel via API interne client");

      const response = await fetch("/api/algolab/classifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "OpenAI3TXClassifier",
          input: context,

          verbatim: context.t0 ?? "",
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);
        console.error(`❌ API Error ${response.status}:`, errorText);
        return this.naFallback(
          startTime,
          `api_status_${response.status}:${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ API Response received:", data);

      if (!data?.ok || !Array.isArray(data.results) || !data.results[0]) {
        console.error("❌ Invalid API payload:", data);
        return this.naFallback(startTime, "api_invalid_payload");
      }

      return data.results[0] as UniversalResult;
    } catch (error: any) {
      console.error("❌ Client API call failed:", error);
      return this.naFallback(startTime, error?.message ?? "api_network_error");
    }
  }

  private async runServerSide(
    context: ContextualInput,
    startTime: number
  ): Promise<UniversalResult> {
    console.log("🔧 OpenAI 3T Classification - Appel direct serveur");

    if (!this.apiKey) {
      console.error("❌ No OpenAI API key available");
      return this.naFallback(startTime, "no-api-key");
    }

    if (!context.t0?.trim()) {
      return this.naFallback(startTime, "empty-t0");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      console.warn("⏰ OpenAI API timeout");
      controller.abort();
    }, this.config.timeout);

    try {
      console.log(`🤖 Calling OpenAI API with model: ${this.config.model}`);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            response_format: this.config.strictPromptMode
              ? {
                  type: "json_schema",
                  json_schema: {
                    name: "x_classification",
                    strict: true,
                    schema: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        label: { type: "string", enum: [...LABELS] },
                      },
                      required: ["label"],
                    },
                  },
                }
              : undefined,
            messages: this.buildMessages(context),
          }),
        }
      );

      clearTimeout(timer);

      if (!response.ok) {
        let reason = `openai_status_${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error?.message) {
            reason += `:${errorData.error.message}`;
          }
          console.error("❌ OpenAI API Error:", errorData);
        } catch {}
        return this.naFallback(startTime, reason);
      }

      const data = await response.json();
      console.log("✅ OpenAI API Response:", data);

      return this.parseOpenAIResponse(data, startTime, context);
    } catch (error: any) {
      clearTimeout(timer);
      console.error("❌ OpenAI API call failed:", error);
      return this.naFallback(startTime, error?.message ?? "network_error");
    }
  }

  private buildMessages(context: ContextualInput) {
    const systemPrompt = `Tu es un classificateur **déterministe** de tours CONSEILLER dans des conversations de centres d'appels.
Tu dois classer **le tour T0** (conseiller) en tenant compte du contexte T-2 et T-1.

**Règle de priorité stricte (si plusieurs fonctions coexistent dans T0):**
ENGAGEMENT > OUVERTURE > REFLET_VOUS > REFLET_JE > REFLET_ACQ > EXPLICATION > AUTRE_NON_RECONNU

**Définitions précises:**
- ENGAGEMENT: action concrète du conseiller ("je vais/fais/vérifie/transfère/m'occupe de")
- OUVERTURE: directive vers le client ("vous allez/devez/pouvez/veuillez/il faut que vous")  
- REFLET_VOUS: description de l'action/état du client ("vous avez appelé", sans directive)
- REFLET_JE: état cognitif du conseiller ("je comprends/vois/entends", sans action)
- REFLET_ACQ: acquiescement court ("oui", "d'accord", "ok", ≤ 20 caractères)
- EXPLICATION: procédure/justification ("parce que/c'est normal/le système/notre politique")
- AUTRE_NON_RECONNU: cas non classifiables

**Utilise le contexte T-2/T-1 pour désambiguïser les cas limites.**
Réponds ${
      this.config.strictPromptMode ? 'par un JSON {"label": "..."} avec' : "par"
    } **exactement un des labels** ci-dessus.`;

    // Exemples few-shot avec contexte
    const fewShot = [
      {
        role: "user" as const,
        content:
          "T-2: client: j'ai essayé hier mais ça n'a pas marché\nT-1: conseiller: je comprends votre frustration\nT0: d'accord, je vais vérifier votre dossier maintenant",
      },
      {
        role: "assistant" as const,
        content: this.config.strictPromptMode
          ? '{"label": "ENGAGEMENT"}'
          : "ENGAGEMENT",
      },
      {
        role: "user" as const,
        content:
          "T-2: —\nT-1: client: comment je dois faire exactement ?\nT0: vous allez recevoir un email dans quelques minutes, cliquez sur le lien",
      },
      {
        role: "assistant" as const,
        content: this.config.strictPromptMode
          ? '{"label": "OUVERTURE"}'
          : "OUVERTURE",
      },
      {
        role: "user" as const,
        content: "T-2: client: d'accord\nT-1: conseiller: très bien\nT0: oui",
      },
      {
        role: "assistant" as const,
        content: this.config.strictPromptMode
          ? '{"label": "REFLET_ACQ"}'
          : "REFLET_ACQ",
      },
      {
        role: "user" as const,
        content:
          "T-2: —\nT-1: client: pourquoi ça ne marche pas ?\nT0: notre système fonctionne en trois étapes distinctes",
      },
      {
        role: "assistant" as const,
        content: this.config.strictPromptMode
          ? '{"label": "EXPLICATION"}'
          : "EXPLICATION",
      },
    ];

    // Construction de l'input contextuel pour classification
    const t2 = context.tMinus2?.trim() || "—";
    const t1 = context.tMinus1?.trim() || "—";
    const t0 = context.t0?.trim() || "";

    const userMessage = {
      role: "user" as const,
      content: `T-2: ${t2}\nT-1: ${t1}\nT0: ${t0}`,
    };

    return [
      { role: "system" as const, content: systemPrompt },
      ...fewShot,
      userMessage,
    ];
  }

  private parseOpenAIResponse(
    data: any,
    startTime: number,
    context: ContextualInput
  ): UniversalResult {
    const rawContent = data?.choices?.[0]?.message?.content ?? "";
    let label = "AUTRE_NON_RECONNU";

    // Parse JSON avec fallback amélioré
    if (this.config.strictPromptMode) {
      try {
        const parsed = JSON.parse(rawContent);
        if (parsed?.label && LABELS.includes(parsed.label)) {
          label = parsed.label;
        }
      } catch {
        // Fallback parsing pour mode strict
        const content = rawContent.toUpperCase();
        for (const validLabel of LABELS) {
          if (content.includes(validLabel)) {
            label = validLabel;
            break;
          }
        }
      }
    } else {
      // Mode non-strict : parsing direct
      const content = rawContent.trim().toUpperCase();
      if (LABELS.includes(content as any)) {
        label = content;
      } else {
        // Fallback heuristique
        for (const validLabel of LABELS) {
          if (content.includes(validLabel)) {
            label = validLabel;
            break;
          }
        }
      }
    }

    // Application des règles hiérarchiques avec contexte
    label = this.applyContextualRules(label, context);

    return {
      prediction: label,
      confidence: label === "AUTRE_NON_RECONNU" ? 0.25 : 0.9,
      processingTime: Date.now() - startTime,
      algorithmVersion: this.config.model,
      metadata: {
        target: "X",
        inputType: "contextual",
        executionPath: ["openai_gpt_3t"],
        provider: "openai",
        details: {
          family: this.familyFromX(label),
          rawResponse: rawContent,
          parseMethod: label !== "AUTRE_NON_RECONNU" ? "success" : "fallback",
          contextUsed: {
            hasPrevContext: !!(context.tMinus1 || context.tMinus2),
            tMinus2Present: !!context.tMinus2?.trim(),
            tMinus1Present: !!context.tMinus1?.trim(),
          },
        },
        raw: data,
      },
    };
  }

  private applyContextualRules(
    label: string,
    context: ContextualInput
  ): string {
    const t0 = context.t0?.toLowerCase() || "";
    const t1 = context.tMinus1?.toLowerCase() || "";
    const t2 = context.tMinus2?.toLowerCase() || "";

    // Règles contextuelles spécialisées pour la classification 3T

    // Force ENGAGEMENT si action après demande client explicite
    if (
      t1.includes("client:") &&
      (t1.includes("comment") || t1.includes("peux") || t1.includes("aide")) &&
      (t0.includes("je vais") ||
        t0.includes("je vérifie") ||
        t0.includes("je m'occupe"))
    ) {
      return "ENGAGEMENT";
    }

    // Force OUVERTURE si instruction après question
    if (
      t1.includes("client:") &&
      (t1.includes("?") || t1.includes("comment") || t1.includes("où")) &&
      (t0.includes("vous allez") ||
        t0.includes("cliquez") ||
        t0.includes("vous devez"))
    ) {
      return "OUVERTURE";
    }

    // REFLET_ACQ si acquiescement après accord client
    if (
      t1.includes("d'accord") ||
      t1.includes("oui") ||
      (t1.includes("ok") && t0.length <= 20)
    ) {
      if (
        ["oui", "d'accord", "ok", "très bien", "parfait"].includes(t0.trim())
      ) {
        return "REFLET_ACQ";
      }
    }

    return label;
  }

  async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
    console.log(`🔄 Batch processing ${inputs.length} items with context`);
    const results: UniversalResult[] = [];

    for (let i = 0; i < inputs.length; i++) {
      console.log(`Processing contextual item ${i + 1}/${inputs.length}`);
      // eslint-disable-next-line no-await-in-loop
      results.push(await this.run(inputs[i]));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 150)); // Rate limiting plus conservative
    }

    return results;
  }

  // ── API live config
  getConfig() {
    return {
      apiKey: this.apiKey ? "***CONFIGURED***" : "***NOT_SET***",
      ...this.config,
    };
  }

  updateConfig(partial: Partial<OpenAI3TConfig>) {
    if (typeof partial.apiKey === "string") this.apiKey = partial.apiKey;
    if (typeof partial.model === "string") this.config.model = partial.model;
    if (typeof partial.temperature === "number")
      this.config.temperature = partial.temperature;
    if (typeof partial.maxTokens === "number")
      this.config.maxTokens = partial.maxTokens;
    if (typeof partial.timeout === "number")
      this.config.timeout = partial.timeout;
    if (typeof partial.enableFallback === "boolean")
      this.config.enableFallback = partial.enableFallback;
    if (typeof partial.strictPromptMode === "boolean")
      this.config.strictPromptMode = partial.strictPromptMode;
  }

  // Test de connexion contextuel
  async testConnection(): Promise<boolean> {
    try {
      const testResult = await this.run({
        tMinus2: "—",
        tMinus1: "client: test",
        t0: "je vais tester la connexion",
      });
      return !testResult.metadata?.warnings?.includes("no-api-key");
    } catch {
      return false;
    }
  }

  // ── Helpers
  private naFallback(startTime: number, reason: string): UniversalResult {
    const label = "AUTRE_NON_RECONNU";
    console.warn(`⚠️ Fallback triggered: ${reason}`);

    return {
      prediction: label,
      confidence: this.config.enableFallback ? 0.25 : 0,
      processingTime: Date.now() - startTime,
      algorithmVersion: "openai-3t-no-call",
      metadata: {
        target: "X",
        inputType: "contextual",
        executionPath: ["no_api_or_error"],
        details: { family: this.familyFromX(label), reason },
      },
    };
  }

  private familyFromX(label: string): string {
    if (label.includes("REFLET")) return "REFLET";
    if (label.includes("ENGAGEMENT")) return "ENGAGEMENT";
    if (label.includes("OUVERTURE")) return "OUVERTURE";
    if (label.includes("EXPLICATION")) return "EXPLICATION";
    return "AUTRE";
  }
}
