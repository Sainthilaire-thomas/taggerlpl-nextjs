import type { VariableTarget } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

/** Typologie des algorithmes */
export type AlgorithmType = "rule-based" | "ml" | "llm" | "hybrid";

/** Métadonnées unifiées (affichées dans l’UI + logs) */
export interface AlgorithmMetadata {
  name: string; // identifiant humain (ex: "RegexXClassifier")
  displayName?: string; // libellé UI (ex: "Règles – X")
  type: AlgorithmType; // rule-based | ml | llm | composite
  target: VariableTarget; // "X" | "Y" | "M1" | "M2" | "M3"
  version?: string; // ex: "1.0.0"
  description?: string;
  batchSupported?: boolean; // true si runBatch() dispo
  apiRequirements?: string[]; // ex: ["OPENAI_API_KEY"]
}

/** Contrat minimal des nouveaux algorithmes */
export interface BaseAlgorithm<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
  runBatch?(inputs: TInput[]): Promise<TOutput[]>;
  describe(): AlgorithmMetadata;
  validateConfig?(): boolean;
}

/** Helpers optionnels */
export const supportsBatch = (algo: BaseAlgorithm<any, any>) =>
  typeof algo.runBatch === "function";
export const hasMethod = <T extends object>(obj: T | undefined, k: keyof T) =>
  !!obj && typeof obj[k] === "function";

/* ================================
   ⚙️  Mode compatibilité (legacy)
   --------------------------------
   Si certains anciens "classificateurs" existent encore
   (avec classify()/getMetadata()), on peut les envelopper
   sans toucher au code d’origine.
   ================================= */
export interface LegacyClassifierLike {
  classify: (verbatim: string) => Promise<any>;
  batchClassify?: (verbatims: string[]) => Promise<any[]>;
  getMetadata: () => {
    name: string;
    type?: AlgorithmType;
    version?: string;
    description?: string;
    supportsBatch?: boolean;
  };
  validateConfig?: () => boolean;
}

/** Adapte un ancien classificateur en BaseAlgorithm<string, any> */
export function wrapLegacyClassifier(
  legacy: LegacyClassifierLike,
  target: VariableTarget,
  displayName?: string
): BaseAlgorithm<string, any> {
  return {
    async run(input: string) {
      return legacy.classify(input);
    },
    async runBatch(inputs: string[]) {
      if (typeof legacy.batchClassify === "function")
        return legacy.batchClassify(inputs);
      // fallback trivial si batch non supporté
      const out = [];
      for (const v of inputs) out.push(await legacy.classify(v));
      return out;
    },
    describe(): AlgorithmMetadata {
      const meta = legacy.getMetadata() || { name: "legacy" };
      return {
        name: meta.name,
        displayName: displayName ?? meta.name,
        type: meta.type ?? "rule-based",
        target,
        version: meta.version ?? "1.0.0",
        description: meta.description,
        batchSupported: !!meta.supportsBatch,
      };
    },
    validateConfig() {
      return typeof legacy.validateConfig === "function"
        ? !!legacy.validateConfig()
        : true;
    },
  };
}
