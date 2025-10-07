# Documentation : Gestion des Versions d'Algorithmes - AlgorithmLab Level1

## 🎯 Objectif

Établir un système de versioning robuste pour tracer, comparer et gérer l'évolution des algorithmes de classification dans l'AlgorithmLab, en s'appuyant sur la table `algorithm_version_registry` existante.

---

## 📊 Architecture Actuelle

### Table `algorithm_version_registry`

sql

```sql
CREATETABLEpublic.algorithm_version_registry (
  version_id charactervaryingNOTNULLPRIMARYKEY,
  version_name charactervarying,
  created_at timestamp without time zone DEFAULTnow(),
  is_active booleanDEFAULTfalse,
  deprecated booleanDEFAULTfalse,
  
-- Configs par variable (M1/M2/M3)
  m1_key charactervarying,
  m1_version charactervarying,
  m1_config jsonb,
  
  m2_key charactervarying,
  m2_version charactervarying,
  m2_config jsonb,
  
  m3_key charactervarying,
  m3_version charactervarying,
  m3_config jsonb,
  
-- Métriques de validation Level1
  level1_metrics jsonb,
  
  description text,
  changelog text
);
```

### Lien avec `h2_analysis_pairs`

sql

```sql
-- Les analyses Level2 (H2) référencent la version utilisée
algorithm_version charactervarying,
CONSTRAINT fk_h2_algorithm_version 
FOREIGNKEY(algorithm_version) 
REFERENCES algorithm_version_registry(version_id)
```

---

## 🏗️ Modèle de Données TypeScript

### Types Centralisés

typescript

```typescript
// types/core/validation.ts

exporttypeAlgorithmVersionId=string;// ex: "v2.3.1-openai-gpt4"

exportinterfaceAlgorithmVersionMetadata{
  version_id:AlgorithmVersionId;
  version_name:string;// ex: "GPT-4 Turbo + Regex Fallback"
  created_at:string;// ISO timestamp
  is_active:boolean;
  deprecated:boolean;
  
// Descriptif
  description?:string;
  changelog?:string;
  
// Configs par variable
  m1?:VariableConfig;
  m2?:VariableConfig;
  m3?:VariableConfig;
  
// Métriques Level1 (résultats validation)
  level1_metrics?:Level1ValidationMetrics;
}

exportinterfaceVariableConfig{
  key:string;// classifier key dans le registry
  version:string;// version interne de l'algo
  config:Record<string,any>;// hyperparamètres
}

exportinterfaceLevel1ValidationMetrics{
// Pour X/Y (classification)
  accuracy?:number;
  precision?:Record<string,number>;// par label
  recall?:Record<string,number>;
  f1?:Record<string,number>;
  kappa?:number;
  confusion_matrix?:Record<string,Record<string,number>>;
  
// Pour M1/M2/M3 (numériques)
  mae?:number;
  rmse?:number;
  r2?:number;
  pearson_r?:number;
  bias?:number;
  
// Métadonnées
  sample_size:number;
  test_date:string;
  gold_standard_version?:string;
}
```

---

## 🔄 Flux de Versioning

### 1. Enregistrement d'une Nouvelle Version

typescript

```typescript
// hooks/useAlgorithmVersioning.ts

exportconstuseAlgorithmVersioning=()=>{
const registerNewVersion =async(
    versionData:Omit<AlgorithmVersionMetadata,'created_at'>
):Promise<AlgorithmVersionId>=>{
const{ data, error }=await supabase
.from('algorithm_version_registry')
.insert({
...versionData,
        created_at:newDate().toISOString()
})
.select('version_id')
.single();
  
if(error)thrownewError(`Version registration failed: ${error.message}`);
return data.version_id;
};
  
constsetActiveVersion=async(versionId:AlgorithmVersionId)=>{
// Désactiver toutes les versions
await supabase
.from('algorithm_version_registry')
.update({ is_active:false})
.neq('version_id','__placeholder__');
  
// Activer la version cible
await supabase
.from('algorithm_version_registry')
.update({ is_active:true})
.eq('version_id', versionId);
};
  
return{ registerNewVersion, setActiveVersion };
};
```

### 2. Capture Automatique Post-Validation

typescript

