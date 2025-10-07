# 📚 Documentation : Système H2 Analysis Pairs - Peuplement et Synchronisation

---

## 🎯 Vue d'ensemble

### Objectifs

* **Centraliser** les paires adjacentes conseiller → client pour analyse algorithmique
* **Optimiser** les performances (éviter requêtes répétées sur `turntagged`)
* **Pré-calculer** le contexte conversationnel (T-2, T-1, T+1)
* **Synchroniser** automatiquement avec l'évolution des annotations

### Principe de fonctionnement

```
turntagged (source de vérité)
    ↓ Filtrage intelligent
h2_analysis_pairs (cache optimisé)
    ↓ Algorithmes
Résultats stockés (M1, M2, M3, X, Y)
```

---

## 📊 Structure de la table `h2_analysis_pairs`

### Schéma complet

sql

```sql
CREATETABLE h2_analysis_pairs (
-- ========================================
-- 🔑 IDENTIFIANTS & RÉFÉRENCES
-- ========================================
  pair_id BIGSERIAL PRIMARYKEY,
  call_id TEXTNOTNULL,
  conseiller_turn_id INTNOTNULL,
  client_turn_id INTNOTNULL,
  pair_index INTNOTNULL,-- Position dans l'appel (1, 2, 3...)
  
-- ========================================
-- 📝 PAIRE PRINCIPALE (Tour conseiller → Réaction client)
-- ========================================
  
-- Tour CONSEILLER (T0)
  strategy_tag TEXTNOTNULL,-- Tag exact (ex: REFLET_VOUS)
  strategy_family TEXTNOTNULL,-- Famille (ENGAGEMENT|OUVERTURE|REFLET|EXPLICATION)
  conseiller_verbatim TEXTNOTNULL,
  conseiller_speaker TEXT,
  conseiller_start_time FLOATNOTNULL,
  conseiller_end_time FLOATNOTNULL,
  strategy_color TEXT,
  strategy_originespeaker TEXT,
  
-- Tour CLIENT (Réaction)
  reaction_tag TEXTNOTNULL,-- CLIENT_POSITIF|CLIENT_NEGATIF|CLIENT_NEUTRE
  client_verbatim TEXTNOTNULL,
  client_speaker TEXT,
  client_start_time FLOATNOTNULL,
  client_end_time FLOATNOTNULL,
  
-- ========================================
-- 🎯 CONTEXTE CONVERSATIONNEL PRÉ-CALCULÉ
-- ========================================
  
-- Contexte AVANT (T-2, T-1)
  prev2_verbatim TEXT,
  prev2_speaker TEXT,
  prev2_tag TEXT,
  prev1_verbatim TEXT,
  prev1_speaker TEXT,
  prev1_tag TEXT,
  
-- Contexte APRÈS (T+1)
  next1_verbatim TEXT,
  next1_speaker TEXT,
  next1_tag TEXT,
  
-- ========================================
-- 📊 RÉSULTATS ALGORITHMES (UPDATABLE)
-- ========================================
  
-- X/Y : Classification stratégie → réaction
  next_turn_tag_auto TEXT,-- Prédiction algo
  score_auto NUMERIC,-- Confiance
  
-- M1 : Densité de verbes d'action
  m1_verb_density NUMERIC,
  m1_verb_count INT,
  m1_total_words INT,
  m1_action_verbs TEXT[],
  
-- M2 : Alignement interactionnel
  m2_lexical_alignment NUMERIC,
  m2_semantic_alignment NUMERIC,
  m2_global_alignment NUMERIC,
  m2_shared_terms TEXT[],
  
-- M3 : Charge cognitive
  m3_hesitation_count INT,
  m3_clarification_count INT,
  m3_cognitive_score NUMERIC,
  m3_cognitive_load TEXT,
  m3_patterns JSONB,
  
-- ========================================
-- 🔧 VERSIONING & MÉTADONNÉES
-- ========================================
  
  algorithm_version TEXT,-- Ex: "X-GPT4-v1.2.3-abc123"
  computed_at TIMESTAMP,
  computation_status TEXTDEFAULT'pending',-- pending|computed|error
  version_metadata JSONB DEFAULT'{}'::jsonb,
  
-- ========================================
-- 📚 ANNOTATIONS EXPERTES
-- ========================================
  
  annotations JSONB DEFAULT'[]'::jsonb,
  
-- ========================================
-- 📅 AUDIT
-- ========================================
  
  created_at TIMESTAMPDEFAULTNOW(),
  updated_at TIMESTAMPDEFAULTNOW(),
  
-- ========================================
-- 🔗 CONTRAINTES
-- ========================================
  
CONSTRAINT fk_call 
FOREIGNKEY(call_id)REFERENCEScall(callid),
CONSTRAINT fk_conseiller_turn 
FOREIGNKEY(conseiller_turn_id)REFERENCES turntagged(id),
CONSTRAINT fk_client_turn 
FOREIGNKEY(client_turn_id)REFERENCES turntagged(id),
CONSTRAINT uq_h2_pair 
UNIQUE(conseiller_turn_id, client_turn_id),
CONSTRAINT chk_computation_status 
CHECK(computation_status IN('pending','computed','error'))
);
```

