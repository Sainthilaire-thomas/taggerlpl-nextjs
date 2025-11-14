// LICAAlgorithmTab.tsx - Onglet pour l'algorithme ConversationalPatternAlgorithm (LI-CA)
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
  Psychology as LicaIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  MenuBook as SourcesIcon,
} from "@mui/icons-material";

// 🧩 Composants shared réutilisés
import { IndicatorHeader } from "@/features/phase3-analysis/shared/ui/atoms/IndicatorHeader";
import { ColorLegend } from "@/features/phase3-analysis/shared/ui/atoms/ColorLegend";
import { ResultsTable } from "@/features/phase3-analysis/shared/ui/molecules/ResultsTable";
import { AlgorithmDetailDialog } from "@/features/phase3-analysis/shared/ui/atoms/AlgorithmDetailDialog";

// 🪝 Hook pour les métriques
import { useFeedbackAlignmentMetrics } from "../../hooks/useFeedbackAlignmentMetrics";

// 🪝 Hooks partagés
import {
  useAlgorithmDialog,
  AlgorithmDetail,
} from "@/features/phase3-analysis/shared/ui/hooks/useAlgorithmDialog";

// 📊 Types
import { TableColumn } from "@/features/phase3-analysis/shared/ui/molecules/ResultsTable";

// Types spécifiques à l'onglet
interface LICAAlgorithmTabProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}

