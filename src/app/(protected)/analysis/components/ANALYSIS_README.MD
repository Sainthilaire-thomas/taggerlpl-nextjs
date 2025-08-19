# 🏷️ TaggerLPL - Application Next.js

## 📋 Vue d'ensemble

TaggerLPL est une application Next.js sophistiquée dédiée au **tagging conversationnel** et à l'**analyse linguistique interactionnelle** avec un **framework unifié de métriques modulaires**. L'application combine une interface moderne de tagging avec des algorithmes avancés d'analyse conversationnelle et de sciences cognitives.

### 🎯 Objectifs principaux

- ✅ **Tagging conversationnel** : Interface complète de tagging des tours de parole
- ✅ **Analyse multimodale** : Métriques LI (Linguistique Interactionnelle) et Cognitives
- ✅ **Framework unifié** : Architecture modulaire pour algorithmes comparables
- ✅ **Machine Learning supervisé** : Algorithmes auto-améliorants avec annotation experte
- ✅ **Validation scientifique** : Validation croisée AC-LI-Cognitif pour recherche
- ✅ **Interface comparative** : Comparaison visuelle entre algorithmes

## 🏗️ Architecture technique

### Technologies utilisées

- **Framework** : Next.js 14+ (App Router)
- **UI** : Material-UI (MUI) + Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **CRM** : Intégration Zoho
- **État global** : React Context API
- **ML/NLP** : Python (spaCy, Transformers, scikit-learn)
- **Langue** : Interface en français

### Hiérarchie des Providers

```typescript
SupabaseProvider (session auth)
├── ThemeModeProvider (UI themes)
│   ├── ZohoProvider (CRM integration)
│   │   └── TaggingDataProvider (business logic)
│   │       ├── GlobalNavbar (navigation)
│   │       └── Pages
```

## 📁 Structure des fichiers

### Architecture générale

```
src/app/(protected)/
├── analysis/                           # 📊 CENTRE D'ANALYSE
│   ├── page.tsx                        # Page principale d'analyse
│   └── components/
│       ├── 📂 metrics-framework/       # 🔧 FRAMEWORK COMMUN
│       ├── 📂 li-metrics/             # 🗣️ LINGUISTIQUE INTERACTIONNELLE
│       ├── 📂 cognitive-metrics/      # 🧠 SCIENCES COGNITIVES
│       └── 📂 shared/                 # 🔗 COMPOSANTS PARTAGÉS
│
├── tagging/                            # 🏷️ INTERFACE CLASSIQUE
├── new-tagging/                        # 🚀 NOUVELLE INTERFACE
├── calls/                              # 📞 GESTION DES APPELS
├── tags/admin/                         # 🔧 ADMINISTRATION TAGS
└── dashboard/                          # 📈 TABLEAU DE BORD
```

### Framework de métriques modulaires

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
│   ├── useConvergenceValidation.ts     # 🆕 Validation croisée AC-LI-Cognitif
│   ├── useMetricsByFamily.ts           # Analyse par famille de stratégies
│   ├── useMLTraining.ts                # Entraînement modèles ML
│   └── usePerformanceMonitoring.ts     # Monitoring temps réel
│
├── 📂 components/
│   ├── MetricIndicatorCard.tsx         # Carte d'indicateur universelle
│   ├── AlgorithmComparisonView.tsx     # Comparaison algorithmes ligne par ligne
│   ├── AlgorithmLogicExplanation.tsx   # 🆕 Explication logique d'algorithme
│   ├── AnnotationInterface.tsx         # Interface annotation experte
│   ├── BenchmarkDashboard.tsx          # Dashboard performance comparative
│   ├── ValidationDashboard.tsx         # 🆕 Dashboard validation convergence
│   ├── ConvergenceVisualization.tsx    # 🆕 Graphiques convergence
│   ├── MetricsCategoryView.tsx         # Vue par catégorie d'indicateurs
│   ├── ABTestingInterface.tsx          # Interface A/B testing
│   ├── MLTrainingInterface.tsx         # Interface entraînement ML
│   └── PerformanceMonitor.tsx          # Monitoring en temps réel
│
├── 📂 utils/
│   ├── dataPreprocessing.ts            # Préprocessing données Supabase
│   ├── featureExtraction.ts            # Extraction features ML
│   ├── algorithmValidation.ts          # Validation et métriques qualité
│   ├── annotationHelpers.ts            # Utilitaires annotation
│   ├── performanceOptimization.ts      # Optimisations et cache
│   ├── mlHelpers.ts                    # Helpers ML/NLP
│   └── supabaseAdapter.ts              # Adaptateur données Supabase
│
├── 📂 stats/                           # 🆕 MODULE STATISTIQUES
│   ├── convergence_validation.py       # Calculs Kendall/Pearson
│   ├── hypothesis_testing.py           # Tests d'hypothèses spécifiques
│   └── ranking_consistency.py          # Algorithmes de concordance
│
└── 📂 database/
    ├── migrations/                     # Scripts création tables
    │   ├── 001_create_annotations.sql
    │   ├── 002_create_performance.sql
    │   ├── 003_create_ab_tests.sql
    │   └── 004_create_convergence.sql  # 🆕 Tables validation convergence
    └── schemas/
        ├── annotations.ts              # Types Supabase annotations
        ├── performance.ts              # Types Supabase performance
        └── convergence.ts              # 🆕 Types validation convergence
