// src/components/cognitive-metrics/components/MetricBox.tsx

import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Info as InfoIcon } from "@mui/icons-material";
import { MetricData } from "../types";

interface MetricBoxProps {
  metricKey: string;
  title: string;
  value: string | number;
  subtitle: string;
  color?: "primary" | "warning" | "success" | "error";
  loading?: boolean;
  onInfoClick?: (key: string) => void;
}

const MetricBox: React.FC<MetricBoxProps> = ({
  metricKey,
  title,
  value,
  subtitle,
  color = "primary",
  loading = false,
  onInfoClick,
}) => {
  const theme = useTheme();

  const getMetricBoxStyle = () => ({
    p: 2,
    bgcolor: theme.palette.mode === "dark" ? "grey.800" : "background.paper",
    borderRadius: 1,
    mb: 2,
    border: theme.palette.mode === "dark" ? 1 : 0,
    borderColor: "divider",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow:
        theme.palette.mode === "dark"
          ? "0 4px 12px rgba(0,0,0,0.3)"
          : "0 4px 12px rgba(0,0,0,0.1)",
    },
  });

  const getValueColor = () => {
    switch (color) {
      case "primary":
        return "primary.main";
      case "warning":
        return "warning.main";
      case "success":
        return "success.main";
      case "error":
        return "error.main";
      default:
        return "primary.main";
    }
  };

  return (
    <Box sx={getMetricBoxStyle()}>
      {/* En-tête avec titre et bouton info */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: theme.palette.mode === "dark" ? "grey.200" : "grey.700",
          }}
        >
          {title}
        </Typography>

        {onInfoClick && (
          <Tooltip title="Cliquez pour plus d'informations">
            <IconButton
              size="small"
              onClick={() => onInfoClick(metricKey)}
              sx={{
                color: "action.secondary",
                "&:hover": {
                  color: getValueColor(),
                  bgcolor: "action.hover",
                },
              }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Valeur principale */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        {loading ? (
          <CircularProgress size={20} sx={{ color: getValueColor(), mr: 1 }} />
        ) : null}

        <Typography
          variant="h4"
          sx={{
            color: getValueColor(),
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </Typography>
      </Box>

      {/* Sous-titre */}
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          lineHeight: 1.3,
          display: "block",
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
};

export default MetricBox;
