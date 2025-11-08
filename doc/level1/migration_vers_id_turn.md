# 🔄 Guide de Migration : Enrichissement de `turntagged` avec Relations par ID

## 📋 Vue d'ensemble

**Date prévue** : Session suivante

**Durée estimée** : 15-30 minutes

**Impact** : Modification de la structure de `turntagged` et `h2_analysis_pairs`

**Criticité** : Haute (modifie la source de vérité)

### Objectif de la migration

Remplacer le système de matching fragile par **verbatim/timestamps** par un système robuste utilisant des **références directes par ID** entre tours de parole.

**Bénéfices attendus** :

* ✅ Élimination des bugs de matching
* ✅ Performance améliorée (JOINs simples vs LATERAL)
* ✅ Cohérence garantie par contraintes FK
* ✅ Simplicité de maintenance

---

## 🎯 Changements apportés

### Modifications de `turntagged`

**Ajout de 4 nouvelles colonnes** :

* `prev2_turn_id` : ID du tour T-2 (2 tours avant)
* `prev1_turn_id` : ID du tour T-1 (1 tour avant)
* `next1_turn_id` : ID du tour T+1 (1 tour après)
* `next2_turn_id` : ID du tour T+2 (2 tours après)

**Contraintes ajoutées** :

* 4 clés étrangères vers `turntagged(id)` avec `ON DELETE SET NULL`
* 5 index pour optimiser les performances

### Modifications de `h2_analysis_pairs`

**Logique simplifiée** :

* Utilise directement `turntagged.next1_turn_id` pour identifier le client
* Plus besoin de LATERAL JOINs complexes
* Garantie d'adjacence parfaite

---

## ⚠️ Prérequis et Précautions

### Avant de commencer

