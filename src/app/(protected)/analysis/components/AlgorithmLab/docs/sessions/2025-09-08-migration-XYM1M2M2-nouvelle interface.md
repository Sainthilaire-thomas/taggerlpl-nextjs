```

```

# Audit : Migration vers UniversalAlgorithm - X, Y, M1, M2

## État actuel des algorithmes

### 🔍 Analyse du code existant

#### 1. **Enregistrement actuel (initializeAlgorithms.ts)**

```typescript
// ❌ PROBLÈME : Enregistrement direct sans adaptateur UniversalAlgorithm
algorithmRegistry.register("RegexXClassifier", new RegexXClassifier());
algorithmRegistry.register("OpenAIXClassifier", new OpenAIXClassifier({...}));
algorithmRegistry.register("RegexYClassifier", new RegexYClassifier());
algorithmRegistry.register("M1ActionVerbCounter", new M1ActionVerbCounter() as any);
```

#### 2. **Interfaces hétérogènes détectées**

**X Algorithms :**

- `RegexXClassifier` : Interface `XClassifier` custom avec `run()` → `XClassification`
- `OpenAIXClassifier` : Wrapper `BaseAlgorithm` → `describe()` present
- `SpacyXClassifier` : Wrapper `BaseAlgorithm` → interface similaire

**Y Algorithms :**

- `RegexYClassifier` : Interface `BaseAlgorithm<string, YClassification>`

**M1 Algorithms :**

- `M1ActionVerbCounter` : Interface `BaseAlgorithm<string, any>` avec `key` property

### 📊 Matrice de conformité UniversalAlgorithm

| Algorithme          | describe() | validateConfig() | run() | classify() | Interface     | Status            |
| ------------------- | ---------- | ---------------- | ----- | ---------- | ------------- | ----------------- |
| RegexXClassifier    | ❌         | ✅               | ✅    | ❌         | XClassifier   | **NON CONFORME**  |
| OpenAIXClassifier   | ✅         | ✅               | ✅    | ❌         | BaseAlgorithm | **PARTIELLEMENT** |
| SpacyXClassifier    | ✅         | ✅               | ✅    | ❌         | BaseAlgorithm | **PARTIELLEMENT** |
| RegexYClassifier    | ✅         | ✅               | ✅    | ❌         | BaseAlgorithm | **PARTIELLEMENT** |
| M1ActionVerbCounter | ✅         | ✅               | ✅    | ❌         | BaseAlgorithm | **PARTIELLEMENT** |

### 🚨 Problèmes identifiés

#### **P1 : Interfaces non-standardisées**

```typescript
// RegexXClassifier utilise XClassifier au lieu d'UniversalAlgorithm
export class RegexXClassifier implements XClassifier {
  async run(input: string): Promise<XClassification> // ❌ Pas UniversalResult
}

// Les autres utilisent BaseAlgorithm mais retournent des types custom
export class RegexYClassifier implements BaseAlgorithm<string, YClassification>
```

#### **P2 : Pas de méthode classify() rétro-compatible**

- Aucun algorithme n'expose `classify(string): Promise<UniversalResult>`
- Interface UI utilise encore `.classify()` dans certains endroits

#### **P3 : Résultats non-standardisés**

```typescript
// Types de retour hétérogènes
XClassification ≠ YClassification ≠ UniversalResult
```

#### **P4 : Enregistrement sans adaptateur**

- Pas d'utilisation de `createUniversalAlgorithm()`
- Cast forcé `as any` pour M1

## 🎯 Plan de migration

### Phase 1 : Création des adaptateurs (1h)

#### **Étape 1.1 : Adaptateurs legacy temporaires**

