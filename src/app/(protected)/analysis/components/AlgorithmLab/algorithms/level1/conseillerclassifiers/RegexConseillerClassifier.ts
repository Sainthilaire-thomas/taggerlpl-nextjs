// algorithms/level1/conseillerclassifiers/RegexConseillerClassifier.ts
import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from "../shared/BaseClassifier";

export class RegexConseillerClassifier implements BaseClassifier {
  private config: { retourRefletDetaille: boolean };

  constructor(config: Partial<{ retourRefletDetaille: boolean }> = {}) {
    this.config = {
      retourRefletDetaille: config.retourRefletDetaille ?? true,
    };
  }

  // --------- Normalisation minimale (charte v1.2)
  private sanitize(verbatim: string): string {
    return (verbatim || "")
      .replace(/\[(?:TC|AP)\]/gi, " ") // étiquettes de transcription non fiables → on les efface
      .replace(/\(\.\.\.\)/g, " ") // retire les apartés "(...)"
      .replace(/[’]/g, "'") // apostrophe normalisée
      .replace(/\s+/g, " ") // espaces multiples
      .trim();
  }

  // --------- RÈGLES (regex) : hiérarchie de décision (charte v1.2)
  private patterns = {
    // 1) ENGAGEMENT — action du conseiller (priorité max)
    ENGAGEMENT: [
      /\bje\s+(vais|m[' ]?appr[eê]te|peux|dois)\s+\w+/i,
      /\bje\s+(fais|v[ée]rifie|transf[eè]re|transmets?|regarde|demande|relance|note|envoie|mets|corrige|ouvre|cl[oô]ture)\b/i,
      /\bje\s+m[' ]?(en\s+)?(occupe|charge)\b/i,
      /\bje\s+\w+rai\b/i,
      /\bje\s+suis\s+en\s+train\s+de\s+\w+/i,
      /\bon\s+va\s+\w+/i,
    ],

    // 2) OUVERTURE — action demandée au client (priorité élevée)
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
      /\bn['’ ]oubliez\s+pas\s+de\s+\w+/i,
      /\bvous\s+(serez|allez\s+être)\s+\w+/i,
      // impératifs fréquents ancrés au début d’énoncé
      /(?:^|[.!?]\s+)(pr[ée]cisez|indiquez|donnez|appelez|envoyez|compl[ée]tez|patientez|attendez|joignez|cliquez|pr[ée]sentez)\b/i,
    ],

    // 3) REFLET — sous-types hiérarchisés (vous > je > acquiescement)
    REFLET_VOUS: [
      // ancrages forts pour limiter les faux positifs dans les subordonnées
      /(?:^|[.!?]\s+|je\s+vois\s+que\s+|si\s+je\s+comprends\s+bien,\s+)vous\s+avez\s+\w+/i,
      /\bje\s+(?:vois|constate|note)\s+que\s+vous\s+\w+/i,
      /\bvous\s+dites\b/i,
      /\bd['’]apr[eè]s\s+vous\b/i,
      /\bsi\s+je\s+comprends\s+bien,\s+vous\s+\w+/i,
      /\bvous\s+m['’]avez\b/i,
    ],
    REFLET_JE: [
      /\bje\s+(comprends|entends|vois|note)\b/i,
      /\bj[' ]?entends\b/i,
    ],
    REFLET_ACQ: [
      /\b(d[' ]?accord|effectivement|tr[eè]s\s+bien|bien\s+s[uû]r|absolument|tout\s+à\s+fait|parfait|exactement)\b/i,
      /\bc[' ]?est\s+bien\s+ça\b/i,
      // phatiques très courts
      /^\s*(?:h+u?m+|m+hm+|mm+h+)(?:\s+(?:h+u?m+|m+hm+|mm+h+)){0,2}\s*[.!?…]*$/i,
      /^\s*(ou[iy]+|ouais|ok(?:ay)?)\s*[.!?…]*$/i,
    ],

    // 4) EXPLICATION — procédural/réglementaire (priorité minimale)
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
      // rectifications courantes
      /\bc[' ]?est\s+(normal|faux|impossible)\b/i,
      /\bon\s+n[' ]?annule\s+rien\b|\bnous\s+n[' ]?annulons\s+rien\b/i,
      // liaisons explicatives fréquentes
      /(?:parce\s+que|car|donc).*(?:du\s+coup|c[' ]?est\s+pour\s+ça)/i,
    ],
  };

  // --------- Implémentation interface BaseClassifier
  async classify(verbatim: string): Promise<ClassificationResult> {
    const startTime = Date.now();
    const legacy = this.classifyLegacy(verbatim);

    return {
      prediction: legacy.prediction,
      confidence: legacy.confidence,
      processingTime: Date.now() - startTime,
      metadata: {
        method: "rule-based-regex",
        retourRefletDetaille: this.config.retourRefletDetaille,
        patternsMatched: this.getMatchedPatterns(this.sanitize(verbatim)),
      },
    };
  }

  // --------- Logique hiérarchique alignée charte v1.2
  classifyLegacy(verbatim: string): { prediction: string; confidence: number } {
    const text = this.sanitize(verbatim);
    if (!text) return { prediction: "AUTRE", confidence: 0 };

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

    // marqueurs utiles pour le départage REFLET_VOUS vs EXPLICATION/OUVERTURE
    const explainMarkers =
      /\b(parce\s+que|c[' ]?est\s+pour\s+ça|il\s+s[' ]?agit|proc[ée]dure|syst[èe]me|fonctionne|raison|vo(?:ici|ilà)\s+pourquoi|en\s+raison)\b/i.test(
        text
      );
    const hasNumbers =
      /(?:\d+[.,]?\d*){2,}/.test(text) ||
      /(?:\d+[.,]?\d*).*(?:€|euros?)/i.test(text);
    const instructionCue =
      /\bil\s+faut\b|pensez\s+à|n['’ ]oubliez\s+pas|veuillez|merci\s+de|je\s+vous\s+invite\s+à|(?:^|[.!?]\s+)(?:pr[ée]cisez|indiquez|donnez|appelez|envoyez|compl[ée]tez|patientez|attendez|joignez|cliquez|pr[ée]sentez)\b/i.test(
        text
      );

    // 3a) REFLET_VOUS (garde-fous activés)
    const mRV = this.countMatches(text, this.patterns.REFLET_VOUS);
    if (mRV.score > 0 && !(instructionCue || explainMarkers || hasNumbers)) {
      const prediction = this.config.retourRefletDetaille
        ? "REFLET_VOUS"
        : "REFLET";
      return {
        prediction,
        confidence: this.confidenceFrom(mRV, text, "REFLET_VOUS"),
      };
    }

    // 3b) REFLET_JE
    const mRJ = this.countMatches(text, this.patterns.REFLET_JE);
    if (mRJ.score > 0) {
      const prediction = this.config.retourRefletDetaille
        ? "REFLET_JE"
        : "REFLET";
      return {
        prediction,
        confidence: this.confidenceFrom(mRJ, text, "REFLET_JE"),
      };
    }

    // 3c) REFLET_ACQ — micro-acquiescement "seul" + garde-fou
    const mRA = this.countMatches(text, this.patterns.REFLET_ACQ);
    if (mRA.score > 0) {
      const isVeryShort = text.length <= 20;
      // Si la phrase est longue ET contient des marqueurs d'instruction/explication → on NE classe pas REFLET_ACQ
      const looksLikeInstructionOrExplain =
        instructionCue ||
        /\b(parce\s+que|c[' ]?est\s+pour\s+ça|proc[ée]dure|fonctionne|syst[èe]me|raison|(?:^|\W)donc(?:\W|$))\b/i.test(
          text
        );
      if (isVeryShort || !looksLikeInstructionOrExplain) {
        const prediction = this.config.retourRefletDetaille
          ? "REFLET_ACQ"
          : "REFLET";
        return {
          prediction,
          confidence: this.confidenceFrom(mRA, text, "REFLET_ACQ"),
        };
      }
    }

    // 4) EXPLICATION — dernier recours (aucune action détectée)
    const mExp = this.countMatches(text, this.patterns.EXPLICATION);
    if (mExp.score > 0) {
      return {
        prediction: "EXPLICATION",
        confidence: this.confidenceFrom(mExp, text, "EXPLICATION"),
      };
    }

    // Rien détecté
    return { prediction: "AUTRE", confidence: 0 };
  }

  // --------- Métadonnées du classificateur
  getMetadata(): ClassifierMetadata {
    return {
      name: "Regex Conseiller Classifier",
      version: "1.4.0", // bump
      type: "rule-based",
      description:
        "Classification par règles regex des stratégies conversationnelles (charte v1.2, nettoyage [TC]/[AP], garde-fous REFLET_VOUS).",
      configSchema: {
        retourRefletDetaille: {
          type: "boolean",
          default: true,
          description:
            "Retourner les sous-types de REFLET (REFLET_VOUS, REFLET_JE, REFLET_ACQ)",
        },
      },
      requiresTraining: false,
      requiresAPIKey: false,
      supportsBatch: true,
      categories: [
        "ENGAGEMENT",
        "OUVERTURE",
        "REFLET_VOUS",
        "REFLET_JE",
        "REFLET_ACQ",
        "EXPLICATION",
        "AUTRE",
      ],
      targetDomain: "conseiller",
    };
  }

  validateConfig(): boolean {
    return typeof this.config.retourRefletDetaille === "boolean";
  }

  async batchClassify(verbatims: string[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];
    for (let i = 0; i < verbatims.length; i++) {
      const start = Date.now();
      const legacy = this.classifyLegacy(verbatims[i]);
      results.push({
        prediction: legacy.prediction,
        confidence: legacy.confidence,
        processingTime: Date.now() - start,
        metadata: {
          method: "rule-based-regex",
          batchIndex: i,
          retourRefletDetaille: this.config.retourRefletDetaille,
        },
      });
    }
    return results;
  }

  // --------- Introspection / debug
  private getMatchedPatterns(text: string): Record<string, number> {
    const matched: Record<string, number> = {};
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      const matches = this.countMatches(text, patterns);
      if (matches.score > 0) matched[category] = matches.score;
    });
    return matched;
  }

  addPattern(category: keyof typeof this.patterns, pattern: RegExp): void {
    if (this.patterns[category]) this.patterns[category].push(pattern);
  }

  getPatternStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      stats[category] = patterns.length;
    });
    return stats;
  }

  exportPatterns(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      out[category] = patterns.map((p) => p.source);
    });
    return out;
  }

  // --------- Utilitaires scoring
  private countMatches(text: string, regs: RegExp[]) {
    let matches = 0;
    let strongHits = 0;
    for (const r of regs) {
      const found = text.match(r);
      if (found) {
        matches += found.length;
        // Heuristique "forte" (ENGAGEMENT/OUVERTURE saillants)
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
    label?: string
  ) {
    const len = (text || "").length;
    const base = 0.6; // moins optimiste qu'avant
    let raw =
      base +
      0.12 * res.strongHits +
      0.04 * Math.max(0, res.score - res.strongHits);

    // Micro-acquiescements courts → confiance ↑
    if (label === "REFLET_ACQ" && len <= 15) raw += 0.12;
    // Longues phrases en REFLET_ACQ → prudence
    if (label === "REFLET_ACQ" && len > 40) raw -= 0.1;

    return Math.max(0.45, Math.min(0.98, raw));
  }

  // --------- Outils d'explication
  explainClassification(verbatim: string): {
    prediction: string;
    confidence: number;
    explanation: string;
    matchedPatterns: { category: string; patterns: string[] }[];
  } {
    const text = this.sanitize(verbatim);
    const result = this.classifyLegacy(text);
    const matchedPatterns: { category: string; patterns: string[] }[] = [];

    Object.entries(this.patterns).forEach(([category, patterns]) => {
      const matched = patterns.filter((pattern) => pattern.test(text));
      if (matched.length > 0) {
        matchedPatterns.push({
          category,
          patterns: matched.map((p) => p.source),
        });
      }
    });

    let explanation = `Classification: ${result.prediction} (confiance: ${(
      result.confidence * 100
    ).toFixed(1)}%)`;
    if (matchedPatterns.length > 0) {
      explanation += `\nPatterns détectés: ${matchedPatterns
        .map((mp) => `${mp.category} (${mp.patterns.length} règles)`)
        .join(", ")}`;
    } else {
      explanation += "\nAucun pattern détecté, classification par défaut.";
    }

    return {
      prediction: result.prediction,
      confidence: result.confidence,
      explanation,
      matchedPatterns,
    };
  }

  // --------- Suggestion rudimentaire (inchangée)
  suggestPatternImprovements(
    errorExamples: { verbatim: string; expected: string; predicted: string }[]
  ): {
    category: string;
    suggestedPatterns: string[];
    reasoning: string;
  }[] {
    const suggestions: {
      category: string;
      suggestedPatterns: string[];
      reasoning: string;
    }[] = [];

    const byExpected = errorExamples.reduce((acc, e) => {
      if (!acc[e.expected]) acc[e.expected] = [];
      acc[e.expected].push(e);
      return acc;
    }, {} as Record<string, typeof errorExamples>);

    Object.entries(byExpected).forEach(([expected, errors]) => {
      if (expected === "AUTRE") return;
      const verbatims = errors.map((e) =>
        this.sanitize(e.verbatim).toLowerCase()
      );
      const common = this.findCommonWords(verbatims);
      if (common.length > 0) {
        suggestions.push({
          category: expected,
          suggestedPatterns: common.map(
            (w) => `/\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b/i`
          ),
          reasoning: `Mots fréquents dans les erreurs ${expected}: ${common.join(
            ", "
          )}`,
        });
      }
    });

    return suggestions;
  }

  private findCommonWords(texts: string[]): string[] {
    const counts = new Map<string, number>();
    texts.forEach((t) => {
      const words = t.match(/\b\w+\b/g) || [];
      words.forEach((w) => {
        if (w.length > 3) counts.set(w, (counts.get(w) || 0) + 1);
      });
    });
    const threshold = Math.max(1, Math.floor(texts.length * 0.3));
    return Array.from(counts.entries())
      .filter(([_, c]) => c >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
  }
}
