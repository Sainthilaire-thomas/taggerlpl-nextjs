// hooks/useOriginEditOptimized.ts - VERSION CORRIGÉE COMPATIBLE
import { useState, useCallback, useMemo } from "react";
import { Call } from "../types";

// ✅ CORRECTION: Interface compatible avec vos composants existants
export interface UseOriginEditReturn {
  // État de sélection
  selectedCalls: Set<string>;
  selectedCount: number;
  hasSelection: boolean;
  isAllSelected: boolean;

  // État d'édition - COMPATIBLE avec l'ancien hook
  editingCallId?: string;
  isBulkEditing: boolean;
  pendingOrigin: string;
  isProcessing: boolean;

  // Origines disponibles
  availableOrigins: string[];

  // Actions de sélection
  handleSelectCall: (callId: string, selected: boolean) => void;
  handleSelectAll: () => void;

  // Actions d'édition par ligne - COMPATIBLE avec l'ancien hook
  handleStartEdit: (callId: string) => void;
  handleSaveEdit: (callId: string, newOrigin: string) => Promise<void>;
  handleCancelEdit: () => void;
  setPendingOrigin: (origin: string) => void;

  // Actions d'édition en lot
  handleStartBulkEdit: () => void;
  handleSaveBulkEdit: () => Promise<void>;
  handleCancelBulkEdit: () => void;

  // Actions supplémentaires
  clearSelection?: () => void;
}

export const useOriginEditOptimized = (
  allCalls: Call[],
  updateCall: (callId: string, updates: Partial<Call>) => Promise<void>,
  showMessage: (message: string) => void
): UseOriginEditReturn => {
  // 🚀 OPTIMISATION 1: État local simple et stable
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());
  const [editingCallId, setEditingCallId] = useState<string | undefined>();
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrigin, setPendingOrigin] = useState("");

  // 🚀 OPTIMISATION 2: Cache des origines disponibles
  const availableOrigins = useMemo(() => {
    console.time("availableOrigins-computation");
    const origins = Array.from(
      new Set(
        allCalls
          .map((call) => call.origine)
          .filter((origine): origine is string => Boolean(origine))
      )
    ).sort();

    // Suggestions courantes + origines existantes
    const suggestions = [
      "Personnel",
      "Professionnel",
      "Partenaire",
      "Support",
      "Commercial",
    ];

    const allOrigins = [...suggestions, ...origins]
      .filter((origine, index, arr) => arr.indexOf(origine) === index)
      .sort();

    console.timeEnd("availableOrigins-computation");
    return allOrigins;
  }, [allCalls]);

  // 🚀 OPTIMISATION 3: Calculs dérivés stables
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

  // 🚀 OPTIMISATION 4: Handler de sélection ultra-optimisé
  const handleSelectCall = useCallback(
    (callId: string, selected: boolean) => {
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
    },
    [] // ✅ CORRECTION: Dépendances vides pour stabilité maximale
  );

  // 🚀 OPTIMISATION 5: Select All optimisé
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

  // ✅ NOUVEAU: Actions d'édition par ligne (compatibilité)
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
      if (!newOrigin.trim()) {
        showMessage("L'origine ne peut pas être vide");
        return;
      }

      setIsProcessing(true);
      console.time(`save-edit-${callId}`);

      try {
        await updateCall(callId, { origine: newOrigin.trim() });
        setEditingCallId(undefined);
        setPendingOrigin("");
        showMessage("✅ Origine mise à jour avec succès");
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

  // Actions d'édition en lot optimisées
  const handleStartBulkEdit = useCallback(() => {
    if (selectedCalls.size === 0) {
      showMessage("❌ Aucun appel sélectionné");
      return;
    }
    setIsBulkEditing(true);
    setPendingOrigin("");
  }, [selectedCalls.size, showMessage]);

  const handleSaveBulkEdit = useCallback(async () => {
    if (!pendingOrigin.trim()) {
      showMessage("❌ L'origine ne peut pas être vide");
      return;
    }

    if (selectedCalls.size === 0) {
      showMessage("❌ Aucun appel sélectionné");
      return;
    }

    setIsProcessing(true);
    console.time("bulk-edit-save-optimized");

    try {
      const selectedCallIds = Array.from(selectedCalls);
      const batchSize = 20;

      for (let i = 0; i < selectedCallIds.length; i += batchSize) {
        const batch = selectedCallIds.slice(i, i + batchSize);

        await Promise.all(
          batch.map((callId) =>
            updateCall(callId, { origine: pendingOrigin.trim() })
          )
        );

        if (i + batchSize < selectedCallIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      showMessage(
        `✅ ${selectedCallIds.length} appel(s) mis à jour avec succès`
      );

      // Réinitialisation
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
    // État
    selectedCalls,
    selectedCount: derivedState.selectedCount,
    hasSelection: derivedState.hasSelection,
    isAllSelected: derivedState.isAllSelected,
    editingCallId,
    isBulkEditing,
    pendingOrigin,
    isProcessing,
    availableOrigins,

    // Actions de sélection
    handleSelectCall,
    handleSelectAll,

    // Actions d'édition par ligne
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    setPendingOrigin,

    // Actions d'édition en lot
    handleStartBulkEdit,
    handleSaveBulkEdit,
    handleCancelBulkEdit,

    // Actions supplémentaires
    clearSelection,
  };
};

// Export par défaut
export default useOriginEditOptimized;
