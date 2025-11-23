// src/features/phase3-analysis/level2-hypotheses/h2-mediation/statistics/domain/services/H2MediationService.ts

/**
 * Service pour l'analyse de médiation H2
 * 
 * Hypothèse H2: La relation X → Y est médiée par M1, M2, M3
 * 
 * Méthodes:
 * - Baron & Kenny (1986) - 4 étapes
 * - Sobel Test pour significativité de la médiation
 * - Effets directs et indirects
 */

export interface MediationPath {
  mediator: 'M1' | 'M2' | 'M3';
  mediatorLabel: string;
  
  // Coefficients Baron-Kenny
  a: number;  // X → M
  b: number;  // M → Y (contrôlé pour X)
  c: number;  // X → Y (effet total)
  cPrime: number;  // X → Y (effet direct, contrôlé pour M)
  
  // Effet indirect
  indirectEffect: number;  // a × b
  
  // Tests de significativité
  sobelZ: number;
  sobelP: number;
  
  // Interprétation
  isMediationSignificant: boolean;
  mediationType: 'full' | 'partial' | 'none';
  
  // Variance expliquée
  varianceExplained: number;  // Proportion de l'effet total médié
}

export interface H2MediationResult {
  totalEffect: number;  // c : X → Y sans médiateurs
  directEffect: number;  // c' : X → Y avec médiateurs
  
  paths: MediationPath[];
  
  // Résumé global
  totalIndirectEffect: number;
  totalMediationPct: number;  // % de l'effet médié
  
  // Statistiques
  nObservations: number;
  convergence: boolean;
}

export class H2MediationService {
  /**
   * Régression linéaire simple Y = aX + b
   */
  private static linearRegression(
    x: number[],
    y: number[]
  ): { slope: number; intercept: number; se: number } {
    const n = x.length;
    if (n === 0) return { slope: 0, intercept: 0, se: 0 };
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const slope = (sumXY - n * meanX * meanY) / (sumX2 - n * meanX * meanX);
    const intercept = meanY - slope * meanX;
    
    // Erreur standard
    const predictions = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const sse = residuals.reduce((sum, r) => sum + r * r, 0);
    const mse = sse / (n - 2);
    const sxx = sumX2 - (sumX * sumX) / n;
    const se = Math.sqrt(mse / sxx);
    
    return { slope, intercept, se };
  }
  
  /**
   * Régression multiple Y = b0 + b1*X + b2*M
   */
  private static multipleRegression(
    x: number[],
    m: number[],
    y: number[]
  ): { b1: number; b2: number; se1: number; se2: number } {
    const n = x.length;
    if (n === 0) return { b1: 0, b2: 0, se1: 0, se2: 0 };
    
    // Calcul simplifié (assumant X et M sont centrés)
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanM = m.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    const xc = x.map(v => v - meanX);
    const mc = m.map(v => v - meanM);
    const yc = y.map(v => v - meanY);
    
    const sxx = xc.reduce((sum, v) => sum + v * v, 0);
    const smm = mc.reduce((sum, v) => sum + v * v, 0);
    const sxy = xc.reduce((sum, v, i) => sum + v * yc[i], 0);
    const smy = mc.reduce((sum, v, i) => sum + v * yc[i], 0);
    const sxm = xc.reduce((sum, v, i) => sum + v * mc[i], 0);
    
    const denom = sxx * smm - sxm * sxm;
    const b1 = (smm * sxy - sxm * smy) / denom;
    const b2 = (sxx * smy - sxm * sxy) / denom;
    
    // Erreurs standard (simplifiées)
    const predictions = x.map((xi, i) => b1 * (xi - meanX) + b2 * (m[i] - meanM) + meanY);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const sse = residuals.reduce((sum, r) => sum + r * r, 0);
    const mse = sse / (n - 3);
    
    const se1 = Math.sqrt(mse * smm / denom);
    const se2 = Math.sqrt(mse * sxx / denom);
    
    return { b1, b2, se1, se2 };
  }
  
  /**
   * Test de Sobel pour la significativité de la médiation
   */
  private static sobelTest(
    a: number,
    b: number,
    seA: number,
    seB: number
  ): { z: number; p: number } {
    const indirectEffect = a * b;
    const seIndirect = Math.sqrt(b * b * seA * seA + a * a * seB * seB);
    const z = indirectEffect / seIndirect;
    
    // Approximation p-value (distribution normale)
    const p = 2 * (1 - this.normalCDF(Math.abs(z)));
    
    return { z, p };
  }
  
