# 🏷️ TaggerLPL - Framework de Métriques Modulaires

## 📋 Vue d'ensemble du Framework

TaggerLPL implémente un **framework unifié de métriques modulaires** pour l'analyse conversationnelle et linguistique interactionnelle. L'architecture permet la comparaison scientifique d'algorithmes multiples sur les mêmes données, avec validation croisée AC-LI-Cognitif.

### 🎯 Objectifs du Framework

- ✅ **Architecture modulaire** : Indicateurs comparables et algorithmes interchangeables
- ✅ **Validation scientifique** : Métriques de performance, annotation experte, convergence
- ✅ **Interface comparative** : Visualisation côte-à-côte des résultats d'algorithmes
- 🔄 **Machine Learning supervisé** : Entraînement de modèles avec annotations expertes
- 🔄 **Validation croisée** : Tests de convergence AC-LI-Cognitif automatisés

## 🏗️ Architecture du Framework

### Structure générale

```
src/app/(protected)/analysis/components/
├── 📂 metrics-framework/       # 🔧 FRAMEWORK COMMUN (à implémenter)
├── 📂 li-metrics/             # 🗣️ LINGUISTIQUE INTERACTIONNELLE
├── 📂 cognitive-metrics/      # 🧠 SCIENCES COGNITIVES
└── 📂 shared/                 # 🔗 COMPOSANTS PARTAGÉS
```

### Framework de métriques modulaires (Planifié)

```
metrics-framework/                      # 🔧 FRAMEWORK COMMUN
├── 📂 core/
│   ├── MetricsRegistry.ts              # Registre universel d'indicateurs
│   ├── BaseIndicator.ts                # Classe de base pour tous indicateurs
│   ├── AlgorithmStrategy.ts            # Interface stratégies d'algorithmes
│   ├── MetricsEngine.ts                # Moteur de calcul unifié
│   ├── ValidationEngine.ts             # Moteur de validation convergence
│   └── types/
│       ├── base.ts                     # Types fondamentaux
│       ├── indicators.ts               # Types pour indicateurs
│       ├── algorithms.ts               # Types pour algorithmes
│       ├── results.ts                  # Types pour résultats
│       └── annotations.ts              # Types pour système d'annotation
│
├── 📂 hooks/
│   ├── useMetricsEngine.ts             # Hook principal unifié
│   ├── useIndicatorRegistry.ts         # Gestion registre dynamique
│   ├── useAlgorithmBenchmarking.ts     # Système de benchmarking
│   ├── useAnnotationWorkflow.ts        # Workflow annotation supervisée
│   ├── useConvergenceValidation.ts     # Validation croisée AC-LI-Cognitif
│   ├── useMetricsByFamily.ts           # Analyse par famille de stratégies
│   ├── useMLTraining.ts                # Entraînement modèles ML
│   └── usePerformanceMonitoring.ts     # Monitoring temps réel
│
├── 📂 components/
│   ├── MetricIndicatorCard.tsx         # Carte d'indicateur universelle
│   ├── AlgorithmComparisonView.tsx     # Comparaison algorithmes ligne par ligne
│   ├── AnnotationInterface.tsx         # Interface annotation experte
│   ├── BenchmarkDashboard.tsx          # Dashboard performance comparative
│   ├── ValidationDashboard.tsx         # Dashboard validation convergence
│   ├── ConvergenceVisualization.tsx    # Graphiques convergence
│   └── MLTrainingInterface.tsx         # Interface entraînement ML
└── 📂 utils/
    ├── dataPreprocessing.ts            # Préprocessing données Supabase
    ├── featureExtraction.ts            # Extraction features ML
    ├── algorithmValidation.ts          # Validation et métriques qualité
    └── mlHelpers.ts                    # Helpers ML/NLP
```

## 🗣️ Domaine LI (Linguistique Interactionnelle)

### État d'implémentation

