# 🎯 Spécification Fonctionnelle : Système de Versioning et Investigation Algorithmique

*Version 1.1 - 24 novembre 2025*

---

## 0. Rationalisation : Existant vs À créer

### Ce qui existe DÉJÀ dans `analysis_pairs`

La table `analysis_pairs` contient déjà une infrastructure de traçabilité complète :

| Variable | Colonnes existantes |
|----------|---------------------|
| **X** | `x_algorithm_key`, `x_algorithm_version`, `x_computed_at`, `x_evidences`, `x_computation_time_ms`, `x_predicted_tag`, `x_confidence` |
| **Y** | `y_algorithm_key`, `y_algorithm_version`, `y_computed_at`, `y_evidences`, `y_computation_time_ms`, `y_predicted_tag`, `y_confidence` |
| **M1** | `m1_algorithm_key`, `m1_algorithm_version`, `m1_computed_at`, `m1_verb_density`, `m1_verb_count`, `m1_total_words`, `m1_action_verbs` |
| **M2** | `m2_algorithm_key`, `m2_algorithm_version`, `m2_computed_at`, `m2_lexical_alignment`, `m2_semantic_alignment`, `m2_global_alignment`, `m2_shared_terms` |
| **M3** | `m3_algorithm_key`, `m3_algorithm_version`, `m3_computed_at`, `m3_hesitation_count`, `m3_clarification_count`, `m3_cognitive_score`, `m3_cognitive_load`, `m3_patterns` |

**Colonne `annotations` JSONB** : Existe déjà pour les notes légères.

### Deux systèmes d'annotations distincts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ANNOTATIONS : 2 SYSTÈMES DISTINCTS                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1️⃣ ANNOTATIONS LÉGÈRES (existant - garder tel quel)                   │
│     → analysis_pairs.annotations JSONB                                  │
│     → Notes ponctuelles, Level 0, commentaires rapides                 │
│     → Pas d'historique, écrasable                                      │
│     → Ex: "Cas limite à revoir", "Accord annotateurs: 0.8"             │
│                                                                         │
│  2️⃣ ANNOTATIONS D'INVESTIGATION (à créer)                              │
│     → Table investigation_annotations (nouvelle)                        │
│     → Liées à un test_run spécifique (run_id)                          │
│     → Historique complet, jamais écrasées                              │
│     → Ex: "Pattern: tours < 5 mots mal classés en REFLET"              │
│     → Permet de tracer : "Cette observation a mené à v1.2"             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Synthèse : Quoi créer/modifier

| Élément | État | Action |
|---------|------|--------|
| `analysis_pairs` (traçabilité) | ✅ Complet | Rien à faire |
| `analysis_pairs.annotations` | ✅ Existe | Garder pour notes légères |
| `algorithm_version_registry` | ⚠️ Partiel | Ajouter `status`, `is_baseline`, `git_commit_hash` |
| `test_runs` | ❌ N'existe pas | **CRÉER** |
| `investigation_annotations` | ❌ N'existe pas | **CRÉER** |

---

## 1. Vision et Objectifs

### 1.1 Problématique actuelle

Le développement itératif des algorithmes de classification (X, Y, M1, M2, M3) souffre de plusieurs limitations :

| Problème | Impact |
|----------|--------|
| **Pas de traçabilité code ↔ version** | Impossible de retrouver le code exact d'une version passée |
| **Capture automatique = pollution** | Chaque test crée une entrée, la table est pleine de "brouillons" |
| **Données écrasées** | `analysis_pairs.x_algo_tag` est écrasé à chaque test |
| **Pas de workflow d'amélioration** | Difficile de savoir si v2 est meilleure que v1 |
| **Observations perdues** | Les annotations sur les erreurs ne sont pas liées aux tests |

### 1.2 Objectifs cibles

1. **Traçabilité complète** : Lier chaque version validée à son code source (commit Git)
2. **Distinction essai/version** : Séparer les tests exploratoires des versions officielles
3. **Workflow d'investigation** : Permettre l'analyse détaillée des erreurs avec capitalisation
4. **Comparaison baseline** : Toujours comparer un test à une référence stable
5. **Itération documentée** : Historique des améliorations avec parent/enfant

