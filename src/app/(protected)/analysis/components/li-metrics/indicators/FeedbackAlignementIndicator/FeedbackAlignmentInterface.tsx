// FeedbackAlignmentInterface.tsx - Version finale avec Box + lexiques
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
} from "@mui/material";
import {
  TrendingUp as AlignmentIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";

// 🧩 Composants atomiques importés
import { IndicatorHeader } from "../../../shared/atoms/IndicatorHeader";
import { ColorLegend } from "../../../shared/atoms/ColorLegend";
import { ResultsTable } from "../../../shared/molecules/ResultsTable";
import { AlgorithmDetailDialog } from "../../../shared/atoms/AlgorithmDetailDialog";
import AlgorithmLogicExplanation from "../../../shared/molecules/AlgorithmLogicExplanation";

// 🪝 Hook pour les métriques réelles
import { useFeedbackAlignmentMetrics } from "./hooks/useFeedbackAlignmentMetrics";

// 🪝 Hooks partagés
import {
  useAlgorithmDialog,
  AlgorithmDetail,
} from "../../../shared/hooks/useAlgorithmDialog";

// 📊 Types
import { TableColumn } from "../../../shared/molecules/ResultsTable";
import type { ExtendedAlgorithmLogicProps } from "../../../shared/molecules/types";

interface FeedbackAlignmentInterfaceProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
  showComparison?: boolean;
}

