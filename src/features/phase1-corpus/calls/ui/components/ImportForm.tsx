// src/components/calls/ui/components/ImportForm.tsx

import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Tabs,
  Tab,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  CloudUpload,
  AudioFile,
  Description,
  Clear,
  CheckCircle,
  Info,
} from "@mui/icons-material";
import { ImportFormData } from "../hooks/useCallImport";

interface ImportFormProps {
  onImport: (data: ImportFormData) => Promise<void>;
  onFileImport: (
    file: File,
    transcription?: string,
    description?: string
  ) => Promise<void>;
  disabled?: boolean;
  maxFileSize: number;
  allowedFormats: readonly string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

/**
 * Formulaire d'import unifié avec support multi-sources
 * Interface pure sans logique métier
 */
export const ImportForm: React.FC<ImportFormProps> = ({
  onImport,
  onFileImport,
  disabled = false,
  maxFileSize,
  allowedFormats,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // État pour l'onglet "Fichier Local"
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [description, setDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // État pour l'onglet "WorkDrive"
  const [workdriveFileName, setWorkdriveFileName] = useState("");
  const [workdriveTranscription, setWorkdriveTranscription] = useState("");
  const [workdriveDescription, setWorkdriveDescription] = useState("");

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validation des fichiers
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // Taille
      if (file.size > maxFileSize * 1024 * 1024) {
        return `Fichier trop volumineux (max: ${maxFileSize}MB)`;
      }

      // Format (basé sur l'extension)
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !allowedFormats.includes(extension)) {
        return `Format non supporté (autorisés: ${allowedFormats.join(", ")})`;
      }

      return null;
    },
    [maxFileSize, allowedFormats]
  );

