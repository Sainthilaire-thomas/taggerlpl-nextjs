// components/calls/ComplementActionButtons.tsx - Nouveau composant
"use client";

import React from "react";
import { Box, Button, Tooltip } from "@mui/material";
import {
  AudioFile as AudioIcon,
  Description as TranscriptIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";

// ✅ NOUVEAU: Interface pour un appel
interface Call {
  callid: string;
  filename?: string | null;
  description?: string | null;
  transcription?: any | null;
  upload?: boolean;
  filepath?: string | null;
  audiourl?: string | null;
  preparedfortranscript?: boolean;
  is_tagging_call?: boolean;
  [key: string]: any;
}

interface ComplementActionButtonsProps {
  call: Call;
  onAddAudio?: (call: Call) => void;
  onAddTranscription?: (call: Call) => void;
  onViewContent?: (call: Call) => void;
  disabled?: boolean;
}

export const ComplementActionButtons: React.FC<
  ComplementActionButtonsProps
> = ({
  call,
  onAddAudio,
  onAddTranscription,
  onViewContent,
  disabled = false,
}) => {
  // ✅ Analyser l'état de l'appel pour déterminer les actions nécessaires
  const needsAudio = !call.upload || !call.filepath;
  const needsTranscription = !call.transcription;
  const hasContent = call.upload || call.transcription;

  // ✅ Gestionnaires avec vérifications
  const handleAddAudio = () => {
    if (disabled || !needsAudio || !onAddAudio) return;
    console.log("🎵 Ajout audio pour appel:", call.callid);
    onAddAudio(call);
  };

  const handleAddTranscription = () => {
    if (disabled || !needsTranscription || !onAddTranscription) return;
    console.log("📝 Ajout transcription pour appel:", call.callid);
    onAddTranscription(call);
  };

  const handleViewContent = () => {
    if (disabled || !hasContent || !onViewContent) return;
    console.log("👁️ Visualisation contenu pour appel:", call.callid);
    onViewContent(call);
  };

  // ✅ Messages d'aide contextuels
  const getAudioTooltip = () => {
    if (!needsAudio) return "Audio déjà présent";
    return "Ajouter un fichier audio depuis le disque ou WorkDrive";
  };

  const getTranscriptionTooltip = () => {
    if (!needsTranscription) return "Transcription déjà présente";
    return "Ajouter une transcription depuis le disque ou WorkDrive";
  };

  const getViewTooltip = () => {
    if (!hasContent) return "Aucun contenu à visualiser";
    const content = [];
    if (call.upload) content.push("audio");
    if (call.transcription) content.push("transcription");
    return `Voir ${content.join(" + ")}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        minWidth: 140, // Largeur minimum pour éviter le chevauchement
      }}
    >
      {/* Bouton Ajouter Audio */}
      {needsAudio && (
        <Tooltip title={getAudioTooltip()} placement="left">
          <span>
            {" "}
            {/* Wrapper pour tooltip sur bouton disabled */}
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<AudioIcon />}
              onClick={handleAddAudio}
              disabled={disabled || !onAddAudio}
              sx={{
                fontSize: "0.75rem",
                py: 0.5,
                justifyContent: "flex-start",
                textTransform: "none",
              }}
            >
              Ajouter Audio
            </Button>
          </span>
        </Tooltip>
      )}

      {/* Bouton Ajouter Transcription */}
      {needsTranscription && (
        <Tooltip title={getTranscriptionTooltip()} placement="left">
          <span>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<TranscriptIcon />}
              onClick={handleAddTranscription}
              disabled={disabled || !onAddTranscription}
              sx={{
                fontSize: "0.75rem",
                py: 0.5,
                justifyContent: "flex-start",
                textTransform: "none",
              }}
            >
              Ajouter Transcription
            </Button>
          </span>
        </Tooltip>
      )}

      {/* Bouton Voir Contenu - Toujours présent */}
      <Tooltip title={getViewTooltip()} placement="left">
        <span>
          <Button
            size="small"
            variant="text"
            color="info"
            startIcon={<VisibilityIcon />}
            onClick={handleViewContent}
            disabled={disabled || !hasContent || !onViewContent}
            sx={{
              fontSize: "0.75rem",
              py: 0.5,
              justifyContent: "flex-start",
              textTransform: "none",
            }}
          >
            Voir Contenu
          </Button>
        </span>
      </Tooltip>

      {/* ✅ NOUVEAU: Indicateur d'état si aucune action nécessaire */}
      {!needsAudio && !needsTranscription && (
        <Box
          sx={{
            p: 1,
            textAlign: "center",
            color: "success.main",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          ✅ Complet
        </Box>
      )}
    </Box>
  );
};
