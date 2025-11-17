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
import { useTaggingData } from "@/features/shared/context";
import { supabase } from "@/lib/supabaseClient";
import { generateSignedUrl } from "@/components/utils/signedUrls";

import { SupervisionTurnTaggedWithMeta } from "@/features/phase2-annotation/supervision/domain/types";
import { useSupervisionData } from "@/features/phase2-annotation/supervision/ui/hooks/useSupervisionData";
import { useSupervisionFilters } from "@/features/phase2-annotation/supervision/ui/hooks/useSupervisionFilters";
import { SupervisionStats } from "@/features/phase2-annotation/supervision/ui/components/SupervisionStats";
import { SupervisionFiltersComponent } from "@/features/phase2-annotation/supervision/ui/components/SupervisionFilters";
import { SupervisionTable } from "@/features/phase2-annotation/supervision/ui/components/SupervisionTable";
import { TaggingModal } from "@/features/phase2-annotation/supervision/ui/components/TaggingModal";
import { ProcessingModal } from "@/features/phase2-annotation/supervision/ui/components/ProcessingModal";

const ITEMS_PER_PAGE = 50;

export default function SupervisionPage() {
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
    uniqueOrigines,
    callIdToFilename,
  } = useSupervisionFilters(supervisionData);

  const [page, setPage] = useState(1);
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState(false);
  const [selectedRowForTagging, setSelectedRowForTagging] = useState<SupervisionTurnTaggedWithMeta | null>(null);
  const [taggingAudioUrl, setTaggingAudioUrl] = useState<string>("");
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [selectedRowForProcessing, setSelectedRowForProcessing] = useState<SupervisionTurnTaggedWithMeta | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("info");

  const { selectTaggingCall, fetchTaggingTranscription, fetchTaggedTurns } = useTaggingData();

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, page]);

  const paginatedDataReady: SupervisionTurnTaggedWithMeta[] = useMemo(() => {
    return (paginatedData as SupervisionTurnTaggedWithMeta[]).map((r) => ({
      ...r,
      metadata: r.metadata ?? r.metadata_context ?? undefined,
    }));
  }, [paginatedData]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const showMessage = (message: string, severity: "success" | "error" | "info" = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleQuickTagEdit = async (row: SupervisionTurnTaggedWithMeta, newTag: string, newNextTag?: string) => {
    try {
      const updateData: any = { tag: newTag };
      if (newNextTag !== undefined) {
        updateData.next_turn_tag = newNextTag || null;
      }

      const { error } = await supabase.from("turntagged").update(updateData).eq("id", row.id);
      if (error) throw new Error(`Erreur base de donnees: ${error.message}`);

      await loadSupervisionData();
      showMessage(`Tag modifie avec succes`, "success");
    } catch (error) {
      showMessage(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`, "error");
    }
  };

  const handleRowClick = async (row: SupervisionTurnTaggedWithMeta) => {
    if (!row.hasTranscript || !row.hasAudio) {
      showMessage("Cet appel n'a pas de transcription ou d'audio disponible", "error");
      return;
    }

    try {
      setSelectedRowForTagging(row);
      setIsTaggingModalOpen(true);

      const callDataQuery = await supabase.from("call").select("filepath").eq("callid", row.call_id).single();
      if (callDataQuery.data?.filepath) {
        const audioUrl = await generateSignedUrl(callDataQuery.data.filepath);
        setTaggingAudioUrl(audioUrl);

        selectTaggingCall({
          callid: row.call_id,
          audiourl: audioUrl,
          filename: row.filename,
          is_tagging_call: true,
          preparedfortranscript: true,
        });

        await Promise.all([
          fetchTaggingTranscription(row.call_id),
          fetchTaggedTurns(row.call_id),
        ]);
      }
    } catch (error) {
      showMessage("Erreur lors du chargement de l'appel", "error");
    }
  };

  const handleProcessingClick = (row: SupervisionTurnTaggedWithMeta) => {
    setSelectedRowForProcessing(row);
    setIsProcessingModalOpen(true);
  };

  const closeTaggingModal = () => {
    setIsTaggingModalOpen(false);
    setSelectedRowForTagging(null);
    setTaggingAudioUrl("");
    loadSupervisionData();
  };

  const closeProcessingModal = () => {
    setIsProcessingModalOpen(false);
    setSelectedRowForProcessing(null);
  };

  const handleProcessingComplete = () => {
    showMessage("Traitement termine avec succes !", "success");
    loadSupervisionData();
  };

  const handlePageReset = () => setPage(1);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Chargement des donnees de supervision...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement: {error}
        <Button onClick={loadSupervisionData} sx={{ ml: 2 }}>Reessayer</Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>Supervision des Taggages</Typography>
        <Typography variant="body1" color="text.secondary">
          Supervision et retaggage contextualise des {filteredData.length} elements tagges
        </Typography>
      </Box>

      <SupervisionStats stats={stats} filteredCount={filteredData.length} />

      <SupervisionFiltersComponent
        filters={filters}
        updateFilters={updateFilters}
        resetFilters={resetFilters}
        tagStats={tagStats}
        uniqueFamilies={uniqueFamilies}
        uniqueSpeakers={uniqueSpeakers}
        uniqueCallIds={uniqueCallIds}
        uniqueOrigines={uniqueOrigines}
        callIdToFilename={callIdToFilename}
        onPageReset={handlePageReset}
      />

      <SupervisionTable
        data={paginatedDataReady}
        onRowClick={handleRowClick}
        onProcessingClick={handleProcessingClick}
        onQuickTagEdit={handleQuickTagEdit}
      />

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

      <TaggingModal
        open={isTaggingModalOpen}
        onClose={closeTaggingModal}
        selectedRow={selectedRowForTagging}
        audioUrl={taggingAudioUrl}
      />

      <ProcessingModal
        open={isProcessingModalOpen}
        onClose={closeProcessingModal}
        selectedRow={selectedRowForProcessing}
        onProcessingComplete={handleProcessingComplete}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
