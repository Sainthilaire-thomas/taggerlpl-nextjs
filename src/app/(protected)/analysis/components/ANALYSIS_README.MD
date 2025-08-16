# 🏗️ Architecture Unifiée - Framework de Métriques Modulaires

## 📋 Vue d'ensemble du projet

Ce document spécifie l'architecture complète pour un framework unifié permettant de développer, tester et optimiser des métriques de **Linguistique Interactionnelle (LI)** et de **Sciences Cognitives** avec une approche modulaire et scientifiquement rigoureuse.

### 🎯 Objectifs principaux

- ✅ **Architecture unifiée** : Framework commun pour LI et métriques cognitives
- ✅ **Zéro duplication** : Code partagé entre tous les domaines
- ✅ **Modularité** : Chaque indicateur développable indépendamment
- ✅ **Machine Learning supervisé** : Algorithmes auto-améliorants
- ✅ **Validation scientifique** : Benchmarking rigoureux et annotation experte
- ✅ **Interface comparative** : Comparaison visuelle entre algorithmes
- ✅ **A/B Testing** : Optimisation continue en production

## 📁 Architecture des fichiers

```
src/app/(protected)/analysis/components/
├── 📂 metrics-framework/                    # 🔧 FRAMEWORK COMMUN
│   ├── 📂 core/
│   │   ├── MetricsRegistry.ts               # Registre universel d'indicateurs
│   │   ├── BaseIndicator.ts                 # Classe de base pour tous indicateurs
│   │   ├── AlgorithmStrategy.ts             # Interface stratégies d'algorithmes
│   │   ├── MetricsEngine.ts                 # Moteur de calcul unifié
│   │   └── types/
│   │       ├── base.ts                      # Types fondamentaux
│   │       ├── indicators.ts                # Types pour indicateurs
│   │       ├── algorithms.ts                # Types pour algorithmes
│   │       ├── results.ts                   # Types pour résultats
│   │       └── annotations.ts               # Types pour système d'annotation
│   │
│   ├── 📂 hooks/
│   │   ├── useMetricsEngine.ts              # Hook principal unifié
│   │   ├── useIndicatorRegistry.ts          # Gestion registre dynamique
│   │   ├── useAlgorithmBenchmarking.ts      # Système de benchmarking
│   │   ├── useAnnotationWorkflow.ts         # Workflow annotation supervisée
│   │   ├── useMetricsByFamily.ts            # Analyse par famille de stratégies
│   │   ├── useMLTraining.ts                 # Entraînement modèles ML
│   │   └── usePerformanceMonitoring.ts      # Monitoring temps réel
│   │
│   ├── 📂 components/
│   │   ├── MetricIndicatorCard.tsx          # Carte d'indicateur universelle
│   │   ├── AlgorithmComparisonView.tsx      # Comparaison algorithmes ligne par ligne
│   │   ├── AnnotationInterface.tsx          # Interface annotation experte
│   │   ├── BenchmarkDashboard.tsx           # Dashboard performance comparative
│   │   ├── MetricsCategoryView.tsx          # Vue par catégorie d'indicateurs
│   │   ├── ABTestingInterface.tsx           # Interface A/B testing
│   │   ├── MLTrainingInterface.tsx          # Interface entraînement ML
│   │   └── PerformanceMonitor.tsx           # Monitoring en temps réel
│   │
│   ├── 📂 utils/
│   │   ├── dataPreprocessing.ts             # Préprocessing données Supabase
│   │   ├── featureExtraction.ts             # Extraction features ML
│   │   ├── algorithmValidation.ts           # Validation et métriques qualité
│   │   ├── annotationHelpers.ts             # Utilitaires annotation
│   │   ├── performanceOptimization.ts       # Optimisations et cache
│   │   ├── mlHelpers.ts                     # Helpers ML/NLP
│   │   └── supabaseAdapter.ts               # Adaptateur données Supabase
│   │
│   └── 📂 database/
│       ├── migrations/                      # Scripts création tables
│       │   ├── 001_create_annotations.sql
│       │   ├── 002_create_performance.sql
│       │   └── 003_create_ab_tests.sql
│       └── schemas/
│           ├── annotations.ts               # Types Supabase annotations
│           └── performance.ts               # Types Supabase performance
│
├── 📂 li-metrics/                           # 🗣️ DOMAINE LINGUISTIQUE INTERACTIONNELLE
│   ├── 📂 indicators/
│   │   ├── 📂 CommonGroundIndicator/
│   │   │   ├── index.ts                     # Export principal
│   │   │   ├── CommonGroundIndicator.tsx    # Interface utilisateur
│   │   │   ├── algorithms/
│   │   │   │   ├── BasicSharedRefsAlgorithm.ts      # Algorithme règles (actuel corrigé)
│   │   │   │   ├── NLPEnhancedAlgorithm.ts          # Avec spaCy/Transformers
│   │   │   │   ├── MLSupervisedAlgorithm.ts         # Machine Learning supervisé
│   │   │   │   └── index.ts                         # Export algorithmes
│   │   │   ├── components/
│   │   │   │   ├── CGResultsDisplay.tsx             # Affichage résultats
│   │   │   │   ├── CGAnnotationInterface.tsx        # Interface annotation spécialisée
│   │   │   │   └── CGAlgorithmComparison.tsx        # Comparaison algorithmes CG
│   │   │   ├── hooks/
│   │   │   │   ├── useCommonGroundMetrics.ts        # Hook spécialisé CG
│   │   │   │   └── useCommonGroundAnnotation.ts     # Workflow annotation CG
│   │   │   └── types.ts                             # Types spécifiques Common Ground
│   │   │
│   │   ├── 📂 FeedbackAlignmentIndicator/
│   │   │   ├── algorithms/
│   │   │   │   ├── BasicAlignmentAlgorithm.ts       # Détection marqueurs basique
│   │   │   │   ├── SentimentEnhancedAlgorithm.ts    # Avec analyse sentiment
│   │   │   │   └── SequentialPatternAlgorithm.ts    # Patterns séquentiels
│   │   │   └── ... (même structure que CommonGround)
│   │   │
│   │   ├── 📂 BackchannelsIndicator/
│   │   ├── 📂 ProsodicFluencyIndicator/
│   │   ├── 📂 SpeechRateIndicator/
│   │   ├── 📂 SequentialPatternsIndicator/
│   │   ├── 📂 RepairMechanismsIndicator/
│   │   └── 📂 CompositeLIScoreIndicator/
│   │
│   ├── LIMetricsConfig.ts                   # Configuration domaine LI
│   ├── LIMetricsRegistry.ts                 # Registre spécialisé LI
│   └── LinguisticInteractionalMetrics.tsx   # Composant principal LI (existant à adapter)
│
├── 📂 cognitive-metrics/                    # 🧠 DOMAINE SCIENCES COGNITIVES
│   ├── 📂 indicators/
│   │   ├── 📂 FluiditeCognitiveIndicator/
│   │   │   ├── algorithms/
│   │   │   │   ├── BasicFluidityAlgorithm.ts        # Algorithme actuel migré
│   │   │   │   ├── NeuronMirrorAlgorithm.ts         # Basé neurones miroirs avancé
│   │   │   │   └── MLEnhancedAlgorithm.ts           # ML supervisé fluidité
│   │   │   └── ... (même structure)
│   │   │
│   │   ├── 📂 ReactionsDirectesIndicator/
│   │   ├── 📂 ReprisesLexicalesIndicator/
│   │   ├── 📂 ChargeCognitiveIndicator/
│   │   ├── 📂 MarqueursEffortIndicator/
│   │   ├── 📂 PatternsResistanceIndicator/
│   │   ├── 📂 RobustesseStressIndicator/
│   │   ├── 📂 NiveauStressIndicator/
│   │   └── 📂 PositionConversationIndicator/
│   │
│   ├── CognitiveMetricsConfig.ts            # Configuration domaine Cognitive
│   ├── CognitiveMetricsRegistry.ts          # Registre spécialisé Cognitive
│   ├── CognitiveMetrics.tsx                 # Composant principal Cognitive
│   │
│   └── 📂 migration/                        # 🔄 MIGRATION EXISTANT
│       ├── adaptUseCognitiveMetrics.ts      # Adaptation hook existant
│       ├── adaptIndicatorData.ts            # Migration données existantes
│       ├── compatibilityLayer.ts            # Couche compatibilité
│       └── migrationGuide.md                # Guide migration step-by-step
│
└── 📂 shared/                               # 🔗 COMPOSANTS PARTAGÉS
    ├── FamilyAnalysisView.tsx               # Vue analyse par famille stratégies
    ├── SupabaseDataAdapter.tsx              # Adaptateur données Supabase
    ├── PerformanceMonitor.tsx               # Monitoring performance global
    └── ExpertAnnotationGuide.tsx            # Guide annotation pour experts
```

