// algorithms/level1/YAlgorithms/RegexYClassifier.ts
import type { BaseAlgorithm, AlgorithmMetadata } from "../shared/BaseAlgorithm";
import type { VariableY } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

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
      .replace(/[’]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // ---------------- Dictionnaires
  private dictionnaires: Record<
    VariableY,
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

      const scores: Record<VariableY, number> = {
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

  private pickPrediction(
    text: string,
    scores: Record<VariableY, number>
  ): {
    prediction: VariableY;
    confidence: number;
    matched: Record<VariableY, string[]>;
  } {
    // Décision par seuils (priorité NÉGATIF > POSITIF > NEUTRE)
    let prediction: VariableY = "CLIENT_NEUTRE";
    if (scores.CLIENT_NEGATIF >= this.config.seuilNegatif) {
      prediction = "CLIENT_NEGATIF";
    } else if (scores.CLIENT_POSITIF >= this.config.seuilPositif) {
      prediction = "CLIENT_POSITIF";
    } else {
      prediction = "CLIENT_NEUTRE";
    }

    const confidence = Math.max(
      scores.CLIENT_POSITIF,
      scores.CLIENT_NEGATIF,
      scores.CLIENT_NEUTRE
    );

    const matched: Record<VariableY, string[]> = {
      CLIENT_POSITIF: this.getMatches(text, this.dictionnaires.CLIENT_POSITIF),
      CLIENT_NEGATIF: this.getMatches(text, this.dictionnaires.CLIENT_NEGATIF),
      CLIENT_NEUTRE: this.getMatches(text, this.dictionnaires.CLIENT_NEUTRE),
    };

    return { prediction, confidence, matched };
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
