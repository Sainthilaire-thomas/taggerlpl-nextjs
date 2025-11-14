// analysis/components/InsightCard.tsx
"use client";

import { FC, useMemo } from "react";
import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import { TrendingUp, Lightbulb } from "@mui/icons-material";
import { StrategyStats, InsightData } from "../types";

interface InsightCardProps {
  data: StrategyStats[];
}

const InsightCard: FC<InsightCardProps> = ({ data }) => {
  const theme = useTheme(); // 🎨 Utilisation du thème

  const insights: InsightData = useMemo(() => {
    if (data.length === 0) {
      return {
        mostEffective: "N/A",
        leastEffective: "N/A",
        maxDifference: 0,
        recommendation: "Aucune donnée disponible pour générer des insights.",
      };
    }

    const sortedByEffectiveness = [...data].sort(
      (a, b) => b.effectiveness - a.effectiveness
    );
    const mostEffective = sortedByEffectiveness[0];
    const leastEffective =
      sortedByEffectiveness[sortedByEffectiveness.length - 1];
    const maxDifference =
      mostEffective.effectiveness - leastEffective.effectiveness;

    let recommendation = "";
    if (maxDifference > 20) {
      recommendation = `Consider training agents to use more ${mostEffective.strategy.toLowerCase()} techniques and reduce reliance on ${leastEffective.strategy.toLowerCase()} approaches.`;
    } else if (maxDifference > 10) {
      recommendation = `${mostEffective.strategy} shows moderately better results. Focus on refining this approach.`;
    } else {
      recommendation =
        "All strategies show similar effectiveness. Consider context-specific training.";
    }

    return {
      mostEffective: mostEffective.strategy,
      leastEffective: leastEffective.strategy,
      maxDifference,
      recommendation,
    };
  }, [data]);

  return (
    <Card
      sx={{
        mb: 3,
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.02)"
            : "rgba(0, 0, 0, 0.02)", // 🎨 Fond adapté
        border: `1px solid ${theme.palette.divider}`, // 🎨 Bordure adaptée
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Lightbulb sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Key Insights
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Most Effective Strategy:</strong>{" "}
            <span style={{ color: theme.palette.success.main }}>
              {insights.mostEffective}
            </span>
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Least Effective Strategy:</strong>{" "}
            <span style={{ color: theme.palette.error.main }}>
              {insights.leastEffective}
            </span>
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Effectiveness Gap:</strong>{" "}
            <span
              style={{
                color:
                  insights.maxDifference > 15
                    ? theme.palette.warning.main
                    : theme.palette.text.primary,
              }}
            >
              {insights.maxDifference.toFixed(1)}%
            </span>
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(25, 118, 210, 0.1)" // Bleu foncé transparent en mode sombre
                : "rgba(25, 118, 210, 0.08)", // Bleu clair transparent en mode clair
            borderRadius: 1,
            borderLeft: `4px solid ${theme.palette.primary.main}`, // 🎨 Bordure adaptée
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontStyle: "italic",
              color: theme.palette.text.primary, // 🎨 Couleur de texte adaptée
            }}
          >
            <TrendingUp
              sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }}
            />
            {insights.recommendation}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
