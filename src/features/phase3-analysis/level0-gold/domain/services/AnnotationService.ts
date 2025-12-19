// ============================================================================
// AnnotationService - CRUD pour Système d'Annotations Unifiées
// ============================================================================
// Description : Service générique pour toutes opérations sur table annotations
// - Sauvegarde annotations (humaines, LLM, gold)
// - Récupération avec filtres flexibles
// - Comparaison entre annotateurs
// - Statistiques par annotateur
// ============================================================================

import { getSupabase } from "@/lib/supabaseClient";
import type {
  Annotation,
  AnnotationInput,
  AnnotatorIdentifier,
  AnnotatorStats,
  AnnotationSearchOptions,
  PaginatedResult,
  AnnotatorComparisonResult,
  SyncStatus
} from "@/types/algorithm-lab/Level0Types";

export class AnnotationService {
  private static supabase = getSupabase();

  // ==========================================================================
  // CREATE - Sauvegarder une annotation
  // ==========================================================================

  /**
   * Sauvegarde une nouvelle annotation
   * Utilisé pour :
   * - Annotations LLM après test multi-chartes
   * - Annotations gold consensus
   * - Annotations superviseur
   */
  static async saveAnnotation(
    input: AnnotationInput
  ): Promise<{ data: Annotation | null; error: string | null }> {
    try {
      // Validation : au moins un tag requis
      if (!input.strategy_tag && !input.reaction_tag) {
        return {
          data: null,
          error: "At least one tag (strategy or reaction) is required"
        };
      }

      // Insert avec gestion ON CONFLICT
      const { data, error } = await this.supabase
        .from("annotations")
        .insert({
          pair_id: input.pair_id,
          annotator_type: input.annotator_type,
          annotator_id: input.annotator_id,
          strategy_tag: input.strategy_tag || null,
          reaction_tag: input.reaction_tag || null,
          confidence: input.confidence || null,
          reasoning: input.reasoning || null,
          annotation_context: input.annotation_context || null,
          test_id: input.test_id || null,
          annotation_duration_ms: input.annotation_duration_ms || null
        })
        .select()
        .single();

      if (error) {
        console.error("[AnnotationService] Save error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error("[AnnotationService] Unexpected error:", err);
      return { data: null, error: "Unexpected error during save" };
    }
  }

  /**
   * Sauvegarde multiple annotations en batch
   * Optimisé pour tests multi-chartes (901 annotations d'un coup)
   */
 static async saveBatchAnnotations(
  inputs: AnnotationInput[]
): Promise<{ data: Annotation[] | null; error: string | null }> {
  try {
    const { data, error } = await this.supabase
      .from("annotations")
      .insert(
        inputs.map((input) => ({
          pair_id: input.pair_id,
          annotator_type: input.annotator_type,
          annotator_id: input.annotator_id,
          strategy_tag: input.strategy_tag || null,
          reaction_tag: input.reaction_tag || null,
          confidence: input.confidence || null,
          reasoning: input.reasoning || null,
          annotation_context: input.annotation_context || null,
          test_id: input.test_id || null,
          annotation_duration_ms: input.annotation_duration_ms || null
        }))).select();

    if (error) {
      console.error("[AnnotationService] Batch save error:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error("[AnnotationService] Unexpected batch error:", err);
    return { data: null, error: "Unexpected error during batch save" };
  }
}

  // ==========================================================================
  // READ - Récupération annotations
  // ==========================================================================

  /**
   * Récupère toutes les annotations d'une paire
   * Utile pour voir l'historique complet : humain + LLM + gold
   */
  static async getAnnotationsForPair(
    pairId: number
  ): Promise<{ data: Annotation[] | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("annotations")
        .select("*")
        .eq("pair_id", pairId)
        .order("annotated_at", { ascending: false });

      if (error) {
        console.error("[AnnotationService] Get pair annotations error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error("[AnnotationService] Unexpected error:", err);
      return { data: null, error: "Unexpected error fetching annotations" };
    }
  }

  /**
   * Recherche annotations avec filtres flexibles
   */
  static async searchAnnotations(
    options: AnnotationSearchOptions
  ): Promise<PaginatedResult<Annotation>> {
    try {
      let query = this.supabase.from("annotations").select("*", { count: "exact" });

      // Filtres
      if (options.pair_ids && options.pair_ids.length > 0) {
        query = query.in("pair_id", options.pair_ids);
      }
      if (options.annotator_types && options.annotator_types.length > 0) {
        query = query.in("annotator_type", options.annotator_types);
      }
      if (options.annotator_ids && options.annotator_ids.length > 0) {
        query = query.in("annotator_id", options.annotator_ids);
      }
      if (options.test_id) {
        query = query.eq("test_id", options.test_id);
      }
      if (options.has_strategy !== undefined) {
        if (options.has_strategy) {
          query = query.not("strategy_tag", "is", null);
        } else {
          query = query.is("strategy_tag", null);
        }
      }
      if (options.has_reaction !== undefined) {
        if (options.has_reaction) {
          query = query.not("reaction_tag", "is", null);
        } else {
          query = query.is("reaction_tag", null);
        }
      }
      if (options.min_confidence !== undefined) {
        query = query.gte("confidence", options.min_confidence);
      }
      if (options.date_from) {
        query = query.gte("annotated_at", options.date_from);
      }
      if (options.date_to) {
        query = query.lte("annotated_at", options.date_to);
      }

      // Pagination
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order
      query = query.order("annotated_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error("[AnnotationService] Search error:", error);
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      };
    } catch (err) {
      console.error("[AnnotationService] Unexpected search error:", err);
      return {
        data: [],
        total: 0,
        limit: options.limit || 100,
        offset: options.offset || 0,
        has_more: false
      };
    }
  }

  // ==========================================================================
  // COMPARAISON - Comparer deux annotateurs
  // ==========================================================================

  /**
   * Compare deux annotateurs via RPC function compare_annotators
   */
  static async compareAnnotators(
    annotator1: AnnotatorIdentifier,
    annotator2: AnnotatorIdentifier,
    variable: "X" | "Y" = "Y"
  ): Promise<{ data: AnnotatorComparisonResult | null; error: string | null }> {
    try {
      // Appel RPC function Supabase
      const { data: comparisons, error } = await this.supabase.rpc(
        "compare_annotators",
        {
          type1: annotator1.annotator_type,
          id1: annotator1.annotator_id,
          type2: annotator2.annotator_type,
          id2: annotator2.annotator_id
        }
      );

      if (error) {
        console.error("[AnnotationService] Compare error:", error);
        return { data: null, error: error.message };
      }

      if (!comparisons || comparisons.length === 0) {
        return {
          data: {
            annotator1,
            annotator2,
            total_pairs: 0,
            agreements: 0,
            disagreements: 0,
            kappa: 0,
            accuracy: 0,
            disagreement_details: []
          },
          error: null
        };
      }

      // Calculer Kappa et métriques
      const total = comparisons.length;
      const agreements = comparisons.filter(
        (c: any) => c.tag1 === c.tag2
      ).length;
      const disagreements = total - agreements;
      const accuracy = agreements / total;

      // Kappa calculation (simple Po - Pe / 1 - Pe)
      const po = accuracy;
      
      // Calculer Pe (accord attendu par hasard)
      const tagCounts1: Record<string, number> = {};
      const tagCounts2: Record<string, number> = {};
      
      comparisons.forEach((c: any) => {
        tagCounts1[c.tag1] = (tagCounts1[c.tag1] || 0) + 1;
        tagCounts2[c.tag2] = (tagCounts2[c.tag2] || 0) + 1;
      });

      let pe = 0;
      const allTags = new Set([
        ...Object.keys(tagCounts1),
        ...Object.keys(tagCounts2)
      ]);
      
      allTags.forEach((tag) => {
        const prob1 = (tagCounts1[tag] || 0) / total;
        const prob2 = (tagCounts2[tag] || 0) / total;
        pe += prob1 * prob2;
      });

      const kappa = (po - pe) / (1 - pe);

      // Récupérer désaccords
      const disagreementDetails = comparisons
        .filter((c: any) => c.tag1 !== c.tag2)
        .map((c: any) => ({
          pair_id: c.pair_id,
          tag1: c.tag1,
          tag2: c.tag2,
          verbatim: c.client_verbatim || c.conseiller_verbatim || ""
        }));

      return {
        data: {
          annotator1,
          annotator2,
          total_pairs: total,
          agreements,
          disagreements,
          kappa,
          accuracy,
          disagreement_details: disagreementDetails
        },
        error: null
      };
    } catch (err) {
      console.error("[AnnotationService] Unexpected comparison error:", err);
      return { data: null, error: "Unexpected error during comparison" };
    }
  }

  // ==========================================================================
  // STATISTIQUES - Par annotateur
  // ==========================================================================

  /**
   * Récupère statistiques d'un annotateur via RPC get_annotator_stats
   */
  static async getAnnotatorStats(
    annotator: AnnotatorIdentifier
  ): Promise<{ data: AnnotatorStats | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.rpc("get_annotator_stats", {
        p_annotator_type: annotator.annotator_type,
        p_annotator_id: annotator.annotator_id
      });

      if (error) {
        console.error("[AnnotationService] Stats error:", error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: "No statistics found" };
      }

      return { data: data[0], error: null };
    } catch (err) {
      console.error("[AnnotationService] Unexpected stats error:", err);
      return { data: null, error: "Unexpected error fetching stats" };
    }
  }

  /**
   * Récupère statut synchronisation via vue sync_status
   */
  static async getSyncStatus(): Promise<{
    data: SyncStatus | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("sync_status")
        .select("*")
        .single();

      if (error) {
        console.error("[AnnotationService] Sync status error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error("[AnnotationService] Unexpected sync error:", err);
      return { data: null, error: "Unexpected error fetching sync status" };
    }
  }

  // ==========================================================================
  // UPDATE - Modification (rare)
  // ==========================================================================

  /**
   * Met à jour une annotation existante
   * Usage rare : correction manuelle ou mise à jour confidence
   */
  static async updateAnnotation(
    annotationId: string,
    updates: Partial<AnnotationInput>
  ): Promise<{ data: Annotation | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from("annotations")
        .update(updates)
        .eq("annotation_id", annotationId)
        .select()
        .single();

      if (error) {
        console.error("[AnnotationService] Update error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error("[AnnotationService] Unexpected update error:", err);
      return { data: null, error: "Unexpected error during update" };
    }
  }

  // ==========================================================================
  // DELETE - Suppression (rare)
  // ==========================================================================

  /**
   * Supprime une annotation
   * Usage rare : nettoyage test raté ou duplication
   */
  static async deleteAnnotation(annotationId: string): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await this.supabase
        .from("annotations")
        .delete()
        .eq("annotation_id", annotationId);

      if (error) {
        console.error("[AnnotationService] Delete error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error("[AnnotationService] Unexpected delete error:", err);
      return { success: false, error: "Unexpected error during deletion" };
    }
  }

  /**
   * Supprime toutes les annotations d'un test
   * Utilisé pour nettoyer un test multi-chartes raté
   */
  static async deleteTestAnnotations(testId: string): Promise<{
    success: boolean;
    deleted_count: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("annotations")
        .delete()
        .eq("test_id", testId)
        .select("annotation_id");

      if (error) {
        console.error("[AnnotationService] Delete test error:", error);
        return { success: false, deleted_count: 0, error: error.message };
      }

      return {
        success: true,
        deleted_count: data?.length || 0,
        error: null
      };
    } catch (err) {
      console.error("[AnnotationService] Unexpected delete test error:", err);
      return {
        success: false,
        deleted_count: 0,
        error: "Unexpected error during test deletion"
      };
    }
  }
}






