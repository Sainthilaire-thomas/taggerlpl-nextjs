
# Algorithmes AlgorithmLab

**Classification vs Calcul : comprendre les deux types d'algorithmes**

---

## 🎯 Vue d'ensemble

AlgorithmLab distingue deux familles d'algorithmes selon la **nature de la variable** analysée :

| Type                      | Variables concernées | Sortie            | Exemples d'algorithmes                                    |
| ------------------------- | --------------------- | ----------------- | --------------------------------------------------------- |
| **Classificateurs** | X, Y, M2              | Label discret     | RegexXClassifier, OpenAIXClassifier, M2CompositeAlignment |
| **Calculateurs**    | M1, M3                | Valeur numérique | M1ActionVerbCounter, PausesM3Calculator                   |

---

## 📊 Classificateurs (Classification)

### Définition

Les **classificateurs** assignent un **label discret** à une entrée textuelle. Ils répondent à la question : *"À quelle catégorie appartient ce tour de parole ?"*

### Variables concernées

- **X** : Stratégies conseiller (`ENGAGEMENT`, `OUVERTURE`, `REFLET_*`, `EXPLICATION`)
- **Y** : Réactions client (`CLIENT_POSITIF`, `CLIENT_NEGATIF`, `CLIENT_NEUTRE`, etc.)
- **M2** : Alignement interactionnel (`ALIGNEMENT_FORT`, `ALIGNEMENT_FAIBLE`, `DESALIGNEMENT`)

### Interface commune

```typescript
interface Classifier<TInput, TOutput> {
  // Métadonnées
  describe(): AlgorithmDescriptor;
  validateConfig(): boolean;
  
  // Exécution
  run(input: TInput): Promise<UniversalResult>;
  batchRun?(inputs: TInput[]): Promise<UniversalResult[]>;
}

// Résultat standardisé
interface UniversalResult {
  prediction: string;        // Label prédit (ex: "ENGAGEMENT")
  confidence: number;        // Confiance [0-1]
  processingTime?: number;   // Temps de traitement (ms)
  metadata?: {
    target: VariableTarget;  // "X" | "Y" | "M2"
    details: VariableDetails;
    evidences?: string[];    // Preuves linguistiques
  };
}
```


## 🔢 Calculateurs (Calcul)

### Définition

Les **calculateurs** produisent une **valeur numérique** à partir d'une analyse linguistique ou cognitive. Ils répondent à la question : *"Quelle est la mesure de cette caractéristique ?"*

### Variables concernées

* **M1** : Densité de verbes d'action (valeur normalisée pour 100 tokens)
* **M3** : Charge cognitive (score entre 0 et 1)

### Interface commune

typescript

```typescript
interfaceCalculator<TInput,TDetails>{
// Métadonnées
getMetadata():CalculationMetadata;
validateConfig():boolean;
  
// Calcul
calculate(input:TInput):Promise<CalculationResult<TDetails>>;
  batchCalculate?(inputs:TInput[]):Promise<CalculationResult<TDetails>[]>;
}

// Résultat de calcul
interfaceCalculationResult<TDetails>{
  prediction:string;// Valeur convertie en string (ex: "22.50")
  confidence:number;// Confiance dans le calcul
  processingTime:number;
  details:TDetails;// Détails enrichis (M1Details | M3Details)
}
```

---

## 🎨 Types d'implémentation

AlgorithmLab supporte **4 approches techniques** pour implémenter les algorithmes :

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Type</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Description</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Avantages</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Inconvénients</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Exemples</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>rule-based</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Règles linguistiques (regex, dictionnaires)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Transparent, rapide, pas de dépendance externe</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Rigide, nécessite expertise linguistique</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">RegexXClassifier, RegexYClassifier</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>ml</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Modèles ML classiques (SVM, Random Forest)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Performant, généralise bien</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Nécessite entraînement, boîte noire</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">SpacyXClassifier</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>llm</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Modèles de langage (GPT, Claude)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Très performant, contexte étendu</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Coûteux, latence, nécessite API</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">OpenAIXClassifier, OpenAI3TXClassifier</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>hybrid</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Combinaison de plusieurs approches</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Robuste, tire parti de plusieurs méthodes</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Complexe à maintenir</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">M2CompositeAlignment</td></tr></tbody></table></pre>

