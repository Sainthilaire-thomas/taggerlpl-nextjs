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
      model: "gpt-4o", // Plus performant que gpt-4o-mini pour la classification complexe
      temperature: 0, // Maintenir à 0 pour la cohérence
      maxTokens: 16, // Réduire pour forcer des réponses concises
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

  // Ajoutez cette méthode dans votre classe OpenAIXClassifier

  private parseOpenAIResponse(data: any, startTime: number): UniversalResult {
    const rawContent = data?.choices?.[0]?.message?.content ?? "";
    let label = "AUTRE_NON_RECONNU";

    // Parse JSON avec fallback amélioré
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed?.label && LABELS.includes(parsed.label)) {
        label = parsed.label;
      }
    } catch {
      // Fallback avec priorités de la thèse
      const content = rawContent.toUpperCase();

      // Priorité 1: ENGAGEMENT
      if (content.includes("ENGAGEMENT")) label = "ENGAGEMENT";
      // Priorité 2: OUVERTURE
      else if (content.includes("OUVERTURE")) label = "OUVERTURE";
      // Priorité 3: REFLET (avec sous-types)
      else if (content.includes("REFLET_VOUS")) label = "REFLET_VOUS";
      else if (content.includes("REFLET_JE")) label = "REFLET_JE";
      else if (content.includes("REFLET_ACQ")) label = "REFLET_ACQ";
      else if (content.includes("REFLET")) label = "REFLET_ACQ"; // par défaut
      // Priorité 4: EXPLICATION
      else if (content.includes("EXPLICATION")) label = "EXPLICATION";
    }

    return {
      prediction: label,
      confidence: label === "AUTRE_NON_RECONNU" ? 0.25 : 0.85,
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
          parseMethod: label !== "AUTRE_NON_RECONNU" ? "success" : "fallback",
        },
        raw: data,
      },
    };
  }

  private applyHierarchicalRules(label: string, verbatim: string): string {
    // Vérification de cohérence avec les règles de la thèse
    const cleanVerbatim = verbatim.toLowerCase();

    // Force ENGAGEMENT si verbe d'action + "je"
    if (
      (cleanVerbatim.includes("je vais") ||
        cleanVerbatim.includes("je fais") ||
        cleanVerbatim.includes("je vérifie")) &&
      label !== "ENGAGEMENT"
    ) {
      return "ENGAGEMENT";
    }

    // Force OUVERTURE si instruction client
    if (
      (cleanVerbatim.includes("vous allez") ||
        cleanVerbatim.includes("veuillez") ||
        cleanVerbatim.includes("il faut que vous")) &&
      !["ENGAGEMENT", "OUVERTURE"].includes(label)
    ) {
      return "OUVERTURE";
    }

    return label;
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

  // Prompt OpenAI optimisé basé sur l'analyse du corpus réel
  // Ajouter cette méthode dans votre classe OpenAIXClassifier

  // Version debug simplifiée - compatible avec votre JSON schema

  // Prompt amélioré v2 - basé sur les erreurs observées

  // Prompt basé sur la logique linguistique et pragmatique

  private buildMessages(verbatim: string) {
    return [
      {
        role: "system",
        content: `Tu es un expert en classification des stratégies linguistiques des conseillers en centre de contact.

RÈGLE FONDAMENTALE - HIÉRARCHIE DE PRIORITÉ :
1. ENGAGEMENT > 2. OUVERTURE > 3. REFLET > 4. EXPLICATION

Si plusieurs fonctions coexistent, choisis TOUJOURS la plus haute dans cette hiérarchie.

CATÉGORIES ET MARQUEURS PRIORITAIRES :

🎯 ENGAGEMENT (PRIORITÉ 1) - Action du conseiller
MARQUEURS FORTS : "je vais/fais/vérifie/transfère/m'occupe", "je suis en train de", futur 1ère personne
LOGIQUE : Le conseiller annonce une action concrète qu'il réalise
- "D'accord, je vais vérifier votre dossier" → ENGAGEMENT (action prime sur acquiescement)
- "Je comprends, je transfère maintenant" → ENGAGEMENT (action prime sur empathie)

🎯 OUVERTURE (PRIORITÉ 2) - Action du client  
MARQUEURS FORTS : "vous allez/recevrez/pourrez/devrez", impératifs ("précisez", "envoyez"), "veuillez", "il faut que vous"
LOGIQUE : Le conseiller oriente le client vers une action
- "Vous pouvez aller sur le site parce que..." → OUVERTURE (instruction prime sur explication)
- "Il faut préciser l'heure et la station" → OUVERTURE

🎯 REFLET (PRIORITÉ 3) - Reformulation/Acquiescement
SOUS-TYPES par efficacité décroissante :
- REFLET_VOUS : description client SANS instruction/justification ("Je vois que vous avez appelé")
- REFLET_JE : état mental conseiller ("je comprends/vois/entends")  
- REFLET_ACQ : micro-tours ≤20 chars ("oui", "d'accord", "ok")
EXCLUSIONS : si données chiffrées ou marqueurs instruction/explication → pas REFLET

🎯 EXPLICATION (PRIORITÉ 4) - Justification/Procédure
MARQUEURS : "parce que", "car", "le système fonctionne", "notre politique", "c'est pour ça que"
LOGIQUE : Justification institutionnelle sans action concrète
- "Notre système fonctionne en trois étapes" → EXPLICATION
- "C'est normal/faux" (correction normative) → EXPLICATION

RÈGLES DE DÉPARTAGE CRITIQUES :
- Action présente → ENGAGEMENT/OUVERTURE même si acquiescement en début
- Instruction client → OUVERTURE même si justification après
- Données chiffrées/quantifications → EXPLICATION (pas REFLET)
- Micro-tour seul → REFLET_ACQ, mais si suivi d'instruction → prendre l'ensemble`,
      },

      // Exemples avec cas limites de la thèse
      { role: "user", content: "D'accord, je vais faire le nécessaire" },
      { role: "assistant", content: '{"label": "ENGAGEMENT"}' },

      {
        role: "user",
        content: "Vous pouvez aller sur le site parce que c'est plus rapide",
      },
      { role: "assistant", content: '{"label": "OUVERTURE"}' },

      { role: "user", content: "Je comprends, mais je vais vérifier" },
      { role: "assistant", content: '{"label": "ENGAGEMENT"}' },

      // Cas piège REFLET
      { role: "user", content: "Je vois que vous avez déjà appelé hier" },
      { role: "assistant", content: '{"label": "REFLET_VOUS"}' },

      { role: "user", content: "Je vois que vous avez reçu 1504,29 €" },
      { role: "assistant", content: '{"label": "EXPLICATION"}' },

      { role: "user", content: "Il faut bien préciser l'heure et la station" },
      { role: "assistant", content: '{"label": "OUVERTURE"}' },

      // Instance à classer
      { role: "user", content: verbatim.trim() },
    ];
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
