# 📊 Flux de Données Level 0 - Test Charte sur N Paires

## 🎯 Vue d'Ensemble

Ce document décrit le parcours complet des données depuis le clic sur "Lancer le test" jusqu'à l'affichage des résultats et la sauvegarde en base de données.

---

## 🚀 Déclenchement : Clic Utilisateur

### Étape 0 : Configuration Initiale

**Interface** : `Level0Interface.tsx`

**État avant clic** :
```typescript
{
  variable: "Y",                    // Variable à tester (X ou Y)
  selectedChartes: ["CharteY_B_v1.0.0"],  // 1 charte sélectionnée
  sampleSize: 50,                   // Nombre de paires
  availableChartes: [...]           // Chartes chargées depuis DB
}
```

**Action utilisateur** : Clic sur bouton "Lancer le test"

---

## 📋 Phase 1 : Chargement Données (READ)

### 1.1 Charger la Charte

**Service** : `CharteManagementService.getCharteById()`

**Table Supabase** : `level0_chartes`

**Requête SQL** :
```sql
SELECT 
  charte_id,
  charte_name,
  philosophy,
  version,
  variable,
  definition,
  prompt_template,
  prompt_params,
  is_baseline
FROM level0_chartes
WHERE charte_id = 'CharteY_B_v1.0.0';
```

**Données récupérées** :
```json
{
  "charte_id": "CharteY_B_v1.0.0",
  "charte_name": "Charte B - Enrichie",
  "philosophy": "Enrichie",
  "version": "1.0.0",
  "variable": "Y",
  "definition": {
    "categories": {
      "CLIENT_POSITIF": {...},
      "CLIENT_NEGATIF": {...},
      "CLIENT_NEUTRE": {...}
    }
  },
  "prompt_template": "Classifiez la réaction...",
  "prompt_params": {
    "model": "gpt-4o-mini",
    "temperature": 0.0
  }
}
```

**Cache** : Résultat mis en cache 5 minutes dans `CharteRegistry`

---

### 1.2 Charger les Paires à Annoter

**Service** : `MultiCharteAnnotator.selectRandomPairs()`

**Table Supabase** : `analysis_pairs`

**Requête SQL** :
```sql
SELECT 
  pair_id,
  call_id,
  client_turn_id,
  conseiller_turn_id,
  client_verbatim,
  conseiller_verbatim,
  prev1_verbatim,
  prev2_verbatim,
  next1_verbatim,
  next2_verbatim,
  reaction_tag,           -- Tag manuel (Thomas)
  strategy_tag
FROM analysis_pairs
WHERE reaction_tag IS NOT NULL  -- Uniquement paires déjà annotées
ORDER BY RANDOM()
LIMIT 50;
```

**Données récupérées** : Array de 50 paires

**Exemple paire** :
```json
{
  "pair_id": 3187,
  "client_verbatim": "[AP] un problème... mais nous...",
  "conseiller_verbatim": "[TC] non mais il suffit...",
  "prev1_verbatim": "[AP] elle est passée où la clé ?",
  "reaction_tag": "CLIENT_NEGATIF",  // Gold standard Thomas
  "strategy_tag": "EXPLICATION"
}
```

---

## 🤖 Phase 2 : Annotation LLM (PROCESS)

### 2.1 Boucle sur Chaque Paire

**Service** : `MultiCharteAnnotator.annotateWithCharte()`

Pour chaque paire (50 itérations) :

#### 2.1.1 Construction du Prompt

**Données combinées** :
```typescript
const prompt = charte.prompt_template
  .replace('{{client_verbatim}}', pair.client_verbatim)
  .replace('{{prev1_verbatim}}', pair.prev1_verbatim || '')
  .replace('{{next1_verbatim}}', pair.next1_verbatim || '');
```

**Prompt généré** (exemple) :
```
Classifiez la réaction du client en 3 catégories : CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE.

RÈGLES PRIORITAIRES :
1. Si accord explicite (oui, d'accord, voilà) → CLIENT_POSITIF
2. Si désaccord explicite (non, mais, pas normal) → CLIENT_NEGATIF
3. Si back-channel minimal uniquement (hm, mh) → CLIENT_NEUTRE

Tour précédent : [AP] elle est passée où la clé ?
Tour client : [AP] un problème... mais nous on n'a jamais changé de clé...
Tour suivant : [TC] oui je comprends...

Répondez uniquement avec la catégorie.
```

---

#### 2.1.2 Appel API OpenAI

