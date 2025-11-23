// src/features/phase3-analysis/level2-hypotheses/h2-mediation/hooks/useH2MediationData.ts
import { useMemo } from 'react';
import { useLevel2Data } from '../../hooks/useLevel2Data';

export interface H2MediationData {
  pairId: number;
  callId: string;
  strategyFamily: string;
  strategyTag: string;
  reactionTag: string;
  m1_verb_density: number | null;
  m2_global_alignment: number | null;
  m3_cognitive_score: number | null;
  conseillerVerbatim: string;
  clientVerbatim: string;
}

export const useH2MediationData = () => {
  const { analysisPairs, loading, error, stats } = useLevel2Data();

  const mediationPairs = useMemo(() => {
    return analysisPairs
      .filter(pair => 
        pair.strategy_family &&
        pair.reaction_tag
      )
      .map(pair => ({
        pairId: pair.pair_id,
        callId: pair.call_id,
        strategyFamily: pair.strategy_family,
        strategyTag: pair.strategy_tag,
        reactionTag: pair.reaction_tag,
        m1_verb_density: pair.m1_verb_density ?? null,
        m2_global_alignment: pair.m2_global_alignment ?? null,
        m3_cognitive_score: pair.m3_cognitive_score ?? null,
        conseillerVerbatim: pair.conseiller_verbatim,
        clientVerbatim: pair.client_verbatim,
      }));
  }, [analysisPairs]);

  const completenessStats = useMemo(() => {
    const total = mediationPairs.length;
    const withM1 = mediationPairs.filter(p => p.m1_verb_density !== null).length;
    const withM2 = mediationPairs.filter(p => p.m2_global_alignment !== null).length;
    const withM3 = mediationPairs.filter(p => p.m3_cognitive_score !== null).length;
    const withAllM = mediationPairs.filter(p => 
      p.m1_verb_density !== null && 
      p.m2_global_alignment !== null && 
      p.m3_cognitive_score !== null
    ).length;

    return {
      total,
      withM1,
      withM2,
      withM3,
      withAllM,
      pctM1: total > 0 ? (withM1 / total) * 100 : 0,
      pctM2: total > 0 ? (withM2 / total) * 100 : 0,
      pctM3: total > 0 ? (withM3 / total) * 100 : 0,
      pctComplete: total > 0 ? (withAllM / total) * 100 : 0,
    };
  }, [mediationPairs]);

  return {
    mediationPairs,
    loading,
    error,
    stats,
    completenessStats,
    isReady: mediationPairs.length > 0 && !loading,
  };
};
