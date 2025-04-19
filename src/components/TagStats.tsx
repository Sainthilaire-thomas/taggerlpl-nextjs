"use client";

import { useEffect, useState, useRef, FC } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import * as echarts from "echarts";
import { supabase } from "@/lib/supabaseClient";

// Types
interface TagStatsProps {
  family?: string | null;
}

interface TagData {
  tag: string;
  next_turn_tag: string;
  count: number;
}

interface TurnTaggedRecord {
  tag: string | null;
  next_turn_tag: string | null;
  lpltag: {
    family: string;
  };
}

interface AggregatedData {
  [key: string]: TagData;
}

interface EChartsSeriesItem {
  name: string;
  type: string;
  stack: string;
  data: number[];
}

const TagStats: FC<TagStatsProps> = ({ family }) => {
  const [data, setData] = useState<TagData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null); // Référence pour ECharts

  useEffect(() => {
    const fetchData = async () => {
      if (!family) {
        setLoading(false);
        setData([]);
        return;
      }

      console.log("Fetching data for family:", family);
      setLoading(true);
      setError(null);

      try {
        // Effectuer une jointure entre turntagged et lpltag
        const { data, error } = await supabase
          .from("turntagged")
          .select(
            `
            tag,
            next_turn_tag,
            lpltag!inner(
              family
            )
          `
          )
          .eq("lpltag.family", family) // Filtrer par la famille
          .order("tag", { ascending: true });

        if (error) {
          console.error("Supabase error:", error.message);
          throw new Error(`Erreur Supabase: ${error.message}`);
        }

        console.log("Raw data from Supabase:", data);

        if (!data || data.length === 0) {
          console.warn("No data found for the specified family:", family);
          setData([]); // Mettre à jour avec un tableau vide si aucune donnée trouvée
          return;
        }

        // Compter les occurrences de chaque combinaison tag/next_turn_tag
        const aggregatedData = (
          data as TurnTaggedRecord[]
        ).reduce<AggregatedData>((acc, item) => {
          const tag = item.tag || "Non spécifié";
          const nextTurnTag = item.next_turn_tag || "Aucun";
          const key = `${tag}-${nextTurnTag}`;

          if (!acc[key]) {
            acc[key] = {
              tag,
              next_turn_tag: nextTurnTag,
              count: 0,
            };
          }
          acc[key].count += 1;
          return acc;
        }, {});

        console.log("Aggregated data:", aggregatedData);

        setData(Object.values(aggregatedData)); // Mettre à jour l'état avec les données agrégées
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        console.error("Unexpected error:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [family]);

  useEffect(() => {
    if (data.length > 0 && chartRef.current) {
      console.log("Initializing ECharts with data:", data);

      const chartInstance = echarts.init(chartRef.current);

      // Préparer les données pour ECharts
      const tags = [...new Set(data.map((item) => item.tag))]; // Liste unique des tags
      const nextTags = [...new Set(data.map((item) => item.next_turn_tag))]; // Liste unique des next_turn_tag (y compris "Aucun")

      const series: EChartsSeriesItem[] = nextTags.map((nextTag) => ({
        name: nextTag,
        type: "bar",
        stack: "total",
        data: tags.map((tag) => {
          const match = data.find(
            (item) => item.tag === tag && item.next_turn_tag === nextTag
          );
          return match ? match.count : 0;
        }),
      }));

      console.log("Prepared series for ECharts:", series);

      // Configuration du graphique
      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: nextTags,
        },
        xAxis: {
          type: "category",
          data: tags,
        },
        yAxis: {
          type: "value",
        },
        series,
      };

      chartInstance.setOption(option);

      // Nettoyer l'instance de graphique à la destruction
      return () => {
        console.log("Disposing ECharts instance");
        chartInstance.dispose();
      };
    }
  }, [data]);

  if (loading) {
    console.log("Loading data...");
    return (
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    console.error("Error occurred:", error);
    return (
      <Box sx={{ color: "red", textAlign: "center", marginTop: 4 }}>
        <Typography variant="h6">Erreur : {error}</Typography>
      </Box>
    );
  }

  if (!family) {
    return (
      <Box sx={{ textAlign: "center", marginTop: 4 }}>
        <Typography variant="h6">
          Veuillez sélectionner une famille pour afficher les statistiques
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        Statistiques pour la famille "{family}"
      </Typography>
      {data.length === 0 ? (
        <Typography variant="body1">
          Aucune donnée disponible pour cette famille
        </Typography>
      ) : (
        <Box
          ref={chartRef}
          sx={{ width: "100%", height: "400px", marginTop: 2 }}
        ></Box>
      )}
    </Box>
  );
};

export default TagStats;
