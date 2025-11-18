"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SearchIcon from "@mui/icons-material/Search";
import { useTaggingData } from "@/features/shared/context";

interface CallRow {
  callid: string;
  filename?: string;
  description?: string;
  duree?: number;
  status?: string;
  origine?: string;
  upload?: boolean;
  [key: string]: any;
}

export function CallsListTable() {
  const router = useRouter();
  const { taggingCalls } = useTaggingData();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrer les appels selon la recherche
  const filteredCalls = useMemo(() => {
    if (!searchQuery.trim()) return taggingCalls;
    
    const query = searchQuery.toLowerCase();
    return taggingCalls.filter((call: CallRow) => {
      const filename = call.filename?.toLowerCase() || "";
      const description = call.description?.toLowerCase() || "";
      const callid = String(call.callid);
      
      return (
        filename.includes(query) ||
        description.includes(query) ||
        callid.includes(query)
      );
    });
  }, [taggingCalls, searchQuery]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (callId: string) => {
    router.push(`/phase2-annotation/transcript/${callId}`);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "terminé":
        return "success";
      case "in_progress":
      case "en cours":
        return "warning";
      case "not_started":
      case "non démarré":
        return "default";
      default:
        return "default";
    }
  };

  if (!taggingCalls || taggingCalls.length === 0) {
    return (
      <Alert severity="info">
        Aucun appel disponible pour le tagging. Assurez-vous que des appels sont marqués comme
        &quot;is_tagging_call&quot; et &quot;preparedfortranscript&quot; dans la base de données.
      </Alert>
    );
  }

  const paginatedCalls = filteredCalls.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Barre de recherche */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom de fichier, description ou ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom de fichier</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Durée</TableCell>
              <TableCell align="center">Origine</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="center">Audio</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCalls.map((call: CallRow) => (
              <TableRow
                key={call.callid}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => handleRowClick(call.callid)}
              >
                <TableCell>{call.callid}</TableCell>
                <TableCell>
                  <strong>{call.filename || "Sans nom"}</strong>
                </TableCell>
                <TableCell>{call.description || "-"}</TableCell>
                <TableCell align="center">{formatDuration(call.duree)}</TableCell>
                <TableCell align="center">
                  {call.origine ? (
                    <Chip label={call.origine} size="small" variant="outlined" />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={call.status || "Non défini"}
                    size="small"
                    color={getStatusColor(call.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={call.upload ? "Disponible" : "Manquant"}
                    size="small"
                    color={call.upload ? "success" : "error"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Commencer le tagging">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(call.callid);
                      }}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredCalls.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />
    </Box>
  );
}
