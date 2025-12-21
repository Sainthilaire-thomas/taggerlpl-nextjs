# 📋 Mission Level 0 - Sprint 5 : Système de Gestion des Chartes

**Date création** : 2025-12-20  
**Objectif** : Système complet d'édition, tuning et versioning des chartes d'annotation  
**Durée estimée** : 13h (4 sessions)

---

## 🎯 VISION & OBJECTIFS

### Problème à Résoudre

Actuellement :
- ❌ Le LLM génère des tags invalides (ex: `CLIENT_NON_POSITIF`)
- ❌ Pas d'interface pour éditer les chartes (catégories, exemples, règles)
- ❌ Tuning manuel fastidieux et non tracé
- ❌ Pas de workflow suggestion → validation → amélioration

### Solution Sprint 5

Un système intégré qui :
1. ✅ Permet d'éditer toutes les parties d'une charte (UI complète)
2. ✅ Détecte automatiquement patterns dans validations
3. ✅ Génère suggestions d'amélioration basées sur données
4. ✅ Historise modifications pour traçabilité scientifique
5. ✅ Facilite cycle itératif de fine-tuning

---

## 📅 AVANCEMENT

### ✅ Session 1 : Infrastructure SQL (2h) - 2025-12-20 Matin

**Objectif** : Créer tables + fonctions pour système tuning

#### Accompli

**1. Tables SQL créées** (3 nouvelles)
```sql
- charte_modifications        ✅ Historique complet modifications
- charte_improvement_suggestions  ✅ Suggestions automatiques
- charte_category_stats       ✅ Stats par catégorie
```

**2. Fonctions SQL créées** (2 intelligentes)
```sql
- calculate_category_stats()          ✅ Calcul stats automatique
- generate_improvement_suggestions()  ✅ Détection patterns
```

**3. Trigger créé**
```sql
- update_level0_chartes_timestamp  ✅ Auto-update updated_at
```

**4. Migration 008 exécutée**
- ✅ Toutes tables créées
- ✅ Indexes optimisés
- ✅ Contraintes validées

**5. Test manuel workflow SQL**
- ✅ 3 validations CharteY_B analysées
- ✅ Pattern détecté : CLIENT_NEUTRE ↔ CLIENT_POSITIF
- ✅ 1 suggestion créée manuellement (ID: 26f52463...)
- ✅ Workflow apply → validate → rollback testé

**Temps réel** : 2h  
**Statut** : ✅ **100% Complet**

---

### ✅ Session 2 : Services TypeScript (1h30) - 2025-12-20 Après-midi

**Objectif** : Créer services pour manipuler suggestions depuis app

#### Accompli

**1. Types créés** (tuning.ts - 12 interfaces)
```typescript
- SuggestionStatus, SuggestionType, ModificationType
- CharteSuggestion, CategoryStats, CharteModification
- Paramètres: GetSuggestionsParams, ApplySuggestionParams, etc.
- Résultats: SuggestionOperationResult, CharteOperationResult
```

**2. Services créés** (2 singletons)
```typescript
- CharteTuningService     ✅ 9 méthodes (suggestions)
- CharteEditionService    ✅ 7 méthodes (édition/versioning)
```

**3. Architecture corrigée**
- ✅ Types dans `src/types/algorithm-lab/core/tuning.ts`
- ✅ Services dans `src/features/phase3-analysis/level0-gold/domain/services/`
- ✅ Import Supabase via `getSupabase()` (architecture projet)
- ✅ Export centralisé via `algorithm-lab/index.ts`

**4. Validation**
- ✅ Compilation TypeScript : 25.0s, 0 erreur
- ✅ Build Next.js : 33/33 pages
- ✅ Commit Git : ddccbf7 (1377 lignes ajoutées)

**Temps réel** : 1h30  
**Statut** : ✅ **100% Complet**

---

### ✅ Session 3 : UI Components Base (1h30) - 2025-12-20 Soir

**Objectif** : Créer composants UI pour affichage suggestions

#### Accompli

