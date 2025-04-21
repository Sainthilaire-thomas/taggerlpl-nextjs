import supabase from "@/lib/supabaseClient"; // Importez votre client Supabase ici
import { generateSignedUrl } from "./signedUrls";

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
  showMessage: (message: string) => void;
  onCallUploaded?: (callId: string) => void;
}

/**
 * Uploads an audio file to Supabase storage
 * @param file - The audio file to upload
 * @returns Promise with the file path in storage
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
 * @param callid - The ID of the call
 * @param transcriptionText - The transcription data
 * @returns Promise with the transcript ID
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

  if (transcriptionText?.words) {
    const wordsData = transcriptionText.words.map((word) => ({
      transcriptid: transcriptId,
      ...word,
    }));

    const { error: wordsError } = await supabase.from("word").insert(wordsData);

    if (wordsError) {
      throw new Error(
        "Erreur lors de l'insertion dans 'word': " + wordsError.message
      );
    }
  }

  return transcriptId;
};

/**
 * Updates a call's status to mark it as prepared
 * @param callid - The ID of the call
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
 * @param options - Object containing the call and optional showMessage function
 */
export const prepareCallForTagging = async ({
  call,
  showMessage,
}: PrepareCallOptions): Promise<void> => {
  console.log("🔍 prepareCallForTagging - call reçu :", call);
  console.log("🔍 prepareCallForTagging - showMessage reçu :", showMessage);

  if (!call || !call.callid) {
    console.error("❌ prepareCallForTagging - call est invalide :", call);
    showMessage?.(
      "Erreur : Impossible de préparer l'appel car il est invalide."
    );
    return;
  }

  try {
    // Étape 1 : Ajouter une transcription et des mots
    console.log(
      "📄 prepareCallForTagging - Ajout de transcription pour callid :",
      call.callid
    );
    await addTranscription(call.callid, call.transcription);

    // Étape 2 : Vérifiez si l'audio est associé
    if (!call.audiourl) {
      console.warn("⚠️ prepareCallForTagging - Aucun fichier audio associé");
      showMessage?.(
        "Aucun fichier audio associé. Vous pouvez le charger plus tard."
      );
    }

    // Étape 3 : Marquer l'appel comme préparé
    console.log(
      "📌 prepareCallForTagging - Marquage comme préparé pour callid :",
      call.callid
    );
    await markCallAsPrepared(call.callid);

    // Message de succès
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
 * Handles the complete call submission process
 * @param options - Object containing file, description, transcription, and callback functions
 */
export const handleCallSubmission = async ({
  audioFile,
  description,
  transcriptionText,
  showMessage,
  onCallUploaded,
}: HandleCallSubmissionOptions): Promise<void> => {
  let filePath: string | null = null;
  let audioUrl: string | null = null;

  try {
    // Step 1: Upload the audio file (if provided)
    if (audioFile) {
      filePath = await uploadAudio(audioFile); // Télécharger le fichier audio
      audioUrl = await generateSignedUrl(filePath, 60); // Générer l'URL signée
    }

    // Step 2: Insert the call into the database
    const { data: callData, error: callDataError } = await supabase
      .from("call")
      .insert([
        {
          audiourl: audioUrl,
          filename: audioFile ? audioFile.name : null,
          filepath: filePath,
          description: description || null,
          transcription: transcriptionText
            ? JSON.parse(transcriptionText)
            : null,
          upload: !!audioFile,
          is_tagging_call: true,
          preparedfortranscript: true,
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

    // Step 3: Insert transcription (if provided)
    if (transcriptionText) {
      const { data: transcriptData, error: transcriptError } = await supabase
        .from("transcript")
        .insert([{ callid: callId }])
        .select("*");

      if (transcriptError || !transcriptData || transcriptData.length === 0) {
        throw new Error(
          "Erreur lors de l'insertion dans 'transcript': " +
            (transcriptError?.message || "Aucune donnée retournée")
        );
      }

      const transcriptId = transcriptData[0].transcriptid;

      // Insert words associated with the transcription
      const parsedTranscription = JSON.parse(
        transcriptionText
      ) as TranscriptionData;
      const wordsData = parsedTranscription.words.map((word) => ({
        transcriptid: transcriptId,
        ...word,
      }));

      const { error: wordsError } = await supabase
        .from("word")
        .insert(wordsData);

      if (wordsError) {
        throw new Error(
          "Erreur lors de l'insertion dans 'word': " + wordsError.message
        );
      }
    }

    // Callback for successful upload
    if (onCallUploaded) {
      onCallUploaded(callId);
    }

    // Success message
    showMessage("Appel chargé avec succès !");
  } catch (error) {
    console.error(
      "Erreur dans handleCallSubmission :",
      error instanceof Error ? error.message : String(error)
    );
    showMessage(
      `Erreur: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
};
