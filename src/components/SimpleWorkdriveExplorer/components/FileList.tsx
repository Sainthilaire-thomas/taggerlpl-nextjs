// components/FileList.tsx - Version étendue avec filtrage par mode
import React, { useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Folder as FolderIcon,
  AudioFile as AudioFileIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { ZohoFile, WorkdriveExplorerMode } from "../types";
import { isAudioFile, isTranscriptionFile } from "../utils/fileHelpers";

// ✅ MISE À JOUR: Interface étendue avec prop mode optionnelle
interface FileListProps {
  files: ZohoFile[];
  loading: boolean;
  selectedAudioFile?: ZohoFile | null;
  selectedTranscriptionFile?: ZohoFile | null;
  onFolderClick: (folderId: string, folderName?: string) => void;
  onSelectAudioFile: (file: ZohoFile) => void;
  onSelectTranscriptionFile: (file: ZohoFile) => void;
  mode?: WorkdriveExplorerMode; // ✅ NOUVEAU - optionnel pour compatibilité
}

export const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  selectedAudioFile,
  selectedTranscriptionFile,
  onFolderClick,
  onSelectAudioFile,
  onSelectTranscriptionFile,
  mode = "full", // ✅ NOUVEAU: Valeur par défaut pour compatibilité
}) => {
  useEffect(() => {
    if (files && files.length > 0) {
      console.log("Structure des fichiers reçus:", files[0]);
      console.log(`Mode de filtrage actuel: ${mode}`);
    }
  }, [files, mode]);

  // ✅ NOUVEAU: Filtrage des fichiers selon le mode
  const filteredFiles = useMemo(() => {
    if (!files) return [];

    console.log(`🔍 Filtrage de ${files.length} fichiers en mode '${mode}'`);

    const filtered = files.filter((file) => {
      if (!file || !file.id) {
        console.warn("Fichier invalide dans la liste:", file);
        return false;
      }

      // Toujours afficher les dossiers pour navigation
      const isFolder =
        file.attributes?.type === "folder" ||
        file.attributes?.is_folder === true;

      if (isFolder) {
        console.log(
          `📁 Dossier conservé: ${file.attributes?.name || file.name}`
        );
        return true;
      }

      // Filtrage selon le mode pour les fichiers
      const fileName = file.attributes?.name || file.name || "Fichier sans nom";

      if (mode === "audio_only") {
        const isAudio = isAudioFile(file);
        console.log(`🎵 ${fileName}: isAudio=${isAudio}`);
        return isAudio;
      }

      if (mode === "transcription_only") {
        const isTranscript = isTranscriptionFile(file);
        console.log(`📝 ${fileName}: isTranscription=${isTranscript}`);
        return isTranscript;
      }

      // Mode 'full': afficher tous les fichiers
      console.log(`📄 ${fileName}: affiché (mode full)`);
      return true;
    });

    console.log(
      `✅ ${filtered.length} fichiers après filtrage (mode: ${mode})`
    );
    return filtered;
  }, [files, mode]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!filteredFiles || filteredFiles.length === 0) {
    // ✅ NOUVEAU: Message adapté selon le mode
    const getEmptyMessage = () => {
      switch (mode) {
        case "audio_only":
          return "Aucun fichier audio dans ce dossier";
        case "transcription_only":
          return "Aucune transcription dans ce dossier";
        default:
          return "Aucun fichier dans ce dossier";
      }
    };

    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="textSecondary">{getEmptyMessage()}</Typography>
        {mode !== "full" && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mt: 1, display: "block" }}
          >
            Les dossiers sont toujours visibles pour la navigation
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr", // 1 colonne sur mobile
          sm: "repeat(2, 1fr)", // 2 colonnes sur tablette
          md: "repeat(3, 1fr)", // 3 colonnes sur desktop
        },
        gap: 2,
      }}
    >
      {filteredFiles.map((file) => {
        // Détermine si c'est un dossier en vérifiant plusieurs propriétés possibles
        const isFolder =
          file.attributes?.type === "folder" ||
          file.attributes?.is_folder === true;

        // Vérifie si c'est un fichier audio ou de transcription
        const isAudio = isAudioFile(file);
        const isTranscription = isTranscriptionFile(file);

        // Récupère le nom du fichier/dossier de manière fiable
        const fileName =
          file.attributes?.name ||
          file.attributes?.display_attr_name ||
          file.name ||
          "Sans nom";

        return (
          <Card
            key={file.id}
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
                    fontWeight: isFolder ? "bold" : "normal",
                  }}
                >
                  {fileName}
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
                    color="primary"
                    onClick={() => onFolderClick(file.id, fileName)}
                    fullWidth
                    startIcon={<FolderIcon />}
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
                    {/* ✅ MODIFICATION: Boutons conditionnels selon le mode */}
                    {isAudio && (mode === "full" || mode === "audio_only") && (
                      <Button
                        size="small"
                        variant={
                          selectedAudioFile?.id === file.id
                            ? "contained"
                            : "outlined"
                        }
                        color="secondary"
                        onClick={() => onSelectAudioFile(file)}
                      >
                        {selectedAudioFile?.id === file.id
                          ? "Audio ✓"
                          : "Sélect. Audio"}
                      </Button>
                    )}
                    {isTranscription &&
                      (mode === "full" || mode === "transcription_only") && (
                        <Button
                          size="small"
                          variant={
                            selectedTranscriptionFile?.id === file.id
                              ? "contained"
                              : "outlined"
                          }
                          color="primary"
                          onClick={() => onSelectTranscriptionFile(file)}
                        >
                          {selectedTranscriptionFile?.id === file.id
                            ? "Transcript. ✓"
                            : "Sélect. Transcript."}
                        </Button>
                      )}
                    {/* ✅ NOUVEAU: Affichage si aucun bouton disponible (fichier non supporté en mode filtré) */}
                    {!isAudio && !isTranscription && mode !== "full" && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ alignSelf: "center" }}
                      >
                        Type non supporté
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};
