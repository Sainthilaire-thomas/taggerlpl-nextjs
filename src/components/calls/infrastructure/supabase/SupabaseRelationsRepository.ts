// src/components/calls/infrastructure/supabase/SupabaseRelationsRepository.ts
import supabaseClient from "@/lib/supabaseClient"; // ajuste si besoin
import type {
  RelationsRepository,
  RelationsNextTurnDTO,
} from "../../domain/repositories/RelationsRepository";

/** Une ligne est "taguée" si next_turn_tag est non nul et non vide (après trim). */
function isTagged(val: unknown): boolean {
  if (val == null) return false;
  const s = String(val).trim();
  return s.length > 0;
}

export class SupabaseRelationsRepository implements RelationsRepository {
  async getNextTurnStats(callIds: string[]): Promise<RelationsNextTurnDTO[]> {
    if (!callIds?.length) return [];

    // On récupère juste les colonnes utiles pour agréger en JS
    const { data, error } = await supabaseClient
      .from("turntagged")
      .select("call_id, next_turn_tag")
      .in("call_id", callIds);

    if (error) throw error;

    // Agrégation côté JS (simple, efficace pour une page de tableau)
    const map = new Map<string, { total: number; tagged: number }>();

    for (const row of data ?? []) {
      const id = String((row as any).call_id);
      const curr = map.get(id) ?? { total: 0, tagged: 0 };
      curr.total += 1;
      if (isTagged((row as any).next_turn_tag)) curr.tagged += 1;
      map.set(id, curr);
    }

    const nowISO = new Date().toISOString();
    const out: RelationsNextTurnDTO[] = [];

    for (const id of callIds) {
      const agg = map.get(String(id)) ?? { total: 0, tagged: 0 };
      out.push({
        callId: String(id),
        total: agg.total,
        tagged: agg.tagged,
        lastCheckedAt: nowISO,
      });
    }

    return out;
  }
}