  /**
   * Fonction de répartition cumulative normale standard
   */
  private static normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }
  
  /**
   * Analyse de médiation pour un médiateur donné
   */
  static analyzeMediationPath(
    x: number[],  // Variable indépendante (codée numériquement)
    m: number[],  // Médiateur
    y: number[],  // Variable dépendante (codée numériquement)
    mediatorLabel: string,
    mediatorKey: 'M1' | 'M2' | 'M3'
  ): MediationPath {
    // Étape 1: X → Y (effet total c)
    const step1 = this.linearRegression(x, y);
    const c = step1.slope;
    
    // Étape 2: X → M (coefficient a)
    const step2 = this.linearRegression(x, m);
    const a = step2.slope;
    const seA = step2.se;
    
    // Étape 3: X + M → Y (coefficients c' et b)
    const step3 = this.multipleRegression(x, m, y);
    const cPrime = step3.b1;  // Effet direct
    const b = step3.b2;        // M → Y
    const seB = step3.se2;
    
    // Effet indirect
    const indirectEffect = a * b;
    
    // Test de Sobel
    const { z: sobelZ, p: sobelP } = this.sobelTest(a, b, seA, seB);
    
    // Significativité
    const isMediationSignificant = sobelP < 0.05;
    
    // Type de médiation
    let mediationType: 'full' | 'partial' | 'none' = 'none';
    if (isMediationSignificant) {
      if (Math.abs(cPrime) < 0.05 || sobelP < 0.01) {
        mediationType = 'full';  // Effet direct non significatif
      } else {
        mediationType = 'partial';  // Effet direct reste significatif
      }
    }
    
    // Variance expliquée
    const varianceExplained = c !== 0 ? Math.abs(indirectEffect / c) : 0;
    
    return {
      mediator: mediatorKey,
      mediatorLabel,
      a,
      b,
      c,
      cPrime,
      indirectEffect,
      sobelZ,
      sobelP,
      isMediationSignificant,
      mediationType,
      varianceExplained,
    };
  }
  
  /**
   * Analyse complète de médiation H2
   */
  static analyzeH2Mediation(
    data: Array<{
      x: number;  // Stratégie (codée)
      y: number;  // Réaction (codée)
      m1: number | null;
      m2: number | null;
      m3: number | null;
    }>
  ): H2MediationResult {
    const n = data.length;
    
    // Extraire les valeurs
    const x = data.map(d => d.x);
    const y = data.map(d => d.y);
    
    // Effet total sans médiateurs
    const totalEffectReg = this.linearRegression(x, y);
    const totalEffect = totalEffectReg.slope;
    
    const paths: MediationPath[] = [];
    
    // Analyser M1 si disponible
    const m1Data = data.filter(d => d.m1 !== null);
    if (m1Data.length > 10) {
      const m1 = m1Data.map(d => d.m1!);
      const x1 = m1Data.map(d => d.x);
      const y1 = m1Data.map(d => d.y);
      
      paths.push(this.analyzeMediationPath(
        x1, m1, y1,
        'M1 - Densité verbes d\'action',
        'M1'
      ));
    }
    
    // Analyser M2 si disponible
    const m2Data = data.filter(d => d.m2 !== null);
    if (m2Data.length > 10) {
      const m2 = m2Data.map(d => d.m2!);
      const x2 = m2Data.map(d => d.x);
      const y2 = m2Data.map(d => d.y);
      
      paths.push(this.analyzeMediationPath(
        x2, m2, y2,
        'M2 - Alignement lexical',
        'M2'
      ));
    }
    
    // Analyser M3 si disponible
    const m3Data = data.filter(d => d.m3 !== null);
    if (m3Data.length > 10) {
      const m3 = m3Data.map(d => d.m3!);
      const x3 = m3Data.map(d => d.x);
      const y3 = m3Data.map(d => d.y);
      
      paths.push(this.analyzeMediationPath(
        x3, m3, y3,
        'M3 - Charge cognitive',
        'M3'
      ));
    }
    
    // Effets indirects totaux
    const totalIndirectEffect = paths.reduce((sum, p) => sum + p.indirectEffect, 0);
    const directEffect = totalEffect - totalIndirectEffect;
    const totalMediationPct = totalEffect !== 0 
      ? (totalIndirectEffect / totalEffect) * 100 
      : 0;
    
    return {
      totalEffect,
      directEffect,
      paths,
      totalIndirectEffect,
      totalMediationPct,
      nObservations: n,
      convergence: paths.length > 0,
    };
  }
}