## 🗄️ Structure base de données

### **Tables principales (existantes)**

```sql
-- Conversations taggées (existant)
turntagged (
  id INTEGER PRIMARY KEY,
  call_id INTEGER,
  start_time FLOAT,
  end_time FLOAT,
  tag TEXT,
  verbatim TEXT,
  next_turn_verbatim TEXT,
  next_turn_tag TEXT,
  speaker TEXT
);

-- Tags et familles (existant)
lpltag (
  id INTEGER PRIMARY KEY,
  label TEXT,
  family TEXT,
  originespeaker TEXT,
  color TEXT,
  description TEXT
);
```

### **Nouvelles tables à créer**

#### **Système d'annotation unifié**

```sql
-- Annotations expertes pour validation
CREATE TABLE metric_annotations (
  id SERIAL PRIMARY KEY,
  turn_id INTEGER REFERENCES turntagged(id),
  domain TEXT NOT NULL, -- 'li' | 'cognitive'
  indicator_id TEXT NOT NULL, -- 'common_ground_status', 'fluiditeCognitive', etc.
  human_label TEXT NOT NULL, -- Annotation experte
  algorithm_prediction TEXT, -- Prédiction algorithme
  algorithm_confidence FLOAT, -- Confiance (0-1)
  annotator_id TEXT NOT NULL, -- ID annotateur
  created_at TIMESTAMP DEFAULT NOW(),

  -- Métadonnées annotation
  annotation_time_seconds INTEGER, -- Temps pris pour annoter
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  notes TEXT, -- Commentaires annotateur
  context_needed BOOLEAN DEFAULT FALSE, -- Contexte nécessaire pour décision

  -- Spécifique domaines
  cognitive_load_rating INTEGER, -- Pour domaine cognitif (1-10)
  effort_markers_count INTEGER, -- Comptage manuel marqueurs
  processing_type TEXT, -- 'automatique', 'contrôlé', 'mixte'

  UNIQUE(turn_id, domain, indicator_id, annotator_id)
);

-- Index pour performances
CREATE INDEX idx_annotations_domain_indicator ON metric_annotations(domain, indicator_id);
CREATE INDEX idx_annotations_turn ON metric_annotations(turn_id);
CREATE INDEX idx_annotations_annotator ON metric_annotations(annotator_id);
```

#### **Performance et benchmarking**

```sql
-- Performance algorithmes
CREATE TABLE algorithm_performance (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  algorithm_id TEXT NOT NULL,

  -- Métriques classification
  accuracy FLOAT,
  precision FLOAT,
  recall FLOAT,
  f1_score FLOAT,

  -- Métriques régression (pour scores numériques)
  mean_absolute_error FLOAT,
  root_mean_square_error FLOAT,
  correlation_coefficient FLOAT,

  -- Métriques opérationnelles
  processing_time_ms INTEGER,
  memory_usage_mb FLOAT,
  throughput_per_second FLOAT,

  -- Contexte test
  test_data_size INTEGER,
  annotation_coverage_percent FLOAT,
  test_date TIMESTAMP DEFAULT NOW(),
  configuration JSONB, -- Paramètres algorithme

  UNIQUE(domain, indicator_id, algorithm_id, test_date)
);

CREATE INDEX idx_performance_domain_indicator ON algorithm_performance(domain, indicator_id);
CREATE INDEX idx_performance_test_date ON algorithm_performance(test_date);
```

#### **A/B Testing**

```sql
-- Tests A/B en production
CREATE TABLE ab_tests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  algorithm_a TEXT NOT NULL,
  algorithm_b TEXT NOT NULL,

  -- Configuration test
  traffic_split_percent INTEGER DEFAULT 50, -- % trafic algorithme A
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  target_sample_size INTEGER DEFAULT 1000,

  -- Résultats
  current_sample_size INTEGER DEFAULT 0,
  statistical_significance FLOAT,
  winner TEXT, -- 'algorithm_a', 'algorithm_b', 'inconclusive'
  improvement_percent FLOAT,

  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'stopped')),

  UNIQUE(domain, indicator_id, name)
);
```

