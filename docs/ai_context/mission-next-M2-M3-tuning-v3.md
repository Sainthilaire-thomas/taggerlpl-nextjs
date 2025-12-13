# 🎯 Mission: Tuning M2/M3 - Refonte des Algorithmes Médiateurs

*Date de création : 12 décembre 2025*  
*Statut : À démarrer (prochaine session)*  
*Dépendance : Suite de la mission Section C Cascade*

---

## 📤 Documents à uploader pour la prochaine session

| Document | Obligatoire | Contenu |
|----------|-------------|---------|
| `base-context.md` | ✅ Oui | Architecture globale, types, flux de données |
| `base-context-versioning-complement.md` | ✅ Oui | Système versioning, tables test_runs, workflows |
| `mission-next-M2-M3-tuning-v3.md` | ✅ Oui | Ce document (plan de la mission) |
| `mission-2025-12-12-level1-section-c-final.md` | 🟡 Optionnel | Conclusions M1 (pour rappel) |

---

## 📋 Contexte et objectif

### Pourquoi cette mission ?

La session du 12 décembre a révélé que :

1. **M1 n'est pas un médiateur indépendant** : Il est constitutif de X (les stratégies d'action SONT des stratégies à verbes d'action)

2. **M2 pose problème** :
   - Médiane = 0 (majorité des valeurs nulles)
   - r(M1, M2) = 0.000 (aucune corrélation avec M1)
   - EXPLICATION a PLUS d'alignement que ENGAGEMENT (contre-intuitif)
   - Baron-Kenny échoue : a = -0.01 (X ne prédit pas M2)

3. **Nouvelle hypothèse H2** :
   > L'effet X → Y est médiatisé par M2 (alignement) et M3 (charge cognitive), 
   > qui sont des CONSÉQUENCES de l'utilisation de verbes d'action.

### Objectif de la mission

Refondre M2 en **dimensions mesurables séparément** pour identifier quels types d'alignement sont influencés par les stratégies d'action.

---

## 🧠 Réflexion théorique : Types d'alignement linguistique

### Sens de l'alignement

**Direction mesurée : T1 (client) reprend T0 (conseiller)**

```
Conseiller (T0) utilise verbes d'action
        ↓
Active les neurones miroirs du client
        ↓
Client (T1) "s'aligne" / entre en résonance
        ↓
Réaction plus positive
```

### Dimensions d'alignement à mesurer

| Niveau | Dimension | Mesure | Description |
|--------|-----------|--------|-------------|
| **Lexical** | `lexical` | Jaccard lemmes | Mots communs (lemmatisés) |
| **Sémantique** | `semantic` | Cosine embeddings | Sens similaire même si mots différents |
| **Verbes** | `verb_repetition` | Proportion | Client reprend les verbes d'action du conseiller |
| **Pragmatique** | `pragmatic.acceptance` | Binaire | Client accepte l'action ("D'accord", "OK") |
| **Pragmatique** | `pragmatic.comprehension` | Binaire | Client montre qu'il comprend ("Je vois", "Ah ok") |
| **Pragmatique** | `pragmatic.cooperation` | Binaire | Client fournit l'info demandée |

### Patterns pragmatiques détaillés

| Pattern conseiller (T0) | Réponse alignée client (T1) | Dimension |
|-------------------------|----------------------------|-----------|
| **Action annoncée** ("Je vais vérifier...") | "D'accord", "OK", "Merci" | acceptance |
| **Question fermée** ("Avez-vous...?") | "Oui", "Non" + info | cooperation |
| **Question ouverte** ("Que souhaitez-vous...?") | Réponse développée | cooperation |
| **Instruction** ("Cliquez sur...") | "C'est fait", "Je vois" | cooperation |
| **Explication** ("Le système fonctionne...") | "Je comprends", "Ah ok" | comprehension |

---

## 🏗️ Architecture technique

### Nouvelle structure BDD (analysis_pairs)

**Migration : Supprimer les anciennes colonnes M2**

```sql
-- Supprimer anciennes colonnes
ALTER TABLE analysis_pairs 
  DROP COLUMN IF EXISTS m2_lexical_alignment,
  DROP COLUMN IF EXISTS m2_semantic_alignment,
  DROP COLUMN IF EXISTS m2_global_alignment,
  DROP COLUMN IF EXISTS m2_shared_terms;

-- Ajouter nouvelles colonnes JSONB
ALTER TABLE analysis_pairs 
  ADD COLUMN m2_scores JSONB,
  ADD COLUMN m2_details JSONB;

-- Garder : m2_algorithm_key, m2_algorithm_version, m2_computed_at
```

