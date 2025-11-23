# STRATÉGIE DE RATIONALISATION : h2_analysis_pairs → analysis_pairs

**Date** : 19 novembre 2025  
**Contexte** : Migration post-architecture 3 phases  
**Volume actuel** : 901 paires  
**Volume prévu** : Plusieurs milliers (pas à court terme)

---

## 🎯 OBJECTIFS

### Objectifs Primaires
1. **Centraliser** toutes les analyses (Level 0, 1, 2) dans une seule table
2. **Clarifier** le naming des colonnes (X/Y explicites vs `next_turn_tag_auto`)
3. **Optimiser** le stockage du contexte (flexible mais pragmatique)
4. **Simplifier** le versioning (alignement avec `algorithm_version_registry`)

### Objectifs Secondaires
1. **Maintenir** les performances actuelles (éviter les jointures lourdes)
2. **Faciliter** l'ajout de nouveaux algorithmes
3. **Préserver** la traçabilité scientifique
4. **Permettre** l'extension future du contexte (cas ponctuels)

---

## 📊 ARCHITECTURE CIBLE

### Nouvelle Table `analysis_pairs`

```sql
CREATE TABLE public.analysis_pairs (
  -- ═══════════════════════════════════════════════════════════
  -- IDENTIFIANTS & MÉTADONNÉES BASE
  -- ═══════════════════════════════════════════════════════════
  pair_id BIGSERIAL PRIMARY KEY,
  call_id TEXT NOT NULL,
  pair_index INTEGER NOT NULL,
  
  -- ═══════════════════════════════════════════════════════════
  -- TOUR CONSEILLER (Stratégie)
  -- ═══════════════════════════════════════════════════════════
  conseiller_turn_id INTEGER NOT NULL,
  strategy_tag TEXT NOT NULL,                    -- Tag brut (ex: REFLET_ACQ)
  strategy_family TEXT NOT NULL,                 -- Famille (ENGAGEMENT, OUVERTURE, etc.)
  conseiller_verbatim TEXT NOT NULL,
  conseiller_speaker TEXT,
  conseiller_start_time DOUBLE PRECISION NOT NULL,
  conseiller_end_time DOUBLE PRECISION NOT NULL,
  strategy_color TEXT,                           -- Pour UI
  strategy_originespeaker TEXT,
  
  -- ═══════════════════════════════════════════════════════════
  -- TOUR CLIENT (Réaction)
  -- ═══════════════════════════════════════════════════════════
  client_turn_id INTEGER NOT NULL,
  reaction_tag TEXT NOT NULL,                    -- CLIENT_POSITIF/NEUTRE/NEGATIF
  client_verbatim TEXT NOT NULL,
  client_speaker TEXT,
  client_start_time DOUBLE PRECISION NOT NULL,
  client_end_time DOUBLE PRECISION NOT NULL,
  
  -- ═══════════════════════════════════════════════════════════
  -- CONTEXTE STANDARD (suffisant pour 90% des cas)
  -- ═══════════════════════════════════════════════════════════
  -- Contexte précédent (3 tours)
  prev3_turn_id INTEGER,
  prev3_verbatim TEXT,
  prev3_speaker TEXT,
  prev3_tag TEXT,
  prev3_start_time DOUBLE PRECISION,
  prev3_end_time DOUBLE PRECISION,
  
  prev2_turn_id INTEGER,
  prev2_verbatim TEXT,
  prev2_speaker TEXT,
  prev2_tag TEXT,
  prev2_start_time DOUBLE PRECISION,
  prev2_end_time DOUBLE PRECISION,
  
  prev1_turn_id INTEGER,
  prev1_verbatim TEXT,
  prev1_speaker TEXT,
  prev1_tag TEXT,
  prev1_start_time DOUBLE PRECISION,
  prev1_end_time DOUBLE PRECISION,
  
  -- Contexte suivant (3 tours)
  next1_turn_id INTEGER,
  next1_verbatim TEXT,
  next1_speaker TEXT,
  next1_tag TEXT,
  next1_start_time DOUBLE PRECISION,
  next1_end_time DOUBLE PRECISION,
  
  next2_turn_id INTEGER,
  next2_verbatim TEXT,
  next2_speaker TEXT,
  next2_tag TEXT,
  next2_start_time DOUBLE PRECISION,
  next2_end_time DOUBLE PRECISION,
  
  next3_turn_id INTEGER,
  next3_verbatim TEXT,
  next3_speaker TEXT,
  next3_tag TEXT,
  next3_start_time DOUBLE PRECISION,
  next3_end_time DOUBLE PRECISION,
  
  -- ═══════════════════════════════════════════════════════════
  -- CONTEXTE ÉTENDU (pour cas ponctuels)
  -- Stockage JSON pour flexibilité sans alourdir la table
  -- ═══════════════════════════════════════════════════════════
  extended_context JSONB DEFAULT NULL,
  -- Structure : 
  -- {
  --   "prev": [
  --     {"turn_id": 123, "verbatim": "...", "tag": "...", ...},  -- prev4
  --     {"turn_id": 124, "verbatim": "...", "tag": "...", ...}   -- prev5
  --   ],
  --   "next": [
  --     {"turn_id": 130, "verbatim": "...", "tag": "...", ...},  -- next4
  --     {"turn_id": 131, "verbatim": "...", "tag": "...", ...}   -- next5
  --   ]
  -- }
  
  -- ═══════════════════════════════════════════════════════════
  -- LEVEL 0 : GOLD STANDARD (Annotation Manuelle)
  -- ═══════════════════════════════════════════════════════════
  level0_gold_conseiller TEXT,                   -- Tag validé manuellement (conseiller)
  level0_gold_client TEXT,                       -- Tag validé manuellement (client)
  level0_annotator_agreement NUMERIC,            -- Kappa inter-annotateurs
  level0_validated_at TIMESTAMP,
  level0_validated_by TEXT,                      -- Nom de l'annotateur
  level0_notes TEXT,                             -- Notes de validation
  
  -- ═══════════════════════════════════════════════════════════
  -- LEVEL 1 : ALGORITHME X (Classification Conseiller)
  -- ═══════════════════════════════════════════════════════════
  x_predicted_tag TEXT,                          -- ENGAGEMENT, OUVERTURE, REFLET_*, EXPLICATION
  x_confidence NUMERIC,                          -- 0.0 - 1.0
  x_algorithm_key TEXT,                          -- 'regex_conseiller_v1', 'openai_conseiller_v2'
  x_algorithm_version TEXT,                      -- Version exacte (ex: '1a2b3')
  x_evidences JSONB,                             -- Preuves/features détectées
  x_computed_at TIMESTAMP,
  x_computation_time_ms INTEGER,                 -- Performance tracking
  
  -- ═══════════════════════════════════════════════════════════
  -- LEVEL 1 : ALGORITHME Y (Classification Client)
  -- ═══════════════════════════════════════════════════════════
  y_predicted_tag TEXT,                          -- CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF
  y_confidence NUMERIC,                          -- 0.0 - 1.0
  y_algorithm_key TEXT,                          -- 'regex_client_v1', 'openai_y_v2'
  y_algorithm_version TEXT,                      -- Version exacte
  y_evidences JSONB,                             -- Indices détectés (mots clés, patterns)
  y_computed_at TIMESTAMP,
  y_computation_time_ms INTEGER,
  
  -- ═══════════════════════════════════════════════════════════
  -- LEVEL 2 : MÉDIATEUR M1 (Densité Verbes d'Action)
  -- ═══════════════════════════════════════════════════════════
  m1_verb_density NUMERIC,                       -- Ratio verbes action / mots totaux
  m1_verb_count INTEGER,                         -- Nombre de verbes d'action détectés
  m1_total_words INTEGER,                        -- Nombre total de mots
  m1_action_verbs TEXT[],                        -- Liste des verbes détectés
  m1_algorithm_key TEXT,
  m1_algorithm_version TEXT,
  m1_computed_at TIMESTAMP,
  
  -- ═══════════════════════════════════════════════════════════
  -- LEVEL 2 : MÉDIATEUR M2 (Alignement Linguistique)
  -- ═══════════════════════════════════════════════════════════
  m2_lexical_alignment NUMERIC,                  -- Alignement lexical (0-1)
  m2_semantic_alignment NUMERIC,                 -- Alignement sémantique (0-1)
  m2_global_alignment NUMERIC,                   -- Score global
  m2_shared_terms TEXT[],                        -- Termes partagés
  m2_algorithm_key TEXT,
  m2_algorithm_version TEXT,
  m2_computed_at TIMESTAMP,
  
  -- ═══════════════════════════════════════════════════════════
  -- LEVEL 2 : MÉDIATEUR M3 (Charge Cognitive)
  -- ═══════════════════════════════════════════════════════════
  m3_hesitation_count INTEGER,                   -- Nombre d'hésitations
  m3_clarification_count INTEGER,                -- Nombre de clarifications
  m3_cognitive_score NUMERIC,                    -- Score de charge cognitive
  m3_cognitive_load TEXT,                        -- 'low', 'medium', 'high'
  m3_patterns JSONB,                             -- Patterns détectés
  m3_algorithm_key TEXT,
  m3_algorithm_version TEXT,
  m3_computed_at TIMESTAMP,
  
  -- ═══════════════════════════════════════════════════════════
  -- MÉTADONNÉES SYSTÈME
  -- ═══════════════════════════════════════════════════════════
  computation_status TEXT DEFAULT 'pending'      -- 'pending', 'partial', 'complete', 'error'
    CHECK (computation_status IN ('pending', 'partial', 'complete', 'error')),
  annotations JSONB DEFAULT '[]'::jsonb,         -- Annotations utilisateur
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- ═══════════════════════════════════════════════════════════
  -- CONTRAINTES
  -- ═══════════════════════════════════════════════════════════
  CONSTRAINT chk_strategy_family 
    CHECK (strategy_family IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET', 'EXPLICATION')),
  CONSTRAINT chk_reaction_tag 
    CHECK (reaction_tag IN ('CLIENT_POSITIF', 'CLIENT_NEUTRE', 'CLIENT_NEGATIF')),
  CONSTRAINT chk_x_predicted_tag 
    CHECK (x_predicted_tag IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET_ACQ', 'REFLET_JE', 'REFLET_VOUS', 'EXPLICATION') OR x_predicted_tag IS NULL),
  CONSTRAINT chk_y_predicted_tag 
    CHECK (y_predicted_tag IN ('CLIENT_POSITIF', 'CLIENT_NEUTRE', 'CLIENT_NEGATIF') OR y_predicted_tag IS NULL),
  CONSTRAINT chk_confidences 
    CHECK (
      (x_confidence IS NULL OR (x_confidence >= 0 AND x_confidence <= 1)) AND
      (y_confidence IS NULL OR (y_confidence >= 0 AND y_confidence <= 1))
    )
);

-- ═══════════════════════════════════════════════════════════
-- INDEX POUR PERFORMANCE
-- ═══════════════════════════════════════════════════════════

-- Index pour recherches fréquentes
CREATE INDEX idx_analysis_pairs_call_id ON analysis_pairs(call_id);
CREATE INDEX idx_analysis_pairs_strategy_family ON analysis_pairs(strategy_family);
CREATE INDEX idx_analysis_pairs_reaction_tag ON analysis_pairs(reaction_tag);

-- Index pour Level 0 (Gold Standard)
CREATE INDEX idx_analysis_pairs_level0_status 
  ON analysis_pairs(level0_gold_conseiller, level0_gold_client) 
  WHERE level0_gold_conseiller IS NOT NULL;

-- Index pour Level 1 (Validation)
CREATE INDEX idx_analysis_pairs_x_predicted ON analysis_pairs(x_predicted_tag) 
  WHERE x_predicted_tag IS NOT NULL;
CREATE INDEX idx_analysis_pairs_y_predicted ON analysis_pairs(y_predicted_tag) 
  WHERE y_predicted_tag IS NOT NULL;
CREATE INDEX idx_analysis_pairs_xy_algorithms ON analysis_pairs(x_algorithm_key, y_algorithm_key);

-- Index pour Level 2 (Médiation)
CREATE INDEX idx_analysis_pairs_mediators 
  ON analysis_pairs(m1_verb_density, m2_lexical_alignment, m3_cognitive_score)
  WHERE computation_status = 'complete';

-- Index pour status global
CREATE INDEX idx_analysis_pairs_status ON analysis_pairs(computation_status);

-- Index pour recherches temporelles
CREATE INDEX idx_analysis_pairs_updated_at ON analysis_pairs(updated_at DESC);

-- Index GIN pour recherches JSON
CREATE INDEX idx_analysis_pairs_extended_context ON analysis_pairs USING GIN(extended_context)
  WHERE extended_context IS NOT NULL;
CREATE INDEX idx_analysis_pairs_x_evidences ON analysis_pairs USING GIN(x_evidences)
  WHERE x_evidences IS NOT NULL;
CREATE INDEX idx_analysis_pairs_y_evidences ON analysis_pairs USING GIN(y_evidences)
  WHERE y_evidences IS NOT NULL;
```

