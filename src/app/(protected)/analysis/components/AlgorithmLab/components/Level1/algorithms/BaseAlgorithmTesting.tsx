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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import HistoryIcon from "@mui/icons-material/History";

import AlgorithmSelector from "../../../../shared/molecules/AlgorithmSelector";
import { algorithmRegistry } from "../../../algorithms/level1/shared/AlgorithmRegistry";
import { useLevel1Testing } from "../../../hooks/useLevel1Testing";
import { useAlgorithmVersioning } from "../../../hooks/useAlgorithmVersioning";
import { usePostValidationVersioning } from "../../../hooks/usePostValidationVersioning";

import RunPanel from "../shared/results/base/RunPanel";
import { ResultsPanel } from "src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/results/base/ResultsSample/ResultsPanel";
import { VersionSelector } from "../shared/results/VersionSelector";
import { VersionComparator } from "../comparison/VersionComparator";

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from "../../../types";

interface RegistryEntry {
  key: string;
  meta: AlgorithmMetadata;
}

type BaseAlgorithmTestingProps = {
  variableLabel: string;
  defaultClassifier?: string;
  target?: VariableTarget;
};

const DEFAULT_CLASSIFIER = undefined as unknown as string;

export const BaseAlgorithmTesting: React.FC<BaseAlgorithmTestingProps> = ({
  variableLabel,
  defaultClassifier = DEFAULT_CLASSIFIER,
  target = "X",
}) => {
  // --- ÉTATS LOCAUX EXISTANTS ---
  const [sampleSizeInitialized, setSampleSizeInitialized] = React.useState(false);
  const [selectedModelId, setSelectedModelId] = React.useState<string>("");
  const [testResults, setTestResults] = React.useState<TVValidationResultCore[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sampleSize, setSampleSize] = React.useState<number>(100);

  // --- 🆕 ÉTATS VERSIONING ---
  const [selectedVersionId, setSelectedVersionId] = React.useState<AlgorithmVersionId>();
  const [showVersionDialog, setShowVersionDialog] = React.useState(false);
  const [showComparator, setShowComparator] = React.useState(false);
  const [capturedVersionId, setCapturedVersionId] = React.useState<AlgorithmVersionId>();
  const [versionName, setVersionName] = React.useState("");
  const [versionDescription, setVersionDescription] = React.useState("");
  const [changelog, setChangelog] = React.useState("");

  // --- HOOKS EXISTANTS ---
  const level1Testing = useLevel1Testing();

  // --- 🆕 HOOKS VERSIONING ---
  const { 
    setActiveVersion, 
    loadVersion, 
    updateVersionMetadata // ✅ FIX 1 : Import de la fonction manquante
  } = useAlgorithmVersioning();
  
  const { captureVersionAfterTest } = usePostValidationVersioning();

  // --- LOGIQUE EXISTANTE (inchangée) ---
  const entriesForTarget = React.useMemo(() => {
    const all = (algorithmRegistry.list?.() ?? []) as RegistryEntry[];
    return all.filter((e) => e.meta?.target === target);
  }, [target]);

  React.useEffect(() => {
    if (entriesForTarget.length === 0) return;
    const existsForTarget = entriesForTarget.some((e) => e.key === selectedModelId);
    if (!existsForTarget) {
      setSelectedModelId(entriesForTarget[0].key);
    }
  }, [entriesForTarget, selectedModelId]);

  const selectedEntry = React.useMemo(
    () => entriesForTarget.find((e) => e.key === selectedModelId),
    [entriesForTarget, selectedModelId]
  );

  const meta = selectedEntry?.meta ?? ({} as AlgorithmMetadata);
  const selectedDisplayName = meta.displayName ?? meta.label ?? selectedModelId;
  const typeLabel = meta.type ?? "rule-based";
  const chipColor = typeLabel === "rule-based" ? "primary" : "secondary";
  const versionLabel = meta.version;
  const supportsBatch = true;
  const domainLabel = meta.description ?? "Général";
  const isConfigValid = true;

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  React.useEffect(() => {
    if (sampleSizeInitialized) return;
    const total = goldStandardData?.length || 0;
    if (total > 0) {
      setSampleSize(Math.min(1000, total));
      setSampleSizeInitialized(true);
    }
  }, [goldStandardData, sampleSizeInitialized]);

  const totalForCurrent = React.useMemo(() => {
    if (!getRelevantCountFor || !selectedModelId) return 0;
    return getRelevantCountFor(selectedModelId);
  }, [getRelevantCountFor, selectedModelId]);

  const goldCount = React.useMemo(() => {
    const pairsCount = (level1Testing as any)?.goldStandardPairsCount;
    const dataCount = Array.isArray(level1Testing.goldStandardData)
      ? level1Testing.goldStandardData.length
      : 0;
    return typeof pairsCount === "number" ? pairsCount : dataCount;
  }, [level1Testing]);

  // --- 🆕 VALIDATION AVEC CAPTURE AUTO DE VERSION ---
  const runValidation = React.useCallback(async () => {
    if (!validateAlgorithm || !selectedModelId) return;

    setError(null);
    setTestResults([]);
    setIsRunning(true);
    setCapturedVersionId(undefined);

    try {
      // Validation existante
      const results = await validateAlgorithm(selectedModelId, sampleSize);
      setTestResults(results as TVValidationResultCore[]);

      // 🆕 Capture automatique de la version après test réussi
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );

      setCapturedVersionId(newVersionId);
      console.log(`✅ Version capturée automatiquement: ${newVersionId}`);

      // Proposer de nommer/documenter la version
      setShowVersionDialog(true);

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
    target,
    captureVersionAfterTest,
  ]);

  // --- 🆕 ENRICHISSEMENT VERSION CAPTURÉE ---
  const handleEnrichVersion = async () => {
    if (!capturedVersionId) return;

    try {
      await updateVersionMetadata(capturedVersionId, {
        version_name: versionName || `${selectedDisplayName} v${versionLabel}`,
        description: versionDescription,
        changelog: changelog,
      });

      console.log(`✅ Version enrichie: ${capturedVersionId}`);
      setShowVersionDialog(false);
      
      // Reset formulaire
      setVersionName("");
      setVersionDescription("");
      setChangelog("");
    } catch (err) {
      console.error("❌ Erreur enrichissement version:", err);
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // --- 🆕 CHARGEMENT D'UNE VERSION EXISTANTE ---
  // ✅ FIX 2 : Accès type-safe aux propriétés de version
  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      
      // 🔧 Accès type-safe selon targetKind
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      
      let varConfig: { 
        key: string; 
        version: string; 
        config: Record<string, any> 
      } | undefined;
      
      // Switch exhaustif pour accès sûr
      switch (targetKey) {
        case 'm1':
          varConfig = version.m1_key ? {
            key: version.m1_key,
            version: version.m1_version ?? '1.0.0',
            config: version.m1_config ?? {}
          } : undefined;
          break;
        case 'm2':
          varConfig = version.m2_key ? {
            key: version.m2_key,
            version: version.m2_version ?? '1.0.0',
            config: version.m2_config ?? {}
          } : undefined;
          break;
        case 'm3':
          varConfig = version.m3_key ? {
            key: version.m3_key,
            version: version.m3_version ?? '1.0.0',
            config: version.m3_config ?? {}
          } : undefined;
          break;
        default:
          // Pour X et Y, adapter selon votre schéma BDD
          console.warn(`Target ${target} : chargement version non implémenté`);
          varConfig = undefined;
      }
      
      if (varConfig) {
        setSelectedModelId(varConfig.key);
        console.log(`📊 Métriques version ${versionId}:`, version.level1_metrics);
      } else {
        console.warn(`Aucune config trouvée pour ${target} dans version ${versionId}`);
      }
      
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("❌ Erreur chargement version:", err);
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // --- 🆕 ACTIVATION D'UNE VERSION ---
  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    
    try {
      await setActiveVersion(capturedVersionId);
      console.log(`✅ Version activée: ${capturedVersionId}`);
      
      // Feedback visuel
      alert(`Version ${capturedVersionId} définie comme active !`);
    } catch (err) {
      console.error("❌ Erreur activation version:", err);
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

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

      {/* 🆕 SECTION VERSIONING */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setShowComparator(!showComparator)}
          size="small"
        >
          Comparer Versions
        </Button>
        
        {capturedVersionId && (
          <Chip
            label={`Version capturée: ${capturedVersionId.split('-').pop()}`}
            color="success"
            size="small"
            onDelete={handleActivateVersion}
            deleteIcon={<SaveIcon />}
          />
        )}
      </Stack>

      {/* 🆕 COMPARATEUR DE VERSIONS (repliable) */}
      {showComparator && (
        <Box sx={{ mb: 3 }}>
          <VersionComparator targetKind={target as TargetKind} />
          <Divider sx={{ my: 2 }} />
        </Box>
      )}

      {/* SECTION ALGORITHME (existante) */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">
              Algorithme : <strong>{selectedDisplayName}</strong>
            </Typography>
            <Chip label={typeLabel} color={chipColor as any} size="small" />
            {versionLabel && (
              <Chip label={`v${versionLabel}`} variant="outlined" size="small" />
            )}
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={2}>
            {/* 🆕 Sélecteur de version existante */}
            <VersionSelector
              targetKind={target as TargetKind}
              selectedVersionId={selectedVersionId}
              onVersionSelect={handleLoadVersion}
            />

            {/* Sélecteur d'algorithme existant */}
            <AlgorithmSelector
              variant="detailed"
              algorithms={entriesForTarget.map((e) => ({
                id: e.key,
                name: e.meta?.displayName ?? e.meta?.label ?? e.key,
                description: e.meta?.description ?? "",
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
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* RUN PANEL (existant) */}
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

      {/* PROGRESS (existant) */}
      {isRunning && (
        <Box sx={{ mt: -2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
            Traitement en cours… {testResults.length} échantillons analysés
          </Typography>
        </Box>
      )}

      {/* RESULTS PANEL (existant) */}
      <ResultsPanel
        results={testResults}
        initialPageSize={10}
        targetKind={target as TargetKind}
        classifierLabel={selectedDisplayName}
      />

      {/* 🆕 DIALOG ENRICHISSEMENT VERSION */}
      <Dialog 
        open={showVersionDialog} 
        onClose={() => setShowVersionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📝 Documenter la Version
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Version capturée: <strong>{capturedVersionId}</strong>
            </Alert>

            <TextField
              label="Nom de la version"
              placeholder={`${selectedDisplayName} v${versionLabel}`}
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              fullWidth
            />

            <TextField
              label="Description"
              placeholder="Ex: Optimisation température + ajout fallback regex"
              value={versionDescription}
              onChange={(e) => setVersionDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Changelog"
              placeholder="Ex: - Température baissée 0.7 → 0.3&#10;- Ajout gestion erreurs LLM"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowVersionDialog(false)}>
            Plus tard
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEnrichVersion}
            startIcon={<SaveIcon />}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
