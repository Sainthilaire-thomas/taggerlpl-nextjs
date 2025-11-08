# 📚 Documentation : h2_analysis_pairs & Fonctions RPC

## 🎯 Vue d'ensemble

`h2_analysis_pairs` est une table d'analyse conversationnelle qui capture les **paires stratégie conseiller → réaction client** avec leur **contexte étendu** (prev4→next3, soit 8 tours de contexte).

---

## 📊 Structure de la Table

### Schéma Simplifié

sql

```sql
h2_analysis_pairs (
-- Identifiants
  pair_id BIGSERIAL PRIMARYKEY,
  call_id TEXT,
  conseiller_turn_id INTEGER,
  client_turn_id INTEGER,
  pair_index INTEGER,
  
-- Paire principale (Conseiller → Client)
  strategy_tag TEXT,
  strategy_family TEXT,
  conseiller_verbatim TEXT,
  conseiller_speaker TEXT,
  conseiller_start_time DOUBLEPRECISION,
  conseiller_end_time DOUBLEPRECISION,
  
  reaction_tag TEXT,
  client_verbatim TEXT,
  client_speaker TEXT,
  client_start_time DOUBLEPRECISION,
  client_end_time DOUBLEPRECISION,
  
-- Contexte PRÉCÉDENT (prev4 → prev1)
  prev4_turn_id INTEGER,
  prev4_verbatim TEXT,
  prev4_speaker TEXT,
  prev4_tag TEXT,
  prev4_start_time DOUBLEPRECISION,
  prev4_end_time DOUBLEPRECISION,
  
  prev3_turn_id INTEGER,
  prev3_verbatim TEXT,
  prev3_speaker TEXT,
  prev3_tag TEXT,
  prev3_start_time DOUBLEPRECISION,
  prev3_end_time DOUBLEPRECISION,
  
  prev2_turn_id INTEGER,
  prev2_verbatim TEXT,
  prev2_speaker TEXT,
  prev2_tag TEXT,
  prev2_start_time DOUBLEPRECISION,
  prev2_end_time DOUBLEPRECISION,
  
  prev1_turn_id INTEGER,
  prev1_verbatim TEXT,
  prev1_speaker TEXT,
  prev1_tag TEXT,
  prev1_start_time DOUBLEPRECISION,
  prev1_end_time DOUBLEPRECISION,
  
-- Contexte SUIVANT (next1 → next3)
  next1_turn_id INTEGER,
  next1_verbatim TEXT,
  next1_speaker TEXT,
  next1_tag TEXT,
  next1_start_time DOUBLEPRECISION,
  next1_end_time DOUBLEPRECISION,
  
  next2_turn_id INTEGER,
  next2_verbatim TEXT,
  next2_speaker TEXT,
  next2_tag TEXT,
  next2_start_time DOUBLEPRECISION,
  next2_end_time DOUBLEPRECISION,
  
  next3_turn_id INTEGER,
  next3_verbatim TEXT,
  next3_speaker TEXT,
  next3_tag TEXT,
  next3_start_time DOUBLEPRECISION,
  next3_end_time DOUBLEPRECISION,
  
-- Résultats algorithmes (pour analyse future)
  m1_verb_density NUMERIC,
  m2_global_alignment NUMERIC,
  m3_cognitive_score NUMERIC,
-- ... autres métriques ...
  
-- Métadonnées
  created_at TIMESTAMPDEFAULTNOW(),
  updated_at TIMESTAMPDEFAULTNOW()
)
```

---

## 🔧 Fonctions RPC Disponibles

### 1. `calculate_turn_relations(p_call_id INTEGER)`

**Objectif** : Calculer les relations de contexte étendu (prev4→prev1, next1→next4) pour tous les tours d'un appel.

#### Signature

sql

```sql
CREATEORREPLACEFUNCTION calculate_turn_relations(
  p_call_id INTEGERDEFAULTNULL
)
RETURNSTABLE(
  updated_count INTEGER,
  total_turns INTEGER,
  execution_time_ms BIGINT
)
```

#### Paramètres

