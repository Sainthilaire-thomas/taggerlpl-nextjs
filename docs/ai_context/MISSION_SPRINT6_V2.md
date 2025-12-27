# MISSION SPRINT 6 - Réorganisation Ergonomique Level 0

**Version** : 2.0  
**Date début** : 2025-12-27  
**Date v2** : 2025-12-27 (restructuration workflow)  
**Durée estimée** : 10h  
**Avancement** : 30% (3h / 10h)

---

## 🎯 OBJECTIF SPRINT 6

**Réorganiser l'ergonomie de Level 0** pour suivre le workflow scientifique linéaire :

```
Dashboard → 1.Gold → 2.Chartes → 3.Association → 4.Tests → 5.Validation → 6.Tuning
    ↑         └───────────────────────────────────────────────────────────────┘
    │                         (boucle itérative)
    └─ Vue d'ensemble toujours accessible
```

### Problèmes identifiés (Sprint 5 Session 6)

1. ✅ **Variable X/Y cachée** → RÉSOLU Session 7
2. ❌ **Dépendances implicites** → Session 8-9
3. ✅ **Pas de création chartes** → RÉSOLU Session 7
4. ✅ **Changement variable caché** → RÉSOLU Session 7
5. ❌ **Pas de vue synthétique** → Session 8-9
6. 🆕 **ORDRE ILLOGIQUE** → Session 8-9 (nouveau problème majeur)

---

## 📊 WORKFLOW SCIENTIFIQUE CIBLE

### Étapes logiques Level 0

```
1. CRÉER/CHARGER GOLD STANDARD
   ↓ (vérité terrain = annotations manuelles)
   
2. CRÉER CHARTE
   ↓ (formulation prompt LLM)
   
3. ASSOCIER CHARTE → GOLD STANDARD
   ↓ (définir quelle référence comparer)
   
4. TESTER CHARTE
   ↓ (LLM annote échantillon)
   
5. ANALYSER RÉSULTATS
   ↓ (Kappa, désaccords)
   
6. VALIDER DÉSACCORDS (CAS A/B/C)
   ↓ (identifier erreurs LLM)
   
7. TUNER CHARTE
   ↓ (améliorer basé sur CAS B)
   
8. RE-TESTER
   └──→ Boucle jusqu'à Kappa > 0.8
```

### Nouvelle structure onglets

```
[📊 Dashboard]          ← Vue d'ensemble + guidage
[1️⃣ Gold Standards]    ← Étape 1
[2️⃣ Chartes]           ← Étape 2  
[3️⃣ Association]       ← Étape 3 (NOUVEAU)
[4️⃣ Tests]             ← Étapes 4-5
[5️⃣ Validation]        ← Étape 6
[6️⃣ Tuning]            ← Étape 7
[🔍 Audit]             ← Outil diagnostic
```

---

## ✅ SESSION 7 TERMINÉE (3h) - 2025-12-27

### Objectif

Header Global + Création/Duplication Chartes

### Problèmes résolus

- ✅ #1 : Variable X/Y cachée
- ✅ #3 : Pas de création chartes
- ✅ #4 : Changement variable caché

### Composants créés (4 fichiers)

**1. Level0GlobalHeader.tsx** (280 lignes)
- Sélecteur variable X/Y avec descriptions
- Gold standard actif (thomas_audio_y)
- Statistiques rapides (chartes, tests, Kappa colorisé)
- Tooltip info + Description variable
- Layout responsive Box + Flexbox
- Dark mode compatible

**2. CreateCharteDialog.tsx** (400 lignes)
- Wizard 3 étapes (Infos → Config → Confirmation)
- 3 philosophies (Minimaliste, Enrichie, Binaire)
- 3 modalités (Texte seul, Audio complet, Texte+Contexte)
- Option copie depuis charte existante
- Validation formulaire