---

## 🔍 Règles de filtrage pour les paires

### Pour le tour CONSEILLER (Variable X)

sql

```sql
-- ✅ Critère : FAMILLE dans lpltag
lpl.family IN('ENGAGEMENT','OUVERTURE','REFLET','EXPLICATION')

-- Exemples de tags inclus :
-- ENGAGEMENT        → famille ENGAGEMENT
-- OUVERTURE         → famille OUVERTURE
-- REFLET_VOUS       → famille REFLET
-- REFLET_JE         → famille REFLET
-- REFLET_ACQ        → famille REFLET
-- EXPLICATION       → famille EXPLICATION
```

### Pour le tour CLIENT (Variable Y)

sql

```sql
-- ✅ Critère : TAG exact
t.tag IN('CLIENT_POSITIF','CLIENT_NEGATIF','CLIENT_NEUTRE')

-- Note : Pas de vérification de famille, on se base sur le tag
```

### Règle d'adjacence

sql

```sql
-- Le tour client doit être :
-- 1. Dans le même appel (call_id)
-- 2. APRÈS le tour conseiller (start_time > conseiller.end_time)
-- 3. Le PREMIER tour client suivant (ORDER BY start_time ASC LIMIT 1)
```

---

## 🔄 Fonction SQL : `refresh_h2_analysis_pairs`

### Signature

sql

```sql
CREATEORREPLACEFUNCTION refresh_h2_analysis_pairs(
  p_incremental BOOLEANDEFAULTTRUE,-- Mode incrémental ou full refresh
  p_call_ids TEXT[]DEFAULTNULL-- Liste d'appels spécifiques (NULL = tous)
)
RETURNSTABLE(
  inserted INT,-- Nouvelles paires créées
  updated INT,-- Paires mises à jour
  deleted INT,-- Paires supprimées (obsolètes)
  skipped INT,-- Paires ignorées (déjà à jour)
  total_pairs INT,-- Total final de paires
  execution_time_ms BIGINT-- Temps d'exécution
)
```

### Modes de fonctionnement

#### Mode 1 : Full Refresh

sql

```sql
-- Supprime TOUT et reconstruit de zéro
SELECT*FROM refresh_h2_analysis_pairs(FALSE,NULL);
```

**Utilisation :**

* Migration initiale
* Changement majeur de schéma
* Réinitialisation complète

**Attention :** ⚠️ **Perd tous les résultats d'algorithmes** (M1, M2, M3, scores)

#### Mode 2 : Refresh Incrémental (recommandé)

sql

```sql
-- Met à jour seulement ce qui a changé
SELECT*FROM refresh_h2_analysis_pairs(TRUE,NULL);
```

**Utilisation :**

* Après session de tagging
* Synchronisation quotidienne/hebdomadaire
* Ajout de nouveaux appels

**Avantage :** ✅ **Conserve les résultats d'algorithmes existants**

#### Mode 3 : Refresh par appels spécifiques

sql

```sql
-- Met à jour seulement certains appels
SELECT*FROM refresh_h2_analysis_pairs(
TRUE, 
  ARRAY['call_001','call_002','call_003']
);
```

**Utilisation :**

* Correction d'annotations sur des appels précis
* Test après modification de tags

---

## 📝 Algorithme de peuplement (logique détaillée)

### Étape 1 : Suppression des paires obsolètes

sql

