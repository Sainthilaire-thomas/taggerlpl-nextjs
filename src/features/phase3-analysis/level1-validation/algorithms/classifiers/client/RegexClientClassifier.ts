// algorithms/level1/AlgorithmeClassificationClient.ts - VERSION CORRIGÉE
export class RegexClientClassifier {
  private config: Record<string, any>;

  constructor(config: Record<string, any> = {}) {
    this.config = {
      seuilPositif: config.seuilPositif || 0.6,
      seuilNegatif: config.seuilNegatif || 0.4,
      poidsExpressions: config.poidsExpressions || 2.0,
      poidsMots: config.poidsMots || 1.0,
      ...config,
    };
  }

  private dictionnaires = {
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

  classify(verbatim: string): { prediction: string; confidence: number } {
    const text = verbatim.toLowerCase().trim();

    if (!text) {
      return { prediction: "CLIENT_NEUTRE", confidence: 0.5 };
    }

    const scores: Record<string, number> = {
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

    const maxScore = Math.max(...Object.values(scores));
    let prediction =
      Object.keys(scores).find((key) => scores[key] === maxScore) ||
      "CLIENT_NEUTRE";

    // Logique de seuils avec priorité
    if (scores.CLIENT_NEGATIF >= this.config.seuilNegatif) {
      prediction = "CLIENT_NEGATIF";
    } else if (scores.CLIENT_POSITIF >= this.config.seuilPositif) {
      prediction = "CLIENT_POSITIF";
    } else {
      prediction = "CLIENT_NEUTRE";
    }

    return { prediction, confidence: maxScore };
  }

  private calculateScore(
    text: string,
    dictionary: { expressions: string[]; mots: string[] }
  ): number {
    let score = 0;
    let totalWeight = 0;

    dictionary.expressions.forEach((expr) => {
      if (text.includes(expr.toLowerCase())) {
        score += this.config.poidsExpressions;
      }
      totalWeight += this.config.poidsExpressions;
    });

    dictionary.mots.forEach((mot) => {
      const regex = new RegExp(`\\b${mot.toLowerCase()}\\b`, "g");
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * this.config.poidsMots;
      }
      totalWeight += this.config.poidsMots;
    });

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  getParameters(): Record<string, any> {
    return this.config;
  }

  updateParameters(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// utils/metricsCalculation.ts - VERSION CORRIGÉE
import { AlgorithmResult, ValidationMetrics } from "@/types/algorithm-lab";

export function calculateValidationMetrics(
  results: AlgorithmResult[]
): ValidationMetrics {
  const totalSamples = results.length;
  const correctPredictions = results.filter((r) => r.correct).length;
  const accuracy = totalSamples > 0 ? correctPredictions / totalSamples : 0;

  // Obtenir toutes les classes uniques
  const allClasses = Array.from(
    new Set([
      ...results.map((r) => r.predicted),
      ...results.map((r) => r.goldStandard),
    ])
  );

  // Calculer précision, rappel et F1 pour chaque classe
  const precision: Record<string, number> = {};
  const recall: Record<string, number> = {};
  const f1Score: Record<string, number> = {};
  const confusionMatrix: Record<string, Record<string, number>> = {};

  // Initialiser la matrice de confusion
  allClasses.forEach((predicted) => {
    confusionMatrix[predicted] = {};
    allClasses.forEach((actual) => {
      confusionMatrix[predicted][actual] = 0;
    });
  });

  // Remplir la matrice de confusion
  results.forEach((result) => {
    confusionMatrix[result.predicted][result.goldStandard]++;
  });

  // Calculer les métriques pour chaque classe
  allClasses.forEach((cls) => {
    // True Positives, False Positives, False Negatives
    const tp = confusionMatrix[cls][cls] || 0;
    const fp = Object.keys(confusionMatrix[cls])
      .filter((k) => k !== cls)
      .reduce((sum, k) => sum + (confusionMatrix[cls][k] || 0), 0);
    const fn = Object.keys(confusionMatrix)
      .filter((k) => k !== cls)
      .reduce((sum, k) => sum + (confusionMatrix[k][cls] || 0), 0);

    // Calculer précision et rappel
    precision[cls] = tp + fp > 0 ? tp / (tp + fp) : 0;
    recall[cls] = tp + fn > 0 ? tp / (tp + fn) : 0;
    f1Score[cls] =
      precision[cls] + recall[cls] > 0
        ? (2 * (precision[cls] * recall[cls])) / (precision[cls] + recall[cls])
        : 0;
  });

  // Calculer le Kappa de Cohen
  const kappa = calculateCohenKappa(results);

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix,
    totalSamples,
    correctPredictions,
    kappa,
  };
}

function calculateCohenKappa(results: AlgorithmResult[]): number {
  const n = results.length;
  if (n === 0) return 0;

  // Obtenir toutes les classes
  const classes = Array.from(
    new Set([
      ...results.map((r) => r.predicted),
      ...results.map((r) => r.goldStandard),
    ])
  );

  // Matrice de confusion
  const matrix: Record<string, Record<string, number>> = {};
  classes.forEach((c1) => {
    matrix[c1] = {};
    classes.forEach((c2) => {
      matrix[c1][c2] = 0;
    });
  });

  results.forEach((r) => {
    matrix[r.predicted][r.goldStandard]++;
  });

  // Po (accord observé)
  const po = results.filter((r) => r.correct).length / n;

  // Pe (accord attendu par hasard)
  let pe = 0;
  classes.forEach((cls) => {
    const marginalPredicted =
      classes.reduce((sum, c) => sum + (matrix[cls][c] || 0), 0) / n;
    const marginalActual =
      classes.reduce((sum, c) => sum + (matrix[c][cls] || 0), 0) / n;
    pe += marginalPredicted * marginalActual;
  });

  // Kappa = (Po - Pe) / (1 - Pe)
  return pe === 1 ? 0 : (po - pe) / (1 - pe);
}