---

## 2. Architecture Cible

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTÈME DE VERSIONING                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │   CODE (Git)    │     │  REGISTRE (DB)  │     │ RÉSULTATS (DB)  │   │
│  ├─────────────────┤     ├─────────────────┤     ├─────────────────┤   │
│  │                 │     │                 │     │                 │   │
│  │ RegexXClassifier│────▶│ algorithm_      │     │ analysis_pairs  │   │
│  │  └─ v1.0.0     │     │ version_registry│     │  (données live) │   │
│  │  └─ v1.1.0     │     │                 │     │                 │   │
│  │  └─ v2.0.0     │     │ - version_id    │     │ test_runs       │   │
│  │                 │     │ - git_commit    │◄───▶│  (historique)   │   │
│  │ OpenAIXClassif  │     │ - is_baseline   │     │                 │   │
│  │  └─ v1.0.0     │     │ - is_active     │     │ investigation_  │   │
│  │                 │     │ - metrics       │     │ _annotations    │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Tables de données

#### Table 0 : `analysis_pairs` (existante - pas de modification)

La traçabilité est déjà complète. Colonnes clés :

| Groupe | Colonnes existantes |
|--------|---------------------|
| Gold Standard | `strategy_tag`, `reaction_tag`, `level0_gold_conseiller`, `level0_gold_client` |
| Algo X | `x_predicted_tag`, `x_confidence`, `x_algorithm_key`, `x_algorithm_version`, `x_computed_at` |
| Algo Y | `y_predicted_tag`, `y_confidence`, `y_algorithm_key`, `y_algorithm_version`, `y_computed_at` |
| M1/M2/M3 | Idem pattern (algorithm_key, version, computed_at) |
| Annotations légères | `annotations` JSONB - pour notes rapides, Level 0 |

**⚠️ Ne pas utiliser `annotations` JSONB pour les investigations** - utiliser `investigation_annotations` à la place.

#### Table 1 : `algorithm_version_registry` (existante - à enrichir)

Stocke uniquement les versions **officiellement validées**, pas les essais.

**Colonnes existantes** : `version_id`, `version_name`, `created_at`, `is_active`, `deprecated`, `x_key`, `x_version`, `x_config`, (idem y, m1, m2, m3), `level1_metrics`, `description`, `changelog`

**Colonnes à ajouter** :

| Colonne | Type | Description |
|---------|------|-------------|
| `status` | VARCHAR(20) | draft, validated, baseline, deprecated |
| `is_baseline` | BOOLEAN | Version de référence (1 par target) |
| `git_commit_hash` | VARCHAR(40) | Commit exact du code |
| `git_tag` | VARCHAR(50) | Tag Git si existe |
| `validation_sample_size` | INTEGER | Taille échantillon test |
| `validation_date` | TIMESTAMP | Date validation |

#### Table 2 : `test_runs` (à créer)

Stocke **tous** les essais, même non validés. C'est l'historique complet.

| Colonne | Type | Description |
|---------|------|-------------|
| `run_id` | UUID PK | Identifiant unique |
| `algorithm_key` | VARCHAR(100) | Algorithme testé |
| `algorithm_version` | VARCHAR(20) | Version testée |
| `target` | VARCHAR(10) | X, Y, M1, M2, M3 |
| `sample_size` | INTEGER | Nombre d'échantillons |
| `metrics` | JSONB | Résultats complets |
| `error_pairs` | JSONB | Liste des pair_id en erreur |
| `outcome` | VARCHAR(20) | pending, discarded, investigating, investigated, promoted |
| `baseline_version_id` | VARCHAR(100) FK | Version de comparaison |
| `baseline_diff` | JSONB | Deltas vs baseline |
| `investigation_notes` | TEXT | Notes globales |
| `investigation_summary` | JSONB | Synthèse patterns |
| `investigation_started_at` | TIMESTAMP | Début investigation |
| `investigation_completed_at` | TIMESTAMP | Fin investigation |
| `annotation_count` | INTEGER | Compteur annotations liées |
| `promoted_to_version_id` | VARCHAR(100) | Si validé en version |
| `parent_run_id` | UUID FK | Test parent (itérations) |
| `run_date` | TIMESTAMP | Date exécution |
| `run_duration_ms` | INTEGER | Durée |
| `created_by` | VARCHAR(100) | Auteur |

