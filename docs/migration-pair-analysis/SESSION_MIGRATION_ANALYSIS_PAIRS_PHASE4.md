# SESSION DE MIGRATION : analysis_pairs - PHASE 4

**Date de début Phase 4** : 20 novembre 2025 (après-midi)  
**Durée** : ~3h  
**Statut** : ⚠️ EN COURS - PROBLÈME PERFORMANCE CRITIQUE IDENTIFIÉ  
**Priorité** : 🔴 URGENT - Architecture à revoir

---

## 📊 CONTEXTE - OÙ ON EN EST

### ✅ Phases 1-3 Complètes (voir SESSION_MIGRATION_ANALYSIS_PAIRS_FINAL.md)

- Table `analysis_pairs` créée et opérationnelle (901 paires)
- Fonction `refresh_analysis_pairs` fonctionnelle
- Workflow automatique TranscriptLPL → analysis_pairs opérationnel

### 🔄 Phase 4 : Migration AlgorithmLab

**Objectif** : Migrer l'AlgorithmLab pour utiliser `analysis_pairs` au lieu de `h2_analysis_pairs`

**Progression** :
- ✅ Hook `useAnalysisPairs` créé
- ✅ Lecture depuis `analysis_pairs` fonctionnelle
- ✅ Transmission du `pairId` dans les métadonnées corrigée
- ✅ Noms de colonnes X/Y corrigés
- ✅ RLS policies créées (SELECT + UPDATE pour authenticated)
- ✅ Contrainte CHECK `computation_status` corrigée ('complete' au lieu de 'computed')
- ⚠️ **BLOQUANT** : Performance catastrophique lors de l'écriture des résultats

---

## 🔴 PROBLÈME CRITIQUE IDENTIFIÉ

### Symptôme

Lors de l'exécution d'un algorithme (ex: RegexXClassifier) :
- Les 901 paires sont calculées ✅
- L'écriture en DB prend **plusieurs minutes** ❌
- **901 requêtes HTTP UPDATE individuelles** au lieu d'une seule requête bulk

### Cause Racine

**Architecture inadaptée** héritée de l'ancien système :

```typescript
// ❌ ACTUEL : 901 UPDATE individuels
for (const result of results) {
  await supabase
    .from('analysis_pairs')
    .update(updateData)
    .eq('pair_id', pairId);
}
```

**Temps d'exécution** : 901 × 100ms latence = **~90 secondes**

### Ancien Système (h2_analysis_pairs)

- Ne faisait **PAS** d'UPDATE en base pendant les tests
- Gardait tout en mémoire
- Sauvegarde uniquement à la demande

---

## 💡 SOLUTION PROPOSÉE

### Architecture Optimale (Recommandée)

**Principe** : Découpler calcul et sauvegarde

#### Étape 1 : Calculs locaux (en mémoire)

```typescript
const validateAlgorithm = async (algorithmName, sampleSize) => {
  // 1. Calculer les 901 résultats (local)
  const results = await runAlgorithm(...);
  
  // 2. Calculer les métriques (local)
  const metrics = calculateMetrics(results);
  
  // 3. Afficher à l'utilisateur
  // PAS de sauvegarde automatique !
  
  return { results, metrics };
}
```

#### Étape 2 : Sauvegarde optionnelle (RPC bulk)

```typescript
const saveValidationResults = async (results, algorithmName) => {
  // Appel RPC PostgreSQL qui fait tout côté serveur
  const { data, error } = await supabase.rpc(
    'bulk_update_algorithm_results',
    {
      pairs_data: results.map(r => ({
        pair_id: r.metadata.pairId,
        x_predicted_tag: r.predicted,
        x_confidence: r.confidence,
        // ...
      })),
      algorithm_name: algorithmName,
      algorithm_version: version
    }
  );
}
```

#### Étape 3 : Fonction RPC PostgreSQL

```sql
CREATE OR REPLACE FUNCTION bulk_update_algorithm_results(
  pairs_data jsonb,
  algorithm_name text,
  algorithm_version text
)
RETURNS json AS $$
DECLARE
  updated_count int := 0;
  pair_record jsonb;
BEGIN
  -- Itérer sur le tableau JSON
  FOR pair_record IN SELECT * FROM jsonb_array_elements(pairs_data)
  LOOP
    UPDATE analysis_pairs
    SET 
      x_predicted_tag = (pair_record->>'x_predicted_tag'),
      x_confidence = (pair_record->>'x_confidence')::numeric,
      x_algorithm_key = algorithm_name,
      x_algorithm_version = algorithm_version,
      x_computed_at = now(),
      computation_status = 'complete',
      updated_at = now()
    WHERE pair_id = (pair_record->>'pair_id')::bigint;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'updated', updated_count
  );
END;
$$ LANGUAGE plpgsql;
```

