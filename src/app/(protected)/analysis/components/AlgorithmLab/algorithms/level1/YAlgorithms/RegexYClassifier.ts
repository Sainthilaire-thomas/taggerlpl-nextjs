// algorithms/level1/YAlgorithms/RegexYClassifier.ts
import type { BaseAlgorithm, AlgorithmMetadata } from "../shared/BaseAlgorithm";
import type {
  VariableY,
  YTag,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export interface YClassification {
  prediction: VariableY | "ERREUR";
  confidence: number; // [0,1]
  processingTimeMs: number;
  metadata?: Record<string, any>;
}

type YConfig = {
  seuilPositif: number;
  seuilNegatif: number;
  poidsExpressions: number;
  poidsMots: number;
};

export class RegexYClassifier
  implements BaseAlgorithm<string, YClassification>
{
  private config: YConfig;

  constructor(config: Partial<YConfig> = {}) {
    this.config = {
      seuilPositif: config.seuilPositif ?? 0.6,
      seuilNegatif: config.seuilNegatif ?? 0.4,
      poidsExpressions: config.poidsExpressions ?? 2.0,
      poidsMots: config.poidsMots ?? 1.0,
    };
  }

  describe(): AlgorithmMetadata {
    return {
      name: "RegexYClassifier",
      displayName: "Règles – Y (client)",
      type: "rule-based",
      target: "Y",
      version: "1.0.0",
      description:
        "Classification des réactions client (positif / neutre / négatif) par dictionnaires pondérés (expressions + mots).",
      batchSupported: true,
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

  // ---------------- Normalisation
  private sanitize(verbatim: string): string {
    return (verbatim || "")
      .replace(/\[(?:TC|AP)\]/gi, " ")
      .replace(/\(\.\.\.\)/g, " ")
      .replace(/[']/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // ✅ CORRECTION : Dictionnaires complets avec tous les YTag
  private dictionnaires: Record<
    YTag, // Utiliser YTag au lieu de VariableY
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
    // ✅ AJOUT : Tags manquants avec dictionnaires spécialisés
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

  // ---------------- API BaseAlgorithm
  async run(input: string): Promise<YClassification> {
    const start = this.now();
    try {
      const text = this.sanitize(input);
      if (!text) {
        return {
          prediction: "CLIENT_NEUTRE",
          confidence: 0.5,
          processingTimeMs: this.delta(start),
          metadata: { emptyInput: true },
        };
      }

      // ✅ CORRECTION : Scores pour tous les YTag
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
        processingTimeMs: this.delta(start),
        metadata: {
          method: "dictionary-weighted",
          thresholds: {
            positif: this.config.seuilPositif,
            negatif: this.config.seuilNegatif,
          },
          scores,
          matched,
        },
      };
    } catch (e: any) {
      return {
        prediction: "ERREUR",
        confidence: 0,
        processingTimeMs: this.delta(start),
        metadata: { error: String(e?.message ?? e) },
      };
    }
  }

  async runBatch(inputs: string[]): Promise<YClassification[]> {
    return Promise.all(inputs.map((i) => this.run(i)));
  }

  // ---------------- Scoring
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

  // ✅ CORRECTION : Logique de prédiction étendue
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

  // ✅ CORRECTION : Matches pour tous les YTag
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

  private now(): number {
    return typeof performance !== "undefined" &&
      typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  }

  private delta(start: number): number {
    return this.now() - start;
  }
}
