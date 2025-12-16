// ============================================================================
// KappaCalculationService - Calcul du Cohen's Kappa
// ============================================================================

import { AnnotationPair, KappaResult, DisagreementCase } from "@/types/algorithm-lab/Level0Types";

export class KappaCalculationService {
  /**
   * Calcule le Cohen's Kappa entre deux annotateurs
   */
  static calculateKappa(pairs: AnnotationPair[]): KappaResult {
    const n = pairs.length;
    
    if (n === 0) {
      return {
        po: 0,
        pe: 0,
        kappa: 0,
        interpretation: "Inférieur au hasard"
      };
    }
    
    // 1. Calculer Po (accord observé)
    const agreements = pairs.filter(p => p.manual === p.llm).length;
    const po = agreements / n;
    
    // 2. Calculer Pe (accord attendu par hasard)
    const categories = [...new Set([...pairs.map(p => p.manual), ...pairs.map(p => p.llm)])];
    let pe = 0;
    
    for (const category of categories) {
      const p1 = pairs.filter(p => p.manual === category).length / n;
      const p2 = pairs.filter(p => p.llm === category).length / n;
      pe += p1 * p2;
    }
    
    // 3. Calculer Kappa
    const kappa = (po - pe) / (1 - pe);
    
    // 4. Interpréter selon Landis & Koch (1977)
    const interpretation = this.interpretKappa(kappa);
    
    return { po, pe, kappa, interpretation };
  }
  
  /**
   * Interprète le Kappa selon les seuils de Landis & Koch
   */
  private static interpretKappa(kappa: number): KappaResult["interpretation"] {
    if (kappa < 0) return "Inférieur au hasard";
    if (kappa < 0.2) return "Accord faible";
    if (kappa < 0.4) return "Accord acceptable";
    if (kappa < 0.6) return "Accord modéré";
    if (kappa < 0.8) return "Accord substantiel";
    return "Accord quasi-parfait";
  }
  
  /**
   * Construit une matrice de confusion
   */
  static buildConfusionMatrix(pairs: AnnotationPair[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    
    for (const pair of pairs) {
      if (!matrix[pair.manual]) matrix[pair.manual] = {};
      if (!matrix[pair.manual][pair.llm]) matrix[pair.manual][pair.llm] = 0;
      matrix[pair.manual][pair.llm]++;
    }
    
    return matrix;
  }
  
  /**
   * Trouve tous les désaccords
   */
  static findDisagreements(
    pairs: AnnotationPair[],
    pairIds: number[],
    verbatims: string[],
    llmReasonings?: string[],
    llmConfidences?: number[]
  ): DisagreementCase[] {
    return pairs
      .map((pair, index) => ({
        pairId: pairIds[index],
        verbatim: verbatims[index],
        manualTag: pair.manual,
        llmTag: pair.llm,
        llmReasoning: llmReasonings?.[index],
        llmConfidence: llmConfidences?.[index]
      }))
      .filter(item => item.manualTag !== item.llmTag);
  }
  
  /**
   * Calcule l'accuracy (pourcentage d'accords)
   */
  static calculateAccuracy(pairs: AnnotationPair[]): number {
    if (pairs.length === 0) return 0;
    const agreements = pairs.filter(p => p.manual === p.llm).length;
    return agreements / pairs.length;
  }
  
  /**
   * Calcule des métriques de classification (precision, recall, F1)
   */
  static calculateClassificationMetrics(pairs: AnnotationPair[]): {
    precision: Record<string, number>;
    recall: Record<string, number>;
    f1Score: Record<string, number>;
  } {
    const categories = [...new Set([...pairs.map(p => p.manual), ...pairs.map(p => p.llm)])];
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1Score: Record<string, number> = {};
    
    for (const category of categories) {
      // True Positives: LLM prédit category ET manual est category
      const tp = pairs.filter(p => p.llm === category && p.manual === category).length;
      
      // False Positives: LLM prédit category MAIS manual n'est pas category
      const fp = pairs.filter(p => p.llm === category && p.manual !== category).length;
      
      // False Negatives: LLM ne prédit pas category MAIS manual est category
      const fn = pairs.filter(p => p.llm !== category && p.manual === category).length;
      
      // Precision = TP / (TP + FP)
      precision[category] = tp + fp > 0 ? tp / (tp + fp) : 0;
      
      // Recall = TP / (TP + FN)
      recall[category] = tp + fn > 0 ? tp / (tp + fn) : 0;
      
      // F1 = 2 * (Precision * Recall) / (Precision + Recall)
      const p = precision[category];
      const r = recall[category];
      f1Score[category] = p + r > 0 ? 2 * (p * r) / (p + r) : 0;
    }
    
    return { precision, recall, f1Score };
  }
}