#### **Historique modèles ML**

```sql
-- Versions modèles ML
CREATE TABLE ml_models (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  version TEXT NOT NULL,

  -- Métadonnées modèle
  algorithm_type TEXT, -- 'random_forest', 'neural_network', 'transformer'
  training_data_size INTEGER,
  features_used JSONB,
  hyperparameters JSONB,

  -- Performance
  validation_accuracy FLOAT,
  training_time_minutes INTEGER,
  model_size_mb FLOAT,

  -- Déploiement
  created_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP,
  deprecated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE,

  -- Storage
  model_path TEXT, -- Chemin fichier modèle

  UNIQUE(domain, indicator_id, version)
);
```

## 🔧 Types TypeScript principaux

### **Types de base framework**

```typescript
// metrics-framework/core/types/base.ts

type MetricsDomain = "li" | "cognitive" | "conversational_analysis";

type ImplementationStatus = "implemented" | "partial" | "missing";

type AlgorithmType = "rule_based" | "nlp_enhanced" | "ml_supervised" | "hybrid";

interface BaseIndicatorConfig {
  id: string;
  name: string;
  domain: MetricsDomain;
  category: string;
  implementationStatus: ImplementationStatus;
  theoreticalFoundation: string;
  dataRequirements: DataRequirement[];
}

interface DataRequirement {
  table: string;
  columns: string[];
  optional?: boolean;
}

interface AlgorithmConfig {
  id: string;
  name: string;
  type: AlgorithmType;
  version: string;
  description: string;
  requiresTraining: boolean;
  supportedDomains: MetricsDomain[];
}
```

### **Types résultats et annotations**

```typescript
// metrics-framework/core/types/results.ts

interface IndicatorResult {
  value: string | number;
  confidence: number; // 0-1
  explanation?: string;
  features_used?: Record<string, any>;
  processing_time_ms?: number;
}

interface AnnotationData {
  turn_id: number;
  domain: MetricsDomain;
  indicator_id: string;
  human_label: string;
  algorithm_prediction?: string;
  algorithm_confidence?: number;
  annotator_id: string;
  difficulty_rating?: number;
  notes?: string;
}

interface BenchmarkResult {
  algorithm_id: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  processing_time_ms: number;
  test_data_size: number;
}

interface AlgorithmComparison {
  indicator_id: string;
  algorithms: string[];
  results: Record<string, IndicatorResult[]>;
  benchmark: Record<string, BenchmarkResult>;
  recommendation: {
    best_accuracy: string;
    best_speed: string;
    best_overall: string;
    reasoning: string;
  };
}
```

### **Types spécifiques domaines**

```typescript
// li-metrics/types.ts

interface CommonGroundResult extends IndicatorResult {
  value: "CG_ETABLI" | "CG_NEGOCIE" | "CG_ROMPU";
  details: {
    shared_references: number;
    breakdown_detected: boolean;
    semantic_similarity?: number;
    detected_markers: string[];
  };
}

interface FeedbackAlignmentResult extends IndicatorResult {
  value: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT";
  details: {
    positive_markers: string[];
    negative_markers: string[];
    sentiment_score?: number;
  };
}

// cognitive-metrics/types.ts

interface FluiditeCognitiveResult extends IndicatorResult {
  value: number; // Score 0-1
  details: {
    temporal_score: number;
    linguistic_score: number;
    prosodic_score: number;
    effort_markers_detected: string[];
  };
}
```

## 🚀 API des hooks principaux

### **Hook principal unifié**

```typescript
// metrics-framework/hooks/useMetricsEngine.ts

interface MetricsEngineConfig {
  domain: MetricsDomain;
  indicatorIds?: string[];
  algorithmOverrides?: Record<string, string>;
  enableCaching?: boolean;
  enableBenchmarking?: boolean;
  enableRealTimeComparison?: boolean;
}

export const useMetricsEngine = (config: MetricsEngineConfig) => {
  return {
    // État
    indicators: BaseIndicator[],
    results: Record<string, IndicatorResult>,
    loading: boolean,
    error: string | null,

    // Actions principales
    calculateMetrics: (data: TurnTaggedData[]) => Promise<Record<string, IndicatorResult>>,
    switchAlgorithm: (indicatorId: string, algorithmId: string) => void,

    // Analyse par famille
    getResultsByFamily: () => FamilyResults[],
    getGlobalMetrics: () => GlobalMetrics,

    // Benchmarking
    runBenchmark: (testData: AnnotatedData[]) => Promise<BenchmarkResults>,
    compareAlgorithms: (algorithms: string[]) => Promise<AlgorithmComparison>,

    // ML et optimisation
    trainMLModel: (indicatorId: string, trainingData: AnnotatedData[]) => Promise<TrainingResult>,
    deployModel: (indicatorId: string, modelVersion: string) => Promise<void>,

    // A/B Testing
    startABTest: (config: ABTestConfig) => Promise<ABTest>,
    getABTestResults: (testId: string) => ABTestResults,

    // Performance monitoring
    getPerformanceMetrics: () => PerformanceMetrics,
    clearCache: () => void
  };
};
```

### **Hook annotation supervisée**

```typescript
// metrics-framework/hooks/useAnnotationWorkflow.ts

export const useAnnotationWorkflow = (domain: MetricsDomain, indicatorId: string) => {
  return {
    // Sélection intelligente cas à annoter
    selectCasesForAnnotation: (strategy: 'random' | 'active_learning' | 'disagreement') => TurnTaggedData[],

    // Workflow annotation
    currentCase: TurnTaggedData | null,
    annotationProgress: { completed: number, total: number },

    // Actions annotation
    annotateCase: (label: string, difficulty?: number, notes?: string) => Promise<void>,
    skipCase: (reason: string) => void,
    goToNext: () => void,
    goToPrevious: () => void,

    // Qualité annotation
    interAnnotatorAgreement: number,
    annotationStats: AnnotationStats,

    // Export/Import
    exportAnnotations: () => AnnotatedData[],
    importAnnotations: (data: AnnotatedData[]) => Promise<void>
  };
};
```

### **Hook spécialisé Common Ground**

