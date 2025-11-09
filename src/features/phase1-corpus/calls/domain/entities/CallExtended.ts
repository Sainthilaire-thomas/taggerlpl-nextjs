// src/components/calls/domain/entities/CallExtended.ts - VERSION CORRIGÉE

import { CallStatus } from "../../shared/types/CallStatus";
import {
  ValidationError,
  BusinessRuleError,
} from "../../shared/exceptions/DomainExceptions";
import {
  UpgradeAnalysis,
  CallUpgradeData,
  UpgradeRecommendation,
} from "../../shared/types/CommonTypes";
import { AudioFile } from "./AudioFile";
import { Transcription } from "./Transcription";
import { Call } from "./Call";

/**
 * Énumération des étapes du cycle de vie d'un appel
 */
export enum TaggingWorkflowStage {
  EMPTY = "empty",
  AUDIO_ONLY = "audio_only",
  TRANSCRIPTION_ONLY = "transcription_only",
  COMPLETE = "complete",
  NOT_PREPARED = "not_prepared",
  PREPARED = "prepared",
  SELECTED = "selected",
  TAGGED = "tagged",
}

/**
 * Interface pour le statut complet du cycle de vie d'un appel
 */
export interface CallLifecycleStatus {
  hasAudio: boolean;
  hasTranscription: boolean;
  preparedForTranscript: boolean;
  isTaggingCall: boolean;
  isTagged: boolean;
  contentStage: TaggingWorkflowStage;
  workflowStage: TaggingWorkflowStage;
  overallStage: TaggingWorkflowStage;
  canPrepare: boolean;
  canSelect: boolean;
  canTag: boolean;
  canUnselect: boolean;
  nextAction?: string;
  description: string;
}

/**
 * Extension de votre classe Call existante
 * COMPATIBLE avec votre code existant : hérite de Call
 */
export class CallExtended extends Call {
  constructor(
    id: string,
    filename?: string,
    description?: string,
    status: CallStatus = CallStatus.DRAFT,
    origin?: string,
    audioFile?: AudioFile,
    transcription?: Transcription,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    // NOUVEAUX PARAMÈTRES pour le workflow de tagging
    public readonly preparedForTranscript: boolean = false,
    public readonly isTaggingCall: boolean = false,
    public readonly isTagged: boolean = false,
    // NOUVEAU : JSON brut de transcription pour vérification d'existence
    private readonly transcriptionJson?: any
  ) {
    super(
      id,
      filename,
      description,
      status,
      origin,
      audioFile,
      transcription, // Instance Transcription pour compatibilité
      createdAt,
      updatedAt
    );
  }

  /**
   * SURCHARGE : Vérification basée sur le JSON brut
   */
  hasValidTranscription(): boolean {
    // Priorité au JSON brut si disponible
    if (this.transcriptionJson) {
      return true;
    }
    // Fallback sur la méthode parent
    return super.hasValidTranscription();
  }

  /**
   * SURCHARGE : Retourne le JSON brut si disponible
   */
  getTranscription(): any {
    if (this.transcriptionJson) {
      return this.transcriptionJson;
    }
    return super.getTranscription();
  }

