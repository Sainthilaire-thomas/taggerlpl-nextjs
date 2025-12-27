# 📊 Architecture Données Level 0 - Tables & Flux Complets

**Date** : 2025-12-19  
**Sprint** : Sprint 4 - Gold Standards  
**Objectif** : Documenter toutes les tables et clarifier les flux de données

---

## 🗄️ RECENSEMENT DES TABLES

### **Tables Sources (OLTP - Configuration & Données Brutes)**

#### 1. `analysis_pairs` (901 lignes)
**Rôle** : Table centrale contenant les paires conseiller-client avec annotations manuelles de Thomas

**Colonnes clés** :
```sql
pair_id (PK)                  -- Identifiant unique de la paire
call_id                       -- Référence vers l'appel audio
conseiller_turn_id            -- ID du tour conseiller
client_turn_id                -- ID du tour client
conseiller_verbatim           -- Texte du conseiller
client_verbatim               -- Texte du client
prev1_verbatim, prev2_verbatim, prev3_verbatim  -- Contexte avant
next1_verbatim, next2_verbatim, next3_verbatim  -- Contexte après
strategy_tag                  -- ⭐ ANNOTATION MANUELLE THOMAS (Variable X)
reaction_tag                  -- ⭐ ANNOTATION MANUELLE THOMAS (Variable Y)
```

**Source** : Annotations manuelles de Thomas (audio + texte)  
**Modifiable** : ❌ NON (source de vérité, protégée)  
**Backup** : `analysis_pairs_backup_20251218`

---

#### 2. `level0_chartes` (5 lignes)
**Rôle** : Définitions des chartes d'annotation (philosophies, prompts, paramètres)

**Colonnes clés** :
```sql
charte_id (PK)                -- Ex: CharteY_B_v1.0.0
charte_name                   -- Nom lisible
variable                      -- X (stratégies) ou Y (réactions)
philosophy                    -- Minimaliste / Enrichie / Binaire
version                       -- Version sémantique (1.0.0)
prompt_template               -- Template pour le LLM
prompt_params                 -- {model: "gpt-4o-mini", temperature: 0.0}
definition                    -- Définitions des catégories (JSONB)
gold_standard_id              -- ⭐ Référence vers gold_standards
is_baseline                   -- Charte de référence ?
created_at, updated_at
```

**Source** : Configuration manuelle  
**Modifiable** : ✅ OUI (via interface)

---

#### 3. `gold_standards` (2 lignes actuellement)
**Rôle** : Métadonnées sur les gold standards (qui, quoi, comment)

**Colonnes clés** :
```sql
gold_standard_id (PK)         -- Ex: thomas_audio_y, thomas_texte_y
name                          -- Nom descriptif
description                   -- Description de la modalité
annotator_name                -- "Thomas"
annotator_type                -- "human_expert"
modality                      -- audio / text_only / video
variable                      -- X ou Y
created_at, updated_at
```

**Contenu actuel** :
```
1. thomas_audio_x : Annotations X de Thomas (audio)
2. thomas_audio_y : Annotations Y de Thomas (audio)
```

**Source** : Déclaration manuelle  
**Modifiable** : ✅ OUI (création de nouveaux GS)

---

#### 4. `pair_gold_standards` (902+ lignes)
**Rôle** : Valeurs réelles des gold standards pour chaque paire (avec versioning)

**Colonnes clés** :
```sql
id (PK auto)
pair_id (FK → analysis_pairs)
gold_standard_id (FK → gold_standards)
strategy_gold_tag             -- Tag X pour ce GS
reaction_gold_tag             -- Tag Y pour ce GS
version                       -- Version du tag (1, 2, 3...)
is_current                    -- Version active ?
validated_at                  -- Date de création/correction
validated_by                  -- Qui a validé
validation_notes              -- Notes de correction
```

**Relation** :
```
analysis_pairs (1) ←→ (N) pair_gold_standards
gold_standards (1) ←→ (N) pair_gold_standards
```

**Exemple (après correction CAS A)** :
```sql
-- Paire 3768, Gold Standard thomas_audio_y
v1: reaction_gold_tag='CLIENT_NEUTRE', is_current=false  -- Ancien
v2: reaction_gold_tag='CLIENT_POSITIF', is_current=true  -- Corrigé après validation
```

