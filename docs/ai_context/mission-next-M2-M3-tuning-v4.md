# 🎯 Mission: Tuning M2/M3 - Refonte des Algorithmes Médiateurs

*Date de création : 12 décembre 2025*  
*Mise à jour : 13 décembre 2025 (v4 - post audit)*  
*Statut : Phase 1 en cours*  
*Dépendance : Suite de la mission Section C Cascade*

---

## 📤 Documents à uploader pour les sessions

| Document | Obligatoire | Contenu |
|----------|-------------|---------|
| `base-context.md` | ✅ Oui | Architecture globale, types, flux de données |
| `base-context-versioning-complement.md` | ✅ Oui | Système versioning, tables test_runs, workflows |
| `mission-next-M2-M3-tuning-v4.md` | ✅ Oui | Ce document (plan de la mission) |
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

## 🎯 But final - Tableau de résultats Level 1 unifié

### Fonctionnalités cibles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TABLEAU RÉSULTATS LEVEL 1 - CIBLE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CONTEXTE CONVERSATIONNEL                                                │
│     • prev2, prev1, current, next1 avec ToneLine unifié                    │
│     • Affichage du speaker (CLIENT/CONSEILLER)                             │
│                                                                             │
│  2. COLONNES FIXES (résultats algo)                                         │
│     • Predicted vs Gold                                                     │
│     • Confiance                                                             │
│     • Temps de traitement                                                   │
│     • Annotations                                                           │
│                                                                             │
│  3. COLONNES DYNAMIQUES (selon targetKind)                                  │
│     • X → Famille, Évidences                                               │
│     • Y → Famille, Évidences                                               │
│     • M1 → Densité, #Verbes, Verbes trouvés                                │
│     • M2 → 6 dimensions JSONB (lexical, semantic, verb_rep, pragmatic×3)   │
│     • M3 → N dimensions JSONB (pauses, hésitations, charge cognitive)      │
│                                                                             │
│  4. ACTIONS                                                                 │
│     • 🔗 Lien vers l'appel complet (TranscriptLPL)           [HAUTE]       │
│     • ⚡ Édition rapide du tag gold (QuickTagEditDialog)      [MOYENNE]     │
│     • 📝 Annotation d'erreur (AnnotationList existant)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Compatibilité multi-variables

Le tableau doit rester compatible avec X, Y, M1, M2, M3 via le système `extraColumns` existant.

---

## 📊 Résultats de l'audit Phase 1.1 (13 décembre 2025)

### ToneLine - Duplication identifiée

| Fichier | Statut | Lignes |
|---------|--------|--------|
| `shared/ui/components/TurnWithContext.tsx` | ✅ Source (non exporté) | ~90 |
| `ResultsSample/components/ResultsTableBody.tsx` | ❌ Dupliqué inline | ~90 |
| `ResultsSample/components/ToneLine.tsx` | ❌ Fichier vide (0 bytes) | 0 |

**Action** : Exporter ToneLine depuis TurnWithContext, supprimer la duplication.

### Système extraColumns - Bien conçu mais M2 basique

```typescript
// État actuel de m2Cols (seulement 2 colonnes génériques)
const m2Cols: ExtraColumn[] = [
  { id: "m2-value", render: (r) => r.metadata?.m2?.value },
  { id: "m2-scale", render: (r) => r.metadata?.m2?.scale },
];
```

**Action** : Enrichir avec les 6 dimensions après migration JSONB.

### Structure AnalysisPair - Liens disponibles

```typescript
interface AnalysisPair {
  pair_id: number;
  call_id: number;                    // ✅ Pour lien vers l'appel
  conseiller_turn_id: number;         // ✅ Pour édition gold X
  client_turn_id: number;             // ✅ Pour édition gold Y
  
  // M2 actuel (colonnes plates) → À migrer vers JSONB
  m2_lexical_alignment?: number;
  m2_semantic_alignment?: number;
  m2_global_alignment?: number;
  m2_shared_terms?: string[];
  
  // M3 actuel (colonnes plates) → Futur: migrer vers JSONB
  m3_hesitation_count?: number;
  m3_clarification_count?: number;
  m3_cognitive_score?: number;
}
```

### Fichiers clés identifiés

| Fichier | Rôle |
|---------|------|
| `shared/ui/components/TurnWithContext.tsx` | Composant partagé contexte + ToneLine |
| `shared/ui/components/index.ts` | Barrel exports (TurnWithContext exporté) |
| `AlgorithmLab/extraColumns.tsx` | Fabrique colonnes dynamiques par targetKind |
| `AlgorithmLab/ResultsSample/ResultsPanel.tsx` | Orchestrateur du tableau |
| `AlgorithmLab/ResultsSample/components/ResultsTableBody.tsx` | Corps du tableau (ToneLine dupliqué) |
| `level1-validation/ui/hooks/useAnalysisPairs.ts` | Type AnalysisPair + hook fetch |

---

## 📝 Plan d'implémentation révisé