### Structure m2_scores

```json
{
  "lexical": 0.35,
  "semantic": 0.42,
  "verb_repetition": 0.25,
  "pragmatic": {
    "acceptance": 1,
    "comprehension": 0,
    "cooperation": 1
  },
  "global": 0.48
}
```

### Structure m2_details

```json
{
  "shared_lemmas": ["dossier", "vérifier"],
  "pragmatic_patterns": ["ACTION_ANNOUNCED → ACCEPTANCE"],
  "conseiller_verbs": ["vérifier", "envoyer"],
  "client_markers": ["d'accord", "merci"]
}
```

---

## 📊 Méthodologie de comparaison des dimensions

### Problème des échelles

| Dimension | Type | Échelle |
|-----------|------|---------|
| `lexical` | Continue | 0-1 |
| `semantic` | Continue | 0-1 |
| `verb_repetition` | Continue | 0-1 |
| `pragmatic.acceptance` | **Binaire** | 0 ou 1 |
| `pragmatic.comprehension` | **Binaire** | 0 ou 1 |
| `pragmatic.cooperation` | **Binaire** | 0 ou 1 |

### Solution : Comparer les tailles d'effet

Pour chaque dimension, calculer la **force de la relation** :

| Type dimension | Test X → M2 | Métrique | Test M2 → Y | Métrique |
|----------------|-------------|----------|-------------|----------|
| Continue | Corrélation | Pearson r | Corrélation | Pearson r |
| Binaire | Chi² | Cramér's V | Chi² | Cramér's V |

### Double comparaison : X vs M1

Pour distinguer l'effet de la **stratégie** vs l'effet des **verbes d'action** :

| Dimension | r(X → M2) | r(M1 → M2) | Interprétation |
|-----------|-----------|------------|----------------|
| Si r(M1→M2) > r(X→M2) | - | - | Effet spécifique des verbes d'action |
| Si r(X→M2) > r(M1→M2) | - | - | Effet de la stratégie globale |

### Tableau comparatif cible

| Dimension | r(X→M2) | p | r(M1→M2) | p | r(M2→Y) | p | Médiateur ? |
|-----------|---------|---|----------|---|---------|---|-------------|
| lexical | ? | ? | ? | ? | ? | ? | ? |
| semantic | ? | ? | ? | ? | ? | ? | ? |
| verb_repetition | ? | ? | ? | ? | ? | ? | ? |
| pragmatic.acceptance | ? | ? | ? | ? | ? | ? | ? |
| pragmatic.comprehension | ? | ? | ? | ? | ? | ? | ? |
| pragmatic.cooperation | ? | ? | ? | ? | ? | ? | ? |

### Critère de sélection

**Potentiel médiateur** = X → M2 significatif ET M2 → Y significatif

Classer par force combinée : `|r(X→M2)| × |r(M2→Y)|`

---

## 📝 Plan d'implémentation

### Phase 1 : Préparation - Audit et Unification (2-3h)

#### 1.1 Audit des deux affichages existants

**Objectif** : Pour tuner M2 et M3, il faut pouvoir examiner les paires en détail avec leur contexte.

##### Affichage 1 : Supervision (Phase 2)

**URL** : `/phase2-annotation/supervision`  
**Code** : `src/features/phase2-annotation/supervision/ui/components/SupervisionTable.tsx`

**Composants associés** :
```
src/features/phase2-annotation/supervision/ui/components/
├── index.ts
├── ProcessingModal.tsx
├── SupervisionFilters.tsx
├── SupervisionStats.tsx
├── SupervisionTable.tsx      ← Tableau principal
└── TaggingModal.tsx
```

**Utilise le composant partagé** :
```typescript
import TurnWithContext from "@/features/shared/ui/components/TurnWithContext";
```

**Fonctionnalités** :
- Affichage contextuel avec tours précédent/suivant
- Édition rapide des tags (QuickTagEditDialog)
- Accès au processing et à l'audio
- Filtres par call, speaker, tag

##### Affichage 2 : Échantillon de Résultats (Level 1)

**URL** : `/phase3-analysis/level1/algorithm-lab` (section "Échantillon de Résultats")  
**Code** : `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/`

