// src/app/(protected)/analysis/components/UnifiedMetricsInterface.tsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  ExpandMore as ExpandIcon,
  Compare as CompareIcon,
  Psychology as CognitiveIcon,
  Timeline as LIIcon,
  Assessment as ACIcon,
  Settings as SettingsIcon,
  Speed as PerformanceIcon,
  TrendingUp as ConvergenceIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Science as ValidationIcon,
} from "@mui/icons-material";

// Imports du framework unifié
import { useMetricsEngine } from "../metrics-framework/hooks/useMetricsEngine";
import { MetricsDomain } from "../metrics-framework/core/types/base";

// Imports pour la migration
import { registerCognitiveIndicators } from "../cognitive-metrics/migration/adaptUseCognitiveMetrics";
import { registerLIIndicators } from "../li-metrics/indicators/CommonGroundIndicator";

// Import de l'interface existante pour comparaison
import CognitiveMetrics from "../cognitive-metrics/CognitiveMetrics";
import LinguisticInteractionalMetrics from "../li-metrics/LinguisticInteractionalMetrics";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metrics-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Interface unifiée pour tous les domaines de métriques
 * Avec comparaison algorithmes et validation de convergence
 */
const UnifiedMetricsInterface: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [showLegacyInterface, setShowLegacyInterface] = useState(false);
  const [showConvergenceValidation, setShowConvergenceValidation] =
    useState(false);

  // Configuration des domaines
  const [activeDomain, setActiveDomain] = useState<MetricsDomain>("cognitive");

  // Hooks pour chaque domaine
  const cognitiveEngine = useMetricsEngine({
    domain: "cognitive",
    enableCaching: true,
    enableBenchmarking: true,
    enableRealTimeComparison: true,
    enableConvergenceValidation: true,
  });

  const liEngine = useMetricsEngine({
    domain: "li",
    enableCaching: true,
    enableBenchmarking: true,
    enableRealTimeComparison: true,
  });

  const acEngine = useMetricsEngine({
    domain: "conversational_analysis",
    enableCaching: true,
    enableBenchmarking: false, // Pas encore implémenté
  });

  // Enregistrement initial des indicateurs
  useEffect(() => {
    registerCognitiveIndicators();
    registerLIIndicators();
    console.log("✅ Framework unifié initialisé");
  }, []);

  // Sélection de l'engine actuel
  const currentEngine =
    activeDomain === "cognitive"
      ? cognitiveEngine
      : activeDomain === "li"
      ? liEngine
      : acEngine;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Changer de domaine selon l'onglet
    switch (newValue) {
      case 0:
        setActiveDomain("cognitive");
        break;
      case 1:
        setActiveDomain("li");
        break;
      case 2:
        setActiveDomain("conversational_analysis");
        break;
      case 3:
        setShowConvergenceValidation(true);
        break;
    }
  };

  return (
    <Box sx={{ p: 3, width: "100%", maxWidth: "100%" }}>
      {/* En-tête du framework unifié */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
              <CompareIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold">
                🚀 Framework Unifié de Métriques
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Analyse Multi-Domaines avec Comparaison d'Algorithmes
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                />
              }
              label="Mode Comparaison"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showLegacyInterface}
                  onChange={(e) => setShowLegacyInterface(e.target.checked)}
                />
              }
              label="Interface Existante"
            />
          </Box>
        </Box>

        {/* Statut du framework */}
        <Alert
          severity={
            currentEngine.error
              ? "error"
              : currentEngine.loading
              ? "info"
              : "success"
          }
          sx={{ mt: 2 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            📊 Statut Framework Unifié
          </Typography>
          <Typography variant="body2">
            <strong>Domaine actif:</strong> {activeDomain.toUpperCase()} •
            <strong> Indicateurs:</strong> {currentEngine.indicators.length} •
            <strong> Algorithmes:</strong>{" "}
            {Object.keys(currentEngine.availableAlgorithms).length} •
            <strong> Performance:</strong>{" "}
            {currentEngine.performanceMetrics.lastCalculationTime.toFixed(0)}ms
          </Typography>
          {currentEngine.loading && <LinearProgress sx={{ mt: 1 }} />}
          {currentEngine.error && (
            <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
              ❌ Erreur: {currentEngine.error}
            </Typography>
          )}
        </Alert>
      </Box>

      {/* Interface conditionnelle */}
      {showLegacyInterface ? (
        // INTERFACE EXISTANTE PRÉSERVÉE
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Interface Existante (Préservée)
            </Typography>
            <Typography variant="body2">
              Votre interface actuelle fonctionne exactement comme avant. Aucun
              changement dans vos workflows existants.
            </Typography>
          </Alert>

          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab
              label="Métriques Cognitives"
              icon={<CognitiveIcon />}
              iconPosition="start"
            />
            <Tab label="Métriques LI" icon={<LIIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <CognitiveMetrics />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <LinguisticInteractionalMetrics />
          </TabPanel>
        </Box>
      ) : (
        // NOUVELLE INTERFACE UNIFIÉE
        <Box>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab
              label="Sciences Cognitives"
              icon={<CognitiveIcon />}
              iconPosition="start"
            />
            <Tab
              label="Linguistique Interactionnelle"
              icon={<LIIcon />}
              iconPosition="start"
            />
            <Tab
              label="Analyse Conversationnelle"
              icon={<ACIcon />}
              iconPosition="start"
            />
            <Tab
              label="Validation Convergence"
              icon={<ConvergenceIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Panel Sciences Cognitives */}
          <TabPanel value={activeTab} index={0}>
            <CognitiveDomainPanel
              engine={cognitiveEngine}
              showComparison={showComparison}
            />
          </TabPanel>

          {/* Panel Linguistique Interactionnelle */}
          <TabPanel value={activeTab} index={1}>
            <LIDomainPanel engine={liEngine} showComparison={showComparison} />
          </TabPanel>

          {/* Panel Analyse Conversationnelle */}
          <TabPanel value={activeTab} index={2}>
            <ACDomainPanel engine={acEngine} showComparison={showComparison} />
          </TabPanel>

          {/* Panel Validation Convergence */}
          <TabPanel value={activeTab} index={3}>
            <ConvergenceValidationPanel
              cognitiveEngine={cognitiveEngine}
              liEngine={liEngine}
              acEngine={acEngine}
            />
          </TabPanel>
        </Box>
      )}
    </Box>
  );
};

// ================ COMPOSANTS SPÉCIALISÉS PAR DOMAINE ================

/**
 * Panel pour le domaine Sciences Cognitives
 */
const CognitiveDomainPanel: React.FC<{
  engine: ReturnType<typeof useMetricsEngine>;
  showComparison: boolean;
}> = ({ engine, showComparison }) => {
  const [selectedIndicatorForComparison, setSelectedIndicatorForComparison] =
    useState<string>("");
  const [comparisonResults, setComparisonResults] = useState<any>(null);

  const handleCompareAlgorithms = async (indicatorId: string) => {
    const availableAlgorithms = engine.availableAlgorithms[indicatorId] || [];
    if (availableAlgorithms.length < 2) {
      alert("Au moins 2 algorithmes nécessaires pour la comparaison");
      return;
    }

    try {
      const results = await engine.compareAlgorithms(
        indicatorId,
        availableAlgorithms
      );
      setComparisonResults(results);
      setSelectedIndicatorForComparison(indicatorId);
    } catch (error) {
      console.error("Erreur comparaison:", error);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center" }}
      >
        <CognitiveIcon sx={{ mr: 2 }} />
        Sciences Cognitives - Framework Unifié
      </Typography>

      {/* Métriques globales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Familles Analysées</Typography>
              <Typography variant="h4" color="primary.main">
                {engine.familyResults.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Efficacité Moyenne</Typography>
              <Typography variant="h4" color="success.main">
                {(engine.globalMetrics.averageEffectiveness * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Meilleure Famille</Typography>
              <Typography variant="h6" color="primary.main">
                {engine.globalMetrics.topPerformingFamily || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Performance</Typography>
              <Typography variant="h4" color="warning.main">
                {engine.performanceMetrics.lastCalculationTime.toFixed(0)}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des indicateurs avec comparaison */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          📊 Indicateurs Cognitifs Disponibles
        </Typography>

        <Grid container spacing={2}>
          {engine.indicators.map((indicator) => {
            const indicatorResults = engine.results[indicator.getId()] || [];
            const avgValue =
              indicatorResults.length > 0
                ? indicatorResults.reduce(
                    (sum, r) =>
                      sum + (typeof r.value === "number" ? r.value : 0),
                    0
                  ) / indicatorResults.length
                : 0;

            return (
              <Grid item xs={12} md={6} lg={4} key={indicator.getId()}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">
                        {indicator.getName()}
                      </Typography>
                      <Chip
                        label={indicator.getImplementationStatus()}
                        color={
                          indicator.getImplementationStatus() === "implemented"
                            ? "success"
                            : "warning"
                        }
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {indicator.getCategory()}
                    </Typography>

                    {/* Valeur moyenne */}
                    <Typography
                      variant="h4"
                      color="primary.main"
                      sx={{ mb: 2 }}
                    >
                      {typeof avgValue === "number"
                        ? avgValue.toFixed(2)
                        : avgValue}
                    </Typography>

                    {/* Algorithmes disponibles */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Algorithmes disponibles:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          flexWrap: "wrap",
                          mt: 0.5,
                        }}
                      >
                        {engine.availableAlgorithms[indicator.getId()]?.map(
                          (algId) => (
                            <Chip
                              key={algId}
                              label={algId}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.7rem" }}
                            />
                          )
                        )}
                      </Box>
                    </Box>

                    {/* Boutons d'action */}
                    {showComparison && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CompareIcon />}
                        onClick={() =>
                          handleCompareAlgorithms(indicator.getId())
                        }
                        disabled={
                          !engine.availableAlgorithms[indicator.getId()] ||
                          engine.availableAlgorithms[indicator.getId()].length <
                            2
                        }
                        fullWidth
                      >
                        Comparer Algorithmes
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Résultats par famille */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          📈 Résultats 3 par Famille de Stratégies
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Famille</strong>
                </TableCell>
                <TableCell>
                  <strong>Usage Total</strong>
                </TableCell>
                <TableCell>
                  <strong>Score Global</strong>
                </TableCell>
                <TableCell>
                  <strong>Efficacité</strong>
                </TableCell>
                <TableCell>
                  <strong>Détails</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {engine.familyResults.map((family) => (
                <TableRow key={family.family}>
                  <TableCell>
                    <Chip
                      label={family.family}
                      color={
                        family.family === "ENGAGEMENT"
                          ? "primary"
                          : family.family === "REFLET"
                          ? "success"
                          : family.family === "EXPLICATION"
                          ? "warning"
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>{family.totalUsage}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {family.globalScore.toFixed(2)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={family.globalScore * 100}
                        sx={{ width: 100, height: 8 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        family.effectiveness > 0.7
                          ? "success.main"
                          : family.effectiveness > 0.4
                          ? "warning.main"
                          : "error.main"
                      }
                    >
                      {(family.effectiveness * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      Voir Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog de comparaison d'algorithmes */}
      <Dialog
        open={!!comparisonResults}
        onClose={() => setComparisonResults(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            🔬 Comparaison Algorithmes - {selectedIndicatorForComparison}
          </Typography>
          <IconButton onClick={() => setComparisonResults(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {comparisonResults && (
            <AlgorithmComparisonView comparison={comparisonResults} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

/**
 * Panel pour le domaine Linguistique Interactionnelle
 */
const LIDomainPanel: React.FC<{
  engine: ReturnType<typeof useMetricsEngine>;
  showComparison: boolean;
}> = ({ engine, showComparison }) => {
  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center" }}
      >
        <LIIcon sx={{ mr: 2 }} />
        Linguistique Interactionnelle - Framework Unifié
      </Typography>

      {/* Métriques spécifiques LI */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Common Ground</Typography>
              <Typography variant="h4" color="primary.main">
                {(() => {
                  const cgResults =
                    engine.results["common_ground_status"] || [];
                  const etabliCount = cgResults.filter(
                    (r) => r.value === "CG_ETABLI"
                  ).length;
                  return cgResults.length > 0
                    ? Math.round((etabliCount / cgResults.length) * 100)
                    : 0;
                })()}
                %
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Taux de CG établi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Alignement</Typography>
              <Typography variant="h4" color="success.main">
                {(() => {
                  const alignResults =
                    engine.results["feedback_alignment"] || [];
                  const fortCount = alignResults.filter(
                    (r) => r.value === "ALIGNEMENT_FORT"
                  ).length;
                  return alignResults.length > 0
                    ? Math.round((fortCount / alignResults.length) * 100)
                    : 0;
                })()}
                %
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Taux d'alignement fort
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Performance LI</Typography>
              <Typography variant="h4" color="warning.main">
                {engine.performanceMetrics.lastCalculationTime.toFixed(0)}ms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Temps de calcul
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Indicateurs LI avec état d'implémentation */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🔧 État d'Implémentation des Indicateurs LI
        </Typography>

        <Grid container spacing={2}>
          {engine.indicators.map((indicator) => (
            <Grid item xs={12} md={6} key={indicator.getId()}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Typography variant="subtitle1">
                      {indicator.getName()}
                    </Typography>
                    <Chip
                      label={indicator.getImplementationStatus()}
                      color={
                        indicator.getImplementationStatus() === "implemented"
                          ? "success"
                          : indicator.getImplementationStatus() === "partial"
                          ? "warning"
                          : "error"
                      }
                      size="small"
                      sx={{ mr: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    <strong>Catégorie:</strong> {indicator.getCategory()}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Algorithmes disponibles:</strong>
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}
                  >
                    {engine.availableAlgorithms[indicator.getId()]?.map(
                      (algId) => (
                        <Chip
                          key={algId}
                          label={algId}
                          size="small"
                          variant="outlined"
                        />
                      )
                    )}
                  </Box>

                  {/* Résultats actuels */}
                  {engine.results[indicator.getId()] && (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        <strong>Résultats actuels:</strong>
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                        {engine.results[indicator.getId()]
                          .slice(0, 3)
                          .map((result, index) => (
                            <Alert key={index} severity="info" sx={{ mb: 1 }}>
                              <Typography variant="caption">
                                <strong>Valeur:</strong> {result.value} |
                                <strong> Confiance:</strong>{" "}
                                {(result.confidence * 100).toFixed(0)}% |
                                <strong> Algorithme:</strong>{" "}
                                {result.algorithm_used}
                              </Typography>
                            </Alert>
                          ))}
                      </Box>
                    </Box>
                  )}

                  {showComparison &&
                    engine.availableAlgorithms[indicator.getId()]?.length >
                      1 && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CompareIcon />}
                        sx={{ mt: 2 }}
                      >
                        Comparer Algorithmes LI
                      </Button>
                    )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Message d'encouragement développement */}
      <Alert severity="info">
        <Typography variant="subtitle2" gutterBottom>
          🚀 Développement en Cours - Indicateurs LI
        </Typography>
        <Typography variant="body2">
          Le framework LI est prêt pour extension. Prochaines étapes : •
          Algorithmes NLP avancés pour Common Ground • Analyse prosodique pour
          fluidité multimodale • Détection automatique des séquences de
          réparation
        </Typography>
      </Alert>
    </Box>
  );
};

/**
 * Panel pour le domaine Analyse Conversationnelle
 */
const ACDomainPanel: React.FC<{
  engine: ReturnType<typeof useMetricsEngine>;
  showComparison: boolean;
}> = ({ engine, showComparison }) => {
  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center" }}
      >
        <ACIcon sx={{ mr: 2 }} />
        Analyse Conversationnelle - Framework Unifié
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          🚧 Domaine en Préparation
        </Typography>
        <Typography variant="body2">
          Le domaine Analyse Conversationnelle sera intégré dans la prochaine
          phase. Architecture prête pour : • Patterns séquentiels (paires
          adjacentes) • Mécanismes de tour de parole • Organisation
          préférentielle • Structures de réparation
        </Typography>
      </Alert>

      <Paper sx={{ p: 3, bgcolor: alpha("#f0f0f0", 0.3) }}>
        <Typography variant="h6" gutterBottom>
          📋 Indicateurs AC Planifiés
        </Typography>
        <Grid container spacing={2}>
          {[
            "Organisation Séquentielle",
            "Gestion des Tours",
            "Préférences Structurelles",
            "Mécanismes de Réparation",
            "Patterns d'Interruption",
            "Clôtures Conversationnelles",
          ].map((indicator, index) => (
            <Grid item xs={12} md={6} key={indicator}>
              <Card sx={{ opacity: 0.7 }}>
                <CardContent>
                  <Typography variant="subtitle1">{indicator}</Typography>
                  <Chip label="Planifié" color="default" size="small" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

/**
 * Panel de Validation de Convergence (Nouveauté Thèse)
 */
const ConvergenceValidationPanel: React.FC<{
  cognitiveEngine: ReturnType<typeof useMetricsEngine>;
  liEngine: ReturnType<typeof useMetricsEngine>;
  acEngine: ReturnType<typeof useMetricsEngine>;
}> = ({ cognitiveEngine, liEngine, acEngine }) => {
  const [validationResults, setValidationResults] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  const runConvergenceValidation = async () => {
    try {
      setValidationLoading(true);
      const results = await cognitiveEngine.validateConvergence();
      setValidationResults(results);
    } catch (error) {
      console.error("Erreur validation convergence:", error);
    } finally {
      setValidationLoading(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center" }}
      >
        <ValidationIcon sx={{ mr: 2 }} />
        Validation de Convergence Multi-Niveaux
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          🔬 Nouveauté Thèse - Section 3.3
        </Typography>
        <Typography variant="body2">
          Validation de convergence entre les trois niveaux d'analyse : AC
          (empirique) ↔ LI (ressources) ↔ Cognitif (mécanismes)
        </Typography>
      </Alert>

      {/* Bouton de lancement */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<ConvergenceIcon />}
          onClick={runConvergenceValidation}
          disabled={validationLoading}
          sx={{ minWidth: 300 }}
        >
          {validationLoading
            ? "Validation en cours..."
            : "Lancer Validation de Convergence"}
        </Button>
        {validationLoading && <LinearProgress sx={{ mt: 2 }} />}
      </Box>

      {/* Résultats de validation */}
      {validationResults && (
        <ConvergenceResultsDisplay results={validationResults} />
      )}

      {/* État des domaines */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <CognitiveIcon sx={{ mr: 1 }} /> Sciences Cognitives
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cognitiveEngine.indicators.length} indicateurs •{" "}
                {cognitiveEngine.familyResults.length} familles
              </Typography>
              <Chip
                label={cognitiveEngine.loading ? "Calcul..." : "Prêt"}
                color={cognitiveEngine.loading ? "warning" : "success"}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <LIIcon sx={{ mr: 1 }} /> Linguistique Interactionnelle
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {liEngine.indicators.length} indicateurs •{" "}
                {liEngine.familyResults.length} familles
              </Typography>
              <Chip
                label={liEngine.loading ? "Calcul..." : "Prêt"}
                color={liEngine.loading ? "warning" : "success"}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <ACIcon sx={{ mr: 1 }} /> Analyse Conversationnelle
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En préparation • Métriques empiriques baseline
              </Typography>
              <Chip
                label="En développement"
                color="default"
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Affichage des résultats de convergence
 */
const ConvergenceResultsDisplay: React.FC<{ results: any }> = ({ results }) => {
  const theme = useTheme();

  return (
    <Box>
      <Alert
        severity={
          results.validation_status === "CONVERGENT" ? "success" : "warning"
        }
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" gutterBottom>
          📊 Statut de Convergence: {results.validation_status}
        </Typography>
        <Typography variant="body2">
          {results.validation_status === "CONVERGENT"
            ? "Les trois niveaux d'analyse convergent vers les mêmes conclusions ✅"
            : "Divergences détectées entre les niveaux - révision du modèle recommandée ⚠️"}
        </Typography>
      </Alert>

      {/* Matrice de concordance */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔗 Concordance des Classements (τ de Kendall)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2">AC ↔ LI</Typography>
                <Typography variant="h4" color="primary.main">
                  {results.consistency_tests.concordance.AC_LI.tau.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  p = {results.consistency_tests.concordance.AC_LI.p_value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2">AC ↔ Cognitif</Typography>
                <Typography variant="h4" color="success.main">
                  {results.consistency_tests.concordance.AC_Cognitive.tau.toFixed(
                    2
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  p ={" "}
                  {results.consistency_tests.concordance.AC_Cognitive.p_value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2">LI ↔ Cognitif</Typography>
                <Typography variant="h4" color="warning.main">
                  {results.consistency_tests.concordance.LI_Cognitive.tau.toFixed(
                    2
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  p ={" "}
                  {results.consistency_tests.concordance.LI_Cognitive.p_value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Tests d'hypothèses */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🧪 Validation des Hypothèses Théoriques
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(results.hypothesis_tests || {}).map(
            ([hypothesis, validated]) => (
              <Grid item xs={12} md={4} key={hypothesis}>
                <Alert severity={validated ? "success" : "error"}>
                  <Typography variant="subtitle2">
                    {hypothesis
                      .replace("_validation", "")
                      .replace("H", "Hypothèse H")}
                  </Typography>
                  <Typography variant="body2">
                    {validated ? "✅ Validée" : "❌ Non validée"}
                  </Typography>
                </Alert>
              </Grid>
            )
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

/**
 * Composant de comparaison d'algorithmes
 */
const AlgorithmComparisonView: React.FC<{ comparison: any }> = ({
  comparison,
}) => {
  if (!comparison) return null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        📈 Benchmarks des Algorithmes
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Algorithme</strong>
              </TableCell>
              <TableCell>
                <strong>Précision</strong>
              </TableCell>
              <TableCell>
                <strong>Temps (ms)</strong>
              </TableCell>
              <TableCell>
                <strong>F1-Score</strong>
              </TableCell>
              <TableCell>
                <strong>Données Test</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(comparison.benchmark).map(
              ([algorithmId, metrics]: [string, any]) => (
                <TableRow key={algorithmId}>
                  <TableCell>
                    <Chip
                      label={algorithmId}
                      color={
                        algorithmId === comparison.recommendation.best_overall
                          ? "primary"
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>{(metrics.accuracy * 100).toFixed(1)}%</TableCell>
                  <TableCell>{metrics.processing_time_ms.toFixed(0)}</TableCell>
                  <TableCell>{metrics.f1_score.toFixed(2)}</TableCell>
                  <TableCell>{metrics.test_data_size}</TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          🏆 Recommandation
        </Typography>
        <Typography variant="body2">
          <strong>Meilleure précision:</strong>{" "}
          {comparison.recommendation.best_accuracy} •
          <strong> Plus rapide:</strong> {comparison.recommendation.best_speed}{" "}
          •<strong> Recommandé:</strong>{" "}
          {comparison.recommendation.best_overall}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {comparison.recommendation.reasoning}
        </Typography>
      </Alert>
    </Box>
  );
};

export default UnifiedMetricsInterface;
