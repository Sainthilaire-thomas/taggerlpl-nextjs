# ADR-008: Restructuration Workflow Linéaire Level 0

**Date** : 2025-12-27  
**Status** : ✅ Accepté  
**Décideurs** : Thomas, Claude  
**Sprint** : Sprint 6 - Réorganisation Ergonomique

---

## 📋 Contexte

### Problème identifié

Après implémentation Sprint 5 (système tuning + éditeurs chartes), l'interface Level 0 présentait **6 problèmes ergonomiques critiques** identifiés lors d'une session d'analyse utilisateur :

1. ✅ **Variable X/Y cachée** : Visible uniquement dans onglet TESTS (résolu Session 7)
2. ❌ **Dépendances implicites** : Prérequis entre onglets non explicites
3. ✅ **Pas de création chartes** : Interface permettait seulement édition (résolu Session 7)
4. ✅ **Changement variable caché** : Retour à TESTS obligatoire (résolu Session 7)
5. ❌ **Pas de vue synthétique** : Impossibilité de savoir où on en est
6. 🆕 **ORDRE ILLOGIQUE** : Navigation zig-zag entre onglets

### Workflow scientifique vs Interface actuelle

**Workflow scientifique idéal Level 0** (validation chartes annotation) :
```
1. Créer/Charger GOLD STANDARD (vérité terrain)
   ↓
2. Créer CHARTE (formulation prompt LLM)
   ↓
3. Associer CHARTE → GOLD STANDARD
   ↓
4. TESTER charte (LLM annote échantillon)
   ↓
5. Analyser résultats (Kappa, désaccords)
   ↓
6. Valider désaccords (CAS A/B/C)
   ↓
7. TUNER charte (améliorer basé sur CAS B)
   ↓
8. RE-TESTER (boucle itérative jusqu'à Kappa > 0.8)
```

**Interface actuelle** (avant ADR-008) :
```
[Tests de Chartes]        ← Étape 4-5
[⭐ Gold Standards]       ← Étape 1 + 3 (mélangés !)
[Validation Désaccords]   ← Étape 6
[Comparateur Kappa]       ← Outil analyse
[🔍 Audit & Debug]        ← Outil diagnostic
[📝 Gestion Chartes]      ← Étape 2
[🔧 Tuning]              ← Étape 7
```

**Parcours utilisateur réel** pour créer et tester une charte :
```
1. Aller en onglet 6 (Gestion Chartes) → Créer charte
2. Revenir en onglet 2 (Gold Standards) → Associer gold
3. Aller en onglet 1 (Tests) → Lancer test
4. Aller en onglet 3 (Validation) → Valider désaccords
5. Aller en onglet 7 (Tuning) → Améliorer charte
6. Retourner en onglet 1 (Tests) → Re-tester

= Navigation zig-zag 6→2→1→3→7→1 ❌
```

### Impact utilisateur

**Symptômes observés** :
- ❌ Confusion : "Où dois-je aller pour faire X ?"
- ❌ Erreurs : Clic "Lancer Test" sans association → Erreur "pas de gold associé"
- ❌ Oublis : Étapes manquées (association, validation)
- ❌ Perte de contexte : "Où j'en suis dans mon workflow ?"
- ❌ Charge cognitive élevée : Mémorisation ordre onglets

**Métriques UX estimées** :
- Temps moyen workflow complet : ~15 min (avec erreurs)
- Nombre clics moyen : ~25 clics (aller-retours)
- Taux d'erreur : ~60% (oubli association)
- Satisfaction : Faible (frustration navigation)

---

## 🎯 Décision

### Restructurer l'interface Level 0 selon workflow scientifique linéaire

**Nouvelle structure adoptée** :

```
┌────────────────────────────────────────────────────────┐
│ 📊 Level 0 - Gold Standard         [Header Global]   │
│ Variable: [Y ▼]  Gold: thomas_audio_y  Kappa: 0.78   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ [📊 Dashboard] [1️⃣ Gold] [2️⃣ Chartes] [3️⃣ Association]│
│ [4️⃣ Tests] [5️⃣ Validation] [6️⃣ Tuning] [🔍 Audit]     │
└────────────────────────────────────────────────────────┘
```

**Principes de conception** :