**3. DuplicateCharteButton.tsx** (300 lignes)
- IconButton + Dialog duplication
- 4 checkboxes éléments à copier
- Validation nom unique
- Version 1.0.0 automatique

**4. CharteCreationService.ts** (400 lignes)
- createCharte() avec definition par défaut
- duplicateCharte() avec deep copy sélective
- getDefaultDefinition() selon philosophie
- Catégories adaptées X vs Y

### Intégration

- Level0Interface.tsx modifié
- Nouveaux états (chartes, goldStandard, stats)
- Fonctions loadChartes() et loadStats()
- Dialog CreateCharteDialog intégré

### Correction conceptuelle majeure

**❌ AVANT** : Header affichait CHARTE (CharteY_B)  
**✅ APRÈS** : Header affiche GOLD STANDARD (thomas_audio_y)

**Différence** :
- Gold Standard = Référence annotation (vérité terrain)
- Charte = Formulation prompt (algorithme LLM)
- Une charte se TESTE contre un gold standard

### Métriques

- Code : ~1450 lignes TypeScript
- Documentation : ~1000 lignes
- Durée : 3h (100% conforme)

---

## 🔄 SESSION 8 : RÉORGANISATION COMPLÈTE (4h) - À FAIRE

### Objectif

Réorganiser tous les onglets selon workflow linéaire + Dashboard + Messages prérequis

### Partie 1 : Réorganisation onglets (2h)

#### 1.1 Créer onglet Dashboard (45 min)

**Fichier** : `Level0Dashboard.tsx`

**Contenu** :
```tsx
┌────────────────────────────────────────────────────────┐
│ 📊 DASHBOARD - Variable Y                              │
│                                                        │
│ PROGRESSION GLOBALE                                    │
│ ━━━━━━━━━━━━━━━━━ 65%                                 │
│                                                        │
│ WORKFLOW LEVEL 0                                       │
│ ✅ 1. Gold standard créé (thomas_audio_y)             │
│ ✅ 2. Chartes créées (3)                              │
│ ⚠️ 3. Associations incomplètes (1/3)                   │
│    → [Aller associer CharteY_C]                       │
│ ✅ 4. Tests effectués (5)                             │
│ ⚠️ 5. Désaccords à valider (8 restants)               │
│                                                        │
│ PROCHAINE ACTION RECOMMANDÉE                           │
│ 💡 Valider les 8 désaccords de CharteY_A              │
│ [Aller à Validation]                                   │
└────────────────────────────────────────────────────────┘
```

**Fonctionnalités** :
- Calcul progression (0-100%)
- Détection actions manquantes
- Recommandations contextuelles
- Liens directs vers onglets
- Affichage meilleure charte

**Données** :
```typescript
interface DashboardStats {
  variable: 'X' | 'Y';
  progress: number;
  goldStandardExists: boolean;
  chartes: {
    total: number;
    withGold: number;
    withoutGold: CharteDefinition[];
  };
  tests: {
    total: number;
    averageKappa: number;
    bestCharte?: { name: string; kappa: number };
  };
  disagreements: {
    total: number;
    unvalidated: number;
  };
  nextAction: {
    label: string;
    target: string; // nom onglet
  };
}
```

**Calcul progression** :
```typescript
const weights = {
  goldCreated: 0.15,
  chartesCreated: 0.15,
  allAssociated: 0.20,
  testsRun: 0.25,
  disagreementsValidated: 0.25,
};

// Score 0-1 pour chaque critère
const scores = {
  goldCreated: goldExists ? 1 : 0,
  chartesCreated: chartes.length > 0 ? 1 : 0,
  allAssociated: chartes.withGold / chartes.total,
  testsRun: Math.min(tests.total / 5, 1),
  disagreementsValidated: 1 - (disagreements.unvalidated / disagreements.total),
};

const progress = Object.keys(weights).reduce(
  (acc, key) => acc + weights[key] * scores[key], 
  0
) * 100;
```

---

#### 1.2 Créer onglet Association (45 min)

