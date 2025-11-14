// src/app/(protected)/analysis/components/cognitive-metrics/indicators/FluiditeCognitiveIndicator/algorithms/NeuronMirrorAlgorithm.ts

import { BaseAlgorithmStrategy } from "@/features/phase3-analysis/shared/metrics-framework/core/BaseIndicator";
import {
  AlgorithmConfig,
  IndicatorResult,
  TurnTaggedData,
} from "@/features/phase3-analysis/shared/metrics-framework/core/types/base";

// Types spécifiques à l'algorithme neurones miroirs
interface FluidityCognitiveResult extends IndicatorResult {
  value: number; // Score 0-1
  details: {
    temporal_score: number; // Synchronisation temporelle
    linguistic_score: number; // Empathie automatique
    prosodic_score: number; // Inverse effort mentalisation
    effort_markers_detected: string[];
    processing_type: "automatique" | "contrôlé" | "mixte";
    mirror_metrics: {
      empathy_score: number;
      synchronization_score: number;
      mentalization_effort: number;
      reactivity_bonus: number;
    };
  };
}

/**
 * Algorithme avancé basé sur la théorie des neurones miroirs
 *
 * Référence: Gallese, V. (2007). Neurones miroirs et simulation incarnée
 * Analyse l'empathie automatique et la synchronisation conversationnelle
 */
export class NeuronMirrorAlgorithm extends BaseAlgorithmStrategy {
  constructor() {
    super({
      id: "neuron_mirror",
      name: "Neurones Miroirs Avancé",
      type: "nlp_enhanced",
      version: "1.0.0",
      description:
        "Analyse basée sur la théorie des neurones miroirs avec empathie automatique et synchronisation conversationnelle",
      requiresTraining: false,
      supportedDomains: ["cognitive"],
    });
  }

