// components/AlgorithmLab/Level2/validation/StatisticalSummary.tsx
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
  Divider,
  Card,
  CardContent,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Science,
  CheckCircle,
  Cancel,
  Assignment,
  TrendingUp,
  Timeline,
  Assessment,
} from "@mui/icons-material";
import { H1Summary, StrategyStats } from "./types";

interface Props {
  data: StrategyStats[];
  validationResults: H1Summary;
}

const StatisticalSummary: React.FC<Props> = ({ data, validationResults }) => {
  const theme = useTheme();

  const styles = {
    mainContainer: {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      border: `1px solid ${theme.palette.divider}`,
    },
    headerBox: {
      background:
        theme.palette.mode === "dark"
          ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      p: 3,
      borderRadius: 1,
      mb: 3,
    },
    conclusionBox: {
      p: 4,
      backgroundColor:
        validationResults.overallValidation === "VALIDATED"
          ? alpha(theme.palette.success.main, 0.1)
          : validationResults.overallValidation === "PARTIALLY_VALIDATED"
          ? alpha(theme.palette.warning.main, 0.1)
          : alpha(theme.palette.error.main, 0.1),
      border: `2px solid ${
        validationResults.overallValidation === "VALIDATED"
          ? theme.palette.success.main
          : validationResults.overallValidation === "PARTIALLY_VALIDATED"
          ? theme.palette.warning.main
          : theme.palette.error.main
      }`,
      borderRadius: 2,
    },
  } as const;

  return (
    <Paper sx={styles.mainContainer}>
      <Box sx={styles.headerBox}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Assignment
            sx={{ fontSize: 32, color: theme.palette.primary.main }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              Synthèse Académique - Validation H1
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Rapport généré à partir des résultats calculés
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 4 }}>
        {/* Statut global */}
        <Box sx={styles.conclusionBox}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            {validationResults.overallValidation === "VALIDATED" ? (
              <CheckCircle
                sx={{ fontSize: 32, color: theme.palette.success.main }}
              />
            ) : validationResults.overallValidation ===
              "PARTIALLY_VALIDATED" ? (
              <Assessment
                sx={{ fontSize: 32, color: theme.palette.warning.main }}
              />
            ) : (
              <Cancel sx={{ fontSize: 32, color: theme.palette.error.main }} />
            )}
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              HYPOTHÈSE H1 :{" "}
              {validationResults.overallValidation === "VALIDATED"
                ? "PLEINEMENT VALIDÉE"
                : validationResults.overallValidation === "PARTIALLY_VALIDATED"
                ? "PARTIELLEMENT VALIDÉE"
                : "NON VALIDÉE"}
            </Typography>
          </Box>

          {!!validationResults.academicConclusion && (
            <Typography variant="body1" sx={{ fontStyle: "italic", mb: 2 }}>
              "{validationResults.academicConclusion}"
            </Typography>
          )}
        </Box>

        {/* Critères de validation */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mt: 4 }}
        >
          Critères de Validation Académique
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
            "& > *": { flex: "1 1 200px" },
          }}
        >
          <Card
            sx={{
              backgroundColor:
                validationResults.empiricalDifference > 0
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.error.main, 0.1),
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <TrendingUp
                color={
                  validationResults.empiricalDifference > 0
                    ? "success"
                    : "error"
                }
              />
              <Typography variant="h5" sx={{ fontWeight: "bold", my: 1 }}>
                +{validationResults.empiricalDifference.toFixed(1)}
              </Typography>
              <Typography variant="body2">
                Points d'écart (Actions – Explications)
              </Typography>
              <Chip
                label={
                  validationResults.empiricalDifference > 15
                    ? "SUBSTANTIEL"
                    : "FAIBLE"
                }
                color={
                  validationResults.empiricalDifference > 15
                    ? "success"
                    : "warning"
                }
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundColor: validationResults.chiSquare.significant
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Timeline
                color={
                  validationResults.chiSquare.significant ? "success" : "error"
                }
              />
              <Typography variant="h6" sx={{ fontWeight: "bold", my: 1 }}>
                χ² Test
              </Typography>
              <Typography variant="body2">
                χ²({validationResults.chiSquare.degreesOfFreedom}) ={" "}
                {validationResults.chiSquare.statistic}, p{" "}
                {validationResults.chiSquare.pValue < 0.001
                  ? "< 0.001"
                  : `= ${validationResults.chiSquare.pValue}`}
              </Typography>
              <Chip
                label={
                  validationResults.chiSquare.significant
                    ? "SIGNIFICATIF"
                    : "NON SIG."
                }
                color={
                  validationResults.chiSquare.significant ? "success" : "error"
                }
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundColor:
                (validationResults.chiSquare.cramersV ?? 0) >= 0.3
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Assessment
                color={
                  (validationResults.chiSquare.cramersV ?? 0) >= 0.3
                    ? "success"
                    : "warning"
                }
              />
              <Typography variant="h6" sx={{ fontWeight: "bold", my: 1 }}>
                Taille d'Effet (V)
              </Typography>
              <Typography variant="body2">
                V = {validationResults.chiSquare.cramersV} (
                {validationResults.chiSquare.interpretation})
              </Typography>
              <Chip
                label={
                  (validationResults.chiSquare.cramersV ?? 0) >= 0.3
                    ? "FORT"
                    : "MODÉRÉ"
                }
                color={
                  (validationResults.chiSquare.cramersV ?? 0) >= 0.3
                    ? "success"
                    : "warning"
                }
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          {validationResults.anova && (
            <Card
              sx={{
                backgroundColor: validationResults.anova.significant
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.warning.main, 0.1),
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Science
                  color={
                    validationResults.anova.significant ? "success" : "warning"
                  }
                />
                <Typography variant="h6" sx={{ fontWeight: "bold", my: 1 }}>
                  ANOVA Proportions
                </Typography>
                <Typography variant="body2">
                  F = {validationResults.anova.fStatistic}, p{" "}
                  {validationResults.anova.pValue < 0.001
                    ? "< 0.001"
                    : `= ${validationResults.anova.pValue}`}
                </Typography>
                <Chip
                  label={
                    validationResults.anova.significant
                      ? "SIGNIFICATIF"
                      : "À CONFIRMER"
                  }
                  color={
                    validationResults.anova.significant ? "success" : "warning"
                  }
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Résultats empiriques par stratégie */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Résultats Empiriques par Stratégie
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow
                sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
              >
                <TableCell sx={{ fontWeight: "bold" }}>Stratégie</TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.success.main }}
                >
                  Réactions Positives
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.error.main }}
                >
                  Réactions Négatives
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Échantillon (n)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Efficacité
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Validation H1</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data
                .slice()
                .sort((a, b) => b.effectiveness - a.effectiveness)
                .map((s) => {
                  const isAction =
                    s.strategy === "ENGAGEMENT" || s.strategy === "OUVERTURE";
                  const isExplanation = s.strategy === "EXPLICATION";
                  const meetsH1 = isAction
                    ? s.positive > 50
                    : isExplanation
                    ? s.positive < 20
                    : true;

                  return (
                    <TableRow key={s.strategy}>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {s.strategy}
                        {isAction && (
                          <Chip
                            label="ACTION"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {isExplanation && (
                          <Chip
                            label="EXPLICATION"
                            size="small"
                            color="secondary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: "bold",
                            color:
                              s.positive > 40
                                ? theme.palette.success.main
                                : theme.palette.text.primary,
                          }}
                        >
                          {s.positive.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: "bold",
                            color:
                              s.negative > 50
                                ? theme.palette.error.main
                                : theme.palette.text.primary,
                          }}
                        >
                          {s.negative.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{s.total}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: "bold",
                            color:
                              s.effectiveness > 0
                                ? theme.palette.success.main
                                : theme.palette.error.main,
                          }}
                        >
                          {s.effectiveness > 0 ? "+" : ""}
                          {s.effectiveness.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={meetsH1 ? <CheckCircle /> : <Cancel />}
                          label={meetsH1 ? "CONFORME H1" : "NON CONFORME"}
                          color={meetsH1 ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Batterie de Tests (résumé seulement, sans valeurs codées) */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          Batterie de Tests Statistiques (Résumé)
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
            "& > *": { flex: "1 1 250px" },
          }}
        >
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h6"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              Test χ² d'Indépendance
            </Typography>
            <Typography variant="h4" color="primary.main" sx={{ my: 1 }}>
              {validationResults.chiSquare.statistic}
            </Typography>
            <Typography variant="body2">
              χ²({validationResults.chiSquare.degreesOfFreedom}) • p{" "}
              {validationResults.chiSquare.pValue < 0.001
                ? "< 0.001"
                : `= ${validationResults.chiSquare.pValue}`}{" "}
              • V = {validationResults.chiSquare.cramersV}
            </Typography>
            <Chip
              label={
                validationResults.chiSquare.significant
                  ? "SIGNIFICATIF"
                  : "NON SIG."
              }
              color={
                validationResults.chiSquare.significant ? "success" : "default"
              }
              sx={{ mt: 1 }}
            />
          </Paper>

          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography
              variant="h6"
              color="secondary.main"
              sx={{ fontWeight: "bold" }}
            >
              Tests Pairwise (Fisher)
            </Typography>
            <Typography variant="h4" color="secondary.main" sx={{ my: 1 }}>
              {validationResults.fisher.filter((f) => f.significant).length}/
              {validationResults.fisher.length}
            </Typography>
            <Typography variant="body2">Comparaisons significatives</Typography>
            <Chip label="ODDS RATIO / p-values" color="info" sx={{ mt: 1 }} />
          </Paper>

          {validationResults.anova && (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography
                variant="h6"
                color="info.main"
                sx={{ fontWeight: "bold" }}
              >
                ANOVA Proportions
              </Typography>
              <Typography variant="h4" color="info.main" sx={{ my: 1 }}>
                F = {validationResults.anova.fStatistic}
              </Typography>
              <Typography variant="body2">
                p{" "}
                {validationResults.anova.pValue < 0.001
                  ? "< 0.001"
                  : `= ${validationResults.anova.pValue}`}
              </Typography>
              <Chip
                label={
                  validationResults.anova.significant
                    ? "SIGNIFICATIF"
                    : "À CONFIRMER"
                }
                color={
                  validationResults.anova.significant ? "success" : "warning"
                }
                sx={{ mt: 1 }}
              />
            </Paper>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Implications pratiques */}
        {!!validationResults.practicalImplications?.length && (
          <>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Implications Pratiques
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                mb: 4,
                "& > *": { flex: "1 1 300px" },
              }}
            >
              {validationResults.practicalImplications.map((imp, i) => (
                <Alert key={i} severity="info">
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {imp}
                  </Typography>
                </Alert>
              ))}
            </Box>
          </>
        )}

        {/* Limites */}
        {!!validationResults.limitationsNoted?.length && (
          <>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Limites et Précautions d'Interprétation
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              {validationResults.limitationsNoted.map((l, i) => (
                <Typography key={i} variant="body2" sx={{ display: "block" }}>
                  • {l}
                </Typography>
              ))}
            </Alert>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default StatisticalSummary;
