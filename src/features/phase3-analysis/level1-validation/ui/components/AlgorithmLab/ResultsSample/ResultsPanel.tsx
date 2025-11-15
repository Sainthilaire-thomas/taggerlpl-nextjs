"use client";
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Chip,
} from "@mui/material";
import { TVValidationResult } from "./types";
import { ResultsTableHeader } from "./components/ResultsTableHeader";
import { ResultsFilters } from "./components/ResultsFilters";
import { ResultsTableBody } from "./components/ResultsTableBody";
import { FineTuningDialog } from "./components/FineTuningDialog";
import { useResultsFiltering } from "./hooks/useResultsFiltering";
import { useResultsPagination } from "./hooks/useResultsPagination";
import { useFineTuningExtractor } from "./components/FineTuningDialog/hooks/useFineTuningExtractor";

import MetricsPanel from "../MetricsPanel";
import {
  buildExtraColumnsForTarget,
  type ExtraColumn,
  type TargetKind,
} from "../extraColumns";

export interface ResultsPanelProps {
  results: TVValidationResult[];
  initialPageSize?: number;
  extraColumns?: ExtraColumn[]; // optionnel: override
  targetKind: TargetKind; // "X" | "Y" | "M1" | "M2" | "M3"
  classifierLabel?: string; // affichage dans MetricsPanel
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  initialPageSize = 25,
  extraColumns,
  targetKind,
  classifierLabel,
}) => {
  // 1) Hooks d'état
  const [showAllResults, setShowAllResults] = useState(false);
  const [showFineTuningDialog, setShowFineTuningDialog] = useState(false);
  const [fineTuningData, setFineTuningData] = useState("");

  // 2) Hooks de data/compute
  const { filteredResults, filters, updateFilters, totalErrors } =
    useResultsFiltering(results);

  const paginationHook = useResultsPagination(
    filteredResults,
    showAllResults ? filteredResults.length : initialPageSize
  );

  const {
    extractFineTuningData,
    isExtracting,
    error: extractionError,
  } = useFineTuningExtractor();

  // 🚩 3) IMPORTANT : ce useMemo DOIT être avant tout return conditionnel
  const dynamicExtraColumns = useMemo(
    () => extraColumns ?? buildExtraColumnsForTarget(targetKind),
    [extraColumns, targetKind]
  );

  // 4) Handlers (pas des hooks)
  const handleExtractFineTuning = async () => {
    try {
      const data = await extractFineTuningData(filteredResults);
      setFineTuningData(data);
      setShowFineTuningDialog(true);
    } catch (err) {
      console.error("Erreur lors de l'extraction:", err);
      alert(`Erreur lors de l'extraction des annotations: ${err}`);
    }
  };

  // 5) Guard clause APRÈS les hooks
  if (!results.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Aucun résultat à afficher
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 6) Dérivés d’affichage (pas de hooks)
  const displayData = showAllResults
    ? {
        pageItems: filteredResults,
        page: 0,
        rowsPerPage: filteredResults.length,
        handlePageChange: () => {},
        handleRowsPerPageChange: () => {},
      }
    : paginationHook;

  return (
    <>
      <Card>
        <CardContent>
          {/* Métriques (sur résultats FILTRÉS) */}
          <MetricsPanel
            results={filteredResults}
            targetKind={targetKind}
            classifierLabel={classifierLabel}
          />

          <ResultsTableHeader
            totalResults={filteredResults.length}
            totalErrors={totalErrors}
            filteredResults={filteredResults}
            onlyDisagreements={filters.onlyDisagreements}
            onOnlyDisagreementsChange={updateFilters.setOnlyDisagreements}
            isExtracting={isExtracting}
            onExtractFineTuning={handleExtractFineTuning}
            extraColumns={dynamicExtraColumns}
          />

          {/* Contrôle d’affichage */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 1,
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={showAllResults}
                  onChange={(e) => setShowAllResults(e.target.checked)}
                  color="primary"
                />
              }
              label="Afficher tous les résultats"
            />
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip
                label={`${filteredResults.length} résultats`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {showAllResults && filteredResults.length > 100 && (
                <Chip
                  label="⚠️ Performance réduite"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {/* Filtres */}
          <ResultsFilters
            results={results}
            filters={filters}
            onFiltersChange={updateFilters}
          />

          {/* Tableau */}
          <ResultsTableBody
            pageItems={displayData.pageItems}
            page={displayData.page}
            rowsPerPage={displayData.rowsPerPage}
            totalCount={filteredResults.length}
            onPageChange={displayData.handlePageChange}
            onRowsPerPageChange={displayData.handleRowsPerPageChange}
            showPagination={!showAllResults}
            extraColumns={dynamicExtraColumns}
          />

          {/* Erreur extraction (affichage simple) */}
          {extractionError && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 2, p: 2, bgcolor: "error.light", borderRadius: 1 }}
            >
              Erreur d'extraction: {extractionError}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Dialog FT */}
      <FineTuningDialog
        open={showFineTuningDialog}
        onClose={() => setShowFineTuningDialog(false)}
        results={filteredResults}
        initialData={fineTuningData}
      />
    </>
  );
};
