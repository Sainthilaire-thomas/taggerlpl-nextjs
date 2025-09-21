// src/components/calls/domain/entities/CallExtended.ts

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
import { Call } from "./Call"; // Import de votre classe existante

/**
 * Énumération des étapes du cycle de vie d'un appel
 * Sépare clairement le contenu du workflow de tagging
 */
export enum TaggingWorkflowStage {
  // Étapes de construction du contenu
  EMPTY = "empty", // Aucun contenu
  AUDIO_ONLY = "audio_only", // Audio seulement
  TRANSCRIPTION_ONLY = "transcription_only", // Transcription seulement
  COMPLETE = "complete", // Audio + Transcription disponibles

  // Étapes du workflow de tagging (nécessitent une transcription)
  NOT_PREPARED = "not_prepared", // Complet mais JSON non transformé en words
  PREPARED = "prepared", // JSON transformé en words (preparedfortranscript = true)
  SELECTED = "selected", // Sélectionné pour tagging (is_tagging_call = true)
  TAGGED = "tagged", // Taggé (données présentes dans turntagged)
}

/**
 * Interface pour le statut complet du cycle de vie d'un appel
 * Combine les informations de contenu et de workflow
 */
export interface CallLifecycleStatus {
  // État du contenu
  hasAudio: boolean;
  hasTranscription: boolean;

  // Flags du workflow (viennent de la base de données)
  preparedForTranscript: boolean; // Correspond à preparedfortranscript
  isTaggingCall: boolean; // Correspond à is_tagging_call
  isTagged: boolean; // Calculé depuis la présence dans turntagged

  // États calculés
  contentStage: TaggingWorkflowStage; // Niveau de contenu disponible
  workflowStage: TaggingWorkflowStage; // Niveau dans le workflow de tagging
  overallStage: TaggingWorkflowStage; // État global (le plus avancé)

  // Actions possibles selon les règles métier
  canPrepare: boolean; // Peut être préparé (JSON → words)
  canSelect: boolean; // Peut être sélectionné pour tagging
  canTag: boolean; // Peut être taggé dans TranscriptLPL
  canUnselect: boolean; // Peut être désélectionné

  // Informations pour l'UI
  nextAction?: string; // Prochaine action recommandée
  description: string; // Description textuelle de l'état
}

