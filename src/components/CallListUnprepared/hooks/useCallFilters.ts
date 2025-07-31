// hooks/useCallFilters.ts
import { useState, useMemo } from "react";
import { Call, CallsByOrigin, PreparationFilters, CallStats } from "../types";
import { DEFAULT_FILTERS } from "../constants"; // ✅ Import depuis constants
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

  const allCalls = useMemo(
    () => Object.values(callsByOrigin).flat(),
    [callsByOrigin]
  );

  const globalStats = useMemo(() => getCallStats(allCalls), [allCalls]);

  const filteredCallsByOrigin = useMemo(() => {
    return Object.entries(callsByOrigin).reduce<CallsByOrigin>(
      (acc, [origin, calls]) => {
        const filteredCalls = filterCalls(calls, filters);
        if (filteredCalls.length > 0) {
          acc[origin] = filteredCalls;
        }
        return acc;
      },
      {}
    );
  }, [callsByOrigin, filters]);

  const updateFilter = (
    filterType: keyof PreparationFilters,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return {
    filters,
    filteredCallsByOrigin,
    globalStats,
    updateFilter,
    resetFilters,
  };
};
