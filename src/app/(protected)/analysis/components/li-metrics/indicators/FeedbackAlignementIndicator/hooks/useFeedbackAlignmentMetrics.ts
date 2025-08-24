// hooks/useFeedbackAlignmentMetrics.ts - Version adaptée à la taxonomie de la thèse
import { useState, useEffect, useMemo } from "react";
import { useTaggingData, TaggedTurn } from "@/context/TaggingDataContext";
import {
  BasicAlignmentAlgorithm,
  AlignmentAnalysis,
} from "../algorithms/BasicAlignmentAlgorithm";

// 🆕 IMPORTS CORRIGÉS pour la taxonomie de la thèse
import {
  ConversationalPatternAlgorithm,
  ConseillerStrategy,
  ClientReaction,
  ProcessingMode,
  ThesisConversationalAnalysis,
  ThesisAlignmentResult,
} from "../algorithms/ConversationalPatternAlgorithm";

// 🆕 TYPES ADAPTÉS à la taxonomie de la thèse
export interface DetailedThesisResults {
  familyDetails: Record<string, FamilyThesisAnalysis>;
  globalMetrics: {
    totalTurns: number;
    totalAnalyzedPairs: number;
    overallScore: number;
    coverage: number;
    bestFamily: { name: string; score: number } | null;
    hypothesesSupport: {
      h1_differential_effectiveness: number;
      h2_cognitive_mechanisms: number;
      h3_practical_transferability: number;
    };
  };
}

export interface FamilyThesisAnalysis {
  totalTours: number;
  scoreGlobal: number;
  familyGoal: "VALIDATION" | "INFORMATION" | "ACTION" | "ENGAGEMENT";
  familyDescription: string;
  strategiesConseiller: Record<ConseillerStrategy, StrategyConseillerDetails>;
  actionDescriptionMetrics: {
    engagement_effectiveness: number;
    ouverture_effectiveness: number;
    explanation_resistance: number;
  };
  processingModeDistribution: {
    automatic_motor: number;
    controlled_metaphor: number;
    empathic_processing: number;
    neutral_information: number;
  };
}

export interface StrategyConseillerDetails {
  count: number;
  percentage: number;
  actionPriority: number;
  cognitiveProcessing: ProcessingMode;
  expectedEffectiveness: number;
  conseillerExamples: string[];
  reactionsClient: Record<ClientReaction, ReactionClientDetails>;
}

export interface ReactionClientDetails {
  count: number;
  supportForStrategy: number;
  examples: ThesisDetailedExample[];
}

export interface ThesisDetailedExample {
  conseillerVerbatim: string;
  clientVerbatim: string;
  callId: string;
  actionDescriptionScore: number;
  cognitiveLoadEstimate: number;
  conflictManagementSuccess: number;
  h1_actionEffectiveness: boolean;
  h2_cognitiveProcessing: ProcessingMode;
  h3_practicalApplication: string;
  explanation: string;
  timestamp?: string;
}

// 🆕 COMPATIBILITÉ avec l'ancienne interface
export type DetailedLICAResults = DetailedThesisResults;
export type FamilyDetailedAnalysis = FamilyThesisAnalysis;
export type ActionConseillerDetails = StrategyConseillerDetails;
export type StrategyClientDetails = ReactionClientDetails;
export type DetailedExample = ThesisDetailedExample;

// Aliases pour compatibilité descendante
export const ConseillerActionType = ConseillerStrategy;
export const ClientResponseStrategy = ClientReaction;
export type SequentialAlignment =
  | "preferred"
  | "dispreferred"
  | "misaligned"
  | "neutral";
export type ConversationalAnalysis = ThesisConversationalAnalysis;

interface FeedbackAlignmentMetricsProps {
  selectedOrigin?: string | null;
  algorithmType?: "basic" | "conversational-pattern" | "comparison";
  enableDetailedResults?: boolean;
}

