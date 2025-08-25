// utils/metricsCalculation.ts
import { AlgorithmResult, ValidationMetrics } from "../types/Level1Types";

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
