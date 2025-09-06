# Documentation - Branche algorithms

## Vue d'ensemble

La branche `algorithms` constitue le cœur scientifique de TaggerLPL, implémentant l'**AlgorithmLab** - un laboratoire d'algorithmes d'analyse conversationnelle développé pour la recherche en linguistique appliquée. Cette branche matérialise les algorithmes théoriques décrits dans le projet de thèse, permettant l'annotation automatique et l'analyse quantitative des interactions client-conseiller.

## Architecture générale

### Hiérarchie des répertoires

```
src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/
├── M1Algorithms/           # Métriques d'action (densité verbes d'action)
├── M2Algorithms/           # Métriques d'alignement (lexical/sémantique)
├── M3Algorithms/           # Métriques cognitives (pauses/hésitations)
├── XAlgorithms/            # Classification conseiller (ENGAGEMENT/OUVERTURE/REFLET/EXPLICATION)
├── YAlgorithms/            # Classification client (POSITIF/NÉGATIF/NEUTRE)
├── conseillerclassifiers/  # Legacy - classificateurs conseiller
├── clientclassifiers/      # Legacy - classificateurs client
└── shared/                 # Infrastructure commune
```

### Typologie des algorithmes

L'AlgorithmLab implémente trois types d'algorithmes correspondant aux approches méthodologiques de la thèse :

| Type           | Description                   | Technologies                 | Exemples                               |
| -------------- | ----------------------------- | ---------------------------- | -------------------------------------- |
| **rule-based** | Règles linguistiques expertes | Regex, patterns syntaxiques  | RegexXClassifier, RegexYClassifier     |
| **ml**         | Apprentissage automatique     | spaCy, modèles pré-entraînés | SpacyXClassifier                       |
| **llm**        | Modèles de langage            | OpenAI GPT, prompting        | OpenAIXClassifier, OpenAI3TXClassifier |

## Infrastructure commune (shared/)

### BaseAlgorithm - Interface unifiée

```typescript
export interface BaseAlgorithm<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
  runBatch?(inputs: TInput[]): Promise<TOutput[]>;
  describe(): AlgorithmMetadata;
  validateConfig?(): boolean;
}

export interface AlgorithmMetadata {
  name: string; // Identifiant technique
  displayName?: string; // Nom d'affichage
  type: AlgorithmType; // rule-based | ml | llm
  target: VariableTarget; // X | Y | M1 | M2 | M3
  version?: string;
  description?: string;
  batchSupported?: boolean;
  apiRequirements?: string[]; // ex: ["OPENAI_API_KEY"]
}
```

### AlgorithmRegistry - Registre centralisé

Le registre permet l'enregistrement et la découverte automatique des algorithmes :

```typescript
// Enregistrement automatique
algorithmRegistry.register("RegexXClassifier", new RegexXClassifier());
algorithmRegistry.register("OpenAIXClassifier", new OpenAIXClassifier());

// Récupération
const algorithm = algorithmRegistry.get<string, XClassification>(
  "RegexXClassifier"
);
const results = await algorithm.run("je vais vérifier votre dossier");

// Liste des algorithmes disponibles
const available = algorithmRegistry.list();
```

### Initialisation automatique

Les algorithmes sont auto-initialisés côté serveur via `initializeAlgorithms()` :

```typescript
// Auto-init côté serveur uniquement
if (typeof window === "undefined") {
  initializeAlgorithms();
}
```

## Variables de recherche et algorithmes correspondants

### Variable X - Classification conseiller

**Objectif théorique** : Classifier automatiquement les tours de parole conseiller selon la typologie établie par l'analyse conversationnelle.

**Catégories** :

- `ENGAGEMENT` : Actions du conseiller ("je vais vérifier", "je transmets")
- `OUVERTURE` : Actions dirigées vers le client ("vous allez recevoir", "vous pouvez")
- `REFLET_VOUS` : Reformulation centrée client ("vous avez dit")
- `REFLET_JE` : Empathie conseiller ("je comprends")
- `REFLET_ACQ` : Acquiescement simple ("d'accord", "oui")
- `EXPLICATION` : Justifications procédurales ("notre politique", "le système")

