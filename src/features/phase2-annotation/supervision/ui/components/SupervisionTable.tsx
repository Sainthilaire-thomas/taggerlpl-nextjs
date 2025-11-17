// supervision/components/SupervisionTable.tsx
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
} from "@mui/material";
import {
  Edit,
  AudioFile,
  Assignment,
  Build,
  Warning,
  Speed, // Pour l'édition rapide
  OpenInNew, // Pour l'éditeur complet
} from "@mui/icons-material";

import { SupervisionTurnTaggedWithMeta } from "@/features/phase2-annotation/supervision/domain/types";
import { formatTime, truncateText } from "@/features/phase2-annotation/supervision/utils/formatters";
import { useProcessingJobs } from "@/features/phase2-annotation/supervision/ui/hooks/useProcessingJobs";
import TurnWithContext from "@/features/shared/ui/components/TurnWithContext";
import { useTaggingData } from "@/features/shared/context";

interface SupervisionTableProps {
  data: SupervisionTurnTaggedWithMeta[];
  onRowClick: (row: SupervisionTurnTaggedWithMeta) => void;
  onProcessingClick?: (row: SupervisionTurnTaggedWithMeta) => void;
  onQuickTagEdit?: (
    row: SupervisionTurnTaggedWithMeta,
    newTag: string,
    newNextTag?: string
  ) => Promise<void>;
}

