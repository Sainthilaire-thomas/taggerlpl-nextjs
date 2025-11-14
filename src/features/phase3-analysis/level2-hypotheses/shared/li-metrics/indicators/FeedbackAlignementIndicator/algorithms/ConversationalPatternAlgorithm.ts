// ConversationalPatternAlgorithm.ts - Version adaptée à la taxonomie de la thèse
import { TaggedTurn } from "@/context/TaggingDataContext";
import {
  AlignmentResult,
  AlignmentAnalysis,
  BasicAlignmentAlgorithm,
} from "./BasicAlignmentAlgorithm";

// ========================================
// TYPES BASÉS SUR LA TAXONOMIE DE LA THÈSE (3.2.1.1)
// ========================================

// Taxonomie hiérarchisée avec priorité action selon la thèse
export enum ConseillerStrategy {
  ENGAGEMENT = "ENGAGEMENT", // Priorité maximale - action du conseiller
  OUVERTURE = "OUVERTURE", // Priorité élevée - action future du client
  REFLET_VOUS = "REFLET_VOUS", // Priorité haute - action du client décrite
  REFLET_JE = "REFLET_JE", // Priorité moyenne - processus cognitif conseiller
  REFLET_ACQ = "REFLET_ACQ", // Priorité basse - acquiescement simple
  EXPLICATION = "EXPLICATION", // Priorité minimale - justifications abstraites
  QUESTION = "QUESTION", // Questions d'information
}

// Réactions client selon classification tripartite de la thèse
export enum ClientReaction {
  POSITIF = "CLIENT_POSITIF", // Acquiescement, coopération
  NEUTRE = "CLIENT_NEUTRE", // Questions factuelles neutres
  NEGATIF = "CLIENT_NEGATIF", // Objections, résistance
}

// Mécanismes de traitement cognitif selon le cadre théorique
export enum ProcessingMode {
  AUTOMATIC_MOTOR = "automatic_motor_simulation", // Descriptions d'actions -> neurones miroirs
  CONTROLLED_METAPHOR = "controlled_metaphorical", // Explications -> mapping métaphorique
  EMPATHIC_PROCESSING = "empathic_processing", // Reflets -> processus empathiques
  NEUTRAL_INFORMATION = "neutral_information", // Questions -> traitement informatif
}

// Résultat d'analyse conforme à la thèse
export interface ThesisConversationalAnalysis {
  conseillerStrategy: ConseillerStrategy;
  clientReaction: ClientReaction;
  processingMode: ProcessingMode;

  // Métriques d'efficacité selon les hypothèses de la thèse
  actionDescriptionScore: number; // Score de description d'action concrète
  cognitiveLoadEstimate: number; // Estimation de la charge cognitive
  conflictManagementSuccess: number; // Efficacité de gestion du conflit

  // Validation des hypothèses théoriques
  h1_actionEffectiveness: boolean; // H1: Actions > Explications
  h2_cognitiveProcessing: ProcessingMode; // H2: Mécanismes différentiels
  h3_practicalApplication: string; // H3: Applicabilité pratique

  explanation: string;
}

export interface ThesisAlignmentResult extends AlignmentResult {
  thesisAnalyses: ThesisConversationalAnalysis[];

  // Métriques spécifiques à la thèse
  actionDescriptionMetrics: {
    engagement_effectiveness: number; // Efficacité ENGAGEMENT
    ouverture_effectiveness: number; // Efficacité OUVERTURE
    explanation_resistance: number; // Résistance aux EXPLICATIONS
  };

  // Validation du modèle dual de traitement
  processingModeDistribution: {
    automatic_motor: number; // % traitement automatique
    controlled_metaphor: number; // % traitement contrôlé
    empathic_processing: number; // % traitement empathique
    neutral_information: number; // % traitement informatif
  };

  // Support empirique des hypothèses
  hypothesesSupport: {
    h1_differential_effectiveness: number; // Support pour H1
    h2_cognitive_mechanisms: number; // Support pour H2
    h3_practical_transferability: number; // Support pour H3
  };
}

// ========================================
// ALGORITHME ADAPTÉ À LA TAXONOMIE DE LA THÈSE
// ========================================

