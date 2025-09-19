// src/components/calls/shared/config/CallsConfig.ts
import {
  DuplicateDetectionConfig,
  DEFAULT_DUPLICATE_CONFIG,
} from "../../domain/services/DuplicateService";

/**
 * Configuration globale du domaine Calls
 */
export const CallsConfig = {
  storage: {
    bucket: "Calls",
    maxFileSize: 100 * 1024 * 1024, // 100MB en bytes
    maxFileSizeMB: 100,
    allowedFormats: ["mp3", "wav", "m4a", "aac", "ogg"] as const,
    allowedMimeTypes: [
      "audio/mp3",
      "audio/wav",
      "audio/m4a",
      "audio/aac",
      "audio/ogg",
    ] as const,
    signedUrlExpiration: 1200, // 20 minutes en secondes
    maxSignedUrlExpiration: 24 * 60 * 60, // 24 heures max
  },

  transcription: {
    validation: {
      strictMode: true,
      allowEmptyText: false,
      maxWords: 50000,
      maxFileSize: 10 * 1024 * 1024, // 10MB pour les fichiers JSON de transcription
    },
    processing: {
      timeoutMs: 30000,
      retryAttempts: 3,
      batchSize: 100, // Pour le traitement en lot
    },
    autoTranscription: {
      enabled: false, // Feature flag
      provider: "whisper" as const,
      minConfidence: 0.8,
      maxDurationSeconds: 3600, // 1 heure max
      supportedLanguages: ["fr", "en"] as const,
    },
  },

  duplicateDetection: {
    enableFilenameMatch: true,
    enableContentMatch: true,
    enableDescriptionMatch: true,
    contentSimilarityThreshold: 0.85,
    descriptionMinLength: 20,
  } as DuplicateDetectionConfig,

  validation: {
    filename: {
      maxLength: 255,
      minLength: 1,
      allowedChars: /^[a-zA-Z0-9._\-\s()]+$/u,
      forbiddenChars: /[<>:"/\\|?*\x00-\x1f]/u,
    },
    description: {
      maxLength: 1000,
      minLength: 0,
      warnAtLength: 500,
    },
    origin: {
      maxLength: 100,
      allowedValues: ["workdrive", "upload", "api", "import"] as const,
    },
  },

  performance: {
    cacheTimeout: 30000, // 30 secondes
    batchSize: 10,
    maxConcurrentOperations: 5,
    retryDelay: 1000, // 1 seconde
  },

  features: {
    enableAutoTranscription: false,
    enableBulkOperations: true,
    enableAdvancedDuplicateDetection: true,
    enableAIAnalysis: false,
    enableRealTimeValidation: true,
  },

  ui: {
    pagination: {
      defaultPageSize: 25,
      allowedPageSizes: [10, 25, 50, 100] as const,
      maxPageSize: 100,
    },
    filters: {
      enableFuzzySearch: true,
      searchDebounceMs: 300,
      maxSearchTermLength: 100,
    },
  },
} as const;

// ✅ Helpers
export const ConfigHelpers = {
  isValidAudioFormat: (mimeType: string): boolean => {
    return CallsConfig.storage.allowedMimeTypes.includes(mimeType as any);
  },

  getMaxFileSizeInMB: (): number => {
    return CallsConfig.storage.maxFileSizeMB;
  },

  isFeatureEnabled: (
    featureName: keyof typeof CallsConfig.features
  ): boolean => {
    return Boolean(CallsConfig.features[featureName]);
  },

  getValidationRule: <T extends keyof typeof CallsConfig.validation>(
    ruleName: T
  ): (typeof CallsConfig.validation)[T] => {
    return CallsConfig.validation[ruleName];
  },

  isDuplicateDetectionEnabled: (
    strategy: keyof DuplicateDetectionConfig
  ): boolean => {
    return Boolean(CallsConfig.duplicateDetection[strategy]);
  },
} as const;

// --- Résultat de validation ---
export type CallsConfigValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

// --- Validation unique de la config ---
export const validateCallsConfig = (): CallsConfigValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // STORAGE
  if (Number(CallsConfig.storage.maxFileSize) <= 0) {
    errors.push("storage.maxFileSize doit être > 0");
  }
  if (
    CallsConfig.storage.maxFileSizeMB * 1024 * 1024 !==
    CallsConfig.storage.maxFileSize
  ) {
    warnings.push("storage.maxFileSizeMB incohérent avec maxFileSize");
  }
  if (
    Number(CallsConfig.storage.signedUrlExpiration) <= 0 ||
    Number(CallsConfig.storage.signedUrlExpiration) >
      Number(CallsConfig.storage.maxSignedUrlExpiration)
  ) {
    errors.push("storage.signedUrlExpiration hors bornes");
  }
  if ((CallsConfig.storage.allowedFormats as readonly unknown[]).length === 0) {
    errors.push("storage.allowedFormats ne doit pas être vide");
  }
  if (
    (CallsConfig.storage.allowedMimeTypes as readonly unknown[]).length === 0
  ) {
    errors.push("storage.allowedMimeTypes ne doit pas être vide");
  }

  // TRANSCRIPTION
  const t = CallsConfig.transcription;
  if (Number(t.validation.maxWords) <= 0) {
    errors.push("transcription.validation.maxWords doit être > 0");
  }
  if (Number(t.validation.maxFileSize) <= 0) {
    errors.push("transcription.validation.maxFileSize doit être > 0");
  }
  if (Number(t.processing.timeoutMs) <= 0) {
    errors.push("transcription.processing.timeoutMs doit être > 0");
  }
  if (Number(t.processing.retryAttempts) < 0) {
    errors.push("transcription.processing.retryAttempts doit être ≥ 0");
  }
  if (Number(t.processing.batchSize) <= 0) {
    errors.push("transcription.processing.batchSize doit être > 0");
  }
  if (
    Number(t.autoTranscription.minConfidence) < 0 ||
    Number(t.autoTranscription.minConfidence) > 1
  ) {
    errors.push("minConfidence doit être dans [0,1]");
  }
  if (Number(t.autoTranscription.maxDurationSeconds) <= 0) {
    errors.push("maxDurationSeconds doit être > 0");
  }
  if (
    (t.autoTranscription.supportedLanguages as readonly unknown[]).length === 0
  ) {
    errors.push("supportedLanguages ne doit pas être vide");
  }

  // DUPLICATE DETECTION
  const d = CallsConfig.duplicateDetection;
  if (
    Number(d.contentSimilarityThreshold) < 0 ||
    Number(d.contentSimilarityThreshold) > 1
  ) {
    errors.push("contentSimilarityThreshold doit être dans [0,1]");
  }
  if (Number(d.descriptionMinLength) < 0) {
    errors.push("descriptionMinLength doit être ≥ 0");
  }

  // VALIDATION GÉNÉRALE
  if (Number(CallsConfig.validation.filename.maxLength) <= 0) {
    errors.push("filename.maxLength doit être > 0");
  }
  if (Number(CallsConfig.validation.filename.minLength) < 0) {
    errors.push("filename.minLength doit être ≥ 0");
  }
  if (
    (CallsConfig.validation.origin.allowedValues as readonly unknown[])
      .length === 0
  ) {
    errors.push("origin.allowedValues ne doit pas être vide");
  }

  // PERFORMANCE / UI
  if (Number(CallsConfig.performance.maxConcurrentOperations) <= 0) {
    errors.push("maxConcurrentOperations doit être > 0");
  }
  const p = CallsConfig.ui.pagination;
  if (Number(p.defaultPageSize) <= 0) {
    errors.push("defaultPageSize doit être > 0");
  }
  if ((p.allowedPageSizes as readonly unknown[]).length === 0) {
    errors.push("allowedPageSizes ne doit pas être vide");
  }
  const maxAllowed = Math.max(...Array.from(p.allowedPageSizes));
  if (Number(p.maxPageSize) < maxAllowed) {
    warnings.push("maxPageSize est inférieur à un size autorisé");
  }

  return { isValid: errors.length === 0, errors, warnings };
};