**Avantages** :
- ⚡ Ultra-rapide (< 1 seconde pour 901 paires)
- 🧪 Tests rapides sans polluer la DB
- 💾 Sauvegarde uniquement si résultats satisfaisants
- 🎯 Architecture scientifique correcte

---

## 📝 FICHIERS MODIFIÉS AUJOURD'HUI

### Fichiers principaux

1. **src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts**
   - ❌ Ligne 199-200 : Colonnes génériques supprimées
   - ✅ Ligne 223-229 : Noms colonnes X/Y corrigés
   - ✅ Ligne 185-276 : Fonction `updateH2WithResults` (mais TROP LENTE)
   - ⚠️ **À MODIFIER** : Découpler calcul/sauvegarde

2. **src/features/phase3-analysis/level1-validation/ui/hooks/normalizeUniversalToTV.ts**
   - ✅ Ligne 36 : `pairId` ajouté dans `baseMd`

3. **Base de données Supabase**
   - ✅ RLS policies créées pour `analysis_pairs`
   - ✅ Contrainte CHECK `computation_status` validée

### Problèmes résolus

| Problème | Solution | Status |
|----------|----------|--------|
| pairId manquant | Ajout dans normalizeUniversalToTV.ts | ✅ |
| Colonnes computed_at/algorithm_version | Suppression (n'existent pas) | ✅ |
| Colonnes X et Y mélangées | Séparation X / Y | ✅ |
| RLS bloque UPDATE | Policies créées | ✅ |
| CHECK constraint violated | 'computed' → 'complete' | ✅ |
| 901 UPDATE individuels | **⚠️ EN ATTENTE DE SOLUTION** | ❌ |

---

## 🎯 PLAN D'ACTION - PROCHAINE SESSION (PRIORITÉ)

### ⭐ Option B : Bulk upsert simple (À FAIRE EN PREMIER - 30 min)

**Pourquoi commencer par Option B ?**
- Plus rapide à implémenter (30 min vs 2h)
- Garde l'architecture actuelle (moins de risques)
- Résout immédiatement le problème de performance
- On peut passer à Option A plus tard si besoin

#### Task 1 : Modifier updateH2WithResults pour utiliser .upsert() (20 min)

**Fichier** : `src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts`

**Fonction à remplacer** : Lignes 183-276

**ANCIEN CODE (901 UPDATE individuels)** :
```typescript
const updateH2WithResults = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string
): Promise<{ success: number; errors: number; total: number }> => {
  console.log(`📝 Mise à jour analysis_pairs : ${results.length} paires`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    const pairId = getH2Property(result.metadata, 'pairId');
    
    if (!pairId) {
      console.warn('⚠️ Pas de pairId:', result);
      errorCount++;
      continue;
    }

    const updateData: any = {};

    try {
      // Remplir selon l'algo
      if (algorithmName.includes('M1')) {
        updateData.m1_verb_density = getH2Property(result.metadata, 'm1_verb_density');
        updateData.m1_verb_count = getH2Property(result.metadata, 'm1_verb_count');
        updateData.m1_total_words = getH2Property(result.metadata, 'm1_total_words');
        updateData.m1_action_verbs = getH2Property(result.metadata, 'm1_action_verbs');
        updateData.computation_status = 'complete';
      } else if (algorithmName.includes('M2')) {
        // ...
      } else if (algorithmName.includes('M3')) {
        // ...
      } else if (algorithmName.includes('X')) {
        updateData.x_predicted_tag = result.predicted;
        updateData.x_confidence = result.confidence;
        updateData.x_algorithm_key = algorithmName;
        updateData.x_algorithm_version = algorithmVersion;
        updateData.x_computed_at = new Date().toISOString();
        updateData.computation_status = 'complete';
      }

      // ❌ PROBLÈME : 901 UPDATE individuels
      console.log('🔍 UPDATE DATA:', { pairId, updateData });
      
      let success = false;
      let lastError: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES && !success; attempt++) {
        try {
          const { error } = await supabase
            .from('analysis_pairs')
            .update(updateData)
            .eq('pair_id', pairId);  // ← Une requête par paire !

          if (error) { console.error('❌ SUPABASE ERROR:', error); throw error; }
          success = true;
          successCount++;
        } catch (err) {
          lastError = err;
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }

      if (!success) {
        errorCount++;
        // ...
      }
    } catch (err) {
      errorCount++;
      console.error(`❌ Erreur pair_id=${pairId}:`, err);
    }
  }

  console.log(`✅ ${successCount} paires mises à jour, ❌ ${errorCount} erreurs`);
  return { success: successCount, errors: errorCount, total: results.length };
};
```

**NOUVEAU CODE (1 seul UPSERT pour toutes les paires)** :
```typescript
const updateH2WithResults = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string
): Promise<{ success: number; errors: number; total: number }> => {
  console.log(`📝 Mise à jour analysis_pairs : ${results.length} paires (BULK UPSERT)`);
  
  const bulkData: any[] = [];
  let skipped = 0;

  // Préparer les données pour bulk upsert
  for (const result of results) {
    const pairId = getH2Property(result.metadata, 'pairId');
    
    if (!pairId) {
      console.warn('⚠️ Pas de pairId:', result);
      skipped++;
      continue;
    }

    const row: any = { pair_id: pairId };

    // Remplir selon l'algo
    if (algorithmName.includes('M1')) {
      row.m1_verb_density = getH2Property(result.metadata, 'm1_verb_density');
      row.m1_verb_count = getH2Property(result.metadata, 'm1_verb_count');
      row.m1_total_words = getH2Property(result.metadata, 'm1_total_words');
      row.m1_action_verbs = getH2Property(result.metadata, 'm1_action_verbs');
      row.computation_status = 'complete';
    } else if (algorithmName.includes('M2')) {
      row.m2_lexical_alignment = getH2Property(result.metadata, 'm2_lexical_alignment');
      row.m2_semantic_alignment = getH2Property(result.metadata, 'm2_semantic_alignment');
      row.m2_global_alignment = getH2Property(result.metadata, 'm2_global_alignment');
      row.m2_shared_terms = getH2Property(result.metadata, 'm2_shared_terms');
      row.computation_status = 'complete';
    } else if (algorithmName.includes('M3')) {
      row.m3_hesitation_count = getH2Property(result.metadata, 'm3_hesitation_count');
      row.m3_clarification_count = getH2Property(result.metadata, 'm3_clarification_count');
      row.m3_cognitive_score = getH2Property(result.metadata, 'm3_cognitive_score');
      row.m3_cognitive_load = getH2Property(result.metadata, 'm3_cognitive_load');
      row.m3_patterns = getH2Property(result.metadata, 'm3_patterns');
      row.computation_status = 'complete';
    } else if (algorithmName.includes('X')) {
      row.x_predicted_tag = result.predicted;
      row.x_confidence = result.confidence;
      row.x_algorithm_key = algorithmName;
      row.x_algorithm_version = algorithmVersion;
      row.x_computed_at = new Date().toISOString();
      row.computation_status = 'complete';
    } else if (algorithmName.includes('Y')) {
      row.y_predicted_tag = result.predicted;
      row.y_confidence = result.confidence;
      row.y_algorithm_key = algorithmName;
      row.y_algorithm_version = algorithmVersion;
      row.y_computed_at = new Date().toISOString();
      row.computation_status = 'complete';
    }

    bulkData.push(row);
  }

  if (bulkData.length === 0) {
    console.error('❌ Aucune donnée à sauvegarder');
    return { success: 0, errors: results.length, total: results.length };
  }

  // ✅ UN SEUL UPSERT pour toutes les paires
  try {
    console.log(`🚀 BULK UPSERT: ${bulkData.length} lignes...`);
    const startTime = Date.now();
    
    const { error, count } = await supabase
      .from('analysis_pairs')
      .upsert(bulkData, { 
        onConflict: 'pair_id',
        count: 'exact'
      });

    const duration = Date.now() - startTime;

    if (error) {
      console.error('❌ ERREUR BULK UPSERT:', error);
      throw error;
    }

    const successCount = count || bulkData.length;
    console.log(`✅ ${successCount} paires mises à jour en ${duration}ms`);
    console.log(`⏱️  Performance: ${Math.round(successCount / (duration / 1000))} paires/seconde`);
    
    return { 
      success: successCount, 
      errors: skipped, 
      total: results.length 
    };
  } catch (error) {
    console.error('❌ Erreur critique:', error);
    return { 
      success: 0, 
      errors: results.length, 
      total: results.length 
    };
  }
};
```

**Commande PowerShell pour appliquer** :
```powershell
# Créer un backup d'abord
Copy-Item "src\features\phase3-analysis\level1-validation\ui\hooks\useLevel1Testing.ts" "src\features\phase3-analysis\level1-validation\ui\hooks\useLevel1Testing.ts.backup_bulk"

# Ensuite remplacer la fonction (utiliser str_replace ou éditeur)
```

#### Task 2 : Supprimer les logs de debug (5 min)

**Supprimer ces lignes** :
```typescript
console.log('🔍 UPDATE DATA:', { pairId, updateData }); // N'existe plus dans nouveau code
console.error('❌ SUPABASE ERROR:', error); // N'existe plus dans nouveau code
```

Ces logs étaient pour le debugging, ils ne sont plus nécessaires avec le bulk upsert.

#### Task 3 : Tester (5 min)

1. Ouvrir AlgorithmLab : `/phase3-analysis/level1/algorithm-lab`
2. Sélectionner "RegexXClassifier"
3. Cliquer "Lancer le test"
4. **Vérifier dans la console** :
   - `🚀 BULK UPSERT: 901 lignes...`
   - `✅ 901 paires mises à jour en XXXms` (devrait être < 2000ms)
   - `⏱️ Performance: XXX paires/seconde`

5. **Vérifier en DB** :
```sql
SELECT COUNT(*) FROM analysis_pairs WHERE x_predicted_tag IS NOT NULL;
-- Attendu : 901
```

**Performance attendue** : < 2 secondes pour 901 paires (vs 90 secondes avant)

---

### Option A : Architecture découplée (À faire plus tard si nécessaire - 2h)

#### Task 1 : Créer la fonction RPC (30 min)

```sql
-- Fichier : supabase/functions/bulk_update_algorithm_results.sql
CREATE OR REPLACE FUNCTION bulk_update_algorithm_results(
  pairs_data jsonb,
  algorithm_name text,
  algorithm_version text
)
RETURNS json AS $$
-- (voir code complet ci-dessus)
```

**Commande SQL** : Exécuter dans Supabase SQL Editor

#### Task 2 : Modifier useLevel1Testing.ts (45 min)

**2.1 Supprimer l'appel automatique à updateH2WithResults**

Ligne 491 actuelle :
```typescript
await updateH2WithResults(tvRows, classifierName, version);
```

Devient :
```typescript
// Ne plus sauvegarder automatiquement
// L'utilisateur décidera via bouton "Sauvegarder"
```

**2.2 Créer une nouvelle fonction saveResults**

```typescript
const saveResults = useCallback(
  async (
    results: TVValidationResult[],
    algorithmName: string
  ): Promise<{ success: boolean; updated: number }> => {
    const pairsData = results.map(r => ({
      pair_id: getH2Property(r.metadata, 'pairId'),
      x_predicted_tag: r.predicted,
      x_confidence: r.confidence,
    }));

    const { data, error } = await supabase.rpc(
      'bulk_update_algorithm_results',
      {
        pairs_data: pairsData,
        algorithm_name: algorithmName,
        algorithm_version: `${algorithmName}_v${new Date().toISOString().split('T')[0]}`
      }
    );

    if (error) throw error;
    return data;
  },
  []
);
```

**2.3 Exporter saveResults**

```typescript
return {
  // ... autres exports
  saveResults,  // ← NOUVEAU
};
```

#### Task 3 : Ajouter bouton "Sauvegarder" dans l'UI (45 min)

**Fichier** : `src/features/phase3-analysis/level1-validation/ui/components/shared/BaseAlgorithmTesting.tsx`

**Localisation** : Après l'affichage des résultats (ligne ~200)

```typescript
{results && results.length > 0 && (
  <Button
    variant="contained"
    color="primary"
    onClick={handleSaveResults}
    disabled={isSaving}
  >
    {isSaving ? 'Sauvegarde...' : 'Sauvegarder les résultats'}
  </Button>
)}
```

**Handler** :
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSaveResults = async () => {
  setIsSaving(true);
  try {
    const result = await saveResults(
      results,
      selectedAlgorithm
    );
    
    console.log(`✅ ${result.updated} paires sauvegardées`);
    // Afficher notification succès
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
    // Afficher notification erreur
  } finally {
    setIsSaving(false);
  }
};
```

### Option B : Bulk upsert simple (Plus rapide - 30 min)

Si vous voulez garder la sauvegarde automatique mais l'optimiser :

**Modifier updateH2WithResults** pour utiliser `.upsert()` au lieu de boucle :

```typescript
const updateH2WithResults = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string
) => {
  const bulkData = results.map(result => ({
    pair_id: getH2Property(result.metadata, 'pairId'),
    x_predicted_tag: result.predicted,
    x_confidence: result.confidence,
    x_algorithm_key: algorithmName,
    x_algorithm_version: algorithmVersion,
    x_computed_at: new Date().toISOString(),
    computation_status: 'complete'
  }));

  const { error, count } = await supabase
    .from('analysis_pairs')
    .upsert(bulkData, { onConflict: 'pair_id' });

  if (error) throw error;
  return { success: count || 0, errors: 0, total: results.length };
};
```

**Avantage** : Plus simple, garde l'architecture actuelle
**Inconvénient** : Pas optimal scientifiquement (sauvegarde à chaque test)

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Fonction RPC

```sql
-- Créer données de test
SELECT bulk_update_algorithm_results(
  '[
    {"pair_id": 3788, "x_predicted_tag": "ENGAGEMENT", "x_confidence": 0.85},
    {"pair_id": 3789, "x_predicted_tag": "EXPLICATION", "x_confidence": 0.72}
  ]'::jsonb,
  'RegexXClassifier',
  'test_v2025-11-20'
);

