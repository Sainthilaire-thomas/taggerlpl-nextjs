"use client";
import * as React from "react";
import {
  Box,
  Chip,
  Stack,
  Typography,
  TableRow,
  TableCell,
} from "@mui/material";
import ResultsTableBase from "../base/ResultsTableBase";

type Item = {
  verbatim: string;
  processingTime?: number;
  metadata?: {
    callId?: string | number;
    prev2_turn_verbatim?: string;
    prev1_turn_verbatim?: string;
    next_turn_verbatim?: string;
    m1?: {
      value: number;
      densityPer: number;
      actionVerbCount: number;
      totalTokens: number;
      verbsFound: string[];
    };
  };
};

export default function ResultsTableM1({
  items,
  showPagination = true,
}: {
  items: Item[];
  showPagination?: boolean;
}) {
  const head = (
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
        gridTemplateColumns: "minmax(260px,1fr) 120px 130px 100px 1fr",
        gap: 12,
        fontSize: 12,
        fontWeight: 600,
        color: "text.secondary",
      }}
    >
      <Box>Verbatim (T0)</Box>
      <Box>M1 (pour 100 tk)</Box>
      <Box># Verbes d’action</Box>
      <Box>Tokens</Box>
      <Box>Contexte (T-2 / T-1 / T+1)</Box>
    </Box>
  );

  return (
    <ResultsTableBase<Item>
      items={items}
      headerSlot={<Stack spacing={1}>{head}</Stack>}
      showPagination={showPagination}
      renderRow={(it) => {
        const m1 = it.metadata?.m1;
        const short =
          it.verbatim?.length > 200
            ? it.verbatim.slice(0, 200) + "…"
            : it.verbatim;
        return (
          <TableRow hover>
            <TableCell sx={{ maxWidth: 520 }}>
              <Typography variant="body2">{short || "—"}</Typography>
              {!!m1?.verbsFound?.length && (
                <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                  {m1.verbsFound.slice(0, 6).map((v, i) => (
                    <Chip key={i} size="small" label={v} variant="outlined" />
                  ))}
                </Stack>
              )}
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                color="primary"
                label={m1 ? `${m1.value.toFixed(2)}` : "—"}
              />
            </TableCell>
            <TableCell>{m1?.actionVerbCount ?? "—"}</TableCell>
            <TableCell>{m1?.totalTokens ?? "—"}</TableCell>
            <TableCell>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                T-2:{" "}
                {it.metadata?.prev2_turn_verbatim
                  ? `"${it.metadata.prev2_turn_verbatim}"`
                  : "—"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                T-1:{" "}
                {it.metadata?.prev1_turn_verbatim
                  ? `"${it.metadata.prev1_turn_verbatim}"`
                  : "—"}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                T+1:{" "}
                {it.metadata?.next_turn_verbatim
                  ? `"${it.metadata.next_turn_verbatim}"`
                  : "—"}
              </Typography>
            </TableCell>
          </TableRow>
        );
      }}
    />
  );
}
