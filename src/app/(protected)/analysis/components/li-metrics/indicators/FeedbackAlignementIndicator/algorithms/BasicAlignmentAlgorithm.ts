// BasicAlignmentAlgorithm.ts - Version refactorisée avec analyse de verbatim
import { TaggedTurn } from "@/context/TaggingDataContext";

export interface AlignmentResult {
  strategyFamily: string;
  totalOccurrences: number;
  positiveResponses: number;
  negativeResponses: number;
  neutralResponses: number;
  unanalyzedResponses: number; // Tours client trouvés mais non analysables
  alignmentScore: number;
  details: {
    positiveRate: number;
    negativeRate: number;
    neutralRate: number;
    analysisRate: number; // % de tours client analysés avec succès
  };
  examples: {
    positive: Array<{ verbatim: string; call_id: string }>;
    negative: Array<{ verbatim: string; call_id: string }>;
    neutral: Array<{ verbatim: string; call_id: string }>;
  };
}

export interface AlignmentAnalysis {
  reflet: AlignmentResult;
  engagement: AlignmentResult;
  explication: AlignmentResult;
  ouverture: AlignmentResult;
  globalStats: {
    totalAnalyzedTurns: number;
    totalResponseTurns: number;
    totalAnalyzableResponses: number;
    overallAlignmentScore: number;
    overallAnalysisRate: number;
  };
}

export interface SentimentAnalysisResult {
  sentiment: "POSITIF" | "NEGATIF" | "NEUTRE";
  confidence: number; // 0-1, confiance dans l'analyse
  keywords: string[]; // Mots-clés qui ont influencé la décision
}

export class BasicAlignmentAlgorithm {
  private data: TaggedTurn[];

  // Familles de stratégies conseiller
  private readonly CONSEILLER_FAMILIES = [
    "REFLET",
    "ENGAGEMENT",
    "EXPLICATION",
    "OUVERTURE",
  ];

  // Patterns pour identifier les tours client (utilisation des tags existants)
  private readonly CLIENT_TURN_PATTERNS = [
    "CLIENT",
    "POSITIF",
    "NEGATIF",
    "NEUTRE",
  ];

  // Dictionnaires de sentiment pour l'analyse de verbatim
  private readonly SENTIMENT_PATTERNS = {
    POSITIF: {
      words: [
        // Acquiescement explicite
        "oui",
        "si",
        "d'accord",
        "accord",
        "ok",
        "okay",
        "parfait",
        "excellent",
        "très bien",
        "tout à fait",
        "exactement",
        "absolument",
        "effectivement",

        // Expressions de satisfaction
        "merci",
        "super",
        "génial",
        "formidable",
        "magnifique",
        "parfaitement",
        "c'est bien",
        "c'est bon",
        "c'est parfait",
        "ça me va",
        "ça me convient",

        // Validation et encouragement
        "bonne idée",
        "excellente idée",
        "intéressant",
        "ça m'intéresse",
        "je suis intéressé",
        "pourquoi pas",
        "volontiers",
        "avec plaisir",

        // Expressions d'adhésion
        "je comprends",
        "je vois",
        "c'est clair",
        "logique",
        "cohérent",
      ],
      expressions: [
        "c'est une bonne",
        "ça me semble",
        "je suis d'accord",
        "tout à fait d'accord",
        "vous avez raison",
        "c'est vrai",
        "c'est exact",
        "ça marche",
        "allons-y",
        "je valide",
        "ça me plaît",
        "j'adhère",
        "je suis partant",
      ],
    },

    NEGATIF: {
      words: [
        // Refus explicite
        "non",
        "nan",
        "pas",
        "jamais",
        "aucun",
        "impossible",
        "refuse",
        "rejette",
        "inadmissible",
        "inacceptable",
        "hors de question",
        "pas question",

        // Expressions de désaccord
        "pas d'accord",
        "désaccord",
        "contre",
        "opposé",
        "réticent",
        "pas convaincu",
        "pas sûr",
        "doute",
        "sceptique",

        // Expressions de mécontentement
        "problème",
        "souci",
        "difficile",
        "compliqué",
        "embêtant",
        "gênant",
        "déçu",
        "mécontent",
        "insatisfait",
        "frustré",
        "énervé",
        "agacé",

        // Négation et objection
        "ne pas",
        "n'est pas",
        "ce n'est pas",
        "ça ne va pas",
        "ça ne marche pas",
        "objection",
        "mais",
        "cependant",
        "toutefois",
        "néanmoins",
      ],
      expressions: [
        "pas du tout",
        "absolument pas",
        "certainement pas",
        "sûrement pas",
        "je ne suis pas",
        "ce n'est pas",
        "ça ne me",
        "je refuse",
        "hors de question",
        "pas convaincu",
        "pas séduit",
        "ça ne m'intéresse pas",
        "je ne veux pas",
      ],
    },

    NEUTRE: {
      words: [
        // Questions et demandes d'information
        "comment",
        "pourquoi",
        "quand",
        "où",
        "qui",
        "quoi",
        "combien",
        "question",
        "demande",
        "précision",
        "détail",
        "explication",

        // Expressions d'hésitation
        "peut-être",
        "éventuellement",
        "possiblement",
        "probablement",
        "sans doute",
        "je ne sais pas",
        "on verra",
        "à voir",
        "réfléchir",
        "réflexion",

        // Expressions neutres
        "information",
        "renseignement",
        "clarification",
        "compréhension",
        "exemple",
        "illustration",
        "concrètement",
        "pratiquement",
      ],
      expressions: [
        "pouvez-vous",
        "pourriez-vous",
        "est-ce que",
        "qu'est-ce que",
        "j'aimerais savoir",
        "je voudrais comprendre",
        "dites-moi",
        "expliquez-moi",
        "par exemple",
        "c'est-à-dire",
        "concrètement",
        "dans les faits",
      ],
    },
  };

