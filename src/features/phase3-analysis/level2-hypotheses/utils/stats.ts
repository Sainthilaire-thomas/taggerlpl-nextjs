// app/(protected)/analysis/components/AlgorithmLab/shared/stats.ts
import {
  AnovaOnProps,
  ChiSquareResult,
  FisherPairwise,
  H1StrategyData,
  H1Summary,
  StrategyKey,
  StrategyStats,
} from "../ui/components/types";
import {
  DEFAULT_H1_THRESHOLDS,
  H1Thresholds,
  evaluateH1Criteria,
  H1ValidationStatus,
} from "../config/hypotheses";

// -----------------------------------------------------------------------------
// Utilitaires internes
// -----------------------------------------------------------------------------
const round = (x: number, d = 2) => Number(x.toFixed(d));
const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);
const normalizeLabel = (label: string) =>
  label.replace(/\s+/g, "_").toUpperCase();

// -----------------------------------------------------------------------------
// 1) Filtrage robuste des données brutes - INSPIRÉ DE useLevel1Testing
// -----------------------------------------------------------------------------

// Familles de tags autorisées pour les conseillers (comme dans useLevel1Testing)
const useAllowedConseillerLabels = (tags: any[]) => {
  const familles = new Set([
    "ENGAGEMENT",
    "OUVERTURE",
    "REFLET",
    "EXPLICATION",
  ]);
  const allowed = new Set(
    (tags || [])
      .filter((t: any) => t?.family && familles.has(t.family))
      .map((t: any) => normalizeLabel(t.label))
  );
  return allowed;
};

// Tags client autorisés
const CLIENT_TAGS_ALLOWED = new Set([
  "CLIENT_POSITIF",
  "CLIENT_NEGATIF",
  "CLIENT_NEUTRE",
  "CLIENT POSITIF",
  "CLIENT NEGATIF",
  "CLIENT NEUTRE",
]);

export function filterValidTurnTagged(
  allTurnTagged: any[],
  tags: any[],
  selectedOrigin?: string | null
): any[] {
  if (!Array.isArray(allTurnTagged) || allTurnTagged.length === 0) {
    console.warn("filterValidTurnTagged: allTurnTagged vide ou invalide");
    return [];
  }

  const allowedConseillerLabels = useAllowedConseillerLabels(tags || []);

  console.log(`🔍 Filtrage H1: ${allTurnTagged.length} tours initiaux`);
  console.log(
    `📋 Labels conseiller autorisés:`,
    Array.from(allowedConseillerLabels)
  );

  const filtered = allTurnTagged.filter((t) => {
    // 1. Filtre par origine si spécifié
    const okOrigin = !selectedOrigin || t.origin === selectedOrigin;
    if (!okOrigin) return false;

    // 2. Validation structure de base
    if (!t || typeof t !== "object") {
      console.warn("Tour invalide (pas un objet):", t);
      return false;
    }

    // 3. Présence des champs essentiels
    if (
      !t.verbatim ||
      typeof t.verbatim !== "string" ||
      t.verbatim.trim() === ""
    ) {
      return false;
    }

    // 4. Tour suivant requis pour former une paire adjacente
    if (
      !t.next_turn_verbatim ||
      typeof t.next_turn_verbatim !== "string" ||
      t.next_turn_verbatim.trim() === ""
    ) {
      return false;
    }

    // 5. Validation des tags conseiller
    const hasValidConseillerTag = (() => {
      // Vérifier dans t.tag directement
      if (t.tag && typeof t.tag === "string") {
        const normalizedTag = normalizeLabel(t.tag);
        return allowedConseillerLabels.has(normalizedTag);
      }

      // Vérifier dans t.agent_tags si présent
      if (Array.isArray(t.agent_tags) && t.agent_tags.length > 0) {
        return t.agent_tags.some((tag: string) => {
          if (!tag || typeof tag !== "string") return false;
          const normalizedTag = normalizeLabel(tag);
          return allowedConseillerLabels.has(normalizedTag);
        });
      }

      return false;
    })();

    if (!hasValidConseillerTag) {
      return false;
    }

    // 6. Validation des tags client
    const hasValidClientTag = (() => {
      // Vérifier dans t.next_turn_tag directement
      if (t.next_turn_tag && typeof t.next_turn_tag === "string") {
        const normalizedTag = normalizeLabel(t.next_turn_tag);
        return (
          CLIENT_TAGS_ALLOWED.has(normalizedTag) ||
          CLIENT_TAGS_ALLOWED.has(t.next_turn_tag)
        );
      }

      // Vérifier dans t.client_tags si présent
      if (Array.isArray(t.client_tags) && t.client_tags.length > 0) {
        return t.client_tags.some((tag: string) => {
          if (!tag || typeof tag !== "string") return false;
          return (
            CLIENT_TAGS_ALLOWED.has(normalizeLabel(tag)) ||
            CLIENT_TAGS_ALLOWED.has(tag)
          );
        });
      }

      return false;
    })();

    if (!hasValidClientTag) {
      return false;
    }

    // 7. Validation optionnelle des métadonnées temporelles
    if (t.start_time !== undefined && t.end_time !== undefined) {
      if (typeof t.start_time !== "number" || typeof t.end_time !== "number") {
        return false;
      }
      if (t.start_time >= t.end_time) {
        return false;
      }
    }

    return true;
  });

  console.log(`✅ Filtrage H1: ${filtered.length} tours valides retenus`);

  // Debug: afficher la répartition par stratégie
  const strategyCounts: Record<string, number> = {};
  filtered.forEach((t) => {
    const strategy = extractConseillerStrategy(t, allowedConseillerLabels);
    strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
  });
  console.log("📊 Répartition par stratégie:", strategyCounts);

  return filtered;
}

