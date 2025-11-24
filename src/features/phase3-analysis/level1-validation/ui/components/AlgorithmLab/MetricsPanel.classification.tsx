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
import type { TVValidationResult } from "./ResultsSample/types";

type SimpleMetrics = {
  accuracy: number;
  correct: number;
  total: number;
  avgProcessingTime: number;
  avgConfidence: number;
  kappa?: number;
};

export default function MetricsPanelClassification({
  classifierLabel,
  results,
}: {
  classifierLabel?: string;
  results: TVValidationResult[];
}) {
  const theme = useTheme();

  const metrics = useMemo(() => {
    if (!results.length) return null;

    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const accuracy = (correct / total) * 100;
    const avgProcessingTime =
      results.reduce((s, r) => s + (r.processingTime || 0), 0) / total;
    const avgConfidence = results.reduce((s, r) => s + (r.confidence ?? 0), 0) / total;
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

    return { summary, precision, recall, f1Score, classes: classes.sort() };
  }, [results]);

  if (!results.length || !metrics) {
    return null;
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          <StatTile title="Accuracy" value={`${summary.accuracy}%`} />
          <StatTile
            title="Classifications Correctes"
            value={`${summary.correct}/${summary.total}`}
          />
          <StatTile
            title="Temps Moyen"
            value={`${summary.avgProcessingTime}ms`}
          />
          <StatTile
            title="Confiance Moyenne"
            value={`${summary.avgConfidence}`}
          />
          <StatTile
            title="Kappa (Cohen)"
            value={summary.kappa?.toFixed(3) ?? "—"}
            color="success.main"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

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

        {typeof summary.kappa === "number" && (
          <Alert
            severity={getKappaInterpretation(summary.kappa).severity}
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              <strong>Interprétation:</strong>{" "}
              {getKappaInterpretation(summary.kappa).text} (κ=
              {summary.kappa.toFixed(3)})
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({
  title,
  value,
  color,
}: {
  title: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <Box
      sx={{
        textAlign: "center",
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700 }} color={color}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
  );
}
