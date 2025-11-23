// src/app/(protected)/analysis/components/metrics-framework/index.ts

/**
 * Point d'entrée principal du framework unifié de métriques
 * Version corrigée sans erreurs TypeScript
 */

// ================ CORE FRAMEWORK ================

// Classes de base
export {
  default as BaseIndicator,
  BaseAlgorithmStrategy,
} from "./core/BaseIndicator";

export {
  default as metricsRegistry,
  getIndicatorsByDomain,
  registerIndicator,
  searchIndicators,
} from "./core/MetricsRegistry";

// Types principaux
export type {
  MetricsDomain,
  ImplementationStatus,
  AlgorithmType,
  TurnTaggedData,
  TagInfo,
  BaseIndicatorConfig,
  AlgorithmConfig,
  IndicatorResult,
  FamilyResults,
  GlobalMetrics,
  AnnotationData,
  BenchmarkResult,
  AlgorithmComparison,
  ConvergenceResults,
  PerformanceMetrics,
  ABTestConfig,
  ABTestResults,
} from "./core/types/base";

// ================ HOOKS ================

// Hook principal
export { useMetricsEngine } from "./hooks/useMetricsEngine";

// ================ INDICATEURS ================

// Indicateurs cognitifs
export {
  FluiditeCognitiveIndicator,
  createFluiditeCognitiveIndicator,
} from "../cognitive-metrics/indicators/FluiditeCognitiveIndicator/FluiditeCognitiveIndicator";

// ================ REGISTRES SPÉCIALISÉS ================

// Import et re-export des fonctions du registre cognitif
import initializeCognitiveDomainFn, {
  registerCognitiveIndicators,
  validateCognitiveRegistry,
  getCognitiveStats,
  diagnoseCognitiveDomain,
} from "../cognitive-metrics/CognitiveMetricsRegistry";

export {
  initializeCognitiveDomainFn as initializeCognitiveDomain,
  registerCognitiveIndicators,
  validateCognitiveRegistry,
  getCognitiveStats,
  diagnoseCognitiveDomain,
};

// ================ COMPOSANTS ================

// Import des composants avec gestion d'erreur
import CognitiveMetricsMigration from "../cognitive-metrics/migration/CognitiveMetricsMigration";
import TestFrameworkIntegration from "../TestFrameworkIntegration";

export { CognitiveMetricsMigration, TestFrameworkIntegration };

// ================ UTILITAIRES DE MIGRATION ================

// Import des utilitaires de migration
import {
  useAdaptedCognitiveMetrics,
  validateCognitiveMigration,
  diagnoseCognitiveMigration,
} from "../cognitive-metrics/migration/adaptUseCognitiveMetrics";

export {
  useAdaptedCognitiveMetrics,
  validateCognitiveMigration,
  diagnoseCognitiveMigration,
};

// ================ IMPORTS POUR LES FONCTIONS ================

// Import explicite du registre pour les fonctions
import { metricsRegistry as registry } from "./core/MetricsRegistry";

// ================ UTILITAIRES GLOBAUX ================

/**
 * Initialise complètement le framework avec tous les domaines disponibles
 */
