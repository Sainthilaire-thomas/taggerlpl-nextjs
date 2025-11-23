# Reference — Types normalisés AlgorithmLab

> Généré automatiquement le 2025-09-12T09:12:30.573Z à partir de `C:/Users/thoma/OneDrive/SONEAR 2025/taggerlpl-nextjs/src/app/(protected)/analysis/components/AlgorithmLab/types`
> Doc-Version: 2025-09-12T09:12:30.573Z-023
> Code-Version: 2.0.0

## Contenu
- [index.ts](#indexts)
- [algorithms/](#algorithms)
- [core/](#core)
- [legacy/](#legacy)
- [ui/](#ui)
- [utils/](#utils)

## index.ts

### Exports détectés
- **Déclarations**: ALGORITHM_LAB_VERSION, SUPPORTED_VARIABLES, SimpleMetrics, MetricsPanelProps, ClassifierSelectorProps, ConfusionMatrixProps
- **Nommés**: createUniversalAlgorithm, isValidVariableTarget, getVariableColor, getVariableLabel, validateCalculationInput, createEmptyResult, calculateMetrics, createValidationConfig, isValidAlgorithmResult, normalizeAlgorithmResult, createErrorResult, createSuccessResult
- **Re-exports `*`** depuis: ./core/variables, ./core/validation, ./ui, ./utils

### Contenu
```ts
/**
 * @fileoverview Point d’entrée principal des types AlgorithmLab
 * - Ré-exports sans conflits
 * - Ajout des utilitaires publics
 * - Interfaces UI complémentaires (MetricsPanel, ConfusionMatrix, etc.)
 */

// ========================================================================
// IMPORTS POUR TYPES DIFFUSÉS DANS CE FICHIER
// ========================================================================

import type { VariableTarget, VariableX } from "./core/variables";
import type { ValidationMetrics, ValidationResult } from "./core/validation";

// ========================================================================
// EXPORTS PAR DOMAINE
// ========================================================================

// Variables & détails
export * from "./core/variables";

// Calculs & résultats
export type {
  CalculationInput,
  CalculationResult,
  CalculationMetadata,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input,
  XCalculationResult,
  YCalculationResult,
  M1CalculationResult,
  M2CalculationResult,
  M3CalculationResult,
} from "./core/calculations";

// Validation & métriques
export * from "./core/validation";

// ========================================================================
// EXPORTS ALGORITHMES (sélectifs pour éviter conflits)
// ========================================================================

export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
  ParameterDescriptor,
  AlgorithmMetadata,
  AlgorithmConfig,
  AlgorithmParameters as BaseAlgorithmParameters,
  // on garde l'alias pour compat
  AlgorithmResult as BaseAlgorithmResult,
  BaseAlgorithm,
  XClassification,
  XClassifier,
} from "./algorithms/base";

// 👉 Expose aussi les noms canoniques attendus par les composants
export type {
  AlgorithmResult,
  EnhancedAlgorithmResult,
} from "./algorithms/base";

// Adaptateur universel
export type {
  BaseCalculator,
  AdapterConfig,
  ConstructibleAlgorithm,
} from "./algorithms/universal-adapter";

export { createUniversalAlgorithm } from "./algorithms/universal-adapter";

// ========================================================================
// UI & UTILS (si présents dans ton repo)
// ========================================================================

export * from "./ui";
export * from "./utils";

// ========================================================================
// RÉ-EXPORTS COMBINÉS (commodité)
// ========================================================================

// Variables
export type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
  VariableX,
  VariableY,
  XTag,
  YTag,
} from "./core/variables";

// Validation
export type {
  ValidationMetrics,
  ValidationResult,
  AlgorithmTestConfig,
  ValidationLevel,
  TVMetadata,
  TVValidationResult,
  XValidationResult,
  DisagreementCase,
  KappaMetrics,
  InterAnnotatorData,
} from "./core/validation";

// UI types (si définis)
export type {
  BaseValidationProps,
  XValidationProps,
  YValidationProps,
  M2ValidationProps,
} from "./ui";

// ========================================================================
// CONSTANTES & FONCTIONS PUBLIQUES
// ========================================================================

export const ALGORITHM_LAB_VERSION = "2.0.0";
export const SUPPORTED_VARIABLES = ["X", "Y", "M1", "M2", "M3"] as const;

export {
  isValidVariableTarget,
  getVariableColor,
  getVariableLabel,
} from "./core/variables";

export {
  validateCalculationInput,
  createEmptyResult,
} from "./core/calculations";

export { calculateMetrics, createValidationConfig } from "./core/validation";

// ✅ Ajoute normalizeAlgorithmResult ici (manquait avant)
export {
  isValidAlgorithmResult,
  normalizeAlgorithmResult,
  createErrorResult,
  createSuccessResult,
} from "./algorithms/base";

// ========================================================================
// INTERFACES UI COMPLÉMENTAIRES (utilisées par tes composants)
// ========================================================================

export interface SimpleMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sampleSize: number;
}

export interface MetricsPanelProps {
  metrics: ValidationMetrics | SimpleMetrics;
  title?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export interface ClassifierSelectorProps {
  selectedClassifier?: string;
  onClassifierChange: (classifier: string) => void;
  availableClassifiers: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  disabled?: boolean;
}

export interface ConfusionMatrixProps {
  metrics: ValidationMetrics | null;
  target?: VariableTarget;
  showLabels?: boolean;
  compact?: boolean;
}

```

## algorithms

### Arborescence
```text
algorithms/
- base.ts
- index.ts
- universal-adapter.ts
```

#### `AlgorithmLab/types/algorithms/base.ts`

**Exports**

- **Déclarations**: AlgorithmType, AlgorithmParameters, ParameterDescriptor, AlgorithmConfig, AlgorithmDescriptor, AlgorithmMetadata, UniversalAlgorithm, BaseAlgorithm, AlgorithmResult, UniversalResult, isValidAlgorithmResult, normalizeAlgorithmResult, validateErrorAnalysisResult, createErrorResult, createSuccessResult, createAlgorithmMetadata, convertLegacyMetadata, XClassification, XClassifier, BaseAlgorithmResult, EnhancedAlgorithmResult, AlgorithmConfig, ALGORITHM_CONFIGS, SpeakerType, InputFormat, UnifiedAlgorithmConfig, getAlgorithmsByTarget, getConfigForAlgorithm, getAllTargets, validateAlgorithmName

**Contenu**

```ts
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

// types/algorithms/base.ts - AJOUT à votre fichier existant
export interface AlgorithmConfig {
  target: VariableTarget;
  speakerType: "conseiller" | "client";
  inputFormat:
    | "simple"
    | "contextual"
    | "alignment"
    | "alignment_context"
    | "cognitive";
  requiresNextTurn: boolean;
  requiresPrevContext: boolean;
}

// ========================================================================
// CONFIGS DES ALGORITHMES - NOUVEAU
// ========================================================================

export const ALGORITHM_CONFIGS: Record<string, AlgorithmConfig> = {
  // === VARIABLE X ===
  RegexXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },
  OpenAIXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },
  OpenAI3TXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "contextual", // Utilise 3 tours dans useLevel1Testing
    requiresNextTurn: false,
    requiresPrevContext: true, // ✅ UTILISE prev1/prev2 existants
  },
  SpacyXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },

  // === VARIABLE Y ===
  RegexYClassifier: {
    target: "Y",
    speakerType: "client",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },

  // === VARIABLE M1 ===
  M1ActionVerbCounter: {
    target: "M1",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple vers M1Input
    requiresNextTurn: false,
    requiresPrevContext: false,
  },

  // === VARIABLE M2 ===
  M2LexicalAlignment: {
    target: "M2",
    speakerType: "conseiller", // Part du conseiller
    inputFormat: "alignment", // {t0, t1} depuis useLevel1Testing
    requiresNextTurn: true, // ✅ OBLIGATOIRE next_turn_verbatim
    requiresPrevContext: false,
  },
  M2SemanticAlignment: {
    target: "M2",
    speakerType: "conseiller",
    inputFormat: "alignment", // {t0, t1}
    requiresNextTurn: true, // ✅ OBLIGATOIRE next_turn_verbatim
    requiresPrevContext: false,
  },
  M2CompositeAlignment: {
    target: "M2",
    speakerType: "conseiller",
    inputFormat: "alignment_context", // {t0, t1, prev1, prev2}
    requiresNextTurn: true, // ✅ OBLIGATOIRE next_turn_verbatim
    requiresPrevContext: true, // ✅ UTILISE prev1/prev2 existants
  },
  // === VARIABLE M3 ===
  PausesM3Calculator: {
    speakerType: "client" as const, // M3 = tours client
    target: "M3",
    inputFormat: "cognitive" as const, // { segment, ... }
    requiresNextTurn: false,
    requiresPrevContext: false,
  },
};

// Types pour le système unifié
export type SpeakerType = "conseiller" | "client";
export type InputFormat =
  | "simple" // string simple
  | "contextual" // contexte 3 tours
  | "alignment" // {t0, t1}
  | "alignment_context" // {t0, t1, prev1, prev2}
  | "cognitive"; // M3Input {segment, options}

// Interface pour la configuration unifiée (renommée pour éviter conflit avec votre AlgorithmConfig existant)
export interface UnifiedAlgorithmConfig {
  target: VariableTarget;
  speakerType: SpeakerType;
  inputFormat: InputFormat;
  requiresNextTurn: boolean;
  requiresPrevContext: boolean;
  description?: string;
}

// Fonctions utilitaires pour la configuration
export const getAlgorithmsByTarget = (target: VariableTarget): string[] => {
  return Object.entries(ALGORITHM_CONFIGS)
    .filter(([, config]) => config.target === target)
    .map(([name]) => name);
};

export const getConfigForAlgorithm = (
  algorithmName: string
): UnifiedAlgorithmConfig | undefined => {
  return ALGORITHM_CONFIGS[algorithmName];
};

export const getAllTargets = (): VariableTarget[] => {
  return ["X", "Y", "M1", "M2", "M3"];
};

export const validateAlgorithmName = (algorithmName: string): boolean => {
  return algorithmName in ALGORITHM_CONFIGS;
};

```

#### `AlgorithmLab/types/algorithms/index.ts`

**Exports**

- **Nommés**: ALGORITHM_CONFIGS, getAlgorithmsByTarget, getConfigForAlgorithm, getAllTargets, validateAlgorithmName, createUniversalAlgorithm
- **Re-exports `*`** depuis: ./base, ./universal-adapter

**Contenu**

```ts
/**
 * @fileoverview Export centralisé des types algorithms AlgorithmLab
 * Point d'entrée principal pour tous les types d'algorithmes AlgorithmLab
 */

// Interface universelle et types de base
export * from "./base";

// Adaptateur universel
export * from "./universal-adapter";

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
} from "./base";

// ✅ AJOUT : Exports pour le système unifié
export type { AlgorithmConfig, SpeakerType, InputFormat } from "./base";

export {
  ALGORITHM_CONFIGS,
  getAlgorithmsByTarget,
  getConfigForAlgorithm,
  getAllTargets,
  validateAlgorithmName,
} from "./base";

export type { BaseCalculator, AdapterConfig } from "./universal-adapter";

// Export de la fonction principale
export { createUniversalAlgorithm } from "./universal-adapter";

```

#### `AlgorithmLab/types/algorithms/universal-adapter.ts`

**Exports**

- **Déclarations**: BaseCalculator, AdapterConfig, ConstructibleAlgorithm, createUniversalAlgorithm, createXAlgorithm, createYAlgorithm, createM1Algorithm, createM2Algorithm, createM3Algorithm

**Contenu**

```ts
/**
 * @fileoverview Adaptateur universel AlgorithmLab
 * - Convertit un calculateur (BaseAlgorithm<.., CalculationResult<..>>) en UniversalAlgorithm homogène
 * - Construit des descripteurs riches (AlgorithmDescriptor)
 * - Expose des helpers pour X / Y / M1 / M2 / M3
 */

import type { VariableTarget, VariableDetails } from "../core/variables";
import type { CalculationResult } from "../core/calculations";
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
  BaseAlgorithm,
  AlgorithmMetadata,
  AlgorithmConfig,
  ParameterDescriptor,
} from "./base";

// ========================================================================
// TYPES & INTERFACES
// ========================================================================

/**
 * Un "calculateur" est un BaseAlgorithm qui renvoie un CalculationResult<Details>.
 * On conserve le contrat existant : `key`, `meta`, `run(input, config?)`.
 */
export type BaseCalculator<
  TInput = unknown,
  TDetails extends VariableDetails = VariableDetails
> = BaseAlgorithm<TInput, CalculationResult<TDetails>>;

/**
 * Options d’adaptation / overrides pour enrichir le descripteur UI.
 */
export interface AdapterConfig {
  /** ID lisible (par défaut: `calculator.key`) */
  name?: string;
  /** Libellé affiché (par défaut: `calculator.meta?.label` ou `name`) */
  displayName?: string;
  /** Description longue */
  description?: string;
  /** Type d’implémentation (rule-based / ml / llm / hybrid) */
  algorithmType?: AlgorithmType;
  /** Semver (par défaut: `calculator.meta?.version` ou "1.0.0") */
  version?: string;
  /** Le modèle requiert-il du contexte conversationnel ? */
  requiresContext?: boolean;
  /** Prend en charge le batch ? */
  batchSupported?: boolean;
  /** Paramètres affichables en UI */
  parameters?: Record<string, ParameterDescriptor>;
}

/** Constructeur sans argument d’un algo (utile pour registres dynamiques) */
export interface ConstructibleAlgorithm<A = UniversalAlgorithm> {
  new (): A;
}

// ========================================================================
// BUILD DESCRIPTOR
// ========================================================================

function buildDescriptor(
  calculator: { key: string; meta?: AlgorithmMetadata },
  target: VariableTarget,
  overrides?: AdapterConfig
): AlgorithmDescriptor {
  const name = overrides?.name ?? calculator.key;
  const displayName = overrides?.displayName ?? calculator.meta?.label ?? name;
  const version = overrides?.version ?? calculator.meta?.version ?? "1.0.0";
  const description =
    overrides?.description ?? calculator.meta?.description ?? "";

  const type: AlgorithmType =
    overrides?.algorithmType ??
    // fallback "rule-based" si non renseigné
    ("rule-based" as AlgorithmType);

  return {
    name,
    displayName,
    version,
    type,
    target,
    batchSupported: !!overrides?.batchSupported,
    requiresContext: !!overrides?.requiresContext,
    description,
    parameters: overrides?.parameters,
    examples: calculator.meta?.tags?.map((t) => ({
      input: { tag: t },
      note: "Exemple basé sur tag méta",
    })),
  };
}

// ========================================================================
// MAPPING: CalculationResult → UniversalResult
// ========================================================================

function toUniversalResult(
  calc: CalculationResult<VariableDetails>,
  algoVersion?: string
): UniversalResult {
  // Prediction en string robuste
  const rawPred: unknown = (calc as any)?.prediction;
  const prediction =
    typeof rawPred === "string"
      ? rawPred
      : typeof rawPred === "number"
      ? String(rawPred)
      : typeof rawPred === "boolean"
      ? rawPred
        ? "TRUE"
        : "FALSE"
      : "UNKNOWN";

  // Clamp confiance
  const confidence =
    typeof calc.confidence === "number"
      ? Math.max(0, Math.min(1, calc.confidence))
      : 0;

  const processingTime =
    typeof calc.processingTime === "number" ? calc.processingTime : 0;

  const version = algoVersion || calc.metadata?.algorithmVersion || "unknown";

  const warnings = Array.isArray(calc.metadata?.warnings)
    ? calc.metadata?.warnings
    : [];

  return {
    prediction,
    confidence,
    processingTime,
    algorithmVersion: version,
    metadata: {
      inputSignature: calc.metadata?.inputSignature,
      inputType: "unknown",
      executionPath: calc.metadata?.executionPath ?? [],
      warnings,
      details: calc.details,
    },
  };
}

// ========================================================================
// ADAPTATEUR GÉNÉRIQUE
// ========================================================================

/**
 * Enveloppe un BaseCalculator en UniversalAlgorithm cohérent pour l’UI.
 */
export function createUniversalAlgorithm<
  TInput = unknown,
  TDetails extends VariableDetails = VariableDetails
>(
  calculator: BaseCalculator<TInput, TDetails>,
  target: VariableTarget,
  overrides?: AdapterConfig
): UniversalAlgorithm {
  const descriptor = buildDescriptor(
    { key: calculator.key, meta: calculator.meta },
    target,
    overrides
  );

  return {
    describe(): AlgorithmDescriptor {
      return descriptor;
    },

    validateConfig(): boolean {
      // À étendre si nécessaire : vérification de `overrides.parameters` etc.
      return true;
    },

    // Rétro-compat : certains panneaux utilisent encore `classify(string)`
    async classify(input: string): Promise<UniversalResult> {
      const out = await Promise.resolve(
        calculator.run(input as unknown as TInput)
      );
      return toUniversalResult(
        out as CalculationResult<VariableDetails>,
        descriptor.version
      );
    },

    // Exécution typée
    async run(input: unknown): Promise<UniversalResult> {
      const out = await Promise.resolve(calculator.run(input as TInput));
      return toUniversalResult(
        out as CalculationResult<VariableDetails>,
        descriptor.version
      );
    },

    // Batch optionnel
    async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
      const results: UniversalResult[] = [];
      for (const item of inputs) {
        const out = await Promise.resolve(calculator.run(item as TInput));
        results.push(
          toUniversalResult(
            out as CalculationResult<VariableDetails>,
            descriptor.version
          )
        );
      }
      return results;
    },
  };
}

// ========================================================================
// HELPERS PAR VARIABLE
// ========================================================================

export function createXAlgorithm(
  calculator: BaseCalculator,
  overrides?: AdapterConfig
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "X", {
    displayName: "X Classifier (AlgorithmLab)",
    description:
      "Classification X (Reflet / Ouverture / Engagement / Explication)",
    algorithmType: "ml",
    requiresContext: false,
    ...overrides,
  });
}

export function createYAlgorithm(
  calculator: BaseCalculator,
  overrides?: AdapterConfig
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "Y", {
    displayName: "Y Classifier (AlgorithmLab)",
    description: "Polarité client (Positif / Négatif / Neutre)",
    algorithmType: "ml",
    requiresContext: false,
    ...overrides,
  });
}

export function createM1Algorithm(
  calculator: BaseCalculator,
  overrides?: AdapterConfig
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "M1", {
    displayName: "M1 Action Verb Density",
    description: "Densité de verbes d’action (M1)",
    algorithmType: "rule-based",
    ...overrides,
  });
}

export function createM2Algorithm(
  calculator: BaseCalculator,
  overrides?: AdapterConfig
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "M2", {
    displayName: "M2 Alignment (Lexical/Semantic)",
    description: "Alignement lexical+semantique T0 ↔ T+1 (M2)",
    algorithmType: "hybrid",
    requiresContext: true,
    ...overrides,
  });
}

export function createM3Algorithm(
  calculator: BaseCalculator,
  overrides?: AdapterConfig
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "M3", {
    displayName: "M3 Temporal/Cognitive Metrics",
    description: "Indicateurs temporels et charge cognitive (M3)",
    algorithmType: "rule-based",
    ...overrides,
  });
}

```

## core

### Arborescence
```text
core/
- calculations.ts
- index.ts
- level0.ts
- validation.ts
- variables.ts
```

#### `AlgorithmLab/types/core/calculations.ts`

**Exports**

- **Déclarations**: XInput, YInput, M1Input, M2Input, M3Input, AnyCalculationInput, CalculationInput, CalculationMetadata, CalculationResult, XCalculationResult, YCalculationResult, M1CalculationResult, M2CalculationResult, M3CalculationResult, createEmptyResult, validateCalculationInput, mergeWarnings, mergeExecutionPaths

**Contenu**

```ts
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

```

#### `AlgorithmLab/types/core/index.ts`

**Exports**

- **Nommés**: isValidVariableTarget, getVariableColor, getVariableLabel
- **Re-exports `*`** depuis: ./validation

**Contenu**

```ts
/**
 * @fileoverview Barrel des types "core" d'AlgorithmLab.
 * On évite les collisions et on respecte 'isolatedModules'
 * en distinguant les ré-exports de types vs de valeurs.
 */

// -------------------------
// Exports depuis ./variables
// -------------------------

// ✅ Tous ces symboles sont des TYPES -> `export type { ... }`
export type {
  // Types de variables
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details,
  M3Details,
  VariableX,
  XTag,
  YTag,
} from "./variables";

// ✅ Ces symboles sont des VALEURS (fonctions) -> `export { ... }`
export {
  isValidVariableTarget,
  getVariableColor,
  getVariableLabel,
} from "./variables";

// -------------------------
// Exports depuis ./validation
// -------------------------
// Ici on peut garder un export global. S'il y avait un conflit de nom,
// on le résoudrait explicitement comme ci-dessus.
export * from "./validation";

// Alias de compat pour l'UI qui attend ce nom précis
export type { TVValidationResult as TVValidationResultCore } from "./validation";

```

#### `AlgorithmLab/types/core/level0.ts`

**Exports**

- **Déclarations**: InterAnnotatorData, KappaMetrics, DisagreementCase

**Contenu**

```ts
// src/app/(protected)/analysis/components/AlgorithmLab/types/core/level0.ts

export interface InterAnnotatorData {
  annotators: string[];
  items: Array<{
    id: string;
    labels: Record<string, string>; // annotator -> label
  }>;
}

export interface KappaMetrics {
  kappa: number; // -1..1
  observedAgreement: number; // 0..1
  expectedAgreement: number; // 0..1
  interpretation?:
    | "poor"
    | "slight"
    | "fair"
    | "moderate"
    | "substantial"
    | "almost perfect";
}

export interface DisagreementCase {
  itemId: string;
  labels: Record<string, string>; // annotator -> label
  notes?: string;
}

```

#### `AlgorithmLab/types/core/validation.ts`

**Exports**

- **Déclarations**: TVMetadataCore, TVMetadata, TVValidationResultCore, ValidationRow, ValidationMetrics, ValidationResult, XGoldStandardItem, XValidationResult, TVMetadataM2, TVValidationResult, CoreTVValidationResult, CoreTVMetadata, AlgorithmTestConfig, DisagreementCase, KappaMetrics, InterAnnotatorData, ValidationLevel, calculateMetrics, createValidationConfig

**Contenu**

```ts
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

```

#### `AlgorithmLab/types/core/variables.ts`

**Exports**

- **Déclarations**: VariableTarget, ValidationLevel, VariableX, XTag, YTag, VariableY, XDetails, YDetails, M1Details, M2Details, M3Details, XValue, YValue, VariableM1Score, VariableM2Score, VariableM3Score, VariableDetails, VARIABLE_LABELS, VARIABLE_COLORS, isValidVariableTarget, getVariableColor, getVariableLabel

**Contenu**

```ts
// ===================================================================
// 3. CORRECTION: src/app/(protected)/analysis/components/AlgorithmLab/types/core/variables.ts
// ===================================================================

/**
 * @fileoverview Variables & détails AlgorithmLab — version unifiée et canonique
 * - Ordre logique (tags avant usages)
 * - Pas de redéclarations : une seule interface par nom
 * - Compat ascendante : anciens champs conservés en option
 * ✅ CORRECTION: Ajout des propriétés M3Details manquantes (pauseCount, hesitationCount, speechRate, markers)
 */

// ========================================================================
// 1) Cibles principales
// ========================================================================
export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

// (utilisé par useWorkflowManagement)
export type ValidationLevel = "LEVEL0" | "LEVEL1" | "LEVEL2";

// ========================================================================
// 2) Tags X/Y (catégories canoniques)
// ========================================================================

// VariableX est utilisée comme union de libellés
export type VariableX =
  | "ENGAGEMENT"
  | "EXPLICATION"
  | "REFLET_ACQ"
  | "REFLET_JE"
  | "REFLET_VOUS"
  | "OUVERTURE";

// XTag = VariableX avec extensions
export type XTag = VariableX | "REFLET" | "CLOTURE" | "AUTRE_X";

export type YTag =
  | "CLIENT_POSITIF"
  | "CLIENT_NEGATIF"
  | "CLIENT_NEUTRE"
  | "CLIENT_QUESTION" // ← Si utilisé dans RegexYClassifier
  | "CLIENT_SILENCE" // ← Si utilisé dans RegexYClassifier
  | "AUTRE_Y";

export type VariableY = YTag;

// ========================================================================
// 3) Détails par variable (définitions uniques)
// ========================================================================

export interface XDetails {
  // Propriétés existantes
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];
  verbCount?: number;
  actionVerbs?: string[];
  pronounUsage?: {
    je: number;
    vous: number;
    nous: number;
  };
  questionMarkers?: string[];
  declarativeMarkers?: string[];
  effectiveness?: {
    clientResponse: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    alignmentScore: number;
    nextTurnLabel?: string;
  };
  label?: string;

  // ✅ NOUVELLES propriétés optionnelles pour useLevel1Testing
  confidence?: number; // Erreur ligne 94
  matchedPatterns?: string[]; // Utilisé ligne 96
  rationale?: string; // Utilisé ligne 97
  probabilities?: any; // Utilisé ligne 98
  spans?: any; // Utilisé ligne 99
}

export interface YDetails {
  // Propriétés existantes
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  emotionalIntensity?: number;
  linguisticMarkers?: string[];
  responseType?: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL";
  conversationalMetrics?: {
    latency: number;
    verbosity: number;
    coherence: number;
  };
  label?: string;

  // ✅ NOUVELLES propriétés optionnelles pour useLevel1Testing
  confidence?: number; // Erreur ligne 108
  cues?: string[]; // Utilisé ligne 110
  sentimentProxy?: any; // Utilisé ligne 111
  spans?: any; // Utilisé ligne 112
}

export interface M1Details {
  // Ancienne spec (compat)
  value?: number;
  actionVerbCount?: number;
  totalTokens?: number;
  verbsFound?: string[];

  // Spec enrichie
  score?: number;
  verbCount?: number;
  averageWordLength?: number;
  sentenceComplexity?: number;
  lexicalDiversity?: number;
  syntacticComplexity?: number;
  semanticCoherence?: number;
}

export interface M2Details {
  // Ancienne spec (compat)
  value?: string | number;
  scale?: string;

  // Spec enrichie
  lexicalAlignment?: number;
  syntacticAlignment?: number;
  semanticAlignment?: number;
  overall?: number;

  sharedTerms?: string[];
  alignmentVector?: number[];
  distanceMetrics?: {
    euclidean: number;
    cosine: number;
    jaccard: number;
  };
}

export interface M3Details {
  // Ancienne spec (compat)
  value?: number;
  unit?: "ms" | "s";

  // Spec enrichie
  fluidity?: number;
  cognitiveLoad?: number;
  processingEfficiency?: number;

  attentionalFocus?: number;
  workingMemoryUsage?: number;
  executiveControl?: number;

  predictedSatisfaction?: number;
  predictedCompliance?: number;

  // ✅ CORRECTION MAJEURE: Ajout des propriétés manquantes signalées dans les erreurs
  pauseCount?: number; // Erreur dans M3ValidationInterface.tsx:107,300
  hesitationCount?: number; // Erreur dans M3ValidationInterface.tsx:109,302
  speechRate?: number; // Erreur dans M3ValidationInterface.tsx:111,305
  markers?: Array<{
    type: string;
    timestamp: number;
    confidence: number;
    value?: string | number;
  }>; // Erreur dans M3ValidationInterface.tsx:314
}

// ========================================================================
// 4) Objets composés X/Y (tag + détails)
// ========================================================================
export interface XValue {
  tag: XTag;
  details: XDetails;
}

export interface YValue {
  tag: YTag;
  details: YDetails;
}

export interface VariableM1Score {
  value: number;
  components?: Record<string, number>;
}

export interface VariableM2Score {
  value: number;
  alignment?: "low" | "medium" | "high";
  components?: Record<string, number>;
}

export interface VariableM3Score {
  value: number;
  components?: Record<string, number>;
}

// ========================================================================
// 5) Union de détails + utilitaires d'affichage
// ========================================================================
export type VariableDetails =
  | XDetails
  | YDetails
  | M1Details
  | M2Details
  | M3Details;

export const VARIABLE_LABELS = {
  X: "Actes conversationnels conseiller",
  Y: "Réactions client",
  M1: "Métriques linguistiques",
  M2: "Alignement interactionnel",
  M3: "Indicateurs cognitifs",
} as const satisfies Record<VariableTarget, string>;

export const VARIABLE_COLORS = {
  X: "#2196F3",
  Y: "#4CAF50",
  M1: "#FF9800",
  M2: "#9C27B0",
  M3: "#F44336",
} as const satisfies Record<VariableTarget, string>;

// ========================================================================
// 6) Helpers
// ========================================================================
export function isValidVariableTarget(
  target: string
): target is VariableTarget {
  return (
    target === "X" ||
    target === "Y" ||
    target === "M1" ||
    target === "M2" ||
    target === "M3"
  );
}

export function getVariableColor(target: VariableTarget): string {
  return VARIABLE_COLORS[target];
}

export function getVariableLabel(target: VariableTarget): string {
  return VARIABLE_LABELS[target];
}

```

## legacy

### Arborescence
```text
legacy/
```

## ui

### Arborescence
```text
ui/
- components.ts
- index.ts
- validation.ts
```

#### `AlgorithmLab/types/ui/components.ts`

**Exports**

- **Déclarations**: BaseValidationProps, DisplayConfig, ConfigFormProps, ResultDisplayProps, ResultsPanelProps, TVResultDisplayProps, TargetKind, ExtraColumn, MetricsPanelProps, SimpleMetrics, ClassifierSelectorProps, ClassifierSelectorAlgorithm, ConfusionMatrixProps, ModalProps, createDefaultDisplayConfig, withDisplayDefaults, validateConfigSchema

**Contenu**

```ts
/**
 * @fileoverview Types de composants UI AlgorithmLab
 * Interfaces spécifiques aux composants d'interface AlgorithmLab
 * ✅ CORRECTION: Ajout des props manquantes pour ResultsPanel, ConfusionMatrix, etc.
 */

import type { ReactNode, CSSProperties } from "react";
import type {
  VariableTarget,
  ValidationMetrics,
  TVValidationResultCore,
} from "../core";

// ========================================================================
// PROPS DE VALIDATION DE BASE ALGORITHMLAB
// ========================================================================

export interface BaseValidationProps {
  // Identifiants
  callId: string;
  algorithmName: string;

  // Configuration AlgorithmLab
  target: VariableTarget;
  autoValidate?: boolean;
  showMetrics?: boolean;

  // Données
  testData?: Array<{
    input: string;
    expected: string;
    metadata?: Record<string, any>;
  }>;

  // Callbacks
  onValidationComplete?: (metrics: ValidationMetrics) => void;
  onValidationError?: (error: Error) => void;
  onConfigChange?: (config: any) => void;

  // UI
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
}

// ========================================================================
// CONFIGURATION D'AFFICHAGE ALGORITHMLAB
// ========================================================================

export interface DisplayConfig {
  // Thème et apparence
  theme?: "light" | "dark" | "auto";
  compact?: boolean;
  showAdvanced?: boolean;

  // Colonnes et sections
  visibleColumns?: string[];
  collapsedSections?: string[];

  // Métriques
  showConfidence?: boolean;
  showProcessingTime?: boolean;
  showMetadata?: boolean;

  // Graphiques et visualisations
  chartsEnabled?: boolean;
  animationsEnabled?: boolean;
  colorScheme?: "default" | "accessibility" | "colorblind";

  // Pagination et filtres
  pageSize?: number;
  defaultFilters?: Record<string, any>;
  sortOrder?: "asc" | "desc";
  sortBy?: string;
}

// ========================================================================
// INTERFACES DE CONFIGURATION ALGORITHMLAB
// ========================================================================

export interface ConfigFormProps {
  // Configuration actuelle
  config: Record<string, any>;

  // Schema de configuration
  schema: {
    [key: string]: {
      type: "string" | "number" | "boolean" | "select" | "multiselect";
      label: string;
      description?: string;
      required?: boolean;
      default?: any;
      options?: Array<{ label: string; value: any }>;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
      };
    };
  };

  // Callbacks
  onChange: (config: Record<string, any>) => void;
  onSubmit?: (config: Record<string, any>) => void;
  onReset?: () => void;
  onValidate?: (config: Record<string, any>) => string[] | null;

  // UI
  layout: "vertical" | "horizontal" | "grid";
  showAdvanced: boolean;
  disabled?: boolean;
}

// ========================================================================
// INTERFACES DE RÉSULTATS ALGORITHMLAB
// ========================================================================

export interface ResultDisplayProps {
  // Données des résultats
  results: Array<{
    id: string;
    input: string;
    predicted: string;
    expected?: string;
    confidence: number;
    processingTime: number;
    metadata?: Record<string, any>;
  }>;

  // Configuration d'affichage (optionnelle pour merge avec défauts)
  displayConfig?: DisplayConfig;

  // Interactions
  onResultSelect?: (id: string) => void;
  onResultEdit?: (id: string, newValue: string) => void;
  onResultDelete?: (id: string) => void;

  // Filtres et tri
  filters?: Record<string, any>;
  onFiltersChange?: (filters: Record<string, any>) => void;

  // Actions groupées
  selectedResults?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
}

export interface ResultsPanelProps {
  results: TVValidationResultCore[];
  display?: DisplayConfig;

  // Propriétés existantes (déjà présentes)
  limit?: number;
  showPagination?: boolean;
  onResultSelect?: (result: any) => void;
  displayMode?: "table" | "cards" | "list";

  // ✅ AJOUTER ces nouvelles propriétés optionnelles pour M2ValidationInterface
  targetKind?: "X" | "Y" | "M1" | "M2" | "M3";
  classifierLabel?: string;
  initialPageSize?: number;
}

// Optionnel : variante stricte TV pour d'autres composants UI
export interface TVResultDisplayProps {
  results: TVValidationResultCore[];
  display?: DisplayConfig;
  onRowSelect?: (index: number) => void;
}

export type TargetKind = "X" | "Y" | "M1" | "M2" | "M3";

export type ExtraColumn<Row = any> = {
  id: string;
  header: string;
  render: (row: Row) => unknown; // opaque; UI gère le rendu
};

// ========================================================================
// TYPES POUR COMPOSANTS MANQUANTS
// ========================================================================

// ✅ AJOUT: Interface pour MetricsPanel (TechnicalValidation/index.ts:5)
export interface MetricsPanelProps {
  metrics: ValidationMetrics | SimpleMetrics;
  title?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export interface SimpleMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sampleSize: number;
}

// ✅ AJOUT: Interface pour ClassifierSelector (TechnicalValidation.tsx:17)
export interface ClassifierSelectorProps {
  // Propriétés existantes (déjà présentes)
  selectedClassifier?: string;
  onClassifierChange?: (classifier: string) => void; // Rendre optionnelle
  availableClassifiers?: Array<{
    // Rendre optionnelle
    id: string;
    name: string;
    description?: string;
  }>;
  disabled?: boolean;

  // ✅ AJOUTER ces nouvelles propriétés pour M2ValidationInterface
  algorithms?: ClassifierSelectorAlgorithm[];
  selected?: string;
  onSelectClassifier?: (id: string) => void;
  target?: "X" | "Y" | "M1" | "M2" | "M3";
}

export interface ClassifierSelectorAlgorithm {
  id: string;
  name: string;
  description: string;
  differential: number;
  time: number;
  accuracy: number;
}
// ✅ AJOUT: Interface pour ConfusionMatrix (Level1Interface.tsx:93)
export interface ConfusionMatrixProps {
  metrics: ValidationMetrics | null; // Propriété metrics manquante corrigée
  target?: VariableTarget;
  showLabels?: boolean;
  compact?: boolean;
}

// ========================================================================
// MODALES ET DIALOGUES ALGORITHMLAB
// ========================================================================

export interface ModalProps {
  // État
  open: boolean;
  onClose: () => void;

  // Contenu
  title: string;
  content: ReactNode;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
  }>;

  // Configuration
  size: "small" | "medium" | "large" | "fullscreen";
  closable: boolean;
  backdrop: boolean;
  escapeToClose: boolean;

  // Styles
  className?: string;
  contentClassName?: string;
}

// ========================================================================
// UTILITAIRES DE COMPOSANTS ALGORITHMLAB
// ========================================================================

export function createDefaultDisplayConfig(): Required<DisplayConfig> {
  return {
    theme: "auto",
    compact: false,
    showAdvanced: false,
    visibleColumns: ["input", "predicted", "confidence"],
    collapsedSections: [],
    showConfidence: true,
    showProcessingTime: true,
    showMetadata: false,
    chartsEnabled: true,
    animationsEnabled: true,
    colorScheme: "default",
    pageSize: 25,
    defaultFilters: {},
    sortOrder: "desc",
    sortBy: "confidence",
  };
}

/** Merge sûr des overrides avec les valeurs par défaut (immutabilité) */
export function withDisplayDefaults(
  cfg?: DisplayConfig
): Required<DisplayConfig> {
  const d = createDefaultDisplayConfig();
  return { ...d, ...(cfg ?? {}) };
}

/** Validation simple d'un schema de config de formulaire */
export function validateConfigSchema(
  config: Record<string, any>,
  schema: ConfigFormProps["schema"]
): string[] {
  const errors: string[] = [];

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = config[key];

    // Champ requis
    if (
      fieldSchema.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${fieldSchema.label} est requis`);
      continue;
    }

    // Validation par type
    if (value !== undefined && value !== null) {
      switch (fieldSchema.type) {
        case "number":
          if (typeof value !== "number") {
            errors.push(`${fieldSchema.label} doit être un nombre`);
          } else {
            if (
              fieldSchema.validation?.min !== undefined &&
              value < fieldSchema.validation.min
            ) {
              errors.push(
                `${fieldSchema.label} doit être au moins ${fieldSchema.validation.min}`
              );
            }
            if (
              fieldSchema.validation?.max !== undefined &&
              value > fieldSchema.validation.max
            ) {
              errors.push(
                `${fieldSchema.label} ne peut pas dépasser ${fieldSchema.validation.max}`
              );
            }
          }
          break;

        case "string":
          if (typeof value !== "string") {
            errors.push(
              `${fieldSchema.label} doit être une chaîne de caractères`
            );
          } else if (fieldSchema.validation?.pattern) {
            const regex = new RegExp(fieldSchema.validation.pattern);
            if (!regex.test(value)) {
              errors.push(
                `${fieldSchema.label} ne respecte pas le format requis`
              );
            }
          }
          break;

        case "boolean":
          if (typeof value !== "boolean") {
            errors.push(`${fieldSchema.label} doit être vrai ou faux`);
          }
          break;
      }
    }
  }

  return errors;
}

```

#### `AlgorithmLab/types/ui/index.ts`

**Exports**

- **Re-exports `*`** depuis: ./components, ./validation

**Contenu**

```ts
/**
 * @fileoverview Export centralisé des types UI AlgorithmLab
 * Point d'entrée principal pour tous les types d'interface utilisateur AlgorithmLab
 */

// Composants génériques
export * from './components';

// Validation spécialisée
export * from './validation';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  BaseValidationProps,
  DisplayConfig,
  ConfigFormProps,
  ResultDisplayProps,
  ModalProps
} from './components';

export type {
  XValidationProps,
  YValidationProps,
  M1ValidationProps,
  M2ValidationProps,
  M3ValidationProps,
  AllValidationProps
} from './validation';

```

#### `AlgorithmLab/types/ui/validation.ts`

**Exports**

- **Déclarations**: XValidationProps, YValidationProps, M1ValidationProps, M2ValidationProps, M3ValidationProps, createXValidationConfig, createYValidationConfig, createM2ValidationConfig, AllValidationProps, validateValidationProps, getValidationConfigDefaults

**Contenu**

```ts
/**
 * @fileoverview Types de validation UI AlgorithmLab
 * Props spécifiques pour validation des algorithmes AlgorithmLab
 */

import { BaseValidationProps } from './components';
import { XInput, YInput, M1Input, M2Input, M3Input } from '../core/calculations';
import { XDetails, YDetails, M1Details, M2Details, M3Details } from '../core/variables';

// ========================================================================
// PROPS DE VALIDATION SPÉCIALISÉES ALGORITHMLAB
// ========================================================================

export interface XValidationProps extends BaseValidationProps {
  target: "X";
  
  // Configuration spécifique X AlgorithmLab
  xConfig: {
    analyzeActionVerbs: boolean;
    detectPronouns: boolean;
    classifyQuestions: boolean;
    contextWindow: number; // tours de contexte
  };
  
  // Données spécifiques X
  testInputs?: XInput[];
  expectedOutputs?: Array<{
    tag: string;
    details: Partial<XDetails>;
  }>;
  
  // Callbacks spécialisés
  onActionVerbsAnalyzed?: (verbs: string[]) => void;
  onPronounUsageDetected?: (usage: {je: number, vous: number, nous: number}) => void;
  onQuestionTypeClassified?: (type: "OPEN" | "CLOSED" | "NONE") => void;
}

export interface YValidationProps extends BaseValidationProps {
  target: "Y";
  
  // Configuration spécifique Y AlgorithmLab
  yConfig: {
    analyzeSentiment: boolean;
    detectEmotion: boolean;
    classifyResponse: boolean;
    emotionThreshold: number; // 0-1
  };
  
  // Données spécifiques Y
  testInputs?: YInput[];
  expectedOutputs?: Array<{
    tag: string;
    details: Partial<YDetails>;
  }>;
  
  // Callbacks spécialisés
  onSentimentAnalyzed?: (sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL") => void;
  onEmotionDetected?: (intensity: number) => void;
  onResponseClassified?: (type: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL") => void;
}

export interface M1ValidationProps extends BaseValidationProps {
  target: "M1";
  
  // Configuration spécifique M1 AlgorithmLab
  m1Config: {
    calculateLexicalDiversity: boolean;
    analyzeSyntacticComplexity: boolean;
    measureSemanticCoherence: boolean;
    linguisticDepth: "BASIC" | "ADVANCED" | "COMPREHENSIVE";
  };
  
  // Données spécifiques M1
  testInputs?: M1Input[];
  expectedOutputs?: Array<{
    score: number;
    details: Partial<M1Details>;
  }>;
  
  // Callbacks spécialisés
  onLexicalDiversityCalculated?: (diversity: number) => void;
  onSyntacticComplexityAnalyzed?: (complexity: number) => void;
  onSemanticCoherenceMeasured?: (coherence: number) => void;
}

export interface M2ValidationProps extends BaseValidationProps {
  target: "M2";
  
  // Configuration spécifique M2 AlgorithmLab
  m2Config: {
    calculateLexicalAlignment: boolean;
    calculateSyntacticAlignment: boolean;
    calculateSemanticAlignment: boolean;
    extractSharedTerms: boolean;
    distanceMetrics: Array<"euclidean" | "cosine" | "jaccard">;
  };
  
  // Données spécifiques M2
  testInputs?: M2Input[];
  expectedOutputs?: Array<{
    alignment: number;
    details: Partial<M2Details>;
  }>;
  
  // Callbacks spécialisés
  onAlignmentCalculated?: (
    lexical: number,
    syntactic: number,
    semantic: number,
    overall: number
  ) => void;
  onSharedTermsExtracted?: (terms: string[]) => void;
  onDistanceMetricsCalculated?: (metrics: {euclidean: number, cosine: number, jaccard: number}) => void;
}

export interface M3ValidationProps extends BaseValidationProps {
  target: "M3";
  
  // Configuration spécifique M3 AlgorithmLab
  m3Config: {
    assessCognitiveLoad: boolean;
    measureProcessingEfficiency: boolean;
    predictSatisfaction: boolean;
    predictCompliance: boolean;
    cognitiveMetrics: Array<"fluidity" | "attentionalFocus" | "workingMemoryUsage" | "executiveControl">;
  };
  
  // Données spécifiques M3
  testInputs?: M3Input[];
  expectedOutputs?: Array<{
    cognitiveScore: number;
    details: Partial<M3Details>;
  }>;
  
  // Callbacks spécialisés
  onCognitiveLoadAssessed?: (load: number) => void;
  onProcessingEfficiencyMeasured?: (efficiency: number) => void;
  onSatisfactionPredicted?: (satisfaction: number) => void;
  onCompliancePredicted?: (compliance: number) => void;
}

// ========================================================================
// FACTORY FUNCTIONS ALGORITHMLAB
// ========================================================================

export function createXValidationConfig(
  callId: string,
  algorithmName: string,
  overrides: Partial<XValidationProps> = {}
): XValidationProps {
  return {
    callId,
    algorithmName,
    target: "X",
    xConfig: {
      analyzeActionVerbs: true,
      detectPronouns: true,
      classifyQuestions: true,
      contextWindow: 3,
      ...overrides.xConfig
    },
    autoValidate: false,
    showMetrics: true,
    ...overrides
  };
}

export function createYValidationConfig(
  callId: string,
  algorithmName: string,
  overrides: Partial<YValidationProps> = {}
): YValidationProps {
  return {
    callId,
    algorithmName,
    target: "Y",
    yConfig: {
      analyzeSentiment: true,
      detectEmotion: true,
      classifyResponse: true,
      emotionThreshold: 0.5,
      ...overrides.yConfig
    },
    autoValidate: false,
    showMetrics: true,
    ...overrides
  };
}

export function createM2ValidationConfig(
  callId: string,
  algorithmName: string,
  overrides: Partial<M2ValidationProps> = {}
): M2ValidationProps {
  return {
    callId,
    algorithmName,
    target: "M2",
    m2Config: {
      calculateLexicalAlignment: true,
      calculateSyntacticAlignment: true,
      calculateSemanticAlignment: true,
      extractSharedTerms: true,
      distanceMetrics: ["euclidean", "cosine", "jaccard"],
      ...overrides.m2Config
    },
    autoValidate: false,
    showMetrics: true,
    ...overrides
  };
}

// ========================================================================
// UTILITAIRES DE VALIDATION UI ALGORITHMLAB
// ========================================================================

export type AllValidationProps = 
  | XValidationProps 
  | YValidationProps 
  | M1ValidationProps 
  | M2ValidationProps 
  | M3ValidationProps;

export function validateValidationProps(props: AllValidationProps): string[] {
  const errors: string[] = [];
  
  // Validation commune
  if (!props.callId) {
    errors.push("callId est requis");
  }
  
  if (!props.algorithmName) {
    errors.push("algorithmName est requis");
  }
  
  if (!props.target) {
    errors.push("target est requis");
  }
  
  // Validation spécifique par type
  switch (props.target) {
    case "X":
      const xProps = props as XValidationProps;
      if (xProps.xConfig.contextWindow < 0) {
        errors.push("contextWindow doit être positif");
      }
      break;
      
    case "Y":
      const yProps = props as YValidationProps;
      if (yProps.yConfig.emotionThreshold < 0 || yProps.yConfig.emotionThreshold > 1) {
        errors.push("emotionThreshold doit être entre 0 et 1");
      }
      break;
      
    case "M2":
      const m2Props = props as M2ValidationProps;
      if (m2Props.m2Config.distanceMetrics.length === 0) {
        errors.push("Au moins une métrique de distance doit être sélectionnée");
      }
      break;
  }
  
  return errors;
}

export function getValidationConfigDefaults(target: string): any {
  switch (target) {
    case "X":
      return {
        analyzeActionVerbs: true,
        detectPronouns: true,
        classifyQuestions: true,
        contextWindow: 3
      };
      
    case "Y":
      return {
        analyzeSentiment: true,
        detectEmotion: true,
        classifyResponse: true,
        emotionThreshold: 0.5
      };
      
    case "M1":
      return {
        calculateLexicalDiversity: true,
        analyzeSyntacticComplexity: true,
        measureSemanticCoherence: true,
        linguisticDepth: "ADVANCED"
      };
      
    case "M2":
      return {
        calculateLexicalAlignment: true,
        calculateSyntacticAlignment: true,
        calculateSemanticAlignment: true,
        extractSharedTerms: true,
        distanceMetrics: ["euclidean", "cosine", "jaccard"]
      };
      
    case "M3":
      return {
        assessCognitiveLoad: true,
        measureProcessingEfficiency: true,
        predictSatisfaction: true,
        predictCompliance: true,
        cognitiveMetrics: ["fluidity", "attentionalFocus", "workingMemoryUsage", "executiveControl"]
      };
      
    default:
      return {};
  }
}

```

## utils

### Arborescence
```text
utils/
- converters.ts
- corpusFilters.ts
- index.ts
- inputPreparation.ts
- normalizers.ts
```

#### `AlgorithmLab/types/utils/converters.ts`

**Exports**

- **Déclarations**: ConversionDirection, ConversionConfig, ConversionResult, FormatAdapter, LegacyToUniversalAdapter, ExportAdapter, DataTransformation, ChainedTransformation, LegacyMapping, ALGORITHM_LAB_LEGACY_MAPPINGS, createFormatAdapter, createChainedTransformation, convertLegacyToUniversal, validateConversionResult

**Contenu**

```ts
/**
 * @fileoverview Types et utilitaires pour la conversion de données AlgorithmLab
 * Conversion entre formats, adaptateurs et transformations AlgorithmLab
 */

import type { VariableTarget, VariableDetails } from "../core/variables";
import type { CalculationInput, CalculationResult } from "../core/calculations";
import type { UniversalResult } from "../algorithms/base";

// ========================================================================
// TYPES DE CONVERSION ALGORITHMLAB
// ========================================================================

export type ConversionDirection =
  | "TO_UNIVERSAL"
  | "FROM_UNIVERSAL"
  | "BETWEEN_FORMATS";

export interface ConversionConfig {
  direction: ConversionDirection;
  sourceFormat: string;
  targetFormat: string;
  preserveMetadata: boolean;
  strictMode: boolean; // Échoue si conversion incomplète
  defaultValues?: Record<string, unknown>;
  customMappings?: Record<string, string>;
}

export interface ConversionResult<T = unknown> {
  success: boolean;
  data: T;
  warnings: string[];
  errors: string[];
  metadata: {
    sourceFormat: string;
    targetFormat: string;
    conversionTime: number;
    lossyConversion: boolean;
    fieldsConverted: number;
    fieldsSkipped: number;
  };
}

// ========================================================================
// ADAPTATEURS DE FORMATS ALGORITHMLAB
// ========================================================================

export interface FormatAdapter<TSource = unknown, TTarget = unknown> {
  name: string;
  sourceFormat: string;
  targetFormat: string;

  // Méthodes de conversion
  convert(
    data: TSource,
    config?: Partial<ConversionConfig>
  ): ConversionResult<TTarget>;
  validate(data: TSource): boolean;
  getSchema?(): unknown;

  // Métadonnées
  description?: string;
  version?: string;
  supportsBatch?: boolean;
}

// ========================================================================
// ADAPTATEURS SPÉCIFIQUES ALGORITHMLAB
// ========================================================================

/**
 * Adaptateur pour convertir les anciens formats vers Universal AlgorithmLab
 */
export interface LegacyToUniversalAdapter extends FormatAdapter {
  sourceFormat: "LEGACY";
  targetFormat: "UNIVERSAL";

  convertXResult(result: unknown): ConversionResult<UniversalResult>;
  convertYResult(result: unknown): ConversionResult<UniversalResult>;
  convertM2Result(result: unknown): ConversionResult<UniversalResult>;
}

/**
 * Adaptateur pour les exports AlgorithmLab
 */
export interface ExportAdapter extends FormatAdapter {
  targetFormat: "CSV" | "JSON" | "XML" | "PDF";

  exportResults(
    results: UniversalResult[],
    config?: unknown
  ): ConversionResult<string>;
  exportMetrics(metrics: unknown[], config?: unknown): ConversionResult<string>;
}

// ========================================================================
// TRANSFORMATIONS DE DONNÉES ALGORITHMLAB
// ========================================================================

export interface DataTransformation<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;

  transform(input: TInput): TOutput;
  reverse?(output: TOutput): TInput;
  validate?(input: TInput): boolean;
}

export interface ChainedTransformation {
  transformations: DataTransformation[];

  execute<T, U>(input: T): ConversionResult<U>;
  reverse<T, U>(output: U): ConversionResult<T>;
  addTransformation(transformation: DataTransformation): void;
  removeTransformation(name: string): boolean;
}

// ========================================================================
// MAPPINGS DE RÉTROCOMPATIBILITÉ ALGORITHMLAB
// ========================================================================

export interface LegacyMapping {
  // Mapping des anciens noms de champs vers les nouveaux
  fieldMappings: Record<string, string>;

  // Mapping des anciennes valeurs vers les nouvelles
  valueMappings: Record<string, Record<string, unknown>>;

  // Transformations personnalisées
  customTransforms: Record<string, (value: unknown) => unknown>;

  // Champs obsolètes à ignorer
  deprecatedFields: string[];

  // Champs requis à ajouter avec valeurs par défaut (supporte "a.b.c")
  requiredDefaults: Record<string, unknown>;
}

// Mappings spécifiques pour la migration AlgorithmLab
export const ALGORITHM_LAB_LEGACY_MAPPINGS: Record<string, LegacyMapping> = {
  WRAPPER_TO_UNIVERSAL: {
    fieldMappings: {
      wrapXResult: "universalResult",
      wrapYResult: "universalResult",
      wrapM2Result: "universalResult",
    },
    valueMappings: {
      confidence: {
        HAUTE: 0.9,
        MOYENNE: 0.6,
        FAIBLE: 0.3,
      },
    },
    customTransforms: {
      processingTime: (value: unknown) => {
        if (typeof value === "string") {
          const n = parseInt(value.replace("ms", ""), 10);
          return Number.isFinite(n) ? n : 0;
        }
        if (typeof value === "number") return value;
        return 0;
      },
    },
    deprecatedFields: ["wrapperVersion", "legacyFormat"],
    requiredDefaults: {
      algorithmVersion: "2.0.0",
      "metadata.executionPath": ["universal_conversion"],
    },
  },
};

// ========================================================================
// HELPERS internes (sets/gets imbriqués, application mappings)
// ========================================================================

function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cursor[p] !== "object" || cursor[p] === null) {
      cursor[p] = {};
    }
    cursor = cursor[p] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

function applyValueMappings(
  record: Record<string, unknown>,
  valueMappings: LegacyMapping["valueMappings"]
) {
  for (const [field, mapping] of Object.entries(valueMappings)) {
    if (record[field] !== undefined) {
      const oldVal = record[field] as string;
      if (typeof oldVal === "string" && mapping[oldVal] !== undefined) {
        record[field] = mapping[oldVal];
      }
    }
  }
}

function applyCustomTransforms(
  record: Record<string, unknown>,
  transforms: LegacyMapping["customTransforms"],
  warnings: string[]
) {
  for (const [field, transform] of Object.entries(transforms)) {
    if (record[field] !== undefined) {
      try {
        record[field] = transform(record[field]);
      } catch (e) {
        warnings.push(
          `Transformation failed for field ${field}: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }
    }
  }
}

// ========================================================================
// FACTORY FUNCTIONS ALGORITHMLAB
// ========================================================================

export function createFormatAdapter<TSource, TTarget>(
  name: string,
  sourceFormat: string,
  targetFormat: string,
  convertFn: (
    data: TSource,
    config?: Partial<ConversionConfig>
  ) => ConversionResult<TTarget>
): FormatAdapter<TSource, TTarget> {
  return {
    name,
    sourceFormat,
    targetFormat,
    convert: convertFn,
    validate: (data: TSource) => {
      try {
        const out = convertFn(data);
        return out && typeof out === "object" && Array.isArray(out.errors);
      } catch {
        return false;
      }
    },
  };
}

export function createChainedTransformation(
  transformations: DataTransformation[] = []
): ChainedTransformation {
  return {
    transformations: [...transformations],

    execute<T, U>(input: T): ConversionResult<U> {
      let current: unknown = input;
      const warnings: string[] = [];
      const errors: string[] = [];
      let fieldsConverted = 0;

      const startTime = Date.now();

      try {
        for (const transformation of this.transformations) {
          if (transformation.validate && !transformation.validate(current)) {
            warnings.push(
              `Validation failed for transformation: ${transformation.name}`
            );
          }
          current = transformation.transform(current as never);
          fieldsConverted++;
        }

        return {
          success: true,
          data: current as U,
          warnings,
          errors,
          metadata: {
            sourceFormat: "chained",
            targetFormat: "chained",
            conversionTime: Date.now() - startTime,
            lossyConversion: warnings.length > 0,
            fieldsConverted,
            fieldsSkipped: 0,
          },
        };
      } catch (error) {
        return {
          success: false,
          data: current as U,
          warnings,
          errors: [error instanceof Error ? error.message : "Unknown error"],
          metadata: {
            sourceFormat: "chained",
            targetFormat: "chained",
            conversionTime: Date.now() - startTime,
            lossyConversion: true,
            fieldsConverted,
            fieldsSkipped: Math.max(
              0,
              this.transformations.length - fieldsConverted
            ),
          },
        };
      }
    },

    reverse<T, U>(output: U): ConversionResult<T> {
      // Implémentation simplifiée pour l'exemple
      return {
        success: false,
        data: output as unknown as T,
        warnings: ["Reverse transformation not implemented"],
        errors: [],
        metadata: {
          sourceFormat: "chained_reverse",
          targetFormat: "chained_reverse",
          conversionTime: 0,
          lossyConversion: true,
          fieldsConverted: 0,
          fieldsSkipped: this.transformations.length,
        },
      };
    },

    addTransformation(transformation: DataTransformation) {
      this.transformations.push(transformation);
    },

    removeTransformation(name: string): boolean {
      const index = this.transformations.findIndex((t) => t.name === name);
      if (index >= 0) {
        this.transformations.splice(index, 1);
        return true;
      }
      return false;
    },
  };
}

// ========================================================================
// UTILITAIRES DE CONVERSION ALGORITHMLAB
// ========================================================================

export function convertLegacyToUniversal(
  legacyData: Record<string, unknown>,
  mappingKey: keyof typeof ALGORITHM_LAB_LEGACY_MAPPINGS
): ConversionResult<UniversalResult> {
  const mapping = ALGORITHM_LAB_LEGACY_MAPPINGS[mappingKey];
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // 1) Appliquer le mapping de champs (copie superficielle contrôlée)
    const converted: Record<string, unknown> = {};
    let fieldsConverted = 0;
    let fieldsSkipped = 0;

    for (const [oldField, newField] of Object.entries(mapping.fieldMappings)) {
      if (legacyData[oldField] !== undefined) {
        converted[newField] = legacyData[oldField];
        fieldsConverted++;
      }
    }

    // 2) Appliquer les mappings de valeurs (ex. confidence HAUTE -> 0.9)
    applyValueMappings(converted, mapping.valueMappings);

    // 3) Appliquer les transformations personnalisées
    applyCustomTransforms(converted, mapping.customTransforms, warnings);

    // 4) Supprimer les champs obsolètes s’ils existent dans le converted
    for (const field of mapping.deprecatedFields) {
      if (converted[field] !== undefined) {
        delete converted[field];
        fieldsSkipped++;
      }
    }

    // 5) Ajouter les valeurs par défaut requises (support a.b.c)
    for (const [field, defaultValue] of Object.entries(
      mapping.requiredDefaults
    )) {
      // si non défini (supporte un-niveau ou nested)
      const isTopLevel = !field.includes(".");
      if (isTopLevel) {
        if (converted[field] === undefined) {
          converted[field] = defaultValue;
          fieldsConverted++;
        }
      } else {
        // nested
        // (ne vérifie pas l'existence profonde—on force le set si manquant)
        setNested(converted, field, defaultValue);
        fieldsConverted++;
      }
    }

    // 6) Certains mappings placent le résultat sous "universalResult"
    const universal: UniversalResult =
      (converted["universalResult"] as UniversalResult) ??
      (converted as unknown as UniversalResult);

    return {
      success: true,
      data: { ...universal }, // immutabilité de sortie
      warnings,
      errors,
      metadata: {
        sourceFormat: "legacy",
        targetFormat: "universal",
        conversionTime: Date.now() - startTime,
        lossyConversion: warnings.length > 0 || fieldsSkipped > 0,
        fieldsConverted,
        fieldsSkipped,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: {} as UniversalResult,
      warnings,
      errors: [
        error instanceof Error ? error.message : "Unknown conversion error",
      ],
      metadata: {
        sourceFormat: "legacy",
        targetFormat: "universal",
        conversionTime: Date.now() - startTime,
        lossyConversion: true,
        fieldsConverted: 0,
        fieldsSkipped: 0,
      },
    };
  }
}

export function validateConversionResult<T>(
  result: ConversionResult<T>
): boolean {
  return (
    result !== null &&
    typeof result === "object" &&
    result.success === true &&
    result.data !== null &&
    result.data !== undefined &&
    Array.isArray(result.errors) &&
    Array.isArray(result.warnings) &&
    !!result.metadata &&
    typeof result.metadata.conversionTime === "number"
  );
}

```

#### `AlgorithmLab/types/utils/corpusFilters.ts`

**Exports**

- **Déclarations**: TVGoldStandardSample, allowedConseiller, allowedClient, filterCorpusForAlgorithm, countSamplesPerAlgorithm

**Contenu**

```ts
// utils/corpusFilters.ts
import { ALGORITHM_CONFIGS, AlgorithmConfig } from "../algorithms/base";

// Types (utiliser ceux existants dans votre projet)
export interface TVGoldStandardSample {
  verbatim: string;
  expectedTag: string;
  metadata?: {
    target?: "conseiller" | "client";
    callId?: string | number; // ✅ COMPATIBLE avec votre GoldStandardSample
    speaker?: string;
    start?: number;
    end?: number;
    turnId?: string | number; // ✅ COMPATIBLE avec votre GoldStandardSample
    nextOf?: string | number;
    next_turn_verbatim?: string;
    prev1_turn_verbatim?: string;
    prev2_turn_verbatim?: string;
    [k: string]: any; // ✅ COMPATIBLE avec votre interface
  };
}

// Tags autorisés
export const allowedConseiller = [
  "ENGAGEMENT",
  "OUVERTURE",
  "REFLET_VOUS",
  "REFLET_JE",
  "REFLET_ACQ",
  "EXPLICATION",
];

export const allowedClient = [
  "CLIENT_POSITIF",
  "CLIENT_NEGATIF",
  "CLIENT_NEUTRE",
];

export const filterCorpusForAlgorithm = (
  goldStandardData: TVGoldStandardSample[],
  algorithmName: string
): TVGoldStandardSample[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) {
    console.warn(`No config found for algorithm: ${algorithmName}`);
    return goldStandardData;
  }

  let filtered = goldStandardData;

  // 1. Filtre par speaker
  filtered = filtered.filter((sample) => {
    if (config.speakerType === "conseiller") {
      return (
        sample.metadata?.target === "conseiller" &&
        allowedConseiller.includes(sample.expectedTag)
      );
    } else {
      return (
        sample.metadata?.target === "client" &&
        allowedClient.includes(sample.expectedTag)
      );
    }
  });

  // 2. CRITIQUE : Filtre M2 - nécessite next_turn_verbatim
  if (config.requiresNextTurn) {
    filtered = filtered.filter(
      (s) =>
        s.metadata?.next_turn_verbatim &&
        s.metadata.next_turn_verbatim.trim().length > 0
    );
  }

  // 3. Filtre contexte
  if (config.requiresPrevContext) {
    filtered = filtered.filter(
      (s) => s.metadata?.prev1_turn_verbatim || s.metadata?.prev2_turn_verbatim
    );
  }

  return filtered;
};

export const countSamplesPerAlgorithm = (
  goldStandardData: TVGoldStandardSample[]
): Record<string, number> => {
  const counts: Record<string, number> = {};

  Object.keys(ALGORITHM_CONFIGS).forEach((algorithmName) => {
    const filtered = filterCorpusForAlgorithm(goldStandardData, algorithmName);
    counts[algorithmName] = filtered.length;
  });

  return counts;
};

```

#### `AlgorithmLab/types/utils/index.ts`

**Exports**

- **Re-exports `*`** depuis: ./corpusFilters, ./inputPreparation, ./normalizers, ./converters

**Contenu**

```ts
/**
 * @fileoverview Export centralisé des types utils AlgorithmLab
 * Point d'entrée principal pour tous les types utilitaires AlgorithmLab
 */

// Filtrage et préparation de corpus
export * from "./corpusFilters";
export * from "./inputPreparation";

// Normalisation
export * from "./normalizers";

// Conversion et adaptation
export * from "./converters";

// Exports groupés pour faciliter l'import dans AlgorithmLab
// Exports groupés
export type {
  NormalizationLevel,
  NormalizationConfig,
  NormalizationRule,
  NormalizationResult,
  normalizeXLabel,
  normalizeYLabel,
  familyFromX,
  familyFromY,
} from "./normalizers";

export type {
  ConversionDirection,
  ConversionConfig,
  ConversionResult,
  FormatAdapter,
  LegacyToUniversalAdapter,
  ExportAdapter,
  DataTransformation,
  ChainedTransformation,
  LegacyMapping,
} from "./converters";

```

#### `AlgorithmLab/types/utils/inputPreparation.ts`

**Exports**

- **Déclarations**: prepareInputsForAlgorithm, debugPreparedInputs

**Contenu**

```ts
// utils/inputPreparation.ts
import { ALGORITHM_CONFIGS } from "../algorithms/base";
import type { TVGoldStandardSample } from "./corpusFilters";

export const prepareInputsForAlgorithm = (
  samples: TVGoldStandardSample[],
  algorithmName: string
): any[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) throw new Error(`Algorithm ${algorithmName} not configured`);

  return samples.map((sample) => {
    switch (config.inputFormat) {
      case "simple":
        return sample.verbatim;

      case "contextual":
        const m = sample.metadata || {};
        return `T-2: ${m.prev2_turn_verbatim ?? "—"}\nT-1: ${
          m.prev1_turn_verbatim ?? "—"
        }\nT0: ${sample.verbatim ?? ""}`;

      case "alignment":
        return {
          t0: sample.verbatim,
          t1: sample.metadata?.next_turn_verbatim,
          conseillerTurn: sample.verbatim,
          clientTurn: sample.metadata?.next_turn_verbatim,
        };

      case "alignment_context":
        return {
          t0: sample.verbatim,
          t1: sample.metadata?.next_turn_verbatim,
          prev1: sample.metadata?.prev1_turn_verbatim,
          prev2: sample.metadata?.prev2_turn_verbatim,
          conseillerTurn: sample.verbatim,
          clientTurn: sample.metadata?.next_turn_verbatim,
        };

      case "cognitive":
        return {
          segment: sample.verbatim,
          withProsody: false,
          language: "fr",
          options: {
            id: sample.metadata?.turnId,
            clientTurn: sample.verbatim,
            conseillerContext: sample.metadata?.prev1_turn_verbatim,
          },
        };

      default:
        return sample.verbatim;
    }
  });
};

export const debugPreparedInputs = (
  inputs: any[],
  algorithmName: string
): void => {
  console.group(`[${algorithmName}] Debug inputs préparés`);
  console.log(`Nombre d'inputs: ${inputs.length}`);
  if (inputs.length > 0) {
    console.log("Premier input:", inputs[0]);
  }
  console.groupEnd();
};

```

#### `AlgorithmLab/types/utils/normalizers.ts`

**Exports**

- **Déclarations**: NormalizationLevel, NormalizationConfig, NormalizationRule, NormalizationResult, normalizeXLabel, normalizeYLabel, familyFromX, familyFromY, normalizeText, applyCustomRules, X_LABEL_MAPPING, Y_LABEL_MAPPING, FAMILY_MAPPING, NORMALIZATION_PRESETS, DEFAULT_NORMALIZATION_RULES, validateNormalizationConfig, createNormalizationRule, isValidXTag, isValidYTag, getFamilyFromTag

**Contenu**

```ts
/**
 * @fileoverview Types pour les fonctions de normalisation AlgorithmLab
 * Fonctions de normalisation spécifiques au module AlgorithmLab
 */

import { XTag, YTag } from "../core/variables";

// ========================================================================
// TYPES DE NORMALISATION ALGORITHMLAB
// ========================================================================

export type NormalizationLevel = "BASIC" | "STANDARD" | "AGGRESSIVE";

export interface NormalizationConfig {
  level: NormalizationLevel;
  preserveCase: boolean;
  removePunctuation: boolean;
  removeAccents: boolean;
  removeStopWords: boolean;
  stemming: boolean;
  customRules?: NormalizationRule[];
}

export interface NormalizationRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  replacement: string;
  enabled: boolean;
  priority: number; // 1-10, 1 = le plus prioritaire
  description?: string;
}

export interface NormalizationResult {
  original: string;
  normalized: string;
  appliedRules: string[];
  confidence: number; // 0-1
  warnings?: string[];
  metadata?: {
    processingTime: number;
    rulesEvaluated: number;
    transformations: Array<{
      rule: string;
      before: string;
      after: string;
    }>;
  };
}

// ========================================================================
// FONCTIONS DE NORMALISATION ALGORITHMLAB
// ========================================================================

/**
 * Normalise un label X selon les règles AlgorithmLab
 */
export declare function normalizeXLabel(
  label: string,
  config?: Partial<NormalizationConfig>
): XTag;

/**
 * Normalise un label Y selon les règles AlgorithmLab
 */
export declare function normalizeYLabel(
  label: string,
  config?: Partial<NormalizationConfig>
): YTag;

/**
 * Détermine la famille d'un tag X AlgorithmLab
 */
export declare function familyFromX(xTag: XTag): string;

/**
 * Détermine la famille d'un tag Y AlgorithmLab
 */
export declare function familyFromY(yTag: YTag): string;

/**
 * Normalisation générique avec configuration avancée
 */
export declare function normalizeText(
  text: string,
  config: NormalizationConfig
): NormalizationResult;

/**
 * Applique des règles de normalisation personnalisées
 */
export declare function applyCustomRules(
  text: string,
  rules: NormalizationRule[]
): NormalizationResult;

// ========================================================================
// MAPPINGS ALGORITHMLAB
// ========================================================================

export const X_LABEL_MAPPING: Record<string, XTag> = {
  // Variations d'ENGAGEMENT
  engagement: "ENGAGEMENT",
  action: "ENGAGEMENT",
  je_vais: "ENGAGEMENT",
  verification: "ENGAGEMENT",

  // Variations d'OUVERTURE
  ouverture: "OUVERTURE",
  question: "OUVERTURE",
  avez_vous: "OUVERTURE",
  souhaitez: "OUVERTURE",

  // Variations de REFLET
  reflet: "REFLET",
  comprends: "REFLET",
  entends: "REFLET",
  ressenti: "REFLET",

  // Variations d'EXPLICATION
  explication: "EXPLICATION",
  parce_que: "EXPLICATION",
  raison: "EXPLICATION",
  procedure: "EXPLICATION",

  // Variations de CLOTURE
  cloture: "CLOTURE",
  aurevoir: "CLOTURE",
  bonne_journee: "CLOTURE",
  fin: "CLOTURE",
};

export const Y_LABEL_MAPPING: Record<string, YTag> = {
  // Variations CLIENT_POSITIF
  positif: "CLIENT_POSITIF",
  merci: "CLIENT_POSITIF",
  parfait: "CLIENT_POSITIF",
  accord: "CLIENT_POSITIF",

  // Variations CLIENT_NEUTRE
  neutre: "CLIENT_NEUTRE",
  ok: "CLIENT_NEUTRE",
  oui: "CLIENT_NEUTRE",
  bien: "CLIENT_NEUTRE",

  // Variations CLIENT_NEGATIF
  negatif: "CLIENT_NEGATIF",
  non: "CLIENT_NEGATIF",
  impossible: "CLIENT_NEGATIF",
  probleme: "CLIENT_NEGATIF",

  // Variations CLIENT_QUESTION
  question: "CLIENT_QUESTION",
  comment: "CLIENT_QUESTION",
  pourquoi: "CLIENT_QUESTION",
  quand: "CLIENT_QUESTION",

  // Variations CLIENT_SILENCE
  silence: "CLIENT_SILENCE",
  pause: "CLIENT_SILENCE",
  attente: "CLIENT_SILENCE",
};

export const FAMILY_MAPPING = {
  X: {
    ENGAGEMENT: "ACTION",
    OUVERTURE: "EXPLORATION",
    REFLET: "EMPATHIE",
    REFLET_ACQ: "EMPATHIE", // AJOUTER
    REFLET_JE: "EMPATHIE",
    REFLET_VOUS: "EMPATHIE",
    EXPLICATION: "INFORMATION",
    CLOTURE: "CONCLUSION",
    AUTRE_X: "AUTRE",
  },
  Y: {
    CLIENT_POSITIF: "ACCEPTANCE",
    CLIENT_NEUTRE: "NEUTRAL",
    CLIENT_NEGATIF: "RESISTANCE",
    CLIENT_QUESTION: "INQUIRY",
    CLIENT_SILENCE: "PAUSE",
    AUTRE_Y: "AUTRE",
  },
} as const;

// ========================================================================
// CONFIGURATIONS PREDEFINIES ALGORITHMLAB
// ========================================================================

export const NORMALIZATION_PRESETS: Record<string, NormalizationConfig> = {
  BASIC: {
    level: "BASIC",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: false,
    stemming: false,
  },

  STANDARD: {
    level: "STANDARD",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: false,
  },

  AGGRESSIVE: {
    level: "AGGRESSIVE",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: true,
  },
};

// ========================================================================
// RÈGLES DE NORMALISATION PRÉDÉFINIES ALGORITHMLAB
// ========================================================================

export const DEFAULT_NORMALIZATION_RULES: NormalizationRule[] = [
  {
    id: "remove_filler_words",
    name: "Suppression des mots de remplissage",
    pattern: /\b(euh|heu|ben|voila|quoi)\b/gi,
    replacement: "",
    enabled: true,
    priority: 1,
    description: "Supprime les mots de remplissage communs",
  },
  {
    id: "normalize_contractions",
    name: "Normalisation des contractions",
    pattern: /(j'|l'|d'|n'|m'|t'|s')/gi,
    replacement: "",
    enabled: true,
    priority: 2,
    description: "Développe les contractions françaises courantes",
  },
  {
    id: "normalize_politeness",
    name: "Normalisation de politesse",
    pattern: /(monsieur|madame|mademoiselle)/gi,
    replacement: "",
    enabled: true,
    priority: 3,
    description:
      "Supprime les formules de politesse pour se concentrer sur le contenu",
  },
  {
    id: "normalize_numbers",
    name: "Normalisation des nombres",
    pattern: /\b\d+\b/g,
    replacement: "[NOMBRE]",
    enabled: false,
    priority: 4,
    description: "Remplace les nombres par un token générique",
  },
];

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function validateNormalizationConfig(
  config: NormalizationConfig
): string[] {
  const errors: string[] = [];

  if (!["BASIC", "STANDARD", "AGGRESSIVE"].includes(config.level)) {
    errors.push("Niveau de normalisation invalide");
  }

  if (config.customRules) {
    config.customRules.forEach((rule, index) => {
      if (
        !rule.id ||
        !rule.name ||
        !rule.pattern ||
        rule.replacement === undefined
      ) {
        errors.push(`Règle ${index + 1} incomplète`);
      }

      if (rule.priority < 1 || rule.priority > 10) {
        errors.push(
          `Priorité de la règle ${rule.name} doit être entre 1 et 10`
        );
      }
    });
  }

  return errors;
}

export function createNormalizationRule(
  id: string,
  name: string,
  pattern: RegExp | string,
  replacement: string,
  options: Partial<NormalizationRule> = {}
): NormalizationRule {
  return {
    id,
    name,
    pattern,
    replacement,
    enabled: true,
    priority: 5,
    ...options,
  };
}

export function isValidXTag(tag: string): tag is XTag {
  return [
    "ENGAGEMENT",
    "OUVERTURE",
    "REFLET",
    "EXPLICATION",
    "CLOTURE",
    "AUTRE_X",
  ].includes(tag);
}

export function isValidYTag(tag: string): tag is YTag {
  return [
    "CLIENT_POSITIF",
    "CLIENT_NEUTRE",
    "CLIENT_NEGATIF",
    "CLIENT_QUESTION",
    "CLIENT_SILENCE",
    "AUTRE_Y",
  ].includes(tag);
}

export function getFamilyFromTag(tag: XTag | YTag): string {
  if (isValidXTag(tag)) {
    return FAMILY_MAPPING.X[tag];
  } else if (isValidYTag(tag)) {
    return FAMILY_MAPPING.Y[tag];
  }
  return "AUTRE";
}

```