1. **Ordre numérique** (1-6) : Reflète séquence workflow scientifique
2. **Dashboard en point d'entrée** : Vue d'ensemble + guidage
3. **Séparation responsabilités** : 1 onglet = 1 étape workflow
4. **Messages prérequis** : Blocage explicite si prérequis manquants
5. **Guidage contextuel** : "Prochaine étape" dans chaque onglet
6. **Boucle itérative visible** : Tuning → Tests clairement lié

---

## 📐 Détails de la décision

### 1. Dashboard (nouveau)

**Rôle** : Point d'entrée, vue d'ensemble, guidage

**Contenu** :
- Progression globale (0-100%)
- État workflow par étape (✅ fait, ⚠️ incomplet, ❌ manquant)
- Recommandation "Prochaine action" avec lien direct
- Statistiques clés (nombre chartes, tests, Kappa moyen)
- Meilleure charte highlight

**Calcul progression** :
```typescript
const weights = {
  goldCreated: 0.15,      // 15% : Gold standard existe
  chartesCreated: 0.15,   // 15% : Au moins 1 charte créée
  allAssociated: 0.20,    // 20% : Toutes chartes associées
  testsRun: 0.25,         // 25% : Tests effectués
  disagreementsValidated: 0.25, // 25% : Désaccords validés
};

progress = Σ(weight_i × score_i) × 100
```

**Exemple affichage** :
```
PROGRESSION GLOBALE: 65%

WORKFLOW LEVEL 0
✅ 1. Gold standard créé (thomas_audio_y)
✅ 2. Chartes créées (3)
⚠️ 3. Associations incomplètes (1/3)
   → [Aller associer CharteY_C]
✅ 4. Tests effectués (5)
⚠️ 5. Désaccords à valider (8 restants)

PROCHAINE ACTION RECOMMANDÉE
💡 Valider les 8 désaccords de CharteY_A
[Aller à Validation]
```

---

### 2. Onglet 1️⃣ Gold Standards

**Rôle** : Créer/Gérer UNIQUEMENT les gold standards

**Changements** :
- ❌ RETIRER : Section "Association chartes ↔ gold" (va en onglet 3)
- ✅ AJOUTER : Message "Prochaine étape → Créer chartes"
- ✅ AJOUTER : Explication rôle gold standard pour nouveaux utilisateurs

**Contenu** :
```
1️⃣ GOLD STANDARDS - Vérité Terrain

Gold standards disponibles pour Variable Y :
┌────────────────────────────────────────┐
│ thomas_audio_y │ Audio │ 150 pairs │ [✏️]│
│ thomas_text_y  │ Texte │ 150 pairs │ [✏️]│
└────────────────────────────────────────┘

[➕ Créer par dérivation] [➕ Créer vide]

ℹ️ Un gold standard = vos annotations manuelles
   de référence pour cette variable

PROCHAINE ÉTAPE
→ Créer des chartes pour tester formulations
[Aller à Chartes]
```

---

### 3. Onglet 2️⃣ Chartes

**Rôle** : Créer/Éditer/Dupliquer chartes

**Changements** :
- ✅ DÉPLACER : Bouton "Créer Nouvelle Charte" depuis header vers cet onglet
- ✅ AJOUTER : Colonne "Gold" (✅ associé, ⚠️ non associé)
- ✅ AJOUTER : Message "Prochaine étape → Associer"
- ✅ INTÉGRER : DuplicateCharteButton dans colonne Actions

**Contenu** :
```
2️⃣ CHARTES - Formulations de Prompts

[➕ Créer Nouvelle Charte]  ← ICI (plus dans header)

Chartes pour Variable Y :
┌──────────────────────────────────────────┐
│ Nom   │ Version │ Philo  │ Gold │ Actions│
├──────────────────────────────────────────┤
│ Y_A   │ 1.0.0   │ Minimal│ ✅   │[✏️][📋]│
│ Y_B   │ 1.2.0   │ Enrichi│ ✅   │[✏️][📋]│
│ Y_C   │ 1.0.0   │ Binaire│ ⚠️   │[✏️][📋]│
└──────────────────────────────────────────┘

⚠️ CharteY_C n'a pas de gold associé

PROCHAINE ÉTAPE
→ Associer vos chartes aux gold standards
[Aller à Association]
```

---