**Fichier** : `AssociationPanel.tsx` (nouveau)

**Contenu** :
```tsx
┌────────────────────────────────────────────────────────┐
│ 3️⃣ ASSOCIATION CHARTES ↔ GOLD STANDARDS               │
│                                                        │
│ ⚠️ Pour tester une charte, elle doit être associée    │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Charte    │ Gold Standard      │ Statut │ Action│  │
│ ├──────────────────────────────────────────────────┤  │
│ │ CharteY_A │ thomas_audio_y ▼   │ ✅     │ [✓]  │  │
│ │ CharteY_B │ thomas_audio_y ▼   │ ✅     │ [✓]  │  │
│ │ CharteY_C │ [Sélectionner... ▼]│ ⚠️     │ [✓]  │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ PROCHAINE ÉTAPE                                        │
│ → Tester vos chartes pour mesurer performance         │
│ [Aller à Tests]                                        │
└────────────────────────────────────────────────────────┘
```

**Fonctionnalités** :
- Liste toutes chartes variable actuelle
- Select gold standards disponibles
- Sauvegarde association (update charte.gold_standard_id)
- Indication statut (✅ associé, ⚠️ non associé)
- Message "Prochaine étape"

**Service** :
```typescript
// Dans CharteManagementService ou nouveau AssociationService
async associateCharteToGold(
  charteId: string, 
  goldStandardId: string
): Promise<void> {
  await supabase
    .from('level0_chartes')
    .update({ gold_standard_id: goldStandardId })
    .eq('charte_id', charteId);
}
```

---

#### 1.3 Réorganiser Level0Interface (30 min)

**Modifications** :
```typescript
// AVANT
const tabs = ['tests', 'goldstandards', 'validation', 'comparator', 'audit', 'chartes', 'tuning'];

// APRÈS
const tabs = [
  'dashboard',      // 📊 Vue d'ensemble
  'gold',          // 1️⃣ Gold Standards
  'chartes',       // 2️⃣ Chartes
  'association',   // 3️⃣ Association (NOUVEAU)
  'tests',         // 4️⃣ Tests
  'validation',    // 5️⃣ Validation
  'tuning',        // 6️⃣ Tuning
  'audit',         // 🔍 Audit
];
```

**JSX** :
```tsx
<Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
  <Tab label="📊 Dashboard" value="dashboard" />
  <Tab label="1️⃣ Gold Standards" value="gold" />
  <Tab label="2️⃣ Chartes" value="chartes" />
  <Tab label="3️⃣ Association" value="association" />
  <Tab label="4️⃣ Tests" value="tests" />
  <Tab label="5️⃣ Validation" value="validation" />
  <Tab label="6️⃣ Tuning" value="tuning" />
  <Tab label="🔍 Audit" value="audit" />
</Tabs>

{currentTab === 'dashboard' && <Level0Dashboard variable={variable} />}
{currentTab === 'gold' && <GoldStandardsPanel variable={variable} />}
{currentTab === 'chartes' && <CharteManager variable={variable} />}
{currentTab === 'association' && <AssociationPanel variable={variable} />}
{currentTab === 'tests' && <TestsPanel variable={variable} />}
{/* ... */}
```

---

### Partie 2 : Messages prérequis (1h)

#### 2.1 TabEmptyState component (30 min)

**Fichier** : `TabEmptyState.tsx`

**Props** :
```typescript
interface TabEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  prerequisites?: {
    label: string;
    status: 'ok' | 'missing';
  }[];
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'contained' | 'outlined';
  }[];
}
```

**Exemple utilisation** :
```tsx
<TabEmptyState
  icon={<WarningIcon fontSize="large" />}
  title="Aucune charte associée à un gold"
  message="Pour lancer un test, vous devez d'abord associer vos chartes."
  prerequisites={[
    { label: 'Gold standard créé', status: 'ok' },
    { label: 'Charte créée', status: 'ok' },
    { label: 'Association charte↔gold', status: 'missing' },
  ]}
  actions={[
    {
      label: 'Aller à Association',
      onClick: () => setCurrentTab('association'),
      variant: 'contained',
    },
  ]}
/>
```

