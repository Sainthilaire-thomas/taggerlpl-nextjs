// src/components/calls/ui/hooks/actions/useCallTranscriptionActions.ts - CORRECTION POUR VRAIS SERVICES

import { useCallback, useState, useMemo } from "react";
import { Call } from "../../../domain/entities/Call";
import { CallExtended } from "../../../domain/entities/CallExtended";
import { createServices } from "../../../infrastructure/ServiceFactory";
import { TranscriptionIntegrationService } from "../../../domain/services/TranscriptionIntegrationService";
import type {
  TranscriptionJobResult,
  BatchTranscriptionResult,
  TranscriptionMode,
} from "../../../domain/services/TranscriptionIntegrationService";

// ============================================================================
// TYPES EXISTANTS (conservés de votre version)
// ============================================================================

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

export interface UseCallTranscriptionActionsProps {
  reload: () => Promise<void>;
}

// ============================================================================
// HOOK CORRIGÉ AVEC VRAIS SERVICES
// ============================================================================

export function useCallTranscriptionActions({
  reload,
}: UseCallTranscriptionActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null
  );
  const [currentProgress, setCurrentProgress] =
    useState<TranscriptionProgress | null>(null);

  // ✅ CORRECTION : Utiliser les VRAIS services au lieu des mocks
  const services = useMemo(() => createServices(), []);
  const transcriptionService = useMemo(() => {
    return new TranscriptionIntegrationService(
      services.callRepository,
      services.storageRepository
    );
  }, [services]);

  // ============================================================================
  // HELPERS POUR LA PROGRESSION UI
  // ============================================================================

  const updateProgress = useCallback(
    (callId: string, update: Partial<TranscriptionProgress>) => {
      setCurrentProgress((prev) =>
        prev?.callId === callId ? { ...prev, ...update } : prev
      );
    },
    []
  );

  const startProgressSimulation = useCallback(
    (callId: string, mode: TranscriptionMode): NodeJS.Timeout => {
      let progress = 0;
      const stages = getStagesForMode(mode);
      let currentStageIndex = 0;

      return setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90; // Ne jamais atteindre 100 avant la fin

        const currentStage =
          stages[currentStageIndex] || stages[stages.length - 1];
        if (progress > (currentStageIndex + 1) * (90 / stages.length)) {
          currentStageIndex = Math.min(
            currentStageIndex + 1,
            stages.length - 1
          );
        }

        updateProgress(callId, {
          progress: Math.min(progress, 90),
          stage: currentStage,
        });
      }, 1500);
    },
    [updateProgress]
  );

  // ============================================================================
  // ✅ ACTIONS CORRIGÉES AVEC VRAIS SERVICES
  // ============================================================================

  /**
   * ✅ CORRECTION : Transcription complète avec VRAIS services
   */
  const transcribeCallComplete = useCallback(
    async (calls: Call[]): Promise<void> => {
      if (calls.length === 0) return;

      setIsProcessing(true);
      console.log(`🚀 Transcription complète de ${calls.length} appels`);

      try {
        for (const call of calls) {
          setCurrentProgress({
            callId: call.id,
            status: "pending",
            progress: 0,
            stage: "Initialisation...",
          });

          const progressInterval = startProgressSimulation(call.id, "complete");

          try {
            // ✅ UTILISER LE VRAI SERVICE au lieu du mock
            const result = await transcriptionService.transcribeComplete(
              call.id
            );

            clearInterval(progressInterval);

            if (result.success) {
              setCurrentProgress({
                callId: call.id,
                status: "completed",
                progress: 100,
                stage: `Terminé: ${result.metrics.wordCount} mots, ${result.metrics.speakerCount} speakers`,
              });
            } else {
              setCurrentProgress({
                callId: call.id,
                status: "error",
                progress: 0,
                stage: "Échec",
                error: result.error,
              });
            }
          } catch (error) {
            clearInterval(progressInterval);
            setCurrentProgress({
              callId: call.id,
              status: "error",
              progress: 0,
              stage: "Erreur",
              error: error instanceof Error ? error.message : "Erreur inconnue",
            });
          }
        }

        await reload();
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService, startProgressSimulation, reload]
  );

  /**
   * ✅ CORRECTION : Transcription ASR seulement
   */
  const transcribeCallOnly = useCallback(
    async (calls: Call[]): Promise<void> => {
      if (calls.length === 0) return;

      setIsProcessing(true);
      console.log(`🎙️ Transcription ASR de ${calls.length} appels`);

      try {
        for (const call of calls) {
          setCurrentProgress({
            callId: call.id,
            status: "transcribing",
            progress: 0,
            stage: "Transcription audio...",
          });

          const progressInterval = startProgressSimulation(
            call.id,
            "transcription-only"
          );

          try {
            // ✅ UTILISER LE VRAI SERVICE
            const result = await transcriptionService.transcribeOnly(call.id);

            clearInterval(progressInterval);

            if (result.success) {
              setCurrentProgress({
                callId: call.id,
                status: "completed",
                progress: 100,
                stage: `Transcrit: ${result.metrics.wordCount} mots`,
              });
            } else {
              setCurrentProgress({
                callId: call.id,
                status: "error",
                progress: 0,
                stage: "Échec",
                error: result.error,
              });
            }
          } catch (error) {
            clearInterval(progressInterval);
            setCurrentProgress({
              callId: call.id,
              status: "error",
              progress: 0,
              stage: "Erreur",
              error: error instanceof Error ? error.message : "Erreur inconnue",
            });
          }
        }

        await reload();
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService, startProgressSimulation, reload]
  );

  /**
   * ✅ CORRECTION : Diarisation seulement
   */
  const diarizeExistingCall = useCallback(
    async (calls: Call[]): Promise<void> => {
      if (calls.length === 0) return;

      setIsProcessing(true);
      console.log(`👥 Diarisation de ${calls.length} appels`);

      try {
        for (const call of calls) {
          // Vérifier qu'il y a une transcription
          if (!call.hasValidTranscription()) {
            setCurrentProgress({
              callId: call.id,
              status: "error",
              progress: 0,
              stage: "Erreur",
              error: "Transcription requise pour la diarisation",
            });
            continue;
          }

          setCurrentProgress({
            callId: call.id,
            status: "diarizing",
            progress: 0,
            stage: "Séparation des locuteurs...",
          });

          const progressInterval = startProgressSimulation(
            call.id,
            "diarization-only"
          );

          try {
            // ✅ UTILISER LE VRAI SERVICE
            const result = await transcriptionService.diarizeExisting(call.id);

            clearInterval(progressInterval);

            if (result.success) {
              setCurrentProgress({
                callId: call.id,
                status: "completed",
                progress: 100,
                stage: `Diarisé: ${result.metrics.speakerCount} locuteurs identifiés`,
              });
            } else {
              setCurrentProgress({
                callId: call.id,
                status: "error",
                progress: 0,
                stage: "Échec",
                error: result.error,
              });
            }
          } catch (error) {
            clearInterval(progressInterval);
            setCurrentProgress({
              callId: call.id,
              status: "error",
              progress: 0,
              stage: "Erreur",
              error: error instanceof Error ? error.message : "Erreur inconnue",
            });
          }
        }

        await reload();
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService, startProgressSimulation, reload]
  );

  /**
   * ✅ CORRECTION : Traitement par lot avec VRAIS services
   */
  const transcribeBatch = useCallback(
    async (
      callIds: string[],
      mode: TranscriptionMode = "complete"
    ): Promise<BatchTranscriptionResult | null> => {
      if (callIds.length === 0) return null;

      setIsProcessing(true);
      setBatchProgress({
        totalCalls: callIds.length,
        completedCalls: 0,
        results: [],
        totalCost: 0,
        averageTimePerCall: 0,
        isRunning: true,
      });

      try {
        console.log(
          `🔄 Traitement par lot: ${callIds.length} appels (${mode})`
        );

        // ✅ UTILISER LE VRAI SERVICE avec callback de progression
        const result = await transcriptionService.transcribeBatch(callIds, {
          mode,
          maxConcurrent: 2,
          pauseBetweenBatches: 1500,
          onProgress: (completed, total, currentResult) => {
            setBatchProgress((prev) => {
              if (!prev) return null;

              const results = currentResult
                ? [...prev.results, currentResult]
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
                currentCall: currentResult
                  ? {
                      callId: currentResult.callId,
                      status: currentResult.success ? "completed" : "error",
                      progress: 100,
                      stage: currentResult.success
                        ? `Terminé: ${currentResult.metrics.wordCount} mots`
                        : `Échec: ${currentResult.error}`,
                      error: currentResult.error,
                    }
                  : undefined,
              };
            });
          },
        });

        setBatchProgress((prev) =>
          prev ? { ...prev, isRunning: false } : null
        );
        await reload();

        return result;
      } catch (error) {
        console.error("❌ Traitement par lot échoué:", error);
        setBatchProgress((prev) =>
          prev ? { ...prev, isRunning: false } : null
        );
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [transcriptionService, reload]
  );

  // ============================================================================
  // ✅ VALIDATION EXISTANTE (conservée)
  // ============================================================================

  const validateTranscriptions = useCallback(
    async (calls: Call[]): Promise<void> => {
      if (calls.length === 0) return;

      setIsProcessing(true);
      console.log(`✅ Validation de ${calls.length} transcriptions`);

      try {
        const { transcriptionTransformationService } = services;

        for (const call of calls) {
          if (!call.hasValidTranscription()) {
            setCurrentProgress({
              callId: call.id,
              status: "error",
              progress: 0,
              stage: "Aucune transcription à valider",
              error: "Aucune transcription trouvée",
            });
            continue;
          }

          setCurrentProgress({
            callId: call.id,
            status: "aligning",
            progress: 50,
            stage: "Validation et transformation...",
          });

          try {
            const transcriptionData = call.getTranscription();
            const result =
              await transcriptionTransformationService.transformJsonToWords(
                call.id,
                transcriptionData
              );

            if (result.success) {
              // tolérant à plusieurs shapes de résultat
              const totalWords =
                (result as any)?.stats?.totalWords ??
                (result as any)?.totalWords ??
                (Array.isArray((result as any)?.words)
                  ? (result as any).words.length
                  : undefined) ??
                (Array.isArray((result as any)?.transcription?.words)
                  ? (result as any).transcription.words.length
                  : 0);

              setCurrentProgress({
                callId: call.id,
                status: "completed",
                progress: 100,
                stage: `Validé: ${totalWords} mots transformés`,
              });
            } else {
              setCurrentProgress({
                callId: call.id,
                status: "error",
                progress: 0,
                stage: "Validation échouée",
                error: result.error || "Erreur de validation",
              });
            }
          } catch (error) {
            setCurrentProgress({
              callId: call.id,
              status: "error",
              progress: 0,
              stage: "Erreur de validation",
              error: error instanceof Error ? error.message : "Erreur inconnue",
            });
          }
        }

        await reload();
      } finally {
        setIsProcessing(false);
      }
    },
    [services, reload]
  );

  // ============================================================================
  // UTILITAIRES ET HELPERS
  // ============================================================================

  const resetProgress = useCallback(() => {
    setCurrentProgress(null);
    setBatchProgress(null);
  }, []);

  const cancelBatch = useCallback(() => {
    console.warn("⚠️ Annulation de batch pas encore implémentée");
    setBatchProgress((prev) => (prev ? { ...prev, isRunning: false } : null));
    setIsProcessing(false);
  }, []);

  const calculateBatchEstimate = useCallback(
    (calls: Call[], mode: TranscriptionMode = "complete") => {
      const totalMinutes =
        calls.reduce((sum, call) => {
          // Utiliser duree si disponible, sinon estimer 5 minutes
          const durationSeconds =
            call instanceof CallExtended ? (call as any).duree || 300 : 300;
          return sum + durationSeconds;
        }, 0) / 60;

      const whisperCost = totalMinutes * 0.006;
      const assemblyAICost = totalMinutes * 0.00065;

      let estimatedCost = 0;
      if (mode === "transcription-only") {
        estimatedCost = whisperCost;
      } else if (mode === "diarization-only") {
        estimatedCost = assemblyAICost;
      } else if (mode === "complete") {
        estimatedCost = whisperCost + assemblyAICost;
      }

      return {
        estimatedCost,
        estimatedTimeMinutes: Math.ceil(totalMinutes * 0.4), // ~40% du temps audio
        totalAudioMinutes: totalMinutes,
      };
    },
    []
  );

  // ============================================================================
  // RETURN - INTERFACE COMPATIBLE AVEC VOS COMPOSANTS
  // ============================================================================

  return {
    // États
    isProcessing,
    currentProgress,
    batchProgress,

    // Actions principales (noms adaptés à vos composants existants)
    transcribeCallComplete,
    transcribeCallOnly,
    diarizeExistingCall,
    validateTranscriptions,

    // Actions par lot
    transcribeBatch,

    // Utilitaires
    resetProgress,
    cancelBatch,
    calculateBatchEstimate,

    // Helpers pour l'UI
    progress: currentProgress, // Alias pour compatibilité avec TranscriptionProgress.tsx
  };
}

// ============================================================================
// HELPERS PRIVÉS
// ============================================================================

function getStagesForMode(mode: TranscriptionMode): string[] {
  switch (mode) {
    case "transcription-only":
      return [
        "Préparation audio...",
        "Transcription OpenAI...",
        "Normalisation...",
        "Validation...",
      ];
    case "diarization-only":
      return [
        "Chargement transcription...",
        "Analyse AssemblyAI...",
        "Alignement segments...",
        "Mise à jour...",
      ];
    case "complete":
      return [
        "Préparation audio...",
        "Transcription OpenAI...",
        "Analyse locuteurs...",
        "Alignement temporal...",
        "Validation finale...",
      ];
    default:
      return ["Traitement..."];
  }
}