**Source** : 
- v1 : Migration depuis `analysis_pairs.reaction_tag`
- v2+ : Corrections via validation désaccords (CAS A)

**Modifiable** : ✅ OUI (via validations CAS A)

---

### **Tables Analytiques (OLAP - Tests & Résultats)**

#### 5. `level0_charte_tests` (10-20 lignes)
**Rôle** : Résultats des tests de chartes (1 ligne = 1 test sur N paires)

**Colonnes clés** :
```sql
test_id (PK, UUID)
charte_id (FK → level0_chartes)
variable                      -- X ou Y
kappa                         -- ⭐ Cohen's Kappa BRUT (initial)
kappa_corrected               -- ⭐ Cohen's Kappa CORRIGÉ (après validations)
accuracy                      -- Taux d'accord (%)
total_pairs                   -- Nombre de paires testées (ex: 10)
disagreements_count           -- Nombre de désaccords (ex: 5)
disagreements                 -- ⭐ Détails désaccords (JSONB array)
validated_disagreements       -- Désaccords justifiés (CAS A)
unjustified_disagreements     -- Désaccords injustifiés (CAS B)
metrics                       -- Métriques complètes (JSONB)
philosophy                    -- Copie depuis level0_chartes
version                       -- Copie depuis level0_chartes
openai_model                  -- Modèle LLM utilisé
tested_at                     -- Date du test
```

**Structure `disagreements` (JSONB)** :
```json
[
  {
    "pairId": 3187,
    "manualTag": "CLIENT_NEUTRE",
    "llmTag": "CLIENT_POSITIF",
    "verbatim": "d'accord",
    "llmReasoning": "Le client est d'accord, donc positif",
    "llmConfidence": 0.85
  }
]
```

**Source** : Généré automatiquement lors du test  
**Modifiable** : ✅ OUI (kappa_corrected mis à jour après validations)

---

#### 6. `annotations` (900-1000 lignes)
**Rôle** : Historique de toutes les annotations (humaines et LLM)

**Colonnes clés** :
```sql
annotation_id (PK, UUID)
pair_id (FK → analysis_pairs)
annotator_type                -- "human_manual" ou "llm_openai"
annotator_id                  -- charte_id pour LLM, user_id pour humains
strategy_tag                  -- Tag X annoté
reaction_tag                  -- Tag Y annoté
confidence                    -- Confiance LLM (0-1)
reasoning                     -- Raisonnement LLM
annotation_context            -- Métadonnées (JSONB)
test_id (FK → level0_charte_tests)  -- Lien vers le test
annotated_at
```

**Contrainte unicité** : `(pair_id, annotator_type, annotator_id)`

**Exemple** :
```sql
-- Paire 3187, Test CharteY_B
pair_id: 3187
annotator_type: "llm_openai"
annotator_id: "CharteY_B_v1.0.0"
reaction_tag: "CLIENT_POSITIF"  -- ⭐ Résultat LLM
test_id: "abc-123-def"
```

**Source** : Généré lors des tests LLM  
**Modifiable** : ❌ NON (historique)

---

#### 7. `disagreement_validations` (0-50 lignes)
**Rôle** : Validations des désaccords (CAS A/B/C)

**Colonnes clés** :
```sql
validation_id (PK, UUID)
test_id (FK → level0_charte_tests)
pair_id (FK → analysis_pairs)
charte_id (FK → level0_chartes)
manual_tag                    -- Tag gold standard (avant correction)
llm_tag                       -- Tag LLM
llm_confidence
llm_reasoning
validation_decision           -- ⭐ CAS_A_LLM_CORRECT / CAS_B_LLM_INCORRECT / CAS_C_AMBIGUOUS
corrected_tag                 -- Si CAS A : nouveau tag
validation_comment            -- Justification de Thomas
verbatim
context_before, context_after
validated_at
```

**Exemple** :
```sql
-- Paire 3768, CAS A
pair_id: 3768
manual_tag: "CLIENT_NEUTRE"
llm_tag: "CLIENT_POSITIF"
validation_decision: "CAS_A_LLM_CORRECT"
corrected_tag: "CLIENT_POSITIF"
validation_comment: "Le LLM a raison, c'est effectivement positif"
```

