# 📋 ÉTAT MIGRATION PHASE 3 - 14 Novembre 2025 19h45

**Session :** 5 heures de travail

**Résultat :** Phase 1 ✅ | Phase 2 ✅ | Phase 3 ⏸️ (à migrer proprement)

**Leçon apprise :** Ne JAMAIS migrer sans plan précis et vérification des types

---

## ✅ CE QUI EST FAIT ET FONCTIONNE

### **Phase 1 - Corpus** ✅ 100%

```
✅ Features migrées :
   src/features/phase1-corpus/
   ├── calls/                    # DDD complet
   ├── transcription/
   ├── diarization/
   └── workdrive/

✅ Navigation créée :
   src/app/(protected)/phase1-corpus/
   ├── import/page.tsx
   ├── management/page.tsx
   └── workdrive/page.tsx

✅ Types centralisés :
   - @/types/entities/call.ts
   - @/types/entities/transcription.ts
   - @/types/workdrive/types.ts
```

### **Phase 2 - Annotation** ✅ 100%

```
✅ Features migrées :
   src/features/phase2-annotation/
   ├── transcript/              # TranscriptLPL
   ├── tags/
   ├── turns/
   ├── supervision/
   └── inter-annotator/

✅ Navigation créée :
   src/app/(protected)/phase2-annotation/
   ├── transcript/[callId]/page.tsx
   ├── tags-management/page.tsx
   └── supervision/page.tsx

✅ Types centralisés :
   - @/types/transcript-lpl/types.ts
   - @/types/entities/tag.ts
   - @/types/entities/turn.ts
```

---

## ⏸️ PHASE 3 - CE QUI RESTE À FAIRE

### **État actuel : AUCUN code migré**

**Pourquoi on a rollback :**

1. ❌ Structure ne suivait pas l'architecture cible
2. ❌ Manquait `domain/services/`
3. ❌ Imports cassés, types non vérifiés
4. ❌ Pas de plan clair = 5h perdues

**Ce qui existe :**

* ✅ Code source : `src/app/(protected)/analysis/components/AlgorithmLab/`
* ✅ Structure vide créée : `src/features/phase3-analysis/` (vide)
* ✅ Navigation vide créée : `src/app/(protected)/phase3-analysis/` (vide)

---

## 📁 ARCHITECTURE CIBLE PHASE 3 (À SUIVRE À LA LETTRE)

### **Structure complète selon ARCHITECTURE_CIBLE_WORKFLOW.md**

