// src/components/calls/ui/hooks/actions/useCallAudioActions.ts
import { useCallback } from "react";
import type { Call } from "../../../domain/entities/Call";
import { useStorageService } from "../../hooks/useStorageService";

interface Props {
  reload: () => Promise<void> | void;
}

export function useCallAudioActions({ reload }: Props) {
  const { generateSignedUrl } = useStorageService();

  // Upload audio — placeholder (pas d'API dans useStorageService actuel)
  const uploadFilesFor = useCallback(
    async (_calls: Call[]) => {
      console.warn(
        "[uploadFilesFor] TODO: ajouter upload audio (storageService.uploadAudio?) + mise à jour du call"
      );
      await reload();
    },
    [reload]
  );

  // URLs signées pour écouter/télécharger (ex: afficher en snackbar/console)
  const generateSignedLinks = useCallback(
    async (calls: Call[]) => {
      for (const c of calls) {
        // TODO: définir où est stocké le path audio (c.audioPath ? c.audioUrl signé à régénérer ?)
        // Ici, on suppose c.audioPath (à adapter)
        const path = (c as any).audioPath || (c as any).audio_url_path;
        if (!path) {
          console.warn(
            `[generateSignedLinks] Aucun path audio pour call ${c.id}`
          );
          continue;
        }
        const url = await generateSignedUrl(path);
        // affiche/stocke la signed URL (à ta convenance)
        console.log(`Signed URL for ${c.id}:`, url);
      }
    },
    [generateSignedUrl]
  );

  // Validation audio — placeholder
  const validateAudio = useCallback(
    async (_calls: Call[]) => {
      console.warn(
        "[validateAudio] TODO: brancher ta validation (durée/format) et persister l'état"
      );
      await reload();
    },
    [reload]
  );

  return { uploadFilesFor, generateSignedLinks, validateAudio };
}
