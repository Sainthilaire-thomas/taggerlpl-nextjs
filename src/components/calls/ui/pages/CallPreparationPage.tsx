// src/components/calls/ui/pages/CallPreparationPage.tsx - VERSION CORRIGÉE

import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  Checkbox,
  TableContainer,
  Paper,
} from "@mui/material";
import {
  Build,
  PlayArrow,
  CheckCircle,
  Warning,
  Info,
} from "@mui/icons-material";

// ✅ NOUVEAU SYSTÈME UNIQUEMENT
import { useCallManagement } from "../hooks/useCallManagement";

type PreparationStrategy = "standard" | "bulk";

/**
 * Page de préparation des appels pour le tagging
 * NOUVEAU SYSTÈME : Utilise uniquement l'architecture DDD moderne
 */
export const CallPreparationPage: React.FC = () => {
  // ✅ NOUVEAU SYSTÈME : Hook de gestion moderne
  const {
    calls,
    loading,
    error,
    selectedCalls,
    stats,
    loadCalls,
    markAsPrepared,
    toggleCallSelection,
    selectAllCalls,
    clearSelection,
    hasSelection,
    selectedCount,
    clearError,
  } = useCallManagement();

  // État local pour la préparation
  const [preparationStrategy, setPreparationStrategy] =
    useState<PreparationStrategy>("standard");
  const [isPreparating, setIsPreparating] = useState(false);
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [preparationResults, setPreparationResults] = useState<any>(null);

  /**
   * ✅ NOUVEAU SYSTÈME : Chargement initial des appels
   */
  useEffect(() => {
    console.log("🔄 CallPreparationPage: Initialisation du nouveau système...");
    loadCalls();
  }, [loadCalls]);

  /**
   * ✅ NOUVEAU SYSTÈME : Filtrage des appels préparables
   */
  const preparableCalls = useMemo(() => {
    console.log(
      "📊 Analyse des appels du nouveau système:",
      calls?.length || 0
    );

    if (!calls || calls.length === 0) {
      console.log("⚠️ Aucun appel chargé dans le nouveau système");
      return [];
    }

    // Filtrer selon les méthodes de l'entité Call moderne
    const filtered = calls.filter((call) => {
      const hasValidTranscription = call.hasValidTranscription();
      const isNotReady = !call.isReadyForTagging();

      console.log(`📋 Call ${call.id} (${call.filename}):`, {
        hasValidTranscription,
        isNotReady,
        status: call.status,
        // ✅ CORRECTION: Utiliser les getters publics au lieu des propriétés privées
        hasAudio: call.hasValidAudio(),
        hasTranscription: call.hasValidTranscription(),
      });

      return hasValidTranscription && isNotReady;
    });

    console.log("✅ Appels préparables identifiés:", filtered.length);
    return filtered;
  }, [calls]);

  const selectedPreparableCalls = useMemo(() => {
    return preparableCalls.filter((call) => selectedCalls.has(call.id));
  }, [preparableCalls, selectedCalls]);

  /**
   * ✅ NOUVEAU SYSTÈME : Préparation en lot utilisant les services DDD
   */
  const handleBulkPreparation = useCallback(async () => {
    if (selectedPreparableCalls.length === 0) {
      console.warn("⚠️ Aucun appel sélectionné pour la préparation");
      return;
    }

    setIsPreparating(true);
    setPreparationProgress(0);
    setPreparationResults(null);

    console.log(
      "🚀 Préparation nouveau système:",
      selectedPreparableCalls.length,
      "appels"
    );

    try {
      let successCount = 0;
      let errorCount = 0;
      const total = selectedPreparableCalls.length;

      // Traitement par batch pour optimiser les performances
      for (let i = 0; i < selectedPreparableCalls.length; i++) {
        const call = selectedPreparableCalls[i];

        try {
          console.log(
            `📋 Préparation ${i + 1}/${total}: ${call.id} (${call.filename})`
          );

          // ✅ NOUVEAU SYSTÈME : Utiliser markAsPrepared du service DDD
          const success = await markAsPrepared(call.id);

          if (success) {
            successCount++;
            console.log(`✅ ${call.id} préparé avec succès`);
          } else {
            errorCount++;
            console.error(`❌ Échec préparation ${call.id}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Exception pour ${call.id}:`, error);
        }

        // Mise à jour progressive de l'UI
        const progress = ((i + 1) / total) * 100;
        setPreparationProgress(progress);
      }

      setPreparationResults({
        success: successCount,
        errors: errorCount,
        total,
        duration: Date.now(), // Timestamp pour debug
      });

      // Nettoyage de la sélection
      clearSelection();

      console.log("🎉 Préparation nouveau système terminée:", {
        successCount,
        errorCount,
        total,
        strategy: preparationStrategy,
      });
    } catch (error) {
      console.error("❌ Erreur globale préparation nouveau système:", error);
      setPreparationResults({
        success: 0,
        errors: selectedPreparableCalls.length,
        total: selectedPreparableCalls.length,
        duration: Date.now(),
      });
    } finally {
      setIsPreparating(false);
    }
  }, [
    selectedPreparableCalls,
    markAsPrepared,
    clearSelection,
    preparationStrategy,
  ]);

  /**
   * ✅ NOUVEAU SYSTÈME : Analyse utilisant les entités Call modernes
   */
  const handleAnalysis = useCallback(async () => {
    if (selectedPreparableCalls.length === 0) {
      console.warn("⚠️ Aucun appel sélectionné pour l'analyse");
      return;
    }

    console.log("🔍 Analyse nouveau système:", {
      total: selectedPreparableCalls.length,
      strategy: preparationStrategy,
      calls: selectedPreparableCalls.map((call) => ({
        id: call.id,
        filename: call.filename,
        status: call.status,
        hasValidAudio: call.hasValidAudio(),
        hasValidTranscription: call.hasValidTranscription(),
        isReadyForTagging: call.isReadyForTagging(),
        createdAt: call.createdAt,
        // ✅ CORRECTION: Utiliser seulement les méthodes publiques
        hasAudio: call.hasValidAudio(),
        hasTranscription: call.hasValidTranscription(),
      })),
    });

    // Affichage des résultats d'analyse
    const analysis = {
      totalSelected: selectedPreparableCalls.length,
      withAudio: selectedPreparableCalls.filter((c) => c.hasValidAudio())
        .length,
      withTranscription: selectedPreparableCalls.filter((c) =>
        c.hasValidTranscription()
      ).length,
      readyForPreparation: selectedPreparableCalls.filter(
        (c) => c.hasValidTranscription() && !c.isReadyForTagging()
      ).length,
    };

    console.table(analysis);
    alert(
      `Analyse terminée !\n\nTotal: ${analysis.totalSelected}\nAvec audio: ${analysis.withAudio}\nAvec transcription: ${analysis.withTranscription}\nPrêts pour préparation: ${analysis.readyForPreparation}\n\nDétails dans la console.`
    );
  }, [selectedPreparableCalls, preparationStrategy]);

  // ✅ NOUVEAU SYSTÈME : Debug complet de l'état
  console.log("🎯 État CallPreparationPage (nouveau système):", {
    loading,
    error: error || "aucune",
    totalCalls: calls?.length || 0,
    preparableCalls: preparableCalls.length,
    selectedCount,
    hasSelection,
    strategy: preparationStrategy,
    isPreparating,
    stats: stats
      ? {
          total: stats.total,
          readyForTagging: stats.readyForTagging,
          completeness: stats.completeness,
        }
      : "non chargées",
  });

  // ✅ CORRECTION: Retourner le JSX complet
  return (
    <Box>
      {/* En-tête avec branding nouveau système */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Préparation des Appels
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Système moderne de préparation avec architecture DDD
        </Typography>
      </Box>

      {/* Statistiques du nouveau système */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Chip
          icon={<Info />}
          label={`${preparableCalls.length} appels préparables`}
          color="info"
          variant="outlined"
        />
        <Chip
          icon={<CheckCircle />}
          label={`${selectedCount} sélectionnés`}
          color="primary"
          variant={selectedCount > 0 ? "filled" : "outlined"}
        />
        {stats && (
          <>
            <Chip
              label={`${stats.total} total`}
              color="default"
              variant="outlined"
            />
            <Chip
              label={`${stats.completeness}% préparés`}
              color="success"
              variant="outlined"
            />
          </>
        )}
      </Box>

      {/* Configuration de la préparation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration de la Préparation (Nouveau Système)
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
                      Préparation DDD classique
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="bulk">
                  <Box>
                    <Typography>En Lot</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Traitement optimisé par services
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={handleAnalysis}
              disabled={selectedCount === 0 || isPreparating}
              startIcon={<Info />}
            >
              Analyser Sélection
            </Button>

            <Button
              variant="contained"
              onClick={handleBulkPreparation}
              disabled={selectedCount === 0 || isPreparating}
              startIcon={isPreparating ? <Build /> : <PlayArrow />}
            >
              {isPreparating ? "Préparation..." : "Préparer la Sélection"}
            </Button>
          </Box>

          {/* Barre de progression */}
          {isPreparating && (
            <Box mt={3}>
              <Typography variant="body2" gutterBottom>
                Préparation en cours (nouveau système)...{" "}
                {Math.round(preparationProgress)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={preparationProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Résultats de préparation */}
          {preparationResults && (
            <Alert
              severity={preparationResults.errors === 0 ? "success" : "warning"}
              sx={{ mt: 3 }}
            >
              <Typography variant="body2">
                <strong>Préparation terminée (nouveau système) :</strong>{" "}
                {preparationResults.success} succès, {preparationResults.errors}{" "}
                erreurs sur {preparationResults.total} appels
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Gestion d'erreurs */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              Ignorer
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Erreur nouveau système :</strong> {error}
          </Typography>
        </Alert>
      )}

      {/* Indicateur de chargement */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Chargement des appels depuis les services DDD...
          </Typography>
        </Box>
      )}

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
                {loading
                  ? "Chargement des appels du nouveau système..."
                  : calls?.length === 0
                  ? "Aucun appel trouvé dans le nouveau système. Vérifiez la configuration des services."
                  : "Aucun appel prêt pour la préparation. Les appels doivent avoir une transcription valide et ne pas être déjà préparés."}
              </Typography>
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Sélection</TableCell>
                    <TableCell>Fichier</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Contenu</TableCell>
                    <TableCell>Créé</TableCell>
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
                        <Checkbox
                          checked={selectedCalls.has(call.id)}
                          onChange={() => toggleCallSelection(call.id)}
                          disabled={isPreparating}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
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
                          color={
                            call.status === "draft" ? "default" : "primary"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {call.hasValidAudio() && (
                            <Chip
                              label="Audio"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {call.hasValidTranscription() && (
                            <Chip
                              label="Transcription"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {call.createdAt?.toLocaleDateString() || "N/A"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Informations sur le nouveau système */}
      <Box mt={4}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Nouveau Système de Préparation
            </Typography>

            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Architecture DDD :</strong> Utilise les services et
                entités modernes
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Validation avancée :</strong> Contrôles métier intégrés
                dans les entités
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Performance :</strong> Traitement optimisé par batches
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Conditions :</strong> Transcription valide + statut
                non-ready
              </Typography>
            </Box>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Nouveau système actif :</strong> Cette page utilise
                exclusivement l'architecture moderne avec services DDD et
                entités Call.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
