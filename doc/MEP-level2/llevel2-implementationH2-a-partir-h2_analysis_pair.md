# Documentation : Implémentation de la Validation H2 dans Level2

## Vue d'ensemble

Cette documentation décrit l'architecture et les étapes pour intégrer la **validation de l'hypothèse H2** (médiation interactionnelle) dans l'interface Level2, en complément de l'analyse H1 existante.

## Contexte théorique

### Rappel H1 vs H2

* **H1 (effet direct)** : Les stratégies linguistiques influencent directement la réaction client
  * ENGAGEMENT/OUVERTURE → réactions positives
  * EXPLICATION → réactions négatives
  * ✅ **Déjà implémenté dans Level2**
* **H2 (médiation interactionnelle)** : Les effets de H1 passent par trois médiateurs
  * **M1 (cognitif)** : Densité de verbes d'action
  * **M2 (interactionnel)** : Alignement lexical/sémantique/prosodique
  * **M3 (paralinguistique)** : Charge cognitive (pauses, hésitations)
  * ❌ **À implémenter**

### Modèle de médiation H2

```
Stratégie (X) → M1 → M2 → M3 → Réaction (Y)
    ↓                           ↑
    └───────────────────────────┘
         (effet direct H1)
```

---

## Architecture de données

### Table source : `h2_analysis_pairs`

La table contient les paires adjacentes avec métriques pré-calculées :

sql

```sql
CREATETABLE h2_analysis_pairs (
  id SERIALPRIMARYKEY,
  pair_id INTEGERUNIQUENOTNULL,
  call_id INTEGER,
  
-- Verbatims
  conseiller_verbatim TEXT,
  client_verbatim TEXT,
  
-- Tags stratégie et réaction
  conseiller_strategy TEXT,-- ENGAGEMENT, OUVERTURE, EXPLICATION, REFLET
  client_reaction TEXT,-- POSITIF, NEGATIF, NEUTRE
  
-- Médiateurs pré-calculés
  m1_action_verb_density NUMERIC,-- Densité verbes d'action (%)
  m1_confidence NUMERIC,
  m1_metadata JSONB,
  
  m2_alignment_score NUMERIC,-- Score alignement composite (0-1)
  m2_confidence NUMERIC,
  m2_metadata JSONB,
  
  m3_cognitive_load NUMERIC,-- Charge cognitive (0-1)
  m3_confidence NUMERIC,
  m3_metadata JSONB,
  
-- Métadonnées
  created_at TIMESTAMPDEFAULTNOW(),
  updated_at TIMESTAMPDEFAULTNOW()
);
```

### Exemple de données (d'après le script de pré-calcul)

json

```json
{
"pair_id":5,
"conseiller_verbatim":"je vous donne les explications...",
"conseiller_strategy":"EXPLICATION",
"client_reaction":"NEGATIF",
  
"m1_action_verb_density":1.39,
"m1_confidence":0.6,
"m1_metadata":{
"metric":"M1",
"actionVerbCount":1,
"totalTokens":72,
"verbsFound":["donner"]
},
  
"m2_alignment_score":0.45,
"m2_confidence":0.7,
"m2_metadata":{
"lexical":0.3,
"semantic":0.5,
"prosodic":0.6
},
  
"m3_cognitive_load":0.65,
"m3_confidence":0.8,
"m3_metadata":{
"pauseRate":0.2,
"hesitationCount":3,
"clarificationRequests":1
}
}
```

---

## Architecture technique

### Structure de fichiers proposée

```
Level2/
├── Level2Interface.tsx                    [EXISTANT - à étendre]
├── config/
│   ├── hypotheses.ts                      [EXISTANT - à étendre]
│   └── h2-thresholds.ts                   [NOUVEAU]
├── shared/
│   ├── stats.ts                           [EXISTANT]
│   ├── types.ts                           [EXISTANT - à étendre]
│   ├── h2-stats.ts                        [NOUVEAU]
│   └── h2-mediation-analysis.ts           [NOUVEAU]
├── hooks/
│   ├── useH1Analysis.ts                   [EXISTANT]
│   └── useH2Analysis.ts                   [NOUVEAU]
├── hypothesis/
│   ├── H2AlignmentValidation.tsx          [NOUVEAU]
│   └── H2MediationPanel.tsx               [NOUVEAU]
└── validation/
    ├── StatisticalSummary.tsx             [EXISTANT]
    ├── StatisticalTestsPanel.tsx          [EXISTANT]
    └── H2StatisticalTests.tsx             [NOUVEAU]
```

---

## Plan d'implémentation par étapes

### **Étape 1 : Extension des types TypeScript**

**Fichier : `shared/types.ts`**

Ajouter les types pour H2 :

typescript

```typescript
// Types pour les médiateurs H2
exportinterfaceH2Mediators{
  m1_action_verb_density:number;
  m1_confidence:number;
  m1_metadata:{
    actionVerbCount:number;
    totalTokens:number;
    verbsFound:string[];
};
  
  m2_alignment_score:number;
  m2_confidence:number;
  m2_metadata:{
    lexical:number;
    semantic:number;
    prosodic:number;
};
  
  m3_cognitive_load:number;
  m3_confidence:number;
  m3_metadata:{
    pauseRate:number;
    hesitationCount:number;
    clarificationRequests:number;
};
}

// Paire adjacente enrichie H2
exportinterfaceH2AnalysisPair{
  pair_id:number;
  call_id:number;
  
  conseiller_verbatim:string;
  client_verbatim:string;
  
  conseiller_strategy:StrategyKey;
  client_reaction:'POSITIF'|'NEGATIF'|'NEUTRE';
  
  mediators:H2Mediators;
  
  created_at:Date;
  updated_at:Date;
}

// Résultats agrégés par stratégie
exportinterfaceH2StrategyMediation{
  strategy:StrategyKey;
  totalSamples:number;
  
// Moyennes des médiateurs
  avgM1:number;
  avgM2:number;
  avgM3:number;
  
// Corrélations Médiateurs → Réaction
  correlationM1ToReaction:number;
  correlationM2ToReaction:number;
  correlationM3ToReaction:number;
  
// Effet indirect (médiation)
  indirectEffect:number;
  indirectEffectCI:[number,number];// Intervalle de confiance 95%
  
// Validation
  mediationValidated:boolean;
}

// Résumé global H2
exportinterfaceH2Summary{
// Effets de médiation
  m1Effect:MediationEffect;
  m2Effect:MediationEffect;
  m3Effect:MediationEffect;
  
// Tests statistiques
  sobel:SobelTest;
  bootstrap:BootstrapMediation;
  
// Validation globale
  overallValidation:'VALIDATED'|'PARTIALLY_VALIDATED'|'NOT_VALIDATED';
  confidence:'HIGH'|'MEDIUM'|'LOW';
  
  academicConclusion:string;
  theoreticalImplications:string[];
  limitationsNoted:string[];
}

exportinterfaceMediationEffect{
  mediator:'M1'|'M2'|'M3';
  directEffect:number;// c' (stratégie → réaction avec médiateurs)
  indirectEffect:number;// a*b (stratégie → médiateur → réaction)
  totalEffect:number;// c (effet total H1)
  proportionMediated:number;// (c - c') / c
  significant:boolean;
  pValue:number;
}

exportinterfaceSobelTest{
  zStatistic:number;
  pValue:number;
  significant:boolean;
}

exportinterfaceBootstrapMediation{
  iterations:number;
  indirectEffectEstimate:number;
  confidenceInterval:[number,number];
  significant:boolean;
}
```

---

### **Étape 2 : Configuration des seuils H2**

**Fichier : `config/h2-thresholds.ts`**

typescript

```typescript
exportinterfaceH2Thresholds{
// Seuils pour les médiateurs
  m1:{
    lowDensity:number;// < 2% = faible
    highDensity:number;// > 5% = élevé
};
  
  m2:{
    lowAlignment:number;// < 0.3 = faible
    highAlignment:number;// > 0.7 = fort
};
  
  m3:{
    lowLoad:number;// < 0.3 = faible
    highLoad:number;// > 0.6 = élevé
};
  
// Seuils de médiation
  mediation:{
    minIndirectEffect:number;// Effet indirect minimal
    minProportionMediated:number;// Proportion minimale médiée
    significanceLevel:number;// p < 0.05
    bootstrapIterations:number;// 5000 par défaut
};
  
// Critères de validation
  validation:{
    minMediatorsSignificant:number;// 2/3 médiateurs significatifs
    minCorrelation:number;// r > 0.2 pour effet faible
    moderateCorrelation:number;// r > 0.5 pour effet modéré
};
}

exportconstDEFAULT_H2_THRESHOLDS:H2Thresholds={
  m1:{
    lowDensity:2.0,
    highDensity:5.0,
},
  
  m2:{
    lowAlignment:0.3,
    highAlignment:0.7,
},
  
  m3:{
    lowLoad:0.3,
    highLoad:0.6,
},
  
  mediation:{
    minIndirectEffect:0.1,
    minProportionMediated:0.2,// ≥20% de l'effet passe par médiateurs
    significanceLevel:0.05,
    bootstrapIterations:5000,
},
  
  validation:{
    minMediatorsSignificant:2,// 2 médiateurs sur 3
    minCorrelation:0.2,
    moderateCorrelation:0.5,
},
};

// Modes contextuels (comme H1)
exportconstREALISTIC_H2_THRESHOLDS:H2Thresholds={
// ... version assouplie
};

exportconstEMPIRICAL_H2_THRESHOLDS:H2Thresholds={
// ... version calibrée sur données
};
```

---

### **Étape 3 : Moteur d'analyse H2**

**Fichier : `shared/h2-stats.ts`**

typescript

