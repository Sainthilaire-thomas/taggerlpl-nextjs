// FineTuningMetrics.ts
import { TVValidationResult } from "../../types";

export type LabelMetrics = {
  label: string;
  support: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
};

export type MetricsSummary = {
  accuracy: number; // 0..1
  correct: number;
  total: number;
  avgProcessingTime: number; // ms
  avgConfidence: number; // 0..1
  kappa: number; // -1..1
  perLabel: LabelMetrics[];
  confusion: Record<string, Record<string, number>>; // pred -> gold -> count
};

export function computeMetrics(results: TVValidationResult[]): MetricsSummary {
  const total = results.length || 0;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = total ? correct / total : 0;

  const avgProcessingTime = total
    ? results.reduce((s, r) => s + (r.processingTime || 0), 0) / total
    : 0;
  const avgConfidence = total
    ? results.reduce((s, r) => s + (r.confidence || 0), 0) / total
    : 0;

  // Classes présentes
  const classes = Array.from(
    new Set([
      ...results.map((r) => r.goldStandard),
      ...results.map((r) => r.predicted),
    ])
  )
    .filter(Boolean)
    .sort();

  // Matrice de confusion
  const confusion: Record<string, Record<string, number>> = {};
  for (const r of results) {
    const p = r.predicted ?? "Ø";
    const g = r.goldStandard ?? "Ø";
    confusion[p] ??= {};
    confusion[p][g] ??= 0;
    confusion[p][g] += 1;
  }

  // Métriques par label
  const get = (p: string, g: string) => confusion[p]?.[g] ?? 0;
  const perLabel: LabelMetrics[] = classes
    .map((y) => {
      const tp = get(y, y);
      const fp = classes.reduce((s, g) => (g === y ? s : s + get(y, g)), 0);
      const fn = classes.reduce((s, p) => (p === y ? s : s + get(p, y)), 0);
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 =
        precision + recall > 0
          ? (2 * precision * recall) / (precision + recall)
          : 0;
      const support = classes.reduce((s, p) => s + get(p, y), 0);
      return { label: y, support, tp, fp, fn, precision, recall, f1 };
    })
    .sort((a, b) => b.support - a.support);

  // Kappa (même formule que MetricsPanel)
  const expectedAccuracy = classes.reduce((sum, cls) => {
    const actualCount = results.filter((r) => r.goldStandard === cls).length;
    const predictedCount = results.filter((r) => r.predicted === cls).length;
    return sum + (actualCount * predictedCount) / (total * total || 1);
  }, 0);
  const kappa =
    expectedAccuracy < 1
      ? (accuracy - expectedAccuracy) / (1 - expectedAccuracy)
      : 0;

  return {
    accuracy,
    correct,
    total,
    avgProcessingTime: Math.round(avgProcessingTime),
    avgConfidence: Number(avgConfidence.toFixed(4)),
    kappa: Number(kappa.toFixed(4)),
    perLabel,
    confusion,
  };
}

// Rendu Markdown (table par label + confusion)
export function renderPerLabelTable(rows: LabelMetrics[]): string {
  if (!rows.length) return "_Aucune métrique par tag disponible._";
  const header = `| Tag | Support | Précision | Rappel | F1 | TP | FP | FN |
|---|---:|---:|---:|---:|---:|---:|---:|`;
  const body = rows
    .map(
      (r) =>
        `| ${r.label} | ${r.support} | ${(r.precision * 100).toFixed(1)}% | ${(
          r.recall * 100
        ).toFixed(1)}% | ${(r.f1 * 100).toFixed(1)}% | ${r.tp} | ${r.fp} | ${
          r.fn
        } |`
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function renderConfusion(
  conf: Record<string, Record<string, number>>
): string {
  const labels = Array.from(
    new Set([
      ...Object.keys(conf),
      ...Object.values(conf).flatMap((row) => Object.keys(row)),
    ])
  ).sort();
  if (!labels.length) return "_Matrice vide._";

  const head = `| Pred \\ Gold | ${labels.join(" | ")} |`;
  const sep = `|---|${labels.map(() => "---:").join("|")}|`;
  const rows = Object.keys(conf)
    .sort()
    .map((pred) => {
      const cells = labels.map((gold) => conf[pred]?.[gold] ?? 0);
      return `| ${pred} | ${cells.join(" | ")} |`;
    })
    .join("\n");

  return `${head}\n${sep}\n${rows}`;
}
