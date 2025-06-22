"use client";

import { useState, useMemo, useCallback, FC, memo } from "react";
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
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AudioFile as AudioFileIcon,
  VolumeOff as NoAudioIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useTaggingData } from "@/context/TaggingDataContext";
import { removeCallUpload } from "../utils/removeCallUpload";
import { generateSignedUrl } from "../utils/signedUrls";
import { updateCallOrigine } from "../utils/updateCallOrigine";

// Types
interface Call {
  callid: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
  audiourl?: string | null;
  status?: string;
  duree?: number;
  origine?: string;
  [key: string]: any;
}

interface CallTableListProps {
  showMessage: (message: string) => void;
}

// Types pour le tri
type Order = "asc" | "desc";
type OrderBy = "filename" | "duree" | "status" | "origine" | "callid";

// 🚀 Fonction utilitaire pour formater la durée - MEMOIZÉE
const formatDuration = (seconds: number | undefined): string => {
  if (!seconds || seconds === 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// 🚀 Fonction utilitaire pour obtenir la couleur du statut - MEMOIZÉE
const getStatusColor = (
  status: string | undefined
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning" => {
  switch (status) {
    case "évalué":
      return "success";
    case "en_cours":
      return "warning";
    case "coaching_planifié":
      return "info";
    case "terminé":
      return "primary";
    case "non_supervisé":
    default:
      return "default";
  }
};

// 🚀 COMPOSANT MEMOIZÉ pour l'édition d'origine
const OriginEditor = memo<{
  call: Call;
  isEditing: boolean;
  tempOrigine: string;
  onStartEdit: (callid: string, currentOrigine: string) => void;
  onSave: (callid: string, newOrigine: string) => void;
  onCancel: () => void;
  onTempOriginChange: (value: string) => void;
}>(
  ({
    call,
    isEditing,
    tempOrigine,
    onStartEdit,
    onSave,
    onCancel,
    onTempOriginChange,
  }) => {
    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSave(call.callid, tempOrigine);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      },
      [call.callid, tempOrigine, onSave, onCancel]
    );

    const handleSave = useCallback(() => {
      onSave(call.callid, tempOrigine);
    }, [call.callid, tempOrigine, onSave]);

    const handleStartEdit = useCallback(() => {
      onStartEdit(call.callid, call.origine || "");
    }, [call.callid, call.origine, onStartEdit]);

    const handleTempChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onTempOriginChange(e.target.value);
      },
      [onTempOriginChange]
    );

    if (isEditing) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField
            size="small"
            value={tempOrigine}
            onChange={handleTempChange}
            onKeyDown={handleKeyPress}
            autoFocus
            sx={{ minWidth: 100 }}
            variant="outlined"
          />
          <IconButton size="small" color="primary" onClick={handleSave}>
            ✓
          </IconButton>
          <IconButton size="small" onClick={onCancel}>
            ✗
          </IconButton>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          "&:hover": { backgroundColor: "action.hover" },
          p: 0.5,
          borderRadius: 1,
        }}
        onClick={handleStartEdit}
      >
        <Typography variant="body2">{call.origine || "Non définie"}</Typography>
        <Tooltip title="Cliquez pour éditer">
          <EditIcon fontSize="small" color="action" />
        </Tooltip>
      </Box>
    );
  }
);

OriginEditor.displayName = "OriginEditor";