#### Table 3 : `investigation_annotations` (à créer)

Stocke les observations d'investigation avec **historique complet**. Distinct de `analysis_pairs.annotations`.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID PK | Identifiant |
| `run_id` | UUID FK | Lien vers test_runs |
| `pair_id` | INTEGER | Lien vers analysis_pairs |
| `turn_id` | INTEGER | Tour concerné (optionnel) |
| `annotation_type` | VARCHAR(50) | error_pattern, suggestion, note |
| `content` | TEXT | Contenu de l'annotation |
| `expected_tag` | VARCHAR(50) | Tag attendu |
| `predicted_tag` | VARCHAR(50) | Tag prédit |
| `verbatim_excerpt` | TEXT | Extrait du verbatim |
| `error_category` | VARCHAR(100) | "REFLET_to_ENGAGEMENT" |
| `severity` | VARCHAR(20) | critical, minor, edge_case |
| `actionable` | BOOLEAN | Action possible |
| `created_at` | TIMESTAMP | Date création |
| `created_by` | VARCHAR(100) | Auteur |

**Pourquoi une table séparée plutôt que JSONB ?**

1. **Historique** : Chaque annotation datée et liée à un run_id spécifique
2. **Traçabilité** : Voir l'évolution des observations v1.0 → v1.1 → v1.2
3. **Requêtes analytiques** : "Quels patterns reviennent le plus ?"
4. **Pas de pollution** : `analysis_pairs.annotations` reste léger

---

## 3. Workflows Utilisateur

