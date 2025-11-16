// components/Level1/comparison/VersionComparator.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

// ✅ Imports centralisés
import type {
  TargetKind,
  AlgorithmVersionId,
  AlgorithmVersionMetadata,
  Level1ValidationMetrics,
} from "../../../types";

import { VersionSelector } from '@/features/phase3-analysis/level1-validation/ui/components/shared/VersionSelector';
import { useAlgorithmVersioning } from '@/features/phase3-analysis/level1-validation/ui/hooks/useAlgorithmVersioning';

export interface VersionComparatorProps {
  targetKind: TargetKind;
}

// 🧮 Helper pour calculer le delta F1 moyen
const calculateF1Delta = (
  metricsA: Level1ValidationMetrics,
  metricsB: Level1ValidationMetrics
): number => {
  const f1A = metricsA.f1 ?? {};
  const f1B = metricsB.f1 ?? {};

  const labels = Array.from(
    new Set([...Object.keys(f1A), ...Object.keys(f1B)])
  );

  if (labels.length === 0) return 0;

  const totalDelta = labels.reduce((sum, label) => {
    const vA = f1A[label] ?? 0;
    const vB = f1B[label] ?? 0;
    return sum + (vB - vA);
  }, 0);

  return totalDelta / labels.length;
};

// 🎨 Composant pour afficher une cellule de delta
const DeltaCell: React.FC<{ value: number; format?: "percent" | "number" }> = ({
  value,
  format = "percent",
}) => {
  const isPositive = value > 0;
  const formatted =
    format === "percent"
      ? `${isPositive ? "+" : ""}${(value * 100).toFixed(1)}%`
      : `${isPositive ? "+" : ""}${value.toFixed(3)}`;

  return (
    <Chip
      label={formatted}
      color={isPositive ? "success" : value < 0 ? "error" : "default"}
      size="small"
      icon={
        isPositive ? (
          <TrendingUpIcon fontSize="small" />
        ) : value < 0 ? (
          <TrendingDownIcon fontSize="small" />
        ) : undefined
      }
      sx={{ fontWeight: "bold" }}
    />
  );
};