```typescript
// li-metrics/indicators/CommonGroundIndicator/hooks/useCommonGroundMetrics.ts

export const useCommonGroundMetrics = (
  data: TurnTaggedData[],
  algorithmId: string = 'basic_shared_refs'
) => {
  return {
    // Résultats Common Ground
    results: CommonGroundResult[],
    familyResults: FamilyResults[],
    globalStats: {
      cg_etabli_rate: number,
      cg_negocie_rate: number,
      cg_rompu_rate: number
    },

    // Comparaison algorithmes
    algorithmComparison: AlgorithmComparison,
    availableAlgorithms: AlgorithmConfig[],

    // Actions
    calculateMetrics: () => Promise<void>,
    compareAlgorithms: (algorithms: string[]) => Promise<void>,
    switchAlgorithm: (algorithmId: string) => void,

    // Annotation spécialisée
    startAnnotation: () => void,
    getAnnotationInterface: () => React.ComponentType
  };
};
```

## 📊 Interface utilisateur principale

### **Comparaison algorithmes ligne par ligne**

```typescript
// metrics-framework/components/AlgorithmComparisonView.tsx

interface AlgorithmComparisonViewProps {
  domain: MetricsDomain;
  indicatorId: string;
  data: TurnTaggedData[];
  selectedAlgorithms: string[];
}

// Rendu : Table avec colonnes par algorithme + annotation humaine + consensus
```

### **Dashboard performance**

```typescript
// metrics-framework/components/BenchmarkDashboard.tsx

// Graphiques :
// - Accuracy par algorithme (bar chart)
// - Évolution performance dans le temps (line chart)
// - Temps de traitement vs précision (scatter plot)
// - Matrice confusion pour classification
// - Distribution des scores pour régression
```

### **Interface annotation experte**

```typescript
// metrics-framework/components/AnnotationInterface.tsx

// Fonctionnalités :
// - Contexte conversationnel (tours précédents/suivants)
// - Prédictions algorithmes avec confiance
// - Interface annotation rapide (boutons/sliders)
// - Justification optionnelle
// - Statistiques temps réel
// - Navigation intelligente (cases difficiles en priorité)
```

## 🔄 Plan de migration et implémentation

### **Phase 1 : Infrastructure commune (Semaines 1-2)**

#### **Objectifs :**

- ✅ Créer framework `metrics-framework/`
- ✅ Tables base de données annotations/performance
- ✅ Hook principal `useMetricsEngine`
- ✅ Composants de base réutilisables

#### **Livrables :**

```typescript
// 1. Core framework
metrics-framework/core/MetricsRegistry.ts
metrics-framework/core/BaseIndicator.ts
metrics-framework/core/types/

// 2. Hooks de base
metrics-framework/hooks/useMetricsEngine.ts
metrics-framework/hooks/useAnnotationWorkflow.ts

// 3. Composants réutilisables
metrics-framework/components/MetricIndicatorCard.tsx
metrics-framework/components/AlgorithmComparisonView.tsx

// 4. Base de données
database/migrations/001_create_annotations.sql
database/migrations/002_create_performance.sql
```

#### **Tests d'acceptance :**

- Framework chargeable sans erreur
- Hook `useMetricsEngine` retourne structure attendue
- Tables créées correctement dans Supabase
- Interface basique fonctionnelle

### **Phase 2 : Migration métriques cognitives (Semaines 3-4)**

#### **Objectifs :**

- ✅ Migrer hook `useCognitiveMetrics` existant vers nouvelle architecture
- ✅ Conserver interface actuelle avec couche compatibilité
- ✅ Implémenter premier indicateur modulaire (`FluiditeCognitive`)
- ✅ Tests non-régression

#### **Livrables :**

```typescript
// 1. Migration avec compatibilité
cognitive-metrics/migration/adaptUseCognitiveMetrics.ts
cognitive-metrics/migration/compatibilityLayer.ts

// 2. Premier indicateur modulaire
cognitive-metrics/indicators/FluiditeCognitiveIndicator/
├── algorithms/BasicFluidityAlgorithm.ts
├── FluiditeCognitiveIndicator.tsx
└── hooks/useFluiditeCognitiveMetrics.ts

// 3. Configuration domaine
cognitive-metrics/CognitiveMetricsConfig.ts
cognitive-metrics/CognitiveMetricsRegistry.ts
```

#### **Tests d'acceptance :**

- Interface existante fonctionne sans changement visible
- Nouvelles fonctionnalités accessibles (comparaison algorithmes)
- Performance identique ou améliorée
- Premier algorithme ML entraînable

### **Phase 3 : Implémentation LI complète (Semaines 5-6)**

#### **Objectifs :**

- ✅ Implémenter tous indicateurs LI avec architecture modulaire
- ✅ Correction algorithme Common Ground (variable `shared_score`)
- ✅ Algorithmes NLP enhanced pour 2-3 indicateurs prioritaires
- ✅ Interface annotation experte opérationnelle

#### **Livrables :**

```typescript
// 1. Indicateurs LI complets
li-metrics/indicators/CommonGroundIndicator/
├── algorithms/
│   ├── BasicSharedRefsAlgorithm.ts    # Corrigé
│   ├── NLPEnhancedAlgorithm.ts        # spaCy + Transformers
│   └── MLSupervisedAlgorithm.ts       # Prêt pour training
├── CommonGroundIndicator.tsx
└── hooks/useCommonGroundMetrics.ts

li-metrics/indicators/FeedbackAlignmentIndicator/
li-metrics/indicators/BackchannelsIndicator/
// ... autres indicateurs

// 2. Interface annotation
metrics-framework/components/AnnotationInterface.tsx
li-metrics/components/LIAnnotationInterface.tsx

// 3. Système comparaison
metrics-framework/components/AlgorithmComparisonView.tsx
```

#### **Tests d'acceptance :**

- Tous indicateurs LI calculables avec 3 algorithmes minimum
- Interface annotation permettant 10 annotations/minute
- Comparaison visuelle algorithmes fonctionnelle
- Premiers modèles ML entraînables avec 100+ annotations

### **Phase 4 : ML supervisé et optimisation (Semaines 7-8)**

#### **Objectifs :**

- ✅ Collecte 500-1000 annotations expertes par indicateur prioritaire
- ✅ Entraînement modèles ML supervisés performants
- ✅ A/B testing en production
- ✅ Monitoring performance temps réel

#### **Livrables :**

