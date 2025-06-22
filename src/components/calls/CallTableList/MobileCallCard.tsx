"use client";

import {
  Paper,
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Button,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  AudioFile as AudioFileIcon,
  VolumeOff as NoAudioIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { Call } from "./types";
import { formatDuration, getStatusColor } from "./utils";

interface MobileCallCardProps {
  call: Call;
  isExpanded: boolean;
  onToggleExpansion: (callid: string) => void;
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
}

const MobileCallCard = ({
  call,
  isExpanded,
  onToggleExpansion,
  onCallClick,
  onDeleteClick,
}: MobileCallCardProps) => {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {call.filename || "Sans nom"}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              size="small"
              label={call.status || "Non supervisé"}
              color={getStatusColor(call.status)}
            />
            {call.upload ? (
              <Chip
                size="small"
                icon={<AudioFileIcon />}
                label="Audio"
                color="primary"
              />
            ) : (
              <Chip size="small" icon={<NoAudioIcon />} label="Pas d'audio" />
            )}
            {call.duree && (
              <Chip
                size="small"
                icon={<TimeIcon />}
                label={formatDuration(call.duree)}
              />
            )}
          </Stack>
        </Box>
        <IconButton size="small" onClick={() => onToggleExpansion(call.callid)}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          {call.description && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {call.description}
            </Typography>
          )}
          <Typography
            variant="caption"
            display="block"
            color="textSecondary"
            sx={{ mb: 1 }}
          >
            ID: {String(call.callid).substring(0, 8)}...
          </Typography>
          {call.origine && (
            <Typography
              variant="caption"
              display="block"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              Origine: {call.origine}
            </Typography>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => onCallClick(call)}
              disabled={!call.upload}
            >
              Écouter
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDeleteClick(call)}
            >
              Supprimer
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default MobileCallCard;