// Fonction utilitaire pour extraire la stratégie conseiller d'un tour
function extractConseillerStrategy(
  turn: any,
  allowedLabels: Set<string>
): string {
  // Priorité 1: t.tag direct
  if (turn.tag && typeof turn.tag === "string") {
    const normalized = normalizeLabel(turn.tag);
    if (allowedLabels.has(normalized)) {
      return normalized;
    }
  }

  // Priorité 2: premier tag valide dans agent_tags
  if (Array.isArray(turn.agent_tags)) {
    for (const tag of turn.agent_tags) {
      if (tag && typeof tag === "string") {
        const normalized = normalizeLabel(tag);
        if (allowedLabels.has(normalized)) {
          return normalized;
        }
      }
    }
  }

  return "AUTRE";
}

// Fonction utilitaire pour extraire la réaction client
function extractClientReaction(turn: any): string {
  // Priorité 1: t.next_turn_tag direct
  if (turn.next_turn_tag && typeof turn.next_turn_tag === "string") {
    const normalized = normalizeLabel(turn.next_turn_tag);
    if (
      CLIENT_TAGS_ALLOWED.has(normalized) ||
      CLIENT_TAGS_ALLOWED.has(turn.next_turn_tag)
    ) {
      return normalized.includes("POSITIF")
        ? "POSITIF"
        : normalized.includes("NEGATIF")
        ? "NEGATIF"
        : "NEUTRE";
    }
  }

  // Priorité 2: premier tag valide dans client_tags
  if (Array.isArray(turn.client_tags)) {
    for (const tag of turn.client_tags) {
      if (tag && typeof tag === "string") {
        const normalized = normalizeLabel(tag);
        if (
          CLIENT_TAGS_ALLOWED.has(normalized) ||
          CLIENT_TAGS_ALLOWED.has(tag)
        ) {
          return normalized.includes("POSITIF") || tag.includes("POSITIF")
            ? "POSITIF"
            : normalized.includes("NEGATIF") || tag.includes("NEGATIF")
            ? "NEGATIF"
            : "NEUTRE";
        }
      }
    }
  }

  return "NEUTRE"; // par défaut
}

// -----------------------------------------------------------------------------
// 2) Construction des lignes H1 par stratégie - AMÉLIORATION
// -----------------------------------------------------------------------------
const STRATEGIES_ACTION: StrategyKey[] = ["ENGAGEMENT", "OUVERTURE"];
const STRATEGY_EXPLANATION: StrategyKey = "EXPLICATION";

