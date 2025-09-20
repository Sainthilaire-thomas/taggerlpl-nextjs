// src/components/calls/ui/pages/CallPreparationPage.tsx

import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Build,
  PlayArrow,
  CheckCircle,
  Warning,
  Info,
} from "@mui/icons-material";

import { useCallManagement } from "../hooks/useCallManagement";
import {
  BulkPreparationWorkflow,
  PreparationStrategy,
} from "../../domain/workflows/BulkPreparationWorkflow";
import { createServices } from "../../infrastructure/ServiceFactory";

/**
 * Page de préparation des appels pour le tagging
 * Supporte la préparation individuelle et en lot
 */
export const CallPreparationPage: React.FC = () => {
  const theme = useTheme();
  const {
    calls,
    loading,
    loadCalls,
    selectedCalls,
    toggleCallSelection,
    selectAllCalls,
    clearSelection,
  } = useCallManagement();

  // État local
  const [preparationStrategy, setPreparationStrategy] =
    useState<PreparationStrategy>("standard");
  const [isPreparating, setIsPreparating] = useState(false);
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [preparationResults, setPreparationResults] = useState<any>(null);

  // Filtrer les appels préparables
  const preparableCalls = calls.filter(
    (call) => call.hasValidTranscription() && !call.isReadyForTagging()
  );

  const selectedPreparableCalls = preparableCalls.filter((call) =>
    selectedCalls.has(call.id)
  );

  /**
   * Préparation en lot
   */
  const handleBulkPreparation = useCallback(async () => {
    if (selectedPreparableCalls.length === 0) return;

    setIsPreparating(true);
    setPreparationProgress(0);
    setPreparationResults(null);

    try {
      const services = createServices();
      const workflow = new BulkPreparationWorkflow(
        services.callService,
        services.validationService
      );

      const callIds = selectedPreparableCalls.map((call) => call.id);

      const result = await workflow.prepareBatch(callIds, {
        onProgress: (progress, success, errors) => {
          setPreparationProgress(progress);
        },
        onComplete: (success, errors, duration) => {
          setPreparationResults({
            success,
            errors,
            duration,
            total: callIds.length,
          });
        },
      });

      // Recharger les appels
      await loadCalls();
      clearSelection();
    } catch (error) {
      console.error("Erreur préparation en lot:", error);
    } finally {
      setIsPreparating(false);
    }
  }, [selectedPreparableCalls, loadCalls, clearSelection]);

  /**
   * Analyse préliminaire
   */
  const handleAnalysis = useCallback(async () => {
    if (selectedPreparableCalls.length === 0) return;

    try {
      const services = createServices();
      const workflow = new BulkPreparationWorkflow(
        services.callService,
        services.validationService
      );

      const callIds = selectedPreparableCalls.map((call) => call.id);
      const analysis = await workflow.analyzeForPreparation(callIds);

      console.log("Analyse préparation:", analysis);
      // Afficher les résultats d'analyse
    } catch (error) {
      console.error("Erreur analyse:", error);
    }
  }, [selectedPreparableCalls]);

  return (
    <Box>
      {/* En-tête */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Préparation des Appels
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Préparez vos appels transcrits pour le tagging
        </Typography>
      </Box>

      {/* Statistiques rapides */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Chip
          icon={<Info />}
          label={`${preparableCalls.length} appels préparables`}
          color="info"
          variant="outlined"
        />
        <Chip
          icon={<CheckCircle />}
          label={`${selectedPreparableCalls.length} sélectionnés`}
          color="primary"
          variant={selectedPreparableCalls.length > 0 ? "filled" : "outlined"}
        />
      </Box>

      {/* Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration de la Préparation
          </Typography>

          <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Stratégie</InputLabel>
              <Select
                value={preparationStrategy}
                onChange={(e) =>
                  setPreparationStrategy(e.target.value as PreparationStrategy)
                }
                label="Stratégie"
                disabled={isPreparating}
              >
                <MenuItem value="standard">
                  <Box>
                    <Typography>Standard</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Préparation classique
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="bulk">
                  <Box>
                    <Typography>En Lot</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Optimisée pour traitement en masse
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="ai-analysis" disabled>
                  <Box>
                    <Typography>Avec IA</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pré-analyse automatique (bientôt)
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={handleAnalysis}
              disabled={selectedPreparableCalls.length === 0 || isPreparating}
              startIcon={<Info />}
            >
              Analyser
            </Button>

            <Button
              variant="contained"
              onClick={handleBulkPreparation}
              disabled={selectedPreparableCalls.length === 0 || isPreparating}
              startIcon={isPreparating ? <Build /> : <PlayArrow />}
            >
              {isPreparating ? "Préparation..." : "Préparer la Sélection"}
            </Button>
          </Box>

          {/* Barre de progression */}
          {isPreparating && (
            <Box mt={3}>
              <Typography variant="body2" gutterBottom>
                Préparation en cours... {Math.round(preparationProgress)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={preparationProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Résultats */}
          {preparationResults && (
            <Alert
              severity={preparationResults.errors === 0 ? "success" : "warning"}
              sx={{ mt: 3 }}
            >
              <Typography variant="body2">
                <strong>Préparation terminée :</strong>{" "}
                {preparationResults.success} succès, {preparationResults.errors}{" "}
                erreurs sur {preparationResults.total} appels en{" "}
                {preparationResults.duration}ms
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Liste des appels préparables */}
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">
              Appels Préparables ({preparableCalls.length})
            </Typography>
            <Box>
              <Button
                size="small"
                onClick={selectAllCalls}
                disabled={isPreparating}
              >
                Tout Sélectionner
              </Button>
              <Button
                size="small"
                onClick={clearSelection}
                disabled={isPreparating}
                sx={{ ml: 1 }}
              >
                Désélectionner
              </Button>
            </Box>
          </Box>

          {preparableCalls.length === 0 ? (
            <Alert severity="info">
              <Typography variant="body2">
                Aucun appel prêt pour la préparation. Les appels doivent avoir
                une transcription valide.
              </Typography>
            </Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Sélection</TableCell>
                  <TableCell>Fichier</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Transcription</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preparableCalls.map((call) => (
                  <TableRow
                    key={call.id}
                    selected={selectedCalls.has(call.id)}
                    hover
                    onClick={() => toggleCallSelection(call.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCalls.has(call.id)}
                        onChange={() => toggleCallSelection(call.id)}
                        disabled={isPreparating}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {call.filename || "Sans nom"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {call.description || "Aucune description"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={call.status}
                        size="small"
                        color={call.status === "draft" ? "default" : "primary"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {call.hasValidTranscription() && (
                          <Chip
                            label="Valide"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                        {call.getTranscription() && (
                          <Typography variant="caption" color="text.secondary">
                            {call.getTranscription()?.getWordCount()} mots
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      <Box mt={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Informations sur la Préparation
            </Typography>

            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Préparation Standard :</strong> Validation basique et
                préparation individuelle
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Préparation en Lot :</strong> Traitement optimisé par
                batches de 5 appels
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Avec Pré-analyse IA :</strong> Analyse préliminaire
                automatique (prochainement)
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Conditions :</strong> L'appel doit avoir une
                transcription JSON valide
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Astuce :</strong> Utilisez la préparation en lot pour
                traiter plusieurs appels simultanément avec un feedback temps
                réel.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
