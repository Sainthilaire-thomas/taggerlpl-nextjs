// src/components/calls/domain/services/TranscriptionASRService.ts
// Service rénové qui gère les segments OpenAI pour synchronisation avec diarisation

import {
  Word,
  TranscriptionJson,
  DiarizationSegment,
  TranscriptionSegment,
} from "../../shared/types/TranscriptionTypes";

// Types spécifiques aux réponses OpenAI avec segments
interface OpenAIWord {
  word: string;
  start: number;
  end: number;
}

interface OpenAISegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: OpenAIWord[];
}

interface OpenAIResponse {
  text: string;
  language: string;
  duration: number;
  segments: OpenAISegment[];
  words?: OpenAIWord[];
}

/** Options de normalisation */
type NormalizationOptions = {
  maxSegmentDuration?: number; // durée max d'un segment (défaut 20s)
  minSegmentWords?: number; // nb min de mots par segment (défaut 5)
  maxSegmentWords?: number; // nb max de mots par segment (défaut 60)
  language?: string;
  source?: "asr:auto" | "edited";
};

export class TranscriptionASRService {
  /**
   * Normalisation principale : OpenAI segments → format standardisé
   * NOUVEAUTÉ: Gère les segments OpenAI directement pour la synchronisation
   */
  normalize(
    rawOpenAI: OpenAIResponse,
    opts?: NormalizationOptions
  ): TranscriptionJson {
    const options = {
      maxSegmentDuration: 20,
      minSegmentWords: 5,
      maxSegmentWords: 60,
      language: "fr-FR",
      source: "asr:auto" as const,
      ...opts,
    };

    console.log("🔄 [ASR Service] Normalizing OpenAI response with segments", {
      totalSegments: rawOpenAI.segments?.length || 0,
      totalWords: rawOpenAI.words?.length || 0,
      duration: rawOpenAI.duration,
    });

    // 1. Extraction des mots depuis les segments OpenAI
    const words = this.extractWordsFromSegments(rawOpenAI);
    console.log(
      `📝 [ASR Service] Extracted ${words.length} words from segments`
    );

    // 2. Création des segments ASR optimisés pour la diarisation
    const segments = this.createOptimizedSegments(rawOpenAI.segments, options);
    console.log(
      `📊 [ASR Service] Created ${segments.length} optimized segments`
    );

    // 3. Métadonnées
    const meta = {
      version: "1.1", // Version avec gestion segments
      createdAt: new Date().toISOString(),
      source: options.source,
      language: options.language,
      durationSec: rawOpenAI.duration,
      // Métadonnées spécifiques segments
      originalSegments: rawOpenAI.segments.length,
      processedSegments: segments.length,
      averageSegmentDuration:
        segments.length > 0
          ? segments.reduce((acc, s) => acc + (s.end - s.start), 0) /
            segments.length
          : 0,
    };

    console.log("✅ [ASR Service] Normalization completed", {
      words: words.length,
      segments: segments.length,
      avgSegmentDuration: meta.averageSegmentDuration.toFixed(1) + "s",
    });

    return { words, segments, meta };
  }

