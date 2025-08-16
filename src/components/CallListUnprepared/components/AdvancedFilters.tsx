// components/AdvancedFilters.tsx
import React from "react";
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import FilterInput from "../../FilterInput";
import { PreparationFilters } from "../types";
import { FILTER_OPTIONS } from "../constants";

interface AdvancedFiltersProps {
  filters: PreparationFilters;
  onFilterChange: (filterType: keyof PreparationFilters, value: string) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleSelectChange =
    (filterType: keyof PreparationFilters) => (event: SelectChangeEvent) => {
      onFilterChange(filterType, event.target.value);
    };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        🔍 Filtres avancés
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>État</InputLabel>
          <Select value={filters.state} onChange={handleSelectChange("state")}>
            {FILTER_OPTIONS.STATE.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Contenu</InputLabel>
          <Select
            value={filters.content}
            onChange={handleSelectChange("content")}
          >
            {FILTER_OPTIONS.CONTENT.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={filters.status}
            onChange={handleSelectChange("status")}
          >
            {FILTER_OPTIONS.STATUS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <FilterInput
        filterValue={filters.keyword}
        setFilterValue={(value) => onFilterChange("keyword", value)}
      />
    </Paper>
  );
};

export default AdvancedFilters;
