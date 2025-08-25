// Interface principale - components/shared/AlgorithmLabInterface.tsx
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Science as TestTube,
  CheckCircle,
  Warning as AlertTriangle,
  Error as XCircle,
  Info,
  Lock,
} from "@mui/icons-material";
import { useWorkflowManagement } from "../../hooks/useWorkflowManagement";
import { NavigationTabs } from "./NavigationTabs";
import { InterAnnotatorAgreement } from "../Level0/InterAnnotatorAgreement";
import { Level1Interface } from "../Level1/Level1Interface";
// Props pour l'intégration dans la page analysis
interface AlgorithmLabInterfaceProps {
  selectedOrigin?: string | null;
  availableDomains?: string[];
  availableIndicators?: string[];
}

export const AlgorithmLabInterface: React.FC<AlgorithmLabInterfaceProps> = ({
  selectedOrigin,
  availableDomains = [],
  availableIndicators = [],
}) => {
  const theme = useTheme();
  const { currentLevel, setCurrentLevel, validationLevels, canAccessLevel } =
    useWorkflowManagement();

  // Styles adaptatifs pour dark mode
  const getAdaptiveStyles = () => ({
    mainContainer: {
      minHeight: "100vh",
      backgroundColor: theme.palette.background.default,
    },
    headerPaper: {
      borderRadius: 0,
      marginBottom: theme.spacing(3),
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.95)
          : theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    levelContentBox: {
      padding: theme.spacing(6),
      textAlign: "center" as const,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.default, 0.5)
          : theme.palette.background.default,
    },
    prerequisitePaper: {
      marginTop: theme.spacing(4),
      padding: theme.spacing(4),
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.primary.dark, 0.2)
          : alpha(theme.palette.primary.light, 0.8),
      color: theme.palette.text.primary,
      border: `1px solid ${
        theme.palette.mode === "dark"
          ? alpha(theme.palette.primary.main, 0.3)
          : alpha(theme.palette.primary.main, 0.2)
      }`,
    },
    footerPaper: {
      marginTop: theme.spacing(4),
      padding: theme.spacing(2),
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.7)
          : alpha(theme.palette.grey[50], 0.9),
      border: `1px solid ${theme.palette.divider}`,
    },
    gridItem: {
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.5)
          : alpha(theme.palette.background.paper, 0.8),
      padding: theme.spacing(1),
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.divider}`,
    },
  });

  const styles = getAdaptiveStyles();

  const renderCurrentLevel = () => {
    switch (currentLevel) {
      case 0:
        return <InterAnnotatorAgreement />;
      case 1:
        return <Level1Interface />;
      case 2:
        return (
          <Box sx={styles.levelContentBox}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
            >
              Validation Scientifique
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Test des hypothèses de recherche H1-H2-H3
            </Typography>
            <Paper sx={styles.prerequisitePaper}>
              <Typography
                variant="body2"
                sx={{ mb: 2, color: theme.palette.text.primary }}
              >
                <strong>Prérequis :</strong> Niveaux 0 et 1 validés
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.primary.dark,
                }}
              >
                Indicateurs: {availableIndicators.join(", ") || "Aucun"}
              </Typography>
            </Paper>
          </Box>
        );
      default:
        return <InterAnnotatorAgreement />;
    }
  };

  return (
    <Box sx={styles.mainContainer}>
      {/* Header adapté pour intégration */}
      <Paper elevation={1} sx={styles.headerPaper}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                    : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TestTube sx={{ color: "white", fontSize: "24px" }} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
                >
                  Algorithm Lab
                </Typography>
                <Chip
                  label="v1.0"
                  size="small"
                  sx={{
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.secondary.main, 0.8)
                        : theme.palette.secondary.light,
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.secondary.contrastText
                        : theme.palette.secondary.contrastText,
                  }}
                />
              </Box>
              <Typography variant="body1" color="text.secondary">
                Framework de validation scientifique à 3 niveaux - Intégré au
                Centre d'Analyse
              </Typography>
              {selectedOrigin && (
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.primary.main, mt: 0.5 }}
                >
                  Origine sélectionnée: <strong>{selectedOrigin}</strong>
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Navigation */}
      <Box sx={{ px: 3, mb: 3 }}>
        <NavigationTabs
          levels={validationLevels}
          currentLevel={currentLevel}
          onLevelChange={setCurrentLevel}
          canAccessLevel={canAccessLevel}
        />
      </Box>

      {/* Contenu */}
      <Box sx={{ px: 3 }}>{renderCurrentLevel()}</Box>

      {/* Footer adapté */}
      <Paper elevation={1} sx={styles.footerPaper}>
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            <strong>Validation séquentielle :</strong> Gold Standard →
            Performance Technique → Hypothèses Scientifiques
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 2,
              fontSize: "0.75rem",
            }}
          >
            <Box sx={styles.gridItem}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  display: "block",
                  color: theme.palette.text.primary,
                }}
              >
                Niveau 0: Accord inter-annotateur
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Kappa de Cohen, résolution désaccords
              </Typography>
            </Box>
            <Box sx={styles.gridItem}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  display: "block",
                  color: theme.palette.text.primary,
                }}
              >
                Niveau 1: Performance algorithmes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Accuracy, F1-Score, matrices confusion
              </Typography>
            </Box>
            <Box sx={styles.gridItem}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "bold",
                  display: "block",
                  color: theme.palette.text.primary,
                }}
              >
                Niveau 2: Tests hypothèses
              </Typography>
              <Typography variant="caption" color="text.secondary">
                H1 (Efficacité), H2 (Cognitif), H3 (Pratique)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

// Export unique par défaut pour l'intégration
export default AlgorithmLabInterface;
