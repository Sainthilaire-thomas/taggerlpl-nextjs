# 📋 SESSION: Restructuration Architecture TaggerLPL

**Date de début:** 2025-11-08  
**Objectif:** Réorganiser l'architecture du projet selon les 3 phases métier du workflow de thèse  
**Branche:** `refactor/architecture-phases`  
**Durée estimée:** 10-14h sur 3-4 jours  

---

## 🎯 Objectifs de la restructuration

### Problèmes actuels identifiés
1. ❌ Mélange navigation/composants dans `/src/components`
2. ❌ Features complètes (calls, TranscriptLPL, WorkDrive) mal placées
3. ❌ AlgorithmLab trop imbriqué dans analysis/components
4. ❌ Pas de séparation claire entre phases métier
5. ❌ Fichiers obsolètes à nettoyer

### Architecture cible
```
src/
├── app/                    # Navigation par phases de recherche
│   └── (protected)/
│       ├── phase1-corpus/
│       ├── phase2-annotation/
│       └── phase3-analysis/
│           ├── level0/
│           ├── level1/
│           └── level2/
├── features/               # Logique métier par phase
│   ├── phase1-corpus/
│   ├── phase2-annotation/
│   └── phase3-analysis/
└── components/             # UI réutilisable uniquement
```

---

## 📅 Plan de travail par étapes

### ✅ Étape 0: Préparation (30min) - EN COURS
- [x] Analyse structure actuelle
- [x] Proposition architecture cible
- [x] Documentation session
- [ ] Créer branche Git
- [ ] Setup preview Vercel
- [ ] Backup base de données (si nécessaire)

### 🔲 Étape 0.5: Solidification des Types TypeScript (1h30) ⭐ NOUVEAU
**Objectif:** Créer une source de vérité unique pour tous les types AVANT la migration

**Pourquoi maintenant:**
- ✅ Évite de migrer des types incohérents
- ✅ Facilite tous les futurs imports (`@/types`)
- ✅ Un seul changement d'imports au lieu de deux
- ✅ Auto-complétion parfaite pendant la migration
- ✅ Garantit cohérence avec le schéma Supabase

#### 0.5.1 Générer types Supabase (20min)
**Tâches:**
- [ ] Installer Supabase CLI: `npm install -g supabase`
- [ ] Récupérer PROJECT_ID depuis dashboard Supabase
- [ ] Créer script `scripts/generate-types.ts`
- [ ] Générer `src/types/database.types.ts` depuis Supabase
- [ ] Vérifier que les types sont corrects
- [ ] Ajouter script npm: `"generate:types": "ts-node scripts/generate-types.ts"`

**Commandes:**
```bash
# Générer types depuis Supabase cloud
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts

# Ou depuis connexion directe
npx supabase gen types typescript --db-url "postgresql://..." > src/types/database.types.ts
```

**Commit:** `feat(types): generate database types from Supabase`

#### 0.5.2 Créer types entités métier (30min)
**Objectif:** Types enrichis dérivés des types database

**Tâches:**
- [ ] Créer `src/types/entities/call.ts`
  - CallRow, CallInsert, CallUpdate (depuis database.types)
  - Call enrichi (avec duration, transcriptStatus, relations)
  - CallFilters, BulkCallAction
- [ ] Créer `src/types/entities/tag.ts`
  - LPLTagRow, LPLTagInsert
  - Tag enrichi (avec usageCount, examples)
  - TagFamily, TagsByFamily
- [ ] Créer `src/types/entities/turn.ts`
  - TurnTaggedRow, TurnTaggedInsert
  - TurnTagged enrichi (avec tagInfo, contexte)
  - TurnPair pour analyse
- [ ] Créer `src/types/entities/transcription.ts`
  - TranscriptRow, Word
  - Types enrichis pour UI
- [ ] Créer `src/types/entities/index.ts` (barrel export)

**Commit:** `feat(types): create enriched entity types`

#### 0.5.3 Créer types UI (20min)
**Objectif:** Types pour composants UI réutilisables

**Tâches:**
- [ ] Créer `src/types/ui/tables.ts`
  - TableColumn, TableSort, TablePagination
  - CallTableRow, TagTableRow (spécifiques)
