// components/AlgorithmLab/Level1Interface.tsx
// Interface principale Level1 avec distinction individual/comparison

import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, Typography, Divider } from "@mui/material";

// Individual analysis components
import { TechnicalValidation } from "./individual/TechnicalValidation";
import { ConfusionMatrix } from "./individual/ConfusionMatrix";
import { EnhancedErrorAnalysis } from "./individual/EnhancedErrorAnalysis";
import { ParameterOptimization } from "./individual/ParameterOptimization";

// Comparison analysis components
import { AlgorithmComparison } from "./comparison/AlgorithmComparison";
import { ClassifierConfiguration } from "./comparison/ClassifierConfiguration";
import { CrossValidation } from "./comparison/CrossValidation";
import { initializeClassifiers } from "../../algorithms/level1/shared/initializeClassifiers";

// Shared components
import { TechnicalBenchmark } from "./TechnicalBenchmark";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`level1-tabpanel-${index}`}
    aria-labelledby={`level1-tab-${index}`}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

export const Level1Interface: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    initializeClassifiers();
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h3" gutterBottom>
        Niveau 1 : Validation Technique
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Test de performance des algorithmes de classification contre le gold
        standard expert
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Navigation principale */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Level 1 validation tabs"
        >
          {/* Section Analyses Individuelles */}
          <Tab label="Validation Technique" />
          <Tab label="Matrice Confusion" />
          <Tab label="Analyse Erreurs" />
          <Tab label="Optimisation" />

          {/* Séparateur visuel */}
          <Tab label="─────────" disabled sx={{ minWidth: 20, opacity: 0.3 }} />

          {/* Section Analyses Comparatives */}
          <Tab label="Comparaison Multi-Algo" />
          <Tab label="Configuration" />
          <Tab label="Validation Croisée" />

          {/* Section Synthèse */}
          <Tab label="─────────" disabled sx={{ minWidth: 20, opacity: 0.3 }} />
          <Tab label="Benchmark Global" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}

      {/* ANALYSES INDIVIDUELLES */}
      <TabPanel value={tabValue} index={0}>
        <TechnicalValidation />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ConfusionMatrix />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <EnhancedErrorAnalysis />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ParameterOptimization />
      </TabPanel>

      {/* ANALYSES COMPARATIVES */}
      <TabPanel value={tabValue} index={5}>
        <AlgorithmComparison />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <ClassifierConfiguration />
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <CrossValidation />
      </TabPanel>

      {/* SYNTHÈSE */}
      <TabPanel value={tabValue} index={9}>
        <TechnicalBenchmark />
      </TabPanel>
    </Box>
  );
};
