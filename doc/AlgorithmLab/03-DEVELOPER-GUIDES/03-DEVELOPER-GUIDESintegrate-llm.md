
# 📘 Guide 3 : Intégrer un LLM

markdown

```markdown
# Intégrer un LLM (OpenAI / Claude)

**Temps estimé** : 60-90 minutes  
**Niveau** : Avancé  
**Prérequis** : 
- Compréhension des APIs REST
- Connaissance des variables d'environnement Next.js
- Lecture de [OpenAIXClassifier](../../../algorithms/level1/XAlgorithms/OpenAIXClassifier.ts)

---

## 🎯 Ce que tu vas apprendre

- Créer un classificateur LLM (OpenAI GPT / Anthropic Claude)
- Gérer les appels API côté serveur (sécurité)
- Optimiser les prompts pour la classification
- Gérer les erreurs et timeouts
- Implémenter le rate limiting

---

## 📁 Fichiers concernés
```

src/app/(protected)/analysis/components/AlgorithmLab/
├── algorithms/level1/XAlgorithms/
│   └── OpenAIXClassifier.ts          ← Référence complète
├── app/api/algolab/classifiers/
│   └── route.ts                      ← API route Next.js
└── .env.local                        ← Variables d'environnement

```

---

## 🚀 Étape 1 : Configuration de l'environnement

### Créer le fichier `.env.local` (à la racine du projet)
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Anthropic Claude (optionnel)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Configuration
OPENAI_MODEL=gpt-4o                    # ou gpt-4o-mini
OPENAI_TEMPERATURE=0                   # 0 = déterministe
OPENAI_MAX_TOKENS=16                   # Court pour classification
OPENAI_TIMEOUT=10000                   # ms
```

**⚠️ SÉCURITÉ CRITIQUE** :

* ✅ **JAMAIS** de `NEXT_PUBLIC_*` pour les clés API
* ✅ Ajouter `.env.local` au `.gitignore`
* ✅ Les clés ne doivent être accessibles que côté serveur

---

## 🚀 Étape 2 : Créer le classificateur LLM

### Fichier : `algorithms/level1/XAlgorithms/OpenAIXClassifier.ts`

typescript