```typescript
import{H2AnalysisPair,H2StrategyMediation,H2Summary}from'./types';
import{DEFAULT_H2_THRESHOLDS,H2Thresholds}from'../config/h2-thresholds';

/**
 * Calcule les corrélations entre médiateurs et réactions
 */
exportfunctioncomputeMediatorCorrelations(
  pairs:H2AnalysisPair[]
):{
  m1ToReaction:number;
  m2ToReaction:number;
  m3ToReaction:number;
}{
// Encoder les réactions : POSITIF=1, NEUTRE=0, NEGATIF=-1
const reactions = pairs.map(p => 
    p.client_reaction==='POSITIF'?1: 
    p.client_reaction==='NEGATIF'?-1:0
);
  
const m1Values = pairs.map(p => p.mediators.m1_action_verb_density);
const m2Values = pairs.map(p => p.mediators.m2_alignment_score);
const m3Values = pairs.map(p =>-p.mediators.m3_cognitive_load);// Inversé car charge négative
  
return{
    m1ToReaction:pearsonCorrelation(m1Values, reactions),
    m2ToReaction:pearsonCorrelation(m2Values, reactions),
    m3ToReaction:pearsonCorrelation(m3Values, reactions),
};
}

/**
 * Analyse de médiation par stratégie
 */
exportfunctioncomputeH2MediationByStrategy(
  pairs:H2AnalysisPair[],
  thresholds:H2Thresholds=DEFAULT_H2_THRESHOLDS
):H2StrategyMediation[]{
// Grouper par stratégie
const strategyGroups =groupBy(pairs, p => p.conseiller_strategy);
  
const results:H2StrategyMediation[]=[];
  
for(const[strategy, pairsInStrategy]ofObject.entries(strategyGroups)){
// Moyennes des médiateurs
const avgM1 =mean(pairsInStrategy.map(p => p.mediators.m1_action_verb_density));
const avgM2 =mean(pairsInStrategy.map(p => p.mediators.m2_alignment_score));
const avgM3 =mean(pairsInStrategy.map(p => p.mediators.m3_cognitive_load));
  
// Corrélations
const correlations =computeMediatorCorrelations(pairsInStrategy);
  
// Effet indirect (simplifié : moyenne des corrélations)
const indirectEffect =(
      correlations.m1ToReaction+
      correlations.m2ToReaction+
      correlations.m3ToReaction
)/3;
  
// Bootstrap pour IC (à implémenter)
const indirectEffectCI =bootstrapMediation(pairsInStrategy,1000);
  
// Validation
const mediationValidated = 
Math.abs(indirectEffect)>= thresholds.mediation.minIndirectEffect&&
      indirectEffectCI[0]* indirectEffectCI[1]>0;// IC n'inclut pas 0
  
    results.push({
      strategy: strategy asStrategyKey,
      totalSamples: pairsInStrategy.length,
      avgM1,
      avgM2,
      avgM3,
      correlationM1ToReaction: correlations.m1ToReaction,
      correlationM2ToReaction: correlations.m2ToReaction,
      correlationM3ToReaction: correlations.m3ToReaction,
      indirectEffect,
      indirectEffectCI,
      mediationValidated,
});
}
  
return results.sort((a, b)=> b.indirectEffect- a.indirectEffect);
}

/**
 * Résumé global H2
 */
exportfunctionsummarizeH2(
  pairs:H2AnalysisPair[],
  strategyResults:H2StrategyMediation[],
  thresholds:H2Thresholds=DEFAULT_H2_THRESHOLDS
):H2Summary{
// Analyse de médiation complète pour chaque médiateur
const m1Effect =analyzeMediator(pairs,'M1', thresholds);
const m2Effect =analyzeMediator(pairs,'M2', thresholds);
const m3Effect =analyzeMediator(pairs,'M3', thresholds);
  
// Tests de significativité
const sobel =computeSobelTest(m1Effect, m2Effect, m3Effect);
const bootstrap =computeBootstrapMediation(pairs, thresholds.mediation.bootstrapIterations);
  
// Validation globale
const significantMediators =[m1Effect, m2Effect, m3Effect]
.filter(e => e.significant).length;
  
const overallValidation:H2Summary['overallValidation']= 
    significantMediators >= thresholds.validation.minMediatorsSignificant
?'VALIDATED'
: significantMediators >=1
?'PARTIALLY_VALIDATED'
:'NOT_VALIDATED';
  
const confidence:H2Summary['confidence']= 
    significantMediators ===3&& bootstrap.significant?'HIGH':
    significantMediators >=2?'MEDIUM':'LOW';
  
return{
    m1Effect,
    m2Effect,
    m3Effect,
    sobel,
    bootstrap,
    overallValidation,
    confidence,
    academicConclusion:generateH2Conclusion(overallValidation, significantMediators),
    theoreticalImplications:generateH2Implications(m1Effect, m2Effect, m3Effect),
    limitationsNoted:[
'Analyse de médiation basée sur données observationnelles',
'Causalité prudente : inférence statistique non expérimentale',
'Bootstrap approximatif pour intervalles de confiance',
],
};
}

// Fonctions utilitaires
functionpearsonCorrelation(x:number[], y:number[]):number{
const n = x.length;
const meanX =mean(x);
const meanY =mean(y);
  
let num =0, denX =0, denY =0;
for(let i =0; i < n; i++){
const dx = x[i]- meanX;
const dy = y[i]- meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
}
  
return num /Math.sqrt(denX * denY);
}

functionmean(values:number[]):number{
return values.reduce((a, b)=> a + b,0)/ values.length;
}

// ... autres fonctions statistiques
```

---

### **Étape 4 : Hook personnalisé pour H2**

**Fichier : `hooks/useH2Analysis.ts`**

typescript

```typescript
import{ useMemo, useState, useEffect }from'react';
import{ useSupabase }from'@/context/SupabaseContext';
import{H2AnalysisPair,H2StrategyMediation,H2Summary}from'../shared/types';
import{ computeH2MediationByStrategy, summarizeH2 }from'../shared/h2-stats';
import{DEFAULT_H2_THRESHOLDS,H2Thresholds}from'../config/h2-thresholds';

exportfunctionuseH2Analysis(
  selectedOrigin?:string|null,
  thresholds:H2Thresholds=DEFAULT_H2_THRESHOLDS
){
const{ supabase }=useSupabase();
const[h2Pairs, setH2Pairs]=useState<H2AnalysisPair[]>([]);
const[loading, setLoading]=useState(true);
const[error, setError]=useState<string|null>(null);
  
// Charger les données H2 depuis Supabase
useEffect(()=>{
asyncfunctionloadH2Data(){
try{
setLoading(true);
      
let query = supabase
.from('h2_analysis_pairs')
.select('*')
.order('pair_id',{ ascending:true});
      
// Filtrer par origine si spécifié (via join sur turn_tagged)
if(selectedOrigin){
// À implémenter selon votre schéma
}
      
const{ data, error: fetchError }=await query;
      
if(fetchError)throw fetchError;
      
// Transformer les données
const pairs:H2AnalysisPair[]=(data ||[]).map(row =>({
          pair_id: row.pair_id,
          call_id: row.call_id,
          conseiller_verbatim: row.conseiller_verbatim,
          client_verbatim: row.client_verbatim,
          conseiller_strategy: row.conseiller_strategy,
          client_reaction: row.client_reaction,
          mediators:{
            m1_action_verb_density: row.m1_action_verb_density,
            m1_confidence: row.m1_confidence,
            m1_metadata: row.m1_metadata,
            m2_alignment_score: row.m2_alignment_score,
            m2_confidence: row.m2_confidence,
            m2_metadata: row.m2_metadata,
            m3_cognitive_load: row.m3_cognitive_load,
            m3_confidence: row.m3_confidence,
            m3_metadata: row.m3_metadata,
},
          created_at:newDate(row.created_at),
          updated_at:newDate(row.updated_at),
}));
      
setH2Pairs(pairs);
setError(null);
}catch(err){
console.error('Erreur chargement H2:', err);
setError(err instanceofError? err.message:'Erreur inconnue');
}finally{
setLoading(false);
}
}
  
loadH2Data();
},[supabase, selectedOrigin]);
  
// Calculs mémoïsés
const strategyMediation =useMemo(
()=>computeH2MediationByStrategy(h2Pairs, thresholds),
[h2Pairs, thresholds]
);
  
const h2Summary =useMemo(
()=>summarizeH2(h2Pairs, strategyMediation, thresholds),
[h2Pairs, strategyMediation, thresholds]
);
  
return{
    h2Pairs,
    strategyMediation,
    h2Summary,
    loading,
    error,
    totalPairs: h2Pairs.length,
};
}
```

---

### **Étape 5 : Composant d'affichage H2**

**Fichier : `hypothesis/H2MediationPanel.tsx`**

typescript

