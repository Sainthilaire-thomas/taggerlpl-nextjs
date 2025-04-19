"use client";

import { useState, FC } from "react";
import { useZoho } from "@/context/ZohoContext";
import AuthButton from "./AuthButton";
import FolderTreeView from "./FolderTreeView";
import { fetchWorkDriveTree } from "./utils/fetchWorkDriveTree";
import {
  Modal,
  Box,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";

// Types
interface ZohoFile {
  originalId: string | undefined; // Make originalId optional to match FileNode
  name: string;
  [key: string]: any;
}

interface AudioListProps {
  onFileSelect: (file: ZohoFile, type: string) => void;
}

const AudioList: FC<AudioListProps> = ({ onFileSelect }) => {
  const { accessToken } = useZoho();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [lastFetchDate, setLastFetchDate] = useState<string>(
    localStorage.getItem("lastFetchDate") || "Jamais"
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [isAccessTokenExpired, setIsAccessTokenExpired] =
    useState<boolean>(false);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  // Fonction pour rafraîchir l'arborescence
  const handleFetchTree = async (): Promise<void> => {
    setLoading(true);
    if (!accessToken) {
      console.warn("AccessToken manquant. Veuillez vous authentifier.");
      setIsAccessTokenExpired(true);
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Démarrage de la récupération de l'arborescence...");
      const rootFolderId = "ly5m40e0e2d4ae7604a1fa0f5d42905cb94c9";
      await fetchWorkDriveTree(rootFolderId, accessToken);

      const currentDate = new Date().toLocaleString();
      setLastFetchDate(currentDate);

      // Vérifiez si localStorage est disponible (côté client uniquement)
      if (typeof window !== "undefined") {
        localStorage.setItem("lastFetchDate", currentDate);
      }

      console.log("✅ Arborescence mise à jour !");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "❌ Erreur lors de la récupération de l'arborescence :",
        errorMessage
      );
      setIsAccessTokenExpired(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Fichiers Audio</h2>

      {/* Affichage si token expiré */}
      {isAccessTokenExpired && (
        <Typography variant="caption" color="error">
          Le token d'accès a expiré. Veuillez cliquer sur "Authentifiez-vous".
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {/* AuthButton pour renouveler le token */}
        <AuthButton
          onSuccess={() => {
            setIsAccessTokenExpired(false);
            console.log("AccessToken renouvelé !");
          }}
        />

        {/* Bouton pour récupérer l'arborescence complète */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchTree}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <Typography variant="button" sx={{ fontSize: "10px" }}>
              Rafraîchir l'arborescence
            </Typography>
          )}
        </Button>

        <Typography variant="caption" sx={{ fontSize: "10px" }}>
          Dernier rafraîchissement : {lastFetchDate}
        </Typography>

        {/* Bouton pour ouvrir l'arborescence */}
        <Button variant="outlined" color="secondary" onClick={handleOpenModal}>
          <Typography variant="button" sx={{ fontSize: "10px" }}>
            Ouvrir l'arborescence des dossiers
          </Typography>
        </Button>
      </Box>

      {/* Modal pour FolderTreeView */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Arborescence des Dossiers
          </Typography>
          <FolderTreeView
            onFileSelect={(file, type) => {
              // Ensure file has the required properties before passing to onFileSelect
              if (file.originalId) {
                onFileSelect(file as ZohoFile, type as string);
              } else {
                console.warn("File selected without originalId:", file);
              }
            }}
          />
        </Box>
      </Modal>
    </div>
  );
};

export default AudioList;
