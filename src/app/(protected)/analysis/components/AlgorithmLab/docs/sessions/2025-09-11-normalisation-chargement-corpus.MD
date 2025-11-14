# 🔧 Plan de normalisation COMPLET du chargement de corpus AlgorithmLab (V2)

## 🎯 Objectif

**SUPPRIMER** tous les hooks spécialisés (useXAlgorithmTesting, useM1AlgorithmTesting, useM2AlgorithmTesting, useM3AlgorithmTesting) et **UNIFORMISER** sur le pattern Y → BaseAlgorithmTesting → useLevel1Testing.

## 📊 Situation actuelle PROBLÉMATIQUE

### ❌ Hooks spécialisés à SUPPRIMER

| Hook                    | Problèmes identifiés                                     | Lignes de code |
| ----------------------- | -------------------------------------------------------- | -------------- |
| `useXAlgorithmTesting`  | 400+ lignes, logique complexe isolée, données mock       | ~430           |
| `useM1AlgorithmTesting` | Logique isolée, format spécifique                        | ~50            |
| `useM2AlgorithmTesting` | **DONNÉES FACTICES** , pas les vraies données turntagged | ~120           |
| `useM3AlgorithmTesting` | Logique isolée, format spécifique                        | ~80            |

### ✅ Référence CORRECTE à suivre

**Y** utilise le pattern unifié :

```typescript
// YValidationInterface.tsx
<BaseAlgorithmTesting
  variableLabel="Y — Réactions Client"
  defaultClassifier="RegexYClassifier"
  target="Y"
/>
```

## 🎯 DISTINCTION FONDAMENTALE : CIBLES vs MOYENS

### **CIBLES (ce qu'on veut mesurer)**

- **X** : Tagger le tour conseiller
- **Y** : Tagger le tour client
- **M1** : Densité verbes d'action dans le tour conseiller
- **M2** : Alignement entre tour conseiller ↔ tour client
- **M3** : Charge cognitive du tour client

### **MOYENS (données utilisées par les algorithmes)**

Selon l'algorithme, il peut utiliser :

- **Seulement le tour cible** (T0)
- **Tour + tour suivant** (T0 + T+1)
- **Contexte 2 tours précédents** (T-2, T-1, T0)
- **Contexte étendu** (T-2, T-1, T0, T+1)

## 📊 **INVENTAIRE COMPLET DES ALGORITHMES**

### **🎯 Variable X (Stratégies Conseiller)**

| **Algorithme**        | **Contexte utilisé** | **Format d'input**         | **Type**   |
| --------------------- | -------------------- | -------------------------- | ---------- |
| `RegexXClassifier`    | T0 seulement         | `string`                   | rule-based |
| `OpenAIXClassifier`   | T0 seulement         | `string`                   | llm        |
| `OpenAI3TXClassifier` | T-2, T-1, T0         | `string`(contexte 3 tours) | llm        |
| `SpacyXClassifier`    | T0 seulement         | `string`                   | ml         |

### **🎯 Variable Y (Réactions Client)**

| **Algorithme**     | **Contexte utilisé** | **Format d'input** | **Type**   |
| ------------------ | -------------------- | ------------------ | ---------- |
| `RegexYClassifier` | T0 seulement         | `string`           | rule-based |

### **🎯 Variable M1 (Densité verbes d'action)**

| **Algorithme**        | **Contexte utilisé** | **Format d'input** | **Type**   |
| --------------------- | -------------------- | ------------------ | ---------- |
| `M1ActionVerbCounter` | T0 seulement         | `string`           | rule-based |

### **🎯 Variable M2 (Alignement T0 ↔ T+1)**

| **Algorithme**         | **Contexte utilisé** | **Format d'input**       | **Type**   |
| ---------------------- | -------------------- | ------------------------ | ---------- |
| `M2LexicalAlignment`   | T0 + T+1             | `{t0, t1}`               | rule-based |
| `M2SemanticAlignment`  | T0 + T+1             | `{t0, t1}`               | rule-based |
| `M2CompositeAlignment` | T0 + T+1 + contexte  | `{t0, t1, prev1, prev2}` | hybrid     |

### **🎯 Variable M3 (Charge cognitive client)**

| **Algorithme**       | **Contexte utilisé** | **Format d'input**  | **Type**   |
| -------------------- | -------------------- | ------------------- | ---------- |
| `PausesM3Calculator` | T0 seulement         | `M3Input {segment}` | rule-based |

## 🔄 SOLUTION : Migration vers pattern unifié

### Étape 1: Configuration centralisée par algorithme

