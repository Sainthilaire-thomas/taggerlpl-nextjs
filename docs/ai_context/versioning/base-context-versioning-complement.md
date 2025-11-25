# TaggerLPL - Contexte de Base (Complément Versioning)

*Généré le 24 novembre 2025*
*Complément au base-context.md existant*

---

## 📦 Système de Versioning et Investigation

### Vue d'ensemble

Le projet implémente un système de versioning pour tracer l'évolution des algorithmes de classification (X, Y, M1, M2, M3) avec :
- **Versions validées** : Stockées dans `algorithm_version_registry`
- **Essais/Tests** : Stockés dans `test_runs` (à créer)
- **Investigations** : Annotations liées aux tests dans `investigation_annotations` (à créer)

### ⚠️ Point clé : 2 systèmes d'annotations distincts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ANNOTATIONS : 2 SYSTÈMES DISTINCTS                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1️⃣ ANNOTATIONS LÉGÈRES (existant - NE PAS MODIFIER)                   │
│     ─────────────────────────────────────────────────                   │
│     Table : analysis_pairs.annotations (JSONB)                          │
│     API : /api/turntagged/{turnId}/annotations                          │
│     Usage :                                                             │
│       • Notes rapides et ponctuelles                                   │
│       • Commentaires Level 0 (accord annotateurs)                      │
│       • Remarques générales sur un tour                                │
│     Caractéristiques :                                                 │
│       • Écrasable, pas d'historique                                    │
│       • Non lié à un test spécifique                                   │
│       • Format libre JSONB                                             │
│                                                                         │
│  2️⃣ ANNOTATIONS D'INVESTIGATION (à créer)                              │
│     ─────────────────────────────────────────────────                   │
│     Table : investigation_annotations (nouvelle table)                  │
│     API : Supabase client direct                                       │
│     Usage :                                                             │
│       • Observations lors de l'analyse des erreurs                     │
│       • Patterns d'erreurs récurrents                                  │
│       • Suggestions d'amélioration                                     │
│     Caractéristiques :                                                 │
│       • Historique complet (jamais écrasé)                             │
│       • Lié à un run_id (test spécifique)                              │
│       • Permet traçabilité : "cette observation → v1.2"                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tables de données

#### `analysis_pairs` (existante - COMPLÈTE, pas de modification)

La traçabilité algorithmes est déjà en place :

| Groupe | Colonnes | État |
|--------|----------|------|
| **Gold Standard** | `strategy_tag`, `reaction_tag`, `level0_gold_*` | ✅ |
| **Algo X** | `x_predicted_tag`, `x_confidence`, `x_algorithm_key`, `x_algorithm_version`, `x_computed_at`, `x_evidences`, `x_computation_time_ms` | ✅ |
| **Algo Y** | `y_predicted_tag`, `y_confidence`, `y_algorithm_key`, `y_algorithm_version`, `y_computed_at`, `y_evidences`, `y_computation_time_ms` | ✅ |
| **M1** | `m1_verb_density`, `m1_algorithm_key`, `m1_algorithm_version`, `m1_computed_at`, etc. | ✅ |
| **M2** | `m2_lexical_alignment`, `m2_algorithm_key`, `m2_algorithm_version`, `m2_computed_at`, etc. | ✅ |
| **M3** | `m3_cognitive_score`, `m3_algorithm_key`, `m3_algorithm_version`, `m3_computed_at`, etc. | ✅ |
| **Annotations légères** | `annotations` JSONB | ✅ Garder tel quel |

#### `algorithm_version_registry` (existante - à enrichir)

**Colonnes existantes** :
```
version_id, version_name, created_at, is_active, deprecated,
x_key, x_version, x_config,
y_key, y_version, y_config,
m1_key, m1_version, m1_config,
m2_key, m2_version, m2_config,
m3_key, m3_version, m3_config,
level1_metrics, description, changelog
```

