// LICAAlgorithmTab.tsx - Version corrigée des erreurs TypeScript
import React, { useState } from "react";
import {
  Box,
  Alert,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  Psychology as LICAIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Science as ScienceIcon,
  Assignment as ReportIcon,
} from "@mui/icons-material";

// Composants shared réutilisés
import { IndicatorHeader } from "../../../../../shared/atoms/IndicatorHeader";
import { ColorLegend } from "../../../../../shared/atoms/ColorLegend";
import { ResultsTable } from "../../../../../shared/molecules/ResultsTable";
import { AlgorithmDetailDialog } from "../../../../../shared/atoms/AlgorithmDetailDialog";
import AlgorithmLogicExplanation from "../../../../../shared/molecules/AlgorithmLogicExplanation";

// Hook pour les métriques
import { useFeedbackAlignmentMetrics } from "../../hooks/useFeedbackAlignmentMetrics";

// Hooks partagés
import {
  useAlgorithmDialog,
  AlgorithmDetail,
} from "../../../../../shared/hooks/useAlgorithmDialog";

// Types
import { TableColumn } from "../../../../../shared/molecules/ResultsTable";
import type { ExtendedAlgorithmLogicProps } from "../../../../../shared/molecules/types";

// Types spécifiques à l'onglet LICA
interface LICAAlgorithmTabProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}

