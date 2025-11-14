"use client";
import React, { useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { TVValidationResult } from "./types";
import { ResultsTableHeader } from "./components/ResultsTableHeader";
import { ResultsFilters } from "./components/ResultsFilters";
import { ResultsTableBody } from "./components/ResultsTableBody";
import { FineTuningDialog } from "./components/FineTuningDialog";
import { useResultsFiltering } from "./hooks/useResultsFiltering";
import { useResultsPagination } from "./hooks/useResultsPagination";
import { useFineTuningExtractor } from "./components/FineTuningDialog/hooks/useFineTuningExtractor";

export interface ResultsSampleProps {
  results: TVValidationResult[];
  limit?: number;
  initialPageSize?: number;
}

export const ResultsSample: React.FC<ResultsSampleProps> = ({
  results,
  limit,
  initialPageSize,
}) => {
  // États pour le fine-tuning
  const [showFineTuningDialog, setShowFineTuningDialog] = useState(false);
  const [fineTuningData, setFineTuningData] = useState("");

  // Hooks de gestion des données
  const { filteredResults, filters, updateFilters, totalErrors } =
    useResultsFiltering(results);

  const {
    pageItems,
    page,
    rowsPerPage,
    handlePageChange,
    handleRowsPerPageChange,
  } = useResultsPagination(filteredResults, initialPageSize || limit || 10);

  const {
    extractFineTuningData,
    isExtracting,
    error: extractionError,
  } = useFineTuningExtractor();

  // Handler pour l'extraction de fine-tuning
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

  // Guard clause pour les résultats vides
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

  return (
    <>
      <Card>
        <CardContent>
          {/* En-tête avec métriques */}
          <ResultsTableHeader
            totalResults={filteredResults.length}
            totalErrors={totalErrors}
            filteredResults={filteredResults}
            onlyDisagreements={filters.onlyDisagreements}
            onOnlyDisagreementsChange={updateFilters.setOnlyDisagreements}
            isExtracting={isExtracting}
            onExtractFineTuning={handleExtractFineTuning}
          />

          {/* Filtres de recherche */}
          <ResultsFilters
            results={results}
            filters={filters}
            onFiltersChange={updateFilters}
          />

          {/* Corps du tableau avec pagination */}
          <ResultsTableBody
            pageItems={pageItems}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={filteredResults.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />

          {/* Message d'erreur d'extraction si présent */}
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

      {/* Dialog de fine-tuning */}
      <FineTuningDialog
        open={showFineTuningDialog}
        onClose={() => setShowFineTuningDialog(false)}
        results={filteredResults}
        initialData={fineTuningData}
      />
    </>
  );
};
