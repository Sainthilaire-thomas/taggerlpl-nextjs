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
  Autocomplete,
  Chip,
} from "@mui/material";
import {
  Search,
  Refresh,
  Phone,
  FilterAlt,
  AudioFile,
  Assignment,
  Business, // Pour l'icône origine
} from "@mui/icons-material";
import { SupervisionFilters, TagGroupStats } from "../types";

interface SupervisionFiltersProps {
  filters: SupervisionFilters;
  updateFilters: (updates: Partial<SupervisionFilters>) => void;
  resetFilters: () => void;
  tagStats: TagGroupStats[];
  uniqueFamilies: string[];
  uniqueSpeakers: string[];
  uniqueCallIds: string[];
  uniqueOrigines: string[]; // Nouveau prop pour les origines
  callIdToFilename: Map<string, string>; // Nouveau prop pour mapper Call ID → Filename
  onPageReset: () => void;
}

export const SupervisionFiltersComponent: React.FC<SupervisionFiltersProps> = ({
  filters,
  updateFilters,
  resetFilters,
  tagStats,
  uniqueFamilies,
  uniqueSpeakers,
  uniqueCallIds,
  uniqueOrigines, // Nouveau prop
  callIdToFilename, // Nouveau prop
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

  const handleIncompleteFilter = () => {
    const isActive =
      filters.hasAudio === false || filters.hasTranscript === false;
    updateFilters({
      hasAudio: isActive ? null : false,
      hasTranscript: isActive ? null : false,
    });
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "searchText") return value.trim() !== "";
    if (key === "selectedCallId") return value !== "all";
    if (key === "selectedTag") return value !== "all";
    if (key === "selectedFamily") return value !== "all";
    if (key === "selectedSpeaker") return value !== "all";
    if (key === "selectedOrigine") return value !== "all"; // Nouveau filtre
    if (key === "hasAudio" || key === "hasTranscript") return value !== null;
    return false;
  }).length;

  // Vérifier que les arrays sont bien définis
  const safeUniqueCallIds = Array.isArray(uniqueCallIds) ? uniqueCallIds : [];
  const safeUniqueOrigines = Array.isArray(uniqueOrigines)
    ? uniqueOrigines
    : [];

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <FilterAlt sx={{ mr: 1 }} />
        <Typography variant="h6">Filtres</Typography>
        {activeFiltersCount > 0 && (
          <Chip
            label={`${activeFiltersCount} actif${
              activeFiltersCount > 1 ? "s" : ""
            }`}
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Recherche textuelle */}
        <TextField
          label="Rechercher dans les verbatims"
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
          placeholder="Texte, tag, call ID..."
        />

        {/* Filtre par Call ID avec nom de fichier */}
        <Autocomplete
          size="small"
          options={["all", ...safeUniqueCallIds.slice(0, 100)]}
          value={filters.selectedCallId || "all"}
          onChange={(_, value) =>
            updateFilters({ selectedCallId: value || "all" })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Appel"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <li key={option} {...otherProps}>
                {option === "all" ? (
                  <Typography variant="body2" color="text.secondary">
                    Tous les appels
                  </Typography>
                ) : (
                  <Box sx={{ maxWidth: 300 }}>
                    {/* Afficher le nom du fichier en premier */}
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      {callIdToFilename.get(option) || `Appel ${option}`}
                    </Typography>
                    {/* Call ID en sous-titre */}
                    <Typography variant="caption" color="text.secondary">
                      Call ID: {option}
                    </Typography>
                  </Box>
                )}
              </li>
            );
          }}
          getOptionLabel={(option) => {
            if (option === "all") return "Tous les appels";
            return callIdToFilename.get(option) || `Appel ${option}`;
          }}
          freeSolo
          clearOnEscape
        />

        {/* Filtre par tag */}
        <FormControl size="small">
          <InputLabel>Tag</InputLabel>
          <Select
            value={filters.selectedTag}
            onChange={(e) => updateFilters({ selectedTag: e.target.value })}
            label="Tag"
          >
            <MenuItem value="all">
              <Typography color="text.secondary">Tous les tags</Typography>
            </MenuItem>
            {tagStats.slice(0, 20).map((stat) => (
              <MenuItem key={stat.label} value={stat.label}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Typography>{stat.label}</Typography>
                  <Badge badgeContent={stat.count} color="primary" />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtre par famille */}
        <FormControl size="small">
          <InputLabel>Famille</InputLabel>
          <Select
            value={filters.selectedFamily}
            onChange={(e) => updateFilters({ selectedFamily: e.target.value })}
            label="Famille"
          >
            <MenuItem value="all">
              <Typography color="text.secondary">
                Toutes les familles
              </Typography>
            </MenuItem>
            {uniqueFamilies.map((family) => (
              <MenuItem key={family} value={family}>
                {family}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Deuxième ligne de filtres */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Nouveau : Filtre par origine */}
        <FormControl size="small">
          <InputLabel>Origine</InputLabel>
          <Select
            value={filters.selectedOrigine || "all"}
            onChange={(e) => updateFilters({ selectedOrigine: e.target.value })}
            label="Origine"
          >
            <MenuItem value="all">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Business fontSize="small" sx={{ mr: 1 }} />
                <Typography color="text.secondary">
                  Toutes les origines
                </Typography>
              </Box>
            </MenuItem>
            {safeUniqueOrigines.map((origine) => (
              <MenuItem key={origine} value={origine}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Business fontSize="small" sx={{ mr: 1 }} />
                  <Typography>{origine}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtre par speaker */}
        <FormControl size="small">
          <InputLabel>Speaker</InputLabel>
          <Select
            value={filters.selectedSpeaker}
            onChange={(e) => updateFilters({ selectedSpeaker: e.target.value })}
            label="Speaker"
          >
            <MenuItem value="all">
              <Typography color="text.secondary">Tous les speakers</Typography>
            </MenuItem>
            {uniqueSpeakers.map((speaker) => (
              <MenuItem key={speaker} value={speaker}>
                <Chip
                  label={speaker}
                  size="small"
                  color={speaker === "conseiller" ? "primary" : "secondary"}
                  variant="outlined"
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtre par disponibilité audio */}
        <FormControl size="small">
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
            <MenuItem value="true">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AudioFile fontSize="small" color="success" sx={{ mr: 1 }} />
                Avec audio
              </Box>
            </MenuItem>
            <MenuItem value="false">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AudioFile fontSize="small" color="disabled" sx={{ mr: 1 }} />
                Sans audio
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Filtre par disponibilité transcription */}
        <FormControl size="small">
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
            <MenuItem value="true">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Assignment fontSize="small" color="success" sx={{ mr: 1 }} />
                Avec transcription
              </Box>
            </MenuItem>
            <MenuItem value="false">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Assignment fontSize="small" color="disabled" sx={{ mr: 1 }} />
                Sans transcription
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Boutons de filtres rapides */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
          startIcon={
            filters.hasAudio === true && filters.hasTranscript === true
              ? "✅"
              : "🎯"
          }
        >
          Modifiables
        </Button>

        {/* Filtre rapide : Éléments incomplets */}
        <Button
          variant={
            filters.hasAudio === false || filters.hasTranscript === false
              ? "contained"
              : "outlined"
          }
          color="warning"
          size="small"
          onClick={handleIncompleteFilter}
          startIcon={
            filters.hasAudio === false || filters.hasTranscript === false
              ? "⚠️"
              : "🔧"
          }
        >
          À traiter
        </Button>

        {/* Bouton de réinitialisation */}
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleReset}
          disabled={activeFiltersCount === 0}
        >
          Reset ({activeFiltersCount})
        </Button>
      </Box>
    </Paper>
  );
};
