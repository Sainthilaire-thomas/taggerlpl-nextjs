// components/utils/deleteCallCompletely.ts - VERSION CORRIGÉE avec gestion entreprise_call
import { createClient } from "@supabase/supabase-js";

// ✅ CRÉATION DU CLIENT SUPABASE - Remplacez par votre configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ INTERFACES CORRIGÉES avec toutes les propriétés optionnelles
export interface DeletePreview {
  callExists: boolean;
  hasAudio: boolean;
  hasTranscription: boolean;
  wordsCount?: number; // ✅ Optionnel
  turntaggedCount?: number; // ✅ Optionnel
  postitsCount?: number; // ✅ Optionnel
  activitiesCount?: number; // ✅ Optionnel
  callActivityRelationsCount?: number; // ✅ Optionnel
  entrepriseCallCount?: number; // ✅ NOUVEAU - Table entreprise_call
  filename?: string;
  willBeConverted: boolean;
  constraints: string[];
}

export interface DeleteResult {
  success: boolean;
  message: string;
  details?: {
    deletedResources: string[];
    keptResources: string[];
    convertedCall?: boolean;
  };
  error?: string;
  debugInfo?: any;
}

/**
 * ✅ FONCTION CORRIGÉE - Récupère l'aperçu avec toutes les contraintes
 */
