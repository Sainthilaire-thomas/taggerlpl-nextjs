"use client";
import React, { useState } from "react";
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

export interface ResultsPanelProps {
  results: TVValidationResult[];
  initialPageSize?: number;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  initialPageSize = 25,
}) => {
  // 🚀 État pour contrôler l'affichage
  const [showAllResults, setShowAllResults] = useState(false);

  // États pour le fine-tuning
  const [showFineTuningDialog, setShowFineTuningDialog] = useState(false);
  const [fineTuningData, setFineTuningData] = useState("");

  // Hooks de gestion des données
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

  // Données à utiliser selon le mode
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

          {/* 🚀 Contrôle d'affichage */}
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

          {/* Filtres de recherche */}
          <ResultsFilters
            results={results}
            filters={filters}
            onFiltersChange={updateFilters}
          />

          {/* Corps du tableau */}
          <ResultsTableBody
            pageItems={displayData.pageItems}
            page={displayData.page}
            rowsPerPage={displayData.rowsPerPage}
            totalCount={filteredResults.length}
            onPageChange={displayData.handlePageChange}
            onRowsPerPageChange={displayData.handleRowsPerPageChange}
            showPagination={!showAllResults}
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
