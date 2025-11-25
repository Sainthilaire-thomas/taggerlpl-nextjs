# SESSION DE REPRISE - Phase 4 Versioning & Investigation
**Date session précédente** : 25 novembre 2025
**Durée** : ~3h
**Statut** : Phase 4 à 80% - Debugging requis

---

## 🎯 OBJECTIF SESSION

Finaliser l'intégration du système de versioning et investigation dans BaseAlgorithmTesting.tsx (Phase 4) et résoudre les erreurs runtime de création de test_runs.

---

## ✅ CE QUI FONCTIONNE (ÉTAT ACTUEL)

### Infrastructure Backend (Phases 1-2-3 complètes)
- ✅ Tables BDD créées (test_runs, investigation_annotations, algorithm_version_registry enrichi)
- ✅ Hooks React implémentés (useTestRuns, useInvestigation, useVersionValidation)
- ✅ Composants UI créés (TestDecisionPanel, InvestigationBanner, dialogs)
- ✅ Git API endpoint (/api/git/current-commit)

### Données & Tests
- ✅ 901 paires analysis_pairs en base Supabase
- ✅ 10 algorithmes initialisés et fonctionnels
- ✅ Tests Level 1 s'exécutent correctement (901 résultats)
- ✅ Bulk update optimisé (1519 paires/seconde)
- ✅ 0 erreur TypeScript

### Code BaseAlgorithmTesting.tsx
- ✅ Imports ajoutés (hooks, composants, types)
- ✅ États React initialisés (currentRunId, showDecisionPanel, etc.)
- ✅ Adaptateur toValidationMetrics créé
- ✅ Accordéon "Décision post-test" ajouté
- ✅ InvestigationBanner ajouté
- ✅ Dialogs ajoutés (InvestigationSummary, VersionValidation)

---

## ❌ PROBLÈMES À RÉSOUDRE

### Problème 1 : Erreur 400 - Création test_runs
**Erreur console** :
\\\
Failed to load resource: 400
/rest/v1/test_runs?select=run_id
Error creating test run: {}
Test run créé: null
\\\

**Localisation** : \useTestRuns.ts\ ligne ~createTestRun
**Impact** : Workflow versioning non fonctionnel (reject/investigate/validate)

**Causes probables** :
1. Payload invalide (champ manquant, type incorrect)
2. Contrainte BDD violée (NOT NULL, FOREIGN KEY)
3. RLS policy trop restrictive

### Problème 2 : Erreur 406 - algorithm_version_registry
**Erreur console** :
\\\
Failed to load resource: 406
/rest/v1/algorithm_version_registry?is_baseline=eq.true&x_key=not.is.null
\\\

**Localisation** : \useTestRuns.ts\ ligne ~getBaselineForTarget
**Impact** : Comparaison baseline impossible

**Causes probables** :
1. Colonne \x_key\ n'existe pas ou mauvais nom
2. RLS policy bloque la lecture
3. Format Accept header incorrect

### Problème 3 : Emojis corrompus (mineur)
**Symptôme** : \??\ au lieu de 🎯, \?\ au lieu de ✅
**Impact** : Esthétique uniquement
**Solution** : Script de correction disponible (voir ci-dessous)

---

## 🔍 INVESTIGATION REQUISE

### A. Vérifier structure test_runs
\\\sql
-- Dans Supabase SQL Editor
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'test_runs'
ORDER BY ordinal_position;

-- Vérifier contraintes
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'test_runs'::regclass;
\\\

**Colonnes attendues** :
- run_id (uuid, PK)
- algorithm_key (text, NOT NULL)
- algorithm_version (text, NOT NULL)
- target (text, NOT NULL)
- sample_size (integer)
- metrics (jsonb)
- error_pairs (integer[])
- outcome (text, default 'pending')
- baseline_version_id (uuid, nullable)
- baseline_diff (jsonb, nullable)
- created_at (timestamptz)

### B. Vérifier RLS policies
\\\sql
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('test_runs', 'algorithm_version_registry', 'investigation_annotations');
\\\

**Action** : Si policies bloquent, désactiver temporairement :
\\\sql
ALTER TABLE test_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_version_registry DISABLE ROW LEVEL SECURITY;
\\\

### C. Déboguer createTestRun avec logs détaillés
\\\	ypescript
// Modifier useTestRuns.ts - fonction createTestRun
console.log('🔍 DEBUG createTestRun - Payload:', JSON.stringify(testRunData, null, 2));

const { data, error } = await supabase
  .from('test_runs')
  .insert(testRunData)
  .select('run_id')
  .single();

