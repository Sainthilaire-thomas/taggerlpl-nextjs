# 📊 TaggerLPL - Architecture Analysis - Arborescence Complète

## 📋 Vue d'ensemble

Ce document décrit l'arborescence complète du module `/analysis` de TaggerLPL avec le statut de chaque composant.

**Légende :**

- ✅ **Existe** : Implémenté et fonctionnel
- ⚠️ **Obsolète** : Ancien code à migrer/supprimer
- 🔄 **En transition** : Partiellement implémenté, en cours de migration
- ❌ **À faire** : Planifié mais non implémenté
- 🧪 **Expérimental** : Prototype ou test

---

## 🗂️ Structure complète avec descriptions fonctionnelles

```
src/app/(protected)/analysis/
├── page.tsx                                    ✅ Page principale avec système d'onglets (AC/LI/Cognitif/Convergence)
├── components/
│   │
│   ├── 📊 ANALYSE CONVERSATIONNELLE (AC) - Métriques empiriques existantes
│   ├── DebugFunnel.tsx                         ✅ Analyse complète tags turntagged→lpltag + détection manquants
│   ├── ImprovedGlobalMetrics.tsx               ✅ Métriques globales système (total tags, familles, usage)
│   ├── GlobalMetricsCard.tsx                   ✅ Cartes visuelles métriques avec icônes et couleurs
│   ├── TagFamilyAnalysis.tsx                   ✅ Analyse détaillée par famille de stratégies
│   ├── ConversationalFlowsAnalysis.tsx         ❌ Diagrammes Sankey flux conversationnels (Recharts)
│   ├── DetailedReportsGeneration.tsx           ❌ Génération rapports PDF/PNG pour insertion thèse
│   │
│   ├── 🧠 SCIENCES COGNITIVES - Mécanismes cognitifs selon thèse 3.3.4
│   ├── cognitive-metrics/
│   │   ├── CognitiveMetrics.tsx                ✅ Interface principale conforme thèse avec 9 indicateurs
│   │   ├── CognitiveMetricsRegistry.tsx        ✅ Registre spécialisé cognitif + validation migration
│   │   ├── README.MD                           ✅ Documentation état avancement + roadmap détaillée
│   │   ├── types.ts                           ✅ Types TypeScript spécialisés + interfaces métier
│   │   ├── indicatorData.ts                   ✅ Données centralisées indicateurs + formules théoriques
│   │   │
│   │   ├── components/ - Composants réutilisables UI
│   │   │   ├── index.ts                       ✅ Exports centralisés composants
│   │   │   ├── MetricBox.tsx                  ✅ Composant atomique métrique (titre/valeur/action)
│   │   │   └── indicatorCard.tsx              ✅ Carte regroupement métriques par catégorie
│   │   │
│   │   ├── hooks/ - Logique métier hooks spécialisés
│   │   │   ├── useCognitiveMetrics.ts         ✅ Hook calculs métriques cognitives complètes
│   │   │   └── useCognitiveMetricsByFamily.ts ✅ Hook analyse impact par famille stratégies
│   │   │
│   │   ├── indicators/ - Indicateurs modulaires (1 implémenté, 8 à faire)
│   │   │   ├── FluiditeCognitiveIndicator.ts  ✅ Indicateur complet migré (2 algorithmes + benchmark)
│   │   │   ├── ReactionsDirectesIndicator/    ❌ % réactions immédiates sans clarification
│   │   │   ├── ReprisesLexicalesIndicator/    ❌ Alignement linguistique verbes d'action
│   │   │   ├── ChargeCognitiveIndicator/      ❌ Effort mental traitement métaphores
│   │   │   ├── MarqueursEffortIndicator/      ❌ Hésitations linguistiques ("euh", "attendez")
│   │   │   ├── PatternsResistanceIndicator/   ❌ Interruptions, objections, évitement
│   │   │   ├── RobustesseStressIndicator/     ❌ Performance en contexte émotionnel tendu
│   │   │   ├── NiveauStressIndicator/         ❌ Stress cumulé historique conversationnel
│   │   │   └── PositionConversationIndicator/ ❌ Impact séquentialité sur efficacité
│   │   │
│   │   └── migration/ - Migration douce sans casser existant
│   │       ├── CognitiveMetricsMigration.tsx  ✅ Interface basculement legacy↔framework unifié
│   │       ├── adaptUseCognitiveMetrics.ts    ✅ Adapter hook existant vers nouveau framework
│   │       └── test.ts                        🧪 Fichier test basique (placeholder)
│   │
│   ├── 🗣️ LINGUISTIQUE INTERACTIONNELLE (LI) - Théories Pickering/Garrod
│   ├── li-metrics/                             ❌ Domaine LI complet neurones miroirs
│   │   ├── LinguisticInteractionalMetrics.tsx ❌ Interface principale LI (équivalent cognitive)
│   │   ├── LIMetricsConfig.ts                 ❌ Configuration théories LI (Common Ground, etc)
│   │   ├── LIMetricsRegistry.ts               ❌ Registre spécialisé domaine LI
│   │   │
│   │   └── indicators/ - 8 indicateurs LI théories interactionnelles
│   │       ├── CommonGroundIndicator/ - Terrain d'entente conversationnel
│   │       │   ├── index.ts                   ❌ Export principal indicateur
│   │       │   ├── CommonGroundIndicator.tsx  ❌ Interface utilisateur CG
│   │       │   ├── algorithms/
│   │       │   │   ├── BasicSharedRefsAlgorithm.ts  ❌ Algorithme règles (actuel corrigé)
│   │       │   │   ├── NLPEnhancedAlgorithm.ts      ❌ Avec spaCy/Transformers avancé
│   │       │   │   └── MLSupervisedAlgorithm.ts     ❌ Machine Learning supervisé
│   │       │   ├── components/
│   │       │   │   ├── CGResultsDisplay.tsx         ❌ Affichage résultats CG spécialisé
│   │       │   │   ├── CGAnnotationInterface.tsx    ❌ Interface annotation experte CG
│   │       │   │   └── CGAlgorithmComparison.tsx    ❌ Comparaison algorithmes CG
│   │       │   └── hooks/
│   │       │       ├── useCommonGroundMetrics.ts    ❌ Hook spécialisé logique CG
│   │       │       └── useCommonGroundAnnotation.ts ❌ Workflow annotation CG
│   │       │
│   │       ├── FeedbackAlignmentIndicator/    ❌ Alignement marqueurs feedback (Pickering)
│   │       ├── BackchannelsIndicator/         ❌ Signaux d'écoute ("mm", "oui", "ah")
│   │       ├── ProsodicFluencyIndicator/      ❌ Fluidité prosodique (analyse audio)
│   │       ├── SpeechRateIndicator/           ❌ Débit parole synchronisation
│   │       ├── SequentialPatternsIndicator/   ❌ Patterns séquentiels conversation
│   │       ├── RepairMechanismsIndicator/     ❌ Mécanismes réparation malentendus
│   │       └── CompositeLIScoreIndicator/     ❌ Score composite LI pondéré
│   │
│   ├── 🔧 FRAMEWORK UNIFIÉ - Architecture modulaire multi-domaines
│   ├── metrics-framework/
│   │   ├── core/ - Classes de base framework
│   │   │   ├── MetricsRegistry.ts             ✅ Registre universel indicateurs (indexation/recherche)
│   │   │   ├── BaseIndicator.ts               ✅ Classe abstraite tous indicateurs + algorithmes
│   │   │   └── types/
│   │   │       └── base.ts                    ✅ Types fondamentaux (domains/algorithms/results)
│   │   │
│   │   ├── hooks/ - Hooks React spécialisés framework
│   │   │   ├── useMetricsEngine.ts            ✅ Hook principal unifié 800+ lignes (cœur système)
│   │   │   ├── useIndicatorRegistry.ts        ❌ Gestion dynamique registre indicateurs
│   │   │   ├── useAlgorithmBenchmarking.ts    ❌ Système benchmark automatique
│   │   │   ├── useAnnotationWorkflow.ts       ❌ Workflow annotation supervisée
│   │   │   ├── useMetricsByFamily.ts          ❌ Analyse par famille stratégies
│   │   │   ├── useMLTraining.ts               ❌ Entraînement modèles ML
│   │   │   └── usePerformanceMonitoring.ts    ❌ Monitoring performance temps réel
│   │   │
│   │   ├── components/ - Interface utilisateur framework
│   │   │   ├── MetricIndicatorCard.tsx        ❌ Carte indicateur universelle
│   │   │   ├── AlgorithmComparisonView.tsx    ❌ Comparaison algorithmes ligne par ligne
│   │   │   ├── AnnotationInterface.tsx        ❌ Interface annotation experte
│   │   │   ├── BenchmarkDashboard.tsx         ❌ Dashboard performance comparative
│   │   │   ├── MetricsCategoryView.tsx        ❌ Vue par catégorie indicateurs
│   │   │   ├── ABTestingInterface.tsx         ❌ Interface A/B testing production
│   │   │   ├── MLTrainingInterface.tsx        ❌ Interface entraînement ML
│   │   │   └── PerformanceMonitor.tsx         ❌ Monitoring temps réel
│   │   │
│   │   ├── utils/ - Utilitaires techniques framework
│   │   │   ├── dataPreprocessing.ts           ❌ Préprocessing données Supabase
│   │   │   ├── featureExtraction.ts           ❌ Extraction features ML/NLP
│   │   │   ├── algorithmValidation.ts         ❌ Validation et métriques qualité
│   │   │   ├── annotationHelpers.ts           ❌ Utilitaires annotation
│   │   │   ├── performanceOptimization.ts     ❌ Optimisations et cache
│   │   │   ├── mlHelpers.ts                   ❌ Helpers ML/NLP (spaCy/Transformers)
│   │   │   └── supabaseAdapter.ts             ❌ Adaptateur données Supabase
│   │   │
│   │   ├── database/ - Base de données framework
│   │   │   ├── migrations/ - Scripts SQL création tables
│   │   │   │   ├── 001_create_annotations.sql ❌ Table annotations expertes
│   │   │   │   ├── 002_create_performance.sql ❌ Table performance algorithmes
│   │   │   │   └── 003_create_ab_tests.sql    ❌ Table A/B tests production
│   │   │   └── schemas/ - Types Supabase auto-générés
│   │   │       ├── annotations.ts             ❌ Types annotations
│   │   │       └── performance.ts             ❌ Types performance
│   │   │
│   │   └── index.ts                           ✅ Point d'entrée unifié + exports
│   │
│   ├── 📊 VALIDATION CONVERGENCE - Extension spécifique thèse chapitre 3.3
│   ├── convergence-validation/                ❌ Tests convergence AC↔LI↔Cognitif
│   │   ├── ConvergenceValidationEngine.ts     ❌ Moteur validation croisée niveaux
│   │   ├── ValidationDashboard.tsx            ❌ Dashboard convergence avec alertes
│   │   ├── ConvergenceVisualization.tsx       ❌ Graphiques radar + courbes concordance
│   │   ├── HypothesisTestingInterface.tsx     ❌ Tests automatisés H1/H2/H3
│   │   ├── stats/ - Scripts Python statistiques
│   │   │   ├── convergence_validation.py      ❌ Calculs Kendall τ / Pearson r
│   │   │   ├── hypothesis_testing.py          ❌ Tests hypothèses automatisés
│   │   │   └── ranking_consistency.py         ❌ Algorithmes concordance classements
│   │   └── types.ts                           ❌ Types spécifiques validation
│   │
│   ├── 🔗 COMPOSANTS PARTAGÉS - Réutilisables entre domaines
│   ├── shared/
│   │   ├── FamilyAnalysisView.tsx             ❌ Vue analyse par famille stratégies
│   │   ├── SupabaseDataAdapter.tsx            ❌ Adaptateur données Supabase générique
│   │   ├── PerformanceMonitor.tsx             ❌ Monitoring performance global
│   │   └── ExpertAnnotationGuide.tsx          ❌ Guide annotation pour experts
│   │
│   ├── 🧪 TESTS ET INTÉGRATION
│   ├── TestFrameworkIntegration.tsx           🧪 Tests intégration framework (prototype)
│   │
│   └── 📚 DOCUMENTATION
       ├── ANALYSIS_README.MD                 ✅ Architecture unifiée complète + roadmap
       └── analysis-guide.md                  ❌ Guide utilisateur final framework
```

