// algorithms/level1/M2Algorithms/M2LexicalAlignmentCalculator.ts
import {
  BaseM2Calculator,
  ClassificationResultM2,
} from "./shared/BaseM2Calculator";
import { AlgorithmRegistry } from "../shared/AlgorithmRegistry"; // ajuste le chemin si besoin
import { M2Input } from "../../../types/Level1Types";
import { tokenize, jaccard, shared } from "./shared/m2-utils";

interface LexicalConfig {
  thresholdAligned: number; // ex: 0.5
  thresholdPartial: number; // ex: 0.3
}

export class M2LexicalAlignmentCalculator extends BaseM2Calculator {
  static readonly ID = "M2LexicalAlignment";
  private config: LexicalConfig;

  static {
    // Auto-enregistrement (ADR-002)
    AlgorithmRegistry.register(
      M2LexicalAlignmentCalculator.ID,
      M2LexicalAlignmentCalculator
    );
  }

  constructor(config?: Partial<LexicalConfig>) {
    super();
    this.config = {
      thresholdAligned: 0.5,
      thresholdPartial: 0.3,
      ...config,
    };
  }

  getInfo() {
    return {
      id: M2LexicalAlignmentCalculator.ID,
      displayName: "M2 — Alignement lexical (Jaccard)",
      target: "M2" as const,
      version: "1.0.0",
      description:
        "Score Jaccard entre T0 et T+1 (tokens FR, stopwords filtrés)",
      supportsBatch: true,
    };
  }

  validateConfig(): boolean {
    const { thresholdAligned, thresholdPartial } = this.config;
    return (
      thresholdAligned > 0 &&
      thresholdPartial >= 0 &&
      thresholdAligned > thresholdPartial &&
      thresholdAligned <= 1
    );
  }

  async calculate(input: M2Input): Promise<ClassificationResultM2> {
    const start = performance.now();
    const a = new Set(tokenize(input.turnVerbatim || ""));
    const b = new Set(tokenize(input.nextTurnVerbatim || ""));
    const s = jaccard(a, b);

    const prediction =
      s >= this.config.thresholdAligned
        ? "aligné"
        : s >= this.config.thresholdPartial
        ? "partiellement_aligné"
        : "non_aligné";

    const duration = performance.now() - start;
    return {
      prediction,
      confidence: s, // confiance ~ score lexical
      processingTime: duration,
      metadata: {
        lexicalScore: s,
        sharedTokens: shared(a, b),
        thresholds: this.config,
      },
    };
  }

  async batchCalculate(inputs: M2Input[]): Promise<ClassificationResultM2[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}

export default M2LexicalAlignmentCalculator;
