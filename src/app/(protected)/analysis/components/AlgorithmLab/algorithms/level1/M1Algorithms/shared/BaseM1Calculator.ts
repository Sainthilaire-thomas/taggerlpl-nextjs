import type { M1Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types/ThesisVariables";
import type {
  M1Input,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/Level1Types";

export abstract class BaseM1Calculator {
  abstract calculate(input: M1Input): Promise<CalculationResult<M1Details>>;
  abstract getMetadata(): CalculatorMetadata;
  abstract validateConfig(): boolean;

  async batchCalculate?(
    inputs: M1Input[]
  ): Promise<CalculationResult<M1Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}
