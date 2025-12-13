"use client";
import * as React from "react";
import { Chip, Stack, Typography } from "@mui/material";
import type { TVValidationResult } from "./ResultsSample/types";

export type TargetKind = "X" | "Y" | "M1" | "M2" | "M3";

export type ExtraColumn = {
  id: string;
  header: React.ReactNode;
  width?: number;
  align?: "left" | "center" | "right";
  render: (row: TVValidationResult, index: number) => React.ReactNode;
};

/* -----------------------------
 * Colonnes X (conseiller)
 * ----------------------------- */
export const buildXColumns = (): ExtraColumn[] => [
  {
    id: "x-family",
    header: <strong>Famille X</strong>,
    width: 130,
    align: "center",
    render: (r) => (
      <Chip
        size="small"
        variant="outlined"
        color="primary"
        label={
          r.metadata?.x_details?.family ??
          (r.metadata as any)?.details?.family ??
          (r.metadata as any)?.algorithmMetadata?.details?.family ??
          "—"
        }
      />
    ),
  },
  {
    id: "x-evidences",
    header: <strong>Évidences</strong>,
    width: 260,
    align: "left",
    render: (r) => {
      const evs: string[] =
        r.metadata?.x_evidences ??
        (r.metadata as any)?.details?.evidences ??
        (r.metadata as any)?.algorithmMetadata?.details?.evidences ??
        r.metadata?.evidences ??
        r.metadata?.rationales ??
        [];
      if (!evs.length) return <>—</>;
      return (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
          {evs.slice(0, 6).map((e, i) => (
            <Chip key={i} size="small" variant="outlined" label={e} />
          ))}
        </Stack>
      );
    },
  },
];

/* -----------------------------
 * Colonnes Y (client)
 * ----------------------------- */
export const buildYColumns = (): ExtraColumn[] => [
  {
    id: "y-family",
    header: <strong>Famille Y</strong>,
    width: 130,
    align: "center",
    render: (r) => (
      <Chip
        size="small"
        variant="outlined"
        color="success"
        label={r.metadata?.y_details?.family ?? "—"}
      />
    ),
  },
  {
    id: "y-evidences",
    header: <strong>Évidences</strong>,
    width: 260,
    align: "left",
    render: (r) => {
      const evs: string[] =
        r.metadata?.y_evidences ??
        r.metadata?.evidences ??
        r.metadata?.rationales ??
        [];
      if (!evs.length) return <>—</>;
      return (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
          {evs.slice(0, 6).map((e, i) => (
            <Chip key={i} size="small" variant="outlined" label={e} />
          ))}
        </Stack>
      );
    },
  },
];

/* -----------------------------
 * Colonnes M1 (numérique à base de verbes d'action)
 * ----------------------------- */
const m1Cols: ExtraColumn[] = [
  {
    id: "m1-density",
    header: <strong>M1 (densité)</strong>,
    width: 130,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m1?.value;
      return (
        <Chip
          size="small"
          color="primary"
          label={Number.isFinite(v) ? (v as number).toFixed(3) : "—"}
        />
      );
    },
  },
  {
    id: "m1-verbs",
    header: <strong># Verbes</strong>,
    width: 100,
    align: "center",
    render: (r) => r.metadata?.m1?.actionVerbCount ?? "—",
  },
  {
    id: "m1-tokens",
    header: <strong>Tokens</strong>,
    width: 100,
    align: "center",
    render: (r) => r.metadata?.m1?.totalTokens ?? "—",
  },
  {
    id: "m1-verbs-found",
    header: <strong>Verbes trouvés</strong>,
    width: 260,
    align: "left",
    render: (r) => {
      const verbs: string[] = r.metadata?.m1?.verbsFound ?? [];
      if (!verbs.length) return <>—</>;
      return (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
          {verbs.slice(0, 10).map((v, i) => (
            <Chip key={i} size="small" variant="outlined" label={v} />
          ))}
        </Stack>
      );
    },
  },
];

/* -----------------------------
 * Colonnes M2 (classification, PAS de comptage de verbes)
 * ----------------------------- */
/* -----------------------------
 * Colonnes M2 (6 dimensions multi-niveaux)
 * ----------------------------- */
const m2Cols: ExtraColumn[] = [
  {
    id: "m2-global",
    header: <strong>M2</strong>,
    width: 70,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m2_scores?.global ?? r.metadata?.m2?.value;
      return (
        <Chip
          size="small"
          color="primary"
          label={Number.isFinite(v) ? (v as number).toFixed(2) : "—"}
        />
      );
    },
  },
  {
    id: "m2-lexical",
    header: <strong>Lex.</strong>,
    width: 60,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m2_scores?.lexical;
      return Number.isFinite(v) ? (v as number).toFixed(2) : "—";
    },
  },
  {
    id: "m2-semantic",
    header: <strong>Sém.</strong>,
    width: 60,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m2_scores?.semantic;
      return Number.isFinite(v) ? (v as number).toFixed(2) : "—";
    },
  },
  {
    id: "m2-verb-rep",
    header: <strong>Verb.</strong>,
    width: 60,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m2_scores?.verb_repetition;
      return Number.isFinite(v) ? (v as number).toFixed(2) : "—";
    },
  },
  {
    id: "m2-accept",
    header: <strong>Acc.</strong>,
    width: 50,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m2_scores?.pragmatic?.acceptance;
      return v === 1 ? "✓" : v === 0 ? "✗" : "—";
    },
  },
  {
    id: "m2-compreh",
    header: <strong>Cpr.</strong>,
    width: 50,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m2_scores?.pragmatic?.comprehension;
      return v === 1 ? "✓" : v === 0 ? "✗" : "—";
    },
  },
  {
    id: "m2-coop",
    header: <strong>Cop.</strong>,
    width: 50,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m2_scores?.pragmatic?.cooperation;
      return v === 1 ? "✓" : v === 0 ? "✗" : "—";
    },
  },
];

/* -----------------------------
 * Colonnes M3 (numérique durée, PAS de comptage de verbes)
 * ----------------------------- */
const m3Cols: ExtraColumn[] = [
  {
    id: "m3-value",
    header: <strong>M3 (durée)</strong>,
    width: 140,
    align: "center",
    render: (r) => {
      const v = r.metadata?.m3?.value;
      const u = r.metadata?.m3?.unit ?? "ms";
      return (
        <Chip
          size="small"
          color="primary"
          label={Number.isFinite(v) ? `${(v as number).toFixed(0)} ${u}` : "—"}
        />
      );
    },
  },
];

/* -----------------------------
 * Fabrique
 * ----------------------------- */
export function buildExtraColumnsForTarget(kind: TargetKind): ExtraColumn[] {
  switch (kind) {
    case "X":
      return buildXColumns();
    case "Y":
      return buildYColumns();
    case "M1":
      return m1Cols;
    case "M2":
      return m2Cols; // classification → pas de colonnes “# verbes”
    case "M3":
      return m3Cols; // numérique (durée) → valeur + unité
    default:
      return [];
  }
}
