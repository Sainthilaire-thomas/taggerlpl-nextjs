// src/app/(protected)/analysis/components/cognitive-metrics/indicators/FluiditeCognitiveIndicator.ts

import BaseIndicator, {
  BaseAlgorithmStrategy,
} from "../../metrics-framework/core/BaseIndicator";
import {
  BaseIndicatorConfig,
  AlgorithmConfig,
  IndicatorResult,
  TurnTaggedData,
  DataRequirement,
} from "../../metrics-framework/core/types/base";

// ================ CONFIGURATION DE L'INDICATEUR ================

const FLUIDITE_COGNITIVE_CONFIG: BaseIndicatorConfig = {
  id: "fluidite_cognitive",
  name: "Fluidité Cognitive",
  domain: "cognitive",
  category: "Automatisme Neural",
  implementationStatus: "implemented",
  description:
    "Mesure l'automatisme du traitement conversationnel basé sur les neurones miroirs",
  theoreticalFoundation:
    "Gallese (2007) - Neurones miroirs et empathie automatique",
  dataRequirements: [
    {
      table: "turntagged",
      columns: [
        "verbatim",
        "next_turn_verbatim",
        "start_time",
        "end_time",
        "speaker",
      ],
      optional: false,
    },
  ],
};

// ================ RÉSULTAT SPÉCIALISÉ ================

interface FluiditeCognitiveResult extends IndicatorResult {
  value: number; // Score 0-1
  details: {
    temporal_score: number;
    linguistic_score: number;
    prosodic_score: number;
    effort_markers_detected: string[];
    processing_type: "automatique" | "contrôlé" | "mixte";
  };
}

// ================ ALGORITHME DE BASE (MIGRÉ) ================

class BasicFluidityAlgorithm extends BaseAlgorithmStrategy {
  constructor() {
    super({
      id: "basic_fluidity",
      name: "Algorithme Fluidité Basique",
      type: "rule_based",
      version: "1.0.0",
      description:
        "Algorithme basé sur règles temporelles et linguistiques (migré)",
      requiresTraining: false,
      supportedDomains: ["cognitive"],
    });
  }

