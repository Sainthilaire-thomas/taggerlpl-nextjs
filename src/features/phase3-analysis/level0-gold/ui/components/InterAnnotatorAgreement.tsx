"use client";

// Composant Niveau 0 - InterAnnotatorAgreement.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  useTheme,
  alpha,
} from "@mui/material";
import {
  PlayArrow,
  Refresh,
  Download,
  Visibility,
  Edit,
  CheckCircle,
  Cancel as XCircle,
} from "@mui/icons-material";
import { useLevel0Validation } from "../hooks/useLevel0Validation";
import { InterAnnotatorData } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export const InterAnnotatorAgreement: React.FC = () => {
  const theme = useTheme();
  const {
    annotations,
    setAnnotations,
    kappaMetrics,
    disagreements,
    isCalculating,
    calculateKappa,
    identifyDisagreements,
  } = useLevel0Validation();

  const [sampleSize, setSampleSize] = useState(200);
  const [stratification, setStratification] = useState("tag-secteur");

  // Données d'exemple
  const sampleData: InterAnnotatorData[] = [
    {
      id: "ann_001",
      verbatim: "Je vais vérifier cela pour vous immédiatement",
      agreed: true,
      annotation: {
        expert1: "ENGAGEMENT",
        expert2: "ENGAGEMENT",
      },
    },
    {
      id: "ann_002",
      verbatim: "D'accord, mais il faut comprendre que...",
      agreed: false,
      annotation: {
        expert1: "CLIENT_POSITIF",
        expert2: "CLIENT_NEUTRE",
      },
    },
  ];

  const handleRunValidation = async () => {
    setAnnotations(sampleData);
    await calculateKappa(sampleData);
    identifyDisagreements(sampleData);
  };

  const getKappaColor = (kappa: number) => {
    if (kappa > 0.8) return "success";
    if (kappa > 0.6) return "primary";
    if (kappa > 0.4) return "warning";
    return "error";
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <CheckCircle sx={{ fontSize: 32, color: "primary.main" }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Accord Inter-Annotateur
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Mesure de la fiabilité entre experts selon Landis & Koch (1977)
          </Typography>
        </Box>
      </Box>

      {/* Configuration */}
      <Paper
        sx={{
          elevation: 2,
          p: 3,
          mb: 3,
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.8)
              : theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Configuration échantillon
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mb: 3,
          }}
        >
          <Box sx={{ flex: "1 1 200px" }}>
            <TextField
              fullWidth
              label="Taille échantillon"
              type="number"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              inputProps={{ min: 50, max: 500 }}
              helperText="Recommandé : 200 paires adjacentes"
            />
          </Box>

          <Box sx={{ flex: "1 1 200px" }}>
            <FormControl fullWidth>
              <InputLabel>Stratification</InputLabel>
              <Select
                value={stratification}
                label="Stratification"
                onChange={(e) => setStratification(e.target.value)}
              >
                <MenuItem value="tag-secteur">Par tag et secteur</MenuItem>
                <MenuItem value="tag">Par tag uniquement</MenuItem>
                <MenuItem value="secteur">Par secteur uniquement</MenuItem>
                <MenuItem value="random">Aléatoire</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: "1 1 200px" }}>
            <Typography variant="subtitle2" gutterBottom>
              Options avancées
            </Typography>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Inclusion contexte audio"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Pondération par durée"
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={isCalculating ? <Refresh /> : <PlayArrow />}
          onClick={handleRunValidation}
          disabled={isCalculating}
        >
          {isCalculating ? "Calcul en cours..." : "Lancer analyse Kappa"}
        </Button>
      </Paper>

      {/* Résultats métriques */}
      {kappaMetrics && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mb: 3,
          }}
        >
          <Box sx={{ flex: "1 1 400px" }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Métriques Kappa de Cohen
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    Kappa (Îº)
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={`${getKappaColor(kappaMetrics.kappa)}.main`}
                  >
                    {kappaMetrics.kappa.toFixed(3)}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={kappaMetrics.kappa * 100}
                  color={getKappaColor(kappaMetrics.kappa) as any}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">
                    Interprétation:{" "}
                    {kappaMetrics.interpretation || "Non calculée"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Accord observé:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {(kappaMetrics.observedAgreement * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Accord attendu:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {(kappaMetrics.expectedAgreement * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ flex: "1 1 400px" }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions disponibles
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  disabled={!kappaMetrics || disagreements.length === 0}
                  color="warning"
                  fullWidth
                >
                  Analyser {disagreements.length} désaccords
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  disabled={!kappaMetrics}
                  color="success"
                  fullWidth
                >
                  Interface résolution collaborative
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  disabled={!kappaMetrics || kappaMetrics.kappa < 0.7}
                  color="secondary"
                  fullWidth
                >
                  Certifier Gold Standard
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Tableau annotations */}
      {annotations.length > 0 && (
        <Paper elevation={2}>
          <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6">
              à‰chantillon annotations ({annotations.length})
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.primary.main, 0.1)
                        : theme.palette.grey[50],
                  }}
                >
                  <TableCell>Verbatim</TableCell>
                  <TableCell>Expert 1</TableCell>
                  <TableCell>Expert 2</TableCell>
                  <TableCell>Accord</TableCell>
                  <TableCell>Contexte</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {annotations.map((annotation) => (
                  <TableRow key={annotation.id} hover>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        title={String(annotation.verbatim || "")}
                      >
                        {String(annotation.verbatim || "")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={annotation.annotation?.expert1 || "N/A"}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={annotation.annotation?.expert2 || "N/A"}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {annotation.agreed ? (
                        <CheckCircle
                          sx={{ color: "success.main", fontSize: 20 }}
                        />
                      ) : (
                        <XCircle sx={{ color: "error.main", fontSize: 20 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 200 }}
                      >
                        {String(
                          (annotation as any).context ||
                            "Contexte non disponible"
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};
