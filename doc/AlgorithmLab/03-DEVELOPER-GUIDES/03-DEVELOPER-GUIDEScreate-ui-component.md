
# 📘 Guide 2 : Créer un composant UI personnalisé

markdown

```markdown
# Créer un composant UI personnalisé

**Temps estimé** : 45-60 minutes  
**Niveau** : Intermédiaire à Avancé  
**Prérequis** : 
- Connaissance React + TypeScript
- Maîtrise de Material-UI (MUI)
- Lecture de [Architecture](../../01-ARCHITECTURE/README.md)

---

## 🎯 Ce que tu vas apprendre

- Créer des colonnes personnalisées pour `ResultsPanel`
- Étendre le système `extraColumns`
- Créer un `MetricsPanel` custom
- Intégrer des visualisations (graphiques)

---

## 📁 Fichiers concernés
```

src/app/(protected)/analysis/components/AlgorithmLab/
├── components/Level1/shared/results/base/
│   ├── extraColumns.tsx              ← Factory colonnes dynamiques
│   ├── ResultsSample/
│   │   ├── ResultsPanel.tsx          ← Composant principal
│   │   ├── ResultsTableBody.tsx      ← Rendu lignes
│   │   └── ResultsTableHeader.tsx    ← Rendu entêtes
│   └── MetricsPanel.tsx              ← Métriques globales
└── types/
└── ui/                           ← Types UI

```

---

## 🚀 Cas d'usage 1 : Ajouter des colonnes personnalisées

### Objectif : Afficher des colonnes spécifiques pour un nouvel algorithme M2

**Exemple** : Tu as créé un `M2CompositeAlignmentCalculator` qui retourne :
```typescript
metadata: {
  m2: {
    value: "ALIGNEMENT_FORT",
    scale: "composite",
    lexicalAlignment: 0.42,
    semanticAlignment: 0.68,
    overall: 0.55,
    sharedTerms: ["vérifier", "dossier"]
  }
}
```

### Étape 1 : Créer le builder de colonnes

**Fichier** : `extraColumns.tsx` (ajouter en bas)

typescript

```typescript
/* -----------------------------
 * Colonnes M2 (alignement composite)
 * ----------------------------- */
exportconst buildM2Columns =():ExtraColumn[]=>[
{
    id:"m2-value",
    header:<strong>Alignement</strong>,
    width:160,
    align:"center",
render:(r)=>{
const value = r.metadata?.m2?.value;
const color = 
        value ==="ALIGNEMENT_FORT"?"success":
        value ==="ALIGNEMENT_FAIBLE"?"warning":
"error";
    
return(
<Chip
          size="small"
          color={color}
          label={value ||"—"}
/>
);
},
},
{
    id:"m2-lexical",
    header:<strong>Lexical</strong>,
    width:100,
    align:"center",
render:(r)=>{
const score = r.metadata?.m2?.lexicalAlignment;
return(
<Typography variant="body2" color="text.secondary">
{Number.isFinite(score)?(score *100).toFixed(0)+'%':"—"}
</Typography>
);
},
},
{
    id:"m2-semantic",
    header:<strong>Sémantique</strong>,
    width:100,
    align:"center",
render:(r)=>{
const score = r.metadata?.m2?.semanticAlignment;
return(
<Typography variant="body2" color="text.secondary">
{Number.isFinite(score)?(score *100).toFixed(0)+'%':"—"}
</Typography>
);
},
},
{
    id:"m2-overall",
    header:<strong>Score global</strong>,
    width:110,
    align:"center",
render:(r)=>{
const score = r.metadata?.m2?.overall;
return(
<Chip
          size="small"
          color="primary"
          label={Number.isFinite(score)?(score *100).toFixed(1)+'%':"—"}
/>
);
},
},
{
    id:"m2-shared-terms",
    header:<strong>Termes partagés</strong>,
    width:240,
    align:"left",
render:(r)=>{
const terms:string[]= r.metadata?.m2?.sharedTerms ||[];
if(!terms.length)return<>—</>;
    
return(
<Stack direction="row" spacing={0.5} sx={{ flexWrap:"wrap"}}>
{terms.slice(0,8).map((term, i)=>(
<Chip key={i} size="small" variant="outlined" label={term}/>
))}
{terms.length>8&&(
<Typography variant="caption" color="text.secondary">
+{terms.length-8}
</Typography>
)}
</Stack>
);
},
},
];
```

### Étape 2 : Enregistrer dans la factory

typescript

```typescript
exportfunctionbuildExtraColumnsForTarget(kind:TargetKind):ExtraColumn[]{
switch(kind){
case"X":returnbuildXColumns();
case"Y":returnbuildYColumns();
case"M1":return m1Cols;
case"M2":returnbuildM2Columns();// ✅ Ajouté
case"M3":return m3Cols;
default:return[];
}
}
```

### Étape 3 : Utiliser dans l'interface de test

typescript

```typescript
// components/Level1/algorithms/M2Calculators/M2Testing.tsx
<BaseAlgorithmTesting
  variableLabel="M2 — Alignement interactionnel"
  defaultClassifier="M2CompositeAlignmentCalculator"
  target="M2"// ✅ Dispatch automatique vers buildM2Columns()
