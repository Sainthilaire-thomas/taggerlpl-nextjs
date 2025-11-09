// src/app/(protected)/phase2-annotation/transcript/[callId]/page.tsx
"use client";

import TranscriptLPL from "@/features/phase2-annotation/transcript";
import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface TaggerPageProps {
  params: {
    callId: string;
  };
}

export default function TaggerPage({ params }: TaggerPageProps) {
  const router = useRouter();

  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/phase2-annotation")}
        >
          Retour à la liste
        </Button>
      </Box>
      <TranscriptLPL callId={params.callId} />
    </Box>
  );
}