typescript

```typescript
typeAlgorithmType="rule-based"|"ml"|"llm"|"hybrid"|"metric";
```

---

## 🔍 Classificateurs détaillés

### 1. Classificateurs X (Stratégies conseiller)

#### 📌 RegexXClassifier

**Type** : `rule-based`

**Description** : Classification par règles regex selon la charte v1.2 de la thèse

**Fonctionnement** :

typescript

```typescript
// Priorité hiérarchique appliquée
const patterns ={
ENGAGEMENT:[
/\bje\s+(vais|fais|vérifie|transfère)\b/i,
/\bje\s+m['']occupe\b/i,
],
OUVERTURE:[
/\bvous\s+(allez|pouvez|devez)\b/i,
/\bveuillez\b/i,
/\bil\s+faut\s+que\s+vous\b/i,
],
REFLET_VOUS:[
/\bje\s+vois\s+que\s+vous\b/i,
/\bvous\s+avez\b/i,
],
REFLET_JE:[
/\bje\s+(comprends|entends|vois)\b/i,
],
REFLET_ACQ:[
/\b(d'accord|oui|ok|mm-hmm)\b/i,
],
EXPLICATION:[
/\b(parce que|car|notre politique)\b/i,
/\bfonctionne\b/i,
],
};

// Application des règles avec priorité
1.ChercherENGAGEMENT → si trouvé, retourner
2.Sinon chercher OUVERTURE → si trouvé, retourner
3.Sinon chercher REFLET_VOUS(avec garde-fous) → si trouvé, retourner
4.Sinon chercher REFLET_JE → si trouvé, retourner
5.Sinon chercher REFLET_ACQ → si trouvé, retourner
6.Sinon chercher EXPLICATION → si trouvé, retourner
7.Par défaut → EXPLICATION
```

**Avantages** :

* Rapide (< 10ms par classification)
* Transparent et explicable
* Pas de dépendance externe

**Limitations** :

* Rigide face aux variations linguistiques
* Nécessite maintenance manuelle des patterns

---

#### 📌 OpenAIXClassifier

**Type** : `llm`

**Description** : Classification via GPT-4o avec prompt optimisé

**Fonctionnement** :

typescript

```typescript
// Prompt système optimisé
const systemPrompt =`Tu es un classificateur ULTRA STRICT de tours de parole CONSEILLER (FR).
Renvoyer exactement un JSON conforme au schéma, avec un seul champ 'label'.

Labels possibles : ENGAGEMENT, OUVERTURE, REFLET_JE, REFLET_VOUS, REFLET_ACQ, EXPLICATION.

Règle de priorité : ENGAGEMENT > OUVERTURE > REFLET > EXPLICATION

Exemples few-shot :
- "je vais vérifier" → {"label": "ENGAGEMENT"}
- "vous allez recevoir" → {"label": "OUVERTURE"}
- "je comprends" → {"label": "REFLET_JE"}
`;

// Sortie structurée forcée (JSON Schema)
response_format:{
  type:"json_schema",
  json_schema:{
    name:"x_label",
    strict:true,
    schema:{
      type:"object",
      properties:{
        label:{ type:"string",enum:LABELS}
}
}
}
}
```

**Avantages** :

* Très performant (accuracy > 85%)
* Capture les nuances linguistiques
* Pas de maintenance de patterns

**Limitations** :

* Coût par appel API (~$0.01 pour 1000 classifications)
* Latence (200-500ms par appel)
* Dépendance externe (OpenAI API)

---

#### 📌 OpenAI3TXClassifier

**Type** : `llm`

**Description** : Classification **contextuelle** utilisant 3 tours (T-2, T-1, T0)

**Différence clé** : Prend en compte le **contexte conversationnel** pour désambiguïser

**Format d'entrée** :

typescript

```typescript
interfaceContextualInput{
  tMinus2?:string;// Tour T-2
  tMinus1?:string;// Tour T-1
  t0:string;// Tour actuel (à classifier)
}
```

