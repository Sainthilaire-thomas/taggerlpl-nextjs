
# Métriques AlgorithmLab

**Guide complet des métriques de validation scientifique**

---

## 🎯 Vue d'ensemble

AlgorithmLab utilise **deux familles de métriques** selon le type de variable analysée :

| Type de variable         | Variables | Métriques utilisées                                                      |
| ------------------------ | --------- | -------------------------------------------------------------------------- |
| **Classification** | X, Y, M2  | Accuracy, Precision, Recall, F1-Score, Cohen's Kappa, Matrice de confusion |
| **Numérique**     | M1, M3    | MAE, RMSE, R², Corrélation (Pearson/Spearman)                            |

**Principe clé** : Le système dispatche automatiquement les bonnes métriques selon le `targetKind` de l'algorithme.

---

## 📊 Métriques de Classification (X, Y, M2)

### 1. Accuracy (Exactitude globale)

**Définition** : Proportion de prédictions correctes sur l'ensemble du dataset.

**Formule** :

```
Accuracy = (TP + TN) / (TP + TN + FP + FN)

Où :
- TP = True Positives (vrais positifs)
- TN = True Negatives (vrais négatifs)  
- FP = False Positives (faux positifs)
- FN = False Negatives (faux négatifs)
```

**Implémentation TypeScript** :

```typescript
function calculateAccuracy(results: ValidationResult[]): number {
  const correct = results.filter(r => r.predicted === r.goldStandard).length;
  return results.length > 0 ? correct / results.length : 0;
}
```

**Interprétation** :

- **0.95+ (95%)** : Excellent
- **0.85-0.94** : Très bon
- **0.70-0.84** : Acceptable
- **< 0.70** : Insuffisant

**Exemple** :

```typescript
// Sur 100 tours de parole :
// - 85 correctement classés
// - 15 erreurs
// → Accuracy = 85/100 = 0.85 (85%)
```

**Limitations** :

- ⚠️ Peu fiable avec des **classes déséquilibrées**
- Exemple : Si 95% des tours sont "EXPLICATION", un algorithme qui prédit toujours "EXPLICATION" aura 95% d'accuracy mais sera inutile

---

### 2. Precision (Précision)

**Définition** : Parmi les prédictions positives, combien sont réellement correctes ?

**Formule** :

```
Precision = TP / (TP + FP)
```

**Implémentation TypeScript** :

```typescript
function calculatePrecision(
  results: ValidationResult[], 
  targetClass: string
): number {
  const tp = results.filter(
    r => r.predicted === targetClass && r.goldStandard === targetClass
  ).length;
  
  const fp = results.filter(
    r => r.predicted === targetClass && r.goldStandard !== targetClass
  ).length;
  
  return (tp + fp) > 0 ? tp / (tp + fp) : 0;
}
```

**Interprétation** :

- **Haute précision** : Peu de faux positifs (on ne se trompe pas quand on prédit cette classe)
- **Basse précision** : Beaucoup de faux positifs (on sur-prédit cette classe)

**Exemple pour X = "ENGAGEMENT"** :

```typescript
// Sur 100 prédictions "ENGAGEMENT" :
// - 80 sont vraiment "ENGAGEMENT" (TP)
// - 20 sont autre chose (FP)
// → Precision = 80/100 = 0.80
```

**Cas d'usage** :

- Prioritaire quand les **faux positifs coûtent cher**
- Exemple : Un algo qui détecte "ENGAGEMENT" doit être précis pour ne pas créer de fausses promesses d'action

---

### 3. Recall (Rappel / Sensibilité)

**Définition** : Parmi tous les cas positifs réels, combien ont été détectés ?

**Formule** :

```
Recall = TP / (TP + FN)
```

**Implémentation TypeScript** :

```typescript
function calculateRecall(
  results: ValidationResult[], 
  targetClass: string
): number {
  const tp = results.filter(
    r => r.predicted === targetClass && r.goldStandard === targetClass
  ).length;
  
  const fn = results.filter(
    r => r.predicted !== targetClass && r.goldStandard === targetClass
  ).length;
  
  return (tp + fn) > 0 ? tp / (tp + fn) : 0;
}
```

**Interprétation** :

- **Haut rappel** : Peu de faux négatifs (on détecte bien tous les cas de cette classe)
- **Bas rappel** : Beaucoup de faux négatifs (on rate des cas importants)

**Exemple pour X = "ENGAGEMENT"** :

