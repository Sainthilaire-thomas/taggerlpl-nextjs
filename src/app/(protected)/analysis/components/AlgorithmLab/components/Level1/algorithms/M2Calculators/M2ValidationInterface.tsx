// components/AlgorithmLab/algorithms/M2Calculators/M2ValidationInterface.tsx
"use client";
import React from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  LinearProgress,
  Box,
} from "@mui/material";
// import { useM2AlgorithmTesting } from "@/app/(protected)/analysis/components/AlgorithmLab/hooks/level1/useM2AlgorithmTesting";

export default function M2ValidationInterface() {
  // const { isRunning, run, avgScore, results, metadata } = useM2AlgorithmTesting();
  const isRunning = false;
  const avgScore: number | null = null;

  return (
    <Stack gap={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">Calculateur M2 (Alignement)</Typography>
          <Typography variant="body2" color="text.secondary">
            Score d’alignement lexical/semantic (T0 ↔ T+1)
          </Typography>
          <Box mt={2}>
            <Button variant="contained" disabled>
              Lancer un test M2 (à brancher)
            </Button>
          </Box>
          {isRunning && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {typeof avgScore === "number" && (
        <Card>
          <CardContent>
            <Typography>Score moyen M2 : {avgScore.toFixed(3)}</Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
