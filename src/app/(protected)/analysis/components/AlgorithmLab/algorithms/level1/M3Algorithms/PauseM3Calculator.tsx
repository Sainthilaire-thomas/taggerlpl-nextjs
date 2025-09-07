// algorithms/level1/M3Algorithms/PausesM3Calculator.ts
import type {
  M3Input,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type { M3Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

/**
 * Calculateur M3 "pauvres mais sûrs" :
 * - repère ellipses (.../…)
 * - repère tags (pause|silence|hésitation)
 * - repère hésitations (euh/heu/hum/uh/um/hein/bah)
 * - repère ruptures (--/—) et doubles espaces
 * Renvoie un score [0,1] ≈ charge cognitive liée aux pauses/hésitations.
 */
export class PausesM3Calculator {
  getMetadata(): CalculatorMetadata {
    return {
      id: "m3-pauses-basic",
      name: "M3 Pauses (Heuristique)",
      version: "0.1.0",
      variable: "M3",
      description:
        "Heuristique simple basée sur ellipses, tags de pause et hésitations lexicales.",
    };
  }

  async calculate(input: M3Input): Promise<CalculationResult<M3Details>> {
    const textRaw = input.clientTurn ?? "";
    const text = textRaw.toLowerCase();

    // Comptages simples
    const ellipses = (text.match(/…|\.{3}/g) || []).length;
    const pauseTags = (
      text.match(/\((?:pause|silence|h[ée]sitation|respire|souffle)\)/g) || []
    ).length;
    const hesitations = (
      text.match(/\b(euh+|heu+|hum+|uh+|um+|hein|bah)\b/gi) || []
    ).length;
    const dashBreaks = (text.match(/--|—/g) || []).length;
    const doubleSpaces = (text.match(/ {2,}/g) || []).length;

    const tokens = (text.match(/\S+/g) || []).length;

    // Pondération très simple (à ajuster plus tard)
    const raw =
      ellipses * 0.5 +
      pauseTags * 1.0 +
      hesitations * 0.4 +
      dashBreaks * 0.5 +
      doubleSpaces * 0.25;

    // Normalisation grossière par la taille (≈ 1 marqueur/20 tokens → score ≈ 1)
    const denom = Math.max(1, tokens * 0.05); // 0.05 = 1/20
    const score = Math.min(1, raw / denom);

    // Détails minimalistes (M3Details est vide pour l’instant → on caste)
    const details = {
      counts: {
        ellipses,
        pauseTags,
        hesitations,
        dashBreaks,
        doubleSpaces,
        tokens,
      },
      weights: {
        ellipses: 0.5,
        pauseTags: 1.0,
        hesitations: 0.4,
        dashBreaks: 0.5,
        doubleSpaces: 0.25,
      },
      raw,
      normDenominator: denom,
    } as unknown as M3Details;

    return Promise.resolve({
      score,
      details,
      metadata: {
        id: input.id,
        clientTurn: input.clientTurn,
      },
    });
  }

  async batchCalculate(
    inputs: M3Input[]
  ): Promise<Array<CalculationResult<M3Details>>> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}

export default PausesM3Calculator;
