// 🦠 ORGANISM - FluiditeCognitiveInterface simplifié

import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Psychology as CognitiveIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Types pour les indicateurs
interface IndicatorResult {
  algorithm: string;
  reflet: number;
  engagement: number;
  explication: number;
  ouverture: number;
}

interface AlgorithmDetail {
  id: string;
  name: string;
  description: string;
  principle: string;
  source: string;
}

interface FluiditeCognitiveInterfaceProps {
  showComparison?: boolean;
}

const FluiditeCognitiveInterface: React.FC<
  FluiditeCognitiveInterfaceProps
> = () => {
  const theme = useTheme();
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<AlgorithmDetail | null>(null);

  // Données des algorithmes
  const algorithms: AlgorithmDetail[] = [
    {
      id: "wom1",
      name: "WOM 1",
      description: "Algorithme de base pour la mesure de fluidité cognitive",
      principle:
        "Mesure temporelle et linguistique de la fluidité conversationnelle basée sur le débit de parole et les marqueurs d'hésitation.",
      source: "Bortfeld et al. (2001) - Language and Speech",
    },
    {
      id: "wom2",
      name: "WOM 2",
      description: "Algorithme avancé avec neurones miroirs",
      principle:
        "Analyse de l'empathie automatique et de la synchronisation conversationnelle basée sur les découvertes de Gallese sur les neurones miroirs.",
      source:
        "Gallese (2007) - Philosophical Transactions of the Royal Society B",
    },
    {
      id: "wom3",
      name: "WOM 3",
      description: "Algorithme hybride ML + expertise cognitive",
      principle:
        "Combinaison d'algorithmes de machine learning et d'expertise cognitive pour une analyse multi-dimensionnelle de la fluidité.",
      source: "Kahneman (2011) - Thinking, Fast and Slow",
    },
  ];

  // Résultats simulés par algorithme et par famille
  const results: IndicatorResult[] = [
    {
      algorithm: "WOM 1",
      reflet: 77.0,
      engagement: 75.9,
      explication: 65.8,
      ouverture: 72.1,
    },
    {
      algorithm: "WOM 2",
      reflet: 79.3,
      engagement: 78.1,
      explication: 67.8,
      ouverture: 74.2,
    },
    {
      algorithm: "WOM 3",
      reflet: 81.6,
      engagement: 80.4,
      explication: 69.7,
      ouverture: 76.5,
    },
  ];

  // Fonction pour obtenir la couleur selon le score
  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Fonction pour ouvrir le pop-up de détail
  const handleAlgorithmInfo = (algorithmName: string) => {
    const algorithm = algorithms.find((alg) => alg.name === algorithmName);
    if (algorithm) {
      setSelectedAlgorithm(algorithm);
    }
  };

  // Fonction pour fermer le pop-up
  const handleCloseDialog = () => {
    setSelectedAlgorithm(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: "100%" }}>
      {/* Header simplifié */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
          borderRadius: 2,
          border: `1px solid ${theme.palette.primary.main}30`,
        }}
      >
        <CognitiveIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            🧠 Fluidité Cognitive - Tableau de Résultats
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comparaison des algorithmes par famille de stratégies
          </Typography>
        </Box>
      </Box>

      {/* Tableau principal des résultats */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow
              sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <TableCell>
                <Typography variant="subtitle1" fontWeight="bold">
                  Algorithme
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  REFLET
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  ENGAGEMENT
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  EXPLICATION
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  OUVERTURE
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  Détails
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((row, index) => (
              <TableRow
                key={row.algorithm}
                sx={{
                  backgroundColor:
                    index % 2 === 1
                      ? alpha(theme.palette.grey[100], 0.5)
                      : "transparent",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {row.algorithm}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${row.reflet.toFixed(1)}%`}
                    sx={{
                      backgroundColor: alpha(getScoreColor(row.reflet), 0.2),
                      color: getScoreColor(row.reflet),
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${row.engagement.toFixed(1)}%`}
                    sx={{
                      backgroundColor: alpha(
                        getScoreColor(row.engagement),
                        0.2
                      ),
                      color: getScoreColor(row.engagement),
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${row.explication.toFixed(1)}%`}
                    sx={{
                      backgroundColor: alpha(
                        getScoreColor(row.explication),
                        0.2
                      ),
                      color: getScoreColor(row.explication),
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${row.ouverture.toFixed(1)}%`}
                    sx={{
                      backgroundColor: alpha(getScoreColor(row.ouverture), 0.2),
                      color: getScoreColor(row.ouverture),
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleAlgorithmInfo(row.algorithm)}
                    sx={{
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <InfoIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Légende des couleurs */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: theme.palette.success.main,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption">≥ 80% - Excellent</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: theme.palette.warning.main,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption">70-79% - Bon</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: theme.palette.error.main,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption">{"<"} 70% - À améliorer</Typography>
        </Box>
      </Box>

      {/* Pop-up de détail de l'algorithme */}
      <Dialog
        open={Boolean(selectedAlgorithm)}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedAlgorithm && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pb: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CognitiveIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  {selectedAlgorithm.name} - Détails de l'Algorithme
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDialog} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📋 Description
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedAlgorithm.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🔬 Principe Scientifique
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedAlgorithm.principle}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📚 Source Scientifique
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                  }}
                >
                  <Typography variant="body2" fontStyle="italic">
                    {selectedAlgorithm.source}
                  </Typography>
                </Paper>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDialog} variant="contained">
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FluiditeCognitiveInterface;
