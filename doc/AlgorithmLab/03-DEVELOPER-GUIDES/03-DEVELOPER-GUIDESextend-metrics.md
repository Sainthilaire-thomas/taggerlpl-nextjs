
# 📘 Guide 4 : Étendre les métriques

markdown

```markdown
# Étendre les métriques

**Temps estimé** : 30-45 minutes  
**Niveau** : Intermédiaire  
**Prérequis** : 
- Compréhension des métriques de base (Accuracy, MAE, Kappa)
- Lecture de [Métriques](../../02-CORE-CONCEPTS/metrics.md)

---

## 🎯 Ce que tu vas apprendre

- Ajouter des métriques personnalisées
- Créer des visualisations de métriques
- Implémenter des KPI métier spécifiques
- Calculer des intervalles de confiance

---

## 📁 Fichiers concernés
```

src/app/(protected)/analysis/components/AlgorithmLab/
├── components/Level1/shared/results/base/
│   └── MetricsPanel.tsx              ← Panel principal
├── utils/
│   └── metrics/
│       ├── classification.ts         ← Métriques classification
│       ├── numerical.ts              ← Métriques numériques
│       └── custom.ts                 ← Métriques personnalisées
└── types/
└── metrics.ts                    ← Types métriques

```

---

## 🚀 Cas d'usage 1 : Ajouter une métrique de classification

### Objectif : Calculer le **Macro F1-Score** (moyenne des F1 par classe)

**Fichier** : `utils/metrics/classification.ts`
```typescript
import { TVValidationResult } from "@/types";

/**
 * Calcule le F1-Score par classe puis fait la moyenne (macro-average)
 */
export function calculateMacroF1(results: TVValidationResult[]): number {
  const classes = Array.from(
    new Set(results.map((r) => r.goldStandard))
  ).filter(Boolean);

  if (!classes.length) return 0;

  const f1Scores: number[] = [];

  for (const cls of classes) {
    const tp = results.filter(
      (r) => r.predicted === cls && r.goldStandard === cls
    ).length;

    const fp = results.filter(
      (r) => r.predicted === cls && r.goldStandard !== cls
    ).length;

    const fn = results.filter(
      (r) => r.predicted !== cls && r.goldStandard === cls
    ).length;

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    f1Scores.push(f1);
  }

  // Moyenne simple (macro)
  return f1Scores.reduce((sum, f1) => sum + f1, 0) / f1Scores.length;
}

/**
 * Calcule le F1-Score pondéré par le support de chaque classe
 */
export function calculateWeightedF1(results: TVValidationResult[]): number {
  const classes = Array.from(
    new Set(results.map((r) => r.goldStandard))
  ).filter(Boolean);

  if (!classes.length) return 0;

  let weightedSum = 0;
  const total = results.length;

  for (const cls of classes) {
    const support = results.filter((r) => r.goldStandard === cls).length;

    const tp = results.filter(
      (r) => r.predicted === cls && r.goldStandard === cls
    ).length;

    const fp = results.filter(
      (r) => r.predicted === cls && r.goldStandard !== cls
    ).length;

    const fn = results.filter(
      (r) => r.predicted !== cls && r.goldStandard === cls
    ).length;

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    // Pondération par le support
    weightedSum += f1 * (support / total);
  }

  return weightedSum;
}
```

### Intégration dans MetricsPanel

typescript

```typescript
// MetricsPanel.tsx
import{ calculateMacroF1, calculateWeightedF1 }from"@/utils/metrics/classification";

const macroF1 =calculateMacroF1(results);
const weightedF1 =calculateWeightedF1(results);

// Affichage
<Grid item xs={6} md={3}>
<Card>
<CardContent>
<Typography variant="caption" color="text.secondary">
MacroF1-Score
</Typography>
<Typography variant="h5" color="primary">
{(macroF1 *100).toFixed(1)}%
</Typography>
<Typography variant="caption" color="text.secondary">
Moyenne simple par classe
</Typography>
</CardContent>
</Card>
</Grid>

<Grid item xs={6} md={3}>
<Card>
<CardContent>
<Typography variant="caption" color="text.secondary">
WeightedF1-Score
</Typography>
<Typography variant="h5" color="primary">
{(weightedF1 *100).toFixed(1)}%
</Typography>
<Typography variant="caption" color="text.secondary">
Pondéré par support
</Typography>
</CardContent>
</Card>
</Grid>
```

---

## 🚀 Cas d'usage 2 : Métriques numériques avancées

### Objectif : Calculer MAPE et percentiles pour M1

**Fichier** : `utils/metrics/numerical.ts`

typescript

```typescript
import{TVValidationResult}from"@/types";

