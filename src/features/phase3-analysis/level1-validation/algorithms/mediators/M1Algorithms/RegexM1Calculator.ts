import { BaseM1Calculator } from "./shared/BaseM1Calculator";
import type {
  M1Input,
  CalculationResult,
  CalculationMetadata,
} from "@/types/algorithm-lab";
import type { M1Details } from "@/types/algorithm-lab";

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
  getMetadata(): CalculationMetadata {
    return {
      // ✅ CORRECTION: Utiliser les propriétés correctes de CalculationMetadata
      id: "RegexM1Calculator",
      label: "M1 Regex Calculator", // 'label' au lieu de 'name'
      target: "M1", // Ajouter target requis
      algorithmKind: "rule-based", // Ajouter algorithmKind requis
      version: "0.2.0",
      // 'description' et 'type' n'existent pas dans CalculationMetadata
      tags: ["regex", "action-verbs", "density"],
    };
  }

  validateConfig(): boolean {
    return REGEXES.length > 0;
  }

  async calculate(input: M1Input): Promise<CalculationResult<M1Details>> {
    const start = performance.now();
    const { verbatim } = input;
    const tokens = tokenize(verbatim);
    const totalWords = tokens.length;

    // Détection par regex (grossier mais rapide)
    const detectedChunks: string[] = [];
    for (const rx of REGEXES) {
      const m = verbatim.match(rx);
      if (m) detectedChunks.push(m[0]);
    }

    // ✅ CORRECTION: Créer une structure compatible avec M1Details
    const detectedVerbs: string[] = [];
    tokens.forEach((t) => {
      if (ACTION_VERBS.includes(t)) {
        detectedVerbs.push(t);
      }
    });

    // Renforcer la confiance si un token appartient à un match regex
    const verbSet = new Set(
      detectedChunks.join(" ").toLowerCase().split(/\s+/)
    );

    const verbCount = detectedVerbs.length;
    const density = totalWords > 0 ? verbCount / totalWords : 0;

    // Score simple = clamp( densité * facteur_regex )
    const regexBoost = detectedChunks.length > 0 ? 1.2 : 1.0;
    const raw = density * regexBoost;
    const score = Math.max(0, Math.min(1, raw));

    const processingTime = performance.now() - start;

    // ✅ CORRECTION: Utiliser les propriétés définies dans M1Details
    const details: M1Details = {
      // Propriétés de base existantes
      value: score,
      actionVerbCount: verbCount,
      totalTokens: totalWords,
      verbsFound: detectedVerbs,

      // Propriétés enrichies existantes
      score,
      verbCount,
      averageWordLength: totalWords > 0 ? verbatim.length / totalWords : 0,
      sentenceComplexity: density, // Approximation
      lexicalDiversity: new Set(tokens).size / Math.max(1, totalWords),
      syntacticComplexity: detectedChunks.length / Math.max(1, totalWords),
      semanticCoherence: score, // Approximation
    };

    // ✅ CORRECTION: Retourner CalculationResult complet avec toutes les propriétés requises
    return {
      prediction:
        score > 0.7
          ? "HIGH_COMPLEXITY"
          : score > 0.3
          ? "MEDIUM_COMPLEXITY"
          : "LOW_COMPLEXITY",
      confidence: Math.min(0.95, 0.4 + score * 0.5),
      processingTime,
      details,
      metadata: {
        algorithmVersion: "0.2.0",
        inputSignature: verbatim.slice(0, 20),
        executionPath: ["tokenize", "regex_match", "verb_detection", "scoring"],
        warnings: totalWords === 0 ? ["Input vide"] : undefined,
        extra: {
          detectedChunks,
          density,
          regexBoost,
          raw,
          totalWords,
          verbCount,
        },
      },
    };
  }
}

export default RegexM1Calculator;
