import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import { TranscriptAudioPlayerProps } from "./types";

const TranscriptAudioPlayer: React.FC<TranscriptAudioPlayerProps> = ({
  audioSrc,
  playerRef,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        width: "100%",
      }}
    >
      {audioSrc ? (
        <>
          <IconButton>
            <NoteAddIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, width: "100%" }}>
            <audio
              controls
              src={audioSrc}
              ref={playerRef}
              style={{ width: "100%" }}
            />
          </Box>
        </>
      ) : (
        <Typography variant="body2">Aucun audio disponible</Typography>
      )}
    </Box>
  );
};

export default TranscriptAudioPlayer;