  async calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]> {
    return data.map((turn, index) => {
      // Calcul du score temporel
      const temporal_score = this.calculateTemporalFluidity(turn);

      // Calcul du score linguistique
      const linguistic_score = this.calculateLinguisticFluidity(turn);

      // Calcul du score prosodique (simplifié)
      const prosodic_score = this.calculateProsodicFluidity(turn);

      // Détection des marqueurs d'effort
      const effort_markers = this.detectEffortMarkers(turn);

      // Score global pondéré
      const globalScore =
        temporal_score * 0.4 + linguistic_score * 0.4 + prosodic_score * 0.2;

      // Détermination du type de traitement
      const processing_type = this.determineProcessingType(
        globalScore,
        effort_markers
      );

      return {
        value: Math.round(globalScore * 100) / 100, // Arrondi à 2 décimales
        confidence: this.calculateConfidence(turn),
        explanation: this.generateExplanation(
          globalScore,
          effort_markers,
          processing_type
        ),
        algorithm_used: this.getId(),
        details: {
          temporal_score,
          linguistic_score,
          prosodic_score,
          effort_markers_detected: effort_markers,
          processing_type,
        },
      } as FluiditeCognitiveResult;
    });
  }

  private calculateTemporalFluidity(turn: TurnTaggedData): number {
    // Calcul basé sur la durée du tour et les pauses
    const duration = turn.end_time - turn.start_time;
    const wordCount = turn.verbatim.split(/\s+/).length;

    if (wordCount === 0) return 0;

    // Débit de parole (mots par seconde)
    const speechRate = wordCount / duration;

    // Score normalisé (débit optimal autour de 2-3 mots/seconde)
    const optimalRate = 2.5;
    const deviation = Math.abs(speechRate - optimalRate) / optimalRate;

    return Math.max(0, 1 - deviation);
  }

  private calculateLinguisticFluidity(turn: TurnTaggedData): number {
    const verbatim = turn.verbatim.toLowerCase();

    // Détection des hésitations et réparations
    const hesitationMarkers = ["euh", "eh", "hm", "alors", "ben", "donc"];
    const hesitationCount = hesitationMarkers.reduce(
      (count, marker) =>
        count + (verbatim.match(new RegExp(marker, "g")) || []).length,
      0
    );

    // Détection des répétitions
    const words = verbatim.split(/\s+/);
    const repetitions = this.countRepetitions(words);

    // Score basé sur la fluidité linguistique
    const wordCount = words.length;
    const penaltyFactor = Math.min(
      1,
      (hesitationCount + repetitions) / wordCount
    );

    return Math.max(0, 1 - penaltyFactor);
  }

  private calculateProsodicFluidity(turn: TurnTaggedData): number {
    // Approximation basée sur la ponctuation (proxy pour la prosodie)
    const verbatim = turn.verbatim;

    // Comptage des marques de ponctuation forte (interruptions)
    const strongPunctuation = (verbatim.match(/[.!?]/g) || []).length;
    const weakPunctuation = (verbatim.match(/[,;:]/g) || []).length;

    const wordCount = verbatim.split(/\s+/).length;
    if (wordCount === 0) return 1;

    // Score basé sur la régularité prosodique
    const punctuationDensity =
      (strongPunctuation + weakPunctuation * 0.5) / wordCount;

    // Densité optimale autour de 0.1-0.2
    const optimalDensity = 0.15;
    const deviation =
      Math.abs(punctuationDensity - optimalDensity) / optimalDensity;

    return Math.max(0, 1 - deviation);
  }

  private detectEffortMarkers(turn: TurnTaggedData): string[] {
    const verbatim = turn.verbatim.toLowerCase();
    const markers: string[] = [];

    // Marqueurs d'effort cognitif
    const effortPatterns = [
      { pattern: /euh+/g, marker: "hésitation" },
      { pattern: /comment\s+(dire|on\s+dit)/g, marker: "recherche_lexicale" },
      { pattern: /je\s+(pense|crois|suppose)/g, marker: "incertitude" },
      { pattern: /attendez|attends/g, marker: "pause_reflexion" },
      { pattern: /\b(\w+)\s+\1\b/g, marker: "répétition" },
    ];

    effortPatterns.forEach(({ pattern, marker }) => {
      if (pattern.test(verbatim)) {
        markers.push(marker);
      }
    });

    return markers;
  }

  private countRepetitions(words: string[]): number {
    const wordCounts = new Map<string, number>();
    let repetitions = 0;

    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();
      if (cleanWord.length > 2) {
        // Ignorer les mots très courts
        const count = wordCounts.get(cleanWord) || 0;
        wordCounts.set(cleanWord, count + 1);
        if (count > 0) {
          repetitions++;
        }
      }
    });

    return repetitions;
  }

  private determineProcessingType(
    score: number,
    effortMarkers: string[]
  ): "automatique" | "contrôlé" | "mixte" {
    if (score > 0.8 && effortMarkers.length === 0) {
      return "automatique";
    } else if (score < 0.4 || effortMarkers.length > 2) {
      return "contrôlé";
    } else {
      return "mixte";
    }
  }

  private calculateConfidence(turn: TurnTaggedData): number {
    // Confiance basée sur la longueur du verbatim et la qualité des données
    const wordCount = turn.verbatim.split(/\s+/).length;

    if (wordCount < 3) return 0.3;
    if (wordCount < 10) return 0.7;
    return 0.9;
  }

  private generateExplanation(
    score: number,
    effortMarkers: string[],
    processingType: string
  ): string {
    let explanation = `Score de fluidité: ${(score * 100).toFixed(0)}% `;

    if (processingType === "automatique") {
      explanation += "(Traitement automatique - neurones miroirs activés)";
    } else if (processingType === "contrôlé") {
      explanation += "(Traitement contrôlé - effort cognitif détecté)";
    } else {
      explanation += "(Traitement mixte - alternance automatique/contrôlé)";
    }

    if (effortMarkers.length > 0) {
      explanation += ` | Marqueurs: ${effortMarkers.join(", ")}`;
    }

    return explanation;
  }
}

// ================ ALGORITHME NLP AVANCÉ ================

class NeuronMirrorAlgorithm extends BaseAlgorithmStrategy {
  constructor() {
    super({
      id: "neuron_mirror",
      name: "Neurones Miroirs Avancé",
      type: "nlp_enhanced",
      version: "1.0.0",
      description:
        "Algorithme basé sur la théorie des neurones miroirs avec analyse sémantique",
      requiresTraining: false,
      supportedDomains: ["cognitive"],
    });
  }

