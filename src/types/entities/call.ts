/**
 * Call entity types
 * Enriched types based on database.types.ts
 */

import { Database } from '../database.types';

// Base types from Supabase
export type CallRow = Database['public']['Tables']['call']['Row'];
export type CallInsert = Database['public']['Tables']['call']['Insert'];
export type CallUpdate = Database['public']['Tables']['call']['Update'];

// Enriched type for UI
export interface Call extends CallRow {
  // Computed fields
  duration?: number;
  transcriptStatus?: 'none' | 'pending' | 'completed';
  tagCount?: number;
  wordCount?: number;
  
  // Relations (loaded on demand)
  transcript?: any; // Will be typed later
  turns?: any[]; // Will be typed later
  tags?: any[]; // Will be typed later
}

// Filters
export interface CallFilters {
  origine?: string | null;
  status?: string[];
  dateRange?: { start: Date; end: Date };
  hasTranscript?: boolean;
  isTagged?: boolean;
  search?: string;
}

// Bulk actions
export type CallBulkAction = 
  | 'update_origine'
  | 'mark_prepared'
  | 'delete'
  | 'export';

export interface BulkCallOperation {
  action: CallBulkAction;
  callIds: string[];
  data?: Partial<CallUpdate>;
}

// Stats
export interface CallStats {
  total: number;
  withTranscript: number;
  withTags: number;
  byOrigine: Record<string, number>;
  avgDuration?: number;
}
