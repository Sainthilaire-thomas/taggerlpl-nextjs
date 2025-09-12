# 📋 Guide de migration AlgorithmLab - Harmonisation complète

> **Objectif** : Supprimer le legacy et harmoniser tous les algorithmes sous `UniversalAlgorithm`
>
> **Principe** : Conserver 100% de la logique métier, changer uniquement l'interface

## 🎯 Vue d'ensemble de la migration

### État actuel (hétérogène)

```
RegexXClassifier implements XClassifier
M2LexicalAlignment extends BaseM2Calculator
M1ActionVerbCounter implements BaseAlgorithm
PausesM3Calculator extends BaseM3Calculator
```

### État cible (unifié)

```
TOUS implements UniversalAlgorithm {
  describe(): AlgorithmDescriptor
  validateConfig(): boolean
  run(input: unknown): Promise<UniversalResult>
  batchRun?(inputs: unknown[]): Promise<UniversalResult[]>
}
```

## 📁 Fichiers à modifier (ordre de migration)

### Phase 1 : Interfaces et types (30 min)

#### 1.1 Créer l'interface unifiée

```bash
# Créer le fichier principal
touch algorithms/interfaces/UniversalAlgorithm.ts
```

**Contenu :**

```typescript
// algorithms/interfaces/UniversalAlgorithm.ts
export interface UniversalAlgorithm {
  describe(): AlgorithmDescriptor;
  validateConfig(): boolean;
  run(input: unknown): Promise<UniversalResult>;
  batchRun?(inputs: unknown[]): Promise<UniversalResult[]>;
}

export interface AlgorithmDescriptor {
  name: string;
  displayName: string;
  version: string;
  type: "rule-based" | "ml" | "llm" | "hybrid" | "metric";
  target: "X" | "Y" | "M1" | "M2" | "M3";
  batchSupported: boolean;
  requiresContext: boolean;
  description?: string;
  examples?: Array<{ input: unknown; output?: unknown; note?: string }>;
}

export interface UniversalResult {
  prediction: string;
  confidence: number;
  processingTime?: number;
  algorithmVersion?: string;
  metadata?: {
    inputType?: string;
    executionPath?: string[];
    warnings?: string[];
    details?: any;
  };
}
```

#### 1.2 Supprimer les fichiers legacy

```bash
# Supprimer les interfaces obsolètes
rm algorithms/level1/shared/legacyAdapters.ts
rm algorithms/level1/shared/BaseClassifier.ts
rm algorithms/level1/XAlgorithms/shared/BaseXClassifier.ts
rm algorithms/level1/YAlgorithms/shared/BaseYClassifier.ts
rm algorithms/level1/M1Algorithms/shared/BaseM1Calculator.ts
rm algorithms/level1/M2Algorithms/shared/BaseM2Calculator.ts
rm algorithms/level1/M3Algorithms/shared/BaseM3Calculator.ts
```

### Phase 2 : Registry simplifié (15 min)

#### 2.1 Refactorer AlgorithmRegistry.ts

```typescript
// algorithms/level1/shared/AlgorithmRegistry.ts
export class AlgorithmRegistry {
  private static algorithms = new Map<string, UniversalAlgorithm>();

  static register(name: string, algorithm: UniversalAlgorithm): void {
    // Validation stricte
    if (!algorithm.describe || !algorithm.run || !algorithm.validateConfig) {
      throw new Error(`${name} ne respecte pas UniversalAlgorithm`);
    }

    // Test métadonnées
    const meta = algorithm.describe();
    if (!meta.name || !meta.target || !meta.type) {
      throw new Error(`${name} métadonnées incomplètes`);
    }

    this.algorithms.set(name, algorithm);
    console.log(`✅ ${name} enregistré`);
  }

  static get(name: string): UniversalAlgorithm | undefined {
    return this.algorithms.get(name);
  }

  static list(): Array<{ key: string; meta: AlgorithmDescriptor }> {
    return Array.from(this.algorithms.entries()).map(([key, algo]) => ({
      key,
      meta: algo.describe(),
    }));
  }

  static getByTarget(target: string) {
    return this.list().filter(({ meta }) => meta.target === target);
  }
}
```

### Phase 3 : Migration des algorithmes (2h)

#### 3.1 M1ActionVerbCounter (20 min) - Le plus simple

**Fichier :** `algorithms/level1/M1Algorithms/M1ActionVerbCounter.ts`

**Stratégie :** Wrapper minimal - garde tout le code existant

