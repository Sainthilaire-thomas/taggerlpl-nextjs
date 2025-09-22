/**
 * Service métier: normalisation ASR → words[], diarisation → assignTurns,
 * édition (split/merge/reassign/insertTag), validation.
 */

import {
  Word,
  TranscriptionJson,
  DiarizationSegment,
} from "../../shared/types/TranscriptionTypes";

export class TranscriptionASRService {
  /** Mappe le JSON "verbose" OpenAI vers ton format { words[] } */
  normalize(
    rawOpenAI: any,
    opts?: { language?: string; source?: "asr:auto" | "edited" }
  ): TranscriptionJson {
    // Selon les modèles, OpenAI peut renvoyer:
    // - segments: [{ start, end, text, words: [{word, start, end}] }, ...]
    // - ou une autre forme. On gère "best effort".
    const words: Word[] = [];

    const segments = rawOpenAI?.segments ?? [];
    if (Array.isArray(segments) && segments.length > 0) {
      for (const seg of segments) {
        const segWords = seg?.words ?? [];
        if (Array.isArray(segWords) && segWords.length > 0) {
          for (const w of segWords) {
            // OpenAI: { word, start, end } ou { text, start, end }
            const text = typeof w.word === "string" ? w.word : w.text ?? "";
            const start = Number(w.start ?? seg.start ?? 0);
            const end = Number(w.end ?? seg.end ?? start);

            if (!text) continue;
            words.push({
              text,
              startTime: start,
              endTime: end,
              // pas de turn à ce stade
            });
          }
        } else if (typeof seg?.text === "string") {
          // Fallback: pas de words détaillés -> on découpe grossièrement (optionnel)
          words.push({
            text: seg.text,
            startTime: Number(seg.start ?? 0),
            endTime: Number(seg.end ?? seg.start ?? 0),
          });
        }
      }
    } else if (typeof rawOpenAI?.text === "string") {
      // Fallback minimaliste: tout en une ligne
      words.push({
        text: rawOpenAI.text,
        startTime: 0,
        endTime: Number(rawOpenAI?.duration ?? 0),
      });
    }

    // Tri et nettoyage de base
    words.sort((a, b) => a.startTime - b.startTime);
    const meta = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      source: opts?.source ?? "asr:auto",
      language: opts?.language ?? "fr-FR",
      durationSec: Number(rawOpenAI?.duration ?? words.at(-1)?.endTime ?? 0),
    };

    return { words, meta };
  }

  /** Affecte un 'turn' à chaque mot en fonction des segments de diarisation */
  assignTurns(words: Word[], diar: DiarizationSegment[]): Word[] {
    if (!Array.isArray(words) || !Array.isArray(diar)) return words;

    // Pour accélérer, on peut indexer les segments par temps ou faire une avance simultanée
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
        // si pas de segment couvrant, on peut laisser vide ou reprendre le dernier speaker connu
        // ici, on laisse vide (l'UI pourra alerter)
        if (!w.turn) w.turn = undefined;
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

  /** Split au temps t (entre mots) : on choisit le pivot le plus proche */
  splitAt(words: Word[], t: number): Word[] {
    if (!Number.isFinite(t)) return words;
    // Ici, on ne coupe pas un mot en 2 (simple et robuste)
    // On pourrait insérer un marqueur "split" si nécessaire.

    // Rien à faire si t est hors bornes
    const first = words[0],
      last = words.at(-1);
    if (!first || !last || t <= first.startTime || t >= last.endTime)
      return words;

    // Cherche le point de coupure le plus proche d'une frontière entre mots
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

    // Ce split "logique" n'altère pas les mots. L'UI s'en sert pour créer des segments/tours.
    // Si tu veux matérialiser un marker, tu peux insérer un mot fantôme ici.
    return words;
  }

  /** Merge logique entre t1 et t2 (ne modifie pas les mots; utile pour UI/segments) */
  mergeRange(words: Word[], _t1: number, _t2: number): Word[] {
    // Ici, rien à faire au niveau "word" si tu restes au grain du mot.
    // Le merge sera utile si tu matérialises des "segments". On conserve simple.
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

    // Ordre temporel
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

    // Tours manquants
    const missingTurns = words.some((w) => typeof w.turn === "undefined");
    if (missingTurns) {
      warnings.push("Certains mots n'ont pas de 'turn' après diarisation.");
    }

    // Balises basiques: pairage open/close (très simple, à améliorer si besoin)
    // Ici on ne parse pas, on laisse à l'UI la possibilité d'un validateur plus riche.

    return { ok: warnings.length === 0, warnings };
  }
}
