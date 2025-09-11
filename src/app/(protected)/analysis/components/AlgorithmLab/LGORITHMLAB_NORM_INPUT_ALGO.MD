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
| `RegexM1Calculator`   | T0 seulement         | `string`           | rule-based |
| `M1ActionVerbCounter` | T0 seulement         | `string`           | rule-based |

### **🎯 Variable M2 (Alignement T0 ↔ T+1)**

| **Algorithme**                   | **Contexte utilisé** | **Format d'input**       | **Type**   |
| -------------------------------- | -------------------- | ------------------------ | ---------- |
| `M2LexicalAlignmentCalculator`   | T0 + T+1             | `{t0, t1}`               | rule-based |
| `M2SemanticAlignmentCalculator`  | T0 + T+1             | `{t0, t1}`               | rule-based |
| `M2CompositeAlignmentCalculator` | T0 + T+1 + contexte  | `{t0, t1, prev1, prev2}` | hybrid     |

### **🎯 Variable M3 (Charge cognitive client)**

| **Algorithme**       | **Contexte utilisé** | **Format d'input**  | **Type**   |
| -------------------- | -------------------- | ------------------- | ---------- |
| `PausesM3Calculator` | T0 seulement         | `M3Input {segment}` | rule-based |

## 🔄 SOLUTION : Migration vers pattern unifié

### Étape 1: Configuration centralisée par algorithme

```typescript
// shared/algorithmConfig.ts - NOUVEAU FICHIER CRITIQUE
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

// ✅ BONNE APPROCHE (par algorithme, pas par target)
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
    inputFormat: "contextual", // string avec contexte 3 tours
    requiresNextTurn: false,
    requiresPrevContext: true, // ✅ UTILISE T-2, T-1, T0
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
    requiresPrevContext: false, // Y peut utiliser contexte conseiller précédent
  },

  // === VARIABLE M1 ===
  RegexM1Calculator: {
    target: "M1",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },
  M1ActionVerbCounter: {
    target: "M1",
    speakerType: "conseiller",
    inputFormat: "simple", // string simple
    requiresNextTurn: false,
    requiresPrevContext: false,
  },

  // === VARIABLE M2 ===
  M2LexicalAlignmentCalculator: {
    target: "M2",
    speakerType: "conseiller", // Part du conseiller
    inputFormat: "alignment", // {t0, t1}
    requiresNextTurn: true, // ✅ OBLIGATOIRE pour M2
    requiresPrevContext: false,
  },
  M2SemanticAlignmentCalculator: {
    target: "M2",
    speakerType: "conseiller",
    inputFormat: "alignment", // {t0, t1}
    requiresNextTurn: true, // ✅ OBLIGATOIRE pour M2
    requiresPrevContext: false,
  },
  M2CompositeAlignmentCalculator: {
    target: "M2",
    speakerType: "conseiller",
    inputFormat: "alignment_context", // {t0, t1, prev1, prev2}
    requiresNextTurn: true, // ✅ OBLIGATOIRE pour M2
    requiresPrevContext: true, // ✅ UTILISE contexte étendu
  },

  // === VARIABLE M3 ===
  PausesM3Calculator: {
    target: "M3",
    speakerType: "client",
    inputFormat: "cognitive", // M3Input {segment, options}
    requiresNextTurn: false,
    requiresPrevContext: true, // M3 peut utiliser contexte conseiller
  },
};
```

### Étape 2: Fonctions utilitaires centralisées

