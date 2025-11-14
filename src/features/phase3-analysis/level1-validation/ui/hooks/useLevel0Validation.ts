// Hook Niveau 0 - useLevel0Validation.ts
import { useState, useCallback } from "react";
import {
  InterAnnotatorData,
  KappaMetrics,
  DisagreementCase,
} from "@/types/algorithm-lab";

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

    // ✅ CORRECTION - utiliser les bonnes propriétés de KappaMetrics
    const metrics: KappaMetrics = {
      kappa: Math.max(0, kappa),
      observedAgreement: observed,
      expectedAgreement: expected,
      interpretation: getInterpretation(Math.max(0, kappa)),
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
          // ✅ CORRECTION - créer l'objet annotation correct pour DisagreementCase
          annotation: {
            expert1: (annotation as any).expert1 || "unknown",
            expert2: (annotation as any).expert2 || "unknown",
          },
          confusionType: `${(annotation as any).expert1 || "unknown"}_vs_${
            (annotation as any).expert2 || "unknown"
          }`,
          finalTag: (annotation as any).expert1,
          // Ajouter d'autres propriétés optionnelles de DisagreementCase si nécessaire
          verbatim: annotation.verbatim,
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