  async calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]> {
    const results: FluidityCognitiveResult[] = [];

    for (let i = 0; i < data.length; i++) {
      const turn = data[i];
      const previousTurn = i > 0 ? data[i - 1] : null;

      try {
        const result = this.calculateMirrorNeuronActivation(
          turn,
          previousTurn,
          i
        );
        results.push(result);
      } catch (error) {
        console.error(`Erreur calcul neurones miroirs turn ${turn.id}:`, error);
        results.push(this.createErrorResult(turn.id, error));
      }
    }

    return results;
  }

  private calculateMirrorNeuronActivation(
    turn: TurnTaggedData,
    previousTurn: TurnTaggedData | null,
    index: number
  ): FluidityCognitiveResult {
    const verbatim = turn.verbatim || "";
    const nextTurnVerbatim = turn.next_turn_verbatim || "";

    // 1. Score d'empathie automatique (marqueurs d'empathie du conseiller)
    const empathyScore = this.calculateAutomaticEmpathy(verbatim);

    // 2. Score de synchronisation conversationnelle
    const synchronizationScore = this.calculateConversationalSync(
      turn,
      previousTurn
    );

    // 3. Effort de mentalisation (traitement contrôlé vs automatique)
    const mentalizationEffort = this.calculateMentalizationEffort(verbatim);

    // 4. Analyse de la réactivité client (indicateur activation neurones miroirs)
    const reactivityBonus = this.analyzeClientReactivity(nextTurnVerbatim);

    // Score global neurones miroirs
    const globalScore = Math.min(
      1.0,
      Math.max(
        0.0,
        (empathyScore + synchronizationScore) * (1 - mentalizationEffort) +
          reactivityBonus
      )
    );

    // Détection des marqueurs spécifiques aux neurones miroirs
    const effortMarkers = this.detectMirrorNeuronMarkers(
      verbatim,
      nextTurnVerbatim,
      empathyScore,
      synchronizationScore,
      mentalizationEffort
    );

    // Détermination du type de traitement
    const processingType = this.determineMirrorProcessingType(
      globalScore,
      mentalizationEffort
    );

    return {
      value: globalScore,
      confidence: 0.9, // Confiance élevée pour algorithme avancé
      explanation: this.generateMirrorExplanation(
        globalScore,
        empathyScore,
        synchronizationScore,
        mentalizationEffort,
        reactivityBonus,
        processingType
      ),
      algorithm_used: this.getId(),
      details: {
        temporal_score: synchronizationScore,
        linguistic_score: empathyScore,
        prosodic_score: 1 - mentalizationEffort,
        effort_markers_detected: effortMarkers,
        processing_type: processingType,
        mirror_metrics: {
          empathy_score: empathyScore,
          synchronization_score: synchronizationScore,
          mentalization_effort: mentalizationEffort,
          reactivity_bonus: reactivityBonus,
        },
      },
    };
  }

  private calculateAutomaticEmpathy(verbatim: string): number {
    const empathyMarkers = [
      // Marqueurs d'empathie directe
      "je comprends",
      "je vois",
      "effectivement",
      "tout à fait",
      "c'est vrai",
      "bien sûr",
      "exactement",
      "absolument",
      "je vous suis",
      "j'entends bien",

      // Marqueurs de validation empathique
      "je vous entends",
      "c'est important pour vous",
      "je le ressens",
      "ça doit être difficile",
      "je peux imaginer",
      "c'est compréhensible",

      // Marqueurs de synchronisation émotionnelle
      "voilà",
      "c'est ça",
      "tout à fait",
      "on est d'accord",
    ];

    const empathyCount = empathyMarkers.reduce((count, marker) => {
      return count + (verbatim.toLowerCase().includes(marker) ? 1 : 0);
    }, 0);

    // Normalisation : 2+ marqueurs = empathie forte
    return Math.min(1.0, empathyCount / 2);
  }

  private calculateConversationalSync(
    turn: TurnTaggedData,
    previousTurn: TurnTaggedData | null
  ): number {
    if (!previousTurn) {
      return 0.5; // Score neutre si pas de tour précédent
    }

    // 1. Temps de réponse (latence optimale pour neurones miroirs: 200-800ms)
    const responseTime = turn.start_time - previousTurn.end_time;
    let timeScore = 0;

    if (responseTime >= 0.2 && responseTime <= 0.8) {
      timeScore = 1.0; // Temps optimal pour activation neurones miroirs
    } else if (responseTime >= 0.1 && responseTime <= 2.0) {
      // Score dégressif pour temps sub-optimal
      timeScore = Math.max(0, 1.0 - Math.abs(responseTime - 0.5) / 1.5);
    } else {
      timeScore = 0.2; // Temps très problématique
    }

    // 2. Synchronisation lexicale (reprises de mots du client)
    const currentWords = new Set(
      turn.verbatim
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
    const previousClientWords = new Set(
      (previousTurn.next_turn_verbatim || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

    const commonWords = new Set(
      [...currentWords].filter((w) => previousClientWords.has(w))
    );

    const lexicalSync =
      currentWords.size > 0 ? commonWords.size / currentWords.size : 0;

    // 3. Synchronisation prosodique (approximée par longueur similaire)
    const currentLength = turn.verbatim.length;
    const previousLength = previousTurn.next_turn_verbatim?.length || 0;

    const lengthRatio =
      previousLength > 0
        ? Math.min(currentLength, previousLength) /
          Math.max(currentLength, previousLength)
        : 0.5;

    const prosodicSync = lengthRatio;

    // Score composite de synchronisation
    return timeScore * 0.5 + lexicalSync * 0.3 + prosodicSync * 0.2;
  }

  private calculateMentalizationEffort(verbatim: string): number {
    // Marqueurs d'effort de mentalisation (traitement contrôlé)
    const mentalizationMarkers = [
      // Tentatives d'explication de l'état mental
      "qu'est-ce que vous voulez dire",
      "si je comprends bien",
      "vous pensez que",
      "dans votre situation",
      "de votre point de vue",
      "j'imagine que",

      // Incertitude cognitive
      "probablement",
      "peut-être",
      "il me semble que",
      "je suppose que",
      "si j'ai bien compris",
      "est-ce que vous voulez dire",

      // Effort d'interprétation
      "donc vous me dites que",
      "si je vous suis bien",
      "autrement dit",
      "pour résumer votre situation",
      "ce que je retiens",
    ];

    const mentalizationCount = mentalizationMarkers.reduce((count, marker) => {
      return count + (verbatim.toLowerCase().includes(marker) ? 1 : 0);
    }, 0);

    // Normalisation : 3+ marqueurs = effort élevé
    return Math.min(1.0, mentalizationCount / 3);
  }

  private analyzeClientReactivity(nextTurnVerbatim: string): number {
    const clientResponse = nextTurnVerbatim.toLowerCase();

    // Marqueurs de réactivité immédiate (bon fonctionnement neurones miroirs)
    const immediateMarkers = [
      "oui",
      "d'accord",
      "tout à fait",
      "exactement",
      "voilà",
      "c'est ça",
      "merci",
      "parfait",
      "très bien",
    ];

    // Marqueurs de confusion (échec empathie automatique)
    const confusionMarkers = [
      "comment",
      "pardon",
      "je ne suis pas",
      "qu'est-ce que",
      "je ne comprends pas",
      "répétez",
      "quoi",
    ];

    // Marqueurs de résistance (désynchronisation)
    const resistanceMarkers = [
      "mais non",
      "ce n'est pas ça",
      "vous ne comprenez pas",
      "n'importe quoi",
      "c'est faux",
    ];

    if (immediateMarkers.some((marker) => clientResponse.includes(marker))) {
      return 0.2; // Bonus fort pour réaction immédiate positive
    } else if (
      confusionMarkers.some((marker) => clientResponse.includes(marker))
    ) {
      return -0.15; // Malus pour confusion
    } else if (
      resistanceMarkers.some((marker) => clientResponse.includes(marker))
    ) {
      return -0.25; // Malus fort pour résistance
    }

    return 0; // Réaction neutre
  }

  private detectMirrorNeuronMarkers(
    verbatim: string,
    nextTurnVerbatim: string,
    empathyScore: number,
    synchronizationScore: number,
    mentalizationEffort: number
  ): string[] {
    const markers: string[] = [];

    if (empathyScore > 0.5)
      markers.push(`empathie_forte: ${(empathyScore * 100).toFixed(0)}%`);
    if (synchronizationScore > 0.7)
      markers.push(
        `synchronisation_excellente: ${(synchronizationScore * 100).toFixed(
          0
        )}%`
      );
    if (mentalizationEffort > 0.3)
      markers.push(
        `effort_mentalisation: ${(mentalizationEffort * 100).toFixed(0)}%`
      );

    // Détection patterns spéciaux
    if (verbatim.toLowerCase().includes("je ressens")) {
      markers.push("empathie_somatique");
    }

    if (/\b(moi aussi|pareil|même chose)\b/i.test(verbatim)) {
      markers.push("identification_directe");
    }

    if (nextTurnVerbatim.toLowerCase().includes("merci de me comprendre")) {
      markers.push("validation_empathique_client");
    }

    return markers;
  }

  private determineMirrorProcessingType(
    globalScore: number,
    mentalizationEffort: number
  ): "automatique" | "contrôlé" | "mixte" {
    if (globalScore >= 0.8 && mentalizationEffort < 0.2) {
      return "automatique"; // Neurones miroirs pleinement actifs
    } else if (globalScore <= 0.4 || mentalizationEffort > 0.5) {
      return "contrôlé"; // Mentalisation explicite dominante
    } else {
      return "mixte"; // Combinaison automatique/contrôlé
    }
  }

  private generateMirrorExplanation(
    globalScore: number,
    empathyScore: number,
    synchronizationScore: number,
    mentalizationEffort: number,
    reactivityBonus: number,
    processingType: string
  ): string {
    const scorePercent = (globalScore * 100).toFixed(1);
    const empathy = (empathyScore * 100).toFixed(0);
    const sync = (synchronizationScore * 100).toFixed(0);
    const effort = (mentalizationEffort * 100).toFixed(0);

    let explanation = `Neurones Miroirs: ${scorePercent}% (${processingType}) | `;
    explanation += `Empathie: ${empathy}% | Sync: ${sync}% | Effort: ${effort}%`;

    if (reactivityBonus !== 0) {
      const bonus = reactivityBonus > 0 ? "+" : "";
      explanation += ` | Réactivité: ${bonus}${(reactivityBonus * 100).toFixed(
        0
      )}%`;
    }

    return explanation;
  }

  private createErrorResult(
    turnId: number,
    error: any
  ): FluidityCognitiveResult {
    return {
      value: 0,
      confidence: 0,
      explanation: `Erreur neurones miroirs: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      algorithm_used: this.getId(),
      details: {
        temporal_score: 0,
        linguistic_score: 0,
        prosodic_score: 0,
        effort_markers_detected: ["erreur_calcul"],
        processing_type: "contrôlé",
        mirror_metrics: {
          empathy_score: 0,
          synchronization_score: 0,
          mentalization_effort: 1,
          reactivity_bonus: 0,
        },
      },
    };
  }
}

export default NeuronMirrorAlgorithm;