**Service** : `OpenAIAnnotationService.annotate()`

**API externe** : OpenAI API

**Paramètres** :
```typescript
{
  model: "gpt-4o-mini",
  temperature: 0.0,
  max_tokens: 50,
  messages: [
    { role: "system", content: "Vous êtes un annotateur expert..." },
    { role: "user", content: prompt }
  ]
}
```

**Réponse OpenAI** :
```json
{
  "choices": [{
    "message": {
      "content": "CLIENT_NEGATIF"
    }
  }],
  "usage": {
    "prompt_tokens": 245,
    "completion_tokens": 3,
    "total_tokens": 248
  }
}
```

**Temps moyen** : ~1-2 secondes par appel

---

#### 2.1.3 Parsing & Validation

**Extraction tag** :
```typescript
const llmTag = response.choices[0].message.content.trim();
// Résultat : "CLIENT_NEGATIF"
```

**Validation** :
```typescript
const validTags = ["CLIENT_POSITIF", "CLIENT_NEGATIF", "CLIENT_NEUTRE"];
if (!validTags.includes(llmTag)) {
  throw new Error("Invalid tag");
}
```

**Normalisation** :
```typescript
// Si charte binaire et tag = CLIENT_NEGATIF ou CLIENT_NEUTRE
if (charte.philosophy === "Binaire") {
  if (["CLIENT_NEGATIF", "CLIENT_NEUTRE"].includes(llmTag)) {
    llmTag = "CLIENT_NON_POSITIF";
  }
}
```

---

### 2.2 Sauvegarde Annotation LLM

**Service** : `AnnotationService.saveAnnotation()`

**Table Supabase** : `annotations`

**Requête SQL (UPSERT)** :
```sql
INSERT INTO annotations (
  annotation_id,
  pair_id,
  annotator_type,
  annotator_id,
  reaction_tag,
  confidence,
  reasoning,
  annotation_context,
  annotated_at,
  test_id
) VALUES (
  '7a8b9c0d-...',           -- UUID généré
  3187,                     -- ID de la paire
  'llm_openai',             -- Type annotateur
  'CharteY_B_v1.0.0',       -- ID charte utilisée
  'CLIENT_NEGATIF',         -- Tag LLM
  0.95,                     -- Confiance (si fournie)
  'Le client exprime...',   -- Raisonnement
  '{"model": "gpt-4o-mini", "temperature": 0.0}',  -- Contexte
  NOW(),                    -- Timestamp
  NULL                      -- test_id rempli après
)
ON CONFLICT (pair_id, annotator_type, annotator_id)
DO UPDATE SET
  reaction_tag = EXCLUDED.reaction_tag,
  confidence = EXCLUDED.confidence,
  reasoning = EXCLUDED.reasoning,
  annotated_at = EXCLUDED.annotated_at;
```

**Contrainte unicité** : `(pair_id, annotator_type, annotator_id)`
→ Une seule annotation LLM par charte par paire

**Données sauvegardées** : 50 annotations (1 par paire)

---

## 📊 Phase 3 : Calcul Métriques (COMPUTE)

### 3.1 Comparaison Tags

**Service** : `KappaCalculationService.calculateKappa()`

**Données en mémoire** :
```typescript
const pairs = [
  {
    pair_id: 3187,
    manual_tag: "CLIENT_NEGATIF",   // De analysis_pairs
    llm_tag: "CLIENT_NEGATIF",       // De OpenAI
    agreed: true
  },
  {
    pair_id: 3648,
    manual_tag: "CLIENT_POSITIF",
    llm_tag: "CLIENT_POSITIF",
    agreed: true
  },
  // ... 48 autres paires
];
```

---

### 3.2 Matrice de Confusion

**Calcul** :
```typescript
const confusionMatrix = {
  CLIENT_POSITIF: {
    CLIENT_POSITIF: 20,  // Accords
    CLIENT_NEGATIF: 2,   // Désaccords
    CLIENT_NEUTRE: 1
  },
  CLIENT_NEGATIF: {
    CLIENT_POSITIF: 1,
    CLIENT_NEGATIF: 18,
    CLIENT_NEUTRE: 0
  },
  CLIENT_NEUTRE: {
    CLIENT_POSITIF: 0,
    CLIENT_NEGATIF: 1,
    CLIENT_NEUTRE: 7
  }
};
```

---

### 3.3 Cohen's Kappa

**Formule** :
```
κ = (Po - Pe) / (1 - Pe)

Où :
- Po = Proportion d'accords observés = 45/50 = 0.90
- Pe = Proportion d'accords attendus par hasard
```

