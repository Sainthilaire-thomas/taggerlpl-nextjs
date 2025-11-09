// components/calls/AudioUploadModal.tsx - Version étendue avec onglets
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
} from "@mui/material";
import {
  AudioFile as AudioIcon,
  CloudUpload as UploadIcon,
  Folder as WorkdriveIcon,
} from "@mui/icons-material";
import SimpleWorkdriveExplorer from "@/features/phase1-corpus/workdrive";

// ✅ Interface pour un appel (réutiliser la même que ComplementActionButtons)
interface Call {
  callid: string;
  filename?: string | null;
  description?: string | null;
  transcription?: any | null;
  upload?: boolean;
  filepath?: string | null;
  audiourl?: string | null;
  preparedfortranscript?: boolean;
  is_tagging_call?: boolean;
  [key: string]: any;
}

interface AudioUploadModalProps {
  open: boolean;
  call?: Call;
  mode?: "complement" | "preparation";
  sources?: ("disk" | "workdrive")[];
  onClose: () => void;
  onUpload: (file: File, call?: Call) => void;
  title?: string;
}

// ✅ Composant TabPanel pour les onglets
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`audio-upload-tabpanel-${index}`}
      aria-labelledby={`audio-upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// ✅ Composant FileUploadZone pour l'upload depuis le disque
const FileUploadZone: React.FC<{
  onFileSelect: (file: File) => void;
  accept?: string;
}> = ({ onFileSelect, accept = "audio/*" }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("📁 Fichier sélectionné depuis le disque:", file.name);
      onFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      console.log("📁 Fichier déposé:", file.name);
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  return (
    <Paper
      sx={{
        p: 4,
        textAlign: "center",
        border: 2,
        borderStyle: "dashed",
        borderColor: isDragOver ? "primary.main" : "grey.300",
        bgcolor: isDragOver ? "primary.50" : "background.paper",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "primary.50",
        },
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <AudioIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Sélectionner un fichier audio
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Glissez-déposez un fichier ou cliquez pour parcourir
      </Typography>

      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="audio-file-input"
      />
      <label htmlFor="audio-file-input">
        <Button
          variant="outlined"
          component="span"
          startIcon={<UploadIcon />}
          sx={{ mt: 1 }}
        >
          Parcourir les fichiers
        </Button>
      </label>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          Formats supportés : MP3, WAV, M4A, AAC, OGG (max 100MB)
        </Typography>
      </Alert>
    </Paper>
  );
};

export const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
  open,
  call,
  mode = "complement",
  sources = ["disk", "workdrive"],
  onClose,
  onUpload,
  title,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ✅ Réinitialiser l'état quand le modal se ferme
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setActiveTab(0);
    }
  }, [open]);

  // ✅ Titre adaptatif
  const getModalTitle = () => {
    if (title) return title;

    const callInfo = call ? ` - Appel #${call.callid}` : "";
    return `🎵 Ajouter un fichier audio${callInfo}`;
  };

  // ✅ Gestionnaire pour la sélection depuis le disque
  const handleDiskFileSelect = (file: File) => {
    console.log(
      "💾 Fichier sélectionné depuis le disque:",
      file.name,
      file.size
    );
    setSelectedFile(file);
  };

  // ✅ Gestionnaire pour la sélection depuis WorkDrive
  const handleWorkdriveSelection = (
    audioFile: File | null,
    transcriptionText?: string
  ) => {
    if (audioFile) {
      console.log(
        "☁️ Fichier sélectionné depuis WorkDrive:",
        audioFile.name,
        audioFile.size
      );
      setSelectedFile(audioFile);
    }
  };

  // ✅ Gestionnaire de confirmation d'upload
  const handleConfirmUpload = () => {
    if (selectedFile) {
      console.log("✅ Confirmation upload:", selectedFile.name);
      onUpload(selectedFile, call);
      onClose();
    }
  };

  // ✅ Informations sur le fichier sélectionné
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return Math.round(bytes / (1024 * 1024)) + " MB";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: "600px" },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AudioIcon color="primary" />
          <Typography variant="h6" component="span">
            {getModalTitle()}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* ✅ Onglets sources */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          {sources.includes("disk") && (
            <Tab
              icon={<UploadIcon />}
              label="💾 Disque Dur"
              id="audio-upload-tab-0"
              aria-controls="audio-upload-tabpanel-0"
            />
          )}
          {sources.includes("workdrive") && (
            <Tab
              icon={<WorkdriveIcon />}
              label="☁️ WorkDrive"
              id="audio-upload-tab-1"
              aria-controls="audio-upload-tabpanel-1"
            />
          )}
        </Tabs>

        {/* ✅ Onglet Disque Dur */}
        {sources.includes("disk") && (
          <TabPanel value={activeTab} index={0}>
            <FileUploadZone onFileSelect={handleDiskFileSelect} />
          </TabPanel>
        )}

        {/* ✅ Onglet WorkDrive */}
        {sources.includes("workdrive") && (
          <TabPanel value={activeTab} index={sources.includes("disk") ? 1 : 0}>
            <SimpleWorkdriveExplorer
              mode="audio_only"
              showSelectionSummary={true}
              showTabs={false} // Pas besoin des onglets internes
              title="Parcourir WorkDrive"
              description="Sélectionnez un fichier audio depuis votre Zoho WorkDrive"
              onFilesSelect={handleWorkdriveSelection}
            />
          </TabPanel>
        )}

        {/* ✅ Résumé du fichier sélectionné */}
        {selectedFile && (
          <Paper
            sx={{
              p: 2,
              mt: 2,
              bgcolor: "success.50",
              border: 1,
              borderColor: "success.200",
            }}
          >
            <Typography variant="subtitle2" color="success.dark" gutterBottom>
              ✅ Fichier sélectionné
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AudioIcon color="success" />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatFileSize(selectedFile.size)} •{" "}
                  {selectedFile.type || "Type inconnu"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button
          onClick={handleConfirmUpload}
          variant="contained"
          color="primary"
          disabled={!selectedFile}
          startIcon={<AudioIcon />}
        >
          {selectedFile
            ? `Ajouter ${selectedFile.name}`
            : "Sélectionner un fichier"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AudioUploadModal;
