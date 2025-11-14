// src/app/(protected)/analysis/components/cognitive-metrics/indicators/FluiditeCognitiveIndicator/index.ts

// ================ IMPORTS DIRECTS ================

export {
  FluiditeCognitiveIndicator,
  createFluiditeCognitiveIndicator,
  type FluidityCognitiveResult,
  type FamilyFluiditeMetrics,
} from "./FluiditeCognitiveIndicator";

export { default as FluiditeCognitiveInterface } from "./FluiditeCognitiveInterface";
export { default as BasicFluidityAlgorithm } from "./algorithms/BasicFluidityAlgorithm";

// ================ EXPORTS AVEC FALLBACKS ================

// NeuronMirrorAlgorithm avec fallback
let NeuronMirrorAlgorithmExport: any;
try {
  const neuronModule = require("./algorithms/NeuronMirrorAlgorithm");
  NeuronMirrorAlgorithmExport =
    neuronModule.default || neuronModule.NeuronMirrorAlgorithm;
} catch (error) {
  console.warn(
    "⚠️ NeuronMirrorAlgorithm non disponible, utilisation de BasicFluidityAlgorithm"
  );
  const {
    default: BasicFluidityAlgorithm,
  } = require("./algorithms/BasicFluidityAlgorithm");
  NeuronMirrorAlgorithmExport = BasicFluidityAlgorithm;
}
export { NeuronMirrorAlgorithmExport as NeuronMirrorAlgorithm };

// useFluiditeCognitive avec fallback
let useFluiditeCognitiveExport: any;
try {
  const modernHookModule = require("./hooks/useFluiditeCognitive");
  useFluiditeCognitiveExport = modernHookModule.useFluiditeCognitive;
} catch (error) {
  console.warn("⚠️ useFluiditeCognitive hook non disponible");
  useFluiditeCognitiveExport = () => ({
    calculate: () => Promise.resolve([]),
    loading: false,
    error: null,
    results: [],
  });
}
export { useFluiditeCognitiveExport as useFluiditeCognitive };

// useFluidityCognitiveCalculator avec fallback
let useFluidityCognitiveCalculatorExport: any;
let FluidityCognitiveDataExport: any;
let FluidityResultExport: any;
let AlgorithmConfigExport: any;

try {
  const legacyHookModule = require("./hooks/useFluidityCognitiveCalculator");
  useFluidityCognitiveCalculatorExport =
    legacyHookModule.useFluidityCognitiveCalculator;
  FluidityCognitiveDataExport = legacyHookModule.FluidityCognitiveData;
  FluidityResultExport = legacyHookModule.FluidityResult;
  AlgorithmConfigExport = legacyHookModule.AlgorithmConfig;
} catch (error) {
  console.warn("⚠️ useFluidityCognitiveCalculator hook non disponible");
  useFluidityCognitiveCalculatorExport = () => ({
    calculate: () => Promise.resolve([]),
    loading: false,
    error: null,
    results: [],
  });
  FluidityCognitiveDataExport = null;
  FluidityResultExport = null;
  AlgorithmConfigExport = null;
}

export { useFluidityCognitiveCalculatorExport as useFluidityCognitiveCalculator };

// Types avec fallbacks
export type FluidityCognitiveData = typeof FluidityCognitiveDataExport;
export type FluidityResult = typeof FluidityResultExport;
export type AlgorithmConfigType = typeof AlgorithmConfigExport;

// ================ CONFIGURATION PAR DÉFAUT ================

export const FLUIDITE_COGNITIVE_DEFAULTS = {
  algorithmId: "basic_fluidity" as const,
  enableCaching: true,
  enableBenchmarking: false,
  familyFilters: [] as string[],
} as const;

// ================ FACTORY HELPERS ================

/**
 * Crée une instance complète avec configuration par défaut
 */
export function createFluiditeCognitiveSetup() {
  const {
    createFluiditeCognitiveIndicator,
  } = require("./FluiditeCognitiveIndicator");
  const indicator = createFluiditeCognitiveIndicator();

  return {
    indicator,
    algorithms: indicator.getAvailableAlgorithms(),
    config: FLUIDITE_COGNITIVE_DEFAULTS,
  };
}

/**
 * Utilitaire pour les tests
 */
export function createFluiditeCognitiveForTesting(
  algorithmId: string = "basic_fluidity"
) {
  const {
    createFluiditeCognitiveIndicator,
  } = require("./FluiditeCognitiveIndicator");
  const indicator = createFluiditeCognitiveIndicator();

  // Vérifier que l'algorithme existe avant de le changer
  const availableAlgorithms = indicator.getAvailableAlgorithms();
  const algorithmExists = availableAlgorithms.some(
    (alg: any) => alg.id === algorithmId
  );

  if (algorithmExists) {
    indicator.switchAlgorithm(algorithmId);
  } else {
    console.warn(
      `⚠️ Algorithme ${algorithmId} non disponible, utilisation de l'algorithme par défaut`
    );
  }

  return indicator;
}

