"use client";

import { useState, FC, ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useZoho } from "@/context/ZohoContext";
import AudioList from "@/components/AudioList";
import SimpleWorkdriveExplorer from "@/features/phase1-corpus/workdrive";
import { handleCallSubmission } from "../shared/utils/callApiUtils";

// ✅ Types corrigés pour correspondre exactement à AudioList
interface ZohoFile {
  originalId: string | undefined; // ✅ IMPORTANT: doit correspondre au type AudioList
  name: string;
  [key: string]: any;
}

interface CallImporterProps {
  showMessage: (message: string) => void;
}

const CallImporter: FC<CallImporterProps> = ({ showMessage }) => {
  const [description, setDescription] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { accessToken } = useZoho();

  const handleAudioChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length) {
      setAudioFile(event.target.files[0]);
    }
  };

  const handleTranscriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTranscriptionText(event.target.value);
  };

  // ✅ Fonction compatible avec le type AudioList
  const handleFileSelect = async (
    file: ZohoFile,
    type: string
  ): Promise<void> => {
    try {
      // ✅ Vérification que originalId existe (car il peut être undefined)
      if (!file.originalId) {
        throw new Error("ID du fichier manquant");
      }

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
        const audioFileFromBlob = new File([blob], fileName, {
          type: contentType,
        });
        console.log(
          "📝 Fichier audio prêt à être uploadé :",
          audioFileFromBlob
        );

        // Télécharger localement pour vérification (optionnel)
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        downloadLink.click();
        console.log("🔽 Téléchargement manuel du fichier audio déclenché.");

        // Mettre à jour l'état avec le fichier audio
        setAudioFile(audioFileFromBlob);
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
      showMessage(`Erreur: ${errorMessage}`);
    }
  };

  // ✅ Typage correct pour les paramètres de handleWorkdriveFileSelect
  const handleWorkdriveFileSelect = async (
    audioFile: File | null,
    transcriptionText: string = ""
  ): Promise<void> => {
    console.log("🔍 Fichiers reçus dans CallImporter:", {
      audioFile,
      transcriptionText,
    });
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
        onCallUploaded: () => {
          // Réinitialiser les champs après succès
          setDescription("");
          setAudioFile(null);
          setTranscriptionText("");
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur dans handleSubmit :", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Import ZohoWorkdrive (Ancien)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <AudioList onFileSelect={handleFileSelect} />
        </AccordionDetails>
      </Accordion>

      {/* Nouvel accordéon pour le nouveau WorkdriveExplorer */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Import ZohoWorkdrive Explorer (Nouveau)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SimpleWorkdriveExplorer onFilesSelect={handleWorkdriveFileSelect} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Chargez un nouvel appel</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component="form" onSubmit={handleSubmit}>
            <Button
              variant="outlined"
              component="label"
              disabled={isLoading}
              fullWidth
              sx={{ mb: 2 }}
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
              <Typography
                variant="caption"
                color="textSecondary"
                display="block"
                sx={{ mb: 2 }}
              >
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
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              Charger
              {isLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CallImporter;
