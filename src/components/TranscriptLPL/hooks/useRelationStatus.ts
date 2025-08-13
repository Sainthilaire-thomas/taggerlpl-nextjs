// Créer un fichier hooks/useRelationsStatus.ts
import { useState, useEffect, useCallback } from "react";
import { useTaggingData, RelationsStatus } from "@/context/TaggingDataContext";

export const useRelationsStatus = (callId: string) => {
  const { getRelationsStatus } = useTaggingData();
  const [status, setStatus] = useState<RelationsStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!callId) return;

    setLoading(true);
    setError(null);

    try {
      const newStatus = await getRelationsStatus(callId);
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      console.error("Erreur lors de la vérification du statut:", err);
    } finally {
      setLoading(false);
    }
  }, [callId, getRelationsStatus]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const refresh = useCallback(() => {
    return checkStatus();
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    refresh,
    isCalculated: status?.isCalculated ?? false,
    completeness: status?.completenessPercent ?? 0,
    missingCount: status?.missingRelations ?? 0,
  };
};
