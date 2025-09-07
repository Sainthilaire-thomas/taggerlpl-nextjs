/**
 * @fileoverview Interface universelle AlgorithmLab
 * Remplace les wrappers multiples (wrapX, wrapY, wrapM2) par une interface unifiée
 */

import type { VariableTarget, VariableDetails } from "../core/variables";

// ========================================================================
// TYPES COMPLÉMENTAIRES (MINIMAUX)
// ========================================================================

/**
 * Paramètres passés aux algorithmes (clé → valeur primitive).
 * Volontairement simple pour ne pas sur-spécifier.
 */
export type AlgorithmParameters = Record<string, boolean | number | string>;

// ========================================================================
// INTERFACE UNIVERSELLE ALGORITHMLAB
// ========================================================================

/**
 * Interface universelle que TOUS les algorithmes AlgorithmLab doivent implémenter
 * Remplace wrapX, wrapY, wrapM2, etc.
 */
export interface UniversalAlgorithm {
  // Métadonnées standardisées
  describe(): AlgorithmDescriptor;
  validateConfig(): boolean;

  // Exécution unifiée
  classify?(input: string): Promise<UniversalResult>; // Rétrocompatibilité (optionnelle)
  run(input: unknown): Promise<UniversalResult>; // Input typé
  batchRun?(inputs: unknown[]): Promise<UniversalResult[]>; // Batch optionnel
}

// ========================================================================
// DESCRIPTEUR D'ALGORITHME ALGORITHMLAB
// ========================================================================

export type AlgorithmType = "rule-based" | "ml" | "llm" | "hybrid";

export interface ParameterDescriptor {
  label: string;
  type: "boolean" | "number" | "string" | "select";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface AlgorithmDescriptor {
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
}

export interface AlgorithmMetadata {
  key: string; // identifiant interne (ex: "m2-lexical")
  label?: string; // libellé humain
  version?: string; // semver, ex: "1.0.0"
  description?: string;
  target?: VariableTarget; // X|Y|M1|M2|M3 (si utile ici)
  tags?: string[];
}

export interface AlgorithmConfig {
  [param: string]: unknown;
}

/** Résultat d'une classification X (structure légère) */
export interface XClassification {
  target: string; // étiquette prédite
  confidence?: number; // 0..1
  details?: Record<string, any>; // infos spécifiques
}

/** Contrat minimal d'un classifieur X */
export interface XClassifier {
  name: string;
  classify(
    input: string | Record<string, any>
  ): Promise<XClassification> | XClassification;
}

/** Contrat minimal commun des algorithmes */
export interface BaseAlgorithm<I = unknown, R = unknown> {
  key: string;
  meta?: AlgorithmMetadata;
  run(input: I, config?: AlgorithmConfig): Promise<R> | R;
}

export interface AlgorithmResult {
  ok: boolean;
  message?: string;
  metrics?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export interface AlgorithmTestState {
  startedAt: string; // ISO
  finishedAt?: string; // ISO
  status: "idle" | "running" | "done" | "error";
  note?: string;
}

// ========================================================================
// RÉSULTAT UNIVERSEL ALGORITHMLAB
// ========================================================================

export interface UniversalResult {
  prediction: string; // Prédiction principale (label)
  confidence: number; // Confiance [0-1]
  processingTime?: number; // Temps de traitement (ms)
  algorithmVersion?: string; // Version utilisée
  metadata?: {
    inputSignature?: string; // Hash/signature de l'input
    inputType?: string; // Type d'input détecté
    executionPath?: string[]; // Étapes d'exécution
    warnings?: string[]; // Avertissements non-bloquants
    details?: VariableDetails; // Détails typés selon la variable (X/Y/M1/M2/M3)
    [k: string]: unknown; // ouverture optionnelle pour champs additionnels
  };
}

// ========================================================================
// UTILITAIRES ALGORITHMLAB
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

export function createErrorResult(
  error: string,
  algorithmName?: string
): UniversalResult {
  return {
    prediction: "ERROR",
    confidence: 0,
    processingTime: 0,
    algorithmVersion: algorithmName || "unknown",
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
  details?: VariableDetails
): UniversalResult {
  return {
    prediction,
    confidence: Math.max(0, Math.min(1, confidence)), // Clamp [0-1]
    processingTime,
    metadata: {
      details,
      executionPath: ["success"],
      inputType: "string",
    },
  };
}
