# Mission Level 0 - Architecture Unifiée des Annotations
## Spécifications Techniques v2.0 - Session 2025-12-17

================================================================================
## HISTORIQUE DES VERSIONS
================================================================================

### v2.0 (2025-12-17) - Clarifications Conceptuelles
**Ajouts majeurs :**
- 📚 Distinction Philosophie vs Implémentation Prompt
- 🎯 Table `level0_chartes` intégrée (oubliée en v1.0)
- ✅ Table `disagreement_validations` pour qualité annotations
- 🔧 Corrections techniques (UPSERT, NaN, FK constraints)
- 🎨 Sprint 2.5 complété (sélection unitaire chartes)
- 📊 Métriques corrigées (Kappa ajusté)

### v1.0 (2025-12-16) - Architecture Initiale
- Table `annotations` unifiée
- Services de base
- Interface multi-chartes

================================================================================
## CONTEXTE & MOTIVATION
================================================================================

### Problématique Initiale (v1.0)

**Problème identifié le 16/12/2024 :**
- Annotations LLM non sauvegardées individuellement
- Seules les métriques agrégées stockées
- Impossible de comparer annotateurs
- Impossible de tester robustesse H1/H2

### Clarifications Conceptuelles (v2.0)

**Distinction fondamentale : Philosophie vs Prompt**

#### Niveau 1 : PHILOSOPHIE D'ANNOTATION
**Définition** : Approche conceptuelle pour classifier les observations.

**Exemples Variable Y (réaction client) :**
```
Philosophie A "Minimaliste"
├─ Principe : Classification simple 3 catégories
├─ Catégories : POSITIF / NEUTRE / NEGATIF
└─ Critère : Émotion exprimée explicitement

Philosophie B "Enrichie"
├─ Principe : Classification avec nuances émotionnelles
├─ Catégories : POSITIF / NEUTRE / NEGATIF + intensité
└─ Critère : Émotion + contexte conversationnel

Philosophie C "Binaire"
├─ Principe : Classification simplifiée
├─ Catégories : POSITIF / NON_POSITIF
└─ Critère : Présence/absence de satisfaction

Philosophie D "Contextuelle"
├─ Principe : Classification dépendante du contexte
├─ Catégories : Variable selon stratégie conseiller
└─ Critère : Alignement réponse client / action conseiller
```

**Caractéristiques d'une philosophie :**
- ✅ Vision stratégique (QUOI annoter)
- ✅ Nombre et nature des catégories
- ✅ Critères de classification
- ✅ Traitement des cas ambigus
- ✅ S'applique aux humains ET aux LLM

#### Niveau 2 : IMPLÉMENTATION PROMPT (LLM uniquement)
**Définition** : Formulation concrète des instructions pour le LLM.

**Exemple Philosophie A "Minimaliste" :**
```
Version 1.0.0 (Baseline)
├─ Prompt : Définitions simples des 3 catégories
├─ Contexte : Verbatim client uniquement
└─ Paramètres : temperature=0.0, model=gpt-4o-mini

Version 1.1.0 (+ Exemples)
├─ Prompt : Définitions + 3 exemples par catégorie
├─ Contexte : Verbatim client uniquement
└─ Paramètres : temperature=0.0, model=gpt-4o-mini

Version 1.2.0 (+ Règles)
├─ Prompt : Définitions + exemples + règles de priorité
├─ Contexte : Verbatim client + prev1/next1
└─ Paramètres : temperature=0.0, model=gpt-4o-mini

Version 2.0.0 (Refonte)
├─ Prompt : Chain-of-thought + few-shot learning
├─ Contexte : Contexte étendu prev2/next2
└─ Paramètres : temperature=0.1, model=gpt-4o
```

**Caractéristiques d'une implémentation :**
- ✅ Vision tactique (COMMENT prompter)
- ✅ Formulation exacte des instructions
- ✅ Exemples fournis
- ✅ Paramètres techniques (temperature, model)
- ✅ S'applique UNIQUEMENT aux LLM

**Note importante** : Les annotateurs humains suivent une philosophie (instructions écrites) mais n'ont pas de "prompt" (pas d'implémentation technique).

### Objectifs de Recherche

#### Objectif 1 : Comparaison Inter-Philosophies
**Question** : Quelle approche conceptuelle maximise l'accord humain-LLM ?

**Méthodologie :**
```
1. Définir N philosophies (A, B, C, D...)
2. Pour chaque philosophie :
   - Optimiser le meilleur prompt possible
   - Tester sur corpus complet (901 paires)
   - Calculer Kappa corrigé (voir section Validation)
3. Comparer les Kappa des meilleures versions
4. Identifier la philosophie optimale

Exemple résultat attendu :
┌─────────────────┬──────────────┬──────────────┬──────────┐
│ Philosophie     │ Meilleur     │ Kappa        │ Rang     │
│                 │ Prompt       │ Corrigé      │          │
├─────────────────┼──────────────┼──────────────┼──────────┤
│ Minimaliste     │ v1.3.0       │ 0.85         │ 2        │
│ Enrichie        │ v2.1.0       │ 0.78         │ 3        │
│ Binaire         │ v1.2.0       │ 0.92         │ 1 ⭐     │
│ Contextuelle    │ v1.5.0       │ 0.81         │ 4        │
└─────────────────┴──────────────┴──────────────┴──────────┘

Conclusion thèse : L'approche binaire offre la meilleure 
reproductibilité (κ=0.92), probablement en raison de...
```

#### Objectif 2 : Optimisation Intra-Philosophie
**Question** : Comment améliorer le prompt d'une philosophie donnée ?

**Méthodologie :**
```
1. Sélectionner une philosophie (ex: Minimaliste)
2. Tester baseline (v1.0.0)
3. Identifier désaccords injustifiés (voir section Validation)
4. Analyser patterns d'erreurs
5. Créer version améliorée (v1.1.0)
6. Retester et comparer
7. Itérer jusqu'à convergence

Exemple progression :
┌──────────┬─────────────────────────┬────────┬──────────┬─────────┐
│ Version  │ Amélioration            │ Kappa  │ Désacc.  │ Δ Kappa │
│          │                         │ Brut   │ Injust.  │         │
├──────────┼─────────────────────────┼────────┼──────────┼─────────┤
│ 1.0.0    │ Baseline                │ 0.60   │ 25/901   │ -       │
│ 1.1.0    │ + Exemples              │ 0.68   │ 18/901   │ +0.08   │
│ 1.2.0    │ + Règles priorité       │ 0.75   │ 12/901   │ +0.07   │
│ 1.3.0    │ + Contexte prev/next    │ 0.85   │ 6/901    │ +0.10   │
└──────────┴─────────────────────────┴────────┴──────────┴─────────┘

Conclusion thèse : L'ajout progressif de contexte 
conversationnel (prev/next) a le plus fort impact (+0.10)
```