**Exemple de désambiguïsation** :

typescript

```typescript
// Sans contexte (OpenAIXClassifier)
Input:"d'accord, je vais vérifier"
→ Hésitation entre REFLET_ACQ et ENGAGEMENT

// Avec contexte (OpenAI3TXClassifier)
T-2:"client: j'ai essayé hier"
T-1:"conseiller: je comprends"
T0:"d'accord, je vais vérifier"
→ ENGAGEMENT(action promise après empathie)
```

**Avantages** :

* Meilleure précision sur cas ambigus (+5-10% accuracy)
* Capture la dynamique conversationnelle

**Limitations** :

* Nécessite contexte disponible (prev1, prev2)
* Latence accrue (~300-700ms)

---

### 2. Classificateurs Y (Réactions client)

#### 📌 RegexYClassifier

**Type** : `rule-based`

**Description** : Classification par dictionnaires pondérés

**Fonctionnement** :

typescript

```typescript
// Dictionnaires avec poids
const dictionnaires ={
CLIENT_POSITIF:{
    expressions:["d'accord","parfait","merci beaucoup"],// poids: 2.0
    mots:["oui","merci","accord","super"],// poids: 1.0
},
CLIENT_NEGATIF:{
    expressions:["pas d'accord","c'est inadmissible"],
    mots:["non","impossible","refuse","contre"],
},
// ... autres catégories
};

// Calcul du score
functioncalculateScore(text, dictionary){
let score =0;
let totalWeight =0;
  
// Expressions (pondération forte)
for(const expr of dictionary.expressions){
if(text.includes(expr)) score +=2.0;
    totalWeight +=2.0;
}
  
// Mots isolés (pondération normale)
for(const mot of dictionary.mots){
const matches = text.match(newRegExp(`\\b${mot}\\b`,'g'));
if(matches) score += matches.length*1.0;
    totalWeight +=1.0;
}
  
return totalWeight >0? score / totalWeight :0;
}

// Sélection finale
if(score_NEGATIF >=0.4) → CLIENT_NEGATIF
elseif(score_POSITIF >=0.6) → CLIENT_POSITIF
else → CLIENT_NEUTRE
```

**Configuration** :

typescript

```typescript
interfaceYConfig{
  seuilPositif:number;// Défaut: 0.6
  seuilNegatif:number;// Défaut: 0.4
  poidsExpressions:number;// Défaut: 2.0
  poidsMots:number;// Défaut: 1.0
}
```

---

### 3. Classificateurs M2 (Alignement)

#### 📌 M2LexicalAlignmentCalculator

**Type** : `rule-based`

**Description** : Alignement basé sur le coefficient de Jaccard

**Formule** :

typescript

```typescript
functionjaccard(setA:Set<string>, setB:Set<string>):number{
const intersection =newSet([...setA].filter(x => setB.has(x)));
const union =newSet([...setA,...setB]);
return intersection.size/ union.size;
}

// Application sur T0 et T1
const tokensT0 =tokenize(input.t0);// Filtre stopwords
const tokensT1 =tokenize(input.t1);
const lexicalScore =jaccard(tokensT0, tokensT1);

// Classification
if(lexicalScore >=0.5) → "ALIGNEMENT_FORT"
elseif(lexicalScore >=0.3) → "ALIGNEMENT_FAIBLE"
else → "DESALIGNEMENT"
```

---

#### 📌 M2SemanticAlignmentCalculator

**Type** : `rule-based`

**Description** : Détection de patterns d'alignement sémantique

**Patterns** :

typescript

```typescript
constPATTERNS={
  acquiescement:/\b(d'accord|oui|parfait|merci)\b/iu,
  reformulation:/\b(vous dites|si je comprends|donc vous)\b/iu,
  clarification:/\b(comment|quand|pourquoi|préciser)\b/iu,
  objection:/\b(mais|cependant|pas d'accord)\b/iu,
};

// Score = proportion de patterns détectés
semanticScore = patternsDetected.length/ totalPatterns;
```

---

#### 📌 M2CompositeAlignmentCalculator

**Type** : `hybrid`