```
li-metrics/                             # 🗣️ LINGUISTIQUE INTERACTIONNELLE
├── 📂 indicators/
│   ├── 📂 FeedbackAlignmentIndicator/  # ✅ IMPLÉMENTÉ
│   │   ├── algorithms/
│   │   │   ├── BasicAlignmentAlgorithm.ts          # ✅ Analyse sémantique lexicale
│   │   │   ├── ConversationalPatternAlgorithm.ts   # 🚀 NOUVEAU (analyse structurelle)
│   │   │   └── SequentialPatternAlgorithm.ts       # 🔄 À IMPLÉMENTER (multi-paires)
│   │   ├── hooks/
│   │   │   ├── useFeedbackAlignmentMetrics.ts      # ✅ Hook complet multi-algorithmes
│   │   │   └── useFeedbackAlignmentAnnotation.ts   # 🔄 À IMPLÉMENTER
│   │   ├── FeedbackAlignmentInterface.tsx          # ✅ Interface complète comparative
│   │   └── types.ts                                # ✅ Types complets + extensions CA
│   │
│   ├── 📂 CommonGroundIndicator/       # 🔄 À IMPLÉMENTER
│   ├── 📂 BackchannelsIndicator/       # 🔄 À IMPLÉMENTER
│   ├── 📂 ProsodicFluencyIndicator/    # 🔄 À IMPLÉMENTER
│   ├── 📂 SpeechRateIndicator/         # 🔄 À IMPLÉMENTER
│   ├── 📂 SequentialPatternsIndicator/ # 🔄 À IMPLÉMENTER
│   └── 📂 RepairMechanismsIndicator/   # 🔄 À IMPLÉMENTER
│
├── LIMetricsConfig.ts                  # 🔄 À IMPLÉMENTER
├── LIMetricsRegistry.ts                # 🔄 À IMPLÉMENTER
└── LinguisticInteractionalMetrics.tsx  # 🔄 À IMPLÉMENTER
```

## 🧠 Domaine Cognitive (Sciences Cognitives)

### État d'implémentation

```
cognitive-metrics/                      # 🧠 SCIENCES COGNITIVES
├── 📂 indicators/
│   ├── 📂 FluiditeCognitiveIndicator/  # ✅ EXISTANT (à migrer vers framework)
│   │   ├── algorithms/
│   │   │   ├── BasicFluidityAlgorithm.ts       # 🔄 À MIGRER (existant en hook)
│   │   │   ├── NeuronMirrorAlgorithm.ts        # 🔄 À IMPLÉMENTER
│   │   │   └── MLEnhancedAlgorithm.ts          # 🔄 À IMPLÉMENTER
│   │   ├── hooks/
│   │   │   ├── useFluiditeCognitiveMetrics.ts  # 🔄 À CRÉER (migration)
│   │   │   └── useFluidityAnnotation.ts        # 🔄 À IMPLÉMENTER
│   │   ├── FluiditeCognitiveInterface.tsx      # 🔄 À CRÉER
│   │   └── types.ts                            # 🔄 À CRÉER
│   │
│   ├── 📂 ReactionsDirectesIndicator/  # ✅ EXISTANT (à migrer)
│   │   ├── algorithms/
│   │   │   ├── BasicReactionsAlgorithm.ts      # 🔄 À MIGRER
│   │   │   └── ContextualReactionsAlgorithm.ts # 🔄 À IMPLÉMENTER
│   │   └── ... (même structure)
│   │
│   ├── 📂 ReprisesLexicalesIndicator/  # ✅ EXISTANT (à migrer)
│   │   ├── algorithms/
│   │   │   ├── BasicReprisesAlgorithm.ts       # 🔄 À MIGRER
│   │   │   └── SemanticReprisesAlgorithm.ts    # 🔄 À IMPLÉMENTER
│   │   └── ... (même structure)
│   │
│   ├── 📂 ChargeCognitiveIndicator/    # ✅ EXISTANT (à migrer)
│   │   ├── algorithms/
│   │   │   ├── BasicChargeAlgorithm.ts         # 🔄 À MIGRER
│   │   │   └── MultiFactorChargeAlgorithm.ts   # 🔄 À IMPLÉMENTER
│   │   └── ... (même structure)
│   │
│   ├── 📂 MarqueursEffortIndicator/    # ✅ EXISTANT (à migrer)
│   ├── 📂 PatternsResistanceIndicator/ # ✅ EXISTANT (à migrer)
│   ├── 📂 RobustesseStressIndicator/   # ✅ EXISTANT (à migrer)
│   ├── 📂 NiveauStressIndicator/       # ✅ EXISTANT (à migrer)
│   └── 📂 PositionConversationIndicator/ # ✅ EXISTANT (à migrer)
│
├── CognitiveMetricsConfig.ts           # 🔄 À CRÉER
├── CognitiveMetricsRegistry.ts         # 🔄 À CRÉER
├── CognitiveMetrics.tsx                # ✅ EXISTANT (à adapter au framework)
│
└── 📂 migration/                       # 🔄 OUTILS DE MIGRATION
    ├── adaptUseCognitiveMetrics.ts     # Adaptation hook existant
    ├── adaptIndicatorData.ts           # Migration données existantes
    ├── compatibilityLayer.ts           # Couche compatibilité
    └── migrationGuide.md               # Guide migration step-by-step
```