// 🚀 COMPOSANT MEMOIZÉ pour une ligne du tableau
const CallTableRow = memo<{
  call: Call;
  index: number;
  editingOrigine: string | null;
  tempOrigine: string;
  onStartEditOrigine: (callid: string, currentOrigine: string) => void;
  onSaveOrigine: (callid: string, newOrigine: string) => void;
  onCancelEditOrigine: () => void;
  onTempOriginChange: (value: string) => void;
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
}>(
  ({
    call,
    index,
    editingOrigine,
    tempOrigine,
    onStartEditOrigine,
    onSaveOrigine,
    onCancelEditOrigine,
    onTempOriginChange,
    onCallClick,
    onDeleteClick,
  }) => {
    const handleCallClick = useCallback(
      () => onCallClick(call),
      [onCallClick, call]
    );
    const handleDeleteClick = useCallback(
      () => onDeleteClick(call),
      [onDeleteClick, call]
    );

    return (
      <TableRow
        hover
        sx={{
          backgroundColor: index % 2 === 0 ? "action.hover" : "inherit",
          "&:hover": {
            backgroundColor: "action.selected",
          },
        }}
      >
        <TableCell>
          <Box>
            <Typography variant="body2" noWrap>
              {call.filename || "Sans nom"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {String(call.callid).substring(0, 8)}...
            </Typography>
          </Box>
        </TableCell>

        <TableCell align="center">
          {call.upload ? (
            <Tooltip title="Audio disponible">
              <AudioFileIcon color="primary" />
            </Tooltip>
          ) : (
            <Tooltip title="Pas d'audio">
              <NoAudioIcon color="disabled" />
            </Tooltip>
          )}
        </TableCell>

        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {formatDuration(call.duree)}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Chip
            size="small"
            label={call.status || "Non supervisé"}
            color={getStatusColor(call.status)}
            variant="outlined"
          />
        </TableCell>

        <TableCell>
          <OriginEditor
            call={call}
            isEditing={editingOrigine === call.callid}
            tempOrigine={tempOrigine}
            onStartEdit={onStartEditOrigine}
            onSave={onSaveOrigine}
            onCancel={onCancelEditOrigine}
            onTempOriginChange={onTempOriginChange}
          />
        </TableCell>

        <TableCell>
          <Tooltip title={call.description || "Pas de description"}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <DescriptionIcon fontSize="small" color="action" />
              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                {call.description || "Pas de description"}
              </Typography>
            </Box>
          </Tooltip>
        </TableCell>

        <TableCell align="center">
          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip
              title={call.upload ? "Écouter l'appel" : "Audio non disponible"}
            >
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleCallClick}
                  disabled={!call.upload}
                >
                  <PlayIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Supprimer l'appel">
              <IconButton
                size="small"
                color="error"
                onClick={handleDeleteClick}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    );
  }
);

CallTableRow.displayName = "CallTableRow";

// 🚀 COMPOSANT MEMOIZÉ pour une carte mobile
const MobileCallCard = memo<{
  call: Call;
  isExpanded: boolean;
  onToggleExpansion: (callid: string) => void;
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
}>(({ call, isExpanded, onToggleExpansion, onCallClick, onDeleteClick }) => {
  const handleToggle = useCallback(
    () => onToggleExpansion(call.callid),
    [onToggleExpansion, call.callid]
  );
  const handleCallClick = useCallback(
    () => onCallClick(call),
    [onCallClick, call]
  );
  const handleDeleteClick = useCallback(
    () => onDeleteClick(call),
    [onDeleteClick, call]
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {call.filename || "Sans nom"}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              size="small"
              label={call.status || "Non supervisé"}
              color={getStatusColor(call.status)}
            />
            {call.upload ? (
              <Chip
                size="small"
                icon={<AudioFileIcon />}
                label="Audio"
                color="primary"
              />
            ) : (
              <Chip size="small" icon={<NoAudioIcon />} label="Pas d'audio" />
            )}
            {call.duree && (
              <Chip
                size="small"
                icon={<TimeIcon />}
                label={formatDuration(call.duree)}
              />
            )}
          </Stack>
        </Box>
        <IconButton size="small" onClick={handleToggle}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          {call.description && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {call.description}
            </Typography>
          )}
          <Typography
            variant="caption"
            display="block"
            color="textSecondary"
            sx={{ mb: 1 }}
          >
            ID: {String(call.callid).substring(0, 8)}...
          </Typography>
          {call.origine && (
            <Typography
              variant="caption"
              display="block"
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              Origine: {call.origine}
            </Typography>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleCallClick}
              disabled={!call.upload}
            >
              Écouter
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteClick}
            >
              Supprimer
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
});

MobileCallCard.displayName = "MobileCallCard";