/**
 * MAPE - Mean Absolute Percentage Error
 * Utile pour M1 car exprime l'erreur en % de la valeur réelle
 */
exportfunctioncalculateMAPE(results:TVValidationResult[]):number{
if(!results.length)return0;

let sum =0;
let count =0;

for(const r of results){
const actual =parseFloat(r.goldStandard||"0");
const predicted =parseFloat(r.prediction||"0");

// Éviter division par zéro
if(actual ===0)continue;

    sum +=Math.abs((actual - predicted)/ actual);
    count++;
}

return count >0?(sum / count)*100:0;// En %
}

/**
 * Calcule les percentiles des erreurs absolues
 */
exportfunctioncalculateErrorPercentiles(
  results:TVValidationResult[]
):{
  p50:number;// Médiane
  p90:number;
  p95:number;
  p99:number;
}{
const errors = results
.map((r)=>{
const actual =parseFloat(r.goldStandard||"0");
const predicted =parseFloat(r.prediction||"0");
returnMath.abs(actual - predicted);
})
.sort((a, b)=> a - b);

if(!errors.length){
return{ p50:0, p90:0, p95:0, p99:0};
}

constgetPercentile=(p:number)=>{
const index =Math.ceil((p /100)* errors.length)-1;
return errors[Math.max(0, index)];
};

return{
    p50:getPercentile(50),
    p90:getPercentile(90),
    p95:getPercentile(95),
    p99:getPercentile(99),
};
}

/**
 * Détecte les outliers (méthode IQR)
 */
exportfunctiondetectOutliers(results:TVValidationResult[]):{
  outliers:TVValidationResult[];
  threshold:number;
}{
const errors = results.map((r)=>{
const actual =parseFloat(r.goldStandard||"0");
const predicted =parseFloat(r.prediction||"0");
returnMath.abs(actual - predicted);
});

const sorted =[...errors].sort((a, b)=> a - b);
const q1Index =Math.floor(sorted.length*0.25);
const q3Index =Math.floor(sorted.length*0.75);

const q1 = sorted[q1Index];
const q3 = sorted[q3Index];
const iqr = q3 - q1;

// Threshold = Q3 + 1.5 * IQR
const threshold = q3 +1.5* iqr;

const outliers = results.filter((r, i)=> errors[i]> threshold);

return{ outliers, threshold };
}

/**
 * Calcule le biais systématique (sur/sous-estimation)
 */
exportfunctioncalculateSystematicBias(
  results:TVValidationResult[]
):{
  bias:number;
  overestimationRate:number;
  underestimationRate:number;
}{
if(!results.length)return{ bias:0, overestimationRate:0, underestimationRate:0};

let sumBias =0;
let overestimations =0;
let underestimations =0;

for(const r of results){
const actual =parseFloat(r.goldStandard||"0");
const predicted =parseFloat(r.prediction||"0");
const bias = predicted - actual;

    sumBias += bias;

if(bias >0) overestimations++;
elseif(bias <0) underestimations++;
}

return{
    bias: sumBias / results.length,
    overestimationRate: overestimations / results.length,
    underestimationRate: underestimations / results.length,
};
}
```

### Affichage dans MetricsPanel

typescript

```typescript
// MetricsPanel.tsx (pour M1/M3)
const mape =calculateMAPE(results);
const percentiles =calculateErrorPercentiles(results);
const{ outliers, threshold }=detectOutliers(results);
const bias =calculateSystematicBias(results);

// Affichage
<Grid container spacing={2} sx={{ mt:2}}>
<Grid item xs={12} md={6}>
<Card>
<CardContent>
<Typography variant="h6" gutterBottom>
          📊 Erreurs détaillées
</Typography>
<Stack spacing={1}>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">MAPE</Typography>
<Typography variant="body2" fontWeight="bold">
{mape.toFixed(2)}%
</Typography>
</Box>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">Médiane(P50)</Typography>
<Typography variant="body2">{percentiles.p50.toFixed(2)}</Typography>
</Box>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">P90</Typography>
<Typography variant="body2">{percentiles.p90.toFixed(2)}</Typography>
</Box>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">P95</Typography>
<Typography variant="body2">{percentiles.p95.toFixed(2)}</Typography>
</Box>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">P99</Typography>
<Typography variant="body2" color="error">
{percentiles.p99.toFixed(2)}
</Typography>
</Box>
</Stack>
</CardContent>
</Card>
</Grid>