```typescript
importtype{
UniversalAlgorithm,
AlgorithmDescriptor,
UniversalResult,
}from"@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base";

typeOpenAIConfig={
  apiKey?:string;
  model?:string;
  temperature?:number;
  maxTokens?:number;
  timeout?:number;
  enableFallback?:boolean;// Si erreur → AUTRE_NON_RECONNU
};

constLABELS=[
"ENGAGEMENT",
"OUVERTURE",
"REFLET_JE",
"REFLET_VOUS",
"REFLET_ACQ",
"EXPLICATION",
"AUTRE_NON_RECONNU",
]asconst;

exportclassOpenAIXClassifierimplementsUniversalAlgorithm{
private apiKey:string;
private config:Required<Omit<OpenAIConfig,"apiKey">>;

constructor(config:OpenAIConfig={}){
// ⚠️ Clé API côté serveur uniquement
this.apiKey= config.apiKey|| process.env.OPENAI_API_KEY||"";

this.config={
      model: config.model||"gpt-4o",
      temperature: config.temperature??0,
      maxTokens: config.maxTokens??16,
      timeout: config.timeout??10000,
      enableFallback: config.enableFallback??true,
};
}

describe():AlgorithmDescriptor{
return{
      name:"OpenAIXClassifier",
      displayName:"OpenAI — Classificateur X",
      version:"2.3.0",
      type:"llm",
      target:"X",
      batchSupported:true,
      requiresContext:false,
      description:
"Classification LLM via GPT-4o avec sortie JSON structurée",
      examples:[
{ input:"je vais vérifier votre dossier", note:"ENGAGEMENT"},
{ input:"vous allez recevoir un email", note:"OUVERTURE"},
],
};
}

validateConfig():boolean{
returnthis.config.maxTokens>0&&this.config.timeout>0;
}

asyncrun(input:unknown):Promise<UniversalResult>{
const verbatim =String(input ??"");
const startTime =Date.now();

// ── Détection environnement
const isServer =typeofwindow==="undefined";

if(isServer){
returnthis.runServerSide(verbatim, startTime);
}else{
returnthis.runClientSide(verbatim, startTime);
}
}

// ══════════════════════════════════════════════════════════
// 🌐 CÔTÉ CLIENT : Appel via API Route Next.js
// ══════════════════════════════════════════════════════════
privateasyncrunClientSide(
    verbatim:string,
    startTime:number
):Promise<UniversalResult>{
try{
console.log("🌐 [CLIENT] Appel via API interne");

const response =awaitfetch("/api/algolab/classifiers",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          key:"OpenAIXClassifier",
          verbatim,
          timestamp:Date.now(),
}),
});

if(!response.ok){
const errorText =await response.text().catch(()=> response.statusText);
console.error(`❌ API Error ${response.status}:`, errorText);
returnthis.fallback(startTime,`api_status_${response.status}`);
}

const data =await response.json();

if(!data?.ok ||!Array.isArray(data.results)||!data.results[0]){
console.error("❌ Invalid API payload:", data);
returnthis.fallback(startTime,"api_invalid_payload");
}

return data.results[0]asUniversalResult;
}catch(error:any){
console.error("❌ Client API call failed:", error);
returnthis.fallback(startTime, error?.message ??"api_network_error");
}
}

// ══════════════════════════════════════════════════════════
// 🔧 CÔTÉ SERVEUR : Appel direct OpenAI
// ══════════════════════════════════════════════════════════
privateasyncrunServerSide(
    verbatim:string,
    startTime:number
):Promise<UniversalResult>{
console.log("🔧 [SERVER] Appel direct OpenAI API");

if(!this.apiKey){
console.error("❌ No OpenAI API key");
returnthis.fallback(startTime,"no-api-key");
}

const controller =newAbortController();
const timer =setTimeout(()=>{
console.warn("⏰ OpenAI API timeout");
      controller.abort();
},this.config.timeout);

try{
const response =awaitfetch(
"https://api.openai.com/v1/chat/completions",
{
          method:"POST",
          signal: controller.signal,
          headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${this.apiKey}`,
},
          body:JSON.stringify({
            model:this.config.model,
            temperature:this.config.temperature,
            max_tokens:this.config.maxTokens,

// 🔒 Sortie structurée : JSON strict
            response_format:{
              type:"json_schema",
              json_schema:{
                name:"x_label",
                strict:true,
                schema:{
                  type:"object",
                  additionalProperties:false,
                  properties:{
                    label:{ type:"string",enum:[...LABELS]},
},
                  required:["label"],
},
},
},

            messages:this.buildPrompt(verbatim),
}),
}
);

clearTimeout(timer);

if(!response.ok){
let reason =`openai_status_${response.status}`;
try{
const errorData =await response.json();
if(errorData?.error?.message){
            reason +=`:${errorData.error.message}`;
}
}catch{}
returnthis.fallback(startTime, reason);
}

const data =await response.json();
returnthis.parseResponse(data, startTime);
}catch(error:any){
clearTimeout(timer);
console.error("❌ OpenAI API call failed:", error);
returnthis.fallback(startTime, error?.message ??"network_error");
}
}

