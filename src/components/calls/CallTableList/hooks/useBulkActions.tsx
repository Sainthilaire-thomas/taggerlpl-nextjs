// hooks/useBulkActions.ts
import { useState, useCallback } from "react";

export const useBulkActions = () => {
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const selectCall = useCallback((callId: string) => {
    setSelectedCalls((prev) => new Set([...prev, callId]));
  }, []);

  const deselectCall = useCallback((callId: string) => {
    setSelectedCalls((prev) => {
      const next = new Set(prev);
      next.delete(callId);
      return next;
    });
  }, []);

  const toggleCall = useCallback((callId: string) => {
    setSelectedCalls((prev) => {
      const next = new Set(prev);
      if (next.has(callId)) {
        next.delete(callId);
      } else {
        next.add(callId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((callIds: string[]) => {
    setSelectedCalls(new Set(callIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCalls(new Set());
  }, []);

  const processBulkAction = useCallback(
    async <T,>(
      action: (callIds: string[]) => Promise<T>,
      callIds?: string[]
    ): Promise<T> => {
      const idsToProcess = callIds || Array.from(selectedCalls);

      if (idsToProcess.length === 0) {
        throw new Error("Aucun appel sélectionné");
      }

      setIsBulkProcessing(true);

      try {
        const result = await action(idsToProcess);

        // Vider la sélection après succès
        if (!callIds) {
          clearSelection();
        }

        return result;
      } finally {
        setIsBulkProcessing(false);
      }
    },
    [selectedCalls, clearSelection]
  );

  return {
    selectedCalls,
    selectedCount: selectedCalls.size,
    isBulkProcessing,
    setIsBulkProcessing,
    actions: {
      selectCall,
      deselectCall,
      toggleCall,
      selectAll,
      clearSelection,
      processBulkAction,
    },
  };
};