```typescript
// Sur 100 tours vraiment "ENGAGEMENT" dans le gold standard :
// - 75 détectés par l'algo (TP)
// - 25 ratés/classés autrement (FN)
// → Recall = 75/100 = 0.75
```

**Cas d'usage** :

- Prioritaire quand les **faux négatifs coûtent cher**
- Exemple : Un algo qui détecte "CLIENT_NEGATIF" doit avoir un haut rappel pour ne pas rater des signaux d'insatisfaction

---

### 4. F1-Score (Moyenne harmonique)

**Définition** : Équilibre entre Precision et Recall.

**Formule** :

```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

**Implémentation TypeScript** :

```typescript
function calculateF1Score(precision: number, recall: number): number {
  return (precision + recall) > 0 
    ? 2 * (precision * recall) / (precision + recall) 
    : 0;
}

// Calcul pour toutes les classes
function calculateF1PerClass(
  results: ValidationResult[]
): Record<string, number> {
  const classes = [...new Set(results.map(r => r.goldStandard))];
  const f1Scores: Record<string, number> = {};
  
  for (const cls of classes) {
    const precision = calculatePrecision(results, cls);
    const recall = calculateRecall(results, cls);
    f1Scores[cls] = calculateF1Score(precision, recall);
  }
  
  return f1Scores;
}
```

**Interprétation** :

- **F1 = 1.0** : Precision et Recall parfaits
- **F1 = 0.0** : Aucune détection correcte
- **F1 élevé** : Bon équilibre entre faux positifs et faux négatifs

**Exemple** :

```typescript
// Precision = 0.80, Recall = 0.75
// F1 = 2 × (0.80 × 0.75) / (0.80 + 0.75)
//    = 2 × 0.60 / 1.55
//    = 0.774 (77.4%)
```

**Seuils recommandés** :

- **F1 > 0.85** : Excellent
- **F1 = 0.70-0.84** : Bon
- **F1 < 0.70** : À améliorer

**Usage dans AlgorithmLab** :

- Métrique principale pour comparer les algorithmes X/Y/M2
- Calculée par classe puis moyennée (macro-average)

---

### 5. Cohen's Kappa (κ)

**Définition** : Mesure d'accord entre deux annotateurs (ou algorithme vs gold standard) en tenant compte de l'accord dû au hasard.

**Formule** :

```
κ = (P₀ - Pₑ) / (1 - Pₑ)

Où :
- P₀ = Accord observé (accuracy)
- Pₑ = Accord attendu par hasard
```

**Implémentation TypeScript** :

```typescript
function calculateCohenKappa(results: ValidationResult[]): number {
  const n = results.length;
  if (n === 0) return 0;
  
  // Obtenir toutes les classes
  const classes = [
    ...new Set([
      ...results.map(r => r.predicted),
      ...results.map(r => r.goldStandard)
    ])
  ];
  
  // Construire matrice de confusion
  const matrix: Record<string, Record<string, number>> = {};
  classes.forEach(c1 => {
    matrix[c1] = {};
    classes.forEach(c2 => {
      matrix[c1][c2] = 0;
    });
  });
  
  results.forEach(r => {
    matrix[r.predicted][r.goldStandard]++;
  });
  
  // P₀ (accord observé)
  const p0 = results.filter(r => r.predicted === r.goldStandard).length / n;
  
  // Pₑ (accord attendu par hasard)
  let pe = 0;
  classes.forEach(cls => {
    const marginalPredicted = 
      classes.reduce((sum, c) => sum + (matrix[cls][c] || 0), 0) / n;
    const marginalActual = 
      classes.reduce((sum, c) => sum + (matrix[c][cls] || 0), 0) / n;
    pe += marginalPredicted * marginalActual;
  });
  
  // Kappa
  return pe === 1 ? 0 : (p0 - pe) / (1 - pe);
}
```

**Interprétation (Landis & Koch, 1977)** :

- **κ > 0.80** : Accord quasi-parfait
- **κ = 0.61-0.80** : Accord substantiel
- **κ = 0.41-0.60** : Accord modéré
- **κ = 0.21-0.40** : Accord faible
- **κ < 0.20** : Accord léger à nul

**Exemple** :

```typescript
// 100 classifications, 3 classes équilibrées
// Accord observé : 85% (P₀ = 0.85)
// Accord hasard : 33% (Pₑ = 0.33)
// κ = (0.85 - 0.33) / (1 - 0.33) = 0.52 / 0.67 = 0.776
// → Accord substantiel
```

**Usage dans AlgorithmLab** :

- **Level 0** : Mesurer l'accord inter-annotateur
- **Level 1** : Valider la cohérence algorithme vs gold standard
- **Seuil minimal** : κ > 0.70 pour publication scientifique

---

### 6. Matrice de confusion

**Définition** : Tableau croisé montrant les prédictions vs réalité.

**Structure** :

```
                    Prédiction
                │ ENG │ OUV │ REF │ EXP │
        ────────┼─────┼─────┼─────┼─────┤
        ENG     │ 45  │  3  │  1  │  1  │ ← 50 vrais ENG