// ══════════════════════════════════════════════════════════
// 📝 CONSTRUCTION DU PROMPT (CRITIQUE)
// ══════════════════════════════════════════════════════════
privatebuildPrompt(verbatim:string){
return[
{
        role:"system",
        content:`Tu es un expert en classification des stratégies linguistiques des conseillers.

RÈGLE FONDAMENTALE - HIÉRARCHIE DE PRIORITÉ :
1. ENGAGEMENT > 2. OUVERTURE > 3. REFLET > 4. EXPLICATION

Si plusieurs fonctions coexistent, choisis TOUJOURS la plus haute dans cette hiérarchie.

CATÉGORIES :

🎯 ENGAGEMENT (PRIORITÉ 1) - Action du conseiller
MARQUEURS : "je vais/fais/vérifie/transfère", "je suis en train de"
LOGIQUE : Le conseiller annonce une action concrète qu'il réalise
- "D'accord, je vais vérifier" → ENGAGEMENT (action prime sur acquiescement)

🎯 OUVERTURE (PRIORITÉ 2) - Action du client
MARQUEURS : "vous allez/recevrez", impératifs, "veuillez", "il faut que vous"
LOGIQUE : Le conseiller oriente le client vers une action
- "Vous pouvez aller sur le site" → OUVERTURE

🎯 REFLET (PRIORITÉ 3)
- REFLET_VOUS : description client ("Je vois que vous avez appelé")
- REFLET_JE : état mental ("je comprends")
- REFLET_ACQ : acquiescement court ("oui", "d'accord")

🎯 EXPLICATION (PRIORITÉ 4)
MARQUEURS : "parce que", "notre politique", "le système fonctionne"
LOGIQUE : Justification institutionnelle sans action concrète`,
},

// Few-shot examples
{ role:"user", content:"D'accord, je vais faire le nécessaire"},
{ role:"assistant", content:'{"label": "ENGAGEMENT"}'},

{ role:"user", content:"Vous pouvez aller sur le site"},
{ role:"assistant", content:'{"label": "OUVERTURE"}'},

{ role:"user", content:"Je comprends votre frustration"},
{ role:"assistant", content:'{"label": "REFLET_JE"}'},

{ role:"user", content:"Notre système fonctionne ainsi"},
{ role:"assistant", content:'{"label": "EXPLICATION"}'},

// Instance à classer
{ role:"user", content: verbatim.trim()},
];
}

// ══════════════════════════════════════════════════════════
// 🔍 PARSING DE LA RÉPONSE
// ══════════════════════════════════════════════════════════
privateparseResponse(data:any, startTime:number):UniversalResult{
const rawContent = data?.choices?.[0]?.message?.content ??"";
let label ="AUTRE_NON_RECONNU";

try{
const parsed =JSON.parse(rawContent);
if(parsed?.label &&LABELS.includes(parsed.label)){
        label = parsed.label;
}
}catch{
// Fallback : extraction regex si JSON invalide
const content = rawContent.toUpperCase();
if(content.includes("ENGAGEMENT")) label ="ENGAGEMENT";
elseif(content.includes("OUVERTURE")) label ="OUVERTURE";
elseif(content.includes("REFLET_VOUS")) label ="REFLET_VOUS";
elseif(content.includes("REFLET_JE")) label ="REFLET_JE";
elseif(content.includes("REFLET_ACQ")) label ="REFLET_ACQ";
elseif(content.includes("EXPLICATION")) label ="EXPLICATION";
}

return{
      prediction: label,
      confidence: label ==="AUTRE_NON_RECONNU"?0.25:0.85,
      processingTime:Date.now()- startTime,
      algorithmVersion:this.config.model,
      metadata:{
        target:"X",
        inputType:"string",
        executionPath:["openai_gpt_json"],
        provider:"openai",
        x_details:{
          family:this.familyFromX(label),
          rawResponse: rawContent,
},
},
};
}

// ══════════════════════════════════════════════════════════
// 🔄 BATCH PROCESSING (avec rate limiting)
// ══════════════════════════════════════════════════════════
asyncbatchRun(inputs:unknown[]):Promise<UniversalResult[]>{
console.log(`🔄 Batch processing ${inputs.length} items`);
const results:UniversalResult[]=[];

for(let i =0; i < inputs.length; i++){
console.log(`Processing ${i +1}/${inputs.length}`);
    
// eslint-disable-next-line no-await-in-loop
      results.push(awaitthis.run(inputs[i]));
    
// Rate limiting : 120ms entre chaque appel
// eslint-disable-next-line no-await-in-loop
awaitnewPromise((r)=>setTimeout(r,120));
}

return results;
}

