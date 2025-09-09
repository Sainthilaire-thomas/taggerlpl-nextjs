// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/legacyAdapters.ts

import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
} from "../../../types/algorithms/base";

// ========================================================================
// ADAPTATEUR LEGACY GÉNÉRIQUE
// ========================================================================

/**
 * Enveloppe n'importe quel algorithme legacy en UniversalAlgorithm
 * Compatible avec les interfaces hétérogènes existantes
 */
function wrapLegacyAlgorithm(
  algo: any,
  target: "X" | "Y" | "M1" | "M2" | "M3",
  overrides?: {
    displayName?: string;
    description?: string;
    type?: AlgorithmType;
  }
): UniversalAlgorithm {
  return {
    describe(): AlgorithmDescriptor {
      // Essayer d'extraire les métadonnées existantes
      const existingMeta = algo.describe?.() || algo.getMetadata?.() || {};

      const name =
        existingMeta.name || algo.constructor.name || `${target}Algorithm`;
      const displayName =
        overrides?.displayName ||
        existingMeta.displayName ||
        `${target} Legacy Algorithm`;
      const version = existingMeta.version || "1.0.0";
      const type: AlgorithmType =
        overrides?.type || existingMeta.type || "rule-based";

      return {
        name,
        displayName,
        version,
        type,
        target,
        batchSupported:
          typeof algo.runBatch === "function" ||
          typeof algo.batchClassify === "function",
        requiresContext: target === "M2", // M2 nécessite généralement du contexte
        description:
          overrides?.description ||
          existingMeta.description ||
          `Legacy ${target} algorithm`,
        examples: generateExamples(target),
      };
    },

    validateConfig(): boolean {
      if (typeof algo.validateConfig === "function") {
        return algo.validateConfig();
      }
      return true; // Assume valid if no validation method
    },

    async classify(input: string): Promise<UniversalResult> {
      // Rétro-compatibilité : certains panneaux utilisent encore classify()
      return this.run(input);
    },

    async run(input: unknown): Promise<UniversalResult> {
      const startTime = Date.now();

      try {
        let result: any;

        // Essayer différentes méthodes selon l'interface
        if (typeof algo.run === "function") {
          result = await algo.run(input);
        } else if (typeof algo.classify === "function") {
          result = await algo.classify(input as string);
        } else if (typeof algo.calculate === "function") {
          result = await algo.calculate(input);
        } else {
          throw new Error(
            `Algorithm ${algo.constructor.name} has no recognized execution method`
          );
        }

        return normalizeToUniversalResult(result, startTime, target);
      } catch (error) {
        return createErrorResult(
          error instanceof Error ? error.message : "Unknown error",
          algo.constructor.name,
          startTime
        );
      }
    },

    async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
      // Essayer batch natif d'abord
      if (typeof algo.runBatch === "function") {
        try {
          const results = await algo.runBatch(inputs);
          return results.map((r: any) =>
            normalizeToUniversalResult(r, Date.now(), target)
          );
        } catch (error) {
          // Fallback vers séquentiel si batch échoue
        }
      }

      if (typeof algo.batchClassify === "function") {
        try {
          const results = await algo.batchClassify(inputs as string[]);
          return results.map((r: any) =>
            normalizeToUniversalResult(r, Date.now(), target)
          );
        } catch (error) {
          // Fallback vers séquentiel si batch échoue
        }
      }

      // Fallback : exécution séquentielle
      const results: UniversalResult[] = [];
      for (const input of inputs) {
        results.push(await this.run(input));
      }
      return results;
    },
  };
}

// ========================================================================
// NORMALISATION VERS UNIVERSALRESULT
// ========================================================================

function normalizeToUniversalResult(
  result: any,
  startTime: number,
  target: string
): UniversalResult {
  const processingTime = Date.now() - startTime;

  // Extraire prediction de différents formats
  let prediction = "UNKNOWN";
  if (typeof result === "string") {
    prediction = result;
  } else if (result?.prediction) {
    prediction = result.prediction;
  } else if (result?.classification) {
    prediction = result.classification;
  } else if (result?.target) {
    prediction = result.target;
  }

  // Extraire confidence de différents formats
  let confidence = 0;
  if (typeof result?.confidence === "number") {
    confidence = Math.max(0, Math.min(1, result.confidence));
  } else if (typeof result?.score === "number") {
    confidence = Math.max(0, Math.min(1, result.score));
  } else {
    confidence = 0.5; // Valeur par défaut
  }

  return {
    prediction: String(prediction),
    confidence,
    processingTime:
      result?.processingTimeMs || result?.processingTime || processingTime,
    algorithmVersion: "legacy-wrapped",
    metadata: {
      inputType: "legacy",
      executionPath: ["legacy-wrapper"],
      warnings: [],
      details: result?.metadata || result?.details || result,
    },
  };
}

