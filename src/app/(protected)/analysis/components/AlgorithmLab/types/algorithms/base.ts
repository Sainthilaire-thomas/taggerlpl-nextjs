/**
 * @fileoverview Types de base des algorithmes AlgorithmLab - VERSION FUSIONNÉE COMPATIBLE
 * - Préserve votre existant
 * - Ajoute les extensions nécessaires pour M2
 * - Résout les conflits TypeScript
 */

import type {
  VariableTarget,
  VariableDetails,
  VariableX,
} from "../core/variables";

// ========================================================================
// PARAMÈTRES & TYPES D'ALGO
// ========================================================================

export type AlgorithmType = "rule-based" | "ml" | "llm" | "hybrid" | "metric";

/** ⚠️ Utilisé ailleurs avec alias dans index.ts (BaseAlgorithmParameters) */
export interface AlgorithmParameters {
  [key: string]: boolean | number | string;
}

export interface ParameterDescriptor {
  type: "number" | "string" | "boolean" | "select";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface AlgorithmConfig {
  [key: string]: unknown;
}

// ========================================================================
// ALGORITHMDESCRIPTOR - VERSION NETTOYÉE
// ========================================================================

export interface AlgorithmDescriptor {
  // ✅ PROPRIÉTÉS CORE D'UN ALGORITHME
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

  // ✅ PROPRIÉTÉS OPTIONNELLES POUR COMPATIBILITÉ UI
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

  // ✅ Identifiant alternatif pour certains composants
  id?: string;
}

// ========================================================================
// ALGORITHMMETADATA - VERSION ÉTENDUE COMPATIBLE
// ========================================================================

/**
 * Interface AlgorithmMetadata ÉTENDUE pour supporter :
 * - Votre existant (key, label, etc.)
 * - Les nouveaux requis (name, displayName, type, etc.)
 * - La rétrocompatibilité complète
 */
export interface AlgorithmMetadata {
  key: string; // SEUL champ obligatoire

  // Tous les autres champs optionnels
  label?: string;
  version?: string;
  description?: string;
  target?: VariableTarget;
  tags?: string[];
  id?: string;
  displayName?: string;
  name?: string;
  type?: AlgorithmType;
  batchSupported?: boolean;
  requiresContext?: boolean;
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];
}

// ========================================================================
// CONTRAT UNIVERSEL (UI) - INCHANGÉ
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
// CONTRAT BAS NIVEAU - COMPATIBLE AVEC VOTRE EXISTANT
// ========================================================================

export interface BaseAlgorithm<I = unknown, R = unknown> {
  key: string;
  meta?: AlgorithmMetadata; // ✅ Utilise maintenant l'interface étendue
  run(input: I, config?: AlgorithmConfig): Promise<R> | R;
}

// ========================================================================
// RÉSULTATS - VOS DÉFINITIONS PRÉSERVÉES + AMÉLIORATIONS
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

export interface UniversalResult {
  prediction: string; // Prédiction principale (label)
  confidence: number; // Confiance [0-1]
  processingTime?: number; // Temps de traitement (ms)
  algorithmVersion?: string; // Version utilisée

  // ✅ VOS ENRICHISSEMENTS PRÉSERVÉS
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
    inputSignature?: string;
    inputType?: string;
    executionPath?: string[];
    warnings?: string[];
    details?: VariableDetails;

    // ✅ VOS PROPRIÉTÉS M2 PRÉSERVÉES
    clientTurn?: string;
    m2?: {
      value?: string | number;
      scale?: string;
    };

    [k: string]: unknown;
  };
}

// ========================================================================
// UTILITAIRES - VOS FONCTIONS PRÉSERVÉES + NOUVELLES
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
    // ✅ VOS PROPRIÉTÉS ENRICHIES PRÉSERVÉES
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
  // ✅ VOS PARAMÈTRES OPTIONNELS ENRICHIS PRÉSERVÉS
  callId?: string | number,
  input?: string,
  speaker?: string
): UniversalResult {
  return {
    prediction,
    confidence: Math.max(0, Math.min(1, confidence)),
    processingTime,
    // ✅ PROPRIÉTÉS ENRICHIES
    predicted: prediction,
    callId,
    input,
    speaker,
    correct: true,
    metadata: {
      details,
      executionPath: ["success"],
      inputType: "string",
    },
  };
}

// ========================================================================
// NOUVELLES FACTORY FUNCTIONS POUR M2
// ========================================================================

/**
 * Crée des métadonnées AlgorithmMetadata COMPATIBLES avec votre existant
 * - Tous les champs sont optionnels sauf key
 * - Fournit des valeurs par défaut raisonnables
 */
export function createAlgorithmMetadata(
  base: {
    key: string; // Seul champ obligatoire
    name?: string;
    target?: VariableTarget;
    type?: AlgorithmType;
    displayName?: string;
    version?: string;
  },
  extensions?: Partial<AlgorithmMetadata>
): AlgorithmMetadata {
  return {
    key: base.key, // Seul champ obligatoire
    name: base.name || base.key,
    displayName: base.displayName || base.name || base.key,
    version: base.version || "1.0.0",
    type: base.type || "rule-based",
    target: base.target || "X",
    batchSupported: false,
    requiresContext: false,
    ...extensions, // Permet d'overrider tout
  };
}

/**
 * Convertit des métadonnées legacy vers le format étendu SANS CASSER L'EXISTANT
 */
export function convertLegacyMetadata(
  legacy: Record<string, unknown>,
  fallbackKey: string
): AlgorithmMetadata {
  const key = (legacy.key as string) || fallbackKey;

  return {
    key, // Seul champ conservé comme obligatoire
    name: legacy.name as string,
    displayName: (legacy.displayName ||
      legacy.label ||
      legacy.name ||
      key) as string,
    target: legacy.target as VariableTarget,
    type: legacy.type as AlgorithmType,
    version: (legacy.version || "1.0.0") as string,
    batchSupported: legacy.batchSupported as boolean,
    requiresContext: legacy.requiresContext as boolean,

    // Préserver TOUS les champs legacy existants
    label: legacy.label as string,
    description: legacy.description as string,
    tags: legacy.tags as string[],
    id: legacy.id as string,
    family: legacy.family as string,
    evidences: legacy.evidences as string[],
    topProbs: legacy.topProbs as { label: string; prob: number }[],
  };
}

// ========================================================================
// SPÉCIFIQUES X - VOS DÉFINITIONS PRÉSERVÉES
// ========================================================================

export type XClassification = VariableX;

export interface XClassifier {
  classify(verbatim: string): Promise<XClassification>;
}

// ✅ VOS ALIAS PRÉSERVÉS
export type BaseAlgorithmResult = AlgorithmResult;
export type EnhancedAlgorithmResult = AlgorithmResult;
