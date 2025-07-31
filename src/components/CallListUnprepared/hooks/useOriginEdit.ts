// =================================
// 2. NOUVEAU HOOK - hooks/useOriginEdit.ts
// =================================

import { useState, useCallback, useMemo } from "react";
import { Call } from "../types";

export interface UseOriginEditReturn {
  // État de sélection
  selectedCalls: Set<string>;
  selectedCount: number;
  hasSelection: boolean;
  isAllSelected: boolean;

  // État d'édition
  editingCallId?: string;
  isBulkEditing: boolean;
  pendingOrigin: string;
  isProcessing: boolean;

  // Origines disponibles
  availableOrigins: string[];

  // Actions de sélection
  handleSelectCall: (callId: string, selected: boolean) => void;
  handleSelectAll: (selected: boolean) => void;

  // Actions d'édition par ligne
  handleStartEdit: (callId: string) => void;
  handleSaveEdit: (callId: string, newOrigin: string) => Promise<void>;
  handleCancelEdit: () => void;
  setPendingOrigin: (origin: string) => void;

  // Actions d'édition en lot
  handleStartBulkEdit: () => void;
  handleSaveBulkEdit: (newOrigin: string) => Promise<void>;
  handleCancelBulkEdit: () => void;
}

export const useOriginEdit = (
  calls: Call[],
  onUpdateCall: (callId: string, updates: Partial<Call>) => Promise<void>,
  showMessage: (message: string) => void
): UseOriginEditReturn => {
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());
  const [editingCallId, setEditingCallId] = useState<string | undefined>();
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [pendingOrigin, setPendingOrigin] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Gestion de la sélection
  const handleSelectCall = useCallback((callId: string, selected: boolean) => {
    setSelectedCalls((prev) => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(callId);
      } else {
        newSelection.delete(callId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedCalls(new Set(calls.map((call) => call.callid)));
      } else {
        setSelectedCalls(new Set());
      }
    },
    [calls]
  );

  // ✅ Édition par ligne
  const handleStartEdit = useCallback(
    (callId: string) => {
      setEditingCallId(callId);
      const call = calls.find((c) => c.callid === callId);
      setPendingOrigin(call?.origine || "");
    },
    [calls]
  );

  const handleSaveEdit = useCallback(
    async (callId: string, newOrigin: string) => {
      if (!newOrigin.trim()) {
        showMessage("L'origine ne peut pas être vide");
        return;
      }

      setIsProcessing(true);
      try {
        await onUpdateCall(callId, { origine: newOrigin.trim() });
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
      }
    },
    [onUpdateCall, showMessage]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingCallId(undefined);
    setPendingOrigin("");
  }, []);

  // ✅ Édition en lot
  const handleStartBulkEdit = useCallback(() => {
    if (selectedCalls.size === 0) {
      showMessage("❌ Aucun appel sélectionné");
      return;
    }
    setIsBulkEditing(true);
    setPendingOrigin("");
  }, [selectedCalls.size, showMessage]);

  const handleSaveBulkEdit = useCallback(
    async (newOrigin: string) => {
      if (!newOrigin.trim()) {
        showMessage("❌ L'origine ne peut pas être vide");
        return;
      }

      if (selectedCalls.size === 0) {
        showMessage("❌ Aucun appel sélectionné");
        return;
      }

      setIsProcessing(true);
      console.log(
        "🔄 Mise à jour en lot:",
        Array.from(selectedCalls),
        "→",
        newOrigin
      );

      try {
        const promises = Array.from(selectedCalls).map((callId) =>
          onUpdateCall(callId, { origine: newOrigin.trim() })
        );

        await Promise.all(promises);

        setIsBulkEditing(false);
        setSelectedCalls(new Set());
        setPendingOrigin("");
        showMessage(`✅ ${selectedCalls.size} appel(s) mis à jour avec succès`);
      } catch (error) {
        console.error("❌ Erreur lors de la mise à jour en lot:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        showMessage(`❌ Erreur lors de la mise à jour en lot: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedCalls, onUpdateCall, showMessage]
  );

  const handleCancelBulkEdit = useCallback(() => {
    setIsBulkEditing(false);
    setPendingOrigin("");
  }, []);

  // ✅ Origines disponibles (calculées dynamiquement)
  const availableOrigins = useMemo(() => {
    const existingOrigins = calls
      .map((call) => call.origine)
      .filter((origine): origine is string => Boolean(origine))
      .filter((origine, index, arr) => arr.indexOf(origine) === index)
      .sort();

    // Suggestions courantes + origines existantes
    const suggestions = [
      "Personnel",
      "Professionnel",
      "Partenaire",
      "Support",
      "Commercial",
    ];
    const allOrigins = [...suggestions, ...existingOrigins]
      .filter((origine, index, arr) => arr.indexOf(origine) === index)
      .sort();

    return allOrigins;
  }, [calls]);

  return {
    // État
    selectedCalls,
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

    // Compteurs
    selectedCount: selectedCalls.size,
    hasSelection: selectedCalls.size > 0,
    isAllSelected: selectedCalls.size === calls.length && calls.length > 0,
  };
};
