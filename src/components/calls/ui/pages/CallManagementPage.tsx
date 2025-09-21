// src/components/calls/ui/pages/CallManagementPage.tsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Checkbox,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  PlayArrow,
  Upload,
  Download,
  Build,
  Delete,
  CleaningServices,
  Description,
  AudioFile,
} from "@mui/icons-material";

import { useCallManagement } from "../hooks/useCallManagement";
import { useRelationsNextTurn } from "../hooks/useRelationsNextTurn";
import { CallRelationsService } from "../../domain/services/CallRelationsService";
import { SupabaseRelationsRepository } from "../../infrastructure/supabase/SupabaseRelationsRepository";

// 🧰 Nouveaux hooks d’actions (UX-only, appellent tes workflows/services existants)
import { useCallTranscriptionActions } from "../hooks/actions/useCallTranscriptionActions";
import { useCallAudioActions } from "../hooks/actions/useCallAudioActions";
import { useCallPreparationActions } from "../hooks/actions/useCallPreparationActions";
import { useCallFlags } from "../hooks/actions/useCallFlags";
import { useCallCleanup } from "../hooks/actions/useCallCleanup";

export const CallManagementPage: React.FC = () => {
  const {
    calls,
    loading,
    error,
    stats,
    selectedCalls,
    selectedCount,
    hasSelection,
    loadCalls,
    toggleCallSelection,
    clearSelection,
  } = useCallManagement();

  // Relations (inchangé)
  const relationsService = React.useMemo(
    () => new CallRelationsService(new SupabaseRelationsRepository()),
    []
  );
  const { byId: nextTurnById, loading: relLoading } = useRelationsNextTurn(
    calls,
    { service: relationsService }
  );

  // Onglets “services”
  const [tab, setTab] = React.useState(0);

  // Actions par service
  const transcription = useCallTranscriptionActions({ reload: loadCalls });
  const audio = useCallAudioActions({ reload: loadCalls });
  const preparation = useCallPreparationActions({ reload: loadCalls });
  const flags = useCallFlags({ reload: loadCalls });
  const cleanup = useCallCleanup({ reload: loadCalls });

  // Helpers
  const selected = React.useMemo(
    () => calls.filter((c) => selectedCalls.has(c.id)),
    [calls, selectedCalls]
  );

  const renderRelations = (id: string) => {
    const r = nextTurnById.get(String(id));
    if (!r) return <Chip size="small" label={relLoading ? "…" : "—"} />;
    const color =
      r.status === "complete"
        ? "success"
        : r.status === "partial"
        ? "warning"
        : "error";
    return <Chip size="small" color={color as any} label={`${r.percent}%`} />;
  };

  return (
    <Box>
      <Box mb={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Typography variant="h5">Gestion des Appels</Typography>
        {stats && (
          <>
            <Chip label={`${stats.total} appels`} color="primary" />
            <Chip label={`${stats.readyForTagging} prêts`} color="success" />
            <Chip label={`${stats.completeness}% complétude`} color="info" />
            {hasSelection && (
              <Chip label={`${selectedCount} sélectionnés`} color="warning" />
            )}
          </>
        )}
        <Box ml="auto" display="flex" gap={1}>
          <Button onClick={loadCalls} variant="outlined">
            Actualiser
          </Button>
          {hasSelection && (
            <Button onClick={clearSelection}>Désélectionner</Button>
          )}
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Onglets = Services */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 0 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab label="Aperçu" />
            <Tab
              label="Transcription"
              icon={<Description fontSize="small" />}
              iconPosition="start"
            />
            <Tab
              label="Audio"
              icon={<AudioFile fontSize="small" />}
              iconPosition="start"
            />
            <Tab
              label="Préparation"
              icon={<Build fontSize="small" />}
              iconPosition="start"
            />
            <Tab label="Flags / Statuts" />
            <Tab
              label="Nettoyage"
              icon={<CleaningServices fontSize="small" />}
              iconPosition="start"
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Barre d’actions contextuelles par onglet */}
      <Card sx={{ mb: 2 }} variant="outlined">
        <CardContent>
          {tab === 0 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label="Cockpit de pilotage : utilisez les autres onglets pour agir."
                variant="outlined"
              />
            </Box>
          )}

          {tab === 1 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Upload />}
                disabled={!hasSelection}
                onClick={() => transcription.uploadJSONFor(selected)}
              >
                Importer JSON transcription
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                disabled={!hasSelection}
                onClick={() => transcription.viewJSONFor(selected)}
              >
                Afficher / éditer JSON
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                disabled={!hasSelection}
                onClick={() => transcription.autoTranscribe(selected)}
              >
                Transcrire automatiquement
              </Button>
            </Box>
          )}

          {tab === 2 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Upload />}
                disabled={!hasSelection}
                onClick={() => audio.uploadFilesFor(selected)}
              >
                Uploader audio
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                disabled={!hasSelection}
                onClick={() => audio.generateSignedLinks(selected)}
              >
                Liens audio (signés)
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                disabled={!hasSelection}
                onClick={() => audio.validateAudio(selected)}
              >
                Valider audio
              </Button>
            </Box>
          )}

          {tab === 3 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<Build />}
                disabled={!hasSelection}
                onClick={() => preparation.prepareForTagging(selected)}
              >
                Préparer pour le tagging (JSON → word)
              </Button>
              <Button
                variant="outlined"
                disabled={!hasSelection}
                onClick={() => preparation.markPrepared(selected)}
              >
                Marquer “preparedfortranscript = true”
              </Button>
            </Box>
          )}

          {tab === 4 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                disabled={!hasSelection}
                onClick={() => flags.setConflictStatus(selected, "conflictuel")}
              >
                Marquer conflictuel
              </Button>
              <Button
                variant="outlined"
                disabled={!hasSelection}
                onClick={() =>
                  flags.setConflictStatus(selected, "non_conflictuel")
                }
              >
                Marquer non-conflictuel
              </Button>
              <Button
                variant="outlined"
                disabled={!hasSelection}
                onClick={() => flags.setTagging(selected, true)}
              >
                IsTaggingCall = true
              </Button>
              <Button
                variant="outlined"
                disabled={!hasSelection}
                onClick={() => flags.setTagging(selected, false)}
              >
                IsTaggingCall = false
              </Button>
            </Box>
          )}

          {tab === 5 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                color="warning"
                variant="outlined"
                startIcon={<CleaningServices />}
                disabled={!hasSelection}
                onClick={() => cleanup.purgeWord(selected)}
              >
                Purger WORD (temporaire)
              </Button>
              <Button
                color="error"
                variant="outlined"
                startIcon={<Delete />}
                disabled={!hasSelection}
                onClick={() => cleanup.purgeAudioIfTagged(selected)}
              >
                Supprimer audio (si déjà taggé)
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tableau minimal (on garde ton rendu de base) */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    {/* à la carte, tu peux ajouter une sélection globale si besoin */}
                  </TableCell>
                  <TableCell>Fichier</TableCell>
                  <TableCell>Contenu</TableCell>
                  <TableCell>Relations</TableCell>
                  <TableCell>Créé le</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calls.map((call) => (
                  <TableRow
                    key={call.id}
                    hover
                    selected={selectedCalls.has(call.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedCalls.has(call.id)}
                        onChange={() => toggleCallSelection(call.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {call.filename || "Sans nom"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {call.hasValidAudio() && (
                          <Chip size="small" label="Audio" color="primary" />
                        )}
                        {call.hasValidTranscription() && (
                          <Chip
                            size="small"
                            label="Transcription"
                            color="secondary"
                          />
                        )}
                        {call.isReadyForTagging?.() && (
                          <Chip
                            size="small"
                            label="Prepared"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{renderRelations(call.id)}</TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {call.createdAt instanceof Date
                          ? call.createdAt.toLocaleDateString()
                          : new Date(
                              call.createdAt as any
                            ).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {calls.length === 0 && !loading && (
              <Box py={4} textAlign="center">
                <Typography color="text.secondary">Aucun appel.</Typography>
              </Box>
            )}
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