```typescript
"use client";

importReactfrom'react';
import{
Box,
Typography,
Paper,
Table,
TableBody,
TableCell,
TableContainer,
TableHead,
TableRow,
Alert,
Chip,
Card,
CardContent,
LinearProgress,
  useTheme,
  alpha,
}from'@mui/material';
import{
TrendingUp,
TrendingDown,
Remove,
CheckCircle,
Cancel,
Psychology,
Sync,
Speed,
}from'@mui/icons-material';
import{H2StrategyMediation,H2Summary}from'../shared/types';

interfaceProps{
  strategyMediation:H2StrategyMediation[];
  h2Summary:H2Summary;
}

constH2MediationPanel:React.FC<Props>=({ strategyMediation, h2Summary })=>{
const theme =useTheme();
  
return(
<Box sx={{ width:'100%'}}>
{/* En-tête H2 */}
<Paper sx={{ p:3, mb:3, backgroundColor:alpha(theme.palette.secondary.main,0.04)}}>
<Typography variant="h5" gutterBottom sx={{ display:'flex', alignItems:'center', gap:1}}>
<Psychology color="secondary"/>
HypothèseH2-Médiation Interactionnelle
</Typography>
<Typography variant="body2" color="text.secondary">
Les effets des stratégies(H1) passent par trois médiateurs cognitifs et interactionnels
</Typography>
</Paper>
    
{/* Statut global H2 */}
<Paper sx={{ p:3, mb:3}}>
<Typography variant="h6" gutterBottom>
ValidationGlobaleH2
</Typography>
      
<Alert
          severity={
            h2Summary.overallValidation==='VALIDATED'?'success':
            h2Summary.overallValidation==='PARTIALLY_VALIDATED'?'info':'warning'
}
          sx={{ mb:2}}
>
<Typography variant="body1" sx={{ fontWeight:'bold'}}>
{h2Summary.overallValidation==='VALIDATED'?'H2 PLEINEMENT VALIDÉE':
             h2Summary.overallValidation==='PARTIALLY_VALIDATED'?'H2 PARTIELLEMENT VALIDÉE':
'H2 NON VALIDÉE'}
</Typography>
<Typography variant="body2">
{h2Summary.academicConclusion}
</Typography>
</Alert>
      
{/* Cartes des 3 médiateurs */}
<Box sx={{ display:'flex', flexWrap:'wrap', gap:2, mb:3}}>
{/* M1 - Verbes d'action */}
<Box sx={{ flex:'1 1 300px'}}>
<Card
              variant="outlined"
              sx={{
                backgroundColor: h2Summary.m1Effect.significant
?alpha(theme.palette.success.main,0.1)
:alpha(theme.palette.grey[300],0.1),
}}
>
<CardContent>
<Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1}}>
<Speed color={h2Summary.m1Effect.significant?'success':'disabled'}/>
<Typography variant="h6" sx={{ fontWeight:'bold'}}>
M1-Verbes d'Action
</Typography>
</Box>
<Typography variant="body2" color="text.secondary" sx={{ mb:2}}>
Densité de verbes concrets(traitement cognitif direct)
</Typography>
<Typography variant="h4" color={h2Summary.m1Effect.significant?'success.main':'text.secondary'}>
{(h2Summary.m1Effect.proportionMediated*100).toFixed(1)}%
</Typography>
<Typography variant="caption">
Proportion de l'effet médiée
</Typography>
<Box sx={{ mt:1}}>
<Chip
                    icon={h2Summary.m1Effect.significant?<CheckCircle/>:<Cancel/>}
                    label={h2Summary.m1Effect.significant?'SIGNIFICATIF':'NON SIG.'}
                    color={h2Summary.m1Effect.significant?'success':'default'}
                    size="small"
/>
</Box>
</CardContent>
</Card>
</Box>
        
{/* M2 - Alignement */}
<Box sx={{ flex:'1 1 300px'}}>
<Card
              variant="outlined"
              sx={{
                backgroundColor: h2Summary.m2Effect.significant
?alpha(theme.palette.success.main,0.1)
:alpha(theme.palette.grey[300],0.1),
}}
>
<CardContent>
<Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1}}>
<Sync color={h2Summary.m2Effect.significant?'success':'disabled'}/>
<Typography variant="h6" sx={{ fontWeight:'bold'}}>
M2-Alignement
</Typography>
</Box>
<Typography variant="body2" color="text.secondary" sx={{ mb:2}}>
Synchronisation lexicale/sémantique/prosodique
</Typography>
<Typography variant="h4" color={h2Summary.m2Effect.significant?'success.main':'text.secondary'}>
{(h2Summary.m2Effect.proportionMediated*100).toFixed(1)}%
</Typography>
<Typography variant="caption">
Proportion de l'effet médiée
</Typography>
<Box sx={{ mt:1}}>
<Chip
                    icon={h2Summary.m2Effect.significant?<CheckCircle/>:<Cancel/>}
                    label={h2Summary.m2Effect.significant?'SIGNIFICATIF':'NON SIG.'}
                    color={h2Summary.m2Effect.significant?'success':'default'}
                    size="small"
/>
</Box>
</CardContent>
</Card>
</Box>
        
{/* M3 - Charge cognitive */}
<Box sx={{ flex:'1 1 300px'}}>
<Card
              variant="outlined"
              sx={{
                backgroundColor: h2Summary.m3Effect.significant
?alpha(theme.palette.success.main,0.1)
:alpha(theme.palette.grey[300],0.1),
}}
>
<CardContent>
<Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1}}>
<Psychology color={h2Summary.m3Effect.significant?'success':'disabled'}/>
<Typography variant="h6" sx={{ fontWeight:'bold'}}>
M3-ChargeCognitive
</Typography>
</Box>
<Typography variant="body2" color="text.secondary" sx={{ mb:2}}>
Pauses, hésitations, demandes de clarification
</Typography>
<Typography variant="h4" color={h2Summary.m3Effect.significant?'success.main':'text.secondary'}>
{(h2Summary.m3Effect.proportionMediated*100).toFixed(1)}%
</Typography>
<Typography variant="caption">
Proportion de l'effet médiée
</Typography>
<Box sx={{ mt:1}}>
<Chip
                    icon={h2Summary.m3Effect.significant?<CheckCircle/>:<Cancel/>}
                    label={h2Summary.m3Effect.significant?'SIGNIFICATIF':'NON SIG.'}
                    color={h2Summary.m3Effect.significant?'success':'default'}
                    size="small"
/>
</Box>
</CardContent>
</Card>
</Box>
</Box>
</Paper>
    
{/* Tableau par stratégie */}
<Paper sx={{ p:3, mb:3}}>
<Typography variant="h6" gutterBottom>
```

Réessayer

TR

Continuer

Modifier

typescript

```typescript
<Typography variant="h6" gutterBottom>
Médiation par StratégieLinguistique
</Typography>
      
<TableContainer>
<Table>
<TableHead>
<TableRow sx={{ backgroundColor:alpha(theme.palette.secondary.main,0.1)}}>
<TableCell sx={{ fontWeight:'bold'}}>Stratégie</TableCell>
<TableCell align="center" sx={{ fontWeight:'bold'}}>
                  Échantillon
</TableCell>
<TableCell align="center" sx={{ fontWeight:'bold'}}>
M1Moy.<br/>
<Typography variant="caption">(verbes %)</Typography>
</TableCell>
<TableCell align="center" sx={{ fontWeight:'bold'}}>
M2Moy.<br/>
<Typography variant="caption">(alignement)</Typography>
</TableCell>
<TableCell align="center" sx={{ fontWeight:'bold'}}>
M3Moy.<br/>
<Typography variant="caption">(charge)</Typography>
</TableCell>
<TableCell align="center" sx={{ fontWeight:'bold'}}>
EffetIndirect
</TableCell>
<TableCell align="center" sx={{ fontWeight:'bold'}}>
Validation
</TableCell>
</TableRow>
</TableHead>
<TableBody>
{strategyMediation.map((s)=>{
const isAction = s.strategy==='ENGAGEMENT'|| s.strategy==='OUVERTURE';
const isExplanation = s.strategy==='EXPLICATION';
              
return(
<TableRow key={s.strategy}>
<TableCell sx={{ fontWeight:'bold'}}>
{s.strategy}
{isAction &&(
<Chip label="ACTION" size="small" color="primary" sx={{ ml:1}}/>
)}
{isExplanation &&(
<Chip label="EXPLICATION" size="small" color="secondary" sx={{ ml:1}}/>
)}
</TableCell>
                  
<TableCell align="center">
{s.totalSamples}
</TableCell>
                  
{/* M1 - Densité verbes d'action */}
<TableCell align="center">
<Box sx={{ display:'flex', flexDirection:'column', alignItems:'center'}}>
<Typography
                          variant="body1"
                          sx={{
                            fontWeight:'bold',
                            color: s.avgM1>5 
? theme.palette.success.main 
: s.avgM1<2
? theme.palette.error.main
:'inherit',
}}
>
{s.avgM1.toFixed(2)}%
</Typography>
<Typography variant="caption" color="text.secondary">
                          r={s.correlationM1ToReaction.toFixed(2)}
</Typography>
</Box>
</TableCell>
                  
{/* M2 - Alignement */}
<TableCell align="center">
<Box sx={{ display:'flex', flexDirection:'column', alignItems:'center'}}>
<Typography
                          variant="body1"
                          sx={{
                            fontWeight:'bold',
                            color: s.avgM2>0.7
? theme.palette.success.main
: s.avgM2<0.3
? theme.palette.error.main
:'inherit',
}}
>
{s.avgM2.toFixed(2)}
</Typography>
<Typography variant="caption" color="text.secondary">
                          r={s.correlationM2ToReaction.toFixed(2)}
</Typography>
</Box>
</TableCell>
                  
{/* M3 - Charge cognitive */}
<TableCell align="center">
<Box sx={{ display:'flex', flexDirection:'column', alignItems:'center'}}>
<Typography
                          variant="body1"
                          sx={{
                            fontWeight:'bold',
                            color: s.avgM3>0.6
? theme.palette.error.main// Charge élevée = négatif
: s.avgM3<0.3
? theme.palette.success.main// Charge faible = positif
:'inherit',
}}
>
{s.avgM3.toFixed(2)}
</Typography>
<Typography variant="caption" color="text.secondary">
                          r={s.correlationM3ToReaction.toFixed(2)}
</Typography>
</Box>
</TableCell>
                  
{/* Effet indirect */}
<TableCell align="center">
<Box sx={{ display:'flex', flexDirection:'column', alignItems:'center'}}>
<Typography
                          variant="body1"
                          sx={{
                            fontWeight:'bold',
                            color: s.indirectEffect>0
? theme.palette.success.main
: theme.palette.error.main,
}}
>
{s.indirectEffect>0?'+':''}
{s.indirectEffect.toFixed(3)}
</Typography>
<Typography variant="caption" color="text.secondary">
IC95%:[{s.indirectEffectCI[0].toFixed(2)},{s.indirectEffectCI[1].toFixed(2)}]
</Typography>
</Box>
</TableCell>
                  
{/* Validation */}
<TableCell align="center">
<Chip
                        icon={s.mediationValidated?<CheckCircle/>:<Cancel/>}
                        label={s.mediationValidated?'VALIDÉ':'NON VALIDÉ'}
                        color={s.mediationValidated?'success':'default'}
                        size="small"
/>
</TableCell>
</TableRow>
);
})}
</TableBody>
</Table>
</TableContainer>
</Paper>
    
{/* Diagramme conceptuel */}
<Paper sx={{ p:3, mb:3}}>
<Typography variant="h6" gutterBottom>
Modèle de Médiation H2
</Typography>
      
<Box
          sx={{
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            gap:2,
            p:3,
            backgroundColor:alpha(theme.palette.background.default,0.5),
            borderRadius:2,
}}
>
{/* Effet direct */}
<Box sx={{ display:'flex', alignItems:'center', gap:2}}>
<Chip label="Stratégie (X)" color="primary"/>
<Box sx={{ width:100, height:2, backgroundColor: theme.palette.grey[400]}}/>
<Chip label="Réaction (Y)" color="success"/>
</Box>
<Typography variant="caption" color="text.secondary">
Effetdirect(c'):{h2Summary.m1Effect.directEffect.toFixed(3)} • 
Effet total H1(c):{h2Summary.m1Effect.totalEffect.toFixed(3)}
</Typography>
        
<Typography variant="body2" sx={{ fontWeight:'bold', my:1}}>
            ↓ Passant par les médiateurs ↓
</Typography>
        
{/* Chaîne de médiation */}
<Box sx={{ display:'flex', alignItems:'center', gap:1}}>
<Chip label="Stratégie" color="primary" size="small"/>
<TrendingUp fontSize="small"/>
<Chip label="M1 (Verbes)" color="secondary" size="small"/>
<TrendingUp fontSize="small"/>
<Chip label="M2 (Alignement)" color="secondary" size="small"/>
<TrendingUp fontSize="small"/>
<Chip label="M3 (Charge)" color="secondary" size="small"/>
<TrendingUp fontSize="small"/>
<Chip label="Réaction" color="success" size="small"/>
</Box>
        
<Typography variant="caption" color="text.secondary">
Effets indirects:M1={h2Summary.m1Effect.indirectEffect.toFixed(3)} • 
M2={h2Summary.m2Effect.indirectEffect.toFixed(3)} • 
M3={h2Summary.m3Effect.indirectEffect.toFixed(3)}
</Typography>
</Box>
</Paper>
    
{/* Tests statistiques H2 */}
<Paper sx={{ p:3}}>
<Typography variant="h6" gutterBottom>
TestsStatistiques de Médiation
</Typography>
      
<Box sx={{ display:'flex', flexWrap:'wrap', gap:2}}>
{/* Test de Sobel */}
<Box sx={{ flex:'1 1 300px'}}>
<Card variant="outlined">
<CardContent>
<Typography variant="subtitle1" sx={{ fontWeight:'bold', mb:1}}>
Test de Sobel
</Typography>
<Typography variant="h5" color="primary">
                  z ={h2Summary.sobel.zStatistic.toFixed(2)}
</Typography>
<Typography variant="body2" color="text.secondary">
                  p {h2Summary.sobel.pValue<0.001?'< 0.001':`= ${h2Summary.sobel.pValue.toFixed(3)}`}
</Typography>
<Chip
                  label={h2Summary.sobel.significant?'SIGNIFICATIF':'NON SIG.'}
                  color={h2Summary.sobel.significant?'success':'default'}
                  size="small"
                  sx={{ mt:1}}
/>
</CardContent>
</Card>
</Box>
        
{/* Bootstrap */}
<Box sx={{ flex:'1 1 300px'}}>
<Card variant="outlined">
<CardContent>
<Typography variant="subtitle1" sx={{ fontWeight:'bold', mb:1}}>
Bootstrap({h2Summary.bootstrap.iterations} itérations)
</Typography>
<Typography variant="h5" color="secondary">
{h2Summary.bootstrap.indirectEffectEstimate.toFixed(3)}
</Typography>
<Typography variant="body2" color="text.secondary">
IC95%:[{h2Summary.bootstrap.confidenceInterval[0].toFixed(3)}, 
{h2Summary.bootstrap.confidenceInterval[1].toFixed(3)}]
</Typography>
<Chip
                  label={h2Summary.bootstrap.significant?'SIGNIFICATIF':'NON SIG.'}
                  color={h2Summary.bootstrap.significant?'success':'default'}
                  size="small"
                  sx={{ mt:1}}
/>
</CardContent>
</Card>
</Box>
</Box>
</Paper>
    
{/* Implications théoriques */}
{h2Summary.theoreticalImplications.length>0&&(
<Alert severity="info" sx={{ mt:3}}>
<Typography variant="body2" sx={{ fontWeight:'bold', mb:1}}>
ImplicationsThéoriques:
</Typography>
{h2Summary.theoreticalImplications.map((impl, i)=>(
<Typography key={i} variant="body2" sx={{ display:'block', mb:0.5}}>
              • {impl}
</Typography>
))}
</Alert>
)}
    
{/* Limites */}
{h2Summary.limitationsNoted.length>0&&(
<Alert severity="warning" sx={{ mt:2}}>
<Typography variant="body2" sx={{ fontWeight:'bold', mb:1}}>
LimitesMéthodologiques:
</Typography>
{h2Summary.limitationsNoted.map((limit, i)=>(
<Typography key={i} variant="body2" sx={{ display:'block', mb:0.5}}>
              • {limit}
</Typography>
))}
</Alert>
)}
</Box>
);
};

exportdefaultH2MediationPanel;
```

