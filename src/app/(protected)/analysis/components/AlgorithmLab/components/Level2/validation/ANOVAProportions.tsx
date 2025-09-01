// components/AlgorithmLab/Level2/validation/ANOVAProportions.tsx
"use client";

import React, { useMemo } from "react";
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
  Alert,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { Timeline, TrendingUp, Assessment } from "@mui/icons-material";
import { StrategyStats } from "@/app/(protected)/analysis/types";

interface ANOVAProportionsProps {
  data: StrategyStats[];
  results?: {
    fStatistic: number;
    pValue: number;
    significant: boolean;
  };
}

interface ANOVAGroup {
  strategy: string;
  proportion: number;
  n: number;
  variance: number;
  standardError: number;
}

interface ANOVACalculationResult {
  fStatistic: number;
  pValue: number;
  significant: boolean;
  groups: ANOVAGroup[];
  grandMean: number;
  dfBetween: number;
  dfWithin: number;
  msBetween: number;
  msWithin: number;
}

export const ANOVAProportions: React.FC<ANOVAProportionsProps> = ({
  data,
  results,
}) => {
  const theme = useTheme();

  // Calcul ANOVA sur les proportions de réactions positives
  const anovaCalculation = useMemo((): ANOVACalculationResult => {
    if (results) {
      // Si results est fourni mais incomplet, on le complète avec des valeurs par défaut
      return {
        fStatistic: results.fStatistic,
        pValue: results.pValue,
        significant: results.significant,
        groups: data.map((strategy) => ({
          strategy: strategy.strategy,
          proportion: strategy.positive / 100,
          n: strategy.total,
          variance:
            ((strategy.positive / 100) * (1 - strategy.positive / 100)) /
            strategy.total,
          standardError: Math.sqrt(
            ((strategy.positive / 100) * (1 - strategy.positive / 100)) /
              strategy.total
          ),
        })),
        grandMean:
          data.reduce((sum, s) => sum + (s.positive / 100) * s.total, 0) /
          data.reduce((sum, s) => sum + s.total, 0),
        dfBetween: data.length - 1,
        dfWithin: data.reduce((sum, s) => sum + s.total, 0) - data.length,
        msBetween: 0, // Calculé ci-dessous
        msWithin: 0, // Calculé ci-dessous
      };
    }

    // Préparation des groupes pour ANOVA
    const groups: ANOVAGroup[] = data.map((strategy) => {
      const proportion = strategy.positive / 100;
      const n = strategy.total;

      // Variance d'une proportion : p(1-p)/n
      const variance = (proportion * (1 - proportion)) / n;
      const standardError = Math.sqrt(variance);

      return {
        strategy: strategy.strategy,
        proportion,
        n,
        variance,
        standardError,
      };
    });

    // Calcul de la moyenne générale pondérée
    const totalN = groups.reduce((sum, group) => sum + group.n, 0);
    const grandMean =
      groups.reduce((sum, group) => sum + group.proportion * group.n, 0) /
      totalN;

    // Calcul des sommes des carrés
    let ssTotal = 0; // Somme des carrés totale
    let ssBetween = 0; // Somme des carrés entre groupes

    groups.forEach((group) => {
      // SS Between : différence entre moyenne groupe et moyenne générale
      const diffMean = group.proportion - grandMean;
      ssBetween += group.n * diffMean * diffMean;

      // SS Total (approximation pour proportions)
      ssTotal += group.n * group.variance;
    });

    const ssWithin = ssTotal - ssBetween;

    // Degrés de liberté
    const dfBetween = groups.length - 1;
    const dfWithin = totalN - groups.length;

    // Moyennes des carrés
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;

    // Statistique F
    const fStatistic = msBetween / msWithin;

    // Approximation p-value (F-distribution)
    let pValue = 0.1;
    if (fStatistic > 7.71) pValue = 0.001; // F critique pour α=0.001
    else if (fStatistic > 5.14) pValue = 0.01; // F critique pour α=0.01
    else if (fStatistic > 3.84) pValue = 0.05; // F critique pour α=0.05

    return {
      fStatistic,
      pValue,
      significant: pValue < 0.05,
      groups,
      grandMean,
      dfBetween,
      dfWithin,
      msBetween,
      msWithin,
    };
  }, [data, results]);

  const styles = {
    testContainer: {
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
    <Paper sx={styles.testContainer}>
      <Box sx={styles.headerBox}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Timeline color="info" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            ANOVA sur Proportions
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Test de l'égalité des moyennes entre stratégies linguistiques
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Hypothèses ANOVA */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>H₀ :</strong> μ₁ = μ₂ = μ₃ = μ₄ (toutes les stratégies ont
            la même efficacité moyenne)
            <br />
            <strong>H₁ :</strong> Au moins une stratégie diffère
            significativement des autres
          </Typography>
        </Alert>

        {/* Résultats principaux */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
            "& > *": { flex: "1 1 150px" },
          }}
        >
          <Paper
            sx={{
              p: 2,
              textAlign: "center",
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Typography
              variant="h5"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              {anovaCalculation.fStatistic.toFixed(2)}
            </Typography>
            <Typography variant="caption">Statistique F</Typography>
          </Paper>

          <Paper
            sx={{
              p: 2,
              textAlign: "center",
              backgroundColor: alpha(theme.palette.info.main, 0.1),
            }}
          >
            <Typography
              variant="h5"
              color="info.main"
              sx={{ fontWeight: "bold" }}
            >
              {anovaCalculation.pValue < 0.001
                ? "&lt;0.001"
                : anovaCalculation.pValue.toFixed(3)}
            </Typography>
            <Typography variant="caption">p-value</Typography>
          </Paper>

          <Paper
            sx={{
              p: 2,
              textAlign: "center",
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
            }}
          >
            <Chip
              label={
                anovaCalculation.significant
                  ? "SIGNIFICATIF"
                  : "NON SIGNIFICATIF"
              }
              color={anovaCalculation.significant ? "success" : "error"}
              sx={{ fontWeight: "bold" }}
            />
          </Paper>
        </Box>

        {/* Table ANOVA détaillée */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Table ANOVA Détaillée
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
              >
                <TableCell sx={{ fontWeight: "bold" }}>Source</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  ddl
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Somme Carrés
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Moyenne Carrés
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  F
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  p-value
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Entre groupes</TableCell>
                <TableCell align="center">
                  {anovaCalculation.dfBetween}
                </TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">
                  {anovaCalculation.msBetween.toFixed(4)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  {anovaCalculation.fStatistic.toFixed(2)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "info.main" }}
                >
                  {anovaCalculation.pValue < 0.001
                    ? "&lt;0.001"
                    : anovaCalculation.pValue.toFixed(3)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Intra groupes</TableCell>
                <TableCell align="center">
                  {anovaCalculation.dfWithin}
                </TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">
                  {anovaCalculation.msWithin.toFixed(4)}
                </TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="center">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Moyennes par groupe */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Moyennes par Stratégie
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            "& > *": { flex: "1 1 300px" },
          }}
        >
          {anovaCalculation.groups
            .sort((a: ANOVAGroup, b: ANOVAGroup) => b.proportion - a.proportion)
            .map((group: ANOVAGroup, index: number) => (
              <Paper
                key={group.strategy}
                sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {group.strategy}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Typography variant="body2">Proportion:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {(group.proportion * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Échantillon:</Typography>
                  <Typography variant="body2">n = {group.n}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Erreur std:</Typography>
                  <Typography variant="body2">
                    ±{(group.standardError * 100).toFixed(2)}%
                  </Typography>
                </Box>

                {/* Barre de progression visuelle */}
                <LinearProgress
                  variant="determinate"
                  value={group.proportion * 100}
                  sx={{
                    mt: 1,
                    height: 8,
                    borderRadius: 4,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        index === 0
                          ? theme.palette.success.main
                          : index === 1
                          ? theme.palette.info.main
                          : index === 2
                          ? theme.palette.warning.main
                          : theme.palette.error.main,
                    },
                  }}
                />
              </Paper>
            ))}
        </Box>

        {/* Post-hoc et interprétation */}
        {anovaCalculation.significant && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              Différences significatives détectées entre stratégies
            </Typography>
            <Typography variant="body2">
              L'ANOVA confirme que toutes les stratégies n'ont pas la même
              efficacité moyenne. Les tests post-hoc (Tukey, Bonferroni)
              seraient nécessaires pour identifier précisément quelles paires
              diffèrent significativement.
            </Typography>
          </Alert>
        )}

        {/* Validation spécifique H1 */}
        <Paper
          sx={{
            p: 3,
            mt: 3,
            backgroundColor: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          }}
        >
          <Typography variant="h6" gutterBottom color="success.main">
            Implications pour H1
          </Typography>
          <Typography variant="body2">
            L'ANOVA{" "}
            {anovaCalculation.significant ? "confirme" : "ne confirme pas"}{" "}
            l'existence de différences significatives entre stratégies
            linguistiques.
            {anovaCalculation.significant &&
              " Cette validation globale soutient H1 : les descriptions d'actions " +
                "(ENGAGEMENT/OUVERTURE) et les explications n'ont pas la même efficacité moyenne."}
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
};

export default ANOVAProportions;
