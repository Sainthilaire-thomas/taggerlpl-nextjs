// src/components/calls/ui/hooks/actions/useCallPreparationActions.ts
import { useCallback } from "react";
import type { Call } from "../../../domain/entities/Call";
import { useCallPreparation } from "../../hooks/useCallPreparation";
import { useCallManagement } from "../../hooks/useCallManagement"; // pour markAsPrepared si dispo

interface Props {
  reload: () => Promise<void> | void;
}

export function useCallPreparationActions({ reload }: Props) {
  const { prepareCall } = useCallPreparation();
  const { markAsPrepared } = useCallManagement(); // existe dans ton fichier

  const prepareForTagging = useCallback(
    async (calls: Call[]) => {
      for (const c of calls) {
        await prepareCall(c.id); // JSON -> word + flag côté DB minimal
      }
      await reload();
    },
    [prepareCall, reload]
  );

  const markPrepared = useCallback(
    async (calls: Call[]) => {
      for (const c of calls) {
        await markAsPrepared(c.id); // utilise ton hook existant
      }
      await reload();
    },
    [markAsPrepared, reload]
  );

  return { prepareForTagging, markPrepared };
}