-- Vérifier résultat
SELECT pair_id, x_predicted_tag, x_confidence, x_algorithm_key 
FROM analysis_pairs 
WHERE pair_id IN (3788, 3789);
```

**Résultat attendu** : Les 2 paires doivent être mises à jour

### Test 2 : Workflow complet

1. Ouvrir AlgorithmLab : `/phase3-analysis/level1/algorithm-lab`
2. Sélectionner "RegexXClassifier"
3. Cliquer "Lancer le test"
4. **Attendre calcul** (doit être rapide - < 10 secondes)
5. **Vérifier métriques affichées** (accuracy, precision, etc.)
6. Cliquer "Sauvegarder les résultats"
7. **Vérifier sauvegarde** (doit être ultra-rapide - < 1 seconde)

### Test 3 : Validation DB

```sql
-- Compter résultats X
SELECT COUNT(*) FROM analysis_pairs WHERE x_predicted_tag IS NOT NULL;
-- Attendu : 901

-- Vérifier dernière mise à jour
SELECT x_algorithm_key, x_algorithm_version, COUNT(*) 
FROM analysis_pairs 
WHERE x_computed_at > now() - interval '1 hour'
GROUP BY x_algorithm_key, x_algorithm_version;
```

---

## 📚 CONTEXTE TECHNIQUE COMPLET

### Structure de `analysis_pairs`

**Colonnes principales** :
- `pair_id` (BIGSERIAL PRIMARY KEY) - Identifiant unique
- `call_id` (TEXT) - Identifiant appel
- `conseiller_turn_id` / `client_turn_id` (INTEGER) - IDs des tours
- `strategy_tag` / `reaction_tag` (TEXT) - Tags manuels (gold standard)
- `conseiller_verbatim` / `client_verbatim` (TEXT) - Textes

**Colonnes algorithme X** (conseiller) :
- `x_predicted_tag` (TEXT) - Prédiction
- `x_confidence` (NUMERIC) - Score de confiance
- `x_algorithm_key` (TEXT) - Nom algorithme
- `x_algorithm_version` (TEXT) - Version
- `x_computed_at` (TIMESTAMP) - Date calcul

**Colonnes algorithme Y** (client) :
- `y_predicted_tag`, `y_confidence`, `y_algorithm_key`, etc.

**Colonnes médiateurs** :
- `m1_*` (densité verbes d'action)
- `m2_*` (alignement linguistique)
- `m3_*` (charge cognitive)

**Colonne de statut** :
- `computation_status` (TEXT) - CHECK ('pending', 'partial', 'complete', 'error')

### Workflow algorithme actuel

```
┌─────────────────────────────────────────────┐
│ 1. useAnalysisPairs()                       │
│    Charge les 901 paires depuis DB          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. mapH2ToGoldStandard()                    │
│    Transforme en GoldStandardSample[]       │
│    Ajoute metadata.pairId                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. validateAlgorithm()                      │
│    - Filtre corpus selon algo               │
│    - Prépare inputs                         │
│    - Exécute classifier.run()               │
│    - Normalise résultats                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. normalizeUniversalToTV()                 │
│    - Combine résultat algo + metadata       │
│    - Transmet pairId dans result.metadata   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. updateH2WithResults() ⚠️ BLOQUANT        │
│    - 901 UPDATE individuels                 │
│    - Temps : ~90 secondes                   │
└─────────────────────────────────────────────┘
```

### Fichiers clés

| Fichier | Rôle | Lignes importantes |
|---------|------|-------------------|
| `useLevel1Testing.ts` | Hook principal validation | 185-276 (updateH2WithResults) |
| `useAnalysisPairs.ts` | Lecture analysis_pairs | Tout le fichier |
| `normalizeUniversalToTV.ts` | Normalisation résultats | 36 (pairId) |
| `BaseAlgorithmTesting.tsx` | Interface UI | 167 (runValidation) |
| `RegexXClassifier.ts` | Exemple algorithme | run() method |

---

## 🎓 DÉCISIONS CLÉS PRISES

### 1. Pourquoi découpler calcul/sauvegarde ?

**Raison scientifique** : 
- Les chercheurs testent souvent 10-20 variantes d'algorithmes
- Polluer la DB à chaque test n'est pas pertinent
- Seuls les résultats validés doivent être sauvegardés

**Raison technique** :
- 901 UPDATE = trop lent
- Calculs locaux = instantanés
- Sauvegarde bulk RPC = < 1 seconde

### 2. Pourquoi RPC plutôt que .upsert() ?

**Avantages RPC** :
- Exécution côté serveur (plus rapide)
- Pas de limite de taille requête HTTP
- Possibilité d'ajouter logique métier (validations, logs)
- Une seule transaction atomique

**Limitations .upsert()** :
- Limite taille payload HTTP (~6MB)
- Exécution côté client (sérialisation JSON)
- Pas de logique métier

### 3. Pourquoi pas de sauvegarde auto ?

L'ancien système (`h2_analysis_pairs`) ne faisait PAS de sauvegarde automatique. C'était volontaire. On reproduit ce comportement optimal.

---

## ⚠️ POINTS D'ATTENTION

### 1. Logs de debug à supprimer

**Fichier** : `useLevel1Testing.ts`

**Lignes à supprimer après tests** :
```typescript
console.log('🔍 UPDATE DATA:', { pairId, updateData }); // Ligne 236
console.error('❌ SUPABASE ERROR:', error); // Ligne 245
```

### 2. RLS Policies

Les policies actuelles sont **très permissives** :

```sql
CREATE POLICY "Allow authenticated users to update analysis_pairs"
ON analysis_pairs FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
```

**À améliorer** si besoin de sécurité par entreprise/utilisateur :

```sql
-- Exemple : Restreindre par entreprise
USING (
  call_id IN (
    SELECT CAST(callid AS text) FROM call c
    INNER JOIN entreprise_call ec ON c.callid = ec.callid
    WHERE ec.identreprise = current_user_entreprise_id()
  )
)
```

### 3. Validation des données

La fonction RPC devrait valider :
- `pair_id` existe
- `x_predicted_tag` est une valeur valide
- `x_confidence` est entre 0 et 1

---

## 📋 CHECKLIST AVANT COMMIT

- [ ] Fonction RPC `bulk_update_algorithm_results` créée et testée
- [ ] `useLevel1Testing.ts` modifié (saveResults ajoutée)
- [ ] `BaseAlgorithmTesting.tsx` modifié (bouton Sauvegarder)
- [ ] Logs de debug supprimés
- [ ] Tests validation passés (901 paires)
- [ ] Documentation mise à jour
- [ ] Commit avec message descriptif

---

## 🚀 COMMANDES GIT

```powershell
# Voir les fichiers modifiés
git status

