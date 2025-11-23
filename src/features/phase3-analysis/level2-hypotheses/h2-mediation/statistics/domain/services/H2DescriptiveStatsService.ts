// src/features/phase3-analysis/level2-hypotheses/h2-mediation/statistics/domain/services/H2DescriptiveStatsService.ts

export interface StrategyMediaStats {
  strategy: string;
  n: number;
  
  // M1 - Verbes d'action
  m1_mean: number;
  m1_std: number;
  m1_min: number;
  m1_max: number;
  
  // M2 - Alignement
  m2_mean: number;
  m2_std: number;
  m2_min: number;
  m2_max: number;
  
  // M3 - Charge cognitive
  m3_mean: number;
  m3_std: number;
  m3_min: number;
  m3_max: number;
}

export interface MediaReactionCorrelation {
  mediator: 'M1' | 'M2' | 'M3';
  reactionType: string;
  correlation: number;
  pValue: number;
  isSignificant: boolean;
  interpretation: string;
}

export class H2DescriptiveStatsService {
  /**
   * Calcule moyenne et écart-type
   */
  private static calculateStats(values: number[]): { mean: number; std: number; min: number; max: number } {
    if (values.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { mean, std, min, max };
  }
  
  /**
   * Statistiques descriptives par stratégie
   */
  static calculateStrategyStats(
    data: Array<{
      strategy: string;
      m1: number | null;
      m2: number | null;
      m3: number | null;
    }>
  ): StrategyMediaStats[] {
    const strategies = Array.from(new Set(data.map(d => d.strategy))).sort();
    
    return strategies.map(strategy => {
      const stratData = data.filter(d => d.strategy === strategy);
      
      const m1Values = stratData.filter(d => d.m1 !== null).map(d => d.m1!);
      const m2Values = stratData.filter(d => d.m2 !== null).map(d => d.m2!);
      const m3Values = stratData.filter(d => d.m3 !== null).map(d => d.m3!);
      
      const m1Stats = this.calculateStats(m1Values);
      const m2Stats = this.calculateStats(m2Values);
      const m3Stats = this.calculateStats(m3Values);
      
      return {
        strategy,
        n: stratData.length,
        m1_mean: m1Stats.mean,
        m1_std: m1Stats.std,
        m1_min: m1Stats.min,
        m1_max: m1Stats.max,
        m2_mean: m2Stats.mean,
        m2_std: m2Stats.std,
        m2_min: m2Stats.min,
        m2_max: m2Stats.max,
        m3_mean: m3Stats.mean,
        m3_std: m3Stats.std,
        m3_min: m3Stats.min,
        m3_max: m3Stats.max,
      };
    });
  }
  
  /**
   * Corrélation de Pearson
   */
  private static pearsonCorrelation(x: number[], y: number[]): { r: number; p: number } {
    const n = x.length;
    if (n < 3) return { r: 0, p: 1 };
    
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }
    
    const r = numerator / Math.sqrt(sumX2 * sumY2);
    
    // Test de significativité
    const t = r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
    const p = this.tTestPValue(t, n - 2);
    
    return { r, p };
  }
  
  /**
   * p-value approximative pour test t
   */
  private static tTestPValue(t: number, df: number): number {
    const absT = Math.abs(t);
    
    // Approximation simplifiée
    if (absT > 2.576) return 0.01;   // p < 0.01
    if (absT > 1.96) return 0.05;    // p < 0.05
    if (absT > 1.645) return 0.1;    // p < 0.10
    return 0.2;
  }
  