export class ConversationalPatternAlgorithm extends BasicAlignmentAlgorithm {
  // Patterns de détection selon la taxonomie hiérarchisée de la thèse
  private readonly THESIS_STRATEGY_PATTERNS: Record<
    ConseillerStrategy,
    {
      actionPriority: number; // Priorité selon la règle "action > explication"
      detectionMarkers: string[]; // Marqueurs linguistiques
      cognitiveProcessing: ProcessingMode; // Mode de traitement prédit
      expectedEffectiveness: number; // Efficacité attendue selon la thèse
    }
  > = {
    [ConseillerStrategy.ENGAGEMENT]: {
      actionPriority: 100, // Priorité maximale
      detectionMarkers: [
        "je vais",
        "je fais",
        "je vérifie",
        "je transfère",
        "je demande",
      ],
      cognitiveProcessing: ProcessingMode.AUTOMATIC_MOTOR,
      expectedEffectiveness: 0.52, // 52% selon analyse préliminaire
    },

    [ConseillerStrategy.OUVERTURE]: {
      actionPriority: 90, // Priorité élevée
      detectionMarkers: [
        "vous allez",
        "vous recevrez",
        "vous pourrez",
        "vous devrez",
      ],
      cognitiveProcessing: ProcessingMode.AUTOMATIC_MOTOR,
      expectedEffectiveness: 0.57, // 57% selon analyse préliminaire
    },

    [ConseillerStrategy.REFLET_VOUS]: {
      actionPriority: 80, // Priorité haute - action client décrite
      detectionMarkers: ["vous avez", "je vois que vous", "vous aviez"],
      cognitiveProcessing: ProcessingMode.AUTOMATIC_MOTOR,
      expectedEffectiveness: 0.38, // Efficacité intermédiaire
    },

    [ConseillerStrategy.REFLET_JE]: {
      actionPriority: 60, // Priorité moyenne - processus cognitif
      detectionMarkers: ["je comprends", "j'entends", "je vois"],
      cognitiveProcessing: ProcessingMode.EMPATHIC_PROCESSING,
      expectedEffectiveness: 0.33, // Efficacité modérée
    },

    [ConseillerStrategy.REFLET_ACQ]: {
      actionPriority: 40, // Priorité basse - acquiescement simple
      detectionMarkers: ["d'accord", "effectivement", "très bien", "ok"],
      cognitiveProcessing: ProcessingMode.EMPATHIC_PROCESSING,
      expectedEffectiveness: 0.32, // Efficacité variable
    },

    [ConseillerStrategy.EXPLICATION]: {
      actionPriority: 10, // Priorité minimale
      detectionMarkers: [
        "parce que",
        "notre politique",
        "le système",
        "la réglementation",
      ],
      cognitiveProcessing: ProcessingMode.CONTROLLED_METAPHOR,
      expectedEffectiveness: 0.01, // 1% selon analyse préliminaire
    },

    [ConseillerStrategy.QUESTION]: {
      actionPriority: 50, // Priorité neutre
      detectionMarkers: ["pouvez-vous", "quel est", "avez-vous", "?"],
      cognitiveProcessing: ProcessingMode.NEUTRAL_INFORMATION,
      expectedEffectiveness: 0.25, // Efficacité neutre
    },
  };

  // Classification client selon la thèse
  private readonly CLIENT_REACTION_PATTERNS: Record<
    ClientReaction,
    {
      markers: string[];
      supportForStrategy: Record<ConseillerStrategy, number>; // Support différentiel
    }
  > = {
    [ClientReaction.POSITIF]: {
      markers: ["d'accord", "oui", "merci", "très bien", "parfait"],
      supportForStrategy: {
        [ConseillerStrategy.ENGAGEMENT]: 1.0, // Support maximal
        [ConseillerStrategy.OUVERTURE]: 1.0, // Support maximal
        [ConseillerStrategy.REFLET_VOUS]: 0.7, // Support modéré
        [ConseillerStrategy.REFLET_JE]: 0.6, // Support modéré
        [ConseillerStrategy.REFLET_ACQ]: 0.6, // Support modéré
        [ConseillerStrategy.EXPLICATION]: 0.1, // Support minimal
        [ConseillerStrategy.QUESTION]: 0.5, // Support neutre
      },
    },

    [ClientReaction.NEUTRE]: {
      markers: ["combien", "comment", "quand", "où", "quel"],
      supportForStrategy: {
        [ConseillerStrategy.ENGAGEMENT]: 0.5, // Support neutre
        [ConseillerStrategy.OUVERTURE]: 0.5, // Support neutre
        [ConseillerStrategy.REFLET_VOUS]: 0.5, // Support neutre
        [ConseillerStrategy.REFLET_JE]: 0.5, // Support neutre
        [ConseillerStrategy.REFLET_ACQ]: 0.5, // Support neutre
        [ConseillerStrategy.EXPLICATION]: 0.3, // Support faible
        [ConseillerStrategy.QUESTION]: 0.8, // Support élevé
      },
    },

    [ClientReaction.NEGATIF]: {
      markers: ["mais", "non", "impossible", "inadmissible", "pas d'accord"],
      supportForStrategy: {
        [ConseillerStrategy.ENGAGEMENT]: 0.2, // Résistance faible
        [ConseillerStrategy.OUVERTURE]: 0.2, // Résistance faible
        [ConseillerStrategy.REFLET_VOUS]: 0.3, // Résistance modérée
        [ConseillerStrategy.REFLET_JE]: 0.4, // Résistance modérée
        [ConseillerStrategy.REFLET_ACQ]: 0.4, // Résistance modérée
        [ConseillerStrategy.EXPLICATION]: 0.9, // Résistance maximale
        [ConseillerStrategy.QUESTION]: 0.4, // Résistance modérée
      },
    },
  };