- [ ] Créer `src/types/ui/filters.ts`
  - FilterOperator, FilterDefinition
  - ActiveFilters
- [ ] Créer `src/types/ui/forms.ts`
  - FormField, FormValidation
  - FormState
- [ ] Créer `src/types/ui/index.ts` (barrel export)

**Commit:** `feat(types): create UI component types`

#### 0.5.4 Créer types AlgorithmLab (20min)
**Objectif:** Types pour analyse scientifique

**Tâches:**
- [ ] Créer `src/types/algorithm-lab/algorithms.ts`
  - BaseAlgorithm, ClassifierResult, CalculatorResult
  - AlgorithmVersion, PerformanceMetrics
- [ ] Créer `src/types/algorithm-lab/results.ts`
  - RunResult, ValidationResult
  - ComparisonResult
- [ ] Créer `src/types/algorithm-lab/metrics.ts`
  - Metrics pour M1, M2, M3
  - StatisticalTests
- [ ] Créer `src/types/algorithm-lab/index.ts` (barrel export)

**Commit:** `feat(types): create algorithm-lab types`

#### 0.5.5 Créer barrel exports + tsconfig (10min)
**Objectif:** Import centralisé via `@/types`

**Tâches:**
- [ ] Créer `src/types/index.ts` principal
  - Export all from entities, ui, algorithm-lab
- [ ] Mettre à jour `tsconfig.json` avec paths:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/types": ["./src/types"],
        "@/types/*": ["./src/types/*"]
      }
    }
  }
  ```
- [ ] Tester auto-complétion: `import { Call, Tag } from '@/types'`
- [ ] Vérifier compilation: `npm run type-check`

**Commit:** `feat(types): setup barrel exports and tsconfig paths`

#### 0.5.6 Tests & Validation (10min)
**Tâches:**
- [ ] Compilation TypeScript OK: `npm run build`
- [ ] Aucune erreur d'imports
- [ ] Auto-complétion fonctionne dans VS Code
- [ ] Tester imports dans un fichier test
- [ ] Vérifier preview Vercel

**Validation:**
- [ ] `database.types.ts` généré et à jour
- [ ] Tous les types entities/ui/algorithm-lab créés
- [ ] Barrel exports fonctionnels
- [ ] tsconfig paths configurés
- [ ] Compilation sans erreurs

**Commit final:** `feat(types): complete TypeScript types solidification

- Generate database.types.ts from Supabase
- Create entity types (call, tag, turn, transcription)
- Create UI types (tables, filters, forms)
- Create AlgorithmLab types
- Setup barrel exports and tsconfig paths

