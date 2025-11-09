// src/components/calls/domain/services/CallLifecycleService.ts

import { CallExtended, TaggingWorkflowStage } from "../entities/CallExtended";
import { BusinessRuleError } from "../../shared/exceptions/DomainExceptions";
import { CallRepository } from "../repositories/CallRepository";

/**
 * Résultat d'une action sur le cycle de vie d'un appel
 */
export interface LifecycleActionResult {
  success: boolean;
  message: string;
  newStage?: TaggingWorkflowStage;
  error?: string;
}

/**
 * Statistiques du cycle de vie pour un ensemble d'appels
 */
export interface LifecycleStats {
  [TaggingWorkflowStage.EMPTY]: number;
  [TaggingWorkflowStage.AUDIO_ONLY]: number;
  [TaggingWorkflowStage.TRANSCRIPTION_ONLY]: number;
  [TaggingWorkflowStage.COMPLETE]: number;
  [TaggingWorkflowStage.NOT_PREPARED]: number;
  [TaggingWorkflowStage.PREPARED]: number;
  [TaggingWorkflowStage.SELECTED]: number;
  [TaggingWorkflowStage.TAGGED]: number;
  total: number;
}

/**
 * Service spécialisé pour la gestion du cycle de vie des appels
 *
 * Responsabilités :
 * - Orchestrer les transitions entre étapes du workflow
 * - Valider les règles métier
 * - Coordonner avec les autres services (transformation, repository)
 * - Fournir des statistiques sur l'état des appels
 */
export class CallLifecycleService {
  constructor(
    private callRepository: CallRepository,
    private transformationService?: any // TranscriptionTransformationService (optionnel)
  ) {}