#### RegexXClassifier - Règles expertes

```typescript
// Hiérarchie de priorité (charte v1.2)
private patterns = {
  ENGAGEMENT: [
    /\bje\s+(vais|fais|vérifie|transfère|regarde)\b/i,
    /\bon\s+va\s+\w+/i
  ],
  OUVERTURE: [
    /\bvous\s+(allez|pourrez|devez)\s+\w+/i,
    /\bveuillez\b\s+\w+/i,
    /(?:^|[.!?]\s+)(indiquez|donnez|appelez)\b/i
  ],
  // ... patterns REFLET et EXPLICATION
};
```

**Caractéristiques** :

- ✅ Déterministe et explicable
- ✅ Rapide (< 5ms par classification)
- ✅ Pas de dépendance externe
- ⚠️ Maintenance manuelle des patterns

#### OpenAIXClassifier - LLM single-turn

```typescript
// Prompt optimisé pour la classification déterministe
const system = `Tu es un classificateur déterministe de tours CONSEILLER.
Réponds EXACTEMENT par un seul label parmi: ${ALLOWED.join(", ")}

Règle de priorité stricte:
ENGAGEMENT > OUVERTURE > REFLET_VOUS > REFLET_JE > REFLET_ACQ > EXPLICATION

Sortie: retourne uniquement l'un des 7 labels.`;
```

**Caractéristiques** :

- ✅ Haute précision sur cas complexes
- ✅ Gestion nuances linguistiques
- ❌ Latence réseau (100-1000ms)
- ❌ Coût par appel API
- 🔑 Nécessite `OPENAI_API_KEY`

#### OpenAI3TXClassifier - LLM multi-turn

Extension du classificateur OpenAI pour l'analyse contextuelle sur 3 tours :

```typescript
// Format d'entrée enrichi
const input = {
  tMinus2: "client: j'ai essayé hier",
  tMinus1: "conseiller: je comprends",
  t0: "d'accord, je vais vérifier",
};

await classifier.classifyTriplet(tMinus2, tMinus1, t0);
```

#### SpacyXClassifier - Machine Learning

Intégration avec API spaCy locale pour classification ML :

```typescript
// Configuration spaCy
const spacyClassifier = new SpacyXClassifier({
  apiUrl: "http://localhost:8000/classify",
  model: "fr_core_news_md",
  timeout: 5000,
});
```

### Variable Y - Classification client

**Objectif théorique** : Mesurer automatiquement la réaction émotionnelle du client aux stratégies conseiller.

**Catégories** :

- `CLIENT_POSITIF` : Coopération, satisfaction ("d'accord", "merci", "parfait")
- `CLIENT_NEUTRE` : Questions factuelles ("combien ?", "quand ?")
- `CLIENT_NEGATIF` : Résistance, frustration ("impossible", "inadmissible")

#### RegexYClassifier - Dictionnaires pondérés

```typescript
private dictionnaires = {
  CLIENT_POSITIF: {
    expressions: ["d'accord", "parfait", "très bien", "merci beaucoup"],
    mots: ["oui", "bien", "merci", "accord", "satisfait"]
  },
  CLIENT_NEGATIF: {
    expressions: ["pas d'accord", "c'est inadmissible", "impossible"],
    mots: ["non", "refuse", "contre", "problème", "énervé"]
  },
  // ...
};

// Scoring pondéré
private calculateScore(text: string, dictionary) {
  let score = 0;
  // Expressions = poids fort
  dictionary.expressions.forEach(expr => {
    if (text.includes(expr)) score += this.config.poidsExpressions;
  });
  // Mots isolés = poids standard
  dictionary.mots.forEach(mot => {
    const matches = text.match(new RegExp(`\\b${mot}\\b`, 'g'));
    if (matches) score += matches.length * this.config.poidsMots;
  });
  return score / totalWeight;
}
```

### Variable M1 - Densité de verbes d'action

**Objectif théorique** : Mesurer automatiquement la densité de verbes d'action dans les tours conseiller pour valider l'hypothèse de simulation motrice.

#### M1ActionVerbCounter - Comptage linguistique

```typescript
// Dictionnaire de verbes d'action expert
private baseActionLemmas = new Set([
  "verifier", "envoyer", "transmettre", "traiter", "regarder",
  "chercher", "noter", "ouvrir", "fermer", "mettre", "donner",
  "appeler", "rappeler", "contacter", "activer", "modifier",
  // ... 50+ verbes métier
]);

