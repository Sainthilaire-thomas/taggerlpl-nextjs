// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M3Algorithms/PausesM3Calculator.tsx

// … imports existants …
import type { BaseAlgorithm, AlgorithmMetadata } from "../shared/BaseAlgorithm";
import { BaseM3Calculator } from "./shared/BaseM3Calculator";

import type {
  M3Input,
  M3Details,
  CalculationResult,
  CalculationMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

type CognitiveInput = M3Input | string;

export class PausesM3Calculator
  extends BaseM3Calculator
  implements BaseAlgorithm<CognitiveInput, CalculationResult<M3Details>>
{
  // BaseAlgorithm : clé requise
  key = "PausesM3Calculator";

  // BaseAlgorithm : meta optionnelle, mais utile pour l’UI
  meta: AlgorithmMetadata = {
    name: "PausesM3Calculator",
    displayName: "M3 Pauses (Heuristique)",
    type: "metric",
    target: "M3",
    version: "0.1.0",
    batchSupported: true,
    description: "Score de charge cognitive basé sur pauses/hésitations.",
  };

  // ✅ EXIGÉ PAR BaseAlgorithm (ton interface contient describe)
  describe(): AlgorithmMetadata {
    return this.meta;
  }

  getMetadata(): CalculationMetadata {
    return {
      id: this.key,
      label: "Pauses M3",
      algorithmVersion: "0.1.0",
      inputSignature: "M3Input(v1: segment,language,withProsody,options)",
      executionPath: [this.key],
      target: "M3",
      algorithmKind: "metric",
      tags: ["pauses", "hesitations", "cognitive-load"],
    };
  }

  validateConfig(): boolean {
    return true;
  }

  protected normalize(input: CognitiveInput): M3Input {
    return typeof input === "string"
      ? { segment: input, language: "fr", withProsody: false }
      : {
          segment: input.segment,
          language: input.language ?? "fr",
          withProsody: input.withProsody ?? false,
          options: input.options,
        };
  }

  async calculate(input: M3Input): Promise<CalculationResult<M3Details>> {
    const t0 = Date.now();
    const text = (input.segment ?? "").trim();

    const WORD_RE = /[^\s]+/g;
    const HESIT_RE = /\b(euh+|heu+|hum+|mmm+|hem+|ben|bah|hein)\b/gi;
    const ELLIPSIS_RE = /(\.{3}|…)/g;
    const EXPL_PAUSE_RE = /\((pause|silence)\)/gi;

    const words = text.match(WORD_RE)?.length ?? 0;
    const hesitationCount = text.match(HESIT_RE)?.length ?? 0;
    const ellipses = text.match(ELLIPSIS_RE)?.length ?? 0;
    const explicitPauses = text.match(EXPL_PAUSE_RE)?.length ?? 0;
    const pauseCount = ellipses + explicitPauses;

    const hesitationRate = words > 0 ? hesitationCount / words : 0;
    const pauseRate = Math.min(1, pauseCount / 5);
    const lengthPenalty = Math.min(1, Math.max(0, (text.length - 140) / 400));

    const value = Math.max(
      0,
      Math.min(1, 0.6 * hesitationRate + 0.3 * pauseRate + 0.1 * lengthPenalty)
    );

    const details: M3Details = {
      value, // ⚠️ ne pas mettre details.unit = "score"
      pauseCount,
      hesitationCount,
      markers: [],
    };

    return {
      prediction: value.toFixed(3),
      confidence: 0.7,
      processingTime: Date.now() - t0,
      details,
      metadata: {
        algorithmVersion: "0.1.0",
        inputSignature: "M3Input(v1: segment,language,withProsody,options)",
        executionPath: [this.key],
        verbatim: input.segment,
        clientTurn: input.segment,
        // libre pour tes colonnes UI
        m3: { value, unit: "score", pauseCount, hesitationCount },
      },
    };
  }

  // On retourne le CalculationResult tel quel (signature conforme)
  async run(input: CognitiveInput): Promise<CalculationResult<M3Details>> {
    return this.calculate(this.normalize(input));
  }
}
