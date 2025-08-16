// components/GlobalStatsCard.tsx
import React from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { CallStats, PreparationFilters } from "../types";

interface GlobalStatsCardProps {
  stats: CallStats;
  filters: PreparationFilters;
  onFilterChange: (filterType: keyof PreparationFilters, value: string) => void;
}

const GlobalStatsCard: React.FC<GlobalStatsCardProps> = ({
  stats,
  filters,
  onFilterChange,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Vue d'ensemble des appels
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Chip
            icon={<CheckCircleIcon />}
            label={`${stats.total} Total`}
            color="default"
            variant="outlined"
          />
          <Chip
            label={`${stats.toPreparate} À préparer`}
            color="warning"
            variant={filters.state === "to_prepare" ? "filled" : "outlined"}
            onClick={() =>
              onFilterChange(
                "state",
                filters.state === "to_prepare" ? "all" : "to_prepare"
              )
            }
            style={{ cursor: "pointer" }}
          />
          <Chip
            label={`${stats.prepared} Préparés`}
            color="success"
            variant={filters.state === "prepared" ? "filled" : "outlined"}
            onClick={() =>
              onFilterChange(
                "state",
                filters.state === "prepared" ? "all" : "prepared"
              )
            }
            style={{ cursor: "pointer" }}
          />
          <Chip
            label={`${stats.complete} Complets`}
            color="primary"
            variant={filters.content === "complete" ? "filled" : "outlined"}
            onClick={() =>
              onFilterChange(
                "content",
                filters.content === "complete" ? "all" : "complete"
              )
            }
            style={{ cursor: "pointer" }}
          />
          <Chip
            label={`${stats.transcriptOnly} Transcription seule`}
            color="secondary"
            variant={
              filters.content === "transcript_only" ? "filled" : "outlined"
            }
            onClick={() =>
              onFilterChange(
                "content",
                filters.content === "transcript_only"
                  ? "all"
                  : "transcript_only"
              )
            }
            style={{ cursor: "pointer" }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default GlobalStatsCard;
