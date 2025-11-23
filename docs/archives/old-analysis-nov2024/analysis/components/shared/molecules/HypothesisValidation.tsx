// src/app/(protected)/analysis/components/shared/molecules/HypothesisValidation.tsx

import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { Assessment as MetricsIcon } from "@mui/icons-material";
import { HypothesisCard, ResponsiveGrid } from "../atoms";

interface HypothesisData {
  H1: { result: string; status: "validated" | "partial" | "pending" };
  H2: { result: string; status: "validated" | "partial" | "pending" };
  H3: { result: string; status: "validated" | "partial" | "pending" };
}

interface HypothesisValidationProps {
  hypothesisData: HypothesisData;
  variant?: "compact" | "detailed" | "inline" | "standalone";
}

export const HypothesisValidation: React.FC<HypothesisValidationProps> = ({
  hypothesisData,
  variant = "standalone",
}) => {
  const hypotheses = [
    {
      code: "H1",
      title: "Actions → Traitement automatique",
      description: "REFLET + ENGAGEMENT",
      result: hypothesisData.H1.result,
      status: hypothesisData.H1.status,
    },
    {
      code: "H2",
      title: "Explications → Charge cognitive",
      description: "EXPLICATION",
      result: hypothesisData.H2.result,
      status: hypothesisData.H2.status,
    },
    {
      code: "H3",
      title: "Modulation contextuelle",
      description: "Différentiel REFLET vs EXPLICATION",
      result: hypothesisData.H3.result,
      status: hypothesisData.H3.status,
    },
  ];

  // Vue compacte - format simplifié
  if (variant === "compact") {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <MetricsIcon />
          🔬 Validation des Hypothèses
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {hypotheses.map((hypothesis) => (
            <Box
              key={hypothesis.code}
              sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor:
                  hypothesis.status === "validated"
                    ? "success.light"
                    : hypothesis.status === "partial"
                    ? "warning.light"
                    : "grey.200",
                color:
                  hypothesis.status === "validated"
                    ? "success.contrastText"
                    : hypothesis.status === "partial"
                    ? "warning.contrastText"
                    : "text.primary",
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {hypothesis.code}: {hypothesis.title}
              </Typography>
              <Typography variant="body2">{hypothesis.result}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  // Vue détaillée - format étendu
  if (variant === "detailed") {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <MetricsIcon />
          🔬 Validation des Hypothèses Scientifiques - Vue Détaillée
        </Typography>

        <ResponsiveGrid columns={{ xs: 1, md: 3 }} gap={3}>
          {hypotheses.map((hypothesis) => (
            <Paper
              key={hypothesis.code}
              sx={{
                p: 3,
                borderRadius: 2,
                border: 2,
                borderColor:
                  hypothesis.status === "validated"
                    ? "success.main"
                    : hypothesis.status === "partial"
                    ? "warning.main"
                    : "grey.300",
                backgroundColor:
                  hypothesis.status === "validated"
                    ? "success.light"
                    : hypothesis.status === "partial"
                    ? "warning.light"
                    : "grey.50",
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {hypothesis.code}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                {hypothesis.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {hypothesis.description}
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                📊 {hypothesis.result}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  color:
                    hypothesis.status === "validated"
                      ? "success.dark"
                      : hypothesis.status === "partial"
                      ? "warning.dark"
                      : "text.secondary",
                  fontWeight: "bold",
                }}
              >
                Statut:{" "}
                {hypothesis.status === "validated"
                  ? "✅ Validée"
                  : hypothesis.status === "partial"
                  ? "⚠️ Partielle"
                  : "⏳ En attente"}
              </Typography>
            </Paper>
          ))}
        </ResponsiveGrid>
      </Paper>
    );
  }

  // Vue inline - format en ligne
  if (variant === "inline") {
    return (
      <ResponsiveGrid columns={{ xs: 1, md: 3 }} gap={2}>
        {hypotheses.map((hypothesis) => (
          <HypothesisCard
            key={hypothesis.code}
            code={hypothesis.code}
            title={hypothesis.title}
            description={hypothesis.description}
            result={hypothesis.result}
            status={hypothesis.status}
          />
        ))}
      </ResponsiveGrid>
    );
  }

  // Vue standalone - format autonome (par défaut)
  return (
    <Paper
      sx={{
        p: 3,
        background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
        color: "white",
        mt: 3,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <MetricsIcon />
        🔬 Validation des Hypothèses Scientifiques
      </Typography>

      <ResponsiveGrid columns={{ xs: 1, md: 3 }} gap={2}>
        {hypotheses.map((hypothesis) => (
          <Box
            key={hypothesis.code}
            sx={{
              p: 2,
              borderRadius: 1,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {hypothesis.code}: {hypothesis.title}
            </Typography>
            <Typography variant="body2" gutterBottom>
              {hypothesis.description}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              📊 {hypothesis.result}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                fontWeight: "bold",
              }}
            >
              {hypothesis.status === "validated"
                ? "✅ Validée"
                : hypothesis.status === "partial"
                ? "⚠️ Partielle"
                : "⏳ En attente"}
            </Typography>
          </Box>
        ))}
      </ResponsiveGrid>
    </Paper>
  );
};

export default HypothesisValidation;
