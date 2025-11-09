// CallListUnprepared.tsx - CORRECTION updateCall Promise
"use client";
import React, { useMemo, useCallback } from "react";
import { Box } from "@mui/material";

import { CallListUnpreparedProps } from "./types";
import { useCallsData } from "./hooks/useCallsData";
import { useCallFilters } from "./hooks/useCallFilters";
import { useCallActions } from "./hooks/useCallActions";
import { useComplementActions } from "./hooks/useComplementActions";
import { useOriginEditOptimized } from "./hooks/useOriginEditOptimized";

import GlobalStatsCard from "./components/GlobalStatsCard";
import AdvancedFilters from "./components/AdvancedFilters";
import CallsAccordion from "./components/CallsAccordion";
import EmptyStateMessage from "./components/EmptyStateMessage";
import CallContentDialog from "./components/CallContentDialog";
import BulkOriginEditBar from "./components/BulkOriginEditBar";
import { AudioUploadModal } from "../AudioUploadModal";
import { TranscriptionUploadModal } from "@/features/phase1-corpus/calls/TranscriptionUploadModal";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";

const CallListUnprepared: React.FC<CallListUnpreparedProps> = ({
  onPrepareCall,
  showMessage,
}) => {
  // Hooks de gestion des données
  const { callsByOrigin, isLoading, updateCall, removeCall } =
    useCallsData(showMessage);

  const { filters, filteredCallsByOrigin, globalStats, updateFilter } =
    useCallFilters(callsByOrigin);

  // ✅ OPTIMISATION: Calcul stable des appels avec cache
  const allCalls = useMemo(() => {
    console.time("allCalls-computation-main");
    const calls = Object.values(filteredCallsByOrigin).flat();
    console.timeEnd("allCalls-computation-main");
    console.log(`📊 Total appels filtrés: ${calls.length}`);
    return calls;
  }, [filteredCallsByOrigin]);

  // ✅ CORRECTION: Wrapper pour assurer que updateCall retourne une Promise
  const updateCallAsync = useCallback(
    async (callId: string, updates: any) => {
      try {
        console.time(`updateCall-${callId}`);

        // Appeler updateCall (qui retourne void)
        updateCall(callId, updates);

        // Pas besoin de vérifier le résultat car updateCall retourne void
        // On simule juste une Promise résolue

        console.timeEnd(`updateCall-${callId}`);
        console.log(`✅ Call ${callId} updated successfully`);
      } catch (error) {
        console.error("❌ Erreur updateCall:", error);
        throw error; // Propager l'erreur
      }
    },
    [updateCall]
  );

  // ✅ Hook optimisé avec wrapper async
  const originEdit = useOriginEditOptimized(
    allCalls,
    updateCallAsync, // ✅ Utiliser le wrapper async
    showMessage
  );

  // Hooks d'actions principales
  const {
    selectedCall,
    deleteDialogOpen,
    callToDelete,
    isDeleting,
    handlePrepareCall,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteDialogClose,
    handleViewContent,
    handleStatusChange,
    handleCloseDialog,
  } = useCallActions({
    onPrepareCall,
    showMessage,
    updateCall,
    removeCall,
  });

  const {
    audioModalOpen,
    transcriptionModalOpen,
    complementCall,
    handleAddAudio,
    handleAddTranscription,
    handleAudioUpload,
    handleTranscriptionUpload,
    handleCloseModals,
  } = useComplementActions({
    showMessage,
    updateCall,
  });

  // ✅ OPTIMISATION: Props stables mémorisées
  const bulkEditBarProps = useMemo(() => {
    return {
      visible: originEdit.hasSelection,
      selectedCount: originEdit.selectedCount,
      isEditing: originEdit.isBulkEditing,
      isProcessing: originEdit.isProcessing,
      availableOrigins: originEdit.availableOrigins,
      pendingOrigin: originEdit.pendingOrigin,
      onStartEdit: originEdit.handleStartBulkEdit,
      onSave: originEdit.handleSaveBulkEdit,
      onCancel: originEdit.handleCancelBulkEdit,
      onOriginChange: originEdit.setPendingOrigin,
      onSelectAll: originEdit.handleSelectAll,
      isAllSelected: originEdit.isAllSelected,
    };
  }, [
    originEdit.hasSelection,
    originEdit.selectedCount,
    originEdit.isBulkEditing,
    originEdit.isProcessing,
    originEdit.availableOrigins,
    originEdit.pendingOrigin,
    originEdit.handleStartBulkEdit,
    originEdit.handleSaveBulkEdit,
    originEdit.handleCancelBulkEdit,
    originEdit.setPendingOrigin,
    originEdit.handleSelectAll,
    originEdit.isAllSelected,
  ]);

  const accordionProps = useMemo(() => {
    return {
      callsByOrigin: filteredCallsByOrigin,
      originEdit,
      onPrepareCall: handlePrepareCall,
      onDeleteCall: handleDeleteClick,
      onAddAudio: handleAddAudio,
      onAddTranscription: handleAddTranscription,
      onViewContent: handleViewContent,
      isDeleting,
      callToDelete,
    };
  }, [
    filteredCallsByOrigin,
    originEdit,
    handlePrepareCall,
    handleDeleteClick,
    handleAddAudio,
    handleAddTranscription,
    handleViewContent,
    isDeleting,
    callToDelete,
  ]);

  // ✅ OPTIMISATION: Fonctions de conversion mémorisées
  const convertCallForExternalUse = useMemo(() => {
    return (call: any) => {
      if (!call) return undefined;
      return {
        ...call,
        upload: call.upload === null ? undefined : call.upload,
        preparedfortranscript:
          call.preparedfortranscript === null
            ? undefined
            : call.preparedfortranscript,
        is_tagging_call:
          call.is_tagging_call === null ? undefined : call.is_tagging_call,
        origine: call.origine === null ? undefined : call.origine,
        filename: call.filename === null ? undefined : call.filename,
        description: call.description === null ? undefined : call.description,
        duree: call.duree === null ? undefined : call.duree,
        audiourl: call.audiourl === null ? undefined : call.audiourl,
        filepath: call.filepath === null ? undefined : call.filepath,
        transcription:
          call.transcription === null ? undefined : call.transcription,
        status: call.status === null ? undefined : call.status,
      };
    };
  }, []);

  const convertCallForDeleteDialog = useMemo(() => {
    return (call: any) => {
      if (!call) return null;
      return convertCallForExternalUse(call);
    };
  }, [convertCallForExternalUse]);

  const handleDeleteConfirmWrapper = useMemo(() => {
    return async (call: any) => {
      if (call) {
        await handleDeleteConfirm(call);
      }
    };
  }, [handleDeleteConfirm]);

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>Chargement des appels...</Box>
    );
  }

  const hasFilteredCalls = Object.keys(filteredCallsByOrigin).length > 0;
  const hasAnyCalls = Object.keys(callsByOrigin).length > 0;

  console.log(
    `🔄 Render CallListUnprepared - Appels filtrés: ${
      hasFilteredCalls ? "OUI" : "NON"
    }`
  );

  return (
    <Box>
      <GlobalStatsCard
        stats={globalStats}
        filters={filters}
        onFilterChange={updateFilter}
      />
      <AdvancedFilters filters={filters} onFilterChange={updateFilter} />
      <BulkOriginEditBar {...bulkEditBarProps} />

      {hasFilteredCalls ? (
        <CallsAccordion {...accordionProps} />
      ) : (
        <EmptyStateMessage hasAnyCalls={hasAnyCalls} />
      )}

      <CallContentDialog
        open={!!selectedCall}
        call={selectedCall}
        onClose={handleCloseDialog}
        onStatusChange={handleStatusChange}
      />

      <AudioUploadModal
        open={audioModalOpen}
        call={convertCallForExternalUse(complementCall)}
        mode="complement"
        onClose={handleCloseModals}
        onUpload={handleAudioUpload}
      />

      <TranscriptionUploadModal
        open={transcriptionModalOpen}
        call={convertCallForExternalUse(complementCall)}
        onClose={handleCloseModals}
        onUpload={handleTranscriptionUpload}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        call={convertCallForDeleteDialog(callToDelete)}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirmWrapper}
        isDeleting={isDeleting}
      />
    </Box>
  );
};

export default CallListUnprepared;
