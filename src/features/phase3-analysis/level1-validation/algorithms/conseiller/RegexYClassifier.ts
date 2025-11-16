// algorithms/level1/YAlgorithms/RegexYClassifier.ts
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base";
import type {
  VariableY,
  YTag,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

type YConfig = {
  seuilPositif: number;
  seuilNegatif: number;
  poidsExpressions: number;
  poidsMots: number;
};

export class RegexYClassifier implements UniversalAlgorithm {
  private config: YConfig;

  constructor(config: Partial<YConfig> = {}) {
    this.config = {
      seuilPositif: config.seuilPositif ?? 0.6,
      seuilNegatif: config.seuilNegatif ?? 0.4,
      poidsExpressions: config.poidsExpressions ?? 2.0,
      poidsMots: config.poidsMots ?? 1.0,
    };
  }

  // ========================================================================
  // ✅ INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: "RegexYClassifier",
      displayName: "Règles – Y (client)",
      version: "1.0.0",
      type: "rule-based",
      target: "Y",
      batchSupported: true,
      requiresContext: false,
      description:
        "Classification des réactions client (positif / neutre / négatif) par dictionnaires pondérés (expressions + mots).",
      examples: [
        {
          input: "d'accord merci beaucoup",
          output: { prediction: "CLIENT_POSITIF", confidence: 0.8 },
          note: "Expressions et mots positifs détectés",
        },
      ],
    };
  }

  validateConfig(): boolean {
    const c = this.config;
    return (
      typeof c.seuilPositif === "number" &&
      typeof c.seuilNegatif === "number" &&
      typeof c.poidsExpressions === "number" &&
      typeof c.poidsMots === "number"
    );
  }

  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input);
    const startTime = Date.now();

    try {
      // ✅ APPEL DE LA LOGIQUE EXISTANTE
      const result = this.performYClassification(verbatim);

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "Y",
          inputType: "string",
          executionPath: ["sanitize", "dictionary_analysis", "classification"],
          // ✅ STRUCTURE ATTENDUE PAR L'ADAPTATEUR
          details: {
            family: this.familyFromY(result.prediction),
            evidences: result.evidences || [],
            cues: result.matched || [],
            scores: result.scores,
            method: "dictionary-weighted",
          },
        },
      };
    } catch (e: any) {
      return {
        prediction: "CLIENT_NEUTRE",
        confidence: 0,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "Y",
          inputType: "string",
          executionPath: ["error"],
          details: {
            family: "CLIENT",
            evidences: [],
          },
          error: String(e?.message ?? e),
        },
      };
    }
  }

  async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
    return Promise.all(inputs.map((input) => this.run(input)));
  }

  // ========================================================================
  // ✅ TOUTE LA LOGIQUE MÉTIER EXISTANTE (100% INCHANGÉE)
  // ========================================================================

  private performYClassification(verbatim: string): {
    prediction: YTag;
    confidence: number;
    evidences: string[];
    matched: string[];
    scores: Record<YTag, number>;
  } {
    const text = this.sanitize(verbatim);
    if (!text) {
      return {
        prediction: "CLIENT_NEUTRE",
        confidence: 0.5,
        evidences: [],
        matched: [],
        scores: this.getEmptyScores(),
      };
    }

    // ✅ SCORES POUR TOUS LES YTAG
    const scores: Record<YTag, number> = {
      CLIENT_POSITIF: this.calculateScore(
        text,
        this.dictionnaires.CLIENT_POSITIF
      ),
      CLIENT_NEGATIF: this.calculateScore(
        text,
        this.dictionnaires.CLIENT_NEGATIF
      ),
      CLIENT_NEUTRE: this.calculateScore(
        text,
        this.dictionnaires.CLIENT_NEUTRE
      ),
      CLIENT_QUESTION: this.calculateScore(
        text,
        this.dictionnaires.CLIENT_QUESTION
      ),
      CLIENT_SILENCE: this.calculateScore(
        text,
        this.dictionnaires.CLIENT_SILENCE
      ),
      AUTRE_Y: this.calculateScore(text, this.dictionnaires.AUTRE_Y),
    };

    const { prediction, confidence, matched } = this.pickPrediction(
      text,
      scores
    );

    return {
      prediction,
      confidence,
      evidences: matched[prediction] || [],
      matched: Object.values(matched).flat(),
      scores,
    };
  }

  // Helper pour déterminer la famille
  private familyFromY(label: YTag): string {
    // Toutes les réactions clients appartiennent à la famille "CLIENT"
    return "CLIENT";
  }

  private getEmptyScores(): Record<YTag, number> {
    return {
      CLIENT_POSITIF: 0,
      CLIENT_NEGATIF: 0,
      CLIENT_NEUTRE: 0,
      CLIENT_QUESTION: 0,
      CLIENT_SILENCE: 0,
      AUTRE_Y: 0,
    };
  }

  // ✅ GARDE TOUT LE CODE EXISTANT (dictionnaires, sanitize, etc.)

  private sanitize(verbatim: string): string {
    return (verbatim || "")
      .replace(/\[(?:TC|AP)\]/gi, " ")
      .replace(/\(\.\.\.\)/g, " ")
      .replace(/[']/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  private dictionnaires: Record<
    YTag,
    { expressions: string[]; mots: string[] }
  > = {
    CLIENT_POSITIF: {
      expressions: [
        "d'accord",
        "parfait",
        "très bien",
        "merci beaucoup",
        "c'est parfait",
        "ça marche",
        "pas de problème",
        "ok",
        "super",
        "génial",
        "excellent",
        "formidable",
        "c'est bon",
      ],
      mots: [
        "oui",
        "bien",
        "parfait",
        "merci",
        "accord",
        "ok",
        "super",
        "génial",
        "excellent",
        "satisfait",
        "content",
        "parfaitement",
        "absolument",
        "certainement",
        "volontiers",
      ],
    },
    CLIENT_NEGATIF: {
      expressions: [
        "pas d'accord",
        "c'est pas possible",
        "n'importe quoi",
        "c'est inadmissible",
        "je refuse",
        "hors de question",
        "c'est inacceptable",
        "je ne peux pas",
        "impossible",
      ],
      mots: [
        "non",
        "pas",
        "jamais",
        "impossible",
        "refuse",
        "contre",
        "mal",
        "problème",
        "ennui",
        "difficile",
        "compliqué",
        "inacceptable",
        "inadmissible",
        "scandaleux",
        "énervé",
      ],
    },
    CLIENT_NEUTRE: {
      expressions: [
        "je ne sais pas",
        "peut-être",
        "on verra",
        "je vais réfléchir",
        "c'est possible",
        "pourquoi pas",
        "je vais voir",
        "à voir",
      ],
      mots: [
        "peut-être",
        "possible",
        "voir",
        "réfléchir",
        "penser",
        "sais",
        "comprendre",
        "expliquer",
        "détail",
        "information",
        "précision",
        "question",
        "demande",
        "besoin",
      ],
    },
    CLIENT_QUESTION: {
      expressions: [
        "comment ça",
        "c'est quoi",
        "qu'est-ce que",
        "comment faire",
        "j'aimerais savoir",
        "pouvez-vous m'expliquer",
        "est-ce que",
        "comment ça marche",
      ],
      mots: [
        "comment",
        "pourquoi",
        "quoi",
        "qui",
        "quand",
        "où",
        "combien",
        "quel",
        "quelle",
        "question",
        "demande",
        "expliquer",
        "préciser",
        "savoir",
      ],
    },
    CLIENT_SILENCE: {
      expressions: [
        "...",
        "(silence)",
        "[silence]",
        "euh...",
        "heu...",
        "ben...",
      ],
      mots: ["euh", "heu", "ben", "hmm", "ah", "oh", "silence", "pause"],
    },
    AUTRE_Y: {
      expressions: [
        "je dois raccrocher",
        "ce n'est pas le sujet",
        "autre chose",
        "pas de rapport",
      ],
      mots: [
        "autre",
        "différent",
        "ailleurs",
        "raccrocher",
        "partir",
        "finir",
        "terminer",
        "changer",
      ],
    },
  };

  private calculateScore(
    text: string,
    dictionary: { expressions: string[]; mots: string[] }
  ): number {
    let score = 0;
    let totalWeight = 0;

    // expressions (pondérées)
    for (const expr of dictionary.expressions) {
      if (text.includes(expr.toLowerCase())) {
        score += this.config.poidsExpressions;
      }
      totalWeight += this.config.poidsExpressions;
    }

    // mots isolés (pondérés, occurrences multiples)
    for (const mot of dictionary.mots) {
      const regex = new RegExp(
        `\\b${this.escapeRegex(mot.toLowerCase())}\\b`,
        "g"
      );
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * this.config.poidsMots;
      }
      totalWeight += this.config.poidsMots;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private pickPrediction(
    text: string,
    scores: Record<YTag, number>
  ): {
    prediction: YTag;
    confidence: number;
    matched: Record<YTag, string[]>;
  } {
    // Détection spéciale pour SILENCE (patterns très spécifiques)
    if (scores.CLIENT_SILENCE > 0.5) {
      return {
        prediction: "CLIENT_SILENCE",
        confidence: scores.CLIENT_SILENCE,
        matched: this.getAllMatches(text),
      };
    }

    // Détection spéciale pour QUESTION (patterns interrogatifs)
    if (scores.CLIENT_QUESTION > 0.4) {
      return {
        prediction: "CLIENT_QUESTION",
        confidence: scores.CLIENT_QUESTION,
        matched: this.getAllMatches(text),
      };
    }

    // Logique originale (priorité NÉGATIF > POSITIF > NEUTRE)
    let prediction: YTag = "CLIENT_NEUTRE";
    if (scores.CLIENT_NEGATIF >= this.config.seuilNegatif) {
      prediction = "CLIENT_NEGATIF";
    } else if (scores.CLIENT_POSITIF >= this.config.seuilPositif) {
      prediction = "CLIENT_POSITIF";
    } else if (scores.AUTRE_Y > 0.3) {
      prediction = "AUTRE_Y";
    } else {
      prediction = "CLIENT_NEUTRE";
    }

    const confidence = Math.max(...Object.values(scores));

    return {
      prediction,
      confidence,
      matched: this.getAllMatches(text),
    };
  }

  private getAllMatches(text: string): Record<YTag, string[]> {
    const matched: Record<YTag, string[]> = {
      CLIENT_POSITIF: this.getMatches(text, this.dictionnaires.CLIENT_POSITIF),
      CLIENT_NEGATIF: this.getMatches(text, this.dictionnaires.CLIENT_NEGATIF),
      CLIENT_NEUTRE: this.getMatches(text, this.dictionnaires.CLIENT_NEUTRE),
      CLIENT_QUESTION: this.getMatches(
        text,
        this.dictionnaires.CLIENT_QUESTION
      ),
      CLIENT_SILENCE: this.getMatches(text, this.dictionnaires.CLIENT_SILENCE),
      AUTRE_Y: this.getMatches(text, this.dictionnaires.AUTRE_Y),
    };

    return matched;
  }

  private getMatches(
    text: string,
    dict: { expressions: string[]; mots: string[] }
  ): string[] {
    const hits: string[] = [];

    for (const expr of dict.expressions) {
      if (text.includes(expr.toLowerCase())) hits.push(expr);
    }

    for (const mot of dict.mots) {
      const regex = new RegExp(
        `\\b${this.escapeRegex(mot.toLowerCase())}\\b`,
        "g"
      );
      if (regex.test(text)) hits.push(mot);
    }

    return hits;
  }

  private escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
