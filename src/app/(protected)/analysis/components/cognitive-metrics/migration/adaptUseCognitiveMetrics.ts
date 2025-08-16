// src/app/(protected)/analysis/components/cognitive-metrics/migration/adaptUseCognitiveMetrics.ts

import { useState, useEffect, useMemo } from "react";
import { useMetricsEngine } from "../../metrics-framework/hooks/useMetricsEngine";
import { metricsRegistry } from "../../metrics-framework/core/MetricsRegistry";
import initializeCognitiveDomain from "../CognitiveMetricsRegistry";
import { useCognitiveMetrics } from "../../cognitive-metrics/hooks/useCognitiveMetrics";

/**
 * Adapter le hook existant useCognitiveMetrics vers le framework unifié
 * Permet une migration douce sans casser l'interface existante
 */

interface LegacyCognitiveMetrics {
  fluiditeCognitive: number;
  chargeCognitive: number;
  marqueurs: string[];
  isNewFramework: boolean;
  toggleFramework: () => void;
}

export function useAdaptedCognitiveMetrics(
  data?: any[]
): LegacyCognitiveMetrics {
  const [useNewFramework, setUseNewFramework] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hook existant (votre code)
  const legacyMetrics = useCognitiveMetrics(); // Utilise votre hook existant

  // Hook du framework unifié
  const unifiedEngine = useMetricsEngine({
    domain: "cognitive",
    enableCaching: true,
    enableBenchmarking: false, // Désactivé pour les tests legacy
  });

  // Initialisation du framework unifié si pas encore fait
  useEffect(() => {
    if (!isInitialized) {
      try {
        const success = initializeCognitiveDomain();
        setIsInitialized(success);

        if (success) {
          console.log(
            "✅ Framework cognitif initialisé pour adaptation legacy"
          );
        } else {
          console.warn("⚠️ Échec initialisation framework cognitif");
        }
      } catch (error) {
        console.error("❌ Erreur initialisation framework cognitif:", error);
        setIsInitialized(false);
      }
    }
  }, [isInitialized]);

  // Adaptation des résultats selon le mode
  const adaptedResults = useMemo(() => {
    if (!useNewFramework || !isInitialized) {
      // Mode legacy : Utiliser votre hook existant
      return {
        fluiditeCognitive: legacyMetrics.data.fluiditeCognitive,
        chargeCognitive: legacyMetrics.data.chargeCognitive,
        marqueurs: extractMarqueursFromLegacy(legacyMetrics.data),
      };
    }

    // Mode nouveau framework : Adapter les résultats réels
    const results = unifiedEngine.results;

    if (Object.keys(results).length === 0) {
      return {
        fluiditeCognitive: 0.0,
        chargeCognitive: 1.0,
        marqueurs: ["en_attente"],
      };
    }

    // Extraire les résultats de fluidité cognitive
    const fluiditeResults = results["fluidite_cognitive"] || [];

    if (fluiditeResults.length === 0) {
      return {
        fluiditeCognitive: 0.5,
        chargeCognitive: 0.5,
        marqueurs: ["pas_de_donnees"],
      };
    }

    // Calculer la moyenne de fluidité
    const avgFluidite =
      fluiditeResults.reduce((sum, result) => {
        const value = typeof result.value === "number" ? result.value : 0;
        return sum + value;
      }, 0) / fluiditeResults.length;

    // Calculer la charge cognitive (inverse de la fluidité)
    const chargeCognitive = Math.max(0, Math.min(1, 1 - avgFluidite));

    // Extraire les marqueurs des explanations
    const marqueurs = fluiditeResults
      .map((result) => {
        if (result.explanation) {
          const parts = result.explanation.split("|");
          return parts[0]?.trim() || "inconnu";
        }
        return "inconnu";
      })
      .filter(Boolean)
      .slice(0, 3); // Limiter à 3 marqueurs

    return {
      fluiditeCognitive: avgFluidite,
      chargeCognitive,
      marqueurs: marqueurs.length > 0 ? marqueurs : ["automatique"],
    };
  }, [useNewFramework, isInitialized, unifiedEngine.results, legacyMetrics]);

  // Fonction pour basculer entre legacy et nouveau framework
  const toggleFramework = () => {
    if (!isInitialized) {
      console.warn(
        "⚠️ Framework unifié non initialisé - impossible de basculer"
      );
      return;
    }

    setUseNewFramework((prev) => {
      const newState = !prev;
      console.log(
        `🔄 Basculement vers ${newState ? "framework unifié" : "mode legacy"}`
      );

      // Si on bascule vers le nouveau framework, déclencher un calcul
      if (newState && unifiedEngine.indicators.length > 0) {
        // Utiliser des données de test si pas de données fournies
        const testData = data && data.length > 0 ? data : generateTestData();
        unifiedEngine.calculateMetrics(testData);
      }

      return newState;
    });
  };

  return {
    ...adaptedResults,
    isNewFramework: useNewFramework,
    toggleFramework,
  };
}

