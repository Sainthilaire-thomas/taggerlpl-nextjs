// src/components/cognitive-metrics/components/IndicatorCard.tsx

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { CategoryData } from "../types";
import MetricBox from "./MetricBox";

interface IndicatorCardProps extends CategoryData {
  onMetricInfoClick?: (key: string) => void;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  description,
  metrics,
  onMetricInfoClick,
}) => {
  const theme = useTheme();

  const getCardStyle = () => ({
    height: "100%",
    bgcolor:
      theme.palette.mode === "dark"
        ? `${color}.dark`
        : color === "primary"
        ? "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)"
        : color === "warning"
        ? "linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%)"
        : "linear-gradient(135deg, #e8f5e8 0%, #e1f5fe 100%)",
    border: theme.palette.mode === "dark" ? 1 : 0,
    borderColor: theme.palette.mode === "dark" ? "divider" : "transparent",
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow:
        theme.palette.mode === "dark"
          ? "0 8px 25px rgba(0,0,0,0.3)"
          : "0 8px 25px rgba(0,0,0,0.15)",
    },
  });

  const getAvatarStyle = () => ({
    bgcolor: `${color}.light`,
    width: 48,
    height: 48,
  });

  return (
    <Card sx={getCardStyle()}>
      <CardHeader
        avatar={<Avatar sx={getAvatarStyle()}>{icon}</Avatar>}
        title={title}
        subheader={subtitle}
        titleTypographyProps={{
          variant: "h6",
          fontWeight: 600,
        }}
        subheaderTypographyProps={{
          variant: "body2",
          color: "text.secondary",
        }}
      />

      <CardContent sx={{ pt: 0 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 3 }}
        >
          {description}
        </Typography>

        <Box sx={{ mt: 3 }}>
          {metrics.map((metric) => (
            <MetricBox
              key={metric.key}
              metricKey={metric.key}
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              color={metric.color}
              loading={metric.loading}
              onInfoClick={onMetricInfoClick}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default IndicatorCard;
