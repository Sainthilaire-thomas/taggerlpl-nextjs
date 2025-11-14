// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms.ts

import { algorithmRegistry } from "./AlgorithmRegistry";

// --- X (Conseiller)
import { RegexXClassifier } from "../XAlgorithms/RegexXClassifier";
import { SpacyXClassifier } from "../XAlgorithms/SpacyXClassifier";
import { OpenAIXClassifier } from "../XAlgorithms/OpenAIXClassifier";
import { OpenAI3TXClassifier } from "../XAlgorithms/OpenAI3TXClassifier";

// --- Y (Client)
import { RegexYClassifier } from "../YAlgorithms/RegexYClassifier";

// --- M1 (Compteurs / métriques)
import { M1ActionVerbCounter } from "../M1Algorithms/M1ActionVerbCounter";

// --- M2 (Alignement X→Y)
import M2LexicalAlignmentCalculator from "../M2Algorithms/M2LexicalAlignmentCalculator";
import M2SemanticAlignmentCalculator from "../M2Algorithms/M2SemanticAlignmentCalculator";
import M2CompositeAlignmentCalculator from "../M2Algorithms/M2CompositeAlignmentCalculator";

// --- M3 (charge cognitive)
import { PausesM3Calculator } from "../M3Algorithms/PausesM3Calculator";

// Flag d'initialisation global
let initialized = false;

/**
 * Initialise et enregistre tous les algorithmes disponibles.
 * - S'exécute une seule fois
 * - Tous les algorithmes implémentent UniversalAlgorithm
 * - Configuration basée sur les variables d'environnement
 */
export function initializeAlgorithms(): void {
  if (initialized) return;

  console.log("🚀 Initialisation AlgorithmLab harmonisé...");

  try {
    // Centralisation des variables d'environnement
    const openAIKey =
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      "";
    const spacyUrl =
      process.env.SPACY_API_URL || "http://localhost:8000/classify";
    const isDev = process.env.NODE_ENV === "development";

    // ===== X (classifieurs conseiller) =====
    algorithmRegistry.register("RegexXClassifier", new RegexXClassifier());

    // SpaCy avec configuration complète
    if (spacyUrl || isDev) {
      const spacyX = new SpacyXClassifier({
        apiUrl: spacyUrl,
        model: "fr_core_news_md",
        timeout: 5000,
        confidenceThreshold: 0.6,
      });
      algorithmRegistry.register("SpacyXClassifier", spacyX);
      console.log("✅ SpaCy X Classifier enregistré");
    } else {
      console.log("⚠️ SpaCy X Classifier ignoré (pas de SPACY_API_URL)");
    }

    // OpenAI classifieurs avec configuration optimisée
    algorithmRegistry.register(
      "OpenAIXClassifier",
      new OpenAIXClassifier({
        apiKey: openAIKey, // peut être vide → fallback côté run()
        model: "gpt-4o-mini",
        temperature: 0,
        maxTokens: 6,
        timeout: 10000,
      })
    );
    algorithmRegistry.register(
      "OpenAI3TXClassifier",
      new OpenAI3TXClassifier({
        apiKey: openAIKey,
        model: "gpt-4o-mini",
        temperature: 0,
        maxTokens: 6,
        timeout: 10000,
        strictPromptMode: true,
      })
    );

    console.log("🔎 OpenAI setup:", {
      hasKey: !!openAIKey,
      nodeEnv: process.env.NODE_ENV,
    });
    console.log("✅ OpenAI X Classifiers enregistrés");
    // ===== Y (classifieurs client) =====
    algorithmRegistry.register("RegexYClassifier", new RegexYClassifier());

    // ===== M1 (compteurs / métriques) =====
    algorithmRegistry.register(
      "M1ActionVerbCounter",
      new M1ActionVerbCounter()
    );

    // ===== M2 (calculateurs d'alignement) =====
    algorithmRegistry.register(
      "M2LexicalAlignment",
      new M2LexicalAlignmentCalculator({
        thresholdAligned: 0.5,
        thresholdPartial: 0.3,
      })
    );

    algorithmRegistry.register(
      "M2SemanticAlignment",
      new M2SemanticAlignmentCalculator({
        confidenceThreshold: 0.6,
        strictMode: false,
      })
    );

    algorithmRegistry.register(
      "M2CompositeAlignment",
      new M2CompositeAlignmentCalculator({
        lexicalWeight: 0.4,
        semanticWeight: 0.6,
        threshold: 0.5,
        partialThreshold: 0.3,
      })
    );

    // ===== M3 (calculateurs de charge cognitive) =====
    algorithmRegistry.register("PausesM3Calculator", new PausesM3Calculator());

    initialized = true;

    // Log du statut final
    logAlgorithmStatus();
    const count = algorithmRegistry.list().length;
    console.log(`✅ ${count} algorithmes harmonisés initialisés`);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des algorithmes:", error);
    throw error; // Fail fast
  }
}

// ---- Statut console (debug) -------------------------------------------------
function logAlgorithmStatus(): void {
  const entries = algorithmRegistry.list();
  let validCount = 0;
  let totalCount = entries.length;

  console.log("\n📊 Status des algorithmes:");

  for (const { key, meta } of entries) {
    const algo = algorithmRegistry.get(key) as any;
    if (!algo) continue;

    // Gestion sécurisée des méthodes optionnelles
    const isValid = algo.validateConfig?.() ?? true;
    const statusIcon = isValid ? "✅" : "⚠️";

    if (isValid) validCount++;

    console.log(`${statusIcon} ${meta.displayName || meta.name || key}`);
    console.log(
      `   Type: ${meta.type} | Target: ${meta.target} | Batch: ${
        meta.batchSupported ? "Oui" : "Non"
      }`
    );

    if (!isValid) {
      console.log(`   ⚠️  Configuration manquante ou invalide`);
    }
  }

  console.log(
    `\n📈 Résumé: ${validCount}/${totalCount} algorithmes configurés\n`
  );
}