  constructor(turnTaggedData: TaggedTurn[]) {
    super(turnTaggedData);
    console.log(
      "🧠 ConversationalPatternAlgorithm - Version adaptée taxonomie thèse"
    );
  }

  /**
   * Classification selon la règle de priorité de la thèse :
   * "Description d'action prime sur autres fonctions"
   */
  private classifyConseillerStrategy(verbatim: string): ConseillerStrategy {
    const text = verbatim.toLowerCase().trim();

    // Application de la règle de priorité hiérarchique
    const strategies = Object.entries(this.THESIS_STRATEGY_PATTERNS).sort(
      ([, a], [, b]) => b.actionPriority - a.actionPriority
    ); // Tri par priorité décroissante

    for (const [strategy, config] of strategies) {
      const hasMarkers = config.detectionMarkers.some((marker) =>
        text.includes(marker.toLowerCase())
      );

      if (hasMarkers) {
        return strategy as ConseillerStrategy;
      }
    }

    // Par défaut : EXPLICATION (priorité minimale)
    return ConseillerStrategy.EXPLICATION;
  }

  /**
   * Classification des réactions client selon la thèse
   */
  private classifyClientReaction(verbatim: string): ClientReaction {
    const text = verbatim.toLowerCase().trim();

    // Test des marqueurs négatifs en premier (plus discriminants)
    if (
      this.CLIENT_REACTION_PATTERNS[ClientReaction.NEGATIF].markers.some(
        (marker) => text.includes(marker)
      )
    ) {
      return ClientReaction.NEGATIF;
    }

    // Test des marqueurs positifs
    if (
      this.CLIENT_REACTION_PATTERNS[ClientReaction.POSITIF].markers.some(
        (marker) => text.includes(marker)
      )
    ) {
      return ClientReaction.POSITIF;
    }

    // Par défaut : NEUTRE
    return ClientReaction.NEUTRE;
  }

  /**
   * Analyse d'une paire conversationnelle selon le cadre de la thèse
   */
  private analyzeThesisConversationalPair(
    conseillerVerbatim: string,
    clientVerbatim: string,
    family: string
  ): ThesisConversationalAnalysis | null {
    const conseillerStrategy =
      this.classifyConseillerStrategy(conseillerVerbatim);
    const clientReaction = this.classifyClientReaction(clientVerbatim);
    const strategyConfig = this.THESIS_STRATEGY_PATTERNS[conseillerStrategy];

    // Calcul des métriques selon les hypothèses de la thèse
    const actionDescriptionScore =
      this.calculateActionDescriptionScore(conseillerVerbatim);
    const cognitiveLoadEstimate = this.estimateCognitiveLoad(
      conseillerStrategy,
      conseillerVerbatim
    );
    const conflictManagementSuccess = this.evaluateConflictManagement(
      conseillerStrategy,
      clientReaction
    );

    // Test des hypothèses de la thèse
    const h1_actionEffectiveness = this.testH1ActionEffectiveness(
      conseillerStrategy,
      clientReaction
    );
    const h2_cognitiveProcessing = strategyConfig.cognitiveProcessing;
    const h3_practicalApplication = this.generatePracticalRecommendation(
      conseillerStrategy,
      clientReaction
    );

    return {
      conseillerStrategy,
      clientReaction,
      processingMode: strategyConfig.cognitiveProcessing,
      actionDescriptionScore,
      cognitiveLoadEstimate,
      conflictManagementSuccess,
      h1_actionEffectiveness,
      h2_cognitiveProcessing,
      h3_practicalApplication,
      explanation: this.generateThesisExplanation(
        conseillerStrategy,
        clientReaction,
        strategyConfig
      ),
    };
  }

  /**
   * Calcul du score de description d'action concrète
   */
  private calculateActionDescriptionScore(verbatim: string): number {
    const text = verbatim.toLowerCase();
    let score = 0;

    // Verbes d'action concrets (neurones miroirs)
    const concreteActionVerbs = [
      "vérifie",
      "transfère",
      "envoie",
      "consulte",
      "traite",
    ];
    score +=
      concreteActionVerbs.filter((verb) => text.includes(verb)).length * 0.3;

    // Références temporelles immédiates (automatisme)
    const immediateTemporalMarkers = [
      "maintenant",
      "tout de suite",
      "immédiatement",
    ];
    score +=
      immediateTemporalMarkers.filter((marker) => text.includes(marker))
        .length * 0.2;

    // Pronoms d'action (engagement direct)
    if (text.includes("je vais") || text.includes("vous allez")) score += 0.4;

    return Math.min(score, 1.0);
  }

