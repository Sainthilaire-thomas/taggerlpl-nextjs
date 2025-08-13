import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
} from "@mui/material";
import {
  Psychology as CognitiveIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Import des nouveaux composants et données
import { IndicatorCard } from "./components";
import { indicatorDescriptions, categoryConfigs } from "./indicatorData";
import { CognitiveMetricsProps, FilterState, IndicatorKey } from "./types";

const CognitiveMetrics: React.FC<CognitiveMetricsProps> = ({
  defaultFilters,
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState<FilterState>({
    origine: defaultFilters?.origine || "",
    conseiller: "",
    strategyType: "",
    reactionType: "",
  });

  const [origins, setOrigins] = useState<string[]>([]);
  const [conseillers, setConseillers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(
    null
  );

  // Simulation de récupération des données
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setOrigins(["RATP", "LP", "SGR", "PASC"]);
        setConseillers(["Conseiller_A", "Conseiller_B", "Conseiller_C"]);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des options de filtre:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleIndicatorInfo = (indicatorKey: string) => {
    setSelectedIndicator(indicatorKey);
  };

  const handleCloseDialog = () => {
    setSelectedIndicator(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: "100%", maxWidth: "100%" }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor:
                theme.palette.mode === "dark" ? "purple.main" : "purple.light",
              width: 56,
              height: 56,
            }}
          >
            <CognitiveIcon fontSize="large" />
          </Avatar>
          <Typography variant="h3" component="h1" fontWeight="bold">
            Métriques Cognitives
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Analyse des mécanismes cognitifs selon le chapitre 3.3.4 de la thèse
        </Typography>
      </Box>

      {/* Section des filtres avec thème adaptatif */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          bgcolor:
            theme.palette.mode === "dark" ? "grey.900" : "background.paper",
          border: theme.palette.mode === "dark" ? 1 : 0,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <FilterIcon color="action" />
          <Typography variant="h6">Filtres d'analyse</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          <FormControl fullWidth>
            <InputLabel>Origine</InputLabel>
            <Select
              value={filters.origine}
              label="Origine"
              onChange={(e) => handleFilterChange("origine", e.target.value)}
            >
              <MenuItem value="">
                <em>Toutes les origines</em>
              </MenuItem>
              {origins.map((origin) => (
                <MenuItem key={origin} value={origin}>
                  {origin}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Conseiller</InputLabel>
            <Select
              value={filters.conseiller}
              label="Conseiller"
              onChange={(e) => handleFilterChange("conseiller", e.target.value)}
            >
              <MenuItem value="">
                <em>Tous les conseillers</em>
              </MenuItem>
              {conseillers.map((conseiller) => (
                <MenuItem key={conseiller} value={conseiller}>
                  {conseiller}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Type de stratégie</InputLabel>
            <Select
              value={filters.strategyType}
              label="Type de stratégie"
              onChange={(e) =>
                handleFilterChange("strategyType", e.target.value)
              }
            >
              <MenuItem value="">
                <em>Toutes les stratégies</em>
              </MenuItem>
              <MenuItem value="ENGAGEMENT">ENGAGEMENT</MenuItem>
              <MenuItem value="OUVERTURE">OUVERTURE</MenuItem>
              <MenuItem value="EXPLICATION">EXPLICATION</MenuItem>
              <MenuItem value="REFLET">REFLET (tous)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Type de réaction</InputLabel>
            <Select
              value={filters.reactionType}
              label="Type de réaction"
              onChange={(e) =>
                handleFilterChange("reactionType", e.target.value)
              }
            >
              <MenuItem value="">
                <em>Toutes les réactions</em>
              </MenuItem>
              <MenuItem value="CLIENT_POSITIF">Positif</MenuItem>
              <MenuItem value="CLIENT_NEUTRE">Neutre</MenuItem>
              <MenuItem value="CLIENT_NEGATIF">Négatif</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Filtres actifs */}
        {Object.entries(filters).some(([_, value]) => value !== "") && (
          <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2" sx={{ mr: 1, alignSelf: "center" }}>
              Filtres actifs :
            </Typography>
            {Object.entries(filters).map(
              ([key, value]) =>
                value !== "" && (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    onDelete={() => handleFilterChange(key, "")}
                    variant="outlined"
                    color="primary"
                  />
                )
            )}
          </Box>
        )}
      </Paper>

      {/* Section des métriques avec les nouveaux composants */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
          gap: 3,
        }}
      >
        {categoryConfigs.map((category) => (
          <IndicatorCard
            key={category.key}
            title={category.title}
            subtitle={category.subtitle}
            icon={category.icon}
            color={category.color}
            description={category.description}
            metrics={category.metrics}
            onMetricInfoClick={handleIndicatorInfo}
          />
        ))}
      </Box>

      {/* Section validation hypothèses */}
      <Paper
        sx={{
          p: 3,
          mt: 4,
          bgcolor:
            theme.palette.mode === "dark" ? "grey.900" : "background.paper",
          border: theme.palette.mode === "dark" ? 1 : 0,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" gutterBottom>
          🎯 Validation des Hypothèses Cognitives
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              H1: Traitement automatique
            </Typography>
            <Typography variant="body2">
              Les stratégies d'action (ENGAGEMENT, OUVERTURE) activent un
              traitement automatique mesurable par la fluidité cognitive.
            </Typography>
          </Alert>

          <Alert severity="warning">
            <Typography variant="subtitle2" gutterBottom>
              H2: Surcharge cognitive
            </Typography>
            <Typography variant="body2">
              Les explications génèrent une charge cognitive mesurable par les
              marqueurs d'effort et la résistance.
            </Typography>
          </Alert>

          <Alert severity="success">
            <Typography variant="subtitle2" gutterBottom>
              H3: Modulation contextuelle
            </Typography>
            <Typography variant="body2">
              L'efficacité différentielle s'accroît dans les contextes de stress
              émotionnel élevé.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      {/* Note de développement */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          📋 Statut de développement
        </Typography>
        <Typography variant="body2">
          Les conteneurs et filtres sont en place. Les indicateurs seront
          implémentés progressivement en se connectant à la table{" "}
          <Box
            component="code"
            sx={{
              bgcolor: theme.palette.mode === "dark" ? "grey.700" : "grey.100",
              px: 1,
              borderRadius: 1,
            }}
          >
            turntagged
          </Box>{" "}
          selon les spécifications du chapitre 3.3.4 de la thèse.
        </Typography>
      </Alert>

      {/* Dialog pour les descriptions détaillées */}
      <Dialog
        open={!!selectedIndicator}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedIndicator && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {indicatorDescriptions[selectedIndicator as IndicatorKey]?.title}
              <IconButton onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ space: 2 }}>
                <Typography variant="body1" paragraph>
                  <strong>Description :</strong>
                  <br />
                  {
                    indicatorDescriptions[selectedIndicator as IndicatorKey]
                      ?.description
                  }
                </Typography>

                <Typography variant="body1" paragraph>
                  <strong>Formule :</strong>
                  <br />
                  <Box
                    component="code"
                    sx={{
                      bgcolor:
                        theme.palette.mode === "dark" ? "grey.800" : "grey.100",
                      p: 1,
                      borderRadius: 1,
                      display: "block",
                      fontFamily: "monospace",
                    }}
                  >
                    {
                      indicatorDescriptions[selectedIndicator as IndicatorKey]
                        ?.formula
                    }
                  </Box>
                </Typography>

                <Typography variant="body1" paragraph>
                  <strong>Interprétation :</strong>
                  <br />
                  {
                    indicatorDescriptions[selectedIndicator as IndicatorKey]
                      ?.interpretation
                  }
                </Typography>

                <Typography variant="body1" paragraph>
                  <strong>Exemples :</strong>
                  <br />
                  {
                    indicatorDescriptions[selectedIndicator as IndicatorKey]
                      ?.examples
                  }
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Références :</strong>
                  <br />
                  {
                    indicatorDescriptions[selectedIndicator as IndicatorKey]
                      ?.references
                  }
                </Typography>
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CognitiveMetrics;
