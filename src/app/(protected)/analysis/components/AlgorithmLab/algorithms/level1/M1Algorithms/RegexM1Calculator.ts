import { BaseM1Calculator } from "./shared/BaseM1Calculator";
import type {
  M1Input,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/Level1Types";
import type { M1Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types/ThesisVariables";

// ⚠️ Minimaliste : on part sur regex + comptage ; on remplacera par lemmatisation/pos plus tard
const ACTION_VERBS = [
  "prendre",
  "faire",
  "lancer",
  "mettre",
  "envoyer",
  "rappeler",
  "traiter",
  "relancer",
  "ouvrir",
  "clôturer",
  "planifier",
  "vérifier",
  "corriger",
  // variations 1ère pers. futur proche
  "vais",
  "allons",
  "va",
];

const REGEXES = [
  /\b(je|nous|on)\s+(vais|allons|va)\b/i,
  /\b(vais|allons)\s+\b(prendre|faire|envoyer|rappeler|traiter)\b/i,
  /\b(prendre|faire|envoyer|rappeler|traiter|planifier|vérifier|corriger)\b/i,
  /\b(vous)\s+(propose|proposons|invite|conseille)\b/i,
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[.,;:!?()\[\]"]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export class RegexM1Calculator extends BaseM1Calculator {
  getMetadata(): CalculatorMetadata {
    return {
      name: "RegexM1Calculator",
      version: "0.2.0",
      description: "Détection basique des verbes d’action (regex + densité)",
      type: "rule-based",
    };
  }

  validateConfig(): boolean {
    return REGEXES.length > 0;
  }

  async calculate(input: M1Input): Promise<CalculationResult<M1Details>> {
    const { verbatim } = input;
    const tokens = tokenize(verbatim);
    const totalWords = tokens.length;

    // Détection par regex (grossier mais rapide)
    const detectedChunks: string[] = [];
    for (const rx of REGEXES) {
      const m = verbatim.match(rx);
      if (m) detectedChunks.push(m[0]);
    }

    // Détection par liste (approx. verbe)
    const detectedVerbs: M1Details["detectedVerbs"] = [];
    tokens.forEach((t, idx) => {
      if (ACTION_VERBS.includes(t)) {
        detectedVerbs.push({
          verb: t,
          position: idx,
          confidence: 0.6, // placeholder (augmentera si pattern regex autour)
          lemma: t, // placeholder (on mettra la lemmatisation réelle plus tard)
        });
      }
    });

    // Renforcer la confiance si un token appartient à un match regex
    const verbSet = new Set(
      detectedChunks.join(" ").toLowerCase().split(/\s+/)
    );
    for (const dv of detectedVerbs) {
      if (verbSet.has(dv.verb)) dv.confidence = Math.max(dv.confidence, 0.85);
    }

    const verbCount = detectedVerbs.length;
    const density = totalWords > 0 ? verbCount / totalWords : 0;

    // Score simple = clamp( densité * facteur_regex )
    const regexBoost = detectedChunks.length > 0 ? 1.2 : 1.0;
    const raw = density * regexBoost;
    const score = Math.max(0, Math.min(1, raw));

    const details: M1Details = {
      score,
      verbCount,
      totalWords,
      density,
      detectedVerbs,
      // Catégories optionnelles (placeholder à 0 pour le moment)
      verbCategories: { institutional: 0, cognitive: 0, communicative: 0 },
    };

    return { score, details, markers: detectedChunks };
  }
}