```typescript
// GARDE la classe existante, change juste l'interface
export class M1ActionVerbCounter implements UniversalAlgorithm {
  // NOUVEAU : Interface standardisée
  describe(): AlgorithmDescriptor {
    return {
      name: "M1ActionVerbCounter",
      displayName: "M1 - Densité verbes d'action",
      version: "1.0.0",
      type: "metric",
      target: "M1",
      batchSupported: true,
      requiresContext: false,
      description:
        "Calcul de la densité de verbes d'action dans le tour conseiller",
    };
  }

  validateConfig(): boolean {
    return true;
  }

  // NOUVEAU : Wrapper qui appelle l'ancien code
  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input);
    const startTime = Date.now();

    // APPEL de l'ancienne méthode toResult()
    const legacyResult = this.toResult(verbatim);

    return {
      prediction: legacyResult.prediction,
      confidence: legacyResult.confidence,
      processingTime: Date.now() - startTime,
      algorithmVersion: "1.0.0",
      metadata: {
        inputType: "string",
        executionPath: ["verb_analysis"],
        details: legacyResult.metadata,
      },
    };
  }

  // GARDE TOUT le code existant (private methods)
  private currentConfig = {
    /* config existante */
  };
  private baseActionLemmas = new Set([
    /* verbes existants */
  ]);
  private toResult(text: string) {
    /* méthode existante inchangée */
  }
  private countActionVerbs(text: string) {
    /* méthode existante */
  }
  // etc. TOUT le code privé reste identique
}
```

#### 3.2 RegexYClassifier (25 min)

**Fichier :** `algorithms/level1/YAlgorithms/RegexYClassifier.ts`

**Stratégie :** Renommer `run()` en `runLegacy()` et wrapper

```typescript
export class RegexYClassifier implements UniversalAlgorithm {
  // GARDE toute la config existante
  private config: YConfig;
  private dictionnaires = {
    /* dictionnaires existants */
  };

  describe(): AlgorithmDescriptor {
    return {
      name: "RegexYClassifier",
      displayName: "Règles - Y (client)",
      version: "1.0.0",
      type: "rule-based",
      target: "Y",
      batchSupported: true,
      requiresContext: false,
      description:
        "Classification des réactions client par dictionnaires pondérés",
    };
  }

  validateConfig(): boolean {
    return true;
  }

  // NOUVEAU wrapper
  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input);
    const startTime = Date.now();

    // APPEL ancien code
    const legacyResult = await this.runLegacy(verbatim);

    return {
      prediction: legacyResult.prediction,
      confidence: legacyResult.confidence,
      processingTime: legacyResult.processingTimeMs || Date.now() - startTime,
      algorithmVersion: "1.0.0",
      metadata: {
        inputType: "string",
        executionPath: ["dictionary_classification"],
        details: legacyResult.metadata,
      },
    };
  }

  // RENOMMER l'ancienne run() en runLegacy() - GARDE TOUT
  private async runLegacy(input: string): Promise<YClassification> {
    // COLLER ICI tout le code de l'ancienne run() sans modification
  }

  // GARDE TOUTES les méthodes privées existantes
  private calculateScore() {
    /* inchangé */
  }
  private pickPrediction() {
    /* inchangé */
  }
  // etc.
}
```

#### 3.3 RegexXClassifier (25 min)

**Fichier :** `algorithms/level1/XAlgorithms/RegexXClassifier.ts`

**Stratégie :** Utiliser le code déjà fourni dans l'artifact précédent

- GARDE toutes les regex patterns
- GARDE la logique hiérarchique
- GARDE les garde-fous REFLET_VOUS
- Wrapper `run()` → `runLegacy()`

#### 3.4 M2LexicalAlignmentCalculator (25 min)

**Fichier :** `algorithms/level1/M2Algorithms/M2LexicalAlignmentCalculator.ts`

```typescript
export class M2LexicalAlignmentCalculator implements UniversalAlgorithm {
  // GARDE la config existante
  private config: LexicalConfig;

  describe(): AlgorithmDescriptor {
    return {
      name: "M2LexicalAlignment",
      displayName: "M2 - Alignement lexical",
      version: "1.0.0",
      type: "rule-based",
      target: "M2",
      batchSupported: true,
      requiresContext: true,
      description:
        "Score Jaccard entre T0 et T+1 (tokens FR, stopwords filtrés)",
    };
  }

  validateConfig(): boolean {
    return true;
  }

  async run(input: unknown): Promise<UniversalResult> {
    const m2Input = input as M2Input;
    const startTime = Date.now();

    // APPEL ancienne méthode calculate()
    const legacyResult = await this.calculate(m2Input);

    return {
      prediction: legacyResult.prediction,
      confidence: legacyResult.confidence,
      processingTime: legacyResult.processingTime || Date.now() - startTime,
      algorithmVersion: "1.0.0",
      metadata: {
        inputType: "M2Input",
        executionPath: ["tokenize", "jaccard", "classify"],
        details: legacyResult.details,
      },
    };
  }

  // GARDE la méthode calculate() existante
  async calculate(input: M2Input): Promise<CalculationResult<M2Details>> {
    // TOUT le code existant inchangé
  }

  // GARDE toutes les méthodes privées
  private getMetadata() {
    /* existant */
  }
  // etc.
}
```

