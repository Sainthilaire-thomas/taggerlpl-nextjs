// src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/results/x/ResultsTableX.tsx
"use client";

import * as React from "react";
import {
  Chip,
  Box,
  Stack,
  Typography,
  TableRow,
  TableCell,
} from "@mui/material";

import ResultsTableBase from "../base/ResultsTableBase";
import type { XValidationResult } from "@/types/algorithm-lab";
import {
  VARIABLE_LABELS,
  VARIABLE_COLORS,
} from "@/types/algorithm-lab";

export interface ResultsTableXProps {
  items: XValidationResult[];
  // slots optionnels (ex: filtres avancés, métriques)
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  showPagination?: boolean;
}

/**
 * Table spécialisée X (stratégies conseiller)
 * Colonnes: Verbatim, Gold, Prédit, Confiance, Correct, Temps (ms), Call ID
 */
export default function ResultsTableX({
  items,
  headerSlot,
  footerSlot,
  showPagination = true,
}: ResultsTableXProps) {
  // Bandeau d’entête simple (labels de colonnes)
  const headBar = (
    <Box
      sx={{
        px: 1,
        py: 0.5,
        bgcolor: (t) =>
          t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f7f7f7",
        borderRadius: 1,
        border: (t) =>
          `1px solid ${
            t.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e0e0e0"
          }`,
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 1fr) 140px 140px 120px 110px 120px 1fr",
        gap: 12,
        alignItems: "center",
        fontSize: 12,
        fontWeight: 600,
        color: "text.secondary",
      }}
    >
      <Box>Verbatim</Box>
      <Box>Gold</Box>
      <Box>Prédit</Box>
      <Box>Confiance</Box>
      <Box>Correct</Box>
      <Box>Temps (ms)</Box>
      <Box>Call ID</Box>
    </Box>
  );

  // Petite fonction utilitaire pour afficher un tag X avec couleur
  const TagChip = ({
    tag,
  }: {
    tag?: keyof typeof VARIABLE_COLORS | string;
  }) => {
    if (!tag) return <Chip size="small" label="—" variant="outlined" />;
    const key = tag as keyof typeof VARIABLE_COLORS;
    const color = VARIABLE_COLORS[key] ?? undefined;
    const label =
      VARIABLE_LABELS[key as keyof typeof VARIABLE_LABELS] ?? String(tag);
    return (
      <Chip
        size="small"
        label={label}
        sx={{
          bgcolor: color ? `${color}20` : undefined,
          borderColor: color ?? "divider",
          color: color ?? "text.primary",
        }}
        variant="outlined"
      />
    );
  };

  return (
    <ResultsTableBase<XValidationResult>
      items={items}
      headerSlot={
        <Stack spacing={1}>
          {headerSlot}
          {headBar}
        </Stack>
      }
      footerSlot={footerSlot}
      showPagination={showPagination}
      renderRow={(item) => {
        // 👇 repli sûr : toujours une string
        const verb = item.verbatim ?? ""; // ou item.input ?? "" si tu préfères
        const short = verb.length > 180 ? `${verb.slice(0, 180)}…` : verb;

        return (
          <TableRow hover>
            {/* Verbatim */}
            <TableCell sx={{ maxWidth: 520 }}>
              <Typography variant="body2">{short || "—"}</Typography>

              {/* Évidence (facultatif) */}
              {item.evidence && item.evidence.length > 0 && (
                <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                  {item.evidence.slice(0, 4).map((ev, i) => (
                    <Chip key={i} size="small" label={ev} variant="outlined" />
                  ))}
                </Stack>
              )}
            </TableCell>

            {/* Gold */}
            <TableCell>
              <TagChip tag={item.goldStandard as any} />
            </TableCell>

            {/* Prédit */}
            <TableCell>
              <TagChip tag={item.predicted as any} />
            </TableCell>

            {/* Confiance */}
            <TableCell>
              {typeof item.confidence === "number" ? (
                <Chip
                  size="small"
                  label={`${(item.confidence * 100).toFixed(0)}%`}
                  color={
                    item.confidence >= 0.8
                      ? "success"
                      : item.confidence >= 0.6
                      ? "warning"
                      : "default"
                  }
                  variant="outlined"
                />
              ) : (
                "—"
              )}
            </TableCell>

            {/* Correct */}
            <TableCell>
              {item.correct === true ? (
                <Chip label="OK" size="small" color="success" />
              ) : item.correct === false ? (
                <Chip label="Erreur" size="small" color="error" />
              ) : (
                <Chip label="—" size="small" variant="outlined" />
              )}
            </TableCell>

            {/* Temps */}
            <TableCell>{item.processingTime ?? "—"}</TableCell>

            {/* Call ID */}
            <TableCell>
              <Typography variant="caption" color="text.secondary">
                {item.callId || "—"}
              </Typography>
            </TableCell>
          </TableRow>
        );
      }}
    />
  );
}
