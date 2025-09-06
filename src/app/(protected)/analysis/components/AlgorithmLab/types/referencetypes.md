# Reference — Types normalisés AlgorithmLab

> Généré automatiquement le 2025-09-06T10:47:40.946Z à partir de `C:/Users/thoma/OneDrive/SONEAR 2025/taggerlpl-nextjs/src/app/(protected)/analysis/components/AlgorithmLab/types`
> Doc-Version: 2025-09-06T10:47:40.945Z-040
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
- **Déclarations**: ALGORITHM_LAB_VERSION, SUPPORTED_VARIABLES, DEFAULT_CONFIGS, TVTarget, TVResultX, TVResultY, TVResultM2, TVValidationMetrics
- **Nommés**: createUniversalAlgorithm
- **Re-exports `*`** depuis: ./core, ./algorithms, ./ui, ./utils

### Contenu
```ts
/**
 * @fileoverview Point d'entrée principal des types AlgorithmLab
 * Export centralisé unifié pour le module AlgorithmLab
 */

// ========================================================================
// EXPORTS PAR DOMAINE ALGORITHMLAB
// ========================================================================

// Types fondamentaux
export * from './core';

// Types d'algorithmes  
export * from './algorithms';

// Types d'interface utilisateur
export * from './ui';

// Types utilitaires
export * from './utils';

// ========================================================================
// EXPORTS GROUPÉS POUR SIMPLICITÉ D'USAGE ALGORITHMLAB
// ========================================================================

// Variables et calculs - imports les plus fréquents
export type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details, 
  M3Details,
  CalculationInput,
  CalculationResult,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input
} from './core';

// Algorithmes - interface universelle
export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  BaseCalculator
} from './algorithms';

// Export de la fonction principale
export { createUniversalAlgorithm } from './algorithms';

// Validation - types essentiels
export type {
  ValidationMetrics,
  ValidationResult,
  AlgorithmTestConfig
} from './core';

// UI - props de validation les plus utilisées
export type {
  BaseValidationProps,
  XValidationProps,
  YValidationProps,
  M2ValidationProps
} from './ui';

// Utilitaires - fonctions de normalisation
export type {
  normalizeXLabel,
  normalizeYLabel,
  familyFromX,
  NormalizationConfig
} from './utils';

// ========================================================================
// CONSTANTES ALGORITHMLAB
// ========================================================================

export const ALGORITHM_LAB_VERSION = "2.0.0";

export const SUPPORTED_VARIABLES = ["X", "Y", "M1", "M2", "M3"] as const;

export const DEFAULT_CONFIGS = {
  VALIDATION: {
    minConfidence: 0.8,
    timeout: 30000,
    retries: 3
  },
  NORMALIZATION: {
    level: "STANDARD" as const,
    preserveCase: false,
    removePunctuation: true
  }
} as const;

// ========================================================================
// TYPES DE COMPATIBILITÉ TEMPORAIRE
// ========================================================================

/**
 * @deprecated Use VariableTarget from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVTarget = VariableTarget;

/**
 * @deprecated Use XCalculationResult from './core' instead  
 * Compatibilité temporaire pendant la migration
 */
export type TVResultX = import('./core').XCalculationResult;

/**
 * @deprecated Use YCalculationResult from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVResultY = import('./core').YCalculationResult;

/**
 * @deprecated Use M2CalculationResult from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVResultM2 = import('./core').M2CalculationResult;

/**
 * @deprecated Use ValidationMetrics from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVValidationMetrics = ValidationMetrics;

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

- **Déclarations**: UniversalAlgorithm, AlgorithmType, ParameterDescriptor, AlgorithmDescriptor, UniversalResult, isValidAlgorithmResult, createErrorResult, createSuccessResult

**Contenu**

```ts
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

```

#### `AlgorithmLab/types/algorithms/index.ts`

**Exports**

- **Nommés**: createUniversalAlgorithm
- **Re-exports `*`** depuis: ./base, ./universal-adapter

**Contenu**

```ts
/**
 * @fileoverview Export centralisé des types algorithms AlgorithmLab
 * Point d'entrée principal pour tous les types d'algorithmes AlgorithmLab
 */

// Interface universelle et types de base
export * from './base';