```typescript
// 1. Modèles ML opérationnels
li -
  metrics /
    indicators /
    CommonGroundIndicator /
    algorithms /
    MLSupervisedAlgorithm.ts;
cognitive -
  metrics /
    indicators /
    FluiditeCognitiveIndicator /
    algorithms /
    MLEnhancedAlgorithm.ts;

// 2. Interface A/B testing
metrics - framework / components / ABTestingInterface.tsx;
metrics - framework / hooks / useABTesting.ts;

// 3. Monitoring
metrics - framework / components / PerformanceMonitor.tsx;
metrics - framework / hooks / usePerformanceMonitoring.ts;

// 4. Optimisations
metrics - framework / utils / performanceOptimization.ts;
```

#### **Tests d'acceptance :**

- Modèles ML avec >85% accuracy sur données test
- A/B tests automatiques entre algorithmes
- Dashboard monitoring temps réel fonctionnel
- Performance <100ms par calcul d'indicateur

## 🎯 Résultats attendus

### **Métriques de succès techniques :**

- **Précision** : +20-30% vs algorithmes actuels
- **Performance** : <100ms temps de réponse
- **Couverture** : 8+ indicateurs LI, 9+ indicateurs cognitifs
- **Annotation** : 1000+ exemples annotés par indicateur critique
- **Algorithmes** : 3+ stratégies par indicateur (règles, NLP, ML)

### **Métriques de succès utilisateur :**

- **Interface** : Comparaison visuelle algorithmes
- **Transparence** : Explication prédictions algorithmiques
- **Contrôle** : Sélection algorithme selon contexte
- **Évolution** : Amélioration continue via annotations

### **Métriques de succès scientifique :**

- **Validation** : Corrélation >0.8 avec expertise humaine
- **Reproductibilité** : Benchmarks standardisés
- **Extensibilité** : Framework réutilisable autres domaines
- **Publication** : Résultats comparatifs publiables

## 🔗 Ressources et références

### **Technologies utilisées :**

- **Frontend** : React + TypeScript + Material-UI
- **Backend** : Supabase (PostgreSQL)
- **ML/NLP** : Python (spaCy, Transformers, scikit-learn)
- **Déploiement** : Next.js + API routes

### **Références théoriques :**

- **LI** : Clark (1996), Pickering & Garrod (2004), Schegloff (1982)
- **Sciences Cognitives** : Gallese (2007), Arnsten (2009), Lupien et al. (2007)
- **ML Supervisé** : Breiman (2001) Random Forests, Devlin et al. (2018) BERT

### **Documentation complémentaire :**

