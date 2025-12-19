# 📐 Spécifications Système de Tuning des Chartes Level0

**Date** : 2025-12-19  
**Sprint** : Sprint 5 (proposition)  
**Objectif** : Système complet de gestion, analyse et amélioration des chartes d'annotation

---

## 🎯 VISION GÉNÉRALE

### Problème à Résoudre

Actuellement :
- ❌ Le LLM génère des tags invalides (ex: `CLIENT_NON_POSITIF`)
- ❌ Les désaccords doivent être validés manuellement à chaque test
- ❌ Pas de retour d'expérience structuré pour améliorer les chartes
- ❌ Pas d'interface pour gérer les définitions de chartes

### Solution Proposée

Un système intégré qui :
1. ✅ Permet de gérer les chartes (alias, catégories, exemples)
2. ✅ Détecte automatiquement les patterns dans les validations
3. ✅ Génère des suggestions d'amélioration basées sur les données
4. ✅ Historise toutes les modifications pour traçabilité scientifique
5. ✅ Facilite le cycle itératif de fine-tuning

---

## 📊 ARCHITECTURE DE DONNÉES

### Tables Existantes (à conserver)

#### 1. `level0_chartes`
```sql
-- Table principale des chartes
CREATE TABLE level0_chartes (
  charte_id TEXT PRIMARY KEY,
  charte_name TEXT NOT NULL,
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  philosophy TEXT NOT NULL,
  version TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  prompt_params JSONB NOT NULL,
  definition JSONB NOT NULL,  -- ⭐ Contient categories, rules, aliases
  gold_standard_id TEXT REFERENCES gold_standards(gold_standard_id),
  is_baseline BOOLEAN DEFAULT false,
  
  -- ⭐ NOUVELLES COLONNES POUR WORKFLOW DE VALIDATION
  is_pending_validation BOOLEAN DEFAULT false,  -- Version en attente de re-test
  parent_version TEXT,                          -- Version dont elle dérive
  validation_deadline TIMESTAMPTZ,              -- Limite pour valider (optionnel)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Structure du JSONB `definition`** :
```json
{
  "rules": {
    "approach": "few_shot",
    "context_included": false,
    "examples_per_category": 3,
    "reasoning_required": false
  },
  "categories": {
    "CLIENT_POSITIF": {
      "description": "Le client exprime un accord ou une satisfaction",
      "examples": ["oui", "d'accord", "merci"],
      "keywords": ["oui", "d'accord", "bien"],
      "counter_examples": ["oui mais", "d'accord mais"]
    },
    "CLIENT_NEUTRE": { ... },
    "CLIENT_NEGATIF": { ... }
  },
  "aliases": {
    "CLIENT_NON_POSITIF": "CLIENT_NEGATIF",
    "CLIENT_NON_NEGATIF": "CLIENT_POSITIF"
  }
}
```

#### 2. `level0_charte_tests`
```sql
-- Résultats des tests de chartes
CREATE TABLE level0_charte_tests (
  test_id UUID PRIMARY KEY,
  charte_id TEXT REFERENCES level0_chartes(charte_id),
  variable TEXT NOT NULL,
  kappa FLOAT,
  kappa_corrected FLOAT,
  accuracy FLOAT,
  total_pairs INTEGER,
  disagreements_count INTEGER,
  disagreements JSONB,
  validated_disagreements INTEGER DEFAULT 0,
  unjustified_disagreements INTEGER DEFAULT 0,
  metrics JSONB,
  philosophy TEXT,
  version TEXT,
  openai_model TEXT,
  tested_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `disagreement_validations`
```sql
-- Validations manuelles des désaccords
CREATE TABLE disagreement_validations (
  validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES level0_charte_tests(test_id),
  pair_id INTEGER REFERENCES analysis_pairs(pair_id),
  charte_id TEXT REFERENCES level0_chartes(charte_id),
  manual_tag TEXT NOT NULL,
  llm_tag TEXT NOT NULL,
  llm_confidence FLOAT,
  llm_reasoning TEXT,
  validation_decision TEXT NOT NULL CHECK (
    validation_decision IN ('CAS_A_LLM_CORRECT', 'CAS_B_LLM_INCORRECT', 'CAS_C_AMBIGUOUS')
  ),
  corrected_tag TEXT,  -- Si CAS A : nouveau tag gold standard
  validation_comment TEXT,  -- Justification de Thomas
  verbatim TEXT,
  context_before TEXT,
  context_after TEXT,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(test_id, pair_id)
);

CREATE INDEX idx_dv_test_decision ON disagreement_validations(test_id, validation_decision);
CREATE INDEX idx_dv_charte ON disagreement_validations(charte_id);
```

---

### Nouvelles Tables (à créer)

#### 4. `charte_modifications`
**Objectif** : Historiser toutes les modifications apportées aux chartes pour traçabilité scientifique

```sql
CREATE TABLE charte_modifications (
  modification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  version_from TEXT NOT NULL,
  version_to TEXT NOT NULL,
  modification_type TEXT NOT NULL CHECK (
    modification_type IN (
      'alias_added', 'alias_removed',
      'example_added', 'example_removed',
      'description_changed', 'rule_changed',
      'category_added', 'category_removed'
    )
  ),
  field_modified TEXT NOT NULL,  -- Ex: "definition.aliases.CLIENT_NON_POSITIF"
  old_value JSONB,
  new_value JSONB,
  reason TEXT,  -- Justification de la modification
  source_test_id UUID REFERENCES level0_charte_tests(test_id),
  source_suggestion_id UUID,  -- Lien vers suggestion (si applicable)
  modified_by TEXT DEFAULT 'Thomas',
  modified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cm_charte ON charte_modifications(charte_id);
CREATE INDEX idx_cm_version ON charte_modifications(version_to);
CREATE INDEX idx_cm_type ON charte_modifications(modification_type);
```

**Exemple d'entrée** :
```json
{
  "modification_id": "uuid-123",
  "charte_id": "CharteY_B_v1.0.0",
  "version_from": "1.0.0",
  "version_to": "1.1.0",
  "modification_type": "alias_added",
  "field_modified": "definition.aliases.CLIENT_NON_POSITIF",
  "old_value": null,
  "new_value": "CLIENT_NEGATIF",
  "reason": "Détecté 3 fois dans test abc-123 avec confiance 90%",
  "source_test_id": "abc-123",
  "modified_by": "Thomas",
  "modified_at": "2025-12-19T15:00:00Z"
}
```

#### 5. `charte_improvement_suggestions`
**Objectif** : Stocker les suggestions d'amélioration générées automatiquement

```sql
CREATE TABLE charte_improvement_suggestions (
  suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  test_id UUID NOT NULL REFERENCES level0_charte_tests(test_id),
  suggestion_type TEXT NOT NULL CHECK (
    suggestion_type IN (
      'add_alias', 'remove_alias',
      'add_example', 'add_counter_example',
      'clarify_description', 'merge_categories',
      'adjust_rule'
    )
  ),
  category TEXT,  -- Catégorie concernée (si applicable)
  priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3)),  -- 1=Critique, 2=Important, 3=Nice-to-have
  description TEXT NOT NULL,  -- Description lisible de la suggestion
  supporting_data JSONB NOT NULL,  -- Données justificatives
  
  -- ⭐ NOUVEAUX STATUTS POUR WORKFLOW DE VALIDATION
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',                      -- Suggestion en attente de décision
      'applied_pending_validation',   -- Appliquée, en attente de re-test
      'applied_validated',            -- Appliquée ET validée par re-test (amélioration confirmée)
      'applied_rolled_back',          -- Appliquée puis annulée (régression détectée)
      'rejected'                      -- Rejetée par Thomas sans application
    )
  ),
  
  -- ⭐ NOUVELLES COLONNES POUR TRAÇABILITÉ
  applied_at TIMESTAMPTZ,
  applied_in_version TEXT,
  validation_test_id UUID REFERENCES level0_charte_tests(test_id),  -- Test de validation post-application
  kappa_before FLOAT,          -- Kappa avant application
  kappa_after FLOAT,           -- Kappa après application
  rollback_reason TEXT,        -- Raison du rollback si applicable
  rejection_reason TEXT,       -- Raison du rejet si applicable
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cis_charte_status ON charte_improvement_suggestions(charte_id, status);
CREATE INDEX idx_cis_priority ON charte_improvement_suggestions(priority, status);
CREATE INDEX idx_cis_test ON charte_improvement_suggestions(test_id);
CREATE INDEX idx_cis_validation ON charte_improvement_suggestions(validation_test_id);
```

**Structure `supporting_data`** :
```json
{
  "frequency": 3,
  "thomas_comments": [
    "LLM a raison mais tag invalide",
    "Encore ce tag inventé, faudrait l'ajouter"
  ],
  "examples": [
    "un problème... mais nous on n'a jamais...",
    "oui mais..."
  ],
  "avg_confidence": 0.90,
  "pairs": [3187, 3501, 3768],
  "confused_with": "CLIENT_POSITIF",  // Pour clarify_description
  "current_description": "..."  // Pour comparaison
}
```

#### 6. `charte_category_stats`
**Objectif** : Statistiques agrégées par catégorie pour chaque test

```sql
CREATE TABLE charte_category_stats (
  stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  test_id UUID NOT NULL REFERENCES level0_charte_tests(test_id),
  category TEXT NOT NULL,
  total_instances INTEGER NOT NULL,
  correct_predictions INTEGER NOT NULL,
  cas_a_count INTEGER DEFAULT 0,
  cas_b_count INTEGER DEFAULT 0,
  cas_c_count INTEGER DEFAULT 0,
  avg_confidence FLOAT,
  min_confidence FLOAT,
  max_confidence FLOAT,
  most_common_errors JSONB,  -- Top 5 verbatims problématiques
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(test_id, category)
);

CREATE INDEX idx_ccs_test ON charte_category_stats(test_id);
CREATE INDEX idx_ccs_charte ON charte_category_stats(charte_id);
```

**Exemple d'entrée** :
```json
{
  "category": "CLIENT_NEGATIF",
  "total_instances": 10,
  "correct_predictions": 7,
  "cas_a_count": 2,
  "cas_b_count": 1,
  "cas_c_count": 0,
  "avg_confidence": 0.85,
  "most_common_errors": [
    {"verbatim": "oui mais...", "frequency": 2, "confused_with": "CLIENT_NEUTRE"},
    {"verbatim": "d'accord", "frequency": 1, "confused_with": "CLIENT_POSITIF"}
  ]
}
```

---

## 🔄 FLUX DE DONNÉES COMPLET

### Phase 1 : Test & Validation

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Lance Test CharteY_B sur 10 paires                       │
│    → level0_charte_tests (1 ligne)                          │
│    → annotations (10 lignes LLM)                            │
│    → disagreements (5 détectés dans JSONB)                  │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Thomas valide les 5 désaccords                           │
│    → disagreement_validations (5 lignes)                    │
│    → pair_gold_standards (versions v2 si CAS A)            │
│    → level0_charte_tests.kappa_corrected (mis à jour)      │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Calcul automatique des stats par catégorie               │
│    Fonction : calculate_category_stats(test_id)             │
│    → charte_category_stats (3-5 lignes selon catégories)   │
└──────────────────────────────────────────────────────────────┘
```

### Phase 2 : Analyse & Suggestions

```
┌──────────────────────────────────────────────────────────────┐
│ 4. Génération automatique des suggestions                   │
│    Fonction : generate_charte_improvements(test_id)         │
│                                                              │
│    Analyse disagreement_validations :                       │
│    ├─ Pattern 1 : Alias manquant (CAS A + tag invalide)    │
│    ├─ Pattern 2 : Description ambiguë (CAS B répétés)      │
│    ├─ Pattern 3 : Exemples manquants (CAS C)               │
│    └─ Pattern 4 : Règles à ajuster (faible confiance)      │
│                                                              │
│    → charte_improvement_suggestions (3-10 lignes)          │
│       status: 'pending'                                     │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Thomas consulte les suggestions (Interface Tuning)       │
│    Visualise :                                               │
│    ├─ Suggestions par priorité                              │
│    ├─ Statistiques par catégorie                            │
│    ├─ Commentaires historiques                              │
│    └─ Exemples concrets                                      │
│                                                              │
│    Pour chaque suggestion :                                  │
│    [📋 Prévisualiser] [✅ Appliquer] [✏️ Modifier] [❌ Rejeter] │
└──────────────────────────────────────────────────────────────┘
```

### Phase 3 : Prévisualisation & Décision

```
┌──────────────────────────────────────────────────────────────┐
│ 6a. Thomas clique "Prévisualiser"                           │
│     SuggestionPreviewDialog s'ouvre                         │
│                                                              │
│     Affiche DIFF :                                           │
│     • Version actuelle (1.0.0)                              │
│     • Version proposée (1.1.0)                              │
│     • Impact estimé sur Kappa                               │
│                                                              │
│     Choix :                                                  │
│     [✅ Confirmer et appliquer]                             │
│     [✏️ Modifier avant d'appliquer]                         │
│     [← Retour]                                               │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6b. Si "Confirmer" → Application Automatique                │
│     Fonction : apply_charte_improvement()                   │
│                                                              │
│     a) Crée nouvelle version 1.1.0                          │
│        UPDATE level0_chartes                                │
│        SET version = '1.1.0',                               │
│            definition = [nouvelle définition],              │
│            is_pending_validation = true,    ← NOUVEAU       │
│            parent_version = '1.0.0'         ← NOUVEAU       │
│                                                              │
│     b) Enregistre la modification                           │
│        → charte_modifications (1 ligne)                     │
│                                                              │
│     c) Marque suggestion en attente de validation           │
│        UPDATE charte_improvement_suggestions                │
│        SET status = 'applied_pending_validation' ← NOUVEAU  │
│                                                              │
│     Message : "Version 1.1.0 créée. Re-testez pour valider" │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6c. Si "Modifier" → Édition Manuelle                        │
│     CharteEditorPanel s'ouvre                               │
│                                                              │
│     • Tous les paramètres éditables (voir section UI)       │
│     • Pré-rempli avec la suggestion                         │
│     • Thomas peut ajuster à sa guise                         │
│     • Sauvegarde créé v1.1.0 personnalisée                  │
│                                                              │
│     → Même résultat que 6b (version en attente validation)  │
└──────────────────────────────────────────────────────────────┘
```

### Phase 4 : Re-test de Validation

```
┌──────────────────────────────────────────────────────────────┐
│ 7. Thomas re-teste CharteY_B v1.1.0                         │
│    Test sur les 10 mêmes paires que v1.0.0                 │
│                                                              │
│    Résultats automatiquement comparés :                      │
│    • Kappa v1.0.0 : 0.65                                    │
│    • Kappa v1.1.0 : 0.85 ✅ (+0.20)                        │
│    • Désaccords : 5 → 2 ✅ (-60%)                          │
│                                                              │
│    CharteValidationPanel s'affiche :                        │
│    [✅ VALIDER DÉFINITIVEMENT]                              │
│    [⚠️ ROLLBACK (annuler v1.1.0)]                           │
└─────────────────────────┬────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 8a. Si "Valider" → Confirmation Permanente                  │
│                                                              │
│     UPDATE level0_chartes                                   │
│     SET is_pending_validation = false                       │
│     WHERE charte_id = 'CharteY_B' AND version = '1.1.0';   │
│                                                              │
│     UPDATE charte_improvement_suggestions                   │
│     SET status = 'applied_validated',      ← NOUVEAU        │
│         validation_test_id = [test_id],                     │
│         kappa_before = 0.65,                                │
│         kappa_after = 0.85                                  │
│     WHERE applied_in_version = '1.1.0';                     │
│                                                              │
│     ✅ Version 1.1.0 devient la référence permanente        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 8b. Si "Rollback" → Annulation & Retour                     │
│                                                              │
│     Fonction : rollback_charte_version()                    │
│                                                              │
│     a) Restaure version 1.0.0                               │
│        UPDATE level0_chartes                                │
│        SET version = '1.0.0',                               │
│            definition = [ancienne définition],              │
│            is_pending_validation = false                    │
│                                                              │
│     b) Enregistre le rollback                               │
│        → charte_modifications (type: 'rollback')           │
│                                                              │
│     c) Marque suggestion comme rolled back                  │
│        UPDATE charte_improvement_suggestions                │
│        SET status = 'applied_rolled_back',  ← NOUVEAU       │
│            rollback_reason = 'Régression Kappa',            │
│            kappa_before = 0.65,                             │
│            kappa_after = 0.60  (exemple régression)         │
│                                                              │
│     ⚠️ Thomas peut maintenant :                             │
│     • Modifier manuellement et créer une v1.1.0 différente  │
│     • Rejeter définitivement la suggestion                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ FONCTIONS SQL