**Structure** :
```
ResultsSample/
├── ResultsSample.tsx           # Composant principal
├── components/
│   ├── ResultsTableHeader.tsx  # En-tête avec métriques
│   ├── ResultsFilters.tsx      # Filtres (erreurs only, etc.)
│   ├── ResultsTableBody.tsx    # Corps du tableau (⚠️ ToneLine dupliqué ici)
│   ├── AnnotationList.tsx      # Liste annotations
│   └── FineTuningDialog/       # Export fine-tuning
├── hooks/
│   ├── useResultsFiltering.ts
│   └── useResultsPagination.ts
└── types.ts                    # TVValidationResult
```

**Problème identifié** : `ToneLine` est **dupliqué** dans `ResultsTableBody.tsx` au lieu d'utiliser le composant partagé `TurnWithContext`.

##### Composant partagé existant

**Chemin** : `src/features/shared/ui/components/TurnWithContext.tsx`

**Fonctionnalités** :
- `ToneLine` : Affiche un verbatim avec style (A/B/CURRENT)
- Gestion du contexte (tours précédent/suivant)
- Thème sombre/clair supporté
- Tooltip pour texte long

#### 1.2 Tâches d'audit

| # | Tâche | Durée |
|---|-------|-------|
| 1 | Ouvrir les deux interfaces côte à côte | 10min |
| 2 | Comparer les informations affichées (quels champs ?) | 20min |
| 3 | Comparer le format du contexte (combien de tours ?) | 15min |
| 4 | Comparer les fonctionnalités d'interaction (édition, filtres) | 15min |
| 5 | Documenter les forces/faiblesses de chaque approche | 20min |

#### 1.3 Unification du composant ToneLine

**Objectif** : Supprimer la duplication de code

**Étapes** :

1. **Vérifier la compatibilité des props** entre :
   - `ToneLine` dans `TurnWithContext.tsx` (partagé)
   - `ToneLine` dans `ResultsTableBody.tsx` (dupliqué)

2. **Créer un export dédié** si nécessaire :
   ```typescript
   // src/features/shared/ui/components/index.ts
   export { ToneLine } from './TurnWithContext';
   ```

3. **Modifier ResultsTableBody.tsx** :
   ```typescript
   // Supprimer la définition locale de ToneLine
   // Importer depuis le composant partagé
   import { ToneLine } from '@/features/shared/ui/components/TurnWithContext';
   ```

4. **Tester** que l'affichage reste identique

#### 1.4 Migration BDD

```sql
-- Script à exécuter dans Supabase SQL Editor

-- Supprimer anciennes colonnes M2
ALTER TABLE analysis_pairs 
  DROP COLUMN IF EXISTS m2_lexical_alignment,
  DROP COLUMN IF EXISTS m2_semantic_alignment,
  DROP COLUMN IF EXISTS m2_global_alignment,
  DROP COLUMN IF EXISTS m2_shared_terms;

-- Ajouter nouvelles colonnes JSONB
ALTER TABLE analysis_pairs 
  ADD COLUMN IF NOT EXISTS m2_scores JSONB,
  ADD COLUMN IF NOT EXISTS m2_details JSONB;

-- Vérifier la structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_pairs' AND column_name LIKE 'm2_%';
```

---

### Phase 2 : Nouvel algorithme M2 (3-4h)

1. **Créer `M2MultiDimensionCalculator.ts`**
   ```
   src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/
   └── M2MultiDimensionCalculator.ts
   ```

2. **Implémenter les dimensions**
   - `calculateLexical()` : Jaccard sur lemmes
   - `calculateSemantic()` : Optionnel (embeddings)
   - `calculateVerbRepetition()` : Verbes d'action repris
   - `calculatePragmatic()` : Patterns de réponse

3. **Mettre à jour les types TypeScript**
   - `AnalysisPair` avec `m2_scores: M2Scores`
   - Interface `M2Scores` et `M2Details`

---

### Phase 3 : Interface de visualisation (2h)

1. **Améliorer ResultsSample**
   - Afficher les dimensions M2 pour chaque paire
   - Highlight des termes partagés
   - Filtre par dimension problématique

2. **Nouveau panneau dans Section C**
   - Tableau comparatif des dimensions
   - Corrélations X→M2 et M1→M2
   - Identification des meilleures dimensions

---

### Phase 4 : Analyse statistique (2h)

1. **Pour chaque dimension :**
   - Calculer r(X → M2) et r(M1 → M2)
   - Calculer r(M2 → Y)
   - Identifier les dimensions avec potentiel

2. **Pour les meilleures dimensions :**
   - Baron-Kenny complet
   - Vérifier que b ≠ 0 (contrairement à M1)