Réel    OUV     │  2  │ 38  │  0  │ 10  │ ← 50 vrais OUV
(Gold)  REF     │  1  │  0  │ 47  │  2  │ ← 50 vrais REF
        EXP     │  0  │  5  │  1  │ 44  │ ← 50 vrais EXP
```

**Implémentation TypeScript** :

```typescript
interface ConfusionMatrix {
  matrix: Record<string, Record<string, number>>;
  classes: string[];
  total: number;
}

function buildConfusionMatrix(
  results: ValidationResult[]
): ConfusionMatrix {
  const classes = [
    ...new Set([
      ...results.map(r => r.predicted),
      ...results.map(r => r.goldStandard)
    ])
  ].sort();
  
  const matrix: Record<string, Record<string, number>> = {};
  classes.forEach(predicted => {
    matrix[predicted] = {};
    classes.forEach(actual => {
      matrix[predicted][actual] = 0;
    });
  });
  
  results.forEach(r => {
    matrix[r.predicted][r.goldStandard]++;
  });
  
  return {
    matrix,
    classes,
    total: results.length
  };
}
```

**Lecture** :

- **Diagonale** : Classifications correctes
- **Hors diagonale** : Erreurs (confusions)
- **Ligne** : Ce que l'algo a prédit
- **Colonne** : La vraie classe (gold standard)

**Exemple d'analyse** :

```typescript
// Confusion fréquente : OUVERTURE → EXPLICATION (10 cas)
// → L'algo confond instructions client et explications procédurales
// → Améliorer les patterns regex pour distinguer :
//   "vous allez..." (OUVERTURE) vs "notre politique..." (EXPLICATION)
```

---

## 🔢 Métriques Numériques (M1, M3)

### 1. MAE (Mean Absolute Error)

**Définition** : Erreur moyenne absolue entre prédictions et valeurs réelles.

**Formule** :

```
MAE = (1/n) × Σ|yᵢ - ŷᵢ|

Où :
- yᵢ = valeur réelle
- ŷᵢ = valeur prédite
- n = nombre d'observations
```

**Implémentation TypeScript** :

```typescript
function calculateMAE(results: NumericalResult[]): number {
  if (results.length === 0) return 0;
  
  const sumAbsError = results.reduce((sum, r) => {
    return sum + Math.abs(r.actual - r.predicted);
  }, 0);
  
  return sumAbsError / results.length;
}

// Exemple avec M1 (densité de verbes)
interface M1Result {
  actual: number;    // Densité gold standard
  predicted: number; // Densité calculée par l'algo
}

const m1Results: M1Result[] = [
  { actual: 22.5, predicted: 20.0 }, // erreur = 2.5
  { actual: 15.0, predicted: 18.0 }, // erreur = 3.0
  { actual: 30.0, predicted: 28.5 }, // erreur = 1.5
];

const mae = calculateMAE(m1Results);
// MAE = (2.5 + 3.0 + 1.5) / 3 = 2.33
```

**Interprétation** :

- **MAE faible** : Prédictions proches de la réalité
- **MAE = 0** : Prédictions parfaites
- **Unité** : Même unité que la variable (ex: verbes/100 tokens pour M1)

**Seuils pour M1 (densité de verbes)** :

- **MAE < 3** : Excellent
- **MAE = 3-5** : Bon
- **MAE > 5** : À améliorer

**Avantages** :

- ✅ Facile à interpréter (même unité que les données)
- ✅ Robuste aux outliers (pas de carré)
- ✅ Pénalise uniformément toutes les erreurs

---

### 2. RMSE (Root Mean Square Error)

**Définition** : Racine carrée de l'erreur quadratique moyenne. Pénalise plus fortement les grandes erreurs.

**Formule** :

```
RMSE = √[(1/n) × Σ(yᵢ - ŷᵢ)²]
```

**Implémentation TypeScript** :

```typescript
function calculateRMSE(results: NumericalResult[]): number {
  if (results.length === 0) return 0;
  
  const sumSquaredError = results.reduce((sum, r) => {
    const error = r.actual - r.predicted;
    return sum + (error * error);
  }, 0);
  
  return Math.sqrt(sumSquaredError / results.length);
}