export function computeH1Analysis(
  validTurnTagged: any[],
  tags: any[]
): H1StrategyData[] {
  if (!Array.isArray(validTurnTagged) || validTurnTagged.length === 0) {
    console.warn("computeH1Analysis: données vides");
    return [];
  }

  const allowedLabels = useAllowedConseillerLabels(tags || []);
  const map: Record<
    string,
    { pos: number; neg: number; neu: number; total: number }
  > = {};

  console.log(`🔬 Analyse H1 sur ${validTurnTagged.length} tours valides`);

  for (const t of validTurnTagged) {
    const strategy = extractConseillerStrategy(t, allowedLabels);
    const clientReaction = extractClientReaction(t);

    if (!map[strategy]) {
      map[strategy] = { pos: 0, neg: 0, neu: 0, total: 0 };
    }

    map[strategy].total += 1;

    switch (clientReaction) {
      case "POSITIF":
        map[strategy].pos += 1;
        break;
      case "NEGATIF":
        map[strategy].neg += 1;
        break;
      default:
        map[strategy].neu += 1;
    }
  }

  const rows: H1StrategyData[] = Object.entries(map).map(([strategy, v]) => {
    const positiveRate = Math.round(safeDiv(v.pos, v.total) * 100);
    const neutralRate = Math.round(safeDiv(v.neu, v.total) * 100);
    const negativeRate = Math.round(safeDiv(v.neg, v.total) * 100);
    return {
      strategy,
      totalSamples: v.total,
      positiveCount: v.pos,
      neutralCount: v.neu,
      negativeCount: v.neg,
      positiveRate,
      neutralRate,
      negativeRate,
      effectiveness: positiveRate - negativeRate,
    };
  });

  // Ordonner par efficacité décroissante
  rows.sort((a, b) => b.effectiveness - a.effectiveness);

  console.log("📈 Résultats H1 par stratégie:");
  rows.forEach((r) => {
    console.log(
      `  ${r.strategy}: ${r.positiveRate}% positif, ${r.negativeRate}% négatif (${r.totalSamples} échantillons)`
    );
  });

  return rows;
}

// -----------------------------------------------------------------------------
// 3) Transformations pour composants (inchangé)
// -----------------------------------------------------------------------------
export function toStrategyStats(rows: H1StrategyData[]): StrategyStats[] {
  return rows.map((r) => ({
    strategy: r.strategy,
    total: r.totalSamples,
    positive: r.positiveRate,
    negative: r.negativeRate,
    effectiveness: r.effectiveness,
  }));
}

// -----------------------------------------------------------------------------
// 4) Tests statistiques (inchangés)
// -----------------------------------------------------------------------------
export function computeChiSquare(rows: H1StrategyData[]): ChiSquareResult {
  const contingency = rows.map((r) => [
    r.positiveCount,
    r.neutralCount,
    r.negativeCount,
  ]);
  const rowTotals = contingency.map((row) => row.reduce((a, b) => a + b, 0));
  const colTotals = [0, 0, 0];
  contingency.forEach((row) => row.forEach((v, j) => (colTotals[j] += v)));
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

  let chi = 0;
  for (let i = 0; i < contingency.length; i++) {
    for (let j = 0; j < 3; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / grandTotal;
      if (expected > 0) {
        const diff = contingency[i][j] - expected;
        chi += (diff * diff) / expected;
      }
    }
  }

  const df = (contingency.length - 1) * (3 - 1);
  const p = approxChiSquarePValue(chi, df);
  const v = Math.sqrt(chi / (grandTotal * Math.min(contingency.length - 1, 2)));
  const interpretation: ChiSquareResult["interpretation"] =
    v < 0.1 ? "faible" : v < 0.3 ? "modéré" : "fort";

  return {
    statistic: round(chi, 2),
    pValue: round(p, 4),
    degreesOfFreedom: df,
    cramersV: round(v, 3),
    significant: p < 0.05,
    interpretation,
    contingency,
  };
}

function approxChiSquarePValue(chi2: number, df: number): number {
  const t = Math.pow(chi2 / df, 1 / 3);
  const z = (t - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  const pRight = 1 - 0.5 * (1 + erf(z / Math.SQRT2));
  return Math.max(0, Math.min(1, pRight));
}

function erf(x: number) {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function computeFisherPairwise(
  rows: H1StrategyData[]
): FisherPairwise[] {
  const pairs: FisherPairwise[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];

      const aPos = a.positiveCount;
      const aOther = a.neutralCount + a.negativeCount;
      const bPos = b.positiveCount;
      const bOther = b.neutralCount + b.negativeCount;

      const or = safeDiv(aPos * bOther, bPos * aOther);
      const se = Math.sqrt(
        1 / Math.max(aPos, 1) +
          1 / Math.max(aOther, 1) +
          1 / Math.max(bPos, 1) +
          1 / Math.max(bOther, 1)
      );
      const z = Math.log(Math.max(or, 1e-9)) / se;
      const p = 2 * (1 - 0.5 * (1 + erf(Math.abs(z) / Math.SQRT2)));

      pairs.push({
        comparison: `${a.strategy} vs ${b.strategy}`,
        oddsRatio: round(or, 2),
        pValue: round(p, 4),
        significant: p < 0.05,
      });
    }
  }
  return pairs;
}

