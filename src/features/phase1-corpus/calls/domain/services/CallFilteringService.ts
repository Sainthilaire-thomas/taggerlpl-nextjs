// src/components/calls/domain/services/CallFilteringService.ts

import { Call } from "../entities/Call";
import { CallStatus } from "../../shared/types/CallStatus";

// ✅ CORRECTION: Types pour les statuts conflictuels séparés de CallStatus
export type ConflictStatus =
  | "conflictuel"
  | "non_conflictuel"
  | "non_supervisé";

export interface FilterCriteria {
  conflictStatus?: ConflictStatus | "all";
  origin?: string | "all";
  hasAudio?: boolean | "all";
  hasTranscription?: boolean | "all";
  keyword?: string;
  status?: CallStatus;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface GroupedCalls {
  [origin: string]: Call[];
}

export interface OriginStats {
  origin: string;
  total: number;
  conflictuels: number;
  nonConflictuels: number;
  nonSupervises: number;
  withAudio: number;
  withTranscription: number;
  readyForTagging: number;
  averageCompleteness: number;
}

/**
 * Service de filtrage avancé des appels selon l'architecture DDD
 *
 * Responsabilités:
 * - Filtrage par critères multiples (statut, origine, contenu, etc.)
 * - Groupement et statistiques par origine
 * - Recherche textuelle intelligente
 * - Tri et ordering optimisés
 * - Logique métier de préparation des appels
 */
export class CallFilteringService {
  /**
   * ✅ CORRECTION: Filtre pour les appels préparables (CallPreparationPage)
   * Critères corrects: transcription valide ET pas encore préparé
   */
  filterPreparableCalls(calls: Call[]): Call[] {
    return calls.filter((call) => {
      // IMPORTANT: Critères corrects selon documentation DDD
      const hasValidTranscription = call.hasValidTranscription();
      const notReadyForTagging = !call.isReadyForTagging(); // = preparedfortranscript false

      return hasValidTranscription && notReadyForTagging;
    });
  }

  /**
   * ✅ NOUVEAU: Filtre pour les appels en cours de tagging
   * (utilisé dans d'autres interfaces, pas CallPreparationPage)
   */
  filterActiveTaggingCalls(calls: Call[]): Call[] {
    return calls.filter(
      (call) => call.isReadyForTagging() // État de session tagging
    );
  }

  /**
   * ✅ CORRECTION: Filtrage par statut conflictuel avec typage correct
   */
  filterByConflictStatus(
    calls: Call[],
    status: ConflictStatus | "all"
  ): Call[] {
    if (status === "all") return calls;

    return calls.filter((call) => {
      // ✅ CORRECTION: Comparaison avec string au lieu de CallStatus enum
      const callStatusString = call.status as string;

      switch (status) {
        case "conflictuel":
          return callStatusString === "conflictuel";
        case "non_conflictuel":
          return callStatusString === "non_conflictuel";
        case "non_supervisé":
          return callStatusString === "non_supervisé" || call.status === null;
        default:
          return true;
      }
    });
  }

  /**
   * ✅ CORRECTION: Groupement par origine (était manquant)
   */
  groupByOrigin(calls: Call[]): GroupedCalls {
    return calls.reduce((acc, call) => {
      const origin = call.origin || "Aucune origine";
      if (!acc[origin]) {
        acc[origin] = [];
      }
      acc[origin].push(call);
      return acc;
    }, {} as GroupedCalls);
  }

  /**
   * ✅ NOUVEAU: Statistiques détaillées par origine avec typage correct
   */
  getOriginStats(calls: Call[]): OriginStats[] {
    const grouped = this.groupByOrigin(calls);

    return Object.entries(grouped)
      .map(([origin, originCalls]) => {
        const total = originCalls.length;

        // ✅ CORRECTION: Comparaison avec string au lieu de CallStatus enum
        const conflictuels = originCalls.filter(
          (c) => (c.status as string) === "conflictuel"
        ).length;
        const nonConflictuels = originCalls.filter(
          (c) => (c.status as string) === "non_conflictuel"
        ).length;
        const nonSupervises = originCalls.filter(
          (c) => (c.status as string) === "non_supervisé" || c.status === null
        ).length;

        const withAudio = originCalls.filter((c) => c.hasValidAudio()).length;
        const withTranscription = originCalls.filter((c) =>
          c.hasValidTranscription()
        ).length;
        const readyForTagging = originCalls.filter((c) =>
          c.isReadyForTagging()
        ).length;

        const averageCompleteness =
          total > 0 ? Math.round((readyForTagging / total) * 100) : 0;

        return {
          origin,
          total,
          conflictuels,
          nonConflictuels,
          nonSupervises,
          withAudio,
          withTranscription,
          readyForTagging,
          averageCompleteness,
        };
      })
      .sort((a, b) => b.total - a.total); // Tri par nombre d'appels décroissant
  }