const LICAAlgorithmTab: React.FC<LICAAlgorithmTabProps> = ({
  selectedOrigin,
  showDetailedResults = false,
}) => {
  // Hook pour les données LICA Algorithm - UTILISATION DES PROPRIÉTÉS CORRECTES
  const {
    tableRows,
    analysisResults,
    analysisError,
    isAnalyzing,
    comparisonResults,
    runAnalysis,
    detailedThesisResults,
    isLoadingDetailed,
    selectedAlgorithmDetails,
  } = useFeedbackAlignmentMetrics({
    selectedOrigin,
    algorithmType: "conversational-pattern",
    enableDetailedResults: showDetailedResults,
  });

  // États locaux de l'onglet
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showAlgorithmLogic, setShowAlgorithmLogic] = useState(false);
  const [showThesisDetails, setShowThesisDetails] = useState(false);

  // Calculs dérivés depuis les données disponibles
  const stats = React.useMemo(() => {
    if (!analysisResults || !tableRows.length) return null;

    // Extraction des métriques depuis analysisResults
    const strategiesEntries = Object.entries(analysisResults).filter(
      ([key]) => key !== "globalStats"
    );

    // Calculs basés sur globalStats si disponible, sinon calculs manuels
    const globalStats = analysisResults.globalStats;

    const totalTurns =
      globalStats?.totalAnalyzedTurns ||
      strategiesEntries.reduce(
        (sum, [, result]) => sum + (result.totalOccurrences || 0),
        0
      );

    const totalResponses =
      globalStats?.totalResponseTurns ||
      strategiesEntries.reduce(
        (sum, [, result]) =>
          sum +
          (result.positiveResponses || 0) +
          (result.negativeResponses || 0) +
          (result.neutralResponses || 0),
        0
      );

    const overallScore =
      globalStats?.overallAlignmentScore ||
      strategiesEntries.reduce(
        (sum, [, result]) => sum + result.alignmentScore,
        0
      ) / strategiesEntries.length;

    const coverage =
      totalTurns > 0 ? Math.min(100, (totalResponses / totalTurns) * 100) : 0;

    // Trouver la meilleure stratégie
    const bestStrategy = strategiesEntries.reduce(
      (best, [name, result]) =>
        result.alignmentScore > best.score
          ? { name, score: result.alignmentScore }
          : best,
      { name: "", score: 0 }
    );

    // Construire le breakdown des stratégies
    const strategiesBreakdown: Record<string, any> = {};
    strategiesEntries.forEach(([name, result]) => {
      strategiesBreakdown[name] = {
        alignmentScore: result.alignmentScore,
        totalOccurrences: result.totalOccurrences,
        positiveRate:
          result.positiveResponses && result.totalOccurrences
            ? (result.positiveResponses / result.totalOccurrences) * 100
            : 0,
        negativeRate:
          result.negativeResponses && result.totalOccurrences
            ? (result.negativeResponses / result.totalOccurrences) * 100
            : 0,
        neutralRate:
          result.neutralResponses && result.totalOccurrences
            ? (result.neutralResponses / result.totalOccurrences) * 100
            : 0,
      };
    });

    return {
      totalTurns,
      totalResponses,
      overallScore,
      coverage,
      bestStrategy: bestStrategy.score > 0 ? bestStrategy : null,
      strategiesBreakdown,
    };
  }, [analysisResults, tableRows]);

  // Propriétés dérivées pour la compatibilité
  const isLoading = React.useMemo(() => {
    return isAnalyzing || isLoadingDetailed;
  }, [isAnalyzing, isLoadingDetailed]);

  const error = analysisError;

  // Fonction de refresh des données
  const refreshData = React.useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  // Calculs des informations de debug
  const debugInfo = React.useMemo(() => {
    if (!analysisResults) {
      return {
        families: [],
        nextTurnTags: [],
        origines: [],
        strategiesConseiller: [],
        reactionsClient: [],
      };
    }

    const families = Object.keys(analysisResults)
      .filter((key) => key !== "globalStats")
      .map((key) => key.toUpperCase());

    // Extraction des données détaillées si disponibles
    const strategiesConseiller: string[] = [];
    const reactionsClient: string[] = [];
    const nextTurnTags: string[] = [];
    const origines: string[] = [];

    if (detailedThesisResults?.familyDetails) {
      Object.values(detailedThesisResults.familyDetails).forEach((family) => {
        // Stratégies conseiller
        Object.keys(family.strategiesConseiller || {}).forEach((strategy) => {
          if (!strategiesConseiller.includes(strategy)) {
            strategiesConseiller.push(strategy);
          }
        });

        // Réactions client
        Object.values(family.strategiesConseiller || {}).forEach((strategy) => {
          Object.keys(strategy.reactionsClient || {}).forEach((reaction) => {
            if (!reactionsClient.includes(reaction)) {
              reactionsClient.push(reaction);
            }
            if (!nextTurnTags.includes(reaction)) {
              nextTurnTags.push(reaction);
            }
          });
        });
      });
    }

    // Ajouter l'origine sélectionnée si disponible
    if (selectedOrigin) {
      origines.push(selectedOrigin);
    }

    return {
      families,
      nextTurnTags,
      origines,
      strategiesConseiller,
      reactionsClient,
    };
  }, [analysisResults, detailedThesisResults, selectedOrigin]);

  // Propriétés calculées
  const dataCount = stats?.totalResponses || 0;
  const hasData = dataCount > 0;
  const sourceDataCount = stats?.totalTurns || 0;

  // Propriétés pour les résultats détaillés
  const detailedResults = detailedThesisResults;
  const hasDetailedResults = Boolean(detailedThesisResults?.familyDetails);

  // Fonctions pour l'analyse détaillée
  const enableDetailedAnalysis = React.useCallback(() => {
    console.log("Activation de l'analyse détaillée LICA");
    // Cette fonction pourrait déclencher une analyse plus approfondie
  }, []);

  const runDetailedAnalysis = React.useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  const getNavigationMetrics = React.useCallback(() => {
    if (!detailedThesisResults) return null;

    return {
      totalFamilies: Object.keys(detailedThesisResults.familyDetails).length,
      totalStrategies: Object.values(
        detailedThesisResults.familyDetails
      ).reduce(
        (sum, family) =>
          sum + Object.keys(family.strategiesConseiller || {}).length,
        0
      ),
      globalMetrics: detailedThesisResults.globalMetrics,
    };
  }, [detailedThesisResults]);

  // Configuration des algorithmes pour le dialog
  const algorithms: AlgorithmDetail[] = [
    {
      id: "lica_conversational_pattern",
      name: "LI-CA: Linguistic Intelligence - Conversational Analysis",
      description:
        "Algorithme d'analyse conversationnelle basé sur la taxonomie de la thèse, utilisant les mécanismes cognitifs et les patterns interactionnels pour mesurer l'efficacité des stratégies linguistiques du conseiller.",
      principle:
        "Analyse les patterns conversationnels selon la taxonomie académique définie dans la thèse, en évaluant l'alignement entre stratégies conseiller et réactions client selon des critères scientifiques validés.",
      source:
        "Thèse de doctorat - Taxonomie des stratégies conversationnelles et mécanismes cognitifs",
    },
  ];

  // Configuration complète avec taxonomie de la thèse
  const algorithmLogicConfig: ExtendedAlgorithmLogicProps = {
    algorithmName: "LI-CA: Linguistic Intelligence - Conversational Analysis",
    description:
      "Cet algorithme analyse les patterns conversationnels selon la taxonomie scientifique de la thèse, évaluant l'efficacité des stratégies conseiller par l'analyse des mécanismes cognitifs et des réactions client structurées.",

    steps: [
      {
        id: "step1",
        title: "Classification par Taxonomie Conseiller",
        description:
          "Classification des stratégies conseiller selon la taxonomie définie dans la thèse : ENGAGEMENT (action), OUVERTURE (proposition), REFLET (validation), EXPLICATION (information).",
        example:
          "ENGAGEMENT → ACTION_COMMITMENT, QUESTION_DIRECTIVE | REFLET → REFLET_VOUS, REFLET_JE, REFLET_ACQ",
        technical:
          "Mapping taxonomique: ConseillerStrategy enum → Family classification avec validation scientifique",
      },
      {
        id: "step2",
        title: "Classification par Taxonomie Client",
        description:
          "Classification des réactions client selon la taxonomie : ACQUIESCEMENT, RESISTANCE, QUESTIONNEMENT, ELABORATION, avec analyse des mécanismes cognitifs sous-jacents.",
        example:
          "ACQUIESCEMENT → ProcessingMode.AUTOMATIC_MOTOR | RESISTANCE → ProcessingMode.CONTROLLED_METAPHOR",
        technical:
          "Mapping ClientReaction enum → Cognitive processing mode analysis avec scoring d'alignement",
      },
      {
        id: "step3",
        title: "Analyse des Mécanismes Cognitifs",
        description:
          "Évaluation des mécanismes cognitifs impliqués dans chaque interaction selon la théorie des processus automatiques vs contrôlés.",
        example:
          "ENGAGEMENT + ACQUIESCEMENT → Automatic processing (score élevé) | EXPLICATION + RESISTANCE → Controlled processing (score faible)",
        technical:
          "ProcessingMode classification: automatic_motor, controlled_metaphor, empathic_processing, neutral_information",
      },
      {
        id: "step4",
        title: "Calcul des Scores d'Alignement Taxonomique",
        description:
          "Calcul des scores d'efficacité basés sur la congruence entre stratégie conseiller et réaction client selon la taxonomie validée.",
        example:
          "ENGAGEMENT → ACTION: score = 85% | EXPLICATION → RESISTANCE: score = 25%",
        technical:
          "Algorithme: alignment_score = (cognitive_processing_score × reaction_adequacy_score × conflict_management_success) / 3",
      },
      {
        id: "step5",
        title: "Validation des Hypothèses de Recherche",
        description:
          "Validation des trois hypothèses principales de la thèse : H1 (efficacité différentielle), H2 (mécanismes cognitifs), H3 (applicabilité pratique).",
        example:
          "H1: Actions > Explications (validé si score_actions > score_explications) | H2: Processus automatiques > contrôlés",
        technical:
          "Statistical validation: h1_differential_effectiveness, h2_cognitive_mechanisms, h3_practical_transferability",
      },
    ],

    metrics: [
      {
        name: "Score d'Alignement Taxonomique",
        description:
          "Mesure de la congruence entre stratégie conseiller et réaction client selon la classification taxonomique validée.",
        formula:
          "(Cognitive Processing Score × Reaction Adequacy × Conflict Management) / 3",
        interpretation:
          "Score élevé = alignement optimal selon la taxonomie scientifique de la thèse.",
      },
      {
        name: "Support des Hypothèses de Recherche",
        description:
          "Validation quantitative des trois hypothèses principales de la recherche doctorale.",
        formula:
          "H1: Σ(actions_effectiveness) / Σ(explanations_effectiveness) > 1.2",
        interpretation:
          "Valeurs proches de 1.0 = validation forte des hypothèses théoriques.",
      },
    ],

    theoreticalBackground: {
      theory:
        "L'analyse s'appuie sur la taxonomie conversationnelle développée dans la thèse, intégrant les théories cognitives de traitement automatique vs contrôlé et les mécanismes d'alignement interactionnel.",
      source:
        "Thèse de doctorat - Analyse linguistique computationnelle des interactions conseiller-client (2024)",
      keyPrinciples: [
        "Taxonomie scientifique des stratégies conseiller validée empiriquement",
        "Classification des réactions client selon les mécanismes cognitifs",
        "Évaluation de l'efficacité par mesure d'alignement taxonomique",
        "Validation des hypothèses de recherche par analyse quantitative",
      ],
    },

    interpretation: {
      scoreRanges: [
        {
          range: "≥ 85%",
          label: "Excellent (Taxonomie)",
          color: "success",
          meaning:
            "Alignement optimal selon la taxonomie - Validation forte des hypothèses de recherche",
        },
        {
          range: "70-84%",
          label: "Bon (Validé)",
          color: "info",
          meaning:
            "Alignement satisfaisant selon la classification taxonomique - Hypothèses partiellement validées",
        },
        {
          range: "50-69%",
          label: "Moyen (Mitigé)",
          color: "warning",
          meaning:
            "Alignement modéré - Mécanismes cognitifs mixtes, validation incertaine",
        },
        {
          range: "< 50%",
          label: "Faible (Non-validé)",
          color: "error",
          meaning:
            "Alignement faible - Hypothèses non validées, révision taxonomique nécessaire",
        },
      ],
      practicalAdvice: [
        "Analyser les stratégies avec score ≥85% pour identifier les patterns optimaux",
        "Examiner les mécanismes cognitifs des interactions efficaces",
        "Valider empiriquement les hypothèses H1, H2, H3 sur d'autres corpus",
        "Enrichir la taxonomie avec les patterns émergents identifiés",
      ],
    },
  };

  // Hook de gestion du dialog
  const { selectedAlgorithm, isOpen, openDialog, closeDialog } =
    useAlgorithmDialog(algorithms);

  // Configuration du tableau
  const tableColumns: TableColumn[] = [
    { key: "algorithm", label: "Algorithme", type: "text" },
    { key: "reflet", label: "REFLET", align: "center", type: "score" },
    { key: "engagement", label: "ENGAGEMENT", align: "center", type: "score" },
    {
      key: "explication",
      label: "EXPLICATION",
      align: "center",
      type: "score",
    },
    { key: "ouverture", label: "OUVERTURE", align: "center", type: "score" },
  ];

  // Fonction pour formater les scores avec couleur
  const getScoreColor = (score: number): string => {
    if (score >= 85) return "success.main";
    if (score >= 70) return "info.main";
    if (score >= 50) return "warning.main";
    return "error.main";
  };

  // Fonctions de traitement des données (avec typage corrigé)
  const renderFamilyChips = (family: string) => (
    <Chip
      key={family}
      label={family}
      size="small"
      variant="outlined"
      color="primary"
    />
  );

  const renderStrategyChips = (strategy: string) => (
    <Chip
      key={strategy}
      label={strategy}
      size="small"
      variant="outlined"
      color="secondary"
    />
  );

  const renderReactionChips = (reaction: string) => (
    <Chip
      key={reaction}
      label={reaction}
      size="small"
      variant="outlined"
      color="info"
    />
  );

  const renderOrigineChips = (origine: string) => (
    <Chip
      key={origine}
      label={origine}
      size="small"
      variant="outlined"
      color="primary"
    />
  );

  // Export des résultats avec types corrects
  const exportResults = () => {
    const data = {
      algorithm: "LI-CA-ConversationalPatternAnalysis",
      timestamp: new Date().toISOString(),
      origine: selectedOrigin || "toutes",
      results: analysisResults,
      stats: stats,
      detailedResults: detailedThesisResults,
      taxonomyValidation: selectedAlgorithmDetails,
    };
    console.log("Export des résultats LI-CA:", data);
    // Ici vous pourriez ajouter une vraie fonction d'export
  };

  // Gestion des erreurs
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Erreur d'analyse LI-CA</Typography>
          <Typography variant="body2">{error}</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshData}
            sx={{ mt: 1 }}
          >
            Recharger les données
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header spécifique à l'algorithme LI-CA */}
      <IndicatorHeader
        icon={LICAIcon}
        title="LI-CA: Linguistic Intelligence - Conversational Analysis"
        subtitle={`Analyse taxonomique selon la recherche doctorale - Validation des hypothèses scientifiques${
          selectedOrigin ? ` (${selectedOrigin})` : ""
        }`}
        color="secondary"
      />

      {/* Alerte explicative de la méthode */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Analyse taxonomique scientifique :</strong> Cet algorithme
          applique la taxonomie conversationnelle validée dans la thèse de
          doctorat, analysant les mécanismes cognitifs et l'alignement
          interactionnel selon des critères scientifiques rigoureux.
        </Typography>
      </Alert>

      {/* Informations sur les données */}
      <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">État des données LI-CA</Typography>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              {showDebugInfo ? "Masquer" : "Voir"} détails taxonomiques
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="primary">
                {sourceDataCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Paires conseiller-client
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="secondary">
                {dataCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Analyses taxonomiques
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography
                variant="h5"
                color={hasData ? "success.main" : "error.main"}
              >
                {debugInfo.families.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Familles validées
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="info.main">
                {debugInfo.strategiesConseiller.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stratégies conseiller
              </Typography>
            </Box>
          </Box>

          {/* Informations de debug taxonomique */}
          {showDebugInfo && (
            <Box sx={{ mt: 3 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    Détails de la taxonomie appliquée
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Familles taxonomiques:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {debugInfo.families.map(renderFamilyChips)}
                      </Box>
                    </Box>

                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Stratégies conseiller:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {debugInfo.strategiesConseiller
                          .slice(0, 6)
                          .map(renderStrategyChips)}
                        {debugInfo.strategiesConseiller.length > 6 && (
                          <Chip
                            label={`+${
                              debugInfo.strategiesConseiller.length - 6
                            }`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Réactions client:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {debugInfo.reactionsClient
                          .slice(0, 6)
                          .map(renderReactionChips)}
                        {debugInfo.reactionsClient.length > 6 && (
                          <Chip
                            label={`+${debugInfo.reactionsClient.length - 6}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Origines:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {debugInfo.origines.map(renderOrigineChips)}
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistiques globales LI-CA */}
      {stats && (
        <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <LICAIcon color="secondary" />
              Résultats de l'analyse taxonomique LI-CA
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {stats.totalTurns}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Paires analysées
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="secondary">
                  {stats.totalResponses}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Classifications validées
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color={getScoreColor(stats.overallScore)}
                >
                  {stats.overallScore.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Score taxonomique global
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  {stats.coverage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Couverture d'analyse
                </Typography>
              </Box>
            </Box>

            {/* Validation des hypothèses de recherche */}
            {detailedThesisResults?.globalMetrics.hypothesesSupport && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Validation des hypothèses de recherche :</strong>
                  <br />
                  H1 (Efficacité différentielle):{" "}
                  {(
                    detailedThesisResults.globalMetrics.hypothesesSupport
                      .h1_differential_effectiveness * 100
                  ).toFixed(1)}
                  %
                  <br />
                  H2 (Mécanismes cognitifs):{" "}
                  {(
                    detailedThesisResults.globalMetrics.hypothesesSupport
                      .h2_cognitive_mechanisms * 100
                  ).toFixed(1)}
                  %
                  <br />
                  H3 (Applicabilité pratique):{" "}
                  {(
                    detailedThesisResults.globalMetrics.hypothesesSupport
                      .h3_practical_transferability * 100
                  ).toFixed(1)}
                  %
                </Typography>
              </Alert>
            )}

            {/* Meilleure stratégie selon taxonomie */}
            {stats.bestStrategy && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Famille la plus efficace selon taxonomie :</strong>{" "}
                  {stats.bestStrategy.name.toUpperCase()} (
                  {stats.bestStrategy.score.toFixed(1)}% d'alignement
                  taxonomique)
                </Typography>
              </Alert>
            )}

            {/* Détail par stratégie */}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {Object.entries(stats.strategiesBreakdown).map(
                ([strategy, data]) => (
                  <Chip
                    key={strategy}
                    label={`${strategy.toUpperCase()}: ${data.alignmentScore.toFixed(
                      1
                    )}% (${data.totalOccurrences})`}
                    color={
                      data.alignmentScore >= 85
                        ? "success"
                        : data.alignmentScore >= 70
                        ? "info"
                        : data.alignmentScore >= 50
                        ? "warning"
                        : "error"
                    }
                    variant="outlined"
                    size="small"
                  />
                )
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* État de chargement */}
      {isLoading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
          }}
        >
          <CircularProgress size={40} sx={{ mr: 2 }} />
          <Typography variant="body1">
            {isAnalyzing
              ? "Analyse taxonomique LI-CA en cours..."
              : "Chargement des données pour classification..."}
          </Typography>
        </Box>
      )}

      {/* Alerte explicative des résultats */}
      {hasData && stats && (
        <Alert
          severity={
            stats.overallScore >= 85
              ? "success"
              : stats.overallScore >= 70
              ? "info"
              : stats.overallScore >= 50
              ? "warning"
              : "error"
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Résultat de l'analyse taxonomique LI-CA :</strong>{" "}
            {stats.overallScore >= 85
              ? `Score excellent (${stats.overallScore.toFixed(
                  1
                )}%) - Validation forte de la taxonomie et des hypothèses de recherche`
              : stats.overallScore >= 70
              ? `Score bon (${stats.overallScore.toFixed(
                  1
                )}%) - Taxonomie validée avec mécanismes cognitifs conformes aux attentes`
              : stats.overallScore >= 50
              ? `Score moyen (${stats.overallScore.toFixed(
                  1
                )}%) - Validation partielle, mécanismes cognitifs mixtes`
              : `Score faible (${stats.overallScore.toFixed(
                  1
                )}%) - Taxonomie non validée, révision des hypothèses nécessaire`}
          </Typography>
        </Alert>
      )}

      {/* Tableau factorisé avec données LI-CA */}
      {hasData && tableRows.length > 0 && (
        <ResultsTable
          columns={tableColumns}
          rows={tableRows}
          onInfoClick={(row) => {
            console.log("Clic sur info pour:", row.algorithm);
            openDialog(
              "LI-CA: Linguistic Intelligence - Conversational Analysis"
            );
          }}
          headerColor="secondary"
          scoreThresholds={{ excellent: 85, good: 70 }}
        />
      )}

      {/* Résultats détaillés de la thèse */}
      {hasDetailedResults && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Analyse détaillée selon la taxonomie de la thèse
              </Typography>
              <Button
                size="small"
                startIcon={<ScienceIcon />}
                onClick={() => setShowThesisDetails(!showThesisDetails)}
              >
                {showThesisDetails ? "Masquer" : "Voir"} détails scientifiques
              </Button>
            </Box>

            {showThesisDetails && detailedResults && (
              <Box sx={{ mt: 2 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Famille</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Objectif</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Score Global</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Stratégies</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Mécanisme Cognitif</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(detailedResults.familyDetails).map(
                        ([family, details]) => (
                          <TableRow key={family}>
                            <TableCell>{family}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={details.familyGoal}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${details.scoreGlobal.toFixed(1)}%`}
                                color={
                                  details.scoreGlobal >= 85
                                    ? "success"
                                    : details.scoreGlobal >= 70
                                    ? "info"
                                    : details.scoreGlobal >= 50
                                    ? "warning"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {
                                Object.keys(details.strategiesConseiller || {})
                                  .length
                              }
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption">
                                Auto:{" "}
                                {(
                                  details.processingModeDistribution
                                    .automatic_motor * 100
                                ).toFixed(0)}
                                %
                                <br />
                                Ctrl:{" "}
                                {(
                                  details.processingModeDistribution
                                    .controlled_metaphor * 100
                                ).toFixed(0)}
                                %
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Métriques globales de validation */}
                <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Métriques de validation scientifique
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Paires analysées totales
                      </Typography>
                      <Typography variant="h6">
                        {detailedResults.globalMetrics.totalAnalyzedPairs}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Couverture taxonomique
                      </Typography>
                      <Typography variant="h6">
                        {detailedResults.globalMetrics.coverage.toFixed(1)}%
                      </Typography>
                    </Box>
                    {detailedResults.globalMetrics.bestFamily && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Famille optimale
                        </Typography>
                        <Typography variant="h6">
                          {detailedResults.globalMetrics.bestFamily.name} (
                          {detailedResults.globalMetrics.bestFamily.score.toFixed(
                            1
                          )}
                          %)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pas de données */}
      {!isLoading && !hasData && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>
              Aucune donnée valide pour l'analyse taxonomique LI-CA
            </strong>
            <br />
            {selectedOrigin
              ? `Aucune paire conseiller-client valide trouvée pour l'origine "${selectedOrigin}"`
              : "Aucune paire conseiller-client conforme aux critères taxonomiques"}
            <br />
            <em>
              L'algorithme LI-CA nécessite des verbatims de qualité pour la
              classification taxonomique.
            </em>
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshData}
            sx={{ mt: 1 }}
          >
            Actualiser les données
          </Button>
        </Alert>
      )}

      {/* Légende factorisée avec seuils LI-CA */}
      {hasData && <ColorLegend thresholds={{ excellent: 85, good: 70 }} />}

      {/* Actions spécifiques à LI-CA */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={runAnalysis}
          disabled={isLoading || !hasData}
        >
          Relancer l'analyse taxonomique
        </Button>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshData}
          disabled={isLoading}
        >
          Actualiser les données
        </Button>

        <Button
          variant={showAlgorithmLogic ? "contained" : "outlined"}
          color="info"
          startIcon={<AnalyticsIcon />}
          onClick={() => setShowAlgorithmLogic(!showAlgorithmLogic)}
        >
          {showAlgorithmLogic ? "Masquer" : "Voir"} la taxonomie et mécanismes
        </Button>

        {hasDetailedResults && (
          <Button
            variant="outlined"
            startIcon={<ScienceIcon />}
            onClick={enableDetailedAnalysis}
          >
            Analyse détaillée avancée
          </Button>
        )}

        {analysisResults && (
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            onClick={exportResults}
          >
            Exporter résultats + taxonomie
          </Button>
        )}
      </Box>

      {/* Explication détaillée de la taxonomie LI-CA */}
      {showAlgorithmLogic && (
        <AlgorithmLogicExplanation {...algorithmLogicConfig} />
      )}

      {/* Dialog factorisé avec taxonomie enrichie */}
      <AlgorithmDetailDialog
        algorithm={selectedAlgorithm}
        isOpen={isOpen}
        onClose={closeDialog}
        icon={LICAIcon}
        color="secondary"
      />
    </Box>
  );
};

export default LICAAlgorithmTab;
