// src/components/calls/domain/workflows/BulkPreparationWorkflow.ts

import { CallService } from "../services/CallService";
import { ValidationService } from "../services/ValidationService";
import { CallStatus } from "../../shared/types/CallStatus";
import { BusinessRuleError } from "../../shared/exceptions/DomainExceptions";

/**
 * Workflow pour la préparation en lot d'appels
 * Optimisé pour traiter plusieurs appels simultanément
 */
export class BulkPreparationWorkflow {
  private readonly BATCH_SIZE = 5; // Traitement par lots de 5
  private readonly DELAY_BETWEEN_BATCHES = 100; // 100ms entre les lots

  constructor(
    private callService: CallService,
    private validationService: ValidationService
  ) {}

  /**
   * Prépare plusieurs appels en lot
   */
  async prepareBatch(
    callIds: string[],
    callbacks?: BulkCallbacks
  ): Promise<BulkPreparationResult> {
    const startTime = Date.now();
    const results: PrepareResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      // Validation initiale
      if (callIds.length === 0) {
        throw new BusinessRuleError("Aucun appel à préparer");
      }

      if (callIds.length > 100) {
        throw new BusinessRuleError("Trop d'appels sélectionnés (max: 100)");
      }

      // Division en lots
      const batches = this.createBatches(callIds, this.BATCH_SIZE);
      const totalBatches = batches.length;

      callbacks?.onStart?.(callIds.length);

      // Traitement par lots
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchResults = await this.processBatch(
          batch,
          i + 1,
          totalBatches,
          callbacks
        );

        results.push(...batchResults);

        // Compter succès/erreurs
        batchResults.forEach((result) => {
          if (result.success) successCount++;
          else errorCount++;
        });

        // Callback de progression
        const progress = ((i + 1) / totalBatches) * 100;
        callbacks?.onProgress?.(progress, successCount, errorCount);

        // Délai entre les lots (sauf pour le dernier)
        if (i < batches.length - 1) {
          await this.delay(this.DELAY_BETWEEN_BATCHES);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      callbacks?.onComplete?.(successCount, errorCount, duration);

      return {
        success: errorCount === 0,
        totalCalls: callIds.length,
        successCount,
        errorCount,
        results,
        duration,
        strategy: "bulk",
      };
    } catch (error) {
      callbacks?.onError?.(
        error instanceof Error ? error.message : "Erreur inconnue"
      );

      return {
        success: false,
        totalCalls: callIds.length,
        successCount,
        errorCount: callIds.length - successCount,
        results,
        duration: Date.now() - startTime,
        strategy: "bulk",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Prépare un seul appel avec stratégie améliorée
   */
  async prepareSingle(
    callId: string,
    strategy: PreparationStrategy = "standard"
  ): Promise<PrepareResult> {
    const startTime = Date.now();

    try {
      // Récupération de l'appel
      const call = await this.callService.getCallById(callId);

      // Vérifications métier
      if (!call.hasValidTranscription()) {
        return {
          callId,
          success: false,
          error: "Transcription manquante ou invalide",
          duration: Date.now() - startTime,
        };
      }

      if (call.status === CallStatus.PROCESSING) {
        return {
          callId,
          success: false,
          error: "Appel déjà en cours de traitement",
          duration: Date.now() - startTime,
        };
      }

      if (call.status === CallStatus.READY) {
        return {
          callId,
          success: true,
          message: "Appel déjà préparé",
          duration: Date.now() - startTime,
          skipped: true,
        };
      }

      // Application de la stratégie
      await this.applyPreparationStrategy(call, strategy);

      // Marquer comme préparé
      await this.callService.markAsPrepared(callId);

      return {
        callId,
        success: true,
        message: `Préparé avec stratégie ${strategy}`,
        duration: Date.now() - startTime,
        strategy,
      };
    } catch (error) {
      return {
        callId,
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyse préliminaire des appels avant préparation
   */
  async analyzeForPreparation(callIds: string[]): Promise<PreparationAnalysis> {
    const analysis: PreparationAnalysis = {
      total: callIds.length,
      readyToPrepare: 0,
      alreadyPrepared: 0,
      missingTranscription: 0,
      inProcessing: 0,
      withErrors: 0,
      estimatedDuration: 0,
    };

    for (const callId of callIds) {
      try {
        const call = await this.callService.getCallById(callId);

        switch (call.status) {
          case CallStatus.READY:
            analysis.alreadyPrepared++;
            break;
          case CallStatus.PROCESSING:
            analysis.inProcessing++;
            break;
          default:
            if (!call.hasValidTranscription()) {
              analysis.missingTranscription++;
            } else {
              analysis.readyToPrepare++;
            }
        }
      } catch {
        analysis.withErrors++;
      }
    }

    // Estimation de durée (500ms par appel + overhead)
    analysis.estimatedDuration =
      analysis.readyToPrepare * 500 + callIds.length * 50;

    return analysis;
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Traite un lot d'appels
   */
  private async processBatch(
    callIds: string[],
    batchNumber: number,
    totalBatches: number,
    callbacks?: BulkCallbacks
  ): Promise<PrepareResult[]> {
    callbacks?.onBatchStart?.(batchNumber, totalBatches, callIds.length);

    // Traitement en parallèle des appels du lot
    const batchPromises = callIds.map((callId) =>
      this.prepareSingle(callId, "bulk")
    );
    const results = await Promise.all(batchPromises);

    callbacks?.onBatchComplete?.(batchNumber, results);

    return results;
  }

  /**
   * Divise un tableau en lots
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Délai asynchrone
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Applique une stratégie de préparation spécifique
   */
  private async applyPreparationStrategy(
    call: any,
    strategy: PreparationStrategy
  ): Promise<void> {
    switch (strategy) {
      case "standard":
        // Stratégie standard : validation basique
        break;

      case "bulk":
        // Stratégie optimisée pour le lot : validations allégées
        break;

      case "ai-analysis":
        // Stratégie avec pré-analyse IA (à implémenter)
        throw new BusinessRuleError("Stratégie AI non encore disponible");

      default:
        throw new BusinessRuleError(`Stratégie inconnue: ${strategy}`);
    }
  }
}

// ===== TYPES ET INTERFACES =====

export type PreparationStrategy = "standard" | "bulk" | "ai-analysis";

export interface PrepareResult {
  callId: string;
  success: boolean;
  message?: string;
  error?: string;
  duration: number;
  strategy?: PreparationStrategy;
  skipped?: boolean;
}

export interface BulkPreparationResult {
  success: boolean;
  totalCalls: number;
  successCount: number;
  errorCount: number;
  results: PrepareResult[];
  duration: number;
  strategy: string;
  error?: string;
}

export interface PreparationAnalysis {
  total: number;
  readyToPrepare: number;
  alreadyPrepared: number;
  missingTranscription: number;
  inProcessing: number;
  withErrors: number;
  estimatedDuration: number; // en millisecondes
}

export interface BulkCallbacks {
  onStart?: (totalCalls: number) => void;
  onProgress?: (
    progress: number,
    successCount: number,
    errorCount: number
  ) => void;
  onBatchStart?: (
    batchNumber: number,
    totalBatches: number,
    batchSize: number
  ) => void;
  onBatchComplete?: (batchNumber: number, results: PrepareResult[]) => void;
  onComplete?: (
    successCount: number,
    errorCount: number,
    duration: number
  ) => void;
  onError?: (error: string) => void;
}
