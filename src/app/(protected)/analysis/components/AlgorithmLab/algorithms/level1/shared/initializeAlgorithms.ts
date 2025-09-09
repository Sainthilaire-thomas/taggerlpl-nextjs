// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms.ts

import { algorithmRegistry } from "./AlgorithmRegistry";

// --- Adapters universels (legacy -> UniversalAlgorithm)
import {
  wrapXAlgorithm,
  wrapYAlgorithm,
  wrapM1Algorithm,
} from "./legacyAdapters";

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

// -----------------------------------------------------------------------------
// Helpers top-level
// -----------------------------------------------------------------------------

// utilitaire: vérifie la présence d’une méthode optionnelle
const has = <T extends object>(obj: T | undefined, method: keyof T) =>
  !!obj && typeof (obj as any)[method] === "function";

// Flag d'initialisation (évite de se baser sur la longueur du registre)
let initialized = false;

/**
 * Initialise et enregistre tous les algorithmes disponibles.
 * - Ne s’exécute qu’une seule fois côté serveur.
 * - N’enregistre **rien** en dehors de cette fonction (évite les demi-init).
 */
export function initializeAlgorithms(): void {
  if (initialized) return;
  initialized = true;

  try {
    // ===== X (classifieurs conseiller) =====
    algorithmRegistry.register(
      "RegexXClassifier",
      wrapXAlgorithm(new RegexXClassifier())
    );

    const spacyX = new SpacyXClassifier({
      apiUrl: process.env.SPACY_API_URL || "http://localhost:8000/classify",
      model: "fr_core_news_md",
      timeout: 5000,
      confidenceThreshold: 0.6,
    });
    algorithmRegistry.register("SpacyXClassifier", wrapXAlgorithm(spacyX));

    algorithmRegistry.register(
      "OpenAIXClassifier",
      wrapXAlgorithm(
        new OpenAIXClassifier({
          model: "gpt-4o-mini",
          temperature: 0,
          maxTokens: 6,
          timeout: 10000,
          enableFallback: true,
        })
      )
    );

    algorithmRegistry.register(
      "OpenAI3TXClassifier",
      wrapXAlgorithm(
        new OpenAI3TXClassifier({
          model: "gpt-4o-mini",
          temperature: 0,
          maxTokens: 6,
          timeout: 10000,
          enableFallback: true,
          strictPromptMode: true,
        })
      )
    );

    // ===== Y (classifieurs client) =====
    algorithmRegistry.register(
      "RegexYClassifier",
      wrapYAlgorithm(new RegexYClassifier())
    );

    // ===== M1 (compteurs / métriques) =====
    algorithmRegistry.register(
      "M1ActionVerbCounter",
      wrapM1Algorithm(new M1ActionVerbCounter())
    );

    // ===== M2 (calculateurs d’alignement) =====
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

    // Log (optionnel)
    logAlgorithmStatus();
    console.log("✅ Algorithmes initialisés avec adaptateurs universels");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des algorithmes:", error);
  }
}

// ---- Statut console (debug) -------------------------------------------------
function logAlgorithmStatus(): void {
  const entries = algorithmRegistry.list();

  for (const { key, meta } of entries) {
    const algo = algorithmRegistry.get<any, any>(key) as any;
    const isValid = has(algo, "validateConfig")
      ? !!algo.validateConfig()
      : true;
    const _statusIcon = isValid ? "✅" : "⚠️";

    // Exemple de log si besoin:
    // console.log(`${_statusIcon} ${meta.displayName ?? meta.name ?? key}`);
    // console.log(`   Type: ${meta.type} | Target: ${meta.target} | Version: ${meta.version ?? "1.0.0"}`);
    // console.log(`   Batch: ${meta.batchSupported ? "Oui" : "Non"} | Configuré: ${isValid ? "Oui" : "Non"}`);
  }
}

// Auto-init côté **serveur** uniquement
if (typeof window === "undefined") {
  initializeAlgorithms();
}

/**
 * Renvoie l’état des algorithmes pour l’API GET /api/algolab/classifiers
 */
export function getAlgorithmStatus(): Record<string, any> {
  initializeAlgorithms(); // garantit que le registre est peuplé

  const entries = algorithmRegistry.list();

  return {
    totalCount: entries.length,
    availableCount: entries.filter(({ key }) => {
      const algo = algorithmRegistry.get<any, any>(key) as any;
      return has(algo, "validateConfig") ? !!algo.validateConfig() : true;
    }).length,
    algorithms: entries.map(({ key, meta }) => {
      const algo = algorithmRegistry.get<any, any>(key) as any;
      const isValid = has(algo, "validateConfig")
        ? !!algo.validateConfig()
        : true;
      return {
        key,
        displayName: meta.displayName ?? meta.name ?? key,
        type: meta.type,
        target: meta.target,
        version: meta.version,
        supportsBatch: meta.batchSupported,
        isValid,
        isAvailable: isValid,
        description: meta.description,
      };
    }),
    environment: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      spacyApiUrl: process.env.SPACY_API_URL || "localhost:8000 (default)",
      nodeEnv: process.env.NODE_ENV,
    },
    recommendations: getRecommendations(),
  };
}

// ---- Recos environnement ----------------------------------------------------
function getRecommendations(): string[] {
  const rec: string[] = [];
  if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    rec.push("Configurez OPENAI_API_KEY pour activer les classificateurs GPT");
  }
  if (!process.env.SPACY_API_URL) {
    rec.push("Configurez SPACY_API_URL ou démarrez une API spaCy locale");
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

// ---- Helpers de debug -------------------------------------------------------
export async function testAllAlgorithms(
  sampleVerbatim: string = "je vais vérifier votre dossier"
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const { key } of algorithmRegistry.list()) {
    const algo = algorithmRegistry.get<any, any>(key) as any;
    if (!algo) continue;

    try {
      const isValid = has(algo, "validateConfig")
        ? !!algo.validateConfig()
        : true;
      if (!isValid) {
        results[key] = {
          success: false,
          error: "Configuration invalide",
          configured: false,
        };
        continue;
      }

      const start = Date.now();
      const result = await (has(algo, "run")
        ? algo.run(sampleVerbatim)
        : algo.classify?.(sampleVerbatim));
      const duration = Date.now() - start;

      results[key] = {
        success: true,
        result,
        duration,
        configured: true,
        prediction:
          (result as any)?.prediction ?? (result as any)?.classification,
        confidence: (result as any)?.confidence,
      };
    } catch (e: any) {
      results[key] = {
        success: false,
        error: e?.message ?? String(e),
        configured: true,
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
  const results: Record<string, any> = {};

  for (const { key } of algorithmRegistry.list()) {
    const algo = algorithmRegistry.get<any, any>(key) as any;
    const isValid = has(algo, "validateConfig")
      ? !!algo.validateConfig()
      : true;
    if (!isValid) continue;

    const start = Date.now();
    const classifications: any[] = [];

    try {
      for (const v of verbatims) {
        const r = await (has(algo, "run") ? algo.run(v) : algo.classify?.(v));
        classifications.push(r);
      }
      const total = Date.now() - start;
      const avgTime = total / verbatims.length;
      const avgConf =
        classifications.reduce((s, r) => s + ((r as any)?.confidence ?? 0), 0) /
        Math.max(1, classifications.length);

      results[key] = {
        success: true,
        totalTime: total,
        avgTime,
        avgConfidence: avgConf,
        classifications,
        throughput: (verbatims.length / total) * 1000,
      };
    } catch (e: any) {
      results[key] = { success: false, error: e?.message ?? String(e) };
    }
  }
  return results;
}