```
src/features/phase3-analysis/
│
├── level0-gold/                           # Level 0: Gold Standard
│   ├── domain/
│   │   └── services/
│   │       ├── GoldStandardCreationService.ts    # À CRÉER
│   │       └── InterAnnotatorService.ts          # À CRÉER
│   └── ui/
│       └── components/
│           ├── GoldStandardEditor.tsx            # À CRÉER
│           └── KappaReport.tsx                   # À CRÉER (existe ?)
│
├── level1-validation/                     # Level 1: Validation Algorithmes
│   │
│   ├── algorithms/                        # ALGORITHMES (à migrer depuis analysis/)
│   │   ├── classifiers/
│   │   │   ├── client/
│   │   │   │   ├── RegexClientClassifier.ts      # DEPUIS: analysis/.../clientclassifiers/
│   │   │   │   ├── OpenAIClientClassifier.ts
│   │   │   │   ├── SpacyClientClassifier.ts
│   │   │   │   └── OpenAI3TClientClassifier.ts
│   │   │   │
│   │   │   ├── conseiller/
│   │   │   │   ├── RegexConseillerClassifier.ts  # DEPUIS: analysis/.../conseillerclassifiers/
│   │   │   │   ├── OpenAIConseillerClassifier.ts
│   │   │   │   ├── MistralConseillerClassifier.ts
│   │   │   │   ├── SpacyConseillerClassifier.ts
│   │   │   │   ├── HuggingFaceConseillerClassifier.ts
│   │   │   │   ├── EnsembleConseillerClassifier.ts
│   │   │   │   └── ProxyOpenAIConseillerClassifier.ts
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── BaseClientClassifier.ts       # DEPUIS: analysis/.../XAlgorithms/
│   │   │       └── BaseClassifier.ts
│   │   │
│   │   ├── mediators/
│   │   │   ├── M1Algorithms/
│   │   │   │   ├── M1ActionVerbCounter.ts        # DEPUIS: analysis/.../M1Algorithms/
│   │   │   │   ├── RegexM1Calculator.ts
│   │   │   │   └── shared/
│   │   │   │       └── BaseM1Calculator.ts
│   │   │   │
│   │   │   ├── M2Algorithms/
│   │   │   │   ├── M2LexicalAlignmentCalculator.ts  # DEPUIS: analysis/.../M2Algorithms/
│   │   │   │   ├── M2SemanticAlignmentCalculator.ts
│   │   │   │   ├── M2CompositeAlignmentCalculator.ts
│   │   │   │   └── shared/
│   │   │   │       ├── BaseM2Calculator.ts
│   │   │   │       └── m2-utils.ts
│   │   │   │
│   │   │   └── M3Algorithms/
│   │   │       ├── PausesM3Calculator.tsx        # DEPUIS: analysis/.../M3Algorithms/
│   │   │       └── shared/
│   │   │           └── BaseM3Calculator.ts
│   │   │
│   │   └── shared/                        # Classes de base partagées
│   │       ├── BaseAlgorithm.ts                  # DEPUIS: analysis/.../shared/
│   │       ├── BaseClassifier.ts
│   │       ├── AlgorithmRegistry.ts
│   │       ├── ClassifierRegistry.ts
│   │       ├── ClassifierComparator.ts
│   │       ├── PerformanceMetrics.ts
│   │       └── initializeAlgorithms.ts
│   │
│   ├── domain/                            # ⭐ NOUVEAU (architecture cible)
│   │   └── services/
│   │       ├── AlgorithmExecutionService.ts      # À CRÉER (wrapper pour algorithmes)
│   │       ├── ResultStorageService.ts           # À CRÉER (persist résultats)
│   │       └── VersionManagementService.ts       # À CRÉER (gestion versions)
│   │
│   ├── ui/                                # COMPOSANTS UI (à migrer depuis analysis/)
│   │   └── components/
│   │       ├── AlgorithmLab/
│   │       │   ├── Level1Interface.tsx           # DEPUIS: analysis/.../Level1Interface.tsx
│   │       │   ├── RunPanel.tsx                  # DEPUIS: analysis/.../components/shared/RunPanel.tsx
│   │       │   ├── ResultsPanel.tsx              # DEPUIS: analysis/.../components/shared/ResultsPanel.tsx
│   │       │   ├── MetricsPanel.tsx              # DEPUIS: analysis/.../components/shared/MetricsPanel.tsx
│   │       │   ├── AnnotationList.tsx
│   │       │   └── ResultsSample.tsx
│   │       │
│   │       ├── algorithms/                       # Interfaces par variable
│   │       │   ├── XClassifiers/
│   │       │   │   ├── XValidationInterface.tsx  # DEPUIS: analysis/.../
│   │       │   │   └── XAlgorithmTesting.tsx
│   │       │   ├── YClassifiers/
│   │       │   │   ├── YValidationInterface.tsx
│   │       │   │   └── YAlgorithmTesting.tsx
│   │       │   ├── M1Calculators/
│   │       │   │   ├── M1ValidationInterface.tsx
│   │       │   │   └── M1AlgorithmTesting.tsx
│   │       │   ├── M2Calculators/
│   │       │   │   └── M2ValidationInterface.tsx
│   │       │   ├── M3Calculators/
│   │       │   │   └── M3ValidationInterface.tsx
│   │       │   └── shared/
│   │       │       └── BaseAlgorithmTesting.tsx
│   │       │
│   │       ├── comparison/                       # Comparaison d'algorithmes
│   │       │   ├── AlgorithmComparison.tsx       # DEPUIS: analysis/.../
│   │       │   ├── ClassifierConfiguration.tsx
│   │       │   ├── CrossValidation.tsx
│   │       │   ├── EnsembleTuning.tsx
│   │       │   └── VersionComparator.tsx
│   │       │
│   │       └── individual/                       # Analyses individuelles
│   │           ├── ConfusionMatrix.tsx           # DEPUIS: analysis/.../
│   │           ├── EnhancedErrorAnalysis.tsx
│   │           ├── ParameterOptimization.tsx
│   │           └── TechnicalValidation.tsx
│   │
│   └── shared/                            # Utils et types level1
│       ├── types/
│       │   └── index.ts                          # Types spécifiques level1
│       └── utils/
│           ├── metricsCalculation.ts             # DEPUIS: analysis/.../utils/
│           └── versionGenerator.ts
│
└── level2-hypotheses/                     # Level 2: Tests Hypothèses
    ├── h1/                                # H1: Validation stratégies
    │   ├── domain/
    │   │   └── services/
    │   │       ├── H1ValidationService.ts        # À CRÉER
    │   │       └── StrategyAnalysisService.ts    # À CRÉER
    │   └── ui/
    │       └── components/
    │           ├── H1Dashboard.tsx               # À CRÉER (existe partiellement ?)
    │           └── StrategyMatrix.tsx
    │
    ├── h2/                                # H2: Médiation M1/M2/M3
    │   ├── domain/
    │   │   └── services/
    │   │       ├── H2MediationService.ts         # À CRÉER
    │   │       ├── CorrelationAnalysisService.ts
    │   │       └── SobelTestService.ts
    │   └── ui/
    │       └── components/
    │           ├── MediationDashboard.tsx        # À CRÉER
    │           ├── PathDiagram.tsx
    │           └── BootstrapResults.tsx
    │
    ├── statistics/                        # Statistiques & tests
    │   ├── domain/
    │   │   └── services/
    │   │       ├── ChiSquareService.ts           # À CRÉER
    │   │       ├── CorrelationService.ts
    │   │       └── RegressionService.ts
    │   └── ui/
    │
    └── reports/                           # Rapports académiques
        ├── domain/
        │   └── services/
        │       └── ReportGenerationService.ts    # À CRÉER
        └── ui/
            └── components/
                ├── AcademicReport.tsx
                └── StatisticalTables.tsx
```