**Colonnes à ajouter** :
```sql
status VARCHAR(20) DEFAULT 'validated'  -- draft, validated, baseline, deprecated
is_baseline BOOLEAN DEFAULT FALSE       -- Version de référence (1 par target)
git_commit_hash VARCHAR(40)             -- Lien vers code source
git_tag VARCHAR(50)                     -- Tag Git si existe
validation_sample_size INTEGER          -- Taille échantillon
validation_date TIMESTAMP               -- Date validation
```

#### `test_runs` (à créer)

```sql
run_id UUID PRIMARY KEY,
algorithm_key VARCHAR(100),
algorithm_version VARCHAR(20),
target VARCHAR(10),  -- X, Y, M1, M2, M3
sample_size INTEGER,
metrics JSONB,
error_analysis JSONB,
outcome VARCHAR(20),  -- pending, discarded, investigating, investigated, promoted
baseline_version_id VARCHAR(100),
baseline_diff JSONB,
investigation_notes TEXT,
investigation_summary JSONB,
investigation_started_at TIMESTAMP,
investigation_completed_at TIMESTAMP,
promoted_to_version_id VARCHAR(100),
parent_run_id UUID,
run_date TIMESTAMP,
run_duration_ms INTEGER,
created_by VARCHAR(100)
```

#### `investigation_annotations` (à créer)

```sql
id UUID PRIMARY KEY,
run_id UUID,  -- FK test_runs
pair_id INTEGER,
turn_id INTEGER,
annotation_type VARCHAR(50),  -- error_pattern, suggestion, note
content TEXT,
expected_tag VARCHAR(50),
predicted_tag VARCHAR(50),
verbatim_excerpt TEXT,
error_category VARCHAR(100),  -- REFLET_to_ENGAGEMENT, etc.
severity VARCHAR(20),  -- critical, minor, edge_case
actionable BOOLEAN,
created_at TIMESTAMP,
created_by VARCHAR(100)
```

#### `analysis_pairs` (colonnes traçabilité)

```sql
-- Colonnes existantes pour traçabilité
x_algorithm_key VARCHAR(100),
x_algorithm_version VARCHAR(20),
-- (idem y, m1, m2, m3)
```

---

## 🗂️ Structure des fichiers Level 1

### Architecture actuelle

```
src/features/phase3-analysis/level1-validation/
├── algorithms/                         # Algorithmes de classification
│   ├── classifiers/
│   │   ├── client/
│   │   │   └── RegexClientClassifier.ts
│   │   └── conseiller/
│   │       ├── RegexConseillerClassifier.ts
│   │       ├── OpenAIConseillerClassifier.ts
│   │       └── SpacyConseillerClassifier.ts
│   ├── mediators/
│   │   ├── M1Algorithms/
│   │   ├── M2Algorithms/
│   │   └── M3Algorithms/
│   └── shared/
│       ├── AlgorithmRegistry.ts
│       └── BaseClassifier.ts
│
└── ui/
    ├── hooks/
    │   ├── useLevel1Testing.ts        # Hook principal validation
    │   ├── useAnalysisPairs.ts        # Accès analysis_pairs
    │   ├── useAlgorithmVersioning.ts  # Gestion versions
    │   ├── usePostValidationVersioning.ts
    │   └── useLevel2Preview.ts        # 🆕 Preview H1/H2
    │
    ├── components/
    │   ├── AlgorithmLab/
    │   │   ├── Level1Interface.tsx    # Interface principale (onglets X/Y/M1/M2/M3)
    │   │   ├── RunPanel.tsx           # Panneau exécution
    │   │   ├── MetricsPanel.tsx       # Affichage métriques
    │   │   └── ResultsSample/         # Tableau résultats
    │   │       ├── ResultsPanel.tsx
    │   │       ├── components/
    │   │       │   ├── AnnotationList.tsx     # Annotations existantes
    │   │       │   ├── CommentDialog.tsx
    │   │       │   └── FineTuningDialog/
    │   │       └── hooks/
    │   │           └── useCommentManagement.ts
    │   │
    │   ├── algorithms/
    │   │   ├── shared/
    │   │   │   └── BaseAlgorithmTesting.tsx   # 🔄 Refactoré en Accordions
    │   │   ├── XClassifiers/
    │   │   │   └── XValidationInterface.tsx
    │   │   ├── YClassifiers/
    │   │   ├── M1Calculators/
    │   │   ├── M2Calculators/
    │   │   └── M3Calculators/
    │   │
    │   ├── shared/
    │   │   ├── AlgorithmSelector.tsx
    │   │   ├── VersionSelector.tsx
    │   │   └── VersionComparator.tsx
    │   │
    │   ├── Level2Preview/             # 🆕 Nouveau composant
    │   │   ├── index.ts
    │   │   └── Level2PreviewPanel.tsx
    │   │
    │   └── services/
    │       └── Level2PreviewService.ts  # 🆕 Calculs H1/H2
    │
    └── [À CRÉER]
        ├── TestDecision/              # Panel décision post-test
        │   ├── TestDecisionPanel.tsx
        │   └── index.ts
        ├── Investigation/             # Système investigation
        │   ├── InvestigationBanner.tsx
        │   ├── InvestigationSummaryDialog.tsx
        │   └── index.ts
        └── VersionValidation/         # Validation versions
            ├── VersionValidationDialog.tsx
            └── index.ts
```