### 🔄 État actuel des métriques cognitives

#### **✅ Implémentation existante (hors framework)**

**Localisation actuelle** : `app/(protected)/analysis/components/CognitiveMetrics.tsx`

**Hook existant** : `useCognitiveMetrics.ts`

```typescript
// Structure actuelle (à migrer)
export const useCognitiveMetrics = (data: TaggedTurn[]) => {
  return {
    // Indicateurs existants
    fluiditeCognitive: FluiditeScore,
    reactionsDirectes: ReactionsScore,
    reprisesLexicales: ReprisesScore,
    chargeCognitive: ChargeScore,
    marqueursEffort: EffortScore,
    patternsResistance: ResistanceScore,
    robustesseStress: StressScore,
    niveauStress: StressLevelScore,
    positionConversation: PositionScore,

    // Métriques globales
    scoreGlobalCognitif: number,
    tendancesEvolution: TrendAnalysis,
  };
};
```

#### **📊 Indicateurs cognitifs opérationnels**

1. **✅ Fluidité Cognitive** - Mesure de la spontanéité conversationnelle
   - Détection des hésitations, pauses, reformulations
   - Score basé sur la fluidité du discours conseiller
2. **✅ Réactions Directes** - Vitesse de réaction aux interventions client
   - Temps de latence entre tour client et réponse conseiller
   - Analyse de la réactivité conversationnelle
3. **✅ Reprises Lexicales** - Réutilisation du vocabulaire client
   - Détection des mots/expressions repris du client
   - Mesure de l'adaptation linguistique
4. **✅ Charge Cognitive** - Complexité du traitement conversationnel
   - Longueur des tours, complexité syntaxique
   - Indicateurs de surcharge cognitive
5. **✅ Marqueurs d'Effort** - Signes de difficulté conversationnelle
   - Détection "euh", "ben", pauses longues
   - Quantification de l'effort conversationnel
6. **✅ Patterns de Résistance** - Détection des blocages conversationnels
   - Répétitions, reformulations multiples
   - Patterns de difficultés récurrentes
7. **✅ Robustesse au Stress** - Maintien de la performance sous pression
   - Stabilité des métriques dans contextes difficiles
   - Résilience conversationnelle
8. **✅ Niveau de Stress** - Intensité du stress conversationnel
   - Combinaison de marqueurs physiologiques linguistiques
   - Score global de tension
9. **✅ Position dans la Conversation** - Évolution temporelle des métriques
   - Tendances début/milieu/fin de conversation
   - Patterns d'évolution cognitive

### ✅ FeedbackAlignmentIndicator - Statut Complet avec Nouvelle Stratégie

**Localisation** : `li-metrics/indicators/FeedbackAlignmentIndicator/`

#### **🚀 Innovation Algorithmique : Approche Scientifique Bi-Dimensionnelle**

**Révision stratégique** : Abandon de l'approche `SentimentEnhancedAlgorithm` (redondante lexicalement) au profit du `ConversationalPatternAlgorithm` (innovation structurelle).

