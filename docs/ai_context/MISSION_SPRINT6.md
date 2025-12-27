# MISSION SPRINT 6 - Améliorations Ergonomiques Level 0

**Version** : 1.0  
**Date début** : 2025-12-24  
**Durée estimée** : 7h30  
**Avancement** : 0%

---

## 🎯 OBJECTIF SPRINT 6

**Améliorer l'ergonomie de Level 0** en résolvant les 5 problèmes identifiés lors du Sprint 5 Session 6 :

1. ❌ **Variable X/Y cachée** : Visible uniquement dans tab TESTS
2. ❌ **Dépendances implicites** : Prérequis entre onglets non explicites
3. ❌ **Pas de création chartes** : Interface permet seulement édition
4. ❌ **Changement variable caché** : Retour à TESTS obligatoire pour changer X↔Y
5. ❌ **Pas de vue synthétique** : Où en suis-je dans mon workflow ?

---

## 📋 SESSIONS PLANIFIÉES

### ✅ Session 7 : Header Contexte Global + Création Chartes (3h)

**Statut** : ⏳ À faire  
**Priorité** : ⭐⭐⭐ HAUTE (résout problèmes 1, 3, 4)

#### Partie 1 : Header Contexte Global (1h30)

**Problèmes résolus** : #1 (Variable cachée), #4 (Changement variable)

**Objectif** : Variable actuelle visible en permanence + sélecteur rapide

**Composant à créer** : `Level0GlobalHeader.tsx`

**Emplacement** : 
- Fichier : `src/features/phase3-analysis/level0-gold/presentation/components/Level0GlobalHeader.tsx`
- Intégration : `Level0Interface.tsx` (en haut, avant les tabs)

**Contenu du header** :
```tsx
┌────────────────────────────────────────────────────────┐
│  📊 Level 0 - Gold Standard Creation                  │
│                                                         │
│  Variable actuelle : [Y - Réaction Client ▼]          │
│  Gold Standard associé : CharteY_B v1.0.0              │
│  Tests effectués : 5 | Kappa moyen : 0.78             │
└────────────────────────────────────────────────────────┘
```

**Fonctionnalités** :
- [ ] Select Material-UI pour variable (X/Y)
- [ ] Affichage charte gold associée (si existe)
- [ ] Compteurs rapides (tests, Kappa moyen)
- [ ] Icône info avec tooltip explicatif
- [ ] Persistance sélection (sync avec state Level0Interface)

**Props de Level0GlobalHeader** :
```typescript
interface Level0GlobalHeaderProps {
  variable: 'X' | 'Y';
  onVariableChange: (newVariable: 'X' | 'Y') => void;
  goldStandardCharte?: CharteDefinition;
  testsCount: number;
  averageKappa: number;
}
```

**Workflow** :
1. Utilisateur change variable dans header
2. `onVariableChange()` appelé
3. Level0Interface met à jour state `variable`
4. Tous les composants enfants (tabs) reçoivent nouvelle variable
5. Rechargement automatique des chartes/tests/etc.

**Tests à faire** :
- [ ] Changement X → Y rafraîchit CharteManager
- [ ] Changement Y → X rafraîchit tests disponibles
- [ ] Affichage correct gold standard
- [ ] Compteurs mis à jour en temps réel

---

#### Partie 2 : Création/Duplication Chartes (1h30)

**Problème résolu** : #3 (Pas de création chartes)

**Objectifs** :
1. Permettre création de nouvelles chartes
2. Permettre duplication de chartes existantes

**Composants à créer** :

##### 2.1 CreateCharteDialog.tsx

**Emplacement** : `src/features/phase3-analysis/level0-gold/presentation/components/chartes/CreateCharteDialog.tsx`

**Formulaire** :
```
┌─ Créer Nouvelle Charte ─────────────────────┐
│                                              │
│  Nom : [_____________________________]      │
│                                              │
│  Variable : ○ X (Stratégies conseiller)     │
│             ● Y (Réactions client)          │
│                                              │
│  Philosophie : ○ Minimaliste                │
│                ● Enrichie                    │
│                ○ Binaire                     │
│                                              │
│  Modalité : ○ Texte seul                    │
│             ● Audio complet                  │
│             ○ Texte + Contexte              │
│                                              │
│  ☐ Copier depuis : [CharteY_A ▼]           │
│                                              │
│  [Annuler]              [Créer]             │
└──────────────────────────────────────────────┘
```

