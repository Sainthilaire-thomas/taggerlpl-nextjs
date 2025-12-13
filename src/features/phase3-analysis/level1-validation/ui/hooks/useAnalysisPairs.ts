// src/features/phase3-analysis/level1-validation/ui/hooks/useAnalysisPairs.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { M2Scores, M2DetailsExtended } from "@/types/algorithm-lab";

export interface AnalysisPair {
  pair_id: number;
  call_id: number;
  conseiller_turn_id: number;
  client_turn_id: number;
  
  // Données de base
  conseiller_verbatim: string;
  client_verbatim: string;
  strategy_tag: string;
  reaction_tag: string;
  strategy_family: string;
  
  // Timestamps
  conseiller_start_time: number;
  conseiller_end_time: number;
  prev3_verbatim?: string;
prev3_speaker?: string;
prev3_tag?: string;
prev2_verbatim?: string;
prev2_speaker?: string;
prev2_tag?: string;
prev1_verbatim?: string;
prev1_speaker?: string;
prev1_tag?: string;
next1_verbatim?: string;
next1_speaker?: string;
next1_tag?: string;
next2_verbatim?: string;
next2_speaker?: string;
next2_tag?: string;
next3_verbatim?: string;
next3_speaker?: string;
next3_tag?: string;
  
  // Contexte étendu (JSONB)
  context?: {
    prev4?: any[];
    prev3?: any[];
    prev2?: any[];
    prev1?: any[];
    next1?: any[];
    next2?: any[];
    next3?: any[];
    next4?: any[];
  };
  
  // Métadonnées
  annotations?: any[];
  
  // === LEVEL 0: Gold Standard ===
  y_gold_tag?: string;
  x_gold_tag?: string;
  m1_gold?: number;
  m2_gold?: number;
  m3_gold?: number;
  gold_annotator?: string;
  gold_validated_at?: string;
  
  // === LEVEL 1: Prédictions Algorithmiques ===
  // Y: Prédiction réaction client
  y_predicted_tag?: string;
  y_confidence_score?: number;
  y_algorithm?: string;
  y_algorithm_version?: string;
  
  // X: Prédiction stratégie conseiller
  x_predicted_tag?: string;
  x_confidence_score?: number;
  x_algorithm?: string;
  x_algorithm_version?: string;
  
  // M1: Densité verbes d'action
  m1_verb_density?: number;
  m1_verb_count?: number;
  m1_total_words?: number;
  m1_action_verbs?: string[];
  m1_algorithm?: string;
  m1_algorithm_version?: string;
  
  // M2: Alignement linguistique
  m2_lexical_alignment?: number;
  m2_semantic_alignment?: number;
  m2_global_alignment?: number;
  m2_shared_terms?: string[];
  m2_algorithm?: string;
  m2_algorithm_version?: string;
   m2_scores?: M2Scores;
  m2_details?: M2DetailsExtended;
  
  // M3: Charge cognitive
  m3_hesitation_count?: number;
  m3_clarification_count?: number;
  m3_cognitive_score?: number;
  m3_cognitive_load?: string;
  m3_patterns?: any;
  m3_algorithm?: string;
  m3_algorithm_version?: string;
  
  // === LEVEL 2: Analyse Statistique ===
  h1_category?: string;
  h2_mediation_path?: string;
  statistical_weight?: number;
  
  // Métadonnées système
  created_at?: string;
  updated_at?: string;
  
  // Compatibilité legacy (anciens noms de colonnes)
  algorithm_version?: string; // Alias pour y_algorithm_version ou version générale
  computation_status?: 'computed' | 'error' | 'pending';
  next_turn_tag_auto?: string; // Alias pour y_predicted_tag
}

export interface UseAnalysisPairsFilters {
  algorithmVersion?: string;
  level?: 0 | 1 | 2; // Filtrer par niveau d'analyse
  hasGoldStandard?: boolean; // Filtrer les paires avec gold standard
  minPairs?: number;
}

export const useAnalysisPairs = (filters?: UseAnalysisPairsFilters) => {
  const [analysisPairs, setAnalysisPairs] = useState<AnalysisPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysisPairs = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('analysis_pairs')
          .select('*');

        // Filtres optionnels
        if (filters?.algorithmVersion) {
          // Chercher dans n'importe quelle version d'algorithme
          query = query.or(`y_algorithm_version.eq.${filters.algorithmVersion},x_algorithm_version.eq.${filters.algorithmVersion},m1_algorithm_version.eq.${filters.algorithmVersion},m2_algorithm_version.eq.${filters.algorithmVersion},m3_algorithm_version.eq.${filters.algorithmVersion}`);
        }
        
        if (filters?.hasGoldStandard) {
          query = query.not('y_gold_tag', 'is', null);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setAnalysisPairs(data || []);
        setError(null);
        
        console.log(`✅ useAnalysisPairs: ${data?.length || 0} paires chargées`);
        
        // Debug des annotations
        const withAnnotations = (data || []).filter(
          (pair: AnalysisPair) => Array.isArray(pair.annotations) && pair.annotations.length > 0
        );
        console.log(`🔍 ${withAnnotations.length} paires avec annotations`);
        
        // Debug gold standard
        const withGold = (data || []).filter(
          (pair: AnalysisPair) => pair.y_gold_tag != null
        );
        console.log(`🏆 ${withGold.length} paires avec gold standard`);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur chargement analysis_pairs';
        setError(errorMessage);
        console.error('❌ Erreur useAnalysisPairs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisPairs();
  }, [filters?.algorithmVersion, filters?.hasGoldStandard, filters?.level]);

  return { analysisPairs, loading, error };
};

// Alias pour compatibilité avec l'ancien code
export type H2AnalysisPair = AnalysisPair;
export const useH2Data = useAnalysisPairs;
