// src/features/phase3-analysis/level1-validation/ui/components/Level2Preview/Level2PreviewPanel.tsx
/**
 * Panneau de prévisualisation Level 2 pour Level 1
 * 
 * Affiche les indicateurs H1/H2 après validation algorithmique
 * pour anticiper l'exploitabilité des résultats.
 */

import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import InfoIcon from '@mui/icons-material/Info';

import {
  useLevel2Preview,
  ThresholdMode,
  ValidationMetrics,
  H1PreviewData,
  H2PreviewData,
} from '../../hooks/useLevel2Preview';

// ============================================================================
// TYPES
// ============================================================================

interface Level2PreviewPanelProps {
  /** Métriques de l'algorithme X (optionnel) */
  xMetrics?: ValidationMetrics;
  /** Métriques de l'algorithme Y (optionnel) */
  yMetrics?: ValidationMetrics;
  /** Callback pour naviguer vers Level 2 */
  onNavigateToLevel2?: () => void;
  /** Calculer automatiquement au montage */
  autoCalculate?: boolean;
  /** Accordion ouvert par défaut */
  defaultExpanded?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ReadinessChip: React.FC<{
  level: 'READY' | 'PARTIAL' | 'INSUFFICIENT';
  score: number;
}> = ({ level, score }) => {
  const config = {
    READY: { color: 'success' as const, icon: <CheckCircleIcon />, label: 'PRÊT' },
    PARTIAL: { color: 'warning' as const, icon: <WarningIcon />, label: 'PARTIEL' },
    INSUFFICIENT: { color: 'error' as const, icon: <ErrorIcon />, label: 'INSUFFISANT' },
  };

  const { color, icon, label } = config[level];

  return (
    <Chip
      icon={icon}
      label={`${label} (${score}/100)`}
      color={color}
      size="small"
      sx={{ fontWeight: 'bold' }}
    />
  );
};

const CriterionRow: React.FC<{
  label: string;
  met: boolean;
  value: string;
  threshold: string;
  tooltip?: string;
}> = ({ label, met, value, threshold, tooltip }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
    {met ? (
      <CheckCircleIcon color="success" fontSize="small" />
    ) : (
      <ErrorIcon color="error" fontSize="small" />
    )}
    <Typography variant="body2" sx={{ flex: 1 }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 'bold',
        color: met ? 'success.main' : 'error.main',
      }}
    >
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      (seuil: {threshold})
    </Typography>
    {tooltip && (
      <Tooltip title={tooltip}>
        <InfoIcon fontSize="small" color="action" />
      </Tooltip>
    )}
  </Box>
);