// Composant pour l'édition rapide des tags
const QuickTagEditDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  currentTag: string;
  currentNextTag?: string;
  availableTags: Array<{ label: string; family: string; color: string }>;
  onSave: (newTag: string, newNextTag?: string) => Promise<void>;
  rowContext?: SupervisionTurnTaggedWithMeta;
}> = ({
  open,
  onClose,
  currentTag,
  currentNextTag,
  availableTags,
  onSave,
  rowContext,
}) => {
  const [selectedTag, setSelectedTag] = useState(currentTag);
  const [selectedNextTag, setSelectedNextTag] = useState(currentNextTag || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedTag, selectedNextTag || undefined);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "400px" },
      }}
    >
      <DialogTitle>🏷️ Édition Rapide - Call {rowContext?.call_id}</DialogTitle>

      <DialogContent>
        {/* Contexte résumé */}
        {rowContext && (
          <Box
            sx={{ mb: 3, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              📋 Contexte de la conversation :
            </Typography>
            <TurnWithContext
              prev2Text={rowContext.metadata?.prev2_turn_verbatim}
              prev1Text={rowContext.metadata?.prev1_turn_verbatim}
              currentText={rowContext.verbatim}
              next1Text={rowContext.metadata?.next_turn_verbatim}
              prev2Speaker={rowContext.metadata?.prev2_speaker}
              prev1Speaker={rowContext.metadata?.prev1_speaker}
              currentSpeaker={rowContext.speaker}
              next1Speaker={rowContext.metadata?.next_turn_speaker}
              currentLines={3}
            />
          </Box>
        )}

        {/* Sélection du tag principal */}
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            options={availableTags}
            groupBy={(option) => option.family}
            getOptionLabel={(option) => option.label}
            value={availableTags.find((t) => t.label === selectedTag) || null}
            onChange={(_, newValue) =>
              setSelectedTag(newValue?.label || currentTag)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tag principal"
                variant="outlined"
                fullWidth
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box
                  key={key}
                  component="li"
                  {...otherProps}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: option.color,
                    }}
                  />
                  {option.label}
                </Box>
              );
            }}
          />
        </Box>

        {/* Sélection du next_turn_tag (optionnel) */}
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            options={[
              { label: "(Aucun)", family: "", color: "" },
              ...availableTags,
            ]}
            groupBy={(option) => option.family || "Aucun"}
            getOptionLabel={(option) => option.label}
            value={
              availableTags.find((t) => t.label === selectedNextTag) || {
                label: "(Aucun)",
                family: "",
                color: "",
              }
            }
            onChange={(_, newValue) =>
              setSelectedNextTag(
                newValue?.label === "(Aucun)" ? "" : newValue?.label || ""
              )
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tag du tour suivant (optionnel)"
                variant="outlined"
                fullWidth
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box
                  key={key}
                  component="li"
                  {...otherProps}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  {option.color && (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: option.color,
                      }}
                    />
                  )}
                  {option.label}
                </Box>
              );
            }}
          />
        </Box>

        {/* Aperçu des modifications */}
        {(selectedTag !== currentTag || selectedNextTag !== currentNextTag) && (
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              📝 Modifications :
            </Typography>
            <Typography variant="body2">
              Tag principal : <strong>{currentTag}</strong> →{" "}
              <strong>{selectedTag}</strong>
            </Typography>
            {selectedNextTag !== currentNextTag && (
              <Typography variant="body2">
                Tag suivant : <strong>{currentNextTag || "(aucun)"}</strong> →{" "}
                <strong>{selectedNextTag || "(aucun)"}</strong>
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={
            saving ||
            (selectedTag === currentTag && selectedNextTag === currentNextTag)
          }
          startIcon={saving ? <CircularProgress size={16} /> : <Speed />}
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Composant principal du tableau
export const SupervisionTable: React.FC<SupervisionTableProps> = ({
  data,
  onRowClick,
  onProcessingClick,
  onQuickTagEdit,
}) => {
  const { getJob, isProcessing } = useProcessingJobs();
  const { tags } = useTaggingData();

  // État pour l'édition rapide
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditRow, setQuickEditRow] = useState<
    SupervisionTurnTaggedWithMeta | undefined
  >(undefined);

  const availableTags = tags.map((tag) => ({
    label: tag.label,
    family: tag.family || "Autres",
    color: tag.color || "#1976d2",
  }));

  // Gestion de l'édition rapide
  const handleQuickEditClick = (
    e: React.MouseEvent,
    row: SupervisionTurnTaggedWithMeta
  ) => {
    e.stopPropagation(); // Empêche le clic sur la ligne
    setQuickEditRow(row);
    setQuickEditOpen(true);
  };

  // Gestion de l'ouverture complète
  const handleFullEditClick = (
    e: React.MouseEvent,
    row: SupervisionTurnTaggedWithMeta
  ) => {
    e.stopPropagation();
    onRowClick(row);
  };

  // Sauvegarde de l'édition rapide
  const handleQuickEditSave = async (newTag: string, newNextTag?: string) => {
    if (quickEditRow && onQuickTagEdit) {
      await onQuickTagEdit(quickEditRow, newTag, newNextTag);
      setQuickEditOpen(false);
      setQuickEditRow(undefined);
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ maxHeight: "70vh" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Tags
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Call ID
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 80 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Speaker
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 420 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Contexte (−2 / −1 / 0 / +1)
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Temps
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 80 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Statut
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const job = getJob(row.call_id);
              const isCurrentlyProcessing = isProcessing(row.call_id);
              const isComplete = row.hasAudio && row.hasTranscript;

              const m: any = row.metadata ?? row.metadata_context ?? {};

              return (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    cursor: !isCurrentlyProcessing ? "pointer" : "default",
                    opacity: isCurrentlyProcessing ? 0.7 : 1,
                    backgroundColor: isCurrentlyProcessing
                      ? "action.hover"
                      : "transparent",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  {/* Tags */}
                  <TableCell>
                    <Stack
                      spacing={0.5}
                      direction="column"
                      alignItems="flex-start"
                    >
                      <Chip
                        label={row.tag}
                        size="small"
                        sx={{
                          backgroundColor: row.color,
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      {row.next_turn_tag && (
                        <Chip
                          label={`→ ${row.next_turn_tag}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: row.next_turn_color || "#1976d2",
                            color: row.next_turn_color || "#1976d2",
                            fontSize: "0.7rem",
                            height: 20,
                            backgroundColor: "rgba(25, 118, 210, 0.05)",
                          }}
                        />
                      )}
                    </Stack>
                  </TableCell>

                  {/* Call ID */}
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {row.call_id}
                    </Typography>
                    {row.filename && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {truncateText(row.filename, 25)}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Speaker */}
                  <TableCell>
                    <Chip
                      label={row.speaker}
                      size="small"
                      variant="outlined"
                      color={
                        row.speaker === "conseiller" ? "primary" : "secondary"
                      }
                      sx={{ fontSize: "0.75rem" }}
                    />
                  </TableCell>

                  {/* Contexte */}
                  <TableCell sx={{ py: 0.75 }}>
                    <TurnWithContext
                      prev2Text={m.prev2_turn_verbatim}
                      prev1Text={m.prev1_turn_verbatim}
                      currentText={row.verbatim}
                      next1Text={m.next_turn_verbatim}
                      prev2Speaker={m.prev2_speaker}
                      prev1Speaker={m.prev1_speaker}
                      currentSpeaker={row.speaker}
                      next1Speaker={m.next_turn_speaker}
                      currentLines={2}
                    />
                  </TableCell>

                  {/* Temps */}
                  <TableCell>
                    <Typography variant="caption" display="block">
                      {formatTime(row.start_time)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {formatTime(row.end_time)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="primary"
                      display="block"
                    >
                      {Math.round(row.end_time - row.start_time)}s
                    </Typography>
                  </TableCell>

                  {/* Statut */}
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        alignItems: "center",
                        flexDirection: "column",
                      }}
                    >
                      {isCurrentlyProcessing ? (
                        <Tooltip title={job?.message || "Traitement en cours"}>
                          <CircularProgress size={16} />
                        </Tooltip>
                      ) : (
                        <>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {row.hasAudio && (
                              <Tooltip title="Audio disponible">
                                <AudioFile fontSize="small" color="success" />
                              </Tooltip>
                            )}
                            {row.hasTranscript && (
                              <Tooltip title="Transcription disponible">
                                <Assignment fontSize="small" color="success" />
                              </Tooltip>
                            )}
                          </Box>
                          {(!row.hasAudio || !row.hasTranscript) && (
                            <Tooltip
                              title={`Manque: ${!row.hasAudio ? "audio" : ""} ${
                                !row.hasAudio && !row.hasTranscript ? "et " : ""
                              }${!row.hasTranscript ? "transcription" : ""}`}
                            >
                              <Warning fontSize="small" color="warning" />
                            </Tooltip>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>

                  {/* Actions - VERSION CORRIGÉE : Speed toujours visible */}
                  <TableCell>
                    {isCurrentlyProcessing ? (
                      <Typography variant="caption" color="text.secondary">
                        En traitement...
                      </Typography>
                    ) : (
                      <Box
                        sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
                      >
                        {/* Édition rapide - TOUJOURS disponible */}
                        <Tooltip title="Édition rapide du tag">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => handleQuickEditClick(e, row)}
                          >
                            <Speed />
                          </IconButton>
                        </Tooltip>

                        {/* Éditeur complet - seulement si ressources complètes */}
                        {isComplete ? (
                          <Tooltip title="Ouvrir dans l'éditeur complet">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={(e) => handleFullEditClick(e, row)}
                            >
                              <OpenInNew />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Traiter les ressources manquantes">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProcessingClick?.(row);
                              }}
                            >
                              <Build />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog d'édition rapide */}
      <QuickTagEditDialog
        open={quickEditOpen}
        onClose={() => setQuickEditOpen(false)}
        currentTag={quickEditRow?.tag || ""}
        currentNextTag={quickEditRow?.next_turn_tag}
        availableTags={availableTags}
        onSave={handleQuickEditSave}
        rowContext={quickEditRow}
      />
    </>
  );
};