  /**
   * Estimation de la charge cognitive selon la théorie des métaphores
   */
  private estimateCognitiveLoad(
    strategy: ConseillerStrategy,
    verbatim: string
  ): number {
    const text = verbatim.toLowerCase();
    let cognitiveLoad = 0;

    // Métaphores organisationnelles (Lakoff & Johnson)
    const organizationalMetaphors = [
      "système",
      "politique",
      "procédure",
      "règlement",
    ];
    cognitiveLoad +=
      organizationalMetaphors.filter((metaphor) => text.includes(metaphor))
        .length * 0.25;

    // Concepts abstraits nécessitant mapping conceptuel
    const abstractConcepts = ["fonctionnement", "mécanisme", "processus"];
    cognitiveLoad +=
      abstractConcepts.filter((concept) => text.includes(concept)).length * 0.2;

    // Bonus pour les explications (traitement contrôlé)
    if (strategy === ConseillerStrategy.EXPLICATION) {
      cognitiveLoad += 0.5;
    }

    return Math.min(cognitiveLoad, 1.0);
  }

  /**
   * Évaluation de l'efficacité de gestion du conflit
   */
  private evaluateConflictManagement(
    strategy: ConseillerStrategy,
    reaction: ClientReaction
  ): number {
    const strategyConfig = this.THESIS_STRATEGY_PATTERNS[strategy];
    const clientSupport =
      this.CLIENT_REACTION_PATTERNS[reaction].supportForStrategy[strategy];

    // Formule d'efficacité combinant prédiction théorique et réaction observée
    return (strategyConfig.expectedEffectiveness + clientSupport) / 2;
  }

  /**
   * Test de l'hypothèse H1 : Actions > Explications
   */
  private testH1ActionEffectiveness(
    strategy: ConseillerStrategy,
    reaction: ClientReaction
  ): boolean {
    const isActionStrategy = [
      ConseillerStrategy.ENGAGEMENT,
      ConseillerStrategy.OUVERTURE,
    ].includes(strategy);

    const isPositiveReaction = reaction === ClientReaction.POSITIF;

    // H1 supportée si action + réaction positive OU explication + réaction négative
    if (isActionStrategy && isPositiveReaction) return true;
    if (
      strategy === ConseillerStrategy.EXPLICATION &&
      reaction === ClientReaction.NEGATIF
    )
      return true;

    return false;
  }

  /**
   * Génération de recommandation pratique (H3)
   */
  private generatePracticalRecommendation(
    strategy: ConseillerStrategy,
    reaction: ClientReaction
  ): string {
    if (reaction === ClientReaction.POSITIF) {
      return `✅ Stratégie ${strategy} efficace - À reproduire`;
    } else if (reaction === ClientReaction.NEGATIF) {
      if (strategy === ConseillerStrategy.EXPLICATION) {
        return "⚠️ Reformuler en ENGAGEMENT/OUVERTURE pour réduire résistance";
      } else {
        return "📝 Analyser contexte spécifique - stratégie généralement efficace";
      }
    } else {
      return "ℹ️ Réaction neutre - possibilité d'optimisation";
    }
  }

  /**
   * Explication intégrée selon le cadre théorique de la thèse
   */
  private generateThesisExplanation(
    strategy: ConseillerStrategy,
    reaction: ClientReaction,
    config: {
      cognitiveProcessing: ProcessingMode;
      expectedEffectiveness: number;
    }
  ): string {
    let explanation = `Stratégie: ${strategy} → Réaction: ${reaction}\n`;

    // Explication cognitive
    switch (config.cognitiveProcessing) {
      case ProcessingMode.AUTOMATIC_MOTOR:
        explanation +=
          "🧠 Traitement automatique via simulation motrice (neurones miroirs)\n";
        break;
      case ProcessingMode.CONTROLLED_METAPHOR:
        explanation +=
          "🧠 Traitement contrôlé nécessitant mapping métaphorique (coûteux)\n";
        break;
      case ProcessingMode.EMPATHIC_PROCESSING:
        explanation += "🧠 Traitement empathique (territoires d'expérience)\n";
        break;
      case ProcessingMode.NEUTRAL_INFORMATION:
        explanation += "🧠 Traitement informatif standard\n";
        break;
    }

    // Prédiction vs observation
    const reactionScore =
      reaction === ClientReaction.POSITIF
        ? 1
        : reaction === ClientReaction.NEGATIF
        ? 0
        : 0.5;
    const predictionAccuracy = Math.abs(
      config.expectedEffectiveness - reactionScore
    );

    explanation += `📊 Prédiction théorique: ${(
      config.expectedEffectiveness * 100
    ).toFixed(0)}% efficacité\n`;
    explanation += `📈 Observation: ${reaction} (précision: ${(
      100 -
      predictionAccuracy * 100
    ).toFixed(0)}%)`;

    return explanation;
  }

