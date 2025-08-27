// components/AlgorithmLab/components/Level1/individual/TechnicalValidation/MetricsPanel.tsx

import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  alpha,
  useTheme,
  Divider,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useLevel1Testing } from "../../../../hooks/useLevel1Testing";
import type { TVValidationResult } from "./ResultsSample";

export type SimpleMetrics = {
  accuracy: number; // %
  correct: number;
  total: number;
  avgProcessingTime: number; // ms
  avgConfidence: number; // 0..1
  kappa?: number;
};

type MetricsPanelProps = {
  classifierLabel?: string; // ex: "Regex Conseiller Classifier"
  results: TVValidationResult[]; // résultats bruts du test
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  classifierLabel,
  results,
}) => {
  const theme = useTheme();
  const { calculateMetrics } = useLevel1Testing();

  const summary = useMemo(() => {
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;

    const m = calculateMetrics(results as any);
    const sm: SimpleMetrics = {
      accuracy: m.accuracy, // déjà en %
      correct,
      total,
      avgProcessingTime: m.avgProcessingTime,
      avgConfidence: m.avgConfidence,
      kappa: m.kappa,
    };
    return { m, sm };
  }, [results, calculateMetrics]);

  if (!results.length) return null;

  const { m, sm } = summary;

  const f1Color = (f1: number) =>
    f1 > 0.8 ? "success.main" : f1 > 0.6 ? "warning.main" : "error.main";

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <AssessmentIcon />
          Métriques de Performance
          {classifierLabel ? ` - ${classifierLabel}` : ""}
        </Typography>

        {/* Tuiles synthèse */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 2 }}>
          <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {sm.accuracy.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accuracy
            </Typography>
          </Box>

          <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {sm.correct}/{sm.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Classifications Correctes
            </Typography>
          </Box>

          <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {sm.avgProcessingTime}ms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Temps de Traitement Moyen
            </Typography>
          </Box>

          <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {sm.avgConfidence.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confiance Moyenne
            </Typography>
          </Box>

          {typeof sm.kappa === "number" && (
            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography
                variant="h4"
                color="success.main"
                sx={{ fontWeight: 700 }}
              >
                {sm.kappa.toFixed(3)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kappa (Cohen)
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tableau par tag */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
          Métriques par Tag
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Tag</strong>
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
              {Object.keys(m.precision).map((cls) => (
                <TableRow key={cls}>
                  <TableCell>
                    <Chip
                      label={cls}
                      size="small"
                      variant="outlined"
                      sx={{
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                        borderColor: theme.palette.primary.main,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {(m.precision[cls] * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    {(m.recall[cls] * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        color: f1Color(m.f1Score[cls]),
                        fontWeight: 700,
                      }}
                    >
                      {(m.f1Score[cls] * 100).toFixed(1)}%
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Interprétation kappa si présent */}
        {typeof sm.kappa === "number" && (
          <Alert
            severity={
              sm.kappa > 0.7 ? "success" : sm.kappa > 0.4 ? "warning" : "error"
            }
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              <strong>Interprétation&nbsp;:</strong>{" "}
              {sm.kappa > 0.7
                ? `Accord substantiel (κ=${sm.kappa.toFixed(
                    3
                  )}) - Performance validée`
                : sm.kappa > 0.4
                ? `Accord modéré (κ=${sm.kappa.toFixed(
                    3
                  )}) - Optimisation requise`
                : `Accord faible (κ=${sm.kappa.toFixed(
                    3
                  )}) - Révision algorithmique nécessaire`}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
