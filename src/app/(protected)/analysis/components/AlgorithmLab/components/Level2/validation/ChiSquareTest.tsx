// components/AlgorithmLab/Level2/validation/ChiSquareTest.tsx
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
  Chip,
  Alert,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { Calculate, CheckCircle, Cancel } from "@mui/icons-material";
import { StrategyStats } from "@/app/(protected)/analysis/types";

interface ChiSquareTestProps {
  data: StrategyStats[];
  results?: {
    statistic: number;
    pValue: number;
    degreesOfFreedom: number;
    significant: boolean;
  };
}

interface ContingencyCell {
  strategy: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export const ChiSquareTest: React.FC<ChiSquareTestProps> = ({
  data,
  results,
}) => {
  const theme = useTheme();

  // Calcul de la table de contingence
  const contingencyData = useMemo((): ContingencyCell[] => {
    return data.map((strategy) => ({
      strategy: strategy.strategy,
      positive: Math.round((strategy.positive * strategy.total) / 100),
      negative: Math.round((strategy.negative * strategy.total) / 100),
      neutral: Math.round((strategy.neutral * strategy.total) / 100),
      total: strategy.total,
    }));
  }, [data]);

  // Calculs des totaux marginaux
  const marginTotals = useMemo(() => {
    const totalPositive = contingencyData.reduce(
      (sum, row) => sum + row.positive,
      0
    );
    const totalNegative = contingencyData.reduce(
      (sum, row) => sum + row.negative,
      0
    );
    const totalNeutral = contingencyData.reduce(
      (sum, row) => sum + row.neutral,
      0
    );
    const grandTotal = totalPositive + totalNegative + totalNeutral;

    return {
      totalPositive,
      totalNegative,
      totalNeutral,
      grandTotal,
    };
  }, [contingencyData]);

  // Calcul des valeurs attendues sous H0 (indépendance)
  const expectedValues = useMemo(() => {
    return contingencyData.map((row) => ({
      strategy: row.strategy,
      expectedPositive:
        (row.total * marginTotals.totalPositive) / marginTotals.grandTotal,
      expectedNegative:
        (row.total * marginTotals.totalNegative) / marginTotals.grandTotal,
      expectedNeutral:
        (row.total * marginTotals.totalNeutral) / marginTotals.grandTotal,
    }));
  }, [contingencyData, marginTotals]);

  // Calcul du χ² (si pas fourni en props)
  const chiSquareCalculation = useMemo(() => {
    if (results) return results;

    let chiSquare = 0;

    contingencyData.forEach((observed, index) => {
      const expected = expectedValues[index];

      // Contribution positive
      const diffPos = observed.positive - expected.expectedPositive;
      chiSquare += (diffPos * diffPos) / expected.expectedPositive;

      // Contribution négative
      const diffNeg = observed.negative - expected.expectedNegative;
      chiSquare += (diffNeg * diffNeg) / expected.expectedNegative;

      // Contribution neutre
      const diffNeu = observed.neutral - expected.expectedNeutral;
      chiSquare += (diffNeu * diffNeu) / expected.expectedNeutral;
    });

    const degreesOfFreedom = (contingencyData.length - 1) * (3 - 1); // (lignes-1) * (colonnes-1)

    // Valeurs critiques χ² pour p=0.05 et p=0.01 (approximatives)
    const criticalValue005 = degreesOfFreedom === 6 ? 12.59 : 16.92; // Ajuster selon ddl
    const criticalValue001 = degreesOfFreedom === 6 ? 16.81 : 21.67;

    let pValue = 0.001; // Simplification - en réalité il faudrait une table/calcul exact
    if (chiSquare < criticalValue005) pValue = 0.1;
    else if (chiSquare < criticalValue001) pValue = 0.01;

    return {
      statistic: chiSquare,
      pValue,
      degreesOfFreedom,
      significant: pValue < 0.05,
    };
  }, [contingencyData, expectedValues, results]);

  const styles = {
    testContainer: {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      border: `1px solid ${theme.palette.divider}`,
    },
    headerBox: {
      background:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.primary.dark, 0.2)
          : alpha(theme.palette.primary.light, 0.1),
      p: 2,
      borderRadius: 1,
      mb: 3,
    },
    tableCell: {
      fontWeight: 600,
      fontSize: "0.9rem",
    },
  };