  /**
   * Analyse principale adaptée à la taxonomie de la thèse
   */
  public analyzeAlignment(): AlignmentAnalysis {
    console.log("🚀 Analyse selon taxonomie hiérarchisée de la thèse");

    const allData = this.getAllTurnTaggedData();
    const validData = allData.filter((turn) => this.validateTurnData(turn));

    console.log(
      `📊 Données: ${validData.length}/${allData.length} tours validés`
    );

    if (validData.length === 0) {
      return this.createEmptyAnalysis();
    }

    const results: Partial<AlignmentAnalysis> = {};

    // Analyse par famille selon la taxonomie de la thèse
    ["REFLET", "ENGAGEMENT", "EXPLICATION", "OUVERTURE"].forEach((family) => {
      const familyKey = family.toLowerCase() as keyof AlignmentAnalysis;
      if (familyKey !== "globalStats") {
        console.log(`\n🎯 Analyse famille: ${family}`);
        results[familyKey] = this.analyzeThesisPatternsByFamily(
          family,
          validData
        );
      }
    });

    const globalStats = this.calculateGlobalStatsCustom(results);

    return {
      reflet: results.reflet!,
      engagement: results.engagement!,
      explication: results.explication!,
      ouverture: results.ouverture!,
      globalStats,
    };
  }

  /**
   * Analyse par famille selon les principes de la thèse
   */
  private analyzeThesisPatternsByFamily(
    family: string,
    validData: TaggedTurn[]
  ): ThesisAlignmentResult {
    const familyTurns = validData.filter(
      (turn) => turn.tag.toUpperCase() === family.toUpperCase()
    );

    console.log(`📋 [${family}] ${familyTurns.length} tours conseiller`);

    if (familyTurns.length === 0) {
      return this.createEmptyThesisResult(family);
    }

    const thesisAnalyses: ThesisConversationalAnalysis[] = [];
    const actionDescriptionMetrics = {
      engagement_effectiveness: 0,
      ouverture_effectiveness: 0,
      explanation_resistance: 0,
    };
    const processingModeDistribution = {
      automatic_motor: 0,
      controlled_metaphor: 0,
      empathic_processing: 0,
      neutral_information: 0,
    };
    const hypothesesSupport = {
      h1_differential_effectiveness: 0,
      h2_cognitive_mechanisms: 0,
      h3_practical_transferability: 0,
    };

    let analyzedPairs = 0;
    const examples = {
      positive: [] as Array<{ verbatim: string; call_id: string }>,
      negative: [] as Array<{ verbatim: string; call_id: string }>,
      neutral: [] as Array<{ verbatim: string; call_id: string }>,
    };

    familyTurns.forEach((turn, index) => {
      if (
        !turn.next_turn_verbatim ||
        turn.next_turn_verbatim.trim().length < 3
      ) {
        return;
      }

      const analysis = this.analyzeThesisConversationalPair(
        turn.verbatim,
        turn.next_turn_verbatim,
        family
      );

      if (analysis) {
        thesisAnalyses.push(analysis);
        analyzedPairs++;

        // Mise à jour des métriques
        if (analysis.conseillerStrategy === ConseillerStrategy.ENGAGEMENT) {
          actionDescriptionMetrics.engagement_effectiveness +=
            analysis.conflictManagementSuccess;
        }
        if (analysis.conseillerStrategy === ConseillerStrategy.OUVERTURE) {
          actionDescriptionMetrics.ouverture_effectiveness +=
            analysis.conflictManagementSuccess;
        }
        if (analysis.conseillerStrategy === ConseillerStrategy.EXPLICATION) {
          actionDescriptionMetrics.explanation_resistance +=
            1 - analysis.conflictManagementSuccess;
        }

        // Distribution des modes de traitement
        const modeKey = analysis.processingMode
          .replace("_", "_")
          .toLowerCase() as keyof typeof processingModeDistribution;
        if (processingModeDistribution[modeKey] !== undefined) {
          processingModeDistribution[modeKey]++;
        }

        // Support des hypothèses
        if (analysis.h1_actionEffectiveness) {
          hypothesesSupport.h1_differential_effectiveness++;
        }
        hypothesesSupport.h2_cognitive_mechanisms +=
          analysis.conflictManagementSuccess;
        hypothesesSupport.h3_practical_transferability +=
          analysis.h3_practicalApplication.includes("✅") ? 1 : 0;

        // Exemples
        if (
          analysis.clientReaction === ClientReaction.POSITIF &&
          examples.positive.length < 3
        ) {
          examples.positive.push({
            verbatim: turn.next_turn_verbatim,
            call_id: turn.call_id,
          });
        }
        // ... autres exemples
      }
    });

    // Normalisation des métriques
    const normalizedMetrics = this.normalizeThesisMetrics(
      actionDescriptionMetrics,
      processingModeDistribution,
      hypothesesSupport,
      analyzedPairs
    );

    return this.buildThesisAlignmentResult(
      family,
      familyTurns.length,
      thesisAnalyses,
      normalizedMetrics.actionDescriptionMetrics,
      normalizedMetrics.processingModeDistribution,
      normalizedMetrics.hypothesesSupport,
      examples,
      analyzedPairs
    );
  }

