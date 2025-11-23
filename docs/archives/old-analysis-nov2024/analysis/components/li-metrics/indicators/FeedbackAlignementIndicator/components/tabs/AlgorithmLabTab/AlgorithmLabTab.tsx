// AlgorithmLabTab.tsx - Composant principal de l'onglet Algorithm Lab
import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Science as ScienceIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Quiz as TestIcon,
} from "@mui/icons-material";

// Types de base pour la Phase 1
interface AlgorithmLabTabProps {
  selectedOrigin?: string | null;
  showDetailedResults?: boolean;
}

type AlgorithmType = "basic" | "lica";
type ActiveZone = "configuration" | "results" | "testing";

interface AlgorithmConfig {
  name: AlgorithmType;
  parameters: {
    thresholds: Record<string, number>;
    weights: Record<string, number>;
  };
  lastModified: Date;
}

const AlgorithmLabTab: React.FC<AlgorithmLabTabProps> = ({
  selectedOrigin,
  showDetailedResults = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // États principaux
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<AlgorithmType>("lica");
  const [activeZone, setActiveZone] = useState<ActiveZone>("configuration");
  const [isInitialized, setIsInitialized] = useState(false);

  // Configuration par défaut
  const [algorithmConfig, setAlgorithmConfig] = useState<AlgorithmConfig>({
    name: "lica",
    parameters: {
      thresholds: {
        minimumVerbatimLength: 8,
        collaborationThreshold: 0.6,
        coherenceThreshold: 0.5,
      },
      weights: {
        strategicEffectiveness: 0.7,
        turnCoherence: 0.3,
      },
    },
    lastModified: new Date(),
  });

  // Styles adaptatifs
  const getAdaptiveStyles = () => ({
    mainContainer: {
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha(theme.palette.grey[50], 0.9),
      minHeight: "600px",
    },
    zoneCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.9)
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      height: "100%",
    },
    activeZoneCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.primary.dark, 0.1)
        : alpha(theme.palette.primary.light, 0.1),
      border: `2px solid ${theme.palette.primary.main}`,
    },
    headerGradient: {
      background: isDark
        ? "linear-gradient(135deg, #1a237e 0%, #3949ab 100%)"
        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
  });

  const adaptiveStyles = getAdaptiveStyles();

  // Handlers pour navigation
  const handleZoneChange = useCallback((zone: ActiveZone) => {
    setActiveZone(zone);
  }, []);

  const handleAlgorithmChange = useCallback((algorithm: AlgorithmType) => {
    setSelectedAlgorithm(algorithm);
    setAlgorithmConfig((prev) => ({
      ...prev,
      name: algorithm,
      lastModified: new Date(),
    }));
  }, []);

  // Initialisation (Phase 1 - simulation)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Initialisation Algorithm Lab...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Chargement de l'environnement de test
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: 2, ...adaptiveStyles.mainContainer }}>
      {/* En-tête avec contexte */}
      <Card sx={{ mb: 3, ...adaptiveStyles.headerGradient }}>
        <CardContent>
          <Typography
            variant="h4"
            sx={{
              color: "white",
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <ScienceIcon fontSize="large" />
            Algorithm Lab - Environnement de Test
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.9)", mb: 3 }}
          >
            Optimisation et validation des algorithmes d'analyse
            conversationnelle
            {selectedOrigin && ` • Origine filtrée: ${selectedOrigin}`}
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label={`Algorithme: ${selectedAlgorithm.toUpperCase()}`}
              sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            />
            <Chip
              label={`Zone active: ${activeZone.toUpperCase()}`}
              sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            />
            <Chip
              label="Phase 1 - MVP"
              sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Navigation entre zones */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {[
          { key: "configuration", label: "Configuration", icon: SettingsIcon },
          { key: "results", label: "Résultats", icon: AnalyticsIcon },
          { key: "testing", label: "Tests", icon: TestIcon },
        ].map(({ key, label, icon: Icon }) => (
          <Card
            key={key}
            sx={{
              flex: 1,
              cursor: "pointer",
              transition: "all 0.3s ease",
              ...adaptiveStyles.zoneCard,
              ...(activeZone === key ? adaptiveStyles.activeZoneCard : {}),
            }}
            onClick={() => handleZoneChange(key as ActiveZone)}
          >
            <CardContent sx={{ textAlign: "center", py: 2 }}>
              <Icon
                color={activeZone === key ? "primary" : "inherit"}
                sx={{ fontSize: 32, mb: 1 }}
              />
              <Typography
                variant="h6"
                color={activeZone === key ? "primary" : "inherit"}
                fontWeight={activeZone === key ? "bold" : "normal"}
              >
                {label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Layout principal en 3 zones */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: activeZone === "testing" ? "1fr" : "1fr 1fr",
          gridTemplateRows: activeZone === "testing" ? "auto 1fr" : "1fr",
          gap: 3,
          minHeight: "500px",
        }}
      >
        {/* Zone Configuration */}
        {(activeZone === "configuration" || activeZone === "results") && (
          <Card sx={adaptiveStyles.zoneCard}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SettingsIcon color="primary" />
                Configuration Algorithme
              </Typography>

              {/* Sélecteur d'algorithme basique */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Algorithme sélectionné:
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {(["basic", "lica"] as AlgorithmType[]).map((algo) => (
                    <Chip
                      key={algo}
                      label={algo.toUpperCase()}
                      onClick={() => handleAlgorithmChange(algo)}
                      color={selectedAlgorithm === algo ? "primary" : "default"}
                      variant={
                        selectedAlgorithm === algo ? "filled" : "outlined"
                      }
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Paramètres basiques - Phase 1 */}
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Phase 1 - MVP:</strong> Interface de configuration
                  basique. Les contrôles avancés seront disponibles en Phase 2.
                </Typography>
              </Alert>

              <Box sx={{ space: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Paramètres actuels ({selectedAlgorithm.toUpperCase()}):
                </Typography>

                {Object.entries(algorithmConfig.parameters.thresholds).map(
                  ([key, value]) => (
                    <Box key={key} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {key}:{" "}
                        {typeof value === "number" ? value.toFixed(1) : value}
                      </Typography>
                    </Box>
                  )
                )}
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                Dernière modification:{" "}
                {algorithmConfig.lastModified.toLocaleTimeString()}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Zone Résultats */}
        {(activeZone === "results" || activeZone === "configuration") && (
          <Card sx={adaptiveStyles.zoneCard}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <AnalyticsIcon color="success" />
                Résultats de Validation
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Phase 1 - MVP:</strong> Métriques simulées. Les vrais
                  tests commenceront en Sprint 1.3.
                </Typography>
              </Alert>

              {/* Métriques simulées pour Phase 1 */}
              <Box sx={{ space: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Métriques globales (simulation):
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="h4" color="primary">
                      78.5%
                    </Typography>
                    <Typography variant="caption">Accuracy</Typography>
                  </Box>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="h4" color="success.main">
                      156
                    </Typography>
                    <Typography variant="caption">Tests</Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Algorithme testé: {selectedAlgorithm.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dernière exécution: Simulation Phase 1
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Zone Tests - Pleine largeur quand active */}
        {activeZone === "testing" && (
          <Card sx={{ ...adaptiveStyles.zoneCard, gridColumn: "1 / -1" }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TestIcon color="warning" />
                Échantillon de Test
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Phase 1 - MVP:</strong> Interface de test simulée.
                  L'échantillonnage réel sera implémenté en Sprint 1.3.
                </Typography>
              </Alert>

              {/* Simulation échantillon de test */}
              <Box sx={{ space: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Échantillon de validation (simulation):
                </Typography>

                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 2,
                    backgroundColor: isDark
                      ? alpha(theme.palette.background.default, 0.5)
                      : alpha(theme.palette.grey[50], 0.8),
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Cas #1 (simulation):</strong>
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontStyle: "italic", mb: 1 }}
                  >
                    Conseiller: "je vais vérifier ça pour vous tout de suite"
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontStyle: "italic", mb: 2 }}
                  >
                    Client: "d'accord merci beaucoup"
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Chip
                      label="Tag manuel: ENGAGEMENT"
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label="Prédiction: ENGAGEMENT"
                      size="small"
                      color="success"
                    />
                    <Chip
                      label="Match ✓"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, display: "block" }}
                >
                  Échantillon: 1/50 (simulation) • Navigation et tests réels en
                  Sprint 1.3
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Footer avec informations de développement */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          textAlign: "center",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Algorithm Lab v1.0 - Phase 1 MVP • Sprint 1.1: Structure et navigation
          ✓
        </Typography>
      </Box>
    </Box>
  );
};

export default AlgorithmLabTab;
