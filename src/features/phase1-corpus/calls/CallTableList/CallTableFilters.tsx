"use client";

import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
  Typography,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { FilterState } from "./types";

interface CallTableFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  uniqueOrigines: string[];
  resultCount: number;
  isMobile?: boolean;
}

const CallTableFilters = ({
  filters,
  onFiltersChange,
  uniqueOrigines,
  resultCount,
  isMobile = false,
}: CallTableFiltersProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value,
    });
  };

  const handleStatusChange = (e: any) => {
    onFiltersChange({
      ...filters,
      statusFilter: e.target.value,
    });
  };

  const handleAudioChange = (e: any) => {
    onFiltersChange({
      ...filters,
      audioFilter: e.target.value,
    });
  };

  const handleOrigineChange = (e: any) => {
    onFiltersChange({
      ...filters,
      origineFilter: e.target.value,
    });
  };

  if (isMobile) {
    return (
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher par nom, description ou ID..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filters.statusFilter}
              label="Statut"
              onChange={handleStatusChange}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="non_supervisé">Non supervisé</MenuItem>
              <MenuItem value="en_cours">En cours</MenuItem>
              <MenuItem value="évalué">Évalué</MenuItem>
              <MenuItem value="terminé">Terminé</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Audio</InputLabel>
            <Select
              value={filters.audioFilter}
              label="Audio"
              onChange={handleAudioChange}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="with_audio">Avec audio</MenuItem>
              <MenuItem value="without_audio">Sans audio</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Origine</InputLabel>
            <Select
              value={filters.origineFilter}
              label="Origine"
              onChange={handleOrigineChange}
            >
              <MenuItem value="all">Toutes</MenuItem>
              {uniqueOrigines.map((origine: string) => (
                <MenuItem key={origine} value={origine}>
                  {origine}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems="center"
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Rechercher par nom, description ou ID..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={filters.statusFilter}
            label="Statut"
            onChange={handleStatusChange}
          >
            <MenuItem value="all">Tous les statuts</MenuItem>
            <MenuItem value="non_supervisé">Non supervisé</MenuItem>
            <MenuItem value="en_cours">En cours</MenuItem>
            <MenuItem value="évalué">Évalué</MenuItem>
            <MenuItem value="coaching_planifié">Coaching planifié</MenuItem>
            <MenuItem value="terminé">Terminé</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Audio</InputLabel>
          <Select
            value={filters.audioFilter}
            label="Audio"
            onChange={handleAudioChange}
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="with_audio">Avec audio</MenuItem>
            <MenuItem value="without_audio">Sans audio</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Origine</InputLabel>
          <Select
            value={filters.origineFilter}
            label="Origine"
            onChange={handleOrigineChange}
          >
            <MenuItem value="all">Toutes les origines</MenuItem>
            {uniqueOrigines.map((origine: string) => (
              <MenuItem key={origine} value={origine}>
                {origine}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" color="textSecondary">
          {resultCount} appel(s) trouvé(s)
        </Typography>
      </Stack>
    </Paper>
  );
};

export default CallTableFilters;