### 3.1 Workflow principal : Test → Décision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CYCLE DE VIE D'UN TEST                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐                                                       │
│  │ DÉVELOPPEMENT│  Modifier le code de l'algorithme                    │
│  │   (Code)     │  dans src/features/.../algorithms/                   │
│  └──────┬───────┘                                                       │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐                                                       │
│  │    TEST      │  Exécuter via AlgorithmLab                           │
│  │ (AlgorithmLab)│  → Crée entrée test_runs (outcome='pending')        │
│  └──────┬───────┘                                                       │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    DÉCISION                                   │      │
│  │                                                               │      │
│  │  ┌─────────┐    ┌─────────────┐    ┌────────────────┐       │      │
│  │  │❌ REJETER│    │🔄 INVESTIGUER│    │✅ VALIDER      │       │      │
│  │  └────┬────┘    └──────┬──────┘    └───────┬────────┘       │      │
│  │       │                │                   │                 │      │
│  │       ▼                ▼                   ▼                 │      │
│  │  outcome=          outcome=            Créer version         │      │
│  │  'discarded'       'investigating'     dans registry         │      │
│  │                         │                   │                 │      │
│  │                         ▼                   ▼                 │      │
│  │                   [Workflow           outcome=                │      │
│  │                   Investigation]      'promoted'              │      │
│  │                         │                   │                 │      │
│  │                         ▼                   ▼                 │      │
│  │                    Retour à           Définir comme           │      │
│  │                    DÉVELOPPEMENT      baseline/active ?       │      │
│  │                                                               │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Workflow Investigation détaillé

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW INVESTIGATION                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: DÉMARRAGE                                                     │
│  ─────────────────                                                      │
│  • Clic "🔄 À investiguer"                                              │
│  • Création test_runs avec outcome='investigating'                      │
│  • Activation du mode investigation dans l'UI                          │
│  • Filtre automatique "Erreurs uniquement"                             │
│                                                                         │
│  PHASE 2: COLLECTE                                                      │
│  ─────────────────                                                      │
│  Pour chaque erreur intéressante :                                     │
│  • Clic sur ligne → Ouvre panneau annotation                           │
│  • Contexte affiché (-2/-1/0/+1)                                       │
│  • Sélection type : [Pattern] [Suggestion] [Note]                      │
│  • Écriture observation                                                │
│  • Enregistrement → Lié à run_id + pair_id                             │
│                                                                         │
│  PHASE 3: SYNTHÈSE                                                      │
│  ─────────────────                                                      │
│  • Vue groupée des erreurs par catégorie                               │
│  • Liste des annotations collectées                                    │
│  • Détection auto des patterns récurrents                              │
│  • Suggestions d'amélioration générées                                 │
│                                                                         │
│  PHASE 4: CONCLUSION                                                    │
│  ─────────────────                                                      │
│  • Dialog de synthèse avec :                                           │
│    - Résumé des annotations                                            │
│    - Patterns identifiés                                               │
│    - Champ "Conclusions"                                               │
│    - Choix action suivante                                             │
│  • Options :                                                           │
│    ○ Modifier le code et retester → parent_run_id                      │
│    ○ Demande plus de données gold                                      │
│    ○ Edge cases inhérents au corpus                                    │
│    ○ Abandonner cette piste                                            │
│  • Export possible vers notes/GitHub issues                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Workflow Comparaison de versions

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPARAISON DE VERSIONS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Sélection :                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Version A: [RegexXClassifier v1.0.0 (baseline) ▼]              │   │
│  │ Version B: [RegexXClassifier v1.1.0            ▼]              │   │
│  │                                                                 │   │
│  │ [Comparer les métriques] [Comparer les erreurs]                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Résultats :                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Métrique      │ v1.0.0  │ v1.1.0  │ Delta  │ Statut            │   │
│  │───────────────┼─────────┼─────────┼────────┼───────────────────│   │
│  │ Accuracy      │ 62.7%   │ 65.2%   │ +2.5%  │ ✅ Amélioration   │   │
│  │ Kappa         │ 0.42    │ 0.45    │ +0.03  │ ✅ Amélioration   │   │
│  │ F1 ENGAGEMENT │ 55.5%   │ 58.2%   │ +2.7%  │ ✅ Amélioration   │   │
│  │ F1 REFLET     │ 58.7%   │ 52.1%   │ -6.6%  │ ❌ Régression     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Analyse des différences :                                             │
│  • 23 erreurs corrigées (passées de faux → correct)                   │
│  • 8 nouvelles erreurs (passées de correct → faux)                    │
│  • [Voir les 23 corrections] [Voir les 8 régressions]                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Interface Utilisateur

### 4.1 Accordéon "Que faire de ce test ?"

Après exécution d'un test, afficher :

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ▼ 🎯 Décision post-test                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 Comparaison avec baseline (RegexXClassifier v1.0.0)                │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Accuracy: 65.2%  (+2.5% vs baseline)  ✅                       │    │
│  │ Kappa:    0.45   (+0.03 vs baseline)  ✅                       │    │
│  │ Erreurs:  314    (-22 vs baseline)    ✅                       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  Que faire de ce test ?                                                │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                │    │
│  │  [❌ Rejeter]     [🔄 Investiguer]     [✅ Valider]            │    │
│  │                                                                │    │
│  │  Pas concluant    Analyser les         Créer une version      │    │
│  │  On oublie        erreurs en détail    officielle             │    │
│  │                                                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Mode Investigation actif

Bandeau persistant quand investigation en cours :

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔍 INVESTIGATION EN COURS                                              │
│    ID: abc123 | Démarrée: il y a 12 min | Annotations: 6               │
│    [Voir synthèse] [Terminer investigation]                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Dialog de validation de version

Quand l'utilisateur clique "✅ Valider" :

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📦 Créer une version officielle                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Identifiant: RegexXClassifier-v1.2.0                                  │
│                                                                         │
│  Nom de la version:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Regex optimisé avec garde-fous REFLET                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  Changelog (vs v1.1.0):                                                │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ - Ajout garde-fou pour tours < 5 mots                         │    │
│  │ - Correction pattern questions rhétoriques                     │    │
│  │ - Amélioration détection REFLET_ACQ                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  Commit Git actuel: 5b45eb3                                            │
│  ☑ Lier cette version au commit                                       │
│                                                                         │
│  ☐ Définir comme BASELINE (référence pour comparaisons futures)       │
│  ☐ Activer en PRODUCTION (mettre à jour analysis_pairs)               │
│                                                                         │
│  [Annuler]                                    [Créer la version]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Règles métier