```sql
-- En mode incrémental, supprimer :
DELETEFROM h2_analysis_pairs
WHERE 
-- 1. Tours qui n'existent plus dans turntagged
NOTEXISTS(SELECT1FROM turntagged WHERE id = conseiller_turn_id)
ORNOTEXISTS(SELECT1FROM turntagged WHERE id = client_turn_id)
  
-- 2. OU appels à rafraîchir (si p_call_ids fourni)
OR(p_call_ids ISNOTNULLAND call_id =ANY(p_call_ids))
```

### Étape 2 : Extraction des tours conseiller valides

sql

```sql
WITH conseiller_turns AS(
SELECT 
    t.id,
    t.call_id,
    t.tag,-- Tag exact (ex: REFLET_VOUS)
    t.verbatim,
    t.speaker,
    t.start_time,
    t.end_time,
    lpl.family,-- ✅ FAMILLE utilisée pour filtrage
    lpl.color,
    lpl.originespeaker,
    ROW_NUMBER()OVER(
PARTITIONBY t.call_id 
ORDERBY t.start_time
)as turn_sequence
FROM turntagged t
INNERJOIN lpltag lpl ON lpl.label = t.tag
WHERE 
-- ✅ CRITÈRE : Famille conseiller
    lpl.family IN('ENGAGEMENT','OUVERTURE','REFLET','EXPLICATION')
  
-- Filtrage optionnel par call_ids
AND(p_call_ids ISNULLOR t.call_id =ANY(p_call_ids))
)
```

### Étape 3 : Extraction des tours client valides

sql

```sql
client_turns AS(
SELECT 
    t.id,
    t.call_id,
    t.tag,
    t.verbatim,
    t.speaker,
    t.start_time,
    t.end_time
FROM turntagged t
WHERE 
-- ✅ CRITÈRE : Tags client spécifiques
    t.tag IN('CLIENT_POSITIF','CLIENT_NEGATIF','CLIENT_NEUTRE')
)
```

### Étape 4 : Construction des paires adjacentes

sql

```sql
valid_pairs AS(
SELECT 
    tc.call_id,
    tc.id as conseiller_turn_id,
    tc.tag as strategy_tag,-- Tag exact conservé
    tc.family as strategy_family,-- ✅ Famille stockée
-- ... autres champs conseiller
  
    tcl.id as client_turn_id,
    tcl.tag as reaction_tag,
-- ... autres champs client
  
FROM conseiller_turns tc
  
-- ✅ JOIN LATERAL : Premier tour client APRÈS conseiller
INNERJOIN LATERAL (
SELECT*
FROM client_turns
WHERE call_id = tc.call_id
AND start_time > tc.end_time    -- ✅ APRÈS conseiller
ORDERBY start_time ASC
LIMIT1-- ✅ PREMIER tour client
) tcl ONTRUE
  
-- JOINs pour contexte (prev2, prev1, next1)
-- ... (voir section suivante)
)
```

### Étape 5 : Calcul du contexte (T-2, T-1, T+1)

sql

```sql
-- Contexte T-2 (2 tours avant conseiller)
LEFTJOIN LATERAL (
SELECT verbatim, speaker, tag
FROM turntagged
WHERE call_id = tc.call_id
AND start_time < tc.start_time
ORDERBY start_time DESC
LIMIT1OFFSET1-- Skip T-1, récupère T-2
) prev2 ONTRUE

-- Contexte T-1 (1 tour avant conseiller)
LEFTJOIN LATERAL (
SELECT verbatim, speaker, tag
FROM turntagged
WHERE call_id = tc.call_id
AND start_time < tc.start_time
ORDERBY start_time DESC
LIMIT1-- Récupère T-1
) prev1 ONTRUE

-- Contexte T+1 (1 tour après réaction client)
LEFTJOIN LATERAL (
SELECT verbatim, speaker, tag
FROM turntagged
WHERE call_id = tc.call_id
AND start_time > tcl.end_time  -- ✅ APRÈS réaction client
ORDERBY start_time ASC
LIMIT1
) next1 ONTRUE
```

### Étape 6 : UPSERT (Insert ou Update)

sql

