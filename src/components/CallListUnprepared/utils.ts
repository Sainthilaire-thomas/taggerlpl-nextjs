// utils.ts - VERSION CORRIGÉE
import {
  Call,
  CallStats,
  StatusCount,
  CallActions,
  PreparationFilters,
  CallsByOrigin,
} from "./types";
import { STATUS_COLORS, DEFAULT_FILTERS } from "./constants";

// Export DEFAULT_FILTERS pour useCallFilters
export { DEFAULT_FILTERS };

/**
 * Filtre les appels selon les critères sélectionnés
 */
export const filterCalls = (
  calls: Call[],
  filters: PreparationFilters
): Call[] => {
  return calls.filter((call) => {
    // Filtre par état de préparation - gestion robuste des null/undefined
    const isPrepared = Boolean(call.preparedfortranscript);
    if (filters.state === "to_prepare" && isPrepared) return false;
    if (filters.state === "prepared" && !isPrepared) return false;

    // Filtre par contenu - gestion robuste des null/undefined
    const hasAudio = Boolean(call.upload && call.filepath);
    const hasTranscription = Boolean(
      call.transcription?.words && call.transcription.words.length > 0
    );

    switch (filters.content) {
      case "complete":
        if (!hasAudio || !hasTranscription) return false;
        break;
      case "audio_only":
        if (!hasAudio || hasTranscription) return false;
        break;
      case "transcript_only":
        if (hasAudio || !hasTranscription) return false;
        break;
      case "empty":
        if (hasAudio || hasTranscription) return false;
        break;
    }

    // Filtre par statut - gestion des null
    if (filters.status !== "all") {
      const callStatus = call.status || "non_supervisé"; // Défaut si null
      if (callStatus !== filters.status) return false;
    }

    // Filtre par mot-clé dans la transcription
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.trim().toLowerCase();
      const hasKeywordMatch = call.transcription?.words?.some((word) =>
        (word.text || "").toLowerCase().includes(keyword)
      );
      if (!hasKeywordMatch) return false;
    }

    return true;
  });
};

/**
 * Calcule les statistiques globales d'une liste d'appels
 */
export const getCallStats = (calls: Call[]): CallStats => {
  const stats: CallStats = {
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
  };

  calls.forEach((call) => {
    // État de préparation - gestion robuste
    const isPrepared = Boolean(call.preparedfortranscript);
    if (isPrepared) {
      stats.prepared++;
    } else {
      stats.toPreparate++;
    }

    // Type de contenu - gestion robuste
    const hasAudio = Boolean(call.upload && call.filepath);
    const hasTranscription = Boolean(
      call.transcription?.words && call.transcription.words.length > 0
    );

    if (hasAudio && hasTranscription) {
      stats.complete++;
    } else if (hasAudio) {
      stats.audioOnly++;
    } else if (hasTranscription) {
      stats.transcriptOnly++;
    } else {
      stats.empty++;
    }

    // Statut - gestion des null
    const callStatus = call.status || "non_supervisé";
    switch (callStatus) {
      case "conflictuel":
        stats.conflictuel++;
        break;
      case "non_conflictuel":
        stats.nonConflictuel++;
        break;
      default:
        stats.nonSupervisé++;
    }
  });

  return stats;
};

/**
 * Compte les statuts d'une liste d'appels
 */
export const countStatuses = (calls: Call[]): StatusCount => {
  let conflictuel = 0;
  let nonSupervisé = 0;
  let nonConflictuel = 0;

  calls.forEach((call) => {
    const callStatus = call.status || "non_supervisé"; // Défaut si null
    switch (callStatus) {
      case "conflictuel":
        conflictuel++;
        break;
      case "non_supervisé":
        nonSupervisé++;
        break;
      case "non_conflictuel":
        nonConflictuel++;
        break;
      default:
        nonSupervisé++;
    }
  });

  return { conflictuel, nonSupervisé, nonConflictuel };
};

/**
 * Détermine les actions possibles pour un appel
 */
export const getCallActions = (call: Call): CallActions => {
  // ✅ CORRECTION: Gestion robuste des boolean nullable
  const hasAudio = Boolean(call.upload && call.filepath);
  const hasTranscription = Boolean(
    call.transcription?.words && call.transcription.words.length > 0
  );
  const isPrepared = Boolean(call.preparedfortranscript);

  return {
    needsAudio: !hasAudio,
    needsTranscription: !hasTranscription,
    canPrepare: hasTranscription && !isPrepared, // ✅ Toujours boolean
    isPrepared: isPrepared, // ✅ Toujours boolean
  };
};

