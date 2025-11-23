// src/app/(protected)/analysis/components/cognitive-metrics/indicators/FluiditeCognitiveIndicator/hooks/useFluiditeCognitive.ts

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";

// Import de l'indicateur factorisé
import {
  FluiditeCognitiveIndicator,
  FluidityCognitiveResult,
  FamilyFluiditeMetrics,
} from "../FluiditeCognitiveIndicator";

// Types pour le hook
interface FluiditeHookConfig {
  algorithmId?: string;
  enableCaching?: boolean;
  enableBenchmarking?: boolean;
  familyFilters?: string[];
}

interface FluiditeHookResult {
  // Résultats
  familyResults: FamilyFluiditeMetrics[];
  rawResults: Record<string, FluidityCognitiveResult[]>;

  // État
  loading: boolean;
  error: string | null;
  lastCalculationTime: number;

  // Configuration
  availableAlgorithms: Array<{
    id: string;
    name: string;
    description: string;
    version: string;
  }>;
  activeAlgorithm: string;

  // Actions
  switchAlgorithm: (algorithmId: string) => Promise<boolean>;
  recalculate: () => Promise<void>;
  benchmarkAlgorithms: () => Promise<any>;

  // Statistiques globales
  globalStats: {
    totalFamilies: number;
    totalInteractions: number;
    bestFamily: string;
    averageGlobalScore: number;
  };
}

/**
 * Hook principal pour la Fluidité Cognitive utilisant l'architecture BaseIndicator
 */
