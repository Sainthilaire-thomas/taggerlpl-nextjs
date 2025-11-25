
# TaggerLPL NextJS - Contexte de base

*Généré le 2025-01-24*

## Vue d'ensemble

**Projet** : TaggerLPL - Application d'analyse conversationnelle pour recherche doctorale

**Description** : Système de tagging et d'analyse de transcriptions d'appels de centres d'appels, permettant de valider des hypothèses scientifiques sur l'influence des stratégies conversationnelles des conseillers sur les réactions clients.

**Stack technique** :

* Framework : Next.js 14+ (App Router)
* Langage : TypeScript (strict mode)
* Base de données : Supabase (PostgreSQL)
* UI : React + Material-UI (MUI v6)
* Authentification : Supabase Auth

## Architecture globale - 3 Phases de recherche

```
PHASE 1: Gestion Corpus      →  PHASE 2: Annotation         →  PHASE 3: Analyse Scientifique
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ • Import appels         │     │ • TranscriptLPL         │     │ • Level 0: Gold Standard│
│ • Transcription ASR     │     │ • Tagging manuel        │     │ • Level 1: Validation   │
│ • Diarization           │     │ • Supervision tags      │     │ • Level 2: Hypothèses   │
│ • WorkDrive Explorer    │     │ • Relations turns       │     │ • Statistiques H1/H2    │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

## Structure Phase 3 - Analysis

### Level 1 : Validation Algorithmique

**Chemin** : `src/features/phase3-analysis/level1-validation/`

```
level1-validation/
├── algorithms/
│   ├── client/                    # Algorithmes universels
│   │   ├── RegexXClassifier.ts    # X rule-based
│   │   ├── OpenAIXClassifier.ts   # X LLM (gpt-4o)
│   │   ├── OpenAI3TXClassifier.ts # X LLM contextuel (3 tours)
│   │   ├── SpacyXClassifier.ts    # X ML
│   │   └── RegexYClassifier.ts    # Y rule-based (client)
│   ├── conseiller/                # Legacy classifiers
│   ├── mediators/
│   │   ├── M1Algorithms/          # Densité verbes d'action
│   │   ├── M2Algorithms/          # Alignement lexical/sémantique
│   │   └── M3Algorithms/          # Charge cognitive (pauses)
│   └── shared/
│       ├── AlgorithmRegistry.ts   # Registre centralisé
│       ├── BaseAlgorithm.ts       # Interface universelle
│       └── initializeAlgorithms.ts
│
├── ui/
│   ├── components/
│   │   ├── AlgorithmLab/
│   │   │   ├── Level1Interface.tsx    # Interface principale
│   │   │   ├── RunPanel.tsx           # Lancement tests
│   │   │   ├── MetricsPanel.tsx       # Affichage métriques
│   │   │   └── ResultsSample/         # Tableau résultats
│   │   ├── algorithms/
│   │   │   ├── shared/BaseAlgorithmTesting.tsx  # Composant générique
│   │   │   ├── XClassifiers/XValidationInterface.tsx
│   │   │   ├── YClassifiers/YValidationInterface.tsx
│   │   │   ├── M1Calculators/M1ValidationInterface.tsx
│   │   │   ├── M2Calculators/M2ValidationInterface.tsx
│   │   │   └── M3Calculators/M3ValidationInterface.tsx
│   │   └── shared/
│   │       ├── AlgorithmSelector.tsx
│   │       ├── VersionSelector.tsx
│   │       └── VersionComparator.tsx
│   └── hooks/
│       ├── useLevel1Testing.ts        # Hook principal validation
│       ├── useAnalysisPairs.ts        # Chargement analysis_pairs
│       ├── useAlgorithmVersioning.ts  # Gestion versions
│       └── normalizeUniversalToTV.ts  # Normalisation résultats
```

### Level 2 : Validation Hypothèses

**Chemin** : `src/features/phase3-analysis/level2-hypotheses/`

```
level2-hypotheses/
├── config/
│   └── hypotheses.ts              # ⭐ Seuils H1 (3 modes: STRICT/REALISTIC/EMPIRICAL)
│
├── h1/                            # Hypothèse H1 (X → Y)
├── h2/                            # Hypothèse H2 (médiation)
├── h2-mediation/
│   ├── hooks/useH2MediationData.ts
│   └── statistics/domain/services/
│       ├── H2MediationService.ts      # Baron-Kenny, Sobel Test
│       ├── H2DescriptiveStatsService.ts
│       └── H2PathAnalysisService.ts
│
├── statistics/domain/services/
│   ├── H1StatisticsService.ts         # Chi², V de Cramér
│   ├── H1StrategyAnalysisService.ts
│   └── H1TagAnalysisService.ts
│
├── hooks/
│   ├── useLevel2Data.ts               # Chargement données Level 2
│   └── useH1Analysis.ts
│
├── ui/components/
│   ├── Level2Interface.tsx            # ⭐ Interface principale H1
│   ├── StatisticalTestsPanel.tsx
│   ├── StatisticalSummary.tsx
│   ├── H2AlignmentValidation.tsx
│   └── H3ApplicationValidation.tsx
│
└── utils/
    ├── stats.ts                       # ⭐ Calculs H1 (Chi², Fisher, ANOVA)
    └── DataProcessing.ts
