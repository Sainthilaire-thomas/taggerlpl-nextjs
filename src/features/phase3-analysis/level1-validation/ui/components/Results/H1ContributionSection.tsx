// src/features/phase3-analysis/level1-validation/ui/components/Results/H1ContributionSection.tsx
/**
 * Section B : Contribution à H1
 * 
 * Compare la validation H1 selon 3 sources :
 * - Gold Standard (référence absolue)
 * - Baseline (dernière version promue)
 * - Ce test (algorithme en cours d'évaluation)
 * 
 * Visible uniquement si target = X ou Y
 */

'use client';

import React from 'react';
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
  alpha,
  useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ScienceIcon from '@mui/icons-material/Science';
import InfoIcon from '@mui/icons-material/Info';

import type { TargetKind } from '@/types/algorithm-lab/ui/components';
import type {
  H1ContributionSectionProps,
  H1ComparisonData,
  H1ComparisonRow,
  MetricEvolution,
  EvolutionDirection,
} from '@/types/algorithm-lab/ui/results';

// ============================================================================
// HELPERS
// ============================================================================

const getEvolutionIcon = (direction: EvolutionDirection, isPositive: boolean) => {
  if (direction === 'stable') {
    return <TrendingFlatIcon fontSize="small" color="action" />;
  }
  if (direction === 'up') {
    return <TrendingUpIcon fontSize="small" color={isPositive ? 'success' : 'error'} />;
  }
  return <TrendingDownIcon fontSize="small" color={isPositive ? 'success' : 'error'} />;
};

const formatValue = (value: number | string, unit?: string): string => {
  if (typeof value === 'number') {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'pts') return `${value > 0 ? '+' : ''}${value.toFixed(0)} pts`;
    if (unit === 'p-value') return value < 0.001 ? '<0.001' : value.toFixed(3);
    return value.toFixed(3);
  }
  return String(value);
};