### 1. `calculate_category_stats(test_id UUID)`

```sql
CREATE OR REPLACE FUNCTION calculate_category_stats(p_test_id UUID)
RETURNS void AS $$
DECLARE
  v_charte_id TEXT;
BEGIN
  -- Récupérer charte_id
  SELECT charte_id INTO v_charte_id
  FROM level0_charte_tests
  WHERE test_id = p_test_id;

  -- Supprimer stats existantes pour ce test
  DELETE FROM charte_category_stats WHERE test_id = p_test_id;

  -- Calculer stats pour chaque catégorie
  INSERT INTO charte_category_stats (
    charte_id, test_id, category,
    total_instances, correct_predictions,
    cas_a_count, cas_b_count, cas_c_count,
    avg_confidence, min_confidence, max_confidence,
    most_common_errors
  )
  SELECT 
    v_charte_id,
    p_test_id,
    dv.manual_tag as category,
    COUNT(*) as total_instances,
    COUNT(*) FILTER (WHERE dv.validation_decision = 'CAS_A_LLM_CORRECT') as correct_predictions,
    COUNT(*) FILTER (WHERE dv.validation_decision = 'CAS_A_LLM_CORRECT') as cas_a_count,
    COUNT(*) FILTER (WHERE dv.validation_decision = 'CAS_B_LLM_INCORRECT') as cas_b_count,
    COUNT(*) FILTER (WHERE dv.validation_decision = 'CAS_C_AMBIGUOUS') as cas_c_count,
    AVG(dv.llm_confidence) as avg_confidence,
    MIN(dv.llm_confidence) as min_confidence,
    MAX(dv.llm_confidence) as max_confidence,
    
    -- Top 5 erreurs les plus fréquentes
    (
      SELECT jsonb_agg(error_data)
      FROM (
        SELECT jsonb_build_object(
          'verbatim', dv2.verbatim,
          'frequency', COUNT(*),
          'confused_with', dv2.llm_tag
        ) as error_data
        FROM disagreement_validations dv2
        WHERE dv2.test_id = p_test_id
          AND dv2.manual_tag = dv.manual_tag
          AND dv2.validation_decision IN ('CAS_B_LLM_INCORRECT', 'CAS_C_AMBIGUOUS')
        GROUP BY dv2.verbatim, dv2.llm_tag
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) errors
    ) as most_common_errors
    
  FROM disagreement_validations dv
  WHERE dv.test_id = p_test_id
  GROUP BY dv.manual_tag;

END;
$$ LANGUAGE plpgsql;
```

