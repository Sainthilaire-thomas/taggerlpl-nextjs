// analysis/components/PositiveReactionsChartSimple.tsx
"use client";

import { FC } from "react";
import { Typography, Box, LinearProgress, Paper } from "@mui/material";
import { StrategyStats } from "../types";

interface PositiveReactionsChartSimpleProps {
  data: StrategyStats[];
}

const PositiveReactionsChartSimple: FC<PositiveReactionsChartSimpleProps> = ({
  data,
}) => {
  const sortedData = [...data].sort((a, b) => b.positive - a.positive);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Positive Reactions by Strategy
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Pourcentage de réactions positives par stratégie (classé par efficacité)
      </Typography>

      {sortedData.map((item, index) => (
        <Box key={item.strategy} sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: "medium" }}>
              {item.strategy}
            </Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", color: "#4CAF50" }}
              >
                {item.positive.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({item.total} occurrences)
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={item.positive}
            sx={{
              height: 20,
              borderRadius: 2,
              backgroundColor: "#f5f5f5",
              "& .MuiLinearProgress-bar": {
                backgroundColor:
                  index === 0
                    ? "#4CAF50"
                    : index === 1
                    ? "#66BB6A"
                    : index === 2
                    ? "#81C784"
                    : "#A5D6A7",
                borderRadius: 2,
                transition: "all 0.3s ease",
              },
            }}
          />
          {/* Indicateur de rang */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              #{index + 1} most effective
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Effectiveness: {item.effectiveness > 0 ? "+" : ""}
              {item.effectiveness}%
            </Typography>
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

export default PositiveReactionsChartSimple;