**Logique création** :
```typescript
async function createCharte(formData) {
  // 1. Générer charte_id
  const charteId = `Charte${formData.variable}_${formData.name}_v1.0.0`;
  
  // 2. Si "Copier depuis" sélectionné
  if (formData.copyFrom) {
    const sourceCharte = await getCharteById(formData.copyFrom);
    // Copier prompt_structure, categories, rules, params
    newCharte.definition = { ...sourceCharte.definition };
  } else {
    // Créer prompt_structure par défaut selon philosophie
    newCharte.definition = getDefaultPromptStructure(formData.philosophy);
  }
  
  // 3. Sauvegarder en BDD
  await CharteManagementService.createCharte(newCharte);
  
  // 4. Rediriger vers tab PROMPT pour édition
  navigate(`/level0/chartes/${charteId}?tab=prompt`);
}
```

**Validation** :
- Nom non vide (min 3 caractères)
- Variable X ou Y sélectionnée
- Philosophie sélectionnée
- Modalité sélectionnée

##### 2.2 DuplicateCharteButton.tsx

**Emplacement** : Intégré dans `CharteManager.tsx` (colonne Actions)

**Fonctionnement** :
```tsx
<IconButton 
  onClick={() => openDuplicateDialog(charte)}
  title="Dupliquer cette charte"
>
  <ContentCopy />
</IconButton>
```

**Dialog duplication** :
```
┌─ Dupliquer Charte ──────────────────────────┐
│                                              │
│  Source : CharteY_B "Enrichie"              │
│                                              │
│  Nouveau nom : [CharteY_B_Test_____]        │
│                                              │
│  Version : v1.0.0 (nouvelle charte)         │
│                                              │
│  ☑ Copier prompt_structure                  │
│  ☑ Copier catégories                        │
│  ☑ Copier règles                            │
│  ☑ Copier paramètres LLM                    │
│  ☐ Copier historique (désactivé)           │
│                                              │
│  [Annuler]              [Dupliquer]         │
└──────────────────────────────────────────────┘
```

**Logique duplication** :
```typescript
async function duplicateCharte(sourceId, newName) {
  const source = await getCharteById(sourceId);
  
  const duplicate = {
    charte_id: `Charte${source.variable}_${newName}_v1.0.0`,
    charte_name: newName,
    variable: source.variable,
    philosophy: source.philosophy,
    version: '1.0.0',
    definition: JSON.parse(JSON.stringify(source.definition)), // Deep copy
    created_at: new Date(),
  };
  
  // Sauvegarder
  await CharteManagementService.createCharte(duplicate);
  
  // Recharger liste
  await loadChartes();
  
  // Notifier
  alert(`Charte "${newName}" créée avec succès !`);
}
```

**Tests à faire** :
- [ ] Création charte vide (sans copie)
- [ ] Création charte depuis template
- [ ] Duplication charte complète
- [ ] Validation formulaires
- [ ] Redirection après création

---

### ⏳ Session 8 : Messages État + Dashboard (2h30)

**Statut** : ⏳ À faire  
**Priorité** : ⭐⭐ MOYENNE (résout problèmes 2, 5)

#### Partie 1 : Messages État Explicites (1h)

**Problème résolu** : #2 (Dépendances implicites)

**Objectif** : Indiquer prérequis et état de chaque onglet

**Composant à créer** : `TabEmptyState.tsx`

**Exemples par onglet** :

##### TESTS DE CHARTES
```
┌──────────────────────────────────────────────┐
│  ⚠️  Aucune charte associée à un gold        │
│                                              │
│  Pour lancer un test, vous devez d'abord :  │
│  1. Créer une charte                         │
│  2. L'associer à un gold standard            │
│                                              │
│  [Aller à Gestion Chartes]                  │
└──────────────────────────────────────────────┘
```

##### GOLD STANDARDS
```
┌──────────────────────────────────────────────┐
│  📋  2 chartes associées, 1 non associée     │
│                                              │
│  CharteY_A → gold_audio_full_y ✅           │
│  CharteY_B → gold_text_only_y ✅            │
│  CharteY_C → Aucun gold ⚠️                   │
│                                              │
│  [Associer CharteY_C]                       │
└──────────────────────────────────────────────┘
```

##### VALIDATION DÉSACCORDS
```
┌──────────────────────────────────────────────┐
│  ✅  Aucun désaccord en attente !            │
│                                              │
│  Tous vos tests montrent un accord parfait   │
│  entre LLM et gold standard.                 │
│                                              │
│  Kappa moyen : 0.95                          │
└──────────────────────────────────────────────┘
```

**Logique affichage** :
```typescript
function TabContent({ tab, hasData, prerequisites }) {
  if (!prerequisites.met) {
    return (
      <TabEmptyState
        icon={<Warning />}
        title={prerequisites.message}
        actions={prerequisites.actions}
      />
    );
  }
  
  if (!hasData) {
    return (
      <TabEmptyState
        icon={<Info />}
        title="Aucune donnée disponible"
        message="Les données apparaîtront ici une fois créées."
      />
    );
  }
  
  return <ActualTabContent />;
}
```