### 5.1 Gestion des baselines

- **Une seule baseline par target** (X, Y, M1, M2, M3)
- La baseline est la référence pour toutes les comparaisons
- Changer de baseline requiert confirmation explicite
- L'ancienne baseline passe en status='validated'

### 5.2 Gestion des versions actives

- **Une seule version active par (algorithm_key, target)**
- La version active est utilisée pour `analysis_pairs`
- Activer une version met à jour automatiquement les données

### 5.3 Nettoyage des test_runs

- Les runs avec outcome='discarded' peuvent être purgés après 30 jours
- Les runs avec outcome='investigating' sans activité depuis 7 jours → notification
- Les runs avec outcome='promoted' sont conservés indéfiniment

### 5.4 Chaînage des itérations

- Quand on retest après investigation, `parent_run_id` pointe vers le test précédent
- Permet de tracer l'historique des améliorations
- Visualisation possible en timeline

---

## 6. Intégration avec l'existant

### 6.1 Composants à réutiliser

| Composant existant | Réutilisation |
|-------------------|---------------|
| `AnnotationList` | Enrichir avec `run_id` et `annotation_type` pour mode investigation |
| `CommentDialog` | Ajouter sélecteur de type d'annotation |
| `ResultsPanel` | Ajouter indicateurs investigation |
| `VersionSelector` | Adapter pour afficher status/baseline |
| `VersionComparator` | Enrichir avec comparaison erreurs |

### 6.2 Données existantes (pas de modification)

| Table/Colonne | Usage actuel | Impact |
|---------------|--------------|--------|
| `analysis_pairs.x_algorithm_key/version/computed_at` | Traçabilité algo courant | ✅ Garder tel quel |
| `analysis_pairs.annotations` JSONB | Notes légères, Level 0 | ✅ Garder pour usage actuel |
| `algorithm_version_registry` | Versions validées | ⚠️ Enrichir avec status/baseline |

### 6.3 API existante

| Endpoint | Méthode | Usage | Impact |
|----------|---------|-------|--------|
| `/api/turntagged/{turnId}/annotations` | GET/POST | Annotations par tour | Garder pour annotations légères |
| Supabase `analysis_pairs` | CRUD | Données principales | Aucun changement |
| Supabase `algorithm_version_registry` | CRUD | Versions | Ajouter colonnes |

### 6.4 Distinction claire des systèmes d'annotations

```typescript
// 1️⃣ Annotations légères (existant) - via analysis_pairs.annotations JSONB
// Usage : notes rapides, Level 0, commentaires ponctuels
// API : /api/turntagged/{turnId}/annotations
// Caractéristique : écrasable, pas d'historique

// 2️⃣ Annotations d'investigation (nouveau) - via table investigation_annotations
// Usage : observations liées à un test, patterns d'erreurs
// API : Supabase direct sur investigation_annotations
// Caractéristique : historique complet, lié à run_id
```

---

## 7. Critères de succès

### 7.1 Fonctionnels

- [ ] Un test peut être rejeté, investigué ou validé
- [ ] Les annotations d'investigation sont liées au test
- [ ] Les versions validées sont traçables vers Git
- [ ] La comparaison baseline est automatique
- [ ] L'historique des itérations est visible

### 7.2 Ergonomiques

- [ ] Workflow en 3 clics max : test → décision → action
- [ ] Mode investigation clairement visible
- [ ] Synthèse des patterns auto-générée
- [ ] Export des notes possible

### 7.3 Techniques

- [ ] Pas de pollution de la table des versions
- [ ] Performance : chargement < 2s
- [ ] Données cohérentes entre tables

---

*Document de référence pour l'implémentation du système de versioning et investigation algorithmique.*