---

## 📊 Analyse des statuts

### ✅ **Composants existants (23 fichiers)**

#### **Domaine Cognitif (Fonctionnel)**

- `CognitiveMetrics.tsx` - Interface complète selon thèse 3.3.4
- `CognitiveMetricsRegistry.tsx` - Registre spécialisé opérationnel
- `hooks/useCognitiveMetrics.ts` - Hook avec calculs avancés
- `hooks/useCognitiveMetricsByFamily.ts` - Analyse par famille
- `components/MetricBox.tsx` - Composant atomique réutilisable
- `components/IndicatorCard.tsx` - Cartes d'indicateurs
- `indicators/FluiditeCognitiveIndicator.ts` - Premier indicateur migré
- `migration/CognitiveMetricsMigration.tsx` - Interface de migration
- `migration/adaptUseCognitiveMetrics.ts` - Adaptation legacy

#### **Framework Unifié (Base solide)**

- `metrics-framework/core/MetricsRegistry.ts` - Registre central fonctionnel
- `metrics-framework/core/BaseIndicator.ts` - Architecture modulaire
- `metrics-framework/core/types/base.ts` - Types complets
- `metrics-framework/hooks/useMetricsEngine.ts` - Hook principal 800+ lignes
- `metrics-framework/index.ts` - Point d'entrée unifié

