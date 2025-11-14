"use client";
import React from "react";
import {
  Stack,
  Autocomplete,
  TextField,
  Chip,
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
              placeholder="Sélectionnez les tags prédits."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                variant="outlined"
                label={option}
                size="small"
                color="primary"
              />
            ))
          }
          sx={{ minWidth: 260, flex: 1 }}
          noOptionsText="Aucun tag trouvé"
          clearText="Effacer"
          closeText="Fermer"
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
              placeholder="Sélectionnez les tags réels."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                variant="outlined"
                label={option}
                size="small"
                color="success"
              />
            ))
          }
          sx={{ minWidth: 260, flex: 1 }}
          noOptionsText="Aucun tag trouvé"
          clearText="Effacer"
          closeText="Fermer"
        />
      </Stack>

      {(predFilter.length > 0 || realFilter.length > 0) && (
        <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Filtres actifs :
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {predFilter.map((t) => (
              <Chip key={`pred-${t}`} label={t} size="small" color="primary" />
            ))}
            {realFilter.map((t) => (
              <Chip key={`real-${t}`} label={t} size="small" color="success" />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};