export const useFluiditeCognitive = (
  config: FluiditeHookConfig = {}
): FluiditeHookResult => {
  // Configuration par défaut
  const {
    algorithmId = "basic_fluidity",
    enableCaching = true,
    enableBenchmarking = false,
    familyFilters = [],
  } = config;

  // État local
  const [indicator] = useState(() => new FluiditeCognitiveIndicator());
  const [results, setResults] = useState<
    Record<string, FluidityCognitiveResult[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculationTime, setLastCalculationTime] = useState(0);

  // Données depuis le contexte
  const { taggedTurns, tags } = useTaggingData();

  // Configuration de l'algorithme initial
  useEffect(() => {
    if (indicator) {
      indicator.switchAlgorithm(algorithmId);
    }
  }, [indicator, algorithmId]);

  // Conversion des données au format requis
  const convertedData = useMemo(() => {
    if (!taggedTurns || taggedTurns.length === 0) return [];

    return taggedTurns
      .filter((turn) => {
        // Filtrer seulement les stratégies conseiller
        const tag = tags.find((t) => t.label === turn.tag);
        return (
          tag?.originespeaker === "conseiller" &&
          turn.next_turn_verbatim?.trim()
        );
      })
      .map((turn) => ({
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
  }, [taggedTurns, tags]);

  // Groupement par famille
  const familyGroups = useMemo(() => {
    if (!convertedData.length || !tags.length) return {};

    const groups: Record<string, typeof convertedData> = {};

    convertedData.forEach((turn) => {
      const tag = tags.find((t) => t.label === turn.tag);
      const family = tag?.family || "AUTRE";

      // Appliquer les filtres de famille si spécifiés
      if (familyFilters.length > 0 && !familyFilters.includes(family)) {
        return;
      }

      if (!groups[family]) groups[family] = [];
      groups[family].push(turn);
    });

    return groups;
  }, [convertedData, tags, familyFilters]);

  // Algorithmes disponibles
  const availableAlgorithms = useMemo(() => {
    if (!indicator) return [];

    return indicator.getAvailableAlgorithms().map((config) => ({
      id: config.id,
      name: config.name,
      description: config.description,
      version: config.version,
    }));
  }, [indicator]);

  // Algorithme actif
  const activeAlgorithm = useMemo(() => {
    return indicator?.getActiveAlgorithm()?.getId() || "unknown";
  }, [indicator]);

  // Fonction de calcul principal
  const calculateMetrics = useCallback(async () => {
    if (!indicator || Object.keys(familyGroups).length === 0) {
      setResults({});
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      console.log(`🧠 Calcul fluidité cognitive avec ${activeAlgorithm}`);
      console.log(`📊 ${Object.keys(familyGroups).length} familles à analyser`);

      const newResults: Record<string, FluidityCognitiveResult[]> = {};

      // Calculer pour chaque famille
      for (const [family, familyData] of Object.entries(familyGroups)) {
        console.log(`📈 Calcul famille ${family}: ${familyData.length} tours`);

        const familyResults = (await indicator.calculate(
          familyData
        )) as FluidityCognitiveResult[];
        newResults[family] = familyResults;
      }

      setResults(newResults);
      setLastCalculationTime(performance.now() - startTime);

      console.log(
        `✅ Calcul terminé en ${(performance.now() - startTime).toFixed(0)}ms`
      );
      console.log(`📊 Familles calculées:`, Object.keys(newResults));
    } catch (err) {
      console.error("❌ Erreur calcul fluidité:", err);
      setError(err instanceof Error ? err.message : "Erreur de calcul");
    } finally {
      setLoading(false);
    }
  }, [indicator, familyGroups, activeAlgorithm]);

  // Déclencher le calcul automatiquement
  useEffect(() => {
    if (Object.keys(familyGroups).length > 0) {
      calculateMetrics();
    }
  }, [calculateMetrics]);

  // Action : Changer d'algorithme
  const switchAlgorithm = useCallback(
    async (newAlgorithmId: string): Promise<boolean> => {
      if (!indicator) return false;

      try {
        setLoading(true);
        const success = indicator.switchAlgorithm(newAlgorithmId);

        if (success) {
          console.log(`🔄 Algorithme changé vers: ${newAlgorithmId}`);
          await calculateMetrics(); // Recalculer avec le nouvel algorithme
        }

        return success;
      } catch (error) {
        console.error("Erreur changement algorithme:", error);
        setError("Erreur lors du changement d'algorithme");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [indicator, calculateMetrics]
  );

  // Action : Benchmark des algorithmes
  const benchmarkAlgorithms = useCallback(async () => {
    if (!indicator || !enableBenchmarking) {
      console.warn("Benchmarking non activé ou indicateur indisponible");
      return null;
    }

    try {
      setLoading(true);
      console.log("🔬 Début benchmark algorithmes...");

      // Utiliser un échantillon des données pour le benchmark
      const sampleData = convertedData.slice(0, 100); // Échantillon de 100 tours
      const mockAnnotations: any[] = []; // À remplacer par vraies annotations

      const benchmarkResult = await indicator.benchmarkAlgorithmsAdvanced(
        sampleData,
        mockAnnotations
      );

      console.log("📊 Résultats benchmark:", benchmarkResult);
      return benchmarkResult;
    } catch (error) {
      console.error("❌ Erreur benchmark:", error);
      setError("Erreur lors du benchmark");
      return null;
    } finally {
      setLoading(false);
    }
  }, [indicator, convertedData, enableBenchmarking]);

  // Conversion des résultats vers le format attendu par l'interface
  const familyResults = useMemo((): FamilyFluiditeMetrics[] => {
    if (Object.keys(results).length === 0) return [];

    return Object.entries(results)
      .map(([family, familyResults]) => {
        const familyData = familyGroups[family] || [];
        const scores = familyResults.map((r) => r.value);
        const types = familyResults.map((r) => r.details.processing_type);

        const averageScore =
          scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

        // Distribution des types
        const automatique =
          types.length > 0
            ? (types.filter((t) => t === "automatique").length / types.length) *
              100
            : 0;
        const controle =
          types.length > 0
            ? (types.filter((t) => t === "contrôlé").length / types.length) *
              100
            : 0;
        const mixte =
          types.length > 0
            ? (types.filter((t) => t === "mixte").length / types.length) * 100
            : 0;

        // Exemples
        const bestIndex = scores.indexOf(bestScore);
        const worstIndex = scores.indexOf(worstScore);

        return {
          family,
          totalUsage: familyData.length,
          averageScore,
          scoreDistribution: { automatique, controle, mixte },
          bestScore,
          worstScore,
          examples: {
            best: {
              verbatim:
                familyData[bestIndex]?.verbatim?.substring(0, 80) + "..." ||
                "N/A",
              score: bestScore,
              type:
                familyResults[bestIndex]?.details.processing_type || "inconnu",
            },
            worst: {
              verbatim:
                familyData[worstIndex]?.verbatim?.substring(0, 80) + "..." ||
                "N/A",
              score: worstScore,
              type:
                familyResults[worstIndex]?.details.processing_type || "inconnu",
            },
          },
          detailedResults: familyResults,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [results, familyGroups]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    return {
      totalFamilies: familyResults.length,
      totalInteractions: familyResults.reduce(
        (sum, f) => sum + f.totalUsage,
        0
      ),
      bestFamily: familyResults[0]?.family || "N/A",
      averageGlobalScore:
        familyResults.length > 0
          ? familyResults.reduce((sum, f) => sum + f.averageScore, 0) /
            familyResults.length
          : 0,
    };
  }, [familyResults]);

  return {
    // Résultats
    familyResults,
    rawResults: results,

    // État
    loading,
    error,
    lastCalculationTime,

    // Configuration
    availableAlgorithms,
    activeAlgorithm,

    // Actions
    switchAlgorithm,
    recalculate: calculateMetrics,
    benchmarkAlgorithms,

    // Statistiques
    globalStats,
  };
};

export default useFluiditeCognitive;