**Calcul Pe** :
```typescript
const manualDist = {
  CLIENT_POSITIF: 23/50 = 0.46,
  CLIENT_NEGATIF: 19/50 = 0.38,
  CLIENT_NEUTRE: 8/50 = 0.16
};

const llmDist = {
  CLIENT_POSITIF: 21/50 = 0.42,
  CLIENT_NEGATIF: 21/50 = 0.42,
  CLIENT_NEUTRE: 8/50 = 0.16
};

Pe = (0.46 × 0.42) + (0.38 × 0.42) + (0.16 × 0.16) = 0.38
```

**Résultat final** :
```
κ = (0.90 - 0.38) / (1 - 0.38) = 0.52 / 0.62 = 0.839
```

---

### 3.4 Accuracy & Désaccords

**Accuracy** :
```typescript
const agreements = pairs.filter(p => p.agreed).length;
const accuracy = agreements / pairs.length;
// Résultat : 45/50 = 0.90 (90%)
```

**Désaccords détaillés** :
```typescript
const disagreements = pairs
  .filter(p => !p.agreed)
  .map(p => ({
    pair_id: p.pair_id,
    manual_tag: p.manual_tag,
    llm_tag: p.llm_tag,
    verbatim: p.client_verbatim,
    confidence: p.confidence,
    reasoning: p.reasoning
  }));
// Résultat : Array de 5 désaccords
```

---

## 💾 Phase 4 : Sauvegarde Résultats (WRITE)

### 4.1 Sauvegarder Test Global

**Service** : `SupabaseLevel0Service.saveCharteTestResult()`

**Table Supabase** : `level0_charte_tests`

**Étape 4.1.1 : Charger métadonnées charte** :
```typescript
const charte = await CharteManagementService.getCharteById('CharteY_B_v1.0.0');
// Récupère philosophy et version
```

**Étape 4.1.2 : INSERT test** :
```sql
INSERT INTO level0_charte_tests (
  test_id,
  charte_id,
  variable,
  philosophy,              -- 🆕 Sprint 3
  version,                 -- 🆕 Sprint 3
  kappa,
  accuracy,
  total_pairs,
  disagreements_count,
  disagreements,           -- 🆕 Sprint 3 (JSONB)
  metrics,
  execution_time_ms,
  openai_model,
  tested_at
) VALUES (
  'eaa4cbe0-effb-4012-bcf4-a4d57ba347d8',  -- UUID généré
  'CharteY_B_v1.0.0',
  'Y',
  'Enrichie',             -- De level0_chartes
  '1.0.0',                -- De level0_chartes
  0.839,
  0.90,
  50,
  5,
  '[{"pair_id": 3187, ...}]',  -- Array JSON désaccords
  '{"confusion_matrix": {...}}',
  127450,                 -- Temps d'exécution en ms
  'gpt-4o-mini',
  NOW()
);
```

**Données sauvegardées** : 1 ligne (résumé test complet)

---

### 4.2 Lier Annotations au Test

**Service** : `AnnotationService.updateTestId()`

**Table Supabase** : `annotations`

**Requête SQL (UPDATE)** :
```sql
UPDATE annotations
SET test_id = 'eaa4cbe0-effb-4012-bcf4-a4d57ba347d8'
WHERE pair_id IN (3187, 3648, ..., 8765)  -- Les 50 paires
  AND annotator_type = 'llm_openai'
  AND annotator_id = 'CharteY_B_v1.0.0'
  AND test_id IS NULL;
```

**Lignes modifiées** : 50 annotations

**Résultat** : Les annotations sont maintenant liées au test

---

## 🎨 Phase 5 : Affichage Résultats (DISPLAY)

### 5.1 Données Retournées au Frontend

**Hook** : `useLevel0Testing.ts`

**Objet résultat** :
```typescript
const testResult: CharteTestResult = {
  test_id: "eaa4cbe0-effb-4012-bcf4-a4d57ba347d8",
  charte_id: "CharteY_B_v1.0.0",
  charte_name: "Charte B - Enrichie",
  variable: "Y",
  kappa: 0.839,
  accuracy: 0.90,
  total_pairs: 50,
  disagreements_count: 5,
  disagreements: [
    {
      pair_id: 3187,
      manual_tag: "CLIENT_NEGATIF",
      llm_tag: "CLIENT_NON_POSITIF",
      verbatim: "[AP] un problème...",
      confidence: 0.90,
      reasoning: "Le client exprime une incertitude..."
    },
    // ... 4 autres désaccords
  ],
  metrics: {
    confusion_matrix: {...},
    per_category_stats: {...}
  },
  execution_time_ms: 127450,
  openai_model: "gpt-4o-mini",
  tested_at: "2025-12-17T15:59:28Z"
};
```

