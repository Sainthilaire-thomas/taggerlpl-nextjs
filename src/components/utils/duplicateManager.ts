// utils/duplicateManager.ts - Correction finale erreur Supabase
/**
 * Gestion intelligente des doublons d'appels
 * ✅ CORRECTION: Erreur Supabase et détection simplifiée
 */

import supabase from "@/lib/supabaseClient";

interface ExistingCall {
  callid: string;
  filename?: string | null;
  description?: string | null;
  transcription?: any | null;
  upload?: boolean;
  filepath?: string | null;
  audiourl?: string | null;
  preparedfortranscript?: boolean;
  is_tagging_call?: boolean;
  [key: string]: any;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingCall?: ExistingCall;
  canUpgrade?: {
    addAudio: boolean;
    addTranscription: boolean;
    description: string;
  };
  recommendation?: "block" | "upgrade" | "create_new";
}

interface UpgradeOptions {
  addAudio?: boolean;
  addTranscription?: boolean;
  updateDescription?: boolean;
}

/**
 * ✅ CORRECTION: Calcule un hash simple du contenu JSON pour détecter les doublons
 */
const calculateTranscriptionHash = (transcriptionText: string): string => {
  try {
    const parsed = JSON.parse(transcriptionText);
    if (parsed.words && Array.isArray(parsed.words)) {
      // Créer un hash basé sur les premiers et derniers mots + nombre total
      const firstWord = parsed.words[0]?.text || "";
      const lastWord = parsed.words[parsed.words.length - 1]?.text || "";
      const wordCount = parsed.words.length;

      return `${firstWord}_${lastWord}_${wordCount}`
        .toLowerCase()
        .replace(/\s+/g, "_");
    }
  } catch (error) {
    console.error("Erreur parsing transcription pour hash:", error);
    return transcriptionText.slice(0, 50).replace(/\s+/g, "_");
  }
  return "";
};

/**
 * ✅ CORRECTION: Vérifie si un appel avec ce contenu existe déjà
 */
export const checkForDuplicates = async (
  filename?: string,
  description?: string,
  transcriptionText?: string
): Promise<DuplicateCheckResult> => {
  if (!filename && !description && !transcriptionText) {
    return { isDuplicate: false };
  }

  console.log("🔍 Vérification des doublons:", {
    filename,
    hasDescription: !!description,
    hasTranscription: !!transcriptionText,
  });

  try {
    let existingCall: ExistingCall | null = null;

    // ✅ STRATÉGIE 1: Recherche par nom de fichier exact (audio)
    if (filename) {
      console.log("🔍 Recherche par filename:", filename);
      const { data: fileNameMatch, error: fileError } = await supabase
        .from("call")
        .select("*")
        .eq("filename", filename)
        .eq("is_tagging_call", true)
        .single();

      if (fileError && fileError.code !== "PGRST116") {
        console.error("Erreur lors de la recherche par filename:", fileError);
      } else if (fileNameMatch) {
        existingCall = fileNameMatch;
        console.log("✅ Doublon détecté par filename:", filename);
      }
    }

    // ✅ STRATÉGIE 2: Recherche par contenu de transcription (corrigée)
    if (!existingCall && transcriptionText) {
      console.log("🔍 Recherche de doublons par contenu transcription...");

      try {
        // ✅ CORRECTION: Requête Supabase simplifiée sans created_at
        const { data: allCalls, error: callsError } = await supabase
          .from("call")
          .select(
            "callid, description, transcription, upload, filepath, audiourl, preparedfortranscript"
          )
          .eq("is_tagging_call", true)
          .not("transcription", "is", null)
          .limit(50); // Augmenter la limite pour plus de couverture

        if (callsError) {
          console.error(
            "Erreur lors de la recherche par transcription:",
            callsError
          );
        } else if (allCalls && allCalls.length > 0) {
          console.log(
            `🔍 Analyse de ${allCalls.length} appels pour détecter les doublons...`
          );

          // Calculer le hash du nouveau contenu
          const newContentHash = calculateTranscriptionHash(transcriptionText);
          console.log("🔍 Hash nouveau contenu:", newContentHash);

          // Vérifier la similarité avec chaque appel
          for (const call of allCalls) {
            if (call.transcription) {
              try {
                const existingHash = calculateTranscriptionHash(
                  JSON.stringify(call.transcription)
                );
                console.log(
                  `🔍 Comparaison avec appel ${call.callid}, hash: ${existingHash}`
                );

                if (
                  newContentHash &&
                  existingHash === newContentHash &&
                  newContentHash !== ""
                ) {
                  existingCall = call;
                  console.log(
                    "✅ Doublon détecté par hash identique:",
                    call.callid
                  );
                  break;
                }

                // ✅ VÉRIFICATION RENFORCÉE: Comparaison directe des mots
                const newParsed = JSON.parse(transcriptionText);
                const existingWords = call.transcription.words;
                const newWords = newParsed.words;

                if (
                  existingWords &&
                  newWords &&
                  Array.isArray(existingWords) &&
                  Array.isArray(newWords) &&
                  existingWords.length === newWords.length &&
                  existingWords.length > 10
                ) {
                  const sameFirst =
                    existingWords[0]?.text === newWords[0]?.text;
                  const sameLast =
                    existingWords[existingWords.length - 1]?.text ===
                    newWords[newWords.length - 1]?.text;

                  if (sameFirst && sameLast) {
                    // Vérification supplémentaire: quelques mots du milieu
                    const midIndex = Math.floor(existingWords.length / 2);
                    const sameMid =
                      existingWords[midIndex]?.text ===
                      newWords[midIndex]?.text;

                    if (sameMid) {
                      existingCall = call;
                      console.log(
                        "✅ Doublon détecté par contenu identique:",
                        call.callid
                      );
                      break;
                    }
                  }
                }
              } catch (parseError) {
                console.warn(
                  `Erreur parsing pour appel ${call.callid}:`,
                  parseError
                );
                continue;
              }
            }
          }
        }
      } catch (error) {
        console.error("Erreur dans la recherche de transcription:", error);
      }
    }

    // ✅ STRATÉGIE 3: Recherche par description similaire (existant)
    if (!existingCall && description && description.length > 20) {
      console.log("🔍 Recherche par description:", description.slice(0, 30));
      const { data: descriptionMatches, error: descError } = await supabase
        .from("call")
        .select("*")
        .eq("is_tagging_call", true)
        .ilike("description", `%${description.slice(0, 50)}%`)
        .limit(5);

      if (descError) {
        console.error(
          "Erreur lors de la recherche par description:",
          descError
        );
      } else if (descriptionMatches && descriptionMatches.length > 0) {
        existingCall = descriptionMatches[0];
        console.log("✅ Doublon détecté par description similaire");
      }
    }

    if (!existingCall) {
      console.log("✅ Aucun doublon détecté");
      return { isDuplicate: false };
    }

    // Analyser les possibilités d'amélioration
    const canUpgrade = analyzeUpgradePossibilities(
      existingCall,
      filename,
      description,
      transcriptionText
    );

    console.log(
      "🔄 Doublon détecté, recommandation:",
      getRecommendation(existingCall, canUpgrade)
    );

    return {
      isDuplicate: true,
      existingCall,
      canUpgrade,
      recommendation: getRecommendation(existingCall, canUpgrade),
    };
  } catch (error) {
    console.error(
      "Erreur générale lors de la vérification des doublons:",
      error
    );
    return { isDuplicate: false };
  }
};

