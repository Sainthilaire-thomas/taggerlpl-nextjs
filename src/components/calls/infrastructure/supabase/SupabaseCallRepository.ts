// src/components/calls/infrastructure/supabase/SupabaseCallRepository.ts - VERSION MISE À JOUR

import supabaseClient from "@/lib/supabaseClient";
import { Call } from "../../domain/entities/Call";
import { AudioFile } from "../../domain/entities/AudioFile";
import { CallRepository } from "../../domain/repositories/CallRepository";
import { RepositoryError } from "../../shared/exceptions/DomainExceptions";
import { CallStatus } from "../../shared/types/CallStatus";
import { Transcription } from "../../domain/entities/Transcription";

type DbCall = {
  callid: string;
  filename?: string | null;
  description?: string | null;
  status?: CallStatus | null;
  origine?: string | null;
  filepath?: string | null;
  audiourl?: string | null;
  transcription?: unknown | null; // JSONB
  preparedfortranscript?: boolean | null;
  is_tagging_call?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export class SupabaseCallRepository implements CallRepository {
  constructor(private sb = supabaseClient) {}

  // ============================================================================
  // ✅ NOUVELLES MÉTHODES SPÉCIFIQUES POUR CALLPREPARATIONPAGE
  // ============================================================================

  /**
   * ✅ CORRECTION: Méthode spécifique pour CallPreparationPage
   * Filtre correct: preparedfortranscript = false + transcription NOT NULL
   */
  async findCallsForPreparation(): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("preparedfortranscript", false) // ✅ Critère correct
      .not("transcription", "is", null) // ✅ Doit avoir transcription
      .order("callid", { ascending: false });

    if (error) {
      throw new RepositoryError(
        `Find preparation calls failed: ${error.message}`
      );
    }

    console.log(
      `📊 Repository: ${data?.length || 0} appels préparables trouvés`
    );
    return (data as DbCall[]).map(this.mapToCall);
  }

  /**
   * ✅ SÉPARÉ: Méthode pour les appels en cours de tagging (autre contexte)
   * Utilisé dans d'autres interfaces, PAS CallPreparationPage
   */
  async findActiveTaggingCalls(): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("is_tagging_call", true) // ✅ Utilisé SEULEMENT ici
      .eq("preparedfortranscript", true) // ✅ Déjà préparés
      .order("callid", { ascending: false });

    if (error) {
      throw new RepositoryError(
        `Find active tagging calls failed: ${error.message}`
      );
    }

    return (data as DbCall[]).map(this.mapToCall);
  }

  /**
   * ✅ NOUVEAU: Filtrage par statut conflictuel
   */
  async findByConflictStatus(
    status: "conflictuel" | "non_conflictuel" | "non_supervisé"
  ): Promise<Call[]> {
    let query = this.sb.from("call").select("*");

    switch (status) {
      case "conflictuel":
        query = query.eq("status", "conflictuel");
        break;
      case "non_conflictuel":
        query = query.eq("status", "non_conflictuel");
        break;
      case "non_supervisé":
        query = query.or("status.is.null,status.eq.non_supervisé");
        break;
    }

    const { data, error } = await query.order("callid", { ascending: false });

    if (error) {
      throw new RepositoryError(
        `Find by conflict status failed: ${error.message}`
      );
    }

    return (data as DbCall[]).map(this.mapToCall);
  }

  /**
   * ✅ NOUVEAU: Appels préparables avec filtres avancés
   */
  async findCallsForPreparationWithFilters(filters: {
    conflictStatus?:
      | "all"
      | "conflictuel"
      | "non_conflictuel"
      | "non_supervisé";
    origin?: string;
    hasAudio?: boolean;
    keyword?: string;
  }): Promise<Call[]> {
    let query = this.sb
      .from("call")
      .select("*")
      .eq("preparedfortranscript", false) // ✅ Base: non préparés
      .not("transcription", "is", null); // ✅ Base: avec transcription

    // Filtre par statut conflictuel
    if (filters.conflictStatus && filters.conflictStatus !== "all") {
      switch (filters.conflictStatus) {
        case "conflictuel":
          query = query.eq("status", "conflictuel");
          break;
        case "non_conflictuel":
          query = query.eq("status", "non_conflictuel");
          break;
        case "non_supervisé":
          query = query.or("status.is.null,status.eq.non_supervisé");
          break;
      }
    }

    // Filtre par origine
    if (filters.origin && filters.origin !== "all") {
      query = query.eq("origine", filters.origin);
    }

    // Filtre par présence d'audio
    if (filters.hasAudio !== undefined) {
      if (filters.hasAudio) {
        query = query.not("filepath", "is", null);
      } else {
        query = query.is("filepath", null);
      }
    }

    // Recherche par mot-clé (sur plusieurs champs)
    if (filters.keyword && filters.keyword.trim()) {
      const keyword = filters.keyword.trim();
      query = query.or(
        `filename.ilike.%${keyword}%,description.ilike.%${keyword}%,callid.ilike.%${keyword}%`
      );
    }

    const { data, error } = await query.order("callid", { ascending: false });

    if (error) {
      throw new RepositoryError(
        `Find preparation calls with filters failed: ${error.message}`
      );
    }

    console.log(
      `🔍 Repository: ${data?.length || 0} appels trouvés avec filtres`
    );
    return (data as DbCall[]).map(this.mapToCall);
  }

  /**
   * ✅ NOUVEAU: Statistiques par origine pour CallPreparationPage
   */
  async getOriginStatistics(): Promise<
    Array<{
      origin: string;
      total: number;
      preparables: number;
      conflictuels: number;
      withAudio: number;
    }>
  > {
    const { data, error } = await this.sb
      .from("call")
      .select(
        "origine, status, filepath, transcription, preparedfortranscript"
      );

    if (error) {
      throw new RepositoryError(
        `Get origin statistics failed: ${error.message}`
      );
    }

    // Groupement et calcul des stats côté JS
    const stats = (data as any[]).reduce((acc, row) => {
      const origin = row.origine || "Aucune origine";

      if (!acc[origin]) {
        acc[origin] = {
          total: 0,
          preparables: 0,
          conflictuels: 0,
          withAudio: 0,
        };
      }

      acc[origin].total++;

      // Préparable: a transcription ET pas encore préparé
      if (row.transcription && !row.preparedfortranscript) {
        acc[origin].preparables++;
      }

      if (row.status === "conflictuel") {
        acc[origin].conflictuels++;
      }

      if (row.filepath) {
        acc[origin].withAudio++;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.entries(stats).map(([origin, stat]) => ({
      origin,
      ...stat,
    }));
  }

  /**
   * ✅ NOUVEAU: Mise à jour du statut de préparation
   */
  async markAsPrepared(callId: string): Promise<void> {
    const { error } = await this.sb
      .from("call")
      .update({
        preparedfortranscript: true,
        updated_at: new Date().toISOString(),
      })
      .eq("callid", callId);

    if (error) {
      throw new RepositoryError(`Mark as prepared failed: ${error.message}`);
    }

    console.log(`✅ Repository: Appel ${callId} marqué comme préparé`);
  }

  /**
   * ✅ NOUVEAU: Préparation en lot
   */
  async markMultipleAsPrepared(callIds: string[]): Promise<{
    success: string[];
    errors: { callId: string; error: string }[];
  }> {
    const results = {
      success: [] as string[],
      errors: [] as { callId: string; error: string }[],
    };

    // Traitement en lot optimisé
    try {
      const { data, error } = await this.sb
        .from("call")
        .update({
          preparedfortranscript: true,
          updated_at: new Date().toISOString(),
        })
        .in("callid", callIds)
        .select("callid");

      if (error) {
        // Si erreur globale, marquer tous comme erreur
        callIds.forEach((id) => {
          results.errors.push({ callId: id, error: error.message });
        });
      } else {
        // Succès pour tous les IDs retournés
        const updatedIds = (data as any[])?.map((row) => row.callid) || [];
        results.success.push(...updatedIds);

        // Identifier les échecs (IDs non mis à jour)
        const failedIds = callIds.filter((id) => !updatedIds.includes(id));
        failedIds.forEach((id) => {
          results.errors.push({
            callId: id,
            error: "Not found or already prepared",
          });
        });
      }
    } catch (error) {
      callIds.forEach((id) => {
        results.errors.push({
          callId: id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }

    console.log(
      `📊 Repository: Lot préparé - ${results.success.length} succès, ${results.errors.length} erreurs`
    );
    return results;
  }

  // ============================================================================
  // MÉTHODES CRUD STANDARD (EXISTANTES)
  // ============================================================================

  async save(call: Call): Promise<void> {
    const audio = call.getAudioFile();
    const payload: DbCall = {
      callid: call.id,
      filename: call.filename ?? null,
      description: call.description ?? null,
      status: call.status ?? null,
      origine: call.origin ?? null,
      filepath: audio?.path ?? null,
      audiourl: audio?.url ?? null,
      transcription: call.getTranscription() ?? null,
      preparedfortranscript: false, // ✅ Par défaut false
      is_tagging_call: false, // ✅ Par défaut false
    };

    const { error } = await this.sb.from("call").insert([payload]);
    if (error) {
      throw new RepositoryError(`Failed to save call: ${error.message}`);
    }
  }

  // Deux formes supportées : update(call) OU update(id, partial)
  async update(call: Call): Promise<void>;
  async update(id: string, changes: Partial<Call>): Promise<void>;
  async update(
    callOrId: Call | string,
    changes?: Partial<Call>
  ): Promise<void> {
    if (typeof callOrId !== "string") {
      const call = callOrId;
      const audio = call.getAudioFile();
      const payload = {
        filename: call.filename ?? null,
        description: call.description ?? null,
        status: call.status ?? null,
        origine: call.origin ?? null,
        filepath: audio?.path ?? null,
        audiourl: audio?.url ?? null,
        transcription: call.getTranscription() ?? null,
        updated_at: new Date().toISOString(),
      } as Partial<DbCall>;

      const { error } = await this.sb
        .from("call")
        .update(payload)
        .eq("callid", call.id);
      if (error) {
        throw new RepositoryError(`Failed to update call: ${error.message}`);
      }
      return;
    }

    const id = callOrId;
    const payload = this.mapPartialCallToDb(changes ?? {});
    if (Object.keys(payload).length === 0) return;

    const { error } = await this.sb
      .from("call")
      .update(payload)
      .eq("callid", id);
    if (error) {
      throw new RepositoryError(`Failed to update call: ${error.message}`);
    }
  }

  private mapPartialCallToDb(changes: Partial<Call>): Partial<DbCall> {
    const out: Partial<DbCall> = {};
    if ("filename" in changes) out.filename = (changes as any).filename ?? null;
    if ("description" in changes)
      out.description = (changes as any).description ?? null;
    if ("status" in changes) out.status = (changes as any).status ?? null;
    if ("origin" in changes) out.origine = (changes as any).origin ?? null;

    const audioAny = (changes as any).audioFile as AudioFile | undefined;
    if (audioAny) {
      out.filepath = audioAny.path ?? null;
      out.audiourl = audioAny.url ?? null;
    }

    const txAny = (changes as any).transcription as unknown | undefined;
    if (txAny !== undefined) out.transcription = txAny ?? null;

    if (Object.keys(out).length > 0) {
      (out as any).updated_at = new Date().toISOString();
    }
    return out;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.sb.from("call").delete().eq("callid", id);
    if (error) {
      throw new RepositoryError(`Failed to delete call: ${error.message}`);
    }
  }

  // READ METHODS
  async findById(id: string): Promise<Call | null> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("callid", id)
      .maybeSingle<DbCall>();

    if (error) {
      throw new RepositoryError(`Find by id failed: ${error.message}`);
    }
    if (!data) return null;
    return this.mapToCall(data);
  }

  async findAll(offset?: number, limit?: number): Promise<Call[]> {
    let query = this.sb.from("call").select("*");

    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.range(offset, offset + (limit || 1000) - 1);
    }

    const { data, error } = await query.order("callid", { ascending: false });
    if (error) {
      throw new RepositoryError(`Find all failed: ${error.message}`);
    }
    return (data as DbCall[]).map(this.mapToCall);
  }

  async findByFilename(filename: string): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("filename", filename);
    if (error) {
      throw new RepositoryError(`Find by filename failed: ${error.message}`);
    }
    return (data as DbCall[]).map(this.mapToCall);
  }

  async findByDescriptionPattern(pattern: string): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .ilike("description", `%${pattern}%`);
    if (error) {
      throw new RepositoryError(`Find by description failed: ${error.message}`);
    }
    return (data as DbCall[]).map(this.mapToCall);
  }

  async findByOrigin(origin: string): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("origine", origin);
    if (error) {
      throw new RepositoryError(`Find by origin failed: ${error.message}`);
    }
    return (data as DbCall[]).map(this.mapToCall);
  }

  async findByStatus(status: CallStatus): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("status", status);
    if (error) {
      throw new RepositoryError(`Find by status failed: ${error.message}`);
    }
    return (data as DbCall[]).map(this.mapToCall);
  }

  async count(params?: {
    status?: CallStatus;
    origin?: string;
    preparable?: boolean;
  }): Promise<number> {
    let query = this.sb
      .from("call")
      .select("*", { count: "exact", head: true });

    if (params?.status !== undefined) {
      query = query.eq("status", params.status);
    }
    if (params?.origin !== undefined) {
      query = query.eq("origine", params.origin);
    }
    if (params?.preparable !== undefined) {
      query = query
        .eq("preparedfortranscript", false)
        .not("transcription", "is", null);
    }

    const { count, error } = await query;
    if (error) {
      throw new RepositoryError(`Count failed: ${error.message}`);
    }
    return count ?? 0;
  }

  async findByContentHash(_hash: string): Promise<Call[]> {
    // À implémenter si/quand la colonne existe
    throw new RepositoryError("findByContentHash not implemented yet");
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.sb
      .from("call")
      .select("*", { count: "exact", head: true })
      .eq("callid", id);
    if (error) {
      throw new RepositoryError(`Exists failed: ${error.message}`);
    }
    return (count ?? 0) > 0;
  }

  // ============================================================================
  // MAPPING PERSISTENCE → DOMAINE
  // ============================================================================

  private mapToCall = (row: DbCall): Call => {
    // AudioFile depuis les colonnes
    const audio = row.filepath
      ? new AudioFile(row.filepath, row.audiourl ?? undefined)
      : undefined;

    // Transcription depuis le JSON
    let transcription: Transcription | undefined;
    if (row.transcription) {
      try {
        transcription = Transcription.fromJSON(row.transcription);
      } catch (error) {
        console.warn("Erreur parsing transcription JSON:", error);
        transcription = undefined;
      }
    }

    // Retourner l'entité Call complète
    return new Call(
      row.callid,
      row.filename ?? undefined,
      row.description ?? undefined,
      (row.status as CallStatus) ?? CallStatus.DRAFT,
      row.origine ?? undefined,
      audio,
      transcription,
      row.created_at ? new Date(row.created_at) : new Date(),
      row.updated_at ? new Date(row.updated_at) : new Date()
    );
  };
}