#### Objectif 3 : Analyse par Variable
**Répéter Objectifs 1 & 2 pour :**
- Variable X (stratégies conseiller)
- Variable Y (réactions client)
- Variables XY (bi-variable, optionnel pour futur)

#### Objectif 4 : Utilisation en Level 1/2
**Question** : Les tags gold_consensus sont-ils suffisamment fiables ?

**Méthodologie :**
```
1. Level 0 : Établir gold_consensus (meilleure philosophie/prompt)
2. Level 1 : Utiliser gold_consensus pour algorithmes M1/M2/M3
3. Level 2 : Tester H1/H2 avec gold_consensus
4. Robustesse : Vérifier si H1/H2 tiennent avec autres annotateurs
```

================================================================================
## ARCHITECTURE PROPOSÉE v2.0
================================================================================

### 1. Schéma de Base de Données COMPLET

#### Table `level0_chartes` (EXISTANTE - oubliée en v1.0)
```sql
-- ============================================================================
-- Table des définitions de chartes
-- Stocke à la fois les philosophies ET leurs implémentations
-- ============================================================================

CREATE TABLE level0_chartes (
  -- Identifiants
  charte_id TEXT PRIMARY KEY,
  -- Format recommandé : "Charte{Variable}_{Philosophy}_v{Version}"
  -- Exemples :
  --   "CharteY_Minimaliste_v1.0.0"
  --   "CharteY_Minimaliste_v1.1.0"
  --   "CharteX_SansContexte_v1.0.0"
  
  charte_name TEXT NOT NULL,
  -- Nom lisible : "Charte Y - Minimaliste v1.0"
  
  charte_description TEXT,
  -- Description narrative de la philosophie
  
  -- 🆕 Métadonnées conceptuelles
  philosophy TEXT NOT NULL,
  -- Nom de la philosophie (ex: "Minimaliste", "Enrichie", "Binaire")
  
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y', 'XY')),
  -- Scope : X (stratégie), Y (réaction), ou XY (bi-variable)
  
  version TEXT NOT NULL,
  -- Version sémantique : "1.2.0" (major.minor.patch)
  
  -- Définition de la philosophie
  definition JSONB NOT NULL,
  -- Structure :
  -- {
  --   "categories": {
  --     "CLIENT_POSITIF": {
  --       "description": "Client exprime satisfaction",
  --       "examples": ["Oui, d'accord", "Parfait"],
  --       "rules": ["Priorité aux indicateurs explicites"]
  --     },
  --     ...
  --   },
  --   "ambiguity_resolution": "...",
  --   "neutral_handling": "..."
  -- }
  
  -- 🆕 Implémentation prompt (LLM uniquement)
  prompt_template TEXT,
  -- Template du prompt avec placeholders
  -- NULL pour chartes humaines (pas de prompt)
  
  prompt_params JSONB,
  -- Paramètres d'exécution :
  -- {
  --   "model": "gpt-4o-mini",
  --   "temperature": 0.0,
  --   "max_tokens": 500,
  --   "context_window": ["prev1", "next1"]
  -- }
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_baseline BOOLEAN DEFAULT false,
  -- true si c'est la version de référence pour comparaisons
  
  notes TEXT,
  -- Notes pour la thèse
  
  -- Contraintes
  CONSTRAINT unique_philosophy_version UNIQUE(philosophy, variable, version)
);

-- Index
CREATE INDEX idx_chartes_philosophy ON level0_chartes(philosophy);
CREATE INDEX idx_chartes_variable ON level0_chartes(variable);
CREATE INDEX idx_chartes_baseline ON level0_chartes(is_baseline) WHERE is_baseline = true;

-- Exemples de données
INSERT INTO level0_chartes VALUES
  (
    'CharteY_Minimaliste_v1.0.0',
    'Charte Y - Minimaliste v1.0 (Baseline)',
    'Classification simple en 3 catégories basée sur émotion explicite',
    'Minimaliste',
    'Y',
    '1.0.0',
    '{"categories": {...}}',
    'Vous devez classifier...',
    '{"model": "gpt-4o-mini", "temperature": 0.0}',
    NOW(),
    true,
    'Version baseline pour tests initiaux'
  ),
  (
    'CharteY_Minimaliste_v1.1.0',
    'Charte Y - Minimaliste v1.1 (+ Exemples)',
    'Ajout de 3 exemples par catégorie',
    'Minimaliste',
    'Y',
    '1.1.0',
    '{"categories": {...}}',
    'Vous devez classifier... Voici des exemples:...',
    '{"model": "gpt-4o-mini", "temperature": 0.0}',
    NOW(),
    false,
    'Amélioration suite à analyse des désaccords v1.0.0'
  );
```