**1. Composants UI créés** (4 fichiers)
```typescript
- SuggestionCard.tsx       ✅ Carte affichage suggestion (430 lignes)
- SuggestionList.tsx       ✅ Liste + filtres/tri/pagination
- CategoryStatsPanel.tsx   ✅ Stats par catégorie + détection problèmes
- CharteTuningPanel.tsx    ✅ Interface principale tuning
- index.ts                 ✅ Exports
```

**2. Features implémentées**
- ✅ SuggestionCard : Priority badges, expand details, actions conditionnelles
- ✅ SuggestionList : Filtres (status, priority), recherche, tri, pagination
- ✅ CategoryStatsPanel : Table stats, détection accuracy < 50%
- ✅ CharteTuningPanel : Tabs suggestions/stats, boutons actions

**3. Intégration Level0Interface**
- ✅ Nouvel onglet "🔧 Tuning" ajouté
- ✅ CharteTuningPanel intégré
- ✅ Compilation OK

**4. Problème identifié** ⚠️
```
❌ Tuning sans contexte : On ne sait pas quelle charte on tune
❌ Hiérarchie incorrecte : Tuning au même niveau que Tests
❌ Workflow cassé : Pas de sélection charte avant tuning
❌ Édition manuelle absente : Impossible de modifier définitions
```

**5. Solution définie**
→ **SPEC_CHARTE_MANAGEMENT_UI.md** créée  
→ Architecture corrigée : "Gestion Chartes" = sidebar + [édition|tuning|historique]

**Temps réel** : 1h30  
**Statut** : ✅ **Complet mais nécessite refactoring (Session 4)**

---

### ⏸️ Session 4 : CharteManagement UI (5h30) - À VENIR

**Objectif** : Créer système complet édition/tuning avec navigation claire

#### Plan Détaillé

**Architecture cible** :
```
Tab "Gestion Chartes" {
  Sidebar: Liste chartes (filtrable par variable)
  Main Area: {
    Header: Nom charte + sous-onglets
    Content: [Édition | Tuning | Historique]
  }
}
```

#### Composants à créer

**1. Structure & Navigation (1h30)**
```typescript
- CharteManagementLayout.tsx   ← Container principal (sidebar + main)
- CharteSidebar.tsx           ← Sélection charte + filtre variable
- CharteHeader.tsx            ← Nom charte + sous-onglets
```

**2. Édition Complète (2h30)**
```typescript
- CharteDefinitionEditor.tsx  ← Éditeur 6 onglets
  ├─ Métadonnées
  ├─ Catégories ⭐ (LE PLUS COMPLEXE - 1h30)
  ├─ Aliases (réutiliser CharteManager existant)
  ├─ Règles
  ├─ Paramètres LLM
  └─ Template Prompt
```

**3. Historique (45 min)**
```typescript
- CharteVersionHistory.tsx    ← Timeline versions + modifications
```

**4. Intégration (45 min)**
- Modifier Level0Interface (supprimer tab tuning standalone)
- Intégrer CharteManagementLayout dans tab "chartes"
- Modifier CharteTuningPanel (props charteId obligatoire)
- Tests workflow complet

**5. Tests & Debug (30 min)**
- Test création charte
- Test édition → sauvegarde nouvelle version
- Test tuning → apply suggestion
- Test historique

#### MVP vs Polish

**MVP (4h)** - Obligatoire :
- Structure + Navigation ✅
- Édition basique (Métadonnées + Aliases) ✅
- Intégration tuning ✅

**Polish (1h30)** - Si temps :
- Édition avancée (Catégories, Règles, LLM, Prompt)
- Historique complet
- UX improvements

**Temps estimé** : 5h30  
**Statut** : ⏸️ **Planifié**

---

## 📊 RÉCAPITULATIF SPRINT 5

### Progression Globale

```
Session 1 (2h)    : ████████████████████ 100% ✅ Infrastructure SQL
Session 2 (1h30)  : ████████████████████ 100% ✅ Services TypeScript
Session 3 (1h30)  : ████████████████████ 100% ✅ UI Components Base
─────────────────────────────────────────────────────────────────
Session 4 (5h30)  : ░░░░░░░░░░░░░░░░░░░░   0% ⏸️  CharteManagement UI
```

