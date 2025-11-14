"use client";

import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Alert,
  LinearProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { ClassifierSelector } from "@/features/phase3-analysis/shared/ui/molecules/ClassifierSelector";
import { useLevel1Testing } from "../@/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing";
import { RunPanel } from "../../shared/results/base/RunPanel";
import { MetricsPanel } from "../../shared/results/base/MetricsPanel";
import { ResultsPanel } from "../../shared/results/base/ResultsSample/ResultsPanel";
import { useClassifierStatus } from "@/features/phase3-analysis/level1-validation/ui/hooks/useClassifierStatus";

interface ValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export const TechnicalValidation: React.FC = () => {
  // ✅ SOLUTION 1: État pour éviter la réinitialisation en boucle
  const [sampleSizeInitialized, setSampleSizeInitialized] =
    React.useState(false);

  // TOUS les hooks d'état d'abord, dans un ordre fixe
  const [selectedClassifier, setSelectedClassifier] = React.useState<string>(
    "RegexConseillerClassifier"
  );
  const [testResults, setTestResults] = React.useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sampleSize, setSampleSize] = React.useState<number>(100);

  // TOUS les hooks personnalisés après, dans un ordre fixe
  const level1Testing = useLevel1Testing();
  const classifierStatus = useClassifierStatus(selectedClassifier);

  // Extraction des valeurs des hooks (pas de destructuring conditionnel)
  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  const statusLoading = classifierStatus.loading;
  const statusError = classifierStatus.error;
  const selectedInfo = classifierStatus.selected;
  const isConfigValid = classifierStatus.isConfigValid;
  const supportsBatch = classifierStatus.supportsBatch;
  const domainLabel = classifierStatus.domainLabel;

  // ✅ SOLUTION 2: useEffect corrigé sans boucle infinie
  React.useEffect(() => {
    // Éviter la réinitialisation multiple
    if (sampleSizeInitialized) return;

    const total = goldStandardData?.length || 0;
    if (total > 0) {
      const newSampleSize = Math.min(1000, total);
      setSampleSize(newSampleSize);
      setSampleSizeInitialized(true);
    }
  }, [goldStandardData, sampleSizeInitialized]); // ❌ Retiré sampleSize des deps

  // Tous les useMemo après, dans un ordre fixe
  const totalForCurrent = React.useMemo(() => {
    if (!getRelevantCountFor || !selectedClassifier) return 0;
    return getRelevantCountFor(selectedClassifier);
  }, [getRelevantCountFor, selectedClassifier]);

  // ✅ SOLUTION 3: Valeurs avec fallbacks stables
  const typeLabel = selectedInfo?.type ?? "rule-based";
  const chipColor = typeLabel === "rule-based" ? "primary" : "secondary";

  // ✅ SOLUTION 4: Callback stable avec dépendances explicites
  const runValidation = React.useCallback(async () => {
    if (!validateAlgorithm) return;

    setError(null);
    setTestResults([]);
    setIsRunning(true);

    try {
      const results = await validateAlgorithm(selectedClassifier, sampleSize);
      setTestResults(results);

      if (calculateMetrics && analyzeErrors) {
        const metrics = calculateMetrics(results);
        const errorAnalysis = analyzeErrors(results);
        console.log("📊 Métriques individuelles:", metrics);
        console.log("🔍 Analyse erreurs:", errorAnalysis);
      }
    } catch (e: any) {
      console.error("❌ Erreur validation individuelle:", e);
      setError(e?.message || "Erreur inconnue");
    } finally {
      setIsRunning(false);
    }
  }, [
    validateAlgorithm,
    calculateMetrics,
    analyzeErrors,
    selectedClassifier,
    sampleSize,
  ]);

  // ✅ SOLUTION 5: Guard avec return précoce APRÈS tous les hooks
  const isDataReady = level1Testing && classifierStatus && goldStandardData;

  if (!isDataReady) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Validation Technique Individuelle
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Test approfondi d'un algorithme de classification contre le gold
        standard
      </Typography>

      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">
              Algorithme: <strong>{selectedClassifier}</strong>
            </Typography>

            {selectedInfo && (
              <>
                <Chip label={typeLabel} color={chipColor as any} size="small" />
                {selectedInfo.version && (
                  <Chip
                    label={`v${selectedInfo.version}`}
                    variant="outlined"
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

          {(error || statusError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error || statusError}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <RunPanel
        isRunning={isRunning || statusLoading}
        isConfigValid={isConfigValid}
        goldStandardCount={totalForCurrent}
        sampleSize={sampleSize}
        onSampleSizeChange={setSampleSize}
        onRun={runValidation}
        domainLabel={domainLabel || "Général"}
        supportsBatch={!!supportsBatch}
      />

      {isRunning && (
        <Box sx={{ mt: -2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
            Traitement en cours... {testResults.length} échantillons analysés
          </Typography>
        </Box>
      )}

      {testResults.length > 0 && (
        <MetricsPanel
          classifierLabel={selectedInfo?.displayName || selectedClassifier}
          results={testResults}
        />
      )}

      <ResultsPanel results={testResults} limit={10} />
    </Box>
  );
};
