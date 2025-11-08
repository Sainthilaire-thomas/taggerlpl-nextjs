/**
 * Service de récupération des données H2 depuis Supabase
 * 
 * Gère la récupération des paires stratégie-réaction et leur conversion
 * en entités métier typées et validées.
 */

import { supabase } from '@/lib/supabaseClient';
import type {
  StrategyReactionPair,
  PairFilter,
  PairsQueryResult,
  StrategyFamily,
  ReactionType,
  H2DescriptiveStats,
  ContingencyTable,
} from '@/types/entities/h2.entities';
import {
  convertH2RowsToPairs,
  filterPairs,
  groupByStrategy,
  groupByReaction,
} from '@/lib/h2/h2.converters';

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

/**
 * Service pour récupérer et manipuler les données H2
 */
export class H2DataService {
  private supabase = supabase;

  /**
   * Récupère des paires selon des filtres
   */
  async getPairs(filter: PairFilter = {}): Promise<PairsQueryResult> {
    try {
      // Construction de la requête de base
      let query = this.supabase
        .from('h2_analysis_pairs')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (filter.callIds && filter.callIds.length > 0) {
        query = query.in('call_id', filter.callIds);
      }

      if (filter.strategyFamilies && filter.strategyFamilies.length > 0) {
        query = query.in('strategy_family', filter.strategyFamilies);
      }

      if (filter.reactionTypes && filter.reactionTypes.length > 0) {
        query = query.in('reaction_tag', filter.reactionTypes);
      }

      if (filter.computationStatus && filter.computationStatus.length > 0) {
        query = query.in('computation_status', filter.computationStatus);
      }

      // Tri par défaut : par call_id puis pair_index
      query = query.order('call_id', { ascending: true });
      query = query.order('pair_index', { ascending: true });

      // Pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 100) - 1);
      }

      // Exécuter la requête
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        return {
          pairs: [],
          totalCount: 0,
          stats: {
            byStrategy: { ENGAGEMENT: 0, OUVERTURE: 0, EXPLICATION: 0,REFLET:0 },
            byReaction: { 'CLIENT POSITIF': 0, 'CLIENT NEGATIF': 0, 'CLIENT NEUTRE': 0 },
            computationComplete: 0,
            computationPending: 0,
          },
        };
      }

      // Convertir les rows en entités métier
      const { pairs, errors, warnings } = convertH2RowsToPairs(data, {
        includeContext: true,
        validate: true,
      });

      // Logger les erreurs/warnings
      if (errors.length > 0) {
        console.warn(`[H2DataService] Conversion errors:`, errors);
      }
      if (warnings.length > 0) {
        console.info(`[H2DataService] Conversion warnings:`, warnings);
      }

      // Calculer les statistiques
      const stats = this.calculateStats(pairs);

