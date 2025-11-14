/**
 * @fileoverview Types et utilitaires de calcul AlgorithmLab
 * - Entrées typées (X/Y/M1/M2/M3)
 * - Résultats (CalculationResult<Details>)
 * - Helpers communs : createEmptyResult, validateCalculationInput, mergeWarnings, mergeExecutionPaths
 */

import type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
} from "./variables";

// ========================================================================
// INPUTS
// ========================================================================

export interface XInput {
  verbatim: string;
  language?: string;
  contextTurnId?: number;
}

export interface YInput {
  verbatim: string;
  language?: string;
  contextTurnId?: number;
}

export interface M1Input {
  verbatim: string;
  tokens?: string[];
  language?: string;
}

export interface M2Input {
  conseillerTurn?: string;
  clientTurn?: string;
  t0?: string; // tour conseiller
  t1?: string; // tour client (suivant)

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
  segment: string;
  withProsody?: boolean;
  language?: string;
  options?: Record<string, unknown>;
}

export type AnyCalculationInput = XInput | YInput | M1Input | M2Input | M3Input;
// alias rétro-compatible
export type CalculationInput = AnyCalculationInput;

// ========================================================================
// MÉTADONNÉES / RÉSULTATS
// ========================================================================

export interface CalculationMetadata {
  algorithmVersion: string;
  inputSignature: string;
  executionPath: string[];
  warnings?: string[];

  // ✅ CORRECTION : Propriétés manquantes pour M1/M2/M3
  id?: string;
  label?: string;
  target?: VariableTarget; // "M1" | "M2" | "M3"
  algorithmKind?: string;
  version?: string;
  description?: string;

  // ✅ CORRECTION : Pour RegexM1Calculator et PauseM3Calculator
  tags?: string[];

  // ✅ CORRECTION : Pour M2SemanticAlignmentCalculator
  parameters?: Record<string, any>;

  // Extension pour autres propriétés futures
  [key: string]: unknown;
}

export interface CalculationResult<TDetails = VariableDetails> {
  prediction: string;
  confidence: number;
  processingTime: number;

  // Propriété existante
  score?: number;

  details: TDetails;

  // ✅ NOUVELLES propriétés optionnelles pour M3ValidationInterface
  markers?: string[]; // Erreur ligne 314 dans M3ValidationInterface

  metadata?: {
    algorithmVersion: string;
    inputSignature: string;
    executionPath: string[];
    warnings?: string[];

    // ✅ NOUVELLES propriétés pour M3ValidationInterface
    verbatim?: string; // Erreur lignes 94,273
    clientTurn?: string; // Erreur lignes 94,274

    // Extension pour autres propriétés futures
    [key: string]: unknown;
  };
}

// Sorties spécialisées
export type XCalculationResult = CalculationResult<XDetails>;
export type YCalculationResult = CalculationResult<YDetails>;
export type M1CalculationResult = CalculationResult<M1Details>;
export type M2CalculationResult = CalculationResult<M2Details>;
export type M3CalculationResult = CalculationResult<M3Details>;

// ========================================================================
// HELPERS
// ========================================================================

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
    },
  };
}

/**
 * ✅ Ajout attendu par types/index.ts
 * Garde ultra-sûre pour valider une entrée de calcul.
 */
export function validateCalculationInput<T = unknown>(
  input: unknown
): input is T {
  return input !== null && input !== undefined;
}

/** Fusionne/unique les warnings de plusieurs résultats (utile M2 composite) */
export function mergeWarnings(
  ...results: Array<CalculationResult<any> | undefined>
): string[] | undefined {
  const set = new Set<string>();
  for (const r of results) {
    if (Array.isArray(r?.metadata?.warnings)) {
      for (const w of r!.metadata!.warnings!) set.add(w);
    }
  }
  return set.size ? Array.from(set) : undefined;
}

/** Concatène les chemins d’exécution de plusieurs sous-calculs */
export function mergeExecutionPaths(
  ...results: Array<CalculationResult<any> | undefined>
): string[] {
  const path: string[] = [];
  for (const r of results) {
    if (Array.isArray(r?.metadata?.executionPath)) {
      path.push(...r!.metadata!.executionPath!);
    }
  }
  return path;
}
