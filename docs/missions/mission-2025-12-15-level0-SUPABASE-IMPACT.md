# 📊 Impact Supabase - Mission Level 0

*Analyse de l'impact base de données pour mission-2025-12-15-level0-llm-contra-annotation.md*

---

## 🎯 Résumé exécutif

### Impact MINIMAL sur Supabase ✅

**Bonne nouvelle** : La structure `analysis_pairs` contient **déjà les colonnes Level 0** nécessaires !

| Élément | Status | Action requise |
|---------|--------|----------------|
| Colonnes `level0_gold_*` dans `analysis_pairs` | ✅ Existent | Aucune (juste UPDATE) |
| Table `analysis_pairs` structure | ✅ Complète | Aucune modification |
| Nouvelle table pour multi-chartes | ⚠️ Optionnelle | Créer si besoin historique |
| RPC functions | ✅ Existantes | Aucune modification |

---

## 📋 Tables concernées

### 1. analysis_pairs (EXISTANTE - Aucune modification)

**Status** : ✅ **Colonnes Level 0 déjà présentes**

```sql
-- Colonnes Level 0 DÉJÀ dans analysis_pairs
level0_gold_conseiller       TEXT      -- Tag consensuel après validation
level0_gold_client           TEXT      -- Tag consensuel après validation
level0_annotator_agreement   NUMERIC   -- Score Cohen's Kappa (0-1)
level0_validated_at          TIMESTAMPTZ  -- Date de validation
```

**Opération nécessaire** : Juste des **UPDATE**, pas d'ALTER TABLE

```sql
-- Exemple d'update après contre-annotation
UPDATE analysis_pairs
SET 
  level0_gold_conseiller = 'ENGAGEMENT',
  level0_gold_client = 'CLIENT_POSITIF',
  level0_annotator_agreement = 0.998,
  level0_validated_at = NOW()
WHERE pair_id = 123;
```

**Impact** : 🟢 AUCUN changement de structure

---

### 2. level0_charte_tests (NOUVELLE - Optionnelle)

**Status** : 🆕 **À créer UNIQUEMENT pour approche multi-chartes**

**Usage** : Stocker l'historique des tests de différentes chartes

```sql
CREATE TABLE level0_charte_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL,  -- Ex: "CharteY_B_v1.0.0"
  charte_name TEXT NOT NULL,  -- Ex: "Charte B - Enrichie"
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  
  -- Résultats globaux
  kappa NUMERIC,  -- Cohen's Kappa
  accuracy NUMERIC,  -- Taux de précision
  total_pairs INTEGER,  -- Nombre de paires testées (901)
  disagreements_count INTEGER,  -- Nombre de désaccords
  
  -- Métriques détaillées (JSONB)
  metrics JSONB,  -- {precision: {...}, recall: {...}, f1Score: {...}, confusionMatrix: {...}}
  
  -- Métadonnées
  execution_time_ms INTEGER,  -- Durée d'exécution
  openai_model TEXT,  -- Ex: "gpt-4o"
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  tested_by UUID REFERENCES auth.users(id),
  
  -- Résultats détaillés (optionnel, peut être lourd)
  detailed_results JSONB,  -- Array des 901 résultats individuels
  
  UNIQUE(charte_id, variable)  -- Une seule entrée par charte/variable
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_level0_charte_tests_variable ON level0_charte_tests(variable);
CREATE INDEX idx_level0_charte_tests_kappa ON level0_charte_tests(kappa DESC);
```

**Alternative légère** : Stocker juste en mémoire (pas de table)

Si tu n'as pas besoin de conserver l'historique à long terme, tu peux :
- Générer les tests
- Comparer les Kappa
- Sélectionner la meilleure charte
- Appliquer → `analysis_pairs.level0_gold_*`
- **Ne PAS créer cette table**

---

### 3. level0_chartes (NOUVELLE - Optionnelle)

**Status** : 🆕 **À créer SI tu veux gérer les chartes en BDD plutôt qu'en code**

**Usage** : Stocker les définitions de chartes (alternative au CharteRegistry en TypeScript)