### **Navigation (app)**

```
src/app/(protected)/phase3-analysis/
│
├── level0/                                # Level 0: Gold Standard
│   ├── gold-creation/
│   │   └── page.tsx                              # À CRÉER (importe GoldStandardEditor)
│   ├── inter-annotator/
│   │   └── page.tsx                              # À CRÉER (importe KappaReport)
│   └── page.tsx                                  # Dashboard Level 0
│
├── level1/                                # Level 1: Validation
│   ├── algorithm-lab/
│   │   └── page.tsx                              # À CRÉER (importe Level1Interface)
│   ├── comparison/
│   │   └── page.tsx                              # À CRÉER (importe AlgorithmComparison)
│   ├── alignment/
│   │   └── page.tsx                              # À CRÉER
│   ├── versions/
│   │   └── page.tsx                              # À CRÉER (importe VersionComparator)
│   └── page.tsx                                  # Dashboard Level 1
│
├── level2/                                # Level 2: Hypothèses
│   ├── h1-validation/
│   │   └── page.tsx                              # À CRÉER (importe H1Dashboard)
│   ├── h2-mediation/
│   │   └── page.tsx                              # À CRÉER (importe MediationDashboard)
│   ├── statistics/
│   │   └── page.tsx                              # À CRÉER
│   ├── reports/
│   │   └── page.tsx                              # À CRÉER (importe AcademicReport)
│   └── page.tsx                                  # Dashboard Level 2
│
└── layout.tsx                                    # Layout Phase 3 (navigation)
```

---

## 🎯 TYPES CENTRALISÉS - VÉRIFICATION

### **Types déjà centralisés** ✅

```typescript
// @/types/algorithm-lab/ - DÉJÀ FAIT (Étape 0.5)
├── h2.ts                  ✅ Types H2
├── level0.ts              ✅ Types Level 0
├── level1.ts              ✅ Types Level 1
├── shared.ts              ✅ Types partagés
└── validation.ts          ✅ Types validation

// @/types/algorithm-lab/core/ - DÉJÀ FAIT
├── algorithms.ts          ✅ Types algorithmes de base
├── variables.ts           ✅ XDetails, YDetails, M1/M2/M3Details
└── ui.ts                  ✅ Types UI (ResultsTable, etc.)
```

### **Types manquants à créer** ❌

```typescript
// À créer dans @/types/algorithm-lab/
├── level2.ts              ❌ Types Level 2 (H1/H2/statistics)
└── services.ts            ❌ Types pour services (domain)
```

### **Mapping types importants**

