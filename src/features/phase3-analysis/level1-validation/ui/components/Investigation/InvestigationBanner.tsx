// src/features/phase3-analysis/level1-validation/ui/components/Investigation/InvestigationBanner.tsx

/**
 * Bandeau d'investigation actif
 * S'affiche en haut de l'écran pendant qu'une investigation est en cours
 * Phase 3 - Level 1 Validation
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CompleteIcon,
  Assignment as SummaryIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';

interface InvestigationBannerProps {
  investigationId: string;
  startedAt: Date;
  annotationCount: number;
  onViewSummary: () => void;
  onComplete: () => void;
  onCancel?: () => void;
}

export function InvestigationBanner({
  investigationId,
  startedAt,
  annotationCount,
  onViewSummary,
  onComplete,
  onCancel,
}: InvestigationBannerProps) {
  const formatDuration = (start: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'moins d\'1 min';
    if (diffMins < 60) return `${diffMins} min`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const [duration, setDuration] = React.useState(() => formatDuration(startedAt));

  // Mettre à jour la durée toutes les minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDuration(formatDuration(startedAt));
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'warning.light',
        borderRadius: 0,
        borderBottom: 2,
        borderColor: 'warning.main',
      }}
    >
      <Box sx={{ px: 3, py: 1.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          {/* Info investigation */}
          <Stack direction="row" alignItems="center" spacing={2} flex={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'warning.dark',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
            
            <Typography variant="body1" fontWeight={600} color="warning.dark">
              🔍 Investigation en cours
            </Typography>

            <Chip
              icon={<TimerIcon />}
              label={duration}
              size="small"
              color="warning"
              variant="outlined"
            />

            <Chip
              label={`${annotationCount} annotation${annotationCount > 1 ? 's' : ''}`}
              size="small"
              color="warning"
              variant="filled"
            />

            <Typography variant="caption" color="text.secondary">
              Run: {investigationId.slice(0, 8)}...
            </Typography>
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SummaryIcon />}
              onClick={onViewSummary}
              sx={{ color: 'warning.dark', borderColor: 'warning.dark' }}
            >
              Voir résumé
            </Button>

            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={onComplete}
            >
              Terminer
            </Button>

            {onCancel && (
              <Tooltip title="Annuler l'investigation">
                <IconButton
                  size="small"
                  onClick={onCancel}
                  sx={{ color: 'warning.dark' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}
