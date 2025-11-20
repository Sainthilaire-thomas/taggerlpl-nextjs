
# SESSION DE MIGRATION : h2_analysis_pairs → analysis_pairs

**Date de début** : 19 novembre 2025

**Date de complétion Phases 1-3** : 20 novembre 2025

**Durée Phases 1-3** : 2 sessions (~4h)

**Statut** : ✅ PHASES 1-3 TERMINÉES | 🔄 PHASE 4 À VENIR

**Priorité** : 🟢 VALIDATION TECHNIQUE RÉUSSIE

---

## 📊 RÉSUMÉ EXÉCUTIF

### ✅ Objectifs Atteints

**Phase 1 : Table `analysis_pairs`** - ✅ COMPLÈTE

* Table créée avec structure cible (Level 0, Level 1, Level 2)
* Contraintes et index opérationnels
* Contexte étendu avec JSONB (prev4/next4)

**Phase 2 : Fonction `refresh_analysis_pairs`** - ✅ COMPLÈTE

* Fonction SQL corrigée avec logique identique à `refresh_h2_analysis_pairs_v2`
* Utilisation correcte de `next_turn_tag` comme filtre
* **901 paires générées** (validation : 100% identiques à h2_analysis_pairs)
* Migration automatique des résultats algorithmiques (M1/M2/M3/Y)

**Phase 3 : Intégration automatique** - ✅ COMPLÈTE

* `calculateAllNextTurnTags` modifié pour appeler automatiquement `refresh_analysis_pairs`
* Workflow complet opérationnel : Annotation → Relations → Paires → UI
* Testé et validé en production (appel 312 : 5 tours mis à jour, 8 paires régénérées)

### 🎯 Validation Technique

```sql
-- Validation du nombre de paires
SELECT COUNT(*) FROM analysis_pairs;
-- Résultat : 901 ✅

-- Validation de l'identité avec h2_analysis_pairs
SELECT COUNT(*) FROM analysis_pairs ap
INNER JOIN h2_analysis_pairs h2 
  ON ap.conseiller_turn_id = h2.conseiller_turn_id 
  AND ap.client_turn_id = h2.client_turn_id;
-- Résultat : 901 ✅
```

### 📝 Workflow Automatisé Actuel

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ANNOTATION (TranscriptLPL)                               │
│    - Utilisateur annote/modifie un tag                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CALCUL RELATIONS (Bouton "Calculer Relations")           │
│    - calculateAllNextTurnTags(callId)                       │
│    - RPC: calculate_turn_relations(call_id)                 │
│    - UPDATE turntagged (prev4→next4 via LAG/LEAD)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. RÉGÉNÉRATION PAIRES (Automatique) ✨ NOUVEAU             │
│    - RPC: refresh_analysis_pairs(incremental, [callId])     │
│    - DELETE anciennes paires du call                        │
│    - INSERT nouvelles paires                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UTILISATION (AlgorithmLab) - ⚠️ MIGRATION EN ATTENTE     │
│    - useH2Data() → À MIGRER vers useAnalysisPairs()         │
│    - Algorithmes lisent/écrivent dans h2_analysis_pairs     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 PROBLÈME RÉSOLU : Les 42 paires en trop

### Diagnostic Initial

* `analysis_pairs` contenait 943 paires vs 901 attendues
* Différence de 42 paires

### Cause Identifiée

La fonction originale utilisait une **logique incorrecte** :

```sql
-- ❌ INCORRECT (version initiale)
FROM conseiller_turns ct
INNER JOIN client_turns clt ON ct.next_turn_id = clt.turn_id
WHERE clt.tag IN ('CLIENT POSITIF', 'CLIENT NEUTRE', 'CLIENT NEGATIF')
```

Cette logique créait des paires avec **n'importe quel tour client** ayant le bon tag, même si ce n'était pas le tour directement suivant le conseiller.

### Solution Appliquée

Utiliser `next_turn_tag` (colonne calculée par `calculate_turn_relations`) comme filtre :

