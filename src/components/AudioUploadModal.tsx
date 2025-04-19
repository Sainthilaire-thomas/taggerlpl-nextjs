import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";

// Define props interface
interface AudioUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
  open,
  onClose,
  onUpload,
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUpload = async (): Promise<void> => {
    console.log("🔍 AudioUploadModal - Début de handleUpload");
    if (!audioFile) {
      console.error("❌ AudioUploadModal - Aucun fichier audio sélectionné");
      return;
    }

    console.log("📂 AudioUploadModal - audioFile sélectionné :", audioFile);

    setIsUploading(true);
    try {
      await onUpload(audioFile);
      console.log("✅ AudioUploadModal - Téléchargement réussi");
    } catch (error) {
      console.error(
        "❌ AudioUploadModal - Erreur lors du téléchargement :",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsUploading(false);
      onClose();
    }
  };

  const handleModalClose = (): void => {
    onClose(); // Appelle la fonction `onClose` transmise via les props

    // Déplacez le focus vers un bouton visible après la fermeture
    const focusButton = document.getElementById("focusButtonAfterModal");
    if (focusButton) focusButton.focus();
  };

  return (
    <Dialog open={open} onClose={handleModalClose}>
      <DialogTitle>Associer un fichier audio</DialogTitle>
      <DialogContent>
        <TextField
          type="file"
          inputProps={{ accept: "audio/*" }}
          onChange={handleFileChange}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleModalClose} disabled={isUploading}>
          Annuler
        </Button>
        <Button onClick={handleUpload} disabled={!audioFile || isUploading}>
          {isUploading ? <CircularProgress size={24} /> : "Charger"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AudioUploadModal;
