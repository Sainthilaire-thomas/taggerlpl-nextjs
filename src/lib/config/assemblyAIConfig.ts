// src/lib/config/assemblyAIConfig.ts

/**
 * Configuration pour AssemblyAI Diarization Provider
 */
export interface AssemblyAIConfig {
  apiKey: string;
  baseURL: string;
  timeout: {
    transcription: number; // Timeout pour la transcription (8min)
    polling: number; // Interval de polling (2s)
  };
  limits: {
    maxFileSizeMB: number;
    maxDurationMinutes: number;
    retryAttempts: number;
  };
  features: {
    speakerLabels: boolean;
    utterances: boolean;
    languageDetection: boolean;
  };
}

export const assemblyAIConfig: AssemblyAIConfig = {
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
  baseURL: process.env.ASSEMBLYAI_BASE_URL || "https://api.assemblyai.com/v2",

  timeout: {
    transcription: 8 * 60 * 1000, // 8 minutes
    polling: 2000, // 2 secondes
  },

  limits: {
    maxFileSizeMB: 100,
    maxDurationMinutes: 60, // 1 heure max
    retryAttempts: 3,
  },

  features: {
    speakerLabels: true, // Diarisation obligatoire
    utterances: true, // Tours de parole structurés
    languageDetection: false, // On force le français
  },
};

/**
 * Validation de la configuration AssemblyAI
 */
export const validateAssemblyAIConfig = (): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!assemblyAIConfig.apiKey) {
    errors.push("ASSEMBLYAI_API_KEY is required");
  }

  if (!assemblyAIConfig.baseURL) {
    errors.push("ASSEMBLYAI_BASE_URL is required");
  }

  if (assemblyAIConfig.timeout.transcription < 60000) {
    errors.push("Transcription timeout too short (min: 60s)");
  }

  if (assemblyAIConfig.limits.maxFileSizeMB > 200) {
    errors.push("Max file size too large (max: 200MB for AssemblyAI)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Types pour les erreurs AssemblyAI
 */
export class AssemblyAIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "AssemblyAIError";
  }
}

/**
 * Calcul des coûts AssemblyAI
 */
export const calculateAssemblyAICost = (durationSeconds: number): number => {
  const minutes = Math.ceil(durationSeconds / 60);
  return minutes * 0.00065; // $0.00065 per minute (tarif AssemblyAI)
};

/**
 * Métriques pour AssemblyAI
 */
export interface AssemblyAIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalMinutesProcessed: number;
  totalCost: number;
  averageProcessingTime: number;
  successRate: number;
  lastUpdated: Date;
}

/**
 * Health check AssemblyAI
 */
export const checkAssemblyAIHealth = async (): Promise<{
  status: "healthy" | "unhealthy";
  error?: string;
}> => {
  try {
    const response = await fetch(`${assemblyAIConfig.baseURL}/`, {
      method: "GET",
      headers: {
        Authorization: assemblyAIConfig.apiKey,
      },
    });

    return {
      status: response.ok ? "healthy" : "unhealthy",
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