#### 3.5 M2SemanticAlignmentCalculator (20 min)

**Fichier :** `algorithms/level1/M2Algorithms/M2SemanticAlignmentCalculator.ts`

Même stratégie que M2Lexical.

#### 3.6 M2CompositeAlignmentCalculator (20 min)

**Fichier :** `algorithms/level1/M2Algorithms/M2CompositeAlignmentCalculator.ts`

Même stratégie que M2Lexical.

#### 3.7 PausesM3Calculator (25 min)

**Fichier :** `algorithms/level1/M3Algorithms/PausesM3Calculator.tsx`

```typescript
export class PausesM3Calculator implements UniversalAlgorithm {
  describe(): AlgorithmDescriptor {
    return {
      name: "PausesM3Calculator",
      displayName: "M3 - Pauses et hésitations",
      version: "1.0.0",
      type: "metric",
      target: "M3",
      batchSupported: true,
      requiresContext: false,
      description: "Score de charge cognitive basé sur pauses/hésitations",
    };
  }

  validateConfig(): boolean {
    return true;
  }

  async run(input: unknown): Promise<UniversalResult> {
    const m3Input = this.normalizeInput(input);
    const startTime = Date.now();

    // APPEL ancienne méthode calculate()
    const legacyResult = await this.calculate(m3Input);

    return {
      prediction: legacyResult.prediction,
      confidence: legacyResult.confidence,
      processingTime: legacyResult.processingTime || Date.now() - startTime,
      algorithmVersion: "1.0.0",
      metadata: {
        inputType: "M3Input",
        executionPath: ["pause_detection", "hesitation_analysis"],
        details: legacyResult.details,
      },
    };
  }

  // GARDE toutes les méthodes existantes
  async calculate(input: M3Input) {
    /* code existant */
  }
  private normalizeInput() {
    /* code existant */
  }
  // etc.
}
```

### Phase 4 : Mise à jour de initializeAlgorithms (15 min)

#### 4.1 Simplifier l'enregistrement

**Fichier :** `algorithms/level1/shared/initializeAlgorithms.ts`

```typescript
export function initializeAlgorithms(): void {
  console.log("🚀 Initialisation AlgorithmLab harmonisé");

  try {
    // === X (Conseiller) - Plus de wrapper ===
    algorithmRegistry.register("RegexXClassifier", new RegexXClassifier());

    // === Y (Client) ===
    algorithmRegistry.register("RegexYClassifier", new RegexYClassifier());

    // === M1 (Linguistique) ===
    algorithmRegistry.register(
      "M1ActionVerbCounter",
      new M1ActionVerbCounter()
    );

    // === M2 (Alignement) ===
    algorithmRegistry.register(
      "M2LexicalAlignment",
      new M2LexicalAlignmentCalculator()
    );
    algorithmRegistry.register(
      "M2SemanticAlignment",
      new M2SemanticAlignmentCalculator()
    );
    algorithmRegistry.register(
      "M2CompositeAlignment",
      new M2CompositeAlignmentCalculator()
    );

    // === M3 (Cognitif) ===
    algorithmRegistry.register("PausesM3Calculator", new PausesM3Calculator());

    const count = algorithmRegistry.list().length;
    console.log(`✅ ${count} algorithmes harmonisés initialisés`);
  } catch (error) {
    console.error("❌ Erreur harmonisation:", error);
    throw error; // Fail fast
  }
}
```

#### 4.2 Supprimer les imports legacy

```bash
# Dans initializeAlgorithms.ts, supprimer :
# import { wrapXAlgorithm, wrapYAlgorithm, etc. }
```

### Phase 5 : Mise à jour useLevel1Testing (10 min)

#### 5.1 Simplifier le hook

**Fichier :** `hooks/useLevel1Testing.ts`

```typescript
const validateAlgorithm = useCallback(
  async (
    algorithmName: string,
    sampleSize: number
  ): Promise<TVValidationResult[]> => {
    // Plus de fallback - registry strict
    const algorithm = algorithmRegistry.get(algorithmName);
    if (!algorithm) {
      throw new Error(`Algorithme ${algorithmName} introuvable`);
    }

    // Plus de try/catch sur describe() - obligatoire
    const meta = algorithm.describe();

    // Validation stricte
    if (!algorithm.validateConfig()) {
      throw new Error(`${algorithmName} mal configuré`);
    }

    // Suite inchangée...
    const filteredSamples = filterCorpusForAlgorithm(
      goldStandardData,
      algorithmName
    );
    const samples = randomSample(filteredSamples, sampleSize);
    const inputs = prepareInputsForAlgorithm(samples, algorithmName);

    const results = await Promise.all(
      inputs.map(async (input, i) => {
        const sample = samples[i];
        const prediction = await algorithm.run(input); // Appel direct
        return mapToTVValidationResult(sample, prediction, meta);
      })
    );

    return results;
  },
  [goldStandardData]
);
```

