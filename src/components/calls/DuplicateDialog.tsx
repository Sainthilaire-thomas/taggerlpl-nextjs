// components/calls/DuplicateDialog.tsx - Dialog pour gérer les doublons d'appels
"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  Paper,
  useTheme,
} from "@mui/material";
import {
  AudioFile as AudioIcon,
  Description as TranscriptIcon,
  Warning as WarningIcon,
  CompareArrows as CompareIcon,
} from "@mui/icons-material";

interface DuplicateDialogProps {
  open: boolean;
  onClose: () => void;
  duplicateData: {
    existingCall: {
      callid: string;
      filename?: string;
      description?: string;
      upload?: boolean;
      transcription?: any;
    };
    canUpgrade?: {
      addAudio: boolean;
      addTranscription: boolean;
      description: string;
    };
    recommendation: "upgrade" | "block" | "create_new";
  };
  newImport: {
    hasAudio: boolean;
    hasTranscription: boolean;
    filename?: string;
  };
  onAction: (action: "upgrade" | "create_new" | "cancel") => void;
}

export const DuplicateDialog: React.FC<DuplicateDialogProps> = ({
  open,
  onClose,
  duplicateData,
  newImport,
  onAction,
}) => {
  const theme = useTheme();
  const { existingCall, canUpgrade, recommendation } = duplicateData;

  // Analyser l'état actuel de l'appel existant
  const currentState = {
    hasAudio: existingCall.upload && existingCall.filename,
    hasTranscription: !!existingCall.transcription,
  };

  // Générer les étiquettes d'état visuelles
  const getCurrentStateLabel = () => {
    if (currentState.hasAudio && currentState.hasTranscription) {
      return { label: "🎵📝 Audio + Transcription", color: "success" as const };
    } else if (currentState.hasAudio) {
      return { label: "🎵 Audio seul", color: "warning" as const };
    } else if (currentState.hasTranscription) {
      return { label: "📝 Transcription seule", color: "info" as const };
    } else {
      return { label: "❌ Vide", color: "error" as const };
    }
  };

  const getNewImportLabel = () => {
    if (newImport.hasAudio && newImport.hasTranscription) {
      return { label: "🎵📝 Audio + Transcription", color: "primary" as const };
    } else if (newImport.hasAudio) {
      return { label: "🎵 Audio seul", color: "primary" as const };
    } else if (newImport.hasTranscription) {
      return { label: "📝 Transcription seule", color: "primary" as const };
    } else {
      return { label: "❌ Vide", color: "default" as const };
    }
  };

  const currentStateInfo = getCurrentStateLabel();
  const newImportInfo = getNewImportLabel();

  // Déterminer les actions possibles selon la recommandation
  const getAvailableActions = () => {
    const actions = [];

    // Action d'amélioration si possible
    if (canUpgrade && (canUpgrade.addAudio || canUpgrade.addTranscription)) {
      let upgradeLabel = "Améliorer l'appel existant";
      if (canUpgrade.addAudio && canUpgrade.addTranscription) {
        upgradeLabel = "🎵📝 Ajouter audio + transcription";
      } else if (canUpgrade.addAudio) {
        upgradeLabel = "🎵 Ajouter l'audio manquant";
      } else if (canUpgrade.addTranscription) {
        upgradeLabel = "📝 Ajouter la transcription manquante";
      }

      actions.push({
        label: upgradeLabel,
        action: "upgrade" as const,
        color: "primary" as const,
        variant: "contained" as const,
        disabled: false,
      });
    }

    // Action créer nouveau (toujours disponible)
    actions.push({
      label: "📝 Créer un nouvel appel",
      action: "create_new" as const,
      color: "secondary" as const,
      variant: "outlined" as const,
      disabled: false,
    });

    return actions;
  };

  const availableActions = getAvailableActions();

  // Message d'alerte selon la recommandation
  const getAlertMessage = () => {
    switch (recommendation) {
      case "block":
        return {
          severity: "warning" as const,
          message:
            "⚠️ Contenu identique détecté. Nous recommandons de ne pas créer de doublon pour éviter la duplication.",
        };
      case "upgrade":
        return {
          severity: "info" as const,
          message:
            "💡 L'appel existant peut être amélioré en ajoutant le contenu manquant.",
        };
      case "create_new":
        return {
          severity: "info" as const,
          message:
            "ℹ️ L'appel existant est déjà complet. Vous pouvez créer un nouvel appel si nécessaire.",
        };
      default:
        return null;
    }
  };

  const alertData = getAlertMessage();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningIcon color="warning" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="h2">
            Contenu similaire détecté
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Un appel avec un contenu similaire existe déjà :
          </Typography>

          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 3,
              bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.50",
              border: 1,
              borderColor:
                theme.palette.mode === "dark" ? "grey.700" : "grey.200",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "monospace",
                fontWeight: 600,
                color: "text.primary",
                wordBreak: "break-all",
              }}
            >
              {existingCall.filename ||
                existingCall.description ||
                `Appel #${existingCall.callid}`}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {existingCall.callid}
            </Typography>
          </Paper>

          {/* Comparaison visuelle des états */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CompareIcon color="action" />
              <Typography variant="subtitle2" fontWeight={600}>
                Comparaison du contenu
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 2,
                alignItems: "center",
              }}
            >
              {/* État actuel */}
              <Paper
                elevation={2}
                sx={{
                  p: 2.5,
                  border: 2,
                  borderColor:
                    theme.palette.mode === "dark" ? "grey.600" : "grey.300",
                  borderRadius: 2,
                  textAlign: "center",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "grey.800"
                      : "background.paper",
                }}
              >
                <Typography
                  variant="overline"
                  color="textSecondary"
                  fontSize="0.7rem"
                >
                  État actuel
                </Typography>
                <Box sx={{ mt: 1, mb: 1.5 }}>
                  <Chip
                    label={currentStateInfo.label}
                    color={currentStateInfo.color}
                    size="medium"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                <Typography variant="caption" display="block">
                  Appel #{existingCall.callid}
                </Typography>
              </Paper>

              {/* Flèche de comparaison */}
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="action.active">
                  →
                </Typography>
              </Box>

              {/* Nouvel import */}
              <Paper
                elevation={2}
                sx={{
                  p: 2.5,
                  border: 2,
                  borderColor: "primary.main",
                  borderRadius: 2,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? `${theme.palette.primary.dark}20`
                      : "primary.50",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="overline"
                  color="primary.main"
                  fontSize="0.7rem"
                >
                  Nouvel import
                </Typography>
                <Box sx={{ mt: 1, mb: 1.5 }}>
                  <Chip
                    label={newImportInfo.label}
                    color={newImportInfo.color}
                    size="medium"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  display="block"
                  color={
                    theme.palette.mode === "dark"
                      ? "primary.light"
                      : "primary.dark"
                  }
                >
                  {newImport.filename || "Nouveau contenu"}
                </Typography>
              </Paper>
            </Box>
          </Box>

          {/* Message d'alerte */}
          {alertData && (
            <Alert severity={alertData.severity} sx={{ mb: 2 }}>
              {alertData.message}
            </Alert>
          )}

          {/* Description de l'amélioration possible */}
          {canUpgrade && canUpgrade.description && (
            <Paper
              sx={{
                p: 2.5,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? `${theme.palette.info.dark}20`
                    : "info.50",
                borderRadius: 2,
                border: 1,
                borderColor:
                  theme.palette.mode === "dark" ? "info.dark" : "info.200",
              }}
            >
              <Typography
                variant="body2"
                color={
                  theme.palette.mode === "dark" ? "info.light" : "info.dark"
                }
                fontWeight={500}
              >
                💡 Possibilité d'amélioration : {canUpgrade.description}
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {/* Boutons d'action dynamiques */}
        {availableActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            color={action.color}
            onClick={() => onAction(action.action)}
            disabled={action.disabled}
            sx={{
              minWidth: 160,
              fontWeight: 500,
            }}
          >
            {action.label}
          </Button>
        ))}

        {/* Bouton Annuler */}
        <Button
          onClick={() => onAction("cancel")}
          color="error"
          variant="text"
          sx={{
            minWidth: 100,
            fontWeight: 500,
          }}
        >
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );
};