/**
 * ✅ AMÉLIORATION: Analyse les possibilités d'amélioration d'un appel existant
 */
const analyzeUpgradePossibilities = (
  existingCall: ExistingCall,
  newFilename?: string,
  newDescription?: string,
  newTranscriptionText?: string
): {
  addAudio: boolean;
  addTranscription: boolean;
  description: string;
} => {
  const canAddAudio = Boolean(
    !existingCall.upload && !existingCall.filepath && newFilename
  );

  const canAddTranscription = Boolean(
    !existingCall.transcription && newTranscriptionText
  );

  const improvements = [];
  if (canAddAudio) improvements.push("audio manquant");
  if (canAddTranscription) improvements.push("transcription manquante");

  return {
    addAudio: canAddAudio,
    addTranscription: canAddTranscription,
    description:
      improvements.length > 0
        ? `Peut ajouter: ${improvements.join(", ")}`
        : "Contenu identique ou très similaire détecté",
  };
};

/**
 * Détermine la recommandation d'action
 */
const getRecommendation = (
  existingCall: ExistingCall,
  canUpgrade?: {
    addAudio: boolean;
    addTranscription: boolean;
    description: string;
  }
): "block" | "upgrade" | "create_new" => {
  if (!canUpgrade) return "block";

  // Si on peut améliorer l'appel existant
  if (canUpgrade.addAudio || canUpgrade.addTranscription) {
    return "upgrade";
  }

  // ✅ Si contenu identique, recommander de bloquer par défaut
  if (canUpgrade.description.includes("identique")) {
    return "block";
  }

  // Si l'appel existant est complet, proposer création d'un nouveau
  if (existingCall.upload && existingCall.transcription) {
    return "create_new";
  }

  return "block";
};

/**
 * Met à niveau un appel existant avec de nouvelles données
 */
