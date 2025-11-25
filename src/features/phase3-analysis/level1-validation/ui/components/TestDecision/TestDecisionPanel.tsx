// src/features/phase3-analysis/level1-validation/ui/components/TestDecision/TestDecisionPanel.tsx

/**
 * Panel de décision post-test
 * Permet de choisir entre : Rejeter / Investiguer / Valider
 * Phase 3 - Level 1 Validation
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  CheckCircle as ValidateIcon,
  Cancel as RejectIcon,
  Search as InvestigateIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';
import type { BaselineDiff } from '@/types/algorithm-lab/versioning';

interface TestDecisionPanelProps {
  runId: string;
  metrics: ValidationMetrics;
  baselineDiff?: BaselineDiff | null;
  onDecision: (decision: 'discarded' | 'investigating' | 'promoted') => void;
  disabled?: boolean;
}

export function TestDecisionPanel({
  runId,
  metrics,
  baselineDiff,
  onDecision,
  disabled = false,
}: TestDecisionPanelProps) {
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatDelta = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}%`;
  };

  const getDeltaColor = (value: number) => {
    if (value > 0.05) return 'success.main';
    if (value < -0.05) return 'error.main';
    return 'text.secondary';
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🎯 Décision post-test
        </Typography>

        {/* Métriques principales */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Métriques du test
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip
              label={`Accuracy: ${formatPercent(metrics.accuracy)}`}
              color="primary"
              variant="outlined"
            />
            {metrics.kappa && (
              <Chip
                label={`Kappa: ${metrics.kappa.toFixed(3)}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {/* Comparaison baseline */}
        {baselineDiff && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Comparaison avec baseline
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {baselineDiff.accuracy_delta > 0 ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ color: getDeltaColor(baselineDiff.accuracy_delta) }}
                  >
                    Accuracy: {formatDelta(baselineDiff.accuracy_delta)}
                  </Typography>
                </Box>

                {baselineDiff.kappa_delta !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {baselineDiff.kappa_delta > 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ color: getDeltaColor(baselineDiff.kappa_delta) }}
                    >
                      Kappa: {formatDelta(baselineDiff.kappa_delta)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Corrections: {baselineDiff.corrections.toFixed(0)} • 
                    Régressions: {baselineDiff.regressions.toFixed(0)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </>
        )}

        {/* Message d'aide */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Choisissez une action pour ce test. Vous pouvez le rejeter, l'investiguer pour
          analyser les erreurs, ou le valider comme nouvelle version.
        </Alert>

        {/* Boutons de décision */}
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => onDecision('discarded')}
            disabled={disabled}
            sx={{ minWidth: 130 }}
          >
            Rejeter
          </Button>

          <Button
            variant="outlined"
            color="warning"
            startIcon={<InvestigateIcon />}
            onClick={() => onDecision('investigating')}
            disabled={disabled}
            sx={{ minWidth: 130 }}
          >
            Investiguer
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<ValidateIcon />}
            onClick={() => onDecision('promoted')}
            disabled={disabled}
            sx={{ minWidth: 130 }}
          >
            Valider
          </Button>
        </Stack>

        {/* Run ID pour référence */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 2 }}
        >
          Run ID: {runId.slice(0, 8)}...
        </Typography>
      </CardContent>
    </Card>
  );
}
