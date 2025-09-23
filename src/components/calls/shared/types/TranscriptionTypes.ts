// src/components/calls/shared/types/TranscriptionTypes.ts

import type { TranscriptionMetadata } from "./CommonTypes";

// export type WordTurn = `turn${number}`;
export type WordTurn = string;

export type Word = {
  text: string;
  startTime: number; // secondes
  endTime: number; // secondes
  turn?: WordTurn;
  type?: string;
};

export type TranscriptionMeta = TranscriptionMetadata & {
  version?: string;
  createdAt?: string; // ISO
  source?: "asr:auto" | "edited";
  durationSec?: number;
  language?: string;

  // Champs utilisés par le service d’intégration
  speakerCount?: number;
  diarizationProvider?: string;
  transcriptionProvider?: string;
  alignmentTolerance?: number;
  processedAt?: string;
};

export type AsrSegment = {
  id: string; // "seg_0001"
  start: number; // secondes
  end: number; // secondes
  text: string; // join des words
  words: Word[]; // mêmes Word (startTime/endTime)
};

/** JSON stocké en DB dans call.transcription */
export type TranscriptionJson = {
  words: Word[];
  segments?: AsrSegment[]; // ✅ nouveau, optionnel (back-compat)
  meta?: TranscriptionMeta;
};

/** Segment de diarisation (sortie provider externe) */
export type DiarizationSegment = {
  start: number; // secondes
  end: number; // secondes
  speaker: WordTurn;
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
