"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  LinearProgress,
  Box,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import { TVValidationResult } from "../../types";

interface FineTuningDialogProps {
  open: boolean;
  onClose: () => void;
  results: TVValidationResult[];
  initialData?: string;
}

export const FineTuningDialog: React.FC<FineTuningDialogProps> = ({
  open,
  onClose,
  results,
  initialData = "",
}) => {
  const [fineTuningData, setFineTuningData] = useState(initialData);
  const [isExtracting, setIsExtracting] = useState(false);

  // Mettre à jour les données quand initialData change
  useEffect(() => {
    if (initialData) {
      setFineTuningData(initialData);
    }
  }, [initialData]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fineTuningData);
      alert("Données copiées dans le presse-papiers !");
    } catch (error) {
      console.error("Erreur copie:", error);
    }
  };

  const downloadData = () => {
    const blob = new Blob([fineTuningData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fine-tuning-data-${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6">Données pour Fine-tuning</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="info">
            <Typography variant="body2">
              Ces données sont prêtes à être utilisées avec Claude pour analyser
              les erreurs et améliorer l'algorithme. Elles incluent le contexte,
              les annotations d'experts et les métriques de performance.
            </Typography>
          </Alert>

          {isExtracting && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Extraction en cours...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {fineTuningData && (
            <TextField
              multiline
              fullWidth
              rows={20}
              value={fineTuningData}
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  "& .MuiInputBase-input": {
                    lineHeight: 1.4,
                  },
                },
              }}
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {fineTuningData && (
          <>
            <Button
              startIcon={<ContentCopyIcon />}
              onClick={copyToClipboard}
              variant="outlined"
            >
              Copier
            </Button>

            <Button
              startIcon={<DownloadIcon />}
              onClick={downloadData}
              variant="outlined"
            >
              Télécharger
            </Button>
          </>
        )}

        <Button onClick={onClose} variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