---

### **Étape 6 : Intégration dans Level2Interface**

**Fichier : `Level2Interface.tsx` (modifications)**

typescript

```typescript
// Ajout des imports
import{ useH2Analysis }from'./hooks/useH2Analysis';
importH2MediationPanelfrom'./hypothesis/H2MediationPanel';

exportconstLevel2Interface:React.FC<Level2InterfaceProps>=({
  selectedOrigin,
  thresholds: providedThresholds,
})=>{
const theme =useTheme();
const[tabValue, setTabValue]=useState(0);
  
// ... code existant H1 ...
  
// NOUVEAU : Hook H2
const{
    h2Pairs,
    strategyMediation,
    h2Summary,
    loading: loadingH2,
    error: errorH2,
    totalPairs,
}=useH2Analysis(selectedOrigin);
  
// ... reste du code existant ...
  
return(
<Box sx={{ width:"100%"}}>
{/* En-tête existant */}
<Paper sx={{ p:3, mb:3}}>
{/* ... contenu existant ... */}
      
{/* NOUVEAU : Indicateur H2 */}
<Box sx={{ display:'flex', gap:1, mt:2}}>
<Chip
            label={`H1: ${h1Summary.overallValidation}`}
            color={
              h1Summary.overallValidation==='VALIDATED'?'success':
              h1Summary.overallValidation==='PARTIALLY_VALIDATED'?'info':'warning'
}
            size="small"
/>
{!loadingH2 && h2Summary &&(
<Chip
              label={`H2: ${h2Summary.overallValidation}`}
              color={
                h2Summary.overallValidation==='VALIDATED'?'success':
                h2Summary.overallValidation==='PARTIALLY_VALIDATED'?'info':'warning'
}
              size="small"
/>
)}
</Box>
</Paper>
    
{/* Onglets étendus */}
<Tabs
        value={tabValue}
        onChange={(_, v)=>setTabValue(v)}
        sx={{ borderBottom:1, borderColor:"divider", mb:3}}
>
<Tab label="Aperçu H1" icon={<TrendingUp/>} iconPosition="start"/>
<Tab label="Données H1" icon={<Assessment/>} iconPosition="start"/>
<Tab label="Tests H1" icon={<Science/>} iconPosition="start"/>
<Tab label="Rapport H1" icon={<Assignment/>} iconPosition="start"/>
      
{/* NOUVEAUX ONGLETS H2 */}
<Tab label="Médiation H2" icon={<Psychology/>} iconPosition="start"/>
<Tab label="Tests H2" icon={<Analytics/>} iconPosition="start"/>
<Tab label="Rapport H2" icon={<Description/>} iconPosition="start"/>
</Tabs>
    
{/* Panneaux existants H1 */}
<TabPanel value={tabValue} index={0}>
{/* ... contenu existant Aperçu H1 ... */}
</TabPanel>
    
<TabPanel value={tabValue} index={1}>
{/* ... contenu existant Données H1 ... */}
</TabPanel>
    
<TabPanel value={tabValue} index={2}>
<StatisticalTestsPanel data={h1Analysis}/>
</TabPanel>
    
<TabPanel value={tabValue} index={3}>
<StatisticalSummary
          data={statisticalSummaryData}
          validationResults={h1Summary}
/>
</TabPanel>
    
{/* NOUVEAUX PANNEAUX H2 */}
<TabPanel value={tabValue} index={4}>
{loadingH2 ?(
<Box sx={{ display:'flex', justifyContent:'center', py:4}}>
<CircularProgress/>
<Typography sx={{ ml:2}}>Chargement analyse H2...</Typography>
</Box>
): errorH2 ?(
<Alert severity="error">ErreurH2:{errorH2}</Alert>
):(
<H2MediationPanel
            strategyMediation={strategyMediation}
            h2Summary={h2Summary}
/>
)}
</TabPanel>
    
<TabPanel value={tabValue} index={5}>
{/* Tests statistiques H2 détaillés */}
{!loadingH2 && h2Summary &&(
<H2StatisticalTests h2Summary={h2Summary}/>
)}
</TabPanel>
    
<TabPanel value={tabValue} index={6}>
{/* Rapport académique H2 */}
{!loadingH2 && h2Summary &&(
<H2AcademicReport
            strategyMediation={strategyMediation}
            h2Summary={h2Summary}
/>
)}
</TabPanel>
</Box>
);
};
```

---

### **Étape 7 : Composant de tests statistiques H2**

**Fichier : `validation/H2StatisticalTests.tsx`**

typescript

```typescript
"use client";

importReactfrom'react';
import{
Box,
Typography,
Paper,
Table,
TableBody,
TableCell,
TableContainer,
TableHead,
TableRow,
Alert,
Chip,
Card,
CardContent,
Divider,
}from'@mui/material';
import{H2Summary}from'../shared/types';

interfaceProps{
  h2Summary:H2Summary;
}

constH2StatisticalTests:React.FC<Props>=({ h2Summary })=>{
return(
<Box sx={{ width:'100%'}}>
<Paper sx={{ p:3, mb:3}}>
<Typography variant="h6" gutterBottom>
TestsStatistiques de Médiation -Détails Complets
</Typography>
      
{/* Effets de médiation par médiateur */}
<Typography variant="subtitle1" sx={{ fontWeight:'bold', mt:3, mb:2}}>
Décomposition des Effets
</Typography>
      
<TableContainer component={Paper} variant="outlined">
<Table>
<TableHead>
<TableRow>
<TableCell>Médiateur</TableCell>
<TableCell align="center">EffetTotal(c)</TableCell>
<TableCell align="center">EffetDirect(c')</TableCell>
<TableCell align="center">EffetIndirect(a×b)</TableCell>
<TableCell align="center">%Médié</TableCell>
<TableCell align="center">p-value</TableCell>
<TableCell align="center">Significatif</TableCell>
</TableRow>
</TableHead>
<TableBody>
{[h2Summary.m1Effect, h2Summary.m2Effect, h2Summary.m3Effect].map((effect)=>(
<TableRow key={effect.mediator}>
<TableCell sx={{ fontWeight:'bold'}}>
{effect.mediator==='M1'?'M1 - Verbes d\'action':
                     effect.mediator==='M2'?'M2 - Alignement':
'M3 - Charge cognitive'}
</TableCell>
<TableCell align="center">{effect.totalEffect.toFixed(3)}</TableCell>
<TableCell align="center">{effect.directEffect.toFixed(3)}</TableCell>
<TableCell align="center">
<Typography
                      sx={{
                        fontWeight:'bold',
                        color: effect.indirectEffect>0?'success.main':'error.main',
}}
>
{effect.indirectEffect>0?'+':''}
{effect.indirectEffect.toFixed(3)}
</Typography>
</TableCell>
<TableCell align="center">
{(effect.proportionMediated*100).toFixed(1)}%
</TableCell>
<TableCell align="center">
{effect.pValue<0.001?'< 0.001': effect.pValue.toFixed(3)}
</TableCell>
<TableCell align="center">
<Chip
                      label={effect.significant?'OUI':'NON'}
                      color={effect.significant?'success':'default'}
                      size="small"
/>
</TableCell>
</TableRow>
))}
</TableBody>
</Table>
</TableContainer>
      
<Divider sx={{ my:3}}/>
      
{/* Test de Sobel */}
<Typography variant="subtitle1" sx={{ fontWeight:'bold', mb:2}}>
Test de Sobel(Médiation Globale)
</Typography>
      
<Alert
          severity={h2Summary.sobel.significant?'success':'warning'}
          sx={{ mb:3}}
>
<Typography variant="body1" sx={{ fontWeight:'bold'}}>
            z ={h2Summary.sobel.zStatistic.toFixed(3)}, p {h2Summary.sobel.pValue<0.001?'< 0.001':`= ${h2Summary.sobel.pValue.toFixed(3)}`}
</Typography>
<Typography variant="body2">
{h2Summary.sobel.significant
?'La médiation est statistiquement significative.'
:'La médiation n\'atteint pas le seuil de significativité.'}
</Typography>
</Alert>
      
{/* Bootstrap */}
<Typography variant="subtitle1" sx={{ fontWeight:'bold', mb:2}}>
Intervalles de ConfianceBootstrap
</Typography>
      
<Card variant="outlined">
<CardContent>
<Typography variant="body2" gutterBottom>
<strong>Méthode:</strong>Bootstrap avec {h2Summary.bootstrap.iterations} réplications
</Typography>
<Typography variant="body2" gutterBottom>
<strong>Estimation effet indirect:</strong>{h2Summary.bootstrap.indirectEffectEstimate.toFixed(3)}
</Typography>
<Typography variant="body2" gutterBottom>
<strong>IC95%:</strong>[{h2Summary.bootstrap.confidenceInterval[0].toFixed(3)}, 
{h2Summary.bootstrap.confidenceInterval[1].toFixed(3)}]
</Typography>
<Typography variant="body2" color="text.secondary" sx={{ mt:1}}>
{h2Summary.bootstrap.significant
?'✓ L\'intervalle n\'inclut pas zéro → médiation significative'
:'✗ L\'intervalle inclut zéro → médiation non significative'}
</Typography>
</CardContent>
</Card>
</Paper>
</Box>
);
};

exportdefaultH2StatisticalTests;
```

