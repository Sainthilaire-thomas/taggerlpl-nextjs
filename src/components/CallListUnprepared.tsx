// CallListUnprepared.tsx - Version modifiée avec séparation des responsabilités
"use client";

import { useEffect, useState, FC } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ButtonGroup,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircleIcon from "@mui/icons-material/Circle";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import DescriptionIcon from "@mui/icons-material/Description";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BuildIcon from "@mui/icons-material/Build";
import DeleteIcon from "@mui/icons-material/Delete";

import { supabase } from "@/lib/supabaseClient";
import FilterInput from "./FilterInput";
import { ComplementActionButtons } from "./calls/ComplementActionButtons";
import { AudioUploadModal } from "./AudioUploadModal";
import { TranscriptionUploadModal } from "./calls/TranscriptionUploadModal";
import { uploadAudio } from "./utils/callApiUtils";
import { generateSignedUrl } from "./utils/signedUrls";
import { validateTranscriptionJSON } from "./utils/validateTranscriptionJSON";

import { deleteCallCompletely } from "./utils/deleteCallCompletely";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
// Types (gardés identiques)
interface Word {
  text: string;
  turn: string;
  startTime: number;
  endTime: number;
}

interface Transcription {
  words: Word[];
}

interface Call {
  callid: string;
  origine?: string;
  filename?: string;
  description?: string;
  status?: "conflictuel" | "non_conflictuel" | "non_supervisé";
  duree?: number;
  transcription?: Transcription;
  audiourl?: string;
  filepath?: string;
  upload?: boolean;
  preparedfortranscript?: boolean;
  is_tagging_call?: boolean;
}

interface CallsByOrigin {
  [origin: string]: Call[];
}

interface StatusCount {
  conflictuel: number;
  nonSupervisé: number;
  nonConflictuel: number;
}

interface CallListUnpreparedProps {
  onPrepareCall: (params: {
    call: Call;
    showMessage: (message: string) => void;
  }) => Promise<void>;
  showMessage: (message: string) => void;
}

// Types pour les filtres (gardés identiques)
type PreparationState = "all" | "to_prepare" | "prepared";
type ContentType =
  | "all"
  | "complete"
  | "audio_only"
  | "transcript_only"
  | "empty";
type StatusFilter = "all" | "conflictuel" | "non_conflictuel" | "non_supervisé";

interface PreparationFilters {
  state: PreparationState;
  content: ContentType;
  status: StatusFilter;
  keyword: string;
}

