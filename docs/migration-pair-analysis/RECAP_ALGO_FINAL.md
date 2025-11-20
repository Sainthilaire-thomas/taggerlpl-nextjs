# 📊 RÉCAPITULATIF : Fonctionnement des Algorithmes dans l'Application

**Date** : 20 novembre 2025  
**Architecture** : Nouvelle architecture (Phase 3)  
**Base de données** : `analysis_pairs` (901 paires)

---

## 🎯 VUE D'ENSEMBLE

### Les 5 Types d'Algorithmes

| Algorithme | Cible | Input | Output | Colonne DB |
|------------|-------|-------|--------|------------|
| **X** | Conseiller | Verbatim conseiller | ENGAGEMENT, OUVERTURE, REFLET_*, EXPLICATION | `x_predicted_tag`, `x_confidence` |
| **Y** | Client | Verbatim client | CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF | `y_predicted_tag`, `y_confidence` |
| **M1** | Médiation | Verbatim conseiller | Densité de verbes d'action | `m1_verb_density`, `m1_verb_count` |
| **M2** | Médiation | Paire complète | Alignement linguistique | `m2_lexical_alignment`, `m2_global_alignment` |
| **M3** | Médiation | Verbatim client | Charge cognitive (hésitations, pauses) | `m3_cognitive_score`, `m3_hesitation_count` |

---

## 🏗️ ARCHITECTURE DU SYSTÈME

### Structure des Dossiers (Nouvelle Architecture)

```
src/features/phase3-analysis/level1-validation/
│
├── algorithms/
│   ├── classifiers/
│   │   ├── client/
│   │   │   └── RegexClientClassifier.ts          (Y)
│   │   └── conseiller/
│   │       ├── OpenAIConseillerClassifier.ts     (X)
│   │       ├── MistralConseillerClassifier.ts    (X)
│   │       └── RegexConseillerClassifier.ts      (X)
│   │
│   ├── calculators/
│   │   ├── M1ActionVerbCounter.ts                (M1)
│   │   ├── M2CompositeAlignmentCalculator.ts     (M2)
│   │   └── PausesM3Calculator.ts                 (M3)
│   │
│   └── shared/
│       ├── BaseClassifier.ts                     (Interface commune)
│       ├── AlgorithmRegistry.ts                  (Registre global)
│       └── initializeAlgorithms.ts               (Initialisation)
│
├── ui/
│   ├── hooks/
│   │   ├── useLevel1Testing.ts                   ⭐ HOOK PRINCIPAL
│   │   ├── useAnalysisPairs.ts                   (Lecture DB)
│   │   └── normalizeUniversalToTV.ts             (Normalisation résultats)
│   │
│   └── components/
│       ├── AlgorithmLab/
│       │   ├── ClientAlgorithmLabWrapper.tsx     (Wrapper client)
│       │   └── Level1Interface.tsx               (Interface principale)
│       │
│       └── algorithms/
│           ├── XClassifiers/
│           │   └── XValidationInterface.tsx
│           ├── YClassifiers/
│           │   └── YValidationInterface.tsx
│           └── shared/
│               └── BaseAlgorithmTesting.tsx      (Composant de test)
```

---

## 🔄 FLUX D'EXÉCUTION COMPLET

### Étape 1 : Chargement des Données

**Fichier** : `useLevel1Testing.ts` (ligne 375)

```typescript
const { analysisPairs, loading, error } = useAnalysisPairs();
```

**Que fait useAnalysisPairs ?**
- Lit depuis la table `analysis_pairs`
- Charge les **901 paires** avec toutes leurs colonnes
- Chaque paire contient :
  - `pair_id` (SERIAL, clé primaire)
  - `conseiller_verbatim` (texte conseiller)
  - `client_verbatim` (texte client)
  - `strategy_tag` (tag manuel conseiller)
  - `reaction_tag` (tag manuel client)
  - Colonnes de résultats : `x_predicted_tag`, `y_predicted_tag`, `m1_*`, `m2_*`, `m3_*`

---

### Étape 2 : Conversion en Gold Standard

**Fichier** : `useLevel1Testing.ts` (lignes 127-164)

**Fonction** : `mapH2ToGoldStandard(analysisPairs)`