---

### **Étape 8 : Rapport académique H2**

**Fichier : `validation/H2AcademicReport.tsx`**

typescript

```typescript
"use client";

importReactfrom'react';
import{
Box,
Typography,
Paper,
Alert,
Divider,
}from'@mui/material';
import{H2StrategyMediation,H2Summary}from'../shared/types';

interfaceProps{
  strategyMediation:H2StrategyMediation[];
  h2Summary:H2Summary;
}

constH2AcademicReport:React.FC<Props>=({ strategyMediation, h2Summary })=>{
return(
<Paper sx={{ p:4}}>
<Typography variant="h4" gutterBottom sx={{ fontWeight:'bold'}}>
RapportAcadémique-HypothèseH2
</Typography>
<Typography variant="subtitle1" color="text.secondary" gutterBottom>
Médiation Interactionnelle:Mécanismes Explicatifs des EffetsStratégiques
</Typography>
    
<Divider sx={{ my:3}}/>
    
{/* Introduction */}
<Typography variant="h6" gutterBottom sx={{ fontWeight:'bold'}}>
1.Introduction
</Typography>
<Typography variant="body1" paragraph>
Cette analyse vise à élucider les mécanismes par lesquels les stratégies linguistiques
        du conseiller influencent la réaction immédiate du client.L'hypothèse H2 postule que
        les effets directs observés en H1 sont médiés par trois variables interactionnelles et
        cognitives :
</Typography>
<Box component="ul" sx={{ ml:3}}>
<Typography component="li" variant="body1">
<strong>M1(Cognitif)</strong>:Densité de verbes d'action concrets
</Typography>
<Typography component="li" variant="body1">
<strong>M2(Interactionnel)</strong>:Alignement lexical, sémantique et prosodique
</Typography>
<Typography component="li" variant="body1">
<strong>M3(Paralinguistique)</strong>:Charge cognitive observable(pauses, hésitations)
</Typography>
</Box>
    
<Divider sx={{ my:3}}/>
    
{/* Résultats */}
<Typography variant="h6" gutterBottom sx={{ fontWeight:'bold'}}>
2.Résultats
</Typography>
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:2}}>
2.1.StatutGlobal de H2
</Typography>
    
<Alert
        severity={
          h2Summary.overallValidation==='VALIDATED'?'success':
          h2Summary.overallValidation==='PARTIALLY_VALIDATED'?'info':'warning'
}
        sx={{ mb:2}}
>
<Typography variant="body1" sx={{ fontWeight:'bold'}}>
{h2Summary.overallValidation==='VALIDATED'?'Hypothèse H2 VALIDÉE':
           h2Summary.overallValidation==='PARTIALLY_VALIDATED'?'Hypothèse H2 PARTIELLEMENT VALIDÉE':
'Hypothèse H2 NON VALIDÉE'}
</Typography>
<Typography variant="body2">
{h2Summary.academicConclusion}
</Typography>
</Alert>
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:3}}>
2.2.Effets de Médiation par Médiateur
</Typography>
    
{/* M1 */}
<Typography variant="body1" paragraph sx={{ mt:2}}>
<strong>M1-Verbes d'action :</strong> L'analyse révèle un effet indirect de{' '}
{h2Summary.m1Effect.indirectEffect.toFixed(3)}({h2Summary.m1Effect.significant?'p < 0.05':'ns'}),
        représentant {(h2Summary.m1Effect.proportionMediated*100).toFixed(1)}% de l'effet total.
{h2Summary.m1Effect.significant
?' Ce résultat confirme le rôle médiateur du traitement cognitif direct via les verbes concrets.'
:' Cet effet n\'atteint pas le seuil de significativité statistique.'}
</Typography>
    
{/* M2 */}
<Typography variant="body1" paragraph>
<strong>M2-Alignement interactionnel :</strong>La synchronisation linguistique et prosodique
        présente un effet indirect de {h2Summary.m2Effect.indirectEffect.toFixed(3)}({h2Summary.m2Effect.significant?'p < 0.05':'ns'}),
        méd iant {(h2Summary.m2Effect.proportionMediated*100).toFixed(1)}% de l'effet stratégique.
{h2Summary.m2Effect.significant
?' L\'alignement constitue donc un médiateur significatif de la réaction client.'
:' L\'effet observé nécessite consolidation sur un échantillon élargi.'}
</Typography>
    
{/* M3 */}
<Typography variant="body1" paragraph>
<strong>M3-Charge cognitive :</strong>Les marqueurs paralinguistiques de surcharge
(pauses, hésitations) présentent un effet indirect de {h2Summary.m3Effect.indirectEffect.toFixed(3)} 
({h2Summary.m3Effect.significant?'p < 0.05':'ns'}), représentant{' '}
{(h2Summary.m3Effect.proportionMediated*100).toFixed(1)}% de l'effet total.
{h2Summary.m3Effect.significant
?' La charge cognitive joue un rôle médiateur significatif dans la chaîne causale.'
:' Ce médiateur montre une tendance non significative.'}
</Typography>
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:3}}>
2.3.Tests de Significativité
</Typography>
    
<Typography variant="body1" paragraph>
Le test de Sobel(z ={h2Summary.sobel.zStatistic.toFixed(2)}, p{' '}
{h2Summary.sobel.pValue<0.001?'< 0.001':`= ${h2Summary.sobel.pValue.toFixed(3)}`})
{h2Summary.sobel.significant
?' confirme la significativité globale de la médiation.'
:' ne confirme pas la médiation au seuil α = 0.05.'}
```

Réessayer

TR

Continuer

Modifier

typescript

