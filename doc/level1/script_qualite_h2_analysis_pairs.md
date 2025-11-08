# 📚 Documentation : Tests de Validation h2_analysis_pairs

## 🎯 Résumé de la Migration

**Date** : 2025-01-15

**Base** : `h2_analysis_pairs` avec contexte étendu (prev4→next3)

**Résultats** : **901 paires créées en 68ms**

---

## ✅ Statistiques Globales

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Métrique</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Valeur</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Statut</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Total paires</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">901</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Séquences valides</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">884 (98.11%)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅ Excellent</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Séquences inversées</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">17 (1.89%)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ À corriger</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Adjacence excellente</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">872 (96.78%)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅ Excellent</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Adjacence suspecte</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">17 (1.89%)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">⚠️ À investiguer</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>Profondeur contexte moyenne</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">6.90 / 7</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">✅ Excellent</td></tr></tbody></table></pre>

**Conclusion** : Migration réussie avec  **98.11% de qualité** . Les 17 inversions temporelles sont dues à des erreurs de tagging dans les appels sources.

---

## 🧪 Requêtes de Test à Mémoriser

### 📊 Test 1 : Vue d'Ensemble (À lancer en premier)

sql

```sql
-- Statistiques globales de validation
SELECT 
COUNT(*)as total_pairs,
COUNT(*) FILTER (WHERE sequence_validation ='✅ Ordre OK')as sequences_ok,
COUNT(*) FILTER (WHERE sequence_validation LIKE'❌%')as sequences_inversees,
COUNT(*) FILTER (WHERE adjacency_quality ='✅ Excellent (<50ms)')as adjacency_excellent,
COUNT(*) FILTER (WHERE adjacency_quality ='✅ Bon (<100ms)')as adjacency_bon,
COUNT(*) FILTER (WHERE adjacency_quality ='⚠️ Acceptable (<500ms)')as adjacency_acceptable,
COUNT(*) FILTER (WHERE adjacency_quality ='❌ Gap suspect (>500ms)')as adjacency_suspect,
ROUND(AVG(context_depth),2)as avg_context_depth,
MAX(context_depth)as max_context_depth,
ROUND(100.0*COUNT(*) FILTER (WHERE sequence_validation ='✅ Ordre OK')/COUNT(*),2)||'%'as pct_sequences_ok,
ROUND(100.0*COUNT(*) FILTER (WHERE adjacency_quality LIKE'✅%')/COUNT(*),2)||'%'as pct_adjacency_ok
FROM h2_context_sequence_validation;
```

**Utilité** : Avoir une vision globale de la qualité des données en 1 requête.

---

### 🔍 Test 2 : Détecter les Inversions Temporelles

sql

```sql
-- Trouver toutes les paires avec inversions
SELECT 
  pair_id,
  call_id,
  strategy_tag,
  sequence_validation,
  prev4_end_time,
  prev3_start_time,
  prev2_start_time,
  prev1_start_time,
  conseiller_start_time,
  client_start_time,
  next1_start_time
FROM h2_context_sequence_validation
WHERE sequence_validation LIKE'❌%'
ORDERBY call_id, pair_id;
```

**Utilité** : Identifier les appels à corriger manuellement.

**Appels concernés** (à corriger plus tard) :

* Call 354 : 1 inversion
* Call 382 : 4 inversions
* Call 398 : 2 inversions
* Call 544 : 4 inversions
* Call 770 : 1 inversion
* Call 774 : 5 inversions

---

### 📈 Test 3 : Distribution des Gaps (Adjacence)

sql

```sql
-- Analyser la qualité de l'adjacence conseiller-client
SELECT 
  adjacency_quality,
COUNT(*)as count,
ROUND(AVG(gap_conseiller_client)::numeric,3)as avg_gap,
ROUND(MIN(gap_conseiller_client)::numeric,3)as min_gap,
ROUND(MAX(gap_conseiller_client)::numeric,3)as max_gap,
ROUND(COUNT(*)*100.0/SUM(COUNT(*))OVER(),2)as percentage
FROM h2_context_sequence_validation
GROUPBY adjacency_quality
ORDERBY 
CASE adjacency_quality
WHEN'✅ Excellent (<50ms)'THEN1
WHEN'✅ Bon (<100ms)'THEN2
WHEN'⚠️ Acceptable (<500ms)'THEN3
ELSE4
END;
```

