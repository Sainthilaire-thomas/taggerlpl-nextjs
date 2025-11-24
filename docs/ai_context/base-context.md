# TaggerLPL NextJS - Contexte de base

*Généré le 2025-01-23*

## Vue d'ensemble

**Projet** : TaggerLPL - Application d'analyse conversationnelle pour recherche doctorale

**Description** : Système de tagging et d'analyse de transcriptions d'appels de centres d'appels, permettant de valider des hypothèses scientifiques sur l'influence des stratégies conversationnelles des conseillers sur les réactions clients.

**Stack technique** :
- Framework : Next.js 14+ (App Router)
- Langage : TypeScript (strict mode)
- Base de données : Supabase (PostgreSQL)
- UI : React + Material-UI (MUI v6)
- Authentification : Supabase Auth

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

## Structure des dossiers clés

```
src/
├── app/(protected)/           # Pages par phase
│   ├── phase1-corpus/         # Import, WorkDrive, Management
│   ├── phase2-annotation/     # Transcript, Tags, Supervision
│   └── phase3-analysis/       # Level0, Level1 (AlgorithmLab), Level2
│
├── features/                  # Logique métier (DDD)
│   ├── phase1-corpus/calls/   # Gestion appels (domain/infrastructure/ui)
│   ├── phase2-annotation/     # Annotation et supervision
│   └── phase3-analysis/       # Algorithmes et validation
│       └── level1-validation/
│           ├── algorithms/    # X, Y, M1, M2, M3 classifiers
│           └── ui/            # AlgorithmLab components
│
├── types/                     # Types centralisés
│   ├── database.types.ts      # Types Supabase auto-générés
│   ├── entities/              # Call, Turn, Tag, AnalysisPair
│   ├── algorithm-lab/         # Types AlgorithmLab
│   │   ├── core/              # variables.ts, validation.ts
│   │   ├── algorithms/        # base.ts, configs
│   │   └── utils/             # corpusFilters, inputPreparation
│   └── index.ts               # Exports centralisés
│
└── components/                # Composants legacy (en migration)
```

## Types fondamentaux

### AnalysisPair (table analysis_pairs - 901 paires)

```typescript
interface AnalysisPair {
  pair_id: number;
  call_id: string;
  
  // Gold Standard (annotations manuelles)
  strategy_tag: string;      // Variable X (ENGAGEMENT, OUVERTURE, REFLET_*, EXPLICATION)
  reaction_tag: string;      // Variable Y (CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF)
  strategy_family: string;   // Famille de stratégie
  
  // Verbatims
  conseiller_verbatim: string;
  client_verbatim: string;
  
  // Contexte étendu (prev3 → next3)
  prev1_verbatim?: string;
  next1_verbatim?: string;
  // ...
  
  // Résultats algorithmes X
  x_predicted_tag?: string;
  x_confidence?: number;
  x_algorithm_key?: string;
  x_evidences?: jsonb;
  
  // Résultats algorithmes Y
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

### Variables de thèse (VariableDetails)

```typescript
type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

type XTag = "ENGAGEMENT" | "EXPLICATION" | "REFLET_ACQ" | "REFLET_JE" | "REFLET_VOUS" | "OUVERTURE";
type YTag = "CLIENT_POSITIF" | "CLIENT_NEGATIF" | "CLIENT_NEUTRE";

interface XDetails {
  family?: string;
  matchedPatterns?: string[];
  rationale?: string;
  confidence?: number;
  rawResponse?: string;
  reason?: string;
  // ...
}

interface YDetails {
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  cues?: string[];
  scores?: Record<string, number>;
  rawResponse?: string;
  reason?: string;
  // ...
}

type VariableDetails = XDetails | YDetails | M1Details | M2Details | M3Details;
```

### SpeakerType et AlgorithmConfig

```typescript
type SpeakerType = 'conseiller' | 'client' | 'M1' | 'M2' | 'M3';

interface AlgorithmConfig {
  target: SpeakerType;
  inputFormat: 'string' | 'alignment' | 'segment';
  outputType: 'classification' | 'numeric';
  displayName: string;
}
```

## Configuration TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Conventions de nommage

### Préfixes par variable (colonnes DB)
- **x_** : Variable X (stratégie conseiller)
- **y_** : Variable Y (réaction client)
- **m1_** : Médiateur M1 (verbes d'action)
- **m2_** : Médiateur M2 (alignement linguistique)
- **m3_** : Médiateur M3 (charge cognitive)

### Suffixes
- **_tag** : Tag prédit (string)
- **_confidence** : Niveau de confiance [0-1]
- **_score** : Score numérique
- **_count** : Comptage (integer)

## Imports types recommandés

```typescript
// Types centralisés
import type { AnalysisPair } from '@/types/entities/h2.entities';
import type { TVGoldStandardSample } from '@/types/algorithm-lab/utils/corpusFilters';
import type { SpeakerType, AlgorithmConfig } from '@/types/algorithm-lab/algorithms';
import type { VariableDetails, XDetails, YDetails } from '@/types/algorithm-lab/core/variables';
```

## Commandes utiles

```powershell
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Compter les erreurs
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object

# Build production
npm run build
```

---

*Dernière mise à jour : 2025-01-23*
