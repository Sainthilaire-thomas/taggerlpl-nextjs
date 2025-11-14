// components/AlgorithmLab/Level1Interface.tsx
"use client";
import React, { useMemo, useState } from "react";
import { Box, Tabs, Tab, Typography, Divider } from "@mui/material";

// UI “par variable”
import XValidationInterface from "./algorithms/XClassifiers/XValidationInterface";
import YValidationInterface from "./algorithms/YClassifiers/YValidationInterface";
import M1ValidationInterface from "./algorithms/M1Calculators/M1ValidationInterface";
import M2ValidationInterface from "./algorithms/M2Calculators/M2ValidationInterface";
import M3ValidationInterface from "./algorithms/M3Calculators/M3ValidationInterface";

// Onglets historiques qui restent surtout pertinents pour X/Y
import { ConfusionMatrix } from "./individual/ConfusionMatrix";
import { EnhancedErrorAnalysis } from "./individual/EnhancedErrorAnalysis";
import { ParameterOptimization } from "./individual/ParameterOptimization";
import { TechnicalBenchmark } from "./TechnicalBenchmark";
import type { ValidationMetrics } from "@/app/(protected)/analysis/components/AlgorithmLab/types";
// (optionnel) métriques si tu veux réutiliser la matrice pour X/Y
// import { useXAlgorithmTesting } from "../hooks/level1/useXAlgorithmTesting";

type Variable = "X" | "Y" | "M1" | "M2" | "M3";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} id={`level1-tabpanel-${index}`}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

export const Level1Interface: React.FC = () => {
  const [mainTab, setMainTab] = useState(0); // onglets haut (Validation, Matrice, etc.)
  const [variable, setVariable] = useState<Variable>("X"); // sélecteur de variable

  const showXYOnly = variable === "X" || variable === "Y";
  const EMPTY_VALIDATION_METRICS: ValidationMetrics = {
    // selon ton type exact, ces clés existent (le message d’erreur les cite)
    confusionMatrix: { labels: [], matrix: [] } as any,
    classMetrics: {}, // ex: { label: { precision, recall, f1, support } }
    totalSamples: 0,
    correctPredictions: 0,
    executionTime: 0, // en ms
  } as ValidationMetrics;

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h3" gutterBottom>
        Niveau 1 : Validation Technique
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Tests par variable (X, Y, M1, M2, M3) alignés avec la thèse.
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Sélecteur de variable (X/Y/M1/M2/M3) */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={variable}
          onChange={(_, v) => setVariable(v)}
          aria-label="Variable cible"
          variant="scrollable"
        >
          <Tab label="X (Stratégies Conseiller)" value="X" />
          <Tab label="Y (Réactions Client)" value="Y" />
          <Tab label="M1 (Verbes d’action)" value="M1" />
          <Tab label="M2 (Alignement X→Y)" value="M2" />
          <Tab label="M3 (Charge Client)" value="M3" />
        </Tabs>
      </Box>

      {/* Navigation principale (analyse / matrice / erreurs / opti / benchmark) */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label="Validation Technique" />
          <Tab label="Matrice Confusion" />
          <Tab label="Analyse Erreurs" />
          <Tab label="Optimisation" />
          <Tab label="─────────" disabled sx={{ minWidth: 20, opacity: 0.3 }} />
          <Tab label="Benchmark Global" />
        </Tabs>
      </Box>

      {/* 0) Validation Technique : rendu par variable */}
      <TabPanel value={mainTab} index={0}>
        {variable === "X" && <XValidationInterface />}
        {variable === "Y" && <YValidationInterface />}
        {variable === "M1" && <M1ValidationInterface />}
        {variable === "M2" && <M2ValidationInterface />}
        {variable === "M3" && <M3ValidationInterface />}
      </TabPanel>

      {/* 1) Matrice Confusion (pertinent pour X/Y) */}
      <TabPanel value={mainTab} index={1}>
        {showXYOnly ? (
          <ConfusionMatrix metrics={EMPTY_VALIDATION_METRICS} />
        ) : (
          <Typography color="text.secondary">
            La matrice de confusion n’est pas applicable aux calculateurs
            M1/M2/M3.
          </Typography>
        )}
      </TabPanel>

      {/* 2) Analyse Erreurs (surtout X/Y) */}
      <TabPanel value={mainTab} index={2}>
        {showXYOnly ? (
          <EnhancedErrorAnalysis results={[]} algorithmName={"—"} />
        ) : (
          <Typography color="text.secondary">
            Une analyse dédiée sera proposée pour M1/M2/M3 (markers,
            distributions).
          </Typography>
        )}
      </TabPanel>

      {/* 3) Optimisation (surtout X/Y) */}
      <TabPanel value={mainTab} index={3}>
        {showXYOnly ? (
          <ParameterOptimization
            algorithm={{
              name: "—",
              description: "",
              parameters: {},
              type: "rule-based",
              enabled: true,
            }}
            onParametersChange={() => {}}
            onTestWithParameters={async () => ({ success: true, results: [] })}
          />
        ) : (
          <Typography color="text.secondary">
            Les calculateurs M1/M2/M3 n’exposent pas (encore) d’hyperparamètres
            ici.
          </Typography>
        )}
      </TabPanel>

      {/* 5) Benchmark Global (à raccorder plus tard) */}
      <TabPanel value={mainTab} index={5}>
        <TechnicalBenchmark benchmarkResults={[]} />
      </TabPanel>
    </Box>
  );
};

export default Level1Interface;
