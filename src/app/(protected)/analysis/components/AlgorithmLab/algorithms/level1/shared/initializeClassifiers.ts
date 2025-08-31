// algorithms/level1/shared/initializeClassifiers.ts

import { ClassifierRegistry } from "./ClassifierRegistry";
import { RegexConseillerClassifier } from "../conseillerclassifiers/RegexConseillerClassifier";
import { SpacyConseillerClassifier } from "../conseillerclassifiers/SpacyConseillerClassifier";
import { OpenAIConseillerClassifier } from "../conseillerclassifiers/OpenAIConseillerClassifier";
import { OpenAI3TConseillerClassifier } from "../conseillerclassifiers/OpenAI3TConseillerClassifier";

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

    // 2. Classificateur spaCy ML (existant)
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

    // 3) OpenAI — classificateur 1 tour
    const openaiClassifier = new OpenAIConseillerClassifier({
      apiKey: process.env.OPENAI_API_KEY, // ✅ uniquement côté serveur
      model: "gpt-4o-mini",
      temperature: 0.1,
      maxTokens: 50,
      timeout: 10000,
      enableFallback: true,
    });
    ClassifierRegistry.register("OpenAIConseillerClassifier", openaiClassifier);
    console.log("[Algolab] has OPENAI_API_KEY:", !!process.env.OPENAI_API_KEY);

    if (openaiClassifier.validateConfig()) {
      console.log("✓ OpenAIConseillerClassifier enregistré");
      openaiClassifier
        .testConnection()
        .then((ok) => {
          console.log(
            ok
              ? "🟢 OpenAI API (1T): Connecté"
              : "🟡 OpenAI API (1T): non accessible"
          );
        })
        .catch((e) =>
          console.warn("🟡 Test connexion OpenAI (1T) échoué:", e?.message)
        );
    } else {
      console.log(
        "⚠️  OpenAIConseillerClassifier enregistré (clé API manquante)"
      );
    }

    // 4) OpenAI — classificateur 3 tours (T-2, T-1, T0)
    const openai3T = new OpenAI3TConseillerClassifier({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      temperature: 0,
      maxTokens: 6,
      timeout: 10000,
      enableFallback: true,
      strictPromptMode: true, // prompt-only
    });
    ClassifierRegistry.register("OpenAI3TConseillerClassifier", openai3T);
    console.log("✓ OpenAI3TConseillerClassifier enregistré");

    if (openai3T.validateConfig()) {
      openai3T
        .testConnection()
        .then((ok) =>
          console.log(
            ok
              ? "🟢 OpenAI API (3T): Connecté"
              : "🟡 OpenAI API (3T): non accessible"
          )
        )
        .catch((e) => console.warn("🟡 Test OpenAI (3T) échoué:", e?.message));
    } else {
      console.log(
        "⚠️  OpenAI3TConseillerClassifier enregistré (clé API manquante)"
      );
    }

    // 5) FUTUR : autres classificateurs (préparation)
    /*
    // Mistral AI (nécessite clé API)
    if (process.env.MISTRAL_API_KEY) {
      const mistralClassifier = new MistralConseillerClassifier({
        apiKey: process.env.MISTRAL_API_KEY
      });
      ClassifierRegistry.register('MistralConseillerClassifier', mistralClassifier);
      console.log('✓ MistralConseillerClassifier enregistré');
    }

    // Hugging Face (nécessite clé API)
    if (process.env.HUGGINGFACE_API_KEY) {
      const hfClassifier = new HuggingFaceConseillerClassifier({
        apiKey: process.env.HUGGINGFACE_API_KEY,
        model: "nlptown/bert-base-multilingual-uncased-sentiment"
      });
      ClassifierRegistry.register('HuggingFaceConseillerClassifier', hfClassifier);
      console.log('✓ HuggingFaceConseillerClassifier enregistré');
    }
    */

    const registeredCount = ClassifierRegistry.listRegistered().length;
    console.log(
      `🎯 ${registeredCount} classificateur(s) disponible(s) dans Algorithm Lab`
    );

    // Log détaillé des classificateurs disponibles
    logClassifierStatus();
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation des classificateurs:",
      error
    );
  }
}

// Fonction utilitaire pour logger le statut détaillé
function logClassifierStatus(): void {
  const registered = ClassifierRegistry.listRegistered();

  console.log("\n📊 Statut des classificateurs:");
  console.log("================================");

  for (const name of registered) {
    const classifier = ClassifierRegistry.getClassifier(name);
    if (!classifier) continue;

    const metadata = classifier.getMetadata();
    const isValid = classifier.validateConfig();
    const statusIcon = isValid ? "✅" : "⚠️";

    console.log(`${statusIcon} ${metadata.name}`);
    console.log(`   Type: ${metadata.type} | Version: ${metadata.version}`);
    console.log(
      `   Batch: ${metadata.supportsBatch ? "Oui" : "Non"} | Configuré: ${
        isValid ? "Oui" : "Non"
      }`
    );

    if (!isValid) {
      console.log(`   ⚠️  Configuration requise pour utilisation`);
    }

    console.log("");
  }
}

// Auto-initialisation à l'import (pour intégration transparente)
if (typeof window === "undefined") {
  initializeClassifiers();
}

