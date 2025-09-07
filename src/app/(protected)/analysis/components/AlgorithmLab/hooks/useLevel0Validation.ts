// Hook Niveau 0 - useLevel0Validation.ts
import { useState, useCallback } from "react";
import {
  InterAnnotatorData,
  KappaMetrics,
  DisagreementCase,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export const useLevel0Validation = () => {
  const [annotations, setAnnotations] = useState<InterAnnotatorData[]>([]);
  const [kappaMetrics, setKappaMetrics] = useState<KappaMetrics | null>(null);
  const [disagreements, setDisagreements] = useState<DisagreementCase[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateKappa = useCallback(async (data: InterAnnotatorData[]) => {
    setIsCalculating(true);

    // Simulation du calcul Kappa de Cohen
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const total = data.length;
    const agreements = data.filter((d) => d.agreed).length;
    const observed = total > 0 ? agreements / total : 0;

    // Calcul simplifié pour 5 catégories
    const expected = 0.2;
    const kappa = (observed - expected) / (1 - expected);

    const getInterpretation = (k: number): KappaMetrics["interpretation"] => {
      if (k < 0) return "POOR";
      if (k < 0.21) return "FAIR";
      if (k < 0.41) return "FAIR";
      if (k < 0.61) return "MODERATE";
      if (k < 0.81) return "SUBSTANTIAL";
      return "ALMOST_PERFECT";
    };
    const metrics: KappaMetrics = {
      observed,
      expected,
      kappa: Math.max(0, kappa),
      interpretation: getInterpretation(Math.max(0, kappa)),
      confidenceInterval: [Math.max(0, kappa - 0.1), Math.min(1, kappa + 0.1)],
    };

    setKappaMetrics(metrics);
    setIsCalculating(false);

    return metrics;
  }, []);

  const identifyDisagreements = useCallback((data: InterAnnotatorData[]) => {
    const disagreementCases = data
      .filter((d) => !d.agreed)
      .map(
        (annotation, index): DisagreementCase => ({
          id: `disagreement_${index}`,
          annotation,
          confusionType: `${annotation.expert1}_vs_${annotation.expert2}`,
          discussionNotes: [],
          resolution: "consensus",
          finalTag: annotation.expert1,
        })
      );

    setDisagreements(disagreementCases);
    return disagreementCases;
  }, []);

  return {
    annotations,
    setAnnotations,
    kappaMetrics,
    disagreements,
    isCalculating,
    calculateKappa,
    identifyDisagreements,
  };
};
