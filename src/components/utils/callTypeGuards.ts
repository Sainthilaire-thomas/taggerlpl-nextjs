// utils/callTypeGuards.ts
/**
 * Fonctions utilitaires de vérification TypeScript pour les appels
 * Évite les erreurs "possibly undefined" et améliore la sécurité du code
 */

// Types imports
interface Word {
  text: string;
  turn: string;
  startTime: number;
  endTime: number;
}

interface Transcription {
  words: Word[];
}

interface Call {
  callid: string;
  origine?: string;
  filename?: string;
  description?: string;
  status?: "conflictuel" | "non_conflictuel" | "non_supervisé";
  duree?: number;
  transcription?: Transcription;
  audiourl?: string;
  filepath?: string;
  upload?: boolean;
  preparedfortranscript?: boolean;
  is_tagging_call?: boolean;
}

/**
 * Vérifie si un appel a un fichier audio
 * @param call - L'appel à vérifier
 * @returns boolean - true si l'appel a un audio
 */
export const hasAudio = (call: Call): boolean => {
  return Boolean(call.upload && call.filepath);
};

/**
 * Vérifie si un appel a une transcription valide
 * @param call - L'appel à vérifier
 * @returns boolean - true si l'appel a une transcription avec des mots
 */
export const hasTranscription = (call: Call): boolean => {
  return Boolean(
    call.transcription &&
      call.transcription.words &&
      Array.isArray(call.transcription.words) &&
      call.transcription.words.length > 0
  );
};

/**
 * Vérifie si un appel a du contenu complet (audio + transcription)
 * @param call - L'appel à vérifier
 * @returns boolean - true si l'appel a audio ET transcription
 */
export const hasCompleteContent = (call: Call): boolean => {
  return hasAudio(call) && hasTranscription(call);
};

/**
 * Vérifie si un appel est vide (pas d'audio ni de transcription)
 * @param call - L'appel à vérifier
 * @returns boolean - true si l'appel n'a ni audio ni transcription
 */
export const isEmpty = (call: Call): boolean => {
  return !hasAudio(call) && !hasTranscription(call);
};

/**
 * Vérifie si un appel a seulement de l'audio
 * @param call - L'appel à vérifier
 * @returns boolean - true si l'appel a audio mais pas de transcription
 */
export const hasAudioOnly = (call: Call): boolean => {
  return hasAudio(call) && !hasTranscription(call);
};

/**
 * Vérifie si un appel a seulement une transcription
 * @param call - L'appel à vérifier
 * @returns boolean - true si l'appel a transcription mais pas d'audio
 */
export const hasTranscriptionOnly = (call: Call): boolean => {
  return !hasAudio(call) && hasTranscription(call);
};

/**
 * Obtient le nombre de mots dans une transcription de manière sécurisée
 * @param call - L'appel à analyser
 * @returns number - Le nombre de mots (0 si pas de transcription)
 */
export const getWordCount = (call: Call): number => {
  if (!hasTranscription(call)) return 0;
  return call.transcription!.words.length;
};

/**
 * Recherche un mot-clé dans la transcription de manière sécurisée
 * @param call - L'appel à analyser
 * @param keyword - Le mot-clé à rechercher
 * @returns boolean - true si le mot-clé est trouvé
 */
export const searchInTranscription = (call: Call, keyword: string): boolean => {
  if (!hasTranscription(call) || !keyword.trim()) return false;

  const searchTerm = keyword.trim().toLowerCase();
  return call.transcription!.words.some((word) =>
    word.text.toLowerCase().includes(searchTerm)
  );
};

/**
 * Obtient les speakers uniques d'une transcription de manière sécurisée
 * @param call - L'appel à analyser
 * @returns string[] - Liste des speakers uniques
 */
export const getUniqueSpeakers = (call: Call): string[] => {
  if (!hasTranscription(call)) return [];

  const speakers = new Set<string>();
  call.transcription!.words.forEach((word) => {
    if (word.turn) {
      speakers.add(word.turn);
    }
  });

  return Array.from(speakers);
};

/**
 * Obtient la durée totale d'une transcription de manière sécurisée
 * @param call - L'appel à analyser
 * @returns number - Durée en secondes (0 si pas de transcription)
 */
export const getTranscriptionDuration = (call: Call): number => {
  if (!hasTranscription(call)) return 0;

  const words = call.transcription!.words;
  if (words.length === 0) return 0;

  const firstWordStart = Math.min(...words.map((w) => w.startTime));
  const lastWordEnd = Math.max(...words.map((w) => w.endTime));

  return lastWordEnd - firstWordStart;
};