```sql
CREATE TABLE level0_chartes (
  charte_id TEXT PRIMARY KEY,  -- Ex: "CharteY_B_v1.0.0"
  charte_name TEXT NOT NULL,
  charte_description TEXT,
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  
  -- Définition complète en JSONB
  definition JSONB NOT NULL,  -- {categories: {...}, rules: {...}, priority_rules: [...]}
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  
  -- Baseline
  is_baseline BOOLEAN DEFAULT false  -- Une seule baseline par variable
);

-- Index
CREATE INDEX idx_level0_chartes_variable ON level0_chartes(variable);
CREATE INDEX idx_level0_chartes_baseline ON level0_chartes(variable, is_baseline) WHERE is_baseline = true;
```

**Alternative** : Garder les chartes en code TypeScript (`CharteRegistry`)

**Avantages code** :
- Versioning avec Git
- Pas de migration BDD
- Plus simple

**Avantages BDD** :
- Édition via UI
- Historique automatique
- Partage entre équipes

**Recommandation** : **Code TypeScript** pour démarrer, BDD si besoin d'édition UI future

---

### 4. Tables de versioning (EXISTANTES - Déjà planifiées)

Ces tables sont mentionnées dans les docs mais peuvent ne pas encore exister :

#### algorithm_version_registry

**Status** : ⚠️ Vérifier si existe, sinon créer

```sql
-- Vérifier existence
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'algorithm_version_registry'
);
```

Si n'existe pas :

```sql
CREATE TABLE algorithm_version_registry (
  version_id TEXT PRIMARY KEY,
  version_name TEXT NOT NULL,
  status TEXT DEFAULT 'testing' CHECK (status IN ('testing', 'validated', 'baseline', 'deprecated')),
  is_baseline BOOLEAN DEFAULT false,
  
  -- Configuration algo X
  x_key TEXT,
  x_version TEXT,
  x_config JSONB,
  
  -- Configuration algo Y
  y_key TEXT,
  y_version TEXT,
  y_config JSONB,
  
  -- Métriques de validation
  level1_metrics JSONB,  -- {accuracy, kappa, f1, ...}
  validation_sample_size INTEGER,
  
  -- Métadonnées
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ
);
```

#### test_runs

**Status** : 🆕 **À créer** (pour workflow versioning/investigation)

```sql
CREATE TABLE test_runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  algorithm_key TEXT NOT NULL,
  algorithm_version TEXT,
  target TEXT NOT NULL,  -- 'X', 'Y', 'M1', 'M2', 'M3'
  
  -- Résultats
  sample_size INTEGER,
  metrics JSONB,
  error_pairs INTEGER[],  -- IDs des paires en erreur
  
  -- Workflow
  outcome TEXT DEFAULT 'pending' CHECK (outcome IN ('pending', 'discarded', 'investigating', 'investigated', 'promoted')),
  baseline_version_id TEXT REFERENCES algorithm_version_registry(version_id),
  baseline_diff JSONB,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

#### investigation_annotations

**Status** : 🆕 **À créer** (pour workflow versioning/investigation)

```sql
CREATE TABLE investigation_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES test_runs(run_id) ON DELETE CASCADE,
  pair_id INTEGER REFERENCES analysis_pairs(pair_id),
  
  -- Annotation
  annotation_type TEXT CHECK (annotation_type IN ('error_pattern', 'suggestion', 'note')),
  content TEXT NOT NULL,
  error_category TEXT,
  severity TEXT CHECK (severity IN ('critical', 'minor', 'edge_case')),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

---

## 🔄 Opérations Supabase nécessaires

### Opération 1 : Remplir level0_gold_* (OBLIGATOIRE)

**Après contre-annotation OpenAI et validation**

```typescript
// Via Supabase client dans GoldStandardService
const updates = validatedPairs.map(pair => ({
  pair_id: pair.pair_id,
  level0_gold_conseiller: pair.consensus_x,
  level0_gold_client: pair.consensus_y,
  level0_annotator_agreement: pair.kappa,
  level0_validated_at: new Date().toISOString(),
}));

// Bulk update via RPC
await supabase.rpc('bulk_update_level0_gold', { updates });
```

**Fonction RPC à créer** :

```sql
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
$$ LANGUAGE plpgsql;
```

### Opération 2 : Créer tables optionnelles (SI BESOIN)

**Pour approche multi-chartes** :

