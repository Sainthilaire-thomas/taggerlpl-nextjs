// app/(protected)/analysis/page.tsx - Intégration Algorithm Lab comme onglet principal
"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Tabs, Tab, Paper, useTheme } from "@mui/material";
import AppLayout from "../layout";

// 📊 Composants AC existants (conservés)
import StrategyAnalysisContainer from "./components/StrategyAnalysisContainer";
import TagAnalysisGraph from "@/components/TagAnalysisGraph";
import TagStats from "@/features/phase2-annotation/tags/ui/components/TagStats";
import ImprovedGlobalMetrics from "./components/ImprovedGlobalMetrics";
import DebugFunnel from "./components/DebugFunnel";
import TagTemporalAnalysis from "./components/TagTemporalAnalysis";

// 🧠 NOUVEAU FRAMEWORK - Domaine Cognitif
import FluiditeCognitiveInterface from "./components/cognitive-metrics/indicators/FluiditeCognitiveIndicator/FluiditeCognitiveInterface";
import FeedbackAlignmentInterface from "./components/li-metrics/indicators/FeedbackAlignementIndicator/FeedbackAlignmentInterface";

import AlgorithmLabInterface from "./components/AlgorithmLab/components/shared/AlgorithmLabInterface";
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analysis-tab-${index}`,
    "aria-controls": `analysis-tabpanel-${index}`,
  };
}

export default function AnalysisPage() {
  const theme = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Force la rétractation de la sidebar
    const forceRetractSidebar = () => {
      if (typeof window !== "undefined") {
        localStorage.setItem("drawerExpanded", "false");
        window.dispatchEvent(new Event("storage"));
      }
    };

    setTimeout(forceRetractSidebar, 200);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!isClient) {
    return null;
  }

  return (
    <AppLayout>
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* En-tête principal avec mention Algorithm Lab */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
            Centre d'Analyse Conversationnelle
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Framework unifié pour l'analyse multi-domaines (AC • LI • Cognitif)
            + Algorithm Lab
          </Typography>
        </Box>

        {/* Onglets avec Algorithm Lab intégré */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
              },
            }}
          >
            <Tab label="📊 Efficacité des Stratégies" {...a11yProps(0)} />
            <Tab label="🔄 Flux Conversationnels" {...a11yProps(1)} />
            <Tab label="📈 Statistiques par Famille" {...a11yProps(2)} />
            <Tab label="🗣️ Linguistique Interactionnelle" {...a11yProps(3)} />
            <Tab label="🧠 Sciences Cognitives" {...a11yProps(4)} />
            <Tab label="🔬 Validation Convergence" {...a11yProps(5)} />
            <Tab label="🧪 Algorithm Lab" {...a11yProps(6)} />
            <Tab label="📍 Analyse Temporelle" {...a11yProps(7)} />
          </Tabs>
        </Paper>

        {/* Contenu des onglets */}

        {/* 📊 AC - Domaine existant conservé */}
        <TabPanel value={tabValue} index={0}>
          <StrategyAnalysisContainer />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TagAnalysisGraph />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Interface de sélection de famille */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: "background.default" }}>
            <Typography variant="h6" gutterBottom>
              Sélectionnez une famille pour voir les statistiques détaillées
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 2,
                mt: 2,
              }}
            >
              {["ENGAGEMENT", "REFLET", "EXPLICATION", "OUVERTURE"].map(
                (family) => (
                  <Paper
                    key={family}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.3s ease",
                      border: "2px solid transparent",
                      "&:hover": {
                        borderColor: "primary.main",
                        transform: "translateY(-2px)",
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => {
                      console.log(`Famille sélectionnée: ${family}`);
                    }}
                  >
                    <Typography variant="h6" color="primary">
                      {family}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cliquez pour analyser
                    </Typography>
                  </Paper>
                )
              )}
            </Box>
          </Paper>

          <TagStats family={null} />
        </TabPanel>

        {/* 🗣️ LI - NOUVEAU FRAMEWORK */}
        <TabPanel value={tabValue} index={3}>
          <FeedbackAlignmentInterface showComparison={true} />
        </TabPanel>

        {/* 🧠 COGNITIF - NOUVEAU FRAMEWORK DIRECT */}
        <TabPanel value={tabValue} index={4}>
          <FluiditeCognitiveInterface showComparison={true} />
        </TabPanel>

        {/* 🔬 CONVERGENCE - FUTUR */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom color="secondary">
              🔬 Validation Convergence Multi-Niveaux
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Tests de convergence AC ↔ LI ↔ Cognitif selon méthodologie thèse
              3.3
            </Typography>

            <Paper
              sx={{
                p: 4,
                bgcolor: "secondary.light",
                color: "secondary.contrastText",
              }}
            >
              <Typography variant="h6" gutterBottom>
                📊 Tests statistiques automatisés
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Validation des hypothèses avec tests statistiques rigoureux :
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                  gap: 2,
                  mt: 3,
                }}
              >
                <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📈 Coefficient de Kendall (τ)
                  </Typography>
                  <Typography variant="body2">
                    Concordance des classements d'efficacité entre
                    AC/LI/Cognitif
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📊 Corrélations de Pearson (r)
                  </Typography>
                  <Typography variant="body2">
                    Accord sur l'efficacité relative des stratégies
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🎯 Tests d'hypothèses
                  </Typography>
                  <Typography variant="body2">
                    Validation H1 (actions), H2 (explications), H3 (modulation)
                  </Typography>
                </Paper>
              </Box>
              <Typography variant="body2" sx={{ mt: 3, fontStyle: "italic" }}>
                Interface à développer après completion des domaines LI et AC
              </Typography>
            </Paper>
          </Box>
        </TabPanel>

        {/* 🧪 ALGORITHM LAB - NOUVEAU ONGLET PRINCIPAL */}
        <TabPanel value={tabValue} index={6}>
          <AlgorithmLabInterface
            selectedOrigin={selectedOrigin}
            availableDomains={["li", "cognitive", "ac"]}
            availableIndicators={[
              "feedback_alignment",
              "fluidite_cognitive",
              "common_ground",
              "backchannels",
            ]}
          />
        </TabPanel>

        {/* 📍 TEMPOREL - Existant conservé */}
        <TabPanel value={tabValue} index={7}>
          <TagTemporalAnalysis />
        </TabPanel>

        {/* Section debug (conservée en bas) */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "2px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" gutterBottom color="text.secondary">
            🔧 Outils de Debug et Métriques Globales
          </Typography>

          {/* Composant de debug temporaire */}
          <DebugFunnel selectedOrigin={selectedOrigin} />

          {/* Métriques globales améliorées */}
          <ImprovedGlobalMetrics />
        </Box>
      </Box>
    </AppLayout>
  );
}