// Détection future proche "aller + infinitif"
private detectFutureProche(tokens: string[]): number {
  let count = 0;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (/^(vais|vas|va|allons|allez|vont)$/.test(tokens[i])) {
      const next = tokens[i + 1];
      if (/^[a-z]+er$|^[a-z]+ir$|^[a-z]+re$|^[a-z]+oir$/.test(next)) {
        count++;
      }
    }
  }
  return count;
}

// Résultat avec métadonnées
return {
  prediction: `${density.toFixed(2)}`, // "2.35" verbes/100 tokens
  confidence: Math.min(1, 0.5 + Math.min(0.5, actionVerbCount / 10)),
  metadata: {
    densityPer: 100,
    density,
    actionVerbCount,
    totalTokens,
    verbsFound: ["verifier", "envoyer"] // lemmes détectés
  }
};
```

### Variable M2 - Alignement linguistique

**Objectif théorique** : Mesurer l'alignement lexical et sémantique entre tours adjacents pour valider l'hypothèse d'entraînement conversationnel.

#### M2LexicalAlignmentCalculator - Score Jaccard

```typescript
// Calcul d'alignement lexical entre T0 et T+1
async calculate(input: M2Input): Promise<ClassificationResultM2> {
  const tokensT0 = new Set(tokenize(input.turnVerbatim));
  const tokensT1 = new Set(tokenize(input.nextTurnVerbatim));
  const jaccardScore = jaccard(tokensT0, tokensT1);

  const prediction =
    jaccardScore >= 0.5 ? "aligné" :
    jaccardScore >= 0.3 ? "partiellement_aligné" :
    "non_aligné";

  return {
    prediction,
    confidence: jaccardScore,
    metadata: {
      lexicalScore: jaccardScore,
      sharedTokens: shared(tokensT0, tokensT1),
      thresholds: { aligned: 0.5, partial: 0.3 }
    }
  };
}

// Utilitaires alignement
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / (a.size + b.size - intersection);
}
```

#### M2SemanticAlignmentCalculator - Patterns sémantiques

```typescript
// Banque de patterns sémantiques d'alignement
const PATTERN_BANK: Record<string, RegExp> = {
  acquiescement: /\b(daccord|oui|parfait|tres bien|super|merci)\b/iu,
  clarification: /\b(combien|quand|comment|pourquoi|preciser)\b/iu,
  objection: /\b(mais|cependant|pas daccord|impossible)\b/iu,
  reformulation: /\b(vous dites|si je comprends|donc vous)\b/iu,
  action_response: /\b(je vais|nous allons|on va)\b.*\b(daccord|merci)\b/iu
};

// Scoring basé sur détection de patterns
private scorePatterns(input: M2Input): { score: number; hits: string[] } {
  const t0 = normalize(input.turnVerbatim);
  const t1 = normalize(input.nextTurnVerbatim);

  const hits: string[] = [];
  for (const key of this.config.patterns) {
    const regex = PATTERN_BANK[key];
    const haystack = key === "action_response" ? `${t0} >>> ${t1}` : t1;
    if (regex.test(haystack)) hits.push(key);
  }

  // Score = proportion de patterns détectés
  const score = hits.length / Math.max(1, this.config.patterns.length);
  return { score, hits };
}
```

#### M2CompositeAlignmentCalculator - Fusion pondérée

```typescript
// Combinaison intelligente lexical + sémantique
export default class M2CompositeAlignmentCalculator extends BaseM2Calculator {
  private config: FusionConfig = {
    lexicalWeight: 0.4, // Poids alignement lexical
    semanticWeight: 0.6, // Poids alignement sémantique
    threshold: 0.5, // Seuil "aligné"
    partialThreshold: 0.3, // Seuil "partiellement aligné"
  };

