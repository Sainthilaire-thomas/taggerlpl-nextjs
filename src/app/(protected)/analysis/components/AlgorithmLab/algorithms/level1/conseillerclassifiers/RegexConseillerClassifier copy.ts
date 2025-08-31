// algorithms/level1/conseillerclassifiers/RegexConseillerClassifier.ts
import {
  BaseClassifier,
  ClassificationResult,
  ClassifierMetadata,
} from "../shared/BaseClassifier";

export class RegexConseillerClassifier implements BaseClassifier {
  private config: {
    retourRefletDetaille: boolean;
  };

  constructor(config: Partial<{ retourRefletDetaille: boolean }> = {}) {
    this.config = {
      retourRefletDetaille: config.retourRefletDetaille ?? true,
    };
  }

  // --- RÈGLES (regex) : hiérarchie de décision ---
  private patterns = {
    // 1) ENGAGEMENT — action du conseiller (priorité max)
    ENGAGEMENT: [
      // futur proche / modaux 1re pers.
      /\bje\s+(vais|m[' ]?apprête|peux|dois)\s+\w+/i,
      // présent d'action courant
      /\bje\s+(fais|vérifie|transfère|regarde|demande|relance|note|envoie|mets|corrige|ouvre|clôture)\b/i,
      // tournures figées
      /\bje\s+m[' ]?(en\s+)?(occupe|charge)\b/i,
      // futur simple
      /\bje\s+\w+rai\b/i,
      // institutionnel: "on va ..."
      /\bon\s+va\s+\w+/i,
    ],

    // 2) OUVERTURE — action demandée au client (priorité élevée)
    OUVERTURE: [
      // futur proche / futur simple 2e pers.
      /\bvous\s+(allez|irez)\s+\w+/i,
      /\bvous\s+\w+rez\b/i, // recevrez/validerez/etc.
      // modalité déontique / permission
      /\bvous\s+(pouvez|pourrez|devez|devrez|devez|deviendrez)\b/i,
      // impératif poli / injonctions douces
      /\bveuillez\b\s+\w+/i,
      /\bmerci\s+de\b\s+\w+/i,
      // formulations procédurales orientées client
      /\bil\s+faudra\s+que\s+vous\b/i,
    ],

    // 3) REFLET — sous-types hiérarchisés
    REFLET_VOUS: [
      /\bvous\s+avez\s+\w+/i,
      /\bje\s+vois\s+que\s+vous\s+\w+/i,
      /\bsi\s+je\s+comprends\s+bien,\s+vous\s+\w+/i,
    ],
    REFLET_JE: [/\bje\s+(comprends|entends|vois)\b/i, /\bj[' ]?entends\b/i],
    REFLET_ACQ: [
      /\b(d[' ]?accord|effectivement|très\s+bien|bien\s+sûr|absolument|tout\s+à\s+fait)\b/i,
      /\bc[' ]?est\s+bien\s+ça\b/i,
    ],

    // 4) EXPLICATION — justification/procédure sans action concrète
    EXPLICATION: [
      /\b(parce\s+que|car|c[' ]?est[- ]à[- ]dire|en\s+fait|autrement\s+dit)\b/i,
      /\b(notre|la)\s+(politique|procédure|réglementation|processus|système)\b/i,
      /\bvoici\s+pourquoi\b/i,
      /\bla\s+raison\b/i,
    ],
  };

  // NOUVEAU : Implémentation de l'interface BaseClassifier
  async classify(verbatim: string): Promise<ClassificationResult> {
    const startTime = Date.now();

    // Réutiliser la logique existante
    const legacyResult = this.classifyLegacy(verbatim);

    return {
      prediction: legacyResult.prediction,
      confidence: legacyResult.confidence,
      processingTime: Date.now() - startTime,
      metadata: {
        method: "rule-based-regex",
        retourRefletDetaille: this.config.retourRefletDetaille,
        patternsMatched: this.getMatchedPatterns(verbatim),
      },
    };
  }

  // PRÉSERVÉ : Ancienne méthode pour rétrocompatibilité
  classifyLegacy(verbatim: string): { prediction: string; confidence: number } {
    const text = (verbatim || "").trim();
    if (!text) return { prediction: "AUTRE", confidence: 0 };

    // 1) ENGAGEMENT
    const eng = this.countMatches(text, this.patterns.ENGAGEMENT);
    if (eng.score > 0) {
      return { prediction: "ENGAGEMENT", confidence: this.confidenceFrom(eng) };
    }

    // 2) OUVERTURE
    const ouv = this.countMatches(text, this.patterns.OUVERTURE);
    if (ouv.score > 0) {
      return { prediction: "OUVERTURE", confidence: this.confidenceFrom(ouv) };
    }

    // 3) REFLET (vous > je > acquiescement)
    const rVous = this.countMatches(text, this.patterns.REFLET_VOUS);
    if (rVous.score > 0) {
      const prediction = this.config.retourRefletDetaille
        ? "REFLET_VOUS"
        : "REFLET";
      return { prediction, confidence: this.confidenceFrom(rVous) };
    }

    const rJe = this.countMatches(text, this.patterns.REFLET_JE);
    if (rJe.score > 0) {
      const prediction = this.config.retourRefletDetaille
        ? "REFLET_JE"
        : "REFLET";
      return { prediction, confidence: this.confidenceFrom(rJe) };
    }

    const rAcq = this.countMatches(text, this.patterns.REFLET_ACQ);
    if (rAcq.score > 0) {
      const prediction = this.config.retourRefletDetaille
        ? "REFLET_ACQ"
        : "REFLET";
      return { prediction, confidence: this.confidenceFrom(rAcq) };
    }

    // 4) EXPLICATION (seulement si aucune action détectée)
    const exp = this.countMatches(text, this.patterns.EXPLICATION);
    if (exp.score > 0) {
      return {
        prediction: "EXPLICATION",
        confidence: this.confidenceFrom(exp),
      };
    }

    // Rien détecté
    return { prediction: "AUTRE", confidence: 0 };
  }

  // NOUVEAU : Métadonnées du classificateur
  getMetadata(): ClassifierMetadata {
    return {
      name: "Regex Conseiller Classifier",
      version: "1.2.0",
      type: "rule-based",
      description:
        "Classification par règles regex des stratégies conversationnelles des conseillers",
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
    };
  }

  // NOUVEAU : Validation de la configuration
  validateConfig(): boolean {
    return typeof this.config.retourRefletDetaille === "boolean";
  }

  // NOUVEAU : Classification par lots (optionnelle mais efficace)
  async batchClassify(verbatims: string[]): Promise<ClassificationResult[]> {
    const startTime = Date.now();
    const results: ClassificationResult[] = [];

    for (let i = 0; i < verbatims.length; i++) {
      const itemStartTime = Date.now();
      const legacyResult = this.classifyLegacy(verbatims[i]);

      results.push({
        prediction: legacyResult.prediction,
        confidence: legacyResult.confidence,
        processingTime: Date.now() - itemStartTime,
        metadata: {
          method: "rule-based-regex",
          batchIndex: i,
          retourRefletDetaille: this.config.retourRefletDetaille,
        },
      });
    }

    return results;
  }

  // NOUVEAU : Obtenir les patterns qui ont matché (pour debug/amélioration)
  private getMatchedPatterns(text: string): Record<string, number> {
    const matched: Record<string, number> = {};

    Object.entries(this.patterns).forEach(([category, patterns]) => {
      const matches = this.countMatches(text, patterns);
      if (matches.score > 0) {
        matched[category] = matches.score;
      }
    });

    return matched;
  }

  // NOUVEAU : Méthode d'amélioration des patterns
  addPattern(category: keyof typeof this.patterns, pattern: RegExp): void {
    if (this.patterns[category]) {
      this.patterns[category].push(pattern);
    }
  }

  // NOUVEAU : Obtenir les statistiques des patterns
  getPatternStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    Object.entries(this.patterns).forEach(([category, patterns]) => {
      stats[category] = patterns.length;
    });

    return stats;
  }

  // NOUVEAU : Export des patterns pour analyse
  exportPatterns(): Record<string, string[]> {
    const exported: Record<string, string[]> = {};

    Object.entries(this.patterns).forEach(([category, patterns]) => {
      exported[category] = patterns.map((p) => p.source);
    });

    return exported;
  }

  // --- utilitaires (PRÉSERVÉS) ---
  private countMatches(text: string, regs: RegExp[]) {
    let matches = 0;
    let strongHits = 0; // certains motifs valent un peu plus
    for (const r of regs) {
      const found = text.match(r);
      if (found) {
        matches += found.length;
        // Heuristique : si le motif inclut "je vais|vous allez|veuillez|merci de", on le considère "fort"
        if (
          /\b(je\s+vais|vous\s+allez|veuillez|merci\s+de)\b/i.test(r.source)
        ) {
          strongHits += found.length;
        }
      }
    }
    // score brut = matches; strongHits pour la confiance
    return { score: matches, strongHits };
  }

  private confidenceFrom(res: { score: number; strongHits: number }) {
    // Heuristique simple (à tuner) :
    // base 0.7 + 0.1 * strongHits + 0.05 * (score - strongHits), clampée à [0.5, 1]
    const raw =
      0.7 +
      0.1 * res.strongHits +
      0.05 * Math.max(0, res.score - res.strongHits);
    return Math.max(0.5, Math.min(1, raw));
  }

  // NOUVEAU : Méthodes d'introspection pour amélioration

  // Analyser pourquoi une classification a été faite
  explainClassification(verbatim: string): {
    prediction: string;
    confidence: number;
    explanation: string;
    matchedPatterns: { category: string; patterns: string[] }[];
  } {
    const text = (verbatim || "").trim();
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

  // Suggérer de nouveaux patterns basés sur des erreurs
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

    // Analyser les erreurs par catégorie attendue
    const errorsByExpected = errorExamples.reduce((acc, error) => {
      if (!acc[error.expected]) acc[error.expected] = [];
      acc[error.expected].push(error);
      return acc;
    }, {} as Record<string, typeof errorExamples>);

    Object.entries(errorsByExpected).forEach(([expected, errors]) => {
      if (expected === "AUTRE") return;

      // Identifier des mots/expressions communes dans les erreurs
      const verbatims = errors.map((e) => e.verbatim.toLowerCase());
      const commonWords = this.findCommonWords(verbatims);

      if (commonWords.length > 0) {
        suggestions.push({
          category: expected,
          suggestedPatterns: commonWords.map(
            (word) => `/\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b/i`
          ),
          reasoning: `Mots fréquents dans les erreurs ${expected}: ${commonWords.join(
            ", "
          )}`,
        });
      }
    });

    return suggestions;
  }

  private findCommonWords(texts: string[]): string[] {
    const wordCounts = new Map<string, number>();

    texts.forEach((text) => {
      const words = text.match(/\b\w+\b/g) || [];
      words.forEach((word) => {
        if (word.length > 3) {
          // Ignorer les mots très courts
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      });
    });

    // Retourner les mots qui apparaissent dans au moins 30% des textes
    const threshold = Math.max(1, Math.floor(texts.length * 0.3));
    return Array.from(wordCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, _]) => word);
  }
}
