// algorithms/level1/XAlgorithms/RegexXClassifier.ts
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/types/algorithm-lab/algorithms/base";
import type { VariableX } from "@/types/algorithm-lab";
import type { CalculationResult } from "@/types/algorithm-lab";
import type { XDetails } from "@/types/algorithm-lab";

export class RegexXClassifier implements UniversalAlgorithm {
  private config: { retourRefletDetaille: boolean };
  private version = "1.0.0";

  constructor(config: Partial<{ retourRefletDetaille: boolean }> = {}) {
    this.config = {
      retourRefletDetaille: config.retourRefletDetaille ?? true,
    };
  }

  describe(): AlgorithmDescriptor {
    return {
      name: "RegexXClassifier",
      displayName: "Règles – X (conseiller)",
      version: this.version,
      type: "rule-based",
      target: "X",
      batchSupported: true,
      requiresContext: false,
      description:
        "Classification des stratégies conseiller par règles regex (charte v1.2, nettoyage [TC]/[AP], garde-fous REFLET_VOUS).",
    };
  }

  validateConfig(): boolean {
    return typeof this.config.retourRefletDetaille === "boolean";
  }

  // Interface universelle unique
  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input);
    const startTime = Date.now();

    try {
      const text = this.sanitize(verbatim);
      if (!text) {
        return {
          prediction: "EXPLICATION",
          confidence: 0,
          processingTime: Date.now() - startTime,
          algorithmVersion: this.version,
          metadata: {
            target: "X",
            inputType: "string",
            executionPath: ["sanitize", "empty_fallback"],
            pairId: (input as any)?.pairId,
            
            // ✅ STRUCTURE UNIFIÉE : Colonnes DB
            dbColumns: {
              x_predicted_tag: "EXPLICATION",
              x_confidence: 0,
              x_algorithm_key: "RegexXClassifier",
              x_algorithm_version: this.version,
              x_computed_at: new Date().toISOString(),
              computation_status: 'complete'
            },
            
            details: {
              family: "EXPLICATION",
              evidences: [],
            },
          },
        };
      }

      // Appel de la logique de classification interne
      const result = this.performClassification(text);
      console.debug("RegexXClassifier →", {
        family: this.familyFromX(result.prediction),
        evs: Object.keys(this.getMatchedPatterns(text)),
      });

      return {
        prediction: result.prediction,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
        algorithmVersion: this.version,
        metadata: {
          target: "X",
          inputType: "string",
          executionPath: ["sanitize", "regex_analysis", "classification"],
          pairId: (input as any)?.pairId,
          
          // ✅ STRUCTURE UNIFIÉE : Colonnes DB
          dbColumns: {
            x_predicted_tag: result.prediction,
            x_confidence: result.confidence,
            x_algorithm_key: "RegexXClassifier",
            x_algorithm_version: this.version,
            x_computed_at: new Date().toISOString(),
            computation_status: 'complete'
          },
          
          details: {
            family: this.familyFromX(result.prediction),
            evidences: Object.keys(this.getMatchedPatterns(text)),
          },
        },
      };
    } catch (e: any) {
      return {
        prediction: "EXPLICATION",
        confidence: 0,
        processingTime: Date.now() - startTime,
        algorithmVersion: this.version,
        metadata: {
          target: "X",
          inputType: "string",
          executionPath: ["error"],
          pairId: (input as any)?.pairId,
          
          // ✅ STRUCTURE UNIFIÉE : Colonnes DB
          dbColumns: {
            x_predicted_tag: "EXPLICATION",
            x_confidence: 0,
            x_algorithm_key: "RegexXClassifier",
            x_algorithm_version: this.version,
            x_computed_at: new Date().toISOString(),
            computation_status: 'error'
          },
          
          details: {
            family: "EXPLICATION",
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
  // LOGIQUE MÉTIER COMPLÈTE
  // ========================================================================

  private sanitize(verbatim: string): string {
    return (verbatim || "")
      .replace(/\[(?:TC|AP)\]/gi, " ")
      .replace(/\(\.\.\.\)/g, " ")
      .replace(/[']/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Patterns de classification
  private patterns: Record<
    | "ENGAGEMENT"
    | "OUVERTURE"
    | "REFLET_VOUS"
    | "REFLET_JE"
    | "REFLET_ACQ"
    | "EXPLICATION",
    RegExp[]
  > = {
    ENGAGEMENT: [
      /\bje\s+(vais|m[' ]?appr[eê]te|peux|dois)\s+\w+/i,
      /\bje\s+(fais|v[ée]rifie|transf[eè]re|transmets?|regarde|demande|relance|note|envoie|mets|corrige|ouvre|cl[oô]ture)\b/i,
      /\bje\s+m[' ]?(en\s+)?(occupe|charge)\b/i,
      /\bje\s+\w+rai\b/i,
      /\bje\s+suis\s+en\s+train\s+de\s+\w+/i,
      /\bon\s+va\s+\w+/i,
    ],
    OUVERTURE: [
      /\bvous\s+(allez|irez)\s+\w+/i,
      /\bvous\s+\w+rez\b/i,
      /\bvous\s+(pouvez|pourrez|devez|devrez)\b/i,
      /\b(pouvez|pourriez)[-\s]?vous\b/i,
      /\bveuillez\b\s+\w+/i,
      /\bmerci\s+de\b\s+\w+/i,
      /\bil\s+faudra\s+que\s+vous\b/i,
      /\bil\s+faut\s+(?:bien\s+)?(?:que\s+)?vous\b/i,
      /\bje\s+vous\s+invite\s+à\s+\w+/i,
      /\bpensez\s+à\s+\w+/i,
      /\bn['' ]oubliez\s+pas\s+de\s+\w+/i,
      /\bvous\s+(serez|allez\s+être)\s+\w+/i,
      /(?:^|[.!?]\s+)(pr[ée]cisez|indiquez|donnez|appelez|envoyez|compl[ée]tez|patientez|attendez|joignez|cliquez|pr[ée]sentez)\b/i,
    ],
    REFLET_VOUS: [
      /(?:^|[.!?]\s+|je\s+vois\s+que\s+|si\s+je\s+comprends\s+bien,\s+)vous\s+avez\s+\w+/i,
      /\bje\s+(?:vois|constate|note)\s+que\s+vous\s+\w+/i,
      /\bvous\s+dites\b/i,
      /\bd['']apr[eè]s\s+vous\b/i,
      /\bsi\s+je\s+comprends\s+bien,\s+vous\s+\w+/i,
      /\bvous\s+m['']avez\b/i,
    ],
    REFLET_JE: [
      /\bje\s+(comprends|entends|vois|note)\b/i,
      /\bj[' ]?entends\b/i,
    ],
    REFLET_ACQ: [
      /\b(d[' ]?accord|effectivement|tr[eè]s\s+bien|bien\s+s[uû]r|absolument|tout\s+à\s+fait|parfait|exactement)\b/i,
      /\bc[' ]?est\s+bien\s+ça\b/i,
      /^\s*(?:h+u?m+|m+hm+|mm+h+)(?:\s+(?:h+u?m+|m+hm+|mm+h+)){0,2}\s*[.!?…]*$/i,
      /^\s*(ou[iy]+|ouais|ok(?:ay)?)\s*[.!?…]*$/i,
    ],
    EXPLICATION: [
      /\b(parce\s+que|car|c[' ]?est[- ]à[- ]dire|en\s+fait|autrement\s+dit)\b/i,
      /\b(notre|la)\s+(politique|proc[ée]dure|r[èe]glementation|processus|syst[èe]me)\b/i,
      /\b(vo(?:ici|ilà)\s+pourquoi|en\s+raison\s+de|la\s+raison|le\s+motif)\b/i,
      /\bc[' ]?est\s+pour\s+(?:ça|cela)\s+que\b/i,
      /\bil\s+s[' ]?agit\s+de\b/i,
      /\bça\s+veut\s+dire\b/i,
      /\ben\s+cons[ée]quence\b/i,
      /\b(le|ce)\s+principe\b/i,
      /\bfonctionne(?:nt)?\b/i,
      /\bje\s+vous\s+explique\b/i,
      /\bvous\s+comprenez(?:\s+bien)?\b/i,
      /\bc[' ]?est\s+(normal|faux|impossible)\b/i,
      /\bon\s+n[' ]?annule\s+rien\b|\bnous\s+n[' ]?annulons\s+rien\b/i,
      /(?:parce\s+que|car|donc).*(?:du\s+coup|c[' ]?est\s+pour\s+ça)/i,
    ],
  };

  // Méthode principale de classification (renommée pour éviter les conflits)
  private performClassification(text: string): {
    prediction: VariableX;
    confidence: number;
  } {
    // 1) ENGAGEMENT
    const mEng = this.countMatches(text, this.patterns.ENGAGEMENT);
    if (mEng.score > 0) {
      return {
        prediction: "ENGAGEMENT",
        confidence: this.confidenceFrom(mEng, text, "ENGAGEMENT"),
      };
    }

    // 2) OUVERTURE
    const mOuv = this.countMatches(text, this.patterns.OUVERTURE);
    if (mOuv.score > 0) {
      return {
        prediction: "OUVERTURE",
        confidence: this.confidenceFrom(mOuv, text, "OUVERTURE"),
      };
    }

    // Marqueurs pour départager REFLET_VOUS vs explication/instruction
    const explainMarkers =
      /\b(parce\s+que|c[' ]?est\s+pour\s+ça|il\s+s[' ]?agit|proc[ée]dure|syst[èe]me|fonctionne|raison|vo(?:ici|ilà)\s+pourquoi|en\s+raison)\b/i.test(
        text
      );
    const hasNumbers =
      /(?:\d+[.,]?\d*){2,}/.test(text) ||
      /(?:\d+[.,]?\d*).*(?:€|euros?)/i.test(text);
    const instructionCue =
      /\bil\s+faut\b|pensez\s+à|n['' ]oubliez\s+pas|veuillez|merci\s+de|je\s+vous\s+invite\s+à|(?:^|[.!?]\s+)(?:pr[ée]cisez|indiquez|donnez|appelez|envoyez|compl[ée]tez|patientez|attendez|joignez|cliquez|pr[ée]sentez)\b/i.test(
        text
      );

    // 3a) REFLET_VOUS (avec garde-fous)
    const mRV = this.countMatches(text, this.patterns.REFLET_VOUS);
    if (mRV.score > 0 && !(instructionCue || explainMarkers || hasNumbers)) {
      return {
        prediction: "REFLET_VOUS",
        confidence: this.confidenceFrom(mRV, text, "REFLET_VOUS"),
      };
    }

    // 3b) REFLET_JE
    const mRJ = this.countMatches(text, this.patterns.REFLET_JE);
    if (mRJ.score > 0) {
      return {
        prediction: "REFLET_JE",
        confidence: this.confidenceFrom(mRJ, text, "REFLET_JE"),
      };
    }

    // 3c) REFLET_ACQ
    const mRA = this.countMatches(text, this.patterns.REFLET_ACQ);
    if (mRA.score > 0) {
      const isVeryShort = text.length <= 20;
      const looksLikeInstructionOrExplain =
        instructionCue ||
        /\b(parce\s+que|c[' ]?est\s+pour\s+ça|proc[ée]dure|fonctionne|syst[èe]me|raison|(?:^|\W)donc(?:\W|$))\b/i.test(
          text
        );
      if (isVeryShort || !looksLikeInstructionOrExplain) {
        return {
          prediction: "REFLET_ACQ",
          confidence: this.confidenceFrom(mRA, text, "REFLET_ACQ"),
        };
      }
    }

    // 4) EXPLICATION
    const mExp = this.countMatches(text, this.patterns.EXPLICATION);
    if (mExp.score > 0) {
      return {
        prediction: "EXPLICATION",
        confidence: this.confidenceFrom(mExp, text, "EXPLICATION"),
      };
    }

    return { prediction: "EXPLICATION", confidence: 0.3 };
  }

  // Helper pour déterminer la famille
  private familyFromX(label: VariableX): string {
    switch (label) {
      case "REFLET_VOUS":
      case "REFLET_JE":
      case "REFLET_ACQ":
        return "REFLET";
      case "ENGAGEMENT":
        return "ENGAGEMENT";
      case "OUVERTURE":
        return "OUVERTURE";
      case "EXPLICATION":
      default:
        return "EXPLICATION";
    }
  }

  // Introspection/Debug - retourne les patterns qui ont matché
  private getMatchedPatterns(text: string): Record<string, number> {
    const matched: Record<string, number> = {};
    (Object.keys(this.patterns) as (keyof typeof this.patterns)[]).forEach(
      (category) => {
        const m = this.countMatches(text, this.patterns[category]);
        if (m.score > 0) matched[category] = m.score;
      }
    );
    return matched;
  }

  // Utilitaires de scoring
  private countMatches(
    text: string,
    regs: RegExp[]
  ): { score: number; strongHits: number } {
    let matches = 0;
    let strongHits = 0;
    for (const r of regs) {
      const found = text.match(r);
      if (found) {
        matches += found.length;
        if (
          /(je\s+vais|vous\s+allez|veuillez|merci\s+de|il\s+faut|pouvez|pourriez|vous\s+serez|allez\s+être)/i.test(
            r.source
          )
        ) {
          strongHits += found.length;
        }
      }
    }
    return { score: matches, strongHits };
  }

  private confidenceFrom(
    res: { score: number; strongHits: number },
    text?: string,
    label?: VariableX
  ): number {
    const len = (text || "").length;
    const base = 0.6;
    let raw =
      base +
      0.12 * res.strongHits +
      0.04 * Math.max(0, res.score - res.strongHits);

    if (label === "REFLET_ACQ" && len <= 15) raw += 0.12;
    if (label === "REFLET_ACQ" && len > 40) raw -= 0.1;

    return Math.max(0.45, Math.min(0.98, raw));
  }
}
