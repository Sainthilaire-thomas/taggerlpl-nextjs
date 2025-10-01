
# 📘 Guide 1 : Ajouter un nouvel algorithme

Je vais créer le fichier `add-new-algorithm.md` :

markdown

```markdown
# Ajouter un nouvel algorithme

**Temps estimé** : 30-45 minutes  
**Niveau** : Intermédiaire  
**Prérequis** : 
- Connaissance TypeScript
- Compréhension des variables X/Y/M1/M2/M3
- Lecture de [Variables](../../02-CORE-CONCEPTS/variables.md)

---

## 🎯 Ce que tu vas apprendre

- Créer un algorithme conforme à l'interface `UniversalAlgorithm`
- L'enregistrer dans le `AlgorithmRegistry`
- Le tester avec `BaseAlgorithmTesting`
- Afficher les résultats dans `ResultsPanel`

---

## 📁 Fichiers concernés
```

src/app/(protected)/analysis/components/AlgorithmLab/
├── algorithms/level1/
│   ├── M1Algorithms/
│   │   ├── M1ActionVerbCounter.ts     ← Exemple à suivre
│   │   └── shared/BaseM1Calculator.ts
│   ├── XAlgorithms/
│   │   └── OpenAIXClassifier.ts       ← Exemple LLM
│   └── shared/
│       ├── AlgorithmRegistry.ts       ← Enregistrement
│       └── UniversalAdapter.ts
├── types/algorithms/
│   └── base.ts                        ← Types principaux
└── components/Level1/algorithms/
└── BaseAlgorithmTesting.tsx       ← Interface de test

```

---

## 🚀 Étape 1 : Créer la classe de l'algorithme

### Exemple : Calculateur M1 (densité de verbes d'action)

Créer le fichier : `algorithms/level1/M1Algorithms/MyM1Calculator.ts`
```typescript
import type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base";

type M1Config = {
  perTokens: number;              // Normalisation (ex: 100 tokens)
  includeFutureProche: boolean;   // "aller + infinitif"
  customVerbs?: string[];         // Verbes métier additionnels
};

export class MyM1Calculator implements UniversalAlgorithm {
  private config: M1Config = {
    perTokens: 100,
    includeFutureProche: true,
  };

  // ✅ OBLIGATOIRE : Métadonnées de l'algorithme
  describe(): AlgorithmDescriptor {
    return {
      name: "MyM1Calculator",
      displayName: "Mon Calculateur M1",
      version: "1.0.0",
      type: "metric",              // "rule-based" | "ml" | "llm" | "metric"
      target: "M1",                // "X" | "Y" | "M1" | "M2" | "M3"
      batchSupported: true,
      requiresContext: false,
      description: "Calcule la densité de verbes d'action",
      examples: [
        {
          input: "je vais vérifier votre dossier",
          output: { prediction: "25.00", confidence: 0.7 },
          note: "2 verbes sur 8 tokens = 25%"
        }
      ],
    };
  }

  // ✅ OBLIGATOIRE : Validation de la config
  validateConfig(): boolean {
    return this.config.perTokens > 0;
  }

  // ✅ OBLIGATOIRE : Exécution principale
  async run(input: unknown): Promise<UniversalResult> {
    const verbatim = String(input);
    const startTime = Date.now();

    // 1️⃣ Tokenisation
    const tokens = this.tokenize(verbatim);

    // 2️⃣ Détection des verbes d'action
    const verbs = this.detectActionVerbs(tokens);

    // 3️⃣ Calcul de la densité
    const density = (verbs.length / tokens.length) * this.config.perTokens;

    // 4️⃣ Construction du résultat universel
    return {
      prediction: density.toFixed(2),        // ✅ String obligatoire
      confidence: Math.min(1, 0.5 + verbs.length / 10),
      processingTime: Date.now() - startTime,
      algorithmVersion: "1.0.0",
      metadata: {
        target: "M1",
        inputType: "string",
        executionPath: ["tokenize", "detect", "normalize"],
        // 🔑 IMPORTANT : Structure M1 pour extraColumns
        m1: {
          value: density,
          actionVerbCount: verbs.length,
          totalTokens: tokens.length,
          verbsFound: verbs,
        }
      },
    };
  }

  // ⚙️ OPTIONNEL : Support batch
  async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
    return Promise.all(inputs.map(input => this.run(input)));
  }

  // 🔧 Logique métier privée
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .split(/[^a-zàâäéèêëîïôöùûüç'_]+/i)
      .filter(Boolean);
  }

  private detectActionVerbs(tokens: string[]): string[] {
    const actionVerbs = new Set([
      "verifier", "envoyer", "traiter", "regarder", 
      ...(this.config.customVerbs || [])
    ]);
  
    return tokens.filter(t => actionVerbs.has(this.guessLemma(t)));
  }

  private guessLemma(token: string): string {
    // Lemmatisation simple (à améliorer avec NLP si besoin)
    if (/er$/.test(token)) return token;
    if (/e|es|ons|ez|ent$/.test(token)) 
      return token.replace(/(e|es|ons|ez|ent)$/, 'er');
    return token;
  }
}
```

---

## 🚀 Étape 2 : Enregistrer l'algorithme

### Fichier d'initialisation : `algorithms/level1/M1Algorithms/index.ts`

typescript

```typescript
import{ algorithmRegistry }from"../shared/AlgorithmRegistry";
import{MyM1Calculator}from"./MyM1Calculator";

