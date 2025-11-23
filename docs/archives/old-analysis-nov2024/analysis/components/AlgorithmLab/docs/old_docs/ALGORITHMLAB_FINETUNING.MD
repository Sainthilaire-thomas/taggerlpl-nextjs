# AlgorithmLab — README de la session “Tuning & Versioning”

## 🎯 Objectif

Mettre en place une **boucle de tuning fiable** pour les classifieurs (ex. `RegexConseillerClassifier`, `OpenAIConseillerClassifier`) avec :

- **Versionning** (moteur + artefacts : règles / prompt).
- **Snapshots de datasets** (immuables) pour comparer honnêtement.
- **Traçage des runs** (métriques, confusion, configHash).
- **Comparaison A/B** (Δ global + par tag) et **gating** anti-régressions.
- **Publication / rollback** d’une version acceptée.

---

## 🧭 Stratégie utilisée (résumé)

1. **Figer le terrain** : créer un **DatasetSnapshot** (liste d’IDs + gold + hash).
2. **Run d’évaluation** : exécuter un classifieur **versionné** sur ce snapshot → mesurer **métriques & confusion** .
3. **Tuning ciblé** : modifier règles (Regex) ou prompt/few-shots/params (OpenAI).
4. **Nouveau run sur le même snapshot** : comparer **Δ** (global, par tag, confusion Δ).
5. **Gating** : critères d’acceptation (ex. +2 pts accuracy, +5 pts recall sur tag critique, 0 régression canari).
6. **Publier** (flag “current”) ou **Rollback** .

---

## 🧩 Composants à créer / faire évoluer

### 1) Types & utilitaires (shared)

- `shared/BaseClassifier.ts`
  - **Ajouts** dans `ClassifierMetadata` :
    - `artifact: { kind: "rules-pack" | "prompt-pack"; id: string; version: string }`
    - `config?: Record<string, any>` (snapshot des éléments influents)
    - `configHash?: string` (hash stable)
    - `codeCommit?: string`
- `shared/hash.ts`
  - `stableHash(obj)` (hash stable JSON) — sert à produire `configHash`.
- `metrics/FineTuningMetrics.ts`
  - Helpers (accuracy, per-label P/R/F1, confusion, kappa) **réutilisés** par rapport & UI.

### 2) Classifiers (moteur + artefacts)

- `RegexConseillerClassifier.ts`
  - `static VERSION = "x.y.z"` (moteur).
  - **Artefact** `rulesPack = { id, version }` + **patterns** .
  - `getMetadata()` ➜ renseigner `artifact`, `config` (exportPatterns, priorités), `configHash`, `codeCommit`.
  - Méthodes : `freezeRules()`, `getConfigSignature()`.
- `OpenAIConseillerClassifier.ts`
  - `static VERSION = "x.y.z"` (moteur).
  - **Artefact** `promptPack = { id, version, system, fewShots }`.
  - `getMetadata()` ➜ `artifact`, `config` (params + prompt/few-shots), `configHash`.
  - Méthodes : `setPromptPack(next)`, `getConfigSignature()`.

### 3) Persistance (DB)

**Tables Supabase** (migrations) :

- `alg_datasets` (snapshots)

  - `id text PK`, `created_at timestamptz`, `seed int`, `filters jsonb`, `item_ids bigint[]`, `sha256 text`

- `alg_runs` (évaluations)

  - `id text PK`, `created_at timestamptz`,

    `classifier text`, `classifier_version text`,

    `artifact_kind text`, `artifact_id text`, `artifact_version text`,

    `config_hash text`, `code_commit text`,

    `dataset_id text FK -> alg_datasets(id)`,

    `sample_size int`, `metrics jsonb`, `confusion jsonb`, `error_summary jsonb`, `notes text`, `tags text[]`

- _(Optionnel)_ `alg_run_diffs` pour stocker un diff pré-calculé.

### 4) Services (backend)

- `services/DatasetService.ts`
  - `createSnapshot(results, filters, seed) -> DatasetSnapshot`
  - `getSnapshot(id) -> DatasetSnapshot`
- `services/RunLogger.ts`
  - `recordRun(meta, datasetId, metrics, confusion, errorSummary, notes?) -> runId`
  - `listRuns(filters)`, `getRun(id)`
- `services/RunDiff.ts`
  - `diffRuns(runA, runB)` → `{ deltaGlobal, deltaPerLabel[], confusionDelta, regressions[] }`
  - _(optionnel)_ `mcnemar(runA, runB)`

### 5) UI / Front

