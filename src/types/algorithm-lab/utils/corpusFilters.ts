// utils/corpusFilters.ts
import { ALGORITHM_CONFIGS, AlgorithmConfig } from "../algorithms/base";

// Types (utiliser ceux existants dans votre projet)
export interface TVGoldStandardSample {
  verbatim: string;
  expectedTag: string;
  metadata?: {
    target?: "conseiller" | "client" | "M1" | "M2" | "M3";  // ✅ Ajout M1, M2, M3
    callId?: string | number;
    speaker?: string;
    start?: number;
    end?: number;
    turnId?: string | number;
    nextOf?: string | number;
    next_turn_verbatim?: string;
    prev1_turn_verbatim?: string;
    prev2_turn_verbatim?: string;
    t0?: string;  // ✅ Ajout pour M2
    t1?: string;  // ✅ Ajout pour M2
    [k: string]: any;
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

  // 1. Filtre par speaker/target
  filtered = filtered.filter((sample) => {
    const target = sample.metadata?.target;
    
    // Cas spéciaux pour médiateurs
    if (config.speakerType === "M1") {
      return target === "conseiller";  // M1 analyse le conseiller
    }
    if (config.speakerType === "M2") {
      return target === "M2";  // M2 a son propre target
    }
    if (config.speakerType === "M3") {
      return target === "client";  // M3 analyse le client
    }
    
    // Cas normaux pour X et Y
    if (config.speakerType === "conseiller") {
      return (
        target === "conseiller" &&
        allowedConseiller.includes(sample.expectedTag)
      );
    } else if (config.speakerType === "client") {
      return (
        target === "client" &&
        allowedClient.includes(sample.expectedTag)
      );
    }
    
    return true;  // Fallback
  });

  // 2. CRITIQUE : Filtre M2 - nécessite next_turn_verbatim OU t1
  if (config.requiresNextTurn) {
    filtered = filtered.filter((s) => {
      // Pour M2 : vérifier t0 et t1
      if (config.speakerType === "M2") {
        return (
          s.metadata?.t0 &&
          s.metadata?.t1 &&
          s.metadata.t0.trim().length > 0 &&
          s.metadata.t1.trim().length > 0
        );
      }
      // Pour les autres : vérifier next_turn_verbatim
      return (
        s.metadata?.next_turn_verbatim &&
        s.metadata.next_turn_verbatim.trim().length > 0
      );
    });
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
