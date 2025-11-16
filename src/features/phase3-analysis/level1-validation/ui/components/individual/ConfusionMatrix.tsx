// components/Level1/ConfusionMatrix.tsx
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import { ValidationMetrics } from "@/types/algorithm-lab";

interface ConfusionMatrixProps {
  metrics: ValidationMetrics | null;
  title?: string;
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  metrics,
  title = "Matrice de Confusion",
}) => {
  const theme = useTheme();

  if (!metrics || !metrics.confusionMatrix) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          Aucune matrice de confusion disponible
        </Typography>
      </Paper>
    );
  }

  const classes = Object.keys(metrics.confusionMatrix);
  const maxValue = Math.max(
    ...classes.flatMap((predicted) =>
      classes.map((actual) => metrics.confusionMatrix[predicted][actual] || 0)
    )
  );

  const getIntensityColor = (value: number, isCorrect: boolean) => {
    const intensity = maxValue > 0 ? value / maxValue : 0;

    if (isCorrect) {
      return alpha(theme.palette.success.main, 0.1 + intensity * 0.7);
    } else {
      return alpha(theme.palette.error.main, 0.1 + intensity * 0.7);
    }
  };

  const getCellTextColor = (value: number, isCorrect: boolean) => {
    const intensity = maxValue > 0 ? value / maxValue : 0;

    if (intensity > 0.5) {
      return isCorrect
        ? theme.palette.success.contrastText
        : theme.palette.error.contrastText;
    }
    return theme.palette.text.primary;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Lignes: Prédictions | Colonnes: Valeurs Réelles
      </Typography>

      <TableContainer>
        <Table size="small" sx={{ minWidth: 400 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: theme.palette.grey[50],
                }}
              >
                Prédit \ Réel
              </TableCell>
              {classes.map((cls) => (
                <TableCell
                  key={cls}
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: theme.palette.grey[50],
                    minWidth: 80,
                  }}
                >
                  {cls}
                </TableCell>
              ))}
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                }}
              >
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((predictedClass) => {
              const rowTotal = classes.reduce(
                (sum, actualClass) =>
                  sum +
                  (metrics.confusionMatrix[predictedClass][actualClass] || 0),
                0
              );

              return (
                <TableRow key={predictedClass}>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.grey[50],
                    }}
                  >
                    {predictedClass}
                  </TableCell>
                  {classes.map((actualClass) => {
                    const value =
                      metrics.confusionMatrix[predictedClass][actualClass] || 0;
                    const isCorrect = predictedClass === actualClass;
                    const percentage =
                      rowTotal > 0
                        ? ((value / rowTotal) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <TableCell
                        key={actualClass}
                        align="center"
                        sx={{
                          backgroundColor: getIntensityColor(value, isCorrect),
                          color: getCellTextColor(value, isCorrect),
                          fontWeight: isCorrect ? "bold" : "normal",
                          border: isCorrect
                            ? `2px solid ${theme.palette.success.main}`
                            : undefined,
                        }}
                      >
                        <Tooltip
                          title={`${predictedClass} → ${actualClass}: ${value} occurrences (${percentage}%)`}
                          arrow
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "inherit" }}
                            >
                              {value}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                opacity: 0.8,
                                fontSize: "0.7rem",
                              }}
                            >
                              {percentage}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    {rowTotal}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Ligne des totaux par colonne */}
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                }}
              >
                Total
              </TableCell>
              {classes.map((actualClass) => {
                const colTotal = classes.reduce(
                  (sum, predictedClass) =>
                    sum +
                    (metrics.confusionMatrix[predictedClass][actualClass] || 0),
                  0
                );
                return (
                  <TableCell
                    key={actualClass}
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    {colTotal}
                  </TableCell>
                );
              })}
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }}
              >
                {metrics.totalSamples}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Légende */}
      <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: alpha(theme.palette.success.main, 0.7),
              border: `1px solid ${theme.palette.success.main}`,
            }}
          />
          <Typography variant="caption">Prédictions Correctes</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: alpha(theme.palette.error.main, 0.7),
            }}
          />
          <Typography variant="caption">Erreurs de Classification</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Intensité proportionnelle au nombre d'occurrences
        </Typography>
      </Box>
    </Paper>
  );
};
