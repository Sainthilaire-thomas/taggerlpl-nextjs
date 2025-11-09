# 📊 INVENTAIRE COMPLET DES TYPES EXISTANTS

**Date:** 2025-11-08  
**Source:** project_tree.txt (911 lignes)

---

## 🔍 Types AlgorithmLab (Priorité 🔴 HAUTE)

### Types principaux (5 fichiers)
```
Ligne 422: src/app/(protected)/analysis/components/AlgorithmLab/types/h2Types.ts
Ligne 424: src/app/(protected)/analysis/components/AlgorithmLab/types/Level0Types.ts
Ligne 425: src/app/(protected)/analysis/components/AlgorithmLab/types/Level1Types.ts
Ligne 428: src/app/(protected)/analysis/components/AlgorithmLab/types/SharedTypes.ts
Ligne 435: src/app/(protected)/analysis/components/AlgorithmLab/types/ValidationTypes.ts
```

### Types secondaires dispersés (4+ fichiers)
```
Ligne 282: AlgorithmLab/components/.../FineTuningDialog/types.ts
Ligne 302: AlgorithmLab/components/.../ResultsSample/types.ts
Ligne 328: AlgorithmLab/components/.../ResultsPanel/types.ts
Ligne 470: AlgorithmLab/components/Level2/types.ts
```

### Types dans hooks/utils
```
Ligne 497: AlgorithmLab/hooks/.../types.ts
Ligne 504: AlgorithmLab/hooks/.../types.ts
Ligne 512: AlgorithmLab/utils/.../types.ts
Ligne 539: AlgorithmLab/utils/.../types.ts
Ligne 551: AlgorithmLab/utils/.../types.ts
```

**Impact estimé:** ~150 fichiers importent ces types

---

## 🔍 Types TranscriptLPL (Priorité 🟡 MOYENNE)

```
Ligne 845: src/components/TranscriptLPL/types.tsx
```

**Contenu probable:**
- Types pour tagging (TaggingState, TagSelection)
- Types pour audio (AudioState, PlaybackState)
- Types pour transcript (TranscriptSegment, WordTiming)
- Types pour turn (TurnData, TurnRelation)

**Impact estimé:** ~20 fichiers

---

## 🔍 Types WorkDrive (Priorité 🟡 MOYENNE)

```
Ligne 832: src/components/SimpleWorkdriveExplorer/types.tsx
```

**Contenu probable:**
- Types pour fichiers Zoho (WorkdriveFile, WorkdriveFolder)
- Types pour navigation (NavigationState, BreadcrumbItem)
- Types pour auth (AuthState, AuthCredentials)
- Types pour search (SearchResult, SearchFilters)

**Impact estimé:** ~10 fichiers

---

## 🔍 Types Calls/DDD (Priorité 🟢 DÉJÀ STRUCTURÉ)

```
Ligne 758: src/components/calls/shared/types/CommonTypes.ts
Ligne 760: src/components/calls/shared/types/TranscriptionTypes.ts
```

**Statut:** Déjà bien structuré en DDD, probablement pas besoin de migrer

**Contenu:**
- CallStatus, CallState
- TranscriptionFormat, TranscriptionSegment
- Déjà dans une architecture propre

---

## 🔍 Types Analysis (Priorité 🟢 À VÉRIFIER)

```
Ligne 572: src/app/(protected)/analysis/types.ts
```

**À analyser:** Peut contenir des types généraux d'analyse

---

## 🔍 Types H2 (Priorité 🟢 DÉJÀ MIGRÉ)

```
Ligne 681: src/app/(protected)/analysis/components/H2/types.ts
Ligne 694: src/app/(protected)/analysis/components/H2RelationAnalysis/types.ts
```

**Statut:** Probablement déjà couvert par `src/types/entities/h2.entities.ts` ✅

---

## 📋 PLAN DE MIGRATION PAR PHASE

### Phase A: AlgorithmLab (45min)

**Fichiers sources:**
1. `h2Types.ts` → analyser et migrer vers `@/types/algorithm-lab/h2.ts`
2. `Level0Types.ts` → analyser et migrer vers `@/types/algorithm-lab/level0.ts`
3. `Level1Types.ts` → analyser et migrer vers `@/types/algorithm-lab/level1.ts`
4. `SharedTypes.ts` → analyser et migrer vers `@/types/algorithm-lab/shared.ts`
5. `ValidationTypes.ts` → analyser et migrer vers `@/types/algorithm-lab/validation.ts`

**Fichiers à consolider:**
- Types secondaires (FineTuning, ResultsSample, etc.) → intégrer dans les fichiers appropriés
- Créer `algorithms.ts` pour types de base consolidés
- Créer `level2.ts` si nécessaire

**Actions:**
1. Lire chaque fichier source
2. Comprendre les types et leurs dépendances
3. Créer la structure consolidée
4. Ajouter les barrel exports
5. Tester la compilation

### Phase B: TranscriptLPL (15min)

**Fichier source:**
- `src/components/TranscriptLPL/types.tsx`

**Destination:**
- `src/types/transcript-lpl/types.ts`
- `src/types/transcript-lpl/index.ts`

### Phase C: WorkDrive (10min)

**Fichier source:**
- `src/components/SimpleWorkdriveExplorer/types.tsx`

**Destination:**
- `src/types/workdrive/types.ts`
- `src/types/workdrive/index.ts`

### Phase D: UI (20min - optionnel)

**Créer de zéro:**
- `src/types/ui/tables.ts`
- `src/types/ui/filters.ts`
- `src/types/ui/forms.ts`
- `src/types/ui/index.ts`

---

## 🎯 ACTIONS IMMÉDIATES

Pour démarrer la migration complète, nous devons:

1. **Lire les fichiers sources** un par un pour comprendre leur contenu
2. **Consolider intelligemment** (éviter duplications)
3. **Créer la structure cible** avec barrel exports
4. **Tester la compilation** à chaque phase
5. **Documenter les changements** pour faciliter les futurs imports

---

## 📊 STATISTIQUES

| Catégorie | Fichiers sources | Fichiers cibles | Impact | Temps |
|-----------|-----------------|-----------------|---------|-------|
| AlgorithmLab | ~15 fichiers | 8 fichiers | 150+ imports | 45min |
| TranscriptLPL | 1 fichier | 2 fichiers | 20+ imports | 15min |
| WorkDrive | 1 fichier | 2 fichiers | 10+ imports | 10min |
| UI | 0 (à créer) | 4 fichiers | Variable | 20min |
| **TOTAL** | **~17 fichiers** | **16 fichiers** | **180+ imports** | **1h30** |

---

**Prochaine étape:** Commencer par lire et analyser les 5 fichiers types principaux d'AlgorithmLab