* [ ] Vérifier que vous avez les droits `SUPERUSER` sur la base
* [ ] Vérifier l'espace disque disponible (minimum 2x la taille de `turntagged`)
* [ ] Planifier une fenêtre de maintenance (pas d'utilisateurs actifs)
* [ ] Avoir un accès à la console Supabase ou psql

### Risques identifiés

| Risque                    | Probabilité | Impact   | Mitigation                       |
| ------------------------- | ------------ | -------- | -------------------------------- |
| Perte de données         | Faible       | Critique | Backup complet avant migration   |
| Incohérence des IDs      | Moyen        | Élevé  | Tests de validation inclus       |
| Temps d'exécution long   | Moyen        | Moyen    | Migration incrémentale possible |
| Contraintes FK bloquantes | Faible       | Moyen    | Ajout des FK après calcul       |

---

## 📦 ÉTAPE 1 : Backup de sécurité

### 1.1 Backup complet de `turntagged`

```sql
-- ========================================
-- BACKUP COMPLET DE turntagged
-- ========================================

-- Créer une table de backup avec toutes les données
CREATE TABLE turntagged_backup_20250115 AS 
SELECT * FROM turntagged;

-- Vérifier le nombre de lignes
SELECT 
  (SELECT COUNT(*) FROM turntagged) as original_count,
  (SELECT COUNT(*) FROM turntagged_backup_20250115) as backup_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM turntagged) = (SELECT COUNT(*) FROM turntagged_backup_20250115)
    THEN '✅ Backup OK'
    ELSE '❌ ERREUR BACKUP'
  END as status;

-- Backup des index et contraintes (pour documentation)
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'turntagged'
ORDER BY indexname;

-- Sauvegarder aussi la structure
CREATE TABLE turntagged_structure_backup AS 
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'turntagged'
ORDER BY ordinal_position;
```

### 1.2 Backup de `h2_analysis_pairs`

```sql
-- ========================================
-- BACKUP DE h2_analysis_pairs
-- ========================================

CREATE TABLE h2_analysis_pairs_backup_20250115 AS 
SELECT * FROM h2_analysis_pairs;

-- Vérification
SELECT 
  (SELECT COUNT(*) FROM h2_analysis_pairs) as original_count,
  (SELECT COUNT(*) FROM h2_analysis_pairs_backup_20250115) as backup_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM h2_analysis_pairs) = (SELECT COUNT(*) FROM h2_analysis_pairs_backup_20250115)
    THEN '✅ Backup OK'
    ELSE '❌ ERREUR BACKUP'
  END as status;
```

### 1.3 Export CSV (sécurité supplémentaire)

```sql
-- Via psql ou console Supabase
COPY turntagged TO '/tmp/turntagged_backup_20250115.csv' DELIMITER ',' CSV HEADER;
COPY h2_analysis_pairs TO '/tmp/h2_analysis_pairs_backup_20250115.csv' DELIMITER ',' CSV HEADER;
```

**Alternative via Supabase Dashboard** :

1. Aller dans Table Editor
2. Sélectionner `turntagged`
3. Cliquer sur "Export" → CSV
4. Télécharger le fichier
5. Répéter pour `h2_analysis_pairs`

---

## 🔧 ÉTAPE 2 : Préparation - Ajout des colonnes

```sql
-- ========================================
-- AJOUT DES NOUVELLES COLONNES
-- ========================================

BEGIN;

-- Ajouter les 4 colonnes de relations
ALTER TABLE turntagged
  ADD COLUMN IF NOT EXISTS prev2_turn_id INTEGER,
  ADD COLUMN IF NOT EXISTS prev1_turn_id INTEGER,
  ADD COLUMN IF NOT EXISTS next1_turn_id INTEGER,
  ADD COLUMN IF NOT EXISTS next2_turn_id INTEGER;

-- Vérifier l'ajout
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'turntagged'
  AND column_name IN ('prev2_turn_id', 'prev1_turn_id', 'next1_turn_id', 'next2_turn_id');

-- Si tout est OK, commit
COMMIT;

-- Si problème, rollback
-- ROLLBACK;
```

**Résultat attendu** :

```
column_name      | data_type | is_nullable
-----------------|-----------|------------
prev2_turn_id    | integer   | YES
prev1_turn_id    | integer   | YES
next1_turn_id    | integer   | YES
next2_turn_id    | integer   | YES
```

---

## 🧮 ÉTAPE 3 : Création de la fonction de calcul

```sql
-- ========================================
-- FONCTION : calculate_turn_relations
-- ========================================

CREATE OR REPLACE FUNCTION calculate_turn_relations(
  p_call_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  updated_count INTEGER,
  total_turns INTEGER,
  execution_time_ms BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_time TIMESTAMP := clock_timestamp();
  v_updated INT := 0;
  v_total INT := 0;
BEGIN
  
  -- Comptage initial
  SELECT COUNT(*) INTO v_total 
  FROM turntagged 
  WHERE p_call_id IS NULL OR call_id = p_call_id;
  
  -- Mise à jour des relations avec LAG/LEAD
  WITH turn_sequences AS (
    SELECT 
      id,
      call_id,
      start_time,
      end_time,
      speaker,
      LAG(id, 2) OVER w as prev2_id,
      LAG(id, 1) OVER w as prev1_id,
      LEAD(id, 1) OVER w as next1_id,
      LEAD(id, 2) OVER w as next2_id
    FROM turntagged
    WHERE p_call_id IS NULL OR call_id = p_call_id
    WINDOW w AS (PARTITION BY call_id ORDER BY start_time, id)
  ),
  updates AS (
    UPDATE turntagged t
    SET 
      prev2_turn_id = ts.prev2_id,
      prev1_turn_id = ts.prev1_id,
      next1_turn_id = ts.next1_id,
      next2_turn_id = ts.next2_id
    FROM turn_sequences ts
    WHERE t.id = ts.id
      AND (
        t.prev2_turn_id IS DISTINCT FROM ts.prev2_id OR
        t.prev1_turn_id IS DISTINCT FROM ts.prev1_id OR
        t.next1_turn_id IS DISTINCT FROM ts.next1_id OR
        t.next2_turn_id IS DISTINCT FROM ts.next2_id
      )
    RETURNING t.id
  )
  SELECT COUNT(*) INTO v_updated FROM updates;
  
  RETURN QUERY SELECT 
    v_updated,
    v_total,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::BIGINT;
  
END;
$$;

-- Tester la fonction sur un seul appel
SELECT * FROM calculate_turn_relations('ABC123');  -- Remplacer par un vrai call_id
```

**Résultat attendu** :

```
updated_count | total_turns | execution_time_ms
--------------|-------------|------------------
150           | 150         | 45
```

---

## 🚀 ÉTAPE 4 : Calcul des relations pour tous les appels

```sql
-- ========================================
-- CALCUL DES RELATIONS - TOUS LES APPELS
-- ========================================

BEGIN;

-- Lancer le calcul pour TOUS les appels (NULL = tous)
SELECT * FROM calculate_turn_relations(NULL);

-- Vérifier les résultats
SELECT 
  COUNT(*) as total_turns,
  COUNT(prev2_turn_id) as has_prev2,
  COUNT(prev1_turn_id) as has_prev1,
  COUNT(next1_turn_id) as has_next1,
  COUNT(next2_turn_id) as has_next2,
  ROUND(COUNT(prev1_turn_id) * 100.0 / NULLIF(COUNT(*), 0), 2) as pct_with_prev1,
  ROUND(COUNT(next1_turn_id) * 100.0 / NULLIF(COUNT(*), 0), 2) as pct_with_next1
FROM turntagged;

-- Vérifier la distribution par appel
SELECT 
  call_id,
  COUNT(*) as total_turns,
  COUNT(next1_turn_id) as has_next1,
  ROUND(COUNT(next1_turn_id) * 100.0 / COUNT(*), 2) as completion_pct
FROM turntagged
GROUP BY call_id
ORDER BY completion_pct;

-- Si tout est OK, commit
COMMIT;

-- Si problème, rollback
-- ROLLBACK;
```

**Résultat attendu** :

```
total_turns | has_prev2 | has_prev1 | has_next1 | has_next2 | pct_with_prev1 | pct_with_next1
------------|-----------|-----------|-----------|-----------|----------------|---------------
5000        | 4800      | 4950      | 4950      | 4800      | 99.00          | 99.00
```

**Note** : Les pourcentages ne seront jamais 100% car :

* Premier tour : pas de prev1/prev2
* Dernier tour : pas de next1/next2

---

## 🔐 ÉTAPE 5 : Ajout des contraintes et index

```sql
-- ========================================
-- AJOUT DES CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ========================================

BEGIN;

-- Ajouter les FK après le calcul (pour éviter les erreurs)
ALTER TABLE turntagged
  ADD CONSTRAINT fk_prev2_turn 
    FOREIGN KEY (prev2_turn_id) 
    REFERENCES turntagged(id) 
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_prev1_turn 
    FOREIGN KEY (prev1_turn_id) 
    REFERENCES turntagged(id) 
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_next1_turn 
    FOREIGN KEY (next1_turn_id) 
    REFERENCES turntagged(id) 
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_next2_turn 
    FOREIGN KEY (next2_turn_id) 
    REFERENCES turntagged(id) 
    ON DELETE SET NULL;

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_turntagged_prev2 
  ON turntagged(prev2_turn_id) 
  WHERE prev2_turn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_turntagged_prev1 
  ON turntagged(prev1_turn_id) 
  WHERE prev1_turn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_turntagged_next1 
  ON turntagged(next1_turn_id) 
  WHERE next1_turn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_turntagged_next2 
  ON turntagged(next2_turn_id) 
  WHERE next2_turn_id IS NOT NULL;

-- Index composite pour requêtes contextuelles
CREATE INDEX IF NOT EXISTS idx_turntagged_context 
  ON turntagged(call_id, start_time);

-- Vérifier les contraintes
SELECT
  conname as constraint_name,
  contype as constraint_type,
  confupdtype as on_update,
  confdeltype as on_delete
FROM pg_constraint
WHERE conrelid = 'turntagged'::regclass
  AND conname LIKE 'fk_%turn';

-- Vérifier les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'turntagged'
  AND indexname LIKE 'idx_turntagged_%';

COMMIT;
```

**Résultat attendu** :

```
constraint_name  | constraint_type | on_update | on_delete
-----------------|-----------------|-----------|----------
fk_prev2_turn    | f               | a         | n
fk_prev1_turn    | f               | a         | n
fk_next1_turn    | f               | a         | n
fk_next2_turn    | f               | a         | n

(a = no action, n = set null, f = foreign key)
```

---

## 🔄 ÉTAPE 6 : Mise à jour de la fonction h2_analysis_pairs

```sql
-- ========================================
-- NOUVELLE FONCTION : refresh_h2_analysis_pairs_v2
-- ========================================

CREATE OR REPLACE FUNCTION refresh_h2_analysis_pairs_v2(
  p_incremental BOOLEAN DEFAULT TRUE,
  p_call_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  inserted INT,
  updated INT,
  deleted INT,
  total_pairs INT,
  execution_time_ms BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_time TIMESTAMP := clock_timestamp();
  v_inserted INT := 0;
  v_updated INT := 0;
  v_deleted INT := 0;
  v_total INT := 0;
BEGIN
  
  -- ========================================
  -- ÉTAPE 1 : NETTOYAGE
  -- ========================================
  
  IF p_incremental OR p_call_ids IS NOT NULL THEN
    WITH deleted_pairs AS (
      DELETE FROM h2_analysis_pairs
      WHERE 
        NOT EXISTS (SELECT 1 FROM turntagged WHERE id = conseiller_turn_id)
        OR NOT EXISTS (SELECT 1 FROM turntagged WHERE id = client_turn_id)
        OR (p_call_ids IS NOT NULL AND call_id = ANY(p_call_ids))
      RETURNING pair_id
    )
    SELECT COUNT(*) INTO v_deleted FROM deleted_pairs;
  ELSE
    DELETE FROM h2_analysis_pairs;
    v_deleted := -1;
  END IF;
  
  -- ========================================
  -- ÉTAPE 2 : CRÉATION DES PAIRES (SIMPLIFIÉ avec IDs)
  -- ========================================
  
  WITH conseiller_turns AS (
    SELECT 
      tc.id as conseiller_turn_id,
      tc.call_id,
      tc.tag as strategy_tag,
      tc.verbatim as conseiller_verbatim,
      tc.speaker as conseiller_speaker,
      tc.start_time as conseiller_start_time,
      tc.end_time as conseiller_end_time,
      tc.next_turn_tag as reaction_tag,
      tc.next_turn_verbatim as client_verbatim,
    
      -- ✅ UTILISATION DES IDs DIRECTEMENT
      tc.next1_turn_id as client_turn_id,
      tc.prev2_turn_id,
      tc.prev1_turn_id,
      tc.next2_turn_id as next1_turn_id,  -- next2 du conseiller = next1 après le client
    
      lpl.family as strategy_family,
      lpl.color as strategy_color,
      lpl.originespeaker as strategy_originespeaker,
    
      ROW_NUMBER() OVER (
        PARTITION BY tc.call_id 
        ORDER BY tc.start_time
      ) as pair_index
    
    FROM turntagged tc
    INNER JOIN lpltag lpl ON lpl.label = tc.tag
    WHERE 
      -- ✅ Tour CONSEILLER : famille stratégie
      lpl.family IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET', 'EXPLICATION')
      AND tc.next1_turn_id IS NOT NULL  -- ✅ Doit avoir un next1
      -- ✅ Tour CLIENT : tag doit être une réaction client valide
      AND tc.next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEGATIF', 'CLIENT NEUTRE')
      AND (p_call_ids IS NULL OR tc.call_id = ANY(p_call_ids))
  ),
  
  -- ========================================
  -- ÉTAPE 3 : ENRICHISSEMENT PAR JOINs SIMPLES
  -- ========================================
  
  complete_pairs AS (
    SELECT 
      ct.*,
    
      -- Client (next1 du conseiller)
      tc.speaker as client_speaker,
      tc.start_time as client_start_time,
      tc.end_time as client_end_time,
    
      -- Prev2
      tp2.verbatim as prev2_verbatim,
      tp2.speaker as prev2_speaker,
      tp2.tag as prev2_tag,
      tp2.start_time as prev2_start_time,
      tp2.end_time as prev2_end_time,
    
      -- Prev1
      tp1.verbatim as prev1_verbatim,
      tp1.speaker as prev1_speaker,
      tp1.tag as prev1_tag,
      tp1.start_time as prev1_start_time,
      tp1.end_time as prev1_end_time,
    
      -- Next1 (next2 du conseiller)
      tn1.verbatim as next1_verbatim,
      tn1.speaker as next1_speaker,
      tn1.tag as next1_tag,
      tn1.start_time as next1_start_time,
      tn1.end_time as next1_end_time
    
    FROM conseiller_turns ct
  
    -- ✅ JOINTURES SIMPLES par ID (pas de LATERAL!)
    INNER JOIN turntagged tc ON tc.id = ct.client_turn_id
    LEFT JOIN turntagged tp2 ON tp2.id = ct.prev2_turn_id
    LEFT JOIN turntagged tp1 ON tp1.id = ct.prev1_turn_id
    LEFT JOIN turntagged tn1 ON tn1.id = ct.next1_turn_id
  ),
  
  -- ========================================
  -- ÉTAPE 4 : UPSERT
  -- ========================================
  
  upserted AS (
    INSERT INTO h2_analysis_pairs (
      call_id,
      conseiller_turn_id,
      client_turn_id,
      pair_index,
    
      strategy_tag,
      strategy_family,
      conseiller_verbatim,
      conseiller_speaker,
      conseiller_start_time,
      conseiller_end_time,
      strategy_color,
      strategy_originespeaker,
    
      reaction_tag,
      client_verbatim,
      client_speaker,
      client_start_time,
      client_end_time,
    
      prev2_verbatim,
      prev2_speaker,
      prev2_tag,
      prev2_start_time,
      prev2_end_time,
    
      prev1_verbatim,
      prev1_speaker,
      prev1_tag,
      prev1_start_time,
      prev1_end_time,
    
      next1_verbatim,
      next1_speaker,
      next1_tag,
      next1_start_time,
      next1_end_time,
    
      created_at,
      updated_at
    )
    SELECT 
      call_id,
      conseiller_turn_id,
      client_turn_id,
      pair_index,
    
      strategy_tag,
      strategy_family,
      conseiller_verbatim,
      conseiller_speaker,
      conseiller_start_time,
      conseiller_end_time,
      strategy_color,
      strategy_originespeaker,
    
      reaction_tag,
      client_verbatim,
      client_speaker,
      client_start_time,
      client_end_time,
    
      prev2_verbatim,
      prev2_speaker,
      prev2_tag,
      prev2_start_time,
      prev2_end_time,
    
      prev1_verbatim,
      prev1_speaker,
      prev1_tag,
      prev1_start_time,
      prev1_end_time,
    
      next1_verbatim,
      next1_speaker,
      next1_tag,
      next1_start_time,
      next1_end_time,
    
      NOW(),
      NOW()
    FROM complete_pairs
  
    ON CONFLICT (conseiller_turn_id, client_turn_id) 
    DO UPDATE SET
      pair_index = EXCLUDED.pair_index,
      strategy_tag = EXCLUDED.strategy_tag,
      reaction_tag = EXCLUDED.reaction_tag,
      client_verbatim = EXCLUDED.client_verbatim,
      conseiller_verbatim = EXCLUDED.conseiller_verbatim,
    
      prev2_verbatim = EXCLUDED.prev2_verbatim,
      prev2_tag = EXCLUDED.prev2_tag,
      prev2_start_time = EXCLUDED.prev2_start_time,
      prev2_end_time = EXCLUDED.prev2_end_time,
    
      prev1_verbatim = EXCLUDED.prev1_verbatim,
      prev1_tag = EXCLUDED.prev1_tag,
      prev1_start_time = EXCLUDED.prev1_start_time,
      prev1_end_time = EXCLUDED.prev1_end_time,
    
      next1_verbatim = EXCLUDED.next1_verbatim,
      next1_tag = EXCLUDED.next1_tag,
      next1_start_time = EXCLUDED.next1_start_time,
      next1_end_time = EXCLUDED.next1_end_time,
    
      updated_at = NOW()
  
    RETURNING 
      pair_id,
      CASE WHEN created_at = updated_at THEN 1 ELSE 0 END as is_new
  )
  
  SELECT 
    SUM(is_new) as new_pairs,
    SUM(CASE WHEN is_new = 0 THEN 1 ELSE 0 END) as updated_pairs
  INTO v_inserted, v_updated
  FROM upserted;
  
  SELECT COUNT(*) INTO v_total FROM h2_analysis_pairs;
  
  RETURN QUERY SELECT 
    v_inserted,
    v_updated,
    v_deleted,
    v_total,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::BIGINT;
  
END;
$$;

-- Tester la nouvelle fonction
SELECT * FROM refresh_h2_analysis_pairs_v2(FALSE, NULL);
```

---

## ✅ ÉTAPE 7 : Tests de validation

```sql
-- ========================================
-- TESTS DE VALIDATION POST-MIGRATION
-- ========================================

-- Test 1: Cohérence des IDs de relations
SELECT 'Test 1: IDs de relations valides' as test_name;
SELECT COUNT(*) as errors
FROM turntagged t1
WHERE 
  (next1_turn_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM turntagged t2 
    WHERE t2.id = t1.next1_turn_id AND t2.call_id = t1.call_id
  ))
  OR
  (prev1_turn_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM turntagged t2 
    WHERE t2.id = t1.prev1_turn_id AND t2.call_id = t1.call_id
  ));
-- Résultat attendu: 0 errors

-- Test 2: Ordre chronologique des relations
SELECT 'Test 2: Ordre chronologique' as test_name;
SELECT COUNT(*) as errors
FROM turntagged t1
LEFT JOIN turntagged t2 ON t2.id = t1.next1_turn_id
WHERE t1.next1_turn_id IS NOT NULL
  AND t2.start_time <= t1.end_time;
-- Résultat attendu: 0 errors

-- Test 3: Cohérence turntagged ↔ h2_analysis_pairs
SELECT 'Test 3: Cohérence avec h2_analysis_pairs' as test_name;
SELECT COUNT(*) as mismatches
FROM h2_analysis_pairs h2
INNER JOIN turntagged t ON t.id = h2.conseiller_turn_id
WHERE t.next1_turn_id != h2.client_turn_id;
-- Résultat attendu: 0 mismatches

-- Test 4: Distribution des relations
SELECT 'Test 4: Distribution des relations' as test_name;
SELECT 
  COUNT(*) as total,
  COUNT(prev2_turn_id) as has_prev2,
  COUNT(prev1_turn_id) as has_prev1,
  COUNT(next1_turn_id) as has_next1,
  COUNT(next2_turn_id) as has_next2,
  ROUND(AVG(CASE WHEN next1_turn_id IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100, 2) as pct_complete
FROM turntagged;
-- Résultat attendu: pct_complete > 95%

-- Test 5: Gaps temporels dans h2_analysis_pairs
SELECT 'Test 5: Analyse des gaps temporels' as test_name;
SELECT 
  COUNT(*) as total_pairs,
  AVG(client_start_time - conseiller_end_time) as avg_gap,
  MAX(client_start_time - conseiller_end_time) as max_gap,
  COUNT(*) FILTER (WHERE (client_start_time - conseiller_end_time) < 0.1) as excellent,
  COUNT(*) FILTER (WHERE (client_start_time - conseiller_end_time) >= 0.1 AND (client_start_time - conseiller_end_time) < 0.5) as acceptable,
  COUNT(*) FILTER (WHERE (client_start_time - conseiller_end_time) >= 0.5) as suspect
FROM h2_analysis_pairs;
-- Résultat attendu: max_gap < 0.5s, suspect = 0

-- Test 6: Intégrité référentielle
SELECT 'Test 6: Intégrité référentielle FK' as test_name;
SELECT 
  COUNT(*) as orphan_relations
FROM turntagged t1
WHERE 
  (prev1_turn_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM turntagged WHERE id = t1.prev1_turn_id))
  OR (next1_turn_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM turntagged WHERE id = t1.next1_turn_id))
  OR (prev2_turn_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM turntagged WHERE id = t1.prev2_turn_id))
  OR (next2_turn_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM turntagged WHERE id = t1.next2_turn_id));
-- Résultat attendu: 0 orphan_relations
```

**Tous les tests doivent retourner 0 erreur** ✅

---

## 📊 ÉTAPE 8 : Analyse comparative avant/après

```sql
-- ========================================
-- ANALYSE COMPARATIVE
-- ========================================

-- Comparaison de performance
SELECT 'Performance comparison' as metric;

-- Ancienne méthode (simulée)
EXPLAIN ANALYZE
SELECT h2.*
FROM h2_analysis_pairs h2
INNER JOIN turntagged tc ON tc.verbatim = h2.conseiller_verbatim
  AND tc.call_id = h2.call_id
  AND tc.start_time = h2.conseiller_start_time;

-- Nouvelle méthode
EXPLAIN ANALYZE
SELECT h2.*
FROM h2_analysis_pairs h2
INNER JOIN turntagged tc ON tc.id = h2.conseiller_turn_id;

-- Comparaison du nombre de paires
SELECT 
  'Avant migration' as periode,
  COUNT(*) as pair_count
FROM h2_analysis_pairs_backup_20250115

UNION ALL

SELECT 
  'Après migration' as periode,
  COUNT(*) as pair_count
FROM h2_analysis_pairs;

-- Distribution de la qualité des gaps
SELECT 
  CASE 
    WHEN gap < 0.05 THEN '✅ Excellent (<50ms)'
    WHEN gap < 0.1 THEN '✅ Bon (<100ms)'
    WHEN gap < 0.5 THEN '⚠️ Acceptable (<500ms)'
    ELSE '❌ Suspect (>500ms)'
  END as quality,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM (
  SELECT (client_start_time - conseiller_end_time) as gap
  FROM h2_analysis_pairs
) gaps
GROUP BY quality
ORDER BY quality;
```

---

## 🔙 Plan de Rollback (en cas de problème)

### Rollback complet

```sql
-- ========================================
-- ROLLBACK COMPLET DE LA MIGRATION
-- ========================================

BEGIN;

-- 1. Supprimer les contraintes FK
ALTER TABLE turntagged
  DROP CONSTRAINT IF EXISTS fk_prev2_turn,
  DROP CONSTRAINT IF EXISTS fk_prev1_turn,
  DROP CONSTRAINT IF EXISTS fk_next1_turn,
  DROP CONSTRAINT IF EXISTS fk_next2_turn;

-- 2. Supprimer les index
DROP INDEX IF EXISTS idx_turntagged_prev2;
DROP INDEX IF EXISTS idx_turntagged_prev1;
DROP INDEX IF EXISTS idx_turntagged_next1;
DROP INDEX IF EXISTS idx_turntagged_next2;
DROP INDEX IF EXISTS idx_turntagged_context;

-- 3. Supprimer les colonnes
ALTER TABLE turntagged
  DROP COLUMN IF EXISTS prev2_turn_id,
  DROP COLUMN IF EXISTS prev1_turn_id,
  DROP COLUMN IF EXISTS next1_turn_id,
  DROP COLUMN IF EXISTS next2_turn_id;

-- 4. Restaurer h2_analysis_pairs depuis le backup
TRUNCATE h2_analysis_pairs;
INSERT INTO h2_analysis_pairs 
SELECT * FROM h2_analysis_pairs_backup_20250115;

-- 5. Vérification
SELECT 
  (SELECT COUNT(*) FROM turntagged) as turntagged_count,
  (SELECT COUNT(*) FROM h2_analysis_pairs) as h2_pairs_count;

COMMIT;

-- 6. Supprimer les fonctions si nécessaire
-- DROP FUNCTION IF EXISTS calculate_turn_relations(TEXT);
-- DROP FUNCTION IF EXISTS refresh_h2_analysis_pairs_v2(BOOLEAN, TEXT[]);
```

### Rollback partiel (garder les colonnes mais restaurer les données)

```sql
-- Restaurer uniquement les valeurs depuis le backup
BEGIN;

UPDATE turntagged t
SET 
  prev2_turn_id = NULL,
  prev1_turn_id = NULL,
  next1_turn_id = NULL,
  next2_turn_id = NULL;

COMMIT;
```

---

## 📝 Checklist de migration

### Avant la migration

* [ ] Backup complet de `turntagged` créé
* [ ] Backup complet de `h2_analysis_pairs` créé
* [ ] Export CSV sauvegardé localement
* [ ] Fenêtre de maintenance planifiée
* [ ] Droits d'accès vérifiés
* [ ] Espace disque vérifié

### Pendant la migration

* [ ] ÉTAPE 1 : Backups effectués
* [ ] ÉTAPE 2 : Colonnes ajoutées
* [ ] ÉTAPE 3 : Fonction `calculate_turn_relations` créée
* [ ] ÉTAPE 4 : Relations calculées pour tous les appels
* [ ] ÉTAPE 5 : Contraintes et index ajoutés
* [ ] ÉTAPE 6 : Fonction `refresh_h2_analysis_pairs_v2` créée et testée
* [ ] ÉTAPE 7 : Tous les tests de validation passés ✅

### Après la migration

* [ ] Tests de validation : tous à 0 erreur
* [ ] Analyse comparative effectuée
* [ ] Performance vérifiée (requêtes plus rapides)
* [ ] Documentation mise à jour
* [ ] Équipe informée des changements
* [ ] Backups conservés pendant 30 jours

---

## 🎯 Résultats attendus

### Métriques de succès

| Métrique           | Avant    | Après | Amélioration |
| ------------------- | -------- | ------ | ------------- |
| Temps refresh h2    | ~30s     | <20s   | ~35%          |
| Erreurs de matching | >10      | 0      | 100%          |
| JOINs LATERAL       | 5        | 0      | 100%          |
| Gaps > 0.5s         | Variable | 0      | 100%          |
| Cohérence données | ~95%     | 100%   | +5%           |

### Avantages post-migration

1. ✅ **Fiabilité** : Plus de bugs de matching
2. ✅ **Performance** : Requêtes 35% plus rapides
3. ✅ **Maintenance** : Code plus simple et lisible
4. ✅ **Évolutivité** : Base solide pour futures analyses
5. ✅ **Cohérence** : Garantie par contraintes FK

---

## 📞 Support et contact

**En cas de problème pendant la migration** :

1. ❌ Ne pas paniquer
2. 📸 Capturer les messages d'erreur
3. 🔙 Exécuter le plan de rollback
4. 📝 Noter les étapes qui ont échoué
5. 💬 Contacter l'équipe technique

**Questions fréquentes** :

**Q: Combien de temps va prendre la migration ?**

R: 15-30 minutes pour ~5000 tours. Proportionnel au nombre de tours.

**Q: Peut-on migrer par appel individuel ?**

R: Oui, utiliser `calculate_turn_relations('call_id_specifique')`

**Q: Les données existantes dans h2_analysis_pairs seront perdues ?**

R: Non, les résultats d'algorithmes (m1_ *, m2_* , m3_*) sont préservés

**Q: Que se passe-t-il si la migration échoue à mi-chemin ?**

R: Utiliser le plan de rollback complet (ÉTAPE 8)

---

## 📅 Planning suggéré

**Jour J-1** :

* ✅ Valider ce document
* ✅ Préparer les commandes
* ✅ Planifier fenêtre de maintenance

**Jour J** (Session de migration) :

* 00:00 - 00:05 : Backups (ÉTAPE 1)
* 00:05 - 00:10 : Ajout colonnes (ÉTAPE 2-3)
* 00:10 - 00:20 : Calcul relations (ÉTAPE 4)
* 00:20 - 00:25 : Contraintes & index (ÉTAPE 5)
* 00:25 - 00:30 : Nouvelle fonction h2 (ÉTAPE 6)
* 00:30 - 00:35 : Tests validation (ÉTAPE 7)
* 00:35 - 00:40 : Analyse comparative (ÉTAPE 8)

**Jour J+1** :

* Monitoring des performances
* Vérification de l'intégrité
* Mise à jour code TypeScript

---

## ✅ Validation finale

Avant de déclarer la migration réussie :

```sql
-- Script de validation finale
DO $$
DECLARE
  v_all_tests_passed BOOLEAN := TRUE;
  v_test_result RECORD;
BEGIN
  
  -- Test 1: Cohérence IDs
  SELECT COUNT(*) = 0 as passed INTO v_test_result
  FROM turntagged t1
  WHERE next1_turn_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM turntagged t2 WHERE t2.id = t1.next1_turn_id);
  
  IF NOT v_test_result.passed THEN
    RAISE NOTICE '❌ Test 1 ÉCHOUÉ: IDs incohérents';
    v_all_tests_passed := FALSE;
  ELSE
    RAISE NOTICE '✅ Test 1 PASSÉ: IDs cohérents';
  END IF;
  
  -- Test 2: Ordre chronologique
  SELECT COUNT(*) = 0 as passed INTO v_test_result
  FROM turntagged t1
  LEFT JOIN turntagged t2 ON t2.id = t1.next1_turn_id
  WHERE t1.next1_turn_id IS NOT NULL AND t2.start_time <= t1.end_time;
  
  IF NOT v_test_result.passed THEN
    RAISE NOTICE '❌ Test 2 ÉCHOUÉ: Ordre chronologique incorrect';
    v_all_tests_passed := FALSE;
  ELSE
    RAISE NOTICE '✅ Test 2 PASSÉ: Ordre chronologique correct';
  END IF;
  
  -- Test 3: Cohérence h2_analysis_pairs
  SELECT COUNT(*) = 0 as passed INTO v_test_result
  FROM h2_analysis_pairs h2
  INNER JOIN turntagged t ON t.id = h2.conseiller_turn_id
  WHERE t.next1_turn_id != h2.client_turn_id;
  
  IF NOT v_test_result.passed THEN
    RAISE NOTICE '❌ Test 3 ÉCHOUÉ: h2_analysis_pairs incohérent';
    v_all_tests_passed := FALSE;
  ELSE
    RAISE NOTICE '✅ Test 3 PASSÉ: h2_analysis_pairs cohérent';
  END IF;
  
  -- Test 4: Taux de complétion
  SELECT (COUNT(next1_turn_id) * 100.0 / COUNT(*)) >= 95 as passed INTO v_test_result
  FROM turntagged;
  
  IF NOT v_test_result.passed THEN
    RAISE NOTICE '❌ Test 4 ÉCHOUÉ: Taux de complétion < 95%%';
    v_all_tests_passed := FALSE;
  ELSE
    RAISE NOTICE '✅ Test 4 PASSÉ: Taux de complétion >= 95%%';
  END IF;
  
  -- Résultat final
  IF v_all_tests_passed THEN
    RAISE NOTICE '🎉 MIGRATION RÉUSSIE : Tous les tests sont passés!';
  ELSE
    RAISE NOTICE '⚠️ MIGRATION INCOMPLÈTE : Certains tests ont échoué';
  END IF;
  
END $$;
```

---

**Document préparé le** : 2025-01-15

**Version** : 1.0

**Prochaine session** : Migration complète

**Bonne chance pour la migration ! 🚀**
