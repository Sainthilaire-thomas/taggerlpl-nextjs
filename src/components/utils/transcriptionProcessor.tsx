// utils/transcriptionProcessor.ts

/**
 * Traite les segments d'une transcription pour gérer les recouvrements de parole
 * @param {Array} segments - Les segments de transcription bruts
 * @returns {Array} - Les segments traités
 */
export const processOverlappingSegments = (segments: any[]) => {
  const processedSegments = [];
  let currentIndex = 0;
  let skipIndices = new Set<number>(); // Pour marquer les segments à ignorer

  while (currentIndex < segments.length) {
    // Si ce segment doit être ignoré, passer au suivant
    if (skipIndices.has(currentIndex)) {
      currentIndex++;
      continue;
    }

    const segment = segments[currentIndex];

    // Si le segment contient une balise Who, on commence le traitement spécial
    if (segment.text && segment.text.includes("<Who nb='")) {
      // Chercher tous les segments qui font partie de cette séquence de recouvrement
      let overlappingTexts = [];
      let startTime = segment.startTime;
      let endTime = segment.endTime;
      let i = currentIndex;
      let foundWho1 = false;
      let foundWho2 = false;
      let segmentsToSkip = new Set<number>();
      let endOfOverlap = false;

      // Première passe : identifier les balises Who et collecter les segments
      while (i < segments.length && !endOfOverlap) {
        const currentSegment = segments[i];

        // Détecter les balises Who
        if (
          currentSegment.text &&
          currentSegment.text.includes("<Who nb='1'/>")
        ) {
          foundWho1 = true;
          segmentsToSkip.add(i);
        } else if (
          currentSegment.text &&
          currentSegment.text.includes("<Who nb='2'/>")
        ) {
          foundWho2 = true;
          segmentsToSkip.add(i);
        }

        // Si on trouve un segment avec un locuteur identifié après les balises Who, arrêter le recouvrement
        if (
          foundWho1 &&
          foundWho2 &&
          currentSegment.turn &&
          currentSegment.turn !== "--" &&
          currentSegment.turn !== "spk1 spk2"
        ) {
          endOfOverlap = true;
          break;
        }

        // Collecter le texte (sauf les balises Who pures)
        if (
          !segmentsToSkip.has(i) &&
          currentSegment.text &&
          !currentSegment.text.includes("<Who nb='1'/>") &&
          !currentSegment.text.includes("<Who nb='2'/>")
        ) {
          // Nettoyer les balises Who du texte
          const cleanedText = currentSegment.text
            .replace(/<Who nb='[0-9]'\/>/g, "")
            .trim();
          if (cleanedText) {
            overlappingTexts.push(cleanedText);
            segmentsToSkip.add(i); // Marquer ce segment pour qu'il ne soit pas traité individuellement
          }
        }

        // Mettre à jour les timestamps
        startTime = Math.min(startTime, currentSegment.startTime);
        endTime = Math.max(endTime, currentSegment.endTime);

        i++;
      }

      // Si on a trouvé une séquence de recouvrement complète
      if (foundWho1 && foundWho2 && overlappingTexts.length > 0) {
        // Créer un segment combiné pour le recouvrement
        const combinedText = overlappingTexts.join(" ");

        processedSegments.push({
          text: combinedText,
          turn: "spk1 spk2", // Utiliser le format "spk1 spk2" pour les recouvrements
          type: "",
          startTime: startTime,
          endTime: endTime,
        });

        // Ajouter tous les segments fusionnés à la liste à ignorer
        segmentsToSkip.forEach((idx) => skipIndices.add(idx));

        // Avancer l'index après la séquence traitée
        currentIndex = endOfOverlap ? i - 1 : i;
        continue;
      }
    }

    // Pour les segments normaux (sans recouvrement)
    if (
      segment.text &&
      segment.text.trim() &&
      !segment.text.includes("<Who nb='1'/>") &&
      !segment.text.includes("<Who nb='2'/>")
    ) {
      processedSegments.push({
        ...segment,
        text: segment.text.replace(/<Who nb='[0-9]'\/>/g, "").trim(),
      });
    }

    currentIndex++;
  }

  return processedSegments;
};

/**
 * Insère les segments de transcription dans la table word après traitement
 * @param {string} transcriptId - L'ID de la transcription
 * @param {Object} transcriptionJson - Le JSONB brut de la transcription
 * @param {Object} supabase - Le client Supabase
 */
export const insertTranscriptionWords = async (
  transcriptId: string,
  transcriptionJson: any,
  supabaseClient: any
) => {
  if (
    !transcriptionJson ||
    !transcriptionJson.words ||
    !Array.isArray(transcriptionJson.words)
  ) {
    console.error(
      "Format de transcription invalide ou words n'est pas un tableau"
    );
    return;
  }

  // Traiter les segments pour gérer les recouvrements de parole
  const processedSegments = processOverlappingSegments(transcriptionJson.words);

  // Préparer les données pour l'insertion dans la table word
  const wordsData = processedSegments.map((segment) => ({
    transcriptid: transcriptId,
    text: segment.text,
    turn: segment.turn || "--",
    startTime: segment.startTime,
    endTime: segment.endTime,
    type: segment.type || "",
  }));

  // Insérer dans la table word
  if (wordsData.length > 0) {
    const { error } = await supabaseClient.from("word").insert(wordsData);
    if (error) {
      throw new Error(
        "Erreur lors de l'insertion dans 'word': " + error.message
      );
    }
  }
};
