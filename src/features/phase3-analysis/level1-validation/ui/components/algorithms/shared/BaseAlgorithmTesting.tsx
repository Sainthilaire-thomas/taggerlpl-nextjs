// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import HistoryIcon from "@mui/icons-material/History";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TableChartIcon from "@mui/icons-material/TableChart";
import ErrorIcon from "@mui/icons-material/Error";
import ListAltIcon from "@mui/icons-material/ListAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";

import AlgorithmSelector from '@/features/phase3-analysis/level1-validation/ui/components/shared/AlgorithmSelector';
import { algorithmRegistry } from '@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry';
import { useLevel1Testing } from "../../../hooks/useLevel1Testing";
import { useAlgorithmVersioning } from "../../../hooks/useAlgorithmVersioning";
import { usePostValidationVersioning } from "../../../hooks/usePostValidationVersioning";

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';

// 🆕 Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// ============================================================================
// TYPES
// ============================================================================

interface RegistryEntry {
  key: string;
  meta: AlgorithmMetadata;
}

interface ClassificationMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
  avgProcessingTime: number;
  avgConfidence: number;
  kappa?: number;
}

type BaseAlgorithmTestingProps = {
  variableLabel: string;
  defaultClassifier?: string;
  target?: VariableTarget;
};

const DEFAULT_CLASSIFIER = undefined as unknown as string;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Modéré', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Très faible', color: 'error.main' };
  };

  const kappaInfo = metrics.kappa !== undefined ? getKappaInterpretation(metrics.kappa) : null;

  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">Accuracy</Typography>
        <Typography variant="h4" color={metrics.accuracy >= 70 ? 'success.main' : 'warning.main'}>
          {metrics.accuracy.toFixed(1)}%
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">Kappa (Cohen)</Typography>
        <Typography variant="h4" color={kappaInfo?.color || 'text.primary'}>
          {metrics.kappa?.toFixed(3) ?? 'N/A'}
        </Typography>
        {kappaInfo && (
          <Typography variant="caption" color={kappaInfo.color}>
            {kappaInfo.label}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">Temps Moyen</Typography>
        <Typography variant="h4">
          {metrics.avgProcessingTime}ms
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">Confiance Moy.</Typography>
        <Typography variant="h4">
          {(metrics.avgConfidence * 100).toFixed(0)}%
        </Typography>
      </Paper>
    </Box>
  );
};