```typescript
// algorithms/level1/shared/legacyAdapters.ts

function wrapLegacyXAlgorithm(algo: any): UniversalAlgorithm {
  return {
    describe(): AlgorithmDescriptor {
      const meta = algo.describe?.() || {};
      return {
        name: meta.name || algo.constructor.name,
        displayName: meta.displayName || "Legacy X Classifier",
        type: meta.type || "rule-based",
        target: "X",
        version: meta.version || "1.0.0",
        batchSupported: typeof algo.runBatch === "function",
        requiresContext: false,
        description: meta.description || "",
      };
    },

    validateConfig(): boolean {
      return typeof algo.validateConfig === "function"
        ? algo.validateConfig()
        : true;
    },

    async classify(input: string): Promise<UniversalResult> {
      const result = await algo.run(input);
      return normalizeToUniversalResult(result);
    },

    async run(input: unknown): Promise<UniversalResult> {
      const result = await algo.run(input as string);
      return normalizeToUniversalResult(result);
    },

    async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
      if (typeof algo.runBatch === "function") {
        const results = await algo.runBatch(inputs as string[]);
        return results.map(normalizeToUniversalResult);
      }
      return Promise.all(inputs.map((i) => this.run(i)));
    },
  };
}

function normalizeToUniversalResult(result: any): UniversalResult {
  return {
    prediction: result.prediction || "UNKNOWN",
    confidence: result.confidence || 0,
    processingTime: result.processingTimeMs || result.processingTime || 0,
    metadata: {
      inputType: "string",
      details: result.metadata || result.details,
      warnings: result.metadata?.warnings || [],
    },
  };
}
```

#### **Étape 1.2 : Adaptateurs spécialisés**

```typescript
export function wrapXAlgorithm(algo: any): UniversalAlgorithm {
  return wrapLegacyXAlgorithm(algo);
}

export function wrapYAlgorithm(algo: any): UniversalAlgorithm {
  const wrapped = wrapLegacyXAlgorithm(algo);
  const originalDescribe = wrapped.describe;
  wrapped.describe = () => ({
    ...originalDescribe(),
    target: "Y",
    displayName: originalDescribe().displayName.replace("X", "Y"),
  });
  return wrapped;
}

export function wrapM1Algorithm(algo: any): UniversalAlgorithm {
  const wrapped = wrapLegacyXAlgorithm(algo);
  const originalDescribe = wrapped.describe;
  wrapped.describe = () => ({
    ...originalDescribe(),
    target: "M1",
    displayName: "M1 Action Verb Counter",
    type: "metric",
  });
  return wrapped;
}
```

### Phase 2 : Migration de initializeAlgorithms.ts (30 min)

```typescript
// initializeAlgorithms.ts - VERSION MIGRÉE

import {
  wrapXAlgorithm,
  wrapYAlgorithm,
  wrapM1Algorithm,
} from "./legacyAdapters";

export function initializeAlgorithms(): void {
  if (initialized) return;
  initialized = true;

  try {
    // ===== X (classifieurs conseiller) =====
    algorithmRegistry.register(
      "RegexXClassifier",
      wrapXAlgorithm(new RegexXClassifier())
    );

    algorithmRegistry.register(
      "SpacyXClassifier",
      wrapXAlgorithm(
        new SpacyXClassifier({
          apiUrl: process.env.SPACY_API_URL || "http://localhost:8000/classify",
          model: "fr_core_news_md",
          timeout: 5000,
          confidenceThreshold: 0.6,
        })
      )
    );

    algorithmRegistry.register(
      "OpenAIXClassifier",
      wrapXAlgorithm(
        new OpenAIXClassifier({
          model: "gpt-4o-mini",
          temperature: 0,
          maxTokens: 6,
          timeout: 10000,
          enableFallback: true,
        })
      )
    );

    algorithmRegistry.register(
      "OpenAI3TXClassifier",
      wrapXAlgorithm(
        new OpenAI3TXClassifier({
          model: "gpt-4o-mini",
          temperature: 0,
          maxTokens: 6,
          timeout: 10000,
          enableFallback: true,
          strictPromptMode: true,
        })
      )
    );

    // ===== Y (classifieurs client) =====
    algorithmRegistry.register(
      "RegexYClassifier",
      wrapYAlgorithm(new RegexYClassifier())
    );

    // ===== M1 (compteurs / métriques) =====
    algorithmRegistry.register(
      "M1ActionVerbCounter",
      wrapM1Algorithm(new M1ActionVerbCounter())
    );

    logAlgorithmStatus();
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des algorithmes:", error);
  }
}
```

