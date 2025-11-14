// components/AlgorithmLab/Level1/comparison/AlgorithmComparison.tsx
// Interface de comparaison multi-algorithmes

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Paper,
  Chip,
  Stack,
} from "@mui/material";

import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AssessmentIcon from "@mui/icons-material/Assessment";

import { ClassifierRegistry } from "../../../algorithms/level1/shared/ClassifierRegistry";
import { useLevel1Testing } from "../../../hooks/useLevel1Testing";

interface ComparisonResult {
  classifierName: string;
  accuracy: number;
  avgProcessingTime: number;
  avgConfidence: number;
  totalSamples: number;
  correctPredictions: number;
  metadata: {
    type: string;
    version: string;
    name: string;
  };
}

export const AlgorithmComparison: React.FC = () => {
  const [selectedClassifiers, setSelectedClassifiers] = useState<string[]>([
    "RegexConseillerClassifier",
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<
    ComparisonResult[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const { compareAlgorithms, calculateMetrics, goldStandardData } =
    useLevel1Testing();

  const availableClassifiers = ClassifierRegistry.listRegistered();

  // Gestion sélection classificateurs
  const handleClassifierToggle = (classifierName: string) => {
    setSelectedClassifiers((prev) =>
      prev.includes(classifierName)
        ? prev.filter((name) => name !== classifierName)
        : [...prev, classifierName]
    );
  };

  // Lancement comparaison
  const runComparison = async () => {
    if (selectedClassifiers.length < 2) {
      setError("Sélectionnez au moins 2 classificateurs pour comparer");
      return;
    }

    setIsRunning(true);
    setError(null);
    setComparisonResults([]);

    try {
      console.log(
        `🔄 Comparaison de ${selectedClassifiers.length} classificateurs`
      );

      const results = await compareAlgorithms(selectedClassifiers);
      const comparisonData: ComparisonResult[] = [];

      for (const [classifierName, validationResults] of Object.entries(
        results
      )) {
        if (validationResults.length === 0) continue;

        const metrics = calculateMetrics(validationResults);
        const classifier = ClassifierRegistry.getClassifier(classifierName);
        const metadata = classifier?.getMetadata();

        comparisonData.push({
          classifierName,
          accuracy: parseFloat(metrics.accuracy.toString()),
          avgProcessingTime: metrics.avgProcessingTime,
          avgConfidence: metrics.avgConfidence,
          totalSamples: validationResults.length,
          correctPredictions: validationResults.filter((r) => r.correct).length,
          metadata: {
            type: metadata?.type || "unknown",
            version: metadata?.version || "0.0.0",
            name: metadata?.name || classifierName,
          },
        });
      }

      // Tri par accuracy décroissante
      comparisonData.sort((a, b) => b.accuracy - a.accuracy);
      setComparisonResults(comparisonData);

      console.log("📊 Comparaison terminée:", comparisonData);
    } catch (error) {
      console.error("❌ Erreur comparaison:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour obtenir la couleur selon le rang
  const getRankColor = (
    index: number,
    total: number
  ): "success" | "warning" | "error" | "default" => {
    if (total <= 1) return "default";
    if (index === 0) return "success";
    if (index === total - 1) return "error";
    return "warning";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Comparaison Multi-Algorithmes
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Comparaison des performances de plusieurs classificateurs sur le même
        échantillon gold standard
      </Typography>

      {/* Sélection des classificateurs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sélection des Classificateurs à Comparer
          </Typography>

          <FormGroup row>
            {availableClassifiers.map((classifierName) => {
              const classifier =
                ClassifierRegistry.getClassifier(classifierName);
              const metadata = classifier?.getMetadata();

              return (
                <FormControlLabel
                  key={classifierName}
                  control={
                    <Checkbox
                      checked={selectedClassifiers.includes(classifierName)}
                      onChange={() => handleClassifierToggle(classifierName)}
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography>
                        {metadata?.name || classifierName}
                      </Typography>
                      {metadata && (
                        <Chip
                          label={metadata.type}
                          size="small"
                          color={
                            metadata.type === "rule-based"
                              ? "primary"
                              : "secondary"
                          }
                        />
                      )}
                    </Stack>
                  }
                />
              );
            })}
          </FormGroup>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              {selectedClassifiers.length} classificateur(s) sélectionné(s) •
              Échantillon: {goldStandardData?.length || 0} paires adjacentes
            </Typography>

            <Button
              variant="contained"
              onClick={runComparison}
              disabled={isRunning || selectedClassifiers.length < 2}
              startIcon={<CompareArrowsIcon />}
              size="large"
            >
              {isRunning ? "Comparaison..." : "Lancer Comparaison"}
            </Button>
          </Stack>

          {isRunning && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1 }}>
                Test en cours sur {selectedClassifiers.length} algorithmes...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Résultats de comparaison */}
      {comparisonResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center" }}
            >
              <AssessmentIcon sx={{ mr: 1 }} />
              Résultats Comparatifs
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Rang</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Classificateur</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Type</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Accuracy</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Temps Moyen</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Confiance</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Résultats</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonResults.map((result, index) => (
                    <TableRow
                      key={result.classifierName}
                      sx={{
                        backgroundColor:
                          index === 0
                            ? "success.light"
                            : index === comparisonResults.length - 1
                            ? "error.light"
                            : "inherit",
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={`#${index + 1}`}
                          color={getRankColor(index, comparisonResults.length)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {result.metadata.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            v{result.metadata.version}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={result.metadata.type}
                          size="small"
                          color={
                            result.metadata.type === "rule-based"
                              ? "primary"
                              : "secondary"
                          }
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Typography
                          variant="h6"
                          color={index === 0 ? "success.main" : "inherit"}
                          fontWeight="bold"
                        >
                          {result.accuracy.toFixed(1)}%
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2">
                          {result.avgProcessingTime}ms
                        </Typography>
                        {result.metadata.type === "ml" &&
                          result.avgProcessingTime > 100 && (
                            <Typography
                              variant="caption"
                              color="warning.main"
                              display="block"
                            >
                              ⚡ API
                            </Typography>
                          )}
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2">
                          {result.avgConfidence.toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2">
                          {result.correctPredictions}/{result.totalSamples}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          (
                          {(
                            (result.correctPredictions / result.totalSamples) *
                            100
                          ).toFixed(0)}
                          %)
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Analyse comparative */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Analyse Comparative
              </Typography>

              {/* Pré-calculs sans mutation */}
              {(() => {
                const bySpeed = [...comparisonResults].sort(
                  (a, b) => a.avgProcessingTime - b.avgProcessingTime
                );
                const byConfidence = [...comparisonResults].sort(
                  (a, b) => b.avgConfidence - a.avgConfidence
                );
                const fastest = bySpeed[0];
                const mostConfident = byConfidence[0];
                const best = comparisonResults[0];

                return (
                  <>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      <Box sx={{ flex: "1 1 300px" }}>
                        <Alert severity="success">
                          <Typography variant="body2">
                            <strong>Meilleur Accuracy :</strong>
                            <br />
                            {best?.metadata.name} ({best?.accuracy.toFixed(1)}%)
                          </Typography>
                        </Alert>
                      </Box>

                      <Box sx={{ flex: "1 1 300px" }}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>Plus Rapide :</strong>
                            <br />
                            {fastest?.metadata.name} (
                            {fastest?.avgProcessingTime}ms)
                          </Typography>
                        </Alert>
                      </Box>

                      <Box sx={{ flex: "1 1 300px" }}>
                        <Alert severity="warning">
                          <Typography variant="body2">
                            <strong>Plus Confiant :</strong>
                            <br />
                            {mostConfident?.metadata.name} (
                            {mostConfident?.avgConfidence.toFixed(2)})
                          </Typography>
                        </Alert>
                      </Box>
                    </Box>

                    {/* Recommandations */}
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Recommandations :</strong>
                        <br />• Pour la <strong>production</strong> :
                        privilégier {best?.metadata.name} (meilleur accuracy)
                        <br />• Pour le <strong>temps réel</strong> :
                        privilégier les classificateurs &lt;50ms
                        <br />• Pour la <strong>recherche</strong> : analyser
                        les erreurs des différents algorithmes
                      </Typography>
                    </Alert>
                  </>
                );
              })()}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