  async calculate(input: M2Input): Promise<CalculationResult<M2Details>> {
    // Calculs parallèles
    const [lexicalResult, semanticResult] = await Promise.all([
      this.lexical.calculate(input),
      this.semantic.calculate(input),
    ]);

    // Fusion pondérée
    const finalScore =
      lexicalResult.confidence * this.config.lexicalWeight +
      semanticResult.confidence * this.config.semanticWeight;

    const alignmentType =
      finalScore >= this.config.threshold
        ? "aligné"
        : finalScore >= this.config.partialThreshold
        ? "partiellement_aligné"
        : "non_aligné";

    return {
      prediction: alignmentType,
      confidence: finalScore,
      metadata: {
        lexicalScore: lexicalResult.confidence,
        semanticScore: semanticResult.confidence,
        finalScore,
        fusionWeights: this.config,
      },
    };
  }
}
```

### Variable M3 - Charge cognitive

**Objectif théorique** : Détecter automatiquement les marqueurs de charge cognitive (pauses, hésitations) dans les tours client.

#### PausesM3Calculator - Heuristiques cognitives

```typescript
async calculate(input: M3Input): Promise<CalculationResult<M3Details>> {
  const text = input.clientTurn?.toLowerCase() ?? "";

  // Comptages des marqueurs de charge cognitive
  const ellipses = (text.match(/…|\.{3}/g) || []).length;
  const pauseTags = (text.match(/\((?:pause|silence|hésitation)\)/g) || []).length;
  const hesitations = (text.match(/\b(euh+|heu+|hum+|uh+|um+|bah)\b/gi) || []).length;
  const dashBreaks = (text.match(/--|—/g) || []).length;
  const doubleSpaces = (text.match(/ {2,}/g) || []).length;

  const tokens = (text.match(/\S+/g) || []).length;

  // Pondération empirique des marqueurs
  const rawScore =
    ellipses * 0.5 +
    pauseTags * 1.0 +  // Poids maximal
    hesitations * 0.4 +
    dashBreaks * 0.5 +
    doubleSpaces * 0.25;

  // Normalisation par la longueur du tour
  const denominator = Math.max(1, tokens * 0.05); // ~1 marqueur/20 tokens = score 1
  const score = Math.min(1, rawScore / denominator);

  return {
    score,
    details: {
      counts: { ellipses, pauseTags, hesitations, dashBreaks, doubleSpaces, tokens },
      weights: { ellipses: 0.5, pauseTags: 1.0, hesitations: 0.4, dashBreaks: 0.5, doubleSpaces: 0.25 },
      rawScore,
      normalizedScore: score
    }
  };
}
```

## Intégration API et routes

### Route de classification unifiée

```typescript
// POST /api/algolab/classify
export async function POST(request: Request) {
  const body = await request.json();

  if (body.verbatim) {
    // Classification simple
    const classifier = algorithmRegistry.get("OpenAIXClassifier");
    const result = await classifier.run(body.verbatim);
    return NextResponse.json({ ok: true, result });
  }

  if (body.verbatims) {
    // Classification batch
    const results = await Promise.all(
      body.verbatims.map((v) => classifier.run(v))
    );
    return NextResponse.json({ ok: true, results });
  }
}
```

### Route de statut des algorithmes

```typescript
// GET /api/algolab/algorithms
export async function GET() {
  const status = getAlgorithmStatus();
  return NextResponse.json(status);
}

