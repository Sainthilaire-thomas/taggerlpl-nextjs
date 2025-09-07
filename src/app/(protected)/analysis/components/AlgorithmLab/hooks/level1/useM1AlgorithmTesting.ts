import { useCallback, useMemo, useState } from "react";
import { RegexM1Calculator } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M1Algorithms/RegexM1Calculator";
import type {
  M1Input,
  CalculationResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type { M1Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export function useM1AlgorithmTesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CalculationResult<M1Details>[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  const calculator = useMemo(() => new RegexM1Calculator(), []);

  const run = useCallback(
    async (inputs: M1Input[]) => {
      setIsRunning(true);
      try {
        const out = await (calculator.batchCalculate
          ? calculator.batchCalculate(inputs)
          : Promise.all(inputs.map((i) => calculator.calculate(i))));
        setResults(out);
        const mean = out.length
          ? out.reduce((s, r) => s + (r.score ?? 0), 0) / out.length
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
    results,
    avgScore,
    metadata: calculator.getMetadata(),
    run,
  };
}
