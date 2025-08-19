// ============= shared/atoms/ResponsiveGrid.tsx =============
import React from "react";
import { Box } from "@mui/material";

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: string;
  gap?: number;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = "280px",
  gap = 2,
  columns,
}) => {
  const gridStyle = columns
    ? {
        display: "grid",
        gridTemplateColumns: {
          xs: `repeat(${columns.xs || 1}, 1fr)`,
          sm: `repeat(${columns.sm || 2}, 1fr)`,
          md: `repeat(${columns.md || 3}, 1fr)`,
          lg: `repeat(${columns.lg || 4}, 1fr)`,
        },
        gap,
      }
    : {
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        gap,
      };

  return <Box sx={gridStyle}>{children}</Box>;
};

export default ResponsiveGrid;
