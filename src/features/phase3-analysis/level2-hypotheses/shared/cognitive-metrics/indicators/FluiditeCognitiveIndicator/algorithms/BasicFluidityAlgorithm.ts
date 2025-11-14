// src/app/(protected)/analysis/components/cognitive-metrics/indicators/FluiditeCognitiveIndicator/algorithms/BasicFluidityAlgorithm.ts

import { BaseAlgorithmStrategy } from "../@/features/phase3-analysis/shared/metrics-framework/core/strategies/BaseAlgorithmStrategy";
import {
  AlgorithmConfig,
  IndicatorResult,
  TurnTaggedData,
} from "../@/features/phase3-analysis/shared/metrics-framework/core/types/base";

// Types spécifiques à la fluidité cognitive
interface FluidityCognitiveResult extends IndicatorResult {
  value: number; // Score 0-1
  confidence: number; // Ajouté pour correspondre à IndicatorResult
  details: {
    temporal_score: number;
    linguistic_score: number;
    prosodic_score: number;
    effort_markers_detected: string[];
    processing_type: "automatique" | "contrôlé" | "mixte";
  };
}

/**
 * Algorithme de base pour la fluidité cognitive
 *
 * Basé sur l'analyse temporelle et linguistique avec des règles explicites
 * Formule: 0.4×Score_temporel + 0.35×Score_linguistique + 0.25×Score_prosodique
 */
export class BasicFluidityAlgorithm extends BaseAlgorithmStrategy {
  constructor() {
    super({
      id: "basic_fluidity",
      name: "Algorithme Fluidité Basique",
      type: "rule_based",
      version: "1.0.0",
      description:
        "Analyse temporelle et linguistique basée sur des règles explicites",
      requiresTraining: false,
      supportedDomains: ["cognitive"],
    });
  }

