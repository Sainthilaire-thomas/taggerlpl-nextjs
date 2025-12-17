// ============================================================================
// CharteManagementService - Gestion des chartes depuis la base de données
// ============================================================================

import { getSupabase } from "@/lib/supabaseClient";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";

/**
 * Service pour gérer les chartes d'annotation depuis Supabase
 * Remplace les définitions en dur de CharteRegistry.ts
 */
export class CharteManagementService {
  private static supabase = getSupabase();

  /**
   * Récupérer toutes les chartes
   */
  static async getAllChartes(): Promise<{
    data: CharteDefinition[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("level0_chartes")
        .select("*")
        .order("variable", { ascending: true })
        .order("philosophy", { ascending: true })
        .order("version", { ascending: false });

      if (error) {
        console.error("[CharteManagementService] Error fetching chartes:", error);
        return { data: null, error: error.message };
      }

      // Mapper les données DB vers CharteDefinition
      const chartes = data?.map(this.mapDbToCharte) || [];

      return { data: chartes, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Récupérer les chartes pour une variable spécifique
   */
  static async getChartesForVariable(
    variable: "X" | "Y"
  ): Promise<{
    data: CharteDefinition[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("level0_chartes")
        .select("*")
        .eq("variable", variable)
        .order("philosophy", { ascending: true })
        .order("version", { ascending: false });

      if (error) {
        console.error(
          `[CharteManagementService] Error fetching chartes for variable ${variable}:`,
          error
        );
        return { data: null, error: error.message };
      }

      const chartes = data?.map(this.mapDbToCharte) || [];

      return { data: chartes, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Récupérer une charte par son ID
   */
  static async getCharteById(
    charteId: string
  ): Promise<{
    data: CharteDefinition | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("level0_chartes")
        .select("*")
        .eq("charte_id", charteId)
        .single();

      if (error) {
        console.error(
          `[CharteManagementService] Error fetching charte ${charteId}:`,
          error
        );
        return { data: null, error: error.message };
      }

      const charte = data ? this.mapDbToCharte(data) : null;

      return { data: charte, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Récupérer les chartes par philosophie
   */
  static async getChartesByPhilosophy(
    philosophy: string
  ): Promise<{
    data: CharteDefinition[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("level0_chartes")
        .select("*")
        .eq("philosophy", philosophy)
        .order("version", { ascending: false });

      if (error) {
        console.error(
          `[CharteManagementService] Error fetching chartes for philosophy ${philosophy}:`,
          error
        );
        return { data: null, error: error.message };
      }

      const chartes = data?.map(this.mapDbToCharte) || [];

      return { data: chartes, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Récupérer les chartes baseline
   */
  static async getBaselines(): Promise<{
    data: CharteDefinition[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("level0_chartes")
        .select("*")
        .eq("is_baseline", true)
        .order("variable", { ascending: true });

      if (error) {
        console.error(
          "[CharteManagementService] Error fetching baseline chartes:",
          error
        );
        return { data: null, error: error.message };
      }

      const chartes = data?.map(this.mapDbToCharte) || [];

      return { data: chartes, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Récupérer les philosophies distinctes pour une variable
   */
  static async getPhilosophies(
    variable?: "X" | "Y"
  ): Promise<{
    data: string[] | null;
    error: string | null;
  }> {
    try {
      let query = this.supabase
        .from("level0_chartes")
        .select("philosophy");

      if (variable) {
        query = query.eq("variable", variable);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "[CharteManagementService] Error fetching philosophies:",
          error
        );
        return { data: null, error: error.message };
      }

      // Extraire philosophies uniques
      const philosophies = Array.from(
        new Set(data?.map((row: any) => row.philosophy) || [])
      );

      return { data: philosophies, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Créer une nouvelle charte
   * (Pour futures versions améliorées)
   */
  static async createCharte(
    charte: Omit<CharteDefinition, "created_at">
  ): Promise<{
    data: CharteDefinition | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("level0_chartes")
        .insert({
          charte_id: charte.charte_id,
          charte_name: charte.charte_name,
          charte_description: charte.charte_description,
          variable: charte.variable,
          philosophy: charte.philosophy,
          version: charte.version,
          definition: charte.definition,
          prompt_template: charte.prompt_template || null,
          prompt_params: charte.prompt_params || null,
          is_baseline: charte.is_baseline || false,
          notes: charte.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[CharteManagementService] Error creating charte:", error);
        return { data: null, error: error.message };
      }

      const newCharte = data ? this.mapDbToCharte(data) : null;

      return { data: newCharte, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Mettre à jour une charte existante
   */
  static async updateCharte(
    charteId: string,
    updates: Partial<CharteDefinition>
  ): Promise<{
    data: CharteDefinition | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("level0_chartes")
        .update({
          charte_name: updates.charte_name,
          charte_description: updates.charte_description,
          definition: updates.definition,
          prompt_template: updates.prompt_template,
          prompt_params: updates.prompt_params,
          is_baseline: updates.is_baseline,
          notes: updates.notes,
        })
        .eq("charte_id", charteId)
        .select()
        .single();

      if (error) {
        console.error(
          `[CharteManagementService] Error updating charte ${charteId}:`,
          error
        );
        return { data: null, error: error.message };
      }

      const updatedCharte = data ? this.mapDbToCharte(data) : null;

      return { data: updatedCharte, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { data: null, error: err.message || "Unexpected error" };
    }
  }

  /**
   * Supprimer une charte
   */
  static async deleteCharte(
    charteId: string
  ): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await this.supabase
        .from("level0_chartes")
        .delete()
        .eq("charte_id", charteId);

      if (error) {
        console.error(
          `[CharteManagementService] Error deleting charte ${charteId}:`,
          error
        );
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.error("[CharteManagementService] Unexpected error:", err);
      return { success: false, error: err.message || "Unexpected error" };
    }
  }

  // ==========================================================================
  // Méthodes utilitaires privées
  // ==========================================================================

  /**
   * Mapper les données DB vers CharteDefinition TypeScript
   */
  private static mapDbToCharte(dbRow: any): CharteDefinition {
    return {
      charte_id: dbRow.charte_id,
      charte_name: dbRow.charte_name,
      charte_description: dbRow.charte_description || undefined,
      variable: dbRow.variable as "X" | "Y",
      philosophy: dbRow.philosophy,
      version: dbRow.version,
      definition: dbRow.definition,
      prompt_template: dbRow.prompt_template || undefined,
      prompt_params: dbRow.prompt_params || undefined,
      is_baseline: dbRow.is_baseline || false,
      notes: dbRow.notes || undefined,
      created_at: dbRow.created_at,
    };
  }
}