// ══════════════════════════════════════════════════════════
// 🛠️ HELPERS
// ══════════════════════════════════════════════════════════
privatefallback(startTime:number, reason:string):UniversalResult{
console.warn(`⚠️ Fallback triggered: ${reason}`);

return{
      prediction:"AUTRE_NON_RECONNU",
      confidence:this.config.enableFallback?0.25:0,
      processingTime:Date.now()- startTime,
      algorithmVersion:"openai-no-call",
      metadata:{
        target:"X",
        inputType:"string",
        executionPath:["no_api_or_error"],
        x_details:{
          family:"AUTRE",
          reason,
},
},
};
}

privatefamilyFromX(label:string):string{
if(label.includes("REFLET"))return"REFLET";
if(label.includes("ENGAGEMENT"))return"ENGAGEMENT";
if(label.includes("OUVERTURE"))return"OUVERTURE";
if(label.includes("EXPLICATION"))return"EXPLICATION";
return"AUTRE";
}

// Config live (pour debug)
getConfig(){
return{
      apiKey:this.apiKey?"***CONFIGURED***":"***NOT_SET***",
...this.config,
};
}

updateConfig(partial:Partial<OpenAIConfig>){
if(typeof partial.apiKey==="string")this.apiKey= partial.apiKey;
if(typeof partial.model==="string")this.config.model= partial.model;
if(typeof partial.temperature==="number")
this.config.temperature= partial.temperature;
if(typeof partial.maxTokens==="number")
this.config.maxTokens= partial.maxTokens;
if(typeof partial.timeout==="number")
this.config.timeout= partial.timeout;
if(typeof partial.enableFallback==="boolean")
this.config.enableFallback= partial.enableFallback;
}
}
```

---

## 🚀 Étape 3 : Créer l'API Route Next.js

### Fichier : `app/api/algolab/classifiers/route.ts`

typescript

```typescript
import{NextRequest,NextResponse}from"next/server";
import{ algorithmRegistry }from"@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry";

exportconst runtime ="nodejs";// ✅ Force Node.js runtime

exportasyncfunctionPOST(request:NextRequest){
try{
const body =await request.json();
const{ key, verbatim, batch }= body;

console.log(`🔧 [API] Classification request: ${key}`);

// Validation
if(!key ||typeof key !=="string"){
returnNextResponse.json(
{ ok:false, error:"Missing or invalid 'key'"},
{ status:400}
);
}

// Récupération de l'algorithme
const algorithm = algorithmRegistry.get(key);
if(!algorithm){
returnNextResponse.json(
{ ok:false, error:`Algorithm '${key}' not found`},
{ status:404}
);
}

// Exécution
let results;
if(batch &&Array.isArray(verbatim)){
// Batch processing
      results =await algorithm.batchRun?.(verbatim);
if(!results){
thrownewError("Batch processing not supported");
}
}else{
// Single processing
const result =await algorithm.run(verbatim);
      results =[result];
}

returnNextResponse.json({
      ok:true,
      results,
      metadata:{
        algorithm: key,
        count: results.length,
        timestamp:newDate().toISOString(),
},
});
}catch(error:any){
console.error("❌ [API] Classification error:", error);

returnNextResponse.json(
{
        ok:false,
        error: error?.message ||"Internal server error",
        stack: process.env.NODE_ENV==="development"? error?.stack :undefined,
},
{ status:500}
);
}
}

// Support GET pour health check
exportasyncfunctionGET(){
returnNextResponse.json({
    ok:true,
    message:"AlgorithmLab Classifiers API",
    algorithms: algorithmRegistry.list().map((a)=>({
      key: a.key,
      displayName: a.meta.displayName,
      target: a.meta.target,
})),
});
}
```

---

## 🚀 Étape 4 : Enregistrer l'algorithme

typescript

```typescript
// algorithms/level1/XAlgorithms/index.ts
import{ algorithmRegistry }from"../shared/AlgorithmRegistry";
import{OpenAIXClassifier}from"./OpenAIXClassifier";