---

### 5.2 Composants UI Mis à Jour

**Composant** : `Level0Interface.tsx`

**Sections affichées** :

#### A. Résumé Global
```tsx
<Box>
  <Typography>Kappa (κ) : 0.839</Typography>
  <Typography>Accuracy : 90%</Typography>
  <Typography>Désaccords : 5 / 50</Typography>
  <Chip label="Excellent" color="success" />
</Box>
```

#### B. Tableau Comparatif
```tsx
<TableRow>
  <TableCell>Charte B - Enrichie</TableCell>
  <TableCell>0.839</TableCell>
  <TableCell>90%</TableCell>
  <TableCell>5 / 50</TableCell>
  <TableCell>127.4s</TableCell>
</TableRow>
```

#### C. Panel Désaccords
```tsx
<DisagreementsPanel disagreements={result.disagreements} />
```

**Composant** : `DisagreementsPanel.tsx`

Pour chaque désaccord :
```tsx
<Accordion>
  <AccordionSummary>
    Pair #3187 - Manuel: CLIENT_NEGATIF | LLM: CLIENT_NON_POSITIF (90%)
  </AccordionSummary>
  <AccordionDetails>
    <Typography>Verbatim : [AP] un problème...</Typography>
    <Typography>Raisonnement : Le client exprime...</Typography>
    <Button>Valider désaccord</Button> {/* Sprint 4 */}
  </AccordionDetails>
</Accordion>
```

---

## 📊 Schéma Flux Complet

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1 : CHARGEMENT (READ)                  │
└─────────────────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 1.1 CharteManagementService.getCharteById()         │
    │     → SELECT FROM level0_chartes                     │
    │     → Récupère philosophy, version, prompt          │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 1.2 MultiCharteAnnotator.selectRandomPairs()        │
    │     → SELECT FROM analysis_pairs                     │
    │     → 50 paires RANDOM avec tags manuels            │
    └──────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 2 : ANNOTATION (PROCESS)                │
└─────────────────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ BOUCLE sur 50 paires (itérations)                    │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 2.1 Construction prompt (template + verbatim)        │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 2.2 OpenAIAnnotationService.annotate()              │
    │     → POST https://api.openai.com/v1/chat/...       │
    │     → Reçoit tag LLM + raisonnement                  │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 2.3 AnnotationService.saveAnnotation()              │
    │     → UPSERT INTO annotations                        │
    │     → 1 annotation par paire                         │
    └──────────────────────────────────────────────────────┘
                                ↓
               [Répéter 50 fois - Total ~90-120s]
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 3 : CALCUL MÉTRIQUES (COMPUTE)           │
└─────────────────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 3.1 Comparaison tags (manuel vs LLM)                │
    │     → Identifier accords/désaccords                  │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 3.2 KappaCalculationService.calculateKappa()        │
    │     → Matrice de confusion                           │
    │     → Cohen's Kappa (κ)                              │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 3.3 Calcul accuracy & extraction désaccords         │
    └──────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│               PHASE 4 : SAUVEGARDE RÉSULTATS (WRITE)            │
└─────────────────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 4.1 CharteManagementService.getCharteById()         │
    │     → Récupère philosophy + version                  │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 4.2 SupabaseLevel0Service.saveCharteTestResult()    │
    │     → INSERT INTO level0_charte_tests                │
    │     → Sauvegarde κ, accuracy, philosophy, version    │
    └──────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ 4.3 AnnotationService.updateTestId()                │
    │     → UPDATE annotations SET test_id = ...           │
    │     → Lie 50 annotations au test                     │
    └──────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 5 : AFFICHAGE (DISPLAY)                  │
└─────────────────────────────────────────────────────────────────┘
                                ↓
    ┌──────────────────────────────────────────────────────┐
    │ UI : Level0Interface.tsx                             │
    │   → Tableau résultats                                │
    │   → Métriques (κ, accuracy)                          │
    │   → Panel désaccords                                 │
    └──────────────────────────────────────────────────────┘
