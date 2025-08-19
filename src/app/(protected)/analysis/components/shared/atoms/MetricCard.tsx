// ============= shared/atoms/MetricCard.tsx =============
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  useTheme,
} from "@mui/material";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "compact" | "detailed" | "hero";
  color?: string;
  progress?: { label: string; value: number; color?: string };
  onClick?: () => void;
  children?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  variant = "compact",
  color,
  progress,
  onClick,
  children,
}) => {
  const theme = useTheme();

  const getCardStyle = () => ({
    height: "100%",
    cursor: onClick ? "pointer" : "default",
    background: color
      ? `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`
      : "background.paper",
    border: color ? `1px solid ${color}30` : "1px solid",
    borderColor: color ? `${color}30` : "divider",
    transition: "all 0.3s ease",
    ...(onClick && {
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: theme.shadows[8],
      },
    }),
  });

  return (
    <Card sx={getCardStyle()} onClick={onClick}>
      <CardContent sx={{ p: variant === "compact" ? 2 : 3 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {title}
        </Typography>

        <Typography
          variant={
            variant === "hero" ? "h3" : variant === "detailed" ? "h4" : "h5"
          }
          sx={{
            color: color || "primary.main",
            fontWeight: "bold",
            mb: 1,
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {progress && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="caption">{progress.label}</Typography>
              <Typography
                variant="caption"
                color={progress.color || "text.secondary"}
              >
                {progress.value.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress.value}
              sx={{
                height: 4,
                bgcolor: "grey.200",
                borderRadius: 2,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: progress.color || "primary.main",
                },
              }}
            />
          </Box>
        )}

        {children}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
