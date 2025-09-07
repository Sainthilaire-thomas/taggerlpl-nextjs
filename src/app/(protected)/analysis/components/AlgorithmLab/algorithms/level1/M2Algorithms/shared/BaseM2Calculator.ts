// algorithms/level1/M2Algorithms/shared/BaseM2Calculator.ts
import type {
  M2Input,
  M2Details,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export abstract class BaseM2Calculator {
  abstract calculate(input: M2Input): Promise<CalculationResult<M2Details>>;
  abstract getMetadata(): CalculatorMetadata;
  abstract validateConfig(): boolean;

  describe(): {
    name: string;
    displayName?: string;
    type: "algorithm";
    target: "M2";
    version?: string;
    batchSupported?: boolean;
    description?: string;
  } {
    const md = this.getMetadata();
    return {
      name: md.id,
      displayName: md.displayName,
      type: "algorithm",
      target: "M2",
      version: md.version,
      batchSupported: md.supportsBatch,
      description: md.description,
    };
  }

  async batchCalculate?(
    inputs: M2Input[]
  ): Promise<CalculationResult<M2Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}

// Type pour compatibilité avec le registry
export type ClassificationResultM2 = CalculationResult<M2Details>;
