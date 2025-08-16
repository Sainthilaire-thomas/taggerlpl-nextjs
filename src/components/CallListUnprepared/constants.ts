// constants.ts
import { PreparationFilters } from "./types"; // ✅ Import ajouté

export const FILTER_OPTIONS = {
  STATE: [
    { value: "all", label: "Tous les appels" },
    { value: "to_prepare", label: "À préparer" },
    { value: "prepared", label: "Déjà préparés" },
  ],
  CONTENT: [
    { value: "all", label: "Tous" },
    { value: "complete", label: "Audio + Transcription" },
    { value: "audio_only", label: "Audio seul" },
    { value: "transcript_only", label: "Transcription seule" },
    { value: "empty", label: "Vide" },
  ],
  STATUS: [
    { value: "all", label: "Tous" },
    { value: "non_supervisé", label: "Non supervisé" },
    { value: "conflictuel", label: "Conflictuel" },
    { value: "non_conflictuel", label: "Non conflictuel" },
  ],
} as const;

export const STATUS_COLORS = {
  conflictuel: "red",
  non_conflictuel: "green",
  non_supervisé: "gray",
} as const;

export const DEFAULT_FILTERS: PreparationFilters = {
  state: "all",
  content: "all",
  status: "all",
  keyword: "",
};
