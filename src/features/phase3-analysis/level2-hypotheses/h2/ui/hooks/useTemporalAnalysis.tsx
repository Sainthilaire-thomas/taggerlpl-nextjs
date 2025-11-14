// hooks/useTemporalAnalysis.ts - Version corrigée avec types Supabase
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface TagPosition {
  id: number;
  call_id: string;
  tag: string;
  family: string;
  color: string;
  start_time: number;
  end_time: number;
  call_duration: number;
  relative_position: number;
  speaker: string;
  verbatim: string;
}

export interface FamilyStats {
  family: string;
  color: string;
  count: number;
  avgPosition: number;
  distribution: {
    early: number; // 0-33%
    middle: number; // 33-66%
    late: number; // 66-100%
  };
}

export interface TemporalAnalysisData {
  tagPositions: TagPosition[];
  familyStats: Record<string, FamilyStats>;
  totalTags: number;
  uniqueCalls: number;
  avgCallDuration: number;
}

// Types pour Supabase (lpltag est un objet avec inner join)
interface SupabaseTagData {
  id: number;
  call_id: string;
  tag: string;
  start_time: number;
  end_time: number;
  speaker: string;
  verbatim: string;
  lpltag: {
    family: string;
    color: string;
  };
}

const FAMILY_COLORS: Record<string, string> = {
  ENGAGEMENT: "#FF6B6B",
  REFLET: "#4ECDC4",
  EXPLICATION: "#45B7D1",
  OUVERTURE: "#96CEB4",
  CLIENT: "#F39C12",
  REPONSE: "#9B59B6",
  AUTRE: "#95A5A6",
};

