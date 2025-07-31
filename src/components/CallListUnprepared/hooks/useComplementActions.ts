// hooks/useComplementActions.ts
import { useState } from "react";
import { Call, Transcription, Word } from "../types";

interface UseComplementActionsProps {
  showMessage: (message: string) => void;
  updateCall: (callId: string, updates: Partial<Call>) => void;
}

interface UseComplementActionsReturn {
  audioModalOpen: boolean;
  transcriptionModalOpen: boolean;
  complementCall: Call | null;
  handleAddAudio: (call: Call) => void;
  handleAddTranscription: (call: Call) => void;
  handleAudioUpload: (file: File, call?: any) => Promise<void>; // ✅ Type générique
  handleTranscriptionUpload: (
    transcriptionText: string,
    call?: any
  ) => Promise<void>; // ✅ Type générique
  handleCloseModals: () => void;
}

export const useComplementActions = ({
  showMessage,
  updateCall,
}: UseComplementActionsProps): UseComplementActionsReturn => {
  const [audioModalOpen, setAudioModalOpen] = useState<boolean>(false);
  const [transcriptionModalOpen, setTranscriptionModalOpen] =
    useState<boolean>(false);
  const [complementCall, setComplementCall] = useState<Call | null>(null);

  const handleAddAudio = (call: Call) => {
    console.log("🎵 Ouvrir modal audio pour appel:", call.callid);
    setComplementCall(call);
    setAudioModalOpen(true);
  };

  const handleAddTranscription = (call: Call) => {
    console.log("📝 Ouvrir modal transcription pour appel:", call.callid);
    setComplementCall(call);
    setTranscriptionModalOpen(true);
  };

  // ✅ SIMPLIFICATION: Traiter les données comme génériques
  const handleAudioUpload = async (file: File, externalCall?: any) => {
    if (!externalCall) return;

    console.log(
      "✅ Upload audio:",
      file.name,
      "pour appel:",
      externalCall.callid
    );

    try {
      const { uploadAudio } = await import("../../utils/callApiUtils");
      const { generateSignedUrl } = await import("../../utils/signedUrls");
      const { supabase } = await import("@/lib/supabaseClient");

      // Upload fichier
      const filePath = await uploadAudio(file);
      const audioUrl = await generateSignedUrl(filePath, 1200);

      // Mise à jour DB
      const { error: updateError } = await supabase
        .from("call")
        .update({
          audiourl: audioUrl,
          filepath: filePath,
          upload: true,
        })
        .eq("callid", externalCall.callid);

      if (updateError) {
        throw new Error(`Erreur mise à jour call: ${updateError.message}`);
      }

      showMessage(
        `🎵 Audio ${file.name} ajouté avec succès à l'appel ${externalCall.callid} !`
      );

      updateCall(externalCall.callid, {
        audiourl: audioUrl,
        filepath: filePath,
        upload: true,
      });

      handleCloseModals();
    } catch (error) {
      console.error("❌ Erreur upload audio:", error);
      showMessage(
        `❌ Erreur upload audio: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  };

  // Conversion des types de transcription
  const convertValidTranscriptionToOurFormat = (
    validTranscription: any
  ): Transcription => {
    return {
      words: validTranscription.words.map(
        (validWord: any): Word => ({
          text: validWord.word || validWord.text || "",
          turn: validWord.turn || "Inconnu",
          startTime: validWord.startTime || 0,
          endTime: validWord.endTime || 0,
          speaker: validWord.speaker || "Inconnu",
        })
      ),
    };
  };

  const handleTranscriptionUpload = async (
    transcriptionText: string,
    externalCall?: any
  ) => {
    if (!externalCall) return;

    try {
      const { validateTranscriptionJSON } = await import(
        "../../utils/validateTranscriptionJSON"
      );
      const { supabase } = await import("@/lib/supabaseClient");

      const validationResult = validateTranscriptionJSON(transcriptionText);

      if (!validationResult.isValid) {
        throw new Error(`Transcription invalide: ${validationResult.error}`);
      }

      const validTranscription = validationResult.data;
      const convertedTranscription =
        convertValidTranscriptionToOurFormat(validTranscription);

      if (validationResult.warnings && validationResult.warnings.length > 0) {
        showMessage(
          `Transcription valide avec avertissements: ${validationResult.warnings.join(
            ", "
          )}`
        );
      }

      const { error: updateError } = await supabase
        .from("call")
        .update({ transcription: convertedTranscription })
        .eq("callid", externalCall.callid);

      if (updateError) {
        throw new Error(
          `Erreur mise à jour transcription: ${updateError.message}`
        );
      }

      showMessage(
        `📝 Transcription ajoutée avec succès à l'appel ${
          externalCall.callid
        } (${convertedTranscription?.words?.length || 0} mots) !`
      );

      updateCall(externalCall.callid, {
        transcription: convertedTranscription,
      });

      handleCloseModals();
    } catch (error) {
      console.error("❌ Erreur upload transcription:", error);
      showMessage(
        `❌ Erreur upload transcription: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  };

  const handleCloseModals = () => {
    setAudioModalOpen(false);
    setTranscriptionModalOpen(false);
    setComplementCall(null);
  };

  return {
    audioModalOpen,
    transcriptionModalOpen,
    complementCall,
    handleAddAudio,
    handleAddTranscription,
    handleAudioUpload,
    handleTranscriptionUpload,
    handleCloseModals,
  };
};
