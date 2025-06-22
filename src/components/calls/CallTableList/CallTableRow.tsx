"use client";

import { useState } from "react";
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Stack,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  AudioFile as AudioFileIcon,
  VolumeOff as NoAudioIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Call } from "./types";
import { formatDuration, getStatusColor } from "./utils";

interface CallTableRowProps {
  call: Call;
  index: number;
  editingOrigine: string | null;
  onStartEditOrigine: (callid: string) => void;
  onSaveOrigine: (callid: string, newOrigine: string) => void;
  onCancelEditOrigine: () => void;
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
}

const CallTableRow = ({
  call,
  index,
  editingOrigine,
  onStartEditOrigine,
  onSaveOrigine,
  onCancelEditOrigine,
  onCallClick,
  onDeleteClick,
}: CallTableRowProps) => {
  // 🚀 OPTIMISATION - État local pour l'édition d'origine
  const [localTempOrigine, setLocalTempOrigine] = useState("");
  const isEditing = editingOrigine === call.callid;

  const handleStartEdit = () => {
    setLocalTempOrigine(call.origine || "");
    onStartEditOrigine(call.callid);
  };

  const handleSave = () => {
    onSaveOrigine(call.callid, localTempOrigine);
    setLocalTempOrigine("");
  };

  const handleCancel = () => {
    setLocalTempOrigine("");
    onCancelEditOrigine();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <TableRow
      hover
      sx={{
        backgroundColor: index % 2 === 0 ? "action.hover" : "inherit",
        "&:hover": {
          backgroundColor: "action.selected",
        },
      }}
    >
      <TableCell>
        <Box>
          <Typography variant="body2" noWrap>
            {call.filename || "Sans nom"}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ID: {String(call.callid).substring(0, 8)}...
          </Typography>
        </Box>
      </TableCell>

      <TableCell align="center">
        {call.upload ? (
          <Tooltip title="Audio disponible">
            <AudioFileIcon color="primary" />
          </Tooltip>
        ) : (
          <Tooltip title="Pas d'audio">
            <NoAudioIcon color="disabled" />
          </Tooltip>
        )}
      </TableCell>

      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <TimeIcon fontSize="small" color="action" />
          <Typography variant="body2">{formatDuration(call.duree)}</Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Chip
          size="small"
          label={call.status || "Non supervisé"}
          color={getStatusColor(call.status)}
          variant="outlined"
        />
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              size="small"
              value={localTempOrigine}
              onChange={(e) => setLocalTempOrigine(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              sx={{ minWidth: 100 }}
            />
            <IconButton size="small" color="primary" onClick={handleSave}>
              ✓
            </IconButton>
            <IconButton size="small" onClick={handleCancel}>
              ✗
            </IconButton>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              "&:hover": { backgroundColor: "action.hover" },
              p: 0.5,
              borderRadius: 1,
            }}
            onClick={handleStartEdit}
          >
            <Typography variant="body2">
              {call.origine || "Non définie"}
            </Typography>
            <Tooltip title="Cliquez pour éditer">
              <EditIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
        )}
      </TableCell>

      <TableCell>
        <Tooltip title={call.description || "Pas de description"}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <DescriptionIcon fontSize="small" color="action" />
            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
              {call.description || "Pas de description"}
            </Typography>
          </Box>
        </Tooltip>
      </TableCell>

      <TableCell align="center">
        <Stack direction="row" spacing={1} justifyContent="center">
          <Tooltip
            title={call.upload ? "Écouter l'appel" : "Audio non disponible"}
          >
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onCallClick(call)}
                disabled={!call.upload}
              >
                <PlayIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Supprimer l'appel">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDeleteClick(call)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export default CallTableRow;
