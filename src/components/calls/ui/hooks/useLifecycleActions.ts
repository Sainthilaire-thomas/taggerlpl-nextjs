import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CallExtended } from "../../domain";
import { useCallPreparationActions } from "./actions/useCallPreparationActions";
import { useCallFlags } from "./actions/useCallFlags";

// un "Call-like" minimal pour accepter Call ou CallExtended
type CallLike = Pick<CallExtended, "id">;

type Deps = {
  preparation: ReturnType<typeof useCallPreparationActions>;
  flags: ReturnType<typeof useCallFlags>;
  reload: () => Promise<void> | void;
};

export function useLifecycleActions({ preparation, flags, reload }: Deps) {
  const router = useRouter();

  const handle = useCallback(
    async (
      action: "prepare" | "select" | "unselect" | "tag",
      call: CallLike
    ) => {
      switch (action) {
        case "prepare":
          await preparation.prepareForTagging([call as any]);
          break;
        case "select":
          await flags.setTagging([call as any], true);
          break;
        case "unselect":
          await flags.setTagging([call as any], false);
          break;
        case "tag":
          router.push(`/new-tagging?callId=${call.id}`);
          break;
      }
      await reload();
    },
    [preparation, flags, router, reload]
  );

  return { handle };
}