// Adaptateur universel
export * from './universal-adapter';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType
} from './base';

export type {
  BaseCalculator,
  AdapterConfig
} from './universal-adapter';

// Export de la fonction principale
export { createUniversalAlgorithm } from './universal-adapter';

```

#### `AlgorithmLab/types/algorithms/universal-adapter.ts`

**Exports**

- **Déclarations**: BaseCalculator, AdapterConfig, createUniversalAlgorithm, createXAlgorithm, createYAlgorithm, createM2Algorithm

**Contenu**

```ts
/**
 * @fileoverview Adaptateur universel AlgorithmLab
 * Fonction createUniversalAlgorithm qui unifie wrapX, wrapY, wrapM2, etc.
 */

import { VariableTarget, VariableDetails } from "../core/variables";
import { CalculationInput, CalculationResult } from "../core/calculations";
import {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
} from "./base";

// ========================================================================
// INTERFACE DE BASE POUR CALCULATEURS ALGORITHMLAB
// ========================================================================

export interface BaseCalculator<TInput = any, TDetails = VariableDetails> {
  calculate(input: TInput): Promise<CalculationResult<TDetails>>;

  // Métadonnées optionnelles
  getName?(): string;
  getVersion?(): string;
  getDescription?(): string;
  getType?(): AlgorithmType;
}

// ========================================================================
// CONFIGURATION DE L'ADAPTATEUR ALGORITHMLAB
// ========================================================================

export interface AdapterConfig<TInput = any, TDetails = VariableDetails> {
  // Support des fonctionnalités
  requiresContext?: boolean;
  supportsBatch?: boolean;

  // Convertisseurs de données
  inputValidator?: (input: unknown) => input is TInput;
  inputConverter?: (input: string) => TInput;
  resultMapper?: (result: CalculationResult<TDetails>) => UniversalResult;

  // Métadonnées personnalisées
  displayName?: string;
  description?: string;
  algorithmType?: AlgorithmType;

  // Configuration avancée
  timeout?: number; // ms
  retries?: number;
  batchSize?: number; // pour le traitement par lot
}

// ========================================================================
// ADAPTATEUR UNIVERSEL ALGORITHMLAB
// ========================================================================

/**
 * Adaptateur universel AlgorithmLab remplaçant tous les wrappers
 * Usage: createUniversalAlgorithm(calculator, target, config)
 */
export function createUniversalAlgorithm<
  TInput = any,
  TDetails = VariableDetails
