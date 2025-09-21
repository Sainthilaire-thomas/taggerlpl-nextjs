// src/components/calls/infrastructure/supabase/SupabaseCallRepository.ts - VERSION COMPLÈTE CORRIGÉE

import supabaseClient from "@/lib/supabaseClient";
import { Call } from "../../domain/entities/Call";
import { AudioFile } from "../../domain/entities/AudioFile";
import { CallRepository } from "../../domain/repositories/CallRepository";
import { RepositoryError } from "../../shared/exceptions/DomainExceptions";
import { CallStatus } from "../../shared/types/CallStatus";
import { Transcription } from "../../domain/entities/Transcription";
import { CallExtended } from "../../domain/entities/CallExtended"; // NOUVEAU IMPORT

type DbCall = {
  callid: string | number;
  filename?: string | null;
  filepath?: string | null;
  upload?: boolean | null;
  duree?: string | null;
  status?: string | null;
  origine?: string | null;
  description?: string | null;
  transcription?: unknown | null;
  is_tagging_call?: boolean | null;
  preparedfortranscript?: boolean | null;
  audiourl?: string | null;
  // Pas de created_at/updated_at dans votre schéma
};

export class SupabaseCallRepository implements CallRepository {
  private cache = new Map<string, { data: Call[]; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 secondes

  constructor(private sb = supabaseClient) {}

  // ============================================================================
  // 🚀 NOUVELLES MÉTHODES POUR CALLEXTENDED ET CYCLE DE VIE
  // ============================================================================

  /**
   * Vérifie si un appel est présent dans la table turntagged
   */
  async isCallTagged(callId: string): Promise<boolean> {
    try {
      const { count, error } = await this.sb
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
      return false;
    }
  }

  /**
   * Trouve un appel par ID avec toutes ses informations de workflow enrichies
   */
  async findByIdWithWorkflow(id: string): Promise<CallExtended | null> {
    try {
      const { data, error } = await this.sb
        .from("call")
        .select("*")
        .eq("callid", id)
        .maybeSingle<DbCall>();

      if (error) {
        throw new RepositoryError(
          `Find by id with workflow failed: ${error.message}`
        );
      }
      if (!data) return null;

      // Vérifier si l'appel est taggé
      const isTagged = await this.isCallTagged(id);

      return CallExtended.fromDatabaseWithWorkflow(data, isTagged);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de l'appel avec workflow ${id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Récupère plusieurs appels avec leurs informations de workflow
   * Optimisé pour les performances avec requêtes en parallèle
   */
  async findManyWithWorkflow(ids: string[]): Promise<CallExtended[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      // Récupérer les données de base en une seule requête
      const { data: callsData, error: callsError } = await this.sb
        .from("call")
        .select("*")
        .in("callid", ids);

      if (callsError) {
        throw new RepositoryError(
          `Erreur lors de la récupération des appels: ${callsError.message}`
        );
      }

      if (!callsData || callsData.length === 0) {
        return [];
      }

      // Vérifier en parallèle quels appels sont taggés
      const taggedStatusPromises = callsData.map(async (callData) => {
        const isTagged = await this.isCallTagged(String(callData.callid));
        return {
          callData,
          isTagged,
        };
      });

      const enrichedData = await Promise.all(taggedStatusPromises);

      // Construire les instances CallExtended
      const calls = enrichedData.map(({ callData, isTagged }) =>
        CallExtended.fromDatabaseWithWorkflow(callData, isTagged)
      );

      return calls;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des appels avec workflow:",
        error
      );
      throw error;
    }
  }

  /**
   * Met à jour les flags de workflow d'un appel
   */
  async updateWorkflowFlags(
    id: string,
    flags: {
      preparedfortranscript?: boolean;
      is_tagging_call?: boolean;
    }
  ): Promise<CallExtended> {
    try {
      const { data, error } = await this.sb
        .from("call")
        .update(flags)
        .eq("callid", id)
        .select("*")
        .single();

      if (error) {
        throw new RepositoryError(
          `Erreur lors de la mise à jour des flags pour l'appel ${id}: ${error.message}`
        );
      }

      if (!data) {
        throw new RepositoryError(`Appel ${id} non trouvé après mise à jour`);
      }

      // Vérifier le statut taggé et retourner CallExtended
      const isTagged = await this.isCallTagged(id);

      // Invalider le cache
      this.clearCache();

      return CallExtended.fromDatabaseWithWorkflow(data, isTagged);
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour des flags pour l'appel ${id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Trouve tous les appels actifs de tagging avec informations enrichies
   */
  async findActiveTaggingCallsWithWorkflow(): Promise<CallExtended[]> {
    try {
      const { data, error } = await this.sb
        .from("call")
        .select("*")
        .eq("is_tagging_call", true)
        .eq("preparedfortranscript", true)
        .order("callid", { ascending: false });

      if (error) {
        throw new RepositoryError(
          `Find active tagging calls with workflow failed: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Enrichir avec les informations de workflow
      const callIds = data.map((call) => String(call.callid));
      return this.findManyWithWorkflow(callIds);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des appels de tagging actifs:",
        error
      );
      throw error;
    }
  }

  /**
   * Trouve les appels préparables avec informations enrichies
   */
  async findCallsForPreparationWithWorkflow(): Promise<CallExtended[]> {
    try {
      const { data, error } = await this.sb
        .from("call")
        .select("*")
        .eq("preparedfortranscript", false)
        .not("transcription", "is", null)
        .order("callid", { ascending: false });

      if (error) {
        throw new RepositoryError(
          `Find preparation calls with workflow failed: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Enrichir avec les informations de workflow
      const callIds = data.map((call) => String(call.callid));
      return this.findManyWithWorkflow(callIds);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des appels préparables:",
        error
      );
      throw error;
    }
  }

  // ============================================================================
  // 🔄 MODIFICATION DE LA MÉTHODE mapToCall POUR UTILISER CALLEXTENDED
  // ============================================================================

  /**
   * NOUVELLE VERSION : Retourne CallExtended au lieu de Call
   * Compatible avec l'existant car CallExtended hérite de Call
   */
  private mapToCall = (row: DbCall): CallExtended => {
    try {
      const callId = String(row.callid);

      if (!callId || callId === "undefined" || callId === "null") {
        throw new Error(`Invalid callId: ${callId}`);
      }

      // Par défaut, considérer comme non taggé (sera vérifié séparément si nécessaire)
      // Cette approche évite de multiplier les requêtes pour chaque mapToCall
      const isTagged = false;

      return CallExtended.fromDatabaseWithWorkflow(row, isTagged);
    } catch (error) {
      console.error("❌ [SupabaseCallRepository] Erreur mapping call:", error);

      const fallbackId = String(row.callid || `fallback_${Date.now()}`);

      // Créer un CallExtended de fallback
      return new CallExtended(
        fallbackId,
        row.filename || "Fichier inconnu",
        row.description || undefined,
        CallStatus.DRAFT,
        row.origine || undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
        Boolean(row.preparedfortranscript),
        Boolean(row.is_tagging_call),
        false // isTagged par défaut
      );
    }
  };

  // ============================================================================
  // 🔄 MÉTHODES UPDATE ENRICHIES POUR SUPPORTER LES NOUVEAUX CHAMPS
  // ============================================================================

  /**
   * Version surchargée de update pour supporter CallExtended et les flags de workflow
   */
  async update(call: Call): Promise<void>;
  async update(
    id: string,
    changes: Partial<
      Call & {
        preparedfortranscript?: boolean;
        is_tagging_call?: boolean;
      }
    >
  ): Promise<void>;
  async update(
    callOrId: Call | string,
    changes?: Partial<
      Call & {
        preparedfortranscript?: boolean;
        is_tagging_call?: boolean;
      }
    >
  ): Promise<void> {
    if (typeof callOrId !== "string") {
      const call = callOrId;
      const audio = call.getAudioFile();

      // Si c'est une instance CallExtended, inclure les flags de workflow
      const isCallExtended = call instanceof CallExtended;

      const payload = {
        filename: call.filename ?? null,
        description: call.description ?? null,
        status: call.status ?? null,
        origine: call.origin ?? null,
        filepath: audio?.path ?? null,
        audiourl: audio?.url ?? null,
        transcription: call.getTranscription() ?? null,
        // Inclure les flags de workflow si c'est CallExtended
        ...(isCallExtended && {
          preparedfortranscript: (call as CallExtended).preparedForTranscript,
          is_tagging_call: (call as CallExtended).isTaggingCall,
        }),
      } as Partial<DbCall>;

      const { error } = await this.sb
        .from("call")
        .update(payload)
        .eq("callid", call.id);
      if (error) {
        throw new RepositoryError(`Failed to update call: ${error.message}`);
      }

      this.clearCache();
      return;
    }

    // Version avec ID et changes partiels
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

    this.clearCache();
  }

  /**
   * Version enrichie de mapPartialCallToDb pour supporter les nouveaux champs
   */
  private mapPartialCallToDb(
    changes: Partial<
      Call & {
        preparedfortranscript?: boolean;
        is_tagging_call?: boolean;
      }
    >
  ): Partial<DbCall> {
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

    // NOUVEAU : Support des flags de workflow
    if ("preparedfortranscript" in changes) {
      out.preparedfortranscript = Boolean(changes.preparedfortranscript);
    }
    if ("is_tagging_call" in changes) {
      out.is_tagging_call = Boolean(changes.is_tagging_call);
    }

    return out;
  }

  // ============================================================================
  // 🚀 OPTIMISATIONS DE PERFORMANCE (CONSERVÉES)
  // ============================================================================

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📊 Cache HIT pour ${key}`);
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: Call[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`💾 Cache SET pour ${key} - ${data.length} items`);
  }

  private clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Cache vidé");
  }

  // ============================================================================
  // ✅ MÉTHODES EXISTANTES (CONSERVÉES DE VOTRE VERSION ORIGINALE)
  // ============================================================================

  async findCallsForPreparationPaginated(
    options: {
      offset?: number;
      limit?: number;
      preload?: boolean;
    } = {}
  ): Promise<{
    calls: Call[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const { offset = 0, limit = 50, preload = false } = options;
    const cacheKey = `preparation_${offset}_${limit}`;

    if (!preload) {
      const cached = this.getCachedData<{
        calls: Call[];
        totalCount: number;
        hasMore: boolean;
      }>(cacheKey);
      if (cached) return cached;
    }

    try {
      const { count, error: countError } = await this.sb
        .from("call")
        .select("*", { count: "exact", head: true })
        .eq("preparedfortranscript", false)
        .not("transcription", "is", null);

      if (countError) throw countError;

      const { data, error } = await this.sb
        .from("call")
        .select("*")
        .eq("preparedfortranscript", false)
        .not("transcription", "is", null)
        .order("callid", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const calls = (data as DbCall[]).map(this.mapToCall);
      const totalCount = count || 0;
      const hasMore = offset + limit < totalCount;

      const result = { calls, totalCount, hasMore };
      this.setCachedData(cacheKey, calls);

      console.log(
        `📊 Repository PAGINATED: ${calls.length}/${totalCount} appels (offset: ${offset})`
      );

      return result;
    } catch (error) {
      throw new RepositoryError(
        `Find preparation calls paginated failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async findCallsByOriginCached(origin: string): Promise<Call[]> {
    const cacheKey = `origin_${origin}`;
    const cached = this.getCachedData<Call[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("origine", origin)
      .order("callid", { ascending: false });

    if (error) {
      throw new RepositoryError(
        `Find by origin cached failed: ${error.message}`
      );
    }

    const calls = (data as DbCall[]).map(this.mapToCall);
    this.setCachedData(cacheKey, calls);

    return calls;
  }

  async getQuickStats(): Promise<{
    total: number;
    preparables: number;
    conflictuels: number;
    withAudio: number;
    origins: { origin: string; count: number }[];
  }> {
    const cacheKey = "quick_stats";
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.sb
        .from("call")
        .select(
          "origine, status, filepath, transcription, preparedfortranscript"
        );

      if (error) throw error;

      const stats = (data as any[]).reduce(
        (acc, row) => {
          acc.total++;

          if (row.transcription && !row.preparedfortranscript) {
            acc.preparables++;
          }

          if (row.status === "conflictuel") {
            acc.conflictuels++;
          }

          if (row.filepath) {
            acc.withAudio++;
          }

          const origin = row.origine || "Aucune origine";
          const existingOrigin = acc.origins.find((o) => o.origin === origin);
          if (existingOrigin) {
            existingOrigin.count++;
          } else {
            acc.origins.push({ origin, count: 1 });
          }

          return acc;
        },
        {
          total: 0,
          preparables: 0,
          conflictuels: 0,
          withAudio: 0,
          origins: [] as { origin: string; count: number }[],
        }
      );

      stats.origins.sort((a, b) => b.count - a.count);
      this.setCachedData(cacheKey, stats);

      console.log(
        `📊 Quick stats: ${stats.total} total, ${stats.origins.length} origines`
      );

      return stats;
    } catch (error) {
      throw new RepositoryError(
        `Get quick stats failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async findCallsForPreparation(): Promise<Call[]> {
    const result = await this.findCallsForPreparationPaginated({ limit: 100 });
    return result.calls;
  }

  async findActiveTaggingCalls(): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("is_tagging_call", true)
      .eq("preparedfortranscript", true)
      .order("callid", { ascending: false });

    if (error) {
      throw new RepositoryError(
        `Find active tagging calls failed: ${error.message}`
      );
    }

    return (data as DbCall[]).map(this.mapToCall);
  }

  async markAsPrepared(callId: string): Promise<void> {
    const { error } = await this.sb
      .from("call")
      .update({
        preparedfortranscript: true,
      })
      .eq("callid", callId);

    if (error) {
      throw new RepositoryError(`Mark as prepared failed: ${error.message}`);
    }

    this.clearCache();
    console.log(`✅ Repository: Appel ${callId} marqué comme préparé`);
  }

  async markMultipleAsPrepared(callIds: string[]): Promise<{
    success: string[];
    errors: { callId: string; error: string }[];
  }> {
    const results = {
      success: [] as string[],
      errors: [] as { callId: string; error: string }[],
    };

    try {
      const { data, error } = await this.sb
        .from("call")
        .update({
          preparedfortranscript: true,
        })
        .in("callid", callIds)
        .select("callid");

      if (error) {
        callIds.forEach((id) => {
          results.errors.push({ callId: id, error: error.message });
        });
      } else {
        const updatedIds = (data as any[])?.map((row) => row.callid) || [];
        results.success.push(...updatedIds);

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

    this.clearCache();

    console.log(
      `📊 Repository: Lot préparé - ${results.success.length} succès, ${results.errors.length} erreurs`
    );
    return results;
  }

  async save(call: Call): Promise<void> {
    const audio = call.getAudioFile();
    const isCallExtended = call instanceof CallExtended;

    const payload: DbCall = {
      callid: call.id,
      filename: call.filename ?? null,
      description: call.description ?? null,
      status: call.status ?? null,
      origine: call.origin ?? null,
      filepath: audio?.path ?? null,
      audiourl: audio?.url ?? null,
      transcription: call.getTranscription() ?? null,
      preparedfortranscript: isCallExtended
        ? (call as CallExtended).preparedForTranscript
        : false,
      is_tagging_call: isCallExtended
        ? (call as CallExtended).isTaggingCall
        : false,
    };

    const { error } = await this.sb.from("call").insert([payload]);
    if (error) {
      throw new RepositoryError(`Failed to save call: ${error.message}`);
    }

    this.clearCache();
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.sb.from("call").delete().eq("callid", id);
    if (error) {
      throw new RepositoryError(`Failed to delete call: ${error.message}`);
    }
    this.clearCache();
  }

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
    if (limit !== undefined) {
      const result = await this.findCallsForPreparationPaginated({
        offset: offset || 0,
        limit,
      });
      return result.calls;
    }

    let query = this.sb.from("call").select("*");
    if (offset !== undefined) {
      query = query.range(offset, offset + 1000 - 1);
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

  async findByOrigin(origin: string): Promise<Call[]> {
    return this.findCallsByOriginCached(origin);
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

  async findByContentHash(_hash: string): Promise<Call[]> {
    throw new RepositoryError("findByContentHash not implemented yet");
  }

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
      .eq("preparedfortranscript", false)
      .not("transcription", "is", null);

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

    if (filters.origin && filters.origin !== "all") {
      query = query.eq("origine", filters.origin);
    }

    if (filters.hasAudio !== undefined) {
      if (filters.hasAudio) {
        query = query.not("filepath", "is", null);
      } else {
        query = query.is("filepath", null);
      }
    }

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

    return (data as DbCall[]).map(this.mapToCall);
  }

  async getOriginStatistics(): Promise<
    Array<{
      origin: string;
      total: number;
      preparables: number;
      conflictuels: number;
      withAudio: number;
    }>
  > {
    const stats = await this.getQuickStats();

    return stats.origins.map(({ origin, count }) => ({
      origin,
      total: count,
      preparables: 0, // À calculer si nécessaire
      conflictuels: 0, // À calculer si nécessaire
      withAudio: 0, // À calculer si nécessaire
    }));
  }

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
}