```

---

## Types fondamentaux

### AnalysisPair (table analysis_pairs - 901 paires)

```typescript
interface AnalysisPair {
  pair_id: number;
  call_id: string;
  
  // Gold Standard (annotations manuelles)
  strategy_tag: string;      // Variable X
  reaction_tag: string;      // Variable Y
  strategy_family: string;
  
  // Verbatims
  conseiller_verbatim: string;
  client_verbatim: string;
  
  // Contexte étendu
  prev1_verbatim?: string;
  next1_verbatim?: string;
  
  // Résultats algorithmes
  x_predicted_tag?: string;
  x_confidence?: number;
  x_algorithm_key?: string;
  
  y_predicted_tag?: string;
  y_confidence?: number;
  
  // Médiateurs
  m1_verb_density?: number;
  m1_verb_count?: number;
  m2_lexical_alignment?: number;
  m2_global_alignment?: number;
  m3_cognitive_score?: number;
  m3_hesitation_count?: number;
}
```

### Variables de thèse

```typescript
type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

type XTag = "ENGAGEMENT" | "EXPLICATION" | "REFLET_ACQ" | "REFLET_JE" | "REFLET_VOUS" | "OUVERTURE";
type YTag = "CLIENT_POSITIF" | "CLIENT_NEGATIF" | "CLIENT_NEUTRE";
```

---

## Seuils de validation H1 (config/hypotheses.ts)

### Mode REALISTIC (par défaut)

```typescript
const REALISTIC_H1_THRESHOLDS = {
  actions: {
    minPositiveRate: 35.0,   // ENGAGEMENT+OUVERTURE ≥ 35% positif
    maxNegativeRate: 30.0,   // ENGAGEMENT+OUVERTURE ≤ 30% négatif
  },
  explanations: {
    maxPositiveRate: 10.0,   // EXPLICATION ≤ 10% positif
    minNegativeRate: 60.0,   // EXPLICATION ≥ 60% négatif
  },
  empirical: {
    minDifference: 20.0,     // Écart Actions-Explications ≥ 20 pts
    substantialThreshold: 35.0,
  },
  statistical: {
    alphaLevel: 0.05,        // p < 0.05
    cramersVThreshold: 0.25, // V > 0.25 effet fort
    cramersVModerate: 0.15,  // V > 0.15 effet modéré
  },
  validation: {
    minScoreForValidated: 4, // 4/6 critères pour VALIDATED
    minScoreForPartial: 2,   // 2/6 pour PARTIALLY_VALIDATED
    maxCriteria: 6,
  },
};
```

### Critères H1 évalués (6 critères)

1. **Actions → Positif** : taux positif ≥ seuil
2. **Actions → Négatif** : taux négatif ≤ seuil
3. **Explications → Positif** : taux positif ≤ seuil
4. **Explications → Négatif** : taux négatif ≥ seuil
5. **Écart Empirique** : différence ≥ seuil
6. **Significativité Stats** : p < alpha ET V ≥ seuil

---

## Services statistiques

### H1StatisticsService

```typescript
class H1StatisticsService {
  static calculateChiSquare(observed, expected): { chiSquare, df, pValue }
  static calculateCramersV(chiSquare, n, rows, cols): number
  static calculateExpectedFrequencies(observed): number[][]
  static interpretCramersV(v): string  // 'Très faible'|'Faible'|'Moyenne'|'Forte'
}
```

### H2MediationService (Baron-Kenny)

```typescript
interface MediationPath {
  mediator: 'M1' | 'M2' | 'M3';
  a: number;           // X → M
  b: number;           // M → Y
  c: number;           // X → Y (effet total)
  cPrime: number;      // X → Y (effet direct)
  indirectEffect: number;  // a × b
  sobelZ: number;
  sobelP: number;
  mediationType: 'full' | 'partial' | 'none';
}
```

---

## Algorithmes disponibles (10)

| Algorithme                     | Cible | Type       | Description                  |
| ------------------------------ | ----- | ---------- | ---------------------------- |
| RegexXClassifier               | X     | rule-based | Patterns regex conseiller    |
| SpacyXClassifier               | X     | ml         | Classification spaCy         |
| OpenAIXClassifier              | X     | llm        | GPT-4o classification        |
| OpenAI3TXClassifier            | X     | llm        | GPT-4o avec contexte 3 tours |
| RegexYClassifier               | Y     | rule-based | Dictionnaires client         |
| M1ActionVerbCounter            | M1    | metric     | Densité verbes d'action     |
| M2LexicalAlignmentCalculator   | M2    | rule-based | Jaccard tokens               |
| M2SemanticAlignmentCalculator  | M2    | rule-based | Patterns sémantiques        |
| M2CompositeAlignmentCalculator | M2    | hybrid     | Fusion lex+sém              |
| PausesM3Calculator             | M3    | metric     | Hésitations, pauses         |

---

## Flux de données Level 1 → Level 2

```
┌─────────────────────────────────────────────────────────────────┐
│                         LEVEL 1                                  │
├─────────────────────────────────────────────────────────────────┤
│  useLevel1Testing.validateAlgorithm(algorithmName, sampleSize)  │
│       ↓                                                          │
│  TVValidationResult[] (prediction, goldStandard, correct, ...)  │
│       ↓                                                          │
│  updateH2WithResults() → UPDATE analysis_pairs (BULK RPC)       │
│       ↓                                                          │
│  calculateMetrics() → accuracy, F1, kappa, confusion matrix     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         LEVEL 2                                  │
├─────────────────────────────────────────────────────────────────┤
│  useLevel2Data() → lecture analysis_pairs avec X/Y/M1/M2/M3     │
│       ↓                                                          │
│  computeH1Analysis() → H1StrategyData[] par stratégie           │
│       ↓                                                          │
│  summarizeH1() → validation critères + Chi² + Fisher + ANOVA    │
│       ↓                                                          │
│  H2MediationService.analyzeH2Mediation() → paths médiation      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Commandes utiles

```powershell
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Compter les erreurs
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object

# Build production
npm run build

# Explorer Level 1
Get-ChildItem -Path ".\src\features\phase3-analysis\level1-validation" -Recurse -Name

# Explorer Level 2
Get-ChildItem -Path ".\src\features\phase3-analysis\level2-hypotheses" -Recurse -Name
```

---

*Dernière mise à jour : 2025-01-24*