**Source** : Créé lors de la validation manuelle  
**Modifiable** : ✅ OUI (suppression possible)

---

## 🔄 FLUX DE DONNÉES COMPLET

### **PHASE 0 : Préparation Gold Standards**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Thomas annote 901 paires manuellement (audio + texte)   │
│    → Stockage dans analysis_pairs.strategy_tag              │
│    → Stockage dans analysis_pairs.reaction_tag              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Création métadonnées Gold Standards                     │
│    → INSERT INTO gold_standards                             │
│      (thomas_audio_x, thomas_audio_y)                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Migration 006 : Copie vers pair_gold_standards          │
│    → 901 lignes pour thomas_audio_x (strategy_tag)         │
│    → 901 lignes pour thomas_audio_y (reaction_tag)         │
│    → version=1, is_current=true                             │
└─────────────────────────────────────────────────────────────┘
```

---

### **PHASE 1 : Création d'une Charte**

```
┌─────────────────────────────────────────────────────────────┐
│ Interface Level0Interface.tsx                               │
│ Thomas crée "CharteY_B_v1.0.0"                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ INSERT INTO level0_chartes                                  │
│   charte_id: "CharteY_B_v1.0.0"                            │
│   variable: "Y"                                             │
│   philosophy: "Enrichie"                                    │
│   gold_standard_id: "thomas_audio_y"  ← ⭐ LIEN VERS GS    │
│   prompt_template: "..."                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### **PHASE 2 : Lancement d'un Test**

