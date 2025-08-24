// components/AlgorithmLab/hooks/useGlobalAlgorithmTesting.ts
// Hook principal pour Algorithm Lab global multi-domaines

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AlgorithmLabConfig,
  AlgorithmLabState,
  GlobalTestResult,
  CrossDomainMetrics,
  OptimizationResult,
  TestDomain,
  TestIndicator,
  LabMode,
  AlgorithmLabError,
  ALGORITHM_LAB_CONSTANTS,
  DomainTestResult,
  ComparisonResult,
  ValidationResult,
} from "../types";

// Types pour le hook
interface UseGlobalAlgorithmTestingProps {
  initialConfig?: Partial<AlgorithmLabConfig>;
  selectedOrigin?: string | null;
  autoSave?: boolean;
}

interface UseGlobalAlgorithmTestingReturn {
  // État principal
  labState: AlgorithmLabState;
  isInitialized: boolean;

  // Configuration
  updateConfig: (updates: Partial<AlgorithmLabConfig>) => void;
  resetConfig: () => void;
  loadConfig: (configId: string) => Promise<void>;
  saveConfig: (name: string) => Promise<string>;

  // Tests
  runSingleTest: (
    domain: TestDomain,
    indicator: TestIndicator,
    algorithmId: string
  ) => Promise<GlobalTestResult>;
  runComparison: (
    algorithms: string[],
    domains: TestDomain[]
  ) => Promise<ComparisonResult>;
  runCrossDomainValidation: () => Promise<CrossDomainMetrics>;

  // Optimisation
  startOptimization: (
    algorithmId: string,
    domain: TestDomain
  ) => Promise<OptimizationResult>;
  stopOptimization: () => void;
  getOptimizationProgress: () => number;

  // Historique et données
  getTestHistory: () => GlobalTestResult[];
  getOptimizationHistory: () => OptimizationResult[];
  clearHistory: () => void;

  // Utilitaires
  getDomainStatus: (
    domain: TestDomain
  ) => "available" | "unavailable" | "partial";
  getAvailableAlgorithms: (domain: TestDomain) => string[];
  getAvailableIndicators: (domain: TestDomain) => TestIndicator[];

  // Export
  exportResults: (format: "json" | "csv" | "latex") => Promise<string>;

  // État UI
  error: string | null;
  isRunning: boolean;
  progress: number;
  currentOperation: string;
}

// Configuration par défaut
const DEFAULT_CONFIG: AlgorithmLabConfig = {
  mode: "overview",
  selectedDomains: ["all"],
  selectedIndicators: [],
  testParameters: {
    sampleSize: ALGORITHM_LAB_CONSTANTS.DEFAULT_SAMPLE_SIZE,
    samplingMethod: "random",
    crossValidation: {
      enabled: true,
      folds: ALGORITHM_LAB_CONSTANTS.DEFAULT_CV_FOLDS,
    },
  },
};

// Helper pour créer un résultat de domaine vide
const createEmptyDomainResult = (domain: TestDomain): DomainTestResult => ({
  domain,
  indicators: {} as Record<TestIndicator, any>,
  overallScore: 0,
  processingTime: 0,
  sampleSize: 0,
});

// Helper pour créer tous les domaines requis
const createAllDomainResults = (
  activeDomain: TestDomain,
  activeDomainResult: DomainTestResult
): Record<TestDomain, DomainTestResult> => {
  const allDomains: TestDomain[] = ["li", "cognitive", "ac", "all"];
  const results: Record<TestDomain, DomainTestResult> = {} as Record<
    TestDomain,
    DomainTestResult
  >;

  allDomains.forEach((domain) => {
    if (domain === activeDomain) {
      results[domain] = activeDomainResult;
    } else {
      results[domain] = createEmptyDomainResult(domain);
    }
  });

  return results;
};