export const upgradeExistingCall = async (
  callid: string,
  audioFile?: File | null,
  transcriptionData?: any,
  options: UpgradeOptions = {}
): Promise<boolean> => {
  try {
    const updateData: Partial<ExistingCall> = {};

    // Mise à jour audio si fourni
    if (options.addAudio && audioFile) {
      const { uploadAudio } = await import("./callApiUtils");
      const { generateSignedUrl } = await import("./signedUrls");

      const filePath = await uploadAudio(audioFile);
      const audioUrl = await generateSignedUrl(filePath, 60);

      updateData.filename = audioFile.name;
      updateData.filepath = filePath;
      updateData.audiourl = audioUrl;
      updateData.upload = true;
    }

    // Mise à jour transcription si fournie
    if (options.addTranscription && transcriptionData) {
      updateData.transcription = transcriptionData;
    }

    // Mise à jour description si demandée
    if (options.updateDescription && audioFile) {
      const timestamp = new Date().toLocaleString("fr-FR");
      updateData.description = `Appel mis à jour - ${audioFile.name} - ${timestamp}`;
    }

    // Appliquer les mises à jour
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("call")
        .update(updateData)
        .eq("callid", callid);

      if (error) {
        console.error("Erreur lors de la mise à jour:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à niveau de l'appel:", error);
    return false;
  }
};

/**
 * Crée un nom de fichier unique en ajoutant un suffixe
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = new Date().getTime();
  const nameParts = originalFilename.split(".");
  const extension = nameParts.pop() || "";
  const baseName = nameParts.join(".");

  return `${baseName}_${timestamp}.${extension}`;
};

/**
 * Génère un message d'information sur le doublon trouvé
 */
export const formatDuplicateMessage = (
  result: DuplicateCheckResult
): string => {
  if (!result.isDuplicate || !result.existingCall) {
    return "";
  }

  const existing = result.existingCall;
  const hasAudio = existing.upload && existing.filepath;
  const hasTranscription = existing.transcription;

  let currentState = "";
  if (hasAudio && hasTranscription) {
    currentState = "🎵📝 Audio + Transcription";
  } else if (hasAudio) {
    currentState = "🎵 Audio seul";
  } else if (hasTranscription) {
    currentState = "📝 Transcription seule";
  } else {
    currentState = "❌ Vide";
  }

  return (
    `Un appel avec un contenu similaire existe déjà: "${
      existing.filename || existing.description
    }"\n` +
    `État actuel: ${currentState}\n` +
    `${result.canUpgrade?.description || ""}`
  );
};

/**
 * Interface pour les dialogs de gestion des doublons
 */
export interface DuplicateDialogData {
  title: string;
  message: string;
  actions: {
    label: string;
    action: "upgrade" | "create_new" | "cancel";
    color?: "primary" | "secondary" | "error";
    variant?: "contained" | "outlined" | "text";
  }[];
}

/**
 * Génère les données pour le dialog de gestion des doublons
 */
export const generateDuplicateDialogData = (
  result: DuplicateCheckResult,
  newFilename?: string
): DuplicateDialogData => {
  if (!result.isDuplicate || !result.existingCall) {
    throw new Error("Aucun doublon détecté");
  }

  const message = formatDuplicateMessage(result);

  const actions: DuplicateDialogData["actions"] = [];

  // Bouton d'amélioration si possible
  if (result.recommendation === "upgrade" && result.canUpgrade) {
    let upgradeLabel = "Améliorer l'appel existant";
    if (result.canUpgrade.addAudio && result.canUpgrade.addTranscription) {
      upgradeLabel = "Ajouter audio + transcription";
    } else if (result.canUpgrade.addAudio) {
      upgradeLabel = "Ajouter l'audio manquant";
    } else if (result.canUpgrade.addTranscription) {
      upgradeLabel = "Ajouter la transcription manquante";
    }

    actions.push({
      label: upgradeLabel,
      action: "upgrade",
      color: "primary",
      variant: "contained",
    });
  }

  // ✅ AMÉLIORATION: Message adapté selon le type de doublon
  if (result.recommendation === "block") {
    actions.push({
      label: "Importer quand même",
      action: "create_new",
      color: "secondary",
      variant: "outlined",
    });
  } else if (result.recommendation === "create_new") {
    actions.push({
      label: "Créer un nouvel appel",
      action: "create_new",
      color: "secondary",
      variant: "outlined",
    });
  }

  // Bouton d'annulation
  actions.push({
    label: "Annuler",
    action: "cancel",
    color: "error",
    variant: "text",
  });

  return {
    title: "🔄 Contenu similaire détecté",
    message,
    actions,
  };
};

/**
 * Statistiques sur les doublons dans la base
 */
export const getDuplicateStats = async (): Promise<{
  totalCalls: number;
  potentialDuplicates: number;
  incompleteApps: number;
}> => {
  try {
    const { data: allCalls, error } = await supabase
      .from("call")
      .select("filename, upload, transcription")
      .eq("is_tagging_call", true);

    if (error) throw error;

    const filenameGroups = new Map<string, number>();
    let incompleteApps = 0;

    allCalls?.forEach((call) => {
      // Compter par nom de fichier
      if (call.filename) {
        filenameGroups.set(
          call.filename,
          (filenameGroups.get(call.filename) || 0) + 1
        );
      }

      // Compter les appels incomplets
      if (!call.upload || !call.transcription) {
        incompleteApps++;
      }
    });

    const potentialDuplicates = Array.from(filenameGroups.values())
      .filter((count) => count > 1)
      .reduce((sum, count) => sum + count - 1, 0);

    return {
      totalCalls: allCalls?.length || 0,
      potentialDuplicates,
      incompleteApps,
    };
  } catch (error) {
    console.error("Erreur lors du calcul des stats de doublons:", error);
    return { totalCalls: 0, potentialDuplicates: 0, incompleteApps: 0 };
  }
};