// ================ VALIDATION UTILITIES ================

/**
 * Valide les données d'entrée pour FluiditeCognitive
 */
export function validateFluidityCognitiveData(data: any[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || data.length === 0) {
    errors.push("Aucune donnée fournie");
    return { isValid: false, errors, warnings };
  }

  // Champs requis pour FluiditeCognitive
  const requiredFields = ["verbatim", "start_time", "end_time", "speaker"];
  const optionalFields = ["next_turn_verbatim", "tag", "call_id"];

  data.forEach((item, index) => {
    // Vérification des champs requis
    requiredFields.forEach((field) => {
      if (
        !(field in item) ||
        item[field] === null ||
        item[field] === undefined
      ) {
        errors.push(`Champ requis '${field}' manquant à l'index ${index}`);
      }
    });

    // Avertissements pour les champs optionnels
    optionalFields.forEach((field) => {
      if (!(field in item) || !item[field]) {
        warnings.push(`Champ optionnel '${field}' manquant à l'index ${index}`);
      }
    });

    // Validation des types
    if (
      typeof item.start_time !== "number" ||
      typeof item.end_time !== "number"
    ) {
      errors.push(`Types invalides pour les timestamps à l'index ${index}`);
    }

    if (item.start_time >= item.end_time) {
      errors.push(`Timestamps invalides (start >= end) à l'index ${index}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ================ MIGRATION HELPER ================

/**
 * Helper pour migrer de l'ancien hook vers le nouveau
 */
export function migrateFromLegacyHook(legacyConfig: any) {
  const newConfig = {
    algorithmId: legacyConfig.selectedAlgorithm || "basic_fluidity",
    enableCaching: true,
    enableBenchmarking: false,
    familyFilters: legacyConfig.familyFilters || [],
  };

  return newConfig;
}

// ================ DEBUGGING UTILITIES ================

/**
 * Utilitaire de debugging pour vérifier l'état du module
 */
export function debugFluiditeCognitiveModule() {
  const debug = {
    hasMainIndicator: true,
    hasInterface: true,
    hasBasicAlgorithm: true,
    hasNeuronAlgorithm: NeuronMirrorAlgorithmExport !== undefined,
    hasModernHook: useFluiditeCognitiveExport !== null,
    hasLegacyHook: useFluidityCognitiveCalculatorExport !== null,
    availableExports: [
      "FluiditeCognitiveIndicator",
      "createFluiditeCognitiveIndicator",
      "FluiditeCognitiveInterface",
      "BasicFluidityAlgorithm",
      "NeuronMirrorAlgorithm",
      "useFluiditeCognitive",
      "useFluidityCognitiveCalculator",
      "createFluiditeCognitiveSetup",
      "FLUIDITE_COGNITIVE_DEFAULTS",
      "validateFluidityCognitiveData",
      "migrateFromLegacyHook",
    ] as string[],
  };

  return debug;
}

// ================ TYPE EXPORTS POUR COMPATIBILITÉ ================

// Re-export des types du framework de base
export type {
  TurnTaggedData,
  IndicatorResult,
  AlgorithmConfig as BaseAlgorithmConfig,
} from "@/features/phase3-analysis/shared/metrics-framework/core/types/base";

// ================ DEFAULT EXPORT ================

// Export par défaut pour faciliter l'import
const FluiditeCognitiveModule = {
  // Classes principales
  FluiditeCognitiveIndicator: (async () => {
    const module = await import("./FluiditeCognitiveIndicator");
    return module.FluiditeCognitiveIndicator;
  })(),
  FluiditeCognitiveInterface: (async () => {
    const module = await import("./FluiditeCognitiveInterface");
    return module.default;
  })(),
  BasicFluidityAlgorithm: (async () => {
    const module = await import("./algorithms/BasicFluidityAlgorithm");
    return module.default;
  })(),
  NeuronMirrorAlgorithm: NeuronMirrorAlgorithmExport,

  // Factory functions
  createFluiditeCognitiveSetup,
  createFluiditeCognitiveForTesting,

  // Configuration
  FLUIDITE_COGNITIVE_DEFAULTS,

  // Utilities
  validateFluidityCognitiveData,
  migrateFromLegacyHook,
  debugFluiditeCognitiveModule,

  // Hooks
  useFluiditeCognitive: useFluiditeCognitiveExport,
  useFluidityCognitiveCalculator: useFluidityCognitiveCalculatorExport,
};

export default FluiditeCognitiveModule;
