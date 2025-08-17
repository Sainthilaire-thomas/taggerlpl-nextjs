// src/app/(protected)/analysis/components/metrics-framework/core/MetricsRegistry.ts

import {
  BaseIndicatorConfig,
  MetricsDomain,
  AlgorithmConfig,
  ImplementationStatus,
} from "./types/base";

/**
 * Registre central de tous les indicateurs et algorithmes du framework
 *
 * Gère l'enregistrement, la découverte et la configuration des métriques
 */
export class MetricsRegistry {
  private static instance: MetricsRegistry;
  private indicators: Map<string, BaseIndicatorConfig> = new Map();
  private algorithms: Map<string, AlgorithmConfig> = new Map();
  private domainMappings: Map<MetricsDomain, string[]> = new Map();

  private constructor() {
    this.initializeDefaultIndicators();
    this.initializeDefaultAlgorithms();
  }

  public static getInstance(): MetricsRegistry {
    if (!MetricsRegistry.instance) {
      MetricsRegistry.instance = new MetricsRegistry();
    }
    return MetricsRegistry.instance;
  }

  /**
   * Enregistrement d'un nouvel indicateur
   */
  public registerIndicator(config: BaseIndicatorConfig): void {
    this.indicators.set(config.id, config);

    // Mise à jour des mappings par domaine
    const domainIndicators = this.domainMappings.get(config.domain) || [];
    if (!domainIndicators.includes(config.id)) {
      domainIndicators.push(config.id);
      this.domainMappings.set(config.domain, domainIndicators);
    }

    console.log(
      `[MetricsRegistry] Indicateur enregistré: ${config.id} (${config.domain})`
    );
  }

  /**
   * Enregistrement d'un nouvel algorithme
   */
  public registerAlgorithm(config: AlgorithmConfig): void {
    this.algorithms.set(config.id, config);
    console.log(
      `[MetricsRegistry] Algorithme enregistré: ${config.id} (${config.type})`
    );
  }

  /**
   * Récupération d'un indicateur par ID
   */
  public getIndicator(id: string): BaseIndicatorConfig | undefined {
    return this.indicators.get(id);
  }

  /**
   * Récupération d'un algorithme par ID
   */
  public getAlgorithm(id: string): AlgorithmConfig | undefined {
    return this.algorithms.get(id);
  }

  /**
   * Récupération de tous les indicateurs d'un domaine
   */
  public getIndicatorsByDomain(domain: MetricsDomain): BaseIndicatorConfig[] {
    const indicatorIds = this.domainMappings.get(domain) || [];
    return indicatorIds
      .map((id) => this.indicators.get(id))
      .filter(
        (indicator): indicator is BaseIndicatorConfig => indicator !== undefined
      );
  }

  /**
   * Récupération de tous les algorithmes compatibles avec un domaine
   */
  public getAlgorithmsByDomain(domain: MetricsDomain): AlgorithmConfig[] {
    return Array.from(this.algorithms.values()).filter((algorithm) =>
      algorithm.supportedDomains.includes(domain)
    );
  }

  /**
   * Récupération des algorithmes disponibles pour un indicateur spécifique
   */
  public getAlgorithmsForIndicator(indicatorId: string): AlgorithmConfig[] {
    const indicator = this.getIndicator(indicatorId);
    if (!indicator) {
      return [];
    }

    return indicator.availableAlgorithms
      .map((algId) => this.algorithms.get(algId))
      .filter(
        (algorithm): algorithm is AlgorithmConfig => algorithm !== undefined
      );
  }

  /**
   * Récupération de tous les domaines disponibles
   */
  public getAvailableDomains(): MetricsDomain[] {
    return Array.from(this.domainMappings.keys());
  }

  /**
   * Récupération de tous les indicateurs
   */
  public getAllIndicators(): BaseIndicatorConfig[] {
    return Array.from(this.indicators.values());
  }

  /**
   * Récupération de tous les algorithmes
   */
  public getAllAlgorithms(): AlgorithmConfig[] {
    return Array.from(this.algorithms.values());
  }

  /**
   * Validation de la compatibilité indicateur-algorithme
   */
  public isCompatible(indicatorId: string, algorithmId: string): boolean {
    const indicator = this.getIndicator(indicatorId);
    const algorithm = this.getAlgorithm(algorithmId);

    if (!indicator || !algorithm) {
      return false;
    }

    // Vérifier si l'algorithme est dans la liste des algorithmes disponibles pour cet indicateur
    if (!indicator.availableAlgorithms.includes(algorithmId)) {
      return false;
    }

    // Vérifier la compatibilité de domaine
    return algorithm.supportedDomains.includes(indicator.domain);
  }

