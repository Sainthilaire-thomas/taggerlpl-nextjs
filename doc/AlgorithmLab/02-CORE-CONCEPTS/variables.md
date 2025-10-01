# Variables AlgorithmLab

### Hiérarchie de priorité

**Règle fondamentale** : Lorsqu'un tour contient plusieurs fonctions, appliquer la priorité suivante :

```
ENGAGEMENT > OUVERTURE > REFLET_VOUS > REFLET_JE > REFLET_ACQ > EXPLICATION
```

### Description détaillée des labels

#### 🎯 ENGAGEMENT

**Définition** : Le conseiller annonce une action concrète qu'il va réaliser ou est en train de réaliser.

**Marqueurs linguistiques** :

* Verbes d'action à la 1ère personne : `je vais`, `je fais`, `je vérifie`, `je transfère`
* Futur proche 1ère personne : `je vais + infinitif`
* En cours d'action : `je suis en train de`

**Exemples** :

```
✅ "Je vais vérifier votre dossier maintenant"
✅ "Je transfère votre demande au service technique"
✅ "Je suis en train de consulter votre compte"
❌ "Notre système vérifie automatiquement" → EXPLICATION
```

---

#### 🎯 OUVERTURE

**Définition** : Le conseiller oriente le client vers une action à réaliser ou une procédure à suivre.

**Marqueurs linguistiques** :

* Verbes d'action à la 2ème personne : `vous allez`, `vous devez`, `vous pouvez`
* Impératifs : `précisez`, `envoyez`, `cliquez`
* Instructions modales : `veuillez`, `merci de`, `il faut que vous`

**Exemples** :

```
✅ "Vous allez recevoir un email de confirmation"
✅ "Veuillez préciser votre numéro de dossier"
✅ "Il faut que vous rappeliez demain matin"
❌ "Je vous invite à patienter" → ENGAGEMENT si "je" domine
```

---

#### 🎯 REFLET_VOUS

**Définition** : Le conseiller reformule ou décrit une action/état du client  **sans donner d'instruction ni de justification** .

**Marqueurs linguistiques** :

* Description centrée sur le client : `vous avez`, `vous dites`, `je vois que vous`
* Reformulation : `si je comprends bien, vous...`

**Exclusions importantes** :

* ❌ Si contient une **instruction** → OUVERTURE
* ❌ Si contient une **justification** → EXPLICATION
* ❌ Si contient des **données chiffrées** (montants, plusieurs nombres) → EXPLICATION

**Exemples** :

```
✅ "Je vois que vous avez déjà appelé hier"
✅ "Vous dites avoir envoyé le formulaire la semaine dernière"
❌ "Vous avez reçu 1504,29 €" → EXPLICATION (données chiffrées)
❌ "Il faut préciser l'heure et la station" → OUVERTURE (instruction)
```

---

#### 🎯 REFLET_JE

**Définition** : Le conseiller exprime son état mental, sa compréhension ou son écoute  **sans décrire d'action concrète** .

**Marqueurs linguistiques** :

* Verbes de perception : `je comprends`, `je vois`, `j'entends`, `je note`

**Exemples** :

```
✅ "Je comprends votre frustration"
✅ "J'entends bien votre demande"
❌ "Je vais comprendre la situation" → ENGAGEMENT (action future)
```

---

#### 🎯 REFLET_ACQ

**Définition** : Acquiescement phatique court, généralement  **≤ 20 caractères** , sans contenu informatif.

**Marqueurs linguistiques** :

* Tokens minimaux : `oui`, `d'accord`, `ok`, `hum-hum`, `exactement`

**Exclusions** :

* ❌ Si suivi d'une instruction/explication substantielle → prendre la catégorie dominante

**Exemples** :

```
✅ "D'accord"
✅ "Oui, tout à fait"
✅ "Mm-hmm"
❌ "D'accord, donc il faut que vous..." → OUVERTURE (instruction domine)
```

---

#### 🎯 EXPLICATION

**Définition** : Le conseiller justifie, explique une procédure ou décrit le fonctionnement institutionnel  **sans action concrète immédiate** .

**Marqueurs linguistiques** :

* Justifications : `parce que`, `car`, `c'est pour ça que`
* Procédures : `notre politique`, `le système fonctionne`, `la procédure impose`
* Corrections normatives : `c'est normal`, `c'est faux`

**Exemples** :

```
✅ "Notre système fonctionne en trois étapes distinctes"
✅ "La procédure impose un contrôle préalable"
✅ "C'est normal, le délai est de 48 heures"
❌ "Je vérifie car la procédure impose..." → ENGAGEMENT (action prime)
```

