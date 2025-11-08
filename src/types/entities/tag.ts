/**
 * Tag entity types (lpltag table)
 * Enriched types based on database.types.ts
 */

import { Database } from '../database.types';

// Base types from Supabase
export type LPLTagRow = Database['public']['Tables']['lpltag']['Row'];
export type LPLTagInsert = Database['public']['Tables']['lpltag']['Insert'];
export type LPLTagUpdate = Database['public']['Tables']['lpltag']['Update'];

// Tag families (based on your research)
export type TagFamily = 
  | 'ENGAGEMENT'
  | 'OUVERTURE'
  | 'REFLET'
  | 'EXPLICATION'
  | 'CLIENT POSITIF'
  | 'CLIENT NEGATIF'
  | 'CLIENT NEUTRE'
  | string; // Allow other families

// Enriched type for UI
export interface Tag extends LPLTagRow {
  // Usage statistics (computed on demand)
  usageCount?: number;
  callCount?: number;
  avgDuration?: number;
  
  // Examples from turntagged
  examples?: TagExample[];
}

// Example of tag usage in conversation
export interface TagExample {
  turnId: number;
  verbatim: string;
  nextTurnVerbatim: string | null;
  callId: string;
  speaker: string;
  startTime: number;
  context: 'tag' | 'next_turn_tag';
}

// Tags grouped by family
export interface TagsByFamily {
  [family: string]: Tag[];
}

// Tag filters
export interface TagFilters {
  family?: TagFamily | null;
  search?: string;
  hasExamples?: boolean;
  minUsage?: number;
}

// Tag statistics
export interface TagStats {
  totalTags: number;
  byFamily: Record<string, number>;
  mostUsed: Array<{ tag: string; count: number }>;
  leastUsed: Array<{ tag: string; count: number }>;
}
