// src/app/(protected)/analysis/components/metrics-framework/core/MetricsRegistry.ts

import BaseIndicator from "./BaseIndicator";
import {
  MetricsDomain,
  BaseIndicatorConfig,
  ImplementationStatus,
} from "./types/base";

/**
 * Registre central pour tous les indicateurs du framework
 *
 * Permet l'enregistrement dynamique et la découverte d'indicateurs
 * pour tous les domaines (cognitive, LI, AC)
 */
class MetricsRegistry {
  private indicators: Map<string, BaseIndicator> = new Map();
  private domainIndicators: Map<MetricsDomain, string[]> = new Map();
  private categoryIndicators: Map<string, string[]> = new Map();

  constructor() {
    // Initialiser les maps pour chaque domaine
    this.domainIndicators.set("cognitive", []);
    this.domainIndicators.set("li", []);
    this.domainIndicators.set("conversational_analysis", []);
  }

  // ================ ENREGISTREMENT D'INDICATEURS ================

  /**
   * Enregistre un nouvel indicateur dans le registre
   */
  register(indicator: BaseIndicator): boolean {
    const id = indicator.getId();
    const domain = indicator.getDomain();
    const category = indicator.getCategory();

    if (this.indicators.has(id)) {
      console.warn(`Indicateur ${id} déjà enregistré - écrasement`);
    }

    try {
      // Enregistrer l'indicateur
      this.indicators.set(id, indicator);

      // Indexer par domaine
      if (!this.domainIndicators.has(domain)) {
        this.domainIndicators.set(domain, []);
      }
      const domainList = this.domainIndicators.get(domain)!;
      if (!domainList.includes(id)) {
        domainList.push(id);
      }

      // Indexer par catégorie
      if (!this.categoryIndicators.has(category)) {
        this.categoryIndicators.set(category, []);
      }
      const categoryList = this.categoryIndicators.get(category)!;
      if (!categoryList.includes(id)) {
        categoryList.push(id);
      }

      console.log(
        `✅ Indicateur ${id} enregistré avec succès (${domain}/${category})`
      );
      return true;
    } catch (error) {
      console.error(`❌ Erreur enregistrement ${id}:`, error);
      return false;
    }
  }

  /**
   * Enregistre plusieurs indicateurs en batch
   */
  registerBatch(indicators: BaseIndicator[]): {
    success: number;
    failed: number;
  } {
    let success = 0;
    let failed = 0;

    for (const indicator of indicators) {
      if (this.register(indicator)) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`📊 Enregistrement batch: ${success} succès, ${failed} échecs`);
    return { success, failed };
  }

  // ================ RECUPERATION D'INDICATEURS ================

  /**
   * Récupère un indicateur par son ID
   */
  get(id: string): BaseIndicator | undefined {
    return this.indicators.get(id);
  }

  /**
   * Récupère tous les indicateurs d'un domaine
   */
  getByDomain(domain: MetricsDomain): BaseIndicator[] {
    const ids = this.domainIndicators.get(domain) || [];
    return ids.map((id) => this.indicators.get(id)!).filter(Boolean);
  }

  /**
   * Récupère tous les indicateurs d'une catégorie
   */
  getByCategory(category: string): BaseIndicator[] {
    const ids = this.categoryIndicators.get(category) || [];
    return ids.map((id) => this.indicators.get(id)!).filter(Boolean);
  }

  /**
   * Récupère tous les indicateurs avec un statut d'implémentation donné
   */
  getByStatus(status: ImplementationStatus): BaseIndicator[] {
    return Array.from(this.indicators.values()).filter(
      (indicator) => indicator.getImplementationStatus() === status
    );
  }

  /**
   * Récupère tous les indicateurs
   */
  getAll(): BaseIndicator[] {
    return Array.from(this.indicators.values());
  }

  // ================ RECHERCHE ET FILTRAGE ================

