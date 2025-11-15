// algorithms/level1/M2Algorithms/M2SemanticAlignmentCalculator.ts
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base";
import type {
  M2Input,
  M2Details,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import { normalize } from "./shared/m2-utils";

interface SemanticConfig {
  patterns: string[]; // clés de patterns
  confidenceThreshold: number; // 0..1
  strictMode: boolean;
}

const PATTERN_BANK: Record<string, RegExp> = {
  acquiescement: /\b(daccord|oui|parfait|tres bien|super|merci)\b/iu,
  clarification: /\b(combien|quand|comment|pourquoi|preciser|clarifier)\b/iu,
  objection:
    /\b(mais|cependant|je ne suis pas daccord|pas possible|impossible)\b/iu,
  reformulation: /\b(vous dites|si je comprends|donc vous|autrement dit)\b/iu,
  action_response:
    /\b(je vais|nous allons|on va)\b.*\b(daccord|merci|tres bien|ok)\b/iu,
};

export class M2SemanticAlignmentCalculator implements UniversalAlgorithm {
  static readonly ID = "M2SemanticAlignment";
  private config: SemanticConfig;

  constructor(config?: Partial<SemanticConfig>) {
    this.config = {
      patterns: [
        "acquiescement",
        "reformulation",
        "clarification",
        "action_response",
        "objection",
      ],
      confidenceThreshold: 0.6,
      strictMode: false,
      ...config,
    };
  }

  // ========================================================================
  // ✅ INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: M2SemanticAlignmentCalculator.ID,
      displayName: "M2 — Alignement sémantique (patterns FR)",
      version: "1.0.0",
      type: "rule-based",
      target: "M2",
      batchSupported: true,
      requiresContext: true,
      description:
        "Détection de patterns d'alignement sémantique dans T+1 et chaîne T0→T+1. Analyse acquiescement, reformulation, clarification.",
      examples: [
        {
          input: {
            t0: "je vais traiter votre demande",
            t1: "d'accord merci beaucoup",
          },
          output: { prediction: "ALIGNEMENT_FORT", confidence: 0.8 },
          note: "Pattern 'acquiescement' détecté",
        },
      ],
    };
  }

  validateConfig(): boolean {
    return (
      this.config.confidenceThreshold >= 0 &&
      this.config.confidenceThreshold <= 1 &&
      Array.isArray(this.config.patterns) &&
      this.config.patterns.length > 0
    );
  }

  async run(input: unknown): Promise<UniversalResult> {
    const m2Input = input as M2Input;
    const startTime = Date.now();

    try {
      // ✅ APPEL DE LA LOGIQUE EXISTANTE
      const result = await this.calculateSemanticScore(m2Input);

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M2",
          inputType: "M2Input",
          executionPath: ["scorePatterns", "classification"],
          // ✅ STRUCTURE ATTENDUE PAR L'ADAPTATEUR
          details: {
            value: result.prediction,
            scale: "semantic",
            lexicalAlignment: result.semanticScore * 0.8, // Approximation
            semanticAlignment: result.semanticScore,
            overall: result.semanticScore,
            sharedTerms: result.patternsFound,
          },
          // Contexte pour l'UI
          prev2_turn_verbatim: (m2Input as any)?.prev2_turn_verbatim,
          prev1_turn_verbatim: (m2Input as any)?.prev1_turn_verbatim,
          next_turn_verbatim: m2Input.t1,
          // Métadonnées supplémentaires
          classifier: "M2SemanticAlignment",
          extra: {
            semanticScore: result.semanticScore,
            patternsFound: result.patternsFound,
            config: this.config,
            patternDetails: result.patternDetails,
          },
          warnings:
            result.patternsFound.length === 0 ? ["Aucun pattern détecté"] : [],
        },
      };
    } catch (e: any) {
      return {
        prediction: "DESALIGNEMENT",
        confidence: 0,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M2",
          inputType: "M2Input",
          executionPath: ["error"],
          details: {
            value: "DESALIGNEMENT",
            scale: "semantic",
            lexicalAlignment: 0,
            semanticAlignment: 0,
            overall: 0,
            sharedTerms: [],
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

  private async calculateSemanticScore(input: M2Input): Promise<{
    prediction: string;
    confidence: number;
    semanticScore: number;
    patternsFound: string[];
    patternDetails: Record<string, boolean>;
  }> {
    const { score, hits } = this.scorePatterns(input);

    // Mapping heuristique des scores vers classifications
    const PRED = {
      STRONG: "ALIGNEMENT_FORT",
      PARTIAL: "ALIGNEMENT_FAIBLE",
      NONE: "DESALIGNEMENT",
    } as const;

    const prediction =
      score >= 0.5 ? PRED.STRONG : score >= 0.25 ? PRED.PARTIAL : PRED.NONE;

    const confidence = Math.min(1, Math.max(0, score + 0.1 * hits.length));

    // Détails des patterns pour le debug
    const patternDetails: Record<string, boolean> = {};
    this.config.patterns.forEach((pattern) => {
      patternDetails[pattern] = hits.includes(pattern);
    });

    return {
      prediction,
      confidence,
      semanticScore: score,
      patternsFound: hits,
      patternDetails,
    };
  }

  private scorePatterns(input: M2Input): { score: number; hits: string[] } {
    const t0 = normalize(input.t0 || "");
    const t1 = normalize(input.t1 || "");

    const hits: string[] = [];
    for (const key of this.config.patterns) {
      const re = PATTERN_BANK[key];
      if (!re) continue;

      // Pour 'action_response', on analyse la chaîne complète T0→T+1
      const haystack = key === "action_response" ? `${t0} >>> ${t1}` : t1;

      if (re.test(haystack)) {
        hits.push(key);
      }
    }

    // Heuristique simple : (nombre de patterns détectés / nombre total de patterns)
    const score = hits.length / Math.max(1, this.config.patterns.length);
    return { score, hits };
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
  async calculate(input: M2Input) {
    const result = await this.calculateSemanticScore(input);
    return {
      prediction: result.prediction,
      confidence: result.confidence,
      processingTime: 0, // sera recalculé dans run()
      details: {
        value: result.prediction,
        scale: "semantic",
        lexicalAlignment: result.semanticScore * 0.8,
        semanticAlignment: result.semanticScore,
        overall: result.semanticScore,
        sharedTerms: result.patternsFound,
      } as M2Details,
      metadata: {
        algorithmVersion: "1.0.0",
        inputSignature: `${input.t0?.slice(0, 10)}...${input.t1?.slice(0, 10)}`,
        executionPath: ["scorePatterns", "classification"],
        warnings:
          result.patternsFound.length === 0 ? ["Aucun pattern détecté"] : [],
        extra: {
          semanticScore: result.semanticScore,
          patterns: result.patternsFound,
          config: this.config,
        },
      },
    };
  }
}

export default M2SemanticAlignmentCalculator;
