// src/app/(protected)/analysis/components/metrics-framework/hooks/useMetricsEngine.ts

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  metricsRegistry,
  getIndicatorsByDomain,
} from "../core/MetricsRegistry";
import { BaseIndicator } from "../core/BaseIndicator";
import {
  MetricsDomain,
  TurnTaggedData,
  IndicatorResult,
  BenchmarkResult,
  AlgorithmComparison,
  ConvergenceResults,
} from "../core/types/base";
import { useTaggingData } from "@/context/TaggingDataContext";

// Types pour la configuration du moteur
interface MetricsEngineConfig {
  domain: MetricsDomain;
  indicatorIds?: string[];
  algorithmOverrides?: Record<string, string>;
  enableCaching?: boolean;
  enableBenchmarking?: boolean;
  enableRealTimeComparison?: boolean;
  enableConvergenceValidation?: boolean;
}

// Types pour les résultats par famille
interface FamilyResults {
  family: string;
  totalUsage: number;
  indicators: Record<string, IndicatorResult>;
  globalScore: number;
  effectiveness: number;
}

// Types pour les métriques globales
interface GlobalMetrics {
  totalTurns: number;
  averageEffectiveness: number;
  topPerformingFamily: string;
  convergenceStatus?: "CONVERGENT" | "DIVERGENT" | "UNKNOWN";
}

// Résultat principal du hook
interface MetricsEngineResult {
  // État principal
  indicators: BaseIndicator[];
  results: Record<string, IndicatorResult[]>;
  familyResults: FamilyResults[];
  globalMetrics: GlobalMetrics;
  loading: boolean;
  error: string | null;

  // Actions de base
  calculateMetrics: (data?: TurnTaggedData[]) => Promise<void>;
  switchAlgorithm: (indicatorId: string, algorithmId: string) => boolean;
  clearCache: () => void;

  // Analyse par famille
  getResultsByFamily: () => FamilyResults[];
  getGlobalMetrics: () => GlobalMetrics;

  // Comparaison d'algorithmes
  availableAlgorithms: Record<string, string[]>;
  compareAlgorithms: (
    indicatorId: string,
    algorithms: string[]
  ) => Promise<AlgorithmComparison>;

  // Validation de convergence (nouveauté thèse)
  convergenceResults?: ConvergenceResults;
  validateConvergence: () => Promise<ConvergenceResults>;

  // Performance et debugging
  performanceMetrics: {
    lastCalculationTime: number;
    cacheHitRate: number;
    totalCalculations: number;
  };
}

/**
 * Hook principal unifié pour tous les domaines de métriques
 */