```

---

## 🗄️ Tables Supabase Impliquées

### Table 1 : `level0_chartes` (READ)

**Rôle** : Stocker les définitions de chartes

**Colonnes utilisées** :
- `charte_id` : Identifiant unique
- `philosophy` : Approche conceptuelle
- `version` : Version sémantique
- `prompt_template` : Template pour LLM
- `prompt_params` : Paramètres OpenAI
- `definition` : Définitions catégories

**Lectures** : 1 fois (début test)

**Écritures** : 0 (lecture seule)

---

### Table 2 : `analysis_pairs` (READ)

**Rôle** : Stocker les paires conseiller-client avec tags manuels

**Colonnes utilisées** :
- `pair_id` : Identifiant unique
- `client_verbatim` : Texte client
- `conseiller_verbatim` : Texte conseiller
- `prev1_verbatim`, `prev2_verbatim` : Contexte avant
- `next1_verbatim`, `next2_verbatim` : Contexte après
- `reaction_tag` : Tag manuel (gold standard Thomas)
- `strategy_tag` : Stratégie conseiller

**Lectures** : 1 fois (sélection 50 paires aléatoires)

**Écritures** : 0 (lecture seule)

---

### Table 3 : `annotations` (WRITE)

**Rôle** : Stocker toutes les annotations (humaines et LLM)

**Colonnes utilisées** :
- `annotation_id` : UUID unique
- `pair_id` : FK vers analysis_pairs
- `annotator_type` : 'llm_openai' ou 'human_manual'
- `annotator_id` : Identifiant annotateur (charte_id pour LLM)
- `reaction_tag` : Tag annoté
- `confidence` : Confiance LLM (0-1)
- `reasoning` : Raisonnement LLM
- `annotation_context` : Métadonnées (model, temperature...)
- `annotated_at` : Timestamp
- `test_id` : FK vers level0_charte_tests

**Lectures** : 0

**Écritures** : 
- 50 UPSERT (1 par paire) → Phase 2
- 50 UPDATE (test_id) → Phase 4

**Total opérations** : 100 écritures

---

### Table 4 : `level0_charte_tests` (WRITE)

**Rôle** : Stocker les résultats des tests complets

**Colonnes utilisées** :
- `test_id` : UUID unique
- `charte_id` : FK vers level0_chartes
- `variable` : 'X' ou 'Y'
- `philosophy` : Copie depuis level0_chartes
- `version` : Copie depuis level0_chartes
- `kappa` : Cohen's Kappa calculé
- `accuracy` : Taux d'accord
- `total_pairs` : Nombre paires testées
- `disagreements_count` : Nombre désaccords
- `disagreements` : Array JSONB désaccords détaillés
- `metrics` : JSONB métriques complètes
- `execution_time_ms` : Durée exécution
- `openai_model` : Modèle utilisé
- `tested_at` : Timestamp

**Lectures** : 0

**Écritures** : 1 INSERT (fin test)

---

## 📈 Statistiques Opérations

### Opérations Base de Données

**Phase 1 (Chargement)** :
- 1 SELECT → level0_chartes
- 1 SELECT → analysis_pairs (LIMIT 50)

**Phase 2 (Annotation)** :
- 50 UPSERT → annotations

**Phase 4 (Sauvegarde)** :
- 1 SELECT → level0_chartes (métadonnées)
- 1 INSERT → level0_charte_tests
- 1 UPDATE → annotations (50 lignes, test_id)

**Total DB operations** : 55 requêtes

---

### Appels API Externes

**OpenAI API** :
- 50 appels POST → /v1/chat/completions
- Temps moyen : 1.5-2.0 secondes par appel
- Tokens moyen : 250 tokens/appel
- Total tokens : ~12,500 tokens
- Coût : ~$0.05-0.10 (selon modèle)

---

### Temps d'Exécution

**Décomposition** :
- Phase 1 (Chargement) : ~1s
- Phase 2 (50 annotations) : ~90-120s (parallélisable)
- Phase 3 (Calcul métriques) : ~0.5s
- Phase 4 (Sauvegarde) : ~1s
- Phase 5 (Affichage) : Instantané

**Total** : ~95-125 secondes (~2 minutes)

---

## 🔄 Relations Tables

```
level0_chartes (5 lignes)
    ↓ (READ charte_id)
    ├──→ level0_charte_tests (1 nouveau test)
    │        ↓ (FK test_id)
    │        └──→ annotations (50 annotations liées)
    │
    └──→ annotations (50 nouvelles annotations)
            ↓ (FK pair_id)
            └──→ analysis_pairs (50 paires existantes)