```sql
-- Exécuter dans Supabase SQL Editor
CREATE TABLE level0_charte_tests (...);  -- Voir définition ci-dessus
```

**Pour workflow versioning** :

```sql
-- Si pas encore créées
CREATE TABLE test_runs (...);
CREATE TABLE investigation_annotations (...);
```

### Opération 3 : Créer RLS Policies

**Si RLS activé** (Row Level Security)

```sql
-- Exemple pour level0_charte_tests
ALTER TABLE level0_charte_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read charte tests"
  ON level0_charte_tests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert charte tests"
  ON level0_charte_tests FOR INSERT
  TO authenticated
  WITH CHECK (tested_by = auth.uid());
```

---

## 📊 Volumétrie et performance

### Données existantes

| Élément | Quantité actuelle | Impact |
|---------|-------------------|--------|
| `analysis_pairs` | 901 lignes | ✅ Aucun |
| Colonnes `level0_gold_*` | 4 colonnes × 901 | ✅ Déjà allouées |
| UPDATE bulk (901 lignes) | ~100ms | ✅ Négligeable |

### Nouvelles données (si multi-chartes)

| Élément | Quantité estimée | Taille |
|---------|------------------|--------|
| `level0_charte_tests` | 5 chartes × 2 variables = 10 lignes | ~500 KB |
| `detailed_results` JSONB | 901 résultats × 10 tests = ~9000 entrées | ~10 MB |

**Impact stockage** : 🟢 Négligeable (~10 MB)

---

## 🔐 Sécurité et permissions

### RLS (Row Level Security)

**Tables sensibles** :
- `analysis_pairs` : Données de recherche
- `level0_charte_tests` : Résultats des tests

**Recommandations** :

```sql
-- Option 1 : Désactiver RLS temporairement pour développement
ALTER TABLE analysis_pairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE level0_charte_tests DISABLE ROW LEVEL SECURITY;

-- Option 2 : Policy permissive pour authenticated users
CREATE POLICY "Allow authenticated full access"
  ON analysis_pairs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 📋 Checklist d'implémentation

### Phase 0 : Vérification (15 min)

- [ ] Vérifier existence colonnes `level0_gold_*` dans `analysis_pairs`
  ```sql
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'analysis_pairs' 
    AND column_name LIKE 'level0_%';
  ```

- [ ] Vérifier état actuel des colonnes
  ```sql
  SELECT 
    COUNT(*) as total,
    COUNT(level0_gold_conseiller) as validated_x,
    COUNT(level0_gold_client) as validated_y,
    AVG(level0_annotator_agreement) as avg_kappa
  FROM analysis_pairs;
  ```

### Phase 1 : Approche simple (30 min)

**Si tu ne veux PAS l'approche multi-chartes** :

- [ ] Créer fonction RPC `bulk_update_level0_gold`
- [ ] Tester sur 10 paires
- [ ] Appliquer sur 901 paires

**Total Supabase** : 1 fonction RPC, 0 nouvelle table

### Phase 2 : Approche multi-chartes (1h)

**Si tu veux l'approche multi-chartes** :

- [ ] Créer table `level0_charte_tests`
- [ ] (Optionnel) Créer table `level0_chartes`
- [ ] Créer fonction RPC `bulk_update_level0_gold`
- [ ] Créer RLS policies
- [ ] Tester insertion résultats

**Total Supabase** : 1-2 nouvelles tables, 1 fonction RPC

### Phase 3 : Workflow versioning (optionnel)

**Si tu veux le workflow complet test_runs/investigation** :

- [ ] Créer table `test_runs`
- [ ] Créer table `investigation_annotations`
- [ ] Créer RLS policies
- [ ] Tester workflow

---

## 💰 Coûts estimés

### Stockage Supabase

| Élément | Taille | Coût (Free tier) |
|---------|--------|------------------|
| 901 paires existantes | ~5 MB | ✅ Inclus |
| Updates `level0_gold_*` | 0 MB (UPDATE) | ✅ Gratuit |
| Table `level0_charte_tests` | ~10 MB | ✅ Inclus |

**Total** : 🟢 **Aucun surcoût** (dans limite 500 MB Free tier)

### API calls

| Opération | Nombre | Coût |
|-----------|--------|------|
| SELECT analysis_pairs | 1 × 901 lignes | ✅ Gratuit |
| UPDATE bulk (RPC) | 1 × 901 lignes | ✅ Gratuit |
| INSERT charte_tests | 5-10 lignes | ✅ Gratuit |

**Total** : 🟢 **Aucun surcoût** (dans limite Free tier)

---

## 🎯 Recommandations

### Pour démarrer rapidement (approche minimale)

1. ✅ **Vérifier** colonnes `level0_gold_*` existent (normalement oui)
2. ✅ **Créer** fonction RPC `bulk_update_level0_gold`
3. ✅ **Implémenter** services TypeScript
4. ✅ **Tester** sur 10 paires
5. ✅ **Appliquer** sur 901 paires

**Impact Supabase** : 🟢 **1 fonction RPC uniquement**

### Pour approche scientifique complète (multi-chartes)

1. ✅ Approche minimale (ci-dessus)
2. ✅ **Créer** table `level0_charte_tests`
3. ✅ **Stocker** résultats de 5 chartes testées
4. ✅ **Analyser** avec UI de comparaison
5. ✅ **Documenter** dans thèse

**Impact Supabase** : 🟢 **1 fonction RPC + 1 table (10 MB)**

---

## 📝 Scripts SQL prêts à l'emploi

### Script 1 : Vérification état actuel

```sql
-- État des colonnes Level 0
SELECT 
  COUNT(*) as total_pairs,
  COUNT(level0_gold_conseiller) as x_validated,
  COUNT(level0_gold_client) as y_validated,
  ROUND(AVG(level0_annotator_agreement)::numeric, 3) as avg_kappa,
  COUNT(*) FILTER (WHERE level0_validated_at IS NOT NULL) as fully_validated
