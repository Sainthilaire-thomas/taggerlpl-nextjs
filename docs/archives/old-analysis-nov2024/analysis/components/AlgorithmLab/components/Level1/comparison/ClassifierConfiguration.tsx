// components/AlgorithmLab/Level1/comparison/ClassifierConfiguration.tsx
// Interface de configuration avancée pour multiple classificateurs

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { ClassifierRegistry } from "../../../algorithms/level1/shared/ClassifierRegistry";
import { ClassifierMetadata } from "../../../algorithms/level1/shared/BaseClassifier";

interface ClassifierConfig {
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  metadata: ClassifierMetadata;
  isValid: boolean;
  lastModified: Date;
}

interface ConfigurationProfile {
  name: string;
  description: string;
  configurations: Record<string, ClassifierConfig>;
  createdAt: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

export const ClassifierConfiguration: React.FC = () => {
  const [configurations, setConfigurations] = useState<
    Record<string, ClassifierConfig>
  >({});
  const [expandedClassifiers, setExpandedClassifiers] = useState<Set<string>>(
    new Set()
  );
  const [profiles, setProfiles] = useState<ConfigurationProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("default");
  const [tabValue, setTabValue] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDescription, setNewProfileDescription] = useState("");

  // Initialisation des configurations
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = () => {
    const availableClassifiers = ClassifierRegistry.listRegistered();
    const configs: Record<string, ClassifierConfig> = {};

    availableClassifiers.forEach((name) => {
      const classifier = ClassifierRegistry.getClassifier(name);
      if (classifier) {
        const metadata = classifier.getMetadata();

        // Configuration par défaut basée sur le schéma
        const defaultParams: Record<string, any> = {};
        Object.entries(metadata.configSchema || {}).forEach(([key, schema]) => {
          if (typeof schema === "object" && "default" in schema) {
            defaultParams[key] = schema.default;
          }
        });

        configs[name] = {
          name,
          enabled: true,
          parameters: defaultParams,
          metadata,
          isValid: classifier.validateConfig(),
          lastModified: new Date(),
        };
      }
    });

    setConfigurations(configs);
  };

  const toggleClassifierExpansion = (classifierName: string) => {
    const newExpanded = new Set(expandedClassifiers);
    if (newExpanded.has(classifierName)) {
      newExpanded.delete(classifierName);
    } else {
      newExpanded.add(classifierName);
    }
    setExpandedClassifiers(newExpanded);
  };

  const updateParameter = (
    classifierName: string,
    paramName: string,
    value: any
  ) => {
    setConfigurations((prev) => ({
      ...prev,
      [classifierName]: {
        ...prev[classifierName],
        parameters: {
          ...prev[classifierName].parameters,
          [paramName]: value,
        },
        lastModified: new Date(),
      },
    }));
  };

  const toggleClassifier = (classifierName: string) => {
    setConfigurations((prev) => ({
      ...prev,
      [classifierName]: {
        ...prev[classifierName],
        enabled: !prev[classifierName].enabled,
        lastModified: new Date(),
      },
    }));
  };

  const resetClassifier = (classifierName: string) => {
    const classifier = ClassifierRegistry.getClassifier(classifierName);
    if (classifier) {
      const metadata = classifier.getMetadata();
      const defaultParams: Record<string, any> = {};

      Object.entries(metadata.configSchema || {}).forEach(([key, schema]) => {
        if (typeof schema === "object" && "default" in schema) {
          defaultParams[key] = schema.default;
        }
      });

      setConfigurations((prev) => ({
        ...prev,
        [classifierName]: {
          ...prev[classifierName],
          parameters: defaultParams,
          lastModified: new Date(),
        },
      }));
    }
  };

  const copyConfiguration = (classifierName: string) => {
    const config = configurations[classifierName];
    navigator.clipboard.writeText(JSON.stringify(config.parameters, null, 2));
  };

