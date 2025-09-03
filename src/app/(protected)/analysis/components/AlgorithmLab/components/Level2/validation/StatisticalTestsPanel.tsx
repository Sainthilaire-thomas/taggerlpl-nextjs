// components/AlgorithmLab/Level2/validation/StatisticalTestsPanel.tsx
"use client";

import React from "react";
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
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Science,
  Assessment,
  Timeline,
  TrendingUp,
  Analytics,
} from "@mui/icons-material";
import { H1StrategyData } from "../shared/types";
import {
  computeChiSquare,
  computeFisherPairwise,
  computeAnova,
} from "../shared/stats";

interface Props {
  data: H1StrategyData[];
}

const StatisticalTestsPanel: React.FC<Props> = ({ data }) => {
  const [tabValue, setTabValue] = React.useState(0);

  const chi = React.useMemo(() => computeChiSquare(data), [data]);
  const fisher = React.useMemo(() => computeFisherPairwise(data), [data]);
  const anova = React.useMemo(() => computeAnova(data), [data]);

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Analytics color="primary" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Batterie de Tests Statistiques Détaillés
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Analyse statistique complète pour validation de l'hypothèse H1
        </Typography>
      </Paper>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Test χ² d'Indépendance" icon={<Assessment />} />
        <Tab label="Tests Exacts Fisher" icon={<Timeline />} />
        <Tab label="ANOVA Proportions" icon={<TrendingUp />} />
        <Tab label="Synthèse" icon={<Science />} />
      </Tabs>

      {/* χ² */}
      {tabValue === 0 && (
        <Box>
          <Alert
            severity={chi.significant ? "success" : "warning"}
            sx={{ mb: 3 }}
          >
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              Test χ² d'Indépendance:{" "}
              {chi.significant ? "SIGNIFICATIF" : "NON SIGNIFICATIF"}
            </Typography>
            <Typography variant="body2">
              χ²({chi.degreesOfFreedom}) = {chi.statistic}, p{" "}
              {chi.pValue < 0.001 ? "< 0.001" : `= ${chi.pValue}`}
              {" • "}V = {chi.cramersV} ({chi.interpretation})
            </Typography>
          </Alert>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="primary">
                    {chi.statistic}
                  </Typography>
                  <Typography variant="body2">Statistique χ²</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="secondary">
                    {chi.cramersV}
                  </Typography>
                  <Typography variant="body2">Cramér's V</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="info.main">
                    {chi.degreesOfFreedom}
                  </Typography>
                  <Typography variant="body2">Degrés de liberté</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Tableau de Contingence Observé
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Stratégie</TableCell>
                  <TableCell align="center">Positif</TableCell>
                  <TableCell align="center">Neutre</TableCell>
                  <TableCell align="center">Négatif</TableCell>
                  <TableCell align="center">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((s, i) => (
                  <TableRow key={s.strategy}>
                    <TableCell>{s.strategy}</TableCell>
                    <TableCell align="center">
                      {chi.contingency[i]?.[0] ?? 0}
                    </TableCell>
                    <TableCell align="center">
                      {chi.contingency[i]?.[1] ?? 0}
                    </TableCell>
                    <TableCell align="center">
                      {chi.contingency[i]?.[2] ?? 0}
                    </TableCell>
                    <TableCell align="center">{s.totalSamples}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Fisher */}
      {tabValue === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              Tests Exacts de Fisher - Comparaisons Pairwise
            </Typography>
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Comparaison</TableCell>
                  <TableCell align="center">Odds Ratio</TableCell>
                  <TableCell align="center">p-value</TableCell>
                  <TableCell align="center">Significatif</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fisher.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {r.comparison}
                    </TableCell>
                    <TableCell align="center">{r.oddsRatio}</TableCell>
                    <TableCell align="center">
                      {r.pValue < 0.001 ? "< 0.001" : r.pValue}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={r.significant ? "OUI" : "NON"}
                        color={r.significant ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ANOVA */}
      {tabValue === 2 && anova && (
        <Box>
          <Alert
            severity={anova.significant ? "success" : "warning"}
            sx={{ mb: 3 }}
          >
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              ANOVA sur Proportions:{" "}
              {anova.significant ? "SIGNIFICATIF" : "NON SIGNIFICATIF"}
            </Typography>
            <Typography variant="body2">
              F = {anova.fStatistic}, p{" "}
              {anova.pValue < 0.001 ? "< 0.001" : `= ${anova.pValue}`}
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="primary">
                    {anova.fStatistic}
                  </Typography>
                  <Typography variant="body2">Statistique F</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" color="secondary">
                    {anova.pValue < 0.001 ? "< 0.001" : anova.pValue}
                  </Typography>
                  <Typography variant="body2">p-value</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Moyennes par Groupe
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Stratégie</TableCell>
                  <TableCell align="center">Proportion Positive (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {anova.groupMeans.map((g) => (
                  <TableRow key={g.strategy}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {g.strategy}
                    </TableCell>
                    <TableCell align="center">{g.mean.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Synthèse */}
      {tabValue === 3 && (
        <Alert
          severity={
            chi.significant && (anova?.significant ?? true) ? "success" : "info"
          }
        >
          La convergence des tests{" "}
          {chi.significant && (anova?.significant ?? true)
            ? "confirme une association significative entre stratégies et réactions."
            : "suggère des tendances à confirmer."}
        </Alert>
      )}
    </Box>
  );
};

export default StatisticalTestsPanel;
