// AlgorithmLabInterface.tsx - Version mise à jour avec EnhancedSingleTestPanel
import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Tabs,
  Tab,
  Paper,
  useTheme,
  alpha,
  Button,
} from "@mui/material";
import {
  Science as ScienceIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Quiz as TestIcon,
  Compare as CompareIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

// Import du panneau avec validation scientifique (renommé)
import SingleTestPanel from "./components/SingleTestPanel/SingleTestPanel";

// Import du hook global
import { useGlobalAlgorithmTesting } from "./hooks/useGlobalAlgorithmTesting";

// Import du contexte Supabase
import { useSupabase } from "@/context/SupabaseContext";

// Types pour Algorithm Lab global
interface AlgorithmLabInterfaceProps {
  selectedOrigin?: string | null;
  availableDomains?: string[];
  availableIndicators?: string[];
  availableData?: any[]; // Données turntagged passées depuis l'interface parent
}

type LabMode =
  | "overview"
  | "single_test"
  | "comparison"
  | "optimization"
  | "validation";
type TestDomain = "li" | "cognitive" | "ac" | "all";

interface LabState {
  mode: LabMode;
  selectedDomain: TestDomain;
  isRunningTest: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: LabMode;
  index: LabMode;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lab-tabpanel-${index}`}
      aria-labelledby={`lab-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
};

const AlgorithmLabInterface: React.FC<AlgorithmLabInterfaceProps> = ({
  selectedOrigin,
  availableDomains = ["li", "cognitive", "ac"],
  availableIndicators = ["feedback_alignment", "fluidite_cognitive"],
  availableData = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Client Supabase pour les tests avec vraies données
  const { supabase } = useSupabase();

  // État principal du Lab
  const [labState, setLabState] = useState<LabState>({
    mode: "overview",
    selectedDomain: "all",
    isRunningTest: false,
  });

  // Hook global pour les tests
  const {
    labState: globalLabState,
    isInitialized,
    runSingleTest,
    runComparison,
    getTestHistory,
    clearHistory,
    error: globalError,
    isRunning: globalIsRunning,
    currentOperation,
  } = useGlobalAlgorithmTesting({
    selectedOrigin,
    autoSave: true,
  });

  // Styles adaptatifs
  const getAdaptiveStyles = () => ({
    mainContainer: {
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.grey[50], 0.9),
      minHeight: "800px",
    },
    headerGradient: {
      background: isDark
        ? "linear-gradient(135deg, #1a237e 0%, #3949ab 100%)"
        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    domainCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.9)
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      transition: "all 0.3s ease",
      cursor: "pointer",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: theme.shadows[8],
      },
    },
  });

  const adaptiveStyles = getAdaptiveStyles();

  // Handlers
  const handleModeChange = useCallback(
    (event: React.SyntheticEvent, newMode: LabMode) => {
      setLabState((prev) => ({ ...prev, mode: newMode }));
    },
    []
  );

  const handleDomainSelect = useCallback((domain: TestDomain) => {
    setLabState((prev) => ({ ...prev, selectedDomain: domain }));
  }, []);

  // Handler pour les tests terminés
  const handleTestComplete = useCallback((result: any) => {
    console.log("Test terminé dans Algorithm Lab:", result);
  }, []);

  // Configuration des domaines et leurs algorithmes
  const domainConfig = {
    li: {
      name: "Linguistique Interactionnelle",
      icon: "🗣️",
      algorithms: [
        "BasicAlignment",
        "ConversationalPattern",
        "SequentialPattern",
      ],
      indicators: ["feedback_alignment", "common_ground", "backchannels"],
      status: "operational",
    },
    cognitive: {
      name: "Sciences Cognitives",
      icon: "🧠",
      algorithms: ["BasicFluidity", "NeuronMirror", "MLEnhanced"],
      indicators: [
        "fluidite_cognitive",
        "reactions_directes",
        "charge_cognitive",
      ],
      status: "operational",
    },
    ac: {
      name: "Analyse Conversationnelle",
      icon: "📊",
      algorithms: ["StrategyAnalysis", "TagPatterns", "TemporalAnalysis"],
      indicators: [
        "strategy_effectiveness",
        "tag_patterns",
        "temporal_evolution",
      ],
      status: "legacy",
    },
  };

  return (
    <Box sx={{ width: "100%", p: 2, ...adaptiveStyles.mainContainer }}>
      {/* En-tête Algorithm Lab */}
      <Card sx={{ mb: 3, ...adaptiveStyles.headerGradient }}>
        <CardContent>
          <Typography
            variant="h3"
            sx={{
              color: "white",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <ScienceIcon fontSize="large" />
            Algorithm Lab
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "rgba(255,255,255,0.9)", mb: 3 }}
          >
            Environnement de test et optimisation pour tous les algorithmes
            d'analyse conversationnelle
            {selectedOrigin && ` • Origine filtrée: ${selectedOrigin}`}
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label={`Domaine: ${labState.selectedDomain.toUpperCase()}`}
              sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            />
            <Chip
              label={`Mode: ${labState.mode.replace("_", " ").toUpperCase()}`}
              sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            />
            <Chip
              label="Global Framework"
              sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            />
            {globalIsRunning && (
              <Chip
                label={`En cours: ${currentOperation}`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  color: "white",
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Erreur globale */}
      {globalError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {globalError}
        </Alert>
      )}

      {/* Onglets du Lab */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={labState.mode}
          onChange={handleModeChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
            },
          }}
        >
          <Tab
            icon={<AnalyticsIcon />}
            iconPosition="start"
            label="Vue d'ensemble"
            value="overview"
          />
          <Tab
            icon={<TestIcon />}
            iconPosition="start"
            label="Test unique"
            value="single_test"
          />
          <Tab
            icon={<CompareIcon />}
            iconPosition="start"
            label="Comparaison"
            value="comparison"
          />
          <Tab
            icon={<TrendingUpIcon />}
            iconPosition="start"
            label="Optimisation"
            value="optimization"
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label="Validation"
            value="validation"
          />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}

      {/* Vue d'ensemble */}
      <TabPanel value={labState.mode} index="overview">
        <Box sx={{ space: 3 }}>
          <Typography variant="h5" gutterBottom>
            Domaines d'analyse disponibles
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 3,
            }}
          >
            {Object.entries(domainConfig).map(([key, config]) => (
              <Card
                key={key}
                sx={adaptiveStyles.domainCard}
                onClick={() => handleDomainSelect(key as TestDomain)}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ textAlign: "center", mb: 2 }}>
                    {config.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: "center" }}
                  >
                    {config.name}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Algorithmes ({config.algorithms.length}):
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {config.algorithms.slice(0, 2).map((algo) => (
                        <Chip
                          key={algo}
                          label={algo}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {config.algorithms.length > 2 && (
                        <Chip
                          label={`+${config.algorithms.length - 2}`}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Indicateurs ({config.indicators.length}):
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {config.indicators.slice(0, 2).join(", ")}
                      {config.indicators.length > 2 && "..."}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      label={config.status}
                      color={
                        config.status === "operational" ? "success" : "warning"
                      }
                      size="small"
                    />
                    <Button variant="outlined" size="small">
                      Tester
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Statistiques globales */}
          <Card sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistiques globales du Lab
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 3,
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  12
                </Typography>
                <Typography variant="caption">Algorithmes</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="success.main">
                  8
                </Typography>
                <Typography variant="caption">Indicateurs</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="warning.main">
                  {getTestHistory().length}
                </Typography>
                <Typography variant="caption">Tests effectués</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="info.main">
                  89.3%
                </Typography>
                <Typography variant="caption">Accuracy moyenne</Typography>
              </Box>
            </Box>

            {getTestHistory().length > 0 && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={clearHistory}
                  size="small"
                >
                  Effacer l'historique
                </Button>
              </Box>
            )}
          </Card>
        </Box>
      </TabPanel>

      {/* Test unique - PANNEAU AVEC VALIDATION SCIENTIFIQUE */}
      <TabPanel value={labState.mode} index="single_test">
        <SingleTestPanel
          selectedOrigin={selectedOrigin}
          onTestComplete={handleTestComplete}
          supabaseClient={supabase}
        />
      </TabPanel>

      {/* Comparaison */}
      <TabPanel value={labState.mode} index="comparison">
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Mode comparaison:</strong> Comparez les performances de
            plusieurs algorithmes sur les mêmes données pour identifier le plus
            adapté.
          </Typography>
        </Alert>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Comparaison multi-algorithmes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Interface de comparaison à implémenter. Fonctionnalités:
          </Typography>
          <Box component="ul" sx={{ mt: 2, pl: 2 }}>
            <li>Sélection multiple d'algorithmes</li>
            <li>Tests simultanés sur mêmes données</li>
            <li>Tableaux comparatifs de performance</li>
            <li>Métriques de convergence et divergence</li>
            <li>Recommandations d'usage optimal</li>
          </Box>
        </Card>
      </TabPanel>

      {/* Optimisation */}
      <TabPanel value={labState.mode} index="optimization">
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Optimisation automatique:</strong> Recherche automatique des
            meilleurs paramètres pour chaque algorithme via grid search et
            validation croisée.
          </Typography>
        </Alert>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Optimisation des paramètres
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Module d'optimisation automatique à développer:
          </Typography>
          <Box component="ul" sx={{ mt: 2, pl: 2 }}>
            <li>Grid search sur espaces de paramètres</li>
            <li>Validation croisée k-fold</li>
            <li>Optimisation bayésienne</li>
            <li>Monitoring temps réel</li>
            <li>Sauvegarde configurations optimales</li>
          </Box>
        </Card>
      </TabPanel>

      {/* Validation */}
      <TabPanel value={labState.mode} index="validation">
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Validation scientifique:</strong> Tests de convergence entre
            domaines (AC ↔ LI ↔ Cognitif) et validation par annotation experte.
          </Typography>
        </Alert>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Validation convergence multi-domaines
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Framework de validation scientifique:
          </Typography>
          <Box component="ul" sx={{ mt: 2, pl: 2 }}>
            <li>Tests de corrélation inter-domaines</li>
            <li>Coefficient de Kendall (τ) pour concordance</li>
            <li>Interface d'annotation experte</li>
            <li>Métriques de qualité (Precision/Recall/F1)</li>
            <li>Export résultats pour publication</li>
          </Box>
        </Card>
      </TabPanel>

      {/* Footer avec informations sur l'état du Lab */}
      <Box
        sx={{
          mt: 4,
          p: 2,
          textAlign: "center",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Algorithm Lab Global v1.0 - Framework unifié d'optimisation
          algorithmique • Position: Onglet principal Analysis •
          {isInitialized ? "Initialisé" : "Initialisation..."} • Tests:{" "}
          {getTestHistory().length}
        </Typography>
      </Box>
    </Box>
  );
};

export default AlgorithmLabInterface;