// Exemple avec M3 (charge cognitive [0-1])
const m3Results = [
  { actual: 0.45, predicted: 0.42 }, // erreur² = 0.0009
  { actual: 0.30, predicted: 0.50 }, // erreur² = 0.0400
  { actual: 0.70, predicted: 0.68 }, // erreur² = 0.0004
];

const rmse = calculateRMSE(m3Results);
// RMSE = √[(0.0009 + 0.0400 + 0.0004) / 3] = √0.0138 = 0.117
```

**Interprétation** :

- **RMSE > MAE** : Il y a des erreurs importantes (outliers)
- **RMSE ≈ MAE** : Erreurs homogènes
- **Unité** : Même unité que la variable

**Comparaison MAE vs RMSE** :

```typescript
// Cas A : Erreurs homogènes
// MAE = 2.0, RMSE = 2.1 → Bon algorithme stable

// Cas B : Outliers présents  
// MAE = 2.0, RMSE = 4.5 → Attention, grandes erreurs ponctuelles
```

**Seuils pour M3 (charge cognitive [0-1])** :

- **RMSE < 0.10** : Excellent
- **RMSE = 0.10-0.20** : Bon
- **RMSE > 0.20** : À améliorer

---

### 3. R² (Coefficient de détermination)

**Définition** : Proportion de variance expliquée par le modèle.

**Formule** :

```
R² = 1 - (SS_res / SS_tot)

Où :
- SS_res = Σ(yᵢ - ŷᵢ)²  (somme des carrés résiduels)
- SS_tot = Σ(yᵢ - ȳ)²   (somme des carrés totaux)
- ȳ = moyenne des valeurs réelles
```

**Implémentation TypeScript** :

```typescript
function calculateR2(results: NumericalResult[]): number {
  if (results.length === 0) return 0;
  
  // Moyenne des valeurs réelles
  const mean = results.reduce((sum, r) => sum + r.actual, 0) / results.length;
  
  // SS_res : variance résiduelle
  const ssRes = results.reduce((sum, r) => {
    const error = r.actual - r.predicted;
    return sum + (error * error);
  }, 0);
  
  // SS_tot : variance totale
  const ssTot = results.reduce((sum, r) => {
    const diff = r.actual - mean;
    return sum + (diff * diff);
  }, 0);
  
  return ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
}

// Exemple
const results = [
  { actual: 20, predicted: 18 },
  { actual: 25, predicted: 26 },
  { actual: 30, predicted: 29 },
];

const r2 = calculateR2(results);
// R² ≈ 0.95 → Le modèle explique 95% de la variance
```

**Interprétation** :

- **R² = 1.0** : Prédictions parfaites
- **R² = 0.8-0.99** : Très bon modèle
- **R² = 0.5-0.79** : Modèle acceptable
- **R² < 0.5** : Modèle peu prédictif
- **R² < 0** : Modèle pire qu'une simple moyenne

**Usage** :

- Compare la performance de l'algo vs une baseline naïve (moyenne)
- Utile pour M1/M3 où on veut prédire des valeurs continues

---

### 4. Corrélation (Pearson / Spearman)

**4.1 Corrélation de Pearson (linéaire)**

**Formule** :

```
r = Σ[(xᵢ - x̄)(yᵢ - ȳ)] / √[Σ(xᵢ - x̄)² × Σ(yᵢ - ȳ)²]
```

**Implémentation TypeScript** :

```typescript
function calculatePearsonCorrelation(results: NumericalResult[]): number {
  if (results.length < 2) return 0;
  
  const n = results.length;
  const meanX = results.reduce((sum, r) => sum + r.predicted, 0) / n;
  const meanY = results.reduce((sum, r) => sum + r.actual, 0) / n;
  
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  results.forEach(r => {
    const dx = r.predicted - meanX;
    const dy = r.actual - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  });
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}
```

**Interprétation** :

- **r = 1** : Corrélation parfaite positive
- **r = 0** : Aucune corrélation linéaire
- **r = -1** : Corrélation parfaite négative (inverse)
- **|r| > 0.7** : Forte corrélation
- **|r| = 0.4-0.7** : Corrélation modérée
- **|r| < 0.4** : Faible corrélation

**4.2 Corrélation de Spearman (rang)**

Utilise les rangs plutôt que les valeurs brutes. Plus robuste aux outliers.

```typescript
function calculateSpearmanCorrelation(results: NumericalResult[]): number {
  // Convertir valeurs en rangs
  const ranksX = assignRanks(results.map(r => r.predicted));
  const ranksY = assignRanks(results.map(r => r.actual));
  
  // Appliquer Pearson sur les rangs
  return calculatePearsonCorrelation(
    ranksX.map((rx, i) => ({ predicted: rx, actual: ranksY[i] }))
  );
}