const LICAAlgorithmTab: React.FC<LICAAlgorithmTabProps> = ({
  selectedOrigin,
  showDetailedResults = false,
}) => {
  // 🪝 Hook pour les données LI-CA
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
    algorithmType: "conversational-pattern",
  });

  // États locaux de l'onglet
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showCAExplanation, setShowCAExplanation] = useState(false);
  const [showLIExplanation, setShowLIExplanation] = useState(false);

  // Configuration des algorithmes pour le dialog
  const algorithms: AlgorithmDetail[] = [
    {
      id: "lica_pattern_analysis",
      name: "Analyse LI-CA des Patterns Conversationnels",
      description:
        "Algorithme hybride combinant la Linguistique Interactionnelle (stratégies communicationnelles) et la Conversation Analysis (structure séquentielle) pour analyser l'efficacité des interactions conseiller-client.",
      principle:
        "Analyse la cohérence entre actions conseiller et réactions client selon les principes de la CA, en évaluant l'efficacité stratégique selon la LI.",
      source:
        "Gumperz (1982) - Discourse Strategies + Schegloff & Sacks (1973) - Adjacency Pairs",
    },
  ];

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
        icon={LicaIcon}
        title="🧠 LI-CA Pattern Analysis - Analyse Conversationnelle Intégrée"
        subtitle={`Analyse hybride Linguistique Interactionnelle + Conversation Analysis${
          selectedOrigin ? ` (${selectedOrigin})` : ""
        }`}
        color="secondary"
      />

      {/* Alerte explicative de la méthode LI-CA */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🔬 Approche LI-CA hybride :</strong> Cet algorithme combine la{" "}
          <em>Linguistique Interactionnelle</em> (efficacité des stratégies) et
          la <em>Conversation Analysis</em> (cohérence séquentielle) pour
          analyser l'alignment conversationnel réel entre actions conseiller et
          réactions client.
        </Typography>
      </Alert>

      {/* Section sources scientifiques */}
      <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <SourcesIcon color="secondary" />
            Sources Scientifiques LI-CA
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="subtitle1" gutterBottom color="primary">
                📚 Conversation Analysis (CA)
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Schegloff & Sacks (1973): Adjacency Pairs
                <br />
                • Pomerantz (1984): Preference Organization
                <br />• Drew & Heritage (1992): Talk at Work
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Focus: Structure séquentielle, cohérence tour-à-tour
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="subtitle1" gutterBottom color="secondary">
                🗣️ Linguistique Interactionnelle (LI)
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Gumperz (1982): Discourse Strategies
                <br />
                • Kerbrat-Orecchioni (2005): Le discours en interaction
                <br />• Tannen (1989): Talking Voices
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Focus: Stratégies linguistiques, efficacité communicationnelle
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant={showCAExplanation ? "contained" : "outlined"}
              color="primary"
              onClick={() => setShowCAExplanation(!showCAExplanation)}
            >
              {showCAExplanation ? "Masquer" : "Voir"} Méthodes CA
            </Button>

            <Button
              size="small"
              variant={showLIExplanation ? "contained" : "outlined"}
              color="secondary"
              onClick={() => setShowLIExplanation(!showLIExplanation)}
            >
              {showLIExplanation ? "Masquer" : "Voir"} Méthodes LI
            </Button>
          </Box>

          {/* Explication CA */}
          {showCAExplanation && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "primary.50", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🔬 Méthodes Conversation Analysis implémentées :
              </Typography>
              <Typography variant="body2">
                • <strong>Identification des actions conseiller</strong> :
                COMMITMENT, ACKNOWLEDGMENT, EXPLANATION, QUESTION, PROPOSAL
                <br />• <strong>Analyse séquentielle</strong> : Cohérence action
                → réaction selon les paires adjacentes
                <br />• <strong>Preference Organization</strong> : Détection des
                réponses préférées vs non-préférées
                <br />• <strong>Turn-taking analysis</strong> : Analyse de la
                prise de tour et des transitions
              </Typography>
            </Box>
          )}

          {/* Explication LI */}
          {showLIExplanation && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "secondary.50", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="secondary">
                🗣️ Méthodes Linguistique Interactionnelle implémentées :
              </Typography>
              <Typography variant="body2">
                • <strong>Stratégies client</strong> : ADHERENCE, ELABORATION,
                RESISTANCE, NEGOCIATION
                <br />• <strong>Efficacité stratégique</strong> : Mesure du
                succès des objectifs communicationnels
                <br />• <strong>Négociation du sens</strong> : Analyse des
                malentendus et clarifications
                <br />• <strong>Adaptation contextuelle</strong> : Prise en
                compte du contexte institutionnel conseiller-client
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

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
            <Typography variant="h6">📋 État des données LI-CA</Typography>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              {showDebugInfo ? "Masquer" : "Voir"} détails
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="primary">
                {sourceDataCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tours source
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="secondary">
                {dataCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Paires analysées
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
                Familles CA
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
              <Typography variant="h5" color="info.main">
                {debugInfo.nextTurnTags.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Patterns LI
              </Typography>
            </Box>
          </Box>

          {/* Informations de debug */}
          {showDebugInfo && (
            <Box sx={{ mt: 3 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    Détails techniques LI-CA
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Actions CA détectées:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {[
                          "COMMITMENT",
                          "ACKNOWLEDGMENT",
                          "EXPLANATION",
                          "QUESTION",
                          "PROPOSAL",
                        ].map((action) => (
                          <Chip
                            key={action}
                            label={action}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Stratégies LI détectées:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {[
                          "ADHERENCE",
                          "ELABORATION",
                          "RESISTANCE",
                          "NEGOCIATION",
                        ].map((strategy) => (
                          <Chip
                            key={strategy}
                            label={strategy}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ flex: "1 1 300px" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Familles analysées:
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
              <AnalyticsIcon color="secondary" />
              Résultats de l'analyse LI-CA
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {stats.totalTurns}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Paires CA analysées
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="secondary">
                  {stats.totalResponses}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stratégies LI détectées
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
                  Efficacité LI-CA globale
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 150px", textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  {stats.coverage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Taux de cohérence
                </Typography>
              </Box>
            </Box>

            {/* Meilleure stratégie */}
            {stats.bestStrategy && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Stratégie la plus efficace (LI-CA) :</strong>{" "}
                  {stats.bestStrategy.name.toUpperCase()} (
                  {stats.bestStrategy.score.toFixed(1)}% d'efficacité par
                  analyse conversationnelle intégrée)
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
              ? "Analyse LI-CA en cours..."
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
            <strong>Résultat d'analyse LI-CA :</strong>{" "}
            {stats.overallScore >= 80
              ? `Efficacité excellente (${stats.overallScore.toFixed(
                  1
                )}%) - Forte cohérence conversationnelle et stratégique`
              : stats.overallScore >= 70
              ? `Efficacité bonne (${stats.overallScore.toFixed(
                  1
                )}%) - Bonne cohérence entre actions conseiller et réactions client`
              : stats.overallScore >= 50
              ? `Efficacité moyenne (${stats.overallScore.toFixed(
                  1
                )}%) - Cohérence conversationnelle partielle`
              : `Efficacité faible (${stats.overallScore.toFixed(
                  1
                )}%) - Incohérences structurelles et stratégiques détectées`}
          </Typography>
        </Alert>
      )}

      {/* Tableau factorisé avec données LI-CA */}
      {hasData && tableRows.length > 0 && (
        <ResultsTable
          columns={tableColumns}
          rows={tableRows}
          onInfoClick={(row) => {
            console.log("🔍 Clic sur info pour:", row.algorithm);
            openDialog("Analyse LI-CA des Patterns Conversationnels");
          }}
          headerColor="secondary"
          scoreThresholds={{ excellent: 80, good: 70 }}
        />
      )}

      {/* Analyse détaillée LI-CA par stratégie */}
      {showDetailedResults && analysisResults && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🧠 Analyse LI-CA détaillée par stratégie
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Stratégie</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Paires CA</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Alignées</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Résistantes</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Incohérentes</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Efficacité LI-CA</strong>
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
                        <TableCell
                          align="center"
                          sx={{ color: "warning.main" }}
                        >
                          {result.neutralResponses} (
                          {result.details.neutralRate.toFixed(1)}%)
                        </TableCell>
                        <TableCell align="center" sx={{ color: "error.main" }}>
                          {result.negativeResponses} (
                          {result.details.negativeRate.toFixed(1)}%)
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
            <strong>Aucune donnée disponible pour l'analyse LI-CA</strong>
            <br />
            {selectedOrigin
              ? `Aucune paire conversationnelle trouvée pour l'origine "${selectedOrigin}"`
              : "Aucune paire conversationnelle trouvée dans la base de données"}
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

      {/* Actions spécifiques à LI-CA */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={runAnalysis}
          disabled={isLoading || !hasData}
        >
          Relancer l'analyse LI-CA
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
          variant="outlined"
          color="info"
          startIcon={<SourcesIcon />}
          onClick={() => {
            // TODO: Implémenter affichage des sources scientifiques détaillées
            console.log("📚 Affichage des sources scientifiques LI-CA");
          }}
        >
          Sources scientifiques complètes
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<AnalyticsIcon />}
          onClick={() => {
            // TODO: Implémenter diagnostic des patterns détectés
            console.log("🔍 Diagnostic des patterns conversationnels");
          }}
        >
          Diagnostic patterns CA-LI
        </Button>

        {analysisResults && (
          <Button
            variant="outlined"
            onClick={() => {
              const data = {
                algorithm: "ConversationalPatternAlgorithm-LICA",
                timestamp: new Date().toISOString(),
                origine: selectedOrigin || "toutes",
                results: analysisResults,
                stats: stats,
                methodology: {
                  ca_sources: [
                    "Schegloff & Sacks (1973)",
                    "Pomerantz (1984)",
                    "Drew & Heritage (1992)",
                  ],
                  li_sources: [
                    "Gumperz (1982)",
                    "Kerbrat-Orecchioni (2005)",
                    "Tannen (1989)",
                  ],
                  approach: "Hybrid LI-CA analysis of conversational patterns",
                },
              };
              console.log("🧠 Export des résultats LI-CA:", data);
              // Ici vous pourriez ajouter une vraie fonction d'export
            }}
          >
            Exporter résultats + méthodologie
          </Button>
        )}
      </Box>

      {/* Dialog factorisé */}
      <AlgorithmDetailDialog
        algorithm={selectedAlgorithm}
        isOpen={isOpen}
        onClose={closeDialog}
        icon={LicaIcon}
        color="secondary"
      />

      {/* Section d'informations méthodologiques */}
      <Card sx={{ mt: 4, bgcolor: "grey.50" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔬 Méthodologie LI-CA Hybride
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            L'algorithme ConversationalPatternAlgorithm implémente une approche
            scientifique innovante combinant deux paradigmes complémentaires
            pour l'analyse conversationnelle :
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                🔬 Composante Conversation Analysis
              </Typography>
              <Typography variant="body2">
                • <strong>Structure séquentielle</strong> : Analyse des paires
                adjacentes
                <br />• <strong>Preference organization</strong> : Réponses
                préférées vs non-préférées
                <br />• <strong>Turn-taking</strong> : Cohérence des transitions
                de tour
                <br />• <strong>Repair mechanisms</strong> : Détection des
                auto-corrections
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 300px" }}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                🗣️ Composante Linguistique Interactionnelle
              </Typography>
              <Typography variant="body2">
                • <strong>Stratégies communicationnelles</strong> : Efficacité
                des choix linguistiques
                <br />• <strong>Négociation du sens</strong> : Gestion des
                malentendus
                <br />• <strong>Adaptation contextuelle</strong> : Prise en
                compte du cadre institutionnel
                <br />• <strong>Réussite interactionnelle</strong> : Atteinte
                des objectifs communicatifs
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Innovation scientifique :</strong> Cette implémentation
              constitue la première approche algorithmique combinant CA et LI
              pour l'analyse automatisée des interactions conseiller-client en
              français.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LICAAlgorithmTab;
