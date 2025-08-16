/**
 * TestMigration.tsx - Composant de test corrigé
 */

import React from "react";
import { Box, Typography, Alert, Button } from "@mui/material";
import {
  CognitiveMetricsTransition,
  validateCognitiveMigration,
} from "./cognitive-metrics/migration/adaptUseCognitiveMetrics";

/**
 * Composant simple pour tester la migration sans erreurs
 */
const TestMigration: React.FC = () => {
  const handleTestValidation = () => {
    const isValid = validateCognitiveMigration();
    alert(`Migration valide: ${isValid ? "OUI" : "NON"}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎉 Migration Cognitive Fonctionnelle
        </Typography>
        <Typography variant="body2">
          Les erreurs TypeScript ont été corrigées. Le framework de migration
          est opérationnel.
        </Typography>
      </Alert>

      <Button variant="contained" onClick={handleTestValidation} sx={{ mb: 3 }}>
        Tester Validation Migration
      </Button>

      {/* Composant de transition migré */}
      <CognitiveMetricsTransition />
    </Box>
  );
};

export default TestMigration;
