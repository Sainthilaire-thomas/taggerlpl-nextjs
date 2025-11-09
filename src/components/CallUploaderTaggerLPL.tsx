"use client";

import { useState, FC, ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useZoho } from "@/context/ZohoContext";
import AudioList from "./AudioList";
import { useTaggingData } from "@/context/TaggingDataContext";
import CallListUnprepared from "./CallListUnprepared";
// ❌ legacy: removeCallUpload (remplacé par useCallManagement)
// ❌ legacy: signedUrls util (on utilise le hook service)
import { useCallImport } from "@/features/phase1-corpus/calls/ui/hooks/useCallImport";
import { useCallPreparation } from "@/features/phase1-corpus/calls/ui/hooks/useCallPreparation";
import { useCallManagement } from "@/features/phase1-corpus/calls/ui/hooks/useCallManagement";
import { useStorageService } from "@/features/phase1-corpus/calls/ui/hooks/useStorageService";
import SnackbarManager from "./SnackBarManager";
import SimpleWorkdriveExplorer from "@/components/SimpleWorkdriveExplorer";

// Types - Correction pour correspondre au type attendu par AudioList
interface ZohoFile {
  originalId?: string; // optionnel
  name: string;
  [key: string]: any;
}

interface Call {
  callid: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
  audiourl?: string | null;
  [key: string]: any;
}

interface SnackbarMessage {
  message: string;
  key: number;
}

interface CallUploaderTaggerLPLProps {
  onCallUploaded?: () => void;
}

