// 🧩 ATOM - IndicatorHeader
// shared/atoms/IndicatorHeader.tsx

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

export interface IndicatorHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

export const IndicatorHeader: React.FC<IndicatorHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  color = "primary",
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 4,
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette[color].main}15 0%, ${theme.palette[color].main}05 100%)`,
        borderRadius: 2,
        border: `1px solid ${theme.palette[color].main}30`,
      }}
    >
      <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
      <Box>
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
};

export default IndicatorHeader;
