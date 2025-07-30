// components/DeleteConfirmationDialog.tsx
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
  Alert,
  AlertTitle,
  Chip,
  Divider,
} from "@mui/material";
import {
  Warning as WarningIcon,
  AudioFile as AudioIcon,
  Description as TranscriptionIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface Call {
  callid: string;
  upload?: boolean;
  filepath?: string | null;
  preparedfortranscript?: boolean;
  filename?: string | null;
  transcription?: any;
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  call: Call | null;
  onClose: () => void;
  onConfirm: (call: Call) => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({ open, call, onClose, onConfirm, isDeleting = false }) => {
  if (!call) return null;

  // Analyser les ressources qui seront supprimées
  const hasAudio = call.upload && call.filepath;
  const hasTranscription = call.preparedfortranscript;
  const transcriptionWordCount = call.transcription?.words?.length || 0;

  const handleConfirm = async () => {
    try {
      await onConfirm(call);
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <WarningIcon color="warning" />
        <Typography variant="h6" component="span">
          Confirmer la suppression définitive
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Message principal */}
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Attention - Action irréversible</AlertTitle>
          Êtes-vous sûr de vouloir supprimer définitivement l'appel{" "}
          <strong>{call.callid}</strong> ?
        </Alert>

        {/* Informations sur l'appel */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 Informations de l'appel
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, ml: 2 }}>
            <Typography variant="body2">
              <strong>ID :</strong> {call.callid}
            </Typography>
            {call.filename && (
              <Typography variant="body2">
                <strong>Fichier :</strong> {call.filename}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Ressources qui seront supprimées */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="error">
            🗑️ Ressources qui seront supprimées
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, ml: 2 }}>
            {/* Appel principal */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DeleteIcon fontSize="small" color="error" />
              <Typography variant="body2">
                <strong>Appel principal</strong> - Supprimé définitivement
              </Typography>
            </Box>

            {/* Fichier audio */}
            {hasAudio ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AudioIcon fontSize="small" color="error" />
                <Typography variant="body2">
                  <strong>Fichier audio</strong> - Supprimé du stockage
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AudioIcon fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  Aucun fichier audio à supprimer
                </Typography>
              </Box>
            )}

            {/* Données de transcription - ✅ CORRIGÉ */}
            {hasTranscription ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TranscriptionIcon fontSize="small" color="error" />
                <Typography variant="body2">
                  <strong>Données de transcription</strong> - Supprimées
                </Typography>
                {transcriptionWordCount > 0 && (
                  <Chip
                    size="small"
                    label={`${transcriptionWordCount} mots`}
                    color="error"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                )}
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TranscriptionIcon fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  Aucune transcription préparée à supprimer
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Données conservées */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="info.main">
            💾 Données conservées (pour statistiques)
          </Typography>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2" color="text.secondary">
              • Tags créés sur cet appel (table turntagged)
              <br />• Post-its liés à cet appel
            </Typography>
          </Box>
        </Box>

        {/* Avertissement final */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            ❌ <strong>Cette action est irréversible</strong>
            <br />
            L'appel sera complètement retiré du système et ne pourra plus être
            utilisé pour le tagging.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={isDeleting}>
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={isDeleting ? undefined : <DeleteIcon />}
          disabled={isDeleting}
          sx={{ minWidth: 160 }}
        >
          {isDeleting ? "Suppression..." : "Supprimer définitivement"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
