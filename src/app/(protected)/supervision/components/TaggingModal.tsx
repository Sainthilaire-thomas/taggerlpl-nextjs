// supervision/components/TaggingModal.tsx

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { SupervisionTurnTagged } from "../types";
import { formatTime } from "../utils/formatters";
import TranscriptLPL from "@/components/TranscriptLPL";

interface TaggingModalProps {
  open: boolean;
  onClose: () => void;
  selectedRow: SupervisionTurnTagged | null;
  audioUrl: string;
}

export const TaggingModal: React.FC<TaggingModalProps> = ({
  open,
  onClose,
  selectedRow,
  audioUrl,
}) => {
  if (!selectedRow) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          height: "90vh",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            🎯 Retaggage Contextualisé - {selectedRow.call_id}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Chip
            label={`Tag actuel: ${selectedRow.tag}`}
            color="primary"
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip
            label={`Position: ${formatTime(selectedRow.start_time)}`}
            variant="outlined"
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        {audioUrl && (
          <TranscriptLPL callId={selectedRow.call_id} audioSrc={audioUrl} />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Fermer et Actualiser
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          Les modifications sont sauvegardées automatiquement
        </Typography>
      </DialogActions>
    </Dialog>
  );
};
