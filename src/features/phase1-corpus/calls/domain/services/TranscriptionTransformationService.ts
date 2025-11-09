// src/components/calls/domain/services/TranscriptionTransformationService.ts

import {
  ValidationError,
  BusinessRuleError,
} from "../../shared/exceptions/DomainExceptions";
import { TranscriptionWord } from "../entities/TranscriptionWord";
import supabaseClient from "@/lib/supabaseClient";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TransformationResult {
  success: boolean;
  transcriptId?: string;
  wordsInserted?: number;
  message: string;
  error?: string;
}

/**
 * Service de transformation des transcriptions JSON vers la table word
 *
 * Responsabilités:
 * - Validation de la structure JSON des transcriptions
 * - Transformation du format JSON vers entités TranscriptionWord
 * - Insertion des mots dans la table word via transcript
 * - Validation métier et technique
 */
export class TranscriptionTransformationService {
  constructor(private sb = supabaseClient) {}

  /**
   * Transforme une transcription JSON en entries dans la table word
   * Workflow: JSON → validation → création transcript → insertion words → update call
   */
  async transformJsonToWords(
    callId: string,
    transcriptionJson: any
  ): Promise<TransformationResult> {
    try {
      console.log(`🔄 Transformation JSON → words pour call ${callId}`);

      // 1. Validation de la structure JSON
      const validation = await this.validateTranscriptionStructure(
        transcriptionJson
      );
      if (!validation.isValid) {
        throw new ValidationError(validation.errors);
      }

      // 2. Vérification que l'appel existe et n'est pas déjà préparé
      const { data: call, error: callError } = await this.sb
        .from("call")
        .select("callid, preparedfortranscript")
        .eq("callid", callId)
        .single();

      if (callError || !call) {
        throw new BusinessRuleError(`Appel ${callId} introuvable`);
      }

      if (call.preparedfortranscript) {
        return {
          success: false,
          message: `Appel ${callId} déjà préparé`,
          error: "ALREADY_PREPARED",
        };
      }

      // 3. Créer ou récupérer le transcript
      let transcriptId: string;
      const { data: existingTranscript } = await this.sb
        .from("transcript")
        .select("transcriptid")
        .eq("callid", callId)
        .single();

      if (existingTranscript) {
        transcriptId = existingTranscript.transcriptid;

        // Nettoyer les anciens mots si ils existent
        await this.sb.from("word").delete().eq("transcriptid", transcriptId);
      } else {
        // Créer un nouveau transcript
        const { data: newTranscript, error: transcriptError } = await this.sb
          .from("transcript")
          .insert({ callid: callId })
          .select("transcriptid")
          .single();

        if (transcriptError || !newTranscript) {
          throw new BusinessRuleError(
            `Échec création transcript: ${transcriptError?.message}`
          );
        }

        transcriptId = newTranscript.transcriptid;
      }

      // 4. Transformer et valider chaque mot
      const words = this.parseAndValidateWords(transcriptionJson, transcriptId);

      console.log(
        `📝 Transformation de ${words.length} mots pour transcript ${transcriptId}`
      );

      // 5. Insertion en batch dans la table word
      const { error: insertError } = await this.sb.from("word").insert(words);

      if (insertError) {
        throw new BusinessRuleError(
          `Échec insertion words: ${insertError.message}`
        );
      }

      // 6. Marquer l'appel comme préparé
      const { error: updateError } = await this.sb
        .from("call")
        .update({
          preparedfortranscript: true,
          updated_at: new Date().toISOString(),
        })
        .eq("callid", callId);

      if (updateError) {
        console.warn(`⚠️ Échec mise à jour call ${callId}:`, updateError);
        // Non bloquant - les mots sont déjà insérés
      }

      console.log(
        `✅ Transformation terminée: ${words.length} mots → transcript ${transcriptId}`
      );

      return {
        success: true,
        transcriptId,
        wordsInserted: words.length,
        message: `Transformation réussie: ${words.length} mots traités`,
      };
    } catch (error) {
      console.error(`❌ Erreur transformation ${callId}:`, error);

      return {
        success: false,
        message: "Échec de la transformation",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Valide la structure d'une transcription JSON
   */
  async validateTranscriptionStructure(json: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validation de base
      if (!json || typeof json !== "object") {
        errors.push("Transcription doit être un objet JSON valide");
        return { isValid: false, errors, warnings };
      }

      // Validation du tableau words
      if (!Array.isArray(json.words)) {
        errors.push('Propriété "words" manquante ou invalide');
        return { isValid: false, errors, warnings };
      }

      if (json.words.length === 0) {
        warnings.push("Transcription vide (aucun mot)");
      }

      if (json.words.length > 50000) {
        warnings.push("Transcription très longue (>50000 mots)");
      }

      // Validation d'un échantillon de mots
      const sampleSize = Math.min(json.words.length, 10);
      for (let i = 0; i < sampleSize; i++) {
        const word = json.words[i];
        const wordErrors = this.validateWordStructure(word, i);
        errors.push(...wordErrors);
      }

      // Validation de la cohérence temporelle
      const timelineErrors = this.validateTimeline(json.words);
      errors.push(...timelineErrors);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (parseError) {
      return {
        isValid: false,
        errors: [
          `Erreur parsing JSON: ${
            parseError instanceof Error ? parseError.message : "Erreur inconnue"
          }`,
        ],
        warnings,
      };
    }
  }

  /**
   * Parse et valide les mots de la transcription JSON
   */
  /**
   * Parse et valide les mots de la transcription JSON
   * ✅ CORRIGÉ: Utilise uniquement les colonnes existantes dans la table word
   */
  private parseAndValidateWords(json: any, transcriptId: string): any[] {
    return json.words.map((wordData: any, index: number) => {
      // Normalisation des propriétés (compatibilité multiple formats)
      const text = wordData.text || wordData.word || `[mot_${index}]`;
      const startTime = Number(wordData.startTime || wordData.start_time || 0);
      const endTime = Number(
        wordData.endTime || wordData.end_time || startTime + 0.1
      );

      // ✅ CORRECTION: Utiliser 'turn' depuis les données (speaker sera dérivé côté UI)
      const turn = wordData.turn || wordData.speaker || "unknown";
      const type = wordData.type || null;

      // ✅ CORRECTION: Gestion robuste des timestamps invalides
      let cleanStartTime = Math.max(0, startTime);
      let cleanEndTime = Math.max(startTime + 0.1, endTime);

      // Si endTime <= startTime, corriger automatiquement
      if (cleanEndTime <= cleanStartTime) {
        cleanEndTime = cleanStartTime + 0.1;
        console.warn(
          `⚠️ Mot ${index}: endTime corrigé (${endTime} -> ${cleanEndTime})`
        );
      }

      // Validation simple mais tolérante
      const isValid =
        text &&
        typeof cleanStartTime === "number" &&
        typeof cleanEndTime === "number";

      if (!isValid) {
        console.warn(`⚠️ Mot invalide à l'index ${index}:`, {
          text,
          startTime: cleanStartTime,
          endTime: cleanEndTime,
          turn,
        });
      }

      // Conversion au format base de données (colonnes exactes de la table)
      return {
        transcriptid: transcriptId,
        text: text,
        startTime: cleanStartTime,
        endTime: cleanEndTime,
        turn: turn,
        type: type,
      };
    });
  }

  /**
   * Valide la structure d'un mot individuel
   */
  private validateWordStructure(word: any, index: number): string[] {
    const errors: string[] = [];

    // Validation du texte (requis)
    if (!word.text && !word.word) {
      errors.push(`Mot ${index}: texte manquant`);
    }

    // Validation des timestamps (plus tolérante)
    if (typeof word.startTime !== "number") {
      errors.push(`Mot ${index}: startTime doit être un nombre`);
    } else if (word.startTime < 0) {
      // Juste un warning, pas une erreur bloquante
      console.warn(`⚠️ Mot ${index}: startTime négatif (${word.startTime})`);
    }

    if (typeof word.endTime !== "number") {
      errors.push(`Mot ${index}: endTime doit être un nombre`);
    }
    // ✅ SUPPRIMÉ la validation stricte endTime > startTime
    // La correction se fait maintenant dans parseAndValidateWords

    // Validation du turn (optionnel mais recommandé)
    if (!word.turn && !word.speaker) {
      console.warn(
        `⚠️ Mot ${index}: aucun locuteur défini (turn ou speaker manquant)`
      );
    }

    return errors;
  }

  /**
   * Valide la cohérence temporelle de la transcription
   */
  private validateTimeline(words: any[]): string[] {
    const errors: string[] = [];

    if (words.length < 2) return errors;

    // Vérifier l'ordre temporel
    for (let i = 1; i < Math.min(words.length, 100); i++) {
      const prevWord = words[i - 1];
      const currentWord = words[i];

      if (currentWord.startTime < prevWord.startTime) {
        errors.push(`Désordre temporel: mot ${i} commence avant mot ${i - 1}`);
      }
    }

    return errors;
  }

  /**
   * Statistiques de transformation pour debug
   */
  async getTransformationStats(callId: string): Promise<any> {
    try {
      // Stats transcript
      const { data: transcript } = await this.sb
        .from("transcript")
        .select("transcriptid")
        .eq("callid", callId)
        .single();

      if (!transcript) {
        return { callId, hasTranscript: false };
      }

      // Stats words
      const { count: wordCount } = await this.sb
        .from("word")
        .select("*", { count: "exact", head: true })
        .eq("transcriptid", transcript.transcriptid);

      // Stats par speaker
      const { data: speakerStats } = await this.sb
        .from("word")
        .select("speaker")
        .eq("transcriptid", transcript.transcriptid);

      const speakers =
        speakerStats?.reduce((acc, row) => {
          const speaker = row.speaker || "unknown";
          acc[speaker] = (acc[speaker] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      return {
        callId,
        hasTranscript: true,
        transcriptId: transcript.transcriptid,
        wordCount: wordCount || 0,
        speakers,
        speakerCount: Object.keys(speakers).length,
      };
    } catch (error) {
      return {
        callId,
        error: error instanceof Error ? error.message : "Erreur stats",
      };
    }
  }
}
