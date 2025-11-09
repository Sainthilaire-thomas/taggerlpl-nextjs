import type { RelationsNextTurnDTO } from "../repositories/RelationsRepository";

// Vue “métier” enrichie pour l’UI
export type RelationsNextTurnView = RelationsNextTurnDTO & {
  percent: number; // 0..100 (arrondi)
  status: "complete" | "partial" | "incomplete"; // ✅/⚠️/❌
};

export interface RelationsService {
  getNextTurnStats(callIds: string[]): Promise<RelationsNextTurnView[]>;
}