const CallUploaderTaggerLPL: FC<CallUploaderTaggerLPLProps> = ({
  onCallUploaded,
}) => {
  const [description, setDescription] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);
  const { accessToken } = useZoho();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [snackPack, setSnackPack] = useState<SnackbarMessage[]>([]);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // ✅ hooks DDD
  const { importCall, isImporting } = useCallImport();
  const { prepareCall, isPreparing } = useCallPreparation();
  const { deleteCall } = useCallManagement();
  const { generateSignedUrl } = useStorageService();

  const { taggingCalls, selectTaggingCall, fetchTaggingTranscription } =
    useTaggingData();

  const showMessage = (message: string) => {
    setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
  };

  const handleAudioChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length) {
      setAudioFile(event.target.files[0]);
    }
  };

  const handleTranscriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTranscriptionText(event.target.value);
  };

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

      // ✅ URL signée via le service DDD
      const audioUrl = await generateSignedUrl(call.filepath);

      selectTaggingCall({
        ...call,
        audiourl: audioUrl,
        is_tagging_call: true,
        preparedfortranscript: false,
      });

      await fetchTaggingTranscription(call.callid);
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

  // Gestion des fichiers sélectionnés depuis AudioList (ancien Workdrive)
  const handleFileSelect = async (
    file: ZohoFile,
    type: string
  ): Promise<void> => {
    try {
      const fileId = file.originalId;
      const proxyUrl = `http://localhost:8888/.netlify/functions/zohoDownloadFile?fileId=${fileId}`;

      const response = await fetch(proxyUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erreur lors du téléchargement : ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (type === "transcription") {
          setTranscriptionText(JSON.stringify(data, null, 2));
          setDescription(
            (prevDescription) =>
              `${prevDescription ? prevDescription + "\n" : ""}Transcription (${
                file.name
              }) chargée de Workdrive le ${new Date().toLocaleString()}`
          );
        }
      } else if (contentType.includes("audio")) {
        const blob = await response.blob();
        const fileName = file.name || "audio_downloaded.mp3";
        const audioFile = new File([blob], fileName, { type: contentType });

        // Déclenche un téléchargement local (comportement existant)
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        downloadLink.click();

        setAudioFile(audioFile);
        setDescription(
          (prevDescription) =>
            `${prevDescription ? prevDescription + "\n" : ""}Appel (${
              file.name
            }) chargé de Workdrive le ${new Date().toLocaleString()}`
        );
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        `❌ Erreur lors de la gestion du fichier (${type}) :`,
        errorMessage
      );
    }
  };

  // Sélection via SimpleWorkdriveExplorer (nouveau)
  const handleWorkdriveFileSelect = async (
    audioFile: File | null,
    transcriptionText: string = ""
  ): Promise<void> => {
    try {
      if (audioFile) {
        setAudioFile(audioFile);
        setDescription(
          (prevDescription) =>
            `${prevDescription ? prevDescription + "\n" : ""}Appel (${
              audioFile.name
            }) chargé de Workdrive Explorer le ${new Date().toLocaleString()}`
        );

        if (transcriptionText) {
          setTranscriptionText(transcriptionText);
          setDescription(
            (prevDesc) =>
              `${prevDesc}\nTranscription importée depuis Workdrive Explorer le ${new Date().toLocaleString()}`
          );
        }

        showMessage("Fichier(s) chargé(s) depuis Workdrive Explorer");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        "Erreur lors de l'importation depuis Workdrive Explorer :",
        errorMessage
      );
      showMessage("Erreur lors de l'importation depuis Workdrive Explorer");
    }
  };

  // ✅ Remplacement de handleCallSubmission (legacy) par le hook DDD
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!audioFile && !description) {
      showMessage(
        "Veuillez sélectionner un fichier audio ou fournir une description."
      );
      return;
    }

    setIsLoading(true);
    try {
      // NOTE: adapter si ta signature diffère.
      await importCall({
        audioFile: audioFile ?? undefined,
        description: description || undefined,
        // Si transcriptionText est du JSON, décommente la ligne suivante et commente l'autre :
        // transcriptionData: transcriptionText ? JSON.parse(transcriptionText) : undefined,
        transcriptionText: transcriptionText || undefined,
      });

      setDescription("");
      setAudioFile(null);
      setTranscriptionText("");

      showMessage("Appel importé avec succès.");
      onCallUploaded?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur dans handleSubmit :", errorMessage);
      showMessage("Erreur lors de l'import d'appel.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (call: Call) => {
    setCallToDelete(call);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!callToDelete) return;

    const { callid } = callToDelete;

    try {
      // ✅ DDD: suppression via useCallManagement
      await deleteCall(callid);
      showMessage("Appel supprimé.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Error in handleConfirmDelete:", errorMessage);
      showMessage("Erreur lors de la suppression de l'appel.");
    } finally {
      setConfirmDeleteOpen(false);
      setCallToDelete(null);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Import ZohoWorkdrive (Ancien)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <AudioList onFileSelect={handleFileSelect} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Import ZohoWorkdrive Explorer (Nouveau)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SimpleWorkdriveExplorer onFilesSelect={handleWorkdriveFileSelect} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Chargez un nouvel appel</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Button
              variant="outlined"
              component="label"
              disabled={isLoading || isImporting}
              fullWidth
            >
              Choisir un fichier audio
              <input
                type="file"
                hidden
                accept="audio/*"
                onChange={handleAudioChange}
              />
            </Button>
            {audioFile && (
              <Typography variant="caption" color="textSecondary">
                Fichier sélectionné : {audioFile.name}
              </Typography>
            )}
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading || isImporting}
              variant="outlined"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Transcription"
              value={transcriptionText}
              onChange={handleTranscriptionChange}
              disabled={isLoading || isImporting}
              multiline
              rows={4}
              variant="outlined"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading || isImporting}
            >
              Charger
            </Button>
            {(isLoading || isImporting) && (
              <CircularProgress size={24} sx={{ ml: 2 }} />
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Appels chargés pour le tagging</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {taggingCalls.map((call) => (
              <Card variant="outlined" key={call.callid}>
                <CardContent>
                  <Typography variant="body2">{call.filename}</Typography>
                  <Typography variant="body2">{call.description}</Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<PlayIcon />}
                    onClick={() => handleCallClick(call)}
                  >
                    Écouter
                  </Button>

                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(call)}
                  >
                    Supprimer
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Appels transcrits</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Button variant="contained" color="primary" onClick={handleOpenModal}>
            Afficher les appels transcrits dispo
          </Button>
        </AccordionDetails>
      </Accordion>

      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Sélection taggage manuel appels transcrits</DialogTitle>
        <DialogContent>
          {/*
            ✅ Remplacement de prepareCallForTagging:
            on passe par le hook DDD et on adapte les params reçus.
          */}
          <CallListUnprepared
            onPrepareCall={async (params: any) => {
              try {
                const callId =
                  params?.callid ?? params?.callId ?? params?.id ?? params;
                // NOTE: si ton hook supporte un mode, passe-le ici ("manual"/"standard")
                await prepareCall(callId);
                showMessage("Appel préparé pour le tagging.");
              } catch (error) {
                console.error(
                  "Erreur lors de la préparation de l'appel:",
                  error
                );
                showMessage("Erreur lors de la préparation de l'appel");
              }
            }}
            showMessage={showMessage}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarManager snackPack={snackPack} setSnackPack={setSnackPack} />

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
          <Button onClick={handleConfirmDelete} color="primary">
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CallUploaderTaggerLPL;