# Ajouter les modifications
git add src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts
git add src/features/phase3-analysis/level1-validation/ui/hooks/normalizeUniversalToTV.ts
git add src/features/phase3-analysis/level1-validation/ui/components/shared/BaseAlgorithmTesting.tsx

# Commit avec message descriptif
git commit -m "feat(phase3): Optimiser sauvegarde résultats algorithmes

- Créer fonction RPC bulk_update_algorithm_results pour UPDATE en masse
- Découpler calcul (local) et sauvegarde (optionnelle)
- Ajouter bouton Sauvegarder dans BaseAlgorithmTesting
- Corriger transmission pairId dans normalizeUniversalToTV
- Corriger noms colonnes X/Y et computation_status
- Performance : 901 paires en < 1 seconde (vs 90 secondes avant)

BREAKING CHANGE: Les résultats ne sont plus sauvegardés automatiquement.
L'utilisateur doit cliquer sur 'Sauvegarder les résultats'."
```

---

## 📞 POUR LA PROCHAINE SESSION

### 🎯 Phrase d'accroche pour Claude

> "Nous sommes en Phase 4 de la migration analysis_pairs. Problème de performance résolu par identification de la cause (901 UPDATE individuels). Nous allons implémenter Option B : bulk upsert en une seule requête. Durée estimée : 30 minutes. Voir SESSION_MIGRATION_ANALYSIS_PAIRS_PHASE4.md section 'PLAN D'ACTION - Option B'."

### 📚 Documents ESSENTIELS à fournir à Claude (dans l'ordre)

#### 1. **SESSION_MIGRATION_ANALYSIS_PAIRS_PHASE4.md** ⭐ CRITIQUE
**Pourquoi** : Document vivant avec TOUT le contexte actuel
**Sections clés** :
- État actuel (Phase 4 en cours)
- Problème identifié (901 UPDATE individuels)
- Solution Option B (code complet)
- Fichiers modifiés
- Tests à effectuer

#### 2. **schema.sql** ⭐ CRITIQUE
**Pourquoi** : Structure exacte de la table `analysis_pairs`
**Info clé** : 
- Noms des colonnes X/Y/M1/M2/M3
- Contrainte CHECK sur `computation_status` : ('pending', 'partial', 'complete', 'error')
- Contrainte PRIMARY KEY sur `pair_id`

**Sections importantes** :
```sql
CREATE TABLE public.analysis_pairs (
  pair_id bigint NOT NULL DEFAULT nextval('analysis_pairs_pair_id_seq'::regclass),
  -- ... colonnes X
  x_predicted_tag text,
  x_confidence numeric,
  x_algorithm_key text,
  x_algorithm_version text,
  x_computed_at timestamp without time zone,
  -- ... colonnes Y
  y_predicted_tag text,
  y_confidence numeric,
  -- ... computation_status avec CHECK constraint
  computation_status text DEFAULT 'pending'::text 
    CHECK (computation_status = ANY (ARRAY['pending'::text, 'partial'::text, 'complete'::text, 'error'::text])),
  CONSTRAINT analysis_pairs_pkey PRIMARY KEY (pair_id)
);
```

#### 3. **RECAPITULATIF_FONCTIONNEMENT_ALGORITHMES.md** (si créé aujourd'hui)
**Pourquoi** : Explique le flow complet des algorithmes
**Info clé** :
- Comment les données circulent
- Où le `pairId` est transmis
- Rôle de `normalizeUniversalToTV`

#### 4. ⚠️ Documents à NE PAS fournir (pour éviter confusion)

**❌ SESSION_MIGRATION_ANALYSIS_PAIRS_FINAL.md**
- Concerne Phases 1-3 (terminées)
- Peut créer confusion avec Phase 4

**❌ ARCHITECTURE_CIBLE_WORKFLOW.md**
- Trop général, pas spécifique au problème actuel

**❌ Code de l'ancien système (h2_analysis_pairs)**
- On ne travaille PLUS avec h2_analysis_pairs
- Risque de confusion

### 📂 Fichiers à avoir sous les yeux

**Fichier principal à modifier** :
```
src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts
```

**Lignes critiques** :
- 183-276 : Fonction `updateH2WithResults` (À REMPLACER)
- 491 : Appel à `updateH2WithResults` (ne pas toucher, fonctionne déjà)

**Fichier de référence** :
```
src/features/phase3-analysis/level1-validation/ui/hooks/normalizeUniversalToTV.ts
```
- Ligne 36 : `pairId` est bien transmis ✅

### 🔍 Commandes PowerShell utiles

```powershell
# Localiser le fichier à modifier
Get-ChildItem -Recurse -Filter "useLevel1Testing.ts" | Where-Object { $_.FullName -like "*phase3-analysis*" } | Select-Object FullName

