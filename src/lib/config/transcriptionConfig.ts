// src/lib/config/transcriptionConfig.ts

/**
 * Configuration centralisée pour la transcription automatique
 */
export interface TranscriptionConfig {
  openai: {
    apiKey: string;
    baseURL: string;
    organization?: string;
  };
  assemblyAI: {
    apiKey: string;
    baseURL: string;
  };
  processing: {
    maxFileSizeMB: number;
    timeoutMs: number;
    retryAttempts: number;
    retryDelayMs: number;
    defaultLanguage: string;
  };
  diarization: {
    timeoutMs: number;
    pollIntervalMs: number;
    maxSpeakers: number;
    alignmentTolerance: number;
  };
  batch: {
    maxConcurrent: number;
    pauseBetweenMs: number;
    chunkSize: number;
  };
  monitoring: {
    costMonitoringEnabled: boolean;
    costAlertThreshold: number;
    detailedMetricsEnabled: boolean;
  };
  features: {
    autoTranscriptionEnabled: boolean;
    autoDiarizationEnabled: boolean;
    batchProcessingEnabled: boolean;
    resultsCachingEnabled: boolean;
  };
}

/**
 * Configuration par défaut basée sur les variables d'environnement
 */
export const transcriptionConfig: TranscriptionConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    organization: process.env.OPENAI_ORGANIZATION,
  },
  assemblyAI: {
    apiKey: process.env.ASSEMBLYAI_API_KEY || "",
    baseURL: process.env.ASSEMBLYAI_BASE_URL || "https://api.assemblyai.com/v2",
  },
  processing: {
    maxFileSizeMB: parseInt(
      process.env.TRANSCRIPTION_MAX_FILE_SIZE_MB || "100"
    ),
    timeoutMs: parseInt(process.env.TRANSCRIPTION_TIMEOUT_MS || "300000"), // 5 min
    retryAttempts: parseInt(process.env.TRANSCRIPTION_RETRY_ATTEMPTS || "3"),
    retryDelayMs: parseInt(process.env.TRANSCRIPTION_RETRY_DELAY_MS || "1000"),
    defaultLanguage: process.env.TRANSCRIPTION_DEFAULT_LANGUAGE || "fr",
  },
  diarization: {
    timeoutMs: parseInt(process.env.DIARIZATION_TIMEOUT_MS || "480000"), // 8 min
    pollIntervalMs: parseInt(
      process.env.DIARIZATION_POLL_INTERVAL_MS || "2000"
    ),
    maxSpeakers: parseInt(process.env.DIARIZATION_MAX_SPEAKERS || "5"),
    alignmentTolerance: parseFloat(
      process.env.DIARIZATION_ALIGNMENT_TOLERANCE || "0.2"
    ),
  },
  batch: {
    maxConcurrent: parseInt(process.env.BATCH_MAX_CONCURRENT || "3"),
    pauseBetweenMs: parseInt(process.env.BATCH_PAUSE_BETWEEN_MS || "2000"),
    chunkSize: parseInt(process.env.BATCH_CHUNK_SIZE || "5"),
  },
  monitoring: {
    costMonitoringEnabled: process.env.COST_MONITORING_ENABLED !== "false",
    costAlertThreshold: parseFloat(process.env.COST_ALERT_THRESHOLD || "10.0"),
    detailedMetricsEnabled: process.env.METRICS_DETAILED_ENABLED !== "false",
  },
  features: {
    autoTranscriptionEnabled:
      process.env.FEATURE_AUTO_TRANSCRIPTION_ENABLED !== "false",
    autoDiarizationEnabled:
      process.env.FEATURE_AUTO_DIARIZATION_ENABLED !== "false",
    batchProcessingEnabled:
      process.env.FEATURE_BATCH_PROCESSING_ENABLED !== "false",
    resultsCachingEnabled:
      process.env.FEATURE_RESULTS_CACHING_ENABLED !== "false",
  },
};

/**
 * Validation de la configuration
 */
