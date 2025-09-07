// hooks/level1/useM2AlgorithmTesting.ts
import { useCallback, useMemo, useRef, useState } from "react";
import { AlgorithmRegistry } from "../../algorithms/level1/shared/AlgorithmRegistry";
import { M2Input, TVMetadataM2 } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

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
      .filter((a) => a.target === "M2")
      .map((a) => ({ id: a.id, name: a.displayName }));
  }, []);

  const goldStandardCount = 1000; // remplace par ton compteur réel si besoin

  const runTest = useCallback(
    async (sampleSize: number) => {
      // TODO: remplace par fetch réel depuis turntagged avec next_turn_verbatim
      const fakeData: M2Input[] = [
        {
          turnVerbatim: "Je vais vérifier votre dossier tout de suite.",
          nextTurnVerbatim: "D'accord merci.",
        },
        {
          turnVerbatim: "Nous pouvons proposer une alternative.",
          nextTurnVerbatim: "Je ne suis pas d'accord.",
        },
        {
          turnVerbatim: "Pouvez-vous préciser la date souhaitée ?",
          nextTurnVerbatim: "Le 12 serait parfait.",
        },
      ];

      const algoClass = AlgorithmRegistry.get(selectedAlgorithm);
      const algo = new algoClass();

      setIsRunning(true);
      progress.current = { current: 0, total: fakeData.length };

      const out: TVValidationResult[] = [];
      for (let i = 0; i < fakeData.length; i++) {
        const r = await algo.calculate(fakeData[i]);
        out.push({
          id: i,
          verbatim: fakeData[i].turnVerbatim,
          predicted: r.prediction,
          next_turn_verbatim: fakeData[i].nextTurnVerbatim,
          correct: undefined, // si gold dispo, calcule correct ici
          metadata: {
            m2: {
              value: r.prediction as TVMetadataM2["value"],
              scale: "nominal",
              details: {
                alignmentType: r.prediction as TVMetadataM2["value"],
                lexicalScore: Number(r.metadata?.["lexicalScore"] ?? 0),
                semanticScore: Number(r.metadata?.["semanticScore"] ?? 0),
                sharedTokens: (r.metadata?.["sharedTokens"] as string[]) ?? [],
                patterns: (r.metadata?.["patterns"] as string[]) ?? [],
                justification: "Calcul M2 (prototype)",
                confidence: r.confidence,
                processingTime: r.processingTime,
              },
            },
          },
        });
        progress.current.current = i + 1;
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
