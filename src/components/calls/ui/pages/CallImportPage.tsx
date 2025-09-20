// src/components/calls/ui/pages/CallImportPage.tsx

import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Snackbar,
  Fade,
  useTheme,
} from "@mui/material";
import { useCallImport, ImportFormData } from "../hooks/useCallImport";
import { ImportForm } from "../components/ImportForm";
import { ImportProgress } from "../components/ImportProgress";
import { ImportSuccessDialog } from "../components/ImportSuccessDialog";
import { DuplicateResolutionDialog } from "../components/DuplicateResolutionDialog";
import { DuplicateAction } from "../../shared/types/CommonTypes";
import { CallsConfig } from "../../shared/config/CallsConfig";

/**
 * Page d'import d'appels avec architecture DDD
 * Interface utilisateur pure qui utilise les hooks métier
 */
export const CallImportPage: React.FC = () => {
  const theme = useTheme();
  const {
    isImporting,
    importProgress,
    error,
    importCall,
    importFromWorkdrive,
    importFromFile,
    clearError,
  } = useCallImport();

  // État local UI
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastImportedCallId, setLastImportedCallId] = useState<string | null>(
    null
  );
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  /**
   * Gestionnaire principal d'import
   */
  const handleImport = useCallback(
    async (data: ImportFormData) => {
      try {
        const result = await importCall(data);

        if (result.success) {
          setLastImportedCallId(result.callId);
          setShowSuccess(true);
        }
      } catch (error) {
        // L'erreur est déjà gérée par le hook
        console.error("Erreur lors de l'import:", error);
      }
    },
    [importCall]
  );

  /**
   * Import depuis fichier local
   */
  const handleFileImport = useCallback(
    async (file: File, transcriptionText?: string, description?: string) => {
      try {
        const result = await importFromFile(
          file,
          transcriptionText,
          description
        );

        if (result.success) {
          setLastImportedCallId(result.callId);
          setShowSuccess(true);
        }
      } catch (error) {
        console.error("Erreur lors de l'import fichier:", error);
      }
    },
    [importFromFile]
  );

  /**
   * Fermeture du snackbar de succès
   */
  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setLastImportedCallId(null);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(29, 35, 42, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(240, 242, 247, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)",
        p: { xs: 2, md: 3 },
      }}
    >
      <Box maxWidth="lg" mx="auto">
        {/* En-tête */}
        <Box mb={4}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              textAlign: "center",
            }}
          >
            Import d'Appels
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            textAlign="center"
          >
            Importez vos appels depuis WorkDrive ou votre disque dur
          </Typography>
        </Box>

        {/* Barre de progression globale */}
        <Fade in={isImporting}>
          <Box mb={3}>
            <Card elevation={2}>
              <CardContent>
                <ImportProgress
                  progress={importProgress}
                  isActive={isImporting}
                />
              </CardContent>
            </Card>
          </Box>
        </Fade>

        {/* Alerte d'erreur */}
        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Erreur d'import :</strong> {error}
            </Typography>
          </Alert>
        )}

        {/* Configuration système */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Formats supportés :</strong>{" "}
            {CallsConfig.storage.allowedFormats.join(", ")}
            &nbsp;•&nbsp;
            <strong>Taille max :</strong> {CallsConfig.storage.maxFileSizeMB}MB
            &nbsp;•&nbsp;
            <strong>Transcription :</strong> JSON obligatoire pour la validation
          </Typography>
        </Alert>

        {/* Formulaire d'import principal */}
        <Card
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <ImportForm
              onImport={handleImport}
              onFileImport={handleFileImport}
              disabled={isImporting}
              maxFileSize={CallsConfig.storage.maxFileSizeMB}
              allowedFormats={CallsConfig.storage.allowedFormats}
            />
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <Box mt={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Fonctionnalités avancées
              </Typography>

              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>Détection intelligente de doublons</strong> : Évite
                  les imports en double
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>Validation JSON stricte</strong> : Vérification de la
                  structure des transcriptions
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>URLs signées automatiques</strong> : Accès sécurisé
                  aux fichiers audio
                </Typography>
                <Typography component="li" variant="body2">
                  <strong>Support WorkDrive complet</strong> : Import direct
                  depuis Zoho
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Dialog de succès */}
      <ImportSuccessDialog
        open={showSuccess}
        onClose={handleCloseSuccess}
        callId={lastImportedCallId}
      />

      {/* Dialog de résolution des doublons */}
      <DuplicateResolutionDialog
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        onResolve={(action: DuplicateAction) => {
          setShowDuplicateDialog(false);
          // La résolution sera gérée par le workflow
        }}
      />

      {/* Snackbar de notification */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" variant="filled">
          Import réussi ! L'appel est maintenant disponible.
        </Alert>
      </Snackbar>
    </Box>
  );
};
