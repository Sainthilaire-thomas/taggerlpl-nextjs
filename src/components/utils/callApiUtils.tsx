// utils/callApiUtils.ts - Version finale CORRIGÉE
import supabase from "@/lib/supabaseClient";
import { generateSignedUrl } from "./signedUrls";
import { insertTranscriptionWords } from "./transcriptionProcessor";
import {
  validateTranscriptionJSON,
  formatValidationError,
} from "./validateTranscriptionJSON";
import {
  checkForDuplicates,
  upgradeExistingCall,
  generateUniqueFilename,
} from "./duplicateManager";

// Define types for the functions
interface Word {
  word: string;
  startTime: number;
  endTime: number;
  speaker: string;
  [key: string]: any;
}

interface TranscriptionData {
  words: Word[];
  [key: string]: any;
}

interface Call {
  callid: string;
  audiourl?: string | null;
  transcription?: TranscriptionData | null;
  [key: string]: any;
}

interface PrepareCallOptions {
  call: Call;
  showMessage?: (message: string) => void;
}

interface HandleCallSubmissionOptions {
  audioFile?: File | null;
  description?: string | null;
  transcriptionText?: string | null;
  workdriveFileName?: string; // ✅ NOUVEAU: Nom du fichier WorkDrive
  showMessage: (message: string) => void;
  onCallUploaded?: (callId: string) => void;
  onDuplicateFound?: (
    duplicateData: any
  ) => Promise<"upgrade" | "create_new" | "cancel">;
}

// ✅ AJOUT: Fonction pour générer un nom de fichier intelligent

const generateFilename = (
  audioFile: File | null,
  parsedTranscription: any,
  workdriveFileName?: string
): string | null => {
  console.log("🔍 generateFilename appelé avec:", {
    audioFile: audioFile?.name,
    workdriveFileName,
    hasTranscription: !!parsedTranscription,
  });

  // 1. Si on a un fichier audio, utiliser son nom
  if (audioFile) {
    console.log("✅ Utilisation nom audioFile:", audioFile.name);
    return audioFile.name;
  }

  // 2. Si on a un nom de fichier WorkDrive, l'utiliser
  if (workdriveFileName) {
    console.log("✅ Utilisation nom WorkDrive:", workdriveFileName);
    return workdriveFileName; // ← Ce devrait être le cas !
  }

  // 3. Si on a seulement une transcription, générer un nom basé sur le contenu
  if (parsedTranscription && parsedTranscription.words) {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    const wordCount = parsedTranscription.words.length;
    const fallbackName = `transcript_${wordCount}words_${timestamp}.json`;
    console.log("⚠️ Fallback généré:", fallbackName);
    return fallbackName;
  }

  // 4. Dernier recours
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  const lastResort = `workdrive_import_${timestamp}.unknown`;
  console.log("❌ Dernier recours:", lastResort);
  return lastResort;
};

/**
 * Uploads an audio file to Supabase storage
 */
export const uploadAudio = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
  const filePath = `audio/${fileName}`;

  const { error } = await supabase.storage
    .from("Calls")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("Erreur lors de l'upload :", error.message);
    throw new Error(error.message);
  }

  return filePath;
};

/**
 * Adds a transcription for a call
 */
export const addTranscription = async (
  callid: string,
  transcriptionText?: TranscriptionData | null
): Promise<string> => {
  const { data: transcriptData, error: transcriptError } = await supabase
    .from("transcript")
    .insert([{ callid }])
    .select("*");

  if (transcriptError || !transcriptData || transcriptData.length === 0) {
    throw new Error(
      "Erreur lors de l'insertion dans 'transcript': " +
        (transcriptError?.message || "Aucune donnée retournée")
    );
  }

  const transcriptId = transcriptData[0].transcriptid;

  if (transcriptionText) {
    await insertTranscriptionWords(transcriptId, transcriptionText, supabase);
  }

  return transcriptId;
};

