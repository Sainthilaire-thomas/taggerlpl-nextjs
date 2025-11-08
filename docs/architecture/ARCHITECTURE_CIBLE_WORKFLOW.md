# Architecture TaggerLPL - Alignée sur le Workflow de Thèse

## 🎯 Vision métier : 3 Phases de la recherche

```
PHASE 1: Gestion Corpus      →  PHASE 2: Annotation         →  PHASE 3: Analyse Scientifique
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ • Import appels         │     │ • TranscriptLPL         │     │ • Level 0: Gold Standard│
│ • Transcription ASR     │     │ • Tagging manuel        │     │ • Level 1: Validation   │
│ • Diarization           │     │ • Supervision tags      │     │ • Level 2: Hypothèses   │
│ • Sélection pour tagger │     │ • Annotation auto       │     │ • Statistiques H1/H2    │
│ • WorkDrive Explorer    │     │ • Relations turns       │     │ • Médiation analysis    │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

## 📁 Architecture cible proposée

```
src/
├── app/                                    # 🎯 NAVIGATION par Phase de Recherche
│   ├── (protected)/
│   │   ├── phase1-corpus/                 # PHASE 1: Gestion du Corpus
│   │   │   ├── import/
│   │   │   │   └── page.tsx              # Import appels (audio + transcription)
│   │   │   ├── workdrive/
│   │   │   │   └── page.tsx              # Explorateur WorkDrive
│   │   │   ├── management/
│   │   │   │   └── page.tsx              # Gestion & sélection appels
│   │   │   ├── transcription/
│   │   │   │   └── page.tsx              # Lancer ASR/Diarization
│   │   │   └── layout.tsx                # Layout Phase 1
│   │   │
│   │   ├── phase2-annotation/             # PHASE 2: Annotation & Tagging
│   │   │   ├── transcript/
│   │   │   │   ├── [callId]/
│   │   │   │   │   └── page.tsx          # TaggerLPL - Interface principale
│   │   │   │   └── page.tsx              # Liste des appels à annoter
│   │   │   ├── tags-management/
│   │   │   │   └── page.tsx              # Gestion référentiel tags (TagManager)
│   │   │   ├── supervision/
│   │   │   │   └── page.tsx              # Supervision qualité annotations
│   │   │   ├── inter-annotator/
│   │   │   │   └── page.tsx              # Comparaison inter-annotateurs
│   │   │   └── layout.tsx                # Layout Phase 2
│   │   │
│   │   └── phase3-analysis/               # PHASE 3: Analyse Scientifique
│   │       ├── level0/                    # Level 0: Gold Standard
│   │       │   ├── gold-creation/
│   │       │   │   └── page.tsx          # Création gold standard
│   │       │   ├── inter-annotator/
│   │       │   │   └── page.tsx          # Comparaison annotateurs (Kappa)
│   │       │   └── page.tsx              # Dashboard Level 0
│   │       │
│   │       ├── level1/                    # Level 1: Validation Algorithmes
│   │       │   ├── algorithm-lab/
│   │       │   │   └── page.tsx          # AlgorithmLab - Tests algos
│   │       │   ├── comparison/
│   │       │   │   └── page.tsx          # Comparaison algo vs gold
│   │       │   ├── alignment/
│   │       │   │   └── page.tsx          # Analyse alignement turns
│   │       │   ├── versions/
│   │       │   │   └── page.tsx          # Gestion versions algos
│   │       │   └── page.tsx              # Dashboard Level 1
│   │       │
│   │       ├── level2/                    # Level 2: Hypothèses Thèse
│   │       │   ├── h1-validation/
│   │       │   │   └── page.tsx          # Tests H1 (stratégies)
│   │       │   ├── h2-mediation/
│   │       │   │   └── page.tsx          # Tests H2 (médiation M1/M2/M3)
│   │       │   ├── statistics/
│   │       │   │   └── page.tsx          # Statistiques & Chi²
│   │       │   ├── reports/
│   │       │   │   └── page.tsx          # Rapports académiques
│   │       │   └── page.tsx              # Dashboard Level 2
│   │       │
│   │       └── layout.tsx                # Layout Phase 3
│   │
│   └── layout/
│       └── GlobalNavbar.tsx               # Navigation entre phases
│
├── features/                               # 🎯 LOGIQUE MÉTIER par Phase
│   │
│   ├── phase1-corpus/                     # Features Phase 1
│   │   ├── calls/                         # Gestion appels (DDD)
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Call.ts
│   │   │   │   │   ├── AudioFile.ts
│   │   │   │   │   └── Transcription.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── CallRepository.ts
│   │   │   │   │   └── StorageRepository.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── CallService.ts
│   │   │   │   │   ├── ImportWorkflow.ts
│   │   │   │   │   └── BulkPreparationWorkflow.ts
│   │   │   │   └── workflows/
│   │   │   ├── infrastructure/
│   │   │   │   ├── api/
│   │   │   │   │   └── CallsApiClient.ts
│   │   │   │   └── supabase/
│   │   │   │       └── SupabaseCallRepository.ts
│   │   │   ├── ui/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CallTable/
│   │   │   │   │   ├── ImportForm/
│   │   │   │   │   └── CallFilters/
│   │   │   │   └── hooks/
│   │   │   │       ├── useCallManagement.ts
│   │   │   │       └── useCallImport.ts
│   │   │   └── shared/
│   │   │       ├── types/
│   │   │       └── config/
│   │   │
│   │   ├── transcription/                 # Transcription ASR
│   │   │   ├── domain/
│   │   │   │   └── services/
│   │   │   │       ├── TranscriptionASRService.ts
│   │   │   │       └── TranscriptionTransformationService.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── asr/
│   │   │   │       └── OpenAIWhisperProvider.ts
│   │   │   └── ui/
│   │   │       └── components/
│   │   │           └── TranscriptionProgress.tsx
│   │   │
│   │   ├── diarization/                   # Diarization
│   │   │   ├── domain/
│   │   │   │   └── services/
│   │   │   │       └── DiarizationService.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── diarization/
│   │   │   │       ├── AssemblyAIProvider.ts
│   │   │   │       └── ExternalDiarizationProvider.ts
│   │   │   └── ui/
│   │   │
│   │   └── workdrive/                     # Explorateur WorkDrive
│   │       ├── components/
│   │       │   ├── FileList.tsx
│   │       │   ├── NavigationControls.tsx
│   │       │   └── SearchBar.tsx
│   │       ├── hooks/
│   │       │   ├── useWorkdriveFiles.tsx
│   │       │   └── useWorkdriveSearch.tsx
│   │       └── utils/
│   │
│   ├── phase2-annotation/                 # Features Phase 2
│   │   ├── transcript/                    # TranscriptLPL - Annotation
│   │   │   ├── components/
│   │   │   │   ├── TranscriptText.tsx
│   │   │   │   ├── TranscriptHeader.tsx
│   │   │   │   ├── TranscriptControls.tsx
│   │   │   │   ├── TranscriptAudioPlayer.tsx
│   │   │   │   └── TagSidePanel.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTaggingLogic.tsx
│   │   │   │   ├── useTranscriptAudio.tsx
│   │   │   │   └── useRelationStatus.ts
│   │   │   └── types.tsx
│   │   │
│   │   ├── tags/                          # Gestion Tags
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── Tag.ts
│   │   │   │   └── services/
│   │   │   │       └── TagManagementService.ts
│   │   │   ├── ui/
│   │   │   │   └── components/
│   │   │   │       ├── TagEditor.tsx
│   │   │   │       ├── TagSelector.tsx
│   │   │   │       └── TagTreeView.tsx
│   │   │   └── shared/
│   │   │
│   │   ├── turns/                         # Gestion Tours de Parole
│   │   │   ├── domain/
│   │   │   │   └── services/
│   │   │   │       └── TurnRelationsService.ts
│   │   │   └── ui/
│   │   │       └── components/
│   │   │           └── TurnTagEditor.tsx
│   │   │
│   │   ├── supervision/                   # Supervision qualité
│   │   │   ├── domain/
│   │   │   │   └── services/
│   │   │   │       └── QualityControlService.ts
│   │   │   └── ui/
│   │   │       └── components/
│   │   │           └── SupervisionDashboard.tsx
│   │   │
│   │   └── inter-annotator/               # Accord inter-annotateurs
│   │       ├── domain/
│   │       │   └── services/
│   │       │       └── KappaCalculationService.ts
│   │       └── ui/
│   │
│   └── phase3-analysis/                   # Features Phase 3
│       │
│       ├── level0-gold/                   # Level 0: Gold Standard
│       │   ├── domain/
│       │   │   └── services/
│       │   │       ├── GoldStandardCreationService.ts
│       │   │       └── InterAnnotatorService.ts
│       │   └── ui/
│       │       └── components/
│       │           ├── GoldStandardEditor.tsx
│       │           └── KappaReport.tsx
│       │
│       ├── level1-validation/             # Level 1: Validation
│       │   ├── algorithms/                # Tous les algorithmes
│       │   │   ├── classifiers/
│       │   │   │   ├── client/
│       │   │   │   │   └── RegexClientClassifier.ts
│       │   │   │   └── conseiller/
│       │   │   │       ├── OpenAIConseillerClassifier.ts
│       │   │   │       ├── MistralConseillerClassifier.ts
│       │   │   │       ├── RegexConseillerClassifier.ts
│       │   │   │       └── SpacyConseillerClassifier.ts
│       │   │   ├── mediators/
│       │   │   │   ├── M1Algorithms/
│       │   │   │   │   ├── M1ActionVerbCounter.ts
│       │   │   │   │   └── RegexM1Calculator.ts
│       │   │   │   ├── M2Algorithms/
│       │   │   │   │   ├── M2LexicalAlignmentCalculator.ts
│       │   │   │   │   └── M2SemanticAlignmentCalculator.ts
│       │   │   │   └── M3Algorithms/
│       │   │   │       └── PausesM3Calculator.tsx
│       │   │   └── shared/
│       │   │       ├── BaseAlgorithm.ts
│       │   │       ├── BaseClassifier.ts
│       │   │       └── AlgorithmRegistry.ts
│       │   │
│       │   ├── domain/
│       │   │   └── services/
│       │   │       ├── AlgorithmExecutionService.ts
│       │   │       ├── ResultStorageService.ts
│       │   │       └── VersionManagementService.ts
│       │   │
│       │   ├── ui/
│       │   │   └── components/
│       │   │       ├── AlgorithmLab/
│       │   │       │   ├── RunPanel.tsx
│       │   │       │   ├── ResultsPanel.tsx
│       │   │       │   └── MetricsPanel.tsx
│       │   │       ├── ComparisonMatrix.tsx
│       │   │       └── AlignmentVisualization.tsx
│       │   │
│       │   └── shared/
│       │       ├── types/
│       │       └── utils/
│       │
│       └── level2-hypotheses/             # Level 2: Hypothèses
│           ├── h1/                        # H1: Stratégies
│           │   ├── domain/
│           │   │   └── services/
│           │   │       ├── H1ValidationService.ts
│           │   │       └── StrategyAnalysisService.ts
│           │   └── ui/
│           │       └── components/
│           │           ├── H1Dashboard.tsx
│           │           └── StrategyMatrix.tsx
│           │
│           ├── h2/                        # H2: Médiation
│           │   ├── domain/
│           │   │   └── services/
│           │   │       ├── H2MediationService.ts
│           │   │       ├── CorrelationAnalysisService.ts
│           │   │       └── SobelTestService.ts
│           │   └── ui/
│           │       └── components/
│           │           ├── MediationDashboard.tsx
│           │           ├── PathDiagram.tsx
│           │           └── BootstrapResults.tsx
│           │
│           ├── statistics/                # Statistiques
│           │   ├── domain/
│           │   │   └── services/
│           │   │       ├── ChiSquareService.ts
│           │   │       ├── CorrelationService.ts
│           │   │       └── RegressionService.ts
│           │   └── ui/
│           │
│           └── reports/                   # Rapports académiques
│               ├── domain/
│               │   └── services/
│               │       └── ReportGenerationService.ts
│               └── ui/
│                   └── components/
│                       ├── AcademicReport.tsx
│                       └── StatisticalTables.tsx
│
├── components/                             # 🎯 COMPOSANTS UI RÉUTILISABLES
│   ├── ui/                                # Composants de base
│   │   ├── Button/
│   │   ├── Dialog/
│   │   ├── Table/
│   │   └── Input/
│   │
│   ├── layout/                            # Layout
│   │   ├── DeleteConfirmationDialog.tsx
│   │   └── SnackBarManager.tsx
│   │
│   ├── auth/                              # Auth
│   │   ├── AuthButton.tsx
│   │   └── AuthStatus.tsx
│   │
│   ├── filters/                           # Filtres
│   │   └── FilterInput.tsx
│   │
│   └── data-viz/                          # Visualisations
│       ├── TagAnalysisGraph.tsx
│       └── TagAnalysisReport.tsx
│
├── context/                                # Contextes globaux
│   ├── SupabaseContext.tsx
│   ├── TaggingDataContext.tsx
│   ├── ThemeContext.tsx
│   └── ZohoContext.tsx
│
├── lib/                                    # Configuration
│   ├── config/
│   │   ├── assemblyAIConfig.ts
│   │   └── transcriptionConfig.ts
│   └── supabaseClient.tsx
│
├── types/                                  # Types partagés
│   ├── common.tsx
│   ├── database.ts                        # Types Supabase
│   └── research/                          # Types recherche
│       ├── annotations.ts
│       ├── algorithms.ts
│       └── statistics.ts
│
└── utils/                                  # Utils globaux
    ├── api/
    │   └── callApiUtils.tsx
    ├── validation/
    │   ├── validateTranscriptionJSON.ts
    │   └── callTypeGuards.ts
    └── transforms/
        └── transcriptionProcessor.tsx
