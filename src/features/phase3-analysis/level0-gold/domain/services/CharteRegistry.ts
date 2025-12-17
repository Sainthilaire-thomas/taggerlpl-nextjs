// ============================================================================
// CharteRegistry - Wrapper vers base de données (v2.0)
// Anciennement : Définitions en dur
// Maintenant : Charge depuis level0_chartes via CharteManagementService
// ============================================================================

import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";
import { CharteManagementService } from "./CharteManagementService";

/**
 * Registry des chartes - Maintenant un wrapper vers la base de données
 * 
 * MIGRATION v1.0 → v2.0:
 * - Avant : Chartes définies en dur dans ce fichier
 * - Après : Chartes chargées depuis level0_chartes (Supabase)
 * 
 * Avantages v2.0:
 * - Versioning explicite des chartes
 * - Distinction philosophie/prompt
 * - Modification sans recompilation
 * - Historique en DB
 */
export class CharteRegistry {
  // Cache en mémoire pour éviter requêtes répétées
  private static cache: CharteDefinition[] | null = null;
  private static cacheTimestamp: number | null = null;
  private static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Retourne toutes les chartes définies
   * (Charge depuis DB avec cache)
   */
  static async getAllChartes(): Promise<CharteDefinition[]> {
    // Vérifier cache
    if (this.cache && this.cacheTimestamp) {
      const age = Date.now() - this.cacheTimestamp;
      if (age < this.CACHE_TTL_MS) {
        console.log("[CharteRegistry] Retour depuis cache");
        return this.cache;
      }
    }

    // Charger depuis DB
    console.log("[CharteRegistry] Chargement depuis DB");
    const { data, error } = await CharteManagementService.getAllChartes();

    if (error || !data) {
      console.error("[CharteRegistry] Error loading chartes:", error);
      // Fallback vers cache périmé si erreur
      return this.cache || [];
    }

    // Mettre à jour cache
    this.cache = data;
    this.cacheTimestamp = Date.now();

    return data;
  }

  /**
   * Retourne les chartes pour une variable spécifique
   */
  static async getChartesForVariable(
    variable: "X" | "Y"
  ): Promise<CharteDefinition[]> {
    const { data, error } = await CharteManagementService.getChartesForVariable(
      variable
    );

    if (error || !data) {
      console.error(
        `[CharteRegistry] Error loading chartes for variable ${variable}:`,
        error
      );
      return [];
    }

    return data;
  }

  /**
   * Retourne une charte par son ID
   */
  static async getCharteById(
    charteId: string
  ): Promise<CharteDefinition | undefined> {
    const { data, error } = await CharteManagementService.getCharteById(charteId);

    if (error || !data) {
      console.error(
        `[CharteRegistry] Error loading charte ${charteId}:`,
        error
      );
      return undefined;
    }

    return data;
  }

  /**
   * Retourne les chartes baseline (recommandées pour tests initiaux)
   */
  static async getBaselines(): Promise<CharteDefinition[]> {
    const { data, error } = await CharteManagementService.getBaselines();

    if (error || !data) {
      console.error("[CharteRegistry] Error loading baselines:", error);
      return [];
    }

    return data;
  }

  /**
   * Retourne les chartes d'une philosophie donnée
   */
  static async getChartesByPhilosophy(
    philosophy: string
  ): Promise<CharteDefinition[]> {
    const { data, error } = await CharteManagementService.getChartesByPhilosophy(
      philosophy
    );

    if (error || !data) {
      console.error(
        `[CharteRegistry] Error loading chartes for philosophy ${philosophy}:`,
        error
      );
      return [];
    }

    return data;
  }

  /**
   * Retourne les philosophies disponibles pour une variable
   */
  static async getPhilosophies(variable?: "X" | "Y"): Promise<string[]> {
    const { data, error } = await CharteManagementService.getPhilosophies(
      variable
    );

    if (error || !data) {
      console.error("[CharteRegistry] Error loading philosophies:", error);
      return [];
    }

    return data;
  }

  /**
   * Invalider le cache (forcer rechargement)
   */
  static invalidateCache(): void {
    console.log("[CharteRegistry] Cache invalidé");
    this.cache = null;
    this.cacheTimestamp = null;
  }

  // ==========================================================================
  // Méthodes de compatibilité (pour code existant qui utilise sync)
  // ==========================================================================

  /**
   * Version synchrone - DÉPRÉCIÉE
   * Utiliser getChartesForVariable() async à la place
   * 
   * Retourne cache s'il existe, tableau vide sinon
   */
  static getChartesForVariableSync(variable: "X" | "Y"): CharteDefinition[] {
    console.warn(
      "[CharteRegistry] getChartesForVariableSync est déprécié, utilisez async"
    );

    if (!this.cache) {
      console.error(
        "[CharteRegistry] Cache vide, appelez getAllChartes() d'abord"
      );
      return [];
    }

    return this.cache.filter((c) => c.variable === variable);
  }

  /**
   * Précharger le cache au démarrage de l'app
   */
  static async preload(): Promise<void> {
    console.log("[CharteRegistry] Préchargement des chartes...");
    await this.getAllChartes();
    console.log("[CharteRegistry] Préchargement terminé");
  }
}

// ==========================================================================
// ANCIENNES MÉTHODES (v1.0) - COMMENTÉES POUR RÉFÉRENCE
// ==========================================================================

/*
// Ces méthodes étaient dans v1.0, maintenant remplacées par DB

static getCharteY_A(): CharteDefinition {
  return {
    charte_id: "CharteY_A_v1.0.0",
    charte_name: "Charte A - Minimaliste",
    ...
  };
}

static getCharteY_B(): CharteDefinition {
  return {
    charte_id: "CharteY_B_v1.0.0",
    charte_name: "Charte B - Enrichie",
    ...
  };
}

static getCharteY_C(): CharteDefinition { ... }
static getCharteX_A(): CharteDefinition { ... }
static getCharteX_B(): CharteDefinition { ... }
*/
