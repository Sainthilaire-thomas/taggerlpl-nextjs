// src/features/phase2-annotation/supervision/ui/components/SupervisionDashboard.tsx
"use client";
import React from "react";
import { Box, Typography, Paper } from "@mui/material";

export const SupervisionDashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Supervision & ContrÃ´le QualitÃ©
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body1">
          TODO: ImplÃ©menter dashboard de supervision qualitÃ©
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          - Statistiques d'annotation
          - Indicateurs de qualitÃ©
          - Validation inter-annotateurs
          - Rapports de progression
        </Typography>
      </Paper>
    </Box>
  );
};
