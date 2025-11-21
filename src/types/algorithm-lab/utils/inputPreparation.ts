// utils/inputPreparation.ts
import { ALGORITHM_CONFIGS } from "../algorithms/base";
import type { TVGoldStandardSample } from "./corpusFilters";

export const prepareInputsForAlgorithm = (
  samples: TVGoldStandardSample[],
  algorithmName: string
): any[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) throw new Error(`Algorithm ${algorithmName} not configured`);

  return samples.map((sample) => {
    switch (config.inputFormat) {
      case "simple":
        return sample.verbatim;

      case "contextual":
        const m = sample.metadata || {};
        return `T-2: ${m.prev2_turn_verbatim ?? "—"}\nT-1: ${
          m.prev1_turn_verbatim ?? "—"
        }\nT0: ${sample.verbatim ?? ""}`;

      case "alignment":
        return {
          t0: sample.metadata?.t0 || sample.verbatim,
          t1: sample.metadata?.t1 || sample.metadata?.client_verbatim,
          conseillerTurn: sample.verbatim,
          clientTurn: sample.metadata?.next_turn_verbatim,
        };

      case "alignment_context":
        return {
          t0: sample.verbatim,
          t1: sample.metadata?.next_turn_verbatim,
          prev1: sample.metadata?.prev1_turn_verbatim,
          prev2: sample.metadata?.prev2_turn_verbatim,
          conseillerTurn: sample.verbatim,
          clientTurn: sample.metadata?.next_turn_verbatim,
        };

      case "cognitive":
        return {
          segment: sample.verbatim,
          withProsody: false,
          language: "fr",
          options: {
            id: sample.metadata?.turnId,
            clientTurn: sample.verbatim,
            conseillerContext: sample.metadata?.prev1_turn_verbatim,
          },
        };

      default:
        return sample.verbatim;
    }
  });
};

export const debugPreparedInputs = (
  inputs: any[],
  algorithmName: string
): void => {
  console.group(`[${algorithmName}] Debug inputs préparés`);
  console.log(`Nombre d'inputs: ${inputs.length}`);
  if (inputs.length > 0) {
    console.log("Premier input:", inputs[0]);
  }
  console.groupEnd();
};
