// CallListUnprepared.tsx
"use client";
import React, { useMemo } from "react";
import { Box } from "@mui/material";

import { CallListUnpreparedProps } from "./types";
import { useCallsData } from "./hooks/useCallsData";
import { useCallFilters } from "./hooks/useCallFilters";
import { useCallActions } from "./hooks/useCallActions";
import { useComplementActions } from "./hooks/useComplementActions";
import { useOriginEdit } from "./hooks/useOriginEdit"; // ✅ AJOUTÉ

import GlobalStatsCard from "./components/GlobalStatsCard";
import AdvancedFilters from "./components/AdvancedFilters";
import CallsAccordion from "./components/CallsAccordion";
import EmptyStateMessage from "./components/EmptyStateMessage";
import CallContentDialog from "./components/CallContentDialog";
import BulkOriginEditBar from "./components/BulkOriginEditBar"; // ✅ AJOUTÉ
import { AudioUploadModal } from "../AudioUploadModal";
import { TranscriptionUploadModal } from "../calls/TranscriptionUploadModal";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";

const CallListUnprepared: React.FC<CallListUnpreparedProps> = ({
  onPrepareCall,
  showMessage,
}) => {
  // Hooks de gestion des données
  const { callsByOrigin, isLoading, updateCall, removeCall } =
    useCallsData(showMessage);

  // Hooks de filtrage
  const { filters, filteredCallsByOrigin, globalStats, updateFilter } =
    useCallFilters(callsByOrigin);

  // ✅ NOUVEAU: Hook d'édition d'origine global
  const allCalls = useMemo(
    () => Object.values(filteredCallsByOrigin).flat(),
    [filteredCallsByOrigin]
  );

  const originEdit = useOriginEdit(allCalls, updateCall, showMessage);

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

  // Hooks d'actions de complément
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

  // ✅ Fonctions de conversion pour compatibilité
  const convertCallForExternalUse = (call: any) => {
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

  const convertCallForDeleteDialog = (call: any) => {
    if (!call) return null;
    return convertCallForExternalUse(call);
  };

  // ✅ Wrapper pour handleDeleteConfirm
  const handleDeleteConfirmWrapper = async (call: any) => {
    if (call) {
      await handleDeleteConfirm(call);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>Chargement des appels...</Box>
    );
  }

  return (
    <Box>
      {/* Statistiques globales */}
      <GlobalStatsCard
        stats={globalStats}
        filters={filters}
        onFilterChange={updateFilter}
      />

      {/* Filtres avancés */}
      <AdvancedFilters filters={filters} onFilterChange={updateFilter} />

      {/* ✅ NOUVELLE: Barre d'édition en lot pour l'origine */}
      <BulkOriginEditBar
        visible={originEdit.hasSelection}
        selectedCount={originEdit.selectedCount}
        isEditing={originEdit.isBulkEditing}
        isProcessing={originEdit.isProcessing}
        availableOrigins={originEdit.availableOrigins}
        pendingOrigin={originEdit.pendingOrigin}
        onStartEdit={originEdit.handleStartBulkEdit}
        onSave={originEdit.handleSaveBulkEdit}
        onCancel={originEdit.handleCancelBulkEdit}
        onOriginChange={originEdit.setPendingOrigin}
        onSelectAll={originEdit.handleSelectAll}
        isAllSelected={originEdit.isAllSelected}
      />

      {/* Liste des appels par origine */}
      {Object.keys(filteredCallsByOrigin).length > 0 ? (
        <CallsAccordion
          callsByOrigin={filteredCallsByOrigin}
          originEdit={originEdit} // ✅ AJOUTÉ
          onPrepareCall={handlePrepareCall}
          onDeleteCall={handleDeleteClick}
          onAddAudio={handleAddAudio}
          onAddTranscription={handleAddTranscription}
          onViewContent={handleViewContent}
          isDeleting={isDeleting}
          callToDelete={callToDelete}
        />
      ) : (
        <EmptyStateMessage
          hasAnyCalls={Object.keys(callsByOrigin).length > 0}
        />
      )}

      {/* Modals et Dialogs avec conversion */}
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
