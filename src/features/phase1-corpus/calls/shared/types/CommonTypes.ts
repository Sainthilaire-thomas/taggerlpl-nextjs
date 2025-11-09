// src/components/calls/shared/types/CommonTypes.ts - MISE À JOUR

export interface CreateCallData {
  audioFile?: File;
  filename?: string;
  workdriveFileName?: string;
  description?: string;
  origin?: string;
  audioUrl?: string;
  transcriptionData?: any;
  transcriptionText?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportData extends CreateCallData {}

export interface ImportCallbacks {
  onDuplicateFound?: (data: DuplicateDialogData) => Promise<DuplicateAction>;
  onProgress?: (progress: number) => void;
  showMessage?: (message: string) => void;
}

export type ImportResult = ImportSuccess | ImportFailure;

interface ImportSuccess {
  success: true;
  callId: string;
  message: string;
}

export type CancellationReason = "cancelled" | "cancel" | "block";
export type ImportFailureReason =
  | "validation"
  | "duplicate"
  | "storage"
  | "unknown"
  | CancellationReason;

interface ImportFailure {
  success: false;
  error: string;
  reason?: ImportFailureReason;
}

export type DuplicateAction = "upgrade" | "create_new" | "cancel" | "block";

export interface DuplicateDialogData {
  existingCall: {
    callid: string;
    filename?: string;
    description?: string;
    upload?: boolean;
    transcription?: any;
  };
  newImport: {
    hasAudio: boolean;
    hasTranscription: boolean;
    filename?: string;
  };
  canUpgrade?: {
    addAudio: boolean;
    addTranscription: boolean;
    description: string;
  };
  recommendation: UpgradeRecommendation;
}

export type PreparationStrategy = "standard" | "bulk" | "ai-analysis";

export interface PreparationResult {
  success: boolean;
  callId: string;
  strategy: PreparationStrategy;
  processedCount?: number;
  message: string;
  error?: string;
  duration?: number;
  skipped?: boolean;
}

// ✅ NOUVEAU : Type pour les résultats de préparation en lot
export interface BulkPreparationResult {
  success: boolean;
  totalCalls: number;
  successCount: number;
  errorCount: number;
  results: PreparationResult[];
  duration: number;
  strategy: string;
  error?: string;
}

export type UpgradeRecommendation = "upgrade" | "create_new" | "block";

export interface UpgradeAnalysis {
  canAddAudio: boolean;
  canAddTranscription: boolean;
  hasConflict: boolean;
  recommendation: UpgradeRecommendation;
}

export interface TranscriptionMetadata {
  provider?: string;
  confidence?: number;
  language?: string;
  processingTime?: number;
  version?: string;
}

export interface CallUpgradeData {
  audioFile?: File;
  transcriptionData?: any;
  description?: string;
}

export interface DuplicateCriteria {
  filename?: string;
  description?: string;
  transcriptionText?: string;
  contentHash?: string;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  existingCall?: any; // On définira Call plus tard
  matchType?: "filename" | "content" | "description";
  confidence: number;
  analysis: UpgradeAnalysis;
}

// ✅ NOUVEAU : Types pour les opérations en lot
export interface BulkOperationResult {
  callId: string;
  success: boolean;
  error?: string;
}

export interface BulkResult {
  total: number;
  successCount: number;
  errorCount: number;
  results: BulkOperationResult[];
}

// ✅ NOUVEAU : Types pour les callbacks de bulk operations
export interface BulkCallbacks {
  onStart?: (totalCalls: number) => void;
  onProgress?: (
    progress: number,
    successCount: number,
    errorCount: number
  ) => void;
  onBatchStart?: (
    batchNumber: number,
    totalBatches: number,
    batchSize: number
  ) => void;
  onBatchComplete?: (batchNumber: number, results: PreparationResult[]) => void;
  onComplete?: (
    successCount: number,
    errorCount: number,
    duration: number
  ) => void;
  onError?: (error: string) => void;
}

// ✅ NOUVEAU : Types pour l'analyse de préparation
export interface PreparationAnalysis {
  total: number;
  readyToPrepare: number;
  alreadyPrepared: number;
  missingTranscription: number;
  inProcessing: number;
  withErrors: number;
  estimatedDuration: number; // en millisecondes
}
