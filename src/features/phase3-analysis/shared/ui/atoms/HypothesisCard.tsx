// ============= shared/atoms/HypothesisCard.tsx =============
import React from "react";
import { Box, Typography } from "@mui/material";

interface HypothesisCardProps {
  code: string;
  title: string;
  description: string;
  result: string | number;
  status: "validated" | "partial" | "pending";
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  code,
  title,
  description,
  result,
  status,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "validated":
        return "✅";
      case "partial":
        return "⚙️";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "rgba(255,255,255,0.1)",
        p: 2,
        borderRadius: 1,
        textAlign: "center",
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        {getStatusIcon()} {code}
      </Typography>
      <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2">
        {description}: {result}
      </Typography>
    </Box>
  );
};

export default HypothesisCard;
