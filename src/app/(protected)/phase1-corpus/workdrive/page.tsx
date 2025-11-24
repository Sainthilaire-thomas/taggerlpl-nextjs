// src/app/(protected)/phase1-corpus/workdrive/page.tsx
"use client";
import { Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";
import SimpleWorkdriveExplorer from "@/features/phase1-corpus/workdrive";

function WorkdriveContent() {
  return (
    <SimpleWorkdriveExplorer
      onFilesSelect={() => {
        // Handler vide - cette page est pour exploration uniquement
      }}
    />
  );
}

export default function WorkDrivePage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      }
    >
      <WorkdriveContent />
    </Suspense>
  );
}
