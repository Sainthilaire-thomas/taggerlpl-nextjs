// src/components/calls/ui/pages/CallManagementPage.tsx

import React, { useState, useEffect, useCallback } from "react";
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
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  List as ListIcon,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  FilterList,
  ClearAll,
  GetApp,
} from "@mui/icons-material";

import { useCallManagement } from "../hooks/useCallManagement";
import { CallStatus } from "../../shared/types/CallStatus";

/**
 * Page de gestion avancée des appels avec actions en lot
 * Interface complète pour administrer tous les appels
 */
export const CallManagementPage: React.FC = () => {
  const theme = useTheme();
  const {
    calls,
    loading,
    error,
    selectedCalls,
    stats,
    loadCalls,
    updateCallOrigin,
    updateCallStatus,
    deleteCall,
    toggleCallSelection,
    selectAllCalls,
    clearSelection,
    bulkUpdateOrigin,
    bulkDelete,
    hasSelection,
    selectedCount,
  } = useCallManagement();

  // État local pour les filtres
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    origin: "",
    hasAudio: "",
    hasTranscription: "",
  });

  // État pour les actions en lot
  const [bulkOrigin, setBulkOrigin] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<"origin" | "delete" | null>(
    null
  );
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  /**
   * Chargement initial
   */
  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  /**
   * Filtrage des appels
   */
  const filteredCalls = calls.filter((call) => {
    if (
      filters.search &&
      !call.filename?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !call.description?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.status && call.status !== filters.status) return false;
    if (filters.origin && call.origin !== filters.origin) return false;
    if (filters.hasAudio === "true" && !call.hasValidAudio()) return false;
    if (filters.hasAudio === "false" && call.hasValidAudio()) return false;
    if (filters.hasTranscription === "true" && !call.hasValidTranscription())
      return false;
    if (filters.hasTranscription === "false" && call.hasValidTranscription())
      return false;
    return true;
  });

  /**
   * Gestion des actions en lot
   */
  const handleBulkAction = useCallback(async (action: "origin" | "delete") => {
    setBulkAction(action);
    setShowBulkDialog(true);
  }, []);

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
    } catch (error) {
      console.error("Erreur action en lot:", error);
    } finally {
      setIsBulkProcessing(false);
      setShowBulkDialog(false);
      setBulkAction(null);
      setBulkOrigin("");
    }
  }, [bulkAction, bulkOrigin, bulkUpdateOrigin, bulkDelete, clearSelection]);

  /**
   * Actions individuelles
   */
  const handleEditOrigin = useCallback(
    async (callId: string, newOrigin: string) => {
      await updateCallOrigin(callId, newOrigin);
    },
    [updateCallOrigin]
  );

  const handleDeleteCall = useCallback(
    async (callId: string) => {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cet appel ?")) {
        await deleteCall(callId);
      }
    },
    [deleteCall]
  );

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case CallStatus.READY:
        return "success";
      case CallStatus.PROCESSING:
        return "info";
      case CallStatus.ERROR:
        return "error";
      case CallStatus.COMPLETED:
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: CallStatus) => {
    switch (status) {
      case CallStatus.READY:
        return <CheckCircle />;
      case CallStatus.PROCESSING:
        return <Warning />;
      case CallStatus.ERROR:
        return <Error />;
      case CallStatus.COMPLETED:
        return <CheckCircle />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* En-tête avec statistiques */}
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
              label="Rechercher"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              size="small"
              sx={{ minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                label="Statut"
              >
                <MenuItem value="">Tous</MenuItem>
                {Object.values(CallStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Audio</InputLabel>
              <Select
                value={filters.hasAudio}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, hasAudio: e.target.value }))
                }
                label="Audio"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="true">Avec audio</MenuItem>
                <MenuItem value="false">Sans audio</MenuItem>
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
                placeholder="workdrive, upload, etc."
              />

              <Button
                variant="outlined"
                onClick={() => handleBulkAction("origin")}
                disabled={!bulkOrigin || isBulkProcessing}
              >
                Mettre à Jour Origine
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={() => handleBulkAction("delete")}
                disabled={isBulkProcessing}
                startIcon={<Delete />}
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

      {/* Erreurs */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Progression */}
      {(loading || isBulkProcessing) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Table des appels */}
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">
              Appels ({filteredCalls.length})
            </Typography>
            <Box>
              <Button size="small" onClick={selectAllCalls}>
                Tout Sélectionner
              </Button>
              <Button size="small" onClick={clearSelection} sx={{ ml: 1 }}>
                Désélectionner
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell>Fichier</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Origine</TableCell>
                  <TableCell>Contenu</TableCell>
                  <TableCell>Créé</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow
                    key={call.id}
                    selected={selectedCalls.has(call.id)}
                    hover
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
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
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {call.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        {...(call.status === CallStatus.READY && {
                          icon: <CheckCircle />,
                        })}
                        {...(call.status === CallStatus.PROCESSING && {
                          icon: <Warning />,
                        })}
                        {...(call.status === CallStatus.ERROR && {
                          icon: <Error />,
                        })}
                        {...(call.status === CallStatus.COMPLETED && {
                          icon: <CheckCircle />,
                        })}
                        label={call.status}
                        size="small"
                        color={getStatusColor(call.status)}
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={call.origin || "Non défini"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

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

                    <TableCell>
                      <Typography variant="caption">
                        {call.createdAt.toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Modifier l'origine">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newOrigin = prompt(
                              "Nouvelle origine:",
                              call.origin
                            );
                            if (newOrigin) handleEditOrigin(call.id, newOrigin);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCall(call.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredCalls.length === 0 && !loading && (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary">
                Aucun appel trouvé avec les filtres actuels
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation pour actions en lot */}
      <Dialog open={showBulkDialog} onClose={() => setShowBulkDialog(false)}>
        <DialogTitle>Confirmer l'Action en Lot</DialogTitle>
        <DialogContent>
          <Typography>
            {bulkAction === "origin"
              ? `Mettre à jour l'origine de ${selectedCount} appels vers "${bulkOrigin}" ?`
              : `Supprimer définitivement ${selectedCount} appels ?`}
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