# Créer backup avant modification
Copy-Item "src\features\phase3-analysis\level1-validation\ui\hooks\useLevel1Testing.ts" "src\features\phase3-analysis\level1-validation\ui\hooks\useLevel1Testing.ts.backup_bulk"

# Voir la fonction actuelle
Get-Content "src\features\phase3-analysis\level1-validation\ui\hooks\useLevel1Testing.ts" | Select-Object -Index 183,184,185,186,187,188,189,190

# Après modification, vérifier .upsert()
Get-Content "src\features\phase3-analysis\level1-validation\ui\hooks\useLevel1Testing.ts" | Select-String "\.upsert\("
```

### ⚠️ Points d'attention pour Claude

#### 1. Ne PAS modifier ces parties
- ✅ `normalizeUniversalToTV.ts` : Le `pairId` est déjà correctement transmis
- ✅ Ligne 491 : L'appel à `updateH2WithResults` fonctionne déjà
- ✅ `useAnalysisPairs.ts` : La lecture fonctionne bien

#### 2. UNIQUEMENT modifier
- 🎯 Fonction `updateH2WithResults` (lignes 183-276)
- 🎯 Remplacer la boucle `for` + 901 UPDATE par 1 seul `.upsert()`

#### 3. Erreurs à éviter

**❌ NE PAS faire** :
```typescript
// ERREUR : Oublier onConflict
.upsert(bulkData) // ❌ Va créer des doublons

