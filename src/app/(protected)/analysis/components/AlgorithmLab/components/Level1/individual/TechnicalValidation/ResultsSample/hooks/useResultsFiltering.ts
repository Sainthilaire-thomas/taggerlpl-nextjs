import { useMemo, useState } from "react";
import { TVValidationResult } from "../types";

export const useResultsFiltering = (results: TVValidationResult[]) => {
  const [predFilter, setPredFilter] = useState<string[]>([]);
  const [realFilter, setRealFilter] = useState<string[]>([]);
  const [onlyDisagreements, setOnlyDisagreements] = useState(false);

  const allPredTags = useMemo(() => {
    if (!results.length) return [];
    return Array.from(new Set(results.map((r) => r.predicted))).sort();
  }, [results]);

  const allRealTags = useMemo(() => {
    if (!results.length) return [];
    return Array.from(new Set(results.map((r) => r.goldStandard))).sort();
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!results.length) return [];

    return results.filter(
      (r) =>
        (predFilter.length === 0 || predFilter.includes(r.predicted)) &&
        (realFilter.length === 0 || realFilter.includes(r.goldStandard)) &&
        (!onlyDisagreements || !r.correct)
    );
  }, [results, predFilter, realFilter, onlyDisagreements]);

  const totalErrors = useMemo(() => {
    return filteredResults.filter((r) => !r.correct).length;
  }, [filteredResults]);

  const updateFilters = {
    setPredFilter,
    setRealFilter,
    setOnlyDisagreements,
  };

  return {
    filteredResults,
    filters: {
      predFilter,
      realFilter,
      onlyDisagreements,
      allPredTags,
      allRealTags,
    },
    updateFilters,
    totalErrors,
  };
};