FROM analysis_pairs;

-- Distribution des tags gold (si déjà remplis)
SELECT 
  level0_gold_conseiller, 
  COUNT(*) as count
FROM analysis_pairs 
WHERE level0_gold_conseiller IS NOT NULL
GROUP BY level0_gold_conseiller
ORDER BY count DESC;
```

### Script 2 : Création fonction RPC (OBLIGATOIRE)

```sql
-- Fonction pour bulk update des level0_gold_*
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

-- Test de la fonction
SELECT bulk_update_level0_gold('[
  {
    "pair_id": 1,
    "level0_gold_conseiller": "ENGAGEMENT",
    "level0_gold_client": "CLIENT_POSITIF",
    "level0_annotator_agreement": "0.998",
    "level0_validated_at": "2025-12-15T10:00:00Z"
  }
]'::jsonb);
```

### Script 3 : Création table multi-chartes (OPTIONNEL)

```sql
-- Table pour stocker résultats tests de chartes
CREATE TABLE level0_charte_tests (
  test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charte_id TEXT NOT NULL,
  charte_name TEXT NOT NULL,
  variable TEXT NOT NULL CHECK (variable IN ('X', 'Y')),
  kappa NUMERIC,
  accuracy NUMERIC,
  total_pairs INTEGER,
  disagreements_count INTEGER,
  metrics JSONB,
  execution_time_ms INTEGER,
  openai_model TEXT DEFAULT 'gpt-4o',
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(charte_id, variable)
);

CREATE INDEX idx_charte_tests_variable ON level0_charte_tests(variable);
CREATE INDEX idx_charte_tests_kappa ON level0_charte_tests(kappa DESC);

-- RLS policy
ALTER TABLE level0_charte_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access"
  ON level0_charte_tests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## ✅ Conclusion

### Impact Supabase : 🟢 MINIMAL

| Approche | Tables nouvelles | Fonctions RPC | Modifications colonnes |
|----------|------------------|---------------|------------------------|
| **Minimale** | 0 | 1 | 0 (juste UPDATE) |
| **Multi-chartes** | 1 | 1 | 0 (juste UPDATE) |
| **Complète (versioning)** | 3 | 1 | 0 (juste UPDATE) |

**Recommandation** : Commencer avec **approche minimale**, ajouter multi-chartes si besoin de documentation scientifique.

---

*L'architecture existante est bien conçue - les colonnes Level 0 sont déjà prêtes !* ✅