- [Guide annotation experte](https://claude.ai/chat/docs/annotation-guide.md)
- [API Reference algorithmes](https://claude.ai/chat/docs/algorithm-api.md)
- [Benchmarking méthodologie](https://claude.ai/chat/docs/benchmarking-methodology.md)
- [Déploiement production](https://claude.ai/chat/docs/deployment-guide.md)

## 🚨 Points d'attention critiques

### **Sécurité et performance :**

- ✅ **RLS Supabase** : Row Level Security sur toutes nouvelles tables
- ✅ **Validation données** : Sanitisation input utilisateur
- ✅ **Cache intelligent** : Invalidation automatique cache résultats
- ✅ **Rate limiting** : Protection API ML training/annotation
- ✅ **Monitoring** : Alertes dégradation performance

### **Qualité scientifique :**

- ✅ **Inter-annotator agreement** : >0.8 pour validation
- ✅ **Test/validation split** : 80/20 données annotations
- ✅ **Cross-validation** : 5-fold minimum pour ML
- ✅ **Baseline comparison** : Toujours comparer vs algorithmes existants
- ✅ **Statistical significance** : Tests statistiques pour A/B tests

### **Maintenance et évolution :**

- ✅ **Versioning modèles** : Traçabilité versions ML
- ✅ **Backward compatibility** : Migration douce sans casser existant
- ✅ **Documentation** : Code auto-documenté + guides utilisateur
- ✅ **Tests automatisés** : Unit tests + integration tests
- ✅ **Monitoring production** : Alertes performance temps réel

## 📋 Checklist démarrage projet

### **Prérequis techniques :**

- [ ] Accès Supabase avec droits création tables
- [ ] Node.js 18+ et npm/yarn configurés
- [ ] VS Code avec extensions TypeScript/React
- [ ] Git repository configuré avec branches develop/main
- [ ] Accès environnements dev/staging/production

### **Prérequis métier :**

- [ ] Experts domaine disponibles pour annotation (2-3 personnes)
- [ ] Échantillon données test représentatives (100+ conversations)
- [ ] Critères qualité définis par domaine métier
- [ ] Validation cadre théorique section 3.2 (LI) et neurones miroirs (Cognitif)

### **Setup initial (Week 1 Day 1) :**

```bash
# 1. Créer structure dossiers
mkdir -p src/app/\(protected\)/analysis/components/metrics-framework/{core,hooks,components,utils,database}
mkdir -p src/app/\(protected\)/analysis/components/li-metrics/indicators
mkdir -p src/app/\(protected\)/analysis/components/cognitive-metrics/{indicators,migration}

# 2. Setup base de données
# Exécuter scripts migration dans Supabase Dashboard
# Ou via CLI : supabase db push

# 3. Installer dépendances supplémentaires
npm install @supabase/supabase-js date-fns uuid
npm install -D @types/uuid

# 4. Configuration environnement
# Vérifier variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### **Validation setup (Week 1 Day 2) :**

```typescript
// Test basique framework
import { useMetricsEngine } from "@/components/metrics-framework/hooks/useMetricsEngine";

const TestComponent = () => {
  const { indicators, loading, error } = useMetricsEngine({
    domain: "cognitive",
  });

  return (
    <div>
      <h2>Test Framework</h2>
      <p>Loading: {loading ? "Yes" : "No"}</p>
      <p>Error: {error || "None"}</p>
      <p>Indicators loaded: {indicators.length}</p>
    </div>
  );
};
```

## 🔧 Commandes utiles développement

### **Génération types Supabase :**

```bash
# Générer types TypeScript depuis schéma Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### **Tests et validation :**

```bash
# Tests unitaires
npm test -- metrics-framework

# Tests d'intégration
npm run test:integration

# Lint et format
npm run lint
npm run format

# Build production
npm run build
```

### **Monitoring base de données :**

```sql
-- Vérifier performance annotations
SELECT
  domain,
  indicator_id,
  COUNT(*) as annotation_count,
  AVG(annotation_time_seconds) as avg_time,
  COUNT(DISTINCT annotator_id) as annotator_count
FROM metric_annotations
GROUP BY domain, indicator_id
ORDER BY annotation_count DESC;

-- Performance algorithmes
SELECT
  domain,
  indicator_id,
  algorithm_id,
  accuracy,
  processing_time_ms,
  test_date
FROM algorithm_performance
ORDER BY test_date DESC
LIMIT 20;
```

## 🎓 Guide formation équipe

### **Pour développeurs :**

1. **Architecture modulaire** : Comprendre pattern BaseIndicator + AlgorithmStrategy
2. **Types TypeScript** : Maîtriser types génériques framework
3. **Hooks React** : Pattern hooks spécialisés vs hooks communs
4. **Supabase** : RLS, migrations, types auto-générés
5. **ML basics** : Feature extraction, training/validation split, métriques

### **Pour experts métier :**

1. **Interface annotation** : Workflow efficace annotation
2. **Critères qualité** : Définir standards annotation par domaine
3. **Validation théorique** : Alignement algorithmes avec théories
4. **Interprétation résultats** : Lecture benchmarks et comparaisons
5. **Feedback continue** : Process amélioration algorithmes

### **Pour product owners :**

1. **ROI mesurable** : Métriques précision vs effort développement
2. **Priorisation** : Indicateurs critiques vs nice-to-have
3. **Timeline réaliste** : Complexité ML vs besoins business
4. **Adoption utilisateurs** : Formation équipes à nouvelles interfaces
5. **Maintenance long terme** : Coût annotation continue vs bénéfices

## 📞 Support et contacts

### **Architecture technique :**

- **Responsable framework** : [Nom] - questions architecture générale
- **Expert ML/NLP** : [Nom] - algorithmes avancés et training
- **Expert Supabase** : [Nom] - base de données et performance

### **Domaines métier :**

- **Expert Linguistique Interactionnelle** : [Nom] - validation théorique LI
- **Expert Sciences Cognitives** : [Nom] - validation théorique neurones miroirs
- **Expert Analyse Conversationnelle** : [Nom] - patterns conversationnels

### **Ressources externes :**

- **Documentation Supabase** : https://supabase.com/docs
- **Material-UI Components** : https://mui.com/components/
- **spaCy NLP** : https://spacy.io/usage/linguistic-features
- **Transformers HuggingFace** : https://huggingface.co/docs/transformers

---

## 🎯 En résumé : Prochaines actions

### **Action immédiate (Cette session) :**

1. **Valider architecture** avec équipe technique
2. **Créer repository** et structure dossiers
3. **Setup base de données** avec premières tables
4. **Identifier experts** pour annotation

### **Semaine 1 :**

1. **Implémenter core framework** (`MetricsRegistry`, `BaseIndicator`)
2. **Hook principal** `useMetricsEngine` fonctionnel
3. **Premier composant** `MetricIndicatorCard`
4. **Tests basiques** infrastructure

### **Semaine 2 :**

1. **Migration premier indicateur cognitif** (`FluiditeCognitive`)
2. **Interface comparaison** algorithmes basique
3. **Système annotation** minimal
4. **Validation non-régression** existant

### **Quick Start commande :**

```bash
# Cloner architecture de base
git clone [repo-url]
cd taggerlpl-nextjs

# Créer structure
mkdir -p src/app/\(protected\)/analysis/components/{metrics-framework,li-metrics,cognitive-metrics}

# Premier commit
git add .
git commit -m "🏗️ Initialize unified metrics framework architecture"

# Prêt pour développement !
```

Cette architecture vous permettra de développer des métriques **scientifiquement validées** , **modulaires** et **évolutives** tout en conservant la compatibilité avec l'existant ! 🚀

**La clé du succès** : Commencer petit (1 indicateur), valider l'approche, puis étendre progressivement à tous les domaines.

# 📊 Extensions Statistiques TaggerLPL

## Validation Convergence Multi-Niveaux AC-LI-Cognitif

### 🎯 Nouveaux besoins identifiés dans le plan de thèse

Le **chapitre 3.3** du plan de thèse introduit une méthodologie de **validation croisée** entre trois niveaux d'analyse qui nécessite des fonctionnalités statistiques avancées non prévues dans l'architecture actuelle de TaggerLPL.

---

## 📋 Fonctionnalités statistiques à développer

### 1. **Validation de convergence inter-niveaux**

#### **Coefficients de concordance**

```python
# Nouveau module: src/app/(protected)/analysis/components/metrics-framework/stats/
├── convergence_validation.py
├── ranking_consistency.py
└── correlation_analysis.py
```

**Métriques requises :**

- **Coefficient de Kendall (τ)** : concordance des classements d'efficacité entre AC/LI/Cognitif
- **Corrélations de Pearson (r)** : accord sur l'efficacité relative des stratégies
- **Tests de concordance directionnelle** : validation des tendances (haut/bas)

#### **Architecture proposée**

```typescript
// Extension du framework existant
interface ConvergenceValidationConfig {
  levels: ("AC" | "LI" | "Cognitive")[];
  strategies: string[];
  thresholds: {
    kendall_tau: number; // > 0.7 pour accord substantiel
    pearson_r: number; // > 0.6 pour corrélation acceptable
    directional: number; // > 80% pour concordance directionnelle
  };
}

export const useConvergenceValidation = (
  config: ConvergenceValidationConfig
) => {
  return {
    // Calculs de convergence
    calculateRankingConsistency: () => KendallResults,
    calculateEffectivenessCorrelations: () => PearsonResults,
    validateDirectionalAgreement: () => DirectionalResults,

    // Tests d'hypothèses spécifiques
    testH1ActionEffectiveness: () => ValidationResult,
    testH2ExplanationDifficulty: () => ValidationResult,
    testH3RefletGradient: () => ValidationResult,

    // Synthèse validation
    generateValidationReport: () => ConvergenceReport,
    suggestModelRefinements: () => ImprovementSuggestions,
  };
};
```

---

### 2. **Module d'analyse comparative automatisée**

#### **Comparaison efficacité par famille de stratégies**

```python
def validate_cross_level_convergence(corpus_pairs):
    """
    Teste si AC, LI et Cognitif convergent sur le classement d'efficacité
    """
    strategy_families = {
        'REFLET': ['REFLET_ACQ', 'REFLET_JE', 'REFLET_VOUS'],
        'ENGAGEMENT': ['ENGAGEMENT'],
        'EXPLICATION': ['EXPLICATION'],
        'OUVERTURE': ['OUVERTURE']
    }

    convergence_results = {}

    for family_name, strategy_tags in strategy_families.items():
        family_pairs = [pair for pair in corpus_pairs if pair.conseiller.tag in strategy_tags]

        # NIVEAU AC : Distribution des réactions client (baseline empirique)
        ac_effectiveness = calculate_positive_rate(family_pairs)

        # NIVEAU LI : Score composite (Common Ground + Feedback + Fluidité)
        li_effectiveness = calculate_composite_li_score(family_pairs)

        # NIVEAU COGNITIF : Score composite (Fluidité + Automatisme - Charge)
        cognitive_effectiveness = calculate_composite_cognitive_score(family_pairs)

        convergence_results[family_name] = {
            'ac_effectiveness': ac_effectiveness,
            'li_effectiveness': li_effectiveness,
            'cognitive_effectiveness': cognitive_effectiveness
        }

    # Tests de convergence
    ranking_consistency = test_ranking_consistency(convergence_results)

    return {
        'family_results': convergence_results,
        'consistency_tests': ranking_consistency,
        'validation_status': 'CONVERGENT' if ranking_consistency['overall'] > 0.7 else 'DIVERGENT'
    }
```

#### **Tests statistiques spécialisés**

```python
def test_ranking_consistency(convergence_results):
    """
    Calcule les coefficients de Kendall entre les trois classements
    """
    from scipy.stats import kendalltau

    # Extraction des classements par niveau
    strategies = list(convergence_results.keys())

    ac_ranking = sorted(strategies,
                       key=lambda x: convergence_results[x]['ac_effectiveness'],
                       reverse=True)

    li_ranking = sorted(strategies,
                       key=lambda x: convergence_results[x]['li_effectiveness'],
                       reverse=True)

    cognitive_ranking = sorted(strategies,
                              key=lambda x: convergence_results[x]['cognitive_effectiveness'],
                              reverse=True)

    # Calculs des concordances (τ de Kendall)
    tau_ac_li, p_ac_li = kendalltau(ac_ranking, li_ranking)
    tau_ac_cognitive, p_ac_cognitive = kendalltau(ac_ranking, cognitive_ranking)
    tau_li_cognitive, p_li_cognitive = kendalltau(li_ranking, cognitive_ranking)

    return {
        'rankings': {
            'AC': ac_ranking,
            'LI': li_ranking,
            'Cognitive': cognitive_ranking
        },
        'concordance': {
            'AC_LI': {'tau': tau_ac_li, 'p_value': p_ac_li},
            'AC_Cognitive': {'tau': tau_ac_cognitive, 'p_value': p_ac_cognitive},
            'LI_Cognitive': {'tau': tau_li_cognitive, 'p_value': p_li_cognitive}
        },
        'overall_consistency': (tau_ac_li + tau_ac_cognitive + tau_li_cognitive) / 3
    }
```

---

### 3. **Interface de validation visuelle**

#### **Dashboard de convergence**

```tsx
// Nouveau composant: ValidationDashboard.tsx

interface ValidationDashboardProps {
  convergenceResults: ConvergenceResults;
  validationConfig: ConvergenceValidationConfig;
}

export const ValidationDashboard: React.FC<ValidationDashboardProps> = ({
  convergenceResults,
  validationConfig,
}) => {
  return (
    <Box sx={{ p: 3 }}>
      {/* 1. Statut global de convergence */}
      <Alert
        severity={
          convergenceResults.validation_status === "CONVERGENT"
            ? "success"
            : "warning"
        }
        sx={{ mb: 3 }}
      >
        <AlertTitle>
          Statut de convergence: {convergenceResults.validation_status}
        </AlertTitle>
        {convergenceResults.validation_status === "CONVERGENT"
          ? "Les trois niveaux d'analyse convergent vers les mêmes conclusions"
          : "Divergences détectées entre les niveaux d'analyse - révision du modèle nécessaire"}
      </Alert>

      {/* 2. Matrice de corrélations */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Concordance des classements (τ de Kendall)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <MetricCard
              title="AC ↔ LI"
              value={convergenceResults.consistency_tests.concordance.AC_LI.tau}
              threshold={validationConfig.thresholds.kendall_tau}
              format="kendall"
            />
          </Grid>
          <Grid item xs={4}>
            <MetricCard
              title="AC ↔ Cognitif"
              value={
                convergenceResults.consistency_tests.concordance.AC_Cognitive
                  .tau
              }
              threshold={validationConfig.thresholds.kendall_tau}
              format="kendall"
            />
          </Grid>
          <Grid item xs={4}>
            <MetricCard
              title="LI ↔ Cognitif"
              value={
                convergenceResults.consistency_tests.concordance.LI_Cognitive
                  .tau
              }
              threshold={validationConfig.thresholds.kendall_tau}
              format="kendall"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Classements comparatifs */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Classements d'efficacité par niveau
        </Typography>
        <RankingComparisonTable
          rankings={convergenceResults.consistency_tests.rankings}
          familyResults={convergenceResults.family_results}
        />
      </Paper>

      {/* 4. Tests d'hypothèses spécifiques */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Validation des hypothèses théoriques
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <HypothesisTestCard
              hypothesis="H1: ENGAGEMENT/OUVERTURE efficaces"
              result={convergenceResults.hypothesis_tests?.H1_validation}
              details="Traitement automatique → réactions positives"
            />
          </Grid>
          <Grid item xs={4}>
            <HypothesisTestCard
              hypothesis="H2: EXPLICATION inefficaces"
              result={convergenceResults.hypothesis_tests?.H2_validation}
              details="Surcharge cognitive → réactions négatives"
            />
          </Grid>
          <Grid item xs={4}>
            <HypothesisTestCard
              hypothesis="H3: Gradient REFLET"
              result={convergenceResults.hypothesis_tests?.H3_validation}
              details="VOUS > JE > ACQ selon forme linguistique"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 5. Recommandations d'amélioration */}
      {convergenceResults.validation_status === "DIVERGENT" && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recommandations d'amélioration du modèle
          </Typography>
          <ImprovementSuggestions
            suggestions={convergenceResults.improvement_suggestions}
          />
        </Paper>
      )}
    </Box>
  );
};
```

#### **Graphiques de convergence**

```tsx
// Composant spécialisé: ConvergenceVisualization.tsx

export const ConvergenceVisualization: React.FC<{
  convergenceData: ConvergenceResults;
}> = ({ convergenceData }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Graphique radar de convergence */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Convergence multi-niveaux par stratégie
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={formatRadarData(convergenceData.family_results)}>
            <PolarGrid />
            <PolarAngleAxis dataKey="strategy" />
            <PolarRadiusAxis angle={90} domain={[0, 1]} />
            <Radar
              name="AC (Empirique)"
              dataKey="ac_effectiveness"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Radar
              name="LI (Interactionnel)"
              dataKey="li_effectiveness"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.3}
            />
            <Radar
              name="Cognitif (Explicatif)"
              dataKey="cognitive_effectiveness"
              stroke="#ffc658"
              fill="#ffc658"
              fillOpacity={0.3}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Graphique de concordance temporelle */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Évolution de la concordance (diagnostics)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={generateConcordanceTimeSeries(convergenceData)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sample_size" />
            <YAxis domain={[0, 1]} />
            <Line
              type="monotone"
              dataKey="kendall_tau"
              stroke="#8884d8"
              name="τ de Kendall"
            />
            <Line
              type="monotone"
              dataKey="pearson_r"
              stroke="#82ca9d"
              name="r de Pearson"
            />
            <ReferenceLine y={0.7} stroke="red" strokeDasharray="5 5" />
            <Tooltip />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};
```

---

### 4. **Intégration dans l'architecture existante**

#### **Extensions du metrics-framework**

```typescript
// Extension de l'architecture existante
src/app/(protected)/analysis/components/metrics-framework/
├── core/
│   ├── MetricsRegistry.ts              # ✅ Existant
│   ├── BaseIndicator.ts                # ✅ Existant
│   └── ValidationEngine.ts             # 🆕 NOUVEAU - Moteur de validation
├── hooks/
│   ├── useMetricsEngine.ts             # ✅ Existant
│   └── useConvergenceValidation.ts     # 🆕 NOUVEAU - Hook validation
├── components/
│   ├── MetricIndicatorCard.tsx         # ✅ Existant
│   ├── AlgorithmComparisonView.tsx     # ✅ Existant
│   ├── ValidationDashboard.tsx         # 🆕 NOUVEAU - Dashboard validation
│   └── ConvergenceVisualization.tsx    # 🆕 NOUVEAU - Graphiques convergence
└── stats/                              # 🆕 NOUVEAU - Module statistiques
    ├── convergence_validation.py       # Calculs Kendall/Pearson
    ├── hypothesis_testing.py           # Tests d'hypothèses spécifiques
    └── ranking_consistency.py          # Algorithmes de concordance
```

#### **Base de données étendue**

```sql
-- Nouvelles tables pour validation convergence

-- Historique des validations de convergence
CREATE TABLE convergence_validations (
  id SERIAL PRIMARY KEY,
  validation_date TIMESTAMP DEFAULT NOW(),
  corpus_version TEXT NOT NULL,

  -- Résultats de concordance
  kendall_tau_ac_li FLOAT,
  kendall_tau_ac_cognitive FLOAT,
  kendall_tau_li_cognitive FLOAT,
  overall_consistency FLOAT,

  -- Validation des hypothèses
  h1_action_effectiveness_validated BOOLEAN,
  h2_explanation_difficulty_validated BOOLEAN,
  h3_reflet_gradient_validated BOOLEAN,

  -- Métadonnées
  total_pairs_analyzed INTEGER,
  validation_config JSONB,
  convergence_status TEXT CHECK (convergence_status IN ('CONVERGENT', 'DIVERGENT'))
);

-- Détails par famille de stratégies
CREATE TABLE family_effectiveness_scores (
  id SERIAL PRIMARY KEY,
  validation_id INTEGER REFERENCES convergence_validations(id),
  strategy_family TEXT NOT NULL, -- 'REFLET', 'ENGAGEMENT', etc.

  -- Scores par niveau
  ac_effectiveness FLOAT,      -- % réactions positives (AC)
  li_effectiveness FLOAT,      -- Score composite LI
  cognitive_effectiveness FLOAT, -- Score composite Cognitif

  -- Détails supportant l'analyse
  sample_size INTEGER,
  confidence_interval_low FLOAT,
  confidence_interval_high FLOAT
);

-- Index pour performance
CREATE INDEX idx_convergence_date ON convergence_validations(validation_date);
CREATE INDEX idx_family_effectiveness ON family_effectiveness_scores(strategy_family, validation_id);
```

---

### 5. **Plan d'implémentation prioritaire**

#### **Phase 1 (Critique pour thèse) - 2 semaines**

1. **Module de calculs statistiques** (`stats/convergence_validation.py`)
   - Coefficient de Kendall τ
   - Corrélations de Pearson
   - Tests de significativité
2. **Hook de validation principale** (`useConvergenceValidation.ts`)
   - Interface TypeScript avec module Python
   - Gestion des seuils de validation
   - Export des résultats
3. **Dashboard minimal** (`ValidationDashboard.tsx`)
   - Statut convergence global
   - Matrice de concordance
   - Classements comparatifs

#### **Phase 2 (Enrichissement) - 1 semaine**

4. **Visualisations avancées** (`ConvergenceVisualization.tsx`)
   - Graphiques radar multi-niveaux
   - Courbes de concordance
   - Diagnostic de robustesse
5. **Tests d'hypothèses automatisés**
   - Validation H1, H2, H3 avec seuils
   - Rapport automatique de validation
   - Suggestions d'amélioration

#### **Phase 3 (Perfectionnement) - 1 semaine**

6. **Persistence et historique**
   - Tables validation en base
   - Versioning des corpus
   - Comparaisons diachroniques

---

### 🎯 Validation du modèle théorique

Cette extension statistique permettra de **valider empiriquement** les prédictions du modèle théorique intégré AC-LI-Cognitif :

**Critères de validation :**

- **τ de Kendall > 0.7** : Accord substantiel sur le classement d'efficacité
- **r de Pearson > 0.6** : Corrélation acceptable entre les niveaux
- **Convergence directionnelle > 80%** : Accord sur les tendances

**Hypothèses testées :**

- **H1** : ENGAGEMENT/OUVERTURE → efficacité par traitement automatique
- **H2** : EXPLICATION → inefficacité par surcharge cognitive
- **H3** : REFLET → gradient selon forme linguistique (VOUS > JE > ACQ)

Cette méthodologie statistique robuste transformera la recherche d'une simple observation de patterns vers une **validation scientifique rigoureuse** d'un modèle explicatif intégré. 🚀