```typescript
// Variables et leurs détails
XDetails      → @/types/algorithm-lab/core/variables.ts
YDetails      → @/types/algorithm-lab/core/variables.ts
M1Details     → @/types/algorithm-lab/core/variables.ts
M2Details     → @/types/algorithm-lab/core/variables.ts
M3Details     → @/types/algorithm-lab/core/variables.ts

// Algorithmes
BaseAlgorithm         → @/types/algorithm-lab/core/algorithms.ts
ClassifierResult      → @/types/algorithm-lab/core/algorithms.ts
ValidationMetrics     → @/types/algorithm-lab/validation.ts

// UI
ResultsTable          → @/types/algorithm-lab/core/ui.ts
AnnotationData        → @/types/algorithm-lab/level1.ts
```

---

## 📋 PLAN DE MIGRATION DÉTAILLÉ

### **Étape 1 : Compléter les types manquants (30 min)**

```bash
# 1.1 Créer types Level 2
touch src/types/algorithm-lab/level2.ts

# 1.2 Créer types services
touch src/types/algorithm-lab/services.ts

# 1.3 Mettre à jour barrel export
# Éditer src/types/algorithm-lab/index.ts
```

**Contenu types Level 2 :**

```typescript
// src/types/algorithm-lab/level2.ts
export interface H1ValidationResult {
  strategy: string;
  clientReaction: 'POS' | 'NEG' | 'NEU';
  count: number;
  percentage: number;
  chiSquare?: number;
  pValue?: number;
}

export interface H2MediationResult {
  directEffect: number;
  indirectEffect: number;
  totalEffect: number;
  mediators: {
    M1?: number;
    M2?: number;
    M3?: number;
  };
  bootstrapCI?: {
    lower: number;
    upper: number;
  };
}

export interface StatisticalTest {
  testName: string;
  statistic: number;
  pValue: number;
  degreesOfFreedom?: number;
  significant: boolean;
}
```

### **Étape 2 : Migrer les algorithmes (1h30)**

#### **2.1 Classifiers Client (30 min)**

```bash
# Commandes PowerShell à exécuter UNE PAR UNE

# Copier RegexClientClassifier
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/clientclassifiers/RegexClientClassifier.ts" `
          "src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/RegexClientClassifier.ts"

# Copier OpenAIClientClassifier
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/XAlgorithms/OpenAIXClassifier.ts" `
          "src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/OpenAIClientClassifier.ts"

# Copier SpacyClientClassifier
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/XAlgorithms/SpacyXClassifier.ts" `
          "src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/SpacyClientClassifier.ts"

# Copier OpenAI3TClientClassifier
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/XAlgorithms/OpenAI3TXClassifier.ts" `
          "src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/OpenAI3TClientClassifier.ts"
```

**Puis corriger les imports dans CHAQUE fichier :**

```typescript
// AVANT (exemple RegexClientClassifier.ts)
import { BaseAlgorithm } from "../shared/BaseAlgorithm";
import type { XDetails } from "../../types/algorithms";

// APRÈS
import { BaseAlgorithm } from "../../shared/BaseAlgorithm";
import type { XDetails } from "@/types/algorithm-lab/core/variables";
```

#### **2.2 Classifiers Conseiller (30 min)**

```bash
# Copier tous les fichiers conseiller
$conseillerFiles = @(
    "RegexConseillerClassifier.ts",
    "OpenAIConseillerClassifier.ts",
    "MistralConseillerClassifier.ts",
    "SpacyConseillerClassifier.ts",
    "HuggingFaceConseillerClassifier.ts",
    "EnsembleConseillerClassifier.ts",
    "ProxyOpenAIConseillerClassifier.ts",
    "CustomClassifier.ts"
)

foreach ($file in $conseillerFiles) {
    Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/conseillerclassifiers/$file" `
              "src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/$file"
}
```

**Corriger imports :**

```typescript
// AVANT
import { BaseAlgorithm } from "../shared/BaseAlgorithm";
import type { YDetails } from "../../types/algorithms";

// APRÈS
import { BaseAlgorithm } from "../../shared/BaseAlgorithm";
import type { YDetails } from "@/types/algorithm-lab/core/variables";
```

#### **2.3 Mediators M1/M2/M3 (30 min)**

```bash
# M1
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M1Algorithms/M1ActionVerbCounter.ts" `
          "src/features/phase3-analysis/level1-validation/algorithms/mediators/M1Algorithms/M1ActionVerbCounter.ts"

Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M1Algorithms/RegexM1Calculator.ts" `
          "src/features/phase3-analysis/level1-validation/algorithms/mediators/M1Algorithms/RegexM1Calculator.ts"

