// components/AlgorithmLab/Level2/Level2Interface.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import {
  Science,
  TrendingUp,
  Assessment,
  Assignment,
  CheckCircle,
  Cancel,
  Warning,
  Info,
} from "@mui/icons-material";

import { useTaggingData } from "@/context/TaggingDataContext";
import StatisticalTestsPanel from "./validation/StatisticalTestsPanel";
import StatisticalSummary from "./validation/StatisticalSummary";

import {
  filterValidTurnTagged,
  computeH1Analysis,
  toStrategyStats,
  summarizeH1,
  extractDetailedCriteria,
} from "./shared/stats";
import {
  DEFAULT_H1_THRESHOLDS,
  H1Thresholds,
  getContextualThresholds,
} from "./config/hypotheses";

interface Level2InterfaceProps {
  selectedOrigin?: string | null;
  thresholds?: H1Thresholds;
}

const TabPanel: React.FC<{
  children?: React.ReactNode;
  value: number;
  index: number;
}> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`level2-tabpanel-${index}`}
    aria-labelledby={`level2-tab-${index}`}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

export const Level2Interface: React.FC<Level2InterfaceProps> = ({
  selectedOrigin,
  thresholds: providedThresholds,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showDetailedCriteria, setShowDetailedCriteria] = useState(false);
  const [thresholdMode, setThresholdMode] = useState<
    "STRICT" | "REALISTIC" | "EMPIRICAL"
  >("REALISTIC");

  const { allTurnTagged, loadingGlobalData, errorGlobalData, tags } =
    useTaggingData();

  const validTurnTagged = useMemo(
    () => filterValidTurnTagged(allTurnTagged, tags, selectedOrigin),
    [allTurnTagged, tags, selectedOrigin]
  );

  // Utiliser les seuils configurables
  const activeThresholds =
    providedThresholds || getContextualThresholds(thresholdMode);

  const h1Analysis = useMemo(
    () => computeH1Analysis(validTurnTagged, tags),
    [validTurnTagged, tags]
  );

  const h1Summary = useMemo(
    () => summarizeH1(h1Analysis, activeThresholds),
    [h1Analysis, activeThresholds]
  );

  const statisticalSummaryData = useMemo(
    () => toStrategyStats(h1Analysis),
    [h1Analysis]
  );

  const detailedCriteria = useMemo(
    () => extractDetailedCriteria(h1Summary),
    [h1Summary]
  );

  if (loadingGlobalData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          Chargement des données de recherche...
        </Typography>
      </Box>
    );
  }

  if (errorGlobalData) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Erreur lors du chargement : {errorGlobalData}
      </Alert>
    );
  }

  if (!validTurnTagged.length) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
          Aucune donnée valide pour l'analyse H1
        </Typography>
        <Typography variant="body2">Vérifications requises :</Typography>
        <Box component="ul" sx={{ ml: 2, mt: 1 }}>
          <Typography component="li" variant="body2">
            Tags conseiller : REFLET, ENGAGEMENT, OUVERTURE, EXPLICATION
            uniquement
          </Typography>
          <Typography component="li" variant="body2">
            Tags client : CLIENT POSITIF, CLIENT NEGATIF, CLIENT NEUTRE
            uniquement
          </Typography>
          <Typography component="li" variant="body2">
            Paires adjacentes complètes (verbatim + next_turn_verbatim)
          </Typography>
        </Box>
      </Alert>
    );
  }

  // Vérification de l'adéquation de l'échantillon
  const sampleSizeWarning = h1Summary.sampleSizeAdequate === false;
  const totalSamples = validTurnTagged.length;

  return (
    <Box sx={{ width: "100%" }}>
      {/* En-tête avec informations de validation */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Science color="primary" /> Level 2 - Validation Empirique Hypothèse
          H1
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          "Les descriptions d'actions (ENGAGEMENT + OUVERTURE) génèrent plus de
          réactions positives que les explications"
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Chip
            label={`${totalSamples} paires adjacentes`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`${h1Analysis.length} stratégies détectées`}
            variant="outlined"
            size="small"
          />
          {selectedOrigin && (
            <Chip
              label={`Origine: ${selectedOrigin}`}
              color="primary"
              size="small"
            />
          )}
          <Chip
            label={`Confiance: ${h1Summary.confidence || "MEDIUM"}`}
            color={
              h1Summary.confidence === "HIGH"
                ? "success"
                : h1Summary.confidence === "LOW"
                ? "error"
                : "info"
            }
            size="small"
          />
          <Chip
            label={`Mode: ${thresholdMode}`}
            onClick={() => {
              const modes: ("STRICT" | "REALISTIC" | "EMPIRICAL")[] = [
                "STRICT",
                "REALISTIC",
                "EMPIRICAL",
              ];
              const current = modes.indexOf(thresholdMode);
              setThresholdMode(modes[(current + 1) % modes.length]);
            }}
            color="secondary"
            size="small"
            variant={thresholdMode === "REALISTIC" ? "filled" : "outlined"}
          />
        </Box>

        {thresholdMode === "STRICT" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Mode STRICT : Seuils académiques rigoureux (Actions ≥50% positif,
            ≤25% négatif)
          </Alert>
        )}
        {thresholdMode === "REALISTIC" && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Mode RÉALISTE : Seuils ajustés pour corpus réels (Actions ≥40%
            positif, ≤35% négatif)
          </Alert>
        )}
        {thresholdMode === "EMPIRICAL" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Mode EMPIRIQUE : Seuils calibrés sur vos données (Actions ≥35%
            positif, ≤30% négatif)
          </Alert>
        )}

        {/* Avertissements sur la taille d'échantillon */}
        {sampleSizeWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Échantillon insuffisant pour conclusions définitives
            </Typography>
            <Typography variant="body2">
              Recommandé: ≥{activeThresholds.sample.minNTotal} échantillons
              total, ≥{activeThresholds.sample.minNPerGroup} par stratégie
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Synthèse de validation H1 améliorée */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Assessment color="primary" />
          Synthèse de Validation H1 (Critères Complets)
        </Typography>

        {/* Score de validation global */}
        {detailedCriteria && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Score de validation: {detailedCriteria.overallScore} /{" "}
              {detailedCriteria.maxScore} critères satisfaits
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                (detailedCriteria.overallScore / detailedCriteria.maxScore) *
                100
              }
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.grey[300], 0.5),
                "& .MuiLinearProgress-bar": {
                  backgroundColor:
                    detailedCriteria.overallScore >=
                    activeThresholds.validation.minScoreForValidated
                      ? theme.palette.success.main
                      : detailedCriteria.overallScore >=
                        activeThresholds.validation.minScoreForPartial
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                },
              }}
            />
          </Box>
        )}

        {/* Critères en grille avec Box + Flexbox */}
        {detailedCriteria && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            {detailedCriteria.criteriaDetails.map((criterion, idx) => (
              <Box
                key={idx}
                sx={{
                  flex: "1 1 250px",
                  minWidth: 250,
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    backgroundColor: criterion.met
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.error.main, 0.1),
                    border: `1px solid ${
                      criterion.met
                        ? theme.palette.success.main
                        : theme.palette.error.main
                    }`,
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      {criterion.met ? (
                        <CheckCircle
                          sx={{
                            fontSize: 18,
                            color: theme.palette.success.main,
                          }}
                        />
                      ) : (
                        <Cancel
                          sx={{ fontSize: 18, color: theme.palette.error.main }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", fontSize: "0.8rem" }}
                      >
                        {criterion.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                    >
                      {criterion.value} (seuil: {criterion.threshold})
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {/* Badge synthèse H1 global */}
        <Alert
          severity={
            h1Summary.overallValidation === "VALIDATED"
              ? "success"
              : h1Summary.overallValidation === "PARTIALLY_VALIDATED"
              ? "info"
              : "warning"
          }
          sx={{ mt: 2 }}
        >
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Validation H1 :{" "}
            {h1Summary.overallValidation === "VALIDATED"
              ? "PLEINEMENT SUPPORTÉE"
              : h1Summary.overallValidation === "PARTIALLY_VALIDATED"
              ? "PARTIELLEMENT SUPPORTÉE"
              : "NON SUPPORTÉE"}
          </Typography>
          <Typography variant="body2">
            Actions: {h1Summary.actionsAverage.toFixed(1)}% positif,{" "}
            {(h1Summary.actionsNegativeAverage || 0).toFixed(1)}% négatif |
            Explications: {h1Summary.explanationPositive.toFixed(1)}% positif,{" "}
            {(h1Summary.explanationNegative || 0).toFixed(1)}% négatif | Écart:
            +{h1Summary.empiricalDifference.toFixed(1)} pts
          </Typography>
        </Alert>
      </Paper>

      {/* Tableau des résultats par stratégie */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Résultats H1 - Efficacité par Stratégie
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
              >
                <TableCell sx={{ fontWeight: "bold" }}>Stratégie</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Échantillon
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.success.main }}
                >
                  Positif
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.error.main }}
                >
                  Négatif
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: theme.palette.warning.main }}
                >
                  Neutre
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Efficacité
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Validation H1
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {h1Analysis.map((s) => {
                const isAction =
                  s.strategy === "ENGAGEMENT" || s.strategy === "OUVERTURE";
                const isExplanation = s.strategy === "EXPLICATION";

                // Vérification des critères H1 pour cette stratégie
                let meetsH1Criteria = true;
                let criteriaMessage = "";

                if (isAction) {
                  const meetsPositive =
                    s.positiveRate >= activeThresholds.actions.minPositiveRate;
                  const meetsNegative =
                    s.negativeRate <= activeThresholds.actions.maxNegativeRate;
                  meetsH1Criteria = meetsPositive && meetsNegative;
                  criteriaMessage = meetsH1Criteria
                    ? "Conforme H1"
                    : `Critères: ${meetsPositive ? "✓" : "✗"} Pos≥${
                        activeThresholds.actions.minPositiveRate
                      }%, ${meetsNegative ? "✓" : "✗"} Neg≤${
                        activeThresholds.actions.maxNegativeRate
                      }%`;
                } else if (isExplanation) {
                  const meetsPositive =
                    s.positiveRate <=
                    activeThresholds.explanations.maxPositiveRate;
                  const meetsNegative =
                    s.negativeRate >=
                    activeThresholds.explanations.minNegativeRate;
                  meetsH1Criteria = meetsPositive && meetsNegative;
                  criteriaMessage = meetsH1Criteria
                    ? "Conforme H1"
                    : `Critères: ${meetsPositive ? "✓" : "✗"} Pos≤${
                        activeThresholds.explanations.maxPositiveRate
                      }%, ${meetsNegative ? "✓" : "✗"} Neg≥${
                        activeThresholds.explanations.minNegativeRate
                      }%`;
                } else {
                  criteriaMessage = "Hors H1";
                }

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
                    <TableCell align="center">{s.totalSamples}</TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            s.positiveRate >
                            activeThresholds.statistical.cramersVThreshold * 100
                              ? theme.palette.success.main
                              : "inherit",
                        }}
                      >
                        {s.positiveRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({s.positiveCount})
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            s.negativeRate > 50
                              ? theme.palette.error.main
                              : "inherit",
                        }}
                      >
                        {s.negativeRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({s.negativeCount})
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography>{s.neutralRate}%</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({s.neutralCount})
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        sx={{
                          fontWeight: "bold",
                          color:
                            s.effectiveness > 0
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        {s.effectiveness > 0 ? "+" : ""}
                        {s.effectiveness}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={meetsH1Criteria ? <CheckCircle /> : <Cancel />}
                        label={meetsH1Criteria ? "CONFORME" : "NON CONFORME"}
                        color={meetsH1Criteria ? "success" : "error"}
                        size="small"
                        title={criteriaMessage}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Onglets */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab label="Aperçu H1" icon={<TrendingUp />} iconPosition="start" />
        <Tab
          label="Données Détaillées"
          icon={<Assessment />}
          iconPosition="start"
        />
        <Tab
          label="Tests Statistiques"
          icon={<Science />}
          iconPosition="start"
        />
        <Tab
          label="Rapport Académique"
          icon={<Assignment />}
          iconPosition="start"
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {/* Critères détaillés en accordion ou grille */}
        {detailedCriteria && showDetailedCriteria && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Critères H1 Détaillés
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              {detailedCriteria.criteriaDetails.map((criterion, idx) => (
                <Box
                  key={idx}
                  sx={{
                    flex: "1 1 300px",
                    minWidth: 300,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        {criterion.met ? (
                          <CheckCircle
                            sx={{ color: theme.palette.success.main }}
                          />
                        ) : (
                          <Cancel sx={{ color: theme.palette.error.main }} />
                        )}
                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                          {criterion.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Valeur: {criterion.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Seuil: {criterion.threshold}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
                        {criterion.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>

            {/* Avertissements si présents */}
            {detailedCriteria.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Avertissements:
                </Typography>
                {detailedCriteria.warnings.map((warning, idx) => (
                  <Typography key={idx} variant="body2">
                    • {warning}
                  </Typography>
                ))}
              </Alert>
            )}
          </Paper>
        )}

        {/* Bouton pour afficher/masquer les critères détaillés */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Chip
            label={
              showDetailedCriteria
                ? "Masquer critères détaillés"
                : "Afficher critères détaillés"
            }
            onClick={() => setShowDetailedCriteria(!showDetailedCriteria)}
            color="primary"
            variant="outlined"
            icon={showDetailedCriteria ? <Cancel /> : <Info />}
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Stratégie</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Positif (nb)</TableCell>
                <TableCell align="center">Négatif (nb)</TableCell>
                <TableCell align="center">Neutre (nb)</TableCell>
                <TableCell align="center">Validation H1</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {h1Analysis.map((s) => {
                const isAction =
                  s.strategy === "ENGAGEMENT" || s.strategy === "OUVERTURE";
                const isExplanation = s.strategy === "EXPLICATION";

                let meetsH1 = true;
                if (isAction) {
                  meetsH1 =
                    s.positiveRate >=
                      activeThresholds.actions.minPositiveRate &&
                    s.negativeRate <= activeThresholds.actions.maxNegativeRate;
                } else if (isExplanation) {
                  meetsH1 =
                    s.positiveRate <=
                      activeThresholds.explanations.maxPositiveRate &&
                    s.negativeRate >=
                      activeThresholds.explanations.minNegativeRate;
                }

                return (
                  <TableRow key={s.strategy}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {s.strategy}
                    </TableCell>
                    <TableCell align="center">{s.totalSamples}</TableCell>
                    <TableCell align="center">{s.positiveCount}</TableCell>
                    <TableCell align="center">{s.negativeCount}</TableCell>
                    <TableCell align="center">{s.neutralCount}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={meetsH1 ? "✓" : "✗"}
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
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <StatisticalTestsPanel data={h1Analysis} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <StatisticalSummary
          data={statisticalSummaryData}
          validationResults={h1Summary}
        />
      </TabPanel>
    </Box>
  );
};

export default Level2Interface;