console.log('🔍 DEBUG createTestRun - Response:', { data, error });
if (error) {
  console.error('🔍 DEBUG createTestRun - Error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
}
\\\

### D. Vérifier colonne x_key dans algorithm_version_registry
\\\sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'algorithm_version_registry' 
  AND column_name LIKE '%key%';
\\\

**Si x_key n'existe pas**, vérifier le nom réel de la colonne pour l'algorithme X.

---

## 🛠️ SCRIPTS DE CORRECTION RAPIDES

### Script 1 : Corriger emojis
\\\powershell
\C:\Users\thoma\OneDrive\SONEAR_2025\taggerlpl-nextjs\src\features\phase3-analysis\level1-validation\ui\components\algorithms\shared\BaseAlgorithmTesting.tsx = "src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx"
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = Get-Content \C:\Users\thoma\OneDrive\SONEAR_2025\taggerlpl-nextjs\src\features\phase3-analysis\level1-validation\ui\components\algorithms\shared\BaseAlgorithmTesting.tsx -Raw -Encoding UTF8

\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\?\? Mise • jour', '🔄 Mise à jour'
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\? Update', '✅ Update'
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\? Test run', '✅ Test run'
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\?\? Sélection', '🔧 Sélection'
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\?\? Exécution', '▶️ Exécution'
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\?\? Métriques', '📊 Métriques'
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\?\? Décision', '🎯 Décision'
\// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 = \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
 -replace '\? Analyse', '❌ Analyse'

\System.Text.UTF8Encoding = New-Object System.Text.UTF8Encoding \False
[System.IO.File]::WriteAllText((Resolve-Path \C:\Users\thoma\OneDrive\SONEAR_2025\taggerlpl-nextjs\src\features\phase3-analysis\level1-validation\ui\components\algorithms\shared\BaseAlgorithmTesting.tsx), \// src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx
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
// ========== NOUVEAUX IMPORTS - VERSIONING & INVESTIGATION ==========
import { useTestRuns } from '../../../hooks/useTestRuns';
import { useInvestigation } from '../../../hooks/useInvestigation';
import { useVersionValidation } from '../../../hooks/useVersionValidation';

import RunPanel from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/RunPanel';
import { ResultsPanel } from "@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel";
import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { VersionComparator } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionComparator';
// Composants Versioning
import { TestDecisionPanel } from '../../TestDecision';
import { InvestigationBanner } from '../../Investigation';
import { InvestigationSummaryDialog } from '../../Investigation';
import { VersionValidationDialog } from '../../VersionValidation';

// ?? Import Level2Preview
import { Level2PreviewPanel } from '../../../components/Level2Preview';

import type {
  VariableTarget,
  AlgorithmMetadata,
  TVValidationResultCore,
  TargetKind,
  AlgorithmVersionId,
} from '@/types/algorithm-lab';

// Types Versioning
import type { TestRun, TestOutcome } from '@/types/algorithm-lab/versioning';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';

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
// HELPERS - TYPE ADAPTERS
// ============================================================================

/** Convertit ClassificationMetrics ? ValidationMetrics pour TestDecisionPanel */
const toValidationMetrics = (
  metrics: ClassificationMetrics,
  results: TVValidationResultCore[]
): ValidationMetrics => {
  const tags = Object.keys(metrics.precision);
  const totalSupport = results.length;
  
  // Moyennes pond�r�es
  const precisionWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.precision[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const recallWeighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.recall[tag] || 0) * support;
  }, 0) / totalSupport;
  
  const f1Weighted = tags.reduce((sum, tag) => {
    const support = results.filter(r => r.goldStandard === tag).length;
    return sum + (metrics.f1Score[tag] || 0) * support;
  }, 0) / totalSupport;

  // classMetrics au format Record
  const classMetrics: Record<string, { precision: number; recall: number; f1Score: number; support: number }> = {};
  tags.forEach(tag => {
    classMetrics[tag] = {
      precision: metrics.precision[tag] || 0,
      recall: metrics.recall[tag] || 0,
      f1Score: metrics.f1Score[tag] || 0,
      support: results.filter(r => r.goldStandard === tag).length,
    };
  });

  return {
    accuracy: metrics.accuracy / 100,
    precision: precisionWeighted,
    recall: recallWeighted,
    f1Score: f1Weighted,
    kappa: metrics.kappa,
    classMetrics,
    confusionMatrix: metrics.confusionMatrix || {},
    totalSamples: results.length,
    correctPredictions: results.filter(r => r.correct).length,
    executionTime: metrics.avgProcessingTime,
  };
};


// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Panneau des Métriques globales */
const GlobalMetricsPanel: React.FC<{ metrics: ClassificationMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  const getKappaInterpretation = (kappa: number): { label: string; color: string } => {
    if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main' };
    if (kappa >= 0.6) return { label: 'Bon', color: 'success.light' };
    if (kappa >= 0.4) return { label: 'Mod�r�', color: 'warning.main' };
    if (kappa >= 0.2) return { label: 'Faible', color: 'error.light' };
    return { label: 'Tr�s faible', color: 'error.main' };
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

/** Panneau des Métriques par tag */
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
        <strong>{errorAnalysis.totalErrors}</strong> erreurs d�tect�es
      </Alert>

      {errorAnalysis.commonErrors.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Confusions fr�quentes
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Attendu</TableCell>
                  <TableCell>Prédit</TableCell>
                  <TableCell align="right">Fr�quence</TableCell>
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
            ?? Suggestions d'am�lioration
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

  // --- ÉTATS Métriques ---
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

  // --- �TAT H2 UPDATE PROGRESS ---
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
    decision: false,
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
  const domainLabel = meta.description ?? "G�n�ral";
  const isConfigValid = true;
   // ========== NOUVEAUX ÉTATS - TEST RUNS & INVESTIGATION ==========
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentTestRun, setCurrentTestRun] = React.useState<TestRun | null>(null);
  const [showDecisionPanel, setShowDecisionPanel] = React.useState(false);
  const [showInvestigationSummary, setShowInvestigationSummary] = React.useState(false);
  const [showVersionValidationDialog, setShowVersionValidationDialog] = React.useState(false);

  const goldStandardData = level1Testing.goldStandardData;
  const validateAlgorithm = level1Testing.validateAlgorithm;
  const calculateMetrics = level1Testing.calculateMetrics;
  const analyzeErrors = level1Testing.analyzeErrors;
  const getRelevantCountFor = level1Testing.getRelevantCountFor;

  // ========== NOUVEAUX HOOKS - VERSIONING & INVESTIGATION ==========
  const { 
    createTestRun, 
    updateOutcome, 
    getBaselineForTarget,
  
  } = useTestRuns();

  const { 
    state: investigationState,
    startInvestigation,
    completeInvestigation,
    getAnnotationsForRun,
    generateSummary
  } = useInvestigation();

  const { 
    promoteToVersion: promoteRunToVersion,
    getCurrentGitCommit 
  } = useVersionValidation();

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

      // Calculer les Métriques
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
      console.log(`?? Mise • jour H2 pour ${results.length} résultats...`);
      const updateStats = await level1Testing.updateH2WithResultsBatch(
        results,
        selectedModelId,
        `v${meta.version ?? '1.0.0'}`,
        (current, total) => {
          setH2UpdateProgress({ current, total });
        }
      );
      console.log(`? Update H2 termin�:`, updateStats);
      setH2UpdateProgress(null);

// ========== CR�ATION TEST RUN ==========
    // ========== CR�ATION TEST RUN ==========
      try {
        // R�cup�rer la baseline pour comparaison
        const baseline = await getBaselineForTarget(target);
        
        // Calculer baseline diff si baseline existe et metrics disponibles
        let baselineDiff = null;
        if (baseline && metrics) {
          baselineDiff = {
            accuracy_delta: metrics.accuracy - (baseline.level1_metrics?.accuracy || 0),
            kappa_delta: (metrics.kappa || 0) - (baseline.level1_metrics?.kappa || 0),
            f1_deltas: {},
            errors_delta: 0,
            corrections: 0,
            regressions: 0,
          };
        }

        // Extraire les pair_id en erreur avec typage s�curis�
        const errorPairs = results
          .filter(r => !r.correct)
          .map(r => {
            const metadata = r.metadata as any;
            return metadata?.pairId;
          })
          .filter(Boolean) as number[];

        // Cr�er l'entr�e test_runs
        const runId = await createTestRun({
          algorithm_key: selectedModelId,
          algorithm_version: `v${meta.version ?? '1.0.0'}`,
          target: target,
          sample_size: sampleSize,
          metrics: metrics,
          error_pairs: errorPairs,
          outcome: 'pending',
          // baseline_version_id et baseline_diff sont optionnels
          ...(baseline && { baseline_version_id: baseline.version_id }),
          ...(baselineDiff && { baseline_diff: baselineDiff }),
        });

        console.log(`? Test run cr��: ${runId}`);
        setCurrentRunId(runId);
        setShowDecisionPanel(true);

      } catch (err) {
        console.error("? Erreur cr�ation test run:", err);
      }

      // Capture automatique de la version (existant)
      const newVersionId = await captureVersionAfterTest(
        results as TVValidationResultCore[],
        selectedModelId,
        target as TargetKind
      );
      setCapturedVersionId(newVersionId);

    } catch (e: any) {
      console.error("? Validation error:", e);
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
      console.error("? Erreur enrichissement version:", err);
    }
  };

  const handleLoadVersion = async (versionId: AlgorithmVersionId) => {
    try {
      const version = await loadVersion(versionId);
      const targetKey = target.toLowerCase() as 'm1' | 'm2' | 'm3';
      // ... logique de chargement existante
      setSelectedVersionId(versionId);
    } catch (err) {
      console.error("? Erreur chargement version:", err);
    }
  };

  const handleActivateVersion = async () => {
    if (!capturedVersionId) return;
    try {
      await setActiveVersion(capturedVersionId);
      alert(`Version ${capturedVersionId} d�finie comme active !`);
    } catch (err) {
      console.error("? Erreur activation version:", err);
    }
  };

  // --- GUARD LOADING ---
  if (!level1Testing) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">Chargement�</Typography>
      </Box>
    );
  }

  // Préparer les Métriques pour Level2Preview
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
        {variableLabel} • Test individuel
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
            label={`Version captur�e: ${capturedVersionId.split('-').pop()}`}
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

      {/* 1. Sélection & CONFIGURATION */}
      <Accordion
        expanded={expandedAccordions.selection}
        onChange={() => toggleAccordion('selection')}
        sx={{ mb: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🔧 Sélection de l'Algorithme</Typography>
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

      {/* 2. Exécution */}
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
                ?? Mise • jour analysis_pairs: {h2UpdateProgress.current} / {h2UpdateProgress.total}
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
                Traitement... {testResults.length} Échantillons analysés
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* 3. Métriques GLOBALES */}
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

      {/* 4. Métriques PAR TAG */}
      <Accordion
        expanded={expandedAccordions.tagMetrics}
        onChange={() => toggleAccordion('tagMetrics')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📊 Métriques par Tag</Typography>
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
            <Typography variant="h6">📊 Matrice de Confusion</Typography>
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

      {/* 7. Échantillon DE RESULTATS */}
      <Accordion
        expanded={expandedAccordions.results}
        onChange={() => toggleAccordion('results')}
        sx={{ mb: 1 }}
        disabled={!hasResults}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">📋 Échantillon de Résultats</Typography>
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

      {/* 8. Décision POST-TEST ?? */}
      <Accordion
        expanded={expandedAccordions.decision}
        onChange={() => toggleAccordion('decision')}
        sx={{
          mb: 1,
          display: showDecisionPanel ? 'block' : 'none',
          border: '2px solid',
          borderColor: 'warning.main',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">🎯 Décision post-test</Typography>
            <Chip label="Action requise" color="warning" size="small" />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {currentRunId && metrics && (
            <TestDecisionPanel
              runId={currentRunId}
              metrics={toValidationMetrics(metrics, testResults)}
              baselineDiff={null}
              onDecision={async (decision) => {
  if (decision === 'discarded') {
    await updateOutcome(currentRunId, 'discarded');
    setShowDecisionPanel(false);
    setCurrentRunId(null);
  } else if (decision === 'investigating') {
    await updateOutcome(currentRunId, 'investigating');
    await startInvestigation(currentRunId);
    setShowDecisionPanel(false);
  } else if (decision === 'promoted') {
    setShowVersionValidationDialog(true);
  }
}}
            />
          )}
        </AccordionDetails>
      </Accordion>


      {/* 8. LEVEL 2 PREVIEW ?? */}
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
            <Typography variant="h6">🎯 Prévisualisation Level 2</Typography>
            {!hasResults && (
              <Chip label="Ex�cuter d'abord" size="small" variant="outlined" />
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
              Version captur�e: <strong>{capturedVersionId}</strong>
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
, \System.Text.UTF8Encoding)
Write-Host "✅ Emojis corrigés!"
\\\

### Script 2 : Test direct Supabase
\\\javascript
// Dans console navigateur (après authentification)
// Récupérer le client Supabase depuis le contexte React
const testPayload = {
  algorithm_key: 'test-algo',
  algorithm_version: 'v1.0.0',
  target: 'X',
  sample_size: 10,
  metrics: { accuracy: 0.85 },
  error_pairs: [1, 2, 3],
  outcome: 'pending'
};

// Test insertion
const { data, error } = await supabase
  .from('test_runs')
  .insert(testPayload)
  .select('run_id')
  .single();

console.log('Test result:', { data, error });
\\\

---

## 📁 FICHIERS CLÉS

### Fichiers modifiés session précédente
1. \src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx\
   - Commit: f0c531a
   - +241 lignes / -65 lignes
   - État: Encodage UTF-8 partiellement corrompu (emojis)

### Fichiers à vérifier/déboguer
1. \src/features/phase3-analysis/level1-validation/ui/hooks/useTestRuns.ts\
   - Fonction: createTestRun (ligne ~50-100)
   - Fonction: getBaselineForTarget (ligne ~150-200)

2. \src/features/phase3-analysis/level1-validation/ui/hooks/useAnalysisPairs.ts\
   - Restauré depuis commit 29c583c (working version)
   - État: Fonctionnel (901 paires chargées)

### Documentation
- \docs/ai_context/mission-2025-11-24-versioning-investigation-avancement.md\
- \/mnt/transcripts/2025-11-25-15-46-50-phase4-versioning-integration-basealgorithmtesting.txt\

---

## 🎯 PLAN DE REPRISE (ORDRE RECOMMANDÉ)

### Étape 1 : Diagnostic BDD (15 min)
1. Ouvrir Supabase Dashboard
2. Table Editor → test_runs → vérifier colonnes
3. Table Editor → algorithm_version_registry → vérifier colonnes
4. Authentication → Policies → vérifier RLS
5. SQL Editor → exécuter scripts de vérification (voir section Investigation)

### Étape 2 : Corriger erreur 400 (30 min)
1. Ajouter logs détaillés dans useTestRuns.createTestRun
2. Identifier le champ problématique
3. Corriger le payload ou la structure BDD
4. Tester création test_run
5. Vérifier que run_id est retourné

### Étape 3 : Corriger erreur 406 (15 min)
1. Vérifier nom colonne dans algorithm_version_registry
2. Corriger requête dans getBaselineForTarget
3. Tester récupération baseline

### Étape 4 : Tests workflow complet (20 min)
1. Lancer test algorithme (901 paires)
2. Vérifier accordéon "Décision post-test" s'affiche
3. Tester "Rejeter" → outcome='discarded'
4. Tester "Investiguer" → InvestigationBanner apparaît
5. Tester "Valider" → VersionValidationDialog s'ouvre

### Étape 5 : Polish final (10 min)
1. Corriger emojis (script fourni)
2. Commit final Phase 4
3. Mettre à jour documentation

---

## 🔑 COMMANDES ESSENTIELLES

### Compilation TypeScript
\\\powershell
npx tsc --noEmit
\\\

### Redémarrer serveur dev
\\\powershell
# Ctrl+C dans le terminal npm
Remove-Item -Path ".next" -Recurse -Force
npm run dev
\\\

### Git - voir historique
\\\powershell
git log --oneline | Select-Object -First 10
git show f0c531a --stat  # Commit Phase 4
\\\

### Vérifier fichier encodage
\\\powershell
Get-Content src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx -Encoding UTF8 | Select-String "Sélection|Exécution" | Select-Object -First 5
\\\

---

## 📊 MÉTRIQUES SESSION PRÉCÉDENTE

- Durée: ~3h
- Commits: 2 (Phase 2, Phase 4)
- Fichiers modifiés: 8
- Lignes ajoutées: ~1500
- Erreurs TypeScript résolues: 7
- Progression: 80% Phase 4 complète

---

## ⚠️ POINTS D'ATTENTION

1. **Authentification Supabase** : S'assurer d'être connecté (901 paires visibles = OK)
2. **Encodage UTF-8** : Toujours utiliser UTF-8 sans BOM pour modifications fichiers
3. **Cache Next.js** : Supprimer .next/ si comportement bizarre
4. **RLS Policies** : Première cause des erreurs 400/406

---

## 📝 NOTES POUR L'IA DE REPRISE

- Thomas préfère commandes PowerShell individuelles vs scripts automatiques
- Documentation session dans transcripts (/mnt/transcripts/)
- Approche méthodique : vérifier → corriger → tester → commit
- Pas de shortcuts - toujours suivre l'architecture documentée
- Utiliser view tool pour lire fichiers project knowledge si besoin

---

## 🎬 PREMIÈRE COMMANDE À EXÉCUTER

\\\powershell
# Vérifier état actuel du code
git status

# Voir les derniers commits
git log --oneline | Select-Object -First 5

# Vérifier compilation
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object
\\\

**Si 0 erreurs TypeScript** → Passer directement au diagnostic BDD (Étape 1)

---

FIN DU DOCUMENT DE REPRISE
