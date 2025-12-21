// src/features/phase3-analysis/level0-gold/presentation/components/tuning/CharteTuningPanel.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  Snackbar,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { SuggestionList } from './SuggestionList';
import { CategoryStatsPanel } from './CategoryStatsPanel';
import { charteTuningService } from '@/features/phase3-analysis/level0-gold/domain/services/CharteTuningService';
import type {
  CharteSuggestion,
  CategoryStats,
} from '@/types/algorithm-lab/core/tuning';

interface CharteTuningPanelProps {
  charteId: string;
  testId?: string;
  onSuggestionApplied?: (suggestionId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export const CharteTuningPanel: React.FC<CharteTuningPanelProps> = ({
  charteId,
  testId,
  onSuggestionApplied,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [suggestions, setSuggestions] = useState<CharteSuggestion[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await charteTuningService.getSuggestions({ charte_id: charteId });
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement suggestions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!testId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await charteTuningService.getCategoryStats(testId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
    if (testId) {
      loadStats();
    }
  }, [charteId, testId]);

  const handleApply = async (suggestionId: string) => {
    try {
      setLoading(true);
      const result = await charteTuningService.applySuggestion({
        suggestion_id: suggestionId,
        new_version: '1.1.0',
        applied_changes: { source: 'manual' },
      });

      if (result.success) {
        setSnackbar({
          open: true,
          message: result.message || 'Suggestion appliquée avec succès',
          severity: 'success',
        });
        await loadSuggestions();
        onSuggestionApplied?.(suggestionId);
      } else {
        throw new Error(result.error || 'Erreur application');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur application suggestion',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (suggestionId: string) => {
    setSelectedSuggestionId(suggestionId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedSuggestionId || !rejectionReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Veuillez fournir une raison de rejet',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await charteTuningService.rejectSuggestion({
        suggestion_id: selectedSuggestionId,
        rejection_reason: rejectionReason,
      });

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Suggestion rejetée',
          severity: 'info',
        });
        await loadSuggestions();
        setRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedSuggestionId(null);
      } else {
        throw new Error(result.error || 'Erreur rejet');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur rejet suggestion',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateStats = async () => {
    if (!testId) {
      setSnackbar({
        open: true,
        message: 'Aucun test sélectionné',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await charteTuningService.calculateCategoryStats(testId, charteId);

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Statistiques calculées avec succès',
          severity: 'success',
        });
        await loadStats();
      } else {
        throw new Error(result.error || 'Erreur calcul stats');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur calcul statistiques',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!testId) {
      setSnackbar({
        open: true,
        message: 'Aucun test sélectionné',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await charteTuningService.generateSuggestions(testId, charteId);

      if (result.success) {
        setSnackbar({
          open: true,
          message: `${result.count} suggestion(s) générée(s)`,
          severity: 'success',
        });
        await loadSuggestions();
      } else {
        throw new Error(result.error || 'Erreur génération suggestions');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Erreur génération suggestions',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">🔧 Tuning de la Charte</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadSuggestions();
              if (testId) loadStats();
            }}
            disabled={loading}
          >
            Rafraîchir
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Suggestions (${suggestions.length})`} />
        <Tab label={`Stats par catégorie (${stats.length})`} />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Stack spacing={2} mb={2}>
          <Button
            variant="outlined"
            onClick={handleGenerateSuggestions}
            disabled={loading || !testId}
          >
            Générer suggestions automatiques
          </Button>
        </Stack>
        <SuggestionList
          suggestions={suggestions}
          onApply={handleApply}
          onReject={handleRejectClick}
          loading={loading}
          error={error}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Stack spacing={2} mb={2}>
          <Button
            variant="outlined"
            onClick={handleCalculateStats}
            disabled={loading || !testId}
          >
            Calculer statistiques
          </Button>
        </Stack>
        <CategoryStatsPanel stats={stats} loading={loading} error={error} />
      </TabPanel>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeter la suggestion</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Raison du rejet"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleRejectConfirm} color="error" variant="contained">
            Rejeter
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Paper>
  );
};

export default CharteTuningPanel;