**Accompli** : 5h / 10h30 = **48% complété** ✅  
**Restant** : 5h30 (Session 4)

---

### État Actuel Système

#### ✅ Backend (100%)
- **SQL** : 3 tables, 2 fonctions, 1 trigger
- **TypeScript** : 12 types, 16 méthodes (2 services)
- **Données** : 1 suggestion réelle testée

#### ✅ Frontend Base (100%)
- **Components** : 4 composants tuning créés
- **Integration** : Onglet tuning fonctionnel
- **Validation** : Compilation OK

#### ⏸️ Frontend Management (0%)
- **Édition chartes** : Pas d'UI
- **Navigation** : Architecture incorrecte
- **Workflow** : Incomplet

---

## 🎯 OBJECTIFS SESSION 4

### Must Have (MVP - 4h)

**1. Navigation claire** ✅
- User sait toujours quelle charte est sélectionnée
- Sidebar → Main area fluide
- Sous-onglets intuitifs

**2. Édition basique fonctionnelle** ✅
- Modification métadonnées
- Gestion aliases
- Sauvegarde nouvelle version

**3. Tuning intégré correctement** ✅
- CharteTuningPanel avec contexte clair
- Workflow apply → test → validate complet

### Nice to Have (Polish - 1h30)

**4. Édition avancée**
- Catégories : add/edit/remove exemples
- Règles : sliders + switches
- LLM : paramètres température etc.
- Template : editor Handlebars

**5. Historique**
- Timeline versions
- Comparaison versions
- Rollback

---

## 🔄 WORKFLOWS CIBLES

### Workflow 1 : Édition Manuelle

```
User → Gestion Chartes
     → Sidebar : Sélectionne CharteY_B
     → Sous-onglet "Édition"
     → Modifie catégorie CLIENT_NEUTRE
     → Clique "Sauvegarder v1.1.0"
     → Système crée nouvelle version ✅
     → User peut tester v1.1.0
```

### Workflow 2 : Tuning Automatique

```
User → Run test CharteY_B v1.0.0
     → Valide 5 désaccords
     → Gestion Chartes → CharteY_B
     → Sous-onglet "Tuning"
     → Clique "Générer suggestions" ✅
     → Voit : "CLIENT_NON_POSITIF détecté 3×"
     → Clique "Appliquer" ✅
     → Système crée v1.1.0 avec alias
     → User re-teste v1.1.0
     → Kappa : 0.65 → 0.80 ✅
     → Clique "Valider définitivement" ✅
```

### Workflow 3 : Suggestion → Modification Manuelle

```
User → Tuning → Voit suggestion "Clarifier CLIENT_NEUTRE"
     → Clique "Modifier manuellement"
     → Système ouvre sous-onglet "Édition"
     → Pré-remplit modification suggérée
     → User ajuste + ajoute autres modifs
     → Sauvegarde v1.1.0 ✅
```

---

## 📁 STRUCTURE FINALE FICHIERS

```
src/features/phase3-analysis/level0-gold/
├── domain/
│   └── services/
│       ├── CharteTuningService.ts      ✅ Créé Session 2
│       ├── CharteEditionService.ts     ✅ Créé Session 2
│       └── ...
│
├── presentation/
│   └── components/
│       ├── chartes/                    ⏸️ À créer Session 4
│       │   ├── CharteManagementLayout.tsx
│       │   ├── CharteSidebar.tsx
│       │   ├── CharteHeader.tsx
│       │   ├── CharteDefinitionEditor.tsx
│       │   ├── CharteVersionHistory.tsx
│       │   └── index.ts
│       │
│       └── tuning/                     ✅ Créé Session 3
│           ├── SuggestionCard.tsx
│           ├── SuggestionList.tsx
│           ├── CategoryStatsPanel.tsx
│           ├── CharteTuningPanel.tsx
│           └── index.ts

src/types/algorithm-lab/
└── core/
    └── tuning.ts                       ✅ Créé Session 2
```

---

## ✅ CRITÈRES DE VALIDATION FINALE