  constructor(turnTaggedData: TaggedTurn[]) {
    this.data = turnTaggedData;
    console.log(
      "🔍 BasicAlignmentAlgorithm initialisé avec",
      turnTaggedData.length,
      "turns"
    );
  }

  /**
   * Analyse l'alignement basé sur l'analyse de verbatim des réactions client
   */
  analyzeAlignment(): AlignmentAnalysis {
    console.log("🚀 Début analyse d'alignement par analyse de verbatim");

    const results: Partial<AlignmentAnalysis> = {};

    this.CONSEILLER_FAMILIES.forEach((family) => {
      const familyKey = family.toLowerCase() as keyof AlignmentAnalysis;
      if (familyKey !== "globalStats") {
        results[familyKey] = this.analyzeStrategyFamily(family);
      }
    });

    const globalStats = this.calculateGlobalStats(results);

    return {
      reflet: results.reflet!,
      engagement: results.engagement!,
      explication: results.explication!,
      ouverture: results.ouverture!,
      globalStats,
    };
  }

  /**
   * Analyse une famille de stratégie spécifique
   */
  private analyzeStrategyFamily(family: string): AlignmentResult {
    console.log(`\n🎯 Analyse famille: ${family}`);

    // Trouver tous les turns avec cette famille (stratégies conseiller)
    const familyTurns = this.data.filter(
      (turn) =>
        turn.family && turn.family.toUpperCase() === family.toUpperCase()
    );

    console.log(`📋 ${familyTurns.length} turns ${family} trouvés`);

    if (familyTurns.length === 0) {
      return this.createEmptyResult(family);
    }

    // Analyser les réactions client pour chaque turn
    let positiveResponses = 0;
    let negativeResponses = 0;
    let neutralResponses = 0;
    let unanalyzedResponses = 0;

    const examples = {
      positive: [] as Array<{ verbatim: string; call_id: string }>,
      negative: [] as Array<{ verbatim: string; call_id: string }>,
      neutral: [] as Array<{ verbatim: string; call_id: string }>,
    };

    familyTurns.forEach((turn) => {
      const clientResponse = this.findClientResponse(turn);

      if (clientResponse) {
        const analysis = this.analyzeVerbatimSentiment(clientResponse.verbatim);

        if (analysis) {
          console.log(
            `   Turn ${
              turn.id
            }: ${family} → "${clientResponse.verbatim.substring(0, 50)}..." → ${
              analysis.sentiment
            } (${analysis.confidence.toFixed(2)})`
          );

          // Compter les réponses
          switch (analysis.sentiment) {
            case "POSITIF":
              positiveResponses++;
              if (examples.positive.length < 3) {
                examples.positive.push({
                  verbatim: clientResponse.verbatim,
                  call_id: turn.call_id,
                });
              }
              break;
            case "NEGATIF":
              negativeResponses++;
              if (examples.negative.length < 3) {
                examples.negative.push({
                  verbatim: clientResponse.verbatim,
                  call_id: turn.call_id,
                });
              }
              break;
            case "NEUTRE":
              neutralResponses++;
              if (examples.neutral.length < 3) {
                examples.neutral.push({
                  verbatim: clientResponse.verbatim,
                  call_id: turn.call_id,
                });
              }
              break;
          }
        } else {
          unanalyzedResponses++;
          console.log(
            `   Turn ${
              turn.id
            }: ${family} → "${clientResponse.verbatim.substring(
              0,
              50
            )}..." → NON ANALYSABLE`
          );
        }
      }
    });

    return this.calculateFamilyMetrics(
      family,
      familyTurns.length,
      positiveResponses,
      negativeResponses,
      neutralResponses,
      unanalyzedResponses,
      examples
    );
  }

