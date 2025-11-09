import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { TranscriptTextProps } from "./types";
import { useTheme } from "@mui/material/styles";

const TranscriptText: React.FC<TranscriptTextProps> = ({
  handleMouseUp,
  groupedTurns,
  formatTime,
  fontSize,
  taggedTurns,
  handleTagClick,
  getWordStyle,
  handleWordClick,
  taggingTranscription,
}) => {
  const theme = useTheme();

  // ✅ Fonction pour trouver les tags qui intersectent avec un tour de parole - VERSION FINALE
  const findTagsForTurn = (turn: any[]) => {
    if (!turn || turn.length === 0) return [];

    const turnStartTime = turn[0].startTime;
    const turnEndTime = turn[turn.length - 1].endTime;
    const turnSpeaker = turn[0].turn || turn[0].speaker;

    return taggedTurns.filter((tag) => {
      // Vérifier qu'il y a une intersection temporelle
      const hasTimeOverlap =
        tag.start_time < turnEndTime && tag.end_time > turnStartTime;

      // ✅ Logique de correspondance des speakers améliorée
      const speakerMatches =
        tag.speaker === turnSpeaker ||
        tag.speaker === turn[0].turn ||
        tag.speaker === turn[0].speaker ||
        // Mappings spéciaux pour votre système
        (turnSpeaker === "conseiller_F11" &&
          (tag.speaker === "gare" || tag.speaker === "conseiller")) ||
        (turnSpeaker === "gare" && tag.speaker === "conseiller_F11") ||
        (turnSpeaker === "appelant" && tag.speaker.includes("spk")) ||
        (tag.speaker === "appelant" && turnSpeaker.includes("spk"));

      return speakerMatches && hasTimeOverlap;
    });
  };

  // ✅ Debug logging pour vérifier les données
  if (process.env.NODE_ENV === "development") {
    console.log("TranscriptText - Debug:", {
      groupedTurns: groupedTurns,
      groupedTurnsType: typeof groupedTurns,
      turnsCount: groupedTurns?.length || 0,
      taggedTurnsCount: taggedTurns.length,
      taggingTranscriptionCount: taggingTranscription.length,
      firstTurn: groupedTurns?.[0]?.map((w) => w.text).join(" "),
      firstTag: taggedTurns[0]
        ? `${taggedTurns[0].tag} (${taggedTurns[0].start_time}-${taggedTurns[0].end_time})`
        : null,
    });
  }

  // ✅ Fallback si groupedTurns n'est pas défini - grouper par speaker
  const safeGroupedTurns = groupedTurns || [];

  // Si groupedTurns est vide mais qu'on a une transcription, créer les groupes
  const finalGroupedTurns =
    safeGroupedTurns.length > 0
      ? safeGroupedTurns
      : taggingTranscription.length > 0
      ? groupWordsBySpeaker(taggingTranscription)
      : [];

  // Fonction helper pour grouper les mots par speaker
  function groupWordsBySpeaker(words: any[]) {
    const groups: any[][] = [];
    let currentGroup: any[] = [];
    let currentSpeaker: string | null = null;

    for (const word of words) {
      const speaker = word.turn || word.speaker;

      if (speaker !== currentSpeaker) {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [word];
        currentSpeaker = speaker;
      } else {
        currentGroup.push(word);
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  return (
    <Box onMouseUp={handleMouseUp} sx={{ width: "100%" }}>
      <Paper
        sx={{
          maxHeight: "calc(100vh - 300px)",
          overflow: "auto",
          padding: 1,
          width: "100%",
        }}
      >
        {finalGroupedTurns.map((turn, turnIndex) => {
          // ✅ Utiliser la nouvelle fonction pour trouver les tags
          const turnTags = findTagsForTurn(turn);

          // Debug pour ce tour spécifique (seulement si tags trouvés)
          if (process.env.NODE_ENV === "development" && turnTags.length > 0) {
            console.log(
              `✅ Tour ${turnIndex}: ${turnTags.length} tag(s) affiché(s)`
            );
          }

          return (
            <Box
              key={turnIndex}
              sx={{
                lineHeight: "1.4",
                backgroundColor:
                  turnIndex % 2 === 0 ? theme.palette.grey[800] : "transparent",
                padding: theme.spacing(0.25),
                width: "100%",
              }}
            >
              {/* En-tête du tour de parole */}
              <Typography
                sx={{
                  display: "inline",
                  color: theme.palette.text.secondary,
                  fontSize: `${fontSize - 2}px`,
                }}
              >
                [{formatTime(turn[0]?.startTime || 0)}]{" "}
                {turn[0]?.turn || turn[0]?.speaker || "Inconnu"}:
              </Typography>

              {/* ✅ Afficher tous les tags trouvés pour ce groupe */}
              {turnTags.map((tag, tagIndex) => (
                <Typography
                  key={`tag-${tag.id}-${tagIndex}`}
                  sx={{
                    display: "inline-block",
                    color: theme.palette.primary.contrastText,
                    backgroundColor: tag.color || theme.palette.primary.main,
                    fontSize: `${fontSize - 2}px`,
                    fontWeight: "bold",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    marginLeft: theme.spacing(1),
                    marginRight: theme.spacing(1),
                    cursor: "pointer",
                  }}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag.tag}
                </Typography>
              ))}

              {/* Contenu du tour de parole */}
              <Box sx={{ display: "inline" }}>
                {turn.map((word, wordIndex) => {
                  const wordIndexInTranscript =
                    taggingTranscription.indexOf(word);

                  return (
                    <Typography
                      key={`word-${turnIndex}-${wordIndex}-${word.startTime}`}
                      component="span"
                      data-index={wordIndexInTranscript}
                      style={getWordStyle(wordIndexInTranscript)}
                      onClick={() => handleWordClick(word)}
                    >
                      {word.text || word.word}{" "}
                    </Typography>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
};

export default TranscriptText;