```typescript
// components/Level1/hooks/usePostValidationVersioning.ts

exportconstusePostValidationVersioning=()=>{
const{ registerNewVersion }=useAlgorithmVersioning();
  
constcaptureVersionAfterTest=async(
    testResults:TVValidationResultCore[],
    algorithmKey:string,
    targetKind:TargetKind
)=>{
// Calculer métriques Level1
const metrics =computeLevel1Metrics(testResults);
  
// Récupérer config actuelle de l'algo
const algoMeta = algorithmRegistry.get(algorithmKey)?.meta;
if(!algoMeta)return;
  
// Générer version_id unique
const versionId =generateVersionId(algorithmKey, algoMeta.version);
  
// Construire payload
const variableConfig:VariableConfig={
      key: algorithmKey,
      version: algoMeta.version??'1.0.0',
      config: algoMeta.config??{}
};
  
const versionData:Omit<AlgorithmVersionMetadata,'created_at'>={
      version_id: versionId,
      version_name:`${algoMeta.displayName} v${algoMeta.version}`,
      is_active:false,
      deprecated:false,
      description: algoMeta.description,
      level1_metrics: metrics,
// Mapper selon targetKind
...(targetKind ==='M1'&&{ m1: variableConfig }),
...(targetKind ==='M2'&&{ m2: variableConfig }),
...(targetKind ==='M3'&&{ m3: variableConfig })
};
  
awaitregisterNewVersion(versionData);
  
return versionId;
};
  
return{ captureVersionAfterTest };
};
```

### 3. Génération de `version_id`

typescript

```typescript
// utils/versionIdGenerator.ts

exportconst generateVersionId =(
  algorithmKey:string,
  algorithmVersion:string='1.0.0'
):AlgorithmVersionId=>{
const timestamp =Date.now();
const shortHash = timestamp.toString(36).slice(-6);
  
// Format: algoKey-vX.Y.Z-shortHash
// Ex: "OpenAIXClassifier-v2.3.1-k7m9px"
return`${algorithmKey}-v${algorithmVersion}-${shortHash}`;
};
```

---

## 🖥️ Interface Utilisateur

### Composant `VersionSelector`

typescript

```typescript
// components/Level1/shared/VersionSelector.tsx

exportconstVersionSelector:React.FC<{
  targetKind:TargetKind;
  selectedVersionId?:AlgorithmVersionId;
onVersionSelect:(versionId:AlgorithmVersionId)=>void;
}>=({ targetKind, selectedVersionId, onVersionSelect })=>{
const[versions, setVersions]=useState<AlgorithmVersionMetadata[]>([]);
  
useEffect(()=>{
constloadVersions=async()=>{
const{ data }=await supabase
.from('algorithm_version_registry')
.select('*')
.not(`${targetKind.toLowerCase()}_key`,'is',null)
.order('created_at',{ ascending:false});
    
setVersions(data ??[]);
};
loadVersions();
},[targetKind]);
  
return(
<FormControl fullWidth>
<InputLabel>VersionAlgorithme</InputLabel>
<Select
        value={selectedVersionId ??''}
        onChange={(e)=>onVersionSelect(e.target.value)}
>
{versions.map((v)=>(
<MenuItem key={v.version_id} value={v.version_id}>
<Stack direction="row" spacing={1} alignItems="center">
<Typography>{v.version_name}</Typography>
{v.is_active&&<Chip label="Active" size="small" color="success"/>}
{v.deprecated&&<Chip label="Déprécié" size="small"/>}
<Typography variant="caption" color="text.secondary">
{newDate(v.created_at).toLocaleDateString()}
</Typography>
</Stack>
</MenuItem>
))}
</Select>
</FormControl>
);
};
```

### Intégration dans `BaseAlgorithmTesting`

typescript

```typescript
// components/Level1/algorithms/BaseAlgorithmTesting.tsx

exportconstBaseAlgorithmTesting:React.FC<BaseAlgorithmTestingProps>=({
  variableLabel,
  target
})=>{
const[selectedVersionId, setSelectedVersionId]=useState<AlgorithmVersionId>();
const{ captureVersionAfterTest }=usePostValidationVersioning();
  
construnValidation=async()=>{
// ... validation existante
const results =awaitvalidateAlgorithm(selectedModelId, sampleSize);
  
// 🆕 Capture automatique de la version
const newVersionId =awaitcaptureVersionAfterTest(
      results,
      selectedModelId,
      target
);
  
console.log(`✅ Version capturée: ${newVersionId}`);
setTestResults(results);
};
  
return(
<Box>
{/* Sélecteur de version existante (optionnel) */}
<VersionSelector
        targetKind={target}
        selectedVersionId={selectedVersionId}
        onVersionSelect={setSelectedVersionId}
/>
    
{/* RunPanel + ResultsPanel existants */}
<RunPanel onRun={runValidation}/>
<ResultsPanel results={testResults}/>
</Box>
);
};
```

