import { useCallback, useState } from "react";
// ⬇️ change le chemin si besoin
import supabaseClient from "@/lib/supabaseClient";

/**
 * Préparation d'un appel pour le tagging.
 * Implémentation minimale:
 * - pose un flag "preparedfortranscript" sur la ligne calls (colonne adaptée à ton schéma)
 * - si tu as un workflow plus riche, remplace l'UPDATE par l'appel RPC/Service idoine.
 */
export function useCallPreparation() {
  const [isPreparing, setIsPreparing] = useState(false);

  const prepareCall = useCallback(async (callId: string) => {
    if (!callId) throw new Error("callId requis pour prepareCall");
    setIsPreparing(true);
    try {
      const { error } = await supabaseClient
        .from("calls") // ⬅️ adapte le nom de table si besoin
        .update({ preparedfortranscript: true })
        .eq("callid", callId);

      if (error) throw error;
    } finally {
      setIsPreparing(false);
    }
  }, []);

  return { prepareCall, isPreparing };
}

export type UseCallPreparation = ReturnType<typeof useCallPreparation>;
