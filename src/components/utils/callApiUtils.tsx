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

import { ImportWorkflow } from "@/components/calls/domain/workflows/ImportWorkflow";
import { createServices } from "@/components/calls/infrastructure/ServiceFactory";

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
export const handleCallSubmission = async (options: {
  audioFile?: File | null;
  description?: string;
  transcriptionText?: string;
  workdriveFileName?: string;
  onDuplicateFound?: (d: any) => Promise<"cancel" | "upgrade" | "create_new">;
  onCallUploaded?: (id: string) => void;
  showMessage?: (msg: string, severity?: "success" | "error" | "info") => void;
}) => {
  const services = createServices();
  const workflow = new ImportWorkflow(
    services.callService,
    services.validationService,
    services.duplicateService,
    services.storageService
  );

  const result = await workflow.execute(
    {
      audioFile: options.audioFile,
      description: options.description,
      transcriptionText: options.transcriptionText,
      workdriveFileName: options.workdriveFileName,
    },
    { onDuplicateFound: options.onDuplicateFound }
  );

  if (result.success) {
    options.onCallUploaded?.(result.callId);
    options.showMessage?.(result.message, "success");
  } else if (result.reason !== "cancelled") {
    options.showMessage?.(result.error ?? "Erreur inconnue", "error");
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