// Réponse type
{
  "totalCount": 12,
  "availableCount": 9,
  "algorithms": [
    {
      "key": "RegexXClassifier",
      "displayName": "Règles – X (conseiller)",
      "type": "rule-based",
      "target": "X",
      "isValid": true,
      "supportsBatch": true
    },
    {
      "key": "OpenAIXClassifier",
      "displayName": "OpenAI – X (1 tour)",
      "type": "llm",
      "target": "X",
      "isValid": false, // OPENAI_API_KEY manquante
      "supportsBatch": true
    }
  ],
  "environment": {
    "hasOpenAI": false,
    "spacyApiUrl": "localhost:8000 (default)",
    "nodeEnv": "development"
  },
  "recommendations": [
    "Configurez OPENAI_API_KEY pour activer les classificateurs GPT",
    "Configurez SPACY_API_URL ou démarrez une API spaCy locale"
  ]
}
```

## Validation et métriques

### Tests de performance

```typescript
// Benchmark automatisé de tous les algorithmes
export async function benchmarkAlgorithms(
  verbatims: string[]
): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const { key } of algorithmRegistry.list()) {
    const algo = algorithmRegistry.get(key);
    if (!algo?.validateConfig()) continue;

    const start = Date.now();
    const classifications = [];

    for (const verbatim of verbatims) {
      const result = await algo.run(verbatim);
      classifications.push(result);
    }

    const totalTime = Date.now() - start;
    const avgConfidence =
      classifications.reduce((sum, r) => sum + r.confidence, 0) /
      classifications.length;

    results[key] = {
      totalTime,
      avgTime: totalTime / verbatims.length,
      avgConfidence,
      throughput: (verbatims.length / totalTime) * 1000, // classifications/sec
    };
  }

  return results;
}
```

### Validation croisée multi-niveaux

La validation suit le framework théorique de convergence entre les trois niveaux d'analyse (AC, LI, Sciences cognitives) :

```typescript
// Validation empirique de la convergence théorique
async function validateCrossLevelConvergence(
  corpusPairs: PairAdjacenteEnrichie[]
): Promise<ConvergenceResults> {
  const strategyFamilies = {
    ENGAGEMENT: ["ENGAGEMENT"],
    OUVERTURE: ["OUVERTURE"],
    REFLET: ["REFLET_VOUS", "REFLET_JE", "REFLET_ACQ"],
    EXPLICATION: ["EXPLICATION"],
  };

  const convergenceResults: ConvergenceResults = {};

  for (const [familyName, strategyTags] of Object.entries(strategyFamilies)) {
    const familyPairs = corpusPairs.filter((pair) =>
      strategyTags.includes(pair.conseiller.tag)
    );

    // NIVEAU AC : Distribution empirique des réactions client
    const acDistribution = calculateClientReactionDistribution(familyPairs);

    // NIVEAU LI : Scores d'alignement moyens
    const liScores = {
      commonGroundEstablished: calculateAvgCGScore(familyPairs, "CG_ETABLI"),
      feedbackAlignment: calculateAvgFeedbackScore(familyPairs, "ALIGNEMENT"),
      prosodicFluency: calculateAvgFluencyScore(familyPairs, "FLUIDE"),
    };

    // NIVEAU COGNITIF : Indicateurs de traitement moyens
    const cognitiveScores = {
      cognitiveFluency: calculateAvgCognitiveFluency(familyPairs),
      cognitiveLoad: calculateAvgCognitiveLoad(familyPairs),
      processingAutomaticity: calculateAutomaticityScore(familyPairs),
    };

    // TEST DE CONVERGENCE : les 3 niveaux prédisent-ils la même efficacité ?
    convergenceResults[familyName] = {
      acLevel: acDistribution,
      liLevel: liScores,
      cognitiveLevel: cognitiveScores,
      convergenceScore: calculateConvergenceScore(
        acDistribution,
        liScores,
        cognitiveScores
      ),
      theoreticalPrediction: getTheoreticalPrediction(familyName),
    };
  }

  return convergenceResults;
}
```

## Configuration et déploiement

### Variables d'environnement

```bash
# OpenAI (LLM algorithms)
OPENAI_API_KEY=sk-...

# spaCy API (ML algorithms)
SPACY_API_URL=http://localhost:8000

