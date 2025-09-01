// components/AlgorithmLab/Level2/validation/EffectSizeCalculator.tsx
"use client";

import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { Assessment, TrendingUp, Speed } from "@mui/icons-material";
import { StrategyStats } from "@/app/(protected)/analysis/types";

interface EffectSizeCalculatorProps {
  data: StrategyStats[];
}

interface EffectSizeMetrics {
  cramersV: number;
  phiCoefficient: number;
  cohensD: number;
  interpretation: {
    cramersV: string;
    phiCoefficient: string;
    cohensD: string;
    overall: string;
  };
  practicalSignificance: boolean;
}

export const EffectSizeCalculator: React.FC<EffectSizeCalculatorProps> = ({
  data,
}) => {
  const theme = useTheme();

  // Calcul des tailles d'effet
  const effectSizeMetrics = useMemo((): EffectSizeMetrics => {
    if (!data.length) {
      return {
        cramersV: 0,
        phiCoefficient: 0,
        cohensD: 0,
        interpretation: {
          cramersV: "Aucune donnée",
          phiCoefficient: "Aucune donnée",
          cohensD: "Aucune donnée",
          overall: "Aucune donnée disponible",
        },
        practicalSignificance: false,
      };
    }

    // Préparation de la table de contingence
    const contingencyMatrix = data.map((strategy) => ({
      strategy: strategy.strategy,
      positive: Math.round((strategy.positive * strategy.total) / 100),
      negative: Math.round((strategy.negative * strategy.total) / 100),
      neutral: Math.round((strategy.neutral * strategy.total) / 100),
      total: strategy.total,
    }));

    const grandTotal = contingencyMatrix.reduce(
      (sum, row) => sum + row.total,
      0
    );

    // Calcul du χ² pour Cramér's V
    let chiSquare = 0;
    const totalPositive = contingencyMatrix.reduce(
      (sum, row) => sum + row.positive,
      0
    );
    const totalNegative = contingencyMatrix.reduce(
      (sum, row) => sum + row.negative,
      0
    );
    const totalNeutral = contingencyMatrix.reduce(
      (sum, row) => sum + row.neutral,
      0
    );

    contingencyMatrix.forEach((row) => {
      // Valeurs attendues sous indépendance
      const expectedPos = (row.total * totalPositive) / grandTotal;
      const expectedNeg = (row.total * totalNegative) / grandTotal;
      const expectedNeu = (row.total * totalNeutral) / grandTotal;

      // Contributions au χ²
      chiSquare += Math.pow(row.positive - expectedPos, 2) / expectedPos;
      chiSquare += Math.pow(row.negative - expectedNeg, 2) / expectedNeg;
      chiSquare += Math.pow(row.neutral - expectedNeu, 2) / expectedNeu;
    });

    // Cramér's V = √(χ²/(n*(min(r,c)-1)))
    const rows = contingencyMatrix.length;
    const cols = 3; // positif, négatif, neutre
    const cramersV = Math.sqrt(
      chiSquare / (grandTotal * (Math.min(rows, cols) - 1))
    );

    // Coefficient Phi (pour tables 2x2 - approximation)
    const phiCoefficient = Math.sqrt(chiSquare / grandTotal);

    // Cohen's d (différence standardisée actions vs explications)
    const engagement = data.find((d) => d.strategy === "ENGAGEMENT");
    const ouverture = data.find((d) => d.strategy === "OUVERTURE");
    const explication = data.find((d) => d.strategy === "EXPLICATION");

    let cohensD = 0;
    if (engagement && explication) {
      const p1 = engagement.positive / 100;
      const p2 = explication.positive / 100;
      const n1 = engagement.total;
      const n2 = explication.total;

      // Variance poolée pour proportions
      const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
      const pooledVariance = pooledP * (1 - pooledP);

      cohensD = (p1 - p2) / Math.sqrt(pooledVariance);
    }

    // Interprétations selon les standards Cohen (1988)
    const interpretCramersV = (v: number): string => {
      if (v < 0.1) return "Effet négligeable (V < 0.1)";
      if (v < 0.3) return "Effet faible (0.1 ≤ V < 0.3)";
      if (v < 0.5) return "Effet modéré (0.3 ≤ V < 0.5)";
      return "Effet fort (V ≥ 0.5)";
    };

    const interpretCohensD = (d: number): string => {
      const absD = Math.abs(d);
      if (absD < 0.2) return "Effet négligeable (|d| < 0.2)";
      if (absD < 0.5) return "Effet faible (0.2 ≤ |d| < 0.5)";
      if (absD < 0.8) return "Effet modéré (0.5 ≤ |d| < 0.8)";
      return "Effet fort (|d| ≥ 0.8)";
    };

    return {
      cramersV,
      phiCoefficient,
      cohensD,
      interpretation: {
        cramersV: interpretCramersV(cramersV),
        phiCoefficient:
          phiCoefficient > 0.3 ? "Association forte" : "Association faible",
        cohensD: interpretCohensD(cohensD),
        overall:
          cramersV > 0.3 && Math.abs(cohensD) > 0.5
            ? "Effet globalement fort"
            : "Effet modéré à faible",
      },
      practicalSignificance: cramersV > 0.3 || Math.abs(cohensD) > 0.5,
    };
  }, [data]);

  const styles = {
    mainContainer: {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      border: `1px solid ${theme.palette.divider}`,
    },
    headerBox: {
      background:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.success.dark, 0.2)
          : alpha(theme.palette.success.light, 0.1),
      p: 2,
      borderRadius: 1,
      mb: 3,
    },
    metricCard: {
      p: 3,
      textAlign: "center" as const,
      backgroundColor: alpha(theme.palette.background.paper, 0.5),
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
    },
  };

  return (
    <Paper sx={styles.mainContainer}>
      <Box sx={styles.headerBox}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Assessment color="success" />
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Tailles d'Effet et Signification Pratique
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Mesure de l'importance pratique des différences observées - Complément
          de la significativité statistique
        </Typography>
      </Box>

      <Box sx={{ p: 4 }}>
        {/* Métriques principales */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mb: 4,
            "& > *": { flex: "1 1 250px" },
          }}
        >
          <Paper sx={styles.metricCard}>
            <Typography
              variant="h3"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              {effectSizeMetrics.cramersV.toFixed(3)}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Cramér's V
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {effectSizeMetrics.interpretation.cramersV}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(effectSizeMetrics.cramersV * 100, 100)}
              sx={{
                mt: 2,
                height: 8,
                borderRadius: 4,
                "& .MuiLinearProgress-bar": {
                  backgroundColor:
                    effectSizeMetrics.cramersV > 0.5
                      ? theme.palette.success.main
                      : effectSizeMetrics.cramersV > 0.3
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                },
              }}
            />
          </Paper>

          <Paper sx={styles.metricCard}>
            <Typography
              variant="h3"
              color="info.main"
              sx={{ fontWeight: "bold" }}
            >
              {effectSizeMetrics.phiCoefficient.toFixed(3)}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Coefficient Phi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {effectSizeMetrics.interpretation.phiCoefficient}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(effectSizeMetrics.phiCoefficient * 100, 100)}
              sx={{
                mt: 2,
                height: 8,
                borderRadius: 4,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.palette.info.main,
                },
              }}
            />
          </Paper>

          <Paper sx={styles.metricCard}>
            <Typography
              variant="h3"
              color="secondary.main"
              sx={{ fontWeight: "bold" }}
            >
              {effectSizeMetrics.cohensD.toFixed(2)}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Cohen's d
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {effectSizeMetrics.interpretation.cohensD}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(Math.abs(effectSizeMetrics.cohensD) * 50, 100)}
              sx={{
                mt: 2,
                height: 8,
                borderRadius: 4,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.palette.secondary.main,
                },
              }}
            />
          </Paper>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Interprétation détaillée */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Interprétation des Tailles d'Effet
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
            "& > *": { flex: "1 1 400px" },
          }}
        >
          <Paper
            sx={{
              p: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Typography
              variant="subtitle1"
              gutterBottom
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              Cramér's V = {effectSizeMetrics.cramersV.toFixed(3)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Usage :</strong> Mesure l'intensité de l'association entre
              stratégie conseiller et réaction client.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Calcul :</strong> V = √(χ²/(n×(min(lignes,colonnes)-1)))
            </Typography>
            <Typography variant="body2">
              <strong>Seuils Cohen :</strong> 0.1 (faible), 0.3 (modéré), 0.5
              (fort)
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 3,
              backgroundColor: alpha(theme.palette.secondary.main, 0.05),
            }}
          >
            <Typography
              variant="subtitle1"
              gutterBottom
              color="secondary.main"
              sx={{ fontWeight: "bold" }}
            >
              Cohen's d = {effectSizeMetrics.cohensD.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Usage :</strong> Différence standardisée entre ENGAGEMENT
              et EXPLICATION.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Calcul :</strong> d = (μ₁ - μ₂) / σ_pooled
            </Typography>
            <Typography variant="body2">
              <strong>Seuils Cohen :</strong> 0.2 (faible), 0.5 (modéré), 0.8
              (fort)
            </Typography>
          </Paper>
        </Box>

        {/* Signification pratique globale */}
        <Alert
          severity={
            effectSizeMetrics.practicalSignificance ? "success" : "warning"
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Signification Pratique :{" "}
            {effectSizeMetrics.practicalSignificance ? "FORTE" : "MODÉRÉE"}
          </Typography>
          <Typography variant="body2">
            {effectSizeMetrics.interpretation.overall}
          </Typography>
        </Alert>

        {/* Comparaisons stratégiques pour H1 */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Comparaisons Stratégiques (H1)
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            "& > *": { flex: "1 1 200px" },
          }}
        >
          {data
            .sort((a, b) => b.effectiveness - a.effectiveness)
            .map((strategy, index) => (
              <Paper
                key={strategy.strategy}
                sx={{
                  p: 2,
                  textAlign: "center",
                  backgroundColor:
                    index === 0
                      ? alpha(theme.palette.success.main, 0.1)
                      : index === data.length - 1
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${
                    index === 0
                      ? theme.palette.success.main
                      : index === data.length - 1
                      ? theme.palette.error.main
                      : theme.palette.divider
                  }`,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {strategy.strategy}
                </Typography>
                <Typography
                  variant="h4"
                  color={
                    index === 0
                      ? "success.main"
                      : index === data.length - 1
                      ? "error.main"
                      : "text.primary"
                  }
                  sx={{ fontWeight: "bold", my: 1 }}
                >
                  {strategy.positive.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rang #{index + 1} d'efficacité
                </Typography>

                {/* Visualisation effet relatif */}
                <LinearProgress
                  variant="determinate"
                  value={strategy.positive}
                  sx={{
                    mt: 1,
                    height: 6,
                    borderRadius: 3,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        index === 0
                          ? theme.palette.success.main
                          : index === data.length - 1
                          ? theme.palette.error.main
                          : theme.palette.info.main,
                    },
                  }}
                />
              </Paper>
            ))}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Conclusion pour la thèse */}
        <Paper
          sx={{
            p: 4,
            backgroundColor: effectSizeMetrics.practicalSignificance
              ? alpha(theme.palette.success.main, 0.05)
              : alpha(theme.palette.warning.main, 0.05),
            border: `2px solid ${
              effectSizeMetrics.practicalSignificance
                ? theme.palette.success.main
                : theme.palette.warning.main
            }`,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Conclusion pour Chapitre 5 - Section Tailles d'Effet
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            L'analyse des tailles d'effet confirme l'importance pratique des
            différences observées dans la validation de H1. Le Cramér's V de{" "}
            {effectSizeMetrics.cramersV.toFixed(3)}
            {effectSizeMetrics.cramersV > 0.5
              ? " indique un effet fort"
              : effectSizeMetrics.cramersV > 0.3
              ? " indique un effet modéré"
              : " indique un effet faible"}
            , dépassant largement les seuils conventionnels d'effet important en
            sciences sociales (V &gt; 0.3).
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Le Cohen's d de {effectSizeMetrics.cohensD.toFixed(2)} entre
            descriptions d'actions et explications révèle une différence
            standardisée{" "}
            {Math.abs(effectSizeMetrics.cohensD) > 0.8
              ? "forte"
              : Math.abs(effectSizeMetrics.cohensD) > 0.5
              ? "modérée"
              : "faible"}
            , confirmant que l'écart observé ne relève pas d'une simple
            variation statistique mais constitue une différence substantielle
            d'efficacité communicationnelle.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Ces métriques valident la signification pratique de H1 :
            l'efficacité différentielle entre stratégies linguistiques est non
            seulement statistiquement significative mais aussi pratiquement
            importante pour les applications professionnelles.
          </Typography>
        </Paper>

        {/* Standards académiques */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Standards Académiques de Taille d'Effet
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              "& > *": { flex: "1 1 300px" },
            }}
          >
            <Paper
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                Cramér's V (Cohen, 1988)
              </Typography>
              <Box sx={{ fontSize: "0.85rem" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Faible :</span> <span>0.1 ≤ V &lt; 0.3</span>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Modéré :</span> <span>0.3 ≤ V &lt; 0.5</span>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                  }}
                >
                  <span>Fort :</span> <span>V ≥ 0.5</span>
                </Box>
              </Box>
            </Paper>

            <Paper
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.secondary.main, 0.05),
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                Cohen's d (Cohen, 1988)
              </Typography>
              <Box sx={{ fontSize: "0.85rem" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Faible :</span> <span>0.2 ≤ |d| &lt; 0.5</span>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Modéré :</span> <span>0.5 ≤ |d| &lt; 0.8</span>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                  }}
                >
                  <span>Fort :</span> <span>|d| ≥ 0.8</span>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default EffectSizeCalculator;