exportfunctionregisterXAlgorithms(){
  algorithmRegistry.register("OpenAIXClassifier",newOpenAIXClassifier());
  
console.log("✅ X algorithms registered");
}
```

---

## 🚀 Étape 5 : Tester l'intégration

### Test unitaire

typescript

```typescript
// __tests__/OpenAIXClassifier.test.ts
import{OpenAIXClassifier}from"@/algorithms/level1/XAlgorithms/OpenAIXClassifier";

describe("OpenAIXClassifier",()=>{
const classifier =newOpenAIXClassifier({
    apiKey: process.env.OPENAI_API_KEY,
});

it("should classify ENGAGEMENT correctly",async()=>{
const result =await classifier.run("je vais vérifier votre dossier");
  
expect(result.prediction).toBe("ENGAGEMENT");
expect(result.confidence).toBeGreaterThan(0.7);
expect(result.metadata?.target).toBe("X");
});

it("should handle batch processing",async()=>{
const inputs =[
"je vais vérifier",
"vous allez recevoir",
"je comprends",
];
  
const results =await classifier.batchRun(inputs);
  
expect(results).toHaveLength(3);
expect(results[0].prediction).toBe("ENGAGEMENT");
expect(results[1].prediction).toBe("OUVERTURE");
expect(results[2].prediction).toBe("REFLET_JE");
});
});
```

### Test dans l'interface

typescript

```typescript
<BaseAlgorithmTesting
  variableLabel="X — OpenAI GPT-4o"
  defaultClassifier="OpenAIXClassifier"
  target="X"
/>
```

---

## 🎯 Optimisation des prompts

### Principes clés

1. **Few-shot learning** : Ajouter 3-5 exemples par catégorie
2. **Hiérarchie explicite** : Toujours rappeler la priorité ENGAGEMENT > OUVERTURE > ...
3. **Instructions négatives** : "N'utilise PAS X si Y est présent"
4. **Format structuré** : Forcer JSON Schema (pas de texte libre)

### Exemple de prompt amélioré

typescript

```typescript
privatebuildPrompt(verbatim:string){
return[
{
      role:"system",
      content:`Tu es un expert en analyse conversationnelle.

HIÉRARCHIE DE PRIORITÉ (appliquer strictement) :
1. ENGAGEMENT > 2. OUVERTURE > 3. REFLET > 4. EXPLICATION

RÈGLES DE DÉSAMBIGUÏSATION :
- Si "je vais" + verbe action → TOUJOURS ENGAGEMENT (même si acquiescement avant)
- Si "vous allez" + verbe → TOUJOURS OUVERTURE (même si justification après)
- Si données chiffrées (€, %, dates précises) → JAMAIS REFLET → EXPLICATION
- Si acquiescement seul (<20 chars) → REFLET_ACQ

CATÉGORIES DÉTAILLÉES :
[... détails par catégorie ...]

Renvoie UNIQUEMENT un JSON : {"label": "<LABEL>"}`,
},
  
// Few-shot (au moins 2 par catégorie)
{ role:"user", content:"D'accord, je vais vérifier maintenant"},
{ role:"assistant", content:'{"label": "ENGAGEMENT"}'},
  
{ role:"user", content:"Je comprends, mais je vais traiter ça"},
{ role:"assistant", content:'{"label": "ENGAGEMENT"}'},
  
// ... autres exemples
  
{ role:"user", content: verbatim },
];
}
```

---

## 🛡️ Gestion des erreurs

### Stratégies de fallback

typescript

```typescript
privateasyncrunWithRetry(
  verbatim:string,
  maxRetries:number=3
):Promise<UniversalResult>{
let lastError:Error|null=null;
  
for(let attempt =1; attempt <= maxRetries; attempt++){
try{
console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
returnawaitthis.runServerSide(verbatim,Date.now());
}catch(error:any){
      lastError = error;
console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
    
// Exponential backoff
if(attempt < maxRetries){
const delay =Math.pow(2, attempt)*1000;// 2s, 4s, 8s
awaitnewPromise(r =>setTimeout(r, delay));
}
}
}
  
// Fallback après tous les échecs
returnthis.fallback(Date.now(), lastError?.message ||"max_retries_exceeded");
}
```

---

## 💰 Optimisation des coûts

### Calcul du coût

typescript

```typescript
interfaceCostEstimate{
  inputTokens:number;
  outputTokens:number;
  costUSD:number;
}