      return {
        pairs,
        totalCount: count ?? pairs.length,
        stats,
      };
    } catch (error) {
      console.error('[H2DataService] Error fetching pairs:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les paires d'un appel spécifique
   */
  async getPairsByCall(callId: string): Promise<StrategyReactionPair[]> {
    const result = await this.getPairs({
      callIds: [callId],
    });
    return result.pairs;
  }

  /**
   * Récupère des paires avec médiation complète uniquement
   */
  async getPairsWithCompleteMediation(filter: PairFilter = {}): Promise<StrategyReactionPair[]> {
    const result = await this.getPairs({
      ...filter,
      computationStatus: ['completed'],
    });

    // Filtrer pour ne garder que celles avec M1, M2 ET M3
    return result.pairs.filter(pair =>
      pair.mediation.m1.density > 0 &&
      pair.mediation.m2.globalAlignment > 0 &&
      pair.mediation.m3.cognitiveScore > 0
    );
  }

  /**
   * Récupère uniquement les paires ENGAGEMENT vs CLIENT POSITIF
   */
  async getEngagementPositivePairs(): Promise<StrategyReactionPair[]> {
    const result = await this.getPairs({
      strategyFamilies: ['ENGAGEMENT'],
      reactionTypes: ['CLIENT POSITIF'],
      computationStatus: ['completed'],
    });
    return result.pairs;
  }

  /**
   * Compte le nombre total de paires
   */
  async getTotalCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('h2_analysis_pairs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return count ?? 0;
  }

  /**
   * Compte les paires par statut de calcul
   */
  async getCountByStatus(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from('h2_analysis_pairs')
      .select('computation_status');

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    const counts: Record<string, number> = {};
    data?.forEach((row: { computation_status: string | null }) => {
      const status = row.computation_status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }

  /**
   * Vérifie si des paires existent pour un appel
   */
  async hasPairs(callId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('h2_analysis_pairs')
      .select('*', { count: 'exact', head: true })
      .eq('call_id', callId)
      .limit(1);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  // ============================================================================
  // STATISTIQUES
  // ============================================================================

  /**
   * Calcule les statistiques rapides sur un ensemble de paires
   */
  private calculateStats(pairs: StrategyReactionPair[]) {
    const byStrategy: Record<StrategyFamily, number> = {
      ENGAGEMENT: 0,
      OUVERTURE: 0,
      EXPLICATION: 0,
      REFLET: 0,
    };

    const byReaction: Record<ReactionType, number> = {
      'CLIENT POSITIF': 0,
      'CLIENT NEGATIF': 0,
      'CLIENT NEUTRE': 0,
    };

    let computationComplete = 0;
    let computationPending = 0;

    pairs.forEach(pair => {
      byStrategy[pair.strategy.family]++;
      byReaction[pair.reaction.tag]++;

      if (pair.computationStatus === 'completed') {
        computationComplete++;
      } else if (pair.computationStatus === 'pending') {
        computationPending++;
      }
    });

    return {
      byStrategy,
      byReaction,
      computationComplete,
      computationPending,
    };
  }

  /**
   * Calcule des statistiques descriptives complètes
   */
  async getDescriptiveStats(filter: PairFilter = {}): Promise<H2DescriptiveStats> {
    const result = await this.getPairs(filter);
    const pairs = result.pairs;

    // Distribution des stratégies et réactions
    const grouped = this.calculateStats(pairs);

    // Statistiques M1
    const m1Values = pairs
      .map(p => p.mediation.m1.density)
      .filter(v => v > 0);

    const m1Stats = this.calculateNumericStats(m1Values);

    // Statistiques M2
    const m2Values = pairs
      .map(p => p.mediation.m2.globalAlignment)
      .filter(v => v > 0);

    const m2Stats = this.calculateNumericStats(m2Values);

    // Statistiques M3
    const m3Values = pairs
      .map(p => p.mediation.m3.cognitiveScore)
      .filter(v => v > 0);

    const m3Stats = this.calculateNumericStats(m3Values);

    return {
      n: pairs.length,
      strategyDistribution: grouped.byStrategy,
      reactionDistribution: grouped.byReaction,
      m1Stats,
      m2Stats,
      m3Stats,
    };
  }

  /**
   * Calcule une table de contingence stratégie × réaction
   */
  async getContingencyTable(filter: PairFilter = {}): Promise<ContingencyTable> {
    const result = await this.getPairs(filter);
    const pairs = result.pairs;

    // Initialiser la table
    const table: Record<StrategyFamily, Record<ReactionType, number>> = {
      ENGAGEMENT: { 'CLIENT POSITIF': 0, 'CLIENT NEGATIF': 0, 'CLIENT NEUTRE': 0 },
      OUVERTURE: { 'CLIENT POSITIF': 0, 'CLIENT NEGATIF': 0, 'CLIENT NEUTRE': 0 },
      EXPLICATION: { 'CLIENT POSITIF': 0, 'CLIENT NEGATIF': 0, 'CLIENT NEUTRE': 0 },
      REFLET: { 'CLIENT POSITIF': 0, 'CLIENT NEGATIF': 0, 'CLIENT NEUTRE': 0 },
    };

    // Remplir la table
    pairs.forEach(pair => {
      table[pair.strategy.family][pair.reaction.tag]++;
    });

    // Calculer les totaux
    const rowTotals: Record<StrategyFamily, number> = {
      ENGAGEMENT: 0,
      OUVERTURE: 0,
      EXPLICATION: 0,
      REFLET: 0,
    };

    const colTotals: Record<ReactionType, number> = {
      'CLIENT POSITIF': 0,
      'CLIENT NEGATIF': 0,
      'CLIENT NEUTRE': 0,
    };

    let grandTotal = 0;

    Object.entries(table).forEach(([strategy, reactions]) => {
      const strategyKey = strategy as StrategyFamily;
      Object.entries(reactions).forEach(([reaction, count]) => {
        const reactionKey = reaction as ReactionType;
        rowTotals[strategyKey] += count;
        colTotals[reactionKey] += count;
        grandTotal += count;
      });
    });

    return {
      table,
      rowTotals,
      colTotals,
      grandTotal,
    };
  }

  // ============================================================================
  // HELPERS PRIVÉS
  // ============================================================================

  /**
   * Calcule les statistiques descriptives sur un tableau de nombres
   */
  private calculateNumericStats(values: number[]): {
    mean: number;
    median: number;
    min: number;
    max: number;
    sd: number;
  } {
    if (values.length === 0) {
      return { mean: 0, median: 0, min: 0, max: 0, sd: 0 };
    }

    // Trier pour la médiane
    const sorted = [...values].sort((a, b) => a - b);

    // Moyenne
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Médiane
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Min et max
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Écart-type
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const sd = Math.sqrt(variance);

    return { mean, median, min, max, sd };
  }
}

// ============================================================================
// INSTANCE SINGLETON
// ============================================================================

/**
 * Instance singleton du service H2
 */
export const h2DataService = new H2DataService();

// ============================================================================
// HOOKS POUR REACT (optionnel - à créer plus tard)
// ============================================================================

/**
 * Hook React pour récupérer des paires H2
 * 
 * Exemple d'utilisation future :
 * ```tsx
 * const { pairs, loading, error } = useH2Pairs({
 *   strategyFamilies: ['ENGAGEMENT'],
 *   computationStatus: ['completed']
 * });
 * ```
 */
// À implémenter dans un fichier séparé si besoin
