import type { M1Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type {
  M1Input,
  CalculationResult,
  CalculationMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export abstract class BaseM1Calculator {
  abstract calculate(input: M1Input): Promise<CalculationResult<M1Details>>;
  abstract getMetadata(): CalculationMetadata;
  abstract validateConfig(): boolean;

  async batchCalculate?(
    inputs: M1Input[]
  ): Promise<CalculationResult<M1Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}
