// src/components/calls/ui/hooks/useUnifiedCallManagement.ts

import { useState, useCallback, useEffect, useMemo } from "react";
import { createServices } from "../../infrastructure/ServiceFactory";
import { Call } from "../../domain/entities/Call";
import { CallStatus } from "../../shared/types/CallStatus";
import {
  CallExtended,
  CallLifecycleService,
  TaggingWorkflowStage,
} from "../../domain";

export interface CallManagementFilters {
  searchKeyword: string;
  conflictStatus: "all" | "conflictuel" | "non_conflictuel" | "non_supervisé";
  origin: string;
  hasAudio: boolean | "all";
  hasTranscription: boolean | "all";
  preparationStatus: "all" | "prepared" | "not_prepared";
  taggingStatus: "all" | "active" | "inactive";
}

export interface CallManagementStats {
  total: number;
  withAudio: number;
  withTranscription: number;
  readyForTagging: number;
  conflictuels: number;
  nonConflictuels: number;
  nonSupervises: number;
  completeness: number;
  filteredCount: number;
  selectedCount: number;
}

export type Filters = {
  searchKeyword: string;
  conflictStatus: "all" | "conflictuel" | "non_conflictuel" | "non_supervisé";
  origin: string;
};

/**
 * Hook unifié pour la gestion des appels avec architecture DDD
 *
 * Fournit :
 * - Chargement et filtrage des appels
 * - Statistiques en temps réel
 * - Gestion de la sélection
 * - Actions en lot
 * - Intégration avec les services DDD
 * - Support du cycle de vie CallExtended
 */