**Utilité** : Vérifier que la majorité des paires ont une bonne adjacence temporelle.

---

### 🎯 Test 4 : Profondeur du Contexte

sql

```sql
-- Distribution de la profondeur du contexte
SELECT 
  context_depth,
COUNT(*)as count,
ROUND(COUNT(*)*100.0/SUM(COUNT(*))OVER(),2)as percentage,
  STRING_AGG(pair_id::TEXT,', 'ORDERBY pair_id LIMIT5)as sample_pairs
FROM h2_context_sequence_validation
GROUPBY context_depth
ORDERBY context_depth DESC;
```

**Utilité** : Savoir combien de paires ont un contexte complet (7 tours) vs partiel.

**Résultat attendu** :

* Contexte complet (7 tours) : ~70-80%
* Contexte partiel (4-6 tours) : ~20-30%

---

### 🔬 Test 5 : Examiner une Paire Spécifique

sql

```sql
-- Visualiser UNE paire avec tout son contexte
SELECT 
  pair_id,
  call_id,
  
-- Séquence complète avec tags et timestamps
  CONCAT('P4: ',COALESCE(prev4_tag,'NULL'),' (',ROUND(prev4_start_time::numeric,1),')')as prev4,
  CONCAT('P3: ',COALESCE(prev3_tag,'NULL'),' (',ROUND(prev3_start_time::numeric,1),')')as prev3,
  CONCAT('P2: ',COALESCE(prev2_tag,'NULL'),' (',ROUND(prev2_start_time::numeric,1),')')as prev2,
  CONCAT('P1: ',COALESCE(prev1_tag,'NULL'),' (',ROUND(prev1_start_time::numeric,1),')')as prev1,
  CONCAT('CONSEILLER: ', strategy_tag,' (',ROUND(conseiller_start_time::numeric,1),')')as conseiller,
  CONCAT('CLIENT: ', reaction_tag,' (',ROUND(client_start_time::numeric,1),')')as client,
  CONCAT('N1: ',COALESCE(next1_tag,'NULL'),' (',ROUND(next1_start_time::numeric,1),')')as next1,
  CONCAT('N2: ',COALESCE(next2_tag,'NULL'),' (',ROUND(next2_start_time::numeric,1),')')as next2,
  CONCAT('N3: ',COALESCE(next3_tag,'NULL'),' (',ROUND(next3_start_time::numeric,1),')')as next3,
  
  sequence_validation,
  adjacency_quality,
  context_depth
FROM h2_context_sequence_validation
WHERE pair_id =50;-- Remplacer par le pair_id à investiguer
```

**Utilité** : Debug d'une paire spécifique pour comprendre le contexte complet.

---

### 📋 Test 6 : Gaps Suspects (>500ms)

sql

```sql
-- Trouver les paires avec gaps trop importants
SELECT 
  pair_id,
  call_id,
  strategy_tag,
  reaction_tag,
  gap_conseiller_client,
  adjacency_quality,
  conseiller_end_time,
  client_start_time
FROM h2_context_sequence_validation
WHERE adjacency_quality ='❌ Gap suspect (>500ms)'
ORDERBY gap_conseiller_client DESC;
```

**Utilité** : Identifier les paires où le client répond après un long silence (potentiellement anormal).

---

### 📊 Test 7 : Vue Résumé Simplifiée

sql

```sql
-- Vue simplifiée pour dashboard
SELECT*FROM h2_context_summary;
```

**Utilité** : Avoir un résumé en 1 ligne pour monitoring quotidien.

---

## 🗂️ Appels à Corriger (Liste)

### Call 354 (1 erreur)

* **pair_id 640** : Inversion prev4→prev3

### Call 382 (4 erreurs)

* **pair_id 644** : Inversion next1→next2
* **pair_id 645** : Inversion conseiller→client
* **pair_id 646** : Inversion prev1→conseiller
* **pair_id 647** : Inversion prev4→prev3

### Call 398 (2 erreurs)

* **pair_id 658** : Inversion next1→next2
* **pair_id 659** : Inversion prev1→conseiller

### Call 544 (4 erreurs)

* **pair_id 669** : Inversion conseiller→client
* **pair_id 670** : Inversion prev2→prev1
* **pair_id 671** : Inversion prev4→prev3
* **pair_id 684** : Inversion next1→next2

