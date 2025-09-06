/**
 * @fileoverview Interface universelle AlgorithmLab
 * Remplace les wrappers multiples (wrapX, wrapY, wrapM2) par une interface unifiée
 */

import type { VariableTarget, VariableDetails } from "../core/variables";

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