---

### Structure de données X

typescript

```typescript
interfaceXDetails{
  family:string;// "REFLET" | "ENGAGEMENT" | "OUVERTURE" | "EXPLICATION"
  
// Évidences linguistiques
  evidences?:string[];// Marqueurs détectés
  matchedPatterns?:string[];// Patterns regex matchés
  
// Métriques enrichies (optionnelles)
  verbCount?:number;
  actionVerbs?:string[];
  pronounUsage?:{
    je:number;
    vous:number;
    nous:number;
};
  
// Confiance et probabilités
  confidence?:number;// Score de confiance [0-1]
  topProbs?:Array<{
    label:string;
    prob:number;
}>;
}
```

---

## 📗 Variable Y : Réactions du client

### Définition

**Y** capture la réaction du client suite à un tour de parole du conseiller. Elle mesure l'alignement émotionnel et pragmatique.

### Labels possibles

typescript

```typescript
typeYTag= 
|"CLIENT_POSITIF"// Accord, coopération, remerciements
|"CLIENT_NEGATIF"// Désaccord, objection, frustration
|"CLIENT_NEUTRE"// Réponse factuelle sans émotion
|"CLIENT_QUESTION"// Demande de clarification
|"CLIENT_SILENCE"// Pause, hésitation, silence
|"AUTRE_Y"// Cas non classifiables
```

### Description des labels

#### ✅ CLIENT_POSITIF

**Marqueurs** : `d'accord`, `merci`, `parfait`, `très bien`, `super`, `ok`

**Exemples** :

```
"D'accord, merci beaucoup"
"Parfait, je comprends"
"Oui, c'est très bien"
```

---

#### ❌ CLIENT_NEGATIF

**Marqueurs** : `non`, `pas d'accord`, `impossible`, `c'est inadmissible`, `je refuse`

**Exemples** :

```
"Non, ce n'est pas possible"
"C'est inadmissible !"
"Je ne suis pas d'accord"
```

---

#### ⚪ CLIENT_NEUTRE

**Marqueurs** : Réactions factuelles sans charge émotionnelle, demandes de précision

**Exemples** :

```
"Combien de temps ça prend ?"
"Je note l'information"
"D'accord, je vais réfléchir"
```

---

#### ❓ CLIENT_QUESTION

**Marqueurs** : `comment`, `pourquoi`, `quand`, `où`, `qu'est-ce que`

**Exemples** :

```
"Comment ça fonctionne ?"
"Pourquoi ce délai ?"
"Qu'est-ce que je dois faire ?"
```

---

#### 🔇 CLIENT_SILENCE

**Marqueurs** : `...`, `(silence)`, `euh...`, `heu...`, `hmm`

**Exemples** :

```
"..."
"Euh... ben..."
"(pause)"
```

---

### Structure de données Y

typescript

```typescript
interfaceYDetails{
  family:string;// "CLIENT"
  
// Évidences linguistiques
  evidences?:string[];
  cues?:string[];// Indices émotionnels
  
// Analyse sentiment (optionnelle)
  sentiment?:"POSITIVE"|"NEGATIVE"|"NEUTRAL";
  emotionalIntensity?:number;// [0-1]
  
// Scores par label (pour RegexYClassifier)
  scores?:Record<YTag,number>;
  
// Confiance
  confidence?:number;
  topProbs?:Array<{
    label:string;
    prob:number;
}>;
}
```

---

## 📙 Variable M1 : Densité de verbes d'action

### Définition

**M1** mesure la densité de verbes d'action dans le tour de parole du conseiller. Cette métrique reflète l'orientation vers l'action concrète vs l'abstraction.

### Formule

```
density = (actionVerbCount / totalTokens) * 100
```

**Exemple** :

* Input : `"je vais vérifier votre dossier et traiter votre demande"`
* Tokens : 8
* Verbes d'action : 2 (`vérifier`, `traiter`)
* **Densité : 25.00**

### Verbes d'action détectés

**Dictionnaire de base** (60+ verbes) :

```
vérifier, envoyer, transmettre, traiter, regarder, chercher, noter, 
ouvrir, fermer, mettre, donner, prendre, appeler, rappeler, relancer,
contacter, activer, bloquer, débloquer, modifier, valider, annuler,
signaler, déposer, déclencher, renvoyer, rembourser, commander, etc.
```

**Patterns périphrastiques détectés** :

* Futur proche : `je vais + infinitif`
* Périphrases : `en train de + infinitif`

### Structure de données M1

typescript