```typescript
// types/algorithms/base.ts - AJOUT à votre fichier existant
export interface AlgorithmConfig {
  target: VariableTarget;
  speakerType: "conseiller" | "client";
  inputFormat:
    | "simple"
    | "contextual"
    | "alignment"
    | "alignment_context"
    | "cognitive";
  requiresNextTurn: boolean;
  requiresPrevContext: boolean;
}

// À ajouter dans types/algorithms/base.ts
export const ALGORITHM_CONFIGS: Record<string, AlgorithmConfig> = {
  // === VARIABLE X ===
  RegexXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },
  OpenAIXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },
  OpenAI3TXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "contextual", // Utilise 3 tours dans useLevel1Testing
    requiresNextTurn: false,
    requiresPrevContext: true, // ✅ UTILISE prev1/prev2 existants
  },
  SpacyXClassifier: {
    target: "X",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },

  // === VARIABLE Y ===
  RegexYClassifier: {
    target: "Y",
    speakerType: "client",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },

  // === VARIABLE M1 ===
  M1ActionVerbCounter: {
    target: "M1",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple vers M1Input
    requiresNextTurn: false,
    requiresPrevContext: false,
  },

  // === VARIABLE M2 ===
  M2LexicalAlignment: {
    target: "M2",
    speakerType: "conseiller", // Part du conseiller
    inputFormat: "alignment", // {t0, t1} depuis useLevel1Testing
    requiresNextTurn: true, // ✅ OBLIGATOIRE next_turn_verbatim
    requiresPrevContext: false,
  },
  M2SemanticAlignment: {
    target: "M2",
    speakerType: "conseiller",
    inputFormat: "alignment", // {t0, t1}
    requiresNextTurn: true, // ✅ OBLIGATOIRE next_turn_verbatim
    requiresPrevContext: false,
  },
  M2CompositeAlignment: {
    target: "M2",
    speakerType: "conseiller",
    inputFormat: "alignment_context", // {t0, t1, prev1, prev2}
    requiresNextTurn: true, // ✅ OBLIGATOIRE next_turn_verbatim
    requiresPrevContext: true, // ✅ UTILISE prev1/prev2 existants
  },
};
```

### Étape 2: Fonctions utilitaires centralisées (À CRÉER)

```typescript
// utils/corpusFilters.ts - NOUVEAU FICHIER À CRÉER
import { ALGORITHM_CONFIGS, AlgorithmConfig } from "../types/algorithms/base";

export const filterCorpusForAlgorithm = (
  goldStandardData: GoldStandardSample[], // ✅ Type existant dans useLevel1Testing
  algorithmName: string
): GoldStandardSample[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) {
    console.warn(`No config found for algorithm: ${algorithmName}`);
    return goldStandardData;
  }

  let filtered = goldStandardData;

  // 1. Filtre par type de speaker (déjà fait dans mapTurnsToGoldStandard)
  filtered = filtered.filter((sample) => {
    if (config.speakerType === "conseiller") {
      return sample.metadata?.target === "conseiller";
    } else {
      return sample.metadata?.target === "client";
    }
  });

  // 2. Filtre : nécessite next_turn_verbatim (M2 OBLIGATOIRE)
  if (config.requiresNextTurn) {
    filtered = filtered.filter(
      (s) =>
        s.metadata?.next_turn_verbatim &&
        s.metadata.next_turn_verbatim.trim().length > 0
    );
  }

  // 3. Filtre : nécessite contexte précédent (OpenAI3TXClassifier, M2Composite)
  if (config.requiresPrevContext) {
    filtered = filtered.filter(
      (s) => s.metadata?.prev1_turn_verbatim || s.metadata?.prev2_turn_verbatim
    );
  }

  return filtered;
};

// utils/inputPreparation.ts - NOUVEAU FICHIER À CRÉER
import { ALGORITHM_CONFIGS } from "../types/algorithms/base";

export const prepareInputsForAlgorithm = (
  samples: GoldStandardSample[], // ✅ Type existant
  algorithmName: string
): any[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) throw new Error(`Algorithm ${algorithmName} not configured`);

  return samples.map((sample) => {
    switch (config.inputFormat) {
      case "simple":
        // X (la plupart), Y, M1 : verbatim direct
        return sample.verbatim;

      case "contextual":
        // OpenAI3TXClassifier : format déjà géré dans useLevel1Testing
        const m = sample.metadata || {};
        return `T-2: ${m.prev2_turn_verbatim ?? "—"}\nT-1: ${
          m.prev1_turn_verbatim ?? "—"
        }\nT0: ${sample.verbatim ?? ""}`;

      case "alignment":
        // M2 Lexical/Semantic : format basique
        return {
          t0: sample.verbatim,
          t1: sample.metadata?.next_turn_verbatim,
          conseillerTurn: sample.verbatim,
          clientTurn: sample.metadata?.next_turn_verbatim,
        };

      case "alignment_context":
        // M2 Composite : format étendu
        return {
          t0: sample.verbatim,
          t1: sample.metadata?.next_turn_verbatim,
          prev1: sample.metadata?.prev1_turn_verbatim,
          prev2: sample.metadata?.prev2_turn_verbatim,
          conseillerTurn: sample.verbatim,
          clientTurn: sample.metadata?.next_turn_verbatim,
        };

      case "cognitive":
        // M3 : format charge cognitive (PausesM3Calculator)
        return {
          segment: sample.verbatim,
          withProsody: false,
          language: "fr",
          options: {
            id: sample.metadata?.turnId,
            clientTurn: sample.verbatim,
            conseillerContext: sample.metadata?.prev1_turn_verbatim,
          },
        };

      default:
        return sample.verbatim;
    }
  });
};
```

