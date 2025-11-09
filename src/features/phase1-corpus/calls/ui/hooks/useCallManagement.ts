// src/components/calls/ui/hooks/useCallManagement.ts

import { useState, useCallback, useMemo } from "react";
import { createServices } from "../../infrastructure/ServiceFactory";
import { Call } from "../../domain/entities/Call";
import { CallStatus } from "../../shared/types/CallStatus";

/**
 * Hook UI pour la gestion avancée des appels
 * Intègre les services DDD avec l'interface utilisateur
 */
export const useCallManagement = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());

  // Services DDD
  const services = useMemo(() => createServices(), []);

  /**
   * Charge tous les appels
   */
  const loadCalls = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedCalls = await services.callService.getAllCalls();
      setCalls(loadedCalls);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur de chargement";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [services.callService]);

  /**
   * Met à jour l'origine d'un appel
   */
  const updateCallOrigin = useCallback(
    async (callId: string, newOrigin: string): Promise<boolean> => {
      try {
        await services.callService.updateCallOrigin(callId, newOrigin);

        // Mise à jour optimiste de l'état local
        setCalls((prevCalls) =>
          prevCalls.map((call) =>
            call.id === callId ? call.withOrigin(newOrigin) : call
          )
        );

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur de mise à jour";
        setError(errorMessage);
        return false;
      }
    },
    [services.callService]
  );

  /**
   * Met à jour le statut d'un appel
   */
  const updateCallStatus = useCallback(
    async (callId: string, newStatus: CallStatus): Promise<boolean> => {
      try {
        await services.callService.updateCallStatus(callId, newStatus);

        // Mise à jour optimiste
        setCalls((prevCalls) =>
          prevCalls.map((call) =>
            call.id === callId ? call.withStatus(newStatus) : call
          )
        );

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur de mise à jour";
        setError(errorMessage);
        return false;
      }
    },
    [services.callService]
  );

  /**
   * Supprime un appel
   */
  const deleteCall = useCallback(
    async (callId: string): Promise<boolean> => {
      try {
        await services.callService.deleteCall(callId);

        // Mise à jour optimiste
        setCalls((prevCalls) => prevCalls.filter((call) => call.id !== callId));

        // Retirer de la sélection si nécessaire
        setSelectedCalls((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(callId);
          return newSelection;
        });

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur de suppression";
        setError(errorMessage);
        return false;
      }
    },
    [services.callService]
  );

  /**
   * Marque un appel comme préparé pour le tagging
   */
  const markAsPrepared = useCallback(
    async (callId: string): Promise<boolean> => {
      try {
        await services.callService.markAsPrepared(callId);

        // Mise à jour optimiste
        setCalls((prevCalls) =>
          prevCalls.map((call) =>
            call.id === callId ? call.withStatus(CallStatus.READY) : call
          )
        );

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur de préparation";
        setError(errorMessage);
        return false;
      }
    },
    [services.callService]
  );

  /**
   * Sélection multiple d'appels
   */
  const toggleCallSelection = useCallback((callId: string) => {
    setSelectedCalls((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(callId)) {
        newSelection.delete(callId);
      } else {
        newSelection.add(callId);
      }
      return newSelection;
    });
  }, []);

  /**
   * Sélectionne tous les appels
   */
  const selectAllCalls = useCallback(() => {
    setSelectedCalls(new Set(calls.map((call) => call.id)));
  }, [calls]);

  /**
   * Désélectionne tous les appels
   */
  const clearSelection = useCallback(() => {
    setSelectedCalls(new Set());
  }, []);

  /**
   * Actions en lot sur les appels sélectionnés
   */
  const bulkUpdateOrigin = useCallback(
    async (newOrigin: string): Promise<BulkResult> => {
      const selectedCallIds = Array.from(selectedCalls);
      const results: BulkOperationResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (const callId of selectedCallIds) {
        try {
          const success = await updateCallOrigin(callId, newOrigin);
          if (success) {
            successCount++;
            results.push({ callId, success: true });
          } else {
            errorCount++;
            results.push({
              callId,
              success: false,
              error: "Échec de mise à jour",
            });
          }
        } catch (error) {
          errorCount++;
          results.push({
            callId,
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }

      return {
        total: selectedCallIds.length,
        successCount,
        errorCount,
        results,
      };
    },
    [selectedCalls, updateCallOrigin]
  );

  /**
   * Suppression en lot
   */
  const bulkDelete = useCallback(async (): Promise<BulkResult> => {
    const selectedCallIds = Array.from(selectedCalls);
    const results: BulkOperationResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const callId of selectedCallIds) {
      try {
        const success = await deleteCall(callId);
        if (success) {
          successCount++;
          results.push({ callId, success: true });
        } else {
          errorCount++;
          results.push({
            callId,
            success: false,
            error: "Échec de suppression",
          });
        }
      } catch (error) {
        errorCount++;
        results.push({
          callId,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    // Vider la sélection après suppression
    setSelectedCalls(new Set());

    return {
      total: selectedCallIds.length,
      successCount,
      errorCount,
      results,
    };
  }, [selectedCalls, deleteCall]);

  /**
   * Statistiques des appels
   */
  const stats = useMemo(() => {
    const total = calls.length;
    const byStatus = calls.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {} as Record<CallStatus, number>);

    const withAudio = calls.filter((call) => call.hasValidAudio()).length;
    const withTranscription = calls.filter((call) =>
      call.hasValidTranscription()
    ).length;
    const readyForTagging = calls.filter((call) =>
      call.isReadyForTagging()
    ).length;

    return {
      total,
      byStatus,
      withAudio,
      withTranscription,
      readyForTagging,
      completeness: total > 0 ? Math.round((readyForTagging / total) * 100) : 0,
    };
  }, [calls]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // État
    calls,
    loading,
    error,
    selectedCalls,
    stats,

    // Actions principales
    loadCalls,
    updateCallOrigin,
    updateCallStatus,
    deleteCall,
    markAsPrepared,

    // Sélection
    toggleCallSelection,
    selectAllCalls,
    clearSelection,

    // Actions en lot
    bulkUpdateOrigin,
    bulkDelete,

    // Utilitaires
    clearError,
    hasSelection: selectedCalls.size > 0,
    selectedCount: selectedCalls.size,
  };
};

// Types pour les opérations en lot
export interface BulkOperationResult {
  callId: string;
  success: boolean;
  error?: string;
}

export interface BulkResult {
  total: number;
  successCount: number;
  errorCount: number;
  results: BulkOperationResult[];
}
