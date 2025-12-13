"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TablePagination,
  Chip,
  Tooltip,
  Collapse,
  Box,
  TextField,
  Button,
  Stack,
  alpha,
  useTheme,IconButton
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { TVValidationResult } from "../types";
import AnnotationList from "./AnnotationList";
import type { ExtraColumn } from "../../extraColumns";
import { ToneLine } from "@/features/shared/ui/components";



export interface ResultsTableBodyProps {
  pageItems: TVValidationResult[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPagination?: boolean;
  extraColumns?: ExtraColumn[];
}

export const ResultsTableBody: React.FC<ResultsTableBodyProps> = ({
  pageItems,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  showPagination = true,
  extraColumns = [],
}) => {
  const theme = useTheme();
  const [openCommentFor, setOpenCommentFor] = useState<string | number | null>(
    null
  );
  const [draftComment, setDraftComment] = useState("");

  // Largeurs
 const COL_WIDTHS = {
  context: { minWidth: 420 },
  tag: 160,
  conf: 110,
  time: 90,
  annot: 64,
  actions: 64,  // ← Ajouter cette ligne
};

  const saveComment = async (row: TVValidationResult) => {
    const m = (row.metadata || {}) as Record<string, any>;
    const turnId = m.turnId ?? m.id;
    if (!turnId) return;

    const payload = {
      note: draftComment,
      gold: row.goldStandard,
      predicted: row.predicted,
      confidence: row.confidence ?? 0, // ✅ Fix: Handle undefined confidence
      context: {
        prev2: m.prev2_turn_verbatim || null,
        prev1: m.prev1_turn_verbatim || null,
        current: row.verbatim,
        next1: m.next1_turn_verbatim || null,
      },
      classifier: m.classifier || "unknown",
      created_at: new Date().toISOString(),
      algo: {
        classifier: String(m.classifier ?? "unknown"),
        type: (m.type as any) || undefined,
        model: (m.model as string) || undefined,
        provider: /openai|gpt/i.test(`${m.model ?? ""}`) ? "openai" : undefined,
        temperature:
          typeof m.temperature === "number" ? m.temperature : undefined,
        max_tokens: typeof m.maxTokens === "number" ? m.maxTokens : undefined,
      },
    };

    try {
      const res = await fetch(`/api/turntagged/${turnId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setOpenCommentFor(null);
      setDraftComment("");
    } catch (e: any) {
      alert(`Échec sauvegarde note: ${e?.message || e}`);
    }
  };

  if (pageItems.length === 0) {
    return (
      <Paper variant="outlined">
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            Aucun résultat ne correspond aux filtres.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ overflowX: "auto" }}
      >
        {/* tableLayout AUTO pour laisser respirer le header Contexte */}
        <Table
          size="small"
          stickyHeader
          sx={{ tableLayout: "auto", minWidth: 960 }}
        >
          <TableHead>
            <TableRow>
              {/* Contexte — sticky à gauche, court libellé, fond fixé */}
              <TableCell
                sx={{
                  minWidth: COL_WIDTHS.context.minWidth,
                  position: "sticky",
                  left: 0,
                  zIndex: 3, // au-dessus des autres headers
                  bgcolor: "background.default",
                }}
              >
                Contexte
              </TableCell>

              <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                Sortie modèle (brut)
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                Référence (gold)
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.conf }}>
                Confiance
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.time }}>
                Temps
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.annot }}>
                Annot.
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.actions }}>
  Appel
</TableCell>

              {extraColumns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align ?? "left"}
                  sx={{ width: col.width }}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {pageItems.map((r, idx) => {
              const m = (r.metadata || {}) as Record<string, any>;
              const prev2 = m.prev2_turn_verbatim as string | undefined;
              const prev1 = m.prev1_turn_verbatim as string | undefined;
              const next1 = m.next1_turn_verbatim as string | undefined;
              // ✅ FOCUS UNIVERSEL - fonctionne pour X et Y
              const focusVerbatim = m.current_turn_verbatim || r.verbatim;
              const isClientTarget = m.target === "client";
              const focusPrefix = isClientTarget
                ? "0 [CLIENT]"
                : "0 [CONSEILLER]";

              const p2prefix = "−2"; // Toujours rang temporel
              const p1prefix = "−1"; // Toujours rang temporel

              const nextPrefix = "+1"; // Tour suivant
              const isOdd = idx % 2 === 1;
              const base = isOdd
                ? theme.palette.primary.main
                : theme.palette.secondary.main;
              const BG_ALPHA = theme.palette.mode === "dark" ? 0.1 : 0.07;
              const EDGE_ALPHA = theme.palette.mode === "dark" ? 0.55 : 0.4;

              const groupBg = alpha(base, BG_ALPHA);
              const groupEdge = alpha(base, EDGE_ALPHA);

              // ✅ Fix: Ensure confidence has a default value
              const confidence = r.confidence ?? 0;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7 + extraColumns.length}
                        sx={{ p: 0, border: 0, height: 8 }}
                      />
                    </TableRow>
                  )}

                  <TableRow
                    hover
                    sx={{
                      "& > td": { backgroundColor: groupBg },
                      "& > td:first-of-type": {
                        borderLeft: `6px solid ${groupEdge}`,
                        borderTopLeftRadius: 10,
                        borderBottomLeftRadius: 10,
                      },
                      "& > td:last-of-type": {
                        borderTopRightRadius: 10,
                        borderBottomRightRadius: 10,
                      },
                    }}
                  >
                    {/* Cellule Contexte — sticky à gauche, fond aligné au groupe */}
                    <TableCell
                      sx={{
                        py: 0.75,
                        minWidth: COL_WIDTHS.context.minWidth,
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        backgroundColor: groupBg,
                      }}
                    >
                      <Box sx={{ display: "grid", gap: 0.5 }}>
                        <ToneLine
                          text={prev2}
                          prefix={p2prefix} // "−2"
                          tone="A"
                          italic
                          tooltip={prev2 || ""}
                        />
                        <ToneLine
                          text={prev1}
                          prefix={p1prefix} // "−1"
                          tone="B"
                          tooltip={prev1 || ""}
                        />
                        <ToneLine
                          text={focusVerbatim}
                          prefix={focusPrefix} // "0"
                          tone="CURRENT"
                          strong
                          lines={2}
                          tooltip={`Tour courant: ${focusVerbatim || ""}`}
                        />
                        <ToneLine
                          text={next1}
                          prefix={nextPrefix} // "+1"
                          tone="B"
                          italic
                          tooltip={next1 || ""}
                        />
                      </Box>
                    </TableCell>

                    {/* Sortie modèle (brut) */}
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Tooltip
                        title={
                          (r.metadata as any)?.rawResponse
                            ? `LLM: ${(r.metadata as any).rawResponse}`
                            : (r.metadata as any)?.error
                            ? `Erreur: ${(r.metadata as any).error}`
                            : ""
                        }
                        arrow
                      >
                        <Chip
                          label={r.predicted}
                          size="small"
                          color={r.correct ? "default" : "error"}
                          sx={{
                            maxWidth: 160,
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Référence (gold) */}
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Chip
                        label={r.goldStandard}
                        size="small"
                        color="success"
                        sx={{
                          maxWidth: 160,
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          color: r.correct
                            ? "success.main"
                            : confidence > 0.7
                            ? "error.main"
                            : "warning.main",
                        }}
                      >
                        {(confidence * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography variant="caption">
                        {r.processingTime ?? 0} ms
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <AnnotationList
                        turnId={Number(m.turnId ?? m.id ?? idx)}
                        verbatim={r.verbatim}
                        context={{
                          prev2: m.prev2_turn_verbatim,
                          prev1: m.prev1_turn_verbatim,
                          next1: m.next1_turn_verbatim,
                        }}
                        predicted={r.predicted}
                        gold={r.goldStandard}
                        author="analyst"
                        algo={{
                          classifier: String(m.classifier ?? "unknown"),
                          type: (m.type as any) || undefined,
                          model: (m.model as string) || undefined,
                          provider: /openai|gpt/i.test(`${m.model ?? ""}`)
                            ? "openai"
                            : undefined,
                          temperature:
                            typeof m.temperature === "number"
                              ? m.temperature
                              : undefined,
                          max_tokens:
                            typeof m.maxTokens === "number"
                              ? m.maxTokens
                              : undefined,
                        }}
                      />
                    </TableCell>
                    {/* Lien vers l'appel */}
<TableCell align="center" sx={{ py: 0.5 }}>
  {m.callId ? (
    <Tooltip title={`Ouvrir l'appel ${m.callId}`}>
      <IconButton
        size="small"
        color="primary"
        href={`/phase2-annotation/transcript/${m.callId}`}
        target="_blank"
        rel="noopener"
      >
        <OpenInNewIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  ) : (
    <Typography variant="caption" color="text.disabled">—</Typography>
  )}
</TableCell>

                    {/* Colonnes dynamiques */}
                    {extraColumns.map((col, i) => (
                      <TableCell
                        key={`${col.id}-${idx}`}
                        align={col.align ?? "left"}
                        sx={{ py: 0.5 }}
                      >
                        {col.render(r, idx)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Ligne commentaire */}
                  <TableRow
                    sx={{
                      "& > td": { backgroundColor: groupBg },
                      "& > td:first-of-type": {
                        borderLeft: `6px solid ${groupEdge}`,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 10,
                      },
                      "& > td:last-of-type": {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 10,
                      },
                    }}
                  >
                    <TableCell
                      colSpan={7 + extraColumns.length}
                      sx={{ p: 0, borderBottom: 0 }}
                    >
                      <Collapse
                        in={openCommentFor === (m.turnId ?? idx)}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            display: "grid",
                            gap: 1,
                            backgroundColor: alpha(base, BG_ALPHA + 0.03),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Écrivez une courte interprétation du tour en
                            fonction du contexte (utile pour le fine-tuning et
                            le partage d'exemples).
                          </Typography>

                          <TextField
                            value={draftComment}
                            onChange={(e) => setDraftComment(e.target.value)}
                            placeholder="Ex. Ici le conseiller acquiesce puis oriente vers une action client…"
                            multiline
                            minRows={2}
                            maxRows={6}
                            fullWidth
                            size="small"
                          />

                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Button
                              variant="text"
                              size="small"
                              startIcon={<CloseOutlinedIcon />}
                              onClick={() => {
                                setOpenCommentFor(null);
                                setDraftComment("");
                              }}
                            >
                              Annuler
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<SaveOutlinedIcon />}
                              onClick={() => saveComment(r)}
                              disabled={!draftComment.trim()}
                            >
                              Enregistrer
                            </Button>
                          </Stack>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination ? (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          showFirstButton
          showLastButton
          labelRowsPerPage="Lignes par page"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
          sx={{
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        />
      ) : (
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            📊 Tous les résultats affichés : <strong>{pageItems.length}</strong>
            {pageItems.length > 100 && " • Scrollez pour naviguer"}
          </Typography>
        </Box>
      )}
    </>
  );
};
