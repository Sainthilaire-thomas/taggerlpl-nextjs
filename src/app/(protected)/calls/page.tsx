"use client";

import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import CallTableList from "@/components/calls/CallTableList/CallTableList";
import CallPreparation from "@/components/calls/CallPreparation";
import SnackbarManager from "@/components/SnackBarManager";
import SimpleWorkdriveExplorer from "@/components/SimpleWorkdriveExplorer";

// ✅ Interface pour les props du TabPanel
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

// ✅ Interface pour les messages de snackbar
interface SnackbarMessage {
  message: string;
  key: number;
}

// ✅ Typage explicite des props
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`calls-tabpanel-${index}`}
      aria-labelledby={`calls-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CallsPage() {
  const [tabValue, setTabValue] = useState<number>(0);
  // ✅ Typage correct pour snackPack
  const [snackPack, setSnackPack] = useState<SnackbarMessage[]>([]);

  // ✅ Typage explicite des paramètres
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // ✅ Typage du paramètre message
  const showMessage = (message: string) => {
    setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
  };

  // Handler pour l'import de fichiers depuis WorkDrive
  const handleWorkdriveFilesSelect = async (
    audioFile: File | null,
    transcriptionText: string = ""
  ): Promise<void> => {
    try {
      if (audioFile) {
        // Logique d'import personnalisée si nécessaire
        // Pour l'instant, on affiche juste un message
        showMessage(`Fichiers importés depuis WorkDrive: ${audioFile.name}`);

        // Ici vous pourriez appeler une fonction d'import spécifique
        // comme handleCallSubmission ou une autre fonction utilitaire
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        "Erreur lors de l'importation depuis WorkDrive:",
        errorMessage
      );
      showMessage("Erreur lors de l'importation depuis WorkDrive");
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion des appels
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="calls management tabs"
        >
          <Tab
            label="Import d'appels"
            id="calls-tab-0"
            aria-controls="calls-tabpanel-0"
          />
          <Tab
            label="Liste des appels"
            id="calls-tab-1"
            aria-controls="calls-tabpanel-1"
          />
          <Tab
            label="Préparation"
            id="calls-tab-2"
            aria-controls="calls-tabpanel-2"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Import de nouveaux appels depuis Zoho WorkDrive
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Utilisez l'explorateur ci-dessous pour parcourir votre Zoho WorkDrive
          et importer directement vos fichiers audio et transcriptions.
        </Typography>
        <SimpleWorkdriveExplorer onFilesSelect={handleWorkdriveFilesSelect} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Liste des appels chargés
        </Typography>
        <CallTableList showMessage={showMessage} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Préparation des appels pour le tagging
        </Typography>
        <CallPreparation showMessage={showMessage} />
      </TabPanel>

      <SnackbarManager snackPack={snackPack} setSnackPack={setSnackPack} />
    </Box>
  );
}