**Description** : Fusion pondérée lexical + sémantique

**Algorithme** :

typescript

```typescript
// 1. Calcul des deux scores
const lexicalResult =await lexicalCalculator.run(input);
const semanticResult =await semanticCalculator.run(input);

// 2. Fusion pondérée
const composite = 
  lexicalScore * config.lexicalWeight+ 
  semanticScore * config.semanticWeight;

// Poids par défaut (à optimiser)
config ={
  lexicalWeight:0.4,
  semanticWeight:0.6,
  threshold:0.5,
  partialThreshold:0.3,
};

// 3. Classification finale
if(composite >=0.5) → "ALIGNEMENT_FORT"
elseif(composite >=0.3) → "ALIGNEMENT_FAIBLE"
else → "DESALIGNEMENT"
```

---

## 🔢 Calculateurs détaillés

### 1. Calculateurs M1 (Densité verbes d'action)

#### 📌 M1ActionVerbCounter

**Type** : `metric`

**Description** : Comptage de verbes d'action avec lemmatisation basique

**Algorithme** :

typescript

```typescript
classM1ActionVerbCounter{
// Dictionnaire de 60+ verbes
private baseActionLemmas =newSet([
"verifier","envoyer","transmettre","traiter", 
"regarder","chercher","noter","ouvrir",// ...
]);
  
asyncrun(input:M1Input){
// 1. Tokenisation
const tokens =this.tokenize(input.verbatim);
  
// 2. Lemmatisation approximative
const lemmas = tokens.map(tok =>this.guessLemma(tok));
  
// 3. Comptage
let actionVerbCount =0;
const verbsFound:string[]=[];
  
for(const lemma of lemmas){
if(this.baseActionLemmas.has(lemma)){
        actionVerbCount++;
        verbsFound.push(lemma);
}
}
  
// 4. Patterns périphrastiques
if(config.includeFutureProche){
      actionVerbCount +=this.detectFutureProche(tokens);
}
  
// 5. Normalisation
const density =(actionVerbCount / tokens.length)* config.perTokens;
  
return{
      prediction: density.toFixed(2),
      confidence:Math.min(1,0.5+ actionVerbCount /10),
      details:{
        value: density,
        actionVerbCount,
        totalTokens: tokens.length,
        verbsFound,
},
};
}
}
```

**Configuration** :

typescript

```typescript
interfaceM1Config{
  perTokens:number;// Défaut: 100
  includeFutureProche:boolean;// Défaut: true
  includePeriphrases:boolean;// Défaut: true
  excludeAuxiliaries:boolean;// Défaut: true
  customVerbs?:string[];// Verbes métier additionnels
}
```

---

#### 📌 RegexM1Calculator

**Type** : `rule-based`

**Description** : Détection par regex + scoring simple

**Avantages** : Plus rapide mais moins précis

**Limitations** : Ne capture pas toutes les variations morphologiques

---

### 2. Calculateurs M3 (Charge cognitive)

#### 📌 PausesM3Calculator

**Type** : `metric`

**Description** : Analyse des pauses et hésitations

**Algorithme** :

typescript

```typescript
asynccalculateCognitiveLoad(input:M3Input){
const text = input.segment;
  
// 1. Détection des marqueurs
const words = text.match(/[^\s]+/g)||[];
const hesitations = text.match(/\b(euh+|heu+|hum+|ben)\b/gi)||[];
const ellipses = text.match(/(\.{3}|…)/g)||[];
const explicitPauses = text.match(/\((pause|silence)\)/gi)||[];
  
// 2. Calcul des ratios
const wordCount = words.length||1;
const hesitationCount = hesitations.length;
const pauseCount = ellipses.length+ explicitPauses.length;
  
const hesitationRate = hesitationCount / wordCount;
const pauseRate =Math.min(1, pauseCount /5);
const lengthPenalty =Math.min(1,Math.max(0,(text.length-140)/400));
  
// 3. Score composite
const cognitiveScore =Math.max(0,Math.min(1,
0.6* hesitationRate + 
0.3* pauseRate + 
0.1* lengthPenalty
));
  
// 4. Construction des marqueurs
const markers =[
...hesitations.map((h, i)=>({
      type:'hesitation',
      timestamp: i,
      confidence:0.8,
      value: h,
})),
...[...ellipses,...explicitPauses].map((p, i)=>({
      type:'pause',
      timestamp: hesitationCount + i,
      confidence:0.9,
      value: p,
})),
];
  
return{
    cognitiveScore,
    pauseCount,
    hesitationCount,
    wordCount,
    speechRate: wordCount /Math.max(1, text.length/100),
    markers,
};
}
```