```sql
INSERTINTO h2_analysis_pairs (
-- ... tous les champs
)
SELECT*FROM valid_pairs

-- ✅ UPSERT : Si paire existe, on met à jour
ON CONFLICT (conseiller_turn_id, client_turn_id) 
DOUPDATESET
  pair_index = EXCLUDED.pair_index,
  strategy_tag = EXCLUDED.strategy_tag,
  strategy_family = EXCLUDED.strategy_family,
  conseiller_verbatim = EXCLUDED.conseiller_verbatim,
  reaction_tag = EXCLUDED.reaction_tag,
  client_verbatim = EXCLUDED.client_verbatim,
  prev2_verbatim = EXCLUDED.prev2_verbatim,
  prev1_verbatim = EXCLUDED.prev1_verbatim,
  next1_verbatim = EXCLUDED.next1_verbatim,
  updated_at =NOW()
  
-- ⚠️ NE PAS écraser les résultats d'algorithmes :
-- m1_verb_density, m2_global_alignment, etc. sont CONSERVÉS
```

---

## 🎨 Interface utilisateur : `RefreshH2Panel`

### Localisation

```
src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/RefreshH2Panel.tsx
```

### Fonctionnalités

#### 1. Affichage des statistiques actuelles

typescript

```typescript
{
  totalPairs:1523,// Nombre total de paires
  pendingCompute:89,// Paires en attente de calcul
  computedPairs:1434,// Paires avec résultats
  lastRefresh:"2025-01-07T14:23:00Z"
}
```

#### 2. Actions disponibles

##### Refresh Incrémental (recommandé)

typescript

```typescript
// Bouton : "Synchroniser les nouvelles annotations"
consthandleIncrementalRefresh=async()=>{
const{ data, error }=await supabase.rpc('refresh_h2_analysis_pairs',{
    p_incremental:true,
    p_call_ids:null
});
  
// Afficher statistiques :
// - X nouvelles paires créées
// - Y paires mises à jour
// - Z paires supprimées (obsolètes)
};
```

##### Refresh complet (destructif)

typescript

```typescript
// Bouton : "Régénérer toutes les paires" (avec confirmation)
consthandleFullRefresh=async()=>{
// ⚠️ Afficher AVERTISSEMENT :
// "Cette action va supprimer tous les résultats d'algorithmes calculés.
//  Êtes-vous sûr de vouloir continuer ?"
  
if(confirmed){
await supabase.rpc('refresh_h2_analysis_pairs',{
      p_incremental:false,
      p_call_ids:null
});
}
};
```

##### Refresh par appels

typescript

```typescript
// Interface : Sélection multi-appels
consthandleCallSpecificRefresh=async(callIds:string[])=>{
await supabase.rpc('refresh_h2_analysis_pairs',{
    p_incremental:true,
    p_call_ids: callIds
});
};
```

#### 3. Affichage des résultats

typescript

```typescript
<Alert severity="success">
  ✅ Synchronisation terminée en {executionTime}ms
  
  • {inserted} nouvelles paires créées
  • {updated} paires mises à jour
  • {deleted} paires supprimées
  • Total:{totalPairs} paires actives
</Alert>
```

---

## 🔧 Intégration avec les algorithmes

### Hook : `useH2Data`

typescript

```typescript
// hooks/useH2Data.ts
exportconstuseH2Data=()=>{
const[h2Pairs, setH2Pairs]=useState<H2AnalysisPair[]>([]);
const[loading, setLoading]=useState(true);
  
useEffect(()=>{
constloadH2Pairs=async()=>{
const{ data, error }=await supabase
.from('h2_analysis_pairs')
.select('*')
.order('call_id',{ ascending:true})
.order('pair_index',{ ascending:true});
    
if(!error){
setH2Pairs(data);
}
};
  
loadH2Pairs();
},[]);
  
return{ h2Pairs, loading, error };
};
```

### Mapping vers GoldStandard

typescript

```typescript
// useLevel1Testing.ts
const mapH2ToGoldStandard =(pairs:H2AnalysisPair[]):GoldStandardSample[]=>{
return pairs.map(pair =>({
    verbatim: pair.conseiller_verbatim,
    expectedTag: pair.strategy_tag,// Tag exact conservé
    metadata:{
      target:'conseiller',
      callId: pair.call_id,
      turnId: pair.conseiller_turn_id,
      pairId: pair.pair_id,
    
// ✅ Contexte disponible
      prev2_turn_verbatim: pair.prev2_verbatim,
      prev1_turn_verbatim: pair.prev1_verbatim,
      next_turn_verbatim: pair.next1_verbatim,
    
// Infos client
      client_verbatim: pair.client_verbatim,
      reaction_tag: pair.reaction_tag,
    
// Famille
      strategy_family: pair.strategy_family,
}
}));
};
```