const formatDelta = (delta: number, unit?: string): string => {
  const sign = delta > 0 ? '+' : '';
  if (unit === '%' || unit === 'pts') {
    return `${sign}${delta.toFixed(1)}`;
  }
  return `${sign}${delta.toFixed(3)}`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CriteriaCountChipProps {
  validated: number;
  total: number;
  label?: string;
}

const CriteriaCountChip: React.FC<CriteriaCountChipProps> = ({ validated, total, label }) => {
  const ratio = validated / total;
  const color = ratio >= 0.8 ? 'success' : ratio >= 0.5 ? 'warning' : 'error';
  
  return (
    <Chip
      icon={ratio >= 0.8 ? <CheckCircleIcon /> : ratio >= 0.5 ? <WarningIcon /> : <ErrorIcon />}
      label={`${label ? `${label}: ` : ''}${validated}/${total}`}
      color={color}
      size="small"
      variant="outlined"
    />
  );
};

interface ComparisonTableProps {
  rows: H1ComparisonRow[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ rows }) => {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell><strong>Critère H1</strong></TableCell>
            <TableCell align="center">
              <Tooltip title="Annotations manuelles (référence absolue)">
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <strong>Gold Standard</strong>
                  <InfoIcon fontSize="small" color="action" />
                </Stack>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Dernière version promue">
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <strong>Baseline</strong>
                  <InfoIcon fontSize="small" color="action" />
                </Stack>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Algorithme en cours d'évaluation">
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  <strong>Ce test</strong>
                  <InfoIcon fontSize="small" color="action" />
                </Stack>
              </Tooltip>
            </TableCell>
            <TableCell align="center"><strong>Évolution</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow 
              key={row.criterionKey}
              sx={{
                bgcolor: row.evolution && !row.evolution.isPositive 
                  ? alpha(theme.palette.error.main, 0.05)
                  : 'transparent',
              }}
            >
              <TableCell>
                <Typography variant="body2">
                  {row.criterion}
                </Typography>
                {row.threshold && (
                  <Typography variant="caption" color="text.secondary">
                    (seuil: {row.threshold}{row.unit})
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {formatValue(row.goldStandard, row.unit)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {row.baseline !== null ? (
                  <Typography variant="body2">
                    {formatValue(row.baseline, row.unit)}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    N/A
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={
                    row.evolution 
                      ? row.evolution.isPositive 
                        ? 'success.main' 
                        : 'error.main'
                      : 'text.primary'
                  }
                >
                  {formatValue(row.currentTest, row.unit)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {row.evolution ? (
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                    {getEvolutionIcon(row.evolution.direction, row.evolution.isPositive)}
                    <Typography 
                      variant="body2"
                      color={row.evolution.isPositive ? 'success.main' : 'error.main'}
                    >
                      {formatDelta(row.evolution.delta, row.unit)}
                    </Typography>
                    {!row.evolution.isPositive && (
                      <ErrorIcon fontSize="small" color="error" />
                    )}
                  </Stack>
                ) : (
                  <TrendingFlatIcon fontSize="small" color="action" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface InterpretationAlertProps {
  interpretation: H1ComparisonData['interpretation'];
  criteriaValidated: H1ComparisonData['criteriaValidated'];
}

const InterpretationAlert: React.FC<InterpretationAlertProps> = ({
  interpretation,
  criteriaValidated,
}) => {
  const baselineComparison = criteriaValidated.baseline !== null
    ? `${criteriaValidated.baseline}/6 → ${criteriaValidated.currentTest}/6`
    : `${criteriaValidated.currentTest}/${criteriaValidated.total}`;

  return (
    <Alert 
      severity={interpretation.level}
      sx={{ mt: 2 }}
      icon={
        interpretation.level === 'success' 
          ? <CheckCircleIcon /> 
          : interpretation.level === 'warning'
          ? <WarningIcon />
          : <ErrorIcon />
      }
    >
      <Typography variant="body2" gutterBottom>
        <strong>{interpretation.level === 'error' ? '⚠️' : interpretation.level === 'warning' ? '⚡' : '✅'}</strong>{' '}
        {interpretation.message}
      </Typography>
      {criteriaValidated.baseline !== null && (
        <Typography variant="caption" color="text.secondary" display="block">
          Critères validés : {baselineComparison}
        </Typography>
      )}
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>💡 Recommandation :</strong> {interpretation.recommendation}
      </Typography>
    </Alert>
  );
};

interface StatisticalTestsBoxProps {
  stats: H1ComparisonData['statisticalTests'];
}

const StatisticalTestsBox: React.FC<StatisticalTestsBoxProps> = ({ stats }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2, 
        mt: 2, 
        bgcolor: stats.isSignificant 
          ? alpha(theme.palette.success.main, 0.05)
          : alpha(theme.palette.warning.main, 0.05)
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        📊 Tests Statistiques
      </Typography>
      <Stack direction="row" spacing={3} flexWrap="wrap">
        <Box>
          <Typography variant="caption" color="text.secondary">Chi²</Typography>
          <Typography variant="body2" fontWeight="bold">{stats.chiSquare.toFixed(2)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">p-value</Typography>
          <Typography 
            variant="body2" 
            fontWeight="bold"
            color={stats.pValue < 0.05 ? 'success.main' : 'warning.main'}
          >
            {stats.pValue < 0.001 ? '<0.001' : stats.pValue.toFixed(3)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Cramér's V</Typography>
          <Typography 
            variant="body2" 
            fontWeight="bold"
            color={stats.cramersV >= 0.15 ? 'success.main' : 'warning.main'}
          >
            {stats.cramersV.toFixed(3)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Significatif ?</Typography>
          <Chip 
            label={stats.isSignificant ? 'Oui' : 'Non'}
            color={stats.isSignificant ? 'success' : 'warning'}
            size="small"
          />
        </Box>
      </Stack>
    </Paper>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const H1LoadingSkeleton: React.FC = () => (
  <Box>
    <Stack direction="row" spacing={2} mb={2}>
      <Skeleton variant="rounded" width={100} height={32} />
      <Skeleton variant="rounded" width={80} height={32} />
    </Stack>
    <Skeleton variant="rounded" width="100%" height={200} />
    <Skeleton variant="rounded" width="100%" height={80} sx={{ mt: 2 }} />
  </Box>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

interface H1EmptyStateProps {
  targetKind: TargetKind;
  onRefresh?: () => void;
}

const H1EmptyState: React.FC<H1EmptyStateProps> = ({ targetKind, onRefresh }) => {
  // Section B n'est visible que pour X et Y
  if (targetKind !== 'X' && targetKind !== 'Y') {
    return (
      <Alert severity="info" icon={<InfoIcon />}>
        La Section B (Contribution H1) est uniquement disponible pour les variables X et Y.
        <br />
        <Typography variant="caption" color="text.secondary">
          Les médiateurs M1, M2, M3 contribuent à H2 (médiation), pas directement à H1.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <ScienceIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Aucune donnée de comparaison H1 disponible
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Exécutez un test pour comparer avec le Gold Standard et la Baseline.
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
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const H1ContributionSection: React.FC<H1ContributionSectionProps> = ({
  targetKind,
  comparisonData,
  runId,
  loading,
  onRefresh,
  onNavigateToLevel2,
}) => {
  // Section B n'est visible que pour X et Y
  const isApplicable = targetKind === 'X' || targetKind === 'Y';

  if (!isApplicable) {
    return (
      <Card>
        <CardContent>
          <H1EmptyState targetKind={targetKind} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <ScienceIcon color="primary" />
            <Typography variant="h6">
              Section B : Contribution à H1
            </Typography>
            <Chip label={targetKind} color="primary" size="small" />
            {comparisonData && (
              <CriteriaCountChip
                validated={comparisonData.criteriaValidated.currentTest}
                total={comparisonData.criteriaValidated.total}
                label="Critères"
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
            {onNavigateToLevel2 && comparisonData?.interpretation.level === 'success' && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                endIcon={<NavigateNextIcon />}
                onClick={onNavigateToLevel2}
              >
                Passer à Level 2
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Rappel H1 */}
        <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
          <Typography variant="body2">
            <strong>H1 :</strong> Les stratégies ENGAGEMENT et OUVERTURE génèrent des réactions client positives, 
            EXPLICATION génère des réactions négatives, REFLET est intermédiaire.
          </Typography>
        </Alert>

        {/* Contenu */}
        {loading ? (
          <H1LoadingSkeleton />
        ) : comparisonData ? (
          <>
            {/* Tableau comparatif */}
            <ComparisonTable rows={comparisonData.rows} />

            {/* Tests statistiques */}
            <StatisticalTestsBox stats={comparisonData.statisticalTests} />

            {/* Interprétation */}
            <InterpretationAlert 
              interpretation={comparisonData.interpretation}
              criteriaValidated={comparisonData.criteriaValidated}
            />
          </>
        ) : (
          <H1EmptyState targetKind={targetKind} onRefresh={onRefresh} />
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

export default H1ContributionSection;
