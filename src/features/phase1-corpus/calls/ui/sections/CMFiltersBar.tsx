import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { Search, ClearAll, SelectAll } from "@mui/icons-material";
import type { CallManagementFilters } from "../hooks/useUnifiedCallManagement"; // ✅ import du type du hook

// ✅ on s'aligne sur les types du hook unifié
type Props = {
  filters: CallManagementFilters; // on peut passer l'objet complet (on n'en lit qu'une partie)
  updateFilters: (p: Partial<CallManagementFilters>) => void; // même signature que le hook
  resetFilters: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  uniqueOrigins: string[];
};

export function CMFiltersBar({
  filters,
  updateFilters,
  resetFilters,
  selectAll,
  clearSelection,
  uniqueOrigins,
}: Props) {
  return (
    <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
      <Box sx={{ flex: "1 1 250px", minWidth: 200 }}>
        <TextField
          fullWidth
          size="small"
          label="Recherche"
          value={filters.searchKeyword}
          onChange={(e) => updateFilters({ searchKeyword: e.target.value })}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Box>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Type d'Appel</InputLabel>
        <Select
          value={filters.conflictStatus}
          label="Type d'Appel"
          onChange={(e) =>
            updateFilters({
              conflictStatus: e.target
                .value as CallManagementFilters["conflictStatus"], // ✅ union stricte
            })
          }
        >
          <MenuItem value="all">Tous</MenuItem>
          <MenuItem value="conflictuel">🔴 Conflictuels</MenuItem>
          <MenuItem value="non_conflictuel">🟢 Non conflictuels</MenuItem>
          <MenuItem value="non_supervisé">⚪ Non supervisés</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>Origine</InputLabel>
        <Select
          value={filters.origin}
          label="Origine"
          onChange={(e) => updateFilters({ origin: e.target.value as string })}
        >
          <MenuItem value="all">Toutes</MenuItem>
          {uniqueOrigins.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box display="flex" gap={1}>
        <Button size="small" onClick={resetFilters} startIcon={<ClearAll />}>
          Reset
        </Button>
        <Button size="small" onClick={selectAll} startIcon={<SelectAll />}>
          Tout sélectionner
        </Button>
        <Button size="small" onClick={clearSelection}>
          Désélectionner
        </Button>
      </Box>
    </Box>
  );
}
