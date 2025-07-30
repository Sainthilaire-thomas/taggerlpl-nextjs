// supervision/hooks/useSupervisionFilters.ts

import { useState, useMemo } from "react";
import {
  SupervisionTurnTagged,
  SupervisionFilters,
  SupervisionFiltersHook,
} from "../types";

const initialFilters: SupervisionFilters = {
  selectedTag: "all",
  selectedFamily: "all",
  selectedSpeaker: "all",
  searchText: "",
  hasAudio: null,
  hasTranscript: null,
};

export const useSupervisionFilters = (
  supervisionData: SupervisionTurnTagged[]
): SupervisionFiltersHook => {
  const [filters, setFilters] = useState<SupervisionFilters>(initialFilters);

  const updateFilters = (updates: Partial<SupervisionFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredData = useMemo(() => {
    let filtered = supervisionData;

    // Filtre par tag
    if (filters.selectedTag !== "all") {
      filtered = filtered.filter((item) => item.tag === filters.selectedTag);
    }

    // Filtre par famille
    if (filters.selectedFamily !== "all") {
      filtered = filtered.filter(
        (item) => item.family === filters.selectedFamily
      );
    }

    // Filtre par speaker
    if (filters.selectedSpeaker !== "all") {
      filtered = filtered.filter(
        (item) => item.speaker === filters.selectedSpeaker
      );
    }

    // Filtre par texte de recherche
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.verbatim.toLowerCase().includes(searchLower) ||
          item.next_turn_verbatim.toLowerCase().includes(searchLower) ||
          String(item.call_id).toLowerCase().includes(searchLower) ||
          (item.filename && item.filename.toLowerCase().includes(searchLower))
      );
    }

    // Filtre par présence d'audio
    if (filters.hasAudio !== null) {
      filtered = filtered.filter((item) => item.hasAudio === filters.hasAudio);
    }

    // Filtre par présence de transcription
    if (filters.hasTranscript !== null) {
      filtered = filtered.filter(
        (item) => item.hasTranscript === filters.hasTranscript
      );
    }

    return filtered;
  }, [supervisionData, filters]);

  const uniqueFamilies = useMemo(() => {
    return [...new Set(supervisionData.map((item) => item.family))];
  }, [supervisionData]);

  const uniqueSpeakers = useMemo(() => {
    return [...new Set(supervisionData.map((item) => item.speaker))];
  }, [supervisionData]);

  return {
    filters,
    filteredData,
    updateFilters,
    resetFilters,
    uniqueFamilies,
    uniqueSpeakers,
  };
};