### 4. Onglet 3️⃣ Association (NOUVEAU)

**Rôle** : Associer charte ↔ gold standard AVANT de tester

**Rationale** :
- Impossible de tester sans savoir quel gold comparer
- Étape critique souvent oubliée
- Mérite onglet dédié (clarté workflow)

**Contenu** :
```
3️⃣ ASSOCIATION CHARTES ↔ GOLD STANDARDS

⚠️ Pour tester une charte, elle doit être associée

┌──────────────────────────────────────────┐
│ Charte│ Gold Standard    │ Statut│ Action│
├──────────────────────────────────────────┤
│ Y_A   │ thomas_audio_y ▼ │ ✅    │ [✓]  │
│ Y_B   │ thomas_audio_y ▼ │ ✅    │ [✓]  │
│ Y_C   │ [Sélectionner ▼] │ ⚠️    │ [✓]  │
└──────────────────────────────────────────┘

PROCHAINE ÉTAPE
→ Tester vos chartes pour mesurer performance
[Aller à Tests]
```

**Implémentation** :
```typescript
// Nouveau service ou dans CharteManagementService
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

### 5. Onglet 4️⃣ Tests

**Rôle** : Lancer tests et analyser résultats

**Changements** :
- ❌ RETIRER : Sélection variable (redondant avec header)
- ✅ AJOUTER : Message prérequis en vert si OK
- ✅ AJOUTER : Lien direct "Valider" si désaccords
- ✅ SIMPLIFIER : Configuration test

**Contenu** :
```
4️⃣ TESTS - Évaluation Performance

LANCER UN NOUVEAU TEST
┌────────────────────────────────────────┐
│ Charte : [CharteY_B ▼]                │
│ Échantillon : [100 paires aléatoires] │
│                                        │
│ ✅ Prérequis OK :                     │
│    • Gold standard associé            │
│    • Échantillon disponible           │
│                                        │
│ [🚀 Lancer Test]                      │
└────────────────────────────────────────┘

RÉSULTATS SAUVEGARDÉS
┌────────────────────────────────────────┐
│ Date │ Charte│ Kappa│ Désaccords│Action│
├────────────────────────────────────────┤
│ 27/12│ Y_B   │ 0.85 │ 0        │✅    │
│ 27/12│ Y_A   │ 0.72 │ 8        │[Valider]│
└────────────────────────────────────────┘

⚠️ 8 désaccords à valider (CharteY_A)
[Aller à Validation]
```

---

### 6. Onglet 5️⃣ Validation

**Rôle** : Valider désaccords CAS A/B/C

**Changements** :
- ✅ AJOUTER : Explication CAS A/B/C
- ✅ AJOUTER : Lien direct vers Tuning si CAS B détectés
- ✅ GARDER : Interface validation actuelle (déjà bonne)

**Contenu** :
```
5️⃣ VALIDATION DÉSACCORDS - Analyse Erreurs

Tests avec désaccords :
┌────────────────────────────────────────┐
│ CharteY_A (27/12)│ 8 désaccords │[▶️]│
└────────────────────────────────────────┘

[Panel validation CAS A/B/C détaillé]

APRÈS VALIDATION
• CAS A (LLM correct) → Aucune action
• CAS B (LLM erreur) → Suggestions tuning
• CAS C (Ambigu) → Améliorer gold standard

✅ Validation terminée : 5 CAS B détectés
→ Tuner la charte pour corriger
[Aller à Tuning]
```

---

### 7. Onglet 6️⃣ Tuning

**Rôle** : Améliorer charte basé sur CAS B

**Changements** :
- ✅ AJOUTER : Select "Test source" pour contexte
- ✅ AJOUTER : Bouton "Retour à Tests" (boucle)
- ✅ GARDER : Suggestions automatiques (Sprint 5)

**Contenu** :
```
6️⃣ TUNING - Amélioration Continue

Charte : [CharteY_A ▼]
Test source : [27/12 - Kappa 0.72 ▼]

SUGGESTIONS AUTOMATIQUES (5 CAS B)

1. Ajouter alias "ok" → CLIENT_POSITIF
   Impact estimé : +0.05 Kappa
   [📋 Appliquer]

[✓ Appliquer toutes]