### 2. `generate_charte_improvements(test_id UUID)`

```sql
CREATE OR REPLACE FUNCTION generate_charte_improvements(p_test_id UUID)
RETURNS TABLE (
  suggestion_type TEXT,
  category TEXT,
  priority INTEGER,
  description TEXT,
  supporting_data JSONB
) AS $$
BEGIN
  -- Pattern 1 : Alias Manquant (CAS A + tag LLM invalide)
  RETURN QUERY
  SELECT 
    'add_alias'::TEXT,
    dv.llm_tag,
    1 as priority,  -- CRITIQUE
    'Ajouter alias: ' || dv.llm_tag || ' → ' || MODE() WITHIN GROUP (ORDER BY dv.corrected_tag),
    jsonb_build_object(
      'frequency', COUNT(*),
      'thomas_comments', jsonb_agg(dv.validation_comment),
      'examples', jsonb_agg(dv.verbatim),
      'avg_confidence', AVG(dv.llm_confidence),
      'pairs', jsonb_agg(dv.pair_id),
      'target_tag', MODE() WITHIN GROUP (ORDER BY dv.corrected_tag)
    )
  FROM disagreement_validations dv
  WHERE dv.test_id = p_test_id
    AND dv.validation_decision = 'CAS_A_LLM_CORRECT'
    AND dv.llm_tag NOT IN (
      SELECT jsonb_object_keys(definition->'categories')
      FROM level0_chartes lc
      JOIN level0_charte_tests lct ON lct.charte_id = lc.charte_id
      WHERE lct.test_id = p_test_id
    )
  GROUP BY dv.llm_tag
  HAVING COUNT(*) >= 2;  -- Au moins 2 occurrences

  -- Pattern 2 : Description Ambiguë (CAS B répétés)
  RETURN QUERY
  SELECT 
    'clarify_description'::TEXT,
    dv.manual_tag,
    2 as priority,  -- IMPORTANT
    'Clarifier la description de ' || dv.manual_tag || 
    ' (confusion fréquente avec ' || dv.llm_tag || ')',
    jsonb_build_object(
      'frequency', COUNT(*),
      'confused_with', dv.llm_tag,
      'thomas_comments', jsonb_agg(dv.validation_comment),
      'examples', jsonb_agg(dv.verbatim),
      'avg_confidence', AVG(dv.llm_confidence),
      'pairs', jsonb_agg(dv.pair_id)
    )
  FROM disagreement_validations dv
  WHERE dv.test_id = p_test_id
    AND dv.validation_decision = 'CAS_B_LLM_INCORRECT'
  GROUP BY dv.manual_tag, dv.llm_tag
  HAVING COUNT(*) >= 2;

  -- Pattern 3 : Ajouter Exemples (CAS C ou confiance faible)
  RETURN QUERY
  SELECT 
    'add_example'::TEXT,
    dv.manual_tag,
    3 as priority,  -- NICE-TO-HAVE
    'Ajouter exemple: "' || dv.verbatim || '" pour ' || dv.manual_tag,
    jsonb_build_object(
      'verbatim', dv.verbatim,
      'llm_confidence', dv.llm_confidence,
      'llm_reasoning', dv.llm_reasoning,
      'thomas_comment', dv.validation_comment
    )
  FROM disagreement_validations dv
  WHERE dv.test_id = p_test_id
    AND (
      dv.validation_decision = 'CAS_C_AMBIGUOUS'
      OR dv.llm_confidence < 0.7
    )
  ORDER BY dv.llm_confidence ASC
  LIMIT 5;

END;
$$ LANGUAGE plpgsql;
```

### 3. `apply_charte_improvement(suggestion_id UUID)`

