/**
 * @fileoverview Types de base des algorithmes AlgorithmLab
 * - UniversalAlgorithm (contrat UI)
 * - BaseAlgorithm (contrat bas niveau)
 * - Descripteurs riches, métadonnées, paramètres
 * - Helpers de résultat (isValid, createErrorResult, createSuccessResult)
 */

import type {
  VariableTarget,
  VariableDetails,
  VariableX,
} from "../core/variables";

// ========================================================================
// CONTRAT UNIVERSEL (UI)
// ========================================================================

export interface UniversalAlgorithm {
  // Métadonnées standardisées
  describe(): AlgorithmDescriptor;
  validateConfig(): boolean;

  // Exécution unifiée
  classify?(input: string): Promise<UniversalResult>; // rétro-compat
  run(input: unknown): Promise<UniversalResult>; // canal principal
  batchRun?(inputs: unknown[]): Promise<UniversalResult[]>; // optionnel
}

// ========================================================================
// PARAMÈTRES & TYPES D’ALGO
// ========================================================================

export type AlgorithmType = "rule-based" | "ml" | "llm" | "hybrid" | "metric";

export interface ParameterDescriptor {
  type: "number" | "string" | "boolean" | "select";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface AlgorithmDescriptor {
  // Propriétés existantes
  name: string; // ID unique (ex: "OpenAIXClassifier")
  displayName: string; // Nom affiché (ex: "OpenAI X Classifier")
  version: string; // Version semver (ex: "1.2.0")
  type: AlgorithmType; // Type d'implémentation
  target: VariableTarget; // Variable ciblée (X, Y, M1, M2, M3)
  batchSupported: boolean; // Support du traitement par lot
  requiresContext: boolean; // Nécessite du contexte conversationnel
  description?: string; // Description détaillée
  parameters?: Record<string, ParameterDescriptor>;
  examples?: Array<{ input: unknown; output?: unknown; note?: string }>; // Exemples d'utilisation

  // ✅ NOUVELLES propriétés optionnelles pour M2ValidationInterface et autres composants
  desc?: {
    displayName?: string;
    description?: string;
  };
  metrics?: {
    differential?: number;
    avgMs?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };

  // ✅ Propriétés alternatives pour différents formats
  id?: string; // Identifiant alternatif
  callId?: string | number;
  startTime?: number;
  endTime?: number;
  input?: string;
  speaker?: string;
  predicted?: string;
  goldStandard?: string;
  confidence?: number;
  correct?: boolean;
  processingTime?: number;
}

export interface AlgorithmMetadata {
  key: string; // identifiant interne (ex: "m2-lexical")
  label?: string; // libellé humain
  version?: string; // "1.0.0"
  description?: string;
  target?: VariableTarget; // X|Y|M1|M2|M3
  tags?: string[];

  // champs tolérés par certains registres
  id?: string;
  displayName?: string;
}

export interface AlgorithmConfig {
  [key: string]: unknown;
}

/** ⚠️ Utilisé ailleurs avec alias dans index.ts (BaseAlgorithmParameters) */
export interface AlgorithmParameters {
  [key: string]: boolean | number | string;
}

// ========================================================================
// CONTRAT BAS NIVEAU (implémentations concrètes)
// ========================================================================

/**
 * - `key` et `meta` existent dans beaucoup de calculateurs : on les garde
 * - `run()` retourne un résultat typé au niveau supérieur
 */
export interface BaseAlgorithm<I = unknown, R = unknown> {
  key: string;
  meta?: AlgorithmMetadata;
  run(input: I, config?: AlgorithmConfig): Promise<R> | R;
}

// ========================================================================
// RÉSULTATS (pour anciennes API bas niveau — on alias dans index.ts)
// ========================================================================

export interface AlgorithmResult {
  ok?: boolean;
  message?: string;
  metrics?: Record<string, unknown>;
  details?: Record<string, unknown>;

  // Identifiants & temps (optionnels car tout le monde ne les fournit pas)
  callId?: string | number;
  id?: string | number;
  startTime?: number;
  endTime?: number;

  // Contenu
  input?: string;
  verbatim?: string;
  speaker?: string;

  // Prédiction
  prediction?: string;
  predicted?: string; // alias de prediction
  goldStandard?: string;
  expected?: string; // alias de goldStandard

  // Qualité
  confidence?: number;
  correct?: boolean;
  processingTime?: number;

