import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Chip,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

import { ClassifierSelector } from "../../../shared/ClassifierSelector";
import { ClassifierRegistry } from "../../../../algorithms/level1/shared/ClassifierRegistry";
import { BaseClassifier } from "../../../../algorithms/level1/shared/BaseClassifier";
import { useLevel1Testing } from "../../../../hooks/useLevel1Testing";
import { initializeClassifiers } from "../../../../algorithms/level1/shared/initializeClassifiers";

// ⬇️ nouveaux imports
import { RunPanel } from "./RunPanel";
import { MetricsPanel, type SimpleMetrics } from "./MetricsPanel";
import { ResultsSample } from "./ResultsSample";

interface ValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: Record<string, any>;
}

initializeClassifiers();

export const TechnicalValidation: React.FC = () => {
  const [selectedClassifier, setSelectedClassifier] = useState<string>(
    "RegexConseillerClassifier"
  );
  const [classifierInstance, setClassifierInstance] =
    useState<BaseClassifier | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, any>>(
    {}
  );
  const [testResults, setTestResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    goldStandardData,
    validateAlgorithm,
    calculateMetrics,
    analyzeErrors,
  } = useLevel1Testing();

  const [sampleSize, setSampleSize] = useState<number>(0);

  useEffect(() => {
    const total = goldStandardData?.length || 0;
    if (total > 0 && sampleSize === 0) {
      // valeur initiale raisonnable
      setSampleSize(Math.min(1000, total));
    }
  }, [goldStandardData, sampleSize]);

  useEffect(() => {
    const classifier = ClassifierRegistry.getClassifier(selectedClassifier);
    setClassifierInstance(classifier || null);
    setError(null);

    if (classifier && "testConnection" in classifier) {
      (classifier as any)
        .testConnection()
        .then((result: any) => {
          setConnectionStatus((prev) => ({
            ...prev,
            [selectedClassifier]: result,
          }));
        })
        .catch(() => {
          setConnectionStatus((prev) => ({
            ...prev,
            [selectedClassifier]: {
              success: false,
              message: "Test connexion échoué",
            },
          }));
        });
    }
  }, [selectedClassifier]);

  const runValidation = async () => {
    if (!classifierInstance) {
      setError("Aucun classificateur sélectionné");
      return;
    }
    setIsRunning(true);
    setError(null);
    setTestResults([]);
    setProgress(0);

    try {
      const results = await validateAlgorithm(selectedClassifier, sampleSize); // <-- ICI
      setTestResults(results);
      const metrics = calculateMetrics(results);
      const errorAnalysis = analyzeErrors(results);
      console.log("📊 Métriques individuelles:", metrics);
      console.log("🔍 Analyse erreurs:", errorAnalysis);
    } catch (error) {
      console.error("❌ Erreur validation individuelle:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };
  // Transforme en métriques simples pour le panel
  const currentMetrics: SimpleMetrics | null = React.useMemo(() => {
    if (testResults.length === 0) return null;

    const correct = testResults.filter((r) => r.correct).length;
    const total = testResults.length;
    const accuracy = (correct / total) * 100;

    const avgProcessingTime =
      testResults
        .filter((r) => r.processingTime)
        .reduce((s, r) => s + (r.processingTime || 0), 0) / testResults.length;

    const confidenceStats = testResults.reduce(
      (acc, r) => {
        acc.sum += r.confidence;
        acc.min = Math.min(acc.min, r.confidence);
        acc.max = Math.max(acc.max, r.confidence);
        return acc;
      },
      { sum: 0, min: 1, max: 0 }
    );

    return {
      accuracy: accuracy.toFixed(1),
      correctPredictions: correct,
      totalSamples: total,
      avgProcessingTime: Math.round(avgProcessingTime),
      avgConfidence: (confidenceStats.sum / total).toFixed(2),
      minConfidence: confidenceStats.min.toFixed(2),
      maxConfidence: confidenceStats.max.toFixed(2),
    };
  }, [testResults]);

  const classifierMetadata = classifierInstance?.getMetadata();
  const isConfigValid = classifierInstance?.validateConfig() ?? false;
  const apiOnline = connectionStatus[selectedClassifier]?.success; // boolean | undefined

  const { getRelevantCountFor } = useLevel1Testing();

  const totalForCurrent = useMemo(
    () => getRelevantCountFor(selectedClassifier),
    [getRelevantCountFor, selectedClassifier]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Validation Technique Individuelle
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Test approfondi d'un algorithme de classification contre le gold
        standard
      </Typography>

      {/* Sélection et configuration du classificateur */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">
              Algorithme: <strong>{selectedClassifier}</strong>
            </Typography>

            {classifierMetadata && (
              <>
                <Chip
                  label={classifierMetadata.type}
                  color={
                    classifierMetadata.type === "rule-based"
                      ? "primary"
                      : "secondary"
                  }
                  size="small"
                />
                <Chip
                  label={`v${classifierMetadata.version}`}
                  variant="outlined"
                  size="small"
                />
                {connectionStatus[selectedClassifier] && (
                  <Chip
                    label={apiOnline ? "En ligne" : "Hors ligne"}
                    color={apiOnline ? "success" : "warning"}
                    size="small"
                  />
                )}
              </>
            )}
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <ClassifierSelector
            selectedClassifier={selectedClassifier}
            onSelectClassifier={setSelectedClassifier}
            showDescription
            showConfiguration
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ▶️ Run Panel */}

      <RunPanel
        isRunning={isRunning}
        isConfigValid={isConfigValid}
        goldStandardCount={totalForCurrent}
        sampleSize={sampleSize}
        onSampleSizeChange={setSampleSize}
        onRun={runValidation}
        domainLabel={classifierMetadata?.targetDomain || "Général"}
        supportsBatch={!!classifierMetadata?.supportsBatch}
      />

      {isRunning && (
        <Box sx={{ mt: -2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
            Traitement en cours... {testResults.length} échantillons analysés
          </Typography>
        </Box>
      )}

      {/* 📊 Metrics Panel */}
      {currentMetrics && (
        <MetricsPanel
          classifierLabel={classifierMetadata?.name || selectedClassifier}
          results={testResults}
        />
      )}

      {/* 🧪 Results Sample */}
      <ResultsSample results={testResults} limit={10} />
    </Box>
  );
};