### Update des résultats

typescript

```typescript
// Après exécution d'un algorithme
constupdateH2WithResults=async(
  results:TVValidationResult[],
  algorithmName:string,
  algorithmVersion:string
)=>{
for(const result of results){
const pairId = result.metadata?.pairId;
if(!pairId)continue;
  
const updateData:any={
      computed_at:newDate().toISOString(),
      algorithm_version: algorithmVersion,
};
  
// Remplir selon l'algo
if(algorithmName.includes('M1')){
      updateData.m1_verb_density= result.metadata?.m1_verb_density;
      updateData.m1_verb_count= result.metadata?.m1_verb_count;
// ...
}elseif(algorithmName.includes('M2')){
      updateData.m2_global_alignment= result.metadata?.m2_global_alignment;
// ...
}
  
    updateData.computation_status='computed';
  
await supabase
.from('h2_analysis_pairs')
.update(updateData)
.eq('pair_id', pairId);
}
};
```

---

## 📋 Index et performances

### Index critiques

sql

```sql
-- Recherche par call_id (fréquent)
CREATEINDEX idx_h2_call ON h2_analysis_pairs(call_id);

-- Recherche par tag/famille (filtrage algos)
CREATEINDEX idx_h2_strategy_tag ON h2_analysis_pairs(strategy_tag);
CREATEINDEX idx_h2_strategy_family ON h2_analysis_pairs(strategy_family);
CREATEINDEX idx_h2_reaction_tag ON h2_analysis_pairs(reaction_tag);

-- Suivi des calculs
CREATEINDEX idx_h2_computation_status ON h2_analysis_pairs(computation_status);
CREATEINDEX idx_h2_algorithm_version ON h2_analysis_pairs(algorithm_version);

-- Retrouver le contexte source
CREATEINDEX idx_h2_conseiller_turn ON h2_analysis_pairs(conseiller_turn_id);
CREATEINDEX idx_h2_client_turn ON h2_analysis_pairs(client_turn_id);

-- Navigation séquentielle
CREATEINDEX idx_h2_pair_index ON h2_analysis_pairs(call_id, pair_index);

-- Recherche dans annotations
CREATEINDEX idx_h2_annotations ON h2_analysis_pairs USING GIN (annotations);
```

### Performances attendues

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Opération</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Durée estimée</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Full refresh (10K paires)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">15-30 secondes</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Incrémental (100 nouvelles paires)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">2-5 secondes</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">SELECT paires par call_id</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">< 50ms</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">UPDATE résultats algo (1 paire)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">< 10ms</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">UPDATE batch (100 paires)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">< 2 secondes</td></tr></tbody></table></pre>

---

## 🔐 Sécurité et permissions

### Row Level Security (RLS)

sql

```sql
-- Politique de lecture (tous les utilisateurs authentifiés)
CREATE POLICY "Allow read h2_analysis_pairs"
ON h2_analysis_pairs
FORSELECT
TO authenticated
USING(true);

-- Politique d'écriture (seulement admins/analystes)
CREATE POLICY "Allow update h2_analysis_pairs"
ON h2_analysis_pairs
FORUPDATE
TO authenticated
USING(
EXISTS(
SELECT1FROM user_roles
WHERE user_id = auth.uid()
AND role IN('admin','analyst')
)
);
```

---

## 🧪 Tests et validation

### Test 1 : Peuplement initial

sql

```sql
-- Vérifier qu'aucune paire incomplète n'existe
SELECTCOUNT(*) 
FROM h2_analysis_pairs p
WHERENOTEXISTS(
SELECT1FROM turntagged 
WHERE id = p.conseiller_turn_id
)
ORNOTEXISTS(
SELECT1FROM turntagged 
WHERE id = p.client_turn_id
);
-- Résultat attendu : 0
```

### Test 2 : Validité des familles

sql

```sql
-- Vérifier que toutes les stratégies ont une famille valide
SELECT strategy_family,COUNT(*)
FROM h2_analysis_pairs
GROUPBY strategy_family
ORDERBYCOUNT(*)DESC;

-- Résultat attendu : Seulement ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION
```

### Test 3 : Validité des réactions

sql