### Fonctionnels
- [ ] Sélection charte dans sidebar → contexte clair partout
- [ ] Édition métadonnées + aliases → sauvegarde v1.1.0
- [ ] Génération suggestions automatiques fonctionne
- [ ] Application suggestion → crée nouvelle version
- [ ] Re-test → validation/rollback suggestion
- [ ] Historique affiche toutes versions

### Ergonomiques
- [ ] Navigation intuitive (pas de confusion)
- [ ] User sait toujours quelle charte
- [ ] Feedback visuel sur toutes actions
- [ ] Pas de dead ends (toujours action possible)

### Techniques
- [ ] Compilation TypeScript 0 erreur
- [ ] Build Next.js réussi
- [ ] Pas de props drilling excessif
- [ ] Services réutilisés proprement
- [ ] Gestion erreurs robuste

### Scientifiques
- [ ] Traçabilité complète modifications
- [ ] Versioning automatique
- [ ] Amélioration Kappa mesurable
- [ ] Système supporte cycles itératifs

---

## 📊 MÉTRIQUES DE SUCCÈS

### Immédiat (Post-Session 4)
- [ ] 1 édition manuelle complète testée
- [ ] 1 suggestion appliquée et validée
- [ ] 1 nouvelle version créée et testée
- [ ] Historique affiche modifications

### Court Terme (1 semaine)
- [ ] 3+ versions CharteY_B créées
- [ ] Kappa amélioré de +0.10 minimum
- [ ] 5+ suggestions générées automatiquement
- [ ] 80%+ suggestions appliquées

### Moyen Terme (Thèse)
- [ ] Historique complet tuning documenté
- [ ] Graphiques évolution Kappa par version
- [ ] Export CSV pour annexe scientifique
- [ ] Validation reproductibilité améliorée

---

## 🚀 PROCHAINES ÉVOLUTIONS (Post-Sprint 5)

### Phase 1 : Normalisation Automatique
- Appliquer aliases automatiquement à la sauvegarde
- Fonction `normalize_tag_with_charte()` dans services

### Phase 2 : Suggestions Avancées
- Détection catégories à fusionner (distance inter-catégories)
- Suggestions règles (context_included, examples_per_category)
- Optimisation temperature/top_p basée sur confidence

### Phase 3 : Tests A/B Automatisés
- Comparaison auto v1.0.0 vs v1.1.0 (même échantillon)
- Rapport impact avec visualisations
- Détection régression automatique

### Phase 4 : Export Publication
- Documentation scientifique modifications
- Export CSV historique (annexe thèse)
- Graphiques évolution Kappa

---

## 📝 NOTES & APPRENTISSAGES

### Session 1 (SQL)
- ✅ Fonctions SQL intelligentes = gain temps énorme
- ✅ supporting_data JSONB = flexibilité maximale
- ✅ Test manuel avant code = validation workflow

### Session 2 (Services)
- ✅ Architecture projet réelle > specs théoriques
- ✅ Import Supabase via getSupabase() spécifique
- ✅ Singleton pattern pour services

### Session 3 (UI Base)
- ✅ Composants créés rapidement (4 fichiers, 1h30)
- ⚠️ Test visuel révèle problème architecture
- ✅ Spec complète AVANT code = gain temps énorme

### Leçon Principale
**Spécifier l'ensemble du système AVANT de coder** évite refactoring coûteux. Session 3 aurait dû commencer par la spec complète CharteManagement, pas juste CharteTuningPanel isolé.

---

## 📚 DOCUMENTS ASSOCIÉS

- **SPECS_CHARTE_TUNING_SYSTEM.md** : Specs initiales (backend focus)
- **SPEC_CHARTE_MANAGEMENT_UI.md** : Specs UI complètes (Session 4)
- **ARCHITECTURE_TABLES_FLUX_LEVEL0.md** : Architecture base données
- **MISSION_SPRINT4_v5_2025-12-19.md** : Contexte Gold Standards

---

**Document créé** : 2025-12-20  
**Version** : 1.0  
**Auteur** : Claude & Thomas  
**Dernière MàJ** : 2025-12-20 20:00  
**Statut** : En cours (Session 4 à venir)
