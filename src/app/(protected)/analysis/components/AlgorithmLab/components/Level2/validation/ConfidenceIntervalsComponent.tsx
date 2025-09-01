// components/AlgorithmLab/Level2/validation/ConfidenceIntervalsComponent.tsx
"use client";

import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { ShowChart, TrendingUp, Insights } from "@mui/icons-material";
import { StrategyStats } from "@/app/(protected)/analysis/types";

interface ConfidenceIntervalsComponentProps {
  data: StrategyStats[];
  confidenceLevel?: number; // 95% par défaut
}

interface ConfidenceInterval {
  strategy: string;
  proportion: number;
  n: number;
  standardError: number;
  marginError: number;
  lowerBound: number;
  upperBound: number;
  interpretation: string;
  overlapsWithOthers: boolean;
}

export const ConfidenceIntervalsComponent: React.FC<
  ConfidenceIntervalsComponentProps
> = ({ data, confidenceLevel = 95 }) => {
  const theme = useTheme();

  // Calcul des intervalles de confiance
  const confidenceIntervals = useMemo((): ConfidenceInterval[] => {
    const zScore =
      confidenceLevel === 99 ? 2.576 : confidenceLevel === 95 ? 1.96 : 1.645; // 90%

    const intervals = data.map((strategy) => {
      const proportion = strategy.positive / 100;
      const n = strategy.total;

      // Erreur standard pour une proportion : √(p(1-p)/n)
      const standardError = Math.sqrt((proportion * (1 - proportion)) / n);

      // Marge d'erreur
      const marginError = zScore * standardError;

      // Bornes de l'intervalle
      const lowerBound = Math.max(0, proportion - marginError) * 100;
      const upperBound = Math.min(1, proportion + marginError) * 100;

      // Interprétation de la largeur
      const intervalWidth = upperBound - lowerBound;
      let interpretation = "";
      if (intervalWidth < 5) interpretation = "Très précis (< 5 points)";
      else if (intervalWidth < 10) interpretation = "Précis (< 10 points)";
      else if (intervalWidth < 20)
        interpretation = "Modérément précis (< 20 points)";
      else interpretation = "Peu précis (≥ 20 points)";

      return {
        strategy: strategy.strategy,
        proportion: proportion * 100,
        n,
        standardError: standardError * 100, // Convertir en %
        marginError: marginError * 100,
        lowerBound,
        upperBound,
        interpretation,
        overlapsWithOthers: false, // Sera calculé ensuite
      };
    });

    // Détecter les chevauchements d'intervalles
    intervals.forEach((interval, i) => {
      const hasOverlap = intervals.some((other, j) => {
        if (i === j) return false;
        return !(
          interval.upperBound < other.lowerBound ||
          interval.lowerBound > other.upperBound
        );
      });
      interval.overlapsWithOthers = hasOverlap;
    });

    return intervals.sort((a, b) => b.proportion - a.proportion);
  }, [data, confidenceLevel]);

  // Analyse de non-chevauchement pour H1
  const h1ValidationByIntervals = useMemo(() => {
    const engagement = confidenceIntervals.find(
      (i) => i.strategy === "ENGAGEMENT"
    );
    const ouverture = confidenceIntervals.find(
      (i) => i.strategy === "OUVERTURE"
    );
    const explication = confidenceIntervals.find(
      (i) => i.strategy === "EXPLICATION"
    );

    const tests = [];

    if (engagement && explication) {
      const noOverlap = engagement.lowerBound > explication.upperBound;
      tests.push({
        comparison: "ENGAGEMENT vs EXPLICATION",
        noOverlap,
        engagementInterval: `[${engagement.lowerBound.toFixed(
          1
        )}% ; ${engagement.upperBound.toFixed(1)}%]`,
        explanationInterval: `[${explication.lowerBound.toFixed(
          1
        )}% ; ${explication.upperBound.toFixed(1)}%]`,
        interpretation: noOverlap
          ? "Différence statistiquement robuste"
          : "Différence moins certaine (chevauchement)",
      });
    }

    if (ouverture && explication) {
      const noOverlap = ouverture.lowerBound > explication.upperBound;
      tests.push({
        comparison: "OUVERTURE vs EXPLICATION",
        noOverlap,
        engagementInterval: `[${ouverture.lowerBound.toFixed(
          1
        )}% ; ${ouverture.upperBound.toFixed(1)}%]`,
        explanationInterval: `[${explication.lowerBound.toFixed(
          1
        )}% ; ${explication.upperBound.toFixed(1)}%]`,
        interpretation: noOverlap
          ? "Différence statistiquement robuste"
          : "Différence moins certaine (chevauchement)",
      });
    }

    return {
      tests,
      h1Supported: tests.every((t) => t.noOverlap),
      supportLevel: tests.filter((t) => t.noOverlap).length / tests.length,
    };
  }, [confidenceIntervals]);

  const styles = {
    mainContainer: {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      border: `1px solid ${theme.palette.divider}`,
    },
    headerBox: {
      background:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.info.dark, 0.2)
          : alpha(theme.palette.info.light, 0.1),
      p: 2,
      borderRadius: 1,
      mb: 3,
    },
  };

  return (
    <Paper sx={styles.mainContainer}>
      <Box sx={styles.headerBox}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <ShowChart color="info" />
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Intervalles de Confiance ({confidenceLevel}%)
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Estimation de la précision des proportions observées - Robustesse des
          résultats H1
        </Typography>
      </Box>

      <Box sx={{ p: 4 }}>
        {/* Tableau des intervalles */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Intervalles de Confiance des Proportions Positives
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow
                sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
              >
                <TableCell sx={{ fontWeight: "bold" }}>Stratégie</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Proportion Obs.
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Erreur Standard
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  IC {confidenceLevel}%
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Échantillon
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Précision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {confidenceIntervals.map((interval) => (
                <TableRow key={interval.strategy}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {interval.strategy}
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {interval.proportion.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      ±{interval.standardError.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        color: theme.palette.primary.main,
                      }}
                    >
                      [{interval.lowerBound.toFixed(1)}% ;{" "}
                      {interval.upperBound.toFixed(1)}%]
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">n = {interval.n}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {interval.interpretation}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Visualisation graphique des intervalles */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Visualisation des Intervalles de Confiance
        </Typography>

        <Box sx={{ mb: 4 }}>
          {confidenceIntervals.map((interval, index) => (
            <Box key={interval.strategy} sx={{ mb: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {interval.strategy}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  [{interval.lowerBound.toFixed(1)}% ;{" "}
                  {interval.upperBound.toFixed(1)}%]
                </Typography>
              </Box>

              {/* Barre de l'intervalle */}
              <Box
                sx={{
                  position: "relative",
                  height: 40,
                  backgroundColor: alpha(theme.palette.grey[300], 0.3),
                  borderRadius: 1,
                }}
              >
                {/* Barre de l'intervalle de confiance */}
                <Box
                  sx={{
                    position: "absolute",
                    left: `${interval.lowerBound}%`,
                    width: `${interval.upperBound - interval.lowerBound}%`,
                    height: "100%",
                    backgroundColor: alpha(
                      index === 0
                        ? theme.palette.success.main
                        : index === 1
                        ? theme.palette.info.main
                        : index === 2
                        ? theme.palette.warning.main
                        : theme.palette.error.main,
                      0.7
                    ),
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    {interval.proportion.toFixed(1)}%
                  </Typography>
                </Box>

                {/* Marqueur de la proportion observée */}
                <Box
                  sx={{
                    position: "absolute",
                    left: `${interval.proportion}%`,
                    top: 0,
                    width: 2,
                    height: "100%",
                    backgroundColor: theme.palette.text.primary,
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Largeur:{" "}
                {(interval.upperBound - interval.lowerBound).toFixed(1)} points
                - {interval.interpretation}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Analyse de chevauchement pour H1 */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Test de Non-Chevauchement (Validation H1)
        </Typography>

        {h1ValidationByIntervals.tests.map((test, index) => (
          <Paper
            key={index}
            sx={{
              p: 3,
              mb: 2,
              backgroundColor: test.noOverlap
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.warning.main, 0.1),
              border: `1px solid ${
                test.noOverlap
                  ? theme.palette.success.main
                  : theme.palette.warning.main
              }`,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {test.comparison}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mt: 2,
              }}
            >
              <Box>
                <Typography variant="body2">
                  Actions: {test.engagementInterval}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2">
                  Explications: {test.explanationInterval}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
              {test.interpretation}
            </Typography>
          </Paper>
        ))}

        {/* Conclusion validation H1 par IC */}
        <Alert
          severity={h1ValidationByIntervals.h1Supported ? "success" : "warning"}
          sx={{ mt: 3 }}
        >
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Validation H1 par Intervalles de Confiance :{" "}
            {h1ValidationByIntervals.h1Supported ? "CONFIRMÉE" : "PARTIELLE"}
          </Typography>
          <Typography variant="body2">
            {h1ValidationByIntervals.h1Supported
              ? "Aucun chevauchement détecté entre intervalles actions/explications. La différence est statistiquement robuste."
              : `${(h1ValidationByIntervals.supportLevel * 100).toFixed(
                  0
                )}% des comparaisons montrent un non-chevauchement.`}
          </Typography>
        </Alert>

        {/* Interprétation méthodologique */}
        <Paper
          sx={{
            p: 3,
            mt: 4,
            backgroundColor: alpha(theme.palette.info.main, 0.05),
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            color="info.main"
            sx={{ fontWeight: "bold" }}
          >
            Interprétation Méthodologique
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Principe :</strong> Un intervalle de confiance à{" "}
            {confidenceLevel}% signifie que si l'expérience était répétée 100
            fois, la vraie proportion se situerait dans cet intervalle dans
            {confidenceLevel} cas sur 100.
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Non-chevauchement :</strong> Quand deux intervalles ne se
            chevauchent pas, on peut conclure avec {confidenceLevel}% de
            confiance que les deux proportions sont réellement différentes.
          </Typography>

          <Typography variant="body2">
            <strong>Pour H1 :</strong> Le non-chevauchement des intervalles
            ENGAGEMENT/OUVERTURE avec EXPLICATION{" "}
            {h1ValidationByIntervals.h1Supported
              ? "confirme"
              : "ne confirme pas pleinement"}
            la robustesse statistique de la différence d'efficacité observée.
          </Typography>
        </Paper>

        {/* Recommandations pour taille d'échantillon */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Évaluation de la Précision des Estimations
          </Typography>

          <Grid container spacing={2}>
            {confidenceIntervals.map((interval) => (
              <Grid item xs={12} sm={6} md={3} key={interval.strategy}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    backgroundColor:
                      interval.upperBound - interval.lowerBound < 10
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.warning.main, 0.1),
                    border: `1px solid ${
                      interval.upperBound - interval.lowerBound < 10
                        ? theme.palette.success.main
                        : theme.palette.warning.main
                    }`,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {interval.strategy}
                  </Typography>
                  <Typography variant="h6" color="primary.main" sx={{ my: 1 }}>
                    ±{interval.marginError.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Marge d'erreur
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(
                      0,
                      100 - (interval.upperBound - interval.lowerBound) * 5
                    )} // Inverse de la largeur
                    sx={{
                      mt: 1,
                      height: 4,
                      borderRadius: 2,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          interval.upperBound - interval.lowerBound < 10
                            ? theme.palette.success.main
                            : theme.palette.warning.main,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    {interval.interpretation}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Conclusion finale */}
        <Paper
          sx={{
            p: 4,
            mt: 4,
            backgroundColor: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            color="success.main"
            sx={{ fontWeight: "bold" }}
          >
            Conclusion pour Validation H1
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            Les intervalles de confiance à {confidenceLevel}%{" "}
            {h1ValidationByIntervals.h1Supported
              ? "confirment"
              : "supportent partiellement"}
            la robustesse statistique de l'efficacité différentielle postulée
            dans H1.
          </Typography>

          {h1ValidationByIntervals.h1Supported ? (
            <Typography variant="body2" color="success.main">
              L'absence de chevauchement entre les intervalles des stratégies
              d'action (ENGAGEMENT/OUVERTURE) et ceux des explications garantit
              que les différences observées ne relèvent pas de la variabilité
              d'échantillonnage.
            </Typography>
          ) : (
            <Typography variant="body2" color="warning.main">
              Certains chevauchements suggèrent une prudence dans
              l'interprétation. Un échantillon plus large pourrait affiner la
              précision des estimations.
            </Typography>
          )}
        </Paper>
      </Box>
    </Paper>
  );
};

export default ConfidenceIntervalsComponent;
