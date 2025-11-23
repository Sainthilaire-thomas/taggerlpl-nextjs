// algorithms/level1/M2Algorithms/M2CompositeAlignmentCalculator.ts
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base";
import type {
  M2Input,
  M2Details,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";

import M2LexicalAlignmentCalculator from "./M2LexicalAlignmentCalculator";
import M2SemanticAlignmentCalculator from "./M2SemanticAlignmentCalculator";

interface FusionConfig {
  lexicalWeight: number; // ex: 0.4
  semanticWeight: number; // ex: 0.6
  threshold: number; // ex: 0.5
  partialThreshold: number; // ex: 0.3
}

export default class M2CompositeAlignmentCalculator
  implements UniversalAlgorithm
{
  private config: FusionConfig;
  private lexical = new M2LexicalAlignmentCalculator();
  private semantic = new M2SemanticAlignmentCalculator();

  constructor(config?: Partial<FusionConfig>) {
    this.config = {
      lexicalWeight: 0.4,
      semanticWeight: 0.6,
      threshold: 0.5,
      partialThreshold: 0.3,
      ...config,
    };
  }

  // ========================================================================
  // ✅ INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: "M2CompositeAlignment",
      displayName: "M2 — Alignement composite (Lexical + Sémantique)",
      version: "1.0.0",
      type: "hybrid",
      target: "M2",
      batchSupported: true,
      requiresContext: true,
      description:
        "Alignement composite combinant scores lexical (Jaccard) et sémantique (patterns FR) avec fusion pondérée configurable.",
      examples: [
        {
          input: { t0: "je vais traiter", t1: "d'accord pour le traitement" },
          output: { prediction: "ALIGNEMENT_FORT", confidence: 0.75 },
          note: "Lexical: 0.5 (reprise), Sémantique: 0.8 (acquiescement) → Composite: 0.68",
        },
      ],
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

  async run(input: unknown): Promise<UniversalResult> {
    const m2Input = input as M2Input;
    const startTime = Date.now();

    try {
      // ✅ APPEL DE LA LOGIQUE EXISTANTE
      const result = await this.calculateCompositeScore(m2Input);

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
        algorithmVersion: "1.0.0",
        metadata: {
          target: "M2",
          inputType: "M2Input",
          executionPath: ["lexical", "semantic", "fusion"],
          // ✅ STRUCTURE ATTENDUE PAR L'ADAPTATEUR
          details: {
            value: result.prediction,
            scale: "composite",
            lexicalAlignment: result.lexicalScore,
            semanticAlignment: result.semanticScore,
            overall: result.compositeScore,
            sharedTerms: result.sharedTerms,
          },
          // Contexte pour l'UI
          prev2_turn_verbatim: (m2Input as any)?.prev2_turn_verbatim,
          prev1_turn_verbatim: (m2Input as any)?.prev1_turn_verbatim,
          next_turn_verbatim: m2Input.t1,
          // Métadonnées supplémentaires
          classifier: "M2CompositeAlignment",
          extra: {
            compositeScore: result.compositeScore,
            lexicalScore: result.lexicalScore,
            semanticScore: result.semanticScore,
            weights: {
              lexical: this.config.lexicalWeight,
              semantic: this.config.semanticWeight,
            },
            thresholds: {
              threshold: this.config.threshold,
              partialThreshold: this.config.partialThreshold,
            },
            components: result.components,
          },
          warnings: result.warnings,
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
            scale: "composite",
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

  private async calculateCompositeScore(input: M2Input): Promise<{
    prediction: string;
    confidence: number;
    compositeScore: number;
    lexicalScore: number;
    semanticScore: number;
    sharedTerms: string[];
    components: {
      lexical: any;
      semantic: any;
    };
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Exécuter les deux calculateurs en parallèle
    const [lx, se] = await Promise.all([
      this.lexical.run(input),
      this.semantic.run(input),
    ]);

    // Extraire les scores des résultats UniversalResult
    const lexicalScore = Number(lx.confidence ?? 0);
    const semanticScore = Number(se.confidence ?? 0);

    // Essayer de récupérer des scores plus précis depuis les métadonnées
    const lexicalMetadataScore = (lx.metadata as any)?.extra?.lexicalScore;
    const semanticMetadataScore = (se.metadata as any)?.extra?.semanticScore;

    const finalLexicalScore = lexicalMetadataScore ?? lexicalScore;
    const finalSemanticScore = semanticMetadataScore ?? semanticScore;

    // Fusion pondérée
    const compositeScore = this.fuse(finalLexicalScore, finalSemanticScore);

    // Classification basée sur les seuils
    const prediction =
      compositeScore >= this.config.threshold
        ? "ALIGNEMENT_FORT"
        : compositeScore >= this.config.partialThreshold
        ? "ALIGNEMENT_FAIBLE"
        : "DESALIGNEMENT";

    // Récupérer les termes partagés du calculateur lexical
    const sharedTerms =
      (lx.metadata as any)?.extra?.sharedTokens ||
      (lx.metadata as any)?.details?.sharedTerms ||
      [];

    // Ajouter des avertissements si nécessaire
    if (finalLexicalScore === 0 && finalSemanticScore === 0) {
      warnings.push("Aucun alignement lexical ni sémantique détecté");
    }
    if (Math.abs(finalLexicalScore - finalSemanticScore) > 0.5) {
      warnings.push("Écart important entre alignements lexical et sémantique");
    }

    return {
      prediction,
      confidence: Math.min(1, Math.max(0, compositeScore)),
      compositeScore,
      lexicalScore: finalLexicalScore,
      semanticScore: finalSemanticScore,
      sharedTerms,
      components: {
        lexical: {
          score: finalLexicalScore,
          prediction: lx.prediction,
          metadata: lx.metadata,
        },
        semantic: {
          score: finalSemanticScore,
          prediction: se.prediction,
          metadata: se.metadata,
        },
      },
      warnings,
    };
  }

  private fuse(lexicalScore: number, semanticScore: number): number {
    const { lexicalWeight, semanticWeight } = this.config;
    return lexicalScore * lexicalWeight + semanticScore * semanticWeight;
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
    const result = await this.calculateCompositeScore(input);
    return {
      prediction: result.prediction,
      confidence: result.confidence,
      processingTime: 0, // sera recalculé dans run()
      details: {
        value: result.prediction,
        scale: "composite",
        lexicalAlignment: result.lexicalScore,
        semanticAlignment: result.semanticScore,
        overall: result.compositeScore,
        sharedTerms: result.sharedTerms,
      } as M2Details,
      metadata: {
        algorithmVersion: "1.0.0",
        inputSignature: `${input.t0?.slice(0, 10)}...${input.t1?.slice(0, 10)}`,
        executionPath: ["lexical", "semantic", "fusion"],
        warnings: result.warnings,
        extra: {
          compositeScore: result.compositeScore,
          lexicalScore: result.lexicalScore,
          semanticScore: result.semanticScore,
          weights: this.config,
        },
      },
    };
  }
}