* `p_call_id` (INTEGER, optionnel) : ID de l'appel à traiter. Si NULL, traite tous les appels.

#### Retour

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Colonne</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Type</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Description</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">updated_count</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INTEGER</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Nombre de tours mis à jour</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">total_turns</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INTEGER</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Nombre total de tours traités</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">execution_time_ms</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">BIGINT</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Temps d'exécution en millisecondes</td></tr></tbody></table></pre>

#### Exemple d'utilisation (SQL)

sql

```sql
-- Calculer pour un appel spécifique
SELECT*FROM calculate_turn_relations(354);

-- Résultat :
-- updated_count | total_turns | execution_time_ms
-- 12            | 12          | 45
```

#### Exemple d'utilisation (TypeScript)

typescript

```typescript
const{ data, error }=await supabase.rpc('calculate_turn_relations',{
  p_call_id:parseInt(callId,10)
});

if(!error && data?.[0]){
console.log(`✅ ${data[0].updated_count} tours mis à jour`);
console.log(`📊 ${data[0].total_turns} tours traités`);
console.log(`⏱️ ${data[0].execution_time_ms}ms`);
}
```

#### Que fait cette fonction ?

1. Utilise **LAG/LEAD** pour calculer les 8 IDs de contexte par tour
2. Met à jour les colonnes `prev4_turn_id` → `next4_turn_id` dans `turntagged`
3. Optimisation : ne met à jour **que si les valeurs changent**

---

### 2. `refresh_h2_analysis_pairs_v2(p_incremental BOOLEAN, p_call_ids TEXT[])`

**Objectif** : Peupler/rafraîchir la table `h2_analysis_pairs` avec les paires stratégie→réaction enrichies du contexte étendu.

#### Signature

sql

```sql
CREATEORREPLACEFUNCTION refresh_h2_analysis_pairs_v2(
  p_incremental BOOLEANDEFAULTTRUE,
  p_call_ids TEXT[]DEFAULTNULL
)
RETURNSTABLE(
  inserted INT,
  updated INT,
  deleted INT,
  total_pairs INT,
  execution_time_ms BIGINT
)
```

#### Paramètres

* `p_incremental` (BOOLEAN) :
  * `TRUE` : Rafraîchir seulement les appels spécifiés ou modifiés
  * `FALSE` : Rafraîchissement complet (vide et recrée tout)
* `p_call_ids` (TEXT[], optionnel) : Liste des call_ids à rafraîchir

#### Retour

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Colonne</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Type</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Description</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">inserted</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INT</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Nombre de paires créées</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">updated</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INT</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Nombre de paires mises à jour</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">deleted</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INT</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Nombre de paires supprimées (-1 si full refresh)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">total_pairs</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INT</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Nombre total de paires dans la table</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">execution_time_ms</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">BIGINT</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Temps d'exécution en millisecondes</td></tr></tbody></table></pre>

#### Exemples d'utilisation (SQL)

**Refresh complet** :

sql

```sql
SELECT*FROM refresh_h2_analysis_pairs_v2(FALSE,NULL);

-- Résultat :
-- inserted | updated | deleted | total_pairs | execution_time_ms
-- 901      | 0       | -1      | 901         | 68
```

**Refresh incrémental d'un appel** :

sql

```sql
SELECT*FROM refresh_h2_analysis_pairs_v2(TRUE, ARRAY['354','382']);

-- Résultat :
-- inserted | updated | deleted | total_pairs | execution_time_ms
-- 5        | 8       | 2       | 904         | 22
```

#### Exemple d'utilisation (TypeScript)

typescript

```typescript
// Refresh complet
const{ data, error }=await supabase.rpc('refresh_h2_analysis_pairs_v2',{
  p_incremental:false,
  p_call_ids:null
});

// Refresh incrémental
const{ data, error }=await supabase.rpc('refresh_h2_analysis_pairs_v2',{
  p_incremental:true,
  p_call_ids:['354','382','544']
});

if(!error && data?.[0]){
console.log(`✅ ${data[0].inserted} paires insérées`);
console.log(`🔄 ${data[0].updated} paires mises à jour`);
console.log(`📊 Total: ${data[0].total_pairs} paires`);
}
```