```

### Domaines spécialisés

```
li-metrics/                             # 🗣️ LINGUISTIQUE INTERACTIONNELLE
├── 📂 indicators/
│   ├── 📂 FeedbackAlignmentIndicator/  # ✅ IMPLÉMENTÉ
│   │   ├── algorithms/
│   │   │   ├── BasicAlignmentAlgorithm.ts      # Détection marqueurs basique
│   │   │   ├── SentimentEnhancedAlgorithm.ts   # Avec analyse sentiment
│   │   │   └── SequentialPatternAlgorithm.ts   # Patterns séquentiels
│   │   ├── hooks/
│   │   │   ├── useFeedbackAlignmentMetrics.ts  # Hook spécialisé
│   │   │   └── useFeedbackAlignmentAnnotation.ts
│   │   ├── FeedbackAlignmentInterface.tsx      # Interface utilisateur
│   │   └── types.ts                            # Types spécifiques
│   │
│   ├── 📂 CommonGroundIndicator/
│   │   ├── algorithms/
│   │   │   ├── BasicSharedRefsAlgorithm.ts     # Algorithme règles (corrigé)
│   │   │   ├── NLPEnhancedAlgorithm.ts         # Avec spaCy/Transformers
│   │   │   └── MLSupervisedAlgorithm.ts        # Machine Learning supervisé
│   │   └── ... (même structure)
│   │
│   ├── 📂 BackchannelsIndicator/       # 🔄 À IMPLÉMENTER
│   ├── 📂 ProsodicFluencyIndicator/    # 🔄 À IMPLÉMENTER
│   ├── 📂 SpeechRateIndicator/         # 🔄 À IMPLÉMENTER
│   ├── 📂 SequentialPatternsIndicator/ # 🔄 À IMPLÉMENTER
│   ├── 📂 RepairMechanismsIndicator/   # 🔄 À IMPLÉMENTER
│   └── 📂 CompositeLIScoreIndicator/   # 🔄 À IMPLÉMENTER
│
├── LIMetricsConfig.ts                  # Configuration domaine LI
├── LIMetricsRegistry.ts                # Registre spécialisé LI
└── LinguisticInteractionalMetrics.tsx  # Composant principal LI

cognitive-metrics/                      # 🧠 SCIENCES COGNITIVES
├── 📂 indicators/
│   ├── 📂 FluiditeCognitiveIndicator/  # 🔄 EN MIGRATION
│   │   ├── algorithms/
│   │   │   ├── BasicFluidityAlgorithm.ts       # Algorithme actuel migré
│   │   │   ├── NeuronMirrorAlgorithm.ts        # Basé neurones miroirs avancé
│   │   │   └── MLEnhancedAlgorithm.ts          # ML supervisé fluidité
│   │   └── ... (même structure)
│   │
│   ├── 📂 ReactionsDirectesIndicator/  # 🔄 À MIGRER
│   ├── 📂 ReprisesLexicalesIndicator/  # 🔄 À MIGRER
│   ├── 📂 ChargeCognitiveIndicator/    # 🔄 À MIGRER
│   ├── 📂 MarqueursEffortIndicator/    # 🔄 À MIGRER
│   ├── 📂 PatternsResistanceIndicator/ # 🔄 À MIGRER
│   ├── 📂 RobustesseStressIndicator/   # 🔄 À MIGRER
│   ├── 📂 NiveauStressIndicator/       # 🔄 À MIGRER
│   └── 📂 PositionConversationIndicator/ # 🔄 À MIGRER
│
├── CognitiveMetricsConfig.ts           # Configuration domaine Cognitive
├── CognitiveMetricsRegistry.ts         # Registre spécialisé Cognitive
├── CognitiveMetrics.tsx                # Composant principal Cognitive
│
└── 📂 migration/                       # 🔄 MIGRATION EXISTANT
    ├── adaptUseCognitiveMetrics.ts     # Adaptation hook existant
    ├── adaptIndicatorData.ts           # Migration données existantes
    ├── compatibilityLayer.ts           # Couche compatibilité
    └── migrationGuide.md               # Guide migration step-by-step
