// algorithms/level1/M2Algorithms/M2LexicalAlignmentCalculator.ts
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/types/algorithm-lab/algorithms/base";
import type {
  M2Input,
  M2Details,
} from "@/types/algorithm-lab";
import { tokenize, jaccard, shared } from "./shared/m2-utils";

interface LexicalConfig {
  thresholdAligned: number; // ex: 0.5
  thresholdPartial: number; // ex: 0.3
}

export class M2LexicalAlignmentCalculator implements UniversalAlgorithm {
  private config: LexicalConfig;

  constructor(config?: Partial<LexicalConfig>) {
    this.config = {
      thresholdAligned: 0.5,
      thresholdPartial: 0.3,
      ...config,
    };
  }

  // ========================================================================
  // ✅ INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: "M2LexicalAlignment",
      displayName: "M2 — Alignement lexical (Jaccard)",
      version: "1.0.0",
      type: "rule-based",
      target: "M2",
      batchSupported: true,
      requiresContext: true,
      description:
        "Score Jaccard entre T0 et T+1 (tokens FR, stopwords filtrés). Mesure l'alignement lexical entre conseiller et client.",
      examples: [
        {
          input: {
            t0: "je vais vérifier",
            t1: "d'accord pour la vérification",
          },
          output: { prediction: "ALIGNEMENT_FORT", confidence: 0.7 },
          note: "Reprise lexicale 'vérifier/vérification'",
        },
      ],
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

  async run(input: unknown): Promise<UniversalResult> {
    const m2Input = input as M2Input;
    const startTime = Date.now();

    try {
      // ✅ APPEL DE LA LOGIQUE EXISTANTE
      const result = await this.calculateM2Score(m2Input);

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M2",
          inputType: "M2Input",
          executionPath: ["tokenize", "jaccard", "classify"],
          // ✅ STRUCTURE ATTENDUE PAR L'ADAPTATEUR
          details: {
            value: result.prediction,
            scale: "lexical",
            lexicalAlignment: result.lexicalScore,
            semanticAlignment: undefined,
            overall: result.lexicalScore,
            sharedTerms: result.sharedTerms,
          },
          // Contexte pour l'UI
          prev2_turn_verbatim: (m2Input as any)?.prev2_turn_verbatim,
          prev1_turn_verbatim: (m2Input as any)?.prev1_turn_verbatim,
          next_turn_verbatim: m2Input.t1,
          // Métadonnées supplémentaires
          classifier: "M2LexicalAlignment",
          extra: {
            lexicalScore: result.lexicalScore,
            sharedTokens: result.sharedTerms,
            thresholds: this.config,
            tokenCounts: result.tokenCounts,
          },
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
            scale: "lexical",
            lexicalAlignment: 0,
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

  private async calculateM2Score(input: M2Input): Promise<{
    prediction: string;
    confidence: number;
    lexicalScore: number;
    sharedTerms: string[];
    tokenCounts: {
      t0: number;
      t1: number;
      shared: number;
    };
  }> {
    // Utiliser t0 et t1 des types centralisés
    const a = new Set(tokenize(input.t0 || ""));
    const b = new Set(tokenize(input.t1 || ""));
    const s = jaccard(a, b);
    const sharedTerms = shared(a, b);

    const prediction =
      s >= this.config.thresholdAligned
        ? "ALIGNEMENT_FORT"
        : s >= this.config.thresholdPartial
        ? "ALIGNEMENT_FAIBLE"
        : "DESALIGNEMENT";

    return {
      prediction,
      confidence: s, // confiance = score lexical
      lexicalScore: s,
      sharedTerms,
      tokenCounts: {
        t0: a.size,
        t1: b.size,
        shared: sharedTerms.length,
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
  async calculate(input: M2Input) {
    const result = await this.calculateM2Score(input);
    return {
      prediction: result.prediction,
      confidence: result.confidence,
      processingTime: 0, // sera recalculé dans run()
      details: {
        value: result.prediction,
        scale: "lexical",
        lexicalAlignment: result.lexicalScore,
        overall: result.lexicalScore,
        sharedTerms: result.sharedTerms,
      } as M2Details,
      metadata: {
        algorithmVersion: "1.0.0",
        inputSignature: `${input.t0?.slice(0, 10)}...${input.t1?.slice(0, 10)}`,
        executionPath: ["tokenize", "jaccard", "classify"],
        warnings:
          result.tokenCounts.t0 === 0 && result.tokenCounts.t1 === 0
            ? ["Entrées vides"]
            : [],
      },
    };
  }
}

export default M2LexicalAlignmentCalculator;