---

## 📈 Composant de Comparaison de Versions

### `VersionComparator`

typescript

```typescript
// components/Level1/comparison/VersionComparator.tsx

exportconstVersionComparator:React.FC<{
  targetKind:TargetKind;
}>=({ targetKind })=>{
const[versionA, setVersionA]=useState<AlgorithmVersionMetadata>();
const[versionB, setVersionB]=useState<AlgorithmVersionMetadata>();
  
const metricsDiff =useMemo(()=>{
if(!versionA?.level1_metrics ||!versionB?.level1_metrics)returnnull;
  
const metricsA = versionA.level1_metrics;
const metricsB = versionB.level1_metrics;
  
return{
      accuracy_delta:(metricsB.accuracy??0)-(metricsA.accuracy??0),
      f1_delta:calculateF1Delta(metricsA, metricsB),
      kappa_delta:(metricsB.kappa??0)-(metricsA.kappa??0),
// ... autres métriques
};
},[versionA, versionB]);
  
return(
<Card>
<CardContent>
<Typography variant="h6">Comparaison de Versions</Typography>
      
<Stack direction="row" spacing={2} sx={{ mt:2}}>
<VersionSelector
            targetKind={targetKind}
            onVersionSelect={(id)=>loadVersion(id, setVersionA)}
/>
<Typography variant="h6">vs</Typography>
<VersionSelector
            targetKind={targetKind}
            onVersionSelect={(id)=>loadVersion(id, setVersionB)}
/>
</Stack>
      
{metricsDiff &&(
<TableContainer sx={{ mt:3}}>
<Table>
<TableHead>
<TableRow>
<TableCell>Métrique</TableCell>
<TableCell>VersionA</TableCell>
<TableCell>VersionB</TableCell>
<TableCell>Δ</TableCell>
</TableRow>
</TableHead>
<TableBody>
<TableRow>
<TableCell>Accuracy</TableCell>
<TableCell>{(versionA.level1_metrics.accuracy*100).toFixed(1)}%</TableCell>
<TableCell>{(versionB.level1_metrics.accuracy*100).toFixed(1)}%</TableCell>
<TableCell>
<Chip
                      label={`${metricsDiff.accuracy_delta>0?'+':''}${(metricsDiff.accuracy_delta*100).toFixed(1)}%`}
                      color={metricsDiff.accuracy_delta>0?'success':'error'}
                      size="small"
/>
</TableCell>
</TableRow>
{/* Autres métriques */}
</TableBody>
</Table>
</TableContainer>
)}
</CardContent>
</Card>
);
};
```

---

## 🔄 Workflow Complet

### Scénario : Test d'une Nouvelle Version GPT-4

typescript

```typescript
// 1. Développeur ajuste hyperparamètres dans OpenAIXClassifier
const newConfig ={
  model:'gpt-4-turbo-2024-04-09',
  temperature:0.3,// ⬇️ baissé de 0.7
  max_tokens:150
};

// 2. Enregistrement dans AlgorithmRegistry
algorithmRegistry.register({
  key:'OpenAIXClassifier',
  version:'2.4.0',// ⬆️ bump version
  config: newConfig,
// ...
});

// 3. Test dans BaseAlgorithmTesting
// → Lance validation sur 1000 échantillons
// → Calcule métriques Level1
// → Capture automatique dans algorithm_version_registry

// 4. Résultat en BDD
{
  version_id:"OpenAIXClassifier-v2.4.0-k9m2px",
  version_name:"OpenAI X Classifier v2.4.0",
  is_active:false,
  m1_key:"OpenAIXClassifier",
  m1_version:"2.4.0",
  m1_config:{ model:"gpt-4-turbo-2024-04-09", temperature:0.3,...},
  level1_metrics:{
    accuracy:0.87,
    f1:{"ENGAGEMENT":0.89,"OUVERTURE":0.85,...},
    kappa:0.82,
    sample_size:1000,
    test_date:"2025-01-15T14:30:00Z"
}
}

// 5. Comparaison avec version précédente
// → VersionComparator affiche +2.3% accuracy, +0.05 kappa

// 6. Activation si satisfaisant
setActiveVersion("OpenAIXClassifier-v2.4.0-k9m2px");
```