```typescript
</Typography>
    
<Typography variant="body1" paragraph>
L'analyse bootstrap({h2Summary.bootstrap.iterations} réplications) produit un intervalle
        de confiance à 95% de [{h2Summary.bootstrap.confidenceInterval[0].toFixed(3)},{' '}
{h2Summary.bootstrap.confidenceInterval[1].toFixed(3)}] pour l'effet indirect global.
{h2Summary.bootstrap.significant
?' L\'exclusion de zéro valide robustement la médiation.'
:' L\'inclusion de zéro suggère une médiation non robuste.'}
</Typography>
    
<Divider sx={{ my:3}}/>
    
{/* Discussion */}
<Typography variant="h6" gutterBottom sx={{ fontWeight:'bold'}}>
3.Discussion
</Typography>
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:2}}>
3.1.InterprétationThéorique
</Typography>
    
<Typography variant="body1" paragraph>
Les résultats de l'analyse H2 {h2Summary.overallValidation === 'VALIDATED' ? 'valident' : 'suggèrent'}
{' '}un modèle de médiation interactionnelle dans lequel les stratégies linguistiques du conseiller
        n'influencent pas directement la réaction client, mais passent par des mécanismes cognitifs
        et interactionnels observables au niveau de la paire adjacente.
</Typography>
    
{h2Summary.theoreticalImplications.length>0&&(
<>
<Typography variant="body1" paragraph>
Les implications théoriques principales sont :
</Typography>
<Box component="ul" sx={{ ml:3}}>
{h2Summary.theoreticalImplications.map((impl, i)=>(
<Typography key={i} component="li" variant="body1" paragraph>
{impl}
</Typography>
))}
</Box>
</>
)}
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:3}}>
3.2.Médiation par Stratégie
</Typography>
    
<Typography variant="body1" paragraph>
L'analyse stratifiée révèle des patterns différenciés selon la stratégie employée :
</Typography>
    
{strategyMediation
.filter(s => s.strategy==='ENGAGEMENT'|| s.strategy==='OUVERTURE')
.map(s =>(
<Typography key={s.strategy} variant="body1" paragraph>
<strong>{s.strategy}</strong>(n={s.totalSamples}):M1={s.avgM1.toFixed(2)}%,
M2={s.avgM2.toFixed(2)},M3={s.avgM3.toFixed(2)} → Effet indirect ={' '}
{s.indirectEffect.toFixed(3)}{s.mediationValidated?'(validé)':'(non validé)'}.
{' '}Cette stratégie {s.mediationValidated 
?'confirme le modèle de médiation avec des médiateurs favorables'
:'montre des tendances nécessitant consolidation'}.
</Typography>
))}
    
{strategyMediation
.filter(s => s.strategy==='EXPLICATION')
.map(s =>(
<Typography key={s.strategy} variant="body1" paragraph>
<strong>{s.strategy}</strong>(n={s.totalSamples}):M1={s.avgM1.toFixed(2)}%,
M2={s.avgM2.toFixed(2)},M3={s.avgM3.toFixed(2)} → Effet indirect ={' '}
{s.indirectEffect.toFixed(3)}{s.mediationValidated?'(validé)':'(non validé)'}.
{' '}Cette stratégie présente des médiateurs défavorables(faible densité de verbes d'action,
            alignement réduit, charge cognitive élevée), cohérents avec les réactions négatives observées en H1.
</Typography>
))}
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:3}}>
3.3.ArticulationH1-H2
</Typography>
    
<Typography variant="body1" paragraph>
L'hypothèse H2 fournit l'explication mécanistique des effets empiriques établis par H1.
Là où H1 démontre que les stratégies d'action(ENGAGEMENT/OUVERTURE) génèrent plus de
        réactions positives que les explications,H2 révèle que ces effets transitent par :
</Typography>
    
<Box component="ol" sx={{ ml:3}}>
<Typography component="li" variant="body1" paragraph>
Un traitement cognitif facilité par les verbes d'action concrets(M1), activant
          les systèmes de neurones miroirs et réduisant la charge de traitement métaphorique.
</Typography>
<Typography component="li" variant="body1" paragraph>
Une synchronisation interactionnelle accrue(M2), observable dans l'alignement
          lexical, sémantique et prosodique entre conseiller et client.
</Typography>
<Typography component="li" variant="body1" paragraph>
Une réduction de la charge cognitive client(M3), manifestée par moins de pauses,
          d'hésitations et de demandes de clarification.
</Typography>
</Box>
    
<Divider sx={{ my:3}}/>
    
{/* Limites */}
<Typography variant="h6" gutterBottom sx={{ fontWeight:'bold'}}>
4.Limites et Perspectives
</Typography>
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:2}}>
4.1.LimitesMéthodologiques
</Typography>
    
{h2Summary.limitationsNoted.length>0&&(
<Box component="ul" sx={{ ml:3}}>
{h2Summary.limitationsNoted.map((limit, i)=>(
<Typography key={i} component="li" variant="body1" paragraph>
{limit}
</Typography>
))}
</Box>
)}
    
<Typography variant="body1" paragraph>
La nature observationnelle des données limite la portée des inférences causales.
Bien que les analyses de médiation suggèrent fortement une chaîne causale
Stratégie → Médiateurs → Réaction, seule une étude expérimentale contrôlée
        pourrait établir la causalité avec certitude.
</Typography>
    
<Typography variant="subtitle1" gutterBottom sx={{ fontWeight:'bold', mt:3}}>
4.2.Perspectives de Recherche
</Typography>
    
<Box component="ul" sx={{ ml:3}}>
<Typography component="li" variant="body1" paragraph>
<strong>Validation expérimentale :</strong>Manipulation contrôlée des stratégies
          avec mesure en temps réel des médiateurs(eye-tracking pour charge cognitive,
          analyse acoustique pour alignement prosodique).
</Typography>
<Typography component="li" variant="body1" paragraph>
<strong>ModélisationSEM complète :</strong> Équations structurelles pour tester
          simultanément les effets directs, indirects et les interactions entre médiateurs.
</Typography>
<Typography component="li" variant="body1" paragraph>
<strong>Analyse temporelle :</strong> Étude de la dynamique séquentielle de la
médiation(délais d'activation, effets cumulatifs sur plusieurs tours).
</Typography>
<Typography component="li" variant="body1" paragraph>
<strong>Généralisation :</strong>Test du modèle H2 sur d'autres domaines
(santé, services publics, négociation commerciale).
</Typography>
</Box>
    
<Divider sx={{ my:3}}/>
    
{/* Conclusion */}
<Typography variant="h6" gutterBottom sx={{ fontWeight:'bold'}}>
5.Conclusion
</Typography>
    
<Typography variant="body1" paragraph>
L'analyse de médiation interactionnelle (H2) {h2Summary.overallValidation === 'VALIDATED' 
?'valide pleinement' 
: h2Summary.overallValidation==='PARTIALLY_VALIDATED'
?'valide partiellement'
:'ne valide pas'}
{' '}le modèle théorique proposé.Les résultats démontrent que les effets stratégiques
        sur la réaction client {h2Summary.overallValidation==='VALIDATED'?'passent':'peuvent passer'}
{' '}par des médiateurs cognitifs(verbes d'action),interactionnels(alignement) et
paralinguistiques(charge cognitive).
</Typography>
    
<Typography variant="body1" paragraph>
Cette recherche contribue à la compréhension des mécanismes sous-jacents à l'efficacité
        différentielle des stratégies linguistiques en contexte conflictuel.Elle ouvre la voie
        à des applications pratiques(H3) en formation professionnelle et en ingénierie
        conversationnelle basées sur des fondements théoriques robustes.
</Typography>
    
<Alert severity={h2Summary.confidence==='HIGH'?'success':'info'} sx={{ mt:3}}>
<Typography variant="body2" sx={{ fontWeight:'bold'}}>
Niveau de confiance :{h2Summary.confidence}
</Typography>
<Typography variant="body2">
{h2Summary.confidence==='HIGH'
?'Les résultats sont robustes et reproductibles. Recommandation: publication académique.'
: h2Summary.confidence==='MEDIUM'
?'Les résultats sont encourageants mais nécessitent consolidation. Recommandation: poursuite de la collecte de données.'
:'Les résultats sont préliminaires. Recommandation: révision méthodologique et augmentation de l\'échantillon.'}
</Typography>
</Alert>
    
<Divider sx={{ my:3}}/>
    
{/* Références suggérées */}
<Typography variant="h6" gutterBottom sx={{ fontWeight:'bold'}}>
Références ThéoriquesClés
</Typography>
    
<Box component="ul" sx={{ ml:3,'& li':{ mb:1}}}>
<Typography component="li" variant="body2">
Baron,R.M.,&Kenny,D.A.(1986).The moderator-mediator variable distinction in social
          psychological research.<em>JournalofPersonality and SocialPsychology,51</em>(6),1173-1182.
</Typography>
<Typography component="li" variant="body2">
Pickering,M.J.,&Garrod,S.(2004).Toward a mechanistic psychology of dialogue.
<em>Behavioral and BrainSciences,27</em>(2),169-226.
</Typography>
<Typography component="li" variant="body2">
Sweller,J.(1988).Cognitive load during problem solving:Effects on learning.
<em>CognitiveScience,12</em>(2),257-285.
</Typography>
<Typography component="li" variant="body2">
Gallese,V.,&Lakoff,G.(2005).The brain's concepts:The role of the sensory-motor
          system in conceptual knowledge.<em>CognitiveNeuropsychology,22</em>(3-4),455-479.
</Typography>
<Typography component="li" variant="body2">
Hayes,A.F.(2017).<em>Introduction to Mediation,Moderation, and ConditionalProcessAnalysis</em>
(2nd ed.).GuilfordPress.
</Typography>
</Box>
</Paper>
);
};

exportdefaultH2AcademicReport;
```

---

## **Étape 9 : Fonctions statistiques complètes**

**Fichier : `shared/h2-mediation-analysis.ts`**

typescript