# Configuration algorithms
ALGORITHM_CACHE_TTL=300000  # 5 minutes
ALGORITHM_TIMEOUT=10000     # 10 secondes
```

### Mode serveur vs client

Les algorithmes sont strictement côté serveur pour :

- **Sécurité** : Protection des clés API
- **Performance** : Éviter la latence réseau
- **Ressources** : Modèles ML volumineux
- **Cohérence** : Environnement d'exécution contrôlé

```typescript
// Vérification serveur-only dans les algorithmes
if (typeof window !== "undefined") {
  throw new Error("OpenAIXClassifier est server-only");
}
```

### Auto-initialisation

```typescript
// algorithms/level1/shared/initializeAlgorithms.ts
if (typeof window === "undefined") {
  initializeAlgorithms(); // Auto-init côté serveur
}
```

## Bonnes pratiques

### 1. Implémentation d'un nouvel algorithme

```typescript
// 1. Implémenter BaseAlgorithm<TInput, TOutput>
export class MyNewAlgorithm implements BaseAlgorithm<string, MyResult> {
  describe(): AlgorithmMetadata {
    return {
      name: "MyNewAlgorithm",
      displayName: "Mon Algorithme - X",
      type: "rule-based", // ou "ml" | "llm"
      target: "X",
      version: "1.0.0",
      description: "Description fonctionnelle",
      batchSupported: true,
      apiRequirements: [], // ou ["SOME_API_KEY"]
    };
  }

  validateConfig(): boolean {
    // Vérifier les prérequis (clés API, modèles, etc.)
    return true;
  }

  async run(input: string): Promise<MyResult> {
    // Logique principale
    return {
      prediction: "SOME_CATEGORY",
      confidence: 0.85,
      metadata: { method: "my-method" },
    };
  }

  async runBatch(inputs: string[]): Promise<MyResult[]> {
    // Optimisation batch ou fallback individuel
    return Promise.all(inputs.map((i) => this.run(i)));
  }
}

// 2. Enregistrer dans initializeAlgorithms()
algorithmRegistry.register("MyNewAlgorithm", new MyNewAlgorithm());
```

### 2. Gestion des erreurs et fallbacks

```typescript
async run(input: string): Promise<Result> {
  try {
    const result = await this.performAnalysis(input);
    return {
      prediction: result.category,
      confidence: result.confidence,
      metadata: { method: "primary" }
    };
  } catch (error) {
    // Fallback gracieux
    return {
      prediction: "UNKNOWN",
      confidence: 0.0,
      metadata: {
        error: error.message,
        method: "fallback"
      }
    };
  }
}
```

### 3. Configuration flexible

```typescript
interface AlgorithmConfig {
  threshold?: number;
  timeout?: number;
  enableCache?: boolean;
}

export class ConfigurableAlgorithm {
  private config: Required<AlgorithmConfig>;

  constructor(config: AlgorithmConfig = {}) {
    this.config = {
      threshold: 0.5,
      timeout: 5000,
      enableCache: true,
      ...config,
    };
  }

  updateConfig(newConfig: Partial<AlgorithmConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AlgorithmConfig {
    return { ...this.config };
  }
}
```

## Extensions futures

### 1. Métriques avancées

- **M4** : Complexité syntaxique (longueur phrases, subordination)
- **M5** : Richesse lexicale (diversité vocabulaire, registre)
- **M6** : Marqueurs prosodiques (f0, intensité, débit)

### 2. Algorithmes hybrides

- **Ensemble methods** : Fusion de plusieurs classificateurs
- **Multi-modal** : Intégration audio + texte
- **Temporal** : Analyse séquentielle multi-tours

### 3. Optimisations performance

- **Caching intelligent** : Cache basé sur signature de contenu
- **Batch processing** : Optimisation des traitements groupés
- **Parallel execution** : Exécution parallèle des algorithmes indépendants

---

Cette documentation constitue le référentiel technique pour comprendre, maintenir et étendre l'AlgorithmLab de TaggerLPL. La branche `algorithms` matérialise ainsi les fondements théoriques de la thèse en outils opérationnels d'analyse conversationnelle.
