// src/features/phase3-analysis/level1-validation/ui/components/Results/H2ContributionSection.tsx
/**
 * Section C : Contribution à H2 (Médiation)
 * 
 * Affiche la contribution des calculs à la médiation :
 * - Vue synthétique des médiateurs (M1, M2, M3)
 * - Détail des paths de médiation (Baron-Kenny)
 * - Comparaison avec versions précédentes
 * 
 * Visible pour tous les targets (X, Y, M1, M2, M3)
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  Skeleton,
  Paper,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import type { TargetKind } from '@/types/algorithm-lab/ui/components';
import type {
  H2ContributionSectionProps,
  H2MediationData,
  MediatorResult,
  MediationVerdict,
  MediationPaths,
  H2VersionComparison,
  MEDIATION_VERDICT_CONFIG,
} from '@/types/algorithm-lab/ui/results';

// ============================================================================
// CONSTANTS
// ============================================================================

const VERDICT_CONFIG: Record<MediationVerdict, {
  label: string;
  icon: string;
  color: 'success' | 'warning' | 'info' | 'error';
}> = {
  substantial: { label: 'Médiation substantielle', icon: '✅', color: 'success' },
  partial: { label: 'Médiation partielle', icon: '⚠️', color: 'warning' },
  weak: { label: 'Médiation faible', icon: '⚡', color: 'info' },
  none: { label: 'Pas de médiation', icon: '❌', color: 'error' },
};

const MEDIATOR_LABELS: Record<string, string> = {
  M1: 'Verbes d\'action',
  M2: 'Alignement linguistique',
  M3: 'Charge cognitive',
};

// ============================================================================
// HELPERS
// ============================================================================

const formatPValue = (p: number): string => {
  if (p < 0.001) return '< 0.001';
  if (p < 0.01) return '< 0.01';
  if (p < 0.05) return '< 0.05';
  return p.toFixed(3);
};

const formatEffect = (effect: number): string => {
  return effect.toFixed(3);
};

// ============================================================================
// SUB-COMPONENTS : VERDICT CHIP
// ============================================================================

interface VerdictChipProps {
  verdict: MediationVerdict;
  size?: 'small' | 'medium';
}

const VerdictChip: React.FC<VerdictChipProps> = ({ verdict, size = 'small' }) => {
  const config = VERDICT_CONFIG[verdict];
  return (
    <Chip
      icon={
        verdict === 'substantial' ? <CheckCircleIcon /> :
        verdict === 'partial' ? <WarningIcon /> :
        verdict === 'weak' ? <InfoIcon /> :
        <ErrorIcon />
      }
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
    />
  );
};

// ============================================================================
// SUB-COMPONENTS : MEDIATOR SUMMARY TABLE
// ============================================================================

interface MediatorSummaryTableProps {
  mediators: MediatorResult[];
}

const MediatorSummaryTable: React.FC<MediatorSummaryTableProps> = ({ mediators }) => {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell><strong>Médiateur</strong></TableCell>
            <TableCell align="center">
              <Tooltip title="Effet indirect = a × b (path X→M × path M→Y)">
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <strong>Effet indirect (a×b)</strong>
                  <InfoIcon fontSize="small" color="action" />
                </Stack>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Test de Sobel - significativité de l'effet indirect">
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <strong>Sobel p</strong>
                  <InfoIcon fontSize="small" color="action" />
                </Stack>
              </Tooltip>
            </TableCell>
            <TableCell align="center"><strong>Verdict</strong></TableCell>
            <TableCell align="center"><strong>Qualité données</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mediators.map((m) => (
            <TableRow 
              key={m.mediator}
              sx={{
                bgcolor: m.verdict === 'substantial' 
                  ? alpha(theme.palette.success.main, 0.05)
                  : m.verdict === 'none'
                  ? alpha(theme.palette.error.main, 0.05)
                  : 'transparent',
              }}
            >
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip 
                    label={m.mediator} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {m.label}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={
                    Math.abs(m.indirectEffect) >= 0.25 ? 'success.main' :
                    Math.abs(m.indirectEffect) >= 0.09 ? 'warning.main' :
                    'text.secondary'
                  }
                >
                  {formatEffect(m.indirectEffect)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography 
                  variant="body2"
                  color={m.sobelP < 0.05 ? 'success.main' : 'text.secondary'}
                >
                  {formatPValue(m.sobelP)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <VerdictChip verdict={m.verdict} />
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">
                  {m.dataQuality.available}/{m.dataQuality.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({m.dataQuality.percentage.toFixed(0)}%)
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ============================================================================
// SUB-COMPONENTS : MEDIATION PATH DIAGRAM
// ============================================================================

interface MediationPathDiagramProps {
  mediator: 'M1' | 'M2' | 'M3';
  mediatorLabel: string;
  paths: MediationPaths;
  percentMediation: number;
  sobelZ: number;
  sobelP: number;
  verdict: MediationVerdict;
}

const MediationPathDiagram: React.FC<MediationPathDiagramProps> = ({
  mediator,
  mediatorLabel,
  paths,
  percentMediation,
  sobelZ,
  sobelP,
  verdict,
}) => {
  const theme = useTheme();
  const indirectEffect = paths.a * paths.b;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Diagramme ASCII-style */}
      <Box 
        sx={{ 
          fontFamily: 'monospace', 
          fontSize: '0.85rem',
          bgcolor: 'action.hover',
          p: 2,
          borderRadius: 1,
          textAlign: 'center',
          mb: 2,
        }}
      >
        <Typography component="pre" sx={{ fontFamily: 'inherit', m: 0 }}>
{`                    ${mediator} (${mediatorLabel})
                  ↗                      ↘
           a = ${paths.a.toFixed(2)}                    b = ${paths.b.toFixed(2)}
          (X → ${mediator})                    (${mediator} → Y)
               ↗                          ↘
    X (Stratégie)                          Y (Réaction)
               ↘                          ↗
                    c' = ${paths.cPrime.toFixed(2)}
                   (effet direct)`}
        </Typography>
      </Box>

      {/* Statistiques */}
      <Stack direction="row" spacing={3} flexWrap="wrap" justifyContent="center">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">Effet total (c)</Typography>
          <Typography variant="body2" fontWeight="bold">{paths.c.toFixed(3)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">Effet indirect (a×b)</Typography>
          <Typography 
            variant="body2" 
            fontWeight="bold"
            color={Math.abs(indirectEffect) >= 0.25 ? 'success.main' : 'text.primary'}
          >
            {indirectEffect.toFixed(3)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">% médiation</Typography>
          <Typography variant="body2" fontWeight="bold">{percentMediation.toFixed(0)}%</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">Sobel Z</Typography>
          <Typography variant="body2" fontWeight="bold">{sobelZ.toFixed(2)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">Sobel p</Typography>
          <Typography 
            variant="body2" 
            fontWeight="bold"
            color={sobelP < 0.05 ? 'success.main' : 'warning.main'}
          >
            {formatPValue(sobelP)}
          </Typography>
        </Box>
      </Stack>

      {/* Verdict */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <VerdictChip verdict={verdict} size="medium" />
      </Box>
    </Paper>
  );
};

// ============================================================================
// SUB-COMPONENTS : VERSION COMPARISON
// ============================================================================

interface VersionComparisonTableProps {
  comparisons: H2VersionComparison[];
}

const VersionComparisonTable: React.FC<VersionComparisonTableProps> = ({ comparisons }) => {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell><strong>Médiateur</strong></TableCell>
            <TableCell align="center"><strong>Gold</strong></TableCell>
            <TableCell align="center"><strong>Baseline</strong></TableCell>
            <TableCell align="center"><strong>Dernier test</strong></TableCell>
            <TableCell align="center"><strong>Ce test</strong></TableCell>
            <TableCell align="center"><strong>vs Baseline</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {comparisons.map((comp) => (
            <TableRow key={comp.mediator}>
              <TableCell>
                <Chip label={comp.mediator} size="small" color="primary" variant="outlined" />
              </TableCell>
              <TableCell align="center">
                {comp.gold ? (
                  <Typography variant="body2">{formatEffect(comp.gold.indirectEffect)}</Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">N/A</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                {comp.baseline ? (
                  <Typography variant="body2">{formatEffect(comp.baseline.indirectEffect)}</Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">N/A</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                {comp.lastTest ? (
                  <Typography variant="body2">{formatEffect(comp.lastTest.indirectEffect)}</Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">N/A</Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  {formatEffect(comp.currentTest.indirectEffect)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {comp.vsBaseline ? (
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                    {comp.vsBaseline.improved ? (
                      <TrendingUpIcon fontSize="small" color="success" />
                    ) : (
                      <TrendingDownIcon fontSize="small" color="error" />
                    )}
                    <Typography 
                      variant="body2"
                      color={comp.vsBaseline.improved ? 'success.main' : 'error.main'}
                    >
                      {comp.vsBaseline.indirectEffectDelta > 0 ? '+' : ''}
                      {comp.vsBaseline.indirectEffectDelta.toFixed(3)}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">-</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ============================================================================
// SUB-COMPONENTS : INTERPRETATION
// ============================================================================

interface OverallInterpretationProps {
  interpretation: H2MediationData['overallInterpretation'];
}

const OverallInterpretation: React.FC<OverallInterpretationProps> = ({ interpretation }) => {
  return (
    <Alert 
      severity={interpretation.level}
      sx={{ mt: 2 }}
      icon={
        interpretation.level === 'success' ? <CheckCircleIcon /> :
        interpretation.level === 'warning' ? <WarningIcon /> :
        <ErrorIcon />
      }
    >
      <Typography variant="body2" gutterBottom>
        {interpretation.message}
      </Typography>
      {interpretation.recommendations.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" fontWeight="bold">💡 Recommandations :</Typography>
          {interpretation.recommendations.map((rec, i) => (
            <Typography key={i} variant="body2" sx={{ ml: 2 }}>
              • {rec}
            </Typography>
          ))}
        </Box>
      )}
    </Alert>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const H2LoadingSkeleton: React.FC = () => (
  <Box>
    <Stack direction="row" spacing={2} mb={2}>
      <Skeleton variant="rounded" width={100} height={32} />
      <Skeleton variant="rounded" width={80} height={32} />
    </Stack>
    <Skeleton variant="rounded" width="100%" height={150} />
    <Skeleton variant="rounded" width="100%" height={100} sx={{ mt: 2 }} />
  </Box>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

interface H2EmptyStateProps {
  onRefresh?: () => void;
}

const H2EmptyState: React.FC<H2EmptyStateProps> = ({ onRefresh }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <AccountTreeIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
    <Typography variant="body1" color="text.secondary" gutterBottom>
      Aucune donnée de médiation H2 disponible
    </Typography>
    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
      Les calculs de médiation nécessitent des données M1, M2 et M3.
    </Typography>
    {onRefresh && (
      <Button
        variant="outlined"
        size="small"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
      >
        Calculer
      </Button>
    )}
  </Box>
);

// ============================================================================
// LEGEND
// ============================================================================

const MediationLegend: React.FC = () => (
  <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
      <strong>Légende des seuils (Cohen 1988, Kenny) :</strong>
    </Typography>
    <Stack direction="row" spacing={2} flexWrap="wrap">
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <CheckCircleIcon fontSize="small" color="success" />
        <Typography variant="caption">Substantielle : effet ≥ 0.25, p &lt; 0.01</Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <WarningIcon fontSize="small" color="warning" />
        <Typography variant="caption">Partielle : effet 0.09-0.24, p &lt; 0.05</Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <InfoIcon fontSize="small" color="info" />
        <Typography variant="caption">Faible : effet 0.01-0.08, p &lt; 0.10</Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <ErrorIcon fontSize="small" color="error" />
        <Typography variant="caption">Nulle : effet &lt; 0.01 ou p ≥ 0.10</Typography>
      </Stack>
    </Stack>
  </Paper>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const H2ContributionSection: React.FC<H2ContributionSectionProps> = ({
  targetKind,
  mediationData,
  runId,
  loading,
  onRefresh,
  onNavigateToLevel2,
  defaultExpanded = false,
}) => {
  const [expandedMediator, setExpandedMediator] = useState<string | false>(false);

  const handleAccordionChange = (mediator: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedMediator(isExpanded ? mediator : false);
  };

  // Compter les médiations significatives
  const significantCount = mediationData?.mediators.filter(
    m => m.verdict === 'substantial' || m.verdict === 'partial'
  ).length || 0;

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AccountTreeIcon color="primary" />
            <Typography variant="h6">
              Section C : Contribution à H2 (Médiation)
            </Typography>
            <Chip label={targetKind} color="primary" size="small" />
            {mediationData && (
              <Chip
                icon={significantCount > 0 ? <CheckCircleIcon /> : <WarningIcon />}
                label={`${significantCount}/3 significatifs`}
                color={significantCount >= 2 ? 'success' : significantCount >= 1 ? 'warning' : 'error'}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
          
          <Stack direction="row" spacing={1}>
            {onRefresh && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
              >
                Recalculer
              </Button>
            )}
            {onNavigateToLevel2 && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<NavigateNextIcon />}
                onClick={onNavigateToLevel2}
              >
                Détails Level 2
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Rappel H2 */}
        <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
          <Typography variant="body2">
            <strong>H2 (Médiation) :</strong> L'effet X → Y passe par des médiateurs. 
            M1 = densité verbes d'action, M2 = alignement linguistique, M3 = charge cognitive.
          </Typography>
        </Alert>

        {/* Contenu */}
        {loading ? (
          <H2LoadingSkeleton />
        ) : mediationData ? (
          <>
            {/* Légende */}
            <MediationLegend />

            {/* Tableau synthétique */}
            <MediatorSummaryTable mediators={mediationData.mediators} />

            {/* Détails par médiateur (accordéons) */}
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              📊 Détail des paths de médiation
            </Typography>
            
            {mediationData.mediators.map((m) => (
              <Accordion
                key={m.mediator}
                expanded={expandedMediator === m.mediator}
                onChange={handleAccordionChange(m.mediator)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Chip label={m.mediator} size="small" color="primary" />
                    <Typography variant="body2">{m.label}</Typography>
                    <VerdictChip verdict={m.verdict} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <MediationPathDiagram
                    mediator={m.mediator}
                    mediatorLabel={m.label}
                    paths={m.paths}
                    percentMediation={m.percentMediation}
                    sobelZ={m.sobelZ}
                    sobelP={m.sobelP}
                    verdict={m.verdict}
                  />
                </AccordionDetails>
              </Accordion>
            ))}

            {/* Comparaison avec versions précédentes */}
            {mediationData.comparisons.length > 0 && (
              <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    📈 Comparaison avec versions précédentes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <VersionComparisonTable comparisons={mediationData.comparisons} />
                </AccordionDetails>
              </Accordion>
            )}

            {/* Interprétation globale */}
            <OverallInterpretation interpretation={mediationData.overallInterpretation} />
          </>
        ) : (
          <H2EmptyState onRefresh={onRefresh} />
        )}

        {/* Run ID */}
        {runId && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', mt: 2, textAlign: 'right' }}
          >
            Run ID: {runId.slice(0, 8)}...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default H2ContributionSection;
