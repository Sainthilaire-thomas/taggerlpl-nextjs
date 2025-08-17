// src/app/(protected)/analysis/components/cognitive-metrics/indicators/FluiditeCognitiveIndicator/FluiditeCognitiveIndicator.ts

import BaseIndicator from "../../../metrics-framework/core/BaseIndicator";
import {
  BaseIndicatorConfig,
  IndicatorResult,
  TurnTaggedData,
  BenchmarkResult,
  AnnotatedData, // CORRECTION 1: AnnotationData → AnnotatedData
} from "../../../metrics-framework/core/types/base";

// Import des algorithmes factorisés
import BasicFluidityAlgorithm from "./algorithms/BasicFluidityAlgorithm";
import NeuronMirrorAlgorithm from "./algorithms/NeuronMirrorAlgorithm";

// Configuration de l'indicateur
const FLUIDITE_COGNITIVE_CONFIG: BaseIndicatorConfig = {
  id: "fluidite_cognitive",
  name: "Fluidité Cognitive",
  domain: "cognitive",
  category: "Automatisme Neural",
  implementationStatus: "implemented",
  // CORRECTION 2: Suppression du champ 'description' non supporté par BaseIndicatorConfig
  theoreticalFoundation:
    "Gallese (2007) - Neurones miroirs et empathie automatique dans les interactions sociales",
  // CORRECTION 3: Ajout des champs requis par BaseIndicatorConfig
  availableAlgorithms: ["basic_fluidity", "neuron_mirror"],
  outputType: "numerical" as const,
  dataRequirements: [
    {
      table: "turntagged",
      columns: [
        "verbatim",
        "next_turn_verbatim",
        "start_time",
        "end_time",
        "speaker",
        "tag",
      ],
      optional: false,
    },
    {
      table: "lpltag",
      columns: ["family", "originespeaker"],
      optional: true,
    },
  ],
};

// Types spécifiques pour les résultats
export interface FluidityCognitiveResult extends IndicatorResult {
  value: number; // Score 0-1
  details: {
    temporal_score: number;
    linguistic_score: number;
    prosodic_score: number;
    effort_markers_detected: string[];
    processing_type: "automatique" | "contrôlé" | "mixte";
    mirror_metrics?: {
      empathy_score: number;
      synchronization_score: number;
      mentalization_effort: number;
      reactivity_bonus: number;
    };
  };
}

// Interface pour les métriques par famille
export interface FamilyFluiditeMetrics {
  family: string;
  totalUsage: number;
  averageScore: number;
  scoreDistribution: {
    automatique: number;
    controle: number;
    mixte: number;
  };
  bestScore: number;
  worstScore: number;
  examples: {
    best: { verbatim: string; score: number; type: string };
    worst: { verbatim: string; score: number; type: string };
  };
  detailedResults: FluidityCognitiveResult[];
}

/**
 * Indicateur de Fluidité Cognitive
 *
 * Implémente l'analyse de l'automatisme conversationnel selon deux approches :
 * 1. Algorithme basique : Règles temporelles et linguistiques
 * 2. Algorithme neurones miroirs : Empathie automatique et synchronisation
 */
export class FluiditeCognitiveIndicator extends BaseIndicator {
  constructor() {
    super(FLUIDITE_COGNITIVE_CONFIG);
  }

  /**
   * Initialise les algorithmes disponibles pour cet indicateur
   */
  protected initializeAlgorithms(): void {
    // CORRECTION 4: Cast des algorithmes vers le type attendu
    const basicAlgorithm = new BasicFluidityAlgorithm() as any;
    const neuronAlgorithm = new NeuronMirrorAlgorithm() as any;

    // Enregistrement des algorithmes factorisés
    this.algorithms.set("basic_fluidity", basicAlgorithm);
    this.algorithms.set("neuron_mirror", neuronAlgorithm);

    // Définir l'algorithme par défaut
    this.activeAlgorithm = this.algorithms.get("basic_fluidity") || null;

    console.log(
      `✅ FluiditeCognitiveIndicator initialisé avec ${this.algorithms.size} algorithmes`
    );
    console.log(`🔧 Algorithme actif: ${this.activeAlgorithm?.getId()}`);
  }

