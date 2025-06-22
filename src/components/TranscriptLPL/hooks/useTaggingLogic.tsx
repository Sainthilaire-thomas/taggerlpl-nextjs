import { useState, useCallback } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";
import { supabase } from "@/lib/supabaseClient";
// ✅ Utilisez uniquement les types du contexte
import { TaggedTurn, Tag as LPLTag } from "@/context/TaggingDataContext";

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
      console.error("Aucun tag à supprimer !");
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

      console.log(`Tag "${selectedTaggedTurn.tag}" supprimé avec succès.`);

      // Rafraîchissez les tags après la suppression
      fetchTaggedTurns(callId);

      // Fermer le panneau latéral
      setDrawerOpen(false);
      setSelectedTaggedTurn(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Erreur inattendue lors de la suppression :", errorMessage);
    }
  };

  // ✅ Fonction pour mettre à jour les tags précédents (rétroactif)
  const updatePreviousTagsNextTurnTag = async (newTag: TaggedTurn) => {
    try {
      console.log("=== MISE À JOUR RÉTROACTIVE ===");
      console.log("Nouveau tag créé:", newTag);

      // Trouver les tags qui se terminent avant ce nouveau tag
      const potentialPreviousTags = taggedTurns.filter(
        (existingTag) =>
          existingTag.call_id === newTag.call_id &&
          existingTag.end_time <= newTag.start_time &&
          existingTag.id !== newTag.id &&
          // Vérification correcte des types
          (!existingTag.next_turn_tag ||
            existingTag.next_turn_tag === "" ||
            existingTag.next_turn_tag === null)
      );

      console.log(
        `Trouvé ${potentialPreviousTags.length} tags précédents potentiels`
      );

      for (const previousTag of potentialPreviousTags) {
        // Vérifier si ce tag précédent devrait pointer vers le nouveau tag
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
            `Mise à jour du tag ${previousTag.id}: next_turn_tag = "${newTag.tag}"`
          );

          // Mettre à jour via l'API Supabase
          const { error } = await supabase
            .from("turntagged")
            .update({ next_turn_tag: newTag.tag })
            .eq("id", previousTag.id);

          if (error) {
            console.error("Erreur mise à jour rétroactive:", error);
          } else {
            console.log(
              `✅ Tag ${previousTag.id} mis à jour avec next_turn_tag: ${newTag.tag}`
            );
            // Rafraîchir les tags pour refléter les changements
            fetchTaggedTurns(callId);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour rétroactive:", error);
    }
  };

  // Version ultra-simple de handleSaveTag dans useTaggingLogic.tsx
  // handleSaveTag optimisé dans useTaggingLogic.tsx

  const handleSaveTag = useCallback(
    async (tag: LPLTag) => {
      console.log("=== DÉBUT HANDLE SAVE TAG ===");

      // Validation des données
      const startTime = selectedWords[0]?.startTime;
      const endTime = selectedWords[0]?.endTime;

      if (!startTime || !endTime || !selectedText?.trim()) {
        console.error("Données incomplètes:", {
          startTime,
          endTime,
          selectedText,
        });
        alert("Erreur: Sélection de texte invalide");
        return;
      }

      // Récupérer le speaker actuel
      const currentTurn = taggingTranscription.find(
        (word) =>
          word.startTime >= startTime && word.endTime <= endTime && word.turn
      )?.turn;

      if (!currentTurn) {
        console.error("Speaker non identifié");
        alert("Erreur: Impossible d'identifier le locuteur");
        return;
      }

      try {
        // Calculer next_turn_verbatim (logique existante conservée)
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

        console.log("Tag à sauvegarder:", newTag);

        // Sauvegarder via le contexte
        const savedTag = await addTag(newTag);

        if (savedTag) {
          console.log("✅ Tag sauvegardé:", savedTag.id);

          // Nettoyer l'interface
          setSelectedText("");
          setSelectedWords([]);
          setDrawerOpen(false);

          // Optionnel: Feedback visuel
          // toast.success(`Tag "${tag.label}" ajouté avec succès`);
        } else {
          throw new Error("Échec de la sauvegarde");
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        alert("Erreur lors de la sauvegarde du tag. Veuillez réessayer.");
      }
    },
    [callId, selectedWords, selectedText, taggingTranscription, addTag]
  );

  // Handler pour la modification d'un tag existant
  const handleEditComplete = useCallback(
    async (selectedLPLTag: LPLTag | null) => {
      if (!selectedLPLTag) {
        console.log("Aucun tag sélectionné après suppression.");
        setDrawerOpen(false);
        return;
      }

      console.log("Tag sélectionné pour mise à jour :", selectedLPLTag);

      if (!selectedTaggedTurn) {
        console.error("Aucun tag en cours d'édition !");
        return;
      }

      // Construire l'objet pour la mise à jour (seulement le tag, pas next_turn_tag)
      const updatedTurnTag = {
        tag: selectedLPLTag.label, // Seulement modifier le tag
      };

      console.log("Tag nettoyé pour mise à jour :", updatedTurnTag);

      try {
        // Mise à jour dans Supabase
        const { data, error } = await supabase
          .from("turntagged")
          .update(updatedTurnTag)
          .eq("id", selectedTaggedTurn.id);

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

        // Fermer le panneau après mise à jour
        setDrawerOpen(false);
        setSelectedTaggedTurn(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        console.error(
          "Erreur inattendue lors de la mise à jour :",
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

  // Handler pour la sélection d'un nouveau tag
  const onSelectTag = useCallback(
    (tag: LPLTag) => {
      console.log("=== ON SELECT TAG ===");
      console.log("Tag sélectionné:", tag);
      console.log("Mode actuel:", tagMode);

      if (tagMode === "create") {
        handleSaveTag(tag);
      } else if (tagMode === "edit") {
        handleEditComplete(tag);
      }
    },
    [tagMode, handleSaveTag, handleEditComplete]
  );

  // Handler pour l'événement mouseUp (sélection de texte)
  // handleMouseUp corrigé dans useTaggingLogic.tsx
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
        console.warn("Containers de sélection non trouvés");
        return;
      }

      const startWordIndex = parseInt(startContainer.dataset.index || "-1", 10);
      const endWordIndex = parseInt(endContainer.dataset.index || "-1", 10);

      // ✅ Validation robuste des index
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
        console.log("Sélection valide:", { selectedText, startTime, endTime });
      }

      // ✅ Mise à jour atomique de l'état
      setSelectedText(selectedText);
      setSelectedWords([{ startTime, endTime }]);
      setTagMode("create");
      setSelectedTaggedTurn(null);
      setDrawerOpen(true);
      setTabValue(0);
    } catch (error) {
      console.error("Erreur lors de la sélection:", error);
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

  // Toggle du panneau latéral
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
