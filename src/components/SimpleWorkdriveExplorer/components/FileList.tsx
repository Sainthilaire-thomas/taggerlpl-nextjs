// components/FileList.tsx - VERSION FINALE CORRIGÉE
import React, { useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Folder as FolderIcon,
  AudioFile as AudioFileIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { ZohoFile, WorkdriveExplorerMode } from "../types";
import { isAudioFile, isTranscriptionFile } from "../utils/fileHelpers";
import { useWorkdriveDuplicateCheck } from "../hooks/useWorkdriveDuplicateCheck";

interface FileListProps {
  files: ZohoFile[];
  loading: boolean;
  selectedAudioFile?: ZohoFile | null;
  selectedTranscriptionFile?: ZohoFile | null;
  onFolderClick: (folderId: string, folderName?: string) => void;
  onSelectAudioFile: (file: ZohoFile) => void;
  onSelectTranscriptionFile: (file: ZohoFile) => void;
  mode?: WorkdriveExplorerMode;
  enableDuplicateCheck?: boolean; // ✅ NOUVEAU
  onDuplicateClick?: (file: ZohoFile, existingCall: any) => void; // ✅ NOUVEAU
}

const DuplicateStatusBadge: React.FC<{
  status: "unknown" | "checking" | "duplicate" | "new";
  existingCall?: any;
  onDuplicateClick?: () => void;
}> = ({ status, existingCall, onDuplicateClick }) => {
  switch (status) {
    case "checking":
      return (
        <Chip
          size="small"
          icon={<CircularProgress size={12} />}
          label="Vérification..."
          color="default"
          variant="outlined"
        />
      );
    case "duplicate":
      return (
        <Tooltip
          title={`Déjà importé: ${
            existingCall?.filename ||
            existingCall?.description ||
            "Appel existant"
          }`}
        >
          <Chip
            size="small"
            icon={<WarningIcon />}
            label="Déjà importé"
            color="warning"
            clickable={!!onDuplicateClick}
            onClick={onDuplicateClick}
            sx={{
              cursor: onDuplicateClick ? "pointer" : "default",
              "&:hover": onDuplicateClick
                ? { backgroundColor: "warning.200" }
                : {},
            }}
          />
        </Tooltip>
      );
    case "new":
      return (
        <Chip
          size="small"
          icon={<AddIcon />}
          label="Nouveau"
          color="success"
          variant="outlined"
        />
      );
    default:
      return null;
  }
};

export const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  selectedAudioFile,
  selectedTranscriptionFile,
  onFolderClick,
  onSelectAudioFile,
  onSelectTranscriptionFile,
  mode = "full",
  enableDuplicateCheck = false,
  onDuplicateClick,
}) => {
  // ✅ TOUJOURS appeler le hook (Rules of Hooks)
  const {
    checkFileForDuplicate,
    getFileStatus,
    getDuplicateDetails,
    clearCache,
    cacheStats,
  } = useWorkdriveDuplicateCheck();

  // Nettoyer le cache lors du changement de dossier
  useEffect(() => {
    if (enableDuplicateCheck) {
      clearCache();
    }
  }, [files, clearCache, enableDuplicateCheck]);

  // Vérification automatique des doublons
  useEffect(() => {
    if (!enableDuplicateCheck || !files) return;

    const timeoutId = setTimeout(() => {
      const fileEntries = files
        .filter((file) => {
          const isFolder =
            file.attributes?.type === "folder" ||
            file.attributes?.is_folder === true;
          return !isFolder && (file.attributes?.name || file.name);
        })
        .slice(0, 8); // Limiter à 8 fichiers

      // Vérifier chaque fichier avec délai
      fileEntries.forEach((file, index) => {
        setTimeout(() => {
          checkFileForDuplicate(file);
        }, index * 300);
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [files, enableDuplicateCheck, checkFileForDuplicate]);

  // Filtrage des fichiers selon le mode
  const filteredFiles = useMemo(() => {
    if (!files) return [];
    return files.filter((file) => {
      if (!file || !file.id) return false;
      const isFolder =
        file.attributes?.type === "folder" ||
        file.attributes?.is_folder === true;
      if (isFolder) return true;

      if (mode === "audio_only") return isAudioFile(file);
      if (mode === "transcription_only") return isTranscriptionFile(file);
      return true;
    });
  }, [files, mode]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!filteredFiles || filteredFiles.length === 0) {
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
      </Paper>
    );
  }

  return (
    <Box>
      {/* Debug info avec thème adaptatif */}
      {enableDuplicateCheck && process.env.NODE_ENV === "development" && (
        <Box
          sx={{
            mb: 2,
            p: 1,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "grey.100",
            borderRadius: 1,
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.12)"
                : "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Cache doublons: {cacheStats.entries} entrées,{" "}
            {cacheStats.duplicates} doublons, {cacheStats.checking} en cours
          </Typography>
        </Box>
      )}

      {/* Grille de fichiers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {filteredFiles.map((file) => {
          const isFolder =
            file.attributes?.type === "folder" ||
            file.attributes?.is_folder === true;
          const isAudio = isAudioFile(file);
          const isTranscription = isTranscriptionFile(file);
          const fileName =
            file.attributes?.name ||
            file.attributes?.display_attr_name ||
            file.name ||
            "Sans nom";

          // ✅ Obtenir le statut et les détails
          const duplicateStatus =
            enableDuplicateCheck && !isFolder ? getFileStatus(file) : "unknown";
          const duplicateDetails =
            enableDuplicateCheck && duplicateStatus === "duplicate"
              ? getDuplicateDetails(file)
              : null;

          return (
            <Card
              key={file.id}
              variant="outlined"
              sx={{
                backgroundColor:
                  selectedAudioFile?.id === file.id ||
                  selectedTranscriptionFile?.id === file.id
                    ? "rgba(25, 118, 210, 0.08)"
                    : duplicateStatus === "duplicate"
                    ? "rgba(237, 108, 2, 0.05)"
                    : "inherit",
                border:
                  duplicateStatus === "duplicate"
                    ? "1px solid rgba(237, 108, 2, 0.3)"
                    : undefined,
              }}
            >
              <CardContent>
                {/* En-tête avec icône */}
                <Box
                  sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}
                >
                  {isFolder ? (
                    <FolderIcon color="primary" />
                  ) : isAudio ? (
                    <AudioFileIcon color="secondary" />
                  ) : isTranscription ? (
                    <DescriptionIcon color="info" />
                  ) : (
                    <DescriptionIcon color="action" />
                  )}

                  <Typography
                    variant="body1"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: isFolder ? "bold" : "normal",
                      flex: 1,
                    }}
                  >
                    {fileName}
                  </Typography>
                </Box>

                {/* Badge de statut doublon */}
                {enableDuplicateCheck && !isFolder && (
                  <Box sx={{ mb: 1 }}>
                    <DuplicateStatusBadge
                      status={duplicateStatus}
                      existingCall={duplicateDetails}
                      onDuplicateClick={
                        duplicateStatus === "duplicate" && onDuplicateClick
                          ? () => onDuplicateClick(file, duplicateDetails)
                          : undefined
                      }
                    />
                  </Box>
                )}

                {/* Boutons d'action */}
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
                      {isAudio &&
                        (mode === "full" || mode === "audio_only") && (
                          <Button
                            size="small"
                            variant={
                              selectedAudioFile?.id === file.id
                                ? "contained"
                                : "outlined"
                            }
                            color="secondary"
                            onClick={() => onSelectAudioFile(file)}
                            disabled={duplicateStatus === "checking"}
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
                            disabled={duplicateStatus === "checking"}
                          >
                            {selectedTranscriptionFile?.id === file.id
                              ? "Transcript. ✓"
                              : "Sélect. Transcript."}
                          </Button>
                        )}

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
    </Box>
  );
};