- **RunPanel** (nouveau)
  - Sélecteur **Classifier** + **Version** (affiche `artifact.version`, `configHash`, `commit`).
  - Sélecteur **DatasetSnapshot** + bouton **Créer snapshot** .
  - Bouton **Lancer évaluation** ➜ enregistre un `alg_run`.
- **RunHistory** (nouveauté)
  - Tableau des runs (classifier/version/configHash/dataset/date/accuracy/kappa).
- **RunCompare** (nouveauté)
  - Compare **Run A vs Run B** sur le **même snapshot** :
    - Δ accuracy, Δ par tag (P/R/F1), confusion Δ (table).
    - Cartouche “ **Régressions** ” (tags sous seuil).
    - Boutons : **Publier cette version** / **Rollback** .
- **MetricsPanel** (évolution)
  - Sélecteur “Comparer à…” (affiche Δ en _badges_ ).
  - Filtre “ **Only regressions** ” pour la liste de résultats.
- **FineTuningDialog** (évolution)
  - Inclure `run_id`, `dataset_id`, `classifier_version`, `configHash` dans l’entête du rapport.
  - Option “Inclure métriques & confusion”.
- **ResultsPanel** (évolution)
  - Filtre “ **Échantillon canari** ”.
  - Badge “ **forcé par heuristique** ” (LLM) si `forcedByHeuristic`.

### 6) Tests & canari

- **Regex** : jeux de tests unitaires de règles (par tag critique).
- **Canary** : 50–200 tours métier critiques → **0 régression tolérée** .

---

## 🗂️ Arborescence cible (simplifiée)

<pre class="overflow-visible!" data-start="4818" data-end="5347"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>algorithmlab/
  algorithms/
    level1/conseillerclassifiers/
      RegexConseillerClassifier.ts
      OpenAIConseillerClassifier.ts
    shared/
      BaseClassifier.ts
      hash.ts
  metrics/
    FineTuningMetrics.ts
  services/
    DatasetService.ts
    RunLogger.ts
    RunDiff.ts
  ui/
    run/
      RunPanel.tsx
      RunHistory.tsx
      RunCompare.tsx
    panels/
      MetricsPanel.tsx   </span><span>// + deltas</span><span>
      ResultsPanel.tsx   </span><span>// + regressions filter</span><span>
    dialogs/
      FineTuningDialog.tsx  </span><span>// + run/dataset info</span><span>
</span></span></code></div></div></pre>

---

## 🔧 Migrations SQL (exemple)

<pre class="overflow-visible!" data-start="5385" data-end="6086"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-sql"><span><span>create</span><span></span><span>table</span><span> if </span><span>not</span><span></span><span>exists</span><span> alg_datasets (
  id text </span><span>primary</span><span> key,
  created_at timestamptz </span><span>default</span><span> now(),
  seed </span><span>int</span><span>,
  filters jsonb,
  item_ids </span><span>bigint</span><span>[],
  sha256 text
);

</span><span>create</span><span></span><span>table</span><span> if </span><span>not</span><span></span><span>exists</span><span> alg_runs (
  id text </span><span>primary</span><span> key,
  created_at timestamptz </span><span>default</span><span> now(),
  </span><span>classifier</span><span> text </span><span>not</span><span></span><span>null</span><span>,
  classifier_version text </span><span>not</span><span></span><span>null</span><span>,
  artifact_kind text </span><span>not</span><span></span><span>null</span><span>,
  artifact_id text </span><span>not</span><span></span><span>null</span><span>,
  artifact_version text </span><span>not</span><span></span><span>null</span><span>,
  config_hash text </span><span>not</span><span></span><span>null</span><span>,
  code_commit text,
  dataset_id text </span><span>not</span><span></span><span>null</span><span></span><span>references</span><span> alg_datasets(id) </span><span>on</span><span></span><span>delete</span><span> cascade,
  sample_size </span><span>int</span><span></span><span>not</span><span></span><span>null</span><span>,
  metrics jsonb </span><span>not</span><span></span><span>null</span><span>,
  confusion jsonb </span><span>not</span><span></span><span>null</span><span>,
  error_summary jsonb,
  notes text,
  tags text[]
);
</span></span></code></div></div></pre>

---

## 🚦 Critères d’acceptation (gating)

- **Global** : `Δaccuracy ≥ +2 pts` **ET** `kappa ≥ 0.4`.
- **Par tag critique** : `Δrecall ≥ +5 pts` et pas de chute > 2 pts sur d’autres tags critiques.
- **Canary** : **0 régression** (obligatoire).
- **Coûts** (LLM) : stabilité du coût & latence (en bonus).

---

## 🛣️ Plan de session (étapes)