```
┌─────────────────────────────────────────────────────────────┐
│ Interface : Sélection CharteY_B + 10 paires                │
│ Clic sur "TESTER"                                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Sélection aléatoire 10 paires depuis analysis_pairs     │
│    WHERE reaction_tag IS NOT NULL                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Pour chaque paire :                                      │
│    - Construire prompt avec charte.prompt_template          │
│    - Appel OpenAI API                                       │
│    - Récupération tag LLM                                   │
│    - INSERT INTO annotations                                │
│      (pair_id, annotator_type='llm_openai',                │
│       annotator_id='CharteY_B_v1.0.0',                     │
│       reaction_tag=[tag LLM])                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Comparaison tags pour chaque paire :                    │
│                                                             │
│    SOURCE 1 (Gold Standard) :                               │
│    SELECT reaction_gold_tag                                 │
│    FROM pair_gold_standards                                 │
│    WHERE pair_id = X                                        │
│      AND gold_standard_id = 'thomas_audio_y'               │
│      AND is_current = true                                  │
│                                                             │
│    SOURCE 2 (LLM) :                                         │
│    SELECT reaction_tag                                      │
│    FROM annotations                                         │
│    WHERE pair_id = X                                        │
│      AND annotator_id = 'CharteY_B_v1.0.0'                │
│                                                             │
│    SI gold_tag ≠ llm_tag → DÉSACCORD                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Calcul métriques :                                       │
│    - Kappa brut (accord observé vs attendu)                │
│    - Accuracy (% accords)                                   │
│    - Matrice de confusion                                   │
│    - Liste désaccords (JSONB array)                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. INSERT INTO level0_charte_tests                         │
│    test_id: UUID                                            │
│    charte_id: "CharteY_B_v1.0.0"                          │
│    kappa: 0.254 (brut)                                     │
│    disagreements_count: 5                                   │
│    disagreements: [                                         │
│      {pairId: 3187, manualTag: "NEUTRE", llmTag: "POSITIF"}│
│      ... 4 autres                                           │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

### **PHASE 3 : Validation des Désaccords**

```
┌─────────────────────────────────────────────────────────────┐
│ Onglet "VALIDATION DÉSACCORDS"                              │
│ Clic sur "VALIDER" pour test_id="abc-123"                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ DisagreementValidationService.getPendingDisagreements()     │
│                                                             │
│ SOURCE : level0_charte_tests.disagreements (JSONB)         │
│ SELECT disagreements FROM level0_charte_tests              │
│ WHERE test_id = 'abc-123'                                  │
│                                                             │
│ → Parse JSON pour extraire liste désaccords                │
│ → Filtre ceux NON encore validés :                         │
│   SELECT pair_id FROM disagreement_validations             │
│   WHERE test_id = 'abc-123'                                │
│   → Exclut pair_ids déjà validés                           │
│                                                             │
│ RÉSULTAT : Liste désaccords en attente                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Thomas valide paire 3768 : CAS A (LLM correct)            │
│                                                             │
│ 1. INSERT INTO disagreement_validations                    │
│    validation_decision: "CAS_A_LLM_CORRECT"                │
│    corrected_tag: "CLIENT_POSITIF"                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Correction Gold Standard (CAS A seulement)              │
│                                                             │
│    a) Désactiver version actuelle :                         │
│       UPDATE pair_gold_standards                            │
│       SET is_current = false                                │
│       WHERE pair_id = 3768                                  │
│         AND gold_standard_id = 'thomas_audio_y'            │
│         AND version = 1                                     │
│                                                             │
│    b) Créer nouvelle version :                              │
│       INSERT INTO pair_gold_standards                       │
│         pair_id: 3768                                       │
│         gold_standard_id: 'thomas_audio_y'                 │
│         reaction_gold_tag: 'CLIENT_POSITIF' ← Corrigé      │
│         version: 2                                          │
│         is_current: true                                    │
│         validation_notes: "CAS A: Corrected v1→v2"         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Recalcul Kappa Corrigé (fonction SQL)                  │
│    CALL calculate_corrected_kappa('abc-123')               │
│                                                             │
│    Logique :                                                │
│    - Récupère les 10 paires du test                        │
│    - Pour chaque paire :                                    │
│      * Gold tag = pair_gold_standards (is_current=true)    │
│      * LLM tag = annotations                                │
│    - Recalcule Kappa avec nouveaux gold tags               │
│                                                             │
│    RÉSULTAT : kappa_corrected = 0.280 (vs 0.254 brut)     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UPDATE level0_charte_tests                              │
│    SET kappa_corrected = 0.280                             │
│        validated_disagreements = 1                          │
│        unjustified_disagreements = 4                        │
│    WHERE test_id = 'abc-123'                               │
└─────────────────────────────────────────────────────────────┘
```

---

### **PHASE 4 : Affichage Comparateur Kappa**

```
┌─────────────────────────────────────────────────────────────┐
│ Onglet "COMPARATEUR KAPPA"                                  │
│ Sélection : Thomas (Audio) vs LLM CharteY_B               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ KappaComparator.tsx                                         │
│                                                             │
│ SOURCE 1 (Annotateur 1 = Thomas) :                         │
│   → SELECT reaction_gold_tag                                │
│     FROM pair_gold_standards                                │
│     WHERE gold_standard_id = 'thomas_audio_y'              │
│       AND is_current = true                                 │
│     → 901 tags                                              │
│                                                             │
│ SOURCE 2 (Annotateur 2 = LLM CharteY_B) :                  │
│   → SELECT reaction_tag                                     │
│     FROM annotations                                        │
│     WHERE annotator_id = 'CharteY_B_v1.0.0'                │
│       AND test_id = [dernier test]                          │
│     → 10 tags                                               │
│                                                             │
│ PROBLÈME IDENTIFIÉ :                                        │
│   ❌ Compare 901 tags vs 10 tags (tailles différentes)     │
│   ❌ Devrait comparer uniquement les 10 paires du test     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Calcul Kappa sur intersection (10 paires communes)         │
│                                                             │
│ Affiche désaccords :                                        │
│   SOURCE : level0_charte_tests.disagreements (JSONB)       │
│   → Affiche les 5 désaccords INITIAUX du test              │
│   → N'affiche PAS l'état des validations                   │
│                                                             │
│ ⚠️ INCOHÉRENCE :                                            │
│   - Affiche 5 désaccords (état initial)                    │
│   - Mais 3 ont été validés (dans disagreement_validations) │
│   - Les 2 interfaces ne sont PAS synchronisées             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 INCOHÉRENCES IDENTIFIÉES

### **Incohérence 1 : Source des Désaccords**

**Problème** :
```
COMPARATEUR KAPPA (Onglet COMPARATEUR KAPPA)
└─→ Source : level0_charte_tests.disagreements (JSONB)
    └─→ Affiche 5 désaccords (état initial du test)
    └─→ NE CHANGE JAMAIS après validations

VALIDATION DÉSACCORDS (Onglet VALIDATION DÉSACCORDS)
└─→ Source : level0_charte_tests.disagreements - disagreement_validations
    └─→ Affiche 2 désaccords (5 - 3 validés)
    └─→ Se met à jour après chaque validation
```

