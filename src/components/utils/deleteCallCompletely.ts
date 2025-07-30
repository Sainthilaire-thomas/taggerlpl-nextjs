// utils/deleteCallCompletely.ts
import supabase from "@/lib/supabaseClient";
import { removeCallUpload } from "./removeCallUpload";

export interface DeleteResult {
  success: boolean;
  message: string;
  deletedResources: {
    audio: boolean;
    transcription: boolean;
    wordsCount: number;
    call: boolean;
  };
  error?: string;
}

export interface CallInfo {
  callid: string;
  upload?: boolean;
  filepath?: string | null;
  preparedfortranscript?: boolean;
  filename?: string | null;
}

/**
 * Supprime complètement un appel du système
 * Extension de removeCallUpload avec suppression finale de l'appel
 *
 * @param callId - ID de l'appel à supprimer
 * @returns Promise<DeleteResult> - Résumé des actions effectuées
 */
export const deleteCallCompletely = async (
  callId: string
): Promise<DeleteResult> => {
  try {
    console.log("🗑️ === DÉBUT SUPPRESSION COMPLÈTE ===");
    console.log("Call ID:", callId);

    // Étape 1: Récupérer les informations de l'appel avant suppression
    const { data: callInfo, error: fetchError } = await supabase
      .from("call")
      .select("callid, upload, filepath, preparedfortranscript, filename")
      .eq("callid", callId)
      .single();

    if (fetchError) {
      console.error(
        "❌ Erreur lors de la récupération de l'appel:",
        fetchError
      );
      return {
        success: false,
        message: "Appel introuvable dans la base de données",
        deletedResources: {
          audio: false,
          transcription: false,
          wordsCount: 0,
          call: false,
        },
        error: fetchError.message,
      };
    }

    if (!callInfo) {
      return {
        success: false,
        message: "Appel introuvable",
        deletedResources: {
          audio: false,
          transcription: false,
          wordsCount: 0,
          call: false,
        },
        error: "Aucune donnée retournée",
      };
    }

    console.log("📋 Informations de l'appel récupérées:", {
      callid: callInfo.callid,
      hasAudio: callInfo.upload && !!callInfo.filepath,
      hasTranscription: callInfo.preparedfortranscript,
      filename: callInfo.filename,
    });

    let deletedResources = {
      audio: false,
      transcription: false,
      wordsCount: 0,
      call: false,
    };

    // Étape 2: Compter les mots de transcription avant suppression
    let wordsCount = 0;
    if (callInfo.preparedfortranscript) {
      try {
        const { data: transcripts } = await supabase
          .from("transcript")
          .select("transcriptid")
          .eq("callid", callId);

        if (transcripts && transcripts.length > 0) {
          const transcriptIds = transcripts.map((t) => t.transcriptid);
          const { count } = await supabase
            .from("word")
            .select("*", { count: "exact", head: true })
            .in("transcriptid", transcriptIds);

          wordsCount = count || 0;
          console.log(`📝 ${wordsCount} mots de transcription à supprimer`);
        }
      } catch (error) {
        console.warn("⚠️ Erreur lors du comptage des mots:", error);
      }
    }

    // Étape 3: Utiliser removeCallUpload pour nettoyer les ressources
    console.log("🧹 Appel de removeCallUpload...");
    try {
      await removeCallUpload(callId, callInfo.filepath);

      // Marquer les ressources comme supprimées
      if (callInfo.upload && callInfo.filepath) {
        deletedResources.audio = true;
        console.log("✅ Fichier audio supprimé");
      }

      if (callInfo.preparedfortranscript) {
        deletedResources.transcription = true;
        deletedResources.wordsCount = wordsCount;
        console.log("✅ Données de transcription supprimées");
      }

      console.log("✅ removeCallUpload terminé avec succès");
    } catch (removeError) {
      console.error("❌ Erreur dans removeCallUpload:", removeError);
      return {
        success: false,
        message: "Erreur lors de la suppression des ressources",
        deletedResources,
        error:
          removeError instanceof Error
            ? removeError.message
            : String(removeError),
      };
    }

    // Étape 4: Suppression finale de l'appel de la table call
    console.log("🗑️ Suppression finale de l'appel...");
    const { error: deleteError } = await supabase
      .from("call")
      .delete()
      .eq("callid", callId);

    if (deleteError) {
      console.error(
        "❌ Erreur lors de la suppression de l'appel:",
        deleteError
      );
      return {
        success: false,
        message:
          "Ressources supprimées mais erreur lors de la suppression de l'appel",
        deletedResources,
        error: deleteError.message,
      };
    }

    deletedResources.call = true;
    console.log("✅ Appel supprimé définitivement de la table call");

    // Étape 5: Génération du message de succès
    const successMessage = generateSuccessMessage(callInfo, deletedResources);

    console.log("🎉 === SUPPRESSION COMPLÈTE RÉUSSIE ===");
    console.log("Ressources supprimées:", deletedResources);

    return {
      success: true,
      message: successMessage,
      deletedResources,
    };
  } catch (error) {
    console.error("❌ Erreur inattendue dans deleteCallCompletely:", error);
    return {
      success: false,
      message: "Erreur inattendue lors de la suppression",
      deletedResources: {
        audio: false,
        transcription: false,
        wordsCount: 0,
        call: false,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Génère un message de succès adapté aux ressources supprimées
 */
const generateSuccessMessage = (
  callInfo: CallInfo,
  deletedResources: DeleteResult["deletedResources"]
): string => {
  const parts: string[] = [];

  if (deletedResources.audio) {
    parts.push("fichier audio");
  }

  if (deletedResources.transcription) {
    parts.push(
      `données de transcription (${deletedResources.wordsCount} mots)`
    );
  }

  if (parts.length === 0) {
    return `Appel ${callInfo.callid} supprimé avec succès`;
  }

  return `Appel ${callInfo.callid} et ${parts.join(
    " + "
  )} supprimés avec succès`;
};

/**
 * Fonction utilitaire pour vérifier si un appel existe
 */
export const checkCallExists = async (callId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("call")
      .select("callid")
      .eq("callid", callId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
};

/**
 * Fonction utilitaire pour obtenir les infos d'un appel
 */
export const getCallInfo = async (callId: string): Promise<CallInfo | null> => {
  try {
    const { data, error } = await supabase
      .from("call")
      .select("callid, upload, filepath, preparedfortranscript, filename")
      .eq("callid", callId)
      .single();

    return error ? null : data;
  } catch {
    return null;
  }
};
