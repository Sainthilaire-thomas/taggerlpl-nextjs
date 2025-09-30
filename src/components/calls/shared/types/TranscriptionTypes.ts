// src/components/calls/shared/types/TranscriptionTypes.ts

import type { TranscriptionMetadata } from "./CommonTypes";

// Un "tour de parole" : dans tes données actuelles c'est libre (ex: "turn1")
export type WordTurn = string;

/**
 * Mot issu de l'ASR/alignement (format VERBOSE).
 * -> C'est ce qu'on met dans le JSONB "call.transcription".
 */
export type Word = {
  text: string;
  startTime: number; // secondes
  endTime: number; // secondes
  speaker?: string; // si dispo après diarisation/alignement
  turn?: WordTurn; // présent dans ton JSON existant
  type?: string; // ex: "[HORS_TRAITEMENT]"
  confidence?: number;
};

/**
 * Métadonnées associées à la transcription.
 * (On garde tes champs existants + ceux ajoutés par l’intégration)
 */
export type TranscriptionMeta = TranscriptionMetadata & {
  version?: string;
  createdAt?: string; // ISO
  source?: "asr:auto" | "edited";
  durationSec?: number;
  language?: string;

  // Ajoutés par l’intégration
  speakerCount?: number;
  diarizationProvider?: string;
  transcriptionProvider?: string;
  alignmentTolerance?: number;
  processedAt?: string;
};

/**
 * Segment générique (optionnellement enrichi).
 * On tolère à la fois un segment "léger" (start/end/speaker/text)
 * et un segment "riche" (id, words[]).
 */
export type TranscriptionSegment = {
  id?: string; // ex: "seg_0001"
  start: number; // secondes
  end: number; // secondes
  text?: string; // join de words, si pré-calculé
  speaker?: WordTurn;
  words?: Word[]; // mêmes Word (startTime/endTime)
};

/** JSON stocké en DB dans call.transcription (jsonb) */
export type TranscriptionJson = {
  words: Word[]; // <-- VERBOSE en base
  segments?: TranscriptionSegment[]; // optionnel
  meta: TranscriptionMeta; // métadonnées enrichies
};

/** Segment de diarisation (sortie provider externe) */
export type DiarizationSegment = {
  start: number; // secondes
  end: number; // secondes
  speaker: WordTurn;
  confidence?: number;
};

/** Résultat renvoyé par les workflows (utile côté UI) */
export type TranscriptionResult = {
  callId: string;
  transcription: TranscriptionJson;
};

export type AudioMetadata = {
  size: number;
  type: string;
  url: string;
  filename: string;
};

export interface TranscriptionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalMinutesProcessed: number; // minutes d'audio
  averageProcessingTime: number; // ms
  successRate: number; // 0..1
  totalCost: number; // $
  lastUpdated: Date;
}