```

### Composants partagés

```
shared/                                 # 🔗 COMPOSANTS PARTAGÉS
├── 📂 atoms/                          # ⚛️ COMPOSANTS ATOMIQUES
│   ├── IndicatorHeader.tsx            # En-tête d'indicateur standardisé
│   ├── ColorLegend.tsx                # Légende de couleurs avec seuils
│   ├── ScoreChip.tsx                  # Puce d'affichage de score colorée
│   ├── AlgorithmDetailDialog.tsx      # Dialog détails algorithme
│   ├── MetricCard.tsx                 # Carte métrique simple
│   ├── LoadingSpinner.tsx             # Spinner de chargement uniforme
│   ├── ErrorAlert.tsx                 # Alerte d'erreur standardisée
│   ├── StatusBadge.tsx                # Badge de statut (actif/inactif/test)
│   ├── ThresholdIndicator.tsx         # Indicateur de seuil visuel
│   ├── ConfidenceBar.tsx              # Barre de confiance algorithme
│   ├── ProgressRing.tsx               # Anneau de progression circulaire
│   ├── ActionButton.tsx               # Bouton d'action standardisé
│   ├── InfoTooltip.tsx                # Tooltip d'information contextuelle
│   ├── DateDisplay.tsx                # Affichage de date formatée
│   └── index.ts                       # Export centralisé atoms
│
├── 📂 molecules/                      # 🧬 COMPOSANTS MOLÉCULAIRES
│   ├── ResultsTable.tsx               # Tableau de résultats uniforme
│   ├── AlgorithmLogicExplanation.tsx  # 🆕 Explication logique détaillée
│   ├── MetricComparisonCard.tsx       # Carte de comparaison métriques
│   ├── AnnotationInterface.tsx        # Interface annotation standardisée
│   ├── BenchmarkResultsDisplay.tsx    # Affichage résultats benchmark
│   ├── AlgorithmSelector.tsx          # Sélecteur d'algorithme avec preview
│   ├── FilterPanel.tsx                # Panneau de filtres réutilisable
│   ├── ExportControls.tsx             # Contrôles d'export standardisés
│   ├── PerformanceMetrics.tsx         # Métriques de performance temps réel
│   ├── ValidationStatus.tsx           # Statut de validation avec détails
│   ├── DataQualityIndicator.tsx       # Indicateur qualité des données
│   ├── SearchAndFilter.tsx            # Recherche et filtrage combinés
│   ├── PaginationControls.tsx         # Contrôles de pagination uniformes
│   ├── SortableHeader.tsx             # En-tête de colonne triable
│   ├── MetricsChart.tsx               # Graphique de métriques générique
│   ├── CorrelationMatrix.tsx          # Matrice de corrélation visuelle
│   ├── TrendChart.tsx                 # Graphique de tendance temporelle
│   ├── DistributionChart.tsx          # Graphique de distribution
│   ├── HeatmapVisualization.tsx       # Heatmap pour patterns
│   ├── NetworkGraph.tsx               # Graphique de réseau (relations)
│   └── index.ts                       # Export centralisé molecules
│
├── 📂 organisms/                      # 🦴 COMPOSANTS ORGANISMES
│   ├── MetricsDashboard.tsx           # Dashboard principal de métriques
│   ├── ComparativeAnalysisView.tsx    # Vue d'analyse comparative complète
│   ├── AnnotationWorkbench.tsx        # Workbench d'annotation experte
│   ├── ValidationReportView.tsx       # Vue rapport de validation
│   ├── PerformanceMonitoringPanel.tsx # Panneau monitoring performance
│   ├── AlgorithmBenchmarkSuite.tsx    # Suite complète de benchmark
│   ├── DataExplorationInterface.tsx   # Interface d'exploration données
│   ├── QualityAssurancePanel.tsx      # Panneau assurance qualité
│   ├── ConfigurationManager.tsx       # Gestionnaire de configuration
│   ├── AuditTrailViewer.tsx          # Visualiseur piste d'audit
│   └── index.ts                       # Export centralisé organisms
│
├── 📂 hooks/                          # 🪝 HOOKS PARTAGÉS
│   ├── useAlgorithmDialog.ts          # 🔧 Gestion dialog algorithme
│   ├── useScientificReferences.ts     # 📚 Gestion références scientifiques
│   ├── useThemeMode.ts                # 🎨 Gestion thème dark/light
│   ├── useLocalStorage.ts             # 💾 Persistence locale
│   ├── useDebounce.ts                 # ⏱️ Debounce pour performance
│   ├── usePagination.ts               # 📄 Logique de pagination
│   ├── useSort.ts                     # 🔄 Logique de tri
│   ├── useFilter.ts                   # 🔍 Logique de filtrage
│   ├── useExport.ts                   # 📤 Export multi-formats
│   ├── useNotifications.ts            # 🔔 Système de notifications
│   ├── usePerformanceMonitoring.ts    # 📊 Monitoring performance
│   ├── useErrorHandler.ts             # ❌ Gestion centralisée erreurs
│   ├── useDataValidation.ts           # ✅ Validation données
│   ├── useCache.ts                    # 🗄️ Gestion cache intelligent
│   ├── useAsyncOperation.ts           # ⚡ Gestion opérations async
│   ├── usePolling.ts                  # 🔄 Polling automatique
│   ├── useWebSocket.ts                # 🔌 Connexions WebSocket
│   ├── useKeyboardShortcuts.ts        # ⌨️ Raccourcis clavier
│   ├── useAccessibility.ts            # ♿ Support accessibilité
│   ├── useAnalytics.ts                # 📈 Analytics et tracking
│   └── index.ts                       # Export centralisé hooks
│
├── 📂 utils/                          # 🛠️ UTILITAIRES PARTAGÉS
│   ├── dataTransformers.ts            # Transformations de données
│   ├── formatters.ts                  # Formatage (dates, nombres, etc.)
│   ├── validators.ts                  # Fonctions de validation
│   ├── calculators.ts                 # Calculs statistiques communs
│   ├── exportHelpers.ts               # Helpers d'export (PDF, CSV, etc.)
│   ├── colorUtils.ts                  # Utilitaires de couleur et thème
│   ├── performanceUtils.ts            # Optimisations de performance
│   ├── errorUtils.ts                  # Gestion et formatage erreurs
│   ├── typeGuards.ts                  # Type guards TypeScript
│   ├── arrayUtils.ts                  # Utilitaires de manipulation arrays
│   ├── objectUtils.ts                 # Utilitaires de manipulation objets
│   ├── stringUtils.ts                 # Utilitaires de traitement texte
│   ├── mathUtils.ts                   # Fonctions mathématiques avancées
│   ├── dateUtils.ts                   # Manipulation et formatage dates
│   ├── urlUtils.ts                    # Gestion d'URLs et routes
│   ├── localStorageUtils.ts           # Helpers localStorage/sessionStorage
│   ├── supabaseUtils.ts               # Utilitaires Supabase spécifiques
│   ├── chartUtils.ts                  # Configuration graphiques
│   ├── csvUtils.ts                    # Import/export CSV
│   ├── pdfUtils.ts                    # Génération PDF
│   └── index.ts                       # Export centralisé utils
│
├── 📂 types/                          # 📝 TYPES PARTAGÉS
│   ├── common.ts                      # Types communs application
│   ├── api.ts                         # Types API et responses
│   ├── ui.ts                          # Types interface utilisateur
│   ├── charts.ts                      # Types pour graphiques
│   ├── export.ts                      # Types pour exports
│   ├── validation.ts                  # Types pour validation
│   ├── performance.ts                 # Types monitoring performance
│   ├── analytics.ts                   # Types analytics et tracking
│   └── index.ts                       # Export centralisé types
│
├── 📂 constants/                      # 📊 CONSTANTES PARTAGÉES
│   ├── colors.ts                      # Palette de couleurs uniforme
│   ├── thresholds.ts                  # Seuils de validation/alertes
│   ├── routes.ts                      # Routes de l'application
│   ├── apiEndpoints.ts                # Endpoints API centralisés
│   ├── chartConfigs.ts                # Configurations graphiques par défaut
│   ├── exportFormats.ts               # Formats d'export supportés
│   ├── performanceMetrics.ts          # Métriques de performance cibles
│   ├── validationRules.ts             # Règles de validation communes
│   ├── errorMessages.ts               # Messages d'erreur standardisés
│   ├── notifications.ts               # Types et durées notifications
│   └── index.ts                       # Export centralisé constants
│
├── 📂 styles/                         # 🎨 STYLES PARTAGÉS
│   ├── theme.ts                       # Thème Material-UI personnalisé
│   ├── globalStyles.ts                # Styles globaux CSS-in-JS
│   ├── animations.ts                  # Animations réutilisables
│   ├── breakpoints.ts                 # Points de rupture responsive
│   ├── shadows.ts                     # Ombres et élévations
│   ├── typography.ts                  # Configuration typographique
│   ├── spacing.ts                     # Système d'espacement
│   └── index.ts                       # Export centralisé styles
│
├── 📂 contexts/                       # 🌐 CONTEXTES PARTAGÉS
│   ├── ThemeContext.tsx               # Contexte thème global
│   ├── NotificationContext.tsx        # Contexte notifications
│   ├── PerformanceContext.tsx         # Contexte monitoring performance
│   ├── ErrorBoundaryContext.tsx       # Contexte gestion erreurs
│   ├── AnalyticsContext.tsx           # Contexte analytics
│   └── index.ts                       # Export centralisé contexts
│
├── 📂 providers/                      # 🔌 PROVIDERS PARTAGÉS
│   ├── ThemeProvider.tsx              # Provider thème avec persistence
│   ├── NotificationProvider.tsx       # Provider notifications toast
│   ├── ErrorBoundaryProvider.tsx      # Provider error boundary global
│   ├── AnalyticsProvider.tsx          # Provider analytics et tracking
│   ├── PerformanceProvider.tsx        # Provider monitoring performance
│   └── index.ts                       # Export centralisé providers
│
└── 📂 layouts/                        # 📐 LAYOUTS PARTAGÉS
    ├── DashboardLayout.tsx            # Layout principal dashboard
    ├── AnalysisLayout.tsx             # Layout pages d'analyse
    ├── FullscreenLayout.tsx           # Layout plein écran
    ├── SplitPaneLayout.tsx            # Layout à panneaux divisés
    ├── TabLayout.tsx                  # Layout avec onglets
    ├── WizardLayout.tsx               # Layout assistant/wizard
    ├── ResponsiveLayout.tsx           # Layout responsive adaptatif
    └── index.ts                       # Export centralisé layouts