  async calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]> {
    // Validation des données d'entrée
    this.validateInput(data);

    // Préprocessing
    const preprocessedData = this.preprocessData(data);

    const results: FluidityCognitiveResult[] = [];

    for (let i = 0; i < preprocessedData.length; i++) {
      const turn = preprocessedData[i];
      const previousTurn = i > 0 ? preprocessedData[i - 1] : null;

      try {
        const { result, executionTime } = await this.measureExecutionTime(() =>
          this.calculateSingleTurn(turn, previousTurn, i)
        );

        // Ajouter le temps de traitement au résultat
        result.processing_time_ms = executionTime;
        results.push(result);
      } catch (error) {
        this.log("error", `Erreur calcul turn ${turn.id}`, error);
        results.push(this.createFluidityErrorResult(turn.id, error));
      }
    }

    return results;
  }

  private calculateSingleTurn(
    turn: TurnTaggedData,
    previousTurn: TurnTaggedData | null,
    index: number
  ): FluidityCognitiveResult {
    const verbatim = turn.verbatim || "";
    const nextTurnVerbatim = turn.next_turn_verbatim || "";

    // 1. Score temporel (basé sur durée et débit de parole)
    const temporalScore = this.calculateTemporalScore(turn, verbatim);

    // 2. Score linguistique (marqueurs d'hésitation)
    const linguisticScore = this.calculateLinguisticScore(verbatim);

    // 3. Score prosodique (structure des phrases)
    const prosodicScore = this.calculateProsodicScore(verbatim);

    // 4. Analyse de la réaction client
    const reactionBonus = this.analyzeClientReaction(nextTurnVerbatim);

    // Score global pondéré
    const globalScore = this.normalizeScore(
      0.4 * temporalScore +
        0.35 * linguisticScore +
        0.25 * prosodicScore +
        reactionBonus
    );

    // Détection des marqueurs d'effort
    const effortMarkers = this.detectEffortMarkers(verbatim, nextTurnVerbatim);

    // Détermination du type de traitement
    const processingType = this.determineProcessingType(
      globalScore,
      effortMarkers
    );

    // Calcul de la confiance
    const confidence = this.calculateFluidityConfidence(
      turn,
      verbatim,
      effortMarkers.length
    );

    return {
      value: globalScore,
      confidence: confidence,
      explanation: this.generateExplanation(
        globalScore,
        temporalScore,
        linguisticScore,
        prosodicScore,
        effortMarkers,
        processingType
      ),
      algorithm_used: this.getId(),
      details: {
        temporal_score: temporalScore,
        linguistic_score: linguisticScore,
        prosodic_score: prosodicScore,
        effort_markers_detected: effortMarkers,
        processing_type: processingType,
      },
    };
  }

  private calculateTemporalScore(
    turn: TurnTaggedData,
    verbatim: string
  ): number {
    const duration = turn.end_time - turn.start_time;
    const wordCount = verbatim.split(/\s+/).filter((w) => w.length > 0).length;
    const speechRate = wordCount / Math.max(duration, 0.1); // mots/seconde

    // Débit optimal pour la fluidité : 1.5-3.0 mots/seconde
    if (speechRate >= 1.5 && speechRate <= 3.0) {
      return 1.0; // Débit optimal
    } else if (speechRate >= 1.0 && speechRate < 4.0) {
      return 0.7; // Débit acceptable
    } else {
      return 0.4; // Débit problématique
    }
  }

  private calculateLinguisticScore(verbatim: string): number {
    const wordCount = verbatim.split(/\s+/).filter((w) => w.length > 0).length;

    // Marqueurs d'hésitation du conseiller
    const hesitationMarkers = [
      "euh",
      "eh",
      "hm",
      "alors",
      "ben",
      "donc",
      "en fait",
      "comment dire",
      "attendez",
    ];

    const hesitationCount = hesitationMarkers.reduce((count, marker) => {
      const regex = new RegExp(`\\b${marker}\\b`, "gi");
      return count + (verbatim.match(regex) || []).length;
    }, 0);

    // Score inversement proportionnel aux hésitations
    return Math.max(0, 1.0 - (hesitationCount / Math.max(wordCount, 1)) * 5);
  }

  private calculateProsodicScore(verbatim: string): number {
    // Approximation prosodique basée sur la structure des phrases
    const sentences = verbatim
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const avgSentenceLength =
      sentences.length > 0
        ? verbatim.length / sentences.length
        : verbatim.length;

    // Structure équilibrée = meilleure fluidité prosodique
    if (avgSentenceLength >= 20 && avgSentenceLength <= 100) {
      return 1.0; // Structure équilibrée
    } else if (avgSentenceLength >= 10 && avgSentenceLength <= 150) {
      return 0.7; // Structure acceptable
    } else {
      return 0.5; // Structure problématique
    }
  }

  private analyzeClientReaction(nextTurnVerbatim: string): number {
    const clientResponse = nextTurnVerbatim.toLowerCase();

    const positiveMarkers = [
      "oui",
      "d'accord",
      "très bien",
      "merci",
      "parfait",
      "exactement",
      "voilà",
      "tout à fait",
    ];

    const negativeMarkers = [
      "non",
      "mais",
      "je ne comprends pas",
      "comment",
      "pardon",
      "quoi",
      "répétez",
    ];

    const hasPositiveReaction = positiveMarkers.some((marker) =>
      clientResponse.includes(marker)
    );

    const hasNegativeReaction = negativeMarkers.some((marker) =>
      clientResponse.includes(marker)
    );

    if (hasPositiveReaction) return 0.1; // Bonus réaction positive
    if (hasNegativeReaction) return -0.1; // Malus réaction négative
    return 0; // Réaction neutre
  }

  private detectEffortMarkers(
    verbatim: string,
    nextTurnVerbatim: string
  ): string[] {
    const markers: string[] = [];

    // Marqueurs d'hésitation du conseiller
    const hesitationPatterns = [
      { pattern: /\b(euh|eh|hm)\b/gi, marker: "hésitations_vocales" },
      {
        pattern: /\b(alors|ben|donc|en fait)\b/gi,
        marker: "marqueurs_temporisation",
      },
      {
        pattern: /\b(comment dire|attendez)\b/gi,
        marker: "recherche_lexicale",
      },
    ];

    hesitationPatterns.forEach(({ pattern, marker }) => {
      const matches = verbatim.match(pattern);
      if (matches && matches.length > 0) {
        markers.push(`${marker}: ${matches.length}`);
      }
    });

    // Marqueurs de difficulté dans la réaction client
    const clientResponse = nextTurnVerbatim.toLowerCase();
    if (/\b(comment|pardon|quoi|répétez)\b/.test(clientResponse)) {
      markers.push("réaction_confusion_client");
    }

    return markers;
  }

  private determineProcessingType(
    globalScore: number,
    effortMarkers: string[]
  ): "automatique" | "contrôlé" | "mixte" {
    if (globalScore >= 0.8 && effortMarkers.length === 0) {
      return "automatique"; // Traitement fluide sans effort
    } else if (globalScore <= 0.4 || effortMarkers.length > 2) {
      return "contrôlé"; // Traitement laborieux avec effort
    } else {
      return "mixte"; // Traitement intermédiaire
    }
  }

  private calculateFluidityConfidence(
    turn: TurnTaggedData,
    verbatim: string,
    effortMarkersCount: number
  ): number {
    // Confiance de base
    let confidence = this.calculateBaseConfidence(turn);

    // Ajustements spécifiques à la fluidité cognitive
    const wordCount = verbatim.split(/\s+/).filter((w) => w.length > 0).length;
    const duration = turn.end_time - turn.start_time;

    // Bonus pour données riches
    if (wordCount >= 10 && duration > 1.0) {
      confidence += 0.1;
    }

    // Malus pour données pauvres ou marqueurs d'effort élevés
    if (effortMarkersCount > 3) {
      confidence -= 0.1;
    }

    if (wordCount < 3) {
      confidence -= 0.2;
    }

    return this.normalizeScore(confidence, 0.1, 0.95);
  }

  private generateExplanation(
    globalScore: number,
    temporalScore: number,
    linguisticScore: number,
    prosodicScore: number,
    effortMarkers: string[],
    processingType: string
  ): string {
    const scorePercent = (globalScore * 100).toFixed(1);
    const temporal = (temporalScore * 100).toFixed(0);
    const linguistic = (linguisticScore * 100).toFixed(0);
    const prosodic = (prosodicScore * 100).toFixed(0);

    let explanation = `Score: ${scorePercent}% (${processingType}) | `;
    explanation += `Temporel: ${temporal}% | Linguistique: ${linguistic}% | Prosodique: ${prosodic}%`;

    if (effortMarkers.length > 0) {
      explanation += ` | Effort détecté: ${effortMarkers.join(", ")}`;
    }

    // Ajout d'interprétation contextuelle
    if (globalScore >= 0.8) {
      explanation += " | Fluidité excellente - traitement automatique optimal";
    } else if (globalScore >= 0.6) {
      explanation += " | Fluidité correcte - traitement globalement fluide";
    } else if (globalScore >= 0.4) {
      explanation += " | Fluidité modérée - signes d'effort cognitif";
    } else {
      explanation += " | Fluidité faible - traitement laborieux détecté";
    }

    return explanation;
  }

  private createFluidityErrorResult(
    turnId: number,
    error: any
  ): FluidityCognitiveResult {
    const baseError = this.createErrorResult(
      error,
      0
    ) as FluidityCognitiveResult;

    return {
      ...baseError,
      confidence: 0,
      details: {
        temporal_score: 0,
        linguistic_score: 0,
        prosodic_score: 0,
        effort_markers_detected: ["erreur_calcul"],
        processing_type: "contrôlé",
      },
    };
  }

  /**
   * Méthodes utilitaires spécifiques à la fluidité cognitive
   */

  /**
   * Analyse la cohérence temporelle d'une séquence de tours
   */
  private analyzeTemporalConsistency(data: TurnTaggedData[]): {
    averagePace: number;
    paceVariability: number;
    hasTemporalDisruptions: boolean;
  } {
    if (data.length < 2) {
      return {
        averagePace: 0,
        paceVariability: 0,
        hasTemporalDisruptions: false,
      };
    }

    const paces = data.map((turn) => {
      const duration = turn.end_time - turn.start_time;
      const wordCount = (turn.verbatim || "")
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      return wordCount / Math.max(duration, 0.1);
    });

    const stats = this.calculateStats(paces);

    return {
      averagePace: stats.mean,
      paceVariability: stats.std / stats.mean, // Coefficient de variation
      hasTemporalDisruptions: stats.std / stats.mean > 0.5, // Variabilité > 50%
    };
  }

  /**
   * Calcule un score de complexité linguistique
   */
  private calculateLinguisticComplexity(verbatim: string): {
    lexicalDiversity: number;
    averageWordLength: number;
    sentenceComplexity: number;
  } {
    const words = verbatim.split(/\s+/).filter((w) => w.length > 0);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));

    // Diversité lexicale (TTR - Type-Token Ratio)
    const lexicalDiversity =
      words.length > 0 ? uniqueWords.size / words.length : 0;

    // Longueur moyenne des mots
    const averageWordLength =
      words.length > 0
        ? words.reduce((sum, word) => sum + word.length, 0) / words.length
        : 0;

    // Complexité des phrases (approximation)
    const sentences = verbatim
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const sentenceComplexity =
      sentences.length > 0
        ? sentences.reduce((sum, sentence) => {
            // Compter les connecteurs et subordonnées
            const connectors = (
              sentence.match(
                /\b(mais|car|donc|or|ni|et|que|qui|dont|où)\b/gi
              ) || []
            ).length;
            return sum + connectors;
          }, 0) / sentences.length
        : 0;

    return {
      lexicalDiversity,
      averageWordLength,
      sentenceComplexity,
    };
  }

  /**
   * Détecte les patterns de récupération après effort
   */
  private detectRecoveryPatterns(
    currentTurn: TurnTaggedData,
    previousTurns: TurnTaggedData[]
  ): {
    hasRecovery: boolean;
    recoverySpeed: "rapide" | "modérée" | "lente" | "aucune";
    recoveryIndicators: string[];
  } {
    if (previousTurns.length < 2) {
      return {
        hasRecovery: false,
        recoverySpeed: "aucune",
        recoveryIndicators: [],
      };
    }

    const indicators: string[] = [];

    // Analyser l'évolution de la fluidité sur les derniers tours
    const recentScores = previousTurns.slice(-3).map((turn) => {
      const tempScore = this.calculateTemporalScore(turn, turn.verbatim || "");
      const lingScore = this.calculateLinguisticScore(turn.verbatim || "");
      return (tempScore + lingScore) / 2;
    });

    const currentScore =
      (this.calculateTemporalScore(currentTurn, currentTurn.verbatim || "") +
        this.calculateLinguisticScore(currentTurn.verbatim || "")) /
      2;

    // Détection d'amélioration
    if (recentScores.length >= 2) {
      const improvement = currentScore - recentScores[recentScores.length - 1];

      if (improvement > 0.2) {
        indicators.push("amélioration_significative");
        return {
          hasRecovery: true,
          recoverySpeed: "rapide",
          recoveryIndicators: indicators,
        };
      } else if (improvement > 0.1) {
        indicators.push("amélioration_modérée");
        return {
          hasRecovery: true,
          recoverySpeed: "modérée",
          recoveryIndicators: indicators,
        };
      } else if (improvement > 0.05) {
        indicators.push("amélioration_légère");
        return {
          hasRecovery: true,
          recoverySpeed: "lente",
          recoveryIndicators: indicators,
        };
      }
    }

    return {
      hasRecovery: false,
      recoverySpeed: "aucune",
      recoveryIndicators: indicators,
    };
  }

  /**
   * Méthode publique pour obtenir des métriques détaillées
   */
  public getDetailedMetrics(data: TurnTaggedData[]): {
    globalFluidityScore: number;
    temporalConsistency: ReturnType<typeof this.analyzeTemporalConsistency>;
    linguisticComplexity: ReturnType<typeof this.calculateLinguisticComplexity>;
    effortDistribution: Record<string, number>;
    processingTypeDistribution: Record<string, number>;
  } {
    if (data.length === 0) {
      return {
        globalFluidityScore: 0,
        temporalConsistency: {
          averagePace: 0,
          paceVariability: 0,
          hasTemporalDisruptions: false,
        },
        linguisticComplexity: {
          lexicalDiversity: 0,
          averageWordLength: 0,
          sentenceComplexity: 0,
        },
        effortDistribution: {},
        processingTypeDistribution: {},
      };
    }

    // Calcul du score global de fluidité
    const allScores = data.map((turn) => {
      const temporal = this.calculateTemporalScore(turn, turn.verbatim || "");
      const linguistic = this.calculateLinguisticScore(turn.verbatim || "");
      const prosodic = this.calculateProsodicScore(turn.verbatim || "");
      return 0.4 * temporal + 0.35 * linguistic + 0.25 * prosodic;
    });

    const globalFluidityScore =
      allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

    // Analyse temporelle
    const temporalConsistency = this.analyzeTemporalConsistency(data);

    // Complexité linguistique moyenne
    const allComplexities = data.map((turn) =>
      this.calculateLinguisticComplexity(turn.verbatim || "")
    );

    const linguisticComplexity = {
      lexicalDiversity:
        allComplexities.reduce((sum, c) => sum + c.lexicalDiversity, 0) /
        allComplexities.length,
      averageWordLength:
        allComplexities.reduce((sum, c) => sum + c.averageWordLength, 0) /
        allComplexities.length,
      sentenceComplexity:
        allComplexities.reduce((sum, c) => sum + c.sentenceComplexity, 0) /
        allComplexities.length,
    };

    // Distribution des marqueurs d'effort
    const effortDistribution: Record<string, number> = {};
    const processingTypeDistribution: Record<string, number> = {
      automatique: 0,
      contrôlé: 0,
      mixte: 0,
    };

    // CORRECTION : Utiliser les fonctions flèches pour préserver le contexte 'this'
    data.forEach((turn, index) => {
      const effortMarkers = this.detectEffortMarkers(
        turn.verbatim || "",
        turn.next_turn_verbatim || ""
      );
      const processingType = this.determineProcessingType(
        allScores[index] || 0,
        effortMarkers
      );

      processingTypeDistribution[processingType]++;

      effortMarkers.forEach((marker) => {
        const cleanMarker = marker.split(":")[0]; // Enlever le comptage
        effortDistribution[cleanMarker] =
          (effortDistribution[cleanMarker] || 0) + 1;
      });
    });

    return {
      globalFluidityScore,
      temporalConsistency,
      linguisticComplexity,
      effortDistribution,
      processingTypeDistribution,
    };
  }
}

export default BasicFluidityAlgorithm;
