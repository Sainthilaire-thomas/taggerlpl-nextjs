# MISSION SPRINT 5 - Système de Tuning et Gestion Chartes Level 0

**Version** : 2.0  
**Date** : 2025-12-21  
**Durée totale** : 10h30  
**Avancement** : 85% (9h/10h30)

---

## 🎯 OBJECTIF SPRINT 5

Créer un **système complet de tuning des chartes d'annotation** Level 0 avec :
1. ✅ Backend SQL (tables suggestions, modifications, stats)
2. ✅ Services TypeScript (génération, application, traçabilité)
3. ✅ UI de tuning (suggestions, validation, application)
4. ✅ Éditeurs de chartes (catégories, aliases, règles, LLM)
5. ⏳ **Éditeur prompt inline WYSIWYG** (Session 5)

---

## ✅ SESSION 1 : Backend SQL (2h) - TERMINÉE

### Réalisations
- [x] Table `charte_modifications` (traçabilité complète)
- [x] Table `charte_improvement_suggestions` (suggestions automatiques)
- [x] Table `charte_category_stats` (statistiques par catégorie)
- [x] Index optimisés
- [x] Triggers mise à jour automatique

### Fichiers créés
- `003_charte_tuning_system.sql`

### Validation
- ✅ 100% tests SQL passés
- ✅ Contraintes FK validées
- ✅ Performance vérifiée (< 50ms)

---

## ✅ SESSION 2 : Services TypeScript (2h30) - TERMINÉE

### Réalisations
- [x] `CharteTuningService` (génération suggestions)
- [x] `CharteEditionService` (versioning, modifications)
- [x] `CharteManagementService` (CRUD chartes)
- [x] Types complets (tuning, modifications, suggestions)

### Fichiers créés
- `CharteTuningService.ts` (450 lignes)
- `CharteEditionService.ts` (550 lignes)
- `types/core/tuning.ts` (200 lignes)

### Validation
- ✅ Tests unitaires (mock Supabase)
- ✅ Compilation TypeScript OK
- ✅ Couverture types 100%

---

## ✅ SESSION 3 : UI Tuning de base (2h) - TERMINÉE

### Réalisations
- [x] `CharteTuningPanel` (conteneur principal)
- [x] `SuggestionCard` (affichage suggestion)
- [x] `SuggestionList` (liste filtrable)
- [x] `CategoryStatsPanel` (stats par catégorie)
- [x] Actions (Appliquer, Rejeter, Éditer)

### Fichiers créés
- `tuning/CharteTuningPanel.tsx`
- `tuning/SuggestionCard.tsx`
- `tuning/SuggestionList.tsx`
- `tuning/CategoryStatsPanel.tsx`
- `tuning/index.ts`

### Validation
- ✅ UI fonctionnelle
- ✅ Chargement suggestions OK
- ✅ Statistiques temps réel

---

## ✅ SESSION 4 : Enrichissement CharteManager + Éditeurs (4h) - TERMINÉE

### Réalisations principales

#### 1. CharteManager enrichi
- [x] Sélection charte avec highlight
- [x] Zone détails sous tableau
- [x] 6 tabs (Aliases, Catégories, Règles, LLM, Tuning, Historique)
- [x] Intégration CharteTuningPanel

#### 2. Éditeurs complets créés
- [x] **CharteCategoriesEditor** (300 lignes)
  - Accordion par catégorie
  - Édition descriptions + exemples
  - Versioning automatique (1.0.0 → 1.1.0)
  - Validation (description non vide, min 1 exemple)

- [x] **CharteAliasesEditor** (220 lignes)
  - Liste aliases existants
  - Ajout/suppression
  - Sauvegarde simple (pas de versioning)

- [x] **CharteRulesEditor** (240 lignes)
  - Select approach (few-shot / zero-shot)
  - Switch context_included
  - Slider examples_per_category (0-10)
  - Versioning automatique

- [x] **CharteLLMParamsEditor** (290 lignes)
  - Slider temperature (0-2)
  - Slider top_p (0-1)
  - Slider max_tokens (50-500)
  - Descriptions dynamiques
  - Versioning automatique

#### 3. Documentation exhaustive
- [x] **DOCUMENTATION_STRUCTURE_CHARTES.md** (500+ lignes)
  - Structure BDD → UI → LLM
  - Workflow annotation complet
  - FAQ et exemples

- [x] **ADR_006_gestion_exemples_chartes.md**
  - Décision few-shot vs zero-shot
  - Insight LLM vs regex
  - Hypothèse H0-extension

- [x] **SESSION_4_NOTES_WRAPUP.md**
  - Notes session
  - Insights clés
  - Prochaines étapes

### Insights majeurs Session 4

#### 🎓 Insight 1 : Paradoxe exemples LLM
> *"Le risque des exemples est de faire le LLM se comporter comme un regex, alors qu'il vaut mieux faire un focus sur la description pour tirer tout le bénéfice d'un LLM par rapport à un regex."*

