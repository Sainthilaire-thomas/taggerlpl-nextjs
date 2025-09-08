// algorithms/level1/M2Algorithms/M2LexicalAlignmentCalculator.ts
import {
  BaseM2Calculator,
  ClassificationResultM2,
} from "./shared/BaseM2Calculator";
import {
  M2Input,
  M2Details,
  CalculationMetadata,
  BaseAlgorithm,
  AlgorithmMetadata,
  CalculationResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import { tokenize, jaccard, shared } from "./shared/m2-utils";

interface LexicalConfig {
  thresholdAligned: number; // ex: 0.5
  thresholdPartial: number; // ex: 0.3
}

export class M2LexicalAlignmentCalculator
  extends BaseM2Calculator
  implements BaseAlgorithm<M2Input, CalculationResult<M2Details>>
{
  // Propriété key requise par BaseAlgorithm
  key = "m2-lexical-alignment";

  // Métadonnées pour BaseAlgorithm
  meta: AlgorithmMetadata = {
    key: this.key,
    label: "M2 — Alignement lexical (Jaccard)",
    version: "1.0.0",
    target: "M2",
    tags: ["lexical", "jaccard", "tokens"],
    description: "Score Jaccard entre T0 et T+1 (tokens FR, stopwords filtrés)",
  };

  private config: LexicalConfig;

  constructor(config?: Partial<LexicalConfig>) {
    super();
    this.config = {
      thresholdAligned: 0.5,
      thresholdPartial: 0.3,
      ...config,
    };
  }

  // Métadonnées pour Calculator (Level 2 - validation scientifique)
  getMetadata(): CalculationMetadata {
    return {
      // Propriétés obligatoires
      algorithmVersion: "1.0.0",
      inputSignature: "m2-lexical-input",
      executionPath: ["tokenize", "jaccard"],
      warnings: [],

      // Propriétés existantes
      id: this.key,
      label: "M2 Alignement Lexical (Jaccard)",
      target: "M2",
      algorithmKind: "lexical",
      version: "1.0",
    };
  }

  // Méthode run() requise par BaseAlgorithm
  async run(input: M2Input): Promise<CalculationResult<M2Details>> {
    return this.calculate(input);
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

  async calculate(input: M2Input): Promise<CalculationResult<M2Details>> {
    const start = performance.now();

    // Utiliser t0 et t1 des types centralisés
    const a = new Set(tokenize(input.t0 || ""));
    const b = new Set(tokenize(input.t1 || ""));
    const s = jaccard(a, b);

    const prediction =
      s >= this.config.thresholdAligned
        ? "ALIGNEMENT_FORT"
        : s >= this.config.thresholdPartial
        ? "ALIGNEMENT_FAIBLE"
        : "DESALIGNEMENT";

    const duration = performance.now() - start;

    // Structure M2Details conforme aux types centralisés
    const details: M2Details = {
      value: prediction,
      scale: "lexical",
      lexicalAlignment: s,
      semanticAlignment: undefined, // Pas applicable pour lexical seul
      overall: s,
      sharedTerms: shared(a, b),
    };

    return {
      prediction,
      confidence: s, // confiance = score lexical
      processingTime: duration,
      details,
      metadata: {
        algorithmVersion: "1.0.0",
        inputSignature: `${input.t0?.slice(0, 10)}...${input.t1?.slice(0, 10)}`,
        executionPath: ["tokenize", "jaccard", "classify"],
        warnings: a.size === 0 && b.size === 0 ? ["Entrées vides"] : [],
        extra: {
          lexicalScore: s,
          sharedTokens: shared(a, b),
          thresholds: this.config,
          tokenCounts: {
            t0: a.size,
            t1: b.size,
            shared: shared(a, b).length,
          },
        },
      },
    };
  }

  async batchCalculate(
    inputs: M2Input[]
  ): Promise<CalculationResult<M2Details>[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }

  // Méthodes utilitaires pour compatibilité
  getInfo() {
    return {
      id: this.key,
      displayName: this.meta.label,
      target: "M2" as const,
      version: this.meta.version,
      description: this.meta.description,
      supportsBatch: true,
    };
  }
}

export default M2LexicalAlignmentCalculator;