  /**
   * Extraction des mots depuis les segments OpenAI
   * Priorité aux mots dans segments, fallback sur mots globaux
   */
  private extractWordsFromSegments(response: OpenAIResponse): Word[] {
    const words: Word[] = [];

    if (response.segments && response.segments.length > 0) {
      // Méthode 1: Mots depuis segments (préférée)
      for (const segment of response.segments) {
        if (segment.words && segment.words.length > 0) {
          for (const word of segment.words) {
            words.push({
              text: word.word.trim(),
              startTime: word.start,
              endTime: word.end,
            });
          }
        } else {
          // Fallback: tokeniser le texte du segment
          const tokens = segment.text.trim().split(/\s+/).filter(Boolean);
          const segmentDuration = segment.end - segment.start;
          const wordDuration = segmentDuration / Math.max(tokens.length, 1);

          let currentTime = segment.start;
          for (const token of tokens) {
            words.push({
              text: token,
              startTime: currentTime,
              endTime: Math.min(segment.end, currentTime + wordDuration),
            });
            currentTime += wordDuration;
          }
        }
      }
    } else if (response.words && response.words.length > 0) {
      // Méthode 2: Mots globaux (si pas de segments)
      for (const word of response.words) {
        words.push({
          text: word.word.trim(),
          startTime: word.start,
          endTime: word.end,
        });
      }
    } else {
      // Méthode 3: Fallback complet sur le texte
      console.warn(
        "⚠️ [ASR Service] No segments or words, using text fallback"
      );
      const tokens = response.text.trim().split(/\s+/).filter(Boolean);
      const totalDuration = response.duration || 0;
      const wordDuration = totalDuration / Math.max(tokens.length, 1);

      let currentTime = 0;
      for (const token of tokens) {
        words.push({
          text: token,
          startTime: currentTime,
          endTime: Math.min(totalDuration, currentTime + wordDuration),
        });
        currentTime += wordDuration;
      }
    }

    // Tri et validation
    words.sort((a, b) => a.startTime - b.startTime);

    console.log("📝 [ASR Service] Words extraction:", {
      totalWords: words.length,
      timespan:
        words.length > 0
          ? `${words[0].startTime.toFixed(1)}s - ${words[
              words.length - 1
            ].endTime.toFixed(1)}s`
          : "empty",
    });

    return words;
  }

  /**
   * Création de segments ASR optimisés pour la synchronisation
   * - Respecte les segments OpenAI naturels
   * - Évite de couper au milieu des mots
   * - Optimise pour l'alignement temporel avec diarisation
   */
  private createOptimizedSegments(
    openaiSegments: OpenAISegment[],
    options: Required<NormalizationOptions>
  ): TranscriptionSegment[] {
    if (!openaiSegments || openaiSegments.length === 0) {
      return [];
    }

    const segments: TranscriptionSegment[] = [];
    let segmentCounter = 1;

    for (const openaiSegment of openaiSegments) {
      // Vérification des contraintes
      const segmentDuration = openaiSegment.end - openaiSegment.start;
      const wordCount =
        openaiSegment.words?.length ||
        this.estimateWordCount(openaiSegment.text);

      if (
        segmentDuration <= options.maxSegmentDuration &&
        wordCount <= options.maxSegmentWords
      ) {
        // Segment OK tel quel
        segments.push(this.createAsrSegment(openaiSegment, segmentCounter++));
      } else {
        // Segment trop long → subdivision
        const subSegments = this.subdivideSegment(openaiSegment, options);
        for (const subSegment of subSegments) {
          segments.push(this.createAsrSegment(subSegment, segmentCounter++));
        }
      }
    }

    console.log("🔧 [ASR Service] Segment optimization:", {
      originalCount: openaiSegments.length,
      optimizedCount: segments.length,
      avgDuration:
        segments.length > 0
          ? (
              segments.reduce((acc, s) => acc + (s.end - s.start), 0) /
              segments.length
            ).toFixed(1) + "s"
          : "N/A",
    });

    return segments;
  }

  /**
   * Subdivision d'un segment trop long
   */
  private subdivideSegment(
    segment: OpenAISegment,
    options: Required<NormalizationOptions>
  ): OpenAISegment[] {
    const subSegments: OpenAISegment[] = [];

    if (segment.words && segment.words.length > 0) {
      // Subdivision basée sur les mots
      let currentWords: OpenAIWord[] = [];
      let currentStart = segment.start;

      for (const word of segment.words) {
        currentWords.push(word);

        const currentDuration = word.end - currentStart;
        const shouldSplit =
          currentWords.length >= options.maxSegmentWords ||
          currentDuration >= options.maxSegmentDuration;

        if (shouldSplit && currentWords.length >= options.minSegmentWords) {
          subSegments.push({
            id: segment.id,
            start: currentStart,
            end: word.end,
            text: currentWords.map((w) => w.word).join(" "),
            words: currentWords,
          });

          currentWords = [];
          currentStart = word.end;
        }
      }

      // Segment final si mots restants
      if (currentWords.length > 0) {
        subSegments.push({
          id: segment.id,
          start: currentStart,
          end: segment.end,
          text: currentWords.map((w) => w.word).join(" "),
          words: currentWords,
        });
      }
    } else {
      // Subdivision temporelle simple (pas de mots disponibles)
      const duration = segment.end - segment.start;
      const numSubSegments = Math.ceil(duration / options.maxSegmentDuration);
      const subDuration = duration / numSubSegments;

      for (let i = 0; i < numSubSegments; i++) {
        const start = segment.start + i * subDuration;
        const end = Math.min(segment.end, start + subDuration);

        subSegments.push({
          id: segment.id,
          start,
          end,
          text: segment.text, // On garde le texte complet (approximation)
          words: undefined,
        });
      }
    }

    return subSegments;
  }