export async function initializeCompleteFramework(): Promise<{
  success: boolean;
  domains: string[];
  totalIndicators: number;
  summary: string;
}> {
  console.log("🚀 Initialisation complète du framework unifié...");

  const results: string[] = [];
  let totalIndicators = 0;

  try {
    // Initialiser le domaine cognitif
    const cognitiveSuccess = initializeCognitiveDomainFn();
    if (cognitiveSuccess) {
      results.push("cognitive");
      const cognitiveIndicators = registry.getByDomain("cognitive");
      totalIndicators += cognitiveIndicators.length;
    }

    // TODO: Ajouter ici l'initialisation des autres domaines
    // - LI (Linguistique Interactionnelle)
    // - AC (Analyse Conversationnelle)

    const stats = registry.getStats();
    const diagnosis = registry.diagnose();

    const summary = `Framework initialisé: ${results.length} domaines, ${stats.total} indicateurs, santé: ${diagnosis.health}`;

    console.log(`✅ ${summary}`);

    return {
      success: results.length > 0,
      domains: results,
      totalIndicators: stats.total,
      summary,
    };
  } catch (error) {
    console.error("❌ Erreur initialisation framework:", error);
    return {
      success: false,
      domains: results,
      totalIndicators: 0,
      summary: `Erreur: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
    };
  }
}

/**
 * Diagnostic rapide du framework
 */
export function quickDiagnosis(): {
  status: "healthy" | "warning" | "critical";
  message: string;
  details: any;
} {
  const stats = registry.getStats();
  const diagnosis = registry.diagnose();
  const validation = registry.validate();

  let status: "healthy" | "warning" | "critical";
  let message: string;

  if (stats.total === 0) {
    status = "critical";
    message = "Aucun indicateur enregistré - framework non initialisé";
  } else if (diagnosis.health === "critical" || !validation.valid) {
    status = "critical";
    message = "Problèmes critiques détectés dans le framework";
  } else if (
    diagnosis.health === "warning" ||
    stats.byStatus.implemented < stats.total * 0.5
  ) {
    status = "warning";
    message = "Framework fonctionnel mais nécessite des améliorations";
  } else {
    status = "healthy";
    message = "Framework opérationnel et en bonne santé";
  }

  return {
    status,
    message,
    details: {
      stats,
      diagnosis,
      validation: validation.valid,
      errors: validation.errors,
    },
  };
}

/**
 * Fonction helper pour debugging
 */
export function debugFramework(): void {
  console.group("🔍 Debug Framework Unifié");

  const diagnosis = quickDiagnosis();
  console.log("📊 Diagnostic:", diagnosis);

  const registrySummary = registry.summary();
  console.log("📋 Résumé registre:", registrySummary);

  console.groupEnd();
}

// ================ VERSION ET METADATA ================

export const FRAMEWORK_VERSION = "1.0.0";
export const FRAMEWORK_NAME = "TaggerLPL Unified Metrics Framework";

/**
 * Informations sur le framework
 */
export const frameworkInfo = {
  name: FRAMEWORK_NAME,
  version: FRAMEWORK_VERSION,
  description:
    "Framework unifié pour métriques conversationnelles multi-domaines",
  domains: ["cognitive", "li", "conversational_analysis"],
  features: [
    "Architecture modulaire",
    "Comparaison d'algorithmes",
    "Validation de convergence",
    "Cache intelligent",
    "Migration douce",
    "Tests automatisés",
  ],
  authors: ["TaggerLPL Team"],
  license: "MIT",
};

/**
 * Fonction de bienvenue pour nouveau utilisateur
 */
export function welcomeMessage(): string {
  return `
🎉 Bienvenue dans ${FRAMEWORK_NAME} v${FRAMEWORK_VERSION}

🚀 Framework unifié pour métriques conversationnelles
   • Architecture modulaire et extensible
   • Support multi-domaines (Cognitif, LI, AC)
   • Comparaison d'algorithmes intégrée
   • Migration douce depuis l'existant

📚 Pour commencer:
   1. Initialiser: initializeCompleteFramework()
   2. Tester: import TestFrameworkIntegration
   3. Migrer: import CognitiveMetricsMigration
   4. Développer: étendre BaseIndicator

💡 Aide: debugFramework() pour diagnostiquer les problèmes
  `;
}

// ================ EXPORT DEFAULT ================

// Import des exports pour le default export
import { useMetricsEngine } from "./hooks/useMetricsEngine";
import { FluiditeCognitiveIndicator } from "../cognitive-metrics/indicators/FluiditeCognitiveIndicator/FluiditeCognitiveIndicator";

const defaultExport = {
  // Core
  metricsRegistry: registry,
  useMetricsEngine,

  // Indicateurs
  FluiditeCognitiveIndicator,

  // Initialisation
  initializeCompleteFramework,
  initializeCognitiveDomain: initializeCognitiveDomainFn,

  // Composants
  CognitiveMetricsMigration,
  TestFrameworkIntegration,

  // Utilitaires
  quickDiagnosis,
  debugFramework,
  welcomeMessage,

  // Metadata
  frameworkInfo,
  version: FRAMEWORK_VERSION,
};

export default defaultExport;
