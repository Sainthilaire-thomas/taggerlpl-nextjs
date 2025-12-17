# Architecture Unifiée - Synchronisation Automatique
## Maintien Cohérence analysis_pairs ↔ annotations

================================================================================
## PROBLÉMATIQUE
================================================================================

### Flux de Données
````
Pipeline standard :
turntagged → analysis_pairs → annotations
    ↓             ↓                ↓
  Source       Calculs        Historique
  manuelle     X,Y,M1,M2,M3   Multi-annotateurs
````

**Questions :**
1. Quand créer l'entrée dans `annotations` ?
2. Comment identifier l'annotateur source ?
3. Que faire si on modifie un tag dans `analysis_pairs` ?
4. Comment gérer les imports multiples ?

================================================================================
## SOLUTION : TRIGGER AUTOMATIQUE
================================================================================

### Architecture Proposée
````sql
-- ============================================================================
-- Trigger : Synchronisation automatique analysis_pairs → annotations
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_analysis_pairs_to_annotations()
RETURNS TRIGGER AS $$
DECLARE
  source_annotator TEXT;
  annotation_exists BOOLEAN;
BEGIN
  -- 1. DÉTERMINER L'ANNOTATEUR SOURCE
  
  -- Essayer de récupérer l'annotateur depuis turntagged
  SELECT DISTINCT annotator_name INTO source_annotator
  FROM turntagged
  WHERE call_id = NEW.call_id
  LIMIT 1;
  
  -- Si pas trouvé, utiliser valeur par défaut
  IF source_annotator IS NULL THEN
    source_annotator := 'system_import';
  END IF;
  
  -- 2. VÉRIFIER SI ANNOTATION EXISTE DÉJÀ
  
  SELECT EXISTS(
    SELECT 1 FROM annotations
    WHERE pair_id = NEW.pair_id
      AND annotator_type = 'human_manual'
      AND annotator_id = source_annotator
  ) INTO annotation_exists;
  
  -- 3. INSERT OU UPDATE
  
  IF NEW.strategy_tag IS NOT NULL OR NEW.reaction_tag IS NOT NULL THEN
    
    IF annotation_exists THEN
      -- UPDATE si modification
      IF TG_OP = 'UPDATE' THEN
        UPDATE annotations
        SET 
          strategy_tag = NEW.strategy_tag,
          reaction_tag = NEW.reaction_tag,
          annotation_context = jsonb_set(
            COALESCE(annotation_context, '{}'::jsonb),
            '{updated_at}',
            to_jsonb(NOW())
          )
        WHERE pair_id = NEW.pair_id
          AND annotator_type = 'human_manual'
          AND annotator_id = source_annotator;
      END IF;
      
    ELSE
      -- INSERT nouvelle annotation
      INSERT INTO annotations (
        pair_id,
        annotator_type,
        annotator_id,
        strategy_tag,
        reaction_tag,
        annotation_context,
        annotated_at
      ) VALUES (
        NEW.pair_id,
        'human_manual',
        source_annotator,
        NEW.strategy_tag,
        NEW.reaction_tag,
        jsonb_build_object(
          'source', 'analysis_pairs_sync',
          'call_id', NEW.call_id,
          'created_at', NOW(),
          'trigger', TG_OP
        ),
        COALESCE(NEW.created_at, NOW())
      )
      ON CONFLICT (pair_id, annotator_type, annotator_id) 
      DO UPDATE SET
        strategy_tag = EXCLUDED.strategy_tag,
        reaction_tag = EXCLUDED.reaction_tag,
        annotation_context = annotations.annotation_context || 
          jsonb_build_object('updated_at', NOW());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER trg_sync_to_annotations
  AFTER INSERT OR UPDATE ON analysis_pairs
  FOR EACH ROW
  WHEN (NEW.strategy_tag IS NOT NULL OR NEW.reaction_tag IS NOT NULL)
  EXECUTE FUNCTION sync_analysis_pairs_to_annotations();