  /**
   * Filtrage multicritères avancé
   */
  filterByCriteria(calls: Call[], criteria: FilterCriteria): Call[] {
    let filtered = [...calls];

    // Filtre par statut conflictuel
    if (criteria.conflictStatus && criteria.conflictStatus !== "all") {
      filtered = this.filterByConflictStatus(filtered, criteria.conflictStatus);
    }

    // Filtre par origine
    if (criteria.origin && criteria.origin !== "all") {
      filtered = filtered.filter((call) => call.origin === criteria.origin);
    }

    // Filtre par présence d'audio
    if (criteria.hasAudio !== undefined && criteria.hasAudio !== "all") {
      filtered = filtered.filter((call) =>
        criteria.hasAudio ? call.hasValidAudio() : !call.hasValidAudio()
      );
    }

    // Filtre par présence de transcription
    if (
      criteria.hasTranscription !== undefined &&
      criteria.hasTranscription !== "all"
    ) {
      filtered = filtered.filter((call) =>
        criteria.hasTranscription
          ? call.hasValidTranscription()
          : !call.hasValidTranscription()
      );
    }

    // Filtre par statut système (CallStatus enum)
    if (criteria.status) {
      filtered = filtered.filter((call) => call.status === criteria.status);
    }

    // Filtre par dates
    if (criteria.createdAfter) {
      filtered = filtered.filter(
        (call) => call.createdAt >= criteria.createdAfter!
      );
    }

    if (criteria.createdBefore) {
      filtered = filtered.filter(
        (call) => call.createdAt <= criteria.createdBefore!
      );
    }

    // Recherche textuelle (en dernier pour optimiser)
    if (criteria.keyword && criteria.keyword.trim()) {
      filtered = this.searchByKeyword(filtered, criteria.keyword);
    }

    return filtered;
  }

  /**
   * Recherche textuelle intelligente
   */
  searchByKeyword(calls: Call[], keyword: string): Call[] {
    if (!keyword.trim()) return calls;

    const searchTerms = keyword.toLowerCase().split(/\s+/);

    return calls.filter((call) => {
      const searchableText = [
        call.id,
        call.filename,
        call.description,
        call.origin,
        call.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Tous les termes doivent être trouvés (ET logique)
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  /**
   * Tri intelligent des appels
   */
  sortCalls(
    calls: Call[],
    sortBy: "date" | "filename" | "status" | "origin" | "completeness",
    sortOrder: "asc" | "desc" = "desc"
  ): Call[] {
    const sorted = [...calls].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "filename":
          comparison = (a.filename || "").localeCompare(b.filename || "");
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        case "origin":
          comparison = (a.origin || "").localeCompare(b.origin || "");
          break;
        case "completeness":
          const aComplete = a.isReadyForTagging() ? 1 : 0;
          const bComplete = b.isReadyForTagging() ? 1 : 0;
          comparison = aComplete - bComplete;
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Obtient les origines uniques triées par fréquence
   */
  getUniqueOrigins(calls: Call[]): string[] {
    const originCounts = calls.reduce((acc, call) => {
      const origin = call.origin || "Aucune origine";
      acc[origin] = (acc[origin] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(originCounts).sort(
      (a, b) => originCounts[b] - originCounts[a]
    ); // Tri par fréquence décroissante
  }

  /**
   * Analyse de la distribution des appels
   */
  getCallDistribution(calls: Call[]): {
    total: number;
    byStatus: Record<string, number>;
    byOrigin: Record<string, number>;
    byCompleteness: {
      ready: number;
      withAudio: number;
      withTranscription: number;
      incomplete: number;
    };
  } {
    const total = calls.length;

    // Distribution par statut (string au lieu de CallStatus enum)
    const byStatus = calls.reduce((acc, call) => {
      const status = (call.status as string) || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribution par origine
    const byOrigin = calls.reduce((acc, call) => {
      const origin = call.origin || "unknown";
      acc[origin] = (acc[origin] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribution par complétude
    const ready = calls.filter((c) => c.isReadyForTagging()).length;
    const withAudio = calls.filter((c) => c.hasValidAudio()).length;
    const withTranscription = calls.filter((c) =>
      c.hasValidTranscription()
    ).length;
    const incomplete = total - ready;

    return {
      total,
      byStatus,
      byOrigin,
      byCompleteness: {
        ready,
        withAudio,
        withTranscription,
        incomplete,
      },
    };
  }

  /**
   * Prédications pour l'optimisation de performance
   */

  /**
   * Prédicat: appel nécessite une préparation
   */
  requiresPreparation(call: Call): boolean {
    return call.hasValidTranscription() && !call.isReadyForTagging();
  }

  /**
   * Prédicat: appel peut être tagué
   */
  canBeTagged(call: Call): boolean {
    return call.isReadyForTagging();
  }

  /**
   * Prédicat: appel est en cours de traitement
   */
  isProcessing(call: Call): boolean {
    return call.status === CallStatus.PROCESSING;
  }

  /**
   * ✅ CORRECTION: Prédicat avec typage correct
   */
  isConflictual(call: Call): boolean {
    return (call.status as string) === "conflictuel";
  }

  /**
   * Batch filtering pour optimiser les gros volumes
   */
  filterInBatches(
    calls: Call[],
    criteria: FilterCriteria,
    batchSize: number = 1000
  ): Call[] {
    if (calls.length <= batchSize) {
      return this.filterByCriteria(calls, criteria);
    }

    const results: Call[] = [];
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);
      const filteredBatch = this.filterByCriteria(batch, criteria);
      results.push(...filteredBatch);
    }

    return results;
  }
}
