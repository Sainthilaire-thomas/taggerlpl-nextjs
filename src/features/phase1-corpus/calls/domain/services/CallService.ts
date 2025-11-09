// src/components/calls/domain/services/CallService.ts

import { Call } from "../entities/Call";
import { AudioFile } from "../entities/AudioFile";
import { Transcription } from "../entities/Transcription";
import { CallRepository } from "../repositories/CallRepository";
import { CallStatus } from "../../shared/types/CallStatus";
import { CreateCallData } from "../../shared/types/CommonTypes";
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
} from "../../shared/exceptions/DomainExceptions";
import { ValidationService } from "./ValidationService";

/**
 * Service métier principal pour la gestion des appels
 * Contient toute la logique métier liée aux appels
 */
export class CallService {
  constructor(
    private callRepository: CallRepository,
    private validationService: ValidationService
  ) {}

  /**
   * Crée un nouvel appel avec validation complète
   */
  async createCall(data: CreateCallData): Promise<Call> {
    // Validation des données
    const validationResult = this.validationService.validateCallData(data);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    // Création des entités
    let audioFile: AudioFile | undefined;
    if (data.audioFile) {
      audioFile = AudioFile.fromFile(
        data.audioFile,
        data.audioUrl || "",
        data.audioUrl
      );
    }

    let transcription: Transcription | undefined;
    if (data.transcriptionData) {
      transcription = Transcription.fromJSON(data.transcriptionData);
    } else if (data.transcriptionText) {
      const transcriptionData = JSON.parse(data.transcriptionText);
      transcription = Transcription.fromJSON(transcriptionData);
    }

    // Génération d'un ID unique
    const callId = this.generateUniqueCallId();

    // Création de l'appel
    const call = new Call(
      callId,
      data.filename || data.workdriveFileName,
      data.description ||
        this.generateAutoDescription(audioFile, transcription),
      CallStatus.DRAFT,
      data.origin,
      audioFile,
      transcription
    );

    // Sauvegarde
    await this.callRepository.save(call);

    return call;
  }

  /**
   * Met à jour l'origine d'un appel
   */
  async updateCallOrigin(callId: string, origin: string): Promise<void> {
    const call = await this.getCallById(callId);
    const updatedCall = call.withOrigin(origin);
    await this.callRepository.update(updatedCall);
  }

  /**
   * Met à jour le statut d'un appel
   */
  async updateCallStatus(callId: string, status: CallStatus): Promise<void> {
    const call = await this.getCallById(callId);

    // Vérification des règles de transition de statut
    if (!this.isValidStatusTransition(call.status, status)) {
      throw new BusinessRuleError(
        `Transition de statut invalide: ${call.status} → ${status}`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const updatedCall = call.withStatus(status);
    await this.callRepository.update(updatedCall);
  }

  /**
   * Supprime un appel
   */
  async deleteCall(callId: string): Promise<void> {
    const call = await this.getCallById(callId);

    // Règle métier : ne peut pas supprimer un appel en cours de traitement
    if (call.status === CallStatus.PROCESSING) {
      throw new BusinessRuleError(
        "Cannot delete call while processing",
        "DELETE_PROCESSING_CALL"
      );
    }

    await this.callRepository.delete(callId);
  }

  /**
   * Marque un appel comme prêt pour le tagging
   */
  async markAsPrepared(callId: string): Promise<void> {
    const call = await this.getCallById(callId);

    if (!call.isReadyForTagging()) {
      throw new BusinessRuleError(
        "Call is not ready for tagging: missing audio or transcription",
        "NOT_READY_FOR_TAGGING"
      );
    }

    await this.updateCallStatus(callId, CallStatus.READY);
  }

  /**
   * Obtient un appel par son ID (avec gestion d'erreur)
   */
  async getCallById(callId: string): Promise<Call> {
    const call = await this.callRepository.findById(callId);
    if (!call) {
      throw new NotFoundError("Call", callId);
    }
    return call;
  }

  /**
   * Obtient tous les appels avec pagination optionnelle
   */
  async getAllCalls(offset?: number, limit?: number): Promise<Call[]> {
    return this.callRepository.findAll(offset, limit);
  }

  /**
   * Obtient les appels par statut
   */
  async getCallsByStatus(status: CallStatus): Promise<Call[]> {
    return this.callRepository.findByStatus(status);
  }

  /**
   * Obtient les appels par origine
   */
  async getCallsByOrigin(origin: string): Promise<Call[]> {
    return this.callRepository.findByOrigin(origin);
  }

  /**
   * Compte le nombre total d'appels
   */
  async getTotalCallsCount(): Promise<number> {
    return this.callRepository.count();
  }

  /**
   * Vérifie si une transition de statut est valide
   */
  private isValidStatusTransition(from: CallStatus, to: CallStatus): boolean {
    const validTransitions: Record<CallStatus, CallStatus[]> = {
      [CallStatus.DRAFT]: [CallStatus.PROCESSING, CallStatus.ERROR],
      [CallStatus.PROCESSING]: [CallStatus.READY, CallStatus.ERROR],
      [CallStatus.READY]: [CallStatus.TAGGING, CallStatus.ERROR],
      [CallStatus.TAGGING]: [CallStatus.COMPLETED, CallStatus.ERROR],
      [CallStatus.COMPLETED]: [], // État final
      [CallStatus.ERROR]: [CallStatus.DRAFT, CallStatus.PROCESSING], // Peut être réinitialisé
    };

    return validTransitions[from].includes(to);
  }

  /**
   * Génère un ID unique pour un appel
   */
  private generateUniqueCallId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `call_${timestamp}_${random}`;
  }

  /**
   * Génère une description automatique
   */
  private generateAutoDescription(
    audioFile?: AudioFile,
    transcription?: Transcription
  ): string {
    const timestamp = new Date().toLocaleString("fr-FR");
    const parts = [];

    if (audioFile) {
      const fileName = audioFile.originalFile?.name || "Fichier audio";
      parts.push(`Audio: ${fileName}`);
    }

    if (transcription) {
      parts.push(`Transcription (${transcription.getWordCount()} mots)`);
    }

    const content = parts.length > 0 ? ` [${parts.join(" + ")}]` : "";
    return `Import WorkDrive${content} - ${timestamp}`;
  }
}