---

## 🔄 Workflows

### Workflow Test → Décision

```
1. Sélectionner algorithme (dropdown)
2. Cliquer "LANCER TEST"
3. Résultats affichés avec comparaison baseline
4. Décision :
   - ❌ Rejeter → outcome='discarded'
   - 🔄 Investiguer → outcome='investigating' + mode investigation
   - ✅ Valider → créer version dans registry
```

### Workflow Investigation

```
1. Clic "À investiguer" → active mode
2. Bandeau investigation visible
3. Parcourir erreurs, ajouter annotations
4. Chaque annotation liée au run_id
5. Clic "Terminer" → synthèse
6. Choisir action : modifier code / retester / abandonner
```

### États des tests (outcome)

| Valeur | Description |
|--------|-------------|
| `pending` | Test vient d'être exécuté, pas de décision |
| `discarded` | Rejeté, pas concluant |
| `investigating` | En cours d'analyse des erreurs |
| `investigated` | Analyse terminée |
| `promoted` | Validé comme version officielle |

### Statuts des versions

| Valeur | Description |
|--------|-------------|
| `draft` | Version en cours de préparation |
| `validated` | Version validée, utilisable |
| `baseline` | Version de référence pour comparaisons |
| `deprecated` | Version obsolète, ne plus utiliser |

---

## 🎯 Composants clés

### `BaseAlgorithmTesting.tsx`

Interface principale de test avec Accordions :
1. 🎯 Sélection de l'Algorithme
2. ▶️ Exécution
3. 📊 Métriques Globales
4. 📋 Métriques par Tag
5. 🔀 Matrice de Confusion (X/Y)
6. ❌ Analyse des Erreurs
7. 📝 Échantillon de Résultats
8. 🚀 Prévisualisation Level 2
9. [À AJOUTER] 🎯 Décision post-test

### `Level2PreviewPanel.tsx`

Prévisualisation des indicateurs H1/H2 après validation :
- Readiness H1 (6 critères : Actions→Positif, etc.)
- Readiness H2 (couverture M1/M2/M3, corrélations)
- Score global de readiness
- Bouton "Passer à Level 2" si READY

### `AnnotationList.tsx`

Système d'annotations existant :
- Affichage contexte (-2/-1/0/+1)
- Ajout commentaires
- Stockage via `/api/turntagged/{turnId}/annotations`
- À enrichir avec `run_id` pour investigations

---

## 📊 Types principaux

### Types existants (dans `@/types/algorithm-lab`)