```

**Hiérarchie** :
```
1. level0_chartes (configuration)
2. analysis_pairs (données brutes)
3. annotations (annotations individuelles)
4. level0_charte_tests (résultats agrégés)
```

---

## 🎯 Points Clés Architecture

### 1. Séparation Concerns

**Tables sources (OLTP)** :
- `level0_chartes` : Configuration
- `analysis_pairs` : Données brutes

**Tables analytiques (OLAP)** :
- `annotations` : Événements atomiques
- `level0_charte_tests` : Agrégations

---

### 2. Traçabilité Complète

**Chaque annotation tracée** :
- `annotator_type` : Qui (human vs LLM)
- `annotator_id` : Quelle charte/personne
- `annotated_at` : Quand
- `test_id` : Dans quel test
- `annotation_context` : Comment (modèle, params)

**Chaque test tracé** :
- `philosophy` : Approche conceptuelle
- `version` : Version charte
- `disagreements` : Désaccords détaillés
- `metrics` : Métriques complètes

---

### 3. Architecture Async

**Parallélisation possible** :
```typescript
// Séquentiel (actuel) : 90-120s
for (const pair of pairs) {
  await annotate(pair);
}

// Parallèle (futur) : 20-30s
await Promise.all(
  pairs.map(pair => annotate(pair))
);
```

**Limitation** : Rate limit OpenAI (3500 RPM)

---

### 4. Cache Intelligent

**CharteRegistry cache 5min** :
```typescript
// Premier appel : DB query
const charte = await CharteRegistry.getCharteById('CharteY_B_v1.0.0');

// Appels suivants (< 5min) : Cache
const charte2 = await CharteRegistry.getCharteById('CharteY_B_v1.0.0'); // Cache hit
```

**Bénéfice** : -1 requête DB si tests successifs même charte

---

## 🚀 Optimisations Possibles

### 1. Batch OpenAI Calls
```typescript
// Au lieu de 50 appels séquentiels
// → 5 batches de 10 appels parallèles
const batches = chunk(pairs, 10);
for (const batch of batches) {
  await Promise.all(batch.map(annotate));
}
// Gain : 50% temps (90s → 45s)
```

---

### 2. Streaming Results
```typescript
// Afficher résultats au fur et à mesure
for (const pair of pairs) {
  const result = await annotate(pair);
  updateUI(result); // Update progressif
}
// UX : Voir progression en temps réel
```

---

### 3. Materialized Views
```sql
-- Vue pré-calculée pour stats globales
CREATE MATERIALIZED VIEW level0_charte_performance AS
SELECT 
  charte_id,
  philosophy,
  AVG(kappa) as avg_kappa,
  COUNT(*) as nb_tests
FROM level0_charte_tests
GROUP BY charte_id, philosophy;

-- Refresh périodique
REFRESH MATERIALIZED VIEW level0_charte_performance;
```

---

## 📚 Références

**Services TypeScript** :
- `CharteManagementService.ts` : CRUD chartes
- `CharteRegistry.ts` : Cache + wrapper async
- `MultiCharteAnnotator.ts` : Orchestration annotation
- `OpenAIAnnotationService.ts` : Appels OpenAI
- `AnnotationService.ts` : CRUD annotations
- `KappaCalculationService.ts` : Calcul métriques
- `SupabaseLevel0Service.ts` : Sauvegarde résultats

**Composants UI** :
- `Level0Interface.tsx` : Interface principale
- `DisagreementsPanel.tsx` : Affichage désaccords
- `useLevel0Testing.ts` : Hook orchestration

**Tables Supabase** :
- `level0_chartes` : 5 chartes (3Y + 2X)
- `analysis_pairs` : 901 paires
- `annotations` : 904+ annotations
- `level0_charte_tests` : Tests sauvegardés

---

## ✅ Checklist Validation

**Avant test** :
- [ ] Chartes chargées en cache
- [ ] 901 paires disponibles avec tags manuels
- [ ] API OpenAI configurée

**Pendant test** :
- [ ] 50 paires sélectionnées aléatoirement
- [ ] 50 annotations créées (1 par paire)
- [ ] Progress visible dans UI

**Après test** :
- [ ] Kappa calculé et affiché
- [ ] Test sauvegardé avec philosophy + version
- [ ] 50 annotations liées au test via test_id
- [ ] Désaccords affichés avec détails

---

**Document créé** : 2025-12-17  
**Version** : 1.0  
**Sprint** : Sprint 3 - Complete  
**Auteur** : Claude (Anthropic) & Thomas