functionestimateCost(
  verbatim:string,
  model:string="gpt-4o"
):CostEstimate{
// Estimation grossière : ~4 chars = 1 token
const inputTokens =Math.ceil(verbatim.length/4)+500;// +500 pour le prompt
const outputTokens =16;// Max tokens configuré
  
// Prix (à jour janvier 2025)
const prices:Record<string,{ input:number; output:number}>={
"gpt-4o":{ input:0.0025, output:0.01},// per 1K tokens
"gpt-4o-mini":{ input:0.00015, output:0.0006},
};
  
const price = prices[model]|| prices["gpt-4o"];
  
const costUSD =
(inputTokens /1000)* price.input+
(outputTokens /1000)* price.output;
  
return{ inputTokens, outputTokens, costUSD };
}

// Exemple d'utilisation
const estimate =estimateCost("je vais vérifier votre dossier");
console.log(`Coût estimé : $${estimate.costUSD.toFixed(6)}`);
// Coût estimé : $0.000316 (moins de 0.1 centime par classification)
```

### Réduction des coûts

1. **Utiliser gpt-4o-mini** pour les classifications simples (-95% de coût)
2. **Batch processing** : Envoyer plusieurs verbatims en un appel
3. **Cache des résultats** : Stocker les classifications déjà faites
4. **Prompt minimaliste** : Réduire les tokens du system prompt

---

## ✅ Checklist finale

* [ ] ✅ Variables d'environnement configurées (`.env.local`)
* [ ] ✅ `.env.local` dans `.gitignore`
* [ ] ✅ API Key jamais exposée côté client
* [ ] ✅ API Route Next.js fonctionnelle
* [ ] ✅ Timeout configuré (10s recommandé)
* [ ] ✅ Fallback en cas d'erreur
* [ ] ✅ Rate limiting implémenté (batch)
* [ ] ✅ Prompt testé sur cas limites
* [ ] ✅ Métriques > seuils (Accuracy > 0.85)
* [ ] ✅ Coûts estimés et validés

---

## 🐛 Problèmes fréquents

### ❌ Problème : `OPENAI_API_KEY is not defined`

**Cause** : Variable d'environnement non chargée

**Solution** :

bash

```bash
# Redémarrer le serveur Next.js
npm run dev

# Vérifier que .env.local est à la racine
ls -la .env.local
```

---

### ❌ Problème : Erreur 429 (Rate Limit Exceeded)

**Cause** : Trop d'appels API en peu de temps

**Solution** :

typescript

```typescript
// Ajouter un délai entre les appels
awaitnewPromise(r =>setTimeout(r,200));// 200ms entre appels
```

---

### ❌ Problème : JSON Schema refusé par OpenAI

**Cause** : Schema trop strict ou enum invalide

**Solution** :

typescript

```typescript
// ✅ CORRECT
response_format:{
  type:"json_schema",
  json_schema:{
    strict:true,
    schema:{
      type:"object",
      properties:{
        label:{ type:"string",enum:[...LABELS]}
},
      required:["label"]
}
}
}
```

---

### ❌ Problème : Timeout systématique

**Cause** : Prompt trop long ou modèle surchargé

**Solution** :

typescript

```typescript
// Augmenter le timeout
timeout:30000,// 30s au lieu de 10s

// OU réduire le prompt
// OU utiliser gpt-4o-mini (plus rapide)
```

---

## 📚 Ressources complémentaires

* **[OpenAI API Docs](https://platform.openai.com/docs/api-reference)** - Documentation officielle
* **[Anthropic Claude API](https://docs.anthropic.com/)** - Alternative à OpenAI
* **[Prompt Engineering Guide](https://www.promptingguide.ai/)** - Optimisation prompts
* **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Documentation Next.js

---

⏱️ **Temps de lecture** : ~15 minutes

🎯 **Difficulté** : ⭐⭐⭐⭐⭐ Avancé
