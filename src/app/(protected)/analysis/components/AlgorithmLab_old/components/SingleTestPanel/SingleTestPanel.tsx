// SingleTestPanel.tsx - Version avec vraies données turntagged et validation scientifique
import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Divider,
  Paper,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  DataUsage as DataIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";

// Import du hook avec vraies données
import { useRealDataTesting, RealTestConfig } from "./hooks/useRealDataTesting";
import { DualValidationResult } from "./validation/ValidationEngine";

// Types pour le composant
export interface SingleTestPanelProps {
  selectedOrigin?: string | null;
  onTestComplete?: (result: DualValidationResult) => void;
  supabaseClient: any; // Client Supabase pour accès DB
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

const SingleTestPanel: React.FC<SingleTestPanelProps> = ({
  selectedOrigin,
  onTestComplete,
  supabaseClient,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Configuration du test
  const [config, setConfig] = useState<RealTestConfig>({
    algorithm: "BasicAlignmentAlgorithm",
    testType: "both",
    sampleSize: 200,
    selectedOrigin: selectedOrigin || undefined,
    stratificationBy: "strategy",
    filters: {
      strategies: [], // Vide = toutes les stratégies par défaut
      reactions: ["CLIENT POSITIF", "CLIENT NEGATIF", "CLIENT NEUTRE"], // ✅ Format réel
      families: ["REFLET", "OUVERTURE", "ENGAGEMENT", "EXPLICATION"],
    },
  });

  // Interface state
  const [activeTab, setActiveTab] = useState(0);

  // Hook pour les vraies données
  const {
    corpus,
    isDataLoading,
    dataError,
    executionState,
    testResult,
    loadCorpus,
    executeTest,
    resetTest,
    getCorpusStatistics,
    exportResults,
  } = useRealDataTesting(supabaseClient, selectedOrigin);

  // Styles adaptatifs
  const getAdaptiveStyles = () => ({
    mainContainer: {
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.grey[50], 0.9),
    },
    configCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.9)
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
    },
    resultCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.success.main, 0.1)
        : alpha(theme.palette.success.main, 0.05),
      border: `1px solid ${theme.palette.success.main}`,
    },
    dataCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.info.main, 0.1)
        : alpha(theme.palette.info.main, 0.05),
      border: `1px solid ${theme.palette.info.main}`,
    },
  });

  const adaptiveStyles = getAdaptiveStyles();

  // Mise à jour de la configuration
  const updateConfig = useCallback((updates: Partial<RealTestConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Exécution du test
  const runValidationTest = useCallback(async () => {
    if (!corpus) {
      await loadCorpus(config.filters);
    }

    try {
      const result = await executeTest(config);

      if (onTestComplete) {
        onTestComplete(result);
      }

      console.log("Test de validation terminé:", result);
    } catch (error) {
      console.error("Erreur lors du test:", error);
    }
  }, [config, corpus, loadCorpus, executeTest, onTestComplete]);

  // Statistiques du corpus
  const corpusStats = getCorpusStatistics();

  return (
    <Box sx={{ ...adaptiveStyles.mainContainer, p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <ScienceIcon color="primary" />
          Test de Validation Scientifique
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tests sur vraies données turntagged avec métriques scientifiques
          (kappa, precision/recall)
          {selectedOrigin && ` • Origine filtrée: ${selectedOrigin}`}
        </Typography>
      </Box>

      {/* Erreur de chargement */}
      {dataError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Erreur chargement données:</strong> {dataError}
        </Alert>
      )}

      {/* Onglets principaux */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<DataIcon />} label="Corpus & Config" />
          <Tab icon={<AnalyticsIcon />} label="Résultats" />
        </Tabs>
      </Paper>

      {/* Onglet Configuration */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Statistiques du corpus */}
          {corpusStats && (
            <Card sx={adaptiveStyles.dataCard}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Corpus de validation chargé
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                  <Paper sx={{ p: 2, textAlign: "center", minWidth: 120 }}>
                    <Typography variant="h4" color="primary">
                      {corpusStats.totalPairs}
                    </Typography>
                    <Typography variant="caption">Paires annotées</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: "center", minWidth: 120 }}>
                    <Typography variant="h4" color="success.main">
                      {Object.keys(corpusStats.strategiesCounts).length}
                    </Typography>
                    <Typography variant="caption">Stratégies</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: "center", minWidth: 120 }}>
                    <Typography variant="h4" color="warning.main">
                      {Object.keys(corpusStats.reactionsCounts).length}
                    </Typography>
                    <Typography variant="caption">Réactions</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: "center", minWidth: 120 }}>
                    <Typography variant="h4" color="info.main">
                      {Object.keys(corpusStats.familiesCounts).length}
                    </Typography>
                    <Typography variant="caption">Familles</Typography>
                  </Paper>
                </Box>

                {/* Détail des distributions */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Distribution détaillée du corpus</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {/* Stratégies */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Stratégies conseiller:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {Object.entries(corpusStats.strategiesCounts).map(
                            ([strategy, count]) => (
                              <Chip
                                key={strategy}
                                label={`${strategy}: ${count}`}
                                size="small"
                                variant="outlined"
                              />
                            )
                          )}
                        </Box>
                      </Box>

                      {/* Réactions */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Réactions client:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {Object.entries(corpusStats.reactionsCounts).map(
                            ([reaction, count]) => (
                              <Chip
                                key={reaction}
                                label={`${reaction}: ${count}`}
                                size="small"
                                variant="outlined"
                                color={
                                  reaction === "POSITIF"
                                    ? "success"
                                    : reaction === "NEGATIF"
                                    ? "error"
                                    : "default"
                                }
                              />
                            )
                          )}
                        </Box>
                      </Box>

                      {/* Familles */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Familles de stratégies:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {Object.entries(corpusStats.familiesCounts).map(
                            ([family, count]) => (
                              <Chip
                                key={family}
                                label={`${family}: ${count}`}
                                size="small"
                                variant="outlined"
                              />
                            )
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Configuration du test */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              gap: 3,
            }}
          >
            {/* Paramètres de base */}
            <Box sx={{ flex: 1 }}>
              <Card sx={adaptiveStyles.configCard}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuration du Test
                  </Typography>

                  {/* Algorithme */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Algorithme à tester</InputLabel>
                    <Select
                      value={config.algorithm}
                      label="Algorithme à tester"
                      onChange={(e) =>
                        updateConfig({ algorithm: e.target.value as any })
                      }
                      disabled={executionState.phase === "executing"}
                    >
                      <MenuItem value="BasicAlignmentAlgorithm">
                        <Box>
                          <Typography variant="body2">
                            Basic Alignment
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Analyse lexicale sentiment (145 patterns)
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="ConversationalPatternAlgorithm">
                        <Box>
                          <Typography variant="body2">
                            Conversational Pattern
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Analyse structurelle LI-CA
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* Type de test */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Type de validation</InputLabel>
                    <Select
                      value={config.testType}
                      label="Type de validation"
                      onChange={(e) =>
                        updateConfig({ testType: e.target.value as any })
                      }
                      disabled={executionState.phase === "executing"}
                    >
                      <MenuItem value="classification">
                        Accord classification seulement
                      </MenuItem>
                      <MenuItem value="prediction">
                        Prédiction réactions seulement
                      </MenuItem>
                      <MenuItem value="both">
                        Les deux tests (recommandé)
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* Taille échantillon */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Taille de l'échantillon</InputLabel>
                    <Select
                      value={config.sampleSize}
                      label="Taille de l'échantillon"
                      onChange={(e) =>
                        updateConfig({ sampleSize: Number(e.target.value) })
                      }
                      disabled={executionState.phase === "executing"}
                    >
                      <MenuItem value={100}>100 paires (test rapide)</MenuItem>
                      <MenuItem value={200}>200 paires (équilibré)</MenuItem>
                      <MenuItem value={500}>500 paires (robuste)</MenuItem>
                      <MenuItem value={1000}>1000 paires (complet)</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Stratification */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Stratification échantillon</InputLabel>
                    <Select
                      value={config.stratificationBy}
                      label="Stratification échantillon"
                      onChange={(e) =>
                        updateConfig({
                          stratificationBy: e.target.value as any,
                        })
                      }
                      disabled={executionState.phase === "executing"}
                    >
                      <MenuItem value="strategy">
                        Par stratégie conseiller
                      </MenuItem>
                      <MenuItem value="reaction">Par réaction client</MenuItem>
                      <MenuItem value="family">
                        Par famille de stratégie
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* Boutons de contrôle */}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={runValidationTest}
                      disabled={
                        executionState.phase === "executing" || isDataLoading
                      }
                      startIcon={<PlayIcon />}
                      fullWidth
                    >
                      {executionState.phase === "executing"
                        ? "Test en cours..."
                        : "Lancer validation"}
                    </Button>

                    {executionState.phase === "executing" && (
                      <Button
                        variant="outlined"
                        onClick={resetTest}
                        startIcon={<StopIcon />}
                        color="error"
                      >
                        Arrêter
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* État et progression */}
            <Box sx={{ flex: 1 }}>
              <Card sx={adaptiveStyles.configCard}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    État du Test
                  </Typography>

                  {/* Progression */}
                  {(executionState.phase === "executing" ||
                    executionState.phase === "preparing" ||
                    executionState.phase === "validating") && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom>
                        {executionState.currentStep}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={executionState.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(executionState.progress)}% •
                        {executionState.estimatedTimeRemaining > 0 &&
                          ` ${Math.round(
                            executionState.estimatedTimeRemaining / 1000
                          )}s restantes`}
                      </Typography>
                    </Box>
                  )}

                  {/* Statut actuel */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Configuration actuelle:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        • Algorithme: {config.algorithm}
                      </Typography>
                      <Typography variant="body2">
                        • Tests:{" "}
                        {config.testType === "both"
                          ? "Classification + Prédiction"
                          : config.testType === "classification"
                          ? "Classification seule"
                          : "Prédiction seule"}
                      </Typography>
                      <Typography variant="body2">
                        • Échantillon: {config.sampleSize} paires
                      </Typography>
                      <Typography variant="body2">
                        • Stratification: {config.stratificationBy}
                      </Typography>
                      {config.selectedOrigin && (
                        <Typography variant="body2">
                          • Origine: {config.selectedOrigin}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Statut d'exécution */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {executionState.phase === "completed" && (
                      <>
                        <CheckCircleIcon color="success" />
                        <Typography variant="body2" color="success.main">
                          Test terminé avec succès
                        </Typography>
                      </>
                    )}
                    {executionState.phase === "error" && (
                      <>
                        <ErrorIcon color="error" />
                        <Typography variant="body2" color="error.main">
                          Erreur lors du test
                        </Typography>
                      </>
                    )}
                    {executionState.phase === "executing" && (
                      <>
                        <SpeedIcon color="primary" />
                        <Typography variant="body2" color="primary.main">
                          Test en cours d'exécution
                        </Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Onglet Résultats */}
      <TabPanel value={activeTab} index={1}>
        {testResult ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Résumé exécutif */}
            <Card sx={adaptiveStyles.resultCard}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Résumé Exécutif
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                  <Paper sx={{ p: 2, textAlign: "center", minWidth: 150 }}>
                    <Typography variant="h4" color="primary">
                      {(
                        testResult.summary.overallClassificationAccuracy * 100
                      ).toFixed(1)}
                      %
                    </Typography>
                    <Typography variant="caption">
                      Accord Classification
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: "center", minWidth: 150 }}>
                    <Typography variant="h4" color="success.main">
                      {(
                        testResult.summary.overallPredictionAccuracy * 100
                      ).toFixed(1)}
                      %
                    </Typography>
                    <Typography variant="caption">
                      Précision Prédiction
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: "center", minWidth: 150 }}>
                    <Typography variant="h4" color="info.main">
                      {(testResult.summary.confidenceReliability * 100).toFixed(
                        1
                      )}
                      %
                    </Typography>
                    <Typography variant="caption">
                      Fiabilité Confiance
                    </Typography>
                  </Paper>
                </Box>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Recommandation:</strong>{" "}
                  {testResult.summary.recommendedUseCase}
                </Alert>
              </CardContent>
            </Card>

            {/* Résultats détaillés */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                gap: 3,
              }}
            >
              {/* Test Classification */}
              <Box sx={{ flex: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Test 1: Accord Classification
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      L'algorithme classe-t-il les verbatims comme l'expert
                      humain?
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        Kappa de Cohen:{" "}
                        <strong>
                          {testResult.classification.overallMetrics.kappaCohen.toFixed(
                            3
                          )}
                        </strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (&gt; 0.8: excellent, &gt; 0.6: bon, &gt; 0.4: modéré)
                      </Typography>
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Famille</TableCell>
                            <TableCell align="right">Accuracy</TableCell>
                            <TableCell align="right">F1-Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(
                            testResult.classification.byFamily
                          ).map(([family, metrics]) => (
                            <TableRow key={family}>
                              <TableCell>{family}</TableCell>
                              <TableCell align="right">
                                {(metrics.accuracy * 100).toFixed(1)}%
                              </TableCell>
                              <TableCell align="right">
                                {(
                                  (Object.values(metrics.f1Score).reduce(
                                    (a, b) => a + b,
                                    0
                                  ) /
                                    Object.values(metrics.f1Score).length) *
                                  100
                                ).toFixed(1)}
                                %
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>

              {/* Test Prédiction */}
              <Box sx={{ flex: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Test 2: Prédiction Réactions
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      L'algorithme prédit-il correctement
                      POSITIF/NEGATIF/NEUTRE?
                    </Typography>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Réaction</TableCell>
                            <TableCell align="right">Precision</TableCell>
                            <TableCell align="right">Recall</TableCell>
                            <TableCell align="right">F1</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {["POSITIF", "NEGATIF", "NEUTRE"].map((reaction) => (
                            <TableRow key={reaction}>
                              <TableCell>
                                <Chip
                                  label={reaction}
                                  size="small"
                                  color={
                                    reaction === "POSITIF"
                                      ? "success"
                                      : reaction === "NEGATIF"
                                      ? "error"
                                      : "default"
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                {(
                                  testResult.prediction.overallMetrics
                                    .precision[reaction] * 100
                                ).toFixed(1)}
                                %
                              </TableCell>
                              <TableCell align="right">
                                {(
                                  testResult.prediction.overallMetrics.recall[
                                    reaction
                                  ] * 100
                                ).toFixed(1)}
                                %
                              </TableCell>
                              <TableCell align="right">
                                {(
                                  testResult.prediction.overallMetrics.f1Score[
                                    reaction
                                  ] * 100
                                ).toFixed(1)}
                                %
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Recommandations */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommandations d'amélioration
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Classification:
                    </Typography>
                    {testResult.classification.recommendations.map((rec, i) => (
                      <Typography key={i} variant="body2" sx={{ pl: 2 }}>
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Prédiction:
                    </Typography>
                    {testResult.prediction.recommendations.map((rec, i) => (
                      <Typography key={i} variant="body2" sx={{ pl: 2 }}>
                        • {rec}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Actions sur les résultats */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="outlined"
                onClick={() => {
                  const jsonData = exportResults("json");
                  if (jsonData) {
                    const blob = new Blob([jsonData], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `validation_${
                      config.algorithm
                    }_${Date.now()}.json`;
                    a.click();
                  }
                }}
              >
                Exporter JSON
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  const csvData = exportResults("csv");
                  if (csvData) {
                    const blob = new Blob([csvData], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `validation_${
                      config.algorithm
                    }_${Date.now()}.csv`;
                    a.click();
                  }
                }}
              >
                Exporter CSV
              </Button>
              <Button variant="contained" onClick={resetTest} color="primary">
                Nouveau Test
              </Button>
            </Box>
          </Box>
        ) : (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Aucun résultat disponible
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Configurez et lancez un test dans l'onglet "Corpus & Config"
            </Typography>
          </Card>
        )}
      </TabPanel>
    </Box>
  );
};

export default SingleTestPanel;