This provides a single source of truth for all types before architecture migration.`

**📝 Documentation:** Voir `ETAPE_0.5_TYPES_SOLIDIFICATION.md` pour détails complets

---

### 🔲 Étape 1: Nettoyage fichiers obsolètes (30min)
**Objectif:** Supprimer les fichiers inutiles avant migration

**Fichiers à supprimer:**
- `src/components/CallManagementPage copy.tsx`
- `src/components/SimpleWorkdriveExplorer_old.tsx`
- `src/components/CallTableList_old.tsx`
- `src/supabaseClient_old.tsx`
- Autres fichiers `_old`, `copy`, ou `.backup`

**Tâches:**
- [ ] Identifier tous les fichiers obsolètes
- [ ] Vérifier qu'aucun import ne les référence
- [ ] Supprimer les fichiers
- [ ] Commit: `chore: clean up obsolete files`
- [ ] Push & vérifier preview Vercel

**Validation:**
- [ ] Compilation TypeScript OK
- [ ] Aucune erreur d'import
- [ ] Preview Vercel déployé

---

### 🔲 Étape 2: Phase 1 - Corpus (3-4h)

#### 2.1 Créer structure Phase 1 (30min)
**Tâches:**
- [ ] Créer `src/features/phase1-corpus/`
- [ ] Créer sous-dossiers: `calls/`, `transcription/`, `diarization/`, `workdrive/`
- [ ] Créer `src/app/(protected)/phase1-corpus/`
- [ ] Créer sous-routes: `import/`, `management/`, `workdrive/`, `transcription/`

**Commit:** `feat(phase1): create base structure for corpus phase`

#### 2.2 Migrer feature Calls (1h30)
**Objectif:** Déplacer `components/calls/` vers `features/phase1-corpus/calls/`

**Tâches:**
- [ ] Copier `src/components/calls/` → `src/features/phase1-corpus/calls/`
- [ ] Conserver structure DDD (domain/, infrastructure/, ui/, shared/)
- [ ] Créer script de mise à jour des imports
- [ ] Exécuter script de mise à jour des imports
- [ ] Vérifier compilation TypeScript
- [ ] Supprimer ancien répertoire `src/components/calls/`

**Fichiers impactés (estimation):**
- ~50-70 imports à mettre à jour
- Principalement dans app/(protected)/ et autres features

**Commit:** `refactor(phase1): migrate calls feature to phase1-corpus`

#### 2.3 Migrer feature WorkDrive (45min)
**Objectif:** Déplacer `SimpleWorkdriveExplorer/` vers `features/phase1-corpus/workdrive/`

**Tâches:**
- [ ] Copier `src/components/SimpleWorkdriveExplorer/` → `src/features/phase1-corpus/workdrive/`
- [ ] Mettre à jour imports
- [ ] Supprimer ancien répertoire
- [ ] Créer page `app/(protected)/phase1-corpus/workdrive/page.tsx`

**Commit:** `refactor(phase1): migrate workdrive feature to phase1-corpus`

#### 2.4 Migrer features Transcription & Diarization (45min)
**Objectif:** Extraire et organiser les services ASR/Diarization

**Tâches:**
- [ ] Créer `features/phase1-corpus/transcription/`
- [ ] Déplacer services depuis `calls/domain/services/Transcription*`
- [ ] Déplacer infrastructure ASR depuis `calls/infrastructure/asr/`
- [ ] Créer `features/phase1-corpus/diarization/`
- [ ] Déplacer services/infrastructure diarization
- [ ] Mettre à jour imports

**Commit:** `refactor(phase1): extract transcription and diarization features`

#### 2.5 Créer routes Phase 1 (30min)
**Objectif:** Créer les pages de navigation Phase 1

**Tâches:**
- [ ] Créer `app/(protected)/phase1-corpus/layout.tsx`
- [ ] Créer `app/(protected)/phase1-corpus/import/page.tsx` (CallImportPage)
- [ ] Créer `app/(protected)/phase1-corpus/management/page.tsx` (CallManagementPage)
- [ ] Créer `app/(protected)/phase1-corpus/workdrive/page.tsx`
- [ ] Créer `app/(protected)/phase1-corpus/transcription/page.tsx`
- [ ] Mettre à jour GlobalNavbar avec entrées Phase 1

**Commit:** `feat(phase1): create navigation routes for corpus phase`

#### 2.6 Tests & Validation Phase 1 (30min)
**Tâches:**
- [ ] Tester import d'appels
- [ ] Tester WorkDrive Explorer
- [ ] Tester gestion des appels
- [ ] Vérifier tous les liens de navigation
- [ ] Vérifier preview Vercel

**Validation:**
- [ ] Toutes les pages Phase 1 accessibles
- [ ] Aucune erreur console
- [ ] Compilation TypeScript OK
- [ ] Preview Vercel fonctionnel

**Commit:** `test(phase1): validate corpus phase migration`

---

### 🔲 Étape 3: Phase 2 - Annotation (2-3h)

#### 3.1 Créer structure Phase 2 (20min)
**Tâches:**
- [ ] Créer `src/features/phase2-annotation/`
- [ ] Créer sous-dossiers: `transcript/`, `tags/`, `turns/`, `supervision/`, `inter-annotator/`
- [ ] Créer `src/app/(protected)/phase2-annotation/`
- [ ] Créer sous-routes

**Commit:** `feat(phase2): create base structure for annotation phase`

#### 3.2 Migrer feature TranscriptLPL (1h)
**Objectif:** Déplacer `TranscriptLPL/` vers `features/phase2-annotation/transcript/`

**Tâches:**
- [ ] Copier `src/components/TranscriptLPL/` → `src/features/phase2-annotation/transcript/`
- [ ] Conserver structure (components/, hooks/, types.tsx)
- [ ] Mettre à jour imports
- [ ] Supprimer ancien répertoire

**Commit:** `refactor(phase2): migrate TranscriptLPL to phase2-annotation`

#### 3.3 Organiser gestion des Tags (45min)
**Objectif:** Créer feature dédiée pour gestion des tags

**Tâches:**
- [ ] Créer `features/phase2-annotation/tags/`
- [ ] Déplacer composants tags depuis components/ vers tags/ui/components/:
  - TagEditor.tsx
  - TagSelector.tsx
  - TagTreeView.tsx
  - TagStats.tsx
- [ ] Créer services si nécessaire
- [ ] Mettre à jour imports

**Commit:** `refactor(phase2): organize tag management feature`

#### 3.4 Créer features Supervision & Inter-Annotateur (30min)
**Tâches:**
- [ ] Créer `features/phase2-annotation/supervision/`
- [ ] Créer `features/phase2-annotation/inter-annotator/`
- [ ] Créer structures de base (domain/services, ui/components)
- [ ] Documenter TODO pour futures implémentations

**Commit:** `feat(phase2): create supervision and inter-annotator features`

#### 3.5 Créer routes Phase 2 (30min)
**Tâches:**
- [ ] Créer `app/(protected)/phase2-annotation/layout.tsx`
- [ ] Créer `app/(protected)/phase2-annotation/transcript/[callId]/page.tsx` (TaggerLPL)
- [ ] Créer `app/(protected)/phase2-annotation/tags-management/page.tsx`
- [ ] Créer `app/(protected)/phase2-annotation/supervision/page.tsx`
- [ ] Créer `app/(protected)/phase2-annotation/inter-annotator/page.tsx`
- [ ] Mettre à jour GlobalNavbar

**Commit:** `feat(phase2): create navigation routes for annotation phase`

#### 3.6 Tests & Validation Phase 2 (20min)
**Tâches:**
- [ ] Tester TranscriptLPL
- [ ] Tester navigation entre pages
- [ ] Vérifier preview Vercel

**Validation:**
- [ ] Interface de tagging fonctionnelle
- [ ] Toutes les pages Phase 2 accessibles
- [ ] Compilation TypeScript OK

**Commit:** `test(phase2): validate annotation phase migration`

---

### 🔲 Étape 4: Phase 3 - Analysis (3-4h)

#### 4.1 Créer structure Phase 3 (30min)
**Tâches:**
- [ ] Créer `src/features/phase3-analysis/`
- [ ] Créer sous-dossiers: `level0-gold/`, `level1-validation/`, `level2-hypotheses/`
- [ ] Créer `src/app/(protected)/phase3-analysis/`
- [ ] Créer sous-routes: `level0/`, `level1/`, `level2/`

**Commit:** `feat(phase3): create base structure for analysis phase`

#### 4.2 Migrer AlgorithmLab vers Level 1 (2h)
**Objectif:** Déplacer tout AlgorithmLab vers `features/phase3-analysis/level1-validation/`

**Tâches:**
- [ ] Copier `app/(protected)/analysis/components/AlgorithmLab/` 
- [ ] Destination: `features/phase3-analysis/level1-validation/`
- [ ] Organiser en sous-dossiers:
  - `algorithms/` (tous les algos)
  - `ui/components/` (composants UI)
  - `domain/services/` (services métier)
  - `shared/` (types, utils)
- [ ] Mettre à jour tous les imports (beaucoup!)
- [ ] Supprimer ancien répertoire

**Fichiers impactés (estimation):**
- ~100-150 fichiers à déplacer
- ~200-300 imports à mettre à jour

**Commit:** `refactor(phase3): migrate AlgorithmLab to level1-validation`

#### 4.3 Créer structures Level 0 & Level 2 (45min)
**Tâches:**
- [ ] Créer `features/phase3-analysis/level0-gold/`
  - domain/services/
  - ui/components/
- [ ] Créer `features/phase3-analysis/level2-hypotheses/`
  - h1/, h2/, statistics/, reports/
  - domain/services/ dans chaque
  - ui/components/ dans chaque
- [ ] Documenter TODO pour futures implémentations

**Commit:** `feat(phase3): create level0 and level2 structures`

#### 4.4 Créer routes Phase 3 (45min)
**Tâches:**
- [ ] Créer `app/(protected)/phase3-analysis/layout.tsx`
- [ ] Créer routes Level 0:
  - `level0/gold-creation/page.tsx`
  - `level0/inter-annotator/page.tsx`
  - `level0/page.tsx` (dashboard)
- [ ] Créer routes Level 1:
  - `level1/algorithm-lab/page.tsx`
  - `level1/comparison/page.tsx`
  - `level1/alignment/page.tsx`
  - `level1/versions/page.tsx`
  - `level1/page.tsx` (dashboard)
- [ ] Créer routes Level 2:
  - `level2/h1-validation/page.tsx`
  - `level2/h2-mediation/page.tsx`
  - `level2/statistics/page.tsx`
  - `level2/reports/page.tsx`
  - `level2/page.tsx` (dashboard)
- [ ] Mettre à jour GlobalNavbar avec structure complète

**Commit:** `feat(phase3): create navigation routes for analysis phase (3 levels)`

#### 4.5 Tests & Validation Phase 3 (30min)
**Tâches:**
- [ ] Tester AlgorithmLab
- [ ] Vérifier tous les algorithmes s'exécutent
- [ ] Tester navigation entre levels
- [ ] Vérifier preview Vercel

**Validation:**
- [ ] AlgorithmLab fonctionnel
- [ ] Tous les algos accessibles
- [ ] Navigation 3 levels OK
- [ ] Compilation TypeScript OK

**Commit:** `test(phase3): validate analysis phase migration`

---

### 🔲 Étape 5: Nettoyer components/ (1-2h)

#### 5.1 Réorganiser components UI (1h)
**Objectif:** Garder uniquement composants réutilisables

**Tâches:**
- [ ] Créer `src/components/ui/` (Button, Dialog, Table, Input)
- [ ] Créer `src/components/layout/` (DeleteConfirmationDialog, SnackBarManager)
- [ ] Créer `src/components/auth/` (AuthButton, AuthStatus)
- [ ] Créer `src/components/filters/` (FilterInput)
- [ ] Créer `src/components/data-viz/` (graphiques réutilisables)
- [ ] Déplacer composants concernés
- [ ] Supprimer composants de pages (ArrivalTable, DepartureTable, etc.)
- [ ] Mettre à jour imports

**Commit:** `refactor(components): reorganize UI components by category`

#### 5.2 Créer utils/ global (30min)
**Tâches:**
- [ ] Créer `src/utils/`
- [ ] Créer sous-dossiers: `api/`, `validation/`, `transforms/`
- [ ] Déplacer utils depuis `components/utils/` vers catégories appropriées
- [ ] Mettre à jour imports

**Commit:** `refactor: create global utils directory`

#### 5.3 Validation finale (30min)
**Tâches:**
- [ ] Vérifier qu'il ne reste QUE des composants UI réutilisables dans components/
- [ ] Vérifier compilation complète
- [ ] Tester toutes les pages principales
- [ ] Vérifier preview Vercel

**Commit:** `refactor: finalize components cleanup`

---

### 🔲 Étape 6: Documentation & Finalisation (1h)

#### 6.1 Mettre à jour documentation (30min)
**Tâches:**
- [ ] Mettre à jour README.md avec nouvelle structure
- [ ] Créer ARCHITECTURE.md détaillé
- [ ] Mettre à jour doc/AlgorithmLab/ si nécessaire
- [ ] Documenter conventions de nommage
- [ ] Créer guide de contribution aligné sur phases

**Commit:** `docs: update documentation for new architecture`

#### 6.2 Créer scripts utiles (30min)
**Tâches:**
- [ ] Script de validation de structure
- [ ] Script de détection de fichiers orphelins
- [ ] Script de génération de documentation auto

**Commit:** `chore: add architecture validation scripts`

---

## 🔧 Commandes Git

### Initialisation
```bash
# Créer et basculer sur la branche
git checkout -b refactor/architecture-phases