# M2
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M2Algorithms/*" `
          "src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/"

# M3
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/M3Algorithms/*" `
          "src/features/phase3-analysis/level1-validation/algorithms/mediators/M3Algorithms/"
```

**Corriger imports :**

```typescript
// AVANT
import { BaseAlgorithm } from "../shared/BaseAlgorithm";
import type { M1Details } from "../../types/algorithms";

// APRÈS
import { BaseAlgorithm } from "../../shared/BaseAlgorithm";
import type { M1Details } from "@/types/algorithm-lab/core/variables";
```

#### **2.4 Shared (classes de base) (30 min)**

```bash
# Copier tous les fichiers shared
$sharedFiles = @(
    "BaseAlgorithm.ts",
    "BaseClassifier.ts",
    "AlgorithmRegistry.ts",
    "ClassifierRegistry.ts",
    "ClassifierComparator.ts",
    "PerformanceMetrics.ts",
    "initializeAlgorithms.ts"
)

foreach ($file in $sharedFiles) {
    Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/$file" `
              "src/features/phase3-analysis/level1-validation/algorithms/shared/$file"
}
```

**Corriger imports :**

```typescript
// AVANT
import type { ValidationMetrics } from "../../types/algorithms";

// APRÈS  
import type { ValidationMetrics } from "@/types/algorithm-lab/validation";
```

### **Étape 3 : Migrer les composants UI (1h30)**

#### **3.1 Composant principal Level1Interface (15 min)**

```bash
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/Level1Interface.tsx" `
          "src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/Level1Interface.tsx"
```

**Corriger imports :**

```typescript
// AVANT
import XValidationInterface from "./algorithms/XClassifiers/XValidationInterface";
import { ConfusionMatrix } from "./individual/ConfusionMatrix";

// APRÈS
import XValidationInterface from "../algorithms/XClassifiers/XValidationInterface";
import { ConfusionMatrix } from "../individual/ConfusionMatrix";
```

#### **3.2 Interfaces par variable (45 min)**

```bash
# Créer structure
mkdir -p "src/features/phase3-analysis/level1-validation/ui/components/algorithms/XClassifiers"
mkdir -p "src/features/phase3-analysis/level1-validation/ui/components/algorithms/YClassifiers"
mkdir -p "src/features/phase3-analysis/level1-validation/ui/components/algorithms/M1Calculators"
mkdir -p "src/features/phase3-analysis/level1-validation/ui/components/algorithms/M2Calculators"
mkdir -p "src/features/phase3-analysis/level1-validation/ui/components/algorithms/M3Calculators"

# Copier fichiers X
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/components/algorithms/XClassifiers/*" `
          "src/features/phase3-analysis/level1-validation/ui/components/algorithms/XClassifiers/"

# Copier fichiers Y
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/components/algorithms/YClassifiers/*" `
          "src/features/phase3-analysis/level1-validation/ui/components/algorithms/YClassifiers/"

# Copier M1/M2/M3
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/components/algorithms/M1Calculators/*" `
          "src/features/phase3-analysis/level1-validation/ui/components/algorithms/M1Calculators/"

Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/components/algorithms/M2Calculators/*" `
          "src/features/phase3-analysis/level1-validation/ui/components/algorithms/M2Calculators/"

Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/components/algorithms/M3Calculators/*" `
          "src/features/phase3-analysis/level1-validation/ui/components/algorithms/M3Calculators/"
```

**Pattern de correction des imports :**

```typescript
// Imports de types
import type { XDetails } from "@/types/algorithm-lab/core/variables";
import type { ValidationMetrics } from "@/types/algorithm-lab/validation";

// Imports d'algorithmes
import { RegexClientClassifier } from "@/features/phase3-analysis/level1-validation/algorithms/classifiers/client/RegexClientClassifier";

// Imports de hooks (si existent)
import { useXAlgorithmTesting } from "../../hooks/useXAlgorithmTesting";
```

#### **3.3 Composants shared (RunPanel, ResultsPanel, MetricsPanel) (30 min)**

```bash
Copy-Item "src/app/(protected)/analysis/components/AlgorithmLab/components/shared/*" `
          "src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/"
```

### **Étape 4 : Créer les pages de navigation (45 min)**

#### **4.1 Page principale algorithm-lab (10 min)**

```typescript
// src/app/(protected)/phase3-analysis/level1/algorithm-lab/page.tsx
"use client";

import React from 'react';
import Level1Interface from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/Level1Interface';

export default function AlgorithmLabPage() {
  return <Level1Interface />;
}
```

#### **4.2 Layout Phase 3 (15 min)**

```typescript
// src/app/(protected)/phase3-analysis/layout.tsx
import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

export default function Phase3Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={0}>
        <Tab label="Level 0: Gold Standard" href="/phase3-analysis/level0" />
        <Tab label="Level 1: Validation" href="/phase3-analysis/level1/algorithm-lab" />
        <Tab label="Level 2: Hypothèses" href="/phase3-analysis/level2" />
      </Tabs>
      {children}
    </Box>
  );
}
```

#### **4.3 Pages dashboards (20 min)**

```typescript
// src/app/(protected)/phase3-analysis/level0/page.tsx
export default function Level0Page() {
  return <div>Level 0: Gold Standard Dashboard</div>;
}

// src/app/(protected)/phase3-analysis/level1/page.tsx
export default function Level1Page() {
  return <div>Level 1: Validation Dashboard</div>;
}

// src/app/(protected)/phase3-analysis/level2/page.tsx
export default function Level2Page() {
  return <div>Level 2: Hypothèses Dashboard</div>;
}
```

### **Étape 5 : Vérifications et tests (30 min)**

#### **5.1 Vérification TypeScript (10 min)**

```bash
npx tsc --noEmit --pretty
```

**Si erreurs :**

* Vérifier imports de types : `@/types/algorithm-lab/...`
* Vérifier imports relatifs : `../../../` vs `@/features/...`
* Vérifier exports dans fichiers source

#### **5.2 Test application (10 min)**

```bash
npm run dev
```

**URLs à tester :**

* http://localhost:3000/phase3-analysis/level0
* http://localhost:3000/phase3-analysis/level1/algorithm-lab ← **PRINCIPAL**
* http://localhost:3000/phase3-analysis/level2

#### **5.3 Vérification Git (10 min)**

```bash
# Voir les fichiers modifiés/créés
git status

# Voir différences
git diff

# Compter les fichiers migrés
git ls-files | grep "features/phase3-analysis" | wc -l
```

---

## ✅ CHECKLIST DE VALIDATION FINALE

### **Structure**

* [ ] `features/phase3-analysis/level0-gold/` existe avec `domain/` et `ui/`
* [ ] `features/phase3-analysis/level1-validation/` existe avec `algorithms/`, `domain/`, `ui/`, `shared/`
* [ ] `features/phase3-analysis/level2-hypotheses/` existe avec `h1/`, `h2/`, `statistics/`, `reports/`
* [ ] `app/(protected)/phase3-analysis/` existe avec `level0/`, `level1/`, `level2/`

### **Algorithmes migrés**

* [ ] Classifiers client (4 fichiers) dans `algorithms/classifiers/client/`
* [ ] Classifiers conseiller (8 fichiers) dans `algorithms/classifiers/conseiller/`
* [ ] M1 Algorithms (2 fichiers) dans `algorithms/mediators/M1Algorithms/`
* [ ] M2 Algorithms (3 fichiers) dans `algorithms/mediators/M2Algorithms/`
* [ ] M3 Algorithms (1 fichier) dans `algorithms/mediators/M3Algorithms/`
* [ ] Shared (7 fichiers) dans `algorithms/shared/`

### **Composants UI migrés**

* [ ] Level1Interface.tsx dans `ui/components/AlgorithmLab/`
* [ ] XValidationInterface.tsx dans `ui/components/algorithms/XClassifiers/`
* [ ] YValidationInterface.tsx dans `ui/components/algorithms/YClassifiers/`
* [ ] M1ValidationInterface.tsx dans `ui/components/algorithms/M1Calculators/`
* [ ] M2ValidationInterface.tsx dans `ui/components/algorithms/M2Calculators/`
* [ ] M3ValidationInterface.tsx dans `ui/components/algorithms/M3Calculators/`
* [ ] RunPanel, ResultsPanel, MetricsPanel dans `ui/components/AlgorithmLab/`

### **Navigation créée**

* [ ] `phase3-analysis/level0/page.tsx`
* [ ] `phase3-analysis/level1/algorithm-lab/page.tsx`
* [ ] `phase3-analysis/level2/page.tsx`
* [ ] `phase3-analysis/layout.tsx`

### **Types centralisés**

* [ ] Tous les types dans `@/types/algorithm-lab/`
* [ ] Barrel export `@/types/algorithm-lab/index.ts` à jour
* [ ] Aucun type local dans features

### **Tests**

* [ ] Compilation TypeScript OK (`npx tsc --noEmit`)
* [ ] Application démarre (`npm run dev`)
* [ ] Page algorithm-lab accessible et fonctionne
* [ ] Aucune erreur console

### **Git**

* [ ] Ancien code analysis/ conservé (backup)
* [ ] Nouveau code features/phase3-analysis/ validé
* [ ] Commit avec message clair
* [ ] Push sur branche refactor/architecture-phases

---

## 🚨 ERREURS À ÉVITER (LEÇONS APPRISES)

### **❌ NE PAS FAIRE**

1. **Migrer sans plan précis**
   * Résultat : 5h perdues, code dans le mauvais emplacement
2. **Oublier domain/services/**
   * L'architecture cible l'exige, on ne peut pas juste copier les algorithmes
3. **Négliger les imports de types**
   * TOUJOURS vérifier que les types existent dans `@/types/` AVANT de migrer
4. **Déplacer sans corriger les imports**
   * Les imports relatifs `../../../` doivent devenir `@/features/...` ou `@/types/...`
5. **Tester en cours de migration**
   * Migrer D'ABORD, tester APRÈS (quand tout est en place)

### **✅ FAIRE**

1. **Suivre l'architecture cible À LA LETTRE**
   * Si le document dit `domain/services/`, créer `domain/services/`
2. **Vérifier les types AVANT de migrer**
   * Lister tous les types utilisés
   * Vérifier qu'ils existent dans `@/types/algorithm-lab/`
   * Créer les types manquants AVANT de migrer le code
3. **Migrer par catégorie**
   * D'abord tous les classifiers
   * Puis tous les mediators
   * Puis tous les composants UI
   * Enfin les pages
4. **Valider à chaque étape**
   * Après chaque catégorie, vérifier TypeScript
   * Ne PAS continuer s'il y a des erreurs
5. **Commiter fréquemment**
   * Après chaque catégorie réussie
   * Messages clairs : "feat(phase3): migrate client classifiers (4 files)"

---

## 📊 ESTIMATION TEMPS

| Étape          | Tâche                        | Temps          |
| --------------- | ----------------------------- | -------------- |
| 1               | Compléter types              | 30 min         |
| 2.1             | Migrer classifiers client     | 30 min         |
| 2.2             | Migrer classifiers conseiller | 30 min         |
| 2.3             | Migrer mediators M1/M2/M3     | 30 min         |
| 2.4             | Migrer shared                 | 30 min         |
| 3.1             | Migrer Level1Interface        | 15 min         |
| 3.2             | Migrer interfaces variables   | 45 min         |
| 3.3             | Migrer composants shared      | 30 min         |
| 4               | Créer pages navigation       | 45 min         |
| 5               | Tests et validation           | 30 min         |
| **TOTAL** |                               | **5h00** |

**Avec pauses et imprévus : 6-7h de travail**

---

## 🎯 PROCHAINE SESSION

### **Avant de commencer**

1. ✅ Relire ce document en entier
2. ✅ Vérifier que la structure vide est créée
3. ✅ Vérifier que tous les types existent dans `@/types/algorithm-lab/`
4. ✅ Préparer un terminal avec les commandes PowerShell

### **Pendant la migration**

1. ⏱️ Suivre le plan étape par étape
2. ✅ Valider TypeScript après chaque catégorie
3. 💾 Commiter après chaque succès
4. 📝 Noter les problèmes rencontrés

### **Après la migration**

1. ✅ Tests complets de l'application
2. 📋 Mettre à jour la documentation
3. 🎉 Célébrer !

---

**Créé le :** 14 novembre 2025 à 19h45

**Auteur :** Thomas + Claude

**Session :** 5 heures

**Statut :** Phase 1 ✅ | Phase 2 ✅ | Phase 3 ⏸️ (prêt pour migration propre)

**Prochaine étape :** Suivre ce plan À LA LETTRE pour migrer Phase 3 proprement.
