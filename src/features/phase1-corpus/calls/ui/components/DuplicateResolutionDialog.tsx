// src/components/calls/ui/components/DuplicateResolutionDialog.tsx

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
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  useTheme,
  alpha,
} from "@mui/material";
import { Warning, Upgrade, Add, Block } from "@mui/icons-material";

import { DuplicateAction } from "../../shared/types/CommonTypes";

interface DuplicateResolutionDialogProps {
  open: boolean;
  onClose: () => void;
  onResolve: (action: DuplicateAction) => void;
  duplicateData?: {
    existingCall: {
      callid: string;
      filename?: string;
      description?: string;
      hasAudio?: boolean;
      hasTranscription?: boolean;
    };
    newImport: {
      hasAudio: boolean;
      hasTranscription: boolean;
      filename?: string;
    };
    matchType?: string;
    confidence?: number;
    recommendation?: "upgrade" | "create_new" | "block";
  };
}

/**
 * Dialog de résolution de doublons avec options contextuelles
 */
export const DuplicateResolutionDialog: React.FC<
  DuplicateResolutionDialogProps
> = ({ open, onClose, onResolve, duplicateData }) => {
  const theme = useTheme();

  const handleAction = (action: DuplicateAction) => {
    onResolve(action);
    onClose();
  };

  const getMatchTypeLabel = (matchType?: string) => {
    switch (matchType) {
      case "filename":
        return "Nom de fichier identique";
      case "content":
        return "Contenu identique";
      case "description":
        return "Description similaire";
      default:
        return "Correspondance détectée";
    }
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation) {
      case "upgrade":
        return "warning";
      case "block":
        return "error";
      case "create_new":
        return "info";
      default:
        return "default";
    }
  };

  const getRecommendationMessage = (recommendation?: string) => {
    switch (recommendation) {
      case "upgrade":
        return "Recommandé : Mettre à niveau l'appel existant";
      case "block":
        return "Recommandé : Annuler l'import (contenu identique)";
      case "create_new":
        return "Recommandé : Créer un nouvel appel";
      default:
        return "Veuillez choisir une action";
    }
  };

  if (!duplicateData) return null;

  const { existingCall, newImport, matchType, confidence, recommendation } =
    duplicateData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255, 152, 0, 0.1)"
              : "rgba(255, 193, 7, 0.05)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Warning color="warning" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" color="warning.main">
              Doublon Détecté
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Un appel similaire existe déjà dans la base
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box>
          {/* Informations sur la détection */}
          <Alert
            severity={getRecommendationColor(recommendation) as any}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              <strong>{getMatchTypeLabel(matchType)}</strong>
              {confidence && ` (${Math.round(confidence * 100)}% de confiance)`}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {getRecommendationMessage(recommendation)}
            </Typography>
          </Alert>

          {/* Comparaison */}
          <Typography variant="h6" gutterBottom>
            Comparaison
          </Typography>

          <Table size="small" sx={{ mb: 3 }}>
            <TableBody>
              <TableRow>
                <TableCell>
                  <strong>Critère</strong>
                </TableCell>
                <TableCell>
                  <strong>Appel Existant</strong>
                </TableCell>
                <TableCell>
                  <strong>Nouvel Import</strong>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>
                  <Chip
                    label={existingCall.callid}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: "monospace" }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    (nouveau)
                  </Typography>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Fichier</TableCell>
                <TableCell>{existingCall.filename || "Non spécifié"}</TableCell>
                <TableCell>{newImport.filename || "Non spécifié"}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Audio</TableCell>
                <TableCell>
                  <Chip
                    label={existingCall.hasAudio ? "Présent" : "Manquant"}
                    color={existingCall.hasAudio ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={newImport.hasAudio ? "Présent" : "Manquant"}
                    color={newImport.hasAudio ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Transcription</TableCell>
                <TableCell>
                  <Chip
                    label={
                      existingCall.hasTranscription ? "Présent" : "Manquant"
                    }
                    color={
                      existingCall.hasTranscription ? "success" : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={newImport.hasTranscription ? "Présent" : "Manquant"}
                    color={newImport.hasTranscription ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Description si disponible */}
          {existingCall.description && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Description de l'appel existant
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  backgroundColor: alpha(theme.palette.grey[500], 0.1),
                  p: 2,
                  borderRadius: 1,
                  fontStyle: "italic",
                }}
              >
                {existingCall.description}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={() => handleAction("cancel")}
          color="inherit"
          startIcon={<Block />}
        >
          Annuler
        </Button>

        {(recommendation === "upgrade" ||
          (!existingCall.hasAudio && newImport.hasAudio) ||
          (!existingCall.hasTranscription && newImport.hasTranscription)) && (
          <Button
            onClick={() => handleAction("upgrade")}
            variant="outlined"
            color="warning"
            startIcon={<Upgrade />}
          >
            Mettre à Niveau
          </Button>
        )}

        <Button
          onClick={() => handleAction("create_new")}
          variant="contained"
          color="primary"
          startIcon={<Add />}
        >
          Créer Nouveau
        </Button>
      </DialogActions>
    </Dialog>
  );
};