const CallTableList: FC<CallTableListProps> = ({ showMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // States pour le tableau
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("callid");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [audioFilter, setAudioFilter] = useState<string>("all");
  const [origineFilter, setOrigineFilter] = useState<string>("all");

  // States pour l'édition inline de l'origine
  const [editingOrigine, setEditingOrigine] = useState<string | null>(null);
  const [tempOrigine, setTempOrigine] = useState<string>("");

  // States pour le dialog de suppression
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);

  // State pour l'expansion des lignes sur mobile
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {
    taggingCalls,
    selectTaggingCall,
    fetchTaggingTranscription,
    refreshTaggingCalls,
  } = useTaggingData();

  // 🚀 OPTIMISATION - Obtenir la liste unique des origines pour le filtre
  const uniqueOrigines = useMemo(() => {
    const origines = taggingCalls
      .map((call) => call.origine)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return origines;
  }, [taggingCalls]);

  // 🚀 OPTIMISATION - Handlers stables avec useCallback
  const handleStartEditOrigine = useCallback(
    (callid: string, currentOrigine: string) => {
      setEditingOrigine(callid);
      setTempOrigine(currentOrigine);
    },
    []
  );

  const handleCancelEditOrigine = useCallback(() => {
    setEditingOrigine(null);
    setTempOrigine("");
  }, []);

  const handleTempOriginChange = useCallback((value: string) => {
    setTempOrigine(value);
  }, []);

  // 🚀 OPTIMISATION - Fonction pour sauvegarder l'origine éditée avec useCallback
  const handleSaveOrigine = useCallback(
    async (callid: string, newOrigine: string) => {
      try {
        await updateCallOrigine(callid, newOrigine);
        await refreshTaggingCalls?.();
        setEditingOrigine(null);
        setTempOrigine("");
        showMessage(`Origine mise à jour avec succès: ${newOrigine}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la mise à jour de l'origine:", error);
        showMessage(`Erreur lors de la mise à jour: ${errorMessage}`);
      }
    },
    [refreshTaggingCalls, showMessage]
  );

  // 🚀 OPTIMISATION - Fonction de tri avec useCallback
  const handleRequestSort = useCallback(
    (property: OrderBy) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
    },
    [orderBy, order]
  );

  // 🚀 OPTIMISATION - Fonction de comparaison pour le tri
  const getComparator = useCallback((order: Order, orderBy: OrderBy) => {
    return order === "desc"
      ? (a: Call, b: Call) => descendingComparator(a, b, orderBy)
      : (a: Call, b: Call) => -descendingComparator(a, b, orderBy);
  }, []);

  const descendingComparator = useCallback(
    (a: Call, b: Call, orderBy: OrderBy) => {
      const aValue = a[orderBy] || "";
      const bValue = b[orderBy] || "";

      if (orderBy === "duree") {
        return (b.duree || 0) - (a.duree || 0);
      }

      if (bValue < aValue) return -1;
      if (bValue > aValue) return 1;
      return 0;
    },
    []
  );

  // 🚀 OPTIMISATION MAJEURE - Filtrage et tri des données avec dépendances spécifiques
  const filteredAndSortedCalls = useMemo(() => {
    let filtered = taggingCalls.filter((call) => {
      const searchMatch =
        !searchTerm ||
        [call.filename, call.description, call.callid].some((field) => {
          if (!field) return false;
          const fieldStr = String(field).toLowerCase();
          return fieldStr.includes(searchTerm.toLowerCase());
        });

      const statusMatch =
        statusFilter === "all" || call.status === statusFilter;
      const audioMatch =
        audioFilter === "all" ||
        (audioFilter === "with_audio" && call.upload) ||
        (audioFilter === "without_audio" && !call.upload);
      const origineMatch =
        origineFilter === "all" || call.origine === origineFilter;

      return searchMatch && statusMatch && audioMatch && origineMatch;
    });

    const comparator = getComparator(order, orderBy);
    filtered.sort(comparator);
    return filtered;
  }, [
    taggingCalls,
    searchTerm,
    statusFilter,
    audioFilter,
    origineFilter,
    order,
    orderBy,
    getComparator,
  ]);

  // 🚀 OPTIMISATION - Pagination avec dépendances spécifiques
  const paginatedCalls = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedCalls.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedCalls, page, rowsPerPage]);

  // 🚀 OPTIMISATION - Gestion du clic sur un appel avec useCallback
  const handleCallClick = useCallback(
    async (call: Call) => {
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
    },
    [selectTaggingCall, showMessage, fetchTaggingTranscription]
  );

  const handleDeleteClick = useCallback((call: Call) => {
    setCallToDelete(call);
    setConfirmDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
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
  }, [callToDelete, showMessage]);

  const toggleRowExpansion = useCallback((callid: string) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(callid)) {
        newExpanded.delete(callid);
      } else {
        newExpanded.add(callid);
      }
      return newExpanded;
    });
  }, []);

  // 🚀 OPTIMISATION - Handlers pour les filtres avec useCallback
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setPage(0);
    },
    []
  );

  const handleStatusFilterChange = useCallback((e: any) => {
    setStatusFilter(e.target.value);
    setPage(0);
  }, []);

  const handleAudioFilterChange = useCallback((e: any) => {
    setAudioFilter(e.target.value);
    setPage(0);
  }, []);

  const handleOrigineFilterChange = useCallback((e: any) => {
    setOrigineFilter(e.target.value);
    setPage(0);
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(e.target.value, 10));
      setPage(0);
    },
    []
  );

  // Interface mobile avec cartes condensées
  if (isMobile) {
    return (
      <Box>
        <Typography variant="body1" paragraph>
          Cette section affiche les appels chargés disponibles pour le tagging.
        </Typography>

        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher par nom, description ou ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="non_supervisé">Non supervisé</MenuItem>
                <MenuItem value="en_cours">En cours</MenuItem>
                <MenuItem value="évalué">Évalué</MenuItem>
                <MenuItem value="terminé">Terminé</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Audio</InputLabel>
              <Select
                value={audioFilter}
                label="Audio"
                onChange={handleAudioFilterChange}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="with_audio">Avec audio</MenuItem>
                <MenuItem value="without_audio">Sans audio</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Origine</InputLabel>
              <Select
                value={origineFilter}
                label="Origine"
                onChange={handleOrigineFilterChange}
              >
                <MenuItem value="all">Toutes</MenuItem>
                {uniqueOrigines.map((origine: string) => (
                  <MenuItem key={origine} value={origine}>
                    {origine}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

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
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Appels par page"
        />

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

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Rechercher par nom, description ou ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="non_supervisé">Non supervisé</MenuItem>
              <MenuItem value="en_cours">En cours</MenuItem>
              <MenuItem value="évalué">Évalué</MenuItem>
              <MenuItem value="coaching_planifié">Coaching planifié</MenuItem>
              <MenuItem value="terminé">Terminé</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Audio</InputLabel>
            <Select
              value={audioFilter}
              label="Audio"
              onChange={handleAudioFilterChange}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="with_audio">Avec audio</MenuItem>
              <MenuItem value="without_audio">Sans audio</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Origine</InputLabel>
            <Select
              value={origineFilter}
              label="Origine"
              onChange={handleOrigineFilterChange}
            >
              <MenuItem value="all">Toutes les origines</MenuItem>
              {uniqueOrigines.map((origine: string) => (
                <MenuItem key={origine} value={origine}>
                  {origine}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="textSecondary">
            {filteredAndSortedCalls.length} appel(s) trouvé(s)
          </Typography>
        </Stack>
      </Paper>

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
                      active={orderBy === "filename"}
                      direction={orderBy === "filename" ? order : "asc"}
                      onClick={() => handleRequestSort("filename")}
                    >
                      Nom du fichier
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Audio</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "duree"}
                      direction={orderBy === "duree" ? order : "asc"}
                      onClick={() => handleRequestSort("duree")}
                    >
                      Durée
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "status"}
                      direction={orderBy === "status" ? order : "asc"}
                      onClick={() => handleRequestSort("status")}
                    >
                      Statut
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "origine"}
                      direction={orderBy === "origine" ? order : "asc"}
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
                    tempOrigine={tempOrigine}
                    onStartEditOrigine={handleStartEditOrigine}
                    onSaveOrigine={handleSaveOrigine}
                    onCancelEditOrigine={handleCancelEditOrigine}
                    onTempOriginChange={handleTempOriginChange}
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
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Appels par page"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
            }
          />
        </>
      )}

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