---

## 🔄 COMPARAISON AVANT/APRÈS

| Aspect | AVANT (`h2_analysis_pairs`) | APRÈS (`analysis_pairs`) |
|--------|----------------------------|-------------------------|
| **Contexte** | prev4→next4 (colonnes dédiées) | prev3→next3 (standard) + JSONB flexible |
| **Taille colonne** | 9 tours × 6 colonnes = 54 colonnes | 7 tours × 6 colonnes + 1 JSONB = 43 colonnes |
| **Classification Y** | `next_turn_tag_auto`, `score_auto` | `y_predicted_tag`, `y_confidence`, `y_algorithm_key` |
| **Classification X** | ❌ Absent | ✅ `x_predicted_tag`, `x_confidence`, `x_algorithm_key` |
| **Gold Standard** | ❌ Absent | ✅ `level0_gold_*` (5 colonnes) |
| **Versioning** | `algorithm_version` (texte flou) | `*_algorithm_key` + `*_algorithm_version` par algo |
| **Médiateurs** | ✅ M1/M2/M3 complets | ✅ Idem + `*_algorithm_key` par médiateur |
| **Flexibilité** | Rigide (colonnes fixes) | Flexible (JSONB pour contexte étendu) |

---

## 🎯 DÉCISIONS ARCHITECTURALES

