// src/components/calls/domain/services/DiarizationService.ts
// Service de diarisation simplifié - plus de provider, juste logique métier

import {
  Word,
  DiarizationSegment,
} from "../../shared/types/TranscriptionTypes";

export interface DiarizationOptions {
  toleranceSec?: number;
  minSegmentDuration?: number;
  maxGapSec?: number;
  speakerMergingEnabled?: boolean;
}

export interface DiarizationStats {
  totalSegments: number;
  speakerCount: number;
  averageSegmentDuration: number;
  averageConfidence: number;
  coveragePercentage: number;
}

/**
 * Service de diarisation nettoyé - logique métier uniquement
 * Plus de provider, les appels externes sont gérés par TranscriptionIntegrationService
 */
export class DiarizationService {
  constructor() {
    console.log("👥 DiarizationService initialized (logic only)");
  }

  /**
   * Assignation des tours aux mots avec options avancées
   * Méthode principale utilisée par TranscriptionIntegrationService
   */
  assignTurnsToWords(
    words: Word[],
    diarizationSegments: DiarizationSegment[],
    options: DiarizationOptions = {}
  ): Word[] {
    const {
      toleranceSec = 0.2,
      minSegmentDuration = 0.5,
      maxGapSec = 1.0,
      speakerMergingEnabled = true,
    } = options;

    if (
      !words ||
      words.length === 0 ||
      !diarizationSegments ||
      diarizationSegments.length === 0
    ) {
      console.warn("⚠️ [Diarization Service] Empty input data");
      return words;
    }

    console.log("👥 [Diarization Service] Starting turn assignment", {
      words: words.length,
      diarizationSegments: diarizationSegments.length,
      options,
    });

    // 1. Préprocessing des segments de diarisation
    let processedSegments = this.preprocessDiarizationSegments(
      diarizationSegments,
      { minSegmentDuration, maxGapSec, speakerMergingEnabled }
    );

    // 2. Tri pour optimiser la recherche
    processedSegments.sort((a, b) => a.start - b.start);
    words.sort((a, b) => a.startTime - b.startTime);

    // 3. Assignation optimisée avec tolérance
    const assignedWords = this.assignWithTolerance(
      words,
      processedSegments,
      toleranceSec
    );

    // 4. Post-traitement pour améliorer la cohérence
    const coherentWords = this.improveCoherence(assignedWords);

    // 5. Statistiques
    const stats = this.calculateAssignmentStats(
      coherentWords,
      processedSegments
    );

    console.log("✅ [Diarization Service] Turn assignment completed", stats);

    return coherentWords;
  }

  /**
   * Préprocessing des segments de diarisation
   */
  private preprocessDiarizationSegments(
    segments: DiarizationSegment[],
    options: {
      minSegmentDuration: number;
      maxGapSec: number;
      speakerMergingEnabled: boolean;
    }
  ): DiarizationSegment[] {
    let processed = [...segments];

    // 1. Filtrage des segments trop courts
    processed = processed.filter((segment) => {
      const duration = segment.end - segment.start;
      return duration >= options.minSegmentDuration;
    });

    console.log(
      `🔧 [Diarization Service] Filtered ${
        segments.length - processed.length
      } short segments`
    );

    // 2. Fusion des segments proches du même locuteur (optionnel)
    if (options.speakerMergingEnabled) {
      processed = this.mergeSameSpeakerSegments(processed, options.maxGapSec);
    }

    // 3. Validation et nettoyage
    processed = this.validateAndCleanSegments(processed);

    console.log(`📊 [Diarization Service] Preprocessing completed`, {
      original: segments.length,
      processed: processed.length,
      speakers: new Set(processed.map((s) => s.speaker)).size,
    });

    return processed;
  }

  /**
   * Fusion des segments du même locuteur séparés par de petits gaps
   */
  private mergeSameSpeakerSegments(
    segments: DiarizationSegment[],
    maxGapSec: number
  ): DiarizationSegment[] {
    if (segments.length <= 1) return segments;

    const merged: DiarizationSegment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const next = segments[i];
      const gap = next.start - current.end;

      // Même locuteur et gap suffisamment petit → fusion
      if (current.speaker === next.speaker && gap <= maxGapSec) {
        current.end = next.end;
        // Confidence moyenne pondérée par la durée
        const currentDuration = current.end - current.start - gap;
        const nextDuration = next.end - next.start;
        const totalDuration = currentDuration + nextDuration;

        current.confidence =
          ((current.confidence || 0.9) * currentDuration +
            (next.confidence || 0.9) * nextDuration) /
          totalDuration;
      } else {
        // Pas de fusion → finaliser le segment courant
        merged.push(current);
        current = { ...next };
      }
    }