1. **Types & hash** (`BaseClassifier`, `hash.ts`).
2. **Regex** : artefact `rulesPack`, `getMetadata()` complet, `configHash`.
3. **OpenAI** : artefact `promptPack`, `getMetadata()` + `configHash`.
4. **Migrations** DB.
5. **Services** : `DatasetService`, `RunLogger`, `RunDiff`.
6. **UI** : `RunPanel` → `RunHistory` → `RunCompare`.
7. **MetricsPanel** (Δ), **FineTuningDialog** (run/dataset), **ResultsPanel** (regressions).
8. **Tests** : canari + unitaires Regex.
9. **Première itération de tuning** (ex. micro-acquiescements) → nouvelle version artefact → run & compare → **publish** .

---

## 📝 Notes de mise en prod

- Toujours **bump** `artifact.version` lors d’un tuning (même mineur).
- Le **moteur** (`static VERSION`) change moins souvent (changement de logique).
- `configHash` = source de vérité pour identifier un build évalué.
- **Snapshot** = même liste d’items → comparaisons honnêtes.
- Utiliser `codeCommit` pour relier au SHA Git (CI/CD).

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

// --------- Normalisation minimale (charte v1.1)
private sanitize(verbatim: string): string {
return (verbatim || "")
.replace(/\[(?:TC|AP)\]/gi, " ") // les étiquettes de transcription ne sont pas fiables → on les efface
.replace(/[’]/g, "'") // apostrophe normalisée
.replace(/\s+/g, " ") // espaces multiples
.trim();
}

