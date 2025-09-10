// src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/algorithms/BaseAlgorithmTesting.tsx
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

import AlgorithmSelector from "../../../../shared/molecules/AlgorithmSelector";
import { algorithmRegistry } from "../../../algorithms/level1/shared/AlgorithmRegistry";
import { useLevel1Testing } from "../../../hooks/useLevel1Testing";

import RunPanel from "../shared/results/base/RunPanel";
import { ResultsPanel } from "src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/results/base/ResultsSample/ResultsPanel";

// ✅ MIGRATION : Import des types centralisés AlgorithmLab
import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
} from "../../../types";

// ✅ MIGRATION : Interface registry conforme aux types centralisés
interface RegistryEntry {
  key: string;
  meta: AlgorithmMetadata; // ✅ Utilise le type centralisé
}

type BaseAlgorithmTestingProps = {
  variableLabel: string;
  defaultClassifier?: string;
  target?: VariableTarget; // ✅ Utilise le type centralisé
};

const DEFAULT_CLASSIFIER = undefined as unknown as string;

export const BaseAlgorithmTesting: React.FC<BaseAlgorithmTestingProps> = ({
  variableLabel,
  defaultClassifier = DEFAULT_CLASSIFIER,
  target = "X",
}) => {
  // --- ÉTATS LOCAUX (ordre stable) ---
  const [sampleSizeInitialized, setSampleSizeInitialized] =
    React.useState(false);
  const [selectedModelId, setSelectedModelId] = React.useState<string>("");
  const [testResults, setTestResults] = React.useState<
    TVValidationResultCore[]
  >([]); // ✅ Type centralisé
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sampleSize, setSampleSize] = React.useState<number>(100);

  // --- HOOKS PROJECT ---
  const level1Testing = useLevel1Testing();

  // --- Liste des entrées du registry filtrées par target ---
  const entriesForTarget = React.useMemo(() => {
    const all = (algorithmRegistry.list?.() ?? []) as RegistryEntry[];
    // ✅ CORRECTION : Utiliser target depuis les métadonnées centralisées
    return all.filter((e) => e.meta?.target === target);
  }, [target]);

  // --- Initialisation/Correction du modèle sélectionné si invalide pour la cible ---
  React.useEffect(() => {
    if (entriesForTarget.length === 0) return;
    const existsForTarget = entriesForTarget.some(
      (e) => e.key === selectedModelId
    );
    if (!existsForTarget) {
      setSelectedModelId(entriesForTarget[0].key);
    }
  }, [entriesForTarget, selectedModelId]);

  // --- Métadonnées du modèle sélectionné (via list() pour accéder à meta) ---
  const selectedEntry = React.useMemo(
    () => entriesForTarget.find((e) => e.key === selectedModelId),
    [entriesForTarget, selectedModelId]
  );

  const meta = selectedEntry?.meta ?? ({} as RegistryAlgorithmMeta);

  // ✅ CORRECTION : Utilisation des propriétés compatibles avec le registry actuel
  const selectedDisplayName = meta.displayName ?? meta.label ?? selectedModelId;
  const typeLabel = meta.type ?? "rule-based"; // ✅ Propriété du registry actuel
  const chipColor = typeLabel === "rule-based" ? "primary" : "secondary";
  const versionLabel = meta.version;
  const supportsBatch = true; // ✅ Assumé pour tous les algorithmes centralisés
  const domainLabel = meta.description ?? "Général";
  const isConfigValid = true;

  // --- EXTRACTIONS SANS DESTRUCTURING CONDITIONNEL ---
  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // --- INIT SAMPLESIZE UNE FOIS LES DONNÉES LÀ ---
  React.useEffect(() => {
    if (sampleSizeInitialized) return;
    const total = goldStandardData?.length || 0;
    if (total > 0) {
      setSampleSize(Math.min(1000, total));
      setSampleSizeInitialized(true);
    }
  }, [goldStandardData, sampleSizeInitialized]);

  // --- TOTAL APPLICABLE AU MODÈLE COURANT ---
  const totalForCurrent = React.useMemo(() => {
    if (!getRelevantCountFor || !selectedModelId) return 0;
    return getRelevantCountFor(selectedModelId);
  }, [getRelevantCountFor, selectedModelId]);

  const goldCount = React.useMemo(() => {
    // 1) idéal : nombre de "paires adjacentes" exposé par le hook
    const pairsCount = (level1Testing as any)?.goldStandardPairsCount;

    // 2) fallback : longueur du tableau gold standard chargé
    const dataCount = Array.isArray(level1Testing.goldStandardData)
      ? level1Testing.goldStandardData.length
      : 0;

    return typeof pairsCount === "number" ? pairsCount : dataCount;
  }, [level1Testing]);

  // --- RUN VALIDATION ---
  const runValidation = React.useCallback(async () => {
    if (!validateAlgorithm || !selectedModelId) return;

    setError(null);
    setTestResults([]);
    setIsRunning(true);

    try {
      // ✅ validateAlgorithm retourne déjà des ValidationResult[] conformes
      const results = await validateAlgorithm(selectedModelId, sampleSize);
      setTestResults(results as TVValidationResultCore[]); // ✅ Cast sûr vers type centralisé

      if (calculateMetrics && analyzeErrors) {
        const metrics = calculateMetrics(results);
        const errorAnalysis = analyzeErrors(results);
        console.log("📊 Metrics:", metrics);
        console.log("🔍 Errors:", errorAnalysis);
      }
    } catch (e: any) {
      console.error("❌ Validation error:", e);
      setError(e?.message || "Erreur inconnue");
    } finally {
      setIsRunning(false);
    }
  }, [
    validateAlgorithm,
    calculateMetrics,
    analyzeErrors,
    selectedModelId,
    sampleSize,
  ]);

  // --- GUARD LOADING ---
  const isReady = !!level1Testing;
  if (!isReady) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Chargement…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {variableLabel} — Test individuel
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Lance un test contre le gold standard et inspecte les résultats.
      </Typography>

      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">
              Algorithme : <strong>{selectedDisplayName}</strong>
            </Typography>
            <Chip label={typeLabel} color={chipColor as any} size="small" />
            {versionLabel && (
              <Chip
                label={`v${versionLabel}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <AlgorithmSelector
            variant="detailed"
            algorithms={entriesForTarget.map((e) => ({
              id: e.key,
              name: e.meta?.displayName ?? e.meta?.label ?? e.key,
              description: e.meta?.description ?? "",
              // ✅ MIGRATION : Propriétés par défaut pour compat avec AlgorithmSelector
              differential: 0,
              time: 0,
              accuracy: 0,
            }))}
            selectedAlgorithm={selectedModelId}
            onAlgorithmChange={setSelectedModelId}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <RunPanel
        isRunning={isRunning}
        isConfigValid={isConfigValid}
        goldStandardCount={goldCount}
        sampleSize={sampleSize}
        onSampleSizeChange={setSampleSize}
        onRun={runValidation}
        domainLabel={domainLabel}
        supportsBatch={supportsBatch}
      />

      {isRunning && (
        <Box sx={{ mt: -2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
            Traitement en cours… {testResults.length} échantillons analysés
          </Typography>
        </Box>
      )}

      <ResultsPanel
        results={testResults}
        initialPageSize={10}
        targetKind={target as TargetKind} // ✅ Cast vers type centralisé
        classifierLabel={selectedDisplayName}
      />
    </Box>
  );
};
