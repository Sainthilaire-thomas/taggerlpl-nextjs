// components/FileSelectionSummary.tsx - Version étendue avec mode
import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import {
  AudioFile as AudioFileIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { ZohoFile, WorkdriveExplorerMode } from "../types";

// ✅ MISE À JOUR: Interface étendue avec prop mode optionnelle
interface FileSelectionSummaryProps {
  selectedAudioFile: ZohoFile | null;
  selectedTranscriptionFile: ZohoFile | null;
  onClearAudioFile: () => void;
  onClearTranscriptionFile: () => void;
  mode?: WorkdriveExplorerMode; // ✅ NOUVEAU - optionnel pour compatibilité
}

// ✅ Fonction utilitaire pour extraire le nom du fichier de manière fiable
const getFileName = (file: ZohoFile | null): string => {
  if (!file) return "Fichier non défini";

  // Essayer différentes propriétés pour récupérer le nom
  const name =
    file.attributes?.name ||
    file.attributes?.display_attr_name ||
    file.attributes?.display_html_name ||
    file.name ||
    `Fichier-${file.id?.substring(0, 8)}` || // Fallback avec ID
    "Nom indisponible";

  console.log("🔍 getFileName pour fichier:", {
    fileId: file.id,
    name: name,
    attributes: file.attributes,
    rawFile: file,
  });

  return name;
};

export const FileSelectionSummary: React.FC<FileSelectionSummaryProps> = ({
  selectedAudioFile,
  selectedTranscriptionFile,
  onClearAudioFile,
  onClearTranscriptionFile,
  mode = "full", // ✅ NOUVEAU: Valeur par défaut pour compatibilité
}) => {
  // ✅ NOUVEAU: Affichage conditionnel selon le mode
  const shouldShowAudio =
    selectedAudioFile && (mode === "full" || mode === "audio_only");
  const shouldShowTranscription =
    selectedTranscriptionFile &&
    (mode === "full" || mode === "transcription_only");

  // Ne rien afficher si aucun fichier n'est sélectionné selon le mode
  if (!shouldShowAudio && !shouldShowTranscription) {
    return null;
  }

  // ✅ NOUVEAU: Titre adapté selon le mode
  const getTitle = () => {
    switch (mode) {
      case "audio_only":
        return "Fichier audio sélectionné:";
      case "transcription_only":
        return "Transcription sélectionnée:";
      default:
        return "Fichiers sélectionnés:";
    }
  };

  // ✅ Log pour debug - étendu avec mode
  console.log("🔍 FileSelectionSummary - État:", {
    mode,
    audioFile: selectedAudioFile,
    transcriptionFile: selectedTranscriptionFile,
    shouldShowAudio,
    shouldShowTranscription,
    audioFileName: selectedAudioFile ? getFileName(selectedAudioFile) : null,
    transcriptionFileName: selectedTranscriptionFile
      ? getFileName(selectedTranscriptionFile)
      : null,
  });

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        {getTitle()}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {shouldShowAudio && (
          <Chip
            icon={<AudioFileIcon />}
            label={`Audio: ${getFileName(selectedAudioFile)}`}
            color="secondary"
            onDelete={onClearAudioFile}
          />
        )}
        {shouldShowTranscription && (
          <Chip
            icon={<DescriptionIcon />}
            label={`Transcription: ${getFileName(selectedTranscriptionFile)}`}
            color="primary"
            onDelete={onClearTranscriptionFile}
          />
        )}
      </Box>
    </Paper>
  );
};