### 1. Contexte : Architecture Hybride

**Choix** : prev3→next3 en colonnes + JSONB pour cas ponctuels

**Rationale** :
- 90% des analyses utilisent 3 tours de contexte → colonnes standard (performant)
- 10% des cas nécessitent plus → `extended_context` JSONB (flexible)
- Économie de colonnes : 54 → 43 colonnes (-20%)
- Performance maintenue pour requêtes standards
- Extensibilité garantie sans migration de schéma

**Exemple d'utilisation** :
```typescript
// Cas standard (90%)
const pairs = await supabase
  .from('analysis_pairs')
  .select('prev3_verbatim, prev2_verbatim, prev1_verbatim, conseiller_verbatim');

// Cas étendu ponctuel (10%)
const pair = await supabase
  .from('analysis_pairs')
  .select('*, extended_context')
  .eq('pair_id', 123)
  .single();

// Accès au contexte étendu
const prev4 = pair.extended_context?.prev?.[0];
```

### 2. Versioning : Par Algorithme

**Choix** : `*_algorithm_key` + `*_algorithm_version` pour chaque algo (X, Y, M1, M2, M3)

**Rationale** :
- Chaque algorithme évolue indépendamment
- Traçabilité scientifique précise
- Facilite les comparaisons inter-versions
- Alignement avec `algorithm_version_registry`

