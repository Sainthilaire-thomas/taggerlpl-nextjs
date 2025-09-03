## Arborescence Actuelle d'AlgorithmLab (État des lieux)

```
src/app/(protected)/analysis/components/AlgorithmLab/
├── README.md                                    # Documentation principale
├── ALGORITHMLAB_MultiClassifiers.MD             # Documentation multi-classificateurs
├── index.ts                                     # Exports principaux
│
├── types/                                       # Types TypeScript
│   ├── Level0Types.ts                           # Types accord inter-annotateur
│   ├── Level1Types.ts                           # Types validation technique
│   ├── Level2Types.ts                           # Types validation scientifique
│   └── SharedTypes.ts                           # Types communs
│
├── components/                                  # Composants UI
│   ├── Level0/                                  # ✅ Gold Standard
│   │   └── InterAnnotatorAgreement.tsx         # Dashboard accord experts
│   ├── Level1/                                  # ✅ Validation technique
│   │   ├── Level1Interface.tsx                 # Navigation L1
│   │   ├── individual/                         # Analyse approfondie
│   │   │   ├── TechnicalValidation/            # Module refactorisé
│   │   │   ├── ConfusionMatrix.tsx             # Matrice confusion
│   │   │   ├── EnhancedErrorAnalysis.tsx       # Analyse erreurs
│   │   │   └── ParameterOptimization.tsx       # Fine-tuning
│   │   ├── comparison/                         # Comparaison multi-algo
│   │   │   ├── AlgorithmComparison.tsx         # Benchmark
│   │   │   ├── ClassifierConfiguration.tsx     # Configuration
│   │   │   └── CrossValidation.tsx             # K-fold validation
│   │   └── TechnicalBenchmark.tsx              # Synthèse
│   ├── Level2/                                  # ✅ Validation scientifique
│   │   ├── Level2Interface.tsx                 # Navigation L2
│   │   └── validation/                         # Tests hypothèses
│   └── shared/                                  # Composants partagés
│       ├── AlgorithmLabInterface.tsx           # Interface principale
│       ├── NavigationTabs.tsx                  # Onglets 3 niveaux
│       └── ClassifierSelector.tsx              # Sélecteur avancé
│
├── algorithms/                                  # Algorithmes par niveau
│   ├── level0/                                  # ✅ Gold Standard
│   │   └── InterAnnotatorKappa.ts              # Calcul Kappa
│   ├── level1/                                  # ✅ Multi-classificateurs
│   │   ├── shared/                             # Infrastructure commune
│   │   │   ├── BaseClassifier.ts               # Interface unifiée
│   │   │   ├── ClassifierRegistry.ts           # Enregistrement
│   │   │   └── initializeClassifiers.ts        # Auto-init
│   │   ├── conseillerclassifiers/              # Classifications conseiller
│   │   │   ├── RegexConseillerClassifier.ts    # Règles adaptées
│   │   │   ├── SpacyConseillerClassifier.ts    # ML API
│   │   │   └── OpenAIConseillerClassifier.ts   # LLM GPT
│   │   └── clientclassifiers/                  # Classifications client
│   │       └── RegexClientClassifier.ts        # Réactions client
│   └── shared/                                  # Algorithmes communs
│       └── StatisticalTestSuite.ts             # Tests statistiques
│
├── hooks/                                       # Hooks React
│   ├── useLevel0Validation.ts                  # Validation Kappa
│   ├── useLevel1Testing.ts                     # Tests techniques réécrit
│   └── useWorkflowManagement.ts                # Workflow séquentiel
│
└── utils/                                       # Utilitaires
    ├── statisticalTests.ts                     # Tests Chi², Kappa
    ├── metricsCalculation.ts                   # Precision/Recall/F1
    └── goldStandardManager.ts                  # Gestion corpus référence
```

## Nouvelle Structure Proposée (Adaptée aux variables de la thèse)

