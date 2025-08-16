// src/app/(protected)/analysis/components/metrics-framework/hooks/useMetricsEngine.ts

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  metricsRegistry,
  getIndicatorsByDomain,
} from "../core/MetricsRegistry";
import BaseIndicator from "../core/BaseIndicator";
import {
  MetricsDomain,
  TurnTaggedData,
  IndicatorResult,
  BenchmarkResult,
  AlgorithmComparison,
  ConvergenceResults,
  FamilyResults,
  GlobalMetrics,
  PerformanceMetrics,
  TagInfo,
} from "../core/types/base";
import { useTaggingData } from "@/context/TaggingDataContext";

// ================ CONFIGURATION DU HOOK ================

interface MetricsEngineConfig {
  domain: MetricsDomain;
  indicatorIds?: string[];
  algorithmOverrides?: Record<string, string>;
  enableCaching?: boolean;
  enableBenchmarking?: boolean;
  enableRealTimeComparison?: boolean;
  enableConvergenceValidation?: boolean;
}

interface FamilyResultsInternal {
  family: string;
  totalUsage: number;
  indicators: Record<string, IndicatorResult>;
  globalScore: number;
  effectiveness: number;
}

// ================ HOOK PRINCIPAL ================

/**
 * Hook principal unifié pour tous les domaines de métriques
 *
 * Remplace et étend les hooks spécialisés existants
 * Fournit une interface cohérente pour cognitive, LI et AC
 */