**Mapping** :
```
algorithm_version_registry.x_key → analysis_pairs.x_algorithm_key
algorithm_version_registry.x_version → analysis_pairs.x_algorithm_version
(idem pour Y, M1, M2, M3)
```

### 3. Stockage des Résultats : Une Seule Version Active

**Choix** : Écraser les anciens résultats (pas d'historique en base)

**Rationale** :
- Simplicité de requêtage
- Évite l'explosion de la table
- Traçabilité via Git des versions d'algorithmes
- Pour l'historique complet → export CSV/JSON avant re-run

**Alternative pour traçabilité** :
- Logs applicatifs avec tous les résultats
- Export systématique avant re-run
- Si besoin d'historique → créer `analysis_pairs_history` ultérieurement

### 4. Naming : Clarté Scientifique

**Choix** : Noms explicites alignés sur la terminologie de la thèse

| Ancien | Nouveau | Justification |
|--------|---------|--------------|
| `next_turn_tag_auto` | `y_predicted_tag` | Alignement avec nomenclature H1/H2 |
| `score_auto` | `y_confidence` | Clarté sémantique |
| ❌ (absent) | `x_predicted_tag` | Complétude Level 1 |
| `algorithm_version` | `x/y/m*_algorithm_key` + `version` | Granularité par algo |

---

## 🚀 PLAN DE MIGRATION

### Phase 1 : Préparation (1-2h)

#### 1.1 Backup complet
```sql
-- Backup de sécurité
CREATE TABLE h2_analysis_pairs_backup_20251119 AS 
SELECT * FROM h2_analysis_pairs;

-- Vérification
SELECT 
  (SELECT COUNT(*) FROM h2_analysis_pairs) as original,
  (SELECT COUNT(*) FROM h2_analysis_pairs_backup_20251119) as backup;
```

#### 1.2 Création de la nouvelle table
```bash
# Exécuter le script SQL de création (voir ci-dessus)
psql -h localhost -U postgres -d taggerlpl < create_analysis_pairs.sql
```

#### 1.3 Génération des types TypeScript
```bash
# Regénérer les types depuis Supabase
npx supabase gen types typescript --local > src/types/database.types.ts
```

### Phase 2 : Migration des Données (2-3h)

#### 2.1 Script de migration
```sql
-- Migration des données existantes vers analysis_pairs
INSERT INTO analysis_pairs (
  call_id,
  pair_index,
  
  -- Tours conseiller/client
  conseiller_turn_id,
  strategy_tag,
  strategy_family,
  conseiller_verbatim,
  conseiller_speaker,
  conseiller_start_time,
  conseiller_end_time,
  strategy_color,
  strategy_originespeaker,
  
  client_turn_id,
  reaction_tag,
  client_verbatim,
  client_speaker,
  client_start_time,
  client_end_time,
  
  -- Contexte standard (prev3→next3)
  prev3_turn_id,
  prev3_verbatim,
  prev3_speaker,
  prev3_tag,
  prev3_start_time,
  prev3_end_time,
  
  prev2_turn_id,
  prev2_verbatim,
  prev2_speaker,
  prev2_tag,
  prev2_start_time,
  prev2_end_time,
  
  prev1_turn_id,
  prev1_verbatim,
  prev1_speaker,
  prev1_tag,
  prev1_start_time,
  prev1_end_time,
  
  next1_turn_id,
  next1_verbatim,
  next1_speaker,
  next1_tag,
  next1_start_time,
  next1_end_time,
  
  next2_turn_id,
  next2_verbatim,
  next2_speaker,
  next2_tag,
  next2_start_time,
  next2_end_time,
  
  next3_turn_id,
  next3_verbatim,
  next3_speaker,
  next3_tag,
  next3_start_time,
  next3_end_time,
  
  -- Contexte étendu (prev4/next4 → JSONB)
  extended_context,
  
  -- Classification Y (renommage)
  y_predicted_tag,
  y_confidence,
  
  -- Médiateurs M1/M2/M3
  m1_verb_density,
  m1_verb_count,
  m1_total_words,
  m1_action_verbs,
  
  m2_lexical_alignment,
  m2_semantic_alignment,
  m2_global_alignment,
  m2_shared_terms,
  
  m3_hesitation_count,
  m3_clarification_count,
  m3_cognitive_score,
  m3_cognitive_load,
  m3_patterns,
  
  -- Métadonnées
  computation_status,
  annotations,
  created_at,
  updated_at
)
SELECT 
  call_id,
  pair_index,
  
  conseiller_turn_id,
  strategy_tag,
  strategy_family,
  conseiller_verbatim,
  conseiller_speaker,
  conseiller_start_time,
  conseiller_end_time,
  strategy_color,
  strategy_originespeaker,
  
  client_turn_id,
  reaction_tag,
  client_verbatim,
  client_speaker,
  client_start_time,
  client_end_time,
  
  -- Contexte standard
  prev3_turn_id,
  prev3_verbatim,
  prev3_speaker,
  prev3_tag,
  prev3_start_time,
  prev3_end_time,
  
  prev2_turn_id,
  prev2_verbatim,
  prev2_speaker,
  prev2_tag,
  prev2_start_time,
  prev2_end_time,
  
  prev1_turn_id,
  prev1_verbatim,
  prev1_speaker,
  prev1_tag,
  prev1_start_time,
  prev1_end_time,
  
  next1_turn_id,
  next1_verbatim,
  next1_speaker,
  next1_tag,
  next1_start_time,
  next1_end_time,
  
  next2_turn_id,
  next2_verbatim,
  next2_speaker,
  next2_tag,
  next2_start_time,
  next2_end_time,
  
  next3_turn_id,
  next3_verbatim,
  next3_speaker,
  next3_tag,
  next3_start_time,
  next3_end_time,
  
  -- Contexte étendu : construction du JSONB si prev4/next4 existent
  CASE 
    WHEN prev4_verbatim IS NOT NULL OR next4_verbatim IS NOT NULL THEN
      jsonb_build_object(
        'prev', 
        CASE WHEN prev4_verbatim IS NOT NULL THEN
          jsonb_build_array(
            jsonb_build_object(
              'turn_id', prev4_turn_id,
              'verbatim', prev4_verbatim,
              'speaker', prev4_speaker,
              'tag', prev4_tag,
              'start_time', prev4_start_time,
              'end_time', prev4_end_time
            )
          )
        ELSE '[]'::jsonb END,
        'next',
        CASE WHEN next4_verbatim IS NOT NULL THEN
          jsonb_build_array(
            jsonb_build_object(
              'turn_id', next4_turn_id,
              'verbatim', next4_verbatim,
              'speaker', next4_speaker,
              'tag', next4_tag,
              'start_time', next4_start_time,
              'end_time', next4_end_time
            )
          )
        ELSE '[]'::jsonb END
      )
    ELSE NULL
  END,
  
  -- Renommage Y
  next_turn_tag_auto,  -- → y_predicted_tag
  score_auto,          -- → y_confidence
  
  -- Médiateurs (inchangés)
  m1_verb_density,
  m1_verb_count,
  m1_total_words,
  m1_action_verbs,
  
  m2_lexical_alignment,
  m2_semantic_alignment,
  m2_global_alignment,
  m2_shared_terms,
  
  m3_hesitation_count,
  m3_clarification_count,
  m3_cognitive_score,
  m3_cognitive_load,
  m3_patterns,
  
  computation_status,
  annotations,
  created_at,
  updated_at
FROM h2_analysis_pairs;

-- Vérification
SELECT 
  (SELECT COUNT(*) FROM h2_analysis_pairs) as source,
  (SELECT COUNT(*) FROM analysis_pairs) as target,
  CASE 
    WHEN (SELECT COUNT(*) FROM h2_analysis_pairs) = (SELECT COUNT(*) FROM analysis_pairs)
    THEN '✅ Migration OK'
    ELSE '❌ ERREUR : nombres différents'
  END as status;
```

#### 2.2 Validation des données
```sql
-- Vérifier que toutes les paires ont été migrées
SELECT 
  'Paires migrées' as metric,
  COUNT(*) as count
FROM analysis_pairs
UNION ALL
SELECT 
  'Avec contexte étendu' as metric,
  COUNT(*) as count
FROM analysis_pairs
WHERE extended_context IS NOT NULL
UNION ALL
SELECT 
  'Avec résultats Y' as metric,
  COUNT(*) as count
FROM analysis_pairs
WHERE y_predicted_tag IS NOT NULL
UNION ALL
SELECT 
  'Avec médiateurs complets' as metric,
  COUNT(*) as count
FROM analysis_pairs
WHERE m1_verb_density IS NOT NULL 
  AND m2_lexical_alignment IS NOT NULL 
  AND m3_cognitive_score IS NOT NULL;
```

### Phase 3 : Vue de Compatibilité (30min)

```sql
-- Vue pour compatibilité ascendante pendant transition
CREATE OR REPLACE VIEW h2_analysis_pairs AS
SELECT 
  pair_id,
  call_id,
  pair_index,
  
  -- Tours
  conseiller_turn_id,
  strategy_tag,
  strategy_family,
  conseiller_verbatim,
  conseiller_speaker,
  conseiller_start_time,
  conseiller_end_time,
  strategy_color,
  strategy_originespeaker,
  
  client_turn_id,
  reaction_tag,
  client_verbatim,
  client_speaker,
  client_start_time,
  client_end_time,
  
  -- Contexte (colonnes + extraction du JSONB)
  prev3_turn_id,
  prev3_verbatim,
  prev3_speaker,
  prev3_tag,
  prev3_start_time,
  prev3_end_time,
  
  prev2_turn_id,
  prev2_verbatim,
  prev2_speaker,
  prev2_tag,
  prev2_start_time,
  prev2_end_time,
  
  prev1_turn_id,
  prev1_verbatim,
  prev1_speaker,
  prev1_tag,
  prev1_start_time,
  prev1_end_time,
  
  next1_turn_id,
  next1_verbatim,
  next1_speaker,
  next1_tag,
  next1_start_time,
  next1_end_time,
  
  next2_turn_id,
  next2_verbatim,
  next2_speaker,
  next2_tag,
  next2_start_time,
  next2_end_time,
  
  next3_turn_id,
  next3_verbatim,
  next3_speaker,
  next3_tag,
  next3_start_time,
  next3_end_time,
  
  -- Extraction prev4/next4 depuis JSONB
  (extended_context->'prev'->0->>'turn_id')::integer as prev4_turn_id,
  extended_context->'prev'->0->>'verbatim' as prev4_verbatim,
  extended_context->'prev'->0->>'speaker' as prev4_speaker,
  extended_context->'prev'->0->>'tag' as prev4_tag,
  (extended_context->'prev'->0->>'start_time')::double precision as prev4_start_time,
  (extended_context->'prev'->0->>'end_time')::double precision as prev4_end_time,
  
  (extended_context->'next'->0->>'turn_id')::integer as next4_turn_id,
  extended_context->'next'->0->>'verbatim' as next4_verbatim,
  extended_context->'next'->0->>'speaker' as next4_speaker,
  extended_context->'next'->0->>'tag' as next4_tag,
  (extended_context->'next'->0->>'start_time')::double precision as next4_start_time,
  (extended_context->'next'->0->>'end_time')::double precision as next4_end_time,
  
  -- Mapping colonnes renommées
  y_predicted_tag as next_turn_tag_auto,
  y_confidence as score_auto,
  
  -- Médiateurs
  m1_verb_density,
  m1_verb_count,
  m1_total_words,
  m1_action_verbs,
  
  m2_lexical_alignment,
  m2_semantic_alignment,
  m2_global_alignment,
  m2_shared_terms,
  
  m3_hesitation_count,
  m3_clarification_count,
  m3_cognitive_score,
  m3_cognitive_load,
  m3_patterns,
  
  -- Métadonnées
  y_algorithm_key as algorithm_version,  -- Approximation pour compatibilité
  computed_at,
  computation_status,
  annotations,
  created_at,
  updated_at
FROM analysis_pairs;

-- Test de la vue
SELECT COUNT(*) FROM h2_analysis_pairs;
```

### Phase 4 : Migration du Code (3-4h)

#### 4.1 Hooks & Data Loading
```bash
# Renommer les hooks
git mv src/features/phase3-analysis/level1-validation/ui/hooks/useH2data.ts \
       src/features/phase3-analysis/level1-validation/ui/hooks/useAnalysisPairs.ts
```

```typescript
// Mise à jour des imports dans useAnalysisPairs.ts
- import { H2AnalysisPair } from '@/types/h2-analysis';
+ import { AnalysisPairRow } from '@/types/database.types';
+ import { Level1Pair } from '@/types/analysis-pairs';

// Mise à jour des requêtes
- .from('h2_analysis_pairs')
+ .from('analysis_pairs')

// Mise à jour des types retournés
- const [pairs, setPairs] = useState<H2AnalysisPair[]>([]);
+ const [pairs, setPairs] = useState<AnalysisPairRow[]>([]);
```

#### 4.2 Algorithmes (Metadata Output)

**Algorithmes X (Conseiller)** :
```typescript
// src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/*

return {
  prediction: classifiedTag,
  confidence: confidence,
  metadata: {
    // ✅ NOUVEAU : colonnes explicites pour analysis_pairs
    x_predicted_tag: classifiedTag,
    x_confidence: confidence,
    x_algorithm_key: this.key,           // Ex: 'openai_conseiller'
    x_algorithm_version: this.version,   // Ex: '1a2b3'
    x_evidences: extractedFeatures,
    x_computed_at: new Date().toISOString(),
    
    // Métadonnées UI (inchangées)
    target: 'conseiller',
    callId: input.callId,
    turnId: input.turnId,
  }
};
```

**Algorithmes Y (Client)** :
```typescript
// src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/*

return {
  prediction: reactionTag,
  confidence: confidence,
  metadata: {
    // ✅ NOUVEAU
    y_predicted_tag: reactionTag,
    y_confidence: confidence,
    y_algorithm_key: this.key,
    y_algorithm_version: this.version,
    y_evidences: detectedCues,
    y_computed_at: new Date().toISOString(),
    
    // UI
    target: 'client',
    callId: input.callId,
    turnId: input.turnId,
  }
};
```

**Algorithmes M1/M2/M3** :
```typescript
// Ajouter les clés d'algorithme dans les métadonnées
return {
  ...result,
  metadata: {
    m1_algorithm_key: this.key,
    m1_algorithm_version: this.version,
    m1_computed_at: new Date().toISOString(),
  }
};
```

#### 4.3 Types TypeScript

**Créer** `src/types/analysis-pairs.ts` :
```typescript
import { Database } from './database.types';

// Type de base depuis Supabase
export type AnalysisPairRow = Database['public']['Tables']['analysis_pairs']['Row'];
export type AnalysisPairInsert = Database['public']['Tables']['analysis_pairs']['Insert'];
export type AnalysisPairUpdate = Database['public']['Tables']['analysis_pairs']['Update'];

// Types dérivés par niveau
export type Level0Pair = Pick<AnalysisPairRow, 
  'pair_id' | 
  'conseiller_verbatim' | 
  'client_verbatim' | 
  'prev3_verbatim' | 'prev2_verbatim' | 'prev1_verbatim' |
  'next1_verbatim' | 'next2_verbatim' | 'next3_verbatim' |
  'level0_gold_conseiller' | 
  'level0_gold_client' |
  'level0_annotator_agreement'
>;

export type Level1Pair = Pick<AnalysisPairRow,
  'pair_id' | 
  'call_id' |
  'strategy_tag' | 
  'reaction_tag' |
  'x_predicted_tag' | 
  'x_confidence' | 
  'x_algorithm_key' |
  'y_predicted_tag' | 
  'y_confidence' | 
  'y_algorithm_key' |
  'conseiller_verbatim' |
  'client_verbatim'
>;

export type Level2Pair = Pick<AnalysisPairRow,
  'pair_id' | 
  'strategy_family' | 
  'reaction_tag' |
  'm1_verb_density' | 
  'm2_lexical_alignment' |
  'm3_cognitive_score'
>;

// Helpers de validation
export function hasFullContext(pair: AnalysisPairRow): boolean {
  return !!(pair.prev2_verbatim && pair.prev1_verbatim && pair.next1_verbatim);
}

export function isLevel1Complete(pair: AnalysisPairRow): boolean {
  return !!(pair.x_predicted_tag && pair.y_predicted_tag);
}

export function isLevel2Complete(pair: AnalysisPairRow): boolean {
  return !!(
    pair.m1_verb_density !== null &&
    pair.m2_lexical_alignment !== null &&
    pair.m3_cognitive_score !== null
  );
}
```

### Phase 5 : Tests & Validation (2h)

#### 5.1 Tests Unitaires
```bash
# Tester les algorithmes avec nouvelles métadonnées
npm run test:algorithms
```

#### 5.2 Tests d'Intégration
```typescript
// Test de bout en bout : run algorithme → écriture dans analysis_pairs
describe('Algorithm to analysis_pairs integration', () => {
  it('should write X results correctly', async () => {
    const result = await runConseillerClassifier(input);
    
    // Vérifier que les colonnes X sont présentes
    expect(result.metadata.x_predicted_tag).toBeDefined();
    expect(result.metadata.x_algorithm_key).toBeDefined();
  });
});
```

#### 5.3 Validation Manuelle
- [ ] Charger AlgorithmLab avec analysis_pairs
- [ ] Lancer un algorithme X et vérifier l'écriture
- [ ] Lancer un algorithme Y et vérifier l'écriture
- [ ] Vérifier les métriques Level 2
- [ ] Vérifier l'affichage du contexte

### Phase 6 : Nettoyage (1h)

```sql
-- Après validation complète (attendre 1 semaine minimum)

-- Renommer l'ancienne table en archive
ALTER TABLE h2_analysis_pairs RENAME TO h2_analysis_pairs_archive;

-- Supprimer la vue de compatibilité
DROP VIEW IF EXISTS h2_analysis_pairs;

-- (Optionnel) Supprimer l'archive après backup externe
-- DROP TABLE h2_analysis_pairs_archive;
```

---

## 📈 BÉNÉFICES ATTENDUS

### Performances
- **-20% de colonnes** : 54 → 43 colonnes standard
- **Index optimisés** : Recherches Level 0/1/2 accélérées
- **JSONB flexible** : Contexte étendu sans overhead quand inutilisé

### Maintenabilité
- **Naming clair** : `x_predicted_tag` vs `next_turn_tag_auto`
- **Versioning granulaire** : Par algorithme (X, Y, M1, M2, M3)
- **Traçabilité** : Liens clairs avec `algorithm_version_registry`

### Évolutivité
- **Contexte flexible** : JSONB permet prev5, prev6... sans migration
- **Nouveaux niveaux** : Facile d'ajouter Level 3, Level 4...
- **Nouveaux algorithmes** : Pattern reproductible

### Scientifique
- **Gold Standard** : Level 0 intégré
- **Comparaisons** : X vs gold, Y vs gold facilitées
- **Médiation** : Tests H2 simplifiés

---

## ⚠️ RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Perte de données** | Faible | Critique | Backup complet + tests sur copie |
| **Régression algo M1/M2/M3** | Moyen | Moyen | Tests unitaires + comparaison avant/après |
| **Performance dégradée** | Faible | Moyen | Index optimisés + monitoring |
| **Bugs dans vue compatibilité** | Moyen | Faible | Tests exhaustifs + rollback possible |
| **Migration partielle** | Moyen | Moyen | Migration module par module |

---

## 📋 CHECKLIST DE MIGRATION

### Préparation
- [ ] Backup complet de `h2_analysis_pairs`
- [ ] Créer `analysis_pairs` en local
- [ ] Générer types TypeScript
- [ ] Créer `src/types/analysis-pairs.ts`
- [ ] Validation schéma avec équipe

### Migration Base
- [ ] Exécuter script de création table
- [ ] Migrer les données (901 paires)
- [ ] Créer vue de compatibilité
- [ ] Valider counts et samples
- [ ] Tests de requêtes

### Migration Code
- [ ] Renommer hooks (useH2data → useAnalysisPairs)
- [ ] Mettre à jour algorithmes X
- [ ] Mettre à jour algorithmes Y
- [ ] Mettre à jour algorithmes M1/M2/M3
- [ ] Mettre à jour composants UI Level 1
- [ ] Mettre à jour composants UI Level 2

### Tests
- [ ] Tests unitaires algorithmes
- [ ] Tests intégration AlgorithmLab
- [ ] Tests end-to-end workflow complet
- [ ] Validation performances
- [ ] Validation scientifique (métriques)

### Documentation
- [ ] Mettre à jour README.md
- [ ] Mettre à jour doc/level1/
- [ ] Créer guide migration pour équipe
- [ ] Changelog

### Déploiement
- [ ] Migration en production
- [ ] Monitoring 48h
- [ ] Validation avec données réelles
- [ ] Archivage h2_analysis_pairs
- [ ] Suppression vue compatibilité

---

## 🎯 TIMELINE ESTIMÉE

| Phase | Durée | Critique |
|-------|-------|----------|
| **Préparation** | 1-2h | 🔴 |
| **Migration Base** | 2-3h | 🔴 |
| **Vue Compatibilité** | 30min | 🟠 |
| **Migration Code** | 3-4h | 🔴 |
| **Tests** | 2h | 🔴 |
| **Nettoyage** | 1h | 🟡 |
| **TOTAL** | **10-13h** | |

**Répartition suggérée** : 2-3 sessions de 4h

---

## 📚 RÉFÉRENCES

- **Architecture Cible** : `ARCHITECTURE_CIBLE_WORKFLOW.md`
- **Migration Pair Analysis** : `MIGRATION_PAIR_ANALYSIS.md`
- **Schema SQL actuel** : `doc/schema.sql`
- **Types Supabase** : `src/types/database.types.ts`
- **AlgorithmLab Docs** : `doc/AlgorithmLab/`

---

**Document créé le** : 19 novembre 2025  
**Auteur** : Claude + Thomas  
**Status** : ✅ PRÊT POUR VALIDATION
