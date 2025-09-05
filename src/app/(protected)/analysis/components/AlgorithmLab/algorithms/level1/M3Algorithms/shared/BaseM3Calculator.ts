import type { M3Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types/ThesisVariables";
import type {
  M3Input,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/Level1Types";

export abstract class BaseM3Calculator {
  abstract calculate(input: M3Input): Promise<CalculationResult<M3Details>>;
  abstract getMetadata(): CalculatorMetadata;
  abstract validateConfig(): boolean;

  async batchCalculate?(
    inputs: M3Input[]
  ): Promise<CalculationResult<M3Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}