>(
  calculator: BaseCalculator<TInput, TDetails>,
  target: VariableTarget,
  config: AdapterConfig<TInput, TDetails> = {}
): UniversalAlgorithm {
  const {
    requiresContext = false,
    supportsBatch = false,
    inputValidator,
    inputConverter,
    resultMapper = defaultResultMapper,
    displayName,
    description,
    algorithmType = "rule-based",
    timeout = 30000,
    retries = 3,
    batchSize = 10,
  } = config;

  // Implémentation de l'interface universelle AlgorithmLab
  const universalAlgorithm: UniversalAlgorithm = {
    describe(): AlgorithmDescriptor {
      const name = calculator.getName?.() || `${target}Calculator`;
      return {
        name,
        displayName: displayName || name,
        version: calculator.getVersion?.() || "1.0.0",
        type: calculator.getType?.() || algorithmType,
        target,
        batchSupported: supportsBatch,
        requiresContext,
        description:
          description ||
          calculator.getDescription?.() ||
          `Calculateur AlgorithmLab pour variable ${target}`,
        examples: generateExamples(target),
      };
    },

    validateConfig(): boolean {
      try {
        // Validation basique du calculateur
        if (!calculator || typeof calculator.calculate !== "function") {
          return false;
        }

        // Test de calcul basique
        const testInput = createTestInput(target);
        if (inputValidator && !inputValidator(testInput)) {
          return false;
        }

        return true;
      } catch (error) {
        console.warn(`Validation failed for ${target} calculator:`, error);
        return false;
      }
    },

    async classify(input: string): Promise<UniversalResult> {
      return this.run(input);
    },

    async run(input: unknown): Promise<UniversalResult> {
      const startTime = Date.now();

      try {
        // 1. Validation et conversion de l'input
        let typedInput: TInput;

        if (inputValidator) {
          if (!inputValidator(input)) {
            throw new Error(`Invalid input type for ${target} calculator`);
          }
          typedInput = input;
        } else if (inputConverter && typeof input === "string") {
          typedInput = inputConverter(input);
        } else if (typeof input === "string") {
          typedInput = createDefaultInput(input, target) as TInput;
        } else {
          typedInput = input as TInput;
        }

        // 2. Exécution avec timeout et retry
        const result = await executeWithRetry(
          () => calculator.calculate(typedInput),
          retries,
          timeout
        );

        // 3. Mapping vers format universel
        const universalResult = resultMapper(result);
        universalResult.processingTime = Date.now() - startTime;

        return universalResult;
      } catch (error) {
        return {
          prediction: "ERROR",
          confidence: 0,
          processingTime: Date.now() - startTime,
          metadata: {
            warnings: [
              `Execution failed: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            ],
            executionPath: ["error"],
            inputType: typeof input,
          },
        };
      }
    },

    async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
      if (!supportsBatch) {
        // Fallback: exécution séquentielle
        const results: UniversalResult[] = [];
        for (const input of inputs) {
          results.push(await this.run(input));
        }
        return results;
      }

      // Traitement par batch optimisé
      const results: UniversalResult[] = [];

      for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i + batchSize);
        const batchPromises = batch.map((input) => this.run(input));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return results;
    },
  };

  return universalAlgorithm;
}

// ========================================================================
// FONCTIONS UTILITAIRES ALGORITHMLAB
// ========================================================================

function defaultResultMapper<TDetails>(
  result: CalculationResult<TDetails>
): UniversalResult {
  return {
    prediction: result.prediction,
    confidence: result.confidence,
    processingTime: result.processingTime,
    algorithmVersion: result.metadata?.algorithmVersion,
    metadata: {
      inputSignature: result.metadata?.inputSignature,
      executionPath: result.metadata?.executionPath || ["calculate"],
      warnings: result.metadata?.warnings,
      details: result.details as VariableDetails,
    },
  };
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  timeout: number
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeout)
        ),
      ]);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Délai exponentiel entre les tentatives
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  throw new Error("Max retries exceeded");
}

function createTestInput(target: VariableTarget): unknown {
  switch (target) {
    case "X":
      return { verbatim: "Bonjour, comment puis-je vous aider ?" };
    case "Y":
      return {
        verbatim: "Oui, merci beaucoup",
        previousConseillerTurn: "Je vais vérifier votre dossier",
      };
    case "M1":
      return {
        verbatim: "C'est une phrase de test pour l'analyse linguistique.",
      };
    case "M2":
      return {
        conseillerTurn: "Je comprends votre situation",
        clientTurn: "Merci de votre compréhension",
      };
    case "M3":
      return {
        conversationPair: {
          conseiller: "Avez-vous d'autres questions ?",
          client: "Non, c'est parfait",
        },
      };
    default:
      return { verbatim: "Test input" };
  }
}

function createDefaultInput(
  verbatim: string,
  target: VariableTarget
): CalculationInput {
  switch (target) {
    case "X":
      return { verbatim };
    case "Y":
      return { verbatim, previousConseillerTurn: "" };
    case "M1":
      return { verbatim };
    case "M2":
      return { conseillerTurn: verbatim, clientTurn: "" };
    case "M3":
      return {
        conversationPair: { conseiller: verbatim, client: "" },
      };
    default:
      return { verbatim } as any;
  }
}

function generateExamples(
  target: VariableTarget
): Array<{ input: string; expectedOutput: string }> {
  switch (target) {
    case "X":
      return [
        {
          input: "D'accord, je vais vérifier votre dossier",
          expectedOutput: "ENGAGEMENT",
        },
        {
          input: "Avez-vous d'autres questions ?",
          expectedOutput: "OUVERTURE",
        },
        { input: "Je comprends votre frustration", expectedOutput: "REFLET" },
      ];
    case "Y":
      return [
        {
          input: "Merci beaucoup pour votre aide",
          expectedOutput: "CLIENT_POSITIF",
        },
        { input: "Ce n'est pas possible !", expectedOutput: "CLIENT_NEGATIF" },
        { input: "D'accord", expectedOutput: "CLIENT_NEUTRE" },
      ];
    case "M1":
      return [
        { input: "Phrase simple", expectedOutput: "LOW_COMPLEXITY" },
        {
          input: "Construction syntaxique complexe",
          expectedOutput: "HIGH_COMPLEXITY",
        },
      ];
    case "M2":
      return [
        {
          input: "Conseiller: 'Je comprends' | Client: 'Merci'",
          expectedOutput: "HIGH_ALIGNMENT",
        },
      ];
    case "M3":
      return [
        { input: "Conversation fluide", expectedOutput: "HIGH_FLUIDITY" },
      ];
    default:
      return [];
  }
}

// ========================================================================
// FACTORY FUNCTIONS POUR USAGE SIMPLIFIÉ ALGORITHMLAB
// ========================================================================

export function createXAlgorithm(
  calculator: BaseCalculator
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "X", {
    displayName: "X Classifier AlgorithmLab",
    description: "Classification des actes conversationnels conseiller",
    algorithmType: "rule-based", // was "RULE_BASED"
  });
}

export function createYAlgorithm(
  calculator: BaseCalculator
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "Y", {
    displayName: "Y Classifier AlgorithmLab",
    description: "Classification des réactions client",
    algorithmType: "rule-based", // was "RULE_BASED"
  });
}

export function createM2Algorithm(
  calculator: BaseCalculator
): UniversalAlgorithm {
  return createUniversalAlgorithm(calculator, "M2", {
    displayName: "M2 Alignment Calculator AlgorithmLab",
    description: "Calcul de l'alignement interactionnel",
    algorithmType: "ml", // was "MACHINE_LEARNING"
    requiresContext: true,
  });
}

```

## core

### Arborescence
```text
core/
- calculations.ts
- index.ts
- validation.ts
- variables.ts
```

#### `AlgorithmLab/types/core/calculations.ts`

**Exports**

- **Déclarations**: XInput, YInput, M1Input, M2Input, M3Input, CalculationInput, CalculationResult, XCalculationResult, YCalculationResult, M1CalculationResult, M2CalculationResult, M3CalculationResult, CalculatorMetadata, validateCalculationInput, createEmptyResult

**Contenu**

```ts
/**
 * @fileoverview Interfaces de calcul AlgorithmLab
 * Types pour les inputs, outputs et métadonnées des calculateurs AlgorithmLab
 */

import { VariableTarget, VariableDetails } from './variables';

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
  conseillerTurn: string;
  clientTurn: string;
  context?: {
    previousTurns?: Array<{speaker: string, text: string}>;
    conversationPhase?: "OPENING" | "DEVELOPMENT" | "RESOLUTION" | "CLOSING";
  };
}

export interface M3Input {
  conversationPair: {
    conseiller: string;
    client: string;
  };
  cognitiveContext?: {
    conversationLength: number;
    emotionalTone: string;
    complexityLevel: "LOW" | "MEDIUM" | "HIGH";
  };
}

// Union type pour tous les inputs AlgorithmLab
export type CalculationInput = XInput | YInput | M1Input | M2Input | M3Input;

// ========================================================================
// RÉSULTATS DES CALCULS ALGORITHMLAB
// ========================================================================

export interface CalculationResult<TDetails = VariableDetails> {
  prediction: string;
  confidence: number;
  processingTime: number;
  
  details: TDetails;
  
  metadata?: {
    algorithmVersion: string;
    inputSignature: string;
    executionPath: string[];
    warnings?: string[];
  };
}

// Résultats typés spécifiques AlgorithmLab
export type XCalculationResult = CalculationResult<import('./variables').XDetails>;
export type YCalculationResult = CalculationResult<import('./variables').YDetails>;
export type M1CalculationResult = CalculationResult<import('./variables').M1Details>;
export type M2CalculationResult = CalculationResult<import('./variables').M2Details>;
export type M3CalculationResult = CalculationResult<import('./variables').M3Details>;

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
    averageProcessingTime: number; // ms
    accuracy: number; // 0-1
    precision: number; // 0-1
    recall: number; // 0-1
  };
  
  parameters?: Record<string, {
    type: string;
    default: any;
    description: string;
    required: boolean;
  }>;
}

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function validateCalculationInput(
  input: unknown, 
  target: VariableTarget
): input is CalculationInput {
  if (!input || typeof input !== 'object') return false;
  
  const obj = input as Record<string, any>;
  
  switch (target) {
    case 'X':
      return typeof obj.verbatim === 'string';
    case 'Y':
      return typeof obj.verbatim === 'string' && typeof obj.previousConseillerTurn === 'string';
    case 'M1':
      return typeof obj.verbatim === 'string';
    case 'M2':
      return typeof obj.conseillerTurn === 'string' && typeof obj.clientTurn === 'string';
    case 'M3':
      return obj.conversationPair && 
             typeof obj.conversationPair.conseiller === 'string' &&
             typeof obj.conversationPair.client === 'string';
    default:
      return false;
  }
}

export function createEmptyResult<T extends VariableDetails>(target: VariableTarget): CalculationResult<T> {
  return {
    prediction: "UNKNOWN",
    confidence: 0,
    processingTime: 0,
    details: {} as T,
    metadata: {
      algorithmVersion: "unknown",
      inputSignature: "",
      executionPath: [],
      warnings: ["Empty result created"]
    }
  };
}

```

#### `AlgorithmLab/types/core/index.ts`

**Exports**

- **Re-exports `*`** depuis: ./variables, ./calculations, ./validation

**Contenu**

```ts
/**
 * @fileoverview Export centralisé des types core AlgorithmLab
 * Point d'entrée principal pour tous les types fondamentaux AlgorithmLab
 */

// Variables et détails
export * from './variables';

// Calculs et résultats
export * from './calculations';

// Validation et métriques
export * from './validation';

// Types combinés pour faciliter l'import dans AlgorithmLab
export type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails, 
  M1Details,
  M2Details,
  M3Details
} from './variables';

export type {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input
} from './calculations';

export type {
  ValidationMetrics,
  ValidationResult,
  AlgorithmTestConfig
} from './validation';

```

#### `AlgorithmLab/types/core/validation.ts`

**Exports**

- **Déclarations**: TVMetadataCore, TVValidationResultCore, ValidationMetrics, ValidationResult, AlgorithmTestConfig, calculateMetrics, createValidationConfig

**Contenu**

```ts
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

```

#### `AlgorithmLab/types/core/variables.ts`

**Exports**

- **Déclarations**: VariableTarget, XTag, YTag, XDetails, YDetails, M1Details, M2Details, M3Details, VariableX, VariableY, VariableDetails, VARIABLE_LABELS, VARIABLE_COLORS, isValidVariableTarget, getVariableColor, getVariableLabel

**Contenu**

```ts
/**
 * @fileoverview Variables & détails AlgorithmLab — version unifiée et canonique
 * - Ordre logique (tags avant usages)
 * - Pas de redéclarations : une seule interface par nom
 * - Compat ascendante : anciens champs conservés en option
 */

// ========================================================================
// 1) Cibles principales
// ========================================================================
export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

// ========================================================================
// 2) Tags X/Y
// ========================================================================
export type XTag =
  | "ENGAGEMENT"
  | "OUVERTURE"
  | "REFLET"
  | "EXPLICATION"
  | "CLOTURE"
  | "AUTRE_X";

export type YTag =
  | "CLIENT_POSITIF"
  | "CLIENT_NEUTRE"
  | "CLIENT_NEGATIF"
  | "CLIENT_QUESTION"
  | "CLIENT_SILENCE"
  | "AUTRE_Y";

// ========================================================================
// 3) Détails par variable (définitions uniques)
// ========================================================================

/** Détails X (actes conseiller) — fusion des versions "simple" et "riche" */
export interface XDetails {
  // Ancienne spec (facilitent la validation X↔famille)
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];

  // Mesures linguistiques/structurelles
  verbCount?: number;
  actionVerbs?: string[];
  pronounUsage?: {
    je: number;
    vous: number;
    nous: number;
  };
  questionMarkers?: string[];
  declarativeMarkers?: string[];

  // Métriques d'efficacité
  effectiveness?: {
    clientResponse: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    alignmentScore: number;
    nextTurnLabel?: string;
  };
}

/** Détails Y (réactions client) — fusion simple + riche */
export interface YDetails {
  // Ancienne spec
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];

  // Spec riche
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  emotionalIntensity?: number; // 0..1
  linguisticMarkers?: string[];
  responseType?: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL";

  conversationalMetrics?: {
    latency: number; // ms
    verbosity: number; // nb mots
    coherence: number; // 0..1
  };
}

/** M1 — densité/metrics linguistiques (compat + enrichi) */
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

/** M2 — alignement interactionnel (compat + enrichi) */
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

/** M3 — temporalité/charge (compat + enrichi) */
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
}

// ========================================================================
// 4) Objets composés X/Y (tag + détails)
// ========================================================================
export interface VariableX {
  tag: XTag;
  details: XDetails;
}

export interface VariableY {
  tag: YTag;
  details: YDetails;
}

// ========================================================================
// 5) Union de détails + utilitaires d’affichage
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

- **Déclarations**: BaseValidationProps, DisplayConfig, ConfigFormProps, ResultDisplayProps, ResultsPanelProps, TVResultDisplayProps, ModalProps, createDefaultDisplayConfig, withDisplayDefaults, validateConfigSchema

**Contenu**

```ts
/**
 * @fileoverview Types de composants UI AlgorithmLab
 * Interfaces spécifiques aux composants d'interface AlgorithmLab
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
}

// Optionnel : variante stricte TV pour d’autres composants UI
export interface TVResultDisplayProps {
  results: TVValidationResultCore[];
  display?: DisplayConfig;
  onRowSelect?: (index: number) => void;
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

/** Validation simple d’un schema de config de formulaire */
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
- index.ts
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

#### `AlgorithmLab/types/utils/index.ts`

**Exports**

- **Re-exports `*`** depuis: ./normalizers, ./converters

**Contenu**

```ts
/**
 * @fileoverview Export centralisé des types utils AlgorithmLab
 * Point d'entrée principal pour tous les types utilitaires AlgorithmLab
 */

// Normalisation
export * from './normalizers';

// Conversion et adaptation
export * from './converters';

// Exports groupés pour faciliter l'import dans AlgorithmLab
export type {
  NormalizationLevel,
  NormalizationConfig,
  NormalizationRule,
  NormalizationResult,
  normalizeXLabel,
  normalizeYLabel,
  familyFromX,
  familyFromY
} from './normalizers';

export type {
  ConversionDirection,
  ConversionConfig,
  ConversionResult,
  FormatAdapter,
  LegacyToUniversalAdapter,
  ExportAdapter,
  DataTransformation,
  ChainedTransformation,
  LegacyMapping
} from './converters';

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

import { XTag, YTag } from '../core/variables';

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
export declare function normalizeXLabel(label: string, config?: Partial<NormalizationConfig>): XTag;

/**
 * Normalise un label Y selon les règles AlgorithmLab
 */
export declare function normalizeYLabel(label: string, config?: Partial<NormalizationConfig>): YTag;

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
  "engagement": "ENGAGEMENT",
  "action": "ENGAGEMENT", 
  "je_vais": "ENGAGEMENT",
  "verification": "ENGAGEMENT",
  
  // Variations d'OUVERTURE
  "ouverture": "OUVERTURE",
  "question": "OUVERTURE",
  "avez_vous": "OUVERTURE",
  "souhaitez": "OUVERTURE",
  
  // Variations de REFLET
  "reflet": "REFLET",
  "comprends": "REFLET",
  "entends": "REFLET",
  "ressenti": "REFLET",
  
  // Variations d'EXPLICATION
  "explication": "EXPLICATION",
  "parce_que": "EXPLICATION",
  "raison": "EXPLICATION",
  "procedure": "EXPLICATION",
  
  // Variations de CLOTURE
  "cloture": "CLOTURE",
  "aurevoir": "CLOTURE",
  "bonne_journee": "CLOTURE",
  "fin": "CLOTURE"
};

export const Y_LABEL_MAPPING: Record<string, YTag> = {
  // Variations CLIENT_POSITIF
  "positif": "CLIENT_POSITIF",
  "merci": "CLIENT_POSITIF",
  "parfait": "CLIENT_POSITIF",
  "accord": "CLIENT_POSITIF",
  
  // Variations CLIENT_NEUTRE
  "neutre": "CLIENT_NEUTRE",
  "ok": "CLIENT_NEUTRE",
  "oui": "CLIENT_NEUTRE",
  "bien": "CLIENT_NEUTRE",
  
  // Variations CLIENT_NEGATIF
  "negatif": "CLIENT_NEGATIF",
  "non": "CLIENT_NEGATIF",
  "impossible": "CLIENT_NEGATIF",
  "probleme": "CLIENT_NEGATIF",
  
  // Variations CLIENT_QUESTION
  "question": "CLIENT_QUESTION",
  "comment": "CLIENT_QUESTION",
  "pourquoi": "CLIENT_QUESTION",
  "quand": "CLIENT_QUESTION",
  
  // Variations CLIENT_SILENCE
  "silence": "CLIENT_SILENCE",
  "pause": "CLIENT_SILENCE",
  "attente": "CLIENT_SILENCE"
};

export const FAMILY_MAPPING = {
  X: {
    "ENGAGEMENT": "ACTION",
    "OUVERTURE": "EXPLORATION", 
    "REFLET": "EMPATHIE",
    "EXPLICATION": "INFORMATION",
    "CLOTURE": "CONCLUSION",
    "AUTRE_X": "AUTRE"
  },
  Y: {
    "CLIENT_POSITIF": "ACCEPTANCE",
    "CLIENT_NEUTRE": "NEUTRAL", 
    "CLIENT_NEGATIF": "RESISTANCE",
    "CLIENT_QUESTION": "INQUIRY",
    "CLIENT_SILENCE": "PAUSE",
    "AUTRE_Y": "AUTRE"
  }
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
    stemming: false
  },
  
  STANDARD: {
    level: "STANDARD", 
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: false
  },
  
  AGGRESSIVE: {
    level: "AGGRESSIVE",
    preserveCase: false,
    removePunctuation: true,
    removeAccents: true,
    removeStopWords: true,
    stemming: true
  }
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
    description: "Supprime les mots de remplissage communs"
  },
  {
    id: "normalize_contractions",
    name: "Normalisation des contractions",
    pattern: /(j'|l'|d'|n'|m'|t'|s')/gi,
    replacement: "",
    enabled: true,
    priority: 2,
    description: "Développe les contractions françaises courantes"
  },
  {
    id: "normalize_politeness",
    name: "Normalisation de politesse",
    pattern: /(monsieur|madame|mademoiselle)/gi,
    replacement: "",
    enabled: true,
    priority: 3,
    description: "Supprime les formules de politesse pour se concentrer sur le contenu"
  },
  {
    id: "normalize_numbers",
    name: "Normalisation des nombres",
    pattern: /\b\d+\b/g,
    replacement: "[NOMBRE]",
    enabled: false,
    priority: 4,
    description: "Remplace les nombres par un token générique"
  }
];

// ========================================================================
// UTILITAIRES DE VALIDATION ALGORITHMLAB
// ========================================================================

export function validateNormalizationConfig(config: NormalizationConfig): string[] {
  const errors: string[] = [];
  
  if (!["BASIC", "STANDARD", "AGGRESSIVE"].includes(config.level)) {
    errors.push("Niveau de normalisation invalide");
  }
  
  if (config.customRules) {
    config.customRules.forEach((rule, index) => {
      if (!rule.id || !rule.name || !rule.pattern || rule.replacement === undefined) {
        errors.push(`Règle ${index + 1} incomplète`);
      }
      
      if (rule.priority < 1 || rule.priority > 10) {
        errors.push(`Priorité de la règle ${rule.name} doit être entre 1 et 10`);
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
    ...options
  };
}

export function isValidXTag(tag: string): tag is XTag {
  return ["ENGAGEMENT", "OUVERTURE", "REFLET", "EXPLICATION", "CLOTURE", "AUTRE_X"].includes(tag);
}

export function isValidYTag(tag: string): tag is YTag {
  return ["CLIENT_POSITIF", "CLIENT_NEUTRE", "CLIENT_NEGATIF", "CLIENT_QUESTION", "CLIENT_SILENCE", "AUTRE_Y"].includes(tag);
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
