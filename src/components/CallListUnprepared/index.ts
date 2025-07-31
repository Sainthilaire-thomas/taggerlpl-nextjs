// index.ts
export { default } from "./CallListUnprepared";
export type {
  CallListUnpreparedProps,
  Call,
  CallsByOrigin,
  PreparationFilters,
  CallStats,
  CallActions,
  Word,
  Transcription,
} from "./types";

// Export des hooks pour réutilisabilité
export { useCallsData } from "./hooks/useCallsData";
export { useCallFilters } from "./hooks/useCallFilters";
export { useCallActions } from "./hooks/useCallActions";
export { useComplementActions } from "./hooks/useComplementActions";

// Export des utilitaires
export {
  filterCalls,
  getCallStats,
  getCallActions,
  getStatusColor,
  getContentLabel,
  groupCallsByOrigin,
} from "./utils";
