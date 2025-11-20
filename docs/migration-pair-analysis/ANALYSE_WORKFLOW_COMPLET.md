# ANALYSE WORKFLOW COMPLET : h2_analysis_pairs → analysis_pairs

**Date** : 19 novembre 2025  
**Objectif** : Comprendre le workflow réel avant migration

---

## 🔍 WORKFLOW RÉEL IDENTIFIÉ

### ✅ DÉCOUVERTE CRITIQUE

**Il N'Y A PAS d'appel à `refresh_h2_analysis_pairs` dans le code actuel !**

Le workflow actuel est :

```
1. TranscriptLPL : Annotation manuelle
   └─> Écriture dans turntagged

2. Clic "Calculer Relations Étendues"
   └─> calculateAllNextTurnTags(callId)
   └─> Appel RPC : calculate_turn_relations(call_id)
   └─> MAJ turntagged (prev4→next4 via LAG/LEAD)

3. ❌ h2_analysis_pairs N'EST JAMAIS RÉGÉNÉRÉ AUTOMATIQUEMENT
```

### 📍 Code Exact du Déclenchement

**Fichier** : `TaggingDataContext.tsx` (lignes ~520)

```typescript
const calculateAllNextTurnTags = useCallback(
  async (callId: string): Promise<number> => {
    if (!supabase) {
      console.warn("Supabase not available");
      return 0;
    }

    try {
      console.log("=== CALCUL RELATIONS ÉTENDUES (RPC) ===");
      console.log("Call ID:", callId);

      // ✅ Appeler la fonction RPC avec call_id en INTEGER
      const { data, error } = await supabase.rpc('calculate_turn_relations', {
        p_call_id: parseInt(callId, 10) // Cast en INTEGER
      });

      if (error) {
        console.error("❌ Erreur calcul relations:", error);
        throw error;
      }

      const result = data?.[0];
      
      if (!result) {
        console.warn("⚠️ Aucun résultat retourné par la fonction");
        return 0;
      }

      console.log(`✅ ${result.updated_count} tours mis à jour`);
      console.log(`📊 ${result.total_turns} tours traités`);
      console.log(`⏱️ ${result.execution_time_ms}ms`);

      // Rafraîchir l'état local si des changements
      if (result.updated_count > 0) {
        console.log("🔄 Rafraîchissement de l'état local...");
        await fetchTaggedTurns(callId);
      }

      return result.updated_count;
    } catch (err) {
      console.error("❌ Erreur dans calculateAllNextTurnTags:", err);
      return 0;
    }
  },
  [supabase, fetchTaggedTurns]
);
```

---

## 🎯 IMPLICATIONS POUR LA MIGRATION

### Question Cruciale : Quand `h2_analysis_pairs` est-elle remplie ?

**Hypothèses possibles** :

#### Option A : Script SQL manuel externe
```sql
-- Exécuté manuellement dans Supabase Dashboard
SELECT refresh_h2_analysis_pairs(false, NULL);
```

#### Option B : Bouton caché/autre interface
- Y a-t-il un autre composant qui appelle `refresh_h2_analysis_pairs` ?
- Script côté serveur ? Cron job ?

#### Option C : `h2_analysis_pairs` créée une seule fois
- Créée initialement puis mise à jour par les algorithmes uniquement
- Pas de régénération depuis `turntagged`

---

## 📊 WORKFLOW DÉTAILLÉ ACTUEL

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1 : ANNOTATION (TranscriptLPL)                        │
└─────────────────────────────────────────────────────────────┘
    │
    │ 1. Utilisateur annote les tours
    ↓
┌─────────────────────────────────────────────────────────────┐
│ turntagged                                                   │
│ ├─ id, call_id, tag, verbatim, speaker                      │
│ ├─ start_time, end_time                                     │
│ └─ prev4_turn_id, prev3_turn_id, ..., next4_turn_id        │
│    (NULL au départ)                                          │
└─────────────────────────────────────────────────────────────┘
    │
    │ 2. Clic "Calculer Relations Étendues"
    │    (TranscriptControls.tsx)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ RPC : calculate_turn_relations(call_id)                     │
│ ├─ Utilise LAG/LEAD window functions                        │
│ ├─ Calcule prev4→prev1, next1→next4                        │
│ └─ UPDATE turntagged SET prev*_turn_id, next*_turn_id      │
└─────────────────────────────────────────────────────────────┘
    │
    │ 3. turntagged maintenant enrichi avec relations
    ↓
