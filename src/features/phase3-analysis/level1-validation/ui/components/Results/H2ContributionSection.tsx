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
  MByReactionStats,
  AnovaResult,
  MediatorCorrelation,
  ControlledMediationResult,
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
// NEW SUB-COMPONENTS - M BY REACTION, CORRELATIONS, CONTROLLED MEDIATION
// ============================================================================

/**
 * Tableau M par réaction avec ANOVA (pour M1)
 */
interface MByReactionTableProps {
  data: MByReactionStats[];
  anova: AnovaResult;
  mediatorLabel: string;
}

const MByReactionTable: React.FC<MByReactionTableProps> = ({ data, anova, mediatorLabel }) => {
  const theme = useTheme();
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📊 Prérequis : {mediatorLabel} par Réaction (path b : M → Y)
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Réaction</strong></TableCell>
              <TableCell align="right"><strong>Moyenne</strong></TableCell>
              <TableCell align="right"><strong>Écart-type</strong></TableCell>
              <TableCell align="right"><strong>N</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.reaction}>
                <TableCell>
                  <Chip 
                    label={row.reaction} 
                    size="small" 
                    color={
                      row.reaction === 'POSITIF' ? 'success' : 
                      row.reaction === 'NEGATIF' ? 'error' : 'default'
                    }
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {row.mean.toFixed(3)}
                  </Typography>
                </TableCell>
                <TableCell align="right">{row.stdDev.toFixed(3)}</TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Résultat ANOVA */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
          <Typography variant="body2">
            <strong>ANOVA :</strong> F({anova.dfBetween}, {anova.dfWithin}) = {anova.fStatistic.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            <strong>p-value :</strong> {anova.pValue < 0.001 ? '< 0.001' : anova.pValue.toFixed(3)}
          </Typography>
          <Chip 
            icon={anova.isSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
            label={anova.isSignificant ? 'Significatif' : 'Non significatif'}
            color={anova.isSignificant ? 'success' : 'error'}
            size="small"
          />
        </Stack>
        {anova.isSignificant && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            ✅ Le médiateur influence significativement la réaction client (prérequis validé)
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

/**
 * Panel de corrélation M1 → M2 ou M1 → M3
 */
interface CorrelationPanelProps {
  correlation: MediatorCorrelation;
}

const CorrelationPanel: React.FC<CorrelationPanelProps> = ({ correlation }) => {
  const theme = useTheme();
  const isPositive = correlation.pearsonR > 0;
  const strength = Math.abs(correlation.pearsonR) >= 0.5 ? 'forte' : 
                   Math.abs(correlation.pearsonR) >= 0.3 ? 'modérée' : 'faible';
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🔗 Corrélation {correlation.from} → {correlation.to}
      </Typography>
      
      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Pearson r</Typography>
            <Typography 
              variant="h5" 
              fontWeight="bold"
              color={isPositive ? 'success.main' : 'error.main'}
            >
              {correlation.pearsonR.toFixed(3)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">p-value</Typography>
            <Typography variant="h6">
              {correlation.pValue < 0.001 ? '< 0.001' : correlation.pValue.toFixed(3)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Force</Typography>
            <Chip 
              label={strength}
              color={Math.abs(correlation.pearsonR) >= 0.3 ? 'success' : 'warning'}
              size="small"
            />
          </Box>
          <Chip 
            icon={correlation.isSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
            label={correlation.isSignificant ? 'Significatif' : 'Non significatif'}
            color={correlation.isSignificant ? 'success' : 'error'}
            size="small"
          />
        </Stack>
        
        <Alert 
          severity={correlation.isSignificant ? (isPositive ? 'success' : 'info') : 'warning'} 
          sx={{ mt: 2 }}
          icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
        >
          <Typography variant="body2">
            {correlation.interpretation}
          </Typography>
        </Alert>
      </Box>
    </Paper>
  );
};

/**
 * Panel de médiation contrôlée (M2 ou M3 en contrôlant M1)
 */
interface ControlledMediationPanelProps {
  result: ControlledMediationResult;
}

const ControlledMediationPanel: React.FC<ControlledMediationPanelProps> = ({ result }) => {
  const theme = useTheme();
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🔬 Test d'indépendance : {result.mediator} en contrôlant M1
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Condition</strong></TableCell>
              <TableCell align="right"><strong>Effet indirect</strong></TableCell>
              <TableCell align="right"><strong>Sobel p</strong></TableCell>
              <TableCell align="center"><strong>Significatif</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Sans contrôle (brut)</TableCell>
              <TableCell align="right">{result.rawIndirectEffect.toFixed(4)}</TableCell>
              <TableCell align="right">
                {result.rawSobelP < 0.001 ? '< 0.001' : result.rawSobelP.toFixed(3)}
              </TableCell>
              <TableCell align="center">
                <Chip 
                  icon={result.rawIsSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={result.rawIsSignificant ? 'Oui' : 'Non'}
                  color={result.rawIsSignificant ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
              <TableCell>
                <strong>En contrôlant M1</strong>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">
                  {result.controlledIndirectEffect.toFixed(4)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                {result.controlledSobelP < 0.001 ? '< 0.001' : result.controlledSobelP.toFixed(3)}
              </TableCell>
              <TableCell align="center">
                <Chip 
                  icon={result.controlledIsSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={result.controlledIsSignificant ? 'Oui' : 'Non'}
                  color={result.controlledIsSignificant ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Interprétation */}
      <Alert 
        severity={result.effectDisappears ? 'success' : 'warning'} 
        sx={{ mt: 2 }}
        icon={result.effectDisappears ? <CheckCircleIcon /> : <WarningIcon />}
      >
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {result.effectDisappears 
            ? `✅ L'effet de ${result.mediator} disparaît quand M1 est contrôlé`
            : `⚠️ ${result.mediator} conserve un effet même en contrôlant M1`
          }
        </Typography>
        <Typography variant="body2">
          {result.interpretation}
        </Typography>
      </Alert>
    </Paper>
  );
};

/**
 * Panel des corrélations bivariées (X↔M1, M1↔Y, X↔Y) pour M1
 */
interface BivariateCorrelationsPanelProps {
  correlations: {
    xToM1: { r: number; pValue: number; isSignificant: boolean };
    m1ToY: { r: number; pValue: number; isSignificant: boolean };
    xToY: { r: number; pValue: number; isSignificant: boolean };
  };
}

const BivariateCorrelationsPanel: React.FC<BivariateCorrelationsPanelProps> = ({ correlations }) => {
  const theme = useTheme();
  
  const allSignificant = correlations.xToM1.isSignificant && 
                         correlations.m1ToY.isSignificant && 
                         correlations.xToY.isSignificant;
  
  const allPositive = correlations.xToM1.r > 0 && 
                      correlations.m1ToY.r > 0 && 
                      correlations.xToY.r > 0;
  
  const chainValidated = allSignificant && allPositive;

  const getStrength = (r: number): string => {
    const absR = Math.abs(r);
    if (absR >= 0.5) return 'forte';
    if (absR >= 0.3) return 'modérée';
    if (absR >= 0.1) return 'faible';
    return 'très faible';
  };

  const formatCorrelation = (corr: { r: number; pValue: number; isSignificant: boolean }) => ({
    r: corr.r.toFixed(3),
    p: corr.pValue < 0.001 ? '< 0.001' : corr.pValue.toFixed(3),
    strength: getStrength(corr.r),
    isSignificant: corr.isSignificant,
  });

  const xToM1 = formatCorrelation(correlations.xToM1);
  const m1ToY = formatCorrelation(correlations.m1ToY);
  const xToY = formatCorrelation(correlations.xToY);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📊 Corrélations bivariées (validation de la chaîne causale)
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Relation</strong></TableCell>
              <TableCell align="center"><strong>Pearson r</strong></TableCell>
              <TableCell align="center"><strong>Force</strong></TableCell>
              <TableCell align="center"><strong>p-value</strong></TableCell>
              <TableCell align="center"><strong>Significatif</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <strong>X → M1</strong>
                <Typography variant="caption" display="block" color="text.secondary">
                  Stratégies → Verbes d'action
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography 
                  fontWeight="bold" 
                  color={correlations.xToM1.r > 0 ? 'success.main' : 'error.main'}
                >
                  {xToM1.r}
                </Typography>
              </TableCell>
              <TableCell align="center">{xToM1.strength}</TableCell>
              <TableCell align="center">{xToM1.p}</TableCell>
              <TableCell align="center">
                <Chip 
                  icon={xToM1.isSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={xToM1.isSignificant ? '✓' : '✗'}
                  color={xToM1.isSignificant ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>M1 → Y</strong>
                <Typography variant="caption" display="block" color="text.secondary">
                  Verbes d'action → Réaction
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography 
                  fontWeight="bold" 
                  color={correlations.m1ToY.r > 0 ? 'success.main' : 'error.main'}
                >
                  {m1ToY.r}
                </Typography>
              </TableCell>
              <TableCell align="center">{m1ToY.strength}</TableCell>
              <TableCell align="center">{m1ToY.p}</TableCell>
              <TableCell align="center">
                <Chip 
                  icon={m1ToY.isSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={m1ToY.isSignificant ? '✓' : '✗'}
                  color={m1ToY.isSignificant ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>X → Y</strong>
                <Typography variant="caption" display="block" color="text.secondary">
                  Stratégies → Réaction (effet total)
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography 
                  fontWeight="bold" 
                  color={correlations.xToY.r > 0 ? 'success.main' : 'error.main'}
                >
                  {xToY.r}
                </Typography>
              </TableCell>
              <TableCell align="center">{xToY.strength}</TableCell>
              <TableCell align="center">{xToY.p}</TableCell>
              <TableCell align="center">
                <Chip 
                  icon={xToY.isSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={xToY.isSignificant ? '✓' : '✗'}
                  color={xToY.isSignificant ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Interprétation */}
      <Alert 
        severity={chainValidated ? 'success' : 'warning'} 
        sx={{ mt: 2 }}
        icon={chainValidated ? <CheckCircleIcon /> : <WarningIcon />}
      >
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {chainValidated 
            ? '✅ Chaîne causale X → M1 → Y validée'
            : '⚠️ Chaîne causale partiellement validée'
          }
        </Typography>
        <Typography variant="body2">
          {chainValidated ? (
            <>
              Les 3 corrélations sont positives et significatives. 
              Les stratégies d'action (ENGAGEMENT, OUVERTURE) génèrent plus de verbes d'action, 
              qui sont associés à des réactions plus positives.
            </>
          ) : (
            <>
              {!correlations.xToM1.isSignificant && 'X → M1 non significatif. '}
              {!correlations.m1ToY.isSignificant && 'M1 → Y non significatif. '}
              {!correlations.xToY.isSignificant && 'X → Y non significatif. '}
              {correlations.xToM1.r <= 0 && 'X → M1 non positif. '}
              {correlations.m1ToY.r <= 0 && 'M1 → Y non positif. '}
            </>
          )}
        </Typography>
      </Alert>
      
      {/* Note sur Baron-Kenny */}
      <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
        <Typography variant="caption">
          <strong>Note :</strong> Le test de Sobel peut échouer en cas de forte colinéarité X ↔ M1 
          (a = forte corrélation). Les corrélations bivariées offrent une validation alternative 
          de la chaîne causale.
        </Typography>
      </Alert>
    </Paper>
  );
};

/**
 * Panel de variance intra-stratégie (test si M1 a un effet propre)
 */
interface IntraStrategyVariancePanelProps {
  data: NonNullable<H2MediationData['intraStrategyVariance']>;
}

const IntraStrategyVariancePanel: React.FC<IntraStrategyVariancePanelProps> = ({ data }) => {
  const theme = useTheme();
  
  // Vérifier si au moins une corrélation intra-stratégie est significative
  const anySignificant = data.some(d => d.m1ToYCorrelation.isSignificant);
  const hasEnoughVariance = data.some(d => d.coefficientOfVariation > 0.5);
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🔬 Analyse intra-stratégie : M1 a-t-il un effet propre ?
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
        <Typography variant="body2">
          Cette analyse teste si, <strong>à stratégie égale</strong>, la variation de M1 prédit la réaction.
          Si oui → M1 est un vrai médiateur. Si non → M1 est un indicateur redondant de X.
        </Typography>
      </Alert>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Stratégie</strong></TableCell>
              <TableCell align="right"><strong>N</strong></TableCell>
              <TableCell align="right"><strong>M1 moyen</strong></TableCell>
              <TableCell align="right"><strong>Écart-type</strong></TableCell>
              <TableCell align="right"><strong>CV</strong></TableCell>
              <TableCell align="center"><strong>r(M1→Y)</strong></TableCell>
              <TableCell align="center"><strong>p-value</strong></TableCell>
              <TableCell align="center"><strong>Effet propre ?</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const hasVariance = row.coefficientOfVariation > 0.3;
              const enoughData = row.count >= 30;
              const canTest = hasVariance && enoughData;
              
              return (
                <TableRow key={row.strategy}>
                  <TableCell>
                    <Chip 
                      label={row.strategy} 
                      size="small" 
                      color={row.strategy === 'ENGAGEMENT' || row.strategy === 'OUVERTURE' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                  <TableCell align="right">{row.mean.toFixed(2)}</TableCell>
                  <TableCell align="right">{row.stdDev.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Coefficient de variation (écart-type / moyenne). > 0.5 = bonne variance">
                      <Typography 
                        variant="body2" 
                        color={row.coefficientOfVariation > 0.5 ? 'success.main' : 'warning.main'}
                        fontWeight={row.coefficientOfVariation > 0.5 ? 'bold' : 'normal'}
                      >
                        {(row.coefficientOfVariation * 100).toFixed(0)}%
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    {canTest ? (
                      <Typography 
                        fontWeight="bold" 
                        color={row.m1ToYCorrelation.r > 0 ? 'success.main' : 'error.main'}
                      >
                        {row.m1ToYCorrelation.r.toFixed(3)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {canTest ? (
                      <Typography variant="body2">
                        {row.m1ToYCorrelation.pValue < 0.001 ? '< 0.001' : row.m1ToYCorrelation.pValue.toFixed(3)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {!canTest ? (
                      <Tooltip title={!hasVariance ? "Variance insuffisante" : "Pas assez de données (N < 30)"}>
                        <Chip label="N/A" size="small" variant="outlined" />
                      </Tooltip>
                    ) : row.m1ToYCorrelation.isSignificant ? (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Oui" 
                        size="small" 
                        color="success" 
                      />
                    ) : (
                      <Chip 
                        icon={<ErrorIcon />} 
                        label="Non" 
                        size="small" 
                        color="error" 
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Interprétation */}
      <Alert 
        severity={anySignificant ? 'success' : hasEnoughVariance ? 'error' : 'warning'} 
        sx={{ mt: 2 }}
        icon={anySignificant ? <CheckCircleIcon /> : <WarningIcon />}
      >
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          {anySignificant 
            ? '✅ M1 a un effet propre dans au moins une stratégie'
            : hasEnoughVariance 
              ? '❌ M1 n\'a pas d\'effet propre (indicateur redondant de X)'
              : '⚠️ Variance insuffisante pour conclure'
          }
        </Typography>
        <Typography variant="body2">
          {anySignificant ? (
            <>
              Au sein d'au moins une stratégie, la variation de M1 prédit la réaction.
              M1 capture un mécanisme distinct de la stratégie elle-même.
            </>
          ) : hasEnoughVariance ? (
            <>
              À stratégie égale, M1 ne prédit pas la réaction (b ≈ 0 confirmé).
              M1 est probablement un indicateur de la stratégie, pas un médiateur causal.
            </>
          ) : (
            <>
              Les stratégies ont peu de variance interne de M1, rendant impossible 
              le test de l'effet propre. Plus de données seraient nécessaires.
            </>
          )}
        </Typography>
      </Alert>
    </Paper>
  );
};

/**
 * Panel de test de médiation binaire (M1 présent vs absent)
 */
interface BinaryMediationPanelProps {
  data: NonNullable<H2MediationData['binaryMediationTest']>;
}

const BinaryMediationPanel: React.FC<BinaryMediationPanelProps> = ({ data }) => {
  const theme = useTheme();
  
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🔀 Test de médiation binaire : Présence vs Absence de verbes d'action
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
        <Typography variant="body2">
          Ce test vérifie si l'effet de M1 est de type <strong>"interrupteur"</strong> (présence/absence) 
          plutôt que <strong>"volume"</strong> (quantité). Baron-Kenny est recalculé avec M1 binaire (0 ou 1).
        </Typography>
      </Alert>
      
      {/* Comparaison des groupes */}
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        📊 Comparaison des groupes
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Groupe</strong></TableCell>
              <TableCell align="right"><strong>N</strong></TableCell>
              <TableCell align="right"><strong>Y moyen (réaction)</strong></TableCell>
              <TableCell align="right"><strong>Écart-type</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Chip label="M1 > 0" size="small" color="success" variant="outlined" />
                <Typography variant="caption" display="block" color="text.secondary">
                  Avec verbes d'action
                </Typography>
              </TableCell>
              <TableCell align="right">{data.withVerbs.count}</TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold" color="success.main">
                  {data.withVerbs.meanY.toFixed(3)}
                </Typography>
              </TableCell>
              <TableCell align="right">{data.withVerbs.stdDevY.toFixed(3)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Chip label="M1 = 0" size="small" color="error" variant="outlined" />
                <Typography variant="caption" display="block" color="text.secondary">
                  Sans verbes d'action
                </Typography>
              </TableCell>
              <TableCell align="right">{data.withoutVerbs.count}</TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold" color="error.main">
                  {data.withoutVerbs.meanY.toFixed(3)}
                </Typography>
              </TableCell>
              <TableCell align="right">{data.withoutVerbs.stdDevY.toFixed(3)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Test t */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Test t de différence</Typography>
        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
          <Typography variant="body2">
            <strong>t</strong> = {data.tTest.t.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            <strong>p-value</strong> = {data.tTest.pValue < 0.001 ? '< 0.001' : data.tTest.pValue.toFixed(3)}
          </Typography>
          <Typography variant="body2">
            <strong>Cohen's d</strong> = {data.tTest.cohenD.toFixed(2)}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              ({Math.abs(data.tTest.cohenD) >= 0.8 ? 'fort' : Math.abs(data.tTest.cohenD) >= 0.5 ? 'moyen' : Math.abs(data.tTest.cohenD) >= 0.2 ? 'faible' : 'négligeable'})
            </Typography>
          </Typography>
          <Chip 
            icon={data.tTest.isSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
            label={data.tTest.isSignificant ? 'Significatif' : 'Non significatif'}
            color={data.tTest.isSignificant ? 'success' : 'error'}
            size="small"
          />
        </Stack>
      </Box>
      
      {/* Baron-Kenny binaire */}
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
        🔗 Baron-Kenny avec M1 binaire
      </Typography>
      
      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
        <Stack direction="row" spacing={4} alignItems="center" flexWrap="wrap" justifyContent="center">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">a (X → M1_bin)</Typography>
            <Typography variant="h6">{data.binaryMediation.a.toFixed(3)}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">b (M1_bin → Y | X)</Typography>
            <Typography variant="h6" color={data.binaryMediation.b > 0.01 ? 'success.main' : 'error.main'}>
              {data.binaryMediation.b.toFixed(3)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">a × b</Typography>
            <Typography variant="h6">{data.binaryMediation.indirectEffect.toFixed(3)}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">% médiation</Typography>
            <Typography variant="h6">{data.binaryMediation.percentMediation.toFixed(0)}%</Typography>
          </Box>
        </Stack>
        
        <Divider sx={{ my: 2 }} />
        
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
          <Typography variant="body2">
            <strong>Sobel Z</strong> = {data.binaryMediation.sobelZ.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            <strong>p-value</strong> = {data.binaryMediation.sobelP < 0.001 ? '< 0.001' : data.binaryMediation.sobelP.toFixed(3)}
          </Typography>
          <Chip 
            icon={data.binaryMediation.isSignificant ? <CheckCircleIcon /> : <ErrorIcon />}
            label={data.binaryMediation.isSignificant ? 'Médiation significative' : 'Non significatif'}
            color={data.binaryMediation.isSignificant ? 'success' : 'error'}
            size="small"
          />
        </Stack>
      </Box>
      
      {/* Interprétation */}
      <Alert 
        severity={data.binaryMediation.isSignificant ? 'success' : data.tTest.isSignificant ? 'warning' : 'error'} 
        sx={{ mt: 2 }}
        icon={data.binaryMediation.isSignificant ? <CheckCircleIcon /> : <WarningIcon />}
      >
        <Typography variant="body2">
          {data.interpretation}
        </Typography>
      </Alert>
    </Paper>
  );
};



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
// ========== FILTRAGE DES MÉDIATEURS SELON LE TARGET ==========
  // Si on teste M1/M2/M3 → afficher uniquement ce médiateur
  // Si on teste X/Y → afficher les 3 médiateurs (vue globale)
  const isNumericTarget = ['M1', 'M2', 'M3'].includes(targetKind);
  
  const filteredMediators = React.useMemo(() => {
    if (!mediationData?.mediators) return [];
    if (isNumericTarget) {
      // Filtrer pour n'afficher que le médiateur correspondant au target
      return mediationData.mediators.filter(m => m.mediator === targetKind);
    }
    // Pour X/Y, afficher tous les médiateurs
    return mediationData.mediators;
  }, [mediationData?.mediators, targetKind, isNumericTarget]);

  const filteredComparisons = React.useMemo(() => {
    if (!mediationData?.comparisons) return [];
    if (isNumericTarget) {
      return mediationData.comparisons.filter(c => c.mediator === targetKind);
    }
    return mediationData.comparisons;
  }, [mediationData?.comparisons, targetKind, isNumericTarget]);

  const handleAccordionChange = (mediator: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedMediator(isExpanded ? mediator : false);
  };

  // Compter les médiations significatives
// Compter les médiations significatives (sur les médiateurs filtrés)
  const significantCount = filteredMediators.filter(
    m => m.verdict === 'substantial' || m.verdict === 'partial'
  ).length;
  
  const totalMediatorsShown = filteredMediators.length;

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
            {mediationData && filteredMediators.length > 0 && (
              <Chip
                icon={significantCount > 0 ? <CheckCircleIcon /> : <WarningIcon />}
                label={`${significantCount}/${totalMediatorsShown} significatif${significantCount > 1 ? 's' : ''}`}
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
            {isNumericTarget ? (
              <>
                <strong>Médiation {targetKind} :</strong> Analyse de la contribution de {targetKind} à la relation X → Y.
                {targetKind === 'M1' && ' (densité verbes d\'action)'}
                {targetKind === 'M2' && ' (alignement linguistique)'}
                {targetKind === 'M3' && ' (charge cognitive)'}
              </>
            ) : (
              <>
                <strong>H2 (Médiation) :</strong> L'effet X → Y passe par des médiateurs.
                M1 = densité verbes d'action, M2 = alignement linguistique, M3 = charge cognitive.
              </>
            )}
          </Typography>
        </Alert>

        {/* Contenu */}
        {loading ? (
          <H2LoadingSkeleton />
        ) : !isNumericTarget ? (
          /* X/Y : Section non applicable en Level 1 */
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Section non applicable pour {targetKind}</strong>
            </Typography>
            <Typography variant="body2">
              La validation H2 (médiation) concerne les variables M1, M2 et M3.
              Pour {targetKind}, consultez la Section B (Contribution à H1).
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              💡 Pour voir l'analyse complète de médiation, testez les algorithmes M1, M2 ou M3.
            </Typography>
          </Alert>
        ) : mediationData ? (
          <>
            {/* ========== CONTENU SPÉCIFIQUE SELON LE TARGET ========== */}
            
           {targetKind === 'M1' && (
              <>
                {/* M1 : Prérequis (M1 par réaction) + Corrélations + Médiation */}
                
                {/* 1. M par réaction (ANOVA) */}
                {mediationData.mByReaction && (
                  <MByReactionTable
                    data={mediationData.mByReaction.data}
                    anova={mediationData.mByReaction.anova}
                    mediatorLabel="M1 (Densité verbes d'action)"
                  />
                )}
                
                 {/* 2. Corrélations bivariées (validation chaîne causale) */}
                {mediationData.bivariateCorrelations && (
                  <BivariateCorrelationsPanel correlations={mediationData.bivariateCorrelations} />
                )}
                
                 {/* 3. Variance intra-stratégie (test effet propre M1) */}
                {mediationData.intraStrategyVariance && mediationData.intraStrategyVariance.length > 0 && (
                  <IntraStrategyVariancePanel data={mediationData.intraStrategyVariance} />
                )}
                
                {/* 4. Test de médiation binaire (présence vs absence) */}
                {mediationData.binaryMediationTest && (
                  <BinaryMediationPanel data={mediationData.binaryMediationTest} />
                )}
                
                {/* 5. Médiation Baron-Kenny (informatif) */}
                <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      🔗 Médiation Baron-Kenny (détail technique)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {filteredMediators.map((m) => (
                      <MediationPathDiagram
                        key={m.mediator}
                        mediator={m.mediator}
                        mediatorLabel={m.label}
                        paths={m.paths}
                        percentMediation={m.percentMediation}
                        sobelZ={m.sobelZ}
                        sobelP={m.sobelP}
                        verdict={m.verdict}
                      />
                    ))}
                  </AccordionDetails>
                </Accordion>
              </>
            )}
            
            {(targetKind === 'M2' || targetKind === 'M3') && (
              <>
                {/* M2/M3 : Corrélation avec M1 + Médiation brute + Médiation contrôlée */}
                
                {/* 1. Corrélation M1 → M2/M3 */}
                {mediationData.correlations?.map((corr) => (
                  <CorrelationPanel key={`${corr.from}-${corr.to}`} correlation={corr} />
                ))}
                
                {/* 2. Médiation brute */}
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  🔗 Médiation brute : X → {targetKind} → Y
                </Typography>
                {filteredMediators.map((m) => (
                  <MediationPathDiagram
                    key={m.mediator}
                    mediator={m.mediator}
                    mediatorLabel={m.label}
                    paths={m.paths}
                    percentMediation={m.percentMediation}
                    sobelZ={m.sobelZ}
                    sobelP={m.sobelP}
                    verdict={m.verdict}
                  />
                ))}
                
                {/* 3. Médiation contrôlée */}
                {mediationData.controlledMediation && (
                  <ControlledMediationPanel result={mediationData.controlledMediation} />
                )}
              </>
            )}
            
            {/* Comparaison avec versions précédentes (pour tous) */}
            {filteredComparisons.length > 0 && (
              <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    📈 Comparaison avec versions précédentes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <VersionComparisonTable comparisons={filteredComparisons} />
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
