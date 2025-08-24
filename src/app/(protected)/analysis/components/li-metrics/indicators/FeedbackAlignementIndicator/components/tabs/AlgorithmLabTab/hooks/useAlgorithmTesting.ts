// hooks/useAlgorithmTesting.ts - Hook principal pour la logique de test Algorithm Lab
import { useState, useCallback, useEffect, useRef } from "react";
import {
  AlgorithmType,
  AlgorithmConfig,
  ValidationResult,
  TestSample,
  ClassificationCase,
  SamplingParameters,
  PerformanceMetrics,
  AlgorithmLabError,
  ALGORITHM_LAB_CONSTANTS,
} from "../types";

// Types spécifiques au hook
interface UseAlgorithmTestingProps {
  initialConfig?: AlgorithmConfig;
  selectedOrigin?: string | null;
}

interface UseAlgorithmTestingReturn {
  // État principal
  currentConfig: AlgorithmConfig;
  isRunningTest: boolean;
  lastValidationResult: ValidationResult | null;
  currentSample: TestSample | null;

  // Actions
  updateConfig: (updates: Partial<AlgorithmConfig["parameters"]>) => void;
  runTest: (sampleParams: SamplingParameters) => Promise<ValidationResult>;
  generateSample: (params: SamplingParameters) => Promise<TestSample>;
  validateCase: (caseId: string, correctedTag?: string) => void;

  // Utilitaires
  resetConfig: () => void;
  saveConfig: (name: string) => void;
  loadConfig: (configId: string) => void;

  // Métriques et statistiques
  getTestHistory: () => ValidationResult[];
  getPerformanceTrend: () => { date: Date; accuracy: number }[];

  // État de l'interface
  error: string | null;
  isInitialized: boolean;
}

// Configuration par défaut pour Phase 1
const DEFAULT_CONFIG: AlgorithmConfig = {
  name: "lica",
  parameters: {
    thresholds: {
      minimumVerbatimLength: 8,
      collaborationThreshold: 0.6,
      coherenceThreshold: 0.5,
      strategicEffectivenessThreshold: 0.7,
    },
    weights: {
      strategicEffectiveness: 0.7,
      turnCoherence: 0.3,
      sequentialAlignment: 0.0, // Pas encore utilisé en Phase 1
    },
  },
  metadata: {
    created: new Date(),
    lastModified: new Date(),
    description: "Configuration par défaut Phase 1 MVP",
    version: "1.0.0",
  },
};