const FeedbackAlignmentInterface: React.FC<FeedbackAlignmentInterfaceProps> = ({
  selectedOrigin,
  showDetailedResults = false,
  showComparison = false,
}) => {
  // 🪝 Hook pour les données réelles
  const {
    tableRows,
    analysisResults,
    stats,
    isLoading,
    isAnalyzing,
    error,
    runAnalysis,
    refreshData,
    dataCount,
    hasData,
    sourceDataCount,
    debugInfo,
  } = useFeedbackAlignmentMetrics({
    selectedOrigin,
    algorithmType: "basic",
  });

  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showAlgorithmLogic, setShowAlgorithmLogic] = useState(false);

  // Configuration des algorithmes corrigée
  const algorithms: AlgorithmDetail[] = [
    {
      id: "verbatim_analysis",
      name: "Analyse Sémantique par Verbatims Client",
      description:
        "Algorithme d'intelligence sémantique analysant l'impact réel des stratégies conseiller par examen du contenu textuel des réactions client, utilisant des dictionnaires de sentiment français étendus et un scoring de confidence.",
      principle:
        "Analyse les verbatims client suivant chaque stratégie conseiller en utilisant l'analyse sémantique plutôt que les tags, pour mesurer l'efficacité conversationnelle réelle.",
      source:
        "TaggerLPL - Moteur d'analyse sémantique conversationnelle avancée",
    },
  ];

  // Configuration complète avec lexiques détaillés
  const algorithmLogicConfig: ExtendedAlgorithmLogicProps = {
    algorithmName:
      "Feedback Alignment - Analyse Intelligente par Verbatims Client",
    description:
      "Cet algorithme analyse l'efficacité des stratégies linguistiques du conseiller en examinant le contenu textuel des réactions client plutôt qu'en se basant uniquement sur les tags prédéfinis.",

    steps: [
      {
        id: "step1",
        title: "Identification des Stratégies Conseiller par Famille",
        description:
          "L'algorithme identifie tous les tours de parole du conseiller appartenant aux quatre familles de stratégies cibles définies dans la base de données.",
        example:
          "Un tour taggé 'REFORMULATION' (famille REFLET) ou 'QUESTION_OUVERTE' (famille ENGAGEMENT)",
        technical:
          "Filtrage SQL: SELECT * FROM turntagged WHERE family IN ['REFLET', 'ENGAGEMENT', 'EXPLICATION', 'OUVERTURE']",
      },
      {
        id: "step2",
        title: "Recherche des Réactions Client Suivantes",
        description:
          "Pour chaque stratégie conseiller, l'algorithme recherche la réaction client immédiatement suivante dans la conversation en utilisant deux méthodes complémentaires.",
        example:
          "Si conseiller fait 'REFLET' à 15:30, recherche du prochain verbatim client après 15:30 (méthode temporelle) ou utilisation de next_turn_verbatim si disponible",
        technical:
          "Méthode 1: next_turn_verbatim + validation isClientTag() | Méthode 2: Recherche temporelle avec window de 60 secondes",
      },
      {
        id: "step3",
        title: "Analyse Sémantique avec Lexiques Français Étendus",
        description:
          "Les verbatims client sont analysés par intelligence sémantique basée sur trois lexiques de sentiment français spécialisés pour les interactions téléphoniques.",
        example:
          "'Oui d'accord, c'est une bonne idée' → POSITIF (mots: 'oui', 'd'accord', 'bonne idée') | 'Non mais c'est impossible' → NEGATIF (mots: 'non', 'impossible')",
        technical:
          "Lexique POSITIF: 40+ patterns | Lexique NEGATIF: 35+ patterns | Lexique NEUTRE: 25+ patterns | Scoring pondéré + analyse contextuelle",
        lexicons: {
          POSITIF: {
            mots: [
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
              "bonne idée",
              "excellente idée",
              "intéressant",
              "ça m'intéresse",
              "je suis intéressé",
              "pourquoi pas",
              "volontiers",
              "avec plaisir",
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
            mots: [
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
              "pas d'accord",
              "désaccord",
              "contre",
              "opposé",
              "réticent",
              "pas convaincu",
              "pas sûr",
              "doute",
              "sceptique",
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
              "ne pas",
              "n'est pas",
              "ce n'est pas",
              "ça ne va pas",
              "ça ne marche pas",
              "objection",
              "mais",
              "cependant",
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
            mots: [
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
              "information",
              "renseignement",
              "clarification",
              "compréhension",
              "exemple",
              "illustration",
              "concrètement",
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
        },
      },
      {
        id: "step4",
        title: "Calcul des Scores d'Efficacité par Famille",
        description:
          "Pour chaque famille de stratégie, calcul du pourcentage de réactions client positives obtenues parmi les réactions analysables.",
        example:
          "ENGAGEMENT: 14 réactions POSITIF + 4 NEGATIF + 2 NEUTRE = 70% d'efficacité (14/20)",
        technical:
          "Score = (verbatims_sentiment_positif / total_verbatims_analysés) × 100 | Exclusion des verbatims non-analysables (<3 caractères)",
      },
      {
        id: "step5",
        title: "Validation et Filtrage Qualité",
        description:
          "Application de filtres de qualité pour garantir la fiabilité de l'analyse : confidence minimale, longueur de verbatim, cohérence contextuelle.",
        example:
          "Rejet des analyses avec confidence < 0.5, des verbatims < 3 caractères, détection des négations pour éviter les faux positifs",
        technical:
          "Filtres: confidence >= 0.5 | length >= 3 | négation_adjustment | context_scoring",
      },
    ],

    metrics: [
      {
        name: "Score d'Efficacité par Famille",
        description:
          "Pourcentage de verbatims client analysés comme POSITIF générés par chaque famille de stratégie conseiller.",
        formula:
          "(Verbatims sentiment POSITIF / Total verbatims analysés) × 100",
        interpretation:
          "Plus le score est élevé, plus la stratégie génère d'adhésion verbale mesurable chez le client.",
      },
      {
        name: "Score Global d'Efficacité",
        description:
          "Moyenne pondérée des scores d'efficacité de toutes les familles, pondérée par le nombre d'occurrences.",
        formula:
          "Σ(Score_famille × Occurrences_famille) / Σ(Occurrences_famille)",
        interpretation:
          "Indicateur global de l'efficacité conversationnelle du conseiller basé sur l'analyse sémantique.",
      },
      {
        name: "Taux d'Analyse Réussie",
        description:
          "Pourcentage de tours conseiller pour lesquels un verbatim client a pu être trouvé et analysé avec succès.",
        formula:
          "(Verbatims analysés avec succès / Total tours conseiller ciblés) × 100",
        interpretation:
          "Indique la qualité des données conversationnelles et la robustesse de l'algorithme d'analyse.",
      },
      {
        name: "Confidence Moyenne",
        description:
          "Score de confiance moyen des analyses sémantiques, mesurant la certitude de l'algorithme dans ses classifications.",
        formula: "Σ(Confidence_analyse) / Nombre_analyses_réussies",
        interpretation:
          "Une confidence élevée (>0.8) indique des réactions client clairement exprimées et facilement classifiables.",
      },
    ],

    theoreticalBackground: {
      theory:
        "L'analyse s'appuie sur la théorie de l'analyse conversationnelle et du traitement automatique du langage naturel. Elle considère que l'efficacité communicationnelle se mesure par l'analyse sémantique des réactions verbales spontanées plutôt que par des catégories prédéfinies.",
      source:
        "Combining Conversation Analysis principles (Heritage, 2011) with Natural Language Processing for French sentiment analysis (Benamara et al., 2017)",
      keyPrinciples: [
        "Principe de séquentialité conversationnelle : chaque tour conseiller influence sémantiquement le verbatim client suivant",
        "Analyse sémantique contextuelle : les mots prennent sens dans leur contexte conversationnel",
        "Sentiment analysis adapté au français conversationnel : patterns linguistiques spécifiques aux interactions téléphoniques",
        "Mesure d'efficacité par adhésion verbale : les stratégies efficaces génèrent des verbatims positifs mesurables",
        "Validation par confidence scoring : filtrage des analyses peu fiables pour garantir la qualité des résultats",
      ],
    },

    interpretation: {
      scoreRanges: [
        {
          range: "≥ 80%",
          label: "Excellent",
          color: "success",
          meaning:
            "Stratégie très efficace, génère des verbatims client majoritairement positifs et mesurables",
        },
        {
          range: "70-79%",
          label: "Bon",
          color: "info",
          meaning:
            "Stratégie efficace, les verbatims client montrent une adhésion satisfaisante",
        },
        {
          range: "50-69%",
          label: "Moyen",
          color: "warning",
          meaning:
            "Stratégie d'efficacité variable, verbatims client mitigés, marge d'amélioration identifiée",
        },
        {
          range: "< 50%",
          label: "Faible",
          color: "error",
          meaning:
            "Stratégie peu efficace, génère des verbatims négatifs ou neutres, nécessite révision",
        },
      ],
      practicalAdvice: [
        "Analyser les verbatims exemples des stratégies performantes (≥70%) pour identifier les formulations efficaces",
        "Examiner les mots-clés détectés dans les verbatims pour comprendre les patterns de réaction client",
        "Tester des reformulations pour les stratégies avec verbatims négatifs récurrents",
        "Surveiller le taux d'analyse réussie : un taux faible peut indiquer des problèmes de données",
        "Utiliser la confidence moyenne pour évaluer la qualité de vos données conversationnelles",
        "Adapter les stratégies selon les patterns linguistiques observés dans les verbatims positifs",
        "Enrichir les lexiques avec de nouveaux patterns identifiés dans vos données spécifiques",
      ],
    },

    // Section lexiques détaillée
    lexiconDetails: {
      title: "🔤 Lexiques de Sentiment Français",
      description:
        "Dictionnaires spécialisés pour l'analyse sémantique des interactions téléphoniques",
      categories: [
        {
          name: "POSITIF",
          color: "success.main",
          description: "Expressions d'adhésion, satisfaction et validation",
          wordCount: "40+ mots-clés",
          expressionCount: "13+ expressions",
          examples: [
            "Acquiescement: oui, d'accord, exactement, absolument",
            "Satisfaction: parfait, excellent, super, génial",
            "Validation: c'est bien, ça me va, je valide",
            "Encouragement: bonne idée, intéressant, pourquoi pas",
          ],
        },
        {
          name: "NEGATIF",
          color: "error.main",
          description: "Expressions de refus, désaccord et mécontentement",
          wordCount: "35+ mots-clés",
          expressionCount: "11+ expressions",
          examples: [
            "Refus: non, jamais, impossible, refuse",
            "Désaccord: pas d'accord, contre, opposé",
            "Mécontentement: problème, difficile, embêtant",
            "Négation: pas du tout, absolument pas, hors de question",
          ],
        },
        {
          name: "NEUTRE",
          color: "info.main",
          description: "Questions, demandes d'information et hésitations",
          wordCount: "25+ mots-clés",
          expressionCount: "10+ expressions",
          examples: [
            "Questions: comment, pourquoi, quand, où",
            "Demandes: pouvez-vous, expliquez-moi, dites-moi",
            "Hésitation: peut-être, je ne sais pas, on verra",
            "Clarification: c'est-à-dire, par exemple, concrètement",
          ],
        },
      ],
      technicalNotes: [
        "Scoring pondéré selon la position dans la phrase (début/fin = +20%)",
        "Expressions complètes ont un poids x1.5 par rapport aux mots isolés",
        "Détection automatique des négations pour ajuster le sentiment",
        "Filtrage par longueur minimum (3 caractères) et confidence (≥0.5)",
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
  const getScoreColor = (score: number) => {
    if (score >= 80) return "success.main";
    if (score >= 70) return "warning.main";
    if (score >= 50) return "info.main";
    return "error.main";
  };

  // Gestion des erreurs
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Erreur d'analyse</Typography>
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
    <Box sx={{ p: 3, maxWidth: "100%" }}>
      {/* Header factorisé - TITRE CORRIGÉ */}
      <IndicatorHeader
        icon={AlignmentIcon}
        title="📊 Feedback Alignment - Analyse Sémantique par Verbatims Client"
        subtitle={`Mesure de l'efficacité conversationnelle par analyse intelligente des verbatims client${
          selectedOrigin ? ` (${selectedOrigin})` : ""
        }`}
        color="secondary"
      />

      {/* Alerte explicative de la méthode */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🧠 Méthode d'analyse avancée :</strong> Cet algorithme analyse
          le <em>contenu sémantique réel</em> des verbatims client (mots,
          expressions, sentiment) plutôt que de se baser uniquement sur des tags
          prédéfinis. Il utilise des dictionnaires de sentiment français étendus
          (100+ patterns) avec scoring de confidence pour mesurer l'efficacité
          conversationnelle authentique.
        </Typography>
      </Alert>

      {/* Informations sur les données - CORRIGÉ avec Box */}
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
            <Typography variant="h6">📋 État des données</Typography>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              {showDebugInfo ? "Masquer" : "Voir"} détails
            </Button>
          </Box>

          {/* ✅ GRID REMPLACÉ par Box + Flexbox */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="primary">
                {sourceDataCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Données source
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="secondary">
                {dataCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Données filtrées
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
                Familles détectées
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="info.main">
                {debugInfo.nextTurnTags.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tags de réaction
              </Typography>
            </Box>
          </Box>

          {/* Informations de debug */}
          {showDebugInfo && (
            <Box sx={{ mt: 3 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    Détails techniques
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {/* ✅ GRID REMPLACÉ par Box + Flexbox */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Familles détectées:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {debugInfo.families.map((family) => (
                          <Chip
                            key={family}
                            label={family}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Tags de réaction:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {debugInfo.nextTurnTags.slice(0, 8).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ))}
                        {debugInfo.nextTurnTags.length > 8 && (
                          <Chip
                            label={`+${debugInfo.nextTurnTags.length - 8}`}
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
                        {debugInfo.origines.map((origine) => (
                          <Chip
                            key={origine}
                            label={origine}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistiques globales - CORRIGÉ avec Box */}
      {stats && (
        <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <AnalyticsIcon color="secondary" />
              Résultats de l'analyse sémantique
            </Typography>

            {/* ✅ GRID REMPLACÉ par Box + Flexbox */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {stats.totalTurns}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tours analysés
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="secondary">
                  {stats.totalResponses}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Verbatims analysés
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
                  Efficacité globale
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  {stats.coverage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Taux d'analyse
                </Typography>
              </Box>
            </Box>

            {/* Meilleure stratégie */}
            {stats.bestStrategy && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Stratégie la plus efficace :</strong>{" "}
                  {stats.bestStrategy.name.toUpperCase()} (
                  {stats.bestStrategy.score.toFixed(1)}% d'efficacité par
                  analyse de verbatims)
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
                      data.alignmentScore >= 70
                        ? "success"
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
              ? "Analyse sémantique en cours..."
              : "Chargement des données..."}
          </Typography>
        </Box>
      )}

      {/* Alerte explicative */}
      {hasData && stats && (
        <Alert
          severity={
            stats.overallScore >= 70
              ? "success"
              : stats.overallScore >= 50
              ? "warning"
              : "info"
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Résultat d'analyse sémantique :</strong>{" "}
            {stats.overallScore >= 80
              ? `Score excellent (${stats.overallScore.toFixed(
                  1
                )}%) - Les stratégies génèrent des verbatims client très positifs`
              : stats.overallScore >= 70
              ? `Score bon (${stats.overallScore.toFixed(
                  1
                )}%) - Les stratégies génèrent globalement des verbatims positifs`
              : stats.overallScore >= 50
              ? `Score moyen (${stats.overallScore.toFixed(
                  1
                )}%) - Les stratégies ont un impact sémantique mitigé`
              : `Score faible (${stats.overallScore.toFixed(
                  1
                )}%) - Les verbatims client révèlent des stratégies peu efficaces`}
          </Typography>
        </Alert>
      )}

      {/* Tableau factorisé avec données réelles */}
      {hasData && tableRows.length > 0 && (
        <ResultsTable
          columns={tableColumns}
          rows={tableRows}
          onInfoClick={(row) => {
            console.log("🔍 Clic sur info pour:", row.algorithm);
            openDialog("Analyse Sémantique par Verbatims Client");
          }}
          headerColor="secondary"
          scoreThresholds={{ excellent: 80, good: 70 }}
        />
      )}

      {/* Analyse détaillée par stratégie */}
      {showDetailedResults && analysisResults && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Analyse sémantique détaillée par stratégie
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Stratégie</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Verbatims</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Positif</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Négatif</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Neutre</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Efficacité</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(analysisResults).map(([key, result]) => {
                    if (key === "globalStats") return null;

                    return (
                      <TableRow key={key}>
                        <TableCell>{key.toUpperCase()}</TableCell>
                        <TableCell align="center">
                          {result.totalOccurrences}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: "success.main" }}
                        >
                          {result.positiveResponses} (
                          {result.details.positiveRate.toFixed(1)}%)
                        </TableCell>
                        <TableCell align="center" sx={{ color: "error.main" }}>
                          {result.negativeResponses} (
                          {result.details.negativeRate.toFixed(1)}%)
                        </TableCell>
                        <TableCell align="center" sx={{ color: "info.main" }}>
                          {result.neutralResponses} (
                          {result.details.neutralRate.toFixed(1)}%)
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${result.alignmentScore.toFixed(1)}%`}
                            color={
                              result.alignmentScore >= 70
                                ? "success"
                                : result.alignmentScore >= 50
                                ? "warning"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Pas de données */}
      {!isLoading && !hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Aucune donnée disponible pour l'analyse sémantique</strong>
            <br />
            {selectedOrigin
              ? `Aucun verbatim client trouvé pour l'origine "${selectedOrigin}"`
              : "Aucun verbatim client trouvé dans la base de données"}
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

      {/* Légende factorisée */}
      {hasData && <ColorLegend thresholds={{ excellent: 80, good: 70 }} />}

      {/* Actions manuelles */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={runAnalysis}
          disabled={isLoading || !hasData}
        >
          Relancer l'analyse sémantique
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
          {showAlgorithmLogic ? "Masquer" : "Voir"} la logique d'algorithme et
          lexiques
        </Button>

        {analysisResults && (
          <Button
            variant="outlined"
            onClick={() => {
              const data = {
                algorithm: "FeedbackAlignment-VerbatimAnalysis",
                timestamp: new Date().toISOString(),
                origine: selectedOrigin || "toutes",
                results: analysisResults,
                stats: stats,
                lexicons: algorithmLogicConfig.steps[2].lexicons,
              };
              console.log("📊 Export des résultats sémantiques:", data);
              // Ici vous pourriez ajouter une vraie fonction d'export
            }}
          >
            Exporter les résultats + lexiques
          </Button>
        )}
      </Box>

      {/* Explication détaillée de la logique d'algorithme avec lexiques */}
      {showAlgorithmLogic && (
        <AlgorithmLogicExplanation {...algorithmLogicConfig} />
      )}

      {/* Dialog factorisé avec logique enrichie */}
      <AlgorithmDetailDialog
        algorithm={selectedAlgorithm}
        isOpen={isOpen}
        onClose={closeDialog}
        icon={AlignmentIcon}
        color="secondary"
      />

      {/* Section conditionnelle selon showComparison */}
      {showComparison && analysisResults && (
        <Box sx={{ mt: 4, p: 3, bgcolor: "background.paper", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🔄 Mode Comparaison - Analyse Multi-Algorithmes
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fonctionnalité de comparaison d'algorithmes disponible pour analyser
            les données avec différentes approches (sentiment avancé, patterns
            séquentiels, machine learning, etc.).
          </Typography>

          <Alert severity="info">
            <Typography variant="body2">
              Cette fonctionnalité sera disponible dans la prochaine version
              avec les algorithmes SentimentEnhancedAlgorithm,
              SequentialPatternAlgorithm et MLBasedAlgorithm pour comparer
              l'efficacité de l'analyse sémantique vs autres méthodes.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default FeedbackAlignmentInterface;
