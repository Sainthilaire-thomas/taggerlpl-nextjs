// SimpleWorkdriveExplorer.tsx - Version étendue avec modes
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
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";

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
  // ✅ NOUVELLES PROPS avec valeurs par défaut
  mode = "full",
  audioOnly = false,
  transcriptionOnly = false,
  showSelectionSummary = true,
  maxSelections = { audio: 1, transcription: 1 },
  title,
  description,
  showTabs = true,
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
  const [currentTab, setCurrentTab] = useState(0); // 0 = Navigation, 1 = Recherche

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

  // ✅ NOUVEAU: Déterminer le mode effectif (legacy props vs nouveau mode)
  const effectiveMode: WorkdriveExplorerMode = useMemo(() => {
    if (audioOnly) return "audio_only";
    if (transcriptionOnly) return "transcription_only";
    return mode;
  }, [mode, audioOnly, transcriptionOnly]);

  // ✅ NOUVEAU: Adaptation du comportement selon le mode
  useEffect(() => {
    // Désactiver la sélection selon le mode
    if (effectiveMode === "audio_only") {
      setSelectedTranscriptionFile(null);
    }
    if (effectiveMode === "transcription_only") {
      setSelectedAudioFile(null);
    }
  }, [effectiveMode]);

  // ✅ NOUVEAU: Génération du titre et description adaptatifs
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

  // Traiter le token d'authentification Zoho si présent dans l'URL
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

  // ✅ MODIFICATION: Gestionnaires de sélection avec contrôles de mode
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

  // ✅ MODIFICATION: Validation avant import selon le mode
  const handleImportFiles = async () => {
    // Validation selon le mode
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

      // ✅ DEBUG COMPLET: Examiner la structure des objets fichiers
      console.log(
        "🔍 DEBUG selectedTranscriptionFile:",
        selectedTranscriptionFile
      );
      console.log("🔍 DEBUG selectedAudioFile:", selectedAudioFile);

      if (selectedTranscriptionFile) {
        console.log(
          "🔍 DEBUG propriétés transcription:",
          Object.keys(selectedTranscriptionFile)
        );
        console.log(
          "🔍 DEBUG attributes transcription:",
          selectedTranscriptionFile.attributes
        );
        console.log(
          "🔍 DEBUG relationships transcription:",
          selectedTranscriptionFile.relationships
        );
        console.log(
          "🔍 DEBUG type transcription:",
          selectedTranscriptionFile.type
        );
        console.log("🔍 DEBUG id transcription:", selectedTranscriptionFile.id);
      }

      if (selectedAudioFile) {
        console.log(
          "🔍 DEBUG propriétés audio:",
          Object.keys(selectedAudioFile)
        );
        console.log("🔍 DEBUG attributes audio:", selectedAudioFile.attributes);
        console.log(
          "🔍 DEBUG relationships audio:",
          selectedAudioFile.relationships
        );
      }

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

      // ✅ CORRECTION: Récupérer le nom de fichier depuis l'objet WorkDrive
      let workdriveFileName: string | undefined;

      if (selectedTranscriptionFile) {
        // ✅ Essayer toutes les propriétés possibles pour le nom
        workdriveFileName =
          selectedTranscriptionFile.name ||
          selectedTranscriptionFile.attributes?.name ||
          selectedTranscriptionFile.attributes?.resource_name ||
          selectedTranscriptionFile.attributes?.display_name ||
          selectedTranscriptionFile.attributes?.file_name ||
          selectedTranscriptionFile.resource_name ||
          selectedTranscriptionFile.display_name ||
          selectedTranscriptionFile.file_name ||
          "transcription.json"; // Fallback

        console.log(
          "📄 Nom fichier transcription WorkDrive:",
          workdriveFileName
        );
        console.log("🔍 DEBUG toutes les propriétés transcription:", {
          name: selectedTranscriptionFile.name,
          "attributes.name": selectedTranscriptionFile.attributes?.name,
          "attributes.resource_name":
            selectedTranscriptionFile.attributes?.resource_name,
          "attributes.display_name":
            selectedTranscriptionFile.attributes?.display_name,
          "attributes.file_name":
            selectedTranscriptionFile.attributes?.file_name,
          resource_name: selectedTranscriptionFile.resource_name,
          display_name: selectedTranscriptionFile.display_name,
          file_name: selectedTranscriptionFile.file_name,
        });
      } else if (selectedAudioFile) {
        // ✅ Même logique pour les fichiers audio
        workdriveFileName =
          selectedAudioFile.name ||
          selectedAudioFile.attributes?.name ||
          selectedAudioFile.attributes?.resource_name ||
          selectedAudioFile.attributes?.display_name ||
          selectedAudioFile.attributes?.file_name ||
          selectedAudioFile.resource_name ||
          selectedAudioFile.display_name ||
          selectedAudioFile.file_name ||
          "audio.mp3"; // Fallback

        console.log("🎵 Nom fichier audio WorkDrive:", workdriveFileName);
        console.log("🔍 DEBUG toutes les propriétés audio:", {
          name: selectedAudioFile.name,
          "attributes.name": selectedAudioFile.attributes?.name,
          "attributes.resource_name":
            selectedAudioFile.attributes?.resource_name,
          "attributes.display_name": selectedAudioFile.attributes?.display_name,
          "attributes.file_name": selectedAudioFile.attributes?.file_name,
          resource_name: selectedAudioFile.resource_name,
          display_name: selectedAudioFile.display_name,
          file_name: selectedAudioFile.file_name,
        });
      }

      // Message adaptatif selon ce qui est importé et le mode
      const importMessage = [];
      if (audioFile) importMessage.push(`Audio: ${audioFile.name}`);
      if (transcriptionText) importMessage.push("Transcription");

      console.log("🔍 Envoi vers onFilesSelect:", {
        audioFile: audioFile?.name,
        transcriptionText: transcriptionText
          ? `${transcriptionText.length} caractères`
          : "Vide",
        workdriveFileName, // ✅ Devrait maintenant contenir le nom
      });

      // ✅ MODIFIÉ: Appeler avec le nom WorkDrive
      await onFilesSelect(audioFile, transcriptionText, workdriveFileName);

      // Message de succès adaptatif selon le mode
      const successMsg =
        effectiveMode === "audio_only"
          ? `Audio sélectionné: ${audioFile?.name}`
          : effectiveMode === "transcription_only"
          ? `Transcription sélectionnée: ${workdriveFileName}` // ✅ Utiliser workdriveFileName
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

  // Gestionnaire de changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    if (newValue === 0) {
      clearSearch(); // Effacer la recherche quand on revient à la navigation
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
      {/* ✅ NOUVEAU: Titre et description adaptés selon le mode */}
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

      {/* ✅ MODIFICATION: Onglets conditionnels */}
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

      {/* Navigation classique */}
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

      {/* Interface de recherche */}
      {showTabs && currentTab === 1 && (
        <SearchBar
          onSearch={searchFiles}
          onClear={clearSearch}
          isSearching={searchResults.isSearching}
          searchResults={searchResults}
        />
      )}

      {/* ✅ MODIFICATION: Résumé de sélection conditionnel */}
      {showSelectionSummary && (
        <FileSelectionSummary
          selectedAudioFile={selectedAudioFile}
          selectedTranscriptionFile={selectedTranscriptionFile}
          onClearAudioFile={() => setSelectedAudioFile(null)}
          onClearTranscriptionFile={() => setSelectedTranscriptionFile(null)}
          mode={effectiveMode}
        />
      )}

      {/* ✅ MODIFICATION: Bouton d'importation adaptatif */}
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

      {/* Affichage des fichiers selon l'onglet */}
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
        />
      )}

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