export const VersionComparator: React.FC<VersionComparatorProps> = ({
  targetKind,
}) => {
  const [versionA, setVersionA] = useState<AlgorithmVersionMetadata>();
  const [versionB, setVersionB] = useState<AlgorithmVersionMetadata>();
  const [loading, setLoading] = useState(false);

  const { loadVersion } = useAlgorithmVersioning();

  // 📊 Calcul des différences de métriques
  const metricsDiff = useMemo(() => {
    if (!versionA?.level1_metrics || !versionB?.level1_metrics) return null;

    const metricsA = versionA.level1_metrics;
    const metricsB = versionB.level1_metrics;

    return {
      accuracy_delta: (metricsB.accuracy ?? 0) - (metricsA.accuracy ?? 0),
      f1_delta: calculateF1Delta(metricsA, metricsB),
      kappa_delta: (metricsB.kappa ?? 0) - (metricsA.kappa ?? 0),
      // Métriques numériques (M1/M3)
      mae_delta: (metricsB.mae ?? 0) - (metricsA.mae ?? 0),
      rmse_delta: (metricsB.rmse ?? 0) - (metricsA.rmse ?? 0),
      r2_delta: (metricsB.r2 ?? 0) - (metricsA.r2 ?? 0),
    };
  }, [versionA, versionB]);

  // 🔄 Chargement d'une version
  const handleLoadVersion = async (
    id: AlgorithmVersionId,
    setter: React.Dispatch<React.SetStateAction<AlgorithmVersionMetadata | undefined>>
  ) => {
    setLoading(true);
    try {
      const version = await loadVersion(id);
      setter(version);
    } catch (err) {
      console.error("Erreur chargement version:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Déterminer si classification ou numérique
  const isClassification =
    targetKind === "X" || targetKind === "Y" || targetKind === "M2";

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <CompareArrowsIcon color="primary" />
          <Typography variant="h6">
            Comparaison de Versions ({targetKind})
          </Typography>
        </Stack>

        <Alert severity="info" sx={{ mb: 2 }}>
          Sélectionnez deux versions pour comparer leurs performances Level1
        </Alert>

        {/* Sélecteurs côte à côte */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Box sx={{ flex: 1, width: "100%" }}>
            <Typography variant="subtitle2" gutterBottom>
              Version A (baseline)
            </Typography>
            <VersionSelector
              targetKind={targetKind}
              selectedVersionId={versionA?.version_id}
              onVersionSelect={(id) => handleLoadVersion(id, setVersionA)}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{ display: { xs: "none", md: "block" } }}
          >
            vs
          </Typography>

          <Box sx={{ flex: 1, width: "100%" }}>
            <Typography variant="subtitle2" gutterBottom>
              Version B (candidate)
            </Typography>
            <VersionSelector
              targetKind={targetKind}
              selectedVersionId={versionB?.version_id}
              onVersionSelect={(id) => handleLoadVersion(id, setVersionB)}
            />
          </Box>
        </Stack>

        {/* Affichage des métadonnées */}
        {(versionA || versionB) && (
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            {versionA && (
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Version A
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {versionA.version_name}
                </Typography>
                <Typography variant="caption">
                  {new Date(versionA.created_at).toLocaleString("fr-FR")}
                </Typography>
              </Paper>
            )}
            {versionB && (
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Version B
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {versionB.version_name}
                </Typography>
                <Typography variant="caption">
                  {new Date(versionB.created_at).toLocaleString("fr-FR")}
                </Typography>
              </Paper>
            )}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Tableau de comparaison */}
        {metricsDiff && versionA && versionB ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Métrique</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Version A</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Version B</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Δ (B - A)</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isClassification ? (
                  <>
                    {/* Métriques de classification */}
                    <TableRow>
                      <TableCell>Accuracy</TableCell>
                      <TableCell align="center">
                        {((versionA.level1_metrics?.accuracy ?? 0) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="center">
                        {((versionB.level1_metrics?.accuracy ?? 0) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="center">
                        <DeltaCell value={metricsDiff.accuracy_delta} />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>F1 Score (moyen)</TableCell>
                      <TableCell align="center">
                        {(() => {
                          const f1 = versionA.level1_metrics?.f1 ?? {};
                          const values = Object.values(f1);
                          const avg = values.length > 0
                            ? values.reduce((a, b) => a + b, 0) / values.length
                            : 0;
                          return (avg * 100).toFixed(1) + "%";
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const f1 = versionB.level1_metrics?.f1 ?? {};
                          const values = Object.values(f1);
                          const avg = values.length > 0
                            ? values.reduce((a, b) => a + b, 0) / values.length
                            : 0;
                          return (avg * 100).toFixed(1) + "%";
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        <DeltaCell value={metricsDiff.f1_delta} />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>Kappa (Cohen)</TableCell>
                      <TableCell align="center">
                        {(versionA.level1_metrics?.kappa ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        {(versionB.level1_metrics?.kappa ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        <DeltaCell
                          value={metricsDiff.kappa_delta}
                          format="number"
                        />
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <>
                    {/* Métriques numériques (M1/M3) */}
                    <TableRow>
                      <TableCell>MAE (Mean Absolute Error)</TableCell>
                      <TableCell align="center">
                        {(versionA.level1_metrics?.mae ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        {(versionB.level1_metrics?.mae ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        <DeltaCell
                          value={metricsDiff.mae_delta}
                          format="number"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>RMSE (Root Mean Square Error)</TableCell>
                      <TableCell align="center">
                        {(versionA.level1_metrics?.rmse ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        {(versionB.level1_metrics?.rmse ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        <DeltaCell
                          value={metricsDiff.rmse_delta}
                          format="number"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>R² (Coefficient de détermination)</TableCell>
                      <TableCell align="center">
                        {(versionA.level1_metrics?.r2 ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        {(versionB.level1_metrics?.r2 ?? 0).toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        <DeltaCell
                          value={metricsDiff.r2_delta}
                          format="number"
                        />
                      </TableCell>
                    </TableRow>
                  </>
                )}

                {/* Ligne de métadonnées */}
                <TableRow sx={{ backgroundColor: "action.hover" }}>
                  <TableCell>
                    <strong>Taille échantillon</strong>
                  </TableCell>
                  <TableCell align="center">
                    {versionA.level1_metrics?.sample_size ?? "—"}
                  </TableCell>
                  <TableCell align="center">
                    {versionB.level1_metrics?.sample_size ?? "—"}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        (versionB.level1_metrics?.sample_size ?? 0) -
                        (versionA.level1_metrics?.sample_size ?? 0)
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            Sélectionnez deux versions pour afficher la comparaison détaillée
          </Alert>
        )}

        {/* Interprétation automatique */}
        {metricsDiff && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Interprétation
            </Typography>
            <Alert
              severity={
                isClassification
                  ? metricsDiff.accuracy_delta > 0.02
                    ? "success"
                    : metricsDiff.accuracy_delta < -0.02
                    ? "error"
                    : "info"
                  : metricsDiff.mae_delta < -0.01
                  ? "success"
                  : metricsDiff.mae_delta > 0.01
                  ? "error"
                  : "info"
              }
            >
              {isClassification ? (
                <>
                  {metricsDiff.accuracy_delta > 0.02 ? (
                    <strong>✅ Amélioration significative</strong>
                  ) : metricsDiff.accuracy_delta < -0.02 ? (
                    <strong>⚠️ Régression détectée</strong>
                  ) : (
                    <strong>➖ Performance similaire</strong>
                  )}
                  {" — "}
                  Version B{" "}
                  {metricsDiff.accuracy_delta > 0
                    ? "surpasse"
                    : metricsDiff.accuracy_delta < 0
                    ? "est inférieure à"
                    : "équivaut à"}{" "}
                  Version A en accuracy (
                  {(Math.abs(metricsDiff.accuracy_delta) * 100).toFixed(1)}% points)
                </>
              ) : (
                <>
                  {metricsDiff.mae_delta < -0.01 ? (
                    <strong>✅ Erreur réduite</strong>
                  ) : metricsDiff.mae_delta > 0.01 ? (
                    <strong>⚠️ Erreur augmentée</strong>
                  ) : (
                    <strong>➖ Erreur stable</strong>
                  )}
                  {" — "}
                  MAE {metricsDiff.mae_delta < 0 ? "diminuée" : "augmentée"} de{" "}
                  {Math.abs(metricsDiff.mae_delta).toFixed(3)}
                </>
              )}
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VersionComparator;