```

---

## 🎯 Principes d'organisation

### 1. Navigation par Phase de Recherche
L'arborescence `app/` reflète exactement le **workflow scientifique** :
- **Phase 1** = Constituer et préparer le corpus
- **Phase 2** = Annoter et superviser
- **Phase 3** = Analyser scientifiquement (3 levels)

### 2. Features par Concern Métier
Chaque `feature` correspond à un **domaine métier** :
- `phase1-corpus/calls` = Gestion des appels (DDD)
- `phase2-annotation/transcript` = Interface de tagging
- `phase3-analysis/level1-validation` = Algorithmes

### 3. Séparation claire des responsabilités
```
app/           → Routes & Navigation (Next.js)
features/      → Logique métier (Services, Workflows, Algorithmes)
components/    → UI réutilisable (Boutons, Dialogs, Graphiques)
```

---

## 📊 Mapping actuel → cible

### AVANT
```
src/components/
├── calls/                          ❌ Feature DDD dans components
├── TranscriptLPL/                  ❌ Feature dans components
├── SimpleWorkdriveExplorer/        ❌ Feature dans components
└── app/(protected)/analysis/
    └── components/AlgorithmLab/    ❌ Trop imbriqué
```

### APRÈS
```
src/
├── app/
│   └── (protected)/
│       ├── phase1-corpus/          ✅ Phase 1 claire
│       ├── phase2-annotation/      ✅ Phase 2 claire
│       └── phase3-analysis/        ✅ Phase 3 avec 3 levels
├── features/
│   ├── phase1-corpus/calls/        ✅ Logique métier isolée
│   ├── phase2-annotation/transcript/ ✅ Logique annotation
│   └── phase3-analysis/level1-validation/ ✅ Algorithmes
└── components/                     ✅ Composants réutilisables
```

---

## 🚀 Migration par phase

### Étape 0.5 : Solidification Types (1h30) ⭐ CRITIQUE
**À faire AVANT toute migration de code**
1. Générer `database.types.ts` depuis Supabase
2. Créer types entités enrichis (call, tag, turn, transcription)
3. Créer types UI (tables, filters, forms)
4. Créer types AlgorithmLab (algorithms, results, metrics)
5. Setup barrel exports et tsconfig paths
6. Valider compilation et auto-complétion

**Bénéfice :** Import centralisé `@/types` facilitera toute la migration

---

### Étape 1 : Phase 1 - Corpus (3-4h)
1. Créer `features/phase1-corpus/`
2. Déplacer `components/calls/` → `features/phase1-corpus/calls/`
3. Déplacer `SimpleWorkdriveExplorer/` → `features/phase1-corpus/workdrive/`
4. Créer routes dans `app/(protected)/phase1-corpus/`
5. Mettre à jour les imports

### Étape 2 : Phase 2 - Annotation (2-3h)
1. Créer `features/phase2-annotation/`
2. Déplacer `TranscriptLPL/` → `features/phase2-annotation/transcript/`
3. Créer `features/phase2-annotation/tags/` pour gestion tags
4. Créer routes dans `app/(protected)/phase2-annotation/`
5. Intégrer supervision et inter-annotateur

### Étape 3 : Phase 3 - Analysis (3-4h)
1. Créer `features/phase3-analysis/`
2. Déplacer `AlgorithmLab/` → `features/phase3-analysis/level1-validation/algorithms/`
3. Créer `level0-gold/`, `level2-hypotheses/`
4. Créer routes dans `app/(protected)/phase3-analysis/`
5. Organiser par level (0, 1, 2)

### Étape 4 : Composants UI (1-2h)
1. Nettoyer `components/`
2. Garder uniquement composants réutilisables
3. Organiser par catégorie (ui, layout, auth, data-viz)

### Étape 5 : Vérification (1h)
1. Tests de compilation
2. Vérification des imports
3. Tests des pages principales

---

## 🎁 Avantages de cette architecture

1. **Alignement avec la recherche**
   - Structure = Workflow de thèse
   - Navigation intuitive pour chercheurs
   - Séparation claire des 3 phases

2. **Scalabilité scientifique**
   - Facile d'ajouter Level 3, 4...
   - Facile d'ajouter H3, H4...
   - Algorithmes isolés et testables

3. **Maintenabilité**
   - Modifications isolées par phase
   - DDD dans phase1 (calls)
   - Services métier clairement identifiés

4. **Documentation**
   - Structure auto-documentée
   - Facile d'onboarder nouveaux collaborateurs
   - Correspondance avec doc/ de la thèse

---

## 📝 Navigation proposée

```
GlobalNavbar:
├── Phase 1: Corpus
│   ├── Import Appels
│   ├── WorkDrive
│   ├── Gestion Appels
│   └── Transcription
│
├── Phase 2: Annotation
│   ├── TranscriptLPL
│   ├── Gestion Tags
│   ├── Supervision
│   └── Inter-Annotateur
│
└── Phase 3: Analyse
    ├── Level 0: Gold Standard
    │   ├── Création Gold
    │   └── Inter-Annotateur
    ├── Level 1: Validation
    │   ├── AlgorithmLab
    │   ├── Comparaisons
    │   ├── Alignement
    │   └── Versions
    └── Level 2: Hypothèses
        ├── H1 Validation
        ├── H2 Médiation
        ├── Statistiques
        └── Rapports
```

---

**Estimation** : 12-16h sur 3-4 jours (incluant 1h30 pour solidification types)  
**Risque** : Moyen (imports à changer)  
**Impact** : Structure alignée avec workflow scientifique ✅