```sql
-- ✅ CORRECT (version corrigée)
FROM turntagged tt
WHERE 
  lpl.family IN ('ENGAGEMENT', 'OUVERTURE', 'REFLET', 'EXPLICATION')
  AND tt.next1_turn_id IS NOT NULL
  AND tt.next_turn_tag IN ('CLIENT POSITIF', 'CLIENT NEUTRE', 'CLIENT NEGATIF')
```

Cette logique garantit que seules les paires **conseiller stratégique → réaction client immédiate** sont créées.

---

## 📚 DOCUMENTATION CRÉÉE

### 1. DOCUMENTATION_FLUX_COMPLET_ANALYSE.md

Documentation complète en français expliquant :

* **Phase 1 : Annotation manuelle** (sélection utilisateur, timestamps, verbatim)
* **Phase 2 : Calcul des relations temporelles** (LAG/LEAD, logique temporelle)
* **Phase 3 : Création des paires** (logique sémantique, filtrage)
* Clarification : `verbatim` = texte sélectionné, `next_turn_verbatim` = tour complet
* Exemple complet de bout en bout (8 tours → 3 paires)
* FAQ et points clés

### 2. refresh_analysis_pairs_FINAL.sql

Fonction SQL complète et validée, prête pour production.

---

## 💻 MODIFICATIONS DE CODE

### Fichier : `src/features/shared/context/TaggingDataContext.tsx`

**Fonction modifiée** : `calculateAllNextTurnTags`

**Avant** :

```typescript
const calculateAllNextTurnTags = useCallback(
  async (callId: string): Promise<number> => {
    // Appel RPC calculate_turn_relations uniquement
    const { data, error } = await supabase.rpc('calculate_turn_relations', {
      p_call_id: parseInt(callId, 10)
    });
  
    // Rafraîchissement état local
    await fetchTaggedTurns(callId);
    return result.updated_count;
  },
  [supabase, fetchTaggedTurns]
);
```

**Après** :

```typescript
const calculateAllNextTurnTags = useCallback(
  async (callId: string): Promise<number> => {
    // ÉTAPE 1 : Calculer les relations dans turntagged
    const { data: relationsData, error: relationsError } = await supabase.rpc(
      'calculate_turn_relations',
      { p_call_id: parseInt(callId, 10) }
    );
  
    // ÉTAPE 2 : Régénérer les paires pour ce call (NOUVEAU)
    if (relationsResult.updated_count > 0) {
      const { data: pairsData, error: pairsError } = await supabase.rpc(
        'refresh_analysis_pairs',
        {
          p_incremental: true,
          p_call_ids: [callId]
        }
      );
    }
  
    // ÉTAPE 3 : Rafraîchir l'état local
    await fetchTaggedTurns(callId);
    return relationsResult.updated_count;
  },
  [supabase, fetchTaggedTurns]
);
```

**Impact** : Les paires dans `analysis_pairs` sont maintenant **automatiquement synchronisées** avec les annotations.

---

## 🧪 TESTS & VALIDATION

### Test 1 : Génération initiale complète

```sql
DELETE FROM analysis_pairs;
SELECT * FROM refresh_analysis_pairs(p_incremental := FALSE);
```

**Résultat** : ✅ 901 paires créées

### Test 2 : Validation identité avec h2_analysis_pairs

```sql
SELECT COUNT(*) FROM analysis_pairs ap
INNER JOIN h2_analysis_pairs h2 
  ON ap.conseiller_turn_id = h2.conseiller_turn_id 
  AND ap.client_turn_id = h2.client_turn_id;
```

**Résultat** : ✅ 901 paires identiques

### Test 3 : Workflow automatique (appel 312)

**Action** : Ajout d'un tag HORS_TRAITEMENT au début de l'appel
**Logs console** :

```
=== CALCUL RELATIONS ÉTENDUES + REFRESH PAIRES ===
✅ 5 tours mis à jour dans turntagged
🔄 Régénération des paires analysis_pairs...
✅ 8 paires créées
♻️ 8 anciennes paires supprimées
```

