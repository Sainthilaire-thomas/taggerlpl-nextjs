// ==========================================
// 📁 FeedbackAlignmentIndicator/algorithms/SentimentEnhancedAlgorithm.ts
// ==========================================

import { BasicAlignmentAlgorithm } from "./BasicAlignmentAlgorithm";
import { FeedbackAlignmentResult, TurnTaggedData } from "../types";

export class SentimentEnhancedAlgorithm extends BasicAlignmentAlgorithm {
  private sentimentWords = {
    positive: [
      "content",
      "satisfait",
      "heureux",
      "ravi",
      "enchanté",
      "parfait",
      "excellent",
      "formidable",
      "génial",
    ],
    negative: [
      "énervé",
      "agacé",
      "furieux",
      "mécontent",
      "déçu",
      "frustré",
      "indigné",
      "scandalisé",
      "révolté",
    ],
  };

  analyze(conseiller_turn: TurnTaggedData): FeedbackAlignmentResult {
    // Appel de l'algorithme de base
    const baseResult = super.analyze(conseiller_turn);

    // Enrichissement avec analyse de sentiment
    const sentiment_score = this.analyzeSentiment(
      conseiller_turn.next_turn_verbatim
    );

    // Ajustement du résultat selon le sentiment
    const adjustedResult = this.adjustResultWithSentiment(
      baseResult,
      sentiment_score
    );

    return {
      ...adjustedResult,
      details: {
        ...adjustedResult.details,
        sentiment_score,
      },
    };
  }

  private analyzeSentiment(verbatim: string): number {
    const cleanVerbatim = verbatim.toLowerCase();
    let sentimentScore = 0;

    // Comptage mots positifs (+1 chacun)
    this.sentimentWords.positive.forEach((word) => {
      if (cleanVerbatim.includes(word)) {
        sentimentScore += 1;
      }
    });

    // Comptage mots négatifs (-1 chacun)
    this.sentimentWords.negative.forEach((word) => {
      if (cleanVerbatim.includes(word)) {
        sentimentScore -= 1;
      }
    });

    // Normalisation entre -1 et 1
    return Math.max(-1, Math.min(1, sentimentScore / 3));
  }

  private adjustResultWithSentiment(
    baseResult: FeedbackAlignmentResult,
    sentiment_score: number
  ): FeedbackAlignmentResult {
    // Si sentiment très négatif, force le désalignement
    if (sentiment_score < -0.5 && baseResult.value !== "DESALIGNEMENT") {
      return {
        ...baseResult,
        value: "DESALIGNEMENT",
        explanation: `${
          baseResult.explanation
        } (ajusté par sentiment négatif: ${sentiment_score.toFixed(2)})`,
      };
    }

    // Si sentiment très positif, améliore l'alignement
    if (sentiment_score > 0.5 && baseResult.value === "ALIGNEMENT_FAIBLE") {
      return {
        ...baseResult,
        value: "ALIGNEMENT_FORT",
        explanation: `${
          baseResult.explanation
        } (renforcé par sentiment positif: ${sentiment_score.toFixed(2)})`,
      };
    }

    return baseResult;
  }
}
