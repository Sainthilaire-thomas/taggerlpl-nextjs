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
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>Call ID</TableCell>
            <TableCell>Speaker</TableCell>
            <TableCell>Verbatim</TableCell>
            <TableCell>Next Turn</TableCell>
            <TableCell>Temps</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Actions</TableCell>
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
                }}
                onClick={() => handleTableRowClick(row)}
              >
                <TableCell>
                  <Chip
                    label={row.tag}
                    size="small"
                    sx={{
                      backgroundColor: row.color,
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.call_id}</Typography>
                  {row.filename && (
                    <Typography variant="caption" color="text.secondary">
                      {truncateText(row.filename, 30)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.speaker}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {truncateText(row.verbatim, 80)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {truncateText(row.next_turn_verbatim, 60)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {formatTime(row.start_time)} - {formatTime(row.end_time)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    {isCurrentlyProcessing ? (
                      <Tooltip title={job?.message || "Traitement en cours"}>
                        <CircularProgress size={16} />
                      </Tooltip>
                    ) : (
                      <>
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