**Résultat** : ✅ Workflow complet fonctionnel

### Test 4 : Validation des relations LAG/LEAD

**Observation** : L'ajout d'un tag au début décale les relations des 4-5 tours suivants

```sql
SELECT id, tag, start_time, prev1_turn_id, next1_turn_id 
FROM turntagged WHERE call_id = '312' ORDER BY start_time LIMIT 10;
```

**Résultat** : ✅ Relations cohérentes et correctement recalculées

---

## 📂 FICHIERS MODIFIÉS

### Code

* ✅ `src/features/shared/context/TaggingDataContext.tsx` (backup créé : `.tsx.backup`)

### Base de données

* ✅ Fonction SQL : `refresh_analysis_pairs(p_incremental, p_call_ids)`
* ✅ Table : `analysis_pairs` (901 paires)

### Documentation

* ✅ `DOCUMENTATION_FLUX_COMPLET_ANALYSE.md` (créé)
* ✅ `SESSION_MIGRATION_ANALYSIS_PAIRS_STATUS.md` (ce fichier)

---

## 🎯 PROCHAINES ÉTAPES - PHASE 4

### Objectif

Migrer AlgorithmLab pour utiliser `analysis_pairs` au lieu de `h2_analysis_pairs`

### Tâches à effectuer

#### 4.1 Identifier les hooks à migrer

```powershell
# Trouver tous les usages de h2_analysis_pairs
Get-ChildItem -Recurse -Include *.tsx,*.ts | 
  Select-String "h2_analysis_pairs|useH2Data" | 
  Select-Object Path, LineNumber, Line
```

#### 4.2 Créer le nouveau hook `useAnalysisPairs`

* Copier la logique de `useH2Data`
* Remplacer les références à `h2_analysis_pairs` par `analysis_pairs`
* Adapter les noms de colonnes (ex: `next_turn_tag_auto` → `y_predicted_tag`)

#### 4.3 Migrer progressivement

* Commencer par un composant simple (ex: dashboard Level 2)
* Tester la lecture des paires
* Migrer l'écriture des résultats algorithmiques
* Étendre aux autres composants

#### 4.4 Tests de non-régression

* Vérifier que les algorithmes produisent les mêmes résultats
* Valider l'affichage des métriques
* Tester les exports CSV/PDF

### Durée estimée

**2-3h** pour la Phase 4

---

## 🎓 APPRENTISSAGES CLÉS

### 1. Importance de `next_turn_tag`

Cette colonne dénormalisée est **essentielle** pour filtrer efficacement les paires pertinentes. Sans elle, on ne peut pas distinguer facilement un tour client de réaction d'un autre tour client.

### 2. Logique temporelle vs sémantique

* **Temporelle** (`calculate_turn_relations`) : Basée sur timestamps, sans filtre
* **Sémantique** (`refresh_analysis_pairs`) : Basée sur familles de tags, avec filtres

Ces deux logiques sont  **complémentaires** , pas redondantes.

### 3. Effet cascade LAG/LEAD

L'ajout d'un seul tag peut impacter les relations de 4-5 tours suivants à cause de la fenêtre glissante prev4→next4. C'est  **normal et attendu** .

### 4. Migration incrémentale

Toujours privilégier une migration progressive :

1. Créer la nouvelle structure en parallèle
2. Valider la cohérence des données
3. Migrer le code progressivement
4. Garder l'ancien système jusqu'à validation complète

---

## ✅ CHECKLIST FINALE PHASES 1-3

* [X] Table `analysis_pairs` créée avec contraintes
* [X] Fonction `refresh_analysis_pairs` opérationnelle
* [X] 901 paires validées (identiques à h2_analysis_pairs)
* [X] Intégration automatique dans `calculateAllNextTurnTags`
* [X] Tests en conditions réelles (appel 312)
* [X] Documentation complète du flux
* [X] Code commité et backupé

**Status** : ✅ PRÊT POUR PHASE 4

---

**Dernière mise à jour** : 20 novembre 2025

**Prochaine session** : Migration AlgorithmLab (Phase 4)