export async function getDeletePreview(callId: string): Promise<DeletePreview> {
  try {
    console.log(`🔍 Analyse de l'appel ${callId} pour suppression...`);

    // 1. Vérifier l'existence de l'appel
    const { data: callData, error: callError } = await supabase
      .from("call")
      .select("callid, filename, filepath, upload, preparedfortranscript")
      .eq("callid", callId)
      .single();

    if (callError || !callData) {
      console.log(`❌ Appel ${callId} non trouvé:`, callError);
      return {
        callExists: false,
        hasAudio: false,
        hasTranscription: false,
        wordsCount: 0,
        turntaggedCount: 0,
        postitsCount: 0,
        activitiesCount: 0,
        callActivityRelationsCount: 0,
        entrepriseCallCount: 0, // ✅ NOUVEAU
        willBeConverted: false,
        constraints: [],
      };
    }

    console.log(`✅ Appel trouvé:`, callData);

    // 2. Vérifier l'audio
    const hasAudio = Boolean(callData.upload && callData.filepath);
    console.log(`🎵 Audio présent: ${hasAudio}`);

    // 3. ✅ Vérifier la transcription (avec gestion d'erreur 406)
    let hasTranscription = false;
    let transcriptData = null;
    try {
      const { data, error: transcriptError } = await supabase
        .from("transcript")
        .select("transcriptid")
        .eq("callid", callId)
        .single();

      if (!transcriptError && data) {
        hasTranscription = true;
        transcriptData = data;
      }
    } catch (error) {
      console.warn(
        "⚠️ Erreur lors de la vérification de transcription:",
        error
      );
    }

    // 4. Compter les mots de transcription
    let wordsCount = 0;
    if (hasTranscription && transcriptData) {
      const { count } = await supabase
        .from("word")
        .select("*", { count: "exact", head: true })
        .eq("transcriptid", transcriptData.transcriptid);
      wordsCount = count || 0;
    }

    // 5. ✅ Compter les données de tagging (avec gestion d'erreur)
    let turntaggedCount = 0;
    try {
      const { count, error: turntaggedError } = await supabase
        .from("turntagged")
        .select("*", { count: "exact", head: true })
        .eq("call_id", callId);

      if (!turntaggedError) {
        turntaggedCount = count || 0;
      }
    } catch (error) {
      console.warn("⚠️ Erreur lors du comptage turntagged:", error);
    }

    // 6. ✅ Vérifier les post-its (avec gestion d'erreur)
    let postitsCount = 0;
    try {
      const { count, error: postitsError } = await supabase
        .from("postit")
        .select("*", { count: "exact", head: true })
        .eq("callid", callId);

      if (!postitsError) {
        postitsCount = count || 0;
      }
    } catch (error) {
      console.warn("⚠️ Table postit inaccessible:", error);
    }

    // 7. ✅ Vérifier les activités conseillers liées via callactivityrelation
    let activitesCount = 0;
    try {
      const { count, error: activitesError } = await supabase
        .from("callactivityrelation")
        .select("activityid", { count: "exact", head: true })
        .eq("callid", callId);

      if (!activitesError) {
        activitesCount = count || 0;
      }
    } catch (error) {
      console.warn("⚠️ Impossible de compter les activités liées:", error);
    }

    // 8. ✅ Vérifier les relations callactivityrelation (table de jointure réelle)
    let callActivityRelationsCount = 0;
    try {
      const { count, error: relationsError } = await supabase
        .from("callactivityrelation")
        .select("*", { count: "exact", head: true })
        .eq("callid", callId);

      if (!relationsError) {
        callActivityRelationsCount = count || 0;
      }
    } catch (error) {
      console.warn("⚠️ Table callactivityrelation inaccessible:", error);
    }

    // 9. ✅ NOUVEAU - Vérifier la table entreprise_call (contrainte critique)
    let entrepriseCallCount = 0;
    try {
      const { count, error: entrepriseError } = await supabase
        .from("entreprise_call")
        .select("*", { count: "exact", head: true })
        .eq("callid", callId);

      if (!entrepriseError) {
        entrepriseCallCount = count || 0;
      }
      console.log(
        `📊 Relations entreprise_call trouvées: ${entrepriseCallCount || 0}`
      );
    } catch (error) {
      console.warn("⚠️ Table entreprise_call inaccessible:", error);
    }

    console.log(
      `📊 Relations callactivityrelation trouvées: ${
        callActivityRelationsCount || 0
      }`
    );

    // 10. ✅ LOGIQUE DE CONVERSION MISE À JOUR
    const hasPostits = (postitsCount || 0) > 0;
    const hasActivites = (activitesCount || 0) > 0;
    const hasActivityRelations = (callActivityRelationsCount || 0) > 0;
    const hasEntrepriseCall = (entrepriseCallCount || 0) > 0; // ✅ NOUVEAU

    // Un appel doit être converti s'il a des contraintes qui l'empêchent d'être supprimé
    const willBeConverted =
      hasPostits || hasActivites || hasActivityRelations || hasEntrepriseCall;

    // 11. Contraintes qui empêchent la suppression complète
    const constraints: string[] = [];
    if (hasPostits) {
      constraints.push(`${postitsCount} post-its`);
    }
    if (hasActivites) {
      constraints.push(`${activitesCount} activités conseillers`);
    }
    if (hasActivityRelations) {
      constraints.push(`${callActivityRelationsCount} relations d'activité`);
    }
    if (hasEntrepriseCall) {
      constraints.push(`${entrepriseCallCount} relations entreprise`); // ✅ NOUVEAU
    }

    const result: DeletePreview = {
      callExists: true,
      hasAudio,
      hasTranscription,
      wordsCount: wordsCount || 0,
      turntaggedCount: turntaggedCount || 0,
      postitsCount: postitsCount || 0,
      activitiesCount: activitesCount || 0,
      callActivityRelationsCount: callActivityRelationsCount || 0,
      entrepriseCallCount: entrepriseCallCount || 0, // ✅ NOUVEAU
      filename: callData.filename,
      willBeConverted,
      constraints,
    };

    console.log(`📊 Aperçu de suppression pour ${callId}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de ${callId}:`, error);
    return {
      callExists: false,
      hasAudio: false,
      hasTranscription: false,
      wordsCount: 0,
      turntaggedCount: 0,
      postitsCount: 0,
      activitiesCount: 0,
      callActivityRelationsCount: 0,
      entrepriseCallCount: 0, // ✅ NOUVEAU
      willBeConverted: false,
      constraints: [],
    };
  }
}

/**
 * ✅ NOUVELLE FONCTION - Effectue une suppression personnalisée (uniquement si aucune contrainte)
 */
