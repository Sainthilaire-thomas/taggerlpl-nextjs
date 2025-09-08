// algorithms/level1/M3Algorithms/PausesM3Calculator.ts
import type {
  M3Input,
  CalculationResult,
  CalculationMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type { M3Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

/**
 * Calculateur M3 "pauvres mais sûrs" :
 * - repère ellipses (.../…)
 * - repère tags (pause|silence|hésitation)
 * - repère hésitations (euh/heu/hum/uh/um/hein/bah)
 * - repère ruptures (--/—) et doubles espaces
 * Renvoie un score [0,1] ≈ charge cognitive liée aux pauses/hésitations.
 */
export class PausesM3Calculator {
  getMetadata(): CalculationMetadata {
    return {
      id: "m3-pauses-basic",
      // ✅ CORRECTION: Utiliser 'label' au lieu de 'name' (CalculationMetadata utilise 'label')
      label: "M3 Pauses (Heuristique)",
      // ✅ CORRECTION: Ajouter les propriétés requises par CalculationMetadata
      target: "M3",
      algorithmKind: "rule-based",
      version: "0.1.0",
      // ✅ CORRECTION: 'variable' n'existe pas dans CalculationMetadata, 'description' non plus
      tags: ["pauses", "hesitations", "cognitive-load"],
    };
  }

  async calculate(input: M3Input): Promise<CalculationResult<M3Details>> {
    const start = performance.now();

    // ✅ CORRECTION: M3Input utilise 'segment' au lieu de 'clientTurn'
    const textRaw = input.segment ?? "";
    const text = textRaw.toLowerCase();

    // Comptages simples
    const ellipses = (text.match(/…|\.{3}/g) || []).length;
    const pauseTags = (
      text.match(/\((?:pause|silence|h[ée]sitation|respire|souffle)\)/g) || []
    ).length;
    const hesitations = (
      text.match(/\b(euh+|heu+|hum+|uh+|um+|hein|bah)\b/gi) || []
    ).length;
    const dashBreaks = (text.match(/--|—/g) || []).length;
    const doubleSpaces = (text.match(/ {2,}/g) || []).length;

    const tokens = (text.match(/\S+/g) || []).length;

    // Pondération très simple (à ajuster plus tard)
    const raw =
      ellipses * 0.5 +
      pauseTags * 1.0 +
      hesitations * 0.4 +
      dashBreaks * 0.5 +
      doubleSpaces * 0.25;

    // Normalisation grossière par la taille (≈ 1 marqueur/20 tokens → score ≈ 1)
    const denom = Math.max(1, tokens * 0.05); // 0.05 = 1/20
    const score = Math.min(1, raw / denom);

    const processingTime = performance.now() - start;

    // ✅ CORRECTION: Enrichir M3Details avec les propriétés définies dans votre système
    const details: M3Details = {
      // Propriétés de base
      value: score,
      unit: "s",

      // Propriétés enrichies existantes
      fluidity: 1 - score, // Plus de pauses = moins de fluidité
      cognitiveLoad: score,
      processingEfficiency: 1 - score,

      // Nouvelles propriétés ajoutées dans variables.ts
      pauseCount: ellipses + pauseTags + dashBreaks,
      hesitationCount: hesitations,
      speechRate: tokens / Math.max(1, ellipses + pauseTags + hesitations + 1), // approximation

      // Marqueurs détaillés
      markers: [
        {
          type: "ellipses",
          timestamp: 0,
          confidence: ellipses > 0 ? 0.9 : 0,
          value: ellipses,
        },
        {
          type: "pauseTags",
          timestamp: 0,
          confidence: pauseTags > 0 ? 0.95 : 0,
          value: pauseTags,
        },
        {
          type: "hesitations",
          timestamp: 0,
          confidence: hesitations > 0 ? 0.8 : 0,
          value: hesitations,
        },
      ].filter((m) => m.confidence > 0), // Garder seulement les marqueurs détectés
    };

    // ✅ CORRECTION: Retourner CalculationResult complet avec toutes les propriétés requises
    return {
      prediction:
        score > 0.7
          ? "HIGH_COGNITIVE_LOAD"
          : score > 0.3
          ? "MEDIUM_COGNITIVE_LOAD"
          : "LOW_COGNITIVE_LOAD",
      confidence: Math.min(0.95, 0.5 + score * 0.4), // Confiance basée sur le score
      processingTime,
      details,
      metadata: {
        algorithmVersion: "0.1.0",
        inputSignature: textRaw.slice(0, 20),
        executionPath: ["tokenize", "count_markers", "normalize"],
        warnings: tokens === 0 ? ["Input vide"] : undefined,
        extra: {
          counts: {
            ellipses,
            pauseTags,
            hesitations,
            dashBreaks,
            doubleSpaces,
            tokens,
          },
          weights: {
            ellipses: 0.5,
            pauseTags: 1.0,
            hesitations: 0.4,
            dashBreaks: 0.5,
            doubleSpaces: 0.25,
          },
          raw,
          normDenominator: denom,
        },
      },
    };
  }

  async batchCalculate(
    inputs: M3Input[]
  ): Promise<Array<CalculationResult<M3Details>>> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}

export default PausesM3Calculator;
