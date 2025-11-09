// src/components/calls/infrastructure/diarization/AssemblyAIDiarizationProvider.ts

import type { DiarizationSegment } from "@/features/phase1-corpus/calls/shared/types/TranscriptionTypes";
import {
  assemblyAIConfig,
  validateAssemblyAIConfig,
  AssemblyAIError,
  calculateAssemblyAICost,
  AssemblyAIMetrics,
} from "@/lib/config/assemblyAIConfig";

type AssemblyAIStatus = "queued" | "processing" | "completed" | "error";

interface AssemblyAITranscript {
  id: string;
  status: AssemblyAIStatus;
  error?: string;
  audio_duration?: number;
  utterances?: Array<{
    start: number; // ms
    end: number; // ms
    text: string;
    confidence?: number;
    speaker?: string; // "A" | "B" | "SPEAKER_00" ...
  }>;
}

interface AssemblyAIOptions {
  languageCode?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * Provider AssemblyAI pour la diarisation (séparation des locuteurs)
 *
 * Fonctionnalités:
 * - Upload audio vers AssemblyAI
 * - Transcription + diarisation automatique
 * - Polling des résultats avec timeout
 * - Mapping vers format TaggerLPL
 * - Métriques et monitoring
 */
export class AssemblyAIDiarizationProvider {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private metrics: AssemblyAIMetrics;

  constructor(apiKey?: string, baseURL?: string) {
    // Validation de la configuration
    const configValidation = validateAssemblyAIConfig();
    if (!configValidation.isValid) {
      throw new AssemblyAIError(
        `Configuration invalide: ${configValidation.errors.join(", ")}`,
        "INVALID_CONFIG"
      );
    }

    this.apiKey = apiKey ?? assemblyAIConfig.apiKey;
    this.baseURL = baseURL ?? assemblyAIConfig.baseURL;

    if (!this.apiKey) {
      throw new AssemblyAIError(
        "ASSEMBLYAI_API_KEY is required",
        "MISSING_API_KEY"
      );
    }

    // Initialisation des métriques
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalMinutesProcessed: 0,
      totalCost: 0,
      averageProcessingTime: 0,
      successRate: 0,
      lastUpdated: new Date(),
    };

    console.log("🎤 AssemblyAI Diarization Provider initialized");
  }

  /**
   * Point d'entrée principal : infère les segments de speakers depuis une URL audio
   */
  async inferSpeakers(
    fileUrl: string,
    options: AssemblyAIOptions = {}
  ): Promise<DiarizationSegment[]> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      console.log(`🎯 Starting diarization for: ${this.truncateUrl(fileUrl)}`);

      const languageCode = options.languageCode ?? "fr";
      const timeoutMs =
        options.timeoutMs ?? assemblyAIConfig.timeout.transcription;
      const pollIntervalMs =
        options.pollIntervalMs ?? assemblyAIConfig.timeout.polling;

      // 1. Créer la transcription
      const transcriptId = await this.createTranscript(fileUrl, languageCode);
      console.log(`📋 Transcript created: ${transcriptId}`);

      // 2. Polling jusqu'à completion
      const result = await this.pollTranscript(
        transcriptId,
        timeoutMs,
        pollIntervalMs
      );
      console.log(
        `✅ Diarization completed: ${result.utterances?.length || 0} utterances`
      );

      // 3. Conversion vers format TaggerLPL
      const segments = this.toSegments(result);

      // 4. Métriques de succès
      const processingTime = Date.now() - startTime;
      await this.updateMetrics(true, processingTime, result.audio_duration);

      console.log(`🎊 AssemblyAI diarization completed in ${processingTime}ms`);
      console.log(
        `💰 Estimated cost: $${calculateAssemblyAICost(
          result.audio_duration || 0
        ).toFixed(4)}`
      );