async function performCustomDeletion(
  callId: string,
  preview: DeletePreview,
  customOptions: {
    deleteAudio: boolean;
    deleteTranscription: boolean;
    deleteTagging: boolean;
  }
): Promise<DeleteResult> {
  const { deleteAudio, deleteTranscription, deleteTagging } = customOptions;
  const deletedResources: string[] = [];
  const keptResources: string[] = [];

  console.log(
    `🎛️ Suppression personnalisée de l'appel ${callId}:`,
    customOptions
  );

  try {
    // ✅ VÉRIFICATION CRITIQUE : Si contraintes détectées, forcer la conversion
    if (preview.willBeConverted) {
      console.log(
        `⚠️ Contraintes détectées, conversion forcée au lieu de suppression personnalisée`
      );
      return await convertCallToNonTagging(callId, preview);
    }

    // ✅ Suppression du fichier audio si demandée
    if (deleteAudio && preview.hasAudio) {
      const audioResult = await deleteAudioFile(callId);
      if (audioResult.success) {
        deletedResources.push("Fichier audio");
      } else {
        console.warn("⚠️ Échec suppression audio:", audioResult.message);
      }
    } else if (preview.hasAudio) {
      keptResources.push("Fichier audio");
    }

    // ✅ Suppression de la transcription si demandée
    if (deleteTranscription && preview.hasTranscription) {
      const transcriptionResult = await deleteTranscriptionData(callId);
      if (transcriptionResult.success) {
        deletedResources.push(
          `Transcription (${preview.wordsCount || 0} mots)`
        );
      } else {
        console.warn(
          "⚠️ Échec suppression transcription:",
          transcriptionResult.message
        );
      }
    } else if (preview.hasTranscription) {
      keptResources.push(`Transcription (${preview.wordsCount || 0} mots)`);
    }

    // ✅ Suppression des données de tagging si demandée
    if (deleteTagging && (preview.turntaggedCount || 0) > 0) {
      const taggingResult = await deleteTaggingData(callId);
      if (taggingResult.success) {
        deletedResources.push(
          `Données de tagging (${preview.turntaggedCount || 0} tours)`
        );
      } else {
        console.warn("⚠️ Échec suppression tagging:", taggingResult.message);
      }
    } else if ((preview.turntaggedCount || 0) > 0) {
      keptResources.push(
        `Données de tagging (${preview.turntaggedCount || 0} tours)`
      );
    }

    // ✅ Suppression de l'appel principal uniquement si tout est supprimé
    const keepingAudio = !deleteAudio && preview.hasAudio;
    const keepingTranscription =
      !deleteTranscription && preview.hasTranscription;
    const keepingTagging = !deleteTagging && (preview.turntaggedCount || 0) > 0;

    if (keepingAudio || keepingTranscription || keepingTagging) {
      // On garde l'appel
      keptResources.push("Appel principal");
    } else {
      // Supprimer l'appel principal
      const { error: deleteCallError } = await supabase
        .from("call")
        .delete()
        .eq("callid", callId);

      if (deleteCallError) {
        return {
          success: false,
          message: "Erreur lors de la suppression de l'appel principal",
          error: deleteCallError.message,
        };
      }

      deletedResources.push("Appel principal");
    }

    return {
      success: true,
      message: `Suppression personnalisée de l'appel ${callId} terminée`,
      details: {
        deletedResources,
        keptResources,
        convertedCall: false,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la suppression personnalisée",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * ✅ FONCTION PRINCIPALE CORRIGÉE avec gestion des contraintes + mode personnalisé
 */
export async function deleteCallCompletely(
  callId: string,
  options: {
    mode: "standard" | "complete" | "custom";
    confirmCompleteDelete?: boolean;
    customOptions?: {
      deleteAudio: boolean;
      deleteTranscription: boolean;
      deleteTagging: boolean;
    };
  } = { mode: "standard" }
): Promise<DeleteResult> {
  const { mode, confirmCompleteDelete, customOptions } = options;

  try {
    console.log(`🚀 Début de suppression de l'appel ${callId} en mode ${mode}`);

    // 1. Obtenir l'aperçu pour décider de l'action
    const preview = await getDeletePreview(callId);

    if (!preview.callExists) {
      return {
        success: false,
        message: "Appel non trouvé",
        error: `L'appel ${callId} n'existe pas dans la base de données`,
      };
    }

    // 2. ✅ GESTION DU MODE PERSONNALISÉ
    if (mode === "custom" && customOptions) {
      return await performCustomDeletion(callId, preview, customOptions);
    }

    // 3. ✅ CONVERSION FORCÉE SI CONTRAINTES DÉTECTÉES (modes standard/complete)
    if (
      preview.willBeConverted &&
      (mode === "standard" || mode === "complete")
    ) {
      console.log(
        `🔄 Conversion forcée de l'appel ${callId} - Contraintes détectées:`,
        preview.constraints
      );

      return await convertCallToNonTagging(callId, preview);
    }

    // 4. ✅ SUPPRESSION STANDARD OU COMPLÈTE (uniquement si aucune contrainte)
    return await performCallDeletion(
      callId,
      preview,
      mode,
      confirmCompleteDelete
    );
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de ${callId}:`, error);
    return {
      success: false,
      message: "Erreur inattendue lors de la suppression",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * ✅ NOUVELLE FONCTION - Convertit un appel en non-tagging
 */
async function convertCallToNonTagging(
  callId: string,
  preview: DeletePreview
): Promise<DeleteResult> {
  try {
    // Supprimer uniquement les données de tagging (autorisé même avec contraintes)
    const { error: turntaggedError } = await supabase
      .from("turntagged")
      .delete()
      .eq("call_id", callId);

    if (turntaggedError) {
      console.error("❌ Erreur suppression turntagged:", turntaggedError);
      return {
        success: false,
        message: "Erreur lors de la suppression des données de tagging",
        error: turntaggedError.message,
      };
    }

    // Marquer l'appel comme non-tagging
    const { error: updateError } = await supabase
      .from("call")
      .update({ is_tagging_call: false })
      .eq("callid", callId);

    if (updateError) {
      console.error("❌ Erreur mise à jour call:", updateError);
      return {
        success: false,
        message: "Erreur lors de la conversion de l'appel",
        error: updateError.message,
      };
    }

    // Construire la liste des ressources conservées
    const keptResources = [
      "appel principal",
      ...(preview.hasAudio ? ["fichier audio"] : []),
      ...(preview.hasTranscription ? ["transcription"] : []),
      ...((preview.postitsCount || 0) > 0
        ? [`${preview.postitsCount} post-its`]
        : []),
      ...((preview.activitiesCount || 0) > 0
        ? [`${preview.activitiesCount} activités conseillers`]
        : []),
      ...((preview.callActivityRelationsCount || 0) > 0
        ? [`${preview.callActivityRelationsCount} relations`]
        : []),
      ...((preview.entrepriseCallCount || 0) > 0
        ? [`${preview.entrepriseCallCount} relations entreprise`]
        : []), // ✅ NOUVEAU
    ];

    return {
      success: true,
      message: `Appel ${callId} converti avec succès`,
      details: {
        deletedResources: ["données de tagging"],
        keptResources,
        convertedCall: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la conversion",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * ✅ FONCTION AMÉLIORÉE - Diagnostic complet des contraintes avec entreprise_call
 */
async function diagnoseAllConstraints(callId: string): Promise<{
  constraints: string[];
  tables: Record<string, number>;
}> {
  const constraints: string[] = [];
  const tables: Record<string, number> = {};

  // Liste complète des tables à vérifier (avec entreprise_call en priorité)
  const tablesToCheck = [
    { table: "entreprise_call", field: "callid" }, // ✅ PRIORITÉ - Table critique manquante
    { table: "turntagged", field: "call_id" },
    { table: "postit", field: "callid" },
    { table: "callactivityrelation", field: "callid" },
    { table: "transcript", field: "callid" },
    { table: "word", field: "callid" }, // Au cas où il y aurait un lien direct
    // Ajout de tables potentielles
    { table: "call_notes", field: "callid" },
    { table: "call_tags", field: "call_id" },
    { table: "call_metadata", field: "callid" },
    { table: "call_analytics", field: "call_id" },
    { table: "feedback", field: "callid" },
    { table: "coaching_sessions", field: "call_id" },
    // Tables de logs/audit potentielles
    { table: "audit_log", field: "call_id" },
    { table: "activity_logs", field: "call_id" },
  ];

  for (const { table, field } of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(field, callId);

      if (!error && count && count > 0) {
        constraints.push(`${table} (${count} entrées)`);
        tables[table] = count;
        console.log(`🔍 Contrainte trouvée: ${table} -> ${count} entrées`);
      }
    } catch (error) {
      // Table n'existe pas, on continue
      console.debug(`ℹ️ Table ${table} non accessible ou inexistante`);
    }
  }

  return { constraints, tables };
}

/**
 * ✅ FONCTION AMÉLIORÉE - Supprime TOUTES les contraintes détectées avec entreprise_call
 */
async function removeAllConstraintsAggressively(
  callId: string,
  detectedTables: Record<string, number>
): Promise<{
  success: boolean;
  removedConstraints: string[];
  errors: string[];
}> {
  const removedConstraints: string[] = [];
  const errors: string[] = [];

  // ✅ ORDRE DE SUPPRESSION CRITIQUE - entreprise_call en premier
  const tableOrder = [
    "entreprise_call", // ✅ PREMIÈRE PRIORITÉ
    "callactivityrelation",
    "turntagged",
    "postit",
    "call_notes",
    "call_tags",
    "call_metadata",
    "call_analytics",
    "feedback",
    "coaching_sessions",
    "audit_log",
    "activity_logs",
  ];

  // Suppression dans l'ordre de priorité
  for (const tableName of tableOrder) {
    if (!detectedTables[tableName]) continue; // Pas de données dans cette table

    const count = detectedTables[tableName];

    try {
      let field = "callid"; // Par défaut

      // Mapping des champs spécifiques
      if (tableName === "turntagged") field = "call_id";
      if (tableName === "call_tags") field = "call_id";
      if (tableName === "call_analytics") field = "call_id";
      if (tableName === "activity_logs") field = "call_id";
      if (tableName === "audit_log") field = "call_id";
      if (tableName === "coaching_sessions") field = "call_id";
      // entreprise_call utilise "callid" par défaut

      console.log(`🧹 Suppression ${tableName} (${count} entrées)...`);

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(field, callId);

      if (error) {
        errors.push(`${tableName}: ${error.message}`);
        console.error(`❌ Erreur ${tableName}:`, error);
      } else {
        removedConstraints.push(`${tableName} (${count} entrées)`);
        console.log(`✅ ${tableName} supprimé avec succès`);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      errors.push(`${tableName}: ${errorMsg}`);
      console.warn(`⚠️ Erreur lors de la suppression ${tableName}:`, error);
    }
  }

  return {
    success: errors.length === 0,
    removedConstraints,
    errors,
  };
}

/**
 * ✅ FONCTION MODIFIÉE - Effectue la suppression complète avec suppression des contraintes
 */
async function performCallDeletion(
  callId: string,
  preview: DeletePreview,
  mode: "standard" | "complete" | "custom", // ✅ Ajout du mode custom
  confirmCompleteDelete?: boolean
): Promise<DeleteResult> {
  const deletedResources: string[] = [];
  const keptResources: string[] = [];

  // Variables pour le diagnostic (déclarées en dehors du try)
  let diagnosis: any = null;
  let aggressiveResult: any = null;

  try {
    // ✅ ÉTAPE 1: DIAGNOSTIC COMPLET des contraintes
    console.log(
      `🔍 Diagnostic complet des contraintes pour l'appel ${callId}...`
    );
    diagnosis = await diagnoseAllConstraints(callId);

    if (diagnosis.constraints.length > 0) {
      console.log(`🚨 Contraintes détectées:`, diagnosis.constraints);

      // ✅ ÉTAPE 1.5: Suppression AGRESSIVE de toutes les contraintes
      aggressiveResult = await removeAllConstraintsAggressively(
        callId,
        diagnosis.tables
      );

      if (aggressiveResult.removedConstraints.length > 0) {
        deletedResources.push(...aggressiveResult.removedConstraints);
        console.log(
          `✅ Suppression agressive réussie:`,
          aggressiveResult.removedConstraints
        );
      }

      if (aggressiveResult.errors.length > 0) {
        console.error(
          `❌ Erreurs lors de la suppression agressive:`,
          aggressiveResult.errors
        );
        // On continue quand même, peut-être que certaines contraintes ont été supprimées
      }
    } else {
      console.log(`✅ Aucune contrainte détectée pour l'appel ${callId}`);
    }

    // ÉTAPE 2: Supprimer le fichier audio si présent
    if (preview.hasAudio) {
      const audioResult = await deleteAudioFile(callId);
      if (audioResult.success) {
        deletedResources.push("fichier audio");
      } else {
        console.warn("⚠️ Échec suppression audio:", audioResult.message);
      }
    }

    // ÉTAPE 3: Supprimer les données de transcription
    if (preview.hasTranscription) {
      const transcriptionResult = await deleteTranscriptionData(callId);
      if (transcriptionResult.success) {
        deletedResources.push(
          `transcription (${preview.wordsCount || 0} mots)`
        );
      } else {
        console.warn(
          "⚠️ Échec suppression transcription:",
          transcriptionResult.message
        );
      }
    }

    // ÉTAPE 4: Gestion des données de tagging selon le mode
    if (mode === "complete" && confirmCompleteDelete) {
      if ((preview.turntaggedCount || 0) > 0) {
        const taggingResult = await deleteTaggingData(callId);
        if (taggingResult.success) {
          deletedResources.push(
            `données de tagging (${preview.turntaggedCount || 0} tours)`
          );
        } else {
          console.warn("⚠️ Échec suppression tagging:", taggingResult.message);
        }
      }
    } else {
      if ((preview.turntaggedCount || 0) > 0) {
        keptResources.push(
          `données de tagging (${preview.turntaggedCount || 0} tours)`
        );
      }
    }

    // ✅ ÉTAPE 5: Suppression de l'appel principal avec retry amélioré
    let deleteAttempts = 0;
    const maxAttempts = 3;
    let deleteCallError = null;

    while (deleteAttempts < maxAttempts) {
      deleteAttempts++;
      console.log(
        `🔄 Tentative ${deleteAttempts}/${maxAttempts} de suppression de l'appel ${callId}`
      );

      const { error } = await supabase
        .from("call")
        .delete()
        .eq("callid", callId);

      if (!error) {
        console.log(`✅ Appel ${callId} supprimé avec succès`);
        deleteCallError = null;
        break;
      } else {
        deleteCallError = error;
        console.warn(`⚠️ Tentative ${deleteAttempts} échouée:`, error);

        // ✅ Si c'est une contrainte de clé étrangère, re-diagnostiquer
        if (error.code === "23503" && deleteAttempts < maxAttempts) {
          console.log(`🔍 Re-diagnostic après échec de contrainte...`);

          const reDiagnosis = await diagnoseAllConstraints(callId);
          if (reDiagnosis.constraints.length > 0) {
            console.log(
              `🚨 Nouvelles contraintes détectées:`,
              reDiagnosis.constraints
            );

            const reAggressiveResult = await removeAllConstraintsAggressively(
              callId,
              reDiagnosis.tables
            );
            if (reAggressiveResult.removedConstraints.length > 0) {
              deletedResources.push(...reAggressiveResult.removedConstraints);
              console.log(
                `✅ Suppression supplémentaire:`,
                reAggressiveResult.removedConstraints
              );
            }
          }
        }

        if (deleteAttempts < maxAttempts) {
          // Attendre un peu avant de réessayer
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (deleteCallError) {
      console.error(
        "❌ Erreur suppression call après toutes les tentatives:",
        deleteCallError
      );

      // ✅ Gestion spécifique des contraintes de clé étrangère
      if (deleteCallError.code === "23503") {
        return {
          success: false,
          message:
            "Impossible de supprimer l'appel : contraintes restantes détectées",
          error: `Contrainte de clé étrangère : ${
            deleteCallError.details || "Relations existantes non supprimées"
          }`,
          debugInfo: {
            errorCode: deleteCallError.code,
            hint: deleteCallError.hint,
            details: deleteCallError.details,
            allDetectedConstraints: diagnosis?.constraints || [],
            detectedTables: diagnosis?.tables || {},
            removedConstraints: aggressiveResult?.removedConstraints || [],
            constraintErrors: aggressiveResult?.errors || [],
            suggestion:
              "La table 'entreprise_call' ou d'autres tables non détectées référencent encore cet appel",
          },
        };
      }

      return {
        success: false,
        message: "Erreur lors de la suppression de l'appel principal",
        error: deleteCallError.message,
        debugInfo: {
          allDetectedConstraints: diagnosis?.constraints || [],
          detectedTables: diagnosis?.tables || {},
          removedConstraints: aggressiveResult?.removedConstraints || [],
          constraintErrors: aggressiveResult?.errors || [],
        },
      };
    }

    deletedResources.push("appel principal");

    return {
      success: true,
      message: `Appel ${callId} supprimé avec succès`,
      details: {
        deletedResources,
        keptResources,
        convertedCall: false,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la suppression",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      debugInfo: {
        allDetectedConstraints: diagnosis?.constraints || [],
        detectedTables: diagnosis?.tables || {},
        removedConstraints: aggressiveResult?.removedConstraints || [],
        constraintErrors: aggressiveResult?.errors || [],
      },
    };
  }
}

/**
 * ✅ FONCTION AUXILIAIRE - Supprime le fichier audio
 */
async function deleteAudioFile(callId: string): Promise<DeleteResult> {
  try {
    const { data: callData } = await supabase
      .from("call")
      .select("filepath")
      .eq("callid", callId)
      .single();

    if (!callData?.filepath) {
      return {
        success: true,
        message: "Aucun fichier audio à supprimer",
      };
    }

    const { error: storageError } = await supabase.storage
      .from("audio-calls")
      .remove([callData.filepath]);

    if (storageError) {
      console.warn("⚠️ Erreur suppression storage:", storageError);
      return {
        success: false,
        message: "Erreur lors de la suppression du fichier audio",
        error: storageError.message,
      };
    }

    return {
      success: true,
      message: "Fichier audio supprimé",
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la suppression audio",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * ✅ FONCTION AUXILIAIRE - Supprime les données de transcription
 */
async function deleteTranscriptionData(callId: string): Promise<DeleteResult> {
  try {
    const { data: transcriptData } = await supabase
      .from("transcript")
      .select("transcriptid")
      .eq("callid", callId)
      .single();

    if (!transcriptData) {
      return {
        success: true,
        message: "Aucune transcription à supprimer",
      };
    }

    // Supprimer les mots
    const { error: wordsError } = await supabase
      .from("word")
      .delete()
      .eq("transcriptid", transcriptData.transcriptid);

    if (wordsError) {
      return {
        success: false,
        message: "Erreur lors de la suppression des mots",
        error: wordsError.message,
      };
    }

    // Supprimer la transcription
    const { error: transcriptError } = await supabase
      .from("transcript")
      .delete()
      .eq("callid", callId);

    if (transcriptError) {
      return {
        success: false,
        message: "Erreur lors de la suppression de la transcription",
        error: transcriptError.message,
      };
    }

    return {
      success: true,
      message: "Données de transcription supprimées",
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la suppression transcription",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * ✅ FONCTION AUXILIAIRE - Supprime les données de tagging
 */
async function deleteTaggingData(callId: string): Promise<DeleteResult> {
  try {
    const { error: turntaggedError } = await supabase
      .from("turntagged")
      .delete()
      .eq("call_id", callId);

    if (turntaggedError) {
      return {
        success: false,
        message: "Erreur lors de la suppression des données de tagging",
        error: turntaggedError.message,
      };
    }

    return {
      success: true,
      message: "Données de tagging supprimées",
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la suppression tagging",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * ✅ FONCTION UTILITAIRE - Vérifie si un appel peut être supprimé
 */
export async function canDeleteCall(callId: string): Promise<{
  canDelete: boolean;
  reasons: string[];
  willBeConverted: boolean;
}> {
  try {
    const preview = await getDeletePreview(callId);

    if (!preview.callExists) {
      return {
        canDelete: false,
        reasons: ["L'appel n'existe pas"],
        willBeConverted: false,
      };
    }

    const reasons: string[] = [];

    if (preview.willBeConverted) {
      reasons.push("L'appel sera converti (contraintes détectées)");
      return {
        canDelete: true, // Peut être "supprimé" (converti)
        reasons,
        willBeConverted: true,
      };
    }

    return {
      canDelete: true,
      reasons: [],
      willBeConverted: false,
    };
  } catch (error) {
    return {
      canDelete: false,
      reasons: ["Erreur lors de la vérification"],
      willBeConverted: false,
    };
  }
}
