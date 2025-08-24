// useRealDataTesting.ts - Version corrigée sans erreurs TypeScript

import { useState, useCallback, useEffect } from "react";
import TurntaggedDataProcessor, {
  ValidationPair,
  ValidationCorpus,
} from "../data/TurnTaggedDataProcessor";
import ValidationEngine, {
  AlgorithmPrediction,
  DualValidationResult,
} from "../validation/ValidationEngine";

// Import des algorithmes existants
import { BasicAlignmentAlgorithm } from "../../../../li-metrics/indicators/FeedbackAlignementIndicator/algorithms/BasicAlignmentAlgorithm";
import { ConversationalPatternAlgorithm } from "../../../../li-metrics/indicators/FeedbackAlignementIndicator/algorithms/ConversationalPatternAlgorithm";

// Types pour le hook
export interface RealTestConfig {
  algorithm: "BasicAlignmentAlgorithm" | "ConversationalPatternAlgorithm";
  testType: "classification" | "prediction" | "both";
  sampleSize: number;
  selectedOrigin?: string | null;
  stratificationBy?: "strategy" | "reaction" | "family";
  filters?: {
    strategies?: string[];
    reactions?: string[];
    families?: string[];
  };
}

export interface TestExecutionState {
  phase:
    | "loading"
    | "preparing"
    | "executing"
    | "validating"
    | "completed"
    | "error";
  progress: number;
  currentStep: string;
  estimatedTimeRemaining: number;
}

export interface UseRealDataTestingReturn {
  corpus: ValidationCorpus | null;
  isDataLoading: boolean;
  dataError: string | null;
  executionState: TestExecutionState;
  testResult: DualValidationResult | null;
  loadCorpus: (filters?: RealTestConfig["filters"]) => Promise<void>;
  executeTest: (config: RealTestConfig) => Promise<DualValidationResult>;
  resetTest: () => void;
  getCorpusStatistics: () => ValidationCorpus["statistics"] | null;
  exportResults: (format: "json" | "csv") => string | null;
}