┌─────────────────────────────────────────────────────────────┐
│ turntagged (avec relations)                                  │
│ ├─ prev4_turn_id = 123                                      │
│ ├─ prev3_turn_id = 125                                      │
│ ├─ prev2_turn_id = 128                                      │
│ ├─ prev1_turn_id = 130                                      │
│ ├─ next1_turn_id = 135                                      │
│ ├─ next2_turn_id = 137                                      │
│ ├─ next3_turn_id = 140                                      │
│ └─ next4_turn_id = 142                                      │
└─────────────────────────────────────────────────────────────┘
    │
    │ 4. ❓ QUELQUE PART (à déterminer)
    │    refresh_h2_analysis_pairs est appelé
    ↓
┌─────────────────────────────────────────────────────────────┐
│ RPC : refresh_h2_analysis_pairs(incremental, call_ids)      │
│ ├─ Sélectionne tours conseiller avec stratégie              │
│ ├─ Rejoint avec client (next1_turn_id)                      │
│ ├─ Récupère contexte via prev*/next* IDs                    │
│ └─ INSERT/UPDATE h2_analysis_pairs                          │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ h2_analysis_pairs (table matérialisée)                       │
│ ├─ pair_id, call_id, pair_index                            │
│ ├─ conseiller_turn_id, client_turn_id                      │
│ ├─ strategy_tag, reaction_tag                              │
│ ├─ conseiller_verbatim, client_verbatim                    │
│ ├─ prev4_verbatim → prev1_verbatim                         │
│ ├─ next1_verbatim → next3_verbatim                         │
│ ├─ m1_*, m2_*, m3_* (NULL initialement)                    │
│ └─ next_turn_tag_auto, score_auto (NULL initialement)      │
└─────────────────────────────────────────────────────────────┘
    │
    │ 5. AlgorithmLab charge les paires
    ↓
┌─────────────────────────────────────────────────────────────┐
│ useH2Data() hook                                             │
│ └─ SELECT * FROM h2_analysis_pairs                          │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ useLevel1Testing()                                           │
│ ├─ mapH2ToGoldStandard(h2Pairs)                            │
│ ├─ Exécution algorithmes (X, Y, M1, M2, M3)                │
│ └─ updateH2WithResults()                                    │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ UPDATE h2_analysis_pairs                                     │
│ ├─ SET m1_verb_density = ...                               │
│ ├─ SET m2_lexical_alignment = ...                          │
│ ├─ SET m3_cognitive_score = ...                            │
│ ├─ SET next_turn_tag_auto = ... (Y)                        │
│ ├─ SET score_auto = ...                                    │
│ └─ SET computation_status = 'computed'                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ QUESTIONS CRITIQUES À RÉSOUDRE

### 1. **Où/Quand `refresh_h2_analysis_pairs` est appelé ?**

**À vérifier** :
- Y a-t-il un autre fichier TypeScript qui l'appelle ?
- Script externe (bash, python) ?
- Supabase Dashboard (exécution manuelle) ?
- Trigger SQL automatique ?

**Recherche à faire** :
```bash
# Chercher dans tout le projet
grep -r "refresh_h2_analysis_pairs" /path/to/project
grep -r "refreshH2" /path/to/project
grep -r "rpc.*h2" /path/to/project
```

### 2. **Fréquence de régénération**

- Une seule fois au départ ?
- À chaque nouvelle annotation ?
- Manuellement quand on veut analyser ?
- Quotidiennement (cron) ?

### 3. **Scope de régénération**

- Full refresh (toutes les paires) ?
- Incrémental (seulement call_id modifiés) ?
- Par appel individuel ?

---

## 🎯 STRATÉGIE DE MIGRATION PROPOSÉE

### Approche : Créer un Hook Unifié

Au lieu de chercher où `refresh_h2_analysis_pairs` est appelé, **créons un nouveau hook** qui :

1. **Remplace** `useH2Data`
2. **Génère** `analysis_pairs` à la demande depuis `turntagged`
3. **Cache** les résultats intelligemment
4. **Met à jour** après chaque run d'algorithme

### Nouveau Hook : `useAnalysisPairs`