/>
```

**Résultat** : Les colonnes M2 s'affichent automatiquement ! 🎉

---

## 🚀 Cas d'usage 2 : Créer un MetricsPanel personnalisé

### Objectif : Afficher des KPI métier spécifiques

**Exemple** : Pour M2, tu veux afficher :

* Distribution des alignements (FORT/FAIBLE/DESALIGNEMENT)
* Moyenne des scores lexicaux/sémantiques
* Top 10 termes partagés

### Étape 1 : Créer le composant

**Fichier** : `components/Level1/shared/results/base/M2MetricsPanel.tsx`

typescript

```typescript
"use client";
importReact,{ useMemo }from"react";
import{
Card,
CardContent,
Typography,
Grid,
Box,
Chip,
Stack,
Divider,
}from"@mui/material";
import{TVValidationResult}from"./ResultsSample/types";

interfaceM2MetricsPanelProps{
  results:TVValidationResult[];
  classifierLabel?:string;
}

exportconstM2MetricsPanel:React.FC<M2MetricsPanelProps>=({
  results,
  classifierLabel,
})=>{
const metrics =useMemo(()=>{
if(!results.length)returnnull;

// 1️⃣ Distribution des alignements
const distribution ={
ALIGNEMENT_FORT:0,
ALIGNEMENT_FAIBLE:0,
DESALIGNEMENT:0,
};

let sumLexical =0;
let sumSemantic =0;
let sumOverall =0;
let count =0;
const allTerms:string[]=[];

    results.forEach((r)=>{
const m2 = r.metadata?.m2;
if(!m2)return;

// Distribution
const val = m2.valueaskeyoftypeof distribution;
if(val in distribution) distribution[val]++;

// Moyennes
if(typeof m2.lexicalAlignment==="number"){
        sumLexical += m2.lexicalAlignment;
        count++;
}
if(typeof m2.semanticAlignment==="number"){
        sumSemantic += m2.semanticAlignment;
}
if(typeof m2.overall==="number"){
        sumOverall += m2.overall;
}

// Termes partagés
if(Array.isArray(m2.sharedTerms)){
        allTerms.push(...m2.sharedTerms);
}
});

const avgLexical = count >0? sumLexical / count :0;
const avgSemantic = count >0? sumSemantic / count :0;
const avgOverall = count >0? sumOverall / count :0;

// Top 10 termes
const termCounts:Record<string,number>={};
    allTerms.forEach((t)=>{
      termCounts[t]=(termCounts[t]||0)+1;
});
const topTerms =Object.entries(termCounts)
.sort(([, a],[, b])=> b - a)
.slice(0,10)
.map(([term, count])=>({ term, count }));

return{
      distribution,
      avgLexical,
      avgSemantic,
      avgOverall,
      topTerms,
      total: results.length,
};
},[results]);

if(!metrics){
return(
<Card>
<CardContent>
<Typography color="text.secondary">
Aucune métrique M2 disponible
</Typography>
</CardContent>
</Card>
);
}

const{ distribution, avgLexical, avgSemantic, avgOverall, topTerms, total }=
    metrics;

return(
<Card sx={{ mb:3}}>
<CardContent>
<Typography variant="h6" gutterBottom>
          📊 Métriques M2 — {classifierLabel ||"Alignement"}
</Typography>

<Grid container spacing={3} sx={{ mt:1}}>
{/* Distribution */}
<Grid item xs={12} md={4}>
<Box>
<Typography variant="subtitle2" color="text.secondary" gutterBottom>
Distribution des alignements
</Typography>
<Stack spacing={1}>
<Box display="flex" justifyContent="space-between" alignItems="center">
<Chip label="FORT" color="success" size="small"/>
<Typography variant="body2">
{distribution.ALIGNEMENT_FORT}(
{((distribution.ALIGNEMENT_FORT/ total)*100).toFixed(1)}%)
</Typography>
</Box>
<Box display="flex" justifyContent="space-between" alignItems="center">
<Chip label="FAIBLE" color="warning" size="small"/>
<Typography variant="body2">
{distribution.ALIGNEMENT_FAIBLE}(
{((distribution.ALIGNEMENT_FAIBLE/ total)*100).toFixed(1)}%)
</Typography>
</Box>
<Box display="flex" justifyContent="space-between" alignItems="center">
<Chip label="DÉSALIGNEMENT" color="error" size="small"/>
<Typography variant="body2">
{distribution.DESALIGNEMENT}(
{((distribution.DESALIGNEMENT/ total)*100).toFixed(1)}%)
</Typography>
</Box>
</Stack>
</Box>
</Grid>

{/* Moyennes */}
<Grid item xs={12} md={4}>
<Box>
<Typography variant="subtitle2" color="text.secondary" gutterBottom>
Scores moyens
</Typography>
<Stack spacing={1.5}>
<Box>
<Typography variant="caption" color="text.secondary">
Lexical
</Typography>
<Typography variant="h6" color="primary">
{(avgLexical *100).toFixed(1)}%
</Typography>
</Box>
<Box>
<Typography variant="caption" color="text.secondary">
Sémantique
</Typography>
<Typography variant="h6" color="primary">
{(avgSemantic *100).toFixed(1)}%
</Typography>
</Box>
<Box>
<Typography variant="caption" color="text.secondary">
Global(composite)
</Typography>
<Typography variant="h6" color="primary">
{(avgOverall *100).toFixed(1)}%
</Typography>
</Box>
</Stack>
</Box>
</Grid>

{/* Top termes */}
<Grid item xs={12} md={4}>
<Box>
<Typography variant="subtitle2" color="text.secondary" gutterBottom>
Top10 termes partagés
</Typography>
<Stack spacing={0.5} sx={{ maxHeight:200, overflow:"auto"}}>
{topTerms.map(({ term, count }, i)=>(
<Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
>
<Typography variant="body2">{term}</Typography>
<Chip label={count} size="small" variant="outlined"/>
</Box>
))}
</Stack>
</Box>
</Grid>
</Grid>

<Divider sx={{ my:2}}/>

<Typography variant="caption" color="text.secondary">
Calculé sur {total} paires de tours adjacents
</Typography>
</CardContent>
</Card>
);
};
```

### Étape 2 : Intégrer dans ResultsPanel

**Option 1** : Remplacer `MetricsPanel` par défaut

typescript

```typescript
// ResultsPanel.tsx (modifier)
import{M2MetricsPanel}from"../M2MetricsPanel";

