'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { GoldStandardService, GoldStandard, GoldStandardCompleteness } from '../../domain/services/GoldStandardService';

interface GoldStandardWithStats extends GoldStandard {
  completeness?: GoldStandardCompleteness;
  stats?: {
    totalPairs: number;
    byTag: Record<string, number>;
  };
}

interface GoldStandardManagerProps {
  onCreateNew?: () => void;
  onCreateByDerivation?: () => void;
}

export const GoldStandardManager: React.FC<GoldStandardManagerProps> = ({
  onCreateNew,
  onCreateByDerivation,
}) => {
  const [goldStandards, setGoldStandards] = useState<GoldStandardWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoldStandards = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger tous les gold standards
      const gsList = await GoldStandardService.getAllGoldStandards();

      // Enrichir avec statistiques de complétude
      const enriched = await Promise.all(
        gsList.map(async (gs) => {
          try {
            const [completeness, stats] = await Promise.all([
              GoldStandardService.checkCompleteness(gs.gold_standard_id),
              GoldStandardService.getGoldStandardStats(gs.gold_standard_id),
            ]);

            return {
              ...gs,
              completeness,
              stats,
            };
          } catch (err) {
            console.error(`Error loading stats for ${gs.gold_standard_id}:`, err);
            return gs;
          }
        })
      );

      setGoldStandards(enriched);
    } catch (err) {
      console.error('Error loading gold standards:', err);
      setError('Erreur lors du chargement des gold standards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoldStandards();
  }, []);

  const getModalityColor = (modality: string) => {
    switch (modality) {
      case 'audio':
        return 'primary';
      case 'text_only':
        return 'secondary';
      case 'audio_text':
        return 'success';
      default:
        return 'default';
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'audio':
        return '🎧';
      case 'text_only':
        return '📝';
      case 'audio_text':
        return '🎧📝';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button size="small" onClick={loadGoldStandards} sx={{ ml: 2 }}>
          Réessayer
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Gestion des Gold Standards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {goldStandards.length} gold standard{goldStandards.length > 1 ? 's' : ''} disponible{goldStandards.length > 1 ? 's' : ''}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Tooltip title="Rafraîchir">
            <IconButton onClick={loadGoldStandards} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {onCreateByDerivation && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onCreateByDerivation}
            >
              Créer par Dérivation ⚡
            </Button>
          )}
          
          {onCreateNew && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onCreateNew}
            >
              Nouveau Gold Standard
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Info Alert */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Création par dérivation :</strong> Créez un nouveau gold standard en 30 minutes en copiant les accords d'un test existant (au lieu de 15h d'annotation complète).
        </Typography>
      </Alert>

      {/* Table des Gold Standards */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Gold Standard</strong></TableCell>
              <TableCell><strong>Variable</strong></TableCell>
              <TableCell><strong>Modalité</strong></TableCell>
              <TableCell><strong>Complétude</strong></TableCell>
              <TableCell><strong>Distribution Tags</strong></TableCell>
              <TableCell><strong>Créé le</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {goldStandards.map((gs) => (
              <TableRow key={gs.gold_standard_id} hover>
                {/* Nom */}
                <TableCell>
                  <Stack>
                    <Typography variant="body1" fontWeight="medium">
                      {gs.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {gs.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      ID: <code>{gs.gold_standard_id}</code>
                    </Typography>
                  </Stack>
                </TableCell>

                {/* Variable */}
                <TableCell>
                  <Chip
                    label={gs.variable}
                    color={gs.variable === 'X' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>

                {/* Modalité */}
                <TableCell>
                  <Chip
                    label={`${getModalityIcon(gs.modality)} ${gs.modality}`}
                    color={getModalityColor(gs.modality)}
                    size="small"
                  />
                </TableCell>

                {/* Complétude */}
                <TableCell>
                  {gs.completeness ? (
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        {gs.completeness.isComplete ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <WarningIcon color="warning" fontSize="small" />
                        )}
                        <Typography variant="body2">
                          {gs.completeness.annotatedPairs} / {gs.completeness.totalPairs}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={gs.completeness.completionRate}
                        color={gs.completeness.isComplete ? 'success' : 'warning'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {gs.completeness.completionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Chargement...
                    </Typography>
                  )}
                </TableCell>

                {/* Distribution Tags */}
                <TableCell>
                  {gs.stats ? (
                    <Stack spacing={0.5}>
                      {Object.entries(gs.stats.byTag)
                        .sort((a, b) => b[1] - a[1])
                        .map(([tag, count]) => (
                          <Typography key={tag} variant="caption">
                            <strong>{tag}:</strong> {count} ({((count / gs.stats!.totalPairs) * 100).toFixed(0)}%)
                          </Typography>
                        ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>

                {/* Date création */}
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(gs.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {goldStandards.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucun gold standard disponible. Créez-en un pour commencer !
        </Alert>
      )}
    </Box>
  );
};
