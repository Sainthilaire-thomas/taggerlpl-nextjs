/**
 * Service métier: normalisation ASR → words[], diarisation → assignTurns,
 * édition (split/merge/reassign/insertTag), validation.
 */

import {
  Word,
  TranscriptionJson,
  DiarizationSegment,
  AsrSegment,
} from "../../shared/types/TranscriptionTypes";

/** Options internes de segmentation (découpe en segments courts) */
type SegmenterOptions = {
  maxDurSec?: number; // durée max d’un segment (défaut 20s)
  maxWords?: number; // nb max de mots (défaut 60)
  maxGapSec?: number; // silence déclencheur (défaut 0.8s)
  minDurSec?: number; // éviter les micro-segments (défaut 3s)
};

export class TranscriptionASRService {
  /** Mappe le JSON "verbose" OpenAI vers ton format { words[] } + { segments[] } */
  normalize(
    rawOpenAI: any,
    opts?: { language?: string; source?: "asr:auto" | "edited" }
  ): TranscriptionJson {
    // 1) Extraction robuste des mots depuis le JSON OpenAI (ou fallback)
    const words: Word[] = this.extractWordsFromOpenAI(rawOpenAI);

    // 2) Tri (sécurité)
    words.sort((a, b) => a.startTime - b.startTime);

    // 3) Métadonnées
    const lastEnd = words.length > 0 ? words[words.length - 1].endTime : 0;
    const durationFromRaw =
      typeof rawOpenAI?.duration === "number"
        ? Number(rawOpenAI.duration)
        : undefined;
    const durationSec =
      typeof durationFromRaw === "number" && isFinite(durationFromRaw)
        ? durationFromRaw
        : lastEnd;

    const meta = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      source: opts?.source ?? "asr:auto",
      language: opts?.language ?? "fr-FR",
      durationSec,
    };

    // 4) ✅ Segmentation courte (découpe) à partir des words normalisés
    const segments = this.segmentWords(words);