interface AlgorithmComparison {
  basic: AlignmentAnalysis;
  conversationalPattern: AlignmentAnalysis;
  convergenceAnalysis: {
    correlation: number;
    divergences: Array<{
      family: string;
      basicScore: number;
      licaScore: number;
      difference: number;
      interpretation: string;
    }>;
    overallConvergence: "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT";
  };
}

export const useFeedbackAlignmentMetrics = ({
  selectedOrigin,
  algorithmType = "basic",
  enableDetailedResults = false,
}: FeedbackAlignmentMetricsProps = {}) => {
  const {
    allTurnTagged,
    loadingGlobalData,
    errorGlobalData,
    fetchAllTurnTagged,
    refreshGlobalDataIfNeeded,
  } = useTaggingData();

  // États existants conservés
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] =
    useState<AlignmentAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [comparisonResults, setComparisonResults] =
    useState<AlgorithmComparison | null>(null);
  const [selectedAlgorithmDetails, setSelectedAlgorithmDetails] =
    useState<any>(null);

  // Nouveaux états pour l'interface détaillée
  const [detailedThesisResults, setDetailedThesisResults] =
    useState<DetailedThesisResults | null>(null);
  const [isLoadingDetailed, setIsLoadingDetailed] = useState(false);

  // Traitement des données
  const processedData = useMemo(() => {
    if (!allTurnTagged?.length) return [];

    console.log("Traitement des données pour l'analyse...");
    console.log(`Données brutes: ${allTurnTagged.length} turns`);
    console.log(`Type d'algorithme: ${algorithmType}`);

    let filtered = allTurnTagged;

    // Filtrer par origine si spécifiée
    if (selectedOrigin) {
      filtered = filtered.filter(
        (turn) => (turn as any).call_origine === selectedOrigin
      );
      console.log(
        `Après filtre origine "${selectedOrigin}": ${filtered.length} turns`
      );
    }

    // Filtrage strict pour LI-CA
    if (
      algorithmType === "conversational-pattern" ||
      algorithmType === "comparison"
    ) {
      console.log("Application du filtrage strict LI-CA...");

      const beforeLicaFilter = filtered.length;
      filtered = filtered.filter((turn) => {
        // Vérifier tag conseiller valide
        if (
          !turn.tag ||
          !["REFLET", "ENGAGEMENT", "EXPLICATION", "OUVERTURE"].includes(
            turn.tag.toUpperCase()
          )
        ) {
          return false;
        }

        // Vérifier verbatim conseiller valide
        if (!turn.verbatim || turn.verbatim.trim().length < 5) {
          return false;
        }

        // Vérifier réponse client valide
        if (
          !turn.next_turn_verbatim ||
          turn.next_turn_verbatim.trim().length < 3
        ) {
          return false;
        }

        // Vérifier données de base
        if (
          !turn.call_id ||
          typeof turn.start_time !== "number" ||
          typeof turn.end_time !== "number"
        ) {
          return false;
        }

        // Vérifier cohérence temporelle
        if (turn.start_time >= turn.end_time) {
          return false;
        }

        return true;
      });

      console.log(
        `FILTRAGE LI-CA: ${filtered.length}/${beforeLicaFilter} tours valides`
      );

      if (filtered.length === 0) {
        console.error("AUCUNE PAIRE CONSEILLER→CLIENT VALIDE pour LI-CA");
      }
    }

    // Enrichir les données
    const enriched = filtered.map((turn) => ({
      ...turn,
      family: turn.family || extractFamilyFromTag(turn.tag),
      originespeaker: (turn as any).originespeaker || "unknown",
    }));

    console.log(`Données enrichies finales: ${enriched.length} turns`);
    return enriched;
  }, [allTurnTagged, selectedOrigin, algorithmType]);

  const extractFamilyFromTag = (tag: string): string | undefined => {
    const familyMapping: Record<string, string> = {
      REFLET: "REFLET",
      ENGAGEMENT: "ENGAGEMENT",
      EXPLICATION: "EXPLICATION",
      OUVERTURE: "OUVERTURE",
    };

    const upperTag = tag?.toUpperCase() || "";
    return familyMapping[upperTag] || upperTag;
  };

  // Construction des résultats détaillés adaptée à la thèse
  const buildDetailedThesisResults = async (
    analysisResults: AlignmentAnalysis,
    originalValidData: TaggedTurn[]
  ): Promise<DetailedThesisResults> => {
    console.log(
      "Construction des résultats détaillés selon taxonomie thèse..."
    );

    const familyDetails: Record<string, FamilyThesisAnalysis> = {};

    // Traiter chaque famille
    ["REFLET", "ENGAGEMENT", "EXPLICATION", "OUVERTURE"].forEach((family) => {
      const familyKey = family.toLowerCase() as keyof AlignmentAnalysis;
      if (familyKey === "globalStats") return;

      const familyResult = analysisResults[familyKey] as ThesisAlignmentResult;
      const familyTurns = originalValidData.filter(
        (turn) => turn.tag?.toUpperCase() === family.toUpperCase()
      );

      if (familyResult && familyTurns.length > 0) {
        familyDetails[family] = buildFamilyThesisAnalysis(
          family,
          familyResult,
          familyTurns
        );
      }
    });

    // Calcul des métriques globales corrigées
    const globalStats = analysisResults.globalStats;
    const totalTurns = globalStats.totalAnalyzedTurns || 0;
    const totalResponses = globalStats.totalResponseTurns || 0;
    const overallScore = globalStats.overallAlignmentScore || 0;

    // Support des hypothèses de la thèse
    const hypothesesSupport = {
      h1_differential_effectiveness: calculateH1Support(familyDetails),
      h2_cognitive_mechanisms: calculateH2Support(familyDetails),
      h3_practical_transferability: calculateH3Support(familyDetails),
    };

    const globalMetrics = {
      totalTurns,
      totalAnalyzedPairs: totalResponses,
      overallScore,
      coverage:
        totalTurns > 0 ? Math.min(100, (totalResponses / totalTurns) * 100) : 0,
      bestFamily: calculateBestFamily(familyDetails),
      hypothesesSupport,
    };

    return {
      familyDetails,
      globalMetrics,
    };
  };

  const buildFamilyThesisAnalysis = (
    family: string,
    familyResult: ThesisAlignmentResult,
    familyTurns: TaggedTurn[]
  ): FamilyThesisAnalysis => {
    // Configuration selon la taxonomie de la thèse
    const familyGoals = {
      REFLET: {
        goal: "VALIDATION" as const,
        description: "Valider la compréhension mutuelle",
      },
      ENGAGEMENT: {
        goal: "ACTION" as const,
        description: "Obtenir un engagement d'action",
      },
      EXPLICATION: {
        goal: "INFORMATION" as const,
        description: "Transmettre information/procédure",
      },
      OUVERTURE: {
        goal: "ENGAGEMENT" as const,
        description: "Proposer une direction/solution",
      },
    };

    const familyGoal = familyGoals[family as keyof typeof familyGoals];
    const strategiesConseiller: Record<
      ConseillerStrategy,
      StrategyConseillerDetails
    > = {} as any;

    // Construire les stratégies selon la taxonomie de la thèse
    if (familyResult.thesisAnalyses) {
      const analysesByStrategy = groupAnalysesByConseillerStrategy(
        familyResult.thesisAnalyses
      );

      Object.values(ConseillerStrategy).forEach((strategy) => {
        const strategyAnalyses = analysesByStrategy[strategy] || [];

        if (strategyAnalyses.length > 0) {
          strategiesConseiller[strategy] = {
            count: strategyAnalyses.length,
            percentage:
              Math.round(
                (strategyAnalyses.length / familyResult.thesisAnalyses.length) *
                  100 *
                  10
              ) / 10,
            actionPriority: getStrategyPriority(strategy),
            cognitiveProcessing: strategyAnalyses[0].h2_cognitiveProcessing,
            expectedEffectiveness:
              calculateExpectedEffectiveness(strategyAnalyses),
            conseillerExamples: extractConseillerExamples(
              strategyAnalyses,
              familyTurns,
              3
            ),
            reactionsClient: buildReactionsClientDetails(
              strategyAnalyses,
              familyTurns
            ),
          };
        }
      });
    }

    return {
      totalTours: familyResult.totalOccurrences,
      scoreGlobal: familyResult.alignmentScore,
      familyGoal: familyGoal?.goal || "ENGAGEMENT",
      familyDescription: familyGoal?.description || "",
      strategiesConseiller,
      actionDescriptionMetrics: familyResult.actionDescriptionMetrics || {
        engagement_effectiveness: 0,
        ouverture_effectiveness: 0,
        explanation_resistance: 0,
      },
      processingModeDistribution: familyResult.processingModeDistribution || {
        automatic_motor: 0,
        controlled_metaphor: 0,
        empathic_processing: 0,
        neutral_information: 0,
      },
    };
  };

  // Fonctions utilitaires pour la construction des résultats
  const groupAnalysesByConseillerStrategy = (
    analyses: ThesisConversationalAnalysis[]
  ) => {
    const grouped: Record<ConseillerStrategy, ThesisConversationalAnalysis[]> =
      {} as any;

    Object.values(ConseillerStrategy).forEach((strategy) => {
      grouped[strategy] = [];
    });

    analyses.forEach((analysis) => {
      if (grouped[analysis.conseillerStrategy]) {
        grouped[analysis.conseillerStrategy].push(analysis);
      }
    });

    return grouped;
  };

  const getStrategyPriority = (strategy: ConseillerStrategy): number => {
    const priorities = {
      [ConseillerStrategy.ENGAGEMENT]: 100,
      [ConseillerStrategy.OUVERTURE]: 90,
      [ConseillerStrategy.REFLET_VOUS]: 80,
      [ConseillerStrategy.REFLET_JE]: 60,
      [ConseillerStrategy.REFLET_ACQ]: 40,
      [ConseillerStrategy.EXPLICATION]: 10,
      [ConseillerStrategy.QUESTION]: 50,
    };
    return priorities[strategy] || 0;
  };

  const calculateExpectedEffectiveness = (
    analyses: ThesisConversationalAnalysis[]
  ): number => {
    if (analyses.length === 0) return 0;
    const total = analyses.reduce(
      (sum, analysis) => sum + analysis.conflictManagementSuccess,
      0
    );
    return Math.round((total / analyses.length) * 100) / 100;
  };

  const extractConseillerExamples = (
    analyses: ThesisConversationalAnalysis[],
    familyTurns: TaggedTurn[],
    maxCount: number
  ): string[] => {
    return familyTurns
      .map((turn) => turn.verbatim)
      .filter((verbatim) => verbatim && verbatim.length > 10)
      .slice(0, maxCount);
  };

  const buildReactionsClientDetails = (
    analyses: ThesisConversationalAnalysis[],
    familyTurns: TaggedTurn[]
  ): Record<ClientReaction, ReactionClientDetails> => {
    const reactionsDetails: Record<ClientReaction, ReactionClientDetails> =
      {} as any;

    // Grouper par réaction client
    const analysesByReaction = groupAnalysesByClientReaction(analyses);

    Object.values(ClientReaction).forEach((reaction) => {
      const reactionAnalyses = analysesByReaction[reaction] || [];

      if (reactionAnalyses.length > 0) {
        reactionsDetails[reaction] = {
          count: reactionAnalyses.length,
          supportForStrategy: calculateSupportForStrategy(reactionAnalyses),
          examples: buildThesisDetailedExamples(
            reactionAnalyses,
            familyTurns
          ).slice(0, 3),
        };
      }
    });

    return reactionsDetails;
  };

  const groupAnalysesByClientReaction = (
    analyses: ThesisConversationalAnalysis[]
  ) => {
    const grouped: Record<ClientReaction, ThesisConversationalAnalysis[]> =
      {} as any;

    Object.values(ClientReaction).forEach((reaction) => {
      grouped[reaction] = [];
    });

    analyses.forEach((analysis) => {
      if (grouped[analysis.clientReaction]) {
        grouped[analysis.clientReaction].push(analysis);
      }
    });

    return grouped;
  };

  const calculateSupportForStrategy = (
    analyses: ThesisConversationalAnalysis[]
  ): number => {
    if (analyses.length === 0) return 0;
    const total = analyses.reduce(
      (sum, analysis) => sum + analysis.conflictManagementSuccess,
      0
    );
    return Math.round((total / analyses.length) * 100) / 100;
  };

  const buildThesisDetailedExamples = (
    analyses: ThesisConversationalAnalysis[],
    familyTurns: TaggedTurn[]
  ): ThesisDetailedExample[] => {
    return analyses.map((analysis, index) => {
      const correspondingTurn = familyTurns[index];
      return {
        conseillerVerbatim:
          correspondingTurn?.verbatim || "Verbatim conseiller",
        clientVerbatim:
          correspondingTurn?.next_turn_verbatim || "Verbatim client",
        callId: correspondingTurn?.call_id || "unknown",
        actionDescriptionScore: analysis.actionDescriptionScore,
        cognitiveLoadEstimate: analysis.cognitiveLoadEstimate,
        conflictManagementSuccess: analysis.conflictManagementSuccess,
        h1_actionEffectiveness: analysis.h1_actionEffectiveness,
        h2_cognitiveProcessing: analysis.h2_cognitiveProcessing,
        h3_practicalApplication: analysis.h3_practicalApplication,
        explanation: analysis.explanation,
        timestamp: correspondingTurn?.start_time
          ? formatTimestamp(correspondingTurn.start_time)
          : undefined,
      };
    });
  };

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Calcul des supports d'hypothèses
  const calculateH1Support = (
    familyDetails: Record<string, FamilyThesisAnalysis>
  ): number => {
    // H1: Actions > Explications
    const actionFamilies = ["ENGAGEMENT", "OUVERTURE"];
    const actionScores = actionFamilies.map(
      (family) => familyDetails[family]?.scoreGlobal || 0
    );
    const explanationScore = familyDetails["EXPLICATION"]?.scoreGlobal || 0;

    const avgActionScore =
      actionScores.length > 0
        ? actionScores.reduce((a, b) => a + b, 0) / actionScores.length
        : 0;
    return avgActionScore > explanationScore ? 1 : 0;
  };

  const calculateH2Support = (
    familyDetails: Record<string, FamilyThesisAnalysis>
  ): number => {
    // H2: Mécanismes cognitifs différentiels
    let totalSupport = 0;
    let count = 0;

    Object.values(familyDetails).forEach((family) => {
      const automaticProcessing =
        family.processingModeDistribution.automatic_motor;
      const controlledProcessing =
        family.processingModeDistribution.controlled_metaphor;
      if (automaticProcessing > 0 || controlledProcessing > 0) {
        totalSupport += automaticProcessing > controlledProcessing ? 1 : 0;
        count++;
      }
    });

    return count > 0 ? totalSupport / count : 0;
  };

  const calculateH3Support = (
    familyDetails: Record<string, FamilyThesisAnalysis>
  ): number => {
    // H3: Applicabilité pratique
    let totalApplications = 0;
    let positiveApplications = 0;

    Object.values(familyDetails).forEach((family) => {
      Object.values(family.strategiesConseiller).forEach((strategy) => {
        Object.values(strategy.reactionsClient).forEach((reaction) => {
          reaction.examples.forEach((example) => {
            totalApplications++;
            if (example.h3_practicalApplication.includes("✅")) {
              positiveApplications++;
            }
          });
        });
      });
    });

    return totalApplications > 0 ? positiveApplications / totalApplications : 0;
  };

  const calculateBestFamily = (
    familyDetails: Record<string, FamilyThesisAnalysis>
  ) => {
    const families = Object.entries(familyDetails);
    if (families.length === 0) return null;

    const best = families.reduce(
      (best, [name, data]) =>
        data.scoreGlobal > best.score
          ? { name, score: data.scoreGlobal }
          : best,
      { name: "", score: 0 }
    );

    return best.score > 0 ? best : null;
  };

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Vérification des données...");

        if (!allTurnTagged?.length || allTurnTagged.length < 3000) {
          console.log("Chargement complet des données turntagged...");
          await fetchAllTurnTagged({ limit: 5000 });
        } else {
          await refreshGlobalDataIfNeeded();
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setAnalysisError("Erreur lors du chargement des données");
      }
    };

    loadData();
  }, []);

  // Fonction d'analyse principale
  const runAnalysis = async () => {
    if (!processedData.length) {
      const errorMsg =
        algorithmType === "conversational-pattern"
          ? "Aucune paire conseiller→client valide pour l'analyse LI-CA"
          : "Aucune donnée disponible pour l'analyse";
      setAnalysisError(errorMsg);
      return;
    }

    try {
      setIsAnalyzing(true);
      setIsLoadingDetailed(enableDetailedResults);
      setAnalysisError(null);
      setAnalysisResults(null);
      setComparisonResults(null);
      setDetailedThesisResults(null);

      console.log(`Démarrage analyse ${algorithmType}...`);

      if (algorithmType === "comparison") {
        // Mode comparaison
        console.log("Mode comparaison - Analyse avec les deux algorithmes");

        const basicAlgorithm = new BasicAlignmentAlgorithm(processedData);
        const basicResults = basicAlgorithm.analyzeAlignment();

        const licaAlgorithm = new ConversationalPatternAlgorithm(processedData);
        licaAlgorithm.diagnosticThesisAlignment();
        const licaResults = licaAlgorithm.analyzeAlignment();

        const convergenceAnalysis = analyzeConvergence(
          basicResults,
          licaResults
        );

        const comparison: AlgorithmComparison = {
          basic: basicResults,
          conversationalPattern: licaResults,
          convergenceAnalysis,
        };

        setComparisonResults(comparison);
        setAnalysisResults(licaResults);

        if (enableDetailedResults) {
          const detailedResults = await buildDetailedThesisResults(
            licaResults,
            processedData
          );
          setDetailedThesisResults(detailedResults);
        }
      } else if (algorithmType === "conversational-pattern") {
        // Mode LI-CA seul
        console.log("Analyse ConversationalPatternAlgorithm (taxonomie thèse)");

        const algorithm = new ConversationalPatternAlgorithm(processedData);
        algorithm.diagnosticThesisAlignment();
        const results = algorithm.analyzeAlignment();

        setSelectedAlgorithmDetails(algorithm.getThesisScientificValidation());
        setAnalysisResults(results);

        if (enableDetailedResults) {
          const detailedResults = await buildDetailedThesisResults(
            results,
            processedData
          );
          setDetailedThesisResults(detailedResults);
        }
      } else {
        // Mode Basic
        console.log("Analyse BasicAlignmentAlgorithm");

        const algorithm = new BasicAlignmentAlgorithm(processedData);
        algorithm.diagnoseData();
        const results = algorithm.analyzeAlignment();

        setAnalysisResults(results);
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setAnalysisError(`Erreur d'analyse ${algorithmType}: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
      setIsLoadingDetailed(false);
    }
  };

  // Analyse de convergence
  const analyzeConvergence = (
    basicResults: AlignmentAnalysis,
    licaResults: AlignmentAnalysis
  ) => {
    const families = [
      "reflet",
      "engagement",
      "explication",
      "ouverture",
    ] as const;
    const divergences: Array<{
      family: string;
      basicScore: number;
      licaScore: number;
      difference: number;
      interpretation: string;
    }> = [];
    let totalCorrelation = 0;

    families.forEach((family) => {
      const basicScore = basicResults[family].alignmentScore;
      const licaScore = licaResults[family].alignmentScore;
      const difference = Math.abs(basicScore - licaScore);

      let interpretation = "";
      if (difference <= 10) {
        interpretation = "Convergence forte - Les deux algorithmes s'accordent";
      } else if (difference <= 20) {
        interpretation =
          "Convergence modérée - Différences méthodologiques mineures";
      } else if (difference <= 30) {
        interpretation = "Divergence notable - Approches complémentaires";
      } else {
        interpretation = "Divergence forte - Révèle des nuances importantes";
      }

      divergences.push({
        family: family.toUpperCase(),
        basicScore,
        licaScore,
        difference,
        interpretation,
      });

      totalCorrelation += (100 - difference) / 100;
    });

    const correlation = totalCorrelation / families.length;

    let overallConvergence: "STRONG" | "MODERATE" | "WEAK" | "DIVERGENT";
    if (correlation >= 0.8) overallConvergence = "STRONG";
    else if (correlation >= 0.6) overallConvergence = "MODERATE";
    else if (correlation >= 0.4) overallConvergence = "WEAK";
    else overallConvergence = "DIVERGENT";

    return {
      correlation,
      divergences,
      overallConvergence,
    };
  };

  // Auto-lancement de l'analyse
  useEffect(() => {
    if (processedData.length > 0 && !isAnalyzing) {
      console.log(`Auto-lancement de l'analyse ${algorithmType}...`);

      const timeoutId = setTimeout(() => {
        runAnalysis();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (processedData.length === 0 && !loadingGlobalData) {
      const errorMsg =
        algorithmType === "conversational-pattern"
          ? "Aucune paire conseiller→client valide trouvée pour LI-CA"
          : "Aucune donnée valide trouvée";
      setAnalysisError(errorMsg);
    }
  }, [
    processedData.length,
    algorithmType,
    isAnalyzing,
    loadingGlobalData,
    enableDetailedResults,
  ]);

  // Lignes de tableau
  const tableRows = useMemo(() => {
    if (!analysisResults) return [];

    const rows = [];

    if (algorithmType === "comparison" && comparisonResults) {
      rows.push({
        id: "basic",
        algorithm: "Sentiment Analysis (BasicAlgorithm)",
        reflet: comparisonResults.basic.reflet.alignmentScore,
        engagement: comparisonResults.basic.engagement.alignmentScore,
        explication: comparisonResults.basic.explication.alignmentScore,
        ouverture: comparisonResults.basic.ouverture.alignmentScore,
        details: comparisonResults.basic,
        algorithmType: "basic",
      });

      rows.push({
        id: "thesis",
        algorithm: "Thesis Taxonomy Analysis",
        reflet: comparisonResults.conversationalPattern.reflet.alignmentScore,
        engagement:
          comparisonResults.conversationalPattern.engagement.alignmentScore,
        explication:
          comparisonResults.conversationalPattern.explication.alignmentScore,
        ouverture:
          comparisonResults.conversationalPattern.ouverture.alignmentScore,
        details: comparisonResults.conversationalPattern,
        algorithmType: "conversational-pattern",
      });
    } else {
      const algorithmName =
        algorithmType === "conversational-pattern"
          ? "Thesis Taxonomy Analysis"
          : "Sentiment Analysis (BasicAlgorithm)";

      rows.push({
        id: "single",
        algorithm: algorithmName,
        reflet: analysisResults.reflet.alignmentScore,
        engagement: analysisResults.engagement.alignmentScore,
        explication: analysisResults.explication.alignmentScore,
        ouverture: analysisResults.ouverture.alignmentScore,
        details: analysisResults,
        algorithmType,
      });
    }

    return rows;
  }, [analysisResults, algorithmType, comparisonResults]);

  return {
    isAnalyzing,
    analysisResults,
    analysisError,
    comparisonResults,
    selectedAlgorithmDetails,
    detailedThesisResults,
    isLoadingDetailed,
    runAnalysis,
    tableRows,
  };
};
