// src/components/calls/hooks/useCallTranscriptionActions.ts - VERSION ENRICHIE

import { useCallback, useState } from "react";
import { Call } from "../shared/types/CallTypes";
import { createServices } from "../infrastructure/ServiceFactory";
import {
  TranscriptionJobResult,
  BatchTranscriptionResult,
  TranscriptionMode,
} from "../domain/services/TranscriptionIntegrationService";
import { isTranscriptionFeatureEnabled } from "@/lib/config/transcriptionConfig";

export interface TranscriptionProgress {
  callId: string;
  status:
    | "pending"
    | "transcribing"
    | "diarizing"
    | "aligning"
    | "completed"
    | "error";
  progress: number; // 0-100
  stage: string;
  estimatedTimeRemaining?: number;
  error?: string;
}

export interface BatchProgress {
  totalCalls: number;
  completedCalls: number;
  currentCall?: TranscriptionProgress;
  results: TranscriptionJobResult[];
  totalCost: number;
  averageTimePerCall: number;
  isRunning: boolean;
}

/**
 * Hook enrichi pour la gestion de la transcription automatique
 *
 * Nouveautés par rapport à votre version actuelle :
 * - Support des 3 modes de transcription
 * - Suivi en temps réel du progrès
 * - Gestion des erreurs granulaire
 * - Métriques et coûts détaillés
 * - Feature flags pour l'activation
 */
