// hooks/useOriginEditOptimized.ts - VERSION DB UNIQUEMENT + OPTION VIDE
import { useState, useCallback, useMemo } from "react";
import { Call } from "../types";

export interface UseOriginEditReturn {
  selectedCalls: Set<string>;
  selectedCount: number;
  hasSelection: boolean;
  isAllSelected: boolean;
  editingCallId?: string;
  isBulkEditing: boolean;
  pendingOrigin: string;
  isProcessing: boolean;
  availableOrigins: string[];
  handleSelectCall: (callId: string, selected: boolean) => void;
  handleSelectAll: () => void;
  handleStartEdit: (callId: string) => void;
  handleSaveEdit: (callId: string, newOrigin: string) => Promise<void>;
  handleCancelEdit: () => void;
  setPendingOrigin: (origin: string) => void;
  handleStartBulkEdit: () => void;
  handleSaveBulkEdit: () => Promise<void>;
  handleCancelBulkEdit: () => void;
  clearSelection?: () => void;
}

export const useOriginEditOptimized = (
  allCalls: Call[],
  updateCall: (callId: string, updates: Partial<Call>) => Promise<void>,
  showMessage: (message: string) => void
): UseOriginEditReturn => {
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());
  const [editingCallId, setEditingCallId] = useState<string | undefined>();
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrigin, setPendingOrigin] = useState("");

  // 🚀 OPTIMISATION: Cache des origines - UNIQUEMENT de la DB + option vide
  const availableOrigins = useMemo(() => {
    console.time("availableOrigins-computation");

    // ✅ NOUVEAU: Extraire les origines existantes en excluant les valeurs "vides"
    const existingOrigins = Array.from(
      new Set(
        allCalls
          .map((call) => call.origine)
          .filter((origine): origine is string => {
            return (
              typeof origine === "string" && // ✅ Vérification de type explicite
              origine.trim() !== "" && // ✅ Maintenant TypeScript sait que c'est string
              origine.toLowerCase() !== "inconnue" // ✅ Plus d'erreur
            );
          })
      )
    ).sort();

    // ✅ NOUVEAU: Ajouter l'option "vide" en premier (sera affiché comme "Aucune origine")
    const allOrigins = ["", ...existingOrigins];

    console.timeEnd("availableOrigins-computation");
    console.log(
      `🔄 Origines disponibles: ${allOrigins.length} (${existingOrigins.length} de la DB + option vide)`
    );

    return allOrigins;
  }, [allCalls]);

  const derivedState = useMemo(() => {
    const hasSelection = selectedCalls.size > 0;
    const selectedCount = selectedCalls.size;
    const isAllSelected =
      selectedCalls.size === allCalls.length && allCalls.length > 0;

    return {
      hasSelection,
      selectedCount,
      isAllSelected,
    };
  }, [selectedCalls.size, allCalls.length]);

  const handleSelectCall = useCallback((callId: string, selected: boolean) => {
    console.time(`select-optimized-${callId}`);

    setSelectedCalls((prev) => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(callId);
      } else {
        newSelection.delete(callId);
      }
      return newSelection;
    });

    requestAnimationFrame(() => {
      console.timeEnd(`select-optimized-${callId}`);
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    console.time("select-all-optimized");

    if (derivedState.isAllSelected) {
      setSelectedCalls(new Set());
    } else {
      const allCallIds = new Set(allCalls.map((call) => call.callid));
      setSelectedCalls(allCallIds);
    }

    requestAnimationFrame(() => {
      console.timeEnd("select-all-optimized");
    });
  }, [derivedState.isAllSelected, allCalls]);

  const handleStartEdit = useCallback(
    (callId: string) => {
      setEditingCallId(callId);
      const call = allCalls.find((c) => c.callid === callId);
      setPendingOrigin(call?.origine || "");
    },
    [allCalls]
  );

  const handleSaveEdit = useCallback(
    async (callId: string, newOrigin: string) => {
      // ✅ NOUVEAU: Permettre d'enregistrer une origine vide
      setIsProcessing(true);
      console.time(`save-edit-${callId}`);

      try {
        // ✅ NOUVEAU: Convertir chaîne vide en null pour la DB
        const originValue = newOrigin.trim() === "" ? null : newOrigin.trim();

        await updateCall(callId, { origine: originValue });
        setEditingCallId(undefined);
        setPendingOrigin("");

        const message = originValue
          ? `✅ Origine mise à jour: "${originValue}"`
          : "✅ Origine supprimée (aucune origine)";
        showMessage(message);
      } catch (error) {
        console.error("❌ Erreur lors de la mise à jour:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        showMessage(`❌ Erreur: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
        console.timeEnd(`save-edit-${callId}`);
      }
    },
    [updateCall, showMessage]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCallId(undefined);
    setPendingOrigin("");
  }, []);

  const handleStartBulkEdit = useCallback(() => {
    if (selectedCalls.size === 0) {
      showMessage("❌ Aucun appel sélectionné");
      return;
    }
    setIsBulkEditing(true);
    setPendingOrigin("");
  }, [selectedCalls.size, showMessage]);

  const handleSaveBulkEdit = useCallback(async () => {
    // ✅ NOUVEAU: Permettre de sauvegarder une origine vide en lot
    if (selectedCalls.size === 0) {
      showMessage("❌ Aucun appel sélectionné");
      return;
    }

    setIsProcessing(true);
    console.time("bulk-edit-save-optimized");

    try {
      const selectedCallIds = Array.from(selectedCalls);
      const batchSize = 20;

      // ✅ NOUVEAU: Convertir chaîne vide en null pour la DB
      const originValue =
        pendingOrigin.trim() === "" ? null : pendingOrigin.trim();

      for (let i = 0; i < selectedCallIds.length; i += batchSize) {
        const batch = selectedCallIds.slice(i, i + batchSize);

        await Promise.all(
          batch.map((callId) => updateCall(callId, { origine: originValue }))
        );

        if (i + batchSize < selectedCallIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      // ✅ NOUVEAU: Message adapté selon l'origine
      const message = originValue
        ? `✅ ${selectedCallIds.length} appel(s) mis à jour avec l'origine "${originValue}"`
        : `✅ ${selectedCallIds.length} appel(s) mis à jour (origine supprimée)`;
      showMessage(message);

      setSelectedCalls(new Set());
      setIsBulkEditing(false);
      setPendingOrigin("");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour en lot:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showMessage(`❌ Erreur lors de la mise à jour en lot: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      console.timeEnd("bulk-edit-save-optimized");
    }
  }, [pendingOrigin, selectedCalls, updateCall, showMessage]);

  const handleCancelBulkEdit = useCallback(() => {
    setIsBulkEditing(false);
    setPendingOrigin("");
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCalls(new Set());
    setIsBulkEditing(false);
    setPendingOrigin("");
  }, []);

  return {
    selectedCalls,
    selectedCount: derivedState.selectedCount,
    hasSelection: derivedState.hasSelection,
    isAllSelected: derivedState.isAllSelected,
    editingCallId,
    isBulkEditing,
    pendingOrigin,
    isProcessing,
    availableOrigins,
    handleSelectCall,
    handleSelectAll,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    setPendingOrigin,
    handleStartBulkEdit,
    handleSaveBulkEdit,
    handleCancelBulkEdit,
    clearSelection,
  };
};

export default useOriginEditOptimized;