/**
 * Updates a call's status to mark it as prepared
 */
export const markCallAsPrepared = async (callid: string): Promise<void> => {
  const { error } = await supabase
    .from("call")
    .update({ preparedfortranscript: true })
    .eq("callid", callid);

  if (error) {
    throw new Error(
      "Erreur lors de la mise à jour de 'call': " + error.message
    );
  }
};

/**
 * Prepares a call for tagging by adding transcription and marking it as prepared
 */
export const prepareCallForTagging = async ({
  call,
  showMessage,
}: PrepareCallOptions): Promise<void> => {
  console.log("🔍 prepareCallForTagging - call reçu :", call);

  if (!call || !call.callid) {
    console.error("❌ prepareCallForTagging - call est invalide :", call);
    showMessage?.(
      "Erreur : Impossible de préparer l'appel car il est invalide."
    );
    return;
  }

  try {
    console.log(
      "📄 prepareCallForTagging - Ajout de transcription pour callid :",
      call.callid
    );
    await addTranscription(call.callid, call.transcription);

    if (!call.audiourl) {
      console.warn("⚠️ prepareCallForTagging - Aucun fichier audio associé");
      showMessage?.(
        "Aucun fichier audio associé. Vous pouvez le charger plus tard."
      );
    }

    console.log(
      "📌 prepareCallForTagging - Marquage comme préparé pour callid :",
      call.callid
    );
    await markCallAsPrepared(call.callid);

    showMessage?.("L'appel a été préparé pour le tagging avec succès !");
  } catch (error) {
    console.error(
      "❌ prepareCallForTagging - Erreur :",
      error instanceof Error ? error.message : String(error)
    );
    showMessage?.(
      `Erreur: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
};

/**
 * ✅ CORRECTION COMPLÈTE: Gère les conflits de doublons avec ARRÊT forcé
 */
const handleDuplicateConflict = async (
  duplicateResult: any,
  audioFile: File | null,
  parsedTranscription: any,
  showMessage: (message: string) => void,
  onDuplicateFound?: (
    duplicateData: any
  ) => Promise<"upgrade" | "create_new" | "cancel">
): Promise<{
  action: "upgrade" | "create_new" | "cancel" | "block";
  callId?: string;
}> => {
  console.log(
    "🔍 handleDuplicateConflict - Recommandation:",
    duplicateResult.recommendation
  );
  console.log("🔍 handleDuplicateConflict - Données reçues:", {
    hasAudioFile: !!audioFile,
    hasParsedTranscription: !!parsedTranscription,
    audioFileName: audioFile?.name,
    transcriptionWordCount: parsedTranscription?.words?.length || 0,
  });

  if (!onDuplicateFound) {
    // Mode automatique - Appliquer la recommandation système
    if (duplicateResult.recommendation === "upgrade") {
      console.log("📈 Mode auto: upgrade autorisé");
      return { action: "upgrade" };
    } else if (duplicateResult.recommendation === "create_new") {
      console.log("📝 Mode auto: create_new autorisé");
      return { action: "create_new" };
    } else {
      // Pour "block", on bloque complètement en mode auto
      console.log("🚫 Mode auto: import bloqué (contenu identique)");
      return { action: "block" };
    }
  }

  // ✅ CORRECTION CRITIQUE: Mode interactif avec dialog utilisateur
  console.log("🤝 Mode interactif: ouverture du dialog");

  // ✅ CORRECTION: Préparer les données COMPLÈTES pour le dialog
  const dialogData = {
    ...duplicateResult,
    // ✅ AJOUT: Transmettre les nouvelles données au dialog
    newAudioFile: audioFile,
    newTranscriptionText: parsedTranscription
      ? JSON.stringify(parsedTranscription)
      : null,
    // ✅ AJOUT: Données brutes pour debug
    rawTranscriptionText: parsedTranscription,
    // ✅ AJOUT: Informations supplémentaires
    newImportInfo: {
      hasAudio: !!audioFile,
      hasTranscription: !!parsedTranscription,
      audioFileName: audioFile?.name,
      transcriptionWordCount: parsedTranscription?.words?.length || 0,
    },
  };

  console.log("🔍 Données envoyées au dialog:", {
    hasNewAudioFile: !!dialogData.newAudioFile,
    hasNewTranscriptionText: !!dialogData.newTranscriptionText,
    transcriptionLength: dialogData.newTranscriptionText?.length || 0,
    newImportInfo: dialogData.newImportInfo,
  });

  try {
    const userChoice = await onDuplicateFound(dialogData);
    console.log("✅ Choix utilisateur:", userChoice);
    return { action: userChoice };
  } catch (error) {
    console.error("❌ Erreur dans le dialog utilisateur:", error);
    return { action: "cancel" };
  }
};

/**
 * ✅ CORRECTION MAJEURE: Handles the complete call submission process
 */
export const handleCallSubmission = async ({
  audioFile,
  description,
  transcriptionText,
  workdriveFileName,
  showMessage,
  onCallUploaded,
  onDuplicateFound,
}: HandleCallSubmissionOptions): Promise<void> => {
  let filePath: string | null = null;
  let audioUrl: string | null = null;

  try {
    // ÉTAPE 1: Validation JSON stricte si transcription fournie
    let parsedTranscription = null;
    if (transcriptionText) {
      console.log("🔍 Validation de la transcription JSON...");
      const validationResult = validateTranscriptionJSON(transcriptionText);

      if (!validationResult.isValid) {
        const errorMsg = `Transcription invalide: ${validationResult.error}`;
        console.error("❌ Validation JSON échouée:", errorMsg);
        showMessage(errorMsg);
        throw new Error(errorMsg);
      }

      parsedTranscription = validationResult.data;

      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn(
          "⚠️ Avertissements de validation:",
          validationResult.warnings
        );
        showMessage(
          `Transcription valide avec avertissements: ${validationResult.warnings.join(
            ", "
          )}`
        );
      } else {
        console.log("✅ Validation JSON réussie");
      }
    }

    // ÉTAPE 2: Vérification des doublons
    console.log("🔍 Vérification des doublons...");
    const duplicateCheck = await checkForDuplicates(
      audioFile?.name,
      description || undefined,
      transcriptionText || undefined
    );

    if (duplicateCheck.isDuplicate && duplicateCheck.existingCall) {
      console.log("🔄 Doublon détecté:", duplicateCheck);

      const conflictResolution = await handleDuplicateConflict(
        duplicateCheck,
        audioFile || null,
        parsedTranscription,
        showMessage,
        onDuplicateFound
      );

      console.log("🎯 Résolution du conflit:", conflictResolution.action);

      if (conflictResolution.action === "cancel") {
        console.log("❌ Import annulé par l'utilisateur");
        showMessage("Import annulé par l'utilisateur");
        return; // ✅ ARRÊT
      }

      // ✅ CORRECTION CRITIQUE: Gérer "block" explicitement
      if (conflictResolution.action === "block") {
        console.log("🚫 Import bloqué: contenu identique détecté");
        showMessage(
          "Import bloqué : un appel avec un contenu identique existe déjà"
        );
        return; // ✅ ARRÊT FORCÉ ici - PAS d'insertion !
      }

      if (conflictResolution.action === "upgrade") {
        console.log("📈 Mise à niveau de l'appel existant...");

        const upgradeSuccess = await upgradeExistingCall(
          duplicateCheck.existingCall.callid,
          audioFile || null,
          parsedTranscription,
          {
            addAudio: duplicateCheck.canUpgrade?.addAudio,
            addTranscription: duplicateCheck.canUpgrade?.addTranscription,
            updateDescription: true,
          }
        );

        if (upgradeSuccess) {
          console.log("✅ Upgrade réussi");
          onCallUploaded?.(duplicateCheck.existingCall.callid);
          showMessage("Appel existant mis à niveau avec succès !");
          return; // ✅ ARRÊT (upgrade fait)
        } else {
          throw new Error("Échec de la mise à niveau de l'appel existant");
        }
      }

      // Si 'create_new', continuer avec un nom de fichier unique
      if (conflictResolution.action === "create_new" && audioFile) {
        const uniqueFilename = generateUniqueFilename(audioFile.name);
        console.log(
          `📝 Création d'un nouvel appel avec nom unique: ${uniqueFilename}`
        );
        // On continue avec l'audioFile original
      }
    } else {
      console.log("✅ Aucun doublon détecté, poursuite de l'import");
    }

    // ÉTAPE 3: Upload du fichier audio (si fourni)
    if (audioFile) {
      console.log("📤 Upload du fichier audio...");
      filePath = await uploadAudio(audioFile);
      audioUrl = await generateSignedUrl(filePath, 60);
      console.log("✅ Upload audio réussi:", filePath);
    }

    // ÉTAPE 4: Génération de la description automatique si manquante
    const finalDescription =
      description ||
      generateAutoDescription(audioFile || null, parsedTranscription);

    // ÉTAPE 5: Insertion de l'appel en base
    console.log("💾 Insertion de l'appel en base...");

    // ✅ MODIFICATION: Utiliser generateFilename au lieu de la logique inline
    const finalFilename = generateFilename(
      audioFile || null,
      parsedTranscription,
      workdriveFileName
    );

    const { data: callData, error: callDataError } = await supabase
      .from("call")
      .insert([
        {
          audiourl: audioUrl,
          filename: finalFilename,
          filepath: filePath,
          description: finalDescription,
          transcription: parsedTranscription,
          upload: !!audioFile,
          is_tagging_call: true,
          preparedfortranscript: false,
        },
      ])
      .select("*");

    if (callDataError || !callData || callData.length === 0) {
      throw new Error(
        "Erreur lors de l'insertion dans 'call': " +
          (callDataError?.message || "Aucune donnée retournée")
      );
    }

    const callId = callData[0].callid;
    console.log("✅ Appel créé avec succès, ID:", callId);

    if (onCallUploaded) {
      onCallUploaded(callId);
    }

    // ÉTAPE 6: Message de succès adaptatif
    const successMessage = generateSuccessMessage(
      audioFile || null,
      parsedTranscription,
      duplicateCheck.isDuplicate
    );
    showMessage(successMessage);
  } catch (error) {
    console.error("❌ Erreur dans handleCallSubmission :", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    showMessage(`Erreur: ${errorMessage}`);
    throw error;
  }
};