---

#### 2.2 Intégrer messages dans chaque onglet (30 min)

**Tests** :
```tsx
{currentTab === 'tests' && (
  <>
    {chartesWithGold.length === 0 ? (
      <TabEmptyState
        title="Aucune charte associée"
        message="Associez d'abord vos chartes à un gold standard"
        actions={[{ 
          label: 'Aller à Association', 
          onClick: () => setCurrentTab('association') 
        }]}
      />
    ) : (
      <TestsPanel variable={variable} chartes={chartesWithGold} />
    )}
  </>
)}
```

**Validation** :
```tsx
{currentTab === 'validation' && (
  <>
    {testsWithDisagreements.length === 0 ? (
      <TabEmptyState
        icon={<CheckCircleIcon color="success" />}
        title="Aucun désaccord en attente"
        message="Tous vos tests montrent un accord parfait ! 🎉"
      />
    ) : (
      <DisagreementValidationPanel tests={testsWithDisagreements} />
    )}
  </>
)}
```

---

### Partie 3 : Amélioration onglets existants (1h)

#### 3.1 Gold Standards : Retirer association (15 min)

**AVANT** :
- Section 1 : Créer/Gérer gold standards
- Section 2 : Associer chartes ↔ gold

**APRÈS** :
- UNIQUEMENT : Créer/Gérer gold standards
- Message "Prochaine étape" vers Chartes

---

#### 3.2 Chartes : Déplacer bouton Créer (15 min)

**AVANT** : Bouton en haut de Level0Interface (hors onglets)

**APRÈS** : Bouton DANS l'onglet Chartes

```tsx
{currentTab === 'chartes' && (
  <Box>
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setCreateDialogOpen(true)}
      >
        Créer Nouvelle Charte
      </Button>
    </Box>
    
    <CharteManager variable={variable} />
  </Box>
)}
```

---

#### 3.3 Tests : Simplifier + Prérequis visibles (15 min)

**Ajouts** :
- Message prérequis en vert si OK
- Lien direct "Valider désaccords" si test a désaccords
- Retirer sélection variable (redondant avec header)

---

#### 3.4 Tuning : Contexte test visible (15 min)

**Ajouts** :
- Select "Test source" pour contexte clair
- Bouton "Retour à Tests" pour re-tester après tuning
- Message si aucun test sélectionné

---

### Métriques Session 8

**Fichiers à créer** :
- Level0Dashboard.tsx (400 lignes)
- AssociationPanel.tsx (300 lignes)
- TabEmptyState.tsx (150 lignes)

**Fichiers à modifier** :
- Level0Interface.tsx (réorganisation tabs)
- GoldStandardsPanel.tsx (retirer section association)
- CharteManager.tsx (bouton Créer intégré)
- TestsPanel.tsx (messages prérequis)
- CharteTuningPanel.tsx (select test)

**Total** : ~1200 lignes code + 4h travail

---

## 🔧 SESSION 9 : INTÉGRATION DUPLICATION + POLISH (3h) - À FAIRE

### Objectif

Finaliser intégration DuplicateCharteButton + Peaufinage UX

### Partie 1 : Intégration DuplicateCharteButton (1h)

**Problème actuel** : Bouton créé Session 7 mais pas intégré dans CharteManager

**Action** :
```tsx
// Dans CharteManager.tsx, colonne Actions
<IconButton onClick={() => handleEdit(charte)}>
  <EditIcon />
</IconButton>

{/* AJOUTER */}
<DuplicateCharteButton
  sourceCharte={charte}
  onDuplicate={async (newName, options) => {
    await CharteCreationService.duplicateCharte(
      charte.charte_id,
      newName,
      options
    );
    await loadChartes();
  }}
/>
```

