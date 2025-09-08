// src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M2Algorithms/M2CompositeAlignmentCalculator.ts
import { BaseM2Calculator } from "./shared/BaseM2Calculator";
import type {
  M2Input,
  M2Details,
  CalculationResult,
  CalculatorMetadata,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

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
      id: "m2-composite-alignment",
      label: "M2 Composite Alignment Calculator",
      target: "M2",
      algorithmKind: "hybrid",
      version: "1.0.0",
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

    // Extract scores from results using safe property access
    const lexicalScore = Number(lx.confidence ?? 0);
    const semanticScore = Number(se.confidence ?? 0);

    // Try to get additional scores from metadata if available
    const lexicalMetadataScore = (lx.metadata as any)?.lexicalScore;
    const semanticMetadataScore = (se.metadata as any)?.semanticScore;

    const finalLexicalScore = lexicalMetadataScore ?? lexicalScore;
    const finalSemanticScore = semanticMetadataScore ?? semanticScore;

    const final = this.fuse(finalLexicalScore, finalSemanticScore);

    const alignmentValue =
      final >= this.config.threshold
        ? "ALIGNEMENT_FORT"
        : final >= this.config.partialThreshold
        ? "ALIGNEMENT_FAIBLE"
        : "DESALIGNEMENT";

    const processingTime = performance.now() - t0;

    const details: M2Details = {
      value: alignmentValue,
      scale: "composite",
      lexicalAlignment: finalLexicalScore,
      semanticAlignment: finalSemanticScore,
      overall: final,
      sharedTerms: (lx.metadata as any)?.sharedTokens || [],
    };

    return {
      prediction: alignmentValue,
      confidence: Math.min(1, Math.max(0, final)),
      processingTime,
      details,
      metadata: {
        algorithmVersion: "1.0.0",
        inputSignature: `${input.t0?.substring(0, 20) || "unknown"}...`,
        executionPath: ["lexical", "semantic", "fusion"],
        warnings: [],
      },
    };
  }
}