# Premier commit avec docs
git add docs/architecture/
git commit -m "docs: add architecture refactoring session plan"
git push origin refactor/architecture-phases
```

### Workflow par étape
```bash
# Après chaque étape validée
git add .
git commit -m "[type(scope)]: description"
git push origin refactor/architecture-phases

# Vérifier preview Vercel
# URL: https://taggerlpl-{hash}-thomas-account.vercel.app
```

### Merge final (après validation complète)
```bash
git checkout main
git merge refactor/architecture-phases
git push origin main
```

---

## 📊 Suivi de progression

### Préparation
- [ ] 0: Préparation (branche, Vercel, backup)
- [ ] 0.5.1: Générer types Supabase
- [ ] 0.5.2: Créer types entités
- [ ] 0.5.3: Créer types UI
- [ ] 0.5.4: Créer types AlgorithmLab
- [ ] 0.5.5: Barrel exports + tsconfig
- [ ] 0.5.6: Tests validation types
- [ ] 1: Nettoyage fichiers obsolètes

### Phase 1: Corpus
- [ ] 2.1 Structure créée
- [ ] 2.2 Calls migré
- [ ] 2.3 WorkDrive migré
- [ ] 2.4 Transcription/Diarization migrés
- [ ] 2.5 Routes créées
- [ ] 2.6 Tests validés

### Phase 2: Annotation
- [ ] 3.1 Structure créée
- [ ] 3.2 TranscriptLPL migré
- [ ] 3.3 Tags organisés
- [ ] 3.4 Supervision/Inter-annotateur créés
- [ ] 3.5 Routes créées
- [ ] 3.6 Tests validés

### Phase 3: Analysis
- [ ] 4.1 Structure créée
- [ ] 4.2 AlgorithmLab migré
- [ ] 4.3 Level0/Level2 créés
- [ ] 4.4 Routes créées
- [ ] 4.5 Tests validés

### Finalisation
- [ ] 5.1 Components réorganisés
- [ ] 5.2 Utils créés
- [ ] 5.3 Validation finale
- [ ] 6.1 Documentation à jour
- [ ] 6.2 Scripts créés

---

## 🚨 Points d'attention

### Imports TypeScript
- Utiliser search & replace intelligent
- Vérifier les imports relatifs vs absolus
- Utiliser tsconfig paths si nécessaire

### Tests
- Tester après chaque migration majeure
- Ne pas avancer si compilation échoue
- Vérifier preview Vercel à chaque push

### Contextes & Providers
- Vérifier que les contextes restent accessibles
- Attention aux dépendances circulaires
- Valider TaggingDataContext après Phase 2

### Base de données
- Aucune modification de schéma prévue
- Seulement restructuration code
- Backup recommandé par précaution

---

## 📝 Notes de session

### Session 1 (2025-11-08)
- ✅ Analyse structure actuelle
- ✅ Proposition architecture cible
- ✅ Documentation session créée
- ⏳ Création branche Git
- ⏳ Setup preview Vercel

### Session 2
_À compléter lors de la prochaine session_

### Session 3
_À compléter lors de la prochaine session_

---

## 🎯 Critères de succès

### Technique
- [ ] Compilation TypeScript sans erreurs
- [ ] Aucun warning d'imports manquants
- [ ] Preview Vercel fonctionnel
- [ ] Toutes les pages accessibles
- [ ] Aucune régression fonctionnelle

### Architecture
- [ ] Structure reflète workflow de recherche (3 phases)
- [ ] Features isolées par concern métier
- [ ] Composants UI vraiment réutilisables
- [ ] Navigation intuitive
- [ ] Documentation à jour

### Métier
- [ ] Workflow Phase 1 → Phase 2 → Phase 3 fluide
- [ ] AlgorithmLab accessible et fonctionnel
- [ ] TranscriptLPL fonctionnel
- [ ] Import/Gestion appels OK
- [ ] Niveaux Level 0/1/2 bien séparés

---

## 📞 Contact & Support

**Responsable:** Thomas  
**Équipe:** [Ajouter collaborateurs]  
**Documentation:** `/docs/architecture/`  
**Branche:** `refactor/architecture-phases`  
**Vercel Preview:** [URL à ajouter après setup]

---

**Dernière mise à jour:** 2025-11-08  
**Statut:** 🟡 En cours - Étape 0