function createErrorResult(
  error: string,
  algorithmName: string,
  startTime: number
): UniversalResult {
  return {
    prediction: "ERROR",
    confidence: 0,
    processingTime: Date.now() - startTime,
    algorithmVersion: algorithmName,
    metadata: {
      warnings: [error],
      executionPath: ["error"],
      inputType: "unknown",
    },
  };
}

function generateExamples(
  target: string
): Array<{ input: string; note: string }> {
  switch (target) {
    case "X":
      return [
        { input: "je vais vérifier votre dossier", note: "Exemple ENGAGEMENT" },
        { input: "avez-vous d'autres questions ?", note: "Exemple OUVERTURE" },
        { input: "je comprends votre situation", note: "Exemple REFLET" },
      ];
    case "Y":
      return [
        { input: "d'accord, merci beaucoup", note: "Exemple CLIENT_POSITIF" },
        { input: "ce n'est pas possible !", note: "Exemple CLIENT_NEGATIF" },
        { input: "ok", note: "Exemple CLIENT_NEUTRE" },
      ];
    case "M1":
      return [
        {
          input: "je vais traiter votre demande",
          note: "Haute densité verbes d'action",
        },
        { input: "c'est noté", note: "Basse densité verbes d'action" },
      ];
    case "M2":
      return [
        {
          input: JSON.stringify({
            t0: "je comprends",
            t1: "merci de votre compréhension",
          }),
          note: "Exemple alignement fort",
        },
      ];
    default:
      return [];
  }
}

// ========================================================================
// ADAPTATEURS SPÉCIALISÉS PAR VARIABLE
// ========================================================================

export function wrapXAlgorithm(algo: any): UniversalAlgorithm {
  return wrapLegacyAlgorithm(algo, "X", {
    displayName: `${algo.constructor.name.replace(
      "Classifier",
      ""
    )} X Classifier`,
    description:
      "Classification des stratégies conseiller (ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION)",
    type: algo.constructor.name.includes("OpenAI")
      ? "llm"
      : algo.constructor.name.includes("Spacy")
      ? "ml"
      : "rule-based",
  });
}

export function wrapYAlgorithm(algo: any): UniversalAlgorithm {
  return wrapLegacyAlgorithm(algo, "Y", {
    displayName: `${algo.constructor.name.replace(
      "Classifier",
      ""
    )} Y Classifier`,
    description:
      "Classification des réactions client (CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE)",
    type: "rule-based",
  });
}

export function wrapM1Algorithm(algo: any): UniversalAlgorithm {
  return wrapLegacyAlgorithm(algo, "M1", {
    displayName: "M1 Action Verb Counter",
    description:
      "Calcul de la densité de verbes d'action dans les tours conseiller",
    type: "metric",
  });
}

export function wrapM2Algorithm(algo: any): UniversalAlgorithm {
  return wrapLegacyAlgorithm(algo, "M2", {
    displayName: `${algo.constructor.name} M2 Calculator`,
    description:
      "Calcul de l'alignement interactionnel entre tours conseiller-client",
    type: "hybrid",
  });
}

export function wrapM3Algorithm(algo: any): UniversalAlgorithm {
  return wrapLegacyAlgorithm(algo, "M3", {
    displayName: `${algo.constructor.name} M3 Calculator`,
    description: "Analyse de la charge cognitive et des indicateurs temporels",
    type: "rule-based",
  });
}

// ========================================================================
// HELPERS DE VALIDATION
// ========================================================================

export function validateUniversalCompliance(algorithm: UniversalAlgorithm): {
  isCompliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  try {
    const descriptor = algorithm.describe();

    if (!descriptor.name) issues.push("Missing name in descriptor");
    if (!descriptor.target) issues.push("Missing target in descriptor");
    if (!descriptor.type) issues.push("Missing type in descriptor");

    if (!algorithm.validateConfig()) {
      issues.push("validateConfig() returned false");
    }

    if (typeof algorithm.run !== "function") {
      issues.push("Missing run() method");
    }
  } catch (error) {
    issues.push(
      `describe() failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return {
    isCompliant: issues.length === 0,
    issues,
  };
}