#### Table `annotations` (ENRICHIE depuis v1.0)
```sql
-- ============================================================================
-- Table unifiée pour TOUTES les annotations
-- Version 2.0 : Ajout métadonnées philosophie
-- ============================================================================

CREATE TABLE annotations (
  -- Identifiants
  annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id INT NOT NULL REFERENCES analysis_pairs(pair_id) ON DELETE CASCADE,
  
  -- Identité de l'annotateur
  annotator_type TEXT NOT NULL CHECK (annotator_type IN (
    'human_manual',      -- Annotation manuelle initiale
    'human_h2',          -- Deuxième annotateur humain (inter-rater)
    'human_supervisor',  -- Superviseur pour résolution désaccords
    'llm_openai',        -- Annotation via LLM OpenAI
    'gold_consensus'     -- Consensus final validé
  )),
  
  annotator_id TEXT NOT NULL,
  -- Exemples :
  --   human_manual: "thomas_initial"
  --   llm_openai: "CharteY_Minimaliste_v1.2.0"
  --   gold_consensus: "CharteY_Binaire_v1.0.0_validated"
  
  -- 🆕 Lien vers la charte utilisée (si applicable)
  charte_id TEXT REFERENCES level0_chartes(charte_id),
  -- NULL pour annotations humaines manuelles (pas de charte)
  -- NOT NULL pour annotations LLM
  
  -- Tags annotés
  strategy_tag TEXT,     -- Variable X
  reaction_tag TEXT,     -- Variable Y
  
  -- Métadonnées qualité
  confidence FLOAT CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  -- NULL pour humains, 0.0-1.0 pour LLM
  
  reasoning TEXT,
  -- LLM : chain-of-thought
  -- Humain : notes optionnelles
  
  annotation_context JSONB,
  -- Métadonnées additionnelles
  
  -- Traçabilité temporelle
  annotated_at TIMESTAMPTZ DEFAULT NOW(),
  annotation_duration_ms INT,
  
  -- Liens relationnels
  test_id UUID REFERENCES level0_charte_tests(test_id) ON DELETE SET NULL,
  -- 🆕 NULL par défaut pour éviter FK constraint
  -- Sera rempli après sauvegarde du test si besoin
  
  -- 🔧 Contrainte v2.0 : Option A (UPSERT sans historique)
  CONSTRAINT unique_annotation UNIQUE(pair_id, annotator_type, annotator_id),
  
  -- 🔧 Alternative Option B (historique complet - commenter ci-dessus, décommenter ci-dessous)
  -- CONSTRAINT unique_annotation_per_test UNIQUE(pair_id, annotator_type, annotator_id, test_id),
  
  CONSTRAINT at_least_one_tag CHECK (
    strategy_tag IS NOT NULL OR reaction_tag IS NOT NULL
  )
);

-- Index
CREATE INDEX idx_annotations_pair ON annotations(pair_id);
CREATE INDEX idx_annotations_annotator ON annotations(annotator_type, annotator_id);
CREATE INDEX idx_annotations_charte ON annotations(charte_id);
CREATE INDEX idx_annotations_test ON annotations(test_id);
CREATE INDEX idx_annotations_date ON annotations(annotated_at);

-- Index composite pour requêtes fréquentes
CREATE INDEX idx_annotations_pair_annotator 
  ON annotations(pair_id, annotator_type, annotator_id);
```

#### Table `level0_charte_tests` (ENRICHIE depuis v1.0)
```sql
-- ============================================================================
-- Table des résultats de tests
-- Version 2.0 : Ajout métriques corrigées
-- ============================================================================

CREATE TABLE level0_charte_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  
  -- 🆕 Métadonnées conceptuelles
  philosophy TEXT NOT NULL,
  -- Dénormalisé depuis level0_chartes pour faciliter grouping
  
  variable TEXT NOT NULL,
  version TEXT NOT NULL,
  
  -- Métriques brutes (avant validation)
  kappa FLOAT NOT NULL CHECK (kappa >= -1 AND kappa <= 1),
  accuracy FLOAT NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
  total_pairs INT NOT NULL,
  disagreements_count INT NOT NULL,
  
  -- 🆕 Métriques corrigées (après validation désaccords)
  validated_disagreements INT DEFAULT 0,
  -- Nombre de désaccords validés (justifiés + injustifiés + ambigus)
  
  unjustified_disagreements INT DEFAULT 0,
  -- Critère d'optimisation : désaccords où LLM s'est trompé
  
  kappa_corrected FLOAT,
  -- Kappa recalculé après validation
  -- Formula: Kappa sur (accords + désaccords justifiés) / (total - ambiguïtés)
  
  -- Détails
  disagreements JSONB,
  -- Liste complète des désaccords
  
  metrics JSONB,
  -- Précision, rappel, F1, matrice confusion
  
  -- Exécution
  execution_time_ms INT NOT NULL,
  openai_model TEXT NOT NULL,
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  
  notes TEXT
  -- Notes pour la thèse
);

-- Index
CREATE INDEX idx_tests_charte ON level0_charte_tests(charte_id);
CREATE INDEX idx_tests_philosophy ON level0_charte_tests(philosophy);
CREATE INDEX idx_tests_variable ON level0_charte_tests(variable);
CREATE INDEX idx_tests_date ON level0_charte_tests(tested_at);
```

#### Table `disagreement_validations` (NOUVELLE v2.0)
```sql
-- ============================================================================
-- Table de validation des désaccords
-- Permet de qualifier chaque désaccord pour affiner les métriques
-- ============================================================================

CREATE TABLE disagreement_validations (
  validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lien vers le désaccord
  test_id UUID NOT NULL REFERENCES level0_charte_tests(test_id) ON DELETE CASCADE,
  pair_id INTEGER NOT NULL REFERENCES analysis_pairs(pair_id),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  
  -- Tags en conflit
  manual_tag TEXT NOT NULL,
  -- Tag de l'annotateur manuel (référence)
  
  llm_tag TEXT NOT NULL,
  -- Tag du LLM (à valider)
  
  llm_confidence FLOAT,
  llm_reasoning TEXT,
  -- Contexte du raisonnement LLM
  
  -- 🎯 Validation humaine (CŒUR DE LA TABLE)
  validation_decision TEXT NOT NULL CHECK (
    validation_decision IN (
      'llm_correct',      -- LLM a raison, corriger gold standard
      'manual_correct',   -- Thomas a raison, améliorer prompt
      'ambiguous',        -- Ambiguïté légitime, clarifier philosophie
      'pending'           -- Pas encore validé
    )
  ) DEFAULT 'pending',
  
  validated_tag TEXT,
  -- Tag final après validation (peut différer des deux)
  
  validator_id TEXT NOT NULL,
  -- Qui a effectué la validation (thomas, marie, etc.)
  
  validation_comment TEXT NOT NULL,
  -- 🔴 OBLIGATOIRE : Justification de la décision
  -- Exemples :
  --   "LLM confond NEGATIF et NON_POSITIF (problème normalisation)"
  --   "Client ironique, nuance ratée par LLM"
  --   "Vraie ambiguïté : à la fois satisfaction et frustration"
  
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métadonnées contextuelles (pour validation)
  verbatim TEXT NOT NULL,
  -- Verbatim exact pour référence
  
  context_before TEXT,
  context_after TEXT,
  -- Contexte conversationnel
  
  UNIQUE (test_id, pair_id)
);

-- Index
CREATE INDEX idx_disagreement_test ON disagreement_validations(test_id);
CREATE INDEX idx_disagreement_charte ON disagreement_validations(charte_id);
CREATE INDEX idx_disagreement_decision ON disagreement_validations(validation_decision);
CREATE INDEX idx_disagreement_pending ON disagreement_validations(validation_decision) 
  WHERE validation_decision = 'pending';
```

#### Vues Matérialisées v2.0

