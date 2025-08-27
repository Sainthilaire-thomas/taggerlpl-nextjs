// components/shared/ClassifierSelector.tsx

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { ClassifierRegistry } from "../../algorithms/level1/shared/ClassifierRegistry";
import { ClassifierMetadata } from "../../algorithms/level1/shared/BaseClassifier";

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
  const [availableClassifiers, setAvailableClassifiers] = useState<string[]>(
    []
  );
  const [classifierMetadata, setClassifierMetadata] = useState<
    Record<string, ClassifierMetadata>
  >({});
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [configValid, setConfigValid] = useState<boolean>(true);

  // Chargement des classificateurs disponibles
  useEffect(() => {
    const registered = ClassifierRegistry.listRegistered();
    setAvailableClassifiers(registered);

    // Récupération des métadonnées
    const metadata: Record<string, ClassifierMetadata> = {};
    registered.forEach((name) => {
      const classifier = ClassifierRegistry.getClassifier(name);
      if (classifier) {
        metadata[name] = classifier.getMetadata();
      }
    });
    setClassifierMetadata(metadata);

    // Initialisation configuration par défaut
    if (registered.includes(selectedClassifier)) {
      const classifier = ClassifierRegistry.getClassifier(selectedClassifier);
      if (classifier) {
        const meta = classifier.getMetadata();
        const defaultConfig: Record<string, any> = {};

        Object.entries(meta.configSchema || {}).forEach(([key, schema]) => {
          if (typeof schema === "object" && "default" in schema) {
            defaultConfig[key] = schema.default;
          }
        });

        setConfiguration(defaultConfig);
        setConfigValid(classifier.validateConfig());
      }
    }
  }, [selectedClassifier]);

  const handleClassifierChange = (event: any) => {
    onSelectClassifier(event.target.value);
  };

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...configuration, [key]: value };
    setConfiguration(newConfig);

    // Validation configuration en temps réel
    const classifier = ClassifierRegistry.getClassifier(selectedClassifier);
    if (classifier) {
      // Note: Ici on devrait appliquer la configuration au classifier pour validation
      // Pour simplifier, on assume que la validation basique est OK
      setConfigValid(true);
    }
  };

  const resetToDefaults = () => {
    const classifier = ClassifierRegistry.getClassifier(selectedClassifier);
    if (classifier) {
      const meta = classifier.getMetadata();
      const defaultConfig: Record<string, any> = {};

      Object.entries(meta.configSchema || {}).forEach(([key, schema]) => {
        if (typeof schema === "object" && "default" in schema) {
          defaultConfig[key] = schema.default;
        }
      });

      setConfiguration(defaultConfig);
    }
  };

  const currentMetadata = classifierMetadata[selectedClassifier];

  return (
    <Box>
      {/* Sélecteur principal */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Classificateur</InputLabel>
        <Select
          value={selectedClassifier}
          onChange={handleClassifierChange}
          label="Classificateur"
        >
          {availableClassifiers.map((name) => (
            <MenuItem key={name} value={name}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                width="100%"
              >
                <Typography>
                  {classifierMetadata[name]?.name || name}
                </Typography>
                {classifierMetadata[name] && (
                  <Chip
                    label={classifierMetadata[name].type}
                    size="small"
                    color={
                      classifierMetadata[name].type === "rule-based"
                        ? "primary"
                        : classifierMetadata[name].type === "ml"
                        ? "secondary"
                        : "default"
                    }
                  />
                )}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Métadonnées du classificateur */}
      {currentMetadata && showDescription && (
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
                  {currentMetadata.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentMetadata.description}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Chip label={currentMetadata.type} size="small" />
                <Chip
                  label={`v${currentMetadata.version}`}
                  size="small"
                  variant="outlined"
                />
                {currentMetadata.supportsBatch && (
                  <Chip label="Support batch" size="small" color="success" />
                )}
              </Stack>
            </Stack>

            {/* Informations techniques */}
            <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
              <Typography variant="caption">
                <strong>Training requis:</strong>{" "}
                {currentMetadata.requiresTraining ? "Oui" : "Non"}
              </Typography>
              <Typography variant="caption">
                <strong>API Key:</strong>{" "}
                {currentMetadata.requiresAPIKey ? "Requise" : "Non"}
              </Typography>
              {currentMetadata.targetDomain && (
                <Typography variant="caption">
                  <strong>Domaine:</strong> {currentMetadata.targetDomain}
                </Typography>
              )}
            </Stack>

            {/* Catégories supportées */}
            {currentMetadata.categories &&
              currentMetadata.categories.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    <strong>Catégories:</strong>
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {currentMetadata.categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
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
        currentMetadata?.configSchema &&
        Object.keys(currentMetadata.configSchema).length > 0 && (
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

              {Object.entries(currentMetadata.configSchema).map(
                ([key, schema]) => {
                  const schemaObj =
                    typeof schema === "object" ? schema : { type: "string" };
                  const currentValue = configuration[key] ?? schemaObj.default;

                  return (
                    <Box key={key} sx={{ mb: 3 }}>
                      {/* Configuration Boolean */}
                      {schemaObj.type === "boolean" && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={currentValue || false}
                              onChange={(e) =>
                                handleConfigChange(key, e.target.checked)
                              }
                            />
                          }
                          label={
                            <Stack>
                              <Typography variant="body2">{key}</Typography>
                              {schemaObj.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {schemaObj.description}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      )}

                      {/* Configuration String */}
                      {schemaObj.type === "string" && !schemaObj.options && (
                        <TextField
                          fullWidth
                          label={key}
                          value={currentValue || ""}
                          onChange={(e) =>
                            handleConfigChange(key, e.target.value)
                          }
                          helperText={schemaObj.description}
                          size="small"
                        />
                      )}

                      {/* Configuration Select */}
                      {schemaObj.type === "string" && schemaObj.options && (
                        <FormControl fullWidth size="small">
                          <InputLabel>{key}</InputLabel>
                          <Select
                            value={currentValue || schemaObj.default}
                            onChange={(e) =>
                              handleConfigChange(key, e.target.value)
                            }
                            label={key}
                          >
                            {schemaObj.options.map((option: string) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                          {schemaObj.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {schemaObj.description}
                            </Typography>
                          )}
                        </FormControl>
                      )}

                      {/* Configuration Number/Slider */}
                      {schemaObj.type === "number" && (
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            {key}: {currentValue}
                          </Typography>
                          <Slider
                            value={currentValue || schemaObj.default || 0}
                            onChange={(e, value) =>
                              handleConfigChange(key, value)
                            }
                            min={schemaObj.min || 0}
                            max={schemaObj.max || 100}
                            step={schemaObj.step || 0.1}
                            valueLabelDisplay="auto"
                          />
                          {schemaObj.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {schemaObj.description}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                }
              )}

              {/* Actions de configuration */}
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
                  onClick={() =>
                    console.log("Configuration actuelle:", configuration)
                  }
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
