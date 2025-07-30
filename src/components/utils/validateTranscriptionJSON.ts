// utils/validateTranscriptionJSON.ts - CORRECTION FINALE
/**
 * Validation stricte des fichiers de transcription JSON
 * ✅ CORRECTION: Gestion complète des marqueurs de fin avec texte vide
 */

interface ValidWord {
  text: string; // Obligatoire
  startTime: number; // Obligatoire
  endTime: number; // Obligatoire
  speaker?: string; // Optionnel
  turn?: string; // Optionnel (alias de speaker)
  type?: string; // Optionnel
  [key: string]: any; // Autres propriétés optionnelles
}

interface ValidTranscriptionJSON {
  words: ValidWord[];
  [key: string]: any; // Autres propriétés optionnelles au niveau racine
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: ValidTranscriptionJSON;
  warnings?: string[]; // Pour les avertissements non-bloquants
}

/**
 * Valide la structure d'un JSON de transcription
 */
export const validateTranscriptionJSON = (
  jsonString: string
): ValidationResult => {
  // Vérification de base - JSON valide
  try {
    const parsed = JSON.parse(jsonString);
    return validateParsedTranscription(parsed);
  } catch (error) {
    return {
      isValid: false,
      error: `JSON invalide: ${
        error instanceof Error ? error.message : "Format incorrect"
      }`,
    };
  }
};

/**
 * Valide un objet JSON déjà parsé
 */
