// src/app/(protected)/analysis/components/shared/molecules/AlgorithmSelector.tsx

import React from "react";
import { Box, Paper, Typography, useTheme, alpha } from "@mui/material";
import { Psychology } from "@mui/icons-material";
import { AlgorithmChip } from "./atoms/AlgorithmChip";

interface Algorithm {
  id: string;
  name: string;
  description: string;
  differential: number;
  time: number;
  accuracy: number;
}

interface AlgorithmSelectorProps {
  algorithms: Algorithm[];
  selectedAlgorithm: string;
  onAlgorithmChange: (algorithmId: string) => void;
  variant?: "compact" | "detailed";
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  algorithms,
  selectedAlgorithm,
  onAlgorithmChange,
  variant = "compact",
}) => {
  const theme = useTheme();

  // Styles adaptatifs pour le thème dark/light
  const getAdaptiveStyles = () => ({
    container: {
      p: 3,
      mb: 3,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.grey[50], 0.9),
      border: `1px solid ${
        theme.palette.mode === "dark"
          ? alpha(theme.palette.primary.main, 0.3)
          : alpha(theme.palette.primary.main, 0.2)
      }`,
      borderRadius: 2,
      backdropFilter: "blur(10px)",
      transition: "all 0.3s ease-in-out",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 2,
      mb: 2,
      color:
        theme.palette.mode === "dark"
          ? theme.palette.primary.light
          : theme.palette.primary.main,
    },
    algorithmContainer: {
      display: "flex",
      gap: 1,
      flexWrap: "wrap" as const,
      alignItems: "center",
    },
  });

  const styles = getAdaptiveStyles();

  if (variant === "detailed") {
    return (
      <Paper sx={styles.container}>
        <Box sx={styles.header}>
          <Psychology sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              🔬 Sélection de l'Algorithme d'Analyse
            </Typography>
            <Typography
              variant="caption"
              color={
                theme.palette.mode === "dark"
                  ? "text.secondary"
                  : "text.secondary"
              }
            >
              Choisissez l'approche d'analyse cognitive
            </Typography>
          </Box>
        </Box>

        <Box sx={styles.algorithmContainer}>
          <Typography variant="body2" sx={{ mr: 2, fontWeight: "medium" }}>
            Algorithmes disponibles:
          </Typography>
          {algorithms.map((alg) => (
            <AlgorithmChip
              key={alg.id}
              id={alg.id}
              name={alg.name}
              description={alg.description}
              accuracy={alg.accuracy}
              differential={alg.differential}
              time={alg.time}
              isSelected={selectedAlgorithm === alg.id}
              onClick={() => onAlgorithmChange(alg.id)}
            />
          ))}
        </Box>

        {/* Informations détaillées sur l'algorithme sélectionné */}
        {(() => {
          const selected = algorithms.find(
            (alg) => alg.id === selectedAlgorithm
          );
          if (!selected) return null;

          return (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📋 Algorithme actuel: {selected.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selected.description}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                <Typography variant="caption">⚡ {selected.time}ms</Typography>
                <Typography variant="caption">
                  🎯 {selected.accuracy}% précision
                </Typography>
                <Typography variant="caption">
                  📈 +{selected.differential}% différentiel
                </Typography>
              </Box>
            </Box>
          );
        })()}
      </Paper>
    );
  }

  // Vue compacte
  return (
    <Paper sx={styles.container}>
      <Box sx={styles.header}>
        <Psychology sx={{ fontSize: 24 }} />
        <Typography variant="subtitle1" fontWeight="bold">
          🔬 Algorithme d'Analyse
        </Typography>
      </Box>

      <Box sx={styles.algorithmContainer}>
        <Typography
          variant="body2"
          sx={{
            mr: 1,
            color:
              theme.palette.mode === "dark"
                ? theme.palette.text.secondary
                : theme.palette.text.primary,
          }}
        >
          Algorithme:
        </Typography>
        {algorithms.map((alg) => (
          <AlgorithmChip
            key={alg.id}
            id={alg.id}
            name={alg.name}
            description={alg.description}
            accuracy={alg.accuracy}
            differential={alg.differential}
            time={alg.time}
            isSelected={selectedAlgorithm === alg.id}
            onClick={() => onAlgorithmChange(alg.id)}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default AlgorithmSelector;