export const useRealDataTesting = (
  supabaseClient: any,
  selectedOrigin?: string
): UseRealDataTestingReturn => {
  // États principaux
  const [corpus, setCorpus] = useState<ValidationCorpus | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // État d'exécution des tests
  const [executionState, setExecutionState] = useState<TestExecutionState>({
    phase: "loading",
    progress: 0,
    currentStep: "Initialisation",
    estimatedTimeRemaining: 0,
  });

  const [testResult, setTestResult] = useState<DualValidationResult | null>(
    null
  );

  // Instances des processeurs
  const [dataProcessor] = useState(
    () => new TurntaggedDataProcessor(supabaseClient)
  );
  const [validationEngine] = useState(() => new ValidationEngine());

  /**
   * Méthodes d'extraction des résultats d'algorithmes
   */
  const extractReactionFromBasicAlignment = useCallback(
    (results: any, item: any, index: number): string => {
      try {
        const strategy = item.strategy || item.family;
        const strategyResults = results[strategy?.toLowerCase()];

        if (strategyResults && strategyResults.alignmentScore !== undefined) {
          // CORRECTION : Retourner format normalisé (sans "CLIENT")
          if (strategyResults.alignmentScore > 60) return "POSITIF";
          if (strategyResults.alignmentScore < 40) return "NEGATIF";
          return "NEUTRE";
        }

        if (
          results.globalStats &&
          results.globalStats.overallAlignmentScore > 50
        ) {
          return "POSITIF";
        }

        return "NEUTRE";
      } catch (error) {
        console.warn("Erreur extraction réaction BasicAlignment:", error);
        return "NEUTRE";
      }
    },
    []
  );

  const extractConfidenceFromBasicAlignment = useCallback(
    (results: any, item: any, index: number): number => {
      try {
        const strategy = item.strategy || item.family;
        const strategyResults = results[strategy?.toLowerCase()];

        if (strategyResults && strategyResults.alignmentScore !== undefined) {
          return strategyResults.alignmentScore / 100;
        }

        return 0.5;
      } catch (error) {
        return 0.3;
      }
    },
    []
  );

  const extractStrategyFromConversationalPattern = useCallback(
    (results: any, item: any, index: number): string | undefined => {
      try {
        return item.strategy;
      } catch (error) {
        return undefined;
      }
    },
    []
  );

  const extractReactionFromConversationalPattern = useCallback(
    (results: any, item: any, index: number): string => {
      try {
        const strategy = item.strategy || item.family;
        const strategyResults = results[strategy?.toLowerCase()];

        if (strategyResults && strategyResults.alignmentScore !== undefined) {
          // CORRECTION : Retourner format normalisé (sans "CLIENT")
          if (strategyResults.alignmentScore > 65) return "POSITIF";
          if (strategyResults.alignmentScore < 35) return "NEGATIF";
          return "NEUTRE";
        }

        return "NEUTRE";
      } catch (error) {
        console.warn(
          "Erreur extraction réaction ConversationalPattern:",
          error
        );
        return "NEUTRE";
      }
    },
    []
  );

  const extractConfidenceFromConversationalPattern = useCallback(
    (results: any, item: any, index: number): number => {
      try {
        const strategy = item.strategy || item.family;
        const strategyResults = results[strategy?.toLowerCase()];

        if (strategyResults && strategyResults.alignmentScore !== undefined) {
          return Math.min(1.0, (strategyResults.alignmentScore / 100) * 1.2);
        }

        return 0.6;
      } catch (error) {
        return 0.4;
      }
    },
    []
  );

  /**
   * Chargement du corpus de validation depuis turntagged
   */
  const loadCorpus = useCallback(
    async (filters?: RealTestConfig["filters"]) => {
      setIsDataLoading(true);
      setDataError(null);

      try {
        setExecutionState({
          phase: "loading",
          progress: 10,
          currentStep: "Chargement des données turntagged...",
          estimatedTimeRemaining: 3000,
        });

        const loadedCorpus = await dataProcessor.loadValidationCorpus({
          ...filters,
          maxRecords: 2000,
          origine: selectedOrigin,
        });

        if (loadedCorpus.pairs.length === 0) {
          throw new Error(
            "Aucune donnée trouvée avec ces critères de filtrage"
          );
        }

        setCorpus(loadedCorpus);
        setExecutionState({
          phase: "completed",
          progress: 100,
          currentStep: `${loadedCorpus.pairs.length} paires chargées`,
          estimatedTimeRemaining: 0,
        });

        console.log("Corpus chargé:", {
          totalPairs: loadedCorpus.pairs.length,
          strategies: Object.keys(loadedCorpus.statistics.strategiesCounts),
          reactions: Object.keys(loadedCorpus.statistics.reactionsCounts),
          families: Object.keys(loadedCorpus.statistics.familiesCounts),
        });

        // Debug des tags - déplacé dans loadValidationCorpus()
        await debugClientTags(dataProcessor);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setDataError(errorMessage);
        setExecutionState({
          phase: "error",
          progress: 0,
          currentStep: `Erreur: ${errorMessage}`,
          estimatedTimeRemaining: 0,
        });
        console.error("Erreur chargement corpus:", error);
      } finally {
        setIsDataLoading(false);
      }
    },
    [dataProcessor, selectedOrigin]
  );

  /**
   * Fonction de debug pour les tags client
   */
  const debugClientTags = async (processor: TurntaggedDataProcessor) => {
    try {
      console.log("🔍 DEBUG: Échantillon tags next_turn_tag de la base:");
      // Cette fonction sera ajoutée à TurntaggedDataProcessor
      const debugTags = await processor.debugClientTags();
      console.log("Tags trouvés:", debugTags);
    } catch (error) {
      console.warn("Erreur debug tags:", error);
    }
  };

  /**
   * Exécution des algorithmes sur les vraies données
   */
  const executeAlgorithm = useCallback(
    async (
      algorithmName: string,
      inputData: any[]
    ): Promise<AlgorithmPrediction[]> => {
      let AlgorithmClass: any;

      // Instanciation de l'algorithme
      switch (algorithmName) {
        case "BasicAlignmentAlgorithm":
          AlgorithmClass = BasicAlignmentAlgorithm;
          break;
        case "ConversationalPatternAlgorithm":
          AlgorithmClass = ConversationalPatternAlgorithm;
          break;
        default:
          throw new Error(`Algorithme ${algorithmName} non supporté`);
      }

      try {
        const algorithm = new AlgorithmClass(inputData);

        setExecutionState((prev) => ({
          ...prev,
          currentStep: `Exécution ${algorithmName}...`,
          progress: 40,
        }));

        const analysisResults = algorithm.analyzeAlignment();

        // Transformation en format AlgorithmPrediction
        const predictions: AlgorithmPrediction[] = inputData.map(
          (item, index) => {
            let predictedStrategy: string | undefined;
            let predictedReaction: string;
            let confidence: number = 0.5;

            if (algorithmName === "BasicAlignmentAlgorithm") {
              predictedReaction = extractReactionFromBasicAlignment(
                analysisResults,
                item,
                index
              );
              confidence = extractConfidenceFromBasicAlignment(
                analysisResults,
                item,
                index
              );
              predictedStrategy = item.strategy;
            } else if (algorithmName === "ConversationalPatternAlgorithm") {
              predictedStrategy = extractStrategyFromConversationalPattern(
                analysisResults,
                item,
                index
              );
              predictedReaction = extractReactionFromConversationalPattern(
                analysisResults,
                item,
                index
              );
              confidence = extractConfidenceFromConversationalPattern(
                analysisResults,
                item,
                index
              );
            } else {
              predictedReaction = "NEUTRE";
            }

            return {
              id: item.id,
              inputVerbatim: item.verbatim,
              predictedStrategy,
              predictedReaction,
              confidence,
              algorithmUsed: algorithmName,
            };
          }
        );

        return predictions;
      } catch (error) {
        console.error(`Erreur exécution ${algorithmName}:`, error);
        throw error;
      }
    },
    [
      extractReactionFromBasicAlignment,
      extractConfidenceFromBasicAlignment,
      extractStrategyFromConversationalPattern,
      extractReactionFromConversationalPattern,
      extractConfidenceFromConversationalPattern,
    ]
  );

  /**
   * Exécution complète du test de validation
   */
  const executeTest = useCallback(
    async (config: RealTestConfig): Promise<DualValidationResult> => {
      if (!corpus) {
        throw new Error("Corpus non chargé. Appelez loadCorpus() d'abord.");
      }

      try {
        setExecutionState({
          phase: "preparing",
          progress: 20,
          currentStep: "Préparation de l'échantillon...",
          estimatedTimeRemaining: 8000,
        });

        const sampledCorpus = dataProcessor.stratifiedSample(
          corpus,
          config.sampleSize,
          config.stratificationBy || "strategy"
        );

        console.log(
          `Échantillon préparé: ${sampledCorpus.pairs.length} paires`
        );

        const algorithmInput = dataProcessor.prepareAlgorithmInput(
          sampledCorpus.pairs
        );

        setExecutionState({
          phase: "executing",
          progress: 30,
          currentStep: `Exécution ${config.algorithm}...`,
          estimatedTimeRemaining: 6000,
        });

        const predictions = await executeAlgorithm(
          config.algorithm,
          algorithmInput
        );

        setExecutionState({
          phase: "validating",
          progress: 70,
          currentStep: "Validation scientifique...",
          estimatedTimeRemaining: 3000,
        });

        const validationResult = await validationEngine.validateDualPerformance(
          predictions,
          sampledCorpus.pairs,
          config.algorithm
        );

        setExecutionState({
          phase: "completed",
          progress: 100,
          currentStep: "Test terminé avec succès",
          estimatedTimeRemaining: 0,
        });

        setTestResult(validationResult);

        console.log("Test terminé:", {
          algorithm: config.algorithm,
          sampleSize: sampledCorpus.pairs.length,
          classificationAccuracy:
            validationResult.classification.overallMetrics.accuracy,
          predictionAccuracy:
            validationResult.prediction.overallMetrics.accuracy,
        });

        return validationResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur lors du test";
        setExecutionState({
          phase: "error",
          progress: 0,
          currentStep: `Erreur: ${errorMessage}`,
          estimatedTimeRemaining: 0,
        });
        console.error("Erreur lors du test:", error);
        throw error;
      }
    },
    [corpus, dataProcessor, validationEngine, executeAlgorithm]
  );

  const resetTest = useCallback(() => {
    setTestResult(null);
    setExecutionState({
      phase: "loading",
      progress: 0,
      currentStep: "Prêt",
      estimatedTimeRemaining: 0,
    });
  }, []);

  const getCorpusStatistics = useCallback(() => {
    return corpus?.statistics || null;
  }, [corpus]);

  const exportResults = useCallback(
    (format: "json" | "csv"): string | null => {
      if (!testResult) return null;

      if (format === "json") {
        return JSON.stringify(testResult, null, 2);
      }

      if (format === "csv") {
        const headers = ["Test Type", "Accuracy", "Kappa", "F1 Average"];
        const classificationRow = [
          "Classification",
          testResult.classification.overallMetrics.accuracy.toFixed(3),
          testResult.classification.overallMetrics.kappaCohen.toFixed(3),
          (
            Object.values(
              testResult.classification.overallMetrics.f1Score
            ).reduce((a: number, b: number) => a + b, 0) /
            Object.values(testResult.classification.overallMetrics.f1Score)
              .length
          ).toFixed(3),
        ];
        const predictionRow = [
          "Prediction",
          testResult.prediction.overallMetrics.accuracy.toFixed(3),
          testResult.prediction.overallMetrics.kappaCohen.toFixed(3),
          (
            Object.values(testResult.prediction.overallMetrics.f1Score).reduce(
              (a: number, b: number) => a + b,
              0
            ) /
            Object.values(testResult.prediction.overallMetrics.f1Score).length
          ).toFixed(3),
        ];

        return [headers, classificationRow, predictionRow]
          .map((row) => row.join(","))
          .join("\n");
      }

      return null;
    },
    [testResult]
  );

  // Chargement initial
  useEffect(() => {
    loadCorpus();
  }, [loadCorpus]);

  return {
    corpus,
    isDataLoading,
    dataError,
    executionState,
    testResult,
    loadCorpus,
    executeTest,
    resetTest,
    getCorpusStatistics,
    exportResults,
  };
};
