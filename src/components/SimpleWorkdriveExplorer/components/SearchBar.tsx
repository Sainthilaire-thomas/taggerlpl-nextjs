// components/SearchBar.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Chip,
  Typography,
  Collapse,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FolderOpen as FolderIcon,
} from "@mui/icons-material";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching?: boolean;
  searchResults?: {
    totalFound: number;
    searchedFolders: number;
    searchQuery: string;
  };
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  isSearching = false,
  searchResults,
}) => {
  const [query, setQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Recherche avec debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length >= 2) {
      const timeout = setTimeout(() => {
        onSearch(query);
      }, 500); // 500ms de délai
      setSearchTimeout(timeout);
    } else if (query.length === 0) {
      onClear();
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [query, onSearch, onClear]);

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        placeholder="Rechercher un fichier... (min. 2 caractères)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="medium"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isSearching ? (
                <CircularProgress size={20} />
              ) : query ? (
                <IconButton onClick={handleClear} size="small">
                  <ClearIcon />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "background.paper",
          },
        }}
      />

      {/* Résultats de recherche */}
      <Collapse in={!!searchResults?.searchQuery}>
        <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
          <Chip
            icon={<SearchIcon />}
            label={`${searchResults?.totalFound || 0} fichier(s) trouvé(s)`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            icon={<FolderIcon />}
            label={`${searchResults?.searchedFolders || 0} dossier(s) explorés`}
            color="secondary"
            variant="outlined"
            size="small"
          />
          {searchResults?.searchQuery && (
            <Typography variant="caption" color="text.secondary">
              pour "{searchResults.searchQuery}"
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