// --------- RÈGLES (regex) : hiérarchie de décision (charte v1.1)
private patterns = {
// 1) ENGAGEMENT — action du conseiller (priorité max)
ENGAGEMENT: [
// futur proche / modaux 1re pers.
/\bje\s+(vais|m[' ]?apprête|peux|dois)\s+\w+/i,
// présent d'action courant
/\bje\s+(fais|vérifie|transfère|regarde|demande|relance|note|envoie|mets|corrige|ouvre|cl[oô]ture)\b/i,
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
      /\bvous\s+\w+rez\b/i, // recevrez/validerez etc.
      // modalité déontique / permission
      /\bvous\s+(pouvez|pourrez|devez|devrez)\b/i,
      // interrogatives polies
      /\b(pouvez|pourriez)[-\s]?vous\b/i,
      // impératif (quelques verbes fréquents)
      /\b(appelez|envoyez|pr[ée]cisez|v[ée]rifiez|renseignez|cliquez|joignez|pr[ée]sentez)\b/i,
      // formules procédurales orientées client
      /\bveuillez\b\s+\w+/i,
      /\bmerci\s+de\b\s+\w+/i,
      /\bil\s+faudra\s+que\s+vous\b/i,
      // ✅ ajouts charte v1.1
      /\bil\s+faut(?:\s+bien)?\s+\w+/i,       // "il faut préciser ..."
      /\bje\s+vous\s+invite\s+à\s+\w+/i,     // "je vous invite à ..."
      /\bpensez\s+à\s+\w+/i,                 // "pensez à ..."
      /\bn[' ]oubliez\s+pas\s+de\s+\w+/i,    // "n'oubliez pas de ..."
      /\bvous\s+(serez|allez\s+être)\s+\w+/i // passif orienté client
    ],

    // 3) REFLET — sous-types hiérarchisés (vous > je > acquiescement)
    REFLET_VOUS: [
      /\bvous\s+avez\s+\w+/i,
      /\bvous\s+dites\b/i,
      /\bd['’]apr[eè]s\s+vous\b/i,
      /\bje\s+vois\s+que\s+vous\s+\w+/i,
      /\bsi\s+je\s+comprends\s+bien,\s+vous\s+\w+/i,
      /\bvous\s+m['’]avez\b/i,
    ],
    REFLET_JE: [/\bje\s+(comprends|entends|vois|note)\b/i, /\bj[' ]?entends\b/i],
    REFLET_ACQ: [
      // acquiescements "lexicaux"
      /\b(d[' ]?accord|effectivement|tr[eè]s\s+bien|bien\s+s[uû]r|absolument|tout\s+à\s+fait|parfait|exactement)\b/i,
      /\bc[' ]?est\s+bien\s+ça\b/i,
      // ✅ micro-acquiescements "seuls" (standalone)
      /^\s*(ou[iy]|ouais|ok(?:ay)?|hm+\b|hum+\b|mm+h+)\s*[.!?…]*$/i,
      /^\s*(d[' ]?accord|parfait|exactement)\s*[.!?…]*$/i
    ],

    // 4) EXPLICATION — procédural/réglementaire (priorité minimale)
    EXPLICATION: [
      /\b(parce\s+que|car|c[' ]?est[- ]à[- ]dire|en\s+fait|autrement\s+dit)\b/i,
      /\b(notre|la)\s+(politique|proc[ée]dure|r[èe]glementation|processus|syst[èe]me)\b/i,
      /\bvoici\s+pourquoi\b/i,
      /\bla\s+raison\b/i,
      // ✅ ajouts charte v1.1
      /\bc[' ]?est\s+pour\s+(?:ça|cela)\s+que\b/i,
      /\bil\s+s[' ]?agit\s+de\b/i,
      /\bça\s+veut\s+dire\b/i,
      /\ben\s+cons[ée]quence\b/i,
      /\bdu\s+coup\b/i,
      /\b(le|ce)\s+principe\b/i,
      /\bfonctionne(?:nt)?\b/i,
      /\bje\s+vous\s+explique\b/i,
      // co-occurrences explicatives fréquentes
      /(?:parce\s+que|car|donc).*(?:du\s+coup|c[' ]?est\s+pour\s+ça)/i,
    ],

};

// --------- Implémentation interface BaseClassifier
async classify(verbatim: string): Promise`<ClassificationResult>` {
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

// --------- Logique hiérarchique alignée charte v1.1
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

    // 3) REFLET_VOUS
    const mRV = this.countMatches(text, this.patterns.REFLET_VOUS);
    if (mRV.score > 0) {
      const prediction = this.config.retourRefletDetaille ? "REFLET_VOUS" : "REFLET";
      return { prediction, confidence: this.confidenceFrom(mRV, text, "REFLET_VOUS") };
    }

    // 3b) REFLET_JE
    const mRJ = this.countMatches(text, this.patterns.REFLET_JE);
    if (mRJ.score > 0) {
      const prediction = this.config.retourRefletDetaille ? "REFLET_JE" : "REFLET";
      return { prediction, confidence: this.confidenceFrom(mRJ, text, "REFLET_JE") };
    }

    // 3c) REFLET_ACQ — micro-acquiescement "seul" + garde-fou
    const mRA = this.countMatches(text, this.patterns.REFLET_ACQ);
    if (mRA.score > 0) {
      const isVeryShort = text.length <= 20;
      // Si la phrase est longue ET contient des marqueurs d'instruction/explication → on NE classe pas REFLET_ACQ
      const looksLikeInstructionOrExplain = /\bil\s+faut\b|pensez\s+à|n[' ]oubliez\s+pas|pouvez[-\s]?vous|pourriez[-\s]?vous|vous\s+(serez|allez\s+être)\b|parce\s+que|c[' ]?est\s+pour\s+ça|proc[ée]dure|fonctionne|syst[èe]me|raison\b/i.test(
        text
      );
      if (isVeryShort || !looksLikeInstructionOrExplain) {
        const prediction = this.config.retourRefletDetaille ? "REFLET_ACQ" : "REFLET";
        return { prediction, confidence: this.confidenceFrom(mRA, text, "REFLET_ACQ") };
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
version: "1.3.0", // bump
type: "rule-based",
description:
"Classification par règles regex des stratégies conversationnelles (charte v1.1, nettoyage [TC]/[AP]).",
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
// Heuristique "forte" enrichie (ENGAGEMENT/OUVERTURE saillants)
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
base + 0.12 _ res.strongHits + 0.04 _ Math.max(0, res.score - res.strongHits);

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

    let explanation =`Classification: ${result.prediction} (confiance: ${(result.confidence * 100).toFixed(1)}%)`;
    if (matchedPatterns.length > 0) {
      explanation += `\nPatterns détectés: ${matchedPatterns         .map((mp) => `${mp.category} (${mp.patterns.length} règles)`)         .join(", ")}`;
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

// Suggestion rudimentaire (inchangée)
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
      const verbatims = errors.map((e) => this.sanitize(e.verbatim).toLowerCase());
      const common = this.findCommonWords(verbatims);
      if (common.length > 0) {
        suggestions.push({
          category: expected,
          suggestedPatterns: common.map(
            (w) =>`/\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b/i`
          ),
          reasoning: `Mots fréquents dans les erreurs ${expected}: ${common.join(", ")}`,
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
const threshold = Math.max(1, Math.floor(texts.length \* 0.3));
return Array.from(counts.entries())
.filter(([_, c]) => c >= threshold)
.sort((a, b) => b[1] - a[1])
.slice(0, 5)
.map(([w]) => w);
}
}