  /**
   * Statistiques du registre
   */
  public getRegistryStats(): {
    totalIndicators: number;
    totalAlgorithms: number;
    indicatorsByDomain: Record<MetricsDomain, number>;
    indicatorsByStatus: Record<ImplementationStatus, number>;
    algorithmsByType: Record<string, number>;
  } {
    const indicatorsByDomain: Record<MetricsDomain, number> = {} as any;
    const indicatorsByStatus: Record<ImplementationStatus, number> = {} as any;
    const algorithmsByType: Record<string, number> = {};

    // Compter par domaine
    for (const domain of this.getAvailableDomains()) {
      indicatorsByDomain[domain] = this.getIndicatorsByDomain(domain).length;
    }

    // Compter par statut d'implémentation
    for (const indicator of this.getAllIndicators()) {
      indicatorsByStatus[indicator.implementationStatus] =
        (indicatorsByStatus[indicator.implementationStatus] || 0) + 1;
    }

    // Compter par type d'algorithme
    for (const algorithm of this.getAllAlgorithms()) {
      algorithmsByType[algorithm.type] =
        (algorithmsByType[algorithm.type] || 0) + 1;
    }

    return {
      totalIndicators: this.indicators.size,
      totalAlgorithms: this.algorithms.size,
      indicatorsByDomain,
      indicatorsByStatus,
      algorithmsByType,
    };
  }

  /**
   * Initialisation des indicateurs par défaut
   */
  private initializeDefaultIndicators(): void {
    // Indicateurs Linguistique Interactionnelle (LI)
    this.registerIndicator({
      id: "common_ground_status",
      name: "Statut du Common Ground",
      domain: "li",
      category: "Intercompréhension",
      implementationStatus: "implemented",
      theoreticalFoundation: "Clark (1996) - Common Ground Theory",
      dataRequirements: [
        {
          table: "turntagged",
          columns: ["verbatim", "next_turn_verbatim", "speaker"],
          optional: false,
        },
      ],
      defaultAlgorithm: "basic_shared_refs",
      availableAlgorithms: [
        "basic_shared_refs",
        "nlp_enhanced",
        "ml_supervised",
      ],
      outputType: "categorical",
    });

    this.registerIndicator({
      id: "feedback_alignment",
      name: "Alignement des Feedbacks",
      domain: "li",
      category: "Coordination",
      implementationStatus: "implemented",
      theoreticalFoundation:
        "Pickering & Garrod (2004) - Interactive Alignment",
      dataRequirements: [
        {
          table: "turntagged",
          columns: ["verbatim", "next_turn_verbatim", "tag"],
          optional: false,
        },
      ],
      defaultAlgorithm: "basic_alignment",
      availableAlgorithms: [
        "basic_alignment",
        "sentiment_enhanced",
        "sequential_pattern",
      ],
      outputType: "categorical",
    });

    this.registerIndicator({
      id: "backchannels_frequency",
      name: "Fréquence des Backchannels",
      domain: "li",
      category: "Engagement",
      implementationStatus: "partial",
      theoreticalFoundation: "Schegloff (1982) - Sequence Organization",
      dataRequirements: [
        {
          table: "turntagged",
          columns: ["verbatim", "speaker", "start_time", "end_time"],
          optional: false,
        },
      ],
      defaultAlgorithm: "pattern_detection",
      availableAlgorithms: ["pattern_detection", "prosodic_enhanced"],
      outputType: "numerical",
    });

    // Indicateurs Sciences Cognitives
    this.registerIndicator({
      id: "fluidite_cognitive",
      name: "Fluidité Cognitive",
      domain: "cognitive",
      category: "Traitement Automatique",
      implementationStatus: "implemented",
      theoreticalFoundation:
        "Gallese (2007) - Neurones Miroirs + Fluidité Temporelle",
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
      defaultAlgorithm: "basic_fluidity",
      availableAlgorithms: ["basic_fluidity", "neuron_mirror", "ml_enhanced"],
      outputType: "numerical",
    });

    this.registerIndicator({
      id: "reactions_directes",
      name: "Réactions Directes",
      domain: "cognitive",
      category: "Automatisme Cognitif",
      implementationStatus: "partial",
      theoreticalFoundation: "Neurones Miroirs - Réactivité Spontanée",
      dataRequirements: [
        {
          table: "turntagged",
          columns: ["verbatim", "next_turn_verbatim", "start_time", "end_time"],
          optional: false,
        },
      ],
      defaultAlgorithm: "temporal_reactivity",
      availableAlgorithms: ["temporal_reactivity", "semantic_priming"],
      outputType: "categorical",
    });

    this.registerIndicator({
      id: "charge_cognitive",
      name: "Charge Cognitive",
      domain: "cognitive",
      category: "Effort Mental",
      implementationStatus: "missing",
      theoreticalFoundation: "Arnsten (2009) - Charge Cognitive PFC",
      dataRequirements: [
        {
          table: "turntagged",
          columns: ["verbatim", "tag", "start_time", "end_time"],
          optional: false,
        },
      ],
      defaultAlgorithm: "complexity_analysis",
      availableAlgorithms: ["complexity_analysis", "ml_load_estimation"],
      outputType: "numerical",
    });

    // Indicateurs Analyse Conversationnelle (baseline empirique)
    this.registerIndicator({
      id: "positive_reaction_rate",
      name: "Taux de Réactions Positives",
      domain: "conversational_analysis",
      category: "Efficacité Empirique",
      implementationStatus: "implemented",
      theoreticalFoundation: "Analyse Conversationnelle - Adjacency Pairs",
      dataRequirements: [
        {
          table: "turntagged",
          columns: ["tag", "next_turn_verbatim", "next_turn_tag"],
          optional: false,
        },
      ],
      defaultAlgorithm: "positive_markers_detection",
      availableAlgorithms: ["positive_markers_detection", "sentiment_analysis"],
      outputType: "numerical",
    });
  }

