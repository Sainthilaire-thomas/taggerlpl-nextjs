/**
 * Fonctions d'analyse spécifiques pour la famille REFLET
 * 
 * Les REFLET ont des sous-types avec des efficacités différentes :
 * - REFLET_VOUS : Efficace (41% positif)
 * - REFLET : Neutre (50/50)
 * - REFLET_JE : Moins efficace (66% négatif)
 * - REFLET_ACQ : Inefficace (77% négatif)
 */

import type {
  StrategyReactionPair,
  StrategyFamily,
  ReactionType,
} from '@/types/entities/h2.entities';

// ============================================================================
// TYPES SPÉCIFIQUES REFLET
// ============================================================================

/**
 * Sous-types de stratégies REFLET
 */
export type RefletSubType = 
  | 'REFLET'        // Reflet générique
  | 'REFLET_ACQ'    // Reflet avec acquiescement
  | 'REFLET_JE'     // Reflet à la 1ère personne ("Je comprends que...")
  | 'REFLET_VOUS';  // Reflet à la 2ème personne ("Vous dites que...")

/**
 * Statistiques pour un sous-type de REFLET
 */
export interface RefletSubTypeStats {
  subType: RefletSubType;
  total: number;
  reactions: {
    positif: number;
    negatif: number;
    neutre: number;
  };
  percentages: {
    positif: number;
    negatif: number;
    neutre: number;
  };
  mediation: {
    m1_mean: number;
    m2_mean: number;
    m3_mean: number;
  };
}

/**
 * Analyse complète des REFLET
 */