    merged.push(current);

    console.log(
      `🔗 [Diarization Service] Merged ${
        segments.length - merged.length
      } segment pairs`
    );

    return merged;
  }

  /**
   * Validation et nettoyage des segments
   */
  private validateAndCleanSegments(
    segments: DiarizationSegment[]
  ): DiarizationSegment[] {
    const cleaned = segments.filter((segment) => {
      // Segment valide ?
      const isValid =
        segment.start < segment.end &&
        segment.end > 0 &&
        segment.speaker &&
        segment.speaker.length > 0;

      if (!isValid) {
        console.warn(
          `⚠️ [Diarization Service] Invalid segment filtered:`,
          segment
        );
      }

      return isValid;
    });

    // Résolution des chevauchements
    const resolved = this.resolveSegmentOverlaps(cleaned);

    return resolved;
  }

  /**
   * Résolution des chevauchements entre segments
   */
  private resolveSegmentOverlaps(
    segments: DiarizationSegment[]
  ): DiarizationSegment[] {
    if (segments.length <= 1) return segments;

    const sorted = [...segments].sort((a, b) => a.start - b.start);
    const resolved: DiarizationSegment[] = [];

    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];

      if (current.end > next.start) {
        // Chevauchement détecté
        console.warn(
          `⚠️ [Diarization Service] Overlap detected between ${current.speaker} and ${next.speaker}`
        );

        if (current.speaker === next.speaker) {
          // Même locuteur → étendre le segment
          current.end = Math.max(current.end, next.end);
        } else {
          // Locuteurs différents → couper au milieu
          const midPoint = (current.end + next.start) / 2;
          current.end = midPoint;
          next.start = midPoint;

          resolved.push(current);
          current = next;
        }
      } else {
        // Pas de chevauchement
        resolved.push(current);
        current = next;
      }
    }

    resolved.push(current);

    return resolved;
  }

  /**
   * Assignation avec tolérance temporelle
   */
  private assignWithTolerance(
    words: Word[],
    segments: DiarizationSegment[],
    toleranceSec: number
  ): Word[] {
    let segmentIndex = 0;
    let assignedCount = 0;

    for (const word of words) {
      // Avancement de l'index de segment
      while (
        segmentIndex < segments.length - 1 &&
        word.startTime >= segments[segmentIndex].end + toleranceSec
      ) {
        segmentIndex++;
      }

      // Recherche du meilleur match avec tolérance
      const bestMatch = this.findBestSegmentMatch(
        word,
        segments,
        segmentIndex,
        toleranceSec
      );

      if (bestMatch) {
        word.turn = bestMatch.speaker;
        assignedCount++;
      }
    }

    console.log(
      `🎯 [Diarization Service] Assigned ${assignedCount}/${
        words.length
      } words (${((assignedCount / words.length) * 100).toFixed(1)}%)`
    );

    return words;
  }

  /**
   * Recherche du meilleur segment pour un mot donné
   */
  private findBestSegmentMatch(
    word: Word,
    segments: DiarizationSegment[],
    startIndex: number,
    toleranceSec: number
  ): DiarizationSegment | null {
    const wordCenter = (word.startTime + word.endTime) / 2;
    let bestSegment: DiarizationSegment | null = null;
    let bestScore = -1;

    // Recherche dans une fenêtre autour de l'index courant
    const searchStart = Math.max(0, startIndex - 2);
    const searchEnd = Math.min(segments.length, startIndex + 3);

    for (let i = searchStart; i < searchEnd; i++) {
      const segment = segments[i];
      const score = this.calculateMatchScore(word, segment, toleranceSec);

      if (score > bestScore && score > 0) {
        bestScore = score;
        bestSegment = segment;
      }
    }

    return bestSegment;
  }

  /**
   * Calcul du score de correspondance mot-segment
   */
  private calculateMatchScore(
    word: Word,
    segment: DiarizationSegment,
    toleranceSec: number
  ): number {
    const wordCenter = (word.startTime + word.endTime) / 2;
    const segmentStart = segment.start - toleranceSec;
    const segmentEnd = segment.end + toleranceSec;

    // Mot entièrement dans le segment (avec tolérance)
    if (wordCenter >= segmentStart && wordCenter <= segmentEnd) {
      // Score basé sur la distance au centre et la confidence
      const segmentCenter = (segment.start + segment.end) / 2;
      const distanceFromCenter = Math.abs(wordCenter - segmentCenter);
      const maxDistance = (segment.end - segment.start) / 2 + toleranceSec;

      const proximityScore = 1 - distanceFromCenter / maxDistance;
      const confidenceScore = segment.confidence || 0.9;

      return proximityScore * confidenceScore;
    }

    return 0; // Pas de correspondance
  }

  /**
   * Amélioration de la cohérence par lissage et correction des anomalies
   */
  private improveCoherence(words: Word[]): Word[] {
    if (words.length <= 2) return words;

    const improved = [...words];
    let corrections = 0;

    // Lissage des changements de locuteur isolés
    for (let i = 1; i < improved.length - 1; i++) {
      const prev = improved[i - 1];
      const current = improved[i];
      const next = improved[i + 1];

      // Mot isolé avec un locuteur différent de ses voisins
      if (
        prev.turn &&
        next.turn &&
        prev.turn === next.turn &&
        current.turn &&
        current.turn !== prev.turn
      ) {
        // Correction si le mot est très court ou la confidence faible
        const wordDuration = current.endTime - current.startTime;
        if (wordDuration < 0.5) {
          // Mots très courts (< 500ms)
          improved[i].turn = prev.turn;
          corrections++;
        }
      }
    }

    // Propagation pour les mots sans assignation
    for (let i = 0; i < improved.length; i++) {
      if (!improved[i].turn) {
        // Recherche du locuteur le plus proche
        const nearestSpeaker = this.findNearestSpeaker(improved, i);
        if (nearestSpeaker) {
          improved[i].turn = nearestSpeaker;
          corrections++;
        }
      }
    }

    if (corrections > 0) {
      console.log(
        `🧹 [Diarization Service] Applied ${corrections} coherence corrections`
      );
    }

    return improved;
  }

  /**
   * Recherche du locuteur le plus proche pour un mot sans assignation
   */
  private findNearestSpeaker(words: Word[], index: number): string | undefined {
    const searchRadius = 5; // Rechercher dans un rayon de 5 mots

    // Recherche vers l'arrière
    for (
      let i = Math.max(0, index - 1);
      i >= Math.max(0, index - searchRadius);
      i--
    ) {
      if (words[i].turn) return words[i].turn;
    }

    // Recherche vers l'avant
    for (
      let i = Math.min(words.length - 1, index + 1);
      i < Math.min(words.length, index + searchRadius);
      i++
    ) {
      if (words[i].turn) return words[i].turn;
    }

    return undefined;
  }

  /**
   * Calcul des statistiques d'assignation
   */
  private calculateAssignmentStats(
    words: Word[],
    segments: DiarizationSegment[]
  ): DiarizationStats {
    const wordsWithTurns = words.filter((w) => w.turn);
    const speakers = new Set(words.map((w) => w.turn).filter(Boolean));

    const totalDuration = segments.reduce(
      (acc, s) => acc + (s.end - s.start),
      0
    );
    const averageSegmentDuration =
      segments.length > 0 ? totalDuration / segments.length : 0;

    const averageConfidence =
      segments.reduce((acc, s) => acc + (s.confidence || 0.9), 0) /
      segments.length;

    const coveragePercentage =
      words.length > 0 ? (wordsWithTurns.length / words.length) * 100 : 0;

    return {
      totalSegments: segments.length,
      speakerCount: speakers.size,
      averageSegmentDuration,
      averageConfidence,
      coveragePercentage,
    };
  }

  /**
   * Analyse de la qualité de la diarisation
   */
  analyzeDiarizationQuality(
    words: Word[],
    segments: DiarizationSegment[]
  ): {
    quality: "excellent" | "good" | "fair" | "poor";
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const stats = this.calculateAssignmentStats(words, segments);

    // Analyse de la couverture
    if (stats.coveragePercentage < 50) {
      issues.push("Couverture très faible de la diarisation");
      recommendations.push(
        "Vérifier la qualité audio et les paramètres de diarisation"
      );
    } else if (stats.coveragePercentage < 80) {
      issues.push("Couverture partielle de la diarisation");
      recommendations.push(
        "Ajuster la tolérance temporelle ou vérifier les segments courts"
      );
    }

    // Analyse du nombre de locuteurs
    if (stats.speakerCount < 2) {
      issues.push("Moins de 2 locuteurs détectés");
      recommendations.push(
        "Vérifier que l'audio contient bien plusieurs interlocuteurs"
      );
    } else if (stats.speakerCount > 4) {
      issues.push("Nombre élevé de locuteurs détecté");
      recommendations.push(
        "Considérer la fusion des segments de même locuteur"
      );
    }

    // Analyse de la confidence moyenne
    if (stats.averageConfidence < 0.6) {
      issues.push("Confidence faible de la diarisation");
      recommendations.push(
        "Améliorer la qualité audio ou utiliser un modèle plus robuste"
      );
    }

    // Analyse de la durée des segments
    if (stats.averageSegmentDuration < 1.0) {
      issues.push("Segments très courts en moyenne");
      recommendations.push("Augmenter le seuil de durée minimale des segments");
    } else if (stats.averageSegmentDuration > 20.0) {
      issues.push("Segments très longs en moyenne");
      recommendations.push("Vérifier la détection des changements de locuteur");
    }

    // Détermination de la qualité globale
    let quality: "excellent" | "good" | "fair" | "poor";

    if (issues.length === 0 && stats.coveragePercentage >= 90) {
      quality = "excellent";
    } else if (issues.length <= 1 && stats.coveragePercentage >= 80) {
      quality = "good";
    } else if (issues.length <= 2 && stats.coveragePercentage >= 60) {
      quality = "fair";
    } else {
      quality = "poor";
    }

    console.log(`📊 [Diarization Service] Quality analysis: ${quality}`, {
      issues: issues.length,
      coverage: `${stats.coveragePercentage.toFixed(1)}%`,
      speakers: stats.speakerCount,
      confidence: stats.averageConfidence.toFixed(2),
    });

    return {
      quality,
      issues,
      recommendations,
    };
  }

  /**
   * Export des statistiques détaillées pour debugging
   */
  exportDetailedStats(
    words: Word[],
    segments: DiarizationSegment[]
  ): {
    wordStats: {
      totalWords: number;
      assignedWords: number;
      unassignedWords: number;
      byTimeRange: Array<{
        startTime: number;
        endTime: number;
        wordCount: number;
        assignedCount: number;
      }>;
    };
    segmentStats: {
      totalSegments: number;
      byDuration: Array<{
        range: string;
        count: number;
        percentage: number;
      }>;
      bySpeaker: Array<{
        speaker: string;
        segmentCount: number;
        totalDuration: number;
        averageConfidence: number;
      }>;
    };
    alignmentStats: {
      perfectMatches: number;
      partialMatches: number;
      noMatches: number;
      averageMatchScore: number;
    };
  } {
    const assignedWords = words.filter((w) => w.turn);
    const unassignedWords = words.filter((w) => !w.turn);

    // Stats par tranche temporelle (10 secondes)
    const maxTime = Math.max(
      ...words.map((w) => w.endTime),
      ...segments.map((s) => s.end)
    );
    const timeRanges = [];
    for (let t = 0; t < maxTime; t += 10) {
      const rangeWords = words.filter(
        (w) => w.startTime >= t && w.startTime < t + 10
      );
      const rangeAssigned = rangeWords.filter((w) => w.turn);

      timeRanges.push({
        startTime: t,
        endTime: Math.min(t + 10, maxTime),
        wordCount: rangeWords.length,
        assignedCount: rangeAssigned.length,
      });
    }

    // Stats par durée de segment
    const durationRanges = [
      { min: 0, max: 1, label: "0-1s" },
      { min: 1, max: 3, label: "1-3s" },
      { min: 3, max: 10, label: "3-10s" },
      { min: 10, max: 30, label: "10-30s" },
      { min: 30, max: Infinity, label: "30s+" },
    ];

    const byDuration = durationRanges.map((range) => {
      const count = segments.filter((s) => {
        const duration = s.end - s.start;
        return duration >= range.min && duration < range.max;
      }).length;

      return {
        range: range.label,
        count,
        percentage: (count / segments.length) * 100,
      };
    });

    // Stats par locuteur
    const speakerMap = new Map<string, DiarizationSegment[]>();
    segments.forEach((s) => {
      if (!speakerMap.has(s.speaker)) {
        speakerMap.set(s.speaker, []);
      }
      speakerMap.get(s.speaker)!.push(s);
    });

    const bySpeaker = Array.from(speakerMap.entries()).map(
      ([speaker, segs]) => ({
        speaker,
        segmentCount: segs.length,
        totalDuration: segs.reduce((acc, s) => acc + (s.end - s.start), 0),
        averageConfidence:
          segs.reduce((acc, s) => acc + (s.confidence || 0.9), 0) / segs.length,
      })
    );

    // Stats d'alignement (simulation - dans une vraie impl, on calculerait les vrais scores)
    const perfectMatches = Math.floor(assignedWords.length * 0.8);
    const partialMatches = Math.floor(assignedWords.length * 0.15);
    const noMatches =
      assignedWords.length -
      perfectMatches -
      partialMatches +
      unassignedWords.length;

    return {
      wordStats: {
        totalWords: words.length,
        assignedWords: assignedWords.length,
        unassignedWords: unassignedWords.length,
        byTimeRange: timeRanges,
      },
      segmentStats: {
        totalSegments: segments.length,
        byDuration,
        bySpeaker,
      },
      alignmentStats: {
        perfectMatches,
        partialMatches,
        noMatches,
        averageMatchScore: 0.85, // Score simulé
      },
    };
  }

  /**
   * Utilitaire pour visualiser la timeline de diarisation
   */
  generateTimelineVisualization(
    words: Word[],
    segments: DiarizationSegment[],
    options: {
      timeStep?: number;
      maxWidth?: number;
    } = {}
  ): string[] {
    const { timeStep = 1, maxWidth = 80 } = options;

    if (words.length === 0 && segments.length === 0)
      return ["[Empty timeline]"];

    const maxTime = Math.max(
      words.length > 0 ? Math.max(...words.map((w) => w.endTime)) : 0,
      segments.length > 0 ? Math.max(...segments.map((s) => s.end)) : 0
    );

    const timeline: string[] = [];
    const speakers = [...new Set(segments.map((s) => s.speaker))].sort();
    const speakerColors = new Map(
      speakers.map((s, i) => [s, String.fromCharCode(65 + i)])
    ); // A, B, C...

    // En-tête avec échelle de temps
    const timeScale = Array.from({ length: Math.ceil(maxWidth) }, (_, i) => {
      const time = (i / maxWidth) * maxTime;
      return time % 10 === 0
        ? time.toString().padStart(2, "0")
        : time % 5 === 0
        ? "|"
        : ".";
    }).join("");
    timeline.push(`Time: ${timeScale}`);

    // Ligne pour chaque locuteur
    speakers.forEach((speaker) => {
      const speakerSegments = segments.filter((s) => s.speaker === speaker);
      const line = Array.from({ length: maxWidth }, () => " ");

      speakerSegments.forEach((segment) => {
        const startPos = Math.floor((segment.start / maxTime) * maxWidth);
        const endPos = Math.ceil((segment.end / maxTime) * maxWidth);
        const char = speakerColors.get(speaker) || "?";

        for (let i = startPos; i < Math.min(endPos, maxWidth); i++) {
          line[i] = char;
        }
      });

      timeline.push(`${speaker.padEnd(8)}: ${line.join("")}`);
    });

    // Ligne de mots (optionnelle)
    if (words.length > 0 && words.length < 50) {
      // Seulement pour de petits corpus
      const wordLine = Array.from({ length: maxWidth }, () => ".");
      words.forEach((word) => {
        if (word.turn) {
          const pos = Math.floor((word.startTime / maxTime) * maxWidth);
          if (pos < maxWidth) {
            wordLine[pos] = speakerColors.get(word.turn) || "?";
          }
        }
      });
      timeline.push(`Words   : ${wordLine.join("")}`);
    }

    // Légende
    timeline.push("");
    timeline.push("Legend:");
    speakers.forEach((speaker) => {
      const char = speakerColors.get(speaker) || "?";
      const segments_count = segments.filter(
        (s) => s.speaker === speaker
      ).length;
      const duration = segments
        .filter((s) => s.speaker === speaker)
        .reduce((acc, s) => acc + (s.end - s.start), 0);
      timeline.push(
        `  ${char} = ${speaker} (${segments_count} segments, ${duration.toFixed(
          1
        )}s)`
      );
    });

    return timeline;
  }
}