#### Que fait cette fonction ?

1. **Nettoie** les paires obsolètes (si incrémental)
2. **Sélectionne** les tours conseiller avec stratégies (ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION)
3. **Enrichit** avec le contexte via les IDs `prev4_turn_id` → `next4_turn_id`
4. **Insère/Met à jour** dans `h2_analysis_pairs` via UPSERT
5. **Préserve** les résultats d'algorithmes existants (m1_ *, m2_* , m3_*)

---

## 🔗 Dépendances entre Fonctions

```
1. calculate_turn_relations(call_id)
   └─> Remplit prev4_turn_id → next4_turn_id dans turntagged
   
2. refresh_h2_analysis_pairs_v2()
   └─> Lit ces IDs depuis turntagged
   └─> Crée/met à jour les paires avec contexte complet
```

**⚠️ Important** : Toujours exécuter `calculate_turn_relations` **AVANT** `refresh_h2_analysis_pairs_v2` pour garantir que les IDs de contexte sont à jour.

---

## 📋 Workflow Recommandé

### Lors de l'ajout/modification de tags dans l'UI :

typescript

```typescript
// 1. Ajouter/modifier le tag
awaitaddTag(newTag);

// 2. Recalculer les relations
const{ data }=await supabase.rpc('calculate_turn_relations',{
  p_call_id:parseInt(callId,10)
});

// 3. Rafraîchir les paires H2 (optionnel, selon besoin)
if(data?.[0]?.updated_count >0){
await supabase.rpc('refresh_h2_analysis_pairs_v2',{
    p_incremental:true,
    p_call_ids:[callId]
});
}
```

### Lors de l'analyse globale :

typescript

```typescript
// Refresh complet de toutes les paires
const{ data, error }=await supabase.rpc('refresh_h2_analysis_pairs_v2',{
  p_incremental:false,
  p_call_ids:null
});

console.log(`📊 ${data?.[0]?.total_pairs} paires prêtes pour l'analyse`);
```

---

## 🎯 Cas d'Usage Typiques

### 1. Analyser les enchaînements conversationnels

sql

```sql
-- Exemple : Toutes les paires ENGAGEMENT → CLIENT POSITIF
SELECT 
  pair_id,
  conseiller_verbatim,
  client_verbatim,
  prev1_tag,-- Contexte immédiat avant
  next1_tag   -- Suite immédiate après
FROM h2_analysis_pairs
WHERE strategy_family ='ENGAGEMENT'
AND reaction_tag ='CLIENT POSITIF';
```

### 2. Calculer la densité de contexte

sql

```sql
-- Profondeur moyenne du contexte par stratégie
SELECT 
  strategy_tag,
COUNT(*)as nb_paires,
AVG(
CASEWHEN prev4_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN prev3_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN prev2_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN prev1_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN next1_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN next2_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN next3_turn_id ISNOTNULLTHEN1ELSE0END
)as avg_context_depth
FROM h2_analysis_pairs
GROUPBY strategy_tag
ORDERBY avg_context_depth DESC;
```

### 3. Détecter les patterns conversationnels

sql

```sql
-- Pattern : OUVERTURE → CLIENT POSITIF précédé de REFLET
SELECT 
COUNT(*)as occurrences,
AVG(client_start_time - conseiller_end_time)as avg_response_time
FROM h2_analysis_pairs
WHERE strategy_family ='OUVERTURE'
AND reaction_tag ='CLIENT POSITIF'
AND prev1_tag LIKE'REFLET%';
```

---

## 📊 Statistiques de Performance

**Environnement** : PostgreSQL, ~900 paires, 6 appels

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Opération</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Temps moyen</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Notes</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">calculate_turn_relations(1 appel)</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">40-60ms</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">~12 tours</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">calculate_turn_relations(tous)</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">150-200ms</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">~900 tours</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">refresh_h2_analysis_pairs_v2(full)</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">60-80ms</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">901 paires</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">refresh_h2_analysis_pairs_v2(1 appel)</code></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">15-25ms</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">~10-20 paires</td></tr></tbody></table></pre>

---

## 🔍 Vues Utiles pour le Monitoring

### Vue de validation temporelle

sql

```sql
CREATEORREPLACEVIEW h2_context_sequence_validation AS
SELECT 
  pair_id,
  call_id,
  strategy_tag,
  reaction_tag,
  