**Ce qu'elle fait** :
```typescript
const samples = pairs.map(pair => ({
  verbatim: pair.conseiller_verbatim,
  expectedTag: normalizeXLabelStrict(pair.strategy_tag),
  metadata: {
    target: 'conseiller',
    callId: pair.call_id,
    turnId: pair.conseiller_turn_id,
    pairId: pair.pair_id,              // ⭐ CRUCIAL
    client_verbatim: pair.client_verbatim,
    reaction_tag: pair.reaction_tag,
    // ... autres métadonnées
  }
}))
```

**Résultat** : Tableau de `GoldStandardSample[]`
- Chaque sample contient le `pairId` dans `metadata.pairId`
- Ce pairId permet de retrouver la ligne exacte dans `analysis_pairs` pour écrire les résultats

---

### Étape 3 : Sélection et Préparation

**Fichier** : `useLevel1Testing.ts` (lignes 439-456)

**Quand l'utilisateur clique "Lancer le test" :**

1. **Filtrage** (ligne 439) :
   ```typescript
   const filteredBase = filterCorpusForAlgorithm(goldStandardData, classifierName);
   ```
   - Filtre selon la cible (conseiller pour X, client pour Y)

2. **Échantillonnage** (ligne 449) :
   ```typescript
   const samples = randomSample(filteredBase, sampleSize);
   ```
   - Prend N échantillons aléatoires (défini par l'utilisateur)

3. **Préparation inputs** (ligne 456) :
   ```typescript
   const inputs = prepareInputsForAlgorithm(samples, classifierName);
   ```
   - Adapte les données au format attendu par l'algorithme

---

### Étape 4 : Exécution de l'Algorithme

**Fichier** : `useLevel1Testing.ts` (lignes 468-485)

**Boucle d'exécution** :
```typescript
for (let i = 0; i < inputs.length; i++) {
  const input = inputs[i];           // Input adapté
  const sample = samples[i];         // Sample original avec metadata.pairId
  
  // Exécution de l'algorithme
  const uni = await classifier.run(input);
  
  // Normalisation du résultat
  const tv = normalizeUniversalToTV(
    uni,                              // Résultat brut de l'algo
    {
      verbatim: sample.verbatim,
      expectedTag: sample.expectedTag,
      metadata: sample.metadata       // ⭐ Contient pairId
    },
    { target: config.target }
  );
  
  tvRows.push(tv);
}
```

**Ce qui se passe ici** :
1. L'algorithme traite `input` et retourne `uni` (UniversalResult)
2. `normalizeUniversalToTV` combine :
   - Le résultat de l'algo (`uni`)
   - Les métadonnées du sample original (avec `pairId`)
3. Produit un `TVValidationResult` normalisé

---

### Étape 5 : Normalisation des Résultats

**Fichier** : `normalizeUniversalToTV.ts`

**Structure du résultat normalisé** :
```typescript
{
  verbatim: "je vais vérifier votre dossier",
  goldStandard: "ENGAGEMENT",        // Tag manuel de référence
  predicted: "ENGAGEMENT",           // Tag prédit par l'algo
  correct: true,                     // Comparaison
  confidence: 0.85,                  // Score de confiance
  processingTime: 120,               // Temps de calcul (ms)
  metadata: {
    // ⚠️ PROBLÈME ACTUEL : pairId n'est PAS transmis ici
    turnId: 1234,
    callId: "312",
    algorithmMetadata: {...},
    x_details: {...},                // Détails spécifiques à X
    // ... autres métadonnées
  }
}
```

**⚠️ LE PROBLÈME** : 
- `sample.metadata.pairId` existe (ligne 481 de useLevel1Testing)
- Mais `normalizeUniversalToTV` ne le copie PAS dans `baseMd`
- Donc `result.metadata.pairId` est **undefined**

---

### Étape 6 : Écriture en Base de Données

**Fichier** : `useLevel1Testing.ts` (lignes 188-267)

**Fonction** : `updateH2WithResults(tvRows, classifierName, version)`

**Tentative actuelle** (ligne 191) :
```typescript
const pairId = getH2Property(result.metadata, 'pairId');
if (!pairId) {
  console.warn('⚠️ Pas de pairId:', result);  // ← C'EST ICI QU'ON EST BLOQUÉ
  errorCount++;
  continue;
}
```

**Ce qui devrait se passer** :
```typescript
await supabase
  .from('analysis_pairs')
  .update({
    x_predicted_tag: result.predicted,      // Ex: "ENGAGEMENT"
    x_confidence: result.confidence,        // Ex: 0.85
    x_algorithm_key: algorithmName,         // Ex: "RegexXClassifier"
    x_algorithm_version: algorithmVersion,
    x_computed_at: new Date().toISOString()
  })
  .eq('pair_id', pairId);                  // ← BESOIN DU pairId !
```

---

## 🎨 NORMALISATION : Interface Universelle

### Pourquoi la Normalisation ?

**Problème initial** : Chaque algorithme retournait un format différent
- RegexXClassifier : `{ prediction: "ENGAGEMENT", score: 0.8 }`
- OpenAIXClassifier : `{ label: "ENGAGEMENT", confidence: 0.85, reasoning: "..." }`
- M1ActionVerbCounter : `{ density: 0.23, verbs: [...] }`

**Solution** : Interface `UniversalResult`

```typescript
interface UniversalResult {
  prediction: string;          // Label prédit
  confidence: number;          // Score 0-1
  processingTime?: number;     // Temps de calcul
  metadata?: Record<string, any>;  // Détails spécifiques
}
```

### Implémentation dans BaseClassifier

**Fichier** : `algorithms/shared/BaseClassifier.ts`

```typescript
abstract class BaseClassifier<TInput, TOutput> {
  abstract run(input: TInput): Promise<UniversalResult>;
}
```

**Exemple concret - RegexXClassifier** :
```typescript
async run(input: string): Promise<UniversalResult> {
  // 1. Analyse du texte
  const patterns = this.detectPatterns(input);
  
  // 2. Classification
  const prediction = this.classify(patterns);
  
  // 3. Calcul confiance
  const confidence = this.calculateConfidence(patterns);
  
  // 4. Retour normalisé
  return {
    prediction: prediction,              // "ENGAGEMENT"
    confidence: confidence,              // 0.85
    processingTime: Date.now() - start,  // 15ms
    metadata: {
      details: {
        matchedPatterns: patterns,       // Détails pour X
        family: "ACTION",
        rationale: "Verbe d'action + pronom je"
      }
    }
  };
}
```

### Normalisation Finale (normalizeUniversalToTV)

**Rôle** : Transformer `UniversalResult` en `TVValidationResult`

```typescript
UniversalResult                    TVValidationResult
├─ prediction: "ENGAGEMENT"    →   ├─ predicted: "ENGAGEMENT"
├─ confidence: 0.85            →   ├─ confidence: 0.85
├─ metadata: {...}             →   ├─ goldStandard: "ENGAGEMENT"
                                   ├─ correct: true
                                   ├─ verbatim: "..."
                                   └─ metadata: {
                                        x_details: {...},
                                        turnId: 1234,
                                        callId: "312"
                                        // ⚠️ pairId manquant
                                      }
```

---

## 🔑 LES IDENTIFIANTS CLÉS

### Dans la Base de Données

**Table `analysis_pairs`** :
```sql
pair_id BIGSERIAL PRIMARY KEY,        -- ⭐ Clé primaire unique
call_id TEXT NOT NULL,                 -- Identifiant appel
conseiller_turn_id INTEGER NOT NULL,   -- ID tour conseiller
client_turn_id INTEGER NOT NULL,       -- ID tour client
```

### Dans le Code

**1. Au chargement** (`useAnalysisPairs`) :
```typescript
analysisPairs: AnalysisPair[]
  └─> pair_id: 42
      conseiller_verbatim: "je vais vérifier"
      ...
```

**2. Dans le Gold Standard** (`mapH2ToGoldStandard`) :
```typescript
GoldStandardSample {
  verbatim: "je vais vérifier",
  expectedTag: "ENGAGEMENT",
  metadata: {
    pairId: 42          // ⭐ Transmis depuis analysis_pairs
  }
}
```

**3. Pendant l'exécution** (`normalizeUniversalToTV`) :
```typescript
sample.metadata.pairId: 42    // ✅ Existe en input
result.metadata.pairId: ???   // ❌ PAS transmis en output
```

**4. À l'écriture** (`updateH2WithResults`) :
```typescript
const pairId = result.metadata.pairId;  // ❌ undefined
// → Échec de l'UPDATE
```

---

## 🐛 LE BUG ACTUEL : Chaîne Cassée

### Traçabilité du pairId

```
✅ analysis_pairs.pair_id (DB)
    ↓
✅ analysisPairs[i].pair_id (Hook)
    ↓
✅ sample.metadata.pairId (Gold Standard)
    ↓
✅ Passé à normalizeUniversalToTV (Input)
    ↓
❌ result.metadata.pairId (Output) ← CASSÉ ICI
    ↓
❌ Extraction impossible dans updateH2WithResults
```

### La Ligne Manquante

**Fichier** : `normalizeUniversalToTV.ts` (ligne ~36)

**Actuellement** :
```typescript
const baseMd: Record<string, any> = {
  ...(uni.metadata ?? {}),
  algorithmMetadata: uni.metadata ?? {},
  details: (uni.metadata as any)?.details ?? {},
  turnId: sample.metadata?.turnId ?? undefined,    // ✅ Transmis
  callId: sample.metadata?.callId ?? undefined,    // ✅ Transmis
  // ❌ pairId manquant !
  prev1_turn_verbatim: sample.metadata?.prev1_turn_verbatim,
  ...
};
```

**Ce qu'il faut** :
```typescript
const baseMd: Record<string, any> = {
  ...(uni.metadata ?? {}),
  algorithmMetadata: uni.metadata ?? {},
  details: (uni.metadata as any)?.details ?? {},
  pairId: sample.metadata?.pairId ?? undefined,    // ⭐ AJOUT NÉCESSAIRE
  turnId: sample.metadata?.turnId ?? undefined,
  callId: sample.metadata?.callId ?? undefined,
  prev1_turn_verbatim: sample.metadata?.prev1_turn_verbatim,
  ...
};
```

---

## 🎯 LA SOLUTION (1 ligne à ajouter)

### Modification Minimale

**Fichier** : `src/features/phase3-analysis/level1-validation/ui/hooks/normalizeUniversalToTV.ts`

**Ligne à ajouter** : Entre les lignes 35-36

```typescript
pairId: sample.metadata?.pairId ?? undefined,
```

### Impact

**AVANT** :
- Algorithmes s'exécutent ✅
- Résultats calculés ✅
- Écriture en DB ❌ (pas de pairId)

**APRÈS** :
- Algorithmes s'exécutent ✅
- Résultats calculés ✅
- Écriture en DB ✅ (pairId transmis)

---

## 📊 RÉCAPITULATIF VISUEL

```
┌─────────────────────────────────────────────────────────────────┐
│  BASE DE DONNÉES : analysis_pairs (901 paires)                  │
│  ├─ pair_id: 42                                                 │
│  ├─ conseiller_verbatim: "je vais vérifier..."                 │
│  ├─ strategy_tag: "ENGAGEMENT" (manuel)                         │
│  └─ x_predicted_tag: NULL (à remplir)                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  useAnalysisPairs()                   │
        │  Charge les 901 paires                │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  mapH2ToGoldStandard()                │
        │  ✅ Ajoute metadata.pairId: 42         │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  Utilisateur clique "Lancer test"     │
        │  Sélectionne RegexXClassifier         │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  classifier.run(input)                │
        │  Retourne: { prediction, confidence } │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  normalizeUniversalToTV()             │
        │  ❌ Oublie de transmettre pairId       │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  updateH2WithResults()                │
        │  ❌ Pas de pairId → Échec UPDATE       │
        └───────────────────────────────────────┘
```

---

## ✅ PROCHAINE ÉTAPE

**Commande PowerShell pour appliquer la correction** :

```powershell
$file = "src\features\phase3-analysis\level1-validation\ui\hooks\normalizeUniversalToTV.ts"
$content = Get-Content $file -Raw -Encoding UTF8

$content = $content -replace `
  "turnId: sample\.metadata\?\.turnId \?\? undefined,", `
  "pairId: sample.metadata?.pairId ?? undefined,`n    turnId: sample.metadata?.turnId ?? undefined,"

Set-Content $file -Value $content -Encoding UTF8 -NoNewline
```

---

**Auteur** : Claude  
**Date** : 20 novembre 2025  
**État** : Diagnostic complet - Prêt pour correction