---

## 📁 Fichiers clés à examiner

### Affichage - Fichiers à auditer

| Fichier | Rôle | Priorité |
|---------|------|----------|
| `src/features/shared/ui/components/TurnWithContext.tsx` | Composant partagé contexte | 🔴 Haute |
| `src/features/phase2-annotation/supervision/ui/components/SupervisionTable.tsx` | Tableau supervision | 🔴 Haute |
| `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/components/ResultsTableBody.tsx` | Corps tableau résultats (ToneLine dupliqué) | 🔴 Haute |
| `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsSample.tsx` | Composant principal échantillon | 🟡 Moyenne |

### Algorithmes M2 - Fichiers à auditer

| Fichier | Rôle |
|---------|------|
| `src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/M2LexicalAlignmentCalculator.ts` | Algo actuel Jaccard |
| `src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/M2SemanticAlignmentCalculator.ts` | Algo actuel sémantique |
| `src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/M2CompositeAlignmentCalculator.ts` | Algo actuel fusion |

### Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `M2MultiDimensionCalculator.ts` | Algorithme multi-dimensions |
| `M2DimensionComparisonPanel.tsx` | UI comparaison dimensions |
| `useM2DimensionAnalysis.ts` | Hook calcul corrélations |

### Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `analysis_pairs` (BDD) | Nouvelles colonnes JSONB |
| Types `AnalysisPair` | Ajouter `m2_scores`, `m2_details` |
| `ResultsTableBody.tsx` | Supprimer ToneLine dupliqué + afficher dimensions M2 |
| `H2ContributionSection.tsx` | Panneau comparaison dimensions |

---

## 🎯 Critères de succès

1. **Composant unifié** : `ToneLine` utilisé depuis le composant partagé partout
2. **Structure JSONB fonctionnelle** : m2_scores stocke toutes les dimensions
3. **6 dimensions calculées** : lexical, semantic, verb_repetition, 3 pragmatiques
4. **Tableau comparatif** : Corrélations X→M2, M1→M2, M2→Y pour chaque dimension
5. **Au moins 1 dimension avec potentiel médiateur** : r(X→M2) > 0.15 ET r(M2→Y) > 0.15

---

## 🔄 Système de Versioning (rappel)

### Contexte

Le projet dispose d'un système de versioning pour tracer l'évolution des algorithmes. Pour M2, on utilisera ce système pour :
- Comparer les différentes versions d'algorithmes M2
- Tracer les améliorations dimension par dimension
- Gérer les baselines

### Tables concernées

| Table | Usage pour M2 |
|-------|---------------|
| `algorithm_version_registry` | Stocker les versions validées de M2MultiDimensionCalculator |
| `test_runs` | Historique des tests M2 avec métriques |
| `investigation_annotations` | Notes sur les erreurs M2 à corriger |

### Workflow à suivre

```
1. Créer M2MultiDimensionCalculator v1.0.0
2. Lancer test → test_runs
3. Analyser résultats (corrélations par dimension)
4. Si améliorations → v1.1.0
5. Comparer avec baseline
6. Promouvoir si meilleur
```

### États des tests

| État | Description |
|------|-------------|
| `pending` | Test vient d'être exécuté |
| `investigating` | Analyse des erreurs en cours |
| `investigated` | Analyse terminée |
| `promoted` | Validé comme version officielle |
| `discarded` | Rejeté |

---

## 📚 Documents de référence

| Document | Contenu | Priorité |
|----------|---------|----------|
| `base-context.md` | Architecture globale du projet | 🔴 Obligatoire |
| `base-context-versioning-complement.md` | Système versioning, tables, workflows | 🔴 Obligatoire |
| `mission-2025-12-12-level1-section-c-final.md` | Conclusions sur M1 (pas un médiateur) | 🟡 Recommandé |

---

## 📊 Rappel des résultats précédents

### M1 (session 12 décembre)

```
M1 = constitutif de X, pas un médiateur indépendant
Baron-Kenny : b = -0.00 (même en binaire)
Conclusion : Les stratégies d'action SONT des stratégies à verbes d'action
```

### M2 (à corriger)

```
Problèmes actuels :
- Médiane = 0
- EXPLICATION (0.059) > ENGAGEMENT (0.039) ← contre-intuitif
- r(M1, M2) = 0.000
- Baron-Kenny : a = -0.01
```

---

*Prochaine session : À planifier*  
*Durée estimée : 8-10 heures (peut être découpé en 2-3 sessions)*