export const validateParsedTranscription = (parsed: any): ValidationResult => {
  const warnings: string[] = [];

  // Vérification de la propriété 'words'
  if (!parsed.words) {
    return {
      isValid: false,
      error: "Propriété 'words' manquante dans le JSON",
    };
  }

  if (!Array.isArray(parsed.words)) {
    return {
      isValid: false,
      error: "La propriété 'words' doit être un tableau",
    };
  }

  if (parsed.words.length === 0) {
    return {
      isValid: false,
      error: "Le tableau 'words' ne peut pas être vide",
    };
  }

  // Validation de chaque mot
  const validatedWords: ValidWord[] = [];

  for (let i = 0; i < parsed.words.length; i++) {
    const word = parsed.words[i];
    const wordValidation = validateWord(word, i);

    if (!wordValidation.isValid) {
      return {
        isValid: false,
        error: wordValidation.error,
      };
    }

    if (wordValidation.warnings) {
      warnings.push(...wordValidation.warnings);
    }

    validatedWords.push(wordValidation.data!);
  }

  // Validation des timestamps (ordre chronologique)
  const timestampValidation = validateTimestampOrder(validatedWords);
  if (!timestampValidation.isValid) {
    // Avertissement seulement, pas d'erreur bloquante
    warnings.push(
      timestampValidation.error || "Problème d'ordre des timestamps"
    );
  }

  // Validation des speakers/turns
  const speakerValidation = validateSpeakers(validatedWords);
  if (speakerValidation.warnings) {
    warnings.push(...speakerValidation.warnings);
  }

  return {
    isValid: true,
    data: {
      ...parsed,
      words: validatedWords,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * ✅ CORRECTION CRITIQUE: Valide un mot individuel avec gestion correcte des marqueurs de fin
 */
const validateWord = (
  word: any,
  index: number
): ValidationResult & { data?: ValidWord } => {
  if (!word || typeof word !== "object") {
    return {
      isValid: false,
      error: `Mot ${index}: doit être un objet`,
    };
  }

  const warnings: string[] = [];

  // ✅ CORRECTION: Détection plus robuste des marqueurs de fin
  const isEndMarker =
    word.turn === "--" ||
    word.speaker === "--" ||
    (typeof word.text === "string" && word.text.trim() === "" && word.turn);

  // ✅ CORRECTION: Vérification de l'existence du texte AVANT le type
  if (word.text === undefined || word.text === null) {
    return {
      isValid: false,
      error: `Mot ${index}: propriété 'text' manquante`,
    };
  }

  if (typeof word.text !== "string") {
    return {
      isValid: false,
      error: `Mot ${index}: propriété 'text' doit être une chaîne de caractères`,
    };
  }

  // ✅ CORRECTION: Gestion spéciale du texte vide pour les marqueurs de fin
  let finalText = word.text.trim();

  if (finalText === "") {
    if (isEndMarker) {
      finalText = "[FIN]";
      warnings.push(
        `Mot ${index}: marqueur de fin détecté avec texte vide - converti en "[FIN]"`
      );
    } else {
      return {
        isValid: false,
        error: `Mot ${index}: le texte ne peut pas être vide (sauf pour les marqueurs de fin avec turn="--")`,
      };
    }
  }

  // Validation des timestamps
  if (typeof word.startTime !== "number") {
    return {
      isValid: false,
      error: `Mot ${index}: 'startTime' doit être un nombre`,
    };
  }

  if (typeof word.endTime !== "number") {
    return {
      isValid: false,
      error: `Mot ${index}: 'endTime' doit être un nombre`,
    };
  }

  if (word.startTime < 0) {
    return {
      isValid: false,
      error: `Mot ${index}: 'startTime' ne peut pas être négatif`,
    };
  }

  // ✅ CORRECTION: Gérer les cas où startTime === endTime (tags et marqueurs de fin)
  if (word.startTime > word.endTime) {
    return {
      isValid: false,
      error: `Mot ${index}: 'startTime' (${word.startTime}) ne peut pas être supérieur à 'endTime' (${word.endTime})`,
    };
  }

  // Avertissement pour startTime === endTime (sauf pour les tags et marqueurs de fin)
  if (word.startTime === word.endTime && word.type !== "TAG" && !isEndMarker) {
    warnings.push(
      `Mot ${index}: startTime === endTime (${word.startTime}) - peut indiquer un problème sauf pour les tags`
    );
  }

  // Validation optionnelle du speaker/turn
  if (word.speaker && typeof word.speaker !== "string") {
    warnings.push(
      `Mot ${index}: 'speaker' devrait être une chaîne de caractères`
    );
  }

  if (word.turn && typeof word.turn !== "string") {
    warnings.push(`Mot ${index}: 'turn' devrait être une chaîne de caractères`);
  }

  // Validation du type si présent
  if (word.type && typeof word.type !== "string") {
    warnings.push(`Mot ${index}: 'type' devrait être une chaîne de caractères`);
  }

  // ✅ CORRECTION: Normalisation du speaker pour les marqueurs de fin
  let finalSpeaker = word.speaker || word.turn || "Inconnu";

  if (isEndMarker) {
    finalSpeaker = "system";
  }

  if (typeof finalSpeaker !== "string") {
    finalSpeaker = "Inconnu";
  }

  return {
    isValid: true,
    data: {
      text: finalText,
      startTime: word.startTime,
      endTime: word.endTime,
      speaker: finalSpeaker,
      turn: finalSpeaker, // Alias pour compatibilité
      ...(word.type && { type: word.type }),
      // Préserver les autres propriétés
      ...Object.fromEntries(
        Object.entries(word).filter(
          ([key]) =>
            ![
              "text",
              "startTime",
              "endTime",
              "speaker",
              "turn",
              "type",
            ].includes(key)
        )
      ),
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Valide l'ordre chronologique des timestamps
 */
const validateTimestampOrder = (words: ValidWord[]): ValidationResult => {
  for (let i = 1; i < words.length; i++) {
    const prevWord = words[i - 1];
    const currentWord = words[i];

    if (currentWord.startTime < prevWord.startTime) {
      return {
        isValid: false,
        error: `Timestamps non chronologiques: mot ${i - 1} (${
          prevWord.startTime
        }) > mot ${i} (${currentWord.startTime})`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Valide et analyse les speakers
 */
const validateSpeakers = (words: ValidWord[]): { warnings?: string[] } => {
  const warnings: string[] = [];
  const speakers = new Set<string>();

  words.forEach((word, index) => {
    if (word.speaker) {
      speakers.add(word.speaker);
    }

    // Détecter les speakers peu clairs (sauf pour "system" qui est notre marqueur)
    if (
      word.speaker &&
      word.speaker !== "system" &&
      ["undefined", "null", ""].includes(word.speaker.toLowerCase())
    ) {
      warnings.push(`Mot ${index}: speaker mal défini '${word.speaker}'`);
    }
  });

  if (speakers.size === 0) {
    warnings.push("Aucun speaker identifié dans la transcription");
  } else if (speakers.size === 1 && !speakers.has("system")) {
    warnings.push(`Un seul speaker identifié: ${Array.from(speakers)[0]}`);
  }

  return { warnings: warnings.length > 0 ? warnings : undefined };
};

/**
 * Fonction utilitaire pour tester rapidement une transcription
 */
export const quickValidateJSON = (jsonString: string): boolean => {
  const result = validateTranscriptionJSON(jsonString);
  return result.isValid;
};

/**
 * Fonction pour formater les erreurs de validation de manière lisible
 */
export const formatValidationError = (result: ValidationResult): string => {
  if (result.isValid) {
    const warningText = result.warnings
      ? ` (${result.warnings.length} avertissement(s))`
      : "";
    return `✅ JSON valide${warningText}`;
  }

  return `❌ ${result.error}`;
};

/**
 * Statistiques sur une transcription validée
 */
export const getTranscriptionStats = (data: ValidTranscriptionJSON) => {
  const words = data.words;
  const speakers = new Set(words.map((w) => w.speaker).filter(Boolean));
  const totalDuration =
    words.length > 0
      ? Math.max(...words.map((w) => w.endTime)) -
        Math.min(...words.map((w) => w.startTime))
      : 0;

  return {
    wordCount: words.length,
    speakerCount: speakers.size,
    speakers: Array.from(speakers),
    totalDurationSeconds: totalDuration,
    firstWordTime: words[0]?.startTime || 0,
    lastWordTime: words[words.length - 1]?.endTime || 0,
  };
};
