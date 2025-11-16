import React from "react";
import { Typography } from "@mui/material";
import { TranscriptHeaderProps } from "./types";

const TranscriptHeader: React.FC<TranscriptHeaderProps> = ({ filename }) => {
  return (
    <Typography variant="h6" sx={{ marginBottom: 2 }}>
      Fichier : {filename}
    </Typography>
  );
};

export default TranscriptHeader;

