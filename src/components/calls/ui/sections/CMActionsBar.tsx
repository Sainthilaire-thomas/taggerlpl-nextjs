// src/components/calls/ui/sections/CMActionsBar.tsx - INTÉGRATION TRANSCRIPTION

import React, { useMemo } from "react";
import { Box, Button, Chip, Alert, Typography } from "@mui/material";
import {
  Mic,
  People,
  PlayArrow,
  Stop,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";

// Types pour les props (à adapter selon votre interface existante)
interface CMActionsBarProps {
  activeTab: string; // "overview" | "transcription" | "audio" | etc.
  hasSelection: boolean;
  selectedCount: number;
  loadCalls: () => Promise<void>;
  loading: boolean;
  transcription: ReturnType<
    typeof import("../hooks/actions/useCallTranscriptionActions").useCallTranscriptionActions
  >;
  audio: any; // useCallAudioActions
  preparation: any; // useCallPreparationActions
  flags: any; // useCallFlags
  cleanup: any; // useCallCleanup
  selectedCallObjects: any[]; // Les objets Call sélectionnés
}

export function CMActionsBar({
  activeTab,
  hasSelection,
  selectedCount,
  loadCalls,
  loading,
  transcription,
  audio,
  preparation,
  flags,
  cleanup,
  selectedCallObjects,
}: CMActionsBarProps) {
  // ============================================================================
  // ESTIMATION DES COÛTS POUR L'UI
  // ============================================================================

  const batchEstimate = useMemo(() => {
    if (selectedCallObjects.length === 0) return null;

    return transcription.calculateBatchEstimate(
      selectedCallObjects,
      "complete"
    );
  }, [selectedCallObjects, transcription]);

  // ============================================================================
  // HANDLERS POUR LES ACTIONS DE TRANSCRIPTION
  // ============================================================================

  const handleAutoTranscribe = async () => {
    if (selectedCallObjects.length === 0) return;

    try {
      console.log(
        `🎙️ Démarrage transcription automatique pour ${selectedCount} appels`
      );
      await transcription.transcribeCallOnly(selectedCallObjects);
    } catch (error) {
      console.error("❌ Erreur transcription automatique:", error);
    }
  };

  const handleSeparateSpeakers = async () => {
    if (selectedCallObjects.length === 0) return;

    try {
      console.log(
        `👥 Démarrage séparation locuteurs pour ${selectedCount} appels`
      );
      await transcription.diarizeExistingCall(selectedCallObjects);
    } catch (error) {
      console.error("❌ Erreur séparation locuteurs:", error);
    }
  };

  const handleTranscribeComplete = async () => {
    if (selectedCallObjects.length === 0) return;

    try {
      console.log(`🚀 Démarrage pipeline complet pour ${selectedCount} appels`);
      await transcription.transcribeCallComplete(selectedCallObjects);
    } catch (error) {
      console.error("❌ Erreur pipeline complet:", error);
    }
  };

  const handleValidateTranscriptions = async () => {
    if (selectedCallObjects.length === 0) return;

    try {
      console.log(`✅ Démarrage validation pour ${selectedCount} appels`);
      await transcription.validateTranscriptions(selectedCallObjects);
    } catch (error) {
      console.error("❌ Erreur validation:", error);
    }
  };

  const handleBatchProcess = async () => {
    if (selectedCallObjects.length === 0) return;

    try {
      const callIds = selectedCallObjects.map((call) => call.id);
      await transcription.transcribeBatch(callIds, "complete");
    } catch (error) {
      console.error("❌ Erreur traitement par lot:", error);
    }
  };

  // ============================================================================
  // RENDU CONDITIONNEL PAR ONGLET
  // ============================================================================

  const renderTranscriptionActions = () => (
    <Box>
      {/* Affichage du progrès en cours */}
      {transcription.isProcessing && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          icon={<Mic />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={transcription.resetProgress}
            >
              Masquer
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Transcription en cours...</strong>
            {transcription.currentProgress && (
              <span> - {transcription.currentProgress.stage}</span>
            )}
          </Typography>
        </Alert>
      )}

      {/* Estimation des coûts */}
      {hasSelection && batchEstimate && !transcription.isProcessing && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Estimation pour {selectedCount} appels :</strong>~
            {batchEstimate.totalAudioMinutes.toFixed(1)} min audio, coût estimé:{" "}
            <strong>${batchEstimate.estimatedCost.toFixed(4)}</strong>, temps: ~
            {batchEstimate.estimatedTimeMinutes} min
          </Typography>
        </Alert>
      )}

      {/* Boutons d'action principaux */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        {/* Transcription complète (recommandée) */}
        <Box
          sx={{
            p: 2,
            border: "2px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            bgcolor: hasSelection
              ? "primary.light"
              : "action.disabledBackground",
            opacity: hasSelection ? 1 : 0.6,
            flex: 1,
            minWidth: 250,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Mic fontSize="small" />
            <People fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">
              Pipeline Complet
            </Typography>
            <Chip label="RECOMMANDÉ" size="small" color="primary" />
          </Box>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mb: 2, display: "block" }}
          >
            Transcription + Séparation locuteurs + Alignement
          </Typography>
          <Button
            onClick={handleTranscribeComplete}
            disabled={!hasSelection || transcription.isProcessing || loading}
            variant="contained"
            fullWidth
            startIcon={transcription.isProcessing ? <Stop /> : <PlayArrow />}
            color="primary"
            size="large"
          >
            {transcription.isProcessing
              ? `Traitement...`
              : `Transcrire Complet (${selectedCount})`}
          </Button>
        </Box>

        {/* Actions individuelles */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minWidth: 200,
          }}
        >
          {/* Transcription seule */}
          <Button
            onClick={handleAutoTranscribe}
            disabled={!hasSelection || transcription.isProcessing || loading}
            variant="outlined"
            startIcon={<Mic />}
            color="secondary"
          >
            🎙️ ASR Seulement ({selectedCount})
          </Button>

          {/* Diarisation seule */}
          <Button
            onClick={handleSeparateSpeakers}
            disabled={!hasSelection || transcription.isProcessing || loading}
            variant="outlined"
            startIcon={<People />}
            color="info"
          >
            👥 Séparer Locuteurs ({selectedCount})
          </Button>

          {/* Validation (existant) */}
          <Button
            onClick={handleValidateTranscriptions}
            disabled={!hasSelection || transcription.isProcessing || loading}
            variant="outlined"
            startIcon={<CheckCircle />}
            color="success"
          >
            ✅ Valider & Corriger ({selectedCount})
          </Button>

          {/* Traitement par lot (avancé) */}
          {selectedCount > 3 && (
            <Button
              onClick={handleBatchProcess}
              disabled={!hasSelection || transcription.isProcessing || loading}
              variant="outlined"
              color="warning"
              size="small"
            >
              🔄 Traitement par Lot
            </Button>
          )}
        </Box>
      </Box>

      {/* Statut et conseils */}
      {!hasSelection && (
        <Alert severity="warning">
          <Typography variant="body2">
            Sélectionnez des appels pour activer les actions de transcription
          </Typography>
        </Alert>
      )}
    </Box>
  );

  // ============================================================================
  // AUTRES ONGLETS (conservés de votre logique existante)
  // ============================================================================

  const renderOtherActions = () => {
    switch (activeTab) {
      case "audio":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            {/* Vos actions audio existantes */}
            <Button disabled={!hasSelection}>
              🔊 Actions Audio ({selectedCount})
            </Button>
          </Box>
        );

      case "preparation":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            {/* Vos actions préparation existantes */}
            <Button disabled={!hasSelection}>
              📋 Actions Préparation ({selectedCount})
            </Button>
          </Box>
        );

      case "cleanup":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            {/* Vos actions nettoyage existantes */}
            <Button disabled={!hasSelection}>
              🧹 Actions Nettoyage ({selectedCount})
            </Button>
          </Box>
        );

      case "overview":
      default:
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button onClick={loadCalls} disabled={loading}>
              🔄 Recharger
            </Button>
            {hasSelection && (
              <Chip
                label={`${selectedCount} appel(s) sélectionné(s)`}
                color="primary"
              />
            )}
          </Box>
        );
    }
  };

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <Box>
      {activeTab === "transcription"
        ? renderTranscriptionActions()
        : renderOtherActions()}

      {/* Affichage global des erreurs de transcription */}
      {transcription.currentProgress?.status === "error" && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          onClose={transcription.resetProgress}
        >
          <Typography variant="body2">
            <strong>Erreur de transcription :</strong>{" "}
            {transcription.currentProgress.error}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