```sql
-- ============================================================================
-- Vue : Statistiques annotateurs
-- ============================================================================

CREATE MATERIALIZED VIEW annotations_summary AS
SELECT 
  annotator_type,
  annotator_id,
  charte_id,
  
  -- Volumétrie
  COUNT(*) as total_annotations,
  COUNT(DISTINCT pair_id) as unique_pairs,
  COUNT(strategy_tag) as strategy_annotations,
  COUNT(reaction_tag) as reaction_annotations,
  
  -- Qualité
  AVG(confidence) as avg_confidence,
  MIN(confidence) as min_confidence,
  MAX(confidence) as max_confidence,
  
  -- Temporalité
  MIN(annotated_at) as first_annotation,
  MAX(annotated_at) as last_annotation,
  AVG(annotation_duration_ms) as avg_duration_ms,
  
  -- Liens
  COUNT(DISTINCT test_id) as distinct_tests
  
FROM annotations
GROUP BY annotator_type, annotator_id, charte_id;

CREATE UNIQUE INDEX idx_annotations_summary_pk 
  ON annotations_summary(annotator_type, annotator_id, COALESCE(charte_id, ''));

-- ============================================================================
-- Vue : Synthèse validations désaccords
-- ============================================================================

CREATE MATERIALIZED VIEW disagreement_validation_summary AS
SELECT 
  test_id,
  charte_id,
  
  -- Compteurs
  COUNT(*) as total_disagreements,
  COUNT(*) FILTER (WHERE validation_decision = 'llm_correct') as llm_was_right,
  COUNT(*) FILTER (WHERE validation_decision = 'manual_correct') as manual_was_right,
  COUNT(*) FILTER (WHERE validation_decision = 'ambiguous') as ambiguous_cases,
  COUNT(*) FILTER (WHERE validation_decision = 'pending') as pending_validation,
  
  -- Pourcentages
  ROUND(
    COUNT(*) FILTER (WHERE validation_decision = 'llm_correct')::FLOAT / 
    NULLIF(COUNT(*) FILTER (WHERE validation_decision != 'pending'), 0) * 100,
    1
  ) as pct_llm_justified,
  
  ROUND(
    COUNT(*) FILTER (WHERE validation_decision = 'manual_correct')::FLOAT / 
    NULLIF(COUNT(*) FILTER (WHERE validation_decision != 'pending'), 0) * 100,
    1
  ) as pct_llm_unjustified,
  
  -- Métrique d'optimisation
  COUNT(*) FILTER (WHERE validation_decision = 'manual_correct') as optimization_target
  
FROM disagreement_validations
GROUP BY test_id, charte_id;

CREATE UNIQUE INDEX idx_disagreement_summary_pk 
  ON disagreement_validation_summary(test_id, charte_id);

-- Fonctions refresh
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY annotations_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY disagreement_validation_summary;
END;
$$ LANGUAGE plpgsql;
```

### 2. Fonctions RPC v2.0

```sql
-- ============================================================================
-- Fonction : Comparer deux annotateurs
-- ============================================================================

CREATE OR REPLACE FUNCTION compare_annotators(
  type1 TEXT,
  id1 TEXT,
  type2 TEXT,
  id2 TEXT,
  variable_filter TEXT DEFAULT NULL  -- 🆕 'X', 'Y', ou NULL (les deux)
)
RETURNS TABLE (
  pair_id INT,
  tag1_strategy TEXT,
  tag1_reaction TEXT,
  tag2_strategy TEXT,
  tag2_reaction TEXT,
  agreement_strategy BOOLEAN,
  agreement_reaction BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a1.pair_id,
    a1.strategy_tag,
    a1.reaction_tag,
    a2.strategy_tag,
    a2.reaction_tag,
    (a1.strategy_tag = a2.strategy_tag OR 
     a1.strategy_tag IS NULL OR 
     a2.strategy_tag IS NULL) as agreement_strategy,
    (a1.reaction_tag = a2.reaction_tag OR 
     a1.reaction_tag IS NULL OR 
     a2.reaction_tag IS NULL) as agreement_reaction
  FROM annotations a1
  INNER JOIN annotations a2 ON a1.pair_id = a2.pair_id
  WHERE a1.annotator_type = type1
    AND a1.annotator_id = id1
    AND a2.annotator_type = type2
    AND a2.annotator_id = id2
    AND (variable_filter IS NULL OR 
         (variable_filter = 'X' AND a1.strategy_tag IS NOT NULL) OR
         (variable_filter = 'Y' AND a1.reaction_tag IS NOT NULL));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fonction : Statistiques annotateur
-- ============================================================================

CREATE OR REPLACE FUNCTION get_annotator_stats(
  p_annotator_type TEXT,
  p_annotator_id TEXT
)
RETURNS TABLE (
  total_annotations BIGINT,
  unique_pairs BIGINT,
  avg_confidence FLOAT,
  first_annotation TIMESTAMPTZ,
  last_annotation TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COUNT(DISTINCT pair_id)::BIGINT,
    AVG(confidence)::FLOAT,
    MIN(annotated_at),
    MAX(annotated_at)
  FROM annotations
  WHERE annotator_type = p_annotator_type
    AND annotator_id = p_annotator_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fonction 🆕 : Calculer Kappa corrigé après validation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_corrected_kappa(
  p_test_id UUID
)
RETURNS TABLE (
  kappa_brut FLOAT,
  kappa_corrected FLOAT,
  total_pairs INT,
  total_disagreements INT,
  llm_justified INT,
  llm_unjustified INT,
  ambiguous INT
) AS $$
DECLARE
  v_test RECORD;
  v_validation RECORD;
  v_accords INT;
  v_total_valid INT;
  v_po FLOAT;
  v_pe FLOAT;
BEGIN
  -- Récupérer test
  SELECT * INTO v_test FROM level0_charte_tests WHERE test_id = p_test_id;
  
  -- Récupérer validations
  SELECT * INTO v_validation FROM disagreement_validation_summary WHERE test_id = p_test_id;
  
  -- Calculer accords corrigés
  v_accords := (v_test.total_pairs - v_test.disagreements_count) + COALESCE(v_validation.llm_was_right, 0);
  v_total_valid := v_test.total_pairs - COALESCE(v_validation.ambiguous_cases, 0);
  
  -- Calculer Kappa corrigé (simplifié)
  v_po := v_accords::FLOAT / v_total_valid;
  v_pe := 0.33;  -- Simplifié pour 3 catégories
  
  RETURN QUERY
  SELECT 
    v_test.kappa,
    ((v_po - v_pe) / (1 - v_pe))::FLOAT,
    v_test.total_pairs,
    v_test.disagreements_count,
    COALESCE(v_validation.llm_was_right, 0)::INT,
    COALESCE(v_validation.manual_was_right, 0)::INT,
    COALESCE(v_validation.ambiguous_cases, 0)::INT;
END;
$$ LANGUAGE plpgsql;
```

