// supervision/components/SupervisionStats.tsx

import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import type { SupervisionMetrics } from "../types";

interface SupervisionStatsProps {
  stats: SupervisionMetrics;
  filteredCount: number;
}

export const SupervisionStats: React.FC<SupervisionStatsProps> = ({
  stats,
  filteredCount,
}) => {
  const statCards = [
    {
      value: stats.total,
      label: "Total Tags",
      color: "text.primary",
    },
    {
      value: stats.uniqueTags,
      label: "Tags Uniques",
      color: "text.primary",
    },
    {
      value: stats.modifiable,
      label: "Éléments Modifiables",
      color: "success.main",
    },
    {
      value: filteredCount,
      label: "Après Filtres",
      color: "primary.main",
    },
    {
      value: stats.withAudio,
      label: "Avec Audio",
      color: "info.main",
    },
    {
      value: stats.withTranscript,
      label: "Avec Transcription",
      color: "warning.main",
    },
    {
      value: stats.needsProcessing,
      label: "Besoin Traitement",
      color: "error.main",
    },
  ];

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
      {statCards.map((stat, index) => (
        <Card key={index} sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
