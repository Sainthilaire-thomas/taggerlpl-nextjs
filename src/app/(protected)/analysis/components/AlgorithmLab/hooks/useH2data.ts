// src/app/(protected)/analysis/components/AlgorithmLab/hooks/useH2Data.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface H2AnalysisPair {
  pair_id: number;
  call_id: number;
  conseiller_turn_id: number;
  
  // Données de base
  conseiller_verbatim: string;
  client_verbatim: string;
  strategy_tag: string;
  reaction_tag: string;
  strategy_family: string;
  
  // Timestamps
  conseiller_start_time: number;
  conseiller_end_time: number;
  
  // Métadonnées
  annotations: any[];
  
  // Résultats algorithmes X/Y
  next_turn_tag_auto?: string;
  score_auto?: number;
  
  // Résultats M1
  m1_verb_density?: number;
  m1_verb_count?: number;
  m1_total_words?: number;
  m1_action_verbs?: string[];
  
  // Résultats M2
  m2_lexical_alignment?: number;
  m2_semantic_alignment?: number;
  m2_global_alignment?: number;
  m2_shared_terms?: string[];
  
  // Résultats M3
  m3_hesitation_count?: number;
  m3_clarification_count?: number;
  m3_cognitive_score?: number;
  m3_cognitive_load?: string;
  m3_patterns?: any;
  
  // Versioning
  algorithm_version?: string;
  version_metadata?: any;
  computed_at?: string;
  computation_status?: 'computed' | 'error' | 'pending';
}

export interface UseH2DataFilters {
  algorithmVersion?: string;
  computationStatus?: 'computed' | 'error' | 'pending';
  minPairs?: number;
}

export const useH2Data = (filters?: UseH2DataFilters) => {
  const [h2Pairs, setH2Pairs] = useState<H2AnalysisPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchH2Pairs = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('h2_analysis_pairs')
          .select('*');
        
        // Filtres optionnels
        if (filters?.algorithmVersion) {
          query = query.eq('algorithm_version', filters.algorithmVersion);
        }
        
        if (filters?.computationStatus) {
          query = query.eq('computation_status', filters.computationStatus);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        setH2Pairs(data || []);
        setError(null);
        
        console.log(`✅ useH2Data: ${data?.length || 0} paires chargées`);
        
        // Debug des annotations
        const withAnnotations = (data || []).filter(
          (pair: H2AnalysisPair) => Array.isArray(pair.annotations) && pair.annotations.length > 0
        );
        console.log(`📝 ${withAnnotations.length} paires avec annotations`);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur chargement H2';
        setError(errorMessage);
        console.error('❌ Erreur useH2Data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchH2Pairs();
  }, [filters?.algorithmVersion, filters?.computationStatus]);

  return { h2Pairs, loading, error };
};
