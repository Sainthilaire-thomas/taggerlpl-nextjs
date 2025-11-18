"use client";

import { Box, Typography, Paper } from "@mui/material";
import { CallsListTable } from "@/features/phase2-annotation/transcript/components/CallsListTable";

export default function TranscriptListPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: "background.default" }}>
        <Typography variant="h4" gutterBottom>
          Sélectionner un appel pour le tagging
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Choisissez un appel dans la liste ci-dessous pour commencer ou continuer le tagging.
        </Typography>
      </Paper>
      <CallsListTable />
    </Box>
  );
}
