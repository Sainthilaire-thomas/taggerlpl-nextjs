// components/Level1/ParameterOptimization.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Slider,
  Button,
  Alert,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Tune, PlayArrow, RestartAlt } from "@mui/icons-material";
import { AlgorithmConfig } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

// ---------- Types locaux forts ----------
type ParameterMap = Record<string, number>;

interface ParameterOptimizationProps {
  // On conserve AlgorithmConfig pour compat, mais on ne suppose rien dessus
  algorithm: AlgorithmConfig;
  onParametersChange: (params: Record<string, any>) => void;
  onTestWithParameters: (params: Record<string, any>) => void;
  isRunning?: boolean;
}

// Valeurs par défaut sûres selon le "type" d'algo
const DEFAULTS_CONSEILLER: ParameterMap = {
  seuilEngagement: 0.6,
  seuilOuverture: 0.5,
  seuilExplication: 0.4,
  seuilReflet: 0.3,
  poidsExpressions: 2.0,
  poidsMots: 1.0,
};

const DEFAULTS_CLIENT: ParameterMap = {
  seuilPositif: 0.6,
  seuilNegatif: 0.4,
  poidsExpressions: 2.0,
  poidsMots: 1.0,
};

export const ParameterOptimization: React.FC<ParameterOptimizationProps> = ({
  algorithm,
  onParametersChange,
  onTestWithParameters,
  isRunning = false,
}) => {
  // Détermine le type d'algo de façon robuste
  const algoKind: "conseiller" | "client" =
    (algorithm as any)?.type === "conseiller" ? "conseiller" : "client";

  // Calcule les paramètres initiaux (defaults + override éventuel par algorithm.parameters)
  const initialParams = useMemo<ParameterMap>(() => {
    const base =
      algoKind === "conseiller" ? DEFAULTS_CONSEILLER : DEFAULTS_CLIENT;
    const incoming = ((algorithm as any)?.parameters ?? {}) as Record<
      string,
      unknown
    >;

    // ne garder que les nombres valides
    const numericIncoming: ParameterMap = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        numericIncoming[k] = v;
      }
    }
    return { ...base, ...numericIncoming };
  }, [algorithm, algoKind]);

  // État local typé : fini les "unknown"
  const [localParams, setLocalParams] = useState<ParameterMap>(initialParams);
  const [autoOptimize, setAutoOptimize] = useState<boolean>(false);
  // Si l'algo change, on resynchronise l'état local
  useEffect(() => {
    setLocalParams(initialParams);
  }, [initialParams]);

  // MàJ générique d’un paramètre
  const handleParameterChange = (
    paramName: keyof ParameterMap,
    value: number
  ) => {
    const newParams: ParameterMap = { ...localParams, [paramName]: value };
    setLocalParams(newParams);
    onParametersChange(newParams);
  };

  const resetToDefaults = () => {
    const defaults =
      algoKind === "conseiller" ? DEFAULTS_CONSEILLER : DEFAULTS_CLIENT;
    setLocalParams(defaults);
    onParametersChange(defaults);
  };

  const runOptimizedTest = () => {
    onTestWithParameters(localParams);
  };

  const renderConseillerParameters = () => {
    const seuilEngagement = localParams.seuilEngagement ?? 0.6;
    const seuilOuverture = localParams.seuilOuverture ?? 0.5;
    const seuilExplication = localParams.seuilExplication ?? 0.4;
    const seuilReflet = localParams.seuilReflet ?? 0.3;

    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
          Seuils de Classification
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Seuil ENGAGEMENT: {seuilEngagement.toFixed(2)}
            </Typography>
            <Slider
              value={seuilEngagement}
              onChange={(_, value) =>
                handleParameterChange("seuilEngagement", value as number)
              }
              min={0.1}
              max={1.0}
              step={0.05}
              marks={[
                { value: 0.3, label: "0.3" },
                { value: 0.6, label: "0.6" },
                { value: 0.9, label: "0.9" },
              ]}
            />
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Seuil OUVERTURE: {seuilOuverture.toFixed(2)}
            </Typography>
            <Slider
              value={seuilOuverture}
              onChange={(_, value) =>
                handleParameterChange("seuilOuverture", value as number)
              }
              min={0.1}
              max={1.0}
              step={0.05}
              marks={[
                { value: 0.3, label: "0.3" },
                { value: 0.5, label: "0.5" },
                { value: 0.8, label: "0.8" },
              ]}
            />
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Seuil EXPLICATION: {seuilExplication.toFixed(2)}
            </Typography>
            <Slider
              value={seuilExplication}
              onChange={(_, value) =>
                handleParameterChange("seuilExplication", value as number)
              }
              min={0.1}
              max={1.0}
              step={0.05}
              marks={[
                { value: 0.2, label: "0.2" },
                { value: 0.4, label: "0.4" },
                { value: 0.7, label: "0.7" },
              ]}
            />
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Seuil REFLET: {seuilReflet.toFixed(2)}
            </Typography>
            <Slider
              value={seuilReflet}
              onChange={(_, value) =>
                handleParameterChange("seuilReflet", value as number)
              }
              min={0.1}
              max={1.0}
              step={0.05}
              marks={[
                { value: 0.1, label: "0.1" },
                { value: 0.3, label: "0.3" },
                { value: 0.6, label: "0.6" },
              ]}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderClientParameters = () => {
    const seuilPositif = localParams.seuilPositif ?? 0.6;
    const seuilNegatif = localParams.seuilNegatif ?? 0.4;

    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
          Seuils de Classification Client
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Seuil POSITIF: {seuilPositif.toFixed(2)}
            </Typography>
            <Slider
              value={seuilPositif}
              onChange={(_, value) =>
                handleParameterChange("seuilPositif", value as number)
              }
              min={0.2}
              max={1.0}
              step={0.05}
              marks={[
                { value: 0.4, label: "0.4" },
                { value: 0.6, label: "0.6" },
                { value: 0.8, label: "0.8" },
              ]}
            />
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Seuil NÉGATIF: {seuilNegatif.toFixed(2)}
            </Typography>
            <Slider
              value={seuilNegatif}
              onChange={(_, value) =>
                handleParameterChange("seuilNegatif", value as number)
              }
              min={0.1}
              max={0.8}
              step={0.05}
              marks={[
                { value: 0.2, label: "0.2" },
                { value: 0.4, label: "0.4" },
                { value: 0.6, label: "0.6" },
              ]}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderWeightParameters = () => {
    const poidsExpressions = localParams.poidsExpressions ?? 2.0;
    const poidsMots = localParams.poidsMots ?? 1.0;

    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
          Pondération des Features
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Poids Expressions: {poidsExpressions.toFixed(1)}
            </Typography>
            <Slider
              value={poidsExpressions}
              onChange={(_, value) =>
                handleParameterChange("poidsExpressions", value as number)
              }
              min={0.5}
              max={5.0}
              step={0.1}
              marks={[
                { value: 1.0, label: "1.0" },
                { value: 2.0, label: "2.0" },
                { value: 3.0, label: "3.0" },
              ]}
            />
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
            <Typography gutterBottom>
              Poids Mots: {poidsMots.toFixed(1)}
            </Typography>
            <Slider
              value={poidsMots}
              onChange={(_, value) =>
                handleParameterChange("poidsMots", value as number)
              }
              min={0.1}
              max={3.0}
              step={0.1}
              marks={[
                { value: 0.5, label: "0.5" },
                { value: 1.0, label: "1.0" },
                { value: 2.0, label: "2.0" },
              ]}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Tune />
        Optimisation des Paramètres
        <Chip
          label={String((algorithm as any)?.type ?? "")}
          size="small"
          color="primary"
        />
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Ajustez les paramètres ci-dessous et testez en temps réel l'impact sur
        les performances. Les changements sont appliqués immédiatement.
      </Alert>

      {algoKind === "conseiller"
        ? renderConseillerParameters()
        : renderClientParameters()}
      {renderWeightParameters()}

      <Box
        sx={{
          mt: 4,
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={autoOptimize}
              onChange={(e) => setAutoOptimize(e.target.checked)}
            />
          }
          label="Optimisation automatique"
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={resetToDefaults}
            disabled={isRunning}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={runOptimizedTest}
            disabled={isRunning}
          >
            {isRunning ? "Test en cours..." : "Tester Configuration"}
          </Button>
        </Box>
      </Box>

      {autoOptimize && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          L'optimisation automatique n'est pas encore implémentée. Utilisez
          l'ajustement manuel pour le moment.
        </Alert>
      )}
    </Paper>
  );
};

export default ParameterOptimization;
