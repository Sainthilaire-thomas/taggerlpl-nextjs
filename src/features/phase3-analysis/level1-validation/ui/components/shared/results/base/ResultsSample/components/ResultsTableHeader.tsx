"use client";
import React from "react";
import {
  Stack,
  Typography,
  Chip,
  Button,
  FormControlLabel,
  Switch,
  Box,
  alpha,
  useTheme,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { TVValidationResult } from "../types";
import type { ExtraColumn } from "../../extraColumns";

export interface ResultsTableHeaderProps {
  totalResults: number;
  totalErrors: number;
  filteredResults: TVValidationResult[];
  onlyDisagreements: boolean;
  onOnlyDisagreementsChange: (value: boolean) => void;
  isExtracting?: boolean;
  onExtractFineTuning?: () => void;
  /** ← FIX: optionnel, pas d’affectation par défaut dans une interface */
  extraColumns?: ExtraColumn[];
}

export const ResultsTableHeader: React.FC<ResultsTableHeaderProps> = ({
  totalResults,
  totalErrors,
  filteredResults,
  onlyDisagreements,
  onOnlyDisagreementsChange,
  isExtracting = false,
  onExtractFineTuning,
  /** on accepte la prop pour éviter les erreurs TS même si on ne l’utilise pas ici */
  extraColumns = [],
}) => {
  const theme = useTheme();

  // Calcul des métriques
  const errorRate = totalResults > 0 ? (totalErrors / totalResults) * 100 : 0;
  const hasAnnotations = filteredResults.some(
    (r) => r.metadata?.turnId || r.metadata?.id
  );

  return (
    <Box sx={{ mb: 3 }}>
      {/* Titre principal */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2, flexWrap: "wrap", rowGap: 2 }}
      >
        <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
          Échantillon de Résultats
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexWrap: "wrap" }}
        >
          {onExtractFineTuning && (
            <Button
              variant="outlined"
              startIcon={<SmartToyIcon />}
              onClick={onExtractFineTuning}
              disabled={isExtracting || totalErrors === 0 || !hasAnnotations}
              size="small"
              color="secondary"
              sx={{
                ...(isExtracting && {
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                    "100%": { opacity: 1 },
                  },
                }),
              }}
            >
              {isExtracting ? "Extraction..." : "Fine-tuning"}
            </Button>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={onlyDisagreements}
                onChange={(_, v) => onOnlyDisagreementsChange(v)}
                size="small"
                color="warning"
              />
            }
            label="Désaccords uniquement"
            sx={{ m: 0 }}
          />
        </Stack>
      </Stack>

      {/* Métriques et statistiques */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          p: 2,
          backgroundColor: alpha(
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[50],
            0.7
          ),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Chip
          label={`Total: ${totalResults}`}
          size="small"
          color="primary"
          variant="outlined"
        />

        <Chip
          label={`Erreurs: ${totalErrors}`}
          size="small"
          color={totalErrors > 0 ? "error" : "success"}
          variant="filled"
          sx={{ fontWeight: "bold" }}
        />

        <Chip
          label={`Taux d'erreur: ${errorRate.toFixed(1)}%`}
          size="small"
          color={
            errorRate < 10 ? "success" : errorRate < 25 ? "warning" : "error"
          }
          variant="outlined"
        />

        {onlyDisagreements && totalErrors > 0 && (
          <Chip
            label="Mode analyse d'erreurs"
            size="small"
            color="warning"
            variant="filled"
            sx={{
              animation: "glow 2s infinite alternate",
              "@keyframes glow": {
                "0%": { boxShadow: `0 0 5px ${theme.palette.warning.main}` },
                "100%": { boxShadow: `0 0 15px ${theme.palette.warning.main}` },
              },
            }}
          />
        )}

        {!hasAnnotations && onExtractFineTuning && (
          <Chip
            label="⚠️ Ajoutez des annotations"
            size="small"
            color="default"
            variant="outlined"
            sx={{ fontStyle: "italic", opacity: 0.7 }}
          />
        )}
      </Stack>

      {/* Message d'aide contextuel */}
      {totalErrors === 0 && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          }}
        >
          <Typography
            variant="body2"
            color="success.main"
            sx={{ fontWeight: "medium" }}
          >
            🎉 Excellent ! Aucune erreur détectée dans cet échantillon.
          </Typography>
        </Box>
      )}

      {totalErrors > 0 && totalErrors === totalResults && onlyDisagreements && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          }}
        >
          <Typography
            variant="body2"
            color="warning.main"
            sx={{ fontWeight: "medium" }}
          >
            🔍 Mode analyse d'erreurs activé - Seuls les désaccords sont
            affichés
          </Typography>
        </Box>
      )}
    </Box>
  );
};