### Phase 3 : Validation et tests (30 min)

#### **Script de validation**

```typescript
// Test de conformité UniversalAlgorithm
export async function validateUniversalCompliance(): Promise<void> {
  const algorithms = algorithmRegistry.list();

  for (const algo of algorithms) {
    console.log(`\n🧪 Testing ${algo.name}:`);

    // Test describe()
    try {
      const descriptor = algo.describe();
      console.log(
        `✅ describe(): ${descriptor.displayName} (${descriptor.target})`
      );

      // Validation champs requis
      const required = ["name", "displayName", "type", "target", "version"];
      const missing = required.filter((field) => !descriptor[field]);
      if (missing.length > 0) {
        console.log(`⚠️ Missing fields: ${missing.join(", ")}`);
      }
    } catch (e) {
      console.log(`❌ describe() failed: ${e.message}`);
    }

    // Test validateConfig()
    try {
      const isValid = algo.validateConfig();
      console.log(`✅ validateConfig(): ${isValid}`);
    } catch (e) {
      console.log(`❌ validateConfig() failed: ${e.message}`);
    }

    // Test run() et classify()
    const testInput = "je vais vérifier votre dossier";
    try {
      const runResult = await algo.run(testInput);
      console.log(
        `✅ run(): ${runResult.prediction} (conf: ${runResult.confidence})`
      );

      if (algo.classify) {
        const classifyResult = await algo.classify(testInput);
        console.log(
          `✅ classify(): ${classifyResult.prediction} (conf: ${classifyResult.confidence})`
        );
      }
    } catch (e) {
      console.log(`❌ execution failed: ${e.message}`);
    }
  }
}
```

### Phase 4 : Ajout M2 avec nouvelle architecture (1h)

Une fois X, Y, M1 migrés, utiliser `createUniversalAlgorithm()` pour M2 :

```typescript
// M2 avec nouvelle architecture UniversalAlgorithm native
algorithmRegistry.register(
  "M2LexicalAlignment",
  createM2Algorithm(
    new M2LexicalAlignmentCalculator({
      thresholdAligned: 0.5,
      thresholdPartial: 0.3,
    })
  )
);

algorithmRegistry.register(
  "M2SemanticAlignment",
  createM2Algorithm(
    new M2SemanticAlignmentCalculator({
      confidenceThreshold: 0.6,
      strictMode: false,
    })
  )
);

algorithmRegistry.register(
  "M2CompositeAlignment",
  createM2Algorithm(
    new M2CompositeAlignmentCalculator({
      lexicalWeight: 0.4,
      semanticWeight: 0.6,
      threshold: 0.5,
      partialThreshold: 0.3,
    })
  )
);
```

## 📋 Checklist de migration

### Phase 1 : Préparation (45 min)

- [ ] Créer `legacyAdapters.ts` avec wrappers universels
- [ ] Tester `normalizeToUniversalResult()` sur échantillons
- [ ] Implémenter `wrapXAlgorithm()`, `wrapYAlgorithm()`, `wrapM1Algorithm()`
- [ ] Validation des signatures d'interface

### Phase 2 : Migration registry (30 min)

- [ ] Sauvegarder `initializeAlgorithms.ts` original
- [ ] Remplacer enregistrements directs par wrappers
- [ ] Supprimer cast `as any` sur M1
- [ ] Test compilation TypeScript

### Phase 3 : Validation fonctionnelle (30 min)

- [ ] Exécuter `validateUniversalCompliance()`
- [ ] Vérifier que tous les algos exposent `describe()`, `run()`, `classify()`
- [ ] Test interface utilisateur (sélecteurs, exécution)
- [ ] Validation métriques et résultats

### Phase 4 : M2 natif (1h)

- [ ] Implémenter M2 avec `BaseCalculator` + `createM2Algorithm()`
- [ ] Tester conformité `UniversalAlgorithm` native
- [ ] Intégration dans `initializeAlgorithms.ts`
- [ ] Validation pipeline M2 complet

## 🎯 Résultat attendu

