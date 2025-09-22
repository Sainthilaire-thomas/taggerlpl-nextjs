// src/components/calls/ui/hooks/actions/useCallFlags.ts
import { useCallback } from "react";

type CallLike = { id: string };

type Props = {
  reload: () => Promise<void> | void;
  updateConflictStatus: (
    id: string,
    status: "conflictuel" | "non_conflictuel" | "non_supervisé"
  ) => Promise<void>;
  updateIsTaggingCall: (id: string, value: boolean) => Promise<void>;
};

export function useCallFlags({
  reload,
  updateConflictStatus,
  updateIsTaggingCall,
}: Props) {
  const setConflictStatus = useCallback(
    async (
      calls: CallLike[],
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
    async (calls: CallLike[], value: boolean) => {
      for (const c of calls) {
        await updateIsTaggingCall(c.id, value);
      }
      await reload();
    },
    [updateIsTaggingCall, reload]
  );

  return { setConflictStatus, setTagging };
}