```

## 🚀 Composants principaux

### 1. **GlobalNavbar** - Navigation intelligente améliorée

**Localisation** : `@/components/layout/GlobalNavbar`

**Fonctionnalités clés** :

- **Navigation adaptative** : Comportement différent selon le type de page
- **Auto-hide intelligent** : Se masque lors du défilement vers le bas
- **Zone de détection** : Zone invisible de 20px en haut pour réafficher la navbar
- **Hauteur fixe** : 48px constant pour éviter les décalages

### 2. **TaggingDataProvider** - Gestion d'état globale

**Localisation** : `@/context/TaggingDataContext`

**Données gérées** :

```typescript
interface TaggingDataContextType {
  // Données principales
  taggingCalls: TaggingCall[];
  allTurnTagged: TaggedTurn[]; // 🆕 Pour analyse globale
  selectedTaggingCall: TaggingCall | null;
  taggingTranscription: Word[];
  taggedTurns: TaggedTurn[];
  tags: Tag[];

  // Actions de tagging
  addTag: (newTag: NewTag) => Promise<TaggedTurn | null>;
  deleteTurnTag: (id: number) => Promise<void>;
  calculateAllNextTurnTags: (callId: string) => Promise<number>;

  // Nouvelles fonctionnalités globales
  fetchAllTurnTagged: (filters?: GlobalTurnTaggedFilters) => Promise<void>;
  globalTurnTaggedStats: GlobalTurnTaggedStats;
  getFilteredTurnsForAnalysis: (
    filters?: GlobalTurnTaggedFilters
  ) => TaggedTurn[];
  refreshGlobalDataIfNeeded: () => Promise<void>;
}
```

### 3. **CallTableList** - Interface optimisée de gestion des appels

**Localisation** : `@/components/calls/CallTableList`

**Optimisations de performance** :

- **Cache intelligent** avec `useOptimizedCallData`
- **Actions en lot** avec `useBulkActions`
- **Interface responsive** avec cartes mobiles
- **Pagination automatique** pour contourner limitations Supabase

### 4. **🆕 FeedbackAlignmentInterface** - Analyse d'alignement conversationnel

**Localisation** : `@/components/analysis/components/li-metrics/indicators/FeedbackAlignmentIndicator/`

**Fonctionnalités avancées** :

- **Analyse par familles de tags** : REFLET, ENGAGEMENT, EXPLICATION, OUVERTURE
- **Classification des réactions client** : POSITIF, NEGATIF, NEUTRE
- **Algorithmes multiples** : BasicAlignment, SentimentEnhanced, SequentialPattern
- **Interface comparative** : Comparaison visuelle des algorithmes
- **Explication de logique** : Composant `AlgorithmLogicExplanation` détaillé
- **Données temps réel** : Gestion de tous les 3652+ enregistrements

### 5. **TagManager** - Gestion avancée des tags avec statistiques

**Localisation** : `@/components/tags/TagManager`

**Nouvelles fonctionnalités** :

- **Système de statistiques d'utilisation** complètes
- **Interface moderne** avec boutons d'action (📊 Info, ✏️ Edit, 🗑️ Delete)
- **Composant TagUsageStats** factorisé et réutilisable
- **Fusion intelligente** et réassignation de tags
- **Support thème adaptatif** complet

### 6. **📊 Centre d'Analyse** - Hub unifié d'analyse conversationnelle

**Localisation** : `app/(protected)/analysis/page.tsx`

**Architecture modulaire** :

```
📊 Feedback Alignment     # Analyse d'impact des stratégies
🔄 Common Ground         # Établissement terrain commun (À IMPLÉMENTER)
🧠 Fluidité Cognitive    # Analyse charge cognitive (EN MIGRATION)
📈 Validation Croisée    # 🆕 Convergence AC-LI-Cognitif
📋 Rapports Détaillés    # Génération de rapports PDF
```

### 7. **🆕 AlgorithmLogicExplanation** - Composant d'explication pédagogique

**Localisation** : `@/components/shared/molecules/AlgorithmLogicExplanation`

**Sections détaillées** :

- **🔄 Processus d'analyse** : Étapes avec exemples concrets
- **📊 Métriques calculées** : Formules et interprétations
- **🔬 Base théorique** : Références scientifiques
- **📈 Guide d'interprétation** : Échelles et conseils pratiques

## 🗄️ Base de données

### Tables principales (existantes)

```sql
-- Conversations taggées
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

