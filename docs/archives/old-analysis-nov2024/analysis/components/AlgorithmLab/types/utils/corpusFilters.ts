// utils/corpusFilters.ts
import { ALGORITHM_CONFIGS, AlgorithmConfig } from "../algorithms/base";

// Types (utiliser ceux existants dans votre projet)
export interface TVGoldStandardSample {
  verbatim: string;
  expectedTag: string;
  metadata?: {
    target?: "conseiller" | "client";
    callId?: string | number; // ✅ COMPATIBLE avec votre GoldStandardSample
    speaker?: string;
    start?: number;
    end?: number;
    turnId?: string | number; // ✅ COMPATIBLE avec votre GoldStandardSample
    nextOf?: string | number;
    next_turn_verbatim?: string;
    prev1_turn_verbatim?: string;
    prev2_turn_verbatim?: string;
    [k: string]: any; // ✅ COMPATIBLE avec votre interface
  };
}

// Tags autorisés
export const allowedConseiller = [
  "ENGAGEMENT",
  "OUVERTURE",
  "REFLET_VOUS",
  "REFLET_JE",
  "REFLET_ACQ",
  "EXPLICATION",
];

export const allowedClient = [
  "CLIENT_POSITIF",
  "CLIENT_NEGATIF",
  "CLIENT_NEUTRE",
];

export const filterCorpusForAlgorithm = (
  goldStandardData: TVGoldStandardSample[],
  algorithmName: string
): TVGoldStandardSample[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) {
    console.warn(`No config found for algorithm: ${algorithmName}`);
    return goldStandardData;
  }

  let filtered = goldStandardData;

  // 1. Filtre par speaker
  filtered = filtered.filter((sample) => {
    if (config.speakerType === "conseiller") {
      return (
        sample.metadata?.target === "conseiller" &&
        allowedConseiller.includes(sample.expectedTag)
      );
    } else {
      return (
        sample.metadata?.target === "client" &&
        allowedClient.includes(sample.expectedTag)
      );
    }
  });

  // 2. CRITIQUE : Filtre M2 - nécessite next_turn_verbatim
  if (config.requiresNextTurn) {
    filtered = filtered.filter(
      (s) =>
        s.metadata?.next_turn_verbatim &&
        s.metadata.next_turn_verbatim.trim().length > 0
    );
  }

  // 3. Filtre contexte
  if (config.requiresPrevContext) {
    filtered = filtered.filter(
      (s) => s.metadata?.prev1_turn_verbatim || s.metadata?.prev2_turn_verbatim
    );
  }

  return filtered;
};

export const countSamplesPerAlgorithm = (
  goldStandardData: TVGoldStandardSample[]
): Record<string, number> => {
  const counts: Record<string, number> = {};

  Object.keys(ALGORITHM_CONFIGS).forEach((algorithmName) => {
    const filtered = filterCorpusForAlgorithm(goldStandardData, algorithmName);
    counts[algorithmName] = filtered.length;
  });

  return counts;
};