### 3. Triggers v2.0

```sql
-- ============================================================================
-- Trigger : Synchronisation bidirectionnelle annotations ↔ analysis_pairs
-- ============================================================================

-- Version simplifiée (gardée de v1.0)
-- Sync gold_consensus vers analysis_pairs uniquement

CREATE OR REPLACE FUNCTION sync_gold_to_analysis_pairs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.annotator_type = 'gold_consensus' THEN
    UPDATE analysis_pairs
    SET 
      level0_gold_conseiller = COALESCE(NEW.strategy_tag, level0_gold_conseiller),
      level0_gold_client = COALESCE(NEW.reaction_tag, level0_gold_client)
    WHERE pair_id = NEW.pair_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_gold
  AFTER INSERT OR UPDATE ON annotations
  FOR EACH ROW
  WHEN (NEW.annotator_type = 'gold_consensus')
  EXECUTE FUNCTION sync_gold_to_analysis_pairs();
```

### 4. Migration des Données v2.0

```sql
-- ============================================================================
-- Migration : Importer annotations manuelles
-- ============================================================================

-- Étape 1 : Créer les chartes humaines (philosophies sans prompt)
INSERT INTO level0_chartes (
  charte_id,
  charte_name,
  charte_description,
  philosophy,
  variable,
  version,
  definition,
  prompt_template,
  prompt_params,
  is_baseline
) VALUES
  (
    'Human_Manual_Minimaliste',
    'Annotation Manuelle - Philosophie Minimaliste',
    'Classification manuelle 3 catégories (documentation écrite)',
    'Minimaliste',
    'Y',
    '1.0.0',
    '{"categories": {"CLIENT_POSITIF": {}, "CLIENT_NEUTRE": {}, "CLIENT_NEGATIF": {}}}',
    NULL,  -- Pas de prompt pour humains
    NULL,
    true
  );

-- Étape 2 : Migrer depuis analysis_pairs
INSERT INTO annotations (
  pair_id,
  annotator_type,
  annotator_id,
  charte_id,
  strategy_tag,
  reaction_tag,
  annotation_context
)
SELECT 
  pair_id,
  'human_manual',
  'thomas_initial',
  'Human_Manual_Minimaliste',
  strategy_tag,
  reaction_tag,
  jsonb_build_object(
    'source', 'migration_from_analysis_pairs',
    'original_table', 'turntagged',
    'migrated_at', NOW()
  )
FROM analysis_pairs
WHERE strategy_tag IS NOT NULL OR reaction_tag IS NOT NULL
ON CONFLICT (pair_id, annotator_type, annotator_id) DO NOTHING;

-- Validation
SELECT COUNT(*) FROM annotations WHERE annotator_type = 'human_manual';
-- Attendu : 901
```

================================================================================
## WORKFLOW COMPLET v2.0
================================================================================

### Phase 0 : Définition des Chartes

```
1. CRÉER PHILOSOPHIES
   └─> Définir approches conceptuelles (Minimaliste, Enrichie, etc.)
   └─> Documenter critères de classification
   └─> Définir catégories pour chaque philosophie

2. CRÉER BASELINE PROMPTS
   └─> Pour chaque philosophie, créer version 1.0.0
   └─> Prompt simple basé sur définition philosophie
   └─> Insérer dans level0_chartes avec is_baseline=true

3. DOCUMENTER POUR HUMAINS
   └─> Créer instructions écrites (philosophie uniquement)
   └─> Pas de prompt (annotateurs humains)
```

### Phase 1 : Tests Initiaux (Baselines)

```
1. TESTER CHAQUE PHILOSOPHIE
   ├─> Sélectionner une philosophie (ex: Minimaliste)
   ├─> Charger baseline prompt (v1.0.0)
   ├─> Tester sur N paires (recommandé: 50-100 pour tests rapides)
   ├─> Calculer Kappa brut
   └─> Sauvegarder dans level0_charte_tests

2. COMPARER PHILOSOPHIES
   ├─> Tester toutes les baselines
   ├─> Comparer Kappa bruts
   └─> Identifier philosophie(s) prometteuse(s)

Résultat attendu :
┌──────────────┬──────────┬──────────────┬────────┐
│ Philosophie  │ Version  │ Kappa Brut   │ Note   │
├──────────────┼──────────┼──────────────┼────────┤
│ Minimaliste  │ 1.0.0    │ 0.60         │ À opt  │
│ Enrichie     │ 1.0.0    │ 0.55         │ Faible │
│ Binaire      │ 1.0.0    │ 0.75         │ ⭐ Top │
└──────────────┴──────────┴──────────────┴────────┘
```

### Phase 2 : Validation Désaccords

```
1. EXAMINER DÉSACCORDS
   ├─> Interface : DisagreementValidationPanel
   ├─> Pour chaque désaccord :
   │   ├─> Afficher contexte (verbatim + prev/next)
   │   ├─> Voir tag manuel vs tag LLM
   │   ├─> Lire raisonnement LLM
   │   └─> Décider : llm_correct / manual_correct / ambiguous
   └─> OBLIGATOIRE : Justifier chaque décision

2. ANALYSER PATTERNS
   ├─> Grouper désaccords injustifiés par type
   ├─> Exemples de patterns :
   │   ├─ Confusion tags similaires (NEGATIF vs NON_POSITIF)
   │   ├─ Contexte ignoré (ne lit pas prev/next)
   │   ├─ Nuances émotionnelles ratées
   │   └─ Règles de priorité non respectées
   └─> Documenter pour optimisation

3. CALCULER KAPPA CORRIGÉ
   └─> Utiliser function calculate_corrected_kappa()
   └─> Métrique réelle de qualité

Exemple résultat :
┌─────────────┬─────┬──────────┬─────────┬──────────────┐
│ Test        │ Κ₀  │ Désacc   │ Injust  │ Κ_corrigé    │
├─────────────┼─────┼──────────┼─────────┼──────────────┤
│ Min v1.0.0  │0.60 │ 40/100   │ 25      │ 0.70         │
└─────────────┴─────┴──────────┴─────────┴──────────────┘
```

### Phase 3 : Optimisation Prompts

