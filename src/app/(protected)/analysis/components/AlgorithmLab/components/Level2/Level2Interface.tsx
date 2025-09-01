// components/AlgorithmLab/Level2/Level2Interface.tsx
"use client";

import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import {
  Science,
  TrendingUp,
  Assessment,
  Assignment,
} from "@mui/icons-material";
import StatisticalTestsPanel from "./validation/StatisticalTestPanel";
import StatisticalSummary from "./validation/StatisticalSummary";

// Hook pour données
import { useTaggingData } from "@/context/TaggingDataContext";

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`level2-tabpanel-${index}`}
    aria-labelledby={`level2-tab-${index}`}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

interface StrategyAnalysis {
  strategy: string;
  totalSamples: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveRate: number;
  negativeRate: number;
  neutralRate: number;
  effectiveness: number;
}

interface Level2InterfaceProps {
  selectedOrigin?: string | null;
}

export const Level2Interface: React.FC<Level2InterfaceProps> = ({
  selectedOrigin,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Données depuis le contexte existant
  const { allTurnTagged, loadingGlobalData, errorGlobalData, tags } =
    useTaggingData();

  // ÉTAPE 1 : Filtrage strict selon les critères de la thèse
  // Remplacer la section ÉTAPE 1 par :
  const validTurnTagged = useMemo(() => {
    if (!allTurnTagged || !tags) return [];

    let filtered = allTurnTagged;

    // Filtre par origine si spécifiée
    if (selectedOrigin) {
      filtered = filtered.filter(
        (turn: any) => turn.call_origine === selectedOrigin
      );
    }

    // ✅ CORRECTION : Utiliser la même logique que Level1
    // 1. Familles valides pour conseillers (depuis tags/family)
    const VALID_FAMILIES = new Set([
      "ENGAGEMENT",
      "OUVERTURE",
      "REFLET",
      "EXPLICATION",
    ]);
    const allowedConseillerLabels = new Set(
      tags
        .filter((t: any) => t?.family && VALID_FAMILIES.has(t.family))
        .map((t: any) => t.label?.replace(/\s+/g, "_").toUpperCase())
    );

    // 2. Tags client normalisés (sans underscore)
    const VALID_CLIENT_REACTIONS = [
      "CLIENT POSITIF",
      "CLIENT NEGATIF",
      "CLIENT NEUTRE",
    ];

    filtered = filtered.filter((turn: any) => {
      // Données complètes requises
      const hasCompleteData =
        turn.verbatim?.trim() &&
        turn.tag?.trim() &&
        turn.next_turn_verbatim?.trim() &&
        turn.next_turn_tag?.trim();

      // ✅ Validation conseiller par famille (comme Level1)
      const conseillerTagNormalized = turn.tag
        ?.replace(/\s+/g, "_")
        .toUpperCase();
      const validConseillerTag = allowedConseillerLabels.has(
        conseillerTagNormalized
      );

      // ✅ Validation client sans underscore
      const validClientTag = VALID_CLIENT_REACTIONS.includes(
        turn.next_turn_tag
      );

      return hasCompleteData && validConseillerTag && validClientTag;
    });

    console.log(
      `Level2 - Données filtrées : ${filtered.length} paires valides`
    );
    console.log(
      `Familles conseiller détectées : ${Array.from(
        allowedConseillerLabels
      ).join(", ")}`
    );

    return filtered;
  }, [allTurnTagged, selectedOrigin, tags]);

  // ÉTAPE 2 : Calcul des statistiques H1 (simple et robuste)
  const h1Analysis = useMemo((): StrategyAnalysis[] => {
    if (!validTurnTagged.length) return [];

    // Normalisation REFLET_* → REFLET
    const normalizeStrategy = (tag: string, allTags: any[]): string => {
      // Trouver la famille correspondant à ce tag
      const tagObj = allTags?.find(
        (t) =>
          t.label?.replace(/\s+/g, "_").toUpperCase() ===
          tag?.replace(/\s+/g, "_").toUpperCase()
      );

      if (tagObj?.family) {
        return tagObj.family.toUpperCase();
      }

      // Fallback sur la logique précédente
      if (tag?.startsWith("REFLET")) return "REFLET";
      return tag?.toUpperCase() || "UNKNOWN";
    };

    // Normalisation réactions client
    const normalizeReaction = (
      nextTurnTag: string
    ): "positive" | "negative" | "neutral" => {
      const normalized = nextTurnTag?.toUpperCase().replace(/\s+/g, " ");
      if (normalized?.includes("CLIENT POSITIF")) return "positive";
      if (normalized?.includes("CLIENT NEGATIF")) return "negative";
      return "neutral";
    };

    // Groupement par stratégie normalisée
    const strategyGroups: Record<string, any[]> = {};

    validTurnTagged.forEach((turn) => {
      const strategy = normalizeStrategy(turn.tag, tags); // ✅ Ajout du 2e paramètre
      if (!strategyGroups[strategy]) {
        strategyGroups[strategy] = [];
      }
      strategyGroups[strategy].push({
        ...turn,
        reaction: normalizeReaction(turn.next_turn_tag || ""), // ✅ Protection undefined
      });
    });

    // Calcul des métriques par stratégie
    const results = Object.entries(strategyGroups).map(([strategy, turns]) => {
      const totalSamples = turns.length;

      const positiveCount = turns.filter(
        (t) => t.reaction === "positive"
      ).length;
      const negativeCount = turns.filter(
        (t) => t.reaction === "negative"
      ).length;
      const neutralCount = turns.filter((t) => t.reaction === "neutral").length;

      // Vérification que les totaux correspondent
      const checkSum = positiveCount + negativeCount + neutralCount;
      if (checkSum !== totalSamples) {
        console.warn(
          `Incohérence comptage ${strategy}: ${checkSum} !== ${totalSamples}`
        );
      }

      const positiveRate =
        totalSamples > 0 ? (positiveCount / totalSamples) * 100 : 0;
      const negativeRate =
        totalSamples > 0 ? (negativeCount / totalSamples) * 100 : 0;
      const neutralRate =
        totalSamples > 0 ? (neutralCount / totalSamples) * 100 : 0;
      const effectiveness = positiveRate - negativeRate;

      return {
        strategy,
        totalSamples,
        positiveCount,
        negativeCount,
        neutralCount,
        positiveRate: Math.round(positiveRate * 10) / 10,
        negativeRate: Math.round(negativeRate * 10) / 10,
        neutralRate: Math.round(neutralRate * 10) / 10,
        effectiveness: Math.round(effectiveness * 10) / 10,
      };
    });

    console.log("H1 Analysis calculé:", results);
    return results.sort((a, b) => b.effectiveness - a.effectiveness);
  }, [validTurnTagged]);

  // ÉTAPE 3 : Validation H1 selon les critères de la thèse
  const h1Validation = useMemo(() => {
    if (!h1Analysis.length) return null;

    const engagement = h1Analysis.find((d) => d.strategy === "ENGAGEMENT");
    const ouverture = h1Analysis.find((d) => d.strategy === "OUVERTURE");
    const explication = h1Analysis.find((d) => d.strategy === "EXPLICATION");
    const reflet = h1Analysis.find((d) => d.strategy === "REFLET");

    // Moyennes des actions (selon H1)
    let actionsPositive = 0;
    let actionsCount = 0;
    if (engagement) {
      actionsPositive += engagement.positiveRate;
      actionsCount++;
    }
    if (ouverture) {
      actionsPositive += ouverture.positiveRate;
      actionsCount++;
    }
    actionsPositive = actionsCount > 0 ? actionsPositive / actionsCount : 0;

    const explanationPositive = explication?.positiveRate || 0;
    const differenceActions = actionsPositive - explanationPositive;

    // Critères de validation H1 (selon la thèse : Actions > 50%, Explications < 5%)
    const criteriaMet = {
      actionsAbove50: actionsPositive > 50,
      explanationsBelow5: explanationPositive < 5,
      significantDifference: differenceActions > 30,
    };

    const h1Supported = Object.values(criteriaMet).filter(Boolean).length >= 2;

    return {
      engagement,
      ouverture,
      explication,
      reflet,
      actionsPositive,
      explanationPositive,
      differenceActions,
      criteriaMet,
      h1Supported,
      totalValidPairs: validTurnTagged.length,
    };
  }, [h1Analysis, validTurnTagged]);

  const statisticalSummaryData = useMemo(() => {
    return h1Analysis.map((strategy) => ({
      strategy: strategy.strategy,
      total: strategy.totalSamples, // totalSamples → total
      positive: strategy.positiveRate, // positiveRate → positive
      negative: strategy.negativeRate, // negativeRate → negative
      neutral: strategy.neutralRate, // neutralRate → neutral
      effectiveness: strategy.effectiveness,
    }));
  }, [h1Analysis]);

  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
  };

  // États d'erreur
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
            Tags client : CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE
            uniquement
          </Typography>
          <Typography component="li" variant="body2">
            Paires adjacentes complètes (verbatim + next_turn_verbatim non
            vides)
          </Typography>
        </Box>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header simple */}
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
          <Science color="primary" />
          Level 2 - Validation Empirique Hypothèse H1
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          "Les descriptions d'actions (ENGAGEMENT + OUVERTURE) génèrent plus de
          réactions positives que les explications"
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={`${validTurnTagged.length} paires adjacentes`}
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
        </Box>
      </Paper>

      {/* Résultats H1 directs */}
      {h1Validation && (
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
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.success.main,
                    }}
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
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.warning.main,
                    }}
                  >
                    Neutre
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    Efficacité
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {h1Analysis.map((strategy) => (
                  <TableRow key={strategy.strategy}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {strategy.strategy}
                      {(strategy.strategy === "ENGAGEMENT" ||
                        strategy.strategy === "OUVERTURE") && (
                        <Chip
                          label="ACTION"
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                      {strategy.strategy === "EXPLICATION" && (
                        <Chip
                          label="EXPLICATION"
                          size="small"
                          color="secondary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {strategy.totalSamples}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          color:
                            strategy.positiveRate > 40
                              ? theme.palette.success.main
                              : "inherit",
                        }}
                      >
                        {strategy.positiveRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({strategy.positiveCount})
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          color:
                            strategy.negativeRate > 50
                              ? theme.palette.error.main
                              : "inherit",
                        }}
                      >
                        {strategy.negativeRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({strategy.negativeCount})
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1">
                        {strategy.neutralRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({strategy.neutralCount})
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          color:
                            strategy.effectiveness > 0
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        {strategy.effectiveness > 0 ? "+" : ""}
                        {strategy.effectiveness}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Validation H1 */}
          <Alert
            severity={h1Validation.h1Supported ? "success" : "warning"}
            sx={{ mt: 3 }}
          >
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              Validation H1 :{" "}
              {h1Validation.h1Supported ? "SUPPORTÉE" : "NON SUPPORTÉE"}
            </Typography>
            <Typography variant="body2">
              Actions moyennes : {h1Validation.actionsPositive.toFixed(1)}% |
              Explications : {h1Validation.explanationPositive.toFixed(1)}% |
              Différence : +{h1Validation.differenceActions.toFixed(1)} points
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`Actions > 50% : ${
                  h1Validation.criteriaMet.actionsAbove50 ? "✓" : "✗"
                }`}
                color={
                  h1Validation.criteriaMet.actionsAbove50 ? "success" : "error"
                }
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Explications < 5% : ${
                  h1Validation.criteriaMet.explanationsBelow5 ? "✓" : "✗"
                }`}
                color={
                  h1Validation.criteriaMet.explanationsBelow5
                    ? "success"
                    : "error"
                }
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Différence > 30pts : ${
                  h1Validation.criteriaMet.significantDifference ? "✓" : "✗"
                }`}
                color={
                  h1Validation.criteriaMet.significantDifference
                    ? "success"
                    : "error"
                }
                size="small"
              />
            </Box>
          </Alert>
        </Paper>
      )}

      {/* Navigation simplifiée */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
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

        <Tab label="Debug Filtrage" icon={<Science />} iconPosition="start" />
        <Tab
          label="Rapport Académique"
          icon={<Assignment />}
          iconPosition="start"
        />
      </Tabs>

      {/* Contenu des onglets */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Synthèse Validation H1
          </Typography>

          {h1Validation ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {h1Analysis.map((strategy) => (
                <Paper
                  key={strategy.strategy}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    minWidth: 200,
                    backgroundColor:
                      strategy.effectiveness > 30
                        ? alpha(theme.palette.success.main, 0.1)
                        : strategy.effectiveness < -30
                        ? alpha(theme.palette.error.main, 0.1)
                        : alpha(theme.palette.grey[500], 0.1),
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {strategy.strategy}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: "bold",
                      color:
                        strategy.effectiveness > 30
                          ? theme.palette.success.main
                          : strategy.effectiveness < -30
                          ? theme.palette.error.main
                          : "inherit",
                    }}
                  >
                    {strategy.positiveRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {strategy.positiveCount}/{strategy.totalSamples} réactions
                    positives
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 1 }}
                  >
                    Efficacité : {strategy.effectiveness > 0 ? "+" : ""}
                    {strategy.effectiveness}%
                  </Typography>
                </Paper>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              Aucune donnée suffisante pour la validation H1
            </Alert>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Données Brutes par Stratégie
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Stratégie</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Positif (nb)</TableCell>
                  <TableCell align="center">Négatif (nb)</TableCell>
                  <TableCell align="center">Neutre (nb)</TableCell>
                  <TableCell align="center">Vérification</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {h1Analysis.map((strategy) => {
                  const checkSum =
                    strategy.positiveCount +
                    strategy.negativeCount +
                    strategy.neutralCount;
                  const isValid = checkSum === strategy.totalSamples;

                  return (
                    <TableRow key={strategy.strategy}>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {strategy.strategy}
                      </TableCell>
                      <TableCell align="center">
                        {strategy.totalSamples}
                      </TableCell>
                      <TableCell align="center">
                        {strategy.positiveCount}
                      </TableCell>
                      <TableCell align="center">
                        {strategy.negativeCount}
                      </TableCell>
                      <TableCell align="center">
                        {strategy.neutralCount}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={isValid ? "✓ OK" : `✗ ${checkSum}`}
                          color={isValid ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <StatisticalTestsPanel data={h1Analysis} />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Debug - Filtrage des Données
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total allTurnTagged : {allTurnTagged?.length || 0}
              <br />
              Après filtrage H1 : {validTurnTagged.length}
              <br />
              Stratégies détectées :{" "}
              {h1Analysis.map((s) => s.strategy).join(", ")}
            </Typography>
          </Alert>

          {/* Échantillon des données filtrées */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Échantillon (5 premières paires) :
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: "auto" }}>
              {validTurnTagged.slice(0, 5).map((turn: any, index: number) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="primary">
                    {turn.tag} → {turn.next_turn_tag}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Conseiller: "{turn.verbatim}"
                  </Typography>
                  <Typography variant="body2">
                    Client: "{turn.next_turn_verbatim}"
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        <StatisticalSummary data={statisticalSummaryData} />
      </TabPanel>
    </Box>
  );
};

export default Level2Interface;
