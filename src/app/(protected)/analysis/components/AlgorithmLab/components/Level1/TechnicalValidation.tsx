// components/Level1/TechnicalValidation.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Divider,
} from "@mui/material";
import { PlayArrow, Settings, Assessment, Download } from "@mui/icons-material";
import { useLevel1Testing } from "../../hooks/useLevel1Testing";
import { AlgorithmResult } from "../../types/Level1Types";
import { EnhancedErrorAnalysis } from "./EnhancedErrorAnalysis";

export const TechnicalValidation: React.FC = () => {
  const theme = useTheme();
  const {
    state,
    setState,
    availableAlgorithms,
    runValidation,
    updateAlgorithmParameters,
    isDataReady,
  } = useLevel1Testing();

  const [selectedOrigin, setSelectedOrigin] = useState<string>("");

  const handleRunValidation = () => {
    runValidation(
      state.selectedAlgorithm,
      state.sampleSize,
      selectedOrigin || null
    );
  };

  const renderMetricsCard = () => {
    if (!state.metrics) return null;

    const { accuracy, precision, recall, f1Score, kappa, totalSamples } =
      state.metrics;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Assessment />
            Métriques de Performance
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                {(accuracy * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accuracy Globale
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography
                variant="h4"
                color="success.main"
                sx={{ fontWeight: "bold" }}
              >
                {kappa.toFixed(3)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kappa Cohen
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {totalSamples}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Échantillons
              </Typography>
            </Box>
            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography
                variant="h4"
                color="info.main"
                sx={{ fontWeight: "bold" }}
              >
                {state.results.filter((r: AlgorithmResult) => r.correct).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prédictions Correctes
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            Métriques par Classe
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Classe</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Précision</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Rappel</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>F1-Score</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(precision).map((cls) => (
                  <TableRow key={cls}>
                    <TableCell>
                      <Chip
                        label={cls}
                        size="small"
                        variant="outlined"
                        sx={{
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1
                          ),
                          borderColor: theme.palette.primary.main,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {(precision[cls] * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell align="center">
                      {(recall[cls] * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          color:
                            f1Score[cls] > 0.8
                              ? "success.main"
                              : f1Score[cls] > 0.6
                              ? "warning.main"
                              : "error.main",
                          fontWeight: "bold",
                        }}
                      >
                        {(f1Score[cls] * 100).toFixed(1)}%
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert
            severity={
              kappa > 0.7 ? "success" : kappa > 0.4 ? "warning" : "error"
            }
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              <strong>Interprétation:</strong>{" "}
              {kappa > 0.7
                ? `Accord substantiel (κ=${kappa.toFixed(
                    3
                  )}) - Performance technique validée`
                : kappa > 0.4
                ? `Accord modéré (κ=${kappa.toFixed(3)}) - Optimisation requise`
                : `Accord faible (κ=${kappa.toFixed(
                    3
                  )}) - Révision algorithmique nécessaire`}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  // const renderErrorExamples = () => {
  //   if (!state.results.length) return null;

  //   const errors = state.results
  //     .filter((r: AlgorithmResult) => !r.correct)
  //     .slice(0, 10);

  //   if (errors.length === 0) return null;

  //   return (
  //     <Card sx={{ mt: 3 }}>
  //       <CardContent>
  //         <Typography variant="h6" gutterBottom>
  //           Exemples d'Erreurs de Classification
  //         </Typography>

  //         <TableContainer sx={{ maxHeight: 400 }}>
  //           <Table size="small" stickyHeader>
  //             <TableHead>
  //               <TableRow>
  //                 <TableCell>
  //                   <strong>Verbatim</strong>
  //                 </TableCell>
  //                 <TableCell>
  //                   <strong>Prédit</strong>
  //                 </TableCell>
  //                 <TableCell>
  //                   <strong>Réel</strong>
  //                 </TableCell>
  //                 <TableCell>
  //                   <strong>Confiance</strong>
  //                 </TableCell>
  //               </TableRow>
  //             </TableHead>
  //             <TableBody>
  //               {errors.map((error: any, idx: number) => (
  //                 <TableRow key={idx}>
  //                   <TableCell sx={{ maxWidth: 300 }}>
  //                     <Typography
  //                       variant="body2"
  //                       sx={{
  //                         overflow: "hidden",
  //                         textOverflow: "ellipsis",
  //                         whiteSpace: "nowrap",
  //                       }}
  //                     >
  //                       {error.input}
  //                     </Typography>
  //                   </TableCell>
  //                   <TableCell>
  //                     <Chip
  //                       label={error.predicted}
  //                       size="small"
  //                       color="error"
  //                     />
  //                   </TableCell>
  //                   <TableCell>
  //                     <Chip
  //                       label={error.goldStandard}
  //                       size="small"
  //                       color="success"
  //                     />
  //                   </TableCell>
  //                   <TableCell>
  //                     <Typography
  //                       variant="body2"
  //                       sx={{
  //                         color:
  //                           error.confidence > 0.7
  //                             ? "error.main"
  //                             : "warning.main",
  //                       }}
  //                     >
  //                       {(error.confidence * 100).toFixed(1)}%
  //                     </Typography>
  //                   </TableCell>
  //                 </TableRow>
  //               ))}
  //             </TableBody>
  //           </Table>
  //         </TableContainer>
  //       </CardContent>
  //     </Card>
  //   );
  // };
  const renderErrorAnalysis = () => {
    if (!state.results.length) return null;

    return (
      <EnhancedErrorAnalysis
        results={state.results}
        algorithmName={state.selectedAlgorithm}
      />
    );
  };

  if (!isDataReady) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Chargement des données turntagged...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Validation Technique des Algorithmes
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Évaluation de la performance des algorithmes de classification par
        rapport au gold standard expert
      </Typography>

      {/* Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Settings />
          Configuration du Test
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ flex: "1 1 250px" }}>
            <FormControl fullWidth>
              <InputLabel>Algorithme</InputLabel>
              <Select
                value={state.selectedAlgorithm}
                label="Algorithme"
                onChange={(e) =>
                  setState((prev: any) => ({
                    ...prev,
                    selectedAlgorithm: e.target.value,
                  }))
                }
              >
                {availableAlgorithms.map((algo) => (
                  <MenuItem key={algo.name} value={algo.name}>
                    {algo.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: "1 1 250px" }}>
            <FormControl fullWidth>
              <InputLabel>Origine (Filtrage)</InputLabel>
              <Select
                value={selectedOrigin}
                label="Origine (Filtrage)"
                onChange={(e) => setSelectedOrigin(e.target.value)}
              >
                <MenuItem value="">Toutes les origines</MenuItem>
                <MenuItem value="BANK">BANK</MenuItem>
                <MenuItem value="INSURANCE">INSURANCE</MenuItem>
                <MenuItem value="TELECOM">TELECOM</MenuItem>
                <MenuItem value="ENERGY">ENERGY</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: "1 1 250px" }}>
            <Typography gutterBottom>
              Taille d'échantillon: {state.sampleSize}
            </Typography>
            <Slider
              value={state.sampleSize}
              onChange={(_, newValue) =>
                setState((prev: any) => ({
                  ...prev,
                  sampleSize: newValue as number,
                }))
              }
              min={100}
              max={5000}
              step={100}
              marks={[
                { value: 500, label: "500" },
                { value: 1000, label: "1K" },
                { value: 2500, label: "2.5K" },
                { value: 5000, label: "5K" },
              ]}
            />
          </Box>

          <Box sx={{ flex: "1 1 250px" }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrow />}
              onClick={handleRunValidation}
              disabled={state.isRunning}
              sx={{ height: 56 }}
            >
              {state.isRunning ? "Test en cours..." : "Lancer le Test"}
            </Button>
          </Box>
        </Box>

        {state.isRunning && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Progression: {state.progress.toFixed(1)}%
            </Typography>
            <LinearProgress variant="determinate" value={state.progress} />
          </Box>
        )}

        {state.errors.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {state.errors.length} erreur(s) détectée(s). Dernière:{" "}
              {state.errors[state.errors.length - 1]}
            </Typography>
          </Alert>
        )}
      </Paper>

      {renderMetricsCard()}
      {renderErrorAnalysis()}
    </Box>
  );
};

export default TechnicalValidation;