### Phase 1 : Préparation et Unification (session actuelle)

| # | Tâche | Priorité | Statut |
|---|-------|----------|--------|
| 1A | **Lien vers appel complet** | 🔴 Haute | À faire |
| 1B | **ToneLine unifié** (supprimer duplication) | 🔴 Haute | À faire |
| 1C | **Migration BDD M2 → JSONB** | 🔴 Haute | À faire |
| 1D | **Colonnes M2 dynamiques** (6 dimensions) | 🔴 Haute | À faire |
| 1E | Édition rapide tag gold | 🟡 Moyenne | Après 1A-1D |
| 1F | Préparation JSONB M3 | 🟢 Basse | Architecture only |

#### 1A. Lien vers appel complet

**Objectif** : Ajouter une colonne "Actions" avec lien vers TranscriptLPL

**Fichiers à modifier :**
- `ResultsTableBody.tsx` : Ajouter colonne Actions avec icône OpenInNew
- Route cible : `/phase2-annotation/tagging?call_id=${row.call_id}`

#### 1B. ToneLine unifié

**Objectif** : Supprimer la duplication de code (~90 lignes)

**Fichiers à modifier :**
1. `TurnWithContext.tsx` : Ajouter `export { ToneLine }`
2. `shared/ui/components/index.ts` : Ajouter export ToneLine
3. `ResultsTableBody.tsx` : Importer ToneLine au lieu de dupliquer
4. `ResultsSample/components/ToneLine.tsx` : Supprimer (fichier vide)

#### 1C. Migration BDD M2 → JSONB

```sql
-- Script Supabase SQL Editor
-- Conserver les anciennes colonnes pendant la migration

-- Ajouter nouvelles colonnes JSONB
ALTER TABLE analysis_pairs 
  ADD COLUMN IF NOT EXISTS m2_scores JSONB,
  ADD COLUMN IF NOT EXISTS m2_details JSONB;

-- Vérifier la structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_pairs' AND column_name LIKE 'm2_%';
```

#### 1D. Colonnes M2 dynamiques

**Fichiers à modifier :**
- `extraColumns.tsx` : Enrichir `buildM2Columns()` avec 6 dimensions
- `types.ts` : Ajouter interfaces M2Scores, M2Details

```typescript
// Structure cible m2_scores
interface M2Scores {
  lexical: number;           // Jaccard lemmes (0-1)
  semantic: number;          // Cosine embeddings (0-1)
  verb_repetition: number;   // Verbes d'action repris (0-1)
  pragmatic: {
    acceptance: 0 | 1;       // "D'accord", "OK"
    comprehension: 0 | 1;    // "Je vois", "Ah ok"
    cooperation: 0 | 1;      // Fournit l'info demandée
  };
  global: number;            // Score agrégé (0-1)
}

// Structure cible m2_details
interface M2Details {
  shared_lemmas: string[];
  pragmatic_patterns: string[];
  conseiller_verbs: string[];
  client_markers: string[];
}
```

---

### Phase 2 : Nouvel algorithme M2 (prochaine session)

1. **Créer `M2MultiDimensionCalculator.ts`**
2. **Implémenter les dimensions** : lexical, semantic, verb_repetition, pragmatic×3
3. **Mettre à jour les types TypeScript**

---

### Phase 3 : Interface de visualisation

1. **Enrichir ResultsSample** avec dimensions M2
2. **Panneau comparatif dans Section C**
3. **Filtres par dimension problématique**

---

### Phase 4 : Analyse statistique

1. **Pour chaque dimension** : r(X→M2), r(M1→M2), r(M2→Y)
2. **Baron-Kenny** sur les dimensions prometteuses
3. **Vérifier que b ≠ 0** (contrairement à M1)

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

---

## 🎯 Critères de succès

1. **ToneLine unifié** : Code dupliqué supprimé, import depuis shared
2. **Lien vers appel** : Clic ouvre TranscriptLPL avec le bon call_id
3. **Structure JSONB fonctionnelle** : m2_scores stocke toutes les dimensions
4. **6 dimensions affichées** : lexical, semantic, verb_repetition, 3 pragmatiques
5. **Tableau comparatif** : Corrélations X→M2, M1→M2, M2→Y pour chaque dimension
6. **Au moins 1 dimension avec potentiel médiateur** : r(X→M2) > 0.15 ET r(M2→Y) > 0.15

---

## 📚 Documents de référence

| Document | Contenu | Priorité |
|----------|---------|----------|
| `base-context.md` | Architecture globale du projet | 🔴 Obligatoire |
| `base-context-versioning-complement.md` | Système versioning, tables, workflows | 🔴 Obligatoire |
| `mission-2025-12-12-level1-section-c-final.md` | Conclusions sur M1 (pas un médiateur) | 🟡 Recommandé |

---

*Prochaine étape : Implémenter Phase 1A (lien vers appel) et Phase 1B (ToneLine unifié)*  
*Session actuelle : 13 décembre 2025*