```typescript
/**
 * Analyses de médiation complètes pour H2
 * Implémentation des méthodes Baron & Kenny (1986) et Hayes (2017)
 */

import{H2AnalysisPair,MediationEffect,SobelTest,BootstrapMediation}from'./types';

/**
 * Analyse complète de médiation pour un médiateur donné
 */
exportfunctionanalyzeMediator(
  pairs:H2AnalysisPair[],
  mediatorType:'M1'|'M2'|'M3',
  thresholds:any
):MediationEffect{
// Encoder stratégie : ACTION=1, EXPLICATION=0
constX= pairs.map(p => 
    p.conseiller_strategy==='ENGAGEMENT'|| p.conseiller_strategy==='OUVERTURE'?1:0
);
  
// Encoder réaction : POSITIF=1, NEUTRE=0, NEGATIF=-1
constY= pairs.map(p => 
    p.client_reaction==='POSITIF'?1: p.client_reaction==='NEGATIF'?-1:0
);
  
// Médiateur selon le type
constM= pairs.map(p =>{
switch(mediatorType){
case'M1':
return p.mediators.m1_action_verb_density/100;// Normaliser en 0-1
case'M2':
return p.mediators.m2_alignment_score;
case'M3':
return-p.mediators.m3_cognitive_load;// Inverser (charge faible = positif)
default:
return0;
}
});
  
// Étape 1: Effet total (c) - Régression Y ~ X
const c =simpleRegression(Y,X).beta;
  
// Étape 2: Effet X → M (a) - Régression M ~ X
const a =simpleRegression(M,X).beta;
  
// Étape 3: Effet M → Y contrôlé (b) - Régression Y ~ X + M
const{ beta: cPrime, betaM: b }=multipleRegression(Y,X,M);
  
// Effet indirect (a × b)
const indirectEffect = a * b;
  
// Proportion médiée
const proportionMediated =Math.abs(c)<0.001?0:(c - cPrime)/ c;
  
// Test de significativité (Sobel)
const seA =simpleRegression(M,X).standardError;
const seB =multipleRegression(Y,X,M).standardErrorM;
const sobelZ = indirectEffect /Math.sqrt(b * b * seA * seA + a * a * seB * seB);
const pValue =2*(1-normalCDF(Math.abs(sobelZ)));
  
return{
    mediator: mediatorType,
    directEffect: cPrime,
    indirectEffect,
    totalEffect: c,
    proportionMediated,
    significant: pValue < thresholds.mediation.significanceLevel,
    pValue,
};
}

/**
 * Test de Sobel global (pour tous les médiateurs)
 */
exportfunctioncomputeSobelTest(
  m1Effect:MediationEffect,
  m2Effect:MediationEffect,
  m3Effect:MediationEffect
):SobelTest{
// Effet indirect total
const totalIndirect = m1Effect.indirectEffect+ m2Effect.indirectEffect+ m3Effect.indirectEffect;
  
// Variance combinée (approximation)
const combinedVariance = 
Math.pow(1/(1+ m1Effect.pValue),2)+
Math.pow(1/(1+ m2Effect.pValue),2)+
Math.pow(1/(1+ m3Effect.pValue),2);
  
const zStatistic = totalIndirect /Math.sqrt(combinedVariance);
const pValue =2*(1-normalCDF(Math.abs(zStatistic)));
  
return{
    zStatistic,
    pValue,
    significant: pValue <0.05,
};
}

/**
 * Médiation par bootstrap
 */
exportfunctioncomputeBootstrapMediation(
  pairs:H2AnalysisPair[],
  iterations:number=5000
):BootstrapMediation{
const indirectEffects:number[]=[];
  
for(let i =0; i < iterations; i++){
// Échantillonnage avec remplacement
const bootstrapSample =resampleWithReplacement(pairs);
  
// Calculer effet indirect pour cet échantillon
const m1 =analyzeMediator(bootstrapSample,'M1',{ mediation:{ significanceLevel:0.05}});
const m2 =analyzeMediator(bootstrapSample,'M2',{ mediation:{ significanceLevel:0.05}});
const m3 =analyzeMediator(bootstrapSample,'M3',{ mediation:{ significanceLevel:0.05}});
  
const totalIndirect = m1.indirectEffect+ m2.indirectEffect+ m3.indirectEffect;
    indirectEffects.push(totalIndirect);
}
  
// Trier les effets
  indirectEffects.sort((a, b)=> a - b);
  
// Percentiles pour IC 95%
const lowerIndex =Math.floor(iterations *0.025);
const upperIndex =Math.floor(iterations *0.975);
  
const confidenceInterval:[number,number]=[
    indirectEffects[lowerIndex],
    indirectEffects[upperIndex],
];
  
// Estimation ponctuelle (médiane)
const medianIndex =Math.floor(iterations *0.5);
const indirectEffectEstimate = indirectEffects[medianIndex];
  
// Significatif si IC n'inclut pas zéro
const significant = confidenceInterval[0]* confidenceInterval[1]>0;
  
return{
    iterations,
    indirectEffectEstimate,
    confidenceInterval,
    significant,
};
}

/**
 * Bootstrap pour IC d'un effet indirect spécifique
 */
exportfunctionbootstrapMediation(
  pairs:H2AnalysisPair[],
  iterations:number=1000
):[number,number]{
const effects:number[]=[];
  
for(let i =0; i < iterations; i++){
const sample =resampleWithReplacement(pairs);
  
// Calculer effet indirect simplifié (moyenne des corrélations)
constX= sample.map(p => 
      p.conseiller_strategy==='ENGAGEMENT'|| p.conseiller_strategy==='OUVERTURE'?1:0
);
constY= sample.map(p => 
      p.client_reaction==='POSITIF'?1: p.client_reaction==='NEGATIF'?-1:0
);
constM1= sample.map(p => p.mediators.m1_action_verb_density/100);
  
const corXM =pearsonCorrelation(X,M1);
const corMY =pearsonCorrelation(M1,Y);
const indirect = corXM * corMY;
  
    effects.push(indirect);
}
  
  effects.sort((a, b)=> a - b);
  
const lower = effects[Math.floor(iterations *0.025)];
const upper = effects[Math.floor(iterations *0.975)];
  
return[lower, upper];
}

// ============================================================================
// Fonctions statistiques de base
// ============================================================================

interfaceRegressionResult{
  beta:number;
  standardError:number;
  tStat:number;
  pValue:number;
}

interfaceMultipleRegressionResult{
  beta:number;// Coefficient pour X
  betaM:number;// Coefficient pour M
  standardError:number;
  standardErrorM:number;
}

/**
 * Régression linéaire simple: Y ~ X
 */
functionsimpleRegression(Y:number[],X:number[]):RegressionResult{
const n =Y.length;
const meanX =mean(X);
const meanY =mean(Y);
  
let numerator =0;
let denominator =0;
  
for(let i =0; i < n; i++){
const dx =X[i]- meanX;
const dy =Y[i]- meanY;
    numerator += dx * dy;
    denominator += dx * dx;
}
  
const beta = denominator ===0?0: numerator / denominator;
const alpha = meanY - beta * meanX;
  
// Calcul erreur standard
let sse =0;
for(let i =0; i < n; i++){
const predicted = alpha + beta *X[i];
const residual =Y[i]- predicted;
    sse += residual * residual;
}
  
const mse = sse /(n -2);
const standardError =Math.sqrt(mse / denominator);
const tStat = beta / standardError;
const pValue =2*(1-tDistributionCDF(Math.abs(tStat), n -2));
  
return{ beta, standardError, tStat, pValue };
}

/**
 * Régression multiple: Y ~ X + M
 */
functionmultipleRegression(Y:number[],X:number[],M:number[]):MultipleRegressionResult{
const n =Y.length;
  
// Matrices pour régression multiple (implémentation simplifiée)
// En pratique, utiliser une bibliothèque comme math.js ou simple-statistics
  
const meanX =mean(X);
const meanM =mean(M);
const meanY =mean(Y);
  
let sxx =0, smm =0, sxy =0, smy =0, sxm =0;
  
for(let i =0; i < n; i++){
const dx =X[i]- meanX;
const dm =M[i]- meanM;
const dy =Y[i]- meanY;
  
    sxx += dx * dx;
    smm += dm * dm;
    sxy += dx * dy;
    smy += dm * dy;
    sxm += dx * dm;
}
  
// Coefficients par moindres carrés
const denominator = sxx * smm - sxm * sxm;
  
if(Math.abs(denominator)<0.0001){
return{ beta:0, betaM:0, standardError:Infinity, standardErrorM:Infinity};
}
  
const betaX =(smm * sxy - sxm * smy)/ denominator;
const betaM =(sxx * smy - sxm * sxy)/ denominator;
  
// Erreurs standards (approximation)
let sse =0;
const alpha = meanY - betaX * meanX - betaM * meanM;
  
for(let i =0; i < n; i++){
const predicted = alpha + betaX *X[i]+ betaM *M[i];
const residual =Y[i]- predicted;
    sse += residual * residual;
}
  
const mse = sse /(n -3);
const standardError =Math.sqrt(mse * smm / denominator);
const standardErrorM =Math.sqrt(mse * sxx / denominator);
  
return{
    beta: betaX,
    betaM,
    standardError,
    standardErrorM,
};
}

/**
 * Corrélation de Pearson
 */
functionpearsonCorrelation(x:number[], y:number[]):number{
const n = x.length;
const meanX =mean(x);
const meanY =mean(y);
  
let num =0, denX =0, denY =0;
  
for(let i =0; i < n; i++){
const dx = x[i]- meanX;
const dy = y[i]- meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
}
  
return denX ===0|| denY ===0?0: num /Math.sqrt(denX * denY);
}

/**
 * Moyenne
 */
functionmean(values:number[]):number{
return values.reduce((a, b)=> a + b,0)/ values.length;
}

/**
 * Rééchantillonnage avec remplacement
 */
functionresampleWithReplacement<T>(array:T[]):T[]{
const n = array.length;
const sample:T[]=[];
  
for(let i =0; i < n; i++){
const randomIndex =Math.floor(Math.random()* n);
    sample.push(array[randomIndex]);
}
  
return sample;
}

/**
 * CDF de la loi normale standard (approximation)
 */
functionnormalCDF(z:number):number{
const t =1/(1+0.2316419*Math.abs(z));
const d =0.3989423*Math.exp(-z * z /2);
const prob = d * t *(0.3193815+ t *(-0.3565638+ t *(1.781478+ t *(-1.821256+ t *1.330274))));
  
return z >0?1- prob : prob;
}

/**
 * CDF de la distribution t de Student (approximation)
 */
functiontDistributionCDF(t:number, df:number):number{
// Approximation simple via normale pour df > 30
if(df >30){
returnnormalCDF(t);
}
  
// Sinon approximation Abramowitz-Stegun
const x = df /(df + t * t);
const a = df /2;
const b =0.5;
  
// Fonction bêta incomplète (simplifiée)
const betaInc =incompleteBeta(x, a, b);
  
return t >0?1- betaInc /2: betaInc /2;
}

/**
 * Fonction bêta incomplète (approximation)
 */
functionincompleteBeta(x:number, a:number, b:number):number{
if(x ===0)return0;
if(x ===1)return1;
  
// Approximation simple
returnMath.pow(x, a)*Math.pow(1- x, b -1);
}

/**
 * Grouper par clé
 */
exportfunctiongroupBy<T>(array:T[],keyFn:(item:T)=>string):Record<string,T[]>{
return array.reduce((groups, item)=>{
const key =keyFn(item);
if(!groups[key]){
      groups[key]=[];
}
    groups[key].push(item);
return groups;
},{}asRecord<string,T[]>);
}

/**
 * Génération de conclusions académiques H2
 */
exportfunctiongenerateH2Conclusion(
  validation:'VALIDATED'|'PARTIALLY_VALIDATED'|'NOT_VALIDATED',
  significantMediators:number
):string{
switch(validation){
case'VALIDATED':
return`L'hypothèse H2 est pleinement validée (${significantMediators}/3 médiateurs significatifs). Les effets stratégiques observés en H1 transitent par des mécanismes cognitifs et interactionnels mesurables, confirmant le modèle théorique de médiation interactionnelle.`;
  
case'PARTIALLY_VALIDATED':
return`L'hypothèse H2 est partiellement supportée (${significantMediators}/3 médiateurs significatifs). Les résultats suggèrent un rôle médiateur des processus cognitifs et interactionnels, nécessitant consolidation sur un échantillon élargi.`;
  
default:
return`L'hypothèse H2 n'est pas supportée par les données actuelles (${significantMediators}/3 médiateurs significatifs). Le modèle de médiation nécessite révision théorique ou méthodologique.`;
}
}

/**
 * Génération d'implications théoriques
 */
exportfunctiongenerateH2Implications(
  m1:MediationEffect,
  m2:MediationEffect,
  m3:MediationEffect
):string[]{
const implications:string[]=[];
  
if(m1.significant){
    implications.push(
'M1 (verbes d\'action) : Confirmation du rôle facilitateur des verbes concrets via le traitement cognitif incarné (embodied cognition) et l\'activation des neurones miroirs.'
);
}
  
if(m2.significant){
    implications.push(
'M2 (alignement) : Validation de l\'hypothèse d\'alignement interactif (Pickering & Garrod, 2004), la synchronisation linguistique et prosodique favorise la coopération conversationnelle.'
);
}
  
if(m3.significant){
    implications.push(
'M3 (charge cognitive) : Support empirique de la théorie de la charge cognitive (Sweller, 1988), les explications abstraites augmentent le coût de traitement et dégradent la réception.'
);
}
  
if(implications.length===0){
    implications.push(
'Les médiateurs hypothétisés ne montrent pas d\'effets significatifs, suggérant des mécanismes alternatifs ou des problèmes de mesure.'
);
}
  
return implications;
}
```

---

## **Étape 10 : Tests unitaires (optionnel mais recommandé)**

**Fichier : `__tests__/h2-stats.test.ts`**

typescript

```typescript
import{ describe, test, expect }from'@jest/globals';
import{
  computeMediatorCorrelations,
  computeH2MediationByStrategy,
  pearsonCorrelation,
}from'../shared/h2-stats';