```sql
CREATE OR REPLACE FUNCTION apply_charte_improvement(p_suggestion_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  new_version TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_suggestion RECORD;
  v_charte RECORD;
  v_new_version TEXT;
  v_updated_definition JSONB;
BEGIN
  -- Récupérer la suggestion
  SELECT * INTO v_suggestion
  FROM charte_improvement_suggestions
  WHERE suggestion_id = p_suggestion_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Suggestion not found';
    RETURN;
  END IF;

  -- Récupérer la charte
  SELECT * INTO v_charte
  FROM level0_chartes
  WHERE charte_id = v_suggestion.charte_id;

  -- Calculer nouvelle version (incrémente minor)
  v_new_version := increment_version(v_charte.version, 'minor');

  -- Appliquer la modification selon le type
  IF v_suggestion.suggestion_type = 'add_alias' THEN
    v_updated_definition := jsonb_set(
      v_charte.definition,
      ARRAY['aliases', v_suggestion.category],
      to_jsonb(v_suggestion.supporting_data->>'target_tag')
    );
  ELSIF v_suggestion.suggestion_type = 'add_example' THEN
    v_updated_definition := jsonb_set(
      v_charte.definition,
      ARRAY['categories', v_suggestion.category, 'examples'],
      (v_charte.definition->'categories'->v_suggestion.category->'examples') || 
      to_jsonb(v_suggestion.supporting_data->>'verbatim')
    );
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT, 'Suggestion type not supported yet';
    RETURN;
  END IF;

  -- Mettre à jour la charte
  UPDATE level0_chartes
  SET 
    version = v_new_version,
    definition = v_updated_definition,
    updated_at = NOW()
  WHERE charte_id = v_charte.charte_id;

  -- Enregistrer la modification
  INSERT INTO charte_modifications (
    charte_id, version_from, version_to,
    modification_type, field_modified,
    old_value, new_value,
    reason, source_test_id, source_suggestion_id
  ) VALUES (
    v_charte.charte_id,
    v_charte.version,
    v_new_version,
    v_suggestion.suggestion_type,
    CASE 
      WHEN v_suggestion.suggestion_type = 'add_alias' 
      THEN 'definition.aliases.' || v_suggestion.category
      ELSE 'definition.categories.' || v_suggestion.category || '.examples'
    END,
    NULL,
    v_updated_definition,
    v_suggestion.description,
    v_suggestion.test_id,
    p_suggestion_id
  );

  -- Marquer suggestion comme appliquée
  UPDATE charte_improvement_suggestions
  SET 
    status = 'applied_pending_validation',  -- ⭐ EN ATTENTE DE VALIDATION
    applied_at = NOW(),
    applied_in_version = v_new_version
  WHERE suggestion_id = p_suggestion_id;

  -- ⭐ Marquer la charte comme en attente de validation
  UPDATE level0_chartes
  SET 
    is_pending_validation = true,
    parent_version = v_charte.version,
    validation_deadline = NOW() + INTERVAL '7 days'
  WHERE charte_id = v_charte.charte_id AND version = v_new_version;

  RETURN QUERY SELECT true, v_new_version, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Fonction helper pour incrémenter version sémantique
CREATE OR REPLACE FUNCTION increment_version(current_version TEXT, level TEXT)
RETURNS TEXT AS $$
DECLARE
  parts TEXT[];
  major INT;
  minor INT;
  patch INT;
BEGIN
  parts := string_to_array(current_version, '.');
  major := parts[1]::INT;
  minor := parts[2]::INT;
  patch := parts[3]::INT;

  IF level = 'major' THEN
    RETURN (major + 1) || '.0.0';
  ELSIF level = 'minor' THEN
    RETURN major || '.' || (minor + 1) || '.0';
  ELSE
    RETURN major || '.' || minor || '.' || (patch + 1);
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 4. `rollback_charte_version(version_to_rollback TEXT)`

**⭐ NOUVELLE FONCTION pour annuler une version suite à régression**

```sql
CREATE OR REPLACE FUNCTION rollback_charte_version(
  p_charte_id TEXT,
  p_version_to_rollback TEXT,
  p_reason TEXT DEFAULT 'Régression détectée'
) RETURNS TABLE (
  success BOOLEAN,
  restored_version TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_parent_version TEXT;
  v_parent_definition JSONB;
BEGIN
  -- Récupérer la version parente et sa définition
  SELECT parent_version INTO v_parent_version
  FROM level0_chartes
  WHERE charte_id = p_charte_id AND version = p_version_to_rollback;

  IF v_parent_version IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Version parente introuvable. Impossible de rollback.';
    RETURN;
  END IF;

  -- Récupérer la définition de la version parente depuis l'historique
  SELECT old_value INTO v_parent_definition
  FROM charte_modifications
  WHERE charte_id = p_charte_id 
    AND version_from = v_parent_version
    AND version_to = p_version_to_rollback
  ORDER BY modified_at DESC
  LIMIT 1;

  -- Restaurer la version parente
  UPDATE level0_chartes
  SET 
    version = v_parent_version,
    definition = COALESCE(v_parent_definition, definition),  -- Fallback si pas trouvé
    is_pending_validation = false,
    parent_version = NULL,
    validation_deadline = NULL,
    updated_at = NOW()
  WHERE charte_id = p_charte_id AND version = p_version_to_rollback;

  -- Marquer la suggestion comme rolled back
  UPDATE charte_improvement_suggestions
  SET 
    status = 'applied_rolled_back',
    rollback_reason = p_reason
  WHERE applied_in_version = p_version_to_rollback
    AND charte_id = p_charte_id;

  -- Enregistrer le rollback dans l'historique
  INSERT INTO charte_modifications (
    charte_id, 
    version_from, 
    version_to,
    modification_type,
    field_modified,
    reason,
    modified_by
  ) VALUES (
    p_charte_id,
    p_version_to_rollback,
    v_parent_version,
    'rollback',
    'all',
    p_reason,
    'System (auto-rollback)'
  );

  RETURN QUERY SELECT true, v_parent_version, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;
```

### 5. `validate_charte_version(version TEXT, validation_test_id UUID)`

**⭐ NOUVELLE FONCTION pour valider définitivement une version après re-test**

```sql
CREATE OR REPLACE FUNCTION validate_charte_version(
  p_charte_id TEXT,
  p_version TEXT,
  p_validation_test_id UUID
) RETURNS TABLE (
  success BOOLEAN,
  kappa_improvement FLOAT,
  error_message TEXT
) AS $$
DECLARE
  v_kappa_before FLOAT;
  v_kappa_after FLOAT;
  v_source_test_id UUID;
BEGIN
  -- Récupérer le test source (version parente)
  SELECT test_id INTO v_source_test_id
  FROM charte_improvement_suggestions
  WHERE applied_in_version = p_version
    AND charte_id = p_charte_id
  LIMIT 1;

  -- Récupérer Kappa avant (test source)
  SELECT kappa INTO v_kappa_before
  FROM level0_charte_tests
  WHERE test_id = v_source_test_id;

  -- Récupérer Kappa après (test de validation)
  SELECT kappa INTO v_kappa_after
  FROM level0_charte_tests
  WHERE test_id = p_validation_test_id;

  -- Marquer la charte comme validée
  UPDATE level0_chartes
  SET 
    is_pending_validation = false,
    validation_deadline = NULL,
    updated_at = NOW()
  WHERE charte_id = p_charte_id AND version = p_version;

  -- Marquer la suggestion comme validée
  UPDATE charte_improvement_suggestions
  SET 
    status = 'applied_validated',
    validation_test_id = p_validation_test_id,
    kappa_before = v_kappa_before,
    kappa_after = v_kappa_after
  WHERE applied_in_version = p_version
    AND charte_id = p_charte_id;

  -- Enregistrer la validation dans l'historique
  INSERT INTO charte_modifications (
    charte_id,
    version_from,
    version_to,
    modification_type,
    reason,
    source_test_id
  ) VALUES (
    p_charte_id,
    p_version,
    p_version,
    'validation',
    'Amélioration confirmée : Kappa ' || v_kappa_before || ' → ' || v_kappa_after,
    p_validation_test_id
  );

  RETURN QUERY SELECT true, (v_kappa_after - v_kappa_before), NULL::TEXT;
END;
$$ LANGUAGE plpgsql;
```

---

## 🏗️ ARCHITECTURE SERVICES (DDD)

### Nouveau Service : `CharteTuningService.ts`

```typescript
// src/features/phase3-analysis/level0-gold/domain/services/CharteTuningService.ts

import { createClient } from "@/lib/supabase/client";

export interface ImprovementSuggestion {
  suggestion_id: string;
  charte_id: string;
  test_id: string;
  suggestion_type: 'add_alias' | 'clarify_description' | 'add_example';
  category: string;
  priority: 1 | 2 | 3;
  description: string;
  supporting_data: {
    frequency?: number;
    thomas_comments?: string[];
    examples?: string[];
    avg_confidence?: number;
    pairs?: number[];
    confused_with?: string;
    target_tag?: string;
  };
  status: 'pending' | 'applied' | 'rejected';
  applied_at?: string;
  applied_in_version?: string;
  created_at: string;
}

export interface CategoryStats {
  category: string;
  total_instances: number;
  correct_predictions: number;
  cas_a_count: number;
  cas_b_count: number;
  cas_c_count: number;
  avg_confidence: number;
  most_common_errors: Array<{
    verbatim: string;
    frequency: number;
    confused_with: string;
  }>;
}

export interface CharteModification {
  modification_id: string;
  version_from: string;
  version_to: string;
  modification_type: string;
  field_modified: string;
  reason: string;
  modified_at: string;
}

export class CharteTuningService {
  private static supabase = createClient();

  /**
   * Générer les suggestions d'amélioration pour un test
   */
  static async generateSuggestions(testId: string): Promise<{
    data: ImprovementSuggestion[] | null;
    error: string | null;
  }> {
    try {
      // 1. Appeler fonction SQL de génération
      const { data: suggestions, error: genError } = await this.supabase
        .rpc('generate_charte_improvements', { p_test_id: testId });

      if (genError) throw genError;

      // 2. Insérer dans la table
      const { data: inserted, error: insertError } = await this.supabase
        .from('charte_improvement_suggestions')
        .insert(
          suggestions.map((s: any) => ({
            charte_id: s.charte_id,
            test_id: testId,
            suggestion_type: s.suggestion_type,
            category: s.category,
            priority: s.priority,
            description: s.description,
            supporting_data: s.supporting_data,
          }))
        )
        .select();

      if (insertError) throw insertError;

      return { data: inserted, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Récupérer les suggestions pour une charte
   */
  static async getSuggestions(
    charteId: string,
    status?: 'pending' | 'applied_pending_validation' | 'applied_validated' | 'applied_rolled_back' | 'rejected'
  ): Promise<{
    data: ImprovementSuggestion[] | null;
    error: string | null;
  }> {
    try {
      let query = this.supabase
        .from('charte_improvement_suggestions')
        .select('*')
        .eq('charte_id', charteId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Appliquer une suggestion (crée version en attente de validation)
   */
  static async applySuggestion(suggestionId: string): Promise<{
    success: boolean;
    new_version?: string;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('apply_charte_improvement', { p_suggestion_id: suggestionId });

      if (error) throw error;

      return {
        success: data[0].success,
        new_version: data[0].new_version,
        error: data[0].error_message,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * ⭐ NOUVEAU : Valider définitivement une version après re-test positif
   */
  static async validateCharteVersion(
    charteId: string,
    version: string,
    validationTestId: string
  ): Promise<{
    success: boolean;
    kappa_improvement?: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('validate_charte_version', {
          p_charte_id: charteId,
          p_version: version,
          p_validation_test_id: validationTestId,
        });

      if (error) throw error;

      return {
        success: data[0].success,
        kappa_improvement: data[0].kappa_improvement,
        error: data[0].error_message,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * ⭐ NOUVEAU : Effectuer un rollback (annuler une version suite à régression)
   */
  static async rollbackCharteVersion(
    charteId: string,
    versionToRollback: string,
    reason: string
  ): Promise<{
    success: boolean;
    restored_version?: string;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('rollback_charte_version', {
          p_charte_id: charteId,
          p_version_to_rollback: versionToRollback,
          p_reason: reason,
        });

      if (error) throw error;

      return {
        success: data[0].success,
        restored_version: data[0].restored_version,
        error: data[0].error_message,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rejeter une suggestion
   */
  static async rejectSuggestion(
    suggestionId: string,
    reason: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('charte_improvement_suggestions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('suggestion_id', suggestionId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Récupérer les statistiques par catégorie pour un test
   */
  static async getCategoryStats(testId: string): Promise<{
    data: CategoryStats[] | null;
    error: string | null;
  }> {
    try {
      // D'abord calculer les stats
      const { error: calcError } = await this.supabase
        .rpc('calculate_category_stats', { p_test_id: testId });

      if (calcError) throw calcError;

      // Ensuite récupérer les résultats
      const { data, error } = await this.supabase
        .from('charte_category_stats')
        .select('*')
        .eq('test_id', testId)
        .order('category');

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  /**
   * Récupérer l'historique des modifications d'une charte
   */
  static async getModificationHistory(charteId: string): Promise<{
    data: CharteModification[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('charte_modifications')
        .select('*')
        .eq('charte_id', charteId)
        .order('modified_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  /**
   * ⭐ NOUVEAU : Comparer résultats de deux tests (pour validation)
   */
  static async compareTestResults(
    sourceTestId: string,
    validationTestId: string
  ): Promise<{
    data: {
      source: any;
      validation: any;
      kappa_improvement: number;
      disagreements_reduction: number;
      is_improvement: boolean;
    } | null;
    error: string | null;
  }> {
    try {
      // Récupérer les deux tests
      const { data: tests, error } = await this.supabase
        .from('level0_charte_tests')
        .select('*')
        .in('test_id', [sourceTestId, validationTestId]);

      if (error) throw error;

      const source = tests.find(t => t.test_id === sourceTestId);
      const validation = tests.find(t => t.test_id === validationTestId);

      if (!source || !validation) {
        return { data: null, error: 'Tests non trouvés' };
      }

      const kappa_improvement = validation.kappa - source.kappa;
      const disagreements_reduction = source.disagreements_count - validation.disagreements_count;
      const is_improvement = kappa_improvement > 0 && disagreements_reduction >= 0;

      return {
        data: {
          source,
          validation,
          kappa_improvement,
          disagreements_reduction,
          is_improvement,
        },
        error: null,
      };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  /**
   * ⭐ NOUVEAU : Calculer le DIFF entre deux versions de charte
   */
  static calculateDiff(
    currentCharte: CharteDefinition,
    suggestion: ImprovementSuggestion
  ): {
    field: string;
    before: any;
    after: any;
  } {
    const { suggestion_type, category, supporting_data } = suggestion;

    if (suggestion_type === 'add_alias') {
      return {
        field: `definition.aliases.${category}`,
        before: null,
        after: supporting_data.target_tag,
      };
    } else if (suggestion_type === 'add_example') {
      const currentExamples = (currentCharte.definition as any).categories[category]?.examples || [];
      return {
        field: `definition.categories.${category}.examples`,
        before: currentExamples,
        after: [...currentExamples, supporting_data.verbatim],
      };
    } else if (suggestion_type === 'clarify_description') {
      const currentDesc = (currentCharte.definition as any).categories[category]?.description || '';
      return {
        field: `definition.categories.${category}.description`,
        before: currentDesc,
        after: currentDesc + ' (À clarifier manuellement)',
      };
    }

    return { field: 'unknown', before: null, after: null };
  }
}
```

---

## 🎨 COMPOSANTS UI

### Vue d'ensemble des Composants

```
Hiérarchie des Composants :
├── CharteManager.tsx (existant - gestion liste chartes + aliases)
├── CharteEditorPanel.tsx ⭐ NOUVEAU (édition complète tous paramètres)
├── CharteTuningPanel.tsx ⭐ NOUVEAU (suggestions + stats + historique)
├── SuggestionCard.tsx ⭐ NOUVEAU
├── SuggestionPreviewDialog.tsx ⭐ NOUVEAU
├── CharteValidationPanel.tsx ⭐ NOUVEAU
└── CategoryStatsCard.tsx ⭐ NOUVEAU
```

---

### 1. `CharteEditorPanel.tsx` ⭐ NOUVEAU - Interface Complète

**Emplacement** : `src/features/phase3-analysis/level0-gold/presentation/components/CharteEditorPanel.tsx`

**Objectif** : Permettre l'édition complète de TOUS les paramètres éditables d'une charte

#### Interface Structure

```tsx
interface CharteEditorPanelProps {
  charteId: string;
  prefilledSuggestion?: ImprovementSuggestion;  // Pré-remplir avec suggestion
  onSave: (newVersion: string) => void;
  onCancel: () => void;
}

export function CharteEditorPanel({ 
  charteId, 
  prefilledSuggestion 
}: CharteEditorPanelProps) {
  // États pour chaque section éditable
  const [charte, setCharte] = useState<CharteDefinition | null>(null);
  const [activeTab, setActiveTab] = useState<'metadata' | 'categories' | 'aliases' | 'rules' | 'llm' | 'prompt'>('metadata');
  
  // Logique de sauvegarde avec versioning
  const handleSave = async () => {
    // Incrémente version (1.0.0 → 1.1.0)
    // Crée nouvelle version avec is_pending_validation=true
    // Enregistre dans charte_modifications
  };
}
```

#### Layout avec Onglets Internes

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 ÉDITION CHARTE : CharteY_B v1.0.0 → v1.1.0                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Métadonnées] [Catégories] [Aliases] [Règles] [Paramètres LLM] [Template] │
│  ────────────────────────────────────────────────────────────── │
│                                                                 │
│  ┌─────────────── ONGLET : CATÉGORIES ─────────────────────┐  │
│  │                                                           │  │
│  │  Accordion : [CLIENT_POSITIF ▼]                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ 📝 Description                                      │  │  │
│  │  │ ┌────────────────────────────────────────────────┐ │  │  │
│  │  │ │ Le client exprime un accord ou satisfaction    │ │  │  │
│  │  │ │ [Éditer]                                        │ │  │  │
│  │  │ └────────────────────────────────────────────────┘ │  │  │
│  │  │                                                      │  │  │
│  │  │ ✅ Exemples Positifs (3)                           │  │  │
│  │  │ • oui                    [✏️] [❌]                │  │  │
│  │  │ • d'accord               [✏️] [❌]                │  │  │
│  │  │ • merci                  [✏️] [❌]                │  │  │
│  │  │ [+ Ajouter exemple]                                │  │  │
│  │  │                                                      │  │  │
│  │  │ ❌ Contre-exemples (optionnel)                     │  │  │
│  │  │ • oui mais               [❌ Supprimer]            │  │  │
│  │  │ • d'accord mais          [❌ Supprimer]            │  │  │
│  │  │ [+ Ajouter contre-exemple]                         │  │  │
│  │  │                                                      │  │  │
│  │  │ 🔍 Keywords (pour recherche)                        │  │  │
│  │  │ [oui, d'accord, bien, ok, entendu, absolument]    │  │  │
│  │  │ [Éditer keywords]                                  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Accordion : [CLIENT_NEUTRE ▶]                           │  │
│  │  Accordion : [CLIENT_NEGATIF ▶]                          │  │
│  │                                                           │  │
│  │  [+ Ajouter nouvelle catégorie]                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────── ONGLET : ALIASES ──────────────────────┐    │
│  │ (Même interface que CharteManager actuel)             │    │
│  │                                                         │    │
│  │ CLIENT_NON_POSITIF → CLIENT_NEGATIF     [❌]          │    │
│  │ CLIENT_NON_NEGATIF → CLIENT_POSITIF     [❌]          │    │
│  │                                                         │    │
│  │ [+ Ajouter alias]                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────── ONGLET : RÈGLES ───────────────────────┐    │
│  │                                                         │    │
│  │ Approche d'annotation :                                │    │
│  │ ○ Zero-shot (aucun exemple)                           │    │
│  │ ● Few-shot (avec exemples)                            │    │
│  │ ○ Chain-of-thought (raisonnement explicite)           │    │
│  │                                                         │    │
│  │ Inclure contexte conversationnel :                     │    │
│  │ [✓] Inclure tours précédents (prev1, prev2, prev3)    │    │
│  │ [✓] Inclure tours suivants (next1, next2, next3)      │    │
│  │                                                         │    │
│  │ Exemples par catégorie :                               │    │
│  │ [3  ▼] exemples (1-5)                                 │    │
│  │                                                         │    │
│  │ Demander raisonnement explicite :                      │    │
│  │ [✓] Forcer le LLM à justifier sa décision             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────── ONGLET : PARAMÈTRES LLM ───────────────┐    │
│  │                                                         │    │
│  │ Modèle OpenAI :                                        │    │
│  │ [gpt-4o-mini  ▼] (gpt-4o, gpt-4o-mini)               │    │
│  │                                                         │    │
│  │ Temperature : [0.0  ────●────────] (0.0-1.0)          │    │
│  │ (0 = déterministe, 1 = créatif)                       │    │
│  │                                                         │    │
│  │ Max tokens : [150  ────●────────] (50-500)            │    │
│  │                                                         │    │
│  │ Top P : [1.0  ──────────────●] (0.0-1.0)             │    │
│  │                                                         │    │
│  │ Frequency penalty : [0.0  ●──────────] (0.0-2.0)      │    │
│  │ Presence penalty : [0.0  ●──────────] (0.0-2.0)       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────── ONGLET : TEMPLATE PROMPT ──────────────┐    │
│  │                                                         │    │
│  │ [Éditeur de texte multiligne]                          │    │
│  │                                                         │    │
│  │ Tu es un annotateur expert...                          │    │
│  │ Catégories disponibles : {CATEGORIES}                 │    │
│  │ Exemples : {EXAMPLES}                                  │    │
│  │ ...                                                     │    │
│  │                                                         │    │
│  │ Variables disponibles :                                │    │
│  │ • {CATEGORIES} - Liste des catégories                 │    │
│  │ • {EXAMPLES} - Exemples par catégorie                 │    │
│  │ • {CONTEXT_BEFORE} - Tours précédents                 │    │
│  │ • {CONTEXT_AFTER} - Tours suivants                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────── ACTIONS ─────────────────────────────────┐    │
│  │ [💾 Sauvegarder comme v1.1.0]                         │    │
│  │ [👁️ Prévisualiser changements]                        │    │
│  │ [❌ Annuler]                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

#### Données Éditables Complètes

```typescript
interface EditableCharteData {
  // MÉTADONNÉES
  charte_name: string;
  philosophy: 'Minimaliste' | 'Enrichie' | 'Binaire';
  
  // CATÉGORIES
  categories: {
    [categoryName: string]: {
      description: string;
      examples: string[];
      counter_examples?: string[];
      keywords?: string[];
    }
  };
  
  // ALIASES
  aliases: {
    [invalidTag: string]: string;  // Ex: "CLIENT_NON_POSITIF" -> "CLIENT_NEGATIF"
  };
  
  // RÈGLES
  rules: {
    approach: 'zero_shot' | 'few_shot' | 'chain_of_thought';
    context_included: boolean;
    examples_per_category: number;  // 1-5
    reasoning_required: boolean;
  };
  
  // PARAMÈTRES LLM
  prompt_params: {
    model: 'gpt-4o' | 'gpt-4o-mini';
    temperature: number;  // 0.0-1.0
    max_tokens: number;   // 50-500
    top_p: number;        // 0.0-1.0
    frequency_penalty: number;  // 0.0-2.0
    presence_penalty: number;   // 0.0-2.0
  };
  
  // TEMPLATE
  prompt_template: string;
}
```

---

### 2. `CharteManager.tsx` (déjà créé)
- Gestion des aliases
- Édition des catégories
- Vue d'ensemble des chartes

### 3. `CharteTuningPanel.tsx` ⭐ NOUVEAU

**Emplacement** : `src/features/phase3-analysis/level0-gold/presentation/components/CharteTuningPanel.tsx`

**Objectif** : Vue 3 colonnes : Suggestions + Statistiques + Historique

```tsx
interface CharteTuningPanelProps {
  charteId: string;
  testId: string;
  onVersionCreated: (newVersion: string) => void;
}

export function CharteTuningPanel({ charteId, testId }: CharteTuningPanelProps) {
  // 3 sections en colonnes :
  // 1. Liste suggestions (triées par priorité)
  // 2. Statistiques par catégorie
  // 3. Historique modifications
}
```

**Layout** :
```
┌────────────┬────────────┬────────────┐
│ 💡         │ 📊         │ 📜         │
│ SUGGESTIONS│ STATISTIQUES│ HISTORIQUE│
│ (40%)      │ (30%)      │ (30%)      │
└────────────┴────────────┴────────────┘
```

---

### 4. `SuggestionCard.tsx` ⭐ NOUVEAU

```tsx
interface SuggestionCardProps {
  suggestion: ImprovementSuggestion;
  onPreview: () => void;
  onApply: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  // Affiche :
  // - Badge priorité (🔴 Critique / ⚠️ Important / ℹ️ Nice-to-have)
  // - Description courte
  // - Détails expandables (commentaires Thomas, exemples, fréquence)
  // - Boutons : [Prévisualiser] [Appliquer] [Modifier] [Rejeter]
}
```

---

### 5. `SuggestionPreviewDialog.tsx` ⭐ NOUVEAU

**Objectif** : Afficher un DIFF entre version actuelle et version proposée

```tsx
interface SuggestionPreviewDialogProps {
  suggestion: ImprovementSuggestion;
  currentCharte: CharteDefinition;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export function SuggestionPreviewDialog({ 
  suggestion, 
  currentCharte 
}: SuggestionPreviewDialogProps) {
  // Calcule le DIFF
  const diff = calculateDiff(currentCharte, suggestion);
  
  return (
    <Dialog maxWidth="md" fullWidth>
      <DialogTitle>
        Prévisualisation : v{currentCharte.version} → v{nextVersion}
      </DialogTitle>
      <DialogContent>
        {/* Affichage DIFF avec couleurs */}
        <Box>
          <Typography variant="subtitle2">AVANT (v{currentCharte.version})</Typography>
          <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
            <pre>{JSON.stringify(getCurrentValue(), null, 2)}</pre>
          </Paper>
        </Box>
        
        <Divider sx={{ my: 2 }}>
          <Chip label="→" />
        </Divider>
        
        <Box>
          <Typography variant="subtitle2">APRÈS (v{nextVersion})</Typography>
          <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
            <pre>{JSON.stringify(getProposedValue(), null, 2)}</pre>
          </Paper>
        </Box>
        
        {/* Impact estimé */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Impact estimé :</strong>
          <ul>
            <li>Réduction désaccords : ~30%</li>
            <li>Amélioration Kappa estimée : +0.15</li>
          </ul>
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onCancel}>Retour</Button>
        <Button onClick={onEdit} startIcon={<EditIcon />}>
          Modifier avant d'appliquer
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained"
          startIcon={<CheckIcon />}
        >
          Confirmer et créer v{nextVersion}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 6. `CharteValidationPanel.tsx` ⭐ NOUVEAU

**Objectif** : Afficher résultats comparatifs après re-test et permettre validation/rollback

```tsx
interface CharteValidationPanelProps {
  charteId: string;
  currentVersion: string;
  parentVersion: string;
  sourceTestId: string;      // Test sur version parente
  validationTestId: string;  // Test sur version actuelle
  onValidate: () => void;
  onRollback: (reason: string) => void;
}

export function CharteValidationPanel({ 
  sourceTestId, 
  validationTestId 
}: CharteValidationPanelProps) {
  const [sourceTest, setSourceTest] = useState<CharteTestResult | null>(null);
  const [validationTest, setValidationTest] = useState<CharteTestResult | null>(null);
  
  // Calculs automatiques
  const kappaImprovement = validationTest.kappa - sourceTest.kappa;
  const disagreementsReduction = sourceTest.disagreements_count - validationTest.disagreements_count;
  const isImprovement = kappaImprovement > 0 && disagreementsReduction >= 0;
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">
          Résultats Comparatifs : v{parentVersion} vs v{currentVersion}
        </Typography>
        
        {/* Tableau comparatif */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Métrique</TableCell>
              <TableCell align="center">v{parentVersion}</TableCell>
              <TableCell align="center">v{currentVersion}</TableCell>
              <TableCell align="center">Évolution</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Kappa (κ)</TableCell>
              <TableCell align="center">{sourceTest.kappa.toFixed(3)}</TableCell>
              <TableCell align="center">{validationTest.kappa.toFixed(3)}</TableCell>
              <TableCell align="center">
                <Chip 
                  label={kappaImprovement > 0 ? `+${kappaImprovement.toFixed(3)}` : kappaImprovement.toFixed(3)}
                  color={kappaImprovement > 0 ? 'success' : 'error'}
                />
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell>Désaccords</TableCell>
              <TableCell align="center">{sourceTest.disagreements_count}</TableCell>
              <TableCell align="center">{validationTest.disagreements_count}</TableCell>
              <TableCell align="center">
                <Chip 
                  label={disagreementsReduction > 0 ? `-${disagreementsReduction}` : `+${Math.abs(disagreementsReduction)}`}
                  color={disagreementsReduction > 0 ? 'success' : 'error'}
                />
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell>Accuracy</TableCell>
              <TableCell align="center">{(sourceTest.accuracy * 100).toFixed(1)}%</TableCell>
              <TableCell align="center">{(validationTest.accuracy * 100).toFixed(1)}%</TableCell>
              <TableCell align="center">
                <Chip 
                  label={`${((validationTest.accuracy - sourceTest.accuracy) * 100).toFixed(1)}%`}
                  color={(validationTest.accuracy > sourceTest.accuracy) ? 'success' : 'error'}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        {/* Verdict */}
        {isImprovement ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>✅ Amélioration Confirmée</strong>
            <br />
            La version {currentVersion} performe mieux que la version {parentVersion}.
            Vous pouvez la valider définitivement.
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>⚠️ Régression Détectée</strong>
            <br />
            La version {currentVersion} performe moins bien que la version {parentVersion}.
            Il est recommandé d'effectuer un rollback.
          </Alert>
        )}
        
        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          {isImprovement ? (
            <>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={onValidate}
              >
                ✅ Valider Définitivement
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<UndoIcon />}
                onClick={() => {
                  const reason = prompt("Raison du rollback (optionnel) :");
                  if (reason !== null) onRollback(reason || "Décision manuelle");
                }}
              >
                Rollback quand même
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<UndoIcon />}
                onClick={() => {
                  onRollback(`Régression : Kappa ${sourceTest.kappa.toFixed(3)} → ${validationTest.kappa.toFixed(3)}`);
                }}
              >
                ⚠️ Effectuer Rollback
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={onValidate}
              >
                Valider malgré la régression
              </Button>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
```

---

### 7. `CategoryStatsCard.tsx` ⭐ NOUVEAU

```tsx
interface CategoryStatsCardProps {
  stats: CategoryStats;
}

export function CategoryStatsCard({ stats }: CategoryStatsCardProps) {
  // Affiche :
  // - Nom catégorie
  // - Taux d'accord (%)
  // - Répartition CAS A/B/C
  // - Confiance moyenne
  // - Top erreurs avec verbatims
}
```

---

## 🔗 INTÉGRATION DANS L'INTERFACE EXISTANTE

### Modification de `DisagreementValidationPanel.tsx`

**Ajouter un bouton après validation des désaccords** :

```tsx
// Après validation du dernier désaccord
{allDisagreementsValidated && (
  <Alert severity="success" sx={{ mt: 2 }}>
    <Typography>
      Tous les désaccords ont été validés !
    </Typography>
    <Button
      variant="contained"
      color="primary"
      startIcon={<TuneIcon />}
      onClick={() => setShowTuningPanel(true)}
      sx={{ mt: 1 }}
    >
      Améliorer cette charte
    </Button>
  </Alert>
)}

{/* Dialog de tuning */}
<Dialog open={showTuningPanel} maxWidth="xl" fullWidth>
  <DialogTitle>Amélioration de la Charte</DialogTitle>
  <DialogContent>
    <CharteTuningPanel
      charteId={test.charte_id}
      testId={test.test_id}
      onVersionCreated={(v) => {
        alert(`Nouvelle version ${v} créée !`);
        setShowTuningPanel(false);
      }}
    />
  </DialogContent>
</Dialog>
```

### Ajout Onglet dans `Level0Interface.tsx`

```tsx
<Tab label="🔧 Tuning Chartes" value="tuning" />

{/* Onglet Tuning */}
{currentTab === 'tuning' && (
  <CharteTuningPanel
    charteId={selectedCharteId}
    testId={selectedTestId}
    onVersionCreated={handleVersionCreated}
  />
)}
```

---

## 📋 PLAN D'IMPLÉMENTATION

### Sprint 5 - Partie 1 : Infrastructure SQL (2h30)

**Objectif** : Créer toutes les tables, fonctions et indexes nécessaires

#### 1.1 Créer les Tables (45 min)

```sql
-- À exécuter dans Supabase SQL Editor

-- Table 1 : charte_modifications
CREATE TABLE charte_modifications (
  modification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  version_from TEXT NOT NULL,
  version_to TEXT NOT NULL,
  modification_type TEXT NOT NULL CHECK (
    modification_type IN (
      'alias_added', 'alias_removed',
      'example_added', 'example_removed',
      'description_changed', 'rule_changed',
      'category_added', 'category_removed',
      'rollback', 'validation'
    )
  ),
  field_modified TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  source_test_id UUID REFERENCES level0_charte_tests(test_id),
  source_suggestion_id UUID,
  modified_by TEXT DEFAULT 'Thomas',
  modified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cm_charte ON charte_modifications(charte_id);
CREATE INDEX idx_cm_version ON charte_modifications(version_to);
CREATE INDEX idx_cm_type ON charte_modifications(modification_type);

-- Table 2 : charte_improvement_suggestions
CREATE TABLE charte_improvement_suggestions (
  suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  test_id UUID NOT NULL REFERENCES level0_charte_tests(test_id),
  suggestion_type TEXT NOT NULL CHECK (
    suggestion_type IN (
      'add_alias', 'remove_alias',
      'add_example', 'add_counter_example',
      'clarify_description', 'merge_categories',
      'adjust_rule'
    )
  ),
  category TEXT,
  priority INTEGER NOT NULL CHECK (priority IN (1, 2, 3)),
  description TEXT NOT NULL,
  supporting_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'applied_pending_validation',
      'applied_validated',
      'applied_rolled_back',
      'rejected'
    )
  ),
  applied_at TIMESTAMPTZ,
  applied_in_version TEXT,
  validation_test_id UUID REFERENCES level0_charte_tests(test_id),
  kappa_before FLOAT,
  kappa_after FLOAT,
  rollback_reason TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cis_charte_status ON charte_improvement_suggestions(charte_id, status);
CREATE INDEX idx_cis_priority ON charte_improvement_suggestions(priority, status);
CREATE INDEX idx_cis_test ON charte_improvement_suggestions(test_id);
CREATE INDEX idx_cis_validation ON charte_improvement_suggestions(validation_test_id);

-- Table 3 : charte_category_stats
CREATE TABLE charte_category_stats (
  stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  test_id UUID NOT NULL REFERENCES level0_charte_tests(test_id),
  category TEXT NOT NULL,
  total_instances INTEGER NOT NULL,
  correct_predictions INTEGER NOT NULL,
  cas_a_count INTEGER DEFAULT 0,
  cas_b_count INTEGER DEFAULT 0,
  cas_c_count INTEGER DEFAULT 0,
  avg_confidence FLOAT,
  min_confidence FLOAT,
  max_confidence FLOAT,
  most_common_errors JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, category)
);

CREATE INDEX idx_ccs_test ON charte_category_stats(test_id);
CREATE INDEX idx_ccs_charte ON charte_category_stats(charte_id);
```

#### 1.2 Modifier Table Existante (15 min)

```sql
-- Ajouter colonnes à level0_chartes
ALTER TABLE level0_chartes
ADD COLUMN is_pending_validation BOOLEAN DEFAULT false,
ADD COLUMN parent_version TEXT,
ADD COLUMN validation_deadline TIMESTAMPTZ;
```

#### 1.3 Créer Fonctions SQL (60 min)

```sql
-- Fonction 1 : calculate_category_stats()
-- Fonction 2 : generate_charte_improvements()
-- Fonction 3 : apply_charte_improvement()
-- Fonction 4 : increment_version()
-- Fonction 5 : rollback_charte_version() ⭐ NOUVEAU
-- Fonction 6 : validate_charte_version() ⭐ NOUVEAU

-- (Voir section "Fonctions SQL" du document pour le code complet)
```

#### 1.4 Tester le Pipeline SQL (30 min)

```sql
-- Test 1 : Créer un test
-- Test 2 : Valider désaccords
-- Test 3 : Générer suggestions
-- Test 4 : Appliquer suggestion
-- Test 5 : Re-tester
-- Test 6 : Valider ou Rollback
```

---

### Sprint 5 - Partie 2 : Services TypeScript (1h30)

#### 2.1 Créer CharteTuningService.ts (45 min)

**Fichier** : `src/features/phase3-analysis/level0-gold/domain/services/CharteTuningService.ts`

Méthodes à implémenter :
- ✅ `generateSuggestions()`
- ✅ `getSuggestions()`
- ✅ `applySuggestion()`
- ✅ `rejectSuggestion()`
- ✅ `getCategoryStats()`
- ✅ `getModificationHistory()`
- ⭐ `validateCharteVersion()` (NOUVEAU)
- ⭐ `rollbackCharteVersion()` (NOUVEAU)
- ⭐ `compareTestResults()` (NOUVEAU)
- ⭐ `calculateDiff()` (NOUVEAU)

#### 2.2 Mettre à Jour Types TypeScript (15 min)

**Fichier** : `src/types/algorithm-lab/Level0Types.ts`

Ajouter :
```typescript
export type SuggestionStatus = 
  | 'pending'
  | 'applied_pending_validation'
  | 'applied_validated'
  | 'applied_rolled_back'
  | 'rejected';

export interface ImprovementSuggestion {
  suggestion_id: string;
  charte_id: string;
  test_id: string;
  suggestion_type: string;
  category: string;
  priority: 1 | 2 | 3;
  description: string;
  supporting_data: any;
  status: SuggestionStatus;
  // ... autres champs
}

export interface CategoryStats { /* ... */ }
export interface CharteModification { /* ... */ }
```

#### 2.3 Tests Manuels Service (30 min)

- Tester chaque méthode du service
- Vérifier les retours {data, error}
- Valider le flow complet

---

### Sprint 5 - Partie 3 : Composants UI de Base (2h30)

#### 3.1 SuggestionCard.tsx (30 min)

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/SuggestionCard.tsx`

Fonctionnalités :
- Badge priorité avec couleurs
- Description claire
- Accordion pour détails (commentaires, exemples, stats)
- 4 boutons : Prévisualiser, Appliquer, Modifier, Rejeter

#### 3.2 CategoryStatsCard.tsx (30 min)

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/CategoryStatsCard.tsx`

Affichage :
- Nom catégorie
- Taux d'accord (gauge ou progress bar)
- Répartition CAS A/B/C (pie chart)
- Top 5 erreurs avec verbatims

#### 3.3 SuggestionPreviewDialog.tsx (45 min)

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/SuggestionPreviewDialog.tsx`

Fonctionnalités :
- DIFF visuel (avant/après)
- Coloration syntaxique JSON
- Impact estimé
- 3 boutons : Retour, Modifier, Confirmer

#### 3.4 CharteValidationPanel.tsx (45 min)

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/CharteValidationPanel.tsx`

Fonctionnalités :
- Tableau comparatif (Kappa, Désaccords, Accuracy)
- Verdict automatique (Amélioration/Régression)
- Alert dynamique
- Boutons conditionnels selon verdict

---

### Sprint 5 - Partie 4 : CharteTuningPanel Principal (2h)

#### 4.1 Structure 3 Colonnes (45 min)

**Fichier** : `src/features/phase3-analysis/level0-gold/presentation/components/CharteTuningPanel.tsx`

Layout :
```
┌──────────────┬──────────────┬──────────────┐
│ Suggestions  │ Statistiques │ Historique   │
│ (40%)        │ (30%)        │ (30%)        │
└──────────────┴──────────────┴──────────────┘
```

#### 4.2 Gestion États et Interactions (45 min)

- Charger suggestions au montage
- Gérer sélection suggestion
- Ouvrir dialogs appropriés
- Rafraîchir après actions

#### 4.3 Tests Utilisateur (30 min)

- Parcourir le workflow complet
- Vérifier fluidité
- Corriger bugs UI

---

### Sprint 5 - Partie 5 : CharteEditorPanel Complet (3h)

#### 5.1 Structure avec Onglets (45 min)

6 onglets internes :
1. Métadonnées
2. Catégories
3. Aliases
4. Règles
5. Paramètres LLM
6. Template Prompt

#### 5.2 Onglet Catégories (1h)

**Le plus complexe** :
- Accordion par catégorie
- Édition description
- Gestion liste exemples (add/remove/edit)
- Gestion contre-exemples
- Édition keywords

#### 5.3 Autres Onglets (45 min)

- Aliases : Réutiliser CharteManager actuel
- Règles : Radio buttons + sliders
- LLM : Sliders avec labels
- Template : Textarea avec syntax highlighting
- Métadonnées : Champs texte simples

#### 5.4 Logique de Sauvegarde (30 min)

- Calcul nouvelle version
- Validation données
- Appel service
- Gestion erreurs

---

### Sprint 5 - Partie 6 : Intégration Workflow (1h30)

#### 6.1 Modification DisagreementValidationPanel (30 min)

Ajouter après validation complète :
```tsx
<Button
  variant="contained"
  startIcon={<TuneIcon />}
  onClick={() => setShowTuningPanel(true)}
>
  Améliorer cette charte
</Button>

<Dialog open={showTuningPanel} maxWidth="xl" fullWidth>
  <CharteTuningPanel charteId={...} testId={...} />
</Dialog>
```

#### 6.2 Ajout Onglet dans Level0Interface (30 min)

```tsx
// Modifier type Tab
type Tab = 'tests' | 'goldstandards' | 'validation' | 'comparator' | 'audit' | 'tuning';

// Ajouter Tab
<Tab label="🔧 Tuning Chartes" value="tuning" />

// Ajouter Panel
{currentTab === 'tuning' && (
  <CharteTuningPanel ... />
)}
```

#### 6.3 Tests End-to-End (30 min)

**Scénario complet** :
1. Lancer test CharteY_B
2. Valider 5 désaccords
3. Cliquer "Améliorer charte"
4. Voir suggestions générées
5. Prévisualiser suggestion
6. Appliquer suggestion
7. Re-tester version 1.1.0
8. Voir panel validation
9. Valider définitivement

---

## 📊 RÉCAPITULATIF TEMPS ESTIMÉ

| Phase | Tâche | Temps |
|-------|-------|-------|
| **Partie 1** | Infrastructure SQL | **2h30** |
| **Partie 2** | Services TypeScript | **1h30** |
| **Partie 3** | Composants UI Base | **2h30** |
| **Partie 4** | CharteTuningPanel | **2h00** |
| **Partie 5** | CharteEditorPanel | **3h00** |
| **Partie 6** | Intégration | **1h30** |
| **TOTAL** | | **13h00** |

**Réparti sur 2-3 jours de travail efficace**

---

## ✅ CRITÈRES DE VALIDATION

### Phase SQL ✓
- [ ] Tables créées avec indexes
- [ ] Fonctions SQL testées manuellement
- [ ] Pipeline complet validé (test → suggestions → application → validation/rollback)

### Phase Services ✓
- [ ] Toutes méthodes implémentées
- [ ] Retours {data, error} cohérents
- [ ] Types TypeScript à jour

### Phase UI ✓
- [ ] Tous composants créés
- [ ] Styles cohérents avec l'existant
- [ ] Responsive sur différentes tailles

### Phase Intégration ✓
- [ ] Workflow complet fonctionnel
- [ ] Pas de régression sur fonctionnalités existantes
- [ ] Performance acceptable (<2s pour générer suggestions)

### Phase Documentation ✓
- [ ] README mis à jour
- [ ] Commentaires dans le code
- [ ] Exemples d'utilisation

---

## 🚀 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

**Jour 1 : Infrastructure (4h)**
- Matin : Parties 1 + 2 (SQL + Services)
- Après-midi : Tests manuels complets

**Jour 2 : Composants UI (5h)**
- Matin : Partie 3 (Composants de base)
- Après-midi : Partie 4 (CharteTuningPanel)

**Jour 3 : Édition & Intégration (4h)**
- Matin : Partie 5 (CharteEditorPanel)
- Après-midi : Partie 6 (Intégration + Tests E2E)

---

## 📝 NOTES IMPORTANTES

1. **Commit fréquents** : Commit après chaque partie validée
2. **Tests incrémentaux** : Tester chaque composant isolément avant intégration
3. **Sauvegarde SQL** : Backup base avant exécution migrations
4. **Branch dédié** : Créer `feature/sprint5-charte-tuning`
5. **Documentation** : Documenter au fur et à mesure

---

## ✅ CRITÈRES DE VALIDATION

### Fonctionnels

- [ ] Les suggestions sont générées automatiquement après validation
- [ ] Les suggestions sont triées par priorité (1, 2, 3)
- [ ] Les statistiques par catégorie sont calculées correctement
- [ ] L'application d'une suggestion crée une nouvelle version
- [ ] L'historique des modifications est tracé
- [ ] Les commentaires de Thomas sont conservés dans supporting_data

### Techniques

- [ ] Toutes les tables ont des index appropriés
- [ ] Les fonctions SQL gèrent les erreurs
- [ ] Les services TypeScript retournent {data, error}
- [ ] Les composants UI sont réactifs
- [ ] Le système est scalable (100+ suggestions)

### Scientifiques

- [ ] La traçabilité des modifications est complète
- [ ] Les métriques sont reproductibles
- [ ] L'impact des modifications est mesurable (Kappa avant/après)
- [ ] Le système supporte plusieurs cycles de tuning

---

## 📊 MÉTRIQUES DE SUCCÈS

### Efficacité du Tuning

```sql
-- Mesurer l'amélioration du Kappa après tuning
SELECT 
  cm.version_from,
  cm.version_to,
  lct_before.kappa as kappa_before,
  lct_after.kappa as kappa_after,
  lct_after.kappa - lct_before.kappa as improvement,
  cm.modification_type,
  cm.reason
FROM charte_modifications cm
JOIN level0_charte_tests lct_before ON cm.source_test_id = lct_before.test_id
JOIN level0_charte_tests lct_after ON lct_after.charte_id = cm.charte_id 
  AND lct_after.tested_at > cm.modified_at
ORDER BY cm.modified_at DESC
LIMIT 10;
```

### Taux d'Adoption des Suggestions

```sql
-- Mesurer combien de suggestions sont appliquées
SELECT 
  charte_id,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'applied') as applied,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'applied') / COUNT(*), 
    1
  ) as adoption_rate
FROM charte_improvement_suggestions
GROUP BY charte_id;
```

### Réduction des Désaccords

```sql
-- Mesurer évolution des désaccords par version
SELECT 
  lc.charte_id,
  lc.version,
  AVG(lct.disagreements_count) as avg_disagreements,
  AVG(lct.kappa) as avg_kappa,
  COUNT(*) as test_count
FROM level0_chartes lc
JOIN level0_charte_tests lct ON lct.charte_id = lc.charte_id
GROUP BY lc.charte_id, lc.version
ORDER BY lc.charte_id, lc.version;
```

---

## 🚀 PROCHAINES ÉVOLUTIONS (Post-Sprint 5)

### Phase 1 : Normalisation Automatique

- Appliquer les aliases automatiquement lors de la sauvegarde des annotations
- Fonction `normalize_tag_with_charte()` dans `AnnotationService`

### Phase 2 : Suggestions Avancées

- Détection de catégories à fusionner (faible inter-catégorie distance)
- Suggestions d'ajustement des règles (context_included, examples_per_category)
- Analyse de la confiance LLM pour optimiser temperature/top_p

### Phase 3 : Tests A/B Automatisés

- Comparer automatiquement v1.0.0 vs v1.1.0 sur même échantillon
- Générer rapport d'impact avec visualisations

### Phase 4 : Export pour Publication

- Générer documentation scientifique des modifications
- Export CSV de l'historique pour annexe thèse
- Graphiques évolution Kappa par version

---

**Document créé** : 2025-12-19  
**Version** : 1.0  
**Auteur** : Claude (Anthropic) & Thomas  
**Statut** : Spécification complète - Prêt pour implémentation