// Export des métadonnées pour debugging (fonction améliorée)
export function getClassifierStatus(): Record<string, any> {
  const registered = ClassifierRegistry.listRegistered();

  return {
    totalCount: registered.length,
    availableCount: registered.filter((name) => {
      const classifier = ClassifierRegistry.getClassifier(name);
      return classifier?.validateConfig();
    }).length,
    classifiers: registered.map((name) => {
      const classifier = ClassifierRegistry.getClassifier(name);
      const metadata = classifier?.getMetadata();

      return {
        name,
        registryName: name,
        displayName: metadata?.name,
        type: metadata?.type,
        version: metadata?.version,
        supportsBatch: metadata?.supportsBatch,
        isValid: classifier?.validateConfig(),
        isAvailable: classifier?.validateConfig(),
        description: metadata?.description,
      };
    }),
    environment: {
      // ✅ ne pas se baser sur NEXT_PUBLIC ici
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      spacyApiUrl: process.env.SPACY_API_URL || "localhost:8000 (default)",
      nodeEnv: process.env.NODE_ENV,
    },
    recommendations: getRecommendations(),
  };
}

// Nouvelles recommandations basées sur la configuration
function getRecommendations(): string[] {
  const recommendations: string[] = [];

  if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    recommendations.push(
      "Configurez OPENAI_API_KEY pour activer le classificateur GPT"
    );
  }

  if (!process.env.SPACY_API_URL) {
    recommendations.push(
      "Configurez SPACY_API_URL ou démarrez une API spaCy locale"
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_OPENAI_API_KEY
  ) {
    recommendations.push(
      "⚠️  En production, utilisez OPENAI_API_KEY (server-side) plutôt que NEXT_PUBLIC_OPENAI_API_KEY"
    );
  }

  return recommendations;
}

// Fonction utilitaire pour tests (améliorée)
export async function testAllClassifiers(
  sampleVerbatim: string = "je vais vérifier votre dossier"
): Promise<Record<string, any>> {
  console.log(
    `\n🧪 Test de tous les classificateurs avec: "${sampleVerbatim}"`
  );
  console.log(
    "================================================================"
  );

  const results: Record<string, any> = {};
  const registered = ClassifierRegistry.listRegistered();

  for (const name of registered) {
    const classifier = ClassifierRegistry.getClassifier(name);
    if (!classifier) continue;

    console.log(`\n🔍 Test ${name}...`);

    try {
      // Vérification de la configuration
      if (!classifier.validateConfig()) {
        results[name] = {
          success: false,
          error: "Configuration invalide",
          configured: false,
        };
        console.log(`   ❌ Configuration invalide`);
        continue;
      }

      const startTime = Date.now();
      const result = await classifier.classify(sampleVerbatim);
      const duration = Date.now() - startTime;

      results[name] = {
        success: true,
        result,
        duration,
        configured: true,
        prediction: result.prediction,
        confidence: result.confidence,
      };

      console.log(
        `   ✅ ${result.prediction} (${Math.round(
          result.confidence * 100
        )}%) - ${duration}ms`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      results[name] = {
        success: false,
        error: errorMsg,
        configured: true,
      };
      console.log(`   ❌ Erreur: ${errorMsg}`);
    }
  }

  console.log("\n📋 Résumé des tests:");
  console.log("====================");

  const successful = Object.values(results).filter((r) => r.success).length;
  const total = Object.keys(results).length;

  console.log(`✅ ${successful}/${total} classificateurs opérationnels`);

  if (successful < total) {
    console.log("💡 Vérifiez les configurations et variables d'environnement");
  }

  return results;
}

// Fonction utilitaire pour benchmark de performance
export async function benchmarkClassifiers(
  verbatims: string[] = [
    "je vais vérifier votre dossier",
    "vous allez recevoir un email",
    "je comprends votre situation",
    "d'accord c'est noté",
    "notre politique stipule que",
  ]
): Promise<Record<string, any>> {
  console.log(`\n⚡ Benchmark de performance (${verbatims.length} verbatims)`);
  console.log("=========================================================");

  const results: Record<string, any> = {};
  const registered = ClassifierRegistry.listRegistered();

  for (const name of registered) {
    const classifier = ClassifierRegistry.getClassifier(name);
    if (!classifier?.validateConfig()) continue;

    console.log(`\n📊 Benchmark ${name}...`);

    const startTime = Date.now();
    const classifications = [];

    try {
      for (const verbatim of verbatims) {
        const result = await classifier.classify(verbatim);
        classifications.push(result);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / verbatims.length;
      const avgConfidence =
        classifications.reduce((sum, r) => sum + r.confidence, 0) /
        classifications.length;

      results[name] = {
        success: true,
        totalTime,
        avgTime,
        avgConfidence,
        classifications,
        throughput: (verbatims.length / totalTime) * 1000, // classifications/seconde
      };

      console.log(`   ⏱️  Temps total: ${totalTime}ms`);
      console.log(`   📈 Temps moyen: ${Math.round(avgTime)}ms/classification`);
      console.log(
        `   🎯 Confiance moyenne: ${Math.round(avgConfidence * 100)}%`
      );
      console.log(
        `   🚀 Débit: ${results[name].throughput.toFixed(
          1
        )} classifications/sec`
      );
    } catch (error) {
      results[name] = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      console.log(`   ❌ Erreur: ${results[name].error}`);
    }
  }

  return results;
}
