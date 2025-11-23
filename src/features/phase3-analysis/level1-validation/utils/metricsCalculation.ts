import type {
  ValidationRow, // alias de TVValidationResultCore
  ValidationMetrics,
} from "@/types/algorithm-lab";

/**
 * Calcule les métriques globales de validation à partir des lignes de validation.
 * Chaque ligne doit contenir: predicted, goldStandard, correct (boolean), confidence? etc.
 */

function computeKappa(
  confusionMatrix: Record<string, Record<string, number>>
): number {
  const labels = Object.keys(confusionMatrix);
  const n = labels.reduce(
    (sum, p) =>
      sum + labels.reduce((s, g) => s + (confusionMatrix[p][g] || 0), 0),
    0
  );

  if (n === 0) return 0;

  // Observed agreement (Po)
  const diag = labels.reduce((s, c) => s + (confusionMatrix[c][c] || 0), 0);
  const Po = diag / n;

  // Expected agreement (Pe)
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  for (const p of labels) {
    rowTotals[p] = labels.reduce((s, g) => s + (confusionMatrix[p][g] || 0), 0);
  }
  for (const g of labels) {
    colTotals[g] = labels.reduce((s, p) => s + (confusionMatrix[p][g] || 0), 0);
  }
  const Pe = labels.reduce(
    (s, c) => s + (rowTotals[c] * colTotals[c]) / (n * n),
    0
  );

  const denom = 1 - Pe;
  if (denom <= 0) return 0;
  return (Po - Pe) / denom;
}
export function calculateValidationMetrics(
  results: ValidationRow[]
): ValidationMetrics {
  const n = results.length;
  const correct = results.filter((r) => !!r.correct).length;
  const accuracy = n > 0 ? correct / n : 0;

  const labelsSet = new Set<string>();
  for (const r of results) {
    if (r.predicted) labelsSet.add(r.predicted);
    if (r.goldStandard) labelsSet.add(r.goldStandard);
  }
  const labels = Array.from(labelsSet);

  const confusionMatrix: Record<string, Record<string, number>> = {};
  for (const p of labels) {
    confusionMatrix[p] = {};
    for (const g of labels) {
      confusionMatrix[p][g] = 0;
    }
  }
  for (const r of results) {
    if (!r.predicted || !r.goldStandard) continue;
    confusionMatrix[r.predicted][r.goldStandard] += 1;
  }

  const classMetrics: Record<
    string,
    { precision: number; recall: number; f1Score: number; support: number }
  > = {};
  let sumTP = 0,
    sumFP = 0,
    sumFN = 0;

  for (const c of labels) {
    const tp = confusionMatrix[c][c];
    let fp = 0,
      fn = 0;

    for (const g of labels) if (g !== c) fp += confusionMatrix[c][g];
    for (const p of labels) if (p !== c) fn += confusionMatrix[p][c];

    const support = labels.reduce((acc, p) => acc + confusionMatrix[p][c], 0);

    const precisionC = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recallC = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1C =
      precisionC + recallC > 0
        ? (2 * precisionC * recallC) / (precisionC + recallC)
        : 0;

    classMetrics[c] = {
      precision: precisionC,
      recall: recallC,
      f1Score: f1C,
      support,
    };

    sumTP += tp;
    sumFP += fp;
    sumFN += fn;
  }

  const precision = sumTP + sumFP > 0 ? sumTP / (sumTP + sumFP) : 0;
  const recall = sumTP + sumFN > 0 ? sumTP / (sumTP + sumFN) : 0;
  const f1Score =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  const executionTime = results.reduce(
    (s, r) =>
      s +
      (typeof (r as any).processingTime === "number"
        ? (r as any).processingTime
        : 0),
    0
  );

  const kappa = computeKappa(confusionMatrix); // 👈 calcule kappa

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    kappa, // 👈 renseigne kappa
    confusionMatrix,
    classMetrics,
    totalSamples: n,
    correctPredictions: correct,
    executionTime,
  };
}
