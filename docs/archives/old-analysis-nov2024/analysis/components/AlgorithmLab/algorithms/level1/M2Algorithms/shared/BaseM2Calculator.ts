// algorithms/level1/M2Algorithms/shared/BaseM2Calculator.ts
import type {
  M2Input,
  M2Details,
  CalculationResult,
  CalculationMetadata,
  AlgorithmType,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export abstract class BaseM2Calculator {
  abstract calculate(input: M2Input): Promise<CalculationResult<M2Details>>;
  abstract getMetadata(): CalculationMetadata;
  abstract validateConfig(): boolean;

  describe(): {
    name: string;
    displayName?: string;
    type: AlgorithmType;
    target: "M2";
    version?: string;
    batchSupported?: boolean;
    description?: string;
  } {
    const md = this.getMetadata();
    return {
      // ✅ CORRECTION : Guards pour éviter undefined
      name: md.id || "unknown-m2",
      displayName: md.label || md.id || "Unknown M2 Calculator",
      type: this.mapAlgorithmKind(md.algorithmKind || "rule-based"),
      target: "M2",
      version: md.version || "1.0.0",
      batchSupported: true,
      description: md.description,
    };
  }

  // ✅ CORRECTION : Paramètre string avec fallback
  private mapAlgorithmKind(algorithmKind: string): AlgorithmType {
    switch (algorithmKind) {
      case "rule-based":
      case "rules":
        return "rule-based";
      case "ml":
      case "machine-learning":
        return "ml";
      case "llm":
      case "language-model":
        return "llm";
      case "hybrid":
      case "composite": // Ajouté pour M2CompositeAlignmentCalculator
        return "hybrid";
      default:
        return "rule-based"; // Valeur par défaut sûre
    }
  }

  async batchCalculate?(
    inputs: M2Input[]
  ): Promise<CalculationResult<M2Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}

// Type pour compatibilité avec le registry
export type ClassificationResultM2 = CalculationResult<M2Details>;
