// algorithms/level1/M3Algorithms/PausesM3Calculator.ts
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/types/algorithm-lab/algorithms/base";
import type {
  M3Input,
  M3Details,
} from "@/types/algorithm-lab";

type CognitiveInput = M3Input | string;

export class PausesM3Calculator implements UniversalAlgorithm {
  constructor() {}

  // ========================================================================
  // ✅ INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: "PausesM3Calculator",
      displayName: "M3 — Pauses et hésitations",
      version: "1.0.0",
      type: "metric",
      target: "M3",
      batchSupported: true,
      requiresContext: false,
      description:
        "Score de charge cognitive basé sur l'analyse des pauses, hésitations et marqueurs de disfluence dans le discours.",
      examples: [
        {
          input: "euh... je pense que... hum... c'est compliqué",
          output: { prediction: "0.45", confidence: 0.7 },
          note: "Plusieurs hésitations détectées → charge cognitive élevée",
        },
      ],
    };
  }

  validateConfig(): boolean {
    return true; // Pas de configuration complexe pour cet algorithme
  }

  async run(input: unknown): Promise<UniversalResult> {
    const normalizedInput = this.normalizeInput(input);
    const startTime = Date.now();

    try {
      // ✅ APPEL DE LA LOGIQUE EXISTANTE
      const result = await this.calculateCognitiveLoad(normalizedInput);

      return {
        prediction: result.cognitiveScore.toFixed(3),
        confidence: 0.7,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M3",
          inputType: "M3Input",
          executionPath: ["normalize", "analyze_markers", "calculate_load"],
          // ✅ STRUCTURE ATTENDUE PAR L'ADAPTATEUR
          details: {
            value: result.cognitiveScore,
            unit: "score",
            pauseCount: result.pauseCount,
            hesitationCount: result.hesitationCount,
            speechRate: result.speechRate,
            markers: result.markers,
          },
          // Contexte pour l'UI
          verbatim: normalizedInput.segment,
          // Métadonnées supplémentaires
          classifier: "PausesM3Calculator",
          extra: {
            cognitiveScore: result.cognitiveScore,
            analysis: {
              words: result.wordCount,
              hesitations: result.hesitationCount,
              pauses: result.pauseCount,
              hesitationRate: result.hesitationRate,
              pauseRate: result.pauseRate,
              lengthPenalty: result.lengthPenalty,
            },
            patterns: result.patterns,
          },
        },
      };
    } catch (e: any) {
      return {
        prediction: "0.000",
        confidence: 0,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M3",
          inputType: "M3Input",
          executionPath: ["error"],
          details: {
            value: 0,
            unit: "score",
            pauseCount: 0,
            hesitationCount: 0,
            markers: [],
          },
          error: String(e?.message ?? e),
        },
      };
    }
  }

  async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
    return Promise.all(inputs.map((input) => this.run(input)));
  }

  // ========================================================================
  // ✅ TOUTE LA LOGIQUE MÉTIER EXISTANTE (100% INCHANGÉE)
  // ========================================================================

  private normalizeInput(input: unknown): M3Input {
    if (typeof input === "string") {
      return { segment: input, language: "fr", withProsody: false };
    }

    const m3Input = input as M3Input;
    return {
      segment: m3Input.segment,
      language: m3Input.language ?? "fr",
      withProsody: m3Input.withProsody ?? false,
      options: m3Input.options,
    };
  }

  private async calculateCognitiveLoad(input: M3Input): Promise<{
    cognitiveScore: number;
    pauseCount: number;
    hesitationCount: number;
    wordCount: number;
    speechRate?: number;
    hesitationRate: number;
    pauseRate: number;
    lengthPenalty: number;
    markers: Array<{
      type: string;
      timestamp: number;
      confidence: number;
      value?: string | number;
    }>;
    patterns: {
      hesitations: string[];
      pauses: string[];
      explicitPauses: string[];
    };
  }> {
    const text = (input.segment ?? "").trim();

    // Expressions régulières pour la détection
    const WORD_RE = /[^\s]+/g;
    const HESIT_RE = /\b(euh+|heu+|hum+|mmm+|hem+|ben|bah|hein)\b/gi;
    const ELLIPSIS_RE = /(\.{3}|…)/g;
    const EXPL_PAUSE_RE = /\((pause|silence)\)/gi;

    // Comptages
    const words = text.match(WORD_RE) || [];
    const hesitations = text.match(HESIT_RE) || [];
    const ellipses = text.match(ELLIPSIS_RE) || [];
    const explicitPauses = text.match(EXPL_PAUSE_RE) || [];

    const wordCount = words.length;
    const hesitationCount = hesitations.length;
    const pauseCount = ellipses.length + explicitPauses.length;

    // Calculs de ratios
    const hesitationRate = wordCount > 0 ? hesitationCount / wordCount : 0;
    const pauseRate = Math.min(1, pauseCount / 5);
    const lengthPenalty = Math.min(1, Math.max(0, (text.length - 140) / 400));

    // Score composite de charge cognitive
    const cognitiveScore = Math.max(
      0,
      Math.min(1, 0.6 * hesitationRate + 0.3 * pauseRate + 0.1 * lengthPenalty)
    );

    // Construction des marqueurs pour le debug
    const markers: Array<{
      type: string;
      timestamp: number;
      confidence: number;
      value?: string | number;
    }> = [];

    // Ajouter les marqueurs d'hésitation
    hesitations.forEach((hesitation, index) => {
      markers.push({
        type: "hesitation",
        timestamp: index, // Position approximative
        confidence: 0.8,
        value: hesitation,
      });
    });

    // Ajouter les marqueurs de pause
    [...ellipses, ...explicitPauses].forEach((pause, index) => {
      markers.push({
        type: "pause",
        timestamp: hesitationCount + index,
        confidence: 0.9,
        value: pause,
      });
    });

    return {
      cognitiveScore,
      pauseCount,
      hesitationCount,
      wordCount,
      speechRate:
        wordCount > 0 ? wordCount / Math.max(1, text.length / 100) : undefined,
      hesitationRate,
      pauseRate,
      lengthPenalty,
      markers,
      patterns: {
        hesitations: hesitations,
        pauses: ellipses,
        explicitPauses: explicitPauses,
      },
    };
  }

  // ========================================================================
  // MÉTHODES UTILITAIRES (pour compatibilité si nécessaire)
  // ========================================================================

  getInfo() {
    const desc = this.describe();
    return {
      id: desc.name,
      displayName: desc.displayName,
      target: desc.target,
      version: desc.version,
      description: desc.description,
      supportsBatch: desc.batchSupported,
    };
  }

  // Wrapper pour l'ancienne interface calculate() si nécessaire
  async calculate(input: M3Input) {
    const result = await this.calculateCognitiveLoad(input);
    return {
      prediction: result.cognitiveScore.toFixed(3),
      confidence: 0.7,
      processingTime: 0, // sera recalculé dans run()
      details: {
        value: result.cognitiveScore,
        unit: "score",
        pauseCount: result.pauseCount,
        hesitationCount: result.hesitationCount,
        speechRate: result.speechRate,
        markers: result.markers,
      } as M3Details,
      metadata: {
        algorithmVersion: "1.0.0",
        inputSignature: "M3Input(segment,language,withProsody,options)",
        executionPath: ["PausesM3Calculator"],
        warnings:
          result.cognitiveScore > 0.7
            ? ["Charge cognitive élevée détectée"]
            : [],
        verbatim: input.segment,
        m3: {
          value: result.cognitiveScore,
          unit: "score",
          pauseCount: result.pauseCount,
          hesitationCount: result.hesitationCount,
        },
      },
    };
  }
}
