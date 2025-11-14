## Arborescence ancienne d'AlgorithmLab (ancienne)

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
span
```