  // Méthodes utilitaires pour créer les résultats...
  private createEmptyThesisResult(family: string): ThesisAlignmentResult {
    return {
      strategyFamily: family,
      totalOccurrences: 0,
      positiveResponses: 0,
      negativeResponses: 0,
      neutralResponses: 0,
      unanalyzedResponses: 0,
      alignmentScore: 0,
      details: {
        positiveRate: 0,
        negativeRate: 0,
        neutralRate: 0,
        analysisRate: 0,
      },
      examples: { positive: [], negative: [], neutral: [] },
      thesisAnalyses: [],
      actionDescriptionMetrics: {
        engagement_effectiveness: 0,
        ouverture_effectiveness: 0,
        explanation_resistance: 0,
      },
      processingModeDistribution: {
        automatic_motor: 0,
        controlled_metaphor: 0,
        empathic_processing: 0,
        neutral_information: 0,
      },
      hypothesesSupport: {
        h1_differential_effectiveness: 0,
        h2_cognitive_mechanisms: 0,
        h3_practical_transferability: 0,
      },
    };
  }

  // Autres méthodes utilitaires...
  private normalizeThesisMetrics(
    actionMetrics: any,
    processingDistrib: any,
    hypothesesSupport: any,
    total: number
  ) {
    // Normalisation par le nombre total d'analyses
    return {
      actionDescriptionMetrics: {
        engagement_effectiveness:
          actionMetrics.engagement_effectiveness / Math.max(total, 1),
        ouverture_effectiveness:
          actionMetrics.ouverture_effectiveness / Math.max(total, 1),
        explanation_resistance:
          actionMetrics.explanation_resistance / Math.max(total, 1),
      },
      processingModeDistribution: {
        automatic_motor: processingDistrib.automatic_motor / Math.max(total, 1),
        controlled_metaphor:
          processingDistrib.controlled_metaphor / Math.max(total, 1),
        empathic_processing:
          processingDistrib.empathic_processing / Math.max(total, 1),
        neutral_information:
          processingDistrib.neutral_information / Math.max(total, 1),
      },
      hypothesesSupport: {
        h1_differential_effectiveness:
          hypothesesSupport.h1_differential_effectiveness / Math.max(total, 1),
        h2_cognitive_mechanisms:
          hypothesesSupport.h2_cognitive_mechanisms / Math.max(total, 1),
        h3_practical_transferability:
          hypothesesSupport.h3_practical_transferability / Math.max(total, 1),
      },
    };
  }

  private buildThesisAlignmentResult(
    family: string,
    totalOccurrences: number,
    analyses: ThesisConversationalAnalysis[],
    actionMetrics: any,
    processingDistrib: any,
    hypothesesSupport: any,
    examples: any,
    analyzedPairs: number
  ): ThesisAlignmentResult {
    // Calculs de base compatible avec AlignmentResult
    const positiveCount = analyses.filter(
      (a) => a.clientReaction === ClientReaction.POSITIF
    ).length;
    const negativeCount = analyses.filter(
      (a) => a.clientReaction === ClientReaction.NEGATIF
    ).length;
    const neutralCount = analyses.filter(
      (a) => a.clientReaction === ClientReaction.NEUTRE
    ).length;

    const alignmentScore =
      analyzedPairs > 0 ? (positiveCount / analyzedPairs) * 100 : 0;

    return {
      // Propriétés AlignmentResult de base
      strategyFamily: family,
      totalOccurrences,
      positiveResponses: positiveCount,
      negativeResponses: negativeCount,
      neutralResponses: neutralCount,
      unanalyzedResponses: Math.max(0, totalOccurrences - analyzedPairs),
      alignmentScore: Math.round(alignmentScore * 10) / 10,
      details: {
        positiveRate:
          analyzedPairs > 0 ? (positiveCount / analyzedPairs) * 100 : 0,
        negativeRate:
          analyzedPairs > 0 ? (negativeCount / analyzedPairs) * 100 : 0,
        neutralRate:
          analyzedPairs > 0 ? (neutralCount / analyzedPairs) * 100 : 0,
        analysisRate:
          totalOccurrences > 0 ? (analyzedPairs / totalOccurrences) * 100 : 0,
      },
      examples,

      // Extensions spécifiques à la thèse
      thesisAnalyses: analyses,
      actionDescriptionMetrics: actionMetrics,
      processingModeDistribution: processingDistrib,
      hypothesesSupport: hypothesesSupport,
    };
  }

