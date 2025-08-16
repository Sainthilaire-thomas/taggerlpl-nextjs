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
  selectedCallId: "all",
  selectedOrigine: "all", // ← NOUVEAU
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

    // Filtre par Call ID
    if (filters.selectedCallId !== "all") {
      filtered = filtered.filter(
        (item) => item.call_id === filters.selectedCallId
      );
    }

    // Filtre par tag - SEULEMENT le tag principal
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

    // ← NOUVEAU : Filtre par origine
    if (filters.selectedOrigine !== "all") {
      filtered = filtered.filter(
        (item) => item.origine === filters.selectedOrigine
      );
    }

    // Filtre par texte de recherche (recherche étendue)
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.verbatim.toLowerCase().includes(searchLower) ||
          item.next_turn_verbatim.toLowerCase().includes(searchLower) ||
          item.tag.toLowerCase().includes(searchLower) ||
          (item.next_turn_tag &&
            item.next_turn_tag.toLowerCase().includes(searchLower)) ||
          String(item.call_id).toLowerCase().includes(searchLower) ||
          (item.filename &&
            item.filename.toLowerCase().includes(searchLower)) ||
          (item.origine && item.origine.toLowerCase().includes(searchLower)) || // ← NOUVEAU
          item.speaker.toLowerCase().includes(searchLower)
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

  // Calculer les valeurs uniques pour les filtres
  const uniqueFamilies = useMemo(() => {
    return [...new Set(supervisionData.map((item) => item.family))].sort();
  }, [supervisionData]);

  const uniqueSpeakers = useMemo(() => {
    return [...new Set(supervisionData.map((item) => item.speaker))].sort();
  }, [supervisionData]);

  const uniqueCallIds = useMemo(() => {
    return [...new Set(supervisionData.map((item) => item.call_id))].sort(
      (a, b) => b.localeCompare(a)
    );
  }, [supervisionData]);

  // ← NOUVEAU : Calculer les origines uniques
  const uniqueOrigines = useMemo(() => {
    return [
      ...new Set(
        supervisionData
          .map((item) => item.origine)
          .filter((origine): origine is string => Boolean(origine)) // ← Type guard explicite
      ),
    ].sort();
  }, [supervisionData]);

  // ← NOUVEAU : Créer une map Call ID → Filename
  const callIdToFilename = useMemo(() => {
    const map = new Map<string, string>();
    supervisionData.forEach((item) => {
      if (item.filename) {
        map.set(item.call_id, item.filename);
      }
    });
    return map;
  }, [supervisionData]);

  return {
    filters,
    filteredData,
    updateFilters,
    resetFilters,
    uniqueFamilies,
    uniqueSpeakers,
    uniqueCallIds,
    uniqueOrigines, // ← NOUVEAU
    callIdToFilename, // ← NOUVEAU
  };
};