export const useMetricsEngine = (
  config: MetricsEngineConfig
): MetricsEngineResult => {
  // État principal
  const [results, setResults] = useState<Record<string, IndicatorResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convergenceResults, setConvergenceResults] =
    useState<ConvergenceResults>();

  // Performance et cache
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lastCalculationTime: 0,
    cacheHitRate: 0,
    totalCalculations: 0,
  });

  // Données depuis le contexte existant
  const { taggedTurns, tags } = useTaggingData();

  // Récupération des indicateurs pour le domaine spécifié
  const indicators = useMemo(() => {
    const domainIndicators = getIndicatorsByDomain(config.domain);

    if (config.indicatorIds) {
      return domainIndicators.filter((indicator) =>
        config.indicatorIds!.includes(indicator.getId())
      );
    }

    return domainIndicators;
  }, [config.domain, config.indicatorIds]);

  // Application des overrides d'algorithmes
  useEffect(() => {
    if (config.algorithmOverrides) {
      Object.entries(config.algorithmOverrides).forEach(
        ([indicatorId, algorithmId]) => {
          const indicator = indicators.find(
            (ind) => ind.getId() === indicatorId
          );
          if (indicator) {
            indicator.switchAlgorithm(algorithmId);
          }
        }
      );
    }
  }, [indicators, config.algorithmOverrides]);

  // Conversion des données existantes vers le format unifié
  const convertedData = useMemo((): TurnTaggedData[] => {
    if (!taggedTurns || taggedTurns.length === 0) return [];

    return taggedTurns.map((turn) => ({
      id: turn.id,
      call_id: turn.call_id,
      start_time: turn.start_time,
      end_time: turn.end_time,
      tag: turn.tag,
      verbatim: turn.verbatim,
      next_turn_verbatim: turn.next_turn_verbatim,
      next_turn_tag: turn.next_turn_tag,
      speaker: turn.speaker,
    }));
  }, [taggedTurns]);

  // Calcul principal des métriques
  const calculateMetrics = useCallback(
    async (customData?: TurnTaggedData[]) => {
      const dataToUse = customData || convertedData;

      if (dataToUse.length === 0) {
        setError("Aucune donnée disponible pour le calcul");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const startTime = performance.now();
        const newResults: Record<string, IndicatorResult[]> = {};

        // Calcul parallèle de tous les indicateurs
        const calculationPromises = indicators.map(async (indicator) => {
          try {
            const indicatorResults = await indicator.calculate(dataToUse);
            return { id: indicator.getId(), results: indicatorResults };
          } catch (error) {
            console.error(`Erreur calcul ${indicator.getId()}:`, error);
            return {
              id: indicator.getId(),
              results: [
                {
                  value: "Erreur",
                  confidence: 0,
                  explanation: `Erreur: ${error.message}`,
                  algorithm_used: "unknown",
                },
              ],
            };
          }
        });

        const calculationResults = await Promise.all(calculationPromises);

        // Agrégation des résultats
        calculationResults.forEach(({ id, results: indicatorResults }) => {
          newResults[id] = indicatorResults;
        });

        setResults(newResults);

        // Mise à jour des métriques de performance
        const endTime = performance.now();
        setPerformanceMetrics((prev) => ({
          lastCalculationTime: endTime - startTime,
          totalCalculations: prev.totalCalculations + 1,
          cacheHitRate: prev.cacheHitRate, // À implémenter avec cache
        }));
      } catch (error) {
        console.error("Erreur calcul métriques:", error);
        setError(error instanceof Error ? error.message : "Erreur de calcul");
      } finally {
        setLoading(false);
      }
    },
    [indicators, convertedData]
  );

  // Calcul des résultats par famille
  const familyResults = useMemo((): FamilyResults[] => {
    if (!tags || Object.keys(results).length === 0) return [];

    // Grouper les données par famille
    const familyGroups = convertedData.reduce((acc, turn) => {
      const tag = tags.find((t) => t.label === turn.tag);
      const family = tag?.family || "AUTRE";

      if (!acc[family]) acc[family] = [];
      acc[family].push(turn);
      return acc;
    }, {} as Record<string, TurnTaggedData[]>);

    return Object.entries(familyGroups)
      .map(([family, turns]) => {
        const familyIndicators: Record<string, IndicatorResult> = {};
        let totalScore = 0;
        let validScores = 0;

        // Calculer les indicateurs pour cette famille
        Object.entries(results).forEach(([indicatorId, indicatorResults]) => {
          // Filtrer les résultats pour cette famille
          const familySpecificResults = indicatorResults.filter((_, index) => {
            const turn = convertedData[index];
            const tag = tags.find((t) => t.label === turn?.tag);
            return tag?.family === family;
          });

          if (familySpecificResults.length > 0) {
            // Agrégation des résultats (moyenne ou logique spécifique)
            const avgValue =
              familySpecificResults.reduce((sum, result) => {
                const numValue =
                  typeof result.value === "number" ? result.value : 0;
                return sum + numValue;
              }, 0) / familySpecificResults.length;

            familyIndicators[indicatorId] = {
              value: avgValue,
              confidence:
                familySpecificResults.reduce(
                  (sum, r) => sum + r.confidence,
                  0
                ) / familySpecificResults.length,
              explanation: `Moyenne famille ${family}: ${avgValue.toFixed(2)}`,
              algorithm_used:
                familySpecificResults[0]?.algorithm_used || "unknown",
            };

            totalScore += avgValue;
            validScores++;
          }
        });

        const globalScore = validScores > 0 ? totalScore / validScores : 0;

        return {
          family,
          totalUsage: turns.length,
          indicators: familyIndicators,
          globalScore,
          effectiveness: calculateFamilyEffectiveness(turns, familyIndicators),
        };
      })
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }, [results, convertedData, tags]);

  // Métriques globales
  const globalMetrics = useMemo((): GlobalMetrics => {
    if (familyResults.length === 0) {
      return {
        totalTurns: 0,
        averageEffectiveness: 0,
        topPerformingFamily: "",
        convergenceStatus: "UNKNOWN",
      };
    }

    const totalTurns = familyResults.reduce(
      (sum, family) => sum + family.totalUsage,
      0
    );
    const averageEffectiveness =
      familyResults.reduce((sum, family) => sum + family.effectiveness, 0) /
      familyResults.length;
    const topPerformingFamily = familyResults.reduce((best, current) =>
      current.effectiveness > best.effectiveness ? current : best
    ).family;

    return {
      totalTurns,
      averageEffectiveness,
      topPerformingFamily,
      convergenceStatus: convergenceResults?.validation_status || "UNKNOWN",
    };
  }, [familyResults, convergenceResults]);

  // Commutation d'algorithme
  const switchAlgorithm = useCallback(
    (indicatorId: string, algorithmId: string): boolean => {
      const indicator = indicators.find((ind) => ind.getId() === indicatorId);
      if (indicator) {
        const success = indicator.switchAlgorithm(algorithmId);
        if (success && config.enableRealTimeComparison) {
          // Recalculer automatiquement avec le nouvel algorithme
          calculateMetrics();
        }
        return success;
      }
      return false;
    },
    [indicators, calculateMetrics, config.enableRealTimeComparison]
  );

  // Algorithmes disponibles par indicateur
  const availableAlgorithms = useMemo(() => {
    const algorithmsMap: Record<string, string[]> = {};

    indicators.forEach((indicator) => {
      algorithmsMap[indicator.getId()] = indicator
        .getAvailableAlgorithms()
        .map((alg) => alg.id);
    });

    return algorithmsMap;
  }, [indicators]);

  // Comparaison d'algorithmes
  const compareAlgorithms = useCallback(
    async (
      indicatorId: string,
      algorithms: string[]
    ): Promise<AlgorithmComparison> => {
      const indicator = indicators.find((ind) => ind.getId() === indicatorId);
      if (!indicator) {
        throw new Error(`Indicateur ${indicatorId} non trouvé`);
      }

      const originalAlgorithm = indicator.getActiveAlgorithm()?.getId();
      const comparisonResults: Record<string, IndicatorResult[]> = {};
      const benchmarkResults: Record<string, BenchmarkResult> = {};

      try {
        // Tester chaque algorithme
        for (const algorithmId of algorithms) {
          const startTime = performance.now();

          // Changer d'algorithme
          const switched = indicator.switchAlgorithm(algorithmId);
          if (!switched) {
            console.warn(
              `Impossible de basculer vers l'algorithme ${algorithmId}`
            );
            continue;
          }

          // Calculer avec cet algorithme
          const results = await indicator.calculate(convertedData);
          comparisonResults[algorithmId] = results;

          const endTime = performance.now();

          // Métriques de benchmark basiques
          benchmarkResults[algorithmId] = {
            algorithm_id: algorithmId,
            accuracy: calculateAlgorithmAccuracy(results),
            precision: calculateAlgorithmPrecision(results),
            recall: calculateAlgorithmRecall(results),
            f1_score: calculateF1Score(results),
            processing_time_ms: endTime - startTime,
            test_data_size: convertedData.length,
          };
        }

        // Restaurer l'algorithme original
        if (originalAlgorithm) {
          indicator.switchAlgorithm(originalAlgorithm);
        }

        // Analyser et recommander
        const recommendation =
          generateAlgorithmRecommendation(benchmarkResults);

        return {
          indicator_id: indicatorId,
          algorithms,
          results: comparisonResults,
          benchmark: benchmarkResults,
          recommendation,
        };
      } catch (error) {
        // Restaurer l'algorithme original en cas d'erreur
        if (originalAlgorithm) {
          indicator.switchAlgorithm(originalAlgorithm);
        }
        throw error;
      }
    },
    [indicators, convertedData]
  );

  // Validation de convergence multi-niveaux (nouveauté thèse)
  const validateConvergence =
    useCallback(async (): Promise<ConvergenceResults> => {
      if (!config.enableConvergenceValidation) {
        throw new Error("Validation de convergence non activée");
      }

      try {
        setLoading(true);

        // Calculer les métriques pour chaque niveau d'analyse
        const acResults = await calculateACMetrics(familyResults);
        const liResults = await calculateLIMetrics(familyResults);
        const cognitiveResults = await calculateCognitiveMetrics(familyResults);

        // Analyse de convergence
        const convergence = analyzeConvergence(
          acResults,
          liResults,
          cognitiveResults
        );

        setConvergenceResults(convergence);
        return convergence;
      } catch (error) {
        console.error("Erreur validation convergence:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    }, [config.enableConvergenceValidation, familyResults]);

  // Cache management
  const clearCache = useCallback(() => {
    setResults({});
    setConvergenceResults(undefined);
    setPerformanceMetrics((prev) => ({
      ...prev,
      cacheHitRate: 0,
    }));
  }, []);

  // Helpers pour résultats par famille
  const getResultsByFamily = useCallback(() => familyResults, [familyResults]);
  const getGlobalMetrics = useCallback(() => globalMetrics, [globalMetrics]);

  // Effet initial pour calculer les métriques
  useEffect(() => {
    if (convertedData.length > 0 && indicators.length > 0) {
      calculateMetrics();
    }
  }, [convertedData, indicators]); // Calculer automatiquement quand les données changent

  return {
    // État principal
    indicators,
    results,
    familyResults,
    globalMetrics,
    loading,
    error,

    // Actions de base
    calculateMetrics,
    switchAlgorithm,
    clearCache,

    // Analyse par famille
    getResultsByFamily,
    getGlobalMetrics,

    // Comparaison d'algorithmes
    availableAlgorithms,
    compareAlgorithms,

    // Validation de convergence
    convergenceResults,
    validateConvergence,

    // Performance
    performanceMetrics,
  };
};

// ================ FONCTIONS UTILITAIRES ================

/**
 * Calcule l'efficacité d'une famille basée sur ses tours et indicateurs
 */
function calculateFamilyEffectiveness(
  turns: TurnTaggedData[],
  indicators: Record<string, IndicatorResult>
): number {
  if (Object.keys(indicators).length === 0) return 0;

  // Logique d'agrégation des indicateurs en score d'efficacité
  const scores = Object.values(indicators).map((indicator) => {
    if (typeof indicator.value === "number") {
      return indicator.value * indicator.confidence;
    }
    return 0;
  });

  return scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
}

/**
 * Calcule la précision d'un algorithme (placeholder)
 */
function calculateAlgorithmAccuracy(results: IndicatorResult[]): number {
  // Implémentation basique - à enrichir avec annotations expertes
  const validResults = results.filter(
    (r) => typeof r.value === "number" && r.confidence > 0.5
  );
  return validResults.length / results.length;
}

function calculateAlgorithmPrecision(results: IndicatorResult[]): number {
  // Placeholder - nécessiterait des annotations expertes pour calcul réel
  return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
}

function calculateAlgorithmRecall(results: IndicatorResult[]): number {
  // Placeholder - nécessiterait ground truth
  return 0.8; // Valeur par défaut
}

function calculateF1Score(results: IndicatorResult[]): number {
  const precision = calculateAlgorithmPrecision(results);
  const recall = calculateAlgorithmRecall(results);
  return precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;
}

/**
 * Génère des recommandations d'algorithmes basées sur les benchmarks
 */
function generateAlgorithmRecommendation(
  benchmarks: Record<string, BenchmarkResult>
): {
  best_accuracy: string;
  best_speed: string;
  best_overall: string;
  reasoning: string;
} {
  const algorithms = Object.entries(benchmarks);

  if (algorithms.length === 0) {
    return {
      best_accuracy: "",
      best_speed: "",
      best_overall: "",
      reasoning: "Aucun algorithme testé",
    };
  }

  const bestAccuracy = algorithms.reduce((best, [id, metrics]) =>
    metrics.accuracy > best[1].accuracy ? [id, metrics] : best
  );

  const bestSpeed = algorithms.reduce((best, [id, metrics]) =>
    metrics.processing_time_ms < best[1].processing_time_ms
      ? [id, metrics]
      : best
  );

  // Score global = pondération accuracy (70%) + speed (30%)
  const bestOverall = algorithms.reduce((best, [id, metrics]) => {
    const score =
      metrics.accuracy * 0.7 + (1 - metrics.processing_time_ms / 1000) * 0.3;
    const bestScore =
      best[1].accuracy * 0.7 + (1 - best[1].processing_time_ms / 1000) * 0.3;
    return score > bestScore ? [id, metrics] : best;
  });

  return {
    best_accuracy: bestAccuracy[0],
    best_speed: bestSpeed[0],
    best_overall: bestOverall[0],
    reasoning:
      `Recommandation basée sur ${algorithms.length} algorithmes testés. ` +
      `Meilleure précision: ${(bestAccuracy[1].accuracy * 100).toFixed(1)}%, ` +
      `plus rapide: ${bestSpeed[1].processing_time_ms.toFixed(0)}ms`,
  };
}

// ================ FONCTIONS DE CONVERGENCE (NOUVEAUTÉ THÈSE) ================

/**
 * Calcule les métriques AC pour validation convergence
 */
async function calculateACMetrics(
  familyResults: FamilyResults[]
): Promise<Record<string, number>> {
  // Placeholder - à implémenter avec métriques empiriques
  return familyResults.reduce((acc, family) => {
    acc[family.family] = family.effectiveness;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calcule les métriques LI pour validation convergence
 */
async function calculateLIMetrics(
  familyResults: FamilyResults[]
): Promise<Record<string, number>> {
  // Placeholder - à implémenter avec common ground, feedback, etc.
  return familyResults.reduce((acc, family) => {
    // Approximation basée sur les indicateurs disponibles
    const liScore = family.globalScore * 0.8; // Ajustement LI
    acc[family.family] = liScore;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calcule les métriques Cognitives pour validation convergence
 */
async function calculateCognitiveMetrics(
  familyResults: FamilyResults[]
): Promise<Record<string, number>> {
  // Utilise les résultats cognitifs existants
  return familyResults.reduce((acc, family) => {
    acc[family.family] = family.globalScore;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Analyse la convergence entre les trois niveaux
 */
function analyzeConvergence(
  acResults: Record<string, number>,
  liResults: Record<string, number>,
  cognitiveResults: Record<string, number>
): ConvergenceResults {
  const families = Object.keys(acResults);

  // Calcul des classements
  const acRanking = families.sort((a, b) => acResults[b] - acResults[a]);
  const liRanking = families.sort((a, b) => liResults[b] - liResults[a]);
  const cognitiveRanking = families.sort(
    (a, b) => cognitiveResults[b] - cognitiveResults[a]
  );

  // Calcul des corrélations (approximation)
  const correlationACLI = calculateSpearmanCorrelation(
    families.map((f) => acResults[f]),
    families.map((f) => liResults[f])
  );

  const correlationACCognitive = calculateSpearmanCorrelation(
    families.map((f) => acResults[f]),
    families.map((f) => cognitiveResults[f])
  );

  const correlationLICognitive = calculateSpearmanCorrelation(
    families.map((f) => liResults[f]),
    families.map((f) => cognitiveResults[f])
  );

  const overallConsistency =
    (correlationACLI + correlationACCognitive + correlationLICognitive) / 3;

  // Déterminer le statut de convergence
  const convergenceThreshold = 0.6;
  const validationStatus =
    overallConsistency > convergenceThreshold ? "CONVERGENT" : "DIVERGENT";

  // Préparation des résultats par famille
  const familyResultsMap = families.reduce((acc, family) => {
    acc[family] = {
      strategy_family: family,
      ac_effectiveness: acResults[family],
      li_effectiveness: liResults[family],
      cognitive_effectiveness: cognitiveResults[family],
      sample_size: 100, // Placeholder
    };
    return acc;
  }, {} as Record<string, any>);

  return {
    validation_status: validationStatus,
    family_results: familyResultsMap,
    consistency_tests: {
      rankings: {
        AC: acRanking,
        LI: liRanking,
        Cognitive: cognitiveRanking,
      },
      concordance: {
        AC_LI: { tau: correlationACLI, p_value: 0.05 }, // Placeholder
        AC_Cognitive: { tau: correlationACCognitive, p_value: 0.05 },
        LI_Cognitive: { tau: correlationLICognitive, p_value: 0.05 },
      },
      overall_consistency: overallConsistency,
    },
    hypothesis_tests: {
      H1_validation: validateH1Hypothesis(acResults, liResults),
      H2_validation: validateH2Hypothesis(acResults, cognitiveResults),
      H3_validation: validateH3Hypothesis(
        acResults,
        liResults,
        cognitiveResults
      ),
    },
  };
}

/**
 * Calcul approximatif de corrélation de Spearman
 */
function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  // Calcul de corrélation de Pearson comme approximation
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
  );

  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Validation des hypothèses spécifiques de la thèse
 */
function validateH1Hypothesis(
  acResults: Record<string, number>,
  liResults: Record<string, number>
): boolean {
  // H1: Stratégies d'action → fluidité élevée
  const actionStrategies = ["ENGAGEMENT", "OUVERTURE"];
  const actionEffectiveness = actionStrategies
    .filter((strategy) => acResults[strategy] !== undefined)
    .map((strategy) => acResults[strategy]);

  const avgActionEffectiveness =
    actionEffectiveness.reduce((sum, eff) => sum + eff, 0) /
    actionEffectiveness.length;
  return avgActionEffectiveness > 0.6; // Seuil arbitraire
}

function validateH2Hypothesis(
  acResults: Record<string, number>,
  cognitiveResults: Record<string, number>
): boolean {
  // H2: Explications → charge élevée
  const explicationEffectiveness = acResults["EXPLICATION"] || 0;
  const explicationCognitiveLoad = 1 - (cognitiveResults["EXPLICATION"] || 0); // Inversé car charge = inefficacité

  return explicationEffectiveness < 0.5 && explicationCognitiveLoad > 0.5;
}

function validateH3Hypothesis(
  acResults: Record<string, number>,
  liResults: Record<string, number>,
  cognitiveResults: Record<string, number>
): boolean {
  // H3: Modulation contextuelle - différences entre familles
  const families = Object.keys(acResults);
  if (families.length < 2) return false;

  const differences = families.map((family) =>
    Math.abs(acResults[family] - cognitiveResults[family])
  );

  const avgDifference =
    differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  return avgDifference > 0.2; // Seuil de variabilité contextuelle
}