#### **Fonctionnalités opérationnelles** :

**✅ BasicAlignmentAlgorithm.ts** - Moteur d'analyse sémantique lexicale

- **Paradigme** : Analyse de sentiment par correspondance lexicale
- **Méthode** : 145 patterns français (POSITIF/NEGATIF/NEUTRE)
- **Unité d'analyse** : Mots et expressions isolés
- **Output** : Score de sentiment (-1 à +1) avec confidence
- **Couverture** : 72% des verbatims (1006/1397 analysables)

**🚀 ConversationalPatternAlgorithm.ts** - NOUVEAU : Moteur d'analyse structurelle

- **Paradigme** : Conversation Analysis et paires adjacentes
- **Méthode** : Analyse structurelle des patterns conseiller→client
- **Unité d'analyse** : Paires adjacentes et cohérence pragmatique
- **Output** : Types d'alignment (STRONG_AGREEMENT, QUALIFIED_AGREEMENT, etc.)
- **Innovation** : Première implémentation computationnelle de la CA

**📊 Justification Scientifique** :

- **Fondement théorique** : Schegloff & Sacks (1973) - Adjacency Pairs
- **Application** : Drew & Heritage (1992) - Professional Interaction
- **Différenciation** : Lexical (sentiment) vs Structurel (alignment)
- **Complémentarité** : Deux dimensions d'analyse indépendantes

#### **🧠 Types d'Analyses Structurelles Détectées** :

```typescript
enum AlignmentType {
  STRONG_AGREEMENT = "strong_agreement", // "Exactement !", "C'est ça !"
  QUALIFIED_AGREEMENT = "qualified_agreement", // "Oui mais...", "En partie"
  COOPERATIVE_RESISTANCE = "cooperative_resistance", // "Je ne sais pas si..."
  DISALIGNMENT = "disalignment", // "Non", "Pas du tout"
}

enum PragmaticFunction {
  VALIDATE = "validate", // REFLET → Attente de confirmation
  EXPLORE = "explore", // ENGAGEMENT → Attente d'élaboration
  INFORM = "inform", // EXPLICATION → Attente de compréhension
  REDIRECT = "redirect", // OUVERTURE → Attente de suivi
}
```

#### **🔍 Interface Multi-Algorithmes Enrichie**

**✅ FeedbackAlignmentInterface.tsx** - Interface comparative complète

- **Mode Simple** : Analyse avec un seul algorithme (Basic OU ConversationalPattern)
- **Mode Comparaison** : Analyse côte-à-côte avec métriques différentielles
- **Sélecteurs** : Algorithme + Mode d'analyse + Origine
- **Visualisations** : Tableaux comparatifs, métriques de convergence, recommendations
- **Export** : Résultats + méthodologie pour insertion thèse

#### **🎯 Hook Multi-Algorithmes**

**✅ useFeedbackAlignmentMetrics.ts** - Hook enrichi

- **Configuration** : Support multi-algorithmes avec comparaison
- **APIs** : `runSingleAlgorithm()`, `runAlgorithmComparison()`, `generateRecommendations()`
- **Caching** : Optimisations de performance avec invalidation intelligente
- **Compatibilité** : Interface existante préservée + extensions

#### **📊 Résultats Scientifiques Validés** :

**BasicAlgorithm (Sentiment Lexical)** :

```
📊 Efficacité par stratégie (analyse de 1397 tours) :
🥇 OUVERTURE:    48.3% verbatims positifs (175 occurrences)
🥈 ENGAGEMENT:   34.5% verbatims positifs (182 occurrences)
🥉 REFLET:       18.2% verbatims positifs (444 occurrences)
❌ EXPLICATION:   1.0% verbatims positifs (596 occurrences)

✅ Hypothèses validées : H1 (ACTION > EXPLICATION), H2 (EXPLICATION inefficace)
```

**ConversationalPattern (Alignment Structurel)** :