-- Tags et familles
lpltag (
  id INTEGER PRIMARY KEY,
  label TEXT,
  family TEXT,                -- 🔑 CLÉ POUR ANALYSE
  originespeaker TEXT,        -- conseiller/client
  color TEXT,
  description TEXT
);

-- Appels
call (
  callid TEXT PRIMARY KEY,
  filename TEXT,
  filepath TEXT,
  origine TEXT,               -- 🔑 FILTRE D'ORIGINE
  duree INTEGER,
  is_tagging_call BOOLEAN,
  preparedfortranscript BOOLEAN
);
```

### 🆕 Nouvelles tables (Framework de métriques)

#### Système d'annotation unifié

```sql
-- Annotations expertes pour validation
CREATE TABLE metric_annotations (
  id SERIAL PRIMARY KEY,
  turn_id INTEGER REFERENCES turntagged(id),
  domain TEXT NOT NULL,              -- 'li' | 'cognitive'
  indicator_id TEXT NOT NULL,        -- 'feedback_alignment', 'common_ground', etc.
  human_label TEXT NOT NULL,         -- Annotation experte
  algorithm_prediction TEXT,         -- Prédiction algorithme
  algorithm_confidence FLOAT,        -- Confiance (0-1)
  annotator_id TEXT NOT NULL,

  -- Métadonnées annotation
  annotation_time_seconds INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  notes TEXT,

  -- Spécifique domaines
  cognitive_load_rating INTEGER,     -- Pour domaine cognitif (1-10)
  processing_type TEXT,              -- 'automatique', 'contrôlé', 'mixte'

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(turn_id, domain, indicator_id, annotator_id)
);
```

#### Performance et benchmarking

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

  -- Métriques opérationnelles
  processing_time_ms INTEGER,
  memory_usage_mb FLOAT,
  throughput_per_second FLOAT,

  -- Contexte test
  test_data_size INTEGER,
  test_date TIMESTAMP DEFAULT NOW(),
  configuration JSONB,

  UNIQUE(domain, indicator_id, algorithm_id, test_date)
);
```

