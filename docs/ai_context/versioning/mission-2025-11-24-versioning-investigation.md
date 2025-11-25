# 🎯 Mission: Implémentation Système Versioning et Investigation

*Session initiale : 24 novembre 2025*
*Statut : À démarrer*

---

## Objectif

Implémenter un système complet de versioning et investigation pour les algorithmes de classification, permettant :
1. La distinction claire entre essais exploratoires et versions validées
2. Un workflow d'investigation structuré avec capitalisation des observations
3. La traçabilité complète code ↔ version ↔ résultats
4. La comparaison systématique avec une baseline de référence

---

## Documents de référence

| Document | Contenu |
|----------|---------|
| `SPEC-VERSIONING-INVESTIGATION.md` | Spécification fonctionnelle cible |
| `base-context.md` | Contexte technique du projet |
| `ARCHITECTURE_ALGORITHMES_ANALYSIS_PAIRS.md` | Architecture actuelle |

---

## État des lieux (existant)

### ✅ Ce qui existe déjà et fonctionne

| Élément | Localisation | État | Action |
|---------|--------------|------|--------|
| **Traçabilité `analysis_pairs`** | Supabase | ✅ Complet | Rien à faire |
| ↳ `x_algorithm_key/version/computed_at` | | ✅ | |
| ↳ `y_algorithm_key/version/computed_at` | | ✅ | |
| ↳ `m1/m2/m3_algorithm_key/version/computed_at` | | ✅ | |
| ↳ `annotations` JSONB | | ✅ Existe | Garder pour notes légères |
| **`algorithm_version_registry`** | Supabase | ⚠️ Partiel | Ajouter 3 colonnes |
| **`VersionSelector`** | `ui/components/shared/` | ✅ Fonctionnel | Adapter affichage |
| **`VersionComparator`** | `ui/components/shared/` | ✅ Fonctionnel | Enrichir (Phase future) |
| **`AnnotationList` / `CommentDialog`** | `ResultsSample/components/` | ✅ Fonctionnel | Enrichir pour investigation |
| **API annotations** | `/api/turntagged/{turnId}/annotations` | ✅ Fonctionnel | Garder tel quel |
| **`BaseAlgorithmTesting`** | `algorithms/shared/` | ✅ Refactoré Accordions | Ajouter décision panel |
| **`Level2PreviewPanel`** | `Level2Preview/` | ✅ Nouveau | Rien à faire |

### ❌ Ce qui manque (à créer)

| Élément | Priorité | Effort estimé | Dépendances |
|---------|----------|---------------|-------------|
| **Table `test_runs`** | 🔴 Haute | 30min | Aucune |
| **Table `investigation_annotations`** | 🔴 Haute | 30min | test_runs |
| **Colonnes `algorithm_version_registry`** | 🔴 Haute | 15min | Aucune |
| **Hook `useTestRuns`** | 🔴 Haute | 2h | Tables créées |
| **Hook `useInvestigation`** | 🔴 Haute | 2h | useTestRuns |
| **Composant `TestDecisionPanel`** | 🔴 Haute | 2h | Hooks |
| **Composant `InvestigationBanner`** | 🟡 Moyenne | 1h | useInvestigation |
| **Composant `InvestigationSummaryDialog`** | 🟡 Moyenne | 2h | useInvestigation |
| **Enrichissement `AnnotationList`** | 🟡 Moyenne | 1h | useInvestigation |
| **Composant `VersionValidationDialog`** | 🟡 Moyenne | 2h | useTestRuns |
| **Enrichissement `VersionComparator`** | 🟢 Basse | 3h | Données test_runs |
| **Timeline itérations `parent_run_id`** | 🟢 Basse | 2h | test_runs remplie |

### 📝 Distinction importante : 2 systèmes d'annotations

```
┌────────────────────────────────────────────────────────────────────┐
│  ANNOTATIONS LÉGÈRES (existant)     │  ANNOTATIONS INVESTIGATION   │
│  analysis_pairs.annotations JSONB   │  Table investigation_annot.  │
├────────────────────────────────────────────────────────────────────┤
│  • Notes rapides                    │  • Liées à un run_id         │
│  • Level 0 (accord annotateurs)     │  • Historique complet        │
│  • Commentaires ponctuels           │  • Patterns d'erreurs        │
│  • Écrasable, pas d'historique      │  • Traçabilité améliorations │
│  • API: /api/turntagged/...         │  • API: Supabase direct      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Plan d'implémentation

### Phase 1 : Infrastructure Base de Données (1h)

**Objectif** : Créer les tables manquantes et enrichir l'existante

#### Étape 1.1 : Enrichir `algorithm_version_registry` (existante)

```sql
-- Ajouter colonnes manquantes
ALTER TABLE algorithm_version_registry 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'validated';