  /**
   * Initialisation des algorithmes par défaut
   */
  private initializeDefaultAlgorithms(): void {
    // Algorithmes LI
    this.registerAlgorithm({
      id: "basic_shared_refs",
      name: "Détection Références Partagées",
      type: "rule_based",
      version: "1.0.0",
      description: "Détection de références partagées par règles lexicales",
      requiresTraining: false,
      supportedDomains: ["li"],
    });

    this.registerAlgorithm({
      id: "nlp_enhanced",
      name: "Common Ground NLP Enhanced",
      type: "nlp_enhanced",
      version: "1.0.0",
      description: "Analyse sémantique avec spaCy et similarité vectorielle",
      requiresTraining: false,
      supportedDomains: ["li"],
    });

    this.registerAlgorithm({
      id: "ml_supervised",
      name: "Common Ground ML Supervisé",
      type: "ml_supervised",
      version: "1.0.0",
      description: "Modèle entraîné sur annotations expertes",
      requiresTraining: true,
      supportedDomains: ["li"],
    });

    // Algorithmes Cognitifs
    this.registerAlgorithm({
      id: "basic_fluidity",
      name: "Algorithme Fluidité Basique",
      type: "rule_based",
      version: "1.0.0",
      description:
        "Analyse temporelle et linguistique basée sur des règles explicites",
      requiresTraining: false,
      supportedDomains: ["cognitive"],
    });

    this.registerAlgorithm({
      id: "neuron_mirror",
      name: "Neurones Miroirs Avancé",
      type: "nlp_enhanced",
      version: "1.0.0",
      description:
        "Modèle basé sur résonance neuronale et synchronie temporelle",
      requiresTraining: false,
      supportedDomains: ["cognitive"],
    });

    this.registerAlgorithm({
      id: "ml_enhanced",
      name: "Fluidité ML Enhanced",
      type: "ml_supervised",
      version: "1.0.0",
      description:
        "Modèle supervisé avec features prosodiques et linguistiques",
      requiresTraining: true,
      supportedDomains: ["cognitive"],
    });

    // Algorithmes Analyse Conversationnelle
    this.registerAlgorithm({
      id: "positive_markers_detection",
      name: "Détection Marqueurs Positifs",
      type: "rule_based",
      version: "1.0.0",
      description: "Détection de marqueurs positifs par patterns lexicaux",
      requiresTraining: false,
      supportedDomains: ["conversational_analysis"],
    });

    this.registerAlgorithm({
      id: "sentiment_analysis",
      name: "Analyse de Sentiment",
      type: "nlp_enhanced",
      version: "1.0.0",
      description: "Analyse de sentiment avec modèles pré-entraînés",
      requiresTraining: false,
      supportedDomains: ["conversational_analysis", "li"],
    });
  }

  /**
   * Méthode pour réinitialiser le registre (utile pour les tests)
   */
  public reset(): void {
    this.indicators.clear();
    this.algorithms.clear();
    this.domainMappings.clear();
    this.initializeDefaultIndicators();
    this.initializeDefaultAlgorithms();
  }

  /**
   * Export de la configuration complète (pour sauvegarde/backup)
   */
  public exportConfiguration(): {
    indicators: BaseIndicatorConfig[];
    algorithms: AlgorithmConfig[];
    version: string;
    timestamp: string;
  } {
    return {
      indicators: this.getAllIndicators(),
      algorithms: this.getAllAlgorithms(),
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Import d'une configuration (pour restauration)
   */
  public importConfiguration(config: {
    indicators: BaseIndicatorConfig[];
    algorithms: AlgorithmConfig[];
  }): void {
    this.reset();

    for (const indicator of config.indicators) {
      this.registerIndicator(indicator);
    }

    for (const algorithm of config.algorithms) {
      this.registerAlgorithm(algorithm);
    }

    console.log(
      `[MetricsRegistry] Configuration importée: ${config.indicators.length} indicateurs, ${config.algorithms.length} algorithmes`
    );
  }
}

// Export de l'instance singleton
export const metricsRegistry = MetricsRegistry.getInstance();
