"use client";

import { useState, FC } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
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
import { useTaggingData } from "@/context/TaggingDataContext";
import { removeCallUpload } from "@/components/utils/removeCallUpload";
import { generateSignedUrl } from "@/components/utils/signedUrls";

// Types
interface Call {
  callid: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
  audiourl?: string | null;
  [key: string]: any;
}

interface CallListProps {
  showMessage: (message: string) => void;
}

const CallList: FC<CallListProps> = ({ showMessage }) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);

  const { taggingCalls, selectTaggingCall, fetchTaggingTranscription } =
    useTaggingData();

  // Gestion du clic sur un appel
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
          is_tagging_call: true,
          preparedfortranscript: false,
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
        showMessage("Appel mis à jour, audio et word retirés.");

        // Mettre à jour localement
        // Cette partie est indicative, vous devrez peut-être adapter selon la structure de votre contexte
        // Idéalement, vous rechargeriez les données depuis l'API
      } else {
        throw new Error("Filepath manquant pour la suppression");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Error in handleConfirmDelete:", errorMessage);
      showMessage(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      // Reset modal state
      setConfirmDeleteOpen(false);
      setCallToDelete(null);
    }
  };

  return (
    <Box>
      <Typography variant="body1" paragraph>
        Cette section affiche les appels chargés disponibles pour le tagging.
      </Typography>

      {taggingCalls.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          Aucun appel disponible. Veuillez d'abord importer des appels dans
          l'onglet "Import d'appels".
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            "& > *": {
              flex: "1 1 300px", // Flex-grow, flex-shrink, flex-basis
              minWidth: "300px",
              maxWidth: "400px",
            },
          }}
        >
          {taggingCalls.map((call) => (
            <Card variant="outlined" key={call.callid}>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {call.filename || "Sans nom"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {call.description || "Pas de description"}
                </Typography>
                <Typography variant="caption" display="block">
                  ID:{" "}
                  {typeof call.callid === "string"
                    ? call.callid.substring(0, 8) + "..."
                    : call.callid}
                </Typography>
                <Typography variant="caption" display="block">
                  Audio: {call.upload ? "Disponible" : "Non disponible"}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  startIcon={<PlayIcon />}
                  onClick={() => handleCallClick(call)}
                  disabled={!call.upload}
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

export default CallList;