exportconstResultsPanel:React.FC<ResultsPanelProps>=({
  results,
  targetKind,
  classifierLabel,
})=>{
// ...

return(
<Card>
<CardContent>
{/* Dispatch conditionnel */}
{targetKind ==="M2"?(
<M2MetricsPanel results={filteredResults} classifierLabel={classifierLabel}/>
):(
<MetricsPanel
            results={filteredResults}
            targetKind={targetKind}
            classifierLabel={classifierLabel}
/>
)}

{/* Reste du composant... */}
</CardContent>
</Card>
);
};
```

**Option 2** : Ajouter en complément

typescript

```typescript
// Afficher les deux panels
<MetricsPanel{...}/>
{targetKind ==="M2"&&<M2MetricsPanel{...}/>}
```

---

## 🚀 Cas d'usage 3 : Ajouter une visualisation (graphique)

### Objectif : Afficher un scatter plot R² pour M1

**Fichier** : `components/Level1/shared/results/visualizations/M1ScatterPlot.tsx`

typescript

```typescript
"use client";
importReact,{ useMemo }from"react";
import{Card,CardContent,Typography,Box}from"@mui/material";
import{
ScatterChart,
Scatter,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer,
Legend,
ReferenceLine,
}from"recharts";
import{TVValidationResult}from"../base/ResultsSample/types";

interfaceM1ScatterPlotProps{
  results:TVValidationResult[];
}

