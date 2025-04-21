// components/FileSelectionSummary.tsx
import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import {
  AudioFile as AudioFileIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { ZohoFile } from "../types";

interface FileSelectionSummaryProps {
  selectedAudioFile: ZohoFile | null;
  selectedTranscriptionFile: ZohoFile | null;
  onClearAudioFile: () => void;
  onClearTranscriptionFile: () => void;
}

export const FileSelectionSummary: React.FC<FileSelectionSummaryProps> = ({
  selectedAudioFile,
  selectedTranscriptionFile,
  onClearAudioFile,
  onClearTranscriptionFile,
}) => {
  // Ne rien afficher si aucun fichier n'est sélectionné
  if (!selectedAudioFile && !selectedTranscriptionFile) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Fichiers sélectionnés:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {selectedAudioFile && (
          <Chip
            icon={<AudioFileIcon />}
            label={`Audio: ${selectedAudioFile.name}`}
            color="secondary"
            onDelete={onClearAudioFile}
          />
        )}
        {selectedTranscriptionFile && (
          <Chip
            icon={<DescriptionIcon />}
            label={`Transcription: ${selectedTranscriptionFile.name}`}
            color="primary"
            onDelete={onClearTranscriptionFile}
          />
        )}
      </Box>
    </Paper>
  );
};