```sql
-- Vérifier que toutes les réactions sont valides
SELECT reaction_tag,COUNT(*)
FROM h2_analysis_pairs
GROUPBY reaction_tag;

-- Résultat attendu : Seulement CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE
```

### Test 4 : Adjacence temporelle

sql

```sql
-- Vérifier que client vient bien APRÈS conseiller
SELECTCOUNT(*)
FROM h2_analysis_pairs
WHERE client_start_time <= conseiller_end_time;

-- Résultat attendu : 0
```

### Test 5 : Unicité des paires

sql

```sql
-- Vérifier qu'il n'y a pas de doublons
SELECT conseiller_turn_id, client_turn_id,COUNT(*)
FROM h2_analysis_pairs
GROUPBY conseiller_turn_id, client_turn_id
HAVINGCOUNT(*)>1;

-- Résultat attendu : 0 lignes
```

---

## 📅 Workflow recommandé

### Workflow initial (Migration)

```
1. Créer table h2_analysis_pairs
2. Créer fonction refresh_h2_analysis_pairs
3. Créer index
4. Exécuter full refresh (p_incremental=FALSE)
5. Valider avec tests
6. Créer interface RefreshH2Panel
```

### Workflow quotidien (Production)

```
1. Taggeurs annotent les appels dans l'interface
2. En fin de journée : Refresh incrémental automatique (cron)
3. OU : Refresh manuel via RefreshH2Panel si besoin urgent
4. Algorithmes utilisent les nouvelles paires
5. Résultats stockés dans h2_analysis_pairs
```

### Workflow de correction

```
1. Utilisateur signale erreur de tag
2. Correcteur modifie dans turntagged
3. Refresh incrémental pour call_id spécifique
4. Paire mise à jour, résultats algos conservés si pertinent
5. Re-run algorithme si nécessaire
```

---

## ⚠️ Points d'attention

### 1. Conservation des résultats lors du refresh

sql

```sql
-- ✅ BON : L'UPSERT conserve les résultats d'algorithmes
DOUPDATESET
-- Met à jour seulement les métadonnées de base
  conseiller_verbatim = EXCLUDED.conseiller_verbatim,
-- NE TOUCHE PAS à m1_verb_density, m2_global_alignment, etc.
```

### 2. Gestion du champ speaker

```
⚠️ Le champ speaker dans turntagged n'est PAS fiable
✅ On utilise la FAMILLE (lpltag) pour le conseiller
✅ On utilise le TAG pour le client
```

### 3. Paires incomplètes

```
❌ Ne JAMAIS créer de paire sans réaction client
✅ INNER JOIN LATERAL garantit l'adjacence
```

### 4. Performance du refresh

```
⚠️ Full refresh peut être long (15-30s pour 10K paires)
✅ Privilégier le mode incrémental
✅ Faire refresh en dehors des heures de pointe si possible
```

---

## 📦 Livrables à développer

### SQL

* [ ] `001_create_h2_analysis_pairs.sql` - Création table
* [ ] `002_create_h2_indexes.sql` - Index de performance
* [ ] `003_create_refresh_function.sql` - Fonction de peuplement
* [ ] `004_create_helper_functions.sql` - Fonctions utilitaires
* [ ] `005_initial_population.sql` - Peuplement initial

### TypeScript

* [ ] `types/h2Types.ts` - Types H2AnalysisPair
* [ ] `hooks/useH2Data.ts` - Hook de récupération données
* [ ] `hooks/useH2Refresh.ts` - Hook de synchronisation
* [ ] `components/Level1/shared/RefreshH2Panel.tsx` - Interface refresh

### Tests

* [ ] `tests/h2_population.test.sql` - Tests SQL
* [ ] `tests/useH2Data.test.ts` - Tests hooks
* [ ] `tests/refresh_workflow.test.ts` - Tests workflow

---

## 🚀 Prochaines étapes

1. ✅ **Valider cette documentation** avec l'équipe
2. 🔨 **Développer les migrations SQL**
3. 🎨 **Développer l'interface RefreshH2Panel**
4. 🧪 **Tester sur un sous-ensemble de données**
5. 📊 **Monitorer les performances**
6. 🚀 **Déployer en production**

---

**Date de dernière mise à jour :** 2025-01-07

**Version :** 1.0

**Auteur :** Architecture AlgorithmLab