**Implication recherche** :
- Hypothèse H0-extension : Description riche (zero-shot) > Exemples multiples (few-shot)
- Tests A/B prévus : CharteY_ZeroShot vs CharteY_FewShot
- Mesure : Kappa, Accuracy, Confusion

#### 💡 Insight 2 : Opacité structure prompt
**Problèmes identifiés** :
1. Partie globale prompt non éditable
2. Pas de vue d'ensemble du prompt final
3. Naming "Catégories" ne reflète pas l'usage
4. Source contexte non claire

**Solution proposée** : Éditeur prompt inline WYSIWYG (Session 5)

#### 🗄️ Insight 3 : Source données confirmée
**Verbatim analysé** : `analysis_pairs` (source unique de vérité)
**Résultats LLM** : `annotations` (table dédiée avec FK)
**Contexte** : `prev1/prev2/prev3/next1/next2/next3` dans analysis_pairs

---

## 🚧 SESSION 5 : Éditeur Prompt Inline WYSIWYG (PROCHAINE - 2h estimé)

### Objectif

Créer **éditeur prompt inline** avec zones éditables au clic + preview temps réel.

### Architecture retenue (ADR 007)

**Principe** : Vue linéaire WYSIWYG du prompt final

```
╔══════════════════════════════════════╗
║ [System Instructions]                ║  ← Clic → Édition
║ Vous êtes un expert...              ║
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ [Task Description]                   ║  ← Clic → Édition
║ Classifiez la réaction...           ║
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ [Preprocessing]                      ║  ← Clic → Édition
║ Ignorez [AP], [T], (???)            ║  ← NOUVEAU
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ [Definitions]                        ║  ← AUTO-GÉNÉRÉ
║ - CLIENT_POSITIF : ...              ║    [Éditer catégories]
╚══════════════════════════════════════╝

╔══════════════════════════════════════╗
║ [Output Format]                      ║  ← Clic → Édition
║ Répondez uniquement...              ║
╚══════════════════════════════════════╝
```

### Sections extensibles (13 identifiées)

#### Requises (3)
1. Task Description
2. Definitions (auto-généré)
3. Output Format

#### Optionnelles (10)
4. System Instructions
5. **Preprocessing Instructions** (NOUVEAU - artefacts transcription)
6. Context Template
7. Examples
8. Constraints
9. Reasoning Instructions
10. Warnings
11. Fallback Instructions
12. Quality Criteria
13. Edge Cases

### Innovation : Section Preprocessing

**Problème** : Artefacts dans transcriptions
- `[AP]` : Appel
- `[T]` : Transfert
- `(???)` : Inaudible
- Timestamps, codes

**Solution** : Section dédiée
```json
"preprocessing_instructions": {
  "content": "Ignorez les marqueurs suivants : [AP], [T], (???)",
  "enabled": true,
  "order": 15
}
```

**Avantages** :
- ✅ Éditable (vs hardcodé)
- ✅ Traçable (versioning)
- ✅ Testable (A/B test avec/sans)

### Synergie tuning enrichie

**Tab Tuning avec vue côte-à-côte** :

```
┌─ Section: TASK DESCRIPTION ──────────────┐
│                                          │
│  Contenu actuel     │  💡 Suggestion     │
│  ─────────────────  │  ────────────────  │
│  Classifiez...      │  Ajouter :         │
│                     │  "en tenant compte │
│                     │  du niveau de      │
│                     │  satisfaction"     │
│                     │                    │
│                     │  [Appliquer]       │
│                     │  [Éditer]          │
└──────────────────────────────────────────┘
```

**Workflow** :
1. Suggestion générée (analyse désaccords)
2. Affichée en regard de la section
3. **Appliquer** → Remplacement auto
4. **Éditer** → Édition inline pré-remplie

### Tâches Session 5

#### Phase 1 : Infrastructure (1h)
- [ ] Créer `PromptSectionCard` (composant édition inline)
- [ ] Créer `ChartePromptEditor` (composant parent)
- [ ] Migration SQL (ajouter prompt_structure avec 13 sections)
- [ ] Service `PromptBuilder.buildPrompt()` mis à jour

#### Phase 2 : UI (45min)
- [ ] Intégrer dans CharteManager (remplacer tab "Catégories" → "Prompt")
- [ ] Accordion catégories (réutiliser CharteCategoriesEditor)
- [ ] Bouton "Ajouter section" (menu sections optionnelles)
- [ ] Preview temps réel

#### Phase 3 : Tuning synergie (15min)
- [ ] Modifier CharteTuningPanel (affichage côte-à-côte)
- [ ] Boutons Appliquer/Éditer
- [ ] Tests workflow complet

---

## 📊 MÉTRIQUES SPRINT 5

### Avancement global
- **Temps utilisé** : 9h / 10h30
- **Avancement** : 85%
- **Sessions complétées** : 4 / 5