/**
 * Extension de votre classe Call existante
 * Ajoute la logique du cycle de vie et du workflow de tagging
 *
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
    public readonly preparedForTranscript: boolean = false, // preparedfortranscript de la DB
    public readonly isTaggingCall: boolean = false, // is_tagging_call de la DB
    public readonly isTagged: boolean = false // Calculé depuis turntagged
  ) {
    // Appel du constructeur parent avec tous les paramètres existants
    super(
      id,
      filename,
      description,
      status,
      origin,
      audioFile,
      transcription,
      createdAt,
      updatedAt
    );
  }

  /**
   * NOUVELLE MÉTHODE PRINCIPALE : Obtient le statut complet du cycle de vie
   *
   * @returns CallLifecycleStatus avec toutes les informations nécessaires pour l'UI
   */
  getLifecycleStatus(): CallLifecycleStatus {
    const hasAudio = this.hasValidAudio();
    const hasTranscription = this.hasValidTranscription();

    // Calcul des différents niveaux d'état
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
      // État du contenu
      hasAudio,
      hasTranscription,

      // Flags de workflow
      preparedForTranscript: this.preparedForTranscript,
      isTaggingCall: this.isTaggingCall,
      isTagged: this.isTagged,

      // États calculés
      contentStage,
      workflowStage,
      overallStage,

      // Règles métier : actions possibles
      canPrepare: this.canPrepare(),
      canSelect: this.canSelect(),
      canTag: this.canTag(),
      canUnselect: this.canUnselect(),

      // Informations pour l'UI
      nextAction: this.getNextAction(),
      description: this.getStageDescription(overallStage),
    };
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être préparé ?
   *
   * Conditions :
   * - Doit avoir une transcription valide (JSON)
   * - Ne doit pas déjà être préparé
   * - Ne doit pas être en cours de tagging
   * - Ne doit pas déjà être taggé
   */
  canPrepare(): boolean {
    return (
      this.hasValidTranscription() && // Doit avoir une transcription JSON
      !this.preparedForTranscript && // Pas encore transformé en words
      !this.isTaggingCall && // Pas en cours de tagging
      !this.isTagged // Pas déjà taggé
    );
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être sélectionné pour le tagging ?
   *
   * Conditions :
   * - Doit avoir une transcription valide
   * - Doit être préparé (JSON transformé en words)
   * - Ne doit pas déjà être sélectionné
   * - Ne doit pas déjà être taggé
   */
  canSelect(): boolean {
    return (
      this.hasValidTranscription() && // Doit avoir une transcription
      this.preparedForTranscript && // Doit être préparé (words créés)
      !this.isTaggingCall && // Pas encore sélectionné
      !this.isTagged // Pas déjà taggé
    );
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être taggé ?
   *
   * Conditions :
   * - Doit avoir une transcription valide
   * - Doit être préparé
   * - Doit être sélectionné pour le tagging
   * - Ne doit pas déjà être taggé
   */
  canTag(): boolean {
    return (
      this.hasValidTranscription() && // Doit avoir une transcription
      this.preparedForTranscript && // Doit être préparé
      this.isTaggingCall && // Doit être sélectionné
      !this.isTagged // Pas encore taggé
    );
  }

  /**
   * RÈGLE MÉTIER : Un appel peut-il être désélectionné ?
   *
   * Conditions :
   * - Doit être actuellement sélectionné
   * - Ne doit pas déjà être taggé
   */
  canUnselect(): boolean {
    return (
      this.isTaggingCall && // Doit être sélectionné
      !this.isTagged // Pas encore taggé (sinon pas de retour en arrière)
    );
  }

  /**
   * SURCHARGE : Amélioration de la méthode isReadyForTagging() existante
   *
   * Maintenant plus précise : prêt = peut être taggé immédiatement
   */
  isReadyForTagging(): boolean {
    return this.canTag(); // Utilise la nouvelle logique métier précise
  }

  // =============================================================================
  // MÉTHODES PRIVÉES DE CALCUL DES ÉTATS
  // =============================================================================

  /**
   * Calcule l'état du contenu disponible
   */
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

  /**
   * Calcule l'état dans le workflow de tagging
   */
  private calculateWorkflowStage(
    hasAudio: boolean,
    hasTranscription: boolean
  ): TaggingWorkflowStage {
    // Sans transcription, pas de workflow de tagging possible
    if (!hasTranscription) {
      return hasAudio
        ? TaggingWorkflowStage.AUDIO_ONLY
        : TaggingWorkflowStage.EMPTY;
    }

    // Workflow de tagging (dans l'ordre chronologique)
    if (this.isTagged) {
      return TaggingWorkflowStage.TAGGED;
    }
    if (this.isTaggingCall) {
      return TaggingWorkflowStage.SELECTED;
    }
    if (this.preparedForTranscript) {
      return TaggingWorkflowStage.PREPARED;
    }

    // A une transcription mais pas encore préparé
    return TaggingWorkflowStage.NOT_PREPARED;
  }

  /**
   * Calcule l'état global (le plus avancé entre contenu et workflow)
   */
  private calculateOverallStage(
    contentStage: TaggingWorkflowStage,
    workflowStage: TaggingWorkflowStage
  ): TaggingWorkflowStage {
    // Ordre de priorité des étapes (du moins avancé au plus avancé)
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

    // Retourne l'état le plus avancé
    return stageOrder[Math.max(contentIndex, workflowIndex)];
  }

  /**
   * Détermine la prochaine action recommandée
   */
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

  /**
   * Obtient une description textuelle de l'état
   */
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
  // FACTORY METHODS ET MÉTHODES UTILITAIRES
  // =============================================================================

  /**
   * FACTORY : Crée une instance CallExtended depuis les données de la base
   *
   * @param dbData Données brutes de la base (row de Supabase)
   * @param isTagged Indique si l'appel est présent dans turntagged (calculé séparément)
   * @returns Instance de CallExtended avec le workflow enrichi
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

    // Reconstruction de Transcription si les données existent
    let transcription: Transcription | undefined;
    if (dbData.transcription) {
      try {
        const transcriptionData =
          typeof dbData.transcription === "string"
            ? JSON.parse(dbData.transcription)
            : dbData.transcription;
        transcription = Transcription.fromJSON(transcriptionData);
      } catch (error) {
        console.warn(
          `⚠️ Erreur parsing transcription pour call ${dbData.callid}:`,
          error
        );
        // Continue sans transcription plutôt que de planter
      }
    }

    return new CallExtended(
      String(dbData.callid),
      dbData.filename || undefined,
      dbData.description || undefined,
      (dbData.status as CallStatus) || CallStatus.DRAFT,
      dbData.origine || dbData.origin || undefined, // Support des deux noms de colonne
      audioFile,
      transcription,
      dbData.created_at ? new Date(dbData.created_at) : new Date(),
      dbData.updated_at ? new Date(dbData.updated_at) : new Date(),
      // NOUVEAUX CHAMPS du workflow
      Boolean(dbData.preparedfortranscript), // Conversion explicite en boolean
      Boolean(dbData.is_tagging_call), // Conversion explicite en boolean
      isTagged // Passé en paramètre (calculé ailleurs)
    );
  }

  /**
   * MISE À JOUR IMMUTABLE : Crée une nouvelle instance avec des flags de workflow modifiés
   *
   * Respecte le pattern immutable de votre classe Call existante
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
      this.getTranscription(),
      this.createdAt,
      new Date(), // updatedAt mis à jour
      // Nouveaux flags (avec fallback sur les valeurs actuelles)
      changes.preparedForTranscript ?? this.preparedForTranscript,
      changes.isTaggingCall ?? this.isTaggingCall,
      changes.isTagged ?? this.isTagged
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
      this.getTranscription(),
      this.createdAt,
      new Date(),
      this.preparedForTranscript,
      this.isTaggingCall,
      this.isTagged
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
      this.isTagged
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
      this.getTranscription(),
      this.createdAt,
      new Date(),
      this.preparedForTranscript,
      this.isTaggingCall,
      this.isTagged
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
      this.getTranscription(),
      this.createdAt,
      new Date(),
      this.preparedForTranscript,
      this.isTaggingCall,
      this.isTagged
    );
  }
}
