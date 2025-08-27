// algorithms/level1/shared/initializeClassifiers.ts

import { ClassifierRegistry } from "./ClassifierRegistry";
import { RegexConseillerClassifier } from "../conseillerclassifiers/RegexConseillerClassifier";
import { SpacyConseillerClassifier } from "../conseillerclassifiers/SpacyConseillerClassifier";

export function initializeClassifiers(): void {
  console.log("🚀 Initialisation des classificateurs Algorithm Lab...");

  // Éviter la double initialisation
  if (ClassifierRegistry.listRegistered().length > 0) {
    console.log("✓ Classificateurs déjà initialisés");
    return;
  }

  try {
    // 1. Classificateur règles (existant, stable)
    const regexClassifier = new RegexConseillerClassifier();
    ClassifierRegistry.register("RegexConseillerClassifier", regexClassifier);
    console.log("✓ RegexConseillerClassifier enregistré");

    // 2. NOUVEAU : Classificateur spaCy ML
    const spacyClassifier = new SpacyConseillerClassifier({
      apiUrl: process.env.SPACY_API_URL || "http://localhost:8000/classify",
      model: "fr_core_news_md",
      timeout: 5000,
      confidenceThreshold: 0.6,
    });
    ClassifierRegistry.register("SpacyConseillerClassifier", spacyClassifier);
    console.log("✓ SpacyConseillerClassifier enregistré");

    // Test de connexion spaCy (non-bloquant)
    spacyClassifier
      .testConnection()
      .then((result) => {
        if (result.success) {
          console.log(`🟢 spaCy API: ${result.message}`);
        } else {
          console.warn(`🟡 spaCy API non disponible: ${result.message}`);
          console.warn(
            "💡 Pour activer spaCy: démarrer API locale ou configurer SPACY_API_URL"
          );
        }
      })
      .catch((error) => {
        console.warn("🟡 Test connexion spaCy échoué:", error.message);
      });

    // 3. FUTUR : Autres classificateurs (préparation)
    /* 
    // OpenAI GPT (nécessite clé API)
    if (process.env.OPENAI_API_KEY) {
      const openaiClassifier = new OpenAIConseillerClassifier({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4o-mini"
      });
      ClassifierRegistry.register('OpenAIConseillerClassifier', openaiClassifier);
      console.log('✓ OpenAIConseillerClassifier enregistré');
    }

    // Mistral AI (nécessite clé API) 
    if (process.env.MISTRAL_API_KEY) {
      const mistralClassifier = new MistralConseillerClassifier({
        apiKey: process.env.MISTRAL_API_KEY
      });
      ClassifierRegistry.register('MistralConseillerClassifier', mistralClassifier);
      console.log('✓ MistralConseillerClassifier enregistré');
    }
    */

    const registeredCount = ClassifierRegistry.listRegistered().length;
    console.log(
      `🎯 ${registeredCount} classificateur(s) disponible(s) dans Algorithm Lab`
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation des classificateurs:",
      error
    );
  }
}

// Auto-initialisation à l'import (pour intégration transparente)
initializeClassifiers();

// Export des métadonnées pour debugging
export function getClassifierStatus(): Record<string, any> {
  const registered = ClassifierRegistry.listRegistered();

  return {
    totalCount: registered.length,
    classifiers: registered.map((name) => {
      const classifier = ClassifierRegistry.getClassifier(name);
      return {
        name,
        metadata: classifier?.getMetadata(),
        isValid: classifier?.validateConfig(),
      };
    }),
    environment: {
      spacyApiUrl: process.env.SPACY_API_URL || "localhost:8000 (default)",
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasMistral: !!process.env.MISTRAL_API_KEY,
    },
  };
}

// Fonction utilitaire pour tests
export async function testAllClassifiers(
  sampleVerbatim: string = "je vais vérifier votre dossier"
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const name of ClassifierRegistry.listRegistered()) {
    const classifier = ClassifierRegistry.getClassifier(name);
    if (!classifier) continue;

    try {
      const startTime = Date.now();
      const result = await classifier.classify(sampleVerbatim);
      results[name] = {
        success: true,
        result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      results[name] = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return results;
}