  /**
   * NOUVELLE MÉTHODE PRINCIPALE : Obtient le statut complet du cycle de vie
   */
  getLifecycleStatus(): CallLifecycleStatus {
    const hasAudio = this.hasValidAudio();
    const hasTranscription = this.hasValidTranscription();

    const contentStage = this.calculateContentStage(hasAudio, hasTranscription);
    const workflowStage = this.calculateWorkflowStage(
      hasAudio,
      hasTranscription
    );
    const overallStage = this.calculateOverallStage(
      contentStage,
      workflowStage
    );

    return {
      hasAudio,
      hasTranscription,
      preparedForTranscript: this.preparedForTranscript,
      isTaggingCall: this.isTaggingCall,
      isTagged: this.isTagged,
      contentStage,
      workflowStage,
      overallStage,
      canPrepare: this.canPrepare(),
      canSelect: this.canSelect(),
      canTag: this.canTag(),
      canUnselect: this.canUnselect(),
      nextAction: this.getNextAction(),
      description: this.getStageDescription(overallStage),
    };
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être préparé ?
   */
  canPrepare(): boolean {
    return (
      this.hasValidTranscription() &&
      !this.preparedForTranscript &&
      !this.isTaggingCall &&
      !this.isTagged
    );
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être sélectionné pour le tagging ?
   */
  canSelect(): boolean {
    return (
      this.hasValidTranscription() &&
      this.preparedForTranscript &&
      !this.isTaggingCall &&
      !this.isTagged
    );
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être taggé ?
   */
  canTag(): boolean {
    return (
      this.hasValidTranscription() &&
      this.preparedForTranscript &&
      this.isTaggingCall &&
      !this.isTagged
    );
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être désélectionné ?
   */
  canUnselect(): boolean {
    return this.isTaggingCall && !this.isTagged;
  }

  /**
   * SURCHARGE : Amélioration de la méthode isReadyForTagging() existante
   */
  isReadyForTagging(): boolean {
    return this.canTag();
  }

  // =============================================================================
  // MÉTHODES PRIVÉES DE CALCUL DES ÉTATS
  // =============================================================================

  private calculateContentStage(
    hasAudio: boolean,
    hasTranscription: boolean
  ): TaggingWorkflowStage {
    if (!hasAudio && !hasTranscription) {
      return TaggingWorkflowStage.EMPTY;
    }
    if (hasAudio && !hasTranscription) {
      return TaggingWorkflowStage.AUDIO_ONLY;
    }
    if (!hasAudio && hasTranscription) {
      return TaggingWorkflowStage.TRANSCRIPTION_ONLY;
    }
    return TaggingWorkflowStage.COMPLETE;
  }

  private calculateWorkflowStage(
    hasAudio: boolean,
    hasTranscription: boolean
  ): TaggingWorkflowStage {
    if (!hasTranscription) {
      return hasAudio
        ? TaggingWorkflowStage.AUDIO_ONLY
        : TaggingWorkflowStage.EMPTY;
    }

    if (this.isTagged) {
      return TaggingWorkflowStage.TAGGED;
    }
    if (this.isTaggingCall) {
      return TaggingWorkflowStage.SELECTED;
    }
    if (this.preparedForTranscript) {
      return TaggingWorkflowStage.PREPARED;
    }

    return TaggingWorkflowStage.NOT_PREPARED;
  }

  private calculateOverallStage(
    contentStage: TaggingWorkflowStage,
    workflowStage: TaggingWorkflowStage
  ): TaggingWorkflowStage {
    const stageOrder = [
      TaggingWorkflowStage.EMPTY,
      TaggingWorkflowStage.AUDIO_ONLY,
      TaggingWorkflowStage.TRANSCRIPTION_ONLY,
      TaggingWorkflowStage.COMPLETE,
      TaggingWorkflowStage.NOT_PREPARED,
      TaggingWorkflowStage.PREPARED,
      TaggingWorkflowStage.SELECTED,
      TaggingWorkflowStage.TAGGED,
    ];

    const contentIndex = stageOrder.indexOf(contentStage);
    const workflowIndex = stageOrder.indexOf(workflowStage);

    return stageOrder[Math.max(contentIndex, workflowIndex)];
  }

  private getNextAction(): string | undefined {
    if (this.canPrepare()) {
      return "Préparer pour tagging";
    }
    if (this.canSelect()) {
      return "Sélectionner pour tagging";
    }
    if (this.canTag()) {
      return "Taguer dans TranscriptLPL";
    }
    if (this.canUnselect()) {
      return "Désélectionner";
    }
    if (this.isTagged) {
      return "Voir/Éditer les tags";
    }
    if (!this.hasValidTranscription()) {
      return "Ajouter une transcription";
    }
    return undefined;
  }

  private getStageDescription(stage: TaggingWorkflowStage): string {
    const descriptions = {
      [TaggingWorkflowStage.EMPTY]: "Appel vide",
      [TaggingWorkflowStage.AUDIO_ONLY]: "Audio uniquement",
      [TaggingWorkflowStage.TRANSCRIPTION_ONLY]: "Transcription uniquement",
      [TaggingWorkflowStage.COMPLETE]: "Audio + Transcription disponibles",
      [TaggingWorkflowStage.NOT_PREPARED]: "Non préparé pour le tagging",
      [TaggingWorkflowStage.PREPARED]: "Préparé pour le tagging",
      [TaggingWorkflowStage.SELECTED]: "Sélectionné pour le tagging",
      [TaggingWorkflowStage.TAGGED]: "Taggé et terminé",
    };

    return descriptions[stage] || "État inconnu";
  }

  // =============================================================================
  // FACTORY METHOD CORRIGÉ
  // =============================================================================

  /**
   * FACTORY CORRIGÉ : Crée une instance CallExtended depuis les données de la base
   */
  static fromDatabaseWithWorkflow(
    dbData: any,
    isTagged: boolean = false
  ): CallExtended {
    // Reconstruction de AudioFile si les données existent
    let audioFile: AudioFile | undefined;
    if (dbData.filepath || dbData.audiourl) {
      audioFile = AudioFile.fromDatabase({
        filepath: dbData.filepath,
        audiourl: dbData.audiourl,
        size: dbData.size,
        mime_type: dbData.mime_type,
        duration: dbData.duration,
        uploaded_at: dbData.uploaded_at,
      });
    }

    // SOLUTION SIMPLE : Ne pas créer d'instance Transcription ici
    // Le JSON brut sera utilisé pour vérifier l'existence
    // La transformation en Transcription se fera uniquement pour le tagging

    return new CallExtended(
      String(dbData.callid),
      dbData.filename || undefined,
      dbData.description || undefined,
      (dbData.status as CallStatus) || CallStatus.DRAFT,
      dbData.origine || dbData.origin || undefined,
      audioFile,
      undefined, // Pas d'instance Transcription pour l'instant
      dbData.created_at ? new Date(dbData.created_at) : new Date(),
      dbData.updated_at ? new Date(dbData.updated_at) : new Date(),
      Boolean(dbData.preparedfortranscript),
      Boolean(dbData.is_tagging_call),
      isTagged,
      dbData.transcription // JSON brut pour vérification d'existence
    );
  }

  /**
   * MISE À JOUR IMMUTABLE : Crée une nouvelle instance avec des flags de workflow modifiés
   */
  withWorkflowFlags(changes: {
    preparedForTranscript?: boolean;
    isTaggingCall?: boolean;
    isTagged?: boolean;
  }): CallExtended {
    return new CallExtended(
      this.id,
      this.filename,
      this.description,
      this.status,
      this.origin,
      this.getAudioFile(),
      super.getTranscription(), // Instance Transcription du parent
      this.createdAt,
      new Date(),
      changes.preparedForTranscript ?? this.preparedForTranscript,
      changes.isTaggingCall ?? this.isTaggingCall,
      changes.isTagged ?? this.isTagged,
      this.transcriptionJson // Conserver le JSON brut
    );
  }

  /**
   * COMPATIBILITÉ : Surcharge des méthodes with* existantes pour retourner CallExtended
   */
  withAudio(audioFile: AudioFile): CallExtended {
    return new CallExtended(
      this.id,
      this.filename,
      this.description,
      this.status,
      this.origin,
      audioFile,
      super.getTranscription(),
      this.createdAt,
      new Date(),
      this.preparedForTranscript,
      this.isTaggingCall,
      this.isTagged,
      this.transcriptionJson
    );
  }

  withTranscription(transcription: Transcription): CallExtended {
    return new CallExtended(
      this.id,
      this.filename,
      this.description,
      this.status,
      this.origin,
      this.getAudioFile(),
      transcription,
      this.createdAt,
      new Date(),
      this.preparedForTranscript,
      this.isTaggingCall,
      this.isTagged,
      this.transcriptionJson
    );
  }

  withOrigin(origin: string): CallExtended {
    return new CallExtended(
      this.id,
      this.filename,
      this.description,
      this.status,
      origin,
      this.getAudioFile(),
      super.getTranscription(),
      this.createdAt,
      new Date(),
      this.preparedForTranscript,
      this.isTaggingCall,
      this.isTagged,
      this.transcriptionJson
    );
  }

  withStatus(status: CallStatus): CallExtended {
    return new CallExtended(
      this.id,
      this.filename,
      this.description,
      status,
      this.origin,
      this.getAudioFile(),
      super.getTranscription(),
      this.createdAt,
      new Date(),
      this.preparedForTranscript,
      this.isTaggingCall,
      this.isTagged,
      this.transcriptionJson
    );
  }
}
