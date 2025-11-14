"use client";
import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Stack,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
} from "@mui/icons-material";

type ConfidenceRange = [number, number];

export type ClassificationResultRow<TTag extends string> = {
  id: string;
  verbatim: string;
  predicted: TTag;
  goldStandard?: TTag;
  correct?: boolean;
  confidence: number; // 0..1
  processingTime: number; // ms
  callId?: string | number;
  timestamp?: number | string;
  evidence?: string[]; // patterns / indices
  algorithmDetails?: any; // debug payload optionnel
};

export type ClassificationValidationTableProps<TTag extends string> = {
  variableLabel: string; // ex: "X - Stratégies Conseiller" / "Y - Réactions Client"
  results: ClassificationResultRow<TTag>[];
  labelMap: Record<TTag, string>;
  colorMap: Record<TTag, string>;
  isLoading?: boolean;
  error?: string;
  showGoldComparison?: boolean;
  showConfidence?: boolean;
  showEvidence?: boolean;
  defaultPageSize?: number;
  onRefresh?: () => void;
  onExportResults?: () => void;
  onItemSelect?: (row: ClassificationResultRow<TTag>) => void;
};

export default function ClassificationValidationTable<TTag extends string>({
  variableLabel,
  results,
  labelMap,
  colorMap,
  isLoading = false,
  error,
  showGoldComparison = true,
  showConfidence = true,
  showEvidence = true,
  defaultPageSize = 50,
  onRefresh,
  onExportResults,
  onItemSelect,
}: ClassificationValidationTableProps<TTag>) {
  // ----------------- État local
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<TTag[]>([]);
  const [confidenceRange, setConfidenceRange] = useState<ConfidenceRange>([
    0, 1,
  ]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(defaultPageSize);

  // ----------------- Filtrage & pagination
  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let arr = results;

    if (q) {
      arr = arr.filter(
        (r) =>
          r.verbatim.toLowerCase().includes(q) ||
          labelMap[r.predicted]?.toLowerCase().includes(q) ||
          (r.goldStandard &&
            labelMap[r.goldStandard]?.toLowerCase().includes(q))
      );
    }

    if (showOnlyErrors) {
      arr = arr.filter((r) => r.correct === false);
    }

    if (categoryFilter.length > 0) {
      const set = new Set(categoryFilter);
      arr = arr.filter(
        (r) =>
          set.has(r.predicted) || (r.goldStandard && set.has(r.goldStandard))
      );
    }

    arr = arr.filter(
      (r) =>
        r.confidence >= confidenceRange[0] && r.confidence <= confidenceRange[1]
    );

    return arr;
  }, [
    results,
    searchText,
    showOnlyErrors,
    categoryFilter,
    confidenceRange,
    labelMap,
  ]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  // ----------------- Métriques
  const metrics = useMemo(() => {
    const total = filtered.length;
    const correct = filtered.filter((r) => r.correct === true).length;
    const avgConfidence = total
      ? filtered.reduce((s, r) => s + r.confidence, 0) / total
      : 0;

    const categoryKeys = Object.keys(labelMap) as TTag[];
    const categoryBreakdown = Object.fromEntries(
      categoryKeys.map((k) => [k, 0])
    ) as Record<TTag, number>;
    filtered.forEach((r) => {
      categoryBreakdown[r.predicted] =
        (categoryBreakdown[r.predicted] ?? 0) + 1;
    });

    return {
      total,
      accuracy: total ? correct / total : 0,
      avgConfidence,
      errorCount: total - correct,
      categoryBreakdown,
    };
  }, [filtered, labelMap]);

  // ----------------- Callbacks
  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ----------------- Rendu
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Validation en cours…
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <InfoIcon />
            </IconButton>
          )
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header + métriques */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <PsychologyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Validation {variableLabel}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="h4" color="primary">
                {(metrics.accuracy * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Précision globale
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="h4" color="secondary">
                {metrics.avgConfidence.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confiance moyenne
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography
                variant="h4"
                color={metrics.errorCount > 0 ? "error" : "success"}
              >
                {metrics.errorCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Erreurs détectées
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="h4">{metrics.total}</Typography>
              <Typography variant="body2" color="text.secondary">
                Échantillons testés
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Paper>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <FilterIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Filtres et recherche
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mt: 2 }}
        >
          <TextField
            label="Rechercher dans les verbatims"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ flex: 2 }}
            placeholder="Tapez votre recherche…"
          />

          <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
            <InputLabel>Catégories</InputLabel>
            <Select
              multiple
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as TTag[]);
                setPage(0);
              }}
              label="Catégories"
            >
              {Object.keys(labelMap).map((key) => {
                const k = key as TTag;
                return (
                  <MenuItem key={key} value={k}>
                    <Chip
                      size="small"
                      label={labelMap[k]}
                      sx={{ backgroundColor: colorMap[k], color: "white" }}
                    />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Affichage</InputLabel>
            <Select
              value={showOnlyErrors ? "errors" : "all"}
              onChange={(e) => {
                setShowOnlyErrors(e.target.value === "errors");
                setPage(0);
              }}
              label="Affichage"
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="errors">Erreurs uniquement</MenuItem>
            </Select>
          </FormControl>

          {onExportResults && (
            <Tooltip title="Exporter les résultats">
              <IconButton onClick={onExportResults} color="primary">
                <ExportIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Paper>

      {/* Distribution */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <TrendingUpIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Distribution des prédictions
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {(Object.keys(labelMap) as TTag[]).map((k) => (
            <Chip
              key={k}
              label={`${labelMap[k]}: ${metrics.categoryBreakdown[k] ?? 0}`}
              size="small"
              sx={{
                backgroundColor: colorMap[k],
                color: "white",
                fontWeight: "bold",
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Tableau */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="50px">Détail</TableCell>
              <TableCell width="40%">Verbatim</TableCell>
              <TableCell width="15%">
                {showGoldComparison ? "Gold Standard" : "Référence"}
              </TableCell>
              <TableCell width="15%">Prédit</TableCell>
              {showConfidence && <TableCell width="10%">Confiance</TableCell>}
              <TableCell width="10%">Statut</TableCell>
              <TableCell width="10%">Temps</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((r) => (
              <React.Fragment key={r.id}>
                <TableRow
                  hover
                  onClick={() => onItemSelect?.(r)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(r.id);
                      }}
                    >
                      {expanded.has(r.id) ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>

                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.verbatim}
                    </Typography>
                    {(r.callId || r.timestamp) && (
                      <Typography variant="caption" color="text.secondary">
                        {r.callId ? `#${r.callId}` : ""}
                        {r.callId && r.timestamp ? " • " : ""}
                        {r.timestamp
                          ? new Date(r.timestamp).toLocaleTimeString()
                          : ""}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {r.goldStandard ? (
                      <Chip
                        size="small"
                        label={labelMap[r.goldStandard]}
                        sx={{
                          backgroundColor: colorMap[r.goldStandard],
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/D
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={labelMap[r.predicted]}
                      sx={{
                        backgroundColor: colorMap[r.predicted],
                        color: "white",
                        fontWeight: "bold",
                        opacity: r.correct === false ? 0.7 : 1,
                      }}
                    />
                  </TableCell>

                  {showConfidence && (
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {(r.confidence * 100).toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={r.confidence * 100}
                          sx={{
                            width: 40,
                            height: 4,
                            "& .MuiLinearProgress-bar": {
                              backgroundColor:
                                r.confidence > 0.7
                                  ? "success.main"
                                  : r.confidence > 0.4
                                  ? "warning.main"
                                  : "error.main",
                            },
                          }}
                        />
                      </Box>
                    </TableCell>
                  )}

                  <TableCell>
                    {r.correct === true && (
                      <Tooltip title="Correct">
                        <CheckIcon color="success" fontSize="small" />
                      </Tooltip>
                    )}
                    {r.correct === false && (
                      <Tooltip title="Erreur">
                        <ErrorIcon color="error" fontSize="small" />
                      </Tooltip>
                    )}
                    {r.correct === undefined && (
                      <Tooltip title="Sans gold">
                        <InfoIcon color="info" fontSize="small" />
                      </Tooltip>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption">
                      {r.processingTime?.toFixed?.(1) ?? r.processingTime}ms
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 0 }}>
                    <Collapse
                      in={expanded.has(r.id)}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box sx={{ p: 2, backgroundColor: "grey.50" }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Détails de l’analyse
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              gutterBottom
                            >
                              Verbatim complet :
                            </Typography>
                            <Paper
                              variant="outlined"
                              sx={{ p: 1, backgroundColor: "white" }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace" }}
                              >
                                "{r.verbatim}"
                              </Typography>
                            </Paper>
                          </Box>

                          {showEvidence &&
                            r.evidence &&
                            r.evidence.length > 0 && (
                              <Box>
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  gutterBottom
                                >
                                  Preuves linguistiques :
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                  gap={1}
                                >
                                  {(r.evidence || []).map((e, i) => (
                                    <Chip
                                      key={i}
                                      label={e}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          {/* Debug optionnel */}
                          {r.algorithmDetails && (
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                gutterBottom
                              >
                                Détails de l’algorithme :
                              </Typography>
                              <Paper
                                variant="outlined"
                                sx={{ p: 1, backgroundColor: "white" }}
                              >
                                <Typography
                                  variant="caption"
                                  component="pre"
                                  sx={{ whiteSpace: "pre-wrap" }}
                                >
                                  {JSON.stringify(r.algorithmDetails, null, 2)}
                                </Typography>
                              </Paper>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" sx={{ mr: 2 }}>
            Page {page + 1} / {totalPages} ({filtered.length} résultats)
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ←
            </IconButton>
            <IconButton
              size="small"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              →
            </IconButton>
          </Stack>
        </Box>
      )}

      {filtered.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", mt: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun résultat
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {results.length === 0
              ? "Lancez d’abord un test algorithmique."
              : "Aucun résultat ne correspond aux filtres."}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
