// app/(protected)/supervision/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  TextField,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  Badge,
} from "@mui/material";
import {
  PlayArrow,
  Edit,
  Search,
  Visibility,
  AudioFile,
  Assignment,
  Close,
  Refresh,
} from "@mui/icons-material";
import { useTaggingData } from "@/context/TaggingDataContext";
import { supabase } from "@/lib/supabaseClient";
import TranscriptLPL from "@/components/TranscriptLPL";
import { generateSignedUrl } from "@/components/utils/signedUrls";
import AppLayout from "../layout";

// ======================================
// INTERFACES TYPESCRIPT
// ======================================

interface SupervisionTurnTagged {
  id: number;
  call_id: string;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  speaker: string;
  start_time: number;
  end_time: number;
  color: string;
  family: string;
  filename?: string;
  hasTranscript: boolean;
  hasAudio: boolean;
  audioUrl?: string;
  duration?: number;
}

interface TagGroupStats {
  label: string;
  count: number;
  color: string;
  family: string;
}

interface SupervisionFilters {
  selectedTag: string;
  selectedFamily: string;
  selectedSpeaker: string;
  searchText: string;
  hasAudio: boolean | null;
  hasTranscript: boolean | null;
}

// ======================================
// COMPOSANT PRINCIPAL
// ======================================