  /**
   * Validation de données compatible avec la taxonomie de la thèse
   */
  private validateTurnData(turn: TaggedTurn): boolean {
    // Validation de base
    if (!turn.verbatim || turn.verbatim.trim().length < 5) return false;
    if (!turn.next_turn_verbatim || turn.next_turn_verbatim.trim().length < 3)
      return false;
    if (
      !turn.call_id ||
      typeof turn.start_time !== "number" ||
      typeof turn.end_time !== "number"
    )
      return false;
    if (turn.start_time >= turn.end_time) return false;

    // Validation spécifique à la taxonomie de la thèse
    const validConseillerTags = [
      "REFLET",
      "ENGAGEMENT",
      "EXPLICATION",
      "OUVERTURE",
      "REFLET_ACQ",
      "REFLET_JE",
      "REFLET_VOUS", // Sous-catégories REFLET
    ];

    const tagUpperCase = turn.tag?.toUpperCase();
    const isValidTag = validConseillerTags.some(
      (validTag) =>
        tagUpperCase === validTag || tagUpperCase?.startsWith(validTag)
    );

    return isValidTag;
  }

  /**
   * Diagnostic adapté à la thèse
   */
  public diagnosticThesisAlignment(): void {
    console.log("📊 DIAGNOSTIC ALIGNMENT SELON TAXONOMIE DE LA THÈSE");
    console.log("==================================================");

    const allData = this.getAllTurnTaggedData();
    console.log(`Données totales: ${allData.length} tours`);

    // Diagnostic par stratégie selon la taxonomie hiérarchisée
    const strategyCounts = {
      ENGAGEMENT: 0,
      OUVERTURE: 0,
      REFLET_VOUS: 0,
      REFLET_JE: 0,
      REFLET_ACQ: 0,
      EXPLICATION: 0,
      QUESTION: 0,
      AUTRES: 0,
    };

    allData.forEach((turn) => {
      const strategy = this.classifyConseillerStrategy(turn.verbatim);
      if (strategyCounts[strategy] !== undefined) {
        strategyCounts[strategy]++;
      } else {
        strategyCounts.AUTRES++;
      }
    });

    console.log("\n📈 DISTRIBUTION SELON TAXONOMIE HIÉRARCHISÉE:");
    Object.entries(strategyCounts).forEach(([strategy, count]) => {
      const percentage = ((count / allData.length) * 100).toFixed(1);
      const priority =
        this.THESIS_STRATEGY_PATTERNS[strategy as ConseillerStrategy]
          ?.actionPriority || 0;
      console.log(
        `${strategy}: ${count} tours (${percentage}%) - Priorité: ${priority}`
      );
    });

    // Test des prédictions de la thèse
    console.log("\n🧪 TEST DES PRÉDICTIONS THÉORIQUES:");

    const actionStrategies = allData.filter((turn) => {
      const strategy = this.classifyConseillerStrategy(turn.verbatim);
      return [
        ConseillerStrategy.ENGAGEMENT,
        ConseillerStrategy.OUVERTURE,
      ].includes(strategy);
    });

    const explanationStrategies = allData.filter((turn) => {
      const strategy = this.classifyConseillerStrategy(turn.verbatim);
      return strategy === ConseillerStrategy.EXPLICATION;
    });

    const actionPositiveRate =
      this.calculatePositiveReactionRate(actionStrategies);
    const explanationPositiveRate = this.calculatePositiveReactionRate(
      explanationStrategies
    );

    console.log(
      `Actions (ENGAGEMENT/OUVERTURE): ${actionPositiveRate.toFixed(
        1
      )}% positif`
    );
    console.log(`Explications: ${explanationPositiveRate.toFixed(1)}% positif`);
    console.log(
      `Prédiction H1 ${
        actionPositiveRate > explanationPositiveRate
          ? "✓ VALIDÉE"
          : "✗ INVALIDÉE"
      }`
    );

    // Diagnostic des modes de traitement cognitif
    console.log("\n🧠 DISTRIBUTION DES MODES DE TRAITEMENT COGNITIF:");
    const processingModes = {
      [ProcessingMode.AUTOMATIC_MOTOR]: 0,
      [ProcessingMode.CONTROLLED_METAPHOR]: 0,
      [ProcessingMode.EMPATHIC_PROCESSING]: 0,
      [ProcessingMode.NEUTRAL_INFORMATION]: 0,
    };

    allData.forEach((turn) => {
      const strategy = this.classifyConseillerStrategy(turn.verbatim);
      const config = this.THESIS_STRATEGY_PATTERNS[strategy];
      if (config) {
        processingModes[config.cognitiveProcessing]++;
      }
    });

    Object.entries(processingModes).forEach(([mode, count]) => {
      const percentage = ((count / allData.length) * 100).toFixed(1);
      console.log(`${mode}: ${count} tours (${percentage}%)`);
    });
  }

