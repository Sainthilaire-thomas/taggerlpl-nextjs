// hooks/level1/useM3AlgorithmTesting.ts
import { useCallback, useMemo, useState } from "react";
import type {
  M3Input,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type { M3Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

// ↳ Remplace par ton calculateur M3 réel si tu en as un autre
import { PausesM3Calculator } from "../../algorithms/level1/M3Algorithms/PauseM3Calculator";

type RunInput = Array<{ id?: string | number; clientTurn: string }>;

export function useM3AlgorithmTesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CalculationResult<M3Details>[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  // Instancie une seule fois
  const calculator = useMemo(() => new PausesM3Calculator(), []);
  const metadata: CalculatorMetadata = useMemo(
    () => calculator.getMetadata(),
    [calculator]
  );

  const run = useCallback(
    async (inputs: RunInput) => {
      if (!Array.isArray(inputs) || inputs.length === 0) {
        setResults([]);
        setAvgScore(0);
        return;
      }

      setIsRunning(true);
      try {
        // ✅ CORRECTION: Normalisation des inputs vers M3Input avec 'segment' requis
        const normalized: M3Input[] = inputs.map((x) => ({
          segment: x.clientTurn ?? "", // ✅ 'segment' est requis par M3Input
          withProsody: false,
          language: "fr",
          options: {
            id: x.id,
            clientTurn: x.clientTurn,
          },
        }));

        // Exécution (batch si dispo, sinon item par item)
        const outs =
          typeof (calculator as any).batchCalculate === "function"
            ? await (calculator as any).batchCalculate(normalized)
            : await Promise.all(normalized.map((v) => calculator.calculate(v)));

        // Injection d'un minimum de contexte verbeux (facilite l'UI)
        const withContext = outs.map(
          (r: CalculationResult<M3Details>, idx: number) => ({
            ...r,
            metadata: {
              ...(r.metadata || {}),
              id: inputs[idx]?.id,
              clientTurn: inputs[idx]?.clientTurn,
              verbatim: inputs[idx]?.clientTurn,
            },
          })
        );

        setResults(withContext);

        // ✅ CORRECTION: Utiliser une propriété qui existe dans M3Details ou confidence
        const mean =
          withContext.length > 0
            ? withContext.reduce(
                (s: number, r: CalculationResult<M3Details>) => {
                  // Pour M3, utiliser une propriété appropriée des détails ou confidence
                  const score = r.details?.value ?? r.confidence ?? 0;
                  return s + (typeof score === "number" ? score : 0);
                },
                0
              ) / withContext.length
            : 0;
        setAvgScore(mean);
      } finally {
        setIsRunning(false);
      }
    },
    [calculator]
  );

  return {
    isRunning,
    results, // CalculationResult<M3Details>[]
    avgScore, // number | null
    metadata, // CalculatorMetadata
    run, // (inputs: {id?, clientTurn}[]) => Promise<void>
  };
}

export default useM3AlgorithmTesting;