// Auto-init côté serveur uniquement
if (typeof window === "undefined") {
  initializeAlgorithms();
}

/**
 * Renvoie l'état des algorithmes pour l'API GET /api/algolab/classifiers
 */
export function getAlgorithmStatus(): Record<string, any> {
  if (!initialized) {
    initializeAlgorithms();
  }

  const entries = algorithmRegistry.list();

  return {
    initialized: true,
    totalCount: entries.length,
    availableCount: entries.filter(({ key }) => {
      const algo = algorithmRegistry.get(key) as any;
      return algo?.validateConfig?.() ?? true; // tolérant si non défini
    }).length,
    algorithms: entries.map(({ key, meta }) => {
      const algo = algorithmRegistry.get(key) as any;
      const isValid = algo?.validateConfig?.() ?? true;

      return {
        key,
        displayName: meta.displayName ?? meta.name ?? key,
        type: meta.type,
        target: meta.target,
        version: meta.version ?? "1.0.0",
        supportsBatch: meta.batchSupported ?? false,
        requiresContext: meta.requiresContext ?? false,
        isValid,
        isAvailable: isValid,
        description: meta.description,
      };
    }),
    environment: {
      hasOpenAI: !!(
        process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
      ),
      spacyApiUrl: process.env.SPACY_API_URL || "non configuré",
      nodeEnv: process.env.NODE_ENV,
    },
    recommendations: getRecommendations(),
  };
}

// ---- Recommendations environnement ------------------------------------------
function getRecommendations(): string[] {
  const rec: string[] = [];

  if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    rec.push(
      "Configurez OPENAI_API_KEY pour activer les classificateurs OpenAI"
    );
  }

  if (!process.env.SPACY_API_URL && process.env.NODE_ENV !== "development") {
    rec.push("Configurez SPACY_API_URL pour activer SpaCy en production");
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_OPENAI_API_KEY
  ) {
    rec.push(
      "⚠️  En production, utilisez OPENAI_API_KEY (server-side) plutôt que NEXT_PUBLIC_OPENAI_API_KEY"
    );
  }

  return rec;
}

// ---- Helpers de test et debug -----------------------------------------------
export async function testAllAlgorithms(
  sampleVerbatim: string = "je vais vérifier votre dossier"
): Promise<Record<string, any>> {
  if (!initialized) {
    initializeAlgorithms();
  }

  const results: Record<string, any> = {};
  const entries = algorithmRegistry.list();

  for (const { key, meta } of entries) {
    const algo = algorithmRegistry.get(key) as any;
    if (!algo) continue;

    try {
      const isValid = algo.validateConfig?.() ?? true;

      if (!isValid) {
        results[key] = {
          success: false,
          error: "Configuration invalide",
          configured: false,
        };
        continue;
      }

      const start = Date.now();
      const result = await algo.run?.(sampleVerbatim);
      const duration = Date.now() - start;

      if (!result) {
        results[key] = {
          success: false,
          error: "Aucun résultat retourné",
          configured: true,
          target: meta.target,
        };
        continue;
      }

      const universalResult = result as any;

      results[key] = {
        success: true,
        result,
        duration,
        configured: true,
        target: meta.target,
        prediction: universalResult.prediction,
        confidence: universalResult.confidence,
      };
    } catch (e: any) {
      results[key] = {
        success: false,
        error: e?.message ?? String(e),
        configured: true,
        target: meta.target,
      };
    }
  }

  return results;
}

export async function benchmarkAlgorithms(
  verbatims: string[] = [
    "je vais vérifier votre dossier",
    "vous allez recevoir un email",
    "je comprends votre situation",
    "d'accord c'est noté",
    "notre politique stipule que",
  ]
): Promise<Record<string, any>> {
  if (!initialized) {
    initializeAlgorithms();
  }

  const results: Record<string, any> = {};
  const entries = algorithmRegistry.list();

  for (const { key, meta } of entries) {
    const algo = algorithmRegistry.get(key) as any;
    if (!algo?.validateConfig?.()) continue;

    const start = Date.now();
    const classifications: any[] = [];

    try {
      for (const verbatim of verbatims) {
        const result = await algo.run?.(verbatim);
        if (result) {
          classifications.push(result);
        }
      }

      if (classifications.length === 0) {
        results[key] = {
          success: false,
          error: "Aucune classification retournée",
          target: meta.target,
        };
        continue;
      }

      const total = Date.now() - start;
      const avgTime = total / verbatims.length;
      const avgConf =
        classifications.reduce((sum, r) => sum + (r?.confidence ?? 0), 0) /
        Math.max(1, classifications.length);

      results[key] = {
        success: true,
        target: meta.target,
        totalTime: total,
        avgTime,
        avgConfidence: avgConf,
        classifications,
        throughput: (verbatims.length / total) * 1000, // ops/sec
      };
    } catch (e: any) {
      results[key] = {
        success: false,
        error: e?.message ?? String(e),
        target: meta.target,
      };
    }
  }

  return results;
}
