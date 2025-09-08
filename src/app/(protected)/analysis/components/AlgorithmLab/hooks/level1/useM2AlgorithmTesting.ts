// hooks/level1/useM2AlgorithmTesting.ts
import { useCallback, useMemo, useRef, useState } from "react";
import { AlgorithmRegistry } from "../../algorithms/level1/shared/AlgorithmRegistry";
import {
  M2Input,
  TVMetadataM2,
  M2Details,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type {
  BaseAlgorithm,
  UniversalResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export interface TVValidationResult {
  id: string | number;
  verbatim: string; // T0
  predicted: string; // catégorie M2
  goldStandard?: string; // si dispo
  correct?: boolean;
  next_turn_verbatim?: string; // T+1
  metadata?: {
    m2?: TVMetadataM2;
  };
}

export function useM2AlgorithmTesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TVValidationResult[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(
    "M2CompositeAlignment"
  );
  const progress = useRef({ current: 0, total: 0 });

  const availableAlgorithms = useMemo(() => {
    return AlgorithmRegistry.list()
      .filter((a) => a.meta.target === "M2")
      .map((a) => ({ id: a.meta.name, name: a.meta.displayName }));
  }, []);

  const goldStandardCount = 1000; // remplace par ton compteur réel si besoin

  const runTest = useCallback(
    async (sampleSize: number) => {
      // TODO: remplace par fetch réel depuis turntagged avec next_turn_verbatim
      // Utilisation des propriétés correctes : t0 et t1
      const fakeData: M2Input[] = [
        {
          t0: "Je vais vérifier votre dossier tout de suite.",
          t1: "D'accord merci.",
        },
        {
          t0: "Nous pouvons proposer une alternative.",
          t1: "Je ne suis pas d'accord.",
        },
        {
          t0: "Pouvez-vous préciser la date souhaitée ?",
          t1: "Le 12 serait parfait.",
        },
      ];

      const algoInstance = AlgorithmRegistry.get(selectedAlgorithm);
      if (!algoInstance) {
        console.error(`Algorithme '${selectedAlgorithm}' non trouvé`);
        return;
      }

      setIsRunning(true);
      progress.current = { current: 0, total: fakeData.length };

      const out: TVValidationResult[] = [];
      for (let i = 0; i < fakeData.length; i++) {
        try {
          // Utilisation de l'interface universelle run() au lieu de calculate()
          const r = (await algoInstance.run(fakeData[i])) as UniversalResult;

          // Cast vers M2Details pour accéder aux propriétés spécifiques M2
          const m2Details = r.metadata?.details as M2Details;

          out.push({
            id: i,
            verbatim: fakeData[i].t0 || "", // Utilisation de t0
            predicted: r.prediction,
            next_turn_verbatim: fakeData[i].t1, // Utilisation de t1
            correct: undefined, // si gold dispo, calcule correct ici
            metadata: {
              m2: {
                value: r.prediction as TVMetadataM2["value"],
                scale: "nominal",
                details: {
                  alignmentType: r.prediction as TVMetadataM2["value"],
                  lexicalScore: Number(m2Details?.lexicalAlignment ?? 0),
                  semanticScore: Number(m2Details?.semanticAlignment ?? 0),
                  sharedTokens: (m2Details?.sharedTerms as string[]) ?? [],
                  patterns: [], // À remplir selon votre logique
                  justification: "Calcul M2 (prototype)",
                  confidence: r.confidence,
                  processingTime: r.processingTime,
                },
              },
            },
          });
          progress.current.current = i + 1;
        } catch (error) {
          console.error(`Erreur lors du calcul pour l'item ${i}:`, error);
          out.push({
            id: i,
            verbatim: fakeData[i].t0 || "", // Utilisation de t0
            predicted: "ERROR",
            next_turn_verbatim: fakeData[i].t1, // Utilisation de t1
            correct: false,
          });
        }
      }

      setResults(out);
      setIsRunning(false);
    },
    [selectedAlgorithm]
  );

  return {
    isRunning,
    results,
    runTest,
    selectedAlgorithm,
    setSelectedAlgorithm,
    availableAlgorithms,
    progress: progress.current,
    goldStandardCount,
  };
}

export default useM2AlgorithmTesting;