<Grid item xs={12} md={6}>
<Card>
<CardContent>
<Typography variant="h6" gutterBottom>
          ⚖️ Biais systématique
</Typography>
<Stack spacing={1}>
<Box>
<Typography variant="caption" color="text.secondary">
Biais moyen
</Typography>
<Typography
              variant="h5"
              color={bias.bias>0?"error": bias.bias<0?"warning":"success"}
>
{bias.bias>0?"+":""}
{bias.bias.toFixed(2)}
</Typography>
<Typography variant="caption" color="text.secondary">
{bias.bias>0?"Sur-estimation": bias.bias<0?"Sous-estimation":"Équilibré"}
</Typography>
</Box>
<Divider/>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">Sur-estimations</Typography>
<Typography variant="body2">
{(bias.overestimationRate*100).toFixed(1)}%
</Typography>
</Box>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">Sous-estimations</Typography>
<Typography variant="body2">
{(bias.underestimationRate*100).toFixed(1)}%
</Typography>
</Box>
<Divider/>
<Alert severity={outliers.length> results.length*0.05?"warning":"info"}>
<Typography variant="caption">
{outliers.length} outliers détectés(seuil:{threshold.toFixed(2)})
</Typography>
</Alert>
</Stack>
</CardContent>
</Card>
</Grid>
</Grid>
```

---

## 🚀 Cas d'usage 3 : Métriques métier personnalisées

### Objectif : Calculer le "Taux de détection des engagements ratés"

**Contexte** : Dans un centre de contact, rater un ENGAGEMENT (faux négatif) coûte cher (perte de confiance client).

**Fichier** : `utils/metrics/custom.ts`

typescript

```typescript
import{TVValidationResult}from"@/types";

/**
 * Détection des faux négatifs critiques
 */
exportinterfaceCriticalErrorMetrics{
  missedEngagements:number;
  missedNegatives:number;
  falsePositiveEngagements:number;
  criticalErrorRate:number;
  businessCost:number;
}

exportfunctioncalculateCriticalErrors(
  results:TVValidationResult[],
  config?:{
    missedEngagementCost?:number;
    missedNegativeCost?:number;
    falseEngagementCost?:number;
}
):CriticalErrorMetrics{
const costs ={
    missedEngagementCost: config?.missedEngagementCost ??10,
    missedNegativeCost: config?.missedNegativeCost ??5,
    falseEngagementCost: config?.falseEngagementCost ??2,
};

let missedEngagements =0;
let missedNegatives =0;
let falsePositiveEngagements =0;
let businessCost =0;

for(const r of results){
// Faux négatif ENGAGEMENT
if(r.goldStandard==="ENGAGEMENT"&& r.predicted!=="ENGAGEMENT"){
      missedEngagements++;
      businessCost += costs.missedEngagementCost;
}

// Faux négatif CLIENT_NEGATIF
if(r.goldStandard==="CLIENT_NEGATIF"&& r.predicted!=="CLIENT_NEGATIF"){
      missedNegatives++;
      businessCost += costs.missedNegativeCost;
}

// Faux positif ENGAGEMENT
if(r.predicted==="ENGAGEMENT"&& r.goldStandard!=="ENGAGEMENT"){
      falsePositiveEngagements++;
      businessCost += costs.falseEngagementCost;
}
}

const criticalErrors = missedEngagements + missedNegatives + falsePositiveEngagements;
const criticalErrorRate = results.length>0? criticalErrors / results.length:0;

return{
    missedEngagements,
    missedNegatives,
    falsePositiveEngagements,
    criticalErrorRate,
    businessCost,
};
}

/**
 * Calcule le "Score de confiance pondéré"
 * Les prédictions correctes avec haute confiance valent plus
 */
exportfunctioncalculateWeightedConfidenceScore(
  results:TVValidationResult[]
):number{
if(!results.length)return0;

let weightedSum =0;

for(const r of results){
const confidence = r.confidence??0.5;
const isCorrect = r.correct?1:0;

// Score = confiance × correction
// Une prédiction correcte avec haute confiance = meilleur score
    weightedSum += confidence * isCorrect;
}

return weightedSum / results.length;
}

/**
 * Distribution des erreurs par niveau de confiance
 */
