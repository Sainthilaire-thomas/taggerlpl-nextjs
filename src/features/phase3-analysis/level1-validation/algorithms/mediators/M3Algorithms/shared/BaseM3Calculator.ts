// src/.../M3Algorithms/shared/BaseM3Calculator.ts
import type {
  M3Details,
  M3Input,
  CalculationResult,
  CalculationMetadata,
} from "@/types/algorithm-lab";

export abstract class BaseM3Calculator {
  abstract calculate(input: M3Input): Promise<CalculationResult<M3Details>>;
  abstract getMetadata(): CalculationMetadata;
  abstract validateConfig(): boolean;

  protected normalize(input: string | M3Input): M3Input {
    return typeof input === "string"
      ? { segment: input, language: "fr", withProsody: false }
      : {
          segment: input.segment,
          language: input.language ?? "fr",
          withProsody: input.withProsody ?? false,
          options: input.options,
        };
  }

  async batchCalculate?(
    inputs: M3Input[]
  ): Promise<CalculationResult<M3Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}
