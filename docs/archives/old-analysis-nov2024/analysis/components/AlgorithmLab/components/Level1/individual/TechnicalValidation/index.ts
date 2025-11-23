"use client";

export { TechnicalValidation } from "./TechnicalValidation";
export { RunPanel } from "../../shared/results/base/RunPanel";

// ✅ MetricsPanel est un export par défaut du composant
import MetricsPanel from "../../shared/results/base/MetricsPanel";
export { MetricsPanel };

// ✅ SimpleMetrics vient de ton package de types (pas du composant UI)
export type { SimpleMetrics } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export { ResultsSample } from "../../shared/results/base/ResultsSample";
export type { TVValidationResult } from "../../shared/results/base/ResultsSample";
