// src/components/utils/callApiUtils.tsx - VERSION DDD FINALE

import { createServices } from "@/features/phase1-corpus/calls/infrastructure/ServiceFactory";
import { ImportWorkflow } from "@/features/phase1-corpus/calls/domain/workflows/ImportWorkflow";
import { BulkPreparationWorkflow } from "@/features/phase1-corpus/calls/domain/workflows/BulkPreparationWorkflow";
import {
  ImportResult,
  DuplicateDialogData,
  DuplicateAction,
  PreparationResult,
  BulkPreparationResult,
} from "@/features/phase1-corpus/calls/shared/types/CommonTypes";

// ===== TYPES LEGACY (pour compatibilité) =====
interface HandleCallSubmissionOptions {
  audioFile?: File | null;
  description?: string;
  transcriptionText?: string;
  workdriveFileName?: string;
  showMessage: (message: string) => void;
  onCallUploaded?: (callId: string) => void;
  onDuplicateFound?: (
    duplicateData: DuplicateDialogData
  ) => Promise<DuplicateAction>;
}

// ===== FONCTIONS PRINCIPALES (Architecture DDD) =====

/**
 * Import d'appel principal - VERSION DDD
 * Utilise l'ImportWorkflow pour orchestrer l'import
 */
export const handleCallSubmission = async (
  options: HandleCallSubmissionOptions
): Promise<void> => {
  try {
    // Création des services via factory
    const services = createServices();

    // Création du workflow d'import
    const workflow = new ImportWorkflow(
      services.callService,
      services.validationService,
      services.duplicateService,
      services.storageService
    );

    // Préparation des données d'import
    const importData = {
      audioFile: options.audioFile,
      description: options.description,
      transcriptionText: options.transcriptionText,
      workdriveFileName: options.workdriveFileName,
      origin: options.audioFile ? "upload" : "workdrive",
    };

    // Callbacks pour l'UI
    const callbacks = {
      onDuplicateFound: options.onDuplicateFound,
      onProgress: (progress: number) => {
        // Optionnel : feedback de progression
        console.log(`Progression import: ${progress}%`);
      },
      showMessage: options.showMessage,
    };

    // Exécution du workflow
    const result = await workflow.execute(importData, callbacks);

    if (result.success) {
      options.showMessage(result.message || "Import réussi !");
      options.onCallUploaded?.(result.callId!);
    } else {
      if (result.reason === "cancelled") {
        options.showMessage("Import annulé par l'utilisateur");
        return;
      }

      throw new Error(result.error || "Erreur d'import");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    options.showMessage(`Erreur: ${errorMessage}`);
    console.error("Erreur dans handleCallSubmission:", error);
    throw error;
  }
};

/**
 * Préparation en lot d'appels - NOUVELLE FONCTIONNALITÉ
 */
export const bulkPrepareCalls = async (
  callIds: string[],
  options?: {
    onProgress?: (progress: number, success: number, errors: number) => void;
    onComplete?: (result: BulkPreparationResult) => void;
    showMessage?: (message: string) => void;
  }
): Promise<BulkPreparationResult> => {
  try {
    const services = createServices();

    const workflow = new BulkPreparationWorkflow(
      services.callService,
      services.validationService
    );

    const result = await workflow.prepareBatch(callIds, {
      onProgress: options?.onProgress,
      onComplete: (success, errors, duration) => {
        const message = `Préparation terminée: ${success} succès, ${errors} erreurs (${duration}ms)`;
        options?.showMessage?.(message);

        options?.onComplete?.({
          success: errors === 0,
          totalCalls: callIds.length,
          successCount: success,
          errorCount: errors,
          results: [],
          duration,
          strategy: "bulk",
        });
      },
      onError: (error) => {
        options?.showMessage?.(`Erreur: ${error}`);
      },
    });

    // Conversion des résultats pour compatibilité de types
    const convertedResult: BulkPreparationResult = {
      success: result.success,
      totalCalls: result.totalCalls,
      successCount: result.successCount,
      errorCount: result.errorCount,
      duration: result.duration,
      strategy: result.strategy,
      results: result.results.map((r) => ({
        success: r.success,
        callId: r.callId,
        strategy: r.strategy || "bulk", // Garantit que strategy n'est jamais undefined
        message: r.message || "",
        error: r.error,
        duration: r.duration,
        skipped: r.skipped,
      })),
      error: result.error,
    };

    return convertedResult;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    options?.showMessage?.(`Erreur de préparation en lot: ${errorMessage}`);
    throw error;
  }
};

/**
 * Mise à jour d'origine d'appel - VERSION DDD
 */
export const updateCallOrigin = async (
  callId: string,
  newOrigin: string,
  showMessage?: (message: string) => void
): Promise<boolean> => {
  try {
    const services = createServices();
    await services.callService.updateCallOrigin(callId, newOrigin);

    showMessage?.(`Origine mise à jour: ${newOrigin}`);
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    showMessage?.(`Erreur: ${errorMessage}`);
    return false;
  }
};

/**
 * Suppression d'appel - VERSION DDD
 */
export const deleteCall = async (
  callId: string,
  showMessage?: (message: string) => void
): Promise<boolean> => {
  try {
    const services = createServices();
    await services.callService.deleteCall(callId);

    showMessage?.("Appel supprimé avec succès");
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    showMessage?.(`Erreur de suppression: ${errorMessage}`);
    return false;
  }
};

/**
 * Génération d'URL signée - VERSION DDD
 */
export const createSignedUrl = async (
  filePath: string,
  expiration: number = 1200
): Promise<string> => {
  try {
    const services = createServices();
    return await services.storageService.generateSignedUrl(
      filePath,
      expiration
    );
  } catch (error) {
    console.error("Erreur génération URL signée:", error);
    throw new Error("Impossible de générer l'URL signée");
  }
};

/**
 * Validation de transcription JSON - VERSION DDD
 */
export const validateTranscription = (jsonText: string) => {
  try {
    const services = createServices();

    const result = services.validationService.validateCallData({
      transcriptionText: jsonText,
    });

    return {
      isValid: result.isValid,
      error: result.errors.join(", ") || undefined,
      data: result.isValid ? JSON.parse(jsonText) : undefined,
      warnings: result.warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Erreur de validation",
      warnings: [],
    };
  }
};

/**
 * Analyse des doublons pour un fichier
 */
export const analyzeDuplicates = async (criteria: {
  filename?: string;
  description?: string;
  transcriptionText?: string;
}) => {
  try {
    const services = createServices();
    return await services.duplicateService.checkForDuplicates(criteria);
  } catch (error) {
    console.error("Erreur vérification doublons:", error);
    return {
      isDuplicate: false,
      confidence: 0,
      analysis: {
        canAddAudio: false,
        canAddTranscription: false,
        hasConflict: false,
        recommendation: "create_new" as const,
      },
    };
  }
};

/**
 * Statistiques des doublons dans la base
 */
export const getDuplicatesStatistics = async () => {
  try {
    const services = createServices();
    return await services.duplicateService.getDuplicateStats();
  } catch (error) {
    console.error("Erreur stats doublons:", error);
    return {
      totalCalls: 0,
      potentialDuplicates: 0,
      incompleteApps: 0,
      duplicateByFilename: 0,
      averageCompleteness: 0,
    };
  }
};

/**
 * Vérification de l'existence d'un fichier
 */
export const verifyFileExists = async (filePath: string): Promise<boolean> => {
  try {
    const services = createServices();
    return await services.storageService.fileExists(filePath);
  } catch (error) {
    console.error("Erreur vérification fichier:", error);
    return false;
  }
};


// ===== UPLOAD AUDIO =====
export const uploadAudio = async (file: File): Promise<string> => {
  const { CallsServiceFactory } = await import(
    "@/features/phase1-corpus/calls/infrastructure/ServiceFactory"
  );
  const factory = CallsServiceFactory.getInstance();
  const storageService = factory.getStorageService();
  const audioFile = await storageService.uploadAudio(file);
  return audioFile.path;
};

// ===== EXPORTS POUR COMPATIBILITÉ LEGACY =====

// Export par défaut pour compatibilité
export default handleCallSubmission;

// Alias pour compatibilité avec les anciens noms
export const updateCallOrigine = updateCallOrigin;
export const removeCallUpload = deleteCall;
export const generateSignedUrl = createSignedUrl;
export const validateTranscriptionJSON = validateTranscription;
export const checkForDuplicates = analyzeDuplicates;
export const getDuplicateStats = getDuplicatesStatistics;
export const checkFileExists = verifyFileExists;
export const prepareBulkCalls = bulkPrepareCalls;

// ===== CONSTANTES =====

export const CALL_API_CONFIG = {
  MAX_FILE_SIZE_MB: 100,
  ALLOWED_FORMATS: ["mp3", "wav", "m4a", "aac", "ogg"],
  DEFAULT_SIGNED_URL_EXPIRATION: 1200, // 20 minutes
  BULK_BATCH_SIZE: 5,
  MAX_BULK_OPERATIONS: 100,
} as const;
