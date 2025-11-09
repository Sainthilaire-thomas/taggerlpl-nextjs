// src/components/calls/infrastructure/supabase/SupabaseRelationsRepository.ts
import supabaseClient from "@/lib/supabaseClient";
import type {
  RelationsRepository,
  RelationsNextTurnDTO,
} from "../../domain/repositories/RelationsRepository";

export class SupabaseRelationsRepository implements RelationsRepository {
  async getNextTurnStats(callIds: string[]): Promise<RelationsNextTurnDTO[]> {
    if (!callIds?.length) return [];

    try {
      // SOLUTION 1: Utiliser la vue optimisée (recommandé)
      const { data, error } = await supabaseClient
        .from("call_relations_stats") // Vue pré-calculée
        .select(
          "call_id, total_turns, tagged_turns, completion_percent, status"
        )
        .in("call_id", callIds);

      if (error) {
        console.warn(
          "Vue call_relations_stats non disponible, fallback vers requête directe:",
          error
        );
        return this.getNextTurnStatsFallback(callIds);
      }

      const nowISO = new Date().toISOString();
      return (data || []).map((row) => ({
        callId: String(row.call_id),
        total: row.total_turns || 0,
        tagged: row.tagged_turns || 0,
        lastCheckedAt: nowISO,
      }));
    } catch (error) {
      console.error("Erreur lors de l'accès à la vue relations:", error);
      return this.getNextTurnStatsFallback(callIds);
    }
  }

  // SOLUTION 2: Fallback avec requête directe optimisée (par chunks)
  private async getNextTurnStatsFallback(
    callIds: string[]
  ): Promise<RelationsNextTurnDTO[]> {
    const CHUNK_SIZE = 50; // Limiter les requêtes par chunks pour éviter les timeouts
    const results: RelationsNextTurnDTO[] = [];

    // Traitement par chunks pour éviter les requêtes trop lourdes
    for (let i = 0; i < callIds.length; i += CHUNK_SIZE) {
      const chunk = callIds.slice(i, i + CHUNK_SIZE);

      try {
        const { data, error } = await supabaseClient
          .from("turntagged")
          .select("call_id, next_turn_tag")
          .in("call_id", chunk);

        if (error) throw error;

        // Agrégation locale optimisée
        const chunkResults = this.aggregateChunkData(chunk, data || []);
        results.push(...chunkResults);

        // Délai pour éviter le rate limiting
        if (i + CHUNK_SIZE < callIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error(`Erreur chunk ${i}-${i + CHUNK_SIZE}:`, error);
        // Ajouter des résultats vides pour ce chunk
        const emptyResults = chunk.map((id) => ({
          callId: String(id),
          total: 0,
          tagged: 0,
          lastCheckedAt: new Date().toISOString(),
        }));
        results.push(...emptyResults);
      }
    }

    return results;
  }

  private aggregateChunkData(
    callIds: string[],
    data: any[]
  ): RelationsNextTurnDTO[] {
    const map = new Map<string, { total: number; tagged: number }>();

    // Agrégation optimisée
    for (const row of data) {
      const id = String(row.call_id);
      const curr = map.get(id) || { total: 0, tagged: 0 };
      curr.total += 1;
      if (
        row.next_turn_tag != null &&
        String(row.next_turn_tag).trim().length > 0
      ) {
        curr.tagged += 1;
      }
      map.set(id, curr);
    }

    const nowISO = new Date().toISOString();
    return callIds.map((id) => {
      const agg = map.get(String(id)) || { total: 0, tagged: 0 };
      return {
        callId: String(id),
        total: agg.total,
        tagged: agg.tagged,
        lastCheckedAt: nowISO,
      };
    });
  }

  // SOLUTION 3: Méthode pour un seul call (pour debug)
  async getNextTurnStatsForSingleCall(
    callId: string
  ): Promise<RelationsNextTurnDTO | null> {
    try {
      // Essayer la vue d'abord
      const { data: viewData, error: viewError } = await supabaseClient
        .from("call_relations_stats")
        .select("call_id, total_turns, tagged_turns, completion_percent")
        .eq("call_id", callId)
        .single();

      if (!viewError && viewData) {
        return {
          callId: String(viewData.call_id),
          total: viewData.total_turns || 0,
          tagged: viewData.tagged_turns || 0,
          lastCheckedAt: new Date().toISOString(),
        };
      }

      // Fallback vers requête directe
      const { data, error } = await supabaseClient
        .from("turntagged")
        .select("call_id, next_turn_tag")
        .eq("call_id", callId);

      if (error) throw error;

      const total = data?.length || 0;
      const tagged =
        data?.filter(
          (row) =>
            row.next_turn_tag != null &&
            String(row.next_turn_tag).trim().length > 0
        ).length || 0;

      return {
        callId: String(callId),
        total,
        tagged,
        lastCheckedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Erreur pour l'appel ${callId}:`, error);
      return null;
    }
  }
}