export const useUnifiedCallManagement = () => {
  // État principal
  const [calls, setCalls] = useState<CallExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());

  // Filtres
  const [filters, setFilters] = useState<CallManagementFilters>({
    searchKeyword: "",
    conflictStatus: "all",
    origin: "all",
    hasAudio: "all",
    hasTranscription: "all",
    preparationStatus: "all",
    taggingStatus: "all",
  });

  // Services DDD
  const services = useMemo(() => createServices(), []);
  const { callRepository } = services;

  // ============================================================================
  // 🚀 NOUVELLES FONCTIONNALITÉS POUR LE CYCLE DE VIE
  // ============================================================================

  // Créer une instance du service de cycle de vie
  const lifecycleService = useMemo(() => {
    // Vérifier si callRepository est disponible
    if (!callRepository) {
      return null;
    }

    // TODO: Ajouter transformationService quand il sera disponible
    // const transformationService = getTransformationService();

    return new CallLifecycleService(
      callRepository,
      undefined // transformationService sera ajouté plus tard
    );
  }, [callRepository]);

  /**
   * Convertit les appels classiques en CallExtended avec workflow enrichi
   * Utile pour la transition progressive vers CallExtended
   */
  const enrichCallsWithWorkflow = useCallback(
    async (calls: Call[]): Promise<CallExtended[]> => {
      if (!lifecycleService) {
        console.warn(
          "LifecycleService non disponible pour enrichir les appels"
        );
        return [];
      }

      try {
        const callIds = calls.map((call) => call.id);
        return await lifecycleService.getCallsWithWorkflow(callIds);
      } catch (error) {
        console.error("Erreur lors de l'enrichissement des appels:", error);
        return [];
      }
    },
    [lifecycleService]
  );

  /**
   * Obtient un appel spécifique avec son workflow complet
   */
  const getCallWithWorkflow = useCallback(
    async (callId: string): Promise<CallExtended | null> => {
      if (!lifecycleService) {
        console.warn("LifecycleService non disponible");
        return null;
      }

      try {
        return await lifecycleService.getCallWithWorkflow(callId);
      } catch (error) {
        console.error(
          `Erreur lors de la récupération de l'appel ${callId}:`,
          error
        );
        return null;
      }
    },
    [lifecycleService]
  );

  /**
   * Fait progresser un appel vers l'étape suivante de son cycle de vie
   */
  const progressCall = useCallback(
    async (callId: string) => {
      if (!lifecycleService) {
        console.warn(
          "LifecycleService non disponible pour faire progresser l'appel"
        );
        return { success: false, message: "Service non disponible" };
      }

      try {
        const result = await lifecycleService.progressCall(callId);

        if (result.success) {
          // Rafraîchir la liste des appels après modification
          await loadCalls();
        }

        return result;
      } catch (error) {
        console.error(
          `Erreur lors de la progression de l'appel ${callId}:`,
          error
        );
        return {
          success: false,
          message: error instanceof Error ? error.message : "Erreur inconnue",
        };
      }
    },
    [lifecycleService] // CORRECTION : loadCalls sera défini plus tard
  );

  /**
   * Actions spécifiques du workflow
   */
  const workflowActions = useMemo(
    () => ({
      /**
       * Prépare un appel pour le tagging
       */
      prepare: async (call: CallExtended) => {
        if (!lifecycleService) {
          return { success: false, message: "Service non disponible" };
        }

        try {
          const result = await lifecycleService.prepareCall(call);
          if (result.success) {
            await loadCalls(); // Rafraîchir
          }
          return result;
        } catch (error) {
          console.error("Erreur lors de la préparation:", error);
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Erreur de préparation",
          };
        }
      },

      /**
       * Sélectionne un appel pour le tagging
       */
      select: async (call: CallExtended) => {
        if (!lifecycleService) {
          return { success: false, message: "Service non disponible" };
        }

        try {
          const result = await lifecycleService.selectCall(call);
          if (result.success) {
            await loadCalls(); // Rafraîchir
          }
          return result;
        } catch (error) {
          console.error("Erreur lors de la sélection:", error);
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Erreur de sélection",
          };
        }
      },

      /**
       * Désélectionne un appel
       */
      unselect: async (call: CallExtended) => {
        if (!lifecycleService) {
          return { success: false, message: "Service non disponible" };
        }

        try {
          const result = await lifecycleService.unselectCall(call);
          if (result.success) {
            await loadCalls(); // Rafraîchir
          }
          return result;
        } catch (error) {
          console.error("Erreur lors de la désélection:", error);
          return {
            success: false,
            message:
              error instanceof Error ? error.message : "Erreur de désélection",
          };
        }
      },

      /**
       * Obtient les statistiques du cycle de vie pour un ensemble d'appels
       */
      getStats: async (callIds: string[]) => {
        if (!lifecycleService) {
          return null;
        }

        try {
          return await lifecycleService.getLifecycleStats(callIds);
        } catch (error) {
          console.error("Erreur lors du calcul des statistiques:", error);
          return null;
        }
      },

      /**
       * Filtre les appels par étape du cycle de vie
       */
      getCallsByStage: async (
        stage: TaggingWorkflowStage,
        callIds?: string[]
      ) => {
        if (!lifecycleService) {
          return [];
        }

        try {
          return await lifecycleService.getCallsByStage(stage, callIds);
        } catch (error) {
          console.error("Erreur lors du filtrage par étape:", error);
          return [];
        }
      },

      /**
       * Valide une action en lot avant exécution
       */
      validateBulkAction: async (
        calls: CallExtended[],
        action: "prepare" | "select" | "unselect"
      ) => {
        if (!lifecycleService) {
          return { valid: [], invalid: [] };
        }

        try {
          return await lifecycleService.validateBulkAction(calls, action);
        } catch (error) {
          console.error("Erreur lors de la validation d'action en lot:", error);
          return { valid: [], invalid: [] };
        }
      },
    }),
    [lifecycleService] // CORRECTION : loadCalls sera ajouté via useCallback
  );

  // ============================================================================
  // 🔄 FONCTIONS PRINCIPALES (CORRIGÉES)
  // ============================================================================

  // CORRECTION pour useUnifiedCallManagement.ts - Version optimisée

  /**
   * Chargement des appels avec gestion d'erreur robuste - VERSION CORRIGÉE
   */
  /**
   * Chargement des appels avec gestion d'erreur robuste - VERSION FINALE
   */
  /**
   * Chargement des appels avec gestion d'erreur robuste - VERSION FINALE CORRIGÉE
   */
  const loadCalls = useCallback(async () => {
    console.log(
      "🔍 [DEBUG] callRepository methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(callRepository))
    );
    console.log(
      "🔍 [DEBUG] Has getAllCallIds:",
      typeof callRepository.getAllCallIds
    );
    console.log(
      "🔍 [DEBUG] Has findManyWithWorkflowOptimized:",
      typeof callRepository.findManyWithWorkflowOptimized
    );
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 [useUnifiedCallManagement] Chargement des appels...");

      // Étape 1 : Récupérer tous les IDs (très rapide)
      const ids = await callRepository.getAllCallIds();
      console.log(`📦 IDs récupérés: ${ids.length}`);

      // Étape 2 : Enrichir TOUS les appels EN LOT avec la méthode optimisée
      const enrichedCalls = await callRepository.findManyWithWorkflowOptimized(
        ids
      );

      console.log(
        `✅ [useUnifiedCallManagement] Appels enrichis: ${enrichedCalls.length}`
      );

      // Validation des données chargées
      const validCalls = enrichedCalls.filter((call): call is CallExtended => {
        return call && typeof call.id === "string" && call.id.length > 0;
      });

      console.log(
        `📊 [useUnifiedCallManagement] Appels valides: ${validCalls.length}`
      );

      setCalls(validCalls);

      // Debug spécifique pour l'appel 741
      const call741 = validCalls.find((call) => call.id === "741");
      if (call741) {
        console.log("🎯 DEBUG Call 741 dans loadCalls:", {
          id: call741.id,
          type: call741.constructor.name,
          isTagged: call741.isTagged,
          preparedForTranscript: call741.preparedForTranscript,
          isTaggingCall: call741.isTaggingCall,
          lifecycleStage: call741.getLifecycleStatus().overallStage,
        });
      }

      if (validCalls.length === 0) {
        console.warn("⚠️ [useUnifiedCallManagement] Aucun appel trouvé");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur de chargement";
      console.error("❌ [useUnifiedCallManagement] Erreur:", error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [callRepository]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  // CORRECTION : Ajouter loadCalls aux dépendances des actions workflow
  // useEffect(() => {
  //   // Mettre à jour les références aux fonctions qui dépendent de loadCalls
  //   workflowActions.prepare = async (call: CallExtended) => {
  //     if (!lifecycleService) {
  //       return { success: false, message: "Service non disponible" };
  //     }

  //     try {
  //       const result = await lifecycleService.prepareCall(call);
  //       if (result.success) {
  //         await loadCalls();
  //       }
  //       return result;
  //     } catch (error) {
  //       console.error("Erreur lors de la préparation:", error);
  //       return {
  //         success: false,
  //         message:
  //           error instanceof Error ? error.message : "Erreur de préparation",
  //       };
  //     }
  //   };

  //   workflowActions.select = async (call: CallExtended) => {
  //     if (!lifecycleService) {
  //       return { success: false, message: "Service non disponible" };
  //     }

  //     try {
  //       const result = await lifecycleService.selectCall(call);
  //       if (result.success) {
  //         await loadCalls();
  //       }
  //       return result;
  //     } catch (error) {
  //       console.error("Erreur lors de la sélection:", error);
  //       return {
  //         success: false,
  //         message:
  //           error instanceof Error ? error.message : "Erreur de sélection",
  //       };
  //     }
  //   };

  //   workflowActions.unselect = async (call: CallExtended) => {
  //     if (!lifecycleService) {
  //       return { success: false, message: "Service non disponible" };
  //     }

  //     try {
  //       const result = await lifecycleService.unselectCall(call);
  //       if (result.success) {
  //         await loadCalls();
  //       }
  //       return result;
  //     } catch (error) {
  //       console.error("Erreur lors de la désélection:", error);
  //       return {
  //         success: false,
  //         message:
  //           error instanceof Error ? error.message : "Erreur de désélection",
  //       };
  //     }
  //   };
  // }, [loadCalls, lifecycleService, workflowActions]);

  /**
   * Filtrage intelligent des appels
   */
  const filteredCalls = useMemo(() => {
    let filtered = [...calls];

    console.log("🔍 [useUnifiedCallManagement] Filtrage:", {
      total: calls.length,
      filters,
    });

    // Recherche par mot-clé
    if (filters.searchKeyword.trim()) {
      const keyword = filters.searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (call) =>
          call.filename?.toLowerCase().includes(keyword) ||
          call.description?.toLowerCase().includes(keyword) ||
          call.id.toLowerCase().includes(keyword) ||
          call.origin?.toLowerCase().includes(keyword)
      );
    }

    // Filtre par statut conflictuel (correction pour les types string)
    if (filters.conflictStatus !== "all") {
      filtered = filtered.filter((call) => {
        const status = call.status as string;
        switch (filters.conflictStatus) {
          case "conflictuel":
            return status === "conflictuel";
          case "non_conflictuel":
            return status === "non_conflictuel";
          case "non_supervisé":
            return status === "non_supervisé" || !status || status === "null";
          default:
            return true;
        }
      });
    }

    // Filtre par origine
    if (filters.origin !== "all") {
      filtered = filtered.filter((call) => call.origin === filters.origin);
    }

    // Filtre par audio
    if (filters.hasAudio !== "all") {
      filtered = filtered.filter((call) => {
        const hasAudio = call.hasValidAudio();
        return filters.hasAudio ? hasAudio : !hasAudio;
      });
    }

    // Filtre par transcription
    if (filters.hasTranscription !== "all") {
      filtered = filtered.filter((call) => {
        const hasTranscription = call.hasValidTranscription();
        return filters.hasTranscription ? hasTranscription : !hasTranscription;
      });
    }

    // Filtre par statut de préparation
    if (filters.preparationStatus !== "all") {
      filtered = filtered.filter((call) => {
        const isReady = call.isReadyForTagging();
        return filters.preparationStatus === "prepared" ? isReady : !isReady;
      });
    }

    console.log(
      "✅ [useUnifiedCallManagement] Résultat filtrage:",
      filtered.length
    );
    return filtered;
  }, [calls, filters]);

  /**
   * Groupement par origine
   */
  const callsByOrigin = useMemo(() => {
    const grouped = filteredCalls.reduce((acc, call) => {
      const origin = call.origin || "Aucune origine";
      (acc[origin] ||= []).push(call);
      return acc;
    }, {} as Record<string, CallExtended[]>);

    console.log(
      "📋 [useUnifiedCallManagement] Groupement par origine:",
      Object.keys(grouped)
        .map((origin) => `${origin}: ${grouped[origin].length}`)
        .join(", ")
    );

    return grouped;
  }, [filteredCalls]);

  /**
   * Statistiques en temps réel
   */
  const stats: CallManagementStats = useMemo(() => {
    const total = calls.length;
    const withAudio = calls.filter((c) => c.hasValidAudio()).length;
    const withTranscription = calls.filter((c) =>
      c.hasValidTranscription()
    ).length;
    const readyForTagging = calls.filter((c) => c.isReadyForTagging()).length;

    // Statistiques par statut conflictuel
    const conflictuels = calls.filter(
      (c) => (c.status as string) === "conflictuel"
    ).length;
    const nonConflictuels = calls.filter(
      (c) => (c.status as string) === "non_conflictuel"
    ).length;
    const nonSupervises = calls.filter((c) => {
      const status = c.status as string;
      return status === "non_supervisé" || !status || status === "null";
    }).length;

    const completeness =
      total > 0 ? Math.round((readyForTagging / total) * 100) : 0;
    const filteredCount = filteredCalls.length;
    const selectedCount = selectedCalls.size;

    return {
      total,
      withAudio,
      withTranscription,
      readyForTagging,
      conflictuels,
      nonConflictuels,
      nonSupervises,
      completeness,
      filteredCount,
      selectedCount,
    };
  }, [calls, filteredCalls, selectedCalls]);

  /**
   * Origines uniques pour les filtres
   */
  const uniqueOrigins = useMemo(() => {
    const origins = new Set(
      calls
        .map((call) => call.origin)
        .filter((origin): origin is string => !!origin)
    );
    return Array.from(origins).sort();
  }, [calls]);

  /**
   * Gestion de la sélection
   */
  const toggleSelection = useCallback((callId: string) => {
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

  const selectAll = useCallback(() => {
    setSelectedCalls(new Set(filteredCalls.map((call) => call.id)));
  }, [filteredCalls]);

  const clearSelection = useCallback(() => {
    setSelectedCalls(new Set());
  }, []);

  const selectByOrigin = useCallback(
    (origin: string) => {
      const originCalls = callsByOrigin[origin] || [];
      setSelectedCalls(new Set(originCalls.map((call) => call.id)));
    },
    [callsByOrigin]
  );

  /**
   * Mise à jour des filtres
   */
  const updateFilters = useCallback(
    (newFilters: Partial<CallManagementFilters>) => {
      console.log(
        "🔄 [useUnifiedCallManagement] Mise à jour filtres:",
        newFilters
      );
      setFilters((prev) => ({ ...prev, ...newFilters }));
      // Clear selection when filters change
      setSelectedCalls(new Set());
    },
    []
  );

  const resetFilters = useCallback(() => {
    console.log("🔄 [useUnifiedCallManagement] Reset filtres");
    setFilters({
      searchKeyword: "",
      conflictStatus: "all",
      origin: "all",
      hasAudio: "all",
      hasTranscription: "all",
      preparationStatus: "all",
      taggingStatus: "all",
    });
    setSelectedCalls(new Set());
  }, []);

  /**
   * Objets des appels sélectionnés
   */
  const selectedCallObjects = useMemo(() => {
    return filteredCalls.filter((call) => selectedCalls.has(call.id));
  }, [filteredCalls, selectedCalls]);

  /**
   * Actions de mise à jour des appels
   */
  const updateCall = useCallback(
    async (callId: string, updates: Partial<Call>) => {
      try {
        // Trouver l'appel à mettre à jour
        const callToUpdate = calls.find((c) => c.id === callId);
        if (!callToUpdate) {
          throw new Error(`Call ${callId} not found`);
        }

        // Créer une nouvelle instance avec les modifications
        let updatedCall = callToUpdate;

        if (updates.origin !== undefined) {
          updatedCall = updatedCall.withOrigin(updates.origin);
        }
        if (updates.status !== undefined) {
          updatedCall = updatedCall.withStatus(updates.status);
        }

        // Sauvegarder via le repository
        await callRepository.update(updatedCall);

        // Mise à jour optimiste de l'état local
        setCalls((prevCalls) =>
          prevCalls.map((call) => (call.id === callId ? updatedCall : call))
        );

        console.log("✅ [useUnifiedCallManagement] Call updated:", callId);
      } catch (error) {
        console.error("❌ [useUnifiedCallManagement] Update failed:", error);
        throw error;
      }
    },
    [calls, callRepository] // CORRECTION : utiliser callRepository directement
  );

  const updateConflictStatus = useCallback(
    async (
      id: string,
      status: "conflictuel" | "non_conflictuel" | "non_supervisé"
    ) => {
      try {
        const call = calls.find((c) => c.id === id);
        if (!call) return;

        // Si CallExtended a withStatus, on l'utilise. Sinon fallback "copie" (moins élégant).
        const updated =
          typeof (call as any).withStatus === "function"
            ? (call as any).withStatus(status as any)
            : Object.assign(Object.create(Object.getPrototypeOf(call)), call, {
                status,
              });

        await callRepository.update(updated);
        setCalls((prev) => prev.map((c) => (c.id === id ? updated : c)));
      } catch (e) {
        console.error("[updateConflictStatus] échec:", e);
        throw e;
      }
    },
    [calls, callRepository]
  );

  const updateIsTaggingCall = useCallback(
    async (id: string, value: boolean) => {
      try {
        const call = calls.find((c) => c.id === id);
        if (!call) return;

        const updated =
          typeof (call as any).withTagging === "function"
            ? (call as any).withTagging(value)
            : Object.assign(Object.create(Object.getPrototypeOf(call)), call, {
                isTaggingCall: value,
              });

        await callRepository.update(updated);
        setCalls((prev) => prev.map((c) => (c.id === id ? updated : c)));
      } catch (e) {
        console.error("[updateIsTaggingCall] échec:", e);
        throw e;
      }
    },
    [calls, callRepository]
  );

  /**
   * Actions en lot
   */
  const bulkUpdateOrigin = useCallback(
    async (origin: string) => {
      const results = [];
      for (const call of selectedCallObjects) {
        try {
          await updateCall(call.id, { origin });
          results.push({ callId: call.id, success: true });
        } catch (error) {
          results.push({
            callId: call.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return results;
    },
    [selectedCallObjects, updateCall]
  );

  const bulkUpdateStatus = useCallback(
    async (status: CallStatus) => {
      const results = [];
      for (const call of selectedCallObjects) {
        try {
          await updateCall(call.id, { status });
          results.push({ callId: call.id, success: true });
        } catch (error) {
          results.push({
            callId: call.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return results;
    },
    [selectedCallObjects, updateCall]
  );

  /**
   * Utilitaires de validation
   */
  const hasSelection = selectedCalls.size > 0;
  const canReload = !loading;

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  console.log("📊 [useUnifiedCallManagement] État actuel:", {
    totalCalls: calls.length,
    filteredCalls: filteredCalls.length,
    selectedCalls: selectedCalls.size,
    loading,
    error: error || "none",
    hasSelection,
  });

  // ============================================================================
  // 🎯 RETOUR ENRICHI AVEC CYCLE DE VIE
  // ============================================================================

  return {
    // Données
    calls,
    filteredCalls,
    callsByOrigin,
    selectedCallObjects,
    uniqueOrigins,
    stats,

    // État
    loading,
    error,
    filters,
    selectedCalls,

    // Actions principales
    loadCalls,
    updateCall,
    clearError,

    // Sélection
    toggleSelection,
    selectAll,
    clearSelection,
    selectByOrigin,
    hasSelection,

    // Filtres
    updateFilters,
    resetFilters,

    // Actions en lot
    bulkUpdateOrigin,
    bulkUpdateStatus,

    // Services (pour actions avancées)
    services,
    callRepository, // AJOUT : exposition directe pour compatibilité

    // Utilitaires
    canReload,

    // ============================================================================
    // 🚀 NOUVELLES EXPORTS POUR LE CYCLE DE VIE
    // ============================================================================

    // Service principal
    lifecycleService,

    // Méthodes d'assistance
    enrichCallsWithWorkflow,
    getCallWithWorkflow,
    progressCall,

    // Actions du workflow
    workflowActions,

    // Utilitaires pour la migration progressive
    lifecycle: {
      // Raccourcis vers les actions les plus courantes
      prepare: workflowActions.prepare,
      select: workflowActions.select,
      unselect: workflowActions.unselect,
      getStats: workflowActions.getStats,
      getCallsByStage: workflowActions.getCallsByStage,
      validateBulkAction: workflowActions.validateBulkAction,

      // Méthode pour convertir progressivement vers CallExtended
      enrichCalls: enrichCallsWithWorkflow,

      // Méthode pour obtenir un appel enrichi
      getCall: getCallWithWorkflow,

      // Méthode pour faire progresser automatiquement
      progress: progressCall,
    },
    updateConflictStatus,
    updateIsTaggingCall,
  };
};