  /**
   * Trouve la réponse client associée à un tour conseiller
   */
  private findClientResponse(
    conseillerTurn: TaggedTurn
  ): { verbatim: string } | null {
    // Méthode 1: Utiliser next_turn_verbatim si disponible et si c'est un tour client
    if (conseillerTurn.next_turn_verbatim && conseillerTurn.next_turn_tag) {
      if (this.isClientTag(conseillerTurn.next_turn_tag)) {
        return { verbatim: conseillerTurn.next_turn_verbatim };
      }
    }

    // Méthode 2: Chercher le prochain turn client dans la séquence temporelle
    const nextClientTurn = this.findNextClientTurn(conseillerTurn);
    if (nextClientTurn) {
      return { verbatim: nextClientTurn.verbatim };
    }

    return null;
  }

  /**
   * Vérifie si un tag correspond à un tour client
   */
  private isClientTag(tag: string): boolean {
    const upperTag = tag.toUpperCase();
    return this.CLIENT_TURN_PATTERNS.some((pattern) =>
      upperTag.includes(pattern)
    );
  }

  /**
   * Trouve le prochain turn client dans la séquence temporelle
   */
  private findNextClientTurn(conseillerTurn: TaggedTurn): TaggedTurn | null {
    // Chercher le prochain turn de client dans la même conversation
    const nextTurns = this.data
      .filter(
        (turn) =>
          turn.call_id === conseillerTurn.call_id &&
          turn.start_time > conseillerTurn.end_time &&
          turn.start_time < conseillerTurn.end_time + 60 // Max 60 secondes après
      )
      .sort((a, b) => a.start_time - b.start_time);

    // Retourner le premier turn qui est identifié comme un tour client
    for (const turn of nextTurns) {
      if (turn.tag && this.isClientTag(turn.tag)) {
        return turn;
      }
    }

    return null;
  }

  /**
   * Analyse le sentiment d'un verbatim client
   */
  private analyzeVerbatimSentiment(
    verbatim: string
  ): SentimentAnalysisResult | null {
    if (!verbatim || verbatim.trim().length < 3) {
      return null; // Verbatim trop court pour être analysé
    }

    const text = verbatim.toLowerCase().trim();

    // Scores pour chaque sentiment
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    const foundKeywords: string[] = [];

    // Analyser les mots individuels
    Object.entries(this.SENTIMENT_PATTERNS).forEach(([sentiment, patterns]) => {
      patterns.words.forEach((word) => {
        if (text.includes(word.toLowerCase())) {
          foundKeywords.push(word);
          const score = this.calculateWordScore(word, text);

          switch (sentiment) {
            case "POSITIF":
              positiveScore += score;
              break;
            case "NEGATIF":
              negativeScore += score;
              break;
            case "NEUTRE":
              neutralScore += score;
              break;
          }
        }
      });

      // Analyser les expressions
      patterns.expressions.forEach((expression) => {
        if (text.includes(expression.toLowerCase())) {
          foundKeywords.push(expression);
          const score = this.calculateExpressionScore(expression, text);

          switch (sentiment) {
            case "POSITIF":
              positiveScore += score * 1.5; // Les expressions ont plus de poids
              break;
            case "NEGATIF":
              negativeScore += score * 1.5;
              break;
            case "NEUTRE":
              neutralScore += score * 1.5;
              break;
          }
        }
      });
    });

    // Déterminer le sentiment dominant
    const maxScore = Math.max(positiveScore, negativeScore, neutralScore);

    if (maxScore === 0) {
      return null; // Aucun pattern trouvé
    }

    let sentiment: "POSITIF" | "NEGATIF" | "NEUTRE";
    let confidence: number;

    if (positiveScore === maxScore) {
      sentiment = "POSITIF";
      confidence =
        positiveScore / (positiveScore + negativeScore + neutralScore);
    } else if (negativeScore === maxScore) {
      sentiment = "NEGATIF";
      confidence =
        negativeScore / (positiveScore + negativeScore + neutralScore);
    } else {
      sentiment = "NEUTRE";
      confidence =
        neutralScore / (positiveScore + negativeScore + neutralScore);
    }

    // Ajuster la confiance selon le contexte
    confidence = this.adjustConfidenceByContext(text, sentiment, confidence);

    return {
      sentiment,
      confidence: Math.min(confidence, 1.0),
      keywords: foundKeywords,
    };
  }