    // 5) Retour rétro-compatible (words) + segments pour l’UI/alignement local
    return { words, segments, meta };
  }

  /** Extraction tolérante aux shapes OpenAI: segments[].words[] ou segments[].text ou text global */
  private extractWordsFromOpenAI(rawOpenAI: any): Word[] {
    const out: Word[] = [];
    const segs = rawOpenAI?.segments ?? [];

    // 1) Cas "segments[].words[]" (idéal)
    if (Array.isArray(segs) && segs.length > 0) {
      for (const s of segs) {
        const w = s?.words ?? [];
        if (Array.isArray(w) && w.length > 0) {
          for (const ww of w) {
            const text = ww?.word ?? ww?.text ?? "";
            const start = Number(ww?.start ?? s?.start ?? 0);
            const end = Number(ww?.end ?? s?.end ?? start);
            if (
              text &&
              Number.isFinite(start) &&
              Number.isFinite(end) &&
              end > start
            ) {
              out.push({ text, startTime: start, endTime: end });
            }
          }
        } else if (typeof s?.text === "string") {
          // 2) Cas "segment text sans words": on tokenise et on répartit dans [s.start, s.end]
          const start = Number(s?.start ?? 0);
          const end = Number(s?.end ?? start);
          const tokens = s.text.trim().split(/\s+/).filter(Boolean);
          const dur = Math.max(0, end - start);

          if (tokens.length && dur > 0) {
            const step = dur / tokens.length;
            let t = start;
            for (const tok of tokens) {
              const next = Math.min(end, t + step);
              out.push({ text: tok, startTime: t, endTime: next });
              t = next;
            }
          } else if (tokens.length) {
            // Durée inconnue (0 ou absente) → repli 300ms par token
            let t = start;
            for (const tok of tokens) {
              const next = t + 0.3;
              out.push({ text: tok, startTime: t, endTime: next });
              t = next;
            }
          }
        }
      }
    } else if (typeof rawOpenAI?.text === "string") {
      // 3) Cas "text global" sans segments
      const tokens = rawOpenAI.text.trim().split(/\s+/).filter(Boolean);
      const durFromRaw = Number(rawOpenAI?.duration);
      if (tokens.length) {
        if (Number.isFinite(durFromRaw) && durFromRaw > 0) {
          const step = durFromRaw / tokens.length;
          let t = 0;
          for (const tok of tokens) {
            const next = Math.min(durFromRaw, t + step);
            out.push({ text: tok, startTime: t, endTime: next });
            t = next;
          }
        } else {
          // Repli : 300ms par token
          let t = 0;
          for (const tok of tokens) {
            const next = t + 0.3;
            out.push({ text: tok, startTime: t, endTime: next });
            t = next;
          }
        }
      }
    }

    // Tri
    out.sort((a, b) => a.startTime - b.startTime);
    return out;
  }

  /** Segmente les mots en blocs courts (durée, nombre de mots, silences) */
  private segmentWords(words: Word[], opts?: SegmenterOptions): AsrSegment[] {
    const {
      maxDurSec = 20,
      maxWords = 60,
      maxGapSec = 0.8,
      minDurSec = 3,
    } = opts ?? {};

    const segs: AsrSegment[] = [];
    if (!Array.isArray(words) || words.length === 0) return segs;

    let cur: Word[] = [];
    let segStart = words[0].startTime;

    const flush = () => {
      if (!cur.length) return;
      const start = cur[0].startTime;
      const end = cur[cur.length - 1].endTime;
      const dur = end - start;

      if (dur < minDurSec && segs.length > 0) {
        // Fusion avec le précédent si trop court
        const prev = segs[segs.length - 1];
        const merged = [...prev.words, ...cur];
        segs[segs.length - 1] = {
          ...prev,
          end: merged[merged.length - 1].endTime,
          text: merged.map((w) => w.text).join(" "),
          words: merged,
        };
      } else {
        segs.push({
          id: `seg_${String(segs.length + 1).padStart(4, "0")}`,
          start,
          end,
          text: cur.map((w) => w.text).join(" "),
          words: cur,
        });
      }
      cur = [];
    };

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const last = cur[cur.length - 1];
      const gap = last ? w.startTime - last.endTime : 0;
      const durIfAdd = w.endTime - segStart;

      const shouldCut =
        (last && gap > maxGapSec) ||
        cur.length >= maxWords ||
        durIfAdd > maxDurSec;

      if (shouldCut) {
        flush();
        segStart = w.startTime;
      }
      cur.push(w);
    }
    flush();

    return segs;
  }

  /** Affecte un 'turn' à chaque mot en fonction des segments de diarisation (rapide) */
  assignTurns(words: Word[], diar: DiarizationSegment[]): Word[] {
    if (!Array.isArray(words) || !Array.isArray(diar)) return words;

    // Avance simultanée
    let segIdx = 0;
    const diarSorted = [...diar].sort((a, b) => a.start - b.start);

    for (const w of words) {
      while (
        segIdx < diarSorted.length - 1 &&
        w.startTime >= diarSorted[segIdx].end
      ) {
        segIdx++;
      }
      const seg = diarSorted[segIdx];

      if (seg && w.endTime > seg.start && w.startTime < seg.end) {
        // chevauchement → on assigne le speaker de seg
        w.turn = seg.speaker;
      } else {
        // si pas de segment couvrant, laisser vide (ou hériter du précédent si tu préfères)
        if (!w.turn) w.turn = undefined;
      }
    }

    return words;
  }

  /**
   * Variante d’alignement plus robuste :
   * - Choisit, pour chaque mot, le locuteur avec le MAX d’overlap relatif (≥ minOverlapRatio)
   * - Option d’inertie pour éviter des bascules trop fréquentes
   */
  assignTurnsOverlap(
    words: Word[],
    diar: DiarizationSegment[],
    opts?: { minOverlapRatio?: number; inertia?: boolean }
  ): Word[] {
    if (!Array.isArray(words) || !Array.isArray(diar)) return words;
    const MINR = opts?.minOverlapRatio ?? 0.2; // 20% du mot doit chevaucher un segment
    const inertia = opts?.inertia ?? true;

    const diarSorted = [...diar].sort((a, b) => a.start - b.start);
    let j = 0;
    let lastTurn: string | undefined;

    for (const w of words) {
      // placer j sur le premier segment susceptible de chevaucher w
      while (j < diarSorted.length && diarSorted[j].end <= w.startTime) j++;

      let bestSpk: string | undefined;
      let bestOv = 0;

      for (
        let k = j;
        k < diarSorted.length && diarSorted[k].start < w.endTime;
        k++
      ) {
        const s = diarSorted[k];
        const ov = Math.max(
          0,
          Math.min(w.endTime, s.end) - Math.max(w.startTime, s.start)
        );
        if (ov > bestOv) {
          bestOv = ov;
          bestSpk = s.speaker;
        }
      }

      const dur = Math.max(0.001, w.endTime - w.startTime);
      if (bestSpk && bestOv / dur >= MINR) {
        w.turn = bestSpk;
        lastTurn = w.turn;
      } else if (inertia && lastTurn) {
        w.turn = lastTurn;
      } else {
        w.turn = undefined;
      }
    }
    return words;
  }

  /** Réassigne un turn sur un intervalle de temps [t1, t2] */
  reassignTurn(words: Word[], t1: number, t2: number, toTurn: string): Word[] {
    const [a, b] = t1 <= t2 ? [t1, t2] : [t2, t1];
    return words.map((w) => {
      if (w.endTime <= a || w.startTime >= b) return w; // hors intervalle
      return { ...w, turn: toTurn };
    });
  }

  /** Split logique au temps t (entre mots) : on choisit le pivot de frontière le plus proche */
  splitAt(words: Word[], t: number): Word[] {
    if (!Number.isFinite(t)) return words;

    const first = words[0];
    const last = words[words.length - 1];
    if (!first || !last || t <= first.startTime || t >= last.endTime)
      return words;

    // Cherche la frontière entre mots la plus proche de t (ne coupe pas un mot)
    let bestIdx = -1;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < words.length - 1; i++) {
      const boundary = words[i].endTime;
      const dist = Math.abs(boundary - t);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    // Ici, on ne modifie pas réellement le tableau (split "logique" pour l’UI).
    // Si tu veux matérialiser un marker, tu peux insérer un mot fantôme ici.
    return words;
  }

  /** Merge logique entre t1 et t2 (ne modifie pas les mots; utile pour l’UI/segments) */
  mergeRange(words: Word[], _t1: number, _t2: number): Word[] {
    // Rien à faire au grain du mot ; le merge se fait au niveau "segments".
    return words;
  }

  /** Insère des balises analytiques dans text + synchronise le champ type si besoin */
  insertTag(words: Word[], t1: number, t2: number, tagName: string): Word[] {
    const [a, b] = t1 <= t2 ? [t1, t2] : [t2, t1];
    let started = false;

    return words.map((w) => {
      const inRange = !(w.endTime <= a || w.startTime >= b);
      let text = w.text;

      if (inRange) {
        if (!started) {
          text = `[${tagName}] ${text}`;
          started = true;
        }
      } else if (started) {
        // fermer la balise au premier mot après la fin
        text = `${text} [/${tagName}]`;
        started = false;
      }

      return { ...w, text };
    });
  }

  /** Validation globale: temps, tours, balises (simplifiée) */
  validateAll(words: Word[]): { ok: boolean; warnings: string[] } {
    const warnings: string[] = [];
    if (!Array.isArray(words) || words.length === 0) {
      return { ok: false, warnings: ["Aucun mot dans la transcription."] };
    }

    // Ordre temporel + durées
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].startTime > words[i + 1].startTime) {
        warnings.push(`Ordre temporel non croissant à l'index ${i}.`);
        break;
      }
      if (words[i].endTime < words[i].startTime) {
        warnings.push(`Durée négative détectée à l'index ${i}.`);
        break;
      }
    }

    // Tours manquants (si diarisation effectuée en amont)
    const missingTurns = words.some((w) => typeof w.turn === "undefined");
    if (missingTurns) {
      warnings.push("Certains mots n'ont pas de 'turn' après diarisation.");
    }

    return { ok: warnings.length === 0, warnings };
  }
}
