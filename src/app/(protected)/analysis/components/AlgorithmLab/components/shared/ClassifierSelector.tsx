// components/shared/ClassifierSelector.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  Slider,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";

interface ClassifierMetaFromAPI {
  name: string; // registryName (ex: "OpenAIConseillerClassifier")
  registryName: string;
  displayName?: string; // joli nom
  type?: string; // "rule-based" | "ml" | "llm"...
  version?: string;
  supportsBatch?: boolean;
  isValid?: boolean;
  isAvailable?: boolean; // même chose ici
  description?: string;
  targetDomain?: string;
  requiresTraining?: boolean;
  requiresAPIKey?: boolean;
  categories?: string[];
  configSchema?: Record<string, any>;
}

type StatusResponse = {
  classifiers: ClassifierMetaFromAPI[];
};

interface ClassifierSelectorProps {
  selectedClassifier: string;
  onSelectClassifier: (name: string) => void;
  showDescription?: boolean;
  showConfiguration?: boolean;
}

export const ClassifierSelector: React.FC<ClassifierSelectorProps> = ({
  selectedClassifier,
  onSelectClassifier,
  showDescription = true,
  showConfiguration = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [classifiers, setClassifiers] = useState<ClassifierMetaFromAPI[]>([]);
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [configValid, setConfigValid] = useState<boolean>(true);

  // Récupère la liste depuis le serveur
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/algolab/classifiers", {
          cache: "no-store",
        });
        const data: StatusResponse = await res.json();
        if (!mounted) return;
        setClassifiers(data.classifiers ?? []);
      } catch (e) {
        console.warn("Impossible de charger les classificateurs:", e);
        setClassifiers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Classement/tri (optionnel)
  const sorted = useMemo(() => {
    const arr = [...classifiers];
    // 1) disponibles d’abord, 2) par label
    arr.sort((a, b) => {
      const av = (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0);
      if (av !== 0) return av;
      const an = a.displayName || a.registryName;
      const bn = b.displayName || b.registryName;
      return an.localeCompare(bn, "fr");
    });
    return arr;
  }, [classifiers]);

  // Métadonnées du classif courant
  const current = useMemo(
    () => sorted.find((c) => c.registryName === selectedClassifier),
    [sorted, selectedClassifier]
  );

  // Initialisation de la config par défaut quand on change de classificateur
  useEffect(() => {
    if (!current?.configSchema) return;
    const defaults: Record<string, any> = {};
    Object.entries(current.configSchema).forEach(([key, schema]) => {
      const s = typeof schema === "object" ? schema : { type: "string" };
      if ("default" in s) defaults[key] = s.default;
    });
    setConfiguration(defaults);
    // On considère la config valide si le classificateur est disponible
    setConfigValid(Boolean(current.isAvailable));
  }, [current?.registryName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si la valeur sélectionnée n’existe pas (au 1er rendu), on choisit une valeur sûre
  useEffect(() => {
    if (loading) return;
    const exists = sorted.some((c) => c.registryName === selectedClassifier);
    if (!exists) {
      // on prend le 1er dispo, sinon le 1er tout court, sinon vide
      const fallback =
        sorted.find((c) => c.isAvailable)?.registryName ||
        sorted[0]?.registryName ||
        "";
      if (fallback && fallback !== selectedClassifier) {
        onSelectClassifier(fallback);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sorted.length]);

  const handleClassifierChange = (event: any) => {
    onSelectClassifier(event.target.value);
  };

  const handleConfigChange = async (key: string, value: any) => {
    const newConfig = { ...configuration, [key]: value };
    setConfiguration(newConfig);

    // Mise à jour côté serveur
    try {
      const response = await fetch(
        `/api/algolab/classifiers/${current?.registryName}/config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newConfig),
        }
      );

      if (response.ok) {
        setConfigValid(true);
      } else {
        setConfigValid(false);
      }
    } catch (error) {
      console.error("Erreur mise à jour config:", error);
      setConfigValid(false);
    }
  };

  const resetToDefaults = () => {
    if (!current?.configSchema) return;
    const defaults: Record<string, any> = {};
    Object.entries(current.configSchema).forEach(([key, schema]) => {
      const s = typeof schema === "object" ? schema : { type: "string" };
      if ("default" in s) defaults[key] = s.default;
    });
    setConfiguration(defaults);
  };

  // Empêche le warning “out-of-range”: valeur vide tant que l’option n’existe pas
  const valueIsValid = sorted.some(
    (c) => c.registryName === selectedClassifier
  );
  const selectValue = valueIsValid ? selectedClassifier : "";

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="classifier-select-label">Classificateur</InputLabel>
        <Select
          labelId="classifier-select-label"
          label="Classificateur"
          value={loading ? "" : selectValue}
          onChange={handleClassifierChange}
          disabled={loading}
          renderValue={(val) => {
            const item = sorted.find((c) => c.registryName === val);
            return item ? item.displayName || item.registryName : "";
          }}
        >
          {loading && (
            <MenuItem disabled>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={16} /> <span>Chargement…</span>
              </Stack>
            </MenuItem>
          )}

          {!loading &&
            sorted.map((c) => (
              <MenuItem
                key={c.registryName}
                value={c.registryName}
                disabled={!c.isAvailable}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  width="100%"
                >
                  <Typography>{c.displayName || c.registryName}</Typography>
                  {c.type && (
                    <Chip
                      label={c.type}
                      size="small"
                      color={
                        c.type === "rule-based"
                          ? "primary"
                          : c.type === "ml"
                          ? "secondary"
                          : "default"
                      }
                    />
                  )}
                  {!c.isAvailable && (
                    <Chip
                      label="non configuré"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {/* Carte de description */}
      {current && showDescription && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ pb: "16px !important" }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  {current.displayName || current.registryName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {current.description}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                {current.type && <Chip label={current.type} size="small" />}
                {current.version && (
                  <Chip
                    label={`v${current.version}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {current.supportsBatch && (
                  <Chip label="Support batch" size="small" color="success" />
                )}
              </Stack>
            </Stack>

            <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
              {"requiresTraining" in current && (
                <Typography variant="caption">
                  <strong>Training requis:</strong>{" "}
                  {current.requiresTraining ? "Oui" : "Non"}
                </Typography>
              )}
              {"requiresAPIKey" in current && (
                <Typography variant="caption">
                  <strong>API Key:</strong>{" "}
                  {current.requiresAPIKey ? "Requise" : "Non"}
                </Typography>
              )}
              {current.targetDomain && (
                <Typography variant="caption">
                  <strong>Domaine:</strong> {current.targetDomain}
                </Typography>
              )}
            </Stack>

            {current.categories && current.categories.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  <strong>Catégories:</strong>
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {current.categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration avancée */}
      {showConfiguration &&
        current?.configSchema &&
        Object.keys(current.configSchema).length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Configuration</Typography>
                <Stack direction="row" spacing={1}>
                  <Typography
                    variant="caption"
                    color={configValid ? "success.main" : "error.main"}
                  >
                    {configValid ? "Valide" : "Invalide"}
                  </Typography>
                  <Button size="small" onClick={resetToDefaults}>
                    Reset Défauts
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {Object.entries(current.configSchema).map(([key, schema]) => {
                const s =
                  typeof schema === "object" ? schema : { type: "string" };
                const value = configuration[key] ?? s.default;

                return (
                  <Box key={key} sx={{ mb: 3 }}>
                    {s.type === "boolean" && (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(value)}
                            onChange={(e) =>
                              handleConfigChange(key, e.target.checked)
                            }
                          />
                        }
                        label={
                          <Stack>
                            <Typography variant="body2">{key}</Typography>
                            {s.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {s.description}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    )}

                    {s.type === "string" && !s.options && (
                      <TextField
                        fullWidth
                        label={key}
                        value={value || ""}
                        onChange={(e) =>
                          handleConfigChange(key, e.target.value)
                        }
                        helperText={s.description}
                        size="small"
                      />
                    )}

                    {s.type === "string" && s.options && (
                      <FormControl fullWidth size="small">
                        <InputLabel>{key}</InputLabel>
                        <Select
                          value={value ?? s.default}
                          onChange={(e) =>
                            handleConfigChange(key, e.target.value)
                          }
                          label={key}
                        >
                          {s.options.map((opt: string) => (
                            <MenuItem key={opt} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                        {s.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {s.description}
                          </Typography>
                        )}
                      </FormControl>
                    )}

                    {s.type === "number" && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          {key}: {value}
                        </Typography>
                        <Slider
                          value={value ?? s.default ?? 0}
                          onChange={(_, v) => handleConfigChange(key, v)}
                          min={s.min ?? 0}
                          max={s.max ?? 100}
                          step={s.step ?? 0.1}
                          valueLabelDisplay="auto"
                        />
                        {s.description && (
                          <Typography variant="caption" color="text.secondary">
                            {s.description}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!configValid}
                >
                  Appliquer Configuration
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => console.log("Configuration:", configuration)}
                >
                  Debug Config
                </Button>
              </Stack>

              {!configValid && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Configuration invalide. Vérifiez les paramètres requis.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
    </Box>
  );
};