```
1. AMÉLIORER PROMPT
   ├─> Identifier patterns d'erreurs (Phase 2)
   ├─> Créer version améliorée (v1.1.0)
   ├─> Modifications possibles :
   │   ├─ Ajouter exemples spécifiques
   │   ├─ Clarifier définitions catégories
   │   ├─ Ajouter règles de priorité
   │   ├─ Élargir contexte (prev2/next2)
   │   └─ Ajuster paramètres (temperature, model)
   └─> Insérer nouvelle charte dans level0_chartes

2. RETESTER
   └─> Même protocole que Phase 1
   └─> Sur MÊMES paires pour comparabilité

3. VALIDER AMÉLIORATION
   ├─> Validation désaccords (Phase 2)
   ├─> Comparer Κ_corrigé v1.0.0 vs v1.1.0
   └─> Si amélioration : continuer itération
   └─> Si stagnation : philosophie optimisée

4. ITÉRER
   └─> Répéter jusqu'à convergence ou plateau
   └─> Typiquement : 3-5 versions par philosophie

Progression typique :
┌──────────┬──────────────────┬─────┬────────┬────────┐
│ Version  │ Changement       │ Κ₀  │ Injust │ Κ_corr │
├──────────┼──────────────────┼─────┼────────┼────────┤
│ 1.0.0    │ Baseline         │0.60 │ 25/100 │ 0.70   │
│ 1.1.0    │ + Exemples       │0.68 │ 18/100 │ 0.78   │
│ 1.2.0    │ + Règles         │0.75 │ 12/100 │ 0.85   │
│ 1.3.0    │ + Contexte       │0.85 │ 6/100  │ 0.92 ⭐│
└──────────┴──────────────────┴─────┴────────┴────────┘
```

### Phase 4 : Sélection Gold Standard

```
1. COMPARER MEILLEURES VERSIONS
   ├─> Pour chaque philosophie : meilleure version
   ├─> Tester sur corpus COMPLET (901 paires)
   └─> Valider désaccords

2. SÉLECTIONNER GOLD
   ├─> Critère principal : Κ_corrigé maximal
   ├─> Critères secondaires :
   │   ├─ Stabilité (variance faible)
   │   ├─ Interprétabilité (raisonnements clairs)
   │   └─ Efficacité (temps d'exécution, coût)
   └─> Décision validée par équipe recherche

3. CRÉER ANNOTATIONS GOLD
   INSERT INTO annotations
   SELECT 
     pair_id,
     'gold_consensus',
     '{charte_id}_validated',
     charte_id,
     strategy_tag,
     reaction_tag,
     ...
   FROM annotations
   WHERE annotator_id = '{meilleure_charte}';

4. SYNCHRONISER
   └─> Trigger met à jour analysis_pairs automatiquement
   └─> level0_gold_client / level0_gold_conseiller remplis
```

### Phase 5 : Utilisation Level 1/2

```
1. LEVEL 1 : ALGORITHMES
   └─> Utiliser gold_consensus pour calculer M1/M2/M3
   └─> Tous algorithmes validés sur tags gold

2. LEVEL 2 : HYPOTHÈSES
   └─> Tester H1/H2 avec gold_consensus
   └─> Robustesse : tester aussi avec autres annotateurs
   
3. ANALYSE ROBUSTESSE
   ├─> H1 validée avec gold_consensus ?
   ├─> H1 validée avec thomas_initial ?
   ├─> H1 validée avec autres chartes LLM ?
   └─> Rapport : "H1 robuste à la méthode d'annotation"
```

================================================================================
## CORRECTIONS TECHNIQUES v2.0
================================================================================

### Correction 1 : UPSERT au lieu de INSERT (✅ FAIT)

**Problème** : Erreur 409 Conflict si on reteste une charte.

**Solution** :
```typescript
// AnnotationService.ts - ligne ~70
const { data, error } = await this.supabase
  .from("annotations")
  .upsert(  // ✅ UPSERT au lieu de INSERT
    inputs.map(...),
    {
      onConflict: 'pair_id,annotator_type,annotator_id',
      ignoreDuplicates: false
    }
  )
  .select();
```

### Correction 2 : test_id = NULL (✅ FAIT)

**Problème** : FK constraint violation (test_id pas encore créé).

**Solution** :
```typescript
// MultiCharteAnnotator.ts - ligne ~115
annotation_context: {...},
test_id: null  // ✅ NULL au lieu de testId
```

### Correction 3 : Minimum 2 Paires (✅ FAIT Sprint 2.5)

**Problème** : Kappa = NaN avec 1 seule paire.

**Solution** :
```typescript
// Level0Interface.tsx - ligne ~90
onChange={(e) => setSampleSize(Math.max(2, Math.min(901, ...)))}
helperText="2-901 paires (min 2 pour Kappa)"
```

### Correction 4 : Protection NaN (À FAIRE)

**Problème** : Kappa = NaN si catégories déséquilibrées.

**Solution** :
```typescript
// MultiCharteAnnotator.ts - après calcul Kappa
const kappaResult = KappaCalculationService.calculateKappa(annotationPairs);

// Vérifier validité
if (isNaN(kappaResult.kappa) || !isFinite(kappaResult.kappa)) {
  console.warn(`[MultiCharteAnnotator] Kappa invalide, utilisation 0`);
  kappaResult.kappa = 0;
}
```

### Correction 5 : Normalisation Tags LLM (À FAIRE)

**Problème** : LLM génère variantes (CLIENT_NON_POSITIF vs CLIENT_NEGATIF).

**Solution** :
```typescript
// OpenAIAnnotatorService.ts - avant sauvegarde
function normalizeYTag(tag: string): YTag {
  const normalized = tag.toUpperCase().replace(/[_-]/g, '_');
  
  // Mapper variantes vers tags canoniques
  if (normalized.includes('NON_POSITIF') || 
      normalized.includes('NEGATIF')) {
    return 'CLIENT_NEGATIF';
  }
  if (normalized.includes('POSITIF') && !normalized.includes('NON')) {
    return 'CLIENT_POSITIF';
  }
  return 'CLIENT_NEUTRE';
}
```

================================================================================
## PLAN D'IMPLÉMENTATION v2.0
================================================================================

### Sprint 2 : Services Métier (✅ COMPLÉTÉ 2025-12-17)

**Réalisé :**
- ✅ AnnotationService.ts (CRUD annotations)
- ✅ InterAnnotatorAgreementService.ts (Kappa N×N)
- ✅ HypothesisRobustnessService.ts (test H1/H2)
- ✅ MultiCharteAnnotator.ts intégré (sauvegarde automatique)
- ✅ Types unifiés (UnifiedAnnotationTypes)
- ✅ Corrections UPSERT + test_id=NULL
- ✅ Compilation TypeScript OK

