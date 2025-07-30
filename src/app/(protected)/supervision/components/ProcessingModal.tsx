// supervision/components/ProcessingModal.tsx - CORRECTED
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
} from "@mui/material";
import { Close, CloudUpload, Build, ExpandMore } from "@mui/icons-material";
import { ProcessingModalProps, ProcessingJob } from "../types";
import { useProcessingJobs } from "../hooks/useProcessingJobs";
import { CallProcessingService } from "../utils/callProcessingService";
import SimpleWorkdriveExplorer from "@/components/SimpleWorkdriveExplorer";

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  open,
  onClose,
  selectedRow,
  onProcessingComplete,
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const { addJob, updateJob, removeJob, getJob } = useProcessingJobs();
  const processingService = CallProcessingService.getInstance();

  // Reset des champs quand le modal s'ouvre
  useEffect(() => {
    if (open && selectedRow) {
      setAudioFile(null);
      setTranscriptionText("");
      setDescription(
        `Retraitement de l'appel ${
          selectedRow.call_id
        } via supervision le ${new Date().toLocaleString()}`
      );
    }
  }, [open, selectedRow]);

  if (!selectedRow) return null;
  const currentJob = getJob(selectedRow.call_id);

  // Handler pour WorkDrive
  const handleWorkdriveFilesSelect = async (
    audioFile: File | null,
    transcriptionText: string = "",
    workdriveFileName?: string // ✅ NOUVEAU: Recevoir le nom (même si pas utilisé ici)
  ) => {
    if (audioFile) {
      setAudioFile(audioFile);
      setDescription(
        (prev) =>
          `${prev}\nFichier audio (${
            workdriveFileName || audioFile.name // ✅ Préférer le nom WorkDrive
          }) chargé depuis WorkDrive le ${new Date().toLocaleString()}`
      );
    }

    if (transcriptionText) {
      setTranscriptionText(transcriptionText);
      setDescription(
        (prev) =>
          `${prev}\nTranscription${
            workdriveFileName ? ` (${workdriveFileName})` : ""
          } chargée depuis WorkDrive le ${new Date().toLocaleString()}`
      );
    }
  };
  // Traitement de l'appel
  const handleProcessCall = async () => {
    if (!selectedRow) return;

    const callId = selectedRow.call_id;

    try {
      // Créer un job de traitement
      const job: ProcessingJob = {
        callId,
        status: "queued",
        progress: 0,
        message: "Démarrage du traitement...",
        startTime: Date.now(),
        steps: [
          {
            name: "Préparation",
            status: "active",
            message: "Préparation des données",
            progress: 0,
          },
          {
            name: "Upload Audio",
            status: "pending",
            message: "En attente",
            progress: 0,
          },
          {
            name: "Transcription",
            status: "pending",
            message: "En attente",
            progress: 0,
          },
          {
            name: "Finalisation",
            status: "pending",
            message: "En attente",
            progress: 0,
          },
        ],
        currentStep: 0,
      };

      addJob(callId, job);

      // Étape 1: Upload audio
      if (audioFile) {
        updateJob(callId, {
          status: "uploading",
          progress: 25,
          message: "Upload du fichier audio...",
          steps: job.steps.map((step, idx) => ({
            ...step,
            status: idx === 0 ? "completed" : idx === 1 ? "active" : "pending",
          })) as any,
          currentStep: 1,
        });
      }

      // Étape 2: Transcription
      if (transcriptionText) {
        updateJob(callId, {
          status: "transcribing",
          progress: 50,
          message: "Traitement de la transcription...",
          steps: job.steps.map((step, idx) => ({
            ...step,
            status: idx <= 1 ? "completed" : idx === 2 ? "active" : "pending",
          })) as any,
          currentStep: 2,
        });
      }

      // Traitement principal
      await processingService.updateCallWithResources(
        callId,
        audioFile,
        transcriptionText,
        (message) => {
          updateJob(callId, { message });
        }
      );

      // Finalisation
      updateJob(callId, {
        status: "completed",
        progress: 100,
        message: "Traitement terminé avec succès",
        steps: job.steps.map((step) => ({
          ...step,
          status: "completed",
        })) as any,
        currentStep: 3,
      });

      // Fermer le modal et notifier
      setTimeout(() => {
        removeJob(callId);
        onProcessingComplete();
        onClose();
      }, 2000);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      updateJob(callId, {
        status: "error",
        message: `Erreur: ${errorMsg}`,
        error: errorMsg,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          minHeight: "70vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            🔧 Traitement des Ressources - Appel {selectedRow.call_id}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Chip
            label={`Tag: ${selectedRow.tag}`}
            color="primary"
            size="small"
            sx={{ mr: 1 }}
          />
          {selectedRow.missingResources &&
            selectedRow.missingResources.length > 0 && (
              <Chip
                label={`Manque: ${selectedRow.missingResources.join(", ")}`}
                color="warning"
                size="small"
              />
            )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Affichage du job de traitement en cours */}
        {currentJob && currentJob.status !== "completed" && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Traitement en cours</AlertTitle>
              {currentJob.message}
            </Alert>
            <LinearProgress
              variant="determinate"
              value={currentJob.progress}
              sx={{ mb: 2 }}
            />
            <Stepper activeStep={currentJob.currentStep} orientation="vertical">
              {currentJob.steps.map((step, index) => (
                <Step key={step.name} completed={step.status === "completed"}>
                  <StepLabel error={step.status === "error"}>
                    {step.name}
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2">{step.message}</Typography>
                    {step.status === "active" && (
                      <LinearProgress
                        variant="determinate"
                        value={step.progress}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Interface de chargement des ressources */}
        {!currentJob && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Ressources manquantes</AlertTitle>
              Cet appel nécessite un traitement pour être utilisable dans
              l'éditeur de tagging. Veuillez charger les ressources manquantes
              depuis WorkDrive.
            </Alert>

            {/* WorkDrive Explorer */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>📁 Import depuis WorkDrive</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <SimpleWorkdriveExplorer
                  onFilesSelect={handleWorkdriveFilesSelect}
                />
              </AccordionDetails>
            </Accordion>

            {/* Upload manuel */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>📤 Upload Manuel</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Upload audio */}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Choisir un fichier audio
                    <input
                      type="file"
                      hidden
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAudioFile(e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                  {audioFile && (
                    <Typography variant="caption" color="text.secondary">
                      Fichier sélectionné: {audioFile.name}
                    </Typography>
                  )}

                  {/* Transcription */}
                  <TextField
                    label="Transcription JSON"
                    multiline
                    rows={6}
                    fullWidth
                    value={transcriptionText}
                    onChange={(e) => setTranscriptionText(e.target.value)}
                    placeholder="Collez ici le JSON de transcription..."
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Description */}
            <TextField
              label="Description du traitement"
              multiline
              rows={2}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Annuler
        </Button>
        {!currentJob && (
          <Button
            onClick={handleProcessCall}
            variant="contained"
            color="primary"
            disabled={!audioFile && !transcriptionText}
            startIcon={<Build />}
          >
            Traiter l'Appel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