export default function SupervisionPage() {
  // States pour les données
  const [supervisionData, setSupervisionData] = useState<
    SupervisionTurnTagged[]
  >([]);
  const [tagStats, setTagStats] = useState<TagGroupStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States pour les filtres
  const [filters, setFilters] = useState<SupervisionFilters>({
    selectedTag: "all",
    selectedFamily: "all",
    selectedSpeaker: "all",
    searchText: "",
    hasAudio: null,
    hasTranscript: null,
  });

  // States pour la pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  // States pour le modal de tagging
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState(false);
  const [selectedRowForTagging, setSelectedRowForTagging] =
    useState<SupervisionTurnTagged | null>(null);
  const [taggingAudioUrl, setTaggingAudioUrl] = useState<string>("");

  // Context du tagging
  const { selectTaggingCall, fetchTaggingTranscription, fetchTaggedTurns } =
    useTaggingData();

  // ======================================
  // CHARGEMENT DES DONNÉES
  // ======================================

  const loadSupervisionData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Chargement COMPLET des données de supervision...");

      // 🔄 PAGINATION AUTOMATIQUE pour charger TOUS les turntagged
      const loadAllTurntagged = async () => {
        const pageSize = 1000;
        let allTurntagged: any[] = [];
        let page = 0;
        let hasMore = true;

        console.log("📊 Chargement de TOUS les turntagged...");

        while (hasMore) {
          const { data, error, count } = await supabase
            .from("turntagged")
            .select(
              `
            id,
            call_id,
            tag,
            verbatim,
            next_turn_verbatim,
            speaker,
            start_time,
            end_time,
            lpltag(
              label,
              color,
              family
            )
          `,
              { count: "exact" }
            )
            .order("id", { ascending: false }) // Plus récents en premier
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allTurntagged = [...allTurntagged, ...data];
            console.log(
              `📄 Page ${page + 1}: ${data.length} éléments (Total: ${
                allTurntagged.length
              }/${count})`
            );

            hasMore = data.length === pageSize;
            page++;
          } else {
            hasMore = false;
          }

          // Sécurité : arrêt à 5 000 éléments max pour éviter les timeouts
          if (allTurntagged.length >= 5000) {
            console.warn(
              `⚠️ Arrêt à ${allTurntagged.length} éléments pour éviter les timeouts`
            );
            hasMore = false;
          }
        }

        console.log(
          `✅ Pagination terminée: ${allTurntagged.length} turntagged récupérés`
        );
        return allTurntagged;
      };

      // Charger TOUS les turntagged
      const turntaggedData = await loadAllTurntagged();

      // Récupérer les call_ids uniques
      const callIds = [
        ...new Set(
          turntaggedData?.map((item) => String(item.call_id).trim()) || []
        ),
      ].filter((id) => id && id !== "" && id !== "null" && id !== "undefined");

      console.log(`🔍 ${callIds.length} appels uniques trouvés`);

      // Conversion en nombres pour les requêtes
      const callIdsAsNumbers = callIds
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      console.log(`🔄 Requêtes pour ${callIdsAsNumbers.length} appels...`);

      // Requêtes pour call et transcript
      const [callsQueryResult, transcriptsQueryResult] = await Promise.all([
        supabase
          .from("call")
          .select("callid, filename, filepath, upload, duree")
          .in("callid", callIdsAsNumbers),
        supabase
          .from("transcript")
          .select("callid")
          .in("callid", callIdsAsNumbers),
      ]);

      if (callsQueryResult.error) throw callsQueryResult.error;
      if (transcriptsQueryResult.error) throw transcriptsQueryResult.error;

      console.log(`📁 ${callsQueryResult.data?.length} appels trouvés`);
      console.log(
        `📋 ${transcriptsQueryResult.data?.length} transcriptions trouvées`
      );

      // Créer les maps de correspondance
      const callsMap = new Map(
        callsQueryResult.data?.map((call) => [String(call.callid), call]) || []
      );
      const transcriptsSet = new Set(
        transcriptsQueryResult.data?.map((t) => String(t.callid)) || []
      );

      // Construire les données enrichies
      const enrichedData: SupervisionTurnTagged[] =
        turntaggedData?.map((item) => {
          const callData = callsMap.get(String(item.call_id));
          const hasTranscript = transcriptsSet.has(String(item.call_id));

          // Vérification de l'audio
          const hasAudio = Boolean(
            callData &&
              callData.upload === true &&
              callData.filepath &&
              callData.filepath.trim() !== "" &&
              callData.filepath.trim() !== "null" &&
              callData.filepath.trim() !== "undefined"
          );

          // Gestion des tags
          const tagData = Array.isArray(item.lpltag)
            ? item.lpltag[0]
            : item.lpltag;
          const color = tagData?.color || "#999";
          const family = tagData?.family || "AUTRE";

          return {
            id: item.id,
            call_id: String(item.call_id),
            tag: item.tag,
            verbatim: item.verbatim || "",
            next_turn_verbatim: item.next_turn_verbatim || "",
            speaker: item.speaker || "Inconnu",
            start_time: item.start_time,
            end_time: item.end_time,
            color,
            family,
            filename: callData?.filename,
            hasTranscript,
            hasAudio,
            duration: callData?.duree,
          };
        }) || [];

      // Stats complètes
      const audioCount = enrichedData.filter((item) => item.hasAudio).length;
      const transcriptCount = enrichedData.filter(
        (item) => item.hasTranscript
      ).length;
      const modifiableCount = enrichedData.filter(
        (item) => item.hasAudio && item.hasTranscript
      ).length;
      const needsProcessingCount = enrichedData.filter(
        (item) => !item.hasAudio || !item.hasTranscript
      ).length;

      console.log(`✅ Stats complètes:`, {
        total: enrichedData.length,
        avecAudio: audioCount,
        avecTranscription: transcriptCount,
        modifiables: modifiableCount,
        besoinTraitement: needsProcessingCount,
        appelsDifferents: callIds.length,
      });

      setSupervisionData(enrichedData);

      // Calculer les statistiques par tag
      const statsMap = new Map<string, TagGroupStats>();
      enrichedData.forEach((item) => {
        const key = item.tag;
        if (statsMap.has(key)) {
          statsMap.get(key)!.count++;
        } else {
          statsMap.set(key, {
            label: item.tag,
            count: 1,
            color: item.color,
            family: item.family,
          });
        }
      });

      const sortedStats = Array.from(statsMap.values()).sort(
        (a, b) => b.count - a.count
      );

      setTagStats(sortedStats);

      console.log(
        `✅ ${enrichedData.length} turntagged chargés, ${sortedStats.length} tags uniques`
      );
    } catch (err) {
      console.error("❌ Erreur lors du chargement:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadSupervisionData();
  }, []);

  // ======================================
  // FILTRAGE ET PAGINATION
  // ======================================

  const filteredData = useMemo(() => {
    let filtered = supervisionData;

    // Filtre par tag
    if (filters.selectedTag !== "all") {
      filtered = filtered.filter((item) => item.tag === filters.selectedTag);
    }

    // Filtre par famille
    if (filters.selectedFamily !== "all") {
      filtered = filtered.filter(
        (item) => item.family === filters.selectedFamily
      );
    }

    // Filtre par speaker
    if (filters.selectedSpeaker !== "all") {
      filtered = filtered.filter(
        (item) => item.speaker === filters.selectedSpeaker
      );
    }

    // Filtre par texte de recherche
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.verbatim.toLowerCase().includes(searchLower) ||
          item.next_turn_verbatim.toLowerCase().includes(searchLower) ||
          String(item.call_id).toLowerCase().includes(searchLower) ||
          (item.filename && item.filename.toLowerCase().includes(searchLower))
      );
    }

    // Filtre par présence d'audio
    if (filters.hasAudio !== null) {
      filtered = filtered.filter((item) => item.hasAudio === filters.hasAudio);
    }

    // Filtre par présence de transcription
    if (filters.hasTranscript !== null) {
      filtered = filtered.filter(
        (item) => item.hasTranscript === filters.hasTranscript
      );
    }

    return filtered;
  }, [supervisionData, filters]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // ======================================
  // HANDLERS
  // ======================================

  const handleRowClick = async (row: SupervisionTurnTagged) => {
    if (!row.hasTranscript || !row.hasAudio) {
      alert("Cet appel n'a pas de transcription ou d'audio disponible");
      return;
    }

    try {
      setSelectedRowForTagging(row);
      setIsTaggingModalOpen(true);

      // Récupérer l'URL audio si nécessaire
      const callDataQuery = await supabase
        .from("call")
        .select("filepath")
        .eq("callid", row.call_id)
        .single();

      if (callDataQuery.data?.filepath) {
        const audioUrl = await generateSignedUrl(callDataQuery.data.filepath);
        setTaggingAudioUrl(audioUrl);

        // Préparer l'appel pour le tagging
        selectTaggingCall({
          callid: row.call_id,
          audiourl: audioUrl,
          filename: row.filename,
          is_tagging_call: true,
          preparedfortranscript: true,
        });

        // Charger la transcription et les tags
        await Promise.all([
          fetchTaggingTranscription(row.call_id),
          fetchTaggedTurns(row.call_id),
        ]);

        console.log(`✅ Appel ${row.call_id} préparé pour le tagging`);
      }
    } catch (error) {
      console.error("Erreur lors de la préparation du tagging:", error);
      alert("Erreur lors du chargement de l'appel");
    }
  };

  const closeTaggingModal = () => {
    setIsTaggingModalOpen(false);
    setSelectedRowForTagging(null);
    setTaggingAudioUrl("");
    // Recharger les données pour refléter les modifications
    loadSupervisionData();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Listes uniques pour les filtres
  const uniqueFamilies = [
    ...new Set(supervisionData.map((item) => item.family)),
  ];
  const uniqueSpeakers = [
    ...new Set(supervisionData.map((item) => item.speaker)),
  ];

  // ======================================
  // RENDU
  // ======================================

  if (loading) {
    return (
      <AppLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography>Chargement des données de supervision...</Typography>
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur lors du chargement: {error}
          <Button onClick={loadSupervisionData} sx={{ ml: 2 }}>
            Réessayer
          </Button>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ p: 2 }}>
        {/* En-tête */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            🔍 Supervision des Taggages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Supervision et retaggage contextualisé des {supervisionData.length}{" "}
            éléments taggés
          </Typography>
        </Box>

        {/* Statistiques rapides */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6">{supervisionData.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tags
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6">{tagStats.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Tags Uniques
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {
                  supervisionData.filter(
                    (item) => item.hasAudio && item.hasTranscript
                  ).length
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Éléments Modifiables
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="primary.main">
                {filteredData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Après Filtres
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {supervisionData.filter((item) => item.hasAudio).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avec Audio
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {supervisionData.filter((item) => item.hasTranscript).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avec Transcription
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {
                  supervisionData.filter(
                    (item) => !item.hasAudio || !item.hasTranscript
                  ).length
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Besoin Traitement
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filtres */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtres
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Recherche textuelle */}
            <TextField
              label="Rechercher"
              variant="outlined"
              size="small"
              value={filters.searchText}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchText: e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            {/* Filtre par tag */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Tag</InputLabel>
              <Select
                value={filters.selectedTag}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    selectedTag: e.target.value,
                  }))
                }
                label="Tag"
              >
                <MenuItem value="all">Tous les tags</MenuItem>
                {tagStats.slice(0, 20).map((stat) => (
                  <MenuItem key={stat.label} value={stat.label}>
                    <Badge badgeContent={stat.count} color="primary">
                      {stat.label}
                    </Badge>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Filtre par famille */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Famille</InputLabel>
              <Select
                value={filters.selectedFamily}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    selectedFamily: e.target.value,
                  }))
                }
                label="Famille"
              >
                <MenuItem value="all">Toutes les familles</MenuItem>
                {uniqueFamilies.map((family) => (
                  <MenuItem key={family} value={family}>
                    {family}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Filtre par speaker */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Speaker</InputLabel>
              <Select
                value={filters.selectedSpeaker}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    selectedSpeaker: e.target.value,
                  }))
                }
                label="Speaker"
              >
                <MenuItem value="all">Tous les speakers</MenuItem>
                {uniqueSpeakers.map((speaker) => (
                  <MenuItem key={speaker} value={speaker}>
                    {speaker}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Filtre par disponibilité audio */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Audio</InputLabel>
              <Select
                value={
                  filters.hasAudio === null
                    ? "all"
                    : filters.hasAudio.toString()
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    hasAudio: value === "all" ? null : value === "true",
                  }));
                }}
                label="Audio"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="true">Avec audio</MenuItem>
                <MenuItem value="false">Sans audio</MenuItem>
              </Select>
            </FormControl>

            {/* Filtre par disponibilité transcription */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Transcription</InputLabel>
              <Select
                value={
                  filters.hasTranscript === null
                    ? "all"
                    : filters.hasTranscript.toString()
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    hasTranscript: value === "all" ? null : value === "true",
                  }));
                }}
                label="Transcription"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="true">Avec transcription</MenuItem>
                <MenuItem value="false">Sans transcription</MenuItem>
              </Select>
            </FormControl>

            {/* Filtre rapide : Éléments modifiables */}
            <Button
              variant={
                filters.hasAudio === true && filters.hasTranscript === true
                  ? "contained"
                  : "outlined"
              }
              color="success"
              size="small"
              onClick={() => {
                const isActive =
                  filters.hasAudio === true && filters.hasTranscript === true;
                setFilters((prev) => ({
                  ...prev,
                  hasAudio: isActive ? null : true,
                  hasTranscript: isActive ? null : true,
                }));
              }}
              sx={{ minWidth: 140 }}
            >
              {filters.hasAudio === true && filters.hasTranscript === true
                ? "✅ Modifiables"
                : "🎯 Modifiables"}
            </Button>

            {/* Bouton de réinitialisation */}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setFilters({
                  selectedTag: "all",
                  selectedFamily: "all",
                  selectedSpeaker: "all",
                  searchText: "",
                  hasAudio: null,
                  hasTranscript: null,
                });
                setPage(1);
              }}
            >
              Reset
            </Button>
          </Box>
        </Paper>

        {/* Tableau des données */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tag</TableCell>
                <TableCell>Call ID</TableCell>
                <TableCell>Speaker</TableCell>
                <TableCell>Verbatim</TableCell>
                <TableCell>Next Turn</TableCell>
                <TableCell>Temps</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    cursor:
                      row.hasAudio && row.hasTranscript ? "pointer" : "default",
                    opacity: row.hasAudio && row.hasTranscript ? 1 : 0.6,
                  }}
                >
                  <TableCell>
                    <Chip
                      label={row.tag}
                      size="small"
                      sx={{
                        backgroundColor: row.color,
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.call_id}</Typography>
                    {row.filename && (
                      <Typography variant="caption" color="text.secondary">
                        {truncateText(row.filename, 30)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.speaker}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {truncateText(row.verbatim, 80)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {truncateText(row.next_turn_verbatim, 60)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatTime(row.start_time)} - {formatTime(row.end_time)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {row.hasAudio && (
                        <Tooltip title="Audio disponible">
                          <AudioFile fontSize="small" color="success" />
                        </Tooltip>
                      )}
                      {row.hasTranscript && (
                        <Tooltip title="Transcription disponible">
                          <Assignment fontSize="small" color="success" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {row.hasAudio && row.hasTranscript ? (
                      <Tooltip title="Ouvrir dans l'éditeur de tagging">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleRowClick(row)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Audio ou transcription manquant">
                        <IconButton size="small" disabled>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>

        {/* Modal de Tagging Intégré */}
        <Dialog
          open={isTaggingModalOpen}
          onClose={closeTaggingModal}
          maxWidth="xl"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              height: "90vh",
              maxHeight: "90vh",
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">
                🎯 Retaggage Contextualisé - {selectedRowForTagging?.call_id}
              </Typography>
              <IconButton onClick={closeTaggingModal}>
                <Close />
              </IconButton>
            </Box>
            {selectedRowForTagging && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={`Tag actuel: ${selectedRowForTagging.tag}`}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`Position: ${formatTime(
                    selectedRowForTagging.start_time
                  )}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}
          </DialogTitle>

          <DialogContent sx={{ p: 0, overflow: "hidden" }}>
            {selectedRowForTagging && taggingAudioUrl && (
              <TranscriptLPL
                callId={selectedRowForTagging.call_id}
                audioSrc={taggingAudioUrl}
              />
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeTaggingModal} variant="outlined">
              Fermer et Actualiser
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Les modifications sont sauvegardées automatiquement
            </Typography>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