**Impact** :
- L'utilisateur voit **5 désaccords** dans le Comparateur
- Mais seulement **2 à valider** dans le panneau de Validation
- **Confusion totale** sur l'état réel

---

### **Incohérence 2 : Calcul Kappa Corrigé**

**Problème** :
```
KAPPA BRUT (initial)
└─→ Compare : pair_gold_standards (v1) vs annotations
    └─→ Calculé UNE FOIS lors du test
    └─→ Stocké dans level0_charte_tests.kappa

KAPPA CORRIGÉ (après validations)
└─→ Compare : pair_gold_standards (v2 si CAS A) vs annotations
    └─→ Recalculé après CHAQUE validation
    └─→ Stocké dans level0_charte_tests.kappa_corrected
```

**Question** : Le Comparateur Kappa affiche-t-il le Kappa brut ou corrigé ?

---

### **Incohérence 3 : Versioning Gold Standards**

**Problème** :
```
PENDANT LE TEST
└─→ Utilise : pair_gold_standards WHERE is_current=true
    └─→ Peut utiliser version 1 ou 2 selon validations antérieures

APRÈS VALIDATION CAS A
└─→ Crée version 2
└─→ Invalide version 1

NOUVEAU TEST SUR MÊME CHARTE
└─→ Utilise version 2 (is_current=true)
└─→ Résultat différent du premier test !
```

**Impact** : Les tests ne sont pas reproductibles si le gold standard évolue.

---

## ✅ SOLUTIONS PROPOSÉES

### **Solution 1 : Synchroniser Sources Désaccords**

**Option A : Unifier sur `disagreement_validations`**
```sql
-- Ne plus utiliser level0_charte_tests.disagreements
-- Toujours créer lignes dans disagreement_validations lors du test

CREATE TABLE disagreement_validations (
  ...
  validation_decision TEXT,  -- NULL si pas encore validé
  ...
);

-- Désaccords en attente :
SELECT * FROM disagreement_validations
WHERE test_id = X AND validation_decision IS NULL;

-- Désaccords validés :
SELECT * FROM disagreement_validations
WHERE test_id = X AND validation_decision IS NOT NULL;
```

**Option B : Garder JSON mais ajouter `validated` flag**
```sql
-- Mettre à jour le JSON après validation
UPDATE level0_charte_tests
SET disagreements = jsonb_set(
  disagreements,
  '{0,validated}',
  'true'::jsonb
)
WHERE test_id = X;
```

---

### **Solution 2 : Snapshot Gold Standards**

**Problème** : Gold standards évoluent, tests pas reproductibles

**Solution** : Créer snapshot du GS utilisé lors du test
```sql
CREATE TABLE test_gold_standard_snapshots (
  test_id UUID REFERENCES level0_charte_tests(test_id),
  pair_id INT REFERENCES analysis_pairs(pair_id),
  gold_standard_id TEXT,
  gold_standard_version INT,
  strategy_gold_tag TEXT,
  reaction_gold_tag TEXT,
  PRIMARY KEY (test_id, pair_id)
);

-- Lors du test : copier les 10 tags utilisés
INSERT INTO test_gold_standard_snapshots
SELECT test_id, pair_id, gold_standard_id, version, ...
FROM pair_gold_standards
WHERE pair_id IN (liste_10_paires)
  AND is_current = true;
```

**Avantage** : Tests reproductibles même si GS évolue

---

### **Solution 3 : Clarifier Kappa Brut vs Corrigé**

**Dans l'interface** :
```tsx
// Comparateur Kappa
<Box>
  <Typography variant="h6">
    Kappa Brut : {test.kappa}
  </Typography>
  <Typography variant="caption">
    (Calculé avec gold standard v{initial_version})
  </Typography>
</Box>

<Box>
  <Typography variant="h6">
    Kappa Corrigé : {test.kappa_corrected}
  </Typography>
  <Typography variant="caption">
    (Après {validated_count} validations, gold standard v{current_version})
  </Typography>
</Box>
```

---

## 📋 CHECKLIST AUDIT

### **Tables à Auditer**