  const renderParameterControl = (
    classifierName: string,
    paramName: string,
    schema: any,
    currentValue: any
  ) => {
    const handleChange = (value: any) =>
      updateParameter(classifierName, paramName, value);

    if (schema.type === "boolean") {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={currentValue || false}
              onChange={(e) => handleChange(e.target.checked)}
            />
          }
          label={paramName}
        />
      );
    }

    if (schema.type === "string" && schema.options) {
      return (
        <FormControl fullWidth size="small">
          <InputLabel>{paramName}</InputLabel>
          <Select
            value={currentValue || schema.default}
            onChange={(e) => handleChange(e.target.value)}
            label={paramName}
          >
            {schema.options.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (schema.type === "string") {
      return (
        <TextField
          fullWidth
          label={paramName}
          value={currentValue || ""}
          onChange={(e) => handleChange(e.target.value)}
          size="small"
          helperText={schema.description}
        />
      );
    }

    if (schema.type === "number") {
      return (
        <Box>
          <Typography gutterBottom>
            {paramName}: {currentValue}
          </Typography>
          <Slider
            value={currentValue || schema.default || 0}
            onChange={(e, value) => handleChange(value)}
            min={schema.min || 0}
            max={schema.max || 100}
            step={schema.step || 0.1}
            valueLabelDisplay="auto"
          />
          {schema.description && (
            <Typography variant="caption" color="text.secondary">
              {schema.description}
            </Typography>
          )}
        </Box>
      );
    }

    return null;
  };

  const saveProfile = () => {
    if (!newProfileName.trim()) return;

    const profile: ConfigurationProfile = {
      name: newProfileName.trim(),
      description: newProfileDescription.trim(),
      configurations: { ...configurations },
      createdAt: new Date(),
    };

    setProfiles((prev) => [...prev, profile]);
    setNewProfileName("");
    setNewProfileDescription("");
    setSaveDialogOpen(false);
  };

  const loadProfile = (profileName: string) => {
    const profile = profiles.find((p) => p.name === profileName);
    if (profile) {
      setConfigurations(profile.configurations);
      setSelectedProfile(profileName);
    }
  };

  const exportConfiguration = () => {
    const exportData = {
      profiles,
      currentConfiguration: configurations,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `classifier-config-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const enabledClassifiers = Object.values(configurations).filter(
    (c) => c.enabled
  );
  const totalClassifiers = Object.keys(configurations).length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configuration Multi-Classificateurs
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Gestion centralisée des paramètres et profils de configuration pour tous
        les classificateurs
      </Typography>

      {/* Statistiques globales */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {enabledClassifiers.length}/{totalClassifiers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Classificateurs Actifs
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {enabledClassifiers.filter((c) => c.isValid).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configurations Valides
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 200px", textAlign: "center" }}>
              <Typography variant="h4">{profiles.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Profils Sauvegardés
              </Typography>
            </Box>

            <Box sx={{ flex: "1 1 200px" }}>
              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => setSaveDialogOpen(true)}
                  startIcon={<SaveIcon />}
                  size="small"
                >
                  Sauvegarder Profil
                </Button>
                <Button
                  variant="outlined"
                  onClick={exportConfiguration}
                  startIcon={<DownloadIcon />}
                  size="small"
                >
                  Exporter
                </Button>
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Onglets de gestion */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Configuration Individuelle" />
          <Tab label="Profils Sauvegardés" />
          <Tab label="Configuration Groupée" />
        </Tabs>
      </Box>

      {/* Configuration individuelle */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40px"></TableCell>
                <TableCell>
                  <strong>Classificateur</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Type</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Statut</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Paramètres</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(configurations).map(([name, config]) => (
                <React.Fragment key={name}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleClassifierExpansion(name)}
                      >
                        {expandedClassifiers.has(name) ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {config.metadata.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          v{config.metadata.version}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={config.metadata.type}
                        size="small"
                        color={
                          config.metadata.type === "rule-based"
                            ? "primary"
                            : "secondary"
                        }
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Chip
                          label={config.enabled ? "Actif" : "Inactif"}
                          color={config.enabled ? "success" : "default"}
                          size="small"
                        />
                        <Chip
                          label={config.isValid ? "Valide" : "Invalide"}
                          color={config.isValid ? "success" : "error"}
                          size="small"
                        />
                      </Stack>
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="body2">
                        {Object.keys(config.parameters).length} param(s)
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => toggleClassifier(name)}
                          color={config.enabled ? "success" : "default"}
                        >
                          <SettingsIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => resetClassifier(name)}
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => copyConfiguration(name)}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>

                  {/* Ligne de configuration étendue */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ p: 0 }}>
                      <Collapse in={expandedClassifiers.has(name)}>
                        <Box sx={{ p: 3, bgcolor: "grey.50" }}>
                          <Typography variant="h6" gutterBottom>
                            Configuration - {config.metadata.name}
                          </Typography>

                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}
                          >
                            {Object.entries(
                              config.metadata.configSchema || {}
                            ).map(([paramName, schema]) => (
                              <Box
                                key={paramName}
                                sx={{ flex: "1 1 300px", minWidth: 250 }}
                              >
                                {renderParameterControl(
                                  name,
                                  paramName,
                                  schema,
                                  config.parameters[paramName]
                                )}
                              </Box>
                            ))}
                          </Box>

                          {config.metadata.description && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              {config.metadata.description}
                            </Alert>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Profils sauvegardés */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {profiles.map((profile, index) => (
            <Box key={index} sx={{ flex: "1 1 300px", minWidth: 280 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {profile.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {profile.description || "Aucune description"}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                    Créé le {profile.createdAt.toLocaleDateString()}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => loadProfile(profile.name)}
                    >
                      Charger
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setProfiles((prev) =>
                          prev.filter((p) => p.name !== profile.name)
                        );
                      }}
                    >
                      Supprimer
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}

          {profiles.length === 0 && (
            <Box sx={{ width: "100%" }}>
              <Alert severity="info">
                Aucun profil sauvegardé. Configurez vos classificateurs et
                sauvegardez un profil pour le réutiliser.
              </Alert>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Configuration groupée */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Actions Groupées
        </Typography>

        <Stack spacing={2} direction="row" sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => {
              Object.keys(configurations).forEach((name) => {
                setConfigurations((prev) => ({
                  ...prev,
                  [name]: { ...prev[name], enabled: true },
                }));
              });
            }}
          >
            Activer Tous
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              Object.keys(configurations).forEach((name) => {
                setConfigurations((prev) => ({
                  ...prev,
                  [name]: { ...prev[name], enabled: false },
                }));
              });
            }}
          >
            Désactiver Tous
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              Object.keys(configurations).forEach((name) =>
                resetClassifier(name)
              );
            }}
          >
            Reset Tous
          </Button>
        </Stack>

        <Alert severity="warning">
          Les actions groupées affectent tous les classificateurs. Utilisez avec
          précaution.
        </Alert>
      </TabPanel>

      {/* Dialog de sauvegarde de profil */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Sauvegarder Profil de Configuration</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom du profil"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description (optionnel)"
            value={newProfileDescription}
            onChange={(e) => setNewProfileDescription(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={saveProfile}
            disabled={!newProfileName.trim()}
            variant="contained"
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
