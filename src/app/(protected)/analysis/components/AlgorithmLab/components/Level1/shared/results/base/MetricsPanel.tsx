"use client";
import React from "react";
import type { TVValidationResult } from "./ResultsSample/types";
import type { TargetKind } from "./extraColumns";
import MetricsPanelClassification from "./MetricsPanel.classification";
import MetricsPanelNumeric from "./MetricsPanel.numeric";

/**
 * Règle :
 * - X / Y / M2 → classification (accuracy, P/R/F1, κ)
 * - M1 / M3    → numérique (MAE, RMSE, R², r, biais)
 */
export default function MetricsPanel({
  results,
  targetKind,
  classifierLabel,
}: {
  results: TVValidationResult[];
  targetKind: TargetKind;
  classifierLabel?: string;
}) {
  if (targetKind === "M1" || targetKind === "M3") {
    return (
      <MetricsPanelNumeric
        results={results}
        classifierLabel={classifierLabel}
      />
    );
  }
  return (
    <MetricsPanelClassification
      results={results}
      classifierLabel={classifierLabel}
    />
  );
}