#### 🆕 Validation croisée AC-LI-Cognitif

```sql
-- Historique des validations de convergence
CREATE TABLE convergence_validations (
  id SERIAL PRIMARY KEY,
  validation_date TIMESTAMP DEFAULT NOW(),
  corpus_version TEXT NOT NULL,

  -- Résultats de concordance (τ de Kendall)
  kendall_tau_ac_li FLOAT,
  kendall_tau_ac_cognitive FLOAT,
  kendall_tau_li_cognitive FLOAT,
  overall_consistency FLOAT,

  -- Validation des hypothèses théoriques
  h1_action_effectiveness_validated BOOLEAN,    -- ENGAGEMENT/OUVERTURE efficaces
  h2_explanation_difficulty_validated BOOLEAN,  -- EXPLICATION inefficaces
  h3_reflet_gradient_validated BOOLEAN,         -- Gradient REFLET VOUS>JE>ACQ

  -- Métadonnées
  total_pairs_analyzed INTEGER,
  convergence_status TEXT CHECK (convergence_status IN ('CONVERGENT', 'DIVERGENT'))
);

-- Détails par famille de stratégies
CREATE TABLE family_effectiveness_scores (
  id SERIAL PRIMARY KEY,
  validation_id INTEGER REFERENCES convergence_validations(id),
  strategy_family TEXT NOT NULL,     -- 'REFLET', 'ENGAGEMENT', 'EXPLICATION', 'OUVERTURE'

  -- Scores par niveau d'analyse
  ac_effectiveness FLOAT,            -- % réactions positives (Analyse Conversationnelle)
  li_effectiveness FLOAT,            -- Score composite LI
  cognitive_effectiveness FLOAT,     -- Score composite Cognitif

  -- Détails statistiques
  sample_size INTEGER,
  confidence_interval_low FLOAT,
  confidence_interval_high FLOAT
);
```

