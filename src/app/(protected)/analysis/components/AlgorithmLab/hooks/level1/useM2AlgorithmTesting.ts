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
      // 1) données de démo (à remplacer par le gold réel quand dispo)
      const seed: M2Input[] = [
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

      // 2) construire un jeu de N éléments (répétition contrôlée du seed)
      const data: M2Input[] = Array.from(
        { length: sampleSize },
        (_, i) => seed[i % seed.length]
      );

      const algo = AlgorithmRegistry.get(selectedAlgorithm);
      if (!algo) {
        console.error(`Algorithme '${selectedAlgorithm}' non trouvé`);
        return;
      }

      setIsRunning(true);
      progress.current = { current: 0, total: data.length };

      const out: TVValidationResult[] = [];

      for (let i = 0; i < data.length; i++) {
        try {
          const r = (await algo.run(data[i])) as UniversalResult;
          const m2 = r.metadata?.details as M2Details | undefined;

          out.push({
            id: i,
            verbatim: data[i].t0 ?? "",
            predicted: r.prediction,
            // 👉 gold réel à brancher ici quand disponible
            goldStandard: "", // laisser vide tant que pas de référence M2
            correct: false, // idem (sinon calculer vs gold)
            confidence: r.confidence,
            processingTime: r.processingTime,
            // 👇 le contexte doit être dans metadata.*
            metadata: {
              next_turn_verbatim: data[i].t1,
              // prev1/prev2 si dispo depuis vos données réelles :
              // prev1_turn_verbatim: ...,
              // prev2_turn_verbatim: ...,
              m2: {
                value:
                  (r.prediction as TVMetadataM2["value"]) ?? "DESALIGNEMENT",
                scale: "nominal",
                details: {
                  alignmentType:
                    (r.prediction as TVMetadataM2["value"]) ?? "DESALIGNEMENT",
                  lexicalScore: Number(m2?.lexicalAlignment ?? 0),
                  semanticScore: Number(m2?.semanticAlignment ?? 0),
                  sharedTokens: (m2?.sharedTerms as string[]) ?? [],
                  confidence: r.confidence,
                  processingTime: r.processingTime,
                },
              },
            },
          });

          progress.current.current = i + 1;
        } catch (e) {
          console.error(`Erreur M2 item ${i}:`, e);
          out.push({
            id: i,
            verbatim: data[i].t0 ?? "",
            predicted: "ERROR",
            goldStandard: "",
            correct: false,
            metadata: { next_turn_verbatim: data[i].t1 },
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
