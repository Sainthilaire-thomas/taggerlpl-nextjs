// analysis/hooks/useStrategyStats.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StrategyStats } from "@/types/algorithm-lab";

export const useStrategyStats = (selectedOrigin?: string | null) => {
  const [data, setData] = useState<StrategyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("=== FETCH STRATEGY STATS ===");
      console.log("Origine sélectionnée:", selectedOrigin);

      // 1. Récupérer les familles de tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("lpltag")
        .select("label, family")
        .in("family", ["ENGAGEMENT", "REFLET", "EXPLICATION", "OUVERTURE"]);

      if (tagsError) throw tagsError;

      // Créer un mapping tag -> famille (en gérant les variantes REFLET_*)
      const tagToFamily = Object.fromEntries(
        tagsData.map(({ label, family }) => [
          label,
          family.startsWith("REFLET") ? "REFLET" : family,
        ])
      );

      // 2. Construction de la requête avec filtrage par origine
      let query = supabase
        .from("turntagged")
        .select(
          `
          tag,
          next_turn_tag,
          call_id
        `
        )
        .not("next_turn_tag", "is", null);

      // 3. Filtrage par origine si sélectionnée
      if (selectedOrigin) {
        const { data: filteredCalls, error: callsError } = await supabase
          .from("call")
          .select("callid")
          .eq("origine", selectedOrigin);

        if (callsError) throw callsError;

        if (!filteredCalls || filteredCalls.length === 0) {
          console.warn(`Aucun appel trouvé pour l'origine: ${selectedOrigin}`);
          setData([]);
          setLoading(false);
          return;
        }

        const callIds = filteredCalls.map((call) => call.callid);
        query = query.in("call_id", callIds);
      }

      // 4. Exécuter la requête
      const { data: turnTaggedData, error: turnTaggedError } = await query;
      if (turnTaggedError) throw turnTaggedError;

      console.log(
        `Données récupérées: ${turnTaggedData?.length || 0} enregistrements`
      );

      // 5. Calculer les statistiques par famille
      const familyStats: Record<
        string,
        {
          total: number;
          negative: number;
          neutral: number;
          positive: number;
        }
      > = {};

      turnTaggedData?.forEach(({ tag, next_turn_tag }) => {
        const family = tagToFamily[tag];
        if (!family) return;

        if (!familyStats[family]) {
          familyStats[family] = {
            total: 0,
            negative: 0,
            neutral: 0,
            positive: 0,
          };
        }

        familyStats[family].total++;

        if (next_turn_tag?.includes("NEGATIF")) {
          familyStats[family].negative++;
        } else if (next_turn_tag?.includes("NEUTRE")) {
          familyStats[family].neutral++;
        } else if (next_turn_tag?.includes("POSITIF")) {
          familyStats[family].positive++;
        }
      });

      // 6. Convertir en pourcentages et calculer l'efficacité
      const strategyStats: StrategyStats[] = Object.entries(familyStats)
        .map(([strategy, stats]) => {
          const negative = (stats.negative / stats.total) * 100;
          const neutral = (stats.neutral / stats.total) * 100;
          const positive = (stats.positive / stats.total) * 100;

          return {
            strategy,
            negative: Math.round(negative * 10) / 10,
            neutral: Math.round(neutral * 10) / 10,
            positive: Math.round(positive * 10) / 10,
            total: stats.total,
            effectiveness: Math.round((positive - negative) * 10) / 10,
          };
        })
        .sort((a, b) => b.effectiveness - a.effectiveness);

      console.log("Statistiques calculées:", strategyStats);
      setData(strategyStats);
    } catch (err) {
      console.error("Erreur lors du fetch:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [selectedOrigin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