export const useAlgorithmTesting = ({
  initialConfig = DEFAULT_CONFIG,
  selectedOrigin,
}: UseAlgorithmTestingProps = {}): UseAlgorithmTestingReturn => {
  // États principaux
  const [currentConfig, setCurrentConfig] =
    useState<AlgorithmConfig>(initialConfig);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [lastValidationResult, setLastValidationResult] =
    useState<ValidationResult | null>(null);
  const [currentSample, setCurrentSample] = useState<TestSample | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache et historique
  const testHistoryRef = useRef<ValidationResult[]>([]);
  const savedConfigsRef = useRef<Map<string, AlgorithmConfig>>(new Map());

  // Initialisation - Simulation Phase 1
  useEffect(() => {
    const initializeAlgorithmLab = async () => {
      try {
        // Simulation du chargement des configurations sauvegardées
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Charger l'historique depuis localStorage si disponible
        const savedHistory = localStorage.getItem("algorithmLab_testHistory");
        if (savedHistory) {
          try {
            testHistoryRef.current = JSON.parse(savedHistory);
          } catch (e) {
            console.warn("Impossible de charger l'historique de test:", e);
          }
        }

        // Charger les configurations sauvegardées
        const savedConfigs = localStorage.getItem("algorithmLab_savedConfigs");
        if (savedConfigs) {
          try {
            const configs = JSON.parse(savedConfigs);
            savedConfigsRef.current = new Map(configs);
          } catch (e) {
            console.warn("Impossible de charger les configurations:", e);
          }
        }

        setIsInitialized(true);
        console.log("Algorithm Lab initialisé avec succès");
      } catch (err) {
        setError("Erreur lors de l'initialisation");
        console.error("Erreur d'initialisation Algorithm Lab:", err);
      }
    };

    initializeAlgorithmLab();
  }, []);

  // Mise à jour de la configuration
  const updateConfig = useCallback(
    (updates: Partial<AlgorithmConfig["parameters"]>) => {
      try {
        setCurrentConfig((prev) => ({
          ...prev,
          parameters: {
            ...prev.parameters,
            ...updates,
          },
          metadata: {
            ...prev.metadata,
            lastModified: new Date(),
          },
        }));

        setError(null);
        console.log("Configuration mise à jour:", updates);
      } catch (err) {
        setError("Erreur lors de la mise à jour de la configuration");
        console.error("Erreur updateConfig:", err);
      }
    },
    []
  );

  // Génération d'échantillon - Simulation Phase 1
  const generateSample = useCallback(
    async (params: SamplingParameters): Promise<TestSample> => {
      console.log("Génération d'échantillon (simulation Phase 1):", params);

      // Validation des paramètres
      if (params.size < ALGORITHM_LAB_CONSTANTS.MIN_SAMPLE_SIZE) {
        throw new AlgorithmLabError(
          `Taille d'échantillon trop petite (min: ${ALGORITHM_LAB_CONSTANTS.MIN_SAMPLE_SIZE})`,
          "SAMPLE_TOO_SMALL"
        );
      }

      if (params.size > ALGORITHM_LAB_CONSTANTS.MAX_SAMPLE_SIZE) {
        throw new AlgorithmLabError(
          `Taille d'échantillon trop grande (max: ${ALGORITHM_LAB_CONSTANTS.MAX_SAMPLE_SIZE})`,
          "SAMPLE_TOO_SMALL"
        );
      }

      // Simulation de génération d'échantillon
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Création d'un échantillon simulé pour Phase 1
      const simulatedCases: ClassificationCase[] = Array.from(
        { length: Math.min(params.size, 50) },
        (_, i) => ({
          id: `sim_case_${i + 1}`,
          conseillerVerbatim: `Verbatim conseiller simulé ${i + 1}`,
          clientVerbatim: `Verbatim client simulé ${i + 1}`,
          manualTag: ["REFLET", "ENGAGEMENT", "EXPLICATION", "OUVERTURE"][
            i % 4
          ],
          predictedTag: ["REFLET", "ENGAGEMENT", "EXPLICATION", "OUVERTURE"][
            Math.floor(Math.random() * 4)
          ],
          confidence: 0.6 + Math.random() * 0.4, // 60-100%
          callId: `call_sim_${Math.floor(Math.random() * 1000)}`,
          timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // 30 derniers jours
          isValidated: false,
        })
      );

      const sample: TestSample = {
        id: `sample_${Date.now()}`,
        cases: simulatedCases,
        samplingMethod: "random", // Simulation
        samplingParameters: params,
        created: new Date(),
        description: `Échantillon simulé Phase 1 - ${params.size} cas`,
      };

      setCurrentSample(sample);
      return sample;
    },
    []
  );

  // Exécution de test - Simulation Phase 1
  const runTest = useCallback(
    async (sampleParams: SamplingParameters): Promise<ValidationResult> => {
      if (isRunningTest) {
        throw new AlgorithmLabError("Un test est déjà en cours", "TEST_FAILED");
      }

      setIsRunningTest(true);
      setError(null);

      try {
        console.log("Lancement test (simulation Phase 1):", sampleParams);

        // Génération de l'échantillon
        const sample = await generateSample(sampleParams);

        // Simulation du temps de traitement
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Calcul des métriques simulées
        const totalCases = sample.cases.length;
        const correctPredictions = sample.cases.filter(
          (c) => c.manualTag === c.predictedTag
        ).length;

        const accuracy = totalCases > 0 ? correctPredictions / totalCases : 0;

        // Métriques par famille (simulées)
        const families = ["REFLET", "ENGAGEMENT", "EXPLICATION", "OUVERTURE"];
        const metrics: PerformanceMetrics = {
          accuracy,
          precision: Object.fromEntries(
            families.map((f) => [f, 0.7 + Math.random() * 0.3])
          ),
          recall: Object.fromEntries(
            families.map((f) => [f, 0.7 + Math.random() * 0.3])
          ),
          f1Score: Object.fromEntries(
            families.map((f) => [f, 0.7 + Math.random() * 0.3])
          ),
          macroF1: 0.75 + Math.random() * 0.2,
          weightedF1: 0.78 + Math.random() * 0.15,
        };

        // Matrice de confusion simulée
        const confusionMatrix = {
          matrix: [
            [12, 2, 1, 0],
            [3, 14, 1, 2],
            [1, 2, 11, 1],
            [0, 1, 2, 13],
          ],
          labels: families,
        };

        const validationResult: ValidationResult = {
          testId: `test_${Date.now()}`,
          timestamp: new Date(),
          algorithm: currentConfig.name,
          sampleSize: totalCases,
          metrics,
          confusionMatrix,
          errorAnalysis: {
            commonMisclassifications: [
              {
                predicted: "ENGAGEMENT",
                actual: "REFLET",
                count: 3,
                percentage: 15,
                examples: ["case_1", "case_5", "case_12"],
              },
            ],
            difficultCases: sample.cases
              .filter((c) => c.confidence < 0.7)
              .slice(0, 5),
            improvementSuggestions: [
              "Ajuster le seuil de collaboration",
              "Réviser les marqueurs linguistiques d'engagement",
            ],
            errorDistribution: {
              low_confidence: 0.15,
              ambiguous_verbatim: 0.08,
              edge_cases: 0.05,
            },
          },
          executionTime: 2000,
        };

        // Sauvegarder dans l'historique
        testHistoryRef.current.unshift(validationResult);

        // Limiter l'historique à 50 entrées
        if (testHistoryRef.current.length > 50) {
          testHistoryRef.current = testHistoryRef.current.slice(0, 50);
        }

        // Sauvegarder dans localStorage
        try {
          localStorage.setItem(
            "algorithmLab_testHistory",
            JSON.stringify(testHistoryRef.current)
          );
        } catch (e) {
          console.warn("Impossible de sauvegarder l'historique:", e);
        }

        setLastValidationResult(validationResult);
        console.log("Test terminé avec succès:", validationResult);

        return validationResult;
      } catch (err) {
        const error =
          err instanceof AlgorithmLabError
            ? err
            : new AlgorithmLabError(
                "Erreur lors de l'exécution du test",
                "TEST_FAILED"
              );
        setError(error.message);
        throw error;
      } finally {
        setIsRunningTest(false);
      }
    },
    [currentConfig.name, generateSample, isRunningTest]
  );

  // Validation manuelle d'un cas
  const validateCase = useCallback(
    (caseId: string, correctedTag?: string) => {
      if (!currentSample) return;

      const updatedSample = {
        ...currentSample,
        cases: currentSample.cases.map((c) =>
          c.id === caseId
            ? {
                ...c,
                isValidated: true,
                correctedTag: correctedTag || c.predictedTag,
              }
            : c
        ),
      };

      setCurrentSample(updatedSample);
      console.log(`Cas ${caseId} validé:`, correctedTag);
    },
    [currentSample]
  );

  // Réinitialisation de la configuration
  const resetConfig = useCallback(() => {
    setCurrentConfig(DEFAULT_CONFIG);
    setError(null);
    console.log("Configuration réinitialisée");
  }, []);

  // Sauvegarde de configuration
  const saveConfig = useCallback(
    (name: string) => {
      const configId = `config_${Date.now()}`;
      const configToSave = {
        ...currentConfig,
        metadata: {
          ...currentConfig.metadata,
          description: name,
        },
      };

      savedConfigsRef.current.set(configId, configToSave);

      try {
        localStorage.setItem(
          "algorithmLab_savedConfigs",
          JSON.stringify(Array.from(savedConfigsRef.current.entries()))
        );
        console.log(`Configuration "${name}" sauvegardée:`, configId);
      } catch (e) {
        setError("Impossible de sauvegarder la configuration");
        console.error("Erreur sauvegarde:", e);
      }
    },
    [currentConfig]
  );

  // Chargement de configuration
  const loadConfig = useCallback((configId: string) => {
    const config = savedConfigsRef.current.get(configId);
    if (config) {
      setCurrentConfig(config);
      setError(null);
      console.log("Configuration chargée:", configId);
    } else {
      setError("Configuration introuvable");
    }
  }, []);

  // Accès à l'historique
  const getTestHistory = useCallback(() => {
    return [...testHistoryRef.current];
  }, []);

  // Tendance de performance
  const getPerformanceTrend = useCallback(() => {
    return testHistoryRef.current
      .slice(0, 10) // 10 derniers tests
      .reverse()
      .map((result) => ({
        date: result.timestamp,
        accuracy: result.metrics.accuracy * 100,
      }));
  }, []);

  return {
    // État principal
    currentConfig,
    isRunningTest,
    lastValidationResult,
    currentSample,

    // Actions
    updateConfig,
    runTest,
    generateSample,
    validateCase,

    // Utilitaires
    resetConfig,
    saveConfig,
    loadConfig,

    // Métriques et statistiques
    getTestHistory,
    getPerformanceTrend,

    // État de l'interface
    error,
    isInitialized,
  };
};
