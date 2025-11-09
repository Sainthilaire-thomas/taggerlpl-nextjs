import { useCallback, useState } from "react";
import supabaseClient from "@/lib/supabaseClient";
import { TranscriptionTransformationService } from "@/features/phase1-corpus/calls/domain/services/TranscriptionTransformationService";

/**
 * Préparation d'un appel pour le tagging.
 * Version corrigée qui utilise TranscriptionTransformationService
 * pour transformer le JSON en mots + créer l'entrée transcript
 */
export function useCallPreparation() {
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparationProgress, setPreparationProgress] = useState<{
    currentCall?: string;
    currentStep?: string;
    progress?: number;
  }>({});

  // Instance du service de transformation
  const transformationService = new TranscriptionTransformationService(
    supabaseClient
  );

  const prepareCall = useCallback(
    async (callId: string) => {
      if (!callId) throw new Error("callId requis pour prepareCall");

      setIsPreparing(true);
      setPreparationProgress({
        currentCall: callId,
        currentStep: "Vérification de l'appel...",
        progress: 10,
      });

      try {
        // 1. Récupérer l'appel avec sa transcription JSON
        setPreparationProgress((prev) => ({
          ...prev,
          currentStep: "Récupération des données...",
          progress: 20,
        }));

        const { data: call, error: callError } = await supabaseClient
          .from("call")
          .select("callid, transcription, preparedfortranscript")
          .eq("callid", callId)
          .single();

        if (callError || !call) {
          throw new Error(`Appel ${callId} introuvable: ${callError?.message}`);
        }

        if (call.preparedfortranscript) {
          setPreparationProgress({});
          throw new Error(`Appel ${callId} déjà préparé`);
        }

        if (!call.transcription) {
          setPreparationProgress({});
          throw new Error(
            `Aucune transcription JSON trouvée pour l'appel ${callId}`
          );
        }

        // 2. Valider et parser la transcription JSON
        setPreparationProgress((prev) => ({
          ...prev,
          currentStep: "Validation de la transcription...",
          progress: 40,
        }));

        let transcriptionJson;
        try {
          transcriptionJson =
            typeof call.transcription === "string"
              ? JSON.parse(call.transcription)
              : call.transcription;
        } catch (parseError) {
          throw new Error(
            `JSON de transcription invalide: ${
              parseError instanceof Error
                ? parseError.message
                : "Erreur de parsing"
            }`
          );
        }

        // 3. Transformation via le service
        setPreparationProgress((prev) => ({
          ...prev,
          currentStep: "Transformation JSON → mots...",
          progress: 60,
        }));

        const transformationResult =
          await transformationService.transformJsonToWords(
            callId,
            transcriptionJson
          );

        if (!transformationResult.success) {
          throw new Error(
            `Échec transformation: ${transformationResult.message}`
          );
        }

        setPreparationProgress((prev) => ({
          ...prev,
          currentStep: "Finalisation...",
          progress: 90,
        }));

        console.log(`✅ Préparation réussie pour ${callId}:`, {
          transcriptId: transformationResult.transcriptId,
          wordsInserted: transformationResult.wordsInserted,
        });

        setPreparationProgress((prev) => ({
          ...prev,
          currentStep: "Terminé ✓",
          progress: 100,
        }));

        // Petit délai pour afficher le succès
        setTimeout(() => setPreparationProgress({}), 1000);
      } catch (error) {
        console.error(`❌ Erreur préparation ${callId}:`, error);
        setPreparationProgress({});
        throw error;
      } finally {
        setIsPreparing(false);
      }
    },
    [transformationService]
  );

  const prepareMultipleCalls = useCallback(
    async (callIds: string[]) => {
      setIsPreparing(true);
      const results: Array<{
        callId: string;
        success: boolean;
        error?: string;
      }> = [];

      for (let i = 0; i < callIds.length; i++) {
        const callId = callIds[i];

        setPreparationProgress({
          currentCall: callId,
          currentStep: `Préparation ${i + 1}/${callIds.length}`,
          progress: Math.round((i / callIds.length) * 100),
        });

        try {
          await prepareCall(callId);
          results.push({ callId, success: true });
        } catch (error) {
          results.push({
            callId,
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }

      setPreparationProgress({});
      setIsPreparing(false);
      return results;
    },
    [prepareCall]
  );

  // Méthode pour obtenir les statistiques de transformation d'un appel
  const getCallTransformationStats = useCallback(
    async (callId: string) => {
      return await transformationService.getTransformationStats(callId);
    },
    [transformationService]
  );

  // Méthode utilitaire pour vérifier si un appel peut être préparé
  const canPrepareCall = useCallback(
    async (
      callId: string
    ): Promise<{ canPrepare: boolean; reason?: string }> => {
      try {
        const { data: call, error } = await supabaseClient
          .from("call")
          .select("callid, transcription, preparedfortranscript")
          .eq("callid", callId)
          .single();

        if (error || !call) {
          return { canPrepare: false, reason: "Appel introuvable" };
        }

        if (call.preparedfortranscript) {
          return { canPrepare: false, reason: "Déjà préparé" };
        }

        if (!call.transcription) {
          return { canPrepare: false, reason: "Aucune transcription JSON" };
        }

        return { canPrepare: true };
      } catch (error) {
        return {
          canPrepare: false,
          reason: error instanceof Error ? error.message : "Erreur inconnue",
        };
      }
    },
    []
  );

  return {
    prepareCall,
    prepareMultipleCalls,
    canPrepareCall,
    getCallTransformationStats,
    isPreparing,
    preparationProgress,
  };
}

export type UseCallPreparation = ReturnType<typeof useCallPreparation>;
