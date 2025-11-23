// ===================================================================
// 1. CORRECTION: src/app/(protected)/analysis/components/AlgorithmLab/types/core/validation.ts
// ===================================================================

/**
 * @fileoverview Types de validation AlgorithmLab
 * Interfaces pour validation, tests et métriques de performance AlgorithmLab
 * ✅ CORRECTION: Ajout propriétés metadata manquantes (verbatim, clientTurn, etc.)
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

  // Propriétés existantes
  annotations?: any[];
  provider?: string;
  scale?: "nominal" | "ordinal";

  // ✅ NOUVELLES propriétés optionnelles pour M2ValidationInterface
  clientTurn?: string;
  verbatim?: string;
  m2?: {
    value?: string | number;
    scale?: string;
    alignmentType?: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT";
    alignmentMethod?: "lexical" | "semantic" | "composite";
    weights?: Record<string, number>;
  };

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
  correct: boolean;

  // ✅ NOUVELLES propriétés optionnelles pour M2ValidationInterface
  confidence?: number;
  processingTime?: number;
  id?: string | number;

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

  // Support pour les deux formats perClass (correction conflit ThesisVariables.ts:163)
  perClass?: Record<
    string,
    {
      precision: number;
      recall: number;
      f1: number;
      support?: number; // ✅ CORRECTION: support optionnel pour résoudre l'erreur
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

  // ✅ AJOUT: Propriété annotatorId manquante dans useXAlgorithmTesting.ts:222,231,240
  annotatorId?: string;
}

export interface XValidationResult {
  id?: string;
  verbatim?: string;
  callId?: string;
  predicted?: VariableX; // ✅ CORRECTION: Résolution conflit types/core/validation.ts:187
  goldStandard?: VariableX; // ✅ CORRECTION: Résolution conflit types/core/validation.ts:188
  confidence?: number;
  processingTime?: number;
  correct: boolean;

  // Propriété manquante ajoutée
  evidence?: string[];

  // ✅ AJOUT: Support pour autres propriétés manquantes
  timestamp?: number; // Propriété manquante dans useXAlgorithmTesting.ts:402,627
}

export interface TVMetadataM2 extends TVMetadataCore {
  value?: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT";
  alignmentType?: TVMetadataM2["value"];
  alignmentMethod?: "lexical" | "semantic" | "composite";
  weights?: Record<string, number>;

  // ✅ AJOUT: Support pour propriétés étendues M2
  details?: Record<string, any>; // Propriété manquante dans useM2AlgorithmTesting.ts:71
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

  // ✅ NOUVELLES propriétés optionnelles pour corriger les erreurs
  algorithmId?: string;
  variable?: VariableTarget;
  sampleSize?: number;
  randomSeed?: number;
  useGoldStandard?: boolean;
  options?: Record<string, unknown>;

  // Configuration du test (existant)
  testSet: {
    source: "MANUAL_ANNOTATIONS" | "SYNTHETIC" | "HISTORICAL";
    size?: number;
    stratified?: boolean;
    randomSeed?: number;
  };

  // Métriques à calculer (existant)
  metrics: {
    basic: boolean;
    detailed: boolean;
    temporal?: boolean;
    crossValidation?: boolean;
  };

  // Seuils de performance (existant)
  thresholds: {
    minimumAccuracy: number;
    minimumPrecision?: number;
    minimumRecall?: number;
    minimumF1?: number;
  };

  // Options d'exécution (existant)
  execution: {
    parallel?: boolean;
    timeout?: number;
    retries?: number;
    saveResults?: boolean;
  };

  // Support pour validation croisée (existant)
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
  // ✅ CORRECTION: Ajout propriété observed manquante dans useLevel0Validation.ts:38
  observed?: number; // Alias pour observedAgreement
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

  // ✅ CORRECTION: Support pour propriétés étendues dans useLevel0Validation.ts:57,61
  expert1?: string;
  expert2?: string;
  finalTag?: string; // Propriété manquante dans useLevel0Validation.ts:61

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

// ========================================================================
// GESTION DES VERSIONS ALGORITHMES
// ========================================================================


export type AlgorithmVersionId = string; // ex: "v2.3.1-openai-gpt4"

export interface AlgorithmVersionMetadata {
  version_id: AlgorithmVersionId;
  version_name: string;
  created_at: string;
  is_active: boolean;
  deprecated: boolean;
  description?: string;
  changelog?: string;

  // ✅ Ajouter les propriétés pour M1
  m1_key?: string;
  m1_version?: string;
  m1_config?: Record<string, any>;

  // ✅ Ajouter les propriétés pour M2
  m2_key?: string;
  m2_version?: string;
  m2_config?: Record<string, any>;

  // ✅ Ajouter les propriétés pour M3
  m3_key?: string;
  m3_version?: string;
  m3_config?: Record<string, any>;

  // Optionnel : pour X et Y si vous en avez besoin
  x_key?: string;
  x_version?: string;
  x_config?: Record<string, any>;

  y_key?: string;
  y_version?: string;
  y_config?: Record<string, any>;

  // Métriques Level1
  level1_metrics?: Level1ValidationMetrics;
}

export interface VariableConfig {
  key: string; // classifier key dans le registry
  version: string; // version interne de l'algo
  config: Record<string, any>; // hyperparamètres
}

export interface Level1ValidationMetrics {
  // Pour X/Y (classification)
  accuracy?: number;
  precision?: Record<string, number>; // par label
  recall?: Record<string, number>;
  f1?: Record<string, number>;
  kappa?: number;
  confusion_matrix?: Record<string, Record<string, number>>;
  
  // Pour M1/M2/M3 (numériques)
  mae?: number;
  rmse?: number;
  r2?: number;
  pearson_r?: number;
  bias?: number;
  
  // Métadonnées
  sample_size: number;
  test_date: string;
  gold_standard_version?: string;
}
