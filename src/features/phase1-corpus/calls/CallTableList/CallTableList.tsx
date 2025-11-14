"use client";

import { useState, useCallback, useEffect, memo, FC } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
  Checkbox,
  LinearProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { RelationsStatus, useTaggingData } from "@/context/TaggingDataContext";
import { removeCallUpload } from "../../shared/utils/removeCallUpload";
import { generateSignedUrl } from "../../shared/utils/signedUrls";
import { updateCallOrigine } from "../../shared/utils/updateCallOrigine";

// Imports des composants
import CallTableFilters from "./CallTableFilters";
import CallTableRow from "./CallTableRow";
import MobileCallCard from "./MobileCallCard";
import BulkActionsToolbar from "./BulkActionsToolbar";

// Imports des types et utils
import { Call, CallTableListProps, PaginationState, OrderBy } from "./types";
import { createBatches, delay } from "./utils";
import { useBulkActions } from "./hooks/useBulkActions";
import { useOptimizedCallData } from "./hooks/useOptimizedCallData";

const CallTableList: FC<CallTableListProps> = ({ showMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    taggingCalls,
    selectTaggingCall,
    fetchTaggingTranscription,
    refreshTaggingCalls,
    getRelationsStatus, // ✅ AJOUT
  } = useTaggingData();

  // 🚀 OPTIMISATION: Utilisation du hook optimisé pour les données
  const {
    filteredAndSortedCalls,
    uniqueOrigines,
    filters,
    sortState,
    updateFilters,
    updateSort,
    cacheStats,
    clearCache,
  } = useOptimizedCallData({
    taggingCalls,
    cacheTimeout: 30000, // 30 secondes
  });

  // 🚀 OPTIMISATION: Hook pour les actions en lot
  const {
    selectedCalls,
    selectedCount,
    isBulkProcessing,
    setIsBulkProcessing,
    actions: bulkActions,
  } = useBulkActions();

  // États pour la pagination
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 0,
    rowsPerPage: 25,
  });

  // États pour l'édition inline de l'origine
  const [editingOrigine, setEditingOrigine] = useState<string | null>(null);
  const [bulkOrigineValue, setBulkOrigineValue] = useState<string>("");

  // États pour les dialogs de suppression
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState<boolean>(false);

  // État pour l'expansion des lignes sur mobile
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  //Etatpour le calcul du next turn tag
  const [relationsStatusCache, setRelationsStatusCache] = useState<
    Map<string, RelationsStatus | null>
  >(new Map());
  const [loadingRelations, setLoadingRelations] = useState<Set<string>>(
    new Set()
  );

  // 🚀 OPTIMISATION: Pagination calculée à partir des données optimisées
  const paginatedCalls = (() => {
    const startIndex = paginationState.page * paginationState.rowsPerPage;
    return filteredAndSortedCalls.slice(
      startIndex,
      startIndex + paginationState.rowsPerPage
    );
  })();

  // 🚀 OPTIMISATION: Handler pour les filtres utilisant le hook optimisé
  const handleFiltersChange = useCallback(
    (newFilters: typeof filters) => {
      updateFilters(newFilters);
      setPaginationState((prev) => ({ ...prev, page: 0 }));
      bulkActions.clearSelection();
    },
    [updateFilters, bulkActions]
  );

  // 🚀 OPTIMISATION: Handler pour le tri utilisant le hook optimisé
  const handleRequestSort = useCallback(
    (property: OrderBy) => {
      updateSort(property);
    },
    [updateSort]
  );

  // Ajouter cette fonction pour charger le statut des relations
  const loadRelationsStatus = useCallback(
    async (callId: string | number) => {
      const callIdStr = String(callId);

      // Éviter les chargements multiples
      if (
        loadingRelations.has(callIdStr) ||
        relationsStatusCache.has(callIdStr)
      ) {
        return;
      }

      setLoadingRelations((prev) => new Set(prev).add(callIdStr));

      try {
        const status = await getRelationsStatus(callIdStr);
        setRelationsStatusCache((prev) => new Map(prev).set(callIdStr, status));
      } catch (error) {
        console.error(
          `Erreur lors du chargement du statut pour ${callIdStr}:`,
          error
        );
        setRelationsStatusCache((prev) => new Map(prev).set(callIdStr, null));
      } finally {
        setLoadingRelations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(callIdStr);
          return newSet;
        });
      }
    },
    [getRelationsStatus, loadingRelations, relationsStatusCache]
  );

  // Charger les statuts pour les appels visibles
  useEffect(() => {
    // Charger seulement pour les appels paginés (pour éviter trop de requêtes)
    paginatedCalls.forEach((call) => {
      const callIdStr = String(call.callid);
      if (
        !relationsStatusCache.has(callIdStr) &&
        !loadingRelations.has(callIdStr)
      ) {
        loadRelationsStatus(call.callid);
      }
    });
  }, [paginatedCalls, loadRelationsStatus]);

  // Fonction pour obtenir le chip de statut des relations
  const getRelationsStatusChip = useCallback(
    (callId: string | number) => {
      const callIdStr = String(callId);
      const status = relationsStatusCache.get(callIdStr);
      const isLoading = loadingRelations.has(callIdStr);

      if (isLoading) {
        return (
          <Chip
            label="Vérification..."
            size="small"
            variant="outlined"
            color="default"
            sx={{ minWidth: 90 }}
          />
        );
      }

      if (!status) {
        return (
          <Chip
            label="Inconnu"
            size="small"
            variant="outlined"
            color="default"
            sx={{ minWidth: 90 }}
          />
        );
      }

      if (status.totalTags === 0) {
        return (
          <Chip
            label="Pas de tags"
            size="small"
            variant="outlined"
            color="default"
            sx={{ minWidth: 90 }}
          />
        );
      }

      if (status.isCalculated) {
        return (
          <Chip
            label={`✅ ${status.completenessPercent.toFixed(0)}%`}
            size="small"
            variant="filled"
            color="success"
            sx={{ minWidth: 90 }}
          />
        );
      } else if (status.completenessPercent > 50) {
        return (
          <Chip
            label={`⚠️ ${status.completenessPercent.toFixed(0)}%`}
            size="small"
            variant="outlined"
            color="warning"
            sx={{ minWidth: 90 }}
          />
        );
      } else {
        return (
          <Chip
            label={`❌ ${status.completenessPercent.toFixed(0)}%`}
            size="small"
            variant="outlined"
            color="error"
            sx={{ minWidth: 90 }}
          />
        );
      }
    },
    [relationsStatusCache, loadingRelations]
  );

  const getRelationsTooltip = useCallback(
    (callId: string | number) => {
      const callIdStr = String(callId);
      const status = relationsStatusCache.get(callIdStr);

      if (!status || status.totalTags === 0) {
        return "Aucune information sur les relations";
      }

      return `Relations: ${status.tagsWithNextTurn}/${
        status.totalTags
      } (${status.completenessPercent.toFixed(1)}%)
${status.missingRelations} relations manquantes
Dernière vérification: ${status.lastChecked.toLocaleTimeString()}`;
    },
    [relationsStatusCache]
  );

  // 🚀 NOUVEAU: Handlers pour les actions en lot
  const handleCallSelection = useCallback(
    (callid: string | number, isSelected: boolean) => {
      const callIdStr = String(callid); // ✅ Conversion sécurisée
      if (isSelected) {
        bulkActions.selectCall(callIdStr);
      } else {
        bulkActions.deselectCall(callIdStr);
      }
    },
    [bulkActions]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedCount === paginatedCalls.length && paginatedCalls.length > 0) {
      bulkActions.clearSelection();
    } else {
      const allCallIds = paginatedCalls.map((call) => String(call.callid)); // ✅ Conversion sécurisée
      bulkActions.selectAll(allCallIds);
    }
  }, [selectedCount, paginatedCalls, bulkActions]);

  const handleBulkOrigineChange = useCallback(
    async (newOrigine: string) => {
      if (!newOrigine || selectedCount === 0) {
        setBulkOrigineValue(newOrigine);
        return;
      }

      setIsBulkProcessing(true);
      setBulkOrigineValue(newOrigine);

      try {
        const selectedCallIds = Array.from(selectedCalls);

        // Traitement en lot avec limite
        const batches = createBatches(selectedCallIds, 5);
        let processedCount = 0;

        for (const batch of batches) {
          await Promise.all(
            batch.map(async (callid) => {
              await updateCallOrigine(callid, newOrigine);
              processedCount++;
            })
          );

          // Délai entre les lots
          if (batches.length > 1) {
            await delay(100);
          }
        }

        await refreshTaggingCalls?.();

        // Vider le cache après mise à jour
        clearCache();

        showMessage(
          `${processedCount} appel(s) mis à jour avec l'origine: ${newOrigine}`
        );

        // Réinitialiser
        bulkActions.clearSelection();
        setBulkOrigineValue("");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la mise à jour en lot:", error);
        showMessage(`Erreur lors de la mise à jour en lot: ${errorMessage}`);
      } finally {
        setIsBulkProcessing(false);
      }
    },
    [
      selectedCalls,
      selectedCount,
      refreshTaggingCalls,
      showMessage,
      bulkActions,
      setIsBulkProcessing,
      clearCache,
    ]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedCount === 0) return;
    setBulkDeleteOpen(true);
  }, [selectedCount]);

  const handleConfirmBulkDelete = useCallback(async () => {
    setIsBulkProcessing(true);

    try {
      const selectedCallsData = paginatedCalls.filter(
        (call) => selectedCalls.has(String(call.callid)) // ✅ Conversion sécurisée
      );

      const batches = createBatches(selectedCallsData, 3);
      let processedCount = 0;

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (call) => {
            if (call.filepath) {
              await removeCallUpload(String(call.callid), call.filepath); // ✅ Conversion sécurisée
              processedCount++;
            }
          })
        );

        if (batches.length > 1) {
          await delay(200);
        }
      }

      await refreshTaggingCalls?.();

      // Vider le cache après suppression
      clearCache();

      showMessage(`${processedCount} appel(s) supprimé(s) avec succès`);

      bulkActions.clearSelection();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur lors de la suppression en lot:", error);
      showMessage(`Erreur lors de la suppression en lot: ${errorMessage}`);
    } finally {
      setIsBulkProcessing(false);
      setBulkDeleteOpen(false);
    }
  }, [
    selectedCalls,
    paginatedCalls,
    refreshTaggingCalls,
    showMessage,
    bulkActions,
    setIsBulkProcessing,
    clearCache,
  ]);

  // Handlers pour l'édition individuelle (optimisés)
  const handleStartEditOrigine = useCallback((callid: string | number) => {
    setEditingOrigine(String(callid)); // ✅ Conversion sécurisée
  }, []);

  const handleCancelEditOrigine = useCallback(() => {
    setEditingOrigine(null);
  }, []);

  const handleSaveOrigine = useCallback(
    async (callid: string | number, newOrigine: string) => {
      try {
        await updateCallOrigine(String(callid), newOrigine); // ✅ Conversion sécurisée
        await refreshTaggingCalls?.();

        // Vider le cache après mise à jour
        clearCache();

        setEditingOrigine(null);
        showMessage(`Origine mise à jour avec succès: ${newOrigine}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la mise à jour de l'origine:", error);
        showMessage(`Erreur lors de la mise à jour: ${errorMessage}`);
      }
    },
    [refreshTaggingCalls, showMessage, clearCache]
  );

  // Handler pour le clic sur un appel (optimisé)
  const handleCallClick = useCallback(
    async (call: Call) => {
      try {
        if (!call.upload) {
          selectTaggingCall({
            ...call,
            callid: String(call.callid), // ✅ Conversion sécurisée pour TaggingCall
            audiourl: "",
            is_tagging_call: true,
            preparedfortranscript: false,
          });
          showMessage("Appel sans audio chargé.");
          return;
        }

        if (!call.filepath) {
          showMessage("Chemin du fichier audio manquant.");
          return;
        }

        const audioUrl = await generateSignedUrl(call.filepath);
        selectTaggingCall({
          ...call,
          callid: String(call.callid), // ✅ Conversion sécurisée pour TaggingCall
          audiourl: audioUrl,
          is_tagging_call: true,
          preparedfortranscript: false,
        });

        await fetchTaggingTranscription(String(call.callid)); // ✅ Conversion sécurisée
        showMessage("Appel chargé avec succès.");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error(
          "Erreur lors de la génération de l'URL signée",
          errorMessage
        );
        showMessage("Erreur lors de la récupération du fichier audio.");
        selectTaggingCall({
          ...call,
          callid: String(call.callid), // ✅ Conversion sécurisée pour TaggingCall
          audiourl: "",
          is_tagging_call: true,
          preparedfortranscript: false,
        });
      }
    },
    [selectTaggingCall, fetchTaggingTranscription, showMessage]
  );

  // Handlers pour la suppression individuelle
  const handleDeleteClick = useCallback((call: Call) => {
    setCallToDelete(call);
    setConfirmDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!callToDelete) return;
    const { callid, filepath } = callToDelete;

    try {
      if (filepath) {
        await removeCallUpload(String(callid), filepath); // ✅ Conversion sécurisée
        await refreshTaggingCalls?.();

        // Vider le cache après suppression
        clearCache();

        showMessage("Appel mis à jour, audio et word retirés.");
      } else {
        throw new Error("Filepath manquant pour la suppression");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Error in handleConfirmDelete:", errorMessage);
      showMessage(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setConfirmDeleteOpen(false);
      setCallToDelete(null);
    }
  }, [callToDelete, showMessage, refreshTaggingCalls, clearCache]);

  // Handler pour l'expansion des lignes sur mobile
  const toggleRowExpansion = useCallback((callid: string | number) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      const callIdStr = String(callid); // ✅ Conversion sécurisée
      if (newExpanded.has(callIdStr)) {
        newExpanded.delete(callIdStr);
      } else {
        newExpanded.add(callIdStr);
      }
      return newExpanded;
    });
  }, []);

  // Handlers pour la pagination (optimisés)
  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      setPaginationState((prev) => ({ ...prev, page: newPage }));
      bulkActions.clearSelection();
    },
    [bulkActions]
  );

  const handleChangeRowsPerPage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPaginationState({
        page: 0,
        rowsPerPage: parseInt(e.target.value, 10),
      });
      bulkActions.clearSelection();
    },
    [bulkActions]
  );

  // Calculer si tout est sélectionné
  const isSelectAll =
    selectedCount === paginatedCalls.length && paginatedCalls.length > 0;

  // 🚀 DEBUG: Affichage des stats de cache en développement
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Cache Stats:", cacheStats);
  }

  // Interface mobile avec cartes condensées
  if (isMobile) {
    return (
      <Box>
        <Typography variant="body1" paragraph>
          Cette section affiche les appels chargés disponibles pour le tagging.
        </Typography>

        <CallTableFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          uniqueOrigines={uniqueOrigines}
          resultCount={filteredAndSortedCalls.length}
          isMobile={true}
        />

        {/* 🚀 NOUVEAU: Toolbar pour les actions en lot (mobile) */}
        <BulkActionsToolbar
          selectedCount={selectedCount}
          onSelectAll={handleSelectAll}
          onClearSelection={bulkActions.clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkOrigineChange={handleBulkOrigineChange}
          bulkOrigineValue={bulkOrigineValue}
          uniqueOrigines={uniqueOrigines}
          isBulkProcessing={isBulkProcessing}
        />

        {/* Indicateur de chargement pour les actions en lot */}
        {isBulkProcessing && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Traitement en cours...
            </Typography>
          </Box>
        )}

        {filteredAndSortedCalls.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            Aucun appel trouvé avec les critères sélectionnés.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {paginatedCalls.map((call) => (
              <MobileCallCard
                key={call.callid}
                call={call}
                isExpanded={expandedRows.has(String(call.callid))}
                onToggleExpansion={toggleRowExpansion}
                onCallClick={handleCallClick}
                onDeleteClick={handleDeleteClick}
                isSelected={selectedCalls.has(String(call.callid))}
                onSelectionChange={handleCallSelection}
                disabled={isBulkProcessing}
              />
            ))}
          </Box>
        )}

        <TablePagination
          component="div"
          count={filteredAndSortedCalls.length}
          page={paginationState.page}
          onPageChange={handleChangePage}
          rowsPerPage={paginationState.rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Appels par page"
        />

        {/* Dialogs de confirmation */}
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
        >
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir supprimer cet appel ? Cette action est
              irréversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Annuler</Button>
            <Button onClick={handleConfirmDelete} color="primary" autoFocus>
              Confirmer
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}>
          <DialogTitle>Confirmer la suppression en lot</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir supprimer {selectedCount} appel(s) ?
              Cette action est irréversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDeleteOpen(false)}>Annuler</Button>
            <Button
              onClick={handleConfirmBulkDelete}
              color="primary"
              autoFocus
              disabled={isBulkProcessing}
            >
              Confirmer la suppression
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Interface desktop avec tableau complet
  return (
    <Box>
      <Typography variant="body1" paragraph>
        Cette section affiche les appels chargés disponibles pour le tagging.
      </Typography>

      <CallTableFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        uniqueOrigines={uniqueOrigines}
        resultCount={filteredAndSortedCalls.length}
        isMobile={false}
      />

      {/* 🚀 NOUVEAU: Toolbar pour les actions en lot */}
      <BulkActionsToolbar
        selectedCount={selectedCount}
        onSelectAll={handleSelectAll}
        onClearSelection={bulkActions.clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkOrigineChange={handleBulkOrigineChange}
        bulkOrigineValue={bulkOrigineValue}
        uniqueOrigines={uniqueOrigines}
        isBulkProcessing={isBulkProcessing}
      />

      {/* Indicateur de chargement pour les actions en lot */}
      {isBulkProcessing && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Traitement en cours... ({selectedCount} appel(s))
          </Typography>
        </Box>
      )}

      {filteredAndSortedCalls.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="textSecondary">
            Aucun appel trouvé avec les critères sélectionnés.
            {taggingCalls.length === 0 && (
              <span>
                {" "}
                Veuillez d'abord importer des appels dans l'onglet "Import
                d'appels".
              </span>
            )}
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} elevation={2}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {/* Checkbox de sélection */}
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedCount > 0 && !isSelectAll}
                      checked={isSelectAll}
                      onChange={handleSelectAll}
                      disabled={isBulkProcessing}
                    />
                  </TableCell>

                  {/* Nom du fichier */}
                  <TableCell>
                    <TableSortLabel
                      active={sortState.orderBy === "filename"}
                      direction={
                        sortState.orderBy === "filename"
                          ? sortState.order
                          : "asc"
                      }
                      onClick={() => handleRequestSort("filename")}
                    >
                      Nom du fichier
                    </TableSortLabel>
                  </TableCell>

                  {/* Audio */}
                  <TableCell align="center">Audio</TableCell>

                  {/* Durée */}
                  <TableCell>
                    <TableSortLabel
                      active={sortState.orderBy === "duree"}
                      direction={
                        sortState.orderBy === "duree" ? sortState.order : "asc"
                      }
                      onClick={() => handleRequestSort("duree")}
                    >
                      Durée
                    </TableSortLabel>
                  </TableCell>

                  {/* Statut */}
                  <TableCell>
                    <TableSortLabel
                      active={sortState.orderBy === "status"}
                      direction={
                        sortState.orderBy === "status" ? sortState.order : "asc"
                      }
                      onClick={() => handleRequestSort("status")}
                    >
                      Statut
                    </TableSortLabel>
                  </TableCell>

                  {/* ✅ NOUVELLE COLONNE: Relations */}
                  <TableCell align="center">
                    <Tooltip title="Statut des relations next_turn_tag calculées">
                      <span>Relations</span>
                    </Tooltip>
                  </TableCell>

                  {/* Origine */}
                  <TableCell>
                    <TableSortLabel
                      active={sortState.orderBy === "origine"}
                      direction={
                        sortState.orderBy === "origine"
                          ? sortState.order
                          : "asc"
                      }
                      onClick={() => handleRequestSort("origine")}
                    >
                      Origine
                    </TableSortLabel>
                  </TableCell>

                  {/* Description */}
                  <TableCell>Description</TableCell>

                  {/* Actions */}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCalls.map((call, index) => (
                  <CallTableRow
                    key={call.callid}
                    call={call}
                    index={index}
                    editingOrigine={editingOrigine}
                    onStartEditOrigine={handleStartEditOrigine}
                    onSaveOrigine={handleSaveOrigine}
                    onCancelEditOrigine={handleCancelEditOrigine}
                    onCallClick={handleCallClick}
                    onDeleteClick={handleDeleteClick}
                    isSelected={selectedCalls.has(String(call.callid))}
                    onSelectionChange={handleCallSelection}
                    disabled={isBulkProcessing}
                    // ✅ NOUVELLES PROPS
                    relationsStatusChip={getRelationsStatusChip(call.callid)}
                    relationsTooltip={getRelationsTooltip(call.callid)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredAndSortedCalls.length}
            page={paginationState.page}
            onPageChange={handleChangePage}
            rowsPerPage={paginationState.rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Appels par page"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
            }
          />
        </>
      )}

      {/* Dialogs de confirmation */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cet appel ? Cette action est
            irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Annuler</Button>
          <Button onClick={handleConfirmDelete} color="primary" autoFocus>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}>
        <DialogTitle>Confirmer la suppression en lot</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer {selectedCount} appel(s) ? Cette
            action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)}>Annuler</Button>
          <Button
            onClick={handleConfirmBulkDelete}
            color="primary"
            autoFocus
            disabled={isBulkProcessing}
          >
            Confirmer la suppression
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default memo(CallTableList);