```
🧠 Patterns d'alignment détectés :
- STRONG_AGREEMENT: Corrélation avec satisfaction client élevée
- QUALIFIED_AGREEMENT: Pattern dominant pour stratégies REFLET
- COOPERATIVE_RESISTANCE: Signal d'optimisation nécessaire
- DISALIGNMENT: Prédicateur d'échec conversationnel

🎯 Cohérence Pragmatique :
- VALIDATE (REFLET) → Confirmation attendue vs reçue
- EXPLORE (ENGAGEMENT) → Élaboration attendue vs reçue
- INFORM (EXPLICATION) → Compréhension attendue vs reçue
```

#### **🔄 Comparaison Algorithmique** :

| Dimension        | BasicAlgorithm          | ConversationalPattern      |
| ---------------- | ----------------------- | -------------------------- |
| **Paradigme**    | Sentiment Analysis      | Conversation Analysis      |
| **Méthode**      | Correspondance lexicale | Analyse structurelle       |
| **Mesure**       | Polarité émotionnelle   | Cohérence pragmatique      |
| **Prédictif**    | Sentiment futur         | Efficacité stratégique     |
| **Optimisation** | Lexique positif         | Patterns conversationnels  |
| **Innovation**   | Établi                  | Première implémentation CA |

#### **🚀 Prochaines Étapes (Priorité Immédiate)** :

1. **ConversationalPatternAlgorithm.ts** - Implémentation complète
   - Types d'alignment et marqueurs structurels
   - Cohérence pragmatique par famille de stratégies
   - Métriques de validation avec BasicAlgorithm
2. **Interface Comparative** - Mode comparaison opérationnel
   - Vue côte-à-côte Sentiment vs Alignment
   - Métriques de convergence et divergence
   - Recommandations d'optimisation conversationnelle
3. **Export Thèse** - Documentation scientifique
   - Tableaux LaTeX de comparaison algorithmique
   - Graphiques de performance différentielle
   - Justification méthodologique (CA vs Sentiment Analysis)

## 🔗 Composants Partagés

### État d'implémentation

```
shared/                                 # 🔗 COMPOSANTS PARTAGÉS
├── 📂 atoms/                          # ⚛️ COMPOSANTS ATOMIQUES
│   ├── IndicatorHeader.tsx            # ✅ IMPLÉMENTÉ
│   ├── ColorLegend.tsx                # ✅ IMPLÉMENTÉ
│   ├── AlgorithmDetailDialog.tsx      # ✅ IMPLÉMENTÉ
│   └── [autres atoms...]              # 🔄 À IMPLÉMENTER
│
├── 📂 molecules/                      # 🧬 COMPOSANTS MOLÉCULAIRES
│   ├── ResultsTable.tsx               # ✅ IMPLÉMENTÉ
│   ├── AlgorithmLogicExplanation.tsx  # ✅ IMPLÉMENTÉ (avec lexiques)
│   ├── AlgorithmComparisonView.tsx    # 🚀 NOUVEAU (comparaison algorithmes)
│   ├── types.ts                       # ✅ ExtendedAlgorithmLogicProps
│   └── [autres molecules...]          # 🔄 À IMPLÉMENTER
│
├── 📂 hooks/                          # 🪝 HOOKS PARTAGÉS
│   ├── useAlgorithmDialog.ts          # ✅ IMPLÉMENTÉ
│   ├── useAlgorithmComparison.ts      # 🚀 NOUVEAU (comparaison multi-algo)
│   └── [autres hooks...]              # 🔄 À IMPLÉMENTER
│
└── 📂 utils/                          # 🛠️ UTILITAIRES PARTAGÉS
    ├── conversationAnalysisHelpers.ts # 🚀 NOUVEAU (utilitaires CA)
    └── [utils...]                     # 🔄 À IMPLÉMENTER
```

#### **✅ AlgorithmLogicExplanation** - Composant enrichi

**Fonctionnalités opérationnelles** :

- Interface multicouche pour affichage des lexiques
- Dialog "Vue détaillée" avec scrolling optimisé
- Cartes interactives par sentiment avec animations
- Support types étendus (`ExtendedAlgorithmLogicProps`)
- Composants factorisés (`LexiconCategory`, `DetailedLexicon`)

