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
│   │   │   ├── BasicAlignmentAlgorithm.ts      # ✅ Analyse sémantique verbatims
│   │   │   ├── SentimentEnhancedAlgorithm.ts   # 🔄 À IMPLÉMENTER
│   │   │   └── SequentialPatternAlgorithm.ts   # 🔄 À IMPLÉMENTER
│   │   ├── hooks/
│   │   │   ├── useFeedbackAlignmentMetrics.ts  # ✅ Hook complet
│   │   │   └── useFeedbackAlignmentAnnotation.ts # 🔄 À IMPLÉMENTER
│   │   ├── FeedbackAlignmentInterface.tsx      # ✅ Interface complète
│   │   └── types.ts                            # ✅ Types complets
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

### ✅ FeedbackAlignmentIndicator - Statut Complet

**Localisation** : `li-metrics/indicators/FeedbackAlignmentIndicator/`

#### **Fonctionnalités opérationnelles** :

**✅ BasicAlignmentAlgorithm.ts** - Moteur d'analyse sémantique

- Lexiques français étendus (145 patterns : POSITIF/NEGATIF/NEUTRE)
- Analyse des verbatims client avec scoring de confidence
- Recherche des réactions client (temporelle + next_turn)
- Calcul par familles de stratégies (REFLET/ENGAGEMENT/EXPLICATION/OUVERTURE)
- Validation qualité et filtrage des résultats

**✅ FeedbackAlignmentInterface.tsx** - Interface utilisateur

- Affichage des résultats par famille avec scores d'efficacité
- Dialog interactif "Lexiques Complets" avec 145 patterns visibles
- Cartes cliquables par sentiment avec animations
- Export des résultats + lexiques
- Interface responsive (Box/Flexbox, compatible MUI)

**✅ useFeedbackAlignmentMetrics.ts** - Hook de données

- Chargement de tous les turntagged (3652+ enregistrements)
- Pagination Supabase automatique (contournement limite 1000)
- Cache intelligent et optimisations de performance
- Gestion d'erreurs et états de chargement
- Filtrage par origine avec diagnostics

#### **Résultats scientifiques validés** :

```
📊 Efficacité par stratégie (analyse de 1397 tours) :
🥇 OUVERTURE:    48.3% verbatims positifs (175 occurrences)
🥈 ENGAGEMENT:   34.5% verbatims positifs (182 occurrences)
🥉 REFLET:       18.2% verbatims positifs (444 occurrences)
❌ EXPLICATION:   1.0% verbatims positifs (596 occurrences)

✅ Hypothèses validées : H1 (ACTION > EXPLICATION), H2 (EXPLICATION inefficace)
📊 Couverture : 72% (1006/1397 verbatims analysés)
🎯 Confidence moyenne : >75%
```

#### **🔄 Prochaines étapes FeedbackAlignment** :

1. **SentimentEnhancedAlgorithm.ts** - Algorithme avec NLP avancé
   - Intégration analyse de sentiment plus sophistiquée
   - Détection émotions (joie, frustration, surprise, etc.)
   - Analyse de l'intensité émotionnelle
   - Comparaison avec BasicAlgorithm
2. **SequentialPatternAlgorithm.ts** - Patterns séquentiels
   - Détection de séquences stratégie → réaction récurrentes
   - Analyse des enchaînements optimaux
   - Patterns temporels et contextuels
3. **Interface comparative** - Comparaison d'algorithmes
   - Vue côte-à-côte des résultats Basic vs Enhanced vs Sequential
   - Métriques de performance comparatives
   - Tests A/B automatisés

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
│   ├── types.ts                       # ✅ ExtendedAlgorithmLogicProps
│   └── [autres molecules...]          # 🔄 À IMPLÉMENTER
│
├── 📂 hooks/                          # 🪝 HOOKS PARTAGÉS
│   ├── useAlgorithmDialog.ts          # ✅ IMPLÉMENTÉ
│   └── [autres hooks...]              # 🔄 À IMPLÉMENTER
│
└── 📂 utils/                          # 🛠️ UTILITAIRES PARTAGÉS
    └── [utils...]                     # 🔄 À IMPLÉMENTER
