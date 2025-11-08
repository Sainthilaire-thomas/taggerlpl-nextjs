/**
 * Transcription entity types (transcript table)
 * Enriched types based on database.types.ts
 */

import { Database } from '../database.types';

// Base types from Supabase
export type TranscriptRow = Database['public']['Tables']['transcript']['Row'];
export type TranscriptInsert = Database['public']['Tables']['transcript']['Insert'];
export type TranscriptUpdate = Database['public']['Tables']['transcript']['Update'];

// Enriched type for UI
export interface Transcript extends TranscriptRow {
  // Computed fields
  wordCount?: number;
  duration?: number;
  turnCount?: number;
  
  // Relations (loaded on demand)
  call?: any; // Will be typed with Call later
  words?: any[]; // Will be typed with Word later
  turns?: any[]; // Will be typed with TurnTagged later
}

// Transcription status
export type TranscriptionStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'none';

// Filters
export interface TranscriptFilters {
  callId?: string;
  hasWords?: boolean;
  hasTurns?: boolean;
  minWordCount?: number;
  minDuration?: number;
  search?: string;
}

// Statistics
export interface TranscriptStats {
  total: number;
  withWords: number;
  withTurns: number;
  avgWordCount?: number;
  avgDuration?: number;
  avgTurnCount?: number;
}