// Simulation du registry des domaines (à remplacer par vraie implémentation)
const MOCK_DOMAIN_REGISTRY = {
  li: {
    algorithms: [
      "BasicAlignment",
      "ConversationalPattern",
      "SequentialPattern",
    ],
    indicators: ["feedback_alignment", "common_ground", "backchannels"],
    status: "operational" as const,
  },
  cognitive: {
    algorithms: ["BasicFluidity", "NeuronMirror", "MLEnhanced"],
    indicators: [
      "fluidite_cognitive",
      "reactions_directes",
      "charge_cognitive",
    ],
    status: "operational" as const,
  },
  ac: {
    algorithms: ["StrategyAnalysis", "TagPatterns", "TemporalAnalysis"],
    indicators: [
      "strategy_effectiveness",
      "tag_patterns",
      "temporal_evolution",
    ],
    status: "legacy" as const,
  },
};

export const useGlobalAlgorithmTesting = ({
  initialConfig = {},
  selectedOrigin,
  autoSave = true,
}: UseGlobalAlgorithmTestingProps = {}): UseGlobalAlgorithmTestingReturn => {
  // États principaux
  const [labState, setLabState] = useState<AlgorithmLabState>({
    config: { ...DEFAULT_CONFIG, ...initialConfig },
    testHistory: [],
    optimizationResults: [],
    expertAnnotations: [],
    isRunning: false,
    progress: {
      currentStep: "",
      totalSteps: 0,
      completedSteps: 0,
      estimatedTimeRemaining: 0,
      currentOperation: "",
    },
    errors: [],
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs pour cache et optimisation
  const optimizationControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, any>>(new Map());

  // Vérification de la disponibilité des domaines
  const checkDomainAvailability = async (): Promise<
    Record<TestDomain, string>
  > => {
    // Simulation - à remplacer par vraies vérifications
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          li: "available",
          cognitive: "available",
          ac: "available",
          all: "available",
        });
      }, 500);
    });
  };

  // Initialisation
  useEffect(() => {
    const initializeGlobalLab = async () => {
      try {
        // Charger l'historique depuis localStorage
        const savedHistory = localStorage.getItem(
          "algorithmLab_global_history"
        );
        if (savedHistory) {
          try {
            const history = JSON.parse(savedHistory);
            setLabState((prev) => ({
              ...prev,
              testHistory: history.tests || [],
              optimizationResults: history.optimizations || [],
            }));
          } catch (e) {
            console.warn("Impossible de charger l'historique global:", e);
          }
        }

        // Vérifier la disponibilité des domaines
        const domainStatus = await checkDomainAvailability();
        console.log("Statut des domaines:", domainStatus);

        setIsInitialized(true);
        console.log("Algorithm Lab Global initialisé");
      } catch (err) {
        setError("Erreur lors de l'initialisation du Lab Global");
        console.error("Erreur initialisation:", err);
      }
    };

    initializeGlobalLab();
  }, []);

  // Auto-sauvegarde
  useEffect(() => {
    if (!autoSave || !isInitialized) return;

    const saveToStorage = () => {
      try {
        const dataToSave = {
          tests: labState.testHistory,
          optimizations: labState.optimizationResults,
          config: labState.config,
          lastUpdate: new Date().toISOString(),
        };
        localStorage.setItem(
          "algorithmLab_global_history",
          JSON.stringify(dataToSave)
        );
      } catch (e) {
        console.warn("Impossible de sauvegarder automatiquement:", e);
      }
    };

    const interval = setInterval(saveToStorage, 30000); // Sauvegarde toutes les 30s
    return () => clearInterval(interval);
  }, [
    labState.testHistory,
    labState.optimizationResults,
    labState.config,
    autoSave,
    isInitialized,
  ]);

  // Mise à jour de la configuration
  const updateConfig = useCallback((updates: Partial<AlgorithmLabConfig>) => {
    setLabState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        ...updates,
      },
    }));
    setError(null);
  }, []);

  // Réinitialisation
  const resetConfig = useCallback(() => {
    setLabState((prev) => ({
      ...prev,
      config: DEFAULT_CONFIG,
    }));
    setError(null);
  }, []);

  // Sauvegarde de configuration
  const saveConfig = useCallback(
    async (name: string): Promise<string> => {
      try {
        const configId = `config_${Date.now()}`;
        const configToSave = {
          id: configId,
          name,
          config: labState.config,
          created: new Date(),
        };

        const savedConfigs = localStorage.getItem(
          "algorithmLab_global_configs"
        );
        const configs = savedConfigs ? JSON.parse(savedConfigs) : [];
        configs.push(configToSave);

        localStorage.setItem(
          "algorithmLab_global_configs",
          JSON.stringify(configs)
        );
        console.log(`Configuration "${name}" sauvegardée:`, configId);

        return configId;
      } catch (err) {
        const errorMsg = "Impossible de sauvegarder la configuration";
        setError(errorMsg);
        throw new AlgorithmLabError(errorMsg, "EXPORT_FAILED");
      }
    },
    [labState.config]
  );

  // Chargement de configuration
  const loadConfig = useCallback(async (configId: string): Promise<void> => {
    try {
      const savedConfigs = localStorage.getItem("algorithmLab_global_configs");
      if (!savedConfigs) {
        throw new AlgorithmLabError(
          "Aucune configuration sauvegardée",
          "INVALID_CONFIG"
        );
      }

      const configs = JSON.parse(savedConfigs);
      const config = configs.find((c: any) => c.id === configId);

      if (!config) {
        throw new AlgorithmLabError(
          "Configuration introuvable",
          "INVALID_CONFIG"
        );
      }

      setLabState((prev) => ({
        ...prev,
        config: config.config,
      }));
      setError(null);
      console.log("Configuration chargée:", configId);
    } catch (err) {
      const errorMsg =
        err instanceof AlgorithmLabError
          ? err.message
          : "Erreur lors du chargement";
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Test unique
  const runSingleTest = useCallback(
    async (
      domain: TestDomain,
      indicator: TestIndicator,
      algorithmId: string
    ): Promise<GlobalTestResult> => {
      if (labState.isRunning) {
        throw new AlgorithmLabError(
          "Un test est déjà en cours",
          "INVALID_CONFIG"
        );
      }

      setLabState((prev) => ({
        ...prev,
        isRunning: true,
        progress: {
          currentStep: "Initialisation",
          totalSteps: 4,
          completedSteps: 0,
          estimatedTimeRemaining: 5000,
          currentOperation: `Test ${algorithmId} sur ${indicator}`,
        },
      }));

      try {
        console.log(`Test unique: ${algorithmId} sur ${domain}/${indicator}`);

        // Simulation des étapes de test
        const steps = [
          "Préparation des données",
          "Exécution de l'algorithme",
          "Calcul des métriques",
          "Finalisation",
        ];

        for (let i = 0; i < steps.length; i++) {
          setLabState((prev) => ({
            ...prev,
            progress: {
              ...prev.progress,
              currentStep: steps[i],
              completedSteps: i,
              estimatedTimeRemaining: (steps.length - i) * 1000,
            },
          }));

          await new Promise((resolve) => setTimeout(resolve, 1200));
        }

        // Résultat simulé avec structure de domaine active
        const activeDomainResult: DomainTestResult = {
          domain,
          indicators: {
            [indicator]: {
              indicator,
              algorithms: {
                [algorithmId]: {
                  algorithmId,
                  score: 0.78 + Math.random() * 0.2,
                  confidence: 0.85 + Math.random() * 0.15,
                  metrics: {
                    accuracy: 0.75 + Math.random() * 0.2,
                    precision: 0.73 + Math.random() * 0.2,
                    recall: 0.71 + Math.random() * 0.25,
                    f1Score: 0.74 + Math.random() * 0.2,
                  },
                  performance: {
                    processingTime: 800 + Math.random() * 400,
                    memoryUsage: 120 + Math.random() * 80,
                    cacheHitRate: 0.6 + Math.random() * 0.3,
                  },
                  details: {
                    sampleSize: labState.config.testParameters.sampleSize,
                    correctPredictions: Math.floor(
                      labState.config.testParameters.sampleSize *
                        (0.75 + Math.random() * 0.2)
                    ),
                    examples: [],
                  },
                },
              },
              bestAlgorithm: algorithmId,
              convergenceRate: 0.8 + Math.random() * 0.15,
              recommendation: `Algorithme ${algorithmId} recommandé pour ${indicator}`,
            },
          } as Record<TestIndicator, any>,
          overallScore: 0.76 + Math.random() * 0.2,
          processingTime: 1200 + Math.random() * 800,
          sampleSize: labState.config.testParameters.sampleSize,
        };

        const result: GlobalTestResult = {
          testId: `test_${Date.now()}`,
          timestamp: new Date(),
          config: labState.config,
          domainResults: createAllDomainResults(domain, activeDomainResult),
          crossDomainMetrics: {
            kendallTau: {},
            pearsonR: {},
            spearmanRho: {},
            agreementRates: {},
            divergencePatterns: [],
            overallConsistency: 0.85,
            hypothesesValidation: {
              h1_action_effectiveness: {
                validated: true,
                confidence: 0.89,
                evidence: [
                  "Test unique - données insuffisantes pour validation complète",
                ],
              },
              h2_explanation_difficulty: {
                validated: false,
                confidence: 0.45,
                evidence: ["Nécessite comparaison multi-domaines"],
              },
              h3_context_modulation: {
                validated: false,
                confidence: 0.32,
                evidence: ["Analyse temporelle requise"],
              },
            },
          },
          executionTime: 5000,
          status: "success",
        };

        // Ajouter à l'historique
        setLabState((prev) => ({
          ...prev,
          testHistory: [result, ...prev.testHistory.slice(0, 49)],
          currentTest: result,
          isRunning: false,
          progress: {
            currentStep: "Terminé",
            totalSteps: 4,
            completedSteps: 4,
            estimatedTimeRemaining: 0,
            currentOperation: "Test complété avec succès",
          },
        }));

        console.log("Test unique terminé:", result);
        return result;
      } catch (err) {
        setLabState((prev) => ({
          ...prev,
          isRunning: false,
          errors: [
            ...prev.errors,
            {
              id: `error_${Date.now()}`,
              timestamp: new Date(),
              type: "execution",
              severity: "error",
              message: err instanceof Error ? err.message : "Erreur inconnue",
              details: err,
            },
          ],
        }));

        const error =
          err instanceof AlgorithmLabError
            ? err
            : new AlgorithmLabError(
                "Erreur lors du test unique",
                "EXECUTION_ERROR"
              );
        setError(error.message);
        throw error;
      }
    },
    [labState.config, labState.isRunning]
  );

  // Comparaison multi-algorithmes
  const runComparison = useCallback(
    async (
      algorithms: string[],
      domains: TestDomain[]
    ): Promise<ComparisonResult> => {
      if (labState.isRunning) {
        throw new AlgorithmLabError(
          "Un test est déjà en cours",
          "INVALID_CONFIG"
        );
      }

      setLabState((prev) => ({
        ...prev,
        isRunning: true,
        progress: {
          currentStep: "Comparaison en cours",
          totalSteps: algorithms.length * domains.length,
          completedSteps: 0,
          estimatedTimeRemaining: algorithms.length * domains.length * 2000,
          currentOperation: `Comparaison de ${algorithms.length} algorithmes sur ${domains.length} domaines`,
        },
      }));

      try {
        console.log(
          `Comparaison: ${algorithms.join(", ")} sur domaines ${domains.join(
            ", "
          )}`
        );

        // Simulation de la comparaison
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const result: ComparisonResult = {
          comparisonId: `comp_${Date.now()}`,
          timestamp: new Date(),
          algorithms,
          metrics: {
            accuracy: {
              metric: "accuracy",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 0.7 + Math.random() * 0.25])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            precision: {
              metric: "precision",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 0.68 + Math.random() * 0.27])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            recall: {
              metric: "recall",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 0.65 + Math.random() * 0.3])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            f1_score: {
              metric: "f1_score",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 0.68 + Math.random() * 0.27])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            processing_time: {
              metric: "processing_time",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 500 + Math.random() * 1000])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            memory_usage: {
              metric: "memory_usage",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 100 + Math.random() * 200])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            convergence_rate: {
              metric: "convergence_rate",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 0.6 + Math.random() * 0.3])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            expert_agreement: {
              metric: "expert_agreement",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 0.7 + Math.random() * 0.25])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
            cross_domain_consistency: {
              metric: "cross_domain_consistency",
              scores: Object.fromEntries(
                algorithms.map((algo) => [algo, 0.65 + Math.random() * 0.3])
              ),
              ranking: [...algorithms].sort(() => Math.random() - 0.5),
              statisticalSignificance: {},
              confidenceIntervals: {},
            },
          },
          overallRanking: algorithms.map((algo, idx) => ({
            algorithmId: algo,
            rank: idx + 1,
            overallScore: 0.7 + Math.random() * 0.25,
            strengths: ["Performance", "Précision"],
            weaknesses: ["Temps de traitement"],
            useCases: ["Analyse générale", "Validation croisée"],
          })),
          recommendations: [
            {
              context: "Usage général",
              recommendedAlgorithm: algorithms[0],
              confidence: 0.85,
              rationale: "Meilleur compromis performance/précision",
              alternativeOptions: algorithms.slice(1),
            },
          ],
          exportData: {
            format: "json",
            data: {},
            metadata: {
              generatedAt: new Date(),
              version: "1.0",
              author: "Algorithm Lab",
            },
          },
        };

        setLabState((prev) => ({
          ...prev,
          isRunning: false,
          progress: {
            currentStep: "Comparaison terminée",
            totalSteps: algorithms.length * domains.length,
            completedSteps: algorithms.length * domains.length,
            estimatedTimeRemaining: 0,
            currentOperation: "Comparaison complétée",
          },
        }));

        return result;
      } catch (err) {
        setLabState((prev) => ({ ...prev, isRunning: false }));
        const error =
          err instanceof AlgorithmLabError
            ? err
            : new AlgorithmLabError(
                "Erreur lors de la comparaison",
                "EXECUTION_ERROR"
              );
        setError(error.message);
        throw error;
      }
    },
    [labState.isRunning]
  );

  // Validation croisée entre domaines
  const runCrossDomainValidation =
    useCallback(async (): Promise<CrossDomainMetrics> => {
      console.log("Validation croisée multi-domaines");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        kendallTau: {
          li_cognitive: 0.68,
          li_ac: 0.73,
          cognitive_ac: 0.61,
        },
        pearsonR: {
          li_cognitive: 0.72,
          li_ac: 0.79,
          cognitive_ac: 0.65,
        },
        spearmanRho: {
          li_cognitive: 0.71,
          li_ac: 0.76,
          cognitive_ac: 0.63,
        },
        agreementRates: {
          li_cognitive: 0.74,
          li_ac: 0.81,
          cognitive_ac: 0.67,
        },
        divergencePatterns: [
          {
            domains: ["li", "cognitive"],
            indicators: ["feedback_alignment", "fluidite_cognitive"],
            divergenceType: "contextual",
            severity: "medium",
            description: "Divergence sur les cas de forte charge cognitive",
            examples: ["Verbatims complexes", "Situations de stress"],
            recommendations: [
              "Ajuster seuils cognitifs",
              "Pondérer par contexte",
            ],
          },
        ],
        overallConsistency: 0.73,
        hypothesesValidation: {
          h1_action_effectiveness: {
            validated: true,
            confidence: 0.87,
            evidence: ["Concordance LI-AC: 0.81", "Validation cognitive: 0.74"],
          },
          h2_explanation_difficulty: {
            validated: true,
            confidence: 0.82,
            evidence: [
              "Convergence négative EXPLICATION",
              "Validation multi-domaines",
            ],
          },
          h3_context_modulation: {
            validated: false,
            confidence: 0.45,
            evidence: ["Données temporelles insuffisantes"],
          },
        },
      };
    }, []);

  // Optimisation automatique
  const startOptimization = useCallback(
    async (
      algorithmId: string,
      domain: TestDomain
    ): Promise<OptimizationResult> => {
      if (labState.isRunning) {
        throw new AlgorithmLabError(
          "Une opération est déjà en cours",
          "INVALID_CONFIG"
        );
      }

      optimizationControllerRef.current = new AbortController();

      setLabState((prev) => ({
        ...prev,
        isRunning: true,
        progress: {
          currentStep: "Optimisation en cours",
          totalSteps: 100,
          completedSteps: 0,
          estimatedTimeRemaining: 120000,
          currentOperation: `Optimisation ${algorithmId}`,
        },
      }));

      try {
        console.log(`Optimisation: ${algorithmId} sur domaine ${domain}`);

        const maxIterations = 50;
        const convergenceHistory: any[] = [];

        for (let i = 0; i < maxIterations; i++) {
          if (optimizationControllerRef.current?.signal.aborted) {
            throw new AlgorithmLabError(
              "Optimisation annulée",
              "OPTIMIZATION_FAILED"
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 100));

          const score = 0.6 + (i / maxIterations) * 0.3 + Math.random() * 0.1;
          convergenceHistory.push({
            iteration: i,
            parameters: { threshold: 0.5 + i * 0.01 },
            score,
            validationScore: score - 0.05 + Math.random() * 0.1,
            timestamp: new Date(),
          });

          setLabState((prev) => ({
            ...prev,
            progress: {
              ...prev.progress,
              completedSteps: Math.floor((i / maxIterations) * 100),
              estimatedTimeRemaining:
                ((maxIterations - i) / maxIterations) * 120000,
            },
          }));

          if (
            i > 10 &&
            Math.abs(
              convergenceHistory[i].score - convergenceHistory[i - 5].score
            ) < 0.01
          ) {
            break;
          }
        }

        const result: OptimizationResult = {
          optimizationId: `opt_${Date.now()}`,
          timestamp: new Date(),
          algorithm: algorithmId,
          domain,
          indicator: "feedback_alignment" as TestIndicator,
          bestParameters: { threshold: 0.65, weight: 0.8 },
          bestScore: Math.max(...convergenceHistory.map((h) => h.score)),
          improvementRate: 0.15,
          iterationsCount: convergenceHistory.length,
          convergenceHistory,
          validationResults: [],
          recommendation: `Paramètres optimaux trouvés pour ${algorithmId}`,
        };

        setLabState((prev) => ({
          ...prev,
          optimizationResults: [
            result,
            ...prev.optimizationResults.slice(0, 19),
          ],
          isRunning: false,
          progress: {
            currentStep: "Optimisation terminée",
            totalSteps: 100,
            completedSteps: 100,
            estimatedTimeRemaining: 0,
            currentOperation: "Optimisation complétée",
          },
        }));

        return result;
      } catch (err) {
        setLabState((prev) => ({ ...prev, isRunning: false }));
        const error =
          err instanceof AlgorithmLabError
            ? err
            : new AlgorithmLabError(
                "Erreur lors de l'optimisation",
                "OPTIMIZATION_FAILED"
              );
        setError(error.message);
        throw error;
      } finally {
        optimizationControllerRef.current = null;
      }
    },
    [labState.isRunning]
  );

  // Arrêt d'optimisation
  const stopOptimization = useCallback(() => {
    if (optimizationControllerRef.current) {
      optimizationControllerRef.current.abort();
      setLabState((prev) => ({
        ...prev,
        isRunning: false,
        progress: {
          ...prev.progress,
          currentOperation: "Optimisation annulée",
        },
      }));
    }
  }, []);

  // Utilitaires
  const getDomainStatus = useCallback((domain: TestDomain) => {
    return MOCK_DOMAIN_REGISTRY[domain as keyof typeof MOCK_DOMAIN_REGISTRY]
      ?.status === "operational"
      ? ("available" as const)
      : ("unavailable" as const);
  }, []);

  const getAvailableAlgorithms = useCallback((domain: TestDomain) => {
    return (
      MOCK_DOMAIN_REGISTRY[domain as keyof typeof MOCK_DOMAIN_REGISTRY]
        ?.algorithms || []
    );
  }, []);

  const getAvailableIndicators = useCallback(
    (domain: TestDomain): TestIndicator[] => {
      const domainData =
        MOCK_DOMAIN_REGISTRY[domain as keyof typeof MOCK_DOMAIN_REGISTRY];
      if (!domainData) return [];

      // Cast explicite vers TestIndicator[] car nous savons que les données du mock sont correctes
      return domainData.indicators as TestIndicator[];
    },
    []
  );

  // Export des résultats
  const exportResults = useCallback(
    async (format: "json" | "csv" | "latex"): Promise<string> => {
      try {
        const exportData = {
          testHistory: labState.testHistory,
          optimizationResults: labState.optimizationResults,
          config: labState.config,
          exportMetadata: {
            timestamp: new Date(),
            format,
            version: "1.0",
          },
        };

        switch (format) {
          case "json":
            return JSON.stringify(exportData, null, 2);
          case "csv":
            // Conversion CSV simplifiée
            return (
              "timestamp,algorithm,score,domain\n" +
              labState.testHistory
                .map((test) => {
                  const firstDomain = Object.keys(test.domainResults)[0];
                  const firstDomainResult = Object.values(
                    test.domainResults
                  )[0];
                  return `${test.timestamp.toISOString()},${firstDomain},${
                    firstDomainResult?.overallScore || 0
                  },${firstDomain}`;
                })
                .join("\n")
            );
          case "latex":
            // Template LaTeX basique
            return `\\begin{table}[h]
\\centering
\\begin{tabular}{|l|l|l|}
\\hline
Algorithm & Domain & Score \\\\
\\hline
${labState.testHistory
  .slice(0, 10)
  .map((test) => {
    const firstDomain = Object.keys(test.domainResults)[0];
    const firstDomainResult = Object.values(test.domainResults)[0];
    return `${firstDomain} & ${firstDomain} & ${(
      firstDomainResult?.overallScore || 0
    ).toFixed(3)} \\\\`;
  })
  .join("\n")}
\\hline
\\end{tabular}
\\caption{Algorithm Lab Results}
\\end{table}`;
          default:
            throw new AlgorithmLabError(
              "Format d'export non supporté",
              "EXPORT_FAILED"
            );
        }
      } catch (err) {
        const error =
          err instanceof AlgorithmLabError
            ? err
            : new AlgorithmLabError("Erreur lors de l'export", "EXPORT_FAILED");
        setError(error.message);
        throw error;
      }
    },
    [labState]
  );

  // Accesseurs historique
  const getTestHistory = useCallback(
    () => labState.testHistory,
    [labState.testHistory]
  );
  const getOptimizationHistory = useCallback(
    () => labState.optimizationResults,
    [labState.optimizationResults]
  );
  const getOptimizationProgress = useCallback(() => {
    return labState.isRunning
      ? (labState.progress.completedSteps / labState.progress.totalSteps) * 100
      : 0;
  }, [labState.isRunning, labState.progress]);

  const clearHistory = useCallback(() => {
    setLabState((prev) => ({
      ...prev,
      testHistory: [],
      optimizationResults: [],
    }));
    localStorage.removeItem("algorithmLab_global_history");
  }, []);

  return {
    // État principal
    labState,
    isInitialized,

    // Configuration
    updateConfig,
    resetConfig,
    loadConfig,
    saveConfig,

    // Tests
    runSingleTest,
    runComparison,
    runCrossDomainValidation,

    // Optimisation
    startOptimization,
    stopOptimization,
    getOptimizationProgress,

    // Historique et données
    getTestHistory,
    getOptimizationHistory,
    clearHistory,

    // Utilitaires
    getDomainStatus,
    getAvailableAlgorithms,
    getAvailableIndicators,

    // Export
    exportResults,

    // État UI
    error,
    isRunning: labState.isRunning,
    progress:
      (labState.progress.completedSteps /
        Math.max(labState.progress.totalSteps, 1)) *
      100,
    currentOperation: labState.progress.currentOperation,
  };
};
