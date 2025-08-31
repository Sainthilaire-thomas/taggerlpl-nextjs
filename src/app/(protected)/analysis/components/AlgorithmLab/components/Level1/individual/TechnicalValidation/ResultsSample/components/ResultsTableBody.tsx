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
  IconButton,
  Collapse,
  Box,
  TextField,
  Button,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import ModeCommentOutlinedIcon from "@mui/icons-material/ModeCommentOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { TVValidationResult } from "../types";
import AnnotationList from "./AnnotationList";

// Réutilisation du composant ToneLine de l'original
const ToneLine: React.FC<{
  text?: string | null;
  prefix?: string;
  lines?: number;
  tone?: "A" | "B" | "CURRENT";
  strong?: boolean;
  italic?: boolean;
  tooltip?: string;
}> = ({ text, prefix, lines = 1, tone = "A", strong, italic, tooltip }) => {
  const theme = useTheme();
  const content = text ?? "—";

  const base =
    tone === "CURRENT"
      ? theme.palette.primary.main
      : theme.palette.text.primary;

  const bg =
    tone === "CURRENT"
      ? alpha(base, theme.palette.mode === "dark" ? 0.26 : 0.16)
      : "transparent";

  const ring =
    tone === "CURRENT"
      ? `inset 0 0 0 1px ${alpha(
          base,
          theme.palette.mode === "dark" ? 0.45 : 0.22
        )}`
      : undefined;

  const color =
    tone === "CURRENT"
      ? theme.palette.text.primary
      : theme.palette.text.secondary;

  const fontVariant = strong || tone === "CURRENT" ? "body2" : "caption";

  const node = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "start",
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          mt: 0.25,
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor:
            tone === "CURRENT"
              ? alpha(base, 0.5)
              : alpha(theme.palette.text.secondary, 0.35),
        }}
      />
      <Box
        sx={{
          px: 0.5,
          py: 0.25,
          borderRadius: 1,
          backgroundColor: bg,
          boxShadow: ring,
        }}
      >
        <Typography
          variant={fontVariant}
          sx={{
            color,
            display: "-webkit-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
            lineHeight: 1.25,
            fontWeight: tone === "CURRENT" ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
          }}
        >
          {prefix ? `${prefix} ` : ""}
          {content}
        </Typography>
      </Box>
    </Box>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow placement="top">
      <Box>{node}</Box>
    </Tooltip>
  ) : (
    node
  );
};

export interface ResultsTableBodyProps {
  pageItems: TVValidationResult[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPagination?: boolean; // 🚀 Nouvelle prop
}

export const ResultsTableBody: React.FC<ResultsTableBodyProps> = ({
  pageItems,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  showPagination = true,
}) => {
  const theme = useTheme();
  const [openCommentFor, setOpenCommentFor] = useState<string | number | null>(
    null
  );
  const [draftComment, setDraftComment] = useState("");

  // Largeurs fixes
  const COL_WIDTHS = {
    context: { minWidth: 520, maxWidth: 980 },
    tag: 120,
    conf: 110,
    time: 90,
    annot: 64,
  };

  // Handler pour sauvegarder un commentaire
  const saveComment = async (row: TVValidationResult) => {
    const turnId = row.metadata?.turnId ?? row.metadata?.id;
    if (!turnId) return;

    const m = row.metadata || {};

    const payload = {
      note: draftComment,
      gold: row.goldStandard,
      predicted: row.predicted,
      confidence: row.confidence,
      context: {
        prev2: m.prev2_turn_verbatim || null,
        prev1: m.prev1_turn_verbatim || null,
        current: row.verbatim,
        next1: m.next_turn_verbatim || null,
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
        <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  minWidth: { xs: 420, md: COL_WIDTHS.context.minWidth },
                  maxWidth: COL_WIDTHS.context.maxWidth,
                }}
              >
                Contexte (−2 & 0 = ton A) / (−1 & +1 = ton B)
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                Prédit
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                Réel
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
            </TableRow>
          </TableHead>

          <TableBody>
            {pageItems.map((r, idx) => {
              const m = r.metadata || {};
              const prev2 = m.prev2_turn_verbatim as string | undefined;
              const prev1 = m.prev1_turn_verbatim as string | undefined;
              const next1 = m.next_turn_verbatim as string | undefined;

              const p2prefix = m.prev2_speaker ? `[${m.prev2_speaker}]` : "−2";
              const p1prefix = m.prev1_speaker ? `[${m.prev1_speaker}]` : "−1";

              const isOdd = idx % 2 === 1;
              const base = isOdd
                ? theme.palette.primary.main
                : theme.palette.secondary.main;
              const BG_ALPHA = theme.palette.mode === "dark" ? 0.1 : 0.07;
              const EDGE_ALPHA = theme.palette.mode === "dark" ? 0.55 : 0.4;

              const groupBg = alpha(base, BG_ALPHA);
              const groupEdge = alpha(base, EDGE_ALPHA);

              const rowOpen = openCommentFor === (m.turnId ?? idx);

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ p: 0, border: 0, height: 8 }}
                      />
                    </TableRow>
                  )}

                  {/* LIGNE PRINCIPALE DU PASSAGE */}
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
                    <TableCell
                      sx={{
                        py: 0.75,
                        maxWidth: COL_WIDTHS.context.maxWidth,
                      }}
                    >
                      <Box sx={{ display: "grid", gap: 0.5 }}>
                        <ToneLine
                          text={prev2}
                          prefix={p2prefix}
                          tone="A"
                          italic
                          tooltip={prev2 || ""}
                        />
                        <ToneLine
                          text={prev1}
                          prefix={p1prefix}
                          tone="B"
                          tooltip={prev1 || ""}
                        />
                        <ToneLine
                          text={r.verbatim}
                          prefix="0"
                          tone="CURRENT"
                          strong
                          lines={2}
                          tooltip={r.verbatim}
                        />
                        <ToneLine
                          text={next1}
                          prefix="+1"
                          tone="B"
                          italic
                          tooltip={next1 || ""}
                        />
                      </Box>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Tooltip
                        title={
                          r.metadata?.rawResponse
                            ? `LLM: ${r.metadata.rawResponse}`
                            : r.metadata?.error
                            ? `Erreur: ${r.metadata.error}`
                            : ""
                        }
                        arrow
                      >
                        <Chip
                          label={r.predicted}
                          size="small"
                          color={r.correct ? "default" : "error"}
                          sx={{
                            maxWidth: 110,
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Chip
                        label={r.goldStandard}
                        size="small"
                        color="success"
                        sx={{
                          maxWidth: 110,
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
                            : r.confidence > 0.7
                            ? "error.main"
                            : "warning.main",
                        }}
                      >
                        {(r.confidence * 100).toFixed(1)}%
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
                          next1: m.next_turn_verbatim,
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
                    <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                      <Collapse in={rowOpen} timeout="auto" unmountOnExit>
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