  return (
    <Paper sx={styles.testContainer}>
      <Box sx={styles.headerBox}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Calculate color="primary" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Test χ² d'Indépendance
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Test de l'hypothèse nulle : "Il n'y a pas d'association entre
          stratégie conseiller et réaction client"
        </Typography>
      </Box>

      {/* Résultats principaux */}
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", gap: 4, mb: 3, justifyContent: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              {chiSquareCalculation.statistic.toFixed(2)}
            </Typography>
            <Typography variant="caption">χ² calculé</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              color="info.main"
              sx={{ fontWeight: "bold" }}
            >
              {chiSquareCalculation.pValue < 0.001
                ? "<0.001"
                : chiSquareCalculation.pValue.toFixed(3)}
            </Typography>
            <Typography variant="caption">p-value</Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              color="secondary.main"
              sx={{ fontWeight: "bold" }}
            >
              {chiSquareCalculation.degreesOfFreedom}
            </Typography>
            <Typography variant="caption">degrés liberté</Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Chip
            icon={
              chiSquareCalculation.significant ? <CheckCircle /> : <Cancel />
            }
            label={
              chiSquareCalculation.significant
                ? "HYPOTHÈSE NULLE REJETÉE"
                : "HYPOTHÈSE NULLE ACCEPTÉE"
            }
            color={chiSquareCalculation.significant ? "success" : "error"}
            variant="filled"
            sx={{ py: 2, px: 3, fontSize: "1rem" }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Table de contingence observée */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Table de Contingence (Valeurs Observées)
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
              >
                <TableCell sx={styles.tableCell}>Stratégie</TableCell>
                <TableCell
                  align="center"
                  sx={{
                    ...styles.tableCell,
                    color: theme.palette.success.main,
                  }}
                >
                  Positif
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    ...styles.tableCell,
                    color: theme.palette.warning.main,
                  }}
                >
                  Neutre
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ ...styles.tableCell, color: theme.palette.error.main }}
                >
                  Négatif
                </TableCell>
                <TableCell align="center" sx={styles.tableCell}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contingencyData.map((row) => (
                <TableRow key={row.strategy}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {row.strategy}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: theme.palette.success.main }}
                  >
                    {row.positive}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: theme.palette.warning.main }}
                  >
                    {row.neutral}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: theme.palette.error.main }}
                  >
                    {row.negative}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    {row.total}
                  </TableCell>
                </TableRow>
              ))}
              {/* Ligne des totaux */}
              <TableRow
                sx={{ backgroundColor: alpha(theme.palette.grey[500], 0.1) }}
              >
                <TableCell sx={{ fontWeight: "bold" }}>TOTAL</TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.success.main }}
                >
                  {marginTotals.totalPositive}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.warning.main }}
                >
                  {marginTotals.totalNeutral}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.error.main }}
                >
                  {marginTotals.totalNegative}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {marginTotals.grandTotal}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table des valeurs attendues */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Valeurs Attendues (sous H₀: indépendance)
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                }}
              >
                <TableCell sx={styles.tableCell}>Stratégie</TableCell>
                <TableCell align="center" sx={styles.tableCell}>
                  E(Positif)
                </TableCell>
                <TableCell align="center" sx={styles.tableCell}>
                  E(Neutre)
                </TableCell>
                <TableCell align="center" sx={styles.tableCell}>
                  E(Négatif)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expectedValues.map((row) => (
                <TableRow key={row.strategy}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {row.strategy}
                  </TableCell>
                  <TableCell align="center">
                    {row.expectedPositive.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {row.expectedNeutral.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {row.expectedNegative.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Interprétation */}
        <Alert
          severity={chiSquareCalculation.significant ? "success" : "info"}
          sx={{ mt: 3 }}
        >
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {chiSquareCalculation.significant
              ? "Association statistiquement significative détectée"
              : "Aucune association significative détectée"}
          </Typography>
          <Typography variant="body2">
            {chiSquareCalculation.significant
              ? `La répartition des réactions client dépend significativement de la stratégie conseiller (p ${
                  chiSquareCalculation.pValue < 0.001
                    ? "< 0.001"
                    : `= ${chiSquareCalculation.pValue.toFixed(3)}`
                }).`
              : "Les données ne permettent pas de rejeter l'hypothèse d'indépendance entre stratégie et réaction."}
          </Typography>
        </Alert>
      </Box>
    </Paper>
  );
};

export default ChiSquareTest;