**Configuration prérequis** :
```typescript
const TAB_PREREQUISITES = {
  'tests': {
    check: () => chartes.some(c => c.gold_standard_id !== null),
    message: "Aucune charte associée à un gold",
    actions: [{ label: "Aller à Gold Standards", to: "/level0/gold" }]
  },
  'gold': {
    check: () => chartes.length > 0,
    message: "Aucune charte créée",
    actions: [{ label: "Créer charte", onClick: openCreateDialog }]
  },
  'validation': {
    check: () => tests.some(t => t.disagreements_count > 0),
    message: "Aucun désaccord à valider",
    actions: []
  },
  // ...
};
```

---

#### Partie 2 : Dashboard Synthétique (1h30)

**Problème résolu** : #5 (Pas de vue synthétique)

**Objectif** : Vue d'ensemble avancement Level 0 par variable

**Composant à créer** : `Level0Dashboard.tsx`

**Emplacement** : Nouvel onglet "DASHBOARD" en premier

**Contenu** :
```tsx
┌─ DASHBOARD LEVEL 0 ─────────────────────────────────┐
│                                                      │
│  ┌─ Variable Y - Réactions Client ────────────────┐ │
│  │                                                 │ │
│  │  📊 AVANCEMENT                                  │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 75%              │ │
│  │                                                 │ │
│  │  Chartes créées : 3                            │ │
│  │  │─ CharteY_A (Minimaliste) → gold_text_only  │ │
│  │  │─ CharteY_B (Enrichie) → gold_audio_full     │ │
│  │  └─ CharteY_C (Binaire) → Aucun gold ⚠️        │ │
│  │                                                 │ │
│  │  Tests effectués : 5                           │ │
│  │  Kappa moyen : 0.78                            │ │
│  │  Meilleure charte : CharteY_B (Kappa 0.85)     │ │
│  │                                                 │ │
│  │  Désaccords en attente : 8 (CharteY_A)         │ │
│  │  │─ CAS A validés : 2                          │ │
│  │  │─ CAS B validés : 5                          │ │
│  │  └─ Non validés : 1                            │ │
│  │                                                 │ │
│  │  Suggestions tuning : 3 disponibles            │ │
│  │                                                 │ │
│  │  [Lancer test] [Valider désaccords]           │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Variable X - Stratégies Conseiller ───────────┐ │
│  │                                                 │ │
│  │  📊 AVANCEMENT                                  │ │
│  │  ━━━━━━━━━ 30%                                  │ │
│  │                                                 │ │
│  │  Chartes créées : 2                            │ │
│  │  │─ CharteX_A (Sans contexte) → Aucun gold ⚠️  │ │
│  │  └─ CharteX_B (Avec contexte) → Aucun gold ⚠️  │ │
│  │                                                 │ │
│  │  Tests effectués : 0                           │ │
│  │                                                 │ │
│  │  ⚠️  Action requise :                           │ │
│  │  Associer chartes à un gold standard           │ │
│  │                                                 │ │
│  │  [Associer gold] [Créer test]                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ RECOMMANDATIONS ──────────────────────────────┐ │
│  │                                                 │ │
│  │  💡 Variable Y : 8 désaccords à valider        │ │
│  │  💡 Variable X : Associer gold standards       │ │
│  │  💡 CharteY_B : 3 suggestions tuning dispo     │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Données calculées** :
```typescript
interface DashboardStats {
  variable: 'X' | 'Y';
  progress: number; // 0-100
  chartes: {
    total: number;
    withGold: number;
    withoutGold: number;
  };
  tests: {
    total: number;
    averageKappa: number;
    bestCharte: { name: string; kappa: number };
  };
  disagreements: {
    total: number;
    casA: number;
    casB: number;
    unvalidated: number;
  };
  suggestions: {
    total: number;
    applied: number;
    pending: number;
  };
  recommendations: string[];
}
```

**Calcul progression** :
```typescript
function calculateProgress(stats: DashboardStats): number {
  const weights = {
    chartesCreated: 0.2,
    goldAssociated: 0.3,
    testsRun: 0.3,
    disagreementsValidated: 0.2,
  };
  
  const scores = {
    chartesCreated: stats.chartes.total > 0 ? 1 : 0,
    goldAssociated: stats.chartes.withGold / Math.max(stats.chartes.total, 1),
    testsRun: Math.min(stats.tests.total / 5, 1), // 5 tests = 100%
    disagreementsValidated: stats.disagreements.casA + stats.disagreements.casB / Math.max(stats.disagreements.total, 1),
  };
  
  return Object.keys(weights).reduce((acc, key) => 
    acc + weights[key] * scores[key], 0
  ) * 100;
}
```

**Tests à faire** :
- [ ] Affichage correct stats Variable Y
- [ ] Affichage correct stats Variable X
- [ ] Calcul progression correct
- [ ] Recommandations pertinentes
- [ ] Actions rapides fonctionnelles

---

### ⏳ Session 9 : Tests A/B Preprocessing (2h)

**Statut** : ⏳ À faire  
**Priorité** : ⭐ BASSE (validation hypothèse)

**Objectif** : Mesurer impact section `preprocessing_instructions`

#### Hypothèse à tester

**H0-preprocessing** : La section preprocessing améliore l'accuracy de 5-10% en éliminant le bruit des artefacts de transcription.

**Rationale** : Les marqueurs `[AP]`, `[T]`, `(???)` parasitent la compréhension sémantique du LLM.

#### Protocole expérimental

**Chartes à créer** :
1. `CharteY_Test_WithPreproc` : preprocessing enabled
2. `CharteY_Test_WithoutPreproc` : preprocessing disabled

**Différence unique** :
```json
// WITH
"preprocessing_instructions": {
  "enabled": true,
  "content": "Ignorez [AP], [T], (???), timestamps..."
}

