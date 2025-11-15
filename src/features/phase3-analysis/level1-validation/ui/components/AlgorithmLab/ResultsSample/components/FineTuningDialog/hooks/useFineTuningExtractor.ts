import { useState } from "react";
import { TVValidationResult } from "../../../types";
import { FineTuningExtractor } from "../FineTuningExtractor";
import { ExtractionProgress } from "../types";

export const useFineTuningExtractor = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress>({
    current: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const extractFineTuningData = async (
    results: TVValidationResult[]
  ): Promise<string> => {
    setIsExtracting(true);
    setError(null);
    setProgress({ current: 0, total: results.length });

    try {
      const extractor = new FineTuningExtractor(results, (current, total) =>
        setProgress({ current, total, phase: "processing" })
      );

      const data = await extractor.extract();
      setProgress({
        current: results.length,
        total: results.length,
        phase: "complete",
      });
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsExtracting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return {
    extractFineTuningData,
    isExtracting,
    progress,
    error,
  };
};
