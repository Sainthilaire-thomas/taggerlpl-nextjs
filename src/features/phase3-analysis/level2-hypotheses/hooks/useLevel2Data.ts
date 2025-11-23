// src/features/phase3-analysis/level2-hypotheses/hooks/useLevel2Data.ts
import { useMemo } from 'react';
import { useAnalysisPairs } from '@/features/phase3-analysis/level1-validation/ui/hooks/useAnalysisPairs';

export const useLevel2Data = () => {
  const { analysisPairs, loading, error } = useAnalysisPairs();

  const validPairs = useMemo(() => {
    return analysisPairs.filter(pair => 
      pair.strategy_tag && 
      pair.reaction_tag &&
      pair.conseiller_verbatim &&
      pair.client_verbatim
    );
  }, [analysisPairs]);

  const stats = useMemo(() => {
    const strategies = new Set(validPairs.map(p => p.strategy_family));
    const tags = new Set(validPairs.map(p => p.strategy_tag));
    const reactions = new Set(validPairs.map(p => p.reaction_tag));
    const calls = new Set(validPairs.map(p => p.call_id));

    return {
      totalPairs: validPairs.length,
      totalCalls: calls.size,
      strategiesCount: strategies.size,
      tagsCount: tags.size,
      reactionsCount: reactions.size,
      withX: validPairs.filter(p => p.x_predicted_tag).length,
      withY: validPairs.filter(p => p.y_predicted_tag).length,
      withM1: validPairs.filter(p => p.m1_verb_density !== null).length,
      withM2: validPairs.filter(p => p.m2_global_alignment !== null).length,
      withM3: validPairs.filter(p => p.m3_cognitive_score !== null).length,
    };
  }, [validPairs]);

  return {
    analysisPairs: validPairs,
    loading,
    error,
    stats,
  };
};
