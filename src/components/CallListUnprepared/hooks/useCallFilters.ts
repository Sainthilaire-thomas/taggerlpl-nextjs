// hooks/useCallFilters.ts - VERSION OPTIMISÉE
import { useState, useMemo, useCallback } from "react";
import { Call, CallsByOrigin, PreparationFilters, CallStats } from "../types";
import { DEFAULT_FILTERS } from "../constants";
import { filterCalls, getCallStats } from "../utils";

interface UseCallFiltersReturn {
  filters: PreparationFilters;
  filteredCallsByOrigin: CallsByOrigin;
  globalStats: CallStats;
  updateFilter: (filterType: keyof PreparationFilters, value: string) => void;
  resetFilters: () => void;
}

export const useCallFilters = (
  callsByOrigin: CallsByOrigin
): UseCallFiltersReturn => {
  const [filters, setFilters] = useState<PreparationFilters>(DEFAULT_FILTERS);

  // ✅ OPTIMISATION 1: Cache intelligent des appels avec invalidation
  const allCalls = useMemo(() => {
    console.time("allCalls-filters-computation");
    const calls = Object.values(callsByOrigin).flat();
    console.timeEnd("allCalls-filters-computation");
    console.log(`📊 useCallFilters - Total appels: ${calls.length}`);
    return calls;
  }, [callsByOrigin]);

  // ✅ OPTIMISATION 2: Cache des statistiques globales
  const globalStats = useMemo(() => {
    console.time("globalStats-computation");
    const stats = getCallStats(allCalls);
    console.timeEnd("globalStats-computation");
    return stats;
  }, [allCalls]);

  // ✅ OPTIMISATION 3: Filtrage avec cache multi-niveaux
  const filteredCallsByOrigin = useMemo(() => {
    console.time("filtering-computation");

    // Vérification rapide si filtrage nécessaire
    const needsFiltering =
      filters.state !== "all" ||
      filters.content !== "all" ||
      filters.status !== "all" ||
      filters.keyword.trim() !== "";

    let result: CallsByOrigin;

    if (!needsFiltering) {
      // Pas de filtrage nécessaire, retourner directement
      result = callsByOrigin;
      console.log("📊 No filtering needed, returning original data");
    } else {
      // Filtrage nécessaire
      result = Object.entries(callsByOrigin).reduce<CallsByOrigin>(
        (acc, [origin, calls]) => {
          const filteredCalls = filterCalls(calls, filters);
          if (filteredCalls.length > 0) {
            acc[origin] = filteredCalls;
          }
          return acc;
        },
        {}
      );

      const totalFiltered = Object.values(result).reduce(
        (sum, calls) => sum + calls.length,
        0
      );
      console.log(`📊 Filtered: ${totalFiltered}/${allCalls.length} appels`);
    }

    console.timeEnd("filtering-computation");
    return result;
  }, [callsByOrigin, filters, allCalls.length]);

  // ✅ OPTIMISATION 4: Handler de mise à jour stable
  const updateFilter = useCallback(
    (filterType: keyof PreparationFilters, value: string) => {
      console.time(`filter-update-${filterType}`);

      setFilters((prev) => {
        // Éviter les mises à jour inutiles
        if (prev[filterType] === value) {
          console.log(`⚡ Filter ${filterType} unchanged, skipping update`);
          console.timeEnd(`filter-update-${filterType}`);
          return prev;
        }

        const newFilters = {
          ...prev,
          [filterType]: value,
        };

        console.log(`🔄 Filter updated: ${filterType} = "${value}"`);
        console.timeEnd(`filter-update-${filterType}`);
        return newFilters;
      });
    },
    []
  );

  // ✅ OPTIMISATION 5: Reset stable
  const resetFilters = useCallback(() => {
    console.time("reset-filters");
    setFilters(DEFAULT_FILTERS);
    console.timeEnd("reset-filters");
    console.log("🔄 Filters reset to default");
  }, []);

  return {
    filters,
    filteredCallsByOrigin,
    globalStats,
    updateFilter,
    resetFilters,
  };
};
