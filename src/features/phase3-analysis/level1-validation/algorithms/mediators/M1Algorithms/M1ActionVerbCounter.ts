// algorithms/level1/M1Algorithms/M1ActionVerbCounter.ts
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base";

/**
 * M1 = densité de verbes d'action dans le tour conseiller (T0).
 * Heuristique "sans dépendance NLP": dictionnaire de verbes d'action + motifs simples.
 *
 * ✅ Migré vers UniversalAlgorithm - Version Propre
 */
type Config = {
  perTokens: number; // normalisation (ex. pour 100 tokens)
  includeFutureProche: boolean; // "aller + infinitif"
  includePeriphrases: boolean; // "en train de + infinitif"
  customVerbs?: string[]; // permet d'ajouter des verbes métier
  excludeAuxiliaries: boolean; // exclure être/avoir/pouvoir/devoir/falloir
};

export class M1ActionVerbCounter implements UniversalAlgorithm {
  private currentConfig: Config = {
    perTokens: 100,
    includeFutureProche: true,
    includePeriphrases: true,
    excludeAuxiliaries: true,
  };

  // Dictionnaire minimal de verbes d'action fréquents (lemme)
  private baseActionLemmas = new Set<string>([
    "verifier",
    "envoyer",
    "transmettre",
    "traiter",
    "regarder",
    "chercher",
    "noter",
    "ouvrir",
    "fermer",
    "mettre",
    "donner",
    "prendre",
    "appeler",
    "rappeler",
    "relancer",
    "contacter",
    "activer",
    "bloquer",
    "debloquer",
    "modifier",
    "mettre_a_jour",
    "valider",
    "annuler",
    "signaler",
    "deposer",
    "declencher",
    "renvoyer",
    "reexpedier",
    "rembourser",
    "commander",
    "saisir",
    "connecter",
    "installer",
    "reinstaller",
    "telecharger",
    "imprimer",
    "scanner",
    "transferer",
    "consulter",
    "analyser",
    "creer",
    "supprimer",
    "remplacer",
    "corriger",
    "verrouiller",
    "deverrouiller",
    "remonter",
    "escalader",
    "planifier",
    "programmer",
    "verbaliser",
    "encoder",
    "tester",
    "lancer",
    "relire",
    "confirmer",
  ]);

