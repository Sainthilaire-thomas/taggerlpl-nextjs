"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Snackbar,
  LinearProgress,
  Breadcrumbs,
  Link,
  Chip,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import DescriptionIcon from "@mui/icons-material/Description";

import { useZoho } from "@/context/ZohoContext";
import { useWorkdriveFiles } from "./hooks/useWorkdriveFiles";
import {
  parseZohoToken,
  handleZohoAuth,
  cleanAuthTokenFromUrl,
} from "./utils/authHelpers";
import { downloadFile, downloadTranscription } from "./utils/fileHelpers";

import { AuthPrompt } from "./components/AuthPrompt";
import { NavigationControls } from "./components/NavigationControls";
import { FileSelectionSummary } from "./components/FileSelectionSummary";
import { FileList } from "./components/FileList";
import { Notifications } from "./components/Notifications";

import { SimpleWorkdriveExplorerProps, ZohoFile } from "./types";

// ID du dossier racine de votre Workdrive (à adapter selon votre configuration)
const ROOT_FOLDER_ID = "ly5m40e0e2d4ae7604a1fa0f5d42905cb94c9";

export default function SimpleWorkdriveExplorer({
  onFilesSelect,
  rootFolderId = ROOT_FOLDER_ID,
}: SimpleWorkdriveExplorerProps) {
  const { accessToken, setAccessToken, updateZohoRefreshToken } = useZoho();
  const searchParams = useSearchParams();

  const [selectedAudioFile, setSelectedAudioFile] = useState<ZohoFile | null>(
    null
  );
  const [selectedTranscriptionFile, setSelectedTranscriptionFile] =
    useState<ZohoFile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingImport, setProcessingImport] = useState(false);

  const {
    files,
    loading,
    currentFolder,
    folderHistory,
    error,
    folderPath,
    handleFolderClick,
    handleBack,
    handleHome,
    handleBreadcrumbNavigation,
    setError,
  } = useWorkdriveFiles(rootFolderId);

  // Traiter le token d'authentification Zoho si présent dans l'URL
  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (tokenParam) {
      const parsedToken = parseZohoToken(tokenParam);

      if (parsedToken) {
        console.log("Token Zoho reçu:", parsedToken);

        // Mettre à jour le contexte avec les tokens
        if (parsedToken.access_token) {
          setAccessToken(parsedToken.access_token);
        }

        if (parsedToken.refresh_token) {
          updateZohoRefreshToken(parsedToken.refresh_token);
        }

        // Nettoyer l'URL
        cleanAuthTokenFromUrl();

        setSuccessMessage("Connexion à Zoho WorkDrive réussie!");
      } else {
        setError("Erreur lors de la connexion à Zoho WorkDrive");
      }
    }
  }, [searchParams, setAccessToken, updateZohoRefreshToken, setError]);

  // Gestionnaire pour sélectionner un fichier audio
  const handleSelectAudioFile = (file: ZohoFile) => {
    setSelectedAudioFile(selectedAudioFile?.id === file.id ? null : file);
  };

  // Gestionnaire pour sélectionner un fichier de transcription
  const handleSelectTranscriptionFile = (file: ZohoFile) => {
    setSelectedTranscriptionFile(
      selectedTranscriptionFile?.id === file.id ? null : file
    );
  };

  // Télécharger et préparer les fichiers sélectionnés
  const handleImportFiles = async () => {
    if (!selectedAudioFile) {
      setError("Veuillez sélectionner un fichier audio");
      return;
    }

    try {
      setProcessingImport(true);

      // Télécharger le fichier audio
      const audioFile = await downloadFile(
        selectedAudioFile,
        accessToken || ""
      );

      // Télécharger le fichier de transcription s'il est sélectionné
      let transcriptionText = "";
      if (selectedTranscriptionFile) {
        transcriptionText = await downloadTranscription(
          selectedTranscriptionFile,
          accessToken || ""
        );
      }

      // Appeler le callback avec les fichiers préparés
      onFilesSelect(audioFile, transcriptionText);

      // Afficher un message de succès
      setSuccessMessage("Fichiers importés avec succès");

      // Réinitialiser les sélections
      setSelectedAudioFile(null);
      setSelectedTranscriptionFile(null);
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      setError(
        `Erreur lors de l'importation: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setProcessingImport(false);
    }
  };

  // Affichage simplifié si aucun token d'accès
  if (!accessToken) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connexion à Zoho WorkDrive
        </Typography>
        <Typography paragraph>
          Pour accéder à vos fichiers Zoho WorkDrive, vous devez vous connecter
          à votre compte.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleZohoAuth()}
        >
          Se connecter à Zoho WorkDrive
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Affichage du chemin de navigation (breadcrumb) */}
      <Paper elevation={1} sx={{ p: 1, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Button
            startIcon={<HomeIcon />}
            size="small"
            onClick={() => handleHome(rootFolderId)}
            sx={{ mr: 1 }}
          >
            Racine
          </Button>

          <Button
            startIcon={<ArrowBackIcon />}
            size="small"
            onClick={handleBack}
            disabled={folderHistory.length === 0}
            sx={{ mr: 1 }}
          >
            Retour
          </Button>

          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            {folderPath.map((folder, index) => (
              <Link
                key={folder.id}
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleBreadcrumbNavigation(folder.id, index);
                }}
                sx={{
                  textDecoration: "none",
                  fontWeight:
                    index === folderPath.length - 1 ? "bold" : "normal",
                  color:
                    index === folderPath.length - 1
                      ? "text.primary"
                      : "inherit",
                }}
              >
                {folder.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        {loading && <LinearProgress sx={{ mt: 1 }} />}
      </Paper>

      {/* Résumé de la sélection de fichiers */}
      {(selectedAudioFile || selectedTranscriptionFile) && (
        <Paper
          elevation={2}
          sx={{ p: 2, mb: 2, bgcolor: "background.default" }}
        >
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Fichiers sélectionnés
          </Typography>

          <Box sx={{ mb: 1 }}>
            {selectedAudioFile ? (
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AudioFileIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Audio :{" "}
                  {selectedAudioFile.attributes?.name || "Fichier audio"}
                </Typography>
                <Chip
                  label="Désélectionner"
                  size="small"
                  onDelete={() => setSelectedAudioFile(null)}
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucun fichier audio sélectionné
              </Typography>
            )}

            {selectedTranscriptionFile ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Transcription :{" "}
                  {selectedTranscriptionFile.attributes?.name ||
                    "Transcription"}
                </Typography>
                <Chip
                  label="Désélectionner"
                  size="small"
                  onDelete={() => setSelectedTranscriptionFile(null)}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune transcription sélectionnée
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleImportFiles}
            disabled={processingImport || !selectedAudioFile}
            fullWidth
            sx={{ mt: 1 }}
          >
            {processingImport
              ? "Importation en cours..."
              : "Importer les fichiers sélectionnés"}
          </Button>
        </Paper>
      )}

      {/* Liste des fichiers */}
      <FileList
        files={files}
        loading={loading}
        selectedAudioFile={selectedAudioFile}
        selectedTranscriptionFile={selectedTranscriptionFile}
        onFolderClick={handleFolderClick}
        onSelectAudioFile={handleSelectAudioFile}
        onSelectTranscriptionFile={handleSelectTranscriptionFile}
      />

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