#### **Analyse Conversationnelle (Opérationnel)**

- `DebugFunnel.tsx` - Analyse des tags existants
- `ImprovedGlobalMetrics.tsx` - Métriques globales
- `GlobalMetricsCard.tsx` - Interface cartes
- `TagFamilyAnalysis.tsx` - Analyse par famille

### ❌ **À développer prioritairement**

#### **Phase 1 - Framework Core (2-3 semaines)**

- `metrics-framework/components/` - 8 composants d'interface
- `metrics-framework/hooks/` - 6 hooks spécialisés
- `metrics-framework/utils/` - 7 utilitaires ML/performance
- `metrics-framework/database/` - Migrations et schémas

#### **Phase 2 - Domaine LI (3-4 semaines)**

- `li-metrics/` - Domaine complet (8 indicateurs)
- Common Ground, Feedback Alignment, Backchannels
- Algorithmes NLP + ML supervisé
- Interface annotation experte

#### **Phase 3 - Validation Convergence (2 semaines)**

- `convergence-validation/` - Extension thèse
- Tests statistiques (Kendall, Pearson)
- Validation H1, H2, H3
- Graphiques radar et visualisations

### 🔄 **En transition (Migration continue)**

#### **CognitiveMetrics**

- ✅ Interface moderne avec thèse
- ❌ 8/9 indicateurs manquants
- ❌ Algorithmes ML supervisé

