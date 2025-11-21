# Architecture des Types - TaggerLPL NextJS

## 📋 Vue d'ensemble

L'architecture des types suit une organisation en **3 niveaux** alignée sur le workflow de recherche :
1. **Types communs** (partagés entre toutes les phases)
2. **Types spécifiques par phase** (Phase 1, 2, 3)
3. **Types algorithmiques** (spécifiques à l'AlgorithmLab)

---

## 🗂️ Structure des répertoires de types

```
src/types/
├── database.types.ts              # Types Supabase auto-générés
├── entities/                      # Entités métier de base
│   ├── call.ts                   # Type Call
│   ├── transcription.ts          # Type Transcription
│   ├── turn.ts                   # Type Turn, TurnTagged
│   ├── tag.ts                    # Type LPLTag
│   └── h2.entities.ts            # Type AnalysisPair (h2_analysis_pairs)
│
├── algorithm-lab/                 # 🎯 Types pour Phase 3 - Analyse
│   ├── algorithms/               # Configuration des algorithmes
│   │   ├── base.ts              # AlgorithmConfig, SpeakerType, ALGORITHM_CONFIGS
│   │   ├── index.ts             # Exports centralisés
│   │   └── universal-adapter.ts # Adaptateur universel
│   │
│   ├── utils/                    # Types utilitaires
│   │   ├── corpusFilters.ts     # ✅ TVGoldStandardSample (AVEC M1/M2/M3)
│   │   ├── inputPreparation.ts  # Préparation inputs algorithmes
│   │   ├── converters.ts        # Conversions de types
│   │   └── normalizers.ts       # Normalisation tags
│   │
│   ├── core/                     # Types core validation
│   │   ├── validation.ts        # Types validation Level 1
│   │   ├── variables.ts         # Variables de thèse (X, Y, M1, M2, M3)
│   │   ├── level0.ts           # Gold standard
│   │   └── calculations.ts      # Résultats de calculs
│   │
│   ├── ui/                       # Types UI composants
│   │   ├── components.ts        # Props des composants AlgorithmLab
│   │   └── validation.ts        # Types pour interfaces validation
│   │
│   ├── Level0Types.ts           # Types Level 0 (Gold Standard)
│   ├── Level1Types.ts           # Types Level 1 (Validation algos)
│   ├── ThesisVariables.ts       # Variables de thèse consolidées
│   ├── ThesisVariables.x.ts     # Variable X (stratégie conseiller)
│   ├── ThesisVariables.y.ts     # Variable Y (réaction client)
│   ├── ThesisVariables.m1.ts    # Médiateur M1 (verbes d'action)
│   ├── ThesisVariables.m2.ts    # Médiateur M2 (alignement linguistique)
│   ├── ThesisVariables.m3.ts    # Médiateur M3 (charge cognitive)
│   └── index.ts                 # Export centralisé
│
└── analysis/                     # Types pour analyses statistiques
    └── types.ts                 # Corrélations, régressions, etc.
```

---

## 🎯 Types clés par usage

### 1. **TVGoldStandardSample** - Le type pivot

**Localisation :** `src/types/algorithm-lab/utils/corpusFilters.ts`

```typescript
export interface TVGoldStandardSample {
  verbatim: string;
  expectedTag: string;
  metadata?: {
    target?: "conseiller" | "client" | "M1" | "M2" | "M3";  // ✅ Support complet
    callId?: string | number;
    turnId?: string | number;
    prev2_turn_verbatim?: string;
    prev1_turn_verbatim?: string;
    next1_turn_verbatim?: string;
    t0?: string;  // Pour M2 : tour conseiller
    t1?: string;  // Pour M2 : tour client
    // ... autres métadonnées contextuelles
  };
}
```

**Utilisation :** 
- Point d'entrée pour tous les algorithmes X, Y, M1, M2, M3
- Utilisé dans `useLevel1Testing` pour créer les samples
- Converti en inputs spécifiques selon le type d'algorithme

---

### 2. **SpeakerType** - Classification des cibles

**Localisation :** `src/types/algorithm-lab/algorithms/base.ts`

```typescript
export type SpeakerType = 
  | 'conseiller'  // Pour algorithmes X (stratégie)
  | 'client'      // Pour algorithmes Y (réaction)
  | 'M1'          // Pour médiateur M1 (verbes d'action)
  | 'M2'          // Pour médiateur M2 (alignement)
  | 'M3';         // Pour médiateur M3 (charge cognitive)
```

**Utilisation :**
- Filtre les samples appropriés pour chaque algorithme
- Détermine quel contexte (prev/next turns) est nécessaire
- Guide la préparation des inputs

---

### 3. **AlgorithmConfig** - Configuration unifiée

**Localisation :** `src/types/algorithm-lab/algorithms/base.ts`

```typescript
export interface AlgorithmConfig {
  target: SpeakerType;
  inputFormat: InputFormat;
  requiresNextTurn?: boolean;
  outputType: 'classification' | 'numeric';
  displayName: string;
  description: string;
}

// Exemple de configuration
export const ALGORITHM_CONFIGS: Record<string, AlgorithmConfig> = {
  'RegexXClassifier': {
    target: 'conseiller',
    inputFormat: 'string',
    requiresNextTurn: false,
    outputType: 'classification',
    displayName: 'Regex X (Stratégie)',
    description: 'Classification stratégies conseiller par regex'
  },
  'M2LexicalAlignment': {
    target: 'M2',
    inputFormat: 'alignment',
    requiresNextTurn: true,  // Nécessite t0 et t1
    outputType: 'numeric',
    displayName: 'M2 Alignement Lexical',
    description: 'Calcul alignement lexical conseiller-client'
  }
  // ...
};
```

---

### 4. **AnalysisPair** - Table `analysis_pairs`

**Localisation :** `src/types/entities/h2.entities.ts`

```typescript
export interface AnalysisPair {
  pair_id: number;
  call_id: number;
  conseiller_turn_id: number;
  
  // Verbatims
  conseiller_verbatim: string;
  client_verbatim: string;
  
  // Gold Standard (annotations manuelles)
  strategy_tag: string;      // Variable X
  reaction_tag: string;      // Variable Y
  strategy_family: string;
  
  // Contexte étendu (prev4 → next4)
  prev4_turn_verbatim?: string;
  prev3_turn_verbatim?: string;
  prev2_turn_verbatim?: string;
  prev1_turn_verbatim?: string;
  next1_turn_verbatim?: string;
  next2_turn_verbatim?: string;
  next3_turn_verbatim?: string;
  next4_turn_verbatim?: string;
  
  // Résultats algorithmes X
  x_predicted_tag?: string;
  x_confidence?: number;
  x_algorithm_key?: string;
  x_algorithm_version?: string;
  
  // Résultats algorithmes Y
  y_predicted_tag?: string;
  y_confidence?: number;
  y_algorithm_key?: string;
  y_algorithm_version?: string;
  
  // Résultats médiateur M1
  m1_verb_density?: number;
  m1_verb_count?: number;
  m1_total_words?: number;
  m1_action_verbs?: string[];
  
  // Résultats médiateur M2
  m2_lexical_alignment?: number;
  m2_semantic_alignment?: number;
  m2_global_alignment?: number;
  m2_shared_terms?: string[];
  
  // Résultats médiateur M3
  m3_hesitation_count?: number;
  m3_cognitive_score?: number;
  m3_cognitive_load?: string;
  m3_patterns?: any;
  
  // Métadonnées
  computation_status?: 'computed' | 'error' | 'pending';
  algorithm_version?: string;
  version_metadata?: any;
  computed_at?: string;
  created_at?: string;
  updated_at?: string;
}
```

---

## 🔄 Flux de conversion des types

### Workflow complet : DB → GoldStandard → Algorithm Input → Results → DB

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SOURCE : analysis_pairs table (Supabase)                     │
│    Type: AnalysisPair                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONVERSION : useAnalysisPairs hook                           │
│    Function: mapH2ToGoldStandard()                              │
│    Creates: 3 samples per pair                                  │
│      - Sample conseiller (target='conseiller')                  │
│      - Sample client (target='client')                          │
│      - Sample M2 (target='M2' with t0, t1)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. GOLD STANDARD : TVGoldStandardSample[]                       │
│    Location: goldStandardData state                             │
│    Includes: verbatim, expectedTag, metadata                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. FILTRAGE : filterCorpusForAlgorithm()                        │
│    Based on: algorithmConfig.target                             │
│    Returns: Filtered TVGoldStandardSample[]                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PRÉPARATION : prepareInputsForAlgorithm()                    │
│    Converts to algorithm-specific input:                        │
│      - string (X, Y, M1, M3)                                    │
│      - M2Input {t0, t1} (M2)                                    │
│      - M3Input {segment, options} (M3)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. EXÉCUTION : algorithm.run(input)                             │
│    Returns: ClassificationResult or NumericResult               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. STORAGE : updateH2WithResults()                              │
│    Updates: analysis_pairs table                                │
│    Fields: x_*, y_*, m1_*, m2_*, m3_* columns                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Exports centralisés

### Import depuis `@/types/algorithm-lab`

```typescript
// Types de base
import { 
  SpeakerType,
  AlgorithmConfig,
  InputFormat,
  ALGORITHM_CONFIGS,
  getConfigForAlgorithm 
} from '@/types/algorithm-lab/algorithms';

// Types de samples
import { 
  TVGoldStandardSample 
} from '@/types/algorithm-lab/utils/corpusFilters';

// Fonctions utilitaires
import {
  filterCorpusForAlgorithm,
  countSamplesPerAlgorithm
} from '@/types/algorithm-lab/utils/corpusFilters';

import {
  prepareInputsForAlgorithm,
  debugPreparedInputs
} from '@/types/algorithm-lab/utils/inputPreparation';
```

---

## ⚠️ Points d'attention

### 1. **Ancien vs Nouveau système de types**

**❌ ANCIEN (à éviter) :**
```typescript
// Import depuis l'ancien emplacement
import type { TVGoldStandardSample } from 
  "@/app/(protected)/analysis/components/AlgorithmLab/types";
// ❌ Ce type ne supporte PAS M1/M2/M3 !
```

**✅ NOUVEAU (à utiliser) :**
```typescript
// Import depuis le nouveau système
import type { TVGoldStandardSample } from 
  "@/types/algorithm-lab/utils/corpusFilters";
// ✅ Ce type supporte M1/M2/M3 !
```

### 2. **Type casting à éviter**

**❌ MAUVAISE PRATIQUE :**
```typescript
metadata: {
  target: 'M2' as any,  // ❌ Type casting dangereux
}
```

**✅ BONNE PRATIQUE :**
```typescript
metadata: {
  target: 'M2',  // ✅ Type inféré correctement
}
```

### 3. **Vérification du type target**

Toujours vérifier que le `target` correspond bien à la configuration de l'algorithme :

```typescript
const config = getConfigForAlgorithm(algorithmName);
if (sample.metadata?.target !== config.target) {
  console.warn(`Sample target mismatch: ${sample.metadata?.target} !== ${config.target}`);
}
```

---

## 🔍 Debugging des types

### Vérifier la structure d'un sample

```typescript
console.log('Sample structure:', {
  verbatim: sample.verbatim,
  expectedTag: sample.expectedTag,
  target: sample.metadata?.target,
  hasT0: !!sample.metadata?.t0,
  hasT1: !!sample.metadata?.t1,
  hasContext: {
    prev2: !!sample.metadata?.prev2_turn_verbatim,
    prev1: !!sample.metadata?.prev1_turn_verbatim,
    next1: !!sample.metadata?.next1_turn_verbatim,
  }
});
```

### Compter les samples par target

```typescript
const counts = goldStandardData.reduce((acc, sample) => {
  const target = sample.metadata?.target || 'undefined';
  acc[target] = (acc[target] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('Samples par target:', counts);
// Attendu : { conseiller: 901, client: 901, M2: 901 }
```

---

## 📝 Convention de nommage

### Préfixes par variable

- **X_** : Variable X (stratégie conseiller) - `x_predicted_tag`, `x_confidence`
- **Y_** : Variable Y (réaction client) - `y_predicted_tag`, `y_confidence`
- **M1_** : Médiateur M1 (verbes d'action) - `m1_verb_density`, `m1_verb_count`
- **M2_** : Médiateur M2 (alignement) - `m2_lexical_alignment`, `m2_semantic_alignment`
- **M3_** : Médiateur M3 (charge cognitive) - `m3_hesitation_count`, `m3_cognitive_score`

### Suffixes

- **_tag** : Tag prédit (string) - `x_predicted_tag`, `y_predicted_tag`
- **_confidence** : Niveau de confiance [0-1] - `x_confidence`, `y_confidence`
- **_score** : Score numérique [0-1] - `m2_lexical_alignment`, `m3_cognitive_score`
- **_count** : Comptage (integer) - `m1_verb_count`, `m3_hesitation_count`
- **_density** : Densité [0-1] - `m1_verb_density`
- **_algorithm_key** : Identifiant algorithme - `x_algorithm_key`
- **_algorithm_version** : Version algorithme - `x_algorithm_version`

---

## 🎯 Résumé des bonnes pratiques

1. ✅ **Toujours importer** `TVGoldStandardSample` depuis `@/types/algorithm-lab/utils/corpusFilters`
2. ✅ **Utiliser** `SpeakerType` depuis `@/types/algorithm-lab/algorithms`
3. ✅ **Éviter** les `as any` - les types sont déjà corrects
4. ✅ **Créer 3 samples par paire** : conseiller, client, M2
5. ✅ **Vérifier** que `metadata.target` correspond à `algorithmConfig.target`
6. ✅ **Documenter** toute extension des types dans ce fichier

---

## 📚 Références

- **Architecture générale :** `ARCHITECTURE_CIBLE_WORKFLOW.md`
- **Architecture algorithmes :** `ARCHITECTURE_ALGORITHMES_ANALYSIS_PAIRS.md`
- **Session M2 :** `SESSION_MIGRATION_M2_BILAN.md`
- **État projet :** `PROJECT_STATE.json`

---

**Dernière mise à jour :** 2025-11-21  
**Version types :** 2.0 (Support complet M1/M2/M3)
