// src/components/calls/ui/components/ImportSuccessDialog.tsx

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
  useTheme,
} from "@mui/material";
import {
  CheckCircle,
  AudioFile,
  Description,
  Launch,
} from "@mui/icons-material";

interface ImportSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  callId: string | null;
  fileName?: string;
  hasAudio?: boolean;
  hasTranscription?: boolean;
}

/**
 * Dialog de succès d'import avec actions possibles
 */
export const ImportSuccessDialog: React.FC<ImportSuccessDialogProps> = ({
  open,
  onClose,
  callId,
  fileName,
  hasAudio = false,
  hasTranscription = false,
}) => {
  const theme = useTheme();

  const handleGoToCall = () => {
    if (callId) {
      // Navigation vers la page de l'appel ou de tagging
      window.location.href = `/new-tagging?callId=${callId}`;
    }
    onClose();
  };

  const handleGoToManagement = () => {
    // Navigation vers la gestion des appels
    window.location.href = `/calls?tab=2`;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(46, 125, 50, 0.1)"
              : "rgba(76, 175, 80, 0.05)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <CheckCircle color="success" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" color="success.main">
              Import Réussi !
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Votre appel a été importé avec succès
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box>
          {/* Informations sur le fichier */}
          {fileName && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Fichier importé
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                {fileName}
              </Typography>
            </Box>
          )}

          {/* ID de l'appel */}
          {callId && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Identifiant de l'appel
              </Typography>
              <Chip
                label={callId}
                variant="outlined"
                size="small"
                sx={{ fontFamily: "monospace" }}
              />
            </Box>
          )}

          {/* Contenu importé */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Contenu disponible
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {hasAudio && (
                <Chip
                  icon={<AudioFile />}
                  label="Fichier audio"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {hasTranscription && (
                <Chip
                  icon={<Description />}
                  label="Transcription"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
              {!hasAudio && !hasTranscription && (
                <Typography variant="body2" color="text.secondary">
                  Métadonnées importées
                </Typography>
              )}
            </Box>
          </Box>

          {/* Prochaines étapes */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Prochaines étapes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasAudio && hasTranscription
                ? "Votre appel est prêt pour le tagging !"
                : "Vous pouvez maintenant ajouter le contenu manquant ou préparer l'appel."}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>

        <Button
          onClick={handleGoToManagement}
          variant="outlined"
          startIcon={<Launch />}
        >
          Voir la Liste
        </Button>

        {callId && (hasAudio || hasTranscription) && (
          <Button
            onClick={handleGoToCall}
            variant="contained"
            startIcon={<Launch />}
            color="success"
          >
            Commencer le Tagging
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
