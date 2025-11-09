// src/app/(protected)/phase2-annotation/tags-management/page.tsx
"use client";

import React from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function TagsManagementPage() {
  const router = useRouter();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/phase2-annotation")}
        >
          Retour au dashboard
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom>
        Gestion du Référentiel de Tags
      </Typography>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body1" gutterBottom>
          TODO: Interface de gestion du référentiel de tags
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fonctionnalités à implémenter :
        </Typography>
        <ul>
          <li>Créer/modifier/supprimer des tags</li>
          <li>Organiser la hiérarchie des tags</li>
          <li>Statistiques d'utilisation par tag</li>
          <li>Import/export du référentiel</li>
          <li>Validation et cohérence des tags</li>
        </ul>
      </Paper>
    </Box>
  );
}