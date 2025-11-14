// ComparisonTab.tsx - Onglet pour la comparaison multi-algorithmes
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
  Compare as CompareIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendIcon,
  Psychology as LicaIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";

// 🧩 Composants shared réutilisés
import { IndicatorHeader } from "@/features/phase3-analysis/shared/ui/atoms/IndicatorHeader";
import { ColorLegend } from "@/features/phase3-analysis/shared/ui/atoms/ColorLegend";
import { ResultsTable } from "@/features/phase3-analysis/shared/ui/molecules/ResultsTable";

// 🪝 Hook pour les métriques
import { useFeedbackAlignmentMetrics } from "../../hooks/useFeedbackAlignmentMetrics";

// 📊 Types
import { TableColumn } from "@/features/phase3-analysis/shared/ui/molecules/ResultsTable";

// Types spécifiques à l'onglet
interface ComparisonTabProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}

const ComparisonTab: React.FC<ComparisonTabProps> = ({
  selectedOrigin,
  showDetailedResults = false,
}) => {
  // 🪝 Hook pour les données de comparaison
  const {
    tableRows,
    comparisonResults,
    convergenceAnalysis,
    isComparison,
    isLoading,
    isAnalyzing,
    error,
    runAnalysis,
    refreshData,
    dataCount,
    hasData,
    sourceDataCount,
  } = useFeedbackAlignmentMetrics({
    selectedOrigin,
    algorithmType: "comparison",
  });

  // États locaux de l'onglet
  const [showConvergenceDetails, setShowConvergenceDetails] = useState(false);

  // Configuration du tableau de comparaison
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

  // Fonction pour obtenir la couleur de convergence
  const getConvergenceColor = (convergence: string) => {
    switch (convergence) {
      case "STRONG":
        return "success.main";
      case "MODERATE":
        return "info.main";
      case "WEAK":
        return "warning.main";
      case "DIVERGENT":
        return "error.main";
      default:
        return "text.secondary";
    }
  };

  // Fonction pour obtenir l'icône de convergence
  const getConvergenceIcon = (convergence: string) => {
    switch (convergence) {
      case "STRONG":
        return "🤝";
      case "MODERATE":
        return "👍";
      case "WEAK":
        return "⚠️";
      case "DIVERGENT":
        return "🔍";
      default:
        return "❓";
    }
  };

  // Gestion des erreurs
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Erreur de comparaison</Typography>
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
      {/* Header spécifique à la comparaison */}
      <IndicatorHeader
        icon={CompareIcon}
        title="🔄 Comparaison Multi-Algorithmes - Analyse Convergente"
        subtitle={`Validation croisée Sentiment Analysis vs LI-CA Pattern Analysis${
          selectedOrigin ? ` (${selectedOrigin})` : ""
        }`}
        color="info"
      />

      {/* Alerte explicative de la comparaison */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🔬 Validation scientifique croisée :</strong> Cette analyse
          compare deux approches algorithmiques complémentaires pour valider la
          cohérence des résultats et identifier les nuances méthodologiques dans
          l'évaluation de l'efficacité conversationnelle.
        </Typography>
      </Alert>

      {/* Vue d'ensemble de la comparaison */}
      {convergenceAnalysis && (
        <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <AssessmentIcon color="info" />
              Analyse de Convergence Globale
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {sourceDataCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tours analysés
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
                <Typography variant="h4" color="secondary">
                  2
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Algorithmes comparés
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color={getConvergenceColor(
                    convergenceAnalysis.overallConvergence
                  )}
                >
                  {getConvergenceIcon(convergenceAnalysis.overallConvergence)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {convergenceAnalysis.overallConvergence}
                </Typography>
              </Box>

              <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  {(convergenceAnalysis.correlation * 100).toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Corrélation globale
                </Typography>
              </Box>
            </Box>

            {/* Barre de progression de convergence */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Niveau de convergence : {convergenceAnalysis.overallConvergence}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={convergenceAnalysis.correlation * 100}
                color={
                  convergenceAnalysis.correlation >= 0.8
                    ? "success"
                    : convergenceAnalysis.correlation >= 0.6
                    ? "info"
                    : convergenceAnalysis.correlation >= 0.4
                    ? "warning"
                    : "error"
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {(convergenceAnalysis.correlation * 100).toFixed(1)}% de
                corrélation entre les deux approches
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Interprétation de la convergence */}
            <Alert
              severity={
                convergenceAnalysis.overallConvergence === "STRONG"
                  ? "success"
                  : convergenceAnalysis.overallConvergence === "MODERATE"
                  ? "info"
                  : convergenceAnalysis.overallConvergence === "WEAK"
                  ? "warning"
                  : "error"
              }
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Interprétation :</strong>{" "}
                {convergenceAnalysis.overallConvergence === "STRONG" &&
                  "Excellente convergence - Les deux algorithmes produisent des résultats très cohérents, validant mutuellement leurs approches."}
                {convergenceAnalysis.overallConvergence === "MODERATE" &&
                  "Bonne convergence - Les algorithmes s'accordent sur les tendances principales avec quelques nuances méthodologiques intéressantes."}
                {convergenceAnalysis.overallConvergence === "WEAK" &&
                  "Convergence partielle - Les approches révèlent des différences significatives qui méritent une analyse approfondie."}
                {convergenceAnalysis.overallConvergence === "DIVERGENT" &&
                  "Divergence notable - Les méthodologies capturent des aspects différents de l'efficacité conversationnelle."}
              </Typography>
            </Alert>

            <Button
              size="small"
              variant={showConvergenceDetails ? "contained" : "outlined"}
              color="info"
              onClick={() => setShowConvergenceDetails(!showConvergenceDetails)}
            >
              {showConvergenceDetails ? "Masquer" : "Voir"} analyse détaillée
              par famille
            </Button>
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
              ? "Comparaison en cours..."
              : "Chargement des données..."}
          </Typography>
        </Box>
      )}

      {/* Tableau comparatif des deux algorithmes */}
      {hasData && tableRows.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Comparaison des Résultats par Algorithme
            </Typography>

            <ResultsTable
              columns={tableColumns}
              rows={tableRows}
              onInfoClick={(row) => {
                console.log("🔍 Clic sur info pour:", row.algorithm);
              }}
              headerColor="info"
              scoreThresholds={{ excellent: 80, good: 70 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Analyse détaillée des divergences */}
      {showConvergenceDetails && convergenceAnalysis && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔍 Analyse des Divergences par Famille
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Famille</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>
                        <TrendIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Sentiment Analysis
                      </strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>
                        <LicaIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        LI-CA Patterns
                      </strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Différence</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Interprétation</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {convergenceAnalysis.divergences.map((divergence) => (
                    <TableRow key={divergence.family}>
                      <TableCell>
                        <Chip
                          label={divergence.family}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${divergence.basicScore.toFixed(1)}%`}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${divergence.licaScore.toFixed(1)}%`}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${divergence.difference.toFixed(1)}%`}
                          color={
                            divergence.difference <= 10
                              ? "success"
                              : divergence.difference <= 20
                              ? "info"
                              : divergence.difference <= 30
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {divergence.interpretation}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Comparaison méthodologique */}
      <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔬 Différences Méthodologiques
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box sx={{ flex: "1 1 400px" }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                📊 Sentiment Analysis (BasicAlgorithm)
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Approche :</strong> Analyse sémantique lexicale
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Méthode :</strong> Dictionnaires de sentiment français
                <br />• <strong>Unité :</strong> Mots et expressions isolés
                <br />• <strong>Mesure :</strong> Polarité émotionnelle
                (POSITIF/NEGATIF/NEUTRE)
                <br />• <strong>Focus :</strong> Satisfaction client exprimée
                verbalement
                <br />• <strong>Avantage :</strong> Détection fine des nuances
                émotionnelles
                <br />• <strong>Limite :</strong> Ne considère pas la structure
                conversationnelle
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 400px" }}>
              <Typography variant="subtitle1" color="secondary" gutterBottom>
                🧠 LI-CA Pattern Analysis
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Approche :</strong> Analyse conversationnelle
                structurelle
              </Typography>
              <Typography variant="body2" component="div">
                • <strong>Méthode :</strong> Paires adjacentes + stratégies
                linguistiques
                <br />• <strong>Unité :</strong> Actions conseiller ↔ Réactions
                client
                <br />• <strong>Mesure :</strong> Cohérence conversationnelle et
                efficacité stratégique
                <br />• <strong>Focus :</strong> Efficacité des stratégies
                interactionnelles
                <br />• <strong>Avantage :</strong> Analyse de la dynamique
                conversationnelle
                <br />• <strong>Limite :</strong> Complexité d'interprétation
                plus élevée
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Complémentarité :</strong> Les deux approches se
              complètent pour une analyse conversationnelle complète. Le
              Sentiment Analysis capture l'impact émotionnel tandis que
              l'analyse LI-CA révèle l'efficacité structurelle des interactions.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Pas de données */}
      {!isLoading && !hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Aucune donnée disponible pour la comparaison</strong>
            <br />
            {selectedOrigin
              ? `Aucune donnée trouvée pour l'origine "${selectedOrigin}"`
              : "Aucune donnée trouvée dans la base de données"}
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

      {/* Actions spécifiques à la comparaison */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={runAnalysis}
          disabled={isLoading || !hasData}
        >
          Relancer la comparaison
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
          startIcon={<AnalyticsIcon />}
          onClick={() => {
            console.log("📊 Rapport de convergence détaillé");
          }}
        >
          Rapport de convergence
        </Button>

        {comparisonResults && (
          <Button
            variant="outlined"
            onClick={() => {
              const data = {
                algorithm: "MultiAlgorithm-Comparison",
                timestamp: new Date().toISOString(),
                origine: selectedOrigin || "toutes",
                basicResults: comparisonResults.basic,
                licaResults: comparisonResults.conversationalPattern,
                convergenceAnalysis: convergenceAnalysis,
                methodology:
                  "Cross-validation Sentiment Analysis vs LI-CA Pattern Analysis",
              };
              console.log("🔄 Export comparaison complète:", data);
            }}
          >
            Exporter comparaison complète
          </Button>
        )}
      </Box>

      {/* Recommandations basées sur la convergence */}
      {convergenceAnalysis && (
        <Card sx={{ mt: 4, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              💡 Recommandations d'Usage
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {convergenceAnalysis.overallConvergence === "STRONG" && (
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Convergence forte détectée :</strong> Les deux
                    algorithmes valident mutuellement leurs résultats. Vous
                    pouvez utiliser l'une ou l'autre approche avec confiance, en
                    privilégiant le Sentiment Analysis pour sa simplicité
                    d'interprétation ou LI-CA pour une analyse plus fine des
                    dynamiques conversationnelles.
                  </Typography>
                </Alert>
              )}

              {convergenceAnalysis.overallConvergence === "MODERATE" && (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Convergence modérée :</strong> Les algorithmes
                    s'accordent sur les tendances principales. Examinez les
                    divergences par famille pour comprendre les nuances.
                    Utilisez les deux approches en complément pour une analyse
                    complète.
                  </Typography>
                </Alert>
              )}

              {(convergenceAnalysis.overallConvergence === "WEAK" ||
                convergenceAnalysis.overallConvergence === "DIVERGENT") && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Divergences importantes :</strong> Les algorithmes
                    révèlent des aspects différents de l'efficacité
                    conversationnelle. Analysez en détail les différences par
                    famille pour identifier les spécificités de chaque approche
                    et adapter votre stratégie d'analyse selon vos objectifs.
                  </Typography>
                </Alert>
              )}

              <Divider />

              <Typography variant="subtitle2" gutterBottom>
                🎯 Conseils pratiques par niveau de convergence :
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ flex: "1 1 300px" }}>
                  <Typography variant="body2" color="success.main">
                    <strong>• Convergence FORTE (≥80%) :</strong>
                    <br />
                    → Privilégier l'algorithme le plus adapté à vos besoins
                    <br />
                    → Sentiment Analysis pour métriques simples
                    <br />→ LI-CA pour analyse approfondie des interactions
                  </Typography>
                </Box>

                <Box sx={{ flex: "1 1 300px" }}>
                  <Typography variant="body2" color="info.main">
                    <strong>• Convergence MODÉRÉE (60-79%) :</strong>
                    <br />
                    → Utiliser les deux algorithmes en complémentarité
                    <br />
                    → Investiguer les divergences intéressantes
                    <br />→ Adapter selon le contexte d'analyse
                  </Typography>
                </Box>

                <Box sx={{ flex: "1 1 300px" }}>
                  <Typography variant="body2" color="warning.main">
                    <strong>• Divergence NOTABLE (&lt;60%) :</strong>
                    <br />
                    → Analyser en détail les causes de divergence
                    <br />
                    → Considérer les deux perspectives comme complémentaires
                    <br />→ Enrichir l'analyse avec d'autres métriques
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ComparisonTab;