```typescript
// shared/corpusFilters.ts
export const filterCorpusForAlgorithm = (
  goldStandardData: TVGoldStandardSample[],
  algorithmName: string
): TVGoldStandardSample[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) {
    console.warn(`No config found for algorithm: ${algorithmName}`);
    return goldStandardData;
  }

  let filtered = goldStandardData;

  // 1. Filtre par type de speaker
  filtered = filtered.filter((sample) => {
    if (config.speakerType === "conseiller") {
      return (
        sample.metadata?.target === "conseiller" &&
        allowedConseiller.includes(sample.expectedTag)
      );
    } else {
      return (
        sample.metadata?.target === "client" &&
        allowedClient.includes(sample.expectedTag)
      );
    }
  });

  // 2. Filtre : nécessite next_turn_verbatim (M2, certains X)
  if (config.requiresNextTurn) {
    filtered = filtered.filter((s) => s.metadata?.next_turn_verbatim);
  }

  // 3. Filtre : nécessite contexte précédent (OpenAI3TXClassifier, M3, M2Composite)
  if (config.requiresPrevContext) {
    filtered = filtered.filter(
      (s) => s.metadata?.prev1_turn_verbatim || s.metadata?.prev2_turn_verbatim
    );
  }

  return filtered;
};

// shared/inputPreparation.ts
export const prepareInputsForAlgorithm = (
  samples: TVGoldStandardSample[],
  algorithmName: string
): any[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  if (!config) throw new Error(`Algorithm ${algorithmName} not configured`);

  return samples.map((sample) => {
    switch (config.inputFormat) {
      case "simple":
        // X (la plupart), Y, M1 (tous) : verbatim direct
        return sample.verbatim;

      case "contextual":
        // OpenAI3TXClassifier : contexte 3 tours
        return {
          current: sample.verbatim,
          prev1: sample.metadata?.prev1_turn_verbatim,
          prev2: sample.metadata?.prev2_turn_verbatim,
          context: `${sample.metadata?.prev2_turn_verbatim || ""} ${
            sample.metadata?.prev1_turn_verbatim || ""
          } ${sample.verbatim}`.trim(),
        };

      case "alignment":
        // M2 Lexical/Semantic : format basique
        return {
          t0: sample.verbatim,
          t1: sample.metadata?.next_turn_verbatim,
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
        // M3 : format charge cognitive
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

### Étape 3: Compléter useLevel1Testing

```typescript
// useLevel1Testing.ts - Hook unifié (à compléter)
export const useLevel1Testing = () => {
  const { allTurnTagged } = useTaggingData();

  // ✅ DÉJÀ EN PLACE : Mapping centralisé des données réelles
  const goldStandardData = useMemo(
    () => mapTurnsToGoldStandard(allTurnTagged, allowedConseiller),
    [allTurnTagged, allowedConseiller]
  );

  // 🔧 À IMPLÉMENTER : Logique de validation unifiée par algorithme
  const validateAlgorithm = useCallback(
    async (algorithmName: string, sampleSize: number) => {
      const algorithm = algorithmRegistry.get(algorithmName);
      if (!algorithm) throw new Error(`Algorithm ${algorithmName} not found`);

      // 1. FILTRAGE UNIFIÉ selon l'algorithme
      const filteredBase = filterCorpusForAlgorithm(
        goldStandardData,
        algorithmName
      );

      // 2. ÉCHANTILLONNAGE
      const samples = randomSample(filteredBase, sampleSize);

      // 3. PRÉPARATION UNIFIÉE des inputs selon l'algorithme
      const inputs = prepareInputsForAlgorithm(samples, algorithmName);

      // 4. EXÉCUTION et formatage des résultats
      const results = await Promise.all(
        inputs.map(async (input, i) => {
          const sample = samples[i];
          const prediction = await algorithm.run(input);
          return formatResultForAlgorithm(sample, prediction, algorithmName);
        })
      );

      return results;
    },
    [goldStandardData]
  );

  return { validateAlgorithm, goldStandardData };
};
```

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
      defaultClassifier="RegexM1Calculator"
      target="M1"
      availableAlgorithms={["RegexM1Calculator", "M1ActionVerbCounter"]}
    />
  );
}

// M2ValidationInterface.tsx - APRÈS (FIX CRITIQUE)
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function M2ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M2 — Alignement conseiller ↔ client"
      defaultClassifier="M2CompositeAlignmentCalculator"
      target="M2"
      availableAlgorithms={[
        "M2CompositeAlignmentCalculator",
        "M2LexicalAlignmentCalculator",
        "M2SemanticAlignmentCalculator",
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
rm src/hooks/level1/useXAlgorithmTesting.ts      # ~430 lignes
rm src/hooks/level1/useM1AlgorithmTesting.ts     # ~50 lignes
rm src/hooks/level1/useM2AlgorithmTesting.ts     # ~120 lignes (DONNÉES FACTICES)
rm src/hooks/level1/useM3AlgorithmTesting.ts     # ~80 lignes

# Composants de test spécialisés à SUPPRIMER
rm src/components/Level1/algorithms/XClassifiers/XAlgorithmTesting.tsx
rm src/components/Level1/algorithms/M1Calculators/M1AlgorithmTesting.tsx
rm src/components/Level1/algorithms/M2Calculators/M2AlgorithmTesting.tsx
rm src/components/Level1/algorithms/M3Calculators/M3AlgorithmTesting.tsx

# TOTAL : ~680 lignes de code supprimées + maintenance simplifiée
```

## 🚀 Plan d'implémentation RÉVISÉ

### Phase 1: Préparatifs (1-2h)

1. ✅ Documenter l'existant (fait)
2. Créer `shared/algorithmConfig.ts` avec `ALGORITHM_CONFIGS`
3. Créer `shared/corpusFilters.ts` avec `filterCorpusForAlgorithm`
4. Créer `shared/inputPreparation.ts` avec `prepareInputsForAlgorithm`

### Phase 2: Compléter useLevel1Testing (2-3h)

1. Implémenter `validateAlgorithm` avec logique par algorithme
2. Implémenter `formatResultForAlgorithm`
3. Tester avec Y (référence)
4. Tester avec M2 sur vraies données (PRIORITÉ)

### Phase 3: Migration progressive (3-4h)

1. **X** : Migrer vers BaseAlgorithmTesting
2. **M1** : Migrer vers BaseAlgorithmTesting
3. **M2** : Corriger pour utiliser vraies données (CRITIQUE)
4. **M3** : Migrer vers BaseAlgorithmTesting

### Phase 4: Nettoyage (1h)

1. Supprimer tous les hooks spécialisés
2. Supprimer les composants de test spécialisés
3. Tests de non-régression
4. Documentation

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
