// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/XAlgorithms/OpenAIXClassifier.ts

import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/types/algorithm-lab/algorithms/base";

type OpenAIConfig = {
  apiKey?: string; // MAJ à chaud possible via updateConfig()
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableFallback?: boolean; // en cas d'erreur → AUTRE_NON_RECONNU
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

export class OpenAIXClassifier implements UniversalAlgorithm {
  private apiKey: string;
  private config: Required<Omit<OpenAIConfig, "apiKey">>;

  constructor(config: OpenAIConfig = {}) {
    // ⚠️ ne jamais mettre NEXT_PUBLIC_* ici : la clé doit rester côté serveur
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";

    this.config = {
      model: config.model ?? "gpt-4o-mini",
      temperature: config.temperature ?? 0,
      maxTokens: config.maxTokens ?? 32,
      timeout: config.timeout ?? 10000,
      enableFallback: config.enableFallback ?? true,
    };
  }

  describe(): AlgorithmDescriptor {
    return {
      name: "OpenAIXClassifier",
      displayName: "OpenAI – X (conseiller)",
      version: "2.3.0", // Version corrigée
      type: "llm",
      target: "X",
      batchSupported: true,
      requiresContext: false,
      description:
        "Classification LLM des tours de parole CONSEILLER (ENGAGEMENT, OUVERTURE, REFLET_*, EXPLICATION). Sortie forcée JSON, fallback = AUTRE_NON_RECONNU.",
      examples: [
        { input: "je vais vérifier votre dossier", note: "ENGAGEMENT" },
        { input: "vous allez recevoir un email", note: "OUVERTURE" },
        { input: "je comprends votre situation", note: "REFLET_JE" },
        {
          input: "notre politique exige un contrôle préalable",
          note: "EXPLICATION",
        },
      ],
    };
  }

  validateConfig(): boolean {
    // Validation basique côté client
    return this.config.maxTokens > 0 && this.config.timeout > 0;
  }

  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input ?? "");
    const startTime = Date.now();

    // ── LOGIQUE CORRIGÉE : Détection de l'environnement
    const isServer = typeof window === "undefined";

    if (isServer) {
      // ── Chemin serveur : appel direct OpenAI
      return this.runServerSide(verbatim, startTime);
    } else {
      // ── Chemin navigateur : passage par l'API interne Next.js
      return this.runClientSide(verbatim, startTime);
    }
  }

  private async runClientSide(
    verbatim: string,
    startTime: number
  ): Promise<UniversalResult> {
    try {
      console.log("🌐 OpenAI Classification - Appel via API interne client");

      const response = await fetch("/api/algolab/classifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "OpenAIXClassifier",
          verbatim,
          timestamp: Date.now(), // Pour debug
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
    verbatim: string,
    startTime: number
  ): Promise<UniversalResult> {
    console.log("🔧 OpenAI Classification - Appel direct serveur");

    if (!this.apiKey) {
      console.error("❌ No OpenAI API key available");
      return this.naFallback(startTime, "no-api-key");
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

            // 🔒 Sortie structurée : un JSON strict { "label": <enum> }
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "x_label",
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
            },

            messages: this.buildMessages(verbatim),
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

      return this.parseOpenAIResponse(data, startTime);
    } catch (error: any) {
      clearTimeout(timer);
      console.error("❌ OpenAI API call failed:", error);
      return this.naFallback(startTime, error?.message ?? "network_error");
    }
  }

  private buildMessages(verbatim: string) {
    return [
      {
        role: "system",
        content: [
          "Tu es un classificateur ULTRA STRICT de tours de parole CONSEILLER (FR).",
          "Renvoyer exactement un JSON conforme au schéma, avec un seul champ 'label'.",
          "Labels possibles : ENGAGEMENT, OUVERTURE, REFLET_JE, REFLET_VOUS, REFLET_ACQ, EXPLICATION.",
          "Si aucune catégorie ne convient clairement : AUTRE_NON_RECONNU.",
          "",
          "Consignes:",
          "- Ignore les marques et notations : [TC], [AP], crochets, pseudos-transcriptions (hm, mhm, euh), meta ('…').",
          "- Priorité à l'ACTION :",
          "  • ENGAGEMENT = action du conseiller (1re pers.) : « je vérifie », « je vous envoie », « je vais… »",
          "  • OUVERTURE  = action/instruction côté client (2e pers./impératif/futur proche) : « vous allez recevoir », « veuillez… »",
          "- EXPLICATION = règle/procédure/système, sans engagement ou instruction immédiate.",
          "- REFLET_JE  = empathie/reformulation centrée JE : « je comprends », « je vois ».",
          "- REFLET_VOUS= reformulation centrée VOUS : « vous dites que… », « vous avez… ».",
          "- REFLET_ACQ = acquiescement phatique minimal : « d'accord », « oui », « hm hm » (même suivi d'un '?').",
          "",
          "Résolution d'ambiguïtés (hiérarchie) : ENGAGEMENT > OUVERTURE > EXPLICATION > REFLET_VOUS > REFLET_JE > REFLET_ACQ.",
        ].join("\n"),
      },

      // Few-shot examples
      {
        role: "user",
        content: 'Texte: """je vais vérifier votre dossier"""',
      },
      { role: "assistant", content: '{"label":"ENGAGEMENT"}' },

      {
        role: "user",
        content: 'Texte: """vous allez recevoir un SMS de confirmation"""',
      },
      { role: "assistant", content: '{"label":"OUVERTURE"}' },

      {
        role: "user",
        content: 'Texte: """notre politique exige un contrôle préalable"""',
      },
      { role: "assistant", content: '{"label":"EXPLICATION"}' },

      {
        role: "user",
        content: 'Texte: """je comprends votre frustration"""',
      },
      { role: "assistant", content: '{"label":"REFLET_JE"}' },

      {
        role: "user",
        content: 'Texte: """vous dites avoir déjà envoyé le formulaire"""',
      },
      { role: "assistant", content: '{"label":"REFLET_VOUS"}' },

      { role: "user", content: 'Texte: """oui ?"""' },
      { role: "assistant", content: '{"label":"REFLET_ACQ"}' },

      // Instance à classer
      { role: "user", content: `Texte: """${verbatim}"""` },
    ];
  }

  private parseOpenAIResponse(data: any, startTime: number): UniversalResult {
    const rawContent = data?.choices?.[0]?.message?.content ?? "";
    let label = "AUTRE_NON_RECONNU";

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed.label === "string") {
        const normalizedLabel = String(parsed.label)
          .toUpperCase()
          .replace(/\s+/g, "_");
        if ((LABELS as readonly string[]).includes(normalizedLabel)) {
          label = normalizedLabel;
        }
      }
    } catch (parseError) {
      console.warn("❌ Failed to parse OpenAI JSON response:", rawContent);
      // On garde le fallback AUTRE_NON_RECONNU
    }

    return {
      prediction: label,
      confidence: label === "AUTRE_NON_RECONNU" ? 0.35 : 0.8,
      processingTime: Date.now() - startTime,
      algorithmVersion: this.config.model,
      metadata: {
        target: "X",
        inputType: "string",
        executionPath: ["openai_gpt_json"],
        provider: "openai",
        details: {
          family: this.familyFromX(label),
          rawResponse: rawContent,
        },
        raw: data,
      },
    };
  }

  async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
    console.log(`🔄 Batch processing ${inputs.length} items`);
    const results: UniversalResult[] = [];

    for (let i = 0; i < inputs.length; i++) {
      console.log(`Processing item ${i + 1}/${inputs.length}`);
      // eslint-disable-next-line no-await-in-loop
      results.push(await this.run(inputs[i]));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 120)); // Rate limiting
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

  updateConfig(partial: Partial<OpenAIConfig>) {
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
  }

  // ── Helpers
  private naFallback(startTime: number, reason: string): UniversalResult {
    const label = "AUTRE_NON_RECONNU";
    console.warn(`⚠️ Fallback triggered: ${reason}`);

    return {
      prediction: label,
      confidence: this.config.enableFallback ? 0.25 : 0,
      processingTime: Date.now() - startTime,
      algorithmVersion: "openai-no-call",
      metadata: {
        target: "X",
        inputType: "string",
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