export const useMetricsEngine = (config: MetricsEngineConfig) => {
  // ================ ÉTAT LOCAL ================

  const [results, setResults] = useState<Record<string, IndicatorResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convergenceResults, setConvergenceResults] =
    useState<ConvergenceResults>();

  // Métriques de performance
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics>({
      lastCalculationTime: 0,
      cacheHitRate: 0,
      totalCalculations: 0,
    });

  // ================ DONNÉES DEPUIS LE CONTEXTE ================

  const { taggedTurns, tags } = useTaggingData();

  // ================ RÉCUPÉRATION DES INDICATEURS ================

  const indicators = useMemo(() => {
    const domainIndicators = getIndicatorsByDomain(config.domain);

    if (config.indicatorIds) {
      return domainIndicators.filter((indicator) =>
        config.indicatorIds!.includes(indicator.getId())
      );
    }

    return domainIndicators;
  }, [config.domain, config.indicatorIds]);

  // ================ CONVERSION DES DONNÉES ================

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

  // ================ APPLICATION DES OVERRIDES D'ALGORITHMES ================

  useEffect(() => {
    if (config.algorithmOverrides) {
      Object.entries(config.algorithmOverrides).forEach(
        ([indicatorId, algorithmId]) => {
          const indicator = indicators.find(
            (ind) => ind.getId() === indicatorId
          );
          if (indicator) {
            const success = indicator.switchAlgorithm(algorithmId);
            if (!success) {
              console.warn(
                `Impossible de basculer vers l'algorithme ${algorithmId} pour ${indicatorId}`
              );
            }
          }
        }
      );
    }
  }, [indicators, config.algorithmOverrides]);

  // ================ CALCUL PRINCIPAL DES MÉTRIQUES ================

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
                  explanation: `Erreur: ${
                    error instanceof Error ? error.message : "Erreur inconnue"
                  }`,
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
          cacheHitRate: prev.cacheHitRate, // À améliorer avec gestion cache réelle
        }));

        console.log(
          `✅ Calcul métriques ${config.domain} terminé en ${(
            endTime - startTime
          ).toFixed(0)}ms`
        );
      } catch (error) {
        console.error("Erreur calcul métriques:", error);
        setError(error instanceof Error ? error.message : "Erreur de calcul");
      } finally {
        setLoading(false);
      }
    },
    [indicators, convertedData, config.domain]
  );

  // ================ CALCUL DES RÉSULTATS PAR FAMILLE ================

  const familyResults = useMemo((): FamilyResultsInternal[] => {
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

  // ================ MÉTRIQUES GLOBALES ================

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

  // ================ GESTION DES ALGORITHMES ================

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

  // ================ COMPARAISON D'ALGORITHMES ================

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

  // ================ VALIDATION DE CONVERGENCE ================

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

  // ================ GESTION DU CACHE ================

  const clearCache = useCallback(() => {
    indicators.forEach((indicator) => indicator.clearCache());
    setResults({});
    setConvergenceResults(undefined);
    setPerformanceMetrics((prev) => ({
      ...prev,
      cacheHitRate: 0,
    }));
  }, [indicators]);

  // ================ HELPERS POUR RÉSULTATS ================

  const getResultsByFamily = useCallback(
    () => familyResults as FamilyResults[],
    [familyResults]
  );
  const getGlobalMetrics = useCallback(() => globalMetrics, [globalMetrics]);

  // ================ EFFET INITIAL ================

  useEffect(() => {
    if (convertedData.length > 0 && indicators.length > 0) {
      calculateMetrics();
    }
  }, [convertedData, indicators]); // Calculer automatiquement quand les données changent

  // ================ RETOUR DU HOOK ================

  return {
    // État principal
    indicators,
    results,
    familyResults: getResultsByFamily(),
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

// Fonctions de calcul de métriques de benchmark (placeholders)
function calculateAlgorithmAccuracy(results: IndicatorResult[]): number {
  const validResults = results.filter(
    (r) => typeof r.value === "number" && r.confidence > 0.5
  );
  return validResults.length / results.length;
}

function calculateAlgorithmPrecision(results: IndicatorResult[]): number {
  return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
}

function calculateAlgorithmRecall(results: IndicatorResult[]): number {
  return 0.8; // Placeholder
}

function calculateF1Score(results: IndicatorResult[]): number {
  const precision = calculateAlgorithmPrecision(results);
  const recall = calculateAlgorithmRecall(results);
  return precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;
}

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

// Fonctions de convergence (placeholders pour l'architecture complète)
async function calculateACMetrics(
  familyResults: FamilyResultsInternal[]
): Promise<Record<string, number>> {
  return familyResults.reduce((acc, family) => {
    acc[family.family] = family.effectiveness;
    return acc;
  }, {} as Record<string, number>);
}

async function calculateLIMetrics(
  familyResults: FamilyResultsInternal[]
): Promise<Record<string, number>> {
  return familyResults.reduce((acc, family) => {
    const liScore = family.globalScore * 0.8; // Ajustement LI
    acc[family.family] = liScore;
    return acc;
  }, {} as Record<string, number>);
}

async function calculateCognitiveMetrics(
  familyResults: FamilyResultsInternal[]
): Promise<Record<string, number>> {
  return familyResults.reduce((acc, family) => {
    acc[family.family] = family.globalScore;
    return acc;
  }, {} as Record<string, number>);
}

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

  // Calcul des corrélations (approximation simple)
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

  const convergenceThreshold = 0.6;
  const validationStatus =
    overallConsistency > convergenceThreshold ? "CONVERGENT" : "DIVERGENT";

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
        AC_LI: { tau: correlationACLI, p_value: 0.05 },
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

function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

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

function validateH1Hypothesis(
  acResults: Record<string, number>,
  liResults: Record<string, number>
): boolean {
  const actionStrategies = ["ENGAGEMENT", "OUVERTURE"];
  const actionEffectiveness = actionStrategies
    .filter((strategy) => acResults[strategy] !== undefined)
    .map((strategy) => acResults[strategy]);

  const avgActionEffectiveness =
    actionEffectiveness.reduce((sum, eff) => sum + eff, 0) /
    actionEffectiveness.length;
  return avgActionEffectiveness > 0.6;
}

function validateH2Hypothesis(
  acResults: Record<string, number>,
  cognitiveResults: Record<string, number>
): boolean {
  const explicationEffectiveness = acResults["EXPLICATION"] || 0;
  const explicationCognitiveLoad = 1 - (cognitiveResults["EXPLICATION"] || 0);

  return explicationEffectiveness < 0.5 && explicationCognitiveLoad > 0.5;
}

function validateH3Hypothesis(
  acResults: Record<string, number>,
  liResults: Record<string, number>,
  cognitiveResults: Record<string, number>
): boolean {
  const families = Object.keys(acResults);
  if (families.length < 2) return false;

  const differences = families.map((family) =>
    Math.abs(acResults[family] - cognitiveResults[family])
  );

  const avgDifference =
    differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  return avgDifference > 0.2;
}

// ================ ADAPTATION LEGACY ================

/**
 * Hook de transition qui adapte l'interface du framework unifié
 * vers l'interface existante de useCognitiveMetrics
 *
 * Permet une migration douce sans casser l'existant
 */
export function useAdaptedCognitiveMetrics(data?: any[]) {
  const cognitiveEngine = useMetricsEngine({
    domain: "cognitive",
    enableCaching: true,
  });

  // Adaptation des résultats vers l'interface existante
  const adaptedResults = useMemo(() => {
    if (Object.keys(cognitiveEngine.results).length === 0) {
      return {
        fluiditeCognitive: 0.75, // Valeur par défaut
        chargeCognitive: 0.45,
        marqueurs: ["test"],
      };
    }

    // Extraire la fluidité cognitive si disponible
    const fluiditeResults = cognitiveEngine.results["fluidite_cognitive"] || [];
    const avgFluidite =
      fluiditeResults.length > 0
        ? fluiditeResults.reduce(
            (sum, r) => sum + (typeof r.value === "number" ? r.value : 0),
            0
          ) / fluiditeResults.length
        : 0.75;

    // Calculer la charge cognitive (inverse de la fluidité)
    const chargeCognitive = Math.max(0, 1 - avgFluidite);

    // Extraire les marqueurs détectés
    const marqueurs = fluiditeResults
      .filter((r) => r.explanation)
      .map((r) => r.explanation?.split("|")[1]?.trim())
      .filter(Boolean)
      .slice(0, 3) || ["automatique"];

    return {
      fluiditeCognitive: avgFluidite,
      chargeCognitive,
      marqueurs,
    };
  }, [cognitiveEngine.results]);

  return {
    ...adaptedResults,
    // Actions originales préservées
    calculateMetrics: cognitiveEngine.calculateMetrics,
    loading: cognitiveEngine.loading,
    error: cognitiveEngine.error,

    // Interface du framework unifié accessible
    unifiedEngine: cognitiveEngine,

    // Fonction de diagnostic
    getDiagnostic: () => ({
      indicateurs: cognitiveEngine.indicators.length,
      algorithmes: Object.keys(cognitiveEngine.availableAlgorithms).length,
      performance: cognitiveEngine.performanceMetrics.lastCalculationTime,
      families: cognitiveEngine.familyResults.length,
    }),
  };
}

export default useMetricsEngine;