export function computeAnova(rows: H1StrategyData[]): AnovaOnProps | undefined {
  if (rows.length < 2) return undefined;
  const groups = rows.map((r) => Array(r.totalSamples).fill(r.positiveRate));
  const flat = groups.flat();

  const k = groups.length;
  const n = flat.length;
  if (n === 0) return undefined;

  const mean = flat.reduce((a, b) => a + b, 0) / n;
  const ssBetween = groups.reduce(
    (sum, g) => sum + g.length * Math.pow(g[0] - mean, 2),
    0
  );
  const ssWithin = groups.reduce(
    (sum, g) => sum + g.reduce((s, x) => s + Math.pow(x - g[0], 2), 0),
    0
  );

  const dfBetween = k - 1;
  const dfWithin = Math.max(n - k, 1);
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const F = msWithin === 0 ? Infinity : msBetween / msWithin;
  const p = msWithin === 0 ? 0 : approxFPValue(F, dfBetween, dfWithin);

  return {
    fStatistic: round(F, 2),
    pValue: round(p, 4),
    significant: p < 0.05,
    groupMeans: rows.map((r) => ({
      strategy: r.strategy,
      mean: r.positiveRate,
    })),
  };
}

function approxFPValue(F: number, df1: number, df2: number): number {
  if (!isFinite(F)) return 0;
  const ratio = df2 / (df2 + df1 * F);
  const approx = Math.pow(ratio, df2 / 2);
  return Math.max(0, Math.min(1, approx));
}

// -----------------------------------------------------------------------------
// 5) Résumé H1 avec critères complets - NOUVEAU
// -----------------------------------------------------------------------------
export function summarizeH1(
  rows: H1StrategyData[],
  thresholds: H1Thresholds = DEFAULT_H1_THRESHOLDS
): H1Summary {
  // Calcul des moyennes Actions vs Explications
  const actions = rows.filter((r) => STRATEGIES_ACTION.includes(r.strategy));
  const exp = rows.find((r) => r.strategy === STRATEGY_EXPLANATION);

  const actionsAverage =
    actions.length > 0
      ? actions.reduce((s, r) => s + r.positiveRate, 0) / actions.length
      : 0;

  const actionsNegativeAverage =
    actions.length > 0
      ? actions.reduce((s, r) => s + r.negativeRate, 0) / actions.length
      : 0;

  const explanationPositive = exp?.positiveRate ?? 0;
  const explanationNegative = exp?.negativeRate ?? 0;
  const empiricalDifference = actionsAverage - explanationPositive;

  // Tests statistiques
  const chiSquare = computeChiSquare(rows);
  const fisher = computeFisherPairwise(rows);
  const anova = computeAnova(rows);

  // Tailles d'échantillon
  const sampleSizes = {
    total: rows.reduce((sum, r) => sum + r.totalSamples, 0),
    perGroup: rows.map((r) => r.totalSamples),
  };

  // Évaluation complète avec critères étendus
  const validation = evaluateH1Criteria(
    actionsAverage,
    actionsNegativeAverage,
    explanationPositive,
    explanationNegative,
    empiricalDifference,
    chiSquare.pValue,
    chiSquare.cramersV ?? 0,
    sampleSizes,
    thresholds
  );

  // Construction du H1Summary compatible avec l'interface existante
  const h1Summary: H1Summary = {
    actionsAverage: round(actionsAverage, 1),
    explanationPositive: round(explanationPositive, 1),
    empiricalDifference: round(empiricalDifference, 1),

    chiSquare,
    fisher,
    anova,

    // Conversion du statut détaillé vers l'ancien format
    overallValidation:
      validation.status === "VALIDATED"
        ? "VALIDATED"
        : validation.status === "PARTIALLY_VALIDATED"
        ? "PARTIALLY_VALIDATED"
        : "NOT_VALIDATED",

    academicConclusion: generateAcademicConclusion(validation),
    practicalImplications: validation.recommendations.slice(0, 2), // Limiter à 2 pour l'affichage
    limitationsNoted: [
      ...validation.criteria.warningsIssued,
      "Tests approximatifs de p-value sont indicatifs pour l'UI.",
    ],

    // Extensions pour les nouveaux critères
    validation: validation, // Validation complète disponible
    thresholds: thresholds, // Configuration utilisée

    // Nouveaux champs pour l'interface
    actionsNegativeAverage: round(actionsNegativeAverage, 1),
    explanationNegative: round(explanationNegative, 1),
    sampleSizeAdequate: validation.criteria.sampleSizeAdequate,
    confidence: validation.confidence,
    detailedCriteria: validation.criteria,
  };

  return h1Summary;
}