```typescript
// Variables cibles
type VariableTarget = 'X' | 'Y' | 'M1' | 'M2' | 'M3';
type TargetKind = VariableTarget;

// Résultat de validation
interface TVValidationResultCore {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: {
    pairId?: number;
    turnId?: number;
    // ...
  };
}

// Métriques de classification
interface ClassificationMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
  kappa?: number;
}
```

### Types à créer

```typescript
// Test run
interface TestRun {
  run_id: string;
  algorithm_key: string;
  algorithm_version?: string;
  target: VariableTarget;
  sample_size: number;
  metrics: ClassificationMetrics;
  outcome: 'pending' | 'discarded' | 'investigating' | 'investigated' | 'promoted';
  baseline_version_id?: string;
  baseline_diff?: BaselineDiff;
  // ...
}

// Investigation annotation
interface InvestigationAnnotation {
  id: string;
  run_id: string;
  pair_id: number;
  annotation_type: 'error_pattern' | 'suggestion' | 'note';
  content: string;
  error_category?: string;
  severity?: 'critical' | 'minor' | 'edge_case';
}

// Baseline diff
interface BaselineDiff {
  accuracy_delta: number;
  kappa_delta: number;
  f1_deltas: Record<string, number>;
  errors_delta: number;
  corrections: number;  // Erreurs corrigées
  regressions: number;  // Nouvelles erreurs
}
```

---

## 🔗 APIs et endpoints

### Existants (à conserver)

| Endpoint | Méthode | Usage | Impact |
|----------|---------|-------|--------|
| `/api/turntagged/{turnId}/annotations` | GET/POST | Annotations légères | ✅ Garder tel quel |
| Supabase `analysis_pairs` | CRUD | Données principales | ✅ Aucun changement |
| Supabase `algorithm_version_registry` | CRUD | Versions | ⚠️ Ajouter colonnes |

### À créer (via Supabase client)

| Table | Opérations | Notes |
|-------|------------|-------|
| `test_runs` | CRUD | Historique tests |
| `investigation_annotations` | CRUD | Annotations investigation |

### Distinction des APIs d'annotations

```typescript
// 1️⃣ Annotations légères - API REST existante
// Usage: notes rapides, Level 0
fetch(`/api/turntagged/${turnId}/annotations`, { method: 'POST', body: JSON.stringify({ note: "..." }) });

// 2️⃣ Annotations investigation - Supabase direct
// Usage: observations liées à un test
await supabase.from('investigation_annotations').insert({
  run_id: currentRunId,
  pair_id: 234,
  annotation_type: 'error_pattern',
  content: "Tours < 5 mots mal classés",
  error_category: 'REFLET_to_ENGAGEMENT'
});
```

---

## 📋 Checklist intégration

### Tables à créer/modifier

- [ ] Enrichir `algorithm_version_registry` (3 colonnes)
- [ ] Créer `test_runs`
- [ ] Créer `investigation_annotations`
- [ ] ~~Modifier `analysis_pairs`~~ → Déjà complet ✅

### Fichiers à créer

- [ ] `hooks/useTestRuns.ts`
- [ ] `hooks/useInvestigation.ts`
- [ ] `hooks/useVersionValidation.ts`
- [ ] `components/TestDecision/TestDecisionPanel.tsx`
- [ ] `components/Investigation/InvestigationBanner.tsx`
- [ ] `components/Investigation/InvestigationSummaryDialog.tsx`
- [ ] `components/VersionValidation/VersionValidationDialog.tsx`

### Fichiers à modifier

- [ ] `BaseAlgorithmTesting.tsx` (ajouter Accordéon décision)
- [ ] `AnnotationList.tsx` (enrichir avec mode investigation)
- [ ] `ResultsPanel.tsx` (indicateurs annotations investigation)

### Points d'attention

1. **Ne pas toucher à** `/api/turntagged/{turnId}/annotations` - c'est pour les annotations légères
2. **Utiliser Supabase direct** pour `investigation_annotations`
3. **Distinguer clairement** les 2 systèmes dans l'UI

---

*Ce document complète le base-context.md existant avec les informations spécifiques au système de versioning et investigation.*
