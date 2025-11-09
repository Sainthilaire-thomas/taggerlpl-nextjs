import { useState, useEffect, useCallback, useMemo } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";
import { TranscriptWord } from "../types";
import { useTheme } from "@mui/material/styles";

export function useTranscriptAudio() {
  const theme = useTheme();
  const {
    playerRef,
    updateCurrentWord,
    taggingTranscription,
    taggedTurns,
    setAudioSrc,
  } = useTaggingData();
  const [fontSize, setFontSize] = useState<number>(12);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

  // Format timestamp
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }, []);

  // Handler pour le click sur un mot
  const handleWordClick = useCallback(
    (word: TranscriptWord) => {
      const player = playerRef.current;
      if (!player) return;

      player.currentTime = word.startTime;
      player.play().catch((error) => {
        console.error("Erreur lors de la lecture:", error);
      });

      updateHighlight(word.startTime);
    },
    [playerRef]
  );

  // Mettre à jour le mot mis en surbrillance en fonction du temps de lecture
  const updateHighlight = useCallback(
    (currentTime: number) => {
      const index = taggingTranscription.findIndex(
        (word) => currentTime >= word.startTime && currentTime < word.endTime
      );

      if (index !== -1 && index !== currentWordIndex) {
        setCurrentWordIndex(index);

        if (typeof updateCurrentWord === "function") {
          updateCurrentWord({
            ...taggingTranscription[index],
            timestamp: taggingTranscription[index].endTime,
          });
        } else {
          console.warn("updateCurrentWord is not a function");
        }
      }
    },
    [taggingTranscription, currentWordIndex, updateCurrentWord]
  );

  // Observer les changements dans la lecture audio
  useEffect(() => {
    const player = playerRef.current;

    const onTimeUpdate = () => {
      if (player && player.currentTime) {
        updateHighlight(player.currentTime);
      }
    };

    if (player) {
      player.addEventListener("timeupdate", onTimeUpdate);
    }

    return () => {
      if (player) {
        player.removeEventListener("timeupdate", onTimeUpdate);
      }
    };
  }, [playerRef, updateHighlight]);

  // Définir le style d'un mot
  const getWordStyle = useCallback(
    (index: number) => {
      if (index < 0 || index >= taggingTranscription.length) {
        return {
          fontSize: `${fontSize}px`,
          lineHeight: "1.5",
          display: "inline-block",
          padding: "0 2px",
        };
      }

      const word = taggingTranscription[index];
      const tag = taggedTurns.find(
        (t) => word.startTime >= t.start_time && word.endTime <= t.end_time
      );

      const isActiveWord = index === currentWordIndex;

      return {
        fontWeight: isActiveWord ? "bold" : "normal",
        color: isActiveWord
          ? "white"
          : tag
          ? "#fdfbfb"
          : theme.palette.text.primary,
        backgroundColor: isActiveWord ? "#0c6f65" : "transparent",
        fontSize: `${fontSize}px`,
        lineHeight: "1.5",
        height: "100%",
        display: "inline-block",
        padding: "0 2px",
        verticalAlign: "middle",
        boxSizing: "border-box" as const,
      };
    },
    [
      currentWordIndex,
      fontSize,
      taggedTurns,
      taggingTranscription,
      theme.palette.text.primary,
    ]
  );

  // ✅ Calculer les groupes de tours de parole - VERSION CORRIGÉE
  const groupedTurns = useMemo(() => {
    if (!taggingTranscription || taggingTranscription.length === 0) {
      console.log("⚠️ Pas de transcription disponible");
      return [];
    }

    console.log(
      "🔧 Calcul des groupedTurns avec",
      taggingTranscription.length,
      "mots"
    );

    const groups: TranscriptWord[][] = [];
    let currentGroup: TranscriptWord[] = [];
    let currentSpeaker: string | null = null;

    for (let i = 0; i < taggingTranscription.length; i++) {
      const word = taggingTranscription[i];
      const speaker = word.turn || word.speaker || "Inconnu";

      // Si nouveau speaker ou premier mot
      if (speaker !== currentSpeaker) {
        // Sauvegarder le groupe précédent s'il existe
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        // Commencer un nouveau groupe
        currentGroup = [word];
        currentSpeaker = speaker;
      } else {
        // Même speaker, ajouter au groupe actuel
        currentGroup.push(word);
      }
    }

    // Ajouter le dernier groupe s'il existe
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    console.log(
      `✅ ${groups.length} groupes créés:`,
      groups.map((g) => `${g[0]?.turn || g[0]?.speaker} (${g.length} mots)`)
    );

    return groups;
  }, [taggingTranscription]);

  return {
    fontSize,
    setFontSize,
    currentWordIndex,
    formatTime,
    handleWordClick,
    updateHighlight,
    getWordStyle,
    groupedTurns,
    setAudioSrc,
  };
}