function generateAcademicConclusion(validation: H1ValidationStatus): string {
  const score = validation.criteria.overallScore;
  const maxScore = validation.criteria.maxScore;

  switch (validation.status) {
    case "VALIDATED":
      return `L'hypothèse H1 est pleinement validée (${score}/${maxScore} critères). Les descriptions d'actions démontrent une efficacité significativement supérieure aux explications dans la gestion des interactions conflictuelles.`;

    case "PARTIALLY_VALIDATED":
      return `H1 est partiellement supportée (${score}/${maxScore} critères). Les résultats suggèrent une efficacité différentielle nécessitant consolidation par un échantillon élargi.`;

    case "INSUFFICIENT_DATA":
      return `L'évaluation de H1 est limitée par la taille d'échantillon insuffisante. Les tendances observées nécessitent confirmation sur un corpus plus large.`;

    default:
      return `H1 n'est pas supportée par les données actuelles (${score}/${maxScore} critères). La méthodologie ou les critères de classification nécessitent révision.`;
  }
}

// Fonction utilitaire pour l'interface : extraction des critères détaillés
export function extractDetailedCriteria(h1Summary: H1Summary) {
  const validation = (h1Summary as any).validation as H1ValidationStatus;
  if (!validation) return null;

  return {
    criteriaDetails: [
      {
        name: "Actions → Positif",
        met: validation.criteria.actionsPositive.met,
        value: `${validation.criteria.actionsPositive.value.toFixed(1)}%`,
        threshold: `≥${validation.criteria.actionsPositive.threshold}%`,
        description: validation.criteria.actionsPositive.description,
      },
      {
        name: "Actions → Négatif",
        met: validation.criteria.actionsNegative.met,
        value: `${validation.criteria.actionsNegative.value.toFixed(1)}%`,
        threshold: `≤${validation.criteria.actionsNegative.threshold}%`,
        description: validation.criteria.actionsNegative.description,
      },
      {
        name: "Explications → Positif",
        met: validation.criteria.explanationsPositive.met,
        value: `${validation.criteria.explanationsPositive.value.toFixed(1)}%`,
        threshold: `≤${validation.criteria.explanationsPositive.threshold}%`,
        description: validation.criteria.explanationsPositive.description,
      },
      {
        name: "Explications → Négatif",
        met: validation.criteria.explanationsNegative.met,
        value: `${validation.criteria.explanationsNegative.value.toFixed(1)}%`,
        threshold: `≥${validation.criteria.explanationsNegative.threshold}%`,
        description: validation.criteria.explanationsNegative.description,
      },
      {
        name: "Écart Empirique",
        met: validation.criteria.empiricalDifference.met,
        value: `+${validation.criteria.empiricalDifference.value.toFixed(
          1
        )} pts`,
        threshold: `≥${validation.criteria.empiricalDifference.threshold} pts`,
        description: validation.criteria.empiricalDifference.description,
      },
      {
        name: "Significativité Stats",
        met: validation.criteria.statisticalSignificance.met,
        value: `p=${
          validation.criteria.statisticalSignificance.chiSquareP < 0.001
            ? "<0.001"
            : validation.criteria.statisticalSignificance.chiSquareP.toFixed(3)
        }, V=${validation.criteria.statisticalSignificance.cramersV.toFixed(
          3
        )}`,
        threshold: `p<0.05, V≥0.1`,
        description: validation.criteria.statisticalSignificance.description,
      },
    ],
    overallScore: validation.criteria.overallScore,
    maxScore: validation.criteria.maxScore,
    warnings: validation.criteria.warningsIssued,
    confidence: validation.confidence,
  };
}