---

### Partie 2 : Messages "Prochaine étape" (1h)

Ajouter message "Prochaine étape" dans CHAQUE onglet :

**Gold Standards** :
```tsx
<Alert severity="info" sx={{ mt: 2 }}>
  <AlertTitle>Prochaine étape</AlertTitle>
  → Créer des chartes pour tester différentes formulations
  <Button onClick={() => setCurrentTab('chartes')}>
    Aller à Chartes
  </Button>
</Alert>
```

**Répéter pour** : Chartes, Association, Tests, Validation, Tuning

---

### Partie 3 : Polish UI (1h)

- ✅ Icônes cohérentes (numéros 1️⃣-6️⃣)
- ✅ Couleurs statuts (vert ✅, orange ⚠️, rouge ❌)
- ✅ Transitions douces entre onglets
- ✅ Loading states
- ✅ Tooltips explicatifs
- ✅ Dark mode validé partout

---

## 📊 MÉTRIQUES SPRINT 6 RÉVISÉ

### Temps total : 10h

- Session 7 : 3h (Header + Création) ✅
- Session 8 : 4h (Réorganisation + Dashboard + Messages) ⏳
- Session 9 : 3h (Duplication + Polish) ⏳

### Code total : ~2800 lignes

- Session 7 : ~1450 lignes ✅
- Session 8 : ~1200 lignes ⏳
- Session 9 : ~150 lignes ⏳

### Documentation : ~2500 lignes

- Session 7 : ~1000 lignes ✅
- Mission v2 : ~1000 lignes (ce fichier)
- Current State v2 : ~500 lignes

---

## ✅ CRITÈRES SUCCÈS SPRINT 6

### Must-have

- [X] Header contexte global ✅ Session 7
- [X] Création chartes ✅ Session 7
- [X] Duplication chartes ✅ Session 7 (à intégrer Session 9)
- [ ] Dashboard vue d'ensemble → Session 8
- [ ] Onglets ordonnés logiquement → Session 8
- [ ] Messages prérequis explicites → Session 8
- [ ] Onglet Association → Session 8

### Nice-to-have

- [ ] Tests A/B preprocessing → Reporté Sprint 7
- [ ] Wizard parcours guidé → Reporté Sprint 7
- [ ] Graphiques évolution Kappa → Reporté Sprint 7

---

## 🚀 APRÈS SPRINT 6

### Sprint 7 : Features Avancées (6-8h)

1. **Tests A/B Preprocessing** (2h)
   - CharteY_Test_WithPreproc vs WithoutPreproc
   - 100 paires échantillon
   - Analyse gain Kappa attendu +7 points

2. **Comparaison visuelle chartes** (2h)
   - Diff côte-à-côte prompts
   - Highlight différences
   - Comparaison métriques

3. **Wizard parcours guidé** (3h)
   - Stepper progression 1→6
   - Onboarding interactif
   - Tutoriel contextuel

### Sprint 8+ : Features Expertes (10-15h)

1. **Versioning visuel** (4h)
2. **Tuning intelligent ML** (5h)
3. **Export/Import chartes** (3h)

---

## 📝 PROCHAINE SESSION

**Session 8 : Réorganisation complète**
- **Durée** : 4h
- **Priorité** : ⭐⭐⭐ CRITIQUE
- **Livrables** :
  1. Level0Dashboard.tsx
  2. AssociationPanel.tsx
  3. TabEmptyState.tsx
  4. Réorganisation Level0Interface.tsx
  5. Messages prérequis tous onglets
  6. Bouton "Créer" déplacé

**Puis** : Session 9 (Duplication + Polish, 3h)

---

**Status** : 🟢 Sprint 6 en cours - Session 7 terminée (30%)  
**Prochaine action** : Implémenter Session 8 (réorganisation complète)

**Version** : 2.0 (restructuration workflow)  
**Date** : 2025-12-27
