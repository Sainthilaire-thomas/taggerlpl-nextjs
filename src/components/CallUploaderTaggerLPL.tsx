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
  Grid,
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
import { removeCallUpload } from "./utils/removeCallUpload";
import {
  handleCallSubmission,
  prepareCallForTagging,
} from "./utils/callApiUtils";
import SnackbarManager from "./SnackBarManager";
import { generateSignedUrl } from "./utils/signedUrls";
import SimpleWorkdriveExplorer from "@/components/SimpleWorkdriveExplorer"; // Nouveau composant à créer

// Types
interface ZohoFile {
  originalId: string;
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

  const { taggingCalls, selectTaggingCall, fetchTaggingTranscription } =
    useTaggingData();
  console.log("taggingCalls", taggingCalls);

  const showMessage = (message: string) => {
    setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
  };

  console.log("🔧 Parent - onPrepareCall :", prepareCallForTagging);

  const handleAudioChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length) {
      setAudioFile(event.target.files[0]);
    }
  };

  const handleTranscriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTranscriptionText(event.target.value);
  };

  // 1. Correction pour handleCallClick - gérer audiourl null (ligne 108)
  const handleCallClick = async (call: Call) => {
    console.log("handleCallClick - Début", call);
    try {
      if (!call.upload) {
        console.log(
          "handleCallClick - Audio non téléchargé, réinitialisation de l'appel"
        );
        selectTaggingCall({
          ...call,
          audiourl: "", // Changer null en chaîne vide
          is_tagging_call: true, // Ajouter propriété manquante
          preparedfortranscript: false, // Ajouter propriété manquante
        });
        showMessage("Appel sans audio chargé.");
        return;
      }

      if (!call.filepath) {
        console.log("handleCallClick - Filepath est manquant");
        showMessage("Chemin du fichier audio manquant.");
        return;
      }

      console.log(
        "handleCallClick - Génération de l'URL signée pour le fichier",
        call.filepath
      );
      const audioUrl = await generateSignedUrl(call.filepath);
      console.log("handleCallClick - URL signée générée :", audioUrl);

      selectTaggingCall({
        ...call,
        audiourl: audioUrl,
        is_tagging_call: true,
        preparedfortranscript: false,
      });
      console.log("handleCallClick - Appel sélectionné avec l'URL signée");

      console.log(
        "handleCallClick - Récupération de la transcription pour l'appel",
        call.callid
      );
      await fetchTaggingTranscription(call.callid);
      console.log("handleCallClick - Transcription récupérée avec succès");
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
        audiourl: "", // Changer null en chaîne vide
        is_tagging_call: true,
        preparedfortranscript: false,
      });
    }
  };

  // Gestion des fichiers sélectionnés depuis AudioList
  const handleFileSelect = async (file: ZohoFile, type: string) => {
    try {
      const fileId = file.originalId;
      console.log(`🛠️ Gestion du fichier (${type}) avec ID :`, fileId);

      const proxyUrl = `http://localhost:8888/.netlify/functions/zohoDownloadFile?fileId=${fileId}`;
      console.log("🌐 URL de proxy utilisée :", proxyUrl);

      const response = await fetch(proxyUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Passer le token d'accès
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erreur lors du téléchargement : ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type") || "";
      console.log("📝 Content-Type reçu :", contentType);

      if (contentType.includes("application/json")) {
        // Traitez en tant que JSON
        const data = await response.json();
        if (type === "transcription") {
          setTranscriptionText(JSON.stringify(data, null, 2));
          // Ajouter un commentaire pour une transcription
          setDescription(
            (prevDescription) =>
              `${prevDescription ? prevDescription + "\n" : ""}Transcription (${
                file.name
              }) chargée de Workdrive le ${new Date().toLocaleString()}`
          );
        }
        console.log("✅ Transcription téléchargée :", data);
      } else if (contentType.includes("audio")) {
        // Traitez en tant que fichier audio
        const blob = await response.blob();
        const fileName = file.name || "audio_downloaded.mp3";
        console.log("🔍 Taille du blob audio :", blob.size, "octets");

        // Créer un objet `File` à partir du `Blob`
        const audioFile = new File([blob], fileName, { type: contentType });
        console.log("📝 Fichier audio prêt à être uploadé :", audioFile);

        // Télécharger localement pour vérification (optionnel)
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        downloadLink.click();
        console.log("🔽 Téléchargement manuel du fichier audio déclenché.");

        // Mettre à jour l'état avec le fichier audio
        setAudioFile(audioFile);
        // Ajouter un commentaire pour un fichier audio
        setDescription(
          (prevDescription) =>
            `${prevDescription ? prevDescription + "\n" : ""}Appel (${
              file.name
            }) chargé de Workdrive le ${new Date().toLocaleString()}`
        );
      } else {
        console.error("❌ Type de contenu non pris en charge :", contentType);
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

  // Gestionnaire pour les fichiers sélectionnés depuis SimpleWorkdriveExplorer
  const handleWorkdriveFileSelect = async (
    audioFile,
    transcriptionText = ""
  ) => {
    try {
      if (audioFile) {
        setAudioFile(audioFile);
        // Ajouter un commentaire pour le fichier audio
        setDescription(
          (prevDescription) =>
            `${prevDescription ? prevDescription + "\n" : ""}Appel (${
              audioFile.name
            }) chargé de Workdrive Explorer le ${new Date().toLocaleString()}`
        );

        // Si on a aussi une transcription
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
      await handleCallSubmission({
        audioFile,
        description,
        transcriptionText,
        showMessage,
        onCallUploaded,
      });

      // Reset fields after success
      setDescription("");
      setAudioFile(null);
      setTranscriptionText("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur dans handleSubmit :", errorMessage);
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

    const { callid, filepath } = callToDelete;

    try {
      // Use the `removeCallUpload` utility function
      if (filepath) {
        await removeCallUpload(callid, filepath);
      } else {
        throw new Error("Filepath manquant pour la suppression");
      }

      // Show success message
      showMessage("Appel mis à jour, audio et word retirés.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Error in handleConfirmDelete:", errorMessage);
      showMessage("Error removing call upload.");
    } finally {
      // Reset modal state
      setConfirmDeleteOpen(false);
      setCallToDelete(null);
    }
  };

  return (
    <Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Import ZohoWorkdrive (Ancien)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <AudioList onFileSelect={handleFileSelect} />
        </AccordionDetails>
      </Accordion>

      {/* Nouvel accordéon pour le nouveau WorkdriveExplorer */}
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
              disabled={isLoading}
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
              disabled={isLoading}
              variant="outlined"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Transcription"
              value={transcriptionText}
              onChange={handleTranscriptionChange}
              disabled={isLoading}
              multiline
              rows={4}
              variant="outlined"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              onClick={handleSubmit}
            >
              Charger
            </Button>
            {isLoading && <CircularProgress size={24} />}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Appels chargés pour le tagging</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {taggingCalls.map((call) => (
              <Grid item xs={12} key={call.callid}>
                <Card variant="outlined">
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
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
      {/* Section pour afficher les appels dans call mais non chargés pour taggage manuel */}
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
      {/* Modal pour afficher CallListUnprepared */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="lg" // Largeur maximale (sm, md, lg, xl)
      >
        <DialogTitle>Sélection taggage manuel appels transcrits</DialogTitle>
        <DialogContent>
          {/* Inclusion de CallListUnprepared */}
          <CallListUnprepared
            onPrepareCall={prepareCallForTagging}
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