/**
 * Type guard pour vérifier qu'un appel a une transcription
 * @param call - L'appel à vérifier
 * @returns call is Call & { transcription: Transcription } - Type guard
 */
export const callHasTranscription = (
  call: Call
): call is Call & { transcription: Transcription } => {
  return hasTranscription(call);
};

/**
 * Type guard pour vérifier qu'un appel a un audio
 * @param call - L'appel à vérifier
 * @returns call is Call & { upload: true; filepath: string } - Type guard
 */
export const callHasAudio = (
  call: Call
): call is Call & { upload: true; filepath: string } => {
  return hasAudio(call);
};

/**
 * Obtient le label du type de contenu d'un appel
 * @param call - L'appel à analyser
 * @returns string - Label descriptif du contenu
 */
export const getContentTypeLabel = (call: Call): string => {
  if (hasCompleteContent(call)) return "Audio + Transcription";
  if (hasAudioOnly(call)) return "Audio seul";
  if (hasTranscriptionOnly(call)) return "Transcription seule";
  return "Vide";
};

/**
 * Obtient la couleur appropriée pour le statut d'un appel
 * @param status - Le statut de l'appel
 * @returns string - Couleur CSS appropriée
 */
export const getStatusColor = (status?: string): string => {
  switch (status) {
    case "conflictuel":
      return "red";
    case "non_conflictuel":
      return "green";
    case "non_supervisé":
    default:
      return "gray";
  }
};

/**
 * Filtre les appels selon plusieurs critères de manière sécurisée
 * @param calls - Liste des appels à filtrer
 * @param filters - Critères de filtrage
 * @returns Call[] - Appels filtrés
 */
export const filterCallsSafely = (
  calls: Call[],
  filters: {
    state?: "all" | "to_prepare" | "prepared";
    content?: "all" | "complete" | "audio_only" | "transcript_only" | "empty";
    status?: "all" | "conflictuel" | "non_conflictuel" | "non_supervisé";
    keyword?: string;
  }
): Call[] => {
  return calls.filter((call) => {
    // Filtre par état de préparation
    if (filters.state === "to_prepare" && call.preparedfortranscript)
      return false;
    if (filters.state === "prepared" && !call.preparedfortranscript)
      return false;

    // Filtre par type de contenu
    switch (filters.content) {
      case "complete":
        if (!hasCompleteContent(call)) return false;
        break;
      case "audio_only":
        if (!hasAudioOnly(call)) return false;
        break;
      case "transcript_only":
        if (!hasTranscriptionOnly(call)) return false;
        break;
      case "empty":
        if (!isEmpty(call)) return false;
        break;
      // "all" - pas de filtre
    }

    // Filtre par statut
    if (
      filters.status &&
      filters.status !== "all" &&
      call.status !== filters.status
    ) {
      return false;
    }

    // Filtre par mot-clé dans la transcription
    if (filters.keyword && filters.keyword.trim()) {
      if (!searchInTranscription(call, filters.keyword)) return false;
    }

    return true;
  });
};

/**
 * Calcule les statistiques d'une liste d'appels de manière sécurisée
 * @param calls - Liste des appels à analyser
 * @returns Objet avec les statistiques
 */
export const calculateCallStats = (calls: Call[]) => {
  const stats = {
    total: calls.length,
    toPreparate: 0,
    prepared: 0,
    complete: 0,
    audioOnly: 0,
    transcriptOnly: 0,
    empty: 0,
    conflictuel: 0,
    nonConflictuel: 0,
    nonSupervisé: 0,
    totalWords: 0,
    averageWordsPerCall: 0,
  };

  calls.forEach((call) => {
    // États de préparation
    if (call.preparedfortranscript) {
      stats.prepared++;
    } else {
      stats.toPreparate++;
    }

    // Types de contenu
    if (hasCompleteContent(call)) {
      stats.complete++;
    } else if (hasAudioOnly(call)) {
      stats.audioOnly++;
    } else if (hasTranscriptionOnly(call)) {
      stats.transcriptOnly++;
    } else {
      stats.empty++;
    }

    // Statuts
    switch (call.status) {
      case "conflictuel":
        stats.conflictuel++;
        break;
      case "non_conflictuel":
        stats.nonConflictuel++;
        break;
      default:
        stats.nonSupervisé++;
    }

    // Comptage des mots
    stats.totalWords += getWordCount(call);
  });

  // Moyenne des mots par appel
  stats.averageWordsPerCall =
    stats.total > 0 ? Math.round(stats.totalWords / stats.total) : 0;

  return stats;
};
