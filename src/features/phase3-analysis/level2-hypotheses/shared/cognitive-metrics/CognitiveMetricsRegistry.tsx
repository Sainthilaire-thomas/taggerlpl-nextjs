// src/app/(protected)/analysis/components/cognitive-metrics/CognitiveMetricsRegistry.ts

import { metricsRegistry } from "@/features/phase3-analysis/shared/metrics-framework/core/MetricsRegistry";
import { FluiditeCognitiveIndicator } from "./indicators/FluiditeCognitiveIndicator/FluiditeCognitiveIndicator";

/**
 * Registre spécialisé pour les métriques cognitives
 * Centralise l'enregistrement de tous les indicateurs du domaine
 */

// ================ FONCTION D'ENREGISTREMENT ================

/**
 * Enregistre tous les indicateurs cognitives dans le registre global
 */
function registerCognitiveIndicators(): {
  success: boolean;
  registered: string[];
  failed: string[];
  summary: string;
} {
  console.log("🧠 Début enregistrement des indicateurs cognitifs...");

  const registered: string[] = [];
  const failed: string[] = [];

  try {
    // 1. Fluidité Cognitive (implémenté)
    const fluiditeIndicator = new FluiditeCognitiveIndicator();
    if (metricsRegistry.register(fluiditeIndicator)) {
      registered.push("fluidite_cognitive");
      console.log("✅ FluiditeCognitiveIndicator enregistré");
    } else {
      failed.push("fluidite_cognitive");
      console.error("❌ Échec enregistrement FluiditeCognitiveIndicator");
    }

    // 2. Autres indicateurs (placeholders pour extension future)
    // TODO: Ajouter ici les autres indicateurs quand ils seront implémentés
    // - ChargeCognitiveIndicator
    // - ReactionsDirectesIndicator
    // - ReprisesLexicalesIndicator
    // - MarqueursEffortIndicator
    // - PatternsResistanceIndicator
    // - RobustesseStressIndicator
    // - NiveauStressIndicator
    // - PositionConversationIndicator

    // Validation finale
    const registryStats = metricsRegistry.getStats();
    const cognitiveCount = registryStats.byDomain.cognitive;

    const summary = `Enregistrement cognitif terminé: ${registered.length} succès, ${failed.length} échecs. Total cognitif: ${cognitiveCount}`;

    console.log(`📊 ${summary}`);

    return {
      success: failed.length === 0,
      registered,
      failed,
      summary,
    };
  } catch (error) {
    console.error(
      "❌ Erreur critique lors de l'enregistrement cognitif:",
      error
    );
    return {
      success: false,
      registered,
      failed: ["critical_error"],
      summary: `Erreur critique: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
    };
  }
}

/**
 * Vérifie que tous les indicateurs cognitifs sont correctement enregistrés
 */
function validateCognitiveRegistry(): {
  valid: boolean;
  missing: string[];
  extra: string[];
  health: string;
} {
  const expectedIndicators = [
    "fluidite_cognitive",
    // TODO: Ajouter les autres quand implémentés
  ];

  const registeredCognitive = metricsRegistry.getByDomain("cognitive");
  const registeredIds = registeredCognitive.map((ind) => ind.getId());

  const missing = expectedIndicators.filter(
    (id) => !registeredIds.includes(id)
  );
  const extra = registeredIds.filter((id) => !expectedIndicators.includes(id));

  const diagnosis = metricsRegistry.diagnose();
  const cognitiveHealth = diagnosis.coverage.cognitive;

  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    health:
      cognitiveHealth > 80
        ? "excellent"
        : cognitiveHealth > 60
        ? "good"
        : "poor",
  };
}

/**
 * Obtient les statistiques du domaine cognitif
 */
function getCognitiveStats(): {
  totalIndicators: number;
  implementedIndicators: number;
  totalAlgorithms: number;
  averageAlgorithmsPerIndicator: number;
  coveragePercent: number;
} {
  const cognitiveIndicators = metricsRegistry.getByDomain("cognitive");
  const implemented = cognitiveIndicators.filter(
    (ind) => ind.getImplementationStatus() === "implemented"
  );

  const totalAlgorithms = cognitiveIndicators.reduce(
    (sum, ind) => sum + ind.getAvailableAlgorithms().length,
    0
  );

  const stats = metricsRegistry.getStats();
  const coveragePercent =
    stats.byDomain.cognitive > 0
      ? (implemented.length / cognitiveIndicators.length) * 100
      : 0;

  return {
    totalIndicators: cognitiveIndicators.length,
    implementedIndicators: implemented.length,
    totalAlgorithms,
    averageAlgorithmsPerIndicator:
      cognitiveIndicators.length > 0
        ? totalAlgorithms / cognitiveIndicators.length
        : 0,
    coveragePercent,
  };
}

/**
 * Recommandations pour améliorer le domaine cognitif
 */
function getCognitiveRecommendations(): string[] {
  const stats = getCognitiveStats();
  const validation = validateCognitiveRegistry();
  const recommendations: string[] = [];

  if (stats.implementedIndicators < 3) {
    recommendations.push(
      "Implémenter plus d'indicateurs cognitifs (objectif: 5-8 indicateurs)"
    );
  }

  if (stats.averageAlgorithmsPerIndicator < 2) {
    recommendations.push(
      "Ajouter des algorithmes alternatifs pour chaque indicateur (minimum 2-3)"
    );
  }

  if (validation.missing.length > 0) {
    recommendations.push(
      `Indicateurs manquants: ${validation.missing.join(", ")}`
    );
  }

  if (stats.coveragePercent < 80) {
    recommendations.push("Finaliser l'implémentation des indicateurs partiels");
  }

  if (recommendations.length === 0) {
    recommendations.push("Domaine cognitif bien configuré ✅");
  }

  return recommendations;
}

/**
 * Interface de diagnostic complet du domaine cognitif
 */
function diagnoseCognitiveDomain(): {
  status: "excellent" | "good" | "warning" | "critical";
  stats: ReturnType<typeof getCognitiveStats>;
  validation: ReturnType<typeof validateCognitiveRegistry>;
  recommendations: string[];
  summary: string;
} {
  const stats = getCognitiveStats();
  const validation = validateCognitiveRegistry();
  const recommendations = getCognitiveRecommendations();

  // Déterminer le statut global
  let status: "excellent" | "good" | "warning" | "critical";

  if (
    stats.implementedIndicators >= 3 &&
    stats.averageAlgorithmsPerIndicator >= 2 &&
    validation.valid
  ) {
    status = "excellent";
  } else if (
    stats.implementedIndicators >= 1 &&
    validation.missing.length <= 1
  ) {
    status = "good";
  } else if (stats.implementedIndicators >= 1) {
    status = "warning";
  } else {
    status = "critical";
  }

  const summary = `Domaine cognitif: ${status.toUpperCase()} | ${
    stats.implementedIndicators
  }/${stats.totalIndicators} indicateurs | ${
    stats.totalAlgorithms
  } algorithmes | ${stats.coveragePercent.toFixed(0)}% couverture`;

  return {
    status,
    stats,
    validation,
    recommendations,
    summary,
  };
}

// ================ FONCTION PRINCIPALE ================

/**
 * Fonction principale à appeler pour initialiser le domaine cognitif
 */
function initializeCognitiveDomain(): boolean {
  console.log("🚀 Initialisation du domaine Sciences Cognitives...");

  const registration = registerCognitiveIndicators();
  const diagnosis = diagnoseCognitiveDomain();

  console.log(`📊 Diagnostic final: ${diagnosis.summary}`);

  if (diagnosis.status === "critical") {
    console.error("❌ Échec critique de l'initialisation cognitive");
    return false;
  }

  console.log("✅ Domaine cognitif initialisé avec succès");
  return true;
}

// ================ EXPORTS (UNE SEULE FOIS) ================

export {
  // Fonctions principales
  registerCognitiveIndicators,
  validateCognitiveRegistry,
  getCognitiveStats,
  getCognitiveRecommendations,
  diagnoseCognitiveDomain,

  // Fonction d'initialisation
  initializeCognitiveDomain,

  // Alias pour compatibilité
  initializeCognitiveDomain as initCognitive,
};

// Export par défaut
export default initializeCognitiveDomain;