// ERREUR : Mauvais nom de conflit
.upsert(bulkData, { onConflict: 'id' }) // ❌ La colonne s'appelle 'pair_id'

// ERREUR : Oublier computation_status
row.x_predicted_tag = result.predicted;
// ❌ Manque row.computation_status = 'complete'
```

**✅ FAIRE** :
```typescript
.upsert(bulkData, { 
  onConflict: 'pair_id',  // ✅ Nom correct
  count: 'exact'          // ✅ Pour avoir le nombre de lignes affectées
});

// ✅ Toujours inclure computation_status
row.computation_status = 'complete';
```

#### 4. Validation après modification

**Console du navigateur doit afficher** :
```
📝 Mise à jour analysis_pairs : 901 paires (BULK UPSERT)
🚀 BULK UPSERT: 901 lignes...
✅ 901 paires mises à jour en 1523ms
⏱️ Performance: 591 paires/seconde
```

**Si erreur 400 Bad Request** :
- Vérifier `computation_status = 'complete'` (pas 'computed')
- Vérifier `onConflict: 'pair_id'` (pas 'id')
- Vérifier que `pair_id` est bien dans chaque `row`

### 🎓 Contexte algorithmique (rappel rapide)

**Les 5 types d'algorithmes** :
- **X** : Classifie le conseiller (ENGAGEMENT, OUVERTURE, REFLET_*, EXPLICATION)
- **Y** : Classifie le client (CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF)
- **M1** : Compte les verbes d'action (médiateur)
- **M2** : Mesure l'alignement linguistique (médiateur)
- **M3** : Évalue la charge cognitive (médiateur)

**Colonnes DB par algorithme** :
```
X → x_predicted_tag, x_confidence, x_algorithm_key, x_algorithm_version, x_computed_at
Y → y_predicted_tag, y_confidence, y_algorithm_key, y_algorithm_version, y_computed_at
M1 → m1_verb_density, m1_verb_count, m1_total_words, m1_action_verbs
M2 → m2_lexical_alignment, m2_semantic_alignment, m2_global_alignment, m2_shared_terms
M3 → m3_hesitation_count, m3_clarification_count, m3_cognitive_score, m3_cognitive_load
```

### 📋 Checklist avant de commencer

**Contexte confirmé** :
- [ ] Phase 4 migration en cours
- [ ] Problème : 901 UPDATE individuels (trop lent)
- [ ] Solution : Option B bulk upsert
- [ ] Fichier à modifier : `useLevel1Testing.ts` lignes 183-276

**Documents fournis** :
- [ ] SESSION_MIGRATION_ANALYSIS_PAIRS_PHASE4.md
- [ ] schema.sql (structure analysis_pairs)
- [ ] RECAPITULATIF_FONCTIONNEMENT_ALGORITHMES.md (optionnel)

**Prêt à démarrer** :
- [ ] Backup créé : `useLevel1Testing.ts.backup_bulk`
- [ ] Nouveau code bulk upsert sous les yeux
- [ ] 30 minutes disponibles

---

**Dernière mise à jour** : 20 novembre 2025 - 18h10  
**Prochaine étape** : Implémenter architecture découplée (Option A - 2h)  
**Fichier vivant** : À mettre à jour après chaque session