/** Panneau des métriques par tag */
const TagMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const tags = Object.keys(metrics.precision);

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Tag</strong></TableCell>
            <TableCell align="right"><strong>Précision</strong></TableCell>
            <TableCell align="right"><strong>Rappel</strong></TableCell>
            <TableCell align="right"><strong>F1-Score</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tags.map((tag) => {
            const f1 = metrics.f1Score[tag] || 0;
            const f1Color = f1 >= 0.7 ? 'success.main' : f1 >= 0.5 ? 'warning.main' : 'error.main';
            
            return (
              <TableRow key={tag}>
                <TableCell>
                  <Chip label={tag} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  {((metrics.precision[tag] || 0) * 100).toFixed(1)}%
                </TableCell>
                <TableCell align="right">
                  {((metrics.recall[tag] || 0) * 100).toFixed(1)}%
                </TableCell>
                <TableCell align="right" sx={{ color: f1Color, fontWeight: 'bold' }}>
                  {((f1) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/** Panneau de la matrice de confusion */
const ConfusionMatrixPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics || !metrics.confusionMatrix) return null;

  const labels = Object.keys(metrics.confusionMatrix);

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Réel \ Prédit</strong></TableCell>
            {labels.map((label) => (
              <TableCell key={label} align="center">
                <Chip label={label} size="small" />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {labels.map((actual) => (
            <TableRow key={actual}>
              <TableCell>
                <Chip label={actual} size="small" variant="outlined" />
              </TableCell>
              {labels.map((predicted) => {
                const count = metrics.confusionMatrix[actual]?.[predicted] || 0;
                const isDiagonal = actual === predicted;
                
                return (
                  <TableCell
                    key={predicted}
                    align="center"
                    sx={{
                      bgcolor: isDiagonal ? 'success.light' : count > 0 ? 'error.light' : 'transparent',
                      fontWeight: isDiagonal ? 'bold' : 'normal',
                    }}
                  >
                    {count}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/** Panneau d'analyse des erreurs */
const ErrorAnalysisPanel: React.FC<{
  errorAnalysis: {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    commonErrors: Array<{
      expected: string;
      predicted: string;
      frequency: number;
      examples: string[];
    }>;
    improvementSuggestions: string[];
  } | null;
}> = ({ errorAnalysis }) => {
  if (!errorAnalysis) return null;

  return (
    <Stack spacing={2}>
      <Alert severity={errorAnalysis.totalErrors > 0 ? 'warning' : 'success'}>
        <strong>{errorAnalysis.totalErrors}</strong> erreurs détectées
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fréquentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fréquence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errorAnalysis.commonErrors.slice(0, 5).map((err, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{err.expected}</TableCell>
                    <TableCell>{err.predicted}</TableCell>
                    <TableCell align="right">{err.frequency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {errorAnalysis.improvementSuggestions.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            💡 Suggestions d'amélioration
          </Typography>
          {errorAnalysis.improvementSuggestions.map((suggestion, idx) => (
            <Typography key={idx} variant="body2" sx={{ ml: 1 }}>
              • {suggestion}
            </Typography>
          ))}
        </Box>
      )}
    </Stack>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BaseAlgorithmTesting: React.FC<BaseAlgorithmTestingProps> = ({
  variableLabel,
  defaultClassifier = DEFAULT_CLASSIFIER,
  target = "X",
}) => {
  // --- ÉTATS LOCAUX ---
  const [sampleSizeInitialized, setSampleSizeInitialized] = React.useState(false);
  const [selectedModelId, setSelectedModelId] = React.useState<string>("");
  const [testResults, setTestResults] = React.useState<TVValidationResultCore[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sampleSize, setSampleSize] = React.useState<number>(100);

  // --- ÉTATS MÉTRIQUES ---
  const [metrics, setMetrics] = React.useState<ClassificationMetrics | null>(null);
  const [errorAnalysis, setErrorAnalysis] = React.useState<any>(null);

  // --- ÉTATS VERSIONING ---
  const [selectedVersionId, setSelectedVersionId] = React.useState<AlgorithmVersionId>();
  const [showVersionDialog, setShowVersionDialog] = React.useState(false);
  const [showComparator, setShowComparator] = React.useState(false);
  const [capturedVersionId, setCapturedVersionId] = React.useState<AlgorithmVersionId>();
  const [versionName, setVersionName] = React.useState("");
  const [versionDescription, setVersionDescription] = React.useState("");
  const [changelog, setChangelog] = React.useState("");

  // --- ÉTAT H2 UPDATE PROGRESS ---
  const [h2UpdateProgress, setH2UpdateProgress] = React.useState<{
    current: number;
    total: number;
  } | null>(null);

  // --- ÉTATS ACCORDIONS ---
  const [expandedAccordions, setExpandedAccordions] = React.useState<Record<string, boolean>>({
    selection: true,
    execution: true,
    globalMetrics: false,
    tagMetrics: false,
    confusionMatrix: false,
    errorAnalysis: false,
    results: false,
    level2Preview: false,
  });

  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- HOOKS ---
  const level1Testing = useLevel1Testing();
  const { setActiveVersion, loadVersion, updateVersionMetadata } = useAlgorithmVersioning();
  const { captureVersionAfterTest } = usePostValidationVersioning();

  // --- LOGIQUE EXISTANTE ---
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

  const goldCount = React.useMemo(() => {
    return (level1Testing as any)?.analysisPairs?.length ?? 0;
  }, [level1Testing]);

  // --- VALIDATION ---
  const runValidation = React.useCallback(async () => {
    if (!validateAlgorithm || !selectedModelId) return;

    setError(null);
    setTestResults([]);
    setMetrics(null);
    setErrorAnalysis(null);
    setIsRunning(true);
    setCapturedVersionId(undefined);
    setH2UpdateProgress(null);

    try {
      const results = await validateAlgorithm(selectedModelId, sampleSize);
      setTestResults(results as TVValidationResultCore[]);

      // Calculer les métriques
      if (calculateMetrics) {
        const m = calculateMetrics(results);
        setMetrics(m);
      }

      // Analyser les erreurs
      if (analyzeErrors) {
        const e = analyzeErrors(results);
        setErrorAnalysis(e);
      }

      // UPDATE H2 avec progression
      console.log(`📝 Mise à jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`✅ Update H2 terminé:`, updateStats);
      setH2UpdateProgress(null);

      // Capture automatique de la version
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

      // Ouvrir les accordions pertinents
      setExpandedAccordions(prev => ({
        ...prev,
        globalMetrics: true,
        tagMetrics: true,
        level2Preview: true,
      }));

      setShowVersionDialog(true);

    } catch (e: any) {
      console.error("❌ Validation error:", e);
      setError(e?.message || "Erreur inconnue");
      setH2UpdateProgress(null);
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
    level1Testing,
    meta.version,
  ]);

  // --- HANDLERS VERSIONING ---
  const handleEnrichVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await updateVersionMetadata(capturedVersionId, {
        version_name: versionName || `${selectedDisplayName} v${versionLabel}`,
        description: versionDescription,
        changelog: changelog,
      });
      setShowVersionDialog(false);
      setVersionName("");
      setVersionDescription("");
      setChangelog("");
    } catch (err) {
      console.error("❌ Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("❌ Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} définie comme active !`);
    } catch (err) {
      console.error("❌ Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement…</Typography>
      </Box>
    );
  }

  // Préparer les métriques pour Level2Preview
  const metricsForPreview = metrics ? {
    accuracy: metrics.accuracy,
    kappa: metrics.kappa,
    f1Score: metrics.f1Score,
  } : undefined;

  const hasResults = testResults.length > 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Typography variant="h4" gutterBottom>
        {variableLabel} — Test individuel
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Lance un test contre le gold standard et inspecte les résultats.
      </Typography>

      {/* VERSIONING TOOLBAR */}
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

      {/* COMPARATEUR DE VERSIONS */}
      {showComparator && (
        <Box sx={{ mb: 3 }}>
          <VersionComparator targetKind={target as TargetKind} />
          <Divider sx={{ my: 2 }} />
        </Box>
      )}

      {/* ============================================================ */}
      {/* ACCORDIONS */}
      {/* ============================================================ */}

      {/* 1. SÉLECTION & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Sélection de l'Algorithme</Typography>
            <Chip label={selectedDisplayName} color={chipColor as any} size="small" />
            {versionLabel && <Chip label={`v${versionLabel}`} variant="outlined" size="small" />}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <VersionSelector
              targetKind={target as TargetKind}
              selectedVersionId={selectedVersionId}
              onVersionSelect={handleLoadVersion}
            />
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
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* 2. EXÉCUTION */}
      <Accordion
        expanded={expandedAccordions.execution}
        onChange={() => toggleAccordion('execution')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">▶️ Exécution</Typography>
            {isRunning && <Chip label="En cours..." color="warning" size="small" />}
            {hasResults && !isRunning && (
              <Chip
                label={`${testResults.length} résultats`}
                color="success"
                size="small"
                icon={<CheckCircleIcon />}
              />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
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
          {h2UpdateProgress && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                📝 Mise à jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(h2UpdateProgress.current / h2UpdateProgress.total) * 100}
              />
            </Box>
          )}
          {isRunning && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: "center" }}>
                Traitement... {testResults.length} échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. MÉTRIQUES GLOBALES */}
      <Accordion
        expanded={expandedAccordions.globalMetrics}
        onChange={() => toggleAccordion('globalMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques Globales</Typography>
            {metrics && (
              <Chip
                label={`Accuracy: ${metrics.accuracy.toFixed(1)}%`}
                color={metrics.accuracy >= 70 ? 'success' : 'warning'}
                size="small"
              />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <GlobalMetricsPanel metrics={metrics} />
        </AccordionDetails>
      </Accordion>

      {/* 4. MÉTRIQUES PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Métriques par Tag</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <TagMetricsPanel metrics={metrics} />
        </AccordionDetails>
      </Accordion>

      {/* 5. MATRICE DE CONFUSION */}
      <Accordion
        expanded={expandedAccordions.confusionMatrix}
        onChange={() => toggleAccordion('confusionMatrix')}
        sx={{ mb: 1 }}
        disabled={!hasResults || !['X', 'Y'].includes(target)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔀 Matrice de Confusion</Typography>
            {!['X', 'Y'].includes(target) && (
              <Chip label="X/Y uniquement" size="small" variant="outlined" />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <ConfusionMatrixPanel metrics={metrics} />
        </AccordionDetails>
      </Accordion>

      {/* 6. ANALYSE DES ERREURS */}
      <Accordion
        expanded={expandedAccordions.errorAnalysis}
        onChange={() => toggleAccordion('errorAnalysis')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">❌ Analyse des Erreurs</Typography>
            {errorAnalysis && (
              <Chip
                label={`${errorAnalysis.totalErrors} erreurs`}
                color={errorAnalysis.totalErrors > 0 ? 'error' : 'success'}
                size="small"
              />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <ErrorAnalysisPanel errorAnalysis={errorAnalysis} />
        </AccordionDetails>
      </Accordion>

      {/* 7. ÉCHANTILLON DE RÉSULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📝 Échantillon de Résultats</Typography>
            {hasResults && (
              <Chip label={`${testResults.length} résultats`} size="small" variant="outlined" />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <ResultsPanel
            results={testResults}
            initialPageSize={10}
            targetKind={target as TargetKind}
            classifierLabel={selectedDisplayName}
          />
        </AccordionDetails>
      </Accordion>

      {/* 8. LEVEL 2 PREVIEW 🆕 */}
      <Accordion
        expanded={expandedAccordions.level2Preview}
        onChange={() => toggleAccordion('level2Preview')}
        sx={{
          mb: 1,
          border: '2px solid',
          borderColor: hasResults ? 'primary.main' : 'divider',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🚀 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Exécuter d'abord" size="small" variant="outlined" />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Level2PreviewPanel
            xMetrics={target === 'X' ? metricsForPreview : undefined}
            yMetrics={target === 'Y' ? metricsForPreview : undefined}
            autoCalculate={hasResults}
            defaultExpanded={true}
            onNavigateToLevel2={() => {
              window.location.href = '/phase3-analysis/level2/hypotheses';
            }}
          />
        </AccordionDetails>
      </Accordion>

      {/* DIALOG VERSIONING */}
      <Dialog open={showVersionDialog} onClose={() => setShowVersionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📝 Documenter la Version</DialogTitle>
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
              value={versionDescription}
              onChange={(e) => setVersionDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Changelog"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionDialog(false)}>Plus tard</Button>
          <Button variant="contained" onClick={handleEnrichVersion} startIcon={<SaveIcon />}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaseAlgorithmTesting;
