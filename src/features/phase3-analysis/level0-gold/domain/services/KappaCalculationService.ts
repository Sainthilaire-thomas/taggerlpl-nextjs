// ============================================================================
// KappaCalculationService - Calcul du Cohen's Kappa
// Sprint 4 - Version COMPLÈTE avec méthodes existantes + nouvelles
// ============================================================================

import { getSupabase } from '@/lib/supabaseClient';
import {
  AnnotationPair,
  KappaResult,
  DisagreementCase,
  AnnotatorForComparison,
  AnnotatorIdentifier,
  KappaComparisonResult,
  CommonAnnotation,
  ConfusionMatrix,
  DisagreementDetailComparison
} from "@/types/algorithm-lab/Level0Types";

export class KappaCalculationService {
  // ==========================================================================
  // MÉTHODES EXISTANTES (CONSERVÉES)
  // ==========================================================================

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

  // ==========================================================================
  // NOUVELLES MÉTHODES SPRINT 4 - COMPARATEUR KAPPA FLEXIBLE
  // ==========================================================================

  /**
   * Récupérer liste de tous les annotateurs disponibles
   * Utilise la fonction SQL get_available_annotators()
   * 
   * @param variable - 'X' (stratégies), 'Y' (réactions), ou undefined (tous)
   */
  static async getAvailableAnnotators(
    variable?: 'X' | 'Y'
  ): Promise<AnnotatorForComparison[]> {
    const supabase = getSupabase();
    
    try {
      const { data, error } = await supabase
        .rpc('get_available_annotators', { 
          p_variable: variable || null 
        });

      if (error) {
        console.error('Error fetching annotators:', error);
        return [];
      }

      return (data || []).map((a: any) => ({
        type: a.annotator_type,
        id: a.annotator_id,
        label: this.getAnnotatorLabel(a),
        modalityLabel: this.getModalityLabel(a),
        count: a.annotation_count,
        firstAnnotation: a.first_annotation,
        lastAnnotation: a.last_annotation
      }));

    } catch (error: any) {
      console.error('Error in getAvailableAnnotators:', error);
      return [];
    }
  }

  /**
   * Comparer 2 annotateurs quelconques et calculer Cohen's Kappa
   * Utilise la fonction SQL get_common_annotations()
   * 
   * @param annotator1 - Premier annotateur
   * @param annotator2 - Second annotateur
   * @param variable - 'X', 'Y', ou undefined (tous)
   */
  static async compareAnyAnnotators(
    annotator1: AnnotatorIdentifier,
    annotator2: AnnotatorIdentifier,
    variable?: 'X' | 'Y'
  ): Promise<KappaComparisonResult> {
    const supabase = getSupabase();
    
    try {
      // 1. Récupérer paires communes via RPC
      const { data: pairs, error } = await supabase.rpc(
        'get_common_annotations',
        {
          p_annotator1_type: annotator1.annotator_type,
          p_annotator1_id: annotator1.annotator_id,
          p_annotator2_type: annotator2.annotator_type,
          p_annotator2_id: annotator2.annotator_id,
          p_variable: variable || null
        }
      );

      if (error) {
        return {
          success: false,
          error: error.message,
          total_pairs: 0
        };
      }

      if (!pairs || pairs.length === 0) {
        return {
          success: false,
          error: 'Aucune annotation commune trouvée entre ces 2 annotateurs',
          total_pairs: 0
        };
      }

      // 2. Calculer métriques
      const agreements = pairs.filter((p: CommonAnnotation) => p.tag1 === p.tag2).length;
      const disagreements = pairs.filter((p: CommonAnnotation) => p.tag1 !== p.tag2);
      const accuracy = agreements / pairs.length;
      
      // 3. Cohen's Kappa (utilise méthode existante adaptée)
      const kappa = this.calculateCohenKappaFromCommonAnnotations(pairs);
      
      // 4. Matrice de confusion
      const confusionMatrix = this.buildConfusionMatrixFromCommonAnnotations(pairs);

      return {
        success: true,
        annotator1,
        annotator2,
        kappa,
        accuracy,
        total_pairs: pairs.length,
        agreements,
        disagreements_count: disagreements.length,
        disagreements: disagreements.map((d: CommonAnnotation) => ({
          pair_id: d.pair_id,
          tag1: d.tag1,
          tag2: d.tag2,
          verbatim: d.verbatim,
          confidence1: d.confidence1,
          confidence2: d.confidence2
        })),
        confusion_matrix: confusionMatrix
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        total_pairs: 0
      };
    }
  }