ALTER TABLE algorithm_version_registry 
ADD COLUMN IF NOT EXISTS is_baseline BOOLEAN DEFAULT FALSE;

ALTER TABLE algorithm_version_registry 
ADD COLUMN IF NOT EXISTS git_commit_hash VARCHAR(40);

ALTER TABLE algorithm_version_registry 
ADD COLUMN IF NOT EXISTS git_tag VARCHAR(50);

ALTER TABLE algorithm_version_registry 
ADD COLUMN IF NOT EXISTS validation_sample_size INTEGER;

ALTER TABLE algorithm_version_registry 
ADD COLUMN IF NOT EXISTS validation_date TIMESTAMP;

-- Commentaire pour documentation
COMMENT ON COLUMN algorithm_version_registry.status IS 'draft, validated, baseline, deprecated';
COMMENT ON COLUMN algorithm_version_registry.is_baseline IS 'Version de référence pour comparaisons (1 par target)';
```

#### Étape 1.2 : Créer table `test_runs`

```sql
CREATE TABLE test_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    algorithm_key VARCHAR(100) NOT NULL,
    algorithm_version VARCHAR(20),
    target VARCHAR(10) NOT NULL,
    sample_size INTEGER NOT NULL,
    metrics JSONB NOT NULL,
    error_pairs JSONB,  -- Liste des pair_id en erreur
    outcome VARCHAR(20) DEFAULT 'pending',
    baseline_version_id VARCHAR(100),
    baseline_diff JSONB,
    investigation_notes TEXT,
    investigation_summary JSONB,
    investigation_started_at TIMESTAMP,
    investigation_completed_at TIMESTAMP,
    annotation_count INTEGER DEFAULT 0,
    promoted_to_version_id VARCHAR(100),
    parent_run_id UUID,
    run_date TIMESTAMP DEFAULT NOW(),
    run_duration_ms INTEGER,
    created_by VARCHAR(100),
    
    FOREIGN KEY (parent_run_id) 
        REFERENCES test_runs(run_id) ON DELETE SET NULL
);

CREATE INDEX idx_tr_algorithm ON test_runs(algorithm_key);
CREATE INDEX idx_tr_target ON test_runs(target);
CREATE INDEX idx_tr_outcome ON test_runs(outcome);
CREATE INDEX idx_tr_date ON test_runs(run_date DESC);

COMMENT ON TABLE test_runs IS 'Historique de tous les tests algorithmes (essais + validés)';
COMMENT ON COLUMN test_runs.outcome IS 'pending, discarded, investigating, investigated, promoted';
```

#### Étape 1.3 : Créer table `investigation_annotations`

```sql
CREATE TABLE investigation_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
    pair_id INTEGER,  -- Référence analysis_pairs.pair_id
    turn_id INTEGER,
    annotation_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    expected_tag VARCHAR(50),
    predicted_tag VARCHAR(50),
    verbatim_excerpt TEXT,
    error_category VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'minor',
    actionable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100)
);

CREATE INDEX idx_ia_run ON investigation_annotations(run_id);
CREATE INDEX idx_ia_pair ON investigation_annotations(pair_id);
CREATE INDEX idx_ia_error_cat ON investigation_annotations(error_category);

