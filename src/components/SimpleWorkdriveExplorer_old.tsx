"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
} from "@mui/material";
import {
  Folder as FolderIcon,
  AudioFile as AudioFileIcon,
  Description as DescriptionIcon,
  ArrowBack as BackIcon,
  Home as HomeIcon,
  CloudUpload as CloudUploadIcon,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useZoho } from "@/context/ZohoContext";
import { useSearchParams } from "next/navigation";

// Types
interface ZohoFile {
  id: string;
  name: string;
  type: string;
  mimeType?: string;
  originalId?: string;
  [key: string]: any;
}

interface ZohoAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
}

interface SimpleWorkdriveExplorerProps {
  onFilesSelect: (audioFile: File | null, transcriptionText?: string) => void;
}

// ID du dossier racine de votre Workdrive (à adapter selon votre configuration)
const ROOT_FOLDER_ID = "ly5m40e0e2d4ae7604a1fa0f5d42905cb94c9";

export default function SimpleWorkdriveExplorer({
  onFilesSelect,
}: SimpleWorkdriveExplorerProps) {
  const { accessToken, setAccessToken, updateZohoRefreshToken } = useZoho();
  const searchParams = useSearchParams();

  const [files, setFiles] = useState<ZohoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string>(ROOT_FOLDER_ID);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: ROOT_FOLDER_ID, name: "Racine" },
  ]);
  const [selectedAudioFile, setSelectedAudioFile] = useState<ZohoFile | null>(
    null
  );
  const [selectedTranscriptionFile, setSelectedTranscriptionFile] =
    useState<ZohoFile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingImport, setProcessingImport] = useState(false);

  // Traiter le token d'authentification Zoho si présent dans l'URL
  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (tokenParam) {
      try {
        const parsedToken = JSON.parse(
          decodeURIComponent(tokenParam)
        ) as ZohoAuthToken;
        console.log("Token Zoho reçu:", parsedToken);

        // Mettre à jour le contexte avec les tokens
        if (parsedToken.access_token) {
          setAccessToken(parsedToken.access_token);
        }

        if (parsedToken.refresh_token) {
          updateZohoRefreshToken(parsedToken.refresh_token);
        }

        // Nettoyer l'URL pour supprimer le token
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        setSuccessMessage("Connexion à Zoho WorkDrive réussie!");
      } catch (error) {
        console.error("Erreur lors du traitement du token:", error);
        setError("Erreur lors de la connexion à Zoho WorkDrive");
      }
    }
  }, [searchParams, setAccessToken, updateZohoRefreshToken]);

  // Charger les fichiers quand le token ou le dossier change
  useEffect(() => {
    const loadFiles = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Utiliser l'API client pour récupérer les fichiers
        const response = await fetchFiles(currentFolder);
        if (response) {
          setFiles(response);
        } else {
          setError("Impossible de récupérer les fichiers");
        }
      } catch (error) {
        console.error("Error loading files:", error);
        setError(
          `Erreur lors du chargement des fichiers: ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [accessToken, currentFolder]);

  // Fonction pour la connexion à Zoho
  const handleZohoAuth = () => {
    // Rediriger vers l'endpoint d'authentification Zoho avec l'URL actuelle comme redirection
    const currentUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `/api/zoho/auth?redirect=${currentUrl}`;
  };

  // Fonction simplifiée pour récupérer les fichiers
  const fetchFiles = async (folderId: string) => {
    if (!accessToken) return null;

    try {
      // Utiliser l'API locale de Next.js pour récupérer les fichiers
      const response = await fetch(`/api/zoho/files?folderId=${folderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré ou invalide, déclencher une nouvelle authentification
          setError("Votre session Zoho a expiré, veuillez vous reconnecter");
          setAccessToken(null);
          return null;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching files:", error);
      return null;
    }
  };

  // Gestionnaire pour naviguer vers un dossier
  const handleFolderClick = (folderId: string, folderName?: string) => {
    setFolderHistory((prev) => [...prev, currentFolder]);
    setCurrentFolder(folderId);

    // Mise à jour du chemin du dossier
    setFolderPath((prev) => [
      ...prev,
      { id: folderId, name: folderName || "Nouveau dossier" },
    ]);
  };

  // Gestionnaire pour revenir au dossier précédent
  const handleBack = () => {
    if (folderHistory.length > 0) {
      const previousFolder = folderHistory[folderHistory.length - 1];
      setFolderHistory((prev) => prev.slice(0, -1));
      setCurrentFolder(previousFolder);

      // Mise à jour du chemin du dossier
      setFolderPath((prev) => prev.slice(0, -1));
    }
  };

  // Gestionnaire pour revenir au dossier racine
  const handleHome = () => {
    setFolderHistory([]);
    setCurrentFolder(ROOT_FOLDER_ID);
    setFolderPath([{ id: ROOT_FOLDER_ID, name: "Racine" }]);
  };

  // Fermer le message d'erreur
  const handleCloseError = () => {
    setError(null);
  };

  // Fermer le message de succès
  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  // Vérifier si un fichier est audio
  const isAudioFile = (file: ZohoFile) => {
    // Vérifiez d'abord que file existe
    if (!file) return false;

    const mimeType = file.mimeType?.toLowerCase();
    const name = file.name?.toLowerCase(); // Ajout de l'opérateur optionnel

    return (
      mimeType?.includes("audio") ||
      (name &&
        (name.endsWith(".mp3") ||
          name.endsWith(".wav") ||
          name.endsWith(".m4a") ||
          name.endsWith(".ogg")))
    );
  };

  // Vérifier si un fichier peut être une transcription
  const isTranscriptionFile = (file: ZohoFile) => {
    // Vérifiez d'abord que file existe
    if (!file) return false;

    const mimeType = file.mimeType?.toLowerCase();
    const name = file.name?.toLowerCase(); // Ajout de l'opérateur optionnel

    return (
      mimeType?.includes("text") ||
      mimeType?.includes("json") ||
      (name &&
        (name.endsWith(".txt") ||
          name.endsWith(".json") ||
          name.endsWith(".doc") ||
          name.endsWith(".docx")))
    );
  };

  // Gestionnaire pour sélectionner un fichier audio
  const handleSelectAudioFile = (file: ZohoFile) => {
    if (selectedAudioFile?.id === file.id) {
      setSelectedAudioFile(null);
    } else {
      setSelectedAudioFile(file);
    }
  };

  // Gestionnaire pour sélectionner un fichier de transcription
  const handleSelectTranscriptionFile = (file: ZohoFile) => {
    if (selectedTranscriptionFile?.id === file.id) {
      setSelectedTranscriptionFile(null);
    } else {
      setSelectedTranscriptionFile(file);
    }
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
      const audioFile = await downloadFile(selectedAudioFile);

      // Télécharger le fichier de transcription s'il est sélectionné
      let transcriptionText = "";
      if (selectedTranscriptionFile) {
        transcriptionText = await downloadTranscription(
          selectedTranscriptionFile
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

  // Télécharger un fichier audio de Zoho
  const downloadFile = async (file: ZohoFile): Promise<File> => {
    const fileId = file.originalId || file.id;

    // Utiliser l'endpoint Next.js pour télécharger les fichiers
    const response = await fetch(`/api/zoho/download?fileId=${fileId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const blob = await response.blob();
    const fileName = file.name || "downloaded_file";

    // Créer un objet File
    return new File([blob], fileName, { type: contentType });
  };

  // Télécharger et lire un fichier de transcription
  const downloadTranscription = async (file: ZohoFile): Promise<string> => {
    const fileId = file.originalId || file.id;

    // Utiliser l'endpoint Next.js
    const response = await fetch(`/api/zoho/download?fileId=${fileId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";

    // Selon le type de contenu, traiter différemment
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } else {
      // Pour le texte ou autres formats
      return await response.text();
    }
  };

  // S'il n'y a pas de token d'accès, afficher le bouton de connexion
  if (!accessToken) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vous n'êtes pas connecté à Zoho WorkDrive. Veuillez vous connecter
          pour accéder à vos fichiers.
        </Alert>

        <Button
          variant="contained"
          color="primary"
          startIcon={<LoginIcon />}
          onClick={handleZohoAuth}
          size="large"
        >
          Se connecter à Zoho WorkDrive
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Barre de navigation */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton
          color="primary"
          onClick={handleBack}
          disabled={folderHistory.length === 0}
          sx={{ mr: 1 }}
        >
          <BackIcon />
        </IconButton>
        <IconButton
          color="primary"
          onClick={handleHome}
          disabled={currentFolder === ROOT_FOLDER_ID}
        >
          <HomeIcon />
        </IconButton>

        <Breadcrumbs sx={{ ml: 2, flexGrow: 1 }}>
          {folderPath.map((folder, index) => (
            <Link
              key={folder.id}
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (index !== folderPath.length - 1) {
                  setCurrentFolder(folder.id);
                  setFolderPath((prev) => prev.slice(0, index + 1));
                  setFolderHistory((prev) => prev.slice(0, index));
                }
              }}
              underline={index !== folderPath.length - 1 ? "hover" : "none"}
              sx={{ cursor: "pointer" }}
            >
              {folder.name}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Bouton pour importer les fichiers sélectionnés */}
        {(selectedAudioFile || selectedTranscriptionFile) && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={handleImportFiles}
            disabled={processingImport || !selectedAudioFile}
          >
            {processingImport ? <CircularProgress size={24} /> : "Importer"}
          </Button>
        )}
      </Box>

      {/* Informations de sélection */}
      {(selectedAudioFile || selectedTranscriptionFile) && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Fichiers sélectionnés:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {selectedAudioFile && (
              <Chip
                icon={<AudioFileIcon />}
                label={`Audio: ${selectedAudioFile.name}`}
                color="secondary"
                onDelete={() => setSelectedAudioFile(null)}
              />
            )}
            {selectedTranscriptionFile && (
              <Chip
                icon={<DescriptionIcon />}
                label={`Transcription: ${selectedTranscriptionFile.name}`}
                color="primary"
                onDelete={() => setSelectedTranscriptionFile(null)}
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Liste des fichiers */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {files.map((file) => {
            const isFolder = file.type === "folder";
            const isAudio = isAudioFile(file);
            const isTranscription = isTranscriptionFile(file);

            return (
              <Grid item key={file.id} xs={12} sm={6} md={4}>
                <Card
                  variant="outlined"
                  sx={{
                    backgroundColor:
                      selectedAudioFile?.id === file.id ||
                      selectedTranscriptionFile?.id === file.id
                        ? "rgba(25, 118, 210, 0.08)"
                        : "inherit",
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      {isFolder ? (
                        <FolderIcon color="primary" sx={{ mr: 1 }} />
                      ) : isAudio ? (
                        <AudioFileIcon color="secondary" sx={{ mr: 1 }} />
                      ) : isTranscription ? (
                        <DescriptionIcon color="info" sx={{ mr: 1 }} />
                      ) : (
                        <DescriptionIcon color="action" sx={{ mr: 1 }} />
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      {isFolder ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleFolderClick(file.id, file.name)}
                          fullWidth
                        >
                          Ouvrir
                        </Button>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "space-around",
                          }}
                        >
                          {isAudio && (
                            <Button
                              size="small"
                              variant={
                                selectedAudioFile?.id === file.id
                                  ? "contained"
                                  : "outlined"
                              }
                              color="secondary"
                              onClick={() => handleSelectAudioFile(file)}
                            >
                              {selectedAudioFile?.id === file.id
                                ? "Audio ✓"
                                : "Sélectionner Audio"}
                            </Button>
                          )}
                          {isTranscription && (
                            <Button
                              size="small"
                              variant={
                                selectedTranscriptionFile?.id === file.id
                                  ? "contained"
                                  : "outlined"
                              }
                              color="primary"
                              onClick={() =>
                                handleSelectTranscriptionFile(file)
                              }
                            >
                              {selectedTranscriptionFile?.id === file.id
                                ? "Transcription ✓"
                                : "Sélect. Transcription"}
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {files.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography color="textSecondary">
                  Aucun fichier dans ce dossier
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Snackbar pour les erreurs */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Snackbar pour les succès */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