// ✅ Enregistrement simple
exportfunctionregisterM1Algorithms(){
  algorithmRegistry.register(
"MyM1Calculator",
newMyM1Calculator(),
{
      displayName:"Mon Calculateur M1 v1.0",
      description:"Densité de verbes d'action avec lemmatisation basique"
}
);
  
console.log("✅ M1 algorithms registered");
}
```

### Appel dans le fichier principal d'initialisation

typescript

```typescript
// algorithms/level1/index.ts
import{ registerM1Algorithms }from"./M1Algorithms";
import{ registerXAlgorithms }from"./XAlgorithms";

exportfunctioninitializeAllAlgorithms(){
registerM1Algorithms();
registerXAlgorithms();
// ... autres variables
}
```

---

## 🚀 Étape 3 : Tester l'algorithme

### Interface de test automatique

typescript

```typescript
// components/Level1/algorithms/M1Calculators/M1Testing.tsx
import{BaseAlgorithmTesting}from"../BaseAlgorithmTesting";

exportconstM1Testing=()=>(
<BaseAlgorithmTesting
    variableLabel="M1 — Densité de verbes d'action"
    defaultClassifier="MyM1Calculator"
    target="M1"
/>
);
```

**Ce que fait `BaseAlgorithmTesting` automatiquement** :

1. ✅ Charge le gold standard depuis `useLevel1Testing`
2. ✅ Exécute l'algorithme sur N échantillons
3. ✅ Calcule les métriques (MAE, RMSE, R²)
4. ✅ Affiche les résultats dans `ResultsPanel`

---

## 🚀 Étape 4 : Afficher les résultats

Les colonnes sont **automatiquement générées** par `extraColumns.tsx` :

typescript

```typescript
// Colonnes M1 affichées automatiquement :
// - M1 (densité) : Chip avec valeur
// - # Verbes : Compteur
// - Tokens : Nombre total
// - Verbes trouvés : Liste de chips
```

**Pas besoin de configuration supplémentaire !** Le système détecte `target="M1"` et applique les bonnes colonnes.

---

## ✅ Checklist finale

Avant de considérer ton algorithme prêt :

* [ ] ✅ Implémente `describe()`, `validateConfig()`, `run()`
* [ ] ✅ Retourne `UniversalResult` conforme
* [ ] ✅ Place les données métier dans `metadata.m1` (ou m2/m3/x_details/y_details)
* [ ] ✅ Enregistré dans `AlgorithmRegistry`
* [ ] ✅ Testé avec `BaseAlgorithmTesting`
* [ ] ✅ Vérifie que les colonnes s'affichent correctement dans `ResultsPanel`
* [ ] ✅ MAE < 3 pour M1 (ou seuil acceptable pour ta variable)
* [ ] ✅ Documentation JSDoc sur les méthodes clés

---

## 🐛 Problèmes fréquents

### ❌ Problème : Les colonnes ne s'affichent pas

**Cause** : Structure `metadata` incorrecte

**Solution** : Vérifie que tu places bien les données dans le bon champ :

typescript

```typescript
// ✅ CORRECT pour M1
metadata:{
  m1:{
    value: density,
    actionVerbCount: verbs.length,
    totalTokens: tokens.length,
    verbsFound: verbs,
}
}

// ❌ INCORRECT
metadata:{
  density: density,// Pas au bon endroit !
}
```

---

### ❌ Problème : `algorithmRegistry.get()` retourne `undefined`

**Cause** : Algorithme non enregistré ou nom erroné

**Solution** :

typescript

```typescript
// Vérifie la console
console.log(algorithmRegistry.list());

// Assure-toi que l'init est appelée
initializeAllAlgorithms();
```

---

### ❌ Problème : Erreur TypeScript sur `UniversalResult`

**Cause** : Import incorrect

**Solution** :

typescript

```typescript
// ✅ CORRECT
importtype{UniversalResult}from"@/types/algorithms/base";

// ❌ INCORRECT
import{UniversalResult}from"...";// Pas de `type`
```

---

## 📚 Ressources complémentaires

* **[Variables](../../02-CORE-CONCEPTS/variables.md)** - Comprendre M1/M2/M3
* **[Métriques](../../02-CORE-CONCEPTS/metrics.md)** - MAE, RMSE, R²
* **[Type System](../../01-ARCHITECTURE/type-system.md)** - Interfaces détaillées
* **[API AlgorithmRegistry](../../04-API-REFERENCE/algorithms/registry.md)**

---

## 🎯 Prochaine étape

Maintenant que ton algorithme fonctionne, tu peux :

1. **[Créer un composant UI personnalisé](create-ui-component.md)** pour afficher des métriques spécifiques
2. **[Intégrer un LLM](integrate-llm.md)** si tu veux utiliser GPT/Claude
3. **[Étendre les métriques](extend-metrics.md)** avec des calculs métier personnalisés

---

⏱️ **Temps de lecture** : ~10 minutes

🎯 **Difficulté** : ⭐⭐⭐ Intermédiaire