// WITHOUT
"preprocessing_instructions": {
  "enabled": false,
  "content": ""
}
```

**Échantillon** : 100 paires identiques (tirées aléatoirement)

**Métriques** :
- Kappa de Cohen
- Accuracy globale
- Accuracy par catégorie
- Confusion matrix
- Temps de réponse LLM

**Analyse attendue** :
```
Résultats attendus :
- Kappa sans preproc : 0.75
- Kappa avec preproc : 0.82
- Gain : +7 points (9%)

Types d'erreurs évitées :
- Classification "[AP] d'accord" comme CLIENT_POSITIF au lieu de NEUTRE
- Confusion causée par (???) dans le verbatim
- Mauvaise interprétation des timestamps
```

**Livrable** :
- Document `docs/ai_context/RESULTATS_AB_TEST_PREPROCESSING.md`
- Mise à jour ADR 007 avec résultats empiriques
- Recommandation : Activer/désactiver preprocessing par défaut

**Tests à faire** :
- [ ] Créer 2 chartes identiques (sauf preprocessing)
- [ ] Lancer tests sur 100 paires identiques
- [ ] Comparer métriques
- [ ] Analyser matrice de confusion
- [ ] Documenter résultats

---

## 📊 MÉTRIQUES SPRINT 6

### Estimations

**Temps total** : 7h30
- Session 7 : 3h (Header + Création)
- Session 8 : 2h30 (Messages + Dashboard)
- Session 9 : 2h (Tests A/B)

**Code à créer** : ~1500 lignes
- TypeScript UI : ~1200 lignes
- TypeScript Services : ~300 lignes
- Tests : À définir

**Documentation** : ~2000 lignes
- Résultats tests A/B
- Guides utilisateur
- Mise à jour ADRs

### Objectifs de succès

**Must-have** :
- [ ] Header contexte global fonctionnel
- [ ] Création chartes opérationnelle
- [ ] Duplication chartes opérationnelle
- [ ] Messages prérequis explicites
- [ ] Dashboard synthétique affiché

**Nice-to-have** :
- [ ] Tests A/B preprocessing terminés
- [ ] Documentation résultats
- [ ] Onboarding guidé (stepper)

---

## 🚀 APRÈS SPRINT 6

### Sprint 7-8 : Fonctionnalités Avancées (Moyen terme)

1. **Comparaison visuelle chartes** (2h)
   - Diff côte-à-côte de 2 prompts
   - Highlight des différences
   - Comparaison métriques (Kappa, accuracy)

2. **Workflow guidé** (3h)
   - Stepper de progression
   - Onboarding interactif
   - Tutoriel contextuel

3. **Graphiques évolution** (2h)
   - Timeline Kappa par charte
   - Courbes d'amélioration
   - Impact tuning visualisé

### Sprint 9+ : Features Avancées (Long terme)

1. **Versioning visuel** (4h)
   - Timeline versions d'une charte
   - Diff v1.0 → v1.1
   - Rollback possible

2. **Tuning intelligent** (5h)
   - Suggestions automatiques par ML
   - Prédiction impact Kappa
   - Recommandations contextuelles

3. **Export/Import** (3h)
   - Export charte JSON
   - Import charte
   - Templates communautaires

---

## 📝 PROCHAINE SESSION

**Session 7 : Header Global + Création Chartes**
- **Durée estimée** : 3h
- **Priorité** : ⭐⭐⭐ HAUTE
- **Livrables** :
  1. `Level0GlobalHeader.tsx`
  2. `CreateCharteDialog.tsx`
  3. `DuplicateCharteButton.tsx`
  4. Intégration Level0Interface
  5. Tests fonctionnels

**Ensuite** : Session 8 (Messages + Dashboard)

---

**Status** : 🟡 Planifié - Prêt à démarrer  
**Prochaine action** : Implémenter Session 7
