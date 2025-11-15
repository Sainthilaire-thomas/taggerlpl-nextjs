"use client";
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Chip,
  Slider,
  TextField,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

type RunPanelProps = {
  isRunning: boolean;
  isConfigValid: boolean;
  goldStandardCount: number;
  sampleSize: number;
  onSampleSizeChange: (n: number) => void;
  onRun: () => void;
  // Optionnel: infos de badge domaine / batch
  domainLabel?: string;
  supportsBatch?: boolean;
};

export const RunPanel: React.FC<RunPanelProps> = ({
  isRunning,
  isConfigValid,
  goldStandardCount,
  sampleSize,
  onSampleSizeChange,
  onRun,
  domainLabel = "Général",
  supportsBatch = false,
}) => {
  const max = Math.max(1, goldStandardCount);
  const min = Math.min(10, max);
  const step = Math.max(1, Math.round(max / 50)); // ~50 crans

  const handleSlider = (_: Event, value: number | number[]) => {
    onSampleSizeChange(Array.isArray(value) ? value[0] : value);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v)) {
      onSampleSizeChange(Math.min(max, Math.max(min, Math.floor(v))));
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Colonne infos + slider */}
          <Box sx={{ flex: "1 1 520px", minWidth: 300 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">
                Test de Performance Individuel
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Échantillon gold standard : {goldStandardCount} paires
                adjacentes
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`Domaine: ${domainLabel}`} size="small" />
                {supportsBatch && (
                  <Chip label="Support batch" size="small" color="info" />
                )}
                <Chip
                  label={
                    isConfigValid ? "Config: ✅ Valide" : "Config: ❌ Invalide"
                  }
                  size="small"
                  color={isConfigValid ? "success" : "warning"}
                  variant="outlined"
                />
              </Stack>

              {/* Slider de taille d'échantillon */}
              <Box sx={{ px: 1, pt: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Taille de l’échantillon de test :{" "}
                  <strong>
                    {sampleSize} / {goldStandardCount || 0}
                  </strong>
                </Typography>

                <Slider
                  value={Math.min(sampleSize, max)}
                  min={min}
                  max={max}
                  step={step}
                  onChange={handleSlider}
                  valueLabelDisplay="auto"
                  disabled={goldStandardCount === 0}
                  marks={[
                    { value: min, label: `${min}` },
                    {
                      value: Math.round(max * 0.25),
                      label: `${Math.round(max * 0.25)}`,
                    },
                    {
                      value: Math.round(max * 0.5),
                      label: `${Math.round(max * 0.5)}`,
                    },
                    {
                      value: Math.round(max * 0.75),
                      label: `${Math.round(max * 0.75)}`,
                    },
                    { value: max, label: `${max}` },
                  ]}
                />

                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Taille"
                    size="small"
                    type="number"
                    inputProps={{ min, max }}
                    value={Math.min(sampleSize, max)}
                    onChange={handleInput}
                    sx={{ width: 120 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    min {min} • max {max} • pas {step}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* Colonne action */}
          <Box
            sx={{
              flex: "0 1 280px",
              minWidth: 220,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={onRun}
                disabled={
                  isRunning ||
                  !isConfigValid ||
                  goldStandardCount === 0 ||
                  sampleSize < min
                }
                startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
                size="large"
              >
                {isRunning ? "Test en cours..." : "Lancer test"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RunPanel;