COMMENT ON TABLE investigation_annotations IS 'Annotations liées aux investigations (historisées, distinctes de analysis_pairs.annotations)';
COMMENT ON COLUMN investigation_annotations.annotation_type IS 'error_pattern, suggestion, note';
COMMENT ON COLUMN investigation_annotations.severity IS 'critical, minor, edge_case';
```

#### ⚠️ Note importante

**NE PAS modifier `analysis_pairs`** - la traçabilité existe déjà :
- `x_algorithm_key`, `x_algorithm_version`, `x_computed_at` ✅
- `annotations` JSONB pour notes légères ✅

#### Critères de validation Phase 1

- [ ] 3 colonnes ajoutées à `algorithm_version_registry`
- [ ] Table `test_runs` créée avec index
- [ ] Table `investigation_annotations` créée avec index
- [ ] FK et contraintes fonctionnelles
- [ ] Test insertion/lecture OK sur les 2 nouvelles tables

---

### Phase 2 : Hooks de données (4h)

**Objectif** : Créer les hooks React pour manipuler les données

#### Étape 2.1 : Hook `useTestRuns`

**Fichier** : `src/features/phase3-analysis/level1-validation/ui/hooks/useTestRuns.ts`

**Fonctionnalités** :
- `createTestRun(algorithmKey, metrics, sampleSize)` → run_id
- `updateOutcome(runId, outcome)`
- `getRunsForAlgorithm(algorithmKey, limit)`
- `getBaselineForTarget(target)` → version baseline
- `calculateBaselineDiff(runId, baselineVersionId)`

#### Étape 2.2 : Hook `useInvestigation`

**Fichier** : `src/features/phase3-analysis/level1-validation/ui/hooks/useInvestigation.ts`

**Fonctionnalités** :
- `startInvestigation(runId)` → active le mode
- `addAnnotation(runId, pairId, annotation)`
- `getAnnotationsForRun(runId)`
- `completeInvestigation(runId, summary)`
- `currentInvestigationId` (state global)

#### Étape 2.3 : Hook `useVersionValidation`

**Fichier** : `src/features/phase3-analysis/level1-validation/ui/hooks/useVersionValidation.ts`

**Fonctionnalités** :
- `promoteToVersion(runId, versionData)`
- `setAsBaseline(versionId)`
- `activateVersion(versionId)`
- `getCurrentGitCommit()` (appel API Git)

#### Critères de validation Phase 2

- [ ] Hooks compilent sans erreur
- [ ] CRUD test_runs fonctionne
- [ ] CRUD investigation_annotations fonctionne
- [ ] État investigation synchronisé

---

### Phase 3 : Composants UI (6h)

**Objectif** : Créer les composants d'interface

#### Étape 3.1 : `TestDecisionPanel`

**Fichier** : `src/features/.../components/TestDecision/TestDecisionPanel.tsx`

**Props** :
- `runId: string`
- `metrics: Metrics`
- `baselineDiff: BaselineDiff`
- `onDecision: (outcome: 'discarded' | 'investigating' | 'promoted') => void`

**Affichage** :
- Comparaison vs baseline
- 3 boutons de décision
- Intégré dans BaseAlgorithmTesting (nouvel Accordéon)

#### Étape 3.2 : `InvestigationBanner`

**Fichier** : `src/features/.../components/Investigation/InvestigationBanner.tsx`

**Props** :
- `investigationId: string`
- `startedAt: Date`
- `annotationCount: number`
- `onViewSummary: () => void`
- `onComplete: () => void`

**Affichage** :
- Bandeau persistant en haut de l'écran
- Compteur d'annotations en temps réel

#### Étape 3.3 : `InvestigationSummaryDialog`

**Fichier** : `src/features/.../components/Investigation/InvestigationSummaryDialog.tsx`

**Props** :
- `runId: string`
- `annotations: Annotation[]`
- `open: boolean`
- `onClose: () => void`
- `onComplete: (summary: Summary) => void`

**Affichage** :
- Liste des annotations groupées par catégorie
- Détection auto des patterns
- Champ conclusions
- Choix action suivante

#### Étape 3.4 : `VersionValidationDialog`

**Fichier** : `src/features/.../components/VersionValidation/VersionValidationDialog.tsx`

**Props** :
- `runId: string`
- `algorithmKey: string`
- `metrics: Metrics`
- `open: boolean`
- `onClose: () => void`
- `onValidate: (versionData) => void`

**Affichage** :
- Formulaire nom/changelog
- Affichage commit Git actuel
- Checkboxes baseline/active

#### Étape 3.5 : Enrichir `AnnotationList`

**Modifications** :
- Ajouter prop `investigationRunId?: string`
- Ajouter sélecteur type annotation
- Lier au run_id si investigation active
- Ajouter champ `error_category` auto

#### Critères de validation Phase 3

- [ ] Tous les composants rendent sans erreur
- [ ] Workflow Rejeter fonctionnel
- [ ] Workflow Investiguer fonctionnel
- [ ] Workflow Valider fonctionnel
- [ ] Annotations liées aux investigations

---

### Phase 4 : Intégration dans BaseAlgorithmTesting (3h)

**Objectif** : Connecter tout dans l'interface principale

#### Modifications à `BaseAlgorithmTesting.tsx`

1. **Après `runValidation()`** :
   - Créer entrée `test_runs` avec outcome='pending'
   - Calculer baseline_diff automatiquement
   - Afficher `TestDecisionPanel`

2. **Nouvel Accordéon "🎯 Décision post-test"** :
   - Visible seulement si résultats présents
   - Contient `TestDecisionPanel`

3. **Gestion état investigation** :
   - Si outcome='investigating', afficher `InvestigationBanner`
   - Passer `investigationRunId` aux composants enfants

4. **Enrichir `ResultsPanel`** :
   - Indicateur visuel si ligne a des annotations investigation
   - Compteur annotations par ligne

#### Critères de validation Phase 4

- [ ] Workflow complet fonctionne
- [ ] Pas de régression sur fonctionnalités existantes
- [ ] Performance acceptable (< 2s chargement)

---

### Phase 5 : Polish et documentation (2h)

#### Tâches

- [ ] Tests manuels workflow complet
- [ ] Correction bugs éventuels
- [ ] Documentation utilisateur (guide rapide)
- [ ] Mise à jour `base-context.md`
- [ ] Commit et push

---

## Fichiers à créer/modifier

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `hooks/useTestRuns.ts` | Hook gestion test_runs |
| `hooks/useInvestigation.ts` | Hook gestion investigations |
| `hooks/useVersionValidation.ts` | Hook validation versions |
| `components/TestDecision/TestDecisionPanel.tsx` | Panel décision post-test |
| `components/TestDecision/index.ts` | Export |
| `components/Investigation/InvestigationBanner.tsx` | Bandeau investigation |
| `components/Investigation/InvestigationSummaryDialog.tsx` | Dialog synthèse |
| `components/Investigation/index.ts` | Export |
| `components/VersionValidation/VersionValidationDialog.tsx` | Dialog validation |
| `components/VersionValidation/index.ts` | Export |

### Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `BaseAlgorithmTesting.tsx` | Intégrer TestDecisionPanel, InvestigationBanner |
| `ResultsSample/components/AnnotationList.tsx` | Ajouter props investigation |
| `ResultsPanel.tsx` | Indicateurs annotations |
| `shared/VersionComparator.tsx` | (Phase future) Comparaison erreurs |

---

## Estimation totale

| Phase | Durée estimée | Notes |
|-------|---------------|-------|
| Phase 1 : BDD | 1h | Réduit car analysis_pairs OK |
| Phase 2 : Hooks | 4h | Inchangé |
| Phase 3 : Composants | 6h | Inchangé |
| Phase 4 : Intégration | 3h | Inchangé |
| Phase 5 : Polish | 2h | Inchangé |
| **Total** | **16h** (~3 sessions) | Réduit de 1h vs estimation initiale |

### Gains par rapport à l'estimation initiale

- ❌ ~~Ajouter colonnes traçabilité analysis_pairs~~ → Existe déjà
- ❌ ~~Créer FK vers analysis_pairs~~ → Non nécessaire (pair_id suffit)
- ✅ Focus sur les 2 nouvelles tables uniquement

---

## Critères de succès globaux

### Fonctionnels

- [ ] Un test peut être rejeté en 1 clic
- [ ] Le mode investigation capture les annotations
- [ ] Une version peut être créée avec lien Git
- [ ] La comparaison baseline est automatique

### Techniques

- [ ] Zéro erreur TypeScript
- [ ] Build production OK
- [ ] Données cohérentes entre tables

### Ergonomiques

- [ ] Workflow intuitif (< 3 clics)
- [ ] Mode investigation clairement visible
- [ ] Feedback utilisateur à chaque action

---

## Notes pour démarrage

### Prérequis

1. Accès Supabase pour créer les tables
2. Git configuré pour récupérer le commit actuel
3. `base-context.md` à jour

### Première session suggérée

1. Créer les tables (Phase 1)
2. Implémenter `useTestRuns` (Phase 2.1)
3. Créer `TestDecisionPanel` basique (Phase 3.1)
4. Intégrer dans `BaseAlgorithmTesting` (Phase 4 partiel)
5. Tester workflow "Rejeter"

---

*Mission créée le 24 novembre 2025*
*Prochaine mise à jour : après première session d'implémentation*
