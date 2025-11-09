// src/components/calls/ui/pages/CallManagementPage.tsx - VERSION FINALE AVEC TRANSCRIPTION

import {
  Box,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
  Button,
  Typography,
} from "@mui/material";
import { useUnifiedCallManagement } from "../hooks/useUnifiedCallManagement";
import type { CallExtended } from "../../domain";
import { DebugCallLoading } from "../components/DebugCallLoading";
import { useRelationsNextTurn } from "../hooks/useRelationsNextTurn";
import { CallRelationsService } from "../../domain/services/CallRelationsService";
import { SupabaseRelationsRepository } from "../../infrastructure/supabase/SupabaseRelationsRepository";
import { useCallTranscriptionActions } from "../hooks/actions/useCallTranscriptionActions";
import { useCallAudioActions } from "../hooks/actions/useCallAudioActions";
import { useCallPreparationActions } from "../hooks/actions/useCallPreparationActions";

// ✅ IMPORT DES COMPOSANTS DE TRANSCRIPTION
import {
  TranscriptionProgressComponent,
  TranscriptionActions,
  TranscriptionResults,
} from "../components/transcription/TranscriptionProgress";

import { useCallFlags } from "../hooks/actions/useCallFlags";
import { useCallCleanup } from "../hooks/actions/useCallCleanup";
import { CMHeaderStats } from "../sections/CMHeaderStats";
import { CMFiltersBar } from "../sections/CMFiltersBar";
import { CMServiceTabs, ManagementTab } from "../sections/CMServiceTabs";
import { CMActionsBar } from "../sections/CMActionsBar";
import { CMOriginAccordions } from "../sections/CMOriginAccordions";
import { useAccordionsLazyData } from "../hooks/useAccordionsLazyData";
import { useLifecycleActions } from "../hooks/useLifecycleActions";
import { useMemo, useState, useCallback } from "react";