## 🔧 APIs principales

### Hook principal unifié

```typescript
// metrics-framework/hooks/useMetricsEngine.ts
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

    // Benchmarking et comparaison
    runBenchmark: (testData: AnnotatedData[]) => Promise<BenchmarkResults>,
    compareAlgorithms: (algorithms: string[]) => Promise<AlgorithmComparison>,

    // ML et optimisation
    trainMLModel: (indicatorId: string, trainingData: AnnotatedData[]) => Promise<TrainingResult>,
    deployModel: (indicatorId: string, modelVersion: string) => Promise<void>,

    // 🆕 Validation croisée
    validateConvergence: (config: ConvergenceConfig) => Promise<ConvergenceResults>,
    getConvergenceHistory: () => ConvergenceValidation[],
  };
};
```

### 🆕 Hook de validation convergence

```typescript
// metrics-framework/hooks/useConvergenceValidation.ts
export const useConvergenceValidation = (
  config: ConvergenceValidationConfig
) => {
  return {
    // Calculs de convergence
    calculateRankingConsistency: () => KendallResults,
    calculateEffectivenessCorrelations: () => PearsonResults,
    validateDirectionalAgreement: () => DirectionalResults,

    // Tests d'hypothèses spécifiques
    testH1ActionEffectiveness: () => ValidationResult, // ENGAGEMENT/OUVERTURE
    testH2ExplanationDifficulty: () => ValidationResult, // EXPLICATION
    testH3RefletGradient: () => ValidationResult, // REFLET gradient

    // Synthèse et recommandations
    generateValidationReport: () => ConvergenceReport,
    suggestModelRefinements: () => ImprovementSuggestions,
  };
};
```

### Hook spécialisé FeedbackAlignment

```typescript
// li-metrics/indicators/FeedbackAlignmentIndicator/hooks/useFeedbackAlignmentMetrics.ts
export const useFeedbackAlignmentMetrics = (config) => {
  return {
    // Données analysées
    data: TaggedTurn[],
    tableRows: TableRow[],
    analysisResults: AlignmentAnalysis,
    stats: AlignmentStats,

    // État
    isLoading: boolean,
    isAnalyzing: boolean,
    error: string | null,

    // Actions
    runAnalysis: () => Promise<void>,
    refreshData: () => Promise<void>,

    // Méta informations
    dataCount: number,
    hasData: boolean,
    sourceDataCount: number,

    // Diagnostics pour debug
    debugInfo: {
      families: string[],
      nextTurnTags: string[],
      origines: string[]
    }
  };
};
```

## 🚀 Fonctionnalités récentes (2024)

### ✅ **Feedback Alignment Interface** (Décembre 2024)

- **Analyse complète** : Traitement de tous les 3652+ enregistrements
- **Algorithme par familles** : Classification basée sur `lpltag.family` au lieu du speaker
- **Pagination Supabase** : Contournement de la limite 1000 avec pagination automatique
- **Interface pédagogique** : Explication détaillée de la logique d'algorithme
- **Résultats temps réel** :
  - OUVERTURE: 48.3% d'alignement positif ⭐ (meilleure stratégie)
  - ENGAGEMENT: 34.5% d'alignement positif
  - REFLET: 18.2% d'alignement positif
  - EXPLICATION: 1.0% d'alignement positif ❌ (confirme l'hypothèse)

