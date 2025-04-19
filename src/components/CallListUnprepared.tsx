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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircleIcon from "@mui/icons-material/Circle";
import { supabase } from "@/lib/supabaseClient";
import FilterInput from "./FilterInput";
import AudioUploadModal from "./AudioUploadModal";
import { uploadAudio } from "./utils/callApiUtils";
import { generateSignedUrl } from "./utils/signedUrls";

// Types
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

const CallListUnprepared: FC<CallListUnpreparedProps> = ({
  onPrepareCall,
  showMessage,
}) => {
  const [callsByOrigin, setCallsByOrigin] = useState<CallsByOrigin>({});
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [filteredCallsByOrigin, setFilteredCallsByOrigin] =
    useState<CallsByOrigin>({});
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [callBeingPrepared, setCallBeingPrepared] = useState<Call | null>(null);

  // Charger les appels non préparés
  useEffect(() => {
    const fetchUnpreparedCalls = async () => {
      try {
        const { data, error } = await supabase
          .from("call")
          .select("*")
          .eq("preparedfortranscript", false);

        if (error) {
          console.error("Erreur lors du chargement des appels :", error);
          return;
        }

        // Regrouper les appels par origine
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
        setFilteredCallsByOrigin(groupedByOrigin); // Initialiser avec tous les appels
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Erreur inattendue :", errorMessage);
      }
    };

    fetchUnpreparedCalls();
  }, []);

  // Mettre à jour les appels filtrés à chaque changement de filtre ou d'appels
  useEffect(() => {
    const updatedFilteredCalls = Object.entries(
      callsByOrigin
    ).reduce<CallsByOrigin>((acc, [origin, calls]) => {
      // Appliquer le filtre par mot-clé
      const keyword = filterKeyword.trim().toLowerCase();
      const matchingCalls = calls.filter((call) => {
        const matchesKeyword = !keyword
          ? true // Pas de mot-clé = tous les appels
          : call.transcription?.words.some((word) =>
              word.text.toLowerCase().includes(keyword)
            );

        const matchesStatus =
          filterStatus === "all" || call.status === filterStatus;

        return matchesKeyword && matchesStatus;
      });

      if (matchingCalls.length > 0) {
        acc[origin] = matchingCalls;
      }

      return acc;
    }, {});

    setFilteredCallsByOrigin(updatedFilteredCalls);
  }, [callsByOrigin, filterKeyword, filterStatus]);

  // Filtrer les appels en fonction du statut sélectionné
  const filterCalls = (calls: Call[]): Call[] => {
    if (filterStatus === "all") return calls;
    return calls.filter((call) => call.status === filterStatus);
  };

  // preparer les appels pour TranscriptLPL
  const handlePrepareCallClick = async (call: Call) => {
    console.log("🔍 handlePrepareCallClick - call reçu :", call);
    if (!call) {
      showMessage("Erreur : L'appel sélectionné est invalide.");
      return;
    }

    setCallBeingPrepared(call);
    console.log("✅ handlePrepareCallClick - callBeingPrepared défini :", call);

    setIsAudioModalOpen(true);
  };

  const handleAudioUpload = async (audioFile: File) => {
    console.log("🔍 handleAudioUpload - Début avec audioFile :", audioFile);
    console.log(
      "📞 handleAudioUpload - callBeingPrepared :",
      callBeingPrepared
    );

    if (!callBeingPrepared) {
      console.error("❌ handleAudioUpload - callBeingPrepared est undefined");
      return;
    }

    try {
      const filePath = await uploadAudio(audioFile);
      console.log(
        "✅ handleAudioUpload - Fichier uploadé avec filePath :",
        filePath
      );

      const audioUrl = await generateSignedUrl(filePath);
      console.log("✅ handleAudioUpload - URL signée générée :", audioUrl);

      const { error } = await supabase
        .from("call")
        .update({ audiourl: audioUrl, filepath: filePath, upload: true })
        .eq("callid", callBeingPrepared.callid);

      if (error) throw new Error(error.message);

      console.log("✅ handleAudioUpload - Supabase mise à jour avec succès");
      showMessage("Fichier audio associé avec succès !");

      // Appeler `onPrepareCall` après avoir associé l'audio
      console.log(
        "🔔 handleAudioUpload - Appel de onPrepareCall avec :",
        callBeingPrepared,
        showMessage
      );
      await onPrepareCall({ call: callBeingPrepared, showMessage });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "❌ handleAudioUpload - Erreur lors de l'association de l'audio :",
        errorMessage
      );
      showMessage(`Erreur lors de l'association de l'audio : ${errorMessage}`);
    } finally {
      setIsAudioModalOpen(false);
    }
  };

  // Ouvrir le modal pour afficher la transcription
  const handleViewJSONB = (call: Call) => {
    setSelectedCall(call);
    setDialogOpen(true);
  };

  // Fermer le modal
  const handleCloseDialog = () => {
    setSelectedCall(null);
    setDialogOpen(false);
  };

  // Mettre à jour le statut d'un appel
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

      // Mettre à jour localement en créant une nouvelle référence
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

      // Si l'appel sélectionné est modifié
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

  // Définir la couleur de l'icône selon le statut
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case "conflictuel":
        return "red";
      case "non_conflictuel":
        return "green";
      default: // non_supervisé ou undefined
        return "gray";
    }
  };

  // Compter les appels par statut
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
          nonSupervisé++; // Si le statut est invalide ou manquant, compter comme non supervisé
      }
    });

    return { conflictuel, nonSupervisé, nonConflictuel };
  };

  // Afficher les tours de parole
  const renderTranscription = (transcription?: Transcription) => {
    if (!transcription?.words || transcription.words.length === 0) {
      return <Typography>Aucune transcription disponible.</Typography>;
    }

    // Affichage chronologique des tours de parole avec alternance de fond
    return transcription.words.map((word, index) => (
      <Box
        key={index}
        p={1}
        sx={{
          backgroundColor: index % 2 === 0 ? "#232222" : "#4d4d4d", // Alternance de fond
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

  return (
    <div>
      {/* Section de filtre */}
      <Box mb={2} display="flex" justifyContent="space-between">
        <Typography variant="h6">Filtrer par statut :</Typography>
        <Box>
          <Button
            variant={filterStatus === "all" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("all")}
          >
            Tous
          </Button>
          <Button
            variant={
              filterStatus === "non_supervisé" ? "contained" : "outlined"
            }
            onClick={() => setFilterStatus("non_supervisé")}
          >
            Non Supervisé
          </Button>
          <Button
            variant={filterStatus === "conflictuel" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("conflictuel")}
          >
            Conflictuel
          </Button>
          <Button
            variant={
              filterStatus === "non_conflictuel" ? "contained" : "outlined"
            }
            onClick={() => setFilterStatus("non_conflictuel")}
          >
            Non Conflictuel
          </Button>
        </Box>
      </Box>
      <FilterInput
        filterValue={filterKeyword}
        setFilterValue={setFilterKeyword}
      />
      {/* Afficher les appels filtrés */}
      {Object.entries(filteredCallsByOrigin).map(([origin, calls]) => {
        // Appliquer le filtre sur les appels
        const filteredCalls =
          filterStatus === "all"
            ? calls
            : calls.filter((call) => call.status === filterStatus);

        if (filteredCalls.length === 0) {
          // Si aucun appel ne correspond au filtre, ne rien afficher pour cette origine
          return null;
        }

        // Compter les appels filtrés
        const { conflictuel, nonSupervisé, nonConflictuel } =
          countStatuses(filteredCalls);

        return (
          <Accordion key={origin}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>
                {origin} ({filteredCalls.length} appels - {nonSupervisé} non
                supervisés, {conflictuel} conflictuels, {nonConflictuel} non
                conflictuels)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small" aria-label={`Appels de ${origin}`}>
                  <TableHead>
                    <TableRow>
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
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCalls.map((call) => (
                      <TableRow key={call.callid}>
                        <TableCell>
                          <CircleIcon
                            style={{
                              color: getStatusColor(call.status), // Couleur selon le statut
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
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleViewJSONB(call)}
                          >
                            Voir JSONB
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handlePrepareCallClick(call)}
                          >
                            Préparer pour le tagging
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Si aucun appel ne correspond au filtre global */}
      {Object.values(callsByOrigin).every(
        (calls) =>
          (filterStatus !== "all" &&
            calls.filter((call) => call.status === filterStatus).length ===
              0) ||
          calls.length === 0
      ) && (
        <Typography variant="body1" color="textSecondary">
          Aucun appel ne correspond au filtre sélectionné.
        </Typography>
      )}

      {/* Modal pour afficher la transcription */}
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

      {/* Modale pour l'upload audio */}
      <AudioUploadModal
        open={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onUpload={handleAudioUpload}
      />
    </div>
  );
};

export default CallListUnprepared;
