// TranscriptLPL optimisé - Version avec memo et callbacks stables

"use client";

import { memo, useEffect, useMemo, useCallback } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTaggingData } from "@/context/TaggingDataContext";

// Importation des composants
import TranscriptHeader from "./TranscriptHeader";
import TranscriptAudioPlayer from "./TranscriptAudioPlayer";
import TranscriptControls from "./TranscriptControls";
import TranscriptText from "./TranscriptText";
import TagSidePanel from "./TagSidePanel";

// Importation des hooks
import { useTaggingLogic } from "./hooks/useTaggingLogic";
import { useTranscriptAudio } from "./hooks/useTranscriptAudio";
import { TranscriptLPLProps, DRAWER_WIDTH } from "./types";

const TranscriptLPL = memo<TranscriptLPLProps>(({ callId, audioSrc }) => {
  // Suppression des logs en production pour améliorer les performances
  if (process.env.NODE_ENV === "development") {
    console.log("TranscriptLPL render - callId:", callId);
  }

  const theme = useTheme();
  const {
    taggingTranscription,
    fetchTaggingTranscription,
    taggingCalls,
    playerRef,
    taggedTurns,
    fetchTaggedTurns,
  } = useTaggingData();

  // Mémoisation du filename
  const filename = useMemo(() => {
    const call = taggingCalls.find((call) => call.callid === callId);
    return call?.filename || "Nom de fichier indisponible";
  }, [taggingCalls, callId]);

  // Hooks personnalisés
  const taggingLogic = useTaggingLogic(callId);
  const transcriptAudio = useTranscriptAudio();

  // Mémoisation des handlers pour éviter les re-renders
  const memoizedHandlers = useMemo(
    () => ({
      handleMouseUp: taggingLogic.handleMouseUp,
      handleTagClick: taggingLogic.handleTagClick,
      handleToggleDrawer: taggingLogic.handleToggleDrawer,
      onSelectTag: taggingLogic.onSelectTag,
      onRemoveTag: taggingLogic.handleRemoveTag,
    }),
    [
      taggingLogic.handleMouseUp,
      taggingLogic.handleTagClick,
      taggingLogic.handleToggleDrawer,
      taggingLogic.onSelectTag,
      taggingLogic.handleRemoveTag,
    ]
  );

  // Mémoisation des données pour éviter les re-renders
  const memoizedData = useMemo(
    () => ({
      taggedTurns,
      taggingTranscription,
      groupedTurns: transcriptAudio.groupedTurns,
    }),
    [taggedTurns, taggingTranscription, transcriptAudio.groupedTurns]
  );

  // Charger les données initiales seulement quand nécessaire
  useEffect(() => {
    if (callId && typeof callId === "string") {
      fetchTaggedTurns(callId);
      fetchTaggingTranscription(callId);
    }
  }, [callId]); // Dépendances minimales

  // Gérer l'audio seulement quand nécessaire
  useEffect(() => {
    if (audioSrc) {
      transcriptAudio.setAudioSrc(audioSrc);
    }
  }, [audioSrc, transcriptAudio.setAudioSrc]); // Dépendance corrigée

  return (
    <Box
      sx={{
        display: "flex",
        position: "relative",
        height: "calc(100vh - 200px)",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Section principale */}
      <Box
        sx={{
          width: "100%",
          marginRight: taggingLogic.drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: "margin-right 0.3s ease",
          overflow: "auto",
          padding: theme.spacing(2),
        }}
      >
        {/* En-tête */}
        <TranscriptHeader filename={filename} />

        {/* Lecteur audio */}
        <Box sx={{ width: "100%" }}>
          <TranscriptAudioPlayer
            audioSrc={audioSrc}
            playerRef={playerRef as React.RefObject<HTMLAudioElement>}
          />
        </Box>

        {/* Contrôles */}
        <TranscriptControls
          fontSize={transcriptAudio.fontSize}
          setFontSize={transcriptAudio.setFontSize}
          drawerOpen={taggingLogic.drawerOpen}
          handleToggleDrawer={memoizedHandlers.handleToggleDrawer}
          callId={callId}
        />

        {/* Texte de transcription */}
        <TranscriptText
          handleMouseUp={memoizedHandlers.handleMouseUp}
          groupedTurns={memoizedData.groupedTurns}
          formatTime={transcriptAudio.formatTime}
          fontSize={transcriptAudio.fontSize}
          taggedTurns={memoizedData.taggedTurns}
          handleTagClick={memoizedHandlers.handleTagClick}
          getWordStyle={transcriptAudio.getWordStyle}
          handleWordClick={transcriptAudio.handleWordClick}
          taggingTranscription={memoizedData.taggingTranscription}
        />
      </Box>

      {/* Panneau latéral */}
      <TagSidePanel
        drawerOpen={taggingLogic.drawerOpen}
        handleToggleDrawer={memoizedHandlers.handleToggleDrawer}
        tagMode={taggingLogic.tagMode}
        selectedTaggedTurn={taggingLogic.selectedTaggedTurn}
        selectedText={taggingLogic.selectedText}
        onSelectTag={memoizedHandlers.onSelectTag}
        onRemoveTag={memoizedHandlers.onRemoveTag}
        callId={callId}
        taggedTurns={memoizedData.taggedTurns}
        filename={filename}
      />
    </Box>
  );
});

TranscriptLPL.displayName = "TranscriptLPL";

export default TranscriptLPL;