  /**
   * Calculer Cohen's Kappa depuis CommonAnnotation[] (format SQL)
   * Adapte la méthode calculateKappa existante
   */
  private static calculateCohenKappaFromCommonAnnotations(pairs: CommonAnnotation[]): number {
    const n = pairs.length;
    if (n === 0) return 0;

    // 1. Calculer Po (accord observé)
    const agreements = pairs.filter(p => p.tag1 === p.tag2).length;
    const po = agreements / n;

    // 2. Récupérer toutes les catégories uniques
    const allTags = new Set<string>();
    pairs.forEach(p => {
      allTags.add(p.tag1);
      allTags.add(p.tag2);
    });
    const categories = Array.from(allTags);

    // 3. Calculer Pe (accord attendu par hasard)
    let pe = 0;
    for (const category of categories) {
      const count1 = pairs.filter(p => p.tag1 === category).length;
      const count2 = pairs.filter(p => p.tag2 === category).length;
      pe += (count1 / n) * (count2 / n);
    }

    // 4. Calculer Kappa
    if (pe === 1) return 0; // Éviter division par zéro
    const kappa = (po - pe) / (1 - pe);

    return kappa;
  }

  /**
   * Construire matrice de confusion depuis CommonAnnotation[]
   */
  private static buildConfusionMatrixFromCommonAnnotations(
    pairs: CommonAnnotation[]
  ): ConfusionMatrix {
    // 1. Récupérer catégories uniques (triées)
    const allTags = new Set<string>();
    pairs.forEach(p => {
      allTags.add(p.tag1);
      allTags.add(p.tag2);
    });
    const categories = Array.from(allTags).sort();

    // 2. Initialiser matrice
    const matrix: number[][] = categories.map(() => 
      categories.map(() => 0)
    );

    // 3. Remplir matrice
    pairs.forEach(p => {
      const row = categories.indexOf(p.tag1);
      const col = categories.indexOf(p.tag2);
      if (row >= 0 && col >= 0) {
        matrix[row][col]++;
      }
    });

    return { categories, matrix };
  }

  /**
   * Générer label lisible pour annotateur
   */
  private static getAnnotatorLabel(annotator: any): string {
    const { annotator_type, annotator_id } = annotator;

    if (annotator_type === 'human_manual') {
      if (annotator_id === 'thomas_initial') {
        return 'Thomas (Texte + Audio)';
      } else if (annotator_id === 'thomas_texte_only') {
        return 'Thomas (Texte Seul)';
      } else {
        return `Humain (${annotator_id})`;
      }
    }

    if (annotator_type === 'llm_openai') {
      return `LLM Texte (${annotator_id})`;
    }

    if (annotator_type === 'llm_openai_audio') {
      return `LLM Audio (${annotator_id})`;
    }

    return `${annotator_type} (${annotator_id})`;
  }

  /**
   * Générer label modalité pour annotateur
   */
  private static getModalityLabel(annotator: any): string {
    const { annotator_type, annotator_id } = annotator;

    if (annotator_type === 'human_manual') {
      if (annotator_id.includes('texte_only')) {
        return '📝 Texte';
      }
      return '🎙️ Audio';
    }

    if (annotator_type === 'llm_openai_audio') {
      return '🎙️ Audio';
    }

    return '📝 Texte';
  }

  /**
   * Exporter résultats comparaison en CSV
   */
  static exportComparisonToCSV(result: KappaComparisonResult): string {
    if (!result.success) {
      return 'error,message\ntrue,' + (result.error || 'Unknown error');
    }

    const lines: string[] = [];

    // Header
    lines.push('# Comparaison Kappa');
    lines.push(`# Annotateur 1,${result.annotator1?.annotator_type},${result.annotator1?.annotator_id}`);
    lines.push(`# Annotateur 2,${result.annotator2?.annotator_type},${result.annotator2?.annotator_id}`);
    lines.push('');

    // Métriques
    lines.push('Métrique,Valeur');
    lines.push(`Kappa,${result.kappa?.toFixed(3) || 'N/A'}`);
    lines.push(`Accuracy,${result.accuracy?.toFixed(3) || 'N/A'}`);
    lines.push(`Total Paires,${result.total_pairs}`);
    lines.push(`Accords,${result.agreements || 0}`);
    lines.push(`Désaccords,${result.disagreements_count || 0}`);
    lines.push('');

    // Désaccords
    if (result.disagreements && result.disagreements.length > 0) {
      lines.push('pair_id,tag1,tag2,confidence1,confidence2,verbatim');
      result.disagreements.forEach(d => {
        const verbatim = (d.verbatim || '').replace(/,/g, ';').replace(/\n/g, ' ');
        lines.push(
          `${d.pair_id},${d.tag1},${d.tag2},${d.confidence1 || ''},${d.confidence2 || ''},"${verbatim}"`
        );
      });
    }

    return lines.join('\n');
  }

  /**
   * Obtenir couleur pour valeur Kappa (pour UI)
   */
  static getKappaColor(kappa: number | null | undefined): string {
    if (kappa === null || kappa === undefined || isNaN(kappa)) {
      return '#757575'; // gray
    }
    if (kappa < 0) return '#d32f2f'; // dark red
    if (kappa < 0.20) return '#f44336'; // red
    if (kappa < 0.40) return '#ff9800'; // orange
    if (kappa < 0.60) return '#ffc107'; // amber
    if (kappa < 0.80) return '#8bc34a'; // light green
    return '#4caf50'; // green
  }
}
