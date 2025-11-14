// src/app/(protected)/analysis/components/metrics-framework/components/MetricsDashboard.tsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Error as ErrorIcon,
  Psychology as CognitiveIcon,
  Chat as LIIcon,
  Assessment as AnalysisIcon,
} from "@mui/icons-material";
import { useMetricsEngine } from "../hooks/useMetricsEngine";
import {
  MetricsDomain,
  TurnTaggedData,
  BaseIndicatorConfig,
  IndicatorResult,
  AlgorithmConfig,
} from "../core/types/base";

interface MetricsDashboardProps {
  domain: MetricsDomain;
  data: TurnTaggedData[];
  onResultsChange?: (results: Record<string, IndicatorResult[]>) => void;
  enableAdvancedFeatures?: boolean;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  domain,
  data,
  onResultsChange,
  enableAdvancedFeatures = true,
}) => {
  // Configuration du moteur de métriques
  const [engineConfig, setEngineConfig] = useState({
    domain,
    enableCaching: true,
    enableBenchmarking: false,
    enableRealTimeComparison: false,
    maxConcurrentCalculations: 3,
    cacheTimeout: 300000, // 5 minutes
    processingTimeout: 30000, // 30 secondes
  });

  // Hook principal du framework
  const {
    indicators,
    results,
    loading,
    error,
    calculateMetrics,
    switchAlgorithm,
    getAvailableAlgorithms,
  } = useMetricsEngine(engineConfig);

  // État local pour l'interface
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Performance simulée
  const [performanceMetrics] = useState({
    processing_time_ms: 150,
    throughput_per_second: 12.5,
    memory_usage_mb: 45.2,
    error_rate: 0.02,
  });

  // Calcul automatique quand les données changent
  useEffect(() => {
    if (autoCalculate && data && data.length > 0) {
      calculateMetrics(data);
    }
  }, [data, autoCalculate, calculateMetrics]);

  // Notifier les changements de résultats
  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(results);
    }
  }, [results, onResultsChange]);

  // Sélection/désélection de tous les indicateurs
  const handleSelectAllIndicators = (select: boolean) => {
    if (select) {
      setSelectedIndicators(indicators.map((i) => i.id));
    } else {
      setSelectedIndicators([]);
    }
  };

  // Démarrer le calcul des métriques
  const handleCalculateMetrics = async () => {
    if (!data || data.length === 0) {
      alert("Aucune donnée disponible pour le calcul");
      return;
    }

    await calculateMetrics(data);
  };

  // Changer l'algorithme pour un indicateur
  const handleAlgorithmChange = (indicatorId: string, algorithmId: string) => {
    switchAlgorithm(indicatorId, algorithmId);

    // Recalculer automatiquement si activé
    if (autoCalculate && data && data.length > 0) {
      calculateMetrics(data);
    }
  };

  // Obtenir le statut d'un indicateur
  const getIndicatorStatus = (
    indicatorId: string
  ): {
    status: "pending" | "success" | "error" | "empty";
    color: "default" | "primary" | "secondary" | "error";
    resultCount: number;
  } => {
    const indicatorResults = results[indicatorId] || [];

    if (indicatorResults.length === 0) {
      return { status: "empty", color: "default", resultCount: 0 };
    }

    const hasErrors = indicatorResults.some((r) => r.error);
    if (hasErrors) {
      return {
        status: "error",
        color: "error",
        resultCount: indicatorResults.length,
      };
    }

    return {
      status: "success",
      color: "primary",
      resultCount: indicatorResults.length,
    };
  };

  // Obtenir l'icône du domaine
  const getDomainIcon = () => {
    switch (domain) {
      case "cognitive":
        return <CognitiveIcon sx={{ fontSize: 40, color: "primary.main" }} />;
      case "li":
        return <LIIcon sx={{ fontSize: 40, color: "secondary.main" }} />;
      case "conversational_analysis":
        return <AnalysisIcon sx={{ fontSize: 40, color: "info.main" }} />;
      default:
        return <SettingsIcon sx={{ fontSize: 40 }} />;
    }
  };

  // Obtenir le titre du domaine
  const getDomainTitle = () => {
    switch (domain) {
      case "cognitive":
        return "Sciences Cognitives";
      case "li":
        return "Linguistique Interactionnelle";
      case "conversational_analysis":
        return "Analyse Conversationnelle";
      default:
        return "Métriques";
    }
  };

  // Obtenir la description du domaine
  const getDomainDescription = () => {
    switch (domain) {
      case "cognitive":
        return "Analyse des processus cognitifs et neuronaux dans la conversation";
      case "li":
        return "Étude des mécanismes d'interaction et de coordination linguistique";
      case "conversational_analysis":
        return "Analyse empirique des patterns conversationnels";
      default:
        return "Framework de métriques conversationnelles";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête avec contrôles principaux */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {getDomainIcon()}
            <Box>
              <Typography variant="h5" component="h2">
                {getDomainTitle()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getDomainDescription()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoCalculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                />
              }
              label="Calcul automatique"
            />

            <Button
              variant="contained"
              startIcon={
                loading ? <CircularProgress size={20} /> : <PlayIcon />
              }
              onClick={handleCalculateMetrics}
              disabled={loading || !data || data.length === 0}
            >
              {loading ? "Calcul..." : "Calculer"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                // Fonction de nettoyage à implémenter
                console.log("Clear results");
              }}
              disabled={loading}
            >
              Nettoyer
            </Button>

            {enableAdvancedFeatures && (
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Avancé
              </Button>
            )}
          </Box>
        </Box>

        {/* Informations sur les données - CORRECTION: Remplacement Grid par Box */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6">{data?.length || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Tours de parole
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6">{indicators.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Indicateurs disponibles
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6">
                {Object.keys(results).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Indicateurs calculés
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6">
                {indicators.length > 0
                  ? Math.round(
                      (Object.keys(results).length / indicators.length) * 100
                    )
                  : 0}
                %
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Couverture
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Configuration avancée */}
      {showAdvanced && enableAdvancedFeatures && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Configuration avancée</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
                mb: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={engineConfig.enableCaching}
                    onChange={(e) =>
                      setEngineConfig((prev) => ({
                        ...prev,
                        enableCaching: e.target.checked,
                      }))
                    }
                  />
                }
                label="Cache activé"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Calculs parallèles</InputLabel>
                <Select
                  value={engineConfig.maxConcurrentCalculations}
                  onChange={(e) =>
                    setEngineConfig((prev) => ({
                      ...prev,
                      maxConcurrentCalculations: Number(e.target.value),
                    }))
                  }
                >
                  <MenuItem value={1}>1 (Séquentiel)</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3 (Recommandé)</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Timeout (secondes)</InputLabel>
                <Select
                  value={engineConfig.processingTimeout / 1000}
                  onChange={(e) =>
                    setEngineConfig((prev) => ({
                      ...prev,
                      processingTimeout: Number(e.target.value) * 1000,
                    }))
                  }
                >
                  <MenuItem value={10}>10s</MenuItem>
                  <MenuItem value={30}>30s (Défaut)</MenuItem>
                  <MenuItem value={60}>60s</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Métriques de performance */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Métriques de performance
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SpeedIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">
                      {performanceMetrics.processing_time_ms.toFixed(0)}ms
                    </Typography>
                    <Typography variant="caption">
                      Temps de traitement
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUpIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">
                      {performanceMetrics.throughput_per_second.toFixed(1)}/s
                    </Typography>
                    <Typography variant="caption">Débit</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MemoryIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">
                      {performanceMetrics.memory_usage_mb.toFixed(1)}MB
                    </Typography>
                    <Typography variant="caption">Mémoire</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ErrorIcon fontSize="small" />
                  <Box>
                    <Typography variant="body2">
                      {(performanceMetrics.error_rate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">Erreurs</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Sélection des indicateurs */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6">Indicateurs disponibles</Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              onClick={() => handleSelectAllIndicators(true)}
              disabled={loading}
            >
              Tout sélectionner
            </Button>
            <Button
              size="small"
              onClick={() => handleSelectAllIndicators(false)}
              disabled={loading}
            >
              Tout désélectionner
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {indicators.map((indicator) => {
            const status = getIndicatorStatus(indicator.id);
            const isSelected = selectedIndicators.includes(indicator.id);
            const availableAlgorithms = getAvailableAlgorithms(indicator.id);

            return (
              <Card
                key={indicator.id}
                variant="outlined"
                sx={{
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? "primary.main" : "divider",
                  cursor: "pointer",
                  height: "100%",
                }}
                onClick={() => {
                  if (isSelected) {
                    setSelectedIndicators((prev) =>
                      prev.filter((id) => id !== indicator.id)
                    );
                  } else {
                    setSelectedIndicators((prev) => [...prev, indicator.id]);
                  }
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" component="h3">
                      {indicator.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        status.resultCount > 0
                          ? `${status.resultCount} résultats`
                          : status.status
                      }
                      color={status.color}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {indicator.category} • {indicator.outputType}
                  </Typography>

                  <Chip
                    size="small"
                    label={indicator.implementationStatus}
                    color={
                      indicator.implementationStatus === "implemented"
                        ? "success"
                        : indicator.implementationStatus === "partial"
                        ? "warning"
                        : "default"
                    }
                    sx={{ mb: 1 }}
                  />

                  <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                    {indicator.theoreticalFoundation}
                  </Typography>

                  {/* Sélection d'algorithme */}
                  {availableAlgorithms.length > 1 && (
                    <FormControl
                      fullWidth
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <InputLabel>Algorithme</InputLabel>
                      <Select
                        value={
                          indicator.defaultAlgorithm ||
                          availableAlgorithms[0]?.id ||
                          ""
                        }
                        onChange={(e) =>
                          handleAlgorithmChange(indicator.id, e.target.value)
                        }
                        disabled={loading}
                      >
                        {availableAlgorithms.map((algorithm) => (
                          <MenuItem key={algorithm.id} value={algorithm.id}>
                            <Box>
                              <Typography variant="body2">
                                {algorithm.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {algorithm.type} • v{algorithm.version}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Message si aucun indicateur disponible */}
        {indicators.length === 0 && (
          <Alert severity="info">
            <Typography variant="body2">
              Aucun indicateur disponible pour le domaine "{domain}". Les
              indicateurs pour ce domaine sont en cours de développement.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Résultats détaillés par indicateur */}
      {Object.keys(results).length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Résultats détaillés
          </Typography>

          {Object.entries(results).map(([indicatorId, indicatorResults]) => {
            const indicator = indicators.find((i) => i.id === indicatorId);

            return (
              <Accordion key={indicatorId}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <Typography variant="subtitle1">
                      {indicator?.name || indicatorId}
                    </Typography>

                    <Chip
                      size="small"
                      label={`${indicatorResults.length} résultats`}
                      color="primary"
                    />

                    {indicatorResults.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Confiance moyenne:{" "}
                        {(
                          (indicatorResults.reduce(
                            (sum, r) => sum + r.confidence,
                            0
                          ) /
                            indicatorResults.length) *
                          100
                        ).toFixed(0)}
                        %
                      </Typography>
                    )}
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Valeur</TableCell>
                          <TableCell>Confiance</TableCell>
                          <TableCell>Temps</TableCell>
                          <TableCell>Explication</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {indicatorResults.slice(0, 10).map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={
                                  typeof result.value === "number"
                                    ? `${(result.value * 100).toFixed(1)}%`
                                    : String(result.value)
                                }
                                color={result.error ? "error" : "primary"}
                              />
                            </TableCell>
                            <TableCell>
                              {(result.confidence * 100).toFixed(0)}%
                            </TableCell>
                            <TableCell>
                              {result.processing_time_ms
                                ? `${result.processing_time_ms.toFixed(1)}ms`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {result.explanation || "Aucune explication"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {indicatorResults.length > 10 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      ... et {indicatorResults.length - 10} résultats
                      supplémentaires
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Paper>
      )}

      {/* Message si aucun résultat */}
      {Object.keys(results).length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun résultat disponible
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sélectionnez des indicateurs et cliquez sur "Calculer" pour
            commencer l'analyse.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
