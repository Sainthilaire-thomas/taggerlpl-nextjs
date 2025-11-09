// src/components/calls/domain/services/DuplicateService.ts - CORRECTION

import { Call } from "../entities/Call";
import { CallRepository } from "../repositories/CallRepository";
import {
  DuplicateCriteria,
  DuplicateResult,
  CallUpgradeData,
} from "../../shared/types/CommonTypes";
import { BusinessRuleError } from "../../shared/exceptions/DomainExceptions";

export class DuplicateService {
  constructor(private callRepository: CallRepository) {}

  // ✅ CORRECTION: Déplacer la méthode getDuplicateStats ici, dans la classe
  /**
   * Obtient des statistiques sur les doublons dans la base
   */
  async getDuplicateStats(): Promise<DuplicateStats> {
    try {
      const allCalls = await this.callRepository.findAll();

      // Grouper par nom de fichier pour détecter les doublons de nom
      const filenameGroups = new Map<string, Call[]>();
      let incompleteAppels = 0;

      allCalls.forEach((call) => {
        if (call.filename) {
          if (!filenameGroups.has(call.filename)) {
            filenameGroups.set(call.filename, []);
          }
          filenameGroups.get(call.filename)!.push(call);
        }

        // Compter les appels incomplets
        if (!call.hasValidAudio() || !call.hasValidTranscription()) {
          incompleteAppels++;
        }
      });

      // Compter les doublons potentiels
      const potentialDuplicates = Array.from(filenameGroups.values())
        .filter((group) => group.length > 1)
        .reduce((sum, group) => sum + group.length - 1, 0);

      return {
        totalCalls: allCalls.length,
        potentialDuplicates,
        incompleteApps: incompleteAppels,
        duplicateByFilename: potentialDuplicates,
        averageCompleteness:
          allCalls.length > 0
            ? ((allCalls.length - incompleteAppels) / allCalls.length) * 100
            : 0,
      };
    } catch (error) {
      throw new BusinessRuleError(
        `Failed to get duplicate stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Détecte les doublons selon plusieurs stratégies
   */
  async checkForDuplicates(
    criteria: DuplicateCriteria
  ): Promise<DuplicateResult> {
    // Stratégie 1: Recherche par nom de fichier exact (priorité haute)
    if (criteria.filename) {
      const filenameDuplicate = await this.checkFilenameMatch(
        criteria.filename
      );
      if (filenameDuplicate) {
        return {
          isDuplicate: true,
          existingCall: filenameDuplicate,
          matchType: "filename",
          confidence: 1.0,
          analysis: filenameDuplicate.canBeUpgraded({
            // ✅ évite un crash côté serveur si File n'existe pas
            audioFile:
              typeof File !== "undefined" && criteria.filename
                ? new File([], criteria.filename)
                : undefined,
            transcriptionData: criteria.transcriptionText
              ? JSON.parse(criteria.transcriptionText)
              : undefined,
          }),
        };
      }
    }

    // Stratégie 2: Recherche par hash de contenu transcription (priorité moyenne)
    if (criteria.transcriptionText) {
      const contentDuplicate = await this.checkContentMatch(
        criteria.transcriptionText
      );
      if (contentDuplicate) {
        return {
          isDuplicate: true,
          existingCall: contentDuplicate.call,
          matchType: "content",
          confidence: contentDuplicate.confidence,
          analysis: contentDuplicate.call.canBeUpgraded({
            audioFile: criteria.filename
              ? new File([], criteria.filename)
              : undefined,
            transcriptionData: JSON.parse(criteria.transcriptionText),
          }),
        };
      }
    }

    // Stratégie 3: Recherche par description similaire (priorité basse)
    if (criteria.description && criteria.description.length > 20) {
      const descriptionDuplicate = await this.checkDescriptionMatch(
        criteria.description
      );
      if (descriptionDuplicate) {
        return {
          isDuplicate: true,
          existingCall: descriptionDuplicate,
          matchType: "description",
          confidence: 0.7,
          analysis: descriptionDuplicate.canBeUpgraded({
            audioFile: criteria.filename
              ? new File([], criteria.filename)
              : undefined,
            transcriptionData: criteria.transcriptionText
              ? JSON.parse(criteria.transcriptionText)
              : undefined,
          }),
        };
      }
    }

    // Aucun doublon détecté
    return {
      isDuplicate: false,
      confidence: 0,
      analysis: {
        canAddAudio: false,
        canAddTranscription: false,
        hasConflict: false,
        recommendation: "create_new",
      },
    };
  }

  /**
   * Met à niveau un appel existant avec de nouvelles données
   */
  async upgradeExistingCall(
    callId: string,
    upgradeData: CallUpgradeData
  ): Promise<boolean> {
    try {
      const existingCall = await this.callRepository.findById(callId);
      if (!existingCall) {
        return false;
      }

      let updatedCall = existingCall;

      // Ajout de la transcription si manquante et fournie
      if (
        upgradeData.transcriptionData &&
        !existingCall.hasValidTranscription()
      ) {
        const { Transcription } = await import("../entities/Transcription");
        const transcription = Transcription.fromJSON(
          upgradeData.transcriptionData
        );
        updatedCall = updatedCall.withTranscription(transcription);
      }

      // Sauvegarde si des modifications ont été apportées
      if (updatedCall !== existingCall) {
        await this.callRepository.update(updatedCall);
        return true;
      }

      return false;
    } catch (error) {
      throw new BusinessRuleError(
        `Failed to upgrade call ${callId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Génère un nom de fichier unique en cas de doublon
   */
  generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const nameParts = originalFilename.split(".");
    const extension = nameParts.pop() || "";
    const baseName = nameParts.join(".");

    return `${baseName}_${timestamp}.${extension}`;
  }

  /**
   * Formatage d'un message informatif sur le doublon détecté
   */
  formatDuplicateMessage(result: DuplicateResult): string {
    if (!result.isDuplicate || !result.existingCall) {
      return "";
    }

    const existing = result.existingCall;
    const hasAudio = existing.hasValidAudio();
    const hasTranscription = existing.hasValidTranscription();

    let currentState = "";
    if (hasAudio && hasTranscription) {
      currentState = "Audio + Transcription";
    } else if (hasAudio) {
      currentState = "Audio seul";
    } else if (hasTranscription) {
      currentState = "Transcription seule";
    } else {
      currentState = "Vide";
    }

    const matchTypeLabel = {
      filename: "nom de fichier",
      content: "contenu identique",
      description: "description similaire",
    }[result.matchType || "filename"];

    return `Doublon détecté (${matchTypeLabel}, confiance: ${Math.round(
      result.confidence * 100
    )}%)
État actuel: ${currentState}
${
  result.analysis.canAddAudio || result.analysis.canAddTranscription
    ? "Amélioration possible"
    : "Contenu complet"
}`;
  }

  // ===== MÉTHODES PRIVÉES =====

  private async checkFilenameMatch(filename: string): Promise<Call | null> {
    const calls = await this.callRepository.findByFilename(filename);
    return calls.length > 0 ? calls[0] : null;
  }

  private async checkContentMatch(
    transcriptionText: string
  ): Promise<{ call: Call; confidence: number } | null> {
    try {
      const contentHash = this.calculateTranscriptionHash(transcriptionText);
      if (!contentHash) return null;

      const calls = await this.callRepository.findByContentHash(contentHash);
      if (calls.length > 0) {
        return {
          call: calls[0],
          confidence: 0.95,
        };
      }

      return await this.deepContentAnalysis(transcriptionText);
    } catch (error) {
      return null;
    }
  }

  private async checkDescriptionMatch(
    description: string
  ): Promise<Call | null> {
    const calls = await this.callRepository.findByDescriptionPattern(
      description.slice(0, 50)
    );
    return calls.length > 0 ? calls[0] : null;
  }

  private calculateTranscriptionHash(transcriptionText: string): string {
    try {
      const parsed = JSON.parse(transcriptionText);
      if (
        parsed.words &&
        Array.isArray(parsed.words) &&
        parsed.words.length > 0
      ) {
        const firstWord = parsed.words[0]?.text || "";
        const lastWord = parsed.words[parsed.words.length - 1]?.text || "";
        const wordCount = parsed.words.length;

        return `${firstWord}_${lastWord}_${wordCount}`
          .toLowerCase()
          .replace(/\s+/g, "_");
      }
    } catch (error) {
      return transcriptionText.slice(0, 50).replace(/\s+/g, "_").toLowerCase();
    }
    return "";
  }

  private async deepContentAnalysis(
    transcriptionText: string
  ): Promise<{ call: Call; confidence: number } | null> {
    try {
      const newTranscription = JSON.parse(transcriptionText);
      if (!newTranscription.words || !Array.isArray(newTranscription.words)) {
        return null;
      }

      const allCalls = await this.callRepository.findAll();

      for (const call of allCalls) {
        const existingTranscription = call.getTranscription();
        if (!existingTranscription) continue;

        const similarity = this.calculateTranscriptionSimilarity(
          newTranscription.words,
          existingTranscription.words
        );

        if (similarity > 0.85) {
          return {
            call,
            confidence: similarity,
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private calculateTranscriptionSimilarity(
    words1: any[],
    words2: any[]
  ): number {
    if (words1.length === 0 || words2.length === 0) return 0;

    const lengthRatio =
      Math.min(words1.length, words2.length) /
      Math.max(words1.length, words2.length);
    if (lengthRatio < 0.8) return 0;

    const sampleSize = Math.min(10, Math.floor(words1.length / 10));
    let matches = 0;
    let total = 0;

    // Comparer début
    for (
      let i = 0;
      i < Math.min(sampleSize, words1.length, words2.length);
      i++
    ) {
      if (words1[i].text?.toLowerCase() === words2[i].text?.toLowerCase()) {
        matches++;
      }
      total++;
    }

    // Comparer fin
    for (
      let i = 0;
      i < sampleSize && i < words1.length && i < words2.length;
      i++
    ) {
      const idx1 = words1.length - 1 - i;
      const idx2 = words2.length - 1 - i;
      if (
        words1[idx1]?.text?.toLowerCase() === words2[idx2]?.text?.toLowerCase()
      ) {
        matches++;
      }
      total++;
    }

    return total > 0 ? matches / total : 0;
  }
}

// ===== INTERFACES ET TYPES =====

export interface DuplicateStats {
  totalCalls: number;
  potentialDuplicates: number;
  incompleteApps: number;
  duplicateByFilename: number;
  averageCompleteness: number;
}

export interface DuplicateDetectionConfig {
  enableFilenameMatch: boolean;
  enableContentMatch: boolean;
  enableDescriptionMatch: boolean;
  contentSimilarityThreshold: number;
  descriptionMinLength: number;
}

export const DEFAULT_DUPLICATE_CONFIG: DuplicateDetectionConfig = {
  enableFilenameMatch: true,
  enableContentMatch: true,
  enableDescriptionMatch: true,
  contentSimilarityThreshold: 0.85,
  descriptionMinLength: 20,
};