  // Contexte (utiles pour EnhancedErrorAnalysis & supervision)
  filename?: string;
  next_turn_verbatim?: string;
  next_turn_tag?: string;
  hasAudio?: boolean;
  hasTranscript?: boolean;
}

// ========================================================================
// UNIVERSAL RESULT (contrat UI)
// ========================================================================

export interface UniversalResult {
  prediction: string; // Prédiction principale (label)
  confidence: number; // Confiance [0-1]
  processingTime?: number; // Temps de traitement (ms)
  algorithmVersion?: string; // Version utilisée

  // ✅ ENRICHISSEMENT pour M2ValidationInterface et autres composants
  id?: string | number;
  verbatim?: string;
  goldStandard?: string;
  correct?: boolean;

  // ✅ ENRICHISSEMENT pour EnhancedErrorAnalysis
  callId?: string | number;
  startTime?: number;
  endTime?: number;
  input?: string;
  speaker?: string;
  predicted?: string; // Alias pour prediction
  filename?: string;
  next_turn_verbatim?: string;
  next_turn_tag?: string;
  hasAudio?: boolean;
  hasTranscript?: boolean;

  metadata?: {
    inputSignature?: string; // Hash/signature de l'input
    inputType?: string; // Type d'input détecté
    executionPath?: string[]; // Étapes d'exécution
    warnings?: string[]; // Avertissements non-bloquants
    details?: VariableDetails; // Détails typés selon la variable (X/Y/M1/M2/M3)

    // ✅ NOUVELLES propriétés enrichies pour M2
    clientTurn?: string;
    m2?: {
      value?: string | number;
      scale?: string;
    };

    [k: string]: unknown; // ouverture optionnelle pour champs additionnels
  };
}

// ========================================================================
// UTILITAIRES
// ========================================================================

export function isValidAlgorithmResult(result: any): result is UniversalResult {
  return (
    result &&
    typeof result === "object" &&
    typeof result.prediction === "string" &&
    typeof result.confidence === "number" &&
    result.confidence >= 0 &&
    result.confidence <= 1
  );
}

export function normalizeAlgorithmResult(
  result: AlgorithmResult
): AlgorithmResult {
  return {
    ...result,
    // Normalisation des alias
    predicted: result.predicted || result.prediction,
    goldStandard: result.goldStandard || result.expected,
    verbatim: result.verbatim || result.input,
    id: result.id || result.callId,

    // Assurer les propriétés minimales
    confidence: result.confidence ?? 0,
    correct: result.correct ?? false,
  };
}

export function validateErrorAnalysisResult(result: AlgorithmResult): boolean {
  const normalized = normalizeAlgorithmResult(result);
  return !!(
    normalized.callId ||
    (normalized.id &&
      typeof normalized.startTime === "number" &&
      typeof normalized.endTime === "number" &&
      (normalized.input || normalized.verbatim) &&
      normalized.speaker &&
      (normalized.predicted || normalized.prediction) &&
      (normalized.goldStandard || normalized.expected))
  );
}

export function createErrorResult(
  error: string,
  algorithmName?: string
): UniversalResult {
  return {
    prediction: "ERROR",
    confidence: 0,
    processingTime: 0,
    algorithmVersion: algorithmName || "unknown",
    // ✅ Propriétés enrichies avec valeurs par défaut
    callId: "unknown",
    startTime: 0,
    endTime: 0,
    input: "",
    speaker: "unknown",
    predicted: "ERROR",
    goldStandard: "unknown",
    correct: false,
    metadata: {
      warnings: [error],
      executionPath: ["error"],
      inputType: "unknown",
    },
  };
}

export function createSuccessResult(
  prediction: string,
  confidence: number,
  processingTime: number = 0,
  details?: VariableDetails,
  // ✅ Paramètres optionnels enrichis
  callId?: string | number,
  input?: string,
  speaker?: string
): UniversalResult {
  return {
    prediction,
    confidence: Math.max(0, Math.min(1, confidence)),
    processingTime,
    // ✅ Propriétés enrichies
    predicted: prediction,
    callId,
    input,
    speaker,
    correct: true, // Par défaut true pour un résultat de succès
    metadata: {
      details,
      executionPath: ["success"],
      inputType: "string",
    },
  };
}

// ========================================================================
// SPÉCIFIQUES X (rétro-compat sélecteur/classifier)
// ========================================================================

export type XClassification = VariableX;

export interface XClassifier {
  classify(verbatim: string): Promise<XClassification>;
}

export type BaseAlgorithmResult = AlgorithmResult;
export type EnhancedAlgorithmResult = AlgorithmResult;
