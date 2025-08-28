"use client";
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

// Types locaux pour éviter la dépendance au hook externe
export type SimpleMetrics = {
  accuracy: number;
  correct: number;
  total: number;
  avgProcessingTime: number;
  avgConfidence: number;
  kappa?: number;
};

export interface TVValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: Record<string, any>;
}

type MetricsPanelProps = {
  classifierLabel?: string;
  results: TVValidationResult[];
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  classifierLabel,
  results,
}) => {
  const theme = useTheme();

  // ✅ SOLUTION : TOUS les hooks d'abord, sans conditions
  const metrics = useMemo(() => {
    // Guard à l'intérieur du useMemo
    if (!results.length) return null;

    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const accuracy = (correct / total) * 100;

    const avgProcessingTime =
      results.reduce((s, r) => s + (r.processingTime || 0), 0) / total;
    const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / total;

    // Calcul des métriques par classe
    const classes = Array.from(
      new Set([
        ...results.map((r) => r.goldStandard),
        ...results.map((r) => r.predicted),
      ])
    );

    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1Score: Record<string, number> = {};

    classes.forEach((cls) => {
      const tp = results.filter(
        (r) => r.predicted === cls && r.goldStandard === cls
      ).length;
      const fp = results.filter(
        (r) => r.predicted === cls && r.goldStandard !== cls
      ).length;
      const fn = results.filter(
        (r) => r.predicted !== cls && r.goldStandard === cls
      ).length;

      precision[cls] = tp + fp > 0 ? tp / (tp + fp) : 0;
      recall[cls] = tp + fn > 0 ? tp / (tp + fn) : 0;
      f1Score[cls] =
        precision[cls] + recall[cls] > 0
          ? (2 * precision[cls] * recall[cls]) / (precision[cls] + recall[cls])
          : 0;
    });

    // Calcul Kappa de Cohen simplifié
    const expectedAccuracy = classes.reduce((sum, cls) => {
      const actualCount = results.filter((r) => r.goldStandard === cls).length;
      const predictedCount = results.filter((r) => r.predicted === cls).length;
      return sum + (actualCount * predictedCount) / (total * total);
    }, 0);

    const kappa =
      expectedAccuracy < 1
        ? (accuracy / 100 - expectedAccuracy) / (1 - expectedAccuracy)
        : 0;

    const summary: SimpleMetrics = {
      accuracy: Number(accuracy.toFixed(1)),
      correct,
      total,
      avgProcessingTime: Math.round(avgProcessingTime),
      avgConfidence: Number(avgConfidence.toFixed(2)),
      kappa: Number(kappa.toFixed(3)),
    };

    return {
      summary,
      precision,
      recall,
      f1Score,
      classes: classes.sort(),
    };
  }, [results]);

  // ✅ Guard APRÈS tous les hooks
  if (!results.length || !metrics) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Aucune donnée de métrique disponible
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { summary, precision, recall, f1Score, classes } = metrics;

  const getF1Color = (f1: number) =>
    f1 > 0.8 ? "success.main" : f1 > 0.6 ? "warning.main" : "error.main";

  const getKappaInterpretation = (kappa: number) => {
    if (kappa > 0.7)
      return { severity: "success" as const, text: "Accord substantiel" };
    if (kappa > 0.4)
      return { severity: "warning" as const, text: "Accord modéré" };
    return { severity: "error" as const, text: "Accord faible" };
  };

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
          {classifierLabel && ` - ${classifierLabel}`}
        </Typography>

        {/* Tuiles synthèse */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {summary.accuracy}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accuracy
            </Typography>
          </Box>

          <Box
            sx={{
              textAlign: "center",
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {summary.correct}/{summary.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Classifications Correctes
            </Typography>
          </Box>

          <Box
            sx={{
              textAlign: "center",
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {summary.avgProcessingTime}ms
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Temps Moyen
            </Typography>
          </Box>

          <Box
            sx={{
              textAlign: "center",
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {summary.avgConfidence}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confiance Moyenne
            </Typography>
          </Box>

          {typeof summary.kappa === "number" && (
            <Box
              sx={{
                textAlign: "center",
                p: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="h4"
                color="success.main"
                sx={{ fontWeight: 700 }}
              >
                {summary.kappa.toFixed(3)}
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
              {classes.map((cls) => (
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
                    {((precision[cls] || 0) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    {((recall[cls] || 0) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        color: getF1Color(f1Score[cls] || 0),
                        fontWeight: 700,
                      }}
                    >
                      {((f1Score[cls] || 0) * 100).toFixed(1)}%
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Interprétation kappa */}
        {typeof summary.kappa === "number" && (
          <Alert
            severity={getKappaInterpretation(summary.kappa).severity}
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              <strong>Interprétation:</strong>{" "}
              {getKappaInterpretation(summary.kappa).text} (κ=
              {summary.kappa.toFixed(3)}) -
              {summary.kappa > 0.7
                ? " Performance validée"
                : summary.kappa > 0.4
                ? " Optimisation requise"
                : " Révision algorithmique nécessaire"}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
