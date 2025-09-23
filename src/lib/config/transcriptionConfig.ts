// src/lib/config/transcriptionConfig.ts

/**
 * Configuration centralisée pour le système de transcription automatique
 * Gère les paramètres OpenAI, limites, retry, et monitoring
 */

export const transcriptionConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    organization: process.env.OPENAI_ORGANIZATION,
    project: process.env.OPENAI_PROJECT,
  },

  limits: {
    maxFileSizeMB: parseInt(
      process.env.TRANSCRIPTION_MAX_FILE_SIZE_MB || "100"
    ),
    timeoutMs: parseInt(process.env.TRANSCRIPTION_TIMEOUT_MS || "300000"), // 5 minutes
    retryAttempts: parseInt(process.env.TRANSCRIPTION_RETRY_ATTEMPTS || "3"),
    batchSize: parseInt(process.env.TRANSCRIPTION_BATCH_SIZE || "5"),
    rateLimitDelay: parseInt(
      process.env.TRANSCRIPTION_RATE_LIMIT_DELAY || "1000"
    ), // 1 seconde
  },

  whisper: {
    model: "whisper-1",
    language: "fr",
    response_format: "verbose_json" as const,
    temperature: 0.0, // Déterministe
    // Formats supportés par Whisper
    supportedFormats: [
      "mp3",
      "mp4",
      "mpeg",
      "mpga",
      "m4a",
      "wav",
      "webm",
      "flac",
      "ogg",
    ],
  },

  costs: {
    // Prix OpenAI Whisper au 2024 : $0.006 par minute
    pricePerMinute: 0.006,
    currency: "USD",
  },

  monitoring: {
    enableMetrics: process.env.NODE_ENV === "production",
    enableDetailedLogs: process.env.NODE_ENV === "development",
    logLevel: process.env.TRANSCRIPTION_LOG_LEVEL || "info",
  },
} as const;

/**
 * Validation de la configuration au démarrage
 * Lance une erreur si la configuration est invalide
 */
export function validateTranscriptionConfig(): void {
  const { openai, limits } = transcriptionConfig;

  // Validation API Key OpenAI
  if (!openai.apiKey) {
    throw new Error(
      "❌ OPENAI_API_KEY is required but not provided. Please set it in your environment variables."
    );
  }

  if (!openai.apiKey.startsWith("sk-")) {
    throw new Error(
      '❌ OPENAI_API_KEY must start with "sk-". Please check your API key format.'
    );
  }

  // Validation limites
  if (limits.maxFileSizeMB <= 0 || limits.maxFileSizeMB > 500) {
    throw new Error(
      "❌ TRANSCRIPTION_MAX_FILE_SIZE_MB must be between 1 and 500 MB"
    );
  }

  if (limits.timeoutMs < 30000 || limits.timeoutMs > 600000) {
    throw new Error(
      "❌ TRANSCRIPTION_TIMEOUT_MS must be between 30 seconds and 10 minutes"
    );
  }

  if (limits.retryAttempts < 0 || limits.retryAttempts > 5) {
    throw new Error("❌ TRANSCRIPTION_RETRY_ATTEMPTS must be between 0 and 5");
  }

  console.log("✅ Transcription configuration validated successfully");

  // Log de la configuration en développement
  if (transcriptionConfig.monitoring.enableDetailedLogs) {
    console.log("📋 Transcription Config:", {
      model: transcriptionConfig.whisper.model,
      language: transcriptionConfig.whisper.language,
      maxFileSize: `${limits.maxFileSizeMB}MB`,
      timeout: `${limits.timeoutMs / 1000}s`,
      retryAttempts: limits.retryAttempts,
      batchSize: limits.batchSize,
    });
  }
}

/**
 * Types pour la configuration
 */
export type TranscriptionConfig = typeof transcriptionConfig;

export interface AudioMetadata {
  size: number;
  type: string;
  url: string;
  duration?: number;
  filename?: string;
}

export interface TranscriptionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalMinutesProcessed: number;
  totalCost: number;
  averageProcessingTime: number;
  successRate: number;
  lastUpdated: Date;
}

export class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: string = "TRANSCRIPTION_ERROR",
    public originalError?: Error
  ) {
    super(message);
    this.name = "TranscriptionError";
  }
}

/**
 * Calcul du coût estimé basé sur la durée
 */
export function calculateCost(durationSeconds: number): number {
  const minutes = Math.ceil(durationSeconds / 60);
  return minutes * transcriptionConfig.costs.pricePerMinute;
}

/**
 * Vérifie si un format audio est supporté
 */
export function isSupportedAudioFormat(filename: string): boolean {
  // Toujours une string (évite le 'string | undefined')
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  // On “dessertit” le type tuple en simple string[] pour includes()
  const formats = transcriptionConfig.whisper
    .supportedFormats as readonly string[];

  return extension !== "" && (formats as readonly string[]).includes(extension);
}

/**
 * Génère un nom de fichier sécurisé
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 100); // Limite la longueur
}

// (ex) src/lib/config/transcriptionConfig.ts
export const diarizationConfig = {
  assemblyAI: {
    baseURL: process.env.ASSEMBLYAI_BASE_URL ?? "https://api.assemblyai.com/v2",
    apiKey: process.env.ASSEMBLYAI_API_KEY ?? "",
    // réglages polling
    pollIntervalMs: 2000,
    timeoutMs: 8 * 60 * 1000, // 8 minutes
    languageCode: "fr", // par défaut FR
  },
};
