// src/components/calls/ui/pages/CallManagementPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableSortLabel,
  TablePagination,
  Checkbox,
} from "@mui/material";
import {
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  ClearAll,
  Close as CloseIcon,
  Done as DoneIcon,
} from "@mui/icons-material";

import { CallRelationsService } from "../../domain/services/CallRelationsService";
import { SupabaseRelationsRepository } from "../../infrastructure/supabase/SupabaseRelationsRepository";
import { useRelationsNextTurn } from "../hooks/useRelationsNextTurn";
import { useCallManagement } from "../hooks/useCallManagement";
import { CallStatus } from "../../shared/types/CallStatus";
import type { Call } from "../../domain/entities/Call";
/**
 * Helpers tri
 */
type Order = "asc" | "desc";
type OrderBy = "filename" | "status" | "origin" | "createdAt";

type AccessorValue = string | number;
type Accessor = (c: Call) => AccessorValue;

const accessors: Record<OrderBy, Accessor> = {
  filename: (c) => (c.filename ?? "").toString().toLowerCase(),
  status: (c) => (c.status ?? "").toString(),
  origin: (c) => (c.origin ?? "").toString().toLowerCase(),
  createdAt: (c) => {
    const t =
      c.createdAt instanceof Date
        ? c.createdAt.getTime()
        : new Date(c.createdAt as any).getTime();
    return Number.isFinite(t) ? t : 0;
  },
};

function getComparator(order: Order, orderBy: OrderBy) {
  const acc = accessors[orderBy];
  return (a: Call, b: Call): number => {
    const va = acc(a);
    const vb = acc(b);
    if (va < vb) return order === "asc" ? -1 : 1;
    if (va > vb) return order === "asc" ? 1 : -1;
    return 0;
  };
}

