// components/FileList.tsx
import React, { useEffect } from "react";
import {
  Grid,
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
import { ZohoFile } from "../types";
import { isAudioFile, isTranscriptionFile } from "../utils/fileHelpers";

interface FileListProps {
  files: ZohoFile[];
  loading: boolean;
  selectedAudioFile?: ZohoFile | null;
  selectedTranscriptionFile?: ZohoFile | null;
  onFolderClick: (folderId: string, folderName?: string) => void;
  onSelectAudioFile: (file: ZohoFile) => void;
  onSelectTranscriptionFile: (file: ZohoFile) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  selectedAudioFile,
  selectedTranscriptionFile,
  onFolderClick,
  onSelectAudioFile,
  onSelectTranscriptionFile,
}) => {
  useEffect(() => {
    if (files && files.length > 0) {
      console.log("Structure des fichiers reçus:", files[0]);
    }
  }, [files]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Grid item xs={12}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="textSecondary">
            Aucun fichier dans ce dossier
          </Typography>
        </Paper>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {files.map((file) => {
        if (!file || !file.id) {
          console.warn("Fichier invalide dans la liste:", file);
          return null;
        }

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
          <Grid item xs={12} sm={6} md={4} key={file.id}>
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
                      {isAudio && (
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
                      {isTranscription && (
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
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};
