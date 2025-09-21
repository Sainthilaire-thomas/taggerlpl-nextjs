// src/components/calls/ui/hooks/actions/useCallFlags.ts
import { useCallback } from "react";
import type { Call } from "../../../domain/entities/Call";
import { useCallManagement } from "../../hooks/useCallManagement";

interface Props {
  reload: () => Promise<void> | void;
}

export function useCallFlags({ reload }: Props) {
  const { updateConflictStatus, updateIsTaggingCall } = useCallManagement();

  const setConflictStatus = useCallback(
    async (
      calls: Call[],
      status: "conflictuel" | "non_conflictuel" | "non_supervisé"
    ) => {
      for (const c of calls) {
        await updateConflictStatus(c.id, status);
      }
      await reload();
    },
    [updateConflictStatus, reload]
  );

  const setTagging = useCallback(
    async (calls: Call[], value: boolean) => {
      for (const c of calls) {
        await updateIsTaggingCall(c.id, value);
      }
      await reload();
    },
    [updateIsTaggingCall, reload]
  );

  return { setConflictStatus, setTagging };
}
