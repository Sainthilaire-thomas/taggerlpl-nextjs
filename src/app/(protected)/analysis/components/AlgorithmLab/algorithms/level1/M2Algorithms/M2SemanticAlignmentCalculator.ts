// algorithms/level1/M2Algorithms/M2SemanticAlignmentCalculator.ts
import {
  BaseM2Calculator,
  ClassificationResultM2,
} from "./shared/BaseM2Calculator";
import { AlgorithmRegistry } from "../shared/AlgorithmRegistry";
import {
  M2Input,
  M2Details,
  CalculatorMetadata,
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

export class M2SemanticAlignmentCalculator extends BaseM2Calculator {
  static readonly ID = "M2SemanticAlignment";
  private config: SemanticConfig;

  static {
    // ✅ CORRECTION: Enregistrer une instance, pas la classe
    AlgorithmRegistry.register(
      M2SemanticAlignmentCalculator.ID,
      new M2SemanticAlignmentCalculator()
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

  // ✅ CORRECTION: Retourner CalculatorMetadata (pas AlgorithmMetadata)
  getMetadata(): CalculatorMetadata {
    return {
      id: M2SemanticAlignmentCalculator.ID,
      label: "M2 — Alignement sémantique (patterns FR)",
      target: "M2" as const,
      algorithmKind: "rule-based", // ✅ REQUIS
      version: "1.0.0",
      parameters: {},
      tags: ["semantic", "patterns", "french"],
    };
  }

  // ✅ CORRECTION: describe() doit retourner le format attendu par BaseM2Calculator
  describe(): {
    name: string;
    displayName?: string;
    type: "rule-based";
    target: "M2";
    version?: string;
    batchSupported?: boolean;
    description?: string;
  } {
    return {
      name: M2SemanticAlignmentCalculator.ID, // ✅ REQUIS
      displayName: "M2 — Alignement sémantique (patterns FR)",
      type: "rule-based", // ✅ CORRECTION: Utiliser un AlgorithmType valide
      target: "M2", // ✅ REQUIS
      version: "1.0.0",
      batchSupported: true,
      description:
        "Détection de patterns d'alignement dans T+1 (et chaîne T0→T+1)",
    };
  }

  // ✅ CORRECTION: Ajout de la méthode run() pour l'interface BaseAlgorithm
  async run(input: M2Input): Promise<ClassificationResultM2> {
    return this.calculate(input);
  }

  getInfo() {
    return {
      id: M2SemanticAlignmentCalculator.ID,
      displayName: "M2 — Alignement sémantique (patterns FR)",
      target: "M2" as const,
      version: "1.0.0",
      description:
        "Détection de patterns d'alignement dans T+1 (et chaîne T0→T+1)",
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
    // ✅ CORRECTION: Utiliser t0 et t1 au lieu de turnVerbatim/nextTurnVerbatim
    const t0 = normalize(input.t0 || "");
    const t1 = normalize(input.t1 || "");

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

    // ✅ CORRECTION: Ajouter la propriété 'details' requise
    const details: M2Details = {
      lexicalAlignment: score * 0.8, // Approximation
      semanticAlignment: score,
      overall: score,
      sharedTerms: hits,
    };

    return {
      prediction,
      confidence: Math.min(1, Math.max(0, score + 0.1 * hits.length)),
      processingTime: duration,
      details, // ✅ REQUIS
      metadata: {
        algorithmVersion: "1.0.0",
        inputSignature: `${input.t0?.slice(0, 10)}...${input.t1?.slice(0, 10)}`,
        executionPath: ["scorePatterns", "classification"],
        warnings: hits.length === 0 ? ["Aucun pattern détecté"] : undefined,
        // Propriétés spécifiques dans extra
        extra: {
          semanticScore: score,
          patterns: hits,
          config: this.config,
        },
      },
    };
  }

  async batchCalculate(inputs: M2Input[]): Promise<ClassificationResultM2[]> {
    return Promise.all(inputs.map((i) => this.calculate(i)));
  }
}

export default M2SemanticAlignmentCalculator;
