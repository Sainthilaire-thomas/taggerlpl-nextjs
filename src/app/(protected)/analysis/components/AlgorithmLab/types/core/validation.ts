/**
 * @fileoverview Types de validation AlgorithmLab
 * Interfaces pour validation, tests et métriques de performance AlgorithmLab
 */

import { VariableTarget } from "./variables";
import { CalculationResult } from "./calculations";

// ========================================================================
// MÉTRIQUES DE VALIDATION ALGORITHMLAB
// ========================================================================

// --- Nouveaux contrats centraux pour la validation technique ---
export interface TVMetadataCore {
  // identifiants tour (optionnels)
  turnId?: number | string;
  id?: number | string;
}

export interface TVValidationResultCore {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: TVMetadataCore | Record<string, unknown>;
}

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;

  // Métriques détaillées
  confusionMatrix: Record<string, Record<string, number>>;

  // Métriques par classe
  classMetrics: Record<
    string,
    {
      precision: number;
      recall: number;
      f1Score: number;
      support: number;
    }
  >;

  // Statistiques globales
  totalSamples: number;
  correctPredictions: number;
  executionTime: number;
}

export interface ValidationResult {
  target: VariableTarget;
  algorithmName: string;
  metrics: ValidationMetrics;

  // Détails de validation
  testSet: {
    size: number;
    source: string;
    createdAt: Date;
  };

  // Résultats détaillés
  predictions: Array<{
    input: string;
    expected: string;
    predicted: string;
    confidence: number;
    correct: boolean;
  }>;

  // Métadonnées
  validationDate: Date;
  validatorVersion: string;
  notes?: string;
}

// ========================================================================
// CONFIGURATION DES TESTS ALGORITHMLAB
// ========================================================================

export interface AlgorithmTestConfig {
  target: VariableTarget;
  algorithmName: string;

  // Configuration du test
  testSet: {
    source: "MANUAL_ANNOTATIONS" | "SYNTHETIC" | "HISTORICAL";
    size?: number;
    stratified?: boolean;
    randomSeed?: number;
  };

  // Métriques à calculer
  metrics: {
    basic: boolean; // accuracy, precision, recall, f1
    detailed: boolean; // confusion matrix, per-class metrics
    temporal?: boolean; // performance over time
    crossValidation?: boolean; // k-fold validation
  };

  // Seuils de performance
  thresholds: {
    minimumAccuracy: number;
    minimumPrecision?: number;
    minimumRecall?: number;
    minimumF1?: number;
  };

  // Options d'exécution
  execution: {
    parallel?: boolean;
    timeout?: number; // ms
    retries?: number;
    saveResults?: boolean;
  };
}

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function calculateMetrics(
  predictions: Array<{
    expected: string;
    predicted: string;
    confidence?: number;
  }>
): ValidationMetrics {
  const total = predictions.length;
  const correct = predictions.filter((p) => p.expected === p.predicted).length;
  const accuracy = correct / total;

  // Calcul simplifié pour l'exemple
  return {
    accuracy,
    precision: accuracy, // Simplifié
    recall: accuracy, // Simplifié
    f1Score: accuracy, // Simplifié
    confusionMatrix: {},
    classMetrics: {},
    totalSamples: total,
    correctPredictions: correct,
    executionTime: 0,
  };
}

export function createValidationConfig(
  target: VariableTarget,
  algorithmName: string,
  options: Partial<AlgorithmTestConfig> = {}
): AlgorithmTestConfig {
  return {
    target,
    algorithmName,
    testSet: {
      source: "MANUAL_ANNOTATIONS",
      size: 100,
      stratified: true,
      ...options.testSet,
    },
    metrics: {
      basic: true,
      detailed: true,
      temporal: false,
      crossValidation: false,
      ...options.metrics,
    },
    thresholds: {
      minimumAccuracy: 0.8,
      minimumPrecision: 0.75,
      minimumRecall: 0.75,
      minimumF1: 0.75,
      ...options.thresholds,
    },
    execution: {
      parallel: false,
      timeout: 30000,
      retries: 3,
      saveResults: true,
      ...options.execution,
    },
  };
}
