// types.ts
export interface Word {
  text: string;
  turn: string; // ✅ Peut être undefined dans certains cas
  startTime: number;
  endTime: number;
  speaker: string;
}

export interface Transcription {
  words: Word[];
}

// ✅ CORRECTION MAJEURE: Aligner avec les types existants du projet
export interface Call {
  callid: string;
  origine?: string | null; // ✅ Accepter null comme dans DB
  filename?: string | null; // ✅ Accepter null comme dans DB
  description?: string | null; // ✅ Accepter null comme dans DB
  status?: "conflictuel" | "non_conflictuel" | "non_supervisé" | null;
  duree?: number | null;
  transcription?: Transcription | null; // ✅ Accepter null
  audiourl?: string | null;
  filepath?: string | null;
  upload?: boolean | null;
  preparedfortranscript?: boolean | null; // ✅ Accepter null
  is_tagging_call?: boolean | null;
}

export interface CallsByOrigin {
  [origin: string]: Call[];
}

export interface StatusCount {
  conflictuel: number;
  nonSupervisé: number;
  nonConflictuel: number;
}

export interface CallListUnpreparedProps {
  onPrepareCall: (params: {
    call: Call;
    showMessage: (message: string) => void;
  }) => Promise<void>;
  showMessage: (message: string) => void;
}

export type PreparationState = "all" | "to_prepare" | "prepared";
export type ContentType =
  | "all"
  | "complete"
  | "audio_only"
  | "transcript_only"
  | "empty";
export type StatusFilter =
  | "all"
  | "conflictuel"
  | "non_conflictuel"
  | "non_supervisé";

export interface PreparationFilters {
  state: PreparationState;
  content: ContentType;
  status: StatusFilter;
  keyword: string;
}

export interface CallStats {
  total: number;
  toPreparate: number;
  prepared: number;
  complete: number;
  audioOnly: number;
  transcriptOnly: number;
  empty: number;
  conflictuel: number;
  nonConflictuel: number;
  nonSupervisé: number;
}

export interface CallActions {
  needsAudio: boolean;
  needsTranscription: boolean;
  canPrepare: boolean;
  isPrepared: boolean;
}

export interface OriginEditState {
  selectedCalls: Set<string>;
  isEditing: boolean;
  editingCallId?: string;
  isBulkEditing: boolean;
  pendingOrigin?: string;
}

export interface BulkOriginAction {
  type: "SET_ORIGIN";
  callIds: string[];
  newOrigin: string;
}

export interface OriginValidation {
  valid: boolean;
  error?: string;
}