-- Vérification ordre chronologique
CASE 
WHEN prev4_end_time ISNOTNULLAND prev3_start_time ISNOTNULL 
AND prev4_end_time > prev3_start_time 
THEN'❌ INVERSION prev4→prev3'
WHEN conseiller_end_time > client_start_time 
THEN'❌ INVERSION conseiller→client'
ELSE'✅ Ordre OK'
ENDas sequence_validation,
  
-- Qualité adjacence conseiller-client
CASE 
WHEN(client_start_time - conseiller_end_time)<0.05 
THEN'✅ Excellent (<50ms)'
WHEN(client_start_time - conseiller_end_time)<0.1 
THEN'✅ Bon (<100ms)'
WHEN(client_start_time - conseiller_end_time)<0.5 
THEN'⚠️ Acceptable (<500ms)'
ELSE'❌ Gap suspect (>500ms)'
ENDas adjacency_quality,
  
-- Profondeur du contexte
(CASEWHEN prev4_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN prev3_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN prev2_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN prev1_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN next1_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN next2_turn_id ISNOTNULLTHEN1ELSE0END+
CASEWHEN next3_turn_id ISNOTNULLTHEN1ELSE0END)as context_depth

FROM h2_analysis_pairs;
```

### Statistiques globales

sql

```sql
-- Vue résumé
SELECT 
COUNT(*)as total_pairs,
COUNT(*) FILTER (WHERE sequence_validation ='✅ Ordre OK')as valid_sequences,
ROUND(AVG(context_depth),2)as avg_context_depth,
ROUND(100.0*COUNT(*) FILTER (WHERE adjacency_quality LIKE'✅%')/COUNT(*),2)as pct_good_adjacency
FROM h2_context_sequence_validation;
```

---

## 🚨 Points d'Attention

### 1. Types de données

* ⚠️ `call_id` est **TEXT** dans `h2_analysis_pairs`
* ⚠️ `call_id` est **INTEGER** dans `turntagged`
* ✅ La fonction fait le cast automatiquement : `tc.call_id::TEXT`

### 2. Contraintes

* Contrainte unique : `(conseiller_turn_id, client_turn_id)`
* Pas de doublon possible pour une même paire

### 3. Préservation des données

* Les colonnes `m1_*`, `m2_*`, `m3_*` sont **préservées** lors des updates
* Seuls les champs de contexte et métadonnées sont mis à jour

---

## 📝 Résumé pour Nouvelle Session

**Pour adapter du code à la nouvelle structure :**

1. **Remplacer les anciens appels** :

typescript

```typescript
// ❌ Ancien (obsolète)
calculateAllNextTurnTags(callId)
   
// ✅ Nouveau (avec contexte étendu)
   supabase.rpc('calculate_turn_relations',{ 
     p_call_id:parseInt(callId,10) 
})
```

2. **Utiliser les nouveaux champs** :

typescript

```typescript
interfaceH2Pair{
// Au lieu de prev2, prev1, next1
     prev4_*, prev3_*, prev2_*, prev1_*,// Contexte avant
     next1_*, next2_*, next3_*// Contexte après
}
```

3. **Appeler dans le bon ordre** :

typescript

```typescript
// 1. Calculer relations
await supabase.rpc('calculate_turn_relations',{ p_call_id });
   
// 2. Rafraîchir paires H2
await supabase.rpc('refresh_h2_analysis_pairs_v2',{ 
     p_incremental:true, 
     p_call_ids:[callId] 
});
```

---

**Statut actuel** : 901 paires créées, 98.11% de qualité, prêt pour l'intégration TypeScript 🚀