const H1Section: React.FC<{ data: H1PreviewData }> = ({ data }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        📊 H1 Readiness
      </Typography>
      <ReadinessChip level={data.h1ReadinessLevel} score={data.h1ReadinessScore} />
      <Typography variant="caption" color="text.secondary">
        ({data.criteriaMet}/{data.criteriaTotal} critères)
      </Typography>
    </Box>

    {/* Métriques algorithme X */}
    {data.xAccuracy > 0 && (
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Qualité Algorithme X
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="body2">Accuracy</Typography>
            <Typography variant="h6" color={data.xAccuracy >= 70 ? 'success.main' : 'warning.main'}>
              {data.xAccuracy}%
            </Typography>
          </Box>
          {data.xF1Macro > 0 && (
            <Box>
              <Typography variant="body2">F1 Macro</Typography>
              <Typography variant="h6">{data.xF1Macro.toFixed(2)}</Typography>
            </Box>
          )}
          {data.xKappa > 0 && (
            <Box>
              <Typography variant="body2">Kappa</Typography>
              <Typography variant="h6">{data.xKappa.toFixed(2)}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    )}

    {/* Critères H1 */}
    <Box sx={{ mb: 2 }}>
      <CriterionRow
        label="Actions → Positif"
        met={data.criteriaStatus.actionsPositive.met}
        value={`${data.criteriaStatus.actionsPositive.value}%`}
        threshold={`≥${data.criteriaStatus.actionsPositive.threshold}%`}
      />
      <CriterionRow
        label="Actions → Négatif"
        met={data.criteriaStatus.actionsNegative.met}
        value={`${data.criteriaStatus.actionsNegative.value}%`}
        threshold={`≤${data.criteriaStatus.actionsNegative.threshold}%`}
      />
      <CriterionRow
        label="Explications → Positif"
        met={data.criteriaStatus.explanationsPositive.met}
        value={`${data.criteriaStatus.explanationsPositive.value}%`}
        threshold={`≤${data.criteriaStatus.explanationsPositive.threshold}%`}
      />
      <CriterionRow
        label="Explications → Négatif"
        met={data.criteriaStatus.explanationsNegative.met}
        value={`${data.criteriaStatus.explanationsNegative.value}%`}
        threshold={`≥${data.criteriaStatus.explanationsNegative.threshold}%`}
      />
      <CriterionRow
        label="Écart Empirique"
        met={data.criteriaStatus.empiricalGap.met}
        value={`+${data.criteriaStatus.empiricalGap.value} pts`}
        threshold={`≥${data.criteriaStatus.empiricalGap.threshold} pts`}
      />
      <CriterionRow
        label="Significativité Stats"
        met={data.criteriaStatus.statisticalSignificance.met}
        value={`p=${data.criteriaStatus.statisticalSignificance.pValue < 0.001 ? '<0.001' : data.criteriaStatus.statisticalSignificance.pValue.toFixed(3)}, V=${data.criteriaStatus.statisticalSignificance.cramersV.toFixed(3)}`}
        threshold="p<0.05, V≥0.15"
      />
    </Box>

    {/* Distribution X - Afficher seulement si des données existent */}
    {Object.values(data.xDistribution).some(v => v > 0) && (
      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Distribution des prédictions X
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          {Object.entries(data.xDistribution)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}%`}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
        </Box>
      </Box>
    )}

    {/* Recommandations */}
    {data.recommendations.length > 0 && (
      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          💡 Recommandations
        </Typography>
        {data.recommendations.map((rec, idx) => (
          <Typography key={idx} variant="body2" sx={{ ml: 1 }}>
            {rec}
          </Typography>
        ))}
      </Box>
    )}
  </Box>
);

const H2Section: React.FC<{ data: H2PreviewData }> = ({ data }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        🔗 H2 Readiness (Médiation)
      </Typography>
      <ReadinessChip level={data.h2ReadinessLevel} score={data.h2ReadinessScore} />
      <Typography variant="caption" color="text.secondary">
        ({data.criteriaMet}/{data.criteriaTotal} critères)
      </Typography>
    </Box>

    {/* Couverture des médiateurs */}
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        Couverture des médiateurs
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        {[
          { label: 'M1 (Verbes)', value: data.m1Coverage, met: data.criteriaStatus.m1Coverage.met },
          { label: 'M2 (Alignement)', value: data.m2Coverage, met: data.criteriaStatus.m2Coverage.met },
          { label: 'M3 (Cognitif)', value: data.m3Coverage, met: data.criteriaStatus.m3Coverage.met },
        ].map(({ label, value, met }) => (
          <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="caption">{label}</Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(value, 100)}
                color={met ? 'success' : value >= 50 ? 'warning' : 'error'}
                sx={{ height: 8, borderRadius: 4, width: '100%' }}
              />
            </Box>
            <Typography
              variant="body2"
              fontWeight="bold"
              color={met ? 'success.main' : 'error.main'}
            >
              {value.toFixed(0)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>

    {/* Corrélations */}
    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        Corrélations M → Y (préliminaires)
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
        {[
          { label: 'M1', value: data.m1Correlation, met: data.criteriaStatus.m1Significant.met },
          { label: 'M2', value: data.m2Correlation, met: data.criteriaStatus.m2Significant.met },
          { label: 'M3', value: data.m3Correlation, met: data.criteriaStatus.m3Significant.met },
        ].map(({ label, value, met }) => (
          <Box key={label}>
            <Typography variant="body2">{label}</Typography>
            <Typography
              variant="h6"
              color={value === null ? 'text.disabled' : met ? 'success.main' : 'warning.main'}
            >
              {value !== null ? `r=${value.toFixed(3)}` : 'N/A'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>

    {/* Moyennes par groupe */}
    {(data.m1ActionsMean !== null || data.m2ActionsMean !== null) && (
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Moyennes Actions vs Explications
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption">M1</Typography>
            <Typography variant="body2">
              Actions: {data.m1ActionsMean?.toFixed(3) ?? 'N/A'}
            </Typography>
            <Typography variant="body2">
              Explications: {data.m1ExplanationsMean?.toFixed(3) ?? 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption">M2</Typography>
            <Typography variant="body2">
              Actions: {data.m2ActionsMean?.toFixed(3) ?? 'N/A'}
            </Typography>
            <Typography variant="body2">
              Explications: {data.m2ExplanationsMean?.toFixed(3) ?? 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption">M3</Typography>
            <Typography variant="body2">
              Actions: {data.m3ActionsMean?.toFixed(3) ?? 'N/A'}
            </Typography>
            <Typography variant="body2">
              Explications: {data.m3ExplanationsMean?.toFixed(3) ?? 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Box>
    )}

    {/* Recommandations */}
    {data.recommendations.length > 0 && (
      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          💡 Recommandations
        </Typography>
        {data.recommendations.map((rec, idx) => (
          <Typography key={idx} variant="body2" sx={{ ml: 1 }}>
            {rec}
          </Typography>
        ))}
      </Box>
    )}
  </Box>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Level2PreviewPanel: React.FC<Level2PreviewPanelProps> = ({
  xMetrics,
  yMetrics,
  onNavigateToLevel2,
  autoCalculate = false,
  defaultExpanded = false,
}) => {
  const {
    preview,
    isCalculating,
    error,
    thresholdMode,
    calculatePreview,
    setThresholdMode,
    h1Preview,
    h2Preview,
    coverage,
  } = useLevel2Preview({ defaultThresholdMode: 'REALISTIC' });

  // Calcul automatique au montage si demandé
  useEffect(() => {
    if (autoCalculate && !preview && !isCalculating) {
      calculatePreview(xMetrics, yMetrics);
    }
  }, [autoCalculate, preview, isCalculating, calculatePreview, xMetrics, yMetrics]);

  const handleCalculate = () => {
    calculatePreview(xMetrics, yMetrics);
  };

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ThresholdMode | null) => {
    if (newMode) {
      setThresholdMode(newMode);
    }
  };

  // Déterminer l'icône du header
  const getHeaderIcon = () => {
    if (!preview) return '📊';
    switch (preview.overallReadiness) {
      case 'READY': return '✅';
      case 'PARTIAL': return '⚠️';
      default: return '❌';
    }
  };

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {getHeaderIcon()} Prévisualisation Level 2
          </Typography>
          {preview && (
            <ReadinessChip
              level={preview.overallReadiness}
              score={preview.overallScore}
            />
          )}
          {isCalculating && <CircularProgress size={20} />}
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        {/* Barre d'actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleCalculate}
            disabled={isCalculating}
            startIcon={<RefreshIcon />}
          >
            {preview ? 'Recalculer' : 'Calculer Preview'}
          </Button>

          <ToggleButtonGroup
            value={thresholdMode}
            exclusive
            onChange={handleModeChange}
            size="small"
          >
            <ToggleButton value="STRICT">
              <Tooltip title="Seuils académiques stricts">
                <span>Strict</span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="REALISTIC">
              <Tooltip title="Seuils équilibrés (recommandé)">
                <span>Réaliste</span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="EMPIRICAL">
              <Tooltip title="Seuils adaptés aux données">
                <span>Empirique</span>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {onNavigateToLevel2 && preview?.overallReadiness === 'READY' && (
            <Button
              variant="outlined"
              size="small"
              color="success"
              onClick={onNavigateToLevel2}
              endIcon={<NavigateNextIcon />}
            >
              Passer à Level 2
            </Button>
          )}
        </Box>

        {/* Couverture rapide */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Couverture actuelle :</strong> {coverage.total} paires | 
            X: {coverage.withX} ({coverage.total > 0 ? Math.round(coverage.withX / coverage.total * 100) : 0}%) | 
            Y: {coverage.withY} ({coverage.total > 0 ? Math.round(coverage.withY / coverage.total * 100) : 0}%) | 
            M1: {coverage.withM1} | M2: {coverage.withM2} | M3: {coverage.withM3}
          </Typography>
        </Alert>

        {/* Erreur */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Contenu principal */}
        {preview ? (
          <Box>
            {/* Layout 2 colonnes avec flexbox */}
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              flexDirection: { xs: 'column', md: 'row' } 
            }}>
              <Box sx={{ flex: 1 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {h1Preview && <H1Section data={h1Preview} />}
                </Paper>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {h2Preview && <H2Section data={h2Preview} />}
                </Paper>
              </Box>
            </Box>

            {/* Timestamp */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Calculé le {new Date(preview.timestamp).toLocaleString()} (mode: {preview.thresholdMode})
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Cliquez sur "Calculer Preview" pour voir les indicateurs Level 2
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default Level2PreviewPanel;
