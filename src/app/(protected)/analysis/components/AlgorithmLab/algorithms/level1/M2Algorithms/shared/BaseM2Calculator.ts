import type { M2Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types/ThesisVariables";
import type {
  M2Input,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/Level1Types";

export abstract class BaseM2Calculator {
  abstract calculate(input: M2Input): Promise<CalculationResult<M2Details>>;
  abstract getMetadata(): CalculatorMetadata;
  abstract validateConfig(): boolean;

  async batchCalculate?(
    inputs: M2Input[]
  ): Promise<CalculationResult<M2Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}
