// src/features/phase3-analysis/level1-validation/ui/components/Results/PerformanceSection.tsx
/**
 * Section A : Performance Intrinsèque
 * 
 * Affiche les métriques de performance selon le type de target:
 * - Classification (X, Y) : Accuracy, Kappa, F1, Matrice de confusion
 * - Numérique (M1, M2, M3) : Distribution, Stats descriptives, Échantillons
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InsightsIcon from '@mui/icons-material/Insights';
import AnnotateIcon from '@mui/icons-material/RateReview';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

import type { TargetKind } from '@/types/algorithm-lab/ui/components';
import type {
  PerformanceSectionProps,
  ClassificationMetricsDisplay,
  NumericMetricsDisplay,
  CalculationSample,
  M1CalculationSample,
  M2CalculationSample,
  M3CalculationSample,
} from '@/types/algorithm-lab/ui/results';

// ============================================================================
// HELPERS
// ============================================================================

const getKappaInterpretation = (kappa: number): { label: string; color: string; severity: 'success' | 'warning' | 'error' } => {
  if (kappa >= 0.8) return { label: 'Excellent', color: 'success.main', severity: 'success' };
  if (kappa >= 0.6) return { label: 'Bon', color: 'success.light', severity: 'success' };
  if (kappa >= 0.4) return { label: 'Modéré', color: 'warning.main', severity: 'warning' };
  if (kappa >= 0.2) return { label: 'Faible', color: 'error.light', severity: 'warning' };
  return { label: 'Très faible', color: 'error.main', severity: 'error' };
};

const getF1Color = (f1: number): string => {
  if (f1 >= 0.8) return 'success.main';
  if (f1 >= 0.6) return 'warning.main';
  return 'error.main';
};

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

// ============================================================================
// SUB-COMPONENTS : STAT TILE
// ============================================================================

interface StatTileProps {
  title: string;
  value: React.ReactNode;
  color?: string;
  tooltip?: string;
}

const StatTile: React.FC<StatTileProps> = ({ title, value, color, tooltip }) => (
  <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 150px', minWidth: 120 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }} color={color}>
        {value}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip}>
          <InfoIcon fontSize="small" color="action" />
        </Tooltip>
      )}
    </Box>
    <Typography variant="body2" color="text.secondary">
      {title}
    </Typography>
  </Paper>
);

// ============================================================================
// SUB-COMPONENTS : CLASSIFICATION (X, Y)
// ============================================================================

interface ClassificationMetricsPanelProps {
  metrics: ClassificationMetricsDisplay;
  classifierLabel?: string;
}

const ClassificationMetricsPanel: React.FC<ClassificationMetricsPanelProps> = ({
  metrics,
  classifierLabel,
}) => {
  const theme = useTheme();
  const kappaInfo = metrics.kappa !== undefined ? getKappaInterpretation(metrics.kappa) : null;
  const classes = Object.keys(metrics.precision).sort();

  return (
    <Box>
      {/* Métriques globales */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Métriques Globales {classifierLabel && `- ${classifierLabel}`}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <StatTile
          title="Accuracy"
          value={`${metrics.accuracy.toFixed(1)}%`}
          color={metrics.accuracy >= 70 ? 'success.main' : 'warning.main'}
        />
        <StatTile
          title="Kappa (Cohen)"
          value={metrics.kappa?.toFixed(3) ?? 'N/A'}
          color={kappaInfo?.color}
          tooltip={kappaInfo?.label}
        />
        <StatTile
          title="F1 Macro"
          value={metrics.f1Macro?.toFixed(3) ?? 'N/A'}
          color={getF1Color(metrics.f1Macro || 0)}
        />
        <StatTile
          title="Classifications"
          value={`${metrics.correctPredictions}/${metrics.totalSamples}`}
        />
        <StatTile
          title="Temps Moyen"
          value={`${metrics.avgProcessingTime}ms`}
        />
      </Box>

      {/* Alerte Kappa */}
      {kappaInfo && (
        <Alert severity={kappaInfo.severity} sx={{ mb: 2 }}>
          <strong>Interprétation Kappa :</strong> {kappaInfo.label} (κ = {metrics.kappa?.toFixed(3)})
        </Alert>
      )}

      {/* Métriques par tag */}
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Précision / Rappel par Tag</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tag</strong></TableCell>
                  <TableCell align="center"><strong>Précision</strong></TableCell>
                  <TableCell align="center"><strong>Rappel</strong></TableCell>
                  <TableCell align="center"><strong>F1-Score</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((cls) => {
                  const f1 = metrics.f1Score[cls] || 0;
                  return (
                    <TableRow key={cls}>
                      <TableCell>
                        <Chip
                          label={cls}
                          size="small"
                          variant="outlined"
                          sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            borderColor: theme.palette.primary.main,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {formatPercent(metrics.precision[cls] || 0)}
                      </TableCell>
                      <TableCell align="center">
                        {formatPercent(metrics.recall[cls] || 0)}
                      </TableCell>
                      <TableCell align="center" sx={{ color: getF1Color(f1), fontWeight: 700 }}>
                        {formatPercent(f1)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Matrice de confusion */}
      <Accordion defaultExpanded={false} sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Matrice de Confusion</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Réel \ Prédit</strong></TableCell>
                  {classes.map((label) => (
                    <TableCell key={label} align="center">
                      <Chip label={label} size="small" />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((actual) => (
                  <TableRow key={actual}>
                    <TableCell>
                      <Chip label={actual} size="small" variant="outlined" />
                    </TableCell>
                    {classes.map((predicted) => {
                      const count = metrics.confusionMatrix[actual]?.[predicted] || 0;
                      const isDiagonal = actual === predicted;
                      return (
                        <TableCell
                          key={predicted}
                          align="center"
                          sx={{
                            bgcolor: isDiagonal
                              ? alpha(theme.palette.success.main, 0.2)
                              : count > 0
                              ? alpha(theme.palette.error.main, 0.1)
                              : 'transparent',
                            fontWeight: isDiagonal ? 'bold' : 'normal',
                          }}
                        >
                          {count}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// ============================================================================
// SUB-COMPONENTS : NUMERIC (M1, M2, M3)
// ============================================================================

interface NumericMetricsPanelProps {
  metrics: NumericMetricsDisplay;
  targetKind: 'M1' | 'M2' | 'M3';
  classifierLabel?: string;
}

const NumericMetricsPanel: React.FC<NumericMetricsPanelProps> = ({
  metrics,
  targetKind,
  classifierLabel,
}) => {
  const { distribution, byStrategy } = metrics;

  const targetLabels: Record<string, string> = {
    M1: 'Densité verbes d\'action',
    M2: 'Alignement linguistique',
    M3: 'Charge cognitive',
  };

  return (
    <Box>
      {/* Stats descriptives */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {targetLabels[targetKind]} {classifierLabel && `- ${classifierLabel}`}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <StatTile title="Moyenne" value={distribution.mean.toFixed(3)} />
        <StatTile title="Médiane" value={distribution.median.toFixed(3)} />
        <StatTile title="Écart-type" value={distribution.stdDev.toFixed(3)} />
        <StatTile title="Min" value={distribution.min.toFixed(3)} />
        <StatTile title="Max" value={distribution.max.toFixed(3)} />
        <StatTile 
          title="Couverture" 
          value={`${metrics.coverage.toFixed(0)}%`}
          color={metrics.coverage >= 90 ? 'success.main' : 'warning.main'}
        />
      </Box>

      {/* Distribution par stratégie */}
      <Accordion defaultExpanded={true}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Moyenne par Stratégie X</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Stratégie</strong></TableCell>
                  <TableCell align="center"><strong>Moyenne</strong></TableCell>
                  <TableCell align="center"><strong>N</strong></TableCell>
                  <TableCell align="center"><strong>Écart-type</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(['ENGAGEMENT', 'OUVERTURE', 'REFLET', 'EXPLICATION'] as const).map((strategy) => {
                  const stats = byStrategy[strategy];
                  const isAction = strategy === 'ENGAGEMENT' || strategy === 'OUVERTURE';
                  return (
                    <TableRow key={strategy}>
                      <TableCell>
                        <Chip
                          label={strategy}
                          size="small"
                          color={isAction ? 'success' : strategy === 'EXPLICATION' ? 'error' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {stats.mean.toFixed(3)}
                      </TableCell>
                      <TableCell align="center">{stats.count}</TableCell>
                      <TableCell align="center">
                        {stats.stdDev?.toFixed(3) ?? '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Histogramme placeholder */}
      <Accordion defaultExpanded={false} sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Distribution (Histogramme)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              📊 Histogramme à implémenter avec Recharts
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// ============================================================================
// SUB-COMPONENTS : CALCULATION SAMPLES
// ============================================================================

interface CalculationSamplesPanelProps {
  targetKind: 'M1' | 'M2' | 'M3';
  samples: CalculationSample[];
  onAnnotate?: (pairId: number) => void;
}

const CalculationSamplesPanel: React.FC<CalculationSamplesPanelProps> = ({
  targetKind,
  samples,
  onAnnotate,
}) => {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const displayedSamples = samples.slice(page * pageSize, (page + 1) * pageSize);

  if (!samples.length) {
    return (
      <Alert severity="info">
        Aucun échantillon de calcul disponible.
      </Alert>
    );
  }

  const renderM1Row = (sample: M1CalculationSample) => (
    <TableRow key={sample.pairId}>
      <TableCell>{sample.pairId}</TableCell>
      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {sample.conseillerVerbatim}
      </TableCell>
      <TableCell align="center">{sample.m1Density.toFixed(3)}</TableCell>
      <TableCell align="center">{sample.m1Count}</TableCell>
      <TableCell>
        {sample.verbsDetected.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {sample.verbsDetected.map((verb, i) => (
              <Chip key={i} label={verb} size="small" color="primary" variant="outlined" />
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">Aucun</Typography>
        )}
      </TableCell>
      <TableCell>
        {onAnnotate && (
          <IconButton size="small" onClick={() => onAnnotate(sample.pairId)}>
            <AnnotateIcon fontSize="small" />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );

  const renderM2Row = (sample: M2CalculationSample) => (
    <TableRow key={sample.pairId}>
      <TableCell>{sample.pairId}</TableCell>
      <TableCell sx={{ maxWidth: 200 }}>{sample.conseillerVerbatim}</TableCell>
      <TableCell sx={{ maxWidth: 200 }}>{sample.clientVerbatim}</TableCell>
      <TableCell align="center">{sample.m2Score.toFixed(3)}</TableCell>
      <TableCell>
        {sample.alignedTokens.slice(0, 5).map((token, i) => (
          <Chip key={i} label={token} size="small" sx={{ mr: 0.5 }} />
        ))}
        {sample.alignedTokens.length > 5 && (
          <Chip label={`+${sample.alignedTokens.length - 5}`} size="small" variant="outlined" />
        )}
      </TableCell>
      <TableCell>
        {onAnnotate && (
          <IconButton size="small" onClick={() => onAnnotate(sample.pairId)}>
            <AnnotateIcon fontSize="small" />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );

  const renderM3Row = (sample: M3CalculationSample) => (
    <TableRow key={sample.pairId}>
      <TableCell>{sample.pairId}</TableCell>
      <TableCell sx={{ maxWidth: 300 }}>{sample.clientVerbatim}</TableCell>
      <TableCell align="center">{sample.m3Score.toFixed(3)}</TableCell>
      <TableCell>
        {sample.hesitationMarkers.map((marker, i) => (
          <Chip key={i} label={marker} size="small" color="warning" sx={{ mr: 0.5 }} />
        ))}
      </TableCell>
      <TableCell>
        {onAnnotate && (
          <IconButton size="small" onClick={() => onAnnotate(sample.pairId)}>
            <AnnotateIcon fontSize="small" />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Pair ID</strong></TableCell>
              {targetKind === 'M1' && (
                <>
                  <TableCell><strong>Verbatim Conseiller</strong></TableCell>
                  <TableCell align="center"><strong>Densité</strong></TableCell>
                  <TableCell align="center"><strong>Count</strong></TableCell>
                  <TableCell><strong>Verbes détectés</strong></TableCell>
                </>
              )}
              {targetKind === 'M2' && (
                <>
                  <TableCell><strong>Conseiller</strong></TableCell>
                  <TableCell><strong>Client</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                  <TableCell><strong>Tokens alignés</strong></TableCell>
                </>
              )}
              {targetKind === 'M3' && (
                <>
                  <TableCell><strong>Verbatim Client</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                  <TableCell><strong>Marqueurs</strong></TableCell>
                </>
              )}
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedSamples.map((sample) => {
              if (targetKind === 'M1') return renderM1Row(sample as M1CalculationSample);
              if (targetKind === 'M2') return renderM2Row(sample as M2CalculationSample);
              return renderM3Row(sample as M3CalculationSample);
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination simple */}
      {samples.length > pageSize && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
          <Button
            size="small"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Précédent
          </Button>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>
            {page + 1} / {Math.ceil(samples.length / pageSize)}
          </Typography>
          <Button
            size="small"
            disabled={(page + 1) * pageSize >= samples.length}
            onClick={() => setPage(p => p + 1)}
          >
            Suivant
          </Button>
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  targetKind,
  classificationMetrics,
  numericMetrics,
  calculationSamples,
  classifierLabel,
  errorPairIds,
  onAnnotateErrors,
  onAnnotateSample,
  loading,
}) => {
  const isClassification = targetKind === 'X' || targetKind === 'Y';
  const isNumeric = targetKind === 'M1' || targetKind === 'M2' || targetKind === 'M3';

  const errorCount = errorPairIds?.length || 0;

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {isClassification ? <AssessmentIcon color="primary" /> : <InsightsIcon color="primary" />}
          <Typography variant="h6">
            Section A : Performance Intrinsèque
          </Typography>
          <Chip
            label={targetKind}
            color="primary"
            size="small"
          />
          {isClassification && classificationMetrics && (
            <Chip
              label={`Accuracy: ${classificationMetrics.accuracy.toFixed(1)}%`}
              color={classificationMetrics.accuracy >= 70 ? 'success' : 'warning'}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Contenu selon le type */}
        {isClassification && classificationMetrics && (
          <ClassificationMetricsPanel
            metrics={classificationMetrics}
            classifierLabel={classifierLabel}
          />
        )}

        {isNumeric && numericMetrics && (
          <>
            <NumericMetricsPanel
              metrics={numericMetrics}
              targetKind={targetKind as 'M1' | 'M2' | 'M3'}
              classifierLabel={classifierLabel}
            />

            {/* Échantillons de calculs */}
            {calculationSamples && calculationSamples.length > 0 && (
              <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2">
                      Échantillon de Calculs
                    </Typography>
                    <Chip
                      label={`${calculationSamples.length} exemples`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <CalculationSamplesPanel
                    targetKind={targetKind as 'M1' | 'M2' | 'M3'}
                    samples={calculationSamples}
                    onAnnotate={onAnnotateSample}
                  />
                </AccordionDetails>
              </Accordion>
            )}
          </>
        )}

        {/* Bouton Annoter les erreurs */}
        {errorCount > 0 && onAnnotateErrors && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <ErrorIcon color="error" />
                <Typography variant="body2">
                  <strong>{errorCount}</strong> erreurs détectées
                </Typography>
              </Stack>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<AnnotateIcon />}
                onClick={() => onAnnotateErrors(errorPairIds!)}
              >
                Annoter les erreurs
              </Button>
            </Stack>
          </Box>
        )}

        {/* État vide */}
        {!classificationMetrics && !numericMetrics && !loading && (
          <Alert severity="info">
            Exécutez un test pour voir les métriques de performance.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceSection;
