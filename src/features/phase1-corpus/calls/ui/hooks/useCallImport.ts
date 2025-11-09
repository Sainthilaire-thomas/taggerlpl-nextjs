// src/components/calls/ui/hooks/useCallImport.ts

import { useState, useCallback } from "react";
import { createServices } from "../../infrastructure/ServiceFactory";
import { ImportWorkflow } from "../../domain/workflows/ImportWorkflow";
import {
  ImportResult,
  DuplicateDialogData,
  DuplicateAction,
} from "../../shared/types/CommonTypes";

/**
 * Hook UI pour l'import d'appels avec gestion d'état et feedback
 * Abstrait la logique métier des composants UI
 */
export const useCallImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Importe un appel en utilisant le workflow DDD
   */
  const importCall = useCallback(
    async (data: ImportFormData): Promise<ImportResult> => {
      setIsImporting(true);
      setError(null);
      setImportProgress(0);

      try {
        // Création des services via factory
        const services = createServices();

        // Création du workflow
        const workflow = new ImportWorkflow(
          services.callService,
          services.validationService,
          services.duplicateService,
          services.storageService
        );

        // Callbacks pour le feedback UI
        const callbacks = {
          onProgress: (progress: number) => {
            setImportProgress(progress);
          },
          onDuplicateFound: async (
            duplicateData: DuplicateDialogData
          ): Promise<DuplicateAction> => {
            // Cette fonction sera appelée par le workflow si un doublon est détecté
            // Dans un contexte UI réel, cela ouvrirait un dialog
            return "create_new"; // Comportement par défaut
          },
        };

        // Exécution du workflow
        const result = await workflow.execute(
          {
            audioFile: data.audioFile,
            description: data.description,
            transcriptionText: data.transcriptionText,
            workdriveFileName: data.workdriveFileName,
            origin: data.origin || "upload",
          },
          callbacks
        );

        setImportProgress(100);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
          reason: "unknown",
        };
      } finally {
        setIsImporting(false);
        // Reset du progress après un délai
        setTimeout(() => setImportProgress(0), 2000);
      }
    },
    []
  );

  /**
   * Reset de l'état d'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Import depuis WorkDrive avec paramètres spécifiques
   */
  const importFromWorkdrive = useCallback(
    async (workdriveFile: WorkdriveFileData): Promise<ImportResult> => {
      return importCall({
        workdriveFileName: workdriveFile.name,
        description: `Import WorkDrive - ${workdriveFile.name}`,
        transcriptionText: workdriveFile.transcriptionContent,
        origin: "workdrive",
      });
    },
    [importCall]
  );

  /**
   * Import depuis fichier local
   */
  const importFromFile = useCallback(
    async (
      file: File,
      transcriptionText?: string,
      description?: string
    ): Promise<ImportResult> => {
      return importCall({
        audioFile: file,
        transcriptionText,
        description: description || `Import local - ${file.name}`,
        origin: "upload",
      });
    },
    [importCall]
  );

  return {
    // État
    isImporting,
    importProgress,
    error,

    // Actions principales
    importCall,
    importFromWorkdrive,
    importFromFile,

    // Utilitaires
    clearError,

    // Métriques pour debug
    canImport: !isImporting,
  };
};

// Types pour l'interface utilisateur
export interface ImportFormData {
  audioFile?: File;
  transcriptionText?: string;
  description?: string;
  workdriveFileName?: string;
  origin?: string;
}

export interface WorkdriveFileData {
  name: string;
  transcriptionContent?: string;
  audioContent?: File;
}