  /**
   * Calcule le score d'un mot selon son contexte
   */
  private calculateWordScore(word: string, text: string): number {
    let score = 1;

    // Augmenter le score si le mot est répété
    const occurrences = (text.match(new RegExp(word.toLowerCase(), "g")) || [])
      .length;
    score *= Math.min(occurrences, 3); // Maximum x3

    // Augmenter le score si le mot est en début ou fin de phrase
    if (
      text.startsWith(word.toLowerCase()) ||
      text.endsWith(word.toLowerCase())
    ) {
      score *= 1.2;
    }

    return score;
  }

  /**
   * Calcule le score d'une expression
   */
  private calculateExpressionScore(expression: string, text: string): number {
    let score = 2; // Les expressions ont un score de base plus élevé

    // Augmenter le score si l'expression est complète et isolée
    const regex = new RegExp(`\\b${expression.toLowerCase()}\\b`);
    if (regex.test(text)) {
      score *= 1.5;
    }

    return score;
  }

  /**
   * Ajuste la confiance selon le contexte
   */
  private adjustConfidenceByContext(
    text: string,
    sentiment: string,
    confidence: number
  ): number {
    // Réduire la confiance si le texte contient des négations
    const negationPatterns = [
      "ne pas",
      "n'est pas",
      "pas vraiment",
      "pas du tout",
    ];
    const hasNegation = negationPatterns.some((pattern) =>
      text.includes(pattern)
    );

    if (hasNegation && sentiment === "POSITIF") {
      confidence *= 0.7; // Réduire la confiance pour les faux positifs
    }

    // Réduire la confiance pour les textes très courts
    if (text.length < 10) {
      confidence *= 0.8;
    }

    // Augmenter la confiance pour les textes avec plusieurs indicateurs cohérents
    const wordCount = text.split(" ").length;
    if (wordCount > 20) {
      confidence *= 1.1;
    }

    return confidence;
  }

  /**
   * Calcule les métriques pour une famille
   */
  private calculateFamilyMetrics(
    family: string,
    totalOccurrences: number,
    positiveResponses: number,
    negativeResponses: number,
    neutralResponses: number,
    unanalyzedResponses: number,
    examples: AlignmentResult["examples"]
  ): AlignmentResult {
    const totalAnalyzedResponses =
      positiveResponses + negativeResponses + neutralResponses;
    const totalFoundResponses = totalAnalyzedResponses + unanalyzedResponses;

    // Calculer les taux sur les réponses analysées
    const positiveRate =
      totalAnalyzedResponses > 0
        ? (positiveResponses / totalAnalyzedResponses) * 100
        : 0;
    const negativeRate =
      totalAnalyzedResponses > 0
        ? (negativeResponses / totalAnalyzedResponses) * 100
        : 0;
    const neutralRate =
      totalAnalyzedResponses > 0
        ? (neutralResponses / totalAnalyzedResponses) * 100
        : 0;
    const analysisRate =
      totalFoundResponses > 0
        ? (totalAnalyzedResponses / totalFoundResponses) * 100
        : 0;

    // Score d'alignement : % de réponses positives parmi les analysées
    const alignmentScore = positiveRate;

    console.log(
      `✅ ${family}: ${alignmentScore.toFixed(
        1
      )}% d'alignement (${positiveResponses}+/${totalAnalyzedResponses} analysées, ${analysisRate.toFixed(
        1
      )}% taux d'analyse)`
    );

    return {
      strategyFamily: family,
      totalOccurrences,
      positiveResponses,
      negativeResponses,
      neutralResponses,
      unanalyzedResponses,
      alignmentScore: Math.round(alignmentScore * 10) / 10,
      details: {
        positiveRate: Math.round(positiveRate * 10) / 10,
        negativeRate: Math.round(negativeRate * 10) / 10,
        neutralRate: Math.round(neutralRate * 10) / 10,
        analysisRate: Math.round(analysisRate * 10) / 10,
      },
      examples,
    };
  }

