import type { M3Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type {
  M3Input,
  CalculationResult,
  CalculationMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export abstract class BaseM3Calculator {
  abstract calculate(input: M3Input): Promise<CalculationResult<M3Details>>;
  abstract getMetadata(): CalculationMetadata;
  abstract validateConfig(): boolean;

  async batchCalculate?(
    inputs: M3Input[]
  ): Promise<CalculationResult<M3Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}
