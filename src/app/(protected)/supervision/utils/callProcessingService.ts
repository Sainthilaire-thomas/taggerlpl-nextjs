import { supabase } from "@/lib/supabaseClient";
import { generateSignedUrl } from "@/components/utils/signedUrls";

export class CallProcessingService {
  private static instance: CallProcessingService;

  public static getInstance(): CallProcessingService {
    if (!CallProcessingService.instance) {
      CallProcessingService.instance = new CallProcessingService();
    }
    return CallProcessingService.instance;
  }

  async updateCallWithResources(
    callId: string,
    audioFile?: File | null,
    transcriptionText?: string | null,
    onProgress?: (message: string) => void
  ) {
    try {
      let filePath: string | null = null;
      let audioUrl: string | null = null;

      // 1. Upload audio si fourni
      if (audioFile) {
        onProgress?.(`📤 Upload du fichier audio ${audioFile.name}...`);

        const fileName = `${Date.now()}.${audioFile.name.split(".").pop()}`;
        const filePathTemp = `audio/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("Calls")
          .upload(filePathTemp, audioFile, {
            contentType: audioFile.type,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Erreur upload: ${uploadError.message}`);
        }

        filePath = filePathTemp;
        audioUrl = await generateSignedUrl(filePath, 60);
      }

      // 2. Parser la transcription si fournie
      let parsedTranscription = null;
      if (transcriptionText) {
        try {
          parsedTranscription = JSON.parse(transcriptionText);
        } catch (err) {
          throw new Error("Format de transcription JSON invalide");
        }
      }

      // 3. Mettre à jour l'appel existant
      const updateData: any = {
        preparedfortranscript: true,
        is_tagging_call: true,
      };

      if (audioFile && filePath) {
        updateData.audiourl = audioUrl;
        updateData.filename = audioFile.name;
        updateData.filepath = filePath;
        updateData.upload = true;
      }

      if (parsedTranscription) {
        updateData.transcription = parsedTranscription;
      }

      onProgress?.(`📝 Mise à jour de l'appel ${callId}...`);
      const { error: updateError } = await supabase
        .from("call")
        .update(updateData)
        .eq("callid", parseInt(callId));

      if (updateError) {
        throw new Error(`Erreur mise à jour call: ${updateError.message}`);
      }

      // 4. Ajouter la transcription dans les tables word si fournie
      if (parsedTranscription) {
        onProgress?.(
          `🔤 Traitement de la transcription pour l'appel ${callId}...`
        );

        const { data: transcriptData, error: transcriptError } = await supabase
          .from("transcript")
          .insert([{ callid: parseInt(callId) }])
          .select("*");

        if (transcriptError || !transcriptData || transcriptData.length === 0) {
          throw new Error(
            `Erreur transcript: ${transcriptError?.message || "Aucune donnée"}`
          );
        }

        const transcriptId = transcriptData[0].transcriptid;

        if (
          parsedTranscription.words &&
          Array.isArray(parsedTranscription.words)
        ) {
          const wordsToInsert = parsedTranscription.words.map((word: any) => ({
            transcriptid: transcriptId,
            startTime: word.startTime || 0,
            endTime: word.endTime || 0,
            text: word.text || word.word || "",
            turn: word.turn || "",
            type: word.type || "",
          }));

          const { error: wordsError } = await supabase
            .from("word")
            .insert(wordsToInsert);

          if (wordsError) {
            throw new Error(`Erreur words: ${wordsError.message}`);
          }
        }
      }

      onProgress?.(`✅ Appel ${callId} mis à jour avec succès !`);
      return { success: true };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      onProgress?.(`❌ Erreur: ${errorMsg}`);
      throw error;
    }
  }
}
