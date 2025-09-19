// src/components/calls/domain/services/ValidationService.ts

import {
  ValidationResult,
  CreateCallData,
} from "../../shared/types/CommonTypes";
import { ValidationError } from "../../shared/exceptions/DomainExceptions";

/**
 * Service de validation des données du domaine Calls
 * Centralise toute la logique de validation métier
 */
export class ValidationService {
  /**
   * Valide les données de création d'un appel
   */
  validateCallData(data: CreateCallData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Règle métier : Un appel doit avoir au moins audio OU transcription
    if (!data.audioFile && !data.transcriptionData && !data.transcriptionText) {
      errors.push(
        "Un appel doit avoir au moins un fichier audio ou une transcription"
      );
    }

    // Validation du fichier audio si présent
    if (data.audioFile) {
      const audioValidation = this.validateAudioFile(data.audioFile);
      errors.push(...audioValidation.errors);
      warnings.push(...audioValidation.warnings);
    }

    // Validation de la transcription si présente
    if (data.transcriptionData) {
      const transcriptionValidation = this.validateTranscriptionData(
        data.transcriptionData
      );
      errors.push(...transcriptionValidation.errors);
      warnings.push(...transcriptionValidation.warnings);
    } else if (data.transcriptionText) {
      const transcriptionValidation = this.validateTranscriptionJSON(
        data.transcriptionText
      );
      errors.push(...transcriptionValidation.errors);
      warnings.push(...transcriptionValidation.warnings);
    }

    // Validation de la description
    if (data.description && data.description.length > 1000) {
      warnings.push("Description très longue (>1000 caractères)");
    }

    // Validation du nom de fichier
    if (data.filename && !this.isValidFilename(data.filename)) {
      errors.push("Nom de fichier invalide");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valide un fichier audio
   */
  private validateAudioFile(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Règles métier pour les fichiers audio
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      "audio/mp3",
      "audio/wav",
      "audio/m4a",
      "audio/aac",
      "audio/ogg",
    ];

    if (file.size === 0) {
      errors.push("Le fichier audio est vide");
    } else if (file.size > maxSize) {
      errors.push(
        `Fichier audio trop volumineux: ${Math.round(
          file.size / 1024 / 1024
        )}MB (max: 100MB)`
      );
    } else if (file.size > 50 * 1024 * 1024) {
      warnings.push(
        "Fichier audio volumineux, le téléchargement peut être long"
      );
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `Format audio non supporté: ${
          file.type
        }. Formats acceptés: ${allowedTypes.join(", ")}`
      );
    }

    if (!file.name || file.name.trim().length === 0) {
      errors.push("Le fichier audio doit avoir un nom");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valide une transcription au format JSON string
   */
  private validateTranscriptionJSON(jsonText: string): ValidationResult {
    try {
      const data = JSON.parse(jsonText);
      return this.validateTranscriptionData(data);
    } catch (parseError) {
      return {
        isValid: false,
        errors: [
          `JSON de transcription invalide: ${
            parseError instanceof Error
              ? parseError.message
              : "Erreur de parsing"
          }`,
        ],
        warnings: [],
      };
    }
  }

  /**
   * Valide les données de transcription
   */
  private validateTranscriptionData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== "object") {
      errors.push("Les données de transcription doivent être un objet");
      return { isValid: false, errors, warnings };
    }

    if (!Array.isArray(data.words)) {
      errors.push('La transcription doit contenir un tableau "words"');
      return { isValid: false, errors, warnings };
    }

    if (data.words.length === 0) {
      warnings.push("La transcription ne contient aucun mot");
    } else if (data.words.length > 50000) {
      warnings.push("Transcription très longue (>50000 mots)");
    }

    // Validation des mots individuels (échantillon)
    const sampleSize = Math.min(data.words.length, 10);
    for (let i = 0; i < sampleSize; i++) {
      const word = data.words[i];
      const wordErrors = this.validateTranscriptionWord(word, i);
      errors.push(...wordErrors);
    }

    // Vérification de la cohérence temporelle
    const timelineErrors = this.validateTranscriptionTimeline(data.words);
    errors.push(...timelineErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valide un mot de transcription individuel
   */
  private validateTranscriptionWord(word: any, index: number): string[] {
    const errors: string[] = [];

    if (!word.text && !word.word) {
      errors.push(`Mot à l'index ${index}: texte manquant`);
    }

    if (typeof word.startTime !== "number" || word.startTime < 0) {
      errors.push(`Mot à l'index ${index}: startTime invalide`);
    }

    if (
      typeof word.endTime !== "number" ||
      word.endTime <= (word.startTime || 0)
    ) {
      errors.push(`Mot à l'index ${index}: endTime invalide`);
    }

    if (!word.speaker) {
      errors.push(`Mot à l'index ${index}: speaker manquant`);
    }

    return errors;
  }

  /**
   * Valide la cohérence temporelle de la transcription
   */
  private validateTranscriptionTimeline(words: any[]): string[] {
    const errors: string[] = [];

    for (let i = 1; i < Math.min(words.length, 100); i++) {
      const prevWord = words[i - 1];
      const currentWord = words[i];

      if (currentWord.startTime < prevWord.endTime) {
        // Chevauchement détecté, mais on ne l'interdit pas (peut être normal)
        // errors.push(`Chevauchement temporel détecté entre les mots ${i-1} et ${i}`);
      }

      if (currentWord.startTime < prevWord.startTime) {
        errors.push(
          `Désordre temporel détecté: le mot ${i} commence avant le mot ${
            i - 1
          }`
        );
      }
    }

    return errors;
  }

  /**
   * Valide un nom de fichier
   */
  private isValidFilename(filename: string): boolean {
    // Caractères interdits dans les noms de fichier
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;

    return (
      filename.length > 0 &&
      filename.length <= 255 &&
      !invalidChars.test(filename) &&
      !filename.startsWith(".") &&
      !filename.endsWith(".")
    );
  }

  /**
   * Valide une URL signée
   */
  validateSignedUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.protocol === "https:" && parsedUrl.searchParams.has("token")
      );
    } catch {
      return false;
    }
  }
}