  /**
   * Gestion de la sélection de fichier
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);

      if (error) {
        setErrors((prev) => ({ ...prev, file: error }));
        return;
      }

      setSelectedFile(file);
      setErrors((prev) => ({ ...prev, file: "" }));

      // Auto-génération de la description
      if (!description) {
        setDescription(`Import local - ${file.name}`);
      }
    },
    [validateFile, description]
  );

  /**
   * Drag & Drop
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  /**
   * Clic sur zone de drop
   */
  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Changement de fichier via input
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [handleFileSelect]
  );

  /**
   * Validation de la transcription JSON
   */
  const validateTranscription = useCallback((text: string): string | null => {
    if (!text.trim()) return null;

    try {
      const parsed = JSON.parse(text);
      if (!parsed.words || !Array.isArray(parsed.words)) {
        return "La transcription doit contenir un tableau 'words'";
      }
      return null;
    } catch {
      return "JSON invalide";
    }
  }, []);

  /**
   * Soumission onglet "Fichier Local"
   */
  const handleFileSubmit = useCallback(async () => {
    if (!selectedFile) {
      setErrors((prev) => ({
        ...prev,
        file: "Veuillez sélectionner un fichier",
      }));
      return;
    }

    const transcriptionError = validateTranscription(transcriptionText);
    if (transcriptionError) {
      setErrors((prev) => ({ ...prev, transcription: transcriptionError }));
      return;
    }

    setErrors({});
    await onFileImport(
      selectedFile,
      transcriptionText || undefined,
      description
    );
  }, [
    selectedFile,
    transcriptionText,
    description,
    onFileImport,
    validateTranscription,
  ]);

  /**
   * Soumission onglet "WorkDrive"
   */
  const handleWorkdriveSubmit = useCallback(async () => {
    if (!workdriveFileName.trim()) {
      setErrors((prev) => ({ ...prev, workdrive: "Nom de fichier requis" }));
      return;
    }

    const transcriptionError = validateTranscription(workdriveTranscription);
    if (transcriptionError) {
      setErrors((prev) => ({
        ...prev,
        workdriveTranscription: transcriptionError,
      }));
      return;
    }

    setErrors({});
    await onImport({
      workdriveFileName,
      transcriptionText: workdriveTranscription || undefined,
      description:
        workdriveDescription || `Import WorkDrive - ${workdriveFileName}`,
      origin: "workdrive",
    });
  }, [
    workdriveFileName,
    workdriveTranscription,
    workdriveDescription,
    onImport,
    validateTranscription,
  ]);

  /**
   * Reset du formulaire
   */
  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setTranscriptionText("");
    setDescription("");
    setWorkdriveFileName("");
    setWorkdriveTranscription("");
    setWorkdriveDescription("");
    setErrors({});
  }, []);

  /**
   * Suppression du fichier sélectionné
   */
  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setErrors((prev) => ({ ...prev, file: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <Box>
      {/* Onglets de navigation */}
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab icon={<AudioFile />} label="Fichier Local" disabled={disabled} />
        <Tab icon={<CloudUpload />} label="WorkDrive" disabled={disabled} />
      </Tabs>

      {/* Onglet 1: Fichier Local */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          {/* Zone de Drag & Drop */}
          <Card
            variant="outlined"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFileInputClick}
            sx={{
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              border: dragActive
                ? `2px dashed ${theme.palette.primary.main}`
                : "2px dashed transparent",
              backgroundColor: dragActive
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.grey[500], 0.05),
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                border: `2px dashed ${theme.palette.primary.main}`,
              },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept={allowedFormats.map((f) => `.${f}`).join(",")}
              onChange={handleFileInputChange}
              disabled={disabled}
            />

            {selectedFile ? (
              <Box>
                <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Fichier sélectionné
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                  mb={2}
                >
                  <Chip
                    label={selectedFile.name}
                    color="primary"
                    variant="outlined"
                    onDelete={clearSelectedFile}
                    deleteIcon={<Clear />}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUpload
                  sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Glissez votre fichier audio ici
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ou cliquez pour parcourir
                </Typography>
                <Box
                  display="flex"
                  gap={1}
                  justifyContent="center"
                  flexWrap="wrap"
                >
                  {allowedFormats.map((format) => (
                    <Chip
                      key={format}
                      label={format.toUpperCase()}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Card>

          {errors.file && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.file}
            </Alert>
          )}

          {/* Champs additionnels */}
          <Box mt={3}>
            <TextField
              fullWidth
              label="Transcription (JSON optionnel)"
              multiline
              rows={4}
              value={transcriptionText}
              onChange={(e) => setTranscriptionText(e.target.value)}
              placeholder='{"words": [{"text": "bonjour", "startTime": 0, "endTime": 1, "speaker": "conseiller"}]}'
              error={!!errors.transcription}
              helperText={
                errors.transcription ||
                "JSON avec structure words requise pour la validation"
              }
              disabled={disabled}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'appel (optionnel)"
              disabled={disabled}
              sx={{ mb: 3 }}
            />
          </Box>

          {/* Bouton de soumission */}
          <Button
            variant="contained"
            size="large"
            onClick={handleFileSubmit}
            disabled={disabled || !selectedFile}
            startIcon={<AudioFile />}
            fullWidth
          >
            {disabled ? "Import en cours..." : "Importer le fichier"}
          </Button>
        </Box>
      </TabPanel>

      {/* Onglet 2: WorkDrive */}
      <TabPanel value={tabValue} index={1}>
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <Info sx={{ verticalAlign: "middle", mr: 1 }} />
              Import depuis Zoho WorkDrive. Assurez-vous d'être connecté à votre
              compte Zoho.
            </Typography>
          </Alert>

          <Box>
            <TextField
              fullWidth
              label="Nom du fichier WorkDrive"
              value={workdriveFileName}
              onChange={(e) => setWorkdriveFileName(e.target.value)}
              placeholder="fichier-appel.mp3"
              error={!!errors.workdrive}
              helperText={
                errors.workdrive || "Nom exact du fichier dans WorkDrive"
              }
              disabled={disabled}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Transcription (JSON optionnel)"
              multiline
              rows={4}
              value={workdriveTranscription}
              onChange={(e) => setWorkdriveTranscription(e.target.value)}
              placeholder='{"words": [...]}'
              error={!!errors.workdriveTranscription}
              helperText={
                errors.workdriveTranscription || "Transcription au format JSON"
              }
              disabled={disabled}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              value={workdriveDescription}
              onChange={(e) => setWorkdriveDescription(e.target.value)}
              placeholder="Description de l'appel (optionnel)"
              disabled={disabled}
              sx={{ mb: 3 }}
            />
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleWorkdriveSubmit}
            disabled={disabled || !workdriveFileName.trim()}
            startIcon={<CloudUpload />}
            fullWidth
          >
            {disabled ? "Import en cours..." : "Importer depuis WorkDrive"}
          </Button>
        </Box>
      </TabPanel>

      {/* Actions globales */}
      <Box mt={4} display="flex" gap={2} justifyContent="center">
        <Button variant="outlined" onClick={resetForm} disabled={disabled}>
          Réinitialiser
        </Button>
      </Box>
    </Box>
  );
};