      return segments;
    } catch (error) {
      // Métriques d'échec
      const processingTime = Date.now() - startTime;
      await this.updateMetrics(false, processingTime);

      console.error(`❌ AssemblyAI diarization failed:`, error);
      throw error;
    }
  }

  /**
   * 1. Création de la transcription avec diarisation
   */
  private async createTranscript(
    audioUrl: string,
    languageCode: string
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/transcript`, {
        method: "POST",
        headers: {
          Authorization: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: languageCode,
          speaker_labels: assemblyAIConfig.features.speakerLabels,
          utterances: assemblyAIConfig.features.utterances,
          language_detection: assemblyAIConfig.features.languageDetection,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new AssemblyAIError(
          `Create transcript failed: HTTP ${response.status} ${response.statusText}`,
          "CREATE_TRANSCRIPT_FAILED",
          response.status
        );
      }

      const data = (await response.json()) as AssemblyAITranscript;

      if (!data.id) {
        throw new AssemblyAIError(
          "AssemblyAI: missing transcript id in response",
          "MISSING_TRANSCRIPT_ID"
        );
      }

      return data.id;
    } catch (error) {
      if (error instanceof AssemblyAIError) throw error;

      throw new AssemblyAIError(
        `Failed to create AssemblyAI transcript: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "CREATE_TRANSCRIPT_ERROR",
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 2. Polling de la transcription jusqu'à completion
   */
  private async pollTranscript(
    transcriptId: string,
    timeoutMs: number,
    intervalMs: number
  ): Promise<AssemblyAITranscript> {
    const startTime = Date.now();
    let lastStatus: AssemblyAIStatus = "queued";

    while (true) {
      try {
        const response = await fetch(
          `${this.baseURL}/transcript/${transcriptId}`,
          {
            method: "GET",
            headers: { Authorization: this.apiKey },
          }
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new AssemblyAIError(
            `Poll transcript failed: HTTP ${response.status} ${response.statusText} - ${errorText}`,
            "POLL_TRANSCRIPT_FAILED",
            response.status
          );
        }

        const data = (await response.json()) as AssemblyAITranscript;

        // Log changement de statut
        if (data.status !== lastStatus) {
          console.log(`📊 AssemblyAI status: ${lastStatus} → ${data.status}`);
          lastStatus = data.status;
        }

        // Statut final : succès
        if (data.status === "completed") {
          console.log(`✅ AssemblyAI completed in ${Date.now() - startTime}ms`);
          return data;
        }

        // Statut final : erreur
        if (data.status === "error") {
          throw new AssemblyAIError(
            `AssemblyAI processing error: ${
              data.error || "Unknown processing error"
            }`,
            "PROCESSING_ERROR"
          );
        }

        // Timeout
        if (Date.now() - startTime > timeoutMs) {
          throw new AssemblyAIError(
            `AssemblyAI polling timeout after ${timeoutMs}ms`,
            "POLLING_TIMEOUT"
          );
        }

        // Attendre avant la prochaine requête
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        if (error instanceof AssemblyAIError) throw error;

        throw new AssemblyAIError(
          `Polling error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "POLLING_ERROR",
          undefined,
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  /**
   * 3. Conversion vers format TaggerLPL
   */
  private toSegments(result: AssemblyAITranscript): DiarizationSegment[] {
    const utterances = result.utterances ?? [];

    if (utterances.length === 0) {
      console.warn("⚠️ No utterances in AssemblyAI response");
      return [];
    }

    const segments = utterances.map((utterance, index) => ({
      start: utterance.start / 1000, // ms → seconds
      end: utterance.end / 1000,
      speaker: this.toTurnFormat(utterance.speaker, index),
    }));

    console.log(`🎭 Mapped ${segments.length} segments to TaggerLPL format`);

    // Debug: log des speakers détectés
    const speakers = new Set(segments.map((s) => s.speaker));
    console.log(`👥 Detected speakers: ${Array.from(speakers).join(", ")}`);

    return segments;
  }

  /**
   * 4. Mapping des labels speakers AssemblyAI → format turn
   */
  private toTurnFormat(speakerLabel?: string, fallbackIndex?: number): string {
    if (!speakerLabel) {
      return `turn${(fallbackIndex ?? 0) + 1}`;
    }

    // Format SPEAKER_XX → turnXX+1
    const match = speakerLabel.match(/(\d+)$/);
    if (match) {
      const speakerNumber = Number(match[1]) + 1;
      return `turn${speakerNumber}`;
    }

    // Format single letter A,B,C → turn1,turn2,turn3
    if (/^[A-Z]$/.test(speakerLabel)) {
      const turnNumber = speakerLabel.charCodeAt(0) - 64; // A=1, B=2, etc.
      return `turn${turnNumber}`;
    }

    // Fallback
    return `turn${(fallbackIndex ?? 0) + 1}`;
  }

  /**
   * Mise à jour des métriques
   */
  private async updateMetrics(
    success: boolean,
    processingTimeMs: number,
    audioDurationSeconds?: number
  ): Promise<void> {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (audioDurationSeconds) {
      this.metrics.totalMinutesProcessed += audioDurationSeconds / 60;
      this.metrics.totalCost += calculateAssemblyAICost(audioDurationSeconds);
    }

    // Calculs dérivés
    const totalRequests =
      this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.successRate =
      totalRequests > 0 ? this.metrics.successfulRequests / totalRequests : 0;

    // Note: processingTimeMs inclut le temps d'attente (polling)
    // Pour une métrique plus précise, on pourrait séparer "API time" vs "waiting time"
    this.metrics.averageProcessingTime =
      totalRequests > 0
        ? (this.metrics.averageProcessingTime * (totalRequests - 1) +
            processingTimeMs) /
          totalRequests
        : processingTimeMs;

    this.metrics.lastUpdated = new Date();
  }

  /**
   * API publique pour les métriques
   */
  getMetrics(): AssemblyAIMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset des métriques (utile pour les tests)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalMinutesProcessed: 0,
      totalCost: 0,
      averageProcessingTime: 0,
      successRate: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/`, {
        method: "GET",
        headers: { Authorization: this.apiKey },
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
  }

  /**
   * Utilitaires
   */
  private truncateUrl(url: string): string {
    return url.length > 100 ? url.substring(0, 100) + "..." : url;
  }
}
