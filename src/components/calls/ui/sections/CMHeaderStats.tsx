// src/components/calls/ui/sections/CMHeaderStats.tsx
import { Box, Typography, Badge, Chip, Alert } from "@mui/material";
type Stats = {
  total: number;
  filteredCount: number;
  selectedCount: number;
  completeness: number;
  readyForTagging: number;
  conflictuels: number;
};
export function CMHeaderStats({
  stats,
  originsCount,
}: {
  stats: Stats;
  originsCount: number;
}) {
  return (
    <Box mb={3}>
      <Typography variant="h4" gutterBottom>
        🏢 Gestion Unifiée des Appels
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Cycle de vie intelligent, lazy loading et virtualisation
      </Typography>
      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <Badge badgeContent={stats.total} color="primary">
          <Chip label="Total" variant="outlined" />
        </Badge>
        <Badge badgeContent={stats.filteredCount} color="info">
          <Chip label="Filtrés" variant="outlined" />
        </Badge>
        <Badge badgeContent={stats.selectedCount} color="warning">
          <Chip label="Sélectionnés" variant="outlined" />
        </Badge>
        <Badge badgeContent={`${stats.completeness}%`} color="success">
          <Chip label="Complétude" variant="outlined" />
        </Badge>
        <Badge badgeContent={stats.readyForTagging} color="success">
          <Chip label="Prêts tagging" variant="outlined" />
        </Badge>
        <Badge badgeContent={stats.conflictuels} color="error">
          <Chip label="Conflictuels" variant="outlined" />
        </Badge>
      </Box>
      <Alert severity="info">
        <strong>Optimisations actives:</strong> lifecycle (CallExtended +
        colonne dédiée), lazy accordéons, virtualisation. {originsCount}{" "}
        origines.
      </Alert>
    </Box>
  );
}