### 🔄 **Framework de métriques modulaires** (En cours)

- **Architecture unifiée** : Base commune pour LI et métriques cognitives
- **Algorithmes comparables** : Interface standardisée de comparaison
- **Annotation supervisée** : Workflow d'annotation experte intégré
- **Machine Learning** : Entraînement de modèles supervisés

### 🆕 **Validation croisée AC-LI-Cognitif** (Planifié 2025)

- **Tests statistiques** : Coefficients de Kendall, corrélations de Pearson
- **Validation d'hypothèses** : Tests automatisés des hypothèses théoriques
- **Dashboard de convergence** : Interface de validation scientifique
- **Méthodogie rigoureuse** : Validation empirique du modèle théorique intégré

## 📊 Métriques et résultats

### Performances système

- **Données source** : 3652 enregistrements turntagged
- **Temps de traitement** : <2s pour analyse complète
- **Cache intelligent** : Invalidation automatique, stats de performance
- **Interface responsive** : Support mobile/desktop complet

### Résultats scientifiques (FeedbackAlignment)

```
📊 Résultats d'efficacité par stratégie (sur 1397 tours analysés):

🥇 OUVERTURE:    48.3% d'alignement positif  (175 occurrences)
🥈 ENGAGEMENT:   34.5% d'alignement positif  (182 occurrences)
🥉 REFLET:       18.2% d'alignement positif  (444 occurrences)
❌ EXPLICATION:   1.0% d'alignement positif  (596 occurrences)

📈 Score global: 16.3% (confirme hypothèse: stratégies ACTION > EXPLICATION)
📊 Couverture: 72.0% (1006 réponses client analysées sur 1397 tours)
```

### Hypothèses validées

- ✅ **H1 : Efficacité des stratégies d'action** - OUVERTURE et ENGAGEMENT génèrent plus d'alignement
- ✅ **H2 : Inefficacité de l'EXPLICATION** - Seulement 1% d'alignement positif
- 🔄 **H3 : Gradient REFLET** - En cours d'analyse (nécessite sous-classification)

## 🎯 Roadmap 2025

### Q1 2025 : Migration complète framework

- [ ] Migration complète des métriques cognitives vers architecture modulaire
- [ ] Implémentation des indicateurs LI restants (Common Ground, Backchannels, etc.)
- [ ] Interface d'annotation experte opérationnelle
- [ ] Premiers modèles ML supervisés

### Q2 2025 : Validation scientifique

- [ ] Collecte 1000+ annotations expertes par indicateur
- [ ] Validation croisée AC-LI-Cognitif avec tests statistiques
- [ ] Dashboard de convergence et validation d'hypothèses
- [ ] Publication des résultats de validation

### Q3 2025 : Optimisation et production

- [ ] A/B testing automatique entre algorithmes
- [ ] Monitoring performance temps réel
- [ ] Optimisations avancées (cache multi-niveaux, workers)
- [ ] API publique pour intégrations externes

### Q4 2025 : Extensions avancées

- [ ] Analyse multimodale (audio + texte)
- [ ] Intégration NLP avancée (Transformers, spaCy)
- [ ] Système de recommandations personnalisées
- [ ] Export vers systèmes tiers (CRM, Analytics)

## 🛠️ Installation et développement

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase configuré
- Accès aux données TaggerLPL

### Installation

```bash
# 1. Cloner le repository
git clone [repo-url]
cd taggerlpl-nextjs

# 2. Installer les dépendances
npm install

# 3. Configuration environnement
cp .env.example .env.local
# Remplir les variables Supabase

# 4. Lancement développement
npm run dev
```

### Structure de développement

```bash
# Tests
npm test                    # Tests unitaires
npm run test:integration    # Tests d'intégration

# Qualité code
npm run lint               # ESLint
npm run format             # Prettier
npm run type-check         # TypeScript

# Build production
npm run build              # Build optimisé
npm run start              # Serveur production
```

### 🆕 Setup Framework de métriques

```bash
# 1. Créer structure métrics-framework
mkdir -p src/app/\(protected\)/analysis/components/metrics-framework/{core,hooks,components,utils,database}

# 2. Setup base de données
# Exécuter scripts migration dans Supabase Dashboard
# Tables: metric_annotations, algorithm_performance, convergence_validations

# 3. Test basique framework
import { useMetricsEngine } from "@/components/metrics-framework/hooks/useMetricsEngine";

const TestComponent = () => {
  const { indicators, loading, error } = useMetricsEngine({ domain: "li" });
  return
```