  /**
   * Calcule les métriques pour une famille spécifique de stratégies
   */
  public async calculateForFamily(
    data: TurnTaggedData[],
    family: string
  ): Promise<FluidityCognitiveResult[]> {
    // Filtrer les données pour cette famille spécifique
    const familyData = data.filter((turn) => {
      // Logique de filtrage par famille - à adapter selon vos tags
      return turn.tag && this.isFamilyTag(turn.tag, family);
    });

    console.log(
      `📊 Calcul fluidité pour famille ${family}: ${familyData.length} tours`
    );

    const results = await this.calculate(familyData);
    return results as FluidityCognitiveResult[];
  }

  /**
   * Analyse les métriques par famille de stratégies
   */
  public async analyzeByFamily(
    data: TurnTaggedData[],
    familyTags: Record<string, string[]>
  ): Promise<Record<string, FamilyFluiditeMetrics>> {
    const familyMetrics: Record<string, FamilyFluiditeMetrics> = {};

    for (const [family, tags] of Object.entries(familyTags)) {
      // Filtrer les données pour cette famille
      const familyData = data.filter((turn) =>
        tags.some((tag) => turn.tag === tag)
      );

      if (familyData.length === 0) continue;

      // Calculer les résultats pour cette famille
      const results = (await this.calculate(
        familyData
      )) as FluidityCognitiveResult[];

      // Analyser et agrégér les résultats
      familyMetrics[family] = this.aggregateFamilyResults(
        family,
        familyData,
        results
      );
    }

    return familyMetrics;
  }

  /**
   * Compare la performance des algorithmes sur un échantillon annoté
   */
  public async benchmarkAlgorithmsAdvanced(
    testData: TurnTaggedData[],
    annotations: AnnotatedData[] // CORRECTION 5: Type corrigé
  ): Promise<{
    comparison: Record<string, BenchmarkResult>;
    recommendation: string;
    detailedAnalysis: any;
  }> {
    console.log(
      `🔬 Benchmark avancé FluiditeCognitive: ${testData.length} échantillons, ${annotations.length} annotations`
    );

    // Utiliser la méthode héritée de BaseIndicator
    const baseComparison = await this.benchmarkAlgorithms(
      testData,
      annotations
    );

    // Analyse spécialisée pour la fluidité cognitive
    const detailedAnalysis = await this.analyzeBenchmarkDetails(
      testData,
      baseComparison
    );

    // Génération de recommandations spécialisées
    const recommendation = this.generateFluidityRecommendation(
      baseComparison,
      detailedAnalysis
    );

    return {
      comparison: baseComparison,
      recommendation,
      detailedAnalysis,
    };
  }

  /**
   * Retourne l'algorithme recommandé selon la taille des données
   */
  public getAlgorithmRecommendation(
    dataSize: number,
    context?: {
      hasAnnotations?: boolean;
      requiresExplanation?: boolean;
      performanceConstraints?: boolean;
    }
  ): string {
    const ctx = context || {};

    if (ctx.performanceConstraints && dataSize > 1000) {
      return "basic_fluidity"; // Plus rapide pour gros volumes
    }

    if (ctx.hasAnnotations && dataSize > 100) {
      return "neuron_mirror"; // Plus précis avec données annotées
    }

    if (ctx.requiresExplanation) {
      return "neuron_mirror"; // Explications plus riches
    }

    // Par défaut : algorithme basique pour simplicité
    return "basic_fluidity";
  }

  // ================ MÉTHODES PRIVÉES ================

  private isFamilyTag(tag: string, family: string): boolean {
    // Logique de correspondance tag/famille
    // À adapter selon votre taxonomie de tags
    const familyPatterns: Record<string, string[]> = {
      ENGAGEMENT: ["ENGAGEMENT"],
      REFLET: ["REFLET_ACQ", "REFLET_JE", "REFLET_VOUS"],
      OUVERTURE: ["OUVERTURE"],
      EXPLICATION: ["EXPLICATION"],
    };

    const patterns = familyPatterns[family.toUpperCase()] || [
      family.toUpperCase(),
    ];
    return patterns.some((pattern) => tag.toUpperCase().includes(pattern));
  }