### Call 770 (1 erreur)

* **pair_id 862** : Inversion prev3→prev2

### Call 774 (5 erreurs)

* **pair_id 894** : Inversion prev4→prev3
* **pair_id 897** : Inversion next2→next3
* **pair_id 898** : Inversion conseiller→client
* **pair_id 899** : Inversion prev2→prev1
* **pair_id 900** : Inversion prev4→prev3

---

## 🔧 Requête pour Lister les Appels à Corriger

sql

```sql
-- Obtenir la liste des call_id avec nombre d'inversions
SELECT 
  call_id,
COUNT(*)as nb_inversions,
  STRING_AGG(pair_id::TEXT,', 'ORDERBY pair_id)as pair_ids,
  STRING_AGG(DISTINCT sequence_validation,' | ')as types_inversions
FROM h2_context_sequence_validation
WHERE sequence_validation LIKE'❌%'
GROUPBY call_id
ORDERBY nb_inversions DESC, call_id;
```

**Résultat** :

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">call_id</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">nb_inversions</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">pair_ids</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">types_inversions</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">774</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">5</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">894, 897, 898, 899, 900</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INVERSION prev4→prev3 | ...</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">382</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">4</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">644, 645, 646, 647</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INVERSION next1→next2 | ...</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">544</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">4</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">669, 670, 671, 684</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INVERSION conseiller→client | ...</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">398</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">2</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">658, 659</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INVERSION next1→next2 | ...</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">354</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">1</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">640</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INVERSION prev4→prev3</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">770</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">1</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">862</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">INVERSION prev3→prev2</td></tr></tbody></table></pre>

---

## 🎯 Actions Recommandées

### Immédiat ✅

1. **Valider** que 98.11% de qualité est acceptable
2. **Documenter** les 6 call_ids à corriger
3. **Continuer** avec l'intégration TypeScript

### Plus Tard ⏳

1. **Ouvrir chaque appel problématique** dans l'UI de tagging
2. **Corriger manuellement** les timestamps/tags
3. **Relancer** `refresh_h2_analysis_pairs_v2(FALSE, ARRAY['354', '382', '398', '544', '770', '774'])`
4. **Revalider** avec Test 1

---

## 📌 Requête de Validation Finale (Après Corrections)

sql

```sql
-- Vérifier que toutes les inversions sont corrigées
SELECT 
COUNT(*) FILTER (WHERE sequence_validation LIKE'❌%')as inversions_restantes,
COUNT(*)as total_pairs,
ROUND(100.0*COUNT(*) FILTER (WHERE sequence_validation ='✅ Ordre OK')/COUNT(*),2)||'%'as pct_valid
FROM h2_context_sequence_validation;
```

**Objectif** : `inversions_restantes = 0`, `pct_valid = 100.00%`

---

## 💾 Sauvegarde de cette Documentation

sql

```sql
-- Créer une table pour mémoriser les appels à corriger
CREATETABLEIFNOTEXISTS h2_validation_todos (
  id SERIALPRIMARYKEY,
  call_id TEXTNOTNULL,
  nb_inversions INTNOTNULL,
  pair_ids TEXTNOTNULL,
statusTEXTDEFAULT'pending',
  corrected_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMPDEFAULTNOW()
);

-- Insérer les appels à corriger
INSERTINTO h2_validation_todos (call_id, nb_inversions, pair_ids, notes)
VALUES
('354',1,'640','Inversion prev4→prev3'),
('382',4,'644,645,646,647','Multiple inversions'),
('398',2,'658,659','Inversions next et prev'),
('544',4,'669,670,671,684','Multiple inversions'),
('770',1,'862','Inversion prev3→prev2'),
('774',5,'894,897,898,899,900','Nombreuses inversions');

-- Consulter la TODO list
SELECT*FROM h2_validation_todos WHEREstatus='pending'ORDERBY nb_inversions DESC;
```

---

## 🎉 Conclusion

**Migration réussie avec 98.11% de qualité !**

* ✅ 901 paires créées en 68ms
* ✅ 884 paires valides (98.11%)
* ⚠️ 17 inversions à corriger (6 appels)
* ✅ 96.78% d'adjacence excellente/bonne

**Les erreurs sont mineures et localisées** → Peut continuer le développement TypeScript. Les corrections manuelles se feront plus tard. 🚀
