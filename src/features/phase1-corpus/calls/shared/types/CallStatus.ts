// src/components/calls/shared/types/CallStatus.ts

/**
 * Statuts possibles d'un appel dans le système TaggerLPL
 *
 * @enum {string}
 */
export enum CallStatus {
  /** Appel créé mais non traité */
  DRAFT = "draft",

  /** Appel en cours de traitement (upload, transcription) */
  PROCESSING = "processing",

  /** Appel prêt pour le tagging (audio + transcription valides) */
  READY = "ready",

  /** Appel en cours de tagging */
  TAGGING = "tagging",

  /** Appel tagué et terminé */
  COMPLETED = "completed",

  /** Erreur lors du traitement */
  ERROR = "error",
}

/**
 * Transitions valides entre les statuts
 */
export const VALID_STATUS_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
  [CallStatus.DRAFT]: [CallStatus.PROCESSING, CallStatus.ERROR],
  [CallStatus.PROCESSING]: [CallStatus.READY, CallStatus.ERROR],
  [CallStatus.READY]: [CallStatus.TAGGING, CallStatus.ERROR],
  [CallStatus.TAGGING]: [CallStatus.COMPLETED, CallStatus.ERROR],
  [CallStatus.COMPLETED]: [], // État final
  [CallStatus.ERROR]: [CallStatus.DRAFT, CallStatus.PROCESSING], // Peut être réinitialisé
};

/**
 * Vérifie si une transition de statut est valide
 */
export function isValidStatusTransition(
  from: CallStatus,
  to: CallStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Obtient le libellé français d'un statut
 */
export function getStatusLabel(status: CallStatus): string {
  const labels = {
    [CallStatus.DRAFT]: "Brouillon",
    [CallStatus.PROCESSING]: "En traitement",
    [CallStatus.READY]: "Prêt",
    [CallStatus.TAGGING]: "En cours de tagging",
    [CallStatus.COMPLETED]: "Terminé",
    [CallStatus.ERROR]: "Erreur",
  };

  return labels[status];
}

/**
 * Obtient la couleur associée à un statut (pour l'UI)
 */
export function getStatusColor(
  status: CallStatus
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning" {
  const colors = {
    [CallStatus.DRAFT]: "default" as const,
    [CallStatus.PROCESSING]: "info" as const,
    [CallStatus.READY]: "success" as const,
    [CallStatus.TAGGING]: "primary" as const,
    [CallStatus.COMPLETED]: "success" as const,
    [CallStatus.ERROR]: "error" as const,
  };

  return colors[status];
}
