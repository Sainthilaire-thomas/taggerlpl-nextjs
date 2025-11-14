// src/app/(protected)/analysis/components/SimpleUnifiedInterface.tsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Psychology as CognitiveIcon,
  Compare as CompareIcon,
  Speed as PerformanceIcon,
  Science as ValidationIcon,
} from "@mui/icons-material";

// Import de votre code existant qui fonctionne
import {
  useAdaptedCognitiveMetrics,
  validateCognitiveMigration,
} from "./cognitive-metrics/migration/adaptUseCognitiveMetrics";

// ================ DONNÉES FICTIVES POUR DÉMONSTRATION ================

const mockFrameworkData = {
  // Métriques globales
  globalMetrics: {
    totalTurns: 1247,
    averageEffectiveness: 0.73,
    topPerformingFamily: "ENGAGEMENT",
    convergenceStatus: "CONVERGENT" as const,
  },

  // Résultats par famille de stratégies
  familyResults: [
    {
      family: "ENGAGEMENT",
      totalUsage: 342,
      effectiveness: 0.85,
      globalScore: 0.78,
      indicators: {
        fluidite_cognitive: { value: 0.82, confidence: 0.92 },
        charge_cognitive: { value: 0.34, confidence: 0.87 },
      },
    },
    {
      family: "REFLET",
      totalUsage: 456,
      effectiveness: 0.71,
      globalScore: 0.68,
      indicators: {
        fluidite_cognitive: { value: 0.71, confidence: 0.89 },
        charge_cognitive: { value: 0.45, confidence: 0.84 },
      },
    },
    {
      family: "EXPLICATION",
      totalUsage: 289,
      effectiveness: 0.52,
      globalScore: 0.48,
      indicators: {
        fluidite_cognitive: { value: 0.48, confidence: 0.91 },
        charge_cognitive: { value: 0.67, confidence: 0.86 },
      },
    },
  ],

  // Indicateurs disponibles
  indicators: [
    {
      id: "fluidite_cognitive",
      name: "Fluidité Cognitive",
      status: "implemented" as const,
      algorithms: ["basic_fluidity", "neuron_mirror"],
      avgValue: 0.67,
      category: "Automatisme Neural",
    },
    {
      id: "charge_cognitive",
      name: "Charge Cognitive",
      status: "implemented" as const,
      algorithms: ["effort_detection", "complexity_analysis"],
      avgValue: 0.48,
      category: "Effort Mental",
    },
    {
      id: "automatisme_neural",
      name: "Automatisme Neural",
      status: "partial" as const,
      algorithms: ["mirror_neurons"],
      avgValue: 0.71,
      category: "Neurones Miroirs",
    },
  ],

  // Comparaison d'algorithmes
  algorithmComparison: {
    indicator: "fluidite_cognitive",
    results: {
      basic_fluidity: { accuracy: 0.78, speed: 45, f1_score: 0.74 },
      neuron_mirror: { accuracy: 0.84, speed: 120, f1_score: 0.81 },
    },
    recommendation: {
      best_accuracy: "neuron_mirror",
      best_speed: "basic_fluidity",
      best_overall: "neuron_mirror",
    },
  },

  // Validation de convergence
  convergenceValidation: {
    validation_status: "CONVERGENT" as const,
    consistency_tests: {
      concordance: {
        AC_LI: { tau: 0.78, p_value: 0.03 },
        AC_Cognitive: { tau: 0.82, p_value: 0.01 },
        LI_Cognitive: { tau: 0.74, p_value: 0.05 },
      },
    },
    hypothesis_tests: {
      H1_validation: true, // ENGAGEMENT efficace
      H2_validation: true, // EXPLICATION difficile
      H3_validation: false, // Gradient REFLET
    },
  },
};

// ================ COMPOSANT PRINCIPAL ================

interface SimpleUnifiedInterfaceProps {
  showComparison?: boolean;
  enableNewFramework?: boolean;
}

