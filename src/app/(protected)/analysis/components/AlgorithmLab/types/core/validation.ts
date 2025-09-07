// ===================================================================
// 1. CORRECTION: src/app/(protected)/analysis/components/AlgorithmLab/types/core/validation.ts
// ===================================================================

/**
 * @fileoverview Types de validation AlgorithmLab
 * Interfaces pour validation, tests et métriques de performance AlgorithmLab
 */

import type { VariableTarget, VariableX } from "./variables";
import type { CalculationResult } from "./calculations";

// ========================================================================
// MÉTRIQUES DE VALIDATION ALGORITHMLAB
// ========================================================================

export interface TVMetadataCore {
  // identifiants tour (optionnels)
  turnId?: number | string;
  id?: number | string;

  // Propriétés manquantes ajoutées pour corriger les erreurs TypeScript
  annotations?: any[];
  provider?: string;
  scale?: "nominal" | "ordinal";

  // Autres propriétés optionnelles
  source?: string;
  createdAt?: string;
  notes?: string;
}

// Alias pour TVMetadata (utilisé dans plusieurs composants)
export type TVMetadata = TVMetadataCore;

export interface TVValidationResultCore {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: TVMetadataCore | Record<string, unknown>;
}

export type ValidationRow = TVValidationResultCore;

export interface ValidationMetrics {
  // Valeurs globales, numériques
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;

  // Propriété manquante ajoutée pour TechnicalBenchmark
  kappa?: number;

  // Propriétés supplémentaires pour compatibility complète
  errorRate?: number;
  sampleSize?: number;
  processingSpeed?: number;

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

  // Support pour les deux formats perClass
  perClass?: Record<
    string,
    {
      precision: number;
      recall: number;
      f1: number;
      support?: number;
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

export interface XGoldStandardItem {
  id: string;
  verbatim?: string;
  goldStandard?: VariableX;
  annotatorConfidence?: number;
  callId?: string;
  meta?: Record<string, unknown>;
}

export interface XValidationResult {
  id?: string;
  verbatim?: string;
  callId?: string;
  predicted?: VariableX;
  goldStandard?: VariableX;
  confidence?: number;
  processingTime?: number;
  correct: boolean;

  // Propriété manquante ajoutée
  evidence?: string[];
}

export interface TVMetadataM2 extends TVMetadataCore {
  value?: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT";
  alignmentType?: TVMetadataM2["value"];
  alignmentMethod?: "lexical" | "semantic" | "composite";
  weights?: Record<string, number>;
}

// Alias publics simples attendus par l'UI
export type TVValidationResult = TVValidationResultCore;
export type CoreTVValidationResult = TVValidationResultCore;
export type CoreTVMetadata = TVMetadataCore;

// ========================================================================
// CONFIGURATION DES TESTS ALGORITHMLAB
// ========================================================================

export interface AlgorithmTestConfig {
  target: VariableTarget;
  algorithmName: string;

  // Propriétés manquantes ajoutées
  algorithmId?: string;
  variable?: VariableTarget;
  sampleSize?: number;
  randomSeed?: number;
  useGoldStandard?: boolean;
  options?: Record<string, unknown>;

  // Configuration du test
  testSet: {
    source: "MANUAL_ANNOTATIONS" | "SYNTHETIC" | "HISTORICAL";
    size?: number;
    stratified?: boolean;
    randomSeed?: number;
  };

  // Métriques à calculer
  metrics: {
    basic: boolean;
    detailed: boolean;
    temporal?: boolean;
    crossValidation?: boolean;
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
    timeout?: number;
    retries?: number;
    saveResults?: boolean;
  };

  // Support pour validation croisée
  crossValidation?: {
    folds: number;
    stratified: boolean;
  };
}

// ========================================================================
// INTER-ANNOTATOR AGREEMENT (IAA) - Remplace Level0Types
// ========================================================================

export interface DisagreementCase {
  id?: string | number;
  verbatim?: string;
  annotatorA?: string;
  annotatorB?: string;
  labelA?: string;
  labelB?: string;
  annotation?: { expert1: string; expert2: string };
  confusionType?: string;
  finalTag?: string;
  notes?: string;
}

export interface KappaMetrics {
  kappa: number;
  observedAgreement: number;
  expectedAgreement: number;
  confusionMatrix?: Record<string, Record<string, number>>;
  byLabel?: Record<
    string,
    { observed: number; expected: number; kappa: number; support: number }
  >;
  interpretation?:
    | "POOR"
    | "FAIR"
    | "MODERATE"
    | "SUBSTANTIAL"
    | "ALMOST_PERFECT";
}

export interface InterAnnotatorData {
  id?: string | number;
  verbatim?: string;
  agreed: boolean;
  annotation?: { expert1: string; expert2: string };
  [k: string]: unknown;
}

// ========================================================================
// VALIDATION LEVEL - Remplace SharedTypes.ValidationLevel
// ========================================================================

export interface ValidationLevel {
  id: number;
  name: string;
  description: string;
  status: "pending" | "in-progress" | "validated" | "failed";
  progress: number;
  prerequisites: number[];
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

  return {
    accuracy,
    precision: accuracy,
    recall: accuracy,
    f1Score: accuracy,
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
