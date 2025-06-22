"use client";

import { useState, useMemo, FC } from "react";
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
} from "@mui/material";
import { useTaggingData } from "@/context/TaggingDataContext";
import { removeCallUpload } from "../../utils/removeCallUpload";
import { generateSignedUrl } from "../../utils/signedUrls";
import { updateCallOrigine } from "../../utils/updateCallOrigine";

// Imports des composants
import CallTableFilters from "./CallTableFilters";
import CallTableRow from "./CallTableRow";
import MobileCallCard from "./MobileCallCard";

// Imports des types et utils
import {
  Call,
  CallTableListProps,
  FilterState,
  SortState,
  PaginationState,
  Order,
  OrderBy,
} from "./types";
import { getComparator, filterCalls } from "./utils";

const CallTableList: FC<CallTableListProps> = ({ showMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // États pour les filtres
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    statusFilter: "all",
    audioFilter: "all",
    origineFilter: "all",
  });

  // États pour le tri
  const [sortState, setSortState] = useState<SortState>({
    order: "desc",
    orderBy: "callid",
  });

  // États pour la pagination
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 0,
    rowsPerPage: 25,
  });

  // États pour l'édition inline de l'origine - SIMPLIFIÉ
  const [editingOrigine, setEditingOrigine] = useState<string | null>(null);

  // États pour le dialog de suppression
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);

  // État pour l'expansion des lignes sur mobile
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {
    taggingCalls,
    selectTaggingCall,
    fetchTaggingTranscription,
    refreshTaggingCalls,
  } = useTaggingData();

  // Calcul des origines uniques
  const uniqueOrigines = useMemo(() => {
    const origines = taggingCalls
      .map((call) => call.origine)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return origines;
  }, [taggingCalls]);

  // Filtrage et tri des données
  const filteredAndSortedCalls = useMemo(() => {
    const filtered = filterCalls(
      taggingCalls,
      filters.searchTerm,
      filters.statusFilter,
      filters.audioFilter,
      filters.origineFilter
    );

    const comparator = getComparator(sortState.order, sortState.orderBy);
    filtered.sort(comparator);

    return filtered;
  }, [taggingCalls, filters, sortState]);

  // Pagination
  const paginatedCalls = useMemo(() => {
    const startIndex = paginationState.page * paginationState.rowsPerPage;
    return filteredAndSortedCalls.slice(
      startIndex,
      startIndex + paginationState.rowsPerPage
    );
  }, [filteredAndSortedCalls, paginationState]);

  // Handlers pour les filtres
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPaginationState((prev) => ({ ...prev, page: 0 }));
  };

  // Handlers pour le tri
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = sortState.orderBy === property && sortState.order === "asc";
    setSortState({
      order: isAsc ? "desc" : "asc",
      orderBy: property,
    });
  };

  // 🚀 HANDLERS SIMPLIFIÉS pour l'édition d'origine
  const handleStartEditOrigine = (callid: string) => {
    setEditingOrigine(callid);
  };

  const handleCancelEditOrigine = () => {
    setEditingOrigine(null);
  };

  const handleSaveOrigine = async (callid: string, newOrigine: string) => {
    try {
      await updateCallOrigine(callid, newOrigine);
      await refreshTaggingCalls?.();
      setEditingOrigine(null);
      showMessage(`Origine mise à jour avec succès: ${newOrigine}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur lors de la mise à jour de l'origine:", error);
      showMessage(`Erreur lors de la mise à jour: ${errorMessage}`);
    }
  };

  // Handler pour le clic sur un appel
  const handleCallClick = async (call: Call) => {
    try {
      if (!call.upload) {
        selectTaggingCall({
          ...call,
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
        audiourl: audioUrl,
        is_tagging_call: true,
        preparedfortranscript: false,
      });

      await fetchTaggingTranscription(call.callid);
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
        audiourl: "",
        is_tagging_call: true,
        preparedfortranscript: false,
      });
    }
  };

  // Handlers pour la suppression
  const handleDeleteClick = (call: Call) => {
    setCallToDelete(call);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!callToDelete) return;
    const { callid, filepath } = callToDelete;

    try {
      if (filepath) {
        await removeCallUpload(callid, filepath);
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
  };

  // Handler pour l'expansion des lignes sur mobile
  const toggleRowExpansion = (callid: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(callid)) {
      newExpanded.delete(callid);
    } else {
      newExpanded.add(callid);
    }
    setExpandedRows(newExpanded);
  };

  // Handlers pour la pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPaginationState((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationState({
      page: 0,
      rowsPerPage: parseInt(e.target.value, 10),
    });
  };

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
                isExpanded={expandedRows.has(call.callid)}
                onToggleExpansion={toggleRowExpansion}
                onCallClick={handleCallClick}
                onDeleteClick={handleDeleteClick}
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

        {/* Dialog de confirmation pour la suppression */}
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
                  <TableCell align="center">Audio</TableCell>
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
                  <TableCell>Description</TableCell>
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

      {/* Dialog de confirmation pour la suppression */}
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
    </Box>
  );
};

export default CallTableList;
