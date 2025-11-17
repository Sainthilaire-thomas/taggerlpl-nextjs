// supervision/types.ts

// ====== Base row (sans contexte) ======
export interface SupervisionTurnTagged {
  id: number;
  call_id: string;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag?: string;
  speaker: string;
  start_time: number;
  end_time: number;
  color: string;
  next_turn_color?: string;
  family: string;
  filename?: string;
  origine?: string; // ← NOUVEAU CHAMP
  hasTranscript: boolean;
  hasAudio: boolean;
  audioUrl?: string;
  duration?: number;
  missingResources?: ("audio" | "transcript")[];
  canBeProcessed?: boolean;
  processingStatus?: "idle" | "processing" | "completed" | "error";
}

// ====== Contexte (−2 / −1 / +1) ======
export type TurnMetadata = {
  prev2_turn_verbatim?: string;
  prev1_turn_verbatim?: string;
  next_turn_verbatim?: string;
  prev2_speaker?: string;
  prev1_speaker?: string;
  next_turn_speaker?: string;
  prev2_turn_tag?: string;
  prev1_turn_tag?: string;
  next_turn_tag?: string;
  [k: string]: any;
};

// ====== Ligne étendue avec contexte ======
export type SupervisionTurnTaggedWithMeta = SupervisionTurnTagged & {
  metadata?: TurnMetadata; // ← utilisé par SupervisionTable / TurnWithContext
  metadata_context?: TurnMetadata; // ← renvoyé par la vue SQL
};

// ====== Stats tag ======
export interface TagGroupStats {
  label: string;
  count: number;
  color: string;
  family: string;
}

// ====== Filtres ======
export interface SupervisionFilters {
  selectedTag: string;
  selectedFamily: string;
  selectedSpeaker: string;
  selectedCallId: string;
  selectedOrigine: string; // ← NOUVEAU FILTRE
  searchText: string;
  hasAudio: boolean | null;
  hasTranscript: boolean | null;
}

// ====== Métriques globales ======
export interface SupervisionMetrics {
  total: number;
  uniqueTags: number;
  uniqueCallIds: number; // Nouvelle métrique
  withAudio: number;
  withTranscript: number;
  modifiable: number;
  needsProcessing: number;
  avgTagsPerCall: number; // Nouvelle métrique
  callsWithMultipleTags: number; // Nouvelle métrique
}

// ====== Hook data ======
export interface SupervisionDataHook {
  supervisionData: SupervisionTurnTaggedWithMeta[]; // ← type étendu
  tagStats: TagGroupStats[];
  stats: SupervisionMetrics;
  loading: boolean;
  error: string | null;
  loadSupervisionData: () => Promise<void>;
}

// ====== Hook filtres ======
export interface SupervisionFiltersHook {
  filters: SupervisionFilters;
  filteredData: SupervisionTurnTaggedWithMeta[]; // ← type étendu
  updateFilters: (updates: Partial<SupervisionFilters>) => void;
  resetFilters: () => void;
  uniqueFamilies: string[];
  uniqueSpeakers: string[];
  uniqueCallIds: string[];
  uniqueOrigines: string[]; // ← NOUVEAU
  callIdToFilename: Map<string, string>; // ← NOUVEAU
}

// ====== Traitement (inchangé) ======
export interface ProcessingStep {
  name: string;
  status: "pending" | "active" | "completed" | "error";
  message: string;
  progress: number;
}

export interface ProcessingJob {
  callId: string;
  status:
    | "queued"
    | "downloading"
    | "uploading"
    | "transcribing"
    | "completed"
    | "error";
  progress: number;
  message: string;
  startTime: number;
  estimatedEndTime?: number;
  error?: string;
  steps: ProcessingStep[];
  currentStep: number;
}

export interface ProcessingJobsHook {
  processingJobs: Map<string, ProcessingJob>;
  addJob: (callId: string, job: ProcessingJob) => void;
  updateJob: (callId: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (callId: string) => void;
  getJob: (callId: string) => ProcessingJob | undefined;
  isProcessing: (callId: string) => boolean;
}

export interface ProcessingModalProps {
  open: boolean;
  onClose: () => void;
  selectedRow: SupervisionTurnTaggedWithMeta | null; // ← type étendu
  onProcessingComplete: () => void;
}

// ====== Cohérence (inchangé) ======
export interface CoherenceMetrics {
  totalTransitions: number;
  taggedTransitions: number;
  coherenceRate: number;
  mostCommonTransitions: Array<{
    from: string;
    to: string;
    count: number;
    examples: string[];
  }>;
  inconsistentTransitions: Array<{
    from: string;
    to: string;
    verbatim: string;
    next_verbatim: string;
    call_id: string;
    confidence: number;
  }>;
}
