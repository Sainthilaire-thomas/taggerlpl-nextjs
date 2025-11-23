// components/AlgorithmLab/Level1/comparison/CrossValidation.tsx
// Interface de validation croisée pour évaluer la robustesse des classificateurs

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TimelineIcon from "@mui/icons-material/Timeline";
import BarChartIcon from "@mui/icons-material/BarChart";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { ClassifierRegistry } from "../../../algorithms/level1/shared/ClassifierRegistry";
import { useLevel1Testing } from "../../../hooks/useLevel1Testing";

interface FoldResult {
  foldIndex: number;
  classifierName: string;
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  processingTime: number;
  trainSize: number;
  testSize: number;
}

interface CrossValidationResults {
  classifierName: string;
  meanAccuracy: number;
  stdAccuracy: number;
  meanProcessingTime: number;
  stdProcessingTime: number;
  foldResults: FoldResult[];
  stability: "high" | "medium" | "low";
  confidence: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

export const CrossValidation: React.FC = () => {
  const [selectedClassifiers, setSelectedClassifiers] = useState<string[]>([]);
  const [kFolds, setKFolds] = useState<number>(5);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [results, setResults] = useState<CrossValidationResults[]>([]);
  const [tabValue, setTabValue] = useState(0);

  const { goldStandardData, validateAlgorithm, calculateMetrics } =
    useLevel1Testing();
  const availableClassifiers = ClassifierRegistry.listRegistered();

  // Initialisation avec un classificateur par défaut
  useEffect(() => {
    if (availableClassifiers.length > 0) {
      setSelectedClassifiers([availableClassifiers[0]]);
    }
  }, []);

  // Fonction pour diviser les données en k folds
  const createKFolds = (data: any[], k: number) => {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const foldSize = Math.floor(shuffled.length / k);
    const folds = [];

    for (let i = 0; i < k; i++) {
      const start = i * foldSize;
      const end = i === k - 1 ? shuffled.length : start + foldSize;
      folds.push(shuffled.slice(start, end));
    }

    return folds;
  };

  // Calcul de la stabilité basé sur l'écart-type
  const calculateStability = (
    results: FoldResult[]
  ): "high" | "medium" | "low" => {
    const accuracies = results.map((r) => r.accuracy);
    const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance =
      accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) /
      accuracies.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 2) return "high";
    if (stdDev < 5) return "medium";
    return "low";
  };

  // Exécution de la validation croisée
  const runCrossValidation = async () => {
    if (
      selectedClassifiers.length === 0 ||
      !goldStandardData ||
      goldStandardData.length < kFolds
    ) {
      return;
    }

    setIsRunning(true);
    setCurrentProgress(0);
    setResults([]);

    try {
      const folds = createKFolds(goldStandardData, kFolds);
      const totalOperations = selectedClassifiers.length * kFolds;
      let completedOperations = 0;
      const allResults: CrossValidationResults[] = [];

      for (const classifierName of selectedClassifiers) {
        setCurrentStatus(`Test en cours: ${classifierName}`);
        const foldResults: FoldResult[] = [];

        for (let foldIndex = 0; foldIndex < kFolds; foldIndex++) {
          setCurrentStatus(
            `${classifierName} - Fold ${foldIndex + 1}/${kFolds}`
          );

          // Données de test = fold actuel
          const testData = folds[foldIndex];

          // Données d'entraînement = tous les autres folds
          const trainData = folds
            .filter((_, index) => index !== foldIndex)
            .flat();

          try {
            // Simulation de l'entraînement (ici on utilise juste le test)
            // Dans un vrai contexte, on entraînerait sur trainData

            const validationResults = [];
            const classifier = ClassifierRegistry.getClassifier(classifierName);

            if (classifier) {
              const startTime = Date.now();

              for (const sample of testData) {
                const prediction = await classifier.classify(sample.verbatim);
                validationResults.push({
                  verbatim: sample.verbatim,
                  goldStandard: sample.expectedTag,
                  predicted: prediction.prediction,
                  confidence: prediction.confidence || 0,
                  correct: prediction.prediction === sample.expectedTag,
                });
              }

              const processingTime = Date.now() - startTime;
              const metrics = calculateMetrics(validationResults);

              const foldResult: FoldResult = {
                foldIndex,
                classifierName,
                accuracy: parseFloat(metrics.accuracy.toString()),
                precision: metrics.precision,
                recall: metrics.recall,
                f1Score: metrics.f1Score,
                processingTime,
                trainSize: trainData.length,
                testSize: testData.length,
              };

              foldResults.push(foldResult);
            }
          } catch (error) {
            console.error(`Erreur fold ${foldIndex}:`, error);
          }

          completedOperations++;
          setCurrentProgress((completedOperations / totalOperations) * 100);
        }

        // Calcul des statistiques globales pour ce classificateur
        if (foldResults.length > 0) {
          const accuracies = foldResults.map((r) => r.accuracy);
          const processingTimes = foldResults.map((r) => r.processingTime);

          const meanAccuracy =
            accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
          const stdAccuracy = Math.sqrt(
            accuracies.reduce(
              (sum, acc) => sum + Math.pow(acc - meanAccuracy, 2),
              0
            ) / accuracies.length
          );

          const meanProcessingTime =
            processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
          const stdProcessingTime = Math.sqrt(
            processingTimes.reduce(
              (sum, time) => sum + Math.pow(time - meanProcessingTime, 2),
              0
            ) / processingTimes.length
          );

          const crossValidationResult: CrossValidationResults = {
            classifierName,
            meanAccuracy,
            stdAccuracy,
            meanProcessingTime,
            stdProcessingTime,
            foldResults,
            stability: calculateStability(foldResults),
            confidence: 1 - stdAccuracy / 100, // Confiance basée sur la stabilité
          };

          allResults.push(crossValidationResult);
        }
      }

      setResults(allResults.sort((a, b) => b.meanAccuracy - a.meanAccuracy));
    } catch (error) {
      console.error("Erreur validation croisée:", error);
    } finally {
      setIsRunning(false);
      setCurrentProgress(0);
      setCurrentStatus("");
    }
  };

  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case "high":
        return "success";
      case "medium":
        return "warning";
      case "low":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Validation Croisée (Cross-Validation)
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Évaluation de la robustesse et stabilité des classificateurs via
        validation croisée k-fold
      </Typography>

      {/* Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration de la Validation Croisée
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              alignItems: "center",
            }}
          >
            <Box sx={{ flex: "1 1 300px" }}>
              <FormControl fullWidth>
                <InputLabel>Classificateurs</InputLabel>
                <Select
                  multiple
                  value={selectedClassifiers}
                  onChange={(e) =>
                    setSelectedClassifiers(e.target.value as string[])
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableClassifiers.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel>K-Folds</InputLabel>
                <Select
                  value={kFolds}
                  onChange={(e) => setKFolds(e.target.value as number)}
                >
                  <MenuItem value={3}>3-Fold</MenuItem>
                  <MenuItem value={5}>5-Fold</MenuItem>
                  <MenuItem value={10}>10-Fold</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Button
                variant="contained"
                onClick={runCrossValidation}
                disabled={isRunning || selectedClassifiers.length === 0}
                startIcon={<PlayArrowIcon />}
                size="large"
              >
                {isRunning ? "Validation..." : "Lancer CV"}
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Échantillon: {goldStandardData?.length || 0} paires adjacentes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Taille par fold: ~
              {Math.floor((goldStandardData?.length || 0) / kFolds)}
            </Typography>
          </Box>

          {isRunning && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={currentProgress} />
              <Typography variant="caption" sx={{ mt: 1 }}>
                {currentStatus} ({Math.round(currentProgress)}%)
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Résultats */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center" }}
            >
              <AssessmentIcon sx={{ mr: 1 }} />
              Résultats de Validation Croisée
            </Typography>

            {/* Onglets pour différentes vues */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Vue Synthétique" />
                <Tab label="Détail par Fold" />
                <Tab label="Analyse Stabilité" />
              </Tabs>
            </Box>

            {/* Vue synthétique */}
            <TabPanel value={tabValue} index={0}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Classificateur</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Accuracy Moyenne</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Écart-type</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Temps (ms)</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Stabilité</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Confiance</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={result.classifierName}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Chip
                              label={`#${index + 1}`}
                              color={index === 0 ? "primary" : "default"}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            {result.classifierName}
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Typography
                            variant="h6"
                            color={index === 0 ? "primary.main" : "inherit"}
                          >
                            {result.meanAccuracy.toFixed(1)}%
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography>
                            ±{result.stdAccuracy.toFixed(1)}%
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography>
                            {Math.round(result.meanProcessingTime)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            ±{Math.round(result.stdProcessingTime)}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={result.stability.toUpperCase()}
                            color={getStabilityColor(result.stability) as any}
                            size="small"
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Typography>
                            {(result.confidence * 100).toFixed(0)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Détail par fold */}
            <TabPanel value={tabValue} index={1}>
              {results.map((result) => (
                <Accordion key={result.classifierName} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      {result.classifierName} - Détail des {kFolds} Folds
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Fold</TableCell>
                            <TableCell align="center">Accuracy</TableCell>
                            <TableCell align="center">Temps (ms)</TableCell>
                            <TableCell align="center">Train/Test</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.foldResults.map((fold) => (
                            <TableRow key={fold.foldIndex}>
                              <TableCell>Fold {fold.foldIndex + 1}</TableCell>
                              <TableCell align="center">
                                {fold.accuracy.toFixed(1)}%
                              </TableCell>
                              <TableCell align="center">
                                {fold.processingTime}ms
                              </TableCell>
                              <TableCell align="center">
                                {fold.trainSize}/{fold.testSize}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </TabPanel>

            {/* Analyse stabilité */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {results.map((result) => (
                  <Card key={result.classifierName} sx={{ flex: "1 1 300px" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {result.classifierName}
                      </Typography>

                      <Stack spacing={1}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2">
                            Stability Score:
                          </Typography>
                          <Chip
                            label={result.stability.toUpperCase()}
                            color={getStabilityColor(result.stability) as any}
                            size="small"
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2">Variance:</Typography>
                          <Typography variant="body2">
                            {(result.stdAccuracy ** 2).toFixed(2)}%²
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2">
                            Coefficient de variation:
                          </Typography>
                          <Typography variant="body2">
                            {(
                              (result.stdAccuracy / result.meanAccuracy) *
                              100
                            ).toFixed(1)}
                            %
                          </Typography>
                        </Box>
                      </Stack>

                      {result.stability === "low" && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Faible stabilité - Résultats variables selon les
                          données
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </TabPanel>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