#### **Framework Unifié**

- ✅ Architecture solide
- ❌ Components UI manquants
- ❌ Système d'annotation absent

---

## 🎯 Roadmap recommandée

### **Semaines 1-2 : Framework Core**

```
Priorité CRITIQUE :
├── metrics-framework/components/AlgorithmComparisonView.tsx
├── metrics-framework/components/AnnotationInterface.tsx
├── metrics-framework/hooks/useAnnotationWorkflow.ts
└── metrics-framework/database/migrations/
```

### **Semaines 3-4 : Indicateurs Cognitifs**

```
Compléter domaine cognitif :
├── cognitive-metrics/indicators/ReactionsDirectesIndicator/
├── cognitive-metrics/indicators/ChargeCognitiveIndicator/
├── cognitive-metrics/indicators/PatternsResistanceIndicator/
└── Algorithmes ML pour FluiditeCognitive
```

### **Semaines 5-6 : Domaine LI**

```
Nouveau domaine complet :
├── li-metrics/indicators/CommonGroundIndicator/
├── li-metrics/indicators/FeedbackAlignmentIndicator/
├── Correction algorithme Common Ground
└── Interface annotation spécialisée LI
```

### **Semaines 7-8 : Validation Convergence**

```
Extension pour thèse :
├── convergence-validation/ConvergenceValidationEngine.ts
├── convergence-validation/stats/convergence_validation.py
├── Tests statistiques automatisés
└── Graphiques validation H1/H2/H3
```

---

## 💡 Points d'attention

### **🔥 Blocages potentiels**

- **Types conflictuels** : Éviter doublons interface/composant
- **Material-UI Grid** : Utiliser Box+Flexbox (versions MUI)
- **Props optionnelles** : Définir interfaces complètes
- **Cache framework** : Gestion mémoire avec gros volumes

### **✅ Forces actuelles**

- **Architecture modulaire** solide et extensible
- **Domaine cognitif** fonctionnel selon thèse
- **Système de cache** intelligent implémenté
- **Migration douce** sans casser l'existant
- **Types TypeScript** complets et cohérents

### **🚀 Opportunités**

- **ML supervisé** : Algorithmes auto-améliorants
- **Validation scientifique** : Convergence multi-niveaux
- **Interface moderne** : Comparaison visuelle algorithmes
- **Extensibilité** : Framework réutilisable autres projets

---

## 📞 Pour la prochaine session

### **Décisions à prendre :**

1. **Priorité** : Framework core vs nouveaux indicateurs ?
2. **ML** : Intégration Python/spaCy ou tout en JS ?
3. **Base de données** : Nouvelles tables ou adapter existant ?
4. **Interface** : Focus thèse vs framework générique ?

### **État actuel :**

- **23 fichiers** opérationnels
- **1 domaine** complet (Cognitif)
- **Framework** architectural solide
- **Migration** douce préservée
- **Documentation** à jour

**Prêt pour développement Phase 1** 🚀