  /**
   * Recherche des indicateurs par nom ou description
   */
  search(query: string): BaseIndicator[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.indicators.values()).filter(
      (indicator) =>
        indicator.getName().toLowerCase().includes(lowerQuery) ||
        indicator.getDescription().toLowerCase().includes(lowerQuery) ||
        indicator.getId().toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filtre les indicateurs selon des critères multiples
   */
  filter(criteria: {
    domain?: MetricsDomain;
    category?: string;
    status?: ImplementationStatus;
    hasAlgorithms?: boolean;
  }): BaseIndicator[] {
    let results = Array.from(this.indicators.values());

    if (criteria.domain) {
      results = results.filter((ind) => ind.getDomain() === criteria.domain);
    }

    if (criteria.category) {
      results = results.filter(
        (ind) => ind.getCategory() === criteria.category
      );
    }

    if (criteria.status) {
      results = results.filter(
        (ind) => ind.getImplementationStatus() === criteria.status
      );
    }

    if (criteria.hasAlgorithms !== undefined) {
      results = results.filter((ind) => {
        const hasAlgs = ind.getAvailableAlgorithms().length > 0;
        return criteria.hasAlgorithms ? hasAlgs : !hasAlgs;
      });
    }

    return results;
  }

  // ================ STATISTIQUES ET DIAGNOSTIC ================

  /**
   * Retourne des statistiques du registre
   */
  getStats(): {
    total: number;
    byDomain: Record<MetricsDomain, number>;
    byStatus: Record<ImplementationStatus, number>;
    byCategory: Record<string, number>;
    totalAlgorithms: number;
  } {
    const indicators = Array.from(this.indicators.values());

    const byDomain: Record<MetricsDomain, number> = {
      cognitive: 0,
      li: 0,
      conversational_analysis: 0,
    };

    const byStatus: Record<ImplementationStatus, number> = {
      implemented: 0,
      partial: 0,
      missing: 0,
    };

    const byCategory: Record<string, number> = {};
    let totalAlgorithms = 0;

    for (const indicator of indicators) {
      byDomain[indicator.getDomain()]++;
      byStatus[indicator.getImplementationStatus()]++;

      const category = indicator.getCategory();
      byCategory[category] = (byCategory[category] || 0) + 1;

      totalAlgorithms += indicator.getAvailableAlgorithms().length;
    }

    return {
      total: indicators.length,
      byDomain,
      byStatus,
      byCategory,
      totalAlgorithms,
    };
  }

  /**
   * Diagnostic de la santé du registre
   */
  diagnose(): {
    health: "excellent" | "good" | "warning" | "critical";
    issues: string[];
    recommendations: string[];
    coverage: Record<MetricsDomain, number>;
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Calcul de la couverture par domaine (% implémentés)
    const coverage: Record<MetricsDomain, number> = {
      cognitive: 0,
      li: 0,
      conversational_analysis: 0,
    };

    for (const domain of Object.keys(coverage) as MetricsDomain[]) {
      const domainIndicators = this.getByDomain(domain);
      const implemented = domainIndicators.filter(
        (ind) => ind.getImplementationStatus() === "implemented"
      ).length;
      coverage[domain] =
        domainIndicators.length > 0
          ? Math.round((implemented / domainIndicators.length) * 100)
          : 0;
    }

    // Analyse des problèmes
    if (stats.total === 0) {
      issues.push("Aucun indicateur enregistré");
      recommendations.push("Commencer par enregistrer les indicateurs de base");
    }

    if (stats.byStatus.implemented < stats.total * 0.5) {
      issues.push("Moins de 50% des indicateurs sont implémentés");
      recommendations.push(
        "Prioriser l'implémentation des indicateurs critiques"
      );
    }

    if (stats.totalAlgorithms < stats.total * 2) {
      issues.push("Moins de 2 algorithmes par indicateur en moyenne");
      recommendations.push(
        "Ajouter des algorithmes alternatifs pour la comparaison"
      );
    }

    // Vérifier la couverture par domaine
    for (const [domain, percent] of Object.entries(coverage)) {
      if (percent < 30) {
        issues.push(`Couverture faible du domaine ${domain}: ${percent}%`);
        recommendations.push(
          `Développer les indicateurs manquants pour ${domain}`
        );
      }
    }

    // Détermination de la santé globale
    let health: "excellent" | "good" | "warning" | "critical";

    if (
      issues.length === 0 &&
      stats.byStatus.implemented >= stats.total * 0.8
    ) {
      health = "excellent";
    } else if (
      issues.length <= 2 &&
      stats.byStatus.implemented >= stats.total * 0.6
    ) {
      health = "good";
    } else if (
      issues.length <= 4 &&
      stats.byStatus.implemented >= stats.total * 0.3
    ) {
      health = "warning";
    } else {
      health = "critical";
    }

    return {
      health,
      issues,
      recommendations,
      coverage,
    };
  }

  // ================ GESTION ET MAINTENANCE ================

  /**
   * Supprime un indicateur du registre
   */
  unregister(id: string): boolean {
    const indicator = this.indicators.get(id);
    if (!indicator) {
      console.warn(`Indicateur ${id} non trouvé pour suppression`);
      return false;
    }

    const domain = indicator.getDomain();
    const category = indicator.getCategory();

    // Supprimer de l'index principal
    this.indicators.delete(id);

    // Supprimer des index secondaires
    const domainList = this.domainIndicators.get(domain);
    if (domainList) {
      const index = domainList.indexOf(id);
      if (index > -1) {
        domainList.splice(index, 1);
      }
    }

    const categoryList = this.categoryIndicators.get(category);
    if (categoryList) {
      const index = categoryList.indexOf(id);
      if (index > -1) {
        categoryList.splice(index, 1);
      }
    }

    console.log(`🗑️ Indicateur ${id} supprimé du registre`);
    return true;
  }

  /**
   * Efface tous les indicateurs
   */
  clear(): void {
    this.indicators.clear();
    this.domainIndicators.clear();
    this.categoryIndicators.clear();

    // Réinitialiser les domaines
    this.domainIndicators.set("cognitive", []);
    this.domainIndicators.set("li", []);
    this.domainIndicators.set("conversational_analysis", []);

    console.log("🧹 Registre nettoyé");
  }

  /**
   * Valide la cohérence du registre
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier que tous les indicateurs dans les index existent
    for (const [domain, ids] of this.domainIndicators) {
      for (const id of ids) {
        if (!this.indicators.has(id)) {
          errors.push(
            `Indicateur ${id} référencé dans domaine ${domain} mais absent du registre principal`
          );
        }
      }
    }

    for (const [category, ids] of this.categoryIndicators) {
      for (const id of ids) {
        if (!this.indicators.has(id)) {
          errors.push(
            `Indicateur ${id} référencé dans catégorie ${category} mais absent du registre principal`
          );
        }
      }
    }

    // Vérifier la cohérence des métadonnées
    for (const [id, indicator] of this.indicators) {
      const domain = indicator.getDomain();
      const category = indicator.getCategory();

      const domainList = this.domainIndicators.get(domain) || [];
      if (!domainList.includes(id)) {
        errors.push(`Indicateur ${id} absent de l'index du domaine ${domain}`);
      }

      const categoryList = this.categoryIndicators.get(category) || [];
      if (!categoryList.includes(id)) {
        errors.push(
          `Indicateur ${id} absent de l'index de la catégorie ${category}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ================ IMPORT/EXPORT ================

  /**
   * Exporte la configuration du registre
   */
  export(): {
    indicators: BaseIndicatorConfig[];
    domains: Record<MetricsDomain, string[]>;
    categories: Record<string, string[]>;
    timestamp: string;
    version: string;
  } {
    const indicators = Array.from(this.indicators.values()).map((ind) => ({
      id: ind.getId(),
      name: ind.getName(),
      domain: ind.getDomain(),
      category: ind.getCategory(),
      implementationStatus: ind.getImplementationStatus(),
      description: ind.getDescription(),
      theoreticalFoundation: ind.getTheoreticalFoundation(),
      dataRequirements: [], // Serait à enrichir selon les besoins
    }));

    const domains = Object.fromEntries(this.domainIndicators) as Record<
      MetricsDomain,
      string[]
    >;
    const categories = Object.fromEntries(this.categoryIndicators);

    return {
      indicators,
      domains,
      categories,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }

  /**
   * Affiche un résumé du registre
   */
  summary(): string {
    const stats = this.getStats();
    const diagnosis = this.diagnose();

    return `
📊 REGISTRE DE MÉTRIQUES - RÉSUMÉ
═══════════════════════════════════

🔢 Statistiques générales:
  • Total indicateurs: ${stats.total}
  • Total algorithmes: ${stats.totalAlgorithms}
  • Moyenne alg/indicateur: ${
    stats.total > 0 ? (stats.totalAlgorithms / stats.total).toFixed(1) : 0
  }

📊 Par domaine:
  • Cognitif: ${stats.byDomain.cognitive} indicateurs (${
      diagnosis.coverage.cognitive
    }% implémentés)
  • LI: ${stats.byDomain.li} indicateurs (${
      diagnosis.coverage.li
    }% implémentés)  
  • AC: ${stats.byDomain.conversational_analysis} indicateurs (${
      diagnosis.coverage.conversational_analysis
    }% implémentés)

🚦 Statut d'implémentation:
  • ✅ Implémentés: ${stats.byStatus.implemented}
  • ⚠️ Partiels: ${stats.byStatus.partial}
  • ❌ Manquants: ${stats.byStatus.missing}

🏥 Santé du registre: ${diagnosis.health.toUpperCase()}
${
  diagnosis.issues.length > 0
    ? `
⚠️ Problèmes identifiés:
${diagnosis.issues.map((issue) => `  • ${issue}`).join("\n")}

💡 Recommandations:
${diagnosis.recommendations.map((rec) => `  • ${rec}`).join("\n")}
`
    : "  • Aucun problème détecté"
}
═══════════════════════════════════
    `.trim();
  }
}

// ================ INSTANCE SINGLETON ================

/**
 * Instance singleton du registre global
 */
export const metricsRegistry = new MetricsRegistry();

/**
 * Fonction helper pour récupérer les indicateurs par domaine
 */
export function getIndicatorsByDomain(domain: MetricsDomain): BaseIndicator[] {
  return metricsRegistry.getByDomain(domain);
}

/**
 * Fonction helper pour enregistrer un indicateur
 */
export function registerIndicator(indicator: BaseIndicator): boolean {
  return metricsRegistry.register(indicator);
}

/**
 * Fonction helper pour rechercher des indicateurs
 */
export function searchIndicators(query: string): BaseIndicator[] {
  return metricsRegistry.search(query);
}

export default metricsRegistry;
