// components/AlgorithmLab/algorithms/M3Calculators/M3ValidationInterface.tsx
"use client";
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Psychology as PsychologyIcon,
  PlayArrow as RunIcon,
  FilterList as FilterIcon,
  HourglassEmpty as PauseIcon,
  RecordVoiceOver as HesitationIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

import { useTaggingData } from "@/context/TaggingDataContext";
import { useM3AlgorithmTesting } from "../../../../hooks/level1/useM3AlgorithmTesting";
import type { M3Details } from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type { CalculationResult } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

type Row = {
  id: string | number;
  clientTurn: string;
};

export default function M3ValidationInterface() {
  const { allTurnTagged, loadingGlobalData, errorGlobalData } =
    useTaggingData();
  const { isRunning, run, results, avgScore, metadata } =
    useM3AlgorithmTesting();

  // -----------------------------
  // Échantillon: tours CLIENT
  // -----------------------------
  const sample: Row[] = useMemo(() => {
    const rows = (allTurnTagged || [])
      .filter((t: any) => {
        const speaker = String(t?.speaker || "").toLowerCase();
        // Heuristique: on garde les tours client
        const isClient =
          speaker.includes("client") ||
          speaker.includes("cli") ||
          speaker === "c";
        return (
          isClient &&
          typeof t?.verbatim === "string" &&
          t.verbatim.trim().length > 0
        );
      })
      .slice(0, 600)
      .map((t: any) => ({
        id: t.id ?? crypto.randomUUID(),
        clientTurn: t.verbatim as string,
      }));
    return rows;
  }, [allTurnTagged]);

  // -----------------------------
  // Filtres d'affichage
  // -----------------------------
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "score" | "pauses" | "hesitations" | "speechRate"
  >("score");

  const filteredResults = useMemo(() => {
    const arr = (results as CalculationResult<M3Details>[]) || [];
    const withIndex = arr.map((r, i) => ({ r, i }));

    const searched = search.trim()
      ? withIndex.filter(({ r }) => {
          const metadata = r.metadata as any; // Cast temporaire
          const verbatim = metadata?.verbatim || "";
          const clientTurn = metadata?.clientTurn || "";
          const searchText = (verbatim + " " + clientTurn).toLowerCase();
          return searchText.includes(search.toLowerCase());
        })
      : withIndex;

    const thresholded = searched.filter(({ r }) => (r.score ?? 0) >= minScore);

    const sorted = thresholded.sort((a, b) => {
      const da = a.r.details || ({} as M3Details);
      const db = b.r.details || ({} as M3Details);
      switch (sortBy) {
        case "pauses":
          return (db.pauseCount ?? 0) - (da.pauseCount ?? 0);
        case "hesitations":
          return (db.hesitationCount ?? 0) - (da.hesitationCount ?? 0);
        case "speechRate":
          return (db.speechRate ?? 0) - (da.speechRate ?? 0);
        case "score":
        default:
          return (b.r.score ?? 0) - (a.r.score ?? 0);
      }
    });

    return sorted.map(({ r }) => r);
  }, [results, minScore, search, sortBy]);

  // -----------------------------
  // Rendu
  // -----------------------------
  return (
    <Stack gap={2}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <PsychologyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            {metadata?.name || "Calculateur M3"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metadata?.description ||
              "Estimation de la charge cognitive (pauses, hésitations, débit, etc.)"}
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={2}
            alignItems="center"
            sx={{ mt: 2 }}
          >
            <Button
              variant="contained"
              startIcon={<RunIcon />}
              disabled={loadingGlobalData || isRunning || sample.length === 0}
              onClick={() =>
                run(
                  sample.map((s) => ({
                    id: s.id,
                    clientTurn: s.clientTurn,
                  }))
                )
              }
            >
              Lancer le test M3 ({sample.length})
            </Button>

            {(loadingGlobalData || isRunning) && (
              <Box sx={{ flex: 1, width: "100%" }}>
                <LinearProgress />
              </Box>
            )}

            {errorGlobalData && (
              <Typography color="error" variant="body2">
                {String(errorGlobalData)}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {avgScore !== null && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1">
              Score moyen M3 : {avgScore.toFixed(3)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Score normalisé entre 0 et 1. À affiner selon tes pondérations.)
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Filtres d’affichage */}
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Stack sx={{ minWidth: 220 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <FilterIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Score minimum
            </Typography>
            <Slider
              value={minScore}
              onChange={(_, v) => setMinScore(v as number)}
              step={0.05}
              min={0}
              max={1}
              valueLabelDisplay="auto"
            />
          </Stack>

          <TextField
            label="Recherche texte (client)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
          />

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Tri</InputLabel>
            <Select
              label="Tri"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="score">Score (desc)</MenuItem>
              <MenuItem value="pauses">Pauses (desc)</MenuItem>
              <MenuItem value="hesitations">Hésitations (desc)</MenuItem>
              <MenuItem value="speechRate">Débit (asc→desc)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Tableau des résultats */}
      {filteredResults.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="40%">Tour Client</TableCell>
                <TableCell align="right" width="8%">
                  Score
                </TableCell>
                <TableCell align="right" width="8%">
                  <PauseIcon
                    fontSize="small"
                    sx={{ mr: 0.5, verticalAlign: "middle" }}
                  />
                  Pauses
                </TableCell>
                <TableCell align="right" width="10%">
                  <HesitationIcon
                    fontSize="small"
                    sx={{ mr: 0.5, verticalAlign: "middle" }}
                  />
                  Hésitations
                </TableCell>
                <TableCell align="right" width="12%">
                  <SpeedIcon
                    fontSize="small"
                    sx={{ mr: 0.5, verticalAlign: "middle" }}
                  />
                  Débit (m/s)
                </TableCell>
                <TableCell width="22%">Marqueurs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(filteredResults as CalculationResult<M3Details>[])
                .slice(0, 200)
                .map((r, idx) => {
                  const d = r.details || ({} as M3Details);
                  const fullText = (() => {
                    const metadata = r.metadata as any; // Cast temporaire
                    return metadata?.verbatim || metadata?.clientTurn || "";
                  })();

                  const shortText =
                    fullText.length > 140
                      ? fullText.slice(0, 140) + "…"
                      : fullText;
                  return (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 520 }}>
                          {shortText || <em>(vide)</em>}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={(r.score ?? 0).toFixed(3)}
                          size="small"
                          color={
                            (r.score ?? 0) >= 0.7
                              ? "error"
                              : (r.score ?? 0) >= 0.4
                              ? "warning"
                              : "success"
                          }
                        />
                      </TableCell>
                      <TableCell align="right">{d.pauseCount ?? 0}</TableCell>
                      <TableCell align="right">
                        {d.hesitationCount ?? 0}
                      </TableCell>
                      <TableCell align="right">
                        {d.speechRate != null ? d.speechRate.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {((r as any).markers || (d as any).markers || [])
                            .slice(0, 6)
                            .map((m: string, i: number) => (
                              <Chip
                                key={i}
                                size="small"
                                label={m}
                                variant="outlined"
                              />
                            ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          {filteredResults.length > 200 && (
            <Box sx={{ p: 1, textAlign: "center", color: "text.secondary" }}>
              (Affichage limité aux 200 premières lignes)
            </Box>
          )}
        </TableContainer>
      )}

      {/* Message d'état */}
      {!isRunning && filteredResults.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          {results.length === 0 ? (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun résultat pour l’instant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prépare l’échantillon (tours client) puis lance le test M3.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun résultat après filtres
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dessers le score minimum ou réinitialise la recherche.
              </Typography>
            </>
          )}
        </Paper>
      )}
    </Stack>
  );
}