  /**
   * Corrélations Médiateurs → Réactions
   */
  static calculateMediaReactionCorrelations(
    data: Array<{
      m1: number | null;
      m2: number | null;
      m3: number | null;
      reaction: string;
    }>
  ): MediaReactionCorrelation[] {
    const results: MediaReactionCorrelation[] = [];
    
    // Encoder les réactions (POSITIF=3, NEUTRE=2, NEGATIF=1)
    const reactionMap: Record<string, number> = {
      'CLIENT_POSITIF': 3,
      'CLIENT_NEUTRE': 2,
      'CLIENT_NEGATIF': 1,
    };
    
    const reactions = data.map(d => reactionMap[d.reaction] || 0);
    
    // M1 → Réaction
    const m1Data = data.filter(d => d.m1 !== null);
    if (m1Data.length > 10) {
      const m1Values = m1Data.map(d => d.m1!);
      const m1Reactions = m1Data.map(d => reactionMap[d.reaction] || 0);
      const { r, p } = this.pearsonCorrelation(m1Values, m1Reactions);
      
      results.push({
        mediator: 'M1',
        reactionType: 'ALL',
        correlation: r,
        pValue: p,
        isSignificant: p < 0.05,
        interpretation: this.interpretCorrelation(r, 'M1'),
      });
    }
    
    // M2 → Réaction
    const m2Data = data.filter(d => d.m2 !== null);
    if (m2Data.length > 10) {
      const m2Values = m2Data.map(d => d.m2!);
      const m2Reactions = m2Data.map(d => reactionMap[d.reaction] || 0);
      const { r, p } = this.pearsonCorrelation(m2Values, m2Reactions);
      
      results.push({
        mediator: 'M2',
        reactionType: 'ALL',
        correlation: r,
        pValue: p,
        isSignificant: p < 0.05,
        interpretation: this.interpretCorrelation(r, 'M2'),
      });
    }
    
    // M3 → Réaction
    const m3Data = data.filter(d => d.m3 !== null);
    if (m3Data.length > 10) {
      const m3Values = m3Data.map(d => d.m3!);
      const m3Reactions = m3Data.map(d => reactionMap[d.reaction] || 0);
      const { r, p } = this.pearsonCorrelation(m3Values, m3Reactions);
      
      results.push({
        mediator: 'M3',
        reactionType: 'ALL',
        correlation: r,
        pValue: p,
        isSignificant: p < 0.05,
        interpretation: this.interpretCorrelation(r, 'M3'),
      });
    }
    
    return results;
  }
  
  private static interpretCorrelation(r: number, mediator: string): string {
    const absR = Math.abs(r);
    const direction = r > 0 ? 'positive' : 'négative';
    
    let strength = '';
    if (absR < 0.1) strength = 'négligeable';
    else if (absR < 0.3) strength = 'faible';
    else if (absR < 0.5) strength = 'modérée';
    else if (absR < 0.7) strength = 'forte';
    else strength = 'très forte';
    
    return `Corrélation ${direction} ${strength}`;
  }
  
  /**
   * Test ANOVA pour différence de moyennes entre stratégies
   */
  static anovaByStrategy(
    data: Array<{ strategy: string; value: number }>
  ): { f: number; p: number; isSignificant: boolean } {
    const strategies = Array.from(new Set(data.map(d => d.strategy)));
    
    if (strategies.length < 2) return { f: 0, p: 1, isSignificant: false };
    
    // Moyenne globale
    const grandMean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    
    // Between-group variance
    let ssBetween = 0;
    strategies.forEach(strat => {
      const stratData = data.filter(d => d.strategy === strat);
      const stratMean = stratData.reduce((sum, d) => sum + d.value, 0) / stratData.length;
      ssBetween += stratData.length * Math.pow(stratMean - grandMean, 2);
    });
    
    // Within-group variance
    let ssWithin = 0;
    strategies.forEach(strat => {
      const stratData = data.filter(d => d.strategy === strat);
      const stratMean = stratData.reduce((sum, d) => sum + d.value, 0) / stratData.length;
      stratData.forEach(d => {
        ssWithin += Math.pow(d.value - stratMean, 2);
      });
    });
    
    const dfBetween = strategies.length - 1;
    const dfWithin = data.length - strategies.length;
    
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    
    const f = msBetween / msWithin;
    
    // p-value approximative
    let p = 1;
    if (f > 3.84) p = 0.05;
    if (f > 6.63) p = 0.01;
    if (f > 10.83) p = 0.001;
    
    return { f, p, isSignificant: p < 0.05 };
  }
}
