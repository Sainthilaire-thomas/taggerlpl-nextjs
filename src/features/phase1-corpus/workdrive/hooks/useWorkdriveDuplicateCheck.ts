// hooks/useWorkdriveDuplicateCheck.ts - VERSION FINALE SIMPLE
import { useState, useCallback } from "react";
import { ZohoFile } from "../types";

export const useWorkdriveDuplicateCheck = () => {
  const [duplicateStatuses, setDuplicateStatuses] = useState<
    Record<
      string,
      {
        status: "checking" | "duplicate" | "new";
        existingCall?: any;
      }
    >
  >({});

  const checkFileForDuplicate = useCallback(async (file: ZohoFile) => {
    const fileName = file.attributes?.name || file.name;
    if (!fileName) return;

    // Marquer comme en vérification
    setDuplicateStatuses((prev) => ({
      ...prev,
      [fileName]: { status: "checking" },
    }));

    try {
      // Import dynamique de votre fonction existante
      const duplicateManager = await import("../../utils/duplicateManager");
      const result = await duplicateManager.checkForDuplicates(fileName);

      // Mettre à jour le statut
      setDuplicateStatuses((prev) => ({
        ...prev,
        [fileName]: {
          status: result.isDuplicate ? "duplicate" : "new",
          existingCall: result.existingCall,
        },
      }));
    } catch (error) {
      console.warn("Erreur vérification doublon:", error);
      setDuplicateStatuses((prev) => ({
        ...prev,
        [fileName]: { status: "new" },
      }));
    }
  }, []);

  const getFileStatus = useCallback(
    (file: ZohoFile) => {
      const fileName = file.attributes?.name || file.name;
      if (!fileName) return "unknown";
      return duplicateStatuses[fileName]?.status || "unknown";
    },
    [duplicateStatuses]
  );

  const getDuplicateDetails = useCallback(
    (file: ZohoFile) => {
      const fileName = file.attributes?.name || file.name;
      if (!fileName) return null;
      return duplicateStatuses[fileName]?.existingCall || null;
    },
    [duplicateStatuses]
  );

  const clearCache = useCallback(() => {
    setDuplicateStatuses({});
  }, []);

  const cacheStats = {
    entries: Object.keys(duplicateStatuses).length,
    duplicates: Object.values(duplicateStatuses).filter(
      (s) => s.status === "duplicate"
    ).length,
    checking: Object.values(duplicateStatuses).filter(
      (s) => s.status === "checking"
    ).length,
  };

  return {
    checkFileForDuplicate,
    getFileStatus,
    getDuplicateDetails,
    clearCache,
    cacheStats,
  };
};
