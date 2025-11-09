// src/app/(protected)/phase2-annotation/page.tsx
"use client";

import React from "react";
import { Box, Typography, Paper, Button, Chip } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Phase2DashboardPage() {
  const router = useRouter();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">
          Phase 2 - Annotation & Tagging
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => router.push("/phase2-annotation/tags-management")}
          >
            Gestion Tags
          </Button>
          <Button 
            variant="outlined"
            onClick={() => router.push("/phase2-annotation/supervision")}
          >
            Supervision
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Appels à annoter
        </Typography>
        <Typography variant="body2" color="text.secondary">
          TODO: Liste des appels prêts pour annotation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          - Tableau avec filtres (statut, date, annotateur)
          - Clic sur appel → /phase2-annotation/transcript/[callId]
          - Statistiques de progression
        </Typography>
      </Paper>
    </Box>
  );
}