/**
 * Génère une description automatique
 */
const generateAutoDescription = (
  audioFile: File | null,
  transcriptionData: any
): string => {
  const timestamp = new Date().toLocaleString("fr-FR");
  const parts = [];

  if (audioFile) {
    parts.push(`Audio: ${audioFile.name}`);
  }

  if (transcriptionData) {
    const wordCount = transcriptionData.words?.length || 0;
    parts.push(`Transcription (${wordCount} mots)`);
  }

  const content = parts.length > 0 ? ` [${parts.join(" + ")}]` : "";
  return `Import WorkDrive${content} - ${timestamp}`;
};

/**
 * Génère un message de succès adaptatif
 */
const generateSuccessMessage = (
  audioFile: File | null,
  transcriptionData: any,
  wasDuplicate: boolean
): string => {
  const hasAudio = !!audioFile;
  const hasTranscription = !!transcriptionData;

  let message = wasDuplicate
    ? "Appel mis à jour avec succès"
    : "Appel importé avec succès";

  if (hasAudio && hasTranscription) {
    message += " (audio + transcription)";
  } else if (hasAudio) {
    message += " (audio seulement)";
  } else if (hasTranscription) {
    message += " (transcription seulement)";
  }

  message += ". Utilisez l'onglet 'Préparation' pour l'analyser.";

  return message;
};