```
src/app/(protected)/analysis/components/AlgorithmLab/
├── README.md                                    # Documentation mise à jour
├── types/
│   ├── ThesisVariables.ts                      # X, Y, M1, M2, M3 + métadonnées
│   ├── Level0Types.ts                          # Gold standard X et Y
│   ├── Level1Types.ts                          # Algorithmes X, Y, M1, M2, M3
│   ├── Level2Types.ts                          # Tests H1, H2, médiation
│   └── ValidationTypes.ts                      # Interfaces de vérification
│
├── components/
│   ├── Level0/                                 # 🎯 Création Gold Standard (X, Y)
│   │   ├── GoldStandardCreation/               # NOUVEAU
│   │   │   ├── SampleSelection.tsx             # Sélection échantillon stratifié
│   │   │   ├── DoubleAnnotationInterface.tsx   # Interface double annotation
│   │   │   ├── DisagreementResolution.tsx     # Résolution désaccords
│   │   │   └── GoldStandardValidation.tsx     # Certification finale
│   │   ├── InterAnnotatorAgreement.tsx        # Kappa et métriques
│   │   └── CorpusMetadata.tsx                 # Documentation constitution
│   │
│   ├── Level1/                                 # 🎯 Test Algorithmes (X, Y, M1, M2, M3)
│   │   ├── Level1Interface.tsx                # Navigation organisée par variable
│   │   ├── algorithms/                        # RÉORGANISÉ PAR VARIABLE CIBLE
│   │   │   ├── XClassifiers/                  # Algorithmes pour X (stratégies)
│   │   │   │   ├── XAlgorithmTesting.tsx      # Interface test X
│   │   │   │   ├── XValidationInterface.tsx   # Verbatim → Tag vs Gold
│   │   │   │   └── XConfusionMatrix.tsx       # Matrice confusion X
│   │   │   ├── YClassifiers/                  # Algorithmes pour Y (réactions)
│   │   │   │   ├── YAlgorithmTesting.tsx      # Interface test Y
│   │   │   │   ├── YValidationInterface.tsx   # Next_turn → Tag vs Gold
│   │   │   │   └── YConfusionMatrix.tsx       # Matrice confusion Y
│   │   │   ├── M1Calculators/                 # Algorithmes pour M1 (verbes action)
│   │   │   │   ├── M1AlgorithmTesting.tsx     # Interface test M1
│   │   │   │   ├── M1ValidationInterface.tsx  # Verbatim → Score M1 + visualisation
│   │   │   │   └── M1VerbHighlighting.tsx     # Surlignage verbes détectés
│   │   │   ├── M2Calculators/                 # Algorithmes pour M2 (alignement)
│   │   │   │   ├── M2AlgorithmTesting.tsx     # Interface test M2
│   │   │   │   ├── M2ValidationInterface.tsx  # Paire → Score alignement + détails
│   │   │   │   └── M2AlignmentVisualization.tsx # Viz alignement lexical/prosodique
│   │   │   └── M3Calculators/                 # Algorithmes pour M3 (charge cognitive)
│   │   │       ├── M3AlgorithmTesting.tsx     # Interface test M3
│   │   │       ├── M3ValidationInterface.tsx  # Client tour → Indices charge
│   │   │       └── M3CognitiveMarkers.tsx     # Marqueurs pauses/hésitations
│   │   ├── comparison/                        # Comparaisons multi-algorithmes
│   │   │   ├── MultiAlgorithmComparison.tsx   # Par variable (X, Y, M1, M2, M3)
│   │   │   ├── CrossValidation.tsx            # K-fold par variable
│   │   │   └── BenchmarkSummary.tsx           # Synthèse performance
│   │   └── shared/                            # Composants communs L1
│   │       ├── AlgorithmSelector.tsx          # Sélection par variable cible
│   │       └── ValidationMetrics.tsx          # Métriques adaptées par variable
│   │
│   ├── Level2/                                # 🎯 Tests Hypothèses H1, H2
│   │   ├── Level2Interface.tsx                # Navigation H1/H2
│   │   ├── H1Testing/                         # Test effet direct X → Y
│   │   │   ├── H1ValidationGold.tsx           # Test avec données gold
│   │   │   ├── H1ValidationComputed.tsx       # Test avec données calculées L1
│   │   │   ├── H1StatisticalTests.tsx         # Chi², V de Cramér
│   │   │   └── H1ResultsVisualization.tsx     # Viz distributions X → Y
│   │   ├── H2Testing/                         # Test médiation X → M1,M2,M3 → Y
│   │   │   ├── H2MediationAnalysis.tsx        # Modèles médiation
│   │   │   ├── H2PathAnalysis.tsx             # Analyse chemins causaux
│   │   │   ├── H2BootstrapTests.tsx           # Bootstrap effets indirects
│   │   │   └── H2MediationVisualization.tsx   # Viz modèle médiation
│   │   └── validation/                        # Outils validation H1/H2
│   │       ├── StatisticalTestsPanel.tsx      # Tests statistiques
│   │       └── StatisticalSummary.tsx         # Synthèse académique
│   │
│   └── shared/                                # Composants partagés
│       ├── AlgorithmLabInterface.tsx          # Interface principale
│       ├── NavigationTabs.tsx                 # Navigation 3 niveaux
│       ├── DataSourceSelector.tsx             # NOUVEAU : Gold vs Computed
│       └── ValidationWorkflow.tsx             # Workflow séquentiel
│
├── algorithms/                                # RÉORGANISÉ PAR VARIABLE CIBLE
│   ├── level0/                               # Algorithmes Gold Standard
│   │   ├── InterAnnotatorKappa.ts            # Validation accord
│   │   ├── SampleStratification.ts           # Échantillonnage stratifié
│   │   └── ConsensusBuilder.ts               # Construction consensus
│   │
│   ├── level1/                               # STRUCTURÉ PAR VARIABLE
│   │   ├── shared/                           # Infrastructure commune
│   │   │   ├── BaseAlgorithm.ts              # Interface unifiée générale
│   │   │   ├── AlgorithmRegistry.ts          # Enregistrement par variable
│   │   │   └── ValidationFramework.ts        # Framework test algorithmes
│   │   │
│   │   ├── XAlgorithms/                      # Calcul stratégies conseiller (X)
│   │   │   ├── shared/                       # Infrastructure X
│   │   │   │   └── BaseXClassifier.ts        # Interface classificateur X
│   │   │   ├── RegexXClassifier.ts           # Classification règles X
│   │   │   ├── SpacyXClassifier.ts           # Classification ML X
│   │   │   └── OpenAIXClassifier.ts          # Classification LLM X
│   │   │
│   │   ├── YAlgorithms/                      # Calcul réactions client (Y)
│   │   │   ├── shared/
│   │   │   │   └── BaseYClassifier.ts        # Interface classificateur Y
│   │   │   ├── RegexYClassifier.ts           # Classification règles Y
│   │   │   └── SentimentYClassifier.ts       # Classification sentiment Y
│   │   │
│   │   ├── M1Algorithms/                     # Calcul verbes action (M1)
│   │   │   ├── shared/
│   │   │   │   └── BaseM1Calculator.ts       # Interface calculateur M1
│   │   │   ├── RegexM1Calculator.ts          # Détection règles verbes
│   │   │   ├── SpacyM1Calculator.ts          # Analyse morphosyntaxique
│   │   │   └── EmbeddingM1Calculator.ts      # Analyse embeddings verbes
│   │   │
│   │   ├── M2Algorithms/                     # Calcul alignement (M2)
│   │   │   ├── shared/
│   │   │   │   └── BaseM2Calculator.ts       # Interface calculateur M2
│   │   │   ├── LexicalM2Calculator.ts        # Alignement lexical
│   │   │   ├── SemanticM2Calculator.ts       # Alignement sémantique
│   │   │   ├── ProsodicM2Calculator.ts       # Alignement prosodique
│   │   │   └── MultimodalM2Calculator.ts     # Fusion multi-niveaux
│   │   │
│   │   └── M3Algorithms/                     # Calcul charge cognitive (M3)
│   │       ├── shared/
│   │       │   └── BaseM3Calculator.ts       # Interface calculateur M3
│   │       ├── PausesM3Calculator.ts         # Détection pauses
│   │       ├── HesitationM3Calculator.ts     # Détection hésitations
│   │       ├── ProsodicM3Calculator.ts       # Instabilité prosodique
│   │       └── CompositeM3Calculator.ts      # Score composite M3
│   │
│   └── level2/                              # Algorithmes tests hypothèses
│       ├── H1TestEngine.ts                  # Moteur tests H1
│       ├── H2MediationEngine.ts             # Moteur tests médiation H2
│       ├── StatisticalTestSuite.ts          # Suite tests statistiques
│       └── MediationBootstrap.ts            # Bootstrap effets indirects
│
├── hooks/                                   # Hooks organisés par niveau
│   ├── level0/
│   │   └── useGoldStandardCreation.ts       # Création gold standard
│   ├── level1/
│   │   ├── useXAlgorithmTesting.ts          # Tests algorithmes X
│   │   ├── useYAlgorithmTesting.ts          # Tests algorithmes Y
│   │   ├── useM1AlgorithmTesting.ts         # Tests algorithmes M1
│   │   ├── useM2AlgorithmTesting.ts         # Tests algorithmes M2
│   │   ├── useM3AlgorithmTesting.ts         # Tests algorithmes M3
│   │   └── useAlgorithmComparison.ts        # Comparaisons multi-algo
│   ├── level2/
│   │   ├── useH1Testing.ts                  # Tests hypothèse H1
│   │   ├── useH2MediationTesting.ts         # Tests médiation H2
│   │   └── useHypothesisValidation.ts       # Validation hypothèses
│   └── shared/
│       ├── useWorkflowManagement.ts         # Workflow séquentiel
│       └── useDataSourceManagement.ts      # Gestion sources données
│
├── data/                                    # Données organisées par niveau
│   ├── level0/                             # Gold standard
│   │   ├── goldStandardX.json              # Annotations X validées
│   │   ├── goldStandardY.json              # Annotations Y validées
│   │   └── annotationMetadata.json         # Métadonnées annotation
│   ├── level1/                             # Résultats algorithmes
│   │   ├── algorithmBenchmarksX.json       # Benchmarks algorithmes X
│   │   ├── algorithmBenchmarksY.json       # Benchmarks algorithmes Y
│   │   ├── algorithmBenchmarksM1.json      # Benchmarks algorithmes M1
│   │   ├── algorithmBenchmarksM2.json      # Benchmarks algorithmes M2
│   │   └── algorithmBenchmarksM3.json      # Benchmarks algorithmes M3
│   └── level2/                             # Résultats tests hypothèses
│       ├── H1TestResults.json              # Résultats tests H1
│       ├── H2MediationResults.json         # Résultats médiation H2
│       └── statisticalSummary.json         # Synthèse statistiques
│
└── utils/                                   # Utilitaires spécialisés
    ├── goldStandardManager.ts              # Gestion gold standard
    ├── algorithmValidation.ts              # Validation algorithmes
    ├── statisticalAnalysis.ts              # Analyses statistiques
    ├── mediationAnalysis.ts                # Analyses médiation
    └── dataVisualization.ts                # Visualisations spécialisées
```

## Avantages de cette nouvelle structure :

1. **Clarté conceptuelle** : Chaque variable (X, Y, M1, M2, M3) a sa propre section avec interfaces de test adaptées
2. **Interfaces de vérification spécialisées** :
   - Pour X/Y : verbatim → tag vs gold standard
   - Pour M1 : verbatim → concentration verbes avec surlignage
   - Pour M2 : paire adjacente → score alignement avec détails
   - Pour M3 : tour client → indices charge avec marqueurs
3. **Workflow logique** : Level0 (gold) → Level1 (algorithmes) → Level2 (hypothèses)
4. **Séparation données gold vs calculées** : Possibilité de tester H1 avec les deux sources
5. **Évolutivité** : Structure claire pour ajouter de nouveaux algorithmes par variable

Cette structure respecte la logique théorique de la thèse tout en offrant une organisation claire du code.
