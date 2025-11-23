// 🧩 ATOM - ColorLegend
// shared/atoms/ColorLegend.tsx

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

interface LegendItem {
  color: string;
  label: string;
}

export interface ColorLegendProps {
  items?: LegendItem[];
  thresholds?: {
    excellent: number;
    good: number;
  };
}

export const ColorLegend: React.FC<ColorLegendProps> = ({
  items,
  thresholds = { excellent: 80, good: 70 },
}) => {
  const theme = useTheme();

  // Items par défaut basés sur les seuils
  const defaultItems: LegendItem[] = [
    {
      color: theme.palette.success.main,
      label: `≥ ${thresholds.excellent}% - Excellent`,
    },
    {
      color: theme.palette.warning.main,
      label: `${thresholds.good}-${thresholds.excellent - 1}% - Bon`,
    },
    {
      color: theme.palette.error.main,
      label: `< ${thresholds.good}% - À améliorer`,
    },
  ];

  const legendItems = items || defaultItems;

  return (
    <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
      {legendItems.map((item, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: item.color,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption">{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ColorLegend;