const CallListUnprepared: FC<CallListUnpreparedProps> = ({
  onPrepareCall,
  showMessage,
}) => {
  const [callsByOrigin, setCallsByOrigin] = useState<CallsByOrigin>({});
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // ✅ NOUVEAUX ÉTATS pour les modals de complément
  const [audioModalOpen, setAudioModalOpen] = useState<boolean>(false);
  const [transcriptionModalOpen, setTranscriptionModalOpen] =
    useState<boolean>(false);
  const [complementCall, setComplementCall] = useState<Call | null>(null);

  const [filters, setFilters] = useState<PreparationFilters>({
    state: "all",
    content: "all",
    status: "all",
    keyword: "",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Chargement des appels (gardé identique)
  useEffect(() => {
    const fetchTaggingCalls = async () => {
      try {
        const { data, error } = await supabase
          .from("call")
          .select("*")
          .eq("is_tagging_call", true)
          .order("callid", { ascending: false });

        if (error) {
          console.error("Erreur lors du chargement des appels :", error);
          showMessage("Erreur lors du chargement des appels");
          return;
        }

        console.log(`📊 ${data?.length || 0} appels de tagging chargés`);

        const groupedByOrigin = (data as Call[]).reduce<CallsByOrigin>(
          (acc, call) => {
            const origin = call.origine || "Inconnue";
            if (!acc[origin]) acc[origin] = [];
            acc[origin].push(call);
            return acc;
          },
          {}
        );

        setCallsByOrigin(groupedByOrigin);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Erreur inattendue :", errorMessage);
        showMessage(`Erreur inattendue: ${errorMessage}`);
      }
    };

    fetchTaggingCalls();
  }, [showMessage]);

  // Fonctions de filtrage et statistiques (gardées identiques)
  const filterCalls = (calls: Call[]): Call[] => {
    return calls.filter((call) => {
      if (filters.state === "to_prepare" && call.preparedfortranscript)
        return false;
      if (filters.state === "prepared" && !call.preparedfortranscript)
        return false;

      const hasAudio = call.upload && call.filepath;
      const hasTranscription =
        call.transcription?.words && call.transcription.words.length > 0;

      switch (filters.content) {
        case "complete":
          if (!hasAudio || !hasTranscription) return false;
          break;
        case "audio_only":
          if (!hasAudio || hasTranscription) return false;
          break;
        case "transcript_only":
          if (hasAudio || !hasTranscription) return false;
          break;
        case "empty":
          if (hasAudio || hasTranscription) return false;
          break;
      }

      if (filters.status !== "all" && call.status !== filters.status) {
        return false;
      }

      if (filters.keyword.trim()) {
        const keyword = filters.keyword.trim().toLowerCase();
        const hasKeywordMatch = call.transcription?.words?.some((word) =>
          word.text.toLowerCase().includes(keyword)
        );
        if (!hasKeywordMatch) return false;
      }

      return true;
    });
  };

  const getCallStats = (calls: Call[]) => {
    const stats = {
      total: calls.length,
      toPreparate: 0,
      prepared: 0,
      complete: 0,
      audioOnly: 0,
      transcriptOnly: 0,
      empty: 0,
      conflictuel: 0,
      nonConflictuel: 0,
      nonSupervisé: 0,
    };

    calls.forEach((call) => {
      if (call.preparedfortranscript) {
        stats.prepared++;
      } else {
        stats.toPreparate++;
      }

      const hasAudio = call.upload && call.filepath;
      const hasTranscription =
        call.transcription?.words && call.transcription.words.length > 0;

      if (hasAudio && hasTranscription) {
        stats.complete++;
      } else if (hasAudio) {
        stats.audioOnly++;
      } else if (hasTranscription) {
        stats.transcriptOnly++;
      } else {
        stats.empty++;
      }

      switch (call.status) {
        case "conflictuel":
          stats.conflictuel++;
          break;
        case "non_conflictuel":
          stats.nonConflictuel++;
          break;
        default:
          stats.nonSupervisé++;
      }
    });

    return stats;
  };

  const handleFilterChange = (
    filterType: keyof PreparationFilters,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // ✅ MODIFICATION PRINCIPALE: Nouveau gestionnaire pour bouton "Préparer"
  const handlePrepareCallClick = async (call: Call) => {
    console.log("🔧 Préparation technique pour appel:", call.callid);

    // Vérifier qu'il y a une transcription (prérequis)
    if (!call.transcription?.words || call.transcription.words.length === 0) {
      showMessage("❌ Impossible de préparer: aucune transcription trouvée");
      return;
    }

    try {
      // ✅ NOUVEAU: Appeler directement prepareCallForTagging (transformation JSON → DB)
      await onPrepareCall({ call, showMessage });
      showMessage(
        `✅ Appel ${call.callid} préparé avec succès pour le tagging !`
      );

      // Actualiser la liste
      const updatedCallsByOrigin = { ...callsByOrigin };
      const origin = call.origine || "Inconnue";
      if (updatedCallsByOrigin[origin]) {
        updatedCallsByOrigin[origin] = updatedCallsByOrigin[origin].map((c) =>
          c.callid === call.callid ? { ...c, preparedfortranscript: true } : c
        );
        setCallsByOrigin(updatedCallsByOrigin);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Erreur préparation:", errorMessage);
      showMessage(`❌ Erreur lors de la préparation: ${errorMessage}`);
    }
  };

  // ✅ NOUVEAUX GESTIONNAIRES pour les actions de complément
  const handleAddAudio = (call: Call) => {
    console.log("🎵 Ouvrir modal audio pour appel:", call.callid);
    setComplementCall(call);
    setAudioModalOpen(true);
  };

  const handleAddTranscription = (call: Call) => {
    console.log("📝 Ouvrir modal transcription pour appel:", call.callid);
    setComplementCall(call);
    setTranscriptionModalOpen(true);
  };

  const handleViewContent = (call: Call) => {
    console.log("👁️ Voir contenu de l'appel:", call.callid);
    setSelectedCall(call);
    setDialogOpen(true);
  };

  // ✅ HANDLER d'upload audio vers Supabase (utilise les fonctions existantes)
  const handleAudioUpload = async (file: File, call?: Call) => {
    if (!call) return;

    console.log("✅ Upload audio:", file.name, "pour appel:", call.callid);

    try {
      // 1. Upload fichier vers Supabase Storage
      const filePath = await uploadAudio(file);
      console.log("📤 Fichier uploadé vers:", filePath);

      // 2. Génération URL signée
      const audioUrl = await generateSignedUrl(filePath, 1200); // 20 minutes
      console.log("🔗 URL signée générée");

      // 3. Mise à jour de la table call
      const { error: updateError } = await supabase
        .from("call")
        .update({
          audiourl: audioUrl,
          filepath: filePath,
          upload: true,
        })
        .eq("callid", call.callid);

      if (updateError) {
        throw new Error(`Erreur mise à jour call: ${updateError.message}`);
      }

      console.log("✅ Table call mise à jour pour:", call.callid);
      showMessage(
        `🎵 Audio ${file.name} ajouté avec succès à l'appel ${call.callid} !`
      );

      // 4. Actualiser la liste des appels localement
      setCallsByOrigin((prev) => {
        const updated: CallsByOrigin = { ...prev };
        const origin = call.origine || "Inconnue";
        if (updated[origin]) {
          updated[origin] = updated[origin].map((c) =>
            c.callid === call.callid
              ? { ...c, audiourl: audioUrl, filepath: filePath, upload: true }
              : c
          );
        }
        return updated;
      });

      // Fermer modal
      setAudioModalOpen(false);
      setComplementCall(null);
    } catch (error) {
      console.error("❌ Erreur upload audio:", error);
      showMessage(
        `❌ Erreur upload audio: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  };

  const handleTranscriptionUpload = async (
    transcriptionText: string,
    call?: Call
  ) => {
    if (!call) return;

    console.log(
      "✅ Upload transcription:",
      transcriptionText.length,
      "chars pour appel:",
      call.callid
    );

    try {
      // ✅ Utiliser la fonction de validation existante
      const validationResult = validateTranscriptionJSON(transcriptionText);

      if (!validationResult.isValid) {
        throw new Error(`Transcription invalide: ${validationResult.error}`);
      }

      const parsedTranscription = validationResult.data;
      console.log(
        "✅ Transcription validée:",
        parsedTranscription?.words?.length || 0,
        "mots"
      );

      // Afficher les avertissements s'il y en a
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn(
          "⚠️ Avertissements de validation:",
          validationResult.warnings
        );
        showMessage(
          `Transcription valide avec avertissements: ${validationResult.warnings.join(
            ", "
          )}`
        );
      }

      // Mise à jour de la table call avec la transcription validée
      const { error: updateError } = await supabase
        .from("call")
        .update({
          transcription: parsedTranscription,
        })
        .eq("callid", call.callid);

      if (updateError) {
        throw new Error(
          `Erreur mise à jour transcription: ${updateError.message}`
        );
      }

      console.log("✅ Transcription mise à jour pour:", call.callid);
      showMessage(
        `📝 Transcription ajoutée avec succès à l'appel ${call.callid} (${
          parsedTranscription?.words?.length || 0
        } mots) !`
      );

      // Actualiser la liste des appels localement
      setCallsByOrigin((prev) => {
        const updated: CallsByOrigin = { ...prev };
        const origin = call.origine || "Inconnue";
        if (updated[origin]) {
          updated[origin] = updated[origin].map((c) =>
            c.callid === call.callid
              ? { ...c, transcription: parsedTranscription }
              : c
          );
        }
        return updated;
      });

      // Fermer modal
      setTranscriptionModalOpen(false);
      setComplementCall(null);
    } catch (error) {
      console.error("❌ Erreur upload transcription:", error);
      showMessage(
        `❌ Erreur upload transcription: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  };

  // Autres fonctions gardées identiques
  const handleViewJSONB = (call: Call) => {
    setSelectedCall(call);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedCall(null);
    setDialogOpen(false);
  };

  const handleStatusChange = async (
    call: Call,
    newStatus: "conflictuel" | "non_conflictuel" | "non_supervisé"
  ) => {
    try {
      const { error } = await supabase
        .from("call")
        .update({ status: newStatus })
        .eq("callid", call.callid);

      if (error) {
        console.error("Erreur lors de la mise à jour du statut :", error);
        return;
      }

      setCallsByOrigin((prev) => {
        const updated: CallsByOrigin = { ...prev };
        const origin = call.origine || "Inconnue";
        if (updated[origin]) {
          updated[origin] = updated[origin].map((c) =>
            c.callid === call.callid ? { ...c, status: newStatus } : c
          );
        }
        return updated;
      });

      if (selectedCall?.callid === call.callid) {
        setSelectedCall((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Erreur inattendue lors de la mise à jour :", errorMessage);
    }
  };

  const getContentIcon = (call: Call) => {
    const hasAudio = call.upload && call.filepath;
    const hasTranscription =
      call.transcription?.words && call.transcription.words.length > 0;

    if (hasAudio && hasTranscription) {
      return (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <AudioFileIcon color="primary" fontSize="small" />
          <DescriptionIcon color="secondary" fontSize="small" />
        </Box>
      );
    } else if (hasAudio) {
      return <AudioFileIcon color="primary" fontSize="small" />;
    } else if (hasTranscription) {
      return <DescriptionIcon color="secondary" fontSize="small" />;
    } else {
      return <WarningIcon color="warning" fontSize="small" />;
    }
  };

  const getContentLabel = (call: Call) => {
    const hasAudio = call.upload && call.filepath;
    const hasTranscription =
      call.transcription?.words && call.transcription.words.length > 0;

    if (hasAudio && hasTranscription) return "Audio + Transcription";
    if (hasAudio) return "Audio seul";
    if (hasTranscription) return "Transcription seule";
    return "Vide";
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case "conflictuel":
        return "red";
      case "non_conflictuel":
        return "green";
      default:
        return "gray";
    }
  };

  const countStatuses = (calls: Call[]): StatusCount => {
    let conflictuel = 0;
    let nonSupervisé = 0;
    let nonConflictuel = 0;

    calls.forEach((call) => {
      switch (call.status) {
        case "conflictuel":
          conflictuel++;
          break;
        case "non_supervisé":
          nonSupervisé++;
          break;
        case "non_conflictuel":
          nonConflictuel++;
          break;
        default:
          nonSupervisé++;
      }
    });

    return { conflictuel, nonSupervisé, nonConflictuel };
  };

  /**
   * Ouvre le dialog de confirmation pour supprimer un appel
   */
  const handleDeleteClick = (call: Call) => {
    console.log("🗑️ Demande de suppression pour appel:", call.callid);
    setCallToDelete(call);
    setDeleteDialogOpen(true);
  };

  /**
   * Ferme le dialog de suppression
   */
  const handleDeleteDialogClose = () => {
    if (isDeleting) return; // Empêcher la fermeture pendant la suppression
    setDeleteDialogOpen(false);
    setCallToDelete(null);
  };

  /**
   * Supprime complètement un appel après confirmation
   */
  const handleDeleteConfirm = async (call: Call) => {
    if (!call) return;

    setIsDeleting(true);
    console.log("🗑️ Suppression confirmée pour appel:", call.callid);

    try {
      // Appeler la fonction de suppression complète
      const result = await deleteCallCompletely(call.callid);

      if (result.success) {
        console.log("✅ Suppression réussie:", result);

        // Mettre à jour l'interface locale
        setCallsByOrigin((prev) => {
          const updated: CallsByOrigin = { ...prev };
          const origin = call.origine || "Inconnue";

          if (updated[origin]) {
            // Retirer l'appel de la liste
            updated[origin] = updated[origin].filter(
              (c) => c.callid !== call.callid
            );

            // Si la liste devient vide, supprimer l'origine
            if (updated[origin].length === 0) {
              delete updated[origin];
            }
          }

          return updated;
        });

        // Afficher le message de succès
        showMessage(result.message);

        // Fermer le dialog
        setDeleteDialogOpen(false);
        setCallToDelete(null);

        console.log("🎉 Interface mise à jour après suppression");
      } else {
        console.error("❌ Erreur lors de la suppression:", result.error);
        showMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "❌ Erreur inattendue lors de la suppression:",
        errorMessage
      );
      showMessage(`❌ Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTranscription = (transcription?: Transcription) => {
    if (!transcription?.words || transcription.words.length === 0) {
      return <Typography>Aucune transcription disponible.</Typography>;
    }

    return transcription.words.map((word, index) => (
      <Box
        key={index}
        p={1}
        sx={{
          backgroundColor: index % 2 === 0 ? "#232222" : "#4d4d4d",
          borderRadius: "4px",
        }}
      >
        <Typography variant="body2">
          <strong>{word.turn || "Inconnu"} :</strong> [
          {word.startTime.toFixed(2)} - {word.endTime.toFixed(2)}] {word.text}
        </Typography>
      </Box>
    ));
  };

  // ✅ NOUVEAU: Analyser l'état d'un appel pour les actions
  const getCallActions = (call: Call) => {
    const hasAudio = call.upload && call.filepath;
    const hasTranscription =
      call.transcription?.words && call.transcription.words.length > 0;

    return {
      needsAudio: !hasAudio,
      needsTranscription: !hasTranscription,
      canPrepare: hasTranscription && !call.preparedfortranscript,
      isPrepared: call.preparedfortranscript,
    };
  };

  // Calculs (gardés identiques)
  const allCalls = Object.values(callsByOrigin).flat();
  const globalStats = getCallStats(allCalls);
  const filteredCallsByOriginResult = Object.entries(
    callsByOrigin
  ).reduce<CallsByOrigin>((acc, [origin, calls]) => {
    const filteredCalls = filterCalls(calls);
    if (filteredCalls.length > 0) {
      acc[origin] = filteredCalls;
    }
    return acc;
  }, {});

  return (
    <Box>
      {/* Statistiques globales (gardées identiques) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Vue d'ensemble des appels
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${globalStats.total} Total`}
              color="default"
              variant="outlined"
            />
            <Chip
              label={`${globalStats.toPreparate} À préparer`}
              color="warning"
              variant={filters.state === "to_prepare" ? "filled" : "outlined"}
            />
            <Chip
              label={`${globalStats.prepared} Préparés`}
              color="success"
              variant={filters.state === "prepared" ? "filled" : "outlined"}
            />
            <Chip
              label={`${globalStats.complete} Complets`}
              color="primary"
              variant={filters.content === "complete" ? "filled" : "outlined"}
            />
            <Chip
              label={`${globalStats.transcriptOnly} Transcription seule`}
              color="secondary"
              variant={
                filters.content === "transcript_only" ? "filled" : "outlined"
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* Filtres avancés (gardés identiques) */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          🔍 Filtres avancés
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>État</InputLabel>
            <Select
              value={filters.state}
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange("state", e.target.value)
              }
            >
              <MenuItem value="all">Tous les appels</MenuItem>
              <MenuItem value="to_prepare">À préparer</MenuItem>
              <MenuItem value="prepared">Déjà préparés</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Contenu</InputLabel>
            <Select
              value={filters.content}
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange("content", e.target.value)
              }
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="complete">Audio + Transcription</MenuItem>
              <MenuItem value="audio_only">Audio seul</MenuItem>
              <MenuItem value="transcript_only">Transcription seule</MenuItem>
              <MenuItem value="empty">Vide</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filters.status}
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange("status", e.target.value)
              }
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="non_supervisé">Non supervisé</MenuItem>
              <MenuItem value="conflictuel">Conflictuel</MenuItem>
              <MenuItem value="non_conflictuel">Non conflictuel</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <FilterInput
          filterValue={filters.keyword}
          setFilterValue={(value) => handleFilterChange("keyword", value)}
        />
      </Paper>

      {/* ✅ MODIFICATION: Table avec nouvelle colonne Actions de Complément */}
      {Object.entries(filteredCallsByOriginResult).map(([origin, calls]) => {
        const { conflictuel, nonSupervisé, nonConflictuel } =
          countStatuses(calls);

        return (
          <Accordion key={origin}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Typography sx={{ flexGrow: 1 }}>
                  {origin} ({calls.length} appels)
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip size="small" label={`${nonSupervisé} non supervisés`} />
                  <Chip
                    size="small"
                    label={`${conflictuel} conflictuels`}
                    color="error"
                  />
                  <Chip
                    size="small"
                    label={`${nonConflictuel} non conflictuels`}
                    color="success"
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small" aria-label={`Appels de ${origin}`}>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>ID</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Actions de Complément</strong>
                      </TableCell>
                      <TableCell>
                        <strong>État</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Statut</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Fichier</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Description</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Durée (s)</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Préparation Technique</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calls.map((call) => {
                      const actions = getCallActions(call);

                      return (
                        <TableRow key={call.callid}>
                          {/* ✅ NOUVELLE COLONNE: ID de l'appel */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                                color: "text.secondary",
                              }}
                            >
                              {call.callid}
                            </Typography>
                          </TableCell>
                          {/* ✅ COLONNE: Actions de Complément */}
                          <TableCell>
                            <ComplementActionButtons
                              call={call}
                              onAddAudio={
                                actions.needsAudio ? handleAddAudio : undefined
                              }
                              onAddTranscription={
                                actions.needsTranscription
                                  ? handleAddTranscription
                                  : undefined
                              }
                              onViewContent={handleViewContent}
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {getContentIcon(call)}
                              <Typography variant="caption">
                                {getContentLabel(call)}
                              </Typography>
                              {call.preparedfortranscript && (
                                <Chip
                                  size="small"
                                  label="Préparé"
                                  color="success"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <CircleIcon
                              style={{
                                color: getStatusColor(call.status),
                                fontSize: "1.5rem",
                              }}
                            />
                          </TableCell>
                          <TableCell>{call.filename}</TableCell>
                          <TableCell>
                            {call.description || "Pas de description"}
                          </TableCell>
                          <TableCell>
                            {call.duree ? `${call.duree} s` : "Inconnue"}
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              {/* Logique de préparation (garde la même) */}
                              {actions.canPrepare ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handlePrepareCallClick(call)}
                                >
                                  PRÉPARER
                                </Button>
                              ) : actions.isPrepared ? (
                                <Chip
                                  size="small"
                                  label="→ Liste"
                                  color="success"
                                />
                              ) : (
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  Transcription requise
                                </Typography>
                              )}

                              {/* ✅ NOUVEAU: Bouton de suppression épuré */}
                              <Button
                                size="small"
                                variant="text"
                                color="inherit"
                                onClick={() => handleDeleteClick(call)}
                                disabled={
                                  isDeleting &&
                                  callToDelete?.callid === call.callid
                                }
                                sx={{
                                  minWidth: "auto",
                                  padding: "4px 8px",
                                  "&:hover": {
                                    backgroundColor: "error.light",
                                    color: "error.contrastText",
                                  },
                                  "&:disabled": {
                                    opacity: 0.3,
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Message si aucun appel trouvé (gardé identique) */}
      {Object.keys(filteredCallsByOriginResult).length === 0 && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="textSecondary">
            Aucun appel ne correspond aux filtres sélectionnés.
          </Typography>
          {allCalls.length === 0 && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Aucun appel de tagging trouvé. Importez d'abord des appels depuis
              l'onglet "Import d'appels".
            </Typography>
          )}
        </Paper>
      )}

      {/* Modal transcription (gardé identique) */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Transcription de l&apos;appel
          {selectedCall && (
            <Button
              size="small"
              sx={{
                color: "white",
                backgroundColor: getStatusColor(selectedCall.status),
              }}
              onClick={() => {
                const newStatus =
                  selectedCall.status === "conflictuel"
                    ? "non_supervisé"
                    : selectedCall.status === "non_supervisé"
                    ? "non_conflictuel"
                    : "conflictuel";
                handleStatusChange(selectedCall, newStatus);
              }}
            >
              {selectedCall.status === "conflictuel"
                ? "Conflictuel"
                : selectedCall.status === "non_supervisé"
                ? "Non Supervisé"
                : "Non Conflictuel"}
            </Button>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedCall ? (
            renderTranscription(selectedCall.transcription)
          ) : (
            <Typography>Chargement...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ NOUVEAUX MODALS pour les actions de complément */}
      <AudioUploadModal
        open={audioModalOpen}
        call={complementCall}
        mode="complement"
        onClose={() => {
          setAudioModalOpen(false);
          setComplementCall(null);
        }}
        onUpload={handleAudioUpload}
      />

      <TranscriptionUploadModal
        open={transcriptionModalOpen}
        call={complementCall}
        onClose={() => {
          setTranscriptionModalOpen(false);
          setComplementCall(null);
        }}
        onUpload={handleTranscriptionUpload}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        call={callToDelete}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </Box>
  );
};

export default CallListUnprepared;
