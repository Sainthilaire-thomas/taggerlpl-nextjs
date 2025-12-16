# 📝 NOTE : Tables d'historique OBLIGATOIRES pour documentation thèse

*À ajouter à mission-2025-12-15-level0-llm-contra-annotation.md*

---

## ✅ Décision : Créer les tables d'historique

**Raison** : Documentation des tests de chartes dans la thèse (Section 4.3.4)

---

## 📋 Tables à créer (OBLIGATOIRES)

### 1. level0_chartes

**Usage** : Définitions des 5 chartes testées

```sql
CREATE TABLE level0_chartes (
  charte_id TEXT PRIMARY KEY,           -- Ex: "CharteY_B_v1.0.0"
  charte_name TEXT NOT NULL,            -- Ex: "Charte B - Enrichie"
  charte_description TEXT,
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  definition JSONB NOT NULL,            -- Configuration complète
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_baseline BOOLEAN DEFAULT false
);
```

**Contenu attendu** : 5 chartes
- CharteY_A (minimaliste)
- CharteY_B (enrichie) ← baseline recommandée
- CharteY_C (binaire)
- CharteX_A (sans contexte)
- CharteX_B (avec contexte)

### 2. level0_charte_tests

**Usage** : Résultats des tests (Kappa, accuracy, métriques)

```sql
CREATE TABLE level0_charte_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  
  -- Métriques globales
  kappa NUMERIC NOT NULL,               -- Cohen's Kappa
  accuracy NUMERIC NOT NULL,            -- Taux de précision
  total_pairs INTEGER NOT NULL,         -- 901
  disagreements_count INTEGER NOT NULL,
  
  -- Métriques détaillées (JSONB)
  metrics JSONB,                        -- precision, recall, F1, confusion matrix
  
  -- Métadonnées
  execution_time_ms INTEGER,
  openai_model TEXT DEFAULT 'gpt-4o',
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(charte_id, variable)
);
```

**Contenu attendu** : 5-10 lignes (une par charte × variable testée)

### 3. level0_charte_results (OPTIONNELLE)

**Usage** : Détails de chaque annotation (901 × N chartes)

```sql
CREATE TABLE level0_charte_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES level0_charte_tests(test_id) ON DELETE CASCADE,
  pair_id INTEGER NOT NULL REFERENCES analysis_pairs(pair_id),
  
  -- Résultat pour cette paire
  manual_tag TEXT NOT NULL,             -- Annotation manuelle
  llm_tag TEXT NOT NULL,                -- Annotation LLM
  is_agreement BOOLEAN NOT NULL,        -- Accord ?
  llm_confidence NUMERIC,
  llm_reasoning TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(test_id, pair_id)
);
```

**Contenu attendu** : 901 × 5 = ~4500 lignes (si tu veux garder le détail)

**Alternative** : Stocker uniquement dans `level0_charte_tests.metrics` en JSONB (plus léger)

---

## 📊 Impact Supabase RÉVISÉ

| Élément | Avant | Après |
|---------|-------|-------|
| **Tables nouvelles** | 0 | 2-3 |
| **RPC functions** | 0 | 1 |
| **Stockage estimé** | 0 MB | ~10-15 MB |
| **Coût** | Gratuit | Gratuit (Free tier) |

---

## 🎯 Données pour la thèse

### Tableau comparatif des chartes

**Requête SQL** :

```sql
-- Comparaison des chartes pour Variable Y
SELECT 
  c.charte_name,
  t.kappa,
  t.accuracy,
  t.disagreements_count,
  ROUND(t.execution_time_ms / 1000.0, 1) as execution_time_sec
FROM level0_charte_tests t
JOIN level0_chartes c ON t.charte_id = c.charte_id
WHERE t.variable = 'Y'
ORDER BY t.kappa DESC;
```

**Résultat attendu** :

| charte_name | kappa | accuracy | disagreements | execution_time_sec |
|-------------|-------|----------|---------------|--------------------|
| Charte B - Enrichie | 0.998 | 99.9% | 1 | 182.3 |
| Charte A - Minimaliste | 0.882 | 91.2% | 79 | 178.5 |
| Charte C - Binaire | 0.845 | 87.3% | 114 | 175.8 |

### Matrice de confusion par charte

**Requête SQL** :

```sql
-- Matrice de confusion pour CharteY_B
SELECT 
  metrics->'confusionMatrix'
FROM level0_charte_tests
WHERE charte_id = 'CharteY_B_v1.0.0' AND variable = 'Y';
```

### Exemples de désaccords

**Requête SQL** (si table level0_charte_results existe) :

```sql
-- Top 10 désaccords pour CharteY_B
SELECT 
  ap.pair_id,
  ap.client_verbatim,
  r.manual_tag,
  r.llm_tag,
  r.llm_reasoning
FROM level0_charte_results r
JOIN analysis_pairs ap ON r.pair_id = ap.pair_id
JOIN level0_charte_tests t ON r.test_id = t.test_id
WHERE t.charte_id = 'CharteY_B_v1.0.0'
  AND r.is_agreement = false
ORDER BY ap.pair_id
LIMIT 10;
```

---

## 📝 Section thèse (exemple de structure)

### 4.3.4 Validation des chartes d'annotation par LLM

**4.3.4.1 Méthodologie**

