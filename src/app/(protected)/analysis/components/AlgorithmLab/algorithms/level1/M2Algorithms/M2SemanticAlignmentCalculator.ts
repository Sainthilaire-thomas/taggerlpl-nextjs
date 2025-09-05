// algorithms/level1/M2Algorithms/M2SemanticAlignmentCalculator.ts
import {
  BaseM2Calculator,
  ClassificationResultM2,
} from "./shared/BaseM2Calculator";
import { AlgorithmRegistry } from "../shared/AlgorithmRegistry";
import { M2Input } from "../../../types/Level1Types";
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

export class M2SemanticAlignmentCalculator extends BaseM2Calculator {
  static readonly ID = "M2SemanticAlignment";
  private config: SemanticConfig;

  static {
    AlgorithmRegistry.register(
      M2SemanticAlignmentCalculator.ID,
      M2SemanticAlignmentCalculator
    );
  }

  constructor(config?: Partial<SemanticConfig>) {
    super();
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

  getInfo() {
    return {
      id: M2SemanticAlignmentCalculator.ID,
      displayName: "M2 — Alignement sémantique (patterns FR)",
      target: "M2" as const,
      version: "1.0.0",
      description:
        "Détection de patterns d’alignement dans T+1 (et chaîne T0→T+1)",
      supportsBatch: true,
    };
  }

  validateConfig(): boolean {
    return (
      this.config.confidenceThreshold >= 0 &&
      this.config.confidenceThreshold <= 1
    );
  }

  private scorePatterns(input: M2Input): { score: number; hits: string[] } {
    const t0 = normalize(input.turnVerbatim || "");
    const t1 = normalize(input.nextTurnVerbatim || "");

    const hits: string[] = [];
    for (const key of this.config.patterns) {
      const re = PATTERN_BANK[key];
      if (!re) continue;
      const haystack = key === "action_response" ? `${t0} >>> ${t1}` : t1;
      if (re.test(haystack)) hits.push(key);
    }
    // Heuristique simple : (#hits / #patterns) comme score sémantique
    const score = hits.length / Math.max(1, this.config.patterns.length);
    return { score, hits };
  }

  async calculate(input: M2Input): Promise<ClassificationResultM2> {
    const start = performance.now();
    const { score, hits } = this.scorePatterns(input);

    // mapping heuristique
    const prediction =
      score >= 0.5
        ? "aligné"
        : score >= 0.25
        ? "partiellement_aligné"
        : "non_aligné";

    const duration = performance.now() - start;
    return {
      prediction,
      confidence: Math.min(1, Math.max(0, score + 0.1 * hits.length)),
      processingTime: duration,
      metadata: {
        semanticScore: score,
        patterns: hits,
        config: this.config,
      },
    };
  }

  async batchCalculate(inputs: M2Input[]): Promise<ClassificationResultM2[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}

export default M2SemanticAlignmentCalculator;