### Étape 3: Compléter useLevel1Testing (MODIFICATION MINIMALE)

**useLevel1Testing est déjà fonctionnel !** Il suffit de modifier `validateAlgorithm` pour utiliser les nouvelles fonctions :

```typescript
// Modification dans useLevel1Testing.ts
import { filterCorpusForAlgorithm } from "../utils/corpusFilters";
import { prepareInputsForAlgorithm } from "../utils/inputPreparation";

const validateAlgorithm = useCallback(
  async (
    classifierName: string,
    sampleSize?: number
  ): Promise<ValidationResult[]> => {
    // ✅ AJOUT : Filtrage intelligent par algorithme
    const filteredBase = filterCorpusForAlgorithm(
      goldStandardData,
      classifierName
    );

    if (filteredBase.length === 0) {
      throw new Error(`Aucune donnée disponible pour ${classifierName}`);
    }

    const samples = randomSample(filteredBase, sampleSize);

    // ✅ AJOUT : Préparation d'inputs selon l'algorithme
    const inputs = prepareInputsForAlgorithm(samples, classifierName);

    // ✅ GARDE : Le reste de la logique reste identique !
    const classifier = algorithmRegistry.get<any, any>(classifierName);
    // ... logique existante inchangée ...
  },
  [goldStandardData] // ✅ goldStandardData reste la source unique
);
```

**Avantages** :

- ✅ **Aucune rupture** : `goldStandardData` reste la source unique
- ✅ **Logique existante préservée** : M1, M2, X, Y fonctionnent comme avant
- ✅ **Filtrage intelligent** : Chaque algorithme reçoit exactement ses données
- ✅ **Préparation automatique** : Plus besoin de logique spécialisée par hook

### Étape 4: Migration des interfaces

#### AVANT (problématique)

```typescript
// XValidationInterface.tsx - AVANT
import XAlgorithmTesting from "./XAlgorithmTesting";
export default function XValidationInterface() {
  return <XAlgorithmTesting />; // ❌ Hook isolé
}

// M1ValidationInterface.tsx - AVANT
import M1AlgorithmTesting from "./M1AlgorithmTesting";
export default function M1ValidationInterface() {
  return <M1AlgorithmTesting />; // ❌ Hook isolé
}
```

#### APRÈS (unifié)

```typescript
// XValidationInterface.tsx - APRÈS
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function XValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="X — Stratégies Conseiller"
      defaultClassifier="RegexXClassifier"
      target="X" // ← Auto-filtre les algorithmes X
      availableAlgorithms={[
        "RegexXClassifier",
        "OpenAIXClassifier",
        "OpenAI3TXClassifier",
        "SpacyXClassifier",
      ]}
    />
  );
}

// M1ValidationInterface.tsx - APRÈS
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function M1ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M1 — Densité de verbes d'action"
      defaultClassifier="M1ActionVerbCounter"
      target="M1"
      availableAlgorithms={["M1ActionVerbCounter"]}
    />
  );
}

// M2ValidationInterface.tsx - APRÈS (FIX CRITIQUE)
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function M2ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M2 — Alignement conseiller ↔ client"
      defaultClassifier="M2CompositeAlignment"
      target="M2"
      availableAlgorithms={[
        "M2CompositeAlignment",
        "M2LexicalAlignment",
        "M2SemanticAlignment",
      ]}
      // ❌ SUPPRIME les données factices
      // ✅ UTILISE les vraies données via useLevel1Testing
    />
  );
}

// M3ValidationInterface.tsx - APRÈS
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function M3ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M3 — Charge cognitive client"
      defaultClassifier="PausesM3Calculator"
      target="M3"
      availableAlgorithms={["PausesM3Calculator"]}
    />
  );
}
```

