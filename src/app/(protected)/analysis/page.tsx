// app/(protected)/analysis/page.tsx - Version avec Migration Framework
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  useTheme,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AppLayout from "../layout";

// Vos composants existants
import StrategyAnalysisContainer from "./components/StrategyAnalysisContainer";
import TagAnalysisGraph from "@/components/TagAnalysisGraph";
import TagAnalysisReport from "@/components/TagAnalysisReport";
import TagStats from "@/components/TagStats";
import CognitiveMetrics from "./components/cognitive-metrics/CognitiveMetrics";
import LinguisticInteractionalMetrics from "./components/li-metrics/LinguisticInteractionalMetrics";
// ✅ Import du nouveau composant de métriques
import ImprovedGlobalMetrics from "./components/ImprovedGlobalMetrics";

// ✅ Import du composant de debug (temporaire)
import DebugFunnel from "./components/DebugFunnel";

// 🚀 Import du composant d'analyse temporelle
import TagTemporalAnalysis from "./components/TagTemporalAnalysis";

// 🆕 NOUVEAU : Import du framework de migration
import TestMigration from "./components/TestMigration";

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

  // 🆕 État pour activer/désactiver le mode migration
  const [showMigrationFramework, setShowMigrationFramework] = useState(false);

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
        {/* En-tête principal avec contrôle migration */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
                Centre d'Analyse Conversationnelle
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Intelligence artificielle pour l'optimisation des interactions
                client
              </Typography>
            </Box>

            {/* 🆕 Toggle pour activer le framework de migration */}
            <FormControlLabel
              control={
                <Switch
                  checked={showMigrationFramework}
                  onChange={(e) => setShowMigrationFramework(e.target.checked)}
                  color="primary"
                />
              }
              label="🚀 Framework Unifié"
              labelPlacement="start"
              sx={{
                bgcolor: "background.paper",
                p: 1,
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            />
          </Box>

          {/* 🆕 Alert d'information sur le framework */}
          {showMigrationFramework && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🔬 Mode Framework Unifié Activé
              </Typography>
              <Typography variant="body2">
                Vous testez la nouvelle architecture modulaire pour les
                métriques cognitives et LI. L'interface existante reste
                préservée et peut être utilisée en parallèle.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Contenu conditionnel selon le mode */}
        {showMigrationFramework ? (
          // 🆕 MODE FRAMEWORK UNIFIÉ
          <TestMigration />
        ) : (
          // 📊 MODE EXISTANT (votre interface actuelle)
          <>
            {/* Onglets de navigation */}
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
                <Tab label="📈 Métriques LI" {...a11yProps(3)} />
                <Tab label="🧠 Métriques Cognitives" {...a11yProps(4)} />
                <Tab label="📍 Analyse Temporelle" {...a11yProps(5)} />
              </Tabs>
            </Paper>

            {/* Contenu des onglets */}
            <TabPanel value={tabValue} index={0}>
              <StrategyAnalysisContainer />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TagAnalysisGraph />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Interface de sélection de famille */}
              <Paper
                sx={{ p: 3, mb: 3, backgroundColor: "background.default" }}
              >
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

            <TabPanel value={tabValue} index={3}>
              <LinguisticInteractionalMetrics />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <CognitiveMetrics />
            </TabPanel>

            <TabPanel value={tabValue} index={5}>
              <TagTemporalAnalysis />
            </TabPanel>

            {/* Composants de debug et métriques (affichés sous tous les onglets) */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: "2px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" gutterBottom color="text.secondary">
                🔧 Outils de Debug et Métriques
              </Typography>

              {/* Composant de debug temporaire */}
              <DebugFunnel selectedOrigin={selectedOrigin} />

              {/* Métriques globales améliorées */}
              <ImprovedGlobalMetrics />
            </Box>
          </>
        )}
      </Box>
    </AppLayout>
  );
}
