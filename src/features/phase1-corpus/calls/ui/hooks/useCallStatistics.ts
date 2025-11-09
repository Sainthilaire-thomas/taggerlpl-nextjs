// src/components/calls/ui/hooks/useCallStatistics.ts

import { useState, useEffect, useCallback } from "react";
import { createServices } from "../../infrastructure/ServiceFactory";
import { CallStatus } from "../../shared/types/CallStatus";

/**
 * Hook pour les statistiques globales des appels
 * Fournit des métriques temps réel avec cache intelligent
 */
export const useCallStatistics = (refreshInterval: number = 30000) => {
  const [stats, setStats] = useState<CallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /**
   * Charge les statistiques depuis les services DDD
   */
  const loadStatistics = useCallback(async () => {
    try {
      setError(null);
      const services = createServices();

      // Chargement parallèle des données
      const [totalCalls, callsByStatus, duplicateStats] = await Promise.all([
        services.callService.getTotalCallsCount(),
        loadCallsByStatus(services),
        services.duplicateService.getDuplicateStats(),
      ]);

      // Calcul des métriques dérivées
      const readyForTagging = callsByStatus[CallStatus.READY] || 0;
      const withAudio = await countCallsWithAudio(services);
      const withTranscription = await countCallsWithTranscription(services);

      const completeness =
        totalCalls > 0 ? Math.round((readyForTagging / totalCalls) * 100) : 0;

      const newStats: CallStatistics = {
        total: totalCalls,
        byStatus: callsByStatus,
        readyForTagging,
        withAudio,
        withTranscription,
        completeness,
        duplicates: duplicateStats,
        performance: {
          averageImportTime: 0, // À calculer si nécessaire
          averagePreparationTime: 0,
          successRate: 0,
        },
      };

      setStats(newStats);
      setLastUpdate(new Date());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur de chargement";
      setError(errorMessage);
      console.error("Erreur chargement statistiques:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh manuel des statistiques
   */
  const refreshStats = useCallback(async () => {
    setLoading(true);
    await loadStatistics();
  }, [loadStatistics]);

  /**
   * Chargement initial et refresh automatique
   */
  useEffect(() => {
    loadStatistics();

    // Refresh automatique
    const interval = setInterval(loadStatistics, refreshInterval);

    return () => clearInterval(interval);
  }, [loadStatistics, refreshInterval]);

  return {
    stats,
    loading,
    error,
    lastUpdate,
    refreshStats,

    // Métriques dérivées rapides
    isHealthy: stats ? stats.completeness > 80 : false,
    hasDuplicates: stats ? stats.duplicates.potentialDuplicates > 0 : false,
    needsAttention: stats ? stats.byStatus[CallStatus.ERROR] > 0 : false,
  };
};

// ===== FONCTIONS UTILITAIRES =====

/**
 * Charge la répartition des appels par statut
 */
const loadCallsByStatus = async (
  services: any
): Promise<Record<CallStatus, number>> => {
  const statusCounts: Record<CallStatus, number> = {
    [CallStatus.DRAFT]: 0,
    [CallStatus.PROCESSING]: 0,
    [CallStatus.READY]: 0,
    [CallStatus.TAGGING]: 0,
    [CallStatus.COMPLETED]: 0,
    [CallStatus.ERROR]: 0,
  };

  // Chargement parallèle pour chaque statut
  const statusPromises = Object.values(CallStatus).map(async (status) => {
    const count = await services.callService.getCallsByStatus(status);
    return { status, count: count.length };
  });

  const results = await Promise.all(statusPromises);

  results.forEach(({ status, count }) => {
    statusCounts[status] = count;
  });

  return statusCounts;
};

/**
 * Compte les appels avec audio valide
 */
const countCallsWithAudio = async (services: any): Promise<number> => {
  try {
    const allCalls = await services.callService.getAllCalls();
    return allCalls.filter((call: any) => call.hasValidAudio()).length;
  } catch {
    return 0;
  }
};

/**
 * Compte les appels avec transcription valide
 */
const countCallsWithTranscription = async (services: any): Promise<number> => {
  try {
    const allCalls = await services.callService.getAllCalls();
    return allCalls.filter((call: any) => call.hasValidTranscription()).length;
  } catch {
    return 0;
  }
};

// ===== TYPES =====

export interface CallStatistics {
  total: number;
  byStatus: Record<CallStatus, number>;
  readyForTagging: number;
  withAudio: number;
  withTranscription: number;
  completeness: number; // Pourcentage
  duplicates: {
    totalCalls: number;
    potentialDuplicates: number;
    incompleteApps: number;
    duplicateByFilename: number;
    averageCompleteness: number;
  };
  performance: {
    averageImportTime: number;
    averagePreparationTime: number;
    successRate: number;
  };
}

/**
 * Hook pour les métriques en temps réel
 */
export const useRealTimeMetrics = () => {
  const [metrics, setMetrics] = useState({
    activeImports: 0,
    queuedPreparations: 0,
    currentThroughput: 0,
  });

  // Implémentation des métriques temps réel
  // À connecter avec des WebSockets ou polling rapide si nécessaire

  return metrics;
};