/**
 * Extrait les marqueurs significatifs des métriques legacy
 */
function extractMarqueursFromLegacy(data: any): string[] {
  const marqueurs: string[] = [];

  if (data.fluiditeCognitive > 0.8) {
    marqueurs.push("traitement_automatique");
  } else if (data.fluiditeCognitive < 0.4) {
    marqueurs.push("effort_cognitif");
  } else {
    marqueurs.push("traitement_mixte");
  }

  if (data.chargeCognitive > 0.7) {
    marqueurs.push("charge_elevee");
  }

  if (data.marqueursEffort > 0.5) {
    marqueurs.push("marqueurs_effort");
  }

  if (data.reactionsDirectes > 0.8) {
    marqueurs.push("reactions_fluides");
  }

  return marqueurs.length > 0 ? marqueurs : ["neutre"];
}

/**
 * Génère des données de test pour la démonstration
 */
function generateTestData() {
  return [
    {
      id: 1,
      call_id: "demo_001",
      start_time: 0,
      end_time: 3.2,
      tag: "ENGAGEMENT",
      verbatim: "Bonjour, je comprends votre situation",
      next_turn_verbatim: "Oui merci, c'est exactement ça",
      next_turn_tag: "ACCORD",
      speaker: "conseiller",
    },
    {
      id: 2,
      call_id: "demo_001",
      start_time: 3.2,
      end_time: 8.5,
      tag: "ACCORD",
      verbatim: "Euh... comment dire... c'est compliqué",
      next_turn_verbatim: "Je vois que c'est important pour vous",
      next_turn_tag: "REFLET_JE",
      speaker: "client",
    },
    {
      id: 3,
      call_id: "demo_001",
      start_time: 8.5,
      end_time: 12.0,
      tag: "REFLET_JE",
      verbatim: "Absolument, je vois que c'est important",
      next_turn_verbatim: "Merci de me comprendre",
      next_turn_tag: "SATISFACTION",
      speaker: "conseiller",
    },
  ];
}

/**
 * Valide que la migration cognitive est fonctionnelle
 */
export function validateCognitiveMigration(): boolean {
  try {
    // Vérifier que le registre contient des indicateurs cognitifs
    const cognitiveIndicators = metricsRegistry.getByDomain("cognitive");
    if (cognitiveIndicators.length === 0) {
      console.error("❌ Aucun indicateur cognitif trouvé dans le registre");
      return false;
    }

    // Vérifier que la FluiditeCognitive est disponible
    const fluiditeIndicator = metricsRegistry.get("fluidite_cognitive");
    if (!fluiditeIndicator) {
      console.error("❌ Indicateur FluiditeCognitive non trouvé");
      return false;
    }

    // Vérifier que l'indicateur a des algorithmes
    const algorithms = fluiditeIndicator.getAvailableAlgorithms();
    if (algorithms.length === 0) {
      console.error("❌ Aucun algorithme disponible pour FluiditeCognitive");
      return false;
    }

    console.log(
      `✅ Migration cognitive validée: ${cognitiveIndicators.length} indicateurs, ${algorithms.length} algorithmes`
    );
    return true;
  } catch (error) {
    console.error("❌ Erreur validation migration cognitive:", error);
    return false;
  }
}

/**
 * Diagnostic de la migration cognitive
 */
export function diagnoseCognitiveMigration(): {
  isValid: boolean;
  details: {
    indicatorsCount: number;
    algorithmsCount: number;
    registryHealth: string;
    compatibility: string;
  };
  recommendations: string[];
} {
  const cognitiveIndicators = metricsRegistry.getByDomain("cognitive");
  const stats = metricsRegistry.getStats();
  const diagnosis = metricsRegistry.diagnose();

  const totalAlgorithms = cognitiveIndicators.reduce(
    (sum, ind) => sum + ind.getAvailableAlgorithms().length,
    0
  );

  const recommendations: string[] = [];

  if (cognitiveIndicators.length === 0) {
    recommendations.push(
      "Initialiser le domaine cognitif avec initializeCognitiveDomain()"
    );
  }

  if (totalAlgorithms < cognitiveIndicators.length * 2) {
    recommendations.push("Ajouter plus d'algorithmes pour chaque indicateur");
  }

  if (diagnosis.health === "critical" || diagnosis.health === "warning") {
    recommendations.push("Résoudre les problèmes de santé du registre");
  }

  return {
    isValid: cognitiveIndicators.length > 0 && totalAlgorithms > 0,
    details: {
      indicatorsCount: cognitiveIndicators.length,
      algorithmsCount: totalAlgorithms,
      registryHealth: diagnosis.health,
      compatibility:
        cognitiveIndicators.length > 0 ? "compatible" : "incompatible",
    },
    recommendations,
  };
}

export default useAdaptedCognitiveMetrics;