  /**
   * Fait progresser automatiquement un appel vers l'étape suivante possible
   *
   * @param callId ID de l'appel à faire progresser
   * @returns Résultat de l'action avec le nouvel état
   */
  async progressCall(callId: string): Promise<LifecycleActionResult> {
    try {
      const call = await this.getCallWithWorkflow(callId);
      const lifecycle = call.getLifecycleStatus();

      // Déterminer l'action prioritaire selon les règles métier
      if (lifecycle.canPrepare) {
        return await this.prepareCall(call);
      } else if (lifecycle.canSelect) {
        return await this.selectCall(call);
      } else {
        return {
          success: false,
          message: `Aucune progression possible. État actuel : ${lifecycle.description}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Prépare un appel pour le tagging (JSON → words dans la table word)
   *
   * @param call Instance CallExtended à préparer
   * @returns Résultat de la préparation
   */
  async prepareCall(call: CallExtended): Promise<LifecycleActionResult> {
    try {
      // Validation des règles métier
      if (!call.canPrepare()) {
        throw new BusinessRuleError(
          "Cet appel ne peut pas être préparé. " +
            `État actuel : ${call.getLifecycleStatus().description}`
        );
      }

      // Vérification de la disponibilité du service de transformation
      if (!this.transformationService) {
        throw new BusinessRuleError(
          "Service de transformation non disponible. " +
            "Impossible de transformer la transcription JSON en mots."
        );
      }

      // Obtenir la transcription JSON
      const transcription = call.getTranscription();
      if (!transcription) {
        throw new BusinessRuleError(
          "Transcription manquante pour la préparation"
        );
      }

      // Transformation JSON → table word via le service spécialisé
      const transformationResult =
        await this.transformationService.transformJsonToWords(
          call.id,
          transcription // Sera sérialisé en JSON par le service
        );

      if (!transformationResult.success) {
        return {
          success: false,
          message:
            transformationResult.error ||
            "Échec de la transformation JSON → words",
          error: transformationResult.error,
        };
      }

      // Si tout s'est bien passé, l'appel est maintenant préparé
      return {
        success: true,
        message: `Appel préparé avec succès. ${
          transformationResult.wordsInserted || 0
        } mots traités.`,
        newStage: TaggingWorkflowStage.PREPARED,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la préparation",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sélectionne un appel pour le tagging (is_tagging_call = true)
   *
   * @param call Instance CallExtended à sélectionner
   * @returns Résultat de la sélection
   */
  async selectCall(call: CallExtended): Promise<LifecycleActionResult> {
    try {
      // Validation des règles métier
      if (!call.canSelect()) {
        throw new BusinessRuleError(
          "Cet appel ne peut pas être sélectionné. " +
            `État actuel : ${call.getLifecycleStatus().description}`
        );
      }

      // Mise à jour du flag is_tagging_call dans la base
      await this.updateCallFlags(call.id, { is_tagging_call: true });

      return {
        success: true,
        message: "Appel sélectionné pour le tagging",
        newStage: TaggingWorkflowStage.SELECTED,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la sélection",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Désélectionne un appel (is_tagging_call = false)
   *
   * @param call Instance CallExtended à désélectionner
   * @returns Résultat de la désélection
   */
  async unselectCall(call: CallExtended): Promise<LifecycleActionResult> {
    try {
      // Validation des règles métier
      if (!call.canUnselect()) {
        throw new BusinessRuleError(
          "Cet appel ne peut pas être désélectionné. " +
            `État actuel : ${call.getLifecycleStatus().description}`
        );
      }

      // Mise à jour du flag is_tagging_call dans la base
      await this.updateCallFlags(call.id, { is_tagging_call: false });

      return {
        success: true,
        message: "Appel désélectionné",
        newStage: TaggingWorkflowStage.PREPARED,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la désélection",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Obtient un appel avec toutes ses informations de workflow enrichies
   *
   * @param callId ID de l'appel
   * @returns Instance CallExtended avec état complet
   */
  async getCallWithWorkflow(callId: string): Promise<CallExtended> {
    try {
      // Récupérer les données de base depuis le repository
      const callData = await this.callRepository.findById(callId);
      if (!callData) {
        throw new BusinessRuleError(`Appel ${callId} introuvable`);
      }

      // Vérifier si l'appel est taggé (présence dans turntagged)
      const isTagged = await this.checkIfTagged(callId);

      // Créer l'instance enrichie avec le factory method
      return CallExtended.fromDatabaseWithWorkflow(callData, isTagged);
    } catch (error) {
      throw new BusinessRuleError(
        `Impossible de récupérer l'appel ${callId} : ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Obtient plusieurs appels avec leur workflow enrichi
   *
   * @param callIds Liste des IDs d'appels
   * @returns Liste d'instances CallExtended
   */
  async getCallsWithWorkflow(callIds: string[]): Promise<CallExtended[]> {
    const results: CallExtended[] = [];

    // Traitement en parallèle pour les performances
    const promises = callIds.map((id) =>
      this.getCallWithWorkflow(id).catch((error) => {
        console.warn(`Erreur lors du chargement de l'appel ${id}:`, error);
        return null; // Continue avec les autres appels
      })
    );

    const resolved = await Promise.all(promises);

    // Filtrer les résultats valides
    resolved.forEach((call) => {
      if (call) results.push(call);
    });

    return results;
  }

  /**
   * Calcule des statistiques détaillées sur le cycle de vie d'un ensemble d'appels
   *
   * @param callIds Liste des IDs d'appels à analyser
   * @returns Statistiques par étape du cycle de vie
   */
  async getLifecycleStats(callIds: string[]): Promise<LifecycleStats> {
    // Initialisation des compteurs
    const stats: LifecycleStats = {
      [TaggingWorkflowStage.EMPTY]: 0,
      [TaggingWorkflowStage.AUDIO_ONLY]: 0,
      [TaggingWorkflowStage.TRANSCRIPTION_ONLY]: 0,
      [TaggingWorkflowStage.COMPLETE]: 0,
      [TaggingWorkflowStage.NOT_PREPARED]: 0,
      [TaggingWorkflowStage.PREPARED]: 0,
      [TaggingWorkflowStage.SELECTED]: 0,
      [TaggingWorkflowStage.TAGGED]: 0,
      total: callIds.length,
    };

    // Analyse de chaque appel
    for (const callId of callIds) {
      try {
        const call = await this.getCallWithWorkflow(callId);
        const lifecycle = call.getLifecycleStatus();
        stats[lifecycle.overallStage]++;
      } catch (error) {
        // En cas d'erreur sur un appel, on continue avec les autres
        console.warn(`Erreur lors de l'analyse de l'appel ${callId}:`, error);
      }
    }

    return stats;
  }

  /**
   * Obtient la liste des appels selon leur stade de cycle de vie
   *
   * @param stage Stade recherché
   * @param callIds Liste des IDs à filtrer (optionnel)
   * @returns Liste des appels correspondant au stade
   */
  async getCallsByStage(
    stage: TaggingWorkflowStage,
    callIds?: string[]
  ): Promise<CallExtended[]> {
    let targetCalls: CallExtended[];

    if (callIds) {
      // Filtrer depuis une liste fournie
      targetCalls = await this.getCallsWithWorkflow(callIds);
    } else {
      // Charger tous les appels depuis le repository
      const allCalls = await this.callRepository.findAll();
      const allIds = allCalls.map((call) => call.id);
      targetCalls = await this.getCallsWithWorkflow(allIds);
    }

    // Filtrer par stade
    return targetCalls.filter((call) => {
      const lifecycle = call.getLifecycleStatus();
      return lifecycle.overallStage === stage;
    });
  }

  // =============================================================================
  // MÉTHODES PRIVÉES
  // =============================================================================

  /**
   * Vérifie si un appel est taggé (présence dans la table turntagged)
   *
   * @param callId ID de l'appel
   * @returns true si l'appel a des données dans turntagged
   */
  private async checkIfTagged(callId: string): Promise<boolean> {
    try {
      // Utilisation directe du client Supabase du repository
      // (Alternative : créer un RelationsRepository dédié)
      const supabaseClient = (this.callRepository as any).sb;

      if (!supabaseClient) {
        console.warn(
          "Client Supabase non disponible pour vérifier le statut taggé"
        );
        return false;
      }

      const { count, error } = await supabaseClient
        .from("turntagged")
        .select("*", { count: "exact", head: true })
        .eq("call_id", callId);

      if (error) {
        console.warn(
          `Erreur lors de la vérification du statut taggé pour ${callId}:`,
          error
        );
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.warn(
        `Erreur lors de la vérification du statut taggé pour ${callId}:`,
        error
      );
      return false; // Par défaut, considérer comme non taggé
    }
  }

  /**
   * Met à jour les flags de workflow d'un appel dans la base de données
   *
   * @param callId ID de l'appel
   * @param flags Flags à mettre à jour
   */
  private async updateCallFlags(
    callId: string,
    flags: {
      preparedfortranscript?: boolean;
      is_tagging_call?: boolean;
    }
  ): Promise<void> {
    try {
      // Utilisation du repository existant avec mise à jour partielle
      // Note : Cela nécessite que votre repository supporte la mise à jour partielle
      if (typeof (this.callRepository as any).update === "function") {
        await (this.callRepository as any).update(callId, flags);
      } else {
        // Fallback : utilisation directe de Supabase si le repository ne supporte pas
        const supabaseClient = (this.callRepository as any).sb;
        if (supabaseClient) {
          const { error } = await supabaseClient
            .from("call")
            .update(flags)
            .eq("callid", callId);

          if (error) {
            throw new BusinessRuleError(
              `Mise à jour des flags échouée : ${error.message}`
            );
          }
        } else {
          throw new BusinessRuleError(
            "Impossible de mettre à jour les flags : méthodes non disponibles"
          );
        }
      }
    } catch (error) {
      throw new BusinessRuleError(
        `Erreur lors de la mise à jour des flags pour l'appel ${callId} : ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  }

  /**
   * Valide qu'un ensemble d'appels peut subir une action donnée
   *
   * @param calls Liste des appels
   * @param action Action à valider
   * @returns Résultat de la validation avec détails
   */
  async validateBulkAction(
    calls: CallExtended[],
    action: "prepare" | "select" | "unselect"
  ): Promise<{
    valid: CallExtended[];
    invalid: { call: CallExtended; reason: string }[];
  }> {
    const valid: CallExtended[] = [];
    const invalid: { call: CallExtended; reason: string }[] = [];

    for (const call of calls) {
      const lifecycle = call.getLifecycleStatus();
      let canPerformAction = false;
      let reason = "";

      switch (action) {
        case "prepare":
          canPerformAction = lifecycle.canPrepare;
          reason = canPerformAction ? "" : "Ne peut pas être préparé";
          break;
        case "select":
          canPerformAction = lifecycle.canSelect;
          reason = canPerformAction ? "" : "Ne peut pas être sélectionné";
          break;
        case "unselect":
          canPerformAction = lifecycle.canUnselect;
          reason = canPerformAction ? "" : "Ne peut pas être désélectionné";
          break;
      }

      if (canPerformAction) {
        valid.push(call);
      } else {
        invalid.push({ call, reason });
      }
    }

    return { valid, invalid };
  }
}