### **Avant migration :**

```typescript
// ❌ Interfaces hétérogènes
RegexXClassifier → XClassification
RegexYClassifier → YClassification
M1ActionVerbCounter → any (cast forcé)
```

### **Après migration :**

```typescript
// ✅ Interface unifiée UniversalAlgorithm
All algorithms → UniversalResult {
  prediction: string,
  confidence: number,
  processingTime?: number,
  metadata?: {...}
}
```

### **Bénéfices obtenus :**

- Interface cohérente pour tous les algorithmes (X, Y, M1, M2)
- Rétrocompatibilité préservée via `classify()`
- Descripteurs riches standardisés
- Base solide pour extension M2
- Tests unifiés et validation automatisée

### **Métriques de succès :**

- `algorithmRegistry.list()` fonctionne sans erreur
- Tous les algos exposent `describe()`, `validateConfig()`, `run()`
- Interface utilisateur fonctionnelle avec nouveaux algorithmes
- Pipeline M2 opérationnel avec architecture unifiée

## 🚀 Prochaines étapes

1. **Exécuter Phase 1-2** (migration legacy avec wrappers)
2. **Validation Phase 3** (tests de conformité)
3. **Finaliser M2 Phase 4** (architecture native UniversalAlgorithm)
4. **Documentation mise à jour** pour l'équipe

Cette migration garantit la cohérence architecturale tout en préservant les fonctionnalités existantes et en préparant l'extension M2.

## 📚 Documentation de référence prioritaire

### **1. Documents essentiels (à lire en premier)**

**Architecture et types centraux :**

- `types/algorithms/base.ts` - Interface `UniversalAlgorithm` et types fondamentaux
- `types/algorithms/universal-adapter.ts` - Fonction `createUniversalAlgorithm`
- `types/core/variables.ts` - Types de variables unifiés (VariableTarget, Details)
- `types/core/calculations.ts` - Interfaces de calcul standardisées

**Session de refactorisation :**

- `docs/sessions/2025-09-04-normalisation-types.md` - Plan complet de migration avec scripts

### **2. Exemples d'implémentation actuels**

**Classes d'algorithmes à migrer :**

- `algorithms/level1/XAlgorithms/RegexXClassifier.ts` - Interface `XClassifier` (non-conforme)
- `algorithms/level1/YAlgorithms/RegexYClassifier.ts` - Interface `BaseAlgorithm` (partiel)
- `algorithms/level1/M1Algorithms/M1ActionVerbCounter.ts` - Interface `BaseAlgorithm` (partiel)

**Enregistrement actuel :**

- `algorithms/level1/shared/initializeAlgorithms.ts` - Enregistrement direct sans adaptateurs

### **3. Documentation fonctionnelle**

**Système de résultats :**

- `docs/modules/level1/Level1.shared.results.md` - Composants UI pour validation
- `docs/modules/level1/m1-algorithms.md` - Exemple d'algorithme M1 documenté

**Types de référence complets :**

- `types/referencetypes.md` - Vue d'ensemble de tous les types disponibles

## 🎯 Ordre de lecture recommandé

1. **Comprendre l'objectif** : `docs/sessions/2025-09-04-normalisation-types.md` (sections 1-4)
2. **Étudier l'interface cible** : `types/algorithms/base.ts` → `UniversalAlgorithm`
3. **Voir l'adaptateur** : `types/algorithms/universal-adapter.ts` → `createUniversalAlgorithm`
4. **Analyser l'existant** : `initializeAlgorithms.ts` + classes d'algorithmes
5. **Planifier la migration** : Plan de mise en œuvre (section 5 du document de session)

## 📝 Informations critiques pour la session

- **État actuel** : Enregistrement direct sans interface unifiée
- **Problème** : Cast `as any` sur M1, interfaces hétérogènes
- **Solution** : Wrappers legacy temporaires puis migration complète
- **Durée estimée** : 3h avec validation progressive

Cette documentation fournit tout le contexte nécessaire pour comprendre l'architecture actuelle, l'objectif cible, et le plan de migration sécurisé.

Réessayer
