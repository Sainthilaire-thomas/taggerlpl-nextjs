// CallsPage.tsx - Intégration complète avec détection doublons
"use client";

import { useState } from "react";
import { Box, Typography, Tabs, Tab, Alert } from "@mui/material";
import CallTableList from "@/components/calls/CallTableList/CallTableList";
import CallPreparation from "@/components/calls/CallPreparation";
import SnackbarManager from "@/components/SnackBarManager";
import SimpleWorkdriveExplorer from "@/components/SimpleWorkdriveExplorer";
import { DuplicateDialog } from "@/components/calls/DuplicateDialog";
import { handleCallSubmission } from "@/components/utils/callApiUtils";
import type { ZohoFile } from "@/components/SimpleWorkdriveExplorer/types";

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

interface SnackbarMessage {
  message: string;
  key: number;
}

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
  const [snackPack, setSnackPack] = useState<SnackbarMessage[]>([]);

  // État pour le dialog des doublons (existant)
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    data?: any;
    newImport?: {
      hasAudio: boolean;
      hasTranscription: boolean;
      filename?: string;
    };
    resolve?: (action: "upgrade" | "create_new" | "cancel") => void;
  }>({
    open: false,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showMessage = (message: string) => {
    setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
  };

  // Gestionnaire de doublons avec dialog (existant)
  const handleDuplicateFound = async (
    duplicateData: any
  ): Promise<"upgrade" | "create_new" | "cancel"> => {
    console.log("🔄 Dialog doublon ouvert avec data:", duplicateData);

    const hasNewAudio = !!duplicateData.newAudioFile;
    const hasNewTranscription = !!(
      duplicateData.newTranscriptionText &&
      duplicateData.newTranscriptionText.length > 0
    );

    return new Promise((resolve) => {
      setDuplicateDialog({
        open: true,
        data: duplicateData,
        newImport: {
          hasAudio: hasNewAudio,
          hasTranscription: hasNewTranscription,
          filename: duplicateData.newAudioFile?.name || "Transcription JSON",
        },
        resolve,
      });
    });
  };

  // Gestionnaire d'action du dialog (existant)
  const handleDialogAction = (action: "upgrade" | "create_new" | "cancel") => {
    console.log("🎯 Action choisie dans le dialog:", action);

    if (duplicateDialog.resolve) {
      duplicateDialog.resolve(action);
    }
    setDuplicateDialog({ open: false });
  };

  // ✅ NOUVEAU: Gestionnaire pour clic sur doublon depuis WorkDrive
  const handleWorkdriveDuplicateClick = (file: ZohoFile, existingCall: any) => {
    console.log("⚠️ Doublon détecté depuis WorkDrive:", {
      file: file.attributes?.name || file.name,
      existingCall: existingCall.filename || existingCall.description,
    });

    // Option 1: Rediriger vers l'onglet approprié pour voir l'appel existant
    setTabValue(2); // Onglet "Liste des appels"
    showMessage(
      `⚠️ Ce fichier (${
        file.attributes?.name || file.name
      }) semble déjà importé comme: ${
        existingCall.filename || existingCall.description
      }`
    );

    // Option 2: Ou ouvrir un dialog d'information
    // Vous pourriez créer un dialog dédié pour cette situation
  };

  // Handler pour l'import avec gestion des doublons (existant)
  const handleWorkdriveFilesSelect = async (
    audioFile: File | null,
    transcriptionText: string = "",
    workdriveFileName?: string
  ): Promise<void> => {
    console.log("🔍 CallsPage - Fichiers reçus:", {
      audioFile: audioFile?.name,
      transcriptionText: transcriptionText
        ? `${transcriptionText.length} caractères`
        : "Vide",
      workdriveFileName,
      hasAudio: !!audioFile,
      hasTranscription: !!transcriptionText,
    });

    try {
      if (!audioFile && !transcriptionText) {
        showMessage("Aucun fichier à importer");
        return;
      }

      // Appeler handleCallSubmission avec callback doublons
      console.log("📥 Appel de handleCallSubmission...");

      await handleCallSubmission({
        audioFile,
        description: generateDescription(
          audioFile,
          transcriptionText,
          workdriveFileName
        ),
        transcriptionText,
        workdriveFileName,
        showMessage,
        onCallUploaded: (callId) => {
          console.log("✅ Appel créé avec ID:", callId);
          showMessage(`Appel importé avec succès (ID: ${callId})`);
        },
        onDuplicateFound: handleDuplicateFound,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        "❌ Erreur lors de l'importation depuis WorkDrive:",
        errorMessage
      );
      showMessage(`Erreur lors de l'importation: ${errorMessage}`);
    }
  };

  // Fonction utilitaire pour générer une description (existante)
  const generateDescription = (
    audioFile: File | null,
    transcriptionText: string,
    workdriveFileName?: string
  ): string => {
    const timestamp = new Date().toLocaleString("fr-FR");
    const parts = [];

    if (audioFile) {
      parts.push(`Audio: ${audioFile.name}`);
    } else if (workdriveFileName) {
      parts.push(`Fichier: ${workdriveFileName}`);
    }

    if (transcriptionText) {
      try {
        const parsed = JSON.parse(transcriptionText);
        const wordCount = parsed.words?.length || 0;
        parts.push(`Transcription (${wordCount} mots)`);
      } catch {
        parts.push("Transcription");
      }
    }

    return `Import WorkDrive [${parts.join(" + ")}] - ${timestamp}`;
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
            label="📥 Import d'appels"
            id="calls-tab-0"
            aria-controls="calls-tabpanel-0"
          />
          <Tab
            label="🔧 Préparation"
            id="calls-tab-2"
            aria-controls="calls-tabpanel-2"
          />
          <Tab
            label="🏷️ Liste des appels"
            id="calls-tab-1"
            aria-controls="calls-tabpanel-1"
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

        {/* ✅ NOUVEAU: Information sur la détection de doublons */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            💡 <strong>Détection de doublons activée :</strong> Les fichiers
            déjà importés seront automatiquement détectés et marqués pour éviter
            les doublons.
          </Typography>
        </Alert>

        {/* ✅ MODIFIÉ: SimpleWorkdriveExplorer avec détection de doublons */}
        <SimpleWorkdriveExplorer
          onFilesSelect={handleWorkdriveFilesSelect}
          enableDuplicateCheck={true} // ✅ Activer la détection
          showDuplicateToggle={true} // ✅ Permettre à l'utilisateur de désactiver
          onDuplicateFound={handleWorkdriveDuplicateClick} // ✅ Gestionnaire custom
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Préparation des appels pour le tagging
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Gérez vos appels importés et préparez-les pour l'analyse.
        </Typography>
        <CallPreparation showMessage={showMessage} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Appels prêts pour le tagging
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Liste des appels préparés et prêts pour l'analyse et le tagging.
        </Typography>
        <CallTableList showMessage={showMessage} />
      </TabPanel>

      {/* Dialog de gestion des doublons (existant) */}
      {duplicateDialog.data && (
        <DuplicateDialog
          open={duplicateDialog.open}
          onClose={() => handleDialogAction("cancel")}
          duplicateData={duplicateDialog.data}
          newImport={
            duplicateDialog.newImport || {
              hasAudio: false,
              hasTranscription: false,
            }
          }
          onAction={handleDialogAction}
        />
      )}

      <SnackbarManager snackPack={snackPack} setSnackPack={setSnackPack} />
    </Box>
  );
}