  /**
   * Crée un résultat vide pour une famille sans données
   */
  private createEmptyResult(family: string): AlignmentResult {
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
      examples: {
        positive: [],
        negative: [],
        neutral: [],
      },
    };
  }

  /**
   * Calcule les statistiques globales
   */
  private calculateGlobalStats(
    results: Partial<AlignmentAnalysis>
  ): AlignmentAnalysis["globalStats"] {
    const strategies = Object.values(results).filter(
      Boolean
    ) as AlignmentResult[];

    const totalAnalyzedTurns = strategies.reduce(
      (sum, strategy) => sum + strategy.totalOccurrences,
      0
    );
    const totalResponseTurns = strategies.reduce(
      (sum, strategy) =>
        sum +
        strategy.positiveResponses +
        strategy.negativeResponses +
        strategy.neutralResponses,
      0
    );
    const totalAnalyzableResponses = strategies.reduce(
      (sum, strategy) =>
        sum +
        strategy.positiveResponses +
        strategy.negativeResponses +
        strategy.neutralResponses +
        strategy.unanalyzedResponses,
      0
    );

    const weightedAlignmentSum = strategies.reduce((sum, strategy) => {
      const weight =
        strategy.positiveResponses +
        strategy.negativeResponses +
        strategy.neutralResponses;
      return sum + strategy.alignmentScore * weight;
    }, 0);

    const overallAlignmentScore =
      totalResponseTurns > 0 ? weightedAlignmentSum / totalResponseTurns : 0;
    const overallAnalysisRate =
      totalAnalyzableResponses > 0
        ? (totalResponseTurns / totalAnalyzableResponses) * 100
        : 0;

    console.log("\n📊 Statistiques globales:");
    console.log(`   Tours analysés: ${totalAnalyzedTurns}`);
    console.log(
      `   Réponses analysées: ${totalResponseTurns}/${totalAnalyzableResponses} (${overallAnalysisRate.toFixed(
        1
      )}%)`
    );
    console.log(`   Score global: ${overallAlignmentScore.toFixed(1)}%`);

    return {
      totalAnalyzedTurns,
      totalResponseTurns,
      totalAnalyzableResponses,
      overallAlignmentScore: Math.round(overallAlignmentScore * 10) / 10,
      overallAnalysisRate: Math.round(overallAnalysisRate * 10) / 10,
    };
  }

  /**
   * Méthode de diagnostic pour vérifier la structure des données (compatibilité)
   */
  public diagnoseData(): void {
    console.log("🔍 DIAGNOSTIC DES DONNÉES");
    console.log("========================");

    // Vérifier les familles présentes
    const families = new Set(
      this.data.map((turn) => turn.family).filter(Boolean)
    );
    console.log("Familles trouvées:", Array.from(families));

    // Vérifier les tags next_turn_tag
    const nextTurnTags = new Set(
      this.data.map((turn) => turn.next_turn_tag).filter(Boolean)
    );
    console.log("Next turn tags trouvés:", Array.from(nextTurnTags));

    // Compter par famille
    this.CONSEILLER_FAMILIES.forEach((family) => {
      const count = this.data.filter(
        (turn) => turn.family?.toUpperCase() === family
      ).length;
      console.log(`${family}: ${count} turns`);
    });

    // Compter les tours client identifiés
    const clientTurns = this.data.filter(
      (turn) => turn.tag && this.isClientTag(turn.tag)
    );
    console.log(`Tours client identifiés: ${clientTurns.length}`);

    // Appeler aussi le nouveau diagnostic des verbatims
    this.diagnoseVerbatims();
  }

  /**
   * Méthode de diagnostic pour analyser la qualité des verbatims
   */
  public diagnoseVerbatims(): void {
    console.log("🔍 DIAGNOSTIC DES VERBATIMS CLIENT");
    console.log("==================================");

    const clientTurns = this.data.filter(
      (turn) => turn.tag && this.isClientTag(turn.tag)
    );

    console.log(`Turns client identifiés: ${clientTurns.length}`);

    // Analyser la longueur des verbatims
    const verbatimLengths = clientTurns
      .map((turn) => turn.verbatim?.length || 0)
      .filter((length) => length > 0);

    if (verbatimLengths.length > 0) {
      const avgLength =
        verbatimLengths.reduce((a, b) => a + b, 0) / verbatimLengths.length;
      console.log(
        `Longueur moyenne des verbatims: ${avgLength.toFixed(1)} caractères`
      );
      console.log(
        `Verbatims vides: ${clientTurns.length - verbatimLengths.length}`
      );
    }

    // Tester l'analyse de sentiment sur quelques exemples
    console.log("\n📋 Exemples d'analyse:");
    clientTurns.slice(0, 5).forEach((turn, i) => {
      if (turn.verbatim) {
        const analysis = this.analyzeVerbatimSentiment(turn.verbatim);
        console.log(`${i + 1}. "${turn.verbatim.substring(0, 60)}..."`);
        if (analysis) {
          console.log(
            `   → ${analysis.sentiment} (${analysis.confidence.toFixed(
              2
            )}) [${analysis.keywords.join(", ")}]`
          );
        } else {
          console.log(`   → NON ANALYSABLE`);
        }
      }
    });
  }
}
