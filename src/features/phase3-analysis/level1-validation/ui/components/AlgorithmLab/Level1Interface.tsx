// src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/Level1Interface.tsx
"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab, Typography, Divider, Paper } from "@mui/material";

// UI par variable
import XValidationInterface from "../algorithms/XClassifiers/XValidationInterface";
import YValidationInterface from "../algorithms/YClassifiers/YValidationInterface";
import M1ValidationInterface from "../algorithms/M1Calculators/M1ValidationInterface";
import M2ValidationInterface from "../algorithms/M2Calculators/M2ValidationInterface";
import M3ValidationInterface from "../algorithms/M3Calculators/M3ValidationInterface";

type Variable = "X" | "Y" | "M1" | "M2" | "M3";

const VARIABLE_CONFIG: Record<Variable, { label: string; description: string; icon: string }> = {
  X: {
    label: "X (Stratégies Conseiller)",
    description: "Classification des stratégies conversationnelles du conseiller",
    icon: "🎯",
  },
  Y: {
    label: "Y (Réactions Client)",
    description: "Classification des réactions émotionnelles du client",
    icon: "💬",
  },
  M1: {
    label: "M1 (Verbes d'action)",
    description: "Calcul de la densité de verbes d'action dans le discours conseiller",
    icon: "📊",
  },
  M2: {
    label: "M2 (Alignement X→Y)",
    description: "Mesure de l'alignement linguistique entre conseiller et client",
    icon: "🔗",
  },
  M3: {
    label: "M3 (Charge Client)",
    description: "Évaluation de la charge cognitive du client (hésitations, pauses)",
    icon: "🧠",
  },
};

export const Level1Interface: React.FC = () => {
  const [variable, setVariable] = useState<Variable>("X");

  const currentConfig = VARIABLE_CONFIG[variable];

  return (
    <Box sx={{ width: "100%" }}>
      {/* HEADER */}
      <Typography variant="h3" gutterBottom>
        Niveau 1 : Validation Technique
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Tests par variable (X, Y, M1, M2, M3) alignés avec la thèse.
        Chaque section utilise des <strong>Accordions</strong> pour organiser les résultats.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* SÉLECTEUR DE VARIABLE */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={variable}
          onChange={(_, v) => setVariable(v)}
          aria-label="Variable cible"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
            },
          }}
        >
          {(Object.keys(VARIABLE_CONFIG) as Variable[]).map((v) => (
            <Tab
              key={v}
              label={
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2">
                    {VARIABLE_CONFIG[v].icon} {v}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {v === 'X' ? 'Stratégies' : 
                     v === 'Y' ? 'Réactions' :
                     v === 'M1' ? 'Verbes' :
                     v === 'M2' ? 'Alignement' : 'Charge'}
                  </Typography>
                </Box>
              }
              value={v}
              sx={{
                borderBottom: variable === v ? 3 : 0,
                borderColor: 'primary.main',
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* DESCRIPTION DE LA VARIABLE SÉLECTIONNÉE */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6">
          {currentConfig.icon} {currentConfig.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {currentConfig.description}
        </Typography>
      </Paper>

      {/* CONTENU PAR VARIABLE */}
      <Box>
        {variable === "X" && <XValidationInterface />}
        {variable === "Y" && <YValidationInterface />}
        {variable === "M1" && <M1ValidationInterface />}
        {variable === "M2" && <M2ValidationInterface />}
        {variable === "M3" && <M3ValidationInterface />}
      </Box>
    </Box>
  );
};

export default Level1Interface;
