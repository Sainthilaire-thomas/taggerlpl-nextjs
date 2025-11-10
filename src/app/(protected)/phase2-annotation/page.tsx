// src/app/(protected)/phase2-annotation/page.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function Phase2DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection vers l'interface d'annotation fonctionnelle
    router.push("/new-tagging");
  }, [router]);

  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>
        Redirection vers l'interface d'annotation...
      </Typography>
    </Box>
  );
}