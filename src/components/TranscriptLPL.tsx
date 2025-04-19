"use client";

import {
  useEffect,
  useState,
  memo,
  useMemo,
  useCallback,
  MouseEvent,
  RefObject,
} from "react";
import { useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import { useTaggingData } from "@/context/TaggingDataContext";
import TagSelector from "./TagSelector";
import { supabase } from "@/lib/supabaseClient";

// Types
interface TranscriptWord {
  text: string;
  startTime: number;
  endTime: number;
  turn: string;
  index?: number;
}

interface TaggedTurn {
  id: string;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_tag?: string | null;
  next_turn_verbatim?: string | null;
  speaker?: string;
  color?: string;
}

interface LPLTag {
  label: string;
  id?: string;
  description?: string;
  family?: string;
  color?: string;
}

interface TooltipState {
  mode: "create" | "edit";
  tag: TaggedTurn | null;
  position: {
    top: number;
    left: number;
  };
}

interface TranscriptLPLProps {
  callId: string;
  audioSrc?: string | null;
}

const TranscriptLPL = memo<TranscriptLPLProps>(({ callId, audioSrc }) => {
  console.log("TranscriptLPL rerender triggered");
  console.log("TranscriptLPL rerender - Props:", { callId, audioSrc });

  useEffect(() => {
    console.log("TranscriptLPL Props changées :", { callId, audioSrc });
  }, [callId, audioSrc]);

  const theme = useTheme();
  const {
    taggingTranscription,
    fetchTaggingTranscription,
    taggingCalls,
    updateCurrentWord,
    playerRef,
    setAudioSrc,
    taggedTurns,
    fetchTaggedTurns,
    addTag,
  } = useTaggingData();

  // Trouver le `filename` à partir de `callId`
  const filename = useMemo(() => {
    const call = taggingCalls.find((call) => call.callid === callId);
    return call?.filename || "Nom de fichier indisponible";
  }, [taggingCalls, callId]);

  // const [editingTag, setEditingTag] = useState(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedWords, setSelectedWords] = useState<
    { startTime: number; endTime: number }[]
  >([]);
  // const [tooltipPosition, setTooltipPosition] = useState(null);
  const [fontSize, setFontSize] = useState<number>(12);
  const [highlightTurnOne, setHighlightTurnOne] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null); // Contient { position, mode, tag }

  // Format timestamp
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // Charger les tags depuis Supabase
  useEffect(() => {
    if (callId) {
      fetchTaggedTurns(callId); // Remplacez `fetchTags` par une méthode du contexte
    }
  }, [callId, fetchTaggedTurns]);

  useEffect(() => {
    if (audioSrc) setAudioSrc(audioSrc);
  }, [audioSrc, setAudioSrc]);

  useEffect(() => {
    if (callId) fetchTaggingTranscription(callId);
  }, [callId, fetchTaggingTranscription]);

  useEffect(() => {
    const player = playerRef.current;

    const onTimeUpdate = () => {
      if (player && player.currentTime) {
        updateHighlight(player.currentTime);
      }
    };

    if (audioSrc && player) {
      player.addEventListener("timeupdate", onTimeUpdate);
    }

    return () => {
      if (player) {
        player.removeEventListener("timeupdate", onTimeUpdate);
      }
    };
  }, [audioSrc, taggingTranscription, playerRef, currentWordIndex]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const startContainer = range.startContainer.parentElement;
    const endContainer = range.endContainer.parentElement;

    if (startContainer && endContainer) {
      const startWordIndex = parseInt(startContainer.dataset.index || "-1", 10);
      const endWordIndex = parseInt(endContainer.dataset.index || "-1", 10);

      if (
        !isNaN(startWordIndex) &&
        !isNaN(endWordIndex) &&
        startWordIndex >= 0 &&
        endWordIndex >= startWordIndex &&
        endWordIndex < taggingTranscription.length
      ) {
        const startTime = taggingTranscription[startWordIndex].startTime;
        const endTime = taggingTranscription[endWordIndex].endTime;

        setSelectedText(selectedText);
        setSelectedWords([{ startTime, endTime }]);

        const tooltipPosition = {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
        };

        // Configure le tooltip pour le mode "create"
        const newTooltipState: TooltipState = {
          mode: "create",
          tag: null, // Pas de tag dans le mode création
          position: tooltipPosition,
        };

        setTooltipState(newTooltipState);
        console.log(
          "handleMouseUp - tooltipState configuré :",
          newTooltipState
        );
      }
    }
  };

  useEffect(() => {
    console.log("tooltipState mis à jour :", tooltipState);
  }, [tooltipState]);

  const handleRemoveTag = async () => {
    if (!tooltipState || !tooltipState.tag) {
      console.error("Aucun tag à supprimer !");
      return;
    }

    const { tag, id } = tooltipState.tag;

    try {
      const { error } = await supabase.from("turntagged").delete().eq("id", id);

      if (error) {
        console.error("Erreur lors de la suppression du tag :", error.message);
        return;
      }

      console.log(`Tag "${tag}" supprimé avec succès pour le tour ${id}.`);

      // Rafraîchissez les tags après la suppression
      fetchTaggedTurns(callId);

      // Réinitialisez l'état du tooltip
      setTooltipState(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Erreur inattendue lors de la suppression :", errorMessage);
    }
  };

  const handleSaveTag = useCallback(
    async (tag: LPLTag) => {
      const { label } = tag;
      const startTime = selectedWords[0]?.startTime;
      const endTime = selectedWords[0]?.endTime;

      if (!startTime || !endTime || !selectedText) {
        console.error(
          "Les données nécessaires pour tagger ne sont pas complètes.",
          { startTime, endTime, selectedText }
        );
        return;
      }

      console.log("Texte sélectionné pour verbatim :", selectedText);

      // Récupérer le `turn` actuel depuis la transcription
      const currentTurn = taggingTranscription.find(
        (word) =>
          word.startTime >= startTime && word.endTime <= endTime && word.turn
      )?.turn;

      if (!currentTurn) {
        console.error("Impossible de déterminer le tour de parole associé.");
        return;
      }

      console.log("Turn actuel identifié :", currentTurn);

      // Identifier le prochain `turn` (tour de parole)
      const firstNextTurnWord = taggingTranscription.find(
        (word) => word.turn !== currentTurn && word.startTime >= endTime
      );

      let nextTurnVerbatim = null;
      if (firstNextTurnWord) {
        const nextTurn = firstNextTurnWord.turn;
        console.log("Prochain turn identifié :", nextTurn);

        const nextTurnWords = [];
        let foundNextTurn = false;

        for (const word of taggingTranscription) {
          if (
            !foundNextTurn &&
            word.turn !== currentTurn &&
            word.startTime >= endTime
          ) {
            foundNextTurn = true; // Le prochain `turn` est trouvé
          }

          // Si le prochain `turn` est trouvé et correspond au `nextTurn`
          if (foundNextTurn && word.turn === nextTurn) {
            nextTurnWords.push(word);
          }

          // Arrêter d'ajouter des mots si le `turn` change à nouveau
          if (foundNextTurn && word.turn !== nextTurn) {
            break;
          }
        }

        console.log("Next turn words:", nextTurnWords);

        nextTurnVerbatim = nextTurnWords.map((word) => word.text).join(" ");
        console.log("Verbatim du prochain turn :", nextTurnVerbatim);
      } else {
        console.log("Aucun prochain turn trouvé.");
      }

      // Construire `newTag` avec toutes les informations nécessaires
      const newTag = {
        call_id: callId,
        start_time: startTime,
        end_time: endTime,
        tag: label,
        verbatim: selectedText, // Utilisation directe du texte sélectionné
        next_turn_verbatim: nextTurnVerbatim || null, // Mettre à null si aucun prochain tour trouvé
        speaker: currentTurn, // Associer le speaker (turn actuel)
      };

      console.log("Nouveau tag à ajouter :", newTag);

      try {
        const addedTag = await addTag(newTag); // Utiliser la fonction addTag du contexte

        if (addedTag) {
          console.log("Tag ajouté avec succès :", addedTag);
          setSelectedText("");
          setSelectedWords([]);
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du tag :", error);
      }
    },
    [addTag, callId, selectedWords, selectedText, taggingTranscription] // Toutes les dépendances utilisées dans la fonction
  );

  const handleTagClick = (tag: TaggedTurn, event: MouseEvent<HTMLElement>) => {
    if (!event || !event.target) {
      console.error("L'événement est indéfini dans handleTagClick.");
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();

    // Configure le tooltip pour le mode "edit"
    const newTooltipState: TooltipState = {
      mode: "edit",
      tag, // Passe le tag à éditer
      position: {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      },
    };

    console.log("handleTagClick - Nouveau tooltipState :", newTooltipState);
    setTooltipState(newTooltipState);
  };

  const handleEditComplete = useCallback(
    async (selectedLPLTag: LPLTag | null) => {
      if (!selectedLPLTag) {
        console.log("Aucun tag sélectionné après suppression.");
        setTooltipState(null); // Réinitialise l'état du tooltip
        return; // Arrête l'exécution
      }

      console.log("Tag sélectionné pour mise à jour :", selectedLPLTag);

      if (!tooltipState || !tooltipState.tag) {
        console.error("Aucun tag en cours d'édition !");
        return;
      }

      const currentTurnTag = tooltipState.tag; // Récupère le tag en cours d'édition

      // Construire l'objet pour la mise à jour dans `turntagged`
      const updatedTurnTag = {
        id: currentTurnTag.id, // ID de l'enregistrement dans turntagged
        call_id: currentTurnTag.call_id,
        start_time: currentTurnTag.start_time,
        end_time: currentTurnTag.end_time,
        tag: selectedLPLTag.label, // Le label du tag sélectionné
        verbatim: currentTurnTag.verbatim, // Texte sélectionné
        next_turn_tag: currentTurnTag.next_turn_tag || null, // Optionnel
      };

      console.log("Tag nettoyé pour mise à jour :", updatedTurnTag);

      try {
        // Mise à jour dans Supabase
        const { data, error } = await supabase
          .from("turntagged")
          .update(updatedTurnTag)
          .eq("id", updatedTurnTag.id);

        if (error) {
          console.error(
            "Erreur lors de la mise à jour du tag :",
            error.message
          );
          return;
        }

        console.log("Tag mis à jour avec succès :", data);

        // Rafraîchir les tags après mise à jour
        fetchTaggedTurns(callId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        console.error(
          "Erreur inattendue lors de la mise à jour :",
          errorMessage
        );
      }

      // Fermer le tooltip après mise à jour
      setTooltipState(null);
    },
    [tooltipState, fetchTaggedTurns, callId] // Dépendances utilisées dans la fonction
  );

  const getWordStyle = (index: number) => {
    const tag = taggedTurns.find(
      (t) =>
        taggingTranscription[index].startTime >= t.start_time &&
        taggingTranscription[index].endTime <= t.end_time
    );

    const isActiveWord = index === currentWordIndex;

    return {
      fontWeight: isActiveWord ? "bold" : "normal", // Met le texte en gras si actif
      color: isActiveWord
        ? "white"
        : tag
        ? "#fdfbfb"
        : theme.palette.text.primary, // Blanc pour une meilleure lisibilité sur rouge
      backgroundColor: isActiveWord ? "#0c6f65" : "transparent", // Rouge pour le mot actif

      fontSize: `${fontSize}px`,
      lineHeight: "1.5", // Assure que la hauteur des mots correspond à la ligne
      height: "100%", // Occupe toute la hauteur disponible
      display: "inline-block", // Permet de contrôler la hauteur et le remplissage
      padding: "0 2px", // Ajoute un léger padding horizontal pour les mots
      verticalAlign: "middle", // Aligne verticalement les mots au centre

      boxSizing: "border-box" as const, // Inclure le padding dans la hauteur totale
    };
  };

  const handleWordClick = (word: TranscriptWord) => {
    const player = playerRef.current;
    if (!player) return;

    player.currentTime = word.startTime;
    player.play().catch((error) => {
      console.error("Erreur lors de la lecture:", error);
    });

    updateHighlight(word.startTime);
  };

  const updateHighlight = (currentTime: number) => {
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
  };

  console.log(
    "Tagging Transcription:",
    taggingTranscription.map((word) => ({
      startTime: word.startTime,
      endTime: word.endTime,
      turn: word.turn,
      text: word.text,
    }))
  );

  // Regrouper les mots par séquence de `turn`
  const groupedTurns: TranscriptWord[][] = [];
  let currentGroup: TranscriptWord[] = [];
  taggingTranscription.forEach((word, index) => {
    if (currentGroup.length === 0 || currentGroup[0].turn === word.turn) {
      currentGroup.push(word);
    } else {
      groupedTurns.push(currentGroup);
      currentGroup = [word];
    }
    if (index === taggingTranscription.length - 1) {
      groupedTurns.push(currentGroup);
    }
  });

  // Ajouter le log ici :
  console.log(
    "Grouped Turns:",
    groupedTurns.map((group, groupIndex) => ({
      groupIndex,
      groupStart: group[0]?.startTime,
      groupEnd: group[group.length - 1]?.endTime,
      turn: group[0]?.turn,
      words: group.map((word) => word.text),
    }))
  );

  // **Mémorisation de onSelectTag avec useCallback**
  const onSelectTag = useCallback(
    (tag: LPLTag) => {
      if (tooltipState?.mode === "create") {
        handleSaveTag(tag);
      } else if (tooltipState?.mode === "edit") {
        handleEditComplete(tag);
      }
      setTooltipState(null);
    },
    [tooltipState, handleSaveTag, handleEditComplete]
  );

  // **Mémorisation de initialSelectedTurnTag avec useMemo**
  const initialSelectedTurnTag = useMemo(() => {
    return tooltipState?.mode === "edit" ? tooltipState.tag : null;
  }, [tooltipState]);

  const renderTaggedText = () => {
    console.log("Grouped Turns with Index and Verbatim:");
    groupedTurns.forEach((group, groupIndex) => {
      console.log(`Group Index: ${groupIndex}`, {
        verbatim: group.map((word) => word.text).join(" "),
        startTime: group[0]?.startTime,
        endTime: group[group.length - 1]?.endTime,
        turn: group[0]?.turn,
      });
    });

    return groupedTurns.map((group, groupIndex) => {
      const groupTag = taggedTurns.find(
        (tag) =>
          group[0].startTime >= tag.start_time &&
          group[group.length - 1].endTime <= tag.end_time
      );

      return (
        <Box
          key={groupIndex}
          sx={{
            lineHeight: "1.4",
            backgroundColor:
              groupIndex % 2 === 0 ? theme.palette.grey[800] : "transparent",
            padding: theme.spacing(0.25),
          }}
        >
          <Typography
            sx={{
              display: "inline",
              color: theme.palette.text.secondary,
              fontSize: `${fontSize - 2}px`,
            }}
          >
            [{formatTime(group[0].startTime)}] {group[0].turn}:
          </Typography>{" "}
          {groupTag && (
            <Typography
              sx={{
                display: "inline-block",
                color: theme.palette.primary.contrastText,
                backgroundColor: groupTag.color || theme.palette.primary.main,
                fontSize: `${fontSize - 2}px`,
                fontWeight: "bold",
                padding: "2px 4px",
                borderRadius: "4px",
                marginLeft: theme.spacing(1),
                marginRight: theme.spacing(1),
                cursor: "pointer",
              }}
              onClick={(event) => handleTagClick(groupTag, event)}
            >
              {groupTag.tag}
            </Typography>
          )}
          {group.map((word, wordIndex) => (
            <Typography
              key={wordIndex}
              component="span"
              data-index={taggingTranscription.indexOf(word)}
              style={getWordStyle(taggingTranscription.indexOf(word))}
              onClick={() => handleWordClick(word)}
            >
              {word.text}{" "}
            </Typography>
          ))}
        </Box>
      );
    });
  };

  return (
    <Box sx={{ margin: theme.spacing(2), padding: theme.spacing(2) }}>
      {/* Affichage du nom du fichier */}
      <Typography variant="h6" sx={{ marginBottom: theme.spacing(2) }}>
        Fichier : {filename}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {audioSrc ? (
          <>
            <IconButton>
              <NoteAddIcon />
            </IconButton>
            <audio
              controls
              src={audioSrc}
              ref={playerRef as RefObject<HTMLAudioElement>}
            />
          </>
        ) : (
          <Typography variant="body2">Aucun audio disponible</Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={highlightTurnOne}
              onChange={() => setHighlightTurnOne(!highlightTurnOne)}
            />
          }
          label="Surligner les tours de parole"
        />
        <Box>
          <Button
            variant="outlined"
            onClick={() => setFontSize((prev) => Math.max(prev - 1, 12))}
          >
            <RemoveIcon />
          </Button>
          <Typography>{fontSize}px</Typography>
          <Button
            variant="outlined"
            onClick={() => setFontSize((prev) => Math.min(prev + 1, 30))}
          >
            <AddIcon />
          </Button>
        </Box>
      </Box>

      <Box
        onMouseUp={(e) => {
          console.log("MouseUp triggered", e);
          handleMouseUp();
        }}
      >
        <Paper>{renderTaggedText()}</Paper>
      </Box>
      {/* TagSelector global, affiché seulement si tooltipState est défini */}
      {tooltipState && tooltipState.position && (
        <Box
          sx={{
            position: "absolute",
            top: Math.min(
              tooltipState.position.top || 0,
              window.innerHeight - 300 // Ajustez pour éviter le dépassement bas
            ),
            left: Math.min(
              tooltipState.position.left || 0,
              window.innerWidth - 800 // Ajustez pour éviter le dépassement droit
            ),
            width: "80vw",
            maxWidth: "800px", // Limite maximale en largeur
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[3],
            padding: theme.spacing(2),
            borderRadius: theme.shape.borderRadius,
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing(1),
            }}
          >
            <Typography variant="h6">
              {tooltipState.mode === "edit"
                ? "Modifier le Tag"
                : "Gérer les Tags"}
            </Typography>
            <Button
              size="small"
              onClick={() => setTooltipState(null)} // Ferme le tooltip
              sx={{
                minWidth: "auto",
                padding: 0,
                color: theme.palette.error.main,
              }}
            >
              ✕
            </Button>
          </Box>
          <TagSelector
            tooltipState={tooltipState}
            onRemoveTag={handleRemoveTag}
            onSelectTag={onSelectTag}
          />
        </Box>
      )}
    </Box>
  );
});

// Nom d'affichage pour les outils de débogage
TranscriptLPL.displayName = "TranscriptLPL";

export default TranscriptLPL;
