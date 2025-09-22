// src/components/calls/shared/types/TranscriptionTypes.ts

import type { TranscriptionMetadata } from "./CommonTypes";

/**
 * Tour de parole typé (optionnel, à activer si tu veux verrouiller "turn1" | "turn2" | ...).
 * Sinon garde string simple.
 */
// export type WordTurn = `turn${number}`;
export type WordTurn = string; // plus souple pour commencer

/** Un mot aligné temporellement (grain minimal que tu utilises partout) */
export type Word = {
  text: string;
  startTime: number; // secondes
  endTime: number; // secondes
  turn?: WordTurn; // ex: "turn1" | "turn2"
  type?: string; // marqueur interne (début/fin de balise, etc.) - facultatif
};

/**
 * Métadonnées de transcription :
 * - On repart de ton TranscriptionMetadata existant,
 * - On autorise des champs internes additionnels (version, createdAt, source, durationSec).
 */
export type TranscriptionMeta = TranscriptionMetadata & {
  version?: string;
  createdAt?: string; // ISO
  source?: "asr:auto" | "edited"; // provenance (ASR OpenAI ou édition Humaine)
  durationSec?: number;
  language?: string; // override explicite si besoin (ex: "fr-FR")
};

/** JSON stocké en DB dans call.transcription */
export type TranscriptionJson = {
  words: Word[];
  meta?: TranscriptionMeta;
};

/** Segment de diarisation (sortie provider externe) */
export type DiarizationSegment = {
  start: number; // secondes
  end: number; // secondes
  speaker: WordTurn; // "turn1" | "turn2" | ...
};

/** Résultat renvoyé par les workflows (utile côté UI) */
export type TranscriptionResult = {
  callId: string;
  transcription: TranscriptionJson;
};