  async calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]> {
    return data.map((turn, index) => {
      // Analyse de l'empathie automatique
      const empathy_score = this.calculateEmpathyScore(turn);

      // Analyse de la synchronisation conversationnelle
      const sync_score = this.calculateSynchronizationScore(
        turn,
        data[index - 1]
      );

      // Analyse de l'effort de mentalisation
      const mentalization_effort = this.calculateMentalizationEffort(turn);

      // Score global neurones miroirs
      const mirrorScore =
        (empathy_score + sync_score) * (1 - mentalization_effort);

      return {
        value: Math.round(mirrorScore * 100) / 100,
        confidence: 0.85, // Confiance élevée pour algorithme avancé
        explanation: `Neurones miroirs: Empathie ${(
          empathy_score * 100
        ).toFixed(0)}%, Sync ${(sync_score * 100).toFixed(0)}%, Effort ${(
          mentalization_effort * 100
        ).toFixed(0)}%`,
        algorithm_used: this.getId(),
        details: {
          temporal_score: sync_score,
          linguistic_score: empathy_score,
          prosodic_score: 1 - mentalization_effort,
          effort_markers_detected:
            mentalization_effort > 0.5 ? ["mentalisation_explicite"] : [],
          processing_type: mirrorScore > 0.7 ? "automatique" : "contrôlé",
        },
      } as FluiditeCognitiveResult;
    });
  }

  private calculateEmpathyScore(turn: TurnTaggedData): number {
    const verbatim = turn.verbatim.toLowerCase();

    // Marqueurs d'empathie automatique
    const empathyMarkers = [
      "je comprends",
      "je vois",
      "effectivement",
      "tout à fait",
      "c'est vrai",
      "bien sûr",
      "exactement",
      "absolument",
    ];

    const empathyCount = empathyMarkers.reduce(
      (count, marker) => count + (verbatim.includes(marker) ? 1 : 0),
      0
    );

    // Normalisation par la longueur
    const wordCount = verbatim.split(/\s+/).length;
    return Math.min(1, empathyCount / Math.max(1, wordCount / 10));
  }

  private calculateSynchronizationScore(
    currentTurn: TurnTaggedData,
    previousTurn?: TurnTaggedData
  ): number {
    if (!previousTurn) return 0.5; // Score neutre si pas de tour précédent

    // Analyse de la latence de réponse
    const responseTime = currentTurn.start_time - previousTurn.end_time;

    // Temps de réponse optimal pour activation neurones miroirs: 200-800ms
    let timeScore = 0;
    if (responseTime >= 0.2 && responseTime <= 0.8) {
      timeScore = 1;
    } else if (responseTime < 2) {
      timeScore = Math.max(0, 1 - Math.abs(responseTime - 0.5) / 1.5);
    }

    // Analyse de la synchronisation lexicale (reprises)
    const currentWords = new Set(
      currentTurn.verbatim.toLowerCase().split(/\s+/)
    );
    const previousWords = new Set(
      previousTurn.verbatim.toLowerCase().split(/\s+/)
    );

    const commonWords = new Set(
      [...currentWords].filter((w) => previousWords.has(w))
    );
    const lexicalSync = commonWords.size / Math.max(currentWords.size, 1);

    return (timeScore + lexicalSync) / 2;
  }

  private calculateMentalizationEffort(turn: TurnTaggedData): number {
    const verbatim = turn.verbatim.toLowerCase();

    // Marqueurs d'effort de mentalisation (traitement contrôlé)
    const mentalizationMarkers = [
      "qu'est-ce que vous voulez dire",
      "si je comprends bien",
      "vous pensez que",
      "dans votre situation",
      "de votre point de vue",
      "j'imagine que",
      "probablement",
      "peut-être",
    ];

    const effortCount = mentalizationMarkers.reduce(
      (count, marker) => count + (verbatim.includes(marker) ? 1 : 0),
      0
    );

    // Normalisation
    const wordCount = verbatim.split(/\s+/).length;
    return Math.min(1, effortCount / Math.max(1, wordCount / 15));
  }
}

// ================ INDICATEUR PRINCIPAL ================

export class FluiditeCognitiveIndicator extends BaseIndicator {
  constructor() {
    super(FLUIDITE_COGNITIVE_CONFIG);
  }

  protected initializeAlgorithms(): void {
    // Enregistrement des algorithmes disponibles
    this.algorithms.set("basic_fluidity", new BasicFluidityAlgorithm());
    this.algorithms.set("neuron_mirror", new NeuronMirrorAlgorithm());

    // Définir l'algorithme par défaut
    this.activeAlgorithm = this.algorithms.get("basic_fluidity") || null;

    console.log(
      `✅ FluiditeCognitiveIndicator initialisé avec ${this.algorithms.size} algorithmes`
    );
  }

  // Méthodes spécialisées pour cet indicateur
  public async calculateForFamily(
    data: TurnTaggedData[],
    family: string
  ): Promise<IndicatorResult[]> {
    // Filtrer les données pour cette famille spécifique
    const familyData = data.filter((turn) => {
      // Logique de filtrage par famille - à adapter selon vos tags
      return turn.tag.includes(family.toUpperCase());
    });

    return this.calculate(familyData);
  }

  public getAlgorithmRecommendation(dataSize: number): string {
    if (dataSize < 100) {
      return "basic_fluidity"; // Plus rapide pour petits échantillons
    } else {
      return "neuron_mirror"; // Plus précis pour gros volumes
    }
  }
}

// ================ FACTORY ET EXPORT ================

/**
 * Factory pour créer l'indicateur FluiditeCognitive
 */
export function createFluiditeCognitiveIndicator(): FluiditeCognitiveIndicator {
  return new FluiditeCognitiveIndicator();
}

export default FluiditeCognitiveIndicator;
