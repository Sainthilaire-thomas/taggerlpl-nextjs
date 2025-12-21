// src/features/phase3-analysis/level0-gold/presentation/components/tuning/CategoryStatsPanel.tsx

'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { CategoryStats } from '@/types/algorithm-lab/core/tuning';

interface CategoryStatsPanelProps {
  stats: CategoryStats[];
  loading?: boolean;
  error?: string | null;
}

const getAccuracyColor = (accuracy: number): 'error' | 'warning' | 'success' => {
  if (accuracy < 0.5) return 'error';
  if (accuracy < 0.7) return 'warning';
  return 'success';
};

const getAccuracyIcon = (accuracy: number) => {
  if (accuracy < 0.5) return <ErrorIcon fontSize="small" />;
  if (accuracy < 0.7) return <WarningIcon fontSize="small" />;
  return <CheckCircleIcon fontSize="small" />;
};

export const CategoryStatsPanel: React.FC<CategoryStatsPanelProps> = ({
  stats,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Statistiques par catégorie
        </Typography>
        <LinearProgress />
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

  if (stats.length === 0) {
    return (
      <Alert severity="info">
        Aucune statistique disponible. Calculez d'abord les stats pour un test.
      </Alert>
    );
  }

  const problematicCategories = stats.filter((s) => s.accuracy < 0.5);

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h6">Statistiques par catégorie</Typography>
        <Chip label={`${stats.length} catégorie(s)`} size="small" />
        {problematicCategories.length > 0 && (
          <Chip
            label={`${problematicCategories.length} problème(s)`}
            color="error"
            size="small"
            icon={<WarningIcon />}
          />
        )}
      </Stack>

      {problematicCategories.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>{problematicCategories.length} catégorie(s)</strong> avec accuracy {'<'} 50%
            nécessitent une attention particulière.
          </Typography>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Catégorie</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Total</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Corrects</strong>
              </TableCell>
              <TableCell align="center">
                <strong>CAS A</strong>
              </TableCell>
              <TableCell align="center">
                <strong>CAS B</strong>
              </TableCell>
              <TableCell align="center">
                <strong>CAS C</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Accuracy</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Statut</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((stat) => (
              <TableRow
                key={stat.stat_id}
                sx={{
                  bgcolor: stat.accuracy < 0.5 ? 'error.lighter' : 'inherit',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {stat.category}
                  </Typography>
                </TableCell>
                <TableCell align="center">{stat.total_instances}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={stat.correct_predictions}
                    size="small"
                    color={stat.correct_predictions > 0 ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={stat.cas_a_count}
                    size="small"
                    color={stat.cas_a_count > 0 ? 'error' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={stat.cas_b_count}
                    size="small"
                    color={stat.cas_b_count > 0 ? 'warning' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={stat.cas_c_count}
                    size="small"
                    color={stat.cas_c_count > 0 ? 'info' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    {getAccuracyIcon(stat.accuracy)}
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={`${getAccuracyColor(stat.accuracy)}.main`}
                    >
                      {(stat.accuracy * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={
                      stat.accuracy < 0.5
                        ? 'Problème'
                        : stat.accuracy < 0.7
                        ? 'Attention'
                        : 'OK'
                    }
                    color={getAccuracyColor(stat.accuracy)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          CAS A = LLM correct, annotation manuelle incorrecte | CAS B = LLM incorrect | CAS C =
          Accord (les deux corrects)
        </Typography>
      </Box>
    </Box>
  );
};

export default CategoryStatsPanel;
