// src/features/phase3-analysis/level0-gold/presentation/components/tuning/SuggestionList.tsx

'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import { SuggestionCard } from './SuggestionCard';
import type {
  CharteSuggestion,
  SuggestionStatus,
  SuggestionPriority,
} from '@/types/algorithm-lab/core/tuning';

interface SuggestionListProps {
  suggestions: CharteSuggestion[];
  onApply?: (suggestionId: string) => void;
  onReject?: (suggestionId: string) => void;
  onView?: (suggestionId: string) => void;
  loading?: boolean;
  error?: string | null;
}

type SortOption = 'priority' | 'date' | 'status';

export const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  onApply,
  onReject,
  onView,
  loading = false,
  error = null,
}) => {
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<SuggestionPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedSuggestions = useMemo(() => {
    let filtered = [...suggestions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((s) => s.priority === priorityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.description.toLowerCase().includes(query) ||
          s.category?.toLowerCase().includes(query) ||
          s.supporting_data?.pattern?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [suggestions, statusFilter, priorityFilter, searchQuery, sortBy]);

  const paginatedSuggestions = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedSuggestions.slice(start, end);
  }, [filteredAndSortedSuggestions, page]);

  const totalPages = Math.ceil(filteredAndSortedSuggestions.length / itemsPerPage);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <FilterIcon color="action" />
        <Typography variant="h6">Suggestions d'amélioration</Typography>
        <Chip label={`${filteredAndSortedSuggestions.length} résultat(s)`} size="small" />
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <TextField
          label="Rechercher"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          sx={{ flex: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statusFilter}
            label="Statut"
            onChange={(e) => {
              setStatusFilter(e.target.value as SuggestionStatus | 'all');
              setPage(1);
            }}
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="pending">En attente</MenuItem>
            <MenuItem value="applied_pending_validation">Appliquée (validation)</MenuItem>
            <MenuItem value="applied_validated">Validée</MenuItem>
            <MenuItem value="applied_rolled_back">Annulée</MenuItem>
            <MenuItem value="rejected">Rejetée</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priorité</InputLabel>
          <Select
            value={priorityFilter}
            label="Priorité"
            onChange={(e) => {
              setPriorityFilter(e.target.value as SuggestionPriority | 'all');
              setPage(1);
            }}
          >
            <MenuItem value="all">Toutes</MenuItem>
            <MenuItem value={1}>Haute</MenuItem>
            <MenuItem value={2}>Moyenne</MenuItem>
            <MenuItem value={3}>Basse</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trier par</InputLabel>
          <Select
            value={sortBy}
            label="Trier par"
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <MenuItem value="priority">Priorité</MenuItem>
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="status">Statut</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {filteredAndSortedSuggestions.length === 0 ? (
        <Alert severity="info">
          Aucune suggestion trouvée avec les filtres sélectionnés.
        </Alert>
      ) : (
        <>
          <Stack spacing={2}>
            {paginatedSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.suggestion_id}
                suggestion={suggestion}
                onApply={onApply}
                onReject={onReject}
                onView={onView}
              />
            ))}
          </Stack>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SuggestionList;
