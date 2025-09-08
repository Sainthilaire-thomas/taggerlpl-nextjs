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
