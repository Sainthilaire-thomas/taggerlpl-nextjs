# 🚀 Plan de Migration Level1 → h2_analysis_pairs

**Objectif** : Remplacer la reconstruction manuelle des données depuis `turntagged` par l'utilisation directe de `h2_analysis_pairs` comme source de vérité.

**Date** : 2025-01-XX
**Statut** : 📋 À implémenter

---

## 📊 Vue d'ensemble

### Ancien flux (AVANT)

```
turntagged → mapTurnsToGoldStandard() → filterCorpusForAlgorithm() 
  → validateAlgorithm() → Résultats affichés (non persistés)
```

### Nouveau flux (APRÈS)

```
h2_analysis_pairs → mapH2ToGoldStandard() → validateAlgorithm()
  → updateH2WithResults() → h2_analysis_pairs (enrichie)
  → Résultats affichés + versioning
```

---

## ✅ Tâches par fichier

### 1️⃣ **Créer `hooks/useH2Data.ts`** (NOUVEAU FICHIER)

**Localisation** : `src/app/(protected)/analysis/components/AlgorithmLab/hooks/useH2Data.ts`

**Objectif** : Hook pour charger les données depuis `h2_analysis_pairs`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface H2AnalysisPair {
  pair_id: number;
  call_id: number;
  conseiller_turn_id: number;
  
  // Données de base
  conseiller_verbatim: string;
  client_verbatim: string;
  strategy_tag: string;
  reaction_tag: string;
  strategy_family: string;
  
  // Timestamps
  conseiller_start_time: number;
  conseiller_end_time: number;
  
  // Métadonnées
  annotations: any[];
  
  // Résultats algorithmes X/Y
  next_turn_tag_auto?: string;
  score_auto?: number;
  
  // Résultats M1
  m1_verb_density?: number;
  m1_verb_count?: number;
  m1_total_words?: number;
  m1_action_verbs?: string[];
  
  // Résultats M2
  m2_lexical_alignment?: number;
  m2_semantic_alignment?: number;
  m2_global_alignment?: number;
  m2_shared_terms?: string[];
  
  // Résultats M3
  m3_hesitation_count?: number;
  m3_clarification_count?: number;
  m3_cognitive_score?: number;
  m3_cognitive_load?: string;
  m3_patterns?: any;
  
  // Versioning
  algorithm_version?: string;
  version_metadata?: any;
  computed_at?: string;
  computation_status?: 'computed' | 'error' | 'pending';
}