  /**
   * Création d'un AsrSegment depuis un OpenAISegment
   */
  private createAsrSegment(
    openaiSegment: OpenAISegment,
    counter: number
  ): TranscriptionSegment {
    const words: Word[] = [];

    if (openaiSegment.words) {
      for (const word of openaiSegment.words) {
        words.push({
          text: word.word.trim(),
          startTime: word.start,
          endTime: word.end,
        });
      }
    }

    return {
      id: `seg_${String(counter).padStart(4, "0")}`,
      start: openaiSegment.start,
      end: openaiSegment.end,
      text: openaiSegment.text.trim(),
      words,
    };
  }

  /**
   * Estimation du nombre de mots depuis un texte
   */
  private estimateWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  /**
   * Assignation des tours aux mots basée sur la diarisation
   * AMÉLIORATION: Alignement optimisé avec les segments ASR
   */
  assignTurns(
    words: Word[],
    diarizationSegments: DiarizationSegment[]
  ): Word[] {
    if (!Array.isArray(words) || !Array.isArray(diarizationSegments)) {
      return words;
    }

    console.log("🎭 [ASR Service] Assigning speaker turns", {
      words: words.length,
      diarizationSegments: diarizationSegments.length,
      speakers: [...new Set(diarizationSegments.map((s) => s.speaker))],
    });

    const diarSorted = [...diarizationSegments].sort(
      (a, b) => a.start - b.start
    );
    let segmentIndex = 0;

    for (const word of words) {
      // Avancer vers le segment approprié
      while (
        segmentIndex < diarSorted.length - 1 &&
        word.startTime >= diarSorted[segmentIndex].end
      ) {
        segmentIndex++;
      }

      const currentSegment = diarSorted[segmentIndex];

      // Vérification de chevauchement avec tolérance
      if (currentSegment && this.isWordInSegment(word, currentSegment)) {
        word.turn = currentSegment.speaker;
      } else {
        // Chercher le segment avec le meilleur chevauchement
        const bestMatch = this.findBestDiarizationMatch(word, diarSorted);
        word.turn = bestMatch?.speaker;
      }
    }

    // Statistiques d'assignation
    const assignedWords = words.filter((w) => w.turn);
    const turnDistribution = words.reduce((acc, w) => {
      if (w.turn) {
        acc[w.turn] = (acc[w.turn] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    console.log("✅ [ASR Service] Turn assignment completed", {
      assignedWords: assignedWords.length,
      totalWords: words.length,
      coverage: `${((assignedWords.length / words.length) * 100).toFixed(1)}%`,
      turnDistribution,
    });

    return words;
  }

  /**
   * Vérification si un mot chevauche avec un segment de diarisation
   */
  private isWordInSegment(
    word: Word,
    segment: DiarizationSegment,
    tolerance: number = 0.1
  ): boolean {
    const wordCenter = (word.startTime + word.endTime) / 2;
    const segmentStart = segment.start - tolerance;
    const segmentEnd = segment.end + tolerance;

    return wordCenter >= segmentStart && wordCenter <= segmentEnd;
  }

  /**
   * Recherche du meilleur match de diarisation pour un mot
   */
  private findBestDiarizationMatch(
    word: Word,
    segments: DiarizationSegment[]
  ): DiarizationSegment | undefined {
    let bestMatch: DiarizationSegment | undefined;
    let bestOverlap = 0;

    for (const segment of segments) {
      const overlap = this.calculateOverlap(word, segment);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestMatch = segment;
      }
    }

    return bestOverlap > 0.1 ? bestMatch : undefined; // Seuil minimum 10%
  }

  /**
   * Calcul du chevauchement entre un mot et un segment
   */
  private calculateOverlap(word: Word, segment: DiarizationSegment): number {
    const overlapStart = Math.max(word.startTime, segment.start);
    const overlapEnd = Math.min(word.endTime, segment.end);
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    const wordDuration = word.endTime - word.startTime;

    return wordDuration > 0 ? overlapDuration / wordDuration : 0;
  }

  /**
   * Assignation avancée avec gestion de conflits et inertie
   */
  assignTurnsOverlap(
    words: Word[],
    diarizationSegments: DiarizationSegment[],
    opts?: {
      minOverlapRatio?: number;
      inertia?: boolean;
      conflictResolution?: "confidence" | "duration" | "speaker_consistency";
    }
  ): Word[] {
    const options = {
      minOverlapRatio: 0.2,
      inertia: true,
      conflictResolution: "confidence" as const,
      ...opts,
    };

    console.log(
      "🔧 [ASR Service] Advanced turn assignment with overlap analysis",
      {
        words: words.length,
        segments: diarizationSegments.length,
        options,
      }
    );

    const diarSorted = [...diarizationSegments].sort(
      (a, b) => a.start - b.start
    );
    let lastTurn: string | undefined;
    let conflicts = 0;

    for (const word of words) {
      const candidates = this.findDiarizationCandidates(word, diarSorted);

      if (candidates.length === 0) {
        // Aucun candidat → utiliser l'inertie si activée
        if (options.inertia && lastTurn) {
          word.turn = lastTurn;
        }
        continue;
      }

      if (candidates.length === 1) {
        // Un seul candidat → assignation simple
        const candidate = candidates[0];
        if (candidate.overlap >= options.minOverlapRatio) {
          word.turn = candidate.speaker;
          lastTurn = word.turn;
        } else if (options.inertia && lastTurn) {
          word.turn = lastTurn;
        }
        continue;
      }

      // Plusieurs candidats → résolution de conflit
      conflicts++;
      const winner = this.resolveConflict(
        candidates,
        options.conflictResolution
      );
      if (winner && winner.overlap >= options.minOverlapRatio) {
        word.turn = winner.speaker;
        lastTurn = word.turn;
      } else if (options.inertia && lastTurn) {
        word.turn = lastTurn;
      }
    }

    console.log("🎭 [ASR Service] Advanced assignment completed", {
      conflicts,
      conflictRate: `${((conflicts / words.length) * 100).toFixed(1)}%`,
    });

    return words;
  }

  /**
   * Recherche des candidats de diarisation pour un mot
   */
  private findDiarizationCandidates(
    word: Word,
    segments: DiarizationSegment[]
  ): Array<{ speaker: string; overlap: number; confidence?: number }> {
    const candidates = [];

    for (const segment of segments) {
      const overlap = this.calculateOverlap(word, segment);
      if (overlap > 0) {
        candidates.push({
          speaker: segment.speaker,
          overlap,
          confidence: segment.confidence,
        });
      }
    }

    return candidates.sort((a, b) => b.overlap - a.overlap);
  }

  /**
   * Résolution de conflit entre plusieurs candidats
   */
  private resolveConflict(
    candidates: Array<{
      speaker: string;
      overlap: number;
      confidence?: number;
    }>,
    strategy: "confidence" | "duration" | "speaker_consistency"
  ): { speaker: string; overlap: number; confidence?: number } | undefined {
    switch (strategy) {
      case "confidence":
        return candidates.reduce((best, candidate) => {
          const bestConf = best.confidence || 0;
          const candConf = candidate.confidence || 0;
          return candConf > bestConf ? candidate : best;
        });

      case "duration":
        return candidates[0]; // Déjà trié par overlap décroissant

      case "speaker_consistency":
        // Préférer les speakers déjà vus (implémentation simplifiée)
        return candidates[0];

      default:
        return candidates[0];
    }
  }

  /**
   * Validation globale avec métriques détaillées
   */
  validateAll(words: Word[]): {
    ok: boolean;
    warnings: string[];
    metrics: {
      totalWords: number;
      wordsWithTurns: number;
      turnCoverage: number;
      speakerCount: number;
      averageWordDuration: number;
      temporalConsistency: number;
    };
  } {
    const warnings: string[] = [];

    if (!Array.isArray(words) || words.length === 0) {
      return {
        ok: false,
        warnings: ["Aucun mot dans la transcription."],
        metrics: {
          totalWords: 0,
          wordsWithTurns: 0,
          turnCoverage: 0,
          speakerCount: 0,
          averageWordDuration: 0,
          temporalConsistency: 0,
        },
      };
    }

    // Validation temporelle
    let temporalErrors = 0;
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].startTime > words[i + 1].startTime) {
        temporalErrors++;
        if (warnings.length < 5) {
          // Limiter les warnings
          warnings.push(`Ordre temporel non croissant à l'index ${i}.`);
        }
      }
      if (words[i].endTime < words[i].startTime) {
        temporalErrors++;
        if (warnings.length < 5) {
          warnings.push(`Durée négative détectée à l'index ${i}.`);
        }
      }
    }

    // Métriques
    const wordsWithTurns = words.filter((w) => w.turn).length;
    const turnCoverage = (wordsWithTurns / words.length) * 100;
    const speakers = new Set(words.map((w) => w.turn).filter(Boolean));
    const avgDuration =
      words.reduce((acc, w) => acc + (w.endTime - w.startTime), 0) /
      words.length;
    const temporalConsistency = Math.max(
      0,
      100 - (temporalErrors / words.length) * 100
    );

    // Warnings sur les métriques
    if (turnCoverage < 80) {
      warnings.push(`Couverture des tours faible: ${turnCoverage.toFixed(1)}%`);
    }

    if (speakers.size < 2) {
      warnings.push("Moins de 2 locuteurs détectés après diarisation");
    }

    const metrics = {
      totalWords: words.length,
      wordsWithTurns,
      turnCoverage,
      speakerCount: speakers.size,
      averageWordDuration: avgDuration,
      temporalConsistency,
    };

    console.log("✅ [ASR Service] Validation completed", {
      ok: warnings.length === 0,
      warningCount: warnings.length,
      metrics,
    });

    return {
      ok: warnings.length === 0,
      warnings,
      metrics,
    };
  }

