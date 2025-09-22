// src/components/calls/ui/sections/CMActionsBar.tsx
import { Box, Button, Chip, Typography } from "@mui/material";
import {
  Refresh,
  Upload,
  Visibility,
  PlayArrow,
  CheckCircle,
  Build,
  Download,
} from "@mui/icons-material";
import { ManagementTab } from "./CMServiceTabs";

export function CMActionsBar({
  activeTab,
  hasSelection,
  selectedCount,
  loadCalls,
  loading,
  transcription,
  audio,
  preparation,
  flags,
  cleanup,
  selectedCallObjects,
}: any) {
  const Actions = () => {
    switch (activeTab as ManagementTab) {
      case "overview":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadCalls}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Box>
        );
      case "transcription":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Upload />}
              disabled={!hasSelection}
              onClick={() => transcription.uploadJSONFor(selectedCallObjects)}
            >
              Importer JSON ({selectedCount})
            </Button>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              disabled={!hasSelection}
              onClick={() => transcription.viewJSONFor(selectedCallObjects)}
            >
              Voir/Éditer JSON
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              disabled={!hasSelection}
              onClick={() => transcription.autoTranscribe(selectedCallObjects)}
            >
              Transcrire Auto
            </Button>
          </Box>
        );
      case "audio":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Upload />}
              disabled={!hasSelection}
              onClick={() => audio.uploadFilesFor(selectedCallObjects)}
            >
              Uploader Audio ({selectedCount})
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              disabled={!hasSelection}
              onClick={() => audio.generateSignedLinks(selectedCallObjects)}
            >
              URLs Signées
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              disabled={!hasSelection}
              onClick={() => audio.validateAudio(selectedCallObjects)}
            >
              Valider Audio
            </Button>
          </Box>
        );
      case "preparation":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Build />}
              disabled={!hasSelection}
              onClick={() => preparation.prepareForTagging(selectedCallObjects)}
            >
              Préparer ({selectedCount})
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => preparation.markPrepared(selectedCallObjects)}
            >
              Marquer Préparé
            </Button>
          </Box>
        );
      case "flags":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Build />}
              disabled={!hasSelection}
              onClick={() => preparation.prepareForTagging(selectedCallObjects)}
            >
              Préparer ({selectedCount})
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() =>
                flags.setConflictStatus(selectedCallObjects, "conflictuel")
              }
            >
              → Conflictuel
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() =>
                flags.setConflictStatus(selectedCallObjects, "non_conflictuel")
              }
            >
              → Non-conflictuel
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => flags.setTagging(selectedCallObjects, true)}
            >
              Activer Tagging
            </Button>
            <Button
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => flags.setTagging(selectedCallObjects, false)}
            >
              Désactiver Tagging
            </Button>
          </Box>
        );
      case "cleanup":
        return (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              color="warning"
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => cleanup.purgeWord(selectedCallObjects)}
            >
              Purger WORD ({selectedCount})
            </Button>
            <Button
              color="error"
              variant="outlined"
              disabled={!hasSelection}
              onClick={() => cleanup.purgeAudioIfTagged(selectedCallObjects)}
            >
              Supprimer Audio (si taggé)
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
    >
      <Typography variant="h6">
        Actions -{" "}
        {String(activeTab).charAt(0).toUpperCase() + String(activeTab).slice(1)}
        {hasSelection && (
          <Chip label={`${selectedCount} sélectionnés`} sx={{ ml: 1 }} />
        )}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Actions />
      </Box>
    </Box>
  );
}
