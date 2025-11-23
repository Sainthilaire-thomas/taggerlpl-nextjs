// src/features/phase3-analysis/level2-hypotheses/h2-mediation/statistics/domain/services/H2PathAnalysisService.ts

export interface StrategyPathAnalysis {
  strategy: string;
  n: number;
  
  m1_mean: number;
  m2_mean: number;
  m3_mean: number;
  
  positif_pct: number;
  neutre_pct: number;
  negatif_pct: number;
  
  effectiveness: number;
  profile: 'ACTION' | 'NEUTRAL' | 'EXPLANATION';
}

export class H2PathAnalysisService {
  static analyzeStrategyPaths(
    data: Array<{
      strategy: string;
      reaction: string;
      m1: number | null;
      m2: number | null;
      m3: number | null;
    }>
  ): StrategyPathAnalysis[] {
    const strategies = Array.from(new Set(data.map(d => d.strategy))).sort();
    
    return strategies.map(strategy => {
      const stratData = data.filter(d => d.strategy === strategy);
      const n = stratData.length;
      
      const m1Values = stratData.filter(d => d.m1 !== null).map(d => d.m1!);
      const m2Values = stratData.filter(d => d.m2 !== null).map(d => d.m2!);
      const m3Values = stratData.filter(d => d.m3 !== null).map(d => d.m3!);
      
      const m1_mean = m1Values.length > 0 
        ? m1Values.reduce((a, b) => a + b, 0) / m1Values.length 
        : 0;
      const m2_mean = m2Values.length > 0 
        ? m2Values.reduce((a, b) => a + b, 0) / m2Values.length 
        : 0;
      const m3_mean = m3Values.length > 0 
        ? m3Values.reduce((a, b) => a + b, 0) / m3Values.length 
        : 0;
      
      const positif = stratData.filter(d => d.reaction === 'CLIENT_POSITIF').length;
      const neutre = stratData.filter(d => d.reaction === 'CLIENT_NEUTRE').length;
      const negatif = stratData.filter(d => d.reaction === 'CLIENT_NEGATIF').length;
      
      const positif_pct = (positif / n) * 100;
      const neutre_pct = (neutre / n) * 100;
      const negatif_pct = (negatif / n) * 100;
      
      const effectiveness = positif_pct - negatif_pct;
      
      let profile: 'ACTION' | 'NEUTRAL' | 'EXPLANATION' = 'NEUTRAL';
      if (strategy === 'ENGAGEMENT' || strategy === 'OUVERTURE') {
        profile = 'ACTION';
      } else if (strategy === 'EXPLICATION') {
        profile = 'EXPLANATION';
      }
      
      return {
        strategy,
        n,
        m1_mean,
        m2_mean,
        m3_mean,
        positif_pct,
        neutre_pct,
        negatif_pct,
        effectiveness,
        profile,
      };
    });
  }
  
  static validateH2(paths: StrategyPathAnalysis[]): {
    h2a_validated: boolean;
    h2b_validated: boolean;
    summary: string;
  } {
    const actionPaths = paths.filter(p => p.profile === 'ACTION');
    const explainPaths = paths.filter(p => p.profile === 'EXPLANATION');
    
    if (actionPaths.length === 0 || explainPaths.length === 0) {
      return {
        h2a_validated: false,
        h2b_validated: false,
        summary: 'Données insuffisantes pour validation H2',
      };
    }
    
    const m1_action = actionPaths.reduce((sum, p) => sum + p.m1_mean, 0) / actionPaths.length;
    const m1_explain = explainPaths.reduce((sum, p) => sum + p.m1_mean, 0) / explainPaths.length;
    
    const eff_action = actionPaths.reduce((sum, p) => sum + p.effectiveness, 0) / actionPaths.length;
    const eff_explain = explainPaths.reduce((sum, p) => sum + p.effectiveness, 0) / explainPaths.length;
    
    const h2a_validated = m1_action > m1_explain * 2;
    
    const ratio = m1_explain > 0 ? (m1_action / m1_explain).toFixed(1) : 'N/A';
    
    const summary = `H2a - Médiateur M1 varie selon efficacité H1: ${h2a_validated ? 'VALIDÉE' : 'NON VALIDÉE'}
Les stratégies efficaces (H1) ont M1 = ${m1_action.toFixed(2)} vs inefficaces M1 = ${m1_explain.toFixed(2)}
Ratio: ${ratio}x plus de verbes d action

H2b - Lien entre M1 et réactions: À VALIDER via corrélations (onglet 2)
Les stratégies ACTION sont efficaces (${eff_action.toFixed(1)}% vs ${eff_explain.toFixed(1)}%)
Mais la corrélation M1→Réaction reste à confirmer`.trim();
    
    return {
      h2a_validated,
      h2b_validated: false,
      summary,
    };
  }
}