function assignRanks(values: number[]): number[] {
  return values
    .map((v, i) => ({ value: v, index: i }))
    .sort((a, b) => a.value - b.value)
    .map((item, rank) => ({ ...item, rank: rank + 1 }))
    .sort((a, b) => a.index - b.index)
    .map(item => item.rank);
}
```

---

## 🎯 Dispatch automatique des métriques

**Principe** : `ResultsPanel` dispatche automatiquement selon `targetKind`.

```typescript
// Pseudo-code du dispatch
function calculateMetrics(
  results: ValidationResult[], 
  targetKind: TargetKind
): Metrics {
  switch (targetKind) {
    case "X":
    case "Y":
    case "M2":
      // Métriques de classification
      return {
        accuracy: calculateAccuracy(results),
        precision: calculatePrecisionPerClass(results),
        recall: calculateRecallPerClass(results),
        f1Score: calculateF1PerClass(results),
        kappa: calculateCohenKappa(results),
        confusionMatrix: buildConfusionMatrix(results)
      };
    
    case "M1":
    case "M3":
      // Métriques numériques
      return {
        mae: calculateMAE(results),
        rmse: calculateRMSE(results),
        r2: calculateR2(results),
        pearson: calculatePearsonCorrelation(results),
        spearman: calculateSpearmanCorrelation(results)
      };
  }
}
```

---

## 📈 Seuils de validation scientifique

### Classification (X, Y, M2)

| Métrique          | Excellent | Bon       | Acceptable | Insuffisant |
| ------------------ | --------- | --------- | ---------- | ----------- |
| **Accuracy** | > 0.90    | 0.85-0.90 | 0.70-0.84  | < 0.70      |
| **F1-Score** | > 0.85    | 0.75-0.85 | 0.60-0.74  | < 0.60      |
| **Kappa**    | > 0.80    | 0.70-0.80 | 0.50-0.69  | < 0.50      |

### Numérique (M1, M3)

| Variable       | Métrique | Excellent | Bon       | À améliorer |
| -------------- | --------- | --------- | --------- | ------------- |
| **M1**   | MAE       | < 3       | 3-5       | > 5           |
| **M1**   | RMSE      | < 4       | 4-7       | > 7           |
| **M3**   | MAE       | < 0.08    | 0.08-0.15 | > 0.15        |
| **M3**   | RMSE      | < 0.10    | 0.10-0.20 | > 0.20        |
| **Tous** | R²       | > 0.85    | 0.70-0.85 | < 0.70        |

---

## 🔍 Exemple complet d'utilisation

```typescript
// 1. Tester un algorithme M1
const m1Algo = new M1ActionVerbCounter();
const results: M1Result[] = [];

for (const sample of testSet) {
  const prediction = await m1Algo.run(sample.verbatim);
  results.push({
    actual: sample.goldStandard_M1,
    predicted: parseFloat(prediction.prediction)
  });
}

// 2. Calculer les métriques
const metrics = {
  mae: calculateMAE(results),
  rmse: calculateRMSE(results),
  r2: calculateR2(results),
  correlation: calculatePearsonCorrelation(results)
};

// 3. Interpréter
console.log(`MAE: ${metrics.mae.toFixed(2)} verbes/100 tokens`);
// MAE: 2.45 verbes/100 tokens → Excellent (< 3)

console.log(`R²: ${metrics.r2.toFixed(3)}`);
// R²: 0.892 → Le modèle explique 89% de la variance

// 4. Afficher dans ResultsPanel
<ResultsPanel
  results={results}
  targetKind="M1"
  classifierLabel="M1 Action Verb Counter v1.0"
  metrics={metrics} // Auto-dispatch des métriques numériques
/>
```

---

## 📚 Ressources complémentaires

- **[Variables](variables.md)** - X/Y/M1/M2/M3 expliquées
- **[Algorithmes](algorithms.md)** - Classification vs Calcul
- **[Niveaux de validation](validation-levels.md)** - Level 0/1/2
- **[API MetricsPanel](../04-API-REFERENCE/components/metrics-panel.md)**

---

⏱️ **Temps de lecture** : ~20 minutes
🎯 **Prochaine étape** : [Niveaux de validation](validation-levels.md)