### Code créé
- **SQL** : 3 tables + indexes + triggers (~500 lignes)
- **TypeScript Services** : 3 services (~1200 lignes)
- **TypeScript UI** : 8 composants (~2000 lignes)
- **Types** : 4 fichiers (~400 lignes)
- **Total** : ~4100 lignes de code

### Documentation créée
- **ADR** : 2 (ADR 006, ADR 007)
- **Specs** : 3 (Structure chartes, Refonte UI, Éditeur inline)
- **Guides** : 2 (Installation, Commit)
- **Total** : ~5000 lignes documentation

### Tests
- ✅ SQL : 100% validé
- ✅ Services : Types compilent
- ✅ UI : Fonctionnelle en dev
- ⏳ End-to-end : À faire Session 5

---

## 🎯 OBJECTIFS POST-SPRINT 5

### Sprint 6 (optionnel) : Polish & Tests

#### Objectif 1 : Tests empiriques
- [ ] Test A/B few-shot vs zero-shot
  - Charte A : Minimaliste (task + definitions + output)
  - Charte B : Enrichie (+ preprocessing + constraints + fallback)
  - Mesure : Kappa sur 100 paires

- [ ] Test impact preprocessing
  - Avec preprocessing_instructions
  - Sans preprocessing_instructions
  - Mesure : Différence accuracy

- [ ] Test synergie tuning
  - Générer suggestions
  - Appliquer 5 suggestions
  - Mesurer amélioration Kappa

#### Objectif 2 : Fonctionnalités avancées
- [ ] Tab Historique (timeline versions)
- [ ] Export/import chartes (JSON)
- [ ] Templates pré-définis (Minimaliste, Enrichie, Reasoning)
- [ ] Variables personnalisées dans prompt

#### Objectif 3 : Optimisations
- [ ] Cleanup Level0Interface (supprimer tab tuning standalone)
- [ ] Cache PromptBuilder (éviter regénération)
- [ ] Validation schéma JSON (prompt_structure)
- [ ] Tests end-to-end complets

---

## 📝 DÉCISIONS ARCHITECTURALES CLÉS

### ADR 006 : Gestion exemples chartes
**Décision** : Permettre désactivation exemples (zero-shot pur)
**Rationale** : Éviter que LLM se comporte comme regex
**Impact** : Nouveau champ `use_examples` dans rules (futur)

### ADR 007 : Éditeur prompt inline WYSIWYG
**Décision** : Vue linéaire avec zones éditables au clic
**Rationale** : Transparence, extensibilité, synergie tuning
**Impact** : 
- Structure `prompt_structure` avec 13 sections
- Section `preprocessing_instructions` pour artefacts
- Tab "Prompt" remplace tab "Catégories"

---

## 🔗 LIENS UTILES

### Fichiers clés
- Backend : `003_charte_tuning_system.sql`
- Services : `CharteTuningService.ts`, `CharteEditionService.ts`
- UI : `chartes/`, `tuning/`
- Types : `types/core/tuning.ts`

### Documentation
- ADR 006 : `docs/decisions/ADR_006_gestion_exemples_chartes.md`
- ADR 007 : `docs/decisions/ADR_007_architecture_editeur_prompt_inline.md`
- Structure chartes : `docs/ai_context/DOCUMENTATION_STRUCTURE_CHARTES.md`
- Spec éditeur : `docs/ai_context/SPEC_EDITEUR_PROMPT_INLINE.md`

---

## ✅ CRITÈRES DE SUCCÈS SPRINT 5

### Must-have (requis pour validation)
- [x] Backend SQL complet et performant
- [x] Services TypeScript fonctionnels
- [x] UI tuning opérationnelle
- [x] 4 éditeurs de chartes créés
- [ ] **Éditeur prompt inline fonctionnel** ← Session 5

### Nice-to-have (bonus)
- [x] Documentation exhaustive
- [x] ADR pour décisions majeures
- [ ] Tests end-to-end
- [ ] Cleanup code legacy

### Success metrics
- **Code coverage** : TypeScript compile à 100% ✅
- **UI functional** : Tous éditeurs fonctionnels ✅ (sauf prompt inline)
- **Documentation** : > 5000 lignes ✅
- **Performance** : Chargement suggestions < 500ms ✅

---

## 🚀 PROCHAINE SESSION

**Session 5 : Éditeur Prompt Inline**
- **Durée estimée** : 2h
- **Objectif** : Implémenter architecture ADR 007
- **Livrables** :
  1. `ChartePromptEditor.tsx`
  2. `PromptSectionCard.tsx`
  3. Migration SQL prompt_structure
  4. Service `PromptBuilder` mis à jour
  5. Tab Tuning enrichi (côte-à-côte)

**Ensuite** : Commit final Sprint 5 + wrap-up

---

**Status** : 🟢 En cours - Session 4 terminée, Session 5 à venir
**Prochaine action** : Implémenter ADR 007 (éditeur prompt inline)
