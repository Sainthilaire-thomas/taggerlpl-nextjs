// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M2Algorithms/M2CompositeAlignmentCalculator.ts
import { BaseM2Calculator } from "./shared/BaseM2Calculator";
import type {
  M2Input,
  M2Details,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/Level1Types";

import M2LexicalAlignmentCalculator from "./M2LexicalAlignmentCalculator";
import M2SemanticAlignmentCalculator from "./M2SemanticAlignmentCalculator";

interface FusionConfig {
  lexicalWeight: number; // ex: 0.4
  semanticWeight: number; // ex: 0.6
  threshold: number; // ex: 0.5
  partialThreshold: number; // ex: 0.3
}

export default class M2CompositeAlignmentCalculator extends BaseM2Calculator {
  private config: FusionConfig;
  private lexical = new M2LexicalAlignmentCalculator();
  private semantic = new M2SemanticAlignmentCalculator();

  constructor(config?: Partial<FusionConfig>) {
    super();
    this.config = {
      lexicalWeight: 0.4,
      semanticWeight: 0.6,
      threshold: 0.5,
      partialThreshold: 0.3,
      ...config,
    };
  }

  getMetadata(): CalculatorMetadata {
    return {
      id: "M2CompositeAlignment",
      displayName: "M2 — Alignement composite (lexical + sémantique)",
      target: "M2",
      version: "1.0.0",
      description:
        "Fusion pondérée des scores lexical (Jaccard) et sémantique (patterns).",
      supportsBatch: true,
    };
  }

  validateConfig(): boolean {
    const { lexicalWeight, semanticWeight, threshold, partialThreshold } =
      this.config;
    return (
      lexicalWeight >= 0 &&
      semanticWeight >= 0 &&
      Math.abs(lexicalWeight + semanticWeight - 1) < 1e-6 &&
      threshold > partialThreshold &&
      threshold <= 1
    );
  }

  private fuse(lexicalScore: number, semanticScore: number): number {
    const { lexicalWeight, semanticWeight } = this.config;
    return lexicalScore * lexicalWeight + semanticScore * semanticWeight;
  }

  async calculate(input: M2Input): Promise<CalculationResult<M2Details>> {
    const t0 = performance.now();

    const [lx, se] = await Promise.all([
      this.lexical.calculate(input),
      this.semantic.calculate(input),
    ]);

    const lexicalScore = Number(
      lx.metadata?.["lexicalScore"] ?? lx.confidence ?? 0
    );
    const semanticScore = Number(
      se.metadata?.["semanticScore"] ?? se.confidence ?? 0
    );

    const final = this.fuse(lexicalScore, semanticScore);
    const alignmentType =
      final >= this.config.threshold
        ? "aligné"
        : final >= this.config.partialThreshold
        ? "partiellement_aligné"
        : "non_aligné";

    const processingTime = performance.now() - t0;

    const details: M2Details = {
      alignmentType,
      lexicalScore,
      semanticScore,
      sharedTokens: (lx.metadata?.["sharedTokens"] as string[]) ?? [],
      patterns: (se.metadata?.["patterns"] as string[]) ?? [],
      justification: "Fusion pondérée lexical/sémantique",
      confidence: Math.min(1, Math.max(0, final)),
      processingTime,
    };

    return {
      prediction: alignmentType,
      confidence: details.confidence,
      processingTime,
      metadata: {
        details,
        lexicalScore,
        semanticScore,
        finalScore: final,
        thresholds: this.config,
      },
    };
  }
}