export const useTemporalAnalysis = (selectedOrigin?: string) => {
  const [data, setData] = useState<TemporalAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origines, setOrigines] = useState<string[]>([]);

  // Fetch des données optimisé
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("=== FETCH TEMPORAL ANALYSIS DATA ===");
      console.log("Origine sélectionnée:", selectedOrigin);

      // 1. Récupérer les origines disponibles
      const { data: callsData, error: callsError } = await supabase
        .from("call")
        .select("origine")
        .not("origine", "is", null);

      if (callsError) throw callsError;

      const uniqueOrigines = [
        ...new Set(callsData.map((call) => call.origine)),
      ];
      setOrigines(uniqueOrigines);

      // 2. Requête principale avec jointures optimisées
      let query = supabase
        .from("turntagged")
        .select(
          `
          id,
          call_id,
          tag,
          start_time,
          end_time,
          speaker,
          verbatim,
          lpltag!inner(family, color)
        `
        )
        .not("lpltag.family", "is", null)
        .order("call_id")
        .order("start_time")
        .limit(5000); // ✅ Augmenter la limite à 5000

      // Filtrage par origine si nécessaire
      if (selectedOrigin && selectedOrigin !== "all") {
        const { data: filteredCallIds, error: filterError } = await supabase
          .from("call")
          .select("callid")
          .eq("origine", selectedOrigin);

        if (filterError) throw filterError;

        if (filteredCallIds.length === 0) {
          setData({
            tagPositions: [],
            familyStats: {},
            totalTags: 0,
            uniqueCalls: 0,
            avgCallDuration: 0,
          });
          setLoading(false);
          return;
        }

        const callIds = filteredCallIds.map((call) => call.callid);
        query = query.in("call_id", callIds);
      }

      const { data: rawData, error: queryError } = await query;
      if (queryError) throw queryError;

      // 3. Typage correct des données Supabase
      const turnTaggedData = rawData as SupabaseTagData[];

      console.log(
        `Données récupérées: ${turnTaggedData.length} enregistrements`
      );

      // Debug: vérifier la structure des données
      if (turnTaggedData.length > 0) {
        console.log("Exemple de données reçues:", turnTaggedData[0]);
        console.log("Structure lpltag:", turnTaggedData[0]?.lpltag);
      }

      // 4. Calculer les durées maximales par appel
      const callDurations = new Map<string, number>();
      const callTagCounts = new Map<string, number>();

      turnTaggedData.forEach((item) => {
        const currentMax = callDurations.get(item.call_id) || 0;
        if (item.end_time > currentMax) {
          callDurations.set(item.call_id, item.end_time);
        }

        const currentCount = callTagCounts.get(item.call_id) || 0;
        callTagCounts.set(item.call_id, currentCount + 1);
      });

      // 5. Transformer les données en TagPosition
      const tagPositions: TagPosition[] = turnTaggedData
        .filter((item) => item.lpltag && item.lpltag.family) // Filtrage pour objet direct
        .map((item) => {
          const callDuration = callDurations.get(item.call_id) || 1;
          const relativePosition = (item.start_time / callDuration) * 100;

          // Accéder directement à lpltag (objet, pas tableau)
          const lpltagData = item.lpltag;

          // Vérification supplémentaire pour éviter les erreurs
          if (!lpltagData || !lpltagData.family) {
            console.warn(`Tag sans famille détecté:`, item.tag);
            return null;
          }

          // Normaliser la famille REFLET_* vers REFLET
          const normalizedFamily = lpltagData.family.startsWith("REFLET")
            ? "REFLET"
            : lpltagData.family;

          return {
            id: item.id,
            call_id: item.call_id,
            tag: item.tag,
            family: normalizedFamily,
            color:
              lpltagData.color || FAMILY_COLORS[normalizedFamily] || "#999",
            start_time: item.start_time,
            end_time: item.end_time,
            call_duration: callDuration,
            relative_position: Math.round(relativePosition * 10) / 10,
            speaker: item.speaker,
            verbatim: item.verbatim,
          };
        })
        .filter((item): item is TagPosition => item !== null); // Filtrer les null

      // 6. Calculer les statistiques par famille
      const familyStats: Record<string, FamilyStats> = {};
      let totalDuration = 0;

      tagPositions.forEach((item) => {
        if (!familyStats[item.family]) {
          familyStats[item.family] = {
            family: item.family,
            color: FAMILY_COLORS[item.family] || "#999",
            count: 0,
            avgPosition: 0,
            distribution: { early: 0, middle: 0, late: 0 },
          };
        }

        familyStats[item.family].count++;
        familyStats[item.family].avgPosition += item.relative_position;
        totalDuration += item.call_duration;

        // Classification par période
        if (item.relative_position <= 33) {
          familyStats[item.family].distribution.early++;
        } else if (item.relative_position <= 66) {
          familyStats[item.family].distribution.middle++;
        } else {
          familyStats[item.family].distribution.late++;
        }
      });

      // 7. Finaliser les statistiques
      Object.values(familyStats).forEach((stat) => {
        stat.avgPosition =
          Math.round((stat.avgPosition / stat.count) * 10) / 10;
        stat.distribution = {
          early: Math.round((stat.distribution.early / stat.count) * 100),
          middle: Math.round((stat.distribution.middle / stat.count) * 100),
          late: Math.round((stat.distribution.late / stat.count) * 100),
        };
      });

      // 8. Construire l'objet final
      const analysisData: TemporalAnalysisData = {
        tagPositions,
        familyStats,
        totalTags: tagPositions.length,
        uniqueCalls: callDurations.size,
        avgCallDuration:
          Math.round((totalDuration / tagPositions.length) * 10) / 10,
      };

      setData(analysisData);
      console.log("Analyse temporelle terminée:", analysisData);
    } catch (err) {
      console.error("Erreur lors de l'analyse temporelle:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [selectedOrigin]);

  // Données filtrées par famille
  const getFilteredData = useCallback(
    (familyFilter: string = "all") => {
      if (!data) return [];
      if (familyFilter === "all") return data.tagPositions;
      return data.tagPositions.filter((item) => item.family === familyFilter);
    },
    [data]
  );

  // Génération des données pour le graphique
  const getScatterPlotData = useCallback(
    (familyFilter: string = "all") => {
      const filteredData = getFilteredData(familyFilter);

      // Grouper par famille pour le rendu
      const groupedData: Record<string, TagPosition[]> = {};
      filteredData.forEach((item) => {
        if (!groupedData[item.family]) {
          groupedData[item.family] = [];
        }
        groupedData[item.family].push(item);
      });

      return groupedData;
    },
    [getFilteredData]
  );

  // Statistiques dérivées
  const derivedStats = useMemo(() => {
    if (!data) return null;

    const families = Object.keys(data.familyStats);
    if (families.length === 0) return null;

    const mostActiveFamily = families.reduce(
      (max, family) =>
        data.familyStats[family].count > data.familyStats[max].count
          ? family
          : max,
      families[0]
    );

    const earlyTags = data.tagPositions.filter(
      (tag) => tag.relative_position <= 33
    ).length;
    const middleTags = data.tagPositions.filter(
      (tag) => tag.relative_position > 33 && tag.relative_position <= 66
    ).length;
    const lateTags = data.tagPositions.filter(
      (tag) => tag.relative_position > 66
    ).length;

    return {
      mostActiveFamily,
      totalFamilies: families.length,
      temporalDistribution: {
        early: Math.round((earlyTags / data.totalTags) * 100),
        middle: Math.round((middleTags / data.totalTags) * 100),
        late: Math.round((lateTags / data.totalTags) * 100),
      },
      averageTagsPerCall:
        Math.round((data.totalTags / data.uniqueCalls) * 10) / 10,
    };
  }, [data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    origines,
    derivedStats,
    getFilteredData,
    getScatterPlotData,
    refetch: fetchData,
  };
};
