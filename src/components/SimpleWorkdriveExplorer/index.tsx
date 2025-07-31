// SimpleWorkdriveExplorer.tsx - Version corrigée avec modes + détection doublons
"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";
import Security from "@mui/icons-material/Security";

import { useZoho } from "@/context/ZohoContext";
import { useWorkdriveFiles } from "./hooks/useWorkdriveFiles";
import { useWorkdriveSearch } from "./hooks/useWorkdriveSearch";
import {
  parseZohoToken,
  handleZohoAuth,
  cleanAuthTokenFromUrl,
} from "./utils/authHelpers";
import { downloadFile, downloadTranscription } from "./utils/fileHelpers";

import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { FileSelectionSummary } from "./components/FileSelectionSummary";
import { FileList } from "./components/FileList";
import { Notifications } from "./components/Notifications";

import {
  SimpleWorkdriveExplorerProps,
  ZohoFile,
  WorkdriveExplorerMode,
} from "./types";

const ROOT_FOLDER_ID = "ly5m40e0e2d4ae7604a1fa0f5d42905cb94c9";

export default function SimpleWorkdriveExplorer({
  onFilesSelect,
  rootFolderId = ROOT_FOLDER_ID,
  // Props existantes avec valeurs par défaut
  mode = "full",
  audioOnly = false,
  transcriptionOnly = false,
  showSelectionSummary = true,
  maxSelections = { audio: 1, transcription: 1 },
  title,
  description,
  showTabs = true,
  // ✅ NOUVELLES PROPS pour gestion doublons (optionnelles pour compatibilité)
  enableDuplicateCheck = false,
  showDuplicateToggle = true,
  onDuplicateFound,
}: SimpleWorkdriveExplorerProps & {
  enableDuplicateCheck?: boolean;
  showDuplicateToggle?: boolean;
  onDuplicateFound?: (file: ZohoFile, existingCall: any) => void;
}) {
  const { accessToken, setAccessToken, updateZohoRefreshToken } = useZoho();
  const searchParams = useSearchParams();

  const [selectedAudioFile, setSelectedAudioFile] = useState<ZohoFile | null>(
    null
  );
  const [selectedTranscriptionFile, setSelectedTranscriptionFile] =
    useState<ZohoFile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingImport, setProcessingImport] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // ✅ NOUVEAU: État pour la vérification de doublons
  const [duplicateCheckEnabled, setDuplicateCheckEnabled] =
    useState(enableDuplicateCheck);

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

  const { searchResults, searchFiles, clearSearch } = useWorkdriveSearch({
    accessToken,
    currentFolderId: currentFolder.id,
  });

  // Mode effectif (logique existante)
  const effectiveMode: WorkdriveExplorerMode = useMemo(() => {
    if (audioOnly) return "audio_only";
    if (transcriptionOnly) return "transcription_only";
    return mode;
  }, [mode, audioOnly, transcriptionOnly]);

  // Désactiver sélection selon le mode (logique existante)
  useEffect(() => {
    if (effectiveMode === "audio_only") {
      setSelectedTranscriptionFile(null);
    }
    if (effectiveMode === "transcription_only") {
      setSelectedAudioFile(null);
    }
  }, [effectiveMode]);

  // Titres adaptatifs (logique existante)
  const getAdaptiveTitle = () => {
    if (title) return title;
    switch (effectiveMode) {
      case "audio_only":
        return "Sélectionner un fichier audio";
      case "transcription_only":
        return "Sélectionner une transcription";
      default:
        return "Import de nouveaux appels depuis Zoho WorkDrive";
    }
  };

  const getAdaptiveDescription = () => {
    if (description) return description;
    switch (effectiveMode) {
      case "audio_only":
        return "Parcourez WorkDrive et sélectionnez un fichier audio à ajouter.";
      case "transcription_only":
        return "Parcourez WorkDrive et sélectionnez une transcription à ajouter.";
      default:
        return "Utilisez l'explorateur ci-dessous pour parcourir votre Zoho WorkDrive et importer directement vos fichiers audio et transcriptions.";
    }
  };

  // Traitement du token (logique existante)
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      const parsedToken = parseZohoToken(tokenParam);
      if (parsedToken) {
        console.log("Token Zoho reçu:", parsedToken);
        if (parsedToken.access_token) {
          setAccessToken(parsedToken.access_token);
        }
        if (parsedToken.refresh_token) {
          updateZohoRefreshToken(parsedToken.refresh_token);
        }
        cleanAuthTokenFromUrl();
        setSuccessMessage("Connexion à Zoho WorkDrive réussie!");
      } else {
        setError("Erreur lors de la connexion à Zoho WorkDrive");
      }
    }
  }, [searchParams, setAccessToken, updateZohoRefreshToken, setError]);

  // Gestionnaires de sélection (logique existante)
  const handleSelectAudioFile = (file: ZohoFile) => {
    if (effectiveMode === "transcription_only") return;
    setSelectedAudioFile(selectedAudioFile?.id === file.id ? null : file);
  };

  const handleSelectTranscriptionFile = (file: ZohoFile) => {
    if (effectiveMode === "audio_only") return;
    setSelectedTranscriptionFile(
      selectedTranscriptionFile?.id === file.id ? null : file
    );
  };

  // ✅ NOUVEAUX: Gestionnaires pour les doublons
  const handleDuplicateToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDuplicateCheckEnabled(event.target.checked);
  };

  const handleDuplicateClick = (file: ZohoFile, existingCall: any) => {
    if (onDuplicateFound) {
      onDuplicateFound(file, existingCall);
    } else {
      // Comportement par défaut: alerte simple
      alert(
        `Ce fichier (${
          file.attributes?.name || file.name
        }) semble déjà importé comme: ${
          existingCall.filename || existingCall.description
        }`
      );
    }
  };

  // Validation avant import (logique existante)
  const handleImportFiles = async () => {
    if (effectiveMode === "audio_only" && !selectedAudioFile) {
      setError("Veuillez sélectionner un fichier audio");
      return;
    }
    if (effectiveMode === "transcription_only" && !selectedTranscriptionFile) {
      setError("Veuillez sélectionner une transcription");
      return;
    }
    if (
      effectiveMode === "full" &&
      !selectedAudioFile &&
      !selectedTranscriptionFile
    ) {
      setError(
        "Veuillez sélectionner au moins un fichier (audio ou transcription)"
      );
      return;
    }

    try {
      setProcessingImport(true);

      // Debug (logique existante)
      console.log(
        "🔍 DEBUG selectedTranscriptionFile:",
        selectedTranscriptionFile
      );
      console.log("🔍 DEBUG selectedAudioFile:", selectedAudioFile);

      // Audio optionnel
      let audioFile: File | null = null;
      if (selectedAudioFile) {
        audioFile = await downloadFile(selectedAudioFile, accessToken || "");
        console.log("🔍 Fichier audio téléchargé:", audioFile.name);
      }

      // Transcription optionnelle
      let transcriptionText = "";
      if (selectedTranscriptionFile) {
        transcriptionText = await downloadTranscription(
          selectedTranscriptionFile,
          accessToken || ""
        );
        console.log(
          "🔍 Transcription téléchargée, longueur:",
          transcriptionText.length
        );
      }

      // Récupérer le nom de fichier WorkDrive (logique existante)
      let workdriveFileName: string | undefined;
      if (selectedTranscriptionFile) {
        workdriveFileName =
          selectedTranscriptionFile.name ||
          selectedTranscriptionFile.attributes?.name ||
          selectedTranscriptionFile.attributes?.resource_name ||
          selectedTranscriptionFile.attributes?.display_name ||
          selectedTranscriptionFile.attributes?.file_name ||
          selectedTranscriptionFile.resource_name ||
          selectedTranscriptionFile.display_name ||
          selectedTranscriptionFile.file_name ||
          "transcription.json";
      } else if (selectedAudioFile) {
        workdriveFileName =
          selectedAudioFile.name ||
          selectedAudioFile.attributes?.name ||
          selectedAudioFile.attributes?.resource_name ||
          selectedAudioFile.attributes?.display_name ||
          selectedAudioFile.attributes?.file_name ||
          selectedAudioFile.resource_name ||
          selectedAudioFile.display_name ||
          selectedAudioFile.file_name ||
          "audio.mp3";
      }

      // Appeler le callback parent
      await onFilesSelect(audioFile, transcriptionText, workdriveFileName);

      // Message de succès adaptatif
      const importMessage = [];
      if (audioFile) importMessage.push(`Audio: ${audioFile.name}`);
      if (transcriptionText) importMessage.push("Transcription");

      const successMsg =
        effectiveMode === "audio_only"
          ? `Audio sélectionné: ${audioFile?.name}`
          : effectiveMode === "transcription_only"
          ? `Transcription sélectionnée: ${workdriveFileName}`
          : `Importé avec succès: ${importMessage.join(" + ")}`;

      setSuccessMessage(successMsg);
      setSelectedAudioFile(null);
      setSelectedTranscriptionFile(null);
    } catch (error) {
      console.error("❌ Erreur lors de l'importation:", error);
      setError(
        `Erreur lors de l'importation: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    } finally {
      setProcessingImport(false);
    }
  };

  // Gestionnaire de changement d'onglet (logique existante)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    if (newValue === 0) {
      clearSearch();
    }
  };

  // Affichage si pas de token (logique existante)
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
      {/* Titre et description adaptés (logique existante) */}
      {(effectiveMode !== "full" || title || description) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {getAdaptiveTitle()}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {getAdaptiveDescription()}
          </Typography>
        </Box>
      )}

      {/* ✅ NOUVEAU: Contrôles de vérification des doublons */}
      {showDuplicateToggle && (
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: "primary.50" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Security color="primary" />
              <Typography variant="subtitle2" color="primary.dark">
                Détection de doublons
              </Typography>
              <Tooltip title="Vérifie si les fichiers ont déjà été importés pour éviter les doublons">
                <Chip
                  label="Beta"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Tooltip>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={duplicateCheckEnabled}
                  onChange={handleDuplicateToggle}
                  color="primary"
                />
              }
              label={duplicateCheckEnabled ? "Activée" : "Désactivée"}
            />
          </Box>
          {duplicateCheckEnabled && (
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ mt: 1, display: "block" }}
            >
              💡 Les fichiers déjà importés seront marqués avec un badge "Déjà
              importé"
            </Typography>
          )}
        </Paper>
      )}

      {/* Onglets (logique existante) */}
      {showTabs && (
        <Paper elevation={1} sx={{ mb: 2 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<FolderIcon />} label="Navigation" />
            <Tab icon={<SearchIcon />} label="Recherche" />
          </Tabs>
        </Paper>
      )}

      {/* Navigation classique (logique existante) */}
      {(!showTabs || currentTab === 0) && (
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
      )}

      {/* Interface de recherche (logique existante) */}
      {showTabs && currentTab === 1 && (
        <SearchBar
          onSearch={searchFiles}
          onClear={clearSearch}
          isSearching={searchResults.isSearching}
          searchResults={searchResults}
        />
      )}

      {/* Résumé de sélection (logique existante) */}
      {showSelectionSummary && (
        <FileSelectionSummary
          selectedAudioFile={selectedAudioFile}
          selectedTranscriptionFile={selectedTranscriptionFile}
          onClearAudioFile={() => setSelectedAudioFile(null)}
          onClearTranscriptionFile={() => setSelectedTranscriptionFile(null)}
          mode={effectiveMode}
        />
      )}

      {/* Bouton d'importation (logique existante) */}
      {(selectedAudioFile || selectedTranscriptionFile) && (
        <Paper
          elevation={2}
          sx={{ p: 2, mb: 2, bgcolor: "background.default" }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleImportFiles}
            disabled={processingImport}
            fullWidth
            sx={{ mt: 1 }}
          >
            {processingImport
              ? "Sélection en cours..."
              : effectiveMode === "audio_only"
              ? "Sélectionner cet audio"
              : effectiveMode === "transcription_only"
              ? "Sélectionner cette transcription"
              : "Importer les fichiers sélectionnés"}
          </Button>
        </Paper>
      )}

      {/* ✅ MODIFIÉ: FileList avec support des doublons */}
      {(!showTabs || currentTab === 0) && (
        <FileList
          files={files}
          loading={loading}
          selectedAudioFile={selectedAudioFile}
          selectedTranscriptionFile={selectedTranscriptionFile}
          onFolderClick={handleFolderClick}
          onSelectAudioFile={handleSelectAudioFile}
          onSelectTranscriptionFile={handleSelectTranscriptionFile}
          mode={effectiveMode}
          enableDuplicateCheck={duplicateCheckEnabled}
          onDuplicateClick={handleDuplicateClick}
        />
      )}

      {/* ✅ SearchResults SANS les nouvelles props pour éviter l'erreur */}
      {showTabs && currentTab === 1 && (
        <SearchResults
          searchResults={searchResults}
          selectedAudioFile={selectedAudioFile}
          selectedTranscriptionFile={selectedTranscriptionFile}
          onSelectAudioFile={handleSelectAudioFile}
          onSelectTranscriptionFile={handleSelectTranscriptionFile}
          allFiles={files}
          mode={effectiveMode}
        />
      )}

      {/* Notifications (logique existante) */}
      <Notifications
        error={error}
        successMessage={successMessage}
        onCloseError={() => setError(null)}
        onCloseSuccess={() => setSuccessMessage(null)}
      />
    </Box>
  );
}
