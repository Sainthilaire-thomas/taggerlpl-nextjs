// src/components/calls/ui/hooks/actions/useCallTranscriptionActions.ts
import { useCallback } from "react";
import type { Call } from "../../../domain/entities/Call";
import { useCallImport } from "../../hooks/useCallImport";

interface Props {
  reload: () => Promise<void> | void;
}

export function useCallTranscriptionActions({ reload }: Props) {
  const { importFromFile } = useCallImport();

  // Importe un JSON de transcription (ouvre un file picker côté UI appelant)
  const uploadJSONFor = useCallback(
    async (calls: Call[]) => {
      // ⚠️ Ici, c’est l’UI qui doit fournir le/les fichiers.
      // On garde la signature "calls" pour rester homogène avec tes boutons.
      // TODO: brancher un vrai file picker et appeler importFromFile({ transcriptionText }) si tu veux attacher au call existant.
      console.warn(
        "[uploadJSONFor] TODO: brancher le file picker et mapping vers call(s)"
      );
      await reload();
    },
    [reload]
  );

  // Affiche/édite le JSON — placeholder (à remplacer par ton drawer/modal)
  const viewJSONFor = useCallback(async (_calls: Call[]) => {
    console.warn(
      "[viewJSONFor] TODO: ouvrir le JSON editor (drawer/modal) et sauvegarder via service"
    );
  }, []);

  // Auto-transcribe — placeholder (tu n’as pas donné l’API)
  const autoTranscribe = useCallback(
    async (_calls: Call[]) => {
      console.warn(
        "[autoTranscribe] TODO: brancher ton service d’auto-transcription"
      );
      await reload();
    },
    [reload]
  );

  return { uploadJSONFor, viewJSONFor, autoTranscribe };
}
