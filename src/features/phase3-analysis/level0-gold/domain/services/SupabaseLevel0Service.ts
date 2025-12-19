// ============================================================================
// SupabaseLevel0Service - Sauvegarde des résultats dans Supabase
// ============================================================================

import { getSupabase } from "@/lib/supabaseClient";
import { CharteDefinition, CharteTestResult, GoldStandardUpdate } from "@/types/algorithm-lab/Level0Types"
import { CharteManagementService } from "./CharteManagementService";

export class SupabaseLevel0Service {
  private static getClient() {
    return getSupabase();
  }

  static async saveCharte(charte: CharteDefinition): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase
        .from("level0_chartes")
        .upsert({
          charte_id: charte.charte_id,
          charte_name: charte.charte_name,
          charte_description: charte.charte_description,
          variable: charte.variable,
          definition: charte.definition as any,
          is_baseline: charte.is_baseline || false
        });

      if (error) {
        console.error("Error saving charte:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Exception saving charte:", error);
      return { success: false, error: error.message };
    }
  }

  static async saveCharteTestResult(result: CharteTestResult): Promise<void> {
    try {
      // Charger la charte pour récupérer philosophy et version
      const { data: charte, error: charteError } = 
        await CharteManagementService.getCharteById(result.charte_id);
      
      if (charteError || !charte) {
        console.error("[SupabaseLevel0Service] Error loading charte:", charteError);
        throw new Error(`Cannot load charte ${result.charte_id}`);
      }
      
      const supabase = this.getClient();
      
      // 1. Sauvegarder le résultat du test
      const { data, error } = await supabase
        .from("level0_charte_tests")
        .insert({
          test_id: result.test_id,
          charte_id: result.charte_id,
          variable: result.variable,
          philosophy: charte.philosophy,
          version: charte.version,
          kappa: result.kappa,
          accuracy: result.accuracy,
          total_pairs: result.total_pairs,
          disagreements_count: result.disagreements_count,
          disagreements: result.disagreements || null,
          metrics: result.metrics || null,
          execution_time_ms: result.execution_time_ms,
          openai_model: result.openai_model,
          tested_at: new Date().toISOString(),
        });

      if (error) {
        console.error("[SupabaseLevel0Service] Error saving test result:", error);
        throw new Error(`Error saving test result: ${error.message}`);
      }

      console.log("[SupabaseLevel0Service] Test result saved successfully");

      // ⭐ 2. NOUVEAU : Lier les annotations au test
    
const { error: updateError } = await supabase
  .from('annotations')
  .update({ test_id: result.test_id })
  .eq('annotator_id', result.charte_id)
  .is('test_id', null);

if (updateError) {
  console.error("[SupabaseLevel0Service] Error linking annotations:", updateError);
  throw new Error(`Error linking annotations: ${updateError.message}`);
}

console.log(`[SupabaseLevel0Service] Annotations linked to test ${result.test_id}`);
    } catch (error: any) {
      console.error("[SupabaseLevel0Service] Exception:", error);
      throw error;
    }
  }

  static async getCharteTestResults(variable: "X" | "Y"): Promise<CharteTestResult[]> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("level0_charte_tests")
        .select("*")
        .eq("variable", variable)
        .order("kappa", { ascending: false });

      if (error) {
        console.error("Error fetching test results:", error);
        return [];
      }

      return (data || []).map(row => ({
        test_id: row.test_id,
        charte_id: row.charte_id,
        charte_name: row.charte_id,
        variable: row.variable as "X" | "Y",
        kappa: row.kappa,
        accuracy: row.accuracy,
        total_pairs: row.total_pairs,
        disagreements_count: row.disagreements_count,
        disagreements: [],
        metrics: row.metrics,
        execution_time_ms: row.execution_time_ms,
        openai_model: row.openai_model,
        tested_at: row.tested_at
      }));
    } catch (error) {
      console.error("Exception fetching test results:", error);
      return [];
    }
  }

  static async applyGoldStandardConsensus(
    updates: GoldStandardUpdate[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.getClient();
      const formattedUpdates = updates.map(u => ({
        pair_id: u.pairId,
        level0_gold_conseiller: u.level0_gold_conseiller || null,
        level0_gold_client: u.level0_gold_client || null,
        level0_annotator_agreement: u.level0_annotator_agreement.toString(),
        level0_validated_at: u.level0_validated_at
      }));

      const { error } = await supabase.rpc(
        "bulk_update_level0_gold",
        { updates: formattedUpdates as any }
      );

      if (error) {
        console.error("Error applying gold standard:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Exception applying gold standard:", error);
      return { success: false, error: error.message };
    }
  }

  static async getValidationStatus(): Promise<{
    totalPairs: number;
    validatedX: number;
    validatedY: number;
    avgKappa: number;
  }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from("analysis_pairs")
        .select("level0_gold_conseiller, level0_gold_client, level0_annotator_agreement");

      if (error || !data) {
        console.error("Error fetching validation status:", error);
        return { totalPairs: 0, validatedX: 0, validatedY: 0, avgKappa: 0 };
      }

      const validatedX = data.filter(p => p.level0_gold_conseiller !== null).length;
      const validatedY = data.filter(p => p.level0_gold_client !== null).length;
      const kappas = data
        .filter(p => p.level0_annotator_agreement !== null)
        .map(p => p.level0_annotator_agreement);
      const avgKappa = kappas.length > 0
        ? kappas.reduce((sum, k) => sum + k, 0) / kappas.length
        : 0;

      return {
        totalPairs: data.length,
        validatedX,
        validatedY,
        avgKappa
      };
    } catch (error) {
      console.error("Exception fetching validation status:", error);
      return { totalPairs: 0, validatedX: 0, validatedY: 0, avgKappa: 0 };
    }
  }
}
