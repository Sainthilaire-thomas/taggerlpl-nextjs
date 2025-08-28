"use client";
import React from "react";
import {
  Stack,
  Autocomplete,
  TextField,
  Chip,
  Button,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import { TVValidationResult } from "../types";

export interface ResultsFiltersProps {
  results: TVValidationResult[];
  filters: {
    predFilter: string[];
    realFilter: string[];
    allPredTags: string[];
    allRealTags: string[];
  };
  onFiltersChange: {
    setPredFilter: (tags: string[]) => void;
    setRealFilter: (tags: string[]) => void;
  };
}

export const ResultsFilters: React.FC<ResultsFiltersProps> = ({
  results,
  filters,
  onFiltersChange,
}) => {
  const { predFilter, realFilter, allPredTags, allRealTags } = filters;

  const { setPredFilter, setRealFilter } = onFiltersChange;

  return (
    <Stack spacing={2}>
      {/* Filtres de recherche */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Autocomplete
          multiple
          options={allPredTags}
          value={predFilter}
          onChange={(_, val) => setPredFilter(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filtre Tag PRÉDIT"
              size="small"
              placeholder="Sélectionnez les tags prédits..."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                size="small"
                color="primary"
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          sx={{ minWidth: 260, flex: 1 }}
          noOptionsText="Aucun tag trouvé"
          clearText="Effacer"
          closeText="Fermer"
          // ❌ Supprimer placeholder ici - il doit être dans TextField
        />

        <Autocomplete
          multiple
          options={allRealTags}
          value={realFilter}
          onChange={(_, val) => setRealFilter(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filtre Tag RÉEL"
              size="small"
              placeholder="Sélectionnez les tags réels..."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                size="small"
                color="success"
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          sx={{ minWidth: 260, flex: 1 }}
          noOptionsText="Aucun tag trouvé"
          clearText="Effacer"
          closeText="Fermer"
          // ❌ Supprimer placeholder ici aussi
        />
      </Stack>

      {/* Statistiques des filtres actifs */}
      {(predFilter.length > 0 || realFilter.length > 0) && (
        <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Filtres actifs :
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", gap: 0.5 }}
          >
            {predFilter.map((tag) => (
              <Chip
                key={`pred-${tag}`}
                label={`Prédit: ${tag}`}
                size="small"
                variant="filled"
                color="primary"
                onDelete={() =>
                  setPredFilter(predFilter.filter((t) => t !== tag))
                }
              />
            ))}

            {realFilter.map((tag) => (
              <Chip
                key={`real-${tag}`}
                label={`Réel: ${tag}`}
                size="small"
                variant="filled"
                color="success"
                onDelete={() =>
                  setRealFilter(realFilter.filter((t) => t !== tag))
                }
              />
            ))}

            <Button
              size="small"
              variant="text"
              onClick={() => {
                setPredFilter([]);
                setRealFilter([]);
              }}
              sx={{ ml: 1 }}
            >
              Effacer tous
            </Button>
          </Stack>
        </Box>
      )}

      <Divider />
    </Stack>
  );
};