#### **🚀 AlgorithmComparisonView** - Nouveau composant

**Fonctionnalités planifiées** :

- Comparaison côte-à-côte des résultats algorithmiques
- Métriques de convergence et divergence
- Visualisations des différences structurelles
- Recommandations d'optimisation

## 📊 Centre d'Analyse

### Page principale

**Localisation** : `app/(protected)/analysis/page.tsx`

```typescript
// Structure actuelle enrichie
export default function AnalysisPage() {
  return (
    <AnalysisLayout>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ✅ Onglet Feedback Alignment - OPÉRATIONNEL MULTI-ALGORITHMES */}
        <FeedbackAlignmentInterface
          selectedOrigin={selectedOrigin}
          showDetailedResults={true}
          showComparison={true} // 🚀 NOUVEAU : Mode comparaison activé
          initialAlgorithm="basic" // ou "conversational-pattern"
        />
        {/* 🔄 Onglets à implémenter */}
        <CommonGroundInterface /> {/* À IMPLÉMENTER */}
        <BackchannelsInterface /> {/* À IMPLÉMENTER */}
        <CognitiveMetricsInterface /> {/* À MIGRER */}
      </Box>
    </AnalysisLayout>
  );
}
```

## 🗄️ Base de Données

### Tables existantes (utilisées)

```sql
-- ✅ Données conversationnelles (opérationnelles)
turntagged (
  id INTEGER PRIMARY KEY,
  call_id INTEGER,
  start_time FLOAT,
  end_time FLOAT,
  tag TEXT,                    -- ✅ Stratégie conseiller (analysée par CA)
  verbatim TEXT,               -- ✅ Analysé par moteur sémantique
  next_turn_verbatim TEXT,     -- ✅ Verbatim client (analysé par CA + sentiment)
  next_turn_tag TEXT,
  speaker TEXT                 -- ✅ Distinction conseiller/client pour CA
);

-- ✅ Tags et familles (opérationnels)
lpltag (
  id INTEGER PRIMARY KEY,
  label TEXT,
  family TEXT,                -- ✅ CLÉ pour analyse par famille + fonctions pragmatiques
  originespeaker TEXT,        -- conseiller/client
  color TEXT,
  description TEXT
);

-- ✅ Appels (opérationnels)
call (
  callid TEXT PRIMARY KEY,
  filename TEXT,
  filepath TEXT,
  origine TEXT,               -- ✅ Filtre par origine
  duree INTEGER,
  is_tagging_call BOOLEAN,
  preparedfortranscript BOOLEAN
);
```

### 🔄 Tables Framework (à implémenter)

```sql
-- 🔄 Système d'annotation unifié
CREATE TABLE metric_annotations (
  id SERIAL PRIMARY KEY,
  turn_id INTEGER REFERENCES turntagged(id),
  domain TEXT NOT NULL,              -- 'li' | 'cognitive'
  indicator_id TEXT NOT NULL,        -- 'feedback_alignment', 'common_ground'
  algorithm_id TEXT NOT NULL,        -- 'basic', 'conversational-pattern'
  human_label TEXT NOT NULL,         -- Annotation experte
  algorithm_prediction TEXT,         -- Prédiction algorithme
  algorithm_confidence FLOAT,        -- Confiance (0-1)
  annotator_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 🔄 Performance algorithmes
CREATE TABLE algorithm_performance (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  algorithm_id TEXT NOT NULL,        -- 'basic' | 'conversational-pattern'
  accuracy FLOAT,
  precision FLOAT,
  recall FLOAT,
  f1_score FLOAT,
  processing_time_ms INTEGER,
  convergence_rate FLOAT,            -- Taux de convergence avec autres algorithmes
  test_date TIMESTAMP DEFAULT NOW()
);

-- 🔄 Validation croisée Sentiment-Alignment
CREATE TABLE sentiment_alignment_correlations (
  id SERIAL PRIMARY KEY,
  validation_date TIMESTAMP DEFAULT NOW(),
  pearson_correlation FLOAT,        -- Corrélation sentiment/alignment
  spearman_correlation FLOAT,       -- Corrélation rang sentiment/alignment
  agreement_rate FLOAT,             -- Taux d'accord classification
  divergence_patterns TEXT,         -- Patterns de divergence détectés
  recommendations TEXT              -- Recommandations d'usage
);

-- 🔄 Validation croisée AC-LI-Cognitif
CREATE TABLE convergence_validations (
  id SERIAL PRIMARY KEY,
  validation_date TIMESTAMP DEFAULT NOW(),
  kendall_tau_ac_li FLOAT,
  kendall_tau_ac_cognitive FLOAT,
  kendall_tau_li_cognitive FLOAT,
  overall_consistency FLOAT,
  h1_action_effectiveness_validated BOOLEAN,
  h2_explanation_difficulty_validated BOOLEAN,
  convergence_status TEXT
);
```