**Fichiers créés :**
- src/features/phase3-analysis/level0-gold/domain/services/AnnotationService.ts
- src/features/phase3-analysis/level0-gold/domain/services/InterAnnotatorAgreementService.ts
- src/features/phase3-analysis/level0-gold/domain/services/HypothesisRobustnessService.ts
- src/types/algorithm-lab/Level0Types.ts (enrichi)

### Sprint 2.5 : UX Sélection Chartes (✅ COMPLÉTÉ 2025-12-17)

**Réalisé :**
- ✅ Sélection unitaire de chartes (économie 66% coûts API)
- ✅ Interface avec Chips cliquables
- ✅ Calcul dynamique coût API
- ✅ Minimum 2 paires configuré
- ✅ Tests fonctionnels validés

**Fichiers modifiés :**
- src/features/phase3-analysis/level0-gold/ui/components/Level0Interface.tsx
- src/features/phase3-analysis/level0-gold/ui/hooks/useLevel0Testing.ts

### Sprint 3 : Intégration level0_chartes (🔜 PRIORITÉ HAUTE)

**Durée estimée** : 4h

**Objectifs :**
1. Modifier table `level0_chartes` (ajouter colonnes philosophy, version, etc.)
2. Migrer CharteRegistry.ts vers base de données
3. Créer service CharteManagementService.ts
4. Adapter MultiCharteAnnotator pour charger chartes depuis DB
5. Interface CRUD chartes (optionnel)

**Tâches détaillées :**

#### 3.1. Migration SQL
```sql
-- Ajouter colonnes manquantes à level0_chartes
ALTER TABLE level0_chartes
ADD COLUMN IF NOT EXISTS philosophy TEXT,
ADD COLUMN IF NOT EXISTS version TEXT,
ADD COLUMN IF NOT EXISTS prompt_template TEXT,
ADD COLUMN IF NOT EXISTS prompt_params JSONB,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Contrainte unicité
ALTER TABLE level0_chartes
ADD CONSTRAINT unique_philosophy_version 
UNIQUE(philosophy, variable, version);

-- Migrer données depuis CharteRegistry.ts
-- (Script manuel basé sur définitions actuelles)
```

#### 3.2. Service CharteManagementService.ts
```typescript
export class CharteManagementService {
  static async getChartes(variable?: 'X' | 'Y'): Promise<CharteDefinition[]>
  static async getCharteById(charteId: string): Promise<CharteDefinition | null>
  static async getChartesByPhilosophy(philosophy: string): Promise<CharteDefinition[]>
  static async createCharte(charte: CharteInput): Promise<CharteDefinition>
  static async updateCharte(charteId: string, updates: Partial<CharteInput>): Promise<void>
  static async getBaselines(): Promise<CharteDefinition[]>
}
```

#### 3.3. Adapter CharteRegistry.ts
```typescript
// Avant : données en dur
export const CHARTES_Y = [...]

// Après : wrapper vers DB
export class CharteRegistry {
  static async getChartesForVariable(variable: 'X' | 'Y'): Promise<CharteDefinition[]> {
    return CharteManagementService.getChartes(variable);
  }
}
```

**Livrables :**
- migrations/003_enrich_level0_chartes.sql
- src/features/phase3-analysis/level0-gold/domain/services/CharteManagementService.ts
- src/features/phase3-analysis/level0-gold/domain/services/CharteRegistry.ts (adapté)

**Validation :**
```sql
-- Test 1 : Chartes migrées
SELECT COUNT(*) FROM level0_chartes;
-- Attendu : ≥5 (chartes existantes)

-- Test 2 : Philosophies distinctes
SELECT DISTINCT philosophy FROM level0_chartes;
-- Attendu : Minimaliste, Enrichie, Binaire...
```

### Sprint 4 : Validation Désaccords (🔜 PRIORITÉ HAUTE)

**Durée estimée** : 6h

**Objectifs :**
1. Créer table disagreement_validations
2. Service DisagreementValidationService.ts
3. Interface DisagreementValidationPanel.tsx
4. Calcul Kappa corrigé

**Tâches détaillées :**

#### 4.1. Migration SQL
```sql
-- Créer table (voir section Architecture)
CREATE TABLE disagreement_validations (...);

-- Fonction Kappa corrigé
CREATE OR REPLACE FUNCTION calculate_corrected_kappa(...);
```

#### 4.2. Service TypeScript
```typescript
export class DisagreementValidationService {
  static async getDisagreements(testId: string): Promise<Disagreement[]>
  static async validateDisagreement(
    validationId: string,
    decision: ValidationDecision,
    comment: string,
    validatedTag: string
  ): Promise<void>
  static async getCorrectedKappa(testId: string): Promise<CorrectedKappaResult>
  static async getValidationSummary(testId: string): Promise<ValidationSummary>
}
```

#### 4.3. Interface UI
```typescript
// DisagreementValidationPanel.tsx
export const DisagreementValidationPanel: React.FC<{testId: string}> = ({testId}) => {
  // État
  const [disagreements, setDisagreements] = useState<Disagreement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decision, setDecision] = useState<ValidationDecision>('pending');
  const [comment, setComment] = useState('');
  
  // Affichage
  return (
    <Card>
      <CardHeader>
        Validation Désaccord {currentIndex + 1}/{disagreements.length}
      </CardHeader>
      <CardContent>
        {/* Verbatim + contexte */}
        {/* Tags manuel vs LLM */}
        {/* Raisonnement LLM */}
        {/* Radio buttons décision */}
        {/* TextArea justification (obligatoire) */}
        {/* Navigation précédent/suivant */}
      </CardContent>
    </Card>
  );
};
```

**Livrables :**
- migrations/004_create_disagreement_validations.sql
- src/features/phase3-analysis/level0-gold/domain/services/DisagreementValidationService.ts
- src/features/phase3-analysis/level0-gold/ui/components/DisagreementValidationPanel.tsx

**Validation :**
- [ ] Interface affiche désaccords avec contexte
- [ ] Validation sauvegarde décision + commentaire
- [ ] Kappa corrigé calculé automatiquement
- [ ] Métriques mises à jour dans level0_charte_tests

### Sprint 5 : Corrections Techniques (🔜 PRIORITÉ MOYENNE)

**Durée estimée** : 2h

**Tâches :**
1. Protection NaN dans KappaCalculationService
2. Normalisation tags LLM dans OpenAIAnnotatorService
3. Tests unitaires des corrections
4. Validation E2E

