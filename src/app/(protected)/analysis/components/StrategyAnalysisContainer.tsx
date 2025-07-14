// analysis/components/StrategyAnalysisContainer.tsx
"use client";

import { FC, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from "@mui/material";
import { supabase } from "@/lib/supabaseClient";
import { useStrategyStats } from "../hooks/useStrategyStats";
import StrategyStatsTable from "./StrategyStatsTable";
import PositiveReactionsChart from "./PositiveReactionsChart";
import InsightCard from "./InsightCard";

interface StrategyAnalysisContainerProps {
  defaultOrigin?: string;
}

const StrategyAnalysisContainer: FC<StrategyAnalysisContainerProps> = ({
  defaultOrigin,
}) => {
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(
    defaultOrigin || null
  );
  const [origins, setOrigins] = useState<string[]>([]);
  const [originsLoading, setOriginsLoading] = useState(true);

  const { data, loading, error } = useStrategyStats(selectedOrigin);

  // Récupérer les origines disponibles (même logique que TagAnalysisGraphs)
  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        setOriginsLoading(true);
        const { data: originsData, error: originsError } = await supabase
          .from("call")
          .select("origine");

        if (originsError) {
          console.error(
            "Erreur lors de la récupération des origines :",
            originsError.message
          );
          throw originsError;
        }

        const uniqueOrigins = [
          ...new Set(originsData.map((item) => item.origine)),
        ].filter(Boolean) as string[];

        console.log("Origines récupérées :", uniqueOrigins);
        setOrigins(uniqueOrigins);
      } catch (err) {
        console.error(
          "Erreur inattendue lors de la récupération des origines :",
          err
        );
        setOrigins([]);
      } finally {
        setOriginsLoading(false);
      }
    };

    fetchOrigins();
  }, []);

  const handleOriginChange = (event: SelectChangeEvent<string>) => {
    setSelectedOrigin(event.target.value || null);
  };

  if (loading || originsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          Erreur lors du chargement des données: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        // ✅ CORRECTION : Supprimer le padding qui décale le contenu
        // p: 3, // ← SUPPRIMER CETTE LIGNE
        width: "100%",
        maxWidth: "100%", // Assurer que le contenu ne dépasse pas
        overflow: "hidden", // Éviter les débordements horizontaux
      }}
    >
      <Typography variant="h4" gutterBottom>
        Strategy Impact Analysis
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Analyse de l'efficacité des différentes stratégies conversationnelles
        sur les réactions clients
      </Typography>

      {/* Filtres */}
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par origine</InputLabel>
          <Select
            value={selectedOrigin || ""}
            label="Filtrer par origine"
            onChange={handleOriginChange}
          >
            <MenuItem value="">
              <em>Toutes les origines</em>
            </MenuItem>
            {origins.map((origin) => (
              <MenuItem key={origin} value={origin}>
                {origin}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedOrigin && (
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              padding: 1,
              backgroundColor: "info.light",
              borderRadius: 1,
              display: "inline-block",
            }}
          >
            📊 Données filtrées par origine: <strong>{selectedOrigin}</strong>
          </Typography>
        )}
      </Box>

      {data.length === 0 ? (
        <Alert severity="info">
          Aucune donnée disponible pour les critères sélectionnés.
        </Alert>
      ) : (
        <>
          {/* Insights automatiques */}
          <InsightCard data={data} />

          {/* Tableau principal */}
          <StrategyStatsTable data={data} />

          {/* Graphique des réactions positives */}
          <PositiveReactionsChart data={data} />
        </>
      )}
    </Box>
  );
};

export default StrategyAnalysisContainer;