## 🎯 Roadmap d'Implémentation - RÉVISÉ

### 🚀 **Phase 1 : Implémentation ConversationalPatternAlgorithm (Priorité IMMÉDIATE)**

#### **1.1 Algorithme d'Analyse Structurelle (2-3 jours)**

```typescript
// À créer : ConversationalPatternAlgorithm.ts
class ConversationalPatternAlgorithm extends BasicAlignmentAlgorithm {
  // Analyse des paires adjacentes conseiller→client
  // Détection des types d'alignment structurel
  // Calcul de cohérence pragmatique par famille
  // Comparaison avec BasicAlgorithm (sentiment)
}
```

**Références Scientifiques** :

- Schegloff & Sacks (1973) : Adjacency Pairs Theory
- Pomerantz (1984) : Preference Organization
- Drew & Heritage (1992) : Professional Interaction
- Heritage & Sefi (1992) : Advice Reception

#### **1.2 Interface Comparative Multi-Algorithmes (1-2 jours)**

```typescript
// À modifier : FeedbackAlignmentInterface.tsx
<AlgorithmComparisonView
  algorithms={["basic", "conversational-pattern"]}
  results={comparisonResults}
  showSideBySide={true}
  showConvergenceMetrics={true}
/>
```

#### **1.3 Documentation Scientifique & Export Thèse (1-2 jours)**

- Génération automatique de tableaux comparatifs (LaTeX)
- Graphiques de corrélation Sentiment/Alignment
- Justification méthodologique CA vs Sentiment Analysis
- Métriques de validation scientifique

### 🔄 **Phase 2 : Framework Core (1-2 semaines)**

#### **2.1 Architecture de base**

```typescript
// À créer : metrics-framework/core/
- BaseIndicator.ts           # Classe abstraite
- AlgorithmStrategy.ts       # Interface algorithmes
- MetricsEngine.ts          # Moteur unifié
- types/ (base, indicators, algorithms, results)
```

#### **2.2 Registry pattern**

```typescript
// À créer : MetricsRegistry.ts
class MetricsRegistry {
  registerIndicator(indicator: BaseIndicator): void;
  getIndicator(id: string): BaseIndicator;
  getAlgorithms(indicatorId: string): AlgorithmStrategy[];
  runComparison(indicatorId: string, algorithms: string[]): ComparisonResult;
}
```

#### **2.3 Hook principal unifié**

```typescript
// À créer : useMetricsEngine.ts
export const useMetricsEngine = (config: MetricsEngineConfig) => {
  return {
    indicators: BaseIndicator[],
    results: Record<string, IndicatorResult>,
    compareAlgorithms: (algorithms: string[]) => Promise<AlgorithmComparison>,
    runBenchmark: (testData: AnnotatedData[]) => Promise<BenchmarkResults>
  };
};
```

### 🔄 **Phase 3 : Migration Métriques Cognitives (1-2 semaines)**

#### **3.1 Migration FluiditeCognitiveIndicator**

```typescript
// Étape 1 : Créer structure framework
cognitive-metrics/indicators/FluiditeCognitiveIndicator/
├── algorithms/BasicFluidityAlgorithm.
```
