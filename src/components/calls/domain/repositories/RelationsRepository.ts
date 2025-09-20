// Types retournés par l’infra (Supabase)
export type RelationsNextTurnDTO = {
  callId: string;
  total: number; // nb total de lignes turntagged pour ce call
  tagged: number; // nb où next_turn_tag est non vide (trim)
  lastCheckedAt?: string; // ISO optionnel (pour tooltip)
};

export interface RelationsRepository {
  getNextTurnStats(callIds: string[]): Promise<RelationsNextTurnDTO[]>;
}
