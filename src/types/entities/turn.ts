/**
 * Turn entity types (turntagged table)
 * Enriched types based on database.types.ts
 */

import { Database } from '../database.types';
import { TagFamily } from './tag';

// Base types from Supabase
export type TurnTaggedRow = Database['public']['Tables']['turntagged']['Row'];
export type TurnTaggedInsert = Database['public']['Tables']['turntagged']['Insert'];
export type TurnTaggedUpdate = Database['public']['Tables']['turntagged']['Update'];

// Enriched type for UI
export interface TurnTagged extends TurnTaggedRow {
  // Tag metadata (from lpltag join)
  tagInfo?: {
    label: string;
    family: TagFamily;
    color?: string;
  };
  
  // Next turn tag info (from lpltag join on next_turn_tag)
  nextTurnTagInfo?: {
    label: string;
    family: TagFamily;
    color?: string;
  };
  
  // Computed fields
  duration?: number;
  wordCount?: number;
}

// Turn pair for H2 analysis
export interface TurnPair {
  advisorTurn: TurnTagged;
  clientTurn: TurnTagged;
  strategy: TagFamily;
  reaction: 'POSITIF' | 'NEUTRE' | 'NEGATIF';
  temporalGap?: number; // seconds between turns
}

// Filters for turns
export interface TurnFilters {
  callId?: string;
  tag?: string;
  family?: TagFamily;
  speaker?: string;
  hasNextTurn?: boolean;
  search?: string;
}

// Turn statistics
export interface TurnStats {
  total: number;
  byTag: Record<string, number>;
  byFamily: Record<string, number>;
  avgDuration?: number;
  avgWordsPerTurn?: number;
}

// Context window around a turn
export interface TurnContext {
  previousTurns: TurnTagged[];
  currentTurn: TurnTagged;
  nextTurns: TurnTagged[];
  windowSize: number;
}