"Nous avons testé 5 variantes de chartes d'annotation auprès d'un modèle de langage (OpenAI GPT-4o) sur l'ensemble du corpus (N=901 paires conseiller-client). L'objectif était d'identifier la formulation de consigne produisant les annotations les plus reproductibles, mesurées par l'accord avec les annotations manuelles de référence (Cohen's Kappa)."

**4.3.4.2 Chartes testées**

| Charte | Description | Caractéristiques |
|--------|-------------|------------------|
| CharteY_A | Minimaliste | 3 exemples par catégorie |
| CharteY_B | Enrichie | 10+ patterns, règles explicites |
| CharteY_C | Binaire | POSITIF vs NON-POSITIF |

**4.3.4.3 Résultats comparatifs**

[Insérer tableau SQL ci-dessus]

"La Charte B (enrichie) obtient un Kappa de 0.998 (accord quasi-parfait selon Landis & Koch, 1977), avec seulement 1 désaccord sur 901 paires. Ce résultat valide empiriquement l'approche consistant à fournir des patterns détaillés et des règles de priorité explicites au modèle de langage."

**4.3.4.4 Analyse qualitative des désaccords**

[Insérer exemples de désaccords avec verbatims]

"L'unique désaccord identifié concerne le back-channel '[AP] hm', classé POSITIF par l'annotateur humain (continuation positive) et NEUTRE par le LLM (interprétation littérale). Cette divergence révèle la difficulté d'interpréter les marqueurs prosodiques minimaux sans accès à l'intonation."

---

## ✅ Script complet d'installation

**À exécuter dans Supabase SQL Editor** :

```sql
-- ============================================================================
-- LEVEL 0 : Tables pour documentation tests multi-chartes
-- ============================================================================

-- 1. Table des définitions de chartes
CREATE TABLE level0_chartes (
  charte_id TEXT PRIMARY KEY,
  charte_name TEXT NOT NULL,
  charte_description TEXT,
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  definition JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_baseline BOOLEAN DEFAULT false
);

CREATE INDEX idx_level0_chartes_variable ON level0_chartes(variable);

-- 2. Table des résultats de tests
CREATE TABLE level0_charte_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL REFERENCES level0_chartes(charte_id),
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  kappa NUMERIC NOT NULL,
  accuracy NUMERIC NOT NULL,
  total_pairs INTEGER NOT NULL,
  disagreements_count INTEGER NOT NULL,
  metrics JSONB,
  execution_time_ms INTEGER,
  openai_model TEXT DEFAULT 'gpt-4o',
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(charte_id, variable)
);

CREATE INDEX idx_charte_tests_variable ON level0_charte_tests(variable);
CREATE INDEX idx_charte_tests_kappa ON level0_charte_tests(kappa DESC);

-- 3. RLS Policies
ALTER TABLE level0_chartes ENABLE ROW LEVEL SECURITY;
ALTER TABLE level0_charte_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to chartes"
  ON level0_chartes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to tests"
  ON level0_charte_tests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Fonction RPC pour bulk update level0_gold (obligatoire)
CREATE OR REPLACE FUNCTION bulk_update_level0_gold(updates JSONB)
RETURNS void AS $$
BEGIN
  UPDATE analysis_pairs AS ap
  SET 
    level0_gold_conseiller = u.level0_gold_conseiller,
    level0_gold_client = u.level0_gold_client,
    level0_annotator_agreement = u.level0_annotator_agreement::numeric,
    level0_validated_at = u.level0_validated_at::timestamptz
  FROM jsonb_to_recordset(updates) AS u(
    pair_id INTEGER,
    level0_gold_conseiller TEXT,
    level0_gold_client TEXT,
    level0_annotator_agreement TEXT,
    level0_validated_at TEXT
  )
  WHERE ap.pair_id = u.pair_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Vérification
SELECT 'Tables créées avec succès !' as status;
```

---

## 📋 Checklist d'intégration

### Avant les tests (Session 1)

- [ ] Exécuter le script SQL complet dans Supabase
- [ ] Vérifier création des tables
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name LIKE 'level0_%';
  ```
- [ ] Insérer les 5 définitions de chartes dans `level0_chartes`

### Pendant les tests (Session 2)

- [ ] Pour chaque charte testée, insérer résultats dans `level0_charte_tests`
- [ ] Vérifier les Kappa calculés
- [ ] Identifier la meilleure charte

### Après validation (Session 3-4)

- [ ] Appliquer consensus → `analysis_pairs.level0_gold_*` via RPC
- [ ] Marquer la meilleure charte comme baseline (`is_baseline = true`)

### Pour la thèse (ultérieur)

- [ ] Extraire tableau comparatif via SQL
- [ ] Extraire matrices de confusion
- [ ] Extraire exemples de désaccords
- [ ] Rédiger section 4.3.4

---

## 🎯 Résumé

**Impact Supabase pour documentation thèse** :

| Élément | Quantité |
|---------|----------|
| **Tables nouvelles** | 2 obligatoires (chartes + tests) |
| **RPC functions** | 1 (bulk_update) |
| **Lignes insérées** | ~15 (5 chartes + 10 tests) |
| **Stockage** | ~10 MB |
| **Temps setup** | 30 min |

**Bénéfice** : Section thèse complète avec validation empirique des chartes d'annotation LLM 📚✨

---

*Tables créées → Tests documentés → Section thèse complète* ✅
