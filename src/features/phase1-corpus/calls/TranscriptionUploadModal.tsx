// components/calls/TranscriptionUploadModal.tsx - Modal pour transcriptions
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
  TextField,
} from "@mui/material";
import {
  Description as TranscriptIcon,
  CloudUpload as UploadIcon,
  Folder as WorkdriveIcon,
  Code as JsonIcon,
} from "@mui/icons-material";
import SimpleWorkdriveExplorer from "@/components/SimpleWorkdriveExplorer";

// ✅ Interface pour un appel (même que les autres composants)
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

interface TranscriptionUploadModalProps {
  open: boolean;
  call?: Call;
  onClose: () => void;
  onUpload: (transcriptionText: string, call?: Call) => void;
  title?: string;
}

// ✅ Composant TabPanel
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
      id={`transcription-upload-tabpanel-${index}`}
      aria-labelledby={`transcription-upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

// ✅ Composant pour upload de fichier transcription
const TranscriptionFileUpload: React.FC<{
  onTranscriptionSelect: (text: string) => void;
}> = ({ onTranscriptionSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = async (file: File) => {
    try {
      console.log("📝 Traitement fichier transcription:", file.name, file.type);

      if (file.type === "application/json" || file.name.endsWith(".json")) {
        const text = await file.text();
        // Valider que c'est un JSON valide
        try {
          JSON.parse(text);
          onTranscriptionSelect(text);
        } catch (e) {
          throw new Error("Le fichier JSON n'est pas valide");
        }
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        onTranscriptionSelect(text);
      } else {
        throw new Error("Format non supporté. Utilisez .json ou .txt");
      }
    } catch (error) {
      console.error("❌ Erreur traitement fichier:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors du traitement du fichier"
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
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
      }}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
    >
      <TranscriptIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Sélectionner un fichier de transcription
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Glissez-déposez un fichier ou cliquez pour parcourir
      </Typography>

      <input
        type="file"
        accept=".json,.txt"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="transcription-file-input"
      />
      <label htmlFor="transcription-file-input">
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
          Formats supportés : JSON, TXT (max 10MB)
        </Typography>
      </Alert>
    </Paper>
  );
};

export const TranscriptionUploadModal: React.FC<
  TranscriptionUploadModalProps
> = ({ open, call, onClose, onUpload, title }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [manualText, setManualText] = useState<string>("");

  // ✅ Réinitialiser l'état quand le modal se ferme
  React.useEffect(() => {
    if (!open) {
      setTranscriptionText("");
      setManualText("");
      setActiveTab(0);
    }
  }, [open]);

  // ✅ Titre adaptatif
  const getModalTitle = () => {
    if (title) return title;

    const callInfo = call ? ` - Appel #${call.callid}` : "";
    return `📝 Ajouter une transcription${callInfo}`;
  };

  // ✅ Gestionnaire pour sélection depuis WorkDrive
  const handleWorkdriveSelection = (
    audioFile: File | null,
    transcriptionText?: string
  ) => {
    if (transcriptionText) {
      console.log(
        "☁️ Transcription sélectionnée depuis WorkDrive, longueur:",
        transcriptionText.length
      );
      setTranscriptionText(transcriptionText);
    }
  };

  // ✅ Gestionnaire pour sélection depuis fichier
  const handleFileTranscription = (text: string) => {
    console.log(
      "📁 Transcription sélectionnée depuis fichier, longueur:",
      text.length
    );
    setTranscriptionText(text);
  };

  // ✅ Gestionnaire pour saisie manuelle
  const handleManualInput = () => {
    if (manualText.trim()) {
      console.log(
        "✍️ Transcription saisie manuellement, longueur:",
        manualText.length
      );
      setTranscriptionText(manualText);
    }
  };

  // ✅ Gestionnaire de confirmation
  const handleConfirmUpload = () => {
    if (transcriptionText) {
      console.log("✅ Confirmation upload transcription");
      onUpload(transcriptionText, call);
      onClose();
    }
  };

  const hasTranscription = transcriptionText.length > 0;

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
          <TranscriptIcon color="primary" />
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
          <Tab icon={<UploadIcon />} label="💾 Fichier" />
          <Tab icon={<WorkdriveIcon />} label="☁️ WorkDrive" />
          <Tab icon={<JsonIcon />} label="✍️ Saisie manuelle" />
        </Tabs>

        {/* ✅ Onglet Fichier */}
        <TabPanel value={activeTab} index={0}>
          <TranscriptionFileUpload
            onTranscriptionSelect={handleFileTranscription}
          />
        </TabPanel>

        {/* ✅ Onglet WorkDrive */}
        <TabPanel value={activeTab} index={1}>
          <SimpleWorkdriveExplorer
            mode="transcription_only"
            showSelectionSummary={true}
            showTabs={false}
            title="Parcourir WorkDrive"
            description="Sélectionnez une transcription depuis votre Zoho WorkDrive"
            onFilesSelect={handleWorkdriveSelection}
          />
        </TabPanel>

        {/* ✅ Onglet Saisie manuelle */}
        <TabPanel value={activeTab} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Saisir ou coller la transcription
            </Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              variant="outlined"
              placeholder="Collez ici votre transcription JSON ou texte..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="outlined"
              onClick={handleManualInput}
              disabled={!manualText.trim()}
            >
              Utiliser cette transcription
            </Button>
          </Box>
        </TabPanel>

        {/* ✅ Résumé de la transcription sélectionnée */}
        {hasTranscription && (
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
              ✅ Transcription sélectionnée
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TranscriptIcon color="success" />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {transcriptionText.length} caractères
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {transcriptionText.startsWith("{")
                    ? "Format JSON"
                    : "Format texte"}
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
          disabled={!hasTranscription}
          startIcon={<TranscriptIcon />}
        >
          {hasTranscription
            ? `Ajouter la transcription`
            : "Sélectionner une transcription"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
