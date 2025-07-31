// components/CallContentDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Call, Transcription } from "../types";
import { getStatusColor } from "../utils";

interface CallContentDialogProps {
  open: boolean;
  call: Call | null;
  onClose: () => void;
  onStatusChange: (
    call: Call,
    newStatus: "conflictuel" | "non_conflictuel" | "non_supervisé"
  ) => Promise<void>;
}

const CallContentDialog: React.FC<CallContentDialogProps> = ({
  open,
  call,
  onClose,
  onStatusChange,
}) => {
  const renderTranscription = (transcription?: Transcription | null) => {
    if (!transcription?.words || transcription.words.length === 0) {
      return <Typography>Aucune transcription disponible.</Typography>;
    }

    return transcription.words.map((word, index) => (
      <Box
        key={index}
        p={1}
        sx={{
          backgroundColor: index % 2 === 0 ? "#232222" : "#4d4d4d",
          borderRadius: "4px",
        }}
      >
        <Typography variant="body2">
          <strong>{word.turn || "Inconnu"} :</strong> [
          {word.startTime.toFixed(2)} - {word.endTime.toFixed(2)}] {word.text}
        </Typography>
      </Box>
    ));
  };

  const handleStatusClick = () => {
    if (!call) return;

    const currentStatus = call.status || "non_supervisé";
    const newStatus =
      currentStatus === "conflictuel"
        ? "non_supervisé"
        : currentStatus === "non_supervisé"
        ? "non_conflictuel"
        : "conflictuel";

    onStatusChange(call, newStatus);
  };

  const getStatusLabel = (status?: string | null) => {
    const normalizedStatus = status || "non_supervisé";
    switch (normalizedStatus) {
      case "conflictuel":
        return "Conflictuel";
      case "non_conflictuel":
        return "Non Conflictuel";
      default:
        return "Non Supervisé";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Transcription de l&apos;appel
        {call && (
          <Button
            size="small"
            sx={{
              color: "white",
              backgroundColor: getStatusColor(call.status),
            }}
            onClick={handleStatusClick}
          >
            {getStatusLabel(call.status)}
          </Button>
        )}
      </DialogTitle>
      <DialogContent>
        {call ? (
          renderTranscription(call.transcription)
        ) : (
          <Typography>Chargement...</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CallContentDialog;
