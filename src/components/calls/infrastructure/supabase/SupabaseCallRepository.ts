// src/components/calls/infrastructure/SupabaseCallRepository.ts
import supabaseClient from "@/lib/supabaseClient";
import { Call } from "../../domain/entities/Call"; // ajuste les chemins si besoin
import { AudioFile } from "../../domain/entities/AudioFile";
import { CallRepository } from "../../domain/repositories/CallRepository";
import { RepositoryError } from "../../shared/exceptions/DomainExceptions";
import { CallStatus } from "../../shared/types/CallStatus";

type DbCall = {
  callid: string;
  filename?: string | null;
  description?: string | null;
  status?: CallStatus | null;
  origine?: string | null;
  filepath?: string | null;
  audiourl?: string | null;
  transcription?: unknown | null; // JSONB
  is_tagging_call?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export class SupabaseCallRepository implements CallRepository {
  constructor(private sb = supabaseClient) {}

  // CREATE / UPDATE / DELETE

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
      is_tagging_call: true,
    };

    const { error } = await this.sb.from("call").insert([payload]);
    if (error)
      throw new RepositoryError(`Failed to save call: ${error.message}`);
  }

  // Deux formes supportées : update(call) OU update(id, partial)
  async update(call: Call): Promise<void>;
  async update(
    id: string,
    changes: Partial<Call>,
    ..._rest: any[]
  ): Promise<void>;
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
        is_tagging_call: true,
        updated_at: new Date().toISOString(),
      } as Partial<DbCall>;

      const { error } = await this.sb
        .from("call")
        .update(payload)
        .eq("callid", call.id);
      if (error)
        throw new RepositoryError(`Failed to update call: ${error.message}`);
      return;
    }

    const id = callOrId;
    const payload = this.mapPartialCallToDb(changes ?? {});
    if (Object.keys(payload).length === 0) return;

    const { error } = await this.sb
      .from("call")
      .update(payload)
      .eq("callid", id);
    if (error)
      throw new RepositoryError(`Failed to update call: ${error.message}`);
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

    if (Object.keys(out).length > 0)
      (out as any).updated_at = new Date().toISOString();
    return out;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.sb.from("call").delete().eq("callid", id);
    if (error)
      throw new RepositoryError(`Failed to delete call: ${error.message}`);
  }

  // READ

  async findById(id: string): Promise<Call | null> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("callid", id)
      .maybeSingle<DbCall>();

    if (error) throw new RepositoryError(`Find by id failed: ${error.message}`);
    if (!data) return null;
    return this.mapToCall(data);
  }

  async findAll(): Promise<Call[]> {
    const { data, error } = await this.sb.from("call").select("*");
    if (error) throw new RepositoryError(`Find all failed: ${error.message}`);
    return (data as DbCall[]).map(this.mapToCall);
  }

  async findByFilename(filename: string): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("filename", filename);
    if (error)
      throw new RepositoryError(`Find by filename failed: ${error.message}`);
    return (data as DbCall[]).map(this.mapToCall);
  }

  async findByDescriptionPattern(pattern: string): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .ilike("description", `%${pattern}%`);
    if (error)
      throw new RepositoryError(`Find by description failed: ${error.message}`);
    return (data as DbCall[]).map(this.mapToCall);
  }

  // 🔹 demandées par ton interface
  async findByOrigin(origin: string): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("origine", origin);
    if (error)
      throw new RepositoryError(`Find by origin failed: ${error.message}`);
    return (data as DbCall[]).map(this.mapToCall);
  }

  async findByStatus(status: CallStatus): Promise<Call[]> {
    const { data, error } = await this.sb
      .from("call")
      .select("*")
      .eq("status", status);
    if (error)
      throw new RepositoryError(`Find by status failed: ${error.message}`);
    return (data as DbCall[]).map(this.mapToCall);
  }

  async count(params?: {
    status?: CallStatus;
    origin?: string;
  }): Promise<number> {
    let query = this.sb
      .from("call")
      .select("*", { count: "exact", head: true });
    if (params?.status !== undefined) query = query.eq("status", params.status);
    if (params?.origin !== undefined)
      query = query.eq("origine", params.origin);

    const { count, error } = await query;
    if (error) throw new RepositoryError(`Count failed: ${error.message}`);
    return count ?? 0;
  }

  async findByContentHash(_hash: string): Promise<Call[]> {
    // À implémenter si/qd la colonne existe
    throw new RepositoryError("findByContentHash not implemented yet");
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.sb
      .from("call")
      .select("*", { count: "exact", head: true })
      .eq("callid", id);
    if (error) throw new RepositoryError(`Exists failed: ${error.message}`);
    return (count ?? 0) > 0;
  }

  // --- mapping persistence → domaine

  private mapToCall = (row: DbCall): Call => {
    const audio = row.filepath
      ? new AudioFile(row.filepath, row.audiourl ?? undefined)
      : undefined;

    return new Call(
      row.callid,
      row.filename ?? undefined,
      row.description ?? undefined,
      (row.status as CallStatus) ?? CallStatus.DRAFT,
      row.origine ?? undefined,
      audio,
      (row.transcription as any) ?? undefined,
      row.created_at ? new Date(row.created_at) : new Date(),
      row.updated_at ? new Date(row.updated_at) : new Date()
    );
  };
}
