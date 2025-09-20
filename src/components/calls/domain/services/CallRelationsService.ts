// src/components/calls/application/services/CallRelationsService.ts
import type {
  RelationsRepository,
  RelationsNextTurnDTO,
} from "../../domain/repositories/RelationsRepository";
import type {
  RelationsService,
  RelationsNextTurnView,
} from "../../domain/services/RelationsService";

export class CallRelationsService implements RelationsService {
  constructor(private readonly repo: RelationsRepository) {}

  async getNextTurnStats(callIds: string[]): Promise<RelationsNextTurnView[]> {
    if (!callIds.length) return [];
    const rows: RelationsNextTurnDTO[] = await this.repo.getNextTurnStats(
      callIds
    );
    return rows.map((r) => {
      const percent = r.total > 0 ? Math.round((r.tagged / r.total) * 100) : 0;
      const status =
        percent === 100 ? "complete" : percent >= 50 ? "partial" : "incomplete";
      return { ...r, percent, status };
    });
  }
}