```

#### **✅ AlgorithmLogicExplanation** - Composant enrichi

**Fonctionnalités opérationnelles** :

- Interface multicouche pour affichage des lexiques
- Dialog "Vue détaillée" avec scrolling optimisé
- Cartes interactives par sentiment avec animations
- Support types étendus (`ExtendedAlgorithmLogicProps`)
- Composants factorisés (`LexiconCategory`, `DetailedLexicon`)

## 📊 Centre d'Analyse

### Page principale

**Localisation** : `app/(protected)/analysis/page.tsx`

```typescript
// Structure actuelle
export default function AnalysisPage() {
  return (
    <AnalysisLayout>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ✅ Onglet Feedback Alignment - OPÉRATIONNEL */}
        <FeedbackAlignmentInterface
          selectedOrigin={selectedOrigin}
          showDetailedResults={true}
          showComparison={false} // 🔄 À activer avec multi-algorithmes
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
  tag TEXT,
  verbatim TEXT,               -- ✅ Analysé par moteur sémantique
  next_turn_verbatim TEXT,     -- ✅ Verbatim client analysé
  next_turn_tag TEXT,
  speaker TEXT
);

-- ✅ Tags et familles (opérationnels)
lpltag (
  id INTEGER PRIMARY KEY,
  label TEXT,
  family TEXT,                -- ✅ CLÉ pour analyse par famille
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
  algorithm_id TEXT NOT NULL,
  accuracy FLOAT,
  precision FLOAT,
  recall FLOAT,
  f1_score FLOAT,
  processing_time_ms INTEGER,
  test_date TIMESTAMP DEFAULT NOW()
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

## 🎯 Roadmap d'Implémentation

### 🔄 **Phase 1 : Extension FeedbackAlignment (Priorité Immédiate)**

#### **1.1 Deuxième algorithme (2-3 jours)**

```typescript
// À créer : SentimentEnhancedAlgorithm.ts
class SentimentEnhancedAlgorithm extends BasicAlignmentAlgorithm {
  // Extension avec analyse sentiment plus sophistiquée
  // Détection émotions granulaires
  // Comparaison directe avec BasicAlgorithm
}
```

#### **1.2 Interface comparative (1-2 jours)**

```typescript
// À modifier : FeedbackAlignmentInterface.tsx
<AlgorithmComparisonView
  algorithms={["basic", "sentiment-enhanced"]}
  results={comparisonResults}
  showSideBySide={true}
/>
```

#### **1.3 Documentation scientifique (1-2 jours)**

- Génération automatique de tableaux pour thèse
- Export des résultats en format académique
- Graphiques de comparaison algorithmes
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
├── algorithms/BasicFluidityAlgorithm.ts     # Migration du hook existant
├── hooks/useFluiditeCognitiveMetrics.ts     # Adaptation au framework
├── FluiditeCognitiveInterface.tsx           # Nouvelle interface
└── types.ts                                 # Types spécifiques

// Étape 2 : Migrer logique existante
class BasicFluidityAlgorithm {
  // Migration depuis useCognitiveMetrics
  calculateFluiditeScore(turns: TaggedTurn[]): FluiditeResult {
    // Logique existante adaptée
  }
}
```

#### **3.2 Migration des 8 autres indicateurs cognitifs**

- **ReactionsDirectesIndicator** : Temps de latence conversationnelle
- **ReprisesLexicalesIndicator** : Réutilisation vocabulaire client
- **ChargeCognitiveIndicator** : Complexité traitement conversationnel
- **MarqueursEffortIndicator** : Détection signes de difficulté
- **PatternsResistanceIndicator** : Blocages conversationnels
- **RobustesseStressIndicator** : Maintien performance sous pression
- **NiveauStressIndicator** : Intensité stress conversationnel
- **PositionConversationIndicator** : Évolution temporelle métriques

#### **3.3 Interface unifiée CognitiveMetrics**

```typescript
// Adapter CognitiveMetrics.tsx existant au framework
<CognitiveMetricsInterface>
  <IndicatorTabs>
    <Tab
      label="Fluidité Cognitive"
      component={<FluiditeCognitiveInterface />}
    />
    <Tab
      label="Réactions Directes"
      component={<ReactionsDirectesInterface />}
    />
    <Tab
      label="Reprises Lexicales"
      component={<ReprisesLexicalesInterface />}
    />
    {/* ... autres indicateurs */}
  </IndicatorTabs>

  <GlobalCognitiveScore
    indicators={allCognitiveIndicators}
    showTrends={true}
    showComparison={true}
  />
</CognitiveMetricsInterface>
```

### 🔄 **Phase 4 : Nouveaux Indicateurs LI (2-3 semaines)**

#### **4.1 CommonGroundIndicator**

- Algorithme de détection références partagées
- Interface d'analyse du terrain commun
- Métriques de cohésion conversationnelle

#### **4.2 BackchannelsIndicator**

- Détection des signaux d'écoute (mm-hmm, oui, etc.)
- Analyse de la synchronisation conversationnelle
- Patterns de feedback non-verbal

#### **4.3 SequentialPatternsIndicator**

- Analyse des séquences turn-by-turn
- Détection de patterns récurrents
- Optimisation des enchaînements conversationnels

### 🔄 **Phase 5 : Validation Scientifique (3-4 semaines)**

#### **4.1 Système d'annotation**

- Interface d'annotation experte
- Workflow de validation croisée
- Métriques inter-annotateur

#### **4.2 Validation croisée AC-LI-Cognitif**

- Tests de convergence automatisés
- Dashboard de validation scientifique
- Génération de rapports de recherche

## 📋 **Prochaines Tâches Concrètes**

### **Tâche 1 : Deuxième algorithme FeedbackAlignment (URGENT pour thèse)**

**Objectif** : Créer `SentimentEnhancedAlgorithm.ts` pour comparaison scientifique

**Livrables** :

```typescript
// 1. Fichier à créer
li-metrics/indicators/FeedbackAlignmentIndicator/algorithms/SentimentEnhancedAlgorithm.ts

// 2. Méthodes à implémenter
- analyzeEmotionalIntensity(verbatim: string): EmotionalScore
- detectGranularSentiments(verbatim: string): GranularSentiment[]
- compareWithBaseline(basicResult: AlignmentResult): ComparisonMetrics

// 3. Interface à modifier
FeedbackAlignmentInterface.tsx
- Ajouter sélecteur d'algorithme
- Affichage comparatif des résultats
- Métriques de performance différentielle
```

### **Tâche 2 : Export documentation thèse (URGENT)**

**Objectif** : Générer tableaux et graphiques pour insertion dans thèse

**Livrables** :

```typescript
// 1. Hook d'export à créer
useThesisExport.ts
- generateResultsTable(): AcademicTable
- generateComparisonChart(): ChartConfig
- generateMethodologyDescription(): LatexContent
- exportToPDF(): Buffer

// 2. Formats de sortie
- Tableaux LaTeX formatés
- Graphiques haute résolution (SVG/PNG)
- Descriptions méthodologiques
- Métriques de validation
```

### **Tâche 3 : Migration première métrique cognitive (PRIORITÉ MOYENNE)**

**Objectif** : Migrer FluiditeCognitiveIndicator vers le framework

**Livrables** :

```typescript
// 1. Structure à créer
cognitive-metrics/indicators/FluiditeCognitiveIndicator/
├── algorithms/BasicFluidityAlgorithm.ts
├── hooks/useFluiditeCognitiveMetrics.ts
├── FluiditeCognitiveInterface.tsx
└── types.ts

// 2. Migration de la logique existante
// Depuis : useCognitiveMetrics.ts (hook actuel)
// Vers : BasicFluidityAlgorithm.ts (algorithme framework)

// 3. Adaptation de l'interface
// Depuis : CognitiveMetrics.tsx (composant monolithique)
// Vers : FluiditeCognitiveInterface.tsx (composant modulaire)
```

### **Tâche 4 : Tests de validation (IMPORTANT)**

**Objectif** : Valider la robustesse des algorithmes

**Livrables** :

```typescript
// 1. Tests automatisés
algorithms/__tests__/
- BasicAlignmentAlgorithm.test.ts
- SentimentEnhancedAlgorithm.test.ts
- ComparisonValidation.test.ts

// 2. Métriques de qualité
- Précision sur échantillon annoté
- Temps de traitement benchmark
- Stabilité inter-exécutions
- Couverture d'analyse
```

## 🔧 **Setup pour Nouvelle Session**

### **Contexte projet**

- **Framework** : Architecture modulaire pour métriques comparables
- **État actuel** : FeedbackAlignment opérationnel avec BasicAlgorithm
- **Données** : 3652+ enregistrements turntagged, 145 patterns linguistiques
- **Résultats** : Hypothèses H1 & H2 validées scientifiquement

### **Fichiers clés à examiner**

```bash
# Structure existante
src/app/(protected)/analysis/components/
├── li-metrics/indicators/FeedbackAlignmentIndicator/
│   ├── algorithms/BasicAlignmentAlgorithm.ts        # ✅ Moteur sémantique
│   ├── FeedbackAlignmentInterface.tsx               # ✅ Interface complète
│   ├── hooks/useFeedbackAlignmentMetrics.ts         # ✅ Hook données
│   └── types.ts                                     # ✅ Types
├── shared/molecules/
│   ├── AlgorithmLogicExplanation.tsx                # ✅ Composant enrichi
│   └── types.ts                                     # ✅ ExtendedAlgorithmLogicProps
├── shared/atoms/                                    # ✅ Composants atomiques
└── CognitiveMetrics.tsx                             # ✅ Métriques cognitives existantes

# Hook cognitif existant (à migrer)
src/hooks/useCognitiveMetrics.ts                     # ✅ 9 indicateurs opérationnels
```

### **APIs disponibles**

```typescript
// Hook principal FeedbackAlignment
const {
  tableRows, // Données formatées pour affichage
  analysisResults, // Résultats par famille + sentiment
  stats, // Statistiques globales
  runAnalysis, // Lance analyse complète
  debugInfo, // Diagnostics + métadonnées
} = useFeedbackAlignmentMetrics({ selectedOrigin, algorithmType: "basic" });

// Algorithme d'analyse
const algorithm = new BasicAlignmentAlgorithm(turnTaggedData);
const results = algorithm.analyzeAlignment(); // Retourne AlignmentAnalysis
algorithm.diagnoseVerbatims(); // Diagnostics qualité données

// Hook cognitif existant (à migrer vers framework)
const {
  fluiditeCognitive, // Score fluidité conversationnelle
  reactionsDirectes, // Temps de latence réactions
  reprisesLexicales, // Réutilisation vocabulaire client
  chargeCognitive, // Complexité traitement
  marqueursEffort, // Signes de difficulté ("euh", pauses)
  patternsResistance, // Blocages conversationnels
  robustesseStress, // Maintien performance sous pression
  niveauStress, // Intensité stress conversationnel
  positionConversation, // Évolution temporelle
  scoreGlobalCognitif, // Score composite
} = useCognitiveMetrics(turnTaggedData);
```

### **Données de test**

- **Source** : Table `turntagged` (3652 enregistrements)
- **Filtrage** : Par origine, famille de stratégie
- **Couverture** : 72% des tours analysables (1006/1397)
- **Qualité** : Confidence moyenne >75%

Le framework est prêt pour extension avec nouveaux algorithmes et indicateurs ! 🚀