exportfunctionanalyzeErrorsByConfidence(results:TVValidationResult[]):{
  lowConfidenceErrors:number;// confiance < 0.5
  mediumConfidenceErrors:number;// 0.5 <= confiance < 0.8
  highConfidenceErrors:number;// confiance >= 0.8
}{
let lowConfidenceErrors =0;
let mediumConfidenceErrors =0;
let highConfidenceErrors =0;

for(const r of results){
if(r.correct)continue;// Ignore les corrections

const conf = r.confidence??0.5;

if(conf <0.5) lowConfidenceErrors++;
elseif(conf <0.8) mediumConfidenceErrors++;
else highConfidenceErrors++;
}

return{
    lowConfidenceErrors,
    mediumConfidenceErrors,
    highConfidenceErrors,
};
}
```

### Affichage dans un panel personnalisé

typescript

```typescript
// components/Level1/shared/results/base/BusinessMetricsPanel.tsx
"use client";
importReact,{ useMemo }from"react";
import{Card,CardContent,Typography,Grid,Alert,Box,Chip}from"@mui/material";
importWarningIconfrom"@mui/icons-material/Warning";
import{ calculateCriticalErrors, analyzeErrorsByConfidence }from"@/utils/metrics/custom";
import{TVValidationResult}from"@/types";

interfaceBusinessMetricsPanelProps{
  results:TVValidationResult[];
}