  private aggregateFamilyResults(
    family: string,
    turns: TurnTaggedData[],
    results: FluidityCognitiveResult[]
  ): FamilyFluiditeMetrics {
    const scores = results.map((r) => r.value);
    const types = results.map((r) => r.details.processing_type);

    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    // Distribution des types de traitement
    const automatique =
      (types.filter((t) => t === "automatique").length / types.length) * 100;
    const controle =
      (types.filter((t) => t === "contrôlé").length / types.length) * 100;
    const mixte =
      (types.filter((t) => t === "mixte").length / types.length) * 100;

    // Exemples représentatifs
    const bestIndex = scores.indexOf(bestScore);
    const worstIndex = scores.indexOf(worstScore);

    return {
      family,
      totalUsage: turns.length,
      averageScore,
      scoreDistribution: { automatique, controle, mixte },
      bestScore,
      worstScore,
      examples: {
        best: {
          verbatim:
            turns[bestIndex]?.verbatim?.substring(0, 80) + "..." || "N/A",
          score: bestScore,
          type: results[bestIndex]?.details.processing_type || "inconnu",
        },
        worst: {
          verbatim:
            turns[worstIndex]?.verbatim?.substring(0, 80) + "..." || "N/A",
          score: worstScore,
          type: results[worstIndex]?.details.processing_type || "inconnu",
        },
      },
      detailedResults: results,
    };
  }

  private async analyzeBenchmarkDetails(
    testData: TurnTaggedData[],
    comparison: Record<string, BenchmarkResult>
  ): Promise<any> {
    // Analyse détaillée spécifique à la fluidité cognitive
    return {
      algorithmCount: Object.keys(comparison).length,
      datasetSize: testData.length,
      bestAccuracy: Math.max(
        ...Object.values(comparison).map((b) => b.accuracy)
      ),
      fastestAlgorithm: Object.entries(comparison).reduce(
        (fastest, [id, benchmark]) =>
          benchmark.processing_time_ms < fastest[1].processing_time_ms
            ? [id, benchmark]
            : fastest
      )[0],
      confidenceAnalysis: this.analyzeConfidenceDistribution(comparison),
    };
  }

  private analyzeConfidenceDistribution(
    comparison: Record<string, BenchmarkResult>
  ): any {
    // Analyse de la distribution de confiance
    return {
      averageAccuracy:
        Object.values(comparison).reduce((sum, b) => sum + b.accuracy, 0) /
        Object.keys(comparison).length,
      accuracyVariance: this.calculateVariance(
        Object.values(comparison).map((b) => b.accuracy)
      ),
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private generateFluidityRecommendation(
    comparison: Record<string, BenchmarkResult>,
    analysis: any
  ): string {
    const algorithms = Object.entries(comparison);

    if (algorithms.length === 0) {
      return "Aucun algorithme disponible pour analyse";
    }

    const bestAccuracy = algorithms.reduce((best, [id, metrics]) =>
      metrics.accuracy > best[1].accuracy ? [id, metrics] : best
    );

    const bestSpeed = algorithms.reduce((best, [id, metrics]) =>
      metrics.processing_time_ms < best[1].processing_time_ms
        ? [id, metrics]
        : best
    );

    let recommendation = `Recommandation FluiditeCognitive:\n\n`;
    recommendation += `• Meilleure précision: ${bestAccuracy[0]} (${(
      bestAccuracy[1].accuracy * 100
    ).toFixed(1)}%)\n`;
    recommendation += `• Plus rapide: ${
      bestSpeed[0]
    } (${bestSpeed[1].processing_time_ms.toFixed(0)}ms)\n\n`;

    if (bestAccuracy[1].accuracy > 0.85) {
      recommendation += `✅ Précision excellente détectée. Recommandation: ${bestAccuracy[0]}`;
    } else if (bestSpeed[1].processing_time_ms < 50) {
      recommendation += `⚡ Performance temps réel excellente. Recommandation: ${bestSpeed[0]}`;
    } else {
      recommendation += `⚖️ Compromis précision/vitesse. Évaluer selon contexte d'usage.`;
    }

    return recommendation;
  }
}

/**
 * Factory pour créer l'indicateur FluiditeCognitive
 */
export function createFluiditeCognitiveIndicator(): FluiditeCognitiveIndicator {
  return new FluiditeCognitiveIndicator();
}

export default FluiditeCognitiveIndicator;