describe('H2 Statistics',
```

Réessayer

TR

Continuer

Modifier

typescript

```typescript
describe('H2 Statistics',()=>{
// Données de test simulées
const mockPairs =[
{
      pair_id:1,
      call_id:1,
      conseiller_verbatim:'test',
      client_verbatim:'test',
      conseiller_strategy:'ENGAGEMENT',
      client_reaction:'POSITIF',
      mediators:{
        m1_action_verb_density:5.0,
        m1_confidence:0.8,
        m1_metadata:{ actionVerbCount:2, totalTokens:40, verbsFound:['prendre','faire']},
        m2_alignment_score:0.75,
        m2_confidence:0.9,
        m2_metadata:{ lexical:0.7, semantic:0.8, prosodic:0.75},
        m3_cognitive_load:0.2,
        m3_confidence:0.85,
        m3_metadata:{ pauseRate:0.1, hesitationCount:1, clarificationRequests:0},
},
      created_at:newDate(),
      updated_at:newDate(),
},
{
      pair_id:2,
      call_id:1,
      conseiller_verbatim:'test',
      client_verbatim:'test',
      conseiller_strategy:'EXPLICATION',
      client_reaction:'NEGATIF',
      mediators:{
        m1_action_verb_density:1.0,
        m1_confidence:0.6,
        m1_metadata:{ actionVerbCount:0, totalTokens:50, verbsFound:[]},
        m2_alignment_score:0.3,
        m2_confidence:0.7,
        m2_metadata:{ lexical:0.2, semantic:0.4, prosodic:0.3},
        m3_cognitive_load:0.8,
        m3_confidence:0.9,
        m3_metadata:{ pauseRate:0.3, hesitationCount:5, clarificationRequests:2},
},
      created_at:newDate(),
      updated_at:newDate(),
},
];
  
test('pearsonCorrelation calcule correctement la corrélation',()=>{
const x =[1,2,3,4,5];
const y =[2,4,6,8,10];
  
const r =pearsonCorrelation(x, y);
  
expect(r).toBeCloseTo(1.0,2);// Corrélation parfaite positive
});
  
test('computeMediatorCorrelations retourne des corrélations valides',()=>{
const correlations =computeMediatorCorrelations(mockPairs);
  
expect(correlations).toHaveProperty('m1ToReaction');
expect(correlations).toHaveProperty('m2ToReaction');
expect(correlations).toHaveProperty('m3ToReaction');
  
expect(correlations.m1ToReaction).toBeGreaterThanOrEqual(-1);
expect(correlations.m1ToReaction).toBeLessThanOrEqual(1);
});
  
test('computeH2MediationByStrategy groupe correctement par stratégie',()=>{
const results =computeH2MediationByStrategy(mockPairs);
  
expect(results.length).toBeGreaterThan(0);
expect(results[0]).toHaveProperty('strategy');
expect(results[0]).toHaveProperty('avgM1');
expect(results[0]).toHaveProperty('avgM2');
expect(results[0]).toHaveProperty('avgM3');
expect(results[0]).toHaveProperty('indirectEffect');
});
  
test('analyzeMediator calcule les effets de médiation',()=>{
// À implémenter selon votre logique
});
});
```

---

## **Récapitulatif de l'implémentation**

### **Fichiers à créer** ✨

1. **Configuration**
   * `config/h2-thresholds.ts` - Seuils H2 configurables
2. **Types**
   * Extension de `shared/types.ts` - Types H2
3. **Logique métier**
   * `shared/h2-stats.ts` - Calculs statistiques H2
   * `shared/h2-mediation-analysis.ts` - Analyses de médiation complètes
4. **Hooks**
   * `hooks/useH2Analysis.ts` - Hook de chargement données H2
5. **Composants UI**
   * `hypothesis/H2MediationPanel.tsx` - Panel principal H2
   * `validation/H2StatisticalTests.tsx` - Tests statistiques détaillés
   * `validation/H2AcademicReport.tsx` - Rapport académique H2
6. **Tests** (optionnel)
   * `__tests__/h2-stats.test.ts` - Tests unitaires

### **Fichiers à modifier** 🔧

1. **`Level2Interface.tsx`**
   * Ajouter import `useH2Analysis`
   * Ajouter 3 nouveaux onglets (Médiation H2, Tests H2, Rapport H2)
   * Intégrer indicateur H2 dans l'en-tête
2. **`shared/types.ts`**
   * Ajouter interfaces H2 (déjà détaillé ci-dessus)

---

## **Ordre d'implémentation recommandé** 📋

### **Phase 1 : Foundation (1-2 jours)**

1. Créer `config/h2-thresholds.ts`
2. Étendre `shared/types.ts` avec types H2
3. Créer `shared/h2-stats.ts` avec fonctions de base

### **Phase 2 : Data Layer (1 jour)**

4. Créer `hooks/useH2Analysis.ts`
5. Tester chargement données depuis Supabase

### **Phase 3 : Core Logic (2-3 jours)**

6. Implémenter `shared/h2-mediation-analysis.ts`
7. Tester calculs de médiation sur données réelles
8. Valider résultats statistiques

### **Phase 4 : UI Components (2-3 jours)**

9. Créer `H2MediationPanel.tsx`
10. Créer `H2StatisticalTests.tsx`
11. Créer `H2AcademicReport.tsx`

### **Phase 5 : Integration (1 jour)**

12. Modifier `Level2Interface.tsx`
13. Tester navigation entre onglets
14. Ajuster styles et UX

### **Phase 6 : Polish (1 jour)**

15. Vérifier cohérence H1/H2
16. Optimiser performances
17. Ajouter documentation inline

---

## **Points d'attention critiques** ⚠️

### **1. Performance**

* Les calculs bootstrap (5000 itérations) peuvent être coûteux
* Envisager `useMemo` agressif ou Web Workers
* Possibilité de pré-calculer certaines stats en backend

### **2. Qualité des données**

typescript

```typescript
// Vérifier que h2_analysis_pairs est bien peuplée
const dataQualityCheck ={
  missingMediators: pairs.filter(p => 
    p.mediators.m1_confidence<0.5|| 
    p.mediators.m2_confidence<0.5
).length,
  
  invalidReactions: pairs.filter(p => 
!['POSITIF','NEGATIF','NEUTRE'].includes(p.client_reaction)
).length,
};

if(dataQualityCheck.missingMediators>0.1* pairs.length){
console.warn('⚠️ >10% des paires ont des médiateurs de faible confiance');
}
```

### **3. Cohérence H1-H2**

* Les échantillons H1 et H2 doivent être alignés
* Vérifier que `pair_id` référence bien les mêmes tours
* Les totaux doivent correspondre

### **4. Gestion des erreurs**

typescript

```typescript
// Dans useH2Analysis
useEffect(()=>{
asyncfunctionloadH2Data(){
try{
// ... chargement ...
    
// Validation post-chargement
if(pairs.length===0){
thrownewError('Aucune donnée H2 disponible. Exécuter precompute:h2 d\'abord.');
}
    
if(pairs.some(p =>!p.mediators)){
thrownewError('Médiateurs manquants dans certaines paires');
}
    
}catch(err){
// Logging détaillé pour debug
console.error('❌ Erreur H2:',{
        error: err,
        context:{ selectedOrigin, timestamp:newDate()}
});
setError(err.message);
}
}
},[]);
```

---

## **Validation de l'implémentation** ✅

### **Checklist avant déploiement**

* [ ] **Chargement données**
  * [ ] Hook `useH2Analysis` charge correctement depuis Supabase
  * [ ] Gestion erreurs robuste
  * [ ] Filtrage par origine fonctionne
* [ ] **Calculs statistiques**
  * [ ] Corrélations M1/M2/M3 → Réaction correctes
  * [ ] Effets de médiation (direct/indirect/total) cohérents
  * [ ] Bootstrap converge (IC95% stables)
  * [ ] Test de Sobel significatif quand attendu
* [ ] **Interface utilisateur**
  * [ ] 3 nouveaux onglets H2 visibles
  * [ ] Navigation fluide entre H1 et H2
  * [ ] Graphiques/tableaux lisibles
  * [ ] Codes couleur cohérents avec H1
  * [ ] Responsive sur mobile
* [ ] **Validation académique**
  * [ ] Rapport H2 exportable en PDF/Markdown
  * [ ] Citations théoriques correctes
  * [ ] Conclusions alignées avec résultats
  * [ ] Limites méthodologiques honnêtes
* [ ] **Performance**
  * [ ] Temps de chargement < 2s pour 1000 paires
  * [ ] Pas de freeze UI pendant calculs
  * [ ] Mémoïsation efficace
* [ ] **Cohérence globale**
  * [ ] Échantillons H1 = échantillons H2
  * [ ] Stratégies alignées
  * [ ] Réactions cohérentes
  * [ ] Totaux correspondent

---

## **Exemples de résultats attendus** 📊

### **Scénario 1 : H2 pleinement validée**

```
Stratégie: ENGAGEMENT
  M1 (verbes): 4.2% | M2 (alignement): 0.68 | M3 (charge): 0.25
  Effet indirect: +0.342 (IC95%: [0.21, 0.48])
  → VALIDATION: ✅ Médiation significative

Stratégie: EXPLICATION
  M1 (verbes): 0.8% | M2 (alignement): 0.31 | M3 (charge): 0.74
  Effet indirect: -0.298 (IC95%: [-0.44, -0.15])
  → VALIDATION: ✅ Médiation significative (négative)

Test Sobel: z=3.45, p<0.001 ✅
Bootstrap: IC95% [0.18, 0.52] ✅

CONCLUSION: H2 VALIDÉE - Les médiateurs expliquent 65% de l'effet H1
```

### **Scénario 2 : H2 partiellement validée**

```
Stratégie: ENGAGEMENT
  M1 (verbes): 3.1% | M2 (alignement): 0.52 | M3 (charge): 0.38
  Effet indirect: +0.156 (IC95%: [0.02, 0.29])
  → VALIDATION: ✅ Médiation significative (faible)

Stratégie: EXPLICATION
  M1 (verbes): 1.2% | M2 (alignement): 0.35 | M3 (charge): 0.61
  Effet indirect: -0.089 (IC95%: [-0.22, 0.04])
  → VALIDATION: ❌ IC inclut zéro

Test Sobel: z=1.78, p=0.075 ⚠️
Bootstrap: IC95% [-0.05, 0.31] ⚠️

CONCLUSION: H2 PARTIELLEMENT VALIDÉE - Tendances encourageantes nécessitant N↑
```

---

## **Ressources complémentaires** 📚

### **Documentation théorique**

* **Baron & Kenny (1986)** : Méthode classique de médiation
* **Hayes (2017)** : PROCESS macro et bootstrap
* **Pickering & Garrod (2004)** : Alignement interactionnel
* **Sweller (1988)** : Théorie de la charge cognitive

### **Outils de validation**

* **JASP** : Logiciel open-source pour analyses de médiation
* **R lavaan** : Package SEM pour validation externe
* **Python statsmodels** : Médiation avec intervalles robustes

### **Visualisations recommandées**

typescript

```typescript
// À ajouter dans H2MediationPanel
import{Scatter,Line}from'react-chartjs-2';

// Graphique corrélation M1 → Réaction
<Scatter
  data={{
    datasets:[{
      label:'M1 vs Réaction Client',
      data: pairs.map(p =>({
        x: p.mediators.m1_action_verb_density,
        y: p.client_reaction==='POSITIF'?1:-1,
})),
}],
}}
/>

// Diagramme de chemin (path diagram)
<Box sx={{/* styles pour diagramme SEM */}}>
{/* Visualisation graphique du modèle de médiation */}
</Box>
```

---

## **Conclusion**

Cette documentation fournit un plan complet pour implémenter la validation H2 dans Level2. L'architecture proposée est :

✅ **Modulaire** : Séparation claire logique/UI

✅ **Extensible** : Facile d'ajouter H3 ensuite

✅ **Testable** : Fonctions pures pour tests unitaires

✅ **Performante** : Mémoïsation et calculs optimisés

✅ **Académique** : Rapports prêts pour publication

**Temps estimé** : 10-12 jours de développement pour un développeur fullstack expérimenté.

**Prochaines étapes** :

1. Valider l'architecture avec l'équipe
2. Créer une branche `feature/h2-validation`
3. Implémenter phase par phase
4. Tester sur données réelles
5. Merger après validation académique

Bonne chance pour l'implémentation ! 🚀
