// components/Level1/TechnicalBenchmark.tsx
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Divider,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { TrendingUp, TrendingDown, Timeline } from "@mui/icons-material";
import { ValidationMetrics, AlgorithmResult } from "../../types/Level1Types";

interface BenchmarkData {
  algorithmName: string;
  type: "conseiller" | "client";
  metrics: ValidationMetrics;
  sampleSize: number;
  executionTime: number;
}

interface TechnicalBenchmarkProps {
  benchmarkResults: BenchmarkData[];
  title?: string;
}

export const TechnicalBenchmark: React.FC<TechnicalBenchmarkProps> = ({
  benchmarkResults,
  title = "Comparaison Multi-Algorithmes",
}) => {
  const theme = useTheme();

  if (!benchmarkResults.length) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          Aucun benchmark disponible. Lancez plusieurs tests pour comparer les
          performances.
        </Typography>
      </Paper>
    );
  }

  const getBestPerformer = (metric: "accuracy" | "kappa") => {
    return benchmarkResults.reduce((best, current) =>
      current.metrics[metric] > best.metrics[metric] ? current : best
    );
  };

  const getWorstPerformer = (metric: "accuracy" | "kappa") => {
    return benchmarkResults.reduce((worst, current) =>
      current.metrics[metric] < worst.metrics[metric] ? current : worst
    );
  };

  const bestAccuracy = getBestPerformer("accuracy");
  const worstAccuracy = getWorstPerformer("accuracy");
  const bestKappa = getBestPerformer("kappa");

  const renderPerformanceCard = (data: BenchmarkData, rank: number) => {
    const isWinner = rank === 1;
    const avgF1 =
      Object.values(data.metrics.f1Score).reduce((a, b) => a + b, 0) /
      Object.values(data.metrics.f1Score).length;

    return (
      <Card
        key={data.algorithmName}
        sx={{
          border: isWinner
            ? `2px solid ${theme.palette.success.main}`
            : undefined,
          position: "relative",
          backgroundColor: isWinner
            ? alpha(theme.palette.success.main, 0.05)
            : undefined,
        }}
      >
        {isWinner && (
          <Chip
            label="MEILLEUR"
            size="small"
            color="success"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          />
        )}

        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {data.algorithmName === "conseiller_classification"
                ? "Classification Conseiller"
                : "Classification Client"}
            </Typography>
            <Chip
              label={data.type}
              size="small"
              color={data.type === "conseiller" ? "primary" : "secondary"}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 120px", textAlign: "center" }}>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                {(data.metrics.accuracy * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accuracy
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 120px", textAlign: "center" }}>
              <Typography
                variant="h4"
                color="success.main"
                sx={{ fontWeight: "bold" }}
              >
                {data.metrics.kappa.toFixed(3)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kappa Cohen
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 120px", textAlign: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {(avgF1 * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                F1-Score Moyen
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 120px", textAlign: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {data.sampleSize}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Échantillons
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            <strong>Classes détectées:</strong>{" "}
            {Object.keys(data.metrics.precision).length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Prédictions correctes:</strong>{" "}
            {data.metrics.correctPredictions}/{data.metrics.totalSamples}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderComparisonTable = () => (
    <Paper sx={{ mt: 3 }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Tableau Comparatif Détaillé
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Algorithme</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Type</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Accuracy</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Kappa</strong>
              </TableCell>
              <TableCell align="center">
                <strong>F1 Moyen</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Échantillons</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Statut</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {benchmarkResults
              .sort((a, b) => b.metrics.accuracy - a.metrics.accuracy)
              .map((data, index) => {
                const avgF1 =
                  Object.values(data.metrics.f1Score).reduce(
                    (a, b) => a + b,
                    0
                  ) / Object.values(data.metrics.f1Score).length;
                const isTop = index === 0;
                const isAcceptable = data.metrics.kappa > 0.7;

                return (
                  <TableRow
                    key={data.algorithmName}
                    sx={{
                      backgroundColor: isTop
                        ? alpha(theme.palette.success.main, 0.1)
                        : undefined,
                    }}
                  >
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: isTop ? "bold" : "normal" }}
                      >
                        {data.algorithmName === "conseiller_classification"
                          ? "Classification Conseiller"
                          : "Classification Client"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={data.type}
                        size="small"
                        color={
                          data.type === "conseiller" ? "primary" : "secondary"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            data.metrics.accuracy > 0.8
                              ? "success.main"
                              : data.metrics.accuracy > 0.6
                              ? "warning.main"
                              : "error.main",
                        }}
                      >
                        {(data.metrics.accuracy * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            data.metrics.kappa > 0.7
                              ? "success.main"
                              : data.metrics.kappa > 0.4
                              ? "warning.main"
                              : "error.main",
                        }}
                      >
                        {data.metrics.kappa.toFixed(3)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {(avgF1 * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell align="center">
                      {data.sampleSize.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          isAcceptable
                            ? "VALIDÉ"
                            : data.metrics.kappa > 0.4
                            ? "ACCEPTABLE"
                            : "ÉCHEC"
                        }
                        size="small"
                        color={
                          isAcceptable
                            ? "success"
                            : data.metrics.kappa > 0.4
                            ? "warning"
                            : "error"
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderInsightsPanel = () => (
    <Paper sx={{ mt: 3, p: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Timeline />
        Insights de Performance
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ flex: "1 1 300px" }}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.success.main}`,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.success.main, 0.05),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingUp sx={{ color: "success.main" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Meilleure Performance
              </Typography>
            </Box>
            <Typography variant="body2">
              <strong>
                {bestAccuracy.algorithmName === "conseiller_classification"
                  ? "Classification Conseiller"
                  : "Classification Client"}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accuracy: {(bestAccuracy.metrics.accuracy * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Kappa: {bestAccuracy.metrics.kappa.toFixed(3)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: "1 1 300px" }}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.error.main}`,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.error.main, 0.05),
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingDown sx={{ color: "error.main" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Performance la Plus Faible
              </Typography>
            </Box>
            <Typography variant="body2">
              <strong>
                {worstAccuracy.algorithmName === "conseiller_classification"
                  ? "Classification Conseiller"
                  : "Classification Client"}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accuracy: {(worstAccuracy.metrics.accuracy * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Écart:{" "}
              {(
                (bestAccuracy.metrics.accuracy -
                  worstAccuracy.metrics.accuracy) *
                100
              ).toFixed(1)}{" "}
              points
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: "1 1 300px" }}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.info.main}`,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.info.main, 0.05),
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              Recommandations
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {bestKappa.metrics.kappa > 0.7
                ? "Performance technique validée pour usage scientifique"
                : "Optimisation nécessaire avant validation"}
            </Typography>
            {benchmarkResults.length > 1 && (
              <Typography variant="body2" color="text.secondary">
                Différence significative détectée entre algorithmes
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );

  const sortedResults = benchmarkResults.sort(
    (a, b) => b.metrics.accuracy - a.metrics.accuracy
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Comparaison des performances de {benchmarkResults.length} algorithme(s)
        sur les mêmes données
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {sortedResults.map((data, index) => (
          <Box key={data.algorithmName} sx={{ flex: "1 1 400px" }}>
            {renderPerformanceCard(data, index + 1)}
          </Box>
        ))}
      </Box>

      {renderComparisonTable()}
      {renderInsightsPanel()}
    </Box>
  );
};

export default TechnicalBenchmark;
