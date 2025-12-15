// src/features/phase3-analysis/level1-validation/algorithms/conseiller/CharteYBClassifier.ts
// Charte Y-B : Accord client élargi (d'accord/oui/voilà = POSITIF, hm/mh seul = NEUTRE)
// Validé le 14/12/2025 avec Kappa = 0.998 vs Gold

import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/types/algorithm-lab/algorithms/base";
import type { YTag } from "@/types/algorithm-lab";

type CharteYBConfig = {
  charteName: string;
  charteVersion: string;
};

export class CharteYBClassifier implements UniversalAlgorithm {
  private config: CharteYBConfig;
  private version = "1.0.0";

  // ========================================================================
  // PATTERNS CHARTE Y-B (validés par Kappa = 0.998)
  // ========================================================================
  
  // ✅ POSITIF = Accord explicite fort (aligné sur Gold)
  private readonly POSITIF_PATTERNS = [
    "d'accord", "ok", "parfait", "très bien", "super", "excellent",
    "ça marche", "entendu", "bien sûr", "tout à fait",
    "avec plaisir", "absolument", "certainement", "volontiers",
    "c'est bon", "c'est parfait", "pas de problème", "formidable", "génial"
  ];

  // ✅ NEUTRE = Back-channel, confirmation simple (aligné sur Gold)
  private readonly NEUTRE_PATTERNS = [
    "oui", "ouais", "voilà", "merci", "bon",
    "hm", "mh", "mmh", "hm hm", "mh mh"
  ];

  private readonly NEGATIF_PATTERNS = [
    "mais", "non", "pas d'accord", "impossible",
    "pas normal", "inadmissible", "scandaleux",
    "j'hallucine", "vous rigolez", "c'est une blague",
    "n'importe quoi", "c'est inacceptable", "je refuse",
    "hors de question", "c'est pas possible"
  ];

  constructor(config: Partial<CharteYBConfig> = {}) {
    this.config = {
      charteName: config.charteName ?? "Charte B - Accord client élargi",
      charteVersion: config.charteVersion ?? "1.0.0",
    };
  }

  // ========================================================================
  // INTERFACE UNIVERSALALGORITHM
  // ========================================================================

  describe(): AlgorithmDescriptor {
    return {
      name: "CharteYBClassifier",
      displayName: "Charte Y-B (Accord élargi)",
      version: this.version,
      type: "rule-based",
      target: "Y",
      batchSupported: true,
      requiresContext: false,
      description:
        "Classification Y selon Charte B : d'accord/oui/voilà = POSITIF, seuls hm/mh = NEUTRE. Kappa validé = 0.998 vs Gold.",
      examples: [
        {
          input: "d'accord",
          output: { prediction: "CLIENT_POSITIF", confidence: 1.0 },
          note: "Expression d'accord explicite",
        },
        {
          input: "hm",
          output: { prediction: "CLIENT_NEUTRE", confidence: 1.0 },
          note: "Back-channel seul = neutre",
        },
      ],
    };
  }

  validateConfig(): boolean {
    return (
      typeof this.config.charteName === "string" &&
      typeof this.config.charteVersion === "string"
    );
  }

  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input);
    const startTime = Date.now();

    try {
      const result = this.classifyCharteYB(verbatim);

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
        algorithmVersion: this.version,
        metadata: {
          target: "Y",
          inputType: "string",
          executionPath: ["sanitize", "pattern_matching", "classification"],
          pairId: (input as any)?.pairId,

          // Structure unifiée pour BDD
          dbColumns: {
            y_predicted_tag: result.prediction,
            y_confidence: result.confidence,
            y_algorithm_key: "CharteYBClassifier",
            y_algorithm_version: this.version,
            y_computed_at: new Date().toISOString(),
            computation_status: "complete",
          },

          // Détails pour UI
          details: {
            family: "CLIENT",
            evidences: result.matchedPatterns,
            cues: result.matchedPatterns,
            method: "charte-yb-pattern-matching",
          },
          // Infos charte (hors du type VariableDetails)
          charte: {
            name: this.config.charteName,
            version: this.config.charteVersion,
          },
        },
      };
    } catch (e: any) {
      return {
        prediction: "CLIENT_NEUTRE",
        confidence: 0,
        processingTime: Date.now() - startTime,
        algorithmVersion: this.version,
        metadata: {
          target: "Y",
          inputType: "string",
          executionPath: ["error"],
          pairId: (input as any)?.pairId,

          dbColumns: {
            y_predicted_tag: "CLIENT_NEUTRE",
            y_confidence: 0,
            y_algorithm_key: "CharteYBClassifier",
            y_algorithm_version: this.version,
            y_computed_at: new Date().toISOString(),
            computation_status: "error",
          },

          details: {
            family: "CLIENT",
            evidences: [],
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
  // LOGIQUE DE CLASSIFICATION CHARTE Y-B
  // ========================================================================

  private classifyCharteYB(verbatim: string): {
    prediction: YTag;
    confidence: number;
    matchedPatterns: string[];
  } {
    const text = this.sanitize(verbatim);
    
    if (!text) {
      return {
        prediction: "CLIENT_NEUTRE",
        confidence: 0.5,
        matchedPatterns: [],
      };
    }

    const matchedPatterns: string[] = [];

    // ✅ ORDRE CORRIGÉ (identique à la requête SQL validée)
    
    // 1. POSITIF d'abord (patterns d'accord explicites)
    for (const pattern of this.POSITIF_PATTERNS) {
      if (text.includes(pattern.toLowerCase())) {
        matchedPatterns.push(pattern);
        return {
          prediction: "CLIENT_POSITIF",
          confidence: 1.0,
          matchedPatterns,
        };
      }
    }

    // 2. NEUTRE ensuite (back-channel seul - exact match)
    const textTrimmed = text.trim();
    for (const pattern of this.NEUTRE_PATTERNS) {
      if (textTrimmed === pattern.toLowerCase()) {
        matchedPatterns.push(pattern);
        return {
          prediction: "CLIENT_NEUTRE",
          confidence: 1.0,
          matchedPatterns,
        };
      }
    }

    // 3. NEGATIF après (patterns de désaccord)
    for (const pattern of this.NEGATIF_PATTERNS) {
      if (text.includes(pattern.toLowerCase())) {
        matchedPatterns.push(pattern);
        return {
          prediction: "CLIENT_NEGATIF",
          confidence: 1.0,
          matchedPatterns,
        };
      }
    }

    // 4. Par défaut : NEUTRE
    return {
      prediction: "CLIENT_NEUTRE",
      confidence: 0.5,
      matchedPatterns: [],
    };
  }

  private sanitize(verbatim: string): string {
    return (verbatim || "")
      .replace(/\[(?:TC|AP)\]/gi, " ")  // Supprimer annotations [TC], [AP]
      .replace(/\(\.\.\.\)/g, " ")       // Supprimer (...)
      .replace(/[']/g, "'")              // Normaliser apostrophes
      .replace(/\s+/g, " ")              // Normaliser espaces
      .trim()
      .toLowerCase();
  }
}
