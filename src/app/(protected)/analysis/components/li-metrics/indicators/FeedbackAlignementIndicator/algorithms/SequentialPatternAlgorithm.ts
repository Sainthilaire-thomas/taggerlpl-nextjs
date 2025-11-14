// ==========================================
// 📁 FeedbackAlignmentIndicator/algorithms/SequentialPatternAlgorithm.ts
// ==========================================

import { SentimentEnhancedAlgorithm } from "./SentimentEnhancedAlgorithm";
import { FeedbackAlignmentResult, TurnTaggedData } from "../types";

export class SequentialPatternAlgorithm extends SentimentEnhancedAlgorithm {
  // Patterns de résistance séquentielle
  private resistancePatterns = [
    "oui mais",
    "certes mais",
    "certes cependant",
    "d'accord mais",
    "je comprends mais",
    "ok mais",
    "bien mais",
  ];

  // Patterns de coopération progressive
  private cooperationPatterns = [
    "ah ok",
    "je vois",
    "ah d'accord",
    "ah très bien",
    "ok merci",
    "très bien merci",
  ];

  analyze(conseiller_turn: TurnTaggedData): FeedbackAlignmentResult {
    const baseResult = super.analyze(conseiller_turn);

    // Analyse des patterns séquentiels
    const sequential_patterns = this.detectSequentialPatterns(
      conseiller_turn.next_turn_verbatim
    );

    // Ajustement selon les patterns
    const adjustedResult = this.adjustResultWithPatterns(
      baseResult,
      sequential_patterns
    );

    return {
      ...adjustedResult,
      features_used: {
        ...adjustedResult.features_used,
        sequential_patterns,
      },
    };
  }

  private detectSequentialPatterns(verbatim: string) {
    const cleanVerbatim = verbatim.toLowerCase();

    const patterns = {
      resistance_detected: false,
      cooperation_detected: false,
      detected_patterns: [] as string[],
    };

    // Détection patterns de résistance
    this.resistancePatterns.forEach((pattern) => {
      if (cleanVerbatim.includes(pattern)) {
        patterns.resistance_detected = true;
        patterns.detected_patterns.push(`resistance: ${pattern}`);
      }
    });

    // Détection patterns de coopération
    this.cooperationPatterns.forEach((pattern) => {
      if (cleanVerbatim.includes(pattern)) {
        patterns.cooperation_detected = true;
        patterns.detected_patterns.push(`cooperation: ${pattern}`);
      }
    });

    return patterns;
  }

  private adjustResultWithPatterns(
    baseResult: FeedbackAlignmentResult,
    patterns: any
  ): FeedbackAlignmentResult {
    // Pattern de résistance détecté
    if (patterns.resistance_detected) {
      return {
        ...baseResult,
        value: "DESALIGNEMENT",
        explanation: `${
          baseResult.explanation
        } (pattern de résistance: ${patterns.detected_patterns.join(", ")})`,
      };
    }

    // Pattern de coopération détecté
    if (patterns.cooperation_detected && baseResult.value !== "DESALIGNEMENT") {
      const improved_value =
        baseResult.value === "ALIGNEMENT_FAIBLE"
          ? "ALIGNEMENT_FORT"
          : baseResult.value;
      return {
        ...baseResult,
        value: improved_value,
        explanation: `${
          baseResult.explanation
        } (pattern coopératif: ${patterns.detected_patterns.join(", ")})`,
      };
    }

    return baseResult;
  }
}
