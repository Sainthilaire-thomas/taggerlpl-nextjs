// supervision/hooks/useSupervisionFilters.ts

import { useState, useMemo } from "react";
import {
  SupervisionTurnTagged,
  SupervisionFilters,
  SupervisionFiltersHook,
} from "../types";

/**
 * ⚠️ Ce hook ne reconstruit PAS les objets,
 * il filtre seulement le tableau — ainsi `row.metadata` est conservé tel quel.
 */

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

    // Filtre par tag (tag principal)
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

    // Filtre par origine
    if (filters.selectedOrigine !== "all") {
      filtered = filtered.filter(
        (item) => item.origine === filters.selectedOrigine
      );
    }

    // Recherche texte (étendue)
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter((item) => {
        const inVerbatim = item.verbatim?.toLowerCase().includes(searchLower);
        const inNext = item.next_turn_verbatim
          ?.toLowerCase()
          .includes(searchLower);
        const inTag = item.tag?.toLowerCase().includes(searchLower);
        const inNextTag = item.next_turn_tag
          ?.toLowerCase()
          .includes(searchLower);
        const inCall = String(item.call_id).toLowerCase().includes(searchLower);
        const inFile = item.filename?.toLowerCase().includes(searchLower);
        const inOrigine = item.origine?.toLowerCase().includes(searchLower);
        const inSpeaker = item.speaker?.toLowerCase().includes(searchLower);
        return (
          inVerbatim ||
          inNext ||
          inTag ||
          inNextTag ||
          inCall ||
          inFile ||
          inOrigine ||
          inSpeaker
        );
      });
    }

    // Filtre audio
    if (filters.hasAudio !== null) {
      filtered = filtered.filter((item) => item.hasAudio === filters.hasAudio);
    }

    // Filtre transcription
    if (filters.hasTranscript !== null) {
      filtered = filtered.filter(
        (item) => item.hasTranscript === filters.hasTranscript
      );
    }

    return filtered;
  }, [supervisionData, filters]);

  // Valeurs uniques pour les filtres
  const uniqueFamilies = useMemo(
    () => [...new Set(supervisionData.map((item) => item.family))].sort(),
    [supervisionData]
  );

  const uniqueSpeakers = useMemo(
    () => [...new Set(supervisionData.map((item) => item.speaker))].sort(),
    [supervisionData]
  );

  const uniqueCallIds = useMemo(
    () =>
      [...new Set(supervisionData.map((item) => item.call_id))].sort((a, b) =>
        b.localeCompare(a)
      ),
    [supervisionData]
  );

  const uniqueOrigines = useMemo(
    () =>
      [
        ...new Set(
          supervisionData
            .map((item) => item.origine)
            .filter((o): o is string => Boolean(o))
        ),
      ].sort(),
    [supervisionData]
  );

  // Map Call ID → Filename (utile pour les labels UI)
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
    uniqueOrigines,
    callIdToFilename,
  };
};