**Livrables :**
- src/features/phase3-analysis/level0-gold/domain/services/KappaCalculationService.ts (modifié)
- src/features/phase3-analysis/level0-gold/domain/services/OpenAIAnnotatorService.ts (modifié)
- tests/corrections-techniques.spec.ts

### Sprint 6 : Interface Comparaison Philosophies (🔜 PRIORITÉ BASSE)

**Durée estimée** : 4h

**Objectifs :**
1. PhilosophyComparisonPanel.tsx
2. Graphiques évolution par version
3. Tableau synthèse inter-philosophies

**Livrables :**
- src/features/phase3-analysis/level0-gold/ui/components/PhilosophyComparisonPanel.tsx
- src/features/phase3-analysis/level0-gold/ui/hooks/usePhilosophyComparison.ts

### Sprint 7 : Documentation & Thèse (🔜 PRIORITÉ BASSE)

**Durée estimée** : 3h

**Tâches :**
1. Guide méthodologique complet
2. Tableaux pour thèse (LaTeX)
3. Figures et graphiques
4. Vidéo démo workflow

**Livrables :**
- docs/methodology-level0-charter-optimization.md
- docs/thesis/tables-philosophy-comparison.tex
- docs/thesis/figures/kappa-evolution.png
- docs/demo-level0-workflow.mp4

================================================================================
## ÉTAT ACTUEL - SESSION 2025-12-17
================================================================================

### Réalisations

**Base de données :**
- ✅ Table `annotations` créée et opérationnelle
- ✅ 901 annotations manuelles migrées
- ✅ Triggers sync bidirectionnel
- ✅ RPC functions (compare_annotators, get_annotator_stats)
- ✅ Vues matérialisées (annotations_summary)
- ✅ Politiques RLS configurées

**Services TypeScript :**
- ✅ AnnotationService (CRUD + comparaison)
- ✅ InterAnnotatorAgreementService (Kappa N×N)
- ✅ HypothesisRobustnessService (test H1/H2)
- ✅ MultiCharteAnnotator intégré (sauvegarde auto)
- ✅ ~2030 lignes de code production

**Interface utilisateur :**
- ✅ Sélection unitaire chartes (Sprint 2.5)
- ✅ Configuration flexible (2-901 paires)
- ✅ Économie API visible (66% avec 1 charte)
- ✅ Affichage résultats avec Kappa

**Corrections techniques :**
- ✅ UPSERT au lieu de INSERT
- ✅ test_id = NULL (évite FK constraint)
- ✅ Minimum 2 paires pour Kappa valide
- ✅ Compilation TypeScript 100% OK

### Limitations Identifiées

**Niveau conceptuel :**
- ❌ Distinction philosophie/prompt pas encore en DB
- ❌ Table level0_chartes pas exploitée (données en code)
- ❌ Pas de versioning explicite des chartes

**Niveau validation :**
- ❌ Pas de qualification des désaccords (justifié/injustifié)
- ❌ Pas de Kappa corrigé (seulement Kappa brut)
- ❌ Pas d'interface validation désaccords

**Niveau technique :**
- ❌ Tags LLM non normalisés (variantes possibles)
- ❌ Protection NaN pas implémentée partout
- ❌ Pas d'archivage tests anciens

### Prochaines Priorités

**Ordre recommandé :**

1. **Sprint 3 : Intégration level0_chartes** (4h)
   - Bloquer pour : Gestion propre des philosophies
   - Impact : Architecture + Méthodologie thèse

2. **Sprint 4 : Validation désaccords** (6h)
   - Bloquer pour : Métriques corrigées (Kappa ajusté)
   - Impact : Qualité scientifique résultats

3. **Sprint 5 : Corrections techniques** (2h)
   - Bloquer pour : Robustesse production
   - Impact : Fiabilité système

4. **Sprint 6 : Interface comparaison** (4h)
   - Nice to have : Visualisation pour thèse
   - Impact : UX + Documentation

5. **Sprint 7 : Documentation** (3h)
   - Nice to have : Finalisation thèse
   - Impact : Reproductibilité

**Durée totale restante** : ~19h (soit 3-4 sessions)

================================================================================
## MÉTRIQUES DE SUCCÈS v2.0
================================================================================

### Critères Validation Technique

- [x] Table `annotations` créée avec contraintes ✅
- [x] Migration 901 annotations manuelles ✅
- [x] Sauvegarde annotations LLM fonctionnelle ✅
- [x] Service `AnnotationService` opérationnel ✅
- [x] Calcul Kappa entre 2 annotateurs ✅
- [x] UPSERT implémenté (pas de doublons) ✅
- [x] Sélection unitaire chartes (économie API) ✅
- [ ] Table `level0_chartes` exploitée
- [ ] Table `disagreement_validations` créée
- [ ] Kappa corrigé calculable
- [ ] Protection NaN implémentée
- [ ] Normalisation tags LLM active

### Critères Validation Scientifique

- [x] Kappa brut calculé automatiquement ✅
- [ ] Kappa corrigé après validation désaccords
- [ ] Désaccords qualifiés (justifié/injustifié/ambigu)
- [ ] ≥3 philosophies testées
- [ ] ≥2 versions par philosophie
- [ ] Tableau comparatif philosophies
- [ ] Graphique évolution par version
- [ ] Rapport méthodologique complet

### Critères Validation Utilisateur

- [x] Interface Level 0 intuitive ✅
- [x] Sélection chartes flexible ✅
- [x] Feedback coût API immédiat ✅
- [ ] Interface validation désaccords ergonomique
- [ ] Workflow complet documenté
- [ ] Vidéo démo disponible

================================================================================
## RÉFÉRENCES v2.0
================================================================================

### Documents Mission

- mission-2025-12-16-level0-SPECS-unified-annotations.md (v1.0)
- mission-2025-12-17-sprint2-typescript-services.md (session actuelle)
- mission-2025-12-17-clarifications-architecture.md (session actuelle)

### Standards Scientifiques

- Cohen's Kappa : Cohen (1960)
- Corrected Kappa : Feinstein & Cicchetti (1990)
- Landis & Koch interpretation : Landis & Koch (1977)
- Inter-rater reliability : Fleiss (1971)

### Documentation Technique

- Supabase UPSERT : https://supabase.com/docs/guides/database/postgres/upsert
- PostgreSQL Triggers : https://www.postgresql.org/docs/current/triggers.html
- TypeScript Services : https://www.typescriptlang.org/docs/

================================================================================
FIN DU DOCUMENT - VERSION 2.0 - 2025-12-17
================================================================================
