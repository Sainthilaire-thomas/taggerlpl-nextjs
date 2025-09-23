import type {
  DiarizationSegment,
  Word,
} from "@/components/calls/shared/types/TranscriptionTypes";

type DiarizationProvider = {
  inferSpeakers: (
    fileUrl: string,
    options?: {
      languageCode?: string;
      timeoutMs?: number;
      pollIntervalMs?: number;
    }
  ) => Promise<DiarizationSegment[]>;
};

export class DiarizationService {
  constructor(private readonly provider: DiarizationProvider) {}

  async inferSegments(
    audioUrl: string,
    opts?: {
      languageCode?: string;
      timeoutMs?: number;
      pollIntervalMs?: number;
    }
  ): Promise<DiarizationSegment[]> {
    return this.provider.inferSpeakers(audioUrl, opts);
  }

  /**
   * Assigne un 'turn' à chaque mot en fonction du segment de diarisation qui recouvre
   * le plus le mot. On utilise un mapping stable speaker->turnN dans l'ordre de découverte.
   * - Tolerance si pas de recouvrement: on choisit le segment le plus proche dans ±0.3s.
   */
  assignTurnsToWords(
    words: Word[],
    segments: DiarizationSegment[],
    opts?: { toleranceSec?: number }
  ): Word[] {
    const tolerance = opts?.toleranceSec ?? 0.3;

    // Mapping stable: speaker label -> turnN
    const speakerToTurn = new Map<string, string>();
    let nextTurnIndex = 1;
    const getTurn = (speaker: string): string => {
      if (!speakerToTurn.has(speaker)) {
        speakerToTurn.set(speaker, `turn${nextTurnIndex++}`);
      }
      return speakerToTurn.get(speaker)!;
    };

    const segs = [...segments].sort((a, b) => a.start - b.start);

    const overlap = (
      aStart: number,
      aEnd: number,
      bStart: number,
      bEnd: number
    ) => Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));

    return words.map((w) => {
      const ws = Math.min(w.startTime, w.endTime);
      const we = Math.max(w.startTime, w.endTime);

      // 1) Cherche le segment qui recouvre le plus le mot
      let best: { seg: DiarizationSegment; score: number } | null = null;
      for (const seg of segs) {
        const score = overlap(ws, we, seg.start, seg.end);
        if (score > 0 && (!best || score > best.score)) {
          best = { seg, score };
        }
      }

      // 2) Si rien ne recouvre, cherche le plus proche dans la tolérance
      if (!best) {
        let nearest: { seg: DiarizationSegment; dist: number } | null = null;
        const center = (ws + we) / 2;
        for (const seg of segs) {
          const dist =
            center < seg.start
              ? seg.start - center
              : center > seg.end
              ? center - seg.end
              : 0;
          if (dist <= tolerance && (!nearest || dist < nearest.dist)) {
            nearest = { seg, dist };
          }
        }
        if (nearest) {
          best = { seg: nearest.seg, score: 0 };
        }
      }

      if (!best) return { ...w }; // pas d’assignation

      const turn = getTurn(best.seg.speaker);
      return { ...w, turn };
    });
  }

  /**
   * Pipeline direct: infère les segments depuis l'URL audio puis assigne les turns aux words.
   */
  async diarizeWords(
    audioUrl: string,
    words: Word[],
    opts?: {
      languageCode?: string;
      timeoutMs?: number;
      pollIntervalMs?: number;
      toleranceSec?: number;
    }
  ): Promise<{ words: Word[]; segments: DiarizationSegment[] }> {
    const segments = await this.inferSegments(audioUrl, opts);
    const updated = this.assignTurnsToWords(words, segments, {
      toleranceSec: opts?.toleranceSec,
    });
    return { words: updated, segments };
  }
}
