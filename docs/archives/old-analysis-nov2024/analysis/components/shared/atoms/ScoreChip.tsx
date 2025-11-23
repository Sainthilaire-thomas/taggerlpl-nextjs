// 🧩 ATOM - ScoreChip
// shared/atoms/ScoreChip.tsx

import React from "react";
import { Chip, useTheme, alpha } from "@mui/material";

export interface ScoreChipProps {
  value: number;
  suffix?: string;
  precision?: number;
  thresholds?: {
    excellent: number; // ≥ excellent = success
    good: number; // ≥ good = warning
    // < good = error
  };
}

export const ScoreChip: React.FC<ScoreChipProps> = ({
  value,
  suffix = "%",
  precision = 1,
  thresholds = { excellent: 80, good: 70 },
}) => {
  const theme = useTheme();

  // Logique de coloration selon seuils
  const getScoreColor = () => {
    if (value >= thresholds.excellent) return theme.palette.success.main;
    if (value >= thresholds.good) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const color = getScoreColor();
  const displayValue = `${value.toFixed(precision)}${suffix}`;

  return (
    <Chip
      label={displayValue}
      sx={{
        backgroundColor: alpha(color, 0.2),
        color: color,
        fontWeight: "bold",
      }}
    />
  );
};

export default ScoreChip;
