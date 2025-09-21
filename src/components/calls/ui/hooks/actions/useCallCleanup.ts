// src/components/calls/ui/hooks/actions/useCallCleanup.ts
import { useCallback } from "react";
import type { Call } from "../../../domain/entities/Call";

interface Props {
  reload: () => Promise<void> | void;
}

export function useCallCleanup({ reload }: Props) {
  // Purge WORD — placeholder (pas d'API fournie)
  const purgeWord = useCallback(
    async (_calls: Call[]) => {
      console.warn(
        "[purgeWord] TODO: brancher CleanupWorkflow.purgeWord(callId) + suppression côté storage/DB"
      );
      await reload();
    },
    [reload]
  );

  // Purge Audio si taggé — placeholder (pas d'API fournie)
  const purgeAudioIfTagged = useCallback(
    async (_calls: Call[]) => {
      console.warn(
        "[purgeAudioIfTagged] TODO: vérifier isTagged + CleanupWorkflow.purgeAudio(callId)"
      );
      await reload();
    },
    [reload]
  );

  return { purgeWord, purgeAudioIfTagged };
}
