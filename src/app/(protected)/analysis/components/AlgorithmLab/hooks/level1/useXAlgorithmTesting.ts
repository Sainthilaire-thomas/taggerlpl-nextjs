// Hook spécialisé pour les tests d'algorithmes de la variable X
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  VariableX,
  ValidationMetrics,
  AlgorithmTestConfig,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type {
  XValidationResult,
  XGoldStandardItem,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

// ---- Interface locale XAlgorithm (ne pas l'importer de ThesisVariables) ----
export interface XAlgorithm {
  id: string;
  name: string;
  version: string;
  description?: string;
  parameters?: Record<string, unknown>;
  classify: (verbatim: string) => Promise<{
    classification: VariableX;
    confidence: number;
    evidence: string[];
  }>;
}

// =============================================================================
// TYPES LOCAUX
// =============================================================================
export interface AlgorithmTestState {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  results?: ValidationMetrics | null;
  errors: string[];
  estimatedTimeRemaining?: number;
  processedSamples: number;
}

interface ErrorAnalysisData {
  totalErrors: number;
  errorsByCategory: Record<VariableX, number>;
  confusionPatterns: Array<{
    predicted: VariableX;
    actual: VariableX;
    frequency: number;
    examples: string[];
  }>;
  recommendations: string[];
}

// =============================================================================
// INTERFACE DU HOOK
// =============================================================================
export interface UseXAlgorithmTestingReturn {
  testState: AlgorithmTestState;

  testResults: XValidationResult[];
  goldStandardData: XGoldStandardItem[];

  availableAlgorithms: XAlgorithm[];
  selectedAlgorithm: XAlgorithm | null;

  validationMetrics: ValidationMetrics | null;

  selectAlgorithm: (algorithmId: string) => void;
  runTesting: (config: AlgorithmTestConfig) => Promise<void>;
  clearResults: () => void;

  testConfig: AlgorithmTestConfig;
  updateTestConfig: (updates: Partial<AlgorithmTestConfig>) => void;

  getVerbatimValidation: (verbatim: string) => Promise<XValidationResult>;
  exportResults: () => void;

  loadGoldStandardData: () => Promise<void>;
  validateGoldStandard: (data: XGoldStandardItem[]) => boolean;

  calculateMetrics: (results: XValidationResult[]) => ValidationMetrics;
  getConfusionMatrix: () => number[][];
  getErrorAnalysis: () => ErrorAnalysisData;
}

export interface UseXAlgorithmTestingProps {
  initialAlgorithms?: XAlgorithm[];
  initialGoldStandard?: XGoldStandardItem[];
  defaultConfig?: Partial<AlgorithmTestConfig>;

  onTestComplete?: (
    results: XValidationResult[],
    metrics: ValidationMetrics
  ) => void;
  onError?: (error: Error) => void;

  autoLoadGoldStandard?: boolean;
  enableCaching?: boolean;
  debugMode?: boolean;
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================
export const useXAlgorithmTesting = ({
  initialAlgorithms = [],
  initialGoldStandard = [],
  defaultConfig = {},
  onTestComplete,
  onError,
  autoLoadGoldStandard = true,
  enableCaching = true,
  debugMode = false,
}: UseXAlgorithmTestingProps = {}): UseXAlgorithmTestingReturn => {
  // Etat
  const [availableAlgorithms, setAvailableAlgorithms] =
    useState<XAlgorithm[]>(initialAlgorithms);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<XAlgorithm | null>(
    null
  );
  const [testResults, setTestResults] = useState<XValidationResult[]>([]);
  const [goldStandardData, setGoldStandardData] =
    useState<XGoldStandardItem[]>(initialGoldStandard);
  const [validationMetrics, setValidationMetrics] =
    useState<ValidationMetrics | null>(null);

  const [testState, setTestState] = useState<AlgorithmTestState>({
    isRunning: false,
    progress: 0,
    currentStep: "",
    results: null,
    errors: [],
    estimatedTimeRemaining: undefined,
    processedSamples: 0,
  });

  // ⚠️ Config: pas de "parameters" ni "metricsToCalculate" — utilisez options.metricsToCalculate
  const [testConfig, setTestConfig] = useState<AlgorithmTestConfig>({
    algorithmId: "",
    variable: "X",
    sampleSize: 100,
    randomSeed: 42,
    useGoldStandard: true,
    crossValidation: { folds: 5, stratified: true },
    options: {
      metricsToCalculate: [
        "accuracy",
        "precision",
        "recall",
        "f1",
        "confusion_matrix",
      ],
    },
    ...defaultConfig,
  });

  // Cache
  const [resultsCache, setResultsCache] = useState<
    Map<string, XValidationResult[]>
  >(new Map());

  // Init gold standard
  useEffect(() => {
    if (autoLoadGoldStandard && goldStandardData.length === 0) {
      void loadGoldStandardData();
    }
  }, [autoLoadGoldStandard, goldStandardData.length]);

  // Select first algo by default
  useEffect(() => {
    if (availableAlgorithms.length > 0 && !selectedAlgorithm) {
      const first = availableAlgorithms[0];
      setSelectedAlgorithm(first);
      setTestConfig((prev) => ({ ...prev, algorithmId: first.id }));
    }
  }, [availableAlgorithms, selectedAlgorithm]);

  // =============================================================================
  // GESTION DES ALGORITHMES
  // =============================================================================
  const selectAlgorithm = useCallback(
    (algorithmId: string) => {
      const algorithm = availableAlgorithms.find((a) => a.id === algorithmId);
      if (!algorithm) return;

      setSelectedAlgorithm(algorithm);
      setTestConfig((prev) => ({
        ...prev,
        algorithmId,
        // si vous tenez à persister des params spécifiques :
        options: {
          ...(prev.options ?? {}),
          ...(algorithm.parameters ?? {}),
        },
      }));

      // reset résultats
      setTestResults([]);
      setValidationMetrics(null);
    },
    [availableAlgorithms]
  );

  const updateTestConfig = useCallback(
    (updates: Partial<AlgorithmTestConfig>) => {
      setTestConfig((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // =============================================================================
  // GOLD STANDARD (mock)
  // =============================================================================
  const loadGoldStandardData = useCallback(async () => {
    try {
      const mockGoldStandard: XGoldStandardItem[] = [
        {
          id: "1",
          verbatim: "Je vais vérifier votre dossier immédiatement",
          goldStandard: "ENGAGEMENT",
          annotatorConfidence: 0.95,
          annotatorId: "expert_1",
          annotationDate: new Date(),
          callId: "call_001",
        },
        {
          id: "2",
          verbatim: "D'accord, je comprends votre frustration",
          goldStandard: "REFLET_JE",
          annotatorConfidence: 0.9,
          annotatorId: "expert_1",
          annotationDate: new Date(),
          callId: "call_002",
        },
        {
          id: "3",
          verbatim: "Notre politique prévoit que les remboursements",
          goldStandard: "EXPLICATION",
          annotatorConfidence: 0.88,
          annotatorId: "expert_1",
          annotationDate: new Date(),
          callId: "call_003",
        },
      ];

      if (!validateGoldStandard(mockGoldStandard)) {
        throw new Error("Données gold standard invalides");
      }
      setGoldStandardData(mockGoldStandard);
    } catch (e) {
      onError?.(e as Error);
      setTestState((prev) => ({
        ...prev,
        errors: [...prev.errors, (e as Error).message],
      }));
    }
  }, [onError]);

  const validateGoldStandard = useCallback((data: XGoldStandardItem[]) => {
    const validCategories: VariableX[] = [
      "ENGAGEMENT",
      "EXPLICATION",
      "REFLET_ACQ",
      "REFLET_JE",
      "REFLET_VOUS",
      "OUVERTURE",
    ];
    return data.every(
      (item) =>
        item.verbatim?.trim().length > 0 &&
        validCategories.includes(item.goldStandard) &&
        item.annotatorConfidence >= 0 &&
        item.annotatorConfidence <= 1
    );
  }, []);

  // =============================================================================
  // METRICS
  // =============================================================================
  const calculateMetrics = useCallback((results: XValidationResult[]) => {
    if (results.length === 0) {
      return {
        accuracy: 0,
        errorRate: 1,
        sampleSize: 0,
        processingSpeed: 0,
        precision: {},
        recall: {},
        f1Score: {},
      } as ValidationMetrics;
    }

    const correct = results.filter((r) => r.correct).length;
    const accuracy = correct / results.length;

    const categories: VariableX[] = [
      "ENGAGEMENT",
      "EXPLICATION",
      "REFLET_ACQ",
      "REFLET_JE",
      "REFLET_VOUS",
      "OUVERTURE",
    ];
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1Score: Record<string, number> = {};

    for (const c of categories) {
      const tp = results.filter(
        (r) => r.predicted === c && r.goldStandard === c
      ).length;
      const fp = results.filter(
        (r) => r.predicted === c && r.goldStandard !== c
      ).length;
      const fn = results.filter(
        (r) => r.predicted !== c && r.goldStandard === c
      ).length;

      precision[c] = tp + fp > 0 ? tp / (tp + fp) : 0;
      recall[c] = tp + fn > 0 ? tp / (tp + fn) : 0;
      const p = precision[c];
      const r = recall[c];
      f1Score[c] = p + r > 0 ? (2 * p * r) / (p + r) : 0;
    }

    const avgMs =
      results.reduce((sum, r) => sum + (r.processingTime ?? 0), 0) /
      results.length;

    return {
      accuracy,
      errorRate: 1 - accuracy,
      sampleSize: results.length,
      processingSpeed: avgMs,
      precision,
      recall,
      f1Score,
    } as ValidationMetrics;
  }, []);

  // =============================================================================
  // EXECUTION
  // =============================================================================
  const runTesting = useCallback(
    async (config: AlgorithmTestConfig) => {
      if (!selectedAlgorithm) throw new Error("Aucun algorithme sélectionné");
      if (goldStandardData.length === 0)
        throw new Error("Aucune donnée gold standard disponible");

      const cacheKey = `${config.algorithmId}_${config.sampleSize}_${config.randomSeed}`;
      if (enableCaching && resultsCache.has(cacheKey)) {
        const cached = resultsCache.get(cacheKey)!;
        setTestResults(cached);
        const metrics = calculateMetrics(cached);
        setValidationMetrics(metrics);
        onTestComplete?.(cached, metrics);
        return;
      }

      setTestState({
        isRunning: true,
        progress: 0,
        currentStep: "Préparation des données de test...",
        results: null,
        errors: [],
        processedSamples: 0,
      });

      try {
        const sample = selectTestSample(
          goldStandardData,
          config.sampleSize ?? 100,
          config.randomSeed
        );

        setTestState((prev) => ({
          ...prev,
          progress: 10,
          currentStep: `Test sur ${sample.length} échantillons...`,
        }));

        const results: XValidationResult[] = [];
        const start = Date.now();

        for (let i = 0; i < sample.length; i++) {
          const gold = sample[i];
          try {
            const prediction = await selectedAlgorithm.classify(gold.verbatim);
            const processingTime = Date.now() - start;

            results.push({
              id: `test_${gold.id}_${Date.now()}`,
              verbatim: gold.verbatim,
              predicted: prediction.classification,
              goldStandard: gold.goldStandard,
              confidence: prediction.confidence,
              correct: prediction.classification === gold.goldStandard,
              evidence: prediction.evidence,
              processingTime,
              callId: gold.callId,
              speaker: "conseiller",
              timestamp: Date.now(),
              algorithmDetails: debugMode
                ? {
                    detectedPatterns: prediction.evidence,
                    linguisticMarkers: [],
                    confidenceBreakdown: {
                      ENGAGEMENT: 0,
                      EXPLICATION: 0,
                      REFLET_ACQ: 0,
                      REFLET_JE: 0,
                      REFLET_VOUS: 0,
                      OUVERTURE: 0,
                    },
                  }
                : undefined,
            });

            const progress = 10 + ((i + 1) / sample.length) * 80;
            const elapsed = Date.now() - start;
            const eta = ((elapsed / (i + 1)) * (sample.length - i - 1)) / 1000;

            setTestState((prev) => ({
              ...prev,
              progress,
              processedSamples: i + 1,
              estimatedTimeRemaining: eta,
              currentStep: `Traitement: ${i + 1}/${sample.length} (${
                prediction.classification
              })`,
            }));
          } catch (e) {
            setTestState((prev) => ({
              ...prev,
              errors: [
                ...prev.errors,
                `Erreur échantillon ${i}: ${(e as Error).message}`,
              ],
            }));
          }
        }

        setTestState((prev) => ({
          ...prev,
          progress: 90,
          currentStep: "Calcul des métriques...",
        }));

        const metrics = calculateMetrics(results);

        if (enableCaching) {
          setResultsCache((prev) => new Map(prev).set(cacheKey, results));
        }

        setTestResults(results);
        setValidationMetrics(metrics);

        setTestState({
          isRunning: false,
          progress: 100,
          currentStep: "Terminé",
          results: metrics,
          errors: [],
          processedSamples: results.length,
        });

        onTestComplete?.(results, metrics);
      } catch (e) {
        setTestState({
          isRunning: false,
          progress: 0,
          currentStep: "Erreur",
          results: null,
          errors: [(e as Error).message],
          processedSamples: 0,
        });
        onError?.(e as Error);
      }
    },
    [
      selectedAlgorithm,
      goldStandardData,
      enableCaching,
      resultsCache,
      debugMode,
      onTestComplete,
      onError,
      calculateMetrics,
    ]
  );

  // =============================================================================
  // UTILITAIRES
  // =============================================================================
  const selectTestSample = useCallback(
    (data: XGoldStandardItem[], sampleSize: number, seed?: number) => {
      const total = Math.min(sampleSize, data.length);
      const shuffled =
        seed !== undefined
          ? shuffleWithSeed([...data], seed)
          : [...data].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, total);
    },
    []
  );

  const shuffleWithSeed = <T>(array: T[], seed: number) => {
    const rng = seedRandom(seed ?? Date.now()); // seed assuré
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const seedRandom = (seed: number) => {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) % 0x100000000;
      return state / 0x100000000;
    };
    // aucune attente de retour ailleurs
  };

  const getConfusionMatrix = useCallback((): number[][] => {
    const cats: VariableX[] = [
      "ENGAGEMENT",
      "EXPLICATION",
      "REFLET_ACQ",
      "REFLET_JE",
      "REFLET_VOUS",
      "OUVERTURE",
    ];
    const m: number[][] = Array.from({ length: cats.length }, () =>
      Array(cats.length).fill(0)
    );
    for (const r of testResults) {
      if (!r.goldStandard) continue;
      const a = cats.indexOf(r.goldStandard);
      const p = cats.indexOf(r.predicted);
      if (a >= 0 && p >= 0) m[a][p]++;
    }
    return m;
  }, [testResults]);

  const getErrorAnalysis = useCallback((): ErrorAnalysisData => {
    const errs = testResults.filter((r) => !r.correct);
    const byCat: Record<VariableX, number> = {
      ENGAGEMENT: 0,
      EXPLICATION: 0,
      REFLET_ACQ: 0,
      REFLET_JE: 0,
      REFLET_VOUS: 0,
      OUVERTURE: 0,
    };
    const patterns = new Map<
      string,
      {
        predicted: VariableX;
        actual: VariableX;
        frequency: number;
        examples: string[];
      }
    >();

    for (const e of errs) {
      if (e.goldStandard) {
        byCat[e.goldStandard]++;
        const key = `${e.predicted}->${e.goldStandard}`;
        if (!patterns.has(key)) {
          patterns.set(key, {
            predicted: e.predicted,
            actual: e.goldStandard,
            frequency: 0,
            examples: [],
          });
        }
        const p = patterns.get(key)!;
        p.frequency++;
        if (p.examples.length < 3)
          p.examples.push(e.verbatim.slice(0, 50) + "…");
      }
    }

    const recommendations: string[] = [];
    if (byCat.ENGAGEMENT > byCat.EXPLICATION * 2) {
      recommendations.push(
        "Améliorer la détection d’ENGAGEMENT (verbes d’action)."
      );
    }
    if (byCat.REFLET_JE + byCat.REFLET_VOUS > errs.length * 0.4) {
      recommendations.push("Affiner la distinction REFLET_JE vs REFLET_VOUS.");
    }
    const high = Array.from(patterns.values()).find(
      (p) => p.frequency > errs.length * 0.2
    );
    if (high) {
      recommendations.push(
        `Confusion fréquente ${high.predicted} → ${high.actual}.`
      );
    }

    return {
      totalErrors: errs.length,
      errorsByCategory: byCat,
      confusionPatterns: Array.from(patterns.values()),
      recommendations,
    };
  }, [testResults]);

  const getVerbatimValidation = useCallback(
    async (verbatim: string): Promise<XValidationResult> => {
      if (!selectedAlgorithm) throw new Error("Aucun algorithme sélectionné");
      const t0 = Date.now();
      const pred = await selectedAlgorithm.classify(verbatim);
      const dt = Date.now() - t0;
      return {
        id: `interactive_${Date.now()}`,
        verbatim,
        predicted: pred.classification,
        confidence: pred.confidence,
        evidence: pred.evidence,
        processingTime: dt,
        callId: "interactive_test",
        speaker: "conseiller",
        timestamp: Date.now(),
        algorithmDetails: debugMode
          ? {
              detectedPatterns: pred.evidence,
              linguisticMarkers: [],
              confidenceBreakdown: {
                ENGAGEMENT: 0,
                EXPLICATION: 0,
                REFLET_ACQ: 0,
                REFLET_JE: 0,
                REFLET_VOUS: 0,
                OUVERTURE: 0,
              },
            }
          : undefined,
      };
    },
    [selectedAlgorithm, debugMode]
  );

  const exportResults = useCallback(() => {
    if (testResults.length === 0) return;
    const csvData = [
      [
        "ID",
        "Verbatim",
        "Gold Standard",
        "Prédit",
        "Confiance",
        "Correct",
        "Temps (ms)",
        "Call ID",
      ],
      ...testResults.map((r) => [
        r.id,
        `"${r.verbatim.replace(/"/g, '""')}"`,
        r.goldStandard || "",
        r.predicted,
        r.confidence.toString(),
        r.correct?.toString() || "",
        r.processingTime.toString(),
        r.callId,
      ]),
    ];
    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `x_validation_results_${
      selectedAlgorithm?.id
    }_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [testResults, selectedAlgorithm]);

  const clearResults = useCallback(() => {
    setTestResults([]);
    setValidationMetrics(null);
    setTestState({
      isRunning: false,
      progress: 0,
      currentStep: "",
      results: null,
      errors: [],
      processedSamples: 0,
    });
  }, []);

  // Métriques calculées côté client (live)
  const currentMetrics = useMemo(
    () => (testResults.length > 0 ? calculateMetrics(testResults) : null),
    [testResults, calculateMetrics]
  );

  // ---- Retour du hook
  return {
    testState,
    testResults,
    goldStandardData,
    availableAlgorithms,
    selectedAlgorithm,
    validationMetrics: currentMetrics,
    selectAlgorithm,
    runTesting,
    clearResults,
    testConfig,
    updateTestConfig,
    getVerbatimValidation,
    exportResults,
    loadGoldStandardData,
    validateGoldStandard,
    calculateMetrics,
    getConfusionMatrix,
    getErrorAnalysis,
  };
};