### Phase 6 : Tests et validation (30 min)

#### 6.1 Script de validation

**Créer :** `scripts/validateHarmonization.ts`

```typescript
// Script pour tester tous les algorithmes harmonisés
export async function validateAllAlgorithms() {
  console.log("🔍 Validation harmonisation AlgorithmLab");

  const algorithms = algorithmRegistry.list();
  console.log(`📊 ${algorithms.length} algorithmes à tester`);

  const testInputs = {
    X: "je vais vérifier votre dossier",
    Y: "d'accord merci beaucoup",
    M1: "je vais traiter votre demande immédiatement",
    M2: {
      t0: "je comprends votre situation",
      t1: "merci de votre compréhension",
    },
    M3: {
      segment: "euh... c'est... comment dire... compliqué",
      language: "fr",
    },
  };

  for (const { key, meta } of algorithms) {
    console.log(`\n🎯 Test ${key} (${meta.target}):`);

    const algo = algorithmRegistry.get(key);
    if (!algo) {
      console.error(`❌ ${key} introuvable`);
      continue;
    }

    try {
      // Test interface
      console.log(
        `   Interface: ${typeof algo.describe === "function" ? "✅" : "❌"}`
      );
      console.log(`   Config: ${algo.validateConfig() ? "✅" : "⚠️"}`);

      // Test exécution
      const input = testInputs[meta.target];
      const start = Date.now();
      const result = await algo.run(input);
      const duration = Date.now() - start;

      console.log(`   Exécution: ✅ (${duration}ms)`);
      console.log(`   Prédiction: "${result.prediction}"`);
      console.log(`   Confiance: ${(result.confidence * 100).toFixed(1)}%`);
    } catch (error) {
      console.error(`❌ ${key}: ${error.message}`);
    }
  }
}
```

#### 6.2 Tests comparatifs

Tester que les résultats avant/après migration sont identiques :

```typescript
// Pour chaque algo, comparer ancien vs nouveau résultat
const oldResult = await oldAlgorithm.run(testInput);
const newResult = await newAlgorithm.run(testInput);

expect(newResult.prediction).toBe(oldResult.prediction);
expect(newResult.confidence).toBeCloseTo(oldResult.confidence, 2);
```

## 📋 Checklist de migration

### Préparation

- [ ] Backup du dossier `algorithms/level1`
- [ ] Créer `algorithms/interfaces/UniversalAlgorithm.ts`
- [ ] Supprimer fichiers legacy (Base\*.ts, legacyAdapters.ts)

### Algorithmes (ordre recommandé)

- [ ] M1ActionVerbCounter (simple)
- [ ] RegexYClassifier
- [ ] RegexXClassifier (complexe)
- [ ] M2LexicalAlignmentCalculator
- [ ] M2SemanticAlignmentCalculator
- [ ] M2CompositeAlignmentCalculator
- [ ] PausesM3Calculator

### Registry et hooks

- [ ] Refactorer AlgorithmRegistry.ts
- [ ] Nettoyer initializeAlgorithms.ts
- [ ] Simplifier useLevel1Testing.ts

### Validation

- [ ] Script validateHarmonization.ts
- [ ] Tests comparatifs ancien/nouveau
- [ ] Test de l'UI complète

## 🎯 Critères de succès

1. **Zéro régression** : Tous les résultats d'algorithmes identiques avant/après
2. **Interface homogène** : Tous implémentent `UniversalAlgorithm`
3. **Registry strict** : Plus de fallback, validation à l'enregistrement
4. **Code simple** : 50% moins de fichiers, logique plus claire
5. **Performance** : Plus de couches d'abstraction legacy

## 💡 Notes importantes

- **Conserver 100% de la logique métier** - Ne jamais toucher aux patterns/algorithmes
- **Wrapper minimal** - Juste changer l'interface, pas la logique
- **Migration incremental** - Tester après chaque algorithme
- **Fail fast** - Registry strict pour détecter les erreurs tôt
- **Compatibilité** - L'UI existing doit continuer à fonctionner

Cette migration vous donnera une architecture AlgorithmLab propre et homogène, prête pour ajouter de nouveaux algorithmes facilement.