  /**
   * Utilitaires de manipulation (inchangés mais avec meilleur logging)
   */
  reassignTurn(words: Word[], t1: number, t2: number, toTurn: string): Word[] {
    const [a, b] = t1 <= t2 ? [t1, t2] : [t2, t1];
    let modified = 0;

    const result = words.map((w) => {
      if (w.endTime <= a || w.startTime >= b) return w;
      modified++;
      return { ...w, turn: toTurn };
    });

    console.log(
      `🔧 [ASR Service] Reassigned ${modified} words to ${toTurn} in range [${a}s, ${b}s]`
    );
    return result;
  }

  splitAt(words: Word[], t: number): Word[] {
    if (!Number.isFinite(t) || words.length === 0) return words;

    const first = words[0];
    const last = words[words.length - 1];
    if (t <= first.startTime || t >= last.endTime) return words;

    // Recherche de la frontière optimale
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

    console.log(
      `✂️ [ASR Service] Split point identified at word ${bestIdx + 1} (${
        words[bestIdx]?.endTime
      }s vs target ${t}s)`
    );

    // Dans une vraie implémentation, on pourrait insérer un marqueur ici
    return words;
  }

  insertTag(words: Word[], t1: number, t2: number, tagName: string): Word[] {
    const [a, b] = t1 <= t2 ? [t1, t2] : [t2, t1];
    let started = false;
    let tagged = 0;

    const result = words.map((w) => {
      const inRange = !(w.endTime <= a || w.startTime >= b);
      let text = w.text;

      if (inRange) {
        if (!started) {
          text = `[${tagName}] ${text}`;
          started = true;
        }
        tagged++;
      } else if (started) {
        text = `${text} [/${tagName}]`;
        started = false;
      }

      return { ...w, text };
    });

    console.log(
      `🏷️ [ASR Service] Tagged ${tagged} words with [${tagName}] in range [${a}s, ${b}s]`
    );
    return result;
  }
}