PROCHAINE ÉTAPE
→ Re-tester CharteY_A après modifications
[Retour à Tests]
```

---

### 8. Onglet 🔍 Audit

**Rôle** : Outil diagnostic qualité données

**Changements** : Aucun (déjà bon)

---

### 9. TabEmptyState (nouveau composant)

**Rôle** : Afficher messages prérequis manquants

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
  }[];
}
```

**Exemple utilisation** :
```tsx
{chartesWithGold.length === 0 ? (
  <TabEmptyState
    icon={<WarningIcon />}
    title="Aucune charte associée"
    message="Associez vos chartes à un gold standard"
    prerequisites={[
      { label: 'Gold standard créé', status: 'ok' },
      { label: 'Charte créée', status: 'ok' },
      { label: 'Association charte↔gold', status: 'missing' },
    ]}
    actions={[{
      label: 'Aller à Association',
      onClick: () => setCurrentTab('association'),
    }]}
  />
) : (
  <TestsPanel />
)}
```

---

## ✅ Conséquences

### Avantages

**UX améliorée** :
- ✅ **Navigation intuitive** : Ordre 1-6 naturel (vs zig-zag)
- ✅ **Guidage clair** : Messages "Prochaine étape" + liens directs
- ✅ **Prérequis explicites** : Blocage avant erreur (vs après)
- ✅ **Progression visible** : Dashboard montre où on en est
- ✅ **Charge cognitive réduite** : Workflow linéaire facile à mémoriser

**Performances estimées** :
- Temps workflow complet : ~8 min (vs 15 min, -47%)
- Nombre clics : ~12 clics (vs 25, -52%)
- Taux d'erreur : ~10% (vs 60%, -83%)
- Satisfaction : Élevée (guidage clair)

**Maintenabilité** :
- ✅ Séparation responsabilités claire (1 onglet = 1 étape)
- ✅ Ajout futures étapes facile (numérotation extensible)
- ✅ Code réutilisable (TabEmptyState, messages)

**Pédagogie** :
- ✅ Workflow scientifique explicite (vs implicite)
- ✅ Onboarding nouveaux utilisateurs facilité
- ✅ Documentation vivante (interface = process)

---

### Inconvénients

**Coûts implémentation** :
- ⚠️ Durée Sprint 6 : 7h30 → 10h (+2h30, +33%)
- ⚠️ 3 nouveaux composants (~850 lignes)
- ⚠️ Modifications 5+ composants existants
- ⚠️ Tests régression nécessaires

**Risques** :
- ⚠️ Utilisateurs habitués ancien ordre (migration)
- ⚠️ Plus d'onglets (8 vs 7, +14%)
- ⚠️ Complexité Dashboard (calcul progression)

**Limitations** :
- ⚠️ Workflow linéaire rigide (pas adapté utilisateurs experts)
- ⚠️ Comparateur Kappa intégré Dashboard (perte visibilité ?)

---

### Mitigation risques

**Migration utilisateurs** :
- ✅ Numérotation aide repérage
- ✅ Noms onglets conservés (Gold Standards, Chartes, etc.)
- ✅ Icônes identiques

**Utilisateurs experts** :
- ✅ Dashboard optionnel (peut aller direct à onglet désiré)
- ✅ Header global permet navigation rapide (variable, stats)
- ✅ Audit reste accessible rapidement

**Complexité Dashboard** :
- ✅ Calcul progression simple (somme pondérée)
- ✅ Données déjà disponibles (pas nouvelles queries)
- ✅ Cache possible si performance problème

---

## 🔄 Alternatives considérées

### Alternative 1 : Garder ordre actuel + Ajouter wizard

**Description** : Conserver 7 onglets actuels, ajouter wizard parcours guidé optionnel

**Avantages** :
- Moins de changements code
- Utilisateurs habitués pas perturbés
- Wizard pour nouveaux utilisateurs

**Inconvénients** :
- ❌ Ordre illogique reste
- ❌ Wizard = complexité additionnelle
- ❌ Prérequis toujours implicites
- ❌ Pas de vue d'ensemble

**Raison rejet** : Ne résout pas problème #6 (ordre illogique)

---

### Alternative 2 : Workflow lateral (sidebar)

**Description** : Sidebar persistante à gauche avec étapes 1-6

**Avantages** :
- Progression visible en permanence
- Espace main pour contenu
- Clic direct étape désirée