```typescript
interfaceM1Details{
// Propriétés de base
  value:number;// Score de densité
  actionVerbCount:number;// Nombre de verbes d'action
  totalTokens:number;// Nombre total de tokens
  verbsFound:string[];// Liste des verbes détectés
  
// Métriques enrichies (optionnelles)
  score?:number;// Score normalisé
  verbCount?:number;
  averageWordLength?:number;
  sentenceComplexity?:number;
  lexicalDiversity?:number;// Richesse lexicale
  syntacticComplexity?:number;
  semanticCoherence?:number;
}
```

### Configuration de calcul

typescript

```typescript
interfaceM1Config{
  perTokens:number;// Normalisation (ex: 100 tokens)
  includeFutureProche:boolean;// Inclure "aller + infinitif"
  includePeriphrases:boolean;// Inclure "en train de"
  excludeAuxiliaries:boolean;// Exclure être/avoir/pouvoir
  customVerbs?:string[];// Verbes métier additionnels
}
```

---

## 📒 Variable M2 : Alignement interactionnel

### Définition

**M2** mesure l'alignement linguistique entre le tour du conseiller (T0) et la réaction du client (T1). Cette variable capture la coordination conversationnelle.

### Labels possibles

typescript

```typescript
typeM2Label= 
|"ALIGNEMENT_FORT"// Score ≥ 0.5
|"ALIGNEMENT_FAIBLE"// 0.3 ≤ Score < 0.5
|"DESALIGNEMENT"// Score < 0.3
```

### Méthodes de calcul

#### 1️⃣ Alignement Lexical (Jaccard)

**Formule** :

```
jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

Où A et B sont les ensembles de tokens filtrés (stopwords exclus) de T0 et T1.

**Exemple** :

```
T0: "je vais vérifier votre dossier"
T1: "d'accord pour la vérification"

Tokens T0: {vérifier, dossier}
Tokens T1: {vérifier, accord}
Intersection: {vérifier}
Union: {vérifier, dossier, accord}

