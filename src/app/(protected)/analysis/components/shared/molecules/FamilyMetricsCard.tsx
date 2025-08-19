// src/app/(protected)/analysis/components/shared/molecules/FamilyMetricCard.tsx

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";

interface FamilyData {
  family: string;
  score: number;
  baseUsage: number;
  color: string;
  resistance: number;
  cognitiveLoad: number;
}

interface FamilyMetricCardProps {
  familyData: FamilyData;
  showDetails?: boolean;
  onFamilyClick?: (familyName: string) => void;
}

const FamilyMetricCard: React.FC<FamilyMetricCardProps> = ({
  familyData,
  showDetails = true,
  onFamilyClick,
}) => {
  const theme = useTheme();

  // Styles adaptatifs pour le thème dark/light
  const getAdaptiveStyles = () => ({
    card: {
      p: 3,
      borderRadius: 2,
      cursor: onFamilyClick ? "pointer" : "default",
      transition: "all 0.3s ease-in-out",
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.8)
          : theme.palette.background.paper,
      border: `1px solid ${
        theme.palette.mode === "dark"
          ? alpha(theme.palette.divider, 0.3)
          : theme.palette.divider
      }`,
      "&:hover": onFamilyClick
        ? {
            transform: "translateY(-2px)",
            boxShadow:
              theme.palette.mode === "dark"
                ? `0 8px 24px ${alpha(familyData.color, 0.3)}`
                : `0 8px 24px ${alpha(familyData.color, 0.2)}`,
            borderColor: alpha(familyData.color, 0.5),
          }
        : {},
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 2,
    },
    scoreContainer: {
      textAlign: "center" as const,
      mb: 2,
    },
    progressBar: {
      height: 8,
      borderRadius: 1,
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.grey[700], 0.3)
          : alpha(theme.palette.grey[300], 0.5),
    },
    metricLabel: {
      color:
        theme.palette.mode === "dark"
          ? theme.palette.text.secondary
          : theme.palette.text.secondary,
      fontSize: "0.75rem",
    },
  });

  const styles = getAdaptiveStyles();

  const handleClick = () => {
    if (onFamilyClick) {
      onFamilyClick(familyData.family);
    }
  };

  return (
    <Paper sx={styles.card} onClick={handleClick}>
      {/* Header avec nom de famille et usage */}
      <Box sx={styles.header}>
        <Chip
          label={familyData.family}
          sx={{
            backgroundColor: alpha(familyData.color, 0.2),
            color:
              theme.palette.mode === "dark"
                ? theme.palette.getContrastText(familyData.color)
                : familyData.color,
            fontWeight: "bold",
            border: `1px solid ${alpha(familyData.color, 0.3)}`,
          }}
        />
        <Typography variant="caption" sx={styles.metricLabel}>
          {familyData.baseUsage} interactions
        </Typography>
      </Box>

      {/* Score principal */}
      <Box sx={styles.scoreContainer}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: familyData.color,
            textShadow:
              theme.palette.mode === "dark"
                ? `0 0 10px ${alpha(familyData.color, 0.5)}`
                : "none",
          }}
        >
          {familyData.score.toFixed(1)}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fluidité moyenne
        </Typography>
      </Box>

      {showDetails && (
        <>
          {/* Résistance */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2" sx={styles.metricLabel}>
                Résistance
              </Typography>
              <Typography variant="body2" sx={styles.metricLabel}>
                {familyData.resistance.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={familyData.resistance}
              sx={{
                ...styles.progressBar,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.palette.error.main,
                },
              }}
            />
          </Box>

          {/* Charge cognitive */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2" sx={styles.metricLabel}>
                Charge cognitive
              </Typography>
              <Typography variant="body2" sx={styles.metricLabel}>
                {familyData.cognitiveLoad.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={familyData.cognitiveLoad}
              sx={{
                ...styles.progressBar,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.palette.warning.main,
                },
              }}
            />
          </Box>

          {/* Distribution du traitement (simulation) */}
          <Box>
            <Typography variant="body2" sx={{ ...styles.metricLabel, mb: 1 }}>
              Distribution du traitement:
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Chip
                size="small"
                label="🚀 Auto: 60%"
                color="success"
                sx={{
                  fontSize: "0.7rem",
                  opacity: theme.palette.mode === "dark" ? 0.9 : 1,
                }}
              />
              <Chip
                size="small"
                label="⚡ Mixte: 30%"
                color="warning"
                sx={{
                  fontSize: "0.7rem",
                  opacity: theme.palette.mode === "dark" ? 0.9 : 1,
                }}
              />
              <Chip
                size="small"
                label="🧠 Contrôlé: 10%"
                color="error"
                sx={{
                  fontSize: "0.7rem",
                  opacity: theme.palette.mode === "dark" ? 0.9 : 1,
                }}
              />
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default FamilyMetricCard;
