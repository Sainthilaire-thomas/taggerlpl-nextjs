// hooks/useFeedbackAlignmentMetrics.ts - Version adaptée aux familles de tags
import { useState, useEffect, useMemo } from "react";
import { useTaggingData, TaggedTurn } from "@/context/TaggingDataContext";
import {
  BasicAlignmentAlgorithm,
  AlignmentAnalysis,
} from "../algorithms/BasicAlignmentAlgorithm";

interface FeedbackAlignmentMetricsProps {
  selectedOrigin?: string | null;
  algorithmType?: "basic" | "sentiment_enhanced" | "sequential_patterns";
}

export const useFeedbackAlignmentMetrics = ({
  selectedOrigin,
  algorithmType = "basic",
}: FeedbackAlignmentMetricsProps = {}) => {
  const {
    allTurnTagged,
    loadingGlobalData,
    errorGlobalData,
    fetchAllTurnTagged,
    refreshGlobalDataIfNeeded,
  } = useTaggingData();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] =
    useState<AlignmentAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Filtrer et préparer les données pour l'analyse
  const processedData = useMemo(() => {
    if (!allTurnTagged?.length) return [];

    console.log("🔄 Traitement des données pour l'analyse...");
    console.log(`📊 Données brutes: ${allTurnTagged.length} turns`);

    let filtered = allTurnTagged;

    // Filtrer par origine si spécifiée
    if (selectedOrigin) {
      filtered = filtered.filter(
        (turn) => (turn as any).call_origine === selectedOrigin
      );
      console.log(
        `📋 Après filtre origine "${selectedOrigin}": ${filtered.length} turns`
      );
    }

    // Enrichir les données avec les familles de tags depuis le contexte
    const enriched = filtered.map((turn) => ({
      ...turn,
      // S'assurer que family est disponible (peut venir de différentes sources)
      family:
        turn.family ||
        (turn as any).tag_family ||
        extractFamilyFromTag(turn.tag),
      // S'assurer que originespeaker est disponible
      originespeaker: (turn as any).originespeaker || "unknown",
    }));

    console.log(`📈 Données enrichies: ${enriched.length} turns`);

    // Diagnostic des familles présentes
    const families = new Set(
      enriched.map((turn) => turn.family).filter(Boolean)
    );
    console.log("🏷️ Familles détectées:", Array.from(families));

    // Diagnostic des next_turn_tag
    const nextTags = new Set(
      enriched.map((turn) => turn.next_turn_tag).filter(Boolean)
    );
    console.log("🔗 Next turn tags détectés:", Array.from(nextTags));

    return enriched;
  }, [allTurnTagged, selectedOrigin]);

  // Fonction utilitaire pour extraire la famille d'un tag (fallback)
  const extractFamilyFromTag = (tag: string): string | undefined => {
    const familyMapping: Record<string, string> = {
      REFLET: "REFLET",
      ENGAGEMENT: "ENGAGEMENT",
      EXPLICATION: "EXPLICATION",
      OUVERTURE: "OUVERTURE",
      REFORMULATION: "REFLET",
      EMPATHIE: "ENGAGEMENT",
      INFORMATION: "EXPLICATION",
      PROPOSITION: "OUVERTURE",
    };

    const upperTag = tag?.toUpperCase() || "";

    // Recherche exacte d'abord
    if (familyMapping[upperTag]) {
      return familyMapping[upperTag];
    }

    // Recherche par inclusion
    for (const [pattern, family] of Object.entries(familyMapping)) {
      if (upperTag.includes(pattern)) {
        return family;
      }
    }

    return undefined;
  };

  // Charger les données si nécessaire
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🔄 Vérification des données...");
        console.log(
          `📊 Données actuelles: ${allTurnTagged?.length || 0} turns`
        );

        // Forcer un fetch complet si on a moins de 3000 turns (on sait qu'il y en a 3652)
        if (!allTurnTagged?.length || allTurnTagged.length < 3000) {
          console.log("📥 Chargement complet des données turntagged...");
          console.log(
            "⚠️ Augmentation de la limite Supabase pour récupérer tous les turns"
          );

          // Utiliser une limite élevée pour récupérer TOUS les turns
          await fetchAllTurnTagged({ limit: 5000 }); // Limite à 5000 pour être sûr

          console.log(
            `✅ Nouveau total après fetch: ${allTurnTagged?.length || 0} turns`
          );
        } else {
          console.log("✅ Données suffisantes déjà chargées");
          await refreshGlobalDataIfNeeded();
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des données:", error);
        setAnalysisError("Erreur lors du chargement des données");
      }
    };

    loadData();
  }, []); // Supprimer allTurnTagged?.length des dépendances pour éviter les boucles

  // Effectuer l'analyse
  const runAnalysis = async () => {
    if (!processedData.length) {
      setAnalysisError("Aucune donnée disponible pour l'analyse");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      console.log("🚀 Démarrage analyse d'alignement par familles...");
      console.log(`📊 Données d'entrée: ${processedData.length} turns`);

      // Diagnostic des données avant analyse
      const sampleTurn = processedData[0];
      console.log("🔍 Structure échantillon:", {
        id: sampleTurn.id,
        family: sampleTurn.family,
        tag: sampleTurn.tag,
        next_turn_tag: sampleTurn.next_turn_tag,
        call_origine: (sampleTurn as any).call_origine,
      });

      // Instancier l'algorithme
      const algorithm = new BasicAlignmentAlgorithm(processedData);

      // Diagnostic des données
      algorithm.diagnoseData();

      // Lancer l'analyse
      const results = algorithm.analyzeAlignment();

      console.log("✅ Analyse terminée:", results);
      setAnalysisResults(results);
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Erreur inconnue"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-lancer l'analyse quand les données changent
  useEffect(() => {
    if (processedData.length > 0 && !isAnalyzing) {
      console.log("🎯 Auto-lancement de l'analyse...");
      runAnalysis();
    }
  }, [processedData.length, algorithmType]);

  // Préparer les données pour le tableau
  const tableRows = useMemo(() => {
    if (!analysisResults) return [];

    return [
      {
        id: "1",
        algorithm: "Familles de Tags (BasicAlignment)",
        reflet: analysisResults.reflet.alignmentScore,
        engagement: analysisResults.engagement.alignmentScore,
        explication: analysisResults.explication.alignmentScore,
        ouverture: analysisResults.ouverture.alignmentScore,
        details: analysisResults,
      },
    ];
  }, [analysisResults]);

  // Statistiques détaillées pour l'affichage
  const stats = useMemo(() => {
    if (!analysisResults) return null;

    const strategiesWithData = Object.entries({
      reflet: analysisResults.reflet,
      engagement: analysisResults.engagement,
      explication: analysisResults.explication,
      ouverture: analysisResults.ouverture,
    }).filter(([_, data]) => data.totalOccurrences > 0);

    return {
      totalTurns: analysisResults.globalStats.totalAnalyzedTurns,
      totalResponses: analysisResults.globalStats.totalResponseTurns,
      overallScore: analysisResults.globalStats.overallAlignmentScore,
      strategiesCount: strategiesWithData.length,
      strategiesBreakdown: {
        reflet: analysisResults.reflet,
        engagement: analysisResults.engagement,
        explication: analysisResults.explication,
        ouverture: analysisResults.ouverture,
      },
      // Statistiques additionnelles
      coverage:
        analysisResults.globalStats.totalResponseTurns > 0
          ? (analysisResults.globalStats.totalResponseTurns /
              analysisResults.globalStats.totalAnalyzedTurns) *
            100
          : 0,
      bestStrategy:
        strategiesWithData.length > 0
          ? strategiesWithData.reduce(
              (best, [name, data]) =>
                data.alignmentScore > best.score
                  ? { name, score: data.alignmentScore }
                  : best,
              { name: "", score: 0 }
            )
          : null,
    };
  }, [analysisResults]);

  return {
    // Données
    data: processedData,
    tableRows,
    analysisResults,
    stats,

    // États
    isLoading: loadingGlobalData || isAnalyzing,
    isAnalyzing,
    error: errorGlobalData || analysisError,

    // Actions
    runAnalysis,
    refreshData: () => {
      console.log("🔄 Refresh forcé avec limite maximale");
      return fetchAllTurnTagged({ limit: 15000 }); // Limite très élevée pour être sûr
    },

    // Méta informations
    dataCount: processedData.length,
    hasData: processedData.length > 0,
    sourceDataCount: allTurnTagged?.length || 0,

    // Diagnostics
    debugInfo: {
      families: [
        ...new Set(processedData.map((turn) => turn.family).filter(Boolean)),
      ],
      nextTurnTags: [
        ...new Set(
          processedData.map((turn) => turn.next_turn_tag).filter(Boolean)
        ),
      ],
      origines: [
        ...new Set(
          processedData
            .map((turn) => (turn as any).call_origine)
            .filter(Boolean)
        ),
      ],
    },
  };
};