COMMENT ON FUNCTION sync_analysis_pairs_to_annotations() IS 
  'Synchronise automatiquement les tags de analysis_pairs vers annotations';
````

================================================================================
## CAS D'USAGE DÉTAILLÉS
================================================================================

### Cas 1 : Nouvel Import turntagged → analysis_pairs

**Scénario :**
````sql
-- 1. Import nouveau call dans turntagged
INSERT INTO turntagged (call_id, annotator_name, ...)
VALUES (123, 'thomas', ...);

-- 2. Fonction RPC crée analysis_pairs
SELECT create_analysis_pairs_for_call(123);

-- 3. analysis_pairs créé avec tags
INSERT INTO analysis_pairs (pair_id, call_id, strategy_tag, reaction_tag)
VALUES (5000, 123, 'ENGAGEMENT', 'CLIENT_POSITIF');

-- 4. ✅ TRIGGER se déclenche automatiquement
-- → Crée entrée dans annotations :
--   annotator_type='human_manual', 
--   annotator_id='thomas'
````

**Résultat :**
````sql
SELECT * FROM annotations WHERE pair_id = 5000;

-- pair_id | annotator_type | annotator_id | strategy_tag | reaction_tag
-- 5000    | human_manual   | thomas       | ENGAGEMENT   | CLIENT_POSITIF
````

### Cas 2 : Modification Tag dans analysis_pairs

**Scénario :**
````sql
-- Correction manuelle d'un tag
UPDATE analysis_pairs
SET reaction_tag = 'CLIENT_NEUTRE'
WHERE pair_id = 5000;

-- ✅ TRIGGER se déclenche automatiquement
-- → Update l'entrée existante dans annotations
--   + Ajoute timestamp 'updated_at' dans annotation_context
````

**Résultat :**
````sql
SELECT * FROM annotations WHERE pair_id = 5000;

-- reaction_tag passé à CLIENT_NEUTRE
-- annotation_context contient : 
-- {"source": "analysis_pairs_sync", "updated_at": "2024-12-17T10:30:00Z"}
````

### Cas 3 : Import Multiple (ré-exécution RPC)

**Scénario :**
````sql
-- Ré-import du même call (correction source)
SELECT create_analysis_pairs_for_call(123);

-- ✅ ON CONFLICT dans le trigger
-- → N'insère PAS de doublon
-- → Update si tags ont changé
````

### Cas 4 : Annotations LLM (pas touché par trigger)

**Scénario :**
````sql
-- Test Level 0 avec LLM
INSERT INTO annotations (
  pair_id,
  annotator_type,
  annotator_id,
  reaction_tag,
  confidence,
  test_id
) VALUES (
  5000,
  'llm_openai',
  'CharteY_B',
  'CLIENT_POSITIF',
  0.92,
  'uuid-test-123'
);

-- ✅ Pas de conflit avec trigger
-- → annotations contient maintenant 2 lignes pour pair_id=5000 :
--   1. human_manual/thomas
--   2. llm_openai/CharteY_B
````

================================================================================
## GESTION DES ANNOTATEURS
================================================================================

### Stratégie Identification Annotateur
````sql
-- ============================================================================
-- Fonction : Identifier annotateur source
-- ============================================================================

CREATE OR REPLACE FUNCTION get_source_annotator(p_call_id INT)
RETURNS TEXT AS $$
DECLARE
  annotator TEXT;
BEGIN
  -- 1. Essayer depuis turntagged
  SELECT DISTINCT annotator_name INTO annotator
  FROM turntagged
  WHERE call_id = p_call_id
  LIMIT 1;
  
  IF annotator IS NOT NULL THEN
    RETURN annotator;
  END IF;
  
  -- 2. Essayer depuis metadata call (si colonne existe)
  -- SELECT annotator INTO annotator
  -- FROM calls
  -- WHERE call_id = p_call_id;
  
  -- 3. Valeur par défaut
  RETURN 'system_import';
