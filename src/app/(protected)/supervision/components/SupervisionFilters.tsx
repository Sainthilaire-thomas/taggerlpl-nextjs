// supervision/components/SupervisionFilters.tsx

import React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Badge,
} from "@mui/material";
import { Search, Refresh } from "@mui/icons-material";
import { SupervisionFilters, TagGroupStats } from "../types";

interface SupervisionFiltersProps {
  filters: SupervisionFilters;
  updateFilters: (updates: Partial<SupervisionFilters>) => void;
  resetFilters: () => void;
  tagStats: TagGroupStats[];
  uniqueFamilies: string[];
  uniqueSpeakers: string[];
  onPageReset: () => void;
}

export const SupervisionFiltersComponent: React.FC<SupervisionFiltersProps> = ({
  filters,
  updateFilters,
  resetFilters,
  tagStats,
  uniqueFamilies,
  uniqueSpeakers,
  onPageReset,
}) => {
  const handleReset = () => {
    resetFilters();
    onPageReset();
  };

  const handleModifiableFilter = () => {
    const isActive =
      filters.hasAudio === true && filters.hasTranscript === true;
    updateFilters({
      hasAudio: isActive ? null : true,
      hasTranscript: isActive ? null : true,
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Filtres
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Recherche textuelle */}
        <TextField
          label="Rechercher"
          variant="outlined"
          size="small"
          value={filters.searchText}
          onChange={(e) => updateFilters({ searchText: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />

        {/* Filtre par tag */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tag</InputLabel>
          <Select
            value={filters.selectedTag}
            onChange={(e) => updateFilters({ selectedTag: e.target.value })}
            label="Tag"
          >
            <MenuItem value="all">Tous les tags</MenuItem>
            {tagStats.slice(0, 20).map((stat) => (
              <MenuItem key={stat.label} value={stat.label}>
                <Badge badgeContent={stat.count} color="primary">
                  {stat.label}
                </Badge>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtre par famille */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Famille</InputLabel>
          <Select
            value={filters.selectedFamily}
            onChange={(e) => updateFilters({ selectedFamily: e.target.value })}
            label="Famille"
          >
            <MenuItem value="all">Toutes les familles</MenuItem>
            {uniqueFamilies.map((family) => (
              <MenuItem key={family} value={family}>
                {family}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtre par speaker */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Speaker</InputLabel>
          <Select
            value={filters.selectedSpeaker}
            onChange={(e) => updateFilters({ selectedSpeaker: e.target.value })}
            label="Speaker"
          >
            <MenuItem value="all">Tous les speakers</MenuItem>
            {uniqueSpeakers.map((speaker) => (
              <MenuItem key={speaker} value={speaker}>
                {speaker}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtre par disponibilité audio */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Audio</InputLabel>
          <Select
            value={
              filters.hasAudio === null ? "all" : filters.hasAudio.toString()
            }
            onChange={(e) => {
              const value = e.target.value;
              updateFilters({
                hasAudio: value === "all" ? null : value === "true",
              });
            }}
            label="Audio"
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="true">Avec audio</MenuItem>
            <MenuItem value="false">Sans audio</MenuItem>
          </Select>
        </FormControl>

        {/* Filtre par disponibilité transcription */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Transcription</InputLabel>
          <Select
            value={
              filters.hasTranscript === null
                ? "all"
                : filters.hasTranscript.toString()
            }
            onChange={(e) => {
              const value = e.target.value;
              updateFilters({
                hasTranscript: value === "all" ? null : value === "true",
              });
            }}
            label="Transcription"
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="true">Avec transcription</MenuItem>
            <MenuItem value="false">Sans transcription</MenuItem>
          </Select>
        </FormControl>

        {/* Filtre rapide : Éléments modifiables */}
        <Button
          variant={
            filters.hasAudio === true && filters.hasTranscript === true
              ? "contained"
              : "outlined"
          }
          color="success"
          size="small"
          onClick={handleModifiableFilter}
          sx={{ minWidth: 140 }}
        >
          {filters.hasAudio === true && filters.hasTranscript === true
            ? "✅ Modifiables"
            : "🎯 Modifiables"}
        </Button>

        {/* Bouton de réinitialisation */}
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleReset}
        >
          Reset
        </Button>
      </Box>
    </Paper>
  );
};
