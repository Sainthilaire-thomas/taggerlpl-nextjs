/**
 * Level0GlobalHeader.tsx
 * 
 * Header global pour Level 0 affichant:
 * - Variable actuelle (X ou Y) avec sélecteur
 * - Gold standard associé
 * - Statistiques rapides (tests, Kappa)
 * 
 * Résout problèmes ergonomiques #1 (Variable cachée) et #4 (Changement variable caché)
 * 
 * Sprint 6 - Session 7
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

export interface GoldStandard {
  gold_standard_id: string;
  name: string;
  description: string;
  modality: string;
  variable: string;
}

interface Level0GlobalHeaderProps {
  /** Variable actuelle sélectionnée */
  variable: 'X' | 'Y';
  
  /** Callback quand variable change */
  onVariableChange: (newVariable: 'X' | 'Y') => void;
  
  /** Gold standard actif pour cette variable (optionnel) */
  goldStandard?: GoldStandard;
  
  /** Nombre de tests effectués */
  testsCount: number;
  
  /** Kappa moyen des tests */
  averageKappa: number;
  
  /** Nombre de chartes créées pour cette variable */
  chartesCount: number;
}

export const Level0GlobalHeader: React.FC<Level0GlobalHeaderProps> = ({
  variable,
  onVariableChange,
  goldStandard,
  testsCount,
  averageKappa,
  chartesCount,
}) => {
  const handleVariableChange = (event: SelectChangeEvent<'X' | 'Y'>) => {
    onVariableChange(event.target.value as 'X' | 'Y');
  };

  const getVariableLabel = (v: 'X' | 'Y'): string => {
    return v === 'X' 
      ? 'X - Stratégies Conseiller' 
      : 'Y - Réactions Client';
  };

  const getVariableDescription = (v: 'X' | 'Y'): string => {
    return v === 'X'
      ? 'Classification des stratégies utilisées par les conseillers (ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION)'
      : 'Classification des réactions des clients (CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF)';
  };

  const formatKappa = (kappa: number): string => {
    if (kappa === 0 || isNaN(kappa)) return '-';
    return kappa.toFixed(3);
  };

  const getKappaColor = (kappa: number): 'error' | 'warning' | 'info' | 'success' => {
    if (kappa < 0.4) return 'error';
    if (kappa < 0.6) return 'warning';
    if (kappa < 0.8) return 'info';
    return 'success';
  };

  const getKappaLabel = (kappa: number): string => {
    if (kappa < 0.4) return 'Faible';
    if (kappa < 0.6) return 'Modéré';
    if (kappa < 0.8) return 'Substantiel';
    return 'Excellent';
  };

  return (
    <Card 
      elevation={2}
      sx={{ 
        mb: 3,
        borderLeft: 4,
        borderColor: variable === 'X' ? 'primary.main' : 'secondary.main',
      }}
    >
      <CardContent>
        {/* Ligne principale */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
        }}>
          {/* Titre et info */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            minWidth: { xs: '100%', md: '250px' },
          }}>
            <ScienceIcon color="primary" />
            <Typography variant="h6" component="h2">
              Level 0 - Gold Standard
            </Typography>
            <Tooltip 
              title="Level 0 permet de créer des gold standards (annotations de référence) et de trouver la meilleure formulation de charte automatique pour chaque modalité d'annotation."
              arrow
            >
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider 
            orientation="vertical" 
            flexItem 
            sx={{ 
              display: { xs: 'none', md: 'block' },
              height: 40,
              alignSelf: 'center',
            }} 
          />

          {/* Sélecteur Variable */}
          <Box sx={{ 
            minWidth: { xs: '100%', md: '300px' },
            maxWidth: { xs: '100%', md: '350px' },
            flex: { md: '1' },
          }}>
            <FormControl fullWidth size="small">
              <InputLabel id="variable-select-label">Variable actuelle</InputLabel>
              <Select
                labelId="variable-select-label"
                id="variable-select"
                value={variable}
                label="Variable actuelle"
                onChange={handleVariableChange}
              >
                <MenuItem value="X">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      X - Stratégies Conseiller
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      4 catégories (ENGAGEMENT, OUVERTURE, ...)
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="Y">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Y - Réactions Client
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      3 catégories (POSITIF, NEUTRE, NEGATIF)
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Gold Standard actif */}
          <Box sx={{ 
            minWidth: { xs: '100%', md: '200px' },
            flex: { md: '1' },
          }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Gold Standard Actif
            </Typography>
            {goldStandard ? (
              <Tooltip title={`${goldStandard.description} (Modalité: ${goldStandard.modality})`}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={goldStandard.name}
                  color="success"
                  size="small"
                  sx={{ maxWidth: '100%' }}
                />
              </Tooltip>
            ) : (
              <Chip
                label="Aucun gold standard"
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Statistiques rapides */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            minWidth: { xs: '100%', md: '150px' },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {chartesCount} {chartesCount === 1 ? 'charte' : 'chartes'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {testsCount} {testsCount === 1 ? 'test' : 'tests'}
              </Typography>
            </Box>
            {testsCount > 0 && (
              <Tooltip title={`${getKappaLabel(averageKappa)} (${formatKappa(averageKappa)})`}>
                <Chip
                  label={`Kappa: ${formatKappa(averageKappa)}`}
                  color={getKappaColor(averageKappa)}
                  size="small"
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Description variable */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Variable {variable} :</strong> {getVariableDescription(variable)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Level0GlobalHeader;