  // ========================================================================
  // ✅ INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: "M1ActionVerbCounter",
      displayName: "M1 — Densité de verbes d'action",
      version: "1.0.0",
      type: "metric",
      target: "M1",
      batchSupported: true,
      requiresContext: false,
      description:
        "Compte les verbes d'action dans le tour conseiller et renvoie une densité normalisée.",
      examples: [
        {
          input: "je vais vérifier votre dossier et traiter votre demande",
          output: { prediction: "25.00", confidence: 0.7 },
          note: "2 verbes d'action sur 8 tokens = 25/100 tokens",
        },
      ],
    };
  }

  validateConfig(): boolean {
    return this.currentConfig.perTokens > 0;
  }

  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input);
    const startTime = Date.now();
    console.log("🔍 M1 input reçu:", verbatim);

    // ✅ APPEL DE LA LOGIQUE EXISTANTE (inchangée)
    const result = this.calculateM1Score(verbatim);
    console.log("🔍 M1 result calculé:", result);

    // ✅ CONVERSION VERS UNIVERSALRESULT
    return {
      prediction: result.prediction,
      confidence: result.confidence,
      processingTime: Date.now() - startTime,
      algorithmVersion: "1.0.0",
      metadata: {
        target: "M1",
        inputType: "string",
        executionPath: ["tokenize", "lemmatize", "count_verbs", "normalize"],
        // Métadonnées M1 directement accessibles
        densityPer: result.metadata.densityPer,
        density: result.metadata.density,
        actionVerbCount: result.metadata.actionVerbCount,
        totalTokens: result.metadata.totalTokens,
        verbsFound: result.metadata.verbsFound,
        // Données supplémentaires pour l'UI
        metric: "M1",
        algorithm: "M1ActionVerbCounter",
      },
    };
  }

  // ✅ SUPPORT BATCH OPTIONNEL
  async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
    return Promise.all(inputs.map((input) => this.run(input)));
  }

  // ========================================================================
  // ✅ TOUTE LA LOGIQUE MÉTIER EXISTANTE (100% INCHANGÉE)
  // ========================================================================

  getConfig() {
    return { ...this.currentConfig };
  }

  updateConfig(next: Partial<Config>) {
    this.currentConfig = { ...this.currentConfig, ...next };
  }

  private normalize(text: string) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, ""); // retire accents
  }

  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(/[^a-zàâäéèêëîïôöùûüç'_]+/i)
      .filter(Boolean);
  }

  private isAuxiliary(lemma: string) {
    return ["etre", "avoir", "pouvoir", "devoir", "falloir"].includes(lemma);
  }

  private guessLemma(token: string): string {
    // ultra-simple: garde l'infinitif si on le voit, sinon rapprochements communs
    // (on couvre beaucoup de formes 1ps/2ps/3ps/pp futur simple des -er/-ir/-re)
    const t = token;
    if (/^(?:se|s')?([a-z]+)er$/.test(t)) return t.replace(/^s'|^se/, "");
    if (/^(?:se|s')?([a-z]+)ir$/.test(t)) return t.replace(/^s'|^se/, "");
    if (/^(?:se|s')?([a-z]+)re$/.test(t)) return t.replace(/^s'|^se/, "");
    if (/^(?:se|s')?([a-z]+)oir$/.test(t)) return t.replace(/^s'|^se/, "");

    // terminaisons fréquentes (présent 1/2/3p sg -er)
    if (/(e|es|ons|ez|ent)$/.test(t))
      return t.replace(/(e|es|ons|ez|ent)$/, "er");
    // -ir
    if (/(is|it|issons|issez|issent)$/.test(t))
      return t.replace(/(is|it|issons|issez|issent)$/, "ir");
    // -re
    if (/(s|t|ons|ez|ent)$/.test(t) && t.length > 3)
      return t.replace(/(s|t|ons|ez|ent)$/, "re");

    // participes / passé composés très fréquents
    if (/(é|ee|ees|es)$/.test(t)) return t.replace(/(é|ee|ees|es)$/, "er");
    if (/(i|ie|ies)$/.test(t)) return t.replace(/(i|ie|ies)$/, "ir");
    if (/(u|ue|ues)$/.test(t)) return t.replace(/(u|ue|ues)$/, "re");

    return t;
  }

  private detectFutureProche(tokens: string[]): number {
    // "aller + infinitif" (je/tu/il/nous/vous/ils) + infinitif
    let count = 0;
    for (let i = 0; i < tokens.length - 1; i++) {
      if (/^(vais|vas|va|allons|allez|vont)$/.test(tokens[i])) {
        const next = tokens[i + 1];
        if (/^[a-z]+er$|^[a-z]+ir$|^[a-z]+re$|^[a-z]+oir$/.test(next)) count++;
      }
    }
    return count;
  }

  private detectPeriphrases(tokens: string[]): number {
    // "en train de + infinitif"
    let count = 0;
    for (let i = 0; i < tokens.length - 2; i++) {
      if (
        tokens[i] === "en" &&
        tokens[i + 1] === "train" &&
        tokens[i + 2] === "de"
      ) {
        const inf = tokens[i + 3];
        if (inf && /^[a-z]+er$|^[a-z]+ir$|^[a-z]+re$|^[a-z]+oir$/.test(inf))
          count++;
      }
    }
    return count;
  }

  private countActionVerbs(text: string) {
    const cfg = this.currentConfig;
    const tokens = this.tokenize(text);
    const lemmasFound: string[] = [];

    for (const tok of tokens) {
      const lemma = this.guessLemma(tok);
      if (cfg.excludeAuxiliaries && this.isAuxiliary(lemma)) continue;

      const inDict =
        this.baseActionLemmas.has(lemma) ||
        (cfg.customVerbs?.some((v) => v === lemma) ?? false);

      if (inDict) lemmasFound.push(lemma);
    }

    // motifs périphrastiques
    if (cfg.includeFutureProche) {
      const n = this.detectFutureProche(tokens);
      for (let i = 0; i < n; i++) lemmasFound.push("aller+inf");
    }
    if (cfg.includePeriphrases) {
      const n = this.detectPeriphrases(tokens);
      for (let i = 0; i < n; i++) lemmasFound.push("periphrase+inf");
    }

    const totalTokens = tokens.length || 1;
    const per = cfg.perTokens;
    const density = (lemmasFound.length / totalTokens) * per;

    return {
      totalTokens,
      actionVerbCount: lemmasFound.length,
      densityPer: per,
      density, // ex. "verbes d'action pour 100 tokens"
      verbs: lemmasFound,
    };
  }

  private calculateM1Score(text: string) {
    const c = this.countActionVerbs(text || "");
    return {
      prediction: `${c.density.toFixed(2)}`, // valeur lisible
      confidence: Math.min(1, 0.5 + Math.min(0.5, c.actionVerbCount / 10)), // proxy simple
      metadata: {
        metric: "M1",
        densityPer: c.densityPer,
        density: c.density,
        actionVerbCount: c.actionVerbCount,
        totalTokens: c.totalTokens,
        verbsFound: c.verbs,
      },
    };
  }
}
