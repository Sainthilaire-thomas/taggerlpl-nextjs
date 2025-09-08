// algorithms/level1/M2Algorithms/shared/BaseM2Calculator.ts
import type {
  M2Input,
  M2Details,
  CalculationResult,
  CalculatorMetadata,
  AlgorithmType,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export abstract class BaseM2Calculator {
  abstract calculate(input: M2Input): Promise<CalculationResult<M2Details>>;
  abstract getMetadata(): CalculatorMetadata;
  abstract validateConfig(): boolean;

  // ✅ CORRECTION: Utiliser AlgorithmType au lieu de "algorithm"
  describe(): {
    name: string;
    displayName?: string;
    type: AlgorithmType; // ✅ CHANGÉ: type flexible selon l'implémentation
    target: "M2";
    version?: string;
    batchSupported?: boolean;
    description?: string;
  } {
    const md = this.getMetadata();
    return {
      name: md.id,
      // ✅ CORRECTION: Utiliser 'label' au lieu de 'displayName' (CalculatorMetadata utilise 'label')
      displayName: md.label,
      // ✅ CORRECTION: Mapper algorithmKind vers un AlgorithmType valide
      type: this.mapAlgorithmKind(md.algorithmKind),
      target: "M2",
      version: md.version,
      // ✅ CORRECTION: CalculatorMetadata n'a pas 'supportsBatch', utiliser une valeur par défaut
      batchSupported: true,
      description: undefined,
    };
  }

  // ✅ CORRECTION: Mapper algorithmKind vers AlgorithmType
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