**Inconvénients** :
- ❌ Perte espace horizontal
- ❌ Complexité layout (responsive)
- ❌ Redondant avec tabs horizontaux
- ❌ Pas standard Material-UI

**Raison rejet** : Complexité layout > bénéfice marginal

---

### Alternative 3 : Stepper linéaire (wizard forcé)

**Description** : Workflow forcé étape par étape (pas de tabs)

**Avantages** :
- Guidage maximum
- Impossible sauter étapes
- UX débutants optimale

**Inconvénients** :
- ❌ Rigidité extrême (frustration experts)
- ❌ Impossible retour arrière
- ❌ Pas adapté workflow itératif (tuning → tests)
- ❌ Perte flexibilité

**Raison rejet** : Trop contraignant pour workflow recherche itératif

---

### Alternative 4 : Réorganiser sans numérotation

**Description** : Ordre logique mais sans numéros 1-6

**Avantages** :
- Ordre amélioré
- Moins "scolaire"

**Inconvénients** :
- ❌ Séquence moins explicite
- ❌ Pas de référence facile ("aller à étape 3")
- ❌ Guidage moins clair

**Raison rejet** : Numéros apportent clarté workflow sans inconvénient

---

## 📊 Métriques succès

### Objectifs mesurables

**UX** :
- [ ] Temps workflow complet < 10 min (vs 15 min, -33%)
- [ ] Taux d'erreur "gold pas associé" < 20% (vs 60%, -67%)
- [ ] Satisfaction utilisateur > 4/5 (questionnaire post-implémentation)

**Code** :
- [ ] Tous onglets implémentent TabEmptyState (100%)
- [ ] Dashboard affiche progression correcte (100% accuracy)
- [ ] Pas de régression tests existants (100% pass)

**Performance** :
- [ ] Calcul Dashboard < 200ms
- [ ] Navigation onglets < 100ms
- [ ] Pas de lag interface

---

## 📅 Plan implémentation

### Sprint 6 - Sessions 8-9

**Session 8 : Réorganisation (4h)** - Priorité HAUTE
1. Dashboard (45 min)
2. Onglet Association (45 min)
3. Réorganisation Level0Interface (30 min)
4. TabEmptyState (30 min)
5. Messages prérequis (30 min)
6. Amélioration onglets existants (1h)

**Session 9 : Polish (3h)** - Priorité MOYENNE
1. Intégration DuplicateCharteButton (1h)
2. Messages "Prochaine étape" (1h)
3. Polish UI (1h)

**Total Sprint 6** : 10h (vs 7h30 initial)

---

## 🔗 Références

### ADRs liés

- ADR-006 : Multi-Gold Standards Architecture (Sprint 4)
- ADR-007 : Prompt Structure Level 0 (Sprint 5)

### Documents projet

- `MISSION_SPRINT6_V2.md` : Mission complète Sprint 6
- `CURRENT_STATE_V2.md` : État actuel projet
- `ARCHITECTURE_LEVEL0_CONCEPTS_UX.md` : Concepts Level 0 (Sprint 5 Session 6)
- `SESSION_7_RECAP.md` : Session 7 Header + Création chartes

### Sessions

- Sprint 5 Session 6 : Identification problèmes ergonomiques
- Sprint 6 Session 7 : Header Global + Création chartes (3h) ✅
- Sprint 6 Session 8 : Réorganisation complète (4h) ⏳
- Sprint 6 Session 9 : Polish UI (3h) ⏳

---

## ✅ Décision finale

**Adopté** : Restructuration workflow linéaire Dashboard→1-6→Audit

**Approbation** :
- Thomas : ✅ Approuvé (2025-12-27)
- Claude : ✅ Recommandé

**Implémentation** :
- Date début : 2025-12-27 (Session 8)
- Date fin prévue : 2025-12-27 (Session 9)
- Status : 🟢 En cours (30% - Session 7 terminée)

**Révision** :
- Date prochaine révision : Post-Session 9
- Critères révision : Métriques UX, feedback utilisateur

---

**Supersedes** : Aucun (première architecture ergonomique formalisée)

**Superseded by** : N/A

**Status** : ✅ **ACCEPTÉ**

**Dernière mise à jour** : 2025-12-27