Score lexical = 1/3 ≈ 0.33
```

---

#### 2️⃣ Alignement Sémantique (Patterns)

**Patterns détectés** :

typescript

```typescript
constPATTERNS={
  acquiescement:/\b(d'accord|oui|parfait|merci)\b/i,
  reformulation:/\b(vous dites|si je comprends|donc vous)\b/i,
  clarification:/\b(comment|quand|pourquoi|préciser)\b/i,
  objection:/\b(mais|cependant|pas d'accord)\b/i,
}
```

**Score** : Proportion de patterns détectés dans T1

---

#### 3️⃣ Alignement Composite (Fusion)

**Formule** :

```
composite = lexical × w_lex + semantic × w_sem
```

**Poids par défaut** (à optimiser via AlgorithmLab) :

* `w_lex = 0.4` (lexical)
* `w_sem = 0.6` (sémantique)

---

### Structure de données M2

typescript

```typescript
interfaceM2Details{
  value:string|number;// "ALIGNEMENT_FORT" ou score numérique
  scale:string;// "lexical" | "semantic" | "composite"
  
// Scores détaillés
  lexicalAlignment?:number;// Score Jaccard [0-1]
  semanticAlignment?:number;// Score patterns [0-1]
  overall?:number;// Score composite [0-1]
  
// Évidences
  sharedTerms?:string[];// Termes partagés T0→T1
  
// Métriques de distance (optionnelles)
  distanceMetrics?:{
    euclidean:number;
    cosine:number;
    jaccard:number;
};
}
```

### Configuration de calcul

typescript

```typescript
interfaceM2Config{
  lexicalWeight:number;// Poids lexical (ex: 0.4)
  semanticWeight:number;// Poids sémantique (ex: 0.6)
  threshold:number;// Seuil FORT (ex: 0.5)
  partialThreshold:number;// Seuil FAIBLE (ex: 0.3)
}
```

---

## 📕 Variable M3 : Charge cognitive

### Définition

**M3** mesure la charge cognitive du client via l'analyse des pauses, hésitations et marqueurs de disfluence dans son discours.

### Formule composite

```
cognitiveScore = 0.6 × hesitationRate + 0.3 × pauseRate + 0.1 × lengthPenalty
```

Où :

* `hesitationRate = hesitationCount / wordCount`
* `pauseRate = min(1, pauseCount / 5)`
* `lengthPenalty = min(1, max(0, (textLength - 140) / 400))`

**Intervalle** : Score normalisé entre 0 (charge faible) et 1 (charge élevée)

### Marqueurs détectés

#### Hésitations

regex

```regex
/\b(euh+|heu+|hum+|mmm+|hem+|ben|bah|hein)\b/gi
```

#### Pauses

regex

```regex
/(\.{3}|…)/g           # Ellipses
/\((pause|silence)\)/gi # Pauses explicites
```

### Structure de données M3

typescript

```typescript
interfaceM3Details{
  value:number;// Score cognitif [0-1]
  unit:"score"|"ms"|"s";
  
// Compteurs
  pauseCount:number;// Nombre de pauses
  hesitationCount:number;// Nombre d'hésitations
  speechRate?:number;// Débit de parole (mots/s)
  
// Métriques enrichies (optionnelles)
  fluidity?:number;
  cognitiveLoad?:number;
  processingEfficiency?:number;
  attentionalFocus?:number;
  workingMemoryUsage?:number;
  
// Marqueurs détaillés
  markers?:Array<{
    type:"hesitation"|"pause";
    timestamp:number;
    confidence:number;
    value?:string;// Texte du marqueur
}>;
}
```

### Exemple de calcul

**Input** :

```
"euh... je pense que... hum... c'est compliqué"
```

**Analyse** :

* Mots : 6 (`je`, `pense`, `que`, `c'est`, `compliqué`)
* Hésitations : 3 (`euh`, `hum`)
* Pauses : 2 (`...`)
* `hesitationRate = 3/6 = 0.5`
* `pauseRate = min(1, 2/5) = 0.4`
* `lengthPenalty ≈ 0`

**Score cognitif** :

```
0.6 × 0.5 + 0.3 × 0.4 + 0.1 × 0 = 0.42
```

---

## 🔗 Relations entre variables

### Hypothèses théoriques

1. **X → Y** : Les stratégies du conseiller influencent les réactions du client
   * `ENGAGEMENT` → probabilité accrue de `CLIENT_POSITIF`
   * `EXPLICATION` → risque accru de `CLIENT_NEGATIF`
2. **X → M1** : Lien entre type de stratégie et densité d'action
   * `ENGAGEMENT` corrélé avec M1 élevé
   * `EXPLICATION` corrélé avec M1 faible
3. **M2 médiateur** : L'alignement modère la relation X → Y
   * Fort M2 amplifie l'effet positif d'ENGAGEMENT
   * Faible M2 atténue l'efficacité des stratégies
4. **M3 indicateur** : La charge cognitive prédit la satisfaction
   * M3 faible → meilleure compréhension → réaction positive
   * M3 élevé → confusion → désengagement

---

## 📊 Tableau récapitulatif

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Variable</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Type</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Entrée</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Sortie</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Algorithmes disponibles</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>X</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Classification</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">verbatim: string</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">XTag</code> + <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">XDetails</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">RegexX, OpenAIX, OpenAI3TX, SpacyX</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Y</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Classification</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">verbatim: string</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">YTag</code> + <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">YDetails</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">RegexY</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>M1</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Numérique</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">verbatim: string</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">density: number</code> + <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">M1Details</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">M1ActionVerbCounter, RegexM1</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>M2</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Mixte</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">{t0, t1}</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">M2Label</code> + <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">score</code> + <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">M2Details</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">M2Lexical, M2Semantic, M2Composite</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>M3</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Numérique</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">segment: string</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">cognitiveScore: number</code> + <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">M3Details</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">PausesM3Calculator</td></tr></tbody></table></pre>

---

## 🎯 Utilisation dans AlgorithmLab

### Exemple de test d'un algorithme M1

typescript

```typescript
import{M1ActionVerbCounter}from"@/algorithms/level1/M1Algorithms";

const calculator =newM1ActionVerbCounter();

const result =await calculator.run({
  verbatim:"je vais vérifier votre dossier et traiter votre demande"
});

console.log(result);
// {
//   prediction: "25.00",
//   confidence: 0.7,
//   metadata: {
//     density: 25.0,
//     actionVerbCount: 2,
//     totalTokens: 8,
//     verbsFound: ["verifier", "traiter"]
//   }
// }
```

---

## 📚 Ressources complémentaires

* [Algorithmes](algorithms.md) - Classification vs Calcul
* [Métriques](metrics.md) - Accuracy, MAE, Kappa, etc.
* [Niveaux de validation](validation-levels.md) - Level 0/1/2
* [Architecture](../01-ARCHITECTURE/README.md) - Vue d'ensemble technique

---

⏱️ **Temps de lecture** : ~20 minutes

🎯 **Prochaine étape** : [Comprendre les algorithmes](algorithms.md)