export interface RefletAnalysis {
  total: number;
  bySubType: Record<RefletSubType, RefletSubTypeStats>;
  ranking: {
    subType: RefletSubType;
    positiveRate: number;
  }[];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrait le sous-type REFLET depuis le tag
 */
export function getRefletSubType(tag: string): RefletSubType {
  if (tag === 'REFLET_ACQ') return 'REFLET_ACQ';
  if (tag === 'REFLET_JE') return 'REFLET_JE';
  if (tag === 'REFLET_VOUS') return 'REFLET_VOUS';
  return 'REFLET';
}

/**
 * Vérifie si une paire est de famille REFLET
 */
export function isRefletPair(pair: StrategyReactionPair): boolean {
  return pair.strategy.family === 'REFLET';
}

/**
 * Filtre les paires REFLET
 */
export function filterRefletPairs(pairs: StrategyReactionPair[]): StrategyReactionPair[] {
  return pairs.filter(isRefletPair);
}

/**
 * Filtre les paires d'un sous-type REFLET spécifique
 */
export function filterRefletSubType(
  pairs: StrategyReactionPair[],
  subType: RefletSubType
): StrategyReactionPair[] {
  return pairs.filter(pair => 
    pair.strategy.family === 'REFLET' && 
    getRefletSubType(pair.strategy.tag) === subType
  );
}

// ============================================================================
// ANALYSE
// ============================================================================

/**
 * Calcule les statistiques pour un sous-type REFLET
 */
function calculateRefletSubTypeStats(
  pairs: StrategyReactionPair[],
  subType: RefletSubType
): RefletSubTypeStats {
  const total = pairs.length;

  // Comptage des réactions
  const reactions = {
    positif: pairs.filter(p => p.reaction.tag === 'CLIENT POSITIF').length,
    negatif: pairs.filter(p => p.reaction.tag === 'CLIENT NEGATIF').length,
    neutre: pairs.filter(p => p.reaction.tag === 'CLIENT NEUTRE').length,
  };

  // Pourcentages
  const percentages = {
    positif: total > 0 ? (reactions.positif / total) * 100 : 0,
    negatif: total > 0 ? (reactions.negatif / total) * 100 : 0,
    neutre: total > 0 ? (reactions.neutre / total) * 100 : 0,
  };

  // Médiations moyennes
  const m1Values = pairs
    .map(p => p.mediation.m1.density)
    .filter(v => v > 0);
  const m2Values = pairs
    .map(p => p.mediation.m2.globalAlignment)
    .filter(v => v > 0);
  const m3Values = pairs
    .map(p => p.mediation.m3.cognitiveScore)
    .filter(v => v > 0);

  const mediation = {
    m1_mean: m1Values.length > 0 
      ? m1Values.reduce((sum, v) => sum + v, 0) / m1Values.length 
      : 0,
    m2_mean: m2Values.length > 0 
      ? m2Values.reduce((sum, v) => sum + v, 0) / m2Values.length 
      : 0,
    m3_mean: m3Values.length > 0 
      ? m3Values.reduce((sum, v) => sum + v, 0) / m3Values.length 
      : 0,
  };

  return {
    subType,
    total,
    reactions,
    percentages,
    mediation,
  };
}

/**
 * Analyse complète des stratégies REFLET
 */
export function analyzeReflet(pairs: StrategyReactionPair[]): RefletAnalysis {
  const refletPairs = filterRefletPairs(pairs);

  // Grouper par sous-type
  const bySubType: Record<RefletSubType, StrategyReactionPair[]> = {
    'REFLET': [],
    'REFLET_ACQ': [],
    'REFLET_JE': [],
    'REFLET_VOUS': [],
  };

  refletPairs.forEach(pair => {
    const subType = getRefletSubType(pair.strategy.tag);
    bySubType[subType].push(pair);
  });

  // Calculer les stats pour chaque sous-type
  const stats: Record<RefletSubType, RefletSubTypeStats> = {
    'REFLET': calculateRefletSubTypeStats(bySubType['REFLET'], 'REFLET'),
    'REFLET_ACQ': calculateRefletSubTypeStats(bySubType['REFLET_ACQ'], 'REFLET_ACQ'),
    'REFLET_JE': calculateRefletSubTypeStats(bySubType['REFLET_JE'], 'REFLET_JE'),
    'REFLET_VOUS': calculateRefletSubTypeStats(bySubType['REFLET_VOUS'], 'REFLET_VOUS'),
  };

  // Ranking par taux de positif
  const ranking = Object.values(stats)
    .filter(s => s.total > 0)
    .map(s => ({
      subType: s.subType,
      positiveRate: s.percentages.positif,
    }))
    .sort((a, b) => b.positiveRate - a.positiveRate);

  return {
    total: refletPairs.length,
    bySubType: stats,
    ranking,
  };
}

/**
 * Compare REFLET vs autres familles
 */
export function compareRefletVsOthers(pairs: StrategyReactionPair[]): {
  reflet: {
    total: number;
    positiveRate: number;
  };
  engagement: {
    total: number;
    positiveRate: number;
  };
  ouverture: {
    total: number;
    positiveRate: number;
  };
  explication: {
    total: number;
    positiveRate: number;
  };
} {
  const calculateRate = (familyPairs: StrategyReactionPair[]) => {
    const total = familyPairs.length;
    const positives = familyPairs.filter(p => p.reaction.tag === 'CLIENT POSITIF').length;
    return {
      total,
      positiveRate: total > 0 ? (positives / total) * 100 : 0,
    };
  };

  return {
    reflet: calculateRate(pairs.filter(p => p.strategy.family === 'REFLET')),
    engagement: calculateRate(pairs.filter(p => p.strategy.family === 'ENGAGEMENT')),
    ouverture: calculateRate(pairs.filter(p => p.strategy.family === 'OUVERTURE')),
    explication: calculateRate(pairs.filter(p => p.strategy.family === 'EXPLICATION')),
  };
}

/**
 * Identifie les sous-types REFLET les plus efficaces
 */
export function getBestRefletSubTypes(
  pairs: StrategyReactionPair[],
  minSampleSize = 10
): RefletSubType[] {
  const analysis = analyzeReflet(pairs);
  
  return analysis.ranking
    .filter(r => analysis.bySubType[r.subType].total >= minSampleSize)
    .filter(r => r.positiveRate > 40) // Seuil arbitraire de 40%
    .map(r => r.subType);
}

/**
 * Identifie les sous-types REFLET les moins efficaces
 */
export function getWorstRefletSubTypes(
  pairs: StrategyReactionPair[],
  minSampleSize = 10
): RefletSubType[] {
  const analysis = analyzeReflet(pairs);
  
  return analysis.ranking
    .filter(r => analysis.bySubType[r.subType].total >= minSampleSize)
    .filter(r => r.positiveRate < 30) // Seuil arbitraire de 30%
    .map(r => r.subType)
    .reverse(); // Du pire au moins pire
}
