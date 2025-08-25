// Composant principal d'intégration - components/Level1/Level1Interface.tsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Alert,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Assessment,
  ViewModule as GridView,
  Tune,
  CompareArrows,
} from "@mui/icons-material";
import { TechnicalValidation } from "./TechnicalValidation";
import { ConfusionMatrix } from "./ConfusionMatrix";
import { ParameterOptimization } from "./ParameterOptimization";
import { TechnicalBenchmark } from "./TechnicalBenchmark";
import { useLevel1Testing } from "../../hooks/useLevel1Testing";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: "24px" }}>
    {value === index && children}
  </div>
);

export const Level1Interface: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const {
    state,
    availableAlgorithms,
    updateAlgorithmParameters,
    runValidation,
  } = useLevel1Testing();
  const [benchmarkHistory, setBenchmarkHistory] = useState<any[]>([]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleParametersChange = (params: Record<string, any>) => {
    updateAlgorithmParameters(state.selectedAlgorithm, params);
  };

  const handleTestWithParameters = async (params: Record<string, any>) => {
    updateAlgorithmParameters(state.selectedAlgorithm, params);
    await runValidation(
      state.selectedAlgorithm,
      state.sampleSize,
      state.selectedOrigin
    );

    // Ajouter aux benchmarks
    if (state.metrics) {
      const benchmarkData = {
        algorithmName: state.selectedAlgorithm,
        type:
          availableAlgorithms.find((a) => a.name === state.selectedAlgorithm)
            ?.type || "conseiller",
        metrics: state.metrics,
        sampleSize: state.sampleSize,
        executionTime: Date.now(),
        parameters: params,
      };
      setBenchmarkHistory((prev) => [...prev.slice(-4), benchmarkData]); // Garder les 5 derniers
    }
  };

  const currentAlgorithm = availableAlgorithms.find(
    (a) => a.name === state.selectedAlgorithm
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header avec statut prérequis */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Niveau 1 - Validation Technique:</strong> Évaluation des
          performances algorithmiques par rapport au gold standard expert.
          Prérequis: Kappa inter-annotateurs {">"} 0.70 du Niveau 0.
        </Typography>
      </Alert>

      {/* Navigation par onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<Assessment />}
            label="Validation Principale"
            sx={{ minHeight: 72 }}
          />
          <Tab
            icon={<GridView />}
            label="Matrice de Confusion"
            sx={{ minHeight: 72 }}
          />
          <Tab
            icon={<Tune />}
            label="Optimisation Paramètres"
            sx={{ minHeight: 72 }}
          />
          <Tab
            icon={<CompareArrows />}
            label="Benchmark Comparatif"
            sx={{ minHeight: 72 }}
          />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      <TabPanel value={currentTab} index={0}>
        <TechnicalValidation />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <ConfusionMatrix
          metrics={state.metrics}
          title="Matrice de Confusion - Analyse des Erreurs"
        />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {currentAlgorithm && (
          <ParameterOptimization
            algorithm={currentAlgorithm}
            onParametersChange={handleParametersChange}
            onTestWithParameters={handleTestWithParameters}
            isRunning={state.isRunning}
          />
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <TechnicalBenchmark
          benchmarkResults={benchmarkHistory}
          title="Historique des Performances"
        />
      </TabPanel>
    </Box>
  );
};

export default Level1Interface;