export const CallManagementPage: React.FC = () => {
  const {
    calls,
    loading,
    error,
    selectedCalls,
    stats,
    loadCalls,
    updateCallOrigin,
    deleteCall,
    toggleCallSelection,
    selectAllCalls,
    clearSelection,
    bulkUpdateOrigin,
    bulkDelete,
    hasSelection,
    selectedCount,
  } = useCallManagement();

  // -------- Filtres --------
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    origin: "",
    hasAudio: "",
    hasTranscription: "",
  });

  // -------- Tri & pagination --------
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("createdAt");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // -------- Inline edit origine --------
  const [editingOriginFor, setEditingOriginFor] = useState<string | null>(null);
  const [editingOriginValue, setEditingOriginValue] = useState("");

  const startEditOrigin = (id: string, current?: string) => {
    setEditingOriginFor(id);
    setEditingOriginValue(current ?? "");
  };
  const cancelEditOrigin = () => {
    setEditingOriginFor(null);
    setEditingOriginValue("");
  };
  const saveEditOrigin = async (id: string) => {
    const value = editingOriginValue.trim();
    if (value && value !== undefined) {
      await updateCallOrigin(id, value);
    }
    cancelEditOrigin();
  };

  // -------- Bulk dialog --------
  const [bulkOrigin, setBulkOrigin] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<"origin" | "delete" | null>(
    null
  );
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const openBulkAction = (action: "origin" | "delete") => {
    setBulkAction(action);
    setShowBulkDialog(true);
  };
  const executeBulkAction = useCallback(async () => {
    if (!bulkAction) return;
    setIsBulkProcessing(true);
    try {
      if (bulkAction === "origin" && bulkOrigin) {
        await bulkUpdateOrigin(bulkOrigin);
      } else if (bulkAction === "delete") {
        await bulkDelete();
      }
      clearSelection();
    } finally {
      setIsBulkProcessing(false);
      setShowBulkDialog(false);
      setBulkAction(null);
      setBulkOrigin("");
    }
  }, [bulkAction, bulkOrigin, bulkUpdateOrigin, bulkDelete, clearSelection]);

  // -------- Chargement initial --------
  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  // -------- Origines dynamiques (pour filtre & inline) --------
  const originOptions = useMemo(() => {
    const set = new Set<string>();
    calls.forEach((c) => c.origin && set.add(c.origin));
    return Array.from(set).sort();
  }, [calls]);

  // -------- Filtrage --------
  const filteredCalls = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return calls.filter((call) => {
      if (
        term &&
        !`${call.filename ?? ""} ${call.description ?? ""} ${call.id}`
          .toLowerCase()
          .includes(term)
      )
        return false;

      if (filters.status && call.status !== filters.status) return false;

      if (filters.origin) {
        if (filters.origin === "__none__") {
          if (call.origin) return false;
        } else if (call.origin !== filters.origin) return false;
      }

      if (filters.hasAudio === "true" && !call.hasValidAudio()) return false;
      if (filters.hasAudio === "false" && call.hasValidAudio()) return false;

      if (filters.hasTranscription === "true" && !call.hasValidTranscription())
        return false;
      if (filters.hasTranscription === "false" && call.hasValidTranscription())
        return false;

      return true;
    });
  }, [calls, filters]);

  // -------- Tri + pagination --------
  const sortedCalls = useMemo(
    () => filteredCalls.slice().sort(getComparator(order, orderBy)),
    [filteredCalls, order, orderBy]
  );
  const pagedCalls = useMemo(
    () =>
      sortedCalls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedCalls, page, rowsPerPage]
  );

  //----- relations -----
  const relationsService = React.useMemo(
    () => new CallRelationsService(new SupabaseRelationsRepository()),
    []
  );
  const { byId: nextTurnById, loading: relLoading } = useRelationsNextTurn(
    pagedCalls,
    { service: relationsService }
  );

  // renderer colonne "Relations" :
  const renderRelations = (callId: string) => {
    const r = nextTurnById.get(String(callId));
    if (!r) return <Chip size="small" label={relLoading ? "…" : "—"} />;

    const color =
      r.status === "complete"
        ? "success"
        : r.status === "partial"
        ? "warning"
        : "error";

    const missing = Math.max(0, r.total - r.tagged);
    const tooltip = `Relations: ${r.tagged}/${r.total} (${r.percent}%)
${missing ? `${missing} relation(s) manquante(s)\n` : ""}${
      r.lastCheckedAt
        ? `Dernière vérification: ${new Date(
            r.lastCheckedAt
          ).toLocaleTimeString()}`
        : ""
    }`;

    return (
      <Tooltip
        title={<span style={{ whiteSpace: "pre-line" }}>{tooltip}</span>}
      >
        <Chip size="small" color={color as any} label={`${r.percent}%`} />
      </Tooltip>
    );
  };
  // -------- Sélection page courante --------
  const allPageSelected =
    pagedCalls.length > 0 &&
    pagedCalls.every((c) => selectedCalls.has(c.id as string));
  const somePageSelected =
    pagedCalls.some((c) => selectedCalls.has(c.id as string)) &&
    !allPageSelected;

  const handleToggleSelectAllPage = () => {
    if (allPageSelected) {
      // retire seulement ceux de la page
      pagedCalls.forEach((c) => toggleCallSelection(c.id as string));
    } else {
      // ajoute ceux de la page non sélectionnés
      pagedCalls.forEach((c) => {
        if (!selectedCalls.has(c.id as string)) {
          toggleCallSelection(c.id as string);
        }
      });
    }
  };

  const getStatusChip = (status: CallStatus) => {
    const base: any = { label: status, size: "small", variant: "outlined" };
    switch (status) {
      case CallStatus.READY:
        return <Chip {...base} color="success" icon={<CheckCircle />} />;
      case CallStatus.PROCESSING:
        return <Chip {...base} color="info" icon={<Warning />} />;
      case CallStatus.ERROR:
        return <Chip {...base} color="error" icon={<ErrorIcon />} />;
      case CallStatus.COMPLETED:
        return <Chip {...base} color="success" icon={<CheckCircle />} />;
      default:
        return <Chip {...base} />;
    }
  };

  return (
    <Box>
      {/* En-tête & stats */}
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          Gestion des Appels
        </Typography>

        {stats && (
          <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
            <Chip label={`${stats.total} appels`} color="primary" />
            <Chip label={`${stats.readyForTagging} prêts`} color="success" />
            <Chip label={`${stats.completeness}% complétude`} color="info" />
            {hasSelection && (
              <Chip
                label={`${selectedCount} sélectionnés`}
                color="warning"
                variant="filled"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Rechercher (nom, desc, id)"
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
              size="small"
              sx={{ minWidth: 240 }}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) =>
                  setFilters((p) => ({ ...p, status: e.target.value }))
                }
              >
                <MenuItem value="">Tous</MenuItem>
                {Object.values(CallStatus).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Origine</InputLabel>
              <Select
                value={filters.origin}
                label="Origine"
                onChange={(e) =>
                  setFilters((p) => ({ ...p, origin: e.target.value }))
                }
              >
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="__none__">Sans origine</MenuItem>
                {originOptions.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Audio</InputLabel>
              <Select
                value={filters.hasAudio}
                label="Audio"
                onChange={(e) =>
                  setFilters((p) => ({ ...p, hasAudio: e.target.value }))
                }
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="true">Avec audio</MenuItem>
                <MenuItem value="false">Sans audio</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Transcription</InputLabel>
              <Select
                value={filters.hasTranscription}
                label="Transcription"
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    hasTranscription: e.target.value,
                  }))
                }
              >
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="true">Avec transcription</MenuItem>
                <MenuItem value="false">Sans transcription</MenuItem>
              </Select>
            </FormControl>

            <Button
              startIcon={<ClearAll />}
              onClick={() =>
                setFilters({
                  search: "",
                  status: "",
                  origin: "",
                  hasAudio: "",
                  hasTranscription: "",
                })
              }
            >
              Réinitialiser
            </Button>

            <Button
              startIcon={<Refresh />}
              onClick={loadCalls}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Actions en lot */}
      {hasSelection && (
        <Card sx={{ mb: 3, borderColor: "warning.main" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Actions en Lot ({selectedCount} appels)
            </Typography>

            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <TextField
                label="Nouvelle origine"
                value={bulkOrigin}
                onChange={(e) => setBulkOrigin(e.target.value)}
                size="small"
                placeholder="workdrive, upload, …"
              />
              <Button
                variant="outlined"
                onClick={() => openBulkAction("origin")}
                disabled={!bulkOrigin || isBulkProcessing}
              >
                Mettre à jour l’origine
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => openBulkAction("delete")}
                disabled={isBulkProcessing}
              >
                Supprimer
              </Button>

              <Button
                variant="text"
                onClick={clearSelection}
                disabled={isBulkProcessing}
              >
                Désélectionner
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Progress */}
      {(loading || isBulkProcessing) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tableau */}
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6">
              Appels ({filteredCalls.length})
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={somePageSelected}
                      checked={allPageSelected}
                      onChange={handleToggleSelectAllPage}
                    />
                  </TableCell>

                  <TableCell
                    sortDirection={orderBy === "filename" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "filename"}
                      direction={orderBy === "filename" ? order : "asc"}
                      onClick={() => handleRequestSort("filename")}
                    >
                      Fichier
                    </TableSortLabel>
                  </TableCell>

                  <TableCell
                    sortDirection={orderBy === "status" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "status"}
                      direction={orderBy === "status" ? order : "asc"}
                      onClick={() => handleRequestSort("status")}
                    >
                      Statut
                    </TableSortLabel>
                  </TableCell>

                  <TableCell>Contenu</TableCell>

                  <TableCell
                    sortDirection={orderBy === "origin" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "origin"}
                      direction={orderBy === "origin" ? order : "asc"}
                      onClick={() => handleRequestSort("origin")}
                    >
                      Origine
                    </TableSortLabel>
                  </TableCell>

                  <TableCell>Relations</TableCell>

                  <TableCell
                    sortDirection={orderBy === "createdAt" ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === "createdAt"}
                      direction={orderBy === "createdAt" ? order : "asc"}
                      onClick={() => handleRequestSort("createdAt")}
                    >
                      Créé le
                    </TableSortLabel>
                  </TableCell>

                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pagedCalls.map((call) => {
                  const isEditing = editingOriginFor === call.id;
                  return (
                    <TableRow
                      key={call.id}
                      hover
                      selected={selectedCalls.has(call.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCalls.has(call.id)}
                          onChange={() => toggleCallSelection(call.id)}
                        />
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {call.filename || "Sans nom"}
                          </Typography>
                          {call.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                                maxWidth: 260,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={call.description}
                            >
                              {call.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>{getStatusChip(call.status)}</TableCell>

                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          {call.hasValidAudio() && (
                            <Chip label="Audio" size="small" color="primary" />
                          )}
                          {call.hasValidTranscription() && (
                            <Chip
                              label="Transcription"
                              size="small"
                              color="secondary"
                            />
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ minWidth: 220 }}>
                        {isEditing ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              size="small"
                              autoFocus
                              value={editingOriginValue}
                              onChange={(e) =>
                                setEditingOriginValue(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditOrigin(call.id);
                                if (e.key === "Escape") cancelEditOrigin();
                              }}
                            />
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => saveEditOrigin(call.id)}
                              aria-label="Confirmer"
                            >
                              <DoneIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={cancelEditOrigin}
                              aria-label="Annuler"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={call.origin || "Non défini"}
                              size="small"
                              variant="outlined"
                            />
                            <Tooltip title="Modifier l’origine">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  startEditOrigin(call.id, call.origin)
                                }
                                aria-label="Modifier l’origine"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>

                      <TableCell>{renderRelations(call.id)}</TableCell>

                      <TableCell>
                        <Typography variant="caption">
                          {call.createdAt instanceof Date
                            ? call.createdAt.toLocaleDateString()
                            : new Date(call.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm("Supprimer cet appel ?")) {
                                deleteCall(call.id);
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {sortedCalls.length === 0 && !loading && (
              <Box py={4} textAlign="center">
                <Typography color="text.secondary">
                  Aucun appel trouvé avec les filtres actuels
                </Typography>
              </Box>
            )}
          </TableContainer>

          <TablePagination
            component="div"
            count={sortedCalls.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Dialog bulk */}
      <Dialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)}>
        <DialogTitle>Confirmer l’action en lot</DialogTitle>
        <DialogContent>
          <Typography>
            {bulkAction === "origin"
              ? `Mettre à jour l’origine de ${selectedCount} appel(s) vers « ${bulkOrigin} » ?`
              : `Supprimer définitivement ${selectedCount} appel(s) ?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkDialog(false)}>Annuler</Button>
          <Button
            onClick={executeBulkAction}
            color={bulkAction === "delete" ? "error" : "primary"}
            variant="contained"
            disabled={isBulkProcessing}
          >
            {isBulkProcessing ? "Traitement..." : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
