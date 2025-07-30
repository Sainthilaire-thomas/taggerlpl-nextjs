// Interface existante étendue
export interface SupervisionTurnTagged {
  id: number;
  call_id: string;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  speaker: string;
  start_time: number;
  end_time: number;
  color: string;
  family: string;
  filename?: string;
  hasTranscript: boolean;
  hasAudio: boolean;
  audioUrl?: string;
  duration?: number;
  // Nouveaux champs pour le traitement à la demande
  missingResources?: ("audio" | "transcript")[];
  canBeProcessed?: boolean;
  processingStatus?: "idle" | "processing" | "completed" | "error";
}

export interface TagGroupStats {
  label: string;
  count: number;
  color: string;
  family: string;
}

export interface SupervisionFilters {
  selectedTag: string;
  selectedFamily: string;
  selectedSpeaker: string;
  searchText: string;
  hasAudio: boolean | null;
  hasTranscript: boolean | null;
}

export interface SupervisionMetrics {
  total: number;
  uniqueTags: number;
  withAudio: number;
  withTranscript: number;
  modifiable: number;
  needsProcessing: number;
}

export interface SupervisionDataHook {
  supervisionData: SupervisionTurnTagged[];
  tagStats: TagGroupStats[];
  stats: SupervisionMetrics;
  loading: boolean;
  error: string | null;
  loadSupervisionData: () => Promise<void>;
}

export interface SupervisionFiltersHook {
  filters: SupervisionFilters;
  filteredData: SupervisionTurnTagged[];
  updateFilters: (updates: Partial<SupervisionFilters>) => void;
  resetFilters: () => void;
  uniqueFamilies: string[];
  uniqueSpeakers: string[];
}

// Nouveaux types pour le traitement
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
  selectedRow: SupervisionTurnTagged | null;
  onProcessingComplete: () => void;
}
