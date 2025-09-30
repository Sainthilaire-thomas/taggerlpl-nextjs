// src/components/calls/ui/hooks/actions/useCallPreparationActions.ts
import { useCallback } from "react";
import type { Call } from "../../../domain/entities/Call";
import { useCallPreparation } from "../../hooks/useCallPreparation";
import { useCallManagement } from "../../hooks/useCallManagement"; // pour markAsPrepared si dispo

interface Props {
  reload: () => Promise<void> | void;
}

export function useCallPreparationActions({ reload }: Props) {
  const {
    prepareCall,
    prepareMultipleCalls,
    canPrepareCall,
    getCallTransformationStats,
    isPreparing,
    preparationProgress,
  } = useCallPreparation();

  // Garde l'ancien hook si il existe pour la compatibilité
  const { markAsPrepared } = useCallManagement(); // existe dans ton fichier

  /**
   * Prépare un ou plusieurs appels en transformant le JSON en mots
   * Nouvelle implémentation qui utilise TranscriptionTransformationService
   */
  const prepareForTagging = useCallback(
    async (calls: Call[]) => {
      console.log(`🔧 Préparation de ${calls.length} appel(s) pour tagging...`);

      try {
        if (calls.length === 1) {
          // Appel unique
          await prepareCall(calls[0].id);
        } else {
          // Appels multiples
          const callIds = calls.map((c) => c.id);
          const results = await prepareMultipleCalls(callIds);

          // Afficher un résumé des résultats
          const successful = results.filter((r) => r.success).length;
          const failed = results.filter((r) => !r.success).length;

          if (failed > 0) {
            console.warn(
              `⚠️ ${successful}/${calls.length} appels préparés avec succès. ${failed} échecs.`
            );
            const failedCalls = results
              .filter((r) => !r.success)
              .map((r) => `${r.callId}: ${r.error}`)
              .join("\n");
            console.error("Échecs détaillés:", failedCalls);
          } else {
            console.log(
              `✅ Tous les ${calls.length} appels préparés avec succès`
            );
          }
        }
      } catch (error) {
        console.error("❌ Erreur lors de la préparation:", error);
        throw error; // Laisser remonter pour gestion UI
      } finally {
        await reload(); // Rafraîchir les données
      }
    },
    [prepareCall, prepareMultipleCalls, reload]
  );

  /**
   * Marque des appels comme préparés sans transformation
   * (utilise l'ancien hook pour compatibilité)
   */
  const markPrepared = useCallback(
    async (calls: Call[]) => {
      for (const c of calls) {
        await markAsPrepared(c.id); // utilise ton hook existant
      }
      await reload();
    },
    [markAsPrepared, reload]
  );

  /**
   * Vérifie si des appels peuvent être préparés
   */
  const validateCallsForPreparation = useCallback(
    async (
      calls: Call[]
    ): Promise<{
      canPrepare: Call[];
      cannotPrepare: Array<{ call: Call; reason: string }>;
    }> => {
      const canPrepare: Call[] = [];
      const cannotPrepare: Array<{ call: Call; reason: string }> = [];

      for (const call of calls) {
        const validation = await canPrepareCall(call.id);
        if (validation.canPrepare) {
          canPrepare.push(call);
        } else {
          cannotPrepare.push({
            call,
            reason: validation.reason || "Raison inconnue",
          });
        }
      }

      return { canPrepare, cannotPrepare };
    },
    [canPrepareCall]
  );

  /**
   * Obtient les statistiques de transformation pour des appels
   */
  const getPreparationStats = useCallback(
    async (calls: Call[]) => {
      const stats = await Promise.all(
        calls.map((call) => getCallTransformationStats(call.id))
      );

      return stats.reduce(
        (acc, stat) => {
          if (stat.error) {
            acc.errors.push(stat);
          } else if (stat.hasTranscript) {
            acc.prepared.push(stat);
            acc.totalWords += stat.wordCount || 0;
            acc.totalSpeakers += stat.speakerCount || 0;
          } else {
            acc.notPrepared.push(stat);
          }
          return acc;
        },
        {
          prepared: [] as any[],
          notPrepared: [] as any[],
          errors: [] as any[],
          totalWords: 0,
          totalSpeakers: 0,
        }
      );
    },
    [getCallTransformationStats]
  );

  return {
    // Actions principales
    prepareForTagging,
    markPrepared,

    // Validation et statistiques
    validateCallsForPreparation,
    getPreparationStats,

    // État
    isPreparing,
    preparationProgress,

    // Pour debug/monitoring
    canPrepareCall,
    getCallTransformationStats,
  };
}