- [ ] `analysis_pairs` : Vérifier intégrité (vs backup)
- [ ] `pair_gold_standards` : Vérifier versioning cohérent
- [ ] `level0_charte_tests` : Vérifier disagreements JSONB
- [ ] `disagreement_validations` : Vérifier complétude
- [ ] `annotations` : Vérifier liens test_id

### **Requêtes de Vérification**

```sql
-- 1. Vérifier qu'il n'y a qu'une version active par paire
SELECT pair_id, gold_standard_id, COUNT(*)
FROM pair_gold_standards
WHERE is_current = true
GROUP BY pair_id, gold_standard_id
HAVING COUNT(*) > 1;
-- Résultat attendu : 0 lignes

-- 2. Vérifier cohérence désaccords
SELECT 
  test_id,
  disagreements_count,
  jsonb_array_length(disagreements) as json_count,
  (SELECT COUNT(*) FROM disagreement_validations dv WHERE dv.test_id = lct.test_id) as validation_count
FROM level0_charte_tests lct
WHERE disagreements_count > 0;
-- disagreements_count devrait = json_count

-- 3. Vérifier que analysis_pairs est intact
SELECT COUNT(*) as differences
FROM analysis_pairs ap
JOIN analysis_pairs_backup_20251218 b ON ap.pair_id = b.pair_id
WHERE ap.reaction_tag != b.reaction_tag
   OR ap.strategy_tag != b.strategy_tag;
-- Résultat attendu : 0

-- 4. Vérifier gold standards coverage
SELECT 
  gs.gold_standard_id,
  COUNT(DISTINCT pgs.pair_id) as pairs_count,
  ROUND(COUNT(DISTINCT pgs.pair_id)::numeric / 901 * 100, 1) as coverage_pct
FROM gold_standards gs
LEFT JOIN pair_gold_standards pgs ON gs.gold_standard_id = pgs.gold_standard_id
  AND pgs.is_current = true
GROUP BY gs.gold_standard_id;
-- Résultat attendu : 901 (100%) pour thomas_audio_x et thomas_audio_y
```

---

## 📊 SCHÉMA RELATIONNEL

```
┌──────────────────┐
│ gold_standards   │
│ ──────────────── │
│ • gold_standard_id (PK)
│ • name           │
│ • modality       │
│ • variable       │
└──────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────┐         ┌──────────────────┐
│ level0_chartes   │         │ analysis_pairs   │
│ ──────────────── │         │ ──────────────── │
│ • charte_id (PK) │         │ • pair_id (PK)   │
│ • gold_standard_id (FK)    │ • strategy_tag   │ ← Source vérité
│ • prompt_template│         │ • reaction_tag   │ ← Source vérité
└──────────────────┘         └──────────────────┘
         │                            │
         │ 1:N                        │ 1:N
         ↓                            ↓
┌──────────────────┐         ┌──────────────────┐
│level0_charte_tests│        │pair_gold_standards│
│ ──────────────── │         │ ──────────────── │
│ • test_id (PK)   │         │ • pair_id (FK)   │
│ • charte_id (FK) │         │ • gold_standard_id (FK)
│ • kappa          │         │ • version        │
│ • kappa_corrected│         │ • is_current     │
│ • disagreements (JSONB)    │ • reaction_gold_tag│
└──────────────────┘         └──────────────────┘
         │                            ↑
         │ 1:N                        │
         ↓                            │
┌──────────────────┐                 │
│   annotations    │                 │
│ ──────────────── │                 │
│ • annotation_id (PK)               │
│ • pair_id (FK)   │                 │
│ • test_id (FK)   │                 │
│ • reaction_tag   │ ← Résultat LLM │
└──────────────────┘                 │
         │                            │
         │ 1:N                        │
         ↓                            │
┌──────────────────┐                 │
│disagreement_     │                 │
│  validations     │─────────────────┘
│ ──────────────── │   Crée v2 si CAS A
│ • validation_id (PK)
│ • test_id (FK)   │
│ • pair_id (FK)   │
│ • validation_decision│
│ • corrected_tag  │
└──────────────────┘
```

---

**Document créé** : 2025-12-19  
**Version** : 1.0  
**Sprint** : Sprint 4 - Audit Architecture  
**Auteur** : Claude (Anthropic) & Thomas