export const useH2Data = (filters?: {
  algorithmVersion?: string;
  computationStatus?: 'computed' | 'error' | 'pending';
  minPairs?: number;
}) => {
  const [h2Pairs, setH2Pairs] = useState<H2AnalysisPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchH2Pairs = async () => {
      try {
        setLoading(true);
      
        let query = supabase
          .from('h2_analysis_pairs')
          .select('*');
      
        // Filtres optionnels
        if (filters?.algorithmVersion) {
          query = query.eq('algorithm_version', filters.algorithmVersion);
        }
      
        if (filters?.computationStatus) {
          query = query.eq('computation_status', filters.computationStatus);
        }
      
        const { data, error: fetchError } = await query;
      
        if (fetchError) throw fetchError;
      
        setH2Pairs(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur chargement H2');
        console.error('Erreur useH2Data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchH2Pairs();
  }, [filters?.algorithmVersion, filters?.computationStatus]);

  return { h2Pairs, loading, error };
};
```

**Tests à faire** :

- [ ] Vérifier que les données se chargent correctement
- [ ] Tester les filtres optionnels
- [ ] Vérifier la structure des annotations (jsonb)

---

### 2️⃣ **Modifier `hooks/useLevel1Testing.ts`**

**Localisation** : `src/app/(protected)/analysis/components/AlgorithmLab/hooks/useLevel1Testing.ts`

#### A) Remplacer le hook de données

**AVANT** :

```typescript
const { allTurnTagged, loadingGlobalData, errorGlobalData, tags } = useTaggingData();
```

**APRÈS** :

```typescript
const { h2Pairs, loading, error } = useH2Data();
```

---

#### B) Simplifier `mapTurnsToGoldStandard` → `mapH2ToGoldStandard`

**AVANT** (complexe, 150+ lignes) :

```typescript
const mapTurnsToGoldStandard = (
  allTurnTagged: any[],
  allowedConseiller?: Set<string>
): GoldStandardSample[] => {
  // Reconstruction manuelle des paires
  // Gestion prev1/prev2/next
  // Double traitement conseiller + client
  // ...
}
```

**APRÈS** (simple, ~40 lignes) :

```typescript
const mapH2ToGoldStandard = (pairs: H2AnalysisPair[]): GoldStandardSample[] => {
  return pairs.map(pair => ({
    verbatim: pair.conseiller_verbatim,
    expectedTag: normalizeXLabelStrict(pair.strategy_tag),
    metadata: {
      target: 'conseiller',
      callId: pair.call_id,
      turnId: pair.conseiller_turn_id,
      pairId: pair.pair_id, // ✅ NOUVEAU : référence h2
    
      // Contexte client (pour M2/M3)
      client_verbatim: pair.client_verbatim,
      reaction_tag: pair.reaction_tag,
    
      // Annotations
      annotations: Array.isArray(pair.annotations) ? pair.annotations : [],
    
      // Résultats existants (si déjà calculés)
      existing_results: {
        m1_verb_density: pair.m1_verb_density,
        m2_global_alignment: pair.m2_global_alignment,
        m3_cognitive_score: pair.m3_cognitive_score,
        next_turn_tag_auto: pair.next_turn_tag_auto,
      },
    
      // Versioning
      algorithm_version: pair.algorithm_version,
      computation_status: pair.computation_status,
    }
  }));
};
```

---

#### C) Ajouter `updateH2WithResults` (NOUVELLE FONCTION)

```typescript
/**
 * Écrit les résultats de validation dans h2_analysis_pairs
 * Stratégie : Retry + gestion d'erreurs granulaire
 */
const updateH2WithResults = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string
) => {
  console.log(`📝 Mise à jour h2_analysis_pairs : ${results.length} paires`);
  
  const MAX_RETRIES = 2;
  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    const pairId = result.metadata?.pairId;
    if (!pairId) {
      console.warn('⚠️ Pas de pairId:', result);
      errorCount++;
      continue;
    }

    // Construction de l'update selon l'algo
    const updateData: any = {
      computed_at: new Date().toISOString(),
      algorithm_version: algorithmVersion,
    };

    try {
      // Remplir les colonnes selon l'algo testé
      if (algorithmName.includes('M1')) {
        updateData.m1_verb_density = result.metadata?.m1_verb_density;
        updateData.m1_verb_count = result.metadata?.m1_verb_count;
        updateData.m1_total_words = result.metadata?.m1_total_words;
        updateData.m1_action_verbs = result.metadata?.m1_action_verbs;
        updateData.computation_status = 'computed';
      } else if (algorithmName.includes('M2')) {
        updateData.m2_lexical_alignment = result.metadata?.m2_lexical_alignment;
        updateData.m2_semantic_alignment = result.metadata?.m2_semantic_alignment;
        updateData.m2_global_alignment = result.metadata?.m2_global_alignment;
        updateData.m2_shared_terms = result.metadata?.m2_shared_terms;
        updateData.computation_status = 'computed';
      } else if (algorithmName.includes('M3')) {
        updateData.m3_hesitation_count = result.metadata?.m3_hesitation_count;
        updateData.m3_clarification_count = result.metadata?.m3_clarification_count;
        updateData.m3_cognitive_score = result.metadata?.m3_cognitive_score;
        updateData.m3_cognitive_load = result.metadata?.m3_cognitive_load;
        updateData.m3_patterns = result.metadata?.m3_patterns;
        updateData.computation_status = 'computed';
      } else if (algorithmName.includes('X') || algorithmName.includes('Y')) {
        updateData.next_turn_tag_auto = result.predicted;
        updateData.score_auto = result.confidence;
        updateData.computation_status = 'computed';
      }

      // Retry logic
      let success = false;
      let lastError: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES && !success; attempt++) {
        try {
          const { error } = await supabase
            .from('h2_analysis_pairs')
            .update(updateData)
            .eq('pair_id', pairId);

          if (error) throw error;
          success = true;
          successCount++;
        
        } catch (err) {
          lastError = err;
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }

      // Échec définitif
      if (!success) {
        errorCount++;
        await supabase
          .from('h2_analysis_pairs')
          .update({
            computation_status: 'error',
            version_metadata: {
              error: lastError instanceof Error ? lastError.message : 'Update failed',
              retries: MAX_RETRIES
            }
          })
          .eq('pair_id', pairId);
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

---

#### D) Ajouter version batch (NOUVELLE FONCTION)

```typescript
const BATCH_SIZE = 100;

const updateH2WithResultsBatch = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string,
  onProgress?: (current: number, total: number) => void
) => {
  const batches = [];
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    batches.push(results.slice(i, i + BATCH_SIZE));
  }

  let totalSuccess = 0;
  let totalErrors = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
  
    const stats = await updateH2WithResults(batch, algorithmName, algorithmVersion);
  
    totalSuccess += stats.success;
    totalErrors += stats.errors;

    onProgress?.((batchIdx + 1) * BATCH_SIZE, results.length);

    if (batchIdx < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return {
    success: totalSuccess,
    errors: totalErrors,
    total: results.length,
    batches: batches.length
  };
};
```

---

#### E) Modifier `validateAlgorithm`

**AJOUTER après la validation** :

```typescript
const validateAlgorithm = useCallback(
  async (classifierName: string, sampleSize?: number) => {
    // ... code existant de validation ...

    // 🆕 AJOUT : Écrire les résultats dans h2_analysis_pairs
    const version = generateAlgorithmVersion(classifierName);
    await updateH2WithResults(tvRows, classifierName, version);

    console.log(`✅ ${tvRows.length} résultats + update h2_analysis_pairs`);
    return tvRows;
  },
  [goldStandardData]
);
```

---

#### F) Export des nouvelles fonctions

**AJOUTER dans le return du hook** :

```typescript
return {
  // ... exports existants ...
  
  // 🆕 NOUVEAUX exports
  updateH2WithResults,
  updateH2WithResultsBatch,
  
  // État h2
  h2Pairs,
  h2Loading: loading,
  h2Error: error,
};
```

---

### 3️⃣ **Modifier `BaseAlgorithmTesting.tsx`**

**Localisation** : `src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/algorithms/BaseAlgorithmTesting.tsx`

#### Modifier `runValidation`

**REMPLACER** :

```typescript
const runValidation = React.useCallback(async () => {
  // ... code existant ...
  
  try {
    const results = await validateAlgorithm(selectedModelId, sampleSize);
    setTestResults(results as TVValidationResultCore[]);

    // 🆕 AJOUT : Update h2_analysis_pairs
    const updateStats = await level1Testing.updateH2WithResultsBatch(
      results,
      selectedModelId,
      `v${meta.version ?? '1.0.0'}`,
      (current, total) => {
        console.log(`📊 Progression: ${current}/${total} paires`);
      }
    );

    console.log(`✅ Update h2: ${updateStats.success} succès, ${updateStats.errors} erreurs`);

    // Capture version (code existant)
    const newVersionId = await captureVersionAfterTest(...);
  
  } catch (e: any) {
    // ... gestion erreur ...
  }
}, [validateAlgorithm, selectedModelId, sampleSize, target, level1Testing]);
```

---

### 4️⃣ **Supprimer code obsolète**

#### Dans `useLevel1Testing.ts` - SUPPRIMER :

```typescript
// ❌ SUPPRIMER : Plus besoin de ces fonctions
const buildPrevIndex = (rows: any[]) => { ... }
const getNextTurn = (currentTurn: any, allTurns: any[]) => { ... }

// ❌ SUPPRIMER : Ancienne version longue
const mapTurnsToGoldStandard = (allTurnTagged: any[], ...) => {
  // 150+ lignes de reconstruction manuelle
}

// ❌ SUPPRIMER : Plus besoin de filtrer par target conseiller/client
const useAllowedConseillerLabels = (tags: any[]) => { ... }
```

---

## 🧪 Tests à effectuer

### Tests unitaires

- [ ] `useH2Data` charge correctement les données
- [ ] `mapH2ToGoldStandard` produit le bon format
- [ ] `updateH2WithResults` écrit correctement dans la BDD
- [ ] Gestion d'erreurs avec retry fonctionne

### Tests d'intégration

- [ ] Tester validation M1 → update h2_analysis_pairs
- [ ] Tester validation M2 → update h2_analysis_pairs
- [ ] Tester validation M3 → update h2_analysis_pairs
- [ ] Tester validation X → update h2_analysis_pairs
- [ ] Tester validation Y → update h2_analysis_pairs
- [ ] Vérifier versioning automatique
- [ ] Tester batch avec 1000+ paires

### Tests UI

- [ ] Barre de progression fonctionne
- [ ] Affichage des erreurs
- [ ] Metrics correctement calculées
- [ ] ResultsPanel affiche les données
- [ ] Dialog versioning fonctionne

---

## 📋 Checklist de déploiement

### Avant migration

- [ ] Backup de `h2_analysis_pairs`
- [ ] Vérifier les contraintes SQL (foreign keys, etc.)
- [ ] S'assurer que `algorithm_version_registry` est à jour

### Pendant migration

- [ ] Créer `useH2Data.ts`
- [ ] Modifier `useLevel1Testing.ts`
- [ ] Modifier `BaseAlgorithmTesting.tsx`
- [ ] Supprimer code obsolète
- [ ] Lancer tests unitaires

### Après migration

- [ ] Tester sur petit échantillon (10 paires)
- [ ] Tester sur échantillon moyen (100 paires)
- [ ] Tester sur gros échantillon (1000+ paires)
- [ ] Vérifier performances (temps de réponse)
- [ ] Monitorer logs Supabase
- [ ] Documenter les changements

---

## ⚠️ Points d'attention

### Gestion d'erreurs

- **Stratégie** : Marquer `computation_status='error'` + détails dans `version_metadata`
- **Retry** : 2 tentatives avec backoff (500ms, 1000ms)
- **Logging** : Console.error + traçabilité via `pair_id`

### Performance

- **Batch size** : 100 paires (optimal)
- **Pause inter-batch** : 200ms
- **Timeout** : Gérer les timeout Supabase (> 30s)

### Versioning

- **Capture auto** : Après chaque validation réussie
- **Enrichissement** : Optionnel via dialog
- **Activation** : Manuel via UI

---

## 🚦 Ordre d'implémentation recommandé

1. **Session 1** : Créer `useH2Data.ts` + tests
2. **Session 2** : Créer `mapH2ToGoldStandard` + tests
3. **Session 3** : Créer `updateH2WithResults` + tests retry
4. **Session 4** : Créer `updateH2WithResultsBatch`
5. **Session 5** : Intégrer dans `validateAlgorithm`
6. **Session 6** : Intégrer dans `BaseAlgorithmTesting`
7. **Session 7** : Supprimer code obsolète
8. **Session 8** : Tests d'intégration complets
9. **Session 9** : Tests UI + UX
10. **Session 10** : Documentation + déploiement

---

## 📚 Ressources

### Documentation Supabase

- [Batch updates](https://supabase.com/docs/guides/database/batch-operations)
- [Error handling](https://supabase.com/docs/guides/api/error-handling)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Documentation projet

- Schema BDD : `documents/schema.sql`
- Architecture Level1 : `docs/architecture/branche-components-level1.md`
- Types référence : `docs/types/referencetypes.md`

---

## 📝 Notes de session

### Questions ouvertes

- [ ] Faut-il un index sur `pair_id` dans `h2_analysis_pairs` ?
- [ ] Faut-il paginer les résultats de `useH2Data` ?
- [ ] Faut-il un système de queue pour les gros batches ?

### Décisions prises

- ✅ Batch size : 100 paires
- ✅ Retry : 2 tentatives
- ✅ Colonnes Y : `next_turn_tag_auto` + `score_auto`
- ✅ Gestion erreurs : `computation_status='error'` + metadata

---

**Dernière mise à jour** : 2025-01-XX
**Prochaine session** : Implémenter `useH2Data.ts`
