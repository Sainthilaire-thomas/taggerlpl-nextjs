// ============================================================================
// Level0Interface - Interface de test des chartes
// ============================================================================

"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from "@mui/material";
import { PlayArrow, Science, Visibility } from "@mui/icons-material";
import { useLevel0Testing } from "../hooks/useLevel0Testing";
import { CharteTestResult } from "@/types/algorithm-lab/Level0Types";
import { DisagreementsPanel } from "./DisagreementsPanel";

export const Level0Interface: React.FC = () => {
  const { loading, progress, results, error, testVariable, loadSavedResults } = useLevel0Testing();
  const [variable, setVariable] = useState<"X" | "Y">("Y");
  const [sampleSize, setSampleSize] = useState(10);
  const [selectedResult, setSelectedResult] = useState<CharteTestResult | null>(null);

  const handleTest = () => {
    testVariable(variable, sampleSize);
    setSelectedResult(null);
  };

  const handleLoadSaved = () => {
    loadSavedResults(variable);
  };

  const handleViewDetails = (result: CharteTestResult) => {
    setSelectedResult(result);
  };

  const bestResult = results.length > 0
    ? results.reduce((best, current) => current.kappa > best.kappa ? current : best)
    : null;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Level 0 - Validation multi-chartes
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Test de différentes formulations de chartes d''annotation pour optimiser la reproductibilité LLM
      </Typography>

      {/* Section : Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration du test
          </Typography>

          <Stack direction="row" spacing={2} mb={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Variable</InputLabel>
              <Select
                value={variable}
                onChange={(e) => setVariable(e.target.value as "X" | "Y")}
                label="Variable"
                disabled={loading}
              >
                <MenuItem value="Y">Y - Réaction Client (3 chartes)</MenuItem>
                <MenuItem value="X">X - Stratégie Conseiller (2 chartes)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Taille échantillon"
              type="number"
              value={sampleSize}
              onChange={(e) => setSampleSize(Math.max(1, Math.min(901, parseInt(e.target.value) || 10)))}
              disabled={loading}
              sx={{ width: 200 }}
              helperText="1-901 paires"
            />

            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleTest}
              disabled={loading}
              size="large"
            >
              Lancer test
            </Button>

            <Button
              variant="outlined"
              startIcon={<Science />}
              onClick={handleLoadSaved}
              disabled={loading}
            >
              Charger résultats sauvegardés
            </Button>
          </Stack>

          {variable === "Y" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Variable Y : 3 chartes seront testées (A-Minimaliste, B-Enrichie, C-Binaire)
            </Alert>
          )}
          {variable === "X" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Variable X : 2 chartes seront testées (A-Sans contexte, B-Avec contexte)
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Section : Progression */}
      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test en cours...
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {progress.charteName} - {progress.current}/{progress.total} paires annotées
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(progress.current / progress.total) * 100}
            />
          </CardContent>
        </Card>
      )}

      {/* Section : Erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Section : Résultats */}
      {results.length > 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Résultats comparatifs
              </Typography>

              {bestResult && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <strong>Meilleure charte :</strong> {bestResult.charte_name} 
                  {" "}(κ={bestResult.kappa.toFixed(3)}, {bestResult.disagreements_count} désaccords)
                </Alert>
              )}

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Charte</strong></TableCell>
                    <TableCell align="center"><strong>Kappa (κ)</strong></TableCell>
                    <TableCell align="center"><strong>Accuracy</strong></TableCell>
                    <TableCell align="center"><strong>Désaccords</strong></TableCell>
                    <TableCell align="center"><strong>Temps (s)</strong></TableCell>
                    <TableCell align="center"><strong>Interprétation</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results
                    .sort((a, b) => b.kappa - a.kappa)
                    .map((result) => {
                      const isBest = result.test_id === bestResult?.test_id;
                      const interpretation = interpretKappa(result.kappa);
                      
                      return (
                        <TableRow
                          key={result.test_id}
                          sx={{ 
                            bgcolor: isBest ? "success.light" : undefined,
                            fontWeight: isBest ? "bold" : undefined
                          }}
                        >
                          <TableCell>
                            {result.charte_name}
                            {isBest && <Chip label="⭐ Meilleure" size="small" color="success" sx={{ ml: 1 }} />}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              color={result.kappa > 0.8 ? "success.main" : result.kappa > 0.6 ? "warning.main" : "error.main"}
                              fontWeight="bold"
                            >
                              {result.kappa.toFixed(3)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {(result.accuracy * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell align="center">
                            {result.disagreements_count} / {result.total_pairs}
                          </TableCell>
                          <TableCell align="center">
                            {(result.execution_time_ms / 1000).toFixed(1)}s
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={interpretation}
                              size="small"
                              color={getChipColor(result.kappa)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              color="primary"
                              onClick={() => handleViewDetails(result)}
                              disabled={result.disagreements_count === 0}
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Panneau de détails des désaccords */}
          {selectedResult && (
            <DisagreementsPanel result={selectedResult} />
          )}
        </>
      )}
    </Box>
  );
};

function interpretKappa(kappa: number): string {
  if (kappa < 0) return "Inférieur au hasard";
  if (kappa < 0.2) return "Faible";
  if (kappa < 0.4) return "Acceptable";
  if (kappa < 0.6) return "Modéré";
  if (kappa < 0.8) return "Substantiel";
  return "Quasi-parfait";
}

function getChipColor(kappa: number): "success" | "warning" | "error" | "default" {
  if (kappa >= 0.8) return "success";
  if (kappa >= 0.6) return "warning";
  return "error";
}