export const validateTranscriptionConfig = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validation obligatoire
  if (!transcriptionConfig.openai.apiKey) {
    errors.push("OPENAI_API_KEY is required");
  } else if (!transcriptionConfig.openai.apiKey.startsWith("sk-")) {
    errors.push("OPENAI_API_KEY must start with sk-");
  }

  if (!transcriptionConfig.assemblyAI.apiKey) {
    errors.push("ASSEMBLYAI_API_KEY is required");
  }

  // Validation des URLs
  try {
    new URL(transcriptionConfig.openai.baseURL);
  } catch {
    errors.push("OPENAI_BASE_URL must be a valid URL");
  }

  try {
    new URL(transcriptionConfig.assemblyAI.baseURL);
  } catch {
    errors.push("ASSEMBLYAI_BASE_URL must be a valid URL");
  }

  // Validation des valeurs numériques
  if (
    transcriptionConfig.processing.maxFileSizeMB <= 0 ||
    transcriptionConfig.processing.maxFileSizeMB > 500
  ) {
    warnings.push(
      "TRANSCRIPTION_MAX_FILE_SIZE_MB should be between 1 and 500 MB"
    );
  }

  if (
    transcriptionConfig.batch.maxConcurrent <= 0 ||
    transcriptionConfig.batch.maxConcurrent > 10
  ) {
    warnings.push("BATCH_MAX_CONCURRENT should be between 1 and 10");
  }

  if (
    transcriptionConfig.diarization.alignmentTolerance < 0 ||
    transcriptionConfig.diarization.alignmentTolerance > 1
  ) {
    warnings.push(
      "DIARIZATION_ALIGNMENT_TOLERANCE should be between 0 and 1 second"
    );
  }

  // Warnings pour configuration par défaut
  if (transcriptionConfig.processing.timeoutMs < 60000) {
    warnings.push("TRANSCRIPTION_TIMEOUT_MS is very low (< 1 minute)");
  }

  if (transcriptionConfig.monitoring.costAlertThreshold <= 0) {
    warnings.push("COST_ALERT_THRESHOLD should be positive");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Helper pour obtenir la configuration complète avec validation
 */
export const getValidatedTranscriptionConfig = (): TranscriptionConfig => {
  const validation = validateTranscriptionConfig();

  if (!validation.isValid) {
    console.error("❌ Transcription configuration errors:", validation.errors);
    throw new Error(
      `Invalid transcription configuration: ${validation.errors.join(", ")}`
    );
  }

  if (validation.warnings.length > 0) {
    console.warn(
      "⚠️ Transcription configuration warnings:",
      validation.warnings
    );
  }

  return transcriptionConfig;
};

/**
 * Helper pour vérifier les feature flags
 */
export const isTranscriptionFeatureEnabled = (
  feature: keyof TranscriptionConfig["features"]
): boolean => {
  return transcriptionConfig.features[feature];
};

/**
 * Helper pour calculer les coûts estimés
 */
export const calculateEstimatedCosts = (
  durationMinutes: number,
  mode: "whisper" | "assemblyai" | "complete"
) => {
  const whisperCostPerMinute = 0.006;
  const assemblyAICostPerMinute = 0.00065;

  let totalCost = 0;
  let breakdown = {};

  if (mode === "whisper" || mode === "complete") {
    const whisperCost = durationMinutes * whisperCostPerMinute;
    totalCost += whisperCost;
    breakdown = { ...breakdown, whisper: whisperCost };
  }

  if (mode === "assemblyai" || mode === "complete") {
    const assemblyAICost = durationMinutes * assemblyAICostPerMinute;
    totalCost += assemblyAICost;
    breakdown = { ...breakdown, assemblyAI: assemblyAICost };
  }

  return {
    totalCost: Number(totalCost.toFixed(4)),
    breakdown,
    costPerMinute: Number((totalCost / durationMinutes).toFixed(4)),
  };
};

/**
 * Helper pour monitoring des coûts
 */
export const shouldAlertForCost = (currentCost: number): boolean => {
  return (
    transcriptionConfig.monitoring.costMonitoringEnabled &&
    currentCost >= transcriptionConfig.monitoring.costAlertThreshold
  );
};

/**
 * Configuration de développement (pour tests)
 */
export const createDevTranscriptionConfig = (
  overrides: Partial<TranscriptionConfig> = {}
): TranscriptionConfig => {
  return {
    ...transcriptionConfig,
    openai: {
      apiKey: "sk-test-dev-key",
      baseURL: "https://api.openai.com/v1",
      ...overrides.openai,
    },
    assemblyAI: {
      apiKey: "test-assemblyai-key",
      baseURL: "https://api.assemblyai.com/v2",
      ...overrides.assemblyAI,
    },
    batch: {
      maxConcurrent: 1, // Plus conservateur en dev
      pauseBetweenMs: 3000,
      chunkSize: 2,
      ...overrides.batch,
    },
    monitoring: {
      costMonitoringEnabled: true,
      costAlertThreshold: 1.0, // Plus bas en dev
      detailedMetricsEnabled: true,
      ...overrides.monitoring,
    },
    ...overrides,
  };
};

/**
 * Configuration de production (pour déploiement)
 */
export const createProdTranscriptionConfig = (): TranscriptionConfig => {
  const validation = validateTranscriptionConfig();

  if (!validation.isValid) {
    throw new Error(
      `Production configuration invalid: ${validation.errors.join(", ")}`
    );
  }

  // En production, on s'assure que certaines valeurs sont optimales
  return {
    ...transcriptionConfig,
    batch: {
      ...transcriptionConfig.batch,
      maxConcurrent: Math.min(transcriptionConfig.batch.maxConcurrent, 5), // Limite production
    },
    monitoring: {
      ...transcriptionConfig.monitoring,
      costMonitoringEnabled: true, // Forcé en production
      detailedMetricsEnabled: true, // Forcé en production
    },
  };
};

/**
 * Export des constantes utiles
 */
export const TRANSCRIPTION_CONSTANTS = {
  WHISPER_COST_PER_MINUTE: 0.006,
  ASSEMBLYAI_COST_PER_MINUTE: 0.00065,
  MAX_AUDIO_DURATION_SECONDS: 25 * 60, // 25 minutes (limite OpenAI)
  SUPPORTED_AUDIO_FORMATS: ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"],
  DEFAULT_SPEAKER_LABELS: ["turn1", "turn2", "turn3", "turn4", "turn5"],
  ALIGNMENT_TOLERANCE_RANGE: [0.1, 0.5], // Secondes
} as const;
