// index.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useSearchParams } from "next/navigation";

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

      // Réinitialiser les sélections
      setSelectedAudioFile(null);
      setSelectedTranscriptionFile(null);

      setSuccessMessage("Fichiers importés avec succès");
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

  // S'il n'y a pas de token d'accès, afficher le prompt de connexion
  if (!accessToken) {
    return <AuthPrompt />;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Contrôles de navigation */}
      <NavigationControls
        folderHistory={folderHistory}
        currentFolder={currentFolder}
        rootFolderId={rootFolderId}
        folderPath={folderPath}
        onBack={handleBack}
        onHome={() => handleHome(rootFolderId)}
        onBreadcrumbClick={handleBreadcrumbNavigation}
        selectedAudioFile={selectedAudioFile}
        selectedTranscriptionFile={selectedTranscriptionFile}
        onImportFiles={handleImportFiles}
        processingImport={processingImport}
      />

      {/* Résumé de la sélection de fichiers */}
      <FileSelectionSummary
        selectedAudioFile={selectedAudioFile}
        selectedTranscriptionFile={selectedTranscriptionFile}
        onClearAudioFile={() => setSelectedAudioFile(null)}
        onClearTranscriptionFile={() => setSelectedTranscriptionFile(null)}
      />

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
      <Notifications
        error={error}
        successMessage={successMessage}
        onCloseError={() => setError(null)}
        onCloseSuccess={() => setSuccessMessage(null)}
      />
    </Box>
  );
}