## 🗑️ FICHIERS À SUPPRIMER

```bash
# Hooks spécialisés à SUPPRIMER complètement
rm src/app/(protected)/analysis/components/AlgorithmLab/hooks/level1/useM1AlgorithmTesting.ts     # ~50 lignes
rm src/app/(protected)/analysis/components/AlgorithmLab/hooks/level1/useM2AlgorithmTesting.ts     # ~120 lignes (DONNÉES FACTICES)
rm src/app/(protected)/analysis/components/AlgorithmLab/hooks/level1/useM3AlgorithmTesting.ts     # ~80 lignes
rm src/app/(protected)/analysis/components/AlgorithmLab/hooks/level1/useXAlgorithmTesting.ts      # ~430 lignes

# Composants de test spécialisés à SUPPRIMER (si ils existent)
# rm src/components/Level1/algorithms/XClassifiers/XAlgorithmTesting.tsx
# rm src/components/Level1/algorithms/M1Calculators/M1AlgorithmTesting.tsx
# rm src/components/Level1/algorithms/M2Calculators/M2AlgorithmTesting.tsx
# rm src/components/Level1/algorithms/M3Calculators/M3AlgorithmTesting.tsx

# TOTAL : ~680 lignes de code supprimées + maintenance simplifiée
```

## 🚀 Plan d'implémentation RÉVISÉ

### Phase 1: Création des utilitaires (1-2h)

1. ✅ Analyser l'existant (fait)
2. **Ajouter** `AlgorithmConfig` dans `types/algorithms/base.ts`
3. **Ajouter** `ALGORITHM_CONFIGS` dans `types/algorithms/base.ts`
4. Créer `utils/corpusFilters.ts` avec `filterCorpusForAlgorithm`
5. Créer `utils/inputPreparation.ts` avec `prepareInputsForAlgorithm`

### Phase 2: Modification minimale useLevel1Testing (1h)

1. Importer les nouvelles fonctions utilitaires
2. Modifier `validateAlgorithm` pour utiliser le filtrage/préparation par algorithme
3. **AUCUNE rupture** : garder la logique existante M1/M2/X/Y
4. Tester avec un algorithme existant

### Phase 3: Migration progressive (2-3h)

1. **X** : Remplacer useXAlgorithmTesting par BaseAlgorithmTesting
2. **M1** : Remplacer useM1AlgorithmTesting par BaseAlgorithmTesting
3. **M2** : Remplacer useM2AlgorithmTesting par BaseAlgorithmTesting (PRIORITÉ - données factices)
4. **M3** : Remplacer useM3AlgorithmTesting par BaseAlgorithmTesting

### Phase 4: Nettoyage (30min)

1. Supprimer les 4 hooks spécialisés
2. Tests de non-régression
3. Documentation

## ✅ Résultat final

**AVANT** : 5 systèmes différents, ~680 lignes de code dupliqué, données factices
**APRÈS** : 1 système unifié, données réelles partout, maintenance simplifiée

### Architecture cible unifiée

```
Level1Interface
├── XValidationInterface → BaseAlgorithmTesting(target="X")
├── YValidationInterface → BaseAlgorithmTesting(target="Y") ✅ DÉJÀ OK
├── M1ValidationInterface → BaseAlgorithmTesting(target="M1")
├── M2ValidationInterface → BaseAlgorithmTesting(target="M2")
└── M3ValidationInterface → BaseAlgorithmTesting(target="M3")

Tous utilisent:
├── useLevel1Testing (hook unifié)
├── mapTurnsToGoldStandard (données réelles)
├── algorithmRegistry (algorithmes centralisés)
├── ALGORITHM_CONFIGS (configuration par algorithme)
├── filterCorpusForAlgorithm (filtrage intelligent)
└── prepareInputsForAlgorithm (préparation automatique)
```

### Avantages immédiats

1. **680+ lignes supprimées**
2. **Données réelles partout** (fin des mocks M2)
3. **1 seule logique** à maintenir
4. **Configuration par algorithme** (flexibilité maximale)
5. **Comportement prévisible** et cohérent
6. **Tests simplifiés**
7. **Ajout d'algorithmes facilité**
8. **Distinction claire CIBLES vs MOYENS**

---

**🎯 PRIORITÉ 1 : Implémenter ALGORITHM_CONFIGS et les fonctions de filtrage/préparation par algorithme**

**🎯 PRIORITÉ 2 : Corriger M2 pour utiliser les vraies données turntagged (plus de données factices)**