const SimpleUnifiedInterface: React.FC<SimpleUnifiedInterfaceProps> = ({
  showComparison = true,
  enableNewFramework = true,
}) => {
  // État local
  const [useNewFramework, setUseNewFramework] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [migrationStatus, setMigrationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");

  // Hook existant (votre code)
  const legacyMetrics = useAdaptedCognitiveMetrics([]);

  // Simulation du framework avec données fictives
  const [frameworkData, setFrameworkData] = useState(mockFrameworkData);

  // ================ INITIALISATION ================

  useEffect(() => {
    if (enableNewFramework) {
      // Simuler l'initialisation du framework
      const timer = setTimeout(() => {
        const isValid = validateCognitiveMigration();
        setMigrationStatus(isValid ? "success" : "error");
        console.log("🚀 Framework unifié simulé initialisé");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [enableNewFramework]);

  // ================ HANDLERS ================

  const handleFrameworkSwitch = (checked: boolean) => {
    setUseNewFramework(checked);
    console.log(`Framework ${checked ? "activé" : "désactivé"}`);
  };

  const handleTestAlgorithmComparison = () => {
    alert(`🔬 Comparaison Algorithmes - ${
      frameworkData.algorithmComparison.indicator
    }

Résultats:
• basic_fluidity: ${(
      frameworkData.algorithmComparison.results.basic_fluidity.accuracy * 100
    ).toFixed(0)}% précision, ${
      frameworkData.algorithmComparison.results.basic_fluidity.speed
    }ms
• neuron_mirror: ${(
      frameworkData.algorithmComparison.results.neuron_mirror.accuracy * 100
    ).toFixed(0)}% précision, ${
      frameworkData.algorithmComparison.results.neuron_mirror.speed
    }ms

Recommandation: ${
      frameworkData.algorithmComparison.recommendation.best_overall
    }`);
  };

  const handleConvergenceValidation = () => {
    const convergence = frameworkData.convergenceValidation;
    alert(`🎓 Validation de Convergence: ${convergence.validation_status}

Corrélations (τ de Kendall):
• AC ↔ LI: ${convergence.consistency_tests.concordance.AC_LI.tau.toFixed(2)}
• AC ↔ Cognitif: ${convergence.consistency_tests.concordance.AC_Cognitive.tau.toFixed(
      2
    )} 
• LI ↔ Cognitif: ${convergence.consistency_tests.concordance.LI_Cognitive.tau.toFixed(
      2
    )}

Hypothèses:
• H1 (ENGAGEMENT efficace): ${
      convergence.hypothesis_tests.H1_validation ? "✅ Validée" : "❌ Rejetée"
    }
• H2 (EXPLICATION difficile): ${
      convergence.hypothesis_tests.H2_validation ? "✅ Validée" : "❌ Rejetée"
    }
• H3 (Gradient REFLET): ${
      convergence.hypothesis_tests.H3_validation ? "✅ Validée" : "❌ Rejetée"
    }`);
  };

  // ================ RENDU CONDITIONNEL ================

  if (!enableNewFramework) {
    return <LegacyInterface legacyMetrics={legacyMetrics} />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🧠 Framework Unifié - Démonstration
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Interface de transition montrant les fonctionnalités du framework
          complet
        </Typography>

        <Box sx={{ mt: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useNewFramework}
                onChange={(e) => handleFrameworkSwitch(e.target.checked)}
                disabled={migrationStatus !== "success"}
              />
            }
            label="Framework Unifié Actif"
          />

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
              "✅ Framework unifié opérationnel - toutes les fonctionnalités disponibles"}
            {migrationStatus === "error" &&
              "❌ Erreur d'initialisation - vérifier la configuration"}
            {migrationStatus === "pending" &&
              "⏳ Initialisation du framework..."}
          </Alert>
        </Box>
      </Box>

      {useNewFramework ? (
        <UnifiedFrameworkInterface
          frameworkData={frameworkData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTestAlgorithmComparison={handleTestAlgorithmComparison}
          onConvergenceValidation={handleConvergenceValidation}
          showComparison={showComparison}
        />
      ) : (
        <LegacyInterface
          legacyMetrics={legacyMetrics}
          onSwitchToUnified={() => setUseNewFramework(true)}
        />
      )}
    </Box>
  );
};

// ================ INTERFACE UNIFIÉE ================

interface UnifiedFrameworkInterfaceProps {
  frameworkData: typeof mockFrameworkData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTestAlgorithmComparison: () => void;
  onConvergenceValidation: () => void;
  showComparison: boolean;
}

const UnifiedFrameworkInterface: React.FC<UnifiedFrameworkInterfaceProps> = ({
  frameworkData,
  activeTab,
  setActiveTab,
  onTestAlgorithmComparison,
  onConvergenceValidation,
  showComparison,
}) => {
  return (
    <Box>
      {/* Métriques globales */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          variant={activeTab === "overview" ? "contained" : "outlined"}
          onClick={() => setActiveTab("overview")}
        >
          Vue d'Ensemble
        </Button>
        <Button
          variant={activeTab === "indicators" ? "contained" : "outlined"}
          onClick={() => setActiveTab("indicators")}
        >
          Indicateurs
        </Button>
        <Button
          variant={activeTab === "algorithms" ? "contained" : "outlined"}
          onClick={() => setActiveTab("algorithms")}
        >
          Comparaison Algorithmes
        </Button>
        <Button
          variant={activeTab === "validation" ? "contained" : "outlined"}
          onClick={() => setActiveTab("validation")}
        >
          Validation Convergence
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 3,
          mb: 4,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6">Tours Analysés</Typography>
            <Typography variant="h4" color="primary.main">
              {frameworkData.globalMetrics.totalTurns.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total conversations
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Efficacité Moyenne</Typography>
            <Typography variant="h4" color="success.main">
              {(frameworkData.globalMetrics.averageEffectiveness * 100).toFixed(
                0
              )}
              %
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Toutes familles
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Meilleure Stratégie</Typography>
            <Typography variant="h4" color="primary.main">
              {frameworkData.globalMetrics.topPerformingFamily}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              85% d'efficacité
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Contenu selon l'onglet actif */}
      {activeTab === "overview" && (
        <OverviewTab familyResults={frameworkData.familyResults} />
      )}

      {activeTab === "indicators" && (
        <IndicatorsTab
          indicators={frameworkData.indicators}
          showComparison={showComparison}
        />
      )}

      {activeTab === "algorithms" && (
        <AlgorithmsTab
          algorithmComparison={frameworkData.algorithmComparison}
          onTestComparison={onTestAlgorithmComparison}
        />
      )}

      {activeTab === "validation" && (
        <ValidationTab
          convergenceValidation={frameworkData.convergenceValidation}
          onRunValidation={onConvergenceValidation}
        />
      )}
    </Box>
  );
};

// ================ ONGLETS SPÉCIALISÉS ================

const OverviewTab: React.FC<{
  familyResults: typeof mockFrameworkData.familyResults;
}> = ({ familyResults }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      📊 Résultats 5 par Famille de Stratégies
    </Typography>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 3,
      }}
    >
      {familyResults.map((family) => (
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
                    : "warning"
                }
              />
              <Typography variant="body2" color="text.secondary">
                {family.totalUsage} utilisations
              </Typography>
            </Box>

            <Typography variant="h4" color="primary.main" gutterBottom>
              {(family.effectiveness * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Efficacité globale
            </Typography>

            <LinearProgress
              variant="determinate"
              value={family.effectiveness * 100}
              sx={{ height: 8, borderRadius: 1, mb: 2 }}
            />

            <Typography variant="body2" gutterBottom>
              <strong>Fluidité:</strong>{" "}
              {(family.indicators.fluidite_cognitive.value * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2">
              <strong>Charge:</strong>{" "}
              {(family.indicators.charge_cognitive.value * 100).toFixed(0)}%
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Paper>
);

const IndicatorsTab: React.FC<{
  indicators: typeof mockFrameworkData.indicators;
  showComparison: boolean;
}> = ({ indicators, showComparison }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      🔧 Indicateurs Cognitifs Disponibles
    </Typography>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 2,
      }}
    >
      {indicators.map((indicator) => (
        <Card key={indicator.id}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">{indicator.name}</Typography>
              <Chip
                label={indicator.status}
                color={
                  indicator.status === "implemented" ? "success" : "warning"
                }
                size="small"
              />
            </Box>

            <Typography variant="h4" color="primary.main" sx={{ mb: 2 }}>
              {(indicator.avgValue * 100).toFixed(0)}%
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Algorithmes: {indicator.algorithms.join(", ")}
            </Typography>

            {showComparison && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CompareIcon />}
                fullWidth
                disabled={indicator.algorithms.length < 2}
              >
                Comparer Algorithmes
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  </Paper>
);

const AlgorithmsTab: React.FC<{
  algorithmComparison: typeof mockFrameworkData.algorithmComparison;
  onTestComparison: () => void;
}> = ({ algorithmComparison, onTestComparison }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      🔬 Comparaison d'Algorithmes - {algorithmComparison.indicator}
    </Typography>

    <Alert severity="info" sx={{ mb: 3 }}>
      <Typography variant="body2">
        <strong>Recommandation:</strong>{" "}
        {algorithmComparison.recommendation.best_overall}
        est recommandé pour un usage global (meilleur équilibre
        précision/performance)
      </Typography>
    </Alert>

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
              <strong>Vitesse (ms)</strong>
            </TableCell>
            <TableCell>
              <strong>F1-Score</strong>
            </TableCell>
            <TableCell>
              <strong>Recommandation</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(algorithmComparison.results).map(
            ([algId, metrics]) => (
              <TableRow key={algId}>
                <TableCell>
                  <Chip
                    label={algId}
                    color={
                      algId === algorithmComparison.recommendation.best_overall
                        ? "primary"
                        : "default"
                    }
                  />
                </TableCell>
                <TableCell>{(metrics.accuracy * 100).toFixed(1)}%</TableCell>
                <TableCell>{metrics.speed}ms</TableCell>
                <TableCell>{metrics.f1_score.toFixed(2)}</TableCell>
                <TableCell>
                  {algId ===
                    algorithmComparison.recommendation.best_accuracy && (
                    <Chip label="+ Précis" color="success" size="small" />
                  )}
                  {algId === algorithmComparison.recommendation.best_speed && (
                    <Chip label="+ Rapide" color="info" size="small" />
                  )}
                  {algId ===
                    algorithmComparison.recommendation.best_overall && (
                    <Chip label="Recommandé" color="primary" size="small" />
                  )}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </TableContainer>

    <Box sx={{ mt: 3, textAlign: "center" }}>
      <Button
        variant="contained"
        startIcon={<CompareIcon />}
        onClick={onTestComparison}
      >
        Tester Comparaison Complète
      </Button>
    </Box>
  </Paper>
);

const ValidationTab: React.FC<{
  convergenceValidation: typeof mockFrameworkData.convergenceValidation;
  onRunValidation: () => void;
}> = ({ convergenceValidation, onRunValidation }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h5" gutterBottom>
      🎓 Validation de Convergence Multi-Niveaux (Thèse)
    </Typography>

    <Alert
      severity={
        convergenceValidation.validation_status === "CONVERGENT"
          ? "success"
          : "warning"
      }
      sx={{ mb: 3 }}
    >
      <Typography variant="h6" gutterBottom>
        📊 Statut de Convergence: {convergenceValidation.validation_status}
      </Typography>
      <Typography variant="body2">
        {convergenceValidation.validation_status === "CONVERGENT"
          ? "Les trois niveaux d'analyse convergent vers les mêmes conclusions ✅"
          : "Divergences détectées entre les niveaux - révision du modèle recommandée ⚠️"}
      </Typography>
    </Alert>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 2,
        mb: 3,
      }}
    >
      <Card>
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="subtitle2">AC ↔ LI</Typography>
          <Typography variant="h4" color="primary.main">
            {convergenceValidation.consistency_tests.concordance.AC_LI.tau.toFixed(
              2
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            τ de Kendall
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="subtitle2">AC ↔ Cognitif</Typography>
          <Typography variant="h4" color="success.main">
            {convergenceValidation.consistency_tests.concordance.AC_Cognitive.tau.toFixed(
              2
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            τ de Kendall
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="subtitle2">LI ↔ Cognitif</Typography>
          <Typography variant="h4" color="warning.main">
            {convergenceValidation.consistency_tests.concordance.LI_Cognitive.tau.toFixed(
              2
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            τ de Kendall
          </Typography>
        </CardContent>
      </Card>
    </Box>

    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        🧪 Validation des Hypothèses Théoriques
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 2,
        }}
      >
        <Alert
          severity={
            convergenceValidation.hypothesis_tests.H1_validation
              ? "success"
              : "error"
          }
        >
          <Typography variant="subtitle2">Hypothèse H1</Typography>
          <Typography variant="body2">
            {convergenceValidation.hypothesis_tests.H1_validation ? "✅" : "❌"}{" "}
            ENGAGEMENT efficace
          </Typography>
        </Alert>
        <Alert
          severity={
            convergenceValidation.hypothesis_tests.H2_validation
              ? "success"
              : "error"
          }
        >
          <Typography variant="subtitle2">Hypothèse H2</Typography>
          <Typography variant="body2">
            {convergenceValidation.hypothesis_tests.H2_validation ? "✅" : "❌"}{" "}
            EXPLICATION coûteuse
          </Typography>
        </Alert>
        <Alert
          severity={
            convergenceValidation.hypothesis_tests.H3_validation
              ? "success"
              : "warning"
          }
        >
          <Typography variant="subtitle2">Hypothèse H3</Typography>
          <Typography variant="body2">
            {convergenceValidation.hypothesis_tests.H3_validation ? "✅" : "⚠️"}{" "}
            Gradient REFLET
          </Typography>
        </Alert>
      </Box>
    </Box>

    <Box sx={{ textAlign: "center" }}>
      <Button
        variant="contained"
        startIcon={<ValidationIcon />}
        onClick={onRunValidation}
      >
        Lancer Validation Complète
      </Button>
    </Box>
  </Paper>
);

// ================ INTERFACE LEGACY ================

const LegacyInterface: React.FC<{
  legacyMetrics: ReturnType<typeof useAdaptedCognitiveMetrics>;
  onSwitchToUnified?: () => void;
}> = ({ legacyMetrics, onSwitchToUnified }) => (
  <Box>
    <Alert severity="info" sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        📋 Mode Legacy - Interface Existante Préservée
      </Typography>
      <Typography variant="body2">
        Votre interface cognitive actuelle fonctionne exactement comme avant.
      </Typography>
    </Alert>

    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Métriques Cognitives (Version Existante)
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 3,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Fluidité Cognitive
            </Typography>
            <Typography variant="h4" color="primary.main">
              {(legacyMetrics.fluiditeCognitive * 100).toFixed(0)}%
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Charge Cognitive
            </Typography>
            <Typography variant="h4" color="warning.main">
              {(legacyMetrics.chargeCognitive * 100).toFixed(0)}%
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Marqueurs
            </Typography>
            <Typography variant="h4" color="info.main">
              {legacyMetrics.marqueurs.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button variant="outlined" onClick={legacyMetrics.toggleFramework}>
          {legacyMetrics.isNewFramework ? "Retour Legacy" : "Test Interne"}
        </Button>

        {onSwitchToUnified && (
          <Button
            variant="contained"
            onClick={onSwitchToUnified}
            startIcon={<CognitiveIcon />}
          >
            Basculer vers Framework Unifié
          </Button>
        )}
      </Box>
    </Paper>
  </Box>
);

export default SimpleUnifiedInterface;