---

## 🔄 Adaptateur universel

### Rôle

L'**adaptateur universel** (`createUniversalAlgorithm`) unifie l'interface de tous les algorithmes pour que l'UI puisse les consommer de manière homogène.

### Avant / Après

typescript

```typescript
// ❌ AVANT : Interfaces hétérogènes
m1.calculate({ verbatim:"..."})// → CalculationResult<M1Details>
x.classify("...")// → ClassificationResult
m2.run({ t0:"...", t1:"..."})// → M2Result

// ✅ APRÈS : Interface unifiée
universal.run(input)// → UniversalResult (pour tous)
```

### Création d'un algorithme universel

typescript

```typescript
import{ createUniversalAlgorithm }from"@/types/algorithms/universal-adapter";

// Wrapper un calculateur M1
const m1Calculator =newM1ActionVerbCounter();
const universalM1 =createUniversalAlgorithm(m1Calculator,"M1",{
  type:"metric",
  supportsBatch:true,
});

// Wrapper un classificateur X
const xClassifier =newRegexXClassifier();
const universalX =createUniversalAlgorithm(xClassifier,"X",{
  type:"rule-based",
  supportsBatch:true,
});

// Enregistrement dans le registry
algorithmRegistry.register("M1ActionVerbCounter", universalM1);
algorithmRegistry.register("RegexXClassifier", universalX);
```

---

## 📊 Comparaison des approches

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Critère</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Rule-based</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">ML</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">LLM</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Hybrid</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Performance</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⭐⭐⭐ (70-80%)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⭐⭐⭐⭐ (80-85%)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⭐⭐⭐⭐⭐ (85-95%)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⭐⭐⭐⭐ (82-88%)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Vitesse</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚡⚡⚡ (<10ms)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚡⚡ (50-100ms)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚡ (200-700ms)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚡⚡ (100-300ms)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Coût</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">💰 Gratuit</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">💰💰 Entraînement</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">💰💰💰 API calls</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">💰💰 Mixte</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Transparence</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅ Totale</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ Boîte noire</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">❌ Opaque</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ Partielle</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Maintenance</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ Manuelle</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅ Auto via données</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅ Prompt tuning</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ Complexe</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Dépendances</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅ Aucune</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ Modèle local</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">❌ API externe</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ Multiples</td></tr></tbody></table></pre>

---

## 🎯 Choisir le bon algorithme

### Critères de décision

**Utilisez `rule-based` si** :

* Vous avez une expertise linguistique du domaine
* La transparence est critique
* Le budget est limité
* Les patterns sont bien définis

**Utilisez `ml` si** :

* Vous avez un corpus d'entraînement annoté
* Vous voulez généraliser au-delà des patterns
* La latence doit rester faible

**Utilisez `llm` si** :

* La performance maximale est prioritaire
* Le contexte étendu est nécessaire
* Les cas ambigus sont fréquents
* Le coût API est acceptable

**Utilisez `hybrid` si** :

* Vous voulez combiner robustesse et performance
* Plusieurs méthodes sont complémentaires
* Vous avez les ressources pour maintenir la complexité

---

## 📚 Ressources complémentaires

* [Variables](variables.md) - X/Y/M1/M2/M3 expliquées
* [Métriques](metrics.md) - Accuracy, MAE, Kappa, etc.
* [Architecture](../01-ARCHITECTURE/README.md) - Design patterns
* [API Reference](../04-API-REFERENCE/README.md) - Types et interfaces

---

⏱️ **Temps de lecture** : ~15 minutes

🎯 **Prochaine étape** : [Comprendre les métriques](metrics.md)
