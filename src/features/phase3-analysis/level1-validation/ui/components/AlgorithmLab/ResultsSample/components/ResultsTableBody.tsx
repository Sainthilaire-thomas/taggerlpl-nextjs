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
  useTheme,
  IconButton,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SpeedIcon from "@mui/icons-material/Speed";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { TVValidationResult } from "../types";
import AnnotationList from "./AnnotationList";
import type { ExtraColumn } from "../../extraColumns";
import { AnalysisPairContext } from "@/features/shared/ui/components";
import { formatTime } from "@/features/phase2-annotation/supervision/utils/formatters";
import QuickTagEditDialog from "./QuickTagEditDialog";
import { useQuickTagEdit } from "../hooks/useQuickTagEdit";
export interface ResultsTableBodyProps {
  pageItems: TVValidationResult[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPagination?: boolean;
  extraColumns?: ExtraColumn[];
  onDataRefresh?: () => void;  // 🆕 Remplace onQuickEdit
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
  onDataRefresh

}) => {
  const theme = useTheme();
  // Hook pour l'édition rapide
const quickEdit = useQuickTagEdit({
  onSuccess: () => {
    console.log("[ResultsTableBody] Tag mis à jour avec succès");
    onDataRefresh?.();
  },
  onError: (error) => {
    console.error("[ResultsTableBody] Erreur édition:", error);
  },
});

  const [openCommentFor, setOpenCommentFor] = useState<string | number | null>(
    null
  );
  const [draftComment, setDraftComment] = useState("");

  // Largeurs colonnes
  const COL_WIDTHS = {
    context: { minWidth: 420 },
    tag: 140,
    conf: 90,
    proc: 70,
    timestamp: 90,
    annot: 56,
    actions: 100,
  };

  const saveComment = async (row: TVValidationResult) => {
    const m = (row.metadata || {}) as Record<string, any>;
    const turnId = m.turnId ?? m.id;
    if (!turnId) return;

    const payload = {
      note: draftComment,
      gold: row.goldStandard,
      predicted: row.predicted,
      confidence: row.confidence ?? 0,
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

  // Nombre de colonnes pour le colspan
  const baseColCount = 8; // Contexte, Sortie, Ref, Conf, Proc, Timestamp, Annot, Actions

  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ overflowX: "auto" }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{ tableLayout: "auto", minWidth: 1100 }}
        >
          <TableHead>
            <TableRow>
              {/* Contexte — sticky à gauche */}
              <TableCell
                sx={{
                  minWidth: COL_WIDTHS.context.minWidth,
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  bgcolor: "background.default",
                }}
              >
                Contexte
              </TableCell>

              <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                Sortie modèle
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.tag }}>
                Référence (gold)
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.conf }}>
                Confiance
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.proc }}>
                Proc.
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.timestamp }}>
                Timestamp
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.annot }}>
                Annot.
              </TableCell>
              <TableCell align="center" sx={{ width: COL_WIDTHS.actions }}>
                Actions
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
              const isOdd = idx % 2 === 1;
              const base = isOdd
                ? theme.palette.primary.main
                : theme.palette.secondary.main;
              const BG_ALPHA = theme.palette.mode === "dark" ? 0.1 : 0.07;
              const EDGE_ALPHA = theme.palette.mode === "dark" ? 0.55 : 0.4;

              const groupBg = alpha(base, BG_ALPHA);
              const groupEdge = alpha(base, EDGE_ALPHA);

              const confidence = r.confidence ?? 0;
              
              // Timestamps
              const startTime = m.start_time as number | undefined;
              const endTime = m.end_time as number | undefined;
              const duration = startTime != null && endTime != null 
                ? Math.round(endTime - startTime) 
                : null;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={baseColCount + extraColumns.length}
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
                    {/* Contexte — sticky à gauche */}
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
                      <AnalysisPairContext pairId={m.pairId} />
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
                            maxWidth: 140,
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
                          maxWidth: 140,
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Confiance */}
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

                    {/* Processing time */}
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {r.processingTime ?? 0} ms
                      </Typography>
                    </TableCell>

                    {/* Timestamp */}
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      {startTime != null ? (
                        <Box>
                          <Typography variant="caption" display="block">
                            {formatTime(startTime)}
                          </Typography>
                          {endTime != null && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              display="block"
                            >
                              {formatTime(endTime)}
                            </Typography>
                          )}
                          {duration != null && (
                            <Typography 
                              variant="caption" 
                              color="primary" 
                              display="block"
                              fontWeight="bold"
                            >
                              {duration}s
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Annotations */}
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

                   {/* Actions */}
<TableCell align="center" sx={{ py: 0.5 }}>
  <Box sx={{ display: "flex", gap: 0.25, justifyContent: "center" }}>
    {/* Édition rapide du tag */}
<Tooltip title="Édition rapide du tag">
  <IconButton
    size="small"
    color="primary"
    onClick={(e) => {
      e.stopPropagation();
      quickEdit.openDialog(r);
    }}
  >
    <SpeedIcon fontSize="small" />
  </IconButton>
</Tooltip>
    

    {/* Ouvrir dans TranscriptLPL au timestamp */}
    {m.callId ? (
      <Tooltip title={startTime != null ? `Ouvrir à ${formatTime(startTime)}` : `Ouvrir l'appel ${m.callId}`}>
        <IconButton
          size="small"
          color="secondary"
          href={`/phase2-annotation/transcript/${m.callId}${startTime != null ? `?t=${Math.floor(startTime)}` : ''}`}
          target="_blank"
          rel="noopener"
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ) : (
      <Typography variant="caption" color="text.disabled">
        —
      </Typography>
    )}
  </Box>
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
                      colSpan={baseColCount + extraColumns.length}
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

       {/* Dialog d'édition rapide */}
      <QuickTagEditDialog
        open={quickEdit.state.isOpen}
        onClose={quickEdit.closeDialog}
        row={quickEdit.state.row}
        tagType={quickEdit.getTagType()}
        availableTags={quickEdit.getAvailableTags()}
        currentTag={quickEdit.state.row?.goldStandard ?? ""}
        saving={quickEdit.state.saving}
        error={quickEdit.state.error}
        onSave={quickEdit.saveTag}
      />
    </>
  );
};
