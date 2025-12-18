import { supabase } from '@/lib/supabaseClient';

/**
 * ============================================
 * INTERFACES
 * ============================================
 */

export interface GoldStandard {
  gold_standard_id: string;
  name: string;
  description: string;
  modality: 'audio' | 'text_only' | 'audio_text';
  variable: 'X' | 'Y';
  annotator_name: string;
  methodology_notes?: string;
  created_at: string;
}

export interface PairGoldStandard {
  pair_gold_id: string;
  pair_id: number;
  gold_standard_id: string;
  strategy_gold_tag?: string;
  reaction_gold_tag?: string;
  validated_at: string;
  validated_by: string;
  validation_notes?: string;
  confidence?: number;
  version: number;
  is_current: boolean;
}

export interface GoldStandardCompleteness {
  isComplete: boolean;
  totalPairs: number;
  annotatedPairs: number;
  missingPairs: number[];
  completionRate: number;
}

export interface DerivationResult {
  copiedCount: number;
  toReviewCount: number;
  pairsToReview: number[];
  estimatedTimeMinutes: number;
}

/**
 * ============================================
 * GOLD STANDARD SERVICE
 * ============================================
 */

export class GoldStandardService {
  
  /**
   * Récupérer tous les gold standards
   */
  static async getAllGoldStandards(): Promise<GoldStandard[]> {
    try {
      const { data, error } = await supabase
        .from('gold_standards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching gold standards:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer un gold standard par ID
   */
  static async getGoldStandard(goldStandardId: string): Promise<GoldStandard | null> {
    try {
      const { data, error } = await supabase
        .from('gold_standards')
        .select('*')
        .eq('gold_standard_id', goldStandardId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching gold standard:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer le gold standard actuel pour une paire
   */
  static async getGoldStandardForPair(
    pairId: number,
    goldStandardId: string
  ): Promise<PairGoldStandard | null> {
    try {
      const { data, error } = await supabase
        .from('pair_gold_standards')
        .select('*')
        .eq('pair_id', pairId)
        .eq('gold_standard_id', goldStandardId)
        .eq('is_current', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching gold standard for pair:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer TOUS les gold standards pour une paire
   */
  static async getAllGoldStandardsForPair(
    pairId: number,
    variable: 'X' | 'Y'
  ): Promise<Array<{
    gold_standard_id: string;
    gold_standard_name: string;
    tag: string;
    modality: string;
    version: number;
    validated_at: string;
  }>> {
    try {
      const tagColumn = variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
      
      const { data, error } = await supabase
        .from('pair_gold_standards')
        .select(`
          gold_standard_id,
          ${tagColumn},
          version,
          validated_at,
          gold_standards!inner(name, modality)
        `)
        .eq('pair_id', pairId)
        .eq('is_current', true)
        .not(tagColumn, 'is', null);
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        gold_standard_id: row.gold_standard_id,
        gold_standard_name: row.gold_standards.name,
        tag: row[tagColumn],
        modality: row.gold_standards.modality,
        version: row.version,
        validated_at: row.validated_at
      }));
    } catch (error) {
      console.error('Error fetching all gold standards for pair:', error);
      throw error;
    }
  }
  
  /**
   * Corriger un gold standard (après validation CAS A)
   */
  static async correctGoldStandard(
    pairId: number,
    goldStandardId: string,
    variable: 'X' | 'Y',
    newTag: string,
    validationNotes: string
  ): Promise<void> {
    try {
      const tagColumn = variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
      
      // 1. Récupérer version actuelle
      const { data: current, error: fetchError } = await supabase
        .from('pair_gold_standards')
        .select('*')
        .eq('pair_id', pairId)
        .eq('gold_standard_id', goldStandardId)
        .eq('is_current', true)
        .single();
      
      if (fetchError || !current) {
        throw new Error(`Gold standard not found for pair ${pairId}`);
      }
      
      // 2. Désactiver ancienne version
      const { error: updateError } = await supabase
        .from('pair_gold_standards')
        .update({ is_current: false })
        .eq('pair_gold_id', current.pair_gold_id);
      
      if (updateError) throw updateError;
      
      // 3. Créer nouvelle version
      const { error: insertError } = await supabase
        .from('pair_gold_standards')
        .insert({
          pair_id: pairId,
          gold_standard_id: goldStandardId,
          [tagColumn]: newTag,
          version: current.version + 1,
          is_current: true,
          validated_by: 'Thomas',
          validation_notes: validationNotes
        });
      
      if (insertError) throw insertError;
      
      console.log(`✅ Gold standard corrigé: pair ${pairId}, ${current[tagColumn]} → ${newTag} (v${current.version + 1})`);
    } catch (error) {
      console.error('Error correcting gold standard:', error);
      throw error;
    }
  }
  
  /**
   * Créer un nouveau gold standard par dérivation
   */
  static async createByDerivation(
    newGoldStandardId: string,
    newGoldStandardMetadata: {
      name: string;
      description: string;
      modality: 'audio' | 'text_only' | 'audio_text';
      variable: 'X' | 'Y';
      methodology_notes?: string;
    },
    sourceTestId: string
  ): Promise<DerivationResult> {
    try {
      // 1. Créer le nouveau gold standard
      const { error: createError } = await supabase
        .from('gold_standards')
        .insert({
          gold_standard_id: newGoldStandardId,
          ...newGoldStandardMetadata,
          methodology_notes: newGoldStandardMetadata.methodology_notes || 
            `Créé par dérivation depuis test ${sourceTestId}`,
          annotator_name: 'Thomas'
        });
      
      if (createError) {
        if (createError.code === '23505') {
          throw new Error('Un gold standard avec cet ID existe déjà');
        }
        throw createError;
      }
      
      // 2. Récupérer le test source
      const { data: test, error: testError } = await supabase
        .from('level0_charte_tests')
        .select(`
          *,
          level0_chartes!inner(*)
        `)
        .eq('test_id', sourceTestId)
        .single();
      
      if (testError) throw testError;
      
      const sourceGoldStandardId = test.level0_chartes.gold_standard_id;
      const variable = test.level0_chartes.variable;
      const tagColumn = variable === 'X' ? 'strategy_tag' : 'reaction_tag';
      const goldTagColumn = variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
      
      // 3. Récupérer annotations du test
      const { data: annotations, error: annError } = await supabase
        .from('annotations')
        .select('*')
        .eq('test_id', sourceTestId);
      
      if (annError) throw annError;
      
      // 4. Récupérer gold standards source
      const { data: sourceGoldStandards, error: gsError } = await supabase
        .from('pair_gold_standards')
        .select('*')
        .eq('gold_standard_id', sourceGoldStandardId)
        .eq('is_current', true);
      
      if (gsError) throw gsError;
      
      // 5. Identifier accords et désaccords
      const agreements: any[] = [];
      const disagreements: number[] = [];
      
      for (const annotation of annotations || []) {
        const llmTag = annotation[tagColumn];
        
        const goldStandard = sourceGoldStandards?.find(
          gs => gs.pair_id === annotation.pair_id
        );
        const goldTag = goldStandard?.[goldTagColumn];
        
        if (llmTag === goldTag) {
          // Accord : copie automatique
          agreements.push({
            pair_id: annotation.pair_id,
            [goldTagColumn]: goldTag
          });
        } else {
          // Désaccord : à ré-annoter
          disagreements.push(annotation.pair_id);
        }
      }
      
      // 6. Copier les accords
      if (agreements.length > 0) {
        const { error: copyError } = await supabase
          .from('pair_gold_standards')
          .insert(
            agreements.map(ag => ({
              pair_id: ag.pair_id,
              gold_standard_id: newGoldStandardId,
              [goldTagColumn]: ag[goldTagColumn],
              validated_by: 'System (copied from agreement)',
              validation_notes: `Copied from test ${sourceTestId} - Agreement with LLM`,
              version: 1,
              is_current: true
            }))
          );
        
        if (copyError) throw copyError;
      }
      
      // Estimation temps : 1.5 min par désaccord
      const estimatedTimeMinutes = Math.ceil(disagreements.length * 1.5);
      
      return {
        copiedCount: agreements.length,
        toReviewCount: disagreements.length,
        pairsToReview: disagreements,
        estimatedTimeMinutes
      };
    } catch (error) {
      console.error('Error creating gold standard by derivation:', error);
      throw error;
    }
  }
  
  /**
   * Vérifier complétude d'un gold standard
   */
  static async checkCompleteness(
    goldStandardId: string
  ): Promise<GoldStandardCompleteness> {
    try {
      // Total de paires
      const { count: totalPairs } = await supabase
        .from('analysis_pairs')
        .select('pair_id', { count: 'exact', head: true });
      
      // Paires annotées
      const { data: annotated } = await supabase
        .from('pair_gold_standards')
        .select('pair_id')
        .eq('gold_standard_id', goldStandardId)
        .eq('is_current', true);
      
      const annotatedPairIds = new Set(annotated?.map((a: { pair_id: number }) => a.pair_id) || []);
      
      // Paires manquantes
      const { data: allPairs } = await supabase
        .from('analysis_pairs')
        .select('pair_id');
      
      const missingPairs = (allPairs || [])
        .filter((p: { pair_id: number }) => !annotatedPairIds.has(p.pair_id))
        .map((p: { pair_id: number }) => p.pair_id);
      
      const completionRate = totalPairs ? (annotatedPairIds.size / totalPairs) * 100 : 0;
      
      return {
        isComplete: missingPairs.length === 0,
        totalPairs: totalPairs || 0,
        annotatedPairs: annotatedPairIds.size,
        missingPairs,
        completionRate: Math.round(completionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error checking gold standard completeness:', error);
      throw error;
    }
  }
  
  /**
   * Créer un nouveau gold standard (vide, pour annotation manuelle complète)
   */
  static async createGoldStandard(
    goldStandard: Omit<GoldStandard, 'created_at'>
  ): Promise<GoldStandard> {
    try {
      const { data, error } = await supabase
        .from('gold_standards')
        .insert({
          ...goldStandard,
          annotator_name: goldStandard.annotator_name || 'Thomas'
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Un gold standard avec cet ID existe déjà');
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating gold standard:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir statistiques d'un gold standard
   */
  static async getGoldStandardStats(goldStandardId: string): Promise<{
    totalPairs: number;
    byTag: Record<string, number>;
    lastUpdated: string | null;
    averageConfidence: number | null;
  }> {
    try {
      const { data: gs }: { data: { variable: 'X' | 'Y' } | null } = await supabase
        .from('gold_standards')
        .select('variable')
        .eq('gold_standard_id', goldStandardId)
        .single();
      
      if (!gs) throw new Error('Gold standard not found');
      
      const tagColumn = gs.variable === 'X' ? 'strategy_gold_tag' : 'reaction_gold_tag';
      
      const { data, error } = await supabase
        .from('pair_gold_standards')
        .select(`${tagColumn}, confidence, validated_at`)
        .eq('gold_standard_id', goldStandardId)
        .eq('is_current', true);
      
      if (error) throw error;
      
      const byTag: Record<string, number> = {};
      let totalConfidence = 0;
      let confidenceCount = 0;
      let lastUpdated: string | null = null;
      
      data?.forEach((row: any) => {
        const tag = row[tagColumn];
        if (tag) {
          byTag[tag] = (byTag[tag] || 0) + 1;
        }
        
        if (row.confidence !== null && row.confidence !== undefined) {
          totalConfidence += row.confidence;
          confidenceCount++;
        }
        
        if (!lastUpdated || row.validated_at > lastUpdated) {
          lastUpdated = row.validated_at;
        }
      });
      
      return {
        totalPairs: data?.length || 0,
        byTag,
        lastUpdated,
        averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : null
      };
    } catch (error) {
      console.error('Error getting gold standard stats:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer l'historique des versions d'un gold standard pour une paire
   */
  static async getVersionHistory(
    pairId: number,
    goldStandardId: string
  ): Promise<PairGoldStandard[]> {
    try {
      const { data, error } = await supabase
        .from('pair_gold_standards')
        .select('*')
        .eq('pair_id', pairId)
        .eq('gold_standard_id', goldStandardId)
        .order('version', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching version history:', error);
      throw error;
    }
  }
}
