"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  Pagination,
  Snackbar,
} from "@mui/material";
import { useTaggingData } from "@/context/TaggingDataContext";
import { supabase } from "@/lib/supabaseClient";
import { generateSignedUrl } from "@/components/utils/signedUrls";
import AppLayout from "../layout";

// Imports locaux
import { SupervisionTurnTagged } from "./types";
import { useSupervisionData, useSupervisionFilters } from "./hooks";
import {
  SupervisionStats,
  SupervisionFiltersComponent,
  SupervisionTable,
  TaggingModal,
  ProcessingModal, // Nouveau
} from "./components";

const ITEMS_PER_PAGE = 50;

export default function SupervisionPage() {
  // Hooks pour les données et filtres
  const {
    supervisionData,
    tagStats,
    stats,
    loading,
    error,
    loadSupervisionData,
  } = useSupervisionData();

  const {
    filters,
    filteredData,
    updateFilters,
    resetFilters,
    uniqueFamilies,
    uniqueSpeakers,
    uniqueCallIds,
    uniqueOrigines, // ← AJOUTER
    callIdToFilename, // ← AJOUTER
  } = useSupervisionFilters(supervisionData);

  // États pour la pagination
  const [page, setPage] = useState(1);

  // États pour le modal de tagging
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState(false);
  const [selectedRowForTagging, setSelectedRowForTagging] =
    useState<SupervisionTurnTagged | null>(null);
  const [taggingAudioUrl, setTaggingAudioUrl] = useState<string>("");

  // États pour le modal de traitement
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [selectedRowForProcessing, setSelectedRowForProcessing] =
    useState<SupervisionTurnTagged | null>(null);

  // État pour les notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("info");

  // Context du tagging
  const { selectTaggingCall, fetchTaggingTranscription, fetchTaggedTurns } =
    useTaggingData();

  // Pagination des données
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Fonction utilitaire pour les notifications
  const showMessage = (
    message: string,
    severity: "success" | "error" | "info" = "info"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Gestionnaire pour le clic sur une ligne complète (audio + transcription)
  const handleRowClick = async (row: SupervisionTurnTagged) => {
    if (!row.hasTranscript || !row.hasAudio) {
      showMessage(
        "Cet appel n'a pas de transcription ou d'audio disponible",
        "error"
      );
      return;
    }

    try {
      setSelectedRowForTagging(row);
      setIsTaggingModalOpen(true);

      // Récupérer l'URL audio
      const callDataQuery = await supabase
        .from("call")
        .select("filepath")
        .eq("callid", row.call_id)
        .single();

      if (callDataQuery.data?.filepath) {
        const audioUrl = await generateSignedUrl(callDataQuery.data.filepath);
        setTaggingAudioUrl(audioUrl);

        // Préparer l'appel pour le tagging
        selectTaggingCall({
          callid: row.call_id,
          audiourl: audioUrl,
          filename: row.filename,
          is_tagging_call: true,
          preparedfortranscript: true,
        });

        // Charger la transcription et les tags
        await Promise.all([
          fetchTaggingTranscription(row.call_id),
          fetchTaggedTurns(row.call_id),
        ]);

        console.log(`✅ Appel ${row.call_id} préparé pour le tagging`);
      }
    } catch (error) {
      console.error("Erreur lors de la préparation du tagging:", error);
      showMessage("Erreur lors du chargement de l'appel", "error");
    }
  };

  // Gestionnaire pour le clic sur une ligne incomplète (traitement requis)
  const handleProcessingClick = (row: SupervisionTurnTagged) => {
    setSelectedRowForProcessing(row);
    setIsProcessingModalOpen(true);
  };

  // Fermeture du modal de tagging
  const closeTaggingModal = () => {
    setIsTaggingModalOpen(false);
    setSelectedRowForTagging(null);
    setTaggingAudioUrl("");
    // Recharger les données pour refléter les modifications
    loadSupervisionData();
  };

  // Fermeture du modal de traitement
  const closeProcessingModal = () => {
    setIsProcessingModalOpen(false);
    setSelectedRowForProcessing(null);
  };

  // Gestionnaire pour la fin du traitement
  const handleProcessingComplete = () => {
    showMessage("Traitement terminé avec succès !", "success");
    // Recharger les données pour refléter les modifications
    loadSupervisionData();
  };

  const handlePageReset = () => {
    setPage(1);
  };

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <AppLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography>Chargement des données de supervision...</Typography>
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur lors du chargement: {error}
          <Button onClick={loadSupervisionData} sx={{ ml: 2 }}>
            Réessayer
          </Button>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ p: 2 }}>
        {/* En-tête */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            🔍 Supervision des Taggages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Supervision et retaggage contextualisé des {supervisionData.length}{" "}
            éléments taggés
          </Typography>
        </Box>

        {/* Statistiques */}
        <SupervisionStats stats={stats} filteredCount={filteredData.length} />

        {/* Filtres */}
        <SupervisionFiltersComponent
          filters={filters}
          updateFilters={updateFilters}
          resetFilters={resetFilters}
          tagStats={tagStats}
          uniqueFamilies={uniqueFamilies}
          uniqueSpeakers={uniqueSpeakers}
          uniqueCallIds={uniqueCallIds}
          uniqueOrigines={uniqueOrigines} // ← AJOUTER
          callIdToFilename={callIdToFilename} // ← AJOUTER
          onPageReset={handlePageReset}
        />

        {/* Tableau */}
        <SupervisionTable
          data={paginatedData}
          onRowClick={handleRowClick}
          onProcessingClick={handleProcessingClick}
        />

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>

        {/* Modal de Tagging */}
        <TaggingModal
          open={isTaggingModalOpen}
          onClose={closeTaggingModal}
          selectedRow={selectedRowForTagging}
          audioUrl={taggingAudioUrl}
        />

        {/* Modal de Traitement */}
        <ProcessingModal
          open={isProcessingModalOpen}
          onClose={closeProcessingModal}
          selectedRow={selectedRowForProcessing}
          onProcessingComplete={handleProcessingComplete}
        />

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
}