export function CallManagementPage() {
  const {
    calls,
    filteredCalls,
    callsByOrigin,
    selectedCallObjects,
    uniqueOrigins,
    stats,
    loading,
    error,
    filters,
    selectedCalls,
    loadCalls,
    clearError,
    toggleSelection,
    selectAll,
    clearSelection,
    selectByOrigin,
    hasSelection,
    updateFilters,
    resetFilters,
    updateConflictStatus,
    updateIsTaggingCall,
  } = useUnifiedCallManagement();

  const relationsService = useMemo(
    () => new CallRelationsService(new SupabaseRelationsRepository()),
    []
  );
  const { byId: nextTurnById, loading: relLoading } = useRelationsNextTurn(
    calls,
    { service: relationsService }
  );

  // ✅ HOOKS D'ACTIONS AVEC TRANSCRIPTION ENRICHIE
  const transcription = useCallTranscriptionActions({ reload: loadCalls });
  const audio = useCallAudioActions({ reload: loadCalls });
  const preparation = useCallPreparationActions({ reload: loadCalls });

  const flags = useCallFlags({
    reload: loadCalls,
    updateConflictStatus,
    updateIsTaggingCall,
  });
  const cleanup = useCallCleanup({ reload: loadCalls });

  const { handle: onLifecycleAction } = useLifecycleActions({
    preparation,
    flags,
    reload: loadCalls,
  });
  const { accordion, lazy, toggle, isExpanded, isLoaded, isLoading, dataFor } =
    useAccordionsLazyData(callsByOrigin);

  const [activeTab, setActiveTab] = useState<ManagementTab>("overview");

  // ✅ NOUVEAUX HANDLERS POUR LA TRANSCRIPTION
  const handleTranscribeComplete = useCallback(
    async (callIds: string[]) => {
      const callsToTranscribe = selectedCallObjects.filter((call) =>
        callIds.includes(call.id)
      );
      await transcription.transcribeCallComplete(callsToTranscribe);
    },
    [selectedCallObjects, transcription]
  );

  const handleTranscribeOnly = useCallback(
    async (callIds: string[]) => {
      const callsToTranscribe = selectedCallObjects.filter((call) =>
        callIds.includes(call.id)
      );
      await transcription.transcribeCallOnly(callsToTranscribe);
    },
    [selectedCallObjects, transcription]
  );

  const handleDiarizeOnly = useCallback(
    async (callIds: string[]) => {
      const callsToTranscribe = selectedCallObjects.filter((call) =>
        callIds.includes(call.id)
      );
      await transcription.diarizeExistingCall(callsToTranscribe);
    },
    [selectedCallObjects, transcription]
  );

  // ✅ CALCUL DES ESTIMATIONS POUR L'UI
  const transcriptionEstimates = useMemo(() => {
    if (selectedCallObjects.length === 0) return null;
    return transcription.calculateBatchEstimate(
      selectedCallObjects,
      "complete"
    );
  }, [selectedCallObjects, transcription]);

  const renderRelationStatus = useCallback(
    (callId: string) => {
      const r = nextTurnById.get(String(callId));
      if (!r) return <span>—</span>;
      const color =
        r.status === "complete"
          ? "success"
          : r.status === "partial"
          ? "warning"
          : "error";
      return (
        <span title={`${r.tagged}/${r.total} tags`}>
          <Typography variant="caption" color={color as any}>
            {r.percent}%
          </Typography>
        </span>
      );
    },
    [nextTurnById]
  );

  return (
    <Box sx={{ p: 2 }}>
      <DebugCallLoading />
      <Divider sx={{ my: 3 }} />

      <CMHeaderStats
        stats={stats}
        originsCount={Object.keys(callsByOrigin).length}
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={clearError}
          action={
            <Button color="inherit" size="small" onClick={loadCalls}>
              Réessayer
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Erreur:</strong> {error}
          </Typography>
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <CMFiltersBar
            filters={filters}
            updateFilters={updateFilters}
            resetFilters={resetFilters}
            selectAll={selectAll}
            clearSelection={clearSelection}
            uniqueOrigins={uniqueOrigins}
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 0 }}>
          <CMServiceTabs value={activeTab} onChange={setActiveTab} />
        </CardContent>
      </Card>

      {/* ✅ NOUVEAU : ZONE DE PROGRESSION TRANSCRIPTION */}
      {(transcription.isProcessing ||
        transcription.currentProgress ||
        transcription.batchProgress) && (
        <Card sx={{ mb: 2 }} variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎙️ Progression Transcription
            </Typography>

            {/* Progression individuelle */}
            <TranscriptionProgressComponent
              progress={transcription.currentProgress || undefined} // ✅ CORRECTION: null → undefined
              batchProgress={transcription.batchProgress || undefined} // ✅ CORRECTION: null → undefined
              onCancel={transcription.resetProgress}
              compact={false}
            />
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 2 }} variant="outlined">
        <CardContent>
          {/* ✅ ACTIONSBAR AVEC TRANSCRIPTION INTÉGRÉE */}
          {activeTab === "transcription" ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                🎙️ Actions de Transcription Automatique
              </Typography>

              {/* Composant d'actions de transcription */}
              <TranscriptionActions
                selectedCalls={Array.from(selectedCalls)}
                onTranscribeComplete={handleTranscribeComplete}
                onTranscribeOnly={handleTranscribeOnly}
                onDiarizeOnly={handleDiarizeOnly}
                isProcessing={transcription.isProcessing}
                disabled={loading}
                showEstimates={true}
                estimates={transcriptionEstimates || undefined} // ✅ CORRECTION: null → undefined
              />
            </Box>
          ) : (
            <CMActionsBar
              activeTab={activeTab}
              hasSelection={hasSelection}
              selectedCount={selectedCalls.size}
              loadCalls={loadCalls}
              loading={loading}
              transcription={transcription}
              audio={audio}
              preparation={preparation}
              flags={flags}
              cleanup={cleanup}
              selectedCallObjects={selectedCallObjects}
            />
          )}
        </CardContent>
      </Card>

      {/* ✅ NOUVEAU : RÉSULTATS DE TRANSCRIPTION */}
      {transcription.batchProgress?.results &&
        transcription.batchProgress.results.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <TranscriptionResults
                results={transcription.batchProgress.results}
                compact={false}
              />
            </CardContent>
          </Card>
        )}

      {Object.keys(callsByOrigin).length > 0 ? (
        <CMOriginAccordions
          callsByOrigin={callsByOrigin}
          isExpanded={isExpanded}
          isLoaded={isLoaded}
          isLoading={isLoading}
          dataFor={dataFor}
          toggle={toggle}
          selectedCalls={selectedCalls}
          toggleSelection={toggleSelection}
          selectByOrigin={selectByOrigin}
          onLifecycleAction={onLifecycleAction}
          renderRelationStatus={renderRelationStatus}
        />
      ) : (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {loading
            ? "🔄 Chargement..."
            : error
            ? "⌘ Erreur au chargement"
            : calls.length === 0
            ? "🔭 Aucun appel trouvé"
            : "🔍 Aucun résultat avec ces filtres"}
        </Alert>
      )}

      {/* ✅ NOUVEAU : ZONE D'AIDE TRANSCRIPTION */}
      {activeTab === "transcription" && !hasSelection && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>💡 Guide de Transcription Automatique</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                1. <strong>Sélectionnez</strong> des appels avec fichiers audio
                <br />
                2. <strong>Choisissez</strong> le type de traitement :<br />•{" "}
                <strong>Pipeline Complet</strong> : Transcription + Séparation
                locuteurs (recommandé)
                <br />• <strong>ASR Seulement</strong> : Transcription texte
                uniquement
                <br />• <strong>Diarisation</strong> : Ajout des locuteurs sur
                transcription existante
                <br />
                3. <strong>Suivez</strong> le progrès en temps réel
                <br />
                4. <strong>Validez</strong> les résultats avant utilisation
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
