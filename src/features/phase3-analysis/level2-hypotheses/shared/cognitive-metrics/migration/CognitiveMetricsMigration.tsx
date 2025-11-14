// src/app/(protected)/analysis/components/cognitive-metrics/migration/CognitiveMetricsMigration.tsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  LinearProgress,
  Paper,
  Divider,
} from "@mui/material";
import {
  Psychology as CognitiveIcon,
  Compare as CompareIcon,
  Speed as PerformanceIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

// Import du framework unifié
import { useMetricsEngine } from "@/features/phase3-analysis/shared/metrics-framework/hooks/useMetricsEngine";
import { metricsRegistry } from "@/features/phase3-analysis/shared/metrics-framework/core/MetricsRegistry";

// Import de l'indicateur migré
import { FluiditeCognitiveIndicator } from "../indicators/FluiditeCognitiveIndicator/FluiditeCognitiveIndicator";

// Import de votre code existant adapté
import {
  useAdaptedCognitiveMetrics,
  validateCognitiveMigration,
} from "./adaptUseCognitiveMetrics";

// ================ COMPOSANT PRINCIPAL DE MIGRATION ================

interface CognitiveMetricsMigrationProps {
  showComparison?: boolean;
  enableNewFramework?: boolean;
}

const CognitiveMetricsMigration: React.FC<CognitiveMetricsMigrationProps> = ({
  showComparison = true,
  enableNewFramework = true,
}) => {
  // État local
  const [useNewFramework, setUseNewFramework] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [initializationProgress, setInitializationProgress] = useState(0);

  // Hook existant (votre code)
  const legacyMetrics = useAdaptedCognitiveMetrics([]);

  // Nouveau framework unifié
  const unifiedMetrics = useMetricsEngine({
    domain: "cognitive",
    enableCaching: true,
    enableBenchmarking: true,
    enableRealTimeComparison: true,
  });

  // ================ INITIALISATION DU FRAMEWORK ================

  useEffect(() => {
    const initializeFramework = async () => {
      try {
        setInitializationProgress(20);

        // 1. Enregistrer l'indicateur FluiditeCognitive
        const fluiditeIndicator = new FluiditeCognitiveIndicator();
        const registered = metricsRegistry.register(fluiditeIndicator);

        if (!registered) {
          throw new Error(
            "Impossible d'enregistrer l'indicateur FluiditeCognitive"
          );
        }
        setInitializationProgress(50);

        // 2. Valider la migration
        const isValid = validateCognitiveMigration();
        setInitializationProgress(80);

        if (isValid) {
          setMigrationStatus("success");
          console.log("✅ Migration cognitive initialisée avec succès");
        } else {
          setMigrationStatus("error");
          console.error("❌ Échec de la validation de migration");
        }

        setInitializationProgress(100);
      } catch (error) {
        console.error("Erreur initialisation framework:", error);
        setMigrationStatus("error");
      }
    };

    if (enableNewFramework) {
      initializeFramework();
    }
  }, [enableNewFramework]);

  // ================ HANDLERS ================

  const handleFrameworkSwitch = (checked: boolean) => {
    setUseNewFramework(checked);
    if (checked && migrationStatus === "success") {
      // Recalculer avec le nouveau framework
      unifiedMetrics.calculateMetrics();
    }
  };

  const handleTestComparison = async () => {
    try {
      if (unifiedMetrics.indicators.length > 0) {
        const indicator = unifiedMetrics.indicators[0];
        const algorithms =
          unifiedMetrics.availableAlgorithms[indicator.getId()] || [];

        if (algorithms.length >= 2) {
          await unifiedMetrics.compareAlgorithms(indicator.getId(), algorithms);
          alert(
            "Comparaison d'algorithmes lancée - voir console pour résultats"
          );
        } else {
          alert("Au moins 2 algorithmes nécessaires pour la comparaison");
        }
      }
    } catch (error) {
      console.error("Erreur comparaison:", error);
      alert("Erreur lors de la comparaison d'algorithmes");
    }
  };

  // ================ RENDU CONDITIONNEL ================

  if (!enableNewFramework) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            📋 Mode Compatibilité - Interface Existante
          </Typography>
          <Typography variant="body2">
            Le framework unifié est désactivé. Votre interface cognitive
            actuelle fonctionne normalement sans changement.
          </Typography>
        </Alert>

        {/* Votre composant existant */}
        <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Métriques Cognitives (Version Existante)
          </Typography>

          {/* Layout Flexbox au lieu de Grid */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">
                    Fluidité Cognitive
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {(legacyMetrics.fluiditeCognitive * 100).toFixed(0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2">Charge Cognitive</Typography>
                  <Typography variant="h4" color="warning.main">
                    {(legacyMetrics.chargeCognitive * 100).toFixed(0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Button
            variant="outlined"
            onClick={legacyMetrics.toggleFramework}
            sx={{ mt: 2 }}
          >
            {legacyMetrics.isNewFramework ? "Retour Legacy" : "Tester Nouveau"}
          </Button>
        </Box>
      </Box>
    );
  }

  // ================ INTERFACE UNIFIÉE ================

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête de migration */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <CognitiveIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              🧠 Migration Sciences Cognitives
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Framework Unifié avec Comparaison d'Algorithmes
            </Typography>
          </Box>
        </Box>

        {/* Statut de l'initialisation */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Typography variant="h6">📊 Statut d'Initialisation</Typography>
            {migrationStatus === "success" && <SuccessIcon color="success" />}
            {migrationStatus === "error" && <WarningIcon color="error" />}
          </Box>

          <LinearProgress
            variant="determinate"
            value={initializationProgress}
            sx={{ mb: 2 }}
          />

          {/* Layout Flexbox au lieu de Grid */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="body2">
                <strong>Indicateurs:</strong> {unifiedMetrics.indicators.length}
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="body2">
                <strong>Algorithmes:</strong>{" "}
                {Object.keys(unifiedMetrics.availableAlgorithms).length}
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px" }}>
              <Typography variant="body2">
                <strong>Performance:</strong>{" "}
                {unifiedMetrics.performanceMetrics.lastCalculationTime.toFixed(
                  0
                )}
                ms
              </Typography>
            </Box>
          </Box>

          <Alert
            severity={
              migrationStatus === "success"
                ? "success"
                : migrationStatus === "error"
                ? "error"
                : "info"
            }
            sx={{ mt: 2 }}
          >
            {migrationStatus === "success" &&
              "✅ Framework unifié prêt - tous les indicateurs opérationnels"}
            {migrationStatus === "error" &&
              "❌ Erreur d'initialisation - vérifier la console"}
            {migrationStatus === "pending" && "⏳ Initialisation en cours..."}
          </Alert>
        </Paper>

        {/* Contrôles de migration */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🔄 Contrôles de Migration
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={useNewFramework}
                  onChange={(e) => handleFrameworkSwitch(e.target.checked)}
                  disabled={migrationStatus !== "success"}
                />
              }
              label={useNewFramework ? "Framework Unifié Actif" : "Mode Legacy"}
            />

            {showComparison && (
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={handleTestComparison}
                disabled={!useNewFramework || unifiedMetrics.loading}
              >
                Test Comparaison Algorithmes
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<PerformanceIcon />}
              onClick={() =>
                console.log("Stats registre:", metricsRegistry.getStats())
              }
            >
              Diagnostic Framework
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Interface conditionnelle selon le mode */}
      {useNewFramework ? (
        <UnifiedCognitiveInterface
          unifiedMetrics={unifiedMetrics}
          showComparison={showComparison}
        />
      ) : (
        <LegacyCognitiveInterface
          legacyMetrics={legacyMetrics}
          onSwitchToUnified={() => setUseNewFramework(true)}
        />
      )}
    </Box>
  );
};

// ================ INTERFACE UNIFIÉE ================

interface UnifiedCognitiveInterfaceProps {
  unifiedMetrics: ReturnType<typeof useMetricsEngine>;
  showComparison: boolean;
}

const UnifiedCognitiveInterface: React.FC<UnifiedCognitiveInterfaceProps> = ({
  unifiedMetrics,
  showComparison,
}) => {
  return (
    <Box>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: "flex", alignItems: "center" }}
      >
        <CognitiveIcon sx={{ mr: 2 }} />
        Framework Unifié - Sciences Cognitives
      </Typography>

      {/* Métriques globales - Flexbox Layout */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Familles Analysées</Typography>
              <Typography variant="h4" color="primary.main">
                {unifiedMetrics.familyResults.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Efficacité Moyenne</Typography>
              <Typography variant="h4" color="success.main">
                {(
                  unifiedMetrics.globalMetrics.averageEffectiveness * 100
                ).toFixed(1)}
                %
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Meilleure Famille</Typography>
              <Typography variant="h6" color="primary.main">
                {unifiedMetrics.globalMetrics.topPerformingFamily || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: "1 1 200px" }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Performance</Typography>
              <Typography variant="h4" color="warning.main">
                {unifiedMetrics.performanceMetrics.lastCalculationTime.toFixed(
                  0
                )}
                ms
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Liste des indicateurs */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          📊 Indicateurs Cognitifs Disponibles
        </Typography>

        {/* Layout en grille CSS au lieu de Grid MUI */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 2,
          }}
        >
          {unifiedMetrics.indicators.map((indicator) => {
            const indicatorResults =
              unifiedMetrics.results[indicator.getId()] || [];
            const avgValue =
              indicatorResults.length > 0
                ? indicatorResults.reduce(
                    (sum, r) =>
                      sum + (typeof r.value === "number" ? r.value : 0),
                    0
                  ) / indicatorResults.length
                : 0;

            return (
              <Card key={indicator.getId()} sx={{ height: "100%" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">{indicator.getName()}</Typography>
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
                    {indicator.getDomain()}
                  </Typography>

                  {/* Valeur moyenne */}
                  <Typography variant="h4" color="primary.main" sx={{ mb: 2 }}>
                    {typeof avgValue === "number"
                      ? (avgValue * 100).toFixed(0) + "%"
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
                      {unifiedMetrics.availableAlgorithms[
                        indicator.getId()
                      ]?.map((algId) => (
                        <Chip
                          key={algId}
                          label={algId}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Boutons d'action */}
                  {showComparison && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CompareIcon />}
                      disabled={
                        !unifiedMetrics.availableAlgorithms[
                          indicator.getId()
                        ] ||
                        unifiedMetrics.availableAlgorithms[indicator.getId()]
                          .length < 2
                      }
                      fullWidth
                    >
                      Comparer Algorithmes
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Paper>

      {/* Résultats par famille */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📈 Résultats 2 par Famille de Stratégies
        </Typography>

        {/* Layout en grille CSS */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 2,
          }}
        >
          {unifiedMetrics.familyResults.map((family) => (
            <Card key={family.family}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
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
                  <Typography variant="body2" color="text.secondary">
                    {family.totalUsage} utilisations
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Score Global: {family.globalScore.toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={family.globalScore * 100}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>

                <Typography
                  variant="h6"
                  color={
                    family.effectiveness > 0.7
                      ? "success.main"
                      : family.effectiveness > 0.4
                      ? "warning.main"
                      : "error.main"
                  }
                >
                  Efficacité: {(family.effectiveness * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

// ================ INTERFACE LEGACY ================

interface LegacyCognitiveInterfaceProps {
  legacyMetrics: ReturnType<typeof useAdaptedCognitiveMetrics>;
  onSwitchToUnified: () => void;
}

const LegacyCognitiveInterface: React.FC<LegacyCognitiveInterfaceProps> = ({
  legacyMetrics,
  onSwitchToUnified,
}) => {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📋 Mode Legacy - Interface Existante Préservée
        </Typography>
        <Typography variant="body2">
          Votre interface cognitive actuelle fonctionne exactement comme avant.
          Aucun changement dans vos workflows existants.
        </Typography>
      </Alert>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Métriques Cognitives (Version Existante)
        </Typography>

        {/* Layout Flexbox au lieu de Grid */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 280px" }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Fluidité Cognitive
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {(legacyMetrics.fluiditeCognitive * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Traitement automatique
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 280px" }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Charge Cognitive
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {(legacyMetrics.chargeCognitive * 100).toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Effort requis
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: "1 1 280px" }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Marqueurs Détectés
                </Typography>
                <Typography variant="h4" color="info.main">
                  {legacyMetrics.marqueurs.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {legacyMetrics.marqueurs.join(", ") || "Aucun"}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button variant="outlined" onClick={legacyMetrics.toggleFramework}>
            {legacyMetrics.isNewFramework ? "Retour Legacy" : "Test Interne"}
          </Button>

          <Button
            variant="contained"
            onClick={onSwitchToUnified}
            startIcon={<CognitiveIcon />}
          >
            Basculer vers Framework Unifié
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CognitiveMetricsMigration;