exportconstBusinessMetricsPanel:React.FC<BusinessMetricsPanelProps>=({
  results,
})=>{
const criticalMetrics =useMemo(
()=>calculateCriticalErrors(results),
[results]
);

const errorsByConf =useMemo(
()=>analyzeErrorsByConfidence(results),
[results]
);

return(
<Card sx={{ mb:3}}>
<CardContent>
<Typography variant="h6" gutterBottom>
          💼 Métriques Business
</Typography>

<Grid container spacing={2} sx={{ mt:1}}>
{/* Coût business */}
<Grid item xs={12} md={4}>
<Card sx={{ bgcolor:"error.light"}}>
<CardContent>
<Typography variant="caption" color="error.dark">
CoûtBusinessEstimé
</Typography>
<Typography variant="h4" color="error.dark">
{criticalMetrics.businessCost}
</Typography>
<Typography variant="caption" color="error.dark">
                  points de pénalité
</Typography>
</CardContent>
</Card>
</Grid>

{/* Erreurs critiques */}
<Grid item xs={12} md={8}>
<Card>
<CardContent>
<Typography variant="subtitle2" gutterBottom>
Erreurs critiques détectées
</Typography>
<Stack spacing={1}>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">Engagementsratés(FN)</Typography>
<Chip
                      label={criticalMetrics.missedEngagements}
                      color="error"
                      size="small"
/>
</Box>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">Réactions négatives ratées(FN)</Typography>
<Chip
                      label={criticalMetrics.missedNegatives}
                      color="warning"
                      size="small"
/>
</Box>
<Box display="flex" justifyContent="space-between">
<Typography variant="body2">Fauxengagements(FP)</Typography>
<Chip
                      label={criticalMetrics.falsePositiveEngagements}
                      color="info"
                      size="small"
/>
</Box>
</Stack>
</CardContent>
</Card>
</Grid>

{/* Erreurs par confiance */}
<Grid item xs={12}>
<Alert
              severity={
                errorsByConf.highConfidenceErrors>0?"error":"success"
}
              icon={<WarningIcon/>}
>
<Typography variant="body2">
<strong>Erreurs avec haute confiance :</strong>{" "}
{errorsByConf.highConfidenceErrors}(problème d'algorithme)
</Typography>
<Typography variant="caption">
Moyenne confiance :{errorsByConf.mediumConfidenceErrors}|Basse
                confiance :{errorsByConf.lowConfidenceErrors}
</Typography>
</Alert>
</Grid>
</Grid>
</CardContent>
</Card>
);
};
```

---

## 🚀 Cas d'usage 4 : Intervalles de confiance (Bootstrap)

### Objectif : Calculer l'IC à 95% pour l'Accuracy

**Fichier** : `utils/metrics/confidence-intervals.ts`

typescript

```typescript
import{TVValidationResult}from"@/types";

/**
 * Calcule l'intervalle de confiance par bootstrap
 */
exportfunctioncalculateBootstrapCI(
  results:TVValidationResult[],
metric:(samples:TVValidationResult[])=>number,
  options?:{
    nBootstrap?:number;
    confidence?:number;// 0.95 = 95%
}
):{
  estimate:number;
  lower:number;
  upper:number;
  standardError:number;
}{
const{ nBootstrap =1000, confidence =0.95}= options ||{};

// Calcul de la métrique sur l'échantillon original
const estimate =metric(results);

// Bootstrap : tirage avec remise
const bootstrapEstimates:number[]=[];

for(let i =0; i < nBootstrap; i++){
const sample:TVValidationResult[]=[];

for(let j =0; j < results.length; j++){
const randomIndex =Math.floor(Math.random()* results.length);
      sample.push(results[randomIndex]);
}

    bootstrapEstimates.push(metric(sample));
}

// Trier les estimations
  bootstrapEstimates.sort((a, b)=> a - b);

// Calculer les percentiles
const alpha =1- confidence;
const lowerIndex =Math.floor((alpha /2)* nBootstrap);
const upperIndex =Math.ceil((1- alpha /2)* nBootstrap)-1;

const lower = bootstrapEstimates[lowerIndex];
const upper = bootstrapEstimates[upperIndex];

// Erreur standard
const mean =
    bootstrapEstimates.reduce((sum, val)=> sum + val,0)/ nBootstrap;
const variance =
    bootstrapEstimates.reduce((sum, val)=> sum +Math.pow(val - mean,2),0)/
(nBootstrap -1);
const standardError =Math.sqrt(variance);

return{
    estimate,
    lower,
    upper,
    standardError,
};
}

// Exemple d'utilisation
constaccuracyMetric=(samples:TVValidationResult[])=>{
const correct = samples.filter((r)=> r.correct).length;
return samples.length>0? correct / samples.length:0;
};

const accuracyCI =calculateBootstrapCI(results, accuracyMetric,{
  nBootstrap:2000,
  confidence:0.95,
});

console.log(`Accuracy: ${(accuracyCI.estimate*100).toFixed(1)}% 
  [IC 95%: ${(accuracyCI.lower*100).toFixed(1)}% - ${(accuracyCI.upper*100).toFixed(1)}%]`);
```

### Affichage dans MetricsPanel

typescript

```typescript
// MetricsPanel.tsx
const accuracyCI =useMemo(
()=>calculateBootstrapCI(results,(s)=> s.filter(r => r.correct).length/ s.length),
[results]
);

<Card>
<CardContent>
<Typography variant="caption" color="text.secondary">
Accuracy(IC95%)
</Typography>
<Typography variant="h5" color="primary">
{(accuracyCI.estimate*100).toFixed(1)}%
</Typography>
<Typography variant="caption" color="text.secondary">
[{(accuracyCI.lower*100).toFixed(1)}%-{(accuracyCI.upper*100).toFixed(1)}%]
</Typography>
<Typography variant="caption" display="block" sx={{ mt:1}}>
SE={(accuracyCI.standardError*100).toFixed(2)}%
</Typography>
</CardContent>
</Card>
```

---

## ✅ Checklist finale

* [ ] ✅ Métriques calculées correctement (tests unitaires)
* [ ] ✅ Performance acceptable (< 100ms pour 1000 résultats)
* [ ] ✅ Gestion des cas limites (division par zéro, arrays vides)
* [ ] ✅ Documentation JSDoc sur chaque fonction
* [ ] ✅ TypeScript strict (pas de `any`)
* [ ] ✅ Affichage clair dans l'UI (unités, couleurs)
* [ ] ✅ Intervalles de confiance pour métriques critiques

---

## 🐛 Problèmes fréquents

### ❌ Problème : Bootstrap trop lent

**Solution** : Réduire `nBootstrap` ou optimiser le calcul

typescript

```typescript
// ✅ Optimisé
const accuracyCI =useMemo(
()=>calculateBootstrapCI(results, accuracyMetric,{ nBootstrap:500}),
[results]
);
```

---

### ❌ Problème : Métriques incohérentes (Macro F1 > Accuracy)

**Cause** : Classes déséquilibrées

**Solution** : Utiliser Weighted F1 au lieu de Macro F1

typescript

```typescript
// Pour classes déséquilibrées
const f1 =calculateWeightedF1(results);// ✅ Pondéré par support
```

---

## 📚 Ressources complémentaires

* **[Métriques Core](../../02-CORE-CONCEPTS/metrics.md)** - Formules de base
* **[Bootstrap Method](https://en.wikipedia.org/wiki/Bootstrapping_(statistics))** - Théorie
* **[Type System](../../01-ARCHITECTURE/type-system.md)** - Types métriques

---

⏱️ **Temps de lecture** : ~10 minutes

🎯 **Difficulté** : ⭐⭐⭐ Intermédiaire

```

---

**1 dernier guide** : `fine-tuning-pipeline.md`. Je continue ? 🚀
```

Réessayer

[Claude peut faire des erreurs. **Assurez-vous de vérifier ses réponses.**](https://support.anthropic.com/en/articles/8525154-claude-is-providing-incorrect-or-misleading-responses-what-s-going-on)

[ ]