---

## 📋 Checklist d'Implémentation

### Phase 1 : Fondations (Semaine 1)

* [ ] Créer types `AlgorithmVersionMetadata`, `VariableConfig`
* [ ] Implémenter `useAlgorithmVersioning` hook
* [ ] Ajouter `generateVersionId` utility
* [ ] Tester insert/update dans `algorithm_version_registry`

### Phase 2 : Capture Auto (Semaine 2)

* [ ] Créer `usePostValidationVersioning` hook
* [ ] Intégrer dans `BaseAlgorithmTesting.runValidation()`
* [ ] Implémenter `computeLevel1Metrics` helper
* [ ] Tester capture après validation X/Y/M1/M2/M3

### Phase 3 : UI Versioning (Semaine 3)

* [ ] Développer `VersionSelector` component
* [ ] Ajouter badge version dans `AlgorithmSelector`
* [ ] Créer `VersionComparator` avec diff metrics
* [ ] Implémenter `setActiveVersion` UI action

### Phase 4 : Intégration Level2 (Semaine 4)

* [ ] Vérifier FK `h2_analysis_pairs.algorithm_version`
* [ ] Tracker version utilisée dans analyses H2
* [ ] Dashboard "Version Performance Over Time"

---

## 🎨 Maquettes UI

### Badge Version dans AlgorithmSelector

```
┌─────────────────────────────────────────────┐
│ [📊] OpenAI X Classifier                    │
│      ├─ v2.4.0 (Active) ✅                  │
│      ├─ GPT-4 Turbo + Regex Fallback        │
│      └─ Accuracy: 87% | Kappa: 0.82         │
└─────────────────────────────────────────────┘
```

### Comparateur de Versions

```
┌──────────────────────────────────────────────────────────┐
│  Version A: v2.3.1       vs      Version B: v2.4.0       │
├──────────────────────────────────────────────────────────┤
│  Métrique    │   v2.3.1   │   v2.4.0   │      Δ         │
│──────────────┼────────────┼────────────┼────────────────│
│  Accuracy    │   84.7%    │   87.0%    │  +2.3% ✅      │
│  Kappa       │   0.77     │   0.82     │  +0.05 ✅      │
│  F1 (ENGAGE) │   0.86     │   0.89     │  +0.03 ✅      │
│  Temps moy   │   842ms    │   1203ms   │  +361ms ⚠️     │
└──────────────────────────────────────────────────────────┘
```

---

## 🚨 Points d'Attention

### 1. Collision de `version_id`

* **Risque** : Deux tests simultanés génèrent le même ID
* **Solution** : Ajouter UUID court ou PID dans `generateVersionId`

### 2. Explosion du Nombre de Versions

* **Risque** : 1 version par test = surcharge BDD
* **Solution** : Flag `is_snapshot` pour tests exploratoires vs versions "officielles"

### 3. Cohérence Level1 ↔ Level2

* **Risque** : Version testée en Level1 ≠ version utilisée en Level2
* **Solution** : Vérifier `algorithm_version` avant analyses H2

### 4. Métriques Incomparables

* **Risque** : Gold standard change entre versions
* **Solution** : Tracker `gold_standard_version` dans metadata

---

## 📚 Références

* **Schema BDD** : `schema.sql` → `algorithm_version_registry`
* **Types Core** : `/types/core/validation.ts`
* **Registry** : `/algorithms/level1/shared/AlgorithmRegistry.ts`
* **Hook Level1** : `/hooks/useLevel1Testing.ts`

---

## 🎯 Next Steps

1. **Valider schéma types** avec équipe backend
2. **Prototyper `VersionSelector`** dans Storybook
3. **Tester capture auto** sur 1 algo (ex: RegexXClassifier)
4. **Designer dashboard** "Version Timeline" (bonus)

---

**Auteur** : Architecture AlgorithmLab

**Date** : 2025-01-XX

**Version Doc** : 1.0
