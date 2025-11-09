// src/app/(protected)/phase2-annotation/supervision/page.tsx
"use client";

import { SupervisionDashboard } from "@/features/phase2-annotation/supervision/ui/components/SupervisionDashboard";
import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function SupervisionPage() {
  const router = useRouter();

  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/phase2-annotation")}
        >
          Retour au dashboard
        </Button>
      </Box>
      <SupervisionDashboard />
    </Box>
  );
}