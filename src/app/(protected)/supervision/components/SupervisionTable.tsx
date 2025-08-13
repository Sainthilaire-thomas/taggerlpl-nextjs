import React from "react";
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
} from "@mui/material";
import {
  Edit,
  Visibility,
  AudioFile,
  Assignment,
  Build,
  Warning,
} from "@mui/icons-material";
import { SupervisionTurnTagged } from "../types";
import { formatTime, truncateText } from "../utils/formatters";
import { useProcessingJobs } from "../hooks/useProcessingJobs";

interface SupervisionTableProps {
  data: SupervisionTurnTagged[];
  onRowClick: (row: SupervisionTurnTagged) => void;
  onProcessingClick?: (row: SupervisionTurnTagged) => void;
}

// Composant pour afficher les verbatims de manière compacte
const VerbatimDisplay: React.FC<{
  verbatim: string;
  tag: string;
  color: string;
  maxLength?: number;
}> = ({ verbatim, tag, color, maxLength = 60 }) => {
  const truncated = truncateText(verbatim, maxLength);

  return (
    <Tooltip title={`${tag}: "${verbatim}"`} arrow placement="top">
      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          backgroundColor: `${color}15`, // Couleur très légère
          borderLeft: `3px solid ${color}`,
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          cursor: "help",
          "&:hover": {
            backgroundColor: `${color}25`,
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontSize: "0.875rem", lineHeight: 1.2 }}
        >
          {truncated}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// Composant pour les tags avec couleurs
const TagChips: React.FC<{
  tag: string;
  nextTurnTag?: string;
  color: string;
  nextTurnColor?: string;
}> = ({ tag, nextTurnTag, color, nextTurnColor }) => {
  return (
    <Stack spacing={0.5} direction="column" alignItems="flex-start">
      <Chip
        label={tag}
        size="small"
        sx={{
          backgroundColor: color,
          color: "white",
          fontWeight: "bold",
          fontSize: "0.75rem",
          height: 24,
        }}
      />
      {nextTurnTag && (
        <Chip
          label={`→ ${nextTurnTag}`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: nextTurnColor || "#1976d2",
            color: nextTurnColor || "#1976d2",
            fontSize: "0.7rem",
            height: 20,
            backgroundColor: "rgba(25, 118, 210, 0.05)",
          }}
        />
      )}
    </Stack>
  );
};

export const SupervisionTable: React.FC<SupervisionTableProps> = ({
  data,
  onRowClick,
  onProcessingClick,
}) => {
  const { getJob, isProcessing } = useProcessingJobs();

  const handleTableRowClick = (row: SupervisionTurnTagged) => {
    if (isProcessing(row.call_id)) return;

    if (row.hasAudio && row.hasTranscript) {
      onRowClick(row);
    } else if (onProcessingClick) {
      onProcessingClick(row);
    }
  };

  return (
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
            <TableCell sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Tour Principal
              </Typography>
            </TableCell>
            <TableCell sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Tour Suivant
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
            <TableCell sx={{ minWidth: 80 }}>
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
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
                onClick={() => handleTableRowClick(row)}
              >
                {/* Colonne Tags */}
                <TableCell>
                  <TagChips
                    tag={row.tag}
                    nextTurnTag={row.next_turn_tag}
                    color={row.color}
                    nextTurnColor={row.next_turn_color}
                  />
                </TableCell>

                {/* Colonne Call ID */}
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

                {/* Colonne Speaker */}
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

                {/* Colonne Tour Principal */}
                <TableCell>
                  <VerbatimDisplay
                    verbatim={row.verbatim}
                    tag={row.tag}
                    color={row.color}
                    maxLength={80}
                  />
                </TableCell>

                {/* Colonne Tour Suivant */}
                <TableCell>
                  {row.next_turn_verbatim && (
                    <VerbatimDisplay
                      verbatim={row.next_turn_verbatim}
                      tag={row.next_turn_tag || "Non taggé"}
                      color={row.next_turn_color || "#9e9e9e"}
                      maxLength={80}
                    />
                  )}
                </TableCell>

                {/* Colonne Temps */}
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
                  <Typography variant="caption" color="primary" display="block">
                    {Math.round(row.end_time - row.start_time)}s
                  </Typography>
                </TableCell>

                {/* Colonne Statut */}
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

                {/* Colonne Actions */}
                <TableCell>
                  {isCurrentlyProcessing ? (
                    <Typography variant="caption" color="text.secondary">
                      En traitement...
                    </Typography>
                  ) : isComplete ? (
                    <Tooltip title="Ouvrir dans l'éditeur de tagging">
                      <IconButton size="small" color="primary">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Traiter les ressources manquantes">
                      <IconButton size="small" color="warning">
                        <Build />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