```typescript
// src/features/phase3-analysis/level1-validation/ui/hooks/useAnalysisPairs.ts

export const useAnalysisPairs = (options?: {
  callIds?: string[];
  autoRefresh?: boolean;
  useCache?: boolean;
}) => {
  const [pairs, setPairs] = useState<AnalysisPairRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ OPTION 1 : Charger depuis analysis_pairs (si déjà créée)
  const loadFromTable = async () => {
    const { data, error } = await supabase
      .from('analysis_pairs')
      .select('*');
    
    if (data) setPairs(data);
  };
  
  // ✅ OPTION 2 : Générer à la volée depuis turntagged
  const generateFromTurntagged = async (callIds?: string[]) => {
    // Appel RPC : refresh_analysis_pairs
    const { data, error } = await supabase.rpc('refresh_analysis_pairs', {
      p_incremental: true,
      p_call_ids: callIds
    });
    
    // Puis charger
    await loadFromTable();
  };
  
  // ✅ OPTION 3 : Décider intelligemment
  const refresh = async () => {
    // Si analysis_pairs existe et n'est pas vide → charger
    // Sinon → générer
    const { count } = await supabase
      .from('analysis_pairs')
      .select('*', { count: 'exact', head: true });
    
    if (count > 0) {
      await loadFromTable();
    } else {
      await generateFromTurntagged();
    }
  };
  
  return { pairs, loading, error, refresh, generateFromTurntagged };
};
```

---

## 📋 PLAN D'ACTION

### Étape 1 : Vérification (30 min)

**Rechercher l'appel à `refresh_h2_analysis_pairs`** :

```bash
# Dans le projet
cd /path/to/taggerlpl-nextjs

# Recherche exhaustive
grep -r "refresh_h2" . --include="*.ts" --include="*.tsx" --include="*.js"
grep -r "rpc.*h2" . --include="*.ts" --include="*.tsx"

# Chercher dans les scripts
find . -name "*.sh" -o -name "*.py" | xargs grep "h2_analysis"

# Chercher dans Supabase (migrations SQL)
grep -r "refresh_h2" supabase/
```

**Résultats possibles** :
- ✅ Trouvé → Adapter cet appel pour `analysis_pairs`
- ❌ Pas trouvé → `h2_analysis_pairs` créée manuellement une seule fois

### Étape 2 : Décision Architecturale

**SI `refresh_h2_analysis_pairs` est appelé quelque part** :
→ Créer `refresh_analysis_pairs` avec même interface
→ Remplacer l'appel

**SI `h2_analysis_pairs` n'est jamais régénéré** :
→ Créer un bouton UI "Synchroniser Paires"
→ Hook `useAnalysisPairs` avec `refresh()` manuel

### Étape 3 : Implémentation

1. Créer fonction SQL `refresh_analysis_pairs` (adaptation de `refresh_h2_analysis_pairs`)
2. Créer hook `useAnalysisPairs` (remplacement de `useH2Data`)
3. Mettre à jour `useLevel1Testing` pour utiliser le nouveau hook
4. Tester la génération de paires

---

## 🚀 PROCHAINE ÉTAPE IMMÉDIATE

**Thomas, pouvez-vous** :

1. **Exécuter la recherche** ci-dessus pour trouver où `refresh_h2_analysis_pairs` est appelé
2. **Me dire** :
   - Si vous lancez manuellement une requête SQL dans Supabase Dashboard ?
   - Si vous avez un script externe qui fait le refresh ?
   - Si c'est fait une seule fois au setup du projet ?

Avec cette information, je pourrai vous créer :
- ✅ La fonction `refresh_analysis_pairs` adaptée
- ✅ Le hook `useAnalysisPairs` complet
- ✅ La stratégie de migration précise
- ✅ Le plan de tests

---

## 📝 RÉSUMÉ

### Ce qu'on sait :
- ✅ `calculate_turn_relations` est appelé depuis TranscriptLPL
- ✅ `turntagged` est la source de vérité
- ✅ `h2_analysis_pairs` est une table dérivée/matérialisée
- ✅ AlgorithmLab lit `h2_analysis_pairs` et y écrit les résultats

### Ce qu'on doit découvrir :
- ❓ Où/Quand `refresh_h2_analysis_pairs` est appelé
- ❓ Fréquence de régénération (une fois, périodique, manuel)
- ❓ Déclencheur exact (UI, script, trigger)

### Notre objectif :
- 🎯 Créer `analysis_pairs` avec la même logique
- 🎯 S'assurer qu'elle est régénérée au bon moment
- 🎯 Migrer progressivement sans casser l'existant
