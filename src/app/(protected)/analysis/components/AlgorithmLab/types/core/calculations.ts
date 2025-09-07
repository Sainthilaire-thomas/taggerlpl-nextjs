// ===================================================================
// 2. CORRECTION: src/app/(protected)/analysis/components/AlgorithmLab/types/core/calculations.ts
// ===================================================================

/**
 * @fileoverview Interfaces de calcul AlgorithmLab
 * Types pour les inputs, outputs et métadonnées des calculateurs AlgorithmLab
 */

import { VariableTarget, VariableDetails } from "./variables";

// ========================================================================
// INPUTS POUR LES CALCULS ALGORITHMLAB
// ========================================================================

export interface XInput {
  verbatim: string;
  context?: {
    previousTurn?: string;
    nextTurn?: string;
    callId?: string;
    turnIndex?: number;
  };
  metadata?: {
    speaker: string;
    timestamp: number;
    duration: number;
  };
}

export interface YInput {
  verbatim: string;
  previousConseillerTurn: string;
  context?: {
    conversationHistory?: string[];
    emotionalContext?: string;
    callMetadata?: Record<string, any>;
  };
}

export interface M1Input {
  verbatim: string;
  language?: string;
  analysisDepth?: "BASIC" | "ADVANCED" | "COMPREHENSIVE";
}

export interface M2Input {
  conseillerTurn?: string;
  clientTurn?: string;

  // Propriétés alternatives pour compatibilité
  turnVerbatim?: string;
  nextTurnVerbatim?: string;

  context?: {
    previousTurns?: Array<{ speaker: string; text: string }>;
    conversationPhase?: "OPENING" | "DEVELOPMENT" | "RESOLUTION" | "CLOSING";
    prevTurn?: string;
    speaker?: string;
    nextSpeaker?: string;
  };

  metadata?: {
    turnId?: number;
    callId?: string;
    timestamp?: number;
  };
}

export interface M3Input {
  conversationPair: {
    conseiller: string;
    client: string;
  };
  // clientTurn reste optionnel pour compatibilité
  clientTurn?: string;
  cognitiveContext?: {
    conversationLength: number;
    emotionalTone: string;
    complexityLevel: "LOW" | "MEDIUM" | "HIGH";
  };
}

export type CalculationInput = XInput | YInput | M1Input | M2Input | M3Input;

// ========================================================================
// RÉSULTATS DES CALCULS ALGORITHMLAB
// ========================================================================

export interface CalculationResult<TDetails = VariableDetails> {
  prediction: string;
  confidence: number;
  processingTime: number;

  // Propriété manquante ajoutée
  score?: number;

  details: TDetails;

  metadata?: {
    algorithmVersion: string;
    inputSignature: string;
    executionPath: string[];
    warnings?: string[];
  };
}

// Résultats typés spécifiques AlgorithmLab
export type XCalculationResult = CalculationResult<
  import("./variables").XDetails
>;
export type YCalculationResult = CalculationResult<
  import("./variables").YDetails
>;
export type M1CalculationResult = CalculationResult<
  import("./variables").M1Details
>;
export type M2CalculationResult = CalculationResult<
  import("./variables").M2Details
>;
export type M3CalculationResult = CalculationResult<
  import("./variables").M3Details
>;

// ========================================================================
// MÉTADONNÉES DES CALCULATEURS ALGORITHMLAB
// ========================================================================

export interface CalculatorMetadata {
  name: string;
  version: string;
  target: VariableTarget;
  description: string;

  capabilities: {
    batchProcessing: boolean;
    contextAware: boolean;
    realTime: boolean;
    requiresTraining: boolean;
  };

  performance: {
    averageProcessingTime: number;
    accuracy: number;
    precision: number;
    recall: number;
  };

  parameters?: Record<
    string,
    {
      type: string;
      default: any;
      description: string;
      required: boolean;
    }
  >;
}

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function validateCalculationInput(
  input: unknown,
  target: VariableTarget
): input is CalculationInput {
  if (!input || typeof input !== "object") return false;

  const obj = input as Record<string, any>;

  switch (target) {
    case "X":
      return typeof obj.verbatim === "string";
    case "Y":
      return (
        typeof obj.verbatim === "string" &&
        typeof obj.previousConseillerTurn === "string"
      );
    case "M1":
      return typeof obj.verbatim === "string";
    case "M2":
      return (
        typeof obj.conseillerTurn === "string" &&
        typeof obj.clientTurn === "string"
      );
    case "M3":
      return (
        obj.conversationPair &&
        typeof obj.conversationPair.conseiller === "string" &&
        typeof obj.conversationPair.client === "string"
      );
    default:
      return false;
  }
}

export function createEmptyResult<T extends VariableDetails>(
  target: VariableTarget
): CalculationResult<T> {
  return {
    prediction: "UNKNOWN",
    confidence: 0,
    processingTime: 0,
    details: {} as T,
    metadata: {
      algorithmVersion: "unknown",
      inputSignature: "",
      executionPath: [],
      warnings: ["Empty result created"],
    },
  };
}