END;
$$ LANGUAGE plpgsql;
````

### Table Annotateurs (recommandé)
````sql
-- ============================================================================
-- Table référentielle des annotateurs
-- Permet traçabilité et statistiques
-- ============================================================================

CREATE TABLE annotators (
  annotator_id TEXT PRIMARY KEY,
  annotator_name TEXT NOT NULL,
  annotator_type TEXT CHECK (annotator_type IN ('human', 'llm', 'system')),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Annotateurs initiaux
INSERT INTO annotators (annotator_id, annotator_name, annotator_type) VALUES
  ('thomas', 'Thomas Renaudin', 'human'),
  ('system_import', 'Système (import)', 'system'),
  ('CharteY_A', 'LLM - Charte Y Minimaliste', 'llm'),
  ('CharteY_B', 'LLM - Charte Y Enrichie', 'llm'),
  ('CharteY_C', 'LLM - Charte Y Binaire', 'llm'),
  ('CharteX_A', 'LLM - Charte X Sans Contexte', 'llm'),
  ('CharteX_B', 'LLM - Charte X Avec Contexte', 'llm');

-- Contrainte FK (optionnelle, mais recommandée)
ALTER TABLE annotations
  ADD CONSTRAINT fk_annotations_annotator
  FOREIGN KEY (annotator_id) 
  REFERENCES annotators(annotator_id);
````

================================================================================
## MODIFICATIONS FONCTION RPC EXISTANTE
================================================================================

### Option A : Laisser le Trigger Gérer (RECOMMANDÉ)

**Avantage :** Séparation des responsabilités
- RPC crée analysis_pairs
- Trigger synchronise vers annotations

**Code RPC inchangé :**
````sql
-- Fonction RPC existante continue de fonctionner
CREATE OR REPLACE FUNCTION create_analysis_pairs_for_call(...)
-- ... code existant ...
-- Pas de modification nécessaire !
-- Le trigger se charge de la sync
````

### Option B : RPC Gère Tout (plus couplé)

**Si tu préfères tout centraliser :**
````sql
CREATE OR REPLACE FUNCTION create_analysis_pairs_for_call(p_call_id INT)
RETURNS void AS $$
DECLARE
  new_pair_id INT;
  source_annotator TEXT;
BEGIN
  -- Récupérer annotateur
  source_annotator := get_source_annotator(p_call_id);
  
  -- Créer analysis_pairs (code existant)
  INSERT INTO analysis_pairs (...)
  VALUES (...)
  RETURNING pair_id INTO new_pair_id;
  
  -- Créer annotation immédiatement
  INSERT INTO annotations (
    pair_id,
    annotator_type,
    annotator_id,
    strategy_tag,
    reaction_tag,
    annotation_context,
    annotated_at
  ) VALUES (
    new_pair_id,
    'human_manual',
    source_annotator,
    -- récupérer tags depuis analysis_pairs qu'on vient de créer
    ...
  );
END;
$$ LANGUAGE plpgsql;
````

**Ma recommandation :** **Option A (Trigger)** car :
- Plus flexible
- Fonctionne aussi pour modifications manuelles
- Moins de code à maintenir
- Testable indépendamment

================================================================================
## SCRIPT MIGRATION DONNÉES EXISTANTES
================================================================================

### Importer Annotations Existantes
````sql
-- ============================================================================
-- Migration : Importer annotations depuis analysis_pairs existant
-- ============================================================================

DO $$
DECLARE
  imported_count INT := 0;
  default_annotator TEXT := 'thomas_initial';
BEGIN
  -- Import avec identification annotateur depuis turntagged
  INSERT INTO annotations (
    pair_id,
    annotator_type,
    annotator_id,
    strategy_tag,
    reaction_tag,
    annotation_context,
    annotated_at
  )
  SELECT 
    ap.pair_id,
    'human_manual',
    COALESCE(
      (SELECT DISTINCT tt.annotator_name 
       FROM turntagged tt 
       WHERE tt.call_id = ap.call_id 
       LIMIT 1),
      default_annotator
    ),
    ap.strategy_tag,
    ap.reaction_tag,
    jsonb_build_object(
      'source', 'migration_2024_12_17',
      'original_created_at', ap.created_at,
      'call_id', ap.call_id
    ),
    ap.created_at
  FROM analysis_pairs ap
  WHERE (ap.strategy_tag IS NOT NULL OR ap.reaction_tag IS NOT NULL)
  ON CONFLICT (pair_id, annotator_type, annotator_id) DO NOTHING;
  
  GET DIAGNOSTICS imported_count = ROW_COUNT;
  
  RAISE NOTICE 'Migration completed: % annotations imported', imported_count;
END $$;

-- Vérifier import
SELECT 
  annotator_id,
  COUNT(*) as nb_annotations,
  COUNT(strategy_tag) as nb_strategy,
  COUNT(reaction_tag) as nb_reaction
FROM annotations
WHERE annotator_type = 'human_manual'
GROUP BY annotator_id;
````

================================================================================
## VÉRIFICATIONS & TESTS
================================================================================

### Test 1 : Trigger se déclenche sur INSERT
````sql
-- Test insertion
INSERT INTO analysis_pairs (
  pair_id, call_id, strategy_tag, reaction_tag
) VALUES (
  99999, 1, 'ENGAGEMENT', 'CLIENT_POSITIF'
);

-- Vérifier annotation créée
SELECT * FROM annotations WHERE pair_id = 99999;
-- Attendu : 1 ligne, annotator_type='human_manual'

-- Cleanup
DELETE FROM annotations WHERE pair_id = 99999;
DELETE FROM analysis_pairs WHERE pair_id = 99999;
````

### Test 2 : Trigger se déclenche sur UPDATE
````sql
-- Modifier tag
UPDATE analysis_pairs
SET reaction_tag = 'CLIENT_NEUTRE'
WHERE pair_id = 1;

-- Vérifier mise à jour
SELECT reaction_tag, annotation_context->>'updated_at'
FROM annotations 
WHERE pair_id = 1 AND annotator_type = 'human_manual';
-- Attendu : reaction_tag='CLIENT_NEUTRE', updated_at présent
````

### Test 3 : Pas de doublon
````sql
-- Ré-insérer (simulation ré-import)
INSERT INTO analysis_pairs (pair_id, call_id, strategy_tag, reaction_tag)
VALUES (1, 1, 'ENGAGEMENT', 'CLIENT_POSITIF')
ON CONFLICT (pair_id) DO UPDATE
SET strategy_tag = EXCLUDED.strategy_tag;

-- Vérifier qu'il n'y a qu'une seule annotation
SELECT COUNT(*) FROM annotations 
WHERE pair_id = 1 AND annotator_type = 'human_manual';
-- Attendu : 1 (pas de doublon)
````

### Test 4 : Annotations LLM indépendantes
````sql
-- Ajouter annotation LLM
INSERT INTO annotations (
  pair_id, annotator_type, annotator_id, reaction_tag, confidence
) VALUES (
  1, 'llm_openai', 'CharteY_B', 'CLIENT_POSITIF', 0.92
);

-- Vérifier coexistence
SELECT annotator_type, annotator_id, reaction_tag
FROM annotations 
WHERE pair_id = 1;
-- Attendu : 2 lignes (human_manual + llm_openai)
````

================================================================================
## MONITORING & LOGS
================================================================================

### Vue Statistiques Synchronisation
````sql
-- ============================================================================
-- Vue : Statut synchronisation analysis_pairs ↔ annotations
-- ============================================================================

CREATE VIEW sync_status AS
SELECT 
  COUNT(DISTINCT ap.pair_id) as total_pairs,
  COUNT(DISTINCT a.pair_id) as pairs_with_annotations,
  COUNT(DISTINCT ap.pair_id) - COUNT(DISTINCT a.pair_id) as missing_annotations,
  ROUND(
    100.0 * COUNT(DISTINCT a.pair_id) / NULLIF(COUNT(DISTINCT ap.pair_id), 0),
    2
  ) as sync_percentage
FROM analysis_pairs ap
LEFT JOIN annotations a 
  ON ap.pair_id = a.pair_id 
  AND a.annotator_type = 'human_manual'
WHERE ap.strategy_tag IS NOT NULL OR ap.reaction_tag IS NOT NULL;

-- Utilisation
SELECT * FROM sync_status;
-- Attendu après migration : sync_percentage = 100.00
````

### Identifier Paires Désynchronisées
````sql
-- Paires dans analysis_pairs mais pas dans annotations
SELECT 
  ap.pair_id,
  ap.call_id,
  ap.strategy_tag,
  ap.reaction_tag,
  ap.created_at
FROM analysis_pairs ap
LEFT JOIN annotations a 
  ON ap.pair_id = a.pair_id 
  AND a.annotator_type = 'human_manual'
WHERE (ap.strategy_tag IS NOT NULL OR ap.reaction_tag IS NOT NULL)
  AND a.annotation_id IS NULL
ORDER BY ap.pair_id
LIMIT 10;
````

================================================================================
## DOCUMENTATION POUR L'ÉQUIPE
================================================================================

### README.md - Section Synchronisation
````markdown
## Synchronisation analysis_pairs ↔ annotations

### Fonctionnement Automatique

Les tags dans `analysis_pairs` sont **automatiquement** synchronisés 
vers `annotations` via un trigger PostgreSQL.

**Flux :**
1. turntagged → analysis_pairs (via RPC)
2. analysis_pairs → annotations (via TRIGGER automatique)

**Pas d'action manuelle requise !**

### Vérifier Synchronisation
```sql
-- Vérifier statut global
SELECT * FROM sync_status;

-- Vérifier paire spécifique
SELECT * FROM annotations WHERE pair_id = 123;
```

### En Cas de Désynchronisation
```sql
-- Forcer resynchronisation d'une paire
UPDATE analysis_pairs
SET strategy_tag = strategy_tag
WHERE pair_id = 123;
-- Le trigger se déclenche et crée/update l'annotation
```

### Désactiver Temporairement (debug)
```sql
-- Désactiver trigger
ALTER TABLE analysis_pairs DISABLE TRIGGER trg_sync_to_annotations;

-- ... opérations ...

-- Réactiver trigger
ALTER TABLE analysis_pairs ENABLE TRIGGER trg_sync_to_annotations;
```
````

================================================================================
## RÉPONSE À TA QUESTION
================================================================================

**Question :** Comment maintenir cohérence analysis_pairs → annotations 
lors de nouveaux imports ?

**Réponse :** **TRIGGER AUTOMATIQUE** ✅

1. **Création :** Trigger se déclenche sur INSERT analysis_pairs
2. **Modification :** Trigger se déclenche sur UPDATE analysis_pairs
3. **Pas de doublon :** ON CONFLICT gère les ré-imports
4. **Annotateur :** Récupéré depuis turntagged ou 'system_import'
5. **Transparent :** Aucune modification RPC nécessaire

**Avantages :**
- ✅ Automatique (zéro action manuelle)
- ✅ Toujours cohérent
- ✅ Fonctionne pour tous les cas (import, modification, correction)
- ✅ Pas de couplage fort avec RPC existante
- ✅ Testable indépendamment

**Ta fonction RPC reste inchangée** : elle continue de créer 
analysis_pairs, et le trigger s'occupe de synchroniser vers annotations.

================================================================================
FIN DU DOCUMENT
================================================================================
