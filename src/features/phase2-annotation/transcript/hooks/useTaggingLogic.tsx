import { useState, useCallback } from "react";
import { useTaggingData } from "@/features/shared/context";
import { supabase } from "@/lib/supabaseClient";
// âœ… Utilisez uniquement les types du contexte
import { TaggedTurn, Tag as LPLTag } from "@/features/shared/context";

export function useTaggingLogic(callId: string) {
  const { taggedTurns, fetchTaggedTurns, addTag, taggingTranscription } =
    useTaggingData();
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedWords, setSelectedWords] = useState<
    { startTime: number; endTime: number }[]
  >([]);
  const [tagMode, setTagMode] = useState<"create" | "edit">("create");
  const [selectedTaggedTurn, setSelectedTaggedTurn] =
    useState<TaggedTurn | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);

  // Handler pour la suppression d'un tag
  const handleRemoveTag = async () => {
    if (!selectedTaggedTurn) {
      console.error("Aucun tag Ã  supprimer !");
      return;
    }

    try {
      const { error } = await supabase
        .from("turntagged")
        .delete()
        .eq("id", selectedTaggedTurn.id);

      if (error) {
        console.error("Erreur lors de la suppression du tag :", error.message);
        return;
      }

      console.log(`Tag "${selectedTaggedTurn.tag}" supprimÃ© avec succÃ¨s.`);

      // RafraÃ®chissez les tags aprÃ¨s la suppression
      fetchTaggedTurns(callId);

      // Fermer le panneau latÃ©ral
      setDrawerOpen(false);
      setSelectedTaggedTurn(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Erreur inattendue lors de la suppression :", errorMessage);
    }
  };

  // âœ… Fonction pour mettre Ã  jour les tags prÃ©cÃ©dents (rÃ©troactif)
  const updatePreviousTagsNextTurnTag = async (newTag: TaggedTurn) => {
    try {
      console.log("=== MISE Ã€ JOUR RÃ‰TROACTIVE AVEC VALIDATION ===");
      console.log("Nouveau tag crÃ©Ã©:", newTag);

      // âœ… AJOUT : VÃ©rifier que le nouveau tag existe dans lpltag
      const { data: tagExists, error: validationError } = await supabase
        .from("lpltag")
        .select("label")
        .eq("label", newTag.tag)
        .single();

      if (validationError || !tagExists) {
        console.warn(
          `ðŸš« Tag "${newTag.tag}" non trouvÃ© dans lpltag - abandon mise Ã  jour rÃ©troactive`
        );
        return;
      }

      console.log(`âœ… Tag "${newTag.tag}" validÃ© dans lpltag`);

      // Trouver les tags qui se terminent avant ce nouveau tag
      const potentialPreviousTags = taggedTurns.filter(
        (existingTag) =>
          existingTag.call_id === newTag.call_id &&
          existingTag.end_time <= newTag.start_time &&
          existingTag.id !== newTag.id &&
          // VÃ©rification correcte des types
          (!existingTag.next_turn_tag ||
            existingTag.next_turn_tag === "" ||
            existingTag.next_turn_tag === null)
      );

      console.log(
        `TrouvÃ© ${potentialPreviousTags.length} tags prÃ©cÃ©dents potentiels`
      );

      for (const previousTag of potentialPreviousTags) {
        // VÃ©rifier si ce tag prÃ©cÃ©dent devrait pointer vers le nouveau tag
        const nextTurnWord = taggingTranscription.find(
          (word) =>
            word.turn !== previousTag.speaker &&
            word.startTime >= previousTag.end_time
        );

        if (
          nextTurnWord &&
          nextTurnWord.turn === newTag.speaker &&
          Math.abs(nextTurnWord.startTime - newTag.start_time) <= 3.0
        ) {
          console.log(
            `Mise Ã  jour du tag ${previousTag.id}: next_turn_tag = "${newTag.tag}"`
          );

          // Mettre Ã  jour via l'API Supabase
          const { error } = await supabase
            .from("turntagged")
            .update({ next_turn_tag: newTag.tag })
            .eq("id", previousTag.id);

          if (error) {
            console.error("Erreur mise Ã  jour rÃ©troactive:", error);
          } else {
            console.log(
              `âœ… Tag ${previousTag.id} mis Ã  jour avec next_turn_tag: ${newTag.tag}`
            );
            // RafraÃ®chir les tags pour reflÃ©ter les changements
            fetchTaggedTurns(callId);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise Ã  jour rÃ©troactive:", error);
    }
  };

  // Version ultra-simple de handleSaveTag dans useTaggingLogic.tsx
  // handleSaveTag optimisÃ© dans useTaggingLogic.tsx

  // Correction dans useTaggingLogic.tsx - handleSaveTag
  const handleSaveTag = useCallback(
    async (tag: LPLTag) => {
      console.log("=== DÃ‰BUT HANDLE SAVE TAG ===");

      // Validation des donnÃ©es
      const startTime = selectedWords[0]?.startTime;
      const endTime = selectedWords[0]?.endTime;

      if (!startTime || !endTime || !selectedText?.trim()) {
        console.error("DonnÃ©es incomplÃ¨tes:", {
          startTime,
          endTime,
          selectedText,
        });
        alert("Erreur: SÃ©lection de texte invalide");
        return;
      }

      // RÃ©cupÃ©rer le speaker actuel
      const currentTurn = taggingTranscription.find(
        (word) =>
          word.startTime >= startTime && word.endTime <= endTime && word.turn
      )?.turn;

      if (!currentTurn) {
        console.error("Speaker non identifiÃ©");
        alert("Erreur: Impossible d'identifier le locuteur");
        return;
      }

      try {
        // Calculer next_turn_verbatim (logique existante conservÃ©e)
        const firstNextTurnWord = taggingTranscription.find(
          (word) => word.turn !== currentTurn && word.startTime >= endTime
        );

        let nextTurnVerbatim = null;
        if (firstNextTurnWord) {
          const nextTurn = firstNextTurnWord.turn;
          const nextTurnWords = [];
          let foundNextTurn = false;

          for (const word of taggingTranscription) {
            if (
              !foundNextTurn &&
              word.turn !== currentTurn &&
              word.startTime >= endTime
            ) {
              foundNextTurn = true;
            }
            if (foundNextTurn && word.turn === nextTurn) {
              nextTurnWords.push(word);
            }
            if (foundNextTurn && word.turn !== nextTurn) {
              break;
            }
          }
          nextTurnVerbatim = nextTurnWords.map((word) => word.text).join(" ");
        }

        // Construire le tag
        const newTag = {
          call_id: callId,
          start_time: startTime,
          end_time: endTime,
          tag: tag.label,
          verbatim: selectedText.trim(),
          next_turn_verbatim: nextTurnVerbatim || undefined,
          speaker: currentTurn,
        };

        console.log("Tag Ã  sauvegarder:", newTag);

        // Sauvegarder via le contexte
        const savedTag = await addTag(newTag);

        if (savedTag) {
          console.log("âœ… Tag sauvegardÃ©:", savedTag.id);

          // âœ… AJOUT : Mise Ã  jour rÃ©troactive des tags prÃ©cÃ©dents
          try {
            await updatePreviousTagsNextTurnTag(savedTag);
          } catch (retroError) {
            console.error("Erreur mise Ã  jour rÃ©troactive:", retroError);
            // Ne pas faire Ã©chouer la sauvegarde pour autant
          }

          // Nettoyer l'interface
          setSelectedText("");
          setSelectedWords([]);
          setDrawerOpen(false);

          // Optionnel: Feedback visuel
          // toast.success(`Tag "${tag.label}" ajoutÃ© avec succÃ¨s`);
        } else {
          throw new Error("Ã‰chec de la sauvegarde");
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        alert("Erreur lors de la sauvegarde du tag. Veuillez rÃ©essayer.");
      }
    },
    [callId, selectedWords, selectedText, taggingTranscription, addTag] // âœ… Ajouter updatePreviousTagsNextTurnTag aux dÃ©pendances si nÃ©cessaire
  );

  // Handler pour la modification d'un tag existant
  const handleEditComplete = useCallback(
    async (selectedLPLTag: LPLTag | null) => {
      if (!selectedLPLTag) {
        console.log("Aucun tag sÃ©lectionnÃ© aprÃ¨s suppression.");
        setDrawerOpen(false);
        return;
      }

      console.log("Tag sÃ©lectionnÃ© pour mise Ã  jour :", selectedLPLTag);

      if (!selectedTaggedTurn) {
        console.error("Aucun tag en cours d'Ã©dition !");
        return;
      }

      // Construire l'objet pour la mise Ã  jour (seulement le tag, pas next_turn_tag)
      const updatedTurnTag = {
        tag: selectedLPLTag.label, // Seulement modifier le tag
      };

      console.log("Tag nettoyÃ© pour mise Ã  jour :", updatedTurnTag);

      try {
        // Mise Ã  jour dans Supabase
        const { data, error } = await supabase
          .from("turntagged")
          .update(updatedTurnTag)
          .eq("id", selectedTaggedTurn.id);

        if (error) {
          console.error(
            "Erreur lors de la mise Ã  jour du tag :",
            error.message
          );
          return;
        }

        console.log("Tag mis Ã  jour avec succÃ¨s :", data);

        // RafraÃ®chir les tags aprÃ¨s mise Ã  jour
        fetchTaggedTurns(callId);

        // Fermer le panneau aprÃ¨s mise Ã  jour
        setDrawerOpen(false);
        setSelectedTaggedTurn(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        console.error(
          "Erreur inattendue lors de la mise Ã  jour :",
          errorMessage
        );
      }
    },
    [selectedTaggedTurn, fetchTaggedTurns, callId]
  );

  // Handler pour le click sur un tag existant
  const handleTagClick = (tag: TaggedTurn) => {
    setTagMode("edit");
    setSelectedTaggedTurn(tag);
    setDrawerOpen(true);
    setTabValue(0);
  };

  // Handler pour la sÃ©lection d'un nouveau tag
  const onSelectTag = useCallback(
    (tag: LPLTag) => {
      console.log("=== ON SELECT TAG ===");
      console.log("Tag sÃ©lectionnÃ©:", tag);
      console.log("Mode actuel:", tagMode);

      if (tagMode === "create") {
        handleSaveTag(tag);
      } else if (tagMode === "edit") {
        handleEditComplete(tag);
      }
    },
    [tagMode, handleSaveTag, handleEditComplete]
  );

  // Handler pour l'Ã©vÃ©nement mouseUp (sÃ©lection de texte)
  // handleMouseUp corrigÃ© dans useTaggingLogic.tsx
  const handleMouseUp = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("=== HANDLE MOUSE UP ===");
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer.parentElement;
      const endContainer = range.endContainer.parentElement;

      if (!startContainer || !endContainer) {
        console.warn("Containers de sÃ©lection non trouvÃ©s");
        return;
      }

      const startWordIndex = parseInt(startContainer.dataset.index || "-1", 10);
      const endWordIndex = parseInt(endContainer.dataset.index || "-1", 10);

      // âœ… Validation robuste des index
      if (
        isNaN(startWordIndex) ||
        isNaN(endWordIndex) ||
        startWordIndex < 0 ||
        endWordIndex < 0 ||
        startWordIndex >= taggingTranscription.length ||
        endWordIndex >= taggingTranscription.length ||
        startWordIndex > endWordIndex
      ) {
        console.warn("Index invalides:", {
          startWordIndex,
          endWordIndex,
          transcriptionLength: taggingTranscription.length,
        });
        return;
      }

      const startTime = taggingTranscription[startWordIndex].startTime;
      const endTime = taggingTranscription[endWordIndex].endTime;

      if (process.env.NODE_ENV === "development") {
        console.log("SÃ©lection valide:", { selectedText, startTime, endTime });
      }

      // âœ… Mise Ã  jour atomique de l'Ã©tat
      setSelectedText(selectedText);
      setSelectedWords([{ startTime, endTime }]);
      setTagMode("create");
      setSelectedTaggedTurn(null);
      setDrawerOpen(true);
      setTabValue(0);
    } catch (error) {
      console.error("Erreur lors de la sÃ©lection:", error);
    }
  }, [
    taggingTranscription,
    setSelectedText,
    setSelectedWords,
    setTagMode,
    setSelectedTaggedTurn,
    setDrawerOpen,
    setTabValue,
  ]);

  // Toggle du panneau latÃ©ral
  const handleToggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handler pour le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return {
    selectedText,
    selectedWords,
    tagMode,
    selectedTaggedTurn,
    drawerOpen,
    tabValue,
    handleRemoveTag,
    handleSaveTag,
    handleEditComplete,
    handleTagClick,
    onSelectTag,
    handleMouseUp,
    handleToggleDrawer,
    handleTabChange,
    setSelectedText,
    setSelectedWords,
    setTagMode,
    setSelectedTaggedTurn,
    setDrawerOpen,
    setTabValue,
  };
}

