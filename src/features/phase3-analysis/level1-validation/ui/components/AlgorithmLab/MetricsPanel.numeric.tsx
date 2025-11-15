"use client";
import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import type { TVValidationResult } from "./ResultsSample/types";

// Transforme les gold/predicted string→number pour stats (M1 ou M3)
const toNum = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export default function MetricsPanelNumeric({
  classifierLabel,
  results,
}: {
  classifierLabel?: string;
  results: TVValidationResult[];
}) {
  const stats = useMemo(() => {
    if (!results.length) return null;

    const pairs = results
      .map((r) => {
        const g = toNum(r.goldStandard);
        const p = toNum(r.predicted);
        return g !== undefined && p !== undefined ? { g, p, r } : null;
      })
      .filter(Boolean) as Array<{
      g: number;
      p: number;
      r: TVValidationResult;
    }>;

    const n = pairs.length;
    if (!n) return { n: 0 };

    const gs = pairs.map((x) => x.g);
    const ps = pairs.map((x) => x.p);

    const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    const mae = mean(pairs.map(({ g, p }) => Math.abs(p - g)));
    const mse = mean(pairs.map(({ g, p }) => (p - g) ** 2));
    const rmse = Math.sqrt(mse);
    const bias = mean(pairs.map(({ g, p }) => p - g));

    const meanG = mean(gs);
    const meanP = mean(ps);
    const varG = mean(gs.map((x) => (x - meanG) ** 2));
    const varP = mean(ps.map((x) => (x - meanP) ** 2));
    const covGP = mean(pairs.map(({ g, p }) => (g - meanG) * (p - meanP)));
    const r = varG > 0 && varP > 0 ? covGP / Math.sqrt(varG * varP) : 0;
    const r2 = r ** 2;

    const avgProcessingTime =
      results.reduce((s, r) => s + (r.processingTime || 0), 0) / results.length;
    const avgConfidence =
      results.reduce((s, r) => s + (r.confidence ?? 0), 0) / results.length;

    return {
      n,
      mae: +mae.toFixed(3),
      rmse: +rmse.toFixed(3),
      r2: +r2.toFixed(3),
      r: +r.toFixed(3),
      bias: +bias.toFixed(3),
      avgProcessingTime: Math.round(avgProcessingTime),
      avgConfidence: +avgConfidence.toFixed(2),
    };
  }, [results]);

  if (!stats || !stats.n) return null;

  const S = ({ t, v }: { t: string; v: React.ReactNode }) => (
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
        {v}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t}
      </Typography>
    </Box>
  );

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <InsightsIcon />
          Métriques Numériques
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
          <S t="MAE" v={stats.mae} />
          <S t="RMSE" v={stats.rmse} />
          <S t="R²" v={stats.r2} />
          <S t="r (Pearson)" v={stats.r} />
          <S t="Biais moyen" v={stats.bias} />
          <S t="N (paires)" v={stats.n} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Indicateur</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Valeur</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Temps moyen</TableCell>
                <TableCell align="center">
                  {stats.avgProcessingTime} ms
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Confiance moyenne</TableCell>
                <TableCell align="center">{stats.avgConfidence}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