exportconstM1ScatterPlot:React.FC<M1ScatterPlotProps>=({ results })=>{
const data =useMemo(()=>{
return results
.filter((r)=> r.metadata?.m1)
.map((r)=>{
const predicted = r.metadata!.m1!.value;
const actual =parseFloat(r.goldStandard||"0");
return{
          predicted,
          actual,
          verbatim: r.verbatim.slice(0,50),
};
});
},[results]);

if(!data.length){
return(
<Card>
<CardContent>
<Typography color="text.secondary">
Aucune donnée M1 pour le graphique
</Typography>
</CardContent>
</Card>
);
}

// Calcul R²
const mean = data.reduce((s, d)=> s + d.actual,0)/ data.length;
const ssTot = data.reduce((s, d)=> s +Math.pow(d.actual- mean,2),0);
const ssRes = data.reduce(
(s, d)=> s +Math.pow(d.actual- d.predicted,2),
0
);
const r2 =1- ssRes / ssTot;

return(
<Card sx={{ mb:3}}>
<CardContent>
<Typography variant="h6" gutterBottom>
          📈 ScatterPlotM1 — Prédictions vs Réalité(R² ={r2.toFixed(3)})
</Typography>

<Box sx={{ width:"100%", height:400}}>
<ResponsiveContainer>
<ScatterChart margin={{ top:20, right:30, left:20, bottom:20}}>
<CartesianGrid strokeDasharray="3 3"/>
<XAxis
                type="number"
                dataKey="actual"
                name="Gold Standard"
                label={{ value:"Gold Standard (M1)", position:"bottom"}}
/>
<YAxis
                type="number"
                dataKey="predicted"
                name="Prédiction"
                label={{
                  value:"Prédiction (M1)",
                  angle:-90,
                  position:"insideLeft",
}}
/>
<Tooltip
                cursor={{ strokeDasharray:"3 3"}}
                content={({ payload })=>{
if(!payload?.[0])returnnull;
const data = payload[0].payload;
return(
<Box
                      sx={{
                        bgcolor:"background.paper",
                        p:1.5,
                        border:1,
                        borderColor:"divider",
                        borderRadius:1,
}}
>
<Typography variant="caption" display="block">
<strong>Verbatim:</strong>{data.verbatim}...
</Typography>
<Typography variant="caption" display="block">
<strong>Gold:</strong>{data.actual.toFixed(2)}
</Typography>
<Typography variant="caption" display="block">
<strong>Prédit:</strong>{data.predicted.toFixed(2)}
</Typography>
<Typography variant="caption" display="block">
<strong>Erreur:</strong>{" "}
{Math.abs(data.actual- data.predicted).toFixed(2)}
</Typography>
</Box>
);
}}
/>
<Legend/>

{/* Ligne de référence parfaite (y = x) */}
<ReferenceLine
                segment={[
{ x:0, y:0},
{ x:100, y:100},
]}
                stroke="red"
                strokeDasharray="5 5"
                label="Prédiction parfaite"
/>

<Scatter
                name="Résultats M1"
                data={data}
                fill="#8884d8"
                fillOpacity={0.6}
/>
</ScatterChart>
</ResponsiveContainer>
</Box>

<Typography variant="caption" color="text.secondary" sx={{ mt:2}}>
{data.length} points affichés.La ligne rouge représente une prédiction
parfaite(y = x).
</Typography>
</CardContent>
</Card>
);
};
```

### Intégration dans ResultsPanel

typescript

```typescript
// ResultsPanel.tsx
import{M1ScatterPlot}from"../visualizations/M1ScatterPlot";

// Dans le render, après MetricsPanel
{targetKind ==="M1"&&<M1ScatterPlot results={filteredResults}/>}
```

---

## ✅ Checklist finale

Avant de déployer ton composant UI :

* [ ] ✅ Colonnes s'affichent correctement dans le tableau
* [ ] ✅ Responsive (mobile friendly)
* [ ] ✅ Accessibilité (ARIA labels si nécessaire)
* [ ] ✅ Mode dark/light supporté (via MUI theme)
* [ ] ✅ Performance (useMemo pour calculs lourds)
* [ ] ✅ Gestion des cas vides (pas de données)
* [ ] ✅ TypeScript strict (pas de `any`)
* [ ] ✅ Documentation JSDoc sur composants exportés

---

## 🐛 Problèmes fréquents

### ❌ Problème : Les colonnes débordent du tableau

**Solution** : Ajuster les `width` dans `ExtraColumn[]`

typescript

```typescript
{
  id:"my-col",
  width:180,// ✅ Ajuster selon le contenu
render:(r)=><Box sx={{ maxWidth:180, overflow:"hidden"}}>...</Box>
}
```

---

### ❌ Problème : Le graphique Recharts ne s'affiche pas

**Solution** : Vérifier les données et ResponsiveContainer

typescript

```typescript
// ✅ TOUJOURS wrapper dans ResponsiveContainer
<ResponsiveContainer width="100%" height={400}>
<ScatterChart>...</ScatterChart>
</ResponsiveContainer>
```

---

### ❌ Problème : Performance dégradée avec beaucoup de résultats

**Solution** : Utiliser `useMemo` et virtualisation

typescript

```typescript
const computedData =useMemo(()=>{
return results.slice(0,1000).map(heavyComputation);
},[results]);
```

---

## 📚 Ressources complémentaires

* **[MUI Documentation](https://mui.com/material-ui/)** - Composants Material-UI
* **[Recharts](https://recharts.org/)** - Graphiques React
* **[Type System](../../01-ARCHITECTURE/type-system.md)** - Types UI
* **[Design Patterns](../../01-ARCHITECTURE/design-patterns.md)** - Factory pattern

---

⏱️ **Temps de lecture** : ~12 minutes

🎯 **Difficulté** : ⭐⭐⭐⭐ Avancé