  private calculatePositiveReactionRate(turns: TaggedTurn[]): number {
    if (turns.length === 0) return 0;

    const positiveReactions = turns.filter((turn) => {
      const reaction = this.classifyClientReaction(
        turn.next_turn_verbatim || ""
      );
      return reaction === ClientReaction.POSITIF;
    }).length;

    return (positiveReactions / turns.length) * 100;
  }

  /**
   * Export pour validation scientifique
   */
  public getThesisScientificValidation() {
    return {
      algorithmName: "ConversationalPatternAlgorithm - Taxonomie Thèse",
      theoreticalFramework:
        "Linguistique Interactionnelle + Sciences Cognitives + Cognition Incarnée",

      thesisIntegration: {
        taxonomyAlignment: "Classification hiérarchisée action > explication",
        priorityRule: "Description d'action prime sur autres fonctions",
        cognitiveFramework: "Traitement automatique vs contrôlé",
        hypothesesTested: [
          "H1: Actions > Explications",
          "H2: Mécanismes cognitifs différentiels",
          "H3: Applications pratiques",
        ],
      },

      keyInnovations: [
        "Première implémentation computationnelle de la taxonomie hiérarchisée",
        "Intégration directe neurones miroirs + métaphores conceptuelles",
        "Validation empirique des hypothèses de la thèse",
        "Framework de test automatisé pour linguistique appliquée cognitive",
      ],

      validationMetrics: {
        taxonomyConsistency: "Classification selon règle de priorité action",
        cognitiveCoherence:
          "Prédictions basées sur traitement automatique/contrôlé",
        empiricalValidation: "Test H1/H2/H3 sur corpus authentique",
        practicalTransferability:
          "Recommandations directes pour formation conseillers",
      },

      differenceWithPreviousVersion: [
        "Taxonomie alignée sur chapitre 3.2.1.1 de la thèse",
        "Classification ConseillerStrategy vs ConseillerActionType",
        "Règle de priorité: action > empathie > explication",
        "Métriques validant hypothèses H1/H2/H3 spécifiquement",
        "Diagnostic adapté aux prédictions théoriques de la thèse",
      ],
    };
  }

  // Méthodes héritées adaptées
  protected getAllTurnTaggedData(): TaggedTurn[] {
    return (this as any).data || [];
  }

  private createEmptyAnalysis(): AlignmentAnalysis {
    return {
      reflet: this.createEmptyThesisResult("REFLET"),
      engagement: this.createEmptyThesisResult("ENGAGEMENT"),
      explication: this.createEmptyThesisResult("EXPLICATION"),
      ouverture: this.createEmptyThesisResult("OUVERTURE"),
      globalStats: {
        totalAnalyzedTurns: 0,
        totalResponseTurns: 0,
        totalAnalyzableResponses: 0,
        overallAlignmentScore: 0,
        overallAnalysisRate: 0,
      },
    };
  }

  private calculateGlobalStatsCustom(
    results: Partial<AlignmentAnalysis>
  ): AlignmentAnalysis["globalStats"] {
    const allResults = Object.values(results).filter(
      Boolean
    ) as ThesisAlignmentResult[];

    if (allResults.length === 0) {
      return {
        totalAnalyzedTurns: 0,
        totalResponseTurns: 0,
        totalAnalyzableResponses: 0,
        overallAlignmentScore: 0,
        overallAnalysisRate: 0,
      };
    }

    const totalAnalyzedTurns = allResults.reduce(
      (sum, r) => sum + r.totalOccurrences,
      0
    );
    const totalResponseTurns = allResults.reduce(
      (sum, r) =>
        sum + r.positiveResponses + r.negativeResponses + r.neutralResponses,
      0
    );
    const totalAnalyzableResponses = allResults.reduce(
      (sum, r) =>
        sum +
        r.positiveResponses +
        r.negativeResponses +
        r.neutralResponses +
        r.unanalyzedResponses,
      0
    );

    const weightedScore = allResults.reduce(
      (sum, r) => sum + r.alignmentScore * r.totalOccurrences,
      0
    );
    const overallAlignmentScore =
      totalAnalyzedTurns > 0 ? weightedScore / totalAnalyzedTurns : 0;
    const overallAnalysisRate =
      totalAnalyzableResponses > 0
        ? (totalResponseTurns / totalAnalyzableResponses) * 100
        : 0;

    return {
      totalAnalyzedTurns,
      totalResponseTurns,
      totalAnalyzableResponses,
      overallAlignmentScore: Math.max(0, Math.min(100, overallAlignmentScore)),
      overallAnalysisRate: Math.max(0, Math.min(100, overallAnalysisRate)),
    };
  }
}