/**
 * Obtient la couleur associée à un statut
 */
export const getStatusColor = (status?: string | null): string => {
  const normalizedStatus = status || "non_supervisé";
  return (
    STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] ||
    STATUS_COLORS.non_supervisé
  );
};

/**
 * Détermine le label du contenu d'un appel
 */
export const getContentLabel = (call: Call): string => {
  const hasAudio = Boolean(call.upload && call.filepath);
  const hasTranscription = Boolean(
    call.transcription?.words && call.transcription.words.length > 0
  );

  if (hasAudio && hasTranscription) return "Audio + Transcription";
  if (hasAudio) return "Audio seul";
  if (hasTranscription) return "Transcription seule";
  return "Vide";
};

/**
 * Groupe les appels par origine
 */
export const groupCallsByOrigin = (calls: Call[]): CallsByOrigin => {
  const grouped: CallsByOrigin = {};

  calls.forEach((call) => {
    // ✅ NOUVEAU: Normaliser toutes les valeurs "vides" vers une clé unique
    let originKey: string;

    if (!call.origine || call.origine.trim() === "") {
      // Toutes les origines null, undefined, ou chaînes vides → "Aucune origine"
      originKey = "Aucune origine";
    } else if (call.origine.toLowerCase() === "inconnue") {
      // Les origines "Inconnue" (existantes) → "Aucune origine" aussi
      originKey = "Aucune origine";
    } else {
      // Origines normales → utiliser la valeur
      originKey = call.origine;
    }

    // Initialiser le groupe si nécessaire
    if (!grouped[originKey]) {
      grouped[originKey] = [];
    }

    // Ajouter l'appel au groupe
    grouped[originKey].push(call);
  });

  return grouped;
};

// ✅ BONUS: Fonction utilitaire pour normaliser une origine
export const normalizeOrigin = (origine: string | null | undefined): string => {
  if (
    !origine ||
    origine.trim() === "" ||
    origine.toLowerCase() === "inconnue"
  ) {
    return "Aucune origine";
  }
  return origine;
};

// ✅ BONUS: Fonction pour obtenir le libellé d'affichage d'une origine
export const getOriginDisplayLabel = (
  origine: string | null | undefined
): string => {
  if (
    !origine ||
    origine.trim() === "" ||
    origine.toLowerCase() === "inconnue"
  ) {
    return "Aucune origine";
  }
  return origine;
};

/**
 * Obtient l'icône de contenu d'un appel
 */
export const getContentIcon = (call: Call) => {
  const hasAudio = Boolean(call.upload && call.filepath);
  const hasTranscription = Boolean(
    call.transcription?.words && call.transcription.words.length > 0
  );

  return { hasAudio, hasTranscription };
};

/**
 * Obtient les origines disponibles depuis une liste d'appels
 */
export const getAvailableOrigins = (calls: Call[]): string[] => {
  const existingOrigins = calls
    .map((call) => call.origine)
    .filter((origine): origine is string => Boolean(origine))
    .filter((origine, index, arr) => arr.indexOf(origine) === index)
    .sort();

  // Suggestions courantes + origines existantes
  const suggestions = [
    "Personnel",
    "Professionnel",
    "Partenaire",
    "Support",
    "Commercial",
  ];
  const allOrigins = [...suggestions, ...existingOrigins]
    .filter((origine, index, arr) => arr.indexOf(origine) === index)
    .sort();

  return allOrigins;
};

/**
 * Valide une origine (peut être étendue selon vos règles)
 */
export const validateOrigin = (
  origine: string
): { valid: boolean; error?: string } => {
  if (!origine.trim()) {
    return { valid: false, error: "L'origine ne peut pas être vide" };
  }

  if (origine.length > 50) {
    return {
      valid: false,
      error: "L'origine ne peut pas dépasser 50 caractères",
    };
  }

  return { valid: true };
};

/**
 * Formate l'affichage d'une origine
 */
export const formatOriginDisplay = (origine?: string | null): string => {
  if (!origine) return "Non définie";
  return origine.charAt(0).toUpperCase() + origine.slice(1).toLowerCase();
};