export function useCallTranscriptionActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null
  );
  const [currentProgress, setCurrentProgress] =
    useState<TranscriptionProgress | null>(null);

  // Services de transcription
  const services = createServices();
  const transcriptionService = services.transcriptionIntegrationService;

  // ============================================================================
  // ACTIONS DE TRANSCRIPTION INDIVIDUELLES
  // ============================================================================

  /**
   * ✅ NOUVEAU : Transcription complète (ASR + Diarisation)
   */
  const transcribeCallComplete = useCallback(
    async (call: Call): Promise<TranscriptionJobResult> => {
      if (
        !isTranscriptionFeatureEnabled("autoTranscriptionEnabled") ||
        !isTranscriptionFeatureEnabled("autoDiarizationEnabled")
      ) {
        throw new Error("Complete transcription feature is disabled");
      }

      setIsProcessing(true);
      setCurrentProgress({
        callId: call.id,
        status: "pending",
        progress: 0,
        stage: "Initializing...",
      });

      try {
        console.log(`🚀 Starting complete transcription for call ${call.id}`);

        // Simulation du progrès (vous pourriez l'améliorer avec des events)
        const progressUpdater = startProgressSimulation(call.id, "complete");

        const result = await transcriptionService.transcribeComplete(call.id);

        clearInterval(progressUpdater);

        if (result.success) {
          setCurrentProgress({
            callId: call.id,
            status: "completed",
            progress: 100,
            stage: `Completed: ${result.metrics.wordCount} words, ${result.metrics.speakerCount} speakers`,
          });
        } else {
          setCurrentProgress({
            callId: call.id,
            status: "error",
            progress: 0,
            stage: "Failed",
            error: result.error,
          });
        }

        return result;
      } catch (error) {
        console.error("❌ Complete transcription failed:", error);
        setCurrentProgress({
          callId: call.id,
          status: "error",
          progress: 0,
          stage: "Failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService]
  );

  /**
   * Transcription ASR seulement (votre version actuelle conservée et enrichie)
   */
  const transcribeCallOnly = useCallback(
    async (call: Call): Promise<TranscriptionJobResult> => {
      if (!isTranscriptionFeatureEnabled("autoTranscriptionEnabled")) {
        throw new Error("Auto transcription feature is disabled");
      }

      setIsProcessing(true);
      setCurrentProgress({
        callId: call.id,
        status: "transcribing",
        progress: 0,
        stage: "Starting ASR transcription...",
      });

      try {
        const progressUpdater = startProgressSimulation(
          call.id,
          "transcription-only"
        );
        const result = await transcriptionService.transcribeOnly(call.id);
        clearInterval(progressUpdater);

        if (result.success) {
          setCurrentProgress({
            callId: call.id,
            status: "completed",
            progress: 100,
            stage: `Transcribed: ${result.metrics.wordCount} words`,
          });
        } else {
          setCurrentProgress({
            callId: call.id,
            status: "error",
            progress: 0,
            stage: "Failed",
            error: result.error,
          });
        }

        return result;
      } catch (error) {
        console.error("❌ ASR transcription failed:", error);
        setCurrentProgress({
          callId: call.id,
          status: "error",
          progress: 0,
          stage: "Failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService]
  );

  /**
   * ✅ NOUVEAU : Diarisation sur transcription existante
   */
  const diarizeExistingCall = useCallback(
    async (call: Call): Promise<TranscriptionJobResult> => {
      if (!isTranscriptionFeatureEnabled("autoDiarizationEnabled")) {
        throw new Error("Auto diarization feature is disabled");
      }

      setIsProcessing(true);
      setCurrentProgress({
        callId: call.id,
        status: "diarizing",
        progress: 0,
        stage: "Starting speaker separation...",
      });

      try {
        const progressUpdater = startProgressSimulation(
          call.id,
          "diarization-only"
        );
        const result = await transcriptionService.diarizeExisting(call.id);
        clearInterval(progressUpdater);

        if (result.success) {
          setCurrentProgress({
            callId: call.id,
            status: "completed",
            progress: 100,
            stage: `Diarized: ${result.metrics.speakerCount} speakers identified`,
          });
        } else {
          setCurrentProgress({
            callId: call.id,
            status: "error",
            progress: 0,
            stage: "Failed",
            error: result.error,
          });
        }

        return result;
      } catch (error) {
        console.error("❌ Diarization failed:", error);
        setCurrentProgress({
          callId: call.id,
          status: "error",
          progress: 0,
          stage: "Failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService]
  );

  // ============================================================================
  // ACTIONS DE TRANSCRIPTION EN LOT
  // ============================================================================

  /**
   * ✅ ENRICHISSEMENT : Transcription en lot avec modes flexibles
   */
  const transcribeBatch = useCallback(
    async (
      calls: Call[],
      options: {
        mode?: TranscriptionMode;
        maxConcurrent?: number;
        estimateOnly?: boolean;
      } = {}
    ): Promise<BatchTranscriptionResult> => {
      const {
        mode = "complete",
        maxConcurrent = 3,
        estimateOnly = false,
      } = options;

      if (!isTranscriptionFeatureEnabled("batchProcessingEnabled")) {
        throw new Error("Batch processing feature is disabled");
      }

      // Validation des feature flags selon le mode
      if (mode === "complete" || mode === "transcription-only") {
        if (!isTranscriptionFeatureEnabled("autoTranscriptionEnabled")) {
          throw new Error("Auto transcription feature is disabled");
        }
      }
      if (mode === "complete" || mode === "diarization-only") {
        if (!isTranscriptionFeatureEnabled("autoDiarizationEnabled")) {
          throw new Error("Auto diarization feature is disabled");
        }
      }

      // Estimation des coûts et du temps
      const totalDurationMinutes =
        calls.reduce((sum, call) => {
          return sum + (call.duree || 300); // Estimation 5 min si pas de durée
        }, 0) / 60;

      const estimatedCost = calculateBatchCost(totalDurationMinutes, mode);
      const estimatedTimeMinutes = Math.ceil(totalDurationMinutes * 0.4); // ~40% de la durée audio

      console.log(
        `📊 Batch estimation: ${
          calls.length
        } calls, ~${totalDurationMinutes.toFixed(
          1
        )} min audio, cost: $${estimatedCost.toFixed(
          4
        )}, time: ~${estimatedTimeMinutes} min`
      );

      if (estimateOnly) {
        return {
          totalJobs: calls.length,
          successfulJobs: 0,
          failedJobs: 0,
          results: [],
          totalCost: estimatedCost,
          totalProcessingTime: estimatedTimeMinutes * 60 * 1000,
          averageProcessingTime:
            (estimatedTimeMinutes * 60 * 1000) / calls.length,
        };
      }

      setIsProcessing(true);
      setBatchProgress({
        totalCalls: calls.length,
        completedCalls: 0,
        results: [],
        totalCost: 0,
        averageTimePerCall: 0,
        isRunning: true,
      });

      try {
        const callIds = calls.map((c) => c.id);

        const result = await transcriptionService.transcribeBatch(callIds, {
          mode,
          maxConcurrent,
          pauseBetweenBatches: 2000,
          onProgress: (completed, total, current) => {
            setBatchProgress((prev) => {
              if (!prev) return null;

              const results = current
                ? [...prev.results, current]
                : prev.results;
              const totalCost = results.reduce(
                (sum, r) => sum + r.metrics.totalCost,
                0
              );
              const averageTimePerCall =
                results.length > 0
                  ? results.reduce(
                      (sum, r) => sum + r.metrics.processingTime,
                      0
                    ) / results.length
                  : 0;

              return {
                ...prev,
                completedCalls: completed,
                results,
                totalCost,
                averageTimePerCall,
                currentCall: current
                  ? {
                      callId: current.callId,
                      status: current.success ? "completed" : "error",
                      progress: 100,
                      stage: current.success
                        ? `Completed: ${current.metrics.wordCount} words`
                        : `Failed: ${current.error}`,
                      error: current.error,
                    }
                  : undefined,
              };
            });
          },
        });

        setBatchProgress((prev) =>
          prev ? { ...prev, isRunning: false } : null
        );

        return result;
      } catch (error) {
        console.error("❌ Batch transcription failed:", error);
        setBatchProgress((prev) =>
          prev ? { ...prev, isRunning: false } : null
        );
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService]
  );

  // ============================================================================
  // ACTIONS DE MONITORING
  // ============================================================================

  /**
   * ✅ NOUVEAU : Récupération des métriques
   */
  const getTranscriptionMetrics = useCallback(async () => {
    try {
      return await transcriptionService.getProvidersMetrics();
    } catch (error) {
      console.error("❌ Failed to get transcription metrics:", error);
      throw error;
    }
  }, [transcriptionService]);

  /**
   * ✅ NOUVEAU : Health check
   */
  const checkTranscriptionHealth = useCallback(async () => {
    try {
      return await transcriptionService.healthCheck();
    } catch (error) {
      console.error("❌ Health check failed:", error);
      throw error;
    }
  }, [transcriptionService]);

  // ============================================================================
  // ACTIONS UTILITAIRES
  // ============================================================================

  const resetProgress = useCallback(() => {
    setCurrentProgress(null);
    setBatchProgress(null);
  }, []);

  const cancelBatch = useCallback(() => {
    // TODO: Implémenter l'annulation de batch
    console.warn("⚠️ Batch cancellation not yet implemented");
    setBatchProgress((prev) => (prev ? { ...prev, isRunning: false } : null));
    setIsProcessing(false);
  }, []);

  // ============================================================================
  // HELPERS PRIVÉS
  // ============================================================================

  /**
   * Simulation du progrès pour l'UI (à améliorer avec de vrais events)
   */
  function startProgressSimulation(
    callId: string,
    mode: TranscriptionMode
  ): NodeJS.Timeout {
    let progress = 0;
    const stages = getStagesForMode(mode);
    let currentStageIndex = 0;

    return setInterval(() => {
      progress += Math.random() * 15; // Progression variable
      if (progress > 95) progress = 95; // Ne jamais atteindre 100 avant la fin

      const currentStage =
        stages[currentStageIndex] || stages[stages.length - 1];

      if (progress > (currentStageIndex + 1) * (100 / stages.length)) {
        currentStageIndex = Math.min(currentStageIndex + 1, stages.length - 1);
      }

      setCurrentProgress((prev) =>
        prev
          ? {
              ...prev,
              progress: Math.min(progress, 95),
              stage: currentStage,
            }
          : null
      );
    }, 2000);
  }

  function getStagesForMode(mode: TranscriptionMode): string[] {
    switch (mode) {
      case "transcription-only":
        return [
          "Preparing audio...",
          "Transcribing with Whisper...",
          "Normalizing text...",
          "Validating...",
        ];
      case "diarization-only":
        return [
          "Loading transcription...",
          "Analyzing speakers...",
          "Aligning segments...",
          "Updating data...",
        ];
      case "complete":
        return [
          "Preparing audio...",
          "Transcribing with Whisper...",
          "Analyzing speakers...",
          "Aligning transcription...",
          "Validating results...",
        ];
      default:
        return ["Processing..."];
    }
  }

  function calculateBatchCost(
    totalMinutes: number,
    mode: TranscriptionMode
  ): number {
    const whisperCostPerMin = 0.006;
    const assemblyAICostPerMin = 0.00065;

    let cost = 0;
    if (mode === "transcription-only") {
      cost = totalMinutes * whisperCostPerMin;
    } else if (mode === "diarization-only") {
      cost = totalMinutes * assemblyAICostPerMin;
    } else if (mode === "complete") {
      cost = totalMinutes * (whisperCostPerMin + assemblyAICostPerMin);
    }

    return cost;
  }

  // ============================================================================
  // RETOUR DU HOOK
  // ============================================================================

  return {
    // États
    isProcessing,
    currentProgress,
    batchProgress,

    // Actions individuelles
    transcribeCallComplete,
    transcribeCallOnly,
    diarizeExistingCall,

    // Actions en lot
    transcribeBatch,

    // Monitoring
    getTranscriptionMetrics,
    checkTranscriptionHealth,

    // Utilitaires
    resetProgress,
    cancelBatch,

    // Helpers pour l'UI
    isFeatureEnabled: isTranscriptionFeatureEnabled,
    calculateBatchEstimate: (
      calls: Call[],
      mode: TranscriptionMode = "complete"
    ) => {
      const totalMinutes =
        calls.reduce((sum, call) => sum + (call.duree || 300), 0) / 60;
      return {
        estimatedCost: calculateBatchCost(totalMinutes, mode),
        estimatedTimeMinutes: Math.ceil(totalMinutes * 0.4),
        totalAudioMinutes: totalMinutes,
      };
    },
  };
}

/**
 * Type pour l'export du hook
 */
export type UseCallTranscriptionActionsReturn = ReturnType<
  typeof useCallTranscriptionActions
>